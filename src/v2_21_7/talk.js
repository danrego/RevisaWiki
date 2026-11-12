// Discussion metadata is normalized separately from the conversation body.
function v2217TalkBotEdits(source,cfg={}) {
 const edits=[];
 for(const node of v2216TalkNodes(source,raw=>v2216LayoutIdentity(raw)==='marca de projeto')){
  const slots=v2216LayoutSlots(node.raw);if(!slots||!slots.has('bot'))continue;
  const next=new Map(slots);let count=1;
  next.delete('bot');if(next.has('rev')){next.delete('rev');count++;}
  const oldQuality=next.has('1')?next.get('1'):(next.get('qualidade')??'');
  if(oldQuality.trim()!=='?'||next.has('1')&&next.has('qualidade'))count++;
  next.set('1','?');next.delete('qualidade');
  const numbers=[...next.keys()].filter(k=>/^\d+$/.test(k)).map(Number).sort((a,b)=>a-b);
  let text='{{Marca de projeto',implicit=1;
  for(const key of numbers){const value=next.get(String(key));text+='|'+(key===implicit++?'':key+'=')+value;}
  for(const [key,value] of next)if(!/^\d+$/.test(key))text+='|'+key+'='+value;
  text+='}}';
  if(text!==node.raw)edits.push({...node,text,kind:'explicit-bot-assessment-cleanup',count,
   witness:{botPresent:true,removedBotValue:slots.get('bot'),removedReviewDate:slots.has('rev')?slots.get('rev'):null,qualityBefore:oldQuality,qualityAfter:'?'}});
 }
 return edits;
}
function v2217TalkMetadataKind(raw) {
 const p=parsedTemplate(raw);if(!p)return null;
 if(v2215PdName(p.parts[0]))return 'header';
 const name=v2216LayoutIdentity(raw);
 if(name==='traduzido')return 'translation';
 if(name==='marca de projeto')return 'projects';
 // These local calls and the Merge redirect were checked independently.
 if(['fusões a avaliar','fusão','fusão com','fusão de','fusão múltipla','fundir','merge'].includes(name))return 'fusion';
 return null;
}
function v2217TalkOrderedHeader(source,cfg={}) {
 if(![1,11,101].includes(cfg.namespaceNumber))return [];
 const nodes=v2216TalkNodes(source,raw=>!!v2217TalkMetadataKind(raw)).filter(node=>
  templates(node.raw).nodes.every(n=>n.depth===0)&&!/<\/?(?:includeonly|noinclude|onlyinclude)\b/i.test(node.raw));
 if(!nodes.length)return [];
 const priority={header:0,translation:1,projects:2,fusion:3};
 const ordered=nodes.map((n,i)=>({...n,position:i,kind:v2217TalkMetadataKind(n.raw)})).sort((a,b)=>priority[a.kind]-priority[b.kind]||a.position-b.position);
 const newline=source.includes('\r\n')?'\r\n':'\n',block=ordered.map(n=>n.raw).join(newline);
 let body=v24SyntaxApply(source,nodes.map(n=>v2216TalkRemoval(source,n))).replace(/^(?:[ \t]*\r?\n)+/,'');
 const text=block+(body?newline+body:(source.endsWith('\n')?newline:''));if(text===source)return [];
 let at=0,count=0;for(const n of ordered){if(n.start!==at)count++;at+=n.raw.length+newline.length;}
 return [{start:0,end:source.length,text,kind:'discussion-metadata-order',count:Math.max(1,count),
  witness:{order:ordered.map(n=>n.kind),calls:ordered.map(n=>n.raw),body}}];
}
function v2217TalkPlan(source,cfg={}) {
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};
 if(!v2216TalkScope(source,cfg))return empty;
 // The presence of bot is the explicit policy. Old provenance records do not
 // authorize changing a marker that has no bot parameter in the current text.
 const options={...cfg,v2216ConfirmedBotAssessments:[]};let text=source;const steps=[];
 for(const [kind,make] of [
  ['bot',s=>v2217TalkBotEdits(s,options)],
  ['projects',s=>v2216TalkProjects(s,options)],
  ['translations',v2216TalkTranslations],
  ['header',s=>v2216TalkHeader(s,options)],
  ['order',s=>v2217TalkOrderedHeader(s,options)]
 ]){
  let edits;try{edits=make(text).sort((a,b)=>a.start-b.start||a.end-b.end);}catch{continue;}
  if(edits.some((e,i)=>i&&e.start<edits[i-1].end))continue;
  const next=v24SyntaxApply(text,edits);if(next!==text){steps.push({kind,sourceHash:v24SyntaxHash(text),edits});text=next;}
 }
 if(text===source)return empty;
 return {...empty,text,steps,edits:[{start:0,end:source.length,text,ruleId:'v2217Talk',
  count:steps.reduce((n,s)=>n+s.edits.reduce((a,e)=>a+(e.count??1),0),0),
  proof:{sourceHash:empty.sourceHash,kinds:steps.map(s=>s.kind)}}]};
}
function v2217TalkProof(before,after,plan,cfg={}) {
 if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
 const fresh=v2217TalkPlan(before,cfg);
 return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
function v2217TalkPreparationPlan(source,article='',cfg={}) {
 const options={...cfg,v2216ConfirmedBotAssessments:[]},initial=v2217TalkPlan(source,options),
  result=v25TalkPreparationPlan(initial.text,article,options),final=v2217TalkPlan(result.text,options),text=final.text;
 return {...result,source,text,changed:text!==source,
  summary:v2216TalkNodes(text,raw=>v2216LayoutIdentity(raw)==='marca de projeto').length?'{{PD}}{{Marca de projeto}}':'{{PD}}'};
}
async function v2216PrepareAssessmentProvenance(task,options={}) {
 const cfg={...options};delete cfg.v2216ConfirmedBotAssessments;
 task.guard();return cfg;
}
function v2216TalkBotSlots(source,node,slots,cfg={}) {
 // Only v2217TalkBotEdits handles the new policy. A stale record cannot clear
 // a current human assessment that has no explicit bot parameter.
 return slots;
}
