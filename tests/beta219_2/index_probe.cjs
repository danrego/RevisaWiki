'use strict';
// Native-browser copy-index checks use a loopback document and an in-memory
// clipboard stub installed before the delivered index scripts can execute.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),http=require('node:http'),assert=require('node:assert/strict');
const {NativeChrome,NativeFirefox,NativeSafari}=require('../v261/browser/native_driver.cjs');
const root=path.resolve(__dirname,'../..'),version='2.19.0-beta.2',release=path.join(root,'dist',version),args=process.argv.slice(2),browser=(args.find(arg=>arg.startsWith('--browser='))||'--browser=chrome').split('=')[1].toLowerCase(),Drivers={chrome:NativeChrome,firefox:NativeFirefox,safari:NativeSafari};
assert(Drivers[browser],'A supported native browser is required');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),pinFile=path.join(root,'tests/expected_release_beta219_2.json'),indexFile=path.join(release,'INICIO.html'),output=path.resolve(process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2180/index/'+browser);
const report={version,kind:'independent-native-copy-index-probe',browser,status:'running',runnerSha256:sha(fs.readFileSync(__filename)),cases:[],checks:0,payloads:{},downloads:[],geometry:[],wikipediaWrites:0,systemClipboardWrites:0,screenshots:0,externalRequests:0,clipboardImplementation:'in-memory test stub'};
const save=()=>{fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'copy_index.json'),JSON.stringify(report,null,2)+'\n');};
let pin,index,origin,opened=false;
const cases=[
 {id:'dados',filename:'RevisaWiki_v2_19_0_beta_2_dados.js',destination:'Usuário:Daniel G Rego/RevisaWiki/Beta/Dados.js',summary:'Resumo_atualizacao_RevisaWiki_v2_19_0_beta_2.txt'},
 {id:'programa',filename:'RevisaWiki_v2_19_0_beta_2.js',destination:'Usuário:Daniel G Rego/RevisaWiki/Beta.js',summary:'Resumo_atualizacao_RevisaWiki_v2_19_0_beta_2.txt'},
 {id:'central',filename:'Carregador_comunitario_RevisaWiki_v2_19_0_beta_2.js',destination:'Usuário:Daniel G Rego/RevisaWiki/Beta/Carregador.js',summary:'Resumo_atualizacao_RevisaWiki_v2_19_0_beta_2.txt'},
 {id:'documentacao',filename:'Documentacao_RevisaWiki_v2_19_0_beta_2.wiki',destination:'Usuário:Daniel G Rego/RevisaWiki/Beta',summary:'Resumo_documentacao_RevisaWiki_v2_19_0_beta_2.txt'},
 {id:'carregador',filename:'Chamada_fixa_RevisaWiki_beta_common.js',destination:'Especial:Minha página/common.js',summary:'Resumo_atualizacao_RevisaWiki_v2_19_0_beta_2.txt'}
];
const setup=`<script>
window.__indexQA={copies:[],commands:[],errors:[],policyViolations:[],submits:0,externalClicks:0,opens:0,assertions:0};
Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>__indexQA.copies.push(text)}});
document.execCommand=command=>{__indexQA.commands.push(command);return false;};
window.open=()=>{__indexQA.opens++;throw Error('External windows are disabled in the local test');};
document.addEventListener('submit',event=>{event.preventDefault();__indexQA.submits++;});
document.addEventListener('click',event=>{const link=event.target.closest('a');if(link&&new URL(link.href,location.href).origin!==location.origin){event.preventDefault();__indexQA.externalClicks++;}},true);
for(const name of ['error','unhandledrejection'])window.addEventListener(name,event=>__indexQA.errors.push(String(event.message||event.reason)));
document.addEventListener('securitypolicyviolation',event=>__indexQA.policyViolations.push({directive:event.violatedDirective,blockedURI:event.blockedURI}));
</script>`;
const server=http.createServer((request,response)=>{
 if(request.method!=='GET'){report.nonGetRequests=(report.nonGetRequests||0)+1;response.writeHead(403).end();return;}
 const name=decodeURIComponent(new URL(request.url,'http://localhost').pathname.slice(1));
 if(name==='favicon.ico'){response.writeHead(204).end();return;}
 if(name==='index.html'&&index){response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});response.end(index);return;}
 if(!name||name!==path.basename(name)||!fs.existsSync(path.join(release,name))||!fs.statSync(path.join(release,name)).isFile()){response.writeHead(404).end();return;}
 response.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="'+name.replaceAll('"','')+'"'});response.end(fs.readFileSync(path.join(release,name)));
});
const driver=new Drivers[browser]();
// Safari enforces the page CSP even for eval called by a WebDriver script.
// Submit the fixed QA expression as the WebDriver script itself. The index,
// copying code and its production security policy stay unchanged.
if(browser==='safari'){
 report.driverAdaptation={source:'tests/v261/browser/native_driver.cjs',sourceSha256:sha(fs.readFileSync(path.join(root,'tests/v261/browser/native_driver.cjs'))),method:'NativeSafari.evaluate',change:'Execute the fixed QA expression directly through WebDriver instead of page eval',indexScriptsChanged:false,indexPolicyChanged:false};
 driver.evaluate=async function(expression){
  const script='var callback=arguments[arguments.length-1]; Promise.resolve().then(function(){return ('+expression+');}).then(function(value){callback({ok:true,value:value});},function(error){callback({ok:false,error:String(error&&error.message||error)+String(error&&error.stack||"")});});';
  const result=await this.request('POST','/session/'+this.session+'/execute/async',{script,args:[]});
  if(!result.ok)throw new Error(result.error);return result.value;
 };
}
const helper="const assert=(value,label)=>{__indexQA.assertions++;if(!value)throw Error(label)};const wait=async fn=>{for(let n=0;n<1000;n++){if(fn())return;await new Promise(resolve=>setTimeout(resolve,15));}throw Error('Copy-index timeout')};",evaluate=code=>driver.evaluate('(async()=>{'+helper+code+'})()');
const verify=(value,message)=>{report.checks++;assert(value,message);};
async function test(name,run){const before=opened?Number(await driver.evaluate('__indexQA.assertions||0')):0;try{await run();if(opened)report.checks+=Number(await driver.evaluate('__indexQA.assertions||0'))-before;report.cases.push({name,passed:true});}catch(error){report.cases.push({name,passed:false,error:String(error.message).replaceAll(root,'<checkout>')});}save();}
async function viewport(width,height){if(browser==='chrome')await driver.page.setViewportSize({width,height});else if(browser==='firefox')await driver.command('browsingContext.setViewport',{context:driver.context,viewport:{width,height},devicePixelRatio:1});else await driver.request('POST','/session/'+driver.session+'/window/rect',{width,height});}
(async()=>{try{
 pin=fs.readFileSync(pinFile);const manifest=JSON.parse(pin);assert.equal(manifest.version,version);
 for(const [name,expected]of Object.entries(manifest.files)){const bytes=fs.readFileSync(path.join(release,name));assert.equal(bytes.length,expected.bytes);assert.equal(sha(bytes),expected.sha256);}
 const original=fs.readFileSync(indexFile,'utf8');report.indexSha256=sha(original);report.manifestSha256=sha(pin);
 const csp="connect-src 'none'; base-uri 'none'; form-action 'none'";assert(original.includes(csp),'The expected local index policy must be present');assert(original.includes('<head>'),'The clipboard stub must precede delivered scripts');
 index=original.replace(csp,csp+"; img-src 'self'").replace('<head>','<head>'+setup);
 report.fixtureAdaptation={originalIndexSha256:sha(original),adaptedIndexSha256:sha(index),changes:['Install only in-memory clipboard and execCommand stubs before delivered index scripts','Prevent and record external link/window actions and form submissions','Allow the native browser own empty same-origin favicon'],copyOrIndexLogicChanged:false};
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;await driver.navigate(origin+'/index.html');opened=true;
 const meta=JSON.parse(await evaluate("await wait(()=>document.getElementById('payloads')&&document.querySelector('button[data-copy]'));const payload=JSON.parse(document.getElementById('payloads').textContent),output={};for(const [id,item]of Object.entries(payload)){const bytes=new TextEncoder().encode(item.text),digest=await crypto.subtle.digest('SHA-256',bytes);output[id]={...item,text:undefined,computedBytes:bytes.length,computedSha256:[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('')};}return JSON.stringify(output);"));
 await test('complete payloads, installation order and nonexecution',async()=>{
  verify(Object.keys(meta).length===5,'The index contains five complete copy payloads');
  for(const item of cases){const payload=meta[item.id],bytes=fs.readFileSync(path.join(release,item.filename)),summary=fs.readFileSync(path.join(release,item.summary),'utf8').trim();
   verify(!!payload,item.id+' exists');verify(payload.filename===item.filename,item.id+' exact downloadable file');verify(payload.destination===item.destination,item.id+' exact destination');verify(payload.summary===summary,item.id+' complete current edit summary');verify(payload.bytes===bytes.length&&payload.computedBytes===bytes.length,item.id+' complete UTF-8 byte count');verify(payload.sha256===sha(bytes)&&payload.computedSha256===sha(bytes),item.id+' complete untruncated file bytes');report.payloads[item.id]={filename:item.filename,bytes:bytes.length,sha256:sha(bytes)};
  }
  await evaluate("assert(document.querySelectorAll('button[data-copy]').length===15,'All fifteen copy controls exist');assert(JSON.stringify([...document.querySelectorAll('.grid > article')].map(node=>node.id))===JSON.stringify(['dados','programa','central','documentacao']),'The update cards use their intended order');assert(document.body.textContent.includes('RevisaWiki 2.19.0-beta.2'),'The index visibly names this release');assert(!window.RevisaWiki&&!window.RevisaWikiDataV2,'Embedded program and catalog payloads are never executed');");
 });
 for(const item of cases){
  await test(item.id+': three successful copy controls',async()=>{
   for(const kind of ['text','summary','destination']){await driver.click('button[data-id="'+item.id+'"][data-copy="'+kind+'"]');await evaluate(`const payload=JSON.parse(document.getElementById('payloads').textContent);await wait(()=>__indexQA.copies.at(-1)===payload[${JSON.stringify(item.id)}][${JSON.stringify(kind)}]);assert(__indexQA.copies.at(-1)===payload[${JSON.stringify(item.id)}][${JSON.stringify(kind)}],'The real button passes the complete payload to the in-memory clipboard');assert(!document.getElementById('viewer').open,'Successful copying does not open the fallback');`);}
  });
  await test(item.id+': exact editor, raw-source and download links',async()=>{
   const links=JSON.parse(await driver.evaluate(`JSON.stringify((()=>{const card=document.getElementById(${JSON.stringify(item.id)});return{editor:card.querySelector('a[href*="action=edit"]').href,raw:card.querySelector('a.raw-source').href,download:card.querySelector('a[download]').href,hasDownload:card.querySelector('a[download]').hasAttribute('download'),externalTarget:card.querySelector('a[href*="action=edit"]').target,externalRel:card.querySelector('a[href*="action=edit"]').rel}})())`)),editor=new URL(links.editor),raw=new URL(links.raw),download=new URL(links.download);
   verify(editor.origin==='https://pt.wikipedia.org'&&editor.searchParams.get('title')===item.destination&&editor.searchParams.get('action')==='edit',item.id+' exact editor destination');verify(raw.origin==='https://pt.wikipedia.org'&&raw.searchParams.get('title')===item.destination&&raw.searchParams.get('action')==='raw',item.id+' exact raw-source destination');verify(raw.searchParams.get('ctype')===(item.filename.endsWith('.js')?'text/javascript':'text/plain'),item.id+' raw source MIME');verify(links.externalTarget==='_blank'&&links.externalRel.includes('noopener'),item.id+' safe external target attributes');verify(download.origin===origin&&decodeURIComponent(download.pathname.slice(1))===item.filename&&links.hasDownload,item.id+' local complete-file download');
   const response=await fetch(download,{method:'GET',redirect:'error'}),data=Buffer.from(await response.arrayBuffer());verify(response.status===200&&data.equals(fs.readFileSync(path.join(release,item.filename))),item.id+' download returns all exact file bytes');report.downloads.push({filename:item.filename,status:response.status,bytes:data.length,sha256:sha(data)});
  });
  await driver.click('button[data-view="'+item.id+'"]');await test(item.id+': full-content viewer',()=>evaluate(`const payload=JSON.parse(document.getElementById('payloads').textContent);assert(document.getElementById('viewer').open,'The complete-source viewer opens');assert(document.getElementById('viewer-text').value===payload[${JSON.stringify(item.id)}].text,'The viewer contains the complete exact payload');`));await driver.click('#close-viewer');
 }
 await test('all fifteen successful copies remain mocked',()=>evaluate("assert(__indexQA.copies.length===15,'All fifteen successful copies use only the in-memory stub');assert(__indexQA.commands.length===0,'Successful copying never reaches a system fallback');assert(__indexQA.externalClicks===0&&__indexQA.opens===0&&__indexQA.submits===0,'Link inspection does not navigate or publish');"));
 for(const width of [320,375,768,1280,1920]){
  await viewport(width,900);await test('responsive cards at requested width '+width,async()=>{
   const shape=JSON.parse(await driver.evaluate('JSON.stringify({requested:'+width+',viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth,cards:[...document.querySelectorAll("article.card")].map(element=>{const r=element.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width};})})'));
   verify(shape.document<=shape.viewport+1&&shape.body<=shape.viewport+1,'The page fits the measured native viewport');verify(shape.cards.length===5&&shape.cards.every(card=>card.left>=-1&&card.right<=shape.viewport+1&&card.width>0),'Every card fits the measured native viewport');report.geometry.push(shape);
  });
 }
 await evaluate("navigator.clipboard.writeText=async()=>{throw Error('Intentional in-memory failure');};");
 for(const kind of ['text','summary','destination']){
  await driver.click('button[data-id="programa"][data-copy="'+kind+'"]');await test('manual fallback for '+kind,()=>evaluate(`const payload=JSON.parse(document.getElementById('payloads').textContent),area=document.getElementById('viewer-text');await wait(()=>document.getElementById('viewer').open);assert(area.value===payload.programa[${JSON.stringify(kind)}],'The fallback preserves the complete requested value');assert(area.selectionStart===0&&area.selectionEnd===area.value.length,'The complete fallback value is selected');assert(__indexQA.commands.at(-1)==='copy','Only the deliberately stubbed copy command is attempted');`));
  if(kind==='text')for(const width of [320,1920]){await viewport(width,900);await test('full-code fallback geometry at requested width '+width,async()=>{const shape=JSON.parse(await driver.evaluate('JSON.stringify((()=>{const r=document.getElementById("viewer").getBoundingClientRect();return{requested:'+width+',viewport:innerWidth,left:r.left,right:r.right,document:document.documentElement.scrollWidth};})())'));verify(shape.left>=-1&&shape.right<=shape.viewport+1&&shape.document<=shape.viewport+1,'The complete-code dialog fits the measured native viewport');report.geometry.push({...shape,kind:'full-code-dialog'});});}
  await evaluate("document.getElementById('viewer-text').setSelectionRange(1,2);");await driver.click('#select-text');await test('manual select-all control for '+kind,()=>evaluate("const area=document.getElementById('viewer-text');assert(area.selectionStart===0&&area.selectionEnd===area.value.length,'The explicit selection control selects all bytes');"));await driver.click('#close-viewer');
 }
 await driver.click('details.notice > summary');await test('optional warning explanation and safe final state',()=>evaluate("assert(document.querySelector('details.notice').open,'The optional size explanation opens');assert(document.body.textContent.includes('102400'),'The syntax-highlighter warning threshold is explained');assert(!document.getElementById('viewer').open,'The fallback viewer closes');assert(__indexQA.commands.length===3,'Only the three deliberate fallback scenarios call the stub');assert(__indexQA.copies.length===15,'Failed copies never call the real clipboard');assert(!window.RevisaWiki&&!window.RevisaWikiDataV2,'Viewing and copying still never execute the distributed program');assert(__indexQA.errors.length===0&&__indexQA.policyViolations.length===0,'No page or security-policy errors');assert(__indexQA.externalClicks===0&&__indexQA.opens===0&&__indexQA.submits===0,'No Wikipedia tab actions, external navigation or publishing');"));
 await test('local documentation and verification downloads',async()=>{
  const hrefs=JSON.parse(await driver.evaluate('JSON.stringify([...document.querySelectorAll("a[href]")].map(link=>link.href).filter(href=>new URL(href).origin===location.origin))'));
  for(const href of [...new Set(hrefs)]){const url=new URL(href),filename=decodeURIComponent(url.pathname.slice(1));verify(filename===path.basename(filename),'A local link targets an individual release file');const response=await fetch(href,{method:'GET',redirect:'error'}),data=Buffer.from(await response.arrayBuffer());verify(response.status===200&&data.equals(fs.readFileSync(path.join(release,filename))),'The release instruction/report/manifest download is exact');}
  const delivered=JSON.parse(fs.readFileSync(path.join(release,'MANIFESTO.json'),'utf8'));verify(delivered.version===version&&delivered.indexSha256===report.indexSha256&&delivered.sourceReleaseUnchanged===true,'The delivered manifest binds the exact index and release');verify(delivered.items.length===5,'The delivered manifest accounts for all five cards');for(const item of cases){const entry=delivered.items.find(row=>row.filename===item.filename);verify(!!entry&&entry.destination===item.destination&&entry.sha256===meta[item.id].computedSha256&&entry.bytes===meta[item.id].computedBytes,'Each manifest item binds the complete copy payload and destination');}
 });
 verify(sha(fs.readFileSync(pinFile))===sha(pin),'Runtime manifest remains unchanged');verify(sha(fs.readFileSync(indexFile))===report.indexSha256,'Delivered index remains unchanged');for(const [name,expected]of Object.entries(JSON.parse(pin).files))verify(sha(fs.readFileSync(path.join(release,name)))===expected.sha256,'Actual runtime remains pinned');
 }catch(error){report.runnerError=String(error.message).replaceAll(root,'<checkout>');}
 finally{if(opened)try{report.page=JSON.parse(await driver.evaluate('JSON.stringify({copies:__indexQA.copies.length,commands:__indexQA.commands.length,errors:__indexQA.errors,policyViolations:__indexQA.policyViolations,externalClicks:__indexQA.externalClicks,opens:__indexQA.opens,submits:__indexQA.submits})'));}catch(error){report.captureError=String(error.message).replaceAll(root,'<checkout>');}
  try{await driver.close();report.ownedSessionClosed=true;}catch(error){report.cleanupError=String(error.message).replaceAll(root,'<checkout>');}server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));report.externalRequests=driver.blocked?.length||0;report.status=report.cases.length===32&&report.cases.every(row=>row.passed)&&!report.externalRequests&&!report.nonGetRequests&&!report.runnerError&&!report.cleanupError&&!report.captureError?'passed':'failed';save();console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;
 }
})();
