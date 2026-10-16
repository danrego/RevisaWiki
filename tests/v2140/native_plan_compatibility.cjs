'use strict';
// Exact administrative bridge between two authenticated Node-plan envelopes.
// Native modules, production files, historical inputs and assertions are unchanged.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const inherited=require('./inherited/adapter.cjs'),native=require('./native_browser/adapter.cjs');
const pins={release:'3c728df720b522dc7e1aa92167a9e8676abbb4e382716e6ca7e6b9ecc00c18ee',currentNode:'82751d531200a3c7cc7eead2bd7cb3140cfe291bb964920f8ae3c3c81f45c97e',nativeNode:'7e6b6cfa59445009256856f73796dea8821c7c375e8d69ab72fa2b21f410f2ac',native:'ab452f08f68b9a748ce870602c6b481f20d5425e6fae5cddd45d7f32c1dc2f81'};
const previousAdapterMetadata={
 'tests/v2140/inherited/adapter.cjs':'2009cdedea8c0b95c0b6a2385b4e83cfae8dad41b90272c056c3945be54f8564',
 'scripts/run_inherited_v2140_prepare.cjs':'b7aadb91d7b257273286f9c9973c3c5780b6fd37269f07d80935fb4d7293d381',
 'tests/v2140/inherited/test_adapter.cjs':'ca2fcb5aba99adb85e6ace23be665b40df404fc6b50ef11cbf6e4629500d5b59',
 'scripts/run_inherited_v2140.cjs':'398fdcbb97c7deffb6016b5615175f4956b739745f37c131d69e67d258d30119',
 'tests/v2140/inherited/README.md':'4fe69465c4a3424e708fc3d3b8789662c955509df83b19db2023a6df6f49087a'
};
const before="source.includes('v211MarkCheckedDraft(adapter,result,compareOnly,checkedOptions);')",after="source.includes('v211MarkCheckedDraft(adapter,result,false,checkedOptions);')";
const policySentence='One positive source-shape expectation passes false after the user removed the compare-only action. Its checked-state assertion remains present. ';
const encode=value=>JSON.stringify(value,null,2)+'\n',clone=value=>JSON.parse(JSON.stringify(value));
function verifyBytes(row,bytes){assert.equal(bytes.length,row.bytes,row.file+' exact size');assert.equal(inherited.sha(bytes),row.sha256,row.file+' exact SHA');}
function authenticatePrevious(current){
 assert.equal(inherited.sha(encode(current)),pins.currentNode,'Only the authenticated current Node envelope is accepted');
 assert.deepEqual(current.reviewedSourceShapeSubstitutions,{'tests/v2130/test_ui_freshness.cjs':[[before,after]]});
 assert.equal(current.reviewedSourceShapeDeclarations.length,1);const declaration=current.reviewedSourceShapeDeclarations[0];
 assert.equal(declaration.file,'tests/v2130/test_ui_freshness.cjs');assert.equal(declaration.assertionRemoved,false);assert.equal(declaration.negativeExpectationChanged,false);
 const previous=clone(current);delete previous.reviewedSourceShapeSubstitutions;delete previous.reviewedSourceShapeDeclarations;
 const row=previous.compiledFiles.find(item=>item.file===declaration.file);assert(row);const original=fs.readFileSync(path.join(inherited.root,row.file));assert.equal(inherited.sha(original),row.sourceSha256);
 let compiled=original.toString('utf8');for(const [oldValue,newValue]of current.substitutions)compiled=compiled.replaceAll(oldValue,newValue);
 row.compiledBytes=Buffer.byteLength(compiled);row.compiledSha256=inherited.sha(compiled);
 assert.equal(row.replacements.filter(item=>item.before===before&&item.after===after).length,1);row.replacements=row.replacements.filter(item=>item.before!==before);
 const changedMetadata=[];for(const item of previous.adapterFiles)if(previousAdapterMetadata[item.file]){changedMetadata.push({file:item.file,currentSha256:item.sha256,previousSha256:previousAdapterMetadata[item.file]});item.sha256=previousAdapterMetadata[item.file];}
 assert.equal(changedMetadata.length,5);assert.equal(previous.negativeSuitePolicy.split(policySentence).length-1,1);previous.negativeSuitePolicy=previous.negativeSuitePolicy.replace(policySentence,'');
 const raw=Buffer.from(encode(previous));assert.equal(inherited.sha(raw),pins.nativeNode,'The reconstructed complete old envelope must match its contemporaneously recorded exact SHA');
 assert.deepEqual(previous.sourceFiles,current.sourceFiles,'Every historical file binding is unchanged');assert.deepEqual(previous.negativeFixtureFiles,current.negativeFixtureFiles,'All negative fixture bindings are unchanged');
 return {raw,plan:previous,sha256:pins.nativeNode,changedMetadata};
}
function verifyInputs(pin){
 assert.equal(pin,pins.release,'This finite bridge belongs only to final F06');
 // Read and validate the CURRENT plan normally before considering old metadata.
 const current=inherited.readPlan(pins.currentNode);inherited.verifySourceTree(current.plan);for(const row of current.plan.adapterFiles)assert.equal(inherited.sha(fs.readFileSync(path.join(inherited.root,row.file))),row.sha256,row.file+' current adapter SHA');
 const manifest=inherited.verifyCandidate(pin),previous=authenticatePrevious(current.plan),nativeLoaded=native.readPlan();assert.equal(nativeLoaded.sha256,pins.native);assert.equal(nativeLoaded.plan.inheritedSourcePlanSha256,previous.sha256);
 assert.deepEqual(native.compileRecords(),nativeLoaded.plan.modules,'Every native module and its compiled adaptation remains exact');
 for(const row of [...nativeLoaded.plan.assets,...nativeLoaded.plan.ownFiles])verifyBytes(row,fs.readFileSync(path.join(inherited.root,row.file)));
 inherited.verifySourceTree(previous.plan);return {current,previous,manifest,native:nativeLoaded};
}
function recordedReports(context){
 const summaryFile='artifacts/v2140/native_browser/NATIVE_BROWSER_SUMMARY.json',raw=fs.readFileSync(path.join(inherited.root,summaryFile)),summary=JSON.parse(raw);assert.equal(summary.status,'passed');assert.equal(summary.releaseManifestSha256,pins.release);assert.equal(summary.coveragePlanSha256,pins.native);assert.equal(summary.cases,540);assert.equal(summary.checks,43527);
 const files=[];for(const browser of summary.browsers)for(const [stage,row]of [['main',browser.main],['images',browser.images]]){
  const file=path.posix.join('artifacts/v2140/native_browser',row.file),bytes=fs.readFileSync(path.join(inherited.root,file)),report=JSON.parse(bytes);assert.equal(inherited.sha(bytes),row.sha256);assert.equal(report.pinManifestSha256,pins.release);assert.equal(report.nativeUIContract.coveragePlanSha256,pins.native);assert.equal(report.tests.length,stage==='main'?162:18);assert(report.tests.every(item=>item.passed));assert.equal(report.failed||0,0);assert.equal(report.actualWikipediaWrites||report.wikipediaWrites||0,0);assert.equal(report.actualNetworkMutations||report.networkMutations||0,0);assert.equal(report.blockedOutsideRequests||report.outsideRequests||0,0);assert(report.cleanup.ownSessionClosed&&report.cleanup.ownProcessExited&&report.cleanup.ownProfileRemoved);files.push({file,sha256:row.sha256,cases:report.tests.length,checks:report.assertions});
 }
 return {summary:{file:summaryFile,sha256:inherited.sha(raw)},files};
}
function consumeOneAdministrativeRead(context,run){
 const original=inherited.readPlan;let calls=0;
 inherited.readPlan=function(...args){assert.equal(args.length,0,'The native administrative read has no alternate pin');assert.equal(++calls,1,'The authenticated old envelope can be consumed only once');inherited.readPlan=original;return {raw:context.previous.raw,plan:context.previous.plan,sha256:context.previous.sha256};};
 try{run();assert.equal(calls,1,'The original native launcher consumed its one administrative parent-plan read');assert.equal(inherited.readPlan,original,'The current plan reader was immediately restored');}finally{inherited.readPlan=original;}
 return calls;
}
function main(){
 const args=Object.fromEntries(process.argv.slice(2).map(value=>{const [key,...parts]=value.replace(/^--/,'').split('=');return[key,parts.join('=')||true];}));
 assert(!/--(?:require|import)(?:=|\s)/.test(process.env.NODE_OPTIONS||''),'Unrecorded loader hooks cannot change this compatibility check');
 const context=verifyInputs(String(args['final-pin']||'')),directory=path.resolve(inherited.root,String(args['report-dir']||''));assert(args['report-dir'],'A fresh explicit artifact report directory is required');assert(directory.startsWith(path.join(inherited.root,'artifacts/v2140')+path.sep),'Reports stay under the separate current artifact tree');
 const output=path.join(directory,'native_plan_bridge.json');assert(!fs.existsSync(output),'Never overwrite a compatibility receipt');fs.mkdirSync(directory,{recursive:true});
 const report={schema:1,version:'2.14.0',kind:'exact-administrative-native-parent-plan-transition',status:'running',releaseManifestSha256:pins.release,currentNodePlanSha256:pins.currentNode,contemporaneousNativeNodePlanSha256:pins.nativeNode,nativeCoveragePlanSha256:pins.native,wrapper:{file:'tests/v2140/native_plan_compatibility.cjs',sha256:inherited.sha(fs.readFileSync(__filename))},finiteNodeTransition:{positiveSourceShape:{file:'tests/v2130/test_ui_freshness.cjs',sourceSha256:context.current.plan.reviewedSourceShapeDeclarations[0].sourceSha256,before,after},changedAdapterMetadata:context.previous.changedMetadata,allOtherOldEnvelopeBytesAuthenticated:true,oldEnvelopeSha256:pins.nativeNode,oldAndCurrentHistoricalBindingsIdentical:true},historicalSourcesVerified:466,nativeCompiledModulesVerified:14,nativeAssetsAndOwnFilesVerified:context.native.plan.assets.length+context.native.plan.ownFiles.length,runtimeFilesVerified:7,behavioralAssertionWaivers:[],frozenSourceOrReportFilesModified:false,wikipediaWrites:0,networkRequests:0,accountUse:false,browserAutomationStarted:false};
 const finish=()=>{try{verifyInputs(pins.release);report.status='passed';}catch(error){report.status='failed';report.error=String(error.message).replaceAll(inherited.root,'<local-repository>');process.exitCode=1;}fs.writeFileSync(output,encode(report));console.log(JSON.stringify({status:report.status,report:path.relative(inherited.root,output),sha256:inherited.sha(fs.readFileSync(output))}));};
 if(args['verify-recorded']===true){assert(!args.browser,'Verification-only mode cannot start a browser');report.mode='verify-recorded';report.recordedNativeReports=recordedReports(context);finish();return;}
 assert(['Chrome','Firefox','Safari'].includes(args.browser),'Choose verification-only mode or an explicit supported browser');assert(['main','images'].includes(args.stage),'Choose main or images explicitly');assert(!fs.existsSync(path.join(directory,String(args.browser).toLowerCase()+'.json')),'Never overwrite a native browser receipt');
 report.mode='reproduce-native';report.browser=args.browser;report.stage=args.stage;report.browserAutomationStarted=true;
 process.env[args.stage==='main'?'REVISAWIKI_INSTALL_REPORT_DIR':'REVISAWIKI_IMAGE_REPORT_DIR']=directory;process.argv=[process.execPath,path.join(inherited.root,'tests/v2140/native_browser/run_release.cjs'),args.browser,'--stage='+args.stage,'--final-pin='+pins.release];
 try{report.administrativeReads=consumeOneAdministrativeRead(context,()=>require('./native_browser/run_release.cjs'));}catch(error){report.status='failed';report.error=String(error.message).replaceAll(inherited.root,'<local-repository>');fs.writeFileSync(output,encode(report));throw error;}
 process.on('exit',()=>{try{
  assert(!process.exitCode,'The original native runner completed successfully');const nativeFile=path.join(directory,String(args.browser).toLowerCase()+'.json');assert(fs.existsSync(nativeFile),'A real native browser execution receipt exists');const raw=fs.readFileSync(nativeFile),value=JSON.parse(raw);assert.equal(value.pinManifestSha256,pins.release);assert.equal(value.nativeUIContract.coveragePlanSha256,pins.native);assert.equal(value.tests.length,args.stage==='main'?162:18);assert(value.tests.every(item=>item.passed));assert.equal(value.failed||0,0);assert(value.cleanup.ownSessionClosed&&value.cleanup.ownProcessExited&&value.cleanup.ownProfileRemoved);for(const field of ['actualWikipediaWrites','wikipediaWrites','actualNetworkMutations','networkMutations','blockedOutsideRequests','outsideRequests'])if(field in value)assert.equal(value[field],0,field+' stays zero');report.nativeReport={file:path.relative(inherited.root,nativeFile),sha256:inherited.sha(raw),cases:value.tests.length,checks:value.assertions};finish();
 }catch(error){report.status='failed';report.error=String(error.message).replaceAll(inherited.root,'<local-repository>');report.nativeExecutionExitCode=process.exitCode||1;process.exitCode=1;fs.writeFileSync(output,encode(report));}});
}
module.exports={pins,verifyBytes,authenticatePrevious,verifyInputs,recordedReports,consumeOneAdministrativeRead};
if(require.main===module)main();
