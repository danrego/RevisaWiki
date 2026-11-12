"""Native processing must preserve all installable script bytes."""
from pathlib import Path
import copy
import sys
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts'))
import check_runtime_presave_v2217 as runtime

MANIFEST=ROOT/'tests/expected_release_v2217.json'


class RuntimePresave(unittest.TestCase):
    def receipt(self,trim=False):
        with patch.object(runtime.gate,'request_presave',side_effect=lambda raw:raw[:-1] if trim and raw.endswith(b'\n') else raw):
            return runtime.check(MANIFEST)

    def test_complete_and_one_terminal_newline(self):
        for trim in (False,True):
            receipt=self.receipt(trim)
            self.assertEqual(len(runtime.validate_receipt(receipt,MANIFEST)['scripts']),6)

    def test_native_source_replacement_rejected(self):
        with patch.object(runtime.gate,'request_presave',side_effect=lambda raw:raw+b' '):
            with self.assertRaises(runtime.gate.GateError):runtime.check(MANIFEST)

    def test_receipt_identity_guards(self):
        base=self.receipt()
        for key,value in [('status','failed'),('version','2.21.6'),('runtimeManifestSha256','0'*64),('gateScriptSha256','0'*64),('authenticated',True),('wikipediaWrites',1),('onlypst',False),('scripts',{})]:
            with self.subTest(key=key),self.assertRaises(runtime.gate.GateError):runtime.validate_receipt({**base,key:value},MANIFEST)

    def test_each_script_exact_input_and_output(self):
        base=self.receipt()
        for name in base['scripts']:
            for key in ('input','nativeOutput'):
                changed=copy.deepcopy(base)
                changed['scripts'][name][key]['sha256']='0'*64
                with self.subTest(name=name,key=key),self.assertRaises(runtime.gate.GateError):runtime.validate_receipt(changed,MANIFEST)


if __name__=='__main__':unittest.main()
