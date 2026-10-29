"""Refuse incomplete packages and retain the native biography boundaries."""
from pathlib import Path
import importlib.util
import json
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('delivery2213', ROOT / 'scripts/build_delivery_v2213.py')
delivery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(delivery)


class Delivery(unittest.TestCase):
    def test_rejects_missing_validation(self):
        for qa in ({'version': '2.21.3', 'releaseGatesPassed': False},
                   {'version': '2.21.2', 'releaseGatesPassed': True},
                   {'version': '2.21.3', 'releaseGatesPassed': True, 'runtimeManifestSha256': '0' * 64}):
            with self.subTest(qa=qa), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                (root / 'tests').mkdir()
                evidence = root / 'tests/evidence/2.21.3'
                evidence.mkdir(parents=True)
                (root / 'tests/expected_release_v2213.json').write_text('{"version":"2.21.3"}')
                (evidence / 'QA_SUMMARY.json').write_text(json.dumps(qa))
                with patch.object(delivery, 'ROOT', root), patch.object(delivery, 'EVIDENCE', evidence):
                    with self.assertRaises(ValueError):
                        delivery.checked_inputs()

    def test_native_read_and_accept_sets_are_distinct(self):
        contract = json.loads((ROOT / 'src/v2_21_3/native_contract.json').read_text())
        native = contract['native']
        self.assertEqual(native['oldid'], 73315036)
        self.assertEqual(len(native['consumed']), 349)
        self.assertEqual(len(native['accepted']), 353)
        self.assertTrue(set(native['consumed']) <= set(native['accepted']))
        self.assertIn('bgcolour', native['accepted'])
        self.assertNotIn('bgcolour', native['consumed'])
        self.assertNotIn('data_batismo', contract['priority']['birthDate'])

    def test_native_alias_order(self):
        contract = json.loads((ROOT / 'src/v2_21_3/native_contract.json').read_text())
        groups = json.loads((ROOT / 'src/v2_21_3/coalesced_groups.json').read_text())
        self.assertEqual(len(groups['firstNonemptyGroups']), 61)
        for row in groups['firstNonemptyGroups']:
            self.assertTrue(row['orderVerifiedInRenderer'])
            self.assertTrue(set(row['keys']) <= set(contract['native']['consumed']))
        self.assertEqual(contract['priority']['size'][0], 'imagem_tamanho')
        self.assertEqual(contract['priority']['alt'][0], 'imagem_alt')

    def test_previous_manual_history_is_exact(self):
        previous = (ROOT / 'docs/2.21.2/Documentacao_RevisaWiki_v2_21_2.wiki').read_text().split('== Histórico das versões ==\n', 1)[1]
        current = (ROOT / 'docs/2.21.3/Documentacao_RevisaWiki_v2_21_3.wiki').read_text().split('== Histórico das versões ==\n', 1)[1]
        old_entry = previous.index('=== 2.21.2 ===')
        new_entry = current.index('=== 2.21.3 ===')
        self.assertEqual(current[:new_entry], previous[:old_entry])
        self.assertTrue(current.endswith(previous[old_entry:]))

    def test_fixed_call_unchanged_and_page_limits(self):
        manifest = json.loads((ROOT / 'tests/expected_release_v2213.json').read_text())
        for name, pin in manifest['files'].items():
            if name.startswith('Chamada_fixa'):
                self.assertEqual((ROOT / 'dist/2.21.3' / name).read_bytes(), (ROOT / 'dist/2.21.2' / name).read_bytes())
            if not name.endswith('_completo.js'):
                self.assertLess(pin['bytes'], 2097152)
        self.assertEqual(manifest['limits']['calculationDeadlineMilliseconds'], 60000)


if __name__ == '__main__':
    unittest.main()
