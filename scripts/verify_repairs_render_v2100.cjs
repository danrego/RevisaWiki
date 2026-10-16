'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),manifestPath=path.join(root,'tests/expected_release_v2100.json'),manifestBytes=fs.readFileSync(manifestPath),manifest=JSON.parse(manifestBytes),fixturePath=path.join(root,'tests/v2100/fixtures/repair_render_cases.json'),fixtureBytes=fs.readFileSync(fixturePath),fixture=JSON.parse(fixtureBytes),cacheDir=path.join(root,'artifacts/v2100/native-repair-cache');
const report={version:'2.10.0',kind:'anonymous-native-table-reference-and-identifier-rendering',status:'passed',releaseManifestSha256:sha(manifestBytes),frozenFiles:manifest.files,runnerSha256:sha(fs.readFileSync(__filename)),fixtureSha256:sha(fixtureBytes),nativeComparisons:0,cases:[],checks:0,failures:[],networkRequests:0,accountsUsed:0,wikipediaWrites:0,transport:'Anonymous GET only through curl --disable. No cookies, authentication, tokens or account actions are supplied.',networkRequestCountMethod:'Cache-miss read operations; curl may retry transient failures. Captured native response timestamps and hashes are retained per comparison.',method:'The exact pure production plans are compared with independent fixture outputs in both bundles. Native parse responses are then checked for ordered resolved citation bodies, unchanged table payloads and attributes, corrected column scopes and exact encoded publication identifiers.'};
fs.mkdirSync(cacheDir,{recursive:true});
function eq(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function ok(value,label){report.checks++;assert.ok(value,label);}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));let lastRead=0;
async function get(query,label){
 const url='https://pt.wikipedia.org/w/api.php?'+new URLSearchParams(query),file=path.join(cacheDir,sha(url)+'.json');
 if(fs.existsSync(file)){const cached=JSON.parse(fs.readFileSync(file));if(cached.urlSha256===sha(url)&&cached.response&&cached.responseSha256===sha(JSON.stringify(cached.response))&&Number.isFinite(Date.parse(cached.checkedAt))&&Date.now()-Date.parse(cached.checkedAt)>=0&&Date.now()-Date.parse(cached.checkedAt)<86400000)return cached;}
 const remaining=6500-(Date.now()-lastRead);if(remaining>0)await delay(remaining);
 const result=spawnSync('curl',['--disable','--silent','--show-error','--fail','--retry','3','--retry-all-errors','--retry-delay','15','--max-time','45','--user-agent','RevisaWiki read-only rendering validation',url],{encoding:'utf8',maxBuffer:8*1024*1024});lastRead=Date.now();report.networkRequests++;
 if(result.status!==0)throw new Error(label+': public anonymous read failed with status '+result.status);
 const response=JSON.parse(result.stdout);if(response.error)throw new Error(label+': MediaWiki returned '+response.error.code);
 const cached={urlSha256:sha(url),responseSha256:sha(JSON.stringify(response)),checkedAt:new Date().toISOString(),response};fs.writeFileSync(file,JSON.stringify(cached)+'\n');return cached;
}
const PYTHON_HTML_SNAPSHOT=String.raw`
import sys,json,html,urllib.parse
from html.parser import HTMLParser
class Tree(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.root={'tag':'root','attrs':{},'children':[]};self.stack=[self.root]
 def handle_starttag(self,tag,attrs):
  values={}
  for key,value in attrs: values.setdefault(key,value if value is not None else '')
  node={'tag':tag,'attrs':values,'children':[]};self.stack[-1]['children'].append(node)
  if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:self.stack.append(node)
 def handle_startendtag(self,tag,attrs):
  self.handle_starttag(tag,attrs)
  if self.stack[-1].get('tag')==tag:self.stack.pop()
 def handle_endtag(self,tag):
  for index in range(len(self.stack)-1,0,-1):
   if self.stack[index]['tag']==tag:self.stack=self.stack[:index];break
 def handle_data(self,data):self.stack[-1]['children'].append(data)
def nodes(node):
 for child in node.get('children',[]):
  if isinstance(child,dict):yield child;yield from nodes(child)
def text(node):return ''.join(text(child) if isinstance(child,dict) else child for child in node.get('children',[]))
def norm(value):return ' '.join(value.split())
def classes(node):return set(node['attrs'].get('class','').split())
def href(node):return urllib.parse.urljoin('https://pt.wikipedia.org/wiki/Artigo_de_teste',node['attrs'].get('href',''))
p=Tree();p.feed(sys.stdin.read());allnodes=list(nodes(p.root));ids={node['attrs']['id']:node for node in allnodes if 'id' in node['attrs']};refs=[]
for sup in allnodes:
 if sup['tag']!='sup' or not classes(sup).intersection({'reference','mw-ref'}):continue
 for anchor in nodes(sup):
  if anchor['tag']!='a' or 'href' not in anchor['attrs']:continue
  fragment=urllib.parse.unquote(urllib.parse.urlsplit(href(anchor)).fragment)
  if not fragment.startswith('cite_note'):continue
  note=ids.get(fragment)
  if note is None:raise RuntimeError('Native citation marker lacks a rendered destination')
  body=next((node for node in nodes(note) if classes(node).intersection({'reference-text','mw-reference-text'})),None)
  if body is None:raise RuntimeError('Native citation destination lacks a reference body')
  refs.append({'body':norm(text(body)),'hrefs':[href(node) for node in nodes(body) if node['tag']=='a' and 'href' in node['attrs']]})
tables=[]
for table in allnodes:
 if table['tag']!='table' or 'wikitable' not in classes(table):continue
 caption=next((node for node in nodes(table) if node['tag']=='caption'),None);rows=[]
 for row in nodes(table):
  if row['tag']!='tr':continue
  cells=[]
  for cell in row['children']:
   if not isinstance(cell,dict) or cell['tag'] not in {'td','th'}:continue
   attrs=cell['attrs'];cells.append({'tag':cell['tag'].upper(),'payload':norm(text(cell)),'colspan':attrs.get('colspan',''),'rowspan':attrs.get('rowspan',''),'class':attrs.get('class',''),'style':attrs.get('style',''),'scope':attrs.get('scope','')})
  rows.append({'class':row['attrs'].get('class',''),'style':row['attrs'].get('style',''),'cells':cells})
 tables.append({'caption':norm(text(caption)) if caption else '','rows':rows})
errors=[norm(text(node)) for node in allnodes if classes(node).intersection({'cs1-visible-error','cs1-hidden-error','error','mw-ext-cite-error'}) and norm(text(node))]
print(json.dumps({'text':text(p.root),'references':refs,'tables':tables,'errors':errors},ensure_ascii=False))
`;
function domOf(response){const raw=response.parse?.text;if(typeof raw!=='string')throw new Error('The native parse response has no HTML');const parsed=spawnSync('python3',['-c',PYTHON_HTML_SNAPSHOT],{input:raw,encoding:'utf8',maxBuffer:8*1024*1024});if(parsed.status!==0)throw new Error('The independent standard-library native HTML census failed');return JSON.parse(parsed.stdout);}
const references=document=>document.references;
function tableData(document,{scopes=false}={}){return document.tables.map(table=>({...table,rows:table.rows.map(row=>({...row,cells:row.cells.map(cell=>{const {scope,...other}=cell;return scopes?cell:other;})}))}));}
const cs1Errors=document=>document.errors;
function plan(api,row,cfg){if(row.kind==='table'||row.kind==='scope')return api.v29TableRepairPlan(row.source,cfg);if(row.kind==='identifier')return api.v29IdentifierPlan(row.source,cfg);return api.v29ReferenceRepairPlan(row.source,cfg);}
async function main(){
 eq(manifest.version,'2.10.0','The public manifest belongs to this release');eq(fixture.version,'2.10.0','The controlled fixture belongs to this release');
 const bundles=['RevisaWiki_v2_10_0.js','RevisaWiki_v2_10_0_completo.js'].map(name=>{const bytes=fs.readFileSync(path.join(root,'dist/2.10.0',name));eq(bytes.length,manifest.files[name].bytes,'The final bundle byte count is frozen');eq(sha(bytes),manifest.files[name].sha256,'The final bundle digest is frozen');return {name,api:require(path.join(root,'dist/2.10.0',name))};});
 const configRead=await get({action:'query',format:'json',formatversion:'2',prop:'revisions',titles:'Módulo:Citação/CS1/Configuração',rvprop:'ids|timestamp|sha1|content',rvslots:'main'},'native alias configuration'),configPage=configRead.response.query?.pages?.[0],revision=configPage?.revisions?.[0],lua=revision?.slots?.main?.content;
 ok(typeof lua==='string','The native alias configuration source is available');const aliases={};for(const name of ['ARXIV','PMC']){const block=new RegExp("\\['"+name+"'\\]\\s*=\\s*\\{[\\s\\S]*?parameters\\s*=\\s*\\{([^}]+)\\}").exec(lua);ok(Boolean(block),'The native identifier handler declares its aliases');aliases[name]=[...block[1].matchAll(/'([^']+)'/g)].map(match=>match[1]);}
 eq(aliases.ARXIV,['arxiv','ARXIV','eprint'],'All native arXiv family aliases are pinned');eq(aliases.PMC,['PMC','pmc'],'All native PMC family aliases are pinned');report.nativeContract={title:configPage.title,oldid:revision.revid,timestamp:revision.timestamp,revisionSha1:revision.sha1,sourceSha256:sha(lua),responseSha256:configRead.responseSha256,url:'https://pt.wikipedia.org/w/index.php?oldid='+revision.revid,aliases};
 for(const row of fixture.cases){
  const item={id:row.id,feature:row.feature,kind:row.kind,sourceSha256:sha(row.source),outputSha256:sha(row.expected),status:'passed',bundles:[]};
  try{
   for(const {name,api}of bundles){const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Artigo de teste',authorityControl:false,autoPreview:false,portals:false,dates:false,spelling:false},result=plan(api,row,cfg);eq(result.text,row.expected,row.id+': exact pure production output agrees with independent fixture');ok(result.edits.length>0,row.id+': a real feature adjustment exists');eq(plan(api,{...row,source:result.text},cfg).text,result.text,row.id+': pure production output is idempotent');item.bundles.push({name,sha256:manifest.files[name].sha256,sourceBound:true});}
   const query=source=>({action:'parse',format:'json',formatversion:'2',contentmodel:'wikitext',title:'Artigo de teste',prop:'text|parsewarnings|categories',disableeditsection:'1',disablelimitreport:'1',text:source}),before=await get(query(row.source),row.id+' before'),after=await get(query(row.expected),row.id+' after'),a=domOf(before.response),b=domOf(after.response);item.beforeResponseSha256=before.responseSha256;item.afterResponseSha256=after.responseSha256;item.beforeCheckedAt=before.checkedAt;item.afterCheckedAt=after.checkedAt;
   for(const doc of [a,b]){ok(doc.text.includes('Texto de abertura.'),row.id+': opening prose remains rendered');ok(doc.text.includes('Texto de encerramento.'),row.id+': closing prose remains rendered');}
   if(row.kind==='refs'){const left=references(a),right=references(b);eq(left.map(value=>value.body),row.beforeBodies,row.id+': original native citation order agrees with the independent body oracle');eq(right.map(value=>value.body),row.afterBodies,row.id+': adjusted citation order agrees with the independent body oracle');eq([...new Set(right.map(value=>value.body))].sort(),[...new Set(left.map(value=>value.body))].sort(),row.id+': no distinct source body disappears');if(row.id!=='anchor-a-b-a')eq(right,left,row.id+': ordered reference body and link identity remains exact');item.beforeReferences=left;item.afterReferences=right;}
   if(row.kind==='empty'){eq(references(b),[],'The adjusted empty-reference specimen has no invented citation body');eq(cs1Errors(b),[],'The adjusted empty-reference specimen has no visible citation error');ok(cs1Errors(b).length<=cs1Errors(a).length,'Empty-reference cleanup does not introduce a citation error');}
   if(row.kind==='table'||row.kind==='scope'){const left=tableData(a),right=tableData(b);eq(left.length,1,row.id+': one complete native table is present');eq(right,left,row.id+': ordered rendered cells, span values and literal classes/styles remain exact');item.beforeTables=left;item.afterTables=right;if(row.kind==='scope'){const leaves=b.tables[0].rows[1],group=b.tables[0].rows[0];eq(leaves.cells.filter(cell=>cell.scope==='col').length,row.expectedLeafScopes,'All and only individual leaf headers have the requested column scope');eq(group.cells.map(cell=>cell.scope),['',''],'The spanning group headers retain their original unannotated scope');item.leafColumnScopes=row.expectedLeafScopes;}}
   if(row.kind==='identifier'){const rendered=references(b);eq(rendered.length,1,'Exactly one publication source remains cited');const hits=rendered[0].hrefs.filter(url=>{const parsed=new URL(url);return row.field==='pmc'?['www.ncbi.nlm.nih.gov','pmc.ncbi.nlm.nih.gov'].includes(parsed.hostname)&&parsed.pathname.replace(/\/$/,'').endsWith('/PMC'+row.identifier):parsed.hostname==='arxiv.org'&&parsed.pathname==='/abs/'+row.identifier;});ok(hits.length>=1,'The corrected citation renders the exact encoded publication identifier and version');eq([...new Set(hits)].length,1,'Title and identifier links share one exact publication destination');eq(cs1Errors(b),[],'The corrected native citation has no CS1 identifier error');item.identifier=row.identifier;item.renderedIdentifierHref=hits[0];item.originalFieldUrl=row.originalUrl;item.beforeErrors=cs1Errors(a);item.afterErrors=cs1Errors(b);}
   item.renderedEvidenceChecked=true;report.nativeComparisons++;
  }catch(error){item.status='failed';report.status='failed';report.failures.push({id:row.id,error:String(error.message).replaceAll(root,'<local-path>')});}
  report.cases.push(item);
 }
 eq(sha(fs.readFileSync(__filename)),report.runnerSha256,'The native rendering runner did not change during validation');eq(sha(fs.readFileSync(manifestPath)),report.releaseManifestSha256,'The frozen release manifest did not change during native rendering');eq(sha(fs.readFileSync(fixturePath)),report.fixtureSha256,'The controlled inputs did not change during native rendering');ok(report.nativeComparisons>=8,'At least one native comparison per requested repair feature passed');report.checkedAt=new Date().toISOString();const target=path.join(root,'tests/v2100/NATIVE_REPAIR_RENDER_PROOF.json');fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,nativeComparisons:report.nativeComparisons,cases:report.cases.length,checks:report.checks,failures:report.failures,networkRequests:report.networkRequests}));if(report.failures.length)process.exitCode=1;
}
main().catch(error=>{report.status='failed';report.failures.push({error:String(error.message).replaceAll(root,'<local-path>')});fs.writeFileSync(path.join(cacheDir,'failed-render-run.json'),JSON.stringify(report,null,2)+'\n');console.error(JSON.stringify({status:'failed',error:String(error.message).replaceAll(root,'<local-path>')}));process.exitCode=1;});
