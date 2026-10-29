'use strict';
// A separate qualification layer. The inherited test and its failed raw result
// remain unchanged; only the explicit source-bound fixture list can qualify.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),manifestPath=path.join(__dirname,'biography_legacy_safe_refusal_cases.json'),manifest=JSON.parse(fs.readFileSync(manifestPath));
let checks=0,calculateCalls=0,gateCalls=0;const failures=[],eq=(a,b,label)=>{checks++;assert.deepEqual(a,b,label);},ok=(a,label)=>{checks++;assert(a,label);};
function mappingProofs(plan){return plan.edits.filter(e=>e.ruleId==='v221InfoboxField').map(e=>({...Object.fromEntries(['owner','from','to'].filter(k=>Object.hasOwn(e.proof,k)).map(k=>[k,e.proof[k]])),valueSha256:sha(e.proof.value||'')}));}
if(process.argv[2]==='--current-worker'){
 const bundle=path.resolve(process.argv[3]),output=process.argv[4];process.env.REVISAWIKI_BUNDLE=bundle;
 const api=require('../v221/biography_harness.cjs'),fixtures=require('../v221/biography_cases.cjs').cases,byId=new Map(fixtures.map(row=>[row.id,row])),rows=[];
 eq(api.__biographyTestHarness.runtimeSha256,sha(fs.readFileSync(bundle)),'Current bundle bytes are exact');
 eq(api.__biographyTestHarness.fragmentInjected,false,'No development plan is injected');
 for(const expected of manifest.entries){try{
  const test=byId.get(expected.id);ok(test,'The exact fixture still exists: '+expected.id);
  eq(sha(test.source),expected.sourceSha256,'Source bytes are pinned: '+expected.id);eq(sha(test.expected),expected.expectedPlannedSha256,'The proposed endpoint stays pinned: '+expected.id);eq(sha(JSON.stringify(test.options)),expected.optionsSha256,'Fixture options stay pinned: '+expected.id);
  const plan=api.v221BiographyPlan(test.source,test.options),box=api.v221BioPrincipal(test.source),view=api.v24SyntaxProtected(test.source).view,outside=box?view.slice(0,box.node.start)+view.slice(box.node.end):view;
  ok(box&&/<ref\b/i.test(box.raw)&&!/<ref\b/i.test(outside),'References are confined to the original owner: '+expected.id);
  ok(!/<references\b|\{\{\s*(?:Refer[eê]ncias|Refer[eê]ncia|Reflist|References)\b/i.test(view),'No source collector is present: '+expected.id);
  ok(plan.edits.length&&plan.edits.some(e=>e.ruleId==='v221InfoboxField')&&plan.edits.every(e=>['v221InfoboxField','v221InfoboxEmptyDestination'].includes(e.ruleId)),'Only the recorded local field plan is proposed: '+expected.id);
  eq(mappingProofs(plan),expected.mappingProofs,'The exact proposed field/value bindings are unchanged: '+expected.id);
  const result=api.calculate({kind:'adjust',source:test.source,originalSource:test.source,options:test.options});calculateCalls++;
  const gate=api.v219AutomaticResultSafety(test.source,result);gateCalls++;
  eq(gate.accepted,true,'The unchanged draft passes the authoritative final gate: '+expected.id);eq(gate.code,'unchanged','The result is an unchanged draft, not a newly applied migration: '+expected.id);
  eq(result.text,test.source,'Every original source byte remains: '+expected.id);eq(result.changes,[],'No blocked proposal is credited as an applied correction: '+expected.id);
  ok(api.v2214EffectiveResultOptions(test.source,result,test.options,null),'The local result remains bound to its original request: '+expected.id);
  ok(api.v2214ReferenceActivationAudit(test.source,plan.text,test.options).some(f=>f.code==='reference-activation-unconfirmed'),'The uncollected proposed activation is independently refused: '+expected.id);
  const second=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:test.options});calculateCalls++;
  eq(second.text,test.source,'Another action cannot activate the refused alias: '+expected.id);
  rows.push({id:expected.id,source:test.source,options:test.options,sourceSha256:expected.sourceSha256,optionsSha256:expected.optionsSha256,status:'verified-unchanged-safe-refusal',creditedAutomaticChanges:0});
 }catch(error){failures.push({id:expected.id,error:error.message});}}
 const report={kind:'biography-current-protocol-qualification',runtimeSha256:sha(fs.readFileSync(bundle)),fixtures:fixtures.length,checks,calculateCalls,gateCalls,failures,rows};fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks,calculateCalls,failures:failures.length}));if(failures.length)process.exitCode=1;
}else if(process.argv[2]==='--baseline-worker'){
 const bundle=path.resolve(process.argv[3]),output=process.argv[4],current=JSON.parse(fs.readFileSync(process.argv[5])),api=require(bundle),digest=sha(fs.readFileSync(bundle)),rows=[];
 eq(api.version,manifest.baseline.version,'The prior release is exact');ok([manifest.baseline.coreSha256,manifest.baseline.completeSha256].includes(digest),'The prior release bytes are immutable');
 for(const test of current.rows){try{
  const expected=manifest.entries.find(row=>row.id===test.id);ok(expected,'Only an explicitly recorded case is compared');eq(sha(test.source),expected.sourceSha256,'The prior release sees the identical source: '+test.id);eq(sha(JSON.stringify(test.options)),expected.optionsSha256,'The prior release sees identical options: '+test.id);
  const result=api.calculate({kind:'adjust',source:test.source,originalSource:test.source,options:test.options});calculateCalls++;
  const gate=api.v219AutomaticResultSafety(test.source,result);gateCalls++;
  eq(gate.accepted,false,'The prior release also refused the whole proposal: '+test.id);ok(gate.findings?.length&&gate.findings.every(f=>f.code==='lost-reference-binding'),'The prior refusal concerns unconfirmed reference binding: '+test.id);ok(result.text!==test.source,'A refused proposed correction is not an accepted negative fixture: '+test.id);
  rows.push({id:test.id,sourceSha256:expected.sourceSha256,optionsSha256:expected.optionsSha256,status:'prior-whole-result-refused',gateCodes:gate.findings.map(f=>f.code),appliedSha256:sha(gate.accepted?result.text:test.source),proposalSha256:sha(result.text)});
 }catch(error){failures.push({id:test.id,error:error.message});}}
 const report={kind:'biography-prior-protocol-comparison',runtimeSha256:digest,checks,calculateCalls,gateCalls,failures,rows};fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks,calculateCalls,failures:failures.length}));if(failures.length)process.exitCode=1;
}else{
 const bundle=path.resolve(process.argv[2]||process.env.REVISAWIKI_CURRENT_CORE||'dist/2.21.4/RevisaWiki_v2_21_4.js'),rawPath=process.argv[3]||process.env.REVISAWIKI_BIO_RAW_WHOLE_REPORT,receipt=process.argv[4]||process.env.REVISAWIKI_TEST_RECEIPT;
 ok(rawPath,'Supply the complete unchanged inherited test report');
 const work=process.env.REVISAWIKI_BIO_QUALIFICATION_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-biography-qualification-'));fs.mkdirSync(work,{recursive:true});
 const rawBytes=fs.readFileSync(rawPath),raw=JSON.parse(rawBytes),bundleHash=sha(fs.readFileSync(bundle));
 eq(sha(fs.readFileSync(path.join(root,'tests/v221/biography_whole_current.cjs'))),manifest.oldTestSha256,'The inherited test is unchanged');eq(sha(fs.readFileSync(path.join(root,'tests/v221/biography_cases.cjs'))),manifest.fixtureDefinitionSha256,'The inherited fixtures are unchanged');eq(sha(fs.readFileSync(path.join(root,'tests/v221/biography_harness.cjs'))),manifest.harnessSha256,'The inherited harness is unchanged');
 eq(raw.kind,'v221-biography-whole-current-qualified','The raw report is complete, not the truncated stdout summary');eq(raw.runtime.runtimeSha256,bundleHash,'The raw report belongs to the exact supplied bundle');eq(raw.cases.length,4009,'All inherited cases remain in the raw report');eq(manifest.count,395,'The exception set is explicit and bounded');eq(new Set(manifest.entries.map(row=>row.id)).size,395,'Every listed exception is unique');
 const expectedById=new Map(manifest.entries.map(row=>[row.id,row]));eq(raw.failures.length,395,'No additional failure can be silently ignored');
 for(const failure of raw.failures){const expected=expectedById.get(failure.id);ok(expected,'Unexpected raw failure is not qualified: '+failure.id);eq(failure.error,expected.rawError,'Only the proved missing applied-label protocol difference is qualified: '+failure.id);}
 eq(new Set(raw.failures.map(row=>row.id)).size,395,'The raw failure set has no duplicates');
 for(const row of raw.cases)if(!expectedById.has(row.id))eq(row.status,'accepted','Every other raw case still satisfies the unchanged original test: '+row.id);
 function worker(mode,target,output,extra=[]){
  const stdout=output+'.stdout',stderr=output+'.stderr',deadline=output+'.deadline.json';ok(!fs.existsSync(output),'Preserve an earlier qualification attempt');
  const run=cp.spawnSync(process.execPath,['--require',path.join(root,'tests/v221/legacy_calculation_deadline.cjs'),__filename,mode,target,output,...extra],{cwd:root,env:{...process.env,REVISAWIKI_BUNDLE:target,REVISAWIKI_DEADLINE_FILES:JSON.stringify([target]),REVISAWIKI_DEADLINE_RECEIPT:deadline},encoding:'utf8',timeout:1800000,maxBuffer:4*1024*1024});fs.writeFileSync(stdout,run.stdout||'');fs.writeFileSync(stderr,run.stderr||'');
  eq(run.status,0,'The isolated proof worker succeeds: '+mode);const data=JSON.parse(fs.readFileSync(output)),timing=JSON.parse(fs.readFileSync(deadline));eq(data.failures,[],'Each exact fixture has an independently checked outcome: '+mode);eq(timing.networkAttempts,0,'Qualification performs no external writes or network requests');eq(timing.records.reduce((n,row)=>n+row.timeouts,0),0,'The existing per-calculation60-second limit is respected');return{data,receiptSha256:sha(fs.readFileSync(output)),deadlineReceiptSha256:sha(fs.readFileSync(deadline)),stdoutSha256:sha(fs.readFileSync(stdout)),stderrSha256:sha(fs.readFileSync(stderr))};
 }
 const currentPath=path.join(work,'current.json'),current=worker('--current-worker',bundle,currentPath),baselinePath=path.resolve(process.env.REVISAWIKI_BIO_QUALIFICATION_BASELINE||path.join(root,'dist/2.21.3/RevisaWiki_v2_21_3_completo.js')),baseline=worker('--baseline-worker',baselinePath,path.join(work,'baseline.json'),[currentPath]);
 eq(current.data.rows.length,395,'Every explicit current case was checked');eq(baseline.data.rows.length,395,'Every explicit prior-release case was checked');
 const report={suite:'biography-legacy-safe-refusal-protocol-2.21.4',status:'passed-with-qualified-legacy-protocol-difference',rawStatus:'failed',rawFailureCount:395,rawTestSha256:manifest.oldTestSha256,rawReportSha256:sha(rawBytes),manifestSha256:sha(fs.readFileSync(manifestPath)),runtimeSha256:bundleHash,checks:checks+current.data.checks+baseline.data.checks,calculateApiCalls:current.data.calculateCalls+baseline.data.calculateCalls,gateCalls:current.data.gateCalls+baseline.data.gateCalls,qualifiedCases:395,otherRawAcceptedCases:raw.cases.length-395,creditedAutomaticChanges:0,checksCurrent:current.data.checks,checksPrior:baseline.data.checks,currentReceiptSha256:current.receiptSha256,baselineReceiptSha256:baseline.receiptSha256,currentDeadlineReceiptSha256:current.deadlineReceiptSha256,baselineDeadlineReceiptSha256:baseline.deadlineReceiptSha256,baselineRuntimeSha256:baseline.data.runtimeSha256,failures:[],method:'The raw inherited test remains failed and unchanged. Only395 exact source/options/proposed-field fixtures are qualified, after the current engine preserves every byte and the isolated prior release rejects the same whole proposal. No refused alias correction is credited as applied. All other raw cases must satisfy the original test.',cases:current.data.rows.map(({id,sourceSha256,optionsSha256,status,creditedAutomaticChanges})=>({id,sourceSha256,optionsSha256,status,creditedAutomaticChanges})),wikipediaWrites:0};
 if(receipt)fs.writeFileSync(receipt,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
