'use strict';
// The installed browsers use the real release bundles. Only the existing
// fictional editor/API adapter and exact loopback-host guards are adapted.
// All source fixtures are synthetic; production transforms and deadlines are unchanged.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const currentPath=path.resolve(__dirname,'../v219/browser/current_ui.cjs'),current=fs.readFileSync(currentPath,'utf8'),anchor='(async()=>{\n try{\n  report.caseFilter=';
if(current.split(anchor).length!==2)throw Error('The native harness entry point changed');
let prefix=current.slice(0,current.indexOf(anchor)).replaceAll('2.19.0','2.21.2').replaceAll('2_19_0','2_21_2').replaceAll('expected_release_v2190.json','expected_release_v2212.json');
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
const diagnosticAnchor='workerResults:window.__rw219UI?.workerResults?.length,';
if(prefix.split(diagnosticAnchor).length!==2)throw Error('The diagnostic boundary changed');
prefix=prefix.replace(diagnosticAnchor,diagnosticAnchor+'requests:window.__rw219UI?.requests,workerOptions:(window.__rw219UI?.nativeWitnessJobs||[]).map(m=>{const j=m.job||m;return{messageKeys:Object.keys(m),kind:j.kind,optionKeys:Object.keys(j.options||{}),autoMinor:j.options?.autoMinor,minorBaseConfirmed:j.options?.minorBaseConfirmed,minorAllToolChanges:j.options?.minorAllToolChanges,v2212OriginalDraftHash:j.options?.v2212OriginalDraftHash,v2212PortalProofRequired:j.options?.v2212PortalProofRequired,v2212PortalAvailability:j.options?.v2212PortalAvailability,v2212VerifiedFiles:j.options?.v2212VerifiedFiles}}),lastMinorCheck:window.__rw219UI?.workerResults?.at(-1)?.result?.minorCheck,');
const body=String.raw`
report.kind='native-browser-v2212-interface-and-availability';report.version='2.21.2';
report.originalHarnessSha256=sha(fs.readFileSync(${JSON.stringify(currentPath)}));report.runnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
report.caseFilter=process.env.REVISAWIKI_UI_CASE_FILTER||null;
report.scope='Actual production UI, Worker, WebCrypto, summary/minor/undo ownership, destination proof protocol and complete draft preservation. Editor and API responses are local synthetic adapters; no live Wikipedia access or publication.';
const plain='Texto sobre [[Brasil|Brasil]], [[Portugal|Portugal]] e [[França|França]].',clean='Texto sobre [[Brasil]], [[Portugal]] e [[França]].';
const largeSource=Array.from({length:350},()=>plain).join('\n'),largeExpected=Array.from({length:350},()=>clean).join('\n');
const sourceAnchor='const source=sources[scenario]||sources.normal,qa=';
assert.equal(fixtureScript.toString().split(sourceAnchor).length,2);
let adaptedFixture=fixtureScript.toString().replace(sourceAnchor,"const source=params.get('v2212SourceKey')==='large'?"+JSON.stringify(largeSource)+":params.has('v2212Source')?JSON.parse(params.get('v2212Source')):sources[scenario]||sources.normal,qa=");
const queryAnchor="   const requested=String(p.titles||title).split('|');";
assert.equal(adaptedFixture.split(queryAnchor).length,2);
const syntheticDestinations=String.raw`+'`'+String.raw`
   if(p.prop==='imageinfo'){
    const imageState=params.get('v2212Image')||'shared',portalState=params.get('v2212Portal')||'exists',requested=String(p.titles||'').split('|'),aliases=[],pages=[];
    for(const target of requested){
     if(target.startsWith('Portal:')){pages.push({title:target,ns:100,...(portalState==='missing'?{missing:true}:{pageid:200+pages.length})});continue;}
     if(!target.startsWith('Ficheiro:'))continue;
     let display=target.replaceAll('_',' ');
     if(imageState==='alias'){const renamed='Ficheiro:Renamed image.jpg';aliases.push({from:target,to:renamed});display=renamed;}
     const row={title:display,ns:6};
     if(imageState==='missing')row.missing=true;
     else{
      row.imagerepository=imageState==='local'?'local':'shared';
      if(imageState!=='local'){row.missing=true;row.known=true;}else row.pageid=300;
      row.imageinfo=imageState==='empty'?[]:imageState==='incomplete'?[{}]:imageState==='badfile'?[{badfile:true}]:[{url:'https://upload.wikimedia.org/wikipedia/commons/0/00/Example_image.jpg'}];
     }
     pages.push(row);
    }
    return{query:{pages,normalized:[],redirects:aliases}};
   }
`+'`'+String.raw`;
adaptedFixture=adaptedFixture.replace(queryAnchor,syntheticDestinations+queryAnchor);
const fixtureEnd=' qa.ready=true;\n})();';assert.equal(adaptedFixture.split(fixtureEnd).length,2);
const heldResult=String.raw`+'`'+String.raw`
 if(params.get('v2212HoldWorker')==='1'&&typeof window.Worker==='function'){
  const ActualWorker=window.Worker;
  window.Worker=class extends ActualWorker{
   set onmessage(handler){super.onmessage=event=>{
    if(event.data?.type==='result'){
     qa.heldActualResults=(qa.heldActualResults||0)+1;
     qa.releaseActualResult=()=>{handler.call(this,event);return true;};return;
    }
    handler.call(this,event);
   };}
  };
 }
`+'`'+String.raw`;
adaptedFixture=adaptedFixture.replace(fixtureEnd,heldResult+fixtureEnd);localFiles['current_fixture.js']=()=>Buffer.from(adaptedFixture);
report.adaptedFixtureScriptSha256=sha(adaptedFixture);report.adaptedScriptHashes=Object.fromEntries(Object.entries(scripts).map(([kind,source])=>[kind,sha(source)]));
report.fixtureAdapterChanges=['Initial complete fictional source comes from a small JSON query or a fixed large synthetic fixture before product startup.','Only query/imageinfo receives synthetic existence, alias and imageinfo responses.','The optional watchdog case retains an actual completed Worker result in the fictional message transport; the production watchdog remains unchanged.'];

const image='[[https://commons.wikimedia.org/wiki/File:Example_image.jpg|thumb|240px|Legenda literal.]]',imageFixed='[[Ficheiro:Example image.jpg|thumb|240px|Legenda literal.]]';
async function setup(bundle,source=plain,extra={},engine='worker'){
 const payload=source===largeSource?{v2212SourceKey:'large'}:{v2212Source:JSON.stringify(source)};
 await load(bundle,engine==='staged'?'fallback':'normal','classic',{...payload,nativeWitness:'1',...extra});
 eq(await read('__rw219UI.read()'),source,'The complete fixture source exists before product startup');
 eq(await read('__rw219UI.summary()'),'','A fresh fixture starts without generated summary');
 eq(await read('document.getElementById("wpMinoredit").checked'),false,'A fresh fixture starts without minor flag');
}
async function restingColors(){
 if(browserName==='Chrome')await driver.page.mouse.move(2,2);
 else if(browserName==='Firefox')await driver.command('input.performActions',{context:driver.context,actions:[{type:'pointer',id:'qa-mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',x:2,y:2,duration:0,origin:'viewport'}]}]});
 else await driver.request('POST','/session/'+driver.session+'/actions',{actions:[{type:'pointer',id:'qa-mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',x:2,y:2,duration:0,origin:'viewport'}]}]});
 await waitFor('getComputedStyle(document.querySelector(".ajg-run")).backgroundColor===getComputedStyle(document.getElementById("revisawiki-adjust-before-publish")).backgroundColor','Resting button colors match',2500);
 return read('[getComputedStyle(document.querySelector(".ajg-run")).backgroundColor,getComputedStyle(document.getElementById("revisawiki-adjust-before-publish")).backgroundColor]');
}
(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
  for(const bundle of ['core','complete']){
   await test(bundle+'-panel-summary-minor-undo-freshness',async()=>{
    await setup(bundle);eq(await read('!!crypto.subtle&&typeof TextEncoder==="function"'),true,'Native browser WebCrypto is available');
    eq(await read('document.querySelectorAll("#revisawiki-ptwiki").length'),1,'Exactly one production panel');
    const labels=await read('[...document.querySelectorAll("#revisawiki-ptwiki button,#revisawiki-ptwiki summary")].map(e=>e.textContent.trim())');
    ok(labels.some(s=>/^Opções/.test(s)),'The panel exposes Opções');ok(!labels.some(s=>/^(Mais ferramentas|More tools|Configuraç(?:ão|ões)|Settings)$/i.test(s)),'The removed tool/configuration groups do not return');
    eq(await read('document.getElementById("wpSave").previousElementSibling.id'),'revisawiki-adjust-before-publish','The adjustment button directly precedes publication');
    const colors=await restingColors();eq(colors[0],colors[1],'Both adjustment controls have the same resting color');report.buttonColors??=[];report.buttonColors.push({bundle,colors});
    await adjust();eq(await read('__rw219UI.read()'),clean,'The real editor receives all independent corrections');eq(await read('RevisaWiki.processing.engine'),'worker','A real Worker executes the production engine');ok(await read('__rw219UI.workerResults.length>0'),'An actual Worker result is observed');
    eq(await read('__rw219UI.summary()'),'Minúcias','The exact default summary is Minúcias');eq(await read('document.getElementById("wpMinoredit").checked'),true,'A script-only change is marked minor');
    eq(await read('document.querySelector(".ajg-run").dataset.codeChecked'),'true','The unchanged adjusted source is recognized');eq(await read('document.getElementById("revisawiki-adjust-before-publish").dataset.codeChecked'),'true','The lower button shares freshness state');
    await click('.ajg-show-changes');eq(await read('__rw219UI.nativeDiffClicks'),1,'Mostrar alterações uses the native diff button');eq(await read('document.querySelectorAll(".ajg-comparison,.ajg-before,.ajg-after").length'),0,'No duplicate before/after viewer');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),plain,'Undo restores complete source');eq(await read('__rw219UI.summary()'),'','Undo restores generated-summary ownership');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Undo restores the original minor choice');
    await adjust();const manual=clean+' Edição manual.';await read('__rw219UI.write('+JSON.stringify(manual)+')');await waitFor('document.querySelector(".ajg-run").dataset.codeChecked!=="true"','A new source invalidates freshness');eq(await read('__rw219UI.read()'),manual,'Freshness does not alter the new draft');
   });
   await test(bundle+'-manual-summary-and-later-manual-summary',async()=>{
    await setup(bundle);await read('__rw219UI.setSummary("Resumo manual preservado.")');await adjust();eq(await read('__rw219UI.summary()'),'Resumo manual preservado.','The preexisting manual summary is preserved');eq(await read('document.getElementById("wpMinoredit").checked'),true,'Manual summary does not stop code-only minor marking');
    await read('__rw219UI.setSummary("Resumo manual posterior.")');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),plain,'Undo restores original source');eq(await read('__rw219UI.summary()'),'Resumo manual posterior.','A later manual summary remains owned by the editor');
   });
   await test(bundle+'-manual-minor-opt-out',async()=>{
    await setup(bundle);await adjust();eq(await read('document.getElementById("wpMinoredit").checked'),true,'The initial code-only adjustment is minor');await toggle('#wpMinoredit');await read('__rw219UI.write('+JSON.stringify(plain)+')');await adjust();eq(await read('__rw219UI.read()'),clean,'A subsequent source still receives code repairs');eq(await read('document.getElementById("wpMinoredit").checked'),false,'A manual minor opt-out is respected');
   });
   await test(bundle+'-minor-large-mechanical-change',async()=>{
    const source=largeSource,expected=largeExpected;await setup(bundle,source);await adjust();eq(await read('__rw219UI.read()'),expected,'A larger mechanical edit preserves every sentence');eq(await read('document.getElementById("wpMinoredit").checked'),true,'Minor marking is not limited by byte size');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Large-edit Undo restores every byte');
   });
   await test(bundle+'-preferred-reference-collector',async()=>{
    const source='Texto<ref>Fonte sintética.</ref>\n\n<references/>';await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');ok(text.includes('{{Referências}}'),'A native tag becomes the preferred collector');ok(!/<references\b/i.test(text),'No parallel raw collector remains');ok(text.includes('<ref>Fonte sintética.</ref>'),'The full reference body remains');
   });
   await test(bundle+'-upper-alpha-preserved',async()=>{
    const source='Texto{{efn-ua|name=nota|Nota sintética.}}<ref>Fonte sintética.</ref>\n== Notas ==\n{{notelist-ua}}\n{{Referências}}';await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');ok(text.includes('{{efn-ua|name=nota|Nota sintética.}}'),'The note producer remains complete');ok(text.includes('upper-alpha'),'The exact group is preserved');ok(!text.includes('{{notelist-ua}}'),'The approved bare collector alias normalizes');ok(/\{\{(?:Referências|Notas e referências)/.test(text),'A preferred native collector is used');
   });
   for(const state of ['exists','missing'])await test(bundle+'-strict-portal-'+state,async()=>{
    const source="{{Info/Universidade|nome=Exemplo}}\n\n'''Exemplo''' é uma universidade.\n";await setup(bundle,source,{v2212Portal:state});await adjust();const text=await read('__rw219UI.read()');eq(/\{\{Portal3\|[^{}]*Educação/.test(text),state==='exists','A portal is added only with the expected existence proof');ok(text.includes("'''Exemplo''' é uma universidade."),'The complete statement is preserved');ok((await read('__rw219UI.requests')).some(r=>r.parameters.action==='query'&&r.parameters.prop==='imageinfo'&&r.parameters.titles.includes('Portal:Educação')),'The actual preflight requests the destination');const cfg=await read('__rw219UI.nativeWitnessJobs.at(-1).job.options');eq(cfg.v2212PortalProofRequired,true,'The actual Worker receives the strict portal requirement');eq(cfg.v2212PortalAvailability.sourceHash,cfg.v2212OriginalDraftHash,'The portal proof retains its original draft binding');eq(cfg.v2212PortalAvailability.exists.includes('Educação'),state==='exists','The Worker receives the actual positive or negative destination evidence');
   });
   await test(bundle+'-repaired-book-field-before-portal-classification',async()=>{
    const source="{{Info/Livro|nome=Exemplo|genero=Romance}}\n\n'''Exemplo''' é um romance.\n";
    await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');
    ok(/(?:\||\n)[ \t]*gênero[ \t]*=[ \t]*Romance/.test(text),'The native genre field is repaired before classification');
    ok(/\{\{Portal3\|[^{}]*Literatura/.test(text),'The later literature candidate uses the original task existence proof');
    const expected=['Literatura','Música','Educação','Televisão','Jornalismo','Geografia','Guerra','Tecnologias de informação','Futebol','Esportes','Arte','Ciência','Carros','Numismática','Política','Meteorologia','Cerveja','Exploração espacial','Animação','Alemanha','Biografias','Bioquímica','Física','Matemática'].map(name=>'Portal:'+name).sort();
    const queries=(await read('__rw219UI.requests')).filter(r=>r.parameters.action==='query'&&r.parameters.prop==='imageinfo');
    ok(queries.some(r=>JSON.stringify(r.parameters.titles.split('|').filter(t=>t.startsWith('Portal:')).sort())===JSON.stringify(expected)),'The preflight consults the complete finite universe of24 destinations');
   });
   await test(bundle+'-portal-aliases',async()=>{await setup(bundle,'Texto.\n{{Portal3|Germany|Numismatics|Money}}\n');await adjust();const text=await read('__rw219UI.read()');ok(text.includes('Alemanha'),'A confirmed country portal uses its native name');ok(text.includes('Numismática'),'A confirmed subject portal uses its native name');ok(text.includes('Money'),'An unconfirmed meaning is preserved');});
   const imageCases=[
    {id:'commons-shared',origin:'commons.wikimedia.org',state:'shared',eligible:true},
    {id:'pt-local',origin:'pt.wikipedia.org',state:'local',eligible:true},
    {id:'pt-shared',origin:'pt.wikipedia.org',state:'shared',eligible:true},
    {id:'pt-alias',origin:'pt.wikipedia.org',state:'alias',eligible:true},
    {id:'commons-local-shadow',origin:'commons.wikimedia.org',state:'local',eligible:false},
    {id:'commons-different-title-alias',origin:'commons.wikimedia.org',state:'alias',eligible:false},
    {id:'foreign-shared',origin:'en.wikipedia.org',state:'shared',eligible:false},
    {id:'foreign-local',origin:'en.wikipedia.org',state:'local',eligible:false},
    ...['missing','empty','incomplete','badfile'].map(state=>({id:state,origin:'commons.wikimedia.org',state,eligible:false}))
   ];
   for(const item of imageCases)await test(bundle+'-imageinfo-'+item.id,async()=>{
    const source=image.replace('commons.wikimedia.org',item.origin),eligible=item.eligible;
    await setup(bundle,source,{v2212Image:item.state});await adjust();const actual=await read('__rw219UI.read()');eq(actual,eligible?imageFixed:source,'Image conversion requires both usable availability and a proven source identity');const jobs=await read('__rw219UI.workerResults');ok(jobs.length>0,'The image test still runs the real Worker');const cfg=await read('__rw219UI.nativeWitnessJobs.at(-1).job.options'),nativeAvailable=['shared','local','alias'].includes(item.state);eq(cfg.v2212VerifiedFiles.length,nativeAvailable?1:0,'Usable local availability is transmitted even when it does not prove foreign source identity');if(nativeAvailable){eq(cfg.v2212VerifiedFiles[0].sourceHash,cfg.v2212OriginalDraftHash,'File proof transport keeps the original draft hash');ok(typeof cfg.v2212VerifiedFiles[0].canonicalTitle==='string','File proof retains the resolved native title');}if(eligible){eq(await read('__rw219UI.summary()'),'Minúcias','A proved image recovery uses the normal summary');eq(await read('document.getElementById("wpMinoredit").checked'),true,'The proved recovery is minor');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores the entire original image target/options/caption');}
   });
   await test(bundle+'-image-proof-with-independent-link-change',async()=>{
    const source=plain+'\n'+image,expected=clean+'\n'+imageFixed;await setup(bundle,source,{v2212Image:'shared'});await adjust();eq(await read('__rw219UI.read()'),expected,'A source-bound file proof survives an independent earlier link repair');eq(await read('document.getElementById("wpMinoredit").checked'),true,'The combined tool-only changes remain minor');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'The combined repair can be undone byte for byte');
   });
   await test(bundle+'-options-disabled',async()=>{
    const source='Texto.\n\n== Ligações externas ==\n'+Array.from({length:8},(_,i)=>'* Item '+(i+1)).join('\n')+'\n';await setup(bundle,source);const selector='input[data-option="endMatterColumns"]';await openParents(selector);ok(await read('!!document.querySelector('+JSON.stringify(selector)+')'),'The option remains accessible');if(await read('document.querySelector('+JSON.stringify(selector)+').checked'))await toggle(selector);await adjust();eq(await read('__rw219UI.read()'),source,'A disabled option does not insert columns');
   });
   await test(bundle+'-staged-executor',async()=>{await setup(bundle,plain,{},'staged');await adjust();eq(await read('__rw219UI.read()'),clean,'The production staged executor has the same endpoint');eq(await read('RevisaWiki.processing.engine'),'staged','A browser without Worker uses the real staged executor');});
   await test(bundle+'-cancel',async()=>{await load(bundle,'slow','classic',{v2212Source:JSON.stringify(image)});await click('.ajg-run');await waitFor('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")==="true"','Analysis started');await click('.ajg-stop');await settled();eq(await read('__rw219UI.read()'),image,'Cancellation preserves the complete draft');eq(await read('__rw219UI.summary()'),'','Cancellation applies no summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Cancellation preserves the minor choice');});
   await test(bundle+'-stale-draft',async()=>{await load(bundle,'race','classic',{v2212Source:JSON.stringify(image)});await click('.ajg-run');await waitFor('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")==="true"','Analysis started');const manual=image+'\nEdição manual.';await read('__rw219UI.write('+JSON.stringify(manual)+')');await settled();eq(await read('__rw219UI.read()'),manual,'An earlier result never overwrites a newer complete draft');});
  }
  if(browserName==='Chrome'&&process.env.REVISAWIKI_UI_REAL_WATCHDOG==='1'&&report.status==='passed')await test('real-60000ms-watchdog-actual-worker-late-result',async()=>{
   await setup('core',plain,{v2212HoldWorker:'1'});await read('(()=>{__rw219UI.setSummary("Resumo antes do prazo.");document.getElementById("wpMinoredit").checked=true;return true})()');const started=Date.now();await click('.ajg-run');await waitFor('(__rw219UI.heldActualResults||0)===1','The actual Worker result is retained');await waitFor('/demorou demais/.test(document.querySelector(".ajg-status")?.textContent||"")','Unchanged production watchdog',75000);await settled();const elapsed=Date.now()-started;ok(elapsed>=59000&&elapsed<74000,'The actual unmodified 60-second UI deadline expires');eq(await read('__rw219UI.read()'),plain,'Timeout preserves every draft byte');eq(await read('__rw219UI.summary()'),'Resumo antes do prazo.','Timeout preserves the prior summary');eq(await read('document.getElementById("wpMinoredit").checked'),true,'Timeout preserves the prior minor flag');const manual=plain+'\nEdição posterior.';await read('(()=>{__rw219UI.write('+JSON.stringify(manual)+');return __rw219UI.releaseActualResult()})()');await delay(180);eq(await read('__rw219UI.read()'),manual,'Editing continues and the late Worker callback cannot overwrite it');report.realUiWatchdog={deadlineMilliseconds:60000,elapsedMilliseconds:elapsed,actualWorkerResultHeldInFictionalTransport:true,extremeArticleUsed:false,calculationTimeoutClaim:false,draftSummaryMinorAndFurtherEditingPreserved:true};
  });
  report.pageErrors=driver.errors||[];report.blockedNetwork=driver.blocked||[];eq(report.actualNetworkMutations,0,'No network write');eq(report.pageErrors,[],'No browser runtime error');eq(report.clipboardWrites,0,'No clipboard write');
 }catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:String(error.message)});}
 finally{
  try{if(browserName==='Safari'&&driver.session){await driver.request('DELETE','/session/'+driver.session);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.status='failed';report.failures.push({id:'owned-session-cleanup',message:String(error.message)});}
  await new Promise(resolve=>server.close(resolve));report.testCount=report.tests.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
 }
})();
`;
const adapted=prefix+'\n'+body,compiled=new Module(currentPath,module);compiled.filename=currentPath;compiled.paths=Module._nodeModulePaths(path.dirname(currentPath));
if(process.env.REVISAWIKI_UI_COMPILE_ONLY==='1')new(require('node:vm').Script)(adapted,{filename:__filename});else compiled._compile(adapted,currentPath);
