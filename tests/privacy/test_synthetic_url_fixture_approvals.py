"""Hash-scoped fictional grammar examples never allow an extra identifier."""
from pathlib import Path
import hashlib
import importlib.util
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('publication_privacy', ROOT / 'scripts/publication_privacy_gate.py')
privacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(privacy)


class SyntheticURLApprovals(unittest.TestCase):
    files = ('tests/v219/citation_syntax_subset_cases.cjs',
             'tests/v219/protocol_interoperability_cases.cjs',
             'tests/v219/official_url_parameter_cases.cjs',
             'tests/v219/citation_corrected_url_contract.json')

    def scan(self, raw):
        scanner = privacy.Scanner([])
        scanner.scan('fixture.cjs', raw)
        return scanner.findings

    def test_exact_reviewed_files_only(self):
        for filename in self.files:
            raw = (ROOT / filename).read_bytes()
            with self.subTest(file=filename):
                self.assertIn(hashlib.sha256(raw).hexdigest(), privacy.APPROVED_SYNTHETIC_URL_FIXTURES)
                self.assertEqual(self.scan(raw), [])
                self.assertTrue(self.scan(raw + b'\n'))

    def test_added_identifier_remains_rejected(self):
        extra = ('alguem' + '@' + 'example.invalid').encode()
        for filename in self.files:
            raw = (ROOT / filename).read_bytes()
            self.assertTrue(any(row['rule'] == 'unreviewed-email'
                                for row in self.scan(raw + b'\n' + extra)))

    def test_no_generic_reserved_domain_exemption(self):
        raw = ('pessoa' + '@' + 'example.org').encode()
        self.assertTrue(any(row['rule'] == 'unreviewed-email' for row in self.scan(raw)))

    def test_hash_and_exact_url_are_both_required(self):
        for filename in self.files:
            raw = (ROOT / filename).read_bytes()
            text, digest = raw.decode(), hashlib.sha256(raw).hexdigest()
            self.assertNotEqual(privacy.reviewed_fixture_view(text, digest), text)
            self.assertEqual(privacy.reviewed_fixture_view(text, '0' * 64), text)
            changed = text.replace('example.', 'different.')
            self.assertEqual(privacy.reviewed_fixture_view(changed, digest), changed)


if __name__ == '__main__':
    unittest.main()
