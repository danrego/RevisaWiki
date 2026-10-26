"""Deterministic negative controls for the native pre-save release gate."""
from pathlib import Path
import copy
import hashlib
import importlib.util
import json
import subprocess
import tempfile
import unittest
import urllib.parse
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("presave_gate", ROOT / "scripts/check_wiki_presave.py")
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def source(data):
    return (gate.PREFIX + json.dumps(data, ensure_ascii=True, separators=(",", ":")) + gate.SUFFIX + "\n").encode()


class GateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        folder = Path(self.tmp.name)
        self.data = {"version": gate.VERSION, "schema": 1, "packed": {"sample": {"ΐ": "Ι\u0308\u0301", "literal": "{{subst:DATA}}", "signature": "~~~~"}}}
        self.raw = source(self.data)
        self.fixed = folder / gate.DATA_NAME
        self.original = folder / "baseline.js"
        self.fixed.write_bytes(self.raw)
        self.original.write_bytes(self.raw)
        self.pin = {"bytes": len(self.raw), "sha256": gate.sha(self.raw)}
        self.manifest = folder / "runtime.json"
        self.baseline = folder / "baseline.json"
        packed_hash = gate.sha(gate.canonical(self.data["packed"]).encode())
        m = {"version": gate.VERSION, "distributionRevision": gate.REVISION, "packedCatalogSha256": packed_hash, "files": {gate.DATA_NAME: self.pin}}
        b = {**m, "distributionRevision": gate.VERSION}
        self.manifest.write_text(json.dumps(m))
        self.baseline.write_text(json.dumps(b))
        self.addCleanup(patch.stopall)
        patch.object(gate, "BASELINE_MANIFEST", self.baseline).start()
        patch.object(gate, "BASELINE_DATA", self.original).start()

    def check(self, result=None):
        with patch.object(gate, "request_presave", return_value=self.raw[:-1] if result is None else result):
            return gate.check_presave(self.manifest, self.fixed)

    def test_fixed_wrapper_and_data_decode_without_execution(self):
        self.assertEqual(gate.decode_data_source(self.raw), self.data)
        with self.assertRaises(gate.GateError):
            gate.decode_data_source(self.raw.replace(b';if(typeof module', b';globalThis.runMe();if(typeof module'))

    def test_changed_json_duplicate_key_rejected(self):
        with self.assertRaisesRegex(gate.GateError, 'duplicate-json-key'):
            gate.decode_data_source(source(self.data).replace(b'"schema":1', b'"schema":1,"schema":1'))

    def test_invalid_utf8_and_json_rejected(self):
        for invalid in [b'\xff', b'null', self.raw.replace(b'"schema":1', b'"schema":NaN')]:
            with self.subTest(value=invalid[:20]), self.assertRaises(gate.GateError):
                gate.decode_data_source(invalid)

    def test_wrong_shape_or_type_rejected(self):
        for key, value in [("version", "2.20.0"), ("schema", True), ("schema", 2), ("packed", [])]:
            data = copy.deepcopy(self.data)
            data[key] = value
            with self.subTest(key=key, value=value), self.assertRaises(gate.GateError):
                gate.decode_data_source(source(data))

    def test_canonical_utf16_order(self):
        value = {"\ue000": 1, "\U00010000": 2, "2": 3, "10": 4}
        self.assertEqual(gate.canonical(value), '{"10":4,"2":3,"\U00010000":2,"\ue000":1}')

    def test_canonical_strings_match_json_stringify_spelling(self):
        value = ['"\\\b\f\n\r\t', '\u2028\u2029', '\ud800', '\udfff', 'é', '😀']
        self.assertEqual(gate.canonical(value), '["\\\"\\\\\\b\\f\\n\\r\\t","\u2028\u2029","\\ud800","\\udfff","é","😀"]')

    def test_canonical_unsupported_number_rejected(self):
        for value in [float('nan'), float('inf'), 1.25, 2**53, -2**53]:
            with self.subTest(value=value), self.assertRaises(gate.GateError):
                gate.canonical(value)

    def test_native_presave_exact_source_accepted(self):
        self.assertEqual(self.check(self.raw)['status'], 'passed')

    def test_native_presave_single_terminal_lf_accepted(self):
        receipt = self.check()
        gate.validate_receipt(receipt, self.manifest, self.fixed)
        self.assertTrue(receipt['decodedDataPreserved'])
        self.assertEqual(receipt['afterPresaveData']['bytes'], len(self.raw) - 1)

    def test_native_presave_multiple_trim_or_whitespace_rejected(self):
        for altered in [self.raw[:-2], self.raw + b'\n', b' ' + self.raw, self.raw.replace(b';if', b'; if')]:
            with self.subTest(change=gate.sha(altered)), self.assertRaisesRegex(gate.GateError, 'changed-source'):
                self.check(altered)

    def test_native_source_transform_rejected(self):
        for old, new in [(b'\\u0399\\u0308\\u0301', b'\\u03aa\\u0301'), (b'{{subst:DATA}}', b'data=October de 2026'), (b'~~~~', b'Signature')]:
            self.assertIn(old, self.raw)
            with self.subTest(old=old), self.assertRaisesRegex(gate.GateError, 'changed-source'):
                self.check(self.raw.replace(old, new))

    def test_candidate_data_not_matching_its_manifest_rejected_before_network(self):
        self.fixed.write_bytes(self.raw + b'\n')
        with patch.object(gate, 'request_presave') as network, self.assertRaisesRegex(gate.GateError, 'pin-mismatch'):
            gate.check_presave(self.manifest, self.fixed)
        network.assert_not_called()

    def test_changed_baseline_data_rejected_before_network(self):
        self.original.write_bytes(self.raw + b'\n')
        with patch.object(gate, 'request_presave') as network, self.assertRaisesRegex(gate.GateError, 'pin-mismatch'):
            gate.check_presave(self.manifest, self.fixed)
        network.assert_not_called()

    def test_new_manifest_cannot_authorize_changed_catalogue(self):
        changed = copy.deepcopy(self.data)
        changed['packed']['sample']['new'] = True
        raw = source(changed)
        self.fixed.write_bytes(raw)
        manifest = json.loads(self.manifest.read_text())
        manifest['files'][gate.DATA_NAME] = {'bytes': len(raw), 'sha256': gate.sha(raw)}
        manifest['packedCatalogSha256'] = gate.sha(gate.canonical(changed['packed']).encode())
        self.manifest.write_text(json.dumps(manifest))
        with self.assertRaisesRegex(gate.GateError, 'frozen-baseline'):
            self.check()

    def test_receipt_mutations_rejected(self):
        receipt = self.check()
        mutations = {
            'status': 'failed', 'kind': 'example', 'version': '2.20.0',
            'distributionRevision': '2.21.1', 'runtimeManifestSha256': '0'*64,
            'baselineManifestSha256': '0'*64, 'canonicalPackedSha256': '0'*64,
            'sourcePreservedExceptTerminalNewline': False, 'decodedDataPreserved': False,
            'expectedCataloguePreserved': False, 'endpoint': 'https://example.invalid/api.php',
            'apiAction': 'edit', 'onlypst': False, 'authenticated': True,
            'wikipediaWrites': 1, 'gateScriptSha256': '0'*64,
            'inputData': {**receipt['inputData'], 'sha256': '0'*64},
            'afterPresaveData': {'bytes': 1, 'sha256': '0'*64},
        }
        for key, value in mutations.items():
            changed = copy.deepcopy(receipt)
            changed[key] = value
            with self.subTest(key=key), self.assertRaises(gate.GateError):
                gate.validate_receipt(changed, self.manifest, self.fixed)

    def test_receipt_missing_field_rejected(self):
        receipt = self.check()
        for key in list(receipt):
            if key == 'afterPresaveData' or key in ['kind', 'status', 'inputData', 'gateScriptSha256']:
                changed = {k: v for k, v in receipt.items() if k != key}
                with self.subTest(key=key), self.assertRaises(gate.GateError):
                    gate.validate_receipt(changed, self.manifest, self.fixed)

    def test_missing_receipt_rejected(self):
        for value in [None, [], 'passed']:
            with self.subTest(value=value), self.assertRaises(gate.GateError):
                gate.validate_receipt(value, self.manifest, self.fixed)

    def test_stale_manifest_after_receipt_rejected(self):
        receipt = self.check()
        self.manifest.write_text(self.manifest.read_text() + '\n')
        with self.assertRaisesRegex(gate.GateError, 'runtimeManifestSha256'):
            gate.validate_receipt(receipt, self.manifest, self.fixed)

    def test_receipt_type_confusion_rejected(self):
        receipt = self.check()
        receipt['wikipediaWrites'] = False
        with self.assertRaises(gate.GateError):
            gate.validate_receipt(receipt, self.manifest, self.fixed)

    def test_native_api_request_is_only_read_only_parse(self):
        response = json.dumps({'parse': {'text': self.raw[:-1].decode(), 'wikitext': 'ignored'}}).encode()
        with patch.object(gate.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, response, b'')) as call:
            self.assertEqual(gate.request_presave(self.raw), self.raw[:-1])
        args, kwargs = call.call_args
        command = args[0]
        self.assertEqual(command[:2], ['curl', '--disable'])
        self.assertEqual(command[-1], gate.ENDPOINT)
        self.assertNotIn('--cookie', command)
        self.assertNotIn('--user', command)
        self.assertNotIn('--insecure', command)
        self.assertIn('--fail-with-body', command)
        self.assertEqual(command[command.index('--max-time')+1], '60')
        form = urllib.parse.parse_qs(kwargs['input'].decode())
        self.assertEqual(form['action'], ['parse'])
        self.assertEqual(form['onlypst'], ['1'])
        self.assertEqual(form['contentmodel'], ['javascript'])
        self.assertEqual(form['text'], [self.raw.decode()])
        self.assertNotIn('token', form)

    def test_native_api_failure_is_not_a_pass(self):
        cases = [(0, b'{}'), (0, b'not json'), (0, b'{"error":{"code":"blocked"}}'), (0, b'{"warnings":{"parse":"warning"},"parse":{"text":"x"}}'), (0, b'{"parse":{"wikitext":"unexpanded"}}'), (0, b'{"parse":{"text":3}}'), (22, b'{}')]
        for code, raw in cases:
            with self.subTest(code=code, response=raw), patch.object(gate.subprocess, 'run', return_value=subprocess.CompletedProcess([], code, raw, b'')), self.assertRaises(gate.GateError):
                gate.request_presave(self.raw)

    def test_native_api_invalid_text_encoding_rejected(self):
        cases = ['{"parse":{"text":"\\ud800"}}'.encode(), '{"parse":{"text":"sample"}}'.encode('utf-16')]
        for raw in cases:
            with self.subTest(raw=raw[:15]), patch.object(gate.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, raw, b'')), self.assertRaises(gate.GateError):
                gate.request_presave(self.raw)

    def test_manifest_non_object_rejected(self):
        self.manifest.write_text('[]')
        with self.assertRaisesRegex(gate.GateError, 'manifest-shape'):
            self.check()

    def test_native_timeout_or_missing_curl_is_not_a_pass(self):
        for error in [subprocess.TimeoutExpired('curl', 65), FileNotFoundError('curl')]:
            with self.subTest(error=type(error).__name__), patch.object(gate.subprocess, 'run', side_effect=error), self.assertRaises(gate.GateError):
                gate.request_presave(self.raw)

    def test_native_response_size_guard(self):
        with patch.object(gate, 'MAX_RESPONSE_BYTES', 2), patch.object(gate.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, b'{}\n', b'')), self.assertRaisesRegex(gate.GateError, 'too-large'):
            gate.request_presave(self.raw)

    def test_invalid_data_wrapper_from_native_cannot_execute(self):
        changed = self.raw.replace(b';if(typeof module', b';dangerousCall();if(typeof module')
        with self.assertRaises(gate.GateError):
            self.check(changed)


if __name__ == '__main__':
    unittest.main()
