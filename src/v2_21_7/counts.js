// Count source-bound repairs only when the remaining endpoint is fully covered.
function v2217CountPrefix(source,options={}){
 const cfg=pageContextOptions({...DEFAULTS,...options}),steps=[];let text=source;
 for(const [family,make,prove]of [
  ['delimiters',v2217DelimiterPlan,v2217DelimiterProof],
  ['structure',v2217StructurePlan,v2217StructureProof],
  ['source-layout',v2217SourceLayoutPlan,v2217SourceLayoutProof],
  ['infobox',v2217InfoboxPlan,v2217InfoboxProof],
  ['references',v2217ReferencePlan,v2217ReferenceProof],
  ['reference-collector',v221MissingDefaultCollectorPlan,v221MissingDefaultCollectorProof],
  ['portals',v2217PortalPlan,v2217PortalProof],
  ['talk',v2217TalkPlan,v2217TalkProof]
 ]){
  const before=text;let plan;try{plan=make(before,cfg);}catch{continue;}
  if(!plan||plan.text===before||!prove(before,plan.text,plan,cfg))continue;
  if(v2217AnchorRawAudit(before,plan.text,cfg).length)continue;
  const edits=plan.edits||[],count=edits.reduce((n,e)=>n+(e.count??1),0);
  if(!Number.isSafeInteger(count)||count<1||edits.some(e=>!Number.isSafeInteger(e.count??1)||(e.count??1)<1))continue;
  text=plan.text;steps.push({family,before,after:text,edits,count});
 }
 return {text,steps,count:steps.reduce((n,s)=>n+s.count,0)};
}
function v211RetainedAdjustments(before,after,kinds=[],options={}){
 const fallback=()=>v2217Previous_v211RetainedAdjustments(before,after,kinds,options);
 if(typeof before!=='string'||typeof after!=='string'||before===after)return fallback();
 const prefix=v2217CountPrefix(before,options);if(!prefix.count)return fallback();
 const stable=v2217CountPrefix(after,options);if(stable.text!==after)return fallback();
 const remainder=prefix.text===after?{count:0,exact:true,events:[],topics:[]}:v2217Previous_v211RetainedAdjustments(prefix.text,after,kinds,options);
 if(!remainder.exact||!Number.isSafeInteger(remainder.count)||preservationAudit(before,after,options).length||safeComposition(before,after,options))return fallback();
 const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after),count=prefix.count+remainder.count;
 const events=prefix.steps.flatMap((step,i)=>step.edits.flatMap((edit,j)=>Array.from({length:edit.count??1},(_,n)=>({
  id:sourceHash+':v2217:'+i+':'+j+':'+n,rule:'v2217-source-bound-component',kind:edit.kind||edit.ruleId||step.family,
  sourceHash,outputHash,sourceAnchors:[{start:0,end:before.length}],outputAnchors:[{start:0,end:after.length}],
  phaseSourceHash:v24SyntaxHash(step.before),phaseAnchors:[{start:edit.start,end:edit.end}],family:step.family
 }))));
 return {...remainder,count,exact:true,events:events.concat(remainder.events||[]),sourceHash,outputHash,
  unit:'retained-source-repair-component',unresolved:[],unresolvedFragments:0,text:count+' ajuste'+(count===1?'':'s')+' aplicado'+(count===1?'':'s')};
}
