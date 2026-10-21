'use strict';
// Regenerate release-linked evidence from the pinned candidate, never relabel it.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),dist=path.resolve(process.argv[2]||path.join(root,'dist/2.19.0')),
 manifestPath=path.resolve(process.argv[3]||path.join(root,'tests/expected_release_v2190.json')),
 output=path.resolve(process.argv[4]||path.join(__dirname,'SECOND_CLICK_DIFF_CONTRACT.json')),
 manifest=JSON.parse(fs.readFileSync(manifestPath));
const candidate={root,manifest,bundleFiles:()=>['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(dist,name))};
for(const file of candidate.bundleFiles()){const raw=fs.readFileSync(file),pin=manifest.files[path.basename(file)];assert.equal(raw.length,pin.bytes);assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),pin.sha256);}
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const manifestBytes=fs.readFileSync(manifestPath);
const api=require(candidate.bundleFiles()[0]);
const fixtureBytes=fs.readFileSync(path.resolve(__dirname,'../../v2130/browser/spouse_cases.json')),fixtures=JSON.parse(fixtureBytes);
const nativeWrapperDisposition=require('./native_spouse_wrapper_disposition.cjs')(fixtureBytes);
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',authorityControl:false,endTemplateOrder:false,links:false,captureTrace:true};
const payload=hunks=>(hunks||[]).map(hunk=>Object.fromEntries(Object.entries(hunk).filter(([key])=>key!=='reasons')));
const proof={version:'2.19.0',kind:'second-click-cumulative-comparison-contract',releaseManifestSha256:hash(manifestBytes),coreSha256:candidate.manifest.files['RevisaWiki_v2_19_0.js'].sha256,fixtureSha256:hash(fixtureBytes),generatorSha256:hash(fs.readFileSync(__filename)),apiConfiguration:cfg,codeContract:{baseline:'appliedBaseline returns last.before when current source equals last.after',workerComparison:'calculationSteps compares job.originalSource to result.text',traceExplanations:'Only explanatory hunk reasons may use the fallback on an idempotent second calculation',noNewEdit:'Second calculation has unchanged text and zero result.changes; cumulative edit payloads remain exact, excluding only reasons',excludedFields:['reasons']},cases:[],wikipediaWrites:0,networkRequests:0};
for(const item of fixtures.positive){
 const nativeWrapper=nativeWrapperDisposition(item,cfg,'generator');
 const first=api.calculate({kind:'adjust',source:item.source,options:cfg});
 const second=api.calculate({kind:'adjust',source:first.text,originalSource:item.source,previousSource:first.text,options:cfg});
 if(nativeWrapper){
  assert.equal(first.text,item.source,item.id+' exact accepted native wrapper retained');
  assert.equal(first.changes.length,0,item.id+' preservation is not an applied edit');
  assert.equal((first.hunks||[]).length,0,item.id+' no invented diff');
  assert.equal(first.minorCheck.eligible,false,item.id+' unchanged source cannot become a minor edit');
  assert.deepEqual(api.summaryTopics(item.source,first.text,[]),[],item.id+' no generated summary topics');
  assert.equal(api.summaryForTopics([]),'',item.id+' no generated summary');
 }else{
 assert.notEqual(first.text,item.source,item.id+' first application changes source');
 }
 assert.equal(second.text,first.text,item.id+' second application is idempotent');
 assert.equal(second.changes.length,0,item.id+' second application makes no new adjustments');
 assert.deepEqual(payload(second.hunks),payload(first.hunks),item.id+' cumulative edit payload remains exact');
 assert.deepEqual(first.preservation,[],item.id+' first preservation');assert.deepEqual(second.preservation,[],item.id+' second preservation');
 const before=JSON.stringify(payload(first.hunks)),after=JSON.stringify(payload(second.hunks));
 proof.cases.push({id:item.id,sourceDisposition:nativeWrapper?'exact-native-wrapper-preservation':'existing-changed-fixture',nativeOldid:nativeWrapper?.nativeOldid||null,sourceSha256:hash(Buffer.from(item.source)),unchangedFinalTextSha256:hash(Buffer.from(first.text)),firstHunks:first.hunks.length,secondHunks:second.hunks.length,firstCumulativeEditPayloadSha256:hash(Buffer.from(before)),secondCumulativeEditPayloadSha256:hash(Buffer.from(after)),exactCumulativeEditPayload:before===after,secondNewAdjustments:second.changes.length,firstTraceLabels:(first.trace||[]).map(step=>step.label),secondTraceLabels:(second.trace||[]).map(step=>step.label),firstReasons:first.hunks.map(h=>h.reasons),secondReasons:second.hunks.map(h=>h.reasons)});
}
assert.equal(proof.cases.filter(row=>row.sourceDisposition==='existing-changed-fixture').length,10);
assert.equal(proof.cases.filter(row=>row.sourceDisposition==='exact-native-wrapper-preservation').length,2);
proof.independentOutsideControls=[];
for(const item of fixtures.positive){
 const nativeWrapper=nativeWrapperDisposition(item,cfg,'generator');if(!nativeWrapper)continue;
 assert.equal(item.source.split('{{Referências}}').length,2);
 const source=item.source.replace('{{Referências}}','{{Main|Brasil}}\n{{Referências}}'),expected=source.replace('{{Main|Brasil}}','{{Artigo principal|Brasil}}');
 const first=api.calculate({kind:'adjust',source,options:cfg}),second=api.calculate({kind:'adjust',source:first.text,originalSource:source,previousSource:first.text,options:cfg});
 assert.equal(first.text,expected,item.id+' disjoint native alias remains reachable');assert.equal(second.text,expected);assert.equal(second.changes.length,0);
 assert.deepEqual(first.preservation,[]);assert.deepEqual(second.preservation,[]);
 const originalBox=item.source.slice(0,item.source.indexOf("\n'''"));assert(first.text.startsWith(originalBox));
 proof.independentOutsideControls.push({id:item.id+'-independent-native-main-alias',sourceSha256:hash(Buffer.from(source)),expectedEndpointSha256:hash(Buffer.from(expected)),actualEndpointSha256:hash(Buffer.from(first.text)),nativeWrapperOldid:nativeWrapper.nativeOldid,onlyIndependentAliasChanged:true,firstChanges:first.changes.length,secondChanges:second.changes.length});
}
assert.equal(proof.independentOutsideControls.length,2);
assert.equal(proof.cases.length,12);
fs.writeFileSync(output,JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify({version:proof.version,cases:proof.cases.length,releaseManifestSha256:proof.releaseManifestSha256,wikipediaWrites:0}));
