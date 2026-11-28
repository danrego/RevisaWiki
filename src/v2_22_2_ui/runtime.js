const v2222EditorBases=[];
const v2222SummaryOwners=[];
let v2222CountTask=null;

function v2222DiscussionEditor(adapter=editor()){
 const context=adapter&&localEditorContext(adapter);
 return !!context&&Number(context.namespace)>0&&Number(context.namespace)%2===1&&context.model==='wikitext'&&editingSection()===null;
}
function v2222BaseRecord(adapter){
 if(!adapter)return null;const context=localEditorContext(adapter);
 return v2222EditorBases.find(row=>row.editor===adapter.id&&v219UIContextSame(row.context,context))||null;
}
async function v2222EnsureLoadedBase(task){
 const adapter=editor();if(!v2222DiscussionEditor(adapter))return null;
 const existing=v2222BaseRecord(adapter);if(existing)return existing;
 const context=localEditorContext(adapter),inline=inlineController?.context();let text=null;
 if(inline&&inline.base===context.base&&typeof inline.pageSource==='string'&&inline.section===null)text=inline.pageSource;
 if(text===null&&context.base>0){
  try{
   task.client??=new mw.Api({ajax:{timeout:15000}});task.requests??=new Set();task.key??=JSON.stringify(['loaded-base',task.title,context.base,context.section]);
   const response=await request(task,'get',{action:'query',formatversion:2,prop:'revisions',revids:context.base,rvprop:'ids|content|contentmodel',rvslots:'main'});task.guard();
   const pages=response?.query?.pages,normal=value=>String(value||'').normalize('NFC').replace(/_/g,' ');
   if(Array.isArray(pages)&&pages.length===1){const page=pages[0],revision=page.revisions?.[0],slot=revision?.slots?.main;
    if(normal(page.title)===normal(task.title)&&Number(page.ns)===Number(context.namespace)&&revision?.revid===context.base&&slot?.contentmodel==='wikitext'&&typeof slot.content==='string')text=slot.content;
   }
  }catch{task.guard();}
 }
 if(text===null&&context.base===0&&mw.config.get('wgArticleId')===0&&mw.config.get('wgCurRevisionId')===0)text='';
 task.guard();if(text===null||text.length>4194304)return null;
 const record={editor:adapter.id,context,text};v2222EditorBases.push(record);
 while(v2222EditorBases.length>4||v2222EditorBases.reduce((n,r)=>n+r.text.length*2,0)>16777216)v2222EditorBases.shift();
 return record;
}
function v2222SummaryText(adapter,before,after){
 if(!v2222DiscussionEditor(adapter))return '';
 const base=v2222BaseRecord(adapter);if(!base&&before===after)return '';
 return v2222DiscussionSummary(base?base.text:before,after,currentOptions(false));
}
function automaticSummary(kinds,topics){
 if(currentOptions(false).autoSummary===false)return '';
 const personal=personalConfig();if(typeof personal.summaryText==='string')return personal.summaryText.trim();
 const adapter=editor(),after=adapter?.read(),before=lastEditorContextMatches(adapter)?last.before:after;
 return v2222SummaryText(adapter,before,after)||'Minúcias';
}
function v2222FillDiscussionSummary(adapter,before,after){
 if(!v2222DiscussionEditor(adapter)||currentOptions(false).autoSummary===false||typeof personalConfig().summaryText==='string')return;
 const summary=summaryEditor();if(!summary)return;
 const context=localEditorContext(adapter),owned=v2222SummaryOwners.find(row=>row.editor===adapter.id&&row.summaryId===summary.id&&v219UIContextSame(row.context,context));
 const text=v2222SummaryText(adapter,before,after);
 if(!text){if(owned&&summary.read()===owned.after)summary.restore(owned.before);if(owned)v2222SummaryOwners.splice(v2222SummaryOwners.indexOf(owned),1);return;}
 const current=summary.read();let prefix='',original;
 if(owned&&current===owned.after){prefix=owned.prefix;original=owned.before;}
 else if(lastEditorContextMatches(adapter)&&last.summary&&current===last.summary.after){prefix=last.summary.prefix||'';original=last.summary.before;}
 else {if(!/^\s*(?:\/\*[^\r\n]*?\*\/\s*)?$/.test(current))return;prefix=current.trim()?current.trimEnd()+' ':'';original=summary.snapshot();}
 const generated=prefix+text;summary.write(generated);
 const record={editor:adapter.id,summaryId:summary.id,context,prefix,before:original,after:generated};
 if(owned)v2222SummaryOwners.splice(v2222SummaryOwners.indexOf(owned),1);v2222SummaryOwners.push(record);while(v2222SummaryOwners.length>8)v2222SummaryOwners.shift();
 if(lastEditorContextMatches(adapter))last.summary={id:summary.id,context,before:original,prefix,after:generated};
}
function rememberEdit(adapter,before,after,kind='syntax',ruleLabel,metadata=null,metrics=null){
 if(before===after)return;
 const context=localEditorContext(adapter),continuing=lastEditorContextMatches(adapter)&&last.after===before;
 const originalText=continuing?last.before:before,semanticHistory=continuing?last.semanticHistory:null,manualSemantic=continuing&&last.manualSemantic===true,previousSummary=continuing?last.summary:null;
 if(after===originalText){restoreOwnedMinor();try{restoreOwnedSummary(previousSummary);}catch(error){root.console.warn('RevisaWiki: não foi possível restaurar o resumo.',error);}last=null;return;}
 const kinds=[...new Set([...(continuing?last.kinds||['syntax']:[]),kind])],rules=[...new Set([...(continuing?last.rules||[]:[]),...(ruleLabel?[ruleLabel]:[])])].slice(0,30);
 const valid=metadata?.schema===1&&metadata.sourceHash===v24SyntaxHash(originalText)&&metadata.outputHash===v24SyntaxHash(after)&&metadata.exact===true&&Number.isSafeInteger(metadata.count)&&metadata.count>0;
 const retainedTypes=valid?{...metadata,text:metadata.count+' ajuste'+(metadata.count===1?'':'s')+' aplicado'+(metadata.count===1?'':'s')}:null;
 last={id:adapter.id,context,before:originalText,after,summary:previousSummary,kinds,topics:[],rules,retainedTypes,presentationDeferred:!valid,presentationBinding:v211FreshnessKey(currentOptions(false)),semanticHistory,manualSemantic,byteMetrics:continuing?null:metrics};
 try{last.summary=fillSummary(kinds,previousSummary,[]);}catch(error){root.console.warn('RevisaWiki: não foi possível preencher o resumo.',error);}
}
function updateAppliedResult(){
 if(!panel||stylesMode)return;v211SyncFreshness();const host=panel.querySelector('.ajg-result');if(!host)return;
 const adapter=editor(),source=adapter?.read();
 if(v2222CountTask&&(last!==v2222CountTask.record||!lastEditorContextMatches(adapter)||source!==v2222CountTask.record.after))v2222StopCount();
 if(last&&!lastEditorContextMatches(adapter)){restoreOwnedSummary(last.summary);restoreOwnedMinor();last=null;}
 if(last&&adapter?.id===last.id&&source!==last.after&&!localBusy&&!onlineBusy){restoreOwnedSummary(last.summary);last.summary=null;if(source===last.before){restoreOwnedMinor();last=null;}}
 const actual=lastEditorContextMatches(adapter)&&source===last.after;host.hidden=!actual;if(!actual)return;
 host.querySelector('.ajg-result-title').textContent='Ajustes aplicados';const retained=last.retainedTypes,count=host.querySelector('.ajg-result-count');
 const exact=retained?.exact===true&&Number.isSafeInteger(retained.count);count.hidden=!exact&&!last.presentationDeferred;count.textContent=exact?retained.text:last.presentationDeferred?'Contando ajustes…':'';
 const metrics=last.byteMetrics||(last.byteMetrics=v2222BytesOnly(last.before,last.after));showByteBadge(host.querySelector('.ajg-bytes'),metrics);
 const view=host.querySelector('.ajg-show-changes'),native=v214NativeDiffControl();view.hidden=!native;view.disabled=localBusy||onlineBusy||!native||native.disabled;host.querySelector('.ajg-undo').hidden=false;queueAppliedPresentation(last);
}
function v2222StopCount(){
 const task=v2222CountTask;if(!task)return;v2222CountTask=null;task.cancelled=true;
 if(workerState===task.state&&workerState?.pending?.id===task.id)dropWorker(new Error('Contagem desatualizada.'));
 api.processing.counting=false;
}
function v2222BytesOnly(before,after){const a=new TextEncoder().encode(before).length,b=new TextEncoder().encode(after).length;return{before:a,after:b,delta:b-a,netExact:true,precise:false,precision:'byte-length'};}
function queueAppliedPresentation(record){
 if(!record?.presentationDeferred||record.presentationStarted||record.presentationTimer||record.presentationError||localBusy||onlineBusy)return;
 record.presentationTimer=root.setTimeout(async()=>{
  record.presentationTimer=null;const adapter=editor();if(last!==record||!lastEditorContextMatches(adapter)||adapter.read()!==record.after||localBusy||onlineBusy)return;
  const options=serializableOptions(currentOptions(false)),binding=v211FreshnessKey(options);let task=null;
  try{
   const state=createWorker();if(state.pending)return;
   task={id:++localSerial,state,record,cancelled:false};v2222CountTask=task;record.presentationStarted=true;api.processing.counting=true;
   const result=await new Promise((resolve,reject)=>{state.pending={id:task.id,resolve,reject,timer:null,progress:()=>{}};try{state.worker.postMessage({type:'calculate',id:task.id,job:{kind:'final-count',source:record.after,originalSource:record.before,options}});}catch(error){state.pending=null;reject(error);}});
   const current=editor(),meta=result?.retainedAdjustments;
   if(task.cancelled||v2222CountTask!==task||last!==record||!lastEditorContextMatches(current)||current.read()!==record.after||binding!==v211FreshnessKey(currentOptions(false)))return;
   if(result.text!==record.after||meta?.schema!==1||meta.sourceHash!==v24SyntaxHash(record.before)||meta.outputHash!==v24SyntaxHash(record.after)||meta.exact!==true||!Number.isSafeInteger(meta.count)||meta.count<=0)throw new Error('Contagem não confirmada.');
   record.retainedTypes={...meta,text:meta.count+' ajuste'+(meta.count===1?'':'s')+' aplicado'+(meta.count===1?'':'s')};record.presentationDeferred=false;
  }catch{if(last===record){record.presentationDeferred=false;record.presentationError=true;}}
  finally{record.presentationStarted=false;if(v2222CountTask===task){v2222CountTask=null;api.processing.counting=false;}if(last===record)updateAppliedResult();}
 },0);
}
function v2222WatchPage(adapter){
 if(!adapter||editor()?.id!==adapter.id||!root.document)return false;
 const context=localEditorContext(adapter);if(!context||context.model!=='wikitext')return false;
 let box=root.document.getElementById('wpWatchthis');
 if(box&&box.type!=='checkbox')box=box.querySelector?.('input[type="checkbox"]');
 if(!box)box=root.document.querySelector('input[type="checkbox"][name="wpWatchthis"]');
 if(!box||box.type!=='checkbox'||box.disabled||box.isConnected===false||box.checked)return false;
 box.checked=true;box.dispatchEvent(new root.Event('change',{bubbles:true}));return true;
}

function showByteBadge(host,metrics){
 if(!host)return;host.hidden=!metrics;if(!metrics)return;
 const delta=metrics.delta,sign=delta>0?'+':delta<0?'−':'';
 host.textContent=sign+Math.abs(delta).toLocaleString('pt-BR')+' bytes';host.className='ajg-bytes '+(delta>0?'ajg-bytes-plus':delta<0?'ajg-bytes-minus':'ajg-bytes-neutral');
 host.setAttribute('aria-label','Variação de tamanho: '+(delta>0?'aumento de ':delta<0?'redução de ':'')+Math.abs(delta).toLocaleString('pt-BR')+' bytes.');
 const detail=metrics.precision==='byte-length'?'Variação líquida exata.':metrics.precise===false?'Variação líquida exata. O detalhamento das inserções e remoções ultrapassou o limite de cálculo.':'Inserções contabilizadas: '+metrics.added+'. Remoções contabilizadas: '+metrics.removed+'.';
 host.title='Antes: '+metrics.before.toLocaleString('pt-BR')+' bytes. Depois: '+metrics.after.toLocaleString('pt-BR')+' bytes. '+detail;
}
