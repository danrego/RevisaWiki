#!/usr/bin/env python3
"""Reproduce the 2.3 complex-article corpus from immutable revision IDs.

Only anonymous HTTPS GET action=query requests are issued. Uses system curl with
normal TLS certificate validation. Never supplies cookies, API tokens, login or
write actions. Files are accepted only when SHA-256 and UTF-8 byte count match
manifest.json. Run with --manifest /path/manifest.json --destination /new/path.
"""
import argparse, datetime, hashlib, json, pathlib, subprocess, time
API='https://pt.wikipedia.org/w/api.php'

def request(revids):
    arguments=['curl','--fail','--silent','--show-error','--connect-timeout','15','--max-time','180','--user-agent','RevisaWiki-local-regression-reproduction/2.3 (anonymous read-only fixed revisions)','--get',API]
    parameters={'action':'query','format':'json','formatversion':'2','maxlag':'5','prop':'revisions','revids':'|'.join(str(x) for x in revids),'rvprop':'ids|timestamp|size|content|contentmodel','rvslots':'main'}
    for key,value in parameters.items(): arguments.extend(['--data-urlencode',key+'='+value])
    for attempt in range(8):
        result=subprocess.run(arguments,capture_output=True,text=True)
        if result.returncode:
            time.sleep(min(30*(attempt+1),120)); continue
        data=json.loads(result.stdout)
        if data.get('error'):
            if data['error'].get('code')=='maxlag': time.sleep(30); continue
            raise RuntimeError(data['error'])
        sources={}
        for page in data.get('query',{}).get('pages',[]):
            for revision in page.get('revisions',[]):
                slot=revision.get('slots',{}).get('main',{})
                if slot.get('content') is not None:
                    sources[revision['revid']]=slot['content'].encode('utf-8')
        return sources
    raise RuntimeError('anonymous read exhausted retries')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest',type=pathlib.Path,required=True)
    parser.add_argument('--destination',type=pathlib.Path,required=True)
    parser.add_argument('--interval-seconds',type=float,default=8)
    args=parser.parse_args()
    if args.interval_seconds<6: parser.error('Use at least 6 seconds between batches to be polite to the public API.')
    entries=json.loads(args.manifest.read_text(encoding='utf-8'))
    pending=[]; accepted=[]
    for entry in entries:
        file=args.destination/entry['file']
        if file.exists():
            raw=file.read_bytes()
            if len(raw)==entry['bytes'] and hashlib.sha256(raw).hexdigest()==entry['sha256']:
                accepted.append(entry['revid']); continue
            raise RuntimeError('Existing file fails expected SHA-256, refusing to overwrite: '+str(file))
        pending.append(entry)
    for start in range(0,len(pending),50):
        batch=pending[start:start+50]; sources=request([entry['revid'] for entry in batch])
        for entry in batch:
            raw=sources.get(entry['revid'])
            if raw is None: raise RuntimeError('Revision content unavailable, unresolved read: '+str(entry['revid']))
            if len(raw)!=entry['bytes'] or hashlib.sha256(raw).hexdigest()!=entry['sha256']:
                raise RuntimeError('Frozen content did not match expected bytes and SHA-256: '+entry['title'])
            file=args.destination/entry['file']; file.parent.mkdir(parents=True,exist_ok=True); file.write_bytes(raw)
            accepted.append(entry['revid'])
        print('Verified immutable revisions:',len(accepted),'/',len(entries),flush=True)
        if start+len(batch)<len(pending): time.sleep(args.interval_seconds)
    report={'articles':len(entries),'verifiedRevisionIds':accepted,'manifestSha256':hashlib.sha256(args.manifest.read_bytes()).hexdigest(),'readOnly':True,'authentication':False,'networkActions':['query'],'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    args.destination.mkdir(parents=True,exist_ok=True)
    target=args.destination/'manifest.json'
    manifest_bytes=args.manifest.read_bytes()
    if target.exists() and target.read_bytes()!=manifest_bytes: raise RuntimeError('Existing destination manifest differs; refusing to overwrite.')
    target.write_bytes(manifest_bytes)
    (args.destination/'reproduction_validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__': main()
