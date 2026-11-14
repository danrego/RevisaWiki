"""The archive reads exact reviewed document bytes, not an earlier path check."""
from pathlib import Path
import importlib.util
import copy
import json
import tempfile
import unittest
from unittest import mock

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('delivery2220',ROOT/'scripts/build_delivery_v2220.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)

class DocumentationFreeze(unittest.TestCase):
    def test_document_content_race_is_rejected(self):
        with tempfile.TemporaryDirectory()as folder,mock.patch.object(builder,'DOCS',Path(folder)):
            target=Path(folder)/'manual.txt';target.write_bytes(b'Frozen text.\n')
            qa={'documentationInputs':{'manual.txt':builder.pin(target.read_bytes())}}
            self.assertEqual(builder.frozen_documentation(qa),{'manual.txt':b'Frozen text.\n'})
            target.write_bytes(b'Changed after initial QA.\n')
            with self.assertRaises(ValueError):builder.frozen_documentation(qa)

    def test_unexpected_missing_and_unpinned_documents_are_rejected(self):
        with tempfile.TemporaryDirectory()as folder,mock.patch.object(builder,'DOCS',Path(folder)):
            target=Path(folder)/'manual.txt';target.write_bytes(b'Frozen text.\n')
            qa={'documentationInputs':{'manual.txt':builder.pin(target.read_bytes())}}
            extra=Path(folder)/'extra.txt';extra.write_bytes(b'Unreviewed.')
            with self.assertRaises(ValueError):builder.frozen_documentation(qa)
            extra.unlink();target.unlink()
            with self.assertRaises(ValueError):builder.frozen_documentation(qa)
            for bad in ({},{'documentationInputs':{}},{'documentationInputs':None}):
                with self.subTest(bad=bad),self.assertRaises(ValueError):builder.frozen_documentation(bad)

class PackagedInputFreeze(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        self.dist=self.root/'dist';self.evidence=self.root/'evidence'
        self.dist.mkdir();self.evidence.mkdir()
        self.patches=[mock.patch.object(builder,key,value)for key,value in
                      [('ROOT',self.root),('DIST',self.dist),('EVIDENCE',self.evidence)]]
        for patch in self.patches:patch.start()
        self.contents={
            self.root/'tests/expected_release_v2220.json':b'{"frozen":"runtime manifest"}\n',
            self.root/'LICENSE':b'Frozen license.\n',
            self.root/'THIRD_PARTY_NOTICES_2_22_0.md':b'Frozen notices.\n',
            self.evidence/'PLAN_COVERAGE.json':b'{"frozen":"plan"}\n',
            self.evidence/'NATIVE_INSTALLABLE_SCRIPTS.json':b'{"frozen":"native receipt"}\n',
        }
        for path,raw in self.contents.items():path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
        self.qa={
            'runtimeManifestSha256':builder.sha(self.contents[self.root/'tests/expected_release_v2220.json']),
            'planCoverageSha256':builder.sha(self.contents[self.evidence/'PLAN_COVERAGE.json']),
            'nativeInstallableRoundtripSha256':builder.sha(self.contents[self.evidence/'NATIVE_INSTALLABLE_SCRIPTS.json']),
            'evidencePins':{name:builder.pin(self.contents[self.root/name])for name in ['LICENSE','THIRD_PARTY_NOTICES_2_22_0.md']},
        }
        self.qa_raw=b'{"frozen":"qa"}\n';self.receipt=b'{"frozen":"presave receipt"}\n';self.coverage={'items':[{'id':'frozen'}]}

    def tearDown(self):
        for patch in reversed(self.patches):patch.stop()
        self.temp.cleanup()

    def capture(self):return builder.frozen_package_inputs(self.qa,self.qa_raw,self.receipt,self.coverage)

    def test_every_reopened_package_input_rejects_a_changed_payload(self):
        for path,raw in self.contents.items():
            with self.subTest(name=path.name):
                self.capture()
                path.write_bytes(raw+b'Changed after first validation.\n')
                with self.assertRaises(ValueError):self.capture()
                path.write_bytes(raw)

    def test_package_map_contains_only_exact_captured_bytes(self):
        captured=self.capture()
        self.assertEqual(captured['MANIFESTO_RUNTIME.json'],self.contents[self.root/'tests/expected_release_v2220.json'])
        self.assertEqual(captured['QA_SUMMARY.json'],self.qa_raw)
        self.assertEqual(captured['PRESAVE_ROUNDTRIP.json'],self.receipt)
        self.assertEqual(captured['COVERAGE.json'],builder.raw_json(self.coverage))
        for path in self.contents:path.write_bytes(b'A later replacement must never enter the captured map.')
        self.coverage['items'].append({'id':'later'})
        self.assertTrue(all(isinstance(raw,bytes)for raw in captured.values()))
        self.assertEqual(json.loads(captured['COVERAGE.json']),{'items':[{'id':'frozen'}]})
        self.assertEqual(captured['LICENSE'],b'Frozen license.\n')

    def test_portable_demonstration_is_read_once_and_the_checked_bytes_are_returned(self):
        demo=self.dist/f'Demonstracao_RevisaWiki_{builder.STEM}.html';raw=b'<html>Frozen demo.</html>\n';demo.write_bytes(raw)
        asset=self.dist/'Demonstracao/motor.js';asset.parent.mkdir();asset.write_bytes(b'Frozen adapter.\n')
        qa={'demonstrationPortableSha256':builder.sha(raw),'demonstrationAssets':{'Demonstracao/motor.js':builder.pin(asset.read_bytes())}}
        original=Path.read_bytes;reads=[]
        def read(path):
            reads.append(path)
            if path==demo and reads.count(demo)>1:return b'Unverified replacement.'
            return original(path)
        with mock.patch.object(Path,'read_bytes',autospec=True,side_effect=read):name,payloads=builder.frozen_demonstration(qa)
        self.assertEqual(name,demo.name);self.assertEqual(reads.count(demo),1);self.assertEqual(payloads[name],raw)
        demo.write_bytes(b'Changed demo.')
        with self.assertRaises(ValueError):builder.frozen_demonstration(qa)
        demo.write_bytes(raw);asset.write_bytes(b'Changed adapter.')
        with self.assertRaises(ValueError):builder.frozen_demonstration(qa)

class WrittenPayloadFreeze(unittest.TestCase):
    def test_documentation_scripts_and_archive_are_written_byte_exact(self):
        with tempfile.TemporaryDirectory()as folder:
            root=Path(folder);payloads={'manual.wiki':'Texto com acentuação.\n'.encode(),'code.js':b'const n=1;\n','Demonstracao/motor.js':b'worker;\n','release.zip':b'PK\x00\x01'}
            builder.write_frozen_payloads(root,payloads)
            self.assertEqual({name:(root/name).read_bytes()for name in payloads},payloads)

    def test_change_to_an_earlier_written_document_is_detected(self):
        with tempfile.TemporaryDirectory()as folder:
            root=Path(folder);payloads={'manual.wiki':b'Frozen documentation.\n','code.js':b'Frozen program.\n'};original=Path.write_bytes
            def write(path,raw):
                result=original(path,raw)
                if path.name=='code.js':original(root/'manual.wiki',b'Changed during delivery.')
                return result
            with mock.patch.object(Path,'write_bytes',autospec=True,side_effect=write),self.assertRaises(ValueError):
                builder.write_frozen_payloads(root,payloads)

class ValidationEvidenceFreeze(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        self.patch=mock.patch.object(builder,'ROOT',self.root);self.patch.start()
        self.source='src/v2_22/example.js';source=self.root/self.source;source.parent.mkdir(parents=True);source.write_bytes(b'Frozen source.\n')
        self.test='tests/example.cjs';test=self.root/self.test;test.parent.mkdir(parents=True);test.write_bytes(b'Frozen test.\n')
        self.manifest={'files':{'core.js':builder.pin(b'core'),'data.js':builder.pin(b'data')},'sourceInputs':{self.source:builder.pin(source.read_bytes())}}
        self.manifest_sha='a'*64
        self.qa={'evidencePins':{},'documentationInputs':{f'Documentacao_RevisaWiki_{builder.STEM}.wiki':builder.pin(b'Frozen manual.\n')}}
        self.records={name:{'version':builder.VERSION,'status':'passed','wikipediaWrites':0,field:self.manifest_sha}for name,field in builder.REQUIRED_RUNTIME_EVIDENCE.items()}
        self.records['BUILD_REPRODUCTION.json']['files']=copy.deepcopy(self.manifest['files'])
        self.records['INFERENCE_AND_DEMO.json'].update(runtimeFiles=copy.deepcopy(self.manifest['files']),runtimeSourceInputs=copy.deepcopy(self.manifest['sourceInputs']),suiteAndDemonstrationSourcePins={self.test:builder.pin(test.read_bytes())})
        self.records['LEGACY_QA.json'].update(status='passed-with-precisely-qualified-historical-contracts',unqualifiedRawFailedTasks=0,historicalTestsAndRawReportsModified=False,runtimeOrPreservationChecksChanged=False,runtimeFiles={'core.js':self.manifest['files']['core.js']},sourcePins={**self.manifest['sourceInputs'],self.test:builder.pin(test.read_bytes())})
        self.records['CORPUS_QA.json'].update(status='passed-with-documented-limits',remainingCaptures=0,unresolvedIntegrityDefects=0,historicalStatusesChanged=False,preservationGuardsRemoved=False)
        self.records['NATIVE_DOCUMENTATION.json']={'version':builder.VERSION,'status':'passed','wikipediaWrites':0,'authenticated':False,'sourceSha256':self.qa['documentationInputs'][f'Documentacao_RevisaWiki_{builder.STEM}.wiki']['sha256'],'renderedCodeExamples':{'examples':422,'allCodeBodiesByteExact':True,'ownedBrowserSessionClosed':True,'textOnlyScope':True}}

    def tearDown(self):self.patch.stop();self.temp.cleanup()

    def check(self,records=None,manifest_sha=None,missing_pin=None):
        selected=self.records if records is None else records
        raw={f'tests/evidence/{builder.VERSION}/'+name:builder.raw_json(value)for name,value in selected.items()}
        self.qa['evidencePins']={name:builder.pin(value)for name,value in raw.items()if name!=missing_pin}
        return builder.checked_validation_evidence(self.manifest,manifest_sha or self.manifest_sha,self.qa,raw)

    def test_all_required_classes_bind_the_current_runtime_and_manual(self):
        self.assertEqual(set(self.check()),set(self.records))
        self.records['CORPUS_QA.json']['status']='passed';self.records['LEGACY_QA.json']['status']='passed'
        self.assertEqual(set(self.check()),set(self.records))

    def test_each_missing_or_unpinned_required_class_is_rejected(self):
        for name in self.records:
            with self.subTest(name=name):
                selected=copy.deepcopy(self.records);del selected[name]
                with self.assertRaises(ValueError):self.check(selected)
                with self.assertRaises(ValueError):self.check(missing_pin=f'tests/evidence/{builder.VERSION}/'+name)

    def test_stale_runtime_records_fail_even_when_their_outer_pins_are_updated(self):
        for name,field in builder.REQUIRED_RUNTIME_EVIDENCE.items():
            with self.subTest(name=name):
                selected=copy.deepcopy(self.records);selected[name][field]='b'*64
                with self.assertRaises(ValueError):self.check(selected)
        # Switching the valid runtime manifest cannot qualify all old receipts.
        with self.assertRaises(ValueError):self.check(manifest_sha='c'*64)
        selected=copy.deepcopy(self.records);selected['DIRECTED_QA.json']['runtimeManifestSha256']='d'*64
        with self.assertRaises(ValueError):self.check(selected)

    def test_failed_unknown_or_malformed_statuses_are_rejected(self):
        for name in self.records:
            for status in ['failed','passed-with-unqualified-errors','',None,True,[]]:
                with self.subTest(name=name,status=status):
                    selected=copy.deepcopy(self.records);selected[name]['status']=status
                    with self.assertRaises(ValueError):self.check(selected)

    def test_exposed_runtime_and_source_pin_mismatches_are_rejected(self):
        for name,field,key in [('BUILD_REPRODUCTION.json','files','core.js'),('INFERENCE_AND_DEMO.json','runtimeFiles','core.js'),('LEGACY_QA.json','runtimeFiles','core.js'),('INFERENCE_AND_DEMO.json','runtimeSourceInputs',self.source),('LEGACY_QA.json','sourcePins',self.source)]:
            with self.subTest(name=name,field=field):
                selected=copy.deepcopy(self.records);selected[name][field][key]['sha256']='e'*64
                with self.assertRaises(ValueError):self.check(selected)
        selected=copy.deepcopy(self.records);del selected['BUILD_REPRODUCTION.json']['files']['data.js']
        with self.assertRaises(ValueError):self.check(selected)
        selected=copy.deepcopy(self.records);del selected['LEGACY_QA.json']['sourcePins'][self.source]
        with self.assertRaises(ValueError):self.check(selected)
        (self.root/self.test).write_bytes(b'Changed test after validation.\n')
        with self.assertRaises(ValueError):self.check()

    def test_unqualified_legacy_failures_or_rewritten_history_are_rejected(self):
        for key,value in [('unqualifiedRawFailedTasks',1),('unqualifiedRawFailedTasks',False),('historicalTestsAndRawReportsModified',True),('runtimeOrPreservationChecksChanged',True)]:
            with self.subTest(key=key,value=value):
                selected=copy.deepcopy(self.records);selected['LEGACY_QA.json'][key]=value
                with self.assertRaises(ValueError):self.check(selected)

    def test_native_documentation_requires_exact_manual_and_all_code_bodies(self):
        for key,value in [('sourceSha256','f'*64),('authenticated',True)]:
            selected=copy.deepcopy(self.records);selected['NATIVE_DOCUMENTATION.json'][key]=value
            with self.assertRaises(ValueError):self.check(selected)
        for key,value in [('examples',421),('examples',True),('allCodeBodiesByteExact',False),('ownedBrowserSessionClosed',False),('textOnlyScope',False)]:
            with self.subTest(key=key):
                selected=copy.deepcopy(self.records);selected['NATIVE_DOCUMENTATION.json']['renderedCodeExamples'][key]=value
                with self.assertRaises(ValueError):self.check(selected)

    def test_corpus_requires_completed_captures_and_preserved_guards_and_history(self):
        for key,value in [('remainingCaptures',1),('remainingCaptures',False),('unresolvedIntegrityDefects',1),('unresolvedIntegrityDefects',False),('historicalStatusesChanged',True),('preservationGuardsRemoved',True),('wikipediaWrites',1)]:
            with self.subTest(key=key):
                selected=copy.deepcopy(self.records);selected['CORPUS_QA.json'][key]=value
                with self.assertRaises(ValueError):self.check(selected)
        for key in ['remainingCaptures','unresolvedIntegrityDefects','historicalStatusesChanged','preservationGuardsRemoved']:
            selected=copy.deepcopy(self.records);del selected['CORPUS_QA.json'][key]
            with self.assertRaises(ValueError):self.check(selected)

class PlanCoverageFreeze(unittest.TestCase):
    def setUp(self):
        self.manifest_sha='a'*64;self.manual_sha='b'*64;self.features_sha='c'*64
        self.plan={'pins':{'runtimeManifestSha256':self.manifest_sha,'documentationManualSha256':self.manual_sha,'featureInventorySha256':self.features_sha}}

    def check(self,plan):return builder.checked_plan_coverage_pins(plan,self.manifest_sha,self.manual_sha,self.features_sha)

    def test_plan_binds_runtime_manual_and_feature_inventory(self):
        self.check(self.plan)
        self.plan['pins']['planningRegistrySha256']='d'*64
        self.check(self.plan)

    def test_stale_inner_plan_pins_fail_even_if_the_outer_file_is_rehashed(self):
        for key in self.plan['pins']:
            with self.subTest(key=key):
                changed=copy.deepcopy(self.plan);changed['pins'][key]='e'*64
                self.assertNotEqual(builder.pin(builder.raw_json(changed)),builder.pin(builder.raw_json(self.plan)))
                with self.assertRaises(ValueError):self.check(changed)
        for changed in [{},{'pins':None},{'pins':[]},{'pins':{}},None]:
            with self.subTest(malformed=changed),self.assertRaises(ValueError):self.check(changed)

if __name__=='__main__':unittest.main()
