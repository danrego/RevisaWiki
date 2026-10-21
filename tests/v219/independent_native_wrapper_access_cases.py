"""Pinned local aliases and collector wrappers; all citation payloads stay bound."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('independent_corpus', Path(__file__).with_name('independent_corpus.py'))
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)


class NativeWrapperAccessTests(unittest.TestCase):
    def pair(self, name='Cite web', key='url-access', extra=''):
        source = '<ref name="fonte">{{' + name + '|title=Fonte fictícia|url=https://example.invalid/fonte|' + key + '=subscription' + extra + '}}</ref> Outra passagem.<ref name="fonte" />\n{{Referências}}'
        target = source.replace('{{' + name + '|', '{{Citar web|').replace('=subscription', '=subscrição')
        return source, target

    def test_exact_native_alias_url_access_repair(self):
        for name in ['Cite web', 'cite web', 'Cite_web', 'Predefinição:Cite web']:
            for key in ['url-access', 'acesso-url', 'acessourl']:
                before, after = self.pair(name, key)
                checks = oracle.compare_sources(before, after)
                self.assertTrue(all(row['status'] != 'failed' for row in checks.values()))
                row = checks['citation_associations']
                self.assertFalse(row['originalRenderingClaimedEquivalent'])
                self.assertTrue(any(item['kind'] == 'invalid-native-url-access-enum' for item in row['declaredRepairs']))

    def test_access_repair_cannot_change_payload_or_paid_access(self):
        before, after = self.pair()
        for mutant in [after.replace('/fonte', '/outra'), after.replace('Fonte fictícia', 'Outra fonte'), after.replace('=subscrição', '=limited'), after.replace('|url-access=subscrição', ''), after.replace('name="fonte"', 'name="outra"', 1)]:
            self.assertTrue(any(row['status'] == 'failed' for row in oracle.compare_sources(before, mutant).values()))

    def test_unproved_alias_conflicts_and_opaque_scope_not_projected(self):
        for name in ['CITE WEB', 'Cite Web', 'Modelo estrangeiro']:
            before, after = self.pair(name)
            self.assertFalse(any(item['kind'] == 'invalid-native-url-access-enum' for item in oracle.declared_repair_source(before, after)[1]))
        for extra in ['|acesso-url=', '|url-access=limited', '|acessourl=registration']:
            before, after = self.pair(extra=extra)
            self.assertFalse(any(item['kind'] == 'invalid-native-url-access-enum' for item in oracle.declared_repair_source(before, after)[1]))
        before, after = self.pair()
        for prefix, suffix in [('<pre>', '</pre>'), ('{{Caixa desconhecida|texto=', '}}')]:
            self.assertFalse(any(item['kind'] == 'invalid-native-url-access-enum' for item in oracle.declared_repair_source(prefix + before + suffix, prefix + after + suffix)[1]))

    def test_one_literal_native_group_wrapper_with_opaque_note(self):
        note = '{{Nre|Nota com {{lang|en|literal}} e <ref name="fonte">Fonte fictícia.</ref>|nome=nota}}'
        for name in ['Reflist', 'reflist']:
            for key in ['group', 'grupo']:
                for group in ['Note', 'nota', 'lower-alpha', 'grupo_2']:
                    source = note + '\n{{' + name + '|' + key + '=' + group + '}}\n{{Reflist}}'
                    after = source.replace('{{' + name + '|' + key + '=' + group + '}}', '{{Referências|grupo=' + group + '|nível=0}}').replace('{{Reflist}}', '{{Referências|nível=0}}')
                    self.assertEqual(oracle.raw_reference_subsystem(oracle.mw.parse(source)), oracle.raw_reference_subsystem(oracle.mw.parse(after)))
                    checks = oracle.compare_sources(source, after)
                    self.assertTrue(all(row['status'] != 'failed' for row in checks.values()))
                    self.assertEqual(checks['reference_bindings']['status'], 'ambiguous')

    def test_group_projection_keeps_opaque_payload_and_group_mutants_rejected(self):
        source = '{{Nre|Nota com {{lang|en|literal}} e <ref name="fonte">Fonte fictícia.</ref>|nome=nota}}\n{{Reflist|group=Note}}\n{{Reflist}}'
        after = source.replace('{{Reflist|group=Note}}', '{{Referências|grupo=Note|nível=0}}').replace('{{Reflist}}', '{{Referências|nível=0}}')
        for mutant in [after.replace('Fonte fictícia.', 'Outra fonte.'), after.replace('name="fonte"', 'name="outra"'), after.replace('grupo=Note', 'grupo=Other'), after.replace('grupo=Note', 'grupo='), after.replace('|nível=0', '|refs=Outra fonte|nível=0', 1)]:
            checks = oracle.compare_sources(source, mutant)
            self.assertEqual(checks['reference_bindings']['status'], 'failed')
            self.assertEqual(checks['reference_lists']['status'], 'failed')

    def test_other_collector_fields_remain_raw(self):
        for raw in ['{{Reflist|group=}}', '{{Reflist|group= Note}}', '{{Reflist|group=Note|grupo=Other}}', '{{Reflist|group=Note|group=Note}}', '{{Reflist|group=Note|refs=Fonte fictícia.}}', '{{Reflist|group=Note|liststyle=decimal}}', '{{Reflist|group=&nbsp;}}', '{{Reflist|group={{Grupo}}}}', '{{Reflist|group=Note|colwidth=30em}}']:
            self.assertEqual(oracle.native_collector_102_raw(oracle.mw.parse(raw).filter_templates()[0]), raw)


if __name__ == '__main__':
    unittest.main()
