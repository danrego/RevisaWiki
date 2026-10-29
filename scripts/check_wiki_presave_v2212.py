"""Verify installable data through the read-only MediaWiki pre-save API.

Only JSON inside the fixed data wrapper is decoded. Returned JavaScript is
never executed. A passing receipt is tied to the exact package and this gate.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import urllib.parse

ROOT = Path(__file__).resolve().parents[1]
ENDPOINT = "https://pt.wikipedia.org/w/api.php"
VERSION = "2.21.2"
BASELINE_VERSION = "2.21.1"
BASELINE_REVISION = "2.21.1-installation.1"
BASELINE_DATA_NAME = "RevisaWiki_v2_21_1_dados.js"
REVISION = "2.21.2"
DATA_NAME = "RevisaWiki_v2_21_2_dados.js"
BASELINE_MANIFEST = ROOT / "tests/expected_release_v2211_installation1.json"
BASELINE_DATA = ROOT / "dist/2.21.1-installation.1" / BASELINE_DATA_NAME
PREFIX = '/* RevisaWiki 2.21.2, dados. CC BY-SA 4.0. */\n(function(root){const data='
SUFFIX = ';if(typeof module === "object" && module.exports) module.exports=data;else root.RevisaWikiDataV2=data;})(typeof globalThis !== "undefined" ? globalThis : this);'
BASELINE_PREFIX = PREFIX.replace("2.21.2", "2.21.1")
MAX_DATA_BYTES = 2_097_152
MAX_RESPONSE_BYTES = 12 * 1024 * 1024


class GateError(ValueError):
    """An input, response or receipt failed an explicit release condition."""


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _pairs(rows):
    result = {}
    for key, value in rows:
        if key in result:
            raise GateError("duplicate-json-key")
        result[key] = value
    return result


def _bad_constant(_):
    raise GateError("non-finite-json-number")


def strict_json(raw):
    try:
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8", errors="strict")
        return json.loads(raw, object_pairs_hook=_pairs, parse_constant=_bad_constant)
    except (UnicodeError, json.JSONDecodeError, TypeError) as error:
        raise GateError("invalid-json") from error


def _json_string(value: str) -> str:
    # JSON.stringify escapes lone UTF-16 surrogates, while leaving other
    # non-ASCII text literal. Python's ensure_ascii option alone differs.
    encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return "".join(f"\\u{ord(c):04x}" if 0xD800 <= ord(c) <= 0xDFFF else c for c in encoded)


def canonical(value) -> str:
    """Match the runtime's recursive Object.keys().sort()/JSON.stringify.

    The catalogue contains safe integers, not floating-point values. Reject
    unsupported numeric representations instead of guessing their JS spelling.
    """
    if value is None:
        return "null"
    if type(value) is bool:
        return "true" if value else "false"
    if type(value) is int:
        if abs(value) > 9_007_199_254_740_991:
            raise GateError("unsafe-json-integer")
        return str(value)
    if isinstance(value, str):
        return _json_string(value)
    if isinstance(value, list):
        return "[" + ",".join(canonical(v) for v in value) + "]"
    if isinstance(value, dict):
        if not all(isinstance(k, str) for k in value):
            raise GateError("non-string-json-key")
        keys = sorted(value, key=lambda key: key.encode("utf-16-be", "surrogatepass"))
        return "{" + ",".join(_json_string(k) + ":" + canonical(value[k]) for k in keys) + "}"
    raise GateError("unsupported-json-value")


def decode_data_source(raw: bytes, *, version=VERSION, prefix=PREFIX):
    """Decode the pinned wrapper without evaluating JavaScript."""
    try:
        text = raw.decode("utf-8", errors="strict")
    except UnicodeError as error:
        raise GateError("invalid-source-utf8") from error
    bare = text.removesuffix("\n")
    if not bare.startswith(prefix) or not bare.endswith(SUFFIX):
        raise GateError("unexpected-data-wrapper")
    data = strict_json(bare[len(prefix):-len(SUFFIX)])
    if not isinstance(data, dict) or data.get("version") != version or type(data.get("schema")) is not int or data["schema"] != 1 or not isinstance(data.get("packed"), dict):
        raise GateError("unexpected-data-shape")
    canonical(data)  # Reject types the runtime hash cannot safely represent here.
    return data


def _read_json_file(path):
    try:
        return strict_json(Path(path).read_bytes())
    except OSError as error:
        raise GateError("missing-input-file") from error


def _check_file_pin(raw: bytes, pin):
    if not isinstance(pin, dict) or pin.get("bytes") != len(raw) or pin.get("sha256") != sha(raw):
        raise GateError("input-file-pin-mismatch")


def inspect_inputs(manifest_path, data_path, baseline_manifest_path=None, baseline_data_path=None):
    manifest_path, data_path = Path(manifest_path), Path(data_path)
    baseline_manifest_path = Path(baseline_manifest_path or BASELINE_MANIFEST)
    baseline_data_path = Path(baseline_data_path or BASELINE_DATA)
    manifest_raw, baseline_raw = manifest_path.read_bytes(), baseline_manifest_path.read_bytes()
    manifest, baseline = strict_json(manifest_raw), strict_json(baseline_raw)
    if not isinstance(manifest, dict) or not isinstance(baseline, dict):
        raise GateError("invalid-manifest-shape")
    if manifest.get("version") != VERSION or manifest.get("distributionRevision") != REVISION:
        raise GateError("wrong-distribution-manifest")
    if baseline.get("version") != BASELINE_VERSION or baseline.get("distributionRevision") != BASELINE_REVISION:
        raise GateError("wrong-baseline-manifest")
    raw, original_raw = data_path.read_bytes(), baseline_data_path.read_bytes()
    _check_file_pin(raw, manifest.get("files", {}).get(DATA_NAME))
    _check_file_pin(original_raw, baseline.get("files", {}).get(BASELINE_DATA_NAME))
    if len(raw) > MAX_DATA_BYTES:
        raise GateError("data-page-too-large")
    data = decode_data_source(raw)
    original = decode_data_source(original_raw, version=BASELINE_VERSION, prefix=BASELINE_PREFIX)
    expected_extension_path=ROOT / "tests/expected_v2212_literals.json"
    extension=_read_json_file(expected_extension_path)
    expected={**original,"version":VERSION,"packed":{**original["packed"],"support2212":extension}}
    packed_hash=sha(canonical(data["packed"]).encode("utf-8"))
    old_hash=sha(canonical(original["packed"]).encode("utf-8"))
    extension_hash=sha(canonical(extension).encode("utf-8"))
    if (canonical(data)!=canonical(expected) or old_hash!=baseline.get("packedCatalogSha256")
        or old_hash!=manifest.get("basePackedCatalogSha256")
        or packed_hash!=manifest.get("packedCatalogSha256")
        or extension_hash!=manifest.get("addedSupport2212Sha256")):
        raise GateError("catalogue-not-equal-to-frozen-baseline-and-release-extension")
    return {
        "manifest": manifest,
        "raw": raw,
        "data": data,
        "runtimeManifestSha256": sha(manifest_raw),
        "baselineManifestSha256": sha(baseline_raw),
        "canonicalPackedSha256": packed_hash,
        "inputData": {"file": DATA_NAME, "bytes": len(raw), "sha256": sha(raw)},
    }


def request_presave(raw: bytes):
    """POST only action=parse/onlypst; no login, token, cookie or write API."""
    form = {
        "action": "parse", "format": "json", "formatversion": "2",
        "contentmodel": "javascript", "title": "MediaWiki:RevisaWiki-fixture.js",
        "onlypst": "1", "prop": "wikitext", "text": raw.decode("utf-8"),
    }
    body = urllib.parse.urlencode(form).encode("ascii")
    command = [
        "curl", "--disable", "--silent", "--show-error", "--fail-with-body",
        "--proto", "=https", "--proto-redir", "=https", "--max-redirs", "0",
        "--max-time", "60", "--connect-timeout", "15",
        "--header", "Content-Type: application/x-www-form-urlencoded; charset=UTF-8",
        "--data-binary", "@-", ENDPOINT,
    ]
    try:
        result = subprocess.run(command, input=body, capture_output=True, timeout=65, check=False)
    except (OSError, subprocess.TimeoutExpired) as error:
        raise GateError("native-api-unavailable") from error
    if result.returncode:
        raise GateError("native-api-request-failed")
    if len(result.stdout) > MAX_RESPONSE_BYTES:
        raise GateError("native-api-response-too-large")
    response = strict_json(result.stdout)
    if not isinstance(response, dict) or response.get("error") or response.get("warnings"):
        raise GateError("native-api-error-or-warning")
    parsed = response.get("parse")
    if not isinstance(parsed, dict) or not isinstance(parsed.get("text"), str):
        raise GateError("missing-native-transformed-source")
    # parse.wikitext is the normalized pre-input, not the expanded result.
    try:
        return parsed["text"].encode("utf-8", errors="strict")
    except UnicodeError as error:
        raise GateError("invalid-native-transformed-utf8") from error


def check_presave(manifest_path, data_path, *, baseline_manifest_path=None, baseline_data_path=None):
    inspected = inspect_inputs(manifest_path, data_path, baseline_manifest_path, baseline_data_path)
    after = request_presave(inspected["raw"])
    raw = inspected["raw"]
    if after != raw and not (raw.endswith(b"\n") and after == raw[:-1]):
        raise GateError("native-pre-save-changed-source")
    decoded = decode_data_source(after)
    if canonical(decoded) != canonical(inspected["data"]):
        raise GateError("native-pre-save-changed-data")
    return {
        "kind": "native-pre-save-release-gate", "status": "passed",
        "version": VERSION, "distributionRevision": REVISION,
        "runtimeManifestSha256": inspected["runtimeManifestSha256"],
        "baselineManifestSha256": inspected["baselineManifestSha256"],
        "inputData": inspected["inputData"],
        "afterPresaveData": {"bytes": len(after), "sha256": sha(after)},
        "canonicalPackedSha256": inspected["canonicalPackedSha256"],
        "sourcePreservedExceptTerminalNewline": True,
        "decodedDataPreserved": True, "expectedCataloguePreserved": True,
        "endpoint": ENDPOINT, "apiAction": "parse", "onlypst": True,
        "authenticated": False, "wikipediaWrites": 0,
        "gateScriptSha256": sha(Path(__file__).read_bytes()),
    }


def validate_receipt(receipt, manifest_path, data_path, baseline_manifest_path=None):
    """Reject missing, failed or stale receipts before package generation."""
    if not isinstance(receipt, dict):
        raise GateError("missing-native-presave-receipt")
    inspected = inspect_inputs(manifest_path, data_path, baseline_manifest_path)
    required = {
        "kind": "native-pre-save-release-gate", "status": "passed",
        "version": VERSION, "distributionRevision": REVISION,
        "runtimeManifestSha256": inspected["runtimeManifestSha256"],
        "baselineManifestSha256": inspected["baselineManifestSha256"],
        "inputData": inspected["inputData"],
        "canonicalPackedSha256": inspected["canonicalPackedSha256"],
        "sourcePreservedExceptTerminalNewline": True,
        "decodedDataPreserved": True, "expectedCataloguePreserved": True,
        "endpoint": ENDPOINT, "apiAction": "parse", "onlypst": True,
        "authenticated": False, "wikipediaWrites": 0,
        "gateScriptSha256": sha(Path(__file__).read_bytes()),
    }
    for key, expected in required.items():
        if canonical(receipt.get(key)) != canonical(expected):
            raise GateError("stale-or-invalid-native-presave-receipt:" + key)
    after_pin = receipt.get("afterPresaveData")
    candidates = [inspected["raw"]]
    if inspected["raw"].endswith(b"\n"):
        candidates.append(inspected["raw"][:-1])
    if not any(after_pin == {"bytes": len(raw), "sha256": sha(raw)} for raw in candidates):
        raise GateError("invalid-after-presave-data-pin")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--check-receipt", action="store_true")
    args = parser.parse_args(argv)
    try:
        if args.check_receipt:
            validate_receipt(_read_json_file(args.receipt), args.manifest, args.data)
            print(json.dumps({"status": "passed", "mode": "receipt-current", "wikipediaWrites": 0}))
            return 0
        if args.receipt.exists():
            raise GateError("receipt-already-exists-use-a-new-attempt-path")
        receipt = check_presave(args.manifest, args.data)
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(receipt, ensure_ascii=False))
        return 0
    except (GateError, OSError) as error:
        print(json.dumps({"status": "failed", "reason": str(error) if isinstance(error, GateError) else "missing-input-file", "wikipediaWrites": 0}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
