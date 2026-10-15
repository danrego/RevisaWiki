#!/usr/bin/env python3
"""Combine immutable offline dual-distribution corpus shards."""
import argparse, collections, hashlib, json, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
HERE=pathlib.Path(__file__).resolve().parent

def main():
 p=argparse.ArgumentParser();p.add_argument('run');a=p.parse_args()
 base=HERE/a.run;snapshot=json.loads((base/'snapshot.json').read_text())
 reports=[json.loads((HERE/(a.run+'_part'+str(i))/'results.json').read_text()) for i in range(snapshot['shards'])]
 inputs=[];manifests=[]
 for name,directory in [('new',ROOT/'tests/corpus/inputs/new'),('old',ROOT/'tests/corpus/inputs/old')]:
  path=directory/'manifest.json';raw=path.read_bytes();manifest=json.loads(raw);manifests.append({'name':name,'articles':len(manifest),'sha256':hashlib.sha256(raw).hexdigest()})
  inputs += [dict(x,corpus=name) for x in manifest]
 rows=[];errors=[]
 for i,r in enumerate(reports):
  if r.get('shard')!={'index':i,'stride':snapshot['shards']}:errors.append('wrong shard declaration')
  if r['completed']!=r['totalArticles'] or r['completed']!=len(inputs[i::snapshot['shards']]):errors.append('incomplete shard '+str(i))
  if {x['name']:x['sha256'] for x in r['frozenFiles']}!={x['name']:x['sha256'] for x in snapshot['hashes']}:errors.append('mixed script snapshots '+str(i))
  if not r['sourceManifestsStillMatch']:errors.append('input manifest changed '+str(i))
  rows+=r['articles']
 indexed={x['revid']:x for x in rows}
 if len(rows)!=2000 or len(indexed)!=2000:errors.append('not 2,000 distinct executions')
 for input in inputs:
  if input['revid'] not in indexed:errors.append('missing '+input['title']);continue
  row=indexed[input['revid']]
  if row['title']!=input['title'] or row['inputSha256']!=input['sha256'] or row['corpus']!=input['corpus']:errors.append('wrong source '+input['title'])
 for row in rows:
  if row.get('modes',{}).get('core',{}).get('outputSha256')!=row.get('modes',{}).get('complete',{}).get('outputSha256'):errors.append('complete/core inequivalence '+row['title'])
 rows.sort(key=lambda row:next(index for index,x in enumerate(inputs) if x['revid']==row['revid']))
 summary={'version':'2.4.0','run':a.run,'frozenFiles':snapshot['hashes'],'manifests':manifests,'articles':len(rows),'newArticles':sum(x['corpus']=='new' for x in rows),'oldArticles':sum(x['corpus']=='old' for x in rows),'coreExecutions':sum('core' in x['modes'] for x in rows),'completeExecutions':sum('complete' in x['modes'] for x in rows),'passed':sum(x['passed'] for x in rows),'failed':sum(not x['passed'] for x in rows),'checks':sum(r['checks'] for r in reports),'equivalentOutputs':sum(x['modes']['core'].get('outputSha256')==x['modes']['complete'].get('outputSha256') for x in rows),'knownSourcePresentationWarnings':sum(bool(x['modes']['core'].get('knownSourcePresentationWarning')) for x in rows),'inputsAndShardsValid':not errors,'validationErrors':errors,'currentDistributionMatchesSnapshot':all(r['distributionsStillMatchCurrent'] for r in reports),'networkRequests':0,'wikipediaWrites':0,'failedArticles':[{'title':r['title'],'revid':r['revid'],'corpus':r['corpus'],'failures':r['failures']}for r in rows if not r['passed']]}
 (base/'combined_results.json').write_text(json.dumps({'summary':summary,'articles':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(summary,ensure_ascii=False),flush=True)
 raise SystemExit(1 if errors or summary['failed'] else 0)
if __name__=='__main__':main()
