"""Collect only completed QA of the frozen 2.15.0 runtime, without duplicate totals."""
from pathlib import Path
import argparse
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.15.0'
FINAL_PIN = '7525f04df70a28ce473d0bb9b747e3098931f24ef1e01a7820eb1795b8f84c24'
ACTUAL_NODE_PLAN = '5aa27964ebb0391ae98198a1345c33d0198b3aacafee337064c1c33d36d30953'
ACTUAL_NATIVE_PLAN = '5293439ea181ad122d27e4ba37ab4f3e248d70c64e9271c6ac6cd20961ce8cc4'
OUT = ROOT / 'artifacts/v2150'
RELEASE = OUT / 'release'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def local(path):
    path = Path(path)
    if not path.is_absolute():
        path = ROOT / path
    require(not path.is_symlink(), 'Symlink is not evidence: ' + str(path))
    path = path.resolve()
    require(path.is_relative_to(ROOT), 'Evidence is outside the repository')
    return path


def read(path):
    path = local(path)
    raw = path.read_bytes()
    return path, raw, json.loads(raw)


def number(value, label, positive=True):
    value = len(value) if isinstance(value, list) else value
    require(type(value) is int and value >= (1 if positive else 0), 'Invalid count: ' + label)
    return value


def zero_activity(value, label):
    for key in ('wikipediaWrites', 'actualWikipediaWrites', 'networkMutations', 'actualNetworkMutations',
                'clipboardWrites', 'screenshots', 'saveCalls', 'submits', 'nonGetRequests', 'forbiddenNetwork', 'networkRequests', 'remoteNetworkRequests'):
        if key in value:
            require(value[key] == 0 and value[key] is not True, label + ': nonzero ' + key)
    for key in ('accountAccess', 'accountUse', 'clipboardAccess'):
        if key in value:
            require(value[key] is False, label + ': ' + key)


class Evidence:
    def __init__(self):
        _, raw, self.manifest = read('tests/expected_release_v2150.json')
        require(sha(raw) == FINAL_PIN and self.manifest['version'] == VERSION, 'Final release pin changed')
        self.files = self.manifest['files']
        require(len(self.files) == 7, 'Expected seven frozen executable files')
        for name, expected in self.files.items():
            p = local('dist/2.15.0/' + name)
            data = p.read_bytes()
            require(len(data) == expected['bytes'] and sha(data) == expected['sha256'], 'Runtime changed: ' + name)
        self.runtime_hashes = {self.files[n]['sha256'] for n in ('RevisaWiki_v2_15_0.js', 'RevisaWiki_v2_15_0_completo.js')}
        self.records, self.groups, self.counted = {}, [], set()

    def record(self, path, role, counted=False, target=None):
        path, raw, value = read(path)
        rel = path.relative_to(ROOT).as_posix()
        if target is None:
            target = 'reports/' + path.relative_to(RELEASE).as_posix() if path.is_relative_to(RELEASE) else 'provenance/' + rel
        require(not Path(target).is_absolute() and '..' not in Path(target).parts, 'Invalid publication target')
        if rel not in self.records:
            self.records[rel] = {'report': rel, 'sha256': sha(raw), 'bytes': len(raw), 'role': role,
                                 'counted': counted, 'evidenceTarget': target}
        else:
            require(self.records[rel]['sha256'] == sha(raw), 'Evidence changed during aggregation')
            require(not (counted and self.records[rel]['counted']), 'Report counted twice: ' + rel)
            self.records[rel]['counted'] |= counted
        return value

    def validate(self, value, label, require_status=True, require_binding=True):
        require(value.get('version') == VERSION, label + ': wrong or missing version')
        if require_status:
            require(value.get('status') == 'passed', label + ': not passed')
        require(not value.get('failed') and not value.get('failures') and not value.get('runnerError') and not value.get('cleanupError'), label + ': failure recorded')
        zero_activity(value, label)
        bound = False
        for key in ('frozenFiles', 'releaseFiles'):
            if key in value:
                require(value[key] == self.files, label + ': wrong ' + key)
                bound = True
        for key in ('releaseManifestSha256', 'pinManifestSha256'):
            if key in value:
                require(value[key] == FINAL_PIN, label + ': wrong manifest')
                bound = True
        for key in ('runtimeSha256', 'bundleSha256', 'candidateSha256'):
            if key in value:
                require(value[key] in self.runtime_hashes, label + ': wrong runtime')
                bound = True
        for bundle in value.get('bundles', []):
            name = bundle['file']
            require(name in self.files and bundle['sha256'] == self.files[name]['sha256'], label + ': wrong bundle')
            require(bundle.get('version', VERSION) == VERSION, label + ': wrong bundle version')
            require(bundle['sha256'] in self.runtime_hashes, label + ': bundle is not executable runtime')
            bound = True
        if 'catalogSha256' in value:
            require(value['catalogSha256'] == self.files['RevisaWiki_v2_15_0_dados.js']['sha256'], label + ': catalogue changed')
        if 'runtimes' in value:
            require(value['runtimes'] == {n: self.files[n]['sha256'] for n in ('RevisaWiki_v2_15_0.js', 'RevisaWiki_v2_15_0_completo.js')}, label + ': runtimes changed')
            bound = True
        require(bound or not require_binding, label + ': unbound report')
        for key in ('cases', 'tests'):
            if isinstance(value.get(key), list):
                for item in value[key]:
                    if isinstance(item, dict):
                        require(item.get('status', 'passed') == 'passed' and item.get('passed', True) is True, label + ': failed case')

    def product(self, path, label, cases=None, require_binding=True, activity_proof=None):
        value = self.record(path, 'product-report', counted=True)
        self.validate(value, str(path), require_binding=require_binding)
        if 'wikipediaWrites' not in value and 'actualWikipediaWrites' not in value:
            require(activity_proof is not None, str(path) + ': no explicit write activity proof')
            proof = self.dependency(activity_proof, 'read-only-execution-provenance')
            require(proof['wikipediaWrites'] == proof['networkRequests'] == 0 and proof['accountUse'] is False and proof['runtimeAndHistoricalSourcesStillExact'] is True, str(path) + ': execution activity proof incomplete')
        amount = number(cases(value) if cases else value.get('cases', value.get('tests')), label)
        checks = number(value.get('checks', value.get('assertions')), label)
        self.groups.append({'label': label, 'cases': amount, 'checks': checks, 'report': local(path).relative_to(ROOT).as_posix()})
        if activity_proof is not None:
            self.groups[-1]['activityProofReport'] = local(activity_proof).relative_to(ROOT).as_posix()
        return value

    def dependency(self, path, label, require_status=True, require_binding=True):
        value = self.record(path, label)
        self.validate(value, str(path), require_status, require_binding)
        return value


def execution(e, path, expected_stage):
    value = e.dependency(path, 'execution-provenance')
    require(value['stage'] == expected_stage and value['runtimeAndHistoricalSourcesStillExact'] is True, 'Incomplete execution wrapper')
    require(value['sourceVersion'] == '2.13.0' and value['sourceReleaseManifestSha256'] == '95fb16d2faace1f76b5ff02478659ef8ef3bf8f9203a3d4eb6454b32576eb7e3' and value['sourceFilesVerified'] == 466, 'Historical execution source binding changed')
    require(value.get('behavioralAssertionWaivers') == [] and value['accountUse'] is False, 'Execution waiver or account use')
    require(all(row.get('exitCode') == 0 for row in value['commands']), 'Execution process failed')
    return value


def browser_child(e, path, expected_hash, cases, checks, image=False):
    value = e.dependency(path, 'native-browser-dependency', require_status=image)
    require(sha(local(path).read_bytes()) == expected_hash, 'Browser summary child hash mismatch')
    tests = value['tests']
    require(len(tests) == cases and all(row['passed'] is True for row in tests), 'Incomplete native flows')
    require(value['assertions'] == checks, 'Browser checks mismatch')
    cleanup = value['cleanup']
    require(all(cleanup[k] is True for k in ('ownSessionClosed', 'ownProcessExited', 'ownProfileRemoved')), 'Owned browser session not cleaned')
    if image:
        require(value['finalRuntimePinsVerified'] is True and value['outsideRequests'] == 0, 'Image runtime proof incomplete')
    else:
        require(value['passed'] == cases and value['failed'] == 0 and value['blockedOutsideRequests'] == 0, 'Native runtime proof incomplete')
        require(value['finalSavedFileHashesVerified'] and value['finalSourceHashesVerified'], 'Native final hashes unchecked')
        require(cleanup['unknownBrowserSessionsTouched'] is False, 'Unrelated browser session touched')
    require(value['nativeUIContract']['releaseManifestSha256'] == FINAL_PIN, 'Native child runtime pin changed')
    return value


def collect(main_dir, real_report='artifacts/v2150/release/real_corrected/real_templates.json'):
    e = Evidence()
    main_dir = local(main_dir)
    main = e.product(main_dir / 'OFFLINE_QA_SUMMARY.json', 'Motor, instalação e regressões herdadas')
    child_cases = child_checks = 0
    for row in main['reports']:
        child = main_dir / row['file']
        require(sha(local(child).read_bytes()) == row['sha256'], 'Principal report dependency changed')
        value = e.record(child, 'main-aggregate-dependency')
        require(row.get('status') == 'passed', 'Principal child did not pass')
        require(not value.get('failed') and not value.get('failures'), 'Principal child has failures')
        zero_activity(value, row['file'])
        child_cases += number(row['cases'], row['file'])
        child_checks += number(row['checks'], row['file'])
    require(child_cases == main['cases'] and child_checks == main['checks'], 'Principal totals do not match child reports')
    wrappers = [execution(e, main_dir / 'INHERITED_EXECUTION_main.json', 'main')]

    complex_wrapper_path = RELEASE / 'complex/INHERITED_EXECUTION_complex.json'
    complex_execution = execution(e, complex_wrapper_path, 'complex')
    complex_ids = set()
    for index in range(4):
        value = e.product(RELEASE / f'complex/complex-shard-{index}.json', f'Artigos complexos, lote {index + 1}', activity_proof=complex_wrapper_path)
        require(value['shard'] == index and value['shards'] == 4 and value['actualDistributions'] is True, 'Wrong complex shard')
        require(len(value['cases']) == 32, 'Incomplete complex shard')
        for row in value['cases']:
            require(row['sourceBytes'] >= 100000, 'Complex source below stated size')
            complex_ids.add((row['title'], row['revid']))
    require(len(complex_ids) == 16, 'Expected 16 distinct complex article revisions')
    wrappers.append(complex_execution)
    large = e.product(RELEASE / 'large/final_v2150/public_report.json', 'Artigos grandes nas duas distribuições', lambda v: v['articleCount'])
    require(large['articleCount'] == large['passed'] == large['completed'] == len(large['articles']) == 31, 'Large corpus incomplete')
    require(not large['networkAttempts'] and large['releaseStillPinned'] and large['corpusStillPinned'], 'Large corpus pin missing')
    large_ids = {(row['revid'], row['inputSha256']) for row in large['articles']}
    require(all(row['passed'] is True and not row['failures'] and set(row['modes']) == {'core', 'complete'} and all(mode['passed'] is True for mode in row['modes'].values()) for row in large['articles']), 'Large article mode failed')
    require(sum(row['checks'] for row in large['articles']) == large['checks'], 'Large checks do not match completed articles')
    require(len(large_ids) == 31, 'Large corpus duplicates')
    wrappers.append(execution(e, RELEASE / 'large/INHERITED_EXECUTION_large.json', 'large'))

    native = e.product(RELEASE / 'native_browser/NATIVE_BROWSER_SUMMARY.json', 'Interface nativa e imagens em três navegadores')
    require(native['imagesIncluded'] is True and native['nativeDiffClickStub'] is True and native['nativeRemoteDiffRenderingTested'] is False, 'Native scope overstated')
    require(len(native['browsers']) == 3, 'Missing native browser')
    native_checks = native_cases = 0
    for browser, row in zip(('Chrome', 'Firefox', 'Safari'), native['browsers']):
        require(row['browser'].lower() == browser.lower(), 'Native browser order changed')
        for key in ('main', 'images'):
            item = row[key]
            child = local(RELEASE / 'native_browser' / item['file'])
            v = browser_child(e, child, item['sha256'], item['cases'], item['checks'], key == 'images')
            require(v['nativeUIContract']['coveragePlanSha256'] == native['coveragePlanSha256'], 'Native executed plans differ')
            native_checks += item['checks']
            native_cases += item['cases']
    require(native_cases == native['cases'] == 540 and native_checks == native['checks'], 'Native totals mismatch')

    identity_scopes = []
    for bundle in ('modular', 'complete'):
        for name, label in (('reader_test', 'Leitura de predefinições'), ('reader_native', 'Projeção nativa guardada do leitor'),
                            ('reader_independent', 'Leitura, casos independentes'), ('identity_boundary', 'Identidade literal dos nomes'),
                            ('template_definition', 'Definição e documentação de predefinições'), ('style', 'TemplateStyles e retenção contextual')):
            value = e.product(RELEASE / f'focused/{bundle}/{name}.json', label + ', ' + bundle)
            if name == 'identity_boundary':
                scope = value['oracle']['scope']
                require(scope['exactLiteralTitles'] == 33 and scope['changedPositiveCasesPerBundle'] == 156 and scope['changedPositiveCasesTwoBundles'] == 312, 'Identity oracle scope changed')
                require(scope['remainingEligibilityLogicUnchanged'] is True and value['oracle']['positiveAssertionBodiesChanged'] is False and value['oracle']['negativeAssertionsChanged'] is False and value['oracle']['runtimeIdentityHelpersUsedForExpectedOutput'] is False, 'Identity assertions weakened')
                require(len(value['oracle']['exactDeclinedTitles']) == 33, 'Identity title inventory incomplete')
                identity_scopes.append(scope)
            if name == 'reader_native':
                require(value['capturedCases'] == 1 and value['fullPlannedMatrixCaptured'] is False, 'Native reader capture overstated')
        # This duplicate run is checked but is not included in the aggregate totals.
        duplicate = e.dependency(RELEASE / f'style_units/{bundle}/style.json', 'duplicate-style-confirmation')
        counted = json.loads((RELEASE / f'focused/{bundle}/style.json').read_text())
        require(all(duplicate[k] == counted[k] for k in ('runtimeSha256', 'cases', 'checks', 'status')), 'Duplicate style run disagrees')

    oracle_path = local('tests/v2150/inherited/IDENTITY_ORACLE_CONTRACT.json')
    require(sha(oracle_path.read_bytes()) == 'f85dddd86669d55951bd530b85676bf56c5205410d2889fe26bfd13a3f4dbdab', 'Identity eligibility contract changed')
    e.record(oracle_path, 'finite-identity-eligibility-contract')
    prior = RELEASE / 'focused/previous-focused'
    combined = ('quote_alignment', 'prose_spacing', 'spacing_independent', 'quote_native', 'spacing_native', 'nsrw_native_parser')
    for name in combined:
        value = e.product(prior / (name + '.json'), 'Regressão específica herdada, ' + name, require_binding=name != 'nsrw_native_parser')
        if name == 'nsrw_native_parser':
            require(value['kind'] == 'native-encyclopedia-parser-projections' and value['runnerSha256'] == '8c2b408a7534edef0780b50bdf7a9d523455351837d271723a1d9bf1cbd6aa8d' and value['captureSha256'] == '1769f1a5fd35a5e570ec2113ccf3dcb976b17f5f05f2878ba731150574f08663' and value['oracleSha256'] == '68159e691de1d8253da89250ed97c61170f742bfb91174a34cdd6f9094d72b0a', 'Unbound historical native-oracle replay')
    for bundle in ('modular', 'complete'):
        for name in ('nsrw_native_citation', 'drug_fields', 'drug_import_fields', 'drug_composition_case', 'drug_native', 'ui_report'):
            e.product(prior / bundle / (name + '.json'), 'Regressão específica herdada, ' + name + ', ' + bundle)
    combined_adapters = ('quote_alignment', 'prose_spacing', 'spacing_independent', 'quote_native', 'spacing_native', 'nsrw_native_test')
    per_bundle_adapters = ('nsrw_test', 'drug_fields', 'drug_import_fields', 'drug_composition_case', 'drug_native_test', 'ui_report')
    for folder, names in [(prior, combined_adapters)] + [(prior / b, per_bundle_adapters) for b in ('modular', 'complete')]:
        for name in names:
            value = e.dependency(folder / ('adaptation-' + name + '.json'), 'focused-adapter-provenance', require_binding=False)
            require(value['method'] == 'version-and-runtime-address-retargeting-only' and value['behavioralAssertionWaivers'] == [], 'Focused adapter widened')
            for row in value['records']:
                require(sha(local(row['file']).read_bytes()) == row['sourceSha256'], 'Historical focused runner changed')

    real_report = local(real_report)
    real = e.product(real_report, 'Revisões reais de predefinições nas duas distribuições')
    real_manifest = local('tests/v2150/REAL_TEMPLATE_SOURCE_MANIFEST.json')
    require(real['corpusSha256'] == sha(real_manifest.read_bytes()), 'Stored template source manifest changed after the selected run')
    real_sources = e.record(real_manifest, 'stored-template-source-manifest')
    real_review = e.dependency(RELEASE / 'real/source_manifest_review.json', 'real-template-source-host-review')
    require(real_review['sourceManifestSha256After'] == real_review['corpusSha256'] == real['corpusSha256'], 'Real-template source review hash mismatch')
    require(real_review['rowsReviewed'] == 37 and real_review['rowsCorrected'] == len(real_review['corrections']) == 7, 'Real-template host review scope changed')
    for key in ('onlySourceHostsChanged', 'sourceHashesPreserved', 'compressedSourceHashesPreserved', 'sourceBytesPreserved', 'originalCaptureCorpusUntouched'):
        require(real_review[key] is True, 'Real-template source review changed ' + key)
    inventory = {row['id']: row for row in real_sources['templates']}
    require(len(inventory) == 37 and len(real_review['sourceInventory']) == 37, 'Real-template source inventory incomplete')
    for row in real_review['corrections']:
        expected = inventory[row['id']]
        require(expected['source'] == row['after'] and row['before'].replace('https://pt.wikipedia.org/', 'https://en.wikipedia.org/', 1) == row['after'], 'Real-template correction exceeded source host')
        require(row['sourceSha256'] == expected['sha256'] and row['gzipSha256'] == expected['gzipSha256'] and row['originVerification']['titleRevisionAndSourceBytesEqual'] is True, 'Real-template captured bytes changed')
    for row in real_review['sourceInventory']:
        require(all(row[key] == inventory[row['id']][key] for key in ('oldid', 'bytes', 'sha256', 'gzipSha256')), 'Real-template unchanged inventory mismatch')
    require(len(real['templates']) == 37 and real['cases'] == 74 and len({row['id'] for row in real['templates']}) == 37, 'Real template corpus count mismatch')
    for bundle in ('modular', 'complete'):
        ui = e.product(RELEASE / f'template_ui/{bundle}/template_ui.json', 'Editor de predefinições, ' + bundle)
        require(ui['ownedSessionClosed'] and ui['safePages'], 'Template UI session incomplete')
        for page in ui['pages']:
            zero_activity(page, 'template UI page')
            require(not page['errors'] and not page['policyViolations'], 'Template UI page errors')
        for browser in ('chrome', 'firefox', 'safari'):
            value = e.product(RELEASE / f'style_browser/{bundle}/{browser}.json', 'TemplateStyles e telas, ' + bundle + ', ' + browser)
            requests = json.loads(value['finalRequests'])
            require(not requests['mutations'] and requests['submits'] == requests['saves'] == requests['clipboard'] == 0, 'Style browser writes')
            require(value['cleanup']['ownedSessionClosed'] and not value['cleanup']['unrelatedSessionsTouched'], 'Style browser cleanup incomplete')
    e.product(RELEASE / 'independent_style_review.json', 'Casos independentes do leitor e dos metadados')
    review = e.dependency(RELEASE / 'independent_reader_review.json', 'independent-source-review')
    require(review['newProductTestsExecutedForThisReceipt'] is False and review['negativeAssertionWaivers'] == [], 'Source review claims extra product tests')
    require(all(row['passed'] is True for row in review['checks']) and all(row['status'] in ('closed', 'resolved') for row in review.get('observations', [])), 'Open independent source findings')
    for name, proof in review['reviewedSources'].items():
        data = local(name).read_bytes()
        require(sha(data) == proof['sha256'] and len(data) == proof['bytes'], 'Independently reviewed source changed: ' + name)

    # Provenance captures are counted independently of their replay in both bundles.
    reader = e.record('tests/v2150/reader_native_contracts.json', 'native-reader-capture-manifest')
    official = e.record('tests/v2150/reader_official_contracts.json', 'official-reader-oracle-manifest')
    css = e.record('tests/v2150/style_native/manifest.json', 'native-css-capture-manifest')
    require(reader['method'] == 'GET' and reader['credentials'] == 'omit' and reader['capturedCases'] == len(reader['cases']) == 1 and reader['captureComplete'] is False and reader['wikipediaWrites'] == 0, 'Reader native provenance changed')
    require(len(official['cases']) == 48 and official['kind'] == 'official-mediawiki-preprocessor-test-oracles', 'Official oracle provenance changed')
    require(css['method'] == 'GET' and css['accountAccess'] is False and css['wikipediaWrites'] == 0 and len(css['cases']) == 5, 'CSS native provenance changed')
    native_captures = sum(len(row['states']) for row in css['cases'])
    require(native_captures == 10, 'CSS response inventory changed')
    transition = collect_transition(e, wrappers, native)
    integrity = e.dependency(RELEASE / 'final_adapter_integrity.json', 'final-reproduction-adapter-integrity')
    require(integrity['sourceFiles'] == 466 and integrity['compiledModules'] == 87 and integrity['nativeCompiledModules'] == 14 and integrity['documentationVerifierSelfchecks'] == 13, 'Final reproduction adapter coverage changed')
    require(integrity['inheritedReproductionPlanSha256'] == transition['currentReproductionNodePlanSha256'] and integrity['nativeReproductionPlanSha256'] == transition['currentReproductionNativePlanSha256'], 'Final reproduction adapter plans changed')
    require(integrity['productTestsReexecuted'] is False and integrity['assertionWaivers'] == [], 'Final adapter check relabeled a product rerun or waived assertions')
    fmt = lambda n: format(n, ',').replace(',', '.')
    totals = sum(row['cases'] for row in e.groups), sum(row['checks'] for row in e.groups)
    text = (f"Os arquivos finais da versão 2.15.0 passaram por {fmt(totals[0])} casos e {fmt(totals[1])} verificações, sem falhas. "
            "Os totais incluem testes sintéticos e repetições nas duas distribuições. Não são uma contagem de artigos distintos. "
            "A rodada de conteúdo conferiu 37 revisões de predefinições e 31 artigos grandes. Outra matriz usou 16 artigos de pelo menos 100 KB. "
            "A interface, as imagens e os estilos foram conferidos em Chrome, Firefox e Safari. "
            "A prova nativa do leitor contém uma resposta anônima guardada. Os 48 casos oficiais do MediaWiki são expectativas de teste reproduzidas localmente. "
            "Os estilos usam dez respostas nativas guardadas. Essas provas não equivalem à renderização nativa de artigos inteiros. "
            "A mudança de elegibilidade de 33 nomes, com 156 casos positivos por distribuição, fica registrada separadamente e mantém as expectativas negativas. "
            "Uma correção separada em três geradores ajustou 324 entradas por distribuição ao nome documentado, sem mudar o que cada teste exige. "
            "Os relatórios de execução conservam os hashes dos planos efetivamente usados. Nenhum teste editou a Wikipédia ou usou uma conta.")
    return {'version': VERSION, 'status': 'passed', 'releaseManifestSha256': FINAL_PIN, 'frozenFiles': e.files,
            'mainSourceDirectory': main_dir.relative_to(ROOT).as_posix(), 'realSourceReport': real_report.relative_to(ROOT).as_posix(), 'groups': e.groups, 'totalCases': totals[0], 'totalChecks': totals[1], 'sourceReports': list(e.records.values()),
            'distinctContent': {'storedTemplateRevisions': 37, 'largeArticleRevisions': 31, 'complexArticleRevisionsAtLeast100KB': len(complex_ids), 'corporaMayOverlap': True},
            'nativeEvidence': {'actualReaderGetCaptures': 1, 'actualCssGetCaptures': native_captures, 'officialMediaWikiOracleReplays': 48, 'freshNativeFullArticleParses': 0},
            'identityOracleEligibility': identity_scopes[0], 'identityOraclePositiveAssertionBodiesChanged': False,
            'identityOracleNegativeAssertionsChanged': False, 'executionProvenance': transition,
            'independentSourceReviewChecks': len(review['checks']), 'portugueseSummary': text,
            'aggregateChildrenCountedTwice': False, 'wikipediaWrites': 0, 'accountUse': False}


def registry_amendment_contract(e):
    path = local('tests/v2150/inherited/IDENTITY_REGISTRY_AMENDMENT.json')
    require(sha(path.read_bytes()) == '68a1e813f8156e5f87ae6904e501a37c83c992a21f8d847240ea946d38779c02', 'Finite registry amendment contract changed')
    value = e.record(path, 'finite-positive-source-projection-contract')
    require(value['version'] == VERSION and value['runtimeManifestSha256'] == FINAL_PIN, 'Registry amendment runtime mismatch')
    for key in ('activePlansModified', 'runtimeModified', 'historicalFileBytesModified', 'assertionBodiesChanged', 'negativeAssertionsChanged'):
        require(value[key] is False, 'Registry contract changed ' + key)
    scope = value['scope']
    require(scope == {'finiteTitles': 33, 'changedGeneratedCasesPerBundle': 324, 'changedGeneratedCasesTwoBundles': 648,
                      'marriageSyntaxPerBundle': 52, 'multipleMarriagesPerBundle': 52, 'biographyDatesPerBundle': 220}, 'Registry projection scope widened')
    require(len(value['mapping']) == 33 and len(value['sourceReplacements']) == 3, 'Registry inventory incomplete')
    require(len({row['unverifiedLiteralTitle'] for row in value['mapping']}) == 33, 'Registry input title duplicated')
    require(sum(row['generatedCasesPerBundle'] for row in value['sourceReplacements']) == 324, 'Generated source counts mismatch')
    for row in value['sourceReplacements']:
        require(sha(local(row['file']).read_bytes()) == row['sourceSha256'], 'Original positive generator changed')
        require(row['occurrences'] == 1 and row['allOtherGeneratedBytesPreserved'] is True and row['assertionBodiesChanged'] is False and row['negativeAssertionsChanged'] is False, 'Registry generator assertions changed')
    zero_activity(value, 'Registry amendment contract')
    return scope


def stored_snapshot(folder, value):
    relative_folder = folder.relative_to(ROOT).as_posix() + '/'
    candidate = ROOT / value if str(value).startswith(relative_folder) else folder / value
    candidate = local(candidate)
    require(candidate.is_relative_to(folder), 'Saved receipt is outside its snapshot folder')
    return candidate


def snapshot_file(e, path, target, role, expected=None, size=None):
    path = local(path)
    raw = path.read_bytes()
    if expected is not None:
        require(sha(raw) == expected and len(raw) == size, 'Read-only snapshot changed: ' + path.name)
    if path.suffix == '.json':
        value = json.loads(raw)
        for key in ('releaseManifestSha256', 'pinManifestSha256', 'targetReleaseManifestSha256', 'runtimeManifestSha256'):
            if key in value:
                require(value[key] == FINAL_PIN, 'Snapshot targets another runtime: ' + path.name)
        zero_activity(value, path.name)
    relative = path.relative_to(ROOT).as_posix()
    if relative in e.records:
        require(e.records[relative]['sha256'] == sha(raw), 'Recorded snapshot changed')
    else:
        e.records[relative] = {'report': relative, 'sha256': sha(raw), 'bytes': len(raw), 'role': role,
                               'counted': False, 'evidenceTarget': target}


def collect_transition(e, wrappers, native):
    """Keep the semantic source amendment separate from the later README correction."""
    scope = registry_amendment_contract(e)
    preflight_path = local('artifacts/v2150/registry_amendment_preflight/PREFLIGHT.json')
    preflight = e.dependency(preflight_path, 'positive-generator-amendment-preflight')
    require(preflight['amendment']['sha256'] == '68a1e813f8156e5f87ae6904e501a37c83c992a21f8d847240ea946d38779c02' and preflight['amendment']['scope'] == scope, 'Preflight source projection changed')
    require(preflight['cases'] == 1164 and preflight['checks'] == 4152 and preflight['negativeCases'] == 648 and preflight['negativeChecks'] == 1509, 'Preflight matrix incomplete')
    for key in ('runtimeModified', 'activePlansModified', 'originalAssertionsRemoved', 'historicalFileBytesModified'):
        require(preflight[key] is False, 'Preflight changed ' + key)
    for row in preflight['children']:
        child = local(preflight_path.parent / row['file'])
        require(sha(child.read_bytes()) == row['sha256'], 'Preflight child report changed')
        e.dependency(child, 'amendment-preflight-dependency')
    require(sum(row['cases'] for row in preflight['children']) == preflight['cases'] and sum(row['checks'] for row in preflight['children']) == preflight['checks'], 'Preflight child counts differ')

    semantic_folder = ROOT / 'tests/v2150/inherited/qa_semantic_snapshot'
    semantic_path = semantic_folder / 'SEMANTIC_TRANSITION_COMPLETED.json'
    semantic = e.record(semantic_path, 'finite-source-projection-transition', target='provenance/qa_semantic_snapshot/SEMANTIC_TRANSITION_COMPLETED.json')
    e.validate(semantic, 'semantic source projection transition')
    require(semantic['actualQAInheritedPlanSha256'] == ACTUAL_NODE_PLAN and semantic['actualQANativePlanSha256'] == ACTUAL_NATIVE_PLAN, 'Original executed plans changed')
    expected_inputs = dict(scope, contractSha256='68a1e813f8156e5f87ae6904e501a37c83c992a21f8d847240ea946d38779c02')
    require(semantic['reviewedGeneratedTitleInputs'] == expected_inputs, 'Semantic amendment scope widened')
    for key in ('nativeCompiledModulesIdentical', 'oldPassingExecutionModulesUnaffected', 'runtimeUnchanged', 'assertionBodiesUnchanged', 'negativeAssertionsUnchanged'):
        require(semantic[key] is True, 'Semantic amendment changed ' + key)
    require(semantic['actualReportsRetargeted'] is False and semantic['assertionWaivers'] == [], 'Semantic reports retargeted or waived')
    main_wrapper = wrappers[0]
    require(main_wrapper['adapterPlanSha256'] == semantic['amendedMainPlanSha256'], 'Main rerun lacks amended plan proof')
    require(all(row['adapterPlanSha256'] == ACTUAL_NODE_PLAN for row in wrappers[1:]), 'Earlier successful article plans changed')
    require(native['coveragePlanSha256'] == ACTUAL_NATIVE_PLAN, 'Earlier native executed plan changed')
    main_receipt = semantic['mainRerunReceipt']
    main_path = local(main_receipt['file'])
    selected_main = local(e.records[next(k for k in e.records if k.endswith('/OFFLINE_QA_SUMMARY.json'))]['report'])
    selected_wrapper = selected_main.parent / 'INHERITED_EXECUTION_main.json'
    require(main_path == selected_wrapper and main_receipt['actualPlanSha256'] == semantic['amendedMainPlanSha256'], 'Semantic proof selected another main rerun or plan')
    require(sha(main_path.read_bytes()) == main_receipt['sha256'] and main_receipt['status'] == 'passed', 'Main rerun receipt changed')
    require(sha(stored_snapshot(semantic_folder, main_receipt['snapshotFile']).read_bytes()) == main_receipt['sha256'], 'Main rerun snapshot differs')
    main_value = json.loads(selected_main.read_text())
    require(main_receipt['cases'] == main_value['cases'] and main_receipt['checks'] == main_value['checks'] and main_receipt['reports'] == len(main_value['reports']), 'Main rerun counts changed')
    preserved = {}
    for row in semantic['oldPassingReceipts']:
        source = local(row['file'])
        require(sha(source.read_bytes()) == row['sha256'], 'Earlier passing receipt changed')
        stored = stored_snapshot(semantic_folder, row['snapshotFile'])
        require(sha(stored.read_bytes()) == row['sha256'], 'Earlier passing snapshot differs')
        value = json.loads(source.read_text())
        require(value.get('status', 'passed') == 'passed' and not value.get('failed') and not value.get('failures'), 'Earlier receipt was not passed')
        if 'adapterPlanSha256' in value:
            require(value['adapterPlanSha256'] == ACTUAL_NODE_PLAN, 'Old node execution pin changed')
        if 'coveragePlanSha256' in value:
            require(value['coveragePlanSha256'] == ACTUAL_NATIVE_PLAN, 'Old native execution pin changed')
        preserved[source.relative_to(ROOT).as_posix()] = row['sha256']
    required_old = ['artifacts/v2150/release/complex/INHERITED_EXECUTION_complex.json',
                    'artifacts/v2150/release/large/INHERITED_EXECUTION_large.json',
                    'artifacts/v2150/release/native_browser/NATIVE_BROWSER_SUMMARY.json']
    require(all(path in preserved for path in required_old), 'An earlier passing execution lacks preserved provenance')
    for name, expected in [('runtime_manifest.json', FINAL_PIN), ('old_inherited_plan.json', ACTUAL_NODE_PLAN),
                           ('old_native_plan.json', ACTUAL_NATIVE_PLAN), ('new_inherited_plan.json', semantic['amendedMainPlanSha256']),
                           ('new_native_plan.json', semantic['newNativePlanSha256'])]:
        require(sha((semantic_folder / name).read_bytes()) == expected, 'Semantic plan snapshot changed: ' + name)
    for row in semantic['evidenceFiles']:
        source = local(row['file'])
        require(source.is_relative_to(semantic_folder), 'Semantic snapshot file is outside its finite folder')
        target = 'provenance/qa_semantic_snapshot/' + source.relative_to(semantic_folder).as_posix()
        snapshot_file(e, source, target, 'semantic-plan-snapshot', row['sha256'], row['bytes'])

    # This second transition only corrects README wording. It starts from the
    # already amended reproduction plans and does not claim they were used by
    # the earlier native/article runs.
    folder = ROOT / 'tests/v2150/inherited/qa_snapshot'
    capture = e.record(folder / 'CAPTURE.json', 'readme-transition-base-snapshot', target='provenance/qa_snapshot/CAPTURE.json')
    transition = e.record(folder / 'TRANSITION.json', 'documentation-only-plan-transition', target='provenance/qa_snapshot/TRANSITION.json')
    e.validate(transition, 'documentation transition')
    require(capture['runtimeManifestSha256'] == FINAL_PIN and capture['originalReportsRelabeled'] is False, 'README snapshot runtime/receipt changed')
    require(transition['actualQAInheritedPlanSha256'] == capture['actualQAInheritedPlanSha256'] == semantic['amendedMainPlanSha256'], 'README transition main executed plan changed')
    require(transition['actualQANativePlanSha256'] == capture['actualQANativePlanSha256'] == ACTUAL_NATIVE_PLAN, 'README transition actual native executed plan changed')
    require(transition['baselineReproductionInheritedPlanSha256'] == capture['baselineReproductionInheritedPlanSha256'] == semantic['amendedMainPlanSha256'], 'README inherited reproduction baseline changed')
    require(transition['baselineReproductionNativePlanSha256'] == capture['baselineReproductionNativePlanSha256'] == semantic['newNativePlanSha256'], 'README native reproduction baseline changed')
    require(transition['semanticTransitionSha256'] == capture['semanticTransitionSha256'] == sha(semantic_path.read_bytes()), 'README bridge lost the separate semantic source projection proof')
    require(transition['snapshotManifestSha256'] == sha((folder / 'CAPTURE.json').read_bytes()), 'README snapshot digest mismatch')
    for key in ('compiledModulesIdentical', 'sourceFixturesIdentical', 'oracleSubstitutionsIdentical', 'negativeAssertionsIdentical'):
        require(transition[key] is True, 'README transition changed ' + key)
    require(transition['actualQAReportsRetargeted'] is False and transition['actualQAReportsReexecuted'] is False and transition['assertionWaivers'] == [], 'Executed report relabeled or waived during README correction')
    for name, expected in [('runtime_manifest.json', FINAL_PIN), ('inherited_plan.json', semantic['amendedMainPlanSha256']),
                           ('native_plan.json', semantic['newNativePlanSha256']), ('inherited_README.md', capture['oldReadmeSha256']),
                           ('expected_README.md', capture['expectedReadmeSha256'])]:
        path = folder / name
        require(sha(path.read_bytes()) == expected, 'README transition snapshot changed: ' + name)
        snapshot_file(e, path, 'provenance/qa_snapshot/' + name, 'readme-transition-base-snapshot')
    for row in capture['records']:
        source, original = stored_snapshot(folder, row['snapshotFile']), local(row['originalFile'])
        require(sha(original.read_bytes()) == row['sha256'], 'Original QA receipt relabeled after README correction')
        snapshot_file(e, source, 'provenance/qa_snapshot/' + source.relative_to(folder).as_posix(), 'actual-qa-receipt-snapshot', row['sha256'], row['bytes'])
    current_node = sha(local('tests/v2150/inherited/ADAPTATION_PROVENANCE.json').read_bytes())
    current_native = sha(local('tests/v2150/native_browser/COVERAGE_AND_ADAPTATION.json').read_bytes())
    require(transition['currentReproductionInheritedPlanSha256'] == current_node and transition['currentReproductionNativePlanSha256'] == current_native, 'Current reproduction plans differ from README proof')
    e.record('tests/v2150/inherited/ADAPTATION_PROVENANCE.json', 'current-reproduction-plan')
    e.record('tests/v2150/native_browser/COVERAGE_AND_ADAPTATION.json', 'current-reproduction-plan')
    return {'actualEarlierArticleNodePlanSha256': ACTUAL_NODE_PLAN, 'actualNativeExecutedPlanSha256': ACTUAL_NATIVE_PLAN,
            'actualMainRerunPlanSha256': semantic['amendedMainPlanSha256'], 'preReadmeNativeReproductionPlanSha256': semantic['newNativePlanSha256'],
            'currentReproductionNodePlanSha256': current_node, 'currentReproductionNativePlanSha256': current_native,
            'finiteGeneratedInputProjection': scope, 'preflightCasesExcludedFromProductTotals': True,
            'semanticSourceTransitionProof': semantic['kind'], 'documentationOnlyTransitionProof': transition['kind'],
            'actualReportHashesRetained': True}


def selftest():
    """Negative reporting tests do not create product cases or publication output."""
    import copy
    e = Evidence()
    valid = {'version': VERSION, 'status': 'passed', 'releaseManifestSha256': FINAL_PIN,
             'cases': [{'passed': True}], 'checks': 1, 'wikipediaWrites': 0}
    e.validate(valid, 'synthetic valid report')
    checks = 1
    tests = [('missing version', lambda v: v.pop('version')),
             ('wrong version', lambda v: v.update(version='2.14.0')),
             ('withdrawn pin', lambda v: v.update(releaseManifestSha256='0' * 64)),
             ('wrong runtime', lambda v: v.update(runtimeSha256='0' * 64)),
             ('wrong catalogue', lambda v: v.update(catalogSha256='0' * 64)),
             ('wrong executable inventory', lambda v: v.update(frozenFiles={})),
             ('network mutation', lambda v: v.update(networkMutations=1)),
             ('missing status', lambda v: v.pop('status')),
             ('running report', lambda v: v.update(status='running')),
             ('failed count', lambda v: v.update(failed=1)),
             ('failed list', lambda v: v.update(failures=['failure'])),
             ('write count', lambda v: v.update(wikipediaWrites=1)),
             ('account use', lambda v: v.update(accountUse=True)),
             ('failed case', lambda v: v.update(cases=[{'passed': False}])),
             ('unbound report', lambda v: v.pop('releaseManifestSha256'))]
    for name, mutate in tests:
        value = copy.deepcopy(valid)
        mutate(value)
        try:
            e.validate(value, name)
        except ValueError:
            pass
        else:
            raise ValueError('Negative self-test was accepted: ' + name)
        checks += 1
    for invalid in (True, False, -1, 0, '4', None):
        try:
            number(invalid, 'invalid count')
        except ValueError:
            pass
        else:
            raise ValueError('Invalid product count accepted')
        checks += 1
    require(number([1, 2], 'array count') == 2, 'Array counts failed')
    checks += 1
    # Read real completed new focused reports to check both supported count shapes.
    for bundle in ('modular', 'complete'):
        for name in ('reader_test', 'reader_native', 'reader_independent', 'identity_boundary', 'template_definition', 'style'):
            value = e.product(RELEASE / f'focused/{bundle}/{name}.json', name + bundle)
            require(value.get('wikipediaWrites') == 0, 'Focused report activity proof missing')
            checks += 1
    duplicate = RELEASE / 'focused/modular/style.json'
    try:
        e.product(duplicate, 'duplicate')
    except ValueError:
        pass
    else:
        raise ValueError('Duplicate aggregate product report accepted')
    checks += 1
    return {'version': VERSION, 'status': 'passed', 'kind': 'release-reporting-negative-selfchecks',
            'releaseManifestSha256': FINAL_PIN, 'checks': checks, 'newProductCases': 0,
            'sourceReportsWritten': False, 'networkRequests': 0, 'wikipediaWrites': 0}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--main-dir', default='artifacts/v2150/release/main_amended')
    parser.add_argument('--real-report', default='artifacts/v2150/release/real_corrected/real_templates.json')
    parser.add_argument('--selftest', action='store_true')
    args = parser.parse_args()
    if args.selftest:
        print(json.dumps(selftest(), ensure_ascii=False))
        return
    summary = collect(args.main_dir, args.real_report)
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / 'RELEASE_QA_SUMMARY.json'
    target.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'version': VERSION, 'status': 'passed', 'cases': summary['totalCases'], 'checks': summary['totalChecks'], 'reports': len(summary['sourceReports'])}))


if __name__ == '__main__':
    main()
