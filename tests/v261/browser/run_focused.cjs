'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {NativeChrome,NativeFirefox,NativeSafari,delay}=require('./native_driver.cjs');
const browserName=process.argv[2]||'Chrome';
const dist=path.resolve(process.argv[3]);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const files={core:'RevisaWiki_v2_6_1.js',full:'RevisaWiki_v2_6_1_completo.js',data:'RevisaWiki_v2_6_1_dados.js',own:'Carregador_common_js_RevisaWiki_v2_6_1.js',community:'Carregador_comunitario_RevisaWiki_v2_6_1.js'};
const pinned={core:'57cbf79acde25b45ba28d2bc972ad9180d5a747eaa5f2c8e475f03292d362ba6',full:'ad3fea8d430692f0092ac0503038e8c3fe7483902fc8a9192f30fc04459cad51',data:'4f63f1c7853de3e30f7c15bea180871ba75b67a1dc4d0bc9d4ed023a7651b1ec',own:'8d7aec18d0a00d0334c19a2e62474874717ed5f83c07dbe83ba31722a441fa0e',community:'0ff666b1f1e71ba833e295ee39ac8d3f4c4c94fec033deaacb3db92d75551246'};
const scripts={};for(const [kind,name]of Object.entries(files)){const bytes=fs.readFileSync(path.join(dist,name));if(pinned[kind])assert.equal(hash(bytes),pinned[kind]);scripts[kind]={source:bytes.toString(),sha256:hash(bytes)};}
const guard="if (host ? host !== 'pt.wikipedia.org' : root.mw.config.get('wgDBname') !== 'ptwiki') return;";
const moduleGuard="if (!root.mw?.loader || (root.location?.hostname || root.mw.config?.get('wgServerName')) !== 'pt.wikipedia.org') return;";
for(const kind of ['core','full']){assert(scripts[kind].source.includes(guard));scripts[kind].adapted=scripts[kind].source.replace(guard,"if (host ? !['pt.wikipedia.org','127.0.0.1','localhost'].includes(host) : root.mw.config.get('wgDBname') !== 'ptwiki') return;");}
assert(scripts.core.adapted.includes(moduleGuard));scripts.core.adapted=scripts.core.adapted.replace(moduleGuard,"if (!root.mw?.loader || !['pt.wikipedia.org','127.0.0.1','localhost'].includes(root.location?.hostname || root.mw.config?.get('wgServerName'))) return;");
for(const kind of ['core','full','own','community'])scripts[kind].readAdapted=(scripts[kind].adapted||scripts[kind].source).replace("root.location.hostname!=='pt.wikipedia.org'","!['pt.wikipedia.org','127.0.0.1','localhost'].includes(root.location.hostname)");
const fixtures=path.resolve(__dirname,'../fixtures');
const cases=[
 {id:'singular-reference-alias',source:fs.readFileSync(path.join(fixtures,'article_reference_alias.wiki'),'utf8'),kind:'reference',changed:true},
 {id:'complete-article-main-hatnotes',source:fs.readFileSync(path.join(fixtures,'article_partial_markup.wiki'),'utf8'),kind:'hatnotes',changed:true},
 {id:'genuine-incomplete-suffix',source:'Texto completo.\n\n<div>Trecho sem fechamento\n{{Main|Brasil}}',kind:'partial',changed:false},
 {id:'quoted-collector-examples',source:"Texto completo.\n''<references group=\"nota\"/><references group=\"nota\"/>''",kind:'quoted',changed:false}
];
const driver=new({Chrome:NativeChrome,Firefox:NativeFirefox,Safari:NativeSafari}[browserName])();
const report={version:'2.6.1',browser:browserName,hashes:Object.fromEntries(Object.entries(scripts).map(([k,v])=>[k,v.sha256])),adapter:'Only recognized production host guards allow loopback; local mocked API and Worker trace',tests:[],assertions:0,actualWikipediaWrites:0,actualNetworkMutations:0,screenshots:0,clipboardWrites:0};
let bundle='core',readingMode=null;
const server=http.createServer((req,res)=>{
    if(req.method!=='GET'){report.actualNetworkMutations++;res.writeHead(403).end('Read only');return;}
    const name=new URL(req.url,'http://localhost').pathname.slice(1)||'fixture.html';
    if(readingMode){
        const allowed=new Set(['fixture.html','fixture.js','jquery.js','textSelection.js','production.js','core.js','data.js']);if(!allowed.has(name)){res.writeHead(404).end();return;}
        res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; form-action 'none'; frame-src 'none'"});
        res.end(name==='production.js'?scripts[readingMode].readAdapted:name==='core.js'?scripts.core.readAdapted:name==='data.js'?scripts.data.source:fs.readFileSync(path.join(__dirname,...(['jquery.js','textSelection.js'].includes(name)?[name]:['read',name]))));return;
    }
    const allowed=new Set(['fixture.html','fixture.js','fixture_extra.js','adapter.js','jquery.js','textSelection.js','worker_trace.js','fixture_script.js','data.js']);
    if(!allowed.has(name)){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; form-action 'none'; frame-src 'none'"});
    res.end(name==='fixture_script.js'?scripts[bundle].adapted:name==='data.js'?scripts.data.source:fs.readFileSync(path.join(__dirname,name)));
});
const reportDirectory=path.resolve(process.env.REVISAWIKI_BROWSER_REPORT_DIR||path.join(process.cwd(),'artifacts/v261/browser'));
fs.mkdirSync(reportDirectory,{recursive:true});
const output=path.join(reportDirectory,browserName.toLowerCase()+'.json');
const save=()=>fs.writeFileSync(output,JSON.stringify({...report,passed:report.tests.filter(t=>t.passed).length,failed:report.tests.filter(t=>!t.passed).length},null,2)+'\n');
const helpers=`const assert=(value,label)=>{__qaAssertions++;if(!value)throw new Error(label)};const wait=async fn=>{for(let n=0;n<2200;n++){if(fn())return;await new Promise(r=>setTimeout(r,15));}throw new Error('UI timeout')};const box=()=>document.querySelector('#wpTextbox1');const fill=s=>{box().value=s;box().dispatchEvent(new Event('input',{bubbles:true}));};const idle=()=>wait(()=>!document.querySelector('.ajg-run').disabled);const clean=()=>{assert(__rwFixture.submits===0,'No form submission');assert(__rwFixture.forbidden.length===0,'No write API call');assert(__qaBlockedNetwork===0,'No external network request');assert(document.querySelector('#qa-errors').textContent==='','No uncaught browser error');};`;
async function evaluate(code){return driver.evaluate(`(async()=>{${helpers}${code}})()`);}
async function test(fixture,origin){
    const name=bundle+' '+fixture.id,started=Date.now();let assertionsBefore=0;
    try{
        await driver.navigate(origin+'/fixture.html?ns=0&title=Exemplo&worker-trace=1');
        for(let n=0;n<500;n++){if(await driver.evaluate('!!window.RevisaWiki&&!!document.querySelector(".ajg-run")'))break;await delay(20);}
        assertionsBefore=await evaluate(`assert(RevisaWiki.version==='2.6.1','Exact candidate version');assert(typeof Worker==='function','Native Worker available');fill(${JSON.stringify(fixture.source)});document.querySelector('#wpSummary').value='';return __qaAssertions;`);
        await driver.click('.ajg-run');
        const result=JSON.parse(await evaluate(`await idle();const before=${JSON.stringify(fixture.source)},after=box().value;assert(RevisaWiki.processing.engine==='worker','Actual UI runs native Worker');assert(__rwWorkerTrace.jobs.length>=1,'Worker input captured');assert(__rwWorkerTrace.messages.some(m=>m.type==='result'),'Worker returned result');assert((after!==before)===${fixture.changed},'Expected automatic decision');
            ${fixture.kind==='reference'?`assert(!/\\{\\{Referência\\}\\}/i.test(after),'Singular reference alias removed');assert((after.match(/\\{\\{Referências(?:\\||\\}\\})/g)||[]).length===1,'Exactly one final reference collector');`:''}
            ${fixture.kind==='hatnotes'?`assert((after.match(/\\{\\{Artigo principal\\|/g)||[]).length===5,'All five hatnotes converted');assert(!/\\{\\{(?:AP|Main)\\|/.test(after),'No AP/Main residue');assert(RevisaWiki.syntaxRepairPlan(after,{namespaceNumber:0}).unresolved.length===0,'No false incomplete scope');`:''}
            ${fixture.kind==='partial'?`assert(after===before,'Genuine ambiguous tail preserved exactly');const reason=document.querySelector('.ajg-not-applied');assert(reason&&!reason.open,'Preservation reason stays collapsed');assert(reason.textContent.includes('estrutura não pôde'),'Brief reason remains available');`:''}
            ${fixture.kind==='quoted'?`assert(after===before,'Both quoted reference collectors preserved exactly');`:''}
            assert(!document.querySelector('.ajg-report').textContent.includes('O código incompleto e tudo o que vem depois'),'Old alarming message absent');assert(RevisaWiki.preservationAudit(before,after,{namespaceNumber:0}).length===0,'No lost source objects');clean();return JSON.stringify({after,engine:RevisaWiki.processing.engine,workerJobs:__rwWorkerTrace.jobs.length,assertions:__qaAssertions});`));
        if(fixture.changed){
            await driver.click('.ajg-show-changes');
            await evaluate(`assert(document.querySelector('.ajg-diff').textContent.length>0,'Diff visible after actual control');assert(document.querySelector('.ajg-diff > details').open,'Diff expanded');assert(document.querySelector('#wpSummary').value.length>0,'Automatic summary populated');clean();`);
            await driver.click('.ajg-undo');
            await evaluate(`await idle();assert(box().value===${JSON.stringify(fixture.source)},'Undo restores exact complete source');assert(document.querySelector('#wpSummary').value==='','Undo restores original summary');clean();`);
            await evaluate(`fill(${JSON.stringify(result.after)});`);
            await driver.click('.ajg-run');
            await evaluate(`await idle();assert(box().value===${JSON.stringify(result.after)},'Second run idempotent');clean();`);
        }
        const assertions=await driver.evaluate('__qaAssertions');report.assertions+=assertions;report.tests.push({name,passed:true,assertions,milliseconds:Date.now()-started,engine:result.engine,workerJobs:result.workerJobs});
    }catch(error){let state={};try{state=JSON.parse(await driver.evaluate('JSON.stringify({status:document.querySelector(".ajg-status")?.textContent,errors:document.querySelector("#qa-errors")?.textContent,version:window.RevisaWiki?.version,workerFailure:window.RevisaWiki?.processing?.workerFailure,assertions:window.__qaAssertions})'));}catch{}report.tests.push({name,passed:false,error:String(error.message),state,milliseconds:Date.now()-started});}
    save();console.log(JSON.stringify(report.tests.at(-1)));
}
async function talkTest(kind,origin,editorMode='classic'){
    const name=bundle+' talk '+kind+' '+editorMode,started=Date.now();
    try{
        const namespace=kind==='hidden-main'?0:kind==='hidden-user-talk'?3:kind==='hidden-template'?10:1;
        await driver.navigate(origin+'/fixture.html?'+new URLSearchParams({ns:namespace,title:'Discussão:Exemplo',editor:editorMode}));
        for(let n=0;n<500;n++){if(await driver.evaluate('!!window.RevisaWiki&&!!document.querySelector(".ajg-run")'))break;await delay(20);}
            const original='Portal da física Portal da tecnologia Portal da ciência',expected='{{PD}}\n{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}\n';
        if(namespace!==1){await evaluate(`assert(!document.querySelector('.ajg-prepare-talk'),'Talk action absent in unsupported namespace');clean();`);}
        else{
            const rated='{{Marca de projeto|3|Física|2|motivo=Texto a preservar}}\n{{PD}}\nPortal da tecnologia Portal da ciência\n== Debate ==\nComentário original.\n';
            const source=kind==='manual-rated'?rated:kind==='stable'?expected:kind==='registered-multiple'?'Portal da química Portal da astronomia':kind==='dynamic-valid'?'Portal do Tema de teste':kind==='dynamic-missing'?'Portal da Marca inexistente':kind==='registered-alias-rated'?'{{Marca de projeto|3|Informática|2}}\nPortal da informática':original;
            const after=kind==='manual-rated'?'{{PD}}\n{{Marca de projeto|3|Física|2|motivo=Texto a preservar|Tecnologia|?|Ciência|?}}\n== Debate ==\nComentário original.\n':kind==='registered-multiple'?'{{PD}}\n{{Marca de projeto|?|Química|?|Astronomia|?}}\n':kind==='dynamic-valid'?'{{PD}}\n{{Marca de projeto|?|Tema de teste|?}}\n':kind==='dynamic-missing'?'{{PD}}\nPortal da Marca inexistente':kind==='registered-alias-rated'?'{{PD}}\n{{Marca de projeto|3|Informática|2}}\n':expected;
            await evaluate(`assert(RevisaWiki.version==='2.6.1','Exact candidate version');const control=document.querySelector('.ajg-prepare-talk');assert(control?.textContent==='Criar código','Single clear button');assert(control.dataset.action==='create-talk-code','Explicit talk action');assert(!document.querySelector('.ajg-talk-apply'),'No second Apply step');window.__rwTalkArticle='{{Portal3|Física}}';fill(${JSON.stringify(source)});document.querySelector('#wpSummary').value=${JSON.stringify(kind==='manual-rated'?'Resumo manual':'')};box().setSelectionRange(1,Math.max(1,box().value.length-1));`);
            if(['registered-multiple','dynamic-valid','dynamic-missing','registered-alias-rated'].includes(kind))await evaluate(`window.__rwTalkArticle='';`);
            if(['dynamic-valid','dynamic-missing'].includes(kind))await evaluate(`const OldApi=mw.Api;mw.Api=function(){const old=new OldApi();this.post=old.post;this.get=p=>{if(p.prop!=='info|pageprops')return old.get(p);__rwFixture.requests.push({...p});__rwFixture.apiMethods.push('GET');return Promise.resolve({query:{pages:p.titles.split('|').map(title=>(${kind==='dynamic-valid'?"title==='Portal:Tema de teste'?{title,ns:100,pageid:123}:":''}{title,ns:title.startsWith('Portal:')?100:4,missing:true}))}});};};`);
            if(['race','double-click'].includes(kind))await evaluate(`const OldApi=mw.Api;mw.Api=function(){const old=new OldApi();this.get=p=>new Promise((resolve,reject)=>{setTimeout(()=>old.get(p).then(resolve,reject),200)});this.post=old.post;};`);
            if(kind==='read-failure')await evaluate(`window.__rwTalkArticleFailure=true;`);
            if(kind==='write-mismatch')await evaluate(`let first=true;jQuery(box()).textSelection('register',{getContents(){return box().value;},setContents(value){box().value=first?'i{Marca de projeto|?|Física|?}}':value;first=false;return this;},getCaretPosition(o){return o.startAndEnd?[1,3]:1;},setSelection(){return this;},scrollToCaretPosition(){return this;}});`);
            await driver.click('.ajg-prepare-talk');
            if(kind==='race')await evaluate(`fill('Novo texto digitado durante a consulta.');`);
            if(kind==='double-click')await evaluate(`document.querySelector('.ajg-prepare-talk').click();`);
            await evaluate(`await wait(()=>!document.querySelector('.ajg-prepare-talk').disabled);clean();`);
            if(['race','read-failure','write-mismatch'].includes(kind)){
                await evaluate(`assert(box().value===${JSON.stringify(kind==='race'?'Novo texto digitado durante a consulta.':source)},'Unavailable, mismatching or stale operation retains exact prior draft');assert(document.querySelector('#wpSummary').value==='','No summary for refused operation');assert(!document.querySelector('.ajg-talk-apply'),'No preview Apply button');clean();`);
            }else{
                await evaluate(`assert(box().value===${JSON.stringify(after)},'Exact complete generated header, no pasted remnants or orphan braces');assert(document.querySelector('#wpSummary').value===${JSON.stringify(kind==='stable'?'':kind==='manual-rated'?'Resumo manual':kind==='dynamic-missing'?'{{PD}}':'{{PD}}{{Marca de projeto}}')},'Correct automatic or preserved manual summary');assert(__rwFixture.requests.filter(p=>p.action==='query'&&p.prop==='revisions').length===1,'Exactly one read-only source query');assert(__rwFixture.apiMethods.every(method=>method==='GET'),'Only GET source reads');${['dynamic-valid','dynamic-missing'].includes(kind)?"assert(__rwFixture.requests.filter(p=>p.prop==='info|pageprops').length===1,'One bounded portal proof query');":''}clean();`);
                if(kind!=='stable'){
                    await driver.click('.ajg-show-changes');
                    await evaluate(`await idle();await wait(()=>document.querySelector('.ajg-diff > details')?.open);assert(document.querySelector('.ajg-diff > details')?.open,'Generated header diff available');clean();`);
                    await driver.click('.ajg-undo');
                    await evaluate(`await idle();assert(box().value===${JSON.stringify(source)},'One exact undo restores entire prior draft');assert(document.querySelector('#wpSummary').value===${JSON.stringify(kind==='manual-rated'?'Resumo manual':'')},'Undo restores original summary');fill(${JSON.stringify(after)});`);
                    await driver.click('.ajg-prepare-talk');
                    await evaluate(`await wait(()=>!document.querySelector('.ajg-prepare-talk').disabled);assert(box().value===${JSON.stringify(after)},'Repeated generation is idempotent');clean();`);
                }
            }
        }
        const assertions=await driver.evaluate('__qaAssertions');report.assertions+=assertions;report.tests.push({name,passed:true,assertions,milliseconds:Date.now()-started});
    }catch(error){let state={};try{state=JSON.parse(await driver.evaluate('JSON.stringify({status:document.querySelector(".ajg-status")?.textContent,errors:document.querySelector("#qa-errors")?.textContent,version:window.RevisaWiki?.version,assertions:window.__qaAssertions})'));}catch{}report.tests.push({name,passed:false,error:String(error.message),state,milliseconds:Date.now()-started});}
    save();console.log(JSON.stringify(report.tests.at(-1)));
}
async function readShortcutTest(mode,origin){
    readingMode=mode;const name='read shortcuts '+mode,started=Date.now();
    const readHelpers=`const assert=(value,label)=>{__rw26QA.assertions=(__rw26QA.assertions||0)+1;if(!value)throw new Error(label)};const wait=async fn=>{for(let n=0;n<1200;n++){if(fn())return;await new Promise(r=>setTimeout(r,15));}throw new Error('UI timeout')};const clean=()=>{assert(__rw26QA.saveCalls.length===0,'No simulated publish');assert(__rw26QA.submits===0,'No form submit');assert(__rw26QA.forbiddenNetwork.length===0,'No unmocked mutation');assert(__rw26QA.errors.length===0,'No browser error');};`;
    const readEval=code=>driver.evaluate(`(async()=>{${readHelpers}${code}})()`);
    try{
        await driver.navigate(origin+'/fixture.html?mode=loader-'+mode);
        await readEval(`await wait(()=>document.querySelectorAll('.rw26-launch').length===3);assert(document.querySelectorAll('.rw26-lead-launch').length===0,'No introduction shortcut');assert(!document.querySelector('#firstHeading button'),'No button appended to article title');assert(document.querySelector('#firstHeading').textContent==='Exemplo de física','Article title stays exact');assert([...document.querySelectorAll('.rw26-launch')].every(e=>e.textContent==='Editar aqui'),'All section labels retained');assert(document.querySelectorAll('.mw-editsection a').length===3,'All native section links retained');const native=document.querySelector('#ca-edit a'),href=native.href;const stale=document.createElement('button');stale.className='rw26-lead-launch';document.querySelector('#firstHeading').append(stale);mw.hook('wikipage.content').fire(jQuery('#mw-content-text'));assert(!stale.isConnected,'Stale introduction shortcut removed by hook');for(let n=0;n<3;n++)mw.hook('wikipage.content').fire(jQuery('#mw-content-text'));assert(document.querySelectorAll('.rw26-launch').length===3,'Hook remount stays idempotent');assert(native.isConnected&&native.href===href,'Native full editor unchanged');clean();`);
        await driver.click('[id="História"] + .mw-editsection .rw26-launch');
        await readEval(`await wait(()=>document.querySelector('.rw26-source'));assert(RevisaWiki.version==='2.6.1','Actual final inline core loaded');assert(RevisaWiki.inlineEditing.context().section==='1','Section control opens intended section');assert(document.querySelector('.rw26-source').value.startsWith('== História =='),'Exact section source boundary');assert(!document.querySelector('.rw26-source').value.includes('Uma introdução.'),'No unexpected introduction section');assert(document.querySelectorAll('.rw26-lead-launch').length===0,'No introduction shortcut after loading');assert(document.querySelectorAll('.rw26-launch').length===3,'All section shortcuts retained after loading');clean();`);
        await driver.click('.rw26-cancel');
        await readEval(`assert(!document.querySelector('.rw26-inline'),'Unchanged section closes normally');assert(document.querySelectorAll('.rw26-lead-launch').length===0,'Introduction shortcut remains absent');clean();`);
        const assertions=await driver.evaluate('__rw26QA.assertions');report.assertions+=assertions;report.tests.push({name,passed:true,assertions,milliseconds:Date.now()-started});
    }catch(error){report.tests.push({name,passed:false,error:String(error.message),milliseconds:Date.now()-started});}
    save();console.log(JSON.stringify(report.tests.at(-1)));
}
(async()=>{try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
    await driver.start(origin);report.browserVersion=driver.version;
    for(bundle of ['core','full']){
        for(const fixture of cases)await test(fixture,origin);
        for(const editor of ['classic','codemirror','source2017'])await talkTest('selected-inline-labels',origin,editor);
        for(const kind of ['manual-rated','stable','race','double-click','read-failure','write-mismatch','hidden-main','hidden-user-talk','hidden-template','registered-multiple','dynamic-valid','dynamic-missing','registered-alias-rated'])await talkTest(kind,origin);
    }
    for(const mode of ['own','community','core','full'])await readShortcutTest(mode,origin);
    report.blockedOutsideRequests=driver.blocked?.length||0;
}catch(error){report.runnerError=String(error.message);process.exitCode=1;}finally{
    // End only the session created by this runner. Never close user windows.
    await Promise.race([driver.close(),new Promise(resolve=>{const timer=setTimeout(resolve,30000);timer.unref();})]);server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));
    report.completedAt=new Date().toISOString();save();if(report.tests.some(t=>!t.passed)||report.runnerError)process.exitCode=1;
}})();
