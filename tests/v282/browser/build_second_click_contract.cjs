'use strict';
// Regenerate release-linked evidence from the pinned candidate, never relabel it.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const candidate=require('../candidate.cjs');candidate.verify();
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const manifestPath=path.join(candidate.root,'tests/expected_release_v282.json'),manifestBytes=fs.readFileSync(manifestPath);
const api=require(candidate.bundleFiles()[0]);
const fixtureBytes=fs.readFileSync(path.join(__dirname,'spouse_cases.json')),fixtures=JSON.parse(fixtureBytes);
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',authorityControl:false,endTemplateOrder:false,links:false,captureTrace:true};
const payload=hunks=>(hunks||[]).map(hunk=>Object.fromEntries(Object.entries(hunk).filter(([key])=>key!=='reasons')));
const proof={version:'2.8.2',kind:'second-click-cumulative-comparison-contract',releaseManifestSha256:hash(manifestBytes),coreSha256:candidate.manifest.files['RevisaWiki_v2_8_2.js'].sha256,fixtureSha256:hash(fixtureBytes),generatorSha256:hash(fs.readFileSync(__filename)),apiConfiguration:cfg,codeContract:{baseline:'appliedBaseline returns last.before when current source equals last.after',workerComparison:'calculationSteps compares job.originalSource to result.text',traceExplanations:'Only explanatory hunk reasons may use the fallback on an idempotent second calculation',noNewEdit:'Second calculation has unchanged text and zero result.changes; cumulative edit payloads remain exact, excluding only reasons',excludedFields:['reasons']},cases:[],wikipediaWrites:0,networkRequests:0};
for(const item of fixtures.positive){
 const first=api.calculate({kind:'adjust',source:item.source,options:cfg});
 const second=api.calculate({kind:'adjust',source:first.text,originalSource:item.source,previousSource:first.text,options:cfg});
 assert.notEqual(first.text,item.source,item.id+' first application changes source');
 assert.equal(second.text,first.text,item.id+' second application is idempotent');
 assert.equal(second.changes.length,0,item.id+' second application makes no new adjustments');
 assert.deepEqual(payload(second.hunks),payload(first.hunks),item.id+' cumulative edit payload remains exact');
 assert.deepEqual(first.preservation,[],item.id+' first preservation');assert.deepEqual(second.preservation,[],item.id+' second preservation');
 const before=JSON.stringify(payload(first.hunks)),after=JSON.stringify(payload(second.hunks));
 proof.cases.push({id:item.id,sourceSha256:hash(Buffer.from(item.source)),unchangedFinalTextSha256:hash(Buffer.from(first.text)),firstHunks:first.hunks.length,secondHunks:second.hunks.length,firstCumulativeEditPayloadSha256:hash(Buffer.from(before)),secondCumulativeEditPayloadSha256:hash(Buffer.from(after)),exactCumulativeEditPayload:before===after,secondNewAdjustments:second.changes.length,firstTraceLabels:(first.trace||[]).map(step=>step.label),secondTraceLabels:(second.trace||[]).map(step=>step.label),firstReasons:first.hunks.map(h=>h.reasons),secondReasons:second.hunks.map(h=>h.reasons)});
}
assert.equal(proof.cases.length,12);
fs.writeFileSync(path.join(__dirname,'SECOND_CLICK_DIFF_CONTRACT.json'),JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify({version:proof.version,cases:proof.cases.length,releaseManifestSha256:proof.releaseManifestSha256,wikipediaWrites:0}));
