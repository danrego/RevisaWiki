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
spec = importlib.util.spec_from_file_location('delivery2217', ROOT / 'scripts/build_delivery_v2217.py')
delivery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(delivery)


class Delivery(unittest.TestCase):
    def fixture(self, root):
        """Use real pinned bytes; only the aggregate unit-test declaration is synthetic."""
        manifest_path = ROOT / 'tests/expected_release_v2217.json'
        manifest = json.loads(manifest_path.read_bytes())
        names = ['tests/expected_release_v2217.json', 'tests/expected_release_v2216.json',
                 'scripts/check_wiki_presave_v2217.py', 'tests/v2212/coverage_all.json',
                 'dist/2.21.6/RevisaWiki_v2_21_6_dados.js']
        names += list(manifest['sourceInputs'])
        names += ['dist/2.21.7/' + name for name in manifest['files']]
        names += ['tests/evidence/2.21.7/PRESAVE_ROUNDTRIP.json','tests/evidence/2.21.7/NATIVE_INSTALLABLE_SCRIPTS.json','scripts/check_runtime_presave_v2217.py','tests/v2217/feature_examples.json','LICENSE','THIRD_PARTY_NOTICES_2_21_7.md','docs/2.21.6/Documentacao_RevisaWiki_v2_21_6.wiki','docs/2.21.6/Funcionalidades_RevisaWiki_2_21_6.json']
        names += [str(p.relative_to(ROOT))for p in (ROOT/'docs/2.21.7').iterdir()if p.is_file()]
        for name in set(names):
            target = root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, target)
        evidence = root / 'tests/evidence/2.21.7'
        unit_evidence = evidence / 'UNIT_FIXTURE.json'
        unit_evidence.write_text('{"kind":"synthetic-packaging-unit-fixture","isReleaseApproval":false}\n')
        qa = {
            'version': '2.21.7', 'releaseGatesPassed': True,
            'runtimeManifestSha256': delivery.sha(manifest_path.read_bytes()),
            'frozenFiles': manifest['files'], 'sourceInputs': manifest['sourceInputs'],
            'wikipediaWrites': 0, 'workerDeadlineMilliseconds': None, 'fixedAnalysisDeadline': False,
            'unresolvedIncorrectWrites': 0,
            'presaveRoundtripSha256': delivery.sha((evidence / 'PRESAVE_ROUNDTRIP.json').read_bytes()),
            'nativeInstallableRoundtripSha256': delivery.sha((evidence / 'NATIVE_INSTALLABLE_SCRIPTS.json').read_bytes()),
            'evidencePins': {'tests/evidence/2.21.7/UNIT_FIXTURE.json': delivery.pin(unit_evidence.read_bytes()),**{name:delivery.pin((root/name).read_bytes())for name in ['LICENSE','THIRD_PARTY_NOTICES_2_21_7.md','docs/2.21.6/Documentacao_RevisaWiki_v2_21_6.wiki','docs/2.21.6/Funcionalidades_RevisaWiki_2_21_6.json']}},
            'coverageSha256': delivery.sha((root / 'tests/v2212/coverage_all.json').read_bytes()),
        }
        docroot=root/'docs/2.21.7'
        feature_raw=(docroot/'Funcionalidades_RevisaWiki_2_21_7.json').read_bytes()
        example_raw=(root/'tests/v2217/feature_examples.json').read_bytes()
        example_count=len(json.loads(example_raw)['examples'])
        qa.update(documentedFeaturesSha256=delivery.sha(feature_raw),documentedFeatureCount=len(json.loads(feature_raw)['features']),documentationExamplesSha256=delivery.sha(example_raw),documentationExamples=example_count,documentationExamplesPassed=example_count,documentationInputs={p.name:delivery.pin(p.read_bytes())for p in docroot.iterdir()if p.is_file()})
        (evidence / 'QA_SUMMARY.json').write_text(json.dumps(qa))
        return manifest, qa, evidence

    def checked_fixture(self, root, evidence):
        with patch.object(delivery, 'ROOT', root), patch.object(delivery, 'DIST', root / 'dist/2.21.7'), patch.object(delivery, 'EVIDENCE', evidence), patch.object(delivery,'DOCS',root/'docs/2.21.7'):
            return delivery.checked_inputs()

    def write_qa(self, evidence, qa):
        (evidence / 'QA_SUMMARY.json').write_bytes(delivery.raw_json(qa))

    def rebind_features(self, root, evidence, qa, features):
        """Keep unit document pins coherent so semantic guards are exercised."""
        from collections import Counter
        features['counts'] = {
            'features': len(features['features']),
            'families': dict(Counter(row.get('family', '') for row in features['features'])),
        }
        path = root / 'docs/2.21.7/Funcionalidades_RevisaWiki_2_21_7.json'
        path.write_bytes(delivery.raw_json(features))
        qa['documentedFeaturesSha256'] = delivery.sha(path.read_bytes())
        qa['documentedFeatureCount'] = len(features['features'])
        qa['documentationInputs'][path.name] = delivery.pin(path.read_bytes())
        self.write_qa(evidence, qa)

    def rebind_manifest(self, root, evidence, qa, manifest):
        """Exercise an early manifest guard, before now-stale native receipts."""
        path = root / 'tests/expected_release_v2217.json'
        path.write_bytes(delivery.raw_json(manifest))
        qa['runtimeManifestSha256'] = delivery.sha(path.read_bytes())
        qa['sourceInputs'] = manifest['sourceInputs']
        qa['frozenFiles'] = manifest['files']
        self.write_qa(evidence, qa)

    def test_rejects_missing_validation(self):
        for qa in ({'version': '2.21.7', 'releaseGatesPassed': False},
                   {'version': '2.21.2', 'releaseGatesPassed': True},
                   {'version': '2.21.7', 'releaseGatesPassed': True, 'runtimeManifestSha256': '0' * 64}):
            with self.subTest(qa=qa), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                (root / 'tests').mkdir()
                evidence = root / 'tests/evidence/2.21.7'
                evidence.mkdir(parents=True)
                (root / 'tests/expected_release_v2217.json').write_text('{"version":"2.21.7"}')
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

    def test_previous_manual_history_versions_are_preserved_in_order(self):
        import re
        previous = (ROOT / 'docs/2.21.6/Documentacao_RevisaWiki_v2_21_6.wiki').read_text().split('== Histórico das versões ==\n', 1)[1]
        current = (ROOT / 'docs/2.21.7/Documentacao_RevisaWiki_v2_21_7.wiki').read_text().split('== Histórico das versões ==\n', 1)[1]
        heads = lambda text: re.findall(r'^=== ([^=]+) ===$', text, re.M)
        self.assertEqual(heads(current), ['2.21.7'] + heads(previous))

    def test_fixed_call_unchanged_and_page_limits(self):
        manifest = json.loads((ROOT / 'tests/expected_release_v2217.json').read_text())
        for name, pin in manifest['files'].items():
            if name.startswith('Chamada_fixa'):
                self.assertEqual((ROOT / 'dist/2.21.7' / name).read_bytes(), (ROOT / 'dist/2.21.6' / name).read_bytes())
            if not name.endswith('_completo.js'):
                self.assertLess(pin['bytes'], 2097152)
        self.assertIsNone(manifest['limits']['calculationDeadlineMilliseconds'])
        self.assertIs(manifest['limits']['fixedAnalysisDeadline'],False)

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
                    'runtime': 'dist/2.21.7/RevisaWiki_v2_21_7.js',
                    'native-receipt': 'tests/evidence/2.21.7/PRESAVE_ROUNDTRIP.json',
                    'evidence': 'tests/evidence/2.21.7/UNIT_FIXTURE.json',
                    'coverage': 'tests/v2212/coverage_all.json',
                }
                target = root / targets[mode]
                target.write_bytes(target.read_bytes() + b' ')
                with self.assertRaises(ValueError):self.checked_fixture(root, evidence)

    def test_explicit_release_integrity_declarations_are_required(self):
        for key, value in (('wikipediaWrites', 1), ('workerDeadlineMilliseconds', 60000), ('fixedAnalysisDeadline',True),
                           ('unresolvedIncorrectWrites', 1), ('sourceInputs', {}),
                           ('evidencePins', {}), ('documentedFeatureCount',0), ('documentationExamplesPassed',0), ('documentationInputs',{}), ('presaveRoundtripSha256', '0' * 64)):
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
                (root / 'dist/2.21.7' / name).write_bytes(raw)
                manifest['files'][name] = delivery.pin(raw)
                manifest_path = root / 'tests/expected_release_v2217.json'
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
                qa['evidencePins'][name] = next(iter(qa['evidencePins'].values()))
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

    def test_frozen_license_and_inherited_documents_cannot_drift(self):
        names = ('LICENSE', 'THIRD_PARTY_NOTICES_2_21_7.md',
                 'docs/2.21.6/Documentacao_RevisaWiki_v2_21_6.wiki',
                 'docs/2.21.6/Funcionalidades_RevisaWiki_2_21_6.json')
        for name in names:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                _, qa, evidence = self.fixture(root)
                path = root / name
                path.write_bytes(path.read_bytes() + b'\nAltered unit-fixture input.\n')
                self.write_qa(evidence, qa)
                with self.assertRaisesRegex(ValueError, 'A frozen release input changed'):
                    self.checked_fixture(root, evidence)

    def test_all_license_and_inherited_document_pins_are_required(self):
        names = ('LICENSE', 'THIRD_PARTY_NOTICES_2_21_7.md',
                 'docs/2.21.6/Documentacao_RevisaWiki_v2_21_6.wiki',
                 'docs/2.21.6/Funcionalidades_RevisaWiki_2_21_6.json')
        for name in names:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                _, qa, evidence = self.fixture(root)
                del qa['evidencePins'][name]
                self.write_qa(evidence, qa)
                with self.assertRaisesRegex(ValueError, 'Exact license and inherited-document inputs are required'):
                    self.checked_fixture(root, evidence)

    def test_coherent_document_pins_cannot_hide_missing_inherited_feature(self):
        for mode in ('remove', 'rename'):
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                _, qa, evidence = self.fixture(root)
                path = root / 'docs/2.21.7/Funcionalidades_RevisaWiki_2_21_7.json'
                features = json.loads(path.read_bytes())
                previous = json.loads((root / 'docs/2.21.6/Funcionalidades_RevisaWiki_2_21_6.json').read_bytes())
                inherited = previous['features'][0]['id']
                index = next(i for i, row in enumerate(features['features']) if row['id'] == inherited)
                if mode == 'remove':
                    features['features'].pop(index)
                else:
                    features['features'][index]['id'] = 'unit-renamed-inherited-feature'
                self.rebind_features(root, evidence, qa, features)
                with self.assertRaisesRegex(ValueError, 'Inherited feature identity missing'):
                    self.checked_fixture(root, evidence)

    def test_coherent_document_pins_cannot_hide_invalid_feature_text(self):
        for field in ('id', 'family', 'title', 'description', 'condition', 'type', 'verification'):
            for mode in ('missing', 'empty', 'whitespace', 'null', 'not-text'):
                with self.subTest(field=field, mode=mode), tempfile.TemporaryDirectory() as folder:
                    root = Path(folder)
                    _, qa, evidence = self.fixture(root)
                    path = root / 'docs/2.21.7/Funcionalidades_RevisaWiki_2_21_7.json'
                    features = json.loads(path.read_bytes())
                    # A new feature is used for the id mutation so the required
                    # field guard is tested independently of inherited IDs.
                    if field == 'id':
                        previous = json.loads((root / 'docs/2.21.6/Funcionalidades_RevisaWiki_2_21_6.json').read_bytes())
                        inherited_ids = {item['id'] for item in previous['features']}
                        row = next(item for item in features['features'] if item['id'] not in inherited_ids)
                    else:
                        row = features['features'][0]
                    if mode == 'missing':
                        del row[field]
                    else:
                        row[field] = {'empty': '', 'whitespace': ' \t\n', 'null': None, 'not-text': 7}[mode]
                    self.rebind_features(root, evidence, qa, features)
                    with self.assertRaisesRegex(ValueError, 'Incomplete feature fields or examples'):
                        self.checked_fixture(root, evidence)

    def test_coherent_document_pins_cannot_hide_missing_feature_examples(self):
        for field in ('before', 'after'):
            for mode in ('missing', 'null', 'list', 'number'):
                with self.subTest(field=field, mode=mode), tempfile.TemporaryDirectory() as folder:
                    root = Path(folder)
                    _, qa, evidence = self.fixture(root)
                    path = root / 'docs/2.21.7/Funcionalidades_RevisaWiki_2_21_7.json'
                    features = json.loads(path.read_bytes())
                    if mode == 'missing':
                        del features['features'][0][field]
                    else:
                        features['features'][0][field] = {'null': None, 'list': [], 'number': 7}[mode]
                    self.rebind_features(root, evidence, qa, features)
                    with self.assertRaisesRegex(ValueError, 'Incomplete feature fields or examples'):
                        self.checked_fixture(root, evidence)

    def test_coherent_document_pins_cannot_hide_invalid_feature_lists(self):
        for field in ('optionKeys', 'entryPoints'):
            for mode in ('missing', 'null', 'text', 'non-text-item', 'empty-item', 'whitespace-item'):
                with self.subTest(field=field, mode=mode), tempfile.TemporaryDirectory() as folder:
                    root = Path(folder)
                    _, qa, evidence = self.fixture(root)
                    path = root / 'docs/2.21.7/Funcionalidades_RevisaWiki_2_21_7.json'
                    features = json.loads(path.read_bytes())
                    if mode == 'missing':
                        del features['features'][0][field]
                    else:
                        features['features'][0][field] = {
                            'null': None, 'text': 'value', 'non-text-item': [7],
                            'empty-item': [''], 'whitespace-item': [' \t'],
                        }[mode]
                    self.rebind_features(root, evidence, qa, features)
                    with self.assertRaisesRegex(ValueError, 'Incomplete feature option or entry-point metadata'):
                        self.checked_fixture(root, evidence)

    def test_coherent_manifest_cannot_hide_unsafe_source_input_path(self):
        for name in ('/fixture-source.js', '../fixture-source.js', 'src/../../fixture-source.js', ''):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                manifest, qa, evidence = self.fixture(root)
                manifest['sourceInputs'][name] = next(iter(manifest['sourceInputs'].values()))
                self.rebind_manifest(root, evidence, qa, manifest)
                with self.assertRaisesRegex(ValueError, 'Invalid source input path'):
                    self.checked_fixture(root, evidence)

    def test_source_input_symlink_cannot_escape_fixture_root(self):
        with tempfile.TemporaryDirectory() as folder, tempfile.TemporaryDirectory() as outside:
            root = Path(folder)
            manifest, qa, evidence = self.fixture(root)
            external = Path(outside) / 'external-source.js'
            external.write_bytes(b'// Synthetic external unit-fixture source.\n')
            link = root / 'src/external-source.js'
            link.symlink_to(external)
            manifest['sourceInputs']['src/external-source.js'] = delivery.pin(external.read_bytes())
            self.rebind_manifest(root, evidence, qa, manifest)
            with self.assertRaisesRegex(ValueError, 'Invalid source input path'):
                self.checked_fixture(root, evidence)

    def test_native_installable_receipt_is_required(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            _, _, evidence = self.fixture(root)
            (evidence / 'NATIVE_INSTALLABLE_SCRIPTS.json').unlink()
            with self.assertRaises(FileNotFoundError):
                self.checked_fixture(root, evidence)

    def test_native_installable_receipt_hash_cannot_be_stale(self):
        for mode in ('missing-hash', 'wrong-hash', 'changed-bytes'):
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                _, qa, evidence = self.fixture(root)
                if mode == 'missing-hash':
                    del qa['nativeInstallableRoundtripSha256']
                elif mode == 'wrong-hash':
                    qa['nativeInstallableRoundtripSha256'] = '0' * 64
                else:
                    path = evidence / 'NATIVE_INSTALLABLE_SCRIPTS.json'
                    path.write_bytes(path.read_bytes() + b' ')
                self.write_qa(evidence, qa)
                with self.assertRaisesRegex(ValueError, 'Installable pre-save receipt does not match QA'):
                    self.checked_fixture(root, evidence)

    def test_matching_qa_hash_cannot_hide_invalid_native_installable_receipt(self):
        modes = ('version', 'status', 'runtime-hash', 'gate-hash', 'authentication', 'write-count',
                 'api-action', 'only-pst', 'missing-script', 'extra-script', 'input-pin',
                 'output-pin', 'preservation')
        for mode in modes:
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                _, qa, evidence = self.fixture(root)
                path = evidence / 'NATIVE_INSTALLABLE_SCRIPTS.json'
                receipt = json.loads(path.read_bytes())
                first = next(iter(receipt['scripts']))
                if mode == 'missing-script':
                    del receipt['scripts'][first]
                elif mode == 'extra-script':
                    receipt['scripts']['RevisaWiki_v2_21_7_completo.js'] = receipt['scripts'][first]
                elif mode == 'input-pin':
                    receipt['scripts'][first]['input']['sha256'] = '0' * 64
                elif mode == 'output-pin':
                    receipt['scripts'][first]['nativeOutput']['sha256'] = '0' * 64
                elif mode == 'preservation':
                    receipt['scripts'][first]['sourcePreservedExceptTerminalNewline'] = False
                else:
                    key, value = {
                        'version': ('version', '2.21.6'), 'status': ('status', 'failed'),
                        'runtime-hash': ('runtimeManifestSha256', '0' * 64),
                        'gate-hash': ('gateScriptSha256', '0' * 64),
                        'authentication': ('authenticated', True), 'write-count': ('wikipediaWrites', 1),
                        'api-action': ('apiAction', 'edit'), 'only-pst': ('onlypst', False),
                    }[mode]
                    receipt[key] = value
                path.write_bytes(delivery.raw_json(receipt))
                qa['nativeInstallableRoundtripSha256'] = delivery.sha(path.read_bytes())
                self.write_qa(evidence, qa)
                with self.assertRaisesRegex(ValueError, 'invalid-runtime-presave-receipt|incomplete-runtime-presave-receipt|changed-runtime-presave-source'):
                    self.checked_fixture(root, evidence)

    def test_all_six_native_installable_script_rows_are_bound(self):
        canonical = json.loads((ROOT / 'tests/evidence/2.21.7/NATIVE_INSTALLABLE_SCRIPTS.json').read_bytes())
        names = tuple(canonical['scripts'])
        self.assertEqual(len(names), 6)
        for name in names:
            for mode in ('missing', 'input', 'output', 'preservation'):
                with self.subTest(name=name, mode=mode), tempfile.TemporaryDirectory() as folder:
                    root = Path(folder)
                    _, qa, evidence = self.fixture(root)
                    path = evidence / 'NATIVE_INSTALLABLE_SCRIPTS.json'
                    receipt = json.loads(path.read_bytes())
                    if mode == 'missing':
                        del receipt['scripts'][name]
                    elif mode == 'input':
                        receipt['scripts'][name]['input']['bytes'] += 1
                    elif mode == 'output':
                        receipt['scripts'][name]['nativeOutput']['sha256'] = '0' * 64
                    else:
                        receipt['scripts'][name]['sourcePreservedExceptTerminalNewline'] = False
                    path.write_bytes(delivery.raw_json(receipt))
                    qa['nativeInstallableRoundtripSha256'] = delivery.sha(path.read_bytes())
                    self.write_qa(evidence, qa)
                    with self.assertRaisesRegex(ValueError, 'incomplete-runtime-presave-receipt|changed-runtime-presave-source'):
                        self.checked_fixture(root, evidence)


if __name__ == '__main__':
    unittest.main()
