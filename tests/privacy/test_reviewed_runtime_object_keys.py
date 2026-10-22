"""Exact runtime receipts never permit a new account or other private data."""
from pathlib import Path
from unittest.mock import patch
import argparse
import gzip
import hashlib
import importlib.util
import io
import json
import re
import sys
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(add_help=False)
parser.add_argument('--runtime', type=Path, default=ROOT / 'dist/2.20.0/RevisaWiki_v2_20_0.js')
arguments, remaining = parser.parse_known_args()
sys.argv = [sys.argv[0], *remaining]
spec = importlib.util.spec_from_file_location('publication_privacy', ROOT / 'scripts/publication_privacy_gate.py')
privacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(privacy)
RUNTIME_SHA256 = '4b32f9e6fa2d2dbb6283e418ab18f16047bb7b7ba7dd41ac21ec568232ca99a1'


def archive(raw, name='runtime.js'):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_DEFLATED) as package:
        package.writestr(name, raw)
    return buffer.getvalue()


class ReviewedRuntimeObjectKeys(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = arguments.runtime.read_bytes()
        if hashlib.sha256(cls.raw).hexdigest() != RUNTIME_SHA256:
            raise AssertionError('The exact reviewed runtime bytes are required')
        cls.text = cls.raw.decode('utf-8')
        cls.tokens = ('user' + ':session.user,pageid:session.pageid',
                      'user' + ':mw.config.get(')
        for token in cls.tokens:
            if cls.text.count(token) != 1:
                raise AssertionError('Each reviewed token must occur exactly once')
        cls.account = 'User' + ':ContaSemPermissao'
        cls.email = 'person' + '@' + 'example.invalid'

    def scan(self, raw, path='fixture.txt', deny=()):
        scanner = privacy.Scanner(list(deny))
        scanner.scan(path, raw)
        return {finding['rule'] for finding in scanner.findings}

    def payload(self, text=None, ascii_only=False, **extra):
        value = {'engine': self.text if text is None else text, **extra}
        return json.dumps(value, ensure_ascii=ascii_only).encode('utf-8')

    def test_exact_runtime_only(self):
        self.assertEqual(self.scan(self.raw, 'runtime.js'), set())

    def test_appended_byte_requires_review_again(self):
        self.assertIn('unreviewed-wiki-user-destination', self.scan(self.raw + b'\n', 'runtime.js'))

    def test_added_account_requires_review_again(self):
        self.assertIn('unreviewed-wiki-user-destination', self.scan(self.raw + self.account.encode()))

    def test_each_token_mutation_requires_review_again(self):
        for token in self.tokens:
            changed = self.text.replace(token, token + 'Changed', 1).encode()
            with self.subTest(tokenHash=hashlib.sha256(token.encode()).hexdigest()):
                self.assertIn('unreviewed-wiki-user-destination', self.scan(changed))

    def test_isolated_object_properties_have_no_general_exemption(self):
        for token in self.tokens:
            with self.subTest(tokenHash=hashlib.sha256(token.encode()).hexdigest()):
                self.assertIn('unreviewed-wiki-user-destination', self.scan(token.encode()))

    def test_real_namespace_syntax_is_still_detected(self):
        for text in [self.account, '[[' + self.account + ']]', '"' + self.account + '"']:
            with self.subTest(form=text[:2]):
                self.assertIn('unreviewed-wiki-user-destination', self.scan(text.encode()))

    def test_exact_json_runtime_string(self):
        for ascii_only in [False, True]:
            with self.subTest(asciiOnly=ascii_only):
                self.assertEqual(self.scan(self.payload(ascii_only=ascii_only)), set())

    def test_mutated_json_runtime_string_requires_review_again(self):
        self.assertIn('unreviewed-wiki-user-destination', self.scan(self.payload(self.text + '\n')))

    def test_each_json_token_mutation_requires_review_again(self):
        for token in self.tokens:
            with self.subTest(tokenHash=hashlib.sha256(token.encode()).hexdigest()):
                changed = self.text.replace(token, token + 'Changed', 1)
                self.assertIn('unreviewed-wiki-user-destination', self.scan(self.payload(changed)))

    def test_json_claimed_hash_does_not_approve_changed_bytes(self):
        raw = self.payload(self.text + ' ', sha256=RUNTIME_SHA256)
        self.assertIn('unreviewed-wiki-user-destination', self.scan(raw))

    def test_other_json_account_is_not_masked(self):
        self.assertIn('unreviewed-wiki-user-destination', self.scan(self.payload(other=self.account)))

    def test_other_json_email_is_not_masked(self):
        self.assertIn('unreviewed-email', self.scan(self.payload(other=self.email)))

    def test_other_json_machine_path_is_not_masked(self):
        home = '/' + 'Users' + '/ExampleAccount/report.txt'
        self.assertIn('private-home-path', self.scan(self.payload(other=home)))

    def test_other_json_token_is_not_masked(self):
        secret = 'gh' + 'p_' + 'A' * 30
        self.assertIn('secret-token', self.scan(self.payload(other=secret)))

    def test_other_json_url_userinfo_is_not_masked(self):
        url = 'https://account:password' + '@' + 'example.invalid/path'
        self.assertIn('unreviewed-email', self.scan(self.payload(other=url)))

    def test_html_embedded_exact_json_runtime(self):
        raw = b'<script type="application/json">' + self.payload() + b'</script>'
        self.assertEqual(self.scan(raw, 'index.html'), set())

    def test_html_other_account_outside_payload_is_not_masked(self):
        raw = b'<script type="application/json">' + self.payload() + b'</script>' + self.account.encode()
        self.assertIn('unreviewed-wiki-user-destination', self.scan(raw, 'index.html'))

    def test_exact_json_string_inside_another_json_string(self):
        nested = json.dumps({'text': self.payload().decode()}, ensure_ascii=False).encode()
        # Only an immediately decoded complete runtime may qualify. A nested
        # serialization is not an excuse to hide an unparsed namespace token.
        self.assertIn('unreviewed-wiki-user-destination', self.scan(nested))

    def test_exact_runtime_archives(self):
        for raw in [gzip.compress(self.raw), archive(self.raw), archive(self.payload(), 'payload.json')]:
            with self.subTest(signature=raw[:2].hex()):
                self.assertEqual(self.scan(raw), set())

    def test_modified_runtime_archive_requires_review_again(self):
        self.assertIn('unreviewed-wiki-user-destination', self.scan(archive(self.raw + b' ')))

    def test_other_archive_member_stays_visible(self):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_DEFLATED) as package:
            package.writestr('runtime.js', self.raw)
            package.writestr('other.txt', self.account)
        self.assertIn('unreviewed-wiki-user-destination', self.scan(buffer.getvalue()))

    def test_unknown_archive_is_still_rejected(self):
        self.assertIn('unreadable-zip', self.scan(b'PK\x03\x04not-a-zip'))

    def test_local_denylist_uses_original_text(self):
        for raw in [self.raw, self.payload()]:
            with self.subTest(kind='json' if raw.startswith(b'{') else 'runtime'):
                self.assertIn('private-local-denylist', self.scan(raw, deny=['RevisaWiki']))

    def test_email_reader_does_not_use_the_runtime_identity_mask(self):
        # A probe in a known source token proves that only identity scanning
        # receives the new view; the email reader still sees the source text.
        with patch.object(privacy, 'EMAIL', re.compile(re.escape(self.tokens[0]))):
            for raw in [self.raw, self.payload()]:
                self.assertIn('unreviewed-email', self.scan(raw))

    def test_other_rule_readers_do_not_use_the_runtime_identity_mask(self):
        rules = dict(privacy.RULES, original_view_probe=re.compile(re.escape(self.tokens[0])))
        with patch.object(privacy, 'RULES', rules):
            for raw in [self.raw, self.payload()]:
                self.assertIn('original_view_probe', self.scan(raw))


if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(ReviewedRuntimeObjectKeys)
    result = unittest.TextTestRunner(verbosity=1).run(suite)
    print(json.dumps({'suite': 'reviewed-runtime-object-key-privacy',
                      'status': 'passed' if result.wasSuccessful() else 'failed',
                      'tests': result.testsRun, 'failures': len(result.failures),
                      'errors': len(result.errors), 'runtimeSha256': RUNTIME_SHA256,
                      'networkRequests': 0, 'wikipediaWrites': 0}))
    raise SystemExit(0 if result.wasSuccessful() else 1)
