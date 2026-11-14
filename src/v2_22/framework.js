// Each stage admits its own replayable edits; an unrelated refusal stays local.
const V222_CORE_PROJECTION_CACHE={map:new Map(),bytes:0};
// Original-source evidence is available only during a synchronous comparison.
const V222_ORIGINAL_AUDIT_STACK=[];
function v222AuditOptionsSnapshot(value){
 let budget=8192,characters=0;
 const copy=(x,depth)=>{
  if(--budget<0||depth>16)throw Error('audit-option-scope');
  if(x===null||typeof x==='undefined'||typeof x==='boolean')return x;
  if(typeof x==='number'){if(!Number.isFinite(x))throw Error('audit-option-number');return x;}
  if(typeof x==='string'){characters+=x.length;if(characters>1048576)throw Error('audit-option-size');return x;}
  if(typeof x!=='object'||!Array.isArray(x)&&Object.getPrototypeOf(x)!==Object.prototype||Object.getOwnPropertySymbols(x).length)throw Error('audit-option-type');
  if(Array.isArray(x)&&x.length>8192)throw Error('audit-option-array-size');
  const descriptors=Object.getOwnPropertyDescriptors(x),out=Array.isArray(x)?[]:{};
  if(Array.isArray(x)&&(Object.keys(descriptors).length!==x.length+1||Array.from({length:x.length},(_,i)=>String(i)).some(key=>!Object.hasOwn(descriptors,key))))throw Error('audit-option-array-shape');
  for(const key of Object.keys(descriptors).sort()){
   if(Array.isArray(x)&&key==='length')continue;
   const d=descriptors[key];if(!d.enumerable||!Object.hasOwn(d,'value'))throw Error('audit-option-descriptor');
   Object.defineProperty(out,key,{value:copy(d.value,depth+1),enumerable:true,writable:false,configurable:false});
  }
  return Object.freeze(out);
 };
 const snapshot=copy(value,0),encode=x=>x===undefined?['undefined']:x===null?['null']:Array.isArray(x)?['array',x.map(encode)]:typeof x==='object'?['object',Object.keys(x).sort().map(k=>[k,encode(x[k])])]:[typeof x,Object.is(x,-0)?'-0':x];
 return {value:snapshot,key:JSON.stringify(encode(snapshot))};
}
function v222AuditPolicyKey(options){
 try{return v222AuditOptionsSnapshot(pageContextOptions({...DEFAULTS,...options})).key;}catch{return null;}
}
function v222WithOriginalAuditContext(before,after,options,inspect){
 let context=null;
 if(V222_ORIGINAL_AUDIT_STACK.length<8&&typeof before==='string'&&typeof after==='string'&&before.length<=524288&&after.length<=524288){
  try{
   const snapshot=v222AuditOptionsSnapshot(options),policyKey=v222AuditPolicyKey(snapshot.value);
   if(policyKey!==null)context={before,after,originalOptions:options,options:snapshot.value,optionsKey:snapshot.key,policyKey,inputs:new Set(),busy:false};
  }catch{}
 }
 // A disabled frame masks every outer frame, including at the depth limit.
 V222_ORIGINAL_AUDIT_STACK.push(null);
 try{
  const policy=context?.options||options,projectedBefore=v2217PreservationProjection(before,policy),projectedAfter=v2217PreservationProjection(after,policy);
  if(context){context.projectedAfter=projectedAfter;context.inputs.add(projectedBefore);V222_ORIGINAL_AUDIT_STACK[V222_ORIGINAL_AUDIT_STACK.length-1]=context;}
  return inspect(projectedBefore,projectedAfter);
 }finally{V222_ORIGINAL_AUDIT_STACK.pop();}
}
function v222AuditProjectionResult(before,after,options,token){
 const context=V222_ORIGINAL_AUDIT_STACK[V222_ORIGINAL_AUDIT_STACK.length-1];
 if(token!==v222AuditProjectionToken||!context||context.busy||!context.inputs.has(before)||context.inputs.size>=32||typeof after!=='string'||after.length>524288||v222AuditPolicyKey(options)!==context.policyKey)return after;
 context.inputs.add(after);return after;
}
function v222OriginalReferenceBindingGuard(before,after,options,original){
 if(original?.accepted)return original;
 const context=V222_ORIGINAL_AUDIT_STACK[V222_ORIGINAL_AUDIT_STACK.length-1];
 if(!context||context.busy||!context.inputs.has(before)||after!==context.projectedAfter||context.before===context.after||
  v222AuditPolicyKey(options)!==context.policyKey||
  !['A posição de uma definição nomeada mudou fora dos ajustes confirmados.',
    'A ordem das chamadas ou a associação com a fonte mudou fora dos ajustes confirmados.'].includes(original?.reason))return original;
 context.busy=true;
 try{
  if(v222AuditOptionsSnapshot(context.originalOptions).key!==context.optionsKey)return original;
  const proof=v222ReferenceBindingFallback(context.before,context.after,context.options);
  if(!proof.accepted||!v222ReferenceBindingFallbackProof(context.before,context.after,proof,context.options))return original;
  return {accepted:true,reason:'',checked:proof.proof.referenceCount};
 }catch{return original;}finally{context.busy=false;}
}
function v222CoreStages(){
 const rows=[['inference','v222InferencePlan','v222InferenceProof'],['flags','v222FlagPlan','v222FlagProof'],['structure-TemplatePrefix','v222StructureTemplatePrefixPlan','v222StructureTemplatePrefixProof'],['structure-HtmlClosures','v222StructureHtmlClosuresPlan','v222StructureHtmlClosuresProof'],['structure-HtmlHeadings','v222StructureHtmlHeadingsPlan','v222StructureHtmlHeadingsProof'],['structure-HeadingAliases','v222StructureHeadingAliasesPlan','v222StructureHeadingAliasesProof'],['structure-GalleryBullet','v222StructureGalleryBulletPlan','v222StructureGalleryBulletProof'],['structure-ListBreaks','v222StructureListBreaksPlan','v222StructureListBreaksProof'],['structure-BlankListGaps','v222StructureBlankListGapsPlan','v222StructureBlankListGapsProof'],['structure-ImageDimensions','v222StructureImageDimensionsPlan','v222StructureImageDimensionsProof'],['structure-UrlProtocol','v222StructureUrlProtocolPlan','v222StructureUrlProtocolProof'],['structure-PercentLinks','v222StructurePercentLinksPlan','v222StructurePercentLinksProof'],['structure-YouTube','v222StructureYouTubePlan','v222StructureYouTubeProof'],['structure-CopiedIsbn','v222StructureCopiedIsbnPlan','v222StructureCopiedIsbnProof'],['structure-Categories','v222StructureCategoriesPlan','v222StructureCategoriesProof'],['citations','v222CitationsPlan','v222CitationsProof'],['infoboxes','v222InfoboxPlan','v222InfoboxProof'],['ref-attributes','v222ReferenceAttributesPlan','v222ReferenceAttributesProof'],['ref-dedup','v222ReferenceDedupPlan','v222ReferenceDedupProof'],['ref-orphans','v222ReferenceOrphansPlan','v222ReferenceOrphansProof'],['ref-collectors','v222ReferenceCollectorsPlan','v222ReferenceCollectorsProof'],['ref-collector-spacing','v222ReferenceCollectorSpacingPlan','v222ReferenceCollectorSpacingProof'],['ref-short-gap','v222ReferenceShortGapPlan','v222ReferenceShortGapProof'],['ref-prose-spacing','v222ReferenceProseSpacingPlan','v222ReferenceProseSpacingProof'],['talk-footer','v222TalkFooterPlan','v222TalkFooterProof'],['native-syntax','v222NativeSyntaxPlan','v222NativeSyntaxProof']];
 return rows.filter(r=>typeof V222_MODULE_FUNCTIONS[r[1]]==='function'&&typeof V222_MODULE_FUNCTIONS[r[2]]==='function').map(r=>[r[0],V222_MODULE_FUNCTIONS[r[1]],V222_MODULE_FUNCTIONS[r[2]]]);
}
function v222CorePrefix(source,options={}){
 const out={text:source,steps:[],count:0};if(typeof source!=='string')return out;
 const cfg=pageContextOptions({...DEFAULTS,...options});
 for(const[family,make,prove]of v222CoreStages()){
  const before=out.text;let plan;try{plan=make(before,cfg);if(!plan||plan.text===before||!prove(before,plan.text,plan,cfg))continue;}catch{continue;}
  const edits=plan.edits||[],count=edits.reduce((n,e)=>n+(e.count??1),0);if(!Number.isSafeInteger(count)||count<1||edits.some(e=>!Number.isSafeInteger(e.count??1)||(e.count??1)<1))continue;
  out.text=plan.text;out.steps.push({family,before,after:plan.text,edits,count});out.count+=count;
 }
 return out;
}
function v222CoreProjection(source,options={}){
 if(typeof source!=='string')return source;
 const key=v2217ProjectionKey(source,options),cache=key!==null?V222_CORE_PROJECTION_CACHE.map.get(key):null;if(cache)return cache.text;
 const result=v222CorePrefix(source,options),text=result.text;
 if(key!==null){const bytes=(key.length+text.length)*2+128;if(bytes<=16777216){V222_CORE_PROJECTION_CACHE.map.set(key,{text,bytes});V222_CORE_PROJECTION_CACHE.bytes+=bytes;while(V222_CORE_PROJECTION_CACHE.map.size>24||V222_CORE_PROJECTION_CACHE.bytes>16777216){const k=V222_CORE_PROJECTION_CACHE.map.keys().next().value,x=V222_CORE_PROJECTION_CACHE.map.get(k);V222_CORE_PROJECTION_CACHE.map.delete(k);V222_CORE_PROJECTION_CACHE.bytes-=x.bytes;}}}
 return text;
}
function v222RetainedAdjustments(before,after,kinds=[],options={}){
 const fallback=()=>v222Previous_v211RetainedAdjustments(before,after,kinds,options);
 if(typeof before!=='string'||typeof after!=='string'||before===after)return fallback();
 const prefix=v222CorePrefix(before,options);if(!prefix.count)return fallback();
 if(v222CorePrefix(after,options).text!==after)return fallback();
 const remainder=prefix.text===after?{count:0,exact:true,events:[],topics:[]}:v222Previous_v211RetainedAdjustments(prefix.text,after,kinds,options);
 if(!remainder.exact||!Number.isSafeInteger(remainder.count))return fallback();
 const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after),events=prefix.steps.flatMap((step,i)=>step.edits.flatMap((edit,j)=>Array.from({length:edit.count??1},(_,k)=>({id:sourceHash+':v222:'+i+':'+j+':'+k,rule:'v222-source-bound-component',kind:edit.kind||step.family,sourceHash,outputHash,sourceAnchors:[{start:0,end:before.length}],outputAnchors:[{start:0,end:after.length}],phaseSourceHash:v24SyntaxHash(step.before),phaseAnchors:[{start:edit.start,end:edit.end}],family:step.family}))));
 const count=prefix.count+remainder.count;return {...remainder,count,exact:true,events:events.concat(remainder.events||[]),sourceHash,outputHash,unit:'retained-source-repair-component',unresolved:[],unresolvedFragments:0,text:count+' ajuste'+(count===1?'':'s')+' aplicado'+(count===1?'':'s')};
}
function v222Catalog(){return V222_CATALOG;}
