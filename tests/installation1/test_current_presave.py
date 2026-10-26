"""The repeat command performs a new check and never replaces old receipts."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
import verify_current_presave as current


class RepeatCommandTests(unittest.TestCase):
    def test_fresh_receipt_is_checked_and_returned(self):
        proof = {'status': 'passed', 'wikipediaWrites': 0}
        out = io.StringIO()
        with mock.patch.object(current, 'check_presave', return_value=proof) as check, mock.patch.object(current, 'validate_receipt') as validate, mock.patch.object(Path, 'write_text', side_effect=AssertionError('No receipt writes')), contextlib.redirect_stdout(out):
            self.assertEqual(current.main(), 0)
        check.assert_called_once_with(current.MANIFEST, current.DATA)
        validate.assert_called_once_with(proof, current.MANIFEST, current.DATA)
        self.assertEqual(json.loads(out.getvalue()), proof)

    def test_native_failure_cannot_pass(self):
        out = io.StringIO()
        with mock.patch.object(current, 'check_presave', side_effect=current.GateError('native-api-request-failed')), contextlib.redirect_stdout(out):
            self.assertEqual(current.main(), 1)
        self.assertEqual(json.loads(out.getvalue())['status'], 'failed')

    def test_invalid_receipt_cannot_pass(self):
        out = io.StringIO()
        with mock.patch.object(current, 'check_presave', return_value={}), mock.patch.object(current, 'validate_receipt', side_effect=current.GateError('invalid-receipt')), contextlib.redirect_stdout(out):
            self.assertEqual(current.main(), 1)
        self.assertEqual(json.loads(out.getvalue())['reason'], 'invalid-receipt')

    def test_missing_file_is_reported_without_local_path(self):
        out = io.StringIO()
        with mock.patch.object(current, 'check_presave', side_effect=OSError('private-path')), contextlib.redirect_stdout(out):
            self.assertEqual(current.main(), 1)
        self.assertNotIn('private-path', out.getvalue())


if __name__ == '__main__':
    unittest.main()
