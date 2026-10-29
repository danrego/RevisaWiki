"""Exact 2.21.2 code-property privacy approval and mutation controls.

The optional portable-page checks also bind its decoded engine to the reviewed
full bundle. That binding is separate from scanning visible HTML text.
"""
from pathlib import Path
from unittest.mock import patch
import argparse
import base64
import collections
import hashlib
import importlib.util
import io
import json
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('privacy_v2212_exact', ROOT / 'scripts/publication_privacy_gate.py')
GATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)
SHA = lambda raw: hashlib.sha256(raw).hexdigest()
CORE_SHA = '1e3edc53f8da4fe4b50225d7d911b4d6d5d6727bc927cf053fb9184b61edf128'
CORE_BYTES = 2095518
BASE_CORE_SHA = '7e46265ea44c5bfdcb55e2cd50b07d2b7762147ab22524f556b57977945f2dbf'
FULL_SHA = '30e64e602ce7380be64fc1d777f0623799e12b3b51fea93b9f0887684ee413ca'
FIXTURE_SHA = 'dabe4ed87ce57c40a0764edad2d5141e3683faa2a087e55be3acfc6c6cc25b30'
TOKENS = {'5d778bfd027ea19e7c596776176c61cde30417e6c5f545dc66fb327827c5470e': 1,
          'ffbfe426853ca74b959ba5f96b1be6132490f940a72da0905aa2168df997775b': 1}
PORTABLE = ROOT / 'dist/2.21.2/Demonstracao_RevisaWiki_v2_21_2.html'


def findings(raw, denied=()):
    scanner = GATE.Scanner(list(denied))
    scanner.scan('controlled-source.txt', raw)
    return {item['rule'] for item in scanner.findings}


def envelope(source, **extra):
    return json.dumps({'engine': source, **extra}, ensure_ascii=True).encode('utf-8')


def portable_parts(raw):
    text = raw.decode('utf-8')
    def one(identifier):
        values = re.findall(r'<script type="application/json" id="' + identifier + r'">(.*?)</script>', text, re.S)
        assert len(values) == 1
        return json.loads(values[0])
    book, encoded = one('demo-book'), one('demo-engine')
    engine = base64.b64decode(encoded, validate=True)
    assert book['version'] == '2.21.2'
    assert book['offline'] is True and book['externalConfirmationAvailable'] is False
    assert SHA(engine) == book['engineSha256'] == FULL_SHA
    assert book['fixtureSha256'] == FIXTURE_SHA and len(book['examples']) == 109
    fixture = (ROOT / 'tests/v2212/demo_examples.json').read_bytes()
    assert SHA(fixture) == FIXTURE_SHA and book['examples'] == json.loads(fixture)
    assert "connect-src 'none'" in text and "form-action 'none'" in text
    return book, encoded


class RuntimeScope(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = (ROOT / 'dist/2.21.2/RevisaWiki_v2_21_2.js').read_bytes()
        assert len(cls.raw) == CORE_BYTES and SHA(cls.raw) == CORE_SHA
        cls.text = cls.raw.decode('utf-8')
        cls.tokens = [m.group() for m in GATE.WIKI_USER_DESTINATION.finditer(cls.text) if SHA(m.group().encode()) in TOKENS]
        assert collections.Counter(SHA(value.encode()) for value in cls.tokens) == TOKENS

    def scope(self, raw, record=None):
        return patch.dict(GATE.APPROVED_RUNTIME_OBJECT_KEYS, {SHA(raw): record or {'bytes': len(raw), 'tokens': TOKENS.copy()}})

    def test_exact_new_and_old_records_have_the_same_two_tokens(self):
        self.assertEqual(GATE.APPROVED_RUNTIME_OBJECT_KEYS[CORE_SHA], {'bytes': CORE_BYTES, 'tokens': TOKENS})
        self.assertEqual(GATE.APPROVED_RUNTIME_OBJECT_KEYS[BASE_CORE_SHA], {'bytes': 2090691, 'tokens': TOKENS})

    def test_exact_core_is_clean(self):
        self.assertEqual(findings(self.raw), set())

    def test_approval_is_required_for_the_complete_new_hash(self):
        retained = {k: v for k, v in GATE.APPROVED_RUNTIME_OBJECT_KEYS.items() if k != CORE_SHA}
        with patch.dict(GATE.APPROVED_RUNTIME_OBJECT_KEYS, retained, clear=True):
            self.assertIn('unreviewed-wiki-user-destination', findings(self.raw))

    def test_changed_whole_file_hash_is_not_approved(self):
        self.assertIn('unreviewed-wiki-user-destination', findings(self.raw + b'\n'))

    def test_wrong_byte_count_is_not_approved(self):
        with self.scope(self.raw, {'bytes': CORE_BYTES + 1, 'tokens': TOKENS.copy()}):
            self.assertIn('unreviewed-wiki-user-destination', findings(self.raw))

    def test_wrong_token_count_is_not_approved(self):
        wrong = TOKENS.copy()
        wrong[next(iter(wrong))] = 2
        with self.scope(self.raw, {'bytes': CORE_BYTES, 'tokens': wrong}):
            self.assertIn('unreviewed-wiki-user-destination', findings(self.raw))

    def test_changed_code_property_cannot_borrow_the_token_set(self):
        token = self.tokens[0].encode()
        altered = token[:-1] + (b'X' if token[-1:] != b'X' else b'Y')
        raw = self.raw.replace(token, altered, 1)
        with self.scope(raw):
            self.assertIn('unreviewed-wiki-user-destination', findings(raw))

    def test_repeated_code_property_fails_the_exact_count(self):
        raw = self.raw + b'\n' + self.tokens[0].encode()
        with self.scope(raw):
            self.assertIn('unreviewed-wiki-user-destination', findings(raw))

    def test_another_namespace_is_not_masked(self):
        raw = self.raw + b'\n' + ('User' + ':' + 'Unreviewed-Account').encode()
        with self.scope(raw):
            self.assertIn('unreviewed-wiki-user-destination', findings(raw))

    def test_email_reader_still_sees_the_original_source(self):
        raw = self.raw + b'\n' + ('check.address' + '@' + 'other.invalid').encode()
        with self.scope(raw):
            self.assertIn('unreviewed-email', findings(raw))

    def test_secret_reader_still_sees_the_original_source(self):
        raw = self.raw + b'\n' + ('gh' + 'p_' + 'x' * 40).encode()
        with self.scope(raw):
            self.assertIn('secret-token', findings(raw))

    def test_path_reader_still_sees_the_original_source(self):
        raw = self.raw + b'\n' + ('/' + 'Users/' + 'fictional' + '/private/').encode()
        with self.scope(raw):
            self.assertIn('private-home-path', findings(raw))

    def test_raw_denylist_overrides_the_code_property_approval(self):
        self.assertIn('private-local-denylist', findings(self.raw, [self.tokens[0]]))

    def test_json_embedded_exact_core_is_clean(self):
        self.assertEqual(findings(envelope(self.text)), set())

    def test_json_embedded_changed_core_is_not_approved(self):
        self.assertIn('unreviewed-wiki-user-destination', findings(envelope(self.text + '\n')))

    def test_json_neighbor_namespace_stays_visible(self):
        raw = envelope(self.text, neighbor='User' + ':' + 'Unreviewed-Account')
        self.assertIn('unreviewed-wiki-user-destination', findings(raw))

    def test_json_neighbor_email_stays_visible(self):
        raw = envelope(self.text, neighbor='check.address' + '@' + 'other.invalid')
        self.assertIn('unreviewed-email', findings(raw))

    def test_supplied_metadata_hash_does_not_approve_changed_json_source(self):
        raw = envelope(self.text + '\n', sha256=CORE_SHA)
        self.assertIn('unreviewed-wiki-user-destination', findings(raw))

    def test_json_neighbor_secret_and_path_are_not_masked(self):
        for value, rule in [('gh' + 'p_' + 'x' * 40, 'secret-token'), ('/' + 'Users/' + 'fictional' + '/private/', 'private-home-path')]:
            with self.subTest(rule=rule):
                self.assertIn(rule, findings(envelope(self.text, neighbor=value)))


class PortableScope(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not PORTABLE.is_file():
            raise unittest.SkipTest('No portable-page fixture was supplied')
        cls.raw = PORTABLE.read_bytes()
        cls.book, cls.encoded = portable_parts(cls.raw)

    def test_actual_portable_text_and_exact_embedded_engine_are_clean(self):
        self.assertEqual(findings(self.raw), set())

    def test_outer_html_private_data_is_not_masked(self):
        for value, rule in [('User' + ':' + 'Unreviewed-Account', 'unreviewed-wiki-user-destination'),
                            ('check.address' + '@' + 'other.invalid', 'unreviewed-email'),
                            ('gh' + 'p_' + 'x' * 40, 'secret-token'),
                            ('/' + 'Users/' + 'fictional' + '/private/', 'private-home-path')]:
            with self.subTest(rule=rule):
                self.assertIn(rule, findings(self.raw + b'\n' + value.encode()))

    def test_changed_encoded_engine_fails_its_separate_binding(self):
        changed = base64.b64encode(base64.b64decode(self.encoded, validate=True) + b'\n').decode()
        raw = self.raw.replace(self.encoded.encode(), changed.encode(), 1)
        with self.assertRaises(AssertionError):
            portable_parts(raw)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--portable', type=Path)
    args = parser.parse_args()
    if args.portable is not None:
        PORTABLE = args.portable
    suite = unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    stream = io.StringIO()
    result = unittest.TextTestRunner(stream=stream).run(suite)
    print(json.dumps({'kind': 'exact-code-property-and-portable-binding-privacy-controls',
                      'status': 'passed' if result.wasSuccessful() else 'failed',
                      'cases': result.testsRun, 'failed': len(result.failures) + len(result.errors),
                      'skipped': len(result.skipped), 'portableObserved': PORTABLE.is_file(),
                      'coreSha256': CORE_SHA, 'coreBytes': CORE_BYTES,
                      'scannerSha256': SHA((ROOT / 'scripts/publication_privacy_gate.py').read_bytes()),
                      'matchedPrivateValuesIncluded': False, 'localPathsIncluded': False,
                      'productExecutions': 0, 'networkRequests': 0, 'wikipediaWrites': 0}))
    if not result.wasSuccessful():
        sys.stderr.write(stream.getvalue())
    sys.exit(0 if result.wasSuccessful() else 1)
