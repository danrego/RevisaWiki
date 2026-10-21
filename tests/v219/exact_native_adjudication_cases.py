"""Negative controls for source-bound native adjudications, not product fixes."""
import copy
import json
from pathlib import Path
import unittest

from exact_native_adjudication import NativeTableEvents, exact_binding, literal_references, sha


class NativeWitnessControls(unittest.TestCase):
    def test_complete_literal_reference_order_and_quoted_gt(self):
        source = 'A<ref name="x>y">Corpo</ref>B<ref name="x>y" />'
        self.assertEqual(literal_references(source), ['<ref name="x>y">Corpo</ref>', '<ref name="x>y" />'])

    def test_case_preserved(self):
        self.assertEqual(literal_references('<REF NAME="A">Texto</REF>'), ['<REF NAME="A">Texto</REF>'])

    def test_missing_closer_rejected(self):
        with self.assertRaises(ValueError):
            literal_references('<ref>Texto')

    def test_nested_reference_rejected(self):
        with self.assertRaises(ValueError):
            literal_references('<ref>A<ref>B</ref></ref>')

    def test_stray_closer_rejected(self):
        with self.assertRaises(ValueError):
            literal_references('Texto</ref>')

    def test_changed_body_is_detected(self):
        self.assertNotEqual(literal_references('<ref>A</ref>'), literal_references('<ref>B</ref>'))

    def test_changed_name_is_detected(self):
        self.assertNotEqual(literal_references('<ref name="a"/>'), literal_references('<ref name="b"/>'))

    def test_reordered_calls_are_detected(self):
        self.assertNotEqual(literal_references('<ref>A</ref><ref>B</ref>'), literal_references('<ref>B</ref><ref>A</ref>'))

    def test_only_column_scope_is_omitted(self):
        first, second = NativeTableEvents(), NativeTableEvents(True)
        first.feed('<table><tr><th>A<b></b></th></tr></table>')
        second.feed('<table><tr><th scope="col">A<b></b></th></tr></table>')
        self.assertEqual(first.events, second.events)
        self.assertEqual(second.removed, 1)

    def test_other_attributes_are_retained(self):
        first, second = NativeTableEvents(), NativeTableEvents(True)
        first.feed('<th>A</th>')
        second.feed('<th scope="col" colspan="2">A</th>')
        self.assertNotEqual(first.events, second.events)

    def test_row_scope_is_retained(self):
        first, second = NativeTableEvents(), NativeTableEvents(True)
        first.feed('<th>A</th>')
        second.feed('<th scope="row">A</th>')
        self.assertNotEqual(first.events, second.events)

    def test_cell_content_and_emphasis_are_retained(self):
        for html in ['<th>B</th>', '<th><i>A</i></th>', '<td>A</td>']:
            with self.subTest(html=html):
                first, second = NativeTableEvents(), NativeTableEvents(True)
                first.feed('<th>A</th>')
                second.feed(html)
                self.assertNotEqual(first.events, second.events)

    def test_bound_pair_and_negative_mutations(self):
        contract = {
            'status': 'passed', 'wikipediaWrites': 0,
            'sourceCapture': {'sourceSha256': sha(b'A'), 'outputSha256': sha(b'B'),
                              'independentModelSha256': 'model', 'originalIndependentReceiptSha256': 'receipt',
                              'originalRecordedStatus': 'failed', 'originalRecordedStatusChanged': False},
        }
        self.assertTrue(exact_binding(contract, 'A', 'B', 'model', 'receipt'))
        for args in [('C', 'B', 'model', 'receipt'), ('A', 'C', 'model', 'receipt'),
                     ('A', 'B', 'other', 'receipt'), ('A', 'B', 'model', 'other')]:
            with self.subTest(args=args):
                self.assertFalse(exact_binding(contract, *args))
        changed = copy.deepcopy(contract)
        changed['sourceCapture']['originalRecordedStatusChanged'] = True
        self.assertFalse(exact_binding(changed, 'A', 'B', 'model', 'receipt'))

    def test_native_table_contract_keeps_original_failure(self):
        file = Path(__file__).with_name('table_trailing_emphasis_native_adjudication.json')
        contract = json.loads(file.read_text())
        self.assertEqual(contract['sourceCapture']['originalRecordedStatus'], 'failed')
        self.assertIs(contract['sourceCapture']['originalRecordedStatusChanged'], False)
        native = contract['nativePrimary']
        self.assertEqual(native['beforeEvents'], native['afterEvents'])
        self.assertEqual(native['newColumnScopeAttributes'], 6)
        self.assertEqual(native['nativeCells'], 12)
        self.assertIs(contract['scope']['productionRuntimeChanged'], False)

    def test_unclosed_italic_does_not_erase_raw_reference_boundary(self):
        source = "Texto<ref>Autor, ''obra'', descrição''.</ref> Depois<ref>Outra</ref>"
        self.assertEqual(literal_references(source), ["<ref>Autor, ''obra'', descrição''.</ref>", '<ref>Outra</ref>'])

    def test_native_reference_contract_keeps_ambiguities(self):
        file = Path(__file__).with_name('reference_italic_boundary_native_adjudication.json')
        contract = json.loads(file.read_text())
        identity = contract['rawIdentity']
        self.assertEqual(identity['orderedLiteralReferenceTokens'], 203)
        self.assertEqual(identity['sourceReferenceTokensSha256'], identity['outputReferenceTokensSha256'])
        self.assertIs(contract['scope']['unexpandedScopesRemainAmbiguous'], True)
        self.assertIs(contract['sourceCapture']['originalRecordedStatusChanged'], False)
        self.assertEqual(contract['nativePrimary']['followingSentinel'], [{'insideReference': False, 'insideListItem': False}])


if __name__ == '__main__':
    unittest.main()
