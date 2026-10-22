'use strict';
// Local native-editor regression. No Wikipedia request or publication is allowed.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),{NativeChrome,NativeFirefox,NativeSafari,delay}=require(root+'/tests/v261/browser/native_driver.cjs');
const [browser='Firefox',snapshotArg,pinsArg,reportArg]=process.argv.slice(2),snapshot=path.resolve(snapshotArg),pinPath=path.resolve(pinsArg),stopPath=process.env.REVISAWIKI_UI_STOP_FILE&&path.resolve(process.env.REVISAWIKI_UI_STOP_FILE);
const sha=v=>crypto.createHash('sha256').update(v).digest('hex'),report={kind:'native-ui-release-qualification-2.20.0',status:'running',browser,cases:[],checks:0,failures:[],WikipediaWrites:0,mutatingHttpRequests:0,screenshots:0,clipboardWrites:0,adaptations:['Only the production host guards accept the read-only loopback fixture.','The existing fictional MediaWiki/source adapters receive circular editor objects before the unmodified product starts.','No production transformation, UI context function, safety check or timer is replaced. Labeled fault controls alter only fixture responses, a real Worker proof field, or the delivery of one Worker dispatch.','Staleness controls hold a real Worker result and replace only the live editor identity before delivery.']};
const bundleDefinitions={};
for(const [label,folder,manifestPath]of [['candidate',snapshot,pinPath]]){
 const manifestBytes=fs.readFileSync(manifestPath),pins=JSON.parse(manifestBytes),stem='RevisaWiki_v'+pins.version.replaceAll('.','_');
 assert.equal(pins.version,'2.20.0','Pinned release version');
 const code={},bindings={};
 for(const[kind,suffix]of [['core','.js'],['complete','_completo.js'],['data','_dados.js']]){
  const file=stem+suffix,bytes=fs.readFileSync(path.join(folder,file)),pin=pins.files[file];assert.equal(sha(bytes),pin.sha256,'Pinned '+label+' '+kind);assert.equal(bytes.length,pin.bytes,'Pinned byte length');code[kind]=bytes.toString();bindings[kind]={file,sha256:sha(bytes),bytes:bytes.length};
 }
 const guardPairs=[
  ["if (host ? host !== 'pt.wikipedia.org' : root.mw.config.get('wgDBname') !== 'ptwiki') return;","if (host ? !['pt.wikipedia.org','127.0.0.1'].includes(host) : root.mw.config.get('wgDBname') !== 'ptwiki') return;"],
  ["if(host?host!=='pt.wikipedia.org':root.mw.config.get('wgDBname')!=='ptwiki')return;","if(host?!['pt.wikipedia.org','127.0.0.1'].includes(host):root.mw.config.get('wgDBname')!=='ptwiki')return;"]
 ];
 for(const kind of ['core','complete']){const pairs=guardPairs.filter(pair=>code[kind].includes(pair[0]));assert.equal(pairs.length,1,'Exactly one accepted entry guard');const[from,to]=pairs[0];assert.equal(code[kind].split(from).length,2,'Exactly one entry guard occurrence');code[kind]=code[kind].replace(from,to);}
 const modulePairs=[
  ["if (!root.mw?.loader || (root.location?.hostname || root.mw.config?.get('wgServerName')) !== 'pt.wikipedia.org') return;","if (!root.mw?.loader || !['pt.wikipedia.org','127.0.0.1'].includes(root.location?.hostname || root.mw.config?.get('wgServerName'))) return;"],
  ["if(!root.mw?.loader||(root.location?.hostname||root.mw.config?.get('wgServerName'))!=='pt.wikipedia.org')return;","if(!root.mw?.loader||!['pt.wikipedia.org','127.0.0.1'].includes(root.location?.hostname||root.mw.config?.get('wgServerName')))return;"]
 ];
 const modulePair=modulePairs.filter(pair=>code.core.includes(pair[0]));assert.equal(modulePair.length,1,'Exactly one modular guard');assert.equal(code.core.split(modulePair[0][0]).length,2,'One modular guard occurrence');code.core=code.core.replace(modulePair[0][0],modulePair[0][1]);
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
async function load(label,bundle,adapter,engine,extra={}){await driver.navigate(origin+'/'+label+'/fixture.html?'+new URLSearchParams({bundle,adapter,scenario:engine==='staged'?'fallback':'normal',reset:'1',...extra}));await wait('window.__rw219UI?.ready&&window.RevisaWiki?.uiStatus==="ready"&&!!document.querySelector(".ajg-run")','ready interface');equal(await read('RevisaWiki.version'),bundleDefinitions[label].version,'The pinned interface starts');check(await read('__rw219UI.cyclicFixture.textareaRoundTrip&&__rw219UI.cyclicFixture.modelRoundTrip'),'The live adapter contains the intended cycle');check(await read('__rw219UI.cycleSerializationFails()'),'Serializing the raw editor really fails');}
async function invariant(){const q=await read('({state:__rw219UI.state(),requests:__rw219UI.requests,policy:__rw219UI.policyViolations})');equal(q.state.errors,[],'No uncaught page errors');equal(q.state.forbiddenActions,[],'No forbidden action');equal(q.state.submits,0,'No form submitted');equal(q.state.saveClicks,0,'No publication button activated');equal(q.state.clipboardWrites,0,'No real clipboard write');equal(q.policy,[],'No content policy violation');check(q.requests.every(r=>['query','parse','paraminfo'].includes(r.parameters.action)),'Only fictional read API calls');}
function save(){if(reportArg)fs.writeFileSync(path.resolve(reportArg),JSON.stringify(report,null,2)+'\n');}
async function test(id,fn){if(report.interruption)return;if(stopPath&&fs.existsSync(stopPath)){report.interruption={status:'stopped-between-flows',nextUnstartedFlow:id,completeRecordedFlows:report.cases.length,stopFilePresent:true};if(report.status==='running')report.status='interrupted';save();return;}const row={id,status:'running'},began=Date.now();report.cases.push(row);save();try{await fn(row);await invariant();row.status='passed';}catch(error){row.status='failed';row.message=String(error.message);try{row.endpoint=await state();}catch{}report.status='failed';report.failures.push({id,message:row.message});}row.milliseconds=Date.now()-began;save();process.stdout.write(JSON.stringify({id,status:row.status,milliseconds:row.milliseconds})+'\n');}
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
async function toggleMinor(){
 if(browser!=='Safari')return click('#wpMinoredit');
 await read('(()=>{const e=document.getElementById("wpMinoredit");e.scrollIntoView({block:"center"});e.focus();return true})()');
 const found=await driver.request('POST','/session/'+driver.session+'/element',{using:'css selector',value:'#wpMinoredit'}),id=found['element-6066-11e4-a52e-4f735466cecf'];
 await driver.request('POST','/session/'+driver.session+'/element/'+id+'/value',{text:'\uE00D',value:['\uE00D']});await driver.request('DELETE','/session/'+driver.session+'/actions');
}
async function adjust(){await click('.ajg-run');await wait('document.querySelector(".ajg-run")?.dataset.codeChecked==="true"','accepted adjustment');await settled();}
async function beginHeld(bundle,adapter,engine){
 await load('candidate',bundle,adapter,engine,engine==='staged'?{scenario:'fallback-self-message-held'}:{});
 if(engine==='worker')await read(holdWorker);
 await click('.ajg-run');
 await wait(engine==='worker'?'typeof __rw219UI.releaseHeldResult==="function"':'__rw219UI.pendingSelfMessages.length>0&&RevisaWiki.processing.active','controlled executor hold');
}
async function releaseHeld(engine){return read(engine==='worker'?'(()=>{__rw219UI.releaseHeldResult();return true})()':'__rw219UI.releaseSelfMessages()');}
async function manualDuring(bundle,adapter,engine,row){
 await beginHeld(bundle,adapter,engine);row.before=await state();
 const newer=source+'\nTexto novo preservado durante a análise.';
 await read('(()=>{__rw219UI.write('+JSON.stringify(newer)+');__rw219UI.setSummary("Resumo manual durante a análise.");return true})()');
 await releaseHeld(engine);await settled();row.after=await state();equal(row.after.source,newer,'Every intervening manual source byte survives the stale calculation');equal(row.after.summary,'Resumo manual durante a análise.','The independently edited summary remains exact');equal(row.after.minor,row.before.minor,'A stale action does not alter minor');equal(row.after.undoDisabled,true,'The stale action does not create a false Undo transaction');
 await read('(()=>{__rw219UI.write(__rw219UI.read()+" Edição retomada.");return true})()');check((await state()).source.endsWith(' Edição retomada.'),'Manual editing remains possible after stale-source refusal');
}
async function mixedDraft(bundle,adapter,engine,row){
 await load('candidate',bundle,adapter,engine);const before=source+'\nTexto manual anterior.';await read('(()=>{__rw219UI.write('+JSON.stringify(before)+');__rw219UI.setSummary("Resumo escolhido pelo editor.");return true})()');row.before=await state();await adjust();row.after=await state();equal(row.after.source,expected+'\nTexto manual anterior.','Local repairs retain a mixed manual/tool draft');check(row.after.summary.startsWith('Resumo escolhido pelo editor.'),'The supplied summary stays present');equal(row.after.minor,false,'The mixed manual/tool draft is not claimed as tool-only');await click('.ajg-undo');await settled();row.undo=await state();equal(row.undo.source,before,'Undo restores the full mixed input');equal(row.undo.summary,row.before.summary,'Undo retains the editor-owned summary');equal(row.undo.minor,false,'Undo preserves the original minor choice');
}
async function cancelled(bundle,engine,row){
 await beginHeld(bundle,'classic',engine);row.before=await state();await click('.ajg-stop');await settled();row.after=await state();equal(row.after.source,source,'Cancellation leaves the original complete source');equal(row.after.summary,'','Cancellation leaves the summary empty');equal(row.after.minor,false,'Cancellation does not claim a minor edit');equal(row.after.undoDisabled,true,'Cancellation does not add Undo');await read('(()=>{__rw219UI.write(__rw219UI.read()+" Após cancelar.");return true})()');check((await state()).source.endsWith(' Após cancelar.'),'The editor remains usable after cancellation');
}
async function previewControl(bundle,mode,row){
 await load('candidate',bundle,'classic','worker',{scenario:mode,preview:'1'});row.before=await state();await click('.ajg-run');await settled();row.after=await state();
 const refusal=mode==='preview-new-error';equal(row.after.source,refusal?source:expected,refusal?'An introduced preview error rolls back the entire source':'A failed read-only preview retains the locally verified edit');equal(row.after.minor,!refusal,'Minor ownership follows the accepted edit');if(refusal){equal(row.after.summary,'','A rolled-back result does not claim a summary');equal(row.after.undoDisabled,true,'A rolled-back edit has no Undo transaction');}else{check(row.after.summary.length>0,'The accepted local edit receives its summary');await click('.ajg-undo');await settled();equal((await state()).source,source,'Undo restores the source after a failed external check');}
 check(await read('__rw219UI.requests.some(r=>r.parameters.action==="parse")'),'The controlled preview path was actually requested');
}
async function missingProof(bundle,row){
 await load('candidate',bundle,'classic','worker');
 await read(`(()=>{const qa=__rw219UI,Base=window.Worker;qa.missingProofInjected=false;window.Worker=class extends Base{constructor(...args){super(...args);this.addEventListener('message',event=>{if(event.data?.type!=='result'||qa.missingProofInjected)return;qa.missingProofInjected=true;delete event.data.result.localCompositionSafety;});}};return true})()`);
 row.before=await state();await click('.ajg-run');await wait('__rw219UI.missingProofInjected','a real Worker response reaches the controlled final-proof boundary');await settled();row.after=await state();equal(row.after.source,source,'A result without its complete preservation proof is not applied');equal(row.after.summary,'','No summary is claimed for an unproved result');equal(row.after.minor,false,'No minor flag is claimed for an unproved result');equal(row.after.undoDisabled,true,'No unproved result creates Undo');await read('(()=>{__rw219UI.write(__rw219UI.read()+" Rascunho utilizável.");return true})()');check((await state()).source.endsWith(' Rascunho utilizável.'),'Safe refusal preserves normal editing');
}
const silentWorker=`(()=>{const qa=__rw219UI,Base=window.Worker;qa.silentOnce=false;qa.silentDispatchAt=null;window.Worker=class extends Base{postMessage(message,...rest){if(message?.type==='calculate'&&!qa.silentOnce){qa.silentOnce=true;qa.silentDispatchAt=performance.now();return;}return super.postMessage(message,...rest);}};return true})()`;
async function actualDeadline(bundle,row){
 await load('candidate',bundle,'classic','worker');
 const original=source+'\n\n<math>E=mc^2</math>\n\n{| class="wikitable"\n! Grandeza !! Valor\n|-\n| Energia || 4 J\n|}\n\nTexto.<ref name="fonte">Fonte literal.</ref>\n{{Referências}}';
 await read('(()=>{__rw219UI.write('+JSON.stringify(original)+');__rw219UI.setSummary("Resumo manual preservado no limite.");return true})()');await toggleMinor();await read(silentWorker);row.before=await state();equal(row.before.minor,true,'The original user-owned minor checkbox is explicitly selected');
 await click('.ajg-run');await wait('__rw219UI.silentOnce===true','the first real Worker dispatch is deliberately unanswered');row.phase='awaiting-unchanged-sixty-second-deadline';save();
 await wait('!RevisaWiki.processing?.active&&!document.querySelector(".ajg-run").disabled','the unchanged real sixty-second production timeout',67000);await settled();
 row.elapsedFromDispatchMilliseconds=await read('performance.now()-__rw219UI.silentDispatchAt');row.after=await state();check(row.elapsedFromDispatchMilliseconds>=59500&&row.elapsedFromDispatchMilliseconds<67000,'The actual production deadline remains sixty seconds');equal(row.after.source,row.before.source,'Timeout preserves every byte of the complete draft');equal(row.after.summary,row.before.summary,'Timeout preserves every byte of the manual summary');equal(row.after.minor,row.before.minor,'Timeout preserves the exact user minor state');equal(row.after.undoDisabled,true,'Timeout cannot create an unperformed Undo transaction');equal(row.after.workerResults,0,'The silent worker cannot fabricate a result or trigger unsafe synchronous application');
 const resumed=original+'\nTexto manual depois do limite.';await read('(()=>{__rw219UI.write('+JSON.stringify(resumed)+');return true})()');equal((await state()).source,resumed,'The editor accepts normal manual changes after timeout');
 await adjust();row.retry=await state();check(row.retry.source.includes('[[Brasil]]'),'A fresh real Worker can revise the current draft after timeout');check(row.retry.source.includes('<math>E=mc^2</math>')&&row.retry.source.includes('4 J')&&row.retry.source.endsWith('Texto manual depois do limite.'),'Retry retains formulas, units and the newly typed text');check(row.retry.summary.startsWith(row.before.summary),'Retry retains the editor-owned summary before any tool suffix');equal(row.retry.minor,true,'Retry preserves the editor-owned minor choice');await click('.ajg-undo');await settled();row.undo=await state();equal(row.undo.source,resumed,'Undo restores the exact resumed input');equal(row.undo.summary,row.before.summary,'Undo retains the original manual summary after timeout');equal(row.undo.minor,true,'Undo retains the original user-owned minor flag after timeout');
}
(async()=>{try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
 report.productionTimeoutMilliseconds=60000;report.timeoutChanged=false;report.knownExtremeTimeoutSourcesRepeated=false;report.deadlineControl='Exactly the first real calculate dispatch is left unanswered. No product timer, safety proof, transformation or response is replaced.';
 for(const bundle of ['core','complete']){
  for(const adapter of ['classic','codemirror','2017'])for(const engine of ['worker','staged'])await test(bundle+'-cyclic-'+adapter+'-'+engine,row=>positive(bundle,adapter,engine,row));
  await test(bundle+'-bottom-green-control',row=>positive(bundle,'classic','worker',row,'#revisawiki-adjust-before-publish'));
  for(const adapter of ['classic','codemirror','2017']){
   await test(bundle+'-stale-editor-'+adapter,row=>stale(bundle,adapter,row));
   for(const engine of ['worker','staged'])await test(bundle+'-manual-during-'+adapter+'-'+engine,row=>manualDuring(bundle,adapter,engine,row));
  }
  for(const adapter of ['classic','2017'])for(const engine of ['worker','staged'])await test(bundle+'-mixed-draft-'+adapter+'-'+engine,row=>mixedDraft(bundle,adapter,engine,row));
  for(const engine of ['worker','staged'])await test(bundle+'-cancel-'+engine,row=>cancelled(bundle,engine,row));
  for(const mode of ['preview-failure','preview-new-error'])await test(bundle+'-'+mode,row=>previewControl(bundle,mode,row));
  await test(bundle+'-missing-preservation-proof',row=>missingProof(bundle,row));
  await test(bundle+'-unchanged-source',async row=>{await load('candidate',bundle,'classic','worker');await read('__rw219UI.write('+JSON.stringify(expected)+')');row.before=await state();await adjust();row.after=await state();equal(row.after.source,expected,'An already correct source remains exact');equal(row.after.summary,'','No automatic summary claims an unapplied change');equal(row.after.minor,false,'A no-op cannot claim a new minor edit');equal(row.after.undoDisabled,true,'A no-op has no Undo transaction');});
  await test(bundle+'-real-sixty-second-worker-deadline',row=>actualDeadline(bundle,row));
 }
 equal(driver.errors||[],[],'No native browser runtime errors');equal(report.mutatingHttpRequests,0,'The local server received no mutation');report.blockedRequests=driver.blocked||[];equal(report.blockedRequests,[],'Every browser request remained on loopback');if(report.status==='running')report.status='passed';
}catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:String(error.message)});}finally{
 try{if(browser==='Safari'&&driver.session){await driver.request('DELETE','/session/'+driver.session);driver.session=null;report.ownedSessionDeletionAcknowledged=true;}await driver.close();report.ownedSessionClosed=true;}catch(error){report.status='failed';report.failures.push({id:'owned-session-cleanup',message:String(error.message)});}
 server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));report.testCount=report.cases.length;save();process.stdout.write(JSON.stringify({status:report.status,browser,cases:report.testCount,checks:report.checks,failures:report.failures})+'\n');if(report.status!=='passed')process.exitCode=1;
}})();
