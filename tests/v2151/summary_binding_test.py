"""Synthetic receipt tests. No network, editor names or article fixtures."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('release_summary', ROOT / 'scripts/summarize_v2151.py')
summary = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(summary)
CORE, FULL, DATA = summary.CORE, summary.COMPLETE, summary.DATA
PAYLOADS = {CORE:b'current core', FULL:b'current complete', DATA:b'current data', 'Loader.js':b'loader'}
FILES = {name:{'bytes':len(value),'sha256':summary.sha(value)} for name,value in PAYLOADS.items()}
MANIFEST = {'version':'2.15.1','files':FILES}
RAW = json.dumps(MANIFEST).encode()
PIN = summary.sha(RAW)
STALE = '0' * 64


def named(name=CORE, key='file'):
    return {key:name,'sha256':FILES[name]['sha256']}


def passed(**extra):
    return dict({'status':'passed', 'version':'2.15.1', 'cases':1, 'checks':3,
                 'failures':[], 'wikipediaWrites':0}, **extra)


class ReceiptBinding(unittest.TestCase):
    def check(self, row, expected=(CORE,)):
        return summary.validate_receipt(row, MANIFEST, PIN, expected)

    def reject(self, row, expected=(CORE,)):
        with self.assertRaises(ValueError):
            self.check(row, expected)

    def test_supported_current_formats(self):
        rows = [passed(bundles=[named()]), passed(bundles=[named(key='name')]),
                passed(bundles=[{'file':CORE,'runtimeSha256':FILES[CORE]['sha256'],'catalogSha256':FILES[DATA]['sha256'],'actualVersion':'2.15.1'}]),
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
        for key,value in [('status','failed'),('failures',['failure']),('failed',1),('wikipediaWrites',1),
                          ('cases',[{'passed':False}]),('cases',[{'status':'failed'}])]:
            self.reject(dict(base,**{key:value}))

    def test_collect_rejects_stale_without_overwriting_existing_summary(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'tests').mkdir()
            (root/'tests/expected_release_v2151.json').write_bytes(RAW)
            runtime=root/'dist/2.15.1';runtime.mkdir(parents=True)
            for name,value in PAYLOADS.items():(runtime/name).write_bytes(value)
            out=root/'artifacts/v2151';target=out/'final/modular';target.mkdir(parents=True)
            (target/'infobox_order_cases.json').write_text(json.dumps(passed(bundles=[{'file':CORE,'sha256':STALE}])))
            old=out/'QA_SUMMARY.json';old.write_text('previous summary remains untouched')
            with self.assertRaisesRegex(ValueError,'Stale'):
                summary.collect(root)
            self.assertEqual(old.read_text(),'previous summary remains untouched')
            self.assertFalse((out/'QA_SUMMARY.json.tmp').exists())
            (runtime/CORE).write_bytes(b'changed after freeze')
            with self.assertRaisesRegex(ValueError,'Current runtime'):
                summary.collect(root)

    def test_complete_synthetic_collection_keeps_prose_commas(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'tests').mkdir()
            (root/'tests/expected_release_v2151.json').write_bytes(RAW)
            runtime=root/'dist/2.15.1';runtime.mkdir(parents=True)
            for name,value in PAYLOADS.items():(runtime/name).write_bytes(value)
            out=root/'artifacts/v2151'
            new=['infobox_order_cases','field_syntax','image_alt_cases','biography_lead_cases',
                 'retained_count_cases','independent_cases','adversarial_release','safeguard_cases','native_image_cases']
            previous={'reader_test':'result','reader_native':'result','reader_independent':'result',
                      'template_test':'template_definition','style_test':'style','identity_boundary':'result',
                      'quote_alignment':'quote_alignment','prose_spacing':'prose_spacing','quote_native':'quote_native',
                      'spacing_native':'spacing_native','nsrw_test':'nsrw_native_citation','drug_fields':'drug_fields',
                      'drug_import_fields':'drug_import_fields','drug_composition_case':'drug_composition_case',
                      'ui_report':'ui_report','spacing_independent':'spacing_independent'}
            paths=[]
            for mode in ['modular','complete']:
                paths += [out/'final'/mode/(name+'.json') for name in new]
                paths += [out/'final'/mode/name/(file+'.json') for name,file in previous.items()]
            paths += [out/'biography_ui'/browser/'biography_ui.json' for browser in ['chrome','firefox','safari']]
            paths += [out/'image_contract_audit.json',out/'contract_composition.json',out/'rebuild.json']
            receipt=passed(releaseManifestSha256=PIN,frozenFiles=FILES)
            for path in paths:
                path.parent.mkdir(parents=True,exist_ok=True)
                path.write_text(json.dumps(receipt))
            corpus=dict(receipt,phase='final',completedPages=1234,verifiedSourcePages=1234,eligiblePages=1234,
                        plannedPages=1234,newFailures=0,baselineAlsoFailsDifferentEvidence=0,failures=0,
                        preexistingExactFailures=0,biographyBoxesConfirmed=1001,checks=5000,
                        recognizedRedirectPages=20,pagesWithoutRecognizedRedirect=1214)
            (out/'corpus_aggregate.json').write_text(json.dumps(corpus))
            result=summary.collect(root)
            self.assertEqual(result['status'],'passed')
            self.assertEqual(len(result['receipts']),len(paths)+1)
            self.assertTrue(all(item['runtimeBinding']['bundles']==sorted([CORE,FULL]) for item in result['receipts']))
            self.assertIn('1.234 páginas acessíveis do domínio principal, incluindo 1.001',result['portugueseSummary'])
            self.assertIn('20 redirecionamentos reconhecidos',result['portugueseSummary'])
            self.assertNotIn('principal. incluindo',result['portugueseSummary'])
            self.assertFalse((out/'QA_SUMMARY.json').exists(),'Import and collection never write a result by themselves')
            corpus['pagesWithoutRecognizedRedirect']=1213
            (out/'corpus_aggregate.json').write_text(json.dumps(corpus))
            with self.assertRaisesRegex(ValueError,'Redirect coverage differs'):
                summary.collect(root)


if __name__=='__main__':
    unittest.main()
