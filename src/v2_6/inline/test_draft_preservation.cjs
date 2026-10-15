'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const file=process.argv[2]?path.resolve(process.argv[2]):path.join(__dirname,'inline_controller.js'),source=fs.readFileSync(file,'utf8');
const releaseFile=process.argv[3]?path.resolve(process.argv[3]):null; if(releaseFile)assert(fs.readFileSync(releaseFile,'utf8').includes(source),'Actual distribution contains the exact tested inline controller');
const helpers=vm.runInNewContext(source+';v26InlineHelpers',{URL,Date,Error,Set,Number,String,Object,Array,JSON});
const start=source.indexOf('        function clearRecovery(s) {'),end=source.indexOf('        function emitInput(s)',start);
assert(start>=0&&end>start);const clearSource=source.slice(start,end).trim();
const origin='https://pt.wikipedia.org',context={title:'Artigo de teste',section:'1',base:100};
const record={schema:1,origin,title:context.title,section:context.section,base:context.base,savedAt:Date.now(),text:'rascunho',summary:'resumo',watchlist:'preferences'};
let checks=0;
for(const [change,remove] of [[{},true],[{title:'Outro artigo'},false],[{section:'0'},false],[{base:101},false],[{origin:'https://en.wikipedia.org'},false],[{schema:2},false],[{base:0},false],[{base:100.5},false]]){
 const stored=JSON.stringify({...record,...change});let current=stored,removed=0;
 const clear=vm.runInNewContext('('+clearSource+')',{H:helpers,origin,recoveryKey:'RevisaWiki.inlineDraft.v1',root:{sessionStorage:{getItem:()=>current,removeItem:()=>{removed++;current=null;}}},JSON});
 clear(context);assert.equal(removed,remove?1:0);checks++;assert.equal(current,remove?null:stored);checks++;
}
for(const malformed of ['{','null','{}']){let removed=0;const clear=vm.runInNewContext('('+clearSource+')',{H:helpers,origin,recoveryKey:'RevisaWiki.inlineDraft.v1',root:{sessionStorage:{getItem:()=>malformed,removeItem:()=>removed++}},JSON});clear(context);assert.equal(removed,0);checks++;}
let removed=0;const blocked=vm.runInNewContext('('+clearSource+')',{H:helpers,origin,recoveryKey:'RevisaWiki.inlineDraft.v1',root:{sessionStorage:{getItem(){throw Error('blocked');},removeItem:()=>removed++}},JSON});blocked(context);assert.equal(removed,0);checks++;
const fstart=source.indexOf('        function finish(s) {'),fend=source.indexOf('        function lock(s, locked)',fstart);assert(fstart>=0&&fend>fstart);const finishSource=source.slice(fstart,fend).trim();
for(const [competing,hasTextarea,expectedCancels] of [[true,true,0],[false,true,1],[false,false,0]]){
 let cancels=0,removed=0,refreshed=0,aborted=0,released=0;const textarea=hasTextarea?{}:null;
 const s={textarea,requests:new Set([{abort(){aborted++;}}]),box:{remove(){removed++;}},previewGeneration:0,disposed:false};
 const sandbox={root:{clearTimeout(){}},isActive:()=>true,competingEditor:()=>competing,host:{cancel(id){assert.equal(id,textarea);cancels++;},editorChanged(){refreshed++;}},active:s,closeWindow:{release(){released++;}}};
 const finish=vm.runInNewContext('('+finishSource+')',sandbox);finish(s);
 assert.equal(cancels,expectedCancels);checks++;assert.equal(removed,1);checks++;assert.equal(refreshed,1);checks++;assert.equal(aborted,1);checks++;assert.equal(released,1);checks++;assert.equal(sandbox.active,null);checks++;assert.equal(s.disposed,true);checks++;
}
const matchStart=source.indexOf('        function matchesSentDraft(s) {'),matchEnd=source.indexOf('        function promise(request)',matchStart);
const saveStart=source.indexOf('        function retainAfterSave(s,link) {'),saveEnd=source.indexOf('        async function reconcile(s, snapshot)',saveStart);
assert(matchStart>=0&&matchEnd>matchStart&&saveStart>=0&&saveEnd>saveStart);
for(const mutation of [null,'text','summary','minor','watch','late-text','original-text']){
 let cleared=0,released=0,recovered=0,reloads=0,unloadTest=null;const timers=[];
 const snapshot={text:'publicado',summary:'resumo enviado',minor:false,watchlist:'preferences',user:'Editor de teste'};
 const make=()=>({disabled:false});
 const s={title:'Artigo de teste',base:100,original:'original',initialSummary:'',sentSnapshot:snapshot,
  textarea:{...make(),value:snapshot.text},summaryInput:{...make(),value:snapshot.summary},minorInput:{...make(),checked:false},watchInput:{...make(),value:'preferences'},
  publishButton:make(),previewButton:make(),liveInput:make(),cancelButton:{...make(),onclick:()=>{throw Error('stale bypass');}},nativeButton:make(),
  status:{append(){}},previewGeneration:0};
 if(mutation==='text')s.textarea.value='posterior';if(mutation==='summary')s.summaryInput.value='posterior';if(mutation==='minor')s.minorInput.checked=true;if(mutation==='watch')s.watchInput.value='watch';if(mutation==='original-text')s.textarea.value='original';
 const sandbox={URL,guard(){},origin,doc:{createTextNode:x=>x},text:(tag,label)=>({tag,label,href:''}),
  root:{clearTimeout(){},setTimeout(fn){timers.push(fn);return timers.length;},location:{assign(){reloads++;}}},
  clearRecovery(){cleared++;},saveRecovery(){recovered++;},lock(s,locked){for(const k of ['textarea','summaryInput','minorInput','watchInput','publishButton','previewButton','liveInput','cancelButton','nativeButton'])s[k].disabled=locked;},
  closeWindow:{release(){released++;}},status(s,message,state){if(state)s.state=state;s.message=message;},isActive:()=>true,competingEditor:()=>false,
  mw:{config:{get:()=>snapshot.user},confirmCloseWindow(options){unloadTest=options.test;return{release(){released++;}}}}};
 const saved=vm.runInNewContext(source.slice(matchStart,matchEnd)+source.slice(saveStart,saveEnd)+';saved;',sandbox);saved(s,101,false);
 if(mutation==='late-text'){s.textarea.value='posterior tardio';timers[0]();}
 const newer=mutation!==null;
 assert.equal(s.state,newer?'saved-draft':'saved');checks++;
 assert.equal(s.savedRevision,101);checks++;
 assert.equal(recovered,newer?1:0);checks++;
 assert.equal(cleared,newer&&mutation!=='late-text'?0:1);checks++;
 assert.equal(released,newer&&mutation!=='late-text'?0:1);checks++;
 assert.equal(reloads,0);checks++;
 assert.equal(s.cancelButton.onclick,null);checks++;
 assert.equal(s.publishButton.disabled,true);checks++;
 assert.equal(s.textarea.disabled,!newer);checks++;
 assert.equal(s.summaryInput.disabled,!newer);checks++;
 if(mutation==='late-text'){assert.equal(unloadTest(),true);checks++;}
}
const handoffStart=source.indexOf('        function nativeHandoff(s) {'),handoffEnd=source.indexOf('        function download(s)',handoffStart);assert(handoffStart>=0&&handoffEnd>handoffStart);
for(const state of ['conflict','ready-dirty']){
 let navigations=0,releases=0,stored=0,created=null;const s={state,sourceConflict:true,base:100,href:'https://pt.wikipedia.org/w/index.php?title=Teste&action=edit&section=1',handoff:false,status:{append(){}}};
 const handoff=vm.runInNewContext('('+source.slice(handoffStart,handoffEnd).trim()+')',{isActive:()=>true,host:{isBusy:()=>false},saveRecovery(actual){assert.equal(actual.base,100);stored++;},status(actual,message){actual.message=message;},text(tag,label,className){return created={tag,label,className};},doc:{createTextNode:x=>x},root:{location:{assign(){navigations++;}}},closeWindow:{release(){releases++;}}});
 handoff(s);assert.equal(navigations,0);checks++;assert.equal(releases,0);checks++;assert.equal(stored,1);checks++;assert.equal(s.handoff,false);checks++;assert.equal(s.base,100);checks++;assert.equal(created.target,'_blank');checks++;assert.equal(created.rel,'noopener noreferrer');checks++;assert.equal(created.href,s.href);checks++;
}
console.log(JSON.stringify({suite:'v26-draft-preservation',sourceFile:'inline_controller.js',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),...(releaseFile?{releaseFile:path.basename(releaseFile),releaseSha256:crypto.createHash('sha256').update(fs.readFileSync(releaseFile)).digest('hex'),exactSourcePresent:true}:{}),passed:checks,failed:0,networkRequests:0,wikipediaWrites:0}));
