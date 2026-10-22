"""Exercise delivery guards with fictional files, never the release directory."""
from pathlib import Path
from contextlib import ExitStack
from unittest.mock import patch
import hashlib
import importlib
import json
import shutil
import sys
import tempfile
import unittest
import zipfile

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / 'scripts'))
delivery = importlib.import_module('v220_delivery')
index = importlib.import_module('build_index_v2200')
demo = importlib.import_module('build_demo_v2200')
package = importlib.import_module('build_package_v2200')
docs = importlib.import_module('build_delivery_docs_v2200')


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


class DeliveryTools(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='revisawiki-delivery-test-')
        self.root = Path(self.temp.name)
        self.dist = self.root / 'dist/2.20.0'
        self.manual = self.root / 'docs/2.20.0'
        self.dist.mkdir(parents=True)
        self.manual.mkdir(parents=True)
        for name in (
            'RevisaWiki_v2_20_0.js', 'RevisaWiki_v2_20_0_dados.js',
            'RevisaWiki_v2_20_0_completo.js',
            'Carregador_common_js_RevisaWiki_v2_20_0.js',
            'Carregador_comunitario_RevisaWiki_v2_20_0.js',
            *delivery.FIXED_CALLS,
        ):
            (self.dist / name).write_text('// Fictitious package fixture.\n', encoding='utf-8')
        (self.dist / 'RevisaWiki_v2_20_0_completo.js').write_text('// Fictitious offline engine.\n' + ' ' * delivery.WIKI_PAGE_LIMIT, encoding='utf-8')
        self.manifest = dict(version='2.20.0', files={path.name: delivery.pin(path) for path in self.dist.iterdir()})
        self.manifest_path = self.root / 'tests/expected_release_v2200.json'
        write_json(self.manifest_path, self.manifest)
        write_json(self.root / 'tests/expected_release_v2191.json', dict(files={name: self.manifest['files'][name] for name in delivery.FIXED_CALLS}))
        self.qa = dict(version='2.20.0', releaseGatesPassed=True, frozenFiles=self.manifest['files'],
                       workerDeadlineMilliseconds=60_000, wikipediaWrites=0,
                       unresolvedIntegrityFailures=0,
                       docValidationSummary='Resumo fictício para conferir somente o empacotador.',
                       docValidationParagraphs=['Este resultado não representa a qualificação de um programa real.'])
        self.qa_path = self.root / 'tests/evidence/2.20.0/QA_SUMMARY.json'
        write_json(self.qa_path, self.qa)
        for name in delivery.REQUIRED_DOCS:
            (self.manual / name).write_text('Texto fictício para os testes de entrega.\n', encoding='utf-8')
        (self.root / 'LICENSE').write_text('Licença fictícia de teste.\n', encoding='utf-8')
        shutil.copytree(REPO / 'src/demo', self.root / 'src/demo')
        self.examples = self.root / 'tests/v220/demo_examples.json'
        write_json(self.examples, [dict(id='fictional', family='Controles', title='Texto intacto',
                                       explanation='Exemplo fictício de empacotamento.', source='Texto.', expected='Texto.',
                                       options=dict(autoPreview=False, registryDoiCheck=False))])
        self.qa['demonstrationFixtureSha256'] = delivery.pin(self.examples)['sha256']
        self.qa['demonstrationExamples'] = 1
        self.save_qa()
        self.stack = ExitStack()
        for module in (delivery, index, demo, package, docs):
            for key, value in dict(ROOT=self.root, DIST=self.dist, DOCS=self.manual).items():
                if hasattr(module, key):
                    self.stack.enter_context(patch.object(module, key, value))
        self.addCleanup(self.stack.close)
        self.addCleanup(self.temp.cleanup)

    def save_qa(self):
        write_json(self.qa_path, self.qa)

    def rebind_manifest(self):
        self.manifest['files'] = {name: delivery.pin(self.dist / name) for name in self.manifest['files']}
        write_json(self.manifest_path, self.manifest)
        self.qa['frozenFiles'] = self.manifest['files']
        self.save_qa()

    def test_manifest_matches_all_files(self):
        self.assertEqual(delivery.checked_manifest(), self.manifest)

    def test_manifest_rejects_runtime_mutation(self):
        (self.dist / 'RevisaWiki_v2_20_0.js').write_text('// Changed.\n')
        with self.assertRaisesRegex(ValueError, 'differ'):
            delivery.checked_manifest()

    def test_manifest_rejects_installer_at_limit(self):
        (self.dist / 'RevisaWiki_v2_20_0.js').write_bytes(b' ' * delivery.WIKI_PAGE_LIMIT)
        self.rebind_manifest()
        with self.assertRaisesRegex(ValueError, 'page-size'):
            delivery.checked_manifest()

    def test_manifest_rejects_changed_fixed_call(self):
        (self.dist / delivery.FIXED_CALLS[0]).write_text('// Changed fixed call.\n')
        self.rebind_manifest()
        with self.assertRaisesRegex(ValueError, 'fixed common.js'):
            delivery.checked_manifest()

    def test_manifest_rejects_wrong_version(self):
        self.manifest['version'] = '2.19.1'
        write_json(self.manifest_path, self.manifest)
        with self.assertRaisesRegex(ValueError, 'different release'):
            delivery.checked_manifest()

    def test_manifest_requires_all_seven_runtime_files(self):
        self.manifest['files'].pop('Carregador_comunitario_RevisaWiki_v2_20_0.js')
        write_json(self.manifest_path, self.manifest)
        with self.assertRaisesRegex(ValueError, 'exactly the seven'):
            delivery.checked_manifest()

    def test_manifest_rejects_additional_runtime_file(self):
        extra = self.dist / 'unreviewed.js'
        extra.write_text('// Additional unqualified file.\n')
        self.manifest['files'][extra.name] = delivery.pin(extra)
        write_json(self.manifest_path, self.manifest)
        with self.assertRaisesRegex(ValueError, 'exactly the seven'):
            delivery.checked_manifest()

    def test_manifest_rejects_symlink(self):
        original = self.dist / 'RevisaWiki_v2_20_0.js'
        other = self.root / 'other.js'
        original.rename(other)
        original.symlink_to(other)
        with self.assertRaisesRegex(ValueError, 'unsupported'):
            delivery.checked_manifest()

    def test_manifest_rejects_path_traversal(self):
        self.manifest['files']['../unexpected.js'] = {'bytes': 0, 'sha256': '0' * 64}
        write_json(self.manifest_path, self.manifest)
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            delivery.checked_manifest()

    def test_final_qa_requires_passed_gates(self):
        for field, value in [('version', '2.19.1'), ('releaseGatesPassed', False),
                             ('frozenFiles', {}), ('wikipediaWrites', 1),
                             ('workerDeadlineMilliseconds', 120_000),
                             ('unresolvedIntegrityFailures', 1)]:
            with self.subTest(field=field):
                changed = {**self.qa, field: value}
                write_json(self.qa_path, changed)
                with self.assertRaises(ValueError):
                    delivery.checked_qa(self.manifest)

    def test_final_qa_requires_integrity_disposition(self):
        self.qa.pop('unresolvedIntegrityFailures')
        self.save_qa()
        with self.assertRaisesRegex(ValueError, 'zero unresolved integrity'):
            delivery.checked_qa(self.manifest)

    def test_package_rejects_unresolved_integrity_even_with_release_flag(self):
        self.qa['unresolvedIntegrityFailures'] = 1
        self.save_qa()
        output = self.root / 'refused-package'
        with self.assertRaisesRegex(ValueError, 'zero unresolved integrity'):
            package.build_package(output)
        self.assertFalse(output.exists())

    def test_final_qa_cannot_be_missing(self):
        self.qa_path.unlink()
        with self.assertRaises(ValueError):
            delivery.checked_qa(self.manifest)

    def test_index_payloads_are_exact_files(self):
        output = self.root / 'preview'
        result = index.build_index(output, preview=True)
        self.assertEqual(result['cards'], 7)
        page = (output / 'INICIO.html').read_text()
        payload = page.split('<script type="application/json" id="payloads">', 1)[1].split('</script>', 1)[0]
        payloads = json.loads(payload)
        self.assertEqual(set(payloads), {'dados', 'programa', 'central', 'documentacao', 'chamada', 'central-propria', 'chamada-propria'})
        for item in payloads.values():
            self.assertEqual(item['text'].encode(), (output / item['filename']).read_bytes())
            self.assertEqual(hashlib.sha256(item['text'].encode()).hexdigest(), item['sha256'])
        self.assertNotIn('RevisaWiki_v2_20_0_completo.js', [item['filename'] for item in payloads.values()])
        self.assertIn('Não o cole numa página .js', page)
        self.assertIn('connect-src \'none\'', page)
        self.assertIn('Prévia local', page)
        metadata = json.loads((output / 'MANIFESTO.json').read_text())
        self.assertEqual(metadata['status'], 'local-preview')
        self.assertTrue(metadata['completeBundle']['offlineOnly'])

    def test_index_preserves_literal_carriage_returns_in_copy_payloads(self):
        filename = 'Documentacao_RevisaWiki_v2_20_0.wiki'
        raw = b'First line.\r\n\r\nLast line.\r\n'
        (self.manual / filename).write_bytes(raw)
        output = self.root / 'preview'
        index.build_index(output, preview=True)
        page = (output / 'INICIO.html').read_text()
        payload = page.split('<script type="application/json" id="payloads">', 1)[1].split('</script>', 1)[0]
        self.assertEqual(json.loads(payload)['documentacao']['text'].encode(), raw)
        self.assertEqual((output / filename).read_bytes(), raw)

    def test_preview_refuses_release_directory(self):
        with self.assertRaises(ValueError):
            index.build_index(self.dist, preview=True)
        with self.assertRaises(ValueError):
            demo.build_demo(self.dist, preview=True)

    def test_index_escapes_embedded_html(self):
        filename = 'Documentacao_RevisaWiki_v2_20_0.wiki'
        raw = '</script><script>example()</script> & <b>Texto</b>\n'
        (self.manual / filename).write_text(raw)
        output = self.root / 'preview'
        index.build_index(output, preview=True)
        page = (output / 'INICIO.html').read_text()
        payload = page.split('<script type="application/json" id="payloads">', 1)[1].split('</script>', 1)[0]
        self.assertNotIn('</script>', payload)
        self.assertEqual(json.loads(payload)['documentacao']['text'], raw)

    def test_demo_embeds_exact_engine_and_blocks_network(self):
        output = self.root / 'demo-preview'
        result = demo.build_demo(output, preview=True)
        self.assertEqual(result['examples'], 1)
        self.assertFalse(result['engineModified'])
        page = (output / 'Demonstracao_RevisaWiki_v2_20_0.html').read_text()
        self.assertIn("connect-src 'none'", page)
        self.assertIn('não fazem as consultas externas', page)
        self.assertNotIn("importScripts('../RevisaWiki_v2_20_0_completo.js');", page)
        self.assertEqual(result['engineSha256'], self.manifest['files']['RevisaWiki_v2_20_0_completo.js']['sha256'])

    def test_demo_rejects_enabled_network_options(self):
        values = json.loads(self.examples.read_text())
        for field in ('autoPreview', 'registryDoiCheck'):
            with self.subTest(field=field):
                values[0]['options'][field] = True
                write_json(self.examples, values)
                with self.assertRaisesRegex(ValueError, 'disable online'):
                    demo.build_demo(self.root / 'preview', preview=True)
                values[0]['options'][field] = False

    def test_demo_rejects_duplicate_examples(self):
        values = json.loads(self.examples.read_text())
        write_json(self.examples, values * 2)
        with self.assertRaisesRegex(ValueError, 'unique'):
            demo.build_demo(self.root / 'preview', preview=True)

    def test_demo_rejects_incomplete_viewer_metadata(self):
        original = json.loads(self.examples.read_text())
        for field in ('id', 'family', 'title', 'explanation'):
            for value in (None, '', '  ', 1):
                with self.subTest(field=field, value=value):
                    values = json.loads(json.dumps(original))
                    values[0][field] = value
                    write_json(self.examples, values)
                    with self.assertRaisesRegex(ValueError, 'identifier, family, title and explanation'):
                        demo.build_demo(self.root / 'preview', preview=True)
                    self.assertFalse((self.root / 'preview').exists())

    def test_demo_rejects_nonobject_fixture_before_creating_output(self):
        write_json(self.examples, ['Incomplete fixture.'])
        with self.assertRaisesRegex(ValueError, 'must be an object'):
            demo.build_demo(self.root / 'preview', preview=True)
        self.assertFalse((self.root / 'preview').exists())

    def test_demo_rejects_unqualified_examples_in_final_build(self):
        values = json.loads(self.examples.read_text())
        values[0]['source'] = 'Outro texto.'
        write_json(self.examples, values)
        with self.assertRaisesRegex(ValueError, 'not bound'):
            demo.build_demo(self.root / 'preview')

    def test_docs_require_reviewed_qa_prose(self):
        self.qa.pop('docValidationSummary')
        self.save_qa()
        with self.assertRaisesRegex(ValueError, 'Portuguese validation summary'):
            docs.build_docs()

    def test_docs_use_only_current_qa_counts(self):
        result = docs.build_docs()
        self.assertEqual(len(result['files']), 6)
        for name in result['files']:
            text = (self.manual / name).read_text()
            self.assertNotIn('952.120', text)
            self.assertNotIn('30.468', text)
            self.assertNotIn('PENDING', text)
        report = (self.manual / 'Relatorio_testes_RevisaWiki_v2_20_0.txt').read_text()
        self.assertIn(self.qa['docValidationSummary'], report)
        self.assertIn(delivery.pin(self.qa_path)['sha256'], report)

    def test_package_checks_all_hashes_and_zip_members(self):
        output = self.root / 'package'
        result = package.build_package(output)
        self.assertEqual(result['status'], 'packaged')
        self.assertEqual(result['privacyWithArchive']['findingCount'], 0)
        archive = output / 'RevisaWiki_2.20.0.zip'
        with zipfile.ZipFile(archive) as zipped:
            names = zipped.namelist()
            self.assertNotIn(archive.name, names)
            self.assertIn('INICIO.html', names)
            self.assertIn('ARQUIVOS.json', names)
            self.assertIn('Demonstracao_RevisaWiki_v2_20_0.html', names)
            self.assertEqual(len(names), len(set(names)))
            record = json.loads(zipped.read('ARQUIVOS.json'))
            for name, proof in record['files'].items():
                self.assertEqual(zipped.read(name), (output / name).read_bytes())
                self.assertEqual(len(zipped.read(name)), proof['bytes'])
                self.assertEqual(hashlib.sha256(zipped.read(name)).hexdigest(), proof['sha256'])
            for item in zipped.infolist():
                self.assertEqual(item.date_time, (2026, 10, 21, 0, 0, 0))

    def test_package_rejects_unexpected_destination_file(self):
        output = self.root / 'package'
        output.mkdir()
        (output / 'unexpected.txt').write_text('Texto.')
        with self.assertRaisesRegex(ValueError, 'unexpected files'):
            package.build_package(output)
        self.assertFalse((output / 'INICIO.html').exists())

    def test_package_rejects_private_payload_before_delivery(self):
        (self.manual / 'LEIA_PRIMEIRO.txt').write_text('Contato fictício: test' + '@' + 'example.invalid\n')
        output = self.root / 'package'
        with self.assertRaisesRegex(ValueError, 'privacyFindings'):
            package.build_package(output)
        self.assertFalse(output.exists())

    def test_package_rejects_unfinished_document(self):
        (self.manual / 'LEIA_PRIMEIRO.txt').write_text('PENDING\n')
        with self.assertRaisesRegex(ValueError, 'unfinished'):
            package.build_package(self.root / 'package')

    def test_package_is_deterministic(self):
        first = package.build_package(self.root / 'first')
        second = package.build_package(self.root / 'second')
        self.assertEqual(first['sha256'], second['sha256'])


if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(DeliveryTools)
    result = unittest.TextTestRunner(verbosity=1).run(suite)
    print(json.dumps({'suite': 'v220-delivery-tools', 'status': 'passed' if result.wasSuccessful() else 'failed',
                      'tests': result.testsRun, 'failures': len(result.failures), 'errors': len(result.errors),
                      'syntheticPackageFixtures': True, 'networkRequests': 0, 'wikipediaWrites': 0}))
    sys.exit(0 if result.wasSuccessful() else 1)
