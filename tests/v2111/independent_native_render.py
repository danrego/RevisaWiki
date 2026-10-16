#!/usr/bin/env python3
"""Anonymous GET-only rendering evidence for independent reference oracles."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, os, subprocess, urllib.parse

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = Path(__file__).resolve().parent / 'independent_fixtures'
OUT = Path(os.environ.get('REVISAWIKI_REPORT_DIR', ROOT / 'artifacts/v2111'))
OUT.mkdir(parents=True, exist_ok=True)

def sha(value):
    return hashlib.sha256(value).hexdigest()

class Native(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.entries=[]; self.calls=[]; self.cite_errors=0; self.cs1_errors=0; self.urls=[]; self.text=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs); classes=a.get('class','').split(); identity=a.get('id','')
        if tag=='li' and identity.startswith('cite_note'): self.entries.append(identity)
        if tag=='sup' and 'reference' in classes: self.calls.append(identity)
        if 'mw-ext-cite-error' in classes: self.cite_errors+=1
        if tag=='span' and 'cs1-visible-error' in classes: self.cs1_errors+=1
        if tag=='a' and 'external' in classes and 'text' in classes: self.urls.append(a.get('href',''))
    def handle_data(self, value): self.text.append(value)

def parse(params, label, capture):
    request={'action':'parse','format':'json','formatversion':'2','prop':'text','disablelimitreport':'1','disableeditsection':'1',**params}
    url='https://pt.wikipedia.org/w/api.php?'+urllib.parse.urlencode(request)
    if 'text' in params: assert len(url.encode()) < 6000, 'A local projection must stay below the reviewed GET limit'
    result=subprocess.run(['/usr/bin/curl','--silent','--show-error','--fail-with-body','--max-time','60','--user-agent','RevisaWiki-read-only-render-check/2.11.1',url],capture_output=True)
    if result.returncode: raise RuntimeError('Anonymous GET failed for '+label+': curl '+str(result.returncode))
    payload=json.loads(result.stdout)
    if 'error' in payload: raise RuntimeError('Native parse refused '+label+': '+payload['error'].get('code','unknown'))
    rendered=payload['parse']['text']; native=Native();native.feed(rendered)
    if capture: (FIXTURES/(label+'_fresh.html')).write_text(rendered)
    row={'id':label,'method':'GET','credentials':'omit','requestBytes':len(url.encode()),'requestParametersSha256':sha(json.dumps(request,sort_keys=True).encode()),'responseSha256':sha(result.stdout),'htmlSha256':sha(rendered.encode()),'entryCount':len(native.entries),'entryIds':native.entries,'callCount':len(native.calls),'citeErrors':native.cite_errors,'visibleCitationErrors':native.cs1_errors,'externalSourceUrls':native.urls,'wikipediaWrites':0}
    if 'text' in params: row['sourceSha256']=sha(params['text'].encode())
    return row, ''.join(native.text)

rows=[]; checks=0
before, _=parse({'oldid':'73225274'},'whole_original_revision',False); rows.append(before)
assert before['entryCount']==80 and before['callCount']==82 and before['citeErrors']==2; checks+=3
for label in ['projection_before','projection_after','blog_before','blog_after']:
    code=(FIXTURES/(label+'.wiki')).read_text()
    row,text=parse({'title':'Lista de aeroclubes do Brasil','contentmodel':'wikitext','text':code},label,True);rows.append(row)
    if label=='projection_before': assert row['entryCount']==2 and row['callCount']==4 and row['citeErrors']==2;checks+=3
    if label=='projection_after': assert row['entryCount']==4 and row['callCount']==4 and row['citeErrors']==0;checks+=3
    if label=='blog_before': assert 'Parâmetro desconhecido' in text and 'blog' in text;checks+=2
    if label=='blog_after': assert 'Parâmetro desconhecido' not in text and 'Foto Memória de Macapá' in text;checks+=2
    if label.startswith('blog_'): assert row['entryCount']==1 and row['callCount']==1;checks+=2
assert rows[1]['externalSourceUrls'] != rows[2]['externalSourceUrls'];checks+=1
assert len(rows[2]['externalSourceUrls'])==4;checks+=1
assert rows[3]['externalSourceUrls']==rows[4]['externalSourceUrls'];checks+=1
fixture_manifest=FIXTURES/'manifest.json'; manifest=json.loads(fixture_manifest.read_text())
for p in sorted(FIXTURES.glob('*_fresh.html')): manifest['files'][p.name]={'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}
fixture_manifest.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
report={'version':'2.11.1','kind':'independent-native-rendering-get-only','runnerSha256':sha(Path(__file__).read_bytes()),'fixtureManifestSha256':sha(fixture_manifest.read_bytes()),'status':'passed','cases':rows,'checks':checks,'networkRequests':len(rows),'scope':'The original complete revision is parsed by oldid. Modified full-article after-rendering is not claimed. Exact four-definition and publication-field projections prove the affected native Cite behavior.','wikipediaWrites':0}
(OUT/'independent_native_render.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'passed','cases':len(rows),'checks':checks,'wikipediaWrites':0}))
