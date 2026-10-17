"""Publish explicit anonymous receipts bound to the final release bytes."""
from pathlib import Path
import hashlib
import json
from summarize_v2160 import collect, validate_receipt, BUNDLES

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'artifacts/v2160'
OUT=ROOT/'tests/evidence/2.16.0'
sha=lambda data:hashlib.sha256(data).hexdigest()
qa=json.loads((ART/'QA_SUMMARY.json').read_text())
assert qa==collect() and qa['newFailures']==0
manifest_raw=(ROOT/'tests/expected_release_v2160.json').read_bytes()
manifest=json.loads(manifest_raw)
assert qa['releaseManifestSha256']==sha(manifest_raw)
dist=ROOT/'dist/2.16.0'
documentation=json.loads((ART/'documentation.json').read_text())
validate_receipt(documentation,manifest,sha(manifest_raw),BUNDLES)
for name,proof in documentation['documentationFiles'].items():
    content=(ROOT/'docs/2.16.0'/name).read_bytes()
    assert sha(content)==proof['sha256'] and len(content)==proof['bytes']
    assert (dist/name).read_bytes()==content
index_raw=(dist/'INICIO.html').read_bytes()
assert documentation['indexSha256']==sha(index_raw)
index_manifest=json.loads((dist/'MANIFESTO.json').read_text())
assert index_manifest['version']=='2.16.0' and index_manifest['indexSha256']==sha(index_raw)
assert index_manifest['sourceReleaseUnchanged'] is True and len(index_manifest['items'])==5
expected={item['filename']:item for item in index_manifest['items']}
for browser in ['chrome','firefox','safari']:
    row=json.loads((ART/'index'/browser/'copy_index.json').read_text())
    assert row['status']=='passed' and row['manifestSha256']==sha(manifest_raw) and row['indexSha256']==sha(index_raw)
    assert row['runnerSha256']==sha((ROOT/'tests/v216/index_probe.cjs').read_bytes())
    assert row['browser']==browser and len(row['cases'])==32 and all(case['passed'] for case in row['cases'])
    assert row.get('ownedSessionClosed') is True
    assert not any(row.get(key,0) for key in ['wikipediaWrites','systemClipboardWrites','screenshots','externalRequests','nonGetRequests'])
    assert not any(row.get(key) for key in ['runnerError','cleanupError','captureError'])
    payloads={item['filename']:item for item in row['payloads'].values()}
    assert set(payloads)==set(expected)
    for name,item in payloads.items():
        raw=(dist/name).read_bytes()
        assert len(raw)==item['bytes']==expected[name]['bytes'] and sha(raw)==item['sha256']==expected[name]['sha256']
OUT.mkdir(parents=True,exist_ok=True)
files=[]
def copy(source,destination,metadata=False):
    raw=source.read_bytes()
    if source.suffix=='.json':
        row=json.loads(raw)
        assert metadata or row.get('status','passed') in ['passed','passed-with-preexisting-findings']
        assert row.get('wikipediaWrites',0)==0
    target=OUT/destination
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(raw)
    files.append({'source':str(source.relative_to(ROOT)),'file':destination,'bytes':len(raw),'sha256':sha(raw)})
copy(ROOT/'tests/expected_release_v2160.json','runtime_manifest.json')
for receipt in qa['receipts']:
    source=ROOT/receipt['file']
    assert sha(source.read_bytes())==receipt['sha256']
    copy(source,'reports/'+str(source.relative_to(ART)).replace('/','__'))
for name in ['QA_SUMMARY.json','documentation.json']:
    copy(ART/name,name)
for name in ['transfer_contract_review.json','field_value_contracts.json','native_field_values.json','INDEPENDENT_ENDPOINT_REVIEW.json']:
    copy(ROOT/'tests/v216'/name,'provenance/'+name,metadata=True)
for browser in ['chrome','firefox','safari']:
    copy(ART/'index'/browser/'copy_index.json','packaging/index_'+browser+'.json')
# The clock report was also produced independently before this collector.
# Its exact bytes must match the release-bound receipt already included above.
extra=OUT/'reports/clock_retained.json'
if extra.exists():
    assert sha(extra.read_bytes())==sha((ART/'clock_retained.json').read_bytes())
    files.append({'source':'artifacts/v2160/clock_retained.json','file':'reports/clock_retained.json','bytes':extra.stat().st_size,'sha256':sha(extra.read_bytes())})
allowed={row['file'] for row in files}|{'EVIDENCE_INDEX.json'}
assert not any(path.is_symlink() for path in OUT.rglob('*'))
assert {str(path.relative_to(OUT)) for path in OUT.rglob('*') if path.is_file()}<=allowed
(OUT/'EVIDENCE_INDEX.json').write_text(json.dumps({'version':'2.16.0','status':qa['status'],
    'releaseManifestSha256':qa['releaseManifestSha256'],'files':files,'privateCorpusIncluded':False,
    'screenshotsIncluded':False,'wikipediaWrites':0},indent=2)+'\n')
print(json.dumps({'version':'2.16.0','publicReceipts':len(files),'privateCorpusIncluded':False}))
