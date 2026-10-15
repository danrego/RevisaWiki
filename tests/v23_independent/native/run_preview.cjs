'use strict';
// Real native Mac browsers, a CommonJS-exported local frozen release, actual DOMParser.
// No edit UI/account is opened. CSP, Chrome/Firefox routing and the pure payload forbid remote requests.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {NativeFirefox,NativeChrome,NativeSafari,delay}=require('./native_driver.cjs');
const artifactDir=path.join(__dirname,'..','artifacts','native');fs.mkdirSync(artifactDir,{recursive:true});
const root=path.resolve(__dirname,'../../..'),name=process.argv[2]||'Chrome',script=path.join(root,'dist/2.3.0/RevisaWiki_v2_3_completo.js');
const source=fs.readFileSync(script),scriptSha256=crypto.createHash('sha256').update(source).digest('hex'),payload=fs.readFileSync(path.join(__dirname,'../preview_browser_tests.js'),'utf8');
const payloadSha256=crypto.createHash('sha256').update(payload).digest('hex');
const realFiles={beforeSource:'render_example_before.wiki',afterSource:'render_example_pipeline_after.wiki',beforeHtml:'render_example_before.html',afterHtml:'render_example_pipeline_after.html'};const realFixture=Object.fromEntries(Object.entries(realFiles).map(([key,file])=>[key,fs.readFileSync(path.join(root,'tests/fixtures/v23',file),'utf8')]));const realHashes=Object.fromEntries(Object.entries(realFixture).map(([key,value])=>[key,crypto.createHash('sha256').update(value).digest('hex')]));
const html='<!doctype html><html lang="pt"><meta charset="utf-8"><title>RevisaWiki · conferência local de estrutura</title><h1>Teste local de pré-visualização</h1><p>Sem contas, edições ou pedidos à Wikipédia.</p><script src="/init.js"></script><script src="/release.js"></script><script src="/ready.js"></script></html>';
const init="window.module={exports:{}};window.__qaErrors=[];window.addEventListener('error',e=>__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>__qaErrors.push(String(e.reason)));window.__qaRemote=[];window.fetch=(...args)=>{__qaRemote.push(args);throw new Error('Network request forbidden by pure test fixture')};";
const server=http.createServer((req,res)=>{const file=new URL(req.url,'http://localhost').pathname;const body={'/':html,'/init.js':init,'/release.js':source,'/ready.js':'window.__realFixture='+JSON.stringify(realFixture)+';window.RevisaWiki=module.exports;window.__qaReady=true;'}[file];if(body===undefined){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self'; img-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'"});res.end(body);});
const driver=new ({Chrome:NativeChrome,Firefox:NativeFirefox,Safari:NativeSafari}[name])();
let report={browser:name,scriptSha256,payloadSha256,realFixtureSha256:realHashes,wikipediaWrites:0,requestsToWikimedia:0};
(async()=>{try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 await driver.start(origin);report.browserVersion=driver.version;await driver.navigate(origin+'/');
 for(let i=0;i<500;i++){if(await driver.evaluate('Boolean(window.__qaReady)'))break;await delay(20);}
 assert(await driver.evaluate('Boolean(window.RevisaWiki&&window.RevisaWiki.version==="2.3.0")'),'Frozen release exported correctly');
 const result=JSON.parse(await driver.evaluate('(async()=>JSON.stringify(await '+payload.trim()+'))()'));
 const safety=JSON.parse(await driver.evaluate('JSON.stringify({errors:__qaErrors,remote:__qaRemote})'));
 report={...report,...result,safety,blockedRequests:driver.blocked||[],finishedAt:new Date().toISOString()};
 assert.equal(safety.errors.length,0,'No browser JS errors');assert.equal(safety.remote.length,0,'No remote API requests attempted');
 fs.writeFileSync(path.join(artifactDir,name.toLowerCase()+'_preview_results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,tests:report.tests.filter(x=>!x.passed)}));if(result.failed)process.exitCode=1;
 }catch(e){report.error=e.stack;report.failed=report.failed||1;fs.writeFileSync(path.join(artifactDir,name.toLowerCase()+'_preview_results.json'),JSON.stringify(report,null,2)+'\n');console.error(e.stack);process.exitCode=1;}
 finally{await driver.close();server.closeAllConnections?.();await new Promise(r=>server.close(r));}
})();
