"""Finite, isolated delivery-tool checks. No release files or network are changed.

Run with ``python3 tests/v221/delivery_tools.py``. Every builder receives a
temporary synthetic repository. Tests exercise its real checks and writes.
"""
from contextlib import redirect_stdout
from copy import deepcopy
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
from io import StringIO
import base64
import json
from pathlib import Path
import re
import sys
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch
import zipfile


REPOSITORY = Path(__file__).resolve().parents[2]


def digest(raw):
    return sha256(raw).hexdigest()


class DeliveryTools(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory(prefix='revisawiki-delivery-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'repository'
        self.root.mkdir()
        self.dist = self.root / 'dist/2.21.0'
        self.docs = self.root / 'docs/2.21.0'
        self.dist.mkdir(parents=True)
        self.docs.mkdir(parents=True)
        self.module_restore = patch.dict(sys.modules)
        self.module_restore.start()
        self.addCleanup(self.module_restore.stop)
        self.shared = self.load('v221_delivery.py', 'v221_delivery')
        self.shared.ROOT = self.root
        self.shared.DIST = self.dist
        self.shared.DOCS = self.docs
        self.docs_builder = self.load('build_delivery_docs_v2210.py', '_test_v221_docs')
        self.demo_builder = self.load('build_demo_v2210.py', '_test_v221_demo')
        self.package_builder = self.load('build_package_v2210.py', '_test_v221_package')
        self.manifest_path = self.root / 'tests/expected_release_v2210.json'
        self.qa_path = self.root / 'tests/evidence/2.21.0/QA_SUMMARY.json'
        self.coverage_path = self.qa_path.with_name('COVERAGE.json')
        self.example_path = self.root / 'tests/v221/demo_examples.json'
        self.source_path = self.root / 'src/v2_21/integration.js'
        self.source_path.parent.mkdir(parents=True)
        self.source_path.write_text('const fixture = "original";\n')
        for name in self.shared.SOURCE_INPUTS:
            source = self.root / name
            source.parent.mkdir(parents=True, exist_ok=True)
            if source != self.source_path:
                source.write_bytes(('Synthetic build input ' + name + '\n').encode())
        for name in self.shared.RUNTIME_FILES:
            self.dist.joinpath(name).write_bytes(('/* synthetic immutable ' + name + ' */\n').encode())
        self.manifest = {
            'version': '2.21.0',
            'files': {n: self.shared.pin(self.dist / n) for n in sorted(self.shared.RUNTIME_FILES)},
            'sourceInputs': {name: self.shared.pin(self.root / name) for name in sorted(self.shared.SOURCE_INPUTS)},
        }
        self.write_json(self.manifest_path, self.manifest)
        self.write_json(self.root / 'tests/expected_release_v2200.json', {
            'version': '2.20.0',
            'files': {n: self.manifest['files'][n] for n in self.shared.FIXED_CALLS},
        })
        for name in self.shared.REQUIRED_DOCS:
            self.docs.joinpath(name).write_text('Synthetic reviewed document: ' + name + '\n')
        self.root.joinpath('LICENSE').write_text('Synthetic license fixture.\n')
        self.write_json(self.coverage_path, {'items': [{'id': 'X-01', 'disposition': 'preserved-study', 'summary': 'Preserved fixture.'}]})
        previous = self.root / 'docs/2.20.0/Documentacao_RevisaWiki_v2_20_0.wiki'
        previous.parent.mkdir(parents=True)
        previous.write_text('Manual anterior.\n== Histórico das versões ==\n=== 2.20.0 ===\n\nHistorical entry remains unchanged.\n\n== Como as regras são verificadas ==\nOlder checks.\n')
        demo_src = self.root / 'src/demo_v221'
        demo_src.mkdir(parents=True)
        policy = "default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
        demo_src.joinpath('DEMONSTRACAO.html').write_text(
            '<!doctype html><meta http-equiv="Content-Security-Policy" content="' + policy + '">\n'
            '<link rel="stylesheet" href="demonstracao.css">\n'
            'A demonstração usa o mesmo motor do programa distribuído e funciona sem acessar sua conta na Wikipédia.\n'
            '<a href="../INICIO.html">Índice</a><script src="demonstracao.js"></script>\n')
        demo_src.joinpath('demonstracao.css').write_text('body{color:#123}\n')
        demo_src.joinpath('demonstracao.js').write_text('window.syntheticDemo=true;\n')
        demo_src.joinpath('motor.js').write_text("importScripts('../RevisaWiki_v2_19_0_completo.js');\n")
        self.examples = [{'id': 'synthetic-1', 'family': 'syntax', 'title': 'Exemplo fictício',
                          'explanation': 'O texto já está correto.', 'source': 'Exemplo.', 'expected': 'Exemplo.',
                          'options': {'autoPreview': False, 'registryDoiCheck': False}}]
        self.write_json(self.example_path, self.examples)
        self.qa = {'version': '2.21.0', 'releaseGatesPassed': True,
                   'frozenFiles': deepcopy(self.manifest['files']),
                   'runtimeManifestSha256': digest(self.manifest_path.read_bytes()),
                   'baseManifestSha256': digest(self.root.joinpath('tests/expected_release_v2200.json').read_bytes()),
                   'sourceInputs': deepcopy(self.manifest['sourceInputs']),
                   'wikipediaWrites': 0, 'workerDeadlineMilliseconds': 60_000,
                   'unresolvedIntegrityFailures': 0, 'docValidationParagraphs': ['Synthetic reviewed validation.'],
                   'demonstrationFixtureSha256': digest(self.example_path.read_bytes()), 'demonstrationExamples': 1}
        preview = self.root / 'demo-preview'
        with redirect_stdout(StringIO()):
            built = self.demo_builder.build_demo(preview, preview=True)
        self.qa['demonstrationPortableSha256'] = built['portableSha256']
        portable = preview / built['portableFile']
        self.dist.joinpath(built['portableFile']).write_bytes(portable.read_bytes())
        self.write_json(self.qa_path, self.qa)

    def load(self, filename, alias):
        spec = spec_from_file_location(alias, REPOSITORY / 'scripts' / filename)
        module = module_from_spec(spec)
        sys.modules[alias] = module
        spec.loader.exec_module(module)
        return module

    @staticmethod
    def write_json(path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

    def save_manifest(self):
        self.write_json(self.manifest_path, self.manifest)

    def save_qa(self):
        self.write_json(self.qa_path, self.qa)

    def package(self, output):
        with redirect_stdout(StringIO()):
            return self.package_builder.build(output)

    def assert_symlink_sink_preserved(self, call, link, original):
        original.parent.mkdir(parents=True, exist_ok=True)
        original.write_bytes(b'Protected original bytes.\n')
        before = original.read_bytes()
        link.parent.mkdir(parents=True, exist_ok=True)
        link.symlink_to(original)
        error = None
        try:
            with redirect_stdout(StringIO()):
                call()
        except (ValueError, OSError) as caught:
            error = caught
        self.assertEqual(original.read_bytes(), before, 'A rejected symbolic-link destination must never overwrite its target')
        self.assertIsNotNone(error, 'A symbolic-link output destination must be rejected')

    def test_qa_missing_is_rejected(self):
        self.qa_path.unlink()
        with self.assertRaises(ValueError):
            self.shared.checked_qa(self.manifest)

    def test_all_builders_require_final_qa_before_normal_output(self):
        self.qa['releaseGatesPassed'] = False
        self.save_qa()
        before = {p.name: p.read_bytes() for p in self.docs.iterdir()}
        for label, call, out in [
            ('docs', lambda: self.docs_builder.build(), None),
            ('demo', lambda: self.demo_builder.build_demo(self.root / 'rejected-demo'), self.root / 'rejected-demo'),
            ('package', lambda: self.package(self.root / 'rejected-package'), self.root / 'rejected-package'),
        ]:
            with self.subTest(builder=label), self.assertRaises(ValueError):
                call()
            if out is not None:
                self.assertFalse(out.exists())
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.docs.iterdir()})

    def test_qa_integrity_failure_is_rejected(self):
        self.qa['unresolvedIntegrityFailures'] = 1
        self.save_qa()
        with self.assertRaises(ValueError):
            self.shared.checked_qa(self.manifest)

    def test_qa_requires_explicit_gate_and_safety_facts(self):
        mutations = [dict(releaseGatesPassed='true'), dict(releaseGatesPassed=1),
                     dict(wikipediaWrites=1), dict(workerDeadlineMilliseconds=60_001),
                     dict(unresolvedIntegrityFailures=None), dict(version='2.20.0')]
        for values in mutations:
            with self.subTest(values=values):
                self.write_json(self.qa_path, {**self.qa, **values})
                with self.assertRaises(ValueError):
                    self.shared.checked_qa(self.manifest)

    def test_qa_runtime_hashes_must_match_exactly(self):
        altered = deepcopy(self.manifest)
        altered['files'][self.shared.INSTALL_FILES[0]]['sha256'] = '0' * 64
        with self.assertRaises(ValueError):
            self.shared.checked_qa(altered)

    def test_qa_binds_manifest_and_source_inputs(self):
        self.source_path.write_text('const fixture = "different source";\n')
        self.manifest['sourceInputs']['src/v2_21/integration.js'] = self.shared.pin(self.source_path)
        self.save_manifest()
        current = self.shared.checked_manifest()
        with self.assertRaises(ValueError):
            self.shared.checked_qa(current)

    def test_manifest_cannot_drop_all_source_bindings(self):
        del self.manifest['sourceInputs']
        self.save_manifest()
        with self.assertRaises(ValueError):
            self.shared.checked_manifest()

    def test_source_catalog_must_be_exactly_the_closed_eleven_names(self):
        variants = [{}, [], {k: v for k, v in self.manifest['sourceInputs'].items() if k != 'package-lock.json'},
                    {**self.manifest['sourceInputs'], 'extra.js': self.shared.pin(self.source_path)}]
        for inputs in variants:
            with self.subTest(inputs=type(inputs).__name__ + ':' + str(len(inputs))):
                self.write_json(self.manifest_path, {**self.manifest, 'sourceInputs': inputs})
                with self.assertRaises(ValueError):
                    self.shared.checked_manifest()

    def test_qa_requires_both_manifest_hash_bindings(self):
        for field in ['runtimeManifestSha256', 'baseManifestSha256']:
            for value in [None, '0' * 64]:
                with self.subTest(field=field, value=value):
                    self.write_json(self.qa_path, {**self.qa, field: value})
                    with self.assertRaises(ValueError):
                        self.shared.checked_qa(self.manifest)

    def test_new_baseline_record_requires_new_qa_binding(self):
        path = self.root / 'tests/expected_release_v2200.json'
        previous = json.loads(path.read_text())
        previous['additionalRecord'] = 'Changed after approval.'
        self.write_json(path, previous)
        current = self.shared.checked_manifest()
        with self.assertRaises(ValueError):
            self.shared.checked_qa(current)

    def test_qa_record_cannot_be_a_symbolic_link(self):
        original = self.root / 'external-qa.json'
        original.write_bytes(self.qa_path.read_bytes())
        self.qa_path.unlink()
        self.qa_path.symlink_to(original)
        with self.assertRaises(ValueError):
            self.shared.checked_qa(self.manifest)

    def test_runtime_drift_is_rejected(self):
        self.dist.joinpath(self.shared.INSTALL_FILES[0]).write_bytes(b'Drift.\n')
        with self.assertRaises(ValueError):
            self.shared.checked_manifest()

    def test_source_drift_is_rejected(self):
        self.source_path.write_bytes(b'Drift.\n')
        with self.assertRaises(ValueError):
            self.shared.checked_manifest()

    def test_exact_install_limit_is_rejected(self):
        for name in self.shared.INSTALL_FILES:
            with self.subTest(file=name):
                original = self.dist.joinpath(name).read_bytes()
                self.dist.joinpath(name).write_bytes(b'x' * self.shared.WIKI_PAGE_LIMIT)
                self.manifest['files'][name] = self.shared.pin(self.dist / name)
                self.save_manifest()
                with self.assertRaises(ValueError):
                    self.shared.checked_manifest()
                self.dist.joinpath(name).write_bytes(original)
                self.manifest['files'][name] = self.shared.pin(self.dist / name)

    def test_one_byte_below_install_limit_is_accepted(self):
        name = self.shared.INSTALL_FILES[1]
        self.dist.joinpath(name).write_bytes(b'x' * (self.shared.WIKI_PAGE_LIMIT - 1))
        self.manifest['files'][name] = self.shared.pin(self.dist / name)
        self.save_manifest()
        self.assertEqual(self.shared.checked_manifest()['files'][name]['bytes'], self.shared.WIKI_PAGE_LIMIT - 1)

    def test_installable_loader_also_has_page_size_limit(self):
        name = 'Carregador_comunitario_RevisaWiki_v2_21_0.js'
        self.dist.joinpath(name).write_bytes(b'x' * self.shared.WIKI_PAGE_LIMIT)
        self.manifest['files'][name] = self.shared.pin(self.dist / name)
        self.save_manifest()
        with self.assertRaises(ValueError):
            self.shared.checked_manifest()

    def test_oversize_complete_bundle_is_local_only_and_allowed(self):
        name = 'RevisaWiki_v2_21_0_completo.js'
        self.dist.joinpath(name).write_bytes(b'x' * (self.shared.WIKI_PAGE_LIMIT + 1))
        self.manifest['files'][name] = self.shared.pin(self.dist / name)
        self.save_manifest()
        self.shared.checked_manifest()

    def test_fixed_common_calls_cannot_change(self):
        for name in self.shared.FIXED_CALLS:
            with self.subTest(file=name):
                self.dist.joinpath(name).write_bytes(b'Different fixed call.\n')
                self.manifest['files'][name] = self.shared.pin(self.dist / name)
                self.save_manifest()
                with self.assertRaises(ValueError):
                    self.shared.checked_manifest()

    def test_safe_file_rejects_traversal_and_symlink_file_or_parent(self):
        outside = self.root / 'outside.txt'
        outside.write_text('Protected.\n')
        for name in ['../outside.txt', str(outside), 'a\\outside.txt', 'a\0outside.txt']:
            with self.subTest(name=repr(name)), self.assertRaises(ValueError):
                self.shared.safe_file(self.dist, name)
        self.dist.joinpath('alias.txt').symlink_to(outside)
        self.dist.joinpath('aliasdir').symlink_to(self.root, target_is_directory=True)
        for name in ['alias.txt', 'aliasdir/outside.txt']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                self.shared.safe_file(self.dist, name)

    def test_safe_file_rejects_symbolic_root(self):
        alias = self.root / 'dist-alias'
        alias.symlink_to(self.dist, target_is_directory=True)
        with self.assertRaises(ValueError):
            self.shared.safe_file(alias, self.shared.INSTALL_FILES[0])

    def test_source_manifest_rejects_path_traversal(self):
        self.manifest['sourceInputs'] = {'../outside.js': self.shared.pin(self.source_path)}
        self.save_manifest()
        with self.assertRaises(ValueError):
            self.shared.checked_manifest()

    def test_package_symbolic_output_never_overwrites_original(self):
        output = self.root / 'package-symlink'
        self.assert_symlink_sink_preserved(lambda: self.package(output), output / self.shared.INSTALL_FILES[0], self.root / 'protected/original.js')

    def test_docs_symbolic_output_never_overwrites_original(self):
        name = 'Documentacao_RevisaWiki_v2_21_0.wiki'
        self.docs.joinpath(name).unlink()
        self.assert_symlink_sink_preserved(lambda: self.docs_builder.build(), self.docs / name, self.root / 'protected/original.wiki')

    def test_demo_symbolic_output_never_overwrites_original(self):
        output = self.root / 'demo-symlink'
        self.assert_symlink_sink_preserved(lambda: self.demo_builder.build_demo(output), output / 'Demonstracao/demonstracao.css', self.root / 'protected/original.css')

    def test_commit_preflights_every_sink_before_replacing_any_payload(self):
        output = self.root / 'commit-preflight'
        output.mkdir()
        output.joinpath('first.txt').write_bytes(b'Prior first payload.\n')
        protected = self.root / 'protected-second.txt'
        protected.write_bytes(b'Protected second payload.\n')
        output.joinpath('second.txt').symlink_to(protected)
        with self.assertRaises(ValueError):
            self.shared.commit_payloads(output, {'first.txt': b'New first.\n', 'second.txt': b'New second.\n'}, [])
        self.assertEqual(output.joinpath('first.txt').read_bytes(), b'Prior first payload.\n')
        self.assertEqual(protected.read_bytes(), b'Protected second payload.\n')

    def test_atomic_write_rejects_linked_parent_and_leaves_original(self):
        output = self.root / 'atomic-parent'
        output.mkdir()
        protected = self.root / 'protected-directory'
        protected.mkdir()
        protected.joinpath('payload.txt').write_bytes(b'Original.\n')
        output.joinpath('linked').symlink_to(protected, target_is_directory=True)
        with self.assertRaises(ValueError):
            self.shared.atomic_write(output, 'linked/payload.txt', b'Incorrect replacement.\n')
        self.assertEqual(protected.joinpath('payload.txt').read_bytes(), b'Original.\n')

    def test_atomic_write_replaces_owned_regular_payload_exactly(self):
        output = self.root / 'atomic-owned'
        self.shared.atomic_write(output, 'nested/payload.txt', b'Original.\n')
        self.shared.atomic_write(output, 'nested/payload.txt', b'Exact revised bytes.\n')
        self.assertEqual(output.joinpath('nested/payload.txt').read_bytes(), b'Exact revised bytes.\n')
        self.assertEqual([p for p in output.rglob('*') if p.name.startswith('.revisawiki-')], [])

    def test_atomic_write_collision_never_removes_another_temporary_file(self):
        from types import SimpleNamespace
        output = self.root / 'atomic-collision'
        output.mkdir()
        other = output / '.revisawiki-collision'
        other.write_bytes(b'Another operation owns this temporary file.\n')
        with patch.object(self.shared.uuid, 'uuid4', return_value=SimpleNamespace(hex='collision')):
            with self.assertRaises(FileExistsError):
                self.shared.atomic_write(output, 'payload.txt', b'New payload.\n')
        self.assertEqual(other.read_bytes(), b'Another operation owns this temporary file.\n')
        self.assertFalse(output.joinpath('payload.txt').exists())

    def test_package_rejects_runtime_drift_after_initial_check(self):
        real = self.package_builder.checked_manifest
        changed = False
        def drifting(*args, **kwargs):
            nonlocal changed
            result = real(*args, **kwargs)
            if not changed:
                changed = True
                self.dist.joinpath(self.shared.INSTALL_FILES[0]).write_bytes(b'Drift after verification.\n')
            return result
        with patch.object(self.package_builder, 'checked_manifest', side_effect=drifting):
            with self.assertRaises(ValueError):
                self.package(self.root / 'drift-package')
        self.assertTrue(changed)

    def test_package_rejects_qa_drift_after_initial_check(self):
        real = self.package_builder.checked_qa
        changed = False
        def drifting(*args, **kwargs):
            nonlocal changed
            result = real(*args, **kwargs)
            if not changed:
                changed = True
                self.qa['docValidationParagraphs'] = ['Different unchecked validation.']
                self.save_qa()
            return result
        with patch.object(self.package_builder, 'checked_qa', side_effect=drifting):
            with self.assertRaises(ValueError):
                self.package(self.root / 'qa-drift-package')
        self.assertTrue(changed)

    def test_package_rejects_build_source_drift_after_initial_check(self):
        real = self.package_builder.checked_manifest
        def drifting(*args, **kwargs):
            result = real(*args, **kwargs)
            self.source_path.write_bytes(b'Build source changed after verification.\n')
            return result
        output = self.root / 'source-drift-package'
        with patch.object(self.package_builder, 'checked_manifest', side_effect=drifting):
            with self.assertRaises(ValueError):
                self.package(output)
        self.assertFalse(output.exists())

    def test_package_missing_demo_does_not_replace_prior_delivery(self):
        output = self.root / 'prior-package'
        output.mkdir()
        original = output / self.shared.INSTALL_FILES[0]
        original.write_bytes(b'Prior completed delivery.\n')
        self.dist.joinpath('Demonstracao_RevisaWiki_v2_21_0.html').unlink()
        with self.assertRaises(ValueError):
            self.package(output)
        self.assertEqual(original.read_bytes(), b'Prior completed delivery.\n')

    def test_late_unfinished_doc_does_not_replace_prior_delivery(self):
        output = self.root / 'prior-unfinished'
        output.mkdir()
        original = output / self.shared.INSTALL_FILES[0]
        original.write_bytes(b'Prior completed delivery.\n')
        self.docs.joinpath(self.shared.REQUIRED_DOCS[-1]).write_text('TODO incomplete fixture.\n')
        with self.assertRaises(ValueError):
            self.package(output)
        self.assertEqual(original.read_bytes(), b'Prior completed delivery.\n')

    def test_package_rejects_symbolic_metadata_input_before_output(self):
        outside = self.root / 'outside-coverage.json'
        outside.write_bytes(self.coverage_path.read_bytes())
        self.coverage_path.unlink()
        self.coverage_path.symlink_to(outside)
        output = self.root / 'metadata-rejected'
        with self.assertRaises(ValueError):
            self.package(output)
        self.assertFalse(output.exists())

    def test_invalid_docs_validation_keeps_prior_documents(self):
        prior = {p.name: p.read_bytes() for p in self.docs.iterdir()}
        self.qa['docValidationParagraphs'] = []
        self.save_qa()
        with self.assertRaises(ValueError):
            self.docs_builder.build()
        self.assertEqual(prior, {p.name: p.read_bytes() for p in self.docs.iterdir()})

    def test_demo_fixture_drift_is_rejected_before_output(self):
        self.examples[0]['source'] = 'Different source.'
        self.write_json(self.example_path, self.examples)
        output = self.root / 'bad-demo'
        with self.assertRaises(ValueError):
            self.demo_builder.build_demo(output)
        self.assertFalse(output.exists())

    def test_demo_rejects_helper_drift_against_final_portable_hash(self):
        self.root.joinpath('src/demo_v221/demonstracao.js').write_text('window.syntheticDemo="changed after QA";\n')
        with self.assertRaises(ValueError):
            self.demo_builder.build_demo(self.root / 'helper-drift')

    def test_demo_rejects_symbolic_helper_before_output(self):
        source = self.root / 'src/demo_v221/demonstracao.js'
        outside = self.root / 'outside-helper.js'
        outside.write_bytes(source.read_bytes())
        source.unlink()
        source.symlink_to(outside)
        output = self.root / 'helper-symlink'
        with self.assertRaises(ValueError):
            self.demo_builder.build_demo(output)
        self.assertFalse(output.exists())

    def test_docs_preview_does_not_change_later_final_destination(self):
        preview = self.root / 'docs-preview'
        with redirect_stdout(StringIO()):
            self.docs_builder.build(preview, self.qa_path)
        self.assertEqual(self.docs_builder.DOCS, self.docs)
        self.docs.joinpath('Documentacao_RevisaWiki_v2_21_0.wiki').write_text('Prior final manual.\n')
        with redirect_stdout(StringIO()):
            self.docs_builder.build()
        self.assertIn("O '''RevisaWiki'''", self.docs.joinpath('Documentacao_RevisaWiki_v2_21_0.wiki').read_text())

    def test_valid_documentation_keeps_history_and_original_calls(self):
        original = {n: self.dist.joinpath(n).read_bytes() for n in self.shared.FIXED_CALLS}
        with redirect_stdout(StringIO()):
            self.docs_builder.build()
        manual = self.docs.joinpath('Documentacao_RevisaWiki_v2_21_0.wiki').read_text()
        self.assertLess(manual.index('=== 2.21.0 ==='), manual.index('=== 2.20.0 ==='))
        self.assertIn('Historical entry remains unchanged.', manual)
        self.assertIn('https://github.com/danrego/RevisaWiki', manual)
        for name, raw in original.items():
            self.assertEqual(self.dist.joinpath(name).read_bytes(), raw)
        self.assertIn(original[self.shared.FIXED_CALLS[0]].decode().rstrip(), manual)

    def test_portable_demo_contains_exact_engine_and_fixtures(self):
        output = self.root / 'valid-demo'
        result = self.demo_builder.build_demo(output)
        raw = output.joinpath(result['portableFile']).read_bytes()
        self.assertEqual(digest(raw), self.qa['demonstrationPortableSha256'])
        text = raw.decode()
        def embedded(name):
            return json.loads(re.search(r'<script type="application/json" id="' + name + r'">(.*?)</script>', text, re.S)[1])
        engine = self.dist.joinpath('RevisaWiki_v2_21_0_completo.js').read_bytes()
        self.assertEqual(base64.b64decode(embedded('demo-engine')), engine)
        self.assertEqual(embedded('demo-book')['examples'], self.examples)
        self.assertEqual(output.joinpath('RevisaWiki_v2_21_0_completo.js').read_bytes(), engine)
        self.assertIn("connect-src 'none'", text)
        self.assertNotIn('importScripts(', embedded('demo-worker'))
        self.assertFalse(result['engineModified'])

    def test_package_index_payload_and_zip_are_exact_and_reproducible(self):
        originals = {n: self.dist.joinpath(n).read_bytes() for n in self.shared.RUNTIME_FILES}
        first, second = self.root / 'package-one', self.root / 'package-two'
        delivery = self.package(first)
        self.package(second)
        self.assertEqual(len(delivery['copyPayloads']), 7)
        self.assertTrue(delivery['releaseGatesPassed'])
        index = first.joinpath('INDICE.md').read_text()
        for row in delivery['copyPayloads']:
            raw = first.joinpath(row['file']).read_bytes()
            self.assertEqual(row['bytes'], len(raw))
            self.assertEqual(row['sha256'], digest(raw))
            self.assertIn('[' + row['file'] + '](' + row['file'] + ')', index)
            self.assertIn('`' + row['destination'] + '`', index)
            self.assertIn(row['editSummary'], index)
        archive_name = 'RevisaWiki_2.21.0.zip'
        self.assertEqual(first.joinpath(archive_name).read_bytes(), second.joinpath(archive_name).read_bytes())
        with zipfile.ZipFile(first / archive_name) as archive:
            self.assertEqual(archive.namelist(), sorted([*delivery['files'], 'MANIFESTO.json']))
            self.assertIsNone(archive.testzip())
            for name in archive.namelist():
                self.assertEqual(archive.read(name), first.joinpath(name).read_bytes())
                self.assertNotIn('..', Path(name).parts)
        for name, pin in delivery['files'].items():
            self.assertEqual(self.shared.pin(first / name), pin)
        for name, raw in originals.items():
            self.assertEqual(self.dist.joinpath(name).read_bytes(), raw)


if __name__ == '__main__':
    unittest.main(verbosity=2)
