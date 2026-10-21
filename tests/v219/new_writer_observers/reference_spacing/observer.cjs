'use strict';
// Preauthored whole-action observer with explicit artifact paths.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const args=process.argv.slice(2),arg=name=>args.find(v=>v.startsWith('--'+name+'='))?.slice(name.length+3),sha=v=>crypto.createHash('sha256').update(v).digest('hex'),canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const files=args.filter(v=>!v.startsWith('--')).map(v=>fs.realpathSync(v));
assert.equal(files.length,2,'Two explicit future runtime files');assert.notEqual(files[0],files[1]);
for(const name of ['data','fixtures','contract','recipe','source-builder','descriptor-pins','output'])assert(arg(name),'Missing explicit '+name);
assert(args.includes('--execute-authorized-spacing-controls'),'Explicit spacing test execution marker is required');
assert.equal(path.basename(files[0]),'RevisaWiki_v2_19_0.js');assert.equal(path.basename(files[1]),'RevisaWiki_v2_19_0_completo.js');
const data=fs.realpathSync(arg('data'));for(const file of files)assert.equal(data,fs.realpathSync(path.join(path.dirname(file),'RevisaWiki_v2_19_0_dados.js')));
const inputFiles=[__filename,process.execPath,...files,data,...['fixtures','contract','recipe','source-builder','descriptor-pins'].map(n=>fs.realpathSync(arg(n)))],pin=file=>{const raw=fs.readFileSync(file);return{file:fs.realpathSync(file),bytes:raw.length,sha256:sha(raw)};},before=inputFiles.map(pin),fixture=JSON.parse(fs.readFileSync(arg('fixtures'))),descriptorPins=JSON.parse(fs.readFileSync(arg('descriptor-pins')));
assert.equal(fixture.rows.length,52);assert.equal(fixture.bundleRows,104);assert.equal(fixture.calculateCallsPlanned,208);
assert.equal(descriptorPins.fixtureSha256,sha(fs.readFileSync(arg('fixtures'))));assert.equal(descriptorPins.rows.length,52);
for(let i=0;i<fixture.rows.length;i++){const row=fixture.rows[i],expected=descriptorPins.rows[i];assert.deepEqual({ordinal:i,id:row.id,sourceSha256:sha(row.source),expectedEndpointSha256:sha(row.expected),optionsSha256:sha(JSON.stringify(canonical(row.options))),descriptorSha256:sha(JSON.stringify(canonical(row)))},expected,'Exact original descriptor/source/options/expected and order');}
let network=0;const deny=()=>{network++;throw Error('No network in Source-prepared punctuation observer');};globalThis.fetch=deny;globalThis.XMLHttpRequest=class{constructor(){deny();}};
const report={kind:'reference-period-spacing-content-model-whole-actions',status:'running',rows:[],bundles:[],checks:0,failures:[],calls:{calculate:0,firstCalculate:0,secondCalculate:0,preservationAudit:0,safeComposition:0},pinsBefore:before,networkRequests:0,wikipediaWrites:0,writerPositiveCredit:0,semanticAcceptanceClaim:false};
const save=()=>fs.writeFileSync(arg('output'),JSON.stringify(report,null,2)+'\n');
const check=(row,key,actual,expected)=>{row.checks++;report.checks++;try{assert.deepEqual(actual,expected,key);}catch(error){row.status='failed';row.failures.push(key);report.failures.push({id:row.id,runtimeSha256:row.runtimeSha256,key,message:String(error.stack||error)});}};
try{
 for(const file of files){const api=require(file),runtimeSha256=sha(fs.readFileSync(file));report.bundles.push({file,runtimeSha256,sha256:runtimeSha256,version:api.version});for(const name of ['calculate','preservationAudit','safeComposition'])assert.equal(typeof api[name],'function',name);
  for(let i=0;i<fixture.rows.length;i++){const test=fixture.rows[i],row={...descriptorPins.rows[i],kind:'whole-action',runtimeSha256,status:'running',checks:0,failures:[]};report.rows.push(row);save();
   try{
    const keys=Object.keys(api.defaults).filter(k=>typeof api.defaults[k]==='boolean');assert.equal(keys.length,80,'Current Source declares80 boolean options');for(const key of keys)assert.equal(typeof test.options[key],'boolean','Original explicit boolean '+key);
    report.calls.calculate++;report.calls.firstCalculate++;row.first=api.calculate({kind:'adjust',source:test.source,options:structuredClone(test.options)});save();
    assert.equal(typeof row.first.text,'string','First result exposes literal text');
    report.calls.calculate++;report.calls.secondCalculate++;row.second=api.calculate({kind:'adjust',source:row.first.text,options:structuredClone(test.options)});save();
    report.calls.preservationAudit++;row.audit=api.preservationAudit(test.source,row.first.text,structuredClone(test.options));save();
    report.calls.safeComposition++;row.composition=api.safeComposition(test.source,row.first.text,structuredClone(test.options));save();
    // Every actual result is persisted before evaluating endpoint/guard assertions.
    row.actualSha256=sha(row.first.text);row.secondSha256=sha(row.second.text);
    check(row,'first-exact-preauthored-endpoint',row.first.text,test.expected);
    check(row,'second-exact-preauthored-endpoint',row.second.text,test.expected);
    check(row,'first-internal-preservation',row.first.preservation||[],[]);
    check(row,'second-internal-preservation',row.second.preservation||[],[]);
    check(row,'standalone-preservation-audit',row.audit,[]);
    check(row,'standalone-safe-composition',row.composition,'');
   }catch(error){row.status='failed';row.error=String(error.stack||error);report.failures.push({id:row.id,runtimeSha256,message:row.error});}
   if(row.status==='running')row.status='passed';save();
  }
 }
 report.status=report.failures.length?'failed':'passed';
}catch(error){report.status='setup-failed';report.failures.push({phase:'setup',message:String(error.stack||error)});}
finally{
 report.pinsAfter=inputFiles.map(pin);report.inputBytesUnchanged=JSON.stringify(report.pinsBefore)===JSON.stringify(report.pinsAfter);report.networkRequests=network;
 if(!report.inputBytesUnchanged||network){report.status='input-or-network-failed';report.failures.push({phase:'input-or-network',inputBytesUnchanged:report.inputBytesUnchanged,networkRequests:network});}
 report.limits=['Only52 preauthored fictional whole-action descriptors are asserted, not articles or full MOS coverage.','Existing producer scope is tested; no new writer/default/alert is credited.','Network veto counters cover the installed in-process veto, not an operating-system trace.','First/second output and standalone protections are separate observed obligations.','No corpus/reader/native advance or semantic qualification is granted by this report.'];save();process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
}
