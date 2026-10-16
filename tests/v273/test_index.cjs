'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const playwright=require(process.env.REVISAWIKI_PLAYWRIGHT||'playwright');
const candidate=require('./candidate.cjs');
candidate.verify();
const file=path.join(candidate.root,'dist/2.7.3/INICIO.html');
let checks=0;const verify=(condition,message)=>{checks++;assert(condition,message);};
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
(async()=>{
 const browser=await playwright.chromium.launch({headless:true,channel:'chrome',args:['--disable-background-networking','--no-first-run']});
 const outside=[];let report;
 try{
  const context=await browser.newContext();
  await context.route('**/*',route=>{const url=route.request().url();if(url===pathToFileURL(file).href)return route.continue();outside.push(url);return route.abort();});
  await context.addInitScript(()=>{
   window.__testCopies=[];
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__testCopies.push(text)}});
   document.execCommand=()=>false;
  });
  const page=await context.newPage();
  await page.goto(pathToFileURL(file).href);
  const payload=await page.evaluate(()=>JSON.parse(document.getElementById('payloads').textContent));
  verify(Object.keys(payload).length===5,'Five complete copy cards');
  verify(await page.locator('button[data-copy]').count()===15,'Fifteen copy controls');
  verify(JSON.stringify(await page.locator('.grid > article').evaluateAll(nodes=>nodes.map(n=>n.id)))===JSON.stringify(['dados','programa','central','documentacao']),'Installation order');
  for(const [id,item]of Object.entries(payload)){
   const bytes=fs.readFileSync(path.join(candidate.root,'dist/2.7.3',item.filename));
   verify(item.text===bytes.toString('utf8'),id+' exact full content');
   verify(item.sha256===sha(bytes),id+' exact hash');
   verify(item.bytes===bytes.length,id+' exact byte length');
   for(const kind of ['text','summary','destination']){
    await page.locator('button[data-id="'+id+'"][data-copy="'+kind+'"]').click();
    const copied=await page.evaluate(()=>window.__testCopies.at(-1));
    verify(copied===item[kind],id+' '+kind+' complete click result');
   }
   const href=await page.locator('#'+id+' a[href*="action=edit"]').getAttribute('href');
   const url=new URL(href);
   verify(url.origin==='https://pt.wikipedia.org',id+' correct editor origin');
   verify(url.searchParams.get('title')===item.destination,id+' correct editor title');
   verify(url.searchParams.get('action')==='edit',id+' opens editor only');
  }
  await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw new Error('Manual fallback');};});
  await page.locator('button[data-id="programa"][data-copy="text"]').click();
  verify(await page.locator('#viewer').evaluate(el=>el.open),'Manual fallback is available');
  verify(await page.locator('#viewer-text').inputValue()===payload.programa.text,'Manual fallback retains full code');
  verify(await page.locator('#viewer-text').evaluate(el=>el.selectionStart===0&&el.selectionEnd===el.value.length),'Manual fallback selects the complete code');
  await page.locator('#close-viewer').click();
  verify(!await page.locator('#viewer').evaluate(el=>el.open),'Manual fallback closes');
  verify(await page.evaluate(()=>!window.RevisaWiki&&!window.RevisaWikiDataV2),'Copy payloads never execute the tool');
  verify(outside.length===0,'No external request');
  report={version:'2.7.3',runtimeVersion:'2.7.3',status:'passed',checks,browserVersion:browser.version(),indexSha256:sha(fs.readFileSync(file)),clipboardImplementation:'in-memory test stub',systemClipboardWrites:0,externalRequests:outside.length,wikipediaWrites:0,screenshots:0};
  fs.writeFileSync(path.join(candidate.artifactDirectory(),'copy_index.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(error=>{console.error(candidate.sanitized(error.message));process.exitCode=1;});
