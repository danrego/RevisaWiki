"""Fail-closed contracts for the isolated, pinned historical reconstruction.

Ordinary tests never invoke a compiler. Set REVISAWIKI_RECONSTRUCT_TEST_CACHE
to a real, independently reconstructed expanded baseline for cache-hit checks.
The slower reconstruction test additionally requires the explicit integration
opt-in and an existing exact local dependency installation; it installs nothing.
"""
from contextlib import contextmanager
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "revisawiki_reconstruct_v2220_test_subject",
    ROOT / "scripts/reconstruct_v2220_baseline.py",
)
baseline = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = baseline
SPEC.loader.exec_module(baseline)


class ReconstructionContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.verified = baseline.verify_inputs(ROOT)

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="revisawiki-baseline-test-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve() / "repository"
        self.root.mkdir()
        # Witness.relative is the logical build destination. Package witnesses
        # must instead remain under their actual versioned snapshot location.
        for witness in self.verified.witnesses:
            target = self.root / witness.source.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(witness.raw)
        self.current_package = b'{"version":"current-working-package-sentinel"}\n'
        (self.root / "package.json").write_bytes(self.current_package)
        (self.root / "package-lock.json").write_bytes(b'{"current":true}\n')
        self.cache = self.root / "artifacts/v2220/build/v2220_runtime.cjs.js"

    @contextmanager
    def changed(self, path, raw):
        path = self.root / path
        original = path.read_bytes()
        if raw is None:
            path.unlink()
        else:
            path.write_bytes(raw)
        try:
            yield path
        finally:
            path.write_bytes(original)

    def assert_input_refused(self):
        with patch.object(baseline.subprocess, "run") as run:
            with self.assertRaises(ValueError):
                baseline.ensure_baseline(self.root, node="missing-test-node", cache_path=self.cache)
            run.assert_not_called()
        self.assertFalse(self.cache.exists())

    def test_verified_tree_uses_snapshots_and_preserves_current_packages(self):
        inputs = baseline.verify_inputs(self.root)
        packages = {w.relative: w for w in inputs.witnesses if w.relative in {"package.json", "package-lock.json"}}
        self.assertEqual(set(packages), {"package.json", "package-lock.json"})
        for name, witness in packages.items():
            self.assertEqual(witness.source, self.root / "scripts/baselines/v2220" / name)
            self.assertEqual(baseline.pin(witness.raw), inputs.manifest["sourceInputs"][name])
            self.assertTrue(witness.stage)
        self.assertEqual((self.root / "package.json").read_bytes(), self.current_package)
        releases = [w for w in inputs.witnesses if w.relative.startswith("dist/2.22.0/")]
        self.assertEqual(len(releases), len(inputs.manifest["files"]))
        self.assertTrue(all(not w.stage for w in releases))

    def test_missing_and_mutant_package_snapshots_are_refused(self):
        for name in ["package.json", "package-lock.json"]:
            for raw in [None, b'{"version":"unverified"}\n']:
                with self.subTest(name=name, missing=raw is None):
                    with self.changed("scripts/baselines/v2220/" + name, raw):
                        self.assert_input_refused()

    def test_missing_and_mutant_historical_manifests_are_refused(self):
        for version in baseline.MANIFEST_PINS:
            name = "tests/expected_release_v" + version + ".json"
            for raw in [None, (self.root / name).read_bytes() + b"\n"]:
                with self.subTest(version=version, missing=raw is None):
                    with self.changed(name, raw):
                        self.assert_input_refused()

    def test_missing_or_changed_package_pins_are_refused(self):
        name = "tests/expected_release_v2220.json"
        original = json.loads((self.root / name).read_bytes())
        for package in ["package.json", "package-lock.json"]:
            for missing in [True, False]:
                manifest = copy.deepcopy(original)
                if missing:
                    del manifest["sourceInputs"][package]
                else:
                    manifest["sourceInputs"][package]["sha256"] = "0" * 64
                with self.subTest(package=package, missing=missing):
                    with self.changed(name, json.dumps(manifest).encode()):
                        self.assert_input_refused()

    def test_missing_and_mutant_source_or_release_inputs_are_refused(self):
        names = [
            next(w.relative for w in self.verified.witnesses if w.relative.startswith("src/")),
            "scripts/check_wiki_presave_v2212.py",
            next(w.relative for w in self.verified.witnesses if w.relative.startswith("dist/2.21.4/")),
            next(w.relative for w in self.verified.witnesses if w.relative.startswith("dist/2.21.7/")),
            next(w.relative for w in self.verified.witnesses if w.relative.startswith("dist/2.22.0/")),
        ]
        for name in names:
            original = (self.root / name).read_bytes()
            for raw in [None, original + b"\nchanged"]:
                with self.subTest(name=name, missing=raw is None):
                    with self.changed(name, raw):
                        self.assert_input_refused()

    def test_unverified_existing_cache_is_preserved(self):
        self.cache.parent.mkdir(parents=True)
        original = b"unverified expanded source; preserve this file\n"
        self.cache.write_bytes(original)
        with patch.object(baseline.subprocess, "run") as run:
            with self.assertRaisesRegex(ValueError, "Existing expanded cache differs"):
                baseline.ensure_baseline(self.root, cache_path=self.cache)
            run.assert_not_called()
        self.assertEqual(self.cache.read_bytes(), original)
        self.assertFalse((self.cache.parent / "reconstruction-attempts.private").exists())

    def test_source_and_historical_release_cache_targets_are_refused(self):
        for directory in ["src", "scripts", "tests", "dist", "dist/2.22.0"]:
            target = self.root / directory / "blocked-expanded-cache.js"
            target.parent.mkdir(parents=True, exist_ok=True)
            original = b"protected original\n"
            target.write_bytes(original)
            with self.subTest(directory=directory):
                with self.assertRaisesRegex(ValueError, "cannot replace a source or historical release"):
                    baseline.ensure_baseline(self.root, cache_path=target)
                self.assertEqual(target.read_bytes(), original)

    def test_cache_symlinks_are_refused_without_overwriting_target(self):
        destination = self.root / "outside-expanded.js"
        destination.write_bytes(b"preserve destination\n")
        self.cache.parent.mkdir(parents=True)
        self.cache.symlink_to(destination)
        with self.assertRaisesRegex(ValueError, "cannot follow a symbolic link"):
            baseline.ensure_baseline(self.root, cache_path=self.cache)
        self.assertTrue(self.cache.is_symlink())
        self.assertEqual(destination.read_bytes(), b"preserve destination\n")

    def test_current_package_cache_targets_are_refused_even_if_absent(self):
        for name in ["package.json", "package-lock.json"]:
            target = self.root / name
            original = target.read_bytes()
            with self.subTest(name=name, present=True):
                with self.assertRaisesRegex(ValueError, "cannot replace a current package"):
                    baseline.ensure_baseline(self.root, cache_path=target)
                self.assertEqual(target.read_bytes(), original)
            target.unlink()
            with self.subTest(name=name, present=False):
                with self.assertRaisesRegex(ValueError, "cannot replace a current package"):
                    baseline.ensure_baseline(self.root, cache_path=target)
                self.assertFalse(target.exists())
            target.write_bytes(original)

    def test_real_verified_cache_reuse_and_subsequent_mutation(self):
        supplied = os.environ.get("REVISAWIKI_RECONSTRUCT_TEST_CACHE")
        if not supplied:
            self.skipTest("Set REVISAWIKI_RECONSTRUCT_TEST_CACHE to the real pinned reconstructed baseline")
        raw = Path(supplied).read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), baseline.EXPANDED_SHA256)
        self.cache.parent.mkdir(parents=True)
        self.cache.write_bytes(raw)
        receipt = self.root / "cache-reuse-receipt.json"
        with patch.object(baseline.subprocess, "run") as run, patch.object(baseline.subprocess, "check_output") as check_output:
            result = baseline.ensure_baseline(self.root, node="missing-test-node", cache_path=self.cache, receipt_path=receipt)
            run.assert_not_called()
            check_output.assert_not_called()
        self.assertEqual(result, self.cache)
        self.assertEqual(self.cache.read_bytes(), raw)
        evidence = json.loads(receipt.read_bytes())
        self.assertTrue(evidence["cacheHit"])
        self.assertEqual(evidence["status"], "passed")
        self.assertEqual(evidence["expandedSha256"], baseline.EXPANDED_SHA256)
        self.assertEqual(evidence["manifestSha256"], baseline.MANIFEST_PINS["2220"])
        self.assertEqual(evidence["filesVerified"], len(self.verified.manifest["files"]))
        self.assertEqual(evidence["inputPinsVerified"], len(self.verified.witnesses))
        self.assertFalse(evidence["historicalWorkingFilesModified"])
        self.assertEqual((self.root / "package.json").read_bytes(), self.current_package)
        self.assertFalse((self.cache.parent / "reconstruction-attempts.private").exists())
        # A valid cache does not bypass a fresh check of any historical input.
        source = next(w.relative for w in self.verified.witnesses if w.relative.startswith("src/"))
        with self.changed(source, (self.root / source).read_bytes() + b"\nchanged"):
            with self.assertRaisesRegex(ValueError, "Historical pin mismatch"):
                baseline.ensure_baseline(self.root, cache_path=self.cache)
        self.assertEqual(self.cache.read_bytes(), raw)
        mutant = raw + b"\nchanged"
        self.cache.write_bytes(mutant)
        with self.assertRaisesRegex(ValueError, "Existing expanded cache differs"):
            baseline.ensure_baseline(self.root, cache_path=self.cache)
        self.assertEqual(self.cache.read_bytes(), mutant)

    def test_real_isolated_reconstruction_when_explicitly_enabled(self):
        if os.environ.get("REVISAWIKI_RECONSTRUCT_INTEGRATION") != "1":
            self.skipTest("Full real reconstruction requires REVISAWIKI_RECONSTRUCT_INTEGRATION=1")
        dependencies = os.environ.get("REVISAWIKI_RECONSTRUCT_TEST_NODE_MODULES")
        self.assertTrue(dependencies, "The integration test requires an explicit existing historical dependency installation")
        before = {w.source.relative_to(ROOT): hashlib.sha256((self.root / w.source.relative_to(ROOT)).read_bytes()).hexdigest() for w in self.verified.witnesses}
        receipt = self.root / "reconstruction-receipt.json"
        result = baseline.ensure_baseline(self.root, node=os.environ.get("REVISAWIKI_NODE"), cache_path=self.cache, node_modules=Path(dependencies), receipt_path=receipt)
        self.assertEqual(hashlib.sha256(result.read_bytes()).hexdigest(), baseline.EXPANDED_SHA256)
        evidence = json.loads(receipt.read_bytes())
        self.assertEqual(evidence["status"], "passed")
        self.assertTrue(evidence["manifestsByteIdentical"])
        self.assertFalse(evidence["gitUsed"])
        self.assertEqual(evidence["networkRequests"], 0)
        self.assertEqual(evidence["filesVerified"], len(self.verified.manifest["files"]))
        for relative, expected in before.items():
            self.assertEqual(hashlib.sha256((self.root / relative).read_bytes()).hexdigest(), expected, str(relative))
        self.assertEqual((self.root / "package.json").read_bytes(), self.current_package)


class DependencyContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.lock = baseline.verify_inputs(ROOT).package_lock

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="revisawiki-dependency-test-")
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.installed = {"lockfileVersion": 3, "packages": copy.deepcopy(self.lock["packages"])}
        self.receipt = self.directory / ".package-lock.json"
        self.write_receipt()
        # Metadata-only fixtures test dependency verification; no compiler or
        # package implementation is fabricated, loaded or executed.
        for name, expected in self.lock["packages"].items():
            if name:
                target = self.directory / name.removeprefix("node_modules/") / "package.json"
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(json.dumps({"version": expected["version"]}))

    def write_receipt(self):
        self.receipt.write_text(json.dumps(self.installed))

    def test_exact_locked_local_package_metadata_is_accepted(self):
        checked = baseline.verify_dependencies(self.directory, self.lock)
        self.assertEqual(set(checked), set(self.lock["packages"]) - {""})
        self.assertEqual(checked["node_modules/terser"]["version"], self.lock["packages"]["node_modules/terser"]["version"])

    def test_unrelated_extra_packages_do_not_replace_locked_dependencies(self):
        self.installed["packages"]["node_modules/unrelated-test-tool"] = {"version": "1.0.0"}
        self.write_receipt()
        checked = baseline.verify_dependencies(self.directory, self.lock)
        self.assertNotIn("node_modules/unrelated-test-tool", checked)
        self.assertEqual(set(checked), set(self.lock["packages"]) - {""})

    def test_missing_install_receipt_is_refused(self):
        self.receipt.unlink()
        with self.assertRaises(ValueError):
            baseline.verify_dependencies(self.directory, self.lock)

    def test_missing_or_changed_locked_package_is_refused(self):
        for name in ["@babel/parser", "terser"]:
            target = self.directory / name / "package.json"
            original = target.read_bytes()
            for mutant in [None, b'{"version":"0.0.0-unverified"}']:
                with self.subTest(name=name, missing=mutant is None):
                    if mutant is None:
                        target.unlink()
                    else:
                        target.write_bytes(mutant)
                    try:
                        with self.assertRaises(ValueError):
                            baseline.verify_dependencies(self.directory, self.lock)
                    finally:
                        target.write_bytes(original)

    def test_missing_or_mutant_locked_dependency_receipt_is_refused(self):
        for name in ["node_modules/@babel/parser", "node_modules/terser"]:
            original = copy.deepcopy(self.installed["packages"][name])
            for field in [None, "version", "resolved", "integrity"]:
                with self.subTest(name=name, field=field):
                    if field is None:
                        del self.installed["packages"][name]
                    else:
                        self.installed["packages"][name][field] = "unverified"
                    self.write_receipt()
                    try:
                        with self.assertRaises(ValueError):
                            baseline.verify_dependencies(self.directory, self.lock)
                    finally:
                        self.installed["packages"][name] = copy.deepcopy(original)
                        self.write_receipt()

    def test_unknown_or_missing_lock_is_refused(self):
        variants = [{}, {"lockfileVersion": 3, "packages": {}}, {"lockfileVersion": 2, "packages": self.lock["packages"]}]
        for location in ["unknown/package", "node_modules/../outside"]:
            mutant = copy.deepcopy(self.lock)
            mutant["packages"][location] = {"version": "1.0.0"}
            variants.append(mutant)
        unknown = copy.deepcopy(self.lock)
        unknown["packages"]["node_modules/unknown-required-package"] = {"version": "1.0.0", "resolved": "https://example.invalid/package", "integrity": "sha512-unverified"}
        variants.append(unknown)
        for index, lock in enumerate(variants):
            with self.subTest(variant=index):
                with self.assertRaises(ValueError):
                    baseline.verify_dependencies(self.directory, lock)


if __name__ == "__main__":
    unittest.main()
