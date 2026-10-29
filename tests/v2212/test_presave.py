"""Release data must survive exact read-only pre-save and reject stale receipts."""
from pathlib import Path
import importlib.util
import json
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('gate2212',ROOT/'scripts/check_wiki_presave_v2212.py')
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
MANIFEST=ROOT/'tests/expected_release_v2212.json'
DATA=ROOT/'dist/2.21.2/RevisaWiki_v2_21_2_dados.js'

class Presave(unittest.TestCase):
    def test_exact_catalogue(self):
        x=gate.inspect_inputs(MANIFEST,DATA)
        self.assertIn('support2212',x['data']['packed'])
        self.assertEqual(x['raw'],DATA.read_bytes())
    def test_duplicate_key(self):
        with self.assertRaises(gate.GateError):gate.strict_json('{"a":1,"a":2}')
    def test_nonfinite(self):
        for value in ('NaN','Infinity','-Infinity'):
            with self.subTest(value=value),self.assertRaises(gate.GateError):gate.strict_json(value)
    def test_wrapper(self):
        for raw in (DATA.read_bytes()+b'alert(1)',b'\xff',DATA.read_bytes().replace(b'const data=',b'const other=',1)):
            with self.subTest(raw=raw[:30]),self.assertRaises(gate.GateError):gate.decode_data_source(raw)
    def test_expected_source(self):
        raw=DATA.read_bytes()
        for after in (raw,raw.rstrip(b'\n')):
            with patch.object(gate,'request_presave',return_value=after):
                receipt=gate.check_presave(MANIFEST,DATA)
                gate.validate_receipt(receipt,MANIFEST,DATA)
                self.assertTrue(receipt['decodedDataPreserved'])
        with patch.object(gate,'request_presave',return_value=raw.replace(b'2.21.2',b'2.21.3',1)):
            with self.assertRaises(gate.GateError):gate.check_presave(MANIFEST,DATA)
    def test_stale_receipt(self):
        with patch.object(gate,'request_presave',return_value=DATA.read_bytes()):
            receipt=gate.check_presave(MANIFEST,DATA)
        for key,value in (('status','failed'),('runtimeManifestSha256','0'*64),('gateScriptSha256','0'*64),('wikipediaWrites',1),('canonicalPackedSha256','0'*64),('authenticated',True)):
            with self.subTest(key=key),self.assertRaises(gate.GateError):gate.validate_receipt({**receipt,key:value},MANIFEST,DATA)
        for receipt in (None,{}, {'status':'passed'}):
            with self.subTest(receipt=receipt),self.assertRaises(gate.GateError):gate.validate_receipt(receipt,MANIFEST,DATA)
    def test_modified_data(self):
        with tempfile.TemporaryDirectory()as folder:
            p=Path(folder)/'data.js';p.write_bytes(DATA.read_bytes().replace(b'2.21.2',b'2.21.3',1))
            with self.assertRaises(gate.GateError):gate.inspect_inputs(MANIFEST,p)
    def test_complete_old_catalogue_and_new_maps(self):
        current=gate.decode_data_source(DATA.read_bytes())
        original=gate.decode_data_source(gate.BASELINE_DATA.read_bytes(),version=gate.BASELINE_VERSION,prefix=gate.BASELINE_PREFIX)
        self.assertEqual({k:v for k,v in current['packed'].items()if k!='support2212'},original['packed'])
        self.assertEqual(current['packed']['support2212'],json.loads((ROOT/'tests/expected_v2212_literals.json').read_text()))
        self.assertEqual(len(current['packed']['support2212']['literals']['V2212_PORTAL_DESTINATIONS']),24)
    def test_unsafe_integer(self):
        with self.assertRaises(gate.GateError):gate.canonical(9007199254740992)

if __name__=='__main__':unittest.main()
