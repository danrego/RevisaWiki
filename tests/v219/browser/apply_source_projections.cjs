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


report.kind='private-native-approved-source-projection-controls';
(async()=>{try{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
for(const bundle of ['core','complete'])for(const mode of ['doi-proved','doi-no-proof','automatic-spelling'])await test(bundle+'-'+mode,async()=>{
 await load(bundle);const before=mode==='automatic-spelling'?'Esse texto é concerteza literal.':'Texto.<ref>{{Citar periódico|titulo=Obra fictícia|ano=2004|ultimo=Silva|doi=10.1234/obra.}}</ref>\n\n{{Referências}}',expected=mode==='automatic-spelling'?'Esse texto é com certeza literal.':mode==='doi-proved'?before.replace('|doi=10.1234/obra.','|doi=10.1234/obra'):before;
 await read('(()=>{window.RevisaWikiConfig={...RevisaWiki.defaults,autoPreview:false,registryDoiCheck:'+JSON.stringify(mode==='doi-proved')+',automaticSpelling:'+JSON.stringify(mode==='automatic-spelling')+',authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false};__rw219UI.write('+JSON.stringify(before)+');__rw219UI.controlledRegistryReads=[];window.fetch=async(url,options)=>{__rw219UI.controlledRegistryReads.push({url,method:options?.method,credentials:options?.credentials});if(url==="https://api.crossref.org/works/10.1234%2Fobra."||url==="https://api.crossref.org/works/10.1234%2Fobra./agency")return{status:404,json:async()=>({})};if(url==="https://api.crossref.org/works/10.1234%2Fobra")return{status:200,json:async()=>({message:{title:["Obra fictícia"],DOI:"10.1234/obra",published:{"date-parts":[[2004]]},author:[{family:"Silva"}]}})};throw new Error("Consulta externa não prevista no teste controlado");};return true})()');
 await adjust();eq(await read('__rw219UI.read()'),expected,'The real button keeps the exact independently approved DOI or spelling endpoint');
 const observed=await read('(()=>{const result=[...__rw219UI.workerResults].reverse().find(x=>typeof x.result?.text==="string")?.result;return {proof:result?.localCompositionSafety,preservation:result?.preservation,reads:__rw219UI.controlledRegistryReads}})()');eq(observed.preservation,[],'No approved source projection conceals a preservation failure');ok(observed.proof.accepted,'The source-only independently approved projection passes the real Worker composition guard');eq(observed.proof.source,before,'The proof remains bound to the actual original input');eq(observed.proof.candidate,expected,'The proof is bound to the exact transformed candidate');
 if(mode==='doi-proved'){eq(observed.reads.length,3,'Original DOI404, agency404 and corrected metadata200 were all required');ok(observed.reads.every(x=>x.method==='GET'&&x.credentials==='omit'),'Every controlled registry proof request is anonymous read-only');}else eq(observed.reads,[],'No registry proof is silently invented');
 if(before!==expected){await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),before,'Undo restores exact supplied DOI punctuation or spelling');}
});eq(driver.errors||[],[],'No native browser error');eq(report.actualNetworkMutations,0,'No local mutation request');}
catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:error.message});}
finally{try{await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.status='failed';report.failures.push({id:'owned-session-cleanup',message:error.message});}await new Promise(resolve=>server.close(resolve));report.testCount=report.tests.length;console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;}})();
