"""Record explicit, reviewable adaptations without modifying inherited assertions."""
from pathlib import Path
import difflib,hashlib,json
R=Path(__file__).resolve().parents[1];p=R/'tests/v2111/ADAPTATION_PROVENANCE.json';v=json.loads(p.read_text())
for row in v['files']:
 a=(R/row['source']).read_text();b=(R/row['target']).read_text()
 for old,new in v['substitutions']:a=a.replace(old,new)
 additional=[]
 if a!=b:
  allowed=['browser/run_release.cjs','browser/summarize_release.cjs','benchmark_large.cjs','summarize.cjs','run_all.cjs','run_startup.cjs','test_index.cjs','run_engine.cjs','browser/v211_image_runtime.cjs','browser/birth_category_flow.cjs','browser/v210_repair_flow.cjs']
  assert any(row['target'].endswith('/'+name) for name in allowed),'Undeclared assertion adaptation: '+row['target']
  aa,bb=a.splitlines(keepends=True),b.splitlines(keepends=True)
  for i,j,k,l in reversed([op[1:] for op in difflib.SequenceMatcher(None,aa,bb,autojunk=False).get_opcodes() if op[0]!='equal']):
   start=max(0,i-1);end=min(len(aa),j+1);old=''.join(aa[start:end]);new=''.join(aa[start:i])+''.join(bb[k:l])+''.join(aa[j:end]);assert old and a.count(old)==1,row['target'];a=a.replace(old,new,1);additional.append([old,new])
  assert a==b,row['target']
 row['additionalSubstitutions']=additional;row['targetSha256']=hashlib.sha256((R/row['target']).read_bytes()).hexdigest()
v['additiveModules']=[{'target':str(f.relative_to(R)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(f for f in (R/'tests/v2111').rglob('*') if f.is_file() and f.suffix in ['.cjs','.js','.mjs','.html','.php'] and 'artifacts' not in f.parts) if str(f.relative_to(R)) not in {x['target'] for x in v['files']}]
p.write_text(json.dumps(v,indent=2)+'\n');print(json.dumps({'assertionFiles':len(v['files']),'adapted':[(x['target'],len(x['additionalSubstitutions'])) for x in v['files'] if x['additionalSubstitutions']]}))
