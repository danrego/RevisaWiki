"""Read-only GET preview of the exact repaired reference bodies on ptwiki."""
from pathlib import Path
import argparse,hashlib,json,re,subprocess,tempfile,time,urllib.parse
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--input',type=Path,default=ROOT/'artifacts/v282/native_render_inputs.json')
p.add_argument('--output',type=Path,default=ROOT/'tests/v282/NATIVE_RENDER_PROOF.json')
a=p.parse_args(); data=json.loads(a.input.read_text()); assert data['version']=='2.8.2'
pins=ROOT/'tests/expected_release_v282.json'
assert data['releaseManifestSha256']==hashlib.sha256(pins.read_bytes()).hexdigest()
assert data['frozenFiles']==json.loads(pins.read_text())['files']
class Errors(HTMLParser):
    def __init__(self):super().__init__();self.errors=[];self.items=0
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if any('error' in c.lower() for c in attrs.get('class','').split()):self.errors.append({'tag':tag,'class':attrs.get('class')})
        if tag=='li' and attrs.get('id','').startswith('cite_note-'):self.items+=1

def text_for(rows):
    return '\n'.join(f'<ref group="before" name="before{x["id"]}">{x["before"]}</ref><ref group="after" name="after{x["id"]}">{x["after"]}</ref>' for x in rows)+'\n<references group="before"/>\n<references group="after"/>'
def read_preview(text):
    with tempfile.TemporaryDirectory(prefix='revisawiki-preview-') as folder:
        input_file=Path(folder)/'source.wiki';input_file.write_text(text)
        command=['curl','--silent','--show-error','--fail','--retry','4','--retry-all-errors','--retry-delay','10','--max-time','60','--get','https://pt.wikipedia.org/w/api.php','--data-urlencode','action=parse','--data-urlencode','format=json','--data-urlencode','formatversion=2','--data-urlencode','contentmodel=wikitext','--data-urlencode','title=NBC News','--data-urlencode','prop=text|parsewarnings','--data-urlencode','text@'+str(input_file)]
        raw=subprocess.check_output(command);value=json.loads(raw);assert 'parse' in value and not value.get('error'),value.get('error')
        parser=Errors();parser.feed(value['parse']['text'])
        return {'responseSha256':hashlib.sha256(raw).hexdigest(),'htmlSha256':hashlib.sha256(value['parse']['text'].encode()).hexdigest(),'errors':parser.errors,'warnings':value['parse'].get('parsewarnings',[]),'referenceItems':parser.items}
rows=data['pairs'];batches=[];batch=[]
for row in rows:
    if batch and len(urllib.parse.urlencode({'text':text_for(batch+[row])}))>6500:batches.append(batch);batch=[]
    batch.append(row)
if batch:batches.append(batch)
results=[]
for index,batch in enumerate(batches):
    text=text_for(batch);result=read_preview(text)
    assert not result['errors'] and not result['warnings'],result
    assert result['referenceItems']==len(batch)*2,result
    results.append({'batch':index+1,'referenceIds':[x['id'] for x in batch],'inputSha256':hashlib.sha256(text.encode()).hexdigest(),**result})
    print(json.dumps({'batch':index+1,'batches':len(batches),'references':len(batch),'errors':len(result['errors'])}),flush=True);time.sleep(3)
negative=read_preview('<ref>{{Citar web|titulo=Controle de URL ausente|publicado=Fonte de teste}}</ref>\n<references/>')
assert len(negative['errors'])==1 and negative['referenceItems']==1,negative
result={k:v for k,v in data.items() if k!='pairs'}
result.update({'status':'passed','kind':'anonymous-primary-native-render-proof','method':'GET action=parse','cases':len(rows)+1,'checks':len(batches)*3+2,'repairedReferences':len(rows),'beforeAfterPairs':[{'id':x['id'],'target':x['target'],'beforeSha256':x['beforeSha256'],'afterSha256':x['afterSha256']} for x in rows],'batches':results,'negativeControl':{'expectedErrors':1,**negative},'newCitationErrors':0,'wikipediaWrites':0,'accountsUsed':0})
a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'version':'2.8.2','status':'passed','cases':result['cases'],'checks':result['checks'],'newCitationErrors':0,'wikipediaWrites':0}))
