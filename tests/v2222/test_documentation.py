"""Packaging reads literal pre text using only the HTML initial-LF rule."""
from pathlib import Path
import importlib.util
import json
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('delivery2222',ROOT/'scripts/build_delivery_v2222.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)


class LiteralPreCodeBodies(unittest.TestCase):
    def test_release_zero_counts_reject_booleans_float_strings_and_missing(self):
        builder.require_zero_counts({'writes':0,'failures':0},'writes','failures')
        for value in (False,True,0.0,'0',None,[],{},1,-1):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    builder.require_zero_counts({'writes':0,'failures':value},'writes','failures')
        with self.assertRaises(ValueError):
            builder.require_zero_counts({},'writes')

    def test_only_one_immediate_initial_lf_is_consumed(self):
        for opening in ('\n','&#10;','&#xA;','&#XA;','&#00010;'):
            with self.subTest(opening=opening):
                self.assertEqual(builder.literal_pre_code_bodies('<pre>'+opening+'\n\nBody\n</pre>'),['\n\nBody\n'])
        self.assertEqual(builder.literal_pre_code_bodies('<pre>\n</pre>'),[''])
        self.assertEqual(builder.literal_pre_code_bodies('<pre></pre>'),[''])

    def test_spaces_nbsp_tabs_cr_and_nonleading_lfs_are_never_trimmed(self):
        for text in (' \nBody\n','\t\nBody\n','\rBody\r','\u00a0\nBody\u00a0','Body\n\n','\n\nBody  '):
            with self.subTest(text=text):
                expected=text[1:]if text.startswith('\n')else text
                self.assertEqual(builder.literal_pre_code_bodies('<pre>'+text+'</pre>'),[expected])
        self.assertEqual(builder.literal_pre_code_bodies('<pre>&nbsp;&#10;Body&#32;</pre>'),['\u00a0\nBody '])

    def test_entities_are_decoded_once_and_literal_markup_is_preserved(self):
        self.assertEqual(builder.literal_pre_code_bodies('<pre>&amp;#10;Body&lt;ref&gt;</pre>'),['&#10;Body<ref>'])
        self.assertEqual(builder.literal_pre_code_bodies('<pre>! Nome&#32;!! Valor</pre>'),['! Nome !! Valor'])

    def test_missing_or_extra_guard_and_other_mutations_remain_mismatches(self):
        expected='\n\nBody'
        self.assertEqual(builder.literal_pre_code_bodies('<pre>&#10;\n\nBody</pre>'),[expected])
        for body in ('\n\nBody','&#10;\n\n\nBody',' &#10;\n\nBody','&#10;\n\nBody\n','&#10;\n\nBodx'):
            with self.subTest(body=body):
                self.assertNotEqual(builder.literal_pre_code_bodies('<pre>'+body+'</pre>'),[expected])

    def test_template_mentions_do_not_activate_documentation_dependencies(self):
        source=(ROOT/'docs/2.22.2/Documentacao_RevisaWiki_v2_22_2.wiki').read_text()
        ordinary=re.sub(r'<pre>[\s\S]*?</pre>|<nowiki>[\s\S]*?</nowiki>','',source)
        self.assertEqual(re.findall(r'\{\{([^{}\n]*)',ordinary),['Info/Software'])

    def test_current_manual_matches_every_inventory_example_without_normalization(self):
        docs=ROOT/'docs/2.22.2'
        rows=json.loads((docs/'Funcionalidades_RevisaWiki_2_22_2.json').read_text())['features']
        expected=[]
        for family in dict.fromkeys(row['family']for row in rows):
            for row in rows:
                if row['family']!=family:continue
                expected.extend([row['before'],row['after']])
                for example in row.get('additionalExamples',[]):expected.extend([example['before'],example['after']])
        self.assertGreaterEqual(len(expected),446)
        self.assertIn('\n\nTexto do artigo.',expected)
        self.assertEqual(builder.literal_pre_code_bodies((docs/'Documentacao_RevisaWiki_v2_22_2.wiki').read_text()),expected)


if __name__=='__main__':unittest.main()
