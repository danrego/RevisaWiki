"""The frozen URL grammar counterexample grants no general identity exception."""
from pathlib import Path
import hashlib
import importlib.util
import unittest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('v2221_url_privacy',ROOT/'scripts/publication_privacy_gate.py')
privacy=importlib.util.module_from_spec(spec)
spec.loader.exec_module(privacy)


class V2221SyntheticURLFixture(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw=(ROOT/'tests/v2221/citation_repairs.cjs').read_bytes()
        cls.digest=hashlib.sha256(cls.raw).hexdigest()
        if cls.digest!='b28dd7494340a2bb160b9b82728f15f290480fc1073e4030f4a77623e048023f':
            raise AssertionError('The exact reviewed citation fixture is required')

    def scan(self,raw):
        scanner=privacy.Scanner([])
        scanner.scan('fixture.cjs',raw)
        return scanner.findings

    def test_exact_reviewed_bytes_only(self):
        self.assertIn(self.digest,privacy.APPROVED_SYNTHETIC_URL_FIXTURES)
        self.assertEqual(self.scan(self.raw),[])
        self.assertTrue(self.scan(self.raw+b'\n'))

    def test_changed_domain_or_userinfo_requires_new_review(self):
        for before,after in [(b'example.org',b'different.invalid'),(b'login:secret',b'other:dummy')]:
            changed=self.raw.replace(before,after)
            self.assertTrue(any(row['rule']=='unreviewed-email'for row in self.scan(changed)))

    def test_added_identifier_is_not_masked(self):
        extra=('person'+'@'+'example.invalid').encode()
        self.assertTrue(any(row['rule']=='unreviewed-email'for row in self.scan(self.raw+b'\n'+extra)))
        self.assertTrue(self.scan(extra))

    def test_file_and_token_hashes_are_both_required(self):
        text=self.raw.decode()
        self.assertNotEqual(privacy.reviewed_fixture_view(text,self.digest),text)
        self.assertEqual(privacy.reviewed_fixture_view(text,'0'*64),text)
        changed=text.replace('example.org','different.invalid')
        self.assertEqual(privacy.reviewed_fixture_view(changed,self.digest),changed)


if __name__=='__main__':unittest.main()
