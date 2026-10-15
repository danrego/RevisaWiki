'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {NativeChrome,NativeFirefox,NativeSafari,delay}=require('../../v261/browser/native_driver.cjs');
const browserName=process.argv[2]||'Chrome';
const dist=path.resolve(process.argv[3]);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const files={core:'RevisaWiki_v2_7.js',data:'RevisaWiki_v2_7_dados.js',central:'Carregador_comunitario_RevisaWiki_v2_7.js',personal:'Carregador_common_js_RevisaWiki_v2_7.js',shared:'Chamada_fixa_RevisaWiki_common.js',own:'Chamada_fixa_RevisaWiki_copia_propria.js'};
const pinsPath=path.resolve(__dirname,'../../expected_release_v270.json');
const pins=require(pinsPath);
assert.equal(pins.version,'2.7.0');
const releaseFiles={};
for(const [name,pin]of Object.entries(pins.files)){
 const bytes=fs.readFileSync(path.join(dist,name));
 assert.equal(hash(bytes),pin.sha256,'Frozen release hash: '+name);
 assert.equal(bytes.length,pin.bytes,'Frozen release bytes: '+name);
 releaseFiles[name]={sha256:hash(bytes),bytes:bytes.length};
}
const scripts={};for(const [kind,name]of Object.entries(files)){const bytes=fs.readFileSync(path.join(dist,name));assert(releaseFiles[name],'Required release pin: '+name);scripts[kind]={source:bytes.toString(),sha256:hash(bytes)};}
const corpusManifestPath=path.resolve(process.argv[4]||path.join(__dirname,'../fixtures/large_articles/manifest.json'));
const corpusManifestBytes=fs.readFileSync(corpusManifestPath),corpus=JSON.parse(corpusManifestBytes);
function readSource(entry){
 const file=path.resolve(path.dirname(corpusManifestPath),entry.file);
 assert(file.startsWith(path.dirname(corpusManifestPath)+path.sep),'Source remains inside corpus');
 const packed=fs.readFileSync(file);
 if(entry.compression==='gzip'){assert.equal(packed.length,entry.compressedBytes);assert.equal(hash(packed),entry.compressedSha256);}
 const bytes=entry.compression==='gzip'?require('node:zlib').gunzipSync(packed):packed;
 assert.equal(bytes.length,entry.bytes);assert.equal(hash(bytes),entry.sha256);
 assert.equal(crypto.createHash('sha1').update(bytes).digest('hex'),entry.sha1);
 return bytes;
}
assert.equal(corpus.articles.length,31);
for(const entry of corpus.articles){assert(entry.bytes>100000);readSource(entry);}
const latestCityPin=corpus.articles.find(entry=>entry.title==='Lista de cidades por temperatura média');
assert(latestCityPin,'Latest pinned city-temperature revision remains in the corpus');
const cityFixtureDirectory=path.resolve(__dirname,'../fixtures/city_temperature');
const historicalCityPin=JSON.parse(fs.readFileSync(path.join(cityFixtureDirectory,'source_revision.json')));
const cityPin={...historicalCityPin,revid:historicalCityPin.oldid,ns:0,kind:'historical-positive-diff-regression'};
const cityBytes=fs.readFileSync(path.join(cityFixtureDirectory,'article.wiki'));
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
const report={version:'2.7.0',build:'2.7.0',browser:browserName,startedAt:new Date().toISOString(),pinManifestSha256:hash(fs.readFileSync(pinsPath)),corpusManifestSha256:hash(corpusManifestBytes),releaseFiles,hashes:Object.fromEntries(Object.entries(scripts).map(([k,v])=>[k,v.sha256])),cityFixture:{...cityPin,numericRows:cityNumericRows.length},latestCityFixture:latestCityPin,adaptations:['Only the ptwiki host guards are extended to localhost for this isolated fixture.','All API responses are local mocks. No production text or parser logic is altered.','Checkbox choices use native keyboard focus and Space in each browser. Checked state and DOM events are never changed by JavaScript.','The real Worker constructor is observed only to retain result counts for independent UI assertions.','The historical city source exercises positive diff controls; its already corrected recent revision is retained unchanged in the 31-article corpus.','Installation workflows begin in the ordinary source editor. A separate read-only view confirms both lazy loader and full core add no extra section controls and leave all native links intact.'],tests:[],assertions:0,actualWikipediaWrites:0,actualNetworkMutations:0,screenshots:0,clipboardWrites:0,serverRequests:[]};
let mode='shared';
const server=http.createServer((req,res)=>{
 report.serverRequests.push({method:req.method,path:new URL(req.url,'http://localhost').pathname});
 if(req.method!=='GET'){report.actualNetworkMutations++;res.writeHead(403).end('Read only');return;}
 const requestURL=new URL(req.url,'http://localhost'),name=requestURL.pathname.slice(1)||'fixture.html';
 const allowed=new Set(['fixture.html','fixture.js','jquery.js','textSelection.js','production.js','central.js','core.js','data.js','city.wiki','article.wiki']);if(!allowed.has(name)){res.writeHead(404).end();return;}
 if(name==='article.wiki'){
  const entry=corpus.articles.find(article=>String(article.revid)===requestURL.searchParams.get('revid'));
  if(!entry){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Content-Security-Policy':"default-src 'none'"});res.end(readSource(entry));return;
 }
 res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.wiki')?'text/plain; charset=utf-8':'text/javascript; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; form-action 'none'; frame-src 'none'"});
 res.end(name==='city.wiki'?cityBytes:name==='production.js'?scripts[mode].readAdapted:name==='central.js'?scripts[mode==='own'?'personal':'central'].readAdapted:name==='core.js'?scripts.core.readAdapted:name==='data.js'?scripts.data.source:fs.readFileSync(path.join(__dirname,...(['jquery.js','textSelection.js'].includes(name)?['../../v261/browser',name]:[name]))));
});
const reportDirectory=path.resolve(process.env.REVISAWIKI_INSTALL_REPORT_DIR||path.join(process.cwd(),'artifacts/v27/browser'));fs.mkdirSync(reportDirectory,{recursive:true});const output=path.join(reportDirectory,browserName.toLowerCase()+'.json'),save=()=>fs.writeFileSync(output,JSON.stringify({...report,passed:report.tests.filter(t=>t.passed).length,failed:report.tests.filter(t=>!t.passed).length},null,2)+'\n');
const helpers=`const assert=(value,label)=>{__rw26QA.assertions=(__rw26QA.assertions||0)+1;if(!value)throw new Error(label)};const wait=async fn=>{for(let n=0;n<1200;n++){if(fn())return;await new Promise(r=>setTimeout(r,15));}throw new Error('UI timeout')};const clean=()=>{assert(__rw26QA.saveCalls.length===0,'No simulated publish');assert(__rw26QA.submits===0,'No form submit');assert(__rw26QA.forbiddenNetwork.length===0,'No unmocked mutation');assert(__rw26QA.errors.length===0,'No browser error');assert(__rw26QA.clipboardWrites===0,'No clipboard access');assert(__rw26QA.policyViolations.length===0,'No content-security-policy violation');};`;
let currentEvaluation=null,evaluationSerial=0;
const evaluate=code=>{currentEvaluation={index:++evaluationSerial,codePrefix:code.slice(0,220),startedAt:Date.now()};return driver.evaluate(`(async()=>{${helpers}${code}})()`);};
async function failureState(){
 const stage=currentEvaluation?{...currentEvaluation,milliseconds:Date.now()-currentEvaluation.startedAt}:null;
 try{return{stage,state:JSON.parse(await driver.evaluate(`JSON.stringify({assertions:__rw26QA.assertions,status:document.querySelector('.ajg-status')?.textContent,runDisabled:document.querySelector('.ajg-run')?.disabled,resultCount:document.querySelector('.ajg-result-count')?.textContent,sourceLength:document.getElementById('wpTextbox1')?.value.length,sourceEqualsOriginal:document.getElementById('wpTextbox1')?.value===window.__citySource,sourceEqualsActual:document.getElementById('wpTextbox1')?.value===window.__cityActual,sourceEqualsPartial:document.getElementById('wpTextbox1')?.value===window.__cityExpectedPartial,rejectedIds:window.__cityRejectedIds,choices:[...document.querySelectorAll('.ajg-change-choice')].slice(0,4).map(box=>({id:box.dataset.change,checked:box.checked})),processing:window.RevisaWiki?.processing,workerMessages:__rw26QA.workerResults.map(event=>({id:event.id,hunks:event.result.hunks?.length,preservation:event.result.preservation?.map(item=>item.code)})),errors:__rw26QA.errors,clicks:__rw26QA.clicks})`))};}catch(error){return{stage,error:String(error.message)};}
}

async function toggleCheckbox(selector){
 await driver.evaluate(`new Promise((resolve,reject)=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.type!=='checkbox'||el.disabled){reject(new Error('Checkbox is missing or disabled'));return;}el.scrollIntoView({block:'center',inline:'nearest'});el.focus();if(document.activeElement!==el){reject(new Error('Checkbox did not receive native keyboard focus'));return;}requestAnimationFrame(()=>requestAnimationFrame(resolve));})`);
 if(browserName==='Chrome')return driver.page.locator(selector).press('Space');
 if(browserName==='Firefox')return driver.command('input.performActions',{context:driver.context,actions:[{type:'key',id:'qa-checkbox-keyboard',actions:[{type:'keyDown',value:' '},{type:'keyUp',value:' '}]}]});
 const element=await driver.request('POST',`/session/${driver.session}/element`,{using:'css selector',value:selector});
 return driver.request('POST',`/session/${driver.session}/element/${element['element-6066-11e4-a52e-4f735466cecf']}/value`,{text:' ',value:[' ']});
}

async function test(origin,variant){mode=variant;const started=Date.now();try{
 await driver.navigate(origin+'/fixture.html?mode=loader-'+mode+'&scenario=native-editor');
 await evaluate(`await wait(()=>window.RevisaWiki&&document.querySelector('.ajg-run'));assert(RevisaWiki.version==='2.7.0','Final exact core initialized in the ordinary source editor');assert(mw.config.get('wgAction')==='edit'&&document.getElementById('wpTextbox1'),'Primary route is the native source editor');assert(!document.querySelector('.rw26-inline'),'Normal editor needs no inline section session');assert(!document.querySelector('button.rw26-launch,button.rw26-lead-launch'),'No extra reading-page launcher in the editor');const requests=__rw26QA.scriptRequests.map(value=>new URL(value,location.href));assert(requests.length===3,'Exactly stub loader core catalog chain');const first=requests[0];window.__expectedOwner=first.searchParams.get('title').slice(0,-'/RevisaWiki/Carregador.js'.length);assert(first.searchParams.get('title')===__expectedOwner+'/RevisaWiki/Carregador.js'&&(${JSON.stringify(variant)}==='own'?__expectedOwner==='User:'+__rw26QA.config.wgUserName:__expectedOwner!=='User:'+__rw26QA.config.wgUserName),'Exact stable loader destination for selected installation');assert(first.searchParams.has('rw'),'Five minute cache bucket present');const core=requests.find(url=>url.searchParams.get('title').endsWith('/RevisaWiki.js'));const data=requests.find(url=>url.searchParams.get('title').endsWith('/Dados.js'));assert(core?.searchParams.get('v')==='2.7.0'&&core?.searchParams.get('title')===__expectedOwner+'/RevisaWiki.js','Core fetch uses exact version and destination');assert(data?.searchParams.get('v')===${JSON.stringify('2.7.0-'+pins.packedCatalogSha256)}&&data?.searchParams.get('title')===__expectedOwner+'/RevisaWiki/Dados.js','Data fetch uses pinned core/catalog version and destination');window.__originalDraft=document.getElementById('wpTextbox1').value;window.__testDraft=__originalDraft+'\\n{{Main|Brasil}}';const box=document.getElementById('wpTextbox1');box.value=__testDraft;box.dispatchEvent(new Event('input',{bubbles:true}));clean();`);
 await driver.click('.ajg-run');
 await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value.includes('{{Artigo principal|Brasil}}'),'Actual Ajustar código transforms draft');assert(!document.getElementById('wpTextbox1').value.includes('{{Main|'),'No Main residue');assert(!document.querySelector('button.rw26-launch,button.rw26-lead-launch'),'Adjusting the source adds no reading launcher');clean();`);
 await driver.click('.ajg-undo');
 await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value===__testDraft,'Undo restores exact prior draft');document.getElementById('wpTextbox1').value=__originalDraft;document.getElementById('wpTextbox1').dispatchEvent(new Event('input',{bubbles:true}));window.__editorChecks=__rw26QA.assertions;clean();`);
 const editorAssertions=await driver.evaluate('__rw26QA.assertions');
 await driver.navigate(origin+'/fixture.html?mode=loader-'+mode+'&scenario=reading-stale-controls');
 await evaluate(`await wait(()=>__rw26QA.scriptRequests?.length===1&&!document.querySelector('button.rw26-launch,button.rw26-lead-launch'));assert(mw.config.get('wgAction')==='view','Separate fixture is a reading page');assert(__rw26QA.staleOwnedButtons===4,'Fixture began with all four old owned shortcuts');assert(__rw26QA.stalePendingInjected===true,'Fixture contains a stale legacy inline request');assert(!window.RevisaWiki,'Core stays lazy on reading page');assert(__rw26QA.scriptRequests.length===1,'Reading page fetched only stable loader');assert(!document.querySelector('.ajg-run,.rw26-inline'),'Reading page adds no source-editing panel');assert(document.querySelector('.qa-unowned-control'),'Independent control is retained');assert(JSON.stringify([...document.querySelectorAll('.mw-editsection a')].map(anchor=>anchor.outerHTML))===JSON.stringify(__rw26QA.nativeEditLinks),'Every native edit link is literally preserved');for(let n=0;n<3;n++)mw.hook('wikipage.content').fire(jQuery(document.getElementById('mw-content-text')));await new Promise(resolve=>setTimeout(resolve,60));assert(!document.querySelector('button.rw26-launch,button.rw26-lead-launch'),'Repeated loader content hooks mount no shortcuts');assert(__rw26QA.scriptRequests.length===1,'Repeated reading hooks fetch no core');assert(__rw26QA.requests.length===0,'Stale pending request triggers no article API call');const first=new URL(__rw26QA.scriptRequests[0],location.href);window.__expectedOwner=first.searchParams.get('title').slice(0,-'/RevisaWiki/Carregador.js'.length);clean();`);
 await evaluate(`await mw.loader.getScript('/w/index.php?title='+encodeURIComponent(__expectedOwner+'/RevisaWiki.js')+'&action=raw&ctype=text/javascript&v=2.7.0');assert(window.RevisaWikiModuleReady&&!window.RevisaWiki,'Explicit core script also keeps the read view lazy');await RevisaWikiLoadInline();await wait(()=>window.RevisaWiki&&RevisaWiki.version==='2.7.0');for(let n=0;n<3;n++)mw.hook('wikipage.content').fire(jQuery(document.getElementById('mw-content-text')));await new Promise(resolve=>setTimeout(resolve,60));assert(!document.querySelector('button.rw26-launch,button.rw26-lead-launch'),'Explicitly loaded full core also mounts no reading shortcuts');assert(!document.querySelector('.ajg-run,.rw26-inline'),'Explicit core load creates no editor on reading page');assert(__rw26QA.requests.length===0,'Full core leaves stale pending article request inert');assert(document.querySelector('.qa-unowned-control'),'Full core preserves independent controls');assert(JSON.stringify([...document.querySelectorAll('.mw-editsection a')].map(anchor=>anchor.outerHTML))===JSON.stringify(__rw26QA.nativeEditLinks),'Full core preserves every native edit link literally');clean();`);
 const assertions=editorAssertions+await driver.evaluate('__rw26QA.assertions');report.assertions+=assertions;report.tests.push({name:variant+' stable installation chain',passed:true,assertions,evidence:{primaryRoute:'native-source-editor',readingPageExtraLaunchers:0,staleOwnedButtonsRemoved:4,nativeLinksPreserved:true,readingCoreStaysLazy:true,explicitCoreMountsNoLaunchers:true,stalePendingRemainsInert:true},milliseconds:Date.now()-started});
 }catch(e){let state;try{state=JSON.parse(await driver.evaluate('JSON.stringify({errors:__rw26QA.errors,requests:__rw26QA.scriptRequests,notices:__rw26QA.notices,summary:document.querySelector(".ajg-status")?.textContent})'));}catch{}report.tests.push({name:variant+' stable installation chain',passed:false,error:String(e.message),state,milliseconds:Date.now()-started});}save();console.log(JSON.stringify(report.tests.at(-1)));}

async function wholeArticle(origin){
 mode='shared';const started=Date.now();try{
  await driver.navigate(origin+'/fixture.html?mode=loader-shared&scenario=native-editor&title='+encodeURIComponent(cityPin.title));
  await evaluate(`await wait(()=>window.RevisaWiki&&document.querySelector('.ajg-run'));window.__citySource=await(await fetch('/city.wiki')).text();window.__dataRows=${numericRows.toString()};window.__labelRows=text=>text.split(String.fromCharCode(10)).filter(line=>line.startsWith('| style='));assert(new TextEncoder().encode(__citySource).length===${cityPin.bytes},'Full captured article bytes loaded');assert(__dataRows(__citySource).length===${cityNumericRows.length},'Numeric assertion covers all captured rows');assert(__labelRows(__citySource).length===974,'Both city and country labels are inventoried');const plan=RevisaWiki.syntaxRepairPlan(__citySource,{namespaceNumber:0,pageTitle:${JSON.stringify(cityPin.title)}});assert(plan.safePrefixEnd===__citySource.length&&plan.unresolved.length===0,'Whole article is available past its ordinary quote');const box=document.getElementById('wpTextbox1');box.value=__citySource;box.dispatchEvent(new Event('input',{bubbles:true}));clean();`);
  await driver.click('.ajg-run');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);const actual=document.getElementById('wpTextbox1').value;assert(actual!==__citySource,'Complete article receives existing safe fixes');assert(actual.includes('php# "Météo Climat'),'Ordinary source quote is untouched');assert(JSON.stringify(__dataRows(actual))===JSON.stringify(__dataRows(__citySource)),'Every numeric table row remains literal');assert(JSON.stringify(__labelRows(actual))===JSON.stringify(__labelRows(__citySource)),'Every city and country label row remains literal');assert((actual.match(/^\\{\\|/gm)||[]).length===6&&(actual.match(/^\\|\\}/gm)||[]).length===6,'All six table boundaries remain');assert(!document.querySelector('.ajg-status').textContent.includes('no trecho analisado'),'No false partial-analysis result');assert(RevisaWiki.processing.engine==='worker'&&!RevisaWiki.processing.workerFailure,'Real browser Worker processed the complete article');window.__cityActual=actual;clean();`);
  const actual=await driver.evaluate('__cityActual');
  const actualEvidence={outputSha256:hash(Buffer.from(actual)),outputBytes:Buffer.byteLength(actual),numericRows:numericRows(actual).length,processing:JSON.parse(await driver.evaluate('JSON.stringify(RevisaWiki.processing)'))};
  await evaluate(`window.__cityAdjustment=__rw26QA.workerResults.at(-1).result;const metrics=__cityAdjustment.byteMetrics;assert(metrics.delta===new TextEncoder().encode(__cityActual).length-new TextEncoder().encode(__citySource).length&&metrics.netExact===true,'Byte badge is backed by exact UTF-8 net metrics');window.__cityTypeInfo=RevisaWiki.v27RetainedTypes(__citySource,__cityActual);window.__cityTypes=__cityTypeInfo.topics;assert(__cityTypes.length>1,'City has multiple actual final adjustment types');const label=document.querySelector('.ajg-result-count').textContent;assert(label===__cityTypeInfo.text&&__cityTypeInfo.count===__cityTypes.length&&!/trecho/.test(label),'Result shows actual types rather than a false single changed stretch');assert(document.getElementById('wpSummary').value===RevisaWiki.summaryForTopics(__cityTypes),'Generated summary matches retained final types');clean();`);
  actualEvidence.byteMetrics=JSON.parse(await driver.evaluate('JSON.stringify(__cityAdjustment.byteMetrics)'));
  actualEvidence.byteBadge=await driver.evaluate("document.querySelector('.ajg-bytes').textContent");
  await driver.click('.ajg-show-changes');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled&&document.querySelectorAll('.ajg-change').length>0);window.__cityGroups=[...document.querySelectorAll('.ajg-change')].map(group=>({before:group.querySelector('.ajg-before').textContent.length,after:group.querySelector('.ajg-after').textContent.length}));assert(__cityGroups.length>=3,'Full city diff has multiple local groups');assert(Math.max(...__cityGroups.flatMap(group=>[group.before,group.after]))<__citySource.length/2,'No full-article-sized unchanged body is folded into a local edit');assert(document.getElementById('wpTextbox1').value===__cityActual,'Opening comparison does not change the source');window.__cityComparison=__rw26QA.workerResults.at(-1).result;clean();`);
  await driver.click('.ajg-select-changes');
  await evaluate(`assert(document.querySelector('.ajg-comparison').classList.contains('ajg-selecting'),'Per-adjustment choices open');const first=document.querySelector('.ajg-change-choice');window.__cityRejectedId=first.dataset.change;const hunks=__cityComparison.hunks;assert(Array.isArray(hunks)&&hunks.length>1,'Worker returned independent selectable changes');const selected=hunks.find(hunk=>hunk.id===__cityRejectedId);assert(selected,'Visible checkbox identifies a real change');const rejected=hunks.filter(hunk=>hunk.id===selected.id||selected.transaction&&hunk.transaction===selected.transaction);window.__cityRejectedIds=rejected.map(hunk=>hunk.id);window.__cityExpectedPartial=__citySource;for(const hunk of hunks.filter(hunk=>!__cityRejectedIds.includes(hunk.id)).sort((a,b)=>b.start-a.start||b.newStart-a.newStart||b.end-a.end)){assert(__citySource.slice(hunk.start,hunk.end)===hunk.before,'Selection retains exact original source boundaries');__cityExpectedPartial=__cityExpectedPartial.slice(0,hunk.start)+hunk.after+__cityExpectedPartial.slice(hunk.end);}assert(__cityExpectedPartial!==__cityActual,'Rejecting a real change alters the expected result');clean();`);
  await toggleCheckbox('.ajg-change-choice[data-change='+JSON.stringify(await driver.evaluate('__cityRejectedId'))+']');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled&&document.getElementById('wpTextbox1').value===__cityExpectedPartial);assert(__rw26QA.clicks.some(event=>event.className==='ajg-change-choice'&&event.trusted),'Selection is triggered by trusted native keyboard interaction');assert(document.getElementById('wpTextbox1').value!==__cityActual,'Only selected changes remain after rejection');assert(JSON.stringify(__dataRows(__cityExpectedPartial))===JSON.stringify(__dataRows(__citySource)),'Rejecting a change preserves numeric table data');assert(__cityRejectedIds.every(id=>![...document.querySelectorAll('.ajg-change-choice')].find(box=>box.dataset.change===id)?.checked),'Related transaction choices remain synchronized');window.__cityPartialTypes=RevisaWiki.v27RetainedTypes(__citySource,__cityExpectedPartial);assert(document.querySelector('.ajg-result-count').textContent===__cityPartialTypes.text,'Type count follows rejected changes');assert(document.getElementById('wpSummary').value===RevisaWiki.summaryForTopics(__cityPartialTypes.topics),'Generated summary follows rejected changes');clean();`);
  actualEvidence.diff=JSON.parse(await driver.evaluate('JSON.stringify({groups:__cityGroups.length,maximumContextCharacters:Math.max(...__cityGroups.flatMap(group=>[group.before,group.after])),actualTypes:__cityTypes,selectionGesture:"native-focus-and-space",trustedSelectionEvent:true,rejectedChanges:__cityRejectedIds.length,partialSourceChanged:__cityExpectedPartial!==__cityActual,partialTypes:__cityPartialTypes.topics})'));
  await driver.click('.ajg-undo');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value===__citySource,'Undo restores every source byte');assert(document.getElementById('wpSummary').value==='','Undo also restores the original empty summary');clean();`);
  await driver.click('.ajg-run');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpSummary').value!=='','Automatic summary is present before a manual source edit');const box=document.getElementById('wpTextbox1');window.__manualTail=String.fromCharCode(10)+'Texto local para testar a edição manual.';box.value+=__manualTail;box.dispatchEvent(new Event('input',{bubbles:true}));await wait(()=>document.getElementById('wpSummary').value==='');assert(box.value.endsWith(__manualTail),'Clearing stale owned summary preserves the manual source edit');box.value=__citySource;box.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('wpSummary').value='Resumo de teste escrito pelo editor.';document.getElementById('wpSummary').dispatchEvent(new Event('input',{bubbles:true}));clean();`);
  await driver.click('.ajg-run');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpSummary').value==='Resumo de teste escrito pelo editor.','Adjusting code preserves a manual edit summary');const box=document.getElementById('wpTextbox1');box.value+=__manualTail;box.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,100));assert(document.getElementById('wpSummary').value==='Resumo de teste escrito pelo editor.','Manual source change preserves an editor-owned summary');box.value=__citySource;box.dispatchEvent(new Event('input',{bubbles:true}));clean();`);
  actualEvidence.summaryOwnership={automaticUpdatedAfterRejection:true,automaticClearedAfterManualSourceChange:true,manualSummaryPreserved:true};
  assert.equal(hash(Buffer.from(await driver.evaluate("document.getElementById('wpTextbox1').value"))),cityPin.sha256,'Native Undo restores captured UTF-8 bytes');
  const assertions=await driver.evaluate('__rw26QA.assertions');report.assertions+=assertions;report.tests.push({name:'complete city-temperature article and exact undo',passed:true,assertions,evidence:actualEvidence,restoredSha256:cityPin.sha256,milliseconds:Date.now()-started});
 }catch(e){report.tests.push({name:'complete city-temperature article and exact undo',passed:false,error:String(e.message),diagnostic:await failureState(),milliseconds:Date.now()-started});}save();console.log(JSON.stringify(report.tests.at(-1)));
}

const diverseTitles=['Óptica','Guerra Civil no Sudão (2023–presente)','Ronaldo Nazário','BAE Systems','Fortaleza','The New York Times'];
const copyResidueCluster=":contentReference[oaicite:0]{index=0}\uE200cite\uE202turn0search0\uE201\uE200filecite\uE202turn0file0\uE201";
const safeRuleSource="{{Info/Biografia|nome=Ana da Luz|ocupação=|ocupação=físico}}\n'''Ana da Luz''' é uma física.:contentReference[oaicite:0]{index=0}\uE200cite\uE202turn0search0\uE201\uE200filecite\uE202turn0file0\uE201<ref name=\"fonte-a\">Uma fonte completa e preservada.</ref>\n\n== Biografia ==\nTexto seguinte.<ref name=\"fonte-b\">Uma fonte completa e preservada.</ref>\nOutra chamada.<ref name=\"fonte-b\" />\nUma nota distinta.<ref name=\"nota-c\" group=\"nota\">Uma fonte completa e preservada.</ref>\nLuz:contentReference[oaicite:0]{index=0}\uE200cite\uE202turn0search0\uE201\uE200filecite\uE202turn0file0\uE201solar.\n<nowiki>:contentReference[oaicite:0]{index=0}\uE200cite\uE202turn0search0\uE201\uE200filecite\uE202turn0file0\uE201</nowiki>\nA palavra wiketext permanece no texto.\n{{Referências}}\n{{Referências|grupo=nota}}\n{{DEFAULTSORT:Ana da Luz}}\n{{DEFAULTSORT:Ana da Luz}}\n{{Portal3|Física|Física|Biografias}}\n[[Categoria:Físicos]]\n";
const safeCopySource='```wiketext\n'+safeRuleSource+'```\n';
async function safeAutomation(origin){
 mode='shared';const started=Date.now();try{
  await driver.navigate(origin+'/fixture.html?mode=loader-shared&scenario=native-editor&title=Ana%20da%20Luz');
  await evaluate(`await wait(()=>window.RevisaWiki&&document.querySelector('.ajg-run'));window.__safeSemanticSource=${JSON.stringify(safeRuleSource)};window.__safeSource=${JSON.stringify(safeCopySource)};const box=document.getElementById('wpTextbox1');box.value=__safeSource;box.dispatchEvent(new Event('input',{bubbles:true}));const cfg={...RevisaWiki.defaults,namespaceNumber:0,pageTitle:'Ana da Luz'};const plan=RevisaWiki.v27SafeAutomationPlan(__safeSemanticSource,cfg);assert(['infobox','defaultsort','portal','references'].every(kind=>plan.steps.some(step=>step.kind===kind)),'Native runtime proves all four new safe rule families');assert(RevisaWiki.v27SafeAutomationProof(__safeSemanticSource,plan.text,plan,cfg),'Rule proof regenerates from exact source');const copyPlan=RevisaWiki.v27ChatCopyPlan(__safeSemanticSource,cfg);assert(copyPlan.edits.length===2,'Only the two exact export-token clusters in ordinary prose are copy residues');assert(RevisaWiki.v27ChatCopyProof(__safeSemanticSource,copyPlan.text,copyPlan,cfg),'Copy-residue proof regenerates from exact source');clean();`);
  await driver.click('.ajg-run');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);window.__safeActual=document.getElementById('wpTextbox1').value;assert(__safeActual!==__safeSource,'New safe rules produce real source changes');assert(!__safeActual.startsWith(String.fromCharCode(96).repeat(3))&&!__safeActual.trimEnd().endsWith(String.fromCharCode(96).repeat(3)),'Only whole-article fence is removed');assert(!__safeActual.includes('física.:contentReference'),'Exported citation token is removed from ordinary prose');assert(__safeActual.includes(${JSON.stringify('<nowiki>'+copyResidueCluster+'</nowiki>')}),'Protected literal export-token cluster is preserved');assert(__safeActual.split(':contentReference[oaicite:0]{index=0}').length===2,'Exactly the protected citation token remains');assert(__safeActual.split(String.fromCharCode(0xE200)+'cite'+String.fromCharCode(0xE202)).length===2,'Exactly the protected private-use citation remains');assert(__safeActual.split(String.fromCharCode(0xE200)+'filecite'+String.fromCharCode(0xE202)).length===2,'Exactly the protected private-use file citation remains');assert(__safeActual.includes('Luz solar.')&&!__safeActual.includes('Luzsolar.'),'Removing adjacent export tokens preserves a word boundary');assert(__safeActual.includes('A palavra wiketext permanece no texto.'),'Legitimate prose word is preserved');assert((__safeActual.match(/ocupação[ ]*=/g)||[]).length===1,'Only the final nonempty occupation parameter remains');assert((__safeActual.match(/DEFAULTSORT:/g)||[]).length===1,'Only one identical footer sorting key remains');assert(__safeActual.includes('{{Portal3|Física|Biografias}}'),'Repeated literal portal entry is consolidated');assert(!__safeActual.includes('name="fonte-b"'),'Equivalent named-reference family reuses its first name');assert(__safeActual.includes('name="nota-c" group="nota"'),'A distinct note group remains independent');assert(RevisaWiki.processing.engine==='worker'&&!RevisaWiki.processing.workerFailure,'New safe rules execute in real Worker');const result=__rw26QA.workerResults.at(-1).result;assert((result.preservation||[]).length===0,'Safe rule families retain all supported content');clean();`);
  const actual=await driver.evaluate('__safeActual');
  await driver.click('.ajg-undo');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value===__safeSource,'Undo restores duplicate parameters, names, note group and footer exactly');clean();`);
  const assertions=await driver.evaluate('__rw26QA.assertions');report.assertions+=assertions;report.tests.push({name:'four safe automation families and distinct note group',passed:true,assertions,evidence:{inputSha256:hash(Buffer.from(safeCopySource)),outputSha256:hash(Buffer.from(actual)),restoredExact:true,wholeArticleFenceRemoved:true,ordinaryExportTokenRemoved:true,protectedTokenPreserved:true,legitimateWordPreserved:true,adjacentTokenClustersRemoved:true,wordBoundaryPreserved:true},milliseconds:Date.now()-started});
 }catch(error){report.tests.push({name:'four safe automation families and distinct note group',passed:false,error:String(error.message),milliseconds:Date.now()-started});}
 save();console.log(JSON.stringify(report.tests.at(-1)));
}
async function diverseArticle(origin,entry){
 mode='shared';const started=Date.now();try{
  await driver.navigate(origin+'/fixture.html?mode=loader-shared&scenario=native-editor&title='+encodeURIComponent(entry.title));
  await evaluate(`await wait(()=>window.RevisaWiki&&document.querySelector('.ajg-run'));window.__largeSource=await(await fetch('/article.wiki?revid=${entry.revid}')).text();assert(new TextEncoder().encode(__largeSource).length===${entry.bytes},'Whole large captured source is loaded');const box=document.getElementById('wpTextbox1');box.value=__largeSource;box.dispatchEvent(new Event('input',{bubbles:true}));clean();`);
  assert.equal(hash(Buffer.from(await driver.evaluate('__largeSource'))),entry.sha256,'Full native editor receives captured source SHA');
  await driver.click('.ajg-run');
  await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(RevisaWiki.processing.engine==='worker'&&!RevisaWiki.processing.workerFailure,'Real Worker handles diverse full article');const result=__rw26QA.workerResults.at(-1).result;assert((result.preservation||[]).length===0,'Full article has no unsupported source loss');window.__largeActual=document.getElementById('wpTextbox1').value;window.__largeTypeInfo=RevisaWiki.v27RetainedTypes(__largeSource,__largeActual);window.__largeTypes=__largeTypeInfo.topics;if(__largeActual!==__largeSource){const label=document.querySelector('.ajg-result-count').textContent;assert(label===__largeTypeInfo.text&&__largeTypeInfo.count===__largeTypes.length,'Diverse article result shows actual final types');}clean();`);
  const actual=await driver.evaluate('__largeActual');
  const evidence={title:entry.title,revid:entry.revid,sourceBytes:entry.bytes,inputSha256:entry.sha256,outputBytes:Buffer.byteLength(actual),outputSha256:hash(Buffer.from(actual)),changed:actual!==readSource(entry).toString(),actualTypes:JSON.parse(await driver.evaluate('JSON.stringify(__largeTypes)')),processing:JSON.parse(await driver.evaluate('JSON.stringify(RevisaWiki.processing)'))};
  if(evidence.changed){
   await driver.click('.ajg-undo');
   await evaluate(`await wait(()=>!document.querySelector('.ajg-run').disabled);assert(document.getElementById('wpTextbox1').value===__largeSource,'Undo restores all bytes of diverse large source');clean();`);
  }
  assert.equal(hash(Buffer.from(await driver.evaluate("document.getElementById('wpTextbox1').value"))),entry.sha256,'Restored large source SHA matches captured revision');
  const assertions=await driver.evaluate('__rw26QA.assertions');report.assertions+=assertions;report.tests.push({name:'large full article '+entry.revid,passed:true,assertions,evidence,restoredSha256:entry.sha256,milliseconds:Date.now()-started});
 }catch(error){report.tests.push({name:'large full article '+entry.revid,passed:false,error:String(error.message),milliseconds:Date.now()-started});}
 save();console.log(JSON.stringify(report.tests.at(-1)));
}

(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  await driver.start(origin);report.browserVersion=driver.version;
  for(const variant of ['shared','own'])await test(origin,variant);
  await wholeArticle(origin);
  for(const title of diverseTitles){const entry=corpus.articles.find(article=>article.title===title);assert(entry,'Diverse public source exists: '+title);await diverseArticle(origin,entry);}
  await safeAutomation(origin);
  report.blockedOutsideRequests=driver.blocked?.length||0;
  assert.equal(report.blockedOutsideRequests,0,'No request to an external site');
  assert.equal(report.actualNetworkMutations,0,'Local server received GET requests only');
  for(const[name,pin]of Object.entries(releaseFiles))assert.equal(hash(fs.readFileSync(path.join(dist,name))),pin.sha256,'Saved release remains frozen: '+name);
  report.finalSavedFileHashesVerified=true;
  assert.equal(hash(fs.readFileSync(corpusManifestPath)),report.corpusManifestSha256,'Source manifest remains frozen');
  for(const entry of corpus.articles)readSource(entry);
  assert.equal(hash(fs.readFileSync(path.join(cityFixtureDirectory,'article.wiki'))),cityPin.sha256,'Historical positive-regression source remains frozen');
  report.finalSourceHashesVerified=true;
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
