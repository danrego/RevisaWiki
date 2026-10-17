"""Collect completed receipts bound to the exact current release files."""
from pathlib import Path
from collections import Counter
import hashlib
import json
import re
import ast

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.18.0'
CORE = 'RevisaWiki_v2_18_0.js'
COMPLETE = 'RevisaWiki_v2_18_0_completo.js'
DATA = 'RevisaWiki_v2_18_0_dados.js'
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
            name = item.get('file', item.get('name', item.get('bundle')))
            require(name in BUNDLES and name not in seen, 'Unknown or duplicate bundle identity')
            seen.add(name)
            require(all(item[key] == name for key in ['file','name','bundle'] if key in item), 'Conflicting bundle identity')
            require(not any(item.get(key) is True for key in ['helperInjected','helperPreview','injectedHelper']), 'A release test injected a helper into its runtime')
            hashes = [item[key] for key in ('sha256', 'runtimeSha256') if key in item]
            require(hashes, 'Bundle identity has no runtime hash')
            for digest in hashes:
                file_hash(name, digest, item.get('bytes'))
            for key in ('version', 'actualVersion', 'runtimeVersion'):
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

    if 'catalogSha256' in row:
        file_hash(DATA, row['catalogSha256'])
        forms.append('catalogSha256')
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
    require(row.get('helperOnly') is not True, 'A helper-only result is not complete pipeline QA')
    require(row.get('status') == 'passed', 'Receipt is not passed')
    require(not row.get('failures') and not row.get('failed') and not row.get('errors'), 'Receipt contains failures or errors')
    require(row.get('wikipediaWrites', 0) == 0, 'Receipt contains Wikipedia writes')
    if isinstance(row.get('cases'), list):
        for case in row['cases']:
            if isinstance(case, dict):
                require(case.get('passed') is not False and case.get('status') not in ('failed', 'error'),
                        'Receipt contains a failed case')
    return validate_runtime_binding(row, manifest, manifest_sha, expected_bundles)


def relative_file(root, value):
    require(isinstance(value, str) and value and not Path(value).is_absolute(), 'A receipt path must be portable and relative')
    path = root / value
    require('..' not in Path(value).parts and path.resolve().is_relative_to(root.resolve()), 'A receipt path leaves the checkout')
    require(path.is_file() and not path.is_symlink(), 'An explicit receipt file is missing or not ordinary')
    return path


def no_writes(row):
    require(row.get('status') == 'passed', 'Receipt is not passed')
    require(not row.get('failures') and not row.get('failed') and not row.get('errors'), 'Receipt contains failures or errors')
    require(row.get('wikipediaWrites', 0) == 0, 'Receipt contains Wikipedia writes')
    if isinstance(row.get('cases'), list):
        require(all(not isinstance(case, dict) or case.get('passed') is not False and
                    case.get('status') not in ('failed', 'error') for case in row['cases']), 'Receipt contains a failed case')


def required_finite_invocations(root):
    current=['prose_gap_cases','reference_layout_cases','citation_island_cases','source_coverage_cases','independent_cases']
    if (root/'src/v2_18/legacy_markup.js').is_file():
        current.append('legacy_markup_cases')
    paths=tuple('dist/2.18.0/'+name for name in BUNDLES)
    pair=tuple(sorted(BUNDLES))
    expected=[('tests/v218/'+name+'.cjs',paths,pair) for name in current]
    expected += [('tests/v218/previous.cjs',('v217',name),pair) for name in ['reference_table_cases','infobox_cases','independent_cases']]
    for bundle in BUNDLES:
        one=(bundle,)
        expected.append(('tests/v218/previous.cjs',('v217','alert_cases'),one))
        expected += [('tests/v218/previous.cjs',('v216',name),one) for name in ['transfer_cases','field_value_cases','integration_cases','independent_cases','release_adversarial']]
        expected += [('tests/v218/previous.cjs',(name,),one) for name in ['infobox_order_cases','field_syntax_cases','image_alt_cases','biography_lead_cases','retained_count_cases','independent_cases','adversarial_release','safeguard_cases','native_image_cases','reader_test','reader_native','reader_independent','template_test','style_test','identity_boundary']]
        expected += [('tests/v218/previous.cjs',('previous_release',name),one) for name in ['quote_alignment','prose_spacing','quote_native','spacing_native','nsrw_test','drug_fields','drug_import_fields','drug_composition_case','ui_report','spacing_independent']]
    require(len(expected)==len(set(expected)), 'Required finite execution contains duplicates')
    return expected


def validate_execution(row, manifest, manifest_sha, expected_bundles, root):
    no_writes(row)
    binding = validate_runtime_binding(row, manifest, manifest_sha, expected_bundles)
    runs = row.get('runs')
    require(isinstance(runs, list) and runs, 'Execution receipt contains no completed runs')
    if row.get('kind') == 'frozen-finite-release-execution':
        expected = required_finite_invocations(root)
        actual = [(run.get('suite'), tuple(run.get('args', [])), tuple(sorted(item.get('file', '') for item in run.get('bundles', [])))) for run in runs]
        require(len(actual) == len(expected) and len(set(actual)) == len(expected) and set(actual) == set(expected),
                'The final finite execution must contain the exact current, compatibility and historical suite invocations')
    cases = checks = 0
    covered = set()
    for run in runs:
        require(run.get('status') == 'passed' and run.get('exitCode') == 0 and run.get('sourceUnchanged') is True,
                'A finite execution failed or its runner changed')
        runner = relative_file(root, run.get('suite'))
        require(run.get('runnerSha256') == sha(runner.read_bytes()), 'A finite runner differs from the executed source')
        names = [item.get('file') for item in run.get('bundles', [])]
        require(names and len(names) == len(set(names)) and set(names) <= set(BUNDLES), 'A finite run has no exact current bundle context')
        validate_runtime_binding({'bundles': run['bundles']}, manifest, manifest_sha, names)
        covered.update(names)
        measured = run.get('result')
        require(isinstance(measured, dict), 'A finite execution has no completed result receipt')
        require(measured.get('status', 'passed') == 'passed' and not measured.get('failures') and not measured.get('failed') and not measured.get('errors'),
                'A completed finite result contains failures')
        require(measured.get('wikipediaWrites', 0) == 0, 'A completed finite result contains Wikipedia writes')
        require(measured.get('helperOnly') is not True, 'A helper-only result is not complete pipeline QA')
        if isinstance(measured.get('cases'), list):
            require(all(not isinstance(case, dict) or case.get('passed') is not False and case.get('status') not in ['failed', 'error'] for case in measured['cases']), 'A completed finite result contains a failed case')
        if run.get('suite')=='tests/v218/source_coverage_cases.cjs':
            inventory_raw=relative_file(root,'tests/v218/source_coverage_inventory.json').read_bytes()
            inventory=json.loads(inventory_raw)
            require(measured.get('originalPureExecution') is True, 'The complete source-rule audit did not replay its pinned original definitions')
            require(measured.get('inventorySha256')==sha(inventory_raw) and measured.get('recordedRules')==len(inventory.get('rules',[]))==241,
                    'The complete source-rule audit inventory is stale or incomplete')
            require(measured.get('sourceRevision')==inventory.get('sourceRevision'), 'The complete source-rule audit identifies a different original revision')
        if any(key in measured for key in ['bundles', 'runtimeSha256', 'bundleSha256', 'frozenFiles', 'runtimeFiles']):
            validate_runtime_binding(measured, manifest, manifest_sha, names)
        measured_cases = count(measured.get('cases', 0))
        require(measured_cases > 0, 'A finite invocation did not execute any actual cases')
        cases += measured_cases
        checks += count(measured.get('checks', measured.get('assertions', 0)))
    require(set(expected_bundles) <= covered, 'Finite runs do not cover the requested current bundles')
    return binding, cases, checks


def execution_attachments(file, row, manifest_sha, root):
    if row.get('kind') != 'frozen-finite-release-execution':
        return []
    def signature(result, envelope):
        return json.dumps([result, envelope], ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    expected = Counter(signature(run['result'], {'suite': run['suite'], 'runnerSha256': run['runnerSha256'],
                       'releaseManifestSha256': manifest_sha, 'bundles': run['bundles'], 'sourceUnchanged': True}) for run in row['runs'])
    actual, attachments = Counter(), []
    files = sorted(file.parent.rglob('bound_result.json'))
    require(len(files) == len(row['runs']), 'The finite execution must retain every original bound result receipt')
    for source in files:
        require(source.is_file() and not source.is_symlink() and source.resolve().is_relative_to(file.parent.resolve()), 'A raw finite receipt leaves its execution directory')
        raw = source.read_bytes()
        bound = json.loads(raw)
        envelope = bound.pop('execution', None)
        require(isinstance(envelope, dict), 'A raw finite result lacks its exact execution binding')
        actual[signature(bound, envelope)] += 1
        attachments.append({'file': str(source.relative_to(root)), 'sha256': sha(raw)})
    require(actual == expected, 'Raw finite receipts disagree with the executed results')
    # This historical CLI prints counts but keeps its exact executed bundle
    # identities in a separate, unchanged original report. Bind that evidence
    # as well as its stdout summary before claiming dual-bundle coverage.
    for run in row['runs']:
        if run.get('suite') == 'tests/v218/previous.cjs' and run.get('args') == ['v217', 'independent_cases']:
            source = file.parent / 'v217-independent_cases/independent_cases.json'
            require(source.is_file() and not source.is_symlink(), 'The historical independent bundle report is missing')
            raw = source.read_bytes()
            report = json.loads(raw)
            require(report.get('kind') == 'independent-composed-safe-repairs', 'The historical independent report has the wrong identity')
            validate_receipt(report, json.loads(relative_file(root, 'tests/expected_release_v2180.json').read_bytes()), manifest_sha, BUNDLES)
            require(report.get('runnerSha256') == sha(relative_file(root, 'tests/v217/independent_cases.cjs').read_bytes()), 'The historical independent report identifies a different original runner')
            require(count(report.get('cases', 0)) == report.get('caseCount') == count(run['result'].get('cases', 0)) and count(report.get('checks', 0)) == count(run['result'].get('checks', 0)), 'The historical independent report disagrees with its executed summary')
            require({case.get('bundle') for case in report['cases']} == set(BUNDLES), 'The historical independent cases did not cover both actual bundles')
            attachments.append({'file': str(source.relative_to(root)), 'sha256': sha(raw)})
    return attachments


def validate_verification(row, execution_bytes, execution, cases, checks, manifest, manifest_sha, root):
    no_writes(row)
    require(row.get('version') == VERSION and row.get('releaseManifestSha256') == manifest_sha and
            row.get('executionSha256') == sha(execution_bytes), 'Supplemental verification has stale execution or manifest bytes')
    require(row.get('invocations') == len(execution['runs']) and row.get('cases') == cases and row.get('checks') == checks,
            'Supplemental verification disagrees with executed counts')
    require(row.get('frozenSourcesUnchanged') is True and row.get('historicalSourcesUnchanged') is True,
            'Supplemental verification does not preserve all current and historical sources')
    require(row.get('networkRequests', 0) == 0 and row.get('privateLogsInPublicationTree') == 0,
            'Supplemental verification attempted network access or retained private logs')
    require(row.get('privateExecutionLogs') == 2 * len(execution['runs']), 'Supplemental verification has incomplete private log accounting')
    for field, count_field in [('sourceBindings', 'frozenSourceFilesVerified'), ('historicalSourceBindings', 'historicalSourceFilesVerified')]:
        bindings = row.get(field)
        require(isinstance(bindings, dict) and bindings and len(bindings) == row.get(count_field), 'Supplemental source inventory is incomplete')
        for filename, digest in bindings.items():
            require(digest == sha(relative_file(root, filename).read_bytes()), 'A verified current or historical source changed')
    required = {run['suite'] for run in execution['runs']} | {'tests/expected_release_v2180.json'} | {'dist/2.18.0/' + name for name in manifest['files']}
    require(required <= set(row['sourceBindings']), 'Supplemental verification omits an executed runner or runtime')
    require(type(row.get('historicalSourceReadsVerified')) is int and row['historicalSourceReadsVerified'] >= len(row['historicalSourceBindings']),
            'Supplemental historical read accounting is incomplete')


def validate_browser(row, manifest, manifest_sha, expected_bundles, root):
    no_writes(row)
    require(expected_bundles and set(expected_bundles) <= set(BUNDLES), 'Invalid native browser bundle context')
    require(row.get('browser') in ['chrome', 'firefox', 'safari'], 'Unknown native browser receipt')
    require(row.get('ownedSessionClosed') is True and row.get('safePages') is True, 'Native browser safety or owned-session cleanup is incomplete')
    require(not any(row.get(key, 0) for key in ['externalRequests', 'networkMutations', 'screenshots']), 'The native browser attempted a forbidden operation')
    require(not any(row.get(key) for key in ['runnerError', 'cleanupError', 'captureError']), 'The native browser run is incomplete')
    baseline = json.loads((root / 'tests/expected_release_v2160.json').read_bytes())
    adaptations = row.get('productionAdaptations')
    require(isinstance(adaptations, list) and adaptations, 'Native browser evidence has no executed source hashes')
    covered = set()
    for item in adaptations:
        label = item.get('bundle', '')
        require(isinstance(label, str) and label, 'Native browser source has no explicit identity')
        if ':' in label:
            owner, name = label.split(':', 1)
        else:
            name = label
            owner = 'current' if item.get('version') == VERSION and name in manifest['files'] else 'baseline' if item.get('version') == '2.16.0' and name in baseline['files'] else ''
        require(owner in ['baseline', 'current'], 'Unknown browser source role')
        files = baseline['files'] if owner == 'baseline' else manifest['files']
        require(name in files and item.get('runtimeSha256') == files[name]['sha256'], 'Stale or conflicting browser source hash')
        require(item.get('version') == ('2.16.0' if owner == 'baseline' else VERSION), 'Browser source version differs')
        require(item.get('editingLogicRewritten') is False, 'Production editing logic was rewritten in the browser')
        require(isinstance(item.get('adaptedSha256'), str) and re.fullmatch(r'[0-9a-f]{64}', item['adaptedSha256']), 'Missing adapted browser source hash')
        if owner == 'current':
            covered.add(name)
    require(set(expected_bundles) <= covered, 'Native browser evidence is missing a current bundle')
    if 'runnerSha256' in row:
        require(row['runnerSha256'] == sha((root / 'tests/v218/alert_ui_probe.cjs').read_bytes()), 'Native browser runner changed')
    return {'forms': ['native-browser-source-adaptations'], 'bundles': sorted(covered)}, count(row.get('cases', [])), count(row.get('checks', 0))


def validate_browser_binding(binding, report_bytes, row, manifest, manifest_sha, expected_bundles, root):
    no_writes(binding)
    require(binding.get('manifestSha256') == manifest_sha and binding.get('reportSha256') == sha(report_bytes), 'Native browser binding has stale manifest or report bytes')
    require(binding.get('browser') == row.get('browser') and binding.get('cases') == count(row.get('cases', [])) and
            binding.get('checks') == count(row.get('checks', 0)), 'Native browser binding disagrees with its actual report')
    require(binding.get('ownedSessionClosed') is True and binding.get('sourceMutated') is False, 'Native browser binding has incomplete cleanup or changed sources')
    require(not any(binding.get(key, 0) for key in ['externalRequests', 'screenshots', 'wikipediaWrites']), 'Native browser binding contains a forbidden operation')
    files = binding.get('files')
    require(isinstance(files, dict) and set(files) == set(BUNDLES) | {DATA}, 'Native browser binding has an incomplete source inventory')
    require(all(files[name] == manifest['files'][name] for name in files), 'Native browser binding identifies different runtime bytes')
    inputs = binding.get('inputs')
    required = {'tests/v218/alert_ui_probe.cjs', 'tests/v217/alert_cases.cjs', 'tests/v2130/browser/fixture.js',
                'tests/v2130/browser/fixture.html', 'tests/v261/browser/native_driver.cjs'}
    require(isinstance(inputs, dict) and required <= set(inputs), 'Native browser binding omits a required runner or fixture')
    for filename, digest in inputs.items():
        require(digest == sha(relative_file(root, filename).read_bytes()), 'A bound native browser runner or fixture changed')
    return {'forms': ['manifest-bound-native-browser-report'], 'bundles': sorted(expected_bundles)}


def build_source_modules(root):
    tree=ast.parse(relative_file(root,'scripts/build_v2180.py').read_text())
    patch=next(node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name=='patch')
    assignments=[node for node in ast.walk(patch) if isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id=='names' for target in node.targets)]
    require(len(assignments)==1,'The builder must declare one explicit helper list')
    helpers=list(ast.literal_eval(assignments[0].value))
    patches=[]
    for node in ast.walk(patch):
        if isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and node.func.id=='load_patch':
            require(len(node.args)==1 and isinstance(node.args[0],ast.Constant) and isinstance(node.args[0].value,str),'A builder patch must have one literal filename')
            patches.append(node.args[0].value)
    require(len(helpers)==len(set(helpers)) and len(patches)==len(set(patches)), 'A build source inventory is duplicated')
    return helpers,patches


def validate_rebuild_details(row, manifest, root):
    require(row.get('kind') == 'independent-isolated-reproducible-build' and row.get('temporaryDirectoryRemoved') is True,
            'The isolated reconstruction has no completed disposable build')
    require(row.get('networkRequests', 0) == row.get('currentRuntimeWrites', 0) == 0, 'The isolated reconstruction changed current files or used the network')
    catalogs = row.get('catalogs')
    require(isinstance(catalogs, list) and len(catalogs) == 8 and len({item.get('file') for item in catalogs}) == 8,
            'The reconstruction omits an archived catalog')
    for item in catalogs:
        name = item.get('file', '')
        require(name == Path(name).name and name.startswith('Catalogo_') and name.endswith('.json'), 'Unknown rebuilt catalog identity')
        raw = (root / 'dist/2.18.0' / name).read_bytes()
        require(item.get('byteIdentical') is True and item.get('nativeOldidsPreserved') is True and
                item.get('sha256') == sha(raw) and item.get('bytes') == len(raw), 'A rebuilt catalog changed')
    sources = row.get('inputFiles')
    require(isinstance(sources, list) and sources, 'The reconstruction has no source inventory')
    for item in sources:
        require(item.get('sha256') == sha(relative_file(root, item.get('file')).read_bytes()), 'A reconstruction input changed')
    helpers,patches=build_source_modules(root)
    require(row.get('sourceModules')==['src/v2_18/'+name for name in helpers], 'The reconstruction source-module inventory differs from the builder')
    recorded=row.get('patchModules')
    require(isinstance(recorded,list) and {item.get('file') for item in recorded}=={'src/v2_18/'+name for name in patches} and len(recorded)==len(patches), 'The reconstruction patch inventory differs from the builder')
    for item in recorded:
        require(item.get('sha256') == sha(relative_file(root, item.get('file')).read_bytes()), 'A reconstruction patch module changed')
    embedded = row.get('helperEmbedding')
    require(isinstance(embedded, list) and len(embedded)==2*len(helpers), 'The reconstruction omits an embedded helper')
    identities = set()
    for item in embedded:
        require(item.get('bundle') in BUNDLES and item.get('occurrences')==1 and item.get('source') in {'src/v2_18/'+name for name in helpers}, 'An embedded helper has no exact executable identity')
        original=relative_file(root,item.get('source')).read_bytes()
        expected=original.replace(b'2.17.0',b'2.18.0')
        require(item.get('sha256')==sha(original) and item.get('embeddedSha256')==sha(expected), 'An embedded helper source changed')
        require(item.get('versionLabelSubstitutions')==([['2.17.0','2.18.0']] if original!=expected else []), 'An embedded helper changed beyond the permitted distribution label')
        identities.add((item['bundle'],item['source']))
    require(identities=={(bundle,'src/v2_18/'+name) for bundle in BUNDLES for name in helpers}, 'An embedded helper receipt is missing or duplicated')


def validate_utility(row, specification, root):
    no_writes(row)
    require(row.get('toolQaOnly') is True and row.get('usesActualCorpus') is False, 'Utility receipt is not explicitly synthetic tool QA')
    require(row.get('networkRequests', 0) == 0, 'Utility tests attempted a network operation')
    require(not row.get('errors') and not row.get('skipped'), 'Utility tests contain errors or unexecuted cases')
    sources = specification.get('sourceBindings')
    require(isinstance(sources, dict) and sources, 'Utility receipt has no explicit tested-source bindings')
    for field, filename in sources.items():
        require(row.get(field) == sha(relative_file(root, filename).read_bytes()), 'A utility source differs from its executed hash')
    return {'forms': ['synthetic-tool-only'], 'bundles': []}, count(row.get('cases', 0)), count(row.get('checks', 0))


def portuguese_number(value):
    return f'{value:,}'.replace(',', '.')


def collect(root=ROOT):
    """Read an explicit QA_INPUTS.json allowlist and completed current receipts.

    Required plan envelope, with paths relative to the checkout:
    {"schema":1,"version":"2.18.0","releaseManifestSha256":"<exact hash>",
     "groups":[{"label":"Casos finitos","receipts":[
       {"file":"artifacts/v2180/final/execution.json","kind":"execution",
        "verification":"artifacts/v2180/final/verification.json",
        "expectedBundles":["RevisaWiki_v2_18_0.js","RevisaWiki_v2_18_0_completo.js"]}]}],
     "corpus":"artifacts/v2180/corpus_aggregate.json",
     "provenance":["src/v2_17/infobox_contract_review.json"]}

    A final execution entry also requires its explicit verification JSON path.
    Other receipt kinds are runtime, browser and utility. A browser entry
    requires its explicit binding JSON path. A utility requires sourceBindings mapping its recorded hash fields to tested source files.
    Native provenance is metadata only and never inflates executed test totals.
    """
    out = root / 'artifacts/v2180'
    raw = (root / 'tests/expected_release_v2180.json').read_bytes()
    manifest = json.loads(raw)
    manifest_sha = sha(raw)
    require(manifest.get('version') == VERSION, 'Unexpected release manifest version')
    for name, pin in manifest['files'].items():
        current = (root / 'dist' / VERSION / name).read_bytes()
        require(len(current) == pin['bytes'] and sha(current) == pin['sha256'], 'Current runtime differs from manifest: ' + name)
    plan_path = relative_file(root, 'artifacts/v2180/QA_INPUTS.json')
    plan_raw = plan_path.read_bytes()
    plan = json.loads(plan_raw)
    require(plan.get('schema') == 1 and plan.get('version') == VERSION, 'Unknown QA input envelope')
    require(plan.get('releaseManifestSha256') == manifest_sha, 'QA input envelope identifies a stale manifest')
    groups, receipts, provenance = [], [], []
    specifications = plan.get('groups')
    require(isinstance(specifications, list) and specifications, 'QA input envelope contains no receipt groups')
    used = set()
    for specification in specifications:
        require(isinstance(specification.get('label'), str) and specification['label'].strip(), 'A QA group has no label')
        entries = specification.get('receipts')
        require(isinstance(entries, list) and entries, 'A QA group contains no receipts')
        cases = checks = 0
        for entry in entries:
            file = relative_file(root, entry.get('file'))
            require(str(file.relative_to(root)) not in used, 'A receipt is counted twice')
            used.add(str(file.relative_to(root)))
            data = file.read_bytes()
            row = json.loads(data)
            kind = entry.get('kind', 'runtime')
            expected = entry.get('expectedBundles', list(BUNDLES))
            additional = []
            if kind == 'execution':
                binding, row_cases, row_checks = validate_execution(row, manifest, manifest_sha, expected, root)
                additional = execution_attachments(file, row, manifest_sha, root)
                if row.get('kind') == 'frozen-finite-release-execution':
                    verification_path = relative_file(root, entry.get('verification'))
                    verification_raw = verification_path.read_bytes()
                    validate_verification(json.loads(verification_raw), data, row, row_cases, row_checks, manifest, manifest_sha, root)
                    additional.append({'file': str(verification_path.relative_to(root)), 'sha256': sha(verification_raw)})
            elif kind == 'browser':
                binding, row_cases, row_checks = validate_browser(row, manifest, manifest_sha, expected, root)
                binding_path = relative_file(root, entry.get('binding'))
                binding_raw = binding_path.read_bytes()
                binding = validate_browser_binding(json.loads(binding_raw), data, row, manifest, manifest_sha, expected, root)
                additional.append({'file': str(binding_path.relative_to(root)), 'sha256': sha(binding_raw)})
            elif kind == 'utility':
                binding, row_cases, row_checks = validate_utility(row, entry, root)
            else:
                require(kind == 'runtime', 'Unknown QA receipt kind')
                binding = validate_receipt(row, manifest, manifest_sha, expected)
                row_cases, row_checks = count(row.get('cases', 0)), count(row.get('checks', row.get('assertions', 0)))
                if row.get('kind') == 'independent-isolated-reproducible-build':
                    validate_rebuild_details(row, manifest, root)
            cases += row_cases
            checks += row_checks
            receipts.append({'file': str(file.relative_to(root)), 'sha256': sha(data), 'runtimeBinding': binding, 'kind': kind, 'additionalEvidence': additional})
        groups.append({'label': specification['label'], 'cases': cases, 'checks': checks, 'status': 'passed'})
    corpus_path = relative_file(root, plan.get('corpus', 'artifacts/v2180/corpus_aggregate.json'))
    corpus_data = corpus_path.read_bytes()
    corpus = json.loads(corpus_data)
    require(corpus.get('phase') == 'final' and corpus.get('status') in ['passed', 'passed-with-preexisting-findings'], 'Corpus is incomplete')
    require(corpus['completedPages'] == corpus['verifiedSourcePages'] == corpus['eligiblePages'] == corpus['plannedPages'], 'Corpus coverage is incomplete')
    require(corpus['newFailures'] == corpus['baselineAlsoFailsDifferentEvidence'] == 0, 'Corpus contains regressions')
    require(corpus['failures'] == corpus['preexistingExactFailures'], 'Corpus failures are not baseline-identical')
    require(corpus.get('wikipediaWrites', 0) == corpus.get('networkRequests', 0) == 0, 'Corpus contains network writes or requests')
    binding = validate_runtime_binding(corpus, manifest, manifest_sha, BUNDLES)
    receipts.append({'file': str(corpus_path.relative_to(root)), 'sha256': sha(corpus_data), 'runtimeBinding': binding, 'kind': 'corpus'})
    groups.append({'label': 'Páginas reais do corpus completo', 'cases': count(corpus['completedPages']), 'checks': count(corpus['checks']),
                   'status': corpus['status'], 'preexistingFindings': corpus['preexistingExactFailures']})
    require('alertReduction' not in corpus, 'This corpus did not measure a baseline alert reduction')
    parity=corpus.get('reviewParity')
    require(isinstance(parity,dict) and set(parity)=={'checkedPages','unavailablePages','matched','baselineAlertComparisonMeasured'}, 'Corpus review parity coverage is incomplete')
    require(type(parity['checkedPages']) is int and type(parity['unavailablePages']) is int and parity['checkedPages']>=0 and parity['unavailablePages']>=0 and parity['checkedPages']+parity['unavailablePages']==corpus['completedPages'] and parity['matched'] is True and parity['baselineAlertComparisonMeasured'] is False, 'Corpus review parity coverage differs')
    if manifest.get('baseManifestSha256'):
        previous_raw=relative_file(root,'tests/expected_release_v2170.json').read_bytes()
        require(sha(previous_raw)==manifest['baseManifestSha256'],'Corpus baseline manifest differs from the build baseline')
        previous=json.loads(previous_raw)['files']
        require(corpus.get('baselineRuntimeSha256')=={'baseline':previous['RevisaWiki_v2_17_0.js']['sha256'],'baselineComplete':previous['RevisaWiki_v2_17_0_completo.js']['sha256']}, 'Corpus failure baseline differs from the pinned previous release')
    for filename in plan.get('provenance', []):
        file = relative_file(root, filename)
        require(file.suffix == '.json', 'Only explicit JSON native provenance may be published')
        value = json.loads(file.read_bytes())
        require(value.get('wikipediaWrites', 0) == 0, 'Native provenance contains Wikipedia writes')
        provenance.append({'file': filename, 'sha256': sha(file.read_bytes()), 'metadataOnly': True})
    redirects = corpus.get('recognizedRedirectPages')
    redirect_note = ''
    if redirects is not None:
        require(type(redirects) is int and 0 <= redirects <= corpus['completedPages'], 'Invalid redirect count')
        require(redirects + corpus['pagesWithoutRecognizedRedirect'] == corpus['completedPages'], 'Redirect coverage differs')
        redirect_note = ' O conjunto inclui ' + portuguese_number(redirects) + ' redirecionamentos reconhecidos, contados separadamente no relatório.'
    browsers = {json.loads((root / item['file']).read_bytes()).get('browser') for item in receipts if item['kind'] == 'browser'}
    browser_note = ' pelos testes locais no Chrome, no Firefox e no Safari' if browsers == {'chrome', 'firefox', 'safari'} else ' pelas verificações locais listadas no relatório'
    summary = ('Os arquivos finais da versão 2.18.0 passaram pelos casos de reparo, pelas regressões e' + browser_note + '. ' +
               'A conferência das páginas reais cobriu ' + portuguese_number(corpus['completedPages']) + ' páginas acessíveis do domínio principal, incluindo ' +
               portuguese_number(corpus['biographyBoxesConfirmed']) + ' com infocaixas pessoais reconhecidas.' + redirect_note +
               ' Todas as páginas elegíveis do histórico coletado entraram nos testes, mesmo sem uma infocaixa reconhecida. Foram conferidos os resultados das duas distribuições, a repetição da execução e as proteções de conteúdo, sem regressões novas nesse corpus. Os títulos e os detalhes do histórico ficaram locais. Os casos sintéticos e suas execuções repetidas são contados separadamente dos artigos. Nenhum teste editou a Wikipédia.')
    if corpus['preexistingExactFailures']:
        summary += ' O verificador independente registrou ' + portuguese_number(corpus['preexistingFindingPages']) + ' páginas com avisos que se repetiram de forma idêntica na versão anterior. Esses avisos permanecem separados das regressões novas no relatório.'
    return {'version': VERSION, 'status': corpus['status'], 'newFailures': 0, 'preexistingExactFindings': corpus['preexistingExactFailures'],
            'releaseManifestSha256': manifest_sha, 'frozenFiles': manifest['files'], 'qaInputsSha256': sha(plan_raw),
            'groups': groups, 'receipts': receipts, 'provenance': provenance, 'portugueseSummary': summary, 'reviewParity': parity,
            'wikipediaWrites': 0, 'accountAccess': False, 'corpusIncludesPrivateTitles': False}


def main():
    result = collect()
    path = ROOT / 'artifacts/v2180/QA_SUMMARY.json'
    temporary = path.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)
    print(json.dumps({'status': result['status'], 'groups': result['groups']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
