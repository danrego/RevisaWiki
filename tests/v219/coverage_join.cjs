'use strict';
// Join asserted whole-action endpoints, rather than helper hits or declared
// case counts. V8 function/block coverage remains a separate receipt.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
(async()=>{
const args={};for(const value of process.argv.slice(2)){const [key,...tail]=value.replace(/^--/,'').split('=');(args[key]||=[]).push(tail.join('=')||true);}
const one=key=>args[key]?.at(-1),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),read=file=>{const bytes=fs.readFileSync(file);return {bytes,sha256:sha(bytes),value:JSON.parse(bytes)};},
 root=path.resolve(one('repo')||path.join(__dirname,'../..')),inventoryFile=path.resolve(one('inventory')||path.join(__dirname,'functionality_inventory.json')),inventory=read(inventoryFile),
 manifestFile=one('manifest')&&path.resolve(one('manifest')),manifest=manifestFile&&read(manifestFile),development=!!one('development');
if(!manifest&&!development)throw new Error('Final semantic coverage needs the frozen release manifest');
const runtimeFiles=(args.runtime||[]).map(file=>path.resolve(file));
if(!runtimeFiles.length)runtimeFiles.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(file=>path.join(root,'dist/2.19.0',file)));
const runtimes=runtimeFiles.map(file=>({file,filename:path.basename(file),sha256:sha(fs.readFileSync(file))})),runtimeHashes=new Set(runtimes.map(row=>row.sha256));
if(!development&&inventory.value.runtime?.sha256!==runtimes[0].sha256)throw new Error('Source capability inventory belongs to another actual core');
if(manifest){if(manifest.value.version!=='2.19.0')throw new Error('Wrong release manifest');const entries=manifest.value.items||Object.entries(manifest.value.files||{}).map(([filename,pin])=>({filename,...pin}));if(!entries.length)throw new Error('The manifest has no pinned files');for(const item of entries){const bytes=fs.readFileSync(path.join(path.dirname(manifestFile),item.filename));if(bytes.length!==item.bytes||sha(bytes)!==item.sha256)throw new Error('The release manifest item changed');}for(const runtime of runtimes){const pin=entries.find(item=>item.filename===runtime.filename);if(!pin||pin.sha256!==runtime.sha256)throw new Error('An actual runtime is not pinned by the manifest');}}
const ids=new Map(inventory.value.transformations.map(row=>[row.id,{id:row.id,positives:new Set(),optionNoops:new Set(),protectedNoops:new Set(),boundaryNoops:new Set(),defaultIntegration:new Set(),helpers:new Set(),options:new Set()}])),
 retired=new Map((inventory.value.retiredCapabilities||[]).map(row=>[row.id,row])),roles=new Map((inventory.value.operationRoles||[]).map(row=>[row.id,row])),allScenarios=new Set(),allPassingScenarios=new Set(),inputs=[],unknownIds=new Set(),sourceRows=new Map(),intentRows=new Map(),exactPositiveRows=new Map(),historical=[],temporary=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'rw-semantic-')),negativeFile=path.join(temporary,'negative.jsonl');
fs.writeFileSync(negativeFile,'');
function addIndex(map,key,value){if(!map.has(key))map.set(key,[]);map.get(key).push(value);}
// Producers retain their original scenario identifiers for receipt binding.
// Count semantic descriptors independently, because some older producers
// included a case label or intent in their own scenario hash.
function descriptor(row){
 const fields=[row.sourceSha256,row.optionsSha256,row.expectedEndpointSha256];
 if(fields.some(value=>typeof value!=='string'||! /^[a-f0-9]{64}$/.test(value)))throw new Error('A semantic descriptor lacks source/options/expected hashes');
 return sha(JSON.stringify(fields));
}
async function fileSha(file){const h=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))h.update(chunk);return h.digest('hex');}
function bindBundles(rows,label){
 if(!Array.isArray(rows)||rows.length!==runtimes.length)throw new Error(label+' does not bind both actual bundles');
 const observed=new Set();for(const row of rows){const hash=row.sha256||row.runtimeSha256;if(row.sha256&&row.runtimeSha256&&row.sha256!==row.runtimeSha256)throw new Error(label+' has contradictory runtime hash fields');if(!runtimeHashes.has(hash)||observed.has(hash))throw new Error(label+' was produced by another or repeated runtime');observed.add(hash);}
 if(observed.size!==runtimeHashes.size)throw new Error(label+' lacks an exact actual-runtime pair');
}
function pairedActionRows(rows,label){
 const byBundle=new Map(),first=rows[0];
 if(!first)throw new Error(label+' has no actual action rows');
 const applied=row=>[...new Set(row.appliedIds||[])].sort();
 for(const row of rows){
  if(!runtimes.some(runtime=>runtime.filename===row.bundle))throw new Error(label+' names an unbound bundle');
  if(row.sourceSha256!==first.sourceSha256||row.expectedEndpointSha256!==first.expectedEndpointSha256||
   row.actualEndpointSha256!==row.expectedEndpointSha256||row.optionsSha256!==first.optionsSha256||
   JSON.stringify(applied(row))!==JSON.stringify(applied(first)))throw new Error(label+' has inconsistent repeated endpoint descriptors');
  if(!byBundle.has(row.bundle))byBundle.set(row.bundle,row);
 }
 if(byBundle.size!==runtimes.length)throw new Error(label+' lacks a complete asserted actual-bundle pair');
 return runtimes.map(runtime=>byBundle.get(runtime.filename));
}
function controlSnapshot(value){return Array.isArray(value)?value.map(controlSnapshot):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,controlSnapshot(value[key])])):value;}
function validateDeclaredControlMetadata(row){
 if(row.controlMetadataSchemaVersion!==1)return;
 const d=row.declaredEndpoint,snapshot=row.requestedOptionsSnapshot;if(!d||!snapshot||sha(JSON.stringify(controlSnapshot(snapshot)))!==row.optionsSha256||descriptor(d)!==descriptor(row)||d.scenarioSha256!==descriptor(row))throw new Error('Declared control metadata disagrees with the asserted source/options/endpoint');
 if(row.sourceBoundControl){const wanted=descriptor(row.sourceBoundControl.positive);if(row.intentPairSha256!==wanted||row.intentSha256!==wanted)throw new Error('An explicit control intent disagrees with its literal positive endpoint');}
 const enabled=Object.keys(snapshot).filter(key=>snapshot[key]===true).sort(),scope=controlSnapshot(Object.fromEntries(Object.entries(snapshot).filter(([,value])=>typeof value!=='boolean')));if(JSON.stringify(enabled)!==JSON.stringify(row.enabledBooleanOptions)||JSON.stringify(scope)!==JSON.stringify(row.scopeContext))throw new Error('Declared control metadata has an incomplete option snapshot');
}
function declaredControlIds(row){
 const relation=row.sourceBoundControl;if(!relation)return null;
 if(row.sourceSha256!==row.expectedEndpointSha256||descriptor(relation.control)!==row.scenarioSha256||relation.control.scenarioSha256!==row.scenarioSha256)throw new Error('An explicit negative relation has a stale current endpoint');
 const positiveDescriptor=descriptor(relation.positive),positives=exactPositiveRows.get(positiveDescriptor);if(relation.positive.scenarioSha256!==positiveDescriptor||!positives?.length)throw new Error('An explicit control has no actually executed exact positive endpoint');
 const before=relation.positiveOptionsSnapshot,after=row.requestedOptionsSnapshot;if(!before||sha(JSON.stringify(controlSnapshot(before)))!==relation.positive.optionsSha256)throw new Error('An explicit control has stale positive options');
 const changed=[...new Set([...Object.keys(before),...Object.keys(after)])].sort().filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key]));
 if(relation.kind==='option-off'){if(row.sourceSha256!==relation.positive.sourceSha256||changed.length!==1||changed[0]!==relation.option||before[changed[0]]!==true||after[changed[0]]!==false)throw new Error('An explicit option-off relation changes more than its declared boolean');}
 else if(relation.kind==='protected'){if(changed.length||row.sourceSha256===relation.positive.sourceSha256||typeof relation.prefix!=='string'||typeof relation.suffix!=='string'||!(relation.prefix||relation.suffix))throw new Error('An explicit protected relation is not an enclosing same-option fixture');}
 else if(relation.kind==='scope-off'){if(row.sourceSha256!==relation.positive.sourceSha256||!changed.length||JSON.stringify(changed)!==JSON.stringify(relation.changedOptions))throw new Error('An explicit scope relation is stale');}
 else throw new Error('Unknown declared control relation');
 let common=null;for(const pos of positives){const actual=new Set(pos.appliedIds);common=common===null?actual:new Set([...common].filter(id=>actual.has(id)));}return {relation,ids:common||new Set()};
}
function positive(row,appliedIds,helper){
 validateDeclaredControlMetadata(row);
 const changed=row.sourceSha256!==row.expectedEndpointSha256;
 if(typeof row.expectedRepair==='boolean'&&row.expectedRepair!==changed)throw new Error('The repair label disagrees with the independently bound endpoint');
 row={...row,scenarioSha256:descriptor(row),expectedRepair:changed};
 allScenarios.add(row.scenarioSha256);allPassingScenarios.add(row.scenarioSha256);
 if(!row.expectedRepair){fs.appendFileSync(negativeFile,JSON.stringify({scenarioSha256:row.scenarioSha256,sourceSha256:row.sourceSha256,intentSha256:row.intentSha256,enabledBooleanOptions:row.enabledBooleanOptions,scopeContext:row.scopeContext,protectedContext:row.protectedContext,optionGuard:row.optionGuard,controlMetadataSchemaVersion:row.controlMetadataSchemaVersion,sourceBoundControl:row.sourceBoundControl,requestedOptionsSnapshot:row.requestedOptionsSnapshot,optionsSha256:row.optionsSha256,expectedEndpointSha256:row.expectedEndpointSha256})+'\n');return;}
 for(const id of appliedIds){const found=ids.get(id);if(!found){unknownIds.add(id);continue;}found.positives.add(row.scenarioSha256);if(row.defaultIntegration)found.defaultIntegration.add(row.scenarioSha256);if(helper)found.helpers.add(row.scenarioSha256);}
 const compact={sourceSha256:row.sourceSha256,scenarioSha256:row.scenarioSha256,intentSha256:row.intentSha256,enabledBooleanOptions:row.enabledBooleanOptions,scopeContext:row.scopeContext,appliedIds};
 addIndex(sourceRows,row.sourceSha256,compact);addIndex(exactPositiveRows,row.scenarioSha256,compact);if(row.intentSha256)addIndex(intentRows,row.intentSha256,compact);
}
for(const summaryName of args.catalog||[]){
 const summaryFile=path.resolve(summaryName),capture=read(summaryFile),summary=capture.value,eligible=summary.status==='passed'&&summary.sourceBytesUnchanged===true&&(!summary.development||development)&&(!manifest||summary.manifestSha256===manifest.sha256);
 bindBundles(summary.bundles,'Catalog receipt');
 const rowFile=path.join(path.dirname(summaryFile),'rows-'+summary.shard+'.jsonl'),rowsSha=await fileSha(rowFile);let rows=0,asserted=0;
 for await(const line of require('node:readline').createInterface({input:fs.createReadStream(rowFile),crlfDelay:Infinity})){if(!line)continue;const row=JSON.parse(line);rows++;if(row.scenarioSha256)allScenarios.add(descriptor(row));
  if(!eligible||row.status!=='passed')continue;
  if(!row.sourceSha256||!row.expectedEndpointSha256||!row.intentSha256||row.bundles.length!==runtimes.length)throw new Error('This old receipt lacks exact endpoint/intent bindings; rerun the current runner');
  if(row.bundles.some(bundle=>bundle.failures.length||bundle.endpointSha256!==row.expectedEndpointSha256))throw new Error('A passing label disagrees with its actual asserted endpoint');
  const applied=row.bundles.map(bundle=>[...new Set(bundle.appliedIds||[])].sort());if(JSON.stringify(applied[0])!==JSON.stringify(applied[1]))throw new Error('Bundle rule identities differ');
  asserted++;positive(row,applied[0],row.helperEndpointAssertions>0);
 }
 if(await fileSha(rowFile)!==rowsSha||sha(fs.readFileSync(summaryFile))!==capture.sha256)throw new Error('The catalog receipt changed during the join');
 inputs.push({kind:'catalog',summarySha256:capture.sha256,rowsSha256:rowsSha,rows,eligible,assertedWholeActionRows:asserted,reportedAssertions:summary.checks,helperAssertions:summary.byEvidence?.helperEndpointAssertions||0,manifestSha256:summary.manifestSha256||null,status:summary.status});
}
for(const reportName of args.options||[]){
 const capture=read(path.resolve(reportName)),report=capture.value;bindBundles(report.bundles,'Option receipt');
 const eligible=report.status==='passed';if(!eligible){inputs.push({kind:'options',sha256:capture.sha256,eligible:false,status:report.status});continue;}
 if(report.cases.some(row=>row.controlMetadataSchemaVersion===1)){
  if(report.cases.some(row=>row.controlMetadataSchemaVersion!==1))throw new Error('An exact-control option receipt mixes legacy rows');
  const exactRows=new Map();for(const row of report.cases){if(row.status!=='passed')throw new Error('An exact-control option endpoint did not pass');validateDeclaredControlMetadata(row);addIndex(exactRows,descriptor(row),row);}
  for(const rows of exactRows.values()){pairedActionRows(rows,'Exact-control option endpoint');const intents=new Map(rows.map(item=>[item.intentSha256||descriptor(item),item]));for(const item of intents.values())positive(item,item.appliedIds||[],false);}
  inputs.push({kind:'options',sha256:capture.sha256,eligible:true,distinctScenarios:exactRows.size,reportedAssertions:report.checks,runnerSha256:report.runnerSha256,controlAttribution:'explicit-source-options-endpoint-relations-only'});continue;
 }
 const byScenario=new Map();for(const row of report.cases){allScenarios.add(descriptor(row));addIndex(byScenario,row.scenarioSha256,row);}
 const positivesBySeed=new Map();
 for(const [identity,rows]of byScenario){
  if(rows.some(row=>row.status!=='passed'||!row.sourceSha256||!row.optionsSha256))throw new Error('Option endpoint lacks its exact source/options binding');
  const pair=pairedActionRows(rows,'Option endpoint'),row=pair[0];allPassingScenarios.add(descriptor(row));
  if(row.kind==='positive'||row.kind==='pair'){
   const declaredIntents=new Map(rows.map(item=>[item.intentSha256||item.id,item]));
   for(const item of declaredIntents.values()){
    positive(item,item.appliedIds||[],false);
    if(item.kind==='positive')positivesBySeed.set(item.id.replace(/-positive$/,''),item.appliedIds||[]);
    for(const id of item.appliedIds||[])if(ids.has(id))for(const gate of item.gates||[])ids.get(id).options.add(gate);
   }
  }
 }
 for(const rows of byScenario.values())for(const row of new Map(rows.map(item=>[item.intentSha256||item.id,item])).values()){
  if(!['off','protected'].includes(row.kind)||row.expectedRepair)continue;
  const seed=row.kind==='off'?row.id.replace(/-off-.+$/,''):row.id.replace(/-protected-.+$/,'');
  for(const id of positivesBySeed.get(seed)||[]){const found=ids.get(id);if(!found)continue;(row.kind==='off'?found.optionNoops:found.protectedNoops).add(descriptor(row));}
 }
 inputs.push({kind:'options',sha256:capture.sha256,eligible:true,distinctScenarios:byScenario.size,reportedAssertions:report.checks,runnerSha256:report.runnerSha256});
}
for(const reportName of args.directed||[]){
 const capture=read(path.resolve(reportName)),report=capture.value;bindBundles(report.bundles,'Directed receipt');
 if(report.status!=='passed'){inputs.push({kind:'directed',sha256:capture.sha256,eligible:false,status:report.status});continue;}
 const byScenario=new Map();let nonActionRows=0;
 for(const parent of Array.isArray(report.cases)?report.cases:[]){
  const nested=Array.isArray(parent.fullActionEvidence)?parent.fullActionEvidence:Array.isArray(parent.executions)&&parent.executions.length?parent.executions:null,
   candidates=nested?nested.map((child,index)=>({...child,bundle:child.bundle||parent.bundle,status:child.status||parent.status,id:child.id||parent.id+'/'+index})):[parent];
  for(const candidate of candidates){
   const row={...candidate,appliedIds:candidate.appliedIds||candidate.appliedRuleIds};
   if(row.status!=='passed'||!row.sourceSha256||!row.expectedEndpointSha256||!row.actualEndpointSha256||!row.optionsSha256||!Array.isArray(row.appliedIds)){nonActionRows++;continue;}
   // Scenario and intent labels do not authorize an endpoint. Exact component
   // hashes identify the scenario; absent intent metadata cannot create a
   // relationship between positive and negative witnesses.
   const identity=row.scenarioSha256||descriptor(row);addIndex(byScenario,identity,row);
  }
 }
 let paired=0;
 for(const [identity,rows]of byScenario){
  const pair=pairedActionRows(rows,'Directed endpoint'),first=pair[0],applied=[...new Set(first.appliedIds)].sort();
  paired++;
  const declaredIntents=new Map(rows.map(item=>[item.intentSha256||descriptor(item),item]));
  for(const item of declaredIntents.values())positive({...item,expectedRepair:item.sourceSha256!==item.expectedEndpointSha256,protectedContext:/protected|quotation|example/.test(item.kind||''),optionGuard:/off|disabled/.test(item.kind||'')},applied,false);
 }
 inputs.push({kind:'directed',sha256:capture.sha256,eligible:true,distinctAssertedWholeActionPairs:paired,nonActionRows,reportedAssertions:report.checks,runnerSha256:report.runnerSha256});
}
// A catalog negative belongs to the same independently enumerated intent.
// An option-off witness must additionally use the exact same source and
// context and disable exactly one previously enabled boolean switch.
// A composition can add a second operation to only some positive endpoints.
// Its shared primary negative cannot prove a veto for that extra operation.
const commonIntentIds=new Map();
for(const [intent,rows]of intentRows){
 let common=null;
 for(const row of rows){const ids=new Set(row.appliedIds);common=common===null?ids:new Set([...common].filter(id=>ids.has(id)));}
 commonIntentIds.set(intent,common||new Set());
}
for await(const line of require('node:readline').createInterface({input:fs.createReadStream(negativeFile),crlfDelay:Infinity})){
 const row=JSON.parse(line);
 if(row.controlMetadataSchemaVersion===1){const declared=declaredControlIds(row);if(!declared)continue;for(const id of declared.ids){const found=ids.get(id);if(!found)continue;if(declared.relation.kind==='protected')found.protectedNoops.add(row.scenarioSha256);else if(declared.relation.kind==='option-off'){found.optionNoops.add(row.scenarioSha256);found.options.add(declared.relation.option);}else if(declared.relation.kind==='scope-off')found.boundaryNoops.add(row.scenarioSha256);}continue;}
 for(const id of commonIntentIds.get(row.intentSha256)||[]){const found=ids.get(id);if(!found)continue;
  if(row.protectedContext)found.protectedNoops.add(row.scenarioSha256);else if(!row.optionGuard)found.boundaryNoops.add(row.scenarioSha256);
 }
 if(row.optionGuard)for(const pos of sourceRows.get(row.sourceSha256)||[]){
  if(JSON.stringify(row.scopeContext)!==JSON.stringify(pos.scopeContext))continue;
  const before=new Set(pos.enabledBooleanOptions),after=new Set(row.enabledBooleanOptions),removed=[...before].filter(key=>!after.has(key)),added=[...after].filter(key=>!before.has(key));
  if(removed.length!==1||added.length)continue;
  for(const id of pos.appliedIds){const found=ids.get(id);if(found){found.optionNoops.add(row.scenarioSha256);found.options.add(removed[0]);}}
 }
}
for(const name of args.historical||[]){const capture=read(path.resolve(name)),report=capture.value;bindBundles(report.bundles,'Historical receipt');
 const counts={};for(const row of report.results||[])counts[row.status]=(counts[row.status]||0)+1;
 historical.push({sha256:capture.sha256,status:report.status,runnerSha256:report.runnerSha256,preloadSha256:report.preloadSha256,manifestSha256:report.manifestSha256||null,counts,leaves:(report.results||[]).map(row=>({file:row.file,sourceSha256:row.sourceSha256,status:row.status,runtimeSha256:row.runtimeSha256,runtimeReached:row.runtimeReached,executedAssertionCalls:row.executedAssertionCalls,assertionCallsAfterCandidateImport:row.assertionCallsAfterCandidateImport,legacyIntegrityAssertionCalls:row.legacyIntegrityAssertionCalls,conditionalVersionReviewRequired:row.conditionalVersionReviewRequired,classificationRequired:row.status!=='passed-immutable-execution'||!!row.conditionalVersionReviewRequired})),unchangedExpectations:report.orchestratorExpectedResultRewrites===0&&report.orchestratorAssertionRewrites===0});
}
const setReceipt=set=>{const values=[...set].sort();return {distinctScenarios:values.length,setSha256:sha(JSON.stringify(values)),examples:values.slice(0,8)};};
const independentWriter=id=>!retired.has(id)&&!roles.has(id);
const transformations=[...ids.values()].map(row=>({id:row.id,operationRole:roles.get(row.id)||null,status:retired.has(row.id)?'retired-write-requires-preservation-tests':roles.has(row.id)?roles.get(row.id).role:row.positives.size?'asserted-whole-action-positive':'no-whole-action-positive-receipt',positive:setReceipt(row.positives),optionOff:setReceipt(row.optionNoops),protected:setReceipt(row.protectedNoops),boundaryNoop:setReceipt(row.boundaryNoops),defaultIntegration:setReceipt(row.defaultIntegration),separateHelperEndpoint:setReceipt(row.helpers),observedOptions:[...row.options].sort(),remainingObligations:[...(!row.positives.size&&independentWriter(row.id)?['independent-whole-action-positive']:[]),...(!row.optionNoops.size&&independentWriter(row.id)?['applicable-option-off-veto']:[]),...(!row.protectedNoops.size?['protected-example-or-equivalent-scope-veto']:[]),'join-proof-freshness-and-stale-source-tests','join-counter-summary-minor-tests','inspect-V8-unexecuted-active-branches']}));
const byId=new Map(transformations.map(row=>[row.id,row])),families=inventory.value.families.map(family=>({id:family.id,declaredTransformations:family.transformations.length,withWholeActionPositive:family.transformations.filter(id=>byId.get(id)?.positive.distinctScenarios).length,withoutWholeActionPositive:family.transformations.filter(id=>independentWriter(id)&&!byId.get(id)?.positive.distinctScenarios),contracts:family.contracts}));
const report={schemaVersion:1,kind:'source-bound-semantic-functionality-coverage',targetRelease:'2.19.0',development,runnerSha256:sha(fs.readFileSync(__filename)),inventorySha256:inventory.sha256,manifestSha256:manifest?.sha256||null,runtimes:runtimes.map(({file,...row})=>row),inputs,historical,scenarioUnit:'one distinct source/options/expected endpoint descriptor, without multiplying bundles, assertions or repeated passes',scenarioDeduplication:'SHA-256 of the ordered source/options/expected component hashes. Producer scenario labels, intents and hash recipes do not increase the semantic total.',distinctScenarioDescriptors:allScenarios.size,distinctPassingScenarioDescriptors:allPassingScenarios.size,transformations,families,unknownAppliedIds:[...unknownIds].sort(),completeFunctionalityClaim:false,limitations:['A helper hit or V8-covered block is not an asserted transformation.','An unchanged corpus source is not a positive test for every feature.','A passing historical process with runtime/version branches still needs branch review.','The present join records exact endpoint, source and option witnesses; additional proof/UI contracts remain explicit obligations.'],wikipediaWrites:0};
if(one('output'))fs.writeFileSync(path.resolve(one('output')),JSON.stringify(report,null,2)+'\n');else process.stdout.write(JSON.stringify(report,null,2)+'\n');
fs.rmSync(temporary,{recursive:true,force:true});
})().catch(error=>{process.stderr.write(String(error.stack||error)+'\n');process.exitCode=1;});
