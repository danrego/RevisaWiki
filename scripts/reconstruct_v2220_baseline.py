"""Reproduce the released 2.22.0 expanded input in an isolated local tree.

No Git, npm, network request, or historical working-file mutation is used.
The current package files are never substituted in the repository itself.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import tempfile
import uuid

ROOT = Path(__file__).resolve().parents[1]
EXPANDED_SHA256 = "fad84a53b4c5a96f923fddcf2fee3f32232910a0ee7a037265a7f4282191f4aa"
MANIFEST_PINS = {
    "2214": "611ee7e18cdcdb5106991fa4098693de19efc7eec133ea96b0cb0bf77da23218",
    "2215": "58dfc891536a83e6e3e9869de558ff846104d4d6531a13f25026e7e9137bf2c3",
    "2216": "de5da4750f5385d6de7ef400cb2ad75bd5ebaabce520af1cae3f25bb6624a1f0",
    "2217": "b5b4e8fa25db9cc312df2bde27a4e889eea23bfc1474331dd7c99f79f1fb573a",
    "2220": "6ad4db0c74affbd1cb5e42aa659d5ac21497c7d2294f9805f07d79aa7a2406dc",
}
# This imported serialization reader was not enumerated by the old build.
# Its exact published-era body is pinned here rather than trusted implicitly.
SUPPLEMENTAL_PINS = {
    "scripts/check_wiki_presave_v2212.py": {
        "bytes": 13071,
        "sha256": "4056fc703f6fdcbae666ab7b0ed1add2634882f889c3f2ddc99beb94d7716a71",
    },
}


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def pin(raw: bytes) -> dict:
    return {"bytes": len(raw), "sha256": digest(raw)}


def _relative(name: str) -> Path:
    if not isinstance(name, str):
        raise ValueError("Unsafe historical input name")
    value = PurePosixPath(name)
    if value.is_absolute() or ".." in value.parts or not value.parts or "\\" in name or "\0" in name:
        raise ValueError("Unsafe historical input name")
    return Path(*value.parts)


def _regular(path: Path) -> bytes:
    if path.is_symlink() or not path.is_file():
        raise ValueError("Missing or unsupported historical input: " + str(path))
    return path.read_bytes()


@dataclass(frozen=True)
class Witness:
    source: Path
    relative: str
    raw: bytes
    stage: bool = True


@dataclass(frozen=True)
class Inputs:
    root: Path
    manifest: dict
    manifest_raw: bytes
    witnesses: tuple[Witness, ...]
    package_lock: dict


def verify_inputs(root: Path = ROOT) -> Inputs:
    """Read only explicitly pinned history, with versioned package snapshots."""
    root = Path(root).resolve()
    manifests, raws, records = {}, {}, {}

    def capture(source: Path, relative: str, expected: dict, stage: bool = True):
        relative_path = _relative(relative)
        for count in range(1, len(relative_path.parts) + 1):
            if root.joinpath(*relative_path.parts[:count]).is_symlink() and source == root / relative_path:
                raise ValueError("A historical input ancestor is a symbolic link: " + relative)
        raw = _regular(source)
        if pin(raw) != expected:
            raise ValueError("Historical pin mismatch: " + relative)
        previous = records.get(relative)
        if previous and previous.raw != raw:
            raise ValueError("Conflicting historical input pins: " + relative)
        records[relative] = Witness(source, relative, raw, stage or bool(previous and previous.stage))
        return raw

    for version, expected_hash in MANIFEST_PINS.items():
        name = f"tests/expected_release_v{version}.json"
        raw = _regular(root / name)
        if digest(raw) != expected_hash:
            raise ValueError("Historical manifest pin mismatch: " + version)
        value = json.loads(raw)
        expected_version = "2.22.0" if version == "2220" else "2.21." + version[-1]
        if value.get("version") != expected_version:
            raise ValueError("Historical manifest version mismatch")
        manifests[version], raws[version] = value, raw
        capture(root / name, name, pin(raw))
    manifest = manifests["2220"]
    if manifest.get("factory", {}).get("baselineSha256") != EXPANDED_SHA256:
        raise ValueError("The released expanded-source pin is missing")
    if manifest.get("baseManifestSha256") != MANIFEST_PINS["2217"]:
        raise ValueError("The historical baseline chain changed")

    for version in ["2215", "2216", "2217", "2220"]:
        for name, expected in manifests[version]["sourceInputs"].items():
            if name in {"package.json", "package-lock.json"}:
                continue
            capture(root / _relative(name), name, expected)
    for name, expected in SUPPLEMENTAL_PINS.items():
        capture(root / name, name, expected)
    for name in ["package.json", "package-lock.json"]:
        expected = manifest["sourceInputs"].get(name)
        if not expected:
            raise ValueError("The historical package pin is missing: " + name)
        capture(root / "scripts/baselines/v2220" / name, name, expected)

    # Only these distributions are read by the isolated reconstruction chain.
    for version in ["2214", "2217"]:
        release = "2.21." + version[-1]
        for name, expected in manifests[version]["files"].items():
            if version == "2214" and name != "RevisaWiki_v2_21_4.js":
                continue
            relative = "dist/" + release + "/" + name
            capture(root / _relative(relative), relative, expected)
    # All nine released 2.22.0 outputs must also still match before cache reuse.
    for name, expected in manifest["files"].items():
        relative = "dist/2.22.0/" + name
        capture(root / _relative(relative), relative, expected, stage=False)
    return Inputs(root, manifest, raws["2220"], tuple(records[name] for name in sorted(records)), json.loads(records["package-lock.json"].raw))


def verify_dependencies(directory: Path, package_lock: dict) -> dict:
    """Require the installed local packages and install receipt to match the lock."""
    directory = Path(directory).resolve()
    installed = json.loads(_regular(directory / ".package-lock.json"))
    expected_packages = package_lock.get("packages", {})
    if not expected_packages or package_lock.get("lockfileVersion") != 3:
        raise ValueError("A fixed historical dependency lock is required")
    checked = {}
    for name, expected in expected_packages.items():
        if not name:
            continue
        if not name.startswith("node_modules/") or ".." in PurePosixPath(name).parts:
            raise ValueError("Unsupported locked dependency location")
        relative = name[len("node_modules/"):]
        metadata = json.loads(_regular(directory / relative / "package.json"))
        recorded = installed.get("packages", {}).get(name, {})
        if metadata.get("version") != expected.get("version") or any(recorded.get(key) != expected.get(key) for key in ["version", "resolved", "integrity"]):
            raise ValueError("Local dependency differs from the historical lock: " + name)
        checked[name] = {key: expected[key] for key in ["version", "resolved", "integrity"] if key in expected}
    return checked


def _dependency_path(root: Path, explicit: Path | None) -> Path:
    if explicit is not None:
        return Path(explicit)
    if os.environ.get("REVISAWIKI_NODE_MODULES"):
        return Path(os.environ["REVISAWIKI_NODE_MODULES"])
    local = root / "node_modules"
    if local.exists():
        return local
    for value in os.environ.get("NODE_PATH", "").split(os.pathsep):
        if value and Path(value).is_dir():
            return Path(value)
    raise ValueError("Fixed local dependencies are missing; install the locked package dependencies first")


def _cache_path(root: Path, path: Path | None) -> Path:
    cache = Path(path or root / "artifacts/v2220/build/v2220_runtime.cjs.js").absolute()
    if cache.resolve() in {(root / name).resolve() for name in ["package.json", "package-lock.json"]}:
        raise ValueError("The expanded cache cannot replace a current package file")
    for protected in [root / name for name in ["src", "scripts", "tests", "dist"]]:
        if cache.resolve().is_relative_to(protected.resolve()):
            raise ValueError("The expanded cache cannot replace a source or historical release file")
    for ancestor in [cache, *cache.parents]:
        if ancestor.is_symlink():
            raise ValueError("An expanded cache path cannot follow a symbolic link")
    return cache


def _verify_witnesses(inputs: Inputs):
    for witness in inputs.witnesses:
        if _regular(witness.source) != witness.raw:
            raise ValueError("A historical input changed during reconstruction: " + witness.relative)


def ensure_baseline(root: Path = ROOT, node: str | None = None, cache_path: Path | None = None,
                    node_modules: Path | None = None, receipt_path: Path | None = None) -> Path:
    """Return only an exactly pinned cached or reconstructed expanded baseline."""
    if not __debug__:
        raise ValueError("Historical builders require enabled Python assertions")
    inputs = verify_inputs(root)
    cache = _cache_path(inputs.root, cache_path)
    if cache.exists():
        if digest(_regular(cache)) != EXPANDED_SHA256:
            raise ValueError("Existing expanded cache differs from the release pin; it was preserved")
        if receipt_path is not None:
            receipt_path = Path(receipt_path)
            receipt_path.parent.mkdir(parents=True, exist_ok=True)
            with receipt_path.open("x") as output:
                json.dump({"kind": "pinned-v2220-expanded-cache-reuse", "status": "passed", "cacheHit": True,
                           "manifestSha256": MANIFEST_PINS["2220"], "expandedSha256": EXPANDED_SHA256,
                           "inputPinsVerified": len(inputs.witnesses), "filesVerified": len(inputs.manifest["files"]),
                           "historicalWorkingFilesModified": False, "networkRequests": 0, "wikipediaWrites": 0}, output, indent=2)
                output.write("\n")
        return cache
    executable = node or os.environ.get("REVISAWIKI_NODE") or shutil.which("node")
    if not executable:
        raise ValueError("A local JavaScript runtime is required")
    executable = shutil.which(str(executable))
    if not executable:
        raise ValueError("The selected local JavaScript runtime does not exist")
    executable = str(Path(executable).resolve())
    node_version = subprocess.check_output([executable, "--version"], text=True).strip()
    if not node_version.startswith("v") or not node_version.split(".")[0][1:].isdigit() or int(node_version.split(".")[0][1:]) < 24:
        raise ValueError("The pinned historical build requires Node.js 24 or later")
    dependencies = _dependency_path(inputs.root, node_modules)
    dependency_pins = verify_dependencies(dependencies, inputs.package_lock)
    cache.parent.mkdir(parents=True, exist_ok=True)
    attempts = cache.parent / "reconstruction-attempts.private"
    attempts.mkdir(exist_ok=True)
    attempt = attempts / ("attempt-" + uuid.uuid4().hex)
    attempt.mkdir()
    tree = attempt / "tree"
    tree.mkdir()
    report = {"kind": "isolated-pinned-v2220-baseline-reconstruction", "status": "running",
              "manifestSha256": MANIFEST_PINS["2220"], "expandedSha256": EXPANDED_SHA256,
              "inputPins": {w.relative: pin(w.raw) for w in inputs.witnesses},
              "dependencies": dependency_pins, "nodeVersion": node_version, "gitUsed": False, "networkRequests": 0,
              "historicalWorkingFilesModified": False, "wikipediaWrites": 0}
    try:
        for witness in inputs.witnesses:
            if witness.stage:
                target = tree / _relative(witness.relative)
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(witness.raw)
        (tree / "node_modules").symlink_to(dependencies.resolve(), target_is_directory=True)
        environment = {**os.environ, "NODE_PATH": str(dependencies.resolve()), "REVISAWIKI_NODE": str(executable)}
        with (attempt / "build.stdout.private.log").open("xb") as stdout, (attempt / "build.stderr.private.log").open("xb") as stderr:
            result = subprocess.run([sys.executable, "scripts/build_v2220.py", "--node", str(executable)], cwd=tree, env=environment, stdout=stdout, stderr=stderr)
        report["exitCode"] = result.returncode
        if result.returncode:
            raise ValueError("Isolated historical build failed; its private logs and tree were preserved")
        for name, expected in inputs.manifest["files"].items():
            if pin(_regular(tree / "dist/2.22.0" / _relative(name))) != expected:
                raise ValueError("Reconstructed release output differs: " + name)
        for name in ["tests/expected_release_v2220.json", "dist/2.22.0/MANIFESTO_RUNTIME.json"]:
            if _regular(tree / name) != inputs.manifest_raw:
                raise ValueError("The reconstructed manifest is not byte-identical: " + name)
        expanded = _regular(tree / "artifacts/v2220/build/v2220_runtime.cjs.js")
        if digest(expanded) != EXPANDED_SHA256:
            raise ValueError("The reconstructed expanded source differs from the release factory pin")
        verify_dependencies(dependencies, inputs.package_lock)
        _verify_witnesses(inputs)
        temporary = cache.parent / (".baseline-" + uuid.uuid4().hex)
        try:
            with temporary.open("xb") as stream:
                stream.write(expanded)
                stream.flush()
                os.fsync(stream.fileno())
            try:
                os.link(temporary, cache)
            except FileExistsError:
                if digest(_regular(cache)) != EXPANDED_SHA256:
                    raise ValueError("A conflicting cache appeared; it was preserved")
        finally:
            temporary.unlink(missing_ok=True)
        report.update(status="passed", filesVerified=len(inputs.manifest["files"]), manifestsByteIdentical=True,
                      cachePin=pin(_regular(cache)), cache=str(cache))
        shutil.rmtree(tree)
    except Exception as error:
        report.update(status="failed", error=str(error), isolatedTreePreserved=tree.exists())
        raise
    finally:
        encoded = (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode()
        (attempt / "RECONSTRUCTION.private.json").write_bytes(encoded)
        if receipt_path is not None:
            receipt_path = Path(receipt_path)
            receipt_path.parent.mkdir(parents=True, exist_ok=True)
            with receipt_path.open("xb") as output:
                output.write(encoded)
    return cache


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--node")
    parser.add_argument("--node-modules", type=Path)
    parser.add_argument("--cache", type=Path)
    parser.add_argument("--receipt", type=Path)
    args = parser.parse_args()
    cache = ensure_baseline(args.root, args.node, args.cache, args.node_modules, args.receipt)
    print(json.dumps({"version": "2.22.0", "cache": str(cache), "sha256": digest(cache.read_bytes()), "verified": True}))


if __name__ == "__main__":
    main()
