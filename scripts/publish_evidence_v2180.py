"""Publish anonymous summaries derived from validated final 2.18 receipts.

Every original execution, bound case receipt and browser binding is validated
before derivation. Raw QA results, case coordinates, real captures and logs stay
private. Public provenance and fictional native sources have an explicit hash
allowlist and never increase the executed test totals.
"""
from pathlib import Path
import hashlib
import json
import re
from summarize_v2180 import collect, validate_receipt, relative_file, BUNDLES

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/v2180'
OUT = ROOT / 'tests/evidence/2.18.0'
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
    manifest_raw = (ROOT / 'tests/expected_release_v2180.json').read_bytes()
    manifest = json.loads(manifest_raw)
    assert qa['releaseManifestSha256'] == sha(manifest_raw)
    dist = ROOT / 'dist/2.18.0'
    documentation = json.loads((ART / 'documentation.json').read_bytes())
    validate_receipt(documentation, manifest, sha(manifest_raw), BUNDLES)
    assert len(documentation['documentationFiles']) == 8
    for name, pin in documentation['documentationFiles'].items():
        content = (ROOT / 'docs/2.18.0' / name).read_bytes()
        assert sha(content) == pin['sha256'] and len(content) == pin['bytes']
        assert (dist / name).read_bytes() == content
    index_raw = (dist / 'INICIO.html').read_bytes()
    assert documentation['indexSha256'] == sha(index_raw)
    index_manifest = json.loads((dist / 'MANIFESTO.json').read_bytes())
    assert index_manifest['version'] == '2.18.0' and index_manifest['indexSha256'] == sha(index_raw)
    assert index_manifest['sourceReleaseUnchanged'] is True and len(index_manifest['items']) == 5
    expected = {item['filename']: item for item in index_manifest['items']}
    for browser in ['chrome', 'firefox', 'safari']:
        row = json.loads((ART / 'index' / browser / 'copy_index.json').read_bytes())
        assert row['status'] == 'passed' and row['manifestSha256'] == sha(manifest_raw) and row['indexSha256'] == sha(index_raw)
        assert row['runnerSha256'] == sha((ROOT / 'tests/v218/index_probe.cjs').read_bytes())
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
        raw=source.read_bytes()
        assert sha(raw)==record['sha256'], 'A validated receipt changed before publication'
        row=json.loads(raw)
        if record.get('kind')=='corpus':
            assert row.get('kind')=='anonymized-full-page-corpus' and 'alertReduction' not in row
            copy(source,'reports/corpus_aggregate.json')
            return
        runs=row.get('runs',[])
        number=lambda value:len(value) if isinstance(value,list) else value
        result={'kind':'anonymous-qa-receipt-summary','version':'2.18.0',
            'originalReceiptSha256':sha(raw),'originalReceiptIncluded':False,
            'sourceKind':row.get('kind',record.get('kind')),'status':row['status'],
            'runtimeBinding':record['runtimeBinding'],'wikipediaWrites':0}
        if runs:
            result['invocations']=len(runs)
            result['cases']=sum(number(run['result'].get('cases',0)) for run in runs)
            result['checks']=sum(number(run['result'].get('checks',run['result'].get('assertions',0))) for run in runs)
            result['runnerPins']={run['suite']:run['runnerSha256'] for run in runs}
        else:
            result['cases']=number(row.get('cases',0))
            result['checks']=number(row.get('checks',row.get('assertions',0)))
            if row.get('runnerSha256'):
                result['runnerSha256']=row['runnerSha256']
        if row.get('browser'):
            result['browser']=row['browser']
            result['ownedSessionClosed']=row.get('ownedSessionClosed')
        for name in ['toolQaOnly','usesActualCorpus','networkRequests','networkWrites','screenshots','externalRequests']:
            if name in row:result[name]=row[name]
        result['currentRuntimeFiles']=manifest['files']
        result['validatedPrivateAttachments']=[{'sha256':item['sha256'],'originalIncluded':False} for item in record.get('additionalEvidence',[])]
        portable(result)
        destination='reports/'+str(source.relative_to(ART)).replace('/','__')
        data=(json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode()
        target=OUT/destination;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
        copied[destination]=sha(data)
        files.append({'sourceReceiptSha256':sha(raw),'file':destination,'bytes':len(data),'sha256':sha(data),'derived':True,'originalReceiptIncluded':False})

    copy(ROOT / 'tests/expected_release_v2180.json', 'runtime_manifest.json')
    for receipt in qa['receipts']:
        receipt_copy(receipt)
        for attachment in receipt.get('additionalEvidence', []):
            original=relative_file(ROOT,attachment['file'])
            assert sha(original.read_bytes())==attachment['sha256'], 'An original bound receipt changed after validation'
    for name in ['QA_SUMMARY.json', 'QA_INPUTS.json']:
        copy(ART / name, name)
    copy(ART/'DOCUMENTATION_SCOPE.json','DOCUMENTATION_SCOPE.json',metadata=True)
    scope_raw=(ART/'DOCUMENTATION_SCOPE.json').read_bytes()
    assert documentation['scopeSha256']==sha(scope_raw), 'Documentation scope changed after its audit'
    doc_record={'file':'artifacts/v2180/documentation.json','sha256':sha((ART/'documentation.json').read_bytes()),'kind':'documentation','runtimeBinding':{'forms':['release-manifest-and-documentation-hashes'],'bundles':list(BUNDLES)},'additionalEvidence':[]}
    receipt_copy(doc_record)
    for item in qa['provenance']:
        source = relative_file(ROOT, item['file'])
        assert item.get('metadataOnly') is True and sha(source.read_bytes()) == item['sha256']
        copy(source, 'provenance/' + str(source.relative_to(ROOT)).replace('/', '__'), metadata=True)
    permitted_native_hashes=set()
    for item in qa['provenance']:
        proof=json.loads(relative_file(ROOT,item['file']).read_bytes())
        if proof.get('synthetic') is True and isinstance(proof.get('sourceSha256'),dict):
            permitted_native_hashes.update(value for value in proof['sourceSha256'].values() if isinstance(value,str) and re.fullmatch('[0-9a-f]{64}',value))
    native_dir=ROOT/'tests/v218/native'
    for source in sorted(native_dir.glob('*.wiki')):
        digest=sha(source.read_bytes())
        assert digest in permitted_native_hashes, 'A fictional native source lacks explicitly allowlisted provenance'
        copy(source,'native/'+source.name,metadata=True)
    for browser in ['chrome', 'firefox', 'safari']:
        source=ART/'index'/browser/'copy_index.json'
        receipt_copy({'file':str(source.relative_to(ROOT)),'sha256':sha(source.read_bytes()),'kind':'copy-index',
            'runtimeBinding':{'forms':['exact-release-index-and-complete-payload-hashes'],'bundles':list(BUNDLES)},'additionalEvidence':[]})
    allowed = {row['file'] for row in files} | {'EVIDENCE_INDEX.json'}
    assert not any(path.is_symlink() for path in OUT.rglob('*'))
    assert {str(path.relative_to(OUT)) for path in OUT.rglob('*') if path.is_file()} <= allowed, 'Public evidence contains files outside its explicit allowlist'
    index = {'version': '2.18.0', 'status': qa['status'], 'releaseManifestSha256': qa['releaseManifestSha256'],
             'qaInputsSha256': qa['qaInputsSha256'], 'files': files, 'privateCorpusIncluded': False,
             'screenshotsIncluded': False, 'rawQaReceiptsIncluded':False,'rawCaseCoordinatesIncluded':False, 'wikipediaWrites': 0}
    (OUT / 'EVIDENCE_INDEX.json').write_text(json.dumps(index, indent=2) + '\n')
    print(json.dumps({'version': '2.18.0', 'publicReceipts': len(files), 'privateCorpusIncluded': False}))


if __name__ == '__main__':
    main()
