// Folded dead-link syntax counts the added field and removed marker separately.
// Count the other final changes from that exact, independently checked prefix.
function v211RetainedAdjustments(before,after,kinds=[],options={}){
 const ordinary=v2216BaselineRetainedAdjustments(before,after,kinds,options);
 if(ordinary?.exact===true||typeof before!=='string'||typeof after!=='string'||before===after)return ordinary;
 if(v2216TalkScope(before,options)){const plan=v2216TalkPlan(before,options);if(plan.text===after&&plan.edits.length&&v2216TalkProof(before,after,plan,options)){const count=plan.edits.reduce((n,e)=>n+(e.count??1),0);return {...ordinary,exact:true,count,sourceHash:v24SyntaxHash(before),outputHash:v24SyntaxHash(after),events:plan.steps.flatMap((step,i)=>step.edits.flatMap((e,j)=>Array.from({length:e.count??1},(_,n)=>({id:'talk:'+i+':'+j+':'+n,kind:e.kind,sourceHash:v24SyntaxHash(before),outputHash:v24SyntaxHash(after),sourceAnchors:[{start:e.start,end:e.end}],outputAnchors:[{start:0,end:after.length}]})))),unresolved:[],unresolvedFragments:0,text:count+' ajuste'+(count===1?'':'s')+' aplicado'+(count===1?'':'s')};}}
 if(!v2215ReferenceCollectorScope(before,options))return ordinary;
 const edits=v2216ReferenceDeadLinkEdits(before);if(!edits.length)return ordinary;
 const prefix=v24SyntaxApply(before,edits);
 if(!v2216ReferenceStepWitness(before,prefix,edits)||preservationAudit(before,after,options).length||safeComposition(before,after,options))return ordinary;
 const rest=prefix===after?{exact:true,count:0,events:[]}:v2216BaselineRetainedAdjustments(prefix,after,kinds,options);
 if(rest?.exact!==true||!Number.isSafeInteger(rest.count))return ordinary;
 const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after),count=rest.count+edits.reduce((n,e)=>n+(e.witness.hadDatali?1:2),0);
 return {...ordinary,exact:true,count,sourceHash,outputHash,unresolved:[],unresolvedFragments:0,
  events:edits.flatMap((e,i)=>Array.from({length:e.witness.hadDatali?1:2},(_,n)=>({id:sourceHash+':dead-link:'+i+':'+n,kind:n?'dead-link-marker-removal':'citation-dead-link-field',rule:'retained-dead-link-conversion',sourceHash,outputHash,sourceAnchors:[{start:e.start,end:e.end}],outputAnchors:[{start:0,end:after.length}],before:before.slice(e.start,e.end),after:e.text}))).concat(rest.events||[]),
  text:count+' ajuste'+(count===1?'':'s')+' aplicado'+(count===1?'':'s')};
}
