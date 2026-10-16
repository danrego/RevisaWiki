"""Copy only the final pinned reports into the public evidence directory."""
from pathlib import Path
import hashlib,json,shutil

ROOT=Path(__file__).resolve().parents[1]
manifest_raw=(ROOT/'tests/expected_release_v283.json').read_bytes()
manifest=json.loads(manifest_raw)
summary=ROOT/'artifacts/v283/RELEASE_QA_SUMMARY.json'
qa=json.loads(summary.read_text())
assert qa['version']=='2.8.3' and qa['status']=='passed'
assert qa['frozenFiles']==manifest['files']
assert qa['releaseManifestSha256']==hashlib.sha256(manifest_raw).hexdigest()
public=ROOT/'tests/evidence/2.8.3'; public.mkdir(parents=True,exist_ok=True)
inputs=[(p,p.name) for p in sorted((ROOT/'artifacts/v283/final_main').glob('*.json'))]
inputs += [(ROOT/'tests/v283/NATIVE_BIRTH_CATEGORY_PROOF.json','NATIVE_BIRTH_CATEGORY_PROOF.json'), (summary,summary.name), (ROOT/'artifacts/v283/large-corpus/final_v283/public_report.json','large_articles.json')]
inputs += [(ROOT/'artifacts/v283/final_browser'/name,'browser/'+name) for name in ['chrome.json','firefox.json','safari.json','NATIVE_BROWSER_SUMMARY.json']]
inputs += [(ROOT/'artifacts/v283'/name,name) for name in ['documentation.json','copy_index.json','rebuild.json','publication_privacy.json','privacy_units.json']]
files={}
for source,relative in inputs:
 raw=source.read_bytes(); value=json.loads(raw)
 assert value.get('status','passed')=='passed',relative
 assert not value.get('failed',0) and not value.get('failures'),relative
 if 'frozenFiles' in value: assert value['frozenFiles']==manifest['files'],relative
 if 'version' in value: assert value['version']=='2.8.3',relative
 target=public/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
 files[relative]={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
(public/'EVIDENCE_INDEX.json').write_text(json.dumps({'version':'2.8.3','status':'passed','method':'Explicit final JSON reports only; no local logs, profiles, preliminary runs or article outputs.','files':files,'wikipediaWrites':0},indent=2)+'\n')
print(json.dumps({'version':'2.8.3','reports':len(files),'wikipediaWrites':0}))
