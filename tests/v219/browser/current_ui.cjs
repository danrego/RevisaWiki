'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {NativeChrome,NativeFirefox,NativeSafari,delay}=require('../../v261/browser/native_driver.cjs');

// Additive causal metadata is authored from the supplied source/options/expected.
// It never changes a product option, fixture endpoint or proof.
function cc9Pair(report,id,option,role,source,onOptions,offOptions,onExpected,offExpected,proof=null){
 const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
 const h=v=>require('node:crypto').createHash('sha256').update(typeof v==='string'?v:JSON.stringify(canon(v))).digest('hex');
 const keys=[...new Set([...Object.keys(onOptions),...Object.keys(offOptions)])].sort(),changed=keys.filter(k=>JSON.stringify(canon(onOptions[k]))!==JSON.stringify(canon(offOptions[k])));
 require('node:assert/strict').deepEqual(changed,[option]);require('node:assert/strict').equal(onOptions[option],true);require('node:assert/strict').equal(offOptions[option],false);
 (report.causalControls??=[]).push({schemaVersion:1,id,option,role,sourceSha256:h(source),onOptionsSnapshot:canon(onOptions),offOptionsSnapshot:canon(offOptions),onOptionsSha256:h(onOptions),offOptionsSha256:h(offOptions),onExpectedSha256:h(onExpected),offExpectedSha256:h(offExpected),proofSha256:proof?h(proof):null,identicalProofAcrossPair:!!proof,writerPositiveCredit:0});
}

const browserName=process.argv[2]||'Chrome',snapshot=path.resolve(process.argv[3]),pinPath=path.resolve(process.argv[4]||path.join(snapshot,'expected_release_v2190.json')),
 pins=JSON.parse(fs.readFileSync(pinPath)),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
assert.equal(pins.version,'2.19.0');
const bundleFiles={core:'RevisaWiki_v2_19_0.js',complete:'RevisaWiki_v2_19_0_completo.js',data:'RevisaWiki_v2_19_0_dados.js'},scripts={},bindings={};
for(const[kind,file]of Object.entries(bundleFiles)){
 const bytes=fs.readFileSync(path.join(snapshot,file)),pin=pins.files[file];assert.equal(sha(bytes),pin.sha256,'Immutable bundle '+kind);assert.equal(bytes.length,pin.bytes,'Immutable bytes '+kind);
 scripts[kind]=bytes.toString();bindings[kind]={file,sha256:sha(bytes),bytes:bytes.length};
}
const guard="if (host ? host !== 'pt.wikipedia.org' : root.mw.config.get('wgDBname') !== 'ptwiki') return;",moduleGuard="if (!root.mw?.loader || (root.location?.hostname || root.mw.config?.get('wgServerName')) !== 'pt.wikipedia.org') return;";
for(const kind of ['core','complete']){assert(scripts[kind].includes(guard));scripts[kind]=scripts[kind].replace(guard,"if (host ? !['pt.wikipedia.org','127.0.0.1'].includes(host) : root.mw.config.get('wgDBname') !== 'ptwiki') return;");}
assert(scripts.core.includes(moduleGuard));scripts.core=scripts.core.replace(moduleGuard,"if (!root.mw?.loader || !['pt.wikipedia.org','127.0.0.1'].includes(root.location?.hostname || root.mw.config?.get('wgServerName'))) return;");
const talkCatalogPath=path.resolve(__dirname,'../talk_project_catalog_contract.json'),talkCatalog=JSON.parse(fs.readFileSync(talkCatalogPath));
const nativeRegressionFixturePath=path.resolve(__dirname,'native_new_regression_ui_fixtures.json'),nativeRegressionFixtureBytes=fs.readFileSync(nativeRegressionFixturePath);
assert.equal(sha(nativeRegressionFixtureBytes),'dadcc58bbc43ec1f0eb0fbf45f59d4da73729c879d5fee44b42df8e2adecc84c','Pinned independent native regression fixtures');
const nativeRegressionFixture=JSON.parse(nativeRegressionFixtureBytes);assert.equal(nativeRegressionFixture.rows.length,26);
const report={kind:'current-2.19-native-browser-interface',version:'2.19.0',status:'passed',browser:browserName,pinManifestSha256:sha(fs.readFileSync(pinPath)),bindings,talkCatalogContractSha256:sha(fs.readFileSync(talkCatalogPath)),talkCatalogBindings:talkCatalog.rows.length,runnerSha256:sha(fs.readFileSync(__filename)),fixtureHtmlSha256:sha(fs.readFileSync(path.join(__dirname,'current_fixture.html'))),fixtureScriptSha256:sha(fs.readFileSync(path.join(__dirname,'current_fixture.js'))),adaptations:['Only exact ptwiki host guards accept the isolated127.0.0.1origin. No transformation or interface function is replaced.','Native installed browsers execute real production worker or staged engines.','MediaWiki API, CodeMirror textSelection registration and source2017 model contracts are explicitly fictional local adapters. These tests do not claim a production MediaWiki server or real CodeMirror/VisualEditor package deployment.','All requests are local read-only fixtures. Form submissions, account actions, cross-origin network access, clipboard writes and screenshots are blocked.','Current Mostrar alterações uses the native editor wpDiff button. Historical inline comparison and selection controls are not expected.'],tests:[],checks:0,failures:[],optionKeys:[],actualWikipediaWrites:0,actualNetworkMutations:0,screenshots:0,serverRequests:[],pageErrors:[],blockedNetwork:[],clipboardWrites:0};
const fixtureHtml=fs.readFileSync(path.join(__dirname,'current_fixture.html'),'utf8'),fixtureScript=fs.readFileSync(path.join(__dirname,'current_fixture.js')),fixtureDir=path.resolve(__dirname,'../../v261/browser'),localFiles={'jquery.js':()=>fs.readFileSync(path.join(fixtureDir,'jquery.js')),'textSelection.js':()=>fs.readFileSync(path.join(fixtureDir,'textSelection.js')),'current_fixture.js':()=>fixtureScript,'core.js':()=>scripts.core,'complete.js':()=>scripts.complete,'data.js':()=>scripts.data};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');report.serverRequests.push({method:req.method,path:url.pathname});
 res.setHeader('Content-Security-Policy',"default-src 'none';script-src 'self' 'unsafe-eval';style-src 'self' 'unsafe-inline';connect-src 'self';worker-src blob:;img-src 'self' data:;form-action 'none';base-uri 'none'");
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){report.actualNetworkMutations++;res.writeHead(403).end('Read only');return;}
 if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return;}
 if(url.pathname==='/'||url.pathname==='/current_fixture.html'){
  const production=url.searchParams.get('bundle')==='core'?'<script src="/data.js"></script><script src="/core.js"></script>':'<script src="/complete.js"></script>';
  res.setHeader('Content-Type','text/html;charset=utf-8');res.end(fixtureHtml.replace('<!-- PRODUCTION_SCRIPTS -->',production));return;
 }
 const resource=localFiles[url.pathname.slice(1)];if(!resource){res.writeHead(404).end('Not found');return;}
 res.setHeader('Content-Type','application/javascript;charset=utf-8');res.end(resource());
});
const Driver={Chrome:NativeChrome,Firefox:NativeFirefox,Safari:NativeSafari}[browserName];assert(Driver,'Known native browser');const driver=new Driver();
if(browserName==='Firefox')driver.click=selector=>require('./stable_native_pointer_click.cjs')(driver,selector,(report.stableNativeClicks??=[]));
const eq=(actual,expected,message)=>{report.checks++;assert.equal(JSON.stringify(actual),JSON.stringify(expected),message);},ok=(condition,message)=>{report.checks++;assert.ok(condition,message);};
const read=async expression=>{const value=await driver.evaluate('(async()=>JSON.stringify(await('+expression+')))()');return typeof value==='string'?JSON.parse(value):value;};
async function waitFor(expression,label,timeout=60000){const start=Date.now();while(Date.now()-start<timeout){if(await read(expression))return;await delay(70);}throw new Error('Timeout: '+label);}
async function click(selector){await driver.click(selector);if(browserName==='Safari')await driver.request('DELETE',`/session/${driver.session}/actions`);}
async function toggle(selector){
 if(browserName!=='Safari')return click(selector);
 await read('(()=>{const e=document.querySelector('+JSON.stringify(selector)+');e.scrollIntoView({block:"center"});e.focus();return document.activeElement===e})()');
 const found=await driver.request('POST',`/session/${driver.session}/element`,{using:'css selector',value:selector}),id=found['element-6066-11e4-a52e-4f735466cecf'];
 await driver.request('POST',`/session/${driver.session}/element/${id}/value`,{text:'\uE00D',value:['\uE00D']});await driver.request('DELETE',`/session/${driver.session}/actions`);
}
async function openParents(selector){await read('(()=>{let n=document.querySelector('+JSON.stringify(selector)+');while(n){if(n.tagName==="DETAILS")n.open=true;n=n.parentElement;}return true})()');}
let origin;
async function stagedTiming(bundle,scenario){
 if(!report.stagedTimings)report.stagedTimings=[];
 report.stagedTimings.push({bundle,scenario,...await read('({processing:RevisaWiki.processing,visibility:document.visibilityState,hidden:document.hidden,documentFocused:document.hasFocus(),messageChannelAvailable:typeof window.MessageChannel==="function",windowPostMessageAvailable:typeof window.postMessage==="function",selfMessageYields:__rw219UI.selfMessageYields})')});
}
async function load(bundle,scenario='normal',adapter='classic',extra={}){
 const query=new URLSearchParams({bundle,scenario,adapter,reset:'1',...extra});await driver.navigate(origin+'/current_fixture.html?'+query);
 await waitFor('window.__rw219UI?.ready===true','fictional adapter ready');
 if(scenario==='view'){await delay(250);return;}
 if(['visual','wiked'].includes(adapter)){await waitFor('window.RevisaWiki?.uiStatus==="ready"','unsupported surface acknowledged');return;}
 await waitFor('window.RevisaWiki?.uiStatus==="ready"&&!!document.querySelector("#revisawiki-ptwiki")','current UI ready');
 eq(await read('RevisaWiki.version'),'2.19.0','The exact release interface is active');
}
async function settled(){await waitFor('document.querySelector("#revisawiki-ptwiki")?.getAttribute("aria-busy")!=="true"&&!RevisaWiki.processing?.active&&!/^Contando ajustes/.test(document.querySelector(".ajg-result-count")?.textContent||"")','interface and retained adjustment count settled');}
async function adjust(){await click('.ajg-run');await waitFor('document.querySelector(".ajg-run")?.dataset.codeChecked==="true"||/recusad|cancelad|mudou|preservad/.test(document.querySelector(".ajg-status")?.textContent||"")','adjustment outcome',Number(process.env.REVISAWIKI_UI_WAIT_MS||60000));await settled();}
async function invariant(){
 const qa=await read('({state:__rw219UI.state(),requests:__rw219UI.requests,policy:__rw219UI.policyViolations})');
 eq(qa.state.errors,[],'No page runtime error');eq(qa.state.forbiddenActions,[],'No forbidden API/account action');eq(qa.state.submits,0,'No form submission');eq(qa.state.saveClicks,0,'No publication-button activation');eq(qa.state.clipboardWrites,0,'No clipboard write');
 eq(qa.policy,[],'No interface action attempts a resource or form operation forbidden by the local content security policy');
 ok(qa.requests.every(request=>['query','parse','paraminfo'].includes(request.parameters.action)),'Every mocked API action is read-only');
 report.clipboardWrites+=qa.state.clipboardWrites;
}
async function test(id,fn){
 if(process.env.REVISAWIKI_UI_CASE_FILTER&&!id.includes(process.env.REVISAWIKI_UI_CASE_FILTER))return;
 const testStarted=Date.now();
 try{await fn();await invariant();report.tests.push({id,status:'passed',milliseconds:Date.now()-testStarted});}catch(error){
  report.status='failed';report.tests.push({id,status:'failed',milliseconds:Date.now()-testStarted});const failure={id,message:String(error.message)};
  try{failure.localDiagnostic=await read('({source:window.__rw219UI?.read(),processing:window.RevisaWiki?.processing,status:document.querySelector(".ajg-status")?.textContent,checked:document.querySelector(".ajg-run")?.dataset.codeChecked,workerStarts:window.__rw219UI?.workerStarts,workerResults:window.__rw219UI?.workerResults?.length,visibility:document.visibilityState,hidden:document.hidden,documentFocused:document.hasFocus(),messageChannelAvailable:typeof window.MessageChannel==="function",errors:window.__rw219UI?.errors})');}catch(diagnosticError){failure.diagnosticError=String(diagnosticError.message);}
  report.failures.push(failure);
 }
 if(process.env.REVISAWIKI_UI_PROGRESS)fs.writeFileSync(process.env.REVISAWIKI_UI_PROGRESS,JSON.stringify({browser:browserName,tests:report.tests,failures:report.failures,checks:report.checks},null,2)+'\n');
}
async function nativeRegressionState(){return read('({source:__rw219UI.read(),summary:__rw219UI.summary(),minor:document.getElementById("wpMinoredit").checked,undoDisabled:document.querySelector(".ajg-undo").disabled,status:document.querySelector(".ajg-status").textContent,checked:document.querySelector(".ajg-run")?.dataset.codeChecked,workerStarts:__rw219UI.workerStarts,workerResults:__rw219UI.workerResults,options:[...document.querySelectorAll("input[data-option]")].map(e=>({key:e.dataset.option,checked:e.checked,disabled:e.disabled}))})');}
async function nativeRegressionAction(row){
 if(row.surface==='talk'){await click('.ajg-prepare-talk');await waitFor('document.querySelector(".ajg-prepare-talk")?.disabled===false','native talk action settled');await settled();}
 else await adjust();
}
async function nativeRegressionFlow(bundle,row){
 await load(bundle,row.surface);
 for(const[key,value]of Object.entries(row.nativeOptionOverrides)){
  const selector='input[data-option="'+key+'"]';await openParents(selector);
  ok(await read('!!document.querySelector('+JSON.stringify(selector)+')&&!document.querySelector('+JSON.stringify(selector)+').disabled'),'The requested native option is visible and editable: '+key);
  if(await read('document.querySelector('+JSON.stringify(selector)+').checked')!==value)await toggle(selector);
  eq(await read('document.querySelector('+JSON.stringify(selector)+').checked'),value,'The native checkbox carries '+key);
 }
 await read('(()=>{__rw219UI.write('+JSON.stringify(row.source)+');__rw219UI.setSummary('+JSON.stringify(row.initialSummary)+');'+(row.surface==='talk'?'__rw219UI.articleSource='+JSON.stringify(row.articleSource)+';':'')+'return true})()');
 const record={id:row.id,bundle,surface:row.surface,sourceSha256:row.sourceSha256,expectedSha256:row.expectedSha256,oracle:row.oracle,before:await nativeRegressionState(),first:null,second:null,undo:null,nativeButtonClicks:0};
 (report.nativeRegressionFlows??=[]).push(record);
 await nativeRegressionAction(row);record.nativeButtonClicks++;record.first=await nativeRegressionState();
 await nativeRegressionAction(row);record.nativeButtonClicks++;record.second=await nativeRegressionState();
 // Persist both actual endpoints before asserting either independent literal endpoint.
 eq(record.before.source,row.source,'The complete fictional source enters the native editor');eq(record.before.summary,row.initialSummary,'The native summary starts exactly');eq(record.before.minor,row.initialMinor,'The native minor checkbox starts exactly');eq(record.before.undoDisabled,true,'A fresh native flow has no prior Undo transaction');
 for(const phase of ['first','second']){const actual=record[phase];eq(actual.source,row.expected,'Exact native '+phase+' endpoint: '+row.id);eq(actual.summary,row.expectedSummary,'Exact native '+phase+' summary ownership: '+row.id);eq(actual.minor,row.expectedMinor,'Exact native '+phase+' minor flag: '+row.id);eq(actual.undoDisabled,!row.expectedUndo,'Native '+phase+' Undo availability follows a real edit');}
 if(row.expectedUndo){await click('.ajg-undo');await settled();record.undo=await nativeRegressionState();eq(record.undo.source,row.source,'Native Undo restores the full original source');eq(record.undo.summary,row.initialSummary,'Native Undo restores owned summary and preserves manual summary');eq(record.undo.minor,row.initialMinor,'Native Undo restores the original minor choice');eq(record.undo.undoDisabled,true,'Undo consumes the native transaction');}
 else record.undo={notClicked:true,reason:'Expected native NOP has no Undo transaction or Undo credit'};
 if(row.surface==='talk')ok((await read('__rw219UI.requests')).some(r=>r.parameters.action==='query'&&r.parameters.prop==='revisions'),'The actual talk button reads its fictional article through the native controller');
}
async function nativePredecessorPositiveFlow(bundle,row){
 const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
 const objectSha=value=>sha(JSON.stringify(canonical(value)));
 await load(bundle,'normal','classic',{nativeWitness:'1'});
 const record={id:row.id,bundle,relatedOriginalIds:row.relatedOriginalIds,canonicalPositiveSources:1,source:row.source,sourceSha256:row.sourceSha256,expected:row.expected,expectedSha256:row.expectedSha256,declaredWitnessOptions:row.declaredWitnessOptions,declaredWitnessOptionsSha256:row.declaredWitnessOptionsSha256,expectedNativeDefaults:row.expectedNativeDefaults,expectedNativeContext:row.expectedNativeContext,before:null,first:null,second:null,undo:null,nativeButtonClicks:0,nativeCheckboxRestorations:[],fullWorkerOptionsSha256ByPhase:{},rawOptionsEqualClaim:false};
 (report.nativePredecessorPositiveFlows??=[]).push(record);
 for(const[key,value]of Object.entries(row.expectedNativeDefaults)){
  const selector='input[data-option="'+key+'"]';await openParents(selector);
  const visible=await read('!!document.querySelector('+JSON.stringify(selector)+')');
  if(!visible){(record.internalDefaults??=[]).push({key,expected:value,verification:'The actual submitted Worker options below must retain this internal Source default.'});continue;}
  ok(await read('!document.querySelector('+JSON.stringify(selector)+').disabled'),'Every visible Source preference remains natively editable: '+key);
  const prior=await read('document.querySelector('+JSON.stringify(selector)+').checked');
  if(prior!==value){await toggle(selector);record.nativeCheckboxRestorations.push({key,before:prior,after:value});}
  eq(await read('document.querySelector('+JSON.stringify(selector)+').checked'),value,'The exact Source default is restored: '+key);
 }
 if(await read('document.getElementById("wpMinoredit").checked')!==row.initialMinor)await toggle('#wpMinoredit');
 await read('(()=>{__rw219UI.write('+JSON.stringify(row.source)+');__rw219UI.setSummary('+JSON.stringify(row.initialSummary)+');return true})()');
 async function state(){return {...await nativeRegressionState(),workerJobs:await read('__rw219UI.nativeWitnessJobs||[]'),nativeContext:await read('({namespaceNumber:mw.config.get("wgNamespaceNumber"),pageTitle:mw.config.get("wgPageName").replaceAll("_"," "),contentModel:mw.config.get("wgPageContentModel")})')};}
 record.before=await state();await adjust();record.nativeButtonClicks++;record.first=await state();await adjust();record.nativeButtonClicks++;record.second=await state();
 // Preserve both complete endpoints and raw submitted jobs before independent endpoint assertions.
 for(const phase of ['first','second'])record.fullWorkerOptionsSha256ByPhase[phase]=record[phase].workerJobs.map(packet=>objectSha(packet.job.options));
 eq(record.declaredWitnessOptionsSha256,objectSha({}),'The original empty witness options retain their distinct canonical pin');
 eq(record.before.source,row.source,'The exact additive semantic Source enters the native editor');eq(record.before.summary,row.initialSummary,'The manual summary starts exactly');eq(record.before.minor,row.initialMinor,'The editor explicitly prechecks the native minor choice');eq(record.before.undoDisabled,true,'Fresh navigation has no prior Undo');
 eq(canonical(Object.fromEntries(record.before.options.filter(item=>Object.hasOwn(row.expectedNativeDefaults,item.key)).map(item=>[item.key,item.checked]))),canonical(Object.fromEntries(record.before.options.filter(item=>Object.hasOwn(row.expectedNativeDefaults,item.key)).map(item=>[item.key,row.expectedNativeDefaults[item.key]]))),'Every visible Source default is restored; the complete80-field Worker vector is checked separately below');eq(record.before.nativeContext,row.expectedNativeContext,'The independent native context is fixed');
 ok(record.first.workerJobs.length>0,'The native button submits at least one real production Worker calculation');
 for(const phase of ['first','second']){
  const actual=record[phase];eq(actual.source,row.expected,'Exact paired native '+phase+' endpoint');eq(actual.summary,row.expectedSummary,'The manual summary remains owned by the editor');eq(actual.minor,row.expectedMinor,'The explicit original minor choice is preserved');eq(actual.undoDisabled,false,'The real changed transaction remains available for Undo');eq(actual.nativeContext,row.expectedNativeContext,'The native context remains fixed');
  for(const packet of actual.workerJobs){for(const[key,value]of Object.entries(row.expectedNativeDefaults))eq(packet.job.options[key],value,'Submitted Worker option retains Source default '+key);eq(packet.job.options.namespaceNumber,0,'Submitted Worker uses article namespace');eq(packet.job.options.pageTitle,row.expectedNativeContext.pageTitle,'Submitted Worker uses exact native title');eq(packet.job.options.sectionOnly,false,'Submitted Worker is a full-page calculation');}
 }
 eq(record.first.workerJobs[0].job.source,row.source,'The first native Worker receives the same complete semantic witness Source');
 await click('.ajg-undo');await settled();record.undo=await state();eq(record.undo.source,row.source,'Native Undo restores the exact original witness Source');eq(record.undo.summary,row.initialSummary,'Native Undo preserves the manual summary');eq(record.undo.minor,row.initialMinor,'Native Undo restores the initial editor minor choice');eq(record.undo.undoDisabled,true,'Undo consumes only this native transaction');
}
const initial='Texto sobre [[Brasil|Brasil]], [[Portugal|Portugal]] e [[França|França]].',expected='Texto sobre [[Brasil]], [[Portugal]] e [[França]].';
(async()=>{
 try{
  report.caseFilter=process.env.REVISAWIKI_UI_CASE_FILTER||null;report.adjustmentWaitLimitMs=Number(process.env.REVISAWIKI_UI_WAIT_MS||60000);report.timerFallbackDiagnosticLimitMs=300000;
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
  report.nativeRegressionFixture={path:nativeRegressionFixturePath,sha256:sha(nativeRegressionFixtureBytes),scenarios:nativeRegressionFixture.rows.length,helperSubstitutions:0};
  for(const bundle of ['core','complete']){
   for(const row of nativeRegressionFixture.rows.slice(0,25))await test(bundle+'-native-regression-'+row.id,()=>nativeRegressionFlow(bundle,row));
   await test(bundle+'-native-predecessor-positive-'+nativeRegressionFixture.rows[25].id,()=>nativePredecessorPositiveFlow(bundle,nativeRegressionFixture.rows[25]));
   await test(bundle+'-classic-worker-native-diff-count-minor-undo',async()=>{
    await load(bundle);eq(await read('document.querySelectorAll("#revisawiki-ptwiki").length'),1,'One current panel');
    eq(await read('document.getElementById("wpSave").previousElementSibling.id'),'revisawiki-adjust-before-publish','The adjustment control directly precedes the native publication control');
    // Compare the same resting state, not a hovered top button with an unhovered bottom button.
    if(browserName==='Chrome')await driver.page.mouse.move(2,2);else if(browserName==='Firefox')await driver.command('input.performActions',{context:driver.context,actions:[{type:'pointer',id:'qa-mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',x:2,y:2,duration:0,origin:'viewport'}]}]});else await driver.request('POST','/session/'+driver.session+'/actions',{actions:[{type:'pointer',id:'qa-mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',x:2,y:2,duration:0,origin:'viewport'}]}]});
    await waitFor('getComputedStyle(document.querySelector(".ajg-run")).backgroundColor===getComputedStyle(document.getElementById("revisawiki-adjust-before-publish")).backgroundColor','Both resting button colors settle',2000);
    const colors=await read('[getComputedStyle(document.querySelector(".ajg-run")).backgroundColor,getComputedStyle(document.getElementById("revisawiki-adjust-before-publish")).backgroundColor]');eq(colors[0],colors[1],'The two adjustment controls share the same green');
    await adjust();eq(await read('__rw219UI.read()'),expected,'All three redundant visible link labels are removed without changing words or targets');
    ok(/^3\s/.test(await read('document.querySelector(".ajg-result-count").textContent')),'Each of the three independent changes is counted');
    const bytes=Buffer.byteLength(expected)-Buffer.byteLength(initial);ok((await read('document.querySelector(".ajg-bytes").textContent')).includes('−'+Math.abs(bytes)),'The exact UTF-8 reduction is shown');
    eq(await read('RevisaWiki.processing.engine'),'worker','The native browser Worker completes the actual production calculation');
    ok(await read('__rw219UI.workerResults.length>0'),'The worker emitted a real result');
    eq(await read('document.getElementById("wpMinoredit").checked'),true,'A proved mechanical edit is marked minor only after the mocked base revision matches');
    ok((await read('__rw219UI.summary()')).length>0,'An empty native summary receives the actual generated summary');
    eq(await read('document.querySelector(".ajg-run").dataset.codeChecked'),'true','The unchanged checked draft is visually identified');
    await click('.ajg-show-changes');eq(await read('__rw219UI.nativeDiffClicks'),1,'Mostrar alterações activates the native wpDiff control');
    eq(await read('document.querySelectorAll(".ajg-comparison,.ajg-before,.ajg-after").length'),0,'No obsolete inline before/after viewer is inserted');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),initial,'Undo restores the exact original source');eq(await read('__rw219UI.summary()'),'','Undo restores only the script-owned summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Undo restores only the script-owned minor choice');
   });
   for(const engine of ['worker','staged'])await test(bundle+'-packed-foreign-media-'+engine,async()=>{
    const source='[[Archivo:Exemplo.svg|sinmarco|Legenda literal.]]',expectedMedia='[[Ficheiro:Exemplo.svg|semmoldura|Legenda literal.]]';
    await load(bundle,engine==='worker'?'normal':'fallback');await read('__rw219UI.write('+JSON.stringify(source)+')');await adjust();
    eq(await read('__rw219UI.read()'),expectedMedia,'The primary-proved same-language namespace and option migrate through the actual packed-data path');
    eq(await read('RevisaWiki.processing.engine'),engine,'The real '+engine+' executor reads the delivered media table');
    ok(/^2\s/.test(await read('document.querySelector(".ajg-result-count").textContent')),'The two final source edits are counted without intermediate native namespace churn');
    if(engine==='worker')eq(await read('__rw219UI.workerResults.at(-1).result.preservation'),[],'The real worker retains the filename, option payload and complete caption');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores the original foreign source and every caption byte');
   });
   for(const engine of ['worker','staged'])await test(bundle+'-packed-native-cs1-role-equivalence-'+engine,async()=>{
    const first='{{Citar web|título=Fonte literal|url=https://example.invalid/fonte|last=Exemplo}}',second='{{Citar web|ultimo=Exemplo|url=https://example.invalid/fonte|título=Fonte literal}}',
     source='<ref>'+first+'</ref>\n<ref>'+second+'</ref>\n{{Referências}}',expectedCitation='<ref name="ref-auto-1">'+first+'</ref>\n<ref name="ref-auto-1" />\n{{Referências}}';
    await load(bundle,engine==='worker'?'normal':'fallback');await read('__rw219UI.write('+JSON.stringify(source)+')');await adjust();
    eq(await read('__rw219UI.read()'),expectedCitation,'Pinned native aliases with the same role/value deduplicate while retaining the first supplied citation body byte for byte');
    eq(await read('RevisaWiki.processing.engine'),engine,'The actual '+engine+' executor reads the delivered native CS1 role table');
    if(bundle==='core')ok(await read('!!window.RevisaWikiDataV2?.packed?.cs1roles219'),'The modular runtime receives the exact role table through its existing data payload');
    ok(/^2\s/.test(await read('document.querySelector(".ajg-result-count").textContent')),'Only the final definition/call edits count, without native key churn');
    if(engine==='worker')eq(await read('__rw219UI.workerResults.at(-1).result.preservation'),[],'The production Worker retains the complete publication and reference associations');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores both original native alias spellings and full citation bodies');
   });
   for(const engine of ['worker','staged'])await test(bundle+'-packed-native-magicwords-'+engine,async()=>{
    const source='{{NOMBASEDEPAGE}} {{CURRENTYEAR}}',expectedMagic='{{NOMEDAPAGINABASE}} {{CURRENTYEAR}}';
    await load(bundle,engine==='worker'?'normal':'fallback');await read('__rw219UI.write('+JSON.stringify(source)+')');await adjust();
    eq(await read('__rw219UI.read()'),expectedMagic,'The registered foreign magic name reaches its proved native target while the accepted native alias remains byte-identical');
    eq(await read('RevisaWiki.processing.engine'),engine,'The actual '+engine+' executor consumes the delivered native magicword table');
    if(bundle==='core')ok(await read('!!window.RevisaWikiDataV2?.packed?.magicwords219'),'The modular runtime receives the exact native magicword registry through the existing data payload');
    ok(/^1\s/.test(await read('document.querySelector(".ajg-result-count").textContent')),'One source magicword header correction counts once');
    if(engine==='worker')eq(await read('__rw219UI.workerResults.at(-1).result.preservation'),[],'The real Worker retains all magicword payload and native alias bytes');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores both original magicword calls exactly');
   });
   for(const adapter of ['codemirror','2017'])await test(bundle+'-'+adapter+'-source-contract',async()=>{
    await load(bundle,'normal',adapter);await adjust();eq(await read('__rw219UI.read()'),expected,'The supported source adapter receives the complete exact replacement');ok(await read('__rw219UI.modelWrites>0'),'The adapter writes its independent source model');
    eq(await read('document.getElementById("wpTextbox1").value'),initial,'The independent source model is exercised instead of a hidden textarea fallback');
    eq(await read('!!document.getElementById("revisawiki-adjust-before-publish")'),adapter==='codemirror','The native-form shortcut is mounted only for its supported form adapter');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),initial,'The source adapter supports exact undo');
   });
   for(const adapter of ['visual','wiked'])await test(bundle+'-'+adapter+'-guard',async()=>{await load(bundle,'normal',adapter);eq(await read('document.querySelectorAll("#revisawiki-ptwiki,#revisawiki-adjust-before-publish").length'),0,'An unsupported editing model receives no misleading source controls');eq(await read('__rw219UI.read()'),initial,'The unsupported model stays unchanged');});
   for(const approximate of [false,true])await test(bundle+'-current-biography-date-wrapper-'+(approximate?'partial-birth':'complete-dates'),async()=>{
    const birth=approximate?'cerca de 1900':'1 de janeiro de 1900',source="{{Info/Biografia\n|nome=Tema fictício\n|nascimento_data="+birth+"\n|morte_data=2 de janeiro de 1980\n}}\n'''Tema fictício''' é uma pessoa deste exemplo.\n\n{{Referências}}\n{{Portal3|Biografias}}\n";
    await load(bundle);await read('__rw219UI.write('+JSON.stringify(source)+')');await adjust();const actual=await read('__rw219UI.read()');
    ok(actual.includes(approximate?'cerca de 1900':'{{DataExt|1|1|1900}}'),'The supplied birth precision is retained with the current independently proved native wrapper contract');
    ok(actual.includes(approximate?'{{DataExt|2|1|1980}}':'{{Morte|2|1|1980|1|1|1900}}'),'The complete supplied death day retains its exact date and uses a birth tuple only when supplied completely');
    if(approximate)ok(!actual.includes('{{Morte|2|1|1980|1|1|1900}}'),'A year-only approximate birth cannot invent a birth day or death-age tuple');
    eq(await read('RevisaWiki.processing.engine'),'worker','The current field/date action executes in the production Worker');
    eq(await read('__rw219UI.workerResults.at(-1).result.preservation'),[],'No preserved-source exception hides the current date conversion');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores the original complete or approximate date source exactly');
   });
   await test(bundle+'-read-view-no-extra-section-buttons',async()=>{await load(bundle,'view');eq(await read('document.querySelectorAll(".rw26-launch,.rw26-lead-launch").length'),0,'Stale section controls are removed and no new section buttons appear');eq(await read('document.querySelectorAll(".mw-editsection a").length'),1,'The native section-edit link is retained');eq(await read('document.querySelectorAll("#qa-unowned").length'),1,'Unrelated controls stay intact');});
   await test(bundle+'-staged-fallback',async()=>{await load(bundle,'fallback');await adjust();eq(await read('__rw219UI.read()'),expected,'The staged fallback reaches the same exact source');eq(await read('RevisaWiki.processing.engine'),'staged','The actual staged engine is exercised');eq(await read('__rw219UI.workerStarts'),0,'No synthetic worker result replaces the fallback');await stagedTiming(bundle,'fallback');});
   for(const scenario of ['fallback-timer','fallback-channel-error'])await test(bundle+'-'+scenario,async()=>{
    await load(bundle,scenario);await click('.ajg-run');
    await waitFor('document.querySelector(".ajg-run")?.dataset.codeChecked==="true"','native self-message fallback completes under its unchanged explicit 300-second diagnostic bound',300000);await settled();
    eq(await read('__rw219UI.read()'),expected,'The native self-message fallback retains the exact transformation endpoint');eq(await read('RevisaWiki.processing.engine'),'staged','The absent or refused MessageChannel still uses the real staged engine');eq(await read('__rw219UI.workerStarts'),0,'No worker or fabricated result hides the fallback');ok(await read('__rw219UI.selfMessageYields>0'),'The actual production fallback posts same-window task tokens through the native API');await stagedTiming(bundle,scenario);
   });
   for(const cause of ['cancel','stale'])await test(bundle+'-self-message-'+cause,async()=>{
    await load(bundle,'fallback-self-message-held');await click('.ajg-run');await waitFor('__rw219UI.pendingSelfMessages.length>0&&RevisaWiki.processing.active','the real self-message yield is waiting before the next processing step');
    const retained=cause==='stale'?initial+'\nAlteração manual.':initial;
    if(cause==='cancel')await click('.ajg-stop');else await read('__rw219UI.write('+JSON.stringify(retained)+')');
    eq(await read('__rw219UI.releaseSelfMessages()'),1,'The exact held native message is delivered after the cancellation or draft change');await settled();
    eq(await read('__rw219UI.read()'),retained,'The post-await task guard retains the original or newer draft');eq(await read('__rw219UI.summary()'),'','A stopped self-message continuation generates no summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'A stopped continuation does not mark the edit minor');eq(await read('__rw219UI.pendingSelfMessages.length'),0,'The diagnostic releases every held task token');
   });
   await test(bundle+'-summary-ownership-manual-undo',async()=>{await load(bundle);await read('__rw219UI.setSummary("Resumo manual.")');await adjust();eq(await read('__rw219UI.summary()'),'Resumo manual.','A manually written summary is preserved');await read('__rw219UI.setSummary("Outro resumo manual.")');await click('.ajg-undo');await settled();eq(await read('__rw219UI.summary()'),'Outro resumo manual.','Undo does not overwrite a later manual summary');});
   await test(bundle+'-minor-option-and-proof-vetoes',async()=>{
    await load(bundle);await openParents('input[data-option="autoMinor"]');await toggle('input[data-option="autoMinor"]');await adjust();eq(await read('document.getElementById("wpMinoredit").checked'),false,'An explicit automatic-minor opt-out is respected');
    for(const setup of ['__rw219UI.failQuery=true','__rw219UI.queryRevision=101']){await load(bundle);await read(setup);await click('.ajg-run');await settled();eq(await read('document.getElementById("wpMinoredit").checked'),false,'A missing or mismatched base-revision proof cannot mark the draft minor');}
    await load(bundle);await read('document.getElementById("wpMinoredit").checked=true');await adjust();await click('.ajg-undo');await settled();eq(await read('document.getElementById("wpMinoredit").checked'),true,'Undo preserves an existing user-selected minor flag');
   });
   await test(bundle+'-draft-staleness-and-undo-guard',async()=>{await load(bundle);await adjust();const manual=expected+'\nTexto acrescentado manualmente.';await read('__rw219UI.write('+JSON.stringify(manual)+')');await waitFor('document.querySelector(".ajg-run").dataset.codeChecked==="false"','checked state invalidated');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),manual,'Undo refuses to overwrite intervening manual text');ok(/mudou/.test(await read('document.querySelector(".ajg-status").textContent')),'The preservation reason is explicit');});
   await test(bundle+'-cancel-before-apply',async()=>{await load(bundle,'slow');await click('.ajg-run');await waitFor('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")==="true"','local analysis busy');await click('.ajg-stop');await settled();eq(await read('__rw219UI.read()'),initial,'Cancellation applies no partial source change');eq(await read('__rw219UI.summary()'),'','Cancellation applies no summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Cancellation applies no minor marking');});
   await test(bundle+'-source-race-preservation',async()=>{await load(bundle,'race');await click('.ajg-run');await waitFor('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")==="true"','analysis entered');const manual=initial+'\nAlteração manual.';await read('__rw219UI.write('+JSON.stringify(manual)+')');await settled();eq(await read('__rw219UI.read()'),manual,'A stale calculation cannot replace a newer draft');});
   await test(bundle+'-cc9-auto-preview-single-native-option-off',async()=>{
    const rows=[];
    for(const enabled of [true,false]){
     await load(bundle,'preview-failure','classic',{preview:'1'});const selector='input[data-option="autoPreview"]';await openParents(selector);eq(await read('document.querySelector('+JSON.stringify(selector)+').checked'),true,'The existing positive preview control starts enabled');if(!enabled)await toggle(selector);
     eq(await read('document.querySelector('+JSON.stringify(selector)+').checked'),enabled,'The actual native preview checkbox carries the sole causal option');await adjust();eq(await read('__rw219UI.read()'),expected,'Both controls retain the existing locally verified endpoint');
     const parse=await read('__rw219UI.requests.filter(r=>r.parameters.action==="parse").length');ok(enabled?parse>0:parse===0,'Only the enabled option attempts the controlled parse');rows.push({enabled,parse,source:initial,expected});
    }
    report.causalUIControls??=[];report.causalUIControls.push({option:'autoPreview',role:'ui-network-lifecycle',selector:'input[data-option="autoPreview"]',source:initial,onExpected:expected,offExpected:expected,controlledResponse:'same preview-failure fixture',rows,writerPositiveCredit:0});
   });
   await test(bundle+'-cc9-review-single-native-option-off',async()=>{
    const source='{{Citar web|titulo=Fonte|titulo=Outra fonte}}',choiceExpected='{{Citar web|titulo=Fonte}}',rows=[];
    for(const enabled of [true,false]){
     await load(bundle);const selector='input[data-option="review"]';await openParents(selector);eq(await read('document.querySelector('+JSON.stringify(selector)+').checked'),true,'The optional-review parent starts enabled');if(!enabled)await toggle(selector);await read('__rw219UI.write('+JSON.stringify(source)+')');await adjust();eq(await read('__rw219UI.read()'),source,'Neither branch silently chooses a conflicting title');
     const choices=await read('document.querySelectorAll(".ajg-review-occurrence .ajg-review").length');ok(enabled?choices>0:choices===0,'Only the enabled parent exposes the independently valid optional title choice');
     if(enabled){await openParents('.ajg-review-occurrence .ajg-review');await click('.ajg-review-occurrence > button.ajg-review:first-of-type');await settled();eq(await read('__rw219UI.read()'),choiceExpected,'Explicit native review choice applies the exact existing first-title endpoint');}
     rows.push({enabled,choices});
    }
    // A mandatory source defect remains reportable even when optional choices are off.
    await load(bundle,'review');await openParents('input[data-option="review"]');await toggle('input[data-option="review"]');await adjust();ok((await read('document.querySelector(".ajg-review-area").textContent')).match(/definição|definida|referência/i),'Mandatory reference findings are not the optional-review flag');
    report.causalUIControls??=[];report.causalUIControls.push({option:'review',role:'ui-optional-choice-control',selector:'input[data-option="review"]',source,onExpected:choiceExpected,offExpected:source,rows,writerPositiveCredit:0});
   });
   await test(bundle+'-automatic-preview-failure',async()=>{await load(bundle,'preview-failure','classic',{preview:'1'});await adjust();eq(await read('__rw219UI.read()'),expected,'A failed online preview leaves the locally verified source available for review');ok(await read('__rw219UI.requests.some(request=>request.parameters.action==="parse")'),'The preview failure path is exercised through a mocked read-only parse request');ok(!(await read('document.querySelector("#revisawiki-ptwiki").textContent')).includes('A pré-visualização automática não terminou.'),'The retired alarming boilerplate is absent');});
   await test(bundle+'-automatic-preview-new-error-rollback',async()=>{await load(bundle,'preview-new-error','classic',{preview:'1'});await click('.ajg-run');await settled();eq(await read('__rw219UI.read()'),initial,'An introduced preview error restores the original complete draft');eq(await read('__rw219UI.summary()'),'','A rejected transaction claims no applied summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'A rejected transaction is not marked minor');});
   await test(bundle+'-all-visible-option-preferences',async()=>{
    await load(bundle);await openParents('.ajg-settings');await read('document.querySelector(".ajg-settings").open=true');const keys=await read('[...document.querySelectorAll("input[data-option]")].map(input=>input.dataset.option)');ok(keys.length>40,'The complete current option panel is inventoried');report.optionKeys=[...new Set([...report.optionKeys,...keys])].sort();
    for(const key of keys){const selector='input[data-option="'+key+'"]',before=await read('document.querySelector('+JSON.stringify(selector)+').checked');await openParents(selector);await toggle(selector);eq(await read('document.querySelector('+JSON.stringify(selector)+').checked'),!before,'Native interaction changes option '+key);const stored=key==='spellingRepeated'?'JSON.parse(localStorage.getItem("RevisaWiki.spelling.v1.3:"+encodeURIComponent("ptwiki:Conta local fictícia"))).repeated':'JSON.parse(localStorage.getItem("RevisaWiki.preferences.v1.2")).overrides['+JSON.stringify(key)+']';eq(await read(stored),!before,'The explicit preference is stored for '+key);await toggle(selector);eq(await read('document.querySelector('+JSON.stringify(selector)+').checked'),before,'The native option returns to its prior state '+key);}
    eq(await read('document.querySelector("input[data-option=referenceColumns]").closest("label").textContent.trim()'),'Retirar estilos antigos do RevisaWiki nas referências','The current label states the bounded retained layout cleanup');
    ok(!(await read('document.querySelector(".ajg-settings").textContent')).includes('Até duas colunas em cada lista com dez ou mais entradas'),'The retired automatic column promise is absent');
    eq(await read('__rw219UI.requests.length'),0,'Changing preferences does not query or edit any wiki');
   });
   await test(bundle+'-preference-reload-and-summary-off',async()=>{await load(bundle);await openParents('input[data-option="autoSummary"]');await toggle('input[data-option="autoSummary"]');await load(bundle,'normal','classic',{reset:'0'});eq(await read('document.querySelector("input[data-option=autoSummary]").checked'),false,'The saved automatic-summary choice survives reload');await adjust();eq(await read('__rw219UI.summary()'),'','The disabled summary option is respected by the actual adjustment action');});
   await test(bundle+'-personal-preference-lock',async()=>{await load(bundle,'personal');const input=await read('({disabled:document.querySelector("input[data-option=autoSummary]").disabled,checked:document.querySelector("input[data-option=autoSummary]").checked})');eq(input,{disabled:true,checked:false},'A personal configuration value is visibly locked and accurately reflected');await adjust();eq(await read('__rw219UI.summary()'),'','The locked automatic-summary setting is respected');});
   await test(bundle+'-talk-code-one-action-and-undo',async()=>{await load(bundle,'talk');await click('.ajg-prepare-talk');await waitFor('/Código criado/.test(document.querySelector(".ajg-status").textContent)','talk header created');const text=await read('__rw219UI.read()');ok(text.startsWith('{{PD}}\n'),'PD is first');ok(text.includes('{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}'),'All confirmed example projects are kept in one proper project marker');ok(!text.includes('Portal da física'),'The consumed pasted portal labels do not remain in the draft');eq(await read('__rw219UI.summary()'),'{{PD}}{{Marca de projeto}}','The actual talk-header action fills the exact agreed summary');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),'Portal da física Portal da tecnologia Portal da ciência','Undo restores the full original discussion draft');});
   for(const [input,expected]of [['cinema','Cinema'],['filme','Cinema'],['estados unidos','Estados Unidos'],['estados unidos da américa','Estados Unidos'],
    ['biografia','Biografia'],['biografias','Biografia'],['brasil','Brasil'],['frança','França'],['portugal','Portugal'],['história','História'],
    ['física','Física'],['matemática','Matemática'],['política','Política'],['ciência','Ciência'],['ciencia','Ciência'],['tecnologia','Tecnologia'],
    ['esportes','Esporte'],['desporto','Esporte'],['futebol','Futebol'],['literatura','Literatura'],['música','Música']])
   await test(bundle+'-talk-project-'+input.replaceAll(' ','-'),async()=>{
    await load(bundle,'talk');await read('(()=>{__rw219UI.articleSource='+JSON.stringify('Texto fictício.\n{{Portal3|'+input+'}}')+';__rw219UI.write("");return true})()');
    await click('.ajg-prepare-talk');await waitFor('/Código criado/.test(document.querySelector(".ajg-status").textContent)','single confirmed talk project prepared and sent');
    eq(await read('__rw219UI.read()'),'{{PD}}\n{{Marca de projeto|?|'+expected+'|?}}\n','The production single-action control creates and inserts the exact registered project header');
    eq(await read('__rw219UI.summary()'),'{{PD}}{{Marca de projeto}}','Every registered project uses the exact agreed talk summary');
    ok((await read('__rw219UI.requests')).some(request=>request.parameters.action==='query'&&request.parameters.prop==='revisions'),'The production action reads the article through its real read-only API route');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),'','Undo restores the complete original empty discussion draft');
   });
   for(let index=0;index<talkCatalog.rows.length;index+=32){
    const rows=talkCatalog.rows.slice(index,index+32),projects=[...new Set(rows.map(row=>row.expected))],article='Texto fictício.\n{{Portal3|'+rows.map(row=>row.alias).join('|')+'}}',expected='{{PD}}\n{{Marca de projeto|?|'+projects.map(project=>project+'|?').join('|')+'}}\n';
    await test(bundle+'-talk-catalog-batch-'+index,async()=>{
     await load(bundle,'talk');await read('(()=>{__rw219UI.articleSource='+JSON.stringify(article)+';__rw219UI.write("");return true})()');
     await click('.ajg-prepare-talk');await waitFor('/Código criado/.test(document.querySelector(".ajg-status").textContent)','all confirmed catalog choices prepared and inserted');
     eq(await read('__rw219UI.read()'),expected,'The production control inserts every independently pinned catalog binding with the correct precedence and input order');
     eq(await read('__rw219UI.summary()'),'{{PD}}{{Marca de projeto}}','Catalog batches retain the exact agreed talk summary');
     ok((await read('__rw219UI.requests')).some(request=>request.parameters.action==='query'&&request.parameters.prop==='revisions'),'Every catalog batch uses the real read-only article-fetch controller');
     await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),'','Undo restores the entire original draft after a complete catalog batch');
    });
   }
   await test(bundle+'-review-expanded-and-no-obsolete-groups',async()=>{await load(bundle,'review');await adjust();const review=await read('(()=>{const e=document.querySelector(".ajg-review-area");return {present:!!e,hidden:e?.hidden,open:e?.open,text:e?.textContent||""}})()');ok(review.present&&!review.hidden&&review.open,'An actionable unresolved reference finding is expanded by default');ok(/definição|definida|referência/i.test(review.text),'The real unresolved reference obligation remains available');const text=await read('document.querySelector("#revisawiki-ptwiki").textContent');ok(!/Por que alguns ajustes não entraram|Resultados anteriores e conferências|Antes e depois/.test(text),'Retired report categories and inline comparisons stay absent');});
   await test(bundle+'-target-lookups-read-only',async()=>{await load(bundle,'lookup');await openParents('.ajg-check');await click('.ajg-check');await settled();eq(await read('__rw219UI.read()'),'Texto sobre [[Alvo fictício]].','Target checking never changes the current source');ok(await read('__rw219UI.requests.some(request=>request.parameters.action==="query"&&String(request.parameters.titles||"").includes("Alvo fictício"))'),'The real target-check control requests its fictional target');});
   await test(bundle+'-spelling-review-and-chosen-fix',async()=>{await load(bundle,'spelling');await openParents('.ajg-spelling');await click('.ajg-spelling');await settled();eq(await read('__rw219UI.read()'),'O texto tem uma excessão.','The spelling review button leaves text unchanged before a choice');await waitFor('!!document.querySelector(".ajg-review")','spelling choice available');await openParents('.ajg-review');await click('.ajg-review');await settled();eq(await read('__rw219UI.read()'),'O texto tem uma exceção.','The explicit spelling choice changes only the selected misspelling');});
   await test(bundle+'-duplicate-load-guard',async()=>{await load(bundle);await read('new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="/'+(bundle==='core'?'core':'complete')+'.js";s.onload=()=>resolve(true);s.onerror=reject;document.head.appendChild(s);})');await delay(150);eq(await read('document.querySelectorAll("#revisawiki-ptwiki").length'),1,'Reloading the actual executable creates no duplicate panel');eq(await read('document.querySelectorAll("#revisawiki-adjust-before-publish").length'),1,'Reloading creates no duplicate native-form adjustment button');eq(await read('__rw219UI.read()'),initial,'A repeated load does not adjust source by itself');});
   await test(bundle+'-template-and-templatestyles-contexts',async()=>{await load(bundle,'template');ok((await read('document.querySelector(".ajg-intro").textContent')).includes('predefinição'),'The ordinary template receives its own source context');await load(bundle,'styles');eq(await read('document.querySelectorAll(".ajg-run,#revisawiki-adjust-before-publish").length'),0,'TemplateStyles receives only its dedicated CSS controls');await click('.ajg-check');await settled();eq(await read('__rw219UI.read()'),'.caixa { color: red; border-color: #aaa; }','The valid stylesheet stays intact');ok(await read('__rw219UI.requests.every(request=>request.method==="GET")'),'The TemplateStyles sanitizer protocol uses only read requests');});
   await test(bundle+'-diagnostic-manual-copy-fallback',async()=>{await load(bundle);await openParents('.ajg-copy-diagnostic');await click('.ajg-copy-diagnostic');await waitFor('!!document.querySelector(".ajg-diagnostic-text")','manual diagnostic fallback');eq(await read('__rw219UI.clipboardAttempts'),1,'The clipboard fallback is exercised without granting clipboard access');ok((await read('document.querySelector(".ajg-diagnostic-text").value')).includes('2.19.0'),'The diagnostic reports the current actual version');});
  }
  report.pageErrors=driver.errors||[];report.blockedNetwork=driver.blocked||[];eq(report.actualNetworkMutations,0,'The local server received no mutation');eq(report.pageErrors,[],'No browser page runtime error');eq(report.clipboardWrites,0,'No clipboard writes');
 }catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:String(error.message)});}
 finally{
  try{
   // Safari's shared driver deliberately swallows teardown errors. Require an
   // acknowledged deletion of this exact owned session before claiming success.
   if(browserName==='Safari'&&driver.session){await driver.request('DELETE',`/session/${driver.session}`);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}
   await driver.close();report.ownedBrowserSessionClosed=true;
  }catch(error){report.status='failed';report.ownedBrowserSessionClosed=false;report.failures.push({id:'owned-session-cleanup',message:String(error.message)});try{await driver.close();}catch{}}
  await new Promise(resolve=>server.close(resolve));report.testCount=report.tests.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
 }
})();
