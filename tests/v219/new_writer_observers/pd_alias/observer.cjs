'use strict';
// Direct planner controls. No calculate, Lua, browser or publication coverage.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const fixturePaths=JSON.parse(fs.readFileSync(path.join(__dirname,'INPUTS.json'),'utf8')).fixtures.map(file=>path.resolve(__dirname,file));
const fixtures=fixturePaths.flatMap(file=>JSON.parse(fs.readFileSync(file,'utf8')).rows);
const runtimes=process.argv.slice(2).map(file=>path.resolve(file));
assert.equal(runtimes.length,2);assert.notEqual(runtimes[0],runtimes[1]);assert.equal(fixtures.length,41);
let network=0;global.fetch=()=>{network++;throw Error('Network forbidden');};global.XMLHttpRequest=class{constructor(){network++;throw Error('Network forbidden');}};
const files=[__filename,path.join(__dirname,'INPUTS.json'),...fixturePaths,...runtimes,path.join(path.dirname(runtimes.find(file=>!file.endsWith('_completo.js'))),'RevisaWiki_v2_19_0_dados.js')];
const before=files.map(file=>({file,sha256:sha(fs.readFileSync(file))}));
const report={kind:'existing-talk-header-alias-direct-planner-controls',status:'passed',rows:[],checks:0,failures:[],directPlanCalls:0,calculateCalls:0,standaloneGuardCalls:0,nativeBrowser:0,networkRequests:0,wikipediaWrites:0};
for(const file of runtimes){
 const api=require(file),runtimeSha256=sha(fs.readFileSync(file));
 for(const fixture of fixtures){
  const row={id:fixture.id,runtimeSha256,sourceSha256:fixture.sourceSha256,expectedEndpointSha256:fixture.expectedEndpointSha256,options:fixture.options,failures:[]};
  const check=(id,fn)=>{report.checks++;try{fn();}catch(error){row.failures.push({id,message:error.message});}};
  try{
   check('frozen-source',()=>assert.equal(sha(fixture.source),fixture.sourceSha256));
   check('frozen-expected',()=>assert.equal(sha(fixture.expected),fixture.expectedEndpointSha256));
   row.first=api.v25TalkPreparationPlan(fixture.source,fixture.article,fixture.options);report.directPlanCalls++;
   row.second=api.v25TalkPreparationPlan(row.first.text,fixture.article,fixture.options);report.directPlanCalls++;
   check('complete-preauthored-endpoint',()=>assert.equal(row.first.text,fixture.expected));
   check('second-click',()=>assert.equal(row.second.text,row.first.text));
  }catch(error){row.failures.push({id:'direct-planner-exception',message:error.stack});}
  row.status=row.failures.length?'failed':'passed';report.rows.push(row);report.failures.push(...row.failures.map(error=>({caseId:row.id,runtimeSha256,...error})));
 }
}
report.pinsBefore=before;report.pinsAfter=files.map(file=>({file,sha256:sha(fs.readFileSync(file))}));
try{assert.deepEqual(report.pinsAfter,before);assert.equal(network,0);}catch(error){report.failures.push({id:'final-input-or-network-check',message:error.message});}
report.networkRequests=network;report.status=report.failures.length?'failed':'passed';
process.stdout.write(JSON.stringify(report,null,2)+'\n');process.exitCode=report.failures.length?1:0;
