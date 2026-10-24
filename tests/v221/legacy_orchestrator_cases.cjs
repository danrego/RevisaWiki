'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto'),
 {boundedCall}=require('./legacy_calculation_deadline.cjs'),{readReviewedDispositions,failureRows,failureKey}=require('./legacy_disposition_reader.cjs'),
 sha=value=>crypto.createHash('sha256').update(value).digest('hex'),directory=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-test-controls-'));
let checks=0,calls=0,timeouts=0;const input={source:'Rascunho integral.'},original=input.source;
assert.throws(()=>boundedCall(()=>{while(true){}},20,()=>calls++,()=>timeouts++)(input),error=>error.code==='ERR_SCRIPT_EXECUTION_TIMEOUT');checks++;
assert.equal(input.source,original);checks++;assert.equal(calls,1);assert.equal(timeouts,1);checks+=2;
assert.equal(boundedCall(value=>({text:value.source}),100)(input).text,original);checks++;
for(const value of [0,60001,-1,1.5]){assert.throws(()=>boundedCall(()=>{},value));checks++;}
const hash='a'.repeat(64),runtimePins=[{file:'RevisaWiki_v2_21_0.js',sha256:hash}],
 historical={status:'failed',failures:[{bundle:'old-core',id:'cosmetic-boundary',message:'Old endpoint differs'}]},
 resolution={status:'passed',bundleSha256:hash,cases:[{id:'new-conservative-endpoint',status:'passed'}]},
 store=(name,data)=>{const bytes=Buffer.from(JSON.stringify(data));fs.writeFileSync(path.join(directory,name),bytes);return sha(bytes);};
let historicalHash=store('historical.json',historical),resolutionHash=store('resolution.json',resolution);
const key=failureKey(failureRows(historical,'leaf-failures')[0],0),plan={schemaVersion:1,kind:'reviewed-legacy-dispositions',
 historicalReports:[{id:'original-leaf',file:'historical.json',sha256:historicalHash,format:'leaf-failures',failureCount:1}],
 resolutions:[{id:'current-boundary',file:'resolution.json',sha256:resolutionHash,runtimeSha256:[hash]}],
 dispositions:[{historicalReport:'original-leaf',failureKey:key,classification:'intentional-conservative-preservation',resolution:'current-boundary',reason:'The exact literal boundary is retained by the current conservative contract.'}]};
const run=value=>{store('plan.json',value);return readReviewedDispositions(path.join(directory,'plan.json'),{runtimePins});};
const result=run(plan);assert.equal(result.status,'passed');checks++;
assert.equal(result.historicalNonpassingCount,1);assert.equal(result.dispositions[0].historicalStatus,'failed');assert.equal(result.currentAutomaticFixCredit,0);checks+=3;
assert.equal(sha(fs.readFileSync(path.join(directory,'historical.json'))),historicalHash);checks++;
for(const mutate of [p=>p.dispositions=[],p=>p.dispositions.push({...p.dispositions[0]}),p=>p.dispositions[0].failureKey='other',
 p=>p.dispositions[0].classification='ignore',p=>p.dispositions[0].reason='',p=>p.resolutions[0].runtimeSha256=['b'.repeat(64)],
 p=>p.historicalReports[0].failureCount=2,p=>p.historicalReports[0].sha256='0'.repeat(64),p=>p.resolutions[0].sha256='0'.repeat(64),
 p=>p.resolutions[0].runtimeSha256=[],p=>p.historicalReports[0].format='unknown']){
 const value=structuredClone(plan);mutate(value);assert.throws(()=>run(value));checks++;
}
for(const mutation of [r=>r.status='failed',r=>r.complete=false,r=>r.failures=[{id:'unresolved'}],r=>r.bundleSha256='c'.repeat(64)]){
 const value=structuredClone(resolution);mutation(value);const p=structuredClone(plan);p.resolutions[0].sha256=store('resolution.json',value);assert.throws(()=>run(p));checks++;
}
store('resolution.json',resolution);
const incomplete={status:'running',complete:false,suites:[{suite:'case.cjs',status:'passed'}]};
assert.equal(failureRows(incomplete,'suite-summary').length,1);checks++;
assert.equal(failureRows({tasks:[{id:'case',status:'failed',reason:'Assertion'}]},'directed-summary')[0].status,'failed');checks++;
console.log(JSON.stringify({kind:'deadline-and-explicit-disposition-reader-controls',status:'passed',checks,
 syntheticDeadlineMilliseconds:20,productionDeadlineMilliseconds:60000,originalDraftUnchanged:true,
 editingContinuedAfterSyntheticTimeout:true,historicalStatusesUnchanged:true,networkRequests:0,wikipediaWrites:0}));
