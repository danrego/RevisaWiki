// Final-source metadata contains no editor objects or executable callbacks.
const V2222_OPERATION_CACHE={rows:[],maximumEntries:8,maximumBytes:16777216};
function v2222TalkSummaryState(source,cfg={}){
 const empty={calls:[],signatures:{PD:[], 'Marca de projeto':[],Traduzido:[]},order:[]};
 if(typeof source!=='string')return empty;
 const c=v2221LayoutContext(source);
 for(const n of c.nodes){
  if(!v2222TalkLoose(source,n))continue;
  const raw=source.slice(n.start,n.end),family=v2222TalkFamily(raw,cfg);if(!family)continue;
  empty.calls.push({family,raw,start:n.start,end:n.end});empty.signatures[family].push(raw);empty.order.push(family);
 }
 return empty;
}
function v2222DiscussionSummary(before,after,cfg={}){
 if(typeof before!=='string'||typeof after!=='string')return '';
 const a=v2222TalkSummaryState(before,cfg),b=v2222TalkSummaryState(after,cfg),families=['PD','Marca de projeto','Traduzido'],changed=new Set();
 for(const family of families)if(JSON.stringify(a.signatures[family])!==JSON.stringify(b.signatures[family]))changed.add(family);
 for(let i=0;i<families.length;i++)for(let j=i+1;j<families.length;j++){
  const x=families[i],y=families[j];
  if(a.signatures[x].length!==1||a.signatures[y].length!==1||b.signatures[x].length!==1||b.signatures[y].length!==1)continue;
  if((a.order.indexOf(x)<a.order.indexOf(y))!==(b.order.indexOf(x)<b.order.indexOf(y))){changed.add(x);changed.add(y);}
 }
 const outsideHeader=(text,state,call)=>{
  let prefix=text.slice(0,call.start);
  for(const other of state.calls.filter(x=>x.end<=call.start).reverse())prefix=prefix.slice(0,other.start)+prefix.slice(other.end);
  return /^\s*={1,6}[^\r\n]*=/m.test(scanProtectedView(prefix));
 };
 for(const family of families){const x=a.calls.filter(c=>c.family===family),y=b.calls.filter(c=>c.family===family);if(x.length===1&&y.length===1&&outsideHeader(before,a,x[0])!==outsideHeader(after,b,y[0]))changed.add(family);}
 return families.filter(f=>changed.has(f)).map(f=>'{{'+f+'}}').join('');
}
function v2222JournalLeaves(plan,before,after,out=[],depth=0){
 if(depth>32||!plan||typeof before!=='string'||typeof after!=='string')return null;
 if(before===after)return out;
 const steps=plan.steps;
 if(Array.isArray(steps)&&steps.length&&steps.every(s=>typeof s.before==='string'&&typeof s.after==='string')){
  let text=before;
  for(const step of steps){if(step.before!==text||!v2222JournalLeaves(step.plan||step,step.before,step.after,out,depth+1))return null;text=step.after;}
  return text===after?out:null;
 }
 const edits=plan.edits;if(!Array.isArray(edits)||!edits.length)return null;
 if(edits.some(e=>!Number.isSafeInteger(e.start)||!Number.isSafeInteger(e.end)||e.start<0||e.end<e.start||e.end>before.length||typeof e.text!=='string'||!Number.isSafeInteger(e.count??1)||(e.count??1)<0))return null;
 try{if(v24SyntaxApply(before,edits)!==after)return null;}catch{return null;}
 out.push({before,after,edits:edits.map(e=>({start:e.start,end:e.end,text:e.text,count:e.count??1,countExplicit:Number.isSafeInteger(e.count),kind:e.kind||e.ruleId||'source-repair'}))});return out;
}
function v2222RememberOperations(source,plan){
 if(typeof source!=='string'||typeof plan?.text!=='string'||source===plan.text)return;
 const leaves=v2222JournalLeaves(plan,source,plan.text);if(!leaves)return;
 const bytes=(source.length+plan.text.length)*2+leaves.reduce((n,s)=>n+(s.before.length+s.after.length)*2+s.edits.reduce((z,e)=>z+e.text.length*2+128,0),0);
 if(bytes>V2222_OPERATION_CACHE.maximumBytes)return;
 const entry={source,after:plan.text,leaves,bytes};V2222_OPERATION_CACHE.rows.push(entry);
 while(V2222_OPERATION_CACHE.rows.length>V2222_OPERATION_CACHE.maximumEntries||V2222_OPERATION_CACHE.rows.reduce((n,x)=>n+x.bytes,0)>V2222_OPERATION_CACHE.maximumBytes)V2222_OPERATION_CACHE.rows.shift();
}
function v2222JournalCount(before,after){
 const row=V2222_OPERATION_CACHE.rows.findLast(x=>x.source===before&&x.after===after);if(!row)return null;
 const segments=[{start:0,end:before.length,origin:0,changed:false}],events=[];let size=before.length;
 for(const step of row.leaves){
  const sorted=step.edits.slice().sort((a,b)=>a.start-b.start||a.end-b.end);let lastEnd=-1;
  for(const e of sorted){if(e.start<lastEnd)return null;lastEnd=e.end;}
  for(const e of sorted.slice().reverse()){
   const touches=segments.filter(s=>e.start===e.end?e.start>s.start&&e.start<s.end:e.start<s.end&&s.start<e.end);
   if(touches.some(s=>s.changed))return null;
   let origin;
   if(touches.length){origin=touches[0].origin+e.start-touches[0].start;if(touches.some((s,i)=>i&&s.origin!==touches[i-1].origin+touches[i-1].end-touches[i-1].start))return null;}
   else {const next=segments.find(s=>s.start>=e.start),previous=segments.findLast(s=>s.end<=e.start);if(next?.changed||previous?.changed)return null;origin=next?next.origin:previous?previous.origin+previous.end-previous.start:0;}
   const delta=e.text.length-(e.end-e.start),updated=[];
   for(const s of segments){
    if(s.end<=e.start)updated.push(s);
    else if(s.start>=e.end)updated.push({...s,start:s.start+delta,end:s.end+delta});
    else {if(s.start<e.start)updated.push({...s,end:e.start});if(s.end>e.end)updated.push({...s,start:e.start+e.text.length,end:s.end+delta,origin:s.origin+e.end-s.start});}
   }
   if(e.text.length)updated.push({start:e.start,end:e.start+e.text.length,origin,changed:true});
   updated.sort((a,b)=>a.start-b.start);segments.splice(0,segments.length,...updated);size+=delta;
   if(e.count)events.push({kind:e.kind,count:e.count,sourceStart:origin,sourceEnd:origin+(e.end-e.start)});
  }
 }
 if(size!==after.length)return null;
 const count=events.reduce((n,e)=>n+e.count,0);return Number.isSafeInteger(count)?{count,exact:true,events,unit:'verified-independent-execution-operation'}:null;
}
function v2222CountTalkState(source,cfg){
 const c=v2221LayoutContext(source),calls=[];
 for(const n of c.nodes){if(!v2222TalkLoose(source,n))continue;const raw=source.slice(n.start,n.end);let family=v2222TalkFamily(raw,cfg);if(!family){const kind=v2221LayoutTalkKind(raw);if(kind==='oka')family='OKA';else if(kind==='advance')family='AvançarDiscussão';else if(kind==='other')family='fusion:'+v2216LayoutIdentity(raw);}
  if(family)calls.push({family,raw,start:n.start,end:n.end,identity:null,id:calls.length});
 }
 return{calls};
}
function v2222CountTalkProjection(source,calls){
 let text='',cursor=0;const cuts=[];
 for(const call of calls){text+=source.slice(cursor,call.start);cuts.push(text.length);call.bodyOffset=text.replace(/[ \t\r\n]/g,'').length;cursor=call.end;}text+=source.slice(cursor);
 const words=[],gaps=[];let at=0;for(const m of text.matchAll(/[^ \t\r\n]+/g)){gaps.push({text:text.slice(at,m.index),touched:cuts.some(c=>at<=c&&c<=m.index)});words.push(m[0]);at=m.index+m[0].length;}gaps.push({text:text.slice(at),touched:cuts.some(c=>at<=c&&c<=text.length)});return{text,words,gaps};
}
function v2222CountTalkLcs(a,b){const row=new Array(b.length+1).fill(0);for(const x of a){let previous=0;for(let j=1;j<=b.length;j++){const saved=row[j];row[j]=x===b[j-1]?previous+1:Math.max(row[j],row[j-1]);previous=saved;}}return row[b.length];}
function v2222CountTalkTranslationIdentity(raw){
 const p=v2222TalkParts(raw);if(!p)return null;const slots=new Map();for(const f of p.fields){const value=v2222CommentView(f.value).trim();if(slots.has(f.key))return null;slots.set(f.key,value);}const take=keys=>{const xs=keys.filter(k=>slots.has(k)).map(k=>slots.get(k)).filter(Boolean);return new Set(xs).size>1?null:xs[0]||'';};
 let language=take(['cód_idioma']),page=take(['página','texto','Texto']);if(language===null||page===null)return null;const first=slots.get('1')||'',second=slots.get('2')||'';if(first&&second&&/^[a-z][a-z0-9-]{1,19}$/.test(first)){if(language&&language!==first||page&&page!==second)return null;language=language||first;page=page||second;}else if(first&&!second&&!page)page=first;
 const prefixed=/^([a-z][a-z0-9-]{1,19}):(.+)$/.exec(page);if(prefixed){if(language&&language!==prefixed[1])return null;language=language||prefixed[1];page=prefixed[2];}if(!language||!page)return null;
 const revision=take(['oldid','oldid original','oldid_original']);if(revision===null)return null;const native=revision?v2222TalkRevision(revision,language,page):'';if(revision&&!native)return null;let status=take(['fontes','Fontes','3']);if(status===null)return null;if(!status&&/^(?:V|NV|SEM|NT)$/.test(first))status=first;return JSON.stringify([language,page,native,slots.get('data')||'',status]);
}
function v2222CountTalkFields(before,after,emit){
 const p=v2222TalkParts(before.raw),q=v2222TalkParts(after.raw);if(!p||!q||p.fields.length>256||q.fields.length>256)return false;
 if(p.header!==q.header)emit(p.header.trim()===q.header.trim()?'template-layout':'template-name',before);
 const remaining=q.fields.map((f,index)=>({...f,index,used:false})),order=[];
 for(const old of p.fields){const target=remaining.find(f=>!f.used&&f.key===old.key);if(!target){emit('parameter-removal',before);continue;}target.used=true;order.push(target.index);if(old.part!==target.part)emit(old.value!==target.value?'parameter-value':'parameter-layout',before);}
 for(const f of remaining)if(!f.used)emit('parameter-insertion',after);
 const sorted=order.slice().sort((a,b)=>a-b),moves=order.length-v2222CountTalkLcs(order,sorted);for(let i=0;i<moves;i++)emit('parameter-order',before);return true;
}
function v2222CountTalkMergeProjects(xs,y,emit){
 const records=[];for(const call of xs.concat(y)){if(/<!--|\{\{\{|[<>]/.test(call.raw))return false;const p=v2222TalkParts(call.raw);if(!p)return false;const slots=new Map();for(const f of p.fields){if(slots.has(f.key))return false;slots.set(f.key,f.value.trim());}const bot=slots.has('bot'),q1=slots.get('1'),qn=slots.get('qualidade');if(q1!==undefined&&qn!==undefined&&q1!==qn)return false;let quality=q1??qn??'?';if(bot||['','qualidade','x','"x"','X','"X"'].includes(quality))quality='?';const projects=[],numbers=[...slots.keys()].filter(k=>/^\d+$/.test(k)).map(Number);if(numbers.some(n=>n<1)||Math.max(1,...numbers)>256)return false;for(let i=2;i<=Math.max(1,...numbers);i+=2){const name=slots.get(String(i)),rating=slots.get(String(i+1))||'?';if(!name||/[{}\[\]\r\n]/.test(name)||!/^[?1-4]$/.test(rating))return false;projects.push({name,rating});}records.push({call,p,quality,projects,named:new Map([...slots].filter(([k])=>!/^\d+$/.test(k)&&!['qualidade','bot','rev'].includes(k))),reviews:p.fields.filter(f=>f.key==='bot'||f.key==='rev')});}
 const target=records.pop(),projects=new Map(),named=new Map();let quality='?';for(const r of records){if(r.quality!=='?'){if(quality!=='?'&&quality!==r.quality)return false;quality=r.quality;}for(const p of r.projects){const prior=projects.get(p.name);if(prior&&prior!=='?'&&p.rating!=='?'&&prior!==p.rating)return false;if(!prior||prior==='?')projects.set(p.name,p.rating);}for(const[k,v]of r.named){if(named.has(k)&&named.get(k)!==v)return false;named.set(k,v);}}
 if(target.quality!==quality||JSON.stringify(target.projects.map(p=>[p.name,p.rating]))!==JSON.stringify([...projects])||JSON.stringify([...target.named].sort())!==JSON.stringify([...named].sort()))return false;
 // Reviews are owner metadata, independent of the project pairs transferred
 // during a merge. No intermediate planner event is used as count credit.
 const targetFields=target.p.fields.filter(f=>['bot','rev'].includes(f.key)).map(f=>({key:f.key,value:f.value,used:false}));for(const r of records)for(const f of r.reviews){const kept=targetFields.find(t=>!t.used&&t.key===f.key&&t.value===f.value);if(kept)kept.used=true;else emit('parameter-removal',r.call);}if(targetFields.some(f=>!f.used))return false;
 const oldQuality=records[0].p.fields.filter(f=>['1','qualidade'].includes(f.key)),newQuality=target.p.fields.filter(f=>['1','qualidade'].includes(f.key));if(oldQuality.length>1||newQuality.length>1)return false;if(!oldQuality.length&&newQuality.length)emit('parameter-insertion',y);else if(oldQuality.length&&!newQuality.length)emit('parameter-removal',xs[0]);else if(oldQuality.length){if(oldQuality[0].key!==newQuality[0].key)emit('parameter-name',xs[0]);if(oldQuality[0].part!==newQuality[0].part&&oldQuality[0].key===newQuality[0].key)emit(oldQuality[0].value!==newQuality[0].value?'parameter-value':'parameter-layout',xs[0]);else if(oldQuality[0].value!==newQuality[0].value)emit('parameter-value',xs[0]);}
 for(let i=1;i<xs.length;i++)emit('template-removal',xs[i]);if(records[0].p.header!==target.p.header)emit(records[0].p.header.trim()===target.p.header.trim()?'template-layout':'template-name',xs[0]);return true;
}
function v2222TalkEndpointCount(before,after,cfg={}){
 if(typeof before!=='string'||typeof after!=='string'||v2222NonWikitext(cfg)||!cfg.discussionPage&&!(Number.isInteger(cfg.namespaceNumber)&&cfg.namespaceNumber>0&&cfg.namespaceNumber%2===1))return null;
 const a=v2222CountTalkState(before,cfg),b=v2222CountTalkState(after,cfg);if(a.calls.length>128||b.calls.length>128)return null;
 const comments=s=>[...s.matchAll(/<!--[\s\S]*?-->/g)].map(m=>m[0]).join('');if(comments(before)!==comments(after))return null;
 const left=v2222CountTalkProjection(before,a.calls),right=v2222CountTalkProjection(after,b.calls);if(JSON.stringify(left.words)!==JSON.stringify(right.words)||left.gaps.length!==right.gaps.length||left.gaps.some((g,i)=>g.text!==right.gaps[i].text&&!g.touched&&!right.gaps[i].touched))return null;
 const events=[],emit=(kind,owner)=>events.push({id:'talk:'+events.length,kind,count:1,...(owner?{anchor:{side:a.calls.includes(owner)?'before':'after',start:owner.start,end:owner.end}}:{} )}),pairs=[];let changedCardinality=false;
 for(const family of new Set(a.calls.concat(b.calls).map(c=>c.family))){let xs=a.calls.filter(x=>x.family===family),ys=b.calls.filter(x=>x.family===family);const matchedX=new Set(),matchedY=new Set();
  if(family==='PD'&&xs.length>1&&ys.length===1){const merged=new Map();for(const x of xs){const p=v2222TalkParts(x.raw);if(!p||new Set(p.fields.map(f=>f.key)).size!==p.fields.length)return null;for(const f of p.fields){if(merged.has(f.key)&&merged.get(f.key)!==f.value)return null;merged.set(f.key,f.value);}}const target=v2222TalkParts(ys[0].raw);if(!target||target.fields.length!==merged.size||target.fields.some(f=>!merged.has(f.key)||merged.get(f.key)!==f.value))return null;}
  for(const x of xs){const y=ys.find(y=>!matchedY.has(y)&&x.raw===y.raw);if(y){matchedX.add(x);matchedY.add(y);pairs.push([x,y]);}}
  let old=xs.filter(x=>!matchedX.has(x)),next=ys.filter(y=>!matchedY.has(y));
  if(family==='Marca de projeto'&&xs.length>1&&ys.length===1){if(!v2222CountTalkMergeProjects(xs,ys[0],emit))return null;pairs.splice(0,pairs.length,...pairs.filter(([x])=>x.family!==family));pairs.push([xs[0],ys[0]]);changedCardinality=true;continue;}
  if(family==='Traduzido'&&(xs.length>1||ys.length>1)){if(old.length!==next.length)return null;for(const x of old){const identity=v2222CountTalkTranslationIdentity(x.raw);if(!identity)return null;const candidates=next.filter(y=>!matchedY.has(y)&&v2222CountTalkTranslationIdentity(y.raw)===identity);if(candidates.length!==1)return null;const y=candidates[0];matchedY.add(y);if(!v2222CountTalkFields(x,y,emit))return null;pairs.push([x,y]);}continue;}
  if(family==='Traduzido'&&old.length===1&&next.length===1){const x=v2222CountTalkTranslationIdentity(old[0].raw),y=v2222CountTalkTranslationIdentity(next[0].raw);if(x&&y&&x!==y)return null;}
  while(old.length&&next.length){const x=old.shift(),y=next.shift();if(!v2222CountTalkFields(x,y,emit))return null;pairs.push([x,y]);}
  if(family==='Traduzido'&&(old.length||next.length))return null;
  for(const x of old){if(family==='PD'&&ys.length){const source=v2222TalkParts(x.raw),target=v2222TalkParts(ys[0].raw);if(!source||!target||source.fields.some(f=>!target.fields.some(t=>t.key===f.key&&t.value===f.value)))return null;}emit('template-removal',x);changedCardinality=true;}
  for(const y of next){emit('template-insertion',y);changedCardinality=true;}
 }
 const stable=pairs.filter(([x,y])=>x.bodyOffset===y.bodyOffset),oldOrder=stable.slice().sort((a,b)=>a[0].start-b[0].start).map(p=>p[0].id),newOrder=stable.slice().sort((a,b)=>a[1].start-b[1].start).map(p=>p[0].id);let movements=oldOrder.length-v2222CountTalkLcs(oldOrder,newOrder);for(const[x,y]of pairs)if(x.bodyOffset!==y.bodyOffset){emit('discussion-header-movement',x);movements++;}for(let i=0;i<oldOrder.length-v2222CountTalkLcs(oldOrder,newOrder);i++)emit('discussion-header-order');
 if(!changedCardinality&&!movements&&left.text!==right.text&&left.text.trim())emit('discussion-header-spacing');return{exact:true,count:events.length,events,sourceHash:v24SyntaxHash(before),outputHash:v24SyntaxHash(after),unit:'retained-discussion-field'};
}
function v2222AtomicJournalCount(before,after){
 const row=V2222_OPERATION_CACHE.rows.findLast(x=>x.source===before&&x.after===after);if(!row)return null;
 const token=/^[\p{L}\p{N}_-]+$/u,space=/^\s*$/u;
 for(const step of row.leaves)for(const e of step.edits){const old=step.before.slice(e.start,e.end);if(old===e.text||!e.countExplicit||e.count!==1||!((token.test(old)&&token.test(e.text))||(space.test(old)&&space.test(e.text))))return null;}
 return v2222JournalCount(before,after);
}
function v2222RetainedMetadata(job,result){
 if(!['adjust','final-count'].includes(job.kind)||typeof result?.text!=='string')return result;
 const before=job.originalSource??job.source,after=result.text;if(typeof before!=='string')return result;
 let retained=null,pending=false;
 try{
  // A confirmed draft never waits for semantic endpoint counting. Only an
  // already verified atomic journal may supply an immediate count; all other
  // changed results use the independent read-only final-count job.
  if(job.kind==='adjust'&&before!==after){
   retained=v2222AtomicJournalCount(before,after);pending=retained?.exact!==true;
  }else{
   const cfg=job.options||{};
   // Count complete owners before the legacy lexical fallback, so separators
   // belonging to a moved standalone line cannot be credited again as fixes.
   retained=before===after?{exact:true,count:0,events:[],unit:'retained-final-source-unit'}:v2222TalkEndpointCount(before,after,cfg)||v2222FinalSourceCount(before,after,cfg)||v2222CitationEndpointCount(before,after,cfg);
   if(retained?.exact!==true)retained=v2222EndpointCount(before,after,['syntax'],{...cfg,v218RetainedCountSkip:true,v217RetainedCountSkip:true,v216RetainedCountSkip:true,v2151RetainedCountSkip:true});
   if(retained?.exact!==true){const precise=v2222AtomicJournalCount(before,after);if(precise)retained=precise;}
   pending=job.kind==='adjust'&&retained?.exact!==true;
  }
 }catch{pending=job.kind==='adjust';}
 const exact=retained?.exact===true&&Number.isSafeInteger(retained.count)&&(before===after?retained.count===0:retained.count>0);if(!exact&&job.kind==='adjust')pending=true;
 result.retainedAdjustments={schema:1,sourceHash:v24SyntaxHash(before),outputHash:v24SyntaxHash(after),count:exact?retained.count:null,exact,pending:!exact&&pending,unit:retained?.unit||'retained-syntax-component',eventCount:exact?(retained.events||[]).length:0,events:exact?(retained.events||[]).slice(0,128).map((e,i)=>({id:String(e.id||i),kind:String(e.kind||'syntax'),count:e.count??1})):[]};
 return result;
}
function v2222FinalCountJob(job){return v2222RetainedMetadata(job,{kind:'final-count',text:job.source});}
