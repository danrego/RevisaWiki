"""Primary-pinned native collector identity; opaque notes remain unexpanded."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('independent_corpus', Path(__file__).with_name('independent_corpus.py'))
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)

class NativeListanotaTests(unittest.TestCase):
    def test_exact_native_and_redirect_names(self):
        for name in ['Listanota', 'listanota', 'Notelist', 'notelist']:
            parsed = oracle.mw.parse('{{' + name + '}}').filter_templates()[0]
            self.assertEqual(oracle.native_collector_102(parsed)['groups'], ['lower-alpha'])
            self.assertEqual(oracle.native_collector_102_raw(parsed), '{{Referências|grupo=lower-alpha|nível=0}}')
        for name in ['ListaNota', 'LISTANOTA', 'NotelIst']:
            parsed = oracle.mw.parse('{{' + name + '}}').filter_templates()[0]
            self.assertIsNone(oracle.native_collector_102(parsed))

    def test_native_group_selection(self):
        for name in ['Listanota', 'Notelist']:
            for supplied, expected in [('nota','nota'),('lower-alpha','lower-alpha'),('outra','lower-alpha'),('','lower-alpha')]:
                parsed = oracle.mw.parse('{{' + name + '|group=' + supplied + '}}').filter_templates()[0]
                self.assertEqual(oracle.native_collector_102(parsed)['groups'], [expected])
            parsed = oracle.mw.parse('{{' + name + '|group=|grupo=nota}}').filter_templates()[0]
            self.assertEqual(oracle.native_collector_102(parsed)['groups'], ['lower-alpha'])

    def test_exact_opaque_note_and_native_collector_migration(self):
        note = '{{Nre|Nota com {{lang|en|literal}} e <ref name="fonte">Fonte fictícia.</ref>|nome=nota}}'
        source = note + '\n{{Listanota}}\n{{Reflist}}'
        after = source.replace('{{Listanota}}','{{Referências|grupo=lower-alpha|nível=0}}').replace('{{Reflist}}','{{Referências|nível=0}}')
        checks = oracle.compare_sources(source, after)
        self.assertTrue(all(check['status'] != 'failed' for check in checks.values()))
        self.assertEqual(checks['reference_bindings']['status'], 'ambiguous')
        self.assertEqual(oracle.raw_reference_subsystem(oracle.mw.parse(source)), oracle.raw_reference_subsystem(oracle.mw.parse(after)))
        for mutant in [after.replace('Fonte fictícia.','Outra fonte.'), after.replace('name="fonte"','name="outra"'), after.replace('nome=nota','nome=outra')]:
            broken = oracle.compare_sources(source, mutant)
            self.assertEqual(broken['reference_bindings']['status'], 'failed')
            self.assertEqual(broken['reference_lists']['status'], 'failed')

    def test_parameterized_opaque_collector_not_raw_canonicalized(self):
        for raw in ['{{Listanota|refs=Fonte fictícia.}}','{{Listanota|group=nota}}','{{Listanota|group=&nbsp;}}']:
            parsed = oracle.mw.parse(raw).filter_templates()[0]
            self.assertEqual(oracle.native_collector_102_raw(parsed), raw)

if __name__ == '__main__':
    unittest.main()
