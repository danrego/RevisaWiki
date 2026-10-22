'use strict';
// This suite opens only a loopback index and replaces clipboard operations.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const {NativeChrome,NativeFirefox,NativeSafari}=require(root+'/tests/v261/browser/native_driver.cjs');
const kind=process.argv[2],address=process.argv[3],Driver={chrome:NativeChrome,firefox:NativeFirefox,safari:NativeSafari}[kind];
if(!Driver)throw Error('Choose chrome, firefox or safari');
const target=new URL(address);if(target.protocol!=='http:'||target.hostname!=='127.0.0.1'||target.username||target.password)throw Error('Only a local loopback index is permitted');
const file=path.resolve(process.env.REVISAWIKI_DELIVERY_INDEX||root+'/dist/2.20.0/INICIO.html');
const metadataFile=path.join(path.dirname(file),'MANIFESTO.json'),metadataRaw=fs.readFileSync(metadataFile),metadata=JSON.parse(metadataRaw),d=new Driver();
const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const report={kind:'native-browser-copy-index',version:'2.20.0',artifactClass:process.env.REVISAWIKI_DELIVERY_ARTIFACT_CLASS||'local-preview',browser:kind,status:'running',indexSha256:sha(fs.readFileSync(file)),manifestSha256:sha(metadataRaw),cases:[],checks:0,wikipediaWrites:0,externalNavigation:0,realClipboardWrites:0,screenshots:0};
const destination=path.resolve(process.env.REVISAWIKI_DELIVERY_REPORT||root+'/artifacts/v220/delivery/index_'+kind+'.json');
if(fs.existsSync(destination))throw Error('Preserve old receipts and choose a fresh report path');
fs.mkdirSync(path.dirname(destination),{recursive:true});
const save=()=>fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
const ev=async expression=>JSON.parse(await d.evaluate('JSON.stringify('+expression+')'));
const check=(value,message)=>{report.checks++;assert(value,message);};
async function test(id,body){const item={id,status:'running'};report.cases.push(item);try{await body();item.status='passed';}catch(error){item.status='failed';item.message=error.message;report.status='failed';}save();}
(async()=>{save();try{
 const response=await fetch(target.href,{signal:AbortSignal.timeout(10_000)});check(response.ok,'The local index is reachable');
 const served=Buffer.from(await response.arrayBuffer());check(crypto.createHash('sha256').update(served).digest('hex')===report.indexSha256,'The served index is byte-identical to the tested file');
 await d.start(target.origin);report.browserVersion=d.version;
 if(kind==='safari'){const original=d.request.bind(d);d.request=async(method,route,data)=>{const result=await original(method,route,data);if(method==='DELETE'&&route==='/session/'+d.session)report.automationSessionDeleteConfirmed=true;return result;};}
 await d.navigate(target.href);
 check(await ev('document.title')==='RevisaWiki 2.20.0 · Instalação e arquivos','The expected current index is open');
 await d.evaluate('(()=>{window.__deliveryQA={writes:[],fallback:0};Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>{window.__deliveryQA.writes.push(text);}}});return true})()');
 const ids=await ev('Object.keys(JSON.parse(document.getElementById("payloads").textContent))');
 check(ids.length===7,'There are seven explicit paste cards');
 const complete='RevisaWiki_v2_20_0_completo.js';
 check(!(await ev('Object.values(JSON.parse(document.getElementById("payloads").textContent)).map(item=>item.filename)')).includes(complete),'The complete offline engine is not a paste card');
 for(const id of ids){
  const item=metadata.items.find(value=>value.filename===({dados:'RevisaWiki_v2_20_0_dados.js',programa:'RevisaWiki_v2_20_0.js',central:'Carregador_comunitario_RevisaWiki_v2_20_0.js',documentacao:'Documentacao_RevisaWiki_v2_20_0.wiki',chamada:'Chamada_fixa_RevisaWiki_common.js','central-propria':'Carregador_common_js_RevisaWiki_v2_20_0.js','chamada-propria':'Chamada_fixa_RevisaWiki_copia_propria.js'})[id]);
  check(!!item,'The card is bound to an installation manifest entry');
  const expected=fs.readFileSync(path.join(path.dirname(file),item.filename),'utf8');
  for(const type of ['text','summary','destination'])await test(id+'-copy-'+type,async()=>{
   const before=await ev('window.__deliveryQA.writes.length');await d.click('[data-id="'+id+'"][data-copy="'+type+'"]');
   const actual=await ev('window.__deliveryQA.writes.at(-1)');check(await ev('window.__deliveryQA.writes.length')===before+1,'One fictional clipboard write per click');
   check(actual===(type==='text'?expected:item[type]),'The complete exact copy payload reaches the fictional clipboard');
   check(await ev('!document.querySelector('+JSON.stringify('[data-id="'+id+'"][data-copy="'+type+'"]')+').disabled'),'The copy button is usable after the action');
  });
  await test(id+'-view',async()=>{
   await d.click('[data-view="'+id+'"]');check(await ev('document.getElementById("viewer").open'),'The viewer opens');check(await ev('document.getElementById("viewer-text").value')===expected,'The viewer retains the complete file');
   await d.click('#select-text');check(await ev('document.getElementById("viewer-text").selectionStart===0&&document.getElementById("viewer-text").selectionEnd===document.getElementById("viewer-text").value.length'),'Select all includes every character');await d.click('#close-viewer');check(await ev('!document.getElementById("viewer").open'),'The viewer closes');
  });
 }
 await test('manual-copy-fallback',async()=>{
  await d.evaluate('(()=>{navigator.clipboard.writeText=async()=>{throw Error("fictional rejection")};document.execCommand=()=>{window.__deliveryQA.fallback++;return false;};return true})()');
  await d.click('[data-id="chamada"][data-copy="text"]');check(await ev('window.__deliveryQA.fallback')===1,'A rejected clipboard uses the finite fallback once');check(await ev('document.getElementById("viewer").open'),'Manual copy remains available');check(await ev('/manual/.test(document.getElementById("status").textContent)'),'The manual-copy instruction is visible');await d.click('#close-viewer');
 });
 for(const width of [1280,768,375]){if(kind==='safari'&&width<600)continue;await test('viewport-'+width,async()=>{
  if(kind==='chrome')await d.page.setViewportSize({width,height:1000});else if(kind==='firefox')await d.command('browsingContext.setViewport',{context:d.context,viewport:{width,height:1000},devicePixelRatio:1});else await d.request('POST','/session/'+d.session+'/window/rect',{width,height:1000});
  const layout=await ev('({inner:innerWidth,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})');check(layout.scroll<=layout.client+1,'The index fits the tested viewport');(report.viewports||=[]).push({requested:width,...layout});
 });}
 check(!d.blocked.length,'No external destination was requested');check(!d.errors.length,'No uncaught browser error');report.blockedRequests=d.blocked.length;report.browserErrors=d.errors;
 check(sha(fs.readFileSync(file))===report.indexSha256,'The index did not change during the browser run');
 check(sha(fs.readFileSync(metadataFile))===report.manifestSha256,'The delivery manifest did not change during the browser run');
 if(report.status==='running')report.status='passed';
}catch(error){report.status=report.cases.length?'failed':'infrastructure-unavailable';report.message=error.message;}finally{await d.close();if(kind==='safari'&&d.session&&!report.automationSessionDeleteConfirmed){report.status='failed';report.cleanupError='Safari session deletion was not confirmed';}report.automationClosed=true;save();console.log(JSON.stringify({browser:kind,status:report.status,cases:report.cases.length,checks:report.checks,wikipediaWrites:0,automationSessionDeleteConfirmed:report.automationSessionDeleteConfirmed}));if(report.status!=='passed')process.exitCode=1;}})();
