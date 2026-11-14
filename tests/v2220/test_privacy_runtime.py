"""Neutral object keys cannot become a general account-data exemption."""
from pathlib import Path
import hashlib
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'))
import publication_privacy_gate as gate

ROOT=Path(__file__).resolve().parents[2]

def sha(value):return hashlib.sha256(value.encode()).hexdigest()

class RuntimePrivacy(unittest.TestCase):
    def test_exact_neutral_keys_and_mutations(self):
        for name in ('RevisaWiki_v2_22_0.js','RevisaWiki_v2_22_0_completo.js'):
            source=(ROOT/'dist/2.22.0'/name).read_text()
            self.assertIn(sha(source),gate.APPROVED_RUNTIME_OBJECT_KEYS)
            view=gate.reviewed_runtime_identity_view(source,sha(source))
            self.assertEqual(gate.identity_findings(view),[])
            for suffix in ('\n// '+'User'+':SyntheticAccount','\n// altered neutral payload'):
                mutated=source+suffix
                # A changed whole file cannot inherit an exact-byte approval.
                self.assertNotIn(sha(mutated),gate.APPROVED_RUNTIME_OBJECT_KEYS)
                self.assertEqual(gate.reviewed_runtime_identity_view(mutated,sha(mutated)),mutated)

if __name__=='__main__':unittest.main()
