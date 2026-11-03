// Count changed original collectors, removed original headings and migrated group fields.
// Intermediate replacements of the same collector do not add another correction.
function v211RetainedAdjustments(before,after,kinds=[],options={}){
 const ordinary=v2215CompleteRetainedCount(before,after,v2215BaselineRetainedAdjustments(before,after,kinds,options),kinds,options);
 if(typeof before!=='string'||typeof after!=='string'||before===after||before.length>4194304||after.length>4194304)return ordinary;
 const cfg=pageContextOptions({...DEFAULTS,...options}),plan=v2215ReferenceCollectorPlan(before,cfg);
 if(plan.text===before||!v2215ReferenceCollectorProof(before,plan.text,plan,cfg))return ordinary;
 const original=v2215ReferenceCollectorRows(before).rows,planned=v2215ReferenceCollectorRows(plan.text).rows,
  final=v2215ReferenceCollectorRows(after).rows;
 if(!original.length||original.length>2||original.some(row=>!row.plain)||planned.length!==1||
    final.length!==1||planned[0].raw!==final[0].raw)return ordinary;
 const a=v219NativeReferenceObserver(plan.text),b=v219NativeReferenceObserver(after),identities=o=>({
  refs:o.refs.map(r=>[r.attrs?.name??'',r.group??'']),helpers:o.helpers.map(h=>h.calls?.map(c=>[c.value??'',c.group??''])||[])
 });
 if(JSON.stringify(identities(a))!==JSON.stringify(identities(b)))return ordinary;
 const remainder=plan.text===after?{count:0,exact:true,events:[]}:v2215CompleteRetainedCount(plan.text,after,v2215BaselineRetainedAdjustments(plan.text,after,kinds,options),kinds,options);
 if(!remainder.exact||!Number.isSafeInteger(remainder.count))return ordinary;
 let retainedCollector=false;
 const anchors=[];
 for(const row of original){
  if(!retainedCollector&&row.raw===planned[0].raw){retainedCollector=true;continue;}
  anchors.push({start:row.start,end:row.end,kind:'reference-collector'});
 }
 if(cfg.headings!==false&&cfg.automaticReferenceCollectorHeadings!==false){
  const seen=new Set();for(const row of original){const h=row.heading;if(!h||h.level!==2||seen.has(h.start)||!['notas','notes','referências','referencias','references','notas e referências'].includes(h.name))continue;
   seen.add(h.start);const lineEnd=before.indexOf('\n',h.start);anchors.push({start:h.start,end:lineEnd<0?before.length:lineEnd,kind:'reference-heading'});
  }
 }
 const group=v2215ReferenceSingleGroupPlan(before,cfg);
 for(const e of group.edits)if(e.kind==='single-note-group')anchors.push({start:e.start,end:e.end,kind:'note-group'});
 const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after),count=anchors.length+remainder.count;
 return{...ordinary,count,exact:true,unit:'changed-source-syntax-component',sourceHash,outputHash,
  events:anchors.map((r,i)=>({id:sourceHash+':v2215:'+i,rule:'v2215-retained-reference-component',kind:r.kind,
   sourceHash,outputHash,sourceAnchors:[{start:r.start,end:r.end}],outputAnchors:[{start:0,end:after.length}],
   before:before.slice(r.start,r.end),after:planned[0].raw})).concat(remainder.events||[]),
  text:count+' ajuste'+(count===1?'':'s')+' aplicado'+(count===1?'':'s')};
}
