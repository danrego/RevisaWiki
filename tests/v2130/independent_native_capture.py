#!/usr/bin/env python3
"""Read-only native rendering of independently written synthetic projections."""
from pathlib import Path
from html.parser import HTMLParser
from datetime import datetime, timezone
import hashlib, json, os, shutil, subprocess, sys, time, urllib.parse

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
FIXTURES = HERE / 'independent_fixtures'
OUT = Path(os.environ.get('REVISAWIKI_REPORT_DIR', ROOT / 'artifacts/v2130'))
sha = lambda value: hashlib.sha256(value).hexdigest()
NODE = shutil.which('node')
if not NODE: raise RuntimeError('Node.js is required to read the independently written fixtures')
items = json.loads(subprocess.check_output([NODE, '-e', 'console.log(JSON.stringify(require("./tests/v2130/independent_cases.cjs").items.filter(i=>i.ui||i.native)))'], cwd=ROOT))
manifest_file = FIXTURES / 'native_manifest.json'
network_requests = 0

class Native(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables=[]; self.cells=[]; self.sort=[]; self.entries=[]; self.calls=[]; self.cite_errors=0; self.cs1_errors=0; self.text=[]
    def handle_starttag(self, tag, attrs):
        values=dict(attrs); classes=values.get('class','').split(); identity=values.get('id','')
        if tag=='table': self.tables.append(attrs)
        if tag in ['th','td']: self.cells.append([tag,attrs])
        if any(key.startswith('data-sort-') for key in values): self.sort.append([tag,[(k,v) for k,v in attrs if k.startswith('data-sort-')]])
        if tag=='li' and identity.startswith('cite_note'): self.entries.append(identity)
        if tag=='sup' and 'reference' in classes: self.calls.append(identity)
        if 'mw-ext-cite-error' in classes: self.cite_errors+=1
        if tag=='span' and ('cs1-visible-error' in classes or 'error' in classes and 'citation-comment' in classes): self.cs1_errors+=1
    def handle_data(self, value): self.text.append(value)

def capture(task):
    global network_requests
    item, mode = task
    source=item['source' if mode=='before' else 'expected']
    label=item['id']+'_'+mode
    receipt=FIXTURES/(label+'_receipt.json')
    if receipt.exists():
        saved=json.loads(receipt.read_text())
        if saved['sourceSha256']==sha(source.encode()) and sha((FIXTURES/saved['renderFile']).read_bytes())==saved['renderSha256']:
            if 'responseSavedAt' not in saved:
                saved['responseSavedAt']=datetime.fromtimestamp(receipt.stat().st_mtime,timezone.utc).isoformat()
                saved['responseSavedAtMethod']='Existing response receipt file modification time in UTC'
                receipt.write_text(json.dumps(saved,ensure_ascii=False,indent=2)+'\n')
            return saved
    params={'action':'parse','format':'json','formatversion':'2','title':'RevisaWiki/Teste técnico','text':source,'contentmodel':'wikitext','prop':'text|modules|parsewarnings','disableeditsection':'1','disablelimitreport':'1'}
    url='https://pt.wikipedia.org/w/api.php?'+urllib.parse.urlencode(params)
    assert len(url.encode()) < 6000
    value=subprocess.run(['/usr/bin/curl','--disable','--fail','--silent','--show-error','--max-time','60','--user-agent','RevisaWiki-read-only-render-check/2.13.0',url],capture_output=True)
    network_requests+=1
    if value.returncode: raise RuntimeError('Anonymous GET failed for '+item['id']+' '+mode+': curl '+str(value.returncode))
    payload=json.loads(value.stdout)
    if 'error' in payload: raise RuntimeError('Anonymous native parse refused '+item['id']+' '+mode)
    rendered=payload['parse']['text']
    (FIXTURES/(label+'.wiki')).write_text(source)
    (FIXTURES/(label+'.html')).write_text(rendered)
    row={'id':item['id'],'mode':mode,'feature':item['feature'],'method':'GET','credentials':'omit','requestBytes':len(url.encode()),'sourceFile':label+'.wiki','sourceBytes':len(source.encode()),'sourceSha256':sha(source.encode()),'renderFile':label+'.html','renderBytes':len(rendered.encode()),'renderSha256':sha(rendered.encode()),'responseSha256':sha(value.stdout),'responseSavedAt':datetime.now(timezone.utc).isoformat(),'responseSavedAtMethod':'UTC clock after the successful anonymous GET','parseWarnings':payload['parse'].get('parsewarnings',[]),'modules':payload['parse'].get('modules',[]),'wikipediaWrites':0}
    receipt.write_text(json.dumps(row,ensure_ascii=False,indent=2)+'\n')
    time.sleep(1)
    return row

if '--capture' in sys.argv:
    rows=[capture((item,mode)) for item in items for mode in ['before','after']]
    manifest={'version':'2.13.0','kind':'independent-native-synthetic-rendering','method':'GET','credentials':'omit','wikipediaWrites':0,'oracleSha256':sha((HERE/'independent_cases.cjs').read_bytes()),'captures':rows}
    manifest_file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
manifest=json.loads(manifest_file.read_text())
assert manifest['oracleSha256']==sha((HERE/'independent_cases.cjs').read_bytes()), 'Handwritten oracles changed after native capture'
assert [(row['id'],row['mode'],row['feature']) for row in manifest['captures']]==[(item['id'],mode,item['feature']) for item in items for mode in ['before','after']], 'Exactly the eighteen independent source endpoints are required'
assert set(row['feature'] for row in manifest['captures'])==set(range(1,9)), 'All eight features need native projections'
checks=2; results=[]; parsed={}
for row in manifest['captures']:
    source=(FIXTURES/row['sourceFile']).read_bytes(); rendered=(FIXTURES/row['renderFile']).read_bytes()
    assert len(source)==row['sourceBytes'] and sha(source)==row['sourceSha256']; checks+=2
    assert len(rendered)==row['renderBytes'] and sha(rendered)==row['renderSha256']; checks+=2
    native=Native(); native.feed(rendered.decode()); parsed[(row['id'],row['mode'])]=native
    results.append({**row,'entryCount':len(native.entries),'callCount':len(native.calls),'citeErrors':native.cite_errors,'visibleCitationErrors':native.cs1_errors,'tableCount':len(native.tables),'cells':native.cells,'sortAttributes':native.sort})
for item in items:
    before=parsed[(item['id'],'before')]; after=parsed[(item['id'],'after')]
    assert after.cite_errors==0 and after.cs1_errors==0; checks+=2
    assert len(before.calls)==len(after.calls); checks+=1
    if item['feature'] in [2,3]: assert before.cs1_errors>after.cs1_errors; checks+=1
    if item['feature']==1: assert before.cite_errors>after.cite_errors and len(after.entries)==1; checks+=2
    if item['feature']==4: assert before.entries==after.entries and before.calls==after.calls; checks+=2
    if item['feature'] in [5,6,8]:
        assert before.tables==after.tables and before.cells==after.cells and before.sort==after.sort; checks+=3
    if item['feature']==7:
        assert any(dict(attrs).get('colspan')=='2' for tag,attrs in after.cells); checks+=1
runtime_script=r'''
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path'),candidate=require('./tests/v2130/candidate.cjs'),items=require('./tests/v2130/independent_cases.cjs').items.filter(i=>i.ui||i.native),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const rows=[];for(const file of candidate.bundleFiles()){const api=require(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo técnico',authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,autoPreview:false,registryDoiCheck:false,unifiedNotesReferences:false,referenceColumns:false,tableAccessibility:false,endTemplateOrder:false,endSectionOrder:false,headings:false,automaticIdenticalReferences:false,moveNamedRefs:false};for(const item of items){const result=api.calculate({kind:'adjust',source:item.source,options:cfg});assert.equal(result.text,item.expected);assert.deepEqual(result.preservation,[]);assert.equal(api.calculate({kind:'adjust',source:item.expected,options:cfg}).text,item.expected);rows.push({file:path.basename(file),bundleSha256:sha(fs.readFileSync(file)),id:item.id,sourceSha256:sha(item.source),outputSha256:sha(result.text),preservationPassed:true,idempotent:true});}}
console.log(JSON.stringify(rows));
'''
runtime_bindings=json.loads(subprocess.check_output([NODE,'-e',runtime_script],cwd=ROOT)); checks+=len(runtime_bindings)*3
OUT.mkdir(parents=True,exist_ok=True)
report={'version':'2.13.0','kind':'independent-native-get-only-eight-fixes','runnerSha256':sha(Path(__file__).read_bytes()),'oracleSha256':sha((HERE/'independent_cases.cjs').read_bytes()),'fixtureManifestSha256':sha(manifest_file.read_bytes()),'pinManifestSha256':sha((ROOT/'tests/expected_release_v2130.json').read_bytes()),'runtimeBindings':runtime_bindings,'status':'passed','cases':results,'checks':checks,'wikipediaWrites':0,'networkRequests':network_requests,'capturedNativeQueries':len(results),'scope':'Exact synthetic affected-template and table projections. No complete-article visual equivalence is claimed.'}
(OUT/'independent_native_render.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'passed','cases':len(results),'checks':checks,'wikipediaWrites':0}))
