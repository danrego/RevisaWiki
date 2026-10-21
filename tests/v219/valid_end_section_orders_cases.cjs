'use strict';
// Preservation regression only. The literal endpoints precede every product call.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const jsonHash=value=>sha(JSON.stringify(canonical(value))),root=path.resolve(__dirname,'../..');
const contractPath=path.join(__dirname,'valid_end_section_orders_contract.json'),fixturePath=path.join(__dirname,'valid_end_section_orders_fixtures.json');
const contractBytes=fs.readFileSync(contractPath),fixtureBytes=fs.readFileSync(fixturePath),contract=JSON.parse(contractBytes),fixtures=JSON.parse(fixtureBytes);
assert.equal(sha(fixtureBytes),contract.fixturesSha256,'The independently authored fixture file is exact');
assert.equal(fixtures.schemaVersion,1);assert.equal(fixtures.cases.length,contract.plannedDescriptors);
const files=process.argv.slice(2).map(file=>path.resolve(file));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(file=>path.join(root,'dist/2.19.0',file)));
assert.equal(files.length,2,'Pass exactly the core and complete bundle files');assert.equal(new Set(files).size,2);
const inventory=dir=>fs.readdirSync(dir,{withFileTypes:true}).filter(entry=>entry.isFile()).map(entry=>{const bytes=fs.readFileSync(path.join(dir,entry.name));return {file:entry.name,bytes:bytes.length,sha256:sha(bytes)};}).sort((a,b)=>a.file.localeCompare(b.file));
const initialDirectories=new Map([...new Set(files.map(file=>path.dirname(file)))].map(dir=>[dir,inventory(dir)]));
const report={schemaVersion:1,kind:contract.kind,status:'running',classification:contract.classification,runnerSha256:sha(fs.readFileSync(__filename)),contractSha256:sha(contractBytes),fixturesSha256:sha(fixtureBytes),bundles:[],cases:[],checks:0,failures:[],calculateAttempts:0,actualWholeActions:0,networkRequests:0,wikipediaWrites:0,newWriterCredit:false,semanticRenderEquivalence:false};
const savedFetch=globalThis.fetch,savedXHR=globalThis.XMLHttpRequest;
globalThis.fetch=()=>{report.networkRequests++;throw new Error('Network is disabled in this local regression');};
globalThis.XMLHttpRequest=class {constructor(){report.networkRequests++;throw new Error('XMLHttpRequest is disabled in this local regression');}};
const eq=(actual,expected,message)=>{report.checks++;assert.deepEqual(actual,expected,message);};
try{
 for(const file of files){
  const runtimeBytes=fs.readFileSync(file),runtimeSha256=sha(runtimeBytes),api=require(file),bundle=path.basename(file);
  eq(api.version,'2.19.0','The actual runtime version is bound');
  eq(api.defaults,fixtures.defaultBooleanSnapshot,'The preauthored default option snapshot is still the actual default');
  const rowBundle={bundle,sha256:runtimeSha256,runtimeSha256,version:api.version,runtimeDirectoryArtifacts:initialDirectories.get(path.dirname(file))};report.bundles.push(rowBundle);
  for(const fixture of fixtures.cases){
   const {source,expected,options}=fixture;
   // These assertions run before calculate; source and endpoint hashes never use result.text.
   eq(source,expected,'Every declared endpoint is exact preservation');
   eq(sha(source),fixture.sourceSha256,'Literal source pin');eq(jsonHash(options),fixture.optionsSha256,'Full literal option pin');eq(sha(expected),fixture.expectedEndpointSha256,'Literal endpoint pin');
   eq(jsonHash({source,options,expected,kind:'adjust'}),fixture.scenarioSha256,'The full preauthored descriptor is bound');
   const row={id:fixture.id,bundle,runtimeSha256,status:'running',kind:'preservation',capability:'endSectionOrder',evidenceKind:'whole-action-preservation-regression',newWriterCredit:false,expectedRepair:false,sourceSha256:fixture.sourceSha256,optionsSha256:fixture.optionsSha256,expectedEndpointSha256:fixture.expectedEndpointSha256,scenarioSha256:fixture.scenarioSha256,requestedOptionsSnapshot:options,enabledBooleanOptions:Object.keys(options).filter(key=>options[key]===true).sort(),scopeContext:Object.fromEntries(Object.entries(options).filter(([,value])=>typeof value!=='boolean')),context:fixture.context,legalSectionOrder:fixture.sectionOrder};
   report.cases.push(row);
   try{
    eq(api.headingMainArticleCandidates(source,options),[],'Literal H2 labels require no title lookup or target proof');
    report.calculateAttempts++;const first=api.calculate({kind:'adjust',source,originalSource:source,options});report.actualWholeActions++;
    report.calculateAttempts++;const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});report.actualWholeActions++;
    eq(first.text,expected,'The complete declared section order is preserved byte for byte');eq(second.text,expected,'The second whole action is unchanged');
    eq(first.preservation||[],[],'The actual pipeline has no preservation finding');eq(second.preservation||[],[],'The second pipeline has no preservation finding');
    eq(api.preservationAudit(source,first.text,options),[],'The separate production preservation entry point remains active');
    eq(api.safeComposition(source,first.text,options),'','The exact unchanged endpoint composes');
    eq((first.changes||[]).filter(change=>change.count>0),[],'Preservation must not claim an applied repair');eq((second.changes||[]).filter(change=>change.count>0),[],'The second click claims no applied repair');
    eq(first.hunks||[],[],'Preservation produces no edit hunks');eq(second.hunks||[],[],'The second click produces no edit hunks');
    row.actualEndpointSha256=sha(first.text);row.appliedIds=[];row.status='passed';
   }catch(error){row.status='failed';row.error=error.message;report.failures.push({id:fixture.id,bundle,message:error.message});}
  }
  eq(sha(fs.readFileSync(file)),runtimeSha256,'The actual bundle remains unchanged');
 }
}catch(error){report.failures.push({phase:'input-or-runtime-binding',message:error.message});}
finally{
 globalThis.fetch=savedFetch;globalThis.XMLHttpRequest=savedXHR;
 try{for(const [dir,pins]of initialDirectories)eq(inventory(dir),pins,'All runtime/data artifact bytes and membership remain unchanged');eq(sha(fs.readFileSync(contractPath)),report.contractSha256,'Contract is unchanged');eq(sha(fs.readFileSync(fixturePath)),report.fixturesSha256,'Fixtures are unchanged');eq(report.networkRequests,0,'No lookup/network request was attempted');}catch(error){report.failures.push({phase:'postflight',message:error.message});}
}
report.distinctScenarioCount=new Set(report.cases.map(row=>row.scenarioSha256)).size;report.status=report.failures.length?'failed':'passed';
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status==='failed')process.exitCode=1;
