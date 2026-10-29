'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
const file=path.resolve(__dirname,'../../src/v2_21_4/automatic_ui.js'),source=fs.readFileSync(file,'utf8'),tree=parser.parse(source),functions=Object.fromEntries(tree.program.body.filter(n=>n.type==='FunctionDeclaration').map(n=>[n.id.name,source.slice(n.start,n.end)]));
let checks=0,cases=0;
const eq=(a,b)=>{checks++;assert.deepEqual(a,b);};
const ok=x=>{checks++;assert.ok(x);};
async function test(name,fn){await fn();cases++;}
function load(names,context={}){context={console,URLSearchParams,...context};vm.createContext(context);vm.runInContext(names.map(n=>functions[n]).join('\n'),context);return context;}
class Element{
 constructor(tag,text,classes=''){this.tagName=tag;this.className=classes;this.children=[];this.attributes={};this.dataset={};this.style={};this.hidden=false;this.disabled=false;this.isConnected=true;this.events={};this._text=text||'';this.classList={contains:c=>this.className.split(/\s+/).includes(c),toggle:(c,on)=>{const all=new Set(this.className.split(/\s+/).filter(Boolean));on?all.add(c):all.delete(c);this.className=[...all].join(' ');}};}
 get textContent(){return this._text+this.children.map(n=>typeof n==='string'?n:n.textContent).join('');}
 set textContent(v){this._text=String(v);this.children=[];}
 append(...items){for(const item of items){this.children.push(item);if(item&&typeof item==='object')item.parentNode=this;}}
 appendChild(item){this.append(item);return item;}
 prepend(...items){for(const item of items.reverse()){this.children.unshift(item);if(item&&typeof item==='object')item.parentNode=this;}}
 insertBefore(item,anchor){const i=this.children.indexOf(anchor);if(i<0)this.append(item);else{this.children.splice(i,0,item);item.parentNode=this;}}
 after(item){if(this.parentNode){const i=this.parentNode.children.indexOf(this);this.parentNode.children.splice(i+1,0,item);item.parentNode=this.parentNode;}}
 replaceChildren(...items){this.children=[];this._text='';this.append(...items);}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.isConnected=false;}
 setAttribute(key,value){this.attributes[key]=String(value);}
 getAttribute(key){return this.attributes[key];}
 addEventListener(type,fn){(this.events[type]||=[]).push(fn);}
 querySelectorAll(selector){const all=[];for(const child of this.children){if(typeof child!=='object')continue;if(selector.split(',').some(s=>matches(child,s.trim())))all.push(child);all.push(...child.querySelectorAll(selector));}return all;}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
}
function matches(node,selector){if(selector.startsWith('#'))return node.id===selector.slice(1);if(selector.startsWith('.'))return node.className.split(/\s+/).includes(selector.slice(1));return node.tagName===selector;}
function uiContext(namespace=0,styles=false){
 let text='original';const rootNode=new Element('body'),anchor=new Element('textarea');anchor.id='wpTextbox1';rootNode.append(anchor);
 const document={body:rootNode,querySelector:s=>s.includes('#wpTextbox1')?anchor:s==='#mw-content-text'?rootNode:null,querySelectorAll:s=>rootNode.querySelectorAll(s),getElementById:id=>id==='wpTextbox1'?anchor:null};
 const cfg={autoPreview:true,tableChecks:true,references:true,dateChecks:true,externalLinkColumns:true,review:true};
 const context={root:{document},mw:{config:{get:key=>key==='wgNamespaceNumber'?namespace:''}},inlineController:null,editor:()=>adapter,panel:null,panelEditor:null,localTask:null,last:null,lastLocalResult:null,comparisonPlan:null,ignoredSuggestions:new Set(),issueStore:new Map(),queryCache:new Map(),cacheBytes:0,VERSION:'2.21.4',stylesMode:styles,onlineBusy:false,localBusy:false,activeCheck:null,publishAdjustment:null,preferences:{preset:'all',overrides:{}},minorOwned:null,v211CheckedDraft:null,
 node:(tag,value,classes)=>new Element(tag,value,classes),button:(label,action,classes)=>{const b=new Element('button',label,classes);b.action=action;return b;},personalConfig:()=>({}),currentOptions:()=>({...cfg}),savePreferences:()=>{},installPanelStyle:()=>{},mountPublishAdjustment:()=>{},editingSection:()=>null,currentTitle:()=> 'Página de teste',sourceTarget:()=>null,busy:()=>{},v214NativeDiffControl:()=>({disabled:false}),onMinorDraftChange:()=>{},v211SyncFreshness:()=>{},message:()=>{},run:()=>{},undo:()=>{},cancelLocalAnalysis:()=>{},prepareTalkHeader:()=>{},checkStyles:()=>{},undoStyle:()=>{},cancelCheck:()=>{},showAppliedChanges:()=>{},updateAppliedResult:()=>{}};
 const adapter={id:'test-editor',read:()=>text,write:value=>{text=value;}};return{context,adapter,cfg,document,rootNode,anchor,text:()=>text};
}
function runContext(overrides={}){
 let draft='before';const calls=[],messages=[],adapter={id:'editor',read:()=>draft,write:value=>{calls.push('write');draft=value;}};
 const base={editor:()=>adapter,currentOptions:trace=>({autoPreview:true,references:true,trace}),v211FreshnessKey:()=> 'requested-options',v211CheckedDraft:null,v211SyncFreshness:()=>{},last:null,localTask:null,comparisonPlan:null,
 lastEditorContextMatches:()=>true,restoreOwnedSummary:()=>calls.push('restoreSummary'),restoreOwnedMinor:()=>calls.push('restoreMinor'),
 beginLocalAnalysis:(a,b)=>{calls.push('begin');const t={guard:()=>calls.push('guard')};context.localTask=t;return t;},
 appliedBaseline:()=> 'before',computeLocal:async()=>{calls.push('compute');return{text:'after',changes:[{label:'Ajuste'}]};},verifyAutomaticResult:async(t,r)=>{calls.push('verify');return r;},v219AutomaticResultSafety:()=>{calls.push('safety');return{accepted:true};},v219SafetyTaskContext:()=>({}),v219AutomaticResultRollback:async()=>{calls.push('rollback');return{text:'before',changes:[],previewCheck:{status:'rollback'}};},
 rememberEdit:()=>calls.push('remember'),showReport:()=>calls.push('show'),v211MarkCheckedDraft:()=>calls.push('checked'),message:value=>messages.push(value),finishLocalAnalysis:()=>calls.push('finish')};
 for(const n of ['prepareAutomaticProofs','v211PrepareLeadImage','prepareReferenceColumns','prepareEndMatter','prepareLivingCategory','prepareBiographyGender','prepareBirthCategory','v220PrepareHumanIdentity'])base[n]=async(t,cfg)=>{calls.push(n);return cfg;};
 const context=load(['v2214OperationalMessage','run'],{...base,...overrides});return{context,calls,messages,adapter,draft:()=>draft,setDraft:value=>{draft=value;}};
}
(async()=>{
 await test('No review DOM or report computations',()=>{
  for(const token of ['ajg-report','ajg-review-area','ajg-style-choices','ajg-suggestions','ajg-pending-list','ajg-recovery','Recuperar descrição curta'])ok(!source.includes(token));
  for(const token of ['v217FinalReviewResult','referenceAudit(','v217VisibleReviewPlan','renderChoice','goToFinding'])ok(!functions.showReport.includes(token));
  ok(!functions.renderIssues.includes('querySelector'));ok(!functions.run.includes('setIssues'));ok(!functions.run.includes('relatório'));ok(!functions.run.includes('avisos'));
  for(const key of ['tableChecks','references','dateChecks','externalLinkColumns'])ok(!new RegExp(key+'\\s*[:=]\\s*false').test(source));
  ok(!('computeLocal' in functions));ok(!('verifyAutomaticResult' in functions));ok(!('calculationSteps' in functions));
 });
 await test('Result context and minor ownership',()=>{
  const calls=[],ctx=load(['showReport'],{editor:()=>({}),localEditorContext:()=>({id:'same'}),v219UIContextSame:(a,b)=>a.id===b.id,lastLocalResult:null,syncMinorResult:r=>calls.push(['minor',r.text]),updateAppliedResult:()=>calls.push(['result'])});
  ctx.showReport({text:'after'});eq(calls,[['minor','after'],['result']]);
  ctx.showReport({text:'wrong',uiContext:{id:'other'}});eq(ctx.lastLocalResult.text,'after');eq(calls.length,2);
 });
 await test('Apply keeps preflight, preview and safety order',async()=>{
  const x=runContext();await x.context.run();eq(x.draft(),'after');eq(x.messages.at(-1),'Código ajustado.');
  const ordered=['compute','verify','safety','guard','write','remember','show','checked','finish'];let index=-1;for(const call of ordered){index=x.calls.indexOf(call,index+1);ok(index>=0);}
  ok(x.calls.includes('prepareAutomaticProofs'));ok(x.calls.includes('prepareReferenceColumns'));ok(functions.run.includes('prepareAutomaticProofs(task,currentOptions(false))'));ok(!functions.run.includes('currentOptions(true)'));
 });
 await test('Completed no-op',async()=>{const x=runContext({computeLocal:async()=>({text:'before',changes:[]})});await x.context.run();eq(x.draft(),'before');eq(x.messages.at(-1),'Nenhuma alteração automática aplicada.');ok(!x.calls.includes('write'));});
 await test('Rollback no-op without review or reason',async()=>{const x=runContext({v219AutomaticResultSafety:()=>({accepted:false})});await x.context.run();eq(x.draft(),'before');eq(x.messages.at(-1),'Nenhuma alteração automática aplicada.');ok(x.calls.includes('rollback'));ok(!x.calls.includes('write'));});
 await test('Only retained partial candidate applied',async()=>{const x=runContext({verifyAutomaticResult:async()=>({text:'safe part',changes:[{label:'Correção mantida'}]})});await x.context.run();eq(x.draft(),'safe part');eq(x.messages.at(-1),'Código ajustado.');});
 await test('Timeout is not no-op success',async()=>{const x=runContext({computeLocal:async()=>{throw new Error('A análise demorou demais.');}});await x.context.run();eq(x.draft(),'before');eq(x.messages.at(-1),'A análise atingiu o limite de 60 segundos. Seu rascunho foi preservado.');ok(!x.calls.includes('write'));ok(x.calls.includes('finish'));});
 await test('Known integrity rejection is a silent completed no-op',async()=>{const x=runContext({computeLocal:async()=>{throw new Error('A análise local não confirmou a preservação deste texto. Nenhum ajuste foi aplicado.');}});await x.context.run();eq(x.draft(),'before');eq(x.messages.at(-1),'Nenhuma alteração automática aplicada.');ok(!x.calls.includes('write'));});
 await test('Real cancellation',async()=>{const x=runContext({computeLocal:async()=>{throw new Error('Análise cancelada.');}});await x.context.run();eq(x.messages.at(-1),'Análise cancelada. Seu rascunho foi preservado.');eq(x.draft(),'before');});
 await test('Network failure is operational',async()=>{const x=runContext({computeLocal:async()=>{throw new Error('NetworkError: no response');}});await x.context.run();eq(x.messages.at(-1),'A análise não terminou. Seu rascunho foi preservado.');eq(x.draft(),'before');});
 await test('Stale draft cannot be overwritten',async()=>{let x;x=runContext({verifyAutomaticResult:async(t,r)=>{x.setDraft('new manual edit');t.guard=()=>{throw new Error('O texto mudou durante a análise.');};return r;}});await x.context.run();eq(x.draft(),'new manual edit');eq(x.messages.at(-1),'O texto mudou durante a análise. Nenhum resultado foi aplicado.');ok(!x.calls.includes('write'));});
 await test('Editor write failure does not claim preservation',async()=>{const x=runContext();x.adapter.write=()=>{};await x.context.run();eq(x.draft(),'before');eq(x.messages.at(-1),'O editor não confirmou a atualização.');ok(!x.calls.includes('remember'));});
 await test('Post-write feedback failure reports the applied draft honestly',async()=>{const x=runContext({showReport:()=>{throw new Error('display failed');}});await x.context.run();eq(x.draft(),'after');eq(x.messages.at(-1),'Os ajustes permanecem no editor.');ok(x.calls.includes('remember'));ok(x.calls.includes('finish'));});
 await test('A later manual edit after confirmed writing remains untouched',async()=>{let x;x=runContext({showReport:()=>{x.setDraft('manual after adjustment');throw new Error('display failed');}});await x.context.run();eq(x.draft(),'manual after adjustment');eq(x.messages.at(-1),'O texto mudou após os ajustes. Seu texto atual foi mantido.');});
 await test('Current manual draft after unrelated failure',async()=>{let x;x=runContext({computeLocal:async()=>{x.setDraft('manual edit');throw new Error('unavailable');}});await x.context.run();eq(x.draft(),'manual edit');eq(x.messages.at(-1),'A análise não terminou. Seu texto atual foi mantido.');});
 for(const namespace of [0,1,10])await test('Minimal mount namespace '+namespace,()=>{
  const x=uiContext(namespace),ctx=load(['settingsPanel','mount'],x.context);ctx.mount();const p=ctx.panel;
  ok(p);eq(p.querySelectorAll('.ajg-run').length,1);eq(p.querySelectorAll('.ajg-undo').length,1);eq(p.querySelectorAll('.ajg-show-changes').length,1);eq(p.querySelectorAll('.ajg-report').length,0);eq(p.querySelectorAll('.ajg-review-area').length,0);eq(p.querySelectorAll('.ajg-prepare-talk').length,namespace===1?1:0);
  const keys=p.querySelectorAll('input').map(n=>n.dataset.option);for(const key of ['references','tableChecks','dateChecks','autoPreview','externalLinkColumns','autoSummary','autoMinor'])ok(keys.includes(key));ok(!keys.includes('review'));
  const external=p.querySelectorAll('input').find(n=>n.dataset.option==='externalLinkColumns');eq(external.checked,true);
  ctx.mount();eq(x.rootNode.querySelectorAll('#revisawiki-ptwiki').length,1);
 });
 await test('TemplateStyles mount has only automatic controls',()=>{
  const x=uiContext(10,true),ctx=load(['mountStyles'],x.context);ctx.mountStyles();eq(ctx.panel.querySelectorAll('.ajg-check').length,1);eq(ctx.panel.querySelectorAll('.ajg-undo').length,1);eq(ctx.panel.querySelectorAll('.ajg-report').length,0);eq(ctx.panel.querySelectorAll('.ajg-style-choices').length,0);ok(ctx.panel.textContent.includes('Ajustar CSS'));
 });
 await test('Actual count and bytes, cached after first calculation',()=>{
  const x=uiContext(),calls=[],ctx=load(['settingsPanel','mount','updateAppliedResult'],{...x.context,lastEditorContextMatches:()=>true,restoreOwnedSummary:()=>calls.push('restoreSummary'),restoreOwnedMinor:()=>calls.push('restoreMinor'),v211FreshnessKey:()=> 'binding',v211RetainedAdjustments:()=>{calls.push('count');return{text:'7 ajustes',count:7};},byteMetrics:()=>({delta:-12}),showByteBadge:(node,m)=>{node.textContent=m.delta+' bytes';node.hidden=false;},queueAppliedPresentation:()=>calls.push('queued')});ctx.mount();x.adapter.write('after');ctx.last={id:'test-editor',before:'original',after:'after',kinds:['syntax'],presentationBinding:'binding'};ctx.updateAppliedResult();eq(ctx.panel.querySelector('.ajg-result-count').textContent,'7 ajustes');eq(ctx.panel.querySelector('.ajg-bytes').textContent,'-12 bytes');eq(ctx.panel.querySelector('.ajg-result').hidden,false);ctx.updateAppliedResult();eq(calls.filter(x=>x==='count').length,1);
  x.adapter.write('new manual edit');ctx.updateAppliedResult();eq(ctx.panel.querySelector('.ajg-result').hidden,true);ok(calls.includes('restoreSummary'));
 });
 await test('Deferred count does not invent a total',()=>{
  const x=uiContext(),ctx=load(['settingsPanel','mount','updateAppliedResult'],{...x.context,lastEditorContextMatches:()=>true,v211FreshnessKey:()=> 'binding',queueAppliedPresentation:r=>{r.queued=true;},byteMetrics:()=>({delta:3}),showByteBadge:()=>{}});ctx.mount();x.adapter.write('after');ctx.last={id:'test-editor',before:'original',after:'after',presentationDeferred:true,presentationBinding:'binding'};ctx.updateAppliedResult();eq(ctx.panel.querySelector('.ajg-result-count').textContent,'Contando ajustes...');eq(ctx.last.queued,true);
 });
 await test('Undo restores text, summary and minor ownership',async()=>{
  const x=uiContext(),calls=[],ctx=load(['settingsPanel','mount','undo'],{...x.context,lastEditorContextMatches:()=>true,restoreOwnedSummary:()=>calls.push('summary'),restoreOwnedMinor:()=>calls.push('minor'),v211SyncFreshness:()=>{},message:x=>calls.push(x)});ctx.mount();x.adapter.write('after');ctx.last={id:'test-editor',before:'original',after:'after',summary:{}};await ctx.undo();eq(x.text(),'original');eq(ctx.last,null);ok(calls.includes('summary'));ok(calls.includes('minor'));eq(calls.at(-1),'Texto anterior ao ajuste restaurado.');
 });
 await test('Undo preserves subsequent manual work',async()=>{
  const x=uiContext(),messages=[],ctx=load(['undo'],{...x.context,last:{id:'test-editor',before:'old',after:'after'},lastEditorContextMatches:()=>true,message:x=>messages.push(x)});x.adapter.write('manual');await ctx.undo();eq(x.text(),'manual');eq(messages.length,1);
 });
 function cssContext(overrides={}){
  let draft='old',writes=0,requests=0;const messages=[],proofs=[],adapter={id:'css',read:()=>draft,write:t=>{writes++;draft=t;}};
  const session={source:'old',title:'Predefinição:Exemplo/styles.css',guard:()=>{}};
  class DOMParser{parseFromString(html){return{querySelector:()=>null,querySelectorAll:()=>[{textContent:'same normalized css'}]};}}
  const ctx=load(['v2214OperationalMessage','checkStyles'],{localBusy:false,onlineBusy:false,onlineSession:()=>session,v215StylePlan:()=>({source:'old',text:'new',sourceHash:'source',textHash:'candidate',edits:[{}]}),busy:()=>{},message:x=>messages.push(x),root:{DOMParser},request:async(s,method,params)=>{requests++;eq(method,'get');eq(params.action,'parse');return{parse:{text:'<style>same normalized css</style>',parsewarnings:[]}};},v215StyleAcceptance:(plan,proof)=>{proofs.push(proof);return{accepted:true,text:'new',count:2};},editor:()=>adapter,rememberEdit:()=>{},byteMetrics:()=>({delta:4}),...overrides});return{ctx,adapter,session,messages,proofs,writes:()=>writes,requests:()=>requests,draft:()=>draft,setDraft:x=>{draft=x;}};
 }
 await test('CSS requires paired native sanitizer proof',async()=>{const x=cssContext();await x.ctx.checkStyles();eq(x.requests(),2);eq(x.writes(),1);eq(x.draft(),'new');eq(x.proofs[0].kind,'native-template-styles');eq(x.proofs[0].source,'old');eq(x.proofs[0].candidate,'new');eq(x.messages.at(-1),'2 ajustes aplicados ao CSS · +4 bytes.');});
 await test('CSS post-write presentation failure does not claim a rollback',async()=>{const x=cssContext({byteMetrics:()=>{throw new Error('display failed');}});await x.ctx.checkStyles();eq(x.draft(),'new');eq(x.writes(),1);eq(x.messages.at(-1),'Os ajustes permanecem no editor.');});
 await test('CSS no-op avoids diagnostics-only requests',async()=>{const x=cssContext({v215StylePlan:()=>({edits:[]})});await x.ctx.checkStyles();eq(x.requests(),0);eq(x.writes(),0);eq(x.messages.at(-1),'Nenhuma alteração automática aplicada.');});
 await test('Rejected CSS does not write or disclose diagnostics',async()=>{const x=cssContext({v215StyleAcceptance:()=>({accepted:false,reasons:['internal']})});await x.ctx.checkStyles();eq(x.writes(),0);eq(x.draft(),'old');eq(x.messages.at(-1),'Nenhuma alteração automática aplicada.');});
 await test('CSS stale draft preserved',async()=>{const x=cssContext();x.session.guard=()=>{x.setDraft('manual CSS');throw new Error('O texto mudou durante a análise.');};await x.ctx.checkStyles();eq(x.writes(),0);eq(x.draft(),'manual CSS');eq(x.messages.at(-1),'O texto mudou durante a análise. Nenhum resultado foi aplicado.');});
 await test('CSS network failure is not no-op success',async()=>{const x=cssContext({request:async()=>{throw new Error('unavailable');}});await x.ctx.checkStyles();eq(x.writes(),0);eq(x.messages.at(-1),'A análise não terminou. Seu rascunho foi preservado.');});
 await test('CSS Undo rejects an unconfirmed restoration',()=>{
  const x=uiContext(10,true),messages=[],ctx=load(['undoStyle'],{...x.context,last:{before:'old',after:'original'},lastEditorContextMatches:()=>true,restoreOwnedSummary:()=>{throw new Error('must not restore ownership before text');},message:m=>messages.push(m)});x.adapter.write=()=>{};ctx.undoStyle();eq(ctx.last.before,'old');eq(messages.at(-1),'O editor não confirmou a restauração.');
 });
 await test('CSS cancel aborts owned requests without restoration claims',()=>{const calls=[],ctx=load(['cancelCheck'],{activeCheck:{cancelled:false,requests:[{abort:()=>calls.push('abort')},{}]},message:x=>calls.push(x)});ctx.cancelCheck();eq(ctx.activeCheck.cancelled,true);eq(calls,['abort','Cancelando a análise...']);});
 console.log(JSON.stringify({suite:'RevisaWiki 2.21.4 automatic UI contract',status:'passed',cases,checks,sourceSha256:crypto.createHash('sha256').update(source).digest('hex')}));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
