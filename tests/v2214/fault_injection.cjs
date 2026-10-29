'use strict';
// Test-only writer faults. No guard or calculation dispatcher is replaced.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),Module=require('node:module'),parser=require('@babel/parser');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.4/RevisaWiki_v2_21_4.js'),original=fs.readFileSync(core,'utf8'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const source='{{Descrição curta|Pessoa de teste}}\n{{Info/Biografia|nome=Pessoa de teste|website=https://https://example.org/perfil}}\n\n'+
 "'''Pessoa de teste''' foi uma pessoa.\n\n"+
 'Texto<ref name="fonte">{{Citar web|título=Fonte de teste|url=https://example.org/fonte}}</ref> e outra citação<ref name="segunda">{{Citar web|título=Segunda fonte|url=https://example.org/segunda}}</ref>.\n\n'+
 '{| class="wikitable"\n! Coluna\n|-\n| Célula preservada\n|}\n\n[[Ficheiro:Imagem_original.jpg|miniatura|Legenda preservada]]\n\n{{Referências}}\n';
const specs=[
 {id:'reference-url',fn:'automaticIdenticalReferences',flag:'references',family:'references',from:'https://example.org/fonte',to:'https://example.org/fonte-alterada'},
 {id:'citation-url',fn:'citation',flag:'citations',family:'citations',from:'https://example.org/segunda',to:'https://example.org/segunda-alterada'},
 {id:'table-cell',fn:'automaticTables',flag:'automaticTableRepairs',family:'tables',from:'Célula preservada',to:'Célula alterada'},
 {id:'infobox-name',fn:'infobox',flag:'automaticInfoboxValues',family:'biography',from:'nome=Pessoa de teste',to:'nome=Outra pessoa'},
 {id:'image-file',fn:'v219AutomaticImageThumbnailTypo',flag:'automaticInfoboxImages',family:'biography',from:'Imagem_original.jpg',to:'Imagem_alterada.jpg'},
 {id:'unclosed-syntax',fn:'automaticSafeRepairs',flag:'syntaxRepairs',family:'syntax',from:'Legenda preservada',to:'Legenda preservada {{Incompleto'},
 {id:'writer-exception',fn:'automaticSpelling',flag:'automaticSpelling',family:'prose',throw:true}
];
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}}
function engine(chosen){
 const found=new Map(),ast=parser.parse(original),edits=[];
 function read(n,owner){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration')owner=n.id.name;
  if(owner==='v220LegacyCleanupStages'&&n.type==='CallExpression'&&n.callee.type==='Identifier'){
   const spec=chosen.find(s=>s.fn===n.callee.name);
   if(spec){found.set(spec.id,(found.get(spec.id)||0)+1);edits.push({start:n.start,end:n.end,text:'v2214FaultWriterOutput('+JSON.stringify(spec.id)+','+JSON.stringify(spec.flag)+',cfg,('+original.slice(n.start,n.end)+'))'});}
  }
  for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>read(x,owner));else if(v&&typeof v==='object')read(v,owner);}
 }
 read(ast);
 for(const spec of chosen)assert(found.has(spec.id),'A real writer call must exist in the active cleanup stage: '+spec.fn);
 const rules=chosen.map(s=>'if(id==='+JSON.stringify(s.id)+'&&typeof text==="string"'+(s.throw?'&&text.includes("Pessoa de teste")':'&&text.includes('+JSON.stringify(s.from)+')')+'){'+(s.throw?'throw new Error("Test-only writer failure");':'return text.replace('+JSON.stringify(s.from)+','+JSON.stringify(s.to)+');')+'}').join('');
 const helper='function v2214FaultWriterOutput(id,flag,cfg,text){if(cfg[flag]===false)return text;'+rules+'return text;}\n';
 let code=original;for(const e of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,e.start)+e.text+code.slice(e.end);
 code=code.slice(0,code.indexOf('const api='))+helper+code.slice(code.indexOf('const api='));
 parser.parse(code);const loaded=new Module(core,module);loaded.filename=core;loaded.paths=Module._nodeModulePaths(path.dirname(core));loaded._compile(code,core);return {api:loaded.exports,instrumentedSha256:sha(code),seams:chosen.map(({id,fn,flag,family})=>({id,fn,flag,family,activeCallSites:found.get(id)}))};
}
let checks=0,calculations=0;const failures=[],rows=[],eq=(a,b,label)=>{checks++;try{assert.deepEqual(a,b,label);}catch(e){failures.push({label,actual:a,expected:b});}};
function run(api,opts={}){const options={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa de teste',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-10-29',...opts};calculations++;try{const result=api.calculate({kind:'adjust',source,originalSource:source,options}),gate=api.v219AutomaticResultSafety(source,result);return {options,result,gate};}catch(e){return {options,exception:{name:e.name,message:e.message}};}}
const chosenSets=[...specs.map(s=>[s]),[specs[0],specs[2]],[specs[1],specs[3],specs[4]],[specs[0],specs[2],specs[5]],[specs[0],specs[6]]];
if(process.env.REVISAWIKI_FAULT_CASE===undefined){
 const {spawnSync}=require('node:child_process'),parts=[];
 for(let index=0;index<chosenSets.length;index++){
  const run=spawnSync(process.execPath,[__filename],{encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024,env:{...process.env,REVISAWIKI_FAULT_CASE:String(index),REVISAWIKI_TEST_RECEIPT:''}});
  if(run.error)throw run.error;
  let part;try{part=JSON.parse(run.stdout.trim().split('\n').at(-1));}catch(e){throw new Error('Isolated fault fixture failed: '+index+' '+run.stderr.slice(-1500));}
  parts.push(part);
 }
 const receipt={suite:'independent-writer-fault-injection-2.21.4',method:'One fresh process per AST-instrumented active writer call set; dispatch, source projections and guards unchanged',runtimeSha256:sha(original),sourceSha256:sha(source),baseline:process.env.REVISAWIKI_FAULT_BASELINE==='1',checks:parts.reduce((n,r)=>n+r.checks,0),calculations:parts.reduce((n,r)=>n+r.calculations,0),failures:parts.flatMap(r=>r.failures),rows:parts.flatMap(r=>r.rows)};
 if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify(receipt));assert.equal(receipt.failures.length,0,'All isolated writer cases pass');process.exit(0);
}
for(const [caseIndex,chosen]of chosenSets.entries()){if(caseIndex!==Number(process.env.REVISAWIKI_FAULT_CASE))continue;const built=engine(chosen),api=built.api,active=run(api),disabled=run(api,Object.fromEntries(chosen.map(s=>[s.flag,false]))),id=chosen.map(s=>s.id).join('+');
 if(process.env.REVISAWIKI_FAULT_BASELINE==='1'){
  eq(!!active.exception||active.gate?.accepted===false,true,'A deliberate writer fault is detected by the existing protection: '+id);
  eq(disabled.gate?.accepted,true,'Disabling the faulty writers permits a safe independent candidate: '+id);
 }else{
  eq(active.gate?.accepted,true,'The fresh independent candidate passes the unchanged final guards: '+id);
  eq(active.result?.automaticRecovery?.kind,'restricted-original-draft-recovery','Recovery is recorded internally without exposing warnings: '+id);
 }
 const result=process.env.REVISAWIKI_FAULT_BASELINE==='1'?disabled.result:active.result;
 if(result){
  eq(result.text!==source,true,'At least one independent safe correction is retained: '+id);
  for(const text of ['https://example.org/fonte','https://example.org/segunda','Célula preservada','nome=Pessoa de teste','Imagem_original.jpg','Legenda preservada'])eq(result.text.includes(text),true,'The original value remains after rejecting a writer: '+id+' '+text);
  for(const spec of chosen.filter(s=>!s.throw))eq(result.text.includes(spec.to),false,'The rejected mutation never reaches the final text: '+id+' '+spec.id);
  eq(result.text.includes('{{Incompleto'),false,'The recovered draft retains complete syntax: '+id);
  if(!chosen.some(s=>s.family==='prose'))eq(result.text.includes('{{Descrição curta|'),false,'A safe independent correction still reaches the final draft: '+id);
 }
 rows.push({id,instrumentedSha256:built.instrumentedSha256,seams:built.seams,active:{exception:active.exception,gate:active.gate,recovery:active.result?.automaticRecovery,candidateSha256:active.result?sha(active.result.text):null},disabled:{exception:disabled.exception,gate:disabled.gate,candidateSha256:disabled.result?sha(disabled.result.text):null}});
}
const receipt={suite:'independent-writer-fault-injection-2.21.4',method:'Private AST instrumentation only at real flag-controlled writer call sites inside the active cleanup stage; dispatch and guards unchanged',runtimeSha256:sha(original),sourceSha256:sha(source),baseline:process.env.REVISAWIKI_FAULT_BASELINE==='1',checks,calculations,failures,rows};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'Writer recovery must retain source content and independent work');
