"""Only the required technical installation destinations may retain an account."""
from pathlib import Path
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'))
import publication_privacy_gate as gate

class TechnicalDestinations(unittest.TestCase):
    def test_additional_installation_pages_are_exactly_allowed(self):
        title=gate.TECHNICAL_SCRIPT_TITLE.removesuffix('.js')
        for suffix in ('','/Dados.js','/Catalogo.js','/Regras.js','/Carregador.js','.js'):
            with self.subTest(suffix=suffix):self.assertEqual(gate.identity_findings(title+suffix),[])
        for suffix in ('/Outra.js','/Catalogo.js/Extra','/RegrasPrivadas.js','/Dados.js/Extra'):
            with self.subTest(suffix=suffix):self.assertTrue(gate.identity_findings(title+suffix))

if __name__=='__main__':unittest.main()
