"""A sole native refs bank keeps every body and uncertain identity literal."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('bank_model', Path(__file__).with_name('independent_corpus.py'))
model = importlib.util.module_from_spec(spec)
spec.loader.exec_module(model)


class NativeBankWrapperTests(unittest.TestCase):
    def pair(self, name='Reflist', body='Fonte fictícia.'):
        bank = '<ref name="a&nbsp;b">' + body + '</ref>'
        source = 'Texto.<ref name="a&nbsp;b" />\n{{' + name + '|refs=' + bank + '}}'
        after = source.replace('{{' + name + '|refs=', '{{Referências|refs=')[:-2] + '|nível=0}}'
        return source, after

    def test_exact_native_default_bank_and_opaque_identity(self):
        for name in ['Reflist', 'reflist', 'Template:Reflist', 'Predefinição:Reflist']:
            source, after = self.pair(name)
            self.assertEqual(model.raw_reference_subsystem(model.mw.parse(source)), model.raw_reference_subsystem(model.mw.parse(after)))
            checks = model.compare_sources(source, after)
            self.assertTrue(all(item['status'] != 'failed' for item in checks.values()))
            self.assertEqual(checks['reference_bindings']['status'], 'ambiguous')

    def test_complete_citation_bank_payload_bound(self):
        body = '{{Citar web|título=Fonte fictícia|url=https://example.invalid/fonte|data=2020|autor=Pessoa fictícia}}'
        source, after = self.pair(body=body)
        self.assertTrue(all(item['status'] != 'failed' for item in model.compare_sources(source, after).values()))
        for mutant in [after.replace('Fonte fictícia', 'Outra fonte'), after.replace('example.invalid/fonte', 'example.invalid/outra'), after.replace('data=2020', 'data=2021'), after.replace('Pessoa fictícia', 'Outra pessoa')]:
            checks = model.compare_sources(source, mutant)
            self.assertEqual(checks['reference_bindings']['status'], 'failed')
            self.assertEqual(checks['reference_lists']['status'], 'failed')

    def test_names_groups_and_reference_association_not_decoded(self):
        source, after = self.pair()
        for mutant in [after.replace('a&nbsp;b', 'a b'), after.replace('a&nbsp;b', 'outra', 1), after.replace('name="a&nbsp;b">', 'group="nota" name="a&nbsp;b">'), after.replace('Fonte fictícia.', 'Fonte fictícia. Outra frase.'), after.replace('|nível=0', '|grupo=nota|nível=0')]:
            checks = model.compare_sources(source, mutant)
            self.assertEqual(checks['reference_bindings']['status'], 'failed')
            self.assertEqual(checks['reference_lists']['status'], 'failed')

    def test_extra_empty_duplicate_or_competing_arguments_remain_raw(self):
        for raw in ['{{Reflist|refs=}}', '{{Reflist|refs= }}', '{{Reflist|refs=Fonte|group=}}', '{{Reflist|refs=Fonte|refs=Outra}}', '{{Reflist|refs=Fonte|nível=0}}', '{{Reflist|refs=Fonte|estilo=}}', '{{Reflist|Refs=Fonte}}', '{{Reflist|Fonte}}']:
            self.assertEqual(model.native_collector_102_raw(model.mw.parse(raw).filter_templates()[0]), raw)

    def test_internal_title_case_is_not_a_native_alias(self):
        for name in ['REFLIST', 'RefList', 'ReflIst']:
            raw = '{{' + name + '|refs=Fonte}}'
            self.assertEqual(model.native_collector_102_raw(model.mw.parse(raw).filter_templates()[0]), raw)

    def test_bank_padding_and_raw_child_template_retained(self):
        for body in [' Fonte fictícia. ', '{{Modelo fictício|texto=Fonte fictícia.}}', '<ref name="outra">Outro texto.</ref>']:
            raw = '{{Reflist| refs =\n' + body + '\n}}'
            expected = '{{Referências| refs =\n' + body + '\n|nível=0}}'
            self.assertEqual(model.native_collector_102_raw(model.mw.parse(raw).filter_templates()[0]), expected)

    def test_unrelated_or_multiple_banks_keep_order_and_payload(self):
        source, after = self.pair()
        source += '\n{{Reflist|refs=<ref name="outra">Outra fonte.</ref>}}'
        after += '\n{{Referências|refs=<ref name="outra">Outra fonte.</ref>|nível=0}}'
        first, second = model.raw_reference_subsystem(model.mw.parse(source)), model.raw_reference_subsystem(model.mw.parse(after))
        self.assertEqual(first, second)
        self.assertNotEqual(first, model.raw_reference_subsystem(model.mw.parse(after.replace('Outra fonte.', 'Fonte modificada.'))))


if __name__ == '__main__':
    unittest.main()
