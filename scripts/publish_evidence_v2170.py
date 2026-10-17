"""Copy only explicit anonymous receipts bound to the final 2.17 release bytes.

QA_INPUTS.json is the receipt/provenance allowlist described by summarize_v2170.
The collector must reproduce QA_SUMMARY exactly. Browser bindings are copied
beside their original reports, preserving both hashes without rewriting status,
version fields, runtime identities or historical native results.
"""
from pathlib import Path
import hashlib
import json
import re
from summarize_v2170 import collect, validate_receipt, relative_file, BUNDLES

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/v2170'
OUT = ROOT / 'tests/evidence/2.17.0'
sha = lambda data: hashlib.sha256(data).hexdigest()


def portable(value):
    if isinstance(value, dict):
        for member in value.values():
            portable(member)
    elif isinstance(value, list):
        for member in value:
            portable(member)
    elif isinstance(value, str):
        assert not re.search(r'(^|[\s"\'])/(?:Users|private|tmp)/', value), 'A public receipt contains a machine-local path'


def main():
    qa = json.loads((ART / 'QA_SUMMARY.json').read_bytes())
    assert qa == collect() and qa['newFailures'] == 0, 'Final QA does not reproduce from the exact receipt allowlist'
    manifest_raw = (ROOT / 'tests/expected_release_v2170.json').read_bytes()
    manifest = json.loads(manifest_raw)
    assert qa['releaseManifestSha256'] == sha(manifest_raw)
    dist = ROOT / 'dist/2.17.0'
    documentation = json.loads((ART / 'documentation.json').read_bytes())
    validate_receipt(documentation, manifest, sha(manifest_raw), BUNDLES)
    assert len(documentation['documentationFiles']) == 8
    for name, pin in documentation['documentationFiles'].items():
        content = (ROOT / 'docs/2.17.0' / name).read_bytes()
        assert sha(content) == pin['sha256'] and len(content) == pin['bytes']
        assert (dist / name).read_bytes() == content
    index_raw = (dist / 'INICIO.html').read_bytes()
    assert documentation['indexSha256'] == sha(index_raw)
    index_manifest = json.loads((dist / 'MANIFESTO.json').read_bytes())
    assert index_manifest['version'] == '2.17.0' and index_manifest['indexSha256'] == sha(index_raw)
    assert index_manifest['sourceReleaseUnchanged'] is True and len(index_manifest['items']) == 5
    expected = {item['filename']: item for item in index_manifest['items']}
    for browser in ['chrome', 'firefox', 'safari']:
        row = json.loads((ART / 'index' / browser / 'copy_index.json').read_bytes())
        assert row['status'] == 'passed' and row['manifestSha256'] == sha(manifest_raw) and row['indexSha256'] == sha(index_raw)
        assert row['runnerSha256'] == sha((ROOT / 'tests/v217/index_probe.cjs').read_bytes())
        assert row['browser'] == browser and len(row['cases']) == 32 and all(case['passed'] for case in row['cases'])
        assert row.get('ownedSessionClosed') is True
        assert not any(row.get(key, 0) for key in ['wikipediaWrites', 'systemClipboardWrites', 'screenshots', 'externalRequests', 'nonGetRequests'])
        assert not any(row.get(key) for key in ['runnerError', 'cleanupError', 'captureError'])
        payloads = {item['filename']: item for item in row['payloads'].values()}
        assert set(payloads) == set(expected)
        for name, item in payloads.items():
            raw = (dist / name).read_bytes()
            assert len(raw) == item['bytes'] == expected[name]['bytes'] and sha(raw) == item['sha256'] == expected[name]['sha256']
    OUT.mkdir(parents=True, exist_ok=True)
    files, copied = [], {}

    def copy(source, destination, metadata=False):
        raw = source.read_bytes()
        assert not source.is_symlink()
        if source.suffix == '.json':
            row = json.loads(raw)
            assert metadata or row.get('status', 'passed') in ['passed', 'passed-with-preexisting-findings']
            assert row.get('wikipediaWrites', 0) == 0
            portable(row)
        if destination in copied:
            assert copied[destination] == sha(raw), 'Two different receipts share a public destination'
            return
        target = OUT / destination
        assert target.resolve().is_relative_to(OUT.resolve())
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
        copied[destination] = sha(raw)
        files.append({'source': str(source.relative_to(ROOT)), 'file': destination, 'bytes': len(raw), 'sha256': sha(raw)})

    def receipt_copy(record):
        source = relative_file(ROOT, record['file'])
        assert sha(source.read_bytes()) == record['sha256'], 'A validated receipt changed before publication'
        destination = 'reports/' + str(source.relative_to(ART)).replace('/', '__')
        copy(source, destination)

    copy(ROOT / 'tests/expected_release_v2170.json', 'runtime_manifest.json')
    for receipt in qa['receipts']:
        receipt_copy(receipt)
        for attachment in receipt.get('additionalEvidence', []):
            receipt_copy(attachment)
    for name in ['QA_SUMMARY.json', 'QA_INPUTS.json', 'documentation.json']:
        copy(ART / name, name)
    for item in qa['provenance']:
        source = relative_file(ROOT, item['file'])
        assert item.get('metadataOnly') is True and sha(source.read_bytes()) == item['sha256']
        copy(source, 'provenance/' + str(source.relative_to(ROOT)).replace('/', '__'), metadata=True)
    for browser in ['chrome', 'firefox', 'safari']:
        copy(ART / 'index' / browser / 'copy_index.json', 'packaging/index_' + browser + '.json')
    allowed = {row['file'] for row in files} | {'EVIDENCE_INDEX.json'}
    assert not any(path.is_symlink() for path in OUT.rglob('*'))
    assert {str(path.relative_to(OUT)) for path in OUT.rglob('*') if path.is_file()} <= allowed, 'Public evidence contains files outside its explicit allowlist'
    index = {'version': '2.17.0', 'status': qa['status'], 'releaseManifestSha256': qa['releaseManifestSha256'],
             'qaInputsSha256': qa['qaInputsSha256'], 'files': files, 'privateCorpusIncluded': False,
             'screenshotsIncluded': False, 'wikipediaWrites': 0}
    (OUT / 'EVIDENCE_INDEX.json').write_text(json.dumps(index, indent=2) + '\n')
    print(json.dumps({'version': '2.17.0', 'publicReceipts': len(files), 'privateCorpusIncluded': False}))


if __name__ == '__main__':
    main()
