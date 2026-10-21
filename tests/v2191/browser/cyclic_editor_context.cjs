'use strict';
// Local native-editor regression. No Wikipedia request or publication is allowed.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),{NativeChrome,NativeFirefox,NativeSafari,delay}=require(root+'/tests/v261/browser/native_driver.cjs');
const [browser='Firefox',snapshotArg,pinsArg,baselineArg,baselinePinsArg,reportArg]=process.argv.slice(2),snapshot=path.resolve(snapshotArg),pinPath=path.resolve(pinsArg),baseline=path.resolve(baselineArg),baselinePinPath=path.resolve(baselinePinsArg);
const sha=v=>crypto.createHash('sha256').update(v).digest('hex'),report={kind:'native-cyclic-editor-context-regression',status:'running',browser,cases:[],checks:0,failures:[],WikipediaWrites:0,mutatingHttpRequests:0,screenshots:0,clipboardWrites:0,adaptations:['Only the production host guards accept the read-only loopback fixture.','The existing fictional MediaWiki/source adapters receive circular editor objects before the unmodified product starts.','No transformation, UI context function, safety check, Worker result or timeout is replaced.','Staleness controls hold a real Worker result and replace only the live editor identity before delivery.']};
const bundleDefinitions={};
for(const [label,folder,manifestPath]of [['candidate',snapshot,pinPath],['baseline',baseline,baselinePinPath]]){
 const manifestBytes=fs.readFileSync(manifestPath),pins=JSON.parse(manifestBytes),stem='RevisaWiki_v'+pins.version.replaceAll('.','_');
 assert(/^2\.19\.[01]$/.test(pins.version),'Pinned release version');
 const code={},bindings={};
 for(const[kind,suffix]of [['core','.js'],['complete','_completo.js'],['data','_dados.js']]){
  const file=stem+suffix,bytes=fs.readFileSync(path.join(folder,file)),pin=pins.files[file];assert.equal(sha(bytes),pin.sha256,'Pinned '+label+' '+kind);assert.equal(bytes.length,pin.bytes,'Pinned byte length');code[kind]=bytes.toString();bindings[kind]={file,sha256:sha(bytes),bytes:bytes.length};
 }
 const guard="if (host ? host !== 'pt.wikipedia.org' : root.mw.config.get('wgDBname') !== 'ptwiki') return;",moduleGuard="if (!root.mw?.loader || (root.location?.hostname || root.mw.config?.get('wgServerName')) !== 'pt.wikipedia.org') return;";
 for(const kind of ['core','complete']){assert.equal(code[kind].split(guard).length,2,'Exactly one entry guard');code[kind]=code[kind].replace(guard,"if (host ? !['pt.wikipedia.org','127.0.0.1'].includes(host) : root.mw.config.get('wgDBname') !== 'ptwiki') return;");}
 assert.equal(code.core.split(moduleGuard).length,2,'Exactly one modular guard');code.core=code.core.replace(moduleGuard,"if (!root.mw?.loader || !['pt.wikipedia.org','127.0.0.1'].includes(root.location?.hostname || root.mw.config?.get('wgServerName'))) return;");
 bundleDefinitions[label]={version:pins.version,code};report[label]={version:pins.version,manifestSha256:sha(manifestBytes),bindings};
}
const fixtureDir=path.join(root,'tests/v219/browser'),nativeDir=path.join(root,'tests/v261/browser'),fixtureHtml=fs.readFileSync(path.join(fixtureDir,'current_fixture.html'),'utf8'),fixtureJS=fs.readFileSync(path.join(fixtureDir,'current_fixture.js'),'utf8');
report.runnerSha256=sha(fs.readFileSync(__filename));report.fixtureHtmlSha256=sha(fixtureHtml);report.fixtureScriptSha256=sha(fixtureJS);
const cycleFixture=`
(()=>{
 const qa=__rw219UI,element=document.getElementById('wpTextbox1'),data={element};data.self=data;
 jQuery(element).data('cyclicEditor',data);
 const model=qa.veTarget?.getSurface().getModel();if(model){model.self=model;model.fixtureElement=element;}
 qa.cyclicFixture={textareaRoundTrip:jQuery(element).data('cyclicEditor').element===element,modelRoundTrip:!model||model.self===model};
 qa.cycleSerializationFails=()=>{try{JSON.stringify(model||element);return false;}catch(error){qa.cycleSerializationMessage=String(error.message);return true;}};
})();
`;
report.cyclicFixtureSha256=sha(cycleFixture);
const server=http.createServer((req,res)=>{
 if(req.method!=='GET'){report.mutatingHttpRequests++;res.writeHead(403).end('Read only');return;}
 const url=new URL(req.url,'http://localhost'),parts=url.pathname.split('/').filter(Boolean),label=parts[0],name=parts[1],definitions=bundleDefinitions[label];
 res.setHeader('Content-Security-Policy',"default-src 'none';script-src 'self' 'unsafe-eval';style-src 'self' 'unsafe-inline';connect-src 'self';worker-src blob:;img-src 'self' data:;form-action 'none';base-uri 'none'");res.setHeader('Cache-Control','no-store');
 if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return;}
 if(!definitions){res.writeHead(404).end('Not found');return;}
 if(name==='fixture.html'){
  const base='/'+label+'/',bundle=url.searchParams.get('bundle')||'core',production=bundle==='core'?'<script src="'+base+'data.js"></script><script src="'+base+'core.js"></script>':'<script src="'+base+'complete.js"></script>';
  res.setHeader('Content-Type','text/html;charset=utf-8');res.end(fixtureHtml.replaceAll('src="/','src="'+base).replace('<!-- PRODUCTION_SCRIPTS -->',production));return;
 }
 const resource=name==='current_fixture.js'?fixtureJS+cycleFixture:name==='jquery.js'||name==='textSelection.js'?fs.readFileSync(path.join(nativeDir,name)):definitions.code[name?.replace('.js','')];
 if(resource===undefined){res.writeHead(404).end('Not found');return;}res.setHeader('Content-Type','application/javascript;charset=utf-8');res.end(resource);
});
const Driver={Chrome:NativeChrome,Firefox:NativeFirefox,Safari:NativeSafari}[browser];assert(Driver,'Known native browser');const driver=new Driver();
if(browser==='Firefox')driver.click=selector=>require(root+'/tests/v219/browser/stable_native_pointer_click.cjs')(driver,selector,(report.stableNativeClicks??=[]));
const equal=(actual,expected,message)=>{report.checks++;assert.deepEqual(actual,expected,message);},check=(value,message)=>{report.checks++;assert(value,message);},read=async expression=>{const value=await driver.evaluate('(async()=>JSON.stringify(await('+expression+')))()');return typeof value==='string'?JSON.parse(value):value;};
async function wait(expression,label,timeout=15000){const began=Date.now();while(Date.now()-began<timeout){if(await read(expression))return;await delay(70);}throw new Error('Timeout: '+label);}
async function click(selector){await driver.click(selector);if(browser==='Safari')await driver.request('DELETE','/session/'+driver.session+'/actions');}
async function settled(){await wait('document.querySelector("#revisawiki-ptwiki")?.getAttribute("aria-busy")!=="true"&&!RevisaWiki.processing?.active&&!/^Contando ajustes/.test(document.querySelector(".ajg-result-count")?.textContent||"")','settled editor');}
async function state(){return read('({source:__rw219UI.read(),summary:__rw219UI.summary(),minor:document.getElementById("wpMinoredit").checked,status:document.querySelector(".ajg-status")?.textContent,checked:document.querySelector(".ajg-run")?.dataset.codeChecked,undoDisabled:document.querySelector(".ajg-undo")?.disabled,workerStarts:__rw219UI.workerStarts,workerResults:__rw219UI.workerResults.length,engine:RevisaWiki.processing?.engine})');}
let origin;
async function load(label,bundle,adapter,engine){await driver.navigate(origin+'/'+label+'/fixture.html?'+new URLSearchParams({bundle,adapter,scenario:engine==='staged'?'fallback':'normal',reset:'1'}));await wait('window.__rw219UI?.ready&&window.RevisaWiki?.uiStatus==="ready"&&!!document.querySelector(".ajg-run")','ready interface');equal(await read('RevisaWiki.version'),bundleDefinitions[label].version,'The pinned interface starts');check(await read('__rw219UI.cyclicFixture.textareaRoundTrip&&__rw219UI.cyclicFixture.modelRoundTrip'),'The live adapter contains the intended cycle');check(await read('__rw219UI.cycleSerializationFails()'),'Serializing the raw editor really fails');}
async function invariant(){const q=await read('({state:__rw219UI.state(),requests:__rw219UI.requests,policy:__rw219UI.policyViolations})');equal(q.state.errors,[],'No uncaught page errors');equal(q.state.forbiddenActions,[],'No forbidden action');equal(q.state.submits,0,'No form submitted');equal(q.state.saveClicks,0,'No publication button activated');equal(q.state.clipboardWrites,0,'No real clipboard write');equal(q.policy,[],'No content policy violation');check(q.requests.every(r=>['query','parse','paraminfo'].includes(r.parameters.action)),'Only fictional read API calls');}
function save(){if(reportArg)fs.writeFileSync(path.resolve(reportArg),JSON.stringify(report,null,2)+'\n');}
async function test(id,fn){const row={id,status:'running'},began=Date.now();report.cases.push(row);try{await fn(row);await invariant();row.status='passed';}catch(error){row.status='failed';row.message=String(error.message);try{row.endpoint=await state();}catch{}report.status='failed';report.failures.push({id,message:row.message});}row.milliseconds=Date.now()-began;save();process.stdout.write(JSON.stringify({id,status:row.status,milliseconds:row.milliseconds})+'\n');}
const source='Texto sobre [[Brasil|Brasil]], [[Portugal|Portugal]] e [[França|França]].',expected='Texto sobre [[Brasil]], [[Portugal]] e [[França]].';
async function positive(bundle,adapter,engine,row,button='.ajg-run'){
 await load('candidate',bundle,adapter,engine);row.before=await state();await click(button);await wait('document.querySelector(".ajg-run")?.dataset.codeChecked==="true"','accepted automatic adjustment');await settled();row.first=await state();
 equal(row.first.source,expected,'The real product applies every intended correction');check(row.first.summary.length>0,'Automatic summary is generated');equal(row.first.minor,true,'Tool-only revision is marked minor');equal(row.first.undoDisabled,false,'A real Undo transaction exists');equal(row.first.engine,engine,'The actual selected executor completes');
 await click('.ajg-run');await settled();row.second=await state();equal(row.second.source,expected,'A repeated action preserves the exact endpoint');equal(row.second.summary,row.first.summary,'Repeated action does not duplicate the summary');equal(row.second.minor,true,'Repeated action retains minor ownership');
 await click('.ajg-undo');await settled();row.undo=await state();equal(row.undo.source,source,'Undo restores the entire original source');equal(row.undo.summary,'','Undo restores the original summary');equal(row.undo.minor,false,'Undo restores the original minor choice');equal(row.undo.undoDisabled,true,'Undo consumes the transaction');
 await read('(()=>{__rw219UI.write(__rw219UI.read()+" Texto manual.");return true})()');check((await state()).source.endsWith(' Texto manual.'),'Manual editing remains usable after Undo');
}
const holdWorker=`(()=>{const qa=__rw219UI,Base=window.Worker;qa.heldResult=null;qa.cyclicHeldOnce=false;window.Worker=class extends Base{constructor(...args){super(...args);this.addEventListener('message',event=>{if(event.data?.type!=='result'||qa.cyclicHeldOnce)return;qa.cyclicHeldOnce=true;event.stopImmediatePropagation();qa.heldResult=event.data;qa.releaseHeldResult=()=>{const data=qa.heldResult;qa.heldResult=null;qa.releaseHeldResult=null;this.dispatchEvent(new MessageEvent('message',{data}));};});}};return true})()`;
async function stale(bundle,adapter,row){
 await load('candidate',bundle,adapter,'worker');await read(holdWorker);await click('.ajg-run');await wait('typeof __rw219UI.releaseHeldResult==="function"','real result held before editor application');
 row.held=await state();equal(row.held.source,source,'No source was applied while the Worker result is held');
 await read(`(()=>{const qa=__rw219UI;if(qa.adapter==='2017'){const surface=qa.veTarget.getSurface(),original=surface.getModel(),replacement=Object.create(original);replacement.self=replacement;surface.getModel=()=>replacement;}else{const old=document.getElementById('wpTextbox1'),replacement=jQuery(old).clone(true,true)[0];replacement.value=old.value;old.replaceWith(replacement);}qa.releaseHeldResult();return true})()`);
 await settled();row.after=await state();equal(row.after.source,source,'A changed live editor identity refuses the stale result');equal(row.after.summary,'','A stale result cannot own the summary');equal(row.after.minor,false,'A stale result cannot alter the minor checkbox');equal(row.after.undoDisabled,true,'A stale result cannot create an Undo record');
 await read('(()=>{__rw219UI.write(__rw219UI.read()+" Texto manual preservado.");return true})()');check((await state()).source.endsWith(' Texto manual preservado.'),'Normal editing survives safe stale-result refusal');
}
(async()=>{try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
 for(const bundle of ['core','complete'])for(const adapter of ['classic','codemirror','2017'])for(const engine of ['worker','staged']){
  await test('baseline-'+bundle+'-'+adapter+'-'+engine,async row=>{await load('baseline',bundle,adapter,engine);row.before=await state();await click('.ajg-run');await settled();row.after=await state();equal(row.after.source,source,'The defective baseline leaves source unchanged');equal(row.after.summary,'','The failed action leaves summary unchanged');equal(row.after.minor,false,'The failed action leaves minor unchanged');equal(row.after.undoDisabled,true,'The failed action cannot create Undo');check(/cyclic|circular|serialize/i.test(row.after.status),'The known circular serialization error is reproduced');});
  await test('candidate-'+bundle+'-'+adapter+'-'+engine,row=>positive(bundle,adapter,engine,row));
 }
 for(const bundle of ['core','complete'])await test('candidate-bottom-button-'+bundle,row=>positive(bundle,'classic','worker',row,'#revisawiki-adjust-before-publish'));
 for(const bundle of ['core','complete'])for(const adapter of ['classic','codemirror','2017'])await test('candidate-stale-editor-'+bundle+'-'+adapter,row=>stale(bundle,adapter,row));
 equal(driver.errors||[],[],'No native browser runtime errors');equal(report.mutatingHttpRequests,0,'The local server received no mutation');report.blockedRequests=driver.blocked||[];equal(report.blockedRequests,[],'Every request remained on loopback');if(report.status==='running')report.status='passed';
}catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:String(error.message)});}finally{
 try{if(browser==='Safari'&&driver.session){await driver.request('DELETE','/session/'+driver.session);driver.session=null;report.ownedSessionDeletionAcknowledged=true;}await driver.close();report.ownedSessionClosed=true;}catch(error){report.status='failed';report.failures.push({id:'owned-session-cleanup',message:String(error.message)});}
 server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));report.testCount=report.cases.length;save();process.stdout.write(JSON.stringify({status:report.status,browser,cases:report.testCount,checks:report.checks,failures:report.failures})+'\n');if(report.status!=='passed')process.exitCode=1;
}})();
