'use strict';
// Original assertions stay byte-exact. Reviewed source-pinned expectations in
// disposable fixture copies include separately tested source-equivalent repairs.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const assert=require('node:assert/strict');
const candidate=require('./candidate.cjs'),complex=process.argv.includes('--complex');
candidate.verify();
const source=path.join(candidate.root,'tests/v26_engine'),stage=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-qa-'));
const selected=complex?['run_complex_all.cjs']:['run_contracts.cjs','run_integration.cjs','run_composition_options.cjs','run_quote_lexer.cjs','run_corpus_regressions.cjs'];
const originalAssertions=[],originalFixtureFiles=[],expectationChanges=[],results=[];let setupFailure=null;
function referenceFixtureCensus(text){
 const pattern=/<ref\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/ref\s*>)/gi,refs=[...text.matchAll(pattern)],definitions=new Map(),attribute=(raw,key)=>{const match=new RegExp('(?:^|\\s)'+key+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s/>]+))','i').exec(raw);return match?match[1]??match[2]??match[3]:null;};
 for(const ref of refs){const name=attribute(ref[1],'name'),group=attribute(ref[1],'group')||'';if(name&&ref[2]!==undefined){const key=JSON.stringify([group,name]);if(definitions.has(key))assert.equal(definitions.get(key),ref[2],'The reviewed output has no conflicting reference definition');definitions.set(key,ref[2]);}}
 const entries=new Map(),bindings=refs.map(ref=>{const group=attribute(ref[1],'group')||'',name=attribute(ref[1],'name'),key=JSON.stringify([group,name]);if(ref[2]===undefined)assert.ok(definitions.has(key),'Every reviewed reference call resolves to one complete source');if(!entries.has(group))entries.set(group,new Set());entries.get(group).add(name?'named:'+name:'anonymous:'+ref.index);return [group,ref[2]===undefined?definitions.get(key):ref[2]];});
 return {count:refs.length,entryCounts:Object.fromEntries([...entries].map(([group,names])=>[group,names.size])),bindings:JSON.stringify(bindings),outside:text.replace(pattern,'REFERENCE_PLACEHOLDER')};
}
function reviewedFixtureOutside(before,after,edits){
 const marker='APPROVED_FIXTURE_CHANGE';assert.equal(before.includes(marker)||after.includes(marker),false,'The independent comparison marker does not occur in either source');
 let beforeAt=0,afterAt=0;const retained=[];
 for(const edit of [...edits].sort((a,b)=>a.start-b.start)){
  assert.ok(edit.start>=beforeAt&&edit.end>=edit.start,'The three reviewed fixture ranges are ordered and disjoint');
  const outside=before.slice(beforeAt,edit.start);assert.equal(after.slice(afterAt,afterAt+outside.length),outside,'Every byte between approved fixture ranges is preserved');
  retained.push(outside,marker);afterAt+=outside.length;assert.equal(after.slice(afterAt,afterAt+edit.text.length),edit.text,'An approved range contains exactly its declared replacement');afterAt+=edit.text.length;beforeAt=edit.end;
 }
 assert.equal(after.slice(afterAt),before.slice(beforeAt),'Every byte after the last approved fixture range is preserved');retained.push(before.slice(beforeAt));return retained.join('');
}
try {
 fs.cpSync(source,stage,{recursive:true});
 for(const name of fs.readdirSync(source).filter(name=>name.endsWith('.cjs')&&name!=='engine.cjs')){
  const original=fs.readFileSync(path.join(source,name)),copied=fs.readFileSync(path.join(stage,name));
  if(!original.equals(copied))throw new Error('An inherited assertion file changed during staging: '+name);
  originalAssertions.push({file:'tests/v26_engine/'+name,sha256:candidate.sha(original)});
 }
 if(!complex){
  const manifestPath=path.join(__dirname,'INHERITED_EXPECTATIONS.json'),manifestBytes=fs.readFileSync(manifestPath),manifest=JSON.parse(manifestBytes);
  assert.equal(manifest.schema,1,'The fixture adaptation schema is known');
  assert.equal(manifest.version,candidate.manifest.version,'Expectation changes belong to this exact release');
  assert.equal(manifest.unchangedAssertionCode,true,'The original assertions cannot be replaced');
  assert.equal(manifest.oldFixtureCount,81,'All 81 inherited fixture cases are retained');
  assert.equal(manifest.newFixtureCount,81,'No inherited fixture is silently omitted');
  assert.deepEqual(manifest.changes.map(change=>change.name),['different named groups','existing equal duplicate cleanup creates citation equivalence','existing invalid parameter capitalization cleanup creates equality'],'Only the three reviewed contracts can change');
  assert.deepEqual(manifest.originalFiles.map(record=>record.file),['tests/v26_engine/negative_contracts.json','tests/v26_engine/positive_contracts.json'],'Only fixture data, never assertion code, can be adapted');
  const fixtures=new Map();
  for(const record of manifest.originalFiles){
   const relative=path.relative('tests/v26_engine',record.file);assert.equal(path.basename(relative),relative,'Fixture paths cannot escape their directory');
   const original=fs.readFileSync(path.join(source,relative)),copied=fs.readFileSync(path.join(stage,relative));
   assert.equal(original.length,record.bytes,'The original fixture file size is pinned');assert.equal(candidate.sha(original),record.sha256,'The complete original fixture file is pinned');assert.equal(copied.equals(original),true,'The disposable fixture copy starts byte-identical');
   const rows=JSON.parse(original);assert.equal(rows.length,record.cases,'Every original fixture is accounted for');fixtures.set(record.file,rows);originalFixtureFiles.push(record);
  }
  const negativeFile='tests/v26_engine/negative_contracts.json',positiveFile='tests/v26_engine/positive_contracts.json',negatives=fixtures.get(negativeFile),positives=fixtures.get(positiveFile);
  assert.equal(negatives.length+positives.length,manifest.oldFixtureCount,'The original fixture count is exact');
  for(const change of manifest.changes){
   const rows=fixtures.get(change.fixtureFile);assert.ok(rows,'A reviewed original fixture file is required');
   const original=rows[change.fixtureIndex];assert.deepEqual(original,change.originalFixture,'Name, source, old expected text and old rule are pinned together');assert.equal(original.name,change.name,'The reviewed fixture name matches');
   assert.equal(candidate.sha(original.source),change.sourceSha256,'The exact old source is unchanged');
   const oldExpected=original.expected??original.source;assert.equal(oldExpected,change.originalExpected,'The original expected result is preserved in provenance');assert.equal(candidate.sha(oldExpected),change.originalExpectedSha256,'The old expectation bytes are pinned');assert.equal(candidate.sha(change.newExpected),change.newExpectedSha256,'The exact handwritten new expectation is pinned');
   assert.equal(change.newKind,'positive','Reviewed changed behavior receives the full positive proof assertions');assert.ok(change.reason&&change.reason.trim(),'Each adaptation explains the semantic reason');
  }
  for(const change of manifest.changes){
   const rows=fixtures.get(change.fixtureFile),original=rows.find(fixture=>fixture.name===change.name),next={...original,expected:change.newExpected,rule:change.rule};
   assert.equal(original.source,change.originalFixture.source,'The executable fixture source remains exact');
   if(change.originalKind==='negative'){
    assert.equal(change.fixtureFile,negativeFile,'Only the reviewed negative fixture can be promoted');assert.equal(change.rule,'v29AnchorReferences','The promoted case proves the new anchor rule');negatives.splice(negatives.indexOf(original),1);positives.push(next);
   }else{assert.equal(change.fixtureFile,positiveFile,'Existing positive fixtures remain positive');assert.equal(change.rule,original.rule,'Existing positive contracts retain their original rule');rows[rows.indexOf(original)]=next;}
   expectationChanges.push({...change,expectationManifestSha256:candidate.sha(manifestBytes)});
  }
  assert.equal(negatives.length,54,'One reviewed preservation fixture is promoted');assert.equal(positives.length,27,'The promoted fixture gets all positive invariants');assert.equal(negatives.length+positives.length,manifest.newFixtureCount,'All inherited cases remain in the test run');
  for(const [file,rows]of fixtures)fs.writeFileSync(path.join(stage,path.basename(file)),JSON.stringify(rows,null,2)+'\n');
  assert.deepEqual((manifest.outputFixtureChanges||[]).map(change=>change.originalOutputFile),['tests/v26_engine/regressions/ken_legacy_cleanup.wiki'],'Only the individually reviewed real output fixture can change');
  for(const change of manifest.outputFixtureChanges||[]){
   assert.equal(change.sourceFile,'tests/v26_engine/regressions/73139500.wiki','The original real-biography source is fixed');assert.equal(change.metadataFile,'tests/v26_engine/derived_fixture.json','Only the matching derived-output metadata is adapted');
   const sourceBytes=fs.readFileSync(path.join(candidate.root,change.sourceFile)),outputBytes=fs.readFileSync(path.join(candidate.root,change.originalOutputFile)),metadataBytes=fs.readFileSync(path.join(candidate.root,change.metadataFile));
   assert.equal(sourceBytes.length,change.sourceBytes,'The entire real source size is pinned');assert.equal(candidate.sha(sourceBytes),change.sourceSha256,'The entire real source SHA is pinned');assert.equal(outputBytes.length,change.originalOutputBytes,'The complete old output size is pinned');assert.equal(candidate.sha(outputBytes),change.originalOutputSha256,'The complete original expected output is pinned');assert.equal(metadataBytes.length,change.originalMetadataBytes,'The old output metadata size is pinned');assert.equal(candidate.sha(metadataBytes),change.originalMetadataSha256,'The original metadata file is pinned');
   const metadata=JSON.parse(metadataBytes);assert.deepEqual(metadata,change.originalMetadata,'All original output metadata fields are preserved in provenance');assert.equal(metadata.sha256,change.originalOutputSha256,'The old hash assertion described the exact old fixture');assert.equal(metadata.bytes,change.originalOutputBytes,'The old byte assertion described the exact old fixture');
   const relativeOutput=path.relative('tests/v26_engine',change.originalOutputFile),relativeMetadata=path.relative('tests/v26_engine',change.metadataFile);assert.equal(fs.readFileSync(path.join(stage,relativeOutput)).equals(outputBytes),true,'The disposable output copy starts byte-identical');assert.equal(fs.readFileSync(path.join(stage,relativeMetadata)).equals(metadataBytes),true,'The disposable metadata copy starts byte-identical');
   const old=outputBytes.toString('utf8'),edits=[];assert.equal(change.replacements.length,2,'Exactly the two reviewed reference occurrences change');
   for(const replacement of change.replacements){assert.equal(replacement.occurrences,1,'Every reviewed reference occurrence is unique');assert.equal(old.split(replacement.before).length-1,1,'The exact old reference bytes have one match');const start=old.indexOf(replacement.before);edits.push({start,end:start+replacement.before.length,text:replacement.after});}
   let referenceOnly=old;for(const edit of edits.sort((a,b)=>b.start-a.start))referenceOnly=referenceOnly.slice(0,edit.start)+edit.text+referenceOnly.slice(edit.end);
   assert.equal(Buffer.byteLength(referenceOnly),change.referenceOnlyOutputBytes,'The previously reviewed reference-only intermediate byte count remains pinned');assert.equal(candidate.sha(referenceOnly),change.referenceOnlyOutputSha256,'The previous reference-only intermediate SHA remains pinned');
   const style=change.styleReplacement;assert.ok(style,'The sole collector-style adaptation must be explicitly reviewed');
   assert.equal(style.before,'{{Referências|estilo=column-count:2;}}','Only the known legacy collector style is replaced');assert.equal(style.after,'{{Referências|estilo=column-count:2;column-width:30em;column-gap:2em;max-width:62em;}}','The replacement is exactly the separately rendered responsive style');
   assert.equal(style.occurrences,1,'One collector style changes');assert.equal(old.split(style.before).length-1,1,'The exact original collector occurs once');assert.equal(referenceOnly.split(style.before).length-1,1,'The reference-only intermediate retains that collector unchanged');
   assert.equal(candidate.sha(style.before),style.beforeSha256,'The original collector-style bytes are pinned');assert.equal(candidate.sha(style.after),style.afterSha256,'The responsive collector-style bytes are pinned');
   assert.equal(Buffer.byteLength(style.after)-Buffer.byteLength(style.before),style.byteDelta,'The sole style delta is explicit');assert.equal(style.byteDelta,48,'The responsive CSS adds exactly 48 bytes');
   const next=referenceOnly.replace(style.before,style.after),styleStart=old.indexOf(style.before),allEdits=[...edits,{start:styleStart,end:styleStart+style.before.length,text:style.after}];
   assert.equal(Buffer.byteLength(next),change.newOutputBytes,'The handwritten expected output has the pinned byte size');assert.equal(candidate.sha(next),change.newOutputSha256,'The complete handwritten new expectation has the pinned SHA');
   const beforeCensus=referenceFixtureCensus(old),referenceOnlyCensus=referenceFixtureCensus(referenceOnly),afterCensus=referenceFixtureCensus(next);assert.equal(beforeCensus.count,change.referenceCount,'The old source-reference count is pinned');assert.equal(afterCensus.count,change.referenceCount,'No reference occurrence is removed from the real biography');assert.equal(beforeCensus.bindings,afterCensus.bindings,'Every ordered reference group and exact resolved body stays unchanged');assert.equal(candidate.sha(beforeCensus.bindings),change.orderedResolvedReferenceSha256,'The independent reference meaning is pinned');assert.equal(beforeCensus.outside,referenceOnlyCensus.outside,'The two reference changes retain every original byte outside reference tags');assert.equal(candidate.sha(beforeCensus.outside),change.outsideReferenceTextSha256,'The original nonreference text is independently pinned');
   assert.deepEqual(afterCensus.entryCounts,{'':style.confirmedEntries},'The known sole ungrouped collector has the independently counted distinct entries');assert.equal(style.confirmedEntries,180,'The source-pinned collector contains 180 distinct references');assert.equal(style.minimumEntries,10,'The new style requires at least ten entries');assert.ok(style.confirmedEntries>=style.minimumEntries,'The reviewed real collector meets the threshold');
   assert.equal(beforeCensus.outside.replace(style.before,'REFERENCE_COLUMN_STYLE'),afterCensus.outside.replace(style.after,'REFERENCE_COLUMN_STYLE'),'Only the declared collector style changes outside reference tags');assert.equal(candidate.sha(afterCensus.outside),change.newOutsideReferenceTextSha256,'The exact nonreference text after the style-only change is pinned');
   assert.equal(candidate.sha(reviewedFixtureOutside(old,next,allEdits)),change.outsideApprovedChangesSha256,'Every byte outside the two references and the one collector style is independently pinned');
   fs.writeFileSync(path.join(stage,relativeOutput),next);fs.writeFileSync(path.join(stage,relativeMetadata),JSON.stringify({...metadata,sha256:change.newOutputSha256,bytes:change.newOutputBytes,transformation:change.reason},null,2)+'\n');
   originalFixtureFiles.push({file:change.originalOutputFile,sha256:change.originalOutputSha256,bytes:change.originalOutputBytes},{file:change.metadataFile,sha256:change.originalMetadataSha256,bytes:change.originalMetadataBytes});expectationChanges.push({...change,kind:'source-equivalent-real-output-fixture',expectationManifestSha256:candidate.sha(manifestBytes)});
  }
 }
 // This generated local file is never included in the repository or a release.
 fs.writeFileSync(path.join(stage,'engine.cjs'),'module.exports=require('+JSON.stringify(path.join(__dirname,'engine_helper.cjs'))+');\n');
 for(const name of selected){
  const run=spawnSync(process.execPath,[path.join(stage,name)],{cwd:stage,env:{...process.env,REVISAWIKI_REPORT_DIR:candidate.artifactDirectory()},encoding:'utf8',maxBuffer:8*1024*1024});
  process.stdout.write(candidate.sanitized(run.stdout||'',[stage]));process.stderr.write(candidate.sanitized(run.stderr||'',[stage]));
  results.push({file:'tests/v26_engine/'+name,exitCode:run.status,error:run.error?candidate.sanitized(run.error.message,[stage]):undefined});
  if(run.status!==0){process.exitCode=1;break;}
 }
} catch(error) {
 setupFailure=candidate.sanitized(error.message,[stage]);process.exitCode=1;throw error;
} finally {
 fs.rmSync(stage,{recursive:true,force:true});
 const report={version:candidate.manifest.version,kind:'unchanged-inherited-assertions-source-pinned-expectation-adapter',status:!setupFailure&&results.length===selected.length&&results.every(result=>result.exitCode===0)?'passed':'failed',complex,frozenFiles:candidate.manifest.files,originalAssertionFiles:originalAssertions,originalFixtureFiles,expectationChanges,results,setupFailure,networkRequests:0,wikipediaWrites:0};
 fs.writeFileSync(path.join(candidate.artifactDirectory(),complex?'engine_complex_adapter.json':'engine_adapter.json'),JSON.stringify(report,null,2)+'\n');
}
