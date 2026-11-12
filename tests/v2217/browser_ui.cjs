'use strict';
// The installed browsers use the real release bundles. Only the existing
// fictional editor/API adapter and exact loopback-host guards are adapted.
// All source fixtures are synthetic; production transforms and deadlines are unchanged.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const currentPath=path.resolve(__dirname,'../v219/browser/current_ui.cjs'),current=fs.readFileSync(currentPath,'utf8'),anchor='(async()=>{\n try{\n  report.caseFilter=';
if(current.split(anchor).length!==2)throw Error('The native harness entry point changed');
let prefix=current.slice(0,current.indexOf(anchor)).replaceAll('2.19.0','2.21.7').replaceAll('2_19_0','2_21_7').replaceAll('expected_release_v2190.json','expected_release_v2217.json');
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
const oldOutcome="document.querySelector(\".ajg-run\")?.dataset.codeChecked===\"true\"||/recusad|cancelad|mudou|preservad/.test(document.querySelector(\".ajg-status\")?.textContent||\"\")";
if(prefix.split(oldOutcome).length!==2)throw Error('The adjustment outcome boundary changed');
prefix=prefix.replace(oldOutcome,"document.querySelector(\".ajg-run\")?.dataset.codeChecked===\"true\"||/Nenhuma alteração automática aplicada|análise não terminou|limite de 60|cancelad|mudou|preservad/.test(document.querySelector(\".ajg-status\")?.textContent||\"\")");
const diagnosticAnchor='workerResults:window.__rw219UI?.workerResults?.length,';
if(prefix.split(diagnosticAnchor).length!==2)throw Error('The diagnostic boundary changed');
prefix=prefix.replace(diagnosticAnchor,diagnosticAnchor+'requests:window.__rw219UI?.requests,workerOptions:(window.__rw219UI?.nativeWitnessJobs||[]).map(m=>{const j=m.job||m;return{messageKeys:Object.keys(m),kind:j.kind,optionKeys:Object.keys(j.options||{}),autoMinor:j.options?.autoMinor,minorBaseConfirmed:j.options?.minorBaseConfirmed,minorAllToolChanges:j.options?.minorAllToolChanges,v2212OriginalDraftHash:j.options?.v2212OriginalDraftHash,v2212PortalProofRequired:j.options?.v2212PortalProofRequired,v2212PortalAvailability:j.options?.v2212PortalAvailability,v2212VerifiedFiles:j.options?.v2212VerifiedFiles}}),lastMinorCheck:window.__rw219UI?.workerResults?.at(-1)?.result?.minorCheck,workerEndpoints:(window.__rw219UI?.workerResults||[]).map(x=>({text:x.result?.text,recovery:x.result?.automaticRecovery,preservation:x.result?.preservation,safety:x.result?.localCompositionSafety,changes:x.result?.changes})),workerOptionSnapshots:(window.__rw219UI?.nativeWitnessJobs||[]).map(m=>m.job?.options),');
const body=String.raw`
report.kind='native-browser-v2217-automatic-only-interface';report.version='2.21.7';
report.originalHarnessSha256=sha(fs.readFileSync(${JSON.stringify(currentPath)}));report.runnerSha256=sha(fs.readFileSync(${JSON.stringify(__filename)}));
report.caseFilter=process.env.REVISAWIKI_UI_CASE_FILTER||null;
report.scope='Actual production UI, Worker, WebCrypto, summary/minor/undo ownership, destination proof protocol and complete draft preservation. Editor and API responses are local synthetic adapters; no live Wikipedia access or publication.';
const plain='Texto sobre [[Brasil|Brasil]], [[Portugal|Portugal]] e [[França|França]].',clean='Texto sobre [[Brasil]], [[Portugal]] e [[França]].';
const largeSource=Array.from({length:350},()=>plain).join('\n'),largeExpected=Array.from({length:350},()=>clean).join('\n');
const sourceAnchor='const source=sources[scenario]||sources.normal,qa=';
assert.equal(fixtureScript.toString().split(sourceAnchor).length,2);
let adaptedFixture=fixtureScript.toString().replace(sourceAnchor,"const source=params.get('v2212SourceKey')==='large'?"+JSON.stringify(largeSource)+":params.has('v2212Source')?JSON.parse(params.get('v2212Source')):sources[scenario]||sources.normal,qa=");
const namespaceAnchor="namespace=scenario==='talk'?1:scenario==='styles'||scenario==='template'?10:0";
assert.equal(adaptedFixture.split(namespaceAnchor).length,2);
adaptedFixture=adaptedFixture.replace(namespaceAnchor,"namespace=params.has('v2215Namespace')?Number(params.get('v2215Namespace')):scenario==='talk'?1:scenario==='styles'||scenario==='template'?10:0");
const titleAnchor="title=namespace===1?'Discussão:'+articleTitle:namespace===10?'Predefinição:Modelo fictício'+(scenario==='styles'?'/styles.css':''):articleTitle";
assert.equal(adaptedFixture.split(titleAnchor).length,2);
adaptedFixture=adaptedFixture.replace(titleAnchor,"title=params.has('v2215Title')?params.get('v2215Title'):namespace===1?'Discussão:'+articleTitle:namespace===10?'Predefinição:Modelo fictício'+(scenario==='styles'?'/styles.css':''):articleTitle");
const modelAnchor="wgPageContentModel:scenario==='styles'?'sanitized-css':'wikitext'";
assert.equal(adaptedFixture.split(modelAnchor).length,2);
adaptedFixture=adaptedFixture.replace(modelAnchor,"wgPageContentModel:params.get('v2215Model')||(scenario==='styles'?'sanitized-css':'wikitext')");
const nsApiAnchor="requestedTitle.startsWith('Discussão:')?1:0";
assert.equal(adaptedFixture.split(nsApiAnchor).length,2);
adaptedFixture=adaptedFixture.replace(nsApiAnchor,"requestedTitle.startsWith('Discussão:')?1:/^(?:User|Usuário|Usuária|Usuário\\(a\\)):/i.test(requestedTitle)?2:0");
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
    if(event.data?.type==='result'&&!qa.releasedActualResult){
     qa.heldActualResults=(qa.heldActualResults||0)+1;
     qa.releaseActualResult=()=>{qa.releasedActualResult=true;handler.call(this,event);return true;};return;
    }
    handler.call(this,event);
   };}
  };
 }
`+'`'+String.raw`;
const tamperedResult=String.raw`+'`'+String.raw`
 if(params.has('v2215Tamper')&&typeof window.Worker==='function'){
  const ActualWorker=window.Worker;
  window.Worker=class extends ActualWorker{
   set onmessage(handler){super.onmessage=event=>{
    if(event.data?.type==='result'&&typeof event.data.result?.text==='string'){
     const data=JSON.parse(JSON.stringify(event.data)),from=params.get('v2215Tamper')==='ref'?'https://example.org/original':'[[Brasil]]',to=params.get('v2215Tamper')==='ref'?'https://example.org/changed':'[[Outro alvo|Brasil]]';
     if(data.result.text.includes(from)){data.result.text=data.result.text.replace(from,to);qa.tamperedResults=(qa.tamperedResults||0)+1;handler.call(this,{data});return;}
    }
    handler.call(this,event);
   };}
  };
 }
`+'`'+String.raw`;
const checkpointHold=String.raw`+'`'+String.raw`
 if(params.get('v2215HoldMain')==='1'&&typeof window.Worker==='function'){
  const ActualWorker=window.Worker;
  window.Worker=class extends ActualWorker{
   postMessage(value,...rest){this.checkpointRequest=!!value?.job?.v2215Checkpoint;this.currentKind=value?.job?.kind;return super.postMessage(value,...rest);}
   set onmessage(handler){super.onmessage=event=>{
    if(event.data?.type==='result'&&this.currentKind==='adjust'&&!this.checkpointRequest){
     qa.heldMainResults=(qa.heldMainResults||0)+1;qa.releaseMainResult=()=>{handler.call(this,event);return true;};return;
    }
    handler.call(this,event);
   };}
  };
 }
`+'`'+String.raw`;
adaptedFixture=adaptedFixture.replace(fixtureEnd,heldResult+tamperedResult+checkpointHold+fixtureEnd);localFiles['current_fixture.js']=()=>Buffer.from(adaptedFixture);
report.adaptedFixtureScriptSha256=sha(adaptedFixture);report.adaptedScriptHashes=Object.fromEntries(Object.entries(scripts).map(([kind,source])=>[kind,sha(source)]));
report.fixtureAdapterChanges=['Initial complete fictional source comes from a small JSON query or a fixed large synthetic fixture before product startup.','Only query/imageinfo receives synthetic existence, alias and imageinfo responses.','The optional long-running case retains an actual completed Worker result in the fictional message transport; production code and clocks remain unchanged.','Two transport fault cases change only the actual completed Worker result text, retaining its original proof to test rejection; no writer, gate or production dispatcher is replaced.'];

const image='[[https://commons.wikimedia.org/wiki/File:Example_image.jpg|thumb|240px|Legenda literal.]]',imageFixed='[[Ficheiro:Example image.jpg|thumb|240px|Legenda literal.]]';
async function setup(bundle,source=plain,extra={},engine='worker'){
 const payload=source===largeSource?{v2212SourceKey:'large'}:{v2212Source:JSON.stringify(source)};
 await load(bundle,engine==='staged'?'fallback':'normal','classic',{...payload,nativeWitness:'1',preview:'1',...extra});
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
  async function noReviewUI(){
   eq(await read('document.querySelectorAll(".ajg-report,.ajg-review-area,.ajg-suggestions,.ajg-pending-list,.ajg-technical-info,.ajg-review-history,.ajg-not-applied,.ajg-style-choices,.ajg-recovery,.ajg-comparison,.ajg-before,.ajg-after").length'),0,'No advisory report, manual suggestion, recovery shell or duplicate diff exists');
   const text=await read('document.querySelector("#revisawiki-ptwiki").textContent');
   ok(!/Precisa de revisão|Ir ao trecho|Ignorar aviso|Recuperar descri|Confir[ae].{0,30}relatório|Stack trace/.test(text),'The visible panel has no pending issue, diagnostic reason or report instruction');
  }
  for(const bundle of ['core','complete']){
   await test(bundle+'-automatic-only-count-bytes-minor-summary-undo',async()=>{
    await setup(bundle);eq(await read('!!crypto.subtle&&typeof TextEncoder==="function"'),true,'Native WebCrypto and encoding are present');
    eq(await read('document.querySelectorAll("#revisawiki-ptwiki").length'),1,'Exactly one production panel');
    eq(await read('document.getElementById("wpSave").previousElementSibling.id'),'revisawiki-adjust-before-publish','The lower control precedes native publication');
    const colors=await restingColors();eq(colors[0],colors[1],'Both adjustment controls have the same resting color');
    await adjust();eq(await read('__rw219UI.read()'),clean,'All actual safe changes reach the complete editor');eq(await read('RevisaWiki.processing.engine'),'worker','The actual Worker executes the released engine');
    eq(await read('__rw219UI.summary()'),'Minúcias','The default summary remains exact');eq(await read('document.getElementById("wpMinoredit").checked'),true,'A tool-only edit is minor');
    eq(await read('document.querySelector(".ajg-result-count").textContent'),'3 ajustes aplicados','Every actual simple link correction counts once');
    const delta=Buffer.byteLength(clean)-Buffer.byteLength(plain);eq(await read('document.querySelector(".ajg-bytes").textContent'),(delta<0?'−':delta>0?'+':'')+Math.abs(delta)+' bytes','The displayed byte delta matches the final exact source');
    eq(await read('document.querySelector(".ajg-status").textContent'),'Código ajustado.','Applied outcome is short and factual');
    eq(await read('__rw219UI.nativeWitnessJobs[0].job.options.autoPreview'),true,'The normal UI retains native preview safety');await noReviewUI();
    await click('.ajg-show-changes');eq(await read('__rw219UI.nativeDiffClicks'),1,'The native diff control receives the click');
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),plain,'Undo restores every original byte');eq(await read('__rw219UI.summary()'),'','Undo restores owned summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Undo restores the prior minor flag');
   });
   await test(bundle+'-freshness-and-manual-edit-ownership',async()=>{
    await setup(bundle);await adjust();eq(await read('document.querySelector(".ajg-run").dataset.codeChecked'),'true','Adjusted source is recognized');eq(await read('document.getElementById("revisawiki-adjust-before-publish").dataset.codeChecked'),'true','Both controls share freshness');
    const manual=clean+' Edição manual.';await read('__rw219UI.write('+JSON.stringify(manual)+')');await waitFor('document.querySelector(".ajg-run").dataset.codeChecked!=="true"','A manual change invalidates freshness');eq(await read('__rw219UI.read()'),manual,'Freshness preserves the manual draft');
    eq(await read('document.querySelector(".ajg-result").hidden'),true,'Stale counts are not presented as current corrections');await noReviewUI();
   });
   await test(bundle+'-manual-summary-before-and-after',async()=>{
    await setup(bundle);await read('__rw219UI.setSummary("Resumo manual preservado.")');await adjust();eq(await read('__rw219UI.summary()'),'Resumo manual preservado.','A preexisting manual summary is preserved');
    await read('__rw219UI.setSummary("Resumo manual posterior.")');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),plain,'Undo restores source');eq(await read('__rw219UI.summary()'),'Resumo manual posterior.','Undo does not overwrite later manual summary');
   });
   await test(bundle+'-manual-minor-opt-out',async()=>{
    await setup(bundle);await adjust();await toggle('#wpMinoredit');await read('__rw219UI.write('+JSON.stringify(plain)+')');await adjust();eq(await read('__rw219UI.read()'),clean,'The independent source still receives corrections');eq(await read('document.getElementById("wpMinoredit").checked'),false,'A manual minor opt-out is preserved');
   });
   await test(bundle+'-larger-mechanical-edit',async()=>{
    await setup(bundle,largeSource);await adjust();eq(await read('__rw219UI.read()'),largeExpected,'Every sentence in the larger synthetic source is retained');eq(await read('document.getElementById("wpMinoredit").checked'),true,'Mechanical edit size does not disable minor marking');await noReviewUI();await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),largeSource,'Undo restores the complete larger source');
   });
   await test(bundle+'-preferred-reference-collector',async()=>{
    const source='Texto<ref>Fonte sintética.</ref>\n\n<references/>';await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');ok(text.includes('{{Referências}}'),'The preferred collector is used');ok(!/<references\b/i.test(text),'No raw parallel collector remains');ok(text.includes('<ref>Fonte sintética.</ref>'),'The original complete reference remains');await noReviewUI();
   });
   await test(bundle+'-unresolved-reference-is-preserved-without-alert',async()=>{
    const source='Texto<ref name="sem_definicao" />\n{{Referências}}';await setup(bundle,source);await adjust();eq(await read('__rw219UI.read()'),source,'An unresolved reference is not invented or deleted');eq(await read('document.querySelector(".ajg-status").textContent'),'Nenhuma alteração automática aplicada.','No safe change is reported without a pending issue');await noReviewUI();
   });
   await test(bundle+'-short-description-removal-without-recovery-ui',async()=>{
    const source='{{Descrição curta|Texto de demonstração}}\n'+plain;await setup(bundle,source);await adjust();eq(await read('__rw219UI.read()'),clean,'The obsolete description and its leading line are removed');await noReviewUI();ok(!/Texto de demonstração/.test(await read('document.querySelector("#revisawiki-ptwiki").textContent')),'The removed description is not reproduced in a recovery notice');
   });
   await test(bundle+'-portal-native-aliases-and-proof',async()=>{
    const source='Texto.\n{{Portal3|Germany|Numismatics|Money}}\n';await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');ok(text.includes('Alemanha'),'A verified country alias is normalized');ok(text.includes('Numismática'),'A verified topic alias is normalized');ok(text.includes('Money'),'An unverified interpretation is preserved');await noReviewUI();
   });
   for(const state of ['exists','missing'])await test(bundle+'-portal-availability-'+state,async()=>{
    const source="{{Info/Universidade|nome=Exemplo}}\n\n'''Exemplo''' é uma universidade.\n";await setup(bundle,source,{v2212Portal:state});await adjust();const text=await read('__rw219UI.read()');eq(/\{\{Portal3\|[^{}]*Educação/.test(text),state==='exists','A new portal requires actual destination availability');ok(text.includes("'''Exemplo''' é uma universidade."),'The factual statement is retained');await noReviewUI();
   });
   await test(bundle+'-literal-table-and-biography-content',async()=>{
    const source="{{Info/Biografia|nome=Pessoa de teste|ocupações=Físico|ocupacoes=Escritor}}\n'''Pessoa de teste''' é uma pessoa.\n\n{| class=\"wikitable\"\n! Nome !! Quantidade\n|-\n| Célula preservada || −3,5 km\n|}\n\n"+plain;await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');ok(/\|nome[ \t]*=Pessoa de teste(?:\r?\n|\||\}\})/.test(text),'The exact native identity value is retained with readable field alignment');ok(text.includes('Célula preservada')&&text.includes('−3,5 km'),'Literal table content, sign, decimal and units are retained');ok(/\|ocupações[ \t]*=físico(?:\r?\n|\||\}\})/i.test(text)&&/\|ocupacoes[ \t]*=Escritor(?:\r?\n|\||\}\})/.test(text),'Competing occupation values retain their separate exact keys');ok(text.includes(clean),'The independent link corrections remain');await noReviewUI();
   });
   await test(bundle+'-productive-options-remain-accessible',async()=>{
    const source='Texto.\n\n== Ligações externas ==\n'+Array.from({length:8},(_,i)=>'* Item '+(i+1)).join('\n')+'\n';await setup(bundle,source);for(const key of ['endMatterColumns','externalLinkColumns','autoPreview','references','tableChecks','dateChecks'])ok(await read('!!document.querySelector('+JSON.stringify('input[data-option="'+key+'"]')+')'),'Productive option '+key+' remains');eq(await read('!!document.querySelector("input[data-option=review]")'),false,'Manual review is not a selectable mode');
    const selector='input[data-option="endMatterColumns"]';await openParents(selector);if(await read('document.querySelector('+JSON.stringify(selector)+').checked'))await toggle(selector);await adjust();eq(await read('__rw219UI.read()'),source,'Disabling a productive column option is honored');await noReviewUI();
   });
   await test(bundle+'-article-draft-model-and-worker-options',async()=>{
    const source='Texto<ref>{{Citar web|title=Fonte|publisher=Instituição|date=8 February 2003}}</ref>\n== Referências ==\n<references/>';
    await setup(bundle,source,{v2215Namespace:'2',v2215Title:'Usuário:Conta de Teste/Testes',v2215Model:'wikitext'});await adjust();const text=await read('__rw219UI.read()');
    ok(text.includes('título=Fonte')&&text.includes('publicado=Instituição'),'Verified citation aliases execute in a bounded article draft');
    ok(text.includes('data=8 de fevereiro de 2003'),'The complete English date is localized in a bounded article draft');
    ok(text.includes('{{Referências}}')&&!text.includes('<references/>'),'The draft collector reaches the same preferred form');
    eq(await read('__rw219UI.nativeWitnessJobs[0].job.options.contentModel'),'wikitext','The actual Worker receives the explicit native content model');
    eq(await read('__rw219UI.nativeWitnessJobs[0].job.options.namespaceNumber'),2,'The actual Worker receives the draft namespace');
    eq(await read('document.getElementById("wpMinoredit").checked'),false,'The existing user-namespace minor setting is preserved');await noReviewUI();
    await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores every bounded draft byte');
   });
   await test(bundle+'-ordinary-user-subpage-excludes-new-draft-rules',async()=>{
    const source='{{Citar web|title=Fonte|publisher=Instituição}}';await setup(bundle,source,{v2215Namespace:'2',v2215Title:'Usuário:Conta de Teste/PU',v2215Model:'wikitext'});await adjust();
    eq(await read('__rw219UI.read()'),source,'An ordinary user profile does not opt into article draft corrections');await noReviewUI();
   });
   await test(bundle+'-staged-executor',async()=>{await setup(bundle,plain,{},'staged');await adjust();eq(await read('__rw219UI.read()'),clean,'The real staged executor has the same endpoint');eq(await read('RevisaWiki.processing.engine'),'staged','Worker absence uses the staged executor');await noReviewUI();});
   await test(bundle+'-preview-unavailable-keeps-locally-safe-result',async()=>{
    await setup(bundle);await read('__rw219UI.failParse=true');await adjust();eq(await read('__rw219UI.read()'),clean,'An unavailable preview does not discard the locally proved mechanical result');eq(await read('document.querySelector(".ajg-status").textContent'),'Código ajustado.','The displayed outcome describes the actual correction');await noReviewUI();
   });
   await test(bundle+'-preview-rejection-does-not-apply-unsafe-result',async()=>{
    await setup(bundle);await read('__rw219UI.newParseError=true');await adjust();eq(await read('__rw219UI.read()'),plain,'A confirmed new preview error does not promote the candidate');eq(await read('__rw219UI.summary()'),'','No rejected output gains an edit summary');eq(await read('document.querySelector(".ajg-status").textContent'),'Nenhuma alteração automática aplicada.','A rejected result has the same plain no-op status');await noReviewUI();
   });
   for(const kind of ['link','ref'])await test(bundle+'-tampered-worker-result-'+kind,async()=>{
    const source=kind==='ref'?plain+'\nTexto<ref>{{Citar web|título=Fonte sintética|url=https://example.org/original}}</ref>\n{{Referências}}':plain;
    await setup(bundle,source,{v2215Tamper:kind});await adjust();eq(await read('__rw219UI.read()'),source,'A completed Worker result with altered text and stale proof cannot overwrite the source');ok(await read('(__rw219UI.tamperedResults||0)>0'),'The test actually changed a completed Worker result');eq(await read('__rw219UI.summary()'),'','Rejected transport output does not fill the summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Rejected transport output does not take minor ownership');eq(await read('document.querySelector(".ajg-status").textContent'),'Nenhuma alteração automática aplicada.','Integrity rejection exposes no diagnostic reason');await noReviewUI();
   });
   await test(bundle+'-equal-named-reference-bodies-remain-equal',async()=>{
    const citation='{{Citar web|title=Fonte sintética|website=Obra|url=https://example.org/fonte}}';
    const source='A<ref name="fonte">'+citation+'</ref> B<ref name="fonte">'+citation+'</ref> C<ref name="fonte"/>\n== Referências ==\n<references/>';
    await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');
    ok(text.includes('título=Fonte sintética'),'Equivalent citation aliases still execute inside the named family');
    ok(text.includes('{{Referências}}'),'The independent preferred collector still executes');
    const bodies=[...text.matchAll(/<ref\s+name="fonte"\s*>([\s\S]*?)<\/ref>/g)].map(m=>m[1]);
    ok(bodies.length>0&&new Set(bodies).size===1,'A named reference family cannot acquire two raw bodies');await noReviewUI();
   });
   await test(bundle+'-cancel',async()=>{
    await load(bundle,'slow','classic',{v2212Source:JSON.stringify(image),preview:'1'});await click('.ajg-run');await waitFor('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")==="true"','Analysis started');await click('.ajg-stop');await settled();eq(await read('__rw219UI.read()'),image,'Cancellation preserves every draft byte');eq(await read('__rw219UI.summary()'),'','Cancellation preserves the summary');eq(await read('document.getElementById("wpMinoredit").checked'),false,'Cancellation preserves the minor flag');await noReviewUI();
   });
   await test(bundle+'-stale-draft',async()=>{
    await setup(bundle);await read('__rw219UI.parseDelay=500');await click('.ajg-run');await waitFor('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")==="true"','Analysis started');const manual=plain+'\nEdição manual posterior.';await read('__rw219UI.write('+JSON.stringify(manual)+')');await settled();eq(await read('__rw219UI.read()'),manual,'An earlier result cannot overwrite the newer complete draft');await noReviewUI();
   });
   await test(bundle+'-template-styles-no-op-baseline',async()=>{
    await load(bundle,'styles');eq(await read('document.querySelector(".ajg-check").textContent'),'Ajustar CSS','TemplateStyles also exposes a direct adjustment action');await click('.ajg-check');await settled();eq(await read('__rw219UI.read()'),'.caixa { color: red; border-color: #aaa; }','Valid CSS remains exactly intact');eq(await read('document.querySelector(".ajg-status").textContent'),'Nenhuma alteração automática aplicada.','A valid stylesheet has a plain no-op outcome');await noReviewUI();
   });
  }
  for(const bundle of ['core','complete'])await test(bundle+'-visible-progress-and-reference-count',async()=>{
   const source='Texto de teste<ref>Fonte de teste.</ref>\n== Referências ==\n<references/>';
   await setup(bundle,source);await read('__rw219UI.parseDelay=350');await click('.ajg-run');
   await waitFor('document.querySelector(".ajg-progress-indicator")?.hidden===false','The busy cue is visible');
   eq(await read('document.querySelector(".ajg-progress-indicator").getAttribute("aria-label")'),'Analisando o código','The cue has an accessible name');
   eq(await read('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")'),'true','The current operation is marked busy');
   await settled();eq(await read('__rw219UI.read()'),'Texto de teste<ref>Fonte de teste.</ref>\n{{Referências}}','The native collector is canonicalized');
   eq(await read('document.querySelector(".ajg-progress-indicator").hidden'),true,'The cue stops when processing ends');
   ok(await read('/^\\d+ ajustes? aplicados?$/.test(document.querySelector(".ajg-result-count").textContent)'),'The applied result displays a numeric count');
  });

  for(const bundle of ['core','complete'])await test(bundle+'-new-reference-chain-and-descriptive-name',async()=>{
   const source='Texto<ref name=":0">{{Citar web|ultimo=Silva|data=2026|título=Fonte|url=https://example.org/fonte}}</ref>. Outro<ref name=":0"/>.\n== Referências ==\n{{Reflist|2}}';
   await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');
   ok(text.includes('Texto.<ref name="Silva2026-1">'),'Punctuation and descriptive reference name reach the real editor');
   eq(text,'Texto.<ref name="Silva2026-1">{{Citar web|ultimo=Silva|data=2026|título=Fonte|url=https://example.org/fonte}}</ref> Outro.<ref name="Silva2026-1" />\n== Referências ==\n{{Referências|nível=0}}','The exact native collector endpoint retains one effective manual heading and the complete reference family');
   eq((text.match(/name="Silva2026-1"/g)||[]).length,2,'The complete definition/reuse family retains one identity');
   eq(await read('__rw219UI.summary()'),'Minúcias','Summary still describes the automatic action');
   await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores every original name, body and collector');await noReviewUI();
  });
  for(const bundle of ['core','complete'])await test(bundle+'-active-reference-in-quoted-owner-keeps-complete-family',async()=>{
   const source='Texto<ref name=":0">{{Citar web|ultimo=Silva|data=2026|título=Fonte|url=https://example.org/fonte}}</ref>.\n<blockquote>Trecho com referência<ref name=":0"/>.</blockquote>\nTexto sobre [[Brasil|Brasil]].\n{{Referências}}';
   await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');
   eq((text.match(/name=["\\\']?:0["\\\']?/g)||[]).length,2,'The definition and the active quoted reuse retain the same complete native name');
   ok(text.includes('<blockquote>Trecho com referência<ref name=":0"/>.</blockquote>'),'The protected quoted owner remains byte-exact');
   ok(text.includes('url=https://example.org/fonte'),'The complete original citation URL is retained');
   ok(text.includes('Texto sobre [[Brasil]].'),'The independent safe link adjustment still applies');
   ok(!/name="Silva2026/.test(text),'A partially observed family is not renamed');
   eq(await read('__rw219UI.summary()'),'Minúcias','The independent applied adjustment owns the usual summary');
   await noReviewUI();await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores the entire quoted family and original link');
  });
  for(const bundle of ['core','complete']){
   await test(bundle+'-nested-sort-producer-preserves-order-with-independent-fix',async()=>{
    const source='Texto sobre [[Brasil|Brasil]].\n{{DEFAULTSORT:A}}\n{{Navbox|name=Exemplo|title=Exemplo|list1={{DEFAULTSORT:B}}}}\n[[Categoria:Exemplo]]';
    await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');
    ok(text.includes('Texto sobre [[Brasil]].'),'Independent safe correction is applied beside an opaque sorting producer');
    ok(text.indexOf('{{DEFAULTSORT:A}}')<text.indexOf('{{Navbox|'),'The earlier explicit sort is not moved after a nested active sort');
    ok(text.includes('list1={{DEFAULTSORT:B}}'),'The nested producer is preserved exactly');
    await noReviewUI();await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores the complete nested sorting fixture');
   });
   await test(bundle+'-composite-sort-duplicates-across-state-preserved',async()=>{
    const source='Texto sobre [[Brasil|Brasil]].\n{{NM|1900|1980|A}}\n{{DEFAULTSORT:B}}\n{{NM|1900|1980|A}}\n{{Portal3|Biografias}}';
    await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');
    eq((text.match(/\{\{NM\|1900\|1980\|A\}\}/g)||[]).length,2,'A composite sorting call is not discarded across another state producer');
    ok(text.indexOf('{{NM|')<text.indexOf('{{DEFAULTSORT:B}}')&&text.lastIndexOf('{{NM|')>text.indexOf('{{DEFAULTSORT:B}}'),'The complete native sorting evaluation order is retained');
    ok(text.includes('Texto sobre [[Brasil]].'),'The independent correction reaches the editor without an overall refusal');
    await noReviewUI();await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores every original program and source byte');
   });
  }
  for(const bundle of ['core','complete'])await test(bundle+'-obsolete-owner-nested-programs-retained-with-independent-fix',async()=>{
   const source='{{Descrição curta|{{DEFAULTSORT:B}}}}\n{{Sem interwiki|{{NM|1980||C}}}}\nTexto sobre [[Brasil|Brasil]].\n[[Categoria:Um]]';
   await setup(bundle,source);await adjust();const text=await read('__rw219UI.read()');
   ok(text.includes('{{Descrição curta|{{DEFAULTSORT:B}}}}'),'An approved obsolete owner is retained when it contains a nested active sorting producer');
   ok(text.includes('{{Sem interwiki|{{NM|1980||C}}}}'),'The other obsolete-owner family retains its complete nested metadata program');
   ok(text.includes('Texto sobre [[Brasil]].'),'An unrelated safe link correction still applies');
   eq(await read('__rw219UI.summary()'),'Minúcias','Only the applied automatic adjustment owns the summary');
   await noReviewUI();await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores every original owner, program and link');
  });
  if(browserName==='Chrome'&&process.env.REVISAWIKI_UI_NO_DEADLINE_REAL==='1')await test('actual-worker-result-after-previous-60-second-boundary',async()=>{
   await setup('core',plain,{v2212HoldWorker:'1'});await read('(()=>{__rw219UI.setSummary("Resumo anterior.");return true})()');
   const started=Date.now();await click('.ajg-run');await waitFor('(__rw219UI.heldActualResults||0)===1','An actual completed Worker result is held in the synthetic transport');
   eq(await read('__rw219UI.read()'),plain,'The draft is untouched while processing');
   await delay(61500);
   eq(await read('document.querySelector("#revisawiki-ptwiki").getAttribute("aria-busy")'),'true','The previous 60-second boundary does not stop a live analysis');
   eq(await read('document.querySelector(".ajg-progress-indicator").hidden'),false,'The accessible activity cue remains visible');
   eq(await read('__rw219UI.read()'),plain,'Waiting never partially writes the draft');
   await read('__rw219UI.releaseActualResult()');await settled();
   eq(await read('__rw219UI.read()'),clean,'The complete verified result can be committed after 60 seconds');
   eq(await read('__rw219UI.summary()'),'Resumo anterior.','A manual summary remains intact');
   report.noFixedDeadline={elapsedMilliseconds:Date.now()-started,actualWorkerResultHeld:true,productionClockAndCodeUnmodified:true,draftPreservedWhileWaiting:true};await noReviewUI();
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
