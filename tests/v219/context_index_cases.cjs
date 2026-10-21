'use strict';
// An independent tree serializer supplies expected container state at exact
// boundaries. It does not use the runtime tokenizer as its oracle.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).filter(v=>!v.startsWith('--')).map(v=>path.resolve(v));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(n=>path.join(root,'dist/2.19.0',n)));
const report={schemaVersion:1,kind:'independent-container-context-index',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
function eq(actual,expected,message){report.checks++;assert.deepEqual(actual,expected,message);}
const kinds=['template','argument','html','table','link','external'];
function serialize(tree){
 let source='',points=[],state={templates:[],html:[],tables:[],links:[],external:[]};
 const mark=()=>points.push({at:source.length,expected:JSON.parse(JSON.stringify(state))});
 const emit=node=>{
  if(typeof node==='string'){source+=node;mark();return;}
  const at=source.length,kind=node.kind;
  let opening,closing,key,frame;
  if(kind==='template'){opening='{{Modelo fictício|1=';closing='}}';key='templates';frame={start:at,size:2};}
  if(kind==='argument'){opening='{{{campo|';closing='}}}';key='templates';frame={start:at,size:3};}
  if(kind==='html'){opening='<div class="exemplo">';closing='</div>';key='html';frame={start:at,name:'div'};}
  if(kind==='table'){opening='\n{| class="wikitable"\n|-\n| ';closing='\n|}\n';key='tables';frame=at+1;}
  if(kind==='link'){opening='[[Tema fictício|';closing=']]';key='links';frame=at;}
  if(kind==='external'){opening='[https://example.invalid/ ';closing=']';key='external';frame=at;}
  mark();source+=opening;state[key].push(frame);mark();
  for(const child of node.children||[])emit(child);
  source+=closing;state[key].pop();mark();
 };
 mark();for(const node of tree)emit(node);mark();return {source,points};
}
function shape(value){return {templates:value.templates.map(f=>({start:f.start,size:f.size})),html:value.html.map(t=>({start:t.start,name:t.name})),tables:value.tables,links:value.links,external:value.external};}
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);
 report.bundles.push({bundle,sha256:sha(bytes),version:api.version,bytes:bytes.length});
 const run=(id,fn)=>{report.cases++;try{fn();}catch(error){report.status='failed';if(report.failures.length<100)report.failures.push({bundle,id,message:error.message});}};
 for(let seed=0;seed<1800;seed++)run('tree-'+seed,()=>{
  // Link and external-link leaf bodies stay plain. Other kinds can contain a
  // complete child. Each source differs in value, depth, and container order.
  let node='Texto literal '+seed+' com número '+(seed*17)+'.';
  const depth=1+seed%9;
  for(let level=0;level<depth;level++){
   const kind=kinds[(seed*13+level*5)%kinds.length];
   node={kind,children:kind==='link'||kind==='external'?['Rótulo '+seed+' '+level]:[node]};
  }
  const fixture=serialize(['Início '+seed+'.\n',node,'\nFim.']);
  eq(!!api.v219SyntaxContextIndex(fixture.source),true,'A complete independently serialized tree is indexed');
  for(const point of fixture.points){const actual=api.v219IndexedSyntaxContext(fixture.source,point.at);eq(!!actual,true,'Every complete boundary has a state');eq(shape(actual),point.expected,'Container roles and exact source offsets match the independent tree');}
  const copy=api.v219IndexedSyntaxContext(fixture.source,0);copy.templates.push({start:-1,size:99});copy.html.push({name:'wrong',start:-1});copy.tables.push(-1);copy.links.push(-1);copy.external.push(-1);
  eq(shape(api.v219IndexedSyntaxContext(fixture.source,0)),fixture.points[0].expected,'A caller cannot mutate cached state');
  const changed='X'+fixture.source;eq(shape(api.v219IndexedSyntaxContext(changed,0)),fixture.points[0].expected,'A changed draft cannot reuse old source offsets');
 });
 for(const [id,source]of [
  ['template','{{Modelo|1=Texto'],['argument','{{{campo|Texto'],['html','<div>Texto'],['table','{|\n| Dado'],['link','[[Tema'],['external','[https://example.invalid/ Rótulo'],['comment','<!-- Texto'],['literal','<nowiki>Texto'],['quotation','"Texto sem fechamento']
 ])run('incomplete-'+id,()=>eq(api.v219SyntaxContextIndex(source),null,'Incomplete source retains the conservative fallback'));
 for(const quoted of ['"{{Modelo|x}}"','«[[Tema]]»',"''{{Modelo|x}}''",'<nowiki>{{Modelo|x}}</nowiki>','<!-- {{Modelo|x}} -->'])run('opaque-'+report.cases,()=>{
  const source='Início '+quoted+' fim.',actual=api.v219IndexedSyntaxContext(source,source.length);
  eq(!!actual,true,'An opaque complete example does not make source incomplete');eq(shape(actual),{templates:[],html:[],tables:[],links:[],external:[]},'Opaque syntax has no container outside its block');
 });
 run('large-cache-budget',()=>{
  for(let n=0;n<35;n++){
   const source='Texto '+n+'\n'+Array.from({length:450},(_,i)=>'{{Modelo|1=Valor '+i+'}}').join('\n');
   eq(!!api.v219SyntaxContextIndex(source),true,'Ordinary large complete pages remain indexable');
  }
  const status=api.parserCacheStatus();eq(status.accountingConsistent,true,'Cache weight accounting is exact');eq(status.estimatedBytes<=status.maximumEstimatedBytes,true,'All parser caches remain within their shared bound');
 });
 run('deep-cache-budget',()=>{
  const source='{{Modelo|1='.repeat(500)+'Texto'+'}}'.repeat(500),index=api.v219SyntaxContextIndex(source);
  eq(index===null||index.weight<=25165824,true,'Deep source cannot create an oversized retained index');
  eq(api.parserCacheStatus().accountingConsistent,true,'Aborted deep indexing leaves cache accounting intact');
 });
 eq(sha(fs.readFileSync(file)),sha(bytes),'Runtime bytes remain frozen throughout this suite');
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
