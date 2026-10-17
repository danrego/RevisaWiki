"""Collect completed receipts bound to the exact current release files."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.16.0'
CORE = 'RevisaWiki_v2_16_0.js'
COMPLETE = 'RevisaWiki_v2_16_0_completo.js'
DATA = 'RevisaWiki_v2_16_0_dados.js'
BUNDLES = (CORE, COMPLETE)


def sha(value):
    return hashlib.sha256(value).hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def count(value):
    result = len(value) if isinstance(value, list) else value
    require(type(result) is int and result >= 0, 'Invalid receipt count')
    return result


def validate_runtime_binding(row, manifest, manifest_sha, expected_bundles):
    """Reject stale, absent, conflicting or partial runtime evidence.

    A scalar hash needs the caller's single-bundle context. Named evidence must
    identify the current file, and every recorded hash is checked, including
    additional evidence formats in the same receipt. Baseline hashes never count
    as release evidence.
    """
    files = manifest['files']
    expected = set(expected_bundles)
    require(expected and expected <= set(BUNDLES), 'Invalid expected bundle context')
    covered = set()
    forms = []
    if 'version' in row:
        require(row['version'] == VERSION, 'Receipt version differs from release')

    def file_hash(name, digest, byte_count=None):
        require(name in files, 'Unknown receipt runtime file')
        require(digest == files[name]['sha256'], 'Stale or conflicting runtime hash: ' + name)
        if byte_count is not None:
            require(type(byte_count) is int and byte_count == files[name]['bytes'],
                    'Runtime byte count differs: ' + name)
        if name in BUNDLES:
            covered.add(name)

    def scalar(digest, form):
        require(len(expected) == 1, 'Scalar runtime hash requires one expected bundle')
        file_hash(next(iter(expected)), digest)
        forms.append(form)

    if 'bundles' in row:
        items = row['bundles']
        require(isinstance(items, list) and items, 'Missing bundle identities')
        seen = set()
        for item in items:
            require(isinstance(item, dict), 'Invalid bundle identity')
            name = item.get('file', item.get('name'))
            require(name in BUNDLES and name not in seen, 'Unknown or duplicate bundle identity')
            seen.add(name)
            require('file' not in item or 'name' not in item or item['file'] == item['name'],
                    'Conflicting bundle identity')
            hashes = [item[key] for key in ('sha256', 'runtimeSha256') if key in item]
            require(hashes, 'Bundle identity has no runtime hash')
            for digest in hashes:
                file_hash(name, digest, item.get('bytes'))
            for key in ('version', 'actualVersion'):
                if key in item:
                    require(item[key] == VERSION, 'Bundle version differs from release')
            if 'catalogSha256' in item:
                file_hash(DATA, item['catalogSha256'])
        forms.append('bundles')

    if 'runtimeSha256' in row:
        value = row['runtimeSha256']
        if isinstance(value, dict):
            require(set(value) == {'core', 'complete'}, 'Incomplete named runtime pair')
            file_hash(CORE, value['core'])
            file_hash(COMPLETE, value['complete'])
            forms.append('runtimeSha256-pair')
        else:
            scalar(value, 'runtimeSha256')
    if 'bundleSha256' in row:
        scalar(row['bundleSha256'], 'bundleSha256')

    for key in ('releaseManifestSha256', 'manifestSha256'):
        if key in row:
            require(row[key] == manifest_sha, 'Stale release manifest hash')
            forms.append(key)
            require('frozenFiles' in row or 'runtimeFiles' in row,
                    'Manifest hash has no file inventory')
    if 'frozenFiles' in row:
        require('releaseManifestSha256' in row or 'manifestSha256' in row,
                'Frozen files have no manifest hash')
        require(row['frozenFiles'] == files, 'Frozen file inventory differs from release')
        covered.update(BUNDLES)
        forms.append('frozenFiles')
    if 'runtimeFiles' in row:
        require('releaseManifestSha256' in row or 'manifestSha256' in row,
                'Rebuilt files have no manifest hash')
        items = row['runtimeFiles']
        require(isinstance(items, list) and len(items) == len(files), 'Incomplete rebuilt file inventory')
        seen = set()
        for item in items:
            name = item.get('file')
            require(name in files and name not in seen, 'Unknown or duplicate rebuilt file')
            seen.add(name)
            require(item.get('byteIdentical') is True, 'Rebuilt runtime is not byte-identical')
            require(type(item.get('bytes')) is int, 'Rebuilt runtime has no byte count')
            file_hash(name, item.get('sha256'), item.get('bytes'))
        require(seen == set(files), 'Incomplete rebuilt file identities')
        forms.append('runtimeFiles')

    require(forms and expected <= covered, 'Receipt has no complete current runtime binding')
    if 'productionAdaptations' in row:
        items = row['productionAdaptations']
        require(isinstance(items, list) and items, 'Missing production adaptation evidence')
        seen = set()
        for item in items:
            name = item.get('file')
            require(name in BUNDLES and name not in seen, 'Invalid adapted runtime identity')
            seen.add(name)
            file_hash(name, item.get('sourceSha256'))
            require(item.get('editingLogicRewritten') is False, 'Production editing logic was adapted')
        require(expected <= seen, 'Incomplete production adaptation evidence')
        require(forms, 'Adaptation record has no execution runtime binding')

    return {'forms': forms, 'bundles': sorted(covered)}


def validate_receipt(row, manifest, manifest_sha, expected_bundles):
    require(row.get('status') == 'passed', 'Receipt is not passed')
    require(not row.get('failures') and not row.get('failed'), 'Receipt contains failures')
    require(row.get('wikipediaWrites', 0) == 0, 'Receipt contains Wikipedia writes')
    if isinstance(row.get('cases'), list):
        for case in row['cases']:
            if isinstance(case, dict):
                require(case.get('passed') is not False and case.get('status') not in ('failed', 'error'),
                        'Receipt contains a failed case')
    return validate_runtime_binding(row, manifest, manifest_sha, expected_bundles)


def collect(root=ROOT):
    out = root / 'artifacts/v2160'
    raw = (root / 'tests/expected_release_v2160.json').read_bytes()
    manifest = json.loads(raw)
    manifest_sha = sha(raw)
    require(manifest.get('version') == VERSION, 'Unexpected release manifest version')
    for name, pinned in manifest['files'].items():
        current = (root / 'dist' / VERSION / name).read_bytes()
        require(len(current) == pinned['bytes'] and sha(current) == pinned['sha256'],
                'Current runtime differs from manifest: ' + name)
    groups, receipts = [], []

    def read(file, expected_bundles):
        data = file.read_bytes()
        row = json.loads(data)
        binding = validate_receipt(row, manifest, manifest_sha, expected_bundles)
        receipts.append({'file': str(file.relative_to(root)), 'sha256': sha(data), 'runtimeBinding': binding})
        return row

    def group(label, files):
        cases = checks = 0
        for file, expected in files:
            row = read(file, expected)
            cases += count(row.get('cases', 0))
            checks += count(row.get('checks', 0))
        groups.append({'label': label, 'cases': cases, 'checks': checks, 'status': 'passed'})

    modes = [('modular', CORE), ('complete', COMPLETE)]
    new_names = ['transfer_cases','field_value_cases','integration_cases','independent_cases','release_adversarial']
    group('Regras novas e casos que devem permanecer intactos',
          [(out / 'final_media' / mode / (('field_values' if name=='field_value_cases' else name) + '.json'), [bundle]) for mode, bundle in modes for name in new_names])
    focused_previous = ['infobox_order_cases','field_syntax_cases','image_alt_cases','biography_lead_cases',
                        'retained_count_cases','independent_cases','adversarial_release','safeguard_cases','native_image_cases']
    previous_filenames = {'field_syntax_cases':'field_syntax'}
    group('Regras biográficas e de infocaixas da versão anterior',
          [(out / 'final_media' / mode / ('previous-'+name) / (previous_filenames.get(name,'result')+'.json'), [bundle])
           for mode,bundle in modes for name in focused_previous])
    previous = ['reader_test', 'reader_native', 'reader_independent', 'template_test', 'style_test',
                'identity_boundary', 'quote_alignment', 'prose_spacing', 'quote_native', 'spacing_native',
                'nsrw_test', 'drug_fields', 'drug_import_fields', 'drug_composition_case', 'ui_report', 'spacing_independent']
    previous_files = {'reader_test':'result', 'reader_native':'result', 'reader_independent':'result',
        'template_test':'template_definition', 'style_test':'style', 'identity_boundary':'result',
        'quote_alignment':'quote_alignment', 'prose_spacing':'prose_spacing', 'quote_native':'quote_native',
        'spacing_native':'spacing_native', 'nsrw_test':'nsrw_native_citation', 'drug_fields':'drug_fields',
        'drug_import_fields':'drug_import_fields', 'drug_composition_case':'drug_composition_case',
        'ui_report':'ui_report', 'spacing_independent':'spacing_independent'}
    group('Regressões finitas das versões anteriores',
          [(out / 'final_media' / mode / name / (previous_files[name] + '.json'), [bundle])
           for mode, bundle in modes for name in previous])
    group('Interface nos navegadores Chrome, Firefox e Safari',
          [(out / 'biography_ui' / browser / 'biography_ui.json', BUNDLES) for browser in ['chrome', 'firefox', 'safari']])
    group('Virada do dia e contagem de alterações mantidas', [(out / 'clock_retained.json', BUNDLES)])
    rebuild = read(out / 'rebuild.json', BUNDLES)
    groups.append({'label':'Reconstrução independente', 'cases':1, 'checks':count(rebuild['checks']), 'status':'passed'})
    tool_path = out / 'aggregate_test.json'
    tool_raw = tool_path.read_bytes()
    tool = json.loads(tool_raw)
    require(tool.get('status') == 'passed' and tool.get('toolQaOnly') is True and tool.get('usesActualCorpus') is False,
            'The corpus utility tests are not completed synthetic checks')
    require(tool.get('wikipediaWrites', 0) == 0 and tool.get('networkRequests', 0) == 0,
            'The utility test attempted a network operation')
    require(tool['runnerSha256'] == sha((root / 'tests/v216/aggregate_corpus_test.py').read_bytes()),
            'The corpus utility test runner changed')
    require(tool['aggregateUtilitySha256'] == sha((root / 'scripts/aggregate_corpus_v2160.py').read_bytes()),
            'The tested corpus utility changed')
    receipts.append({'file':str(tool_path.relative_to(root)), 'sha256':sha(tool_raw), 'toolQaOnly':True,
                     'runtimeBinding':{'forms':['synthetic-tool-only'], 'bundles':[]}})
    groups.append({'label':'Privacidade e conferência do agregador', 'cases':count(tool['cases']),
                   'checks':count(tool.get('checks', tool['cases'])), 'status':'passed'})
    corpus_path = out / 'corpus_aggregate.json'
    corpus_data = corpus_path.read_bytes()
    corpus = json.loads(corpus_data)
    require(corpus['phase'] == 'final' and corpus['status'] in ['passed', 'passed-with-preexisting-findings'], 'Corpus is incomplete')
    require(corpus['completedPages'] == corpus['verifiedSourcePages'] == corpus['eligiblePages'] == corpus['plannedPages'], 'Corpus coverage is incomplete')
    require(corpus['newFailures'] == corpus['baselineAlsoFailsDifferentEvidence'] == 0, 'Corpus contains regressions')
    require(corpus['failures'] == corpus['preexistingExactFailures'], 'Corpus failures are not baseline-identical')
    require(corpus.get('wikipediaWrites', 0) == 0, 'Corpus contains Wikipedia writes')
    binding = validate_runtime_binding(corpus, manifest, manifest_sha, BUNDLES)
    receipts.append({'file':str(corpus_path.relative_to(root)), 'sha256':sha(corpus_data), 'runtimeBinding':binding})
    groups.append({'label':'Páginas reais do corpus completo', 'cases':count(corpus['completedPages']), 'checks':count(corpus['checks']), 'status':corpus['status'], 'preexistingFindings':corpus['preexistingExactFailures']})
    pages = f"{corpus['completedPages']:,}".replace(',', '.')
    biographies = f"{corpus['biographyBoxesConfirmed']:,}".replace(',', '.')
    redirects = corpus.get('recognizedRedirectPages')
    if redirects is not None:
        require(isinstance(redirects, int) and 0 <= redirects <= corpus['completedPages'], 'Invalid redirect count')
        require(redirects + corpus['pagesWithoutRecognizedRedirect'] == corpus['completedPages'], 'Redirect coverage differs')
    redirect_note = f"O conjunto inclui {redirects} redirecionamentos reconhecidos, contados separadamente no relatório. " if redirects is not None else ''
    summary = (f"Os arquivos finais da versão 2.16.0 passaram pelos casos de reparo, pelas regressões e pelos testes locais no Chrome, no Firefox e no Safari. "
               f"A conferência das páginas reais cobriu {pages} páginas acessíveis do domínio principal, incluindo {biographies} com infocaixas pessoais reconhecidas. " + redirect_note +
               "Todas as páginas elegíveis do histórico coletado entraram nos testes, mesmo sem uma infocaixa reconhecida. Foram conferidos os resultados das duas distribuições, a repetição da execução e as proteções de conteúdo, sem regressões novas nesse corpus. "
               "Os títulos e os detalhes do histórico ficaram locais. Os casos sintéticos e suas execuções repetidas são contados separadamente dos artigos. Nenhum teste editou a Wikipédia.")
    if corpus['preexistingExactFailures']:
        summary += f" O verificador independente registrou {corpus['preexistingFindingPages']} páginas com avisos que se repetiram de forma idêntica na versão anterior. Esses avisos permanecem separados das regressões novas no relatório."
    return {'version':VERSION, 'status':corpus['status'], 'newFailures':0, 'preexistingExactFindings':corpus['preexistingExactFailures'], 'releaseManifestSha256':manifest_sha, 'frozenFiles':manifest['files'],
            'groups':groups, 'receipts':receipts, 'portugueseSummary':summary, 'wikipediaWrites':0,
            'accountAccess':False, 'corpusIncludesPrivateTitles':False}


def main():
    result = collect()
    path = ROOT / 'artifacts/v2160/QA_SUMMARY.json'
    temporary = path.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    temporary.replace(path)
    print(json.dumps({'status':result['status'], 'groups':result['groups']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
