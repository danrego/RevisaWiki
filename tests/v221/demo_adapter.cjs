'use strict';
// The shipped worker adapter, full engine and independent fixture endpoints.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),runtime=path.resolve(process.env.REVISAWIKI_BUNDLE||path.join(root,'dist/2.21.0/RevisaWiki_v2_21_0_completo.js')),
 engine=fs.readFileSync(runtime,'utf8'),adapterPath=path.join(root,'src/demo_v221/motor.js'),adapter=fs.readFileSync(adapterPath,'utf8'),
 fixturePath=path.join(root,'tests/v221/demo_examples.json'),fixtures=JSON.parse(fs.readFileSync(fixturePath)),api=require(runtime),sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const messages=[],imports=[],context={postMessage:message=>messages.push(structuredClone(message)),setTimeout,clearTimeout,TextEncoder,TextDecoder,URL,console};
context.self=context;
context.importScripts=name=>{assert.equal(name,'../RevisaWiki_v2_21_0_completo.js');imports.push(name);vm.runInContext(engine,sandbox,{filename:path.basename(runtime)});};
const sandbox=vm.createContext(context);
vm.runInContext(adapter,sandbox,{filename:'motor.js'});
const report={kind:'v221-offline-demonstration-adapter',runtime:{file:path.basename(runtime),sha256:sha(engine)},adapterSha256:sha(adapter),fixtureSha256:sha(fs.readFileSync(fixturePath)),examples:fixtures.length,cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0};
let id=0;
for(const example of fixtures){
 try{
  const job={kind:example.operation==='talkHeader'?'talk-example':'adjust',articleSource:example.articleSource||'',source:example.source,originalSource:example.source,options:example.options},start=messages.length;
  context.onmessage({data:{type:'calculate',id:++id,job}});
  const outputs=messages.slice(start),results=outputs.filter(row=>row.type==='result');assert.equal(results.length,1,example.id+' one final result');report.checks++;
  assert(!outputs.some(row=>row.type==='error'),example.id+' no worker error');report.checks++;
  const result=results[0].result;assert.equal(result.text,example.expected,example.id+' independent literal endpoint');report.checks++;
  if(job.kind==='adjust'){
   const raw=api.calculate(job),gate=api.v219AutomaticResultSafety(example.source,raw);
   assert.equal(result.text,gate.accepted?raw.text:example.source,example.id+' authoritatively accepted or exact original');report.checks++;
   assert.equal(result.demoSafety.accepted,gate.accepted,example.id+' adapter reports actual gate decision');report.checks++;
   assert.equal(result.demoSafety.code,gate.code,example.id+' adapter retains actual gate code');report.checks++;
   assert(outputs.some(row=>row.type==='progress'),example.id+' calculation progress is forwarded');report.checks++;
   if(!gate.accepted){assert.equal(result.text,example.source,example.id+' rejected proposal cannot reach the viewer');report.checks++;}
   report.cases.push({id:example.id,status:'passed',sourceSha256:sha(example.source),outputSha256:sha(result.text),articleGateAccepted:gate.accepted,articleGateCode:gate.code,progressEvents:outputs.filter(row=>row.type==='progress').length});
  }else{
   const plan=api.v25TalkPreparationPlan(example.source,job.articleSource,example.options);assert.equal(result.text,plan.text,example.id+' dedicated talk preparation remains intact');report.checks++;
   report.cases.push({id:example.id,status:'passed',sourceSha256:sha(example.source),outputSha256:sha(result.text),talkPreparationPlan:true,articleCompositionGateApplied:false});
  }
 }catch(error){report.failures.push({id:example.id,message:String(error.message)});report.cases.push({id:example.id,status:'failed'});}
}
assert.equal(imports.length,1,'The adapter imports exactly the frozen full engine');report.checks++;
if(process.env.REVISAWIKI_DEMO_REPORT)fs.writeFileSync(process.env.REVISAWIKI_DEMO_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({kind:report.kind,examples:report.examples,checks:report.checks,failures:report.failures}));
if(report.failures.length)process.exitCode=1;
