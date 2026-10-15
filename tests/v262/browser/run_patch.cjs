'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {NativeChrome,NativeFirefox,NativeSafari,delay}=require('../../v261/browser/native_driver.cjs');
const browserName=process.argv[2]||'Chrome';
const dist=path.resolve(process.argv[3]);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const files={core:'RevisaWiki_v2_6_2.js',data:'RevisaWiki_v2_6_2_dados.js',central:'Carregador_comunitario_RevisaWiki_v2_6_2.js',personal:'Carregador_common_js_RevisaWiki_v2_6_2.js',shared:'Chamada_fixa_RevisaWiki_common.js',own:'Chamada_fixa_RevisaWiki_copia_propria.js'};
const pinsPath=path.resolve(__dirname,'../../expected_release_v262.json');
const pins=require(pinsPath);
assert.equal(pins.version,'2.6.2');
const releaseFiles={};
for(const [name,pin]of Object.entries(pins.files)){
 const bytes=fs.readFileSync(path.join(dist,name));
 assert.equal(hash(bytes),pin.sha256,'Frozen release hash: '+name);
 assert.equal(bytes.length,pin.bytes,'Frozen release bytes: '+name);
 releaseFiles[name]={sha256:hash(bytes),bytes:bytes.length};
}
const scripts={};for(const [kind,name]of Object.entries(files)){const bytes=fs.readFileSync(path.join(dist,name));assert(releaseFiles[name],'Required release pin: '+name);scripts[kind]={source:bytes.toString(),sha256:hash(bytes)};}
const cityBytes=fs.readFileSync(path.join(__dirname,'../fixtures/city_temperature/article.wiki'));
const cityPin=require('../fixtures/city_temperature/source_revision.json');
assert.equal(hash(cityBytes),cityPin.sha256);
assert.equal(cityBytes.length,cityPin.bytes);
const numericRows=text=>text.split('\n').filter(line=>/^\|[^|]*[-\d][^|]*\|\|/.test(line));
const cityNumericRows=numericRows(cityBytes.toString());
assert(cityNumericRows.length>400,'City fixture contains hundreds of real numeric rows');
const guard="if (host ? host !== 'pt.wikipedia.org' : root.mw.config.get('wgDBname') !== 'ptwiki') return;";
const moduleGuard="if (!root.mw?.loader || (root.location?.hostname || root.mw.config?.get('wgServerName')) !== 'pt.wikipedia.org') return;";
for(const kind of ['core']){assert(scripts[kind].source.includes(guard));scripts[kind].adapted=scripts[kind].source.replace(guard,"if (host ? !['pt.wikipedia.org','127.0.0.1','localhost'].includes(host) : root.mw.config.get('wgDBname') !== 'ptwiki') return;");}
assert(scripts.core.adapted.includes(moduleGuard));scripts.core.adapted=scripts.core.adapted.replace(moduleGuard,"if (!root.mw?.loader || !['pt.wikipedia.org','127.0.0.1','localhost'].includes(root.location?.hostname || root.mw.config?.get('wgServerName'))) return;");
for(const kind of ['core','central','personal','shared','own'])scripts[kind].readAdapted=(scripts[kind].adapted||scripts[kind].source).replace("root.location.hostname!=='pt.wikipedia.org'","!['pt.wikipedia.org','127.0.0.1','localhost'].includes(root.location.hostname)");

const driver=new({Chrome:NativeChrome,Firefox:NativeFirefox,Safari:NativeSafari}[browserName])();
let ownSafariSessionDeleteConfirmed=false;
if(browserName==='Safari'){
 const nativeRequest=driver.request.bind(driver);
 driver.request=async(method,route,data)=>{
  const value=await nativeRequest(method,route,data);
  if(method==='DELETE'&&driver.session&&route==='/session/'+driver.session)ownSafariSessionDeleteConfirmed=true;
  return value;
 };
}
const report={version:'2.6.2',build:'2.6.2',browser:browserName,startedAt:new Date().toISOString(),pinManifestSha256:hash(fs.readFileSync(pinsPath)),releaseFiles,hashes:Object.fromEntries(Object.entries(scripts).map(([k,v])=>[k,v.sha256])),cityFixture:{...cityPin,numericRows:cityNumericRows.length},adaptations:['Only the ptwiki host guards are extended to localhost for this isolated fixture.','All API responses are local mocks. No production text or parser logic is altered.'],tests:[],assertions:0,actualWikipediaWrites:0,actualNetworkMutations:0,screenshots:0,clipboardWrites:0,serverRequests:[]};
let mode='shared';
const server=http.createServer((req,res)=>{
 report.serverRequests.push({method:req.method,path:new URL(req.url,'http://localhost').pathname});
 if(req.method!=='GET'){report.actualNetworkMutations++;res.writeHead(403).end('Read only');return;}
 const name=new URL(req.url,'http://localhost').pathname.slice(1)||'fixture.html';
 const allowed=new Set(['fixture.html','fixture.js','jquery.js','textSelection.js','production.js','central.js','core.js','data.js','city.wiki']);if(!allowed.has(name)){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; form-action 'none'; frame-src 'none'"});
 res.end(name==='city.wiki'?cityBytes:name==='production.js'?scripts[mode].readAdapted:name==='central.js'?scripts[mode==='own'?'personal':'central'].readAdapted:name==='core.js'?scripts.core.readAdapted:name==='data.js'?scripts.data.source:fs.readFileSync(path.join(__dirname,...(['jquery.js','textSelection.js'].includes(name)?['../../v261/browser',name]:[name]))));
});
const reportDirectory=path.resolve(process.env.REVISAWIKI_INSTALL_REPORT_DIR||path.join(process.cwd(),'artifacts/v262/browser'));fs.mkdirSync(reportDirectory,{recursive:true});const output=path.join(reportDirectory,browserName.toLowerCase()+'.json'),save=()=>fs.writeFileSync(output,JSON.stringify({...report,passed:report.tests.filter(t=>t.passed).length,failed:report.tests.filter(t=>!t.passed).length},null,2)+'\n');
const helpers=`const assert=(value,label)=>{__rw26QA.assertions=(__rw26QA.assertions||0)+1;if(!value)throw new Error(label)};const wait=async fn=>{for(let n=0;n<1200;n++){if(fn())return;await new Promise(r=>setTimeout(r,15));}throw new Error('UI timeout')};const clean=()=>{assert(__rw26QA.saveCalls.length===0,'No simulated publish');assert(__rw26QA.submits===0,'No form submit');assert(__rw26QA.forbiddenNetwork.length===0,'No unmocked mutation');assert(__rw26QA.errors.length===0,'No browser error');assert(__rw26QA.clipboardWrites===0,'No clipboard access');assert(__rw26QA.policyViolations.length===0,'No content-security-policy violation');};`;
const evaluate=code=>driver.evaluate(`(async()=>{${helpers}${code}})()`);
async function test(origin,variant){mode=variant;const started=Date.now();try{
 await driver.navigate(origin+'/fixture.html?mode=loader-'+mode);
 await evaluate(`await wait(()=>document.querySelectorAll('.rw26-launch').length===3);assert(!window.RevisaWiki,'Core stays lazy before section click');assert(__rw26QA.scriptRequests.length===1,'Only stable stub fetched central loader');const first=new URL(__rw26QA.scriptRequests[0],location.href);window.__expectedOwner=first.searchParams.get('title').slice(0,-'/RevisaWiki/Carregador.js'.length);assert(first.searchParams.get('title')===__expectedOwner+'/RevisaWiki/Carregador.js'&&(${JSON.stringify(variant)}==='own'?__expectedOwner==='User:'+__rw26QA.config.wgUserName:__expectedOwner!=='User:'+__rw26QA.config.wgUserName),'Exact stable central loader destination for selected installation');assert(first.searchParams.has('rw'),'Five minute cache bucket present');assert(!document.querySelector('#firstHeading button'),'No introduction shortcut');clean();`);
 await driver.click('[id="História"] + .mw-editsection .rw26-launch');
 await evaluate(`await wait(()=>document.querySelector('.rw26-source')&&document.querySelector('.ajg-run'));assert(RevisaWiki.version==='2.6.2','Final exact core initialized');assert(RevisaWiki.inlineEditing.context().section==='1','Correct source section');assert(document.querySelector('.rw26-source').value.startsWith('== História =='),'Section boundary');const requests=__rw26QA.scriptRequests.map(value=>new URL(value,location.href));const core=requests.find(url=>url.searchParams.get('title').endsWith('/RevisaWiki.js'));const data=requests.find(url=>url.searchParams.get('title').endsWith('/Dados.js'));assert(core?.searchParams.get('v')==='2.6.2'&&core?.searchParams.get('title')===__expectedOwner+'/RevisaWiki.js','Core fetch uses exact hotfix revision and destination');assert(data?.searchParams.get('v')===${JSON.stringify('2.6.2-'+pins.packedCatalogSha256)}&&data?.searchParams.get('title')===__expectedOwner+'/RevisaWiki/Dados.js','Data fetch uses pinned core/catalog version and destination');assert(requests.length===3,'Exactly stub central core catalog chain');window.__originalDraft=document.querySelector('.rw26-source').value;window.__testDraft=__originalDraft+'\\n{{Main|Brasil}}';const box=document.querySelector('.rw26-source');box.value=__testDraft;box.dispatchEvent(new Event('input',{bubbles:true}));clean();`);
 await driver.click('.ajg-run');
 await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.querySelector('.rw26-source').value.includes('{{Artigo principal|Brasil}}'),'Actual Ajustar código transforms draft');assert(!document.querySelector('.rw26-source').value.includes('{{Main|'),'No Main residue');clean();`);
 await driver.click('.ajg-undo');
 await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.querySelector('.rw26-source').value===__testDraft,'Undo restores exact prior draft');document.querySelector('.rw26-source').value=__originalDraft;document.querySelector('.rw26-source').dispatchEvent(new Event('input',{bubbles:true}));clean();`);
 await driver.click('.rw26-cancel');await evaluate(`assert(!document.querySelector('.rw26-inline'),'Close unchanged restored section');clean();`);
 const assertions=await driver.evaluate('__rw26QA.assertions');report.assertions+=assertions;report.tests.push({name:variant+' stable installation chain',passed:true,assertions,milliseconds:Date.now()-started});
 }catch(e){let state;try{state=JSON.parse(await driver.evaluate('JSON.stringify({errors:__rw26QA.errors,requests:__rw26QA.scriptRequests,notices:__rw26QA.notices,summary:document.querySelector(".ajg-status")?.textContent})'));}catch{}report.tests.push({name:variant+' stable installation chain',passed:false,error:String(e.message),state,milliseconds:Date.now()-started});}save();console.log(JSON.stringify(report.tests.at(-1)));}

async function wholeArticle(origin){
 mode='shared';const started=Date.now();try{
  await driver.navigate(origin+'/fixture.html?mode=loader-shared&scenario=native-editor&title='+encodeURIComponent(cityPin.title));
  await evaluate(`await wait(()=>window.RevisaWiki&&document.querySelector('.ajg-run'));window.__citySource=await(await fetch('/city.wiki')).text();window.__dataRows=${numericRows.toString()};window.__labelRows=text=>text.split(String.fromCharCode(10)).filter(line=>line.startsWith('| style='));assert(new TextEncoder().encode(__citySource).length===${cityPin.bytes},'Full captured article bytes loaded');assert(__dataRows(__citySource).length===${cityNumericRows.length},'Numeric assertion covers all captured rows');assert(__labelRows(__citySource).length===974,'Both city and country labels are inventoried');const plan=RevisaWiki.syntaxRepairPlan(__citySource,{namespaceNumber:0,pageTitle:${JSON.stringify(cityPin.title)}});assert(plan.safePrefixEnd===__citySource.length&&plan.unresolved.length===0,'Whole article is available past its ordinary quote');const box=document.getElementById('wpTextbox1');box.value=__citySource;box.dispatchEvent(new Event('input',{bubbles:true}));clean();`);
  await driver.click('.ajg-run');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);const actual=document.getElementById('wpTextbox1').value;assert(actual!==__citySource,'Complete article receives existing safe fixes');assert(actual.includes('php# "Météo Climat'),'Ordinary source quote is untouched');assert(JSON.stringify(__dataRows(actual))===JSON.stringify(__dataRows(__citySource)),'Every numeric table row remains literal');assert(JSON.stringify(__labelRows(actual))===JSON.stringify(__labelRows(__citySource)),'Every city and country label row remains literal');assert((actual.match(/^\\{\\|/gm)||[]).length===6&&(actual.match(/^\\|\\}/gm)||[]).length===6,'All six table boundaries remain');assert(!document.querySelector('.ajg-status').textContent.includes('no trecho analisado'),'No false partial-analysis result');assert(RevisaWiki.processing.engine==='worker'&&!RevisaWiki.processing.workerFailure,'Real browser Worker processed the complete article');window.__cityActual=actual;clean();`);
  const actual=await driver.evaluate('__cityActual');
  const actualEvidence={outputSha256:hash(Buffer.from(actual)),outputBytes:Buffer.byteLength(actual),numericRows:numericRows(actual).length,processing:JSON.parse(await driver.evaluate('JSON.stringify(RevisaWiki.processing)'))};
  await driver.click('.ajg-undo');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value===__citySource,'Undo restores every source byte');clean();`);
  assert.equal(hash(Buffer.from(await driver.evaluate("document.getElementById('wpTextbox1').value"))),cityPin.sha256,'Native Undo restores captured UTF-8 bytes');
  const assertions=await driver.evaluate('__rw26QA.assertions');report.assertions+=assertions;report.tests.push({name:'complete city-temperature article and exact undo',passed:true,assertions,evidence:actualEvidence,restoredSha256:cityPin.sha256,milliseconds:Date.now()-started});
 }catch(e){report.tests.push({name:'complete city-temperature article and exact undo',passed:false,error:String(e.message),milliseconds:Date.now()-started});}save();console.log(JSON.stringify(report.tests.at(-1)));
}

(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  await driver.start(origin);report.browserVersion=driver.version;
  for(const variant of ['shared','own'])await test(origin,variant);
  await wholeArticle(origin);
  report.blockedOutsideRequests=driver.blocked?.length||0;
  assert.equal(report.blockedOutsideRequests,0,'No request to an external site');
  assert.equal(report.actualNetworkMutations,0,'Local server received GET requests only');
  for(const[name,pin]of Object.entries(releaseFiles))assert.equal(hash(fs.readFileSync(path.join(dist,name))),pin.sha256,'Saved release remains frozen: '+name);
  report.finalSavedFileHashesVerified=true;
 }catch(e){report.runnerError=String(e.message);process.exitCode=1;}
 finally{
  try{
   let timer;
   await Promise.race([driver.close(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Own browser cleanup timed out')),30000);})]).finally(()=>clearTimeout(timer));
   const exited=()=>driver.process?(driver.process.exitCode!==null||driver.process.signalCode!==null):!driver.browser?.isConnected();
   if(driver.process&&!exited())await Promise.race([new Promise(resolve=>driver.process.once('exit',resolve)),delay(5000)]);
   report.cleanup={ownSessionClosed:browserName==='Safari'?ownSafariSessionDeleteConfirmed:true,ownProcessExited:exited(),exitCode:driver.process?.exitCode??null,signalCode:driver.process?.signalCode??null,ownProfileRemoved:driver.profile?!fs.existsSync(driver.profile):true,unknownBrowserSessionsTouched:false};
   assert(report.cleanup.ownSessionClosed,'Own Safari automation session DELETE is confirmed');
   assert(report.cleanup.ownProcessExited,'Own spawned browser/driver process exits');
   assert(report.cleanup.ownProfileRemoved,'Own temporary Firefox profile removed');
  }catch(e){report.cleanupError=String(e.message);process.exitCode=1;}
  server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));
  report.finishedAt=new Date().toISOString();report.runnerSha256=hash(fs.readFileSync(__filename));save();
  if(report.tests.some(t=>!t.passed)||report.runnerError||report.cleanupError)process.exitCode=1;
 }
})();
