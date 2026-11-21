"""Keep the reviewed URL grammar negatives narrowly bound to their exact source."""
from pathlib import Path
import hashlib
import importlib.util
import re
import unittest
from unittest import mock

ROOT=Path(__file__).resolve().parents[2]
SPEC=importlib.util.spec_from_file_location('privacy_offsite_gate',ROOT/'scripts/publication_privacy_gate.py')
GATE=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)
FILE='tests/v2221/reference_repairs_url_interface.cjs'
SOURCE_SHA='d4fe1b0666f7e760b90cf0357e66a72d2f80ca6183f87e5f89c4336a5cac208c'
TOKENS={'5348ba074302193f007726c9f495e009528a9daf2725ce976ebe7dfe00591a10','afb5cda965d1c45bc7516055faa5175df700b61d05666ccd503933fd5b860a40','fad4a52f13cdf2c676bcd11791670f4144922ff0c923de042cb34f60318288b8'}

def findings(raw):
    scanner=GATE.Scanner([])
    scanner.scan(FILE,raw)
    return scanner.findings

class ExactOffsiteGrammarFixture(unittest.TestCase):
    def setUp(self):
        self.raw=(ROOT/FILE).read_bytes()
        self.assertEqual(hashlib.sha256(self.raw).hexdigest(),SOURCE_SHA)

    def test_reviewed_source_and_only_three_exact_literals(self):
        self.assertEqual(GATE.APPROVED_SYNTHETIC_URL_FIXTURES[SOURCE_SHA],TOKENS)
        self.assertEqual(findings(self.raw),[])

    def test_any_change_invalidates_the_source_approval(self):
        self.assertTrue(findings(self.raw+b'\n'))

    def test_missing_one_literal_is_not_a_file_wide_waiver(self):
        for token in sorted(TOKENS):
            with self.subTest(token=token),mock.patch.dict(GATE.APPROVED_SYNTHETIC_URL_FIXTURES,{SOURCE_SHA:TOKENS-{token}}):
                self.assertTrue(findings(self.raw))

    def test_an_extra_address_is_still_detected(self):
        extra=b'\n// '+b'person'+b'@'+b'example.invalid\n'
        self.assertTrue(findings(self.raw+extra))

    def test_the_same_literal_in_another_source_is_not_approved(self):
        values=[match.group() for match in re.finditer(r"https?://[^\s\"'<>]+",self.raw.decode(),re.I)if hashlib.sha256(match.group().encode()).hexdigest()in TOKENS]
        self.assertEqual(len(values),3)
        for value in values:
            with self.subTest(token=hashlib.sha256(value.encode()).hexdigest()):
                self.assertTrue(findings(('const value='+repr(value)+';\n').encode()))

if __name__=='__main__':unittest.main()
