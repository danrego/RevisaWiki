'use strict';
// Publish only neutral qualification receipts, never captured editor content.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function summarize(folder,manifestFile,contractFile){
 const manifestBytes=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestBytes),contractBytes=fs.readFileSync(contractFile),contract=JSON.parse(contractBytes);
 assert.equal(manifest.version,'2.20.0');assert.equal(contract.productionDeadlineMilliseconds,60000);assert.equal(contract.flowsPerBrowser,54);assert.equal(contract.cases.length,54);
 const expectedIds=contract.cases.map(row=>row.id),browsers=[];
 const fields=['runnerSha256','fixtureHtmlSha256','fixtureScriptSha256','cyclicFixtureSha256'];let shared;
 for(const browser of contract.browsers){
  const file=path.join(folder,browser.toLowerCase()+'_ui_release.json'),bytes=fs.readFileSync(file),r=JSON.parse(bytes);
  assert.equal(r.kind,'native-ui-release-qualification-2.20.0');assert.equal(r.status,'passed');assert.equal(r.browser,browser);assert.equal(r.testCount,54);assert.equal(r.cases.length,54);assert.deepEqual(r.cases.map(row=>row.id),expectedIds);assert(r.cases.every(row=>row.status==='passed'));assert.deepEqual(r.failures,[]);assert.deepEqual(r.blockedRequests,[]);
  assert.equal(r.candidate.version,manifest.version);assert.equal(r.candidate.manifestSha256,sha(manifestBytes));assert.equal(r.runnerSha256,contract.runnerSha256);
  for(const kind of ['core','complete','data']){const bound=r.candidate.bindings[kind],pin=manifest.files[bound.file];assert(pin);assert.equal(bound.bytes,pin.bytes);assert.equal(bound.sha256,pin.sha256);}
  const current=Object.fromEntries(fields.map(key=>{assert.match(r[key],/^[a-f0-9]{64}$/);return[key,r[key]];}));if(shared)assert.deepEqual(current,shared);else shared=current;
  for(const key of ['WikipediaWrites','mutatingHttpRequests','screenshots','clipboardWrites'])assert.equal(r[key],0,key);
  assert.equal(r.productionTimeoutMilliseconds,60000);assert.equal(r.timeoutChanged,false);assert.equal(r.knownExtremeTimeoutSourcesRepeated,false);assert.equal(r.ownedSessionClosed,true);if(browser==='Safari')assert.equal(r.ownedSessionDeletionAcknowledged,true);
  const deadlines=r.cases.filter(row=>row.id.endsWith('-real-sixty-second-worker-deadline'));assert.equal(deadlines.length,2);
  for(const row of deadlines){assert(row.elapsedFromDispatchMilliseconds>=59500&&row.elapsedFromDispatchMilliseconds<67000);assert.equal(row.before.source,row.after.source);assert.equal(row.before.summary,row.after.summary);assert.equal(row.before.minor,row.after.minor);assert.equal(row.after.undoDisabled,true);assert.equal(row.after.workerResults,0);assert.equal(row.undo.source,row.before.source+'\nTexto manual depois do limite.');assert.equal(row.undo.summary,row.before.summary);assert.equal(row.undo.minor,row.before.minor);}
  browsers.push({browser,version:r.browserVersion,status:r.status,flows:r.testCount,checks:r.checks,privateReceiptSha256:sha(bytes),ownedSessionClosed:r.ownedSessionClosed,...(browser==='Safari'?{ownedSessionDeletionAcknowledged:true}:{}),cases:r.cases.map(row=>({id:row.id,status:row.status,milliseconds:row.milliseconds,...(row.elapsedFromDispatchMilliseconds!==undefined?{actualDeadlineElapsedMilliseconds:row.elapsedFromDispatchMilliseconds}:{} )}))});
 }
 return{kind:'native-ui-release-summary-2.20.0',status:'passed',version:'2.20.0',manifestSha256:sha(manifestBytes),contractSha256:sha(contractBytes),runtimeFiles:manifest.files,...shared,browsers,flows:browsers.reduce((sum,row)=>sum+row.flows,0),checks:browsers.reduce((sum,row)=>sum+row.checks,0),actualProductionDeadlineFlows:6,productionDeadlineMilliseconds:60000,deadlineChanged:false,knownRealTimeoutSourcesRepeated:false,wikipediaWrites:0,mutatingHttpRequests:0,screenshots:0,clipboardWrites:0,scope:'Installed native browsers on macOS, executing the pinned release through local fictional MediaWiki, textSelection and source2017 adapters. This does not claim a live Wikipedia deployment or the complete native VisualEditor or CodeMirror packages.',privacy:'Editor snapshots and machine-local evidence paths are omitted. Private receipts remain bound by SHA-256. Historical executions are not relabeled as qualification of this release.'};
}
if(require.main===module){try{const[folder,manifest,contract,output]=process.argv.slice(2);assert(folder&&manifest&&contract&&output,'Arguments: private report folder, manifest, contract, public output');const result=summarize(folder,manifest,contract);fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({status:result.status,flows:result.flows,checks:result.checks})+'\n');}catch(error){process.stderr.write(String(error.message)+'\n');process.exitCode=1;}}
module.exports={summarize};
