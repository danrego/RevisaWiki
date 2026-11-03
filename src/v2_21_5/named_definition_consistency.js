// Native Cite compares repeated named definitions by their source bodies.
// Read the original input independently of writer plans or expected projections.
function v2215NamedDefinitionFamilies(source){
 const observed=v219NativeReferenceObserver(source),view=observed.view,blocked=[],stack=[],
  html=new Set(['a','abbr','b','bdi','bdo','big','blockquote','br','caption','center','cite','code','col','colgroup','data','dd','del','dfn','div','dl','dt','em','font','h1','h2','h3','h4','h5','h6','hr','i','ins','kbd','li','mark','ol','p','q','rb','rp','rt','ruby','s','samp','small','span','strike','strong','sub','sup','table','tbody','td','th','thead','time','tr','tt','u','ul','var','wbr','ref','references','noinclude','onlyinclude']);
 // Unknown extension bodies and includeonly are not asserted to be active.
 // Ordinary HTML quotes remain active reference owners, even if not editable.
 for(let at=view.indexOf('<');at>=0&&at<view.length;){
  const tag=v24SyntaxTag(view,at);if(!tag){at=view.indexOf('<',at+1);continue;}
  at=view.indexOf('<',tag.end);
  if(html.has(tag.name))continue;
  if(!tag.close){if(!tag.self)stack.push({name:tag.name,start:tag.start});continue;}
  const index=stack.map(x=>x.name).lastIndexOf(tag.name);
  if(index>=0){const open=stack[index];blocked.push({start:open.start,end:tag.end});stack.splice(index);}
 }
 for(const open of stack)blocked.push({start:open.start,end:source.length});
 const families=new Map();
 for(const ref of observed.refs){
  const attrs=ref.attrs;
  if(ref.body===null||!ref.body.trim()||!ref.valid||!ref.renderer?.valid||ref.container&&!ref.container.valid||
   !attrs||Object.keys(attrs).some(key=>!['name','group'].includes(key))||!v29ReferenceName(attrs.name)||
   ref.group!==''&&!v29ReferenceName(ref.group)||blocked.some(r=>r.start<ref.end&&ref.start<r.end))continue;
  const key=JSON.stringify([ref.group||'',attrs.name]);
  if(!families.has(key))families.set(key,{key,start:ref.start,bodies:new Set()});
  families.get(key).bodies.add(ref.body);
 }
 return families;
}
function v2215NamedDefinitionConsistencyAudit(before,after,options={}){
 if(typeof before!=='string'||typeof after!=='string'||before===after||before.length>4194304||after.length>4194304||
  options.contentModel&&options.contentModel!=='wikitext'||options.model&&options.model!=='wikitext'||
  options.namespaceNumber!==undefined&&options.namespaceNumber!==0&&!v2215ArticleDraftContext(options,before))return [];
 const prior=v2215NamedDefinitionFamilies(before),next=v2215NamedDefinitionFamilies(after),used=new Set(),findings=[],
  exact=(a,b)=>a.size===b.size&&[...a].every(value=>b.has(value));
 for(const [key,family] of next){
  if(family.bodies.size<2)continue;
  const old=prior.get(key);
  if(old&&old.bodies.size>1&&family.bodies.size<=old.bodies.size){used.add(key);continue;}
  // A distinct conflict may retain its exact raw set under an identity rename.
  // Existing identity guards independently require that rename to be approved.
  const renamed=[...prior].filter(([oldKey,row])=>!next.has(oldKey)&&!used.has(oldKey)&&row.bodies.size>1&&exact(row.bodies,family.bodies));
  if(!old&&renamed.length===1){used.add(renamed[0][0]);continue;}
  findings.push({code:'new-conflicting-named-reference',message:'Definições de uma referência nomeada passaram a ter conteúdos diferentes.',start:family.start,severity:'warning'});
 }
 return findings;
}
