'use strict';
// Metadata-only aggregation fixtures; these never emulate an article corrector
// or count as a real runtime replay. The actual runner supplies fresh receipts.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),q=require('./legacy_qualification_receipts.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');let checks=0;const cases=[];
function ok(x,m){checks++;assert(x,m);}function equal(a,b,m){checks++;assert.deepEqual(a,b,m);}
function fixture(){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-qualification-metadata-')),root=path.join(directory,'repository'),out=path.join(directory,'run'),bundle='RevisaWiki_v2_22_1.js';fs.mkdirSync(path.join(out,'runtime'),{recursive:true});
 const original='tests/v2217/infobox_cases.cjs',extra='tests/v2217/unrelated_failure.cjs',names=new Set([...Object.values(q.QUALIFIERS),...q.INFOBOX_LEAVES,...q.TALK_LEAVES,...q.DIRECT_REFERENCES,...q.NATIVE_REFERENCES,...q.INHERITED_REFERENCE_CHILDREN,'tests/v2217/reference_inherited.cjs','tests/v2220/talk_layout_qualification.cjs',extra]);
 for(const name of names){const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'// Inert metadata fixture: '+name+'\n');}
 for(const name of [q.AUTONAME.file,q.AUTONAME.quote])fs.writeFileSync(path.join(root,name),fs.readFileSync(path.join(__dirname,'../..',name)));
 const runtime=Buffer.from('inert runtime metadata; this file is never executed\n');fs.writeFileSync(path.join(out,'runtime',bundle),runtime);const runtimeSha256=sha(runtime),manifest={files:{[bundle]:{sha256:runtimeSha256,bytes:runtime.length}}},report={attempts:[],qualificationReceiptPins:{}};
 const hash=name=>sha(fs.readFileSync(path.join(root,name)));
 function execution(suite,failed=false){const stem=path.join(out,q.identifier(bundle,suite)),stdout='',stderr=failed?'AssertionError [ERR_ASSERTION]: frozen superseded contract\n':'';fs.writeFileSync(stem+'.stdout',stdout);fs.writeFileSync(stem+'.stderr',stderr);const row={suite,bundle,status:failed?'failed':'passed',exitCode:failed?1:0,executionClass:'actual-selected-runtime',bundleSha256:runtimeSha256,testSha256:hash(suite),testUnchanged:true,stdoutSha256:sha(stdout),stderrSha256:sha(stderr)};report.attempts.push(row);return row;}
 execution(original,true);
 const inventory=[...q.INFOBOX_LEAVES].map(suite=>({suite,testSha256:hash(suite),assertions:1,passedAssertions:suite===original?0:1,failures:suite===original?[{assertion:1}]:[],exception:null,historicalStatusUnmodified:true}));
 const data={
 infobox:{kind:'historical-infobox-current-contract-qualification',status:'passed-qualified-current-contract',runtimeSha256,testSha256:hash(q.QUALIFIERS.infobox),unexpectedHistoricalFailures:[],controlFailures:[],controls:[{status:'passed'}],replacementChecks:1,historicalOriginalSuiteStatusesRewritten:false,historicalAssertions:8,qualifiedHistoricalDifferences:[{suite:original,assertion:1,category:'space'}],rawInventory:{historicalFilesModified:false,runtimeVersion:'2.22.1',runtimeSha256,results:inventory}},
 talk:{suite:'v2221-talk-layout-precise-historical-qualification',version:'2.22.1',runtimeSha256,passed:true,oldTestFilesModified:false,historicalFailedStatusesRewritten:false,productOrPreservationGuardsModified:false,legacyAssertions:[...q.TALK_LEAVES].map(file=>({file,checks:1,passed:true})),qualifiedAssertionSites:5,mutationControls:7,fullActionCalls:1,sourcePins:Object.fromEntries([...q.TALK_LEAVES,'tests/v2220/talk_layout_qualification.cjs'].map(file=>[file,hash(file)])),versionGuardQualification:'Frozen version guard only'},
 references:{suite:'v2221-exact-legacy-presentation-and-key-qualification',engineVersion:'2.22.1',runtimeSha256,passed:true,productionFunctionsMocked:false,originalTestsModified:false,productionGuardsModified:false,allOtherOriginalAssertionsExecuted:true,tasks:[...q.DIRECT_REFERENCES].map(file=>({file,originalSha256:hash(file),qualifiedAssertionSites:1,passed:true,error:null}))},
 nativeReferences:{suite:'v2221-exact-v2220-collector-preference-qualification',engineVersion:'2.22.1',runtimeSha256,passed:true,productionFunctionsMocked:false,oldTestFilesChanged:false,productionGuardsChanged:false,allOtherAssertionsExecuteUnchanged:true,tasks:[...q.NATIVE_REFERENCES].map(file=>({file,originalSha256:hash(file),qualifiedAssertionSites:1,passed:true,error:null}))}
 };
 const closedOriginal=(file,checks,calculations)=>({suite:file===q.AUTONAME.file?'descriptive-reference-names-2.21.6':'autoname-active-quote-integrity-2.21.6',runtimeSha256,checks,calculations,rows:Array.from({length:file===q.AUTONAME.file?9:36},(_,i)=>file===q.AUTONAME.file?{inputSha256:sha('inert-'+i),outputSha256:sha('inert-output-'+i)}:{id:'fictional-'+i,sourceSha256:sha('inert-'+i),outputSha256:sha('inert-output-'+i)}),wikipediaWrites:0});
 data.closedAutoname={suite:'exact-closed-autoname-contract-qualification',engineVersion:'2.22.1',runtimeSha256,passed:true,checks:337,calculations:54,tasks:[[q.AUTONAME.file,q.AUTONAME.sha256,1,89,18],[q.AUTONAME.quote,q.AUTONAME.quoteSha256,0,243,36]].map(([file,originalSha256,qualifiedAssertionSites,checks,calculations])=>({file,originalSha256,qualifiedAssertionSites,checks,calculations,legacyReceiptSha256:sha(JSON.stringify(closedOriginal(file,checks,calculations))),passed:true})),qualifications:[{id:'AUTONAME-CLOSED-OPAQUE-RESERVATION-01',sourceSha256:q.AUTONAME.sourceSha256,optionsSha256:q.AUTONAME.optionsSha256,oldExpected:'rename :0 to Silva2026-2 despite unknown program',currentExpected:'hold every source identity and argument',nameRepairCredit:0,outputSha256:q.AUTONAME.sourceSha256}],positiveClosedControls:1,mutationControls:5,originalTestsModified:false,productionGuardsModified:false,productionFunctionsMocked:false,allOtherOriginalAssertionsExecuted:true,wikipediaWrites:0};
 function receipt(kind,value=data[kind],refresh=true){const name=q.identifier(bundle,q.QUALIFIERS[kind])+'.json',file=path.join(out,name),raw=JSON.stringify(value);fs.writeFileSync(file,raw);if(refresh)report.qualificationReceiptPins[name]={sha256:sha(raw),bytes:Buffer.byteLength(raw)};return file;}
 for(const kind of Object.keys(q.QUALIFIERS)){execution(q.QUALIFIERS[kind]);const file=receipt(kind);if(kind==='closedAutoname')for(const task of data.closedAutoname.tasks){const name=file+'.'+path.basename(task.file)+'.legacy.json',raw=JSON.stringify(closedOriginal(task.file,task.checks,task.calculations));fs.writeFileSync(name,raw);report.qualificationReceiptPins[path.basename(name)]={sha256:sha(raw),bytes:Buffer.byteLength(raw)};}}
 return {directory,root,out,bundle,manifest,report,data,original,extra,execution,receipt,hash};
}
function test(name,mutate,accepted,ledgerCount=1){const f=fixture();try{mutate(f);const before=JSON.stringify(f.report.attempts),result=q.evaluate(f);equal(JSON.stringify(f.report.attempts),before,'Raw execution rows remain byte-equivalent');equal(result.releaseGateAccepted,accepted,name);if(accepted){equal(result.rawStatus,'failed');equal(result.status,'passed-with-precisely-qualified-historical-contracts');equal(result.qualificationLedger.length,ledgerCount);equal(result.unqualifiedFailureCount,0);}else ok(result.unqualifiedFailureCount>0||result.qualifierErrors.length>0,'A refusal retains explicit unresolved evidence');cases.push(name);}finally{fs.rmSync(f.directory,{recursive:true,force:true});}}
test('exact current source-bound receipt can qualify only its demonstrated assertions',()=>{},true);
test('an unrelated failed historical suite cannot pass',f=>{f.execution(f.extra,true);},false);
test('an unexpected TypeError in a covered file is not an old assertion preference',f=>{const row=f.report.attempts[0],file=path.join(f.out,q.identifier(f.bundle,row.suite)+'.stderr');fs.writeFileSync(file,'TypeError: unexpected runtime bug\n');row.stderrSha256=sha(fs.readFileSync(file));},false);
test('an external timeout is not a syntax preference',f=>{Object.assign(f.report.attempts[0],{status:'external-timeout',exitCode:null});},false);
test('changed original source invalidates qualification',f=>{fs.appendFileSync(path.join(f.root,f.original),'// changed\n');},false);
test('a stale receipt runtime cannot qualify the selected bundle',f=>{f.data.infobox.runtimeSha256='0'.repeat(64);f.receipt('infobox');},false);
test('a missing required current receipt keeps the run incomplete',f=>{fs.unlinkSync(f.receipt('talk'));},false);
test('a globally failed qualifier cannot authorize its passing children',f=>{f.data.references.passed=false;f.receipt('references');},false);
test('an unqualified assertion recorded by the current qualifier remains a failure',f=>{f.data.infobox.unexpectedHistoricalFailures.push({suite:f.original,assertion:2});f.receipt('infobox');},false);
test('the original historical pin must match the raw failed attempt',f=>{f.data.infobox.rawInventory.results[0].testSha256='0'.repeat(64);f.receipt('infobox');},false);
test('post-execution receipt mutation fails even with a plausible status',f=>{f.data.infobox.replacementChecks=99;f.receipt('infobox',f.data.infobox,false);},false);
test('a failing current qualifier execution is never qualified by another family',f=>{const row=f.report.attempts.find(r=>r.suite===q.QUALIFIERS.talk);row.status='failed';row.exitCode=1;},false);
test('a truncated historical assertion inventory cannot pass',f=>{f.data.infobox.rawInventory.results.pop();f.data.infobox.historicalAssertions=7;f.receipt('infobox');},false);
for(const [name,mutate]of [
 ['changed source identity',d=>d.qualifications[0].sourceSha256='0'.repeat(64)],['changed options identity',d=>d.qualifications[0].optionsSha256='0'.repeat(64)],['changed endpoint',d=>d.qualifications[0].outputSha256='0'.repeat(64)],
 ['repair credit for hold',d=>d.qualifications[0].nameRepairCredit=1],['missing positive control',d=>d.positiveClosedControls=0],
 ['missing negative controls',d=>d.mutationControls=4],['truncated original assertions',d=>d.tasks[0].checks--],
 ['unexecuted original quote suite',d=>d.tasks.pop()],['production guard waiver',d=>d.productionGuardsModified=true],
 ['stale actual runtime',d=>d.runtimeSha256='0'.repeat(64)],['extra qualified source',d=>d.qualifications.push({...d.qualifications[0]})]
])test('closed autoname counterpart rejects '+name,f=>{mutate(f.data.closedAutoname);f.receipt('closedAutoname');},false);
function compositeFixture(f){
 const data=f.data.references,wrapper='tests/v2220/reference_inherited_qualification.cjs',execution=f.report.attempts.find(r=>r.suite===q.QUALIFIERS.references),file=f.receipt('references'),directory=file+'.reference_inherited_qualification.cjs.legacy.private.json.legacy-inherited';fs.mkdirSync(directory);
 data.passed=false;data.allOtherOriginalAssertionsExecuted=false;data.qualifications=[];const task=data.tasks.find(t=>t.file===wrapper);task.passed=false;task.error='AssertionError [ERR_ASSERTION]: all inherited child assertions and other native qualifications passed\n    at fictional (/repository/tests/v2220/reference_inherited_qualification.cjs:29:89)';execution.status='failed';execution.exitCode=1;
 const autonameError="node:assert:152\n  throw new AssertionError(obj);\n  ^\n\nAssertionError [ERR_ASSERTION]: Opaque arguments and actual names both reserve target identities\n\nfalse !== true\n\n    at eq (/repository/tests/v2216/autonames.cjs:3:40)\n    at Object.<anonymous> (/repository/tests/v2216/autonames.cjs:40:2)\n    at node:internal/main/run_main_module:33:47 {\n  generatedMessage: false,\n  code: 'ERR_ASSERTION',\n  actual: false,\n  expected: true,\n  operator: 'deepStrictEqual',\n  diff: 'simple'\n}\n\nNode.js v24.22.3\n";
 function pin(target,bytes){fs.writeFileSync(target,bytes);f.report.qualificationReceiptPins[path.relative(f.out,target).split(path.sep).join('/')]={sha256:sha(bytes),bytes:Buffer.byteLength(bytes)};}
 const summary={scope:'Unchanged inherited reference/citation functional suites only; no talk policy expectations reclassified',bundle:f.bundle,bundleSha256:execution.bundleSha256,externalProcessCapMilliseconds:600000,tasks:[...q.INHERITED_REFERENCE_CHILDREN].map(file=>{const held=file===q.AUTONAME.file,stdout='',stderr=held?autonameError:'',stem=path.join(directory,file.replaceAll('/','-'));pin(stem+'.stdout',stdout);pin(stem+'.stderr',stderr);return {file,status:held?'failed':'passed',exitCode:held?1:0,signal:null,error:null,checks:held?null:1,cases:held?null:1,testSha256:f.hash(file),testUnchanged:true,bundleUnchanged:true,stdoutSha256:sha(stdout),stderrSha256:sha(stderr)};}),checks:7,additionalCalculateCalls:0,rawFailedSuites:1,exactQualifiedSuites:0,passed:false,wikipediaWrites:0};
 function writeSummary(refresh=true){const target=path.join(directory,'SUMMARY.json'),bytes=JSON.stringify(summary);if(refresh)pin(target,bytes);else fs.writeFileSync(target,bytes);}
 function writeOuter(){f.receipt('references');const stem=path.join(f.out,q.identifier(f.bundle,q.QUALIFIERS.references)),stdout=JSON.stringify({tasks:7,qualified:data.qualifications.length,failed:data.tasks.filter(t=>!t.passed).map(t=>t.file),passed:false});fs.writeFileSync(stem+'.stdout',stdout);fs.writeFileSync(stem+'.stderr','');execution.stdoutSha256=sha(stdout);execution.stderrSha256=sha('');}
 writeSummary();writeOuter();return {data,summary,directory,execution,autonameError,pin,pins:f.report.qualificationReceiptPins,out:f.out,writeSummary,writeOuter};
}
test('one closed-autoname child is separately proved while the raw wrapper remains failed',f=>{compositeFixture(f);},true,2);
test('the complete counterpart also covers the unchanged raw inherited and version wrappers',f=>{compositeFixture(f);f.execution('tests/v2217/reference_inherited.cjs',true);f.execution('tests/v2220/reference_inherited_qualification.cjs',true);},true,4);
function numericChild(s){
 const child=s.summary.tasks.find(t=>t.file==='tests/v2216/reference_repairs.cjs'),file=path.join(s.directory,child.file.replaceAll('/','-')+'.json'),raw=JSON.stringify({fictionalRawReceipt:true});s.pin(file,raw);child.status='failed';child.exitCode=1;child.qualification={accepted:true,classification:'exact-old-syntax-expectation-superseded-by-native-heading-ownership',testSha256:child.testSha256,bundleSha256:s.summary.bundleSha256,sourceFieldsAndDefinitionsExact:true,originalTestsChanged:false,productionGuardsChanged:false,mutationControls:8,checks:15,additionalCalculateCalls:2,rawFailureCount:1,nativeTemplateOldid:63785697,nativeHeadingHelperOldid:72474006,nativeContractAuditSha256:'be2f5c6bf41450ebd25cffa920364c1e4ddbfe71d7b9b80a61ef15bc7a2c784b',sourceSha256:sha('Texto.<ref>Fonte</ref>\n== Referências ==\n{{Reflist|2}}'),rawReceiptSha256:sha(raw)};s.summary.rawFailedSuites=2;s.summary.exactQualifiedSuites=1;s.summary.checks+=15;s.summary.additionalCalculateCalls=2;s.writeSummary();return child.qualification;
}
test('an existing finite numeric qualification stays separate from the new autoname hold',f=>{numericChild(compositeFixture(f));},true,2);
for(const[name,mutate]of [
 ['different numeric source',q=>q.sourceSha256='0'.repeat(64)],['lost numeric definitions',q=>q.sourceFieldsAndDefinitionsExact=false],
 ['missing numeric mutation controls',q=>q.mutationControls=7],['unbound numeric raw receipt',q=>q.rawReceiptSha256='0'.repeat(64)],
 ['another numeric failure',q=>q.rawFailureCount=2],['changed native reader',q=>q.nativeHeadingHelperOldid=1]
])test('composite reference qualification rejects '+name,f=>{const s=compositeFixture(f),proof=numericChild(s);mutate(proof);s.writeSummary();},false);
for(const [name,mutate]of [
 ['independent manual heading regression',s=>{const t=s.data.tasks.find(t=>t.file.endsWith('/manual_heading_anchor_integrity.cjs'));t.passed=false;t.error='AssertionError [ERR_ASSERTION]: real numbered regression';s.writeOuter();}],
 ['unknown child failure',s=>{s.summary.tasks[0].status='failed';s.summary.tasks[0].exitCode=1;s.summary.rawFailedSuites++;s.writeSummary();}],
 ['truncated child inventory',s=>{s.summary.tasks.pop();s.writeSummary();}],['mutated child summary',s=>{s.summary.checks--;s.writeSummary(false);}],
 ['stale child runtime',s=>{s.summary.bundleSha256='0'.repeat(64);s.writeSummary();}],['unbound child source',s=>{s.summary.tasks[0].testSha256='0'.repeat(64);s.writeSummary();}],
 ['rewritten raw autoname status',s=>{const t=s.summary.tasks.find(t=>t.file===q.AUTONAME.file);t.status='passed';t.exitCode=0;s.writeSummary();}],
 ['wrong child assertion',s=>{const t=s.summary.tasks.find(t=>t.file===q.AUTONAME.file),file=path.join(s.directory,t.file.replaceAll('/','-')+'.stderr'),raw=s.autonameError.replace('Opaque arguments','Unrelated arguments');s.pin(file,raw);t.stderrSha256=sha(raw);s.writeSummary();}],
 ['generic Error after assertion',s=>{const t=s.summary.tasks.find(t=>t.file===q.AUTONAME.file),file=path.join(s.directory,t.file.replaceAll('/','-')+'.stderr'),raw=s.autonameError+'\nError: additional failure\n';s.pin(file,raw);t.stderrSha256=sha(raw);s.writeSummary();}],
 ['extra warning after assertion',s=>{const t=s.summary.tasks.find(t=>t.file===q.AUTONAME.file),file=path.join(s.directory,t.file.replaceAll('/','-')+'.stderr'),raw=s.autonameError+'Warning: additional problem\n';s.pin(file,raw);t.stderrSha256=sha(raw);s.writeSummary();}],
 ['TypeError after assertion',s=>{const t=s.summary.tasks.find(t=>t.file===q.AUTONAME.file),file=path.join(s.directory,t.file.replaceAll('/','-')+'.stderr'),raw=s.autonameError+'TypeError: runtime defect\n';s.pin(file,raw);t.stderrSha256=sha(raw);s.writeSummary();}],
 ['changed child log without new pin',s=>{fs.appendFileSync(path.join(s.directory,q.AUTONAME.file.replaceAll('/','-')+'.stderr'),'changed');}],
 ['invented completed assertion total',s=>{s.summary.checks++;s.writeSummary();}],['missing summary log binding',s=>{delete s.summary.tasks[0].stdoutSha256;s.writeSummary();}],
 ['missing execution-time pin',s=>{delete s.pins[path.relative(s.out,path.join(s.directory,'SUMMARY.json')).split(path.sep).join('/')];}],
 ['coerced child count',s=>{s.summary.tasks[0].checks='1';s.writeSummary();}],
 ['symlinked nested capture',s=>{const target=path.join(s.directory,q.AUTONAME.file.replaceAll('/','-')+'.stderr'),copy=path.join(s.out,'inert-external-capture');fs.writeFileSync(copy,fs.readFileSync(target));fs.unlinkSync(target);fs.symlinkSync(copy,target);}]
])test('composite reference qualification rejects '+name,f=>{const s=compositeFixture(f);mutate(s);},false);
function manualFixture(){
 const rows=q.INPUT_PINS.manual.rows.map(input=>{const value={id:input.id,sourceSha256:input.sourceSha256};
  if(input.shape==='replacements')value.replacementCount=input.replacementCount;
  else{value.outputSha256='a'.repeat(64);if(input.shape==='changed')value.changed=false;if(input.shape==='idempotent'){value.secondOutputSha256=value.outputSha256;value.firstPassIdempotence=true;}}return value;});
 return {kind:'native-renderer-containing-section-integrity-property',version:'2.21.7',bundle:'RevisaWiki_v2_22_1.js',bundleSha256:'b'.repeat(64),nativeContractAuditSha256:q.INPUT_PINS.manual.nativeContractAuditSha256,cases:1119,checks:5737,calculations:102,rows,wikipediaWrites:0};
}
const manualRow={bundle:'RevisaWiki_v2_22_1.js',bundleSha256:'b'.repeat(64)};
ok(q.manualPropertyComplete(manualFixture(),manualRow),'The real legacy report schema completes without an invented passed boolean');
for(const [name,mutate]of[
 ['truncated rows',r=>r.rows.pop()],['stale runtime',r=>r.bundleSha256='c'.repeat(64)],
 ['wrong checks',r=>r.checks--],['wrong calls',r=>r.calculations--],['unknown input',r=>r.rows[0].id='unlisted'],
 ['changed source hash',r=>r.rows[0].sourceSha256='0'.repeat(64)],['duplicate identity',r=>r.rows[1]={...r.rows[0]}],
 ['failed replay',r=>r.rows.find(x=>'firstPassIdempotence'in x).firstPassIdempotence=false],
 ['different second endpoint',r=>r.rows.find(x=>'secondOutputSha256'in x).secondOutputSha256='c'.repeat(64)],
 ['changed replacement',r=>r.rows.find(x=>x.replacementCount===1).replacementCount=0],
 ['extra failure key',r=>r.rows[0].error='TypeError'],['manufactured status key',r=>r.passed=true]
]){const value=manualFixture();mutate(value);checks++;assert.throws(()=>q.manualPropertyComplete(value,manualRow),name);cases.push('manual property rejects '+name);}
function softFixture(f){
 const suite=q.INPUT_PINS.collector.suite,original=path.join(__dirname,'../..',suite);fs.writeFileSync(path.join(f.root,suite),fs.readFileSync(original));
 const row=f.execution(suite,true),stem=path.join(f.out,q.identifier(f.bundle,suite));row.checks=81;row.cases=26;row.calculations=15;
 fs.writeFileSync(stem+'.stderr','');row.stderrSha256=sha('');fs.writeFileSync(stem+'.stdout',JSON.stringify({cases:26,checks:81,calculateCalls:15,failures:3}));row.stdoutSha256=sha(fs.readFileSync(stem+'.stdout'));
 const rows=qualified=>q.INPUT_PINS.collector.rows.map(input=>{const failed=!qualified&&q.INPUT_PINS.collector.qualifiedFailedIds.includes(input.id),value={id:input.id,sourceSha256:input.sourceSha256,status:failed?'failed':'passed'};if(failed)value.error='AssertionError [ERR_ASSERTION]: '+input.id+q.INPUT_PINS.collector.assertionSuffix+'\n    at fictional (fixture.cjs:1:1)';else if(input.successfulOutputRequired)value.outputSha256='a'.repeat(64);return value;});
 const record=qualified=>({kind:'existing-citation-and-manual-heading-composition-regression',bundle:f.bundle,bundleSha256:row.bundleSha256,cases:26,checks:qualified?84:81,calculateCalls:qualified?18:15,failures:qualified?0:3,rows:rows(qualified),wikipediaWrites:0});
 const raw=record(false),nested=record(true),nestedFile=path.join(f.out,q.identifier(f.bundle,q.QUALIFIERS.references)+'.json.reference_legacy_collector_conflicts.cjs.legacy.private.json');
 f.data.references.tasks.find(t=>t.file===suite).originalSha256=f.hash(suite);f.receipt('references');
 const writeRaw=(refresh=true)=>{const bytes=Buffer.from(JSON.stringify(raw));fs.writeFileSync(stem+'.json',bytes);if(refresh)row.rawReceipt={file:path.basename(stem)+'.json',sha256:sha(bytes),bytes:bytes.length};};
 const writeNested=(refresh=true)=>{const bytes=Buffer.from(JSON.stringify(nested));fs.writeFileSync(nestedFile,bytes);if(refresh)f.report.qualificationReceiptPins[path.basename(nestedFile)]={sha256:sha(bytes),bytes:bytes.length};};writeRaw();writeNested();return{row,raw,nested,writeRaw,writeNested,stem};
}
test('only the three source-bound JSON assertion failures qualify without stderr',f=>{softFixture(f);},true,2);
for(const [name,mutate]of[
 ['missing raw pin',s=>{delete s.row.rawReceipt;}],['mutated receipt after execution',s=>{s.raw.checks--;s.writeRaw(false);}],
 ['unknown failed id',s=>{s.raw.rows.find(r=>r.status==='failed').id='unlisted';s.writeRaw();}],
 ['wrong source hash',s=>{s.raw.rows[0].sourceSha256='0'.repeat(64);s.writeRaw();}],
 ['missing capture',s=>{s.raw.rows.pop();s.writeRaw();}],['wrong message',s=>{s.raw.rows.find(r=>r.status==='failed').error='AssertionError [ERR_ASSERTION]: unrelated';s.writeRaw();}],
 ['TypeError',s=>{s.raw.rows.find(r=>r.status==='failed').error='TypeError: runtime failure';s.writeRaw();}],
 ['stderr exception',s=>{fs.writeFileSync(s.stem+'.stderr','TypeError: unexpected');s.row.stderrSha256=sha(fs.readFileSync(s.stem+'.stderr'));}],
 ['nested failure',s=>{s.nested.rows[0].status='failed';s.writeNested();}],['stale nested runtime',s=>{s.nested.bundleSha256='0'.repeat(64);s.writeNested();}],
 ['nested receipt mutated',s=>{s.nested.checks--;s.writeNested(false);}],['other endpoint changed',s=>{s.nested.rows[0].outputSha256='c'.repeat(64);s.writeNested();}],
 ['timeout',s=>{s.row.status='external-timeout';s.row.exitCode=null;}],['unsafe filename',s=>{s.row.rawReceipt.file='../capture.json';}]
])test('soft JSON qualification rejects '+name,f=>{const s=softFixture(f);mutate(s);},false);
for(const row of q.INPUT_PINS.footer.rows){
 ok(q.footerEndpoint(row.id,row.source,row.expected,row.actual),'One complete finite footer triple qualifies');
 for(const [id,source,expected,output]of[[row.id+'-unknown',row.source,row.expected,row.actual],[row.id,row.source+' ',row.expected,row.actual],[row.id,row.source,row.expected+'\n',row.actual],[row.id,row.source,row.expected,row.actual.replace('Ciência','Outro tema')],[row.id,row.source,row.expected,row.actual+'\n']]){checks++;assert.equal(q.footerEndpoint(id,source,expected,output),false,'No generic whitespace or payload footer exception');}
}
function footerFixture(f){
 const suite=q.INPUT_PINS.footer.suite;fs.writeFileSync(path.join(f.root,suite),fs.readFileSync(path.join(__dirname,'../..',suite)));const row=f.execution(suite,true);
 const data=f.data.nativeReferences;data.tasks.find(item=>item.file===suite).originalSha256=f.hash(suite);data.allAssertionsCompleted=true;
 data.qualified=q.INPUT_PINS.footer.rows.map(item=>({id:'footer-portal-gap:'+item.id,sourceSha256:item.sourceSha256,expectedSha256:item.expectedSha256,targetSha256:item.actualSha256,nativeFooterProducerProofRetained:true,allTemplatePayloadsByteExact:true}));f.receipt('nativeReferences');
 const nested={suite:'v2220-talk-footer',runtimeSha256:row.bundleSha256,passed:true,checks:442,cases:88,results:q.INPUT_PINS.footer.allCaseIds.map(id=>({id,changed:false,count:0}))},file=path.join(f.out,q.identifier(f.bundle,q.QUALIFIERS.nativeReferences)+'.json.talk_footer.cjs.legacy.private.json');
 const writeNested=(refresh=true)=>{const bytes=Buffer.from(JSON.stringify(nested));fs.writeFileSync(file,bytes);if(refresh)f.report.qualificationReceiptPins[path.basename(file)]={sha256:sha(bytes),bytes:bytes.length};};writeNested();return{data,nested,writeNested};
}
test('four footer triples retain every original source-bound assertion and negative case',f=>{footerFixture(f);},true,2);
for(const[name,mutate]of[
 ['missing endpoint',s=>{s.data.qualified.pop();}],['changed target',s=>{s.data.qualified[0].targetSha256='0'.repeat(64);}],
 ['lost producer proof',s=>{s.data.qualified[0].nativeFooterProducerProofRetained=false;}],['payload mutation',s=>{s.data.qualified[0].allTemplatePayloadsByteExact=false;}],
 ['incomplete original assertions',s=>{s.data.allAssertionsCompleted=false;}],['missing original case',s=>{s.nested.results.pop();s.writeNested();}],
 ['wrong original assertion count',s=>{s.nested.checks--;s.writeNested();}],['unknown negative case',s=>{s.nested.results[5].id='unlisted-negative';s.writeNested();}],
 ['mutated replay receipt',s=>{s.nested.cases--;s.writeNested(false);}]
])test('footer qualification rejects '+name,f=>{const s=footerFixture(f);mutate(s);f.receipt('nativeReferences');},false);
const report={suite:'v2221-qualification-ledger-metadata-contract',status:'passed',executionClass:'metadata-only-unit-not-runtime-replay',cases:cases.length,checks,groups:cases,actualArticleCalculations:0,productionCorrectorsMocked:false,historicalRowsModified:false,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
