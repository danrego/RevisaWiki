"""Retain exact email findings while handling long address-free payloads."""
from pathlib import Path
import hashlib
import importlib.util
import random
import unittest

ROOT=Path(__file__).resolve().parents[2]
SPEC=importlib.util.spec_from_file_location('privacy_linear_email_gate',ROOT/'scripts/publication_privacy_gate.py')
GATE=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GATE)


def observed(text,matcher):
    return [(match.span(),match.group())for match in matcher(text)]


class LinearEmailCandidates(unittest.TestCase):
    def assert_same(self,text):
        self.assertEqual(observed(text,GATE.EMAIL.finditer),observed(text,GATE.EMAIL_GRAMMAR.finditer))

    def test_giant_base64_without_separator_has_no_email(self):
        text='QUJD'*2_200_000
        self.assertEqual(list(GATE.email_matches(text)),[])
        scanner=GATE.Scanner([]);scanner.scan('opaque.txt',text.encode())
        self.assertEqual(scanner.findings,[])

    def test_addresses_before_and_after_giant_base64_are_retained(self):
        address='person'+'@'+'example.invalid'
        text=address+' '+'QUJD'*2_200_000+' '+address
        matches=list(GATE.email_matches(text))
        self.assertEqual([match.group()for match in matches],[address,address])
        self.assertEqual(matches[0].span(),(0,len(address)))
        self.assertEqual(matches[1].end(),len(text))
        scanner=GATE.Scanner([]);scanner.scan('opaque.txt',text.encode())
        self.assertEqual([row['rule']for row in scanner.findings],['unreviewed-email','unreviewed-email'])

    def test_address_inside_contiguous_base64_keeps_entire_local_part(self):
        prefix='QUJD'*2_200_000
        address=prefix+'@'+'example.invalid'
        text=address+' '+'QUJD'*1000
        matches=list(GATE.email_matches(text))
        self.assertEqual(len(matches),1)
        self.assertEqual(matches[0].span(),(0,len(address)))
        self.assertEqual(hashlib.sha256(matches[0].group().encode()).digest(),hashlib.sha256(address.encode()).digest())

    def test_long_local_parts_domains_and_tld_boundaries_match_original(self):
        for text in [
            'a'*100_000+'@'+'example.invalid',
            'name'+'@'+'a'*100_000+'.invalid',
            'name'+'@'+'example.'+'a'*64,
            'name'+'@'+'example.invalid-more',
            'name'+'@'+'example.xn--abc',
            'name'+'@'+'a.b.c.d.invalid.'+'q'*1000,
        ]:
            with self.subTest(length=len(text)):
                self.assert_same(text)

    def test_nonoverlap_and_multiple_separator_boundaries_match_original(self):
        for text in [
            'one'+'@'+'example.invalid'+'@'+'other.invalid',
            'one'+'@'+'example.invalid+two'+'@'+'other.invalid',
            '@'+'@'+'example.invalid',
            'a'+'@'+'b'+'@'+'example.invalid',
            'word.person'+'@'+'example.invalid;next'+'@'+'example.invalid',
        ]:
            with self.subTest(text=text):
                self.assert_same(text)

    def test_unicode_and_punctuation_word_boundaries_match_original(self):
        address='person'+'@'+'example.invalid'
        for prefix in ['',':','é','é.','é+','½','中','_','😀','!','éabc.']:
            with self.subTest(prefix=prefix):
                self.assert_same(prefix+address)

    def test_bounded_randomized_candidates_match_original_tokens_and_spans(self):
        rng=random.Random(2221)
        alphabet='abcXYZ019.!#$%&*+/?^_`{|}~-@ :=é中😀\n'
        address='person'+'@'+'example.invalid'
        for index in range(1500):
            text=''.join(rng.choice(alphabet)for _ in range(rng.randrange(0,180)))
            if index%2:text=text[:len(text)//2]+address+text[len(text)//2:]
            self.assert_same(text)

    def test_exact_fixture_approval_does_not_hide_other_source_bytes(self):
        file=ROOT/'tests/v2221/reference_repairs_url_interface.cjs'
        raw=file.read_bytes()
        digest=hashlib.sha256(raw).hexdigest()
        self.assertIn(digest,GATE.APPROVED_SYNTHETIC_URL_FIXTURES)
        exact=GATE.Scanner([]);exact.scan('fixture.cjs',raw)
        self.assertEqual(exact.findings,[])
        changed=GATE.Scanner([]);changed.scan('fixture.cjs',raw+b'\n')
        self.assertEqual(len(changed.findings),4)
        extra=GATE.Scanner([])
        extra.scan('fixture.cjs',raw+b'\n'+b'new'+b'@'+b'example.invalid')
        self.assertTrue(any(row['rule']=='unreviewed-email'for row in extra.findings))


if __name__=='__main__':unittest.main()
