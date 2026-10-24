'use strict';
// Open the portable file itself. No content server, wiki or account is used.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {NativeChrome,NativeFirefox,NativeSafari,delay}=require('../v261/browser/native_driver.cjs');
const browser=process.argv[2],portable=path.resolve(process.argv[3]),snapshot=path.resolve(process.argv[4]),root=path.resolve(__dirname,'../..'),
 sha=raw=>crypto.createHash('sha256').update(raw).digest('hex'),raw=fs.readFileSync(portable),html=raw.toString(),
 fixturesRaw=fs.readFileSync(path.join(__dirname,'demo_examples.json')),fixtures=JSON.parse(fixturesRaw),
 embedded=id=>JSON.parse(html.match(new RegExp('<script type="application/json" id="'+id+'">([\\s\\S]*?)</script>'))[1]),
 book=embedded('demo-book'),engine=Buffer.from(embedded('demo-engine'),'base64'),pins=JSON.parse(fs.readFileSync(path.join(snapshot,'expected_release_v2210.json'))),
 enginePin=pins.files.RevisaWiki_v2_21_0_completo_js||pins.files['RevisaWiki_v2_21_0_completo.js'];
assert.equal(sha(engine),enginePin.sha256);assert.equal(engine.length,enginePin.bytes);assert.deepEqual(book.examples,fixtures);assert.equal(book.fixtureSha256,sha(fixturesRaw));assert.equal(book.version,'2.21.0');
assert(html.includes("connect-src 'none'"));assert(!/<script\b[^>]*\bsrc=/i.test(html));
const Driver={Chrome:NativeChrome,Firefox:NativeFirefox,Safari:NativeSafari}[browser];assert(Driver,'A supported native browser is required');const driver=new Driver();
const report={kind:'portable-offline-demonstration-native',version:'2.21.0',browser,status:'passed',portableSha256:sha(raw),engineSha256:sha(engine),fixtureSha256:sha(fixturesRaw),adapterSha256:sha(fs.readFileSync(path.join(root,'src/demo_v221/motor.js'))),runnerSha256:sha(fs.readFileSync(__filename)),examples:fixtures.length,cases:[],checks:0,failures:[],contentServersStarted:0,wikipediaWrites:0,accountActions:0,screenshots:0};
if(browser==='Firefox')driver.click=selector=>require('../v219/browser/stable_native_pointer_click.cjs')(driver,selector,(report.stableNativeClicks??=[]));
const read=async expression=>{const result=await driver.evaluate('(async()=>JSON.stringify(await('+expression+')))()');return typeof result==='string'?JSON.parse(result):result;},eq=(actual,expected,message)=>{report.checks++;assert.deepEqual(actual,expected,message);},ok=(value,message)=>{report.checks++;assert(value,message);};
async function waitFor(expression,label){const started=Date.now();while(Date.now()-started<60000){if(await read(expression))return;await delay(50);}throw Error('60-second deadline: '+label);}
async function click(selector){await driver.click(selector);if(browser==='Safari')await driver.request('DELETE','/session/'+driver.session+'/actions');}
(async()=>{
 try{
  await driver.start(pathToFileURL(path.dirname(portable)).href);await driver.navigate(pathToFileURL(portable).href);report.browserVersion=driver.version;
  await waitFor('document.getElementById("version")?.textContent==="2.21.0"&&!document.getElementById("run")?.disabled','portable page ready');
  eq(await read('location.protocol'),'file:','The portable file opens without an HTTP content server');
  await read('(()=>{window.__demoPolicyViolations=[];document.addEventListener("securitypolicyviolation",event=>__demoPolicyViolations.push({directive:event.violatedDirective,blocked:event.blockedURI}));return true})()');
  for(const item of fixtures){const started=Date.now();try{
   await read('(()=>{const f=document.getElementById("family");f.value='+JSON.stringify(item.family)+';f.dispatchEvent(new Event("change",{bubbles:true}));const e=document.getElementById("example");e.value='+JSON.stringify(item.id)+';e.dispatchEvent(new Event("change",{bubbles:true}));return true})()');
   eq(await read('document.getElementById("source").value'),item.source,'The independent original is selected');eq(await read('document.getElementById("source").readOnly'),true,'The example source is read-only');
   await click('#run');await waitFor('document.getElementById("run").textContent==="Exemplo revisado"||!document.getElementById("run").disabled','example result');
   eq(await read('document.getElementById("result").hidden'),false,'The real worker result reaches the viewer');eq(await read('document.getElementById("after").textContent'),item.expected,'Exact independent expected endpoint');eq(await read('document.getElementById("source").value'),item.source,'The original example remains available');
   eq(await read('document.getElementById("difference").hidden'),item.source===item.expected,'Comparison is offered only for an actual change');
   if(item.source!==item.expected){await click('#difference');eq(await read('document.getElementById("diff").hidden'),false,'The actual comparison control opens');ok((await read('document.getElementById("diff-code").textContent')).length>0,'Comparison has visible code');}
   await click('#restore');eq(await read('document.getElementById("source").value'),item.source,'Restore retains exact original bytes');eq(await read('document.getElementById("result").hidden'),true,'Restore clears the prior result');eq(await read('document.getElementById("run").disabled'),false,'The example can be run again');
   report.cases.push({id:item.id,status:'passed',sourceSha256:sha(item.source),expectedSha256:sha(item.expected),milliseconds:Date.now()-started});
  }catch(error){report.status='failed';report.cases.push({id:item.id,status:'failed',milliseconds:Date.now()-started});report.failures.push({id:item.id,message:String(error.message),status:await read('document.getElementById("status")?.textContent')});}
   if(process.env.REVISAWIKI_DEMO_NATIVE_PROGRESS)fs.writeFileSync(process.env.REVISAWIKI_DEMO_NATIVE_PROGRESS,JSON.stringify({browser,cases:report.cases,checks:report.checks,failures:report.failures},null,2));
  }
  eq(await read('window.__demoPolicyViolations'),[],'The offline controls trigger no forbidden resource operation');
  const remote=await read('performance.getEntriesByType("resource").filter(entry=>/^https?:/i.test(entry.name)).map(entry=>entry.name)');eq(remote,[],'No HTTP resource is used by the portable demonstration');report.remoteResourceEntries=remote;
 }catch(error){report.status='failed';report.failures.push({id:'browser-or-portable-load',message:String(error.message)});}
 finally{
  try{if(browser==='Safari'&&driver.session){await driver.request('DELETE','/session/'+driver.session);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.status='failed';report.failures.push({id:'owned-session-cleanup',message:String(error.message)});report.ownedBrowserSessionClosed=false;}
  report.blockedNetwork=driver.blocked||[];report.pageErrors=driver.errors||[];
  if(report.pageErrors.length){report.status='failed';report.failures.push({id:'page-errors',messages:report.pageErrors});}
  process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
 }
})();
