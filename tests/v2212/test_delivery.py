"""The local package builder refuses missing, stale or unverified inputs.

Every receipt in this test is an explicitly mocked, temporary test fixture.
Nothing here queries Wikipedia, changes a release or claims a native QA result.
"""
from pathlib import Path
import copy
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


delivery = load("delivery2212_test", ROOT / "scripts/build_delivery_v2212.py")
real_gate = load("presave2212_test", ROOT / "scripts/check_wiki_presave_v2212.py")


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def pin(raw):
    return {"bytes": len(raw), "sha256": digest(raw)}


class Delivery(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.root = Path(self.folder.name)
        self.dist = self.root / "dist/2.21.2"
        self.evidence = self.root / "tests/evidence/2.21.2"
        for path in (self.dist, self.evidence, self.root / "scripts", self.root / "tests/v2212",
                     self.root / "dist/2.21.1-installation.1", self.root / "src/v2_21_2"):
            path.mkdir(parents=True, exist_ok=True)
        self.gate_path = self.root / "scripts/check_wiki_presave_v2212.py"
        self.gate_path.write_bytes((ROOT / "scripts/check_wiki_presave_v2212.py").read_bytes())
        self.gate = load("temporary_presave2212_test", self.gate_path)
        original = {"version": "2.21.1", "schema": 1, "packed": {"fixture": {"text": "controle"}}}
        extension = {"literals": {"Fixture": ["teste", "controle"]}}
        current = {**original, "version": "2.21.2", "packed": {**original["packed"], "support2212": extension}}
        self.raw = (self.gate.PREFIX + json.dumps(current, ensure_ascii=False, separators=(",", ":")) + self.gate.SUFFIX + "\n").encode()
        old_raw = (self.gate.BASELINE_PREFIX + json.dumps(original, ensure_ascii=False, separators=(",", ":")) + self.gate.SUFFIX + "\n").encode()
        self.data_path = self.dist / self.gate.DATA_NAME
        self.data_path.write_bytes(self.raw)
        self.gate.BASELINE_DATA.write_bytes(old_raw)
        old_manifest = {"version": "2.21.1", "distributionRevision": "2.21.1-installation.1",
                        "files": {self.gate.BASELINE_DATA_NAME: pin(old_raw)},
                        "packedCatalogSha256": digest(self.gate.canonical(original["packed"]).encode())}
        self.gate.BASELINE_MANIFEST.write_bytes(encoded(old_manifest))
        (self.root / "tests/expected_v2212_literals.json").write_bytes(encoded(extension))
        self.source_path = self.root / "src/v2_21_2/structure.js"
        self.source_path.write_bytes(b"// Synthetic source fixture.\n")
        self.program_path = self.dist / "RevisaWiki_v2_21_2.js"
        self.program_path.write_bytes(b"// Synthetic runtime fixture.\n")
        self.manifest_path = self.root / "tests/expected_release_v2212.json"
        self.manifest = {"version": "2.21.2", "distributionRevision": "2.21.2",
                         "files": {self.gate.DATA_NAME: pin(self.raw), self.program_path.name: pin(self.program_path.read_bytes())},
                         "sourceInputs": {"src/v2_21_2/structure.js": pin(self.source_path.read_bytes())},
                         "basePackedCatalogSha256": old_manifest["packedCatalogSha256"],
                         "packedCatalogSha256": digest(self.gate.canonical(current["packed"]).encode()),
                         "addedSupport2212Sha256": digest(self.gate.canonical(extension).encode())}
        self.manifest_path.write_bytes(encoded(self.manifest))
        # A mocked return is intentionally not a claim of a native pre-save test.
        with patch.object(self.gate, "request_presave", return_value=self.raw):
            receipt = self.gate.check_presave(self.manifest_path, self.data_path)
        self.receipt_path = self.evidence / "PRESAVE_ROUNDTRIP.json"
        self.receipt_path.write_bytes(encoded(receipt))
        self.coverage_path = self.root / "tests/v2212/coverage_all.json"
        self.coverage = {"items": [{"id": "SYNTHETIC-" + str(i)} for i in range(76)]}
        self.coverage_path.write_bytes(encoded(self.coverage))
        self.proof_path = self.evidence / "SYNTHETIC_TEST_EVIDENCE.json"
        self.proof_path.write_bytes(encoded({"fixture": True, "status": "passed"}))
        self.qa = {"version": "2.21.2", "releaseGatesPassed": True,
                   "runtimeManifestSha256": digest(self.manifest_path.read_bytes()),
                   "frozenFiles": self.manifest["files"], "sourceInputs": self.manifest["sourceInputs"],
                   "wikipediaWrites": 0, "workerDeadlineMilliseconds": 60000, "unresolvedIncorrectWrites": 0,
                   "presaveRoundtripSha256": digest(self.receipt_path.read_bytes()),
                   "coverageSha256": digest(self.coverage_path.read_bytes()),
                   "evidencePins": {"tests/evidence/2.21.2/SYNTHETIC_TEST_EVIDENCE.json": pin(self.proof_path.read_bytes())}}
        self.qa_path = self.evidence / "QA_SUMMARY.json"
        self.write_qa()
        self.patches = [patch.object(delivery, key, value) for key, value in (
            ("ROOT", self.root), ("DIST", self.dist), ("EVIDENCE", self.evidence))]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)

    def write_qa(self):
        self.qa_path.write_bytes(encoded(self.qa))

    def test_optimized_python_build_is_refused(self):
        result = subprocess.run([sys.executable, "-O", str(ROOT / "scripts/build_v2212.py"), "--help"],
                                cwd=ROOT, capture_output=True, text=True, timeout=15)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Optimized Python disables required build checks", result.stderr)

    @unittest.skipUnless(os.environ.get("REVISAWIKI_NODE") or shutil.which("node"), "Node is required for the literal decoder test")
    def test_literal_decoder_rejects_executable_and_unsafe_values(self):
        node = os.environ.get("REVISAWIKI_NODE") or shutil.which("node")
        code = r"""
        const assert=require('node:assert/strict'),m=require('./scripts/v2212_literals.cjs');
        assert.equal(m.literal({type:'NumericLiteral',value:42}),42);
        for(const value of [NaN,Infinity,-Infinity,0.25,9007199254740992])
          assert.throws(()=>m.literal({type:'NumericLiteral',value}));
        for(const type of ['CallExpression','MemberExpression','BigIntLiteral','Identifier'])
          assert.throws(()=>m.literal({type}));
        const names=['V2212_PORTAL_BOXES','V2212_PORTAL_ALIASES','V2212_PORTAL_STUBS','V2212_PORTAL_DESTINATIONS','V2212_CITATION_CONTRACT'];
        const source=names.map(name=>'const '+name+'=Object.freeze({text:"teste",items:[1,true,null]});').join('\n');
        const extracted=m.extract(source);
        for(const name of names)assert.deepEqual(extracted.data.literals[name],{text:'teste',items:[1,true,null]});
        assert.throws(()=>m.extract(source.replace('{text:"teste",items:[1,true,null]}','(globalThis.__fixtureExecuted=true)')));
        assert.equal(globalThis.__fixtureExecuted,undefined);
        assert.throws(()=>m.literal({type:'ObjectExpression',properties:[{type:'ObjectProperty',computed:false,key:{type:'StringLiteral',value:'__proto__'},value:{type:'StringLiteral',value:'literal'}}]}));
        assert.throws(()=>m.extract(source.replace('V2212_CITATION_CONTRACT','notAReleaseMap')));
        """
        result = subprocess.run([node, "-e", code], cwd=ROOT, capture_output=True, text=True, timeout=20)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_valid_synthetic_inputs(self):
        manifest, qa, *_ = delivery.checked_inputs()
        self.assertEqual(manifest, self.manifest)
        self.assertTrue(qa["releaseGatesPassed"])

    def test_missing_or_failed_qa(self):
        self.qa_path.unlink()
        with self.assertRaises((OSError, ValueError)):
            delivery.checked_inputs()
        for key, value in (("releaseGatesPassed", False), ("version", "stale"),
                           ("workerDeadlineMilliseconds", 61000), ("wikipediaWrites", 1),
                           ("unresolvedIncorrectWrites", 1)):
            with self.subTest(key=key):
                old = copy.deepcopy(self.qa)
                self.qa[key] = value
                self.write_qa()
                with self.assertRaises(ValueError):
                    delivery.checked_inputs()
                self.qa = old
                self.write_qa()

    def test_stale_manifest_source_and_runtime(self):
        for path in (self.manifest_path, self.source_path, self.program_path, self.data_path):
            with self.subTest(path=path.name):
                before = path.read_bytes()
                path.write_bytes(before + b" ")
                with self.assertRaises(ValueError):
                    delivery.checked_inputs()
                path.write_bytes(before)

    def test_missing_stale_or_failed_presave_receipt(self):
        raw = self.receipt_path.read_bytes()
        self.receipt_path.unlink()
        with self.assertRaises((OSError, ValueError)):
            delivery.checked_inputs()
        self.receipt_path.write_bytes(raw)
        for key, value in (("gateScriptSha256", "0" * 64), ("status", "failed"),
                           ("authenticated", True), ("apiAction", "edit"),
                           ("runtimeManifestSha256", "0" * 64)):
            with self.subTest(key=key):
                receipt = json.loads(raw)
                receipt[key] = value
                self.receipt_path.write_bytes(encoded(receipt))
                # Update the QA hash so the actual pre-save semantic gate is reached.
                self.qa["presaveRoundtripSha256"] = digest(self.receipt_path.read_bytes())
                self.write_qa()
                with self.assertRaises(ValueError):
                    delivery.checked_inputs()
        self.receipt_path.write_bytes(raw)

    def test_stale_gate_script(self):
        self.gate_path.write_bytes(self.gate_path.read_bytes() + b"\n# Stale gate fixture.\n")
        with self.assertRaises(ValueError):
            delivery.checked_inputs()

    def test_missing_changed_or_unsafe_evidence(self):
        raw = self.proof_path.read_bytes()
        self.proof_path.unlink()
        with self.assertRaises((OSError, ValueError)):
            delivery.checked_inputs()
        self.proof_path.write_bytes(raw + b" ")
        with self.assertRaises(ValueError):
            delivery.checked_inputs()
        self.proof_path.write_bytes(raw)
        original = self.qa["evidencePins"]
        for value in ({}, {"../outside.json": pin(raw)}, {"/outside.json": pin(raw)}):
            with self.subTest(value=value):
                self.qa["evidencePins"] = value
                self.write_qa()
                with self.assertRaises(ValueError):
                    delivery.checked_inputs()
        self.qa["evidencePins"] = original
        self.write_qa()

    def test_changed_coverage_with_same_ids(self):
        altered = copy.deepcopy(self.coverage)
        altered["items"][0]["status"] = "changed after QA"
        self.coverage_path.write_bytes(encoded(altered))
        with self.assertRaises(ValueError):
            delivery.checked_inputs()

    def test_bad_choice_count_or_duplicate_ids(self):
        for items in (self.coverage["items"][:-1], [self.coverage["items"][0]] * 76):
            with self.subTest(count=len(items)):
                self.coverage_path.write_bytes(encoded({"items": items}))
                self.qa["coverageSha256"] = digest(self.coverage_path.read_bytes())
                self.write_qa()
                with self.assertRaises(ValueError):
                    delivery.checked_inputs()


if __name__ == "__main__":
    unittest.main()
