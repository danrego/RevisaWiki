"""Isolated delivery controls. Native requests are replaced only in fixtures."""
from contextlib import redirect_stdout
from copy import deepcopy
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
import json
import re
import shutil
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[2]
REVISION = '2.21.1-installation.1'


def load(path, alias):
    spec = spec_from_file_location(alias, path)
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def digest(path):
    return sha256(Path(path).read_bytes()).hexdigest()


class InstallationDeliveryTests(unittest.TestCase):
    def setUp(self):
        self.temporary = TemporaryDirectory(prefix='revisawiki-installation-delivery-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.module = load(ROOT / 'scripts/build_delivery_v2211_installation1.py', '_installation_delivery_fixture')
        self.dist = self.root / 'dist' / REVISION
        self.current_manifest = json.loads((ROOT / self.module.MANIFEST).read_text())
        names = ['LICENSE', self.module.MANIFEST, self.module.BASE_MANIFEST,
                 'dist/2.21.1/MANIFESTO.json', 'tests/evidence/2.21.1/COVERAGE.json',
                 'scripts/check_wiki_presave.py']
        names += list(self.current_manifest['sourceInputs'])
        names += ['dist/2.21.1/' + name for name in self.module.RUNTIME_FILES]
        names += ['dist/' + REVISION + '/' + name for name in self.module.RUNTIME_FILES]
        names += ['docs/2.21.1/' + name for name in self.module.DOC_NAMES]
        names += ['dist/2.21.1/Demonstracao_RevisaWiki_v2_21_1.html']
        names += ['dist/2.21.1/Demonstracao/' + name for name in ['DEMONSTRACAO.html', 'demonstracao.css', 'demonstracao.js', 'motor.js', 'exemplos.json']]
        for name in names:
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, target)
        gate = load(ROOT / 'scripts/check_wiki_presave.py', '_installation_gate_fixture')
        data_path = self.dist / 'RevisaWiki_v2_21_1_dados.js'
        with patch.object(gate, 'request_presave', return_value=data_path.read_bytes()[:-1]):
            self.receipt = gate.check_presave(self.root / self.module.MANIFEST, data_path,
                baseline_manifest_path=self.root / self.module.BASE_MANIFEST,
                baseline_data_path=self.root / 'dist/2.21.1/RevisaWiki_v2_21_1_dados.js')
        self.receipt_path = self.root / self.module.PRESAVE_RECORD
        self.write(self.receipt_path, self.receipt)
        self.qa_path = self.root / 'tests/evidence' / REVISION / 'QA_SUMMARY.json'
        self.qa = {'version': '2.21.1', 'distributionRevision': REVISION,
                   'releaseGatesPassed': True, 'runtimeGatesPassed': True,
                   'frozenFiles': self.current_manifest['files'], 'sourceInputs': self.current_manifest['sourceInputs'],
                   'runtimeManifestSha256': digest(self.root / self.module.MANIFEST),
                   'workerDeadlineMilliseconds': 60000, 'unresolvedIntegrityFailures': 0, 'wikipediaWrites': 0,
                   'presaveRoundtripSha256': digest(self.receipt_path),
                   'demonstrationPortableSha256': digest(self.root / 'dist/2.21.1/Demonstracao_RevisaWiki_v2_21_1.html'),
                   'docValidationParagraphs': ['Controles sintéticos da montagem da entrega. As consultas nativas foram substituídas apenas neste teste.']}
        self.write(self.qa_path, self.qa)
        self.builder = self.module.Delivery(self.root)
        self.original = {name: (self.root / name).read_bytes() for name in names}

    def write(self, path, data):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

    def build(self):
        with redirect_stdout(StringIO()):
            return self.builder.build()

    def no_final_outputs(self):
        self.assertFalse((self.root / 'docs' / REVISION).exists())
        self.assertFalse((self.dist / ('RevisaWiki_' + REVISION + '.zip')).exists())
        self.assertFalse((self.dist / 'MANIFESTO.json').exists())

    def test_package_has_exact_payloads_and_native_receipt(self):
        result = self.build()
        self.assertEqual(result['distributionRevision'], REVISION)
        manifest = json.loads((self.dist / 'MANIFESTO.json').read_text())
        self.assertEqual(manifest['version'], '2.21.1')
        self.assertEqual(manifest['distributionRevision'], REVISION)
        self.assertEqual(len(manifest['copyPayloads']), 7)
        self.assertEqual(manifest['presaveRoundtripSha256'], digest(self.receipt_path))
        with zipfile.ZipFile(self.dist / ('RevisaWiki_' + REVISION + '.zip')) as archive:
            self.assertIsNone(archive.testzip())
            self.assertEqual(len(archive.namelist()), 24)
            self.assertEqual(len(set(archive.namelist())), 24)
            self.assertIn('PRESAVE_ROUNDTRIP.json', archive.namelist())
            for name in archive.namelist():
                self.assertEqual(archive.read(name), (self.dist / name).read_bytes())
        self.assertEqual((self.dist / 'PRESAVE_ROUNDTRIP.json').read_bytes(), self.receipt_path.read_bytes())

    def test_current_index_distinguishes_file_roles_and_preserves_common(self):
        self.build()
        manifest = json.loads((self.dist / 'MANIFESTO.json').read_text())
        rows = manifest['copyPayloads']
        for row in rows:
            self.assertEqual(row['bytes'], (self.dist / row['file']).stat().st_size)
            self.assertEqual(row['sha256'], digest(self.dist / row['file']))
        self.assertEqual([row['label'] for row in rows[:4]], ['Dados', 'Programa', 'Carregador central', 'Documentação'])
        self.assertTrue(rows[0]['destination'].endswith('/RevisaWiki/Dados.js'))
        self.assertTrue(rows[1]['destination'].endswith('/RevisaWiki.js'))
        self.assertTrue(rows[2]['destination'].endswith('/RevisaWiki/Carregador.js'))
        self.assertLess(rows[2]['bytes'], 10000)
        self.assertGreater(rows[1]['bytes'], 2000000)
        index = (self.dist / 'INDICE.md').read_text()
        for phrase in ['cerca de 10 KB', 'cerca de 2 MB', 'oito itens principais', 'referências permanecem iguais', 'mantém o common.js']:
            self.assertIn(phrase, index)
        for name in self.module.FIXED_CALLS:
            self.assertEqual((self.dist / name).read_bytes(), (self.root / 'dist/2.21.1' / name).read_bytes())

    def test_all_previous_49_history_entries_remain_byte_exact(self):
        self.build()
        old = (self.root / 'docs/2.21.1/Documentacao_RevisaWiki_v2_21_1.wiki').read_text()
        entries = old[old.index('=== 2.21.1 ===\n'):]
        current = (self.root / 'docs' / REVISION / 'Documentacao_RevisaWiki_v2_21_1.wiki').read_text()
        self.assertTrue(current.endswith(entries))
        self.assertEqual(len(re.findall(r'^=== [0-9]+\.[0-9]+\.[0-9]+ ===$', current, re.M)), 49)
        self.assertIn('=== 2.21.1: revisão de instalação 1 ===', current)
        self.assertNotRegex(current, r'\n[\t ]*\n[\t ]*\n')
        self.assertIn('blob/main/dist/' + REVISION + '/INDICE.md', current)
        self.assertNotIn('blob/main/dist/2.21.1/INDICE.md', current)
        self.assertNotIn('2.778 cálculos', current.split('== Histórico das versões ==', 1)[0])

    def test_previous_files_and_coverage_are_not_rewritten(self):
        self.build()
        for name, raw in self.original.items():
            self.assertEqual((self.root / name).read_bytes(), raw)
        old = json.loads((self.root / 'tests/evidence/2.21.1/COVERAGE.json').read_text())
        current = json.loads((self.qa_path.parent / 'COVERAGE.json').read_text())
        self.assertEqual(old['items'], current['items'])
        self.assertFalse(current['installationQualification']['automaticRulesChanged'])
        self.assertFalse(current['installationQualification']['historicalResultsRewritten'])

    def test_missing_native_receipt_blocks_delivery(self):
        self.receipt_path.unlink()
        with self.assertRaises(ValueError):
            self.build()
        self.no_final_outputs()

    def test_native_receipt_binding_is_required(self):
        self.qa['presaveRoundtripSha256'] = '0' * 64
        self.write(self.qa_path, self.qa)
        with self.assertRaises(ValueError):
            self.build()
        self.no_final_outputs()

    def test_rebound_false_or_stale_native_receipts_still_fail(self):
        for field, value in [('status', 'failed'), ('inputData', {}), ('decodedDataPreserved', False),
                             ('runtimeManifestSha256', '0' * 64), ('gateScriptSha256', '0' * 64),
                             ('afterPresaveData', {}), ('onlypst', False), ('wikipediaWrites', 1)]:
            with self.subTest(field=field):
                bad = deepcopy(self.receipt)
                bad[field] = value
                self.write(self.receipt_path, bad)
                self.qa['presaveRoundtripSha256'] = digest(self.receipt_path)
                self.write(self.qa_path, self.qa)
                with self.assertRaises(ValueError):
                    self.build()
                self.no_final_outputs()

    def test_false_or_rebound_qa_gates_block(self):
        original = deepcopy(self.qa)
        for field, value in [('releaseGatesPassed', False), ('runtimeGatesPassed', False),
                             ('distributionRevision', 'other'), ('frozenFiles', {}), ('sourceInputs', {}),
                             ('runtimeManifestSha256', '0' * 64), ('workerDeadlineMilliseconds', 60001),
                             ('unresolvedIntegrityFailures', 1), ('wikipediaWrites', 1)]:
            with self.subTest(field=field):
                bad = deepcopy(original)
                bad[field] = value
                self.write(self.qa_path, bad)
                with self.assertRaises(ValueError):
                    self.build()
                self.no_final_outputs()

    def test_source_or_runtime_bytes_changed_after_freeze_block(self):
        for name in ['scripts/wiki_safe_data.py', 'dist/' + REVISION + '/RevisaWiki_v2_21_1.js']:
            with self.subTest(name=name):
                path = self.root / name
                original = path.read_bytes()
                path.write_bytes(original + b'changed')
                with self.assertRaises(ValueError):
                    self.build()
                self.no_final_outputs()
                path.write_bytes(original)

    def test_core_loader_swap_cannot_be_rebound_into_manifest(self):
        core = 'RevisaWiki_v2_21_1.js'
        loader = 'Carregador_comunitario_RevisaWiki_v2_21_1.js'
        core_raw = (self.dist / core).read_bytes()
        (self.dist / loader).write_bytes(core_raw)
        value = deepcopy(self.current_manifest)
        value['files'][loader] = value['files'][core]
        self.write(self.root / self.module.MANIFEST, value)
        with self.assertRaises(ValueError):
            self.build()
        self.no_final_outputs()

    def test_size_limit_and_preserved_catalogue_are_required(self):
        for field in ['bytes', 'hash']:
            bad = deepcopy(self.current_manifest)
            if field == 'bytes':
                bad['files']['RevisaWiki_v2_21_1_dados.js']['bytes'] = 2097152
            else:
                bad['packedCatalogSha256'] = '0' * 64
            self.write(self.root / self.module.MANIFEST, bad)
            with self.assertRaises(ValueError):
                self.build()
            self.no_final_outputs()

    def test_symlink_destination_cannot_redirect_output(self):
        protected = self.root / 'protected'
        protected.write_bytes(b'Protected bytes.\n')
        (self.dist / 'MANIFESTO.json').symlink_to(protected)
        with self.assertRaises(ValueError):
            self.build()
        self.assertEqual(protected.read_bytes(), b'Protected bytes.\n')
        self.assertFalse((self.root / 'docs' / REVISION).exists())

    def test_input_changed_after_capture_is_detected_before_commit(self):
        original = self.builder.documents
        def changed(*args):
            values = original(*args)
            path = self.root / 'scripts/wiki_safe_data.py'
            path.write_bytes(path.read_bytes() + b'changed after capture')
            return values
        with patch.object(self.builder, 'documents', side_effect=changed):
            with self.assertRaises(ValueError):
                self.build()
        self.no_final_outputs()

    def test_repeat_native_command_never_overwrites_frozen_receipt(self):
        self.build()
        reference = (self.dist / 'Referencia_tecnica_RevisaWiki_v2_21_1.txt').read_text()
        self.assertIn('python3 scripts/verify_current_presave.py', reference)
        self.assertNotIn('Transformação pré-salvamento: python3 scripts/check_wiki_presave.py --manifest', reference)
        self.assertEqual(self.receipt, json.loads(self.receipt_path.read_text()))

    def test_changed_demo_auxiliary_bytes_block_delivery(self):
        path = self.root / 'dist/2.21.1/Demonstracao/exemplos.json'
        path.write_bytes(path.read_bytes() + b'changed')
        with self.assertRaises(ValueError):
            self.build()
        self.no_final_outputs()

    def test_demonstration_files_remain_exact(self):
        self.build()
        for name in ['Demonstracao_RevisaWiki_v2_21_1.html', 'Demonstracao/DEMONSTRACAO.html',
                     'Demonstracao/demonstracao.css', 'Demonstracao/demonstracao.js',
                     'Demonstracao/motor.js', 'Demonstracao/exemplos.json']:
            self.assertEqual((self.dist / name).read_bytes(), (self.root / 'dist/2.21.1' / name).read_bytes())


if __name__ == '__main__':
    unittest.main()
