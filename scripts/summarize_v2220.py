"""Assemble final QA only from closed, exact-version validation evidence.

The config is private. It pins public inputs, the two full documentation-example
receipts and their directed-run stdout, and the already tested demo preview.
This script executes no article transformations and makes no network requests.
The final archive privacy review remains a separate publication requirement.
"""
from pathlib import Path
import argparse
import copy
import importlib.util
import json
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]
VERSION='2.22.0';STEM='v2_22_0'

def module(name,filename):
    scripts=str(ROOT/'scripts');sys.path.insert(0,scripts)
    try:
        spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/filename)
        value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
    finally:sys.path.remove(scripts)

delivery=module('summary_delivery_gate','build_delivery_v2220.py')
aggregate=module('summary_public_gate','aggregate_public_evidence_v2220.py')

DOCUMENTS={f'{name}_RevisaWiki_{STEM}.{ext}'for name,ext in (
    ('Documentacao','wiki'),('Instalacao','txt'),('Notas_da_versao','txt'),
    ('Referencia_tecnica','txt'),('Relatorio_testes','txt'),
    ('Resumo_atualizacao','txt'),('Resumo_documentacao','txt'))}|{
    'LEIA_PRIMEIRO.txt','Funcionalidades_RevisaWiki_2_22_0.md',
    'Funcionalidades_RevisaWiki_2_22_0.json','Modelos_e_campos_RevisaWiki_2_22_0.md',
    'Catalogo_modelos_e_regras_2_22_0.json'}
PUBLIC_RECORDS=set(aggregate.PUBLIC_KEYS)
FIXED_INPUTS={
    'LICENSE','THIRD_PARTY_NOTICES_2_22_0.md',
    'docs/2.21.7/Documentacao_RevisaWiki_v2_21_7.wiki',
    'docs/2.21.7/Funcionalidades_RevisaWiki_2_21_7.json',
    'tests/v2212/coverage_all.json','tests/v2220/feature_examples.json',
    'tests/v2220/demo_examples.json','tests/v2220/documentation_examples.cjs',
    'scripts/summarize_v2220.py','scripts/build_delivery_v2220.py',
    'scripts/build_demo_v2220.py','scripts/aggregate_public_evidence_v2220.py',
    'tests/evidence/2.22.0/PLAN_COVERAGE.json',
    'tests/evidence/2.22.0/PRESAVE_ROUNDTRIP.json',
    'tests/evidence/2.22.0/NATIVE_INSTALLABLE_SCRIPTS.json',
}

def required_inputs():
    return FIXED_INPUTS|{f'docs/{VERSION}/'+name for name in DOCUMENTS}|{
        f'tests/evidence/{VERSION}/'+name for name in PUBLIC_RECORDS}

def descriptor_bytes(value):
    if not isinstance(value,dict)or set(value)!={'path','sha256'}:
        raise ValueError('A private receipt needs an explicit path and exact hash')
    return delivery.check_sha(Path(value['path']),value['sha256'])

def checked_documentation(manifest,manifest_sha,inputs):
    prefix=f'docs/{VERSION}/'
    actual={p.name for p in (ROOT/'docs'/VERSION).iterdir()if p.is_file()}
    if actual!=DOCUMENTS:raise ValueError('Every one of the twelve release documents is required')
    docs={name:inputs[prefix+name]for name in DOCUMENTS}
    for raw in docs.values():
        text=raw.decode('utf-8')
        if '\r'in text or any(token in text for token in ('{{VALIDACAO_RELEASE}}','aguardando QA','QA FINAL PENDENTE')):
            raise ValueError('Draft documentation remains')
    features=json.loads(docs['Funcionalidades_RevisaWiki_2_22_0.json'])
    rows=features.get('features');prior=json.loads(inputs['docs/2.21.7/Funcionalidades_RevisaWiki_2_21_7.json']).get('features')
    if features.get('version')!=VERSION or not isinstance(rows,list)or len(rows)!=190 or not isinstance(prior,list)or len(prior)!=170:
        raise ValueError('The reviewed feature inventories are incomplete')
    ids=[row.get('id')for row in rows];old_ids=[row.get('id')for row in prior]
    if len(set(ids))!=190 or len(set(old_ids))!=170 or not set(old_ids)<=set(ids):
        raise ValueError('Inherited feature identifiers were lost or duplicated')
    fields=('id','family','title','description','condition','type','verification')
    for row in rows:
        if any(not isinstance(row.get(key),str)or not row[key].strip()for key in fields)or any(not isinstance(row.get(key),str)for key in ('before','after')):
            raise ValueError('A documented feature is incomplete')
        if any(not isinstance(row.get(key),list)or any(not isinstance(item,str)or not item.strip()for item in row[key])for key in ('optionKeys','entryPoints')):
            raise ValueError('Feature entry-point metadata is incomplete')
    manual=docs[f'Documentacao_RevisaWiki_{STEM}.wiki']
    old=inputs['docs/2.21.7/Documentacao_RevisaWiki_v2_21_7.wiki']
    import re
    def headings(raw):
        history=raw.decode('utf-8').split('== Histórico das versões ==\n',1)
        if len(history)!=2:raise ValueError('Release history is missing')
        return re.findall(r'^=== ([^=]+) ===$',history[1],re.M)
    if headings(manual)!=[VERSION]+headings(old):raise ValueError('Historical release headings changed')
    plan=json.loads(inputs[f'tests/evidence/{VERSION}/PLAN_COVERAGE.json'])
    if plan.get('version')!=VERSION or plan.get('trackingEntries')!=408 or plan.get('trackingEntriesAreFeatureCount')is not False or plan.get('unresolvedIntegrityDefects')!=0:
        raise ValueError('Plan coverage is incomplete')
    delivery.checked_plan_coverage_pins(plan,manifest_sha,delivery.sha(manual),delivery.sha(docs['Funcionalidades_RevisaWiki_2_22_0.json']))
    coverage=json.loads(inputs['tests/v2212/coverage_all.json'])
    if len(coverage.get('items',[]))!=76 or len({r.get('id')for r in coverage['items']})!=76:
        raise ValueError('The 76-item choice ledger is incomplete')
    return docs,rows

def checked_examples(manifest,records,inputs,descriptors):
    if not isinstance(descriptors,dict)or set(descriptors)!={'core','complete'}:
        raise ValueError('Both exact documentation-example receipts are required')
    fixture=inputs['tests/v2220/feature_examples.json'];book=json.loads(fixture)
    examples=book.get('examples',[]);ids=[row.get('id')for row in examples]
    if book.get('version')!=VERSION or not ids or len(set(ids))!=len(ids):
        raise ValueError('Documentation examples are incomplete')
    source_pin=delivery.pin(inputs['tests/v2220/documentation_examples.cjs'])
    receipts={};captured={}
    for bundle,descriptor in descriptors.items():
        if not isinstance(descriptor,dict)or set(descriptor)!={'receipt','stdout'}:
            raise ValueError('Documentation examples must bind their actual directed execution')
        raw=descriptor_bytes(descriptor['receipt']);stdout=descriptor_bytes(descriptor['stdout'])
        receipt=json.loads(raw);summary=json.loads(stdout)
        name=f'RevisaWiki_{STEM}'+('_completo.js'if bundle=='complete'else'.js')
        attempts=[row for row in records['DIRECTED_QA.json'].get('attempts',[])if row.get('suite')=='tests/v2220/documentation_examples.cjs'and row.get('bundle')==name]
        if len(attempts)!=1:raise ValueError('The directed documentation run is missing or duplicated')
        attempt=attempts[0]
        if attempt.get('status')!='passed'or attempt.get('exitCode')!=0 or attempt.get('sourceUnchanged')is not True or attempt.get('testUnchanged')is not True or attempt.get('bundleSha256')!=manifest['files'][name]['sha256']or attempt.get('testSha256')!=source_pin['sha256']or attempt.get('stdoutSha256')!=delivery.sha(stdout):
            raise ValueError('The documentation execution is stale or did not pass')
        rows=receipt.get('rows',[])
        if receipt.get('passed')is not True or receipt.get('failures')!=[]or receipt.get('wikipediaWrites')!=0 or receipt.get('runtimeSha256')!=manifest['files'][name]['sha256']or receipt.get('fixtureSha256')!=delivery.sha(fixture)or receipt.get('examples')!=len(ids)or [row.get('id')for row in rows]!=ids or any(row.get('passed')is not True for row in rows):
            raise ValueError('The full documentation-example receipt is incomplete or stale')
        expected={key:receipt[key]for key in ('suite','checks','calculations','examples','failures')}
        if summary!=expected or attempt.get('checks')!=receipt['checks']or attempt.get('calculations')!=receipt['calculations']:
            raise ValueError('The full documentation receipt differs from the directed result')
        receipts[bundle]={'receiptSha256':delivery.sha(raw),'stdoutSha256':delivery.sha(stdout),'examplesPassed':len(ids),'checks':receipt['checks'],'calculations':receipt['calculations']}
        captured[Path(descriptor['receipt']['path'])]=raw;captured[Path(descriptor['stdout']['path'])]=stdout
    return examples,receipts,captured

def checked_demonstration(manifest,records,preview):
    if not isinstance(preview,dict)or set(preview)!={'path'}:raise ValueError('The exact tested private preview directory is required')
    path=Path(preview['path']);offline=records['INFERENCE_AND_DEMO.json'].get('offlineDemonstration',{})
    artifacts=offline.get('artifactPins');node=offline.get('node',{})
    expected={f'Demonstracao_RevisaWiki_{STEM}.html',f'RevisaWiki_{STEM}_completo.js'}|{'Demonstracao/'+name for name in ('DEMONSTRACAO.html','demonstracao.css','demonstracao.js','motor.js','exemplos.json')}
    if not isinstance(artifacts,dict)or set(artifacts)!=expected:raise ValueError('Every tested demonstration payload must be pinned')
    captured={}
    for name,pin in artifacts.items():
        file=path/name
        if file.is_symlink():raise ValueError('A demonstration preview payload is a symlink')
        captured[file]=delivery.check_pin(file,pin)
    fixture_raw=(ROOT/'tests/v2220/demo_examples.json').read_bytes();fixture=json.loads(fixture_raw)
    if not isinstance(fixture,list)or len(fixture)!=170 or len({row.get('id')for row in fixture})!=170:
        raise ValueError('The 170-example demonstration fixture is incomplete')
    engine=f'RevisaWiki_{STEM}_completo.js';portable=f'Demonstracao_RevisaWiki_{STEM}.html'
    if artifacts[engine]!=manifest['files'][engine]or offline.get('fixtureSha256')!=delivery.sha(fixture_raw)or offline.get('portableSha256')!=artifacts[portable]['sha256']or node.get('examples')!=170 or node.get('networkRequests')!=0 or node.get('wikipediaWrites')!=0:
        raise ValueError('The offline demonstration does not bind this engine and fixture')
    file_record=records['FILE_DEMONSTRATION.json']
    if file_record.get('portableSha256')!=artifacts[portable]['sha256']or file_record.get('fixtureSha256')!=delivery.sha(fixture_raw)or file_record.get('engineSha256')!=manifest['files'][engine]['sha256']:
        raise ValueError('The file demonstration belongs to a different payload')
    for browsers,mode in ((offline.get('nativeBrowsers'),'HTTP'),(file_record.get('nativeBrowsers'),'file')):
        if not isinstance(browsers,list)or {row.get('browser','').lower()for row in browsers}!={'chrome','firefox','safari'}or len(browsers)!=3:
            raise ValueError('The three native demonstration browsers are required')
        if any(row.get('status')!='passed'or row.get('menuExamples')!=170 or row.get('ownedBrowserSessionClosed')is not True or row.get('wikipediaWrites')!=0 or row.get('externalRequests')!=0 or row.get('networkMutations')!=0 or(mode=='file'and row.get('localHttpNavigationRequests')!=0)for row in browsers):
            raise ValueError('Native demonstration validation is incomplete')
    # The final builder has no QA-dependent payload substitutions. Rebuilding
    # only the demo in a temporary directory checks that this exact preview is
    # the payload it will produce, without executing its embedded engine.
    scripts=str(ROOT/'scripts');sys.path.insert(0,scripts)
    try:
        builder=module('summary_demo_builder','build_demo_v2220.py')
        builder.ROOT=ROOT;builder.DIST=ROOT/'dist'/VERSION
        with tempfile.TemporaryDirectory()as directory:
            builder.build_demo(Path(directory),preview=True)
            for name in expected:
                if(Path(directory)/name).read_bytes()!=captured[path/name]:
                    raise ValueError('The current final demo builder differs from the tested preview')
    finally:sys.path.remove(scripts)
    return artifacts,node,captured

def checked_runtime_ui(record):
    browsers=record.get('browsers');interval=record.get('realInterval',{});details=interval.get('details',{})
    if not isinstance(browsers,list)or len(browsers)!=3 or {row.get('browser','').lower()for row in browsers}!={'chrome','firefox','safari'}or any(row.get('ownedBrowserSessionClosed')is not True or type(row.get('checks'))is not int or row['checks']<=0 for row in browsers):
        raise ValueError('The native editor browser checks are incomplete')
    if interval.get('ownedBrowserSessionClosed')is not True or any(details.get(key)is not True for key in ('actualWorkerResultHeld','productionClockAndCodeUnmodified','draftPreservedWhileWaiting'))or type(details.get('elapsedMilliseconds'))is not int or details['elapsedMilliseconds']<=60000:
        raise ValueError('The real no-fixed-deadline preservation check is incomplete')

def checked_evidence_sources(manifest,records):
    pins={};captured={}
    def retain(name,expected):
        file=delivery.checked_repository_path(name,'validation source')
        raw=delivery.check_pin(file,expected)
        if name in pins and pins[name]!=expected:raise ValueError('Conflicting validation source pins')
        pins[name]=expected;captured[file]=raw
    for record in records.values():
        for field in ('sourcePins','suiteAndDemonstrationSourcePins','harnessPins','testSourcePins'):
            for name,expected in record.get(field,{}).items():retain(name,expected)
    directed=records['DIRECTED_QA.json'];attempts=directed.get('attempts')
    if not isinstance(attempts,list)or not attempts or directed.get('groups')!=len(attempts):
        raise ValueError('The directed execution ledger is incomplete')
    for row in attempts:
        name=row.get('suite');file=delivery.checked_repository_path(name,'directed suite');raw=file.read_bytes()
        if delivery.sha(raw)!=row.get('testSha256')or row.get('sourceUnchanged')is not True or row.get('testUnchanged')is not True or manifest['files'].get(row.get('bundle'),{}).get('sha256')!=row.get('bundleSha256'):
            raise ValueError('A directed runtime or suite is stale')
        retain(name,delivery.pin(raw))
        if row.get('status')=='passed'and row.get('exitCode')==0:continue
        qualification=row.get('preferenceQualification')
        if row.get('status')!='failed'or not isinstance(qualification,dict)or qualification.get('status')!='passed-with-separate-proof'or qualification.get('rawResultRetained')is not True:
            raise ValueError('A directed failure has no retained finite qualification')
        matches=[candidate for candidate in attempts if candidate.get('suite')==qualification.get('suite')and candidate.get('bundle')==row.get('bundle')and candidate.get('status')=='passed'and candidate.get('exitCode')==0 and candidate.get('testSha256')==qualification.get('testSha256')]
        if len(matches)!=1:raise ValueError('The exact directed qualification did not pass')
    return pins,captured

def assemble(config):
    if not isinstance(config,dict)or set(config)!={'runtimeManifestSha256','inputPins','documentationExampleReceipts','demonstrationPreview'}:
        raise ValueError('The private summary config must bind every required input')
    manifest_path=ROOT/'tests/expected_release_v2220.json';manifest_raw,manifest=aggregate.checked_manifest(manifest_path,config['runtimeManifestSha256'])
    if len(manifest.get('sourceInputs',{}))!=26:raise ValueError('Every one of the 26 final runtime source inputs is required')
    limits=manifest.get('limits',{})
    if limits.get('calculationDeadlineMilliseconds','missing')is not None or limits.get('fixedAnalysisDeadline')is not False:
        raise ValueError('A fixed product deadline remains')
    if not isinstance(config['inputPins'],dict)or set(config['inputPins'])!=required_inputs():
        raise ValueError('The exact complete final input set is required')
    captured={manifest_path:manifest_raw};inputs={}
    for name,pin in config['inputPins'].items():
        file=delivery.checked_repository_path(name,'summary input');raw=delivery.check_pin(file,pin)
        captured[file]=raw;inputs[name]=raw
    for name,pin in manifest['sourceInputs'].items():
        file=delivery.checked_repository_path(name,'runtime input');captured[file]=delivery.check_pin(file,pin)
    for name,pin in manifest['files'].items():
        file=ROOT/'dist'/VERSION/name;captured[file]=delivery.check_pin(file,pin)
        if not name.endswith('_completo.js')and pin['bytes']>=2097152:raise ValueError('An installable page exceeds its size limit')
    # Closed CORPUS and every other class are checked before creating a passing
    # record, processing private receipts or generating temporary demo assets.
    docs_pins={name:delivery.pin(inputs[f'docs/{VERSION}/'+name])for name in DOCUMENTS}
    evidence_pins={name:delivery.pin(raw)for name,raw in inputs.items()}
    evidence_pins.update(manifest['sourceInputs'])
    validation_qa={'documentationInputs':docs_pins,'evidencePins':evidence_pins}
    evidence_raw={name:raw for name,raw in inputs.items()if name.startswith(f'tests/evidence/{VERSION}/')}
    records=delivery.checked_validation_evidence(manifest,delivery.sha(manifest_raw),validation_qa,evidence_raw)
    for name,record in records.items():aggregate.checked_public_record(name,record)
    source_pins,source_raw=checked_evidence_sources(manifest,records)
    evidence_pins.update(source_pins);captured.update(source_raw)
    docs,features=checked_documentation(manifest,delivery.sha(manifest_raw),inputs)
    packed=module('summary_packed_presave','check_wiki_presave_v2220.py')
    native=module('summary_native_presave','check_runtime_presave_v2220.py')
    packed_raw=inputs[f'tests/evidence/{VERSION}/PRESAVE_ROUNDTRIP.json'];native_raw=inputs[f'tests/evidence/{VERSION}/NATIVE_INSTALLABLE_SCRIPTS.json']
    packed.validate_receipt(json.loads(packed_raw),manifest_path,ROOT/'dist'/VERSION/f'RevisaWiki_{STEM}_dados.js')
    native.validate_receipt(json.loads(native_raw),manifest_path)
    examples,example_proofs,private=checked_examples(manifest,records,inputs,config['documentationExampleReceipts']);captured.update(private)
    artifacts,node,private=checked_demonstration(manifest,records,config['demonstrationPreview']);captured.update(private)
    checked_runtime_ui(records['NATIVE_EDITOR_UI.json'])
    closure=records['INFERENCE_AND_DEMO.json'].get('plannerActionClosure',{}).get('perBundle')
    if not isinstance(closure,list)or len(closure)!=2 or {row.get('bundle')for row in closure}!={'core','complete'}or any(row.get('disagreements')!=0 or row.get('captureProblems')!=0 or row.get('inputsUnchanged')is not True or row.get('heldControlIsNormalizationPass')is not False or row.get('observedCases')!=row.get('normalizationClosurePassed',-1)+row.get('invalidContextControlHeld',-1)for row in closure):
        raise ValueError('Action closure has unresolved or miscounted controls')
    directed=records['DIRECTED_QA.json'];legacy=records['LEGACY_QA.json'];corpus=records['CORPUS_QA.json']
    portable=f'Demonstracao_RevisaWiki_{STEM}.html'
    qa={
        'version':VERSION,'status':'passed-with-documented-limits'if corpus['status']=='passed-with-documented-limits'else'passed',
        'runtimeManifestSha256':delivery.sha(manifest_raw),'frozenFiles':copy.deepcopy(manifest['files']),
        'sourceInputs':copy.deepcopy(manifest['sourceInputs']),'releaseGatesPassed':True,
        'workerDeadlineMilliseconds':None,'fixedAnalysisDeadline':False,'unresolvedIncorrectWrites':0,'wikipediaWrites':0,
        'presaveRoundtripSha256':delivery.sha(packed_raw),'nativeInstallableRoundtripSha256':delivery.sha(native_raw),
        'evidencePins':evidence_pins,'documentationInputs':docs_pins,
        'planCoverageSha256':delivery.sha(inputs[f'tests/evidence/{VERSION}/PLAN_COVERAGE.json']),
        'coverageSha256':delivery.sha(inputs['tests/v2212/coverage_all.json']),
        'documentedFeaturesSha256':delivery.sha(docs['Funcionalidades_RevisaWiki_2_22_0.json']),
        'documentedFeatureCount':len(features),'inheritedFeatureIdsPreserved':170,
        'documentationExamplesSha256':delivery.sha(inputs['tests/v2220/feature_examples.json']),
        'documentationExamples':len(examples),'documentationExamplesPassed':len(examples),
        'documentationExampleReceipts':example_proofs,
        'demonstrationFixtureSha256':delivery.sha(inputs['tests/v2220/demo_examples.json']),
        'demonstrationExamples':node['examples'],'demonstrationPortableSha256':artifacts[portable]['sha256'],
        'demonstrationAssets':{name:pin for name,pin in artifacts.items()if name.startswith('Demonstracao/')},
        'validationCounts':{
            'directed':{key:directed[key]for key in ('groups','checks','cases')},
            'legacy':{key:legacy[key]for key in ('rawTasks','rawPassedTasks','rawFailedTasksRetained','qualifiedRawFailedTasks','unqualifiedRawFailedTasks','qualificationChecks','qualificationCurrentCalculateCalls','qualificationHistoricalBaselineCalculateCalls','biographyUnchangedSafeRefusalAutomaticCorrectionCredit')},
            'plannerActionClosure':[{key:row[key]for key in ('bundle','observedCases','positiveFixtures','noopControls','normalizationClosurePassed','pureLocalPasses','sourceEvidenceInvalidationConditionedPasses','invalidContextControlHeld','heldControlIsNormalizationPass')}for row in closure],
            'demonstrationNode':copy.deepcopy(node),'corpus':copy.deepcopy(corpus.get('counts',{})),
            'nativeDocumentationExamples':422,
        },
        'countingNotes':[
            'Counts retain their evidence class and are not added into a unique-article or defect total.',
            'Inference directed cases, documentation examples and the directed demo execution are subsets of the directed run, not additional execution credit.',
            'Held invalid-context controls and unchanged safe refusals are not normalization passes or automatic corrections.',
            'Historical baseline calculations and qualified retained raw failures remain separate from current-runtime passes.',
        ],
        'finalArchivePrivacyReviewRequiredSeparately':True,'finalArchivePrivacyReviewIncluded':False,
    }
    aggregate.assert_public(qa)
    for file,raw in captured.items():
        if file.read_bytes()!=raw:raise ValueError('A summary input changed during validation')
    return qa,captured

def write_summary(config,output,archive=None):
    qa,captured=assemble(config);raw=delivery.raw_json(qa);output=Path(output)
    for file,value in captured.items():
        if file.read_bytes()!=value:raise ValueError('A summary input changed before publication')
    if output.exists()and output.read_bytes()!=raw:
        if archive is None:raise ValueError('Preserve the previous QA bytes before replacement')
        archive=Path(archive).resolve()
        if archive==ROOT.resolve()or ROOT.resolve()in archive.parents:raise ValueError('Historical QA must be archived outside the public repository')
        prior=output.read_bytes();archive.mkdir(parents=True,exist_ok=True)
        target=archive/('QA_SUMMARY_'+delivery.sha(prior)+'.json')
        if target.exists()and target.read_bytes()!=prior:raise ValueError('Historical QA archive changed')
        target.write_bytes(prior)
    output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=output.parent,prefix='.qa-',delete=False)as stream:
        temporary=Path(stream.name);stream.write(raw)
    try:
        for file,value in captured.items():
            if file.read_bytes()!=value:raise ValueError('A summary input changed before publication')
        temporary.replace(output)
        if output.read_bytes()!=raw:raise ValueError('The written summary differs from its frozen bytes')
    finally:
        if temporary.exists():temporary.unlink()
    return {'version':VERSION,'runtimeManifestSha256':qa['runtimeManifestSha256'],'summary':delivery.pin(raw),'wikipediaWrites':0}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config',type=Path,required=True)
    parser.add_argument('--output',type=Path,default=ROOT/f'tests/evidence/{VERSION}/QA_SUMMARY.json')
    parser.add_argument('--archive',type=Path)
    args=parser.parse_args()
    print(json.dumps(write_summary(json.loads(args.config.read_bytes()),args.output,args.archive),indent=2))

if __name__=='__main__':main()
