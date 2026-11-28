// Count disjoint final source units, not attempted repairs or diff blocks.
function v2222CountHeadingRemainder(before,after,result){
 if(result?.exact)return result;
 if(!result||!Array.isArray(result.unresolved)||!result.unresolved.length||result.unresolved.some(e=>e.precise===false))return null;
 const extra=[],same=(a,b)=>['start','end','newStart','newEnd','before','after'].every(k=>a[k]===b[k]),unresolved=result.unresolved.filter(e=>!result.events.some(event=>event.sourceHash===v24SyntaxHash(before)&&event.outputHash===v24SyntaxHash(after)&&Array.isArray(event.fragments)&&event.fragments.some(f=>f.precise!==false&&same(e,f)&&before.slice(f.start,f.end)===f.before&&after.slice(f.newStart,f.newEnd)===f.after)));
 for(const e of unresolved){
  const gap=!e.before.trim()&&!e.after.trim();if(gap){extra.push({id:'spacing:'+e.start,kind:'spacing',count:1});continue;}
  if(e.before.trim()&&e.after.trim())return null;const inserted=!e.before.trim(),text=inserted?e.after:e.before;let headings=0,markers=0;
  const remainder=text.replace(/(?:^|\n)[ \t]*(={1,6})[^=\r\n]+\1[ \t]*(?=\r?\n|$)/g,()=>{headings++;return '\n';}).replace(/(?:^|\n)[ \t]*[*#]+[ \t]*(?=\r?\n|$)/g,()=>{markers++;return '\n';});
  if(remainder.trim()||!headings&&!markers)return null;for(let i=0;i<headings;i++)extra.push({id:'heading:'+e.start+':'+i,kind:inserted?'heading-insertion':'heading-removal',count:1});for(let i=0;i<markers;i++)extra.push({id:'list-marker:'+e.start+':'+i,kind:inserted?'list-marker-insertion':'list-marker-removal',count:1});
 }
 return{exact:true,count:result.events.length+extra.length,events:[...result.events,...extra],unit:'retained-final-source-unit'};
}
function v2222CountOutside(c,start,end){
 if(!c.countHard)return v2221LayoutOutside(c,start,end);
 if(c.countHard.some(r=>r.start<=start&&start<r.end||r.start<end&&end<=r.end))return false;
 const s=c.stateAt(start);return !s.templates.length&&!s.tables.length&&!s.links.length&&!s.external.length&&(!s.html.length||v2222LayoutCountSealedHtml(c.countSource,c.nodes,s,start));
}
function v2222CountReadContext(source){const literal=v24SyntaxProtected(source).ranges.filter(r=>!['quotation','quotation-markup','quotation-template'].includes(r.kind));return{...v2221LayoutContext(v2222LayoutCountContextSource(source)),countSource:source,countHard:[...literal,...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)]};}
function v2222CountReadFields(raw){return v2221LayoutFields(raw)||v2222InfoboxCountFields(raw)||v2222CountCitationFields(raw);}
function v2222CountCitationFields(raw){
 if(typeof raw!=='string'||raw.length>65536||!templates(raw).nodes.some(n=>n.start===0&&n.end===raw.length)||!v2222CitationContext(raw)&&!v2221LayoutNamed(raw,['Citation','Citar bíblia']))return null;const p=v222Fields(raw);if(!p||p.fields.length!==p.parts.length-1||'{{'+p.parts.map(f=>f.text).join('|')+'}}'!==raw)return null;const fields=[],slots=new Map();for(let i=0;i<p.fields.length;i++){const f=p.fields[i];if(raw.slice(f.keyStart,f.keyEnd)!==f.key||raw.slice(f.valueStart,f.end)!==f.value||raw[f.valueStart-1]!=='=')return null;const field={...f,index:i+1,equals:f.valueStart-f.start-1,positional:false};fields.push(field);slots.set(field.key,field.value);}return{parts:p.parts,fields,slots};
}
// Comparison-only subset of the pinned NSRW wrapper (60696160), native
// encyclopedia template (60787857) and its literal module reader (49700072).
// Display/short/attribution variants remain outside this finite count bridge.
function v2222CountNSRWSource(raw){
 const p=v222Fields(raw);if(!p||!v2221LayoutNamed(raw,['Cite NSRW'])||p.parts.length!==2||p.fields.length!==1||p.fields[0].key!=='wstitle')return null;const title=p.fields[0].value.trim();
 if(!title||title.length>512||!/[\p{L}\p{N}]/u.test(title)||/[{}<>\[\]|`:#%\\\r\n\u0000-\u001f\u007f-\u009f\uE000-\uF8FF]/.test(title)||title.startsWith('/')||title.includes('..')||title.includes("''"))return null;
 const work="The New Student's Reference Work";return{title,linkedTitle:'[[s:en:'+work+'/'+title+'|'+title+']]',work:'[[s:en:'+work+'|'+work+']]'};
}
function v2222CountNSRWImportPair(before,after){
 const source=v2222CountNSRWSource(before),p=source&&v222Fields(after),native=p&&v2222CitationContext(after),reader=native&&v2215CitationReader(native);if(!source||!p||p.parts.length!==8||p.fields.length!==7||reader?.module!=='Módulo:Citar enciclopédia'||reader.oldid!==49700072)return null;
 const wanted=new Map([[JSON.stringify(['Title']),source.linkedTitle],[JSON.stringify(['Encyclopedia','Periodical'].sort()),source.work],[JSON.stringify(['Year']),'1914'],[JSON.stringify(['EditorList-First:1']),'Chandler B.'],[JSON.stringify(['EditorList-Last:1']),'Beach'],[JSON.stringify(['Place']),'Chicago'],[JSON.stringify(['PublisherName']),'F. E. Compton and Co']]),seen=new Set();
 for(const f of p.fields){const roles=JSON.stringify(v222CitationRoles(f.key,reader).slice().sort());if(seen.has(roles)||!wanted.has(roles)||!v222CitationTargetAccepted(native,f.key,reader)||f.value.trim()!==wanted.get(roles))return null;seen.add(roles);}
 if(seen.size!==wanted.size)return null;const kinds=['template-name','parameter-name','parameter-value',...Array(6).fill('parameter-insertion')];return{exact:true,count:kinds.length,events:kinds.map((kind,i)=>({id:'nsrw-native-component:'+i,kind,count:1})),unit:'retained-final-template-field'};
}
function v2222CountOwnerKey(raw,cfg={}){
 const f=v2222CountReadFields(raw),head=f?.parts[0].text;if(!head)return null;let key=v24SyntaxName(head);const alias=v2222LayoutCountOwnerAlias(raw);if(alias)return alias;
 if(/^(?:info\/|infobox[ _])/.test(key))return'@infobox';
 if(key==='normdaten'||v2221LayoutFooterKind(raw,cfg)==='authority')return'@authority';
 const sort=/^\s*([^:{}|]+)\s*:([^{}|<>\r\n]+)$/.exec(head);if(sort&&v222MagicIdentity(sort[1])==='defaultsort')return'@sort:'+sort[2];
 if(['referências','referencias','reflist','references'].includes(key))return'@references';
 if(['commonscat','commonscat-inline'].includes(key))return'@sister:commonscat';
 if(['ver desambiguação2','ver desambig'].includes(key))return'@hatnote:ver-desambig';
 if(v2222CitationContext(raw)||v2222CountNSRWSource(raw))return'@citation';
 return key;
}
function v2222CountOwnerFingerprints(node){
 if(node.image||node.category)return[node.raw];const p=v2222CountReadFields(node.raw);if(!p)return[];
 const result=['fields:'+JSON.stringify(p.fields.map(f=>[f.key,f.value.trim()]).sort((a,b)=>a[0].localeCompare(b[0])||a[1].localeCompare(b[1]))),...v2222LayoutCountOwnerContentFingerprints(node.raw)];
 const nsrw=v2222CountNSRWSource(node.raw);if(nsrw)result.push('Title:'+nsrw.linkedTitle);
 if(node.key==='@citation'){const c=v2222CitationContext(node.raw),r=c&&v2215CitationReader(c);if(r)for(const f of p.fields){const roles=v222CitationRoles(f.key,r);for(const role of roles)if(['Title','URL','Identifier:ISBN','Identifier:DOI'].includes(role)&&f.value.trim()&&!/[{}<>\r\n]/.test(f.value))result.push(role+':'+f.value.trim());}}
 return result;
}
function v2222CountIndependentOwners(source,cfg={}){
 const c=v2222CountReadContext(source),nodes=c.nodes.filter(n=>v2222CountOutside(c,n.start,n.end));
 const result=nodes.filter(n=>!nodes.some(parent=>parent.start<n.start&&parent.end>=n.end)).map(n=>{
  const raw=source.slice(n.start,n.end),key=v2222CountOwnerKey(raw,cfg);return{...n,raw,key};
 }).filter(n=>n.key&&n.end-n.start<=65536);
 const stack=[];for(let at=0;at<c.view.length-1;at++){const pair=c.view.slice(at,at+2);if(pair==='[['){stack.push(at);at++;}else if(pair===']]'&&stack.length){const start=stack.pop(),end=at+2,raw=source.slice(start,end),m=/^\[\[(Ficheiro|Imagem|File|Image|Arquivo|Categoria|Category)\s*:([^|\]\r\n]+)/i.exec(raw);if(m&&!result.some(n=>n.start<=start&&end<=n.end)&&v2222CountOutside(c,start,end)){const category=/^(?:Categoria|Category)$/i.test(m[1]),name=m[2].replace(/_/g,' ').trim().normalize('NFC');result.push({start,end,raw,key:(category?'@category:':'@image:')+name,image:!category,category});}at++;}}
 if(/<references\b/i.test(source))for(const row of v2221ReferenceRows(source))if(row.native&&row.descriptor?.safe&&!row.descriptor.bank&&!result.some(n=>n.start<row.end&&row.start<n.end)&&v2222CountOutside(c,row.start,row.end))result.push({...row,key:row.descriptor.group==='nota'?'notas':'@references',nativeReference:true});
 return result;
}
function v2222CountCollectorFields(x,y){
 if(x.nativeReference===y.nativeReference)return null;const html=x.nativeReference?x:y,call=x.nativeReference?y:x,p=v2222CountReadFields(call.raw),tag=v24SyntaxTag(html.raw,0),attrs=tag&&v24SyntaxAttrs(tag.attrs);if(!p||!attrs||!tag.self||Object.keys(attrs).some(k=>!['group','responsive'].includes(k))||p.fields.some(f=>!['nível','grupo','group','col','colwidth','largcol','larguracol'].includes(f.key)||/[{}<>\r\n]/.test(f.value)))return null;
 const events=[{kind:'reference-collector-syntax',count:1}];for(const key of Object.keys(attrs))events.push({kind:'reference-attribute-removal',key,count:1});for(const f of p.fields)events.push({kind:'reference-parameter-insertion',key:f.key,count:1});return{exact:true,count:events.length,events};
}
// An adjacent run of identical standalone metadata has one unchanged
// retained call. Its removed line delimiters belong to each removed duplicate.
function v2222CountAdjacentDuplicateProjection(before,after,cfg={}){
 const left=v2222CountIndependentOwners(before,cfg).sort((a,b)=>a.start-b.start),right=v2222CountIndependentOwners(after,cfg),edits=[],events=[],used=new Set(),eligible=n=>n.category||['@authority','@references','portal3'].includes(n.key);
 for(let i=0;i<left.length;i++){const first=left[i];if(!eligible(first)||used.has(first.raw)||(first.start>0&&before[first.start-1]!=='\n')||(first.end<before.length&&before[first.end]!=='\n'))continue;const run=[first];let at=i;
  while(at+1<left.length&&left[at+1].raw===first.raw&&/^\r?\n$/.test(before.slice(left[at].end,left[at+1].start))&&(left[at+1].end===before.length||before[left[at+1].end]==='\n')){run.push(left[++at]);}
  if(run.length<2)continue;const all=left.filter(n=>n.raw===first.raw),targets=right.filter(n=>n.raw===first.raw);if(all.length!==run.length||targets.length!==1)continue;const target=targets[0];if(target.start>0&&after[target.start-1]!=='\n'||target.end<after.length&&after[target.end]!=='\n')continue;
  used.add(first.raw);edits.push({start:first.start,end:run.at(-1).end,text:first.raw});for(let j=1;j<run.length;j++)events.push({id:'adjacent-duplicate:'+run[j].start,kind:'duplicate-metadata-line-removal',count:1});i=at;
 }return edits.length?{before:v24SyntaxApply(before,edits),after,events}:null;
}
function v2222CountMetadataFamily(node){
 if(node.category)return{family:node.key,kind:'identical',raw:node.raw};const p=v2222CountReadFields(node.raw);if(!p)return null;
 if(node.key==='portal3'){if(!p.fields.length||p.fields.some((f,i)=>f.key!==String(i+1)||!f.value.trim()||/[{}\[\]<>|\r\n]/.test(f.value)))return null;return{family:'portal3',kind:'topics',p,items:p.fields.map(f=>f.value.trim().normalize('NFC'))};}
 const renderer=v2221LayoutNamed(node.raw,['Referências','Referencias','Reflist','References'])?'references':v2221LayoutNamed(node.raw,['Notas','Notelist','Listanota','NoteFoot'])?'notes':v2221LayoutNamed(node.raw,['Notas e referências'])?'both':null;
 if(renderer)return p.fields.length?null:{family:'collectors',kind:'collectors',renderer,p};
 if(node.key==='@authority'||node.key==='taxonbar'||node.key.startsWith('@sort:')){if(p.fields.some(f=>/[{}<>\r\n]/.test(f.value))||new Set(p.fields.map(f=>f.key)).size!==p.fields.length)return null;return{family:node.key,kind:'fields',p,fields:new Map(p.fields.map(f=>[f.key,f.value.trim()]))};}return null;
}
function v2222CountStandalone(source,node){return(node.start===0||source[node.start-1]==='\n')&&(node.end===source.length||/^\r?\n/.test(source.slice(node.end)));}
function v2222CountRemovedLines(source,nodes){
 const chunks=[];for(const n of nodes.slice().sort((a,b)=>a.start-b.start)){const last=chunks.at(-1);if(last&&/^\r?\n$/.test(source.slice(last.end,n.start)))last.end=n.end;else chunks.push({start:n.start,end:n.end});}
 return chunks.map(c=>{if(source.slice(c.end,c.end+2)==='\r\n')return{start:c.start,end:c.end+2,text:''};if(source[c.end]==='\n')return{start:c.start,end:c.end+1,text:''};if(source.slice(c.start-2,c.start)==='\r\n')return{start:c.start-2,end:c.end,text:''};if(source[c.start-1]==='\n')return{start:c.start-1,end:c.end,text:''};return{...c,text:''};});
}
function v2222CountFamilyKept(before,after,left,target){
 const targetHead=v2222CountReadFields(target.raw)?.parts[0].text.trim(),preferred=left.filter(n=>n.raw===target.raw),sameHead=left.filter(n=>v2222CountReadFields(n.raw)?.parts[0].text.trim()===targetHead),pool=preferred.length?preferred:sameHead.length?sameHead:left;
 const mask=(source,rows,cut=source.length)=>v24SyntaxApply(source.slice(0,cut),rows.filter(n=>n.end<=cut).map(n=>({start:n.start,end:n.end,text:''}))).replace(/\s/g,''),a=mask(before,left),b=mask(after,[target]),changes=v27RawDiff(a,b),gap=mask(after,[target],target.start).length;
 if(changes.every(e=>e.precise!==false)){const aligned=pool.filter(n=>{const at=mask(before,left,n.start).length,x=v211CountAnchor(at,changes),y=v211CountAnchor(at,changes,false,true);return Math.min(x,y)<=gap&&gap<=Math.max(x,y);});if(aligned.length)return aligned.at(-1);}return pool.at(-1);
}
// Consolidation keeps existing topics/fields. Transferring them between native
// calls does not manufacture newly added data or syntax-count credit.
function v2222CountMetadataFamilyProjection(before,after,cfg={}){
 const left=v2222CountIndependentOwners(before,cfg).map(n=>({...n,family:v2222CountMetadataFamily(n)})).filter(n=>n.family&&v2222CountStandalone(before,n)),right=v2222CountIndependentOwners(after,cfg).map(n=>({...n,family:v2222CountMetadataFamily(n)})).filter(n=>n.family&&v2222CountStandalone(after,n)),edits=[],events=[];
 for(const family of new Set(left.map(n=>n.family.family))){const xs=left.filter(n=>n.family.family===family),ys=right.filter(n=>n.family.family===family);if(!xs.length||ys.length!==1||xs.length>128)continue;const target=ys[0],kind=target.family.kind;let additions=0,headerChange=0;
  if(kind==='topics'){const original=new Set(xs.flatMap(n=>n.family.items)),topics=target.family.items;if(new Set(topics).size!==topics.length||[...original].some(v=>!topics.includes(v)))continue;additions=topics.filter(v=>!original.has(v)).length;if(xs.length===1&&!additions)continue;}
  else if(kind==='fields'){const original=new Map();let conflict=false;for(const n of xs)for(const[k,v]of n.family.fields){if(original.has(k)&&original.get(k)!==v)conflict=true;original.set(k,v);}if(conflict||[...original].some(([k,v])=>target.family.fields.get(k)!==v))continue;additions=[...target.family.fields].filter(([k])=>!original.has(k)).length;if(xs.length===1&&!additions)continue;}
  else if(kind==='identical'){if(xs.length<2||xs.some(n=>n.raw!==target.raw))continue;}
  else if(kind==='collectors'){const kinds=new Set(xs.map(n=>n.family.renderer)),wanted=kinds.has('both')||kinds.has('notes')&&kinds.has('references')?'both':[...kinds][0];if(xs.length>1&&wanted!==target.family.renderer||xs.length===1&&xs[0].raw===target.raw)continue;}
  const kept=v2222CountFamilyKept(before,after,xs,target);if(!kept)continue;
  if(kind!=='identical'&&kind!=='collectors'&&kept.family.p.parts[0].text.trim()!==target.family.p.parts[0].text.trim())headerChange=1;if(kind==='collectors'&&(xs.length===1||xs.every(n=>n.family.renderer===target.family.renderer)&&kept.family.p.parts[0].text.trim()!==target.family.p.parts[0].text.trim()))headerChange=1;
  const removed=xs.filter(n=>n!==kept),drop=v2222CountRemovedLines(before,removed);if(drop.some(e=>e.start<kept.end&&kept.start<e.end))continue;const change=kept.raw===target.raw?[]:[{start:kept.start,end:kept.end,text:target.raw}];edits.push(...drop,...change);
  for(const n of removed)events.push({id:'metadata-family:'+n.start,kind:'metadata-call-consolidation',count:1});for(let i=0;i<additions;i++)events.push({id:'metadata-new:'+target.start+':'+i,kind:kind==='topics'?'new-portal-topic':'new-native-field',count:1});if(headerChange)events.push({id:'metadata-header:'+kept.start,kind:'template-name',count:1});
 }
 if(!events.length||edits.some((e,i)=>edits.some((f,j)=>i!==j&&e.start<f.end&&f.start<e.end)))return null;return{before:v24SyntaxApply(before,edits),after,events};
}
function v2222CountListSections(source,owners,cfg={}){
 const c=v2222CountReadContext(source),heads=[...c.view.matchAll(/^(={2,6})[ \t]*([^=\r\n]+?)[ \t]*\1[ \t]*\r?$/gm)].filter(h=>v2222CountOutside(c,h.index,h.index+h[0].length)),allowed=new Set(['ver também','bibliografia','leitura adicional','leituras adicionais','ligações externas','obras citadas']),out=[];
 for(let i=0;i<heads.length;i++){const h=heads[i],title=h[2].trim().toLocaleLowerCase('pt');if(!allowed.has(title))continue;const start=h.index,bodyStart=start+h[0].length;let end=heads[i+1]?.index??source.length;
  const stop=owners.filter(n=>n.start>=bodyStart&&n.start<end&&(n.category||n.key==='@references'||['notas','notelist','notas e referências'].includes(n.key)||v2222LayoutCountFooterMetadata(n.raw)||['navbox','authority','taxonbar','portal','stub','sort','coord','composite'].includes(v2221LayoutFooterKind(n.raw,cfg)))).sort((a,b)=>a.start-b.start)[0];if(stop)end=stop.start;const shell=owners.filter(n=>n.start>=bodyStart&&n.end<=end&&['@bibliography:begin','@bibliography:end'].includes(n.key)),begins=shell.filter(n=>n.key==='@bibliography:begin'),ends=shell.filter(n=>n.key==='@bibliography:end');if(begins.length===1&&ends.length===1&&begins[0].end<ends[0].start){const a=v2222CountReadFields(begins[0].raw),b=v2222CountReadFields(ends[0].raw);if(a&&b&&!b.fields.length&&a.fields.length<=1&&a.fields.every(f=>f.key==='1'&&/^[ \t]*[1-9]\d?(?:em|px)?[ \t]*$/.test(f.value)))end=ends[0].end;}const raw=source.slice(start,end).trimEnd();end=start+raw.length;
  if(end<=bodyStart||!/^\s*\*/m.test(source.slice(bodyStart,end))||owners.some(n=>n.start>=bodyStart&&n.end<=end&&v2222LayoutSister(n.raw)))continue;out.push({start,end,raw,key:'@list-section:'+h[1].length+':'+title,section:true});
 }return out;
}
// A moved standalone line carries one native line delimiter. This removes
// projection artifacts while leaving additional paragraph gaps in the body.
function v2222CountLineMargins(source,nodes,paired){
 const rows=nodes.slice().sort((a,b)=>a.start-b.start),out=new Map();let priorEnd=0;
 for(let i=0;i<rows.length;i++){const n=rows[i];let start=n.start,end=n.end;
  if(paired.has(n.id)&&(start===0||source[start-1]==='\n')&&(end===source.length||source[end]==='\n')){
   if(start>0&&start-1>=priorEnd)start--;else if(end<source.length&&end+1<=(rows[i+1]?.start??source.length))end++;
  }
  priorEnd=end;out.set(n.id,{...n,start,end});
 }return out;
}
function v2222CountPartition(source,owners){
 let text='',cursor=0;const slots=[];
 for(const n of owners.slice().sort((a,b)=>a.start-b.start)){
  if(n.start<cursor)return null;text+=source.slice(cursor,n.start);slots.push({id:n.id,gap:text.length});cursor=n.end;
 }
 text+=source.slice(cursor);return{text,slots};
}
function v2222CountLcs(a,b){
 if(a.length>512||b.length>512)return null;
 const rows=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)rows[i][j]=a[i]===b[j]?1+rows[i+1][j+1]:Math.max(rows[i+1][j],rows[i][j+1]);
 const kept=new Set();let i=0,j=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){kept.add(a[i]);i++;j++;}else if(rows[i+1][j]>=rows[i][j+1])i++;else j++;}return kept;
}
function v2222CountMovedOwners(a,b,pairs){
 const compact=s=>s.replace(/\s/g,''),oldBody=compact(a.text),newBody=compact(b.text),edits=v27RawDiff(oldBody,newBody);
 if(edits.some(e=>e.precise===false))return null;
 const matchedIds=new Set(pairs.map(p=>p.x.id)),moved=new Set();for(const x of a.slots.filter(x=>matchedIds.has(x.id))){const y=b.slots.find(v=>v.id===x.id),oldGap=compact(a.text.slice(0,x.gap)).length,newGap=compact(b.text.slice(0,y.gap)).length;
  const start=v211CountAnchor(oldGap,edits),end=v211CountAnchor(oldGap,edits,false,true);
  if(newGap<Math.min(start,end)||newGap>Math.max(start,end))moved.add(x.id);
 }
 const remainingOld=a.slots.filter(x=>matchedIds.has(x.id)&&!moved.has(x.id)).map(x=>x.id),remainingNew=b.slots.filter(x=>matchedIds.has(x.id)&&!moved.has(x.id)).map(x=>x.id),kept=v2222CountLcs(remainingOld,remainingNew);if(!kept)return null;
 for(const id of remainingOld)if(!kept.has(id))moved.add(id);
 return moved;
}
function v2222FinalSourceCount(before,after,cfg={},initial=null){
 if(typeof before!=='string'||typeof after!=='string'||before===after)return null;
 for(const[flag,make]of [['v2222ReferenceFamiliesCountProjected',v2222CountReferenceFamiliesProjection],['v2222ExternalCloseCountProjected',v2222LayoutCountExternalCloseProjection],['v2222InternalCloseCountProjected',v2222LayoutCountInternalCloseProjection],['v2222ImageIndentCountProjected',v2222LayoutCountImageIndentProjection],['v2222BibliographyHeaderCountProjected',v2222LayoutCountBibliographyProjection],['v2222FamilyCountProjected',v2222CountMetadataFamilyProjection],['v2222AdjacentCountProjected',v2222CountAdjacentDuplicateProjection],['v2222LeadCountProjected',v2222InfoboxCountLeadProjection],['v2222LayoutCountProjected',v2222LayoutCountProjection],['v2222SplitColumnsCountProjected',v2222LayoutCountSplitColumnsProjection],['v2222WitnessedColumnsCountProjected',v2222LayoutCountWitnessedColumnsProjection],['v2222AdjacentRefsCountProjected',v2222CountAdjacentReferenceProjection],['v2222NamesCountProjected',v2222CountReferenceNamesProjection],['v2222TailCountProjected',v2222CountCitationTailProjection],['v2222DeadCountProjected',v2222CountDeadMarkerProjection],['v2222DedupCountProjected',v2222CountReferenceReuseProjection],['v2222ISBNCountProjected',v2222CountISBNProjection],['v2222BankCountProjected',v2222CountReferenceBankProjection],['v2222BodiesCountProjected',v2222CountReferenceBodiesProjection]]){
  if(cfg[flag])continue;const projected=make(before,after,cfg);if(!projected)continue;const opts={...cfg,[flag]:true},base=v2222EndpointCount(projected.before,projected.after,['syntax'],{...opts,v2222FinalBodyCount:true}),inner=v2222CountHeadingRemainder(projected.before,projected.after,base)||v2222FinalSourceCount(projected.before,projected.after,opts,base);
  if(inner?.exact){const events=[...projected.events,...inner.events];return{exact:true,count:projected.events.length+inner.count,events,unit:'retained-final-source-unit'};}
 }
 if(!cfg.v2222ColumnCountProjected){const columns=v2222CountColumnProjection(before,after);if(columns){const opts={...cfg,v2222ColumnCountProjected:true},base=v2222EndpointCount(columns.before,columns.after,['syntax'],{...opts,v2222FinalBodyCount:true}),inner=v2222CountHeadingRemainder(columns.before,columns.after,base)||v2222FinalSourceCount(columns.before,columns.after,opts,base);if(inner?.exact){const events=[...columns.events,...inner.events];return {exact:true,count:columns.events.length+inner.count,events,unit:'retained-final-source-unit'};}}}
 if(!cfg.v2222PunctuationCountProjected){const punctuation=v2222CountReferencePunctuation(before,after,cfg);if(punctuation){const opts={...cfg,v2222PunctuationCountProjected:true},base=v2222EndpointCount(punctuation.text,after,['syntax'],{...opts,v2222FinalBodyCount:true}),inner=v2222CountHeadingRemainder(punctuation.text,after,base)||v2222FinalSourceCount(punctuation.text,after,opts,base);if(inner?.exact){const events=[...punctuation.events,...inner.events];return {exact:true,count:punctuation.events.length+inner.count,events,unit:'retained-final-source-unit'};}}}
 const heading=v2222CountHeadingRemainder(before,after,initial);if(heading?.exact)return heading;
 let left=v2222CountIndependentOwners(before,cfg),right=v2222CountIndependentOwners(after,cfg);const pairs=[],events=[];
 if(left.length>512||right.length>512)return null;
 if(!cfg.v2222SkipListSectionOwners){const a=v2222CountListSections(before,left,cfg),b=v2222CountListSections(after,right,cfg);
  for(const x of a){const xs=a.filter(n=>n.key===x.key),ys=b.filter(n=>n.key===x.key);if(xs.length!==1||ys.length!==1)continue;const y=ys[0],opts={...cfg,v2222SkipListSectionOwners:true},base=x.raw===y.raw?{exact:true,count:0,events:[]}:v2222EndpointCount(x.raw,y.raw,['syntax'],opts),local=v2222CountHeadingRemainder(x.raw,y.raw,base)||v2222FinalSourceCount(x.raw,y.raw,opts,base);if(!local?.exact)continue;
   left=left.filter(n=>!(x.start<=n.start&&n.end<=x.end));right=right.filter(n=>!(y.start<=n.start&&n.end<=y.end));left.push({...x,pairedRaw:y.raw,localCount:local});right.push({...y,pairedRaw:x.raw,localCount:local});
  }
 }
 const keys=new Set(left.map(n=>n.key)),usedLeft=new Set(),usedRight=new Set(),pair=(x,y,key)=>{
  const local=x.section||y.section?(x.section&&y.section&&x.pairedRaw===y.raw&&y.pairedRaw===x.raw?x.localCount:null):x.raw===y.raw?{count:0,exact:true,events:[]}:(v2222CountNSRWImportPair(x.raw,y.raw)||v2222CountHeadingRemainder(x.raw,y.raw,v2222EndpointCount(x.raw,y.raw,['syntax'],cfg))||v2222CountCollectorFields(x,y)||v2222CountTemplateFields(x.raw,y.raw,cfg,0,key.startsWith('@')));if(!local?.exact||!Number.isSafeInteger(local.count))return false;
  usedLeft.add(x);usedRight.add(y);const id='owner:'+pairs.length;pairs.push({x:{...x,id},y:{...y,id}});events.push(...Array.from({length:local.count},(_,i)=>({id:id+':'+i,kind:'template-component',count:1})));return true;
 };
 for(const key of keys){const xs=left.filter(n=>n.key===key),ys=right.filter(n=>n.key===key);
  for(const x of xs){const same=ys.filter(y=>!usedRight.has(y)&&y.raw===x.raw);if(same.length===1&&xs.filter(z=>!usedLeft.has(z)&&z.raw===x.raw).length===1)pair(x,same[0],key);}
  const fingerprints=new Map([...xs,...ys].map(n=>[n,v2222CountOwnerFingerprints(n)]));
  for(const x of xs.filter(n=>!usedLeft.has(n)))for(const identity of fingerprints.get(x)){const same=ys.filter(y=>!usedRight.has(y)&&fingerprints.get(y).includes(identity));if(same.length===1&&xs.filter(z=>!usedLeft.has(z)&&fingerprints.get(z).includes(identity)).length===1&&pair(x,same[0],key))break;}
  const a=xs.filter(n=>!usedLeft.has(n)),b=ys.filter(n=>!usedRight.has(n));if(a.length===1&&b.length===1)pair(a[0],b[0],key);
 }
 const oldOwners=pairs.map(p=>p.x),newOwners=pairs.map(p=>p.y);
 const simple=n=>{if(n.image||n.category||n.nativeReference)return true;if(!['@authority','@references'].includes(n.key)&&!n.key.startsWith('@sort:')&&!/^(?:portal3|isbn|notas|notelist|listanota|notas e referências|notes and references|imdb título|imdb titulo|descrição curta|short description|avançardiscussão|taxonbar|esboço(?:-.+)?)$/.test(n.key)&&!v2222LayoutSister(n.raw))return false;const f=v2222CountReadFields(n.raw);return !!f&&!f.fields.some(x=>/[{}]|(?:^|[\r\n])[ \t]*[*#;:=]/.test(x.value));};
 for(const [side,nodes,used]of [['old',left,oldOwners],['new',right,newOwners]])for(const n of nodes){if(used.some(x=>x.start===n.start)||!simple(n))continue;
  const id=side+':'+n.start,fields=v2221LayoutFields(n.raw),count=n.key==='portal3'?Math.max(1,fields.fields.filter(f=>/^\d+$/.test(f.key)&&f.value.trim()).length):1;
  used.push({...n,id});for(let i=0;i<count;i++)events.push({id:id+':'+i,kind:side==='old'?'call-removal':'call-insertion',count:1});
 }
 if(!oldOwners.length&&!newOwners.length)return null;
 const unmarginedLeft=v2222CountPartition(before,oldOwners),unmarginedRight=v2222CountPartition(after,newOwners);if(!unmarginedLeft||!unmarginedRight)return null;const movedForMargins=v2222CountMovedOwners(unmarginedLeft,unmarginedRight,pairs);if(!movedForMargins)return null;
 const matchedLineIds=new Set(pairs.map(p=>p.x.id)),leftLineIds=new Set([...movedForMargins,...oldOwners.filter(n=>n.id.startsWith('old:')).map(n=>n.id)]),rightLineIds=new Set([...movedForMargins,...newOwners.filter(n=>n.id.startsWith('new:')).map(n=>n.id)]),leftMargins=v2222CountLineMargins(before,oldOwners,leftLineIds),rightMargins=v2222CountLineMargins(after,newOwners,rightLineIds);for(const n of oldOwners.filter(n=>!matchedLineIds.has(n.id)))Object.assign(n,leftMargins.get(n.id));for(const n of newOwners.filter(n=>!matchedLineIds.has(n.id)))Object.assign(n,rightMargins.get(n.id));for(const pair of pairs){const x=leftMargins.get(pair.x.id),y=rightMargins.get(pair.y.id),hasMargin=(raw,n)=>n.start<raw.start||n.end>raw.end;if(movedForMargins.has(pair.x.id)&&x&&y&&hasMargin(pair.x,x)&&hasMargin(pair.y,y)){Object.assign(pair.x,{start:x.start,end:x.end});Object.assign(pair.y,{start:y.start,end:y.end});}}
 const a=v2222CountPartition(before,oldOwners),b=v2222CountPartition(after,newOwners);if(!a||!b)return null;
 const body=v2222CountHeadingRemainder(a.text,b.text,v2222EndpointCount(a.text,b.text,['syntax'],{...cfg,v2222FinalBodyCount:true}));if(!body?.exact||!Number.isSafeInteger(body.count))return null;
 events.push(...Array.from({length:body.count},(_,i)=>({id:'body:'+i,kind:'source-component',count:1})));
 // Whitespace is counted by the body comparison. A move crosses a stable
 // non-whitespace body position or changes the relative order of owners.
 const moved=movedForMargins;
 for(const id of moved)events.push({id:id+':move',kind:'template-movement',count:1});
 if(!events.length)return null;return{count:events.length,exact:true,events,unit:'retained-final-source-unit'};
}

function v2222CountTemplateFields(before,after,cfg={},depth=0,allowHeader=false){
 if(depth>16||![before,after].every(raw=>templates(raw).nodes.some(n=>n.start===0&&n.end===raw.length)))return null;const a=v2222CountReadFields(before),b=v2222CountReadFields(after);if(!a||!b)return null;
 const imported=v2222CountNSRWImportPair(before,after);if(imported)return imported;
 const ah=a.parts[0].text,bh=b.parts[0].text;if(!allowHeader&&ah.trim().normalize('NFC').toLocaleLowerCase('pt')!==bh.trim().normalize('NFC').toLocaleLowerCase('pt'))return null;
 const events=[],emit=kind=>events.push({id:'field:'+events.length,kind,count:1});
 if(ah.trim()!==bh.trim())emit('template-name');if(ah.replace(ah.trim(),'#')!==bh.replace(bh.trim(),'#'))emit('template-layout');
 const old=a.fields.map((f,i)=>({...f,id:i,used:false})),fresh=b.fields.map((f,i)=>({...f,id:i,used:false})),pairs=[];
 const pair=(x,y)=>{x.used=true;y.used=true;pairs.push([x,y]);};
 for(const x of old){const y=fresh.find(y=>!y.used&&y.key===x.key&&y.part.text===x.part.text);if(y)pair(x,y);}
 for(const x of old.filter(x=>!x.used)){const y=fresh.find(y=>!y.used&&y.key===x.key);if(y)pair(x,y);}
 for(const x of old.filter(x=>!x.used)){const ys=fresh.filter(y=>!y.used&&y.value.trim()===x.value.trim());if(ys.length===1&&old.filter(v=>!v.used&&v.value.trim()===x.value.trim()).length===1)pair(x,ys[0]);}
 const ordinalPairs=old.filter(x=>!x.used).map(x=>[x,fresh.find(y=>!y.used&&y.id===x.id&&y.value.trim()===x.value.trim())]).filter(([,y])=>y);for(const[x,y]of ordinalPairs)if(!x.used&&!y.used)pair(x,y);
 const remainingOld=old.filter(x=>!x.used),remainingNew=fresh.filter(x=>!x.used);
 if(remainingOld.length===1&&remainingNew.length===1&&remainingOld[0].id===remainingNew[0].id)pair(remainingOld[0],remainingNew[0]);
 const layout=f=>{const value=f.value,part=f.part.text;return JSON.stringify([!!f.positional,f.positional?'':part.slice(0,f.equals).replace(f.key,'#'),value.slice(0,value.length-value.trimStart().length),value.slice(value.trimEnd().length)]);};
 for(const[x,y]of pairs){
  if(x.key!==y.key)emit('parameter-name');
  if(x.value.trim()!==y.value.trim()){
   const u=x.value.trim(),v=y.value.trim(),nested=u.startsWith('{{')&&u.endsWith('}}')&&v.startsWith('{{')&&v.endsWith('}}')?v2222CountTemplateFields(u,v,cfg,depth+1):null;
   if(nested)for(const e of nested.events)emit(e.kind);else emit('parameter-value');
  }
  if(layout(x)!==layout(y))emit('parameter-layout');
 }
 for(const x of old)if(!x.used)emit('parameter-removal');for(const y of fresh)if(!y.used)emit('parameter-insertion');
 const ordered=pairs.slice().sort((x,y)=>x[0].id-y[0].id);if(ordered.some((p,i)=>i&&p[1].id<ordered[i-1][1].id))emit('parameter-order');
 if(before!==after&&!events.length)return null;
 return{exact:true,count:events.length,events,unit:'retained-final-template-field'};
}

function v2222FinalLexicalDiff(before,after){
 const edits=[];for(const e of v27LexicalDiff(before,after,0,0)){
  if(e.precise!==false&&e.before&&e.after&&e.before.length+e.after.length<=1024){
   const refined=v27SequenceHunks(e.before,e.after,Array.from(e.before),Array.from(e.after),e.start,e.newStart,65536);
   if(refined.every(x=>x.precise!==false)){edits.push(...refined);continue;}
  }
  edits.push(e);
 }
 let cursor=0,text='';for(const e of edits){if(e.start<cursor)return[{start:0,end:before.length,newStart:0,newEnd:after.length,before,after,precise:false}];text+=before.slice(cursor,e.start)+e.after;cursor=e.end;}text+=before.slice(cursor);
 return text===after?edits:[{start:0,end:before.length,newStart:0,newEnd:after.length,before,after,precise:false}];
}

// Project only literal column shells. Their complete list bodies remain in the
// comparison, so citation/text changes inside a wrapper are counted separately.
function v2222CountColumnShells(source){
 if(!/\{\{\s*(?:(?:Predefinição|Template)\s*:\s*)?(?:colunas[- _]lista|div[ _]col)\b/i.test(source))return {frames:[],text:source};
 const c=v2222CountReadContext(source),nodes=c.nodes.filter(n=>v2222CountOutside(c,n.start,n.end)),frames=[],edits=[];
 for(const n of nodes){const raw=source.slice(n.start,n.end),p=v2221LayoutFields(raw);if(!p)continue;
  if(v2221LayoutNamed(raw,['Colunas-lista'])){const body=p.fields.filter(f=>f.key==='2'),cols=p.fields.filter(f=>f.key==='1');if(body.length!==1||cols.length!==1||p.fields.length!==2||!/^\s*[1-9]\d?(?:\.\d+)?(?:em|px)?\s*$/.test(cols[0].value)||!body[0].value.trim())continue;const f=body[0],start=n.start+2+f.part.start+(f.positional?0:f.equals+1),end=n.start+2+f.part.end;if(source.slice(start,end)!==f.value)continue;frames.push({kind:'list',columns:cols[0].value.trim(),start:n.start,end:n.end,body:f.value});edits.push({start:n.start,end:start,text:''},{start:end,end:n.end,text:''});
  }else if(v2221LayoutNamed(raw,['Div col'])){if(p.fields.length>1||p.fields.length===1&&(p.fields[0].key!=='colunas'||!/^\s*[1-9]\d?\s*$/.test(p.fields[0].value)))continue;const next=nodes.filter(x=>x.start>=n.end).find(x=>v2221LayoutNamed(source.slice(x.start,x.end),['Div col','Div col fim','Div col end']));if(!next)continue;const close=source.slice(next.start,next.end),q=v2221LayoutFields(close);if(!q||q.fields.length||!v2221LayoutNamed(close,['Div col fim','Div col end']))continue;frames.push({kind:'paired',columns:p.fields[0]?.value.trim()||'2',start:n.start,end:next.end,body:source.slice(n.end,next.start)});edits.push({start:n.start,end:n.end,text:''},{start:next.start,end:next.end,text:''});}
 }
 if(frames.length>16||edits.some((e,i)=>edits.some((f,j)=>i!==j&&e.start<f.end&&f.start<e.end)))return null;
 return{frames,text:v24SyntaxApply(source,edits)};
}
function v2222CountColumnProjection(before,after){
 const a=v2222CountColumnShells(before),b=v2222CountColumnShells(after);if(!a||!b||!a.frames.length&&!b.frames.length)return null;
 const old=a.frames.map(f=>({...f,used:false})),fresh=b.frames.map(f=>({...f,used:false})),pairs=[],events=[],emit=kind=>events.push({id:'column-shell:'+events.length,kind,count:1});
 for(const x of old){const ys=fresh.filter(y=>!y.used&&y.body===x.body);if(ys.length===1&&old.filter(z=>!z.used&&z.body===x.body).length===1){x.used=true;ys[0].used=true;pairs.push([x,ys[0]]);}}
 for(const x of old.filter(f=>!f.used)){const body=x.body.trim(),ys=fresh.filter(y=>!y.used&&y.body.trim()===body);if(body&&ys.length===1&&old.filter(z=>!z.used&&z.body.trim()===body).length===1){x.used=true;ys[0].used=true;pairs.push([x,ys[0]]);}}
 for(const x of old.filter(f=>!f.used)){const identity=v2222LayoutCountColumnSectionIdentity(before,x,a.frames);if(!identity)continue;const ys=fresh.filter(y=>!y.used&&v2222LayoutCountColumnSectionIdentity(after,y,b.frames)===identity);if(ys.length===1&&old.filter(z=>!z.used&&v2222LayoutCountColumnSectionIdentity(before,z,a.frames)===identity).length===1){x.used=true;ys[0].used=true;pairs.push([x,ys[0]]);}}
 const x=old.filter(f=>!f.used),y=fresh.filter(f=>!f.used);if(x.length===1&&y.length===1){x[0].used=true;y[0].used=true;pairs.push([x[0],y[0]]);}
 else if(x.length&&y.length)return null;
 for(const[p,q]of pairs){if(p.kind!==q.kind)emit('column-wrapper-kind');if(p.columns!==q.columns)emit('column-wrapper-configuration');if(p.kind===q.kind&&p.columns===q.columns&&before.slice(p.start,p.end)!==after.slice(q.start,q.end)&&p.body===q.body)emit('column-wrapper-layout');}
 for(const p of old)if(!p.used)emit('column-wrapper-removal');for(const q of fresh)if(!q.used)emit('column-wrapper-insertion');
 return {before:a.text,after:b.text,events};
}
// Both endpoints prove the observed punctuation move. This does not run the
// adjustment rule or decide where punctuation ought to go.
function v2222CountReferencePunctuation(before,after,cfg={}){
 if(!/>[.,;:!?]/.test(before)||!/<ref\b/i.test(before))return null;
 const a=v219NativeReferenceObserver(before),b=v219NativeReferenceObserver(after);if(!a.refs.length||a.refs.length!==b.refs.length||[a,b].some(x=>x.unclosed.length||x.empties.length)||JSON.stringify(a.helpers.map(r=>r.raw))!==JSON.stringify(b.helpers.map(r=>r.raw)))return null;
 const identity=r=>JSON.stringify([r.attrs,r.group,r.body===null]);
 for(let i=0;i<a.refs.length;i++){const x=a.refs[i],y=b.refs[i];if(identity(x)!==identity(y)||x.typo||y.typo)return null;}
 const edits=[],events=[];
 for(let i=0;i<a.refs.length;i++){let j=i;while(j+1<a.refs.length&&/^[ \t]*$/.test(before.slice(a.refs[j].end,a.refs[j+1].start))&&/^[ \t]*$/.test(after.slice(b.refs[j].end,b.refs[j+1].start)))j++;
  const at=a.refs[j].end,mark=before[at],target=b.refs[i].start;if(!/[.,;:!?]/.test(mark||'')||after[target-1]!==mark||after[b.refs[j].end]===mark){i=j;continue;}
  edits.push({start:at,end:at+1,text:''});if(before[a.refs[i].start-1]!==mark)edits.push({start:a.refs[i].start,end:a.refs[i].start,text:mark});events.push({id:'reference-punctuation:'+a.refs[i].start,kind:'reference-punctuation-movement',count:1});i=j;
 }
 return edits.length?{text:v24SyntaxApply(before,edits),events}:null;
}

function v2222CountReferenceKey(ref){
 if(!ref||ref.typo||!ref.attrs)return null;
 return JSON.stringify(Object.keys(ref.attrs).sort().map(k=>[k,ref.attrs[k]]));
}
// A literal article locator has two independently retained components: the
// removed parameter and its exact code printed inside the same reference.
function v2222CountCitationTailProjection(before,after){
 if(!/\|[ \t\r\n]*(?:article-number|número-artigo)\s*=/.test(before)||!/>/.test(after))return null;
 const a=v219NativeReferenceObserver(before),b=v219NativeReferenceObserver(after);if(a.unclosed.length||b.unclosed.length||a.refs.length!==b.refs.length)return null;
 const edits=[],events=[];
 for(let i=0;i<a.refs.length;i++){
  const x=a.refs[i],y=b.refs[i];if(typeof x.body!=='string'||typeof y.body!=='string'||!x.close||!y.close||v2222CountReferenceKey(x)!==v2222CountReferenceKey(y))continue;
  const raw=x.body.trim(),p=v222Fields(raw),c=p&&v2222CitationContext(raw),r=c&&v2215CitationReader(c);if(!p||r?.kind!=='periodical'||!templates(raw).nodes.some(n=>n.start===0&&n.end===raw.length))continue;
  const ids=p.fields.filter(f=>['article-number','número-artigo'].includes(f.key));if(ids.length!==1||!/^\s*[A-Za-z0-9][A-Za-z0-9._/-]*\s*$/.test(ids[0].value))continue;
  const id=ids[0],code=id.value.trim(),tail=' Artigo '+code,target=y.body.trim();if(!target.endsWith(tail))continue;
  const targetCall=target.slice(0,-tail.length),q=v222Fields(targetCall),d=q&&v2222CitationContext(targetCall),s=d&&v2215CitationReader(d);if(!q||s?.module!==r.module||s.oldid!==r.oldid||q.fields.some(f=>['article-number','número-artigo'].includes(f.key)))continue;
  if(p.fields.some(f=>v222CitationRoles(f.key,r).some(role=>['Page','Pages','At'].includes(role))))continue;
  const call=raw.slice(0,id.start-1)+raw.slice(id.end),changed=x.body.replace(raw,call+tail);if(changed===x.body)continue;
  const bodyStart=x.end-x.body.length-(x.close.end-x.close.start);if(before.slice(bodyStart,bodyStart+x.body.length)!==x.body)return null;
  edits.push({start:bodyStart,end:bodyStart+x.body.length,text:changed});events.push({id:'literal-locator:'+i+':field',kind:'parameter-removal',count:1},{id:'literal-locator:'+i+':tail',kind:'reference-literal-locator-insertion',count:1});
 }
 return edits.length?{before:v24SyntaxApply(before,edits),after,events}:null;
}
function v2222CountBankBody(body){
 const seen=new Set(),o=v219NativeReferenceObserver(body);if(!o.refs.length||o.unclosed.length||o.empties.length||o.shield.unclosed.length)return null;
 const edits=[];for(const r of o.refs){const key=v2222CountReferenceKey(r);if(!r.close||typeof r.body!=='string'||!r.attrs?.name||r.group||!key||seen.has(key)||Object.keys(r.attrs).some(k=>k!=='name'&&k!=='group'))return null;seen.add(key);edits.push({start:r.start,end:r.end,text:''});}
 if(edits.some((e,i)=>i&&e.start<edits[i-1].end)||v24SyntaxApply(body,edits).trim())return null;return[...seen].sort().join('|');
}
function v2222CountReferenceBankShells(source){
 if(!/(?:<references\b|\{\{\s*(?:Referências|Referencias|Reflist|References)\s*\|)/i.test(source))return {text:source,frames:[]};
 const view=v222Protected(source).view,frames=[],edits=[];
 for(const m of view.matchAll(/<references[ \t]*>([\s\S]*?)<\/references[ \t]*>/gi)){
  const body=source.slice(m.index+m[0].indexOf('>')+1,m.index+m[0].lastIndexOf('<')),names=v2222CountBankBody(body);if(!names)continue;const start=m.index,end=start+m[0].length,bodyStart=start+m[0].indexOf('>')+1;frames.push({kind:'html',start,end,body,names,raw:source.slice(start,end)});edits.push({start,end:bodyStart,text:''},{start:bodyStart+body.length,end,text:''});
 }
 const nodes=v24SyntaxTemplates(view).nodes.filter(n=>n.size===2);
 for(const n of nodes){const raw=source.slice(n.start,n.end),p=v2221LayoutFields(raw);if(!p||!v2221LayoutNamed(raw,['Referências','Referencias','Reflist','References'])||p.fields.filter(f=>f.key==='refs').length!==1||p.fields.some(f=>f.key!=='refs'&&(f.key!=='nível'||f.value.trim()!=='0'))||nodes.some(m=>m.start<n.start&&n.end<=m.end))continue;const f=p.fields.find(f=>f.key==='refs'),names=v2222CountBankBody(f.value);if(!names)continue;const start=n.start+2+f.part.start+f.equals+1,end=n.start+2+f.part.end;if(source.slice(start,end)!==f.value)continue;frames.push({kind:'template',start:n.start,end:n.end,body:f.value,names,raw,auxiliaryFields:p.fields.length-1});edits.push({start:n.start,end:start,text:''},{start:end,end:n.end,text:''});}
 if(frames.length>8||edits.some((e,i)=>edits.some((f,j)=>i!==j&&e.start<f.end&&f.start<e.end)))return null;return{text:v24SyntaxApply(source,edits),frames};
}
function v2222CountReferenceBankProjection(before,after,cfg={}){
 const a=v2222CountReferenceBankShells(before),b=v2222CountReferenceBankShells(after);if(!a||!b||!a.frames.length||a.frames.length!==b.frames.length)return null;const used=new Set(),events=[];
 for(const x of a.frames){const matches=b.frames.filter(y=>!used.has(y)&&x.names===y.names);if(matches.length!==1)return null;const y=matches[0];used.add(y);
  if(x.kind!==y.kind){events.push({id:'reference-bank:'+events.length,kind:'reference-bank-wrapper',count:1});for(let i=0;i<(x.auxiliaryFields||0)+(y.auxiliaryFields||0);i++)events.push({id:'reference-bank:'+events.length,kind:'reference-bank-renderer-option',count:1});}
  else if(x.kind==='template'){const p=x.raw.replace(x.body,'RWCOUNTBODY'),q=y.raw.replace(y.body,'RWCOUNTBODY'),local=p===q?{exact:true,count:0}:v2222CountTemplateFields(p,q,cfg,0,true);if(!local?.exact)return null;for(let i=0;i<local.count;i++)events.push({id:'reference-bank:'+events.length,kind:'reference-bank-template-component',count:1});}
  else if(x.raw.replace(x.body,'')!==y.raw.replace(y.body,''))return null;
 }
 return {before:a.text,after:b.text,events};
}
// Only uniquely named definitions, or a sole anonymous reference, establish
// this pairing. Citation fields are read directly from the two final endpoints.
function v2222CountReferenceBodyIdentities(body){
 let raw=typeof body==='string'?body.trim():'';const frame=v2222CountReferenceBodyFrame(raw);if(frame)raw=frame.call;const pieces=frame?null:v2222CountReferenceBodyParts(raw);if(pieces){const identities=pieces.calls.map(call=>[...new Set(v2222CountReferenceBodyIdentities(call.raw).filter(id=>!id.startsWith('NativeBibliography:')))].sort());return identities.every(ids=>ids.length)?['CitationParts:'+JSON.stringify([pieces.gaps,identities])]:[];}const p=v222Fields(raw),c=p&&v2222CitationContext(raw),r=c&&v2215CitationReader(c),link=/^\[(https?:\/\/[^\s\[\]{}<>|]+)[ \t]+([^\[\]{}<>|\r\n]+)\]$/.exec(raw);if(link)return['URL:'+link[1],'Title:'+link[2]];if(!p)return[];const out=[];
 if(c||v2221LayoutNamed(raw,['Citation']))for(const f of p.fields)if(['title','titulo','título'].includes(f.key)&&f.value.trim())out.push('Title:'+f.value.trim());
 if(r)for(const f of p.fields)for(const role of v222CitationRoles(f.key,r))if(['Title','URL','Identifier:DOI','Identifier:ISBN'].includes(role)&&f.value.trim())out.push(role+':'+f.value.trim());
 if(r&&out.length){const stable=[];for(const f of p.fields)if(f.value.trim())for(const role of v222CitationRoles(f.key,r))if(['Title','URL','Periodical','Encyclopedia','Volume','Issue','Page','Pages','Year','Date','PublisherName'].includes(role)||role.startsWith('Identifier:'))stable.push([role,f.value.trim()]);if(stable.length)out.push('NativeBibliography:'+JSON.stringify([r.module,r.oldid,stable.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))]));}
 if(/^cite (?:apod|instagram)$/i.test(p.header.trim()))for(const f of p.fields)if(f.key==='title'&&f.value.trim())out.push('Title:'+f.value.trim());
 if(v2221LayoutNamed(raw,['Citar bíblia']))for(const f of p.fields)if(f.key==='livro'&&f.value.trim())out.push('BibleBook:'+f.value.trim());
 return out;
}
function v2222CountReferenceBodyFrame(raw){
 if(typeof raw!=='string')return null;const nodes=v24SyntaxTemplates(v222Protected(raw).view).nodes.filter(n=>n.size===2&&n.start===0);if(nodes.length!==1||nodes[0].end===raw.length||!/^[ \t]*[.,;:]?$/.test(raw.slice(nodes[0].end)))return null;return{call:raw.slice(0,nodes[0].end),tail:raw.slice(nodes[0].end)};
}
// Native citations may share a footnote with unchanged bullet separators or
// opaque trailing material. Only the complete literal calls are counted here;
// every intervening byte and their order must remain exactly the same.
function v2222CountReferenceBodyParts(raw){
 if(typeof raw!=='string'||raw.length>131072||!raw.includes('{{')||templates(raw).nodes.some(n=>n.start===0&&n.end===raw.length))return null;const c=v2222CountReadContext(raw),calls=[];
 for(const node of c.nodes){if(node.size&&node.size!==2||!v2222CountOutside(c,node.start,node.end))continue;const text=raw.slice(node.start,node.end),native=v2222CitationContext(text),reader=native&&v2215CitationReader(native);if(reader)calls.push({...node,raw:text,module:reader.module,oldid:reader.oldid});}
 if(!calls.length||calls.length>32)return null;calls.sort((a,b)=>a.start-b.start);if(calls.some((n,i)=>i&&n.start<calls[i-1].end))return null;
 const gaps=[];let at=0;for(const call of calls){gaps.push(raw.slice(at,call.start));at=call.end;}gaps.push(raw.slice(at));if(calls.length===1&&gaps.every(gap=>!gap))return null;
 return{calls,gaps};
}
function v2222CountReferenceBodyPair(before,after,cfg={}){
 if(before===after)return{exact:true,count:0,events:[]};const a=v2222CountReferenceBodyFrame(before),b=v2222CountReferenceBodyFrame(after);if(a&&b&&a.tail===b.tail)return v2222CountReferenceBodyPair(a.call,b.call,cfg);const pieces=v2222CountReferenceBodyParts(before),next=v2222CountReferenceBodyParts(after);if(pieces&&next){if(pieces.calls.length!==next.calls.length||JSON.stringify(pieces.gaps)!==JSON.stringify(next.gaps))return null;const events=[];let count=0;for(let i=0;i<pieces.calls.length;i++){const a=pieces.calls[i],b=next.calls[i];if(a.module!==b.module||a.oldid!==b.oldid)return null;const oldIds=v2222CountReferenceBodyIdentities(a.raw).filter(id=>!id.startsWith('NativeBibliography:')),newIds=v2222CountReferenceBodyIdentities(b.raw);if(!oldIds.some(id=>newIds.includes(id)))return null;const local=v2222CountReferenceBodyPair(a.raw,b.raw,cfg);if(!local?.exact)return null;count+=local.count;events.push(...local.events.map((e,j)=>({...e,id:'citation-part:'+i+':'+j})));}return{exact:true,count,events,unit:'retained-final-native-citation-parts'};}const imported=v2222CitationEndpointPair(before,after);if(imported)return{...imported,exact:true};const local=v2222CountTemplateFields(before,after,cfg,0,true);if(local?.exact)return local;
 const link=/^\[(https?:\/\/[^\s\[\]{}<>|]+)[ \t]+([^\[\]{}<>|\r\n]+)\]$/.exec(before),p=v222Fields(after),c=p&&v2222CitationContext(after),r=c&&v2215CitationReader(c);if(!link||r?.module!=='Módulo:Citar web'||p.fields.length!==2)return null;
 const urls=p.fields.filter(f=>v222CitationRoles(f.key,r).includes('URL')),titles=p.fields.filter(f=>v222CitationRoles(f.key,r).includes('Title'));if(urls.length!==1||titles.length!==1||urls[0].value.trim()!==link[1]||titles[0].value.trim()!==link[2])return null;
 return{exact:true,count:3,events:[{kind:'citation-template-insertion',count:1},{kind:'citation-url-parameter',count:1},{kind:'citation-title-parameter',count:1}]};
}
function v2222CountReferenceBodiesProjection(before,after,cfg={}){
 if(!/<ref\b/i.test(before)||!/<ref\b/i.test(after))return null;
 const a=v219NativeReferenceObserver(before),b=v219NativeReferenceObserver(after);if(a.unclosed.length||b.unclosed.length)return null;
 const left=a.refs.filter(r=>r.close&&typeof r.body==='string'),right=b.refs.filter(r=>r.close&&typeof r.body==='string'),old=[],fresh=[],events=[];
 for(const x of left){const key=v2222CountReferenceKey(x);if(!key)continue;const xs=left.filter(r=>v2222CountReferenceKey(r)===key),ys=right.filter(r=>v2222CountReferenceKey(r)===key);let y;if(xs.length===1&&ys.length===1)y=ys[0];else if(!x.attrs.name){const identities=v2222CountReferenceBodyIdentities(x.body);for(const identity of identities){const matches=ys.filter(r=>v2222CountReferenceBodyIdentities(r.body).includes(identity));if(matches.length===1&&xs.filter(r=>v2222CountReferenceBodyIdentities(r.body).includes(identity)).length===1){y=matches[0];break;}}}if(!y)continue;const u=x.body.trim(),v=y.body.trim(),c=v2222CitationContext(u),d=v2222CitationContext(v),bible=[u,v].every(raw=>v2221LayoutNamed(raw,['Citar bíblia']));if(!d&&!bible&&!v2222CountReferenceBodyFrame(v)&&!v2222CountReferenceBodyParts(v))continue;
  const local=v2222CountReferenceBodyPair(u,v,cfg);if(!local?.exact)continue;const bodyLayout=text=>[text.slice(0,text.length-text.trimStart().length),text.slice(text.trimEnd().length)];let count=local.count;if(JSON.stringify(bodyLayout(x.body))!==JSON.stringify(bodyLayout(y.body)))count++;
  const i=old.length,marker='\uE000reference-body-'+i+'\uE001',start=x.end-x.body.length-(x.close.end-x.close.start),target=y.end-y.body.length-(y.close.end-y.close.start);if(before.slice(start,start+x.body.length)!==x.body||after.slice(target,target+y.body.length)!==y.body)return null;
  old.push({start,end:start+x.body.length,text:marker});fresh.push({start:target,end:target+y.body.length,text:marker});for(let j=0;j<count;j++)events.push({id:'reference-body:'+i+':'+j,kind:'citation-field-component',count:1});
 }
 if(!old.length||[old,fresh].some(rows=>rows.some((e,i)=>rows.some((f,j)=>i!==j&&e.start<f.end&&f.start<e.end))))return null;return{before:v24SyntaxApply(before,old),after:v24SyntaxApply(after,fresh),events};
}
function v2222CountDeadMarkerProjection(before,after){
 if(!/\{\{\s*Ligação inac?tiva\b/i.test(before))return null;const a=v219NativeReferenceObserver(before),b=v219NativeReferenceObserver(after);if(a.unclosed.length||b.unclosed.length||a.refs.length!==b.refs.length)return null;const edits=[],events=[];
 for(let i=0;i<a.refs.length;i++){const x=a.refs[i],y=b.refs[i];if(!x.close||!y.close||typeof x.body!=='string'||typeof y.body!=='string'||v2222CountReferenceKey(x)!==v2222CountReferenceKey(y))continue;const raw=x.body.trim(),target=y.body.trim(),top=s=>{const all=templates(s).nodes;return all.filter(n=>!all.some(p=>p.start<n.start&&n.end<=p.end));},nodes=top(raw),next=top(target);if(nodes.length<2||nodes[0].start!==0||next.length<1||next[0].start!==0||raw.slice(nodes[0].end,nodes[1].start).trim())continue;
  const call=raw.slice(0,nodes[0].end),marker=raw.slice(nodes[1].start,nodes[1].end),p=v222Fields(call),m=v2221LayoutFields(marker),q=v222Fields(target.slice(0,next[0].end)),c=p&&v2222CitationContext(call),d=q&&v2222CitationContext(target.slice(0,next[0].end)),r=c&&v2215CitationReader(c),s=d&&v2215CitationReader(d);if(!p||!m||!q||!r||!s||r.module!==s.module||r.oldid!==s.oldid||!v2221LayoutNamed(marker,['Ligação inativa','Ligação inactiva'])||m.fields.some(f=>!['data','bot'].includes(f.key))||m.fields.filter(f=>f.key==='data').length>1||m.fields.filter(f=>f.key==='bot').length>1||m.fields.some(f=>/[{}<>\r\n]/.test(f.value))||raw.slice(nodes[1].end)!==target.slice(next[0].end))continue;
  const old=p.fields.filter(f=>v222CitationStateIntent(f.key)),fresh=q.fields.filter(f=>v222CitationStateIntent(f.key)),date=m.fields.find(f=>f.key==='data')?.value.trim()||old.find(f=>f.key==='datali')?.value.trim();if(!date||old.length>1||old.length===1&&(old[0].key!=='datali'||old[0].value.trim()!==date)||fresh.length!==1||fresh[0].key!=='datali'||fresh[0].value.trim()!==date)continue;
  const changed=old.length?call:call.slice(0,-2)+'|datali='+date+'}}',base=x.end-x.body.length-(x.close.end-x.close.start),offset=x.body.length-x.body.trimStart().length,start=base+offset;if(before.slice(start,start+raw.length)!==raw)return null;edits.push({start,end:start+nodes[1].end,text:changed});events.push({id:'dead-marker:'+i+':marker',kind:'template-removal',count:1});if(!old.length)events.push({id:'dead-marker:'+i+':field',kind:'parameter-insertion',count:1});
 }return edits.length?{before:v24SyntaxApply(before,edits),after,events}:null;
}
// These comparison-only families are read from both frozen endpoints. Every
// existing occurrence keeps its ordinal, literal group and native owner.
function v2222CountReferenceHelperScope(source,helper){
 if(source.slice(helper.start,helper.end)!==helper.raw)return null;const c=v2222CountReadContext(source),state=c.stateAt(helper.start);if(!state||state.html.length||state.tables.length||state.links.length||state.external.length||c.countHard.some(r=>r.start<helper.end&&helper.start<r.end))return null;
 if(!state.templates.length)return'root';if(state.templates.length>8)return null;const nodes=v24SyntaxTemplates(c.view).nodes,path=[];
 for(let i=0;i<state.templates.length;i++){const node=nodes.find(n=>n.start===state.templates[i].start&&n.size===2&&helper.end<=n.end);if(!node)return null;const raw=source.slice(node.start,node.end),p=v2221InfoboxRead(raw);if(!p)return null;const child=i+1<state.templates.length?nodes.find(n=>n.start===state.templates[i+1].start):helper;if(!child)return null;const fields=p.fields.filter(f=>node.start+f.valueStart<=child.start&&child.end<=node.start+f.valueEnd);if(fields.length!==1||p.fields.filter(f=>f.key===fields[0].key).length!==1)return null;const field=fields[0],profile=INFOBOX_CATALOG[parsedTemplate(raw).name];
  if(i===0&&profile&&v215LiteralTemplateIdentity(raw,profile)&&!field.positional&&profileAccepts(profile,field.key)){path.push(['native-infobox-field',profile.oldid,field.key]);continue;}
  const pin=V2222_IB.inlineProgramPins?.['Predefinição:Lista simples'];if(!v2221LayoutNamed(raw,['Lista simples'])||p.fields.length!==1||field.key!=='1'||pin?.revision!==69807403||pin.sha256!=='f445a48876899604e78719b6bfc1d2d2e57cf554824c0453e58beec369565693'||!v2222InfoboxKnownProgram(raw))return null;path.push(['native-literal-list',pin.revision,'1']);
 }
 return JSON.stringify(path);
}
function v2222CountReferenceFamilyEndpoints(before,after){
 if(!/<ref\b/i.test(before)||!/<ref\b/i.test(after))return null;const a=v219NativeReferenceObserver(before),b=v219NativeReferenceObserver(after);
 if([a,b].some(o=>o.unclosed.length||o.empties.length||o.shield.unclosed.length)||!a.refs.length||a.refs.length!==b.refs.length||a.refs.length>512||[...a.helpers,...b.helpers].some(h=>!h.eligible||h.attributeScope||!['r','note'].includes(h.helperKind)||!Array.isArray(h.calls)||h.calls.some(c=>typeof c.value!=='string'||typeof c.group!=='string'))||JSON.stringify(a.helpers.map(h=>h.raw))!==JSON.stringify(b.helpers.map(h=>h.raw)))return null;
 for(let i=0;i<a.helpers.length;i++){const old=v2222CountReferenceHelperScope(before,a.helpers[i]),fresh=v2222CountReferenceHelperScope(after,b.helpers[i]);if(!old||old!==fresh)return null;}
 const contexts=[v2222CountReadContext(before),v2222CountReadContext(after)],literal=(r,side)=>r.valid&&r.renderer?.valid&&!r.container&&r.attrs?.name&&v24SyntaxLiteralIdentity(r.attrs)&&Object.keys(r.attrs).every(k=>['name','group'].includes(k))&&r.attrs.name===r.attrs.name.trim()&&!/[{}<>\[\]&\r\n"']/.test(r.attrs.name)&&v2222CountOutside(contexts[side],r.start,r.end)&&((r.self&&r.body===null)||r.close&&typeof r.body==='string'&&r.body.trim());
 const unrelated=(name,group)=>[...a.helpers,...b.helpers].every(h=>h.calls.every(call=>call.group!==group||call.value!==name));return{a,b,literal,unrelated};
}
function v2222CountReferenceFamilyBody(before,after,cfg={}){
 if(before===after)return true;const u=before.trim(),v=after.trim(),a=v2222CitationContext(u),b=v2222CitationContext(v),x=a&&v2215CitationReader(a),y=b&&v2215CitationReader(b);
 if(!x||!y||x.module!==y.module||x.oldid!==y.oldid)return false;const identities=v2222CountReferenceBodyIdentities(u),next=v2222CountReferenceBodyIdentities(v);
 return identities.some(id=>next.includes(id))&&v2222CountReferenceBodyPair(u,v,cfg)?.exact===true;
}
function v2222CountReferenceRenameProjection(before,after,cfg={}){
 const read=v2222CountReferenceFamilyEndpoints(before,after);if(!read)return null;const{a,b,literal,unrelated}=read,done=new Set(),edits=[],events=[];
 for(let i=0;i<a.refs.length;i++){const x=a.refs[i],y=b.refs[i],key=v2222CountReferenceKey(x),targetKey=v2222CountReferenceKey(y);if(!key||!targetKey||done.has(key)||x.attrs?.name===y.attrs?.name||!literal(x,0)||!literal(y,1)||v2222CountReferenceKey({...x,attrs:{...x.attrs,name:y.attrs.name}})!==targetKey)continue;
  if(!unrelated(x.attrs.name,x.group||'')||!unrelated(y.attrs.name,y.group||'')||a.refs.some(r=>v2222CountReferenceKey(r)===targetKey)||b.refs.some(r=>v2222CountReferenceKey(r)===key))continue;
  const left=a.refs.map((r,j)=>({r,j})).filter(t=>v2222CountReferenceKey(t.r)===key),right=b.refs.map((r,j)=>({r,j})).filter(t=>v2222CountReferenceKey(t.r)===targetKey),defs=left.filter(t=>t.r.body!==null),fresh=right.filter(t=>t.r.body!==null);
  if(!left.length||left.length!==right.length||defs.length!==1||fresh.length!==1||defs[0].j!==fresh[0].j||left.some((t,k)=>t.j!==right[k].j||!literal(t.r,0)||!literal(right[k].r,1)||(t.r.body===null)!==(right[k].r.body===null))||!v2222CountReferenceFamilyBody(defs[0].r.body,fresh[0].r.body,cfg))continue;
  const family=[];for(const{r,j}of left){const raw=r.raw,m=/\bname[ \t\r\n]*=[ \t\r\n]*(?:"([^"]*)"|'([^']*)'|([^\s>/]+))/i.exec(raw);if(!m||(m[1]??m[2]??m[3])!==x.attrs.name||m[3]&&/\s/.test(y.attrs.name)){family.length=0;break;}const valueStart=m.index+m[0].indexOf('=')+1,tail=raw.slice(valueStart),gap=/^[ \t\r\n]*/.exec(tail)[0],quote=m[1]!==undefined?'"':m[2]!==undefined?"'":'',value=gap+quote+y.attrs.name+quote,changed=raw.slice(0,valueStart)+value+raw.slice(m.index+m[0].length),tag=v24SyntaxTag(changed,0),attrs=tag&&v24SyntaxAttrs(tag.attrs);if(!attrs||v2222CountReferenceKey({...r,attrs})!==targetKey){family.length=0;break;}family.push({start:r.start,end:r.start+raw.length,text:changed,j});}
  if(family.length!==left.length)continue;done.add(key);for(const edit of family){edits.push({start:edit.start,end:edit.end,text:edit.text});events.push({id:'reference-rename:'+edit.j,kind:'reference-name-value',count:1});}
 }
 return edits.length?{before:v24SyntaxApply(before,edits),after,events}:null;
}
// A sole retained definition can move into its first existing reuse. Its
// complete old body is moved in this view; changed citation fields remain for
// the independent body comparison and receive no movement credit.
function v2222CountReferenceFirstDefinitionProjection(before,after,cfg={}){
 const read=v2222CountReferenceFamilyEndpoints(before,after);if(!read)return null;const{a,b,literal,unrelated}=read,done=new Set(),edits=[],events=[];
 for(let i=0;i<a.refs.length;i++){const x=a.refs[i],key=v2222CountReferenceKey(x);if(!key||done.has(key)||!literal(x,0)||!unrelated(x.attrs.name,x.group||''))continue;done.add(key);const left=a.refs.map((r,j)=>({r,j})).filter(t=>v2222CountReferenceKey(t.r)===key),right=b.refs.map((r,j)=>({r,j})).filter(t=>v2222CountReferenceKey(t.r)===key),defs=left.filter(t=>t.r.body!==null),fresh=right.filter(t=>t.r.body!==null);
  if(left.length<2||left.length!==right.length||defs.length!==1||fresh.length!==1||defs[0].j<=fresh[0].j||fresh[0].j!==left[0].j||left.some((t,k)=>t.j!==right[k].j||!literal(t.r,0)||!literal(right[k].r,1))||!v2222CountReferenceFamilyBody(defs[0].r.body,fresh[0].r.body,cfg))continue;
  const from=defs[0],to=fresh[0],oldReuse=a.refs[to.j],newReuse=b.refs[from.j];if(!oldReuse.self||oldReuse.body!==null||!newReuse.self||newReuse.body!==null||left.some(t=>![from.j,to.j].includes(t.j)&&(t.r.body===null)!==(b.refs[t.j].body===null)))continue;
  edits.push({start:oldReuse.start,end:oldReuse.end,text:to.r.raw+from.r.body+to.r.close.raw},{start:from.r.start,end:from.r.end,text:after.slice(newReuse.start,newReuse.end)});events.push({id:'reference-first-definition:'+from.j+':'+to.j,kind:'reference-definition-movement',count:1});
  const attrs=raw=>raw.replace(/^<\s*\w+/,'').replace(/\/?\s*>$/,'').trim(),name=raw=>/^<\s*(\w+)/.exec(raw)?.[1];for(const[old,now,ordinal]of [[oldReuse,to.r,to.j],[from.r,newReuse,from.j]]){if(attrs(old.raw)!==attrs(now.raw))events.push({id:'reference-first-definition:'+ordinal+':layout',kind:'reference-attribute-layout',count:1});if(name(old.raw)!==name(now.raw))events.push({id:'reference-first-definition:'+ordinal+':name',kind:'reference-tag-name',count:1});}
  if(from.r.close.raw!==to.r.close.raw)events.push({id:'reference-first-definition:'+from.j+':close',kind:'reference-closing-tag-layout',count:1});
 }
 if(edits.some((e,i)=>edits.some((f,j)=>i!==j&&e.start<f.end&&f.start<e.end)))return null;return edits.length?{before:v24SyntaxApply(before,edits),after,events}:null;
}
// Compose only the newly observed family identity/movement certificates with
// the existing independent field reader. This avoids comparing an unresolved
// author-list transition before its retained components have been isolated.
function v2222CountReferenceFamiliesProjection(before,after,cfg={}){
 let left=before,right=after;const events=[];
 for(const read of [v2222CountReferenceRenameProjection,v2222CountReferenceFirstDefinitionProjection]){const part=read(left,right,cfg);if(part){left=part.before;right=part.after;events.push(...part.events);}}
 if(!events.length)return null;for(const read of [v2222CountReferenceNamesProjection,v2222CountReferenceReuseProjection,v2222CountReferenceBodiesProjection]){const part=read(left,right,cfg);if(part){left=part.before;right=part.after;events.push(...part.events);}}
 return{before:left,after:right,events};
}
// Name insertions are paired only when an entire duplicate-definition group
// retains one exact definition and its other observed occurrences become reuses.
function v2222CountReferenceNamesProjection(before,after,cfg={}){
 if(!/<ref\b/i.test(before)||!/<ref\b/i.test(after))return null;const a=v219NativeReferenceObserver(before),b=v219NativeReferenceObserver(after);if(a.unclosed.length||b.unclosed.length||a.refs.length!==b.refs.length)return null;const edits=[],events=[],done=new Set();
 for(let i=0;i<a.refs.length;i++){const x=a.refs[i],y=b.refs[i],name=y.attrs?.name;if(!name||done.has(name)||x.attrs?.name||!x.close||typeof x.body!=='string'||/[&\"'<>]/.test(name)||!v24SyntaxLiteralIdentity(y.attrs)||Object.keys(y.attrs).some(k=>k!=='name')||Object.keys(x.attrs||{}).length)continue;
  const slots=b.refs.map((r,j)=>({r,j})).filter(t=>t.r.attrs?.name===name),defined=slots.filter(t=>t.r.close&&typeof t.r.body==='string');if(slots.length<2||defined.length!==1||a.refs.some(r=>r.attrs?.name===name)||slots.some(t=>a.refs[t.j].attrs?.name||a.refs[t.j].body!==x.body||!a.refs[t.j].close||Object.keys(a.refs[t.j].attrs||{}).length||t.r.group||Object.keys(t.r.attrs).some(k=>k!=='name')))continue;
  if(!v2222CountReferenceBodyPair(x.body.trim(),defined[0].r.body.trim(),cfg)?.exact)continue;done.add(name);
  for(const{j}of slots){const source=a.refs[j],tag=v24SyntaxTag(before,source.start);if(!tag||tag.self||tag.close||tag.name!=='ref')return null;const raw=tag.raw.replace(/>$/,' name=\"'+name+'\">');edits.push({start:tag.start,end:tag.end,text:raw});events.push({id:'reference-name:'+j,kind:'reference-name-insertion',count:1});}
 }return edits.length?{before:v24SyntaxApply(before,edits),after,events}:null;
}
function v2222CountAdjacentReferenceProjection(before,after){
 if(!/<ref\b/i.test(before)||!/<ref\b/i.test(after))return null;const a=v219NativeReferenceObserver(before),b=v219NativeReferenceObserver(after);if(a.unclosed.length||b.unclosed.length||a.refs.length<=b.refs.length)return null;const edits=[],events=[];
 for(let i=0;i<a.refs.length;i++){const first=a.refs[i],key=v2222CountReferenceKey(first);if(!key||!first.attrs.name||first.group||Object.keys(first.attrs).some(k=>k!=='name'&&k!=='group'))continue;const defs=a.refs.filter(r=>r.close&&typeof r.body==='string'&&v2222CountReferenceKey(r)===key),targets=b.refs.filter(r=>r.close&&typeof r.body==='string'&&v2222CountReferenceKey(r)===key);if(defs.length!==1||targets.length!==1||defs[0].body!==targets[0].body)continue;
  let j=i;while(j+1<a.refs.length&&a.refs[j+1].self&&a.refs[j+1].body===null&&v2222CountReferenceKey(a.refs[j+1])===key&&/^[ \t]*$/.test(before.slice(a.refs[j].end,a.refs[j+1].start)))j++;if(j===i)continue;
  edits.push({start:first.end,end:a.refs[j].end,text:''});for(let k=i+1;k<=j;k++)events.push({id:'adjacent-reference:'+a.refs[k].start,kind:'adjacent-reference-reuse-removal',count:1});i=j;
 }
 if(!edits.length)return null;const projected=v24SyntaxApply(before,edits),fresh=v219NativeReferenceObserver(projected);if(fresh.refs.length!==b.refs.length||fresh.refs.some((r,i)=>v2222CountReferenceKey(r)!==v2222CountReferenceKey(b.refs[i])||(r.body===null)!==(b.refs[i].body===null)))return null;return{before:projected,after,events};
}
function v2222CountReferenceReuseProjection(before,after,cfg={}){
 if(!/<ref\b/i.test(before)||!/<ref\b/i.test(after))return null;const a=v219NativeReferenceObserver(before),b=v219NativeReferenceObserver(after);if(a.unclosed.length||b.unclosed.length||a.refs.length!==b.refs.length)return null;const edits=[],events=[];
 for(let i=0;i<a.refs.length;i++){const x=a.refs[i],y=b.refs[i],key=v2222CountReferenceKey(x);if(!x.close||typeof x.body!=='string'||!x.attrs?.name||y.body!==null||!y.self||!key||key!==v2222CountReferenceKey(y))continue;
  const kept=b.refs.map((r,j)=>({r,j})).filter(({r})=>r.close&&typeof r.body==='string'&&v2222CountReferenceKey(r)===key);if(kept.length!==1)continue;const target=kept[0].r,original=a.refs[kept[0].j];if(!original?.close||original.body!==x.body||v2222CountReferenceKey(original)!==key)continue;
  if(target.body!==original.body){const u=original.body.trim(),v=target.body.trim();if(!v2222CitationContext(u)||!v2222CitationContext(v)||!v2222CountTemplateFields(u,v,cfg,0,true)?.exact)continue;}
  edits.push({start:x.start,end:x.end,text:after.slice(y.start,y.end)});events.push({id:'reference-reuse:'+i,kind:'reference-definition-to-reuse',count:1});const open=raw=>raw.replace(/^<\s*\w+/,'').replace(/\/?\s*>$/,'').trim();if(open(x.raw)!==open(y.raw))events.push({id:'reference-reuse:'+i+':attributes',kind:'reference-attribute-layout',count:1});const tag=raw=>/^<\s*(\w+)/.exec(raw)?.[1];if(tag(x.raw)!==tag(y.raw))events.push({id:'reference-reuse:'+i+':tag',kind:'reference-tag-name',count:1});
 }return edits.length?{before:v24SyntaxApply(before,edits),after,events}:null;
}
function v2222CountISBNProjection(before,after){
 if(!/\bISBN[ \t]+/i.test(before)||!/(?:\{\{\s*ISBN\s*\|)/i.test(after))return null;
 const left=[...v222Protected(before).view.matchAll(/\bISBN[ \t]+([0-9Xx][0-9Xx -]*[0-9Xx])/g)].map(m=>({start:m.index,end:m.index+m[0].length,code:m[1]})).filter(m=>v2221ISBNValid(m.code)),right=[];
 for(const n of v24SyntaxTemplates(v222Protected(after).view).nodes){if(n.size!==2)continue;const raw=after.slice(n.start,n.end),p=v2221LayoutFields(raw);if(p&&v2221LayoutNamed(raw,['ISBN'])&&p.fields.length===1&&p.fields[0].key==='1'&&v2221ISBNValid(p.fields[0].value.trim()))right.push({...n,code:p.fields[0].value.trim()});}
 if(left.length>32||right.length>32)return null;const old=[],fresh=[],events=[];
 for(const x of left){const xs=left.filter(v=>v.code===x.code),ys=right.filter(v=>v.code===x.code);if(xs.length!==1||ys.length!==1)continue;const y=ys[0],marker='\uE000isbn-'+old.length+'\uE001';old.push({start:x.start,end:x.end,text:marker});fresh.push({start:y.start,end:y.end,text:marker});events.push({id:'isbn-wrapper:'+events.length,kind:'isbn-helper-wrapper',count:1});}
 return old.length?{before:v24SyntaxApply(before,old),after:v24SyntaxApply(after,fresh),events}:null;
}
