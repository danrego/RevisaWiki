"""Synthetic release-gate controls; no network request is made by these tests."""
from pathlib import Path
import copy
import importlib.util
import unittest
from unittest import mock

ROOT=Path(__file__).resolve().parents[2]

def load(name):
    import sys
    sys.path.insert(0,str(ROOT/'scripts'))
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/(name+'.py'))
    value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value

gate=load('check_wiki_presave_v2221')
native=load('check_runtime_presave_v2221')
import os
MANIFEST=Path(os.environ.get('REVISAWIKI_MANIFEST',ROOT/'tests/expected_release_v2221.json'))
DATA=(MANIFEST.parent if os.environ.get('REVISAWIKI_MANIFEST') else ROOT/'dist/2.22.1')/'RevisaWiki_v2_22_1_dados.js'

class SaveRoundTrip(unittest.TestCase):
    def test_static_manifest_and_catalogues_are_current(self):
        inspected=gate.inspect_inputs(MANIFEST,DATA)
        self.assertEqual(inspected['manifest']['version'],'2.22.1')
        _,expected,_=native.current_inputs(MANIFEST)
        self.assertGreaterEqual(len(expected),8)

    def test_exact_mocked_roundtrip_and_terminal_newline(self):
        for remove in [False,True]:
            with self.subTest(remove=remove),mock.patch.object(gate,'request_presave',lambda raw:raw[:-1] if remove and raw.endswith(b'\n') else raw):
                receipt=gate.check_presave(MANIFEST,DATA)
                gate.validate_receipt(receipt,MANIFEST,DATA)
                self.assertTrue(receipt['decodedDataPreserved'])

    def test_source_change_is_not_accepted_as_a_new_hash(self):
        with mock.patch.object(gate,'request_presave',lambda raw:raw+b' changed'):
            with self.assertRaises(gate.GateError):gate.check_presave(MANIFEST,DATA)

    def test_stale_receipt_is_rejected(self):
        with mock.patch.object(gate,'request_presave',lambda raw:raw):receipt=gate.check_presave(MANIFEST,DATA)
        for key,value in [('runtimeManifestSha256','0'*64),('decodedDataPreserved',False),('authenticated',True),('version','0.0.0')]:
            bad=copy.deepcopy(receipt);bad[key]=value
            with self.subTest(key=key),self.assertRaises(gate.GateError):gate.validate_receipt(bad,MANIFEST,DATA)

    def test_all_eight_mocked_scripts_preserve_source(self):
        with mock.patch.object(native.gate,'request_presave',lambda raw,**_:raw.removesuffix(b'\n')):
            receipt=native.check(MANIFEST)
        self.assertEqual(set(receipt['scripts']),set(native.current_inputs(MANIFEST)[1]))
        native.validate_receipt(receipt,MANIFEST)
        bad=copy.deepcopy(receipt);bad['scripts'].pop(next(iter(bad['scripts'])))
        with self.assertRaises(native.gate.GateError):native.validate_receipt(bad,MANIFEST)

    def test_native_json_reformatting_preserves_data_and_rejects_mutations(self):
        import json
        def native_output(raw,**options):
            if options.get('content_model')=='json':return json.dumps(gate.strict_json(raw),ensure_ascii=False,indent=2).encode('utf8')
            return raw.removesuffix(b'\n')
        with mock.patch.object(native.gate,'request_presave',native_output):receipt=native.check(MANIFEST)
        native.validate_receipt(receipt,MANIFEST)
        name=next(name for name in receipt['scripts'] if name.endswith('.json'))
        for change in ['source','output-pin','model','confirmation']:
            bad=copy.deepcopy(receipt);row=bad['scripts'][name]['nativeJsonModel']
            if change=='source':row['transformedSource']='{}'
            elif change=='output-pin':row['nativeOutput']['sha256']='0'*64
            elif change=='model':row['contentModel']='javascript'
            else:row['canonicalDataPreserved']=False
            with self.subTest(change=change),self.assertRaises(native.gate.GateError):native.validate_receipt(bad,MANIFEST)
        with mock.patch.object(native.gate,'request_presave',lambda raw,**options:b'{}' if options.get('content_model')=='json' else raw):
            with self.assertRaises(native.gate.GateError):native.check(MANIFEST)

    def test_duplicate_keys_and_nonfinite_values_rejected(self):
        for raw in ['{"x":1,"x":2}','{"x":NaN}','{"x":Infinity}']:
            with self.subTest(raw=raw),self.assertRaises(gate.GateError):gate.strict_json(raw)
        with self.assertRaises(gate.GateError):gate.canonical(1.5)
        with self.assertRaises(gate.GateError):gate.canonical(9007199254740992)

if __name__=='__main__':unittest.main()
