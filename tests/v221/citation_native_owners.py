"""Fixture checks for native-evidence owner extraction, separate from the tool."""
import unittest
from citation_native_pairs import native_owners


class NativeOwners(unittest.TestCase):
    def test_nested_divs_do_not_truncate_reference_or_error_evidence(self):
        before = '<div id="v221-native-0-before"><div>Caixa</div><span class="scribunto-error">Erro preservado</span><ol class="references"><li>Fonte</li></ol></div>'
        after = '<div id="v221-native-0-after">Depois</div>'
        self.assertEqual(native_owners('<div>' + before + after + '</div>'), {
            'v221-native-0-before': before, 'v221-native-0-after': after})

    def test_line_offsets_keep_exact_native_html_bytes(self):
        owner = '<div class="teste" id="v221-native-1-before">\n<div>Um</div>\nDois</div>'
        self.assertEqual(native_owners('<div>\n' + owner + '\n</div>'), {'v221-native-1-before': owner})

    def test_unclosed_native_test_owner_is_not_accepted(self):
        with self.assertRaises(ValueError):
            native_owners('<div id="v221-native-0-before">Incompleto')

    def test_nested_test_owners_are_not_accepted(self):
        with self.assertRaises(ValueError):
            native_owners('<div id="v221-native-0-before"><div id="v221-native-0-after">Inválido</div></div>')


if __name__ == '__main__':
    unittest.main()
