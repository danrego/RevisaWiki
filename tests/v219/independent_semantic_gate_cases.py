import importlib.util,json,tempfile,unittest,hashlib
from pathlib import Path
spec=importlib.util.spec_from_file_location('gate',Path(__file__).with_name('independent_semantic_gate.py'));g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
sha=lambda data:hashlib.sha256(data).hexdigest()
class SemanticSummaryGateCases(unittest.TestCase):
    def fixture(self):
        root=Path(self.temp.name);reader=root/'reader.py';reader.write_text('fictional independent reader\n');manifest=root/'sources.json';manifest.write_text('{"pages":[]}\n');core=root/'core.js';core.write_text('fictional core bytes\n');full=root/'full.js';full.write_text('fictional complete bytes\n');actual=root/'RUN_PRIVATE.json';hashes={'core':sha(core.read_bytes()),'complete':sha(full.read_bytes())};actual.write_text(json.dumps({'settings':{'core':str(core),'complete':str(full),'hashes':hashes}}));summary=root/'SUMMARY.json';s={'kind':'independent-python-ast-oracle','runnerSha256':sha(reader.read_bytes()),'sourceManifestSha256':sha(manifest.read_bytes()),'actualOutputRunReceiptSha256':sha(actual.read_bytes()),'runtimeSha256':hashes,'plannedDistinctPages':1,'completedDistinctPages':1,'plannedCaptures':[[1,2]],'executionErrors':[],'checks':{key:{'passed':1,'failed':0,'ambiguous':0,'not_applicable':0} for key in g.CHECKS},'status':'passed','findings':[]};summary.write_text(json.dumps(s));return [summary,reader,manifest,actual],s
    def setUp(self):self.temp=tempfile.TemporaryDirectory()
    def tearDown(self):self.temp.cleanup()
    def call(self,change=None,allow=False):
        inputs,s=self.fixture()
        if change:change(s)
        inputs[0].write_text(json.dumps(s));return g.evaluate(*inputs,1,allow)
    def test_passed_bound_completed_selection(self):r,c=self.call();self.assertEqual(c,0);self.assertTrue(r['dependencyExecutionAllowed']);self.assertFalse(r['nativeSemanticAcceptanceClaim'])
    def test_failed_status_blocks_even_when_external_process_code_is_zero(self):
        with self.assertRaises(ValueError):self.call(lambda s:s.update(status='failed'))
    def test_failed_counter_blocks_even_with_passed_label_and_allow_policy(self):
        def bad(s):s['checks']['reference_bindings'].update(passed=0,failed=1)
        with self.assertRaises(ValueError):self.call(bad,True)
    def test_execution_errors_block(self):
        with self.assertRaises(ValueError):self.call(lambda s:s.update(executionErrors=[{'message':'failure'}]))
    def test_incomplete_selection_blocks(self):
        with self.assertRaises(ValueError):self.call(lambda s:s.update(completedDistinctPages=0))
    def test_false_aggregate_over_failed_capture_blocks(self):
        with self.assertRaises(ValueError):self.call(lambda s:s.update(findings=[{'checks':{'reference_lists':'failed'}}]))
    def test_ambiguity_blocks_by_default(self):
        def ambiguity(s):s['status']='completed_with_ambiguities';s['checks']['reference_lists'].update(passed=0,ambiguous=1)
        r,c=self.call(ambiguity);self.assertEqual(c,2);self.assertFalse(r['dependencyExecutionAllowed']);self.assertTrue(r['requiresAmbiguityAdjudication'])
    def test_explicit_diagnostic_policy_keeps_ambiguity_and_no_acceptance_claim(self):
        def ambiguity(s):s['status']='completed_with_ambiguities';s['checks']['reference_lists'].update(passed=0,ambiguous=1)
        r,c=self.call(ambiguity,True);self.assertEqual(c,0);self.assertTrue(r['requiresAmbiguityAdjudication']);self.assertFalse(r['nativeSemanticAcceptanceClaim'])
    def test_stale_reader_manifest_actual_and_runtime_bindings_block(self):
        for field in ['runnerSha256','sourceManifestSha256','actualOutputRunReceiptSha256']:
            with self.subTest(field=field),self.assertRaises(ValueError):self.call(lambda s:s.update(**{field:'0'*64}))
        with self.assertRaises(ValueError):self.call(lambda s:s.update(runtimeSha256={'core':'0'*64}))
    def test_missing_or_contradictory_invariant_counters_block(self):
        with self.assertRaises(ValueError):self.call(lambda s:s['checks'].pop('reference_lists'))
        with self.assertRaises(ValueError):self.call(lambda s:s['checks']['reference_lists'].update(passed=2))
        with self.assertRaises(ValueError):self.call(lambda s:s['checks']['reference_lists'].update(passed=True))

if __name__=='__main__':unittest.main()
