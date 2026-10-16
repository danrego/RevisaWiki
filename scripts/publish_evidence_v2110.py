"""Publish only completed JSON evidence bound to the final release."""
from pathlib import Path
import hashlib,json,shutil
R=Path(__file__).resolve().parents[1];D=R/'artifacts/v2110';M=R/'tests/expected_release_v2110.json';raw=M.read_bytes();m=json.loads(raw)
qa=json.loads((D/'RELEASE_QA_SUMMARY.json').read_text());assert qa['status']=='passed' and qa['releaseManifestSha256']==hashlib.sha256(raw).hexdigest() and qa['frozenFiles']==m['files']
inputs=[(p,p.name) for p in sorted((D/'final_main').glob('*.json'))]
inputs +=[(D/'RELEASE_QA_SUMMARY.json','RELEASE_QA_SUMMARY.json'),(D/'large-corpus/final_v2110/public_report.json','large_articles.json'),(D/'final_performance/large_performance.json','large_performance.json')]
inputs +=[(R/'tests/v2110'/name,name) for name in ['NATIVE_BIRTH_CATEGORY_PROOF.json','NATIVE_REPAIR_RENDER_PROOF.json','NATIVE_STRUCTURE_RENDER_PROOF.json']]
inputs +=[(D/'final_browser_retry'/name,'browser/'+name) for name in ['chrome.json','firefox.json','safari.json','NATIVE_BROWSER_SUMMARY.json']]
inputs +=[(D/'final_geometry'/name,'reference_geometry/'+name) for name in ['chrome.json','firefox.json','safari.json']]
inputs +=[(D/'final_image'/name,'image_browser/'+name) for name in ['chrome.json','firefox.json','safari.json']]
inputs +=[(D/name,name) for name in ['documentation.json','copy_index.json','rebuild.json','privacy_units.json']]
P=R/'tests/evidence/2.11.0';P.mkdir(parents=True,exist_ok=True);files={}
for path,name in inputs:
 content=path.read_bytes();v=json.loads(content);assert v.get('status','passed')=='passed' and not v.get('failed',0) and not v.get('failures'),name
 if 'version' in v:assert v['version']=='2.11.0',name
 if 'frozenFiles' in v:assert v['frozenFiles']==m['files'],name
 target=P/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,target);files[name]={'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()}
(P/'EVIDENCE_INDEX.json').write_text(json.dumps({'version':'2.11.0','status':'passed','files':files,'scope':'Final JSON reports only. No logs, browser profiles, preliminary runs, account data, private paths or article output drafts. The final privacy scans are performed after this inventory is written.','wikipediaWrites':0},indent=2)+'\n')
print(json.dumps({'version':'2.11.0','reports':len(files),'wikipediaWrites':0}))
