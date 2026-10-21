"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=x=>crypto.createHash('sha256').update(Buffer.isBuffer(x)?x:typeof x==='string'?x:JSON.stringify(x)).digest('hex'),sourceInputs=Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname,'SOURCE_INPUTS.json')))).map(([key,file])=>[key,path.resolve(__dirname,file)])),originalFixtures=JSON.parse(fs.readFileSync(sourceInputs.originalFixtures)),additiveFixtures=JSON.parse(fs.readFileSync(sourceInputs.additiveFixtures)),fixtures={...originalFixtures,rows:[...originalFixtures.rows,...additiveFixtures.rows]},report={status:'passed',kind:'new-intended-image-format-typo-controls',rows:[],proofMutants:[],checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0,observerDirectCallCounts:{plan:0,proof:0,calculate:0,firstCalculate:0,secondCalculate:0,preservationAudit:0,safeComposition:0,minorEligibility:0},callCountScope:'Direct observer call sites, including attempted calls that throw; product-internal helper invocations are not counted'};
let network=0;global.fetch=()=>{network++;throw Error('Network forbidden');};global.XMLHttpRequest=class{constructor(){network++;throw Error('Network forbidden');}};
const runtimes=process.argv.slice(2).map(x=>path.resolve(x));assert.equal(runtimes.length,2);assert.notEqual(runtimes[0],runtimes[1]);
assert.equal(originalFixtures.rows.length,74);assert.equal(additiveFixtures.rows.length,10);const inputs=[__filename,path.join(__dirname,'SOURCE_INPUTS.json'),...Object.values(sourceInputs),...runtimes,path.join(path.dirname(runtimes.find(x=>!x.endsWith('_completo.js'))),'RevisaWiki_v2_19_0_dados.js')],pins=inputs.map(file=>({file,sha256:sha(fs.readFileSync(file))}));
for(const file of runtimes){const api=require(file);report.bundles.push({file,sha256:sha(fs.readFileSync(file)),version:api.version});for(const row of fixtures.rows){const r={id:row.id,runtimeSha256:sha(fs.readFileSync(file)),sourceSha256:row.sourceSha256,expectedEndpointSha256:row.expectedEndpointSha256,status:'passed',kind:row.kind,options:row.options};try{
 const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);};
 report.observerDirectCallCounts.plan++;const plan=api.v219ImageThumbnailTypoPlan(row.source,row.options);r.plan=plan;
 eq(plan.text,row.expected,'Independent complete endpoint');eq(plan.edits.length,row.expectedPlanEdits,'Exact bounded plan count');
 report.observerDirectCallCounts.proof++;r.planProof=api.v219ImageThumbnailTypoProof(row.source,row.expected,plan,row.options);eq(r.planProof,true,'Fresh exact original SOURCE proof');
 report.observerDirectCallCounts.calculate++;report.observerDirectCallCounts.firstCalculate++;
 const first=api.calculate({kind:'adjust',source:row.source,options:row.options});r.first=first;
 eq(first.text,row.expected,'Complete action exact independently authored endpoint');eq(first.preservation||[],[],'Pipeline guard');
 report.observerDirectCallCounts.preservationAudit++;r.standaloneAudit=api.preservationAudit(row.source,first.text,row.options);eq(r.standaloneAudit,[],'Standalone preservation');
 report.observerDirectCallCounts.safeComposition++;r.standaloneComposition=api.safeComposition(row.source,first.text,row.options);eq(r.standaloneComposition,'','Standalone composition');
 report.observerDirectCallCounts.calculate++;report.observerDirectCallCounts.secondCalculate++;
 const second=api.calculate({kind:'adjust',source:first.text,options:row.options});r.second=second;eq(second.text,first.text,'Second click');r.appliedIds=(first.changes||[]).filter(x=>x.count>0).map(x=>x.id);
 if(row.expectedPlanEdits){eq((first.changes||[]).find(x=>x.id==='v219ImageThumbnailTypo')?.count,row.expectedPlanEdits,'New exact counter');report.observerDirectCallCounts.minorEligibility++;r.minorEligibility=api.minorEligibility(row.source,first.text,{...row.options,minorBaseConfirmed:true});eq(r.minorEligibility.eligible,false,'Rendering repair is not automatically minor');}
 }catch(e){r.status='failed';report.status='failed';report.failures.push({id:row.id,file,message:e.message});}report.rows.push(r);}
 const positive=fixtures.rows[0],mutations=JSON.parse(fs.readFileSync(sourceInputs.mutations));let mutationPlan=null,mutationPlanError=null;
 try{report.observerDirectCallCounts.plan++;mutationPlan=api.v219ImageThumbnailTypoPlan(positive.source,positive.options);}catch(e){mutationPlanError=String(e.stack||e);}
 for(const m of mutations.rows){
  const observed={id:m.id,runtimeSha256:sha(fs.readFileSync(file)),sourceSha256:positive.sourceSha256,options:positive.options,expectedFreshProof:false,plan:mutationPlan,planError:mutationPlanError,status:'passed',failures:[]};
  try{
   if(mutationPlanError)throw new Error(mutationPlanError);
   observed.changedEndpoint=positive.expected.replace(m.mutate.from,m.mutate.to);observed.changedEndpointSha256=sha(observed.changedEndpoint);
   report.checks++;assert.notEqual(observed.changedEndpoint,positive.expected);
   report.observerDirectCallCounts.proof++;observed.actualFreshProof=api.v219ImageThumbnailTypoProof(positive.source,observed.changedEndpoint,mutationPlan,positive.options);
   report.checks++;assert.equal(observed.actualFreshProof,false,m.id);
  }catch(e){observed.status='failed';report.status='failed';observed.failures.push({message:String(e.stack||e)});report.failures.push({id:'proof-mutant-'+m.id,file,message:String(e.message||e)});}
  report.proofMutants.push(observed);
 }
}
report.descriptorPartition={originalActionSources:originalFixtures.rows.length,additiveActionSources:additiveFixtures.rows.length,combinedActionSources:fixtures.rows.length,sourceOptionUnionNotEnumerated:true};report.pins=pins;report.networkRequests=network;report.postflight=[];
for(const pin of pins){try{const actual=sha(fs.readFileSync(pin.file));report.postflight.push({...pin,actualSha256:actual});assert.equal(actual,pin.sha256);}catch(e){report.status='failed';report.failures.push({id:'input-postflight',file:pin.file,message:String(e.message||e)});}}
try{assert.equal(network,0);}catch(e){report.status='failed';report.failures.push({id:'network-veto',message:String(e.message||e)});}
// Flush every observed action and proof-mutant row even when an assertion failed.
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
