"""Public release-reader contract, using the real isolated delivery builders.

Run with ``python3 tests/test_public_manifest_v221.py``. This includes the
unchanged delivery controls plus three compatibility and preservation checks.
No network requests, production files or Wikipedia edits are involved.
"""
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
import json
from pathlib import Path
import unittest
import zipfile


spec = spec_from_file_location('_v221_original_delivery_tests', Path(__file__).parent / 'v221/delivery_tools.py')
base = module_from_spec(spec)
spec.loader.exec_module(base)


class PublicManifest(base.DeliveryTools):
    def read_public_runtime(self, output):
        manifest = json.loads((output / 'ARQUIVOS.json').read_text())
        self.assertEqual(manifest['version'], '2.21.0')
        self.assertEqual(manifest['distributionRevision'], '2.21.0')
        self.assertEqual(manifest['wikipediaWrites'], 0)
        files = []
        for name in ('RevisaWiki_v2_21_0.js', 'RevisaWiki_v2_21_0_dados.js'):
            raw = (output / name).read_bytes()
            self.assertEqual(manifest['files'][name], {'bytes': len(raw), 'sha256': sha256(raw).hexdigest()})
            files.append(raw)
        return manifest, files

    def test_public_reader_receives_exact_qa_bound_runtime(self):
        output = self.root / 'public-reader-package'
        delivery = self.package(output)
        manifest, files = self.read_public_runtime(output)
        self.assertEqual(manifest['qaSummarySha256'], sha256(self.qa_path.read_bytes()).hexdigest())
        for name in self.shared.RUNTIME_FILES:
            self.assertEqual(manifest['files'][name], self.manifest['files'][name])
        raw = (output / 'ARQUIVOS.json').read_bytes()
        self.assertEqual(delivery['files']['ARQUIVOS.json'], {'bytes': len(raw), 'sha256': sha256(raw).hexdigest()})
        with zipfile.ZipFile(output / 'RevisaWiki_2.21.0.zip') as archive:
            self.assertEqual(archive.read('ARQUIVOS.json'), raw)
        self.assertEqual(len(files), 2)

    def test_public_reader_rejects_a_changed_runtime_payload(self):
        output = self.root / 'changed-public-runtime'
        self.package(output)
        original = output / 'RevisaWiki_v2_21_0_dados.js'
        original.write_bytes(original.read_bytes() + b'changed')
        with self.assertRaises(AssertionError):
            self.read_public_runtime(output)

    def test_public_manifest_symlink_rejects_package_before_any_write(self):
        output = self.root / 'linked-public-manifest'
        output.mkdir()
        sentinel = output / 'RevisaWiki_v2_21_0.js'
        sentinel.write_bytes(b'Unrelated existing draft.\n')
        protected = self.root / 'protected-public-manifest.json'
        protected.write_bytes(b'Protected manifest bytes.\n')
        (output / 'ARQUIVOS.json').symlink_to(protected)
        before = {p.name: p.read_bytes() for p in output.iterdir()}
        with self.assertRaises(ValueError):
            self.package(output)
        self.assertEqual(before, {p.name: p.read_bytes() for p in output.iterdir()})
        self.assertEqual(protected.read_bytes(), b'Protected manifest bytes.\n')


if __name__ == '__main__':
    unittest.main(verbosity=2)
