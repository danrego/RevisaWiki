"""Isolated synthetic controls for the 2.21.1 delivery builder.

These fixtures never replace real release QA, runtime files or prior results.
"""
from copy import deepcopy
from contextlib import redirect_stdout
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
import json
import re
import sys
import shutil
import unittest
import zipfile

REPO = Path(__file__).resolve().parents[2]


def load_builder():
    spec = spec_from_file_location('_synthetic_v2211_delivery', REPO / 'scripts/build_delivery_v2211.py')
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class DeliveryControls(unittest.TestCase):
    def setUp(self):
        self.temporary = TemporaryDirectory(prefix='revisawiki-2211-delivery-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / 'synthetic-repository'
        self.root.mkdir()
        self.module = load_builder()
        m = self.module
        self.dist = self.root / 'dist/2.21.1'
        self.dist.mkdir(parents=True)
        base_dist = self.root / 'dist/2.21.0'
        base_dist.mkdir(parents=True)
        self.old_docs = self.root / 'docs/2.21.0'
        self.old_docs.mkdir(parents=True)
        self.base_files = {}
        self.runtime = {}
        for name in m.RUNTIME_FILES:
            old = name.replace('_v2_21_1', '_v2_21_0')
            raw = b'/* Synthetic immutable runtime 2.21.0. */\n'
            current = b'/* Synthetic immutable runtime 2.21.1. */\nglobalThis.synthetic=true;\n'
            if name in m.FIXED_CALLS:
                raw = current = b'/* Synthetic stable common call. */\n'
            (base_dist / old).write_bytes(raw)
            (self.dist / name).write_bytes(current)
            self.base_files[old] = self.pin(raw)
            self.runtime[name] = self.pin(current)
        self.old_manifest = {'version': '2.21.0', 'files': self.base_files, 'packedCatalogSha256': '0' * 64}
        self.write('tests/expected_release_v2210.json', self.old_manifest)
        m.BASE_MANIFEST_SHA256 = self.digest(self.root / 'tests/expected_release_v2210.json')
        self.source_inputs = {}
        for name in m.SOURCE_INPUTS:
            self.write_raw(name, b'/* Synthetic build input. */\n')
            self.source_inputs[name] = self.pin((self.root / name).read_bytes())
        self.manifest = {'version': '2.21.1', 'baseVersion': '2.21.0', 'baseManifestSha256': m.BASE_MANIFEST_SHA256,
                         'files': self.runtime, 'sourceInputs': self.source_inputs, 'packedCatalogSha256': '0' * 64}
        self.manifest_path = self.root / 'tests/expected_release_v2211.json'
        self.write(self.manifest_path, self.manifest)
        old_pins = {}
        for name in m.DOC_NAMES:
            old = name.replace('_v2_21_1', '_v2_21_0').replace('_2_21_1.md', '_2_21.md')
            raw = (REPO / 'docs/2.21.0' / old).read_bytes()
            (self.old_docs / old).write_bytes(raw)
            old_pins[old] = self.pin(raw)
        self.write('dist/2.21.0/MANIFESTO.json', {'files': old_pins})
        m.BASE_DELIVERY_SHA256 = self.digest(base_dist / 'MANIFESTO.json')
        self.write_raw('tests/evidence/2.21.0/COVERAGE.json', (REPO / 'tests/evidence/2.21.0/COVERAGE.json').read_bytes())
        self.write_raw('LICENSE', b'Synthetic license fixture.\n')
        for name in ('DEMONSTRACAO.html', 'demonstracao.css', 'demonstracao.js', 'motor.js'):
            self.write_raw('src/demo_v221/' + name, (REPO / 'src/demo_v221' / name).read_bytes())
        examples = [{'id': 'synthetic-1', 'family': 'syntax', 'title': 'Exemplo fictício',
                     'explanation': 'O texto já está correto.', 'source': 'Texto.', 'expected': 'Texto.',
                     'options': {'autoPreview': False, 'registryDoiCheck': False}}]
        self.write('tests/v221/demo_examples.json', examples)
        m.DEMO_FIXTURE_SHA256 = self.digest(self.root / 'tests/v221/demo_examples.json')
        m.DEMO_EXAMPLES = 1
        self.qa_path = self.root / 'tests/evidence/2.21.1/QA_SUMMARY.json'
        self.qa = {'version': '2.21.1', 'releaseGatesPassed': True, 'runtimeGatesPassed': True,
                   'frozenFiles': deepcopy(self.runtime), 'sourceInputs': deepcopy(self.source_inputs),
                   'runtimeManifestSha256': self.digest(self.manifest_path), 'baseManifestSha256': m.BASE_MANIFEST_SHA256,
                   'workerDeadlineMilliseconds': 60000, 'unresolvedIntegrityFailures': 0, 'wikipediaWrites': 0,
                   'docValidationParagraphs': ['Synthetic delivery controls only.'],
                   'demonstrationFixtureSha256': m.DEMO_FIXTURE_SHA256, 'demonstrationExamples': 1}
        self.write(self.qa_path, self.qa)
        self.builder = m.Delivery(self.root)
        preview = self.root / 'temporary-preview'
        self.build(preview, self.qa_path)
        self.qa['demonstrationPortableSha256'] = self.digest(preview / 'Demonstracao_RevisaWiki_v2_21_1.html')
        self.write(self.qa_path, self.qa)

    @staticmethod
    def pin(raw):
        return {'bytes': len(raw), 'sha256': sha256(raw).hexdigest()}

    @staticmethod
    def digest(path):
        return sha256(Path(path).read_bytes()).hexdigest()

    def write_raw(self, path, raw):
        path = Path(path)
        if not path.is_absolute():
            path = self.root / path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)

    def write(self, path, value):
        self.write_raw(path, (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode())

    def build(self, *args):
        with redirect_stdout(StringIO()):
            return self.builder.build(*args)

    def no_final_outputs(self):
        self.assertFalse((self.root / 'docs/2.21.1').exists())
        self.assertFalse((self.dist / 'RevisaWiki_2.21.1.zip').exists())
        self.assertFalse((self.qa_path.parent / 'COVERAGE.json').exists())

    def test_actual_package_index_archive_and_qa_binding(self):
        self.build()
        manifest = json.loads((self.dist / 'MANIFESTO.json').read_bytes())
        public = json.loads((self.dist / 'ARQUIVOS.json').read_bytes())
        self.assertEqual(manifest['version'], '2.21.1')
        self.assertEqual(len(manifest['copyPayloads']), 7)
        self.assertEqual(manifest['qaSha256'], self.digest(self.qa_path))
        self.assertEqual(public['qaSummarySha256'], manifest['qaSha256'])
        with zipfile.ZipFile(self.dist / 'RevisaWiki_2.21.1.zip') as archive:
            self.assertEqual(len(archive.namelist()), 23)
            self.assertEqual(len(set(archive.namelist())), 23)
            self.assertIsNone(archive.testzip())
            for name in archive.namelist():
                self.assertEqual(archive.read(name), (self.dist / name).read_bytes())
        index = (self.dist / 'INDICE.md').read_text()
        for number, row in enumerate(manifest['copyPayloads'], 1):
            self.assertIn('| ' + str(number) + '. ' + row['label'] + ' |', index)
            self.assertEqual(self.pin((self.dist / row['file']).read_bytes()), {key: row[key] for key in ('bytes', 'sha256')})
        self.assertIn('Quem já usa a chamada fixa mantém o common.js', index)

    def test_old_48_history_entries_remain_exact(self):
        self.build()
        before = (self.old_docs / 'Documentacao_RevisaWiki_v2_21_0.wiki').read_text()
        history = before.split('== Histórico das versões ==\n', 1)[1]
        match = re.search(r'^=== [0-9]+\.[0-9]+\.[0-9]+ ===$', history, re.M)
        old_entries = history[match.start():]
        after = (self.dist / 'Documentacao_RevisaWiki_v2_21_1.wiki').read_text()
        self.assertTrue(after.endswith(old_entries))
        self.assertEqual(len(re.findall(r'^=== [0-9]+\.[0-9]+\.[0-9]+ ===$', after, re.M)), 49)
        self.assertNotRegex(after, r'\n[\t ]*\n[\t ]*\n')
        self.assertIn('oito itens do nível principal', after)
        self.assertIn('As regras de colunas de referências não mudam nesta atualização.', after)
        self.assertNotIn('13.169 cálculos', after.split('== Histórico das versões ==', 1)[0])

    def test_coverage_is_an_explicit_inherited_overlay(self):
        self.build()
        old = json.loads((self.root / 'tests/evidence/2.21.0/COVERAGE.json').read_bytes())
        current = json.loads((self.qa_path.parent / 'COVERAGE.json').read_bytes())
        self.assertEqual(len(current['items']), 144)
        self.assertEqual(current['previousCoverageSha256'], self.module.BASE_COVERAGE_SHA256)
        self.assertEqual(current['minimumTopLevelEndmatterItems'], 8)
        self.assertIs(current['referenceColumnRulesChanged'], False)
        self.assertEqual(sum(row['qualificationOrigin'] == 'changed-in-2.21.1' for row in current['items']), 1)
        item = next(row for row in current['items'] if row['id'] == 'STR-COMP-01')
        self.assertIn('oito itens', item['summary'])
        self.assertEqual(item['previousSummary'], next(row['summary'] for row in old['items'] if row['id'] == 'STR-COMP-01'))
        self.assertEqual(self.digest(self.root / 'tests/evidence/2.21.0/COVERAGE.json'), self.module.BASE_COVERAGE_SHA256)

    def test_prior_runtime_qa_docs_and_fixed_calls_remain_unchanged(self):
        snapshots = {p: p.read_bytes() for p in (self.root / 'dist/2.21.0').iterdir()}
        snapshots.update({p: p.read_bytes() for p in self.old_docs.iterdir()})
        snapshots[self.qa_path] = self.qa_path.read_bytes()
        self.build()
        self.assertTrue(all(p.read_bytes() == raw for p, raw in snapshots.items()))
        for name in self.module.FIXED_CALLS:
            self.assertEqual((self.dist / name).read_bytes(), (self.root / 'dist/2.21.0' / name).read_bytes())

    def test_false_runtime_qa_blocks_before_final_writes(self):
        self.qa['runtimeGatesPassed'] = False
        self.write(self.qa_path, self.qa)
        with self.assertRaises(ValueError):
            self.build()
        self.no_final_outputs()

    def test_qa_gates_and_bindings_are_all_required(self):
        for field, value in [('version', 'other'), ('releaseGatesPassed', False), ('runtimeManifestSha256', '0' * 64),
                             ('baseManifestSha256', '0' * 64), ('frozenFiles', {}), ('sourceInputs', {}),
                             ('workerDeadlineMilliseconds', 60001), ('unresolvedIntegrityFailures', 1), ('wikipediaWrites', 1)]:
            with self.subTest(field=field):
                bad = deepcopy(self.qa)
                bad[field] = value
                self.write(self.qa_path, bad)
                with self.assertRaises(ValueError):
                    self.build()
                self.no_final_outputs()
        self.write(self.qa_path, self.qa)

    def test_only_separate_preview_can_use_a_draft_validation(self):
        self.qa['releaseGatesPassed'] = self.qa['runtimeGatesPassed'] = False
        self.write(self.qa_path, self.qa)
        preview = self.root / 'draft-preview'
        result = self.build(preview, self.qa_path)
        self.assertTrue(result['preview'])
        self.assertTrue((preview / 'docs/Documentacao_RevisaWiki_v2_21_1.wiki').is_file())
        self.no_final_outputs()
        for unsafe in (self.dist, self.root / 'docs/2.21.1'):
            with self.assertRaises(ValueError):
                self.build(unsafe, self.qa_path)

    def test_changed_source_or_runtime_bytes_are_refused(self):
        for name in [next(iter(self.module.SOURCE_INPUTS)), 'dist/2.21.1/RevisaWiki_v2_21_1.js']:
            with self.subTest(name=name):
                path = self.root / name
                original = path.read_bytes()
                path.write_bytes(original + b'changed')
                with self.assertRaises(ValueError):
                    self.build()
                path.write_bytes(original)
                self.no_final_outputs()

    def test_wrong_demonstration_hash_or_changed_fixtures_blocks_delivery(self):
        bad = deepcopy(self.qa)
        bad['demonstrationPortableSha256'] = '0' * 64
        self.write(self.qa_path, bad)
        with self.assertRaises(ValueError):
            self.build()
        self.no_final_outputs()
        self.write(self.qa_path, self.qa)
        path = self.root / 'tests/v221/demo_examples.json'
        path.write_bytes(path.read_bytes() + b'\n')
        with self.assertRaises(ValueError):
            self.build()
        self.no_final_outputs()

    def test_manifest_source_set_and_size_limit_are_checked(self):
        for field, value in [('sourceInputs', {}), ('packedCatalogSha256', '1' * 64)]:
            bad = deepcopy(self.manifest)
            bad[field] = value
            self.write(self.manifest_path, bad)
            with self.assertRaises(ValueError):
                self.build()
            self.no_final_outputs()
        bad = deepcopy(self.manifest)
        bad['files']['RevisaWiki_v2_21_1_dados.js']['bytes'] = 2_097_152
        self.write(self.manifest_path, bad)
        with self.assertRaises(ValueError):
            self.build()
        self.no_final_outputs()

    def test_symlink_or_directory_destination_blocks_all_outputs(self):
        protected = self.root / 'protected.txt'
        protected.write_bytes(b'Protected existing bytes.\n')
        destination = self.dist / 'MANIFESTO.json'
        destination.symlink_to(protected)
        with self.assertRaises(ValueError):
            self.build()
        self.assertEqual(protected.read_bytes(), b'Protected existing bytes.\n')
        self.no_final_outputs()
        destination.unlink()
        destination.mkdir()
        with self.assertRaises(ValueError):
            self.build()
        self.no_final_outputs()

    def test_unfinished_prose_or_late_input_changes_block_writes(self):
        bad = deepcopy(self.qa)
        bad['docValidationParagraphs'] = ['TODO']
        self.write(self.qa_path, bad)
        with self.assertRaises(ValueError):
            self.build()
        self.no_final_outputs()
        self.write(self.qa_path, self.qa)
        original = self.builder.package
        def mutate_after_assembly(*args):
            result = original(*args)
            path = self.root / next(iter(self.module.SOURCE_INPUTS))
            path.write_bytes(path.read_bytes() + b'changed')
            return result
        with patch.object(self.builder, 'package', side_effect=mutate_after_assembly):
            with self.assertRaises(ValueError):
                self.build()
        self.no_final_outputs()

    def test_demonstration_resources_use_current_engine_and_fixtures(self):
        self.build()
        auxiliary = self.dist / 'Demonstracao'
        motor = (auxiliary / 'motor.js').read_text()
        client = (auxiliary / 'demonstracao.js').read_text()
        self.assertIn("importScripts('../RevisaWiki_v2_21_1_completo.js');", motor)
        self.assertNotIn('_v2_21_0', motor + client)
        self.assertNotIn("book.version!=='2.21.0'", client)
        self.assertIn("book.version!=='2.21.1'", client)
        book = json.loads((auxiliary / 'exemplos.json').read_bytes())
        self.assertEqual(book['version'], '2.21.1')
        self.assertEqual(book['examples'], json.loads((self.root / 'tests/v221/demo_examples.json').read_bytes()))
        self.assertEqual(book['engineSha256'], self.digest(self.dist / 'RevisaWiki_v2_21_1_completo.js'))
        self.assertTrue(book['offline'])
        self.assertFalse(book['externalConfirmationAvailable'])

    def test_old_builder_sources_and_import_alias_remain_unchanged(self):
        names = ['scripts/build_demo_v2210.py', 'scripts/v221_delivery.py']
        snapshots = {REPO / name: (REPO / name).read_bytes() for name in names}
        snapshots.update({p: p.read_bytes() for p in (self.root / 'src/demo_v221').iterdir()})
        marker = object()
        with patch.dict(sys.modules, {'v221_delivery': marker}):
            self.build()
            self.assertIs(sys.modules['v221_delivery'], marker)
        self.assertTrue(all(path.read_bytes() == raw for path, raw in snapshots.items()))

    def test_repeat_build_is_byte_identical(self):
        self.build()
        before = {p.relative_to(self.dist): p.read_bytes() for p in self.dist.rglob('*') if p.is_file()}
        self.build()
        self.assertEqual(before, {p.relative_to(self.dist): p.read_bytes() for p in self.dist.rglob('*') if p.is_file()})


if __name__ == '__main__':
    unittest.main(verbosity=2)
