'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const playwright=require(process.env.REVISAWIKI_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'../..'),version='2.15.0',release=path.join(root,'dist',version),file=path.join(release,'INICIO.html');
const pinFile=path.join(root,'tests/expected_release_v2150.json'),manifest=JSON.parse(fs.readFileSync(pinFile,'utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const pins=()=>{assert.equal(manifest.version,version);assert.equal(manifest.runtimeVersion,version);for(const [name,expected]of Object.entries(manifest.files)){const bytes=fs.readFileSync(path.join(release,name));assert.equal(bytes.length,expected.bytes,name+' pinned bytes');assert.equal(sha(bytes),expected.sha256,name+' pinned SHA-256');}return sha(fs.readFileSync(pinFile));};
const original=path.join(root,'tests/v2130/test_index.cjs'),before={manifest: pins(),index:sha(fs.readFileSync(file))};
let checks=0;const verify=(condition,message)=>{checks++;assert(condition,message);};
const output=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2150'));
const sanitized=value=>String(value).replaceAll(root,'<local-path>').replaceAll(process.cwd(),'<local-path>');
(async()=>{
 const browser=await playwright.chromium.launch({headless:true,channel:'chrome',args:['--disable-background-networking','--no-first-run']});
 const outside=[],pageErrors=[];let report;
 try{
  const context=await browser.newContext();
  await context.route('**/*',route=>{const url=route.request().url();if(url===pathToFileURL(file).href)return route.continue();outside.push(url.split(':',1)[0]+' request');return route.abort();});
  await context.addInitScript(()=>{
   window.__testCopies=[];window.__testExecCommands=[];
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__testCopies.push(text)}});
   document.execCommand=command=>{window.__testExecCommands.push(command);return false;};
  });
  const page=await context.newPage();page.on('pageerror',error=>pageErrors.push(sanitized(error.message)));
  await page.goto(pathToFileURL(file).href);
  const payload=await page.evaluate(()=>JSON.parse(document.getElementById('payloads').textContent));
  verify(Object.keys(payload).length===5,'Five complete copy cards');
  verify(await page.locator('button[data-copy]').count()===15,'Fifteen copy controls');
  verify(JSON.stringify(await page.locator('.grid > article').evaluateAll(nodes=>nodes.map(node=>node.id)))===JSON.stringify(['dados','programa','central','documentacao']),'Installation order');
  const payloadHashes={};
  for(const [id,item]of Object.entries(payload)){
   const bytes=fs.readFileSync(path.join(release,item.filename));
   verify(item.text===bytes.toString('utf8'),id+' exact full content');
   verify(item.sha256===sha(bytes),id+' exact file hash');
   verify(item.bytes===bytes.length,id+' exact byte length');
   payloadHashes[id]={filename:item.filename,bytes:bytes.length,sha256:sha(bytes)};
   for(const kind of ['text','summary','destination']){
    await page.locator('button[data-id="'+id+'"][data-copy="'+kind+'"]').click();
    verify(await page.evaluate(()=>window.__testCopies.at(-1))===item[kind],id+' '+kind+' complete click result');
   }
   const href=await page.locator('#'+id+' a[href*="action=edit"]').getAttribute('href'),url=new URL(href);
   verify(url.origin==='https://pt.wikipedia.org',id+' correct editor origin');
   verify(url.searchParams.get('title')===item.destination,id+' correct editor title');
   verify(url.searchParams.get('action')==='edit',id+' opens editor only');
  }
  verify(await page.locator('a.raw-source').count()===5,'Each copy card has a raw-source view');
  verify((await page.locator('body').innerText()).includes('RevisaWiki '+version),'The visible index identifies the current release');
  await page.locator('details.notice > summary').click();
  verify(await page.locator('details.notice').evaluate(element=>element.open),'The optional size-warning explanation opens on demand');
  verify((await page.locator('body').innerText()).includes('102400'),'The visual-warning threshold is visible after opening its explanation');
  for(const [id,item]of Object.entries(payload)){
   const href=await page.locator('#'+id+' a.raw-source').getAttribute('href'),url=new URL(href);
   verify(url.origin==='https://pt.wikipedia.org',id+' raw view origin');
   verify(url.searchParams.get('title')===item.destination,id+' raw view destination');
   verify(url.searchParams.get('action')==='raw',id+' raw view action');
   verify(url.searchParams.get('ctype')===(item.filename.endsWith('.js')?'text/javascript':'text/plain'),id+' raw MIME');
  }
  const geometry=[];
  for(const width of [320,375,768,1280,1920]){
   await page.setViewportSize({width,height:900});
   const shape=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth,cards:[...document.querySelectorAll('article.card')].map(element=>{const box=element.getBoundingClientRect();return {left:box.left,right:box.right,width:box.width};})}));
   verify(shape.document<=shape.viewport+1&&shape.body<=shape.viewport+1,'No horizontal page overflow at '+width+' pixels');
   verify(shape.cards.length===5&&shape.cards.every(card=>card.left>=-1&&card.right<=shape.viewport+1&&card.width>0),'All five cards fit at '+width+' pixels');
   geometry.push(shape);
  }
  await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw new Error('Manual fallback');};});
  await page.locator('button[data-id="programa"][data-copy="text"]').click();
  verify(await page.locator('#viewer').evaluate(element=>element.open),'Manual fallback is available');
  verify(await page.locator('#viewer-text').inputValue()===payload.programa.text,'Manual fallback retains full code');
  verify(await page.locator('#viewer-text').evaluate(element=>element.selectionStart===0&&element.selectionEnd===element.value.length),'Manual fallback selects the complete code');
  for(const width of [320,1920]){
   await page.setViewportSize({width,height:900});
   const shape=await page.locator('#viewer').evaluate(element=>{const box=element.getBoundingClientRect();return {left:box.left,right:box.right,viewport:innerWidth,document:document.documentElement.scrollWidth};});
   verify(shape.left>=-1&&shape.right<=shape.viewport+1&&shape.document<=shape.viewport+1,'The full-code viewer fits at '+width+' pixels');
  }
  await page.locator('#close-viewer').click();
  verify(!await page.locator('#viewer').evaluate(element=>element.open),'Manual fallback closes');
  verify(await page.evaluate(()=>!window.RevisaWiki&&!window.RevisaWikiDataV2),'Copy payloads never execute the tool');
  verify(await page.evaluate(()=>window.__testCopies.length)===15,'All fifteen successful copies use only the in-memory stub');
  verify(await page.evaluate(()=>window.__testExecCommands.length)===1,'The deliberate unavailable-copy case reaches only the stubbed manual fallback');
  verify(pageErrors.length===0,'No page error');verify(outside.length===0,'No external request');
  verify(pins()===before.manifest,'The complete runtime pin is unchanged after the browser test');
  verify(sha(fs.readFileSync(file))===before.index,'The delivered index is unchanged after the browser test');
  report={version,status:'passed',checks,browserVersion:browser.version(),manifestSha256:before.manifest,indexSha256:before.index,payloadHashes,geometry,clipboardImplementation:'in-memory test stub',systemClipboardWrites:0,externalRequests:outside.length,wikipediaWrites:0,screenshots:0,pageErrors,adaptation:{source:'tests/v2130/test_index.cjs',sha256:sha(fs.readFileSync(original)),retained:'Full-payload/hash, fifteen-copy, installation-order, editor/raw-link, fallback and nonexecution assertions.',added:'Five narrow/wide geometry checks, dialog geometry, exact stub counts, page errors and before/after complete runtime pin verification.'}};
  fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'copy_index.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(error=>{const report={version,status:'failed',checks,error:sanitized(error.message),manifestSha256:before.manifest,indexSha256:before.index,wikipediaWrites:0,systemClipboardWrites:0,screenshots:0};fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'copy_index.json'),JSON.stringify(report,null,2)+'\n');console.error(JSON.stringify(report));process.exitCode=1;});
