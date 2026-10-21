'use strict';
// The independent cases define literal bank intervals. Differential cases
// compare against the retained reader, including its conservative refusals.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(f=>path.resolve(f)),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(n=>path.join(root,'dist/2.19.0',n)));
const report={schemaVersion:1,kind:'bounded-native-renderer-context-cache',runnerSha256:hash(fs.readFileSync(__filename)),status:'passed',bundles:[],cases:0,checks:0,failures:[],evidenceKinds:{independentIntervals:0,unchangedAlgorithmDifferential:0,cacheMutation:0,bounds:0,wholeAction:0},networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},ok=(a,m)=>{report.checks++;assert.ok(a,m);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);report.bundles.push({bundle,sha256:hash(bytes),bytes:bytes.length,version:api.version});
 const run=(id,kind,fn)=>{report.cases++;report.evidenceKinds[kind]++;try{fn();}catch(error){report.status='failed';if(report.failures.length<100)report.failures.push({bundle,id,message:error.message});}};
 const nodeFor=(source,start=0,end=source.length)=>({start,end,size:2,depth:0}),treeFor=(source)=>({nodes:[nodeFor(source)],unclosed:[]});
 const bodies=['Fonte literal','<ref name="a">Fonte literal</ref>','\n<ref name="a">{{Citar web|título=Fonte|url=https://example.invalid/a}}</ref>\n','Texto Ω e 甲乙'];
 // These are exactly the names accepted by the retained lexical context
 // reader. This cache does not broaden the reader to any extra aliases.
 for(const name of ['Referências','Reflist','References','referências','reflist','references'])for(const body of bodies)for(const group of ['', 'nota', 'lower-alpha', 'grupo literal'])for(const order of [0,1]){
  const prefix='{{'+name+'|',groupField='grupo='+group+'|',bank='refs='+body,source=prefix+(order?bank+'|'+groupField.slice(0,-1):groupField+bank)+'}}',
    bankStart=source.indexOf('refs=')+5,bankEnd=bankStart+body.length,parsed=treeFor(source);
  for(const at of [...new Set([0,1,2,bankStart-1,bankStart,bankStart+1,bankEnd-1,bankEnd,source.length-1,source.length])])run(hash(source+':'+at),'independentIntervals',()=>{
   const outside=!(0<at&&at<source.length),expected=outside?{valid:true,group:''}:{valid:bankStart<=at&&at<bankEnd,group};
   eq(api.v219RendererContext(source,at,parsed),expected,'A literal refs value owns only its exact half-open interval');
   eq(api.v219RendererContext(source,at,parsed),expected,'Warm lookup retains literal group and boundary');
  });
 }
 for(const source of ['{{Modelo desconhecido|refs=<ref name="a">Fonte</ref>}}','{{Referências|refs=<ref name="a">Fonte</ref>|grupo={{X}}}}','{{Referências|refs=<ref name="a">Fonte</ref>|grupo=a|group=b}}','{{Referências|refs=<ref name="a">Fonte</ref>|sem igual}}','{{Referências|refs=<ref name="a">Fonte</ref>|grupo=a\nb}}'])run('refusal-'+hash(source),'independentIntervals',()=>{
  const at=source.indexOf('<ref'),parsed=treeFor(source);eq(api.v219RendererContext(source,at,parsed),{valid:false,group:''},'Unknown, dynamic, competing or malformed fields retain the old refusal');
 });
 let state=0x219ca42;const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;},atoms=['Texto','{{X|a=b}}','[[Tema|Nome]]','{{{campo|valor}}}','<nowiki>|=</nowiki>','[https://example.invalid/?q=a|b Texto]','<!-- |= -->','\n','grupo=a','refs=Texto','"',"'",'|','=','}}','{{'];
 for(let index=0;index<9000;index++){
  const fields=[];for(let n=0,length=1+random()%9;n<length;n++)fields.push(atoms[random()%atoms.length]);
  const source='{{'+['Referências','Reflist','References','Outro','Notas e referências'][random()%5]+'|'+fields.join('|')+'}}',at=random()%(source.length+1),parsed=treeFor(source);
  if(index%11===0)parsed.unclosed.push({start:Math.max(0,at-1),size:2});
  if(index%13===0)parsed.nodes.push({start:Math.max(0,at-2),end:Math.min(source.length,at+2),size:2,depth:1});
  if(index%17===0)parsed.nodes[0].size=3;
  if(index%19===0)parsed.nodes[0].start=0.5;
  run('differential-'+index,'unchangedAlgorithmDifferential',()=>{const expected=api.v219LegacyRendererContext(source,at,parsed);eq(api.v219RendererContext(source,at,parsed),expected,'Cold cached context delegates the unchanged grammar and ancestor rules');eq(api.v219RendererContext(source,at,parsed),expected,'Warm cached context equals the unchanged reader');});
 }
 for(let index=0;index<30;index++)run('mutation-and-stale-'+index,'cacheMutation',()=>{
  const source='{{Referências|grupo=g'+index+'|refs=<ref name="a">Fonte</ref>}}',at=source.indexOf('<ref'),parsed=treeFor(source),expected={valid:true,group:'g'+index},first=api.v219RendererContext(source,at,parsed);
  eq(first,expected,'Fresh context');first.valid=false;first.group='Outra';eq(api.v219RendererContext(source,at,parsed),expected,'Caller mutation cannot change a cached context');
  const changed=source.replace('grupo=g'+index,'grupo=h'+index);eq(api.v219RendererContext(changed,at,treeFor(changed)),{valid:true,group:'h'+index},'Equal-size changed source cannot reuse an earlier group');
  parsed.unclosed.push({start:1,size:2});eq(api.v219RendererContext(source,at,parsed),{valid:false,group:''},'Ancestor incompleteness is rechecked independently of metadata cache');parsed.unclosed.length=0;
 });
 for(let index=0;index<12;index++)run('source-bounds-'+index,'bounds',()=>{
  const source='{{Referências|refs='+('Fonte literal '+index+' ').repeat(13000)+'}}',at=source.indexOf('Fonte'),parsed=treeFor(source);eq(api.v219RendererContext(source,at,parsed),{valid:true,group:''},'Large literal value has unchanged context');const s=api.v219RendererCacheStatus();ok(s.entries<=4,'At most four cached source documents');ok(s.bytes<=s.maximumBytes,'Total metadata/source weight stays bounded');ok(s.nodeProfiles<=8192,'Per-source node-profile bound');
 });
 run('same-source-node-bound','bounds',()=>{
  const part='{{Referências|refs=Fonte}}',source=part.repeat(2200);for(let n=0;n<2200;n++){const start=n*part.length;api.v219RendererContext(source,start+part.indexOf('Fonte'),{nodes:[nodeFor(source,start,start+part.length)],unclosed:[]});}const s=api.v219RendererCacheStatus();ok(s.nodeProfiles<=8192,'Per-document cap also limits many tiny renderer nodes');ok(s.bytes<=s.maximumBytes,'Many-node source remains in byte budget');
 });
 run('oversize-old-reader','bounds',()=>{
  const source='{{Referências|refs='+'A'.repeat(4194305)+'}}',parsed=treeFor(source),at=source.indexOf('A'),before=api.v219RendererCacheStatus();eq(api.v219RendererContext(source,at,parsed),api.v219LegacyRendererContext(source,at,parsed),'Oversized input uses the exact old reader');eq(api.v219RendererCacheStatus(),before,'Oversized source adds no persistent cache entry');
 });
 const options={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',citations:true,dates:true};
 for(const source of ['Texto.<ref name="a"/>\n{{Referências|refs=<ref name="a">{{Citar web|título=Fonte literal|data=5 March 2001}}</ref>}}','Texto.<ref group="nota" name="a"/>\n{{Referências|grupo=nota|refs=<ref name="a">{{Citar web|título=Fonte literal|data=5 March 2001}}</ref>}}'])run('whole-action-'+hash(source),'wholeAction',()=>{
  const expected=source.replace('5 March 2001','5 de março de 2001'),actual=api.calculate({kind:'adjust',source,options});eq(actual.text,expected,'A complete action reaches the independently expected native bank endpoint');eq(api.calculate({kind:'adjust',source:expected,options}).text,expected,'A second action is idempotent');eq(api.preservationAudit(source,actual.text,options),[],'Actual endpoint passes independent preservation entry point');
 });
 eq(hash(fs.readFileSync(file)),hash(bytes),'Runtime bytes remained unchanged');
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
