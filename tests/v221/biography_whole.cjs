'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const a=require('./biography_harness.cjs'),fixtures=require('./biography_cases.cjs').cases;
const report={kind:'v221-biography-whole-action',runtime:a.__biographyTestHarness,cases:[],checks:0,failures:[],calculateCalls:0,gateCalls:0,wikipediaWrites:0};
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
for(const test of fixtures){
 try{
  const result=a.calculate({kind:'adjust',source:test.source,originalSource:test.source,options:test.options});report.calculateCalls++;
  if(test.exactWholeExpected!==undefined){assert.equal(result.text,test.exactWholeExpected,test.id+' independently specified post-prerequisite endpoint');report.checks++;}
  const gate=a.v219AutomaticResultSafety(test.source,result);report.gateCalls++;assert.equal(gate.accepted,true,test.id+' gate '+JSON.stringify(gate));report.checks++;
  const planned=a.v221BiographyPlan(test.source,test.options),expectedIds=new Set(planned.edits.map(e=>e.ruleId)),actualIds=new Set((result.changes||[]).filter(c=>/^v221(?:Infobox|Specialized|RedundantImdb|ImageOption|ConfirmedPortals)/.test(c.id)).map(c=>c.id));
  for(const id of expectedIds){assert(actualIds.has(id),test.id+' missing '+id);report.checks++;}
  // A change log is not proof that the repaired native field reached the editor.
  // Compare its independently planned key/value with the actual final binding.
  for(const edit of planned.edits){
   if(!['v221InfoboxField','v221SpecializedBirthDate'].includes(edit.ruleId))continue;
   const finalBox=a.v221BioPrincipal(result.text),key=edit.ruleId==='v221InfoboxField'?edit.proof.to:edit.proof.key,
    expected=edit.ruleId==='v221InfoboxField'?edit.proof.value:edit.proof.after;
   assert(finalBox&&finalBox.name===edit.proof.owner,test.id+' native owner retained');report.checks++;
   const fields=finalBox.fields.filter(field=>field.key===key);
   assert.equal(fields.length,1,test.id+' one final native binding '+key);report.checks++;
   assert.equal(fields[0].value.trim(),expected.trim(),test.id+' final field preserves its whole supplied value');report.checks++;
  }
  if(test.expected===test.source){assert.equal(actualIds.size,0,test.id+' unexpected biography adjustment '+[...actualIds]);report.checks++;}
  const second=a.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:test.options});report.calculateCalls++;
  assert.equal(second.text,result.text,test.id+' whole idempotence');report.checks++;
  report.cases.push({id:test.id,status:'passed',sourceSha256:hash(test.source),appliedSha256:hash(result.text),rules:[...actualIds]});
 }catch(error){report.failures.push({id:test.id,error:error.message});report.cases.push({id:test.id,status:'failed'});}
}
if(process.env.REVISAWIKI_BIO_WHOLE_REPORT)fs.writeFileSync(process.env.REVISAWIKI_BIO_WHOLE_REPORT,JSON.stringify(report,null,2));
console.log(JSON.stringify({kind:report.kind,cases:report.cases.length,checks:report.checks,calculateCalls:report.calculateCalls,gateCalls:report.gateCalls,failures:report.failures.slice(0,15)}));if(report.failures.length)process.exitCode=1;
