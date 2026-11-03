// Finish only source-bound move, collection-heading and empty-line witnesses.
// Other unresolved changes keep the existing conservative count result.
function v2215CompleteRetainedCount(before,after,ordinary,kinds=[],options={}){
 if(typeof before!=='string'||typeof after!=='string'||before===after||!ordinary||
    before.length>4194304||after.length>4194304||options.sectionOnly||
    options.contentModel&&options.contentModel!=='wikitext'||options.namespaceNumber!==undefined&&options.namespaceNumber!==0&&!v2215ArticleDraftContext(options,before)||
    ordinary.sourceHash!==v24SyntaxHash(before)||ordinary.outputHash!==v24SyntaxHash(after)||
    !Array.isArray(ordinary.events)||!Array.isArray(ordinary.unresolved)||
    ordinary.exact===true&&ordinary.count!==ordinary.events.length)return ordinary;
 if(ordinary.exact===true&&!ordinary.unresolved.length&&
    !(ordinary.events.some(e=>e.kind==='template-removal')&&ordinary.events.some(e=>e.kind==='portal-slot')))return ordinary;
 const sourceHash=ordinary.sourceHash,outputHash=ordinary.outputHash,diff=v27RawDiff(before,after),
  events=ordinary.events,unresolved=ordinary.unresolved,drop=new Set(),claimed=new Set(),additions=[];
 const range=(r,text)=>r&&Number.isSafeInteger(r.start)&&Number.isSafeInteger(r.end)&&
  r.start>=0&&r.start<=r.end&&r.end<=text.length;
 const fragment=f=>f&&f.precise===true&&range(f,before)&&
  Number.isSafeInteger(f.newStart)&&Number.isSafeInteger(f.newEnd)&&f.newStart>=0&&
  f.newStart<=f.newEnd&&f.newEnd<=after.length&&
  f.before===before.slice(f.start,f.end)&&f.after===after.slice(f.newStart,f.newEnd);
 const same=(a,b)=>a.start===b.start&&a.end===b.end&&a.newStart===b.newStart&&a.newEnd===b.newEnd&&a.before===b.before&&a.after===b.after;
 if(!diff.length||diff.some(f=>!fragment(f))||unresolved.some(f=>!fragment(f)||!diff.some(e=>same(e,f))))return ordinary;
 for(const e of events)if(e.sourceHash!==sourceHash||e.outputHash!==outputHash||
    !Array.isArray(e.sourceAnchors)||!Array.isArray(e.outputAnchors)||
    !e.sourceAnchors.every(r=>range(r,before))||!e.outputAnchors.every(r=>range(r,after))||
    !Array.isArray(e.fragments)||!e.fragments.length||!e.fragments.every(fragment))return ordinary;
 const touches=(a,b,c,d)=>a<b&&c<d&&a<d&&c<b;
 const overlaps=(e,a,b,c,d)=>e.sourceAnchors.some(r=>touches(r.start,r.end,a,b))||
  e.outputAnchors.some(r=>touches(r.start,r.end,c,d));
 const inside=(a,b,c,d)=>a>=c&&b<=d;
 const owned=(text,a,b,c,d)=>a===b||a<d&&c<b&&
  !text.slice(a,Math.min(b,c)).trim()&&!text.slice(Math.max(a,d),b).trim();
 const fragmentOwned=(f,a,b,c,d)=>owned(before,f.start,f.end,a,b)&&owned(after,f.newStart,f.newEnd,c,d)&&
  (touches(f.start,f.end,a,b)||touches(f.newStart,f.newEnd,c,d));
 const emit=(kind,a,b,c,d,fragments,label)=>({id:sourceHash+':v2215-complete:'+kind+':'+a+':'+b,
  rule:'v2215-retained-'+kind,kind,label,sourceHash,outputHash,
  sourceAnchors:[{start:a,end:b}],outputAnchors:[{start:c,end:d}],
  before:before.slice(a,b),after:after.slice(c,d),fragments});
 // A byte-identical unique call can move while unrelated corrections occur.
 // Removing it and counting its unchanged slots as new portals is one move.
 if(options.endTemplateOrder!==false){
  const calls=text=>{
   const view=protectedView(text),hard=[...v219MarkdownLiteralRanges(text),...v219WholeQuotedCodeRanges(text),...v219QuotedTemplateRanges(text,false)];
   return topNodes(view).filter(n=>{
    const raw=text.slice(n.start,n.end),p=parsedTemplate(raw);
    if(!v215SameTemplateTitle(p.parts[0],'Portal3')||!v219OriginalTemplateHeaderAllowed(p.parts[0]))return false;
    const ctx=v24SyntaxContext(view,n.start);
    return !['templates','html','tables','links','external'].some(k=>ctx[k]?.length)&&
     !hard.some(r=>r.start<n.end&&n.start<r.end);
   }).map(n=>({...n,raw:text.slice(n.start,n.end)}));
  },old=calls(before),fresh=calls(after);
  for(const a of old){
   const left=old.filter(n=>n.raw===a.raw),right=fresh.filter(n=>n.raw===a.raw);
   if(left.length!==1||right.length!==1)continue;
   const b=right[0],matching=diff.filter(f=>fragmentOwned(f,a.start,a.end,b.start,b.end)),
    removed=matching.some(f=>f.start<=a.start&&f.end>=a.end&&!f.after.trim()),
    inserted=matching.some(f=>f.newStart<=b.start&&f.newEnd>=b.end&&!f.before.trim());
   if(!removed||!inserted)continue;
   const indexes=events.map((e,i)=>overlaps(e,a.start,a.end,b.start,b.end)?i:-1).filter(i=>i>=0);
   if(!indexes.length||indexes.some(i=>drop.has(i)||!['template-removal','template-insertion','portal-slot','structural-relocation','template-move'].includes(events[i].kind)||
      events[i].fragments.some(f=>!fragmentOwned(f,a.start,a.end,b.start,b.end))||
      !events[i].sourceAnchors.every(r=>owned(before,r.start,r.end,a.start,a.end))||
      !events[i].outputAnchors.every(r=>owned(after,r.start,r.end,b.start,b.end))))continue;
   indexes.forEach(i=>drop.add(i));
   unresolved.forEach((f,i)=>{if(fragmentOwned(f,a.start,a.end,b.start,b.end))claimed.add(i);});
   additions.push(emit('template-move',a.start,a.end,b.start,b.end,matching,'Predefinição reposicionada'));
  }
 }
 // A removed original heading belongs to a directly following native collector.
 if(options.headings!==false&&options.automaticReferenceCollectorHeadings!==false&&options.references!==false&&
    unresolved.some(f=>!f.after&&/^==[ \t]*(?:Notas|Notes|Referências|Referencias|References)[ \t]*==[ \t]*(?:\r?\n)?$/i.test(f.before))){
  const rows=v2215ReferenceCollectorRows(before).rows,seen=new Set();
  for(let i=0;i<unresolved.length;i++){
   if(claimed.has(i))continue;const f=unresolved[i];
   if(f.after||!/^==[ \t]*(?:Notas|Notes|Referências|Referencias|References)[ \t]*==[ \t]*(?:\r?\n)?$/i.test(f.before))continue;
   const match=rows.find(r=>r.heading?.level===2&&r.heading.start===f.start&&r.start>=f.end&&
     /^[ \t\r\n]*$/.test(before.slice(f.end,r.start)));
   if(!match||seen.has(f.start)||events.some((e,j)=>!drop.has(j)&&overlaps(e,f.start,f.end,f.newStart,f.newEnd)))continue;
   const end=f.end-(f.before.endsWith('\r\n')?2:f.before.endsWith('\n')?1:0);
   seen.add(f.start);unresolved.forEach((u,j)=>{if(same(u,f))claimed.add(j);});additions.push(emit('reference-heading',f.start,end,f.newStart,f.newEnd,[f],'Título de referências removido'));
  }
 }
 // The plan independently identifies a single outside-protected empty gap.
 // Its complete resulting gap must be visible at the mapped output position.
 if(typeof v2215WhitespacePlan==='function'&&typeof v2215WhitespaceProof==='function'&&
    unresolved.some((f,i)=>!claimed.has(i)&&!/[^ \t\r\n]/.test(f.before+f.after))){
  const plan=v2215WhitespacePlan(before,options);
  if(plan.edits?.length&&v2215WhitespaceProof(before,plan.text,plan,options))for(const e of plan.edits){
   const a=v211CountAnchor(e.start,diff),b=v211CountAnchor(e.end,diff,false,true);
   if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a>b||after.slice(a,b)!==e.text)continue;
   const matches=diff.filter(f=>inside(f.start,f.end,e.start,e.end)&&inside(f.newStart,f.newEnd,a,b));
   if(!matches.length||matches.some(f=>/[^ \t\r\n]/.test(f.before+f.after)))continue;
   const pending=unresolved.map((f,i)=>!claimed.has(i)&&matches.some(m=>same(m,f))?i:-1).filter(i=>i>=0);
   if(!pending.length)continue;
   const indexes=events.map((x,i)=>!drop.has(i)&&overlaps(x,e.start,e.end,a,b)?i:-1).filter(i=>i>=0);
   if(indexes.some(i=>events[i].kind!=='whitespace'||events[i].fragments.some(f=>
      !inside(f.start,f.end,e.start,e.end)||!inside(f.newStart,f.newEnd,a,b))))continue;
   indexes.forEach(i=>drop.add(i));pending.forEach(i=>claimed.add(i));
   additions.push(emit('whitespace',e.start,e.end,a,b,matches,'Espaçamento entre parágrafos'));
  }
 }
 if(!drop.size&&!claimed.size)return ordinary;
 const remaining=unresolved.filter((f,i)=>!claimed.has(i));
 if(remaining.length)return ordinary;
 const kept=events.filter((e,i)=>!drop.has(i)),result=kept.concat(additions),count=result.length;
 return {...ordinary,count,exact:true,events:result,unresolved:[],unresolvedFragments:0,
  coveredFragments:ordinary.totalFragments??ordinary.coveredFragments,
  unit:'retained-syntax-component',text:count+' ajuste'+(count===1?'':'s')+' aplicado'+(count===1?'':'s')};
}
