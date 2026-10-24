"""Exact source-bound privacy exceptions must not waive adjacent private data."""
from pathlib import Path
import hashlib
import importlib.util
import os
import re
import unittest
import io
import json
import sys
from unittest.mock import patch
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[2]
SPEC=importlib.util.spec_from_file_location('privacy_current_exact',ROOT/'scripts/publication_privacy_gate.py')
GATE=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)
SHA=lambda value:hashlib.sha256(value).hexdigest()
BIO_SHA='38702d29d0060cb3afde61abe591812a86058fce33682cd93139b3366cd72b51'
URL_SHA='410504aa598cc37372f0ff9d9c9859d1e0803df4ddf8b9c43d6556f86f070fd9'
CORE_SHA='19278a1b5e2b316285a15b99246d3b156230f467a9537821f88b5a5b66816890'
TOKENS={'5d778bfd027ea19e7c596776176c61cde30417e6c5f545dc66fb327827c5470e':1,'ffbfe426853ca74b959ba5f96b1be6132490f940a72da0905aa2168df997775b':1}


def findings(raw,denied=()):
    scan=GATE.Scanner(list(denied))
    scan.scan('controlled-source.txt',raw)
    return {row['rule']for row in scan.findings}


class ExactUserinfoApproval(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw=(ROOT/'tests/v221/biography_cases.cjs').read_bytes()
        assert SHA(cls.raw)==BIO_SHA
        cls.text=cls.raw.decode()
        cls.url=next(m.group()for m in re.finditer(r'https?://[^\s"\x27<>]+',cls.text)if SHA(m.group().encode())==URL_SHA)

    def scope(self,raw):
        return patch.dict(GATE.APPROVED_SYNTHETIC_URL_FIXTURES,{SHA(raw):{URL_SHA}})

    def test_exact_reserved_userinfo_fixture(self):
        parsed=urlsplit(self.url)
        self.assertEqual(parsed.scheme,'https')
        self.assertEqual(parsed.hostname,'example.invalid')
        self.assertTrue(parsed.username and parsed.password)
        self.assertEqual(self.text.count(self.url),1)
        self.assertEqual(GATE.APPROVED_SYNTHETIC_URL_FIXTURES[BIO_SHA],{URL_SHA})
        self.assertEqual(findings(self.raw),set())

    def test_changed_complete_file_hash_is_not_approved(self):
        self.assertIn('unreviewed-email',findings(self.raw+b'\n'))

    def test_changed_url_is_not_covered_by_a_file_scope(self):
        raw=self.raw.replace(self.url.encode(),(self.url+'changed').encode())
        with self.scope(raw):
            self.assertIn('unreviewed-email',findings(raw))

    def test_unlisted_userinfo_is_not_covered(self):
        other=self.url.replace(urlsplit(self.url).hostname,'other.invalid')
        raw=self.raw+b'\n'+other.encode()
        with self.scope(raw):
            self.assertIn('unreviewed-email',findings(raw))

    def test_unlisted_query_remains_visible(self):
        address='review.address'+'@'+'other.invalid'
        raw=self.raw.replace(self.url.encode(),(self.url+'?contact='+address).encode())
        with self.scope(raw):
            self.assertIn('unreviewed-email',findings(raw))

    def test_separate_email_is_not_masked(self):
        raw=self.raw+b'\n'+('review.address'+'@'+'other.invalid').encode()
        with self.scope(raw):
            self.assertIn('unreviewed-email',findings(raw))

    def test_secret_reader_uses_the_unmasked_source(self):
        secret=('gh'+'p_'+'x'*40).encode()
        raw=self.raw+b'\n'+secret
        with self.scope(raw):
            self.assertIn('secret-token',findings(raw))

    def test_private_denylist_overrides_the_exact_synthetic_url(self):
        self.assertIn('private-local-denylist',findings(self.raw,[self.url]))

    def test_other_wiki_account_destination_is_not_masked(self):
        raw=self.raw+b'\n'+('User'+':'+'Unreviewed-Account').encode()
        with self.scope(raw):
            self.assertIn('unreviewed-wiki-user-destination',findings(raw))


class ExactRuntimeIdentityApproval(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        path=Path(os.environ.get('REVISAWIKI_PRIVACY_CORE')or ROOT/'dist/2.21.0/RevisaWiki_v2_21_0.js')
        cls.raw=path.read_bytes()
        assert SHA(cls.raw)==CORE_SHA and len(cls.raw)==2089124
        cls.text=cls.raw.decode()
        cls.record={'bytes':2089124,'tokens':TOKENS.copy()}

    def scope(self,raw,record=None):
        chosen=record or{'bytes':len(raw),'tokens':TOKENS.copy()}
        return patch.dict(GATE.APPROVED_RUNTIME_OBJECT_KEYS,{SHA(raw):chosen})

    def test_exact_current_source_and_token_counts(self):
        self.assertEqual(GATE.APPROVED_RUNTIME_OBJECT_KEYS[CORE_SHA],self.record)
        counts={key:sum(SHA(m.group().encode())==key for m in GATE.WIKI_USER_DESTINATION.finditer(self.text))for key in TOKENS}
        self.assertEqual(counts,TOKENS)
        self.assertEqual(findings(self.raw),set())

    def test_stale_complete_source_hash_is_not_masked(self):
        self.assertIn('unreviewed-wiki-user-destination',findings(self.raw+b'\n'))

    def test_wrong_byte_count_cannot_waive_identity(self):
        with self.scope(self.raw,{'bytes':len(self.raw)+1,'tokens':TOKENS.copy()}):
            self.assertIn('unreviewed-wiki-user-destination',findings(self.raw))

    def test_wrong_exact_token_count_cannot_waive_identity(self):
        wrong=TOKENS.copy()
        wrong[next(iter(wrong))]=2
        with self.scope(self.raw,{'bytes':len(self.raw),'tokens':wrong}):
            self.assertIn('unreviewed-wiki-user-destination',findings(self.raw))

    def test_unlisted_namespace_survives_known_code_property_masking(self):
        raw=self.raw+b'\n'+('User'+':'+'Unreviewed-Account').encode()
        with self.scope(raw):
            self.assertIn('unreviewed-wiki-user-destination',findings(raw))

    def test_runtime_identity_mask_does_not_hide_emails(self):
        raw=self.raw+b'\n'+('review.address'+'@'+'other.invalid').encode()
        with self.scope(raw):
            self.assertIn('unreviewed-email',findings(raw))

    def test_runtime_identity_mask_does_not_hide_secrets(self):
        raw=self.raw+b'\n'+('gh'+'p_'+'x'*40).encode()
        with self.scope(raw):
            self.assertIn('secret-token',findings(raw))

    def test_runtime_identity_mask_does_not_hide_paths(self):
        raw=self.raw+b'\n'+('/'+'Users/'+'fictional'+'/private/').encode()
        with self.scope(raw):
            self.assertIn('private-home-path',findings(raw))

    def test_raw_denylist_overrides_a_known_code_property(self):
        token=next(m.group()for m in GATE.WIKI_USER_DESTINATION.finditer(self.text)if SHA(m.group().encode())in TOKENS)
        self.assertIn('private-local-denylist',findings(self.raw,[token]))


if __name__=='__main__':
    suite=unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    result=unittest.TextTestRunner(stream=io.StringIO()).run(suite)
    print(json.dumps({'status':'passed'if result.wasSuccessful()else'failed',
                      'cases':result.testsRun,'failed':len(result.failures)+len(result.errors),
                      'matchedPrivateValuesIncluded':False,'localPathsIncluded':False,
                      'networkRequests':0,'wikipediaWrites':0}))
    sys.exit(0 if result.wasSuccessful()else 1)
