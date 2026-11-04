// Local descriptive names follow the field priority of Módulo:NomeRefAuto.
// Source contract: https://pt.wikipedia.org/w/index.php?oldid=73363745 .
// The article stores literal names. No template is evaluated inside an attribute.
function v2216AutonameText(value){
 if(typeof value!=='string')return null;
 let text=value.trim();
 const linked=/^\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]$/.exec(text);
 if(linked)text=linked[2]??linked[1];
 if(/^\(\([\s\S]*\)\)$/.test(text))text=text.slice(2,-2);
 else text=text.replace(/[;,]?\s*["']?\bet\.?\s*al(?:ia|ii|iae)?\.?[;,"']*$/i,'').trim();
 if(!text||/[{}<>\[\]\r\n]/.test(text)||/''/.test(text))return null;
 return text;
}
function v2216AutonameBase(body){
 const raw=typeof body==='string'?body.trim():'',p=raw.startsWith('{{')&&raw.endsWith('}}')?parsedTemplate(raw):null;
 if(!p||topNodes(protectedView(raw)).length!==1)return null;
 const context=v218CitationNativeContext(raw),reader=context&&v2215CitationReader(context),literal=v2215LiteralFields(raw);
 if(!reader||!literal||literal.fields.length!==foreignEntries(p).length)return null;
 const roles=literal.fields.map(f=>({...f,roles:v2215CitationModelRoles(f.key,reader)})),collect=(role,index)=>{
  const matches=roles.filter(f=>f.roles.includes(role+(index?':'+index:''))&&f.value.trim());
  if(matches.length!==1)return matches.length?false:null;
  return v2216AutonameText(matches[0].value)||false;
 };
 let chosen=null;
 for(const role of ['ContributorList-Last','AuthorList-Last','EditorList-Last']){
  const list=[];
  for(let i=1;i<=4;i++){const value=collect(role,i);if(value===false)return null;if(value===null)break;list.push(value);}
  if(list.length){chosen=list;break;}
 }
 if(!chosen)for(const role of ['Periodical','Encyclopedia','Title','BookTitle','URL']){
  const value=collect(role);if(value===false)return null;if(!value)continue;
  if(role==='URL'){
   const match=/^(?:[a-z][\w+.-]*:\/\/|\/\/)?([^/?#]+)(?:[/?#]|$)/i.exec(value);
   if(!match||/[@\s]/.test(match[1]))return null;
   const domain=match[1].replace(/:\d+$/,'').replace(/^(?:www\d*|m|ftp)\./i,'');
   if(!/^[\p{L}\p{N}.-]+\.[\p{L}]{2,}$/u.test(domain))return null;
   chosen=[domain];
  }else chosen=[value];
  break;
 }
 if(!chosen)return null;
 const date=collect('Date'),publication=collect('PublicationDate'),year=collect('Year');
 if([date,publication,year].includes(false))return null;
 const findYear=s=>typeof s==='string'?s.match(/(?:^|[^\d])([1-9]\d{2,3}[a-z]?)(?!\d)/)?.[1]||'':'';
 const yearSet=value=>new Set((value||'').match(/(?<!\d)[1-9]\d{2,3}[a-z]?(?!\d)/g)||[]);
 const dy=findYear(date||publication),yy=findYear(year);
 if(yearSet(date||publication).size>1||yearSet(year).size>1||dy&&yy&&dy.replace(/[a-z]$/,'')!==yy.replace(/[a-z]$/,''))return null;
 const suffix=(/[a-z]$/.test(dy)?dy:/[a-z]$/.test(yy)?yy:dy||yy)+'-';
 let name='';
 for(const value of chosen){
  const clean=value.normalize('NFC').replace(/\s+/g,'_').replace(/[^\p{L}\p{N}_.-]/gu,'');
  if(!clean)continue;
  const available=78-Array.from(suffix).length-Array.from(name).length;
  if(Array.from(clean).length>available){if(name)break;name=Array.from(clean).slice(0,available).join('');break;}
  name+=clean;
 }
 return name&&v29ReferenceName(name+suffix)?name+suffix:null;
}
function v2216AutonamePlan(source,cfg={}){
 const plan={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],families:[]};
 if(typeof source!=='string'||!v2215ReferenceCollectorScope(source,cfg)||cfg.neutralReferenceNames===false||cfg.references===false)return plan;
 const graph=v2216ReferenceGraph(source),observed=v219NativeReferenceObserver(source),all=referenceNameUses(source),literalArguments=v2216ReferenceLiteralReservations(source),reserved=new Set([...literalArguments,...all.map(x=>decodedReferenceName(x.value).normalize('NFC'))]),groups=new Map();
 // Opaque literal arguments reserve possible reference identities. They are
 // neither rewritten nor interpreted as a confirmed helper interface.
 if(graph.unclosed.length||graph.empties.length||/\{\{\{|\{\{\s*#tag\s*:\s*ref\b/i.test(graph.view))return plan;
 for(const ref of graph.refs)if(ref.name){const key=JSON.stringify([ref.group,ref.name]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(ref);}
 for(const [key,refs]of groups){
  const name=refs[0].name,group=refs[0].group;
  if(literalArguments.has(name.normalize('NFC'))||!/^(?::\d+|ref-auto-[1-9]\d*|RevisaWiki-auto-[1-9]\d*)$/.test(name)||refs.some(r=>!r.literal||!r.eligible))continue;
  // Protected prose can still contain active Cite calls. A family cannot be
  // renamed unless every independently observed active call is editable here.
  const active=observed.refs.filter(r=>decodedReferenceName(r.attrs?.name||'')===name&&(r.group||'')===group);
  if(active.length!==refs.length||active.some(r=>!refs.some(g=>g.start===r.start&&g.end===r.end)))continue;
  if(observed.helpers.some(h=>(h.calls||[]).some(c=>decodedReferenceName(c.value||'')===name)))continue;
  const definitions=refs.filter(r=>r.body!==null),bodies=new Set(definitions.map(r=>r.body));
  if(!definitions.length||bodies.size!==1||!definitions[0].body.trim())continue;
  const stem=v2216AutonameBase(definitions[0].body);if(!stem)continue;
  let index=1,next;do{next=stem+index++;}while(reserved.has(next));reserved.add(next);
  const edits=[];
  for(const ref of refs){
   const raw=source.slice(ref.start,ref.openEnd),tag=v24SyntaxTag(raw,0);
   if(!tag||tag.name!=='ref'){edits.length=0;break;}
   const replaced=raw.replace(/(\bname\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,(whole,p,a,b,c)=>decodedReferenceName(a??b??c)===name?p+'"'+next+'"':whole);
   if(raw===replaced){edits.length=0;break;}
   edits.push({start:ref.start,end:ref.openEnd,text:replaced,kind:'descriptive-reference-name',witness:{group,before:name,after:next,body:definitions[0].body}});
  }
  if(!edits.length)continue;
  plan.families.push({key,group,before:name,after:next,body:definitions[0].body,occurrences:refs.length});plan.edits.push(...edits);
 }
 plan.edits.sort((a,b)=>a.start-b.start);plan.text=v24SyntaxApply(source,plan.edits);return plan;
}
function v2216AutonameProof(before,after,plan,cfg={}){
 if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||v24SyntaxApply(before,plan.edits)!==after)return false;
 const a=v2216ReferenceGraph(before),b=v2216ReferenceGraph(after);
 if(a.refs.length!==b.refs.length||a.unclosed.length!==b.unclosed.length||a.empties.length!==b.empties.length)return false;
 const mapping=new Map(plan.families.map(f=>[JSON.stringify([f.group,f.before]),f]));
 for(let i=0;i<a.refs.length;i++){
  const old=a.refs[i],next=b.refs[i],family=mapping.get(JSON.stringify([old.group,old.name]));
  if(old.body!==next.body||old.group!==next.group||next.name!==(family?family.after:old.name))return false;
 }
 const allBefore=v219NativeReferenceObserver(before).refs,allAfter=v219NativeReferenceObserver(after).refs;
 if(allBefore.length!==allAfter.length)return false;
 for(let i=0;i<allBefore.length;i++){
  const old=allBefore[i],next=allAfter[i],name=decodedReferenceName(old.attrs?.name||''),family=mapping.get(JSON.stringify([old.group||'',name]));
  if(old.body!==next.body||(old.group||'')!==(next.group||'')||decodedReferenceName(next.attrs?.name||'')!==(family?family.after:name))return false;
 }
 const fresh=v2216AutonamePlan(before,cfg);
 return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits)&&JSON.stringify(fresh.families)===JSON.stringify(plan.families);
}
