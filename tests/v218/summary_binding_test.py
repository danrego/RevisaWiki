"""Synthetic receipt tests. No network, editor names or article fixtures."""
import argparse
import copy
import hashlib
import io
import sys
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('release_summary', ROOT / 'scripts/summarize_v2180.py')
summary = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(summary)
CORE, FULL, DATA = summary.CORE, summary.COMPLETE, summary.DATA
PAYLOADS = {CORE:b'current core', FULL:b'current complete', DATA:b'current data', 'Loader.js':b'loader'}
FILES = {name:{'bytes':len(value),'sha256':summary.sha(value)} for name,value in PAYLOADS.items()}
MANIFEST = {'version':'2.18.0','files':FILES}
RAW = json.dumps(MANIFEST).encode()
PIN = summary.sha(RAW)
STALE = '0' * 64


def named(name=CORE, key='file'):
    return {key:name,'sha256':FILES[name]['sha256']}


def passed(**extra):
    return dict({'status':'passed', 'version':'2.18.0', 'cases':1, 'checks':3,
                 'failures':[], 'wikipediaWrites':0}, **extra)


class ReceiptBinding(unittest.TestCase):
    def check(self, row, expected=(CORE,)):
        return summary.validate_receipt(row, MANIFEST, PIN, expected)

    def reject(self, row, expected=(CORE,)):
        with self.assertRaises(ValueError):
            self.check(row, expected)

    def test_supported_current_formats(self):
        rows = [passed(bundles=[named()]), passed(bundles=[named(key='name')]), passed(bundles=[named(key='bundle')]),
                passed(bundles=[{'file':CORE,'runtimeSha256':FILES[CORE]['sha256'],'catalogSha256':FILES[DATA]['sha256'],'actualVersion':'2.18.0'}]),
                passed(runtimeSha256=FILES[CORE]['sha256']), passed(bundleSha256=FILES[CORE]['sha256']),
                passed(releaseManifestSha256=PIN, frozenFiles=FILES),
                passed(manifestSha256=PIN, runtimeFiles=[dict(file=name,byteIdentical=True,**value) for name,value in FILES.items()])]
        for index,row in enumerate(rows):
            with self.subTest(format=index):
                self.assertIn(CORE,self.check(row)['bundles'])

    def test_named_pair_context(self):
        row = passed(runtimeSha256={'core':FILES[CORE]['sha256'],'complete':FILES[FULL]['sha256']})
        self.assertEqual(self.check(row,(CORE,FULL))['bundles'],sorted([CORE,FULL]))
        self.check(passed(bundles=[named(),named(FULL)]),(CORE,FULL))
        self.check(passed(bundles=[named(),named(FULL)]),(FULL,))

    def test_stale_every_supported_format(self):
        rows = [passed(bundles=[{'file':CORE,'sha256':STALE}]),
                passed(bundles=[{'name':CORE,'sha256':STALE}]),
                passed(bundles=[{'file':CORE,'runtimeSha256':STALE}]),
                passed(runtimeSha256=STALE), passed(bundleSha256=STALE),
                passed(runtimeSha256={'core':STALE,'complete':FILES[FULL]['sha256']}),
                passed(releaseManifestSha256=STALE,frozenFiles=FILES),
                passed(manifestSha256=STALE,runtimeFiles=[dict(file=name,byteIdentical=True,**value) for name,value in FILES.items()])]
        for index,row in enumerate(rows):
            with self.subTest(format=index): self.reject(row)

    def test_inventory_hashes_and_sizes(self):
        for name in FILES:
            for key,bad in [('sha256',STALE),('bytes',999)]:
                bad_files=copy.deepcopy(FILES); bad_files[name][key]=bad
                self.reject(passed(releaseManifestSha256=PIN,frozenFiles=bad_files))
                self.reject(passed(manifestSha256=PIN,runtimeFiles=[dict(file=n,byteIdentical=True,**v) for n,v in bad_files.items()]))
        partial=copy.deepcopy(FILES); partial.pop(DATA)
        self.reject(passed(releaseManifestSha256=PIN,frozenFiles=partial))
        rebuild=[dict(file=n,byteIdentical=True,**v) for n,v in FILES.items()]
        self.reject(passed(manifestSha256=PIN,runtimeFiles=rebuild[:-1]))
        duplicate=copy.deepcopy(rebuild); duplicate[-1]=copy.deepcopy(duplicate[0])
        self.reject(passed(manifestSha256=PIN,runtimeFiles=duplicate))
        for key in ['bytes','byteIdentical']:
            rows=copy.deepcopy(rebuild); rows[0].pop(key)
            self.reject(passed(manifestSha256=PIN,runtimeFiles=rows))

    def test_missing_binding_is_never_inferred_from_path_or_cases(self):
        rows=[passed(),passed(baselineSha256=FILES[CORE]['sha256']),passed(cases=[{'bundle':CORE,'passed':True}]),
              passed(bundles=[{'file':CORE}]),passed(releaseManifestSha256=PIN),passed(frozenFiles=FILES)]
        for row in rows:self.reject(row)

    def test_conflicts_are_not_masked_by_valid_evidence(self):
        self.reject(passed(bundles=[named()],bundleSha256=STALE))
        self.reject(passed(bundles=[dict(named(),runtimeSha256=STALE)]))
        self.reject(passed(bundles=[dict(named(),catalogSha256=STALE)]))
        self.reject(passed(bundles=[dict(named(),bytes=999)]))
        self.reject(passed(bundles=[dict(named(),name=FULL)]))
        self.reject(passed(bundles=[named()],releaseManifestSha256=STALE,frozenFiles=FILES))

    def test_bundle_identity_and_context(self):
        self.reject(passed(bundles=[named(FULL)]))
        self.reject(passed(bundles=[named()]),(CORE,FULL))
        self.reject(passed(bundles=[named(),named()]))
        self.reject(passed(bundles=[{'file':'Unknown.js','sha256':FILES[CORE]['sha256']}]))
        self.reject(passed(bundles=[{'file':DATA,'sha256':FILES[DATA]['sha256']}]))
        self.reject(passed(runtimeSha256=FILES[CORE]['sha256']),(CORE,FULL))
        self.reject(passed(runtimeSha256={'core':FILES[CORE]['sha256']}))
        self.reject(passed(runtimeSha256={'core':FILES[CORE]['sha256'],'complete':FILES[FULL]['sha256'],'extra':STALE}))
        self.reject(passed(bundles=[dict(named(),actualVersion='2.15.0')]))
        self.reject(dict(passed(bundles=[named()]),version='2.15.0'))

    def test_adapted_ui_sources_and_partial_evidence(self):
        adaptations=[{'file':n,'sourceSha256':FILES[n]['sha256'],'editingLogicRewritten':False} for n in [CORE,FULL]]
        self.check(passed(bundles=[named(),named(FULL)],productionAdaptations=adaptations),(CORE,FULL))
        bad=copy.deepcopy(adaptations); bad[0]['sourceSha256']=STALE
        self.reject(passed(bundles=[named(),named(FULL)],productionAdaptations=bad),(CORE,FULL))
        bad=copy.deepcopy(adaptations); bad[0]['editingLogicRewritten']=True
        self.reject(passed(bundles=[named(),named(FULL)],productionAdaptations=bad),(CORE,FULL))
        self.reject(passed(bundles=[named(),named(FULL)],productionAdaptations=adaptations[:1]),(CORE,FULL))
        self.reject(passed(bundles=[named()],productionAdaptations=adaptations),(CORE,FULL))
        self.reject(passed(productionAdaptations=adaptations),(CORE,FULL))

    def test_failed_case_or_write_invalidates_current_hash(self):
        base=passed(bundles=[named()])
        for key,value in [('status','failed'),('failures',['failure']),('failed',1),('errors',1),('errors',['actual error']),('wikipediaWrites',1),
                          ('cases',[{'passed':False}]),('cases',[{'status':'failed'}])]:
            self.reject(dict(base,**{key:value}))

    def test_helper_injection_cannot_claim_actual_current_runtime(self):
        for key in ['helperInjected','helperPreview','injectedHelper']:
            self.reject(passed(bundles=[dict(named(),**{key:True})]))
        self.reject(passed(bundles=[named()],helperOnly=True))
        self.check(passed(bundles=[dict(named(),helperInjected=False,helperPreview=False)]))

    def execution_fixture(self,root):
        expected=summary.required_finite_invocations(root)
        self.assertEqual(len(expected),70)
        inventory={'sourceRevision':{'oldid':1,'sha256':'a'*64},'rules':[{'id':index} for index in range(241)]}
        inventory_file=root/'tests/v218/source_coverage_inventory.json';inventory_file.parent.mkdir(parents=True);inventory_file.write_text(json.dumps(inventory))
        runs=[]
        for index,(suite,args,bundles) in enumerate(expected):
            file=root/suite;file.parent.mkdir(parents=True,exist_ok=True)
            if not file.exists():file.write_bytes(('synthetic runner '+suite).encode())
            result=passed(cases=1,checks=2,bundles=[named(name) for name in bundles])
            if suite=='tests/v218/source_coverage_cases.cjs':result.update(originalPureExecution=True,inventorySha256=summary.sha(inventory_file.read_bytes()),recordedRules=241,sourceRevision=inventory['sourceRevision'])
            runs.append(dict(suite=suite,args=list(args),runnerSha256=summary.sha(file.read_bytes()),sourceUnchanged=True,status='passed',exitCode=0,bundles=[named(name) for name in bundles],result=result))
        execution=passed(kind='frozen-finite-release-execution',releaseManifestSha256=PIN,frozenFiles=FILES,runs=runs)
        location=root/'artifacts/v2180/final/execution.json';location.parent.mkdir(parents=True)
        historical=root/'tests/v217/independent_cases.cjs';historical.parent.mkdir(parents=True);historical.write_bytes(b'synthetic historical runner')
        (root/'tests/expected_release_v2180.json').write_bytes(RAW)
        for run in runs:
            if run['suite']=='tests/v218/previous.cjs' and run['args']==['v217','independent_cases']:
                run['result']['cases']=2
                report=passed(kind='independent-composed-safe-repairs',cases=[dict(bundle=name,passed=True) for name in [CORE,FULL]],caseCount=2,checks=2,bundles=[named(),named(FULL)],runnerSha256=summary.sha(historical.read_bytes()))
                sidecar=location.parent/'v217-independent_cases/independent_cases.json';sidecar.parent.mkdir();sidecar.write_text(json.dumps(report))
        location.write_text(json.dumps(execution))
        for index,run in enumerate(runs):
            target=location.parent/str(index)/'bound_result.json';target.parent.mkdir()
            envelope={'suite':run['suite'],'runnerSha256':run['runnerSha256'],'releaseManifestSha256':PIN,'bundles':run['bundles'],'sourceUnchanged':True}
            target.write_text(json.dumps(dict(run['result'],execution=envelope)))
        return execution,location

    def test_required_execution_refuses_omitted_duplicate_and_changed_runs(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);execution,_=self.execution_fixture(root)
            summary.validate_execution(execution,MANIFEST,PIN,[CORE,FULL],root)
            for kind in ['omitted','duplicate','runner','injected']:
                bad=copy.deepcopy(execution)
                if kind=='omitted':bad['runs'].pop()
                elif kind=='duplicate':bad['runs'][-1]=copy.deepcopy(bad['runs'][0])
                elif kind=='runner':bad['runs'][0]['runnerSha256']=STALE
                else:bad['runs'][0]['result']['bundles'][0]['helperInjected']=True
                with self.subTest(kind=kind),self.assertRaises(ValueError):
                    summary.validate_execution(bad,MANIFEST,PIN,[CORE,FULL],root)

    def test_complete_rule_coverage_requires_original_replay_and_inventory_binding(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);execution,_=self.execution_fixture(root)
            for patch in [{'originalPureExecution':False},{'inventorySha256':STALE},{'recordedRules':240},{'sourceRevision':{}}]:
                bad=copy.deepcopy(execution)
                run=next(row for row in bad['runs'] if row['suite']=='tests/v218/source_coverage_cases.cjs')
                run['result'].update(patch)
                with self.subTest(patch=patch),self.assertRaises(ValueError):
                    summary.validate_execution(bad,MANIFEST,PIN,[CORE,FULL],root)

    def test_declared_pair_requires_both_actual_bundles_and_nonempty_cases(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);execution,_=self.execution_fixture(root)
            for kind in ['partial-result-pair','zero-cases']:
                bad=copy.deepcopy(execution)
                run=next(row for row in bad['runs'] if len(row['bundles'])==2)
                if kind=='partial-result-pair':run['result']['bundles'].pop()
                else:run['result']['cases']=0
                with self.subTest(kind=kind),self.assertRaises(ValueError):
                    summary.validate_execution(bad,MANIFEST,PIN,[CORE,FULL],root)

    def test_original_bound_receipts_are_complete_and_unmodified(self):
        for kind in ['omit','tamper']:
            with self.subTest(kind=kind),tempfile.TemporaryDirectory() as folder:
                root=Path(folder);execution,location=self.execution_fixture(root)
                self.assertEqual(len(summary.execution_attachments(location,execution,PIN,root)),71)
                target=location.parent/'0/bound_result.json'
                if kind=='omit':target.unlink()
                else:
                    value=json.loads(target.read_text());value['checks']=999;target.write_text(json.dumps(value))
                with self.assertRaises(ValueError):
                    summary.execution_attachments(location,execution,PIN,root)

    def test_historical_independent_sidecar_proves_both_actual_bundles(self):
        for kind in ['missing','partial-bundle','changed-count','changed-runner']:
            with self.subTest(kind=kind),tempfile.TemporaryDirectory() as folder:
                root=Path(folder);execution,location=self.execution_fixture(root)
                target=location.parent/'v217-independent_cases/independent_cases.json'
                if kind=='missing':target.unlink()
                else:
                    row=json.loads(target.read_text())
                    if kind=='partial-bundle':row['bundles'].pop()
                    elif kind=='changed-count':row['caseCount']=999
                    else:row['runnerSha256']=STALE
                    target.write_text(json.dumps(row))
                with self.assertRaises(ValueError):summary.execution_attachments(location,execution,PIN,root)

    def test_extra_markup_module_requires_its_dedicated_suite(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);helper=root/'src/v2_18/legacy_markup.js';helper.parent.mkdir(parents=True);helper.write_text('synthetic source')
            expected=summary.required_finite_invocations(root)
            self.assertEqual(len(expected),71)
            self.assertTrue(any(row[0]=='tests/v218/legacy_markup_cases.cjs' for row in expected))

    def collection_fixture(self, root):
        (root/'tests').mkdir()
        (root/'tests/expected_release_v2180.json').write_bytes(RAW)
        runtime=root/'dist/2.18.0';runtime.mkdir(parents=True)
        for name,value in PAYLOADS.items():(runtime/name).write_bytes(value)
        out=root/'artifacts/v2180';out.mkdir(parents=True)
        receipt=passed(releaseManifestSha256=PIN,frozenFiles=FILES)
        (out/'finite.json').write_text(json.dumps(receipt))
        corpus=dict(receipt,phase='final',completedPages=1234,verifiedSourcePages=1234,eligiblePages=1234,plannedPages=1234,
                    newFailures=0,baselineAlsoFailsDifferentEvidence=0,failures=0,preexistingExactFailures=0,
                    biographyBoxesConfirmed=1001,checks=5000,recognizedRedirectPages=20,
                    pagesWithoutRecognizedRedirect=1214,reviewParity=dict(checkedPages=1234,unavailablePages=0,matched=True,baselineAlertComparisonMeasured=False))
        (out/'corpus_aggregate.json').write_text(json.dumps(corpus))
        plan=dict(schema=1,version='2.18.0',releaseManifestSha256=PIN,
                  groups=[dict(label='Casos sintéticos',receipts=[dict(file='artifacts/v2180/finite.json',expectedBundles=[CORE,FULL])])],
                  corpus='artifacts/v2180/corpus_aggregate.json',provenance=[])
        (out/'QA_INPUTS.json').write_text(json.dumps(plan))
        return out,corpus,plan

    def test_collect_rejects_stale_without_overwriting_existing_summary(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);out,_,_=self.collection_fixture(root)
            (out/'finite.json').write_text(json.dumps(passed(bundles=[{'file':CORE,'sha256':STALE}])))
            old=out/'QA_SUMMARY.json';old.write_text('previous summary remains untouched')
            with self.assertRaisesRegex(ValueError,'Stale'):
                summary.collect(root)
            self.assertEqual(old.read_text(),'previous summary remains untouched')
            self.assertFalse((out/'QA_SUMMARY.json.tmp').exists())
            (root/'dist/2.18.0'/CORE).write_bytes(b'changed after freeze')
            with self.assertRaisesRegex(ValueError,'Current runtime'):
                summary.collect(root)

    def test_complete_synthetic_collection_keeps_prose_commas(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);out,corpus,_=self.collection_fixture(root)
            result=summary.collect(root)
            self.assertEqual(result['status'],'passed')
            self.assertEqual(len(result['receipts']),2)
            self.assertTrue(all(item['runtimeBinding']['bundles']==sorted([CORE,FULL]) for item in result['receipts']))
            self.assertIn('1.234 páginas acessíveis do domínio principal, incluindo 1.001',result['portugueseSummary'])
            self.assertIn('20 redirecionamentos reconhecidos',result['portugueseSummary'])
            self.assertNotIn('principal. incluindo',result['portugueseSummary'])
            self.assertNotIn('alertReduction',result)
            self.assertEqual(result['reviewParity']['checkedPages'],1234)
            self.assertFalse((out/'QA_SUMMARY.json').exists(),'Import and collection never write a result by themselves')
            corpus['pagesWithoutRecognizedRedirect']=1213
            (out/'corpus_aggregate.json').write_text(json.dumps(corpus))
            with self.assertRaisesRegex(ValueError,'Redirect coverage differs'):
                summary.collect(root)

    def test_input_envelope_cannot_weaken_binding_or_double_count(self):
        for patch in ['stale-manifest','duplicate-receipt','absolute-path','empty-groups']:
            with self.subTest(patch=patch),tempfile.TemporaryDirectory() as folder:
                root=Path(folder);out,_,plan=self.collection_fixture(root)
                if patch=='stale-manifest':plan['releaseManifestSha256']=STALE
                elif patch=='duplicate-receipt':plan['groups'][0]['receipts']*=2
                elif patch=='absolute-path':plan['groups'][0]['receipts'][0]['file']=str(out/'finite.json')
                else:plan['groups']=[]
                (out/'QA_INPUTS.json').write_text(json.dumps(plan))
                with self.assertRaises(ValueError):summary.collect(root)

    def test_missing_status_is_only_allowed_inside_successful_execution(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'tests').mkdir();runner=root/'tests/fixture.cjs';runner.write_bytes(b'synthetic runner')
            child=dict(cases=2,assertions=7,failures=[],wikipediaWrites=0,bundles=[named(),named(FULL)])
            run=dict(suite='tests/fixture.cjs',runnerSha256=summary.sha(runner.read_bytes()),sourceUnchanged=True,
                     status='passed',exitCode=0,bundles=[named(),named(FULL)],result=child)
            execution=passed(releaseManifestSha256=PIN,frozenFiles=FILES,runs=[run])
            binding,cases,checks=summary.validate_execution(execution,MANIFEST,PIN,[CORE,FULL],root)
            self.assertEqual((cases,checks),(2,7));self.assertEqual(binding['bundles'],sorted([CORE,FULL]))
            self.reject(dict(child,version='2.18.0'))
            for patch in ['failed-child','error-child','bad-exit','changed-runner','wrong-bundle']:
                bad=copy.deepcopy(execution)
                if patch=='failed-child':bad['runs'][0]['result']['failures']=['actual failure']
                elif patch=='error-child':bad['runs'][0]['result']['errors']=['actual error']
                elif patch=='bad-exit':bad['runs'][0]['exitCode']=1
                elif patch=='changed-runner':bad['runs'][0]['runnerSha256']=STALE
                else:bad['runs'][0]['bundles'][0]['sha256']=STALE
                with self.subTest(patch=patch),self.assertRaises(ValueError):
                    summary.validate_execution(bad,MANIFEST,PIN,[CORE,FULL],root)
            self.assertNotIn('status',child,'No conversion invents a raw result status')

    def test_unmeasured_alert_reduction_is_never_invented(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);out,corpus,_=self.collection_fixture(root)
            result=summary.collect(root)
            self.assertNotIn('alertReduction',result)
            self.assertEqual(result['reviewParity']['baselineAlertComparisonMeasured'],False)
            corpus['alertReduction']={'unverified':True}
            (out/'corpus_aggregate.json').write_text(json.dumps(corpus))
            with self.assertRaisesRegex(ValueError,'did not measure'):
                summary.collect(root)

    def test_current_review_parity_requires_complete_coverage(self):
        for change in [{'checkedPages':1233},{'matched':False},{'baselineAlertComparisonMeasured':True},{'unavailablePages':-1}]:
            with self.subTest(change=change),tempfile.TemporaryDirectory() as folder:
                root=Path(folder);out,corpus,_=self.collection_fixture(root)
                corpus['reviewParity'].update(change)
                (out/'corpus_aggregate.json').write_text(json.dumps(corpus))
                with self.assertRaisesRegex(ValueError,'review parity'):
                    summary.collect(root)

    def test_native_browser_binding_preserves_raw_report_hash(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            files=['tests/v218/alert_ui_probe.cjs','tests/v217/alert_cases.cjs','tests/v2130/browser/fixture.js',
                   'tests/v2130/browser/fixture.html','tests/v261/browser/native_driver.cjs']
            for filename in files:
                file=root/filename;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(filename.encode())
            row=dict(status='passed',browser='chrome',cases=[{'passed':True}],checks=11)
            raw=json.dumps(row).encode()
            binding=dict(status='passed',browser='chrome',cases=1,checks=11,manifestSha256=PIN,reportSha256=summary.sha(raw),
                         files={name:FILES[name] for name in [CORE,FULL,DATA]},
                         inputs={filename:summary.sha((root/filename).read_bytes()) for filename in files},
                         ownedSessionClosed=True,sourceMutated=False,wikipediaWrites=0)
            summary.validate_browser_binding(binding,raw,row,MANIFEST,PIN,[CORE,FULL],root)
            for patch in ['report','manifest','runtime','input','missing-data']:
                bad=copy.deepcopy(binding)
                if patch=='report':bad['reportSha256']=STALE
                elif patch=='manifest':bad['manifestSha256']=STALE
                elif patch=='runtime':bad['files'][CORE]['sha256']=STALE
                elif patch=='input':bad['inputs'][files[0]]=STALE
                else:bad['files'].pop(DATA)
                with self.subTest(patch=patch),self.assertRaises(ValueError):
                    summary.validate_browser_binding(bad,raw,row,MANIFEST,PIN,[CORE,FULL],root)
            self.assertEqual(json.dumps(row).encode(),raw,'Validation does not rewrite the raw browser report')

    def test_synthetic_utility_requires_actual_source_bindings(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'tests').mkdir();file=root/'tests/tool.py';file.write_bytes(b'synthetic tool')
            row=dict(status='passed',toolQaOnly=True,usesActualCorpus=False,cases=3,checks=5,runnerSha256=summary.sha(file.read_bytes()))
            spec={'sourceBindings':{'runnerSha256':'tests/tool.py'}}
            _,cases,checks=summary.validate_utility(row,spec,root);self.assertEqual((cases,checks),(3,5))
            for patch in [{'runnerSha256':STALE},{'usesActualCorpus':True},{'networkRequests':1},{'errors':1},{'errors':['actual error']}]:
                with self.assertRaises(ValueError):summary.validate_utility(dict(row,**patch),spec,root)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path)
    args,remaining=parser.parse_known_args()
    if args.output is None:
        unittest.main(argv=[sys.argv[0]]+remaining)
    else:
        parser.error('Only --output is accepted with the JSON receipt') if remaining else None
        trace=io.StringIO()
        suite=unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
        result=unittest.TextTestRunner(stream=trace,verbosity=1).run(suite)
        digest=lambda data:hashlib.sha256(data).hexdigest()
        receipt={'version':'2.18.0','kind':'synthetic-summary-receipt-validation','status':'passed' if result.wasSuccessful() else 'failed',
                 'toolQaOnly':True,'usesActualCorpus':False,'cases':result.testsRun,
                 'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped),
                 'runnerSha256':digest(Path(__file__).read_bytes()),
                 'summaryUtilitySha256':digest((ROOT/'scripts/summarize_v2180.py').read_bytes()),
                 'traceSha256':digest(trace.getvalue().encode()),'individualAssertionCountRecorded':False,
                 'wikipediaWrites':0,'networkRequests':0}
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(receipt,indent=2)+'\n')
        print(json.dumps({'status':receipt['status'],'cases':receipt['cases'],'failures':receipt['failures'],'errors':receipt['errors']}))
        raise SystemExit(0 if result.wasSuccessful() else 1)
