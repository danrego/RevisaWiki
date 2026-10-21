"""Keep exact namespace collision fixtures without admitting real account data."""
from pathlib import Path
import hashlib
import importlib.util
import unittest
ROOT = Path(__file__).resolve().parents[2]
LOCAL_NS = 'Usuário' + ':'
USER_NS = 'User' + ':'
spec = importlib.util.spec_from_file_location('privacy', ROOT / 'scripts/publication_privacy_gate.py')
privacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(privacy)
class NamespaceApprovals(unittest.TestCase):
    def raw(self):
        return (ROOT/'tests/v219/new_writer_observers/bank_peer/fixtures.json').read_bytes()
    def scan(self, raw):
        scanner=privacy.Scanner([])
        scanner.scan('fixture.json',raw)
        return scanner.findings
    def test_exact_collision_labels_in_exact_file(self):
        raw=self.raw()
        self.assertIn(hashlib.sha256(raw).hexdigest(),privacy.APPROVED_SYNTHETIC_WIKI_NAMESPACE_FIXTURES)
        self.assertEqual(self.scan(raw),[])
        self.assertTrue(self.scan(raw+b'\n'))
    def test_changed_or_added_account_remains_visible(self):
        raw=self.raw()
        changed=raw.replace((LOCAL_NS+'Tema').encode(),(LOCAL_NS+'Conta não fictícia').encode())
        self.assertTrue(any(item['rule']=='unreviewed-wiki-user-destination' for item in self.scan(changed)))
        self.assertTrue(any(item['rule']=='unreviewed-wiki-user-destination' for item in self.scan(raw+(' '+USER_NS+'DifferentAccount').encode())))
    def test_no_generic_namespace_or_name_allowance(self):
        for text in [USER_NS+'DifferentAccount',LOCAL_NS+'Referências',LOCAL_NS+'Tema']:
            self.assertTrue(any(item['rule']=='unreviewed-wiki-user-destination' for item in self.scan(text.encode())))
    def test_exact_token_required_even_when_given_reviewed_hash(self):
        text=self.raw().decode();pin=hashlib.sha256(self.raw()).hexdigest()
        changed=text.replace(LOCAL_NS+'Tema',LOCAL_NS+'Conta não fictícia')
        view=privacy.reviewed_fixture_view(changed,pin)
        self.assertIn(LOCAL_NS+'Conta não fictícia',view)
        self.assertTrue(privacy.identity_findings(view))
if __name__=='__main__':
    unittest.main()
