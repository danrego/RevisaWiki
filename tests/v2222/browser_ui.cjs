'use strict';
// Reuse the native installed-browser fixture. Only release identity, exact
// loopback host guards and fictional editor/API transport are adapted.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const original=path.resolve(__dirname,'../v2221/browser_ui.cjs');let source=fs.readFileSync(original,'utf8').replaceAll('2.22.1','2.22.2').replaceAll('2_22_1','2_22_2');
const large="const largeSource=Array.from({length:350},()=>plain).join('\\n'),largeExpected=Array.from({length:350},()=>clean).join('\\n');";
assert.equal(source.split(large).length,2);source=source.replace(large,'const largeSource=plain+"\\n<nowiki>"+"x".repeat(110000)+"</nowiki>",largeExpected=clean+"\\n<nowiki>"+"x".repeat(110000)+"</nowiki>";');
const bodyAnchor='const body=String.raw`';assert.equal(source.split(bodyAnchor).length,2);source=source.replace(bodyAnchor,'prefix=prefix.replace('+JSON.stringify("path.join(fixtureDir,'textSelection.js')")+','+JSON.stringify(JSON.stringify(path.resolve(__dirname,'text_selection_fixture.js')))+');\n'+bodyAnchor);
const watchFixture=' const nativeWatch=document.createElement("input");nativeWatch.type="checkbox";nativeWatch.id="wpWatchthis";nativeWatch.name="wpWatchthis";nativeWatch.setAttribute("aria-label","Vigiar página");document.getElementById("editform").append(nativeWatch);qa.watchChanges=0;nativeWatch.addEventListener("change",()=>qa.watchChanges++);\n';
const countTransport=String.raw`
 if(params.get('v2222HoldFinalCount')==='1'&&typeof window.Worker==='function'){
  const ActualWorker=window.Worker;window.Worker=class extends ActualWorker{
   postMessage(value,...rest){this.qaKind=value?.job?.kind;if(this.qaKind==='final-count')qa.finalCountRequests=(qa.finalCountRequests||0)+1;return super.postMessage(value,...rest);}
   set onmessage(handler){super.onmessage=event=>{if(event.data?.type==='result'&&this.qaKind==='final-count'&&!qa.finalCountReleased){qa.heldFinalCount=(qa.heldFinalCount||0)+1;qa.releaseFinalCount=()=>{qa.finalCountReleased=true;handler.call(this,event);return true;};return;}handler.call(this,event);};}
  };
 }
`;
const fixtureAnchor='adaptedFixture=adaptedFixture.replace(fixtureEnd,heldResult+tamperedResult+checkpointHold+fixtureEnd)';assert.equal(source.split(fixtureAnchor).length,2);source=source.replace(fixtureAnchor,'adaptedFixture=adaptedFixture.replace(fixtureEnd,'+JSON.stringify(watchFixture+countTransport)+'+heldResult+tamperedResult+checkpointHold+fixtureEnd)');
const extra=String.raw`
  report.currentReleaseAdapterSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
  for(const bundle of ['core','complete'])for(const chosen of [[0],[1],[2],[0,1],[0,2],[1,2],[0,1,2]])await test(bundle+'-v2222-talk-summary-'+chosen.join(''),async()=>{
   const names=['PD','Marca de projeto','Traduzido'],canonical=['{{PD}}','{{Marca de projeto|?|Ciência|4}}','{{Traduzido|página=Example|cód_idioma=en|oldid=123}}'],changed=['{{pd}}','{{Marca de projeto|?|Ciência|4|rev=20201231}}','{{Tradução|página=Example|cód_idioma=en|oldid=123}}'],text=canonical.map((v,i)=>chosen.includes(i)?changed[i]:v).join('\n')+'\n\n== Tema ==\nConversa preservada.';
   await load(bundle,'talk','classic',{v2212Source:JSON.stringify(text)});await read('(()=>{__rw219UI.articleSource="Texto fictício.";return true})()');await adjust();
   eq(await read('__rw219UI.summary()'),chosen.map(i=>'{{'+names[i]+'}}').join(''),'The summary contains only changed native metadata families');
   eq(await read('document.getElementById("wpMinoredit").checked'),true,'Tool-only metadata changes are minor');
   ok(await read('__rw219UI.read().endsWith("== Tema ==\\nConversa preservada.")'),'Conversation remains exact');
   await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),text,'One undo restores every source byte');await noReviewUI();
  });
  for(const bundle of ['core','complete'])await test(bundle+'-v2222-count-no-second-pass-and-undo-owned',async()=>{
   await setup(bundle,largeSource);await adjust();
   eq(await read('__rw219UI.read()'),largeExpected,'The complete accepted draft is applied');
   eq(await read('__rw219UI.summary()'),'Minúcias','The owned summary is immediately available');
   eq(await read('document.getElementById("wpMinoredit").checked'),true,'Minor is immediate');
   eq(await read('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")'),'false','No second counting phase marks the complete editor busy');
   eq(await read('document.querySelector(".ajg-result-count").textContent'),'3 ajustes aplicados','The three retained operations are counted exactly');
   eq(await read('(__rw219UI.nativeWitnessJobs||[]).filter(x=>(x.job||x).kind==="presentation").length'),0,'No repair replay or separate presentation worker is emitted');
   eq(await read('document.getElementById("wpSave").disabled'),false,'Native publication control is available');
   eq(await read('document.querySelector(".ajg-undo").disabled'),false,'Undo is available immediately');
   await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),largeSource,'Undo preserves the complete pre-action draft');eq(await read('__rw219UI.summary()'),'','Undo restores its owned summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Undo restores its owned minor flag');await noReviewUI();
  });
  for(const bundle of ['core','complete']){
   for(const [mode,initial,disabled,absent]of [['changed',false,false,false],['no-op',false,false,false],['already-checked',true,false,false],['disabled',false,true,false],['absent',false,false,true]])await test(bundle+'-v2222-watch-'+mode,async()=>{
    await setup(bundle,mode==='no-op'?clean:plain);await read('(()=>{const w=document.getElementById("wpWatchthis");w.checked='+initial+';w.disabled='+disabled+';'+(absent?'w.remove();':'')+'return true})()');await adjust();
    eq(await read('__rw219UI.read()'),clean,'The ordinary action succeeds');
    if(!absent)eq(await read('document.getElementById("wpWatchthis").checked'),disabled?false:true,'Only a usable native unchecked control is checked');
    eq(await read('__rw219UI.watchChanges'),initial||disabled||absent?0:1,'A previously checked/disabled/absent control emits no extra event');
    if(mode==='changed'){await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),plain,'Undo restores the draft');eq(await read('document.getElementById("wpWatchthis").checked'),true,'Undo does not clear the native watch preference');}
    await noReviewUI();
   });
   await test(bundle+'-v2222-watch-cancelled',async()=>{
    await setup(bundle);await read('__rw219UI.parseDelay=500');await click('.ajg-run');await waitFor('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")==="true"','Watch cancellation action begins');await click('.ajg-stop');await settled();eq(await read('document.getElementById("wpWatchthis").checked'),false,'Cancellation does not check watch');eq(await read('__rw219UI.read()'),plain,'Cancellation preserves the draft');await noReviewUI();
   });
   await test(bundle+'-v2222-watch-stale',async()=>{
    await setup(bundle);await read('__rw219UI.parseDelay=500');await click('.ajg-run');await waitFor('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")==="true"','Watch stale action begins');const manual=plain+' Edição manual.';await read('__rw219UI.write('+JSON.stringify(manual)+')');await settled();eq(await read('document.getElementById("wpWatchthis").checked'),false,'A stale action does not check watch');eq(await read('__rw219UI.read()'),manual,'The manual draft remains exact');await noReviewUI();
   });
   await test(bundle+'-v2222-watch-refused-result',async()=>{
    await setup(bundle,plain,{v2215Tamper:'link'});await adjust();eq(await read('document.getElementById("wpWatchthis").checked'),false,'An unaccepted worker result does not check watch');eq(await read('__rw219UI.read()'),plain,'The unaccepted result leaves the draft exact');await noReviewUI();
   });
  }

  for(const bundle of ['core','complete'])await test(bundle+'-v2222-talk-metadata-comments-remain-inert',async()=>{
   const text='{{PD}}\n{{Marca de projeto|1<!-- avaliação -->|Ciência|4|bot=sim<!-- {{Portal3|Ciência}} <ref>literal</ref> -->|rev=20190101<!-- revisão -->}}';
   await load(bundle,'talk','classic',{v2212Source:JSON.stringify(text)});await read('(()=>{__rw219UI.articleSource="Texto fictício.";return true})()');await adjust();
   const after=await read('__rw219UI.read()');eq([...after.matchAll(/<!--[\s\S]*?-->/g)].map(m=>m[0]),[...text.matchAll(/<!--[\s\S]*?-->/g)].map(m=>m[0]),'All metadata comment bytes/order are retained');
   ok(!after.includes('|bot=')&&!after.includes('|rev='),'Requested bot metadata cleanup still applies');
   eq(await read('RevisaWiki.v2221LayoutPortalPresence(__rw219UI.read()).any.length'),0,'Commented template/ref markup never becomes active');
   eq(await read('__rw219UI.summary()'),'{{Marca de projeto}}','Only the changed native project owner enters the summary');
   await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),text,'Undo restores every comment to its original field');await noReviewUI();
  });

  for(const bundle of ['core','complete'])for(const [label,text,expected,summary,count]of [['empty','','{{PD}}\n{{Marca de projeto|?}}','{{PD}}{{Marca de projeto}}',2],['pd-only','{{PD}}','{{PD}}\n{{Marca de projeto|?}}','{{Marca de projeto}}',1],['attribution','{{PD}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123}}\n{{OKA}}','{{PD}}\n{{Marca de projeto|?}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123}}\n{{OKA}}','{{Marca de projeto}}',1]])await test(bundle+'-v2222-talk-article-empty-project-'+label,async()=>{
   await load(bundle,'talk','classic',{v2212Source:JSON.stringify(text)});await read('(()=>{__rw219UI.articleSource="Texto fictício sem portais.";return true})()');await adjust();
   eq(await read('__rw219UI.read()'),expected,'Article talk receives the unassessed native project header without portal evidence');eq(await read('__rw219UI.summary()'),summary,'Only newly added header families enter the summary');eq(await read('document.querySelector(".ajg-result-count").textContent'),count+' ajuste'+(count===1?' aplicado':'s aplicados'),'Each new header call is counted');eq(await read('document.getElementById("wpMinoredit").checked'),true,'Tool-only changes remain minor');eq(await read('document.getElementById("wpWatchthis").checked'),true,'The successful action retains the native watch preference');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),text,'Undo restores the complete original talk source');await noReviewUI();
  });

  for(const bundle of ['core','complete'])await test(bundle+'-v2222-new-article-talk-with-missing-main',async()=>{
   await load(bundle,'talk','classic',{v2212Source:JSON.stringify('')});await read('(()=>{const q=__rw219UI;q.articleSource="";q.queryPageOverrides={};for(const title of [q.articleTitle,q.title].flatMap(value=>[value,value.replaceAll(" ","_")]))q.queryPageOverrides[title]={missing:true,pageid:-1,lastrevid:0,revisions:[]};mw.config.set({wgArticleId:0,wgRevisionId:0,wgCurRevisionId:0});return true})()');await adjust();
   eq(await read('__rw219UI.read()'),'{{PD}}\n{{Marca de projeto|?}}','A completely new article talk receives both native calls without a main-article or portal prerequisite');eq(await read('__rw219UI.summary()'),'{{PD}}{{Marca de projeto}}','Both newly added header families enter the summary');eq(await read('document.querySelector(".ajg-result-count").textContent'),'2 ajustes aplicados','Both retained native calls are counted exactly');eq(await read('document.getElementById("wpMinoredit").checked'),true,'The new tool-only header is minor');eq(await read('document.getElementById("wpWatchthis").checked'),true,'The successful new-talk action retains native watch preference');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),'','Undo returns the exactly empty new-page draft');eq(await read('__rw219UI.summary()'),'','Undo restores the empty summary');await noReviewUI();
  });

  for(const bundle of ['core','complete'])for(const [label,text,expected,summary]of [['order','{{PD}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123}}\n{{Marca de projecto|2|Ciência|4}}','{{PD}}\n{{Marca de projecto|2|Ciência|4}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123}}','{{Marca de projeto}}{{Traduzido}}'],['merge','{{PD}}\n{{Marca de projecto|2|Ciência|4}}\nPortal da física','{{PD}}\n{{Marca de projecto|2|Ciência|4|Física|?}}','{{Marca de projeto}}']])await test(bundle+'-v2222-talk-native-project-alias-'+label,async()=>{
   await load(bundle,'talk','classic',{v2212Source:JSON.stringify(text)});await read('(()=>{__rw219UI.articleSource="Texto fictício sem portais.";return true})()');await adjust();eq(await read('__rw219UI.read()'),expected,'The production pipeline preserves the native projecto alias, human ratings and one marker');eq(await read('__rw219UI.summary()'),summary,'Only the changed project/translation families enter the summary');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),text,'Undo restores the complete native-alias source');await noReviewUI();
  });

  for(const bundle of ['core','complete'])for(const mode of ['complete','edit','undo','context','manual-metadata'])await test(bundle+'-v2222-pure-count-pending-'+mode,async()=>{
   const before=Array.from({length:40},(_,i)=>'Frase '+i+' sobre [[Brasil|Brasil]].').join('\n'),after=before.replaceAll('[[Brasil|Brasil]]','[[Brasil]]');
   await setup(bundle,before,{v2222HoldFinalCount:'1'});await click('.ajg-run');await waitFor('__rw219UI.heldFinalCount===1','The real final-count response is held by the local message transport');
   eq(await read('__rw219UI.read()'),after,'The complete accepted draft is applied before the pure count arrives');eq(await read('__rw219UI.summary()'),'Minúcias','The summary is available during counting');eq(await read('document.getElementById("wpMinoredit").checked'),true,'Minor is available during counting');eq(await read('document.getElementById("wpWatchthis").checked'),true,'Watch is available during counting');eq(await read('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")'),'false','The pending pure count does not mark the editor busy');eq(await read('!!RevisaWiki.processing.active'),false,'The analysis has ended before the pure count arrives');eq(await read('document.getElementById("wpSave").disabled'),false,'The native publication control remains usable');eq(await read('document.querySelector(".ajg-undo").disabled'),false,'Undo remains usable');eq(await read('document.querySelector(".ajg-result-count").textContent'),'Contando ajustes…','The pending label is confined to the adjustment count');eq(await read('__rw219UI.finalCountRequests'),1,'Exactly one pure final-count job is emitted');
   const primary=await read('(__rw219UI.nativeWitnessJobs||[]).filter(x=>(x.job||x).kind==="adjust"&&!(x.job||x).v2215Checkpoint).length');eq(primary,1,'Counting never replays the primary repair action');
   if(mode==='undo'){await click('.ajg-undo');await waitFor('__rw219UI.read()==='+JSON.stringify(before),'Undo restores the pre-action draft');await read('__rw219UI.releaseFinalCount()');await delay(150);eq(await read('__rw219UI.read()'),before,'A late count cannot reapply an undone draft');eq(await read('__rw219UI.summary()'),'','A late count cannot reclaim the undone summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'A late count cannot reclaim the undone minor flag');eq(await read('document.getElementById("wpWatchthis").checked'),true,'Undo leaves the native watch preference checked');}
   else if(mode==='edit'){const manual=after+' Edição manual.';await read('__rw219UI.write('+JSON.stringify(manual)+')');await delay(100);const prior=await read('({source:__rw219UI.read(),summary:__rw219UI.summary(),minor:document.getElementById("wpMinoredit").checked})');await read('__rw219UI.releaseFinalCount()');await delay(150);eq(await read('({source:__rw219UI.read(),summary:__rw219UI.summary(),minor:document.getElementById("wpMinoredit").checked})'),prior,'A late count changes neither the manual draft nor its metadata');ok(await read('document.querySelector(".ajg-result").hidden'),'The old count is not displayed for a changed draft');}
   else if(mode==='context'){await read('mw.config.set({wgTitle:"Outro tema fictício",wgPageName:"Outro_tema_fictício"})');await delay(100);await read('__rw219UI.releaseFinalCount()');await delay(150);eq(await read('__rw219UI.read()'),after,'A previous page count never writes into the changed page context');ok(await read('document.querySelector(".ajg-result").hidden'),'A previous page count is hidden in another context');}
   else {if(mode==='manual-metadata')await read('(()=>{const s=document.getElementById("wpSummary"),m=document.getElementById("wpMinoredit");s.value="Resumo manual.";s.dispatchEvent(new Event("input",{bubbles:true}));m.checked=false;m.dispatchEvent(new Event("change",{bubbles:true}));return true})()');await read('__rw219UI.releaseFinalCount()');await waitFor('document.querySelector(".ajg-result-count").textContent==="40 ajustes aplicados"','The exact count replaces its pending label');eq(await read('__rw219UI.read()'),after,'Counting does not rewrite the accepted draft');if(mode==='manual-metadata'){eq(await read('__rw219UI.summary()'),'Resumo manual.','Manual summary ownership survives counting');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Manual minor opt-out survives counting');}else{eq(await read('__rw219UI.summary()'),'Minúcias','The immediate summary stays unchanged after counting');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),before,'Undo remains exact after counting');}}
   await noReviewUI();
  });

`;
const anchor="  ok(report.tests.length>0,'At least one selected browser scenario actually ran');";assert.equal(source.split(anchor).length,2);source=source.replace(anchor,extra+'\n'+anchor);
const compiled=new Module(original,module);compiled.filename=original;compiled.paths=Module._nodeModulePaths(path.dirname(original));compiled._compile(source,original);
