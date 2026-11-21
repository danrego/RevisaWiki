'use strict';
// Reexecute the frozen suites. One old expectation of renaming across an
// unknown program is replaced by an exact, source-bound conservative hold.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
if(!process.env.REVISAWIKI_CURRENT_CORE)throw Error('An explicit built runtime is required');
const root=path.resolve(__dirname,'../..'),runtime=path.resolve(process.env.REVISAWIKI_CURRENT_CORE),runtimeBytes=fs.readFileSync(runtime),api=require(runtime),sha=s=>crypto.createHash('sha256').update(s).digest('hex'),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false},optionsSha256=sha(JSON.stringify(cfg));
assert.equal(api.version,'2.22.1');
const pins={
 'autonames.cjs':{sha256:'44954a3fcae44862c6197a9cbf4c8b08e1df3b25e420c75dddec1e1c7a94b2e6',checks:89,calculations:18},
 'autoname_quote_integrity.cjs':{sha256:'a83f7f7130266adb9a70a60d23b26791032fe180510600b3ce97a1dfb340965a',checks:243,calculations:36}
},heldSourceSha256='e309e180511127d930a8edab927ff771108665fc443b344147127fb019b4245d',positiveSourceSha256='3409910acb08c9b6db9e92602361a157e0f2d1ee4b9602266306bf2687704deb',qualifications=[];
let controls=0,heldSource=null,heldPlan=null,positiveControls=0;
function inspectHeld(source,plan,options){
 assert.equal(sha(source),heldSourceSha256,'Only the exact unknown-program fixture is qualified');assert.equal(sha(JSON.stringify(options)),optionsSha256,'All original option values remain bound');
 assert.equal(plan.text,source,'Every definition, name, separate reuse and unknown-program argument remains exact');assert.equal(plan.edits.length,0,'A blocked rekey receives zero repair credit');assert.equal(plan.families.length,0,'No speculative name family is selected');
 assert(api.v2216AutonameProof(source,plan.text,plan,options),'The native source-bound proof must accept the hold');assert.equal(api.v2221ReferenceRekeyClosed(source),false,'An unknown program cannot certify complete consumers');assert.equal(api.v211RetainedAdjustments(source,source,[],options).count,0,'An unchanged name plan has no retained operations');
}
const marker='__RW2221_EXACT_CLOSED_AUTONAME__';assert(!Object.hasOwn(globalThis,marker));
globalThis[marker]={expected(source,options){
 const key=sha(source),plan=api.v2216AutonamePlan(source,options);assert.equal(sha(JSON.stringify(options)),optionsSha256,'Exact frozen options');
 if(key===heldSourceSha256){inspectHeld(source,plan,options);heldSource=source;heldPlan=plan;qualifications.push({id:'AUTONAME-CLOSED-OPAQUE-RESERVATION-01',sourceSha256:key,optionsSha256,oldExpected:'rename :0 to Silva2026-2 despite unknown program',currentExpected:'hold every source identity and argument',nameRepairCredit:0,outputSha256:sha(plan.text)});return false;}
 assert.equal(key,positiveSourceSha256,'The other original branch is a finite literal occupied name');assert.equal(api.v2221ReferenceRekeyClosed(source),true,'Literal positive control remains closed');assert(plan.text.includes('name="Silva2026-2"'),'A known literal occupied name still reserves the first target');assert(api.v2216AutonameProof(source,plan.text,plan,options),'Literal positive proof');assert(plan.edits.length>0,'The all-literal positive control still performs the requested repair');positiveControls++;return true;
}};
const receiptFile=process.env.REVISAWIKI_TEST_RECEIPT,temp=receiptFile?null:fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-autoname-contract-')),tasks=[];
try{
 for(const[name,pin]of Object.entries(pins)){
  const target=path.join(root,'tests/v2216',name),bytes=fs.readFileSync(target),source=bytes.toString('utf8');assert.equal(sha(bytes),pin.sha256,'Frozen historical source');let compiled=source,sites=0;
  if(name==='autonames.cjs'){
   const before="eq(api.v2216AutonamePlan(source,cfg).text.includes('name=\"Silva2026-2\"'),true,'Opaque arguments and actual names both reserve target identities');",after="eq(api.v2216AutonamePlan(source,cfg).text.includes('name=\"Silva2026-2\"'),globalThis.__RW2221_EXACT_CLOSED_AUTONAME__.expected(source,cfg),'Opaque arguments and actual names both reserve target identities');";
   assert.equal(compiled.split(before).length-1,1,'One exact old assertion site');compiled=compiled.replace(before,after);sites=1;
  }
  const nested=receiptFile?receiptFile+'.'+name+'.legacy.json':path.join(temp,name+'.json');process.env.REVISAWIKI_TEST_RECEIPT=nested;
  const mod=new Module(target,module);mod.filename=target;mod.paths=Module._nodeModulePaths(path.dirname(target));mod._compile(compiled,target);
  const legacy=JSON.parse(fs.readFileSync(nested));assert.equal(legacy.checks,pin.checks,'Every original assertion is reached');assert.equal(legacy.calculations,pin.calculations,'Every original complete calculation is reached');assert(fs.readFileSync(target).equals(bytes),'Original historical bytes stay unchanged');
  tasks.push({file:'tests/v2216/'+name,originalSha256:pin.sha256,qualifiedAssertionSites:sites,checks:legacy.checks,calculations:legacy.calculations,legacyReceiptSha256:sha(fs.readFileSync(nested)),passed:true});
 }
 assert.equal(qualifications.length,1,'Exactly one source fixture changes expectation');assert.equal(positiveControls,1,'The other original branch retains its positive expectation');
 for(const[source,plan,options]of [
  [heldSource+' ',heldPlan,cfg],
  [heldSource,{...heldPlan,text:heldSource.replace('name=":0"','name="Inventado"')},cfg],
  [heldSource,{...heldPlan,edits:[{start:0,end:0,text:'texto'}]},cfg],
  [heldSource,heldPlan,{...cfg,neutralReferenceNames:false}],
  [heldSource,heldPlan,{...cfg,references:false}]
 ]){controls++;assert.throws(()=>inspectHeld(source,plan,options),'Unrelated source, altered name, fabricated edit or changed options cannot qualify');}
}finally{delete globalThis[marker];if(receiptFile===undefined)delete process.env.REVISAWIKI_TEST_RECEIPT;else process.env.REVISAWIKI_TEST_RECEIPT=receiptFile;if(temp)fs.rmSync(temp,{recursive:true,force:true});}
assert(fs.readFileSync(runtime).equals(runtimeBytes),'The actual built runtime is immutable');
const report={suite:'exact-closed-autoname-contract-qualification',engineVersion:api.version,runtimeSha256:sha(runtimeBytes),passed:true,checks:tasks.reduce((n,t)=>n+t.checks,0)+controls,calculations:tasks.reduce((n,t)=>n+t.calculations,0),tasks,qualifications,positiveClosedControls:positiveControls,mutationControls:controls,originalTestsModified:false,productionGuardsModified:false,productionFunctionsMocked:false,allOtherOriginalAssertionsExecuted:true,wikipediaWrites:0};
if(receiptFile)fs.writeFileSync(receiptFile,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,passed:true,checks:report.checks,calculations:report.calculations,qualified:qualifications.length}));
