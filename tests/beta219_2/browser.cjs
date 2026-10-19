'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {NativeChrome,NativeFirefox,NativeSafari}=require('../v261/browser/native_driver.cjs');
const root=path.resolve(__dirname,'../..'),version='2.19.0-beta.2',sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const browser=process.argv[2]||'chrome',Drivers={chrome:NativeChrome,firefox:NativeFirefox,safari:NativeSafari};assert(Drivers[browser]);
const report={version,browser,status:'running',checks:0,cases:[],adaptations:[],wikipediaWrites:0,mainValidationResumed:false,screenshots:0};
const out=path.join(root,'tests/evidence',version),routes=new Map();fs.mkdirSync(out,{recursive:true});
const save=()=>fs.writeFileSync(path.join(out,'browser-'+browser+'.json'),JSON.stringify(report,null,2)+'\n');
const directory=path.join(root,'dist',version),driver=new Drivers[browser]();
const fixture=fs.readFileSync(path.join(root,'tests/v2130/browser/fixture.js'),'utf8')
 .replace("  const source=scenario==='large'?pageSource.replace('A luz atravessa o meio.','A luz atravessa o meio.\\n'.repeat(8000)):pageSource;","  const source=params.get('source')||pageSource;")
 .replace('wgNamespaceNumber:0,','wgNamespaceNumber:Number(params.get(\'namespace\')||0),')
 .replace('  window.RevisaWikiConfig={authorityControl:false,endTemplateOrder:false,links:false};','  window.RevisaWikiConfig={authorityControl:false,endTemplateOrder:false,autoPreview:false,registryDoiCheck:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false};');
const html=fs.readFileSync(path.join(root,'tests/v2130/browser/fixture.html'),'utf8')
 .replace('<script src="/jquery.js"></script>','<form id="editform"><input id="wpMinoredit" type="checkbox"><button id="wpSave" type="submit">Publicar página</button></form><script src="/jquery.js"></script>');
const hostGuard="if (host ? host !== 'pt.wikipedia.org' : root.mw.config.get('wgDBname') !== 'ptwiki') return;";
const moduleGuard="if (!root.mw?.loader || (root.location?.hostname || root.mw.config?.get('wgServerName')) !== 'pt.wikipedia.org') return;";
function adapt(raw){let s=raw;assert(s.includes(hostGuard));s=s.replace(hostGuard,"if (host ? !['pt.wikipedia.org','127.0.0.1'].includes(host) : root.mw.config.get('wgDBname') !== 'ptwiki') return;");if(s.includes(moduleGuard))s=s.replace(moduleGuard,"if (!root.mw?.loader || !['pt.wikipedia.org','127.0.0.1'].includes(root.location?.hostname || root.mw.config?.get('wgServerName'))) return;");return s;}
for(const name of ['jquery.js','textSelection.js'])routes.set(name,fs.readFileSync(path.join(root,'tests/v261/browser',name)));
routes.set('fixture.js',Buffer.from(fixture));
const server=http.createServer((req,res)=>{if(req.method!=='GET'){report.nonGetRequests=(report.nonGetRequests||0)+1;res.writeHead(403).end();return;}const name=new URL(req.url,'http://localhost').pathname.slice(1),data=routes.get(name);if(!data){res.writeHead(name==='favicon.ico'?204:404).end();return;}res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'self' blob:; form-action 'none'; img-src 'self'"});res.end(data);});
const evaluate=code=>driver.evaluate('(async()=>{const assert=(value,label)=>{__rw26QA.assertions=(__rw26QA.assertions||0)+1;if(!value)throw Error(label)};const wait=async fn=>{for(let n=0;n<1000;n++){if(fn())return;await new Promise(r=>setTimeout(r,15));}throw Error("Local UI timeout")};'+code+'})()');
let origin='';
async function test(name,fn){let start=0;try{start=Number(await driver.evaluate('__rw26QA.assertions||0'));await fn();const checks=Number(await driver.evaluate('__rw26QA.assertions||0'))-start;report.checks+=checks;report.cases.push({name,status:'passed',checks});}catch(error){report.cases.push({name,status:'failed',message:String(error.message).replaceAll(root,'<checkout>')});}save();}
async function open(source,namespace=1,mode=''){await driver.navigate(origin+'/fixture.html?scenario=native-editor&namespace='+namespace+'&source='+encodeURIComponent(source)+(mode?'&mode='+mode:''));await evaluate('await wait(()=>window.RevisaWiki&&document.querySelector(".ajg-run"));assert(RevisaWiki.version==="'+version+'","The beta version is visible in the loaded API");');}
async function safe(){await evaluate('assert(__rw26QA.saveCalls.length===0&&__rw26QA.submits===0,"Nothing was submitted");assert(__rw26QA.forbiddenNetwork.length===0,"Only read API calls occurred");assert(__rw26QA.clipboardWrites===0,"The UI tests never use the system clipboard");assert(__rw26QA.errors.length===0&&__rw26QA.policyViolations.length===0,"No page or policy errors");');}
(async()=>{try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
 for(const suffix of ['.js','_completo.js']){
  const name='RevisaWiki_v2_19_0_beta_2'+suffix,raw=fs.readFileSync(path.join(directory,name),'utf8');routes.set('production.js',Buffer.from(adapt(raw)));routes.set('core.js',Buffer.from(adapt(raw)));
  routes.set('data.js',fs.readFileSync(path.join(directory,'RevisaWiki_v2_19_0_beta_2_dados.js')));
  routes.set('fixture.html',Buffer.from(html.replace('<script src="/production.js"></script>',suffix==='.js'?'<script src="/data.js"></script><script src="/production.js"></script>':'<script src="/production.js"></script>')));
  report.adaptations.push({file:name,runtimeSha256:sha(raw),adaptedSha256:sha(adapt(raw)),changes:['Loopback origin allowlist only'],editingLogicRewritten:false});
  for(const alias of ['pd','Página de discussão','Template:Página_de_discussão']){
   const source='{{'+alias+'|1=preservar}}\n== Conversa ==\nTexto literal.\n';await open(source);
   await driver.click('.ajg-prepare-talk');await test(name+': existing '+alias,async()=>{await evaluate('await wait(()=>!document.querySelector(".ajg-prepare-talk").disabled);assert(document.getElementById("wpTextbox1").value==='+JSON.stringify(source)+',"The real discussion button retains the original alias and body");assert(document.getElementById("wpSummary").value==="","An unchanged draft gets no automatic summary");');await safe();});
  }
  const initial='Portal da física Portal da tecnologia Portal da ciência\n== Conversa ==\nTexto literal.\n',expected='{{PD}}\n{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}\n== Conversa ==\nTexto literal.\n';
  await open(initial);await driver.click('.ajg-prepare-talk');await test(name+': create and undo',async()=>{
   await evaluate('await wait(()=>!document.querySelector(".ajg-prepare-talk").disabled);assert(document.getElementById("wpTextbox1").value==='+JSON.stringify(expected)+',"The complete expected header is inserted");assert(document.getElementById("wpSummary").value==="{{PD}}{{Marca de projeto}}","The requested edit summary is filled");');
   await driver.click('.ajg-undo');await evaluate('await wait(()=>document.querySelector(".ajg-status").textContent==="Texto anterior ao ajuste restaurado.");assert(document.getElementById("wpTextbox1").value==='+JSON.stringify(initial)+',"Undo restores every original source byte");assert(document.getElementById("wpSummary").value==="","Undo restores the summary");');await safe();
  });
  const outside='== Conversa ==\nTexto literal.\n{{Página de discussão}}\n';await open(outside);await driver.click('.ajg-prepare-talk');await test(name+': displaced header',async()=>{await evaluate('await wait(()=>!document.querySelector(".ajg-prepare-talk").disabled);assert(document.getElementById("wpTextbox1").value==='+JSON.stringify(outside)+',"No duplicate is added outside the prefix");');await safe();});
  const article='Texto.<ref>{{Cite web|title=Fonte literal|url=https://example.test/a}}</ref>\n\n{{Referências}}';await open(article,0);await driver.click('.ajg-run');await test(name+': real Worker editing',async()=>{await evaluate('await wait(()=>__rw26QA.workerResults.length&&!document.querySelector(".ajg-run").disabled);assert(RevisaWiki.processing.engine==="worker","The real browser Worker performed the calculation");assert(document.getElementById("wpTextbox1").value.includes("Citar web"),"The inherited article action still runs");assert(!document.querySelector(".ajg-prepare-talk"),"Talk-only controls stay out of articles");');await safe();});
 }
 // Exercise all three real loader payloads against the isolated local API.
 routes.set('fixture.html',Buffer.from(html.replace('<script src="/production.js"></script>','<script src="/fixed.js"></script>')));
 routes.set('fixed.js',fs.readFileSync(path.join(directory,'Chamada_fixa_RevisaWiki_beta_common.js')));
 routes.set('central.js',fs.readFileSync(path.join(directory,'Carregador_comunitario_RevisaWiki_v2_19_0_beta_2.js')));
 routes.set('core.js',Buffer.from(adapt(fs.readFileSync(path.join(directory,'RevisaWiki_v2_19_0_beta_2.js'),'utf8'))));
 await open('{{Página de discussão}}\n',1,'loader-beta');await test('isolated beta loader chain',async()=>{await evaluate('assert(__rw26QA.scriptRequests.some(x=>new URL(x,location.href).searchParams.get("title")==="User:Daniel G Rego/RevisaWiki/Beta/Carregador.js"),"The bootstrap requests only the beta loader");assert(__rw26QA.scriptRequests.some(x=>new URL(x,location.href).searchParams.get("title")==="User:Daniel G Rego/RevisaWiki/Beta.js"),"The loader requests only the beta core");assert(RevisaWikiLoadInfo.expectedVersion==="'+version+'","The central loader verifies the exact beta version");');await safe();});
 }catch(error){report.runnerError=String(error.message).replaceAll(root,'<checkout>');}
 finally{try{await driver.close();report.ownedSessionClosed=true;}catch(error){report.cleanupError=String(error.message).replaceAll(root,'<checkout>');}server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));report.blockedExternalRequests=driver.blocked?.length||0;report.status=report.cases.length===13&&report.cases.every(x=>x.status==='passed')&&!report.runnerError&&!report.cleanupError&&!report.nonGetRequests&&!report.blockedExternalRequests?'passed':'failed';save();console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;}
})();
