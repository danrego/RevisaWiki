'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {NativeChrome,NativeFirefox,NativeSafari,delay}=require("../../v261/browser/native_driver.cjs");
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
const report={kind:'additional-all-predecessor-native-button-endpoints',version:'2.19.0',status:'passed',browser:browserName,pinManifestSha256:sha(fs.readFileSync(pinPath)),bindings,talkCatalogContractSha256:sha(fs.readFileSync(talkCatalogPath)),talkCatalogBindings:talkCatalog.rows.length,runnerSha256:sha(fs.readFileSync(__filename)),fixtureHtmlSha256:sha(fs.readFileSync(path.join(__dirname,'current_fixture.html'))),fixtureScriptSha256:sha(fs.readFileSync(path.join(__dirname,'current_fixture.js'))),adaptations:['Only exact ptwiki host guards accept the isolated127.0.0.1origin. No transformation or interface function is replaced.','Native installed browsers execute real production worker or staged engines.','MediaWiki API, CodeMirror textSelection registration and source2017 model contracts are explicitly fictional local adapters. These tests do not claim a production MediaWiki server or real CodeMirror/VisualEditor package deployment.','All requests are local read-only fixtures. Form submissions, account actions, cross-origin network access, clipboard writes and screenshots are blocked.','Current Mostrar alterações uses the native editor wpDiff button. Historical inline comparison and selection controls are not expected.'],tests:[],checks:0,failures:[],optionKeys:[],actualWikipediaWrites:0,actualNetworkMutations:0,screenshots:0,serverRequests:[],pageErrors:[],blockedNetwork:[],clipboardWrites:0};
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
report.controlledEvidenceBoundary='Fault-injection cases modify real Worker response metadata only. Positive endpoints are preauthored; mocked API/registry responses are local fixtures, not live service evidence. Production transformation functions and editor handlers are unchanged.';
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
const initial='Texto sobre [[Brasil|Brasil]], [[Portugal|Portugal]] e [[França|França]].',expected='Texto sobre [[Brasil]], [[Portugal]] e [[França]].';


report.kind='private-native-worker-to-editor-preservation-gate';report.proofNature='Controlled mutation of a real production Worker response exercises the final editor boundary; it is not evidence that the producer normally emits these artificial findings.';
const modes=process.env.RW_APPLY_BASELINE==='1'?['lost-reference-binding','lost-native-reference-bank','lost-source-reference-collector','future-preservation-violation']:
 ['lost-url','lost-reference-binding','lost-native-reference-bank','lost-source-reference-collector','future-preservation-violation','missing-proof','wrong-source','wrong-candidate','wrong-options','wrong-context','failed-proof','missing-preservation','editorial-control','settings-held','staged-positive'];
const before='Texto sobre [[Brasil|Brasil]].',after='Texto sobre [[Brasil]].';
const install=mode=>'(()=>{const qa=window.__rw219UI;qa.applyMode='+JSON.stringify(mode)+';qa.applyInjected=false;qa.applyProofBefore=null;qa.applyRelease=null;const Base=window.Worker;window.Worker=class extends Base{constructor(...args){super(...args);this.addEventListener("message",event=>{const r=event.data?.result;if(event.data?.type!=="result"||!r||typeof r.text!=="string"||qa.applyInjected)return;qa.applyInjected=true;qa.applyProofBefore=structuredClone(r.localCompositionSafety||null);const mode=qa.applyMode;if(mode.startsWith("lost-")||mode.startsWith("future-"))r.preservation=[{code:mode,severity:"warning",message:"Falha de retenção fictícia controlada."}];else if(mode==="missing-proof")delete r.localCompositionSafety;else if(mode==="wrong-source")r.localCompositionSafety.source+="X";else if(mode==="wrong-candidate")r.localCompositionSafety.candidate+="X";else if(mode==="wrong-options")r.localCompositionSafety.optionsSnapshot+="X";else if(mode==="wrong-context")r.localCompositionSafety.contextSnapshot+="X";else if(mode==="failed-proof"){r.localCompositionSafety.accepted=false;r.localCompositionSafety.reason="Associação fictícia não confirmada.";}else if(mode==="missing-preservation")delete r.preservation;else if(mode==="editorial-control"){r.warnings.push("Aviso editorial fictício já existente.");r.localReports={...r.localReports,references:[{code:"editorial-review",severity:"warning",message:"Conferência editorial."}]};}else if(mode==="settings-held"){event.stopImmediatePropagation();qa.applyRelease=()=>{qa.applyRelease=null;this.dispatchEvent(new MessageEvent("message",{data:event.data}));};}});}};return true})()';
(async()=>{try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
 for(const bundle of ['core','complete'])for(const mode of modes)await test(bundle+'-apply-'+mode,async()=>{
  await load(bundle,mode==='staged-positive'?'fallback':'normal');
  await read('(()=>{window.RevisaWikiConfig={...RevisaWiki.defaults,autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false};__rw219UI.write('+JSON.stringify(before)+');return true})()');
  if(mode!=='staged-positive')await read(install(mode));
  await click('.ajg-run');
  if(mode==='settings-held'){
   await waitFor('__rw219UI.applyInjected&&typeof __rw219UI.applyRelease==="function"','held real Worker response');
   const controls=await read('[...document.querySelectorAll(".ajg-settings input,.ajg-settings select")].map(e=>({option:e.dataset.option,disabled:e.disabled}))');
   ok(controls.length>0,'Actual preference controls exist while a result is pending');ok(controls.every(e=>e.disabled),'Every actual option control is disabled during the active task');
   eq(await read('__rw219UI.read()'),before,'No text is applied before real Worker response delivery');
   await read('(()=>{__rw219UI.applyRelease();return true})()');
  }
  if(mode!=='staged-positive')await waitFor('__rw219UI.applyInjected===true','actual production Worker result observed');
  await settled();
  const actual=await read('__rw219UI.read()'),positive=['editorial-control','settings-held','staged-positive'].includes(mode);
  eq(actual,positive?after:before,positive?'Verified result remains reachable despite editorial reports or the supported staged executor':'A failed or unbound preservation obligation leaves every source byte unchanged');
  const state=await read('({summary:__rw219UI.summary(),minor:document.getElementById("wpMinoredit").checked,status:document.querySelector(".ajg-status").textContent,undoDisabled:document.querySelector(".ajg-undo").disabled,engine:RevisaWiki.processing.engine,proof:__rw219UI.applyProofBefore})');
  if(positive){ok(state.summary.length>0,'Only the accepted edit receives the automatic summary');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),before,'Native Undo restores accepted source exactly');}
  else{eq(state.summary,'','Rejected automatic edit cannot own the summary');eq(state.minor,false,'Rejected automatic edit cannot set minor');eq(state.undoDisabled,true,'No rejected edit creates a false Undo entry');ok(/preserva|confirm|mantido|aplicad|recusad/i.test(state.status),'A compact status explains that no unverified source was applied');}
  if(mode==='staged-positive')eq(state.engine,'staged','Actual staged engine emits the same bound safety verdict');
  report.applyCases??=[];report.applyCases.push({bundle,mode,sourceSha256:sha(before),expectedSha256:sha(positive?after:before),actualSha256:sha(actual),status:'passed'});
 });
 report.pageErrors=driver.errors||[];report.blockedNetwork=driver.blocked||[];eq(report.pageErrors,[],'No browser errors');eq(report.actualNetworkMutations,0,'No local mutation request');
}catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:error.message});}
finally{try{if(browserName==='Safari'&&driver.session){await driver.request('DELETE',`/session/${driver.session}`);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.status='failed';report.ownedBrowserSessionClosed=false;report.failures.push({id:'owned-session-cleanup',message:error.message});}await new Promise(resolve=>server.close(resolve));report.testCount=report.tests.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;}})();
