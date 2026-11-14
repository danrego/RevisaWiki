"""Synthetic packaging metadata only. No current release QA is assembled."""
from pathlib import Path
import copy
import importlib.util
import json
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('summary2220',ROOT/'scripts/summarize_v2220.py')
summary=importlib.util.module_from_spec(spec);spec.loader.exec_module(summary)

class SummaryAssembly(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.private=Path(self.temp.name)
        self.root=self.private/'repository';self.root.mkdir();self.preview=self.private/'preview';self.preview.mkdir()
        self.patches=[mock.patch.object(value,'ROOT',self.root)for value in (summary,summary.delivery,summary.aggregate,summary.aggregate.delivery)]
        for patch in self.patches:patch.start()
        self.pin=summary.delivery.pin;self.raw=summary.delivery.raw_json;self.sha=summary.delivery.sha
        self.manifest={'version':'2.22.0','distributionRevision':'2.22.0','files':{},'sourceInputs':{},'limits':{'calculationDeadlineMilliseconds':None,'fixedAnalysisDeadline':False}}
        names=[f'RevisaWiki_v2_22_0{s}'for s in ('.js','_dados.js','_catalogo.js','_regras.js','_completo.js')]+['Carregador_comunitario_RevisaWiki_v2_22_0.js','Carregador_common_js_RevisaWiki_v2_22_0.js','Chamada_fixa_RevisaWiki_common.js','Chamada_fixa_RevisaWiki_copia_propria.js']
        for name in names:
            raw=('Fictional runtime metadata '+name).encode();self.put('dist/2.22.0/'+name,raw);self.manifest['files'][name]=self.pin(raw)
        for i in range(26):
            name=f'src/v2_22/input{i:02}.js';raw=f'Fictional source input {i}.'.encode();self.put(name,raw);self.manifest['sourceInputs'][name]=self.pin(raw)
        self.put('tests/expected_release_v2220.json',self.raw(self.manifest));self.manifest_sha=self.sha(self.raw(self.manifest))
        def feature(i):return {'id':f'FEATURE-{i:03}','family':'Example','title':'Example','description':'Fictional feature','condition':'Conditional','type':'automatic','verification':'Metadata fixture only','before':'a','after':'b','optionKeys':[],'entryPoints':[]}
        self.features={'version':'2.22.0','features':[feature(i)for i in range(190)]}
        self.put('docs/2.21.7/Funcionalidades_RevisaWiki_2_21_7.json',self.raw({'features':[feature(i)for i in range(170)]}))
        self.put('docs/2.21.7/Documentacao_RevisaWiki_v2_21_7.wiki',b'== Hist\xc3\xb3rico das vers\xc3\xb5es ==\n=== 2.21.7 ===\n')
        for name in summary.DOCUMENTS:self.put('docs/2.22.0/'+name,b'Finished fictional documentation.\n')
        self.put('docs/2.22.0/Documentacao_RevisaWiki_v2_22_0.wiki',b'== Hist\xc3\xb3rico das vers\xc3\xb5es ==\n=== 2.22.0 ===\n=== 2.21.7 ===\n')
        self.put('docs/2.22.0/Funcionalidades_RevisaWiki_2_22_0.json',self.raw(self.features))
        self.examples={'version':'2.22.0','examples':[{'id':'fictional-example','featureIds':['FEATURE-000'],'source':'a','expected':'b'}]}
        self.put('tests/v2220/feature_examples.json',self.raw(self.examples))
        self.demo=[{'id':f'EX-{i:03}'}for i in range(170)];self.put('tests/v2220/demo_examples.json',self.raw(self.demo))
        self.put('tests/v2212/coverage_all.json',self.raw({'items':[{'id':str(i)}for i in range(76)]}))
        for name in summary.FIXED_INPUTS:
            if not(self.root/name).exists():self.put(name,b'Frozen fictional input.\n')
        for name in ('PRESAVE_ROUNDTRIP.json','NATIVE_INSTALLABLE_SCRIPTS.json'):
            self.put('tests/evidence/2.22.0/'+name,self.raw({'kind':'synthetic-presave-metadata-only'}))
        self.records={name:{'version':'2.22.0','status':'passed','wikipediaWrites':0,field:self.manifest_sha}for name,field in summary.delivery.REQUIRED_RUNTIME_EVIDENCE.items()}
        self.records['BUILD_REPRODUCTION.json']['files']=copy.deepcopy(self.manifest['files'])
        self.records['LEGACY_QA.json'].update(status='passed-with-precisely-qualified-historical-contracts',unqualifiedRawFailedTasks=0,historicalTestsAndRawReportsModified=False,runtimeOrPreservationChecksChanged=False,previousPublicLegacyEvidenceSha256='a'*64,historicalStatusesModified=False,currentRuntimeRawAndQualificationCompleted=True,rawTasks=3,rawPassedTasks=2,rawFailedTasksRetained=1,qualifiedRawFailedTasks=1,qualificationChecks=9,qualificationCurrentCalculateCalls=2,qualificationHistoricalBaselineCalculateCalls=1,biographyUnchangedSafeRefusalAutomaticCorrectionCredit=0)
        self.records['CORPUS_QA.json'].update(remainingCaptures=0,unresolvedIntegrityDefects=0,historicalStatusesChanged=False,preservationGuardsRemoved=False,counts={'capturedRevisions':3,'distinctSourceHashes':2})
        manual=self.root/'docs/2.22.0/Documentacao_RevisaWiki_v2_22_0.wiki'
        self.records['NATIVE_DOCUMENTATION.json']={'version':'2.22.0','status':'passed','wikipediaWrites':0,'authenticated':False,'sourceSha256':self.sha(manual.read_bytes()),'renderedCodeExamples':{'examples':422,'allCodeBodiesByteExact':True,'ownedBrowserSessionClosed':True,'textOnlyScope':True}}
        self.records['NATIVE_EDITOR_UI.json'].update(browsers=[{'browser':b,'ownedBrowserSessionClosed':True,'checks':3}for b in ('Chrome','Firefox','Safari')],realInterval={'ownedBrowserSessionClosed':True,'details':{'actualWorkerResultHeld':True,'productionClockAndCodeUnmodified':True,'draftPreservedWhileWaiting':True,'elapsedMilliseconds':61001}})
        self.receipt_descriptors={};attempts=[]
        for bundle in ('core','complete'):
            name='RevisaWiki_v2_22_0'+('_completo.js'if bundle=='complete'else'.js')
            result={'suite':'documentation-exact-examples-2.22.0','checks':1,'calculations':1,'examples':1,'passed':True,'rows':[{'id':'fictional-example','passed':True}],'failures':[],'runtimeSha256':self.manifest['files'][name]['sha256'],'fixtureSha256':self.sha(self.raw(self.examples)),'wikipediaWrites':0}
            stdout={key:result[key]for key in ('suite','checks','calculations','examples','failures')}
            self.receipt_descriptors[bundle]={}
            for role,value in [('receipt',result),('stdout',stdout)]:
                file=self.private/f'{bundle}-{role}.json';file.write_bytes(self.raw(value));self.receipt_descriptors[bundle][role]={'path':str(file),'sha256':self.sha(file.read_bytes())}
            attempts.append({'suite':'tests/v2220/documentation_examples.cjs','bundle':name,'status':'passed','exitCode':0,'sourceUnchanged':True,'testUnchanged':True,'bundleSha256':self.manifest['files'][name]['sha256'],'testSha256':self.sha((self.root/'tests/v2220/documentation_examples.cjs').read_bytes()),'stdoutSha256':self.receipt_descriptors[bundle]['stdout']['sha256'],'checks':1,'calculations':1})
        self.records['DIRECTED_QA.json'].update(attempts=attempts,groups=2,checks=2,cases=0)
        self.artifacts={}
        for name in ['Demonstracao/'+n for n in ('DEMONSTRACAO.html','demonstracao.css','demonstracao.js','motor.js','exemplos.json')]+['Demonstracao_RevisaWiki_v2_22_0.html','RevisaWiki_v2_22_0_completo.js']:
            raw=(self.root/'dist/2.22.0'/name).read_bytes()if name.startswith('RevisaWiki')else('Fictional demo '+name).encode()
            file=self.preview/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(raw);self.artifacts[name]=self.pin(raw)
        self.browsers=[{'browser':b,'status':'passed','menuExamples':170,'ownedBrowserSessionClosed':True,'wikipediaWrites':0,'externalRequests':0,'networkMutations':0,'localHttpNavigationRequests':0}for b in ('chrome','firefox','safari')]
        self.records['INFERENCE_AND_DEMO.json'].update(runtimeSourceInputs=copy.deepcopy(self.manifest['sourceInputs']),offlineDemonstration={'artifactPins':self.artifacts,'fixtureSha256':self.sha(self.raw(self.demo)),'portableSha256':self.artifacts['Demonstracao_RevisaWiki_v2_22_0.html']['sha256'],'node':{'examples':170,'checks':3,'networkRequests':0,'wikipediaWrites':0},'nativeBrowsers':copy.deepcopy(self.browsers)},plannerActionClosure={'perBundle':[{'bundle':b,'observedCases':3,'positiveFixtures':1,'noopControls':2,'normalizationClosurePassed':2,'pureLocalPasses':1,'sourceEvidenceInvalidationConditionedPasses':1,'invalidContextControlHeld':1,'heldControlIsNormalizationPass':False,'disagreements':0,'captureProblems':0,'inputsUnchanged':True}for b in ('core','complete')]})
        self.records['FILE_DEMONSTRATION.json'].update(portableSha256=self.artifacts['Demonstracao_RevisaWiki_v2_22_0.html']['sha256'],fixtureSha256=self.sha(self.raw(self.demo)),engineSha256=self.manifest['files']['RevisaWiki_v2_22_0_completo.js']['sha256'],nativeBrowsers=copy.deepcopy(self.browsers))
        self.config={'runtimeManifestSha256':self.manifest_sha,'inputPins':{},'documentationExampleReceipts':self.receipt_descriptors,'demonstrationPreview':{'path':str(self.preview)}}
        self.presave_calls=[]
        def validate(*args):self.presave_calls.append(args)
        def build_demo(output,preview=False):
            self.assertTrue(preview)
            for name in self.artifacts:
                file=Path(output)/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes((self.preview/name).read_bytes())
        def modules(name,file):
            if file in ('check_wiki_presave_v2220.py','check_runtime_presave_v2220.py'):return SimpleNamespace(validate_receipt=validate)
            if file=='build_demo_v2220.py':return SimpleNamespace(build_demo=build_demo)
            raise AssertionError('Unexpected module in metadata-only test')
        self.modules=modules
        self.module_patch=mock.patch.object(summary,'module',side_effect=modules);self.module_patch.start()
        self.save()

    def put(self,name,raw):
        file=self.root/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(raw)

    def save(self):
        manual=(self.root/'docs/2.22.0/Documentacao_RevisaWiki_v2_22_0.wiki').read_bytes()
        plan={'version':'2.22.0','trackingEntries':408,'trackingEntriesAreFeatureCount':False,'unresolvedIntegrityDefects':0,'pins':{'runtimeManifestSha256':self.manifest_sha,'documentationManualSha256':self.sha(manual),'featureInventorySha256':self.sha((self.root/'docs/2.22.0/Funcionalidades_RevisaWiki_2_22_0.json').read_bytes())}}
        self.put('tests/evidence/2.22.0/PLAN_COVERAGE.json',self.raw(plan))
        for name,value in self.records.items():self.put('tests/evidence/2.22.0/'+name,self.raw(value))
        self.config['inputPins']={name:self.pin((self.root/name).read_bytes())for name in summary.required_inputs()}

    def tearDown(self):
        self.module_patch.stop()
        for patch in reversed(self.patches):patch.stop()
        self.temp.cleanup()

    def test_exact_metadata_builds_frozen_qa_without_inflating_counts(self):
        qa,_=summary.assemble(self.config)
        self.assertTrue(qa['releaseGatesPassed']);self.assertEqual(len(qa['frozenFiles']),9);self.assertEqual(len(qa['sourceInputs']),26)
        self.assertEqual(len(qa['documentationInputs']),12);self.assertEqual(qa['documentedFeatureCount'],190)
        self.assertEqual(qa['inheritedFeatureIdsPreserved'],170);self.assertEqual(qa['documentationExamplesPassed'],1)
        self.assertEqual(qa['demonstrationExamples'],170);self.assertIsNone(qa['workerDeadlineMilliseconds']);self.assertFalse(qa['fixedAnalysisDeadline'])
        self.assertEqual(qa['validationCounts']['plannerActionClosure'][0]['normalizationClosurePassed'],2)
        self.assertEqual(qa['validationCounts']['plannerActionClosure'][0]['invalidContextControlHeld'],1)
        self.assertFalse(qa['finalArchivePrivacyReviewIncluded']);self.assertEqual(len(self.presave_calls),2)
        self.assertNotIn(str(self.private),json.dumps(qa));self.assertFalse((self.root/'tests/evidence/2.22.0/QA_SUMMARY.json').exists())

    def test_missing_stale_failed_or_unfinished_corpus_never_creates_qa(self):
        original=copy.deepcopy(self.records['CORPUS_QA.json'])
        mutations=[('status','running'),('status','failed'),('remainingCaptures',1),('remainingCaptures',False),('unresolvedIntegrityDefects',1),('runtimeManifestSha256','b'*64),('historicalStatusesChanged',True),('preservationGuardsRemoved',True)]
        for key,value in mutations:
            with self.subTest(key=key,value=value):
                self.records['CORPUS_QA.json']={**original,key:value};self.save()
                with self.assertRaises(ValueError):summary.assemble(self.config)
        self.assertEqual(self.presave_calls,[])
        self.records['CORPUS_QA.json']=original;self.save();del self.config['inputPins']['tests/evidence/2.22.0/CORPUS_QA.json']
        with self.assertRaises(ValueError):summary.assemble(self.config)

    def test_changed_source_document_fixture_or_license_is_rejected(self):
        for name in ('src/v2_22/input00.js','docs/2.22.0/Instalacao_RevisaWiki_v2_22_0.txt','tests/v2220/feature_examples.json','LICENSE'):
            with self.subTest(name=name):
                file=self.root/name;prior=file.read_bytes();file.write_bytes(b'Changed after validation.')
                with self.assertRaises(ValueError):summary.assemble(self.config)
                file.write_bytes(prior)

    def test_updated_outer_pins_do_not_hide_stale_manual_or_example_receipts(self):
        path=self.root/'docs/2.22.0/Documentacao_RevisaWiki_v2_22_0.wiki';path.write_bytes(path.read_bytes()+b'Changed.');self.save()
        with self.assertRaises(ValueError):summary.assemble(self.config)
        self.records['NATIVE_DOCUMENTATION.json']['sourceSha256']=self.sha(path.read_bytes());self.save()
        self.examples['examples'][0]['id']='other-example';self.put('tests/v2220/feature_examples.json',self.raw(self.examples));self.save()
        with self.assertRaises(ValueError):summary.assemble(self.config)

    def test_exact_example_rows_and_actual_directed_stdout_are_required(self):
        descriptor=self.config['documentationExampleReceipts']['core'];file=Path(descriptor['receipt']['path']);original=file.read_bytes()
        for mutate in ('row','fixture','runtime','passed'):
            value=json.loads(original)
            if mutate=='row':value['rows'][0]['passed']=False
            elif mutate=='passed':value['passed']=False
            else:value['fixtureSha256'if mutate=='fixture'else'runtimeSha256']='0'*64
            file.write_bytes(self.raw(value));descriptor['receipt']['sha256']=self.sha(file.read_bytes())
            with self.subTest(mutation=mutate),self.assertRaises(ValueError):summary.assemble(self.config)
        file.write_bytes(original);descriptor['receipt']['sha256']=self.sha(original)
        self.records['DIRECTED_QA.json']['attempts'][0]['stdoutSha256']='0'*64;self.save()
        with self.assertRaises(ValueError):summary.assemble(self.config)

    def test_real_interval_and_native_demo_sessions_must_be_complete(self):
        self.records['NATIVE_EDITOR_UI.json']['realInterval']['details']['elapsedMilliseconds']=60000;self.save()
        with self.assertRaises(ValueError):summary.assemble(self.config)
        self.records['NATIVE_EDITOR_UI.json']['realInterval']['details']['elapsedMilliseconds']=61001
        self.records['FILE_DEMONSTRATION.json']['nativeBrowsers'][0]['ownedBrowserSessionClosed']=False;self.save()
        with self.assertRaises(ValueError):summary.assemble(self.config)

    def test_unknown_or_modified_demo_payload_and_miscounted_held_control_fail(self):
        file=self.preview/'Demonstracao/motor.js';old=file.read_bytes();file.write_bytes(b'Changed payload')
        with self.assertRaises(ValueError):summary.assemble(self.config)
        file.write_bytes(old)
        self.records['INFERENCE_AND_DEMO.json']['plannerActionClosure']['perBundle'][0]['normalizationClosurePassed']=3;self.save()
        with self.assertRaises(ValueError):summary.assemble(self.config)

    def test_writer_requires_history_backup_and_checks_frozen_inputs_again(self):
        output=self.root/'tests/evidence/2.22.0/QA_SUMMARY.json';output.write_bytes(b'Historical failed QA.\n')
        with self.assertRaises(ValueError):summary.write_summary(self.config,output)
        result=summary.write_summary(self.config,output,self.private/'archive')
        self.assertEqual(result['summary'],self.pin(output.read_bytes()))
        self.assertEqual(next((self.private/'archive').glob('QA_SUMMARY_*.json')).read_bytes(),b'Historical failed QA.\n')
        qa,captured=summary.assemble(self.config);self.put('LICENSE',b'Changed after assembly')
        with mock.patch.object(summary,'assemble',return_value=(qa,captured)),self.assertRaises(ValueError):summary.write_summary(self.config,output,self.private/'archive')

    def test_directed_source_pins_and_finite_qualifications_cannot_be_forged(self):
        original=copy.deepcopy(self.records['DIRECTED_QA.json'])
        self.records['DIRECTED_QA.json']['attempts'][0]['testSha256']='0'*64;self.save()
        with self.assertRaises(ValueError):summary.assemble(self.config)
        self.records['DIRECTED_QA.json']=copy.deepcopy(original)
        self.records['DIRECTED_QA.json']['attempts'][0].update(status='failed',exitCode=1)
        self.save()
        with self.assertRaises(ValueError):summary.assemble(self.config)

    def test_generated_shape_is_accepted_by_existing_delivery_input_gate(self):
        qa,_=summary.assemble(self.config)
        self.put('tests/evidence/2.22.0/QA_SUMMARY.json',self.raw(qa))
        for filename in ('check_wiki_presave_v2220.py','check_runtime_presave_v2220.py'):
            self.put('scripts/'+filename,b'def validate_receipt(*args):\n    return None\n')
        with mock.patch.object(summary.delivery,'EVIDENCE',self.root/'tests/evidence/2.22.0'),mock.patch.object(summary.delivery,'DIST',self.root/'dist/2.22.0'),mock.patch.object(summary.delivery,'DOCS',self.root/'docs/2.22.0'):
            manifest,checked,raw,receipt,coverage=summary.delivery.checked_inputs()
        self.assertEqual(manifest,self.manifest);self.assertEqual(checked,qa)
        self.assertEqual(raw,self.raw(qa));self.assertEqual(len(coverage['items']),76)

    def test_generated_shape_is_accepted_by_existing_demo_qa_gate(self):
        qa,_=summary.assemble(self.config);file=self.private/'QA_SUMMARY.json';file.write_bytes(self.raw(qa))
        scripts=str(ROOT/'scripts');sys.path.insert(0,scripts)
        try:
            spec=importlib.util.spec_from_file_location('synthetic_summary_demo_gate',ROOT/'scripts/build_demo_v2220.py')
            builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
            checked=builder.checked_qa(SimpleNamespace(records=[{'raw':self.raw(self.manifest)}]),file)
            self.assertEqual(dict(checked),qa)
        finally:sys.path.remove(scripts)

    def test_preview_must_equal_the_current_deterministic_final_payload(self):
        def changed_module(name,file):
            value=self.modules(name,file)
            if file=='build_demo_v2220.py':
                previous=value.build_demo
                def changed(output,preview=False):
                    previous(output,preview=preview)
                    (Path(output)/'Demonstracao/motor.js').write_bytes(b'Unexpected generated difference')
                value.build_demo=changed
            return value
        with mock.patch.object(summary,'module',side_effect=changed_module),self.assertRaises(ValueError):summary.assemble(self.config)

    def test_doc_placeholders_and_dropped_inherited_feature_ids_are_rejected(self):
        name='docs/2.22.0/Relatorio_testes_RevisaWiki_v2_22_0.txt'
        self.put(name,b'QA FINAL PENDENTE');self.save()
        with self.assertRaises(ValueError):summary.assemble(self.config)
        self.put(name,b'Finished fictional report.');self.features['features'][0]['id']='different-retained-id'
        self.put('docs/2.22.0/Funcionalidades_RevisaWiki_2_22_0.json',self.raw(self.features));self.save()
        with self.assertRaises(ValueError):summary.assemble(self.config)

if __name__=='__main__':unittest.main()
