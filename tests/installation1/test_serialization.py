"""Directed tests of save-safe JSON spelling, without network operations."""
from pathlib import Path
import hashlib
import json
import re
import sys
import unittest
import unicodedata

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from wiki_safe_data import protect_data_module, protect_json_source


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def saved(source):
    # A deliberately small adversarial model of the observed save operations.
    # Native API qualification is a separate mandatory release gate.
    return re.sub(
        r'\{\{\s*(?:subst|safesubst|substância|substituir)\s*:[^{}]*\}\}',
        'changed-at-save',
        unicodedata.normalize('NFC', source),
        flags=re.IGNORECASE,
    ).replace('~~~~', 'signature-at-save').rstrip('\n')


class SaveSafeSerialization(unittest.TestCase):
    def check_value(self, value):
        source = compact(value)
        protected = protect_json_source(source)
        self.assertEqual(json.loads(protected), value)
        self.assertEqual(json.loads(saved(protected)), value)
        self.assertEqual(protected, unicodedata.normalize('NFC', protected))
        self.assertEqual(protected, protect_json_source(protected))
        self.assertNotIn('{{', protected)
        self.assertNotIn('~~~', protected)
        return protected

    def test_plain_json_and_structure_are_unchanged(self):
        for value in [None, True, False, 0, -17, 1.25, [], {}, {'n': [1, 2]}]:
            with self.subTest(value=value):
                self.assertEqual(self.check_value(value), compact(value))

    def test_all_substitution_forms_and_localized_spelling(self):
        for word in ['subst', 'SUBST', 'safesubst', 'substância', 'substituir',
                     'subst :', ' subst ', '任意の別名', 'подст', 'sicher_ersetzen']:
            with self.subTest(alias=word):
                self.check_value({'x': '{{' + word + ':DATA}}'})

    def test_nested_substitutions_and_parser_functions(self):
        self.check_value({'x': '{{Sem fontes|data={{subst:DATA}}}}',
                          'y': '{{safesubst:#if:1|{{subst:DATA}}|x}}'})

    def test_signatures_are_literal(self):
        self.check_value(['~~~', '~~~~', '~~~~~', 'a~~~~b', '~', '~~'])

    def test_escaped_regex_braces_and_backslashes(self):
        self.check_value([r'\{\{', r'\\{', r'\u007b', '\\"{{subst:X}}',
                          '"quoted" { braces } \\ slash'])

    def test_existing_unicode_escape_spelling_is_preserved(self):
        source = r'{"key":"\u007b\u007bsubst:DATA}}","mark":"A\u0301"}'
        self.assertEqual(protect_json_source(source), source)

    def test_latin_combining_marks_preserve_original_sequence(self):
        self.check_value({'e\u0301': 'e\u0301', 'é': 'é', 'a': 'A\u030a'})

    def test_distinct_greek_keys_do_not_collide(self):
        value = {'ά': 'Ά', 'ά': 'Ά', 'ΐ': 'Ι\u0308\u0301', 'ΐ': 'Ι\u0308\u0301'}
        self.assertLess(len(json.loads(unicodedata.normalize('NFC', compact(value)))), len(value))
        protected = self.check_value(value)
        self.assertEqual(len(json.loads(saved(protected))), 4)

    def test_hangul_jamo_remain_uncomposed(self):
        self.check_value({'\u1100\u1161': '\u1100\u1161\u11a8', '가': '각',
                          'extended': '\ua960\ud7b0'})

    def test_reordering_marks_tibetan_and_arabic(self):
        self.check_value(['A\u0315\u0300', '\u0f73', 'ض\u064b', 'a\u0344'])

    def test_non_bmp_combining_marks_use_surrogate_pairs(self):
        protected = self.check_value(['A\U0001d165', '\U0001e000', '\U000e0100'])
        self.assertIn(r'\ud834\udd65', protected)
        self.assertIn(r'\udb40\udd00', protected)

    def test_every_unicode_composition_sensitive_scalar(self):
        chars = []
        for scalar in range(0x110000):
            if 0xD800 <= scalar <= 0xDFFF:
                continue
            character = chr(scalar)
            if (unicodedata.category(character).startswith('M')
                    or unicodedata.normalize('NFC', character) != character
                    or 0x1100 <= scalar <= 0x11FF
                    or 0xA960 <= scalar <= 0xA97F
                    or 0xD7B0 <= scalar <= 0xD7FF):
                chars.append(character)
        self.assertGreater(len(chars), 3000)
        self.check_value(chars)

    def test_line_separators_are_escaped(self):
        protected = self.check_value(['\u2028', '\u2029', '\n', '\t', '\r'])
        self.assertNotIn('\u2028', protected)
        self.assertNotIn('\u2029', protected)

    def test_module_only_changes_json_string_spelling(self):
        value = {'x': '{{subst:DATA}}', 'ά': 'Ά'}
        prefix = '/* Data. */\n(function(root){const data='
        suffix = ';if(typeof module!=="undefined")module.exports=data;})(this);\n'
        source = prefix + compact(value) + suffix
        protected = protect_data_module(source)
        self.assertEqual(protected, prefix + protect_json_source(compact(value)) + suffix)
        self.assertEqual(protected, protect_data_module(protected))

    def test_wrapper_like_text_in_values_cannot_truncate_json(self):
        value = {'x': ';if(typeof module', 'y': 'const data={{subst:DATA}}'}
        source = 'const data=' + compact(value) + ';if(typeof module){}'
        protected = protect_data_module(source)
        decoded, _ = json.JSONDecoder().raw_decode(protected, len('const data='))
        self.assertEqual(decoded, value)

    def test_non_json_and_incomplete_wrappers_are_rejected(self):
        for source in ['const x={};', 'const data={}', 'const data={}junk;if(typeof module',
                       'const data={"x":"incomplete};if(typeof module']:
            with self.subTest(source=source):
                with self.assertRaises(ValueError):
                    protect_data_module(source)

    def test_vulnerable_wrapper_is_rejected_instead_of_changed(self):
        for prefix in ['/* {{subst:DATA}} */', '/* ~~~~ */', '/* e\u0301 */']:
            with self.subTest(prefix=prefix):
                with self.assertRaises(ValueError):
                    protect_data_module(prefix + 'const data={};if(typeof module){}')

    def test_json_whitespace_numbers_and_byte_order_are_retained(self):
        source = '{\n  "x" : 1.0e+2, "z": "e\u0301", "x": 17\n}\n'
        protected = protect_json_source(source)
        self.assertEqual(protected, source.replace('\u0301', r'\u0301'))
        self.assertEqual(json.loads(protected), json.loads(source))

    def test_deterministic_output(self):
        value = {'nested': [{'x': '{{subst:X}}', 'e\u0301': '~'}]}
        source = compact(value)
        self.assertEqual(
            hashlib.sha256(protect_json_source(source).encode()).hexdigest(),
            hashlib.sha256(protect_json_source(source).encode()).hexdigest(),
        )

    def test_frozen_catalogue_and_page_limit(self):
        source = (ROOT / 'dist/2.21.1/RevisaWiki_v2_21_1_dados.js').read_text()
        protected = protect_data_module(source)
        begin = source.index('const data=') + len('const data=')
        original, _ = json.JSONDecoder().raw_decode(source, begin)
        decoded, _ = json.JSONDecoder().raw_decode(protected, begin)
        self.assertEqual(decoded, original)
        self.assertLess(len(protected.encode()), 2097152)
        self.assertEqual(len(decoded['packed']['support221']['citation']['V221_NATIVE_TITLECASE_MAP']), 1507)
        for key in ['pai', 'sf', 'cf', 'mf']:
            self.assertIn('{{subst:DATA}}', decoded['packed']['support221']['literals']['SHORTCUTS'][key])


if __name__ == '__main__':
    unittest.main()
