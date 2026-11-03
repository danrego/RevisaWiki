"""Current object-property allowances retain all other privacy boundaries."""
from pathlib import Path
from unittest.mock import patch
import hashlib
import importlib.util
import json
import unittest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('privacy_runtime_2215', ROOT / 'scripts/publication_privacy_gate.py')
GATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)
SHA = lambda raw: hashlib.sha256(raw).hexdigest()
FILES = {
    'RevisaWiki_v2_21_5.js': ('0e5d0f2377293ebbd863bed4a04762851ee409fae567ec1ffc5adb6e660fa92f', 1793859),
    'RevisaWiki_v2_21_5_completo.js': ('d436af7d43c9db533073d085df7ea05037c30d03c497c316278de20c887a4f57', 3880399),
}
TOKENS = {
    '91d9e76f01c6f79c6e51863de4ae799613ac1027ea4587fc51c69bc990d3249d': 1,
    'ffbfe426853ca74b959ba5f96b1be6132490f940a72da0905aa2168df997775b': 1,
}


def findings(raw, denied=()):
    scanner = GATE.Scanner(list(denied))
    scanner.scan('controlled-runtime.txt', raw)
    return {row['rule'] for row in scanner.findings}


class Runtime2215Privacy(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sources = []
        for name, (digest, size) in FILES.items():
            raw = (ROOT / 'dist/2.21.5' / name).read_bytes()
            if SHA(raw) != digest or len(raw) != size:
                raise AssertionError('The reviewed distribution bytes are required')
            cls.sources.append((name, raw))

    def test_exact_records_and_one_occurrence_per_property_fragment(self):
        for name, raw in self.sources:
            with self.subTest(bundle=name):
                digest, size = FILES[name]
                self.assertEqual(GATE.APPROVED_RUNTIME_OBJECT_KEYS[digest], {'bytes': size, 'tokens': TOKENS})
                counts = {token: sum(SHA(m.group().encode()) == token for m in GATE.WIKI_USER_DESTINATION.finditer(raw.decode())) for token in TOKENS}
                self.assertEqual(counts, TOKENS)

    def test_actual_raw_and_standard_json_runtime_are_accepted(self):
        for name, raw in self.sources:
            with self.subTest(bundle=name):
                self.assertEqual(findings(raw), set())
                self.assertEqual(findings(json.dumps({'engine': raw.decode()}, ensure_ascii=False).encode()), set())

    def test_changed_complete_bytes_and_claimed_digest_are_rejected(self):
        for name, raw in self.sources:
            with self.subTest(bundle=name):
                self.assertIn('unreviewed-wiki-user-destination', findings(raw + b'\n'))
                forged = json.dumps({'engine': raw.decode() + '\n', 'sha256': FILES[name][0]}, ensure_ascii=False).encode()
                self.assertIn('unreviewed-wiki-user-destination', findings(forged))

    def test_extra_account_destination_outside_exact_runtime_remains_visible(self):
        for name, raw in self.sources:
            with self.subTest(bundle=name):
                value = {'engine': raw.decode(), 'other': 'User' + ':' + 'Unreviewed-Account'}
                self.assertIn('unreviewed-wiki-user-destination', findings(json.dumps(value, ensure_ascii=False).encode()))

    def test_email_reader_still_sees_original_json_fields(self):
        for name, raw in self.sources:
            with self.subTest(bundle=name):
                value = {'engine': raw.decode(), 'other': 'review.address' + '@' + 'example.invalid'}
                self.assertIn('unreviewed-email', findings(json.dumps(value, ensure_ascii=False).encode()))

    def test_path_reader_still_sees_original_json_fields(self):
        for name, raw in self.sources:
            with self.subTest(bundle=name):
                value = {'engine': raw.decode(), 'other': '/' + 'Users' + '/fixture/private.txt'}
                self.assertIn('private-home-path', findings(json.dumps(value, ensure_ascii=False).encode()))

    def test_secret_reader_still_sees_original_json_fields(self):
        for name, raw in self.sources:
            with self.subTest(bundle=name):
                value = {'engine': raw.decode(), 'other': 'gh' + 'p_' + 'A' * 30}
                self.assertIn('secret-token', findings(json.dumps(value, ensure_ascii=False).encode()))

    def test_the_two_fragments_have_no_general_exemption(self):
        for value in ['user' + ':e.user,pageid:e.pageid', 'user' + ':mw.config.get(']:
            self.assertIn('unreviewed-wiki-user-destination', findings(value.encode()))

    def test_byte_count_and_token_multiplicity_remain_authoritative(self):
        for name, raw in self.sources:
            digest, size = FILES[name]
            for wrong in [{'bytes': size + 1, 'tokens': TOKENS.copy()}, {'bytes': size, 'tokens': {key: 2 for key in TOKENS}}]:
                with self.subTest(bundle=name, bytes=wrong['bytes']), patch.dict(GATE.APPROVED_RUNTIME_OBJECT_KEYS, {digest: wrong}):
                    self.assertIn('unreviewed-wiki-user-destination', findings(raw))

    def test_private_denylist_still_reads_an_exact_approved_runtime(self):
        for name, raw in self.sources:
            token = next(m.group() for m in GATE.WIKI_USER_DESTINATION.finditer(raw.decode()) if SHA(m.group().encode()) in TOKENS)
            with self.subTest(bundle=name):
                self.assertIn('private-local-denylist', findings(raw, [token]))


if __name__ == '__main__':
    unittest.main()
