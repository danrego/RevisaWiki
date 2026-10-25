'use strict';
// The installed browsers use the real release bundles. Only the existing
// fictional editor/API adapter and exact loopback-host guards are adapted.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const currentPath=path.resolve(__dirname,'../v219/browser/current_ui.cjs'),current=fs.readFileSync(currentPath,'utf8'),anchor='(async()=>{\n try{\n  report.caseFilter=';
if(current.split(anchor).length!==2)throw Error('The native harness entry point changed');
let prefix=current.slice(0,current.indexOf(anchor)).replaceAll('2.19.0','2.21.1').replaceAll('2_19_0','2_21_1').replaceAll('expected_release_v2190.json','expected_release_v2211.json');
const hostStart=prefix.indexOf('const guard='),hostEnd=prefix.indexOf('const talkCatalogPath=',hostStart);
if(hostStart<0||hostEnd<0)throw Error('The exact host boundary changed');
prefix=prefix.slice(0,hostStart)+String.raw`
const guards=[
 ["if (host ? host !== 'pt.wikipedia.org' : root.mw.config.get('wgDBname') !== 'ptwiki') return;","if (host ? !['pt.wikipedia.org','127.0.0.1'].includes(host) : root.mw.config.get('wgDBname') !== 'ptwiki') return;"],
 ["if(host?host!=='pt.wikipedia.org':root.mw.config.get('wgDBname')!=='ptwiki')return;","if(host?!['pt.wikipedia.org','127.0.0.1'].includes(host):root.mw.config.get('wgDBname')!=='ptwiki')return;"]
];
for(const kind of ['core','complete']){const pairs=guards.filter(p=>scripts[kind].includes(p[0]));assert.equal(pairs.length,1);const[a,b]=pairs[0];assert.equal(scripts[kind].split(a).length,2);scripts[kind]=scripts[kind].replace(a,b);}
const modules=[
 ["if (!root.mw?.loader || (root.location?.hostname || root.mw.config?.get('wgServerName')) !== 'pt.wikipedia.org') return;","if (!root.mw?.loader || !['pt.wikipedia.org','127.0.0.1'].includes(root.location?.hostname || root.mw.config?.get('wgServerName'))) return;"],
 ["if(!root.mw?.loader||(root.location?.hostname||root.mw.config?.get('wgServerName'))!=='pt.wikipedia.org')return;","if(!root.mw?.loader||!['pt.wikipedia.org','127.0.0.1'].includes(root.location?.hostname||root.mw.config?.get('wgServerName')))return;"]
];
const pair=modules.filter(p=>scripts.core.includes(p[0]));assert.equal(pair.length,1);assert.equal(scripts.core.split(pair[0][0]).length,2);scripts.core=scripts.core.replace(pair[0][0],pair[0][1]);
`+prefix.slice(hostEnd);
const body=String.raw`
report.kind='native-browser-short-endmatter-columns-hotfix';report.version='2.21.1';
report.originalHarnessSha256=sha(fs.readFileSync(${JSON.stringify(currentPath)}));report.runnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
report.scope='Actual editor actions, real Worker and staged executors, eight root items, exact source/undo and option ownership. The optional Chrome 60-second case holds a completed Worker response in the fictional transport; it is not an extreme-article calculation.';
const fixtureAnchor="const source=sources[scenario]||sources.normal,qa=",fixtureReplacement="const source=params.has('columnSource')?JSON.parse(params.get('columnSource')):sources[scenario]||sources.normal,qa=";
assert.equal(fixtureScript.toString().split(fixtureAnchor).length,2);
let adaptedFixture=fixtureScript.toString().replace(fixtureAnchor,fixtureReplacement);
const fixtureEnd=' qa.ready=true;\n})();';assert.equal(adaptedFixture.split(fixtureEnd).length,2);
const heldTransport=String.raw`+'`'+String.raw`
 if(params.get('columnHoldWorker')==='1'&&typeof window.Worker==='function'){
  const NormalWorker=window.Worker;
  window.Worker=class extends NormalWorker{
   set onmessage(handler){super.onmessage=event=>{
    if(event.data?.type==='result'){
     qa.heldColumnResults=(qa.heldColumnResults||0)+1;
     qa.releaseColumnResult=()=>{handler.call(this,event);return true;};return;
    }
    handler.call(this,event);
   };}
  };
 }
`+'`'+String.raw`;
adaptedFixture=adaptedFixture.replace(fixtureEnd,heldTransport+fixtureEnd);localFiles['current_fixture.js']=()=>Buffer.from(adaptedFixture);
report.adaptedFixtureScriptSha256=sha(adaptedFixture);report.sourceFixtureAdapterChanges=['Initial fictional source comes from a JSON query value before product startup.','An explicitly requested transport case retains an actual Worker result while the untouched real UI watchdog expires.'];
const items=n=>Array.from({length:n},(_,i)=>'* Item '+(i+1)).join('\n');
const plain=(heading,n,tail='')=>'Texto fictício.\n\n== '+heading+' ==\n'+items(n)+tail+'\n';
const wrapped=(heading,n,kind='div')=>'Texto fictício.\n\n== '+heading+' ==\n'+(kind==='div'?'{{Div col|colunas=2}}':'{{Colunas-lista|2|2=')+'\n'+items(n)+'\n'+(kind==='div'?'{{Div col fim}}':'}}')+'\n';
const expectedWrapped=(heading,n)=>heading==='Ligações externas'?wrapped(heading,n):wrapped(heading,n,'list');
async function setup(bundle,engine,source,extra={}){
 await load(bundle,engine==='staged'?'fallback':'normal','classic',{columnSource:JSON.stringify(source),...extra});
 eq(await read('__rw219UI.read()'),source,'The independent source exists before product startup');
 eq(await read('__rw219UI.summary()'),'','A new editor has no generated summary');
 eq(await read('document.getElementById("wpMinoredit").checked'),false,'A new editor starts with its original minor choice');
}
async function assertChanged(source,expected,engine){
 await adjust();eq(await read('__rw219UI.read()'),expected,'The actual editor receives the complete independent endpoint');eq(await read('RevisaWiki.processing.engine'),engine,'The requested production executor runs');
 ok((await read('__rw219UI.summary()')).includes('RevisaWiki'),'A real applied change receives the tool summary');eq(await read('document.getElementById("wpMinoredit").checked'),true,'A tool-only adjustment is minor');
 const beforeUndo=await read('__rw219UI.state()');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores the complete original source');eq(await read('__rw219UI.summary()'),'','Undo restores the original summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Undo restores the original minor choice');
 (report.changedEndpoints??=[]).push({sourceSha256:sha(source),expectedSha256:sha(expected),appliedSha256:sha(beforeUndo.source),engine});
}
async function runPortableDemo(){
 const portable=path.resolve(process.env.REVISAWIKI_COLUMNS_DEMO_PATH),raw=fs.readFileSync(portable),html=raw.toString(),embedded=id=>{const tag='<script type="application/json" id="'+id+'">',from=html.indexOf(tag),to=html.indexOf('</script>',from+tag.length);assert(from>=0&&to>from&&html.indexOf(tag,from+tag.length)<0,'Exactly one complete embedded metadata field is required');return JSON.parse(html.slice(from+tag.length,to));},book=embedded('demo-book'),engine=Buffer.from(embedded('demo-engine'),'base64'),fixtureBytes=fs.readFileSync(path.resolve(__dirname,'../../v221/demo_examples.json')),fixtures=JSON.parse(fixtureBytes),enginePin=pins.files['RevisaWiki_v2_21_1_completo.js'];
 eq(sha(engine),enginePin.sha256,'The portable viewer embeds the exact new full runtime');eq(engine.length,enginePin.bytes,'The full embedded byte count matches');eq(book.version,'2.21.1','The portable viewer names the actual release');eq(book.examples,fixtures,'All95 original independent examples remain unchanged');eq(book.fixtureSha256,sha(fixtureBytes),'The example source hash is exact');ok(html.includes("connect-src 'none'")&&!/<script\b[^>]*\bsrc=/i.test(html),'The portable viewer has no external script or network operation');
 const {pathToFileURL}=require('node:url'),fileOrigin=pathToFileURL(path.dirname(portable)).href;
 if(browserName==='Chrome'){await driver.context.unroute('**/*');await driver.context.route('**/*',route=>{if(route.request().url().startsWith(fileOrigin+'/')||route.request().url().startsWith('blob:'))return route.continue();driver.blocked.push(route.request().url());return route.abort();});}else driver.origin=fileOrigin;
 await driver.navigate(pathToFileURL(portable).href);await waitFor('document.getElementById("version")?.textContent==="2.21.1"&&!document.getElementById("run")?.disabled','Portable viewer ready');eq(await read('location.protocol'),'file:','The viewer opens as the actual portable file');await read('(()=>{window.__demoPolicyViolations=[];document.addEventListener("securitypolicyviolation",event=>__demoPolicyViolations.push({directive:event.violatedDirective,blocked:event.blockedURI}));return true})()');
 const d=report.demonstration={portableSha256:sha(raw),engineSha256:sha(engine),fixtureSha256:sha(fixtureBytes),sameOwnedBrowserSession:true,cases:[],checksBefore:report.checks,failures:[]};
 for(const item of fixtures){const start=Date.now();try{await read('(()=>{const f=document.getElementById("family");f.value='+JSON.stringify(item.family)+';f.dispatchEvent(new Event("change",{bubbles:true}));const e=document.getElementById("example");e.value='+JSON.stringify(item.id)+';e.dispatchEvent(new Event("change",{bubbles:true}));return true})()');eq(await read('document.getElementById("source").value'),item.source,'The independent original source is selected');eq(await read('document.getElementById("source").readOnly'),true,'Original source remains read-only');await click('#run');await waitFor('document.getElementById("run").textContent==="Exemplo revisado"||!document.getElementById("run").disabled','Portable example result');eq(await read('document.getElementById("result").hidden'),false,'An actual Worker result reaches the viewer');eq(await read('document.getElementById("after").textContent'),item.expected,'Exact unchanged independent expected endpoint');eq(await read('document.getElementById("source").value'),item.source,'The original source remains exact');eq(await read('document.getElementById("difference").hidden'),item.source===item.expected,'Comparison exists only for an actual change');if(item.source!==item.expected){await click('#difference');eq(await read('document.getElementById("diff").hidden'),false,'Native comparison opens');ok((await read('document.getElementById("diff-code").textContent')).length>0,'Visible comparison contains code');}await click('#restore');eq(await read('document.getElementById("source").value'),item.source,'Restore retains the exact original');eq(await read('document.getElementById("result").hidden'),true,'Restore clears the previous result');eq(await read('document.getElementById("run").disabled'),false,'The example remains usable');d.cases.push({id:item.id,status:'passed',milliseconds:Date.now()-start});}catch(error){report.status='failed';d.cases.push({id:item.id,status:'failed',milliseconds:Date.now()-start});d.failures.push({id:item.id,message:String(error.message)});}if(process.env.REVISAWIKI_UI_PROGRESS)fs.writeFileSync(process.env.REVISAWIKI_UI_PROGRESS,JSON.stringify({browser:browserName,tests:report.tests,checks:report.checks,failures:report.failures,demonstration:d},null,2)+'\n');}
 eq(await read('window.__demoPolicyViolations'),[],'Portable controls trigger no forbidden resource');eq(await read('performance.getEntriesByType("resource").filter(entry=>/^https?:/i.test(entry.name)).map(entry=>entry.name)'),[],'NoHTTP resource is used by the offline viewer');d.checks=report.checks-d.checksBefore;
}
(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
  for(const bundle of ['core','complete']){
   for(const engine of ['worker','staged']){
    for(const heading of ['Ligações externas','Bibliografia complementar','Bibliografia adicional']){
     await test(bundle+'-'+engine+'-'+heading+'-seven',async()=>{const source=plain(heading,7);await setup(bundle,engine,source);await adjust();eq(await read('__rw219UI.read()'),source,'Seven root items never create columns');eq(await read('__rw219UI.summary()'),'','A NOP claims no applied summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'A NOP keeps the minor choice');});
     await test(bundle+'-'+engine+'-'+heading+'-eight',async()=>{const source=plain(heading,8);await setup(bundle,engine,source);await assertChanged(source,expectedWrapped(heading,8),engine);});
    }
   }
   for(const descendant of ['**','*#','*:','*;'])await test(bundle+'-descendants-'+descendant,async()=>{const source=plain('Ligações externas',2,'\n'+Array.from({length:6},(_,i)=>descendant+' Descendente '+(i+1)).join('\n'));await setup(bundle,'worker',source);await adjust();eq(await read('__rw219UI.read()'),source,'Descendants do not turn two root items into eight');});
   for(const heading of ['Ligações externas','Bibliografia adicional'])await test(bundle+'-plain-wrapper-cleanup-'+heading,async()=>{const source=wrapped(heading,7,heading==='Ligações externas'?'div':'list');await setup(bundle,'worker',source);await adjust();const result=await read('__rw219UI.read()');ok(!/\{\{(?:Div col|Colunas-lista)/.test(result),'A confirmed simple short layout is removed');eq(result.split('\n').filter(Boolean),plain(heading,7).split('\n').filter(Boolean),'Every complete nonempty source line and its order are preserved');eq(await read('document.getElementById("wpMinoredit").checked'),true,'A tool-only short-layout repair is minor');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores the complete original wrapper and source');});
   for(const count of [9,10])await test(bundle+'-references-'+count,async()=>{const source=Array.from({length:count},(_,i)=>'<ref name="r'+i+'">Fonte '+i+'.</ref>').join('')+'\n{{Referências}}',style='column-count:2;column-width:30em;column-gap:2em;max-width:62em;',expected=source;await setup(bundle,'worker',source);await adjust();eq(await read('__rw219UI.read()'),expected,'The current responsive reference behavior remains unchanged at nine and ten entries');});
   await test(bundle+'-option-off-and-label',async()=>{const source=plain('Ligações externas',8);await setup(bundle,'worker',source);const selector='input[data-option="endMatterColumns"]';await openParents(selector);ok(/oito/.test(await read('document.querySelector('+JSON.stringify(selector)+').closest("label").textContent')),'The live option explains the eight-item threshold');await toggle(selector);eq(await read('document.querySelector('+JSON.stringify(selector)+').checked'),false,'The native option is actually disabled');await adjust();eq(await read('__rw219UI.read()'),source,'The disabled layout option creates no columns');});
   await test(bundle+'-custom-wrapper-preserved',async()=>{const source=wrapped('Ligações externas',3,'list').replace('\n}}\n','\n|largura=20em}}\n');await setup(bundle,'worker',source);await adjust();eq(await read('__rw219UI.read()'),source,'An existing custom layout is not removed');});
   await test(bundle+'-manual-summary-and-undo',async()=>{const source=plain('Ligações externas',8);await setup(bundle,'worker',source);await read('__rw219UI.setSummary("Resumo manual preservado.")');await adjust();eq(await read('__rw219UI.summary()'),'Resumo manual preservado.','A manual summary remains owned by its editor');await read('__rw219UI.setSummary("Resumo manual posterior.")');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores original source');eq(await read('__rw219UI.summary()'),'Resumo manual posterior.','Undo retains a later manual summary');});
   await test(bundle+'-cancel-before-apply',async()=>{const source=plain('Ligações externas',8);await load(bundle,'slow','classic',{columnSource:JSON.stringify(source)});await click('.ajg-run');await waitFor('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")==="true"','analysis entered');await click('.ajg-stop');await settled();eq(await read('__rw219UI.read()'),source,'Cancellation applies no partial layout');eq(await read('__rw219UI.summary()'),'','Cancellation does not claim a summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Cancellation retains the original minor choice');});
   await test(bundle+'-stale-source-preservation',async()=>{const source=plain('Ligações externas',8),manual=source+'Acréscimo manual.\n';await load(bundle,'race','classic',{columnSource:JSON.stringify(source)});await click('.ajg-run');await waitFor('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")==="true"','analysis entered');await read('__rw219UI.write('+JSON.stringify(manual)+')');await settled();eq(await read('__rw219UI.read()'),manual,'A stale calculation cannot overwrite a newer complete draft');});
  }
  if(browserName==='Chrome'&&process.env.REVISAWIKI_COLUMNS_REAL_WATCHDOG==='1'&&report.status==='passed')await test('core-real-60000ms-ui-watchdog',async()=>{
   const source=plain('Ligações externas',8);await setup('core','worker',source,{columnHoldWorker:'1'});await read('(()=>{__rw219UI.setSummary("Resumo anterior ao prazo.");document.getElementById("wpMinoredit").checked=true;return true})()');const started=Date.now();await click('.ajg-run');await waitFor('(__rw219UI.heldColumnResults||0)===1','Actual Worker result held by the fictional transport');await waitFor('/demorou demais/.test(document.querySelector(".ajg-status")?.textContent||"")','Untouched 60-second UI watchdog',75000);await settled();const elapsed=Date.now()-started;ok(elapsed>=59000&&elapsed<74000,'The unmodified 60-second production watchdog expires at its actual deadline');eq(await read('__rw219UI.read()'),source,'Timeout retains the entire original draft');eq(await read('__rw219UI.summary()'),'Resumo anterior ao prazo.','Timeout retains the prior manual summary');eq(await read('document.getElementById("wpMinoredit").checked'),true,'Timeout retains the prior minor choice');const manual=source+'Edição após o prazo.\n';await read('(()=>{__rw219UI.write('+JSON.stringify(manual)+');return __rw219UI.releaseColumnResult()})()');await delay(150);eq(await read('__rw219UI.read()'),manual,'Editing continues and a late callback cannot replace the newer draft');report.realUiWatchdog={deadlineMilliseconds:60000,elapsedMilliseconds:elapsed,calculationWasExtremeOrTimedOut:false,actualWorkerResultHeldByFictionalTransport:true,originalDraftSummaryAndMinorPreserved:true};
  });
  if(process.env.REVISAWIKI_COLUMNS_DEMO_PATH&&report.status==='passed')await runPortableDemo();
  report.pageErrors=driver.errors||[];report.blockedNetwork=driver.blocked||[];eq(report.actualNetworkMutations,0,'No network mutation');eq(report.pageErrors,[],'No browser runtime error');eq(report.clipboardWrites,0,'No clipboard write');
 }catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:String(error.message)});}
 finally{
  try{if(browserName==='Safari'&&driver.session){await driver.request('DELETE','/session/'+driver.session);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.status='failed';report.ownedBrowserSessionClosed=false;report.failures.push({id:'owned-session-cleanup',message:String(error.message)});}
  await new Promise(resolve=>server.close(resolve));report.testCount=report.tests.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
 }
})();
`;
const adapted=prefix+'\n'+body,compiled=new Module(currentPath,module);compiled.filename=currentPath;compiled.paths=Module._nodeModulePaths(path.dirname(currentPath));
if(process.env.REVISAWIKI_COLUMNS_COMPILE_ONLY==='1')new(require('node:vm').Script)(adapted,{filename:__filename});else compiled._compile(adapted,currentPath);
