'use strict';
// A cache may reuse the unchanged reader, never its mutable return containers.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(f=>path.resolve(f)),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(n=>path.join(root,'dist/2.19.0',n)));
const report={schemaVersion:1,kind:'immutable-bounded-brace-part-reader-cache',runnerSha256:hash(fs.readFileSync(__filename)),status:'passed',bundles:[],cases:0,checks:0,failures:[],evidenceKinds:{independentGrammar:0,unchangedAlgorithmDifferential:0,cacheMutation:0,bounds:0,wholeAction:0},networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},ok=(v,m)=>{report.checks++;assert.ok(v,m);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);report.bundles.push({bundle,sha256:hash(bytes),bytes:bytes.length,version:api.version});
 const run=(id,kind,fn)=>{report.cases++;report.evidenceKinds[kind]++;try{fn();}catch(e){report.status='failed';if(report.failures.length<100)report.failures.push({bundle,id,message:e.message});}};
 const independent=(body,parts)=>{let at=0;return parts.map(text=>{const p={text,start:at,end:at+text.length};at+=text.length+1;return p;});};
 const atoms=['Texto','Água','Ωmega','甲乙','x=y','[[Tema|rótulo]]','{{Modelo|a=b|c=d}}','{{{campo|padrão}}}','{{{{{modelo|X}}}|a=b}}','[https://example.invalid/?a=1|2 Rótulo]','<!-- comentário | literal -->','<nowiki>{{x|y}}</nowiki>','<code>A|B</code>','<math>a|b</math>','<span title="a|b">Texto</span>'];
 for(const a of atoms)for(const b of atoms)for(const c of ['', '1', 'último']){
  const body=[a,b,c].join('|'),expected=independent(body,[a,b,c]);
  for(const strict of [true,false])run(hash(body+strict),'independentGrammar',()=>{eq(api.v219CachedBraceParts(body,strict),expected,'Independent literal nested/link/opaque grammar retains every part and offset');eq(api.v219CachedBraceParts(body,strict),expected,'A cache hit retains all three offsets and byte slices');});
 }
 let state=0x219bace;const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;},alphabet=['{','}','[',']','|','=','<','>','/','!','-','"',"'",' ','\n','a','Ω','甲'];
 for(let index=0;index<6000;index++){
  let body='';const n=3+random()%160;for(let i=0;i<n;i++)body+=alphabet[random()%alphabet.length];
  for(const strict of [true,false])run('differential-'+index+'-'+strict,'unchangedAlgorithmDifferential',()=>{const expected=api.v219LegacyBraceParts(body,strict);eq(api.v219CachedBraceParts(body,strict),expected,'The cache delegates exactly to the unchanged reader, including refusals');eq(api.v219CachedBraceParts(body,strict),expected,'Warm and cold outcomes agree');});
 }
 for(const body of ['A|B','{{Modelo|a|b}}|C','[https://example.invalid/ Rótulo]|D','{{sem fechamento|A|B','[[sem fechamento|X'])for(const strict of [false,true])run('mutation-'+hash(body+strict),'cacheMutation',()=>{
  const expected=api.v219LegacyBraceParts(body,strict),first=api.v219CachedBraceParts(body,strict);
  if(first){first[0].text='corrompido';first[0].start=12345;first.push({text:'extra',start:0,end:0});first.length=1;}
  eq(api.v219CachedBraceParts(body,strict),expected,'Mutating a caller result cannot poison a later cached outcome');
 });
 for(let index=0;index<3000;index++)api.v219CachedBraceParts('A'+index+'|B'+index,index%2===0);
 run('small-entry-bound','bounds',()=>{const s=api.v219BracePartCacheStatus();ok(s.small.entries<=s.small.maximumEntries,'Small-entry bound');ok(s.small.bytes<=s.small.maximumBytes,'Small-byte bound');});
 for(let index=0;index<8;index++){
  const body='Cabeçalho'+index+'|'+('Texto literal '+index+' ').repeat(15000)+'|Fim';
  run('large-'+index,'bounds',()=>{const expected=api.v219LegacyBraceParts(body,true),actual=api.v219CachedBraceParts(body,true);eq(actual,expected,'Large-body cache preserves exact slices');actual[0].end=0;eq(api.v219CachedBraceParts(body,true),expected,'Large-body containers are isolated');const s=api.v219BracePartCacheStatus();ok(s.large.entries<=4,'Large-entry bound');ok(s.large.bytes<=16777216,'Large-byte bound');});
 }
 const huge='A'.repeat(4194305)+'|B';run('oversize-refusal-to-cache','bounds',()=>{const before=api.v219BracePartCacheStatus();eq(api.v219CachedBraceParts(huge,true),api.v219LegacyBraceParts(huge,true),'An oversized body still uses the exact previous parser');eq(api.v219BracePartCacheStatus(),before,'Oversized reads add no persistent cached source');});
 const cfg={...Object.fromEntries(Object.keys(api.defaults).map(k=>[k,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',citations:true,dates:true};
 for(const source of ['{{Citar web|título=Fonte literal|data=5 March 2001}}','{{Citar web|título=Fonte literal|data=5 March 2001|url=https://example.invalid/fonte}}'])run('whole-action-'+hash(source),'wholeAction',()=>{
  const expected=source.replace('5 March 2001','5 de março de 2001');eq(api.calculate({kind:'adjust',source,options:cfg}).text,expected,'A warmed reader reaches the independent exact whole-action endpoint');eq(api.calculate({kind:'adjust',source:expected,options:cfg}).text,expected,'Actual whole action remains idempotent');
 });
 eq(hash(fs.readFileSync(file)),hash(bytes),'Runtime immutable');
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
