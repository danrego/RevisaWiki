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
SPEC = importlib.util.spec_from_file_location('release_summary', ROOT / 'scripts/summarize_v2170.py')
summary = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(summary)
CORE, FULL, DATA = summary.CORE, summary.COMPLETE, summary.DATA
PAYLOADS = {CORE:b'current core', FULL:b'current complete', DATA:b'current data', 'Loader.js':b'loader'}
FILES = {name:{'bytes':len(value),'sha256':summary.sha(value)} for name,value in PAYLOADS.items()}
MANIFEST = {'version':'2.17.0','files':FILES}
RAW = json.dumps(MANIFEST).encode()
PIN = summary.sha(RAW)
STALE = '0' * 64


def named(name=CORE, key='file'):
    return {key:name,'sha256':FILES[name]['sha256']}


def passed(**extra):
    return dict({'status':'passed', 'version':'2.17.0', 'cases':1, 'checks':3,
                 'failures':[], 'wikipediaWrites':0}, **extra)


class ReceiptBinding(unittest.TestCase):
    def check(self, row, expected=(CORE,)):
        return summary.validate_receipt(row, MANIFEST, PIN, expected)

    def reject(self, row, expected=(CORE,)):
        with self.assertRaises(ValueError):
            self.check(row, expected)

    def test_supported_current_formats(self):
        rows = [passed(bundles=[named()]), passed(bundles=[named(key='name')]),
                passed(bundles=[{'file':CORE,'runtimeSha256':FILES[CORE]['sha256'],'catalogSha256':FILES[DATA]['sha256'],'actualVersion':'2.17.0'}]),
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

    def collection_fixture(self, root):
        (root/'tests').mkdir()
        (root/'tests/expected_release_v2170.json').write_bytes(RAW)
        runtime=root/'dist/2.17.0';runtime.mkdir(parents=True)
        for name,value in PAYLOADS.items():(runtime/name).write_bytes(value)
        out=root/'artifacts/v2170';out.mkdir(parents=True)
        receipt=passed(releaseManifestSha256=PIN,frozenFiles=FILES)
        (out/'finite.json').write_text(json.dumps(receipt))
        metrics=lambda number:dict(headerCount=number,renderedEntries=number,findingEntries=number,findingFamilies=number,
             proposalEntries=0,proposalGroups=0,proposalOccurrences=0,recoveryEntries=0,rawFindings=number,rawProposals=0)
        alerts=dict(measuredPages=1234,unmeasuredPages=0,baselineVersion='2.16.0',currentVersion='2.17.0',
                    baseline=metrics(10),current=metrics(4),baselinePagesWithReview=5,currentPagesWithReview=2,
                    headerReductionPercent=60,availableEntryReductionPercent=60,noNewGuardFindings=True)
        corpus=dict(receipt,phase='final',completedPages=1234,verifiedSourcePages=1234,eligiblePages=1234,plannedPages=1234,
                    newFailures=0,baselineAlsoFailsDifferentEvidence=0,failures=0,preexistingExactFailures=0,
                    biographyBoxesConfirmed=1001,checks=5000,recognizedRedirectPages=20,
                    pagesWithoutRecognizedRedirect=1214,alertReduction=alerts)
        (out/'corpus_aggregate.json').write_text(json.dumps(corpus))
        plan=dict(schema=1,version='2.17.0',releaseManifestSha256=PIN,
                  groups=[dict(label='Casos sintéticos',receipts=[dict(file='artifacts/v2170/finite.json',expectedBundles=[CORE,FULL])])],
                  corpus='artifacts/v2170/corpus_aggregate.json',provenance=[])
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
            (root/'dist/2.17.0'/CORE).write_bytes(b'changed after freeze')
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
            self.assertIn('próprias opções padrão',result['alertReduction']['portugueseSummary'])
            self.assertIn('rascunho final de cada versão depois dos ajustes',result['alertReduction']['portugueseSummary'])
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
            self.reject(dict(child,version='2.17.0'))
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

    def test_alert_measurement_requires_totals_coverage_and_exact_percentages(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);_,corpus,_=self.collection_fixture(root);alerts=corpus['alertReduction']
            summary.validate_alert_reduction(alerts,1234)
            for field in ['measuredPages','headerReductionPercent','availableEntryReductionPercent','noNewGuardFindings']:
                bad=copy.deepcopy(alerts);bad[field]=False if field=='noNewGuardFindings' else alerts[field]+1
                with self.subTest(field=field),self.assertRaises(ValueError):summary.validate_alert_reduction(bad,1234)
            bad=copy.deepcopy(alerts);bad['current']['findingFamilies']+=1
            with self.assertRaises(ValueError):summary.validate_alert_reduction(bad,1234)
            bad=copy.deepcopy(alerts);bad['current'].pop('rawFindings')
            with self.assertRaises(ValueError):summary.validate_alert_reduction(bad,1234)

    def test_native_browser_binding_preserves_raw_report_hash(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            files=['tests/v217/alert_ui_probe.cjs','tests/v217/alert_cases.cjs','tests/v2130/browser/fixture.js',
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
        receipt={'version':'2.17.0','kind':'synthetic-summary-receipt-validation','status':'passed' if result.wasSuccessful() else 'failed',
                 'toolQaOnly':True,'usesActualCorpus':False,'cases':result.testsRun,
                 'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped),
                 'runnerSha256':digest(Path(__file__).read_bytes()),
                 'summaryUtilitySha256':digest((ROOT/'scripts/summarize_v2170.py').read_bytes()),
                 'traceSha256':digest(trace.getvalue().encode()),'individualAssertionCountRecorded':False,
                 'wikipediaWrites':0,'networkRequests':0}
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(receipt,indent=2)+'\n')
        print(json.dumps({'status':receipt['status'],'cases':receipt['cases'],'failures':receipt['failures'],'errors':receipt['errors']}))
        raise SystemExit(0 if result.wasSuccessful() else 1)
