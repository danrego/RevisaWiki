"""Literal reference identities stay bound across native syntax-only spacing."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('independent_corpus', Path(__file__).with_name('independent_corpus.py'))
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)


class NativeReferenceLexicalTests(unittest.TestCase):
    def pair(self):
        source = '{{sfn|Fonte fictícia|2001}}\nTexto.<ref name="fonte">{{citar web |título=Documento fictício |url=https://example.invalid/fonte |página=47 |volume=3 }}</ref> Outra passagem.<ref name="fonte"/>\n{{Referências}}'
        target = source.replace('|página=47 |volume=3 ', '|página=47|volume=3').replace('<ref name="fonte"/>', '<ref name="fonte" />')
        return source, target

    def test_finite_reference_lexical_identity_beside_opaque_emitter(self):
        before, after = self.pair()
        self.assertEqual(oracle.raw_reference_subsystem(oracle.mw.parse(before)), oracle.raw_reference_subsystem(oracle.mw.parse(after)))
        checks = oracle.compare_sources(before, after)
        self.assertTrue(all(row['status'] != 'failed' for row in checks.values()))
        self.assertEqual(checks['reference_bindings']['status'], 'ambiguous')

    def test_payload_identity_and_opaque_emitter_mutants_rejected(self):
        before, after = self.pair()
        for mutant in [after.replace('Documento fictício', 'Outro documento'), after.replace('/fonte', '/outra'), after.replace('página=47', 'página=48'), after.replace('volume=3', 'volume=4'), after.replace('name="fonte"', 'name="outra"', 1), after.replace('{{sfn|Fonte fictícia|2001}}', '{{sfn|Fonte fictícia|2002}}'), after.replace('|página=47', '|página=47|p=48')]:
            checks = oracle.compare_sources(before, mutant)
            self.assertEqual(checks['reference_bindings']['status'], 'failed')
            self.assertEqual(checks['reference_lists']['status'], 'failed')

    def test_unknown_fields_and_nonliteral_values_keep_their_bytes(self):
        for field in ['pagina=47 ', 'pages=47 ', 'página={{Número|47}} ', 'página=47\n', 'volume=Vol. 3 ', 'página=47 |p=48 ', 'página=47|página=47 ']:
            raw = '<ref name="fonte">{{citar web|título=Documento fictício|' + field + '}}</ref>'
            self.assertEqual(oracle.native_reference_lexical_102(oracle.mw.parse(raw).nodes[0]), raw)

    def test_unquoted_attributes_unknown_families_and_outer_prose_stay_raw(self):
        for raw in ['<ref name=fonte />', '<ref follow="fonte" />', '<ref name="fonte">{{Outro modelo|página=47 }}</ref>', '<ref name="fonte">Texto {{citar web|página=47 }}</ref>', '<ref name="fonte">{{Caixa|{{citar web|página=47 }}}}</ref>']:
            self.assertEqual(oracle.native_reference_lexical_102(oracle.mw.parse(raw).nodes[0]), raw)
        for raw in ['<ref name="fonte"/>', "<ref name='fonte' />", '<ref name="fonte" group="nota"  />']:
            projected = oracle.native_reference_lexical_102(oracle.mw.parse(raw).nodes[0])
            self.assertEqual(projected, raw[:raw.rfind('/')].rstrip(' \t') + '/>')


if __name__ == '__main__':
    unittest.main()
