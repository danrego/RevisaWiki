// The pinned native marker (72931857) does not read bot. Only bounded literal
// metadata may be discarded with the already-proved dated marker conversion.
function v2222ReferenceLiteralBotMetadata(value){
 return typeof value==='string'&&value.trim().length<=80&&!/[\x00-\x1f\x7f-\x9f\u00ad\u061c\u180e\u200b-\u200f\u2028-\u202e\u2060-\u206f\ud800-\udfff\ufeff{}[\]<>|&'"`\\~]/.test(value.replace(/[\ud800-\udbff][\udc00-\udfff]/g,''));
}
// A dated dead-link marker is existing source evidence. Its conversion cannot
// create a new metadata obligation unless the actual output retained that date.
function v2222ReferenceDeadLinkRetentionContext(before,after,cfg={}){
 const empty={source:before,alternatives:new Set(),proofs:[]};if(before===after||!v2221ReferenceScope(before,cfg)||cfg.citations===false)return empty;
 const plan=v2222ReferenceDeadLinkPlan(before,cfg);if(!plan.edits.length||!v2222ReferenceDeadLinkProof(before,plan.text,plan,cfg))return empty;
 const prior=v219NativeReferenceObserver(before).refs,actual=v219NativeReferenceObserver(after).refs,ownersBefore=v2222CitationStateOwners(before,cfg),ownersAfter=v2222CitationStateOwners(after,cfg),edits=[],alternatives=new Set(),proofs=[];
 if(prior.length!==actual.length)return empty;
 for(const e of plan.edits){if(e.kind!=='reference-dead-marker-native-date')continue;const call=ownersBefore.find(x=>x.node.start===e.start&&x.node.end<=e.end),ownerIndex=prior.findIndex(r=>r.valid&&r.body!==null&&r.close&&r.start<e.start&&e.end<=r.close.start);if(!call||ownerIndex<0)continue;const old=prior[ownerIndex],now=actual[ownerIndex];if(!now?.valid||now.body===null||!now.close||old.group!==now.group||old.attrs?.name&&old.attrs.name!==now.attrs?.name)continue;
  const original=v281CitationObligation(call.raw,cfg),wanted=v281CitationObligation(e.text,cfg),binding=v2221CitationTypedAnchorBinding(e.text),native=v2222CitationContext(e.text),reader=native&&v2215CitationReader(native);if(original===null||wanted===null||binding===null||!reader)continue;
  const sourcePrefix=before.slice(old.start+old.raw.length,call.node.start),sourceSuffix=before.slice(e.end,old.close.start),matches=ownersAfter.filter(x=>now.start<x.node.start&&x.node.end<=now.close.start&&after.slice(now.start+now.raw.length,x.node.start)===sourcePrefix&&after.slice(x.node.end,now.close.start)===sourceSuffix);if(matches.length!==1)continue;const target=matches[0],p=v222Fields(target.raw),context=v2222CitationContext(target.raw),consumer=context&&v2215CitationReader(context),states=p?.fields.filter(f=>v222CitationStateIntent(f.key)||v222CitationRoles(f.key,consumer||reader).some(r=>r==='DeadURL'||r==='UrlStatus'))||[];
  if(!consumer||consumer.module!==reader.module||consumer.oldid!==reader.oldid||states.length!==1||states[0].key!=='datali'||states[0].value.trim()!==e.proof.date||v281CitationObligation(target.raw,cfg)!==wanted||v2221CitationTypedAnchorBinding(target.raw)!==binding)continue;
  if(!v2222CitationActualFieldsEquivalent(e.text,target.raw,cfg))continue;edits.push({start:e.start,end:e.end,text:target.raw});alternatives.add(original);proofs.push({start:e.start,end:e.end,native:{kind:e.kind,reader:reader.module,oldid:reader.oldid,date:e.proof.date,markerHash:e.proof.markerHash,sourceReferenceOrdinal:ownerIndex,sourcePrefixHash:v24SyntaxHash(sourcePrefix),sourceSuffixHash:v24SyntaxHash(sourceSuffix)}});
 }
 if(edits.some((e,i)=>edits.some((f,j)=>i!==j&&e.start<f.end&&f.start<e.end)))return empty;return{source:v24SyntaxApply(before,edits),alternatives,proofs};
}
function v2222CitationRetentionContext(before,after,cfg={}){
 const state=v2222CitationStateRetentionContext(before,after,cfg),dead=v2222ReferenceDeadLinkRetentionContext(state.source,after,cfg);return{source:dead.source,alternatives:new Set([...state.alternatives,...dead.alternatives]),proofs:[...state.proofs,...dead.proofs]};
}
function v2222ReferenceDeadLinkLegacyEdits(source,edits){
 if(!edits.length)return edits;const cfg={...DEFAULTS,namespaceNumber:0,contentModel:'wikitext'},fresh=v2222ReferenceDeadLinkPlan(source,cfg);return edits.filter(e=>fresh.edits.some(f=>f.start===e.start&&f.end===e.end&&f.text===e.text));
}
