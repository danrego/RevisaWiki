"""Copy the explicit anonymous release receipts, without the private corpus."""
from pathlib import Path
import hashlib
import json
from summarize_v2151 import collect, validate_receipt, BUNDLES

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/v2151'
OUT = ROOT / 'tests/evidence/2.15.1'
OUT.mkdir(parents=True, exist_ok=True)
sha = lambda value: hashlib.sha256(value).hexdigest()
qa = json.loads((ART / 'QA_SUMMARY.json').read_text())
assert qa['status'] in ['passed', 'passed-with-preexisting-findings'] and qa['newFailures'] == 0
assert qa == collect(), 'The completed QA summary must still match every current receipt'
manifest_bytes = (ROOT / 'tests/expected_release_v2151.json').read_bytes()
manifest = json.loads(manifest_bytes)
manifest_sha = sha(manifest_bytes)
assert qa['releaseManifestSha256'] == manifest_sha and qa['frozenFiles'] == manifest['files']
dist = ROOT / 'dist/2.15.1'
documentation = json.loads((ART / 'documentation.json').read_text())
validate_receipt(documentation, manifest, manifest_sha, BUNDLES)
docs = ROOT / 'docs/2.15.1'
assert set(documentation['documentationFiles']) == {path.name for path in docs.iterdir() if path.is_file()}
for name, expected in documentation['documentationFiles'].items():
    content = (docs / name).read_bytes()
    assert len(content) == expected['bytes'] and sha(content) == expected['sha256']
    assert (dist / name).read_bytes() == content
validate_receipt(json.loads((ART / 'original_case.json').read_text()), manifest, manifest_sha, BUNDLES)
index_sha = sha((dist / 'INICIO.html').read_bytes())
assert documentation['indexSha256'] == index_sha
index_manifest = json.loads((dist / 'MANIFESTO.json').read_text())
assert index_manifest['version'] == '2.15.1' and index_manifest['indexSha256'] == index_sha
assert len(index_manifest['items']) == 5 and index_manifest['sourceReleaseUnchanged'] is True
expected_payloads = {item['filename']: item for item in index_manifest['items']}
for browser in ['chrome', 'firefox', 'safari']:
    row = json.loads((ART / 'index' / browser / 'copy_index.json').read_text())
    assert row['status'] == 'passed' and row['manifestSha256'] == manifest_sha and row['indexSha256'] == index_sha
    assert row['runnerSha256'] == sha((ROOT / 'tests/v2151/index_probe.cjs').read_bytes())
    assert row['browser'] == browser and len(row['cases']) == 32 and all(case['passed'] for case in row['cases'])
    assert not any(row.get(key, 0) for key in ['wikipediaWrites', 'systemClipboardWrites', 'screenshots', 'externalRequests', 'nonGetRequests'])
    assert row.get('ownedSessionClosed') is True
    assert not any(row.get(key) for key in ['runnerError', 'cleanupError', 'captureError'])
    payloads = {item['filename']: item for item in row['payloads'].values()}
    assert set(payloads) == set(expected_payloads)
    for name, item in payloads.items():
        raw = (dist / name).read_bytes()
        assert sha(raw) == item['sha256'] == expected_payloads[name]['sha256']
        assert len(raw) == item['bytes'] == expected_payloads[name]['bytes']
files = []
def copy(source, destination, metadata=False):
    raw = source.read_bytes()
    if source.suffix == '.json':
        row = json.loads(raw)
        assert metadata or row.get('status', 'passed') in ['passed', 'passed-with-preexisting-findings']
        assert row.get('wikipediaWrites', 0) == 0
    target = OUT / destination
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(raw)
    files.append({'source':str(source.relative_to(ROOT)), 'file':destination,
                  'bytes':len(raw), 'sha256':sha(raw)})

copy(ROOT / 'tests/expected_release_v2151.json', 'runtime_manifest.json')
for row in qa['receipts']:
    source = ROOT / row['file']
    assert sha(source.read_bytes()) == row['sha256']
    destination = 'reports/' + str(source.relative_to(ART)).replace('/', '__')
    copy(source, destination)
for name in ['QA_SUMMARY.json', 'documentation.json', 'original_case.json']:
    copy(ART / name, name)
for name in ['native_date_contract_review.json', 'native_place_contract_review.json']:
    copy(ART / name, 'provenance/' + name, metadata=True)
for browser in ['chrome', 'firefox', 'safari']:
    copy(ART / 'index' / browser / 'copy_index.json', 'packaging/index_' + browser + '.json')
expected_files = {row['file'] for row in files} | {'EVIDENCE_INDEX.json'}
assert all(not path.is_symlink() for path in OUT.rglob('*'))
assert {str(path.relative_to(OUT)) for path in OUT.rglob('*') if path.is_file()} <= expected_files, 'Unexpected public evidence file'
(OUT / 'EVIDENCE_INDEX.json').write_text(json.dumps({'version':'2.15.1', 'status':qa['status'],
    'releaseManifestSha256':qa['releaseManifestSha256'], 'files':files,
    'privateCorpusIncluded':False, 'screenshotsIncluded':False, 'wikipediaWrites':0}, indent=2)+'\n')
print(json.dumps({'version':'2.15.1', 'publicReceipts':len(files), 'privateCorpusIncluded':False}))
