'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),url=require('node:url'),assert=require('node:assert/strict');
// The historical assertions below are retained; the release and transport are explicit.
const http=require('node:http');
const root=path.resolve(__dirname,'../../..'),{NativeChrome,NativeFirefox,NativeSafari,delay}=require(root+'/tests/v261/browser/native_driver.cjs');
const kind=process.argv[2],variant=process.argv[3],Driver={chrome:NativeChrome,firefox:NativeFirefox,safari:NativeSafari}[kind];
if(!Driver||!['portable','served'].includes(variant))throw Error('Choose chrome, firefox or safari and portable or served');
if(!process.env.REVISAWIKI_DEMONSTRATION_DIRECTORY||!process.env.REVISAWIKI_BROWSER_REPORT)throw Error('Use explicit demonstration and fresh report paths');
const directory=path.resolve(process.env.REVISAWIKI_DEMONSTRATION_DIRECTORY),destination=path.resolve(process.env.REVISAWIKI_BROWSER_REPORT);
if(fs.existsSync(destination))throw Error('Preserve old receipts and choose a fresh report path');
fs.mkdirSync(path.dirname(destination),{recursive:true});
const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const bookFile=path.join(directory,'Demonstracao/exemplos.json'),bookRaw=fs.readFileSync(bookFile),book=JSON.parse(bookRaw),fixtureRaw=fs.readFileSync(root+'/tests/v220/demo_examples.json'),fixtureExamples=JSON.parse(fixtureRaw);
const engineFile=path.join(directory,'RevisaWiki_v2_20_0_completo.js'),engineRaw=fs.readFileSync(engineFile),manifest=JSON.parse(fs.readFileSync(root+'/tests/expected_release_v2200.json'));
assert.equal(book.version,'2.20.0');assert(Array.isArray(fixtureExamples)&&fixtureExamples.length>0,'A nonempty independently authored fixture set is required');assert.deepEqual(book.examples,fixtureExamples,'Every independently authored source and endpoint is retained');
assert.equal(book.fixtureSha256,sha(fixtureRaw));assert.equal(book.engineSha256,sha(engineRaw));assert.deepEqual(manifest.files[path.basename(engineFile)],{bytes:engineRaw.length,sha256:sha(engineRaw)});
const relativeFile=variant==='portable'?'Demonstracao_RevisaWiki_v2_20_0.html':'Demonstracao/DEMONSTRACAO.html';
const file=path.join(directory,relativeFile),bytes=fs.readFileSync(file),d=new Driver();
const report={kind:'native-browser-demonstration-release',version:'2.20.0',artifactClass:process.env.REVISAWIKI_DEMONSTRATION_ARTIFACT_CLASS||'local-preview',browser:kind,variant,status:'running',engineSha256:book.engineSha256,fixtureSha256:sha(fixtureRaw),htmlSha256:sha(bytes),plannedExamples:book.examples.length,cases:[],checks:0,wikipediaWrites:0,screenshots:0,realClipboardWrites:0,networkPolicy:variant==='portable'?'Standalone content security policy forbids every network connection':'Only the temporary loopback distribution is served'};
let server;
async function startLocalServer(){
 const allow=new Set(['Demonstracao/DEMONSTRACAO.html','Demonstracao/demonstracao.css','Demonstracao/demonstracao.js','Demonstracao/motor.js','Demonstracao/exemplos.json','RevisaWiki_v2_20_0_completo.js']);
 server=http.createServer((request,response)=>{
  let name;try{name=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname).slice(1);}catch{response.writeHead(400).end();return;}
  if(request.method!=='GET'||!allow.has(name)){response.writeHead(404).end();return;}
  const type=name.endsWith('.html')?'text/html':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/javascript';
  response.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store'});response.end(fs.readFileSync(path.join(directory,name)));
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});return 'http://127.0.0.1:'+server.address().port;
}
function check(value,msg){report.checks++;assert(value,msg);}const save=()=>fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n'),ev=async expression=>JSON.parse(await d.evaluate('JSON.stringify('+expression+')'));
(async()=>{save();try{
 let origin,address;if(variant==='served'){origin=await startLocalServer();address=origin+'/'+relativeFile;}else{origin=url.pathToFileURL(path.parse(file).root).href.replace(/\/$/,'');address=url.pathToFileURL(file).href;}
 await d.start(origin);report.browserVersion=d.version;
 if(kind==='safari'){const original=d.request.bind(d);d.request=async(method,route,data)=>{const result=await original(method,route,data);if(method==='DELETE'&&route==='/session/'+d.session)report.automationSessionDeleteConfirmed=true;return result;};}
 await d.navigate(address);
 for(let n=0;n<100;n++){const state=await ev('({ready:document.getElementById("family").options.length>0,status:document.getElementById("status").textContent})');if(state.ready)break;if(n===99)throw Error('Demo did not load: '+state.status);await delay(100);}
 for(const item of book.examples){const row={id:item.id,status:'running'};report.cases.push(row);try{
  await d.evaluate('(()=>{const family=document.getElementById("family");family.value='+JSON.stringify(item.family)+';family.dispatchEvent(new Event("change"));const example=document.getElementById("example");example.value='+JSON.stringify(item.id)+';example.dispatchEvent(new Event("change"));return true})()');
  check(await ev('document.getElementById("source").value')===item.source,'Exact selected preimage');await d.click('#run');const began=Date.now();
  for(;;){const state=await ev('({done:!document.getElementById("result").hidden,status:document.getElementById("status").textContent,source:document.getElementById("source").value})');check(state.source===item.source,'Original source retained during analysis');if(state.done)break;if(/precisa ser conferido|Não foi possível|não terminou|atingiu 60/.test(state.status))throw Error(state.status);if(Date.now()-began>65000)throw Error('Demo did not settle within production deadline');await delay(80);}
  check(await ev('document.getElementById("after").textContent')===item.expected,'Actual browser engine reaches independent expected endpoint');check(await ev('document.getElementById("run").disabled')===true,'Completed action prevents redundant click');
  if(item.expected!==item.source){await d.click('#difference');check(await ev('!document.getElementById("diff").hidden'),'Line diff opens on explicit click');check(await ev('document.querySelectorAll("#diff-code .added,#diff-code .removed").length')>0,'Diff contains changed lines');}
  await d.click('#restore');check(await ev('document.getElementById("source").value')===item.source,'Restore retains exact source');check(await ev('document.getElementById("result").hidden&&!document.getElementById("run").disabled'),'Restore enables a fresh action and clears prior result');row.status='passed';row.milliseconds=Date.now()-began;
 }catch(error){row.status='failed';row.error=error.message;report.status='failed';}save();}
 for(const width of [1280,768,375]){if(kind==='chrome')await d.page.setViewportSize({width,height:1000});else if(kind==='firefox')await d.command('browsingContext.setViewport',{context:d.context,viewport:{width,height:1000},devicePixelRatio:1});else if(width<600)continue;else await d.request('POST','/session/'+d.session+'/window/rect',{width,height:1000});const layout=await ev('({inner:innerWidth,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})');check(layout.scroll<=layout.client+1,'Document fits viewport');(report.viewports||=[]).push({requested:width,...layout});}
 report.blockedRequests=d.blocked;report.errors=d.errors;check(!d.blocked.length,'No request to any external location');check(!d.errors.length,'No uncaught browser error');
 check(sha(fs.readFileSync(file))===report.htmlSha256,'The HTML did not change during the browser run');check(sha(fs.readFileSync(engineFile))===report.engineSha256,'The engine did not change during the browser run');check(sha(fs.readFileSync(bookFile))===sha(bookRaw),'The example book did not change during the browser run');
 if(report.status==='running')report.status='passed';
 }catch(error){report.status=report.cases.length?'failed':'infrastructure-unavailable';report.error=error.message;}finally{await d.close();if(kind==='safari'&&d.session&&!report.automationSessionDeleteConfirmed){report.status='failed';report.cleanupError='Safari session deletion was not confirmed';}if(server)await new Promise(resolve=>server.close(resolve));report.automationClosed=true;save();console.log(JSON.stringify({browser:kind,variant,status:report.status,examples:report.cases.length,checks:report.checks,failed:report.cases.filter(c=>c.status!=='passed').length,error:report.error,automationSessionDeleteConfirmed:report.automationSessionDeleteConfirmed}));if(report.status!=='passed')process.exitCode=1;}})();
