"""Reject unbound packages and preserve the inherited release contracts.

Temporary positive fixtures exercise the packaging gate only. They contain
the exact frozen runtime and real read-only pre-save receipt, and are not
final aggregate release approval or generated public delivery packages.
"""
from pathlib import Path
import importlib.util
import json
import sys
import tempfile
import unittest
import shutil
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('delivery2214', ROOT / 'scripts/build_delivery_v2214.py')
delivery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(delivery)


class Delivery(unittest.TestCase):
    def fixture(self, root):
        """Use real pinned bytes; only the aggregate unit-test declaration is synthetic."""
        manifest_path = ROOT / 'tests/expected_release_v2214.json'
        manifest = json.loads(manifest_path.read_bytes())
        names = ['tests/expected_release_v2214.json', 'tests/expected_release_v2213.json',
                 'scripts/check_wiki_presave_v2214.py', 'tests/v2212/coverage_all.json',
                 'dist/2.21.3/RevisaWiki_v2_21_3_dados.js']
        names += list(manifest['sourceInputs'])
        names += ['dist/2.21.4/' + name for name in manifest['files']]
        names += ['tests/evidence/2.21.4/PRESAVE_ROUNDTRIP.json']
        for name in set(names):
            target = root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, target)
        evidence = root / 'tests/evidence/2.21.4'
        unit_evidence = evidence / 'UNIT_FIXTURE.json'
        unit_evidence.write_text('{"kind":"synthetic-packaging-unit-fixture","isReleaseApproval":false}\n')
        qa = {
            'version': '2.21.4', 'releaseGatesPassed': True,
            'runtimeManifestSha256': delivery.sha(manifest_path.read_bytes()),
            'frozenFiles': manifest['files'], 'sourceInputs': manifest['sourceInputs'],
            'wikipediaWrites': 0, 'workerDeadlineMilliseconds': 60000,
            'unresolvedIncorrectWrites': 0,
            'presaveRoundtripSha256': delivery.sha((evidence / 'PRESAVE_ROUNDTRIP.json').read_bytes()),
            'evidencePins': {'tests/evidence/2.21.4/UNIT_FIXTURE.json': delivery.pin(unit_evidence.read_bytes())},
            'coverageSha256': delivery.sha((root / 'tests/v2212/coverage_all.json').read_bytes()),
        }
        (evidence / 'QA_SUMMARY.json').write_text(json.dumps(qa))
        return manifest, qa, evidence

    def checked_fixture(self, root, evidence):
        with patch.object(delivery, 'ROOT', root), patch.object(delivery, 'DIST', root / 'dist/2.21.4'), patch.object(delivery, 'EVIDENCE', evidence):
            return delivery.checked_inputs()

    def test_rejects_missing_validation(self):
        for qa in ({'version': '2.21.4', 'releaseGatesPassed': False},
                   {'version': '2.21.2', 'releaseGatesPassed': True},
                   {'version': '2.21.4', 'releaseGatesPassed': True, 'runtimeManifestSha256': '0' * 64}):
            with self.subTest(qa=qa), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                (root / 'tests').mkdir()
                evidence = root / 'tests/evidence/2.21.4'
                evidence.mkdir(parents=True)
                (root / 'tests/expected_release_v2214.json').write_text('{"version":"2.21.4"}')
                (evidence / 'QA_SUMMARY.json').write_text(json.dumps(qa))
                with patch.object(delivery, 'ROOT', root), patch.object(delivery, 'EVIDENCE', evidence):
                    with self.assertRaises(ValueError):
                        delivery.checked_inputs()

    def test_inherited_native_read_and_accept_sets_are_distinct(self):
        contract = json.loads((ROOT / 'src/v2_21_3/native_contract.json').read_text())
        native = contract['native']
        self.assertEqual(native['oldid'], 73315036)
        self.assertEqual(len(native['consumed']), 349)
        self.assertEqual(len(native['accepted']), 353)
        self.assertTrue(set(native['consumed']) <= set(native['accepted']))
        self.assertIn('bgcolour', native['accepted'])
        self.assertNotIn('bgcolour', native['consumed'])
        self.assertNotIn('data_batismo', contract['priority']['birthDate'])

    def test_inherited_native_alias_order(self):
        contract = json.loads((ROOT / 'src/v2_21_3/native_contract.json').read_text())
        groups = json.loads((ROOT / 'src/v2_21_3/coalesced_groups.json').read_text())
        self.assertEqual(len(groups['firstNonemptyGroups']), 61)
        for row in groups['firstNonemptyGroups']:
            self.assertTrue(row['orderVerifiedInRenderer'])
            self.assertTrue(set(row['keys']) <= set(contract['native']['consumed']))
        self.assertEqual(contract['priority']['size'][0], 'imagem_tamanho')
        self.assertEqual(contract['priority']['alt'][0], 'imagem_alt')

    def test_previous_manual_history_is_exact(self):
        previous = (ROOT / 'docs/2.21.3/Documentacao_RevisaWiki_v2_21_3.wiki').read_text().split('== Histórico das versões ==\n', 1)[1]
        current = (ROOT / 'docs/2.21.4/Documentacao_RevisaWiki_v2_21_4.wiki').read_text().split('== Histórico das versões ==\n', 1)[1]
        old_entry = previous.index('=== 2.21.3 ===')
        new_entry = current.index('=== 2.21.4 ===')
        self.assertEqual(current[:new_entry], previous[:old_entry])
        self.assertTrue(current.endswith(previous[old_entry:]))

    def test_fixed_call_unchanged_and_page_limits(self):
        manifest = json.loads((ROOT / 'tests/expected_release_v2214.json').read_text())
        for name, pin in manifest['files'].items():
            if name.startswith('Chamada_fixa'):
                self.assertEqual((ROOT / 'dist/2.21.4' / name).read_bytes(), (ROOT / 'dist/2.21.3' / name).read_bytes())
            if not name.endswith('_completo.js'):
                self.assertLess(pin['bytes'], 2097152)
        self.assertEqual(manifest['limits']['calculationDeadlineMilliseconds'], 60000)

    def test_exact_unit_fixture_passes_checked_inputs(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            manifest, qa, evidence = self.fixture(root)
            actual = self.checked_fixture(root, evidence)
            self.assertEqual(actual[0], manifest)
            self.assertEqual(actual[1], qa)
            self.assertEqual(len(actual[4]['items']), 76)

    def test_matching_qa_cannot_hide_modified_inputs(self):
        for mode in ('source', 'runtime', 'native-receipt', 'evidence', 'coverage'):
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                manifest, qa, evidence = self.fixture(root)
                targets = {
                    'source': next(iter(manifest['sourceInputs'])),
                    'runtime': 'dist/2.21.4/RevisaWiki_v2_21_4.js',
                    'native-receipt': 'tests/evidence/2.21.4/PRESAVE_ROUNDTRIP.json',
                    'evidence': 'tests/evidence/2.21.4/UNIT_FIXTURE.json',
                    'coverage': 'tests/v2212/coverage_all.json',
                }
                target = root / targets[mode]
                target.write_bytes(target.read_bytes() + b' ')
                with self.assertRaises(ValueError):self.checked_fixture(root, evidence)

    def test_explicit_release_integrity_declarations_are_required(self):
        for key, value in (('wikipediaWrites', 1), ('workerDeadlineMilliseconds', 60001),
                           ('unresolvedIncorrectWrites', 1), ('sourceInputs', {}),
                           ('evidencePins', {}), ('presaveRoundtripSha256', '0' * 64)):
            with self.subTest(key=key), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                _, qa, evidence = self.fixture(root)
                qa[key] = value
                (evidence / 'QA_SUMMARY.json').write_text(json.dumps(qa))
                with self.assertRaises(ValueError):self.checked_fixture(root, evidence)

    def test_wiki_page_size_boundary_is_not_bypassed_by_coherent_pins(self):
        for size in (2097152, 2097153):
            with self.subTest(size=size), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                manifest, qa, evidence = self.fixture(root)
                name = 'Chamada_fixa_RevisaWiki_common.js'
                raw = b' ' * size
                (root / 'dist/2.21.4' / name).write_bytes(raw)
                manifest['files'][name] = delivery.pin(raw)
                manifest_path = root / 'tests/expected_release_v2214.json'
                manifest_path.write_text(json.dumps(manifest))
                qa['runtimeManifestSha256'] = delivery.sha(manifest_path.read_bytes())
                qa['frozenFiles'] = manifest['files']
                (evidence / 'QA_SUMMARY.json').write_text(json.dumps(qa))
                with self.assertRaisesRegex(ValueError, 'Wiki page size limit'):
                    self.checked_fixture(root, evidence)

    def test_evidence_path_cannot_escape_public_tree(self):
        for name in ('/fixture.json', '../fixture.json'):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                _, qa, evidence = self.fixture(root)
                qa['evidencePins'] = {name: next(iter(qa['evidencePins'].values()))}
                (evidence / 'QA_SUMMARY.json').write_text(json.dumps(qa))
                with self.assertRaisesRegex(ValueError, 'Invalid evidence path'):
                    self.checked_fixture(root, evidence)

    def test_updated_coverage_pin_does_not_hide_duplicate_choice(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            _, qa, evidence = self.fixture(root)
            path = root / 'tests/v2212/coverage_all.json'
            coverage = json.loads(path.read_bytes())
            coverage['items'][1]['id'] = coverage['items'][0]['id']
            path.write_text(json.dumps(coverage))
            qa['coverageSha256'] = delivery.sha(path.read_bytes())
            (evidence / 'QA_SUMMARY.json').write_text(json.dumps(qa))
            with self.assertRaisesRegex(ValueError, 'Incomplete choice ledger'):
                self.checked_fixture(root, evidence)


if __name__ == '__main__':
    unittest.main()
