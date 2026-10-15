'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const sourceFile=process.argv[2]?path.resolve(process.argv[2]):path.join(__dirname,'read_launcher.js'),source=fs.readFileSync(sourceFile,'utf8');let checks=0;
const releaseFile=process.argv[3]?path.resolve(process.argv[3]):null;if(releaseFile)assert(fs.readFileSync(releaseFile,'utf8').includes(source),'Actual artifact contains the exact tested launcher');
function fixture(load){const buttons=[],timers=new Map(),notifications=[];let timerId=0;
 const native={href:'https://pt.wikipedia.org/w/index.php?title=Teste&action=edit&section=1',dataset:{},classList:{contains:()=>false},closest:()=>null,after:b=>buttons.push(b)};
 const full={href:'https://pt.wikipedia.org/w/index.php?title=Teste&action=edit'},heading={append:b=>buttons.push(b)};
 const doc={readyState:'complete',createElement(){return{style:{},disabled:false,textContent:'',addEventListener(type,fn){this[type]=fn;}};},
  querySelectorAll:()=>[native],getElementById:()=>heading,querySelector(selector){return selector==='#ca-edit a[href]'?full:buttons.find(b=>b.className.includes('rw26-lead-launch'));}};
 const root={document:doc,location:{origin:'https://pt.wikipedia.org',hostname:'pt.wikipedia.org',href:'https://pt.wikipedia.org/wiki/Teste'},setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);}};
 const mw={config:{get:key=>({wgAction:'view',wgPageContentModel:'wikitext',wgRevisionId:100,wgCurRevisionId:100})[key]},hook:()=>({add(){}}),notify:(...args)=>notifications.push(args)};
 const install=vm.runInNewContext(source+';v26InstallReadLauncher',{URL,Set,Promise});install(root,mw,()=>load(root));return{root,buttons,timers,notifications};}
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
(async()=>{
 for(const lead of [false,true]){let attempts=0;const f=fixture(()=>{attempts++;return Promise.reject(Error('local core failure'));}),b=f.buttons[lead?1:0],label=b.textContent;
  b.click();assert.equal(b.disabled,true);checks++;await flush();assert.equal(f.root.RevisaWikiInlinePending,null);checks++;assert.equal(b.disabled,false);checks++;assert.equal(b.textContent,label);checks++;assert.equal(f.timers.size,0);checks++;assert.equal(attempts,1);checks++;
  b.click();await flush();assert.equal(attempts,2);checks++;assert.equal(b.textContent,label);checks++;assert.equal(f.timers.size,0);checks++;
 }
 for(const mode of ['error','data-error','missing-api','logged-out']){const f=fixture(root=>{root.RevisaWikiLoadInfo={state:mode};return Promise.resolve();});f.buttons[0].click();await flush();assert.equal(f.root.RevisaWikiInlinePending,null);checks++;assert.equal(f.buttons[0].disabled,false);checks++;assert.equal(f.timers.size,0);checks++;}
 const f=fixture(()=>new Promise(()=>{}));f.buttons[0].click();const a=f.root.RevisaWikiInlinePending;f.timers.get(a.timer)();assert.equal(f.root.RevisaWikiInlinePending,null);checks++;
 const lead=f.buttons[1],label=lead.textContent;lead.click();const b=f.root.RevisaWikiInlinePending;f.root.RevisaWikiInlineLoadFailed(a);assert.equal(f.root.RevisaWikiInlinePending,b);checks++;assert.equal(lead.disabled,true);checks++;assert.equal(f.timers.size,1);checks++;
 f.root.RevisaWikiInlineLoadSettled(b);assert.equal(f.root.RevisaWikiInlinePending,null);checks++;assert.equal(lead.textContent,label);checks++;assert.equal(lead.disabled,false);checks++;assert.equal(f.timers.size,0);checks++;
 console.log(JSON.stringify({suite:'v26-read-launcher-lifecycle',sourceFile:'read_launcher.js',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),...(releaseFile?{releaseFile:path.basename(releaseFile),releaseSha256:crypto.createHash('sha256').update(fs.readFileSync(releaseFile)).digest('hex'),exactSourcePresent:true}:{}),passed:checks,failed:0,networkRequests:0,wikipediaWrites:0}));
})().catch(error=>{console.error(error);process.exitCode=1;});
