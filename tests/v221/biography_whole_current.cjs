'use strict';
// Strict positive assertions plus separately labelled inherited safe refusals.
// Historical strict-run failures are never rewritten or credited as accepted edits.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const a=require('./biography_harness.cjs'),fixtures=require('./biography_cases.cjs').cases,
 baselinePath=process.env.REVISAWIKI_BIO_BASELINE||path.resolve(__dirname,'../../dist/2.20.0/RevisaWiki_v2_20_0_completo.js'),
 baselineBytes=fs.readFileSync(baselinePath),baseline=require(baselinePath),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.equal(baseline.version,'2.20.0','The comparison is against the frozen prior release');
assert.equal(hash(baselineBytes),'b195a9bb3e47a7cd15ac504a372a96b9aec5ac02ab972b5e674a3f30f643dbe4','The original baseline bytes are immutable');
const report={kind:'v221-biography-whole-current-qualified',runtime:a.__biographyTestHarness,
 baseline:{version:baseline.version,file:path.basename(baselinePath),sha256:hash(baselineBytes)},cases:[],checks:0,
 failures:[],calculateCalls:0,baselineCalculateCalls:0,gateCalls:0,accepted:0,inheritedSafeRefusal:0,safelyBlockedUnconfirmedReference:0,wikipediaWrites:0,
 proofScope:'Every applied new positive requires an accepted authoritative gate and final consumed native field/value. A proposed alias correction containing references only inside an infobox and lacking an existing collector may instead be labelled safely blocked for unconfirmed rendering, with zero credited automatic changes and exact original application. A negative no-op is inherited only if candidate proposal and rejected gate equal the frozen baseline. Actual browser application is checked by independent local UI controls.'};
for(const test of fixtures){
 try{
  const result=a.calculate({kind:'adjust',source:test.source,originalSource:test.source,options:test.options});report.calculateCalls++;
  if(test.exactWholeExpected!==undefined){assert.equal(result.text,test.exactWholeExpected,test.id+' independently specified post-prerequisite endpoint');report.checks++;}
  const gate=a.v219AutomaticResultSafety(test.source,result);report.gateCalls++;
  const planned=a.v221BiographyPlan(test.source,test.options),expectedIds=new Set(planned.edits.map(e=>e.ruleId)),
   actualIds=new Set((result.changes||[]).filter(c=>/^v221(?:Infobox|Specialized|RedundantImdb|ImageOption|ConfirmedPortals)/.test(c.id)).map(c=>c.id));
  if(!gate.accepted){
   const sourceBox=a.v221BioPrincipal(test.source),protectedView=a.v24SyntaxProtected(test.source).view,
    outsideOwner=sourceBox?protectedView.slice(0,sourceBox.node.start)+protectedView.slice(sourceBox.node.end):protectedView,
    onlyOwnerReferences=!!sourceBox&&/<ref\b/i.test(sourceBox.raw)&&!/<ref\b/i.test(outsideOwner)&&
      !/<references\b|\{\{\s*(?:Refer[eê]ncias|Refer[eê]ncia|Reflist|References)\b/i.test(protectedView);
   if(planned.edits.length&&onlyOwnerReferences&&planned.edits.some(edit=>edit.ruleId==='v221InfoboxField')&&
     planned.edits.every(edit=>['v221InfoboxField','v221InfoboxEmptyDestination'].includes(edit.ruleId))&&
     (gate.findings||[]).length&&(gate.findings||[]).every(finding=>finding.code==='lost-reference-binding')){
    assert.notEqual(test.expected,test.source,test.id+' a blocked proposed correction is not credited as a negative no-op');report.checks++;
    for(const edit of planned.edits){
     if(edit.ruleId==='v221InfoboxEmptyDestination'){assert(!edit.proof.value.trim(),test.id+' only a strictly empty duplicate destination is removed');report.checks++;continue;}
     const box=a.v221BioPrincipal(result.text);assert(box&&box.name===edit.proof.owner,test.id+' proposed native owner remains intact');report.checks++;
     const fields=box.fields.filter(field=>field.key===edit.proof.to);assert.equal(fields.length,1,test.id+' one proposed native binding');report.checks++;
     assert.equal(fields[0].value.trim(),edit.proof.value.trim(),test.id+' proposed field retains the exact reference-bearing value');report.checks++;
    }
    const appliedSource=gate.accepted?result.text:test.source;assert.equal(appliedSource,test.source,test.id+' a safely blocked proposal preserves every original draft byte');report.checks++;
    assert(!/<references\b|\{\{\s*(?:Refer[eê]ncias|Reflist|References)\b/i.test(appliedSource),test.id+' no empty reference collector reaches the editor');report.checks++;
    report.safelyBlockedUnconfirmedReference++;
    report.cases.push({id:test.id,status:'safely-blocked-unconfirmed-reference-rendering',sourceSha256:hash(test.source),
     proposalSha256:hash(result.text),appliedSha256:hash(appliedSource),gateCodes:(gate.findings||[]).map(f=>f.code),
     proposedBioRules:[...expectedIds],proposedCollector:/<references\b|\{\{\s*(?:Refer[eê]ncias|Reflist|References)\b/i.test(result.text),creditedAutomaticChanges:0});continue;
   }
   assert.equal(test.expected,test.source,test.id+' rejected positive cannot be qualified');report.checks++;
   assert.equal(planned.edits.length,0,test.id+' rejected new planned change cannot be qualified');report.checks++;
   assert.equal(actualIds.size,0,test.id+' a rejected new BIO action cannot be qualified');report.checks++;
   const prior=baseline.calculate({kind:'adjust',source:test.source,originalSource:test.source,options:test.options});report.baselineCalculateCalls++;
   const priorGate=baseline.v219AutomaticResultSafety(test.source,prior);
   assert.equal(priorGate.accepted,false,test.id+' baseline must also refuse');report.checks++;
   assert.equal(result.text,prior.text,test.id+' inherited proposal must equal the frozen baseline exactly');report.checks++;
   assert.deepEqual(gate,priorGate,test.id+' inherited gate outcome must equal the frozen baseline exactly');report.checks++;
   const appliedSource=gate.accepted?result.text:test.source;
   assert.equal(appliedSource,test.source,test.id+' refused result preserves every original draft byte');report.checks++;
   report.inheritedSafeRefusal++;
   report.cases.push({id:test.id,status:'inherited-safe-refusal',sourceSha256:hash(test.source),
    proposalSha256:hash(result.text),appliedSha256:hash(appliedSource),gateCodes:(gate.findings||[]).map(f=>f.code),
    baselineProposalEqual:true,baselineGateEqual:true,newBioEdits:0});
   continue;
  }
  report.accepted++;report.checks++;
  for(const id of expectedIds){assert(actualIds.has(id),test.id+' missing '+id);report.checks++;}
  for(const edit of planned.edits){
   if(!['v221InfoboxField','v221SpecializedBirthDate'].includes(edit.ruleId))continue;
   const box=a.v221BioPrincipal(result.text),key=edit.ruleId==='v221InfoboxField'?edit.proof.to:edit.proof.key,
    expected=edit.ruleId==='v221InfoboxField'?edit.proof.value:edit.proof.after;
   assert(box&&box.name===edit.proof.owner,test.id+' native owner retained');report.checks++;
   const fields=box.fields.filter(field=>field.key===key);assert.equal(fields.length,1,test.id+' one final native binding');report.checks++;
   assert.equal(fields[0].value.trim(),expected.trim(),test.id+' final native value retained');report.checks++;
  }
  if(test.expected===test.source){assert.equal(actualIds.size,0,test.id+' unexpected BIO action');report.checks++;}
  const second=a.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:test.options});report.calculateCalls++;
  assert.equal(second.text,result.text,test.id+' final whole idempotence');report.checks++;
  report.cases.push({id:test.id,status:'accepted',sourceSha256:hash(test.source),appliedSha256:hash(result.text),rules:[...actualIds]});
 }catch(error){report.failures.push({id:test.id,error:error.message});report.cases.push({id:test.id,status:'unexpected-failure'});}
}
if(process.env.REVISAWIKI_BIO_WHOLE_REPORT)fs.writeFileSync(process.env.REVISAWIKI_BIO_WHOLE_REPORT,JSON.stringify(report,null,2));
console.log(JSON.stringify({kind:report.kind,cases:report.cases.length,checks:report.checks,accepted:report.accepted,
 inheritedSafeRefusal:report.inheritedSafeRefusal,safelyBlockedUnconfirmedReference:report.safelyBlockedUnconfirmedReference,calculateCalls:report.calculateCalls,baselineCalculateCalls:report.baselineCalculateCalls,
 gateCalls:report.gateCalls,failures:report.failures.slice(0,15)}));
if(report.failures.length)process.exitCode=1;
