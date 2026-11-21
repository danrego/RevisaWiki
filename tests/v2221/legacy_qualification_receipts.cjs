'use strict';
// Aggregate only fresh, source-bound current qualifications. Raw attempts are
// never edited, and an unexpected error or timeout is never a preference.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const inputRaw=fs.readFileSync(path.join(__dirname,'legacy_receipt_input_pins.json'));
if(sha(inputRaw)!=='42ba894a5c16aa19531be1f93eff8856cdd3742ad13331553477d8e06d3ef7b4')throw Error('Finite historical input pins changed');
const INPUT_PINS=JSON.parse(inputRaw);
const QUALIFIERS=Object.freeze({
 closedAutoname:'tests/v2221/autoname_contract_qualification.cjs',
 infobox:'tests/v2221/infobox_legacy_qualification.cjs',
 talk:'tests/v2221/talk_layout_legacy_qualification.cjs',
 references:'tests/v2221/reference_repairs_legacy_preferences.cjs',
 nativeReferences:'tests/v2221/reference_repairs_v2220_preferences.cjs'
});
const DIRECT_REFERENCES=new Set(['tests/v2217/reference_integration.cjs','tests/v2217/reference_legacy_collector_conflicts.cjs','tests/v2217/collector_stage_isolation.cjs','tests/v2217/manual_heading_anchor_integrity.cjs','tests/v2217/reference_note_owner.cjs','tests/v2220/reference_manual_heading_qualification.cjs','tests/v2220/reference_inherited_qualification.cjs']);
const NATIVE_REFERENCES=new Set(['tests/v2220/references.cjs','tests/v2220/reference_integration.cjs','tests/v2220/talk_footer.cjs']);
const TALK_LEAVES=new Set(['tests/v2217/talk_contract.cjs','tests/v2217/talk_properties.cjs','tests/v2217/talk_layout_integration.cjs']);
const INFOBOX_LEAVES=new Set(['tests/v2217/infobox_cases.cjs','tests/v2217/infobox_integrated.cjs','tests/v2217/portal_cases.cjs','tests/v2217/portal_field_priority.cjs','tests/v2217/portal_destination.cjs','tests/v2220/infobox_cases.cjs','tests/v2220/infobox_unicode_fields_integration.cjs','tests/v2220/native_syntax_integration.cjs']);
const AUTONAME=Object.freeze({optionsSha256:'c2ddac25f5cb9e38a0a6b2328ae7b4e91acafb15177212b750c514c622e1633a',file:'tests/v2216/autonames.cjs',sha256:'44954a3fcae44862c6197a9cbf4c8b08e1df3b25e420c75dddec1e1c7a94b2e6',quote:'tests/v2216/autoname_quote_integrity.cjs',quoteSha256:'a83f7f7130266adb9a70a60d23b26791032fe180510600b3ce97a1dfb340965a',sourceSha256:'e309e180511127d930a8edab927ff771108665fc443b344147127fb019b4245d'});
const INHERITED_REFERENCE_CHILDREN=new Set(['tests/v2216/reference_repairs.cjs','tests/v2216/reference_properties.cjs','tests/v2216/reference_integration.cjs',AUTONAME.file,AUTONAME.quote,'tests/v2212/citations.cjs','tests/v2212/citations_full.cjs','tests/v2212/citations_language.cjs']);
const empty=x=>Array.isArray(x)&&x.length===0,all=x=>Array.isArray(x)&&x.length>0;
const sameSet=(values,expected)=>Array.isArray(values)&&values.length===expected.size&&new Set(values).size===expected.size&&values.every(x=>expected.has(x));
function check(value,message){if(!value)throw Error(message);}
function read(file){check(!fs.lstatSync(file).isSymbolicLink()&&fs.statSync(file).isFile(),'Receipt is not a regular file');const raw=fs.readFileSync(file);check(raw.length<=33554432,'Receipt is unexpectedly large');return {file,sha256:sha(raw),bytes:raw.length,data:JSON.parse(raw)};}
function identifier(bundle,suite){return(bundle.endsWith('_completo.js')?'complete-':'modular-')+suite.replaceAll('/','_').replace('.cjs','');}
function testHash(root,suite){check(/^tests\/[A-Za-z0-9_/-]+\.cjs$/.test(suite)&&!suite.split('/').includes('..'),'Invalid historical test name');return sha(fs.readFileSync(path.join(root,suite)));}
const hashValue=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const keys=(value,expected)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join('|')===expected.slice().sort().join('|');
function inputsMatch(rows,expected){return Array.isArray(rows)&&rows.length===expected.length&&rows.every((row,i)=>row.id===expected[i].id&&row.sourceSha256===expected[i].sourceSha256);}
function boundCapture(file,artifact,out,json=true){
 const relative=path.relative(out,file).split(path.sep).join('/');check(relative&&relative!=='..'&&!relative.startsWith('../')&&!path.isAbsolute(relative),'Nested receipt escapes the execution directory');
 const pin=artifact.pins?.[relative];check(pin&&hashValue(pin.sha256)&&Number.isInteger(pin.bytes),'Nested execution capture has no execution-time pin');
 let cursor=out;for(const part of relative.split('/')){cursor=path.join(cursor,part);check(!fs.lstatSync(cursor).isSymbolicLink(),'Nested execution capture cannot follow a symlink');}
 const raw=fs.readFileSync(file);check(raw.length===pin.bytes&&sha(raw)===pin.sha256,'Nested execution capture changed');return {file,sha256:pin.sha256,bytes:pin.bytes,data:json?JSON.parse(raw):raw.toString('utf8')};
}
function closedAutonameEnvelope(data,row,root){
 check(data.suite==='exact-closed-autoname-contract-qualification'&&data.engineVersion==='2.22.1'&&data.runtimeSha256===row.bundleSha256&&data.passed===true,'Closed autoname counterpart did not pass on this runtime');
 check(data.checks===337&&data.calculations===54&&data.positiveClosedControls===1&&data.mutationControls===5&&data.wikipediaWrites===0,'Closed autoname assertion/control coverage differs');
 check(data.originalTestsModified===false&&data.productionGuardsModified===false&&data.productionFunctionsMocked===false&&data.allOtherOriginalAssertionsExecuted===true,'Closed autoname original assertions or guards changed');
 check(Array.isArray(data.tasks)&&data.tasks.length===2,'Closed autoname original task inventory differs');
 for(const [index,file,hash,sites,checks,calls]of [[0,AUTONAME.file,AUTONAME.sha256,1,89,18],[1,AUTONAME.quote,AUTONAME.quoteSha256,0,243,36]]){const task=data.tasks[index];check(keys(task,['file','originalSha256','qualifiedAssertionSites','checks','calculations','legacyReceiptSha256','passed'])&&task.file===file&&task.originalSha256===hash&&testHash(root,file)===hash&&task.qualifiedAssertionSites===sites&&task.checks===checks&&task.calculations===calls&&hashValue(task.legacyReceiptSha256)&&task.passed===true,'Closed autoname original task binding differs');}
 check(Array.isArray(data.qualifications)&&data.qualifications.length===1,'Closed autoname finite source inventory differs');const q=data.qualifications[0];
 check(keys(q,['id','sourceSha256','optionsSha256','oldExpected','currentExpected','nameRepairCredit','outputSha256'])&&q.id==='AUTONAME-CLOSED-OPAQUE-RESERVATION-01'&&q.sourceSha256===AUTONAME.sourceSha256&&q.outputSha256===q.sourceSha256&&q.optionsSha256===AUTONAME.optionsSha256&&q.oldExpected==='rename :0 to Silva2026-2 despite unknown program'&&q.currentExpected==='hold every source identity and argument'&&q.nameRepairCredit===0,'Closed autoname source/hold or zero-credit proof differs');
 return true;
}
function closedAutonameOriginalReceipt(value,task,row){
 const names=task.file===AUTONAME.file,identity=names?'inputSha256':'sourceSha256';check(keys(value,['suite','runtimeSha256','checks','calculations','rows','wikipediaWrites'])&&value.suite===(names?'descriptive-reference-names-2.21.6':'autoname-active-quote-integrity-2.21.6')&&value.runtimeSha256===row.bundleSha256&&value.checks===task.checks&&value.calculations===task.calculations&&value.wikipediaWrites===0&&Array.isArray(value.rows)&&value.rows.length===(names?9:36),'Closed autoname original full receipt schema differs');
 check(value.rows.every(item=>keys(item,names?['inputSha256','outputSha256']:['id','sourceSha256','outputSha256'])&&hashValue(item[identity])&&hashValue(item.outputSha256)&&(names||typeof item.id==='string'&&item.id.length))&&new Set(value.rows.map(item=>item[identity])).size===value.rows.length,'Closed autoname original input/output inventory incomplete');return true;
}
function exactAutonameError(text){
 const envelope=typeof text==='string'&&/^node:assert:[0-9]+\n  throw new AssertionError\(obj\);\n  \^\n\nAssertionError \[ERR_ASSERTION\]: Opaque arguments and actual names both reserve target identities\n\nfalse !== true\n\n((?:    at [^\r\n]+\n)*    at [^\r\n]+) \{\n  generatedMessage: false,\n  code: 'ERR_ASSERTION',\n  actual: false,\n  expected: true,\n  operator: 'deepStrictEqual',\n  diff: 'simple'\n\}\n\nNode\.js v24\.[0-9]+\.[0-9]+\n$/.exec(text);
 check(envelope,'Autoname stderr contains an additional error, warning or unreviewed envelope');const frames=envelope[1].split('\n');
 check(frames.length>=3&&/^    at eq \([^()\r\n]+\/tests\/v2216\/autonames\.cjs:3:40\)$/.test(frames[0])&&/^    at Object\.<anonymous> \([^()\r\n]+\/tests\/v2216\/autonames\.cjs:40:2\)$/.test(frames[1]),'Autoname original assertion sites differ');
 check(frames.slice(2).every(frame=>/^    at [\w.$<> ]+(?: \[as [\w.$<>]+\])? \(node:[\w./:_-]+\)$/.test(frame)||/^    at node:[\w./:_-]+$/.test(frame)||/^    at Module\._compile \([^()\r\n]+\/tests\/v2215\/legacy_minified_bindings\.cjs:34:25\)$/.test(frame)),'Autoname stderr has an unreviewed stack frame');return true;
}
function inheritedClosedCompletion(summary,row,root,artifact,out,directory){
 check(keys(summary,['scope','bundle','bundleSha256','externalProcessCapMilliseconds','tasks','checks','additionalCalculateCalls','rawFailedSuites','exactQualifiedSuites','passed','wikipediaWrites'])&&summary.scope==='Unchanged inherited reference/citation functional suites only; no talk policy expectations reclassified'&&summary.bundle===row.bundle&&summary.bundleSha256===row.bundleSha256&&summary.externalProcessCapMilliseconds===600000&&summary.passed===false&&summary.wikipediaWrites===0&&sameSet(summary.tasks.map(r=>r.file),INHERITED_REFERENCE_CHILDREN),'Inherited closed-autoname child inventory/runtime differs');
 let autonames=0;
 for(const child of summary.tasks){
  check(child.testSha256===testHash(root,child.file)&&child.testUnchanged===true&&child.bundleUnchanged===true&&child.signal===null&&child.error===null&&(child.checks===null||Number.isInteger(child.checks)&&child.checks>=0)&&(child.cases===null||Number.isInteger(child.cases)&&child.cases>=0),'Inherited child source, process, counts or runtime differs');
  const stem=path.join(directory,child.file.replaceAll('/','-')),stdout=boundCapture(stem+'.stdout',artifact,out,false),stderr=boundCapture(stem+'.stderr',artifact,out,false);
  check(stdout.sha256===child.stdoutSha256&&stderr.sha256===child.stderrSha256,'Inherited child logs differ from its summary');
  if(child.file===AUTONAME.file){check(child.testSha256===AUTONAME.sha256&&child.status==='failed'&&child.exitCode===1&&child.checks===null&&child.cases===null&&stdout.data===''&&!Object.hasOwn(child,'qualification'),'Autoname raw status was rewritten or another result was substituted');exactAutonameError(stderr.data);autonames++;}
  else if(child.status==='passed')check(child.exitCode===0&&stderr.data==='','An inherited successful child has an error');
  else{const q=child.qualification;check(['tests/v2216/reference_repairs.cjs','tests/v2216/reference_integration.cjs'].includes(child.file)&&child.status==='failed'&&child.exitCode===1&&q?.accepted===true&&q.classification==='exact-old-syntax-expectation-superseded-by-native-heading-ownership'&&q.testSha256===child.testSha256&&q.bundleSha256===row.bundleSha256&&q.sourceFieldsAndDefinitionsExact===true&&q.originalTestsChanged===false&&q.productionGuardsChanged===false&&q.mutationControls===8&&q.checks===15&&q.additionalCalculateCalls===2&&q.rawFailureCount===1&&q.nativeTemplateOldid===63785697&&q.nativeHeadingHelperOldid===72474006&&q.nativeContractAuditSha256==='be2f5c6bf41450ebd25cffa920364c1e4ddbfe71d7b9b80a61ef15bc7a2c784b'&&q.sourceSha256===sha('Texto.<ref>Fonte</ref>\n== Referências ==\n{{Reflist|2}}'),'Another inherited child has an unqualified failure');const capture=boundCapture(stem+'.json',artifact,out);check(capture.sha256===q.rawReceiptSha256,'Prior exact numeric qualification lost its raw receipt');}
 }
 check(autonames===1&&summary.rawFailedSuites===summary.tasks.filter(r=>r.status==='failed').length&&summary.exactQualifiedSuites===summary.tasks.filter(r=>r.qualification?.accepted===true).length&&summary.rawFailedSuites===summary.exactQualifiedSuites+1,'An additional inherited failure is unresolved');
 check(summary.checks===summary.tasks.reduce((n,r)=>n+(Number(r.checks)||0)+(r.qualification?.checks||0),0)&&summary.additionalCalculateCalls===summary.tasks.reduce((n,r)=>n+(r.qualification?.additionalCalculateCalls||0),0),'Inherited original assertion totals differ');return true;
}
function compositeReferenceCompletion(artifact,row,root,out,closed){
 check(closed,'Closed-autoname actual counterpart is missing');closedAutonameEnvelope(closed.data,row,root);
 const data=artifact.data,wrapper='tests/v2220/reference_inherited_qualification.cjs';
 const executionStem=path.join(out,identifier(row.bundle,row.suite));check(fs.readFileSync(executionStem+'.stderr','utf8')==='','Composite qualifier has an additional process error');const lines=fs.readFileSync(executionStem+'.stdout','utf8').trimEnd().split('\n'),last=JSON.parse(lines[lines.length-1]);check(keys(last,['tasks','qualified','failed','passed'])&&last.tasks===7&&last.qualified===data.qualifications.length&&last.passed===false&&Array.isArray(last.failed)&&last.failed.length===1&&last.failed[0]===wrapper,'Composite qualifier stdout has another failure');
 check(data.passed===false&&data.allOtherOriginalAssertionsExecuted===false&&sameSet(data.tasks.map(r=>r.file),DIRECT_REFERENCES),'Composite raw reference task inventory differs');
 for(const task of data.tasks){check(task.originalSha256===testHash(root,task.file),'Composite reference task source changed');if(task.file!==wrapper)check(task.passed===true&&task.error===null,'An independent reference task failed');else check(task.passed===false&&task.qualifiedAssertionSites===1&&typeof task.error==='string'&&task.error.split('\n')[0]==='AssertionError [ERR_ASSERTION]: all inherited child assertions and other native qualifications passed'&&/\/tests\/v2220\/reference_inherited_qualification\.cjs:29:89\)/.test(task.error),'Composite reference failure is not the final inherited-summary assertion');}
 const directory=artifact.file+'.reference_inherited_qualification.cjs.legacy.private.json.legacy-inherited',summary=boundCapture(path.join(directory,'SUMMARY.json'),artifact,out);inheritedClosedCompletion(summary.data,row,root,artifact,out,directory);
 return {classification:'exact-closed-autoname-child-with-all-other-original-reference-assertions',heldSourceSha256:AUTONAME.sourceSha256,nameRepairCredit:0,childSummary:{file:path.relative(out,summary.file).split(path.sep).join('/'),sha256:summary.sha256,bytes:summary.bytes},closedAutonameReceipt:{file:path.basename(closed.file),sha256:closed.sha256,bytes:closed.bytes}};
}
function manualPropertyComplete(value,row){
 check(keys(value,['kind','version','bundle','bundleSha256','nativeContractAuditSha256','cases','checks','calculations','rows','wikipediaWrites']),'Manual property report schema differs');
 check(value.kind==='native-renderer-containing-section-integrity-property'&&value.version==='2.21.7'&&value.bundle===row.bundle&&value.bundleSha256===row.bundleSha256,'Manual property runtime differs');
 check(value.nativeContractAuditSha256===INPUT_PINS.manual.nativeContractAuditSha256&&value.cases===1119&&value.checks===5737&&value.calculations===102&&value.wikipediaWrites===0,'Manual property counts/native proof incomplete');
 check(inputsMatch(value.rows,INPUT_PINS.manual.rows),'Manual property input identities differ');
 const counts={changed:0,plain:0,replacements:0,idempotent:0,one:0,zero:0};
 for(let index=0;index<value.rows.length;index++){
  const item=value.rows[index],input=INPUT_PINS.manual.rows[index];
  check(hashValue(item.sourceSha256),'Manual source hash malformed');
  if(keys(item,['id','sourceSha256','outputSha256','changed'])){check(input.shape==='changed'&&typeof item.changed==='boolean'&&hashValue(item.outputSha256),'Manual changed row incomplete');counts.changed++;}
  else if(keys(item,['id','sourceSha256','outputSha256'])){check(input.shape==='plain'&&hashValue(item.outputSha256),'Manual output hash incomplete');counts.plain++;}
  else if(keys(item,['id','sourceSha256','replacementCount'])){check(input.shape==='replacements'&&item.replacementCount===input.replacementCount,'Manual replacement count differs');counts.replacements++;counts[item.replacementCount?'one':'zero']++;}
  else if(keys(item,['id','sourceSha256','outputSha256','secondOutputSha256','firstPassIdempotence'])){check(input.shape==='idempotent'&&item.firstPassIdempotence===true&&hashValue(item.outputSha256)&&item.outputSha256===item.secondOutputSha256,'Manual replay is not idempotent');counts.idempotent++;}
  else throw Error('Unexpected manual property row schema');
 }
 check(JSON.stringify(counts)===JSON.stringify({changed:992,plain:78,replacements:30,idempotent:19,one:24,zero:6}),'Manual property row coverage incomplete');
 return true;
}
function footerEndpoint(id,source,expected,output){
 const row=INPUT_PINS.footer.rows.find(row=>row.id===id);
 return !!row&&source===row.source&&expected===row.expected&&output===row.actual&&sha(source)===row.sourceSha256&&sha(expected)===row.expectedSha256&&sha(output)===row.actualSha256;
}
function collectorReport(value,row,qualified){
 check(keys(value,['kind','bundle','bundleSha256','cases','checks','calculateCalls','failures','rows','wikipediaWrites']),'Collector raw report schema differs');
 check(value.kind==='existing-citation-and-manual-heading-composition-regression'&&value.bundle===row.bundle&&value.bundleSha256===row.bundleSha256&&value.cases===26&&value.wikipediaWrites===0,'Collector raw runtime/count differs');
 check(value.checks===(qualified?84:81)&&value.calculateCalls===(qualified?18:15)&&value.failures===(qualified?0:3),'Collector assertion/call/failure count differs');
 check(inputsMatch(value.rows,INPUT_PINS.collector.rows),'Collector finite input identities differ');
 for(let i=0;i<value.rows.length;i++){
  const item=value.rows[i],failed=!qualified&&INPUT_PINS.collector.qualifiedFailedIds.includes(item.id);
  if(failed){
   check(keys(item,['id','sourceSha256','status','error'])&&item.status==='failed'&&typeof item.error==='string','Collector failure schema differs');
   const lines=item.error.split('\n');check(lines[0]==='AssertionError [ERR_ASSERTION]: '+item.id+INPUT_PINS.collector.assertionSuffix&&lines.slice(1).every(line=>/^    at [^\r\n]+$/.test(line))&&!/\b(?:TypeError|ReferenceError|SyntaxError|RangeError|AggregateError)\b/.test(item.error),'Collector failure is not the exact reviewed assertion');
  }else{
   const output=INPUT_PINS.collector.rows[i].successfulOutputRequired;
   check(keys(item,output?['id','sourceSha256','status','outputSha256']:['id','sourceSha256','status'])&&item.status==='passed'&&(!output||hashValue(item.outputSha256)),'Collector successful row incomplete');
  }
 }
 return true;
}
function collectorJsonClaim(artifact,row,root,out){
 if(row.suite!==INPUT_PINS.collector.suite||row.testSha256!==INPUT_PINS.collector.sourceSha256)return null;
 referenceClaim(artifact.data,row,false,!!artifact.compositeEvidence);
 const expectedFile=identifier(row.bundle,row.suite)+'.json',descriptor=row.rawReceipt;
 check(descriptor&&descriptor.file===expectedFile&&hashValue(descriptor.sha256)&&Number.isInteger(descriptor.bytes),'Missing exact raw collector receipt pin');
 const raw=read(path.join(out,expectedFile));check(raw.sha256===descriptor.sha256&&raw.bytes===descriptor.bytes,'Raw collector receipt changed');collectorReport(raw.data,row,false);
 const stdout=JSON.parse(fs.readFileSync(path.join(out,identifier(row.bundle,row.suite)+'.stdout'),'utf8'));
 check(keys(stdout,['cases','checks','calculateCalls','failures'])&&stdout.cases===26&&stdout.checks===81&&stdout.calculateCalls===15&&stdout.failures===3,'Raw collector stdout and JSON receipt disagree');
 const nested=read(artifact.file+'.'+path.basename(row.suite)+'.legacy.private.json'),frozen=artifact.pins?.[path.basename(nested.file)];
 check(frozen?.sha256===nested.sha256&&frozen.bytes===nested.bytes,'Nested collector replay receipt changed');collectorReport(nested.data,row,true);
 for(let i=0;i<raw.data.rows.length;i++)if(raw.data.rows[i].status==='passed')check(raw.data.rows[i].outputSha256===nested.data.rows[i].outputSha256,'An unrelated collector endpoint changed');
 return {classification:'exact-source-bound-json-assertion-reference-preference',qualifiedCaseIds:INPUT_PINS.collector.qualifiedFailedIds,rawReceipt:{file:expectedFile,sha256:raw.sha256,bytes:raw.bytes},nestedReceipt:{file:path.basename(nested.file),sha256:nested.sha256,bytes:nested.bytes}};
}
function nativeFooterClaim(artifact,row){
 const claim=referenceClaim(artifact.data,row,true);if(row.suite!==INPUT_PINS.footer.suite)return claim;
 check(row.testSha256===INPUT_PINS.footer.sourceSha256&&artifact.data.allAssertionsCompleted===true,'Footer original test/completion differs');
 const actual=artifact.data.qualified.filter(item=>item.id.startsWith('footer-portal-gap:'));
 check(actual.length===4&&new Set(actual.map(item=>item.id)).size===4&&INPUT_PINS.footer.rows.every(expected=>actual.some(item=>item.id==='footer-portal-gap:'+expected.id&&item.sourceSha256===expected.sourceSha256&&item.expectedSha256===expected.expectedSha256&&item.targetSha256===expected.actualSha256&&item.nativeFooterProducerProofRetained===true&&item.allTemplatePayloadsByteExact===true)),'Footer finite endpoint/native proof inventory incomplete');
 const nested=read(artifact.file+'.talk_footer.cjs.legacy.private.json'),frozen=artifact.pins?.[path.basename(nested.file)],data=nested.data;
 check(frozen?.sha256===nested.sha256&&frozen.bytes===nested.bytes,'Footer original assertion replay receipt changed');
 check(data.suite==='v2220-talk-footer'&&data.runtimeSha256===row.bundleSha256&&data.passed===true&&data.checks===442&&data.cases===88&&Array.isArray(data.results)&&data.results.length===88&&data.results.every((item,index)=>keys(item,['id','changed','count'])&&item.id===INPUT_PINS.footer.allCaseIds[index]&&typeof item.changed==='boolean'&&Number.isInteger(item.count)&&item.count>=0),'Footer original assertions did not all complete');
 return {...claim,classification:'exact-four-native-portal-separator-endpoints',qualifiedCaseIds:INPUT_PINS.footer.rows.map(item=>item.id),nestedReceipt:{file:path.basename(nested.file),sha256:nested.sha256,bytes:nested.bytes}};
}
function infoboxClaim(data,row){
 check(data.kind==='historical-infobox-current-contract-qualification'&&data.status==='passed-qualified-current-contract','Infobox qualification did not pass');
 check(empty(data.unexpectedHistoricalFailures)&&empty(data.controlFailures),'Infobox qualification has unresolved failures');
 check(all(data.controls)&&data.controls.every(r=>r.status==='passed')&&data.replacementChecks>0,'Infobox replacement controls incomplete');
 check(data.historicalOriginalSuiteStatusesRewritten===false,'Historical status was rewritten');
 const inventory=data.rawInventory;check(inventory?.historicalFilesModified===false&&inventory.runtimeVersion==='2.22.1'&&inventory.runtimeSha256===data.runtimeSha256&&all(inventory.results),'Missing complete historical assertion inventory');
 check(sameSet(inventory.results.map(r=>r.suite),INFOBOX_LEAVES),'Incomplete historical infobox suite inventory');
 check(inventory.results.every(r=>r.exception===null&&r.historicalStatusUnmodified===true&&r.passedAssertions+r.failures.length===r.assertions),'Historical assertions did not all execute');
 check(inventory.results.reduce((n,r)=>n+r.assertions,0)===data.historicalAssertions,'Historical assertion totals differ');
 const found=inventory.results.find(r=>r.suite===row.suite);if(!found)return null;
 check(found.testSha256===row.testSha256&&found.failures.length>0,'No exact superseded historical assertions were demonstrated');
 const approved=data.qualifiedHistoricalDifferences.filter(r=>r.suite===row.suite);
 check(approved.length===found.failures.length&&found.failures.every(f=>approved.some(a=>a.assertion===f.assertion&&typeof a.category==='string'&&a.category)),'An assertion failure was not precisely qualified');
 return {classification:'exact-infobox-preference-or-provenance-contract',qualifiedAssertions:approved.map(r=>r.assertion)};
}
function talkClaim(data,row,root){
 check(data.suite==='v2221-talk-layout-precise-historical-qualification'&&data.version==='2.22.1'&&data.passed===true,'Talk qualification did not pass');
 check(data.oldTestFilesModified===false&&data.historicalFailedStatusesRewritten===false&&data.productOrPreservationGuardsModified===false,'Talk qualification changed guards/history');
 check(all(data.legacyAssertions)&&data.legacyAssertions.every(r=>r.passed===true&&r.checks>0),'Talk assertion set incomplete');
 check(data.qualifiedAssertionSites===5&&data.mutationControls>=7&&data.fullActionCalls>0,'Talk exact endpoint/mutation controls incomplete');
 for(const leaf of TALK_LEAVES)check(data.legacyAssertions.some(r=>r.file===leaf)&&data.sourcePins?.[leaf]===testHash(root,leaf),'Talk leaf source pin missing');
 if(TALK_LEAVES.has(row.suite)){
  check(data.sourcePins[row.suite]===row.testSha256,'Talk original test pin differs');
  return {classification:'exact-projects-before-translation-order',qualifiedAssertionSites:5};
 }
 if(row.suite==='tests/v2220/talk_layout_qualification.cjs'){
  check(data.sourcePins?.[row.suite]===row.testSha256&&typeof data.versionGuardQualification==='string','Old talk harness pin is not represented');
  return {classification:'exact-superseded-talk-version-harness-with-current-full-assertions',qualifiedAssertionSites:5};
 }
 return null;
}
function referenceEnvelope(data,expectedSuite,composite=false){
 check(data.suite===expectedSuite&&data.engineVersion==='2.22.1'&&(data.passed===true||composite&&data.passed===false),'Reference qualification did not pass');
 check(data.productionFunctionsMocked===false,'Reference production functions were replaced');
 if(expectedSuite==='v2221-exact-legacy-presentation-and-key-qualification')check(data.originalTestsModified===false&&data.productionGuardsModified===false&&(data.allOtherOriginalAssertionsExecuted===true||composite&&data.allOtherOriginalAssertionsExecuted===false),'Reference original assertions/guards not preserved');
 else check(data.oldTestFilesChanged===false&&data.productionGuardsChanged===false&&data.allOtherAssertionsExecuteUnchanged===true,'Native reference original assertions/guards not preserved');
 check(all(data.tasks)&&(composite||data.tasks.every(r=>r.passed===true&&r.error===null)),'A reference child qualification failed');
 check(sameSet(data.tasks.map(r=>r.file),expectedSuite==='v2221-exact-legacy-presentation-and-key-qualification'?DIRECT_REFERENCES:NATIVE_REFERENCES),'Incomplete reference qualification task set');
}
function referenceClaim(data,row,native,composite=false){
 referenceEnvelope(data,native?'v2221-exact-v2220-collector-preference-qualification':'v2221-exact-legacy-presentation-and-key-qualification',composite);
 if(!(native?NATIVE_REFERENCES:DIRECT_REFERENCES).has(row.suite))return null;
 const task=data.tasks.find(r=>r.file===row.suite);if(!task)return null;
 check(task.originalSha256===row.testSha256&&task.qualifiedAssertionSites>0,'Reference original test or exact sites differ');
 return {classification:native?'exact-v2220-reference-collector-preference':'exact-reference-presentation-and-native-key-preference',qualifiedAssertionSites:task.qualifiedAssertionSites};
}
function nestedReferenceClaim(artifact,row,root){
 const data=artifact.data;referenceEnvelope(data,'v2221-exact-legacy-presentation-and-key-qualification',!!artifact.compositeEvidence);
 const mapping={
  'tests/v2217/reference_manual_heading.cjs':'tests/v2220/reference_manual_heading_qualification.cjs',
  'tests/v2217/reference_inherited.cjs':'tests/v2220/reference_inherited_qualification.cjs'
 },wrapper=mapping[row.suite];if(!wrapper)return null;
 const task=data.tasks.find(r=>r.file===wrapper);check((task?.passed===true||artifact.compositeEvidence&&wrapper.endsWith('/reference_inherited_qualification.cjs'))&&task.originalSha256===testHash(root,wrapper),'Nested reference wrapper source differs');
 if(artifact.compositeEvidence&&wrapper.endsWith('/reference_inherited_qualification.cjs'))return artifact.compositeEvidence;
 const nested=read(artifact.file+'.'+path.basename(wrapper)+'.legacy.private.json'),report=nested.data;
 check(artifact.pins?.[path.basename(nested.file)]?.sha256===nested.sha256,'Nested receipt changed after its actual qualifier execution');
 check(report.passed===true&&report.runtimeSha256===row.bundleSha256,'Nested reference runtime or status differs');
 if(row.suite.endsWith('reference_manual_heading.cjs')){
  check(report.suite==='v2220-exact-C44-manual-heading-qualification'&&report.legacySource===row.suite&&report.sourceSha256===row.testSha256,'Manual heading original test differs');
  check(report.failure===null&&report.qualifiedAssertionSites===3&&report.qualifiedCalls===24&&empty(report.unexpectedNewCombinations),'Manual heading assertions/negative controls incomplete');
  manualPropertyComplete(report.legacyReport,row);
 }else{
  check(report.suite==='v222-reference-inherited-exact-canonical-qualification'&&report.legacySourceHash===row.testSha256,'Inherited original test differs');
  const summary=report.inheritedSummary;check(summary?.passed===true&&summary.bundleSha256===row.bundleSha256&&all(summary.tasks),'Inherited child assertion summary incomplete');
  for(const child of summary.tasks){
   check(child.testUnchanged===true&&child.bundleUnchanged===true&&child.testSha256===testHash(root,child.file),'Inherited child source changed');
   if(child.status==='passed')check(child.exitCode===0,'Inherited child exit status differs');
   else{const q=child.qualification;check(child.status==='failed'&&child.exitCode===1&&q?.accepted===true&&q.classification==='exact-old-syntax-expectation-superseded-by-native-heading-ownership'&&q.testSha256===child.testSha256&&q.bundleSha256===row.bundleSha256&&q.sourceFieldsAndDefinitionsExact===true&&q.originalTestsChanged===false&&q.productionGuardsChanged===false&&q.mutationControls>=8,'Unexpected inherited child failure');}
  }
  check(report.rawReferenceDefinitionsPreserved===true&&report.directNumericPlanAssertionsUnchanged===true&&report.oldTestFilesModified===false,'Inherited numeric-source guards changed');
 }
 return {classification:'exact-nested-reference-assertion-qualification',nestedReceipt:{file:path.basename(nested.file),sha256:nested.sha256,bytes:nested.bytes}};
}
function evaluate({root,out,manifest,report}){
 const before=JSON.stringify(report.attempts),ledger=[],unqualified=[],qualifierErrors=[],artifacts=[];
 const bundles=[...new Set(report.attempts.map(r=>r.bundle))],loaded=new Map();
 for(const bundle of bundles){
  const expected=manifest.files[bundle];check(expected&&sha(fs.readFileSync(path.join(out,'runtime',bundle)))===expected.sha256,'Actual selected runtime snapshot differs');
  for(const[kind,suite]of Object.entries(QUALIFIERS)){
   try{
    const row=report.attempts.find(r=>r.bundle===bundle&&r.suite===suite);
    check(row&&(row.status==='passed'&&row.exitCode===0||kind==='references'&&row.status==='failed'&&row.exitCode===1)&&row.testUnchanged===true&&row.executionClass==='actual-selected-runtime','Current qualifier execution did not pass');
    check(row.bundleSha256===expected.sha256&&row.testSha256===testHash(root,suite),'Current qualifier source/runtime pin differs');
    const stem=path.join(out,identifier(bundle,suite));
    check(sha(fs.readFileSync(stem+'.stdout'))===row.stdoutSha256&&sha(fs.readFileSync(stem+'.stderr'))===row.stderrSha256,'Qualifier execution logs changed');
    const artifact=read(stem+'.json');check(report.qualificationReceiptPins?.[path.basename(artifact.file)]?.sha256===artifact.sha256,'Qualification receipt changed after its actual execution');check(artifact.data.runtimeSha256===row.bundleSha256,'Qualification receipt belongs to a different runtime');
    if(kind==='infobox')check(artifact.data.testSha256===row.testSha256,'Infobox qualifier receipt source differs');
    artifact.pins=report.qualificationReceiptPins;
    if(kind==='closedAutoname'){closedAutonameEnvelope(artifact.data,row,root);for(const task of artifact.data.tasks){const nested=boundCapture(artifact.file+'.'+path.basename(task.file)+'.legacy.json',artifact,out);check(nested.sha256===task.legacyReceiptSha256,'Closed autoname full original assertion receipt differs');closedAutonameOriginalReceipt(nested.data,task,row);}}
    else if(kind==='infobox'){infoboxClaim(artifact.data,{suite:'tests/no_matching_historical_suite.cjs'});for(const result of artifact.data.rawInventory.results)check(result.testSha256===testHash(root,result.suite),'Historical infobox inventory source pin differs');}
    else if(kind==='talk')talkClaim(artifact.data,{suite:'tests/no_matching_historical_suite.cjs'},root);
    else{if(kind==='references'&&row.status==='failed')artifact.compositeEvidence=compositeReferenceCompletion(artifact,row,root,out,loaded.get(bundle+':closedAutoname'));referenceEnvelope(artifact.data,kind==='references'?'v2221-exact-legacy-presentation-and-key-qualification':'v2221-exact-v2220-collector-preference-qualification',!!artifact.compositeEvidence);for(const task of artifact.data.tasks)check(task.originalSha256===testHash(root,task.file),'Historical reference task source pin differs');}
    artifact.execution=row;artifact.pins=report.qualificationReceiptPins;loaded.set(bundle+':'+kind,artifact);artifacts.push({bundle,qualifier:suite,qualifierSha256:row.testSha256,receipt:path.basename(artifact.file),receiptSha256:artifact.sha256});
   }catch(error){qualifierErrors.push({bundle,qualifier:suite,message:error.message});}
  }
 }
 for(const row of report.attempts){
  const bound=row.testUnchanged===true&&row.bundleSha256===manifest.files[row.bundle]?.sha256&&row.testSha256===testHash(root,row.suite);
  if(row.status==='passed'&&bound)continue;
  let accepted=null;const reasons=[];
  const stem=path.join(out,identifier(row.bundle,row.suite)),rawLogsBound=sha(fs.readFileSync(stem+'.stdout'))===row.stdoutSha256&&sha(fs.readFileSync(stem+'.stderr'))===row.stderrSha256,assertionFailure=rawLogsBound&&/AssertionError(?: \[ERR_ASSERTION\])?/.test(fs.readFileSync(stem+'.stderr','utf8'));
  if(row.status==='failed'&&row.exitCode===1&&bound&&rawLogsBound){
   for(const kind of Object.keys(QUALIFIERS)){
    const artifact=loaded.get(row.bundle+':'+kind);if(!artifact||artifact.data.runtimeSha256!==row.bundleSha256)continue;
    try{
     const stderr=fs.readFileSync(stem+'.stderr','utf8');
     const claim=kind==='references'&&row.suite===QUALIFIERS.references&&artifact.compositeEvidence?artifact.compositeEvidence:assertionFailure?(kind==='closedAutoname'?(row.suite===AUTONAME.file&&row.testSha256===AUTONAME.sha256&&exactAutonameError(stderr)?{classification:'exact-closed-autoname-source-hold',heldSourceSha256:AUTONAME.sourceSha256,nameRepairCredit:0}:null):kind==='infobox'?infoboxClaim(artifact.data,row):kind==='talk'?talkClaim(artifact.data,row,root):kind==='references'?(referenceClaim(artifact.data,row,false,!!artifact.compositeEvidence)||nestedReferenceClaim(artifact,row,root)):nativeFooterClaim(artifact,row)):
      kind==='references'&&stderr===''?collectorJsonClaim(artifact,row,root,out):null;
     if(claim){accepted={suite:row.suite,bundle:row.bundle,rawStatus:row.status,rawExitCode:row.exitCode,testSha256:row.testSha256,bundleSha256:row.bundleSha256,qualifier:artifact.execution.suite,qualifierSha256:artifact.execution.testSha256,receipt:path.basename(artifact.file),receiptSha256:artifact.sha256,...claim};break;}
    }catch(error){reasons.push({qualifier:artifact.execution.suite,message:error.message});}
   }
  }
  if(accepted)ledger.push(accepted);else unqualified.push({...row,qualificationRejections:reasons});
 }
 check(JSON.stringify(report.attempts)===before,'Qualification must not rewrite raw attempt rows');
 const rawStatus=report.attempts.every(r=>r.status==='passed'&&r.testUnchanged===true)?'passed':'failed',releaseGateAccepted=unqualified.length===0&&qualifierErrors.length===0;
 return {rawStatus,status:releaseGateAccepted?(ledger.length?'passed-with-precisely-qualified-historical-contracts':'passed'):'failed',releaseGateAccepted,qualificationLedger:ledger,qualifiedFailures:ledger.length,unqualifiedFailures:unqualified,unqualifiedFailureCount:unqualified.length,qualifierErrors,qualificationArtifacts:artifacts,rawAttemptsRewritten:false};
}
module.exports={evaluate,identifier,QUALIFIERS,INFOBOX_LEAVES,DIRECT_REFERENCES,NATIVE_REFERENCES,TALK_LEAVES,AUTONAME,INHERITED_REFERENCE_CHILDREN,closedAutonameEnvelope,exactAutonameError,inheritedClosedCompletion,compositeReferenceCompletion,infoboxClaim,talkClaim,referenceClaim,manualPropertyComplete,collectorReport,collectorJsonClaim,nativeFooterClaim,footerEndpoint,INPUT_PINS};
