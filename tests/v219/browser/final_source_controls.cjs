'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const fixtureDirectory=path.resolve(process.env.REVISAWIKI_UI_FIXTURE_DIRECTORY||__dirname);
const {NativeChrome,NativeFirefox,NativeSafari,delay}=require(path.resolve(fixtureDirectory,'../../v261/browser/native_driver.cjs'));
const contractPath=path.resolve(process.env.REVISAWIKI_UI_SOURCE_CONTRACT||path.join(__dirname,'final_source_controls_contract.json')),contractRaw=fs.readFileSync(contractPath),contract=JSON.parse(contractRaw);
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
const report={kind:'native-final-source-bound-controls',version:'2.19.0',status:'passed',browser:browserName,pinManifestSha256:sha(fs.readFileSync(pinPath)),bindings,sourceContractSha256:sha(contractRaw),declaredScenarioCount:contract.rows.length,declaredFlowsPerBrowser:contract.rows.length*4,nativeEndpointCases:[],runnerSha256:sha(fs.readFileSync(__filename)),fixtureHtmlSha256:sha(fs.readFileSync(path.join(fixtureDirectory,'current_fixture.html'))),fixtureScriptSha256:sha(fs.readFileSync(path.join(fixtureDirectory,'current_fixture.js'))),adaptations:['Only exact ptwiki host guards accept the isolated127.0.0.1origin. No transformation or interface function is replaced.','Native installed browsers execute real production worker or staged engines.','MediaWiki API, CodeMirror textSelection registration and source2017 model contracts are explicitly fictional local adapters. These tests do not claim a production MediaWiki server or real CodeMirror/VisualEditor package deployment.','All requests are local read-only fixtures. Form submissions, account actions, cross-origin network access, clipboard writes and screenshots are blocked.','Current Mostrar alterações uses the native editor wpDiff button. Historical inline comparison and selection controls are not expected.'],tests:[],checks:0,failures:[],optionKeys:[],actualWikipediaWrites:0,actualNetworkMutations:0,screenshots:0,serverRequests:[],pageErrors:[],blockedNetwork:[],clipboardWrites:0};
const fixtureHtml=fs.readFileSync(path.join(fixtureDirectory,'current_fixture.html'),'utf8'),fixtureScript=fs.readFileSync(path.join(fixtureDirectory,'current_fixture.js')),fixtureDir=path.resolve(fixtureDirectory,'../../v261/browser'),localFiles={'jquery.js':()=>fs.readFileSync(path.join(fixtureDir,'jquery.js')),'textSelection.js':()=>fs.readFileSync(path.join(fixtureDir,'textSelection.js')),'current_fixture.js':()=>fixtureScript,'core.js':()=>scripts.core,'complete.js':()=>scripts.complete,'data.js':()=>scripts.data};
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
if(browserName==='Firefox')driver.click=selector=>require(path.join(fixtureDirectory,'stable_native_pointer_click.cjs'))(driver,selector,(report.stableNativeClicks??=[]));
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
  report.failures.push(failure);const pending=report.nativeEndpointCases?.at(-1);if(pending?.status==='running')pending.status='failed';
 }
 if(process.env.REVISAWIKI_UI_PROGRESS)fs.writeFileSync(process.env.REVISAWIKI_UI_PROGRESS,JSON.stringify({browser:browserName,tests:report.tests,failures:report.failures,checks:report.checks},null,2)+'\n');
}

const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
report.semanticOracle='Only preauthored source/options/allowed endpoint strings from the independent fixture contract. No production calculation supplies expected text.';
report.productionDeadlineMs=60000;
report.adaptations.push('The existing public personal configuration interface sets preauthored option values. No transformation, apply handler, verdict or result is replaced.');
report.adaptations.push('One real native pointer action invokes each adjustment. Firefox waits for stable geometry before that one action.');
report.evidenceBoundary='Actual installed native browser, actual delivered Worker or staged calculation, fictional local MediaWiki adapter. Native source parsing and Wikimedia server rendering are separately pinned primary proof, not inferred from the local fixture.';
report.oldSourceProjectionSemanticsChanged=0;
(async()=>{
 try{
  assert.equal(contract.version,'2.19.0');assert.equal(contract.declaredScenarioCount,contract.rows.length);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
  await driver.start(origin);report.browserVersion=driver.version;
  for(const bundle of ['core','complete'])for(const engine of ['worker','staged'])for(const declared of contract.rows){
   // The native textarea API normalizes CR and CRLF before the tool reads it.
   // Compare the exact editor preimage and its correspondingly authored endpoint.
   const entry={...declared,source:declared.source.replace(/\r\n?/g,'\n'),
       expectedEndpoints:declared.expectedEndpoints.map(value=>value.replace(/\r\n?/g,'\n'))};
   const id=bundle+'-'+engine+'-'+entry.id;
   await test(id,async()=>{
    const descriptor={bundle,engine,id:entry.id,runtimeSha256:bindings[bundle].sha256,dataRuntimeSha256:bindings.data.sha256,
     sourceSha256:sha(entry.source),fileSourceSha256:sha(declared.source),nativeTextareaLineEndingNormalization:true,preauthoredOptionsSha256:sha(JSON.stringify(canonical(entry.options))),
     allowedExpectedEndpointSha256:entry.expectedEndpoints.map(sha),sourceRuleIds:entry.sourceRuleIds||[],
     evidenceKind:'native-pointer-oneclick-independent-exact-endpoint',status:'running'};
    report.nativeEndpointCases.push(descriptor);
    await load(bundle,engine==='worker'?'normal':'fallback');
    const requested=await read('(()=>{window.RevisaWikiConfig={...RevisaWiki.defaults,...'+JSON.stringify(entry.options)+'};__rw219UI.write('+JSON.stringify(entry.source)+');return window.RevisaWikiConfig})()');
    descriptor.requestedOptionsSha256=sha(JSON.stringify(canonical(requested)));descriptor.optionsSha256=descriptor.requestedOptionsSha256;
    descriptor.optionsSha256Meaning='Requested personal configuration snapshot, not the exact normalized calculation options.';
    descriptor.actualJobOptionsSnapshotSha256=null;
    eq(Object.fromEntries(Object.keys(entry.options).map(key=>[key,requested[key]])),entry.options,'The public configuration retains every exact preauthored option');
    if(bundle==='core'&&entry.packedDataPath){
     const steps=entry.packedDataPath.split('.');
     ok(await read('(()=>{let value=window.RevisaWikiDataV2?.packed;for(const key of '+JSON.stringify(steps)+')value=value?.[key];return value!==undefined&&value!==null})()'),'The modular runtime delivers the exact required source contract table through its existing data payload');
    }
    eq(await read('__rw219UI.read()'),entry.source,'The actual native textarea preimage is bound before adjustment');
    await adjust();
    const actual=await read('__rw219UI.read()');
    descriptor.actualEndpointSha256=sha(actual);
    ok(entry.expectedEndpoints.includes(actual),'The real button reaches one exact independently authored endpoint');
    const selectedExpected=entry.expectedEndpoints.find(value=>value===actual);
    descriptor.expectedEndpointSha256=sha(selectedExpected);
    descriptor.scenarioSha256=sha(JSON.stringify(canonical({sourceSha256:descriptor.sourceSha256,optionsSha256:descriptor.requestedOptionsSha256,expectedEndpointSha256:descriptor.expectedEndpointSha256})));
    descriptor.intentSha256=sha(JSON.stringify(canonical({id:entry.id,kind:entry.kind,sourceRuleIds:entry.sourceRuleIds||[],authority:entry.authority})));
    descriptor.changed=actual!==entry.source;
    eq(await read('RevisaWiki.processing.engine'),engine,'The requested production '+engine+' executor completes');
    eq(await read('document.getElementById("wpMinoredit").checked'),false,'These supplied-key/metadata controls never silently mark an edit minor');
    if(engine==='worker'){
     const capture=await read('(()=>{const item=[...__rw219UI.workerResults].reverse().find(x=>x.result?.kind!=="presentation"&&typeof x.result?.text==="string");return item?{id:item.id,result:item.result}:null})()');
     ok(!!capture,'A real adjustment Worker result was observed separately from presentation messages');
     eq(capture.result.text,actual,'The applied source is the actual Worker candidate');
     eq(capture.result.preservation,[],'No preservation failure is concealed by the interface');
     ok(capture.result.localCompositionSafety?.accepted,'The real source-bound composition verdict accepts this preauthored endpoint');
     eq(capture.result.localCompositionSafety.source,entry.source,'The verdict remains bound to the exact original source');
     eq(capture.result.localCompositionSafety.candidate,actual,'The verdict remains bound to the actual candidate');
     const sealed=JSON.parse(capture.result.localCompositionSafety.optionsSnapshot);
     const knownBooleanKeys=await read('Object.keys(RevisaWiki.defaults).filter(key=>typeof RevisaWiki.defaults[key]===\"boolean\")');
     const requiredBooleanKeys=knownBooleanKeys.filter(key=>Object.hasOwn(entry.options,key)),requiredContextKeys=['namespaceNumber','pageTitle'].filter(key=>Object.hasOwn(entry.options,key));
     const requiredKeys=[...new Set([...requiredBooleanKeys,...requiredContextKeys])];
     eq(requiredKeys.filter(key=>!Object.hasOwn(sealed,key)),[],'Every declared known boolean option and production context field must exist in the sealed actual calculation snapshot');
     eq(Object.fromEntries(requiredKeys.map(key=>[key,sealed[key]])),Object.fromEntries(requiredKeys.map(key=>[key,entry.options[key]])),'Every declared known boolean and production context value is exact in the sealed actual job');
     descriptor.requiredSealedBooleanKeys=requiredBooleanKeys;descriptor.requiredSealedContextFields=requiredContextKeys;
     const sealedContext=JSON.parse(capture.result.localCompositionSafety.contextSnapshot);
     ok(Array.isArray(sealedContext)&&sealedContext.length===6,'The actual production task context tuple remains bound to the Worker verdict');
     eq({pageTitle:sealedContext[1],namespaceNumber:sealedContext[2],contentModel:sealedContext[3]},
      {pageTitle:entry.options.pageTitle,namespaceNumber:entry.options.namespaceNumber,contentModel:entry.options.contentModel},'The exact fixture title, namespace and content model are sealed in the production task context');
     descriptor.actualJobContextSnapshotSha256=sha(capture.result.localCompositionSafety.contextSnapshot);
     descriptor.contentModelBinding='Production contextSnapshot[3], not serializableOptions, which deliberately omits contentModel.';
     eq(Object.fromEntries(Object.keys(entry.options).filter(key=>Object.hasOwn(sealed,key)).map(key=>[key,sealed[key]])),Object.fromEntries(Object.entries(entry.options).filter(([key])=>Object.hasOwn(sealed,key))),'The sealed actual job retains every supplied option represented in its calculation snapshot');
     descriptor.jobOptionsSnapshotSha256=sha(capture.result.localCompositionSafety.optionsSnapshot);
     descriptor.actualJobOptionsSnapshotSha256=descriptor.jobOptionsSnapshotSha256;
     descriptor.actualJobOptionsSnapshotSha256Meaning='Exact full sealed calculation snapshot emitted by the production Worker, including normalized/proof context.';
     descriptor.appliedIds=(capture.result.changes||[]).filter(item=>item.count>0).map(item=>item.id);
    }else{
     eq(await read('__rw219UI.workerStarts'),0,'No Worker or fabricated Worker result hides the staged fallback');
     descriptor.appliedIdsEvidence='Staged interface endpoint only; rule IDs are not inferred from text or a second calculate call.';
    }
    await adjust();
    eq(await read('__rw219UI.read()'),selectedExpected,'A second real click keeps the exact same endpoint and cannot resolve ambiguity by activation');
    descriptor.idempotenceChecked=true;
    if(actual!==entry.source){
     await click('.ajg-undo');await settled();
     eq(await read('__rw219UI.read()'),entry.source,'Native Undo restores every byte of the original source');
     descriptor.exactUndoChecked=true;
    }else{
     eq(await read('__rw219UI.read()'),entry.source,'A refused or native-valid source retains every original byte');
     descriptor.exactUndoChecked=false;
    }
    descriptor.processing=await read('({engine:RevisaWiki.processing.engine,milliseconds:RevisaWiki.processing.milliseconds,workerFailure:RevisaWiki.processing.workerFailure,visibility:document.visibilityState,hidden:document.hidden,documentFocused:document.hasFocus()})');
    descriptor.status='passed';
   });
  }
  report.pageErrors=driver.errors||[];report.blockedNetwork=driver.blocked||[];
  eq(report.actualNetworkMutations,0,'No mutation reaches the local server');eq(report.pageErrors,[],'No native browser runtime error');eq(report.clipboardWrites,0,'No clipboard write');
 }catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:String(error.message)});}
 finally{
  try{
   if(browserName==='Safari'&&driver.session){await driver.request('DELETE',`/session/${driver.session}`);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}
   await driver.close();report.ownedBrowserSessionClosed=true;
  }catch(error){report.status='failed';report.ownedBrowserSessionClosed=false;report.failures.push({id:'owned-session-cleanup',message:String(error.message)});try{await driver.close();}catch{}}
  await new Promise(resolve=>server.close(resolve));report.testCount=report.tests.length;
  report.nativeFlows=report.nativeEndpointCases.length;report.primaryNativeClickCount=report.nativeEndpointCases.length;
  report.nativeIdempotenceAssertions=report.nativeEndpointCases.filter(row=>row.idempotenceChecked).length;
  report.status=report.failures.length?'failed':report.status;
  process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
 }
})();
