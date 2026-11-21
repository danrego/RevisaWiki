// Reference operations own their spans. Unproved neighbors remain unchanged.
const V2221_REFERENCE_STAGES=Object.freeze(['owner-closure','syntax','attributes','bank-alias','isolation','groups','definitions','orphans','punctuation','collectors','numeric-names','names','spacing']);
const V2221_REFERENCE_GROUPS=Object.freeze(['nota','lower-alpha','Nota','nt']);
const V2221_REFERENCE_SPECIAL=Object.freeze(['upper-alpha','upper-roman','lower-roman','lower-greek']);
function v2221ReferenceScope(source,cfg={}) {
 return typeof source==='string'&&v222ReferenceScope(source,cfg)&&cfg.references!==false;
}
function v2221ReferenceIdentity(value) {
 return decodedReferenceName(String(value??'')).normalize('NFC');
}
function v2221ReferenceKey(group,name) {
 return JSON.stringify([v2221ReferenceIdentity(group),v2221ReferenceIdentity(name)]);
}
function v2221ReferenceOutside(source,start,end,view=null) {
 const shield=v24SyntaxProtected(source),actual=view||shield.view;
 if(shield.ranges.some(r=>r.start<end&&start<r.end))return false;
 const c=v24SyntaxContext(actual,start);
 return !['templates','tables','links','external','html'].some(k=>c[k]?.length);
}
function v2221ReferenceAttrs(raw) {
 const out=[],re=/\s+([\p{L}][\p{L}\d-]*)\s*(==|=|:)\s*(?:"([^"<>]*)"|'([^'<>]*)'|“([^”<>]*)”|‘([^’<>]*)’|([^\s"'=<>`]+))/gu;let m,last=0;
 while((m=re.exec(raw))){
  if(raw.slice(last,m.index).trim())return null;
  const key=({nome:'name',nom:'name',nombre:'name',grupo:'group',groupe:'group',gruppo:'group',gruppe:'group'})[m[1].toLowerCase()]||m[1].toLowerCase(),value=m[3]??m[4]??m[5]??m[6]??m[7];
  if(!['name','group'].includes(key)||!value||value!==value.trim()||/[{}\[\]<>|&"'\r\n]/.test(value))return null;
  out.push({key,value,raw:m[0]});last=re.lastIndex;
 }
 if(raw.slice(last).trim())return null;
 const values=new Map();for(const f of out){if(values.has(f.key)&&values.get(f.key)!==f.value)return null;values.set(f.key,f.value);}
 return {fields:out,values};
}
function v2221ReferenceAttributeEdits(source) {
 const view=v24SyntaxProtected(source).view,proposals=[];
 for(let at=view.indexOf('<');at>=0;){
  const tag=v24SyntaxTag(view,at);at=view.indexOf('<',tag?tag.end:at+1);
  if(!tag||tag.name!=='ref'||tag.close||tag.typo||!v2221ReferenceOutside(source,tag.start,tag.end,view))continue;
  const parsed=v2221ReferenceAttrs(tag.attrs);if(!parsed)continue;
  const fields=[...parsed.values],attrs=fields.map(([key,value])=>' '+key+'="'+value+'"').join('');
  const canonical='<ref'+attrs+(tag.self?' />':'>');
  const already=v24SyntaxAttrs(tag.attrs),changedMeaning=!already||Object.keys(already).some(k=>!['name','group'].includes(k));
  // Ordinary quote/spacing choices are not errors. Repair finite bad keys,
  // operators, curly delimiters and identical repeated attributes only.
  if(!changedMeaning&&parsed.fields.length===fields.length&&!parsed.fields.some(f=>/[“”‘’]|\s(?:name|group)\s*(?:==|:)/u.test(f.raw)||!/^\s+(?:name|group)\s*=/.test(f.raw)))continue;
  if(canonical===tag.raw)continue;
  proposals.push({start:tag.start,end:tag.end,text:canonical,count:Math.max(1,parsed.fields.length-fields.length+fields.filter(([k])=>!already||!Object.hasOwn(already,k)).length),kind:'v2221-ref-attributes',proof:{name:parsed.values.get('name')||'',group:parsed.values.get('group')||'',self:tag.self,fields}});
 }
 const trial=v24SyntaxApply(source,proposals),observed=v219NativeReferenceObserver(trial),definitions=new Map();
 for(const r of observed.refs){if(!r.attrs?.name||r.body===null)continue;const key=v2221ReferenceKey(r.group,r.attrs.name);if(!definitions.has(key))definitions.set(key,new Set());definitions.get(key).add(r.body);}
 for(const h of observed.helpers||[])for(const c of h.calls||[]){if(!c.value||c.body===null)continue;const key=v2221ReferenceKey(c.group,c.value);if(!definitions.has(key))definitions.set(key,new Set());definitions.get(key).add(c.body);}
 return proposals.filter(e=>{const k=v2221ReferenceKey(e.proof.group,e.proof.name);return !e.proof.name||definitions.get(k)?.size===1;});
}
function v2221ReferenceBank(value,group='') {
 if(!value.trim())return true;
 const observed=v219NativeReferenceObserver(value);if(observed.unclosed.length||observed.empties.length||observed.helpers.length)return false;
 let end=0;for(const r of observed.refs){
  const gap=value.slice(end,r.start).replace(/<!--[\s\S]*?-->/g,'');
  if(gap.trim()||!r.valid||!r.attrs?.name||r.body===null||!v24SyntaxLiteralIdentity(r.attrs)||r.group&&r.group!==group)return false;
  end=r.end;
 }
 return observed.refs.length>0&&!value.slice(end).replace(/<!--[\s\S]*?-->/g,'').trim();
}
function v2221ReferenceDescriptor(raw) {
 const p=parsedTemplate(raw),head=v215TemplateTitle(p.parts[0]),key=v24SyntaxName(head),slots=v2216LayoutSlots(raw);
 if(/^#tag\s*:\s*references$/i.test(head)){
  const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
  const bank=parts[1]?.text||'',fields=parts.slice(2).map(p=>/^\s*(group|responsive)\s*=([\s\S]*)$/.exec(p.text));
  if(fields.some(f=>!f)||new Set(fields.map(f=>f[1])).size!==fields.length)return {recognized:true,safe:false,raw,head};
  const group=fields.find(f=>f[1]==='group')?.[2].trim()||'',responsive=fields.find(f=>f[1]==='responsive')?.[2].trim();
  if(/[{}<>\[\]|&\r\n]/.test(group)||responsive!==undefined&&!['0','1'].includes(responsive)||!v2221ReferenceBank(bank,group))return {recognized:true,safe:false,raw,head};
  return {recognized:true,safe:true,raw,head,nativeFunction:true,group,groups:[group],note:!!group,default:!group,bank,noteBank:!!group&&!!bank,presentationFields:responsive===undefined?0:1};
 }
 const note=key==='notas',combined=key==='notas e referências',notelist=['notelist','listanota','notefoot','rodapénota','rodapenota'].includes(key),reflist=key==='reflist',
  refs=!!v219NativeReferenceCollectorAlias(head)||['referências','referencias','referência','refereencias','referncias','referênicas','refrências','referênçias','referéncias'].includes(key);
 if(!note&&!combined&&!notelist&&!reflist&&!refs||!v219OriginalTemplateHeaderAllowed(p.parts[0]))return null;
 const base={recognized:true,head,key,note,combined,notelist,reflist,refs,raw};if(!slots)return {...base,safe:false};
 const fields=[...slots],groupKeys=reflist||notelist?['group','grupo']:['grupo'],groupFields=fields.filter(([k])=>groupKeys.includes(k));
 if(groupFields.length>1)return {...base,safe:false};
 const group=groupFields.length?groupFields[0][1].trim():notelist?'lower-alpha':note?'nota':'';
 if(/[{}<>\[\]|&\r\n]/.test(group))return {...base,safe:false};
 const presentation=new Set(['col','colwidth','largcol','larguracol','col_notas','notas_col','col_ref','ref_col']);
 if(reflist||notelist)presentation.add('1');
 const allowed=new Set([...presentation,...groupKeys,'refs',...(note?['notas']:[])]);
 if(fields.some(([k,v])=>!allowed.has(k)||presentation.has(k)&&v.trim()&&!/^(?:[1-9]\d?(?:\.\d+)?(?:em|px)?|auto)$/.test(v.trim())))return {...base,safe:false};
 const banks=fields.filter(([k])=>['refs','notas'].includes(k));
 if(banks.length>1||banks.length&&!v2221ReferenceBank(banks[0][1],group))return {...base,safe:false};
 const bank=banks[0]?.[1]||'',groups=combined?['nota','lower-alpha',groupFields.length?group:'Nota','nt','']:note?[group,'lower-alpha']:[group];
 return {...base,safe:true,group,groupExplicit:groupFields.length>0,groups:[...new Set(groups)],bank,bankKey:banks[0]?.[0]||'',
  presentationFields:fields.filter(([k])=>presentation.has(k)).length,
  noteBank:!!bank&&(note||notelist||!!group),default:combined||!note&&!notelist&&!group};
}
function v2221ReferenceNativeRow(source,tag) {
 const attrs=v24SyntaxAttrs(tag.attrs);if(!attrs||Object.keys(attrs).some(k=>!['group','responsive'].includes(k))||
  attrs.responsive!==undefined&&!['0','1'].includes(attrs.responsive)||/[{}<>\[\]|&\r\n]/.test(attrs.group||''))return null;
 let end=tag.end,bank='';if(!tag.self){const re=/<\s*\/\s*references\s*>/gi;re.lastIndex=end;const close=re.exec(source);if(!close)return null;bank=source.slice(end,close.index);end=re.lastIndex;if(!v2221ReferenceBank(bank,attrs.group||''))return null;}
 const group=attrs.group||'';return {start:tag.start,end,raw:source.slice(tag.start,end),native:true,descriptor:{safe:true,native:true,group,groups:[group],note:!!group,default:!group,bank,noteBank:!!group&&!!bank,presentationFields:attrs.responsive===undefined?0:1}};
}
function v2221ReferenceInnerCollector(raw) {
 const text=raw.trim();if(!text)return null;
 if(text.startsWith('{{')){const nodes=v24SyntaxTemplates(text);if(nodes.unclosed.length||!nodes.nodes.some(n=>n.start===0&&n.end===text.length&&n.size===2))return null;const d=v2221ReferenceDescriptor(text);return d?.safe?d:null;}
 const tag=v24SyntaxTag(text,0);if(!tag||tag.name!=='references'||tag.close||tag.typo)return null;
 const row=v2221ReferenceNativeRow(text,tag);return row?.end===text.length?row.descriptor:null;
}
function v2221ReferenceRows(source) {
 const view=v24SyntaxProtected(source).view,rows=[],nodes=v24SyntaxTemplates(view).nodes;
 for(const node of nodes){
  if(node.size!==2||!v2221ReferenceOutside(source,node.start,node.end,view))continue;
  const raw=source.slice(node.start,node.end),d=v2221ReferenceDescriptor(raw);if(d){rows.push({...node,raw,head:d.head,descriptor:d});continue;}
  const head=v215TemplateTitle(parsedTemplate(raw).parts[0]),slots=v2216LayoutSlots(raw);
  if(v215SameTemplateTitle(head,'Colunas-lista')&&slots&&slots.has('1')&&/^[1-9]$/.test(slots.get('1').trim())&&slots.has('2')&&[...slots.keys()].every(k=>k==='1'||k==='2')){
   const inner=v2221ReferenceInnerCollector(slots.get('2'));if(inner)rows.push({...node,raw,head:inner.head,descriptor:inner,wrapper:true});
  }
 }
 for(let at=view.indexOf('<');at>=0;){
  const tag=v24SyntaxTag(view,at);at=view.indexOf('<',tag?tag.end:at+1);if(!tag||tag.close||tag.typo)continue;
  if(tag.name==='references'&&v2221ReferenceOutside(source,tag.start,tag.end,view)){const r=v2221ReferenceNativeRow(source,tag);if(r)rows.push(r);}
  if(tag.name==='div'&&!tag.self&&v2221ReferenceOutside(source,tag.start,tag.end,view)){
   const a=v24SyntaxAttrs(tag.attrs);if(!a||Object.keys(a).length!==1||!(a.class==='references'||typeof a.style==='string'&&/^\s*column-count\s*:\s*[1-9]\s*;?\s*$/i.test(a.style)))continue;
   const closer=/<\/div\s*>/gi;closer.lastIndex=tag.end;const close=closer.exec(source);if(!close)continue;
   const d=v2221ReferenceInnerCollector(source.slice(tag.end,close.index));if(!d)continue;
   rows.push({start:tag.start,end:closer.lastIndex,raw:source.slice(tag.start,closer.lastIndex),head:d.head,descriptor:d,wrapper:true});
  }
 }
 return rows.sort((a,b)=>a.start-b.start||b.end-a.end).filter((r,i,a)=>!a.some((p,j)=>j<i&&p.start<=r.start&&p.end>=r.end));
}
function v2221ReferenceBankAliasEdits(source) {
 const rows=v2221ReferenceRows(source),observed=v219NativeReferenceObserver(source),edits=[];
 for(const row of rows){const d=row.descriptor;if(!d?.recognized||d.safe||row.wrapper||!v215SameTemplateTitle(d.head,'Referências'))continue;
  const slots=v2216LayoutSlots(row.raw);if(!slots||slots.size!==1||!slots.has('referências'))continue;
  const bank=slots.get('referências');if(!bank.trim()||!v2221ReferenceBank(bank))continue;
  const bankRefs=v219NativeReferenceObserver(bank).refs,names=new Set();let valid=true;
  for(const r of bankRefs){const key=v2221ReferenceKey(r.group,r.attrs.name);if(names.has(key)||r.group||!r.body?.trim()){valid=false;break;}names.add(key);
   const consumed=observed.refs.some(c=>(c.start<row.start||c.start>=row.end)&&c.attrs?.name&&v2221ReferenceKey(c.group,c.attrs.name)===key)||observed.helpers.some(h=>h.eligible&&(h.calls||[]).some(c=>c.value&&v2221ReferenceKey(c.group,c.value)===key));if(!consumed){valid=false;break;}}
  if(!valid)continue;
  const parts=v24SyntaxParts(row.raw.slice(2,-2)),part=parts?.slice(1).find(p=>/^\s*referências\s*=/.test(p.text));if(!part)continue;
  const start=row.start+2+part.start+part.text.indexOf('referências'),proposal={start,end:start+'referências'.length,text:'refs',count:1,kind:'v2221-native-reference-bank-key',proof:{collector:d.head,bankPreserved:bank,identities:[...names]}};
  const candidate=v24SyntaxApply(source,[proposal]),candidateRows=v2221ReferenceRows(candidate),native=v219NativeReferenceObserver(candidate),defs=new Map();
  if(!v2221ReferenceClosed(candidate,candidateRows))continue;
  for(const r of native.refs)if(r.attrs?.name&&r.body!==null){const key=v2221ReferenceKey(r.group,r.attrs.name);if(!defs.has(key))defs.set(key,new Set());defs.get(key).add(r.body);}
  for(const h of native.helpers)for(const c of h.calls||[])if(c.value&&c.body!==null){const key=v2221ReferenceKey(c.group,c.value);if(!defs.has(key))defs.set(key,new Set());defs.get(key).add(c.body);}
  if([...names].some(key=>defs.get(key)?.size!==1))continue;edits.push(proposal);
 }
 return v222ReferenceEdits(source,edits);
}
function v2221ReferenceHeadingChain(source,start) {
 const chain=[];let end=start;
 while(true){const m=/(?:^|\n)(={2,6})[ \t]*(Referência|Referências|Referencias|References|Reference|Notas|Notes|Notas e referências|Notes and references|References and notes|Footnotes|Notas de rodapé|Referencias y notas|Notas y referencias|Citações|Citations)[ \t]*\1[ \t]*\r?\n[ \t\r\n]*$/i.exec(source.slice(0,end));if(!m)break;
  const at=m.index+(m[0][0]==='\n'?1:0);chain.unshift({start:at,end,name:m[2],level:m[1].length});end=at;}
 return chain;
}
function v2221ReferenceHeadingTargeted(source,chain) {
 return chain.some(h=>{const id=h.name.replace(/_/g,' ').normalize('NFC').toLowerCase();return [...source.matchAll(/\[\[\s*#([^|\]]+)/g)].some(m=>m[1].replace(/_/g,' ').trim().normalize('NFC').toLowerCase()===id);});
}
function v2221ReferenceIsolationEdits(source) {
 const positions=new Set();for(const r of v2221ReferenceRows(source)){
  const a=source.lastIndexOf('\n',r.start-1)+1,z=source.indexOf('\n',r.end),end=z<0?source.length:z;
  if(source.slice(a,r.start).trim())positions.add(r.start);if(source.slice(r.end,end).trim())positions.add(r.end);
 }
 return [...positions].map(at=>({start:at,end:at,text:'\n\n',count:1,kind:'v2221-reference-isolation'}));
}
function v2221ReferenceClosed(source,rows,group=null) {
 if(v219NativeReferenceObserver(source).helpers.some(h=>h.helperKind==='r'&&!h.eligible))return false;
 const emptyNativeFunctions=rows.filter(r=>r.descriptor?.safe&&r.descriptor.nativeFunction&&!r.descriptor.bank);
 const view=emptyNativeFunctions.length?v24SyntaxMaskRanges(source,emptyNativeFunctions):source;
 return v222ReferenceKnownProducers(view,rows,group);
}
function v2221ReferenceOpaqueConsumers(source,rows,observed=null) {
 const native=observed||v219NativeReferenceObserver(source);
 return rendererRanges(native.view).filter(range=>!rows.some(r=>r.descriptor?.safe&&r.start<=range.start&&range.end<=r.end));
}
function v2221ReferenceGroupEdits(source) {
 const rows=v2221ReferenceRows(source),observed=v219NativeReferenceObserver(source),groups=new Set(observed.refs.map(r=>r.group||'').filter(Boolean));
 for(const h of observed.helpers||[])for(const c of h.calls||[])if(c.group)groups.add(c.group);
 if(groups.size!==1||v2221ReferenceOpaqueConsumers(source,rows,observed).length||rows.some(r=>r.descriptor?.recognized&&!r.descriptor.safe))return [];
 const group=[...groups][0];if(V2221_REFERENCE_GROUPS.includes(group)||V2221_REFERENCE_SPECIAL.includes(group)||!group||/[&"'{}<>\[\]|\r\n]/.test(group)||!v2221ReferenceClosed(source,rows,group))return [];
 const matched=rows.filter(r=>r.descriptor?.safe&&r.descriptor.group===group);
 if(matched.length!==1||matched[0].descriptor.bank||rows.some(r=>r.descriptor?.groups?.some(g=>g&&g!==group)))return [];
 const edits=[];
 for(const r of observed.refs){if(r.group!==group)continue;if(!r.valid||r.container||!r.attrs||!v24SyntaxLiteralIdentity(r.attrs))return [];
  const tag=v24SyntaxTag(source,r.start);if(!tag||r.attrs.group!==group)return [];
  const text=tag.raw.replace(/(\bgroup\s*=\s*)(?:"[^"]*"|'[^']*'|[^\s>]+)/i,'$1"nota"');
  if(text===tag.raw)return [];edits.push({start:tag.start,end:tag.end,text,count:1,kind:'v2221-single-note-group'});
 }
 for(const h of observed.helpers||[]){
  if(!h.eligible||h.helperKind!=='note')return [];
  if(!(h.calls||[]).some(c=>c.group===group))continue;
  const parts=v24SyntaxParts(h.raw.slice(2,-2));if(!parts)return [];let found=0;
  for(const p of parts.slice(1)){const m=/^\s*(group|grupo)\s*=([\s\S]*)$/.exec(p.text);if(!m||m[2].trim()!==group)continue;const at=h.start+2+p.start+p.text.indexOf('=')+1;
   edits.push({start:at,end:h.start+2+p.end,text:m[2].replace(group,'nota'),count:1,kind:'v2221-helper-note-group'});found++;}
  if(found!==1)return [];
 }
 const row=matched[0];edits.push({start:row.start,end:row.end,text:'{{Notas}}',count:1,kind:'v2221-single-note-group-collector'});return edits;
}
function v2221ReferenceCustomOwner(source,start,descriptor=null) {
 const view=v24SyntaxProtected(source).view,owner=v2217ReferenceManualSection(source,start,view);
 if(owner?.syntax==='html')return true;
 if(['native-provider','prior-unheaded-renderer'].includes(owner?.syntax))return !descriptor||descriptor.native||descriptor.nativeFunction||descriptor.reflist||descriptor.notelist||!descriptor.note&&!descriptor.combined&&!v219NativeReferenceCollectorAlias(descriptor.head||'');
 // A retained note section owns its note renderer, not a following native
 // reference section. Keep that section's own generated heading on replay.
 if(owner?.syntax==='wiki'&&descriptor?.safe&&descriptor.refs&&!descriptor.reflist&&
  v2221ReferenceRows(source).some(r=>r.start>=owner.end&&r.end<=start&&
   (r.raw==='{{Notas|nível=0}}'||r.descriptor?.safe&&(r.descriptor.note||r.descriptor.notelist||r.descriptor.combined||!!r.descriptor.group))))return false;
 if(owner?.syntax==='unknown-provider'&&v215SameTemplateTitle(owner.provider||'','Correlatos')&&!v222ReferenceHeadingFreeCorrelatos(source.slice(owner.start,owner.end)))return true;
 const candidates=[...view.slice(0,start).matchAll(/(?:^|\n)(={1,6})[ \t]*([^\r\n]+?)[ \t]*\1[ \t]*\r?\n/g)];
 const m=candidates.at(-1);if(!m)return false;const name=v24SyntaxName(m[2]),end=m.index+m[0].length;
 return !v2221ReferenceHeadingChain(source,start).length&&(!source.slice(end,start).trim()||['referências','referência','referencias','references','reference','notas','notes','fontes','sources','fuentes','quellen','出典','المراجع','источники','obras consultadas','fontes consultadas','fontes e notas','notas explicativas','referências bibliográficas','bibliografia'].includes(name));
}
function v2221ReferenceLegacyManualOwner(source,start) {
 const owner=v2217ReferenceManualSection(source,start,protectedView(source));
 if(owner?.syntax!=='unknown-provider')return owner;
 // An unknown expansion does not prove an existing section heading. Retain
 // an actual custom heading if present, rather than guessing its contents.
 if(!v2221ReferenceCustomOwner(source,start))return null;
 const view=v24SyntaxProtected(source).view,m=[...view.slice(0,start).matchAll(/(?:^|\n)(={2,6})[ \t]*([^\r\n]+?)[ \t]*\1[ \t]*\r?\n/g)].at(-1);
 return m?{start:m.index+(m[0][0]==='\n'?1:0),end:m.index+m[0].length,name:v24SyntaxName(m[2]),level:m[1].length,syntax:'wiki'}:null;
}
function v2221ReferenceCollectorText(d,levelZero=false) {
 if(!d?.safe||d.noteBank)return null;
 if(d.combined&&d.groupExplicit&&!['Nota'].includes(d.group))return null;
 if(d.note&&(!['nota','lower-alpha'].includes(d.group)||d.groupExplicit&&d.group===''))return null;
 if(d.notelist&&!['nota','lower-alpha'].includes(d.group))return null;
 if(d.group&&!['nota','lower-alpha'].includes(d.group))return null;
 const name=d.combined?'Notas e referências':d.note||d.notelist||!!d.group?'Notas':'Referências';
 return '{{'+name+(d.bank?'|refs='+d.bank:'')+(levelZero&&!d.combined?'|nível=0':'')+'}}';
}
function v2221ReferenceCombinable(d) {
 return !!d?.safe&&!d.noteBank&&d.groups.every(g=>g===''||V2221_REFERENCE_GROUPS.includes(g))&&
  !(d.note&&d.group==='')&&!(d.combined&&d.groupExplicit&&d.group!=='Nota');
}
function v2221ReferenceCollectorOperationCount(row,target) {
 if(target==='')return 1;
 const d=row.descriptor,raw=d.raw??(row.wrapper?null:row.raw);
 if(raw===target)return 0;
 if(raw?.startsWith('{{')&&target.startsWith('{{')){
  const before=v2216LayoutSlots(raw),after=v2216LayoutSlots(target);
  if(before&&after){const oldHead=parsedTemplate(raw).parts[0].trim(),newHead=parsedTemplate(target).parts[0].trim();let count=oldHead===newHead?0:1;
   for(const key of new Set([...before.keys(),...after.keys()]))if(before.has(key)!==after.has(key)||before.get(key)!==after.get(key))count++;
   return count||1;
  }
 }
 return 1+(d.presentationFields||0);
}
function v2221ReferenceCollectorEdits(source,cfg={}) {
 if(cfg.headings===false||cfg.automaticReferenceCollectorHeadings===false)return [];
 const rows=v2221ReferenceRows(source),observed=v219NativeReferenceObserver(source),edits=[],used=new Set();
 const opaqueConsumers=v2221ReferenceOpaqueConsumers(source,rows,observed);
 const noteCalls=observed.refs.some(r=>V2221_REFERENCE_GROUPS.includes(r.group))||(observed.helpers||[]).some(h=>V2221_REFERENCE_GROUPS.includes(h.nativeGroup)||(h.calls||[]).some(c=>V2221_REFERENCE_GROUPS.includes(c.group)));
 const commonCalls=observed.refs.some(r=>r.valid&&!r.group)||(observed.helpers||[]).some(h=>h.helperKind==='generated-note'&&!h.nativeGroup||h.helperKind==='note'&&h.eligible&&(h.calls||[]).some(c=>!c.group&&c.body!==null));
 for(let i=0;i<rows.length;i++){
  const first=rows[i];if(used.has(first))continue;const run=[first];let j=i+1;
  while(j<rows.length){const next=rows[j],chain=v2221ReferenceHeadingChain(source,next.start),at=chain[0]?.start??next.start,gap=source.slice(run.at(-1).end,at);
   if(gap.replace(/<!--[\s\S]*?-->/g,'').trim())break;run.push(next);j++;}
  const chain=v2221ReferenceHeadingChain(source,first.start),start=chain[0]?.start??first.start;
  const allowed=run.every(r=>{const c=v2221ReferenceHeadingChain(source,r.start);return v2221ReferenceCombinable(r.descriptor)&&!v2221ReferenceHeadingTargeted(source,c)&&!(c.length&&(c[0].level!==2||c.some((h,i)=>i&&h.level<=c[i-1].level)));}),hasDefault=run.some(r=>r.descriptor?.default),hasNotes=run.some(r=>r.descriptor?.note||r.descriptor?.notelist||r.descriptor?.combined||!!r.descriptor?.group),banks=run.filter(r=>r.descriptor?.bank);
  const laterProducer=observed.refs.some(r=>!r.container&&r.start>=run.at(-1).end)||observed.helpers.some(h=>h.start>=run.at(-1).end);
  if(cfg.unifiedNotesReferences!==false&&allowed&&run.length>1&&hasDefault&&!laterProducer&&!v2221ReferenceCustomOwner(source,first.start,first.descriptor)&&banks.length<=1){
   const closed=v2221ReferenceClosed(source,rows),name=hasNotes&&(noteCalls||!closed)||noteCalls&&commonCalls&&closed&&!opaqueConsumers.length&&!rows.some(x=>x.descriptor?.recognized&&!x.descriptor.safe)?'Notas e referências':'Referências',bank=banks[0]?.descriptor.bank||'',comments=(source.slice(start,run.at(-1).end).match(/<!--[\s\S]*?-->/g)||[]).join('\n'),text=(comments?comments+'\n':'')+'{{'+name+(bank?'|refs='+bank:'')+'}}';
   const sourceGroups=[...new Set(run.flatMap(r=>r.descriptor.groups))].sort(),targetGroups=(name==='Notas e referências'?['','Nota','lower-alpha','nota','nt']:['']).sort(),sameConsumerCoverage=JSON.stringify(sourceGroups)===JSON.stringify(targetGroups);
   if(closed||!bank&&sameConsumerCoverage){
   const headings=run.reduce((n,r)=>n+v2221ReferenceHeadingChain(source,r.start).filter(h=>h.start>=start).length,0),target='{{'+name+(bank?'|refs='+bank:'')+'}}',count=run.length-1+v2221ReferenceCollectorOperationCount(first,target)+headings+run.filter(r=>r.wrapper).length;
   if(source.slice(start,run.at(-1).end)!==text)edits.push({start,end:run.at(-1).end,text,count,kind:'v2221-reference-collector-convergence',proof:{groups:run.map(r=>r.descriptor.groups),bankPreserved:bank,closedProducerGraph:closed,sameConsumerCoverage,sourceGroups,targetGroups}});
   run.forEach(r=>used.add(r));continue;
   }
  }
  for(const r of run){used.add(r);const d=r.descriptor,c=v2221ReferenceHeadingChain(source,r.start),preserveOutline=c.length&&(c[0].level!==2||c.some((h,i)=>i&&h.level<=c[i-1].level)),targeted=v2221ReferenceHeadingTargeted(source,c)||!!preserveOutline,custom=targeted||!c.length&&v2221ReferenceCustomOwner(source,r.start,d);
   const otherOpaqueCollector=rows.some(x=>x!==r&&x.descriptor?.recognized&&!x.descriptor.safe)||opaqueConsumers.some(x=>x.start<r.start||x.end>r.end);
   const nativeHeaded=d.note&&!d.native&&!d.nativeFunction&&!d.notelist||d.refs&&!d.reflist&&!!v219NativeReferenceCollectorAlias(d.head||''),retainNativeHeading=custom&&nativeHeaded&&(!c.length||c[0].level===6);
   let target=v2221ReferenceCollectorText(d,custom&&!retainNativeHeading);if(target===null)continue;
   let from=c.length&&!targeted?c[0].start:r.start;
   if(cfg.unifiedNotesReferences!==false&&d.default&&!d.combined&&!custom&&noteCalls&&commonCalls&&!otherOpaqueCollector&&!rows.some(x=>x!==r&&x.descriptor?.groups?.some(g=>V2221_REFERENCE_GROUPS.includes(g)))&&v2221ReferenceClosed(source,rows)&&!laterProducer)target='{{Notas e referências'+(d.bank?'|refs='+d.bank:'')+'}}';
   if(cfg.unifiedNotesReferences!==false&&(d.note||d.notelist)&&!d.noteBank&&!custom&&noteCalls&&commonCalls&&!otherOpaqueCollector&&v2221ReferenceCombinable(d)&&!rows.some(x=>x!==r&&x.descriptor?.default)&&v2221ReferenceClosed(source,rows)&&!laterProducer)target='{{Notas e referências}}';
   if(cfg.unifiedNotesReferences!==false&&(d.note||d.notelist)&&!noteCalls&&!d.bank&&v2221ReferenceClosed(source,rows)&&!laterProducer){
    const hasCommon=commonCalls;
    if(!hasCommon||!otherOpaqueCollector)target=hasCommon&&!rows.some(x=>x!==r&&x.descriptor?.default)?'{{Referências'+(custom?'|nível=0':'')+'}}':'';
   }
   if(source.slice(from,r.end)!==target)edits.push({start:from,end:r.end,text:target,count:v2221ReferenceCollectorOperationCount(r,target)+(from<r.start?c.length:0)+(r.wrapper?1:0),kind:'v2221-reference-collector',proof:{original:r.raw,groups:d.groups,bankPreserved:d.bank,retainedCustomHeading:custom}});
  }
 }
 return edits;
}
function v2221ReferenceSpacingEdits(source) {
 const rows=v2221ReferenceRows(source),edits=[],nl=source.includes('\r\n')?'\r\n':'\n';
 for(const r of rows){if(!r.descriptor?.safe||!r.raw.startsWith('{{'))continue;
  const before=/[ \t\r\n]*$/.exec(source.slice(0,r.start))[0],after=/^[ \t\r\n]*/.exec(source.slice(r.end))[0],start=r.start-before.length,end=r.end+after.length;
  const text=(start?nl+nl:'')+r.raw+(end<source.length?nl+nl:after?nl:'');
  if(source.slice(start,end)!==text)edits.push({start,end,text,count:1,kind:'v2221-reference-spacing'});
 }
 return v222ReferenceEdits(source,edits);
}
function v2221ReferenceBodyKey(body,cfg={}) {
 const value=body.trim();if(!value)return null;
 if(!value.includes('{{'))return !/[<>\r\n]/.test(value)?JSON.stringify(['literal',value]):null;
 const context=v2212CitationContext(value),reader=context&&v2215CitationReader(context),parts=v24SyntaxParts(value.slice(2,-2));
 if(!reader||!parts||!value.startsWith('{{')||!value.endsWith('}}')||topNodes(protectedView(value)).length!==1)return null;
 const fields=v222Fields(value);if(!fields||fields.fields.length!==parts.length-1)return null;
 const seen=new Set(),roles=new Set(),pairs=[];
 for(const f of fields.fields){const role=v2215CitationModelRoles(f.key,reader);if(seen.has(f.key)||!nativeCitationAccepts(context.native,f.key)||/\{\{|<|[\r\n]/.test(f.value)||role.some(k=>roles.has(k)))return null;
  seen.add(f.key);role.forEach(k=>roles.add(k));pairs.push([f.key,f.value.trim()]);}
 pairs.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);return JSON.stringify(['native-citation',context.profile.title,context.profile.oldid,pairs]);
}
function v2221ReferenceLegacyColumnValue(value) {
 return typeof value==='string'&&/^[ \t]*(?:(?:[1-9]\d?(?:\.\d+)?)(?:em|px)?|auto)?[ \t]*$/.test(value);
}
function v2221ReferenceLegacyColumnsAllowed(entries) {
 if(!Array.isArray(entries))return false;
 const seen=new Set(),values=new Map();
 for(const entry of entries){
  const key=norm(entry.key);if(seen.has(key)||!v2221ReferenceLegacyColumnValue(entry.value))return false;seen.add(key);
  const role=['col','cols','colunas'].includes(key)?'count':['colwidth','largcol','larguracol'].includes(key)?'width':null;
  if(!role)return false;
  const value=entry.value.trim();if(values.has(role)&&values.get(role)!==value)return false;values.set(role,value);
 }
 return true;
}
// The pinned native URL branch emits an external link for this signature.
// Same-wiki/manual consumers and unproved arguments remain opaque.
function v2221ReferenceOffsiteURLCall(raw) {
 if(typeof raw!=='string'||raw.length>4096||!raw.startsWith('{{')||!raw.endsWith('}}')||/[{}<>\[\]\r\n\p{C}]|\x7e{3}|__/u.test(raw.slice(2,-2)))return false;
 const parsed=parsedTemplate(raw);if(!parsed||!v219OriginalTemplateHeaderAllowed(parsed.parts[0])||!v215SameTemplateTitle(parsed.parts[0],'URL'))return false;
 const slots=v2216LayoutSlots(raw),parts=parsed.parts.slice(1);
 if(!slots||parts.length<1||parts.length>2||!slots.has('1')||[...slots.keys()].some(k=>!['1','2'].includes(k))||parts.some(part=>{const at=part.indexOf('=');return at>=0&&!/^[ \t]*[12][ \t]*$/.test(part.slice(0,at));}))return false;
 const trim=s=>s.replace(/^[ \t]+|[ \t]+$/g,''),value=trim(slots.get('1')),label=slots.has('2')?trim(slots.get('2')):'';
 if(!value||value.length>2048||/[^\x21-\x7e]|[&%\\{}<>\[\]|"`]/.test(value)||value.includes('__')||/\x7e{3}/.test(value))return false;
 if(label.length>240||label&&!/^[\p{L}\p{M}\p{N} .,:;!?()'-]+$/u.test(label)||label.includes("''"))return false;
 let input;
 if(/^https?:\/\//i.test(value))input=value;
 else if(value.startsWith('//'))input='https:'+value;
 else if(/^[A-Za-z\d.-]+(?::\d{1,5})?(?:[/?#]|$)/.test(value))input='http://'+value;
 else return false;
 let uri;try{uri=new URL(input);}catch{return false;}
 if(!['http:','https:'].includes(uri.protocol)||uri.username||uri.password)return false;
 const authority=/^https?:\/\/([^/?#]+)/i.exec(input)?.[1];if(!authority||!/^[-A-Za-z\d.]+(?::\d{1,5})?$/.test(authority))return false;
 const host=uri.hostname.toLowerCase().replace(/\.$/,'');
 return /^(?=.{1,253}$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,63}$/.test(host)&&!(host.endsWith('.wikipedia.org')&&host.split('.').slice(0,-2).includes('pt'));
}
function v2221ReferenceRekeyGraphView(source) {
 const view=v24SyntaxProtected(source).view,edits=[];
 for(const n of topNodes(view)){
  if(!v2221ReferenceOutside(source,n.start,n.end,view))continue;
  const raw=source.slice(n.start,n.end);if(v2221ReferenceOffsiteURLCall(raw))edits.push({start:n.start,end:n.end,text:raw.replace(/[^\r\n]/g,' ')});
 }
 const text=v24SyntaxApply(source,edits),refs=s=>v219NativeReferenceObserver(s).refs.map(r=>[r.start,r.end,r.raw,r.attrs,r.body,r.group]);
 return text.length===source.length&&JSON.stringify(refs(text))===JSON.stringify(refs(source))?text:source;
}
function v2221ReferenceRekeyClosed(source) {
 if(typeof source!=='string')return false;
 const rows=v2221ReferenceRows(source);
 return !rows.some(r=>!r.descriptor?.safe||r.descriptor.bank?.trim())&&!v2221ReferenceOpaqueConsumers(source,rows).length&&
  v2221ReferenceWellFormedOwners(source)&&v2221ReferenceClosed(v2221ReferenceRekeyGraphView(source),rows);
}
function v2221ReferenceAliasProofAllows(source,proof,cfg={}) {
 if(!proof||!Array.isArray(proof.names)||proof.names.length<2||new Set(proof.names).size!==proof.names.length||
  !Array.isArray(proof.bodies)||proof.bodies.length!==proof.names.length||proof.bodies.some(b=>typeof b!=='string'||b!==proof.bodies[0])||
  !v2221ReferenceRekeyClosed(source))return false;
 const observed=v219NativeReferenceObserver(source),names=new Set(proof.names),group=proof.group||'';
 // Normalization is used only to detect a collision, never to merge the raw
 // NFC/NFD spellings of a Cite identity or to invent an alternative name.
 const allNames=observed.refs.filter(r=>r.attrs?.name).map(r=>r.attrs.name);
 for(const name of names){
  if(typeof name!=='string'||allNames.some(other=>other!==name&&other.normalize('NFC')===name.normalize('NFC')))return false;
  const defs=observed.refs.filter(r=>r.group===group&&r.attrs?.name===name&&r.body!==null);
  if(defs.length!==1||defs[0].container||defs[0].body!==proof.bodies[0])return false;
 }
 return names.has(proof.name);
}
function v2221ReferenceDefinitionEdits(source,cfg={}) {
 const observed=v219NativeReferenceObserver(source),editable=new Map(v2216ReferenceGraph(source).refs.filter(r=>r.eligible).map(r=>[r.start,r])),families=new Map(),edits=[];
 for(const r of observed.refs){if(!r.attrs?.name)continue;const key=JSON.stringify([r.group,r.attrs.name]);if(!families.has(key))families.set(key,[]);families.get(key).push(r);}
 for(const family of families.values()){
  const defs=family.filter(r=>r.body!==null);if(defs.length<2||family.some(r=>!r.valid||!r.attrs||!v24SyntaxLiteralIdentity(r.attrs)))continue;
  const keys=defs.map(r=>v2221ReferenceBodyKey(r.body,cfg));if(keys.some(k=>k===null)||new Set(keys).size!==1)continue;
  for(const r of defs.slice(1)){if(r.container||!editable.has(r.start))continue;const tag=v24SyntaxTag(source,r.start);if(!tag)continue;
   edits.push({start:r.start,end:r.end,text:tag.raw.slice(0,-1).trimEnd()+' />',count:1,kind:'v2221-equivalent-reference-definition',proof:{name:r.attrs.name,group:r.group,retainedDefinitionStart:defs[0].start,bodyKey:keys[0]}});}
 }
 // Keep the pre-existing cross-name repair only when its literal producer
 // graph is closed. Its same-body keeper and every renamed reuse are replayed
 // by the original v27 source proof; unknown producers retain their names.
 const aliases=v27SafeAutomationEdits(source,cfg,'references').filter(e=>v2221ReferenceAliasProofAllows(source,e.proof,cfg)).map(e=>({...e,count:1,kind:'v2221-closed-identical-reference-alias'})),initial=v222ReferenceEdits(source,[...edits,...aliases]),intermediate=v24SyntaxApply(source,initial),actual=v219NativeReferenceObserver(intermediate),adjacent=v2216ReferenceAdjacentEdits(intermediate).map(e=>({...e,count:1,kind:'v2221-adjacent-reference-duplicate'}));
 for(const e of v29ReferenceRepairEdits(intermediate,cfg)){
  if(e.ruleId!=='v29AnchorReferences'||e.text!==''||adjacent.some(x=>x.start===e.start&&x.end===e.end))continue;
  const reuse=actual.refs.find(r=>r.start===e.start&&r.end===e.end&&r.body===null),defs=reuse&&actual.refs.filter(r=>r.group===reuse.group&&r.attrs?.name===reuse.attrs?.name&&r.body!==null);
  if(!reuse||reuse.container||reuse.attrs?.name!==e.proof.name||reuse.group!==(e.proof.group||'')||!defs.length||defs.some(r=>r.body!==e.proof.body))continue;
  adjacent.push({...e,count:1,kind:'v2221-reference-duplicate-in-uninterrupted-cluster'});
 }
 if(!adjacent.length)return initial;
 if(!initial.length)return adjacent;
 const text=v24SyntaxApply(intermediate,adjacent);let start=0,end=source.length,nextEnd=text.length;
 while(start<end&&start<nextEnd&&source[start]===text[start])start++;
 while(end>start&&nextEnd>start&&source[end-1]===text[nextEnd-1]){end--;nextEnd--;}
 return [{start,end,text:text.slice(start,nextEnd),count:initial.reduce((n,e)=>n+e.count,0)+adjacent.length,kind:'v2221-identical-reference-definitions-and-adjacent-reuses',proof:{sourceHash:v24SyntaxHash(source),intermediateHash:v24SyntaxHash(intermediate),initial,adjacent}}];
}
function v2221ReferenceWellFormedOwners(source) {
 const view=v24SyntaxProtected(source).view;let open=false;
 for(let at=view.indexOf('<');at>=0;){
  const tag=v24SyntaxTag(view,at);
  if(!tag){if(/^<\s*\/?\s*r\s*e\s*f(?=[\s/>]|$)/i.test(view.slice(at)))return false;at=view.indexOf('<',at+1);continue;}
  at=view.indexOf('<',tag.end);if(tag.name!=='ref')continue;
  if(tag.typo||!/^<\/?ref(?=[\s/>])/i.test(tag.raw))return false;
  if(tag.close){if(!open||tag.self||tag.attrs.trim())return false;open=false;}
  else{if(open)return false;if(!tag.self)open=true;}
 }
 return !open;
}
function v2221ReferenceOwnerClosureEdits(source,cfg={}) {
 if(cfg.syntaxRepairs===false)return [];
 return v222ReferenceEdits(source,v24SyntaxReferenceEdits(source,cfg).filter(e=>e.ruleId==='syntaxReferenceClosers').map(e=>({...e,count:1,kind:'v2221-verified-reference-owner-closure'})));
}
function v2221ReferenceOrphanEdits(source) {
 const observed=v219NativeReferenceObserver(source),rows=v2221ReferenceRows(source),defs=new Set(),edits=[];
 if(!v2221ReferenceWellFormedOwners(source))return edits;
 for(const r of observed.refs)if(r.attrs?.name&&r.body!==null)defs.add(v2221ReferenceKey(r.group,r.attrs.name));
 for(const h of observed.helpers||[])for(const c of h.calls||[])if(c.value&&c.body!==null)defs.add(v2221ReferenceKey(c.group,c.value));
 const closed=new Map();for(const r of v2216ReferenceGraph(source).refs){
  if(!r.eligible||!r.name||r.body!==null||!v24SyntaxLiteralIdentity(r.attrs,true)||defs.has(v2221ReferenceKey(r.group,r.name)))continue;
  if(!closed.has(r.group))closed.set(r.group,v2221ReferenceClosed(source,rows,r.group));if(!closed.get(r.group))continue;
  edits.push({start:r.start,end:r.end,text:'',count:1,kind:'v2221-proved-orphan-reuse',proof:{name:r.name,group:r.group,nativeNfcComparison:true,closedProducerGraph:true}});
 }
 return edits;
}
function v2221ReferenceNamesEdits(source,cfg={}) {
 if(cfg.neutralReferenceNames===false)return [];
 const plan=v2216AutonamePlan(source,cfg);return v2216AutonameProof(source,plan.text,plan,cfg)?plan.edits.map(e=>({...e,count:1,kind:'v2221-descriptive-reference-name'})):[];
}
function v2221ReferenceNumericNamesEdits(source,cfg={}) {
 if(cfg.neutralReferenceNames===false)return [];
 const observed=v219NativeReferenceObserver(source),rows=v2221ReferenceRows(source),shield=v24SyntaxProtected(source),families=new Map(),edits=[];
 if(observed.unclosed.length||observed.empties.length||!v2221ReferenceClosed(source,rows)||observed.helpers.some(h=>h.helperKind!=='r'||!h.eligible))return [];
 const reserved=v219ReferenceOccupiedNames(source,cfg);
 for(const r of observed.refs){if(!r.attrs?.name||!/^\d+$/.test(r.attrs.name))continue;const name=r.attrs.name;if(!families.has(name))families.set(name,{refs:[],helpers:[]});families.get(name).refs.push(r);}
 for(const h of observed.helpers)for(const call of h.calls){if(!/^\d+$/.test(call.value))continue;if(!families.has(call.value))families.set(call.value,{refs:[],helpers:[]});families.get(call.value).helpers.push(call);}
 for(const [name,family]of families){
  const target='ref-'+name;if(reserved.has(target)||shield.ranges.some(range=>family.refs.some(r=>range.start<r.end&&r.start<range.end)||family.helpers.some(c=>range.start<c.end&&c.start<range.end)))continue;
  const definitions=new Map();let valid=true;
  for(const r of family.refs){if(!r.valid||!r.attrs||!v24SyntaxLiteralIdentity(r.attrs)||r.attrs.name!==name){valid=false;break;}if(r.body!==null){const key=v2221ReferenceIdentity(r.group);if(!definitions.has(key))definitions.set(key,new Set());definitions.get(key).add(r.body);}}
  if(!valid||[...definitions.values()].some(values=>values.size!==1)||family.refs.some(r=>!definitions.has(v2221ReferenceIdentity(r.group)))||family.helpers.some(c=>!definitions.has(v2221ReferenceIdentity(c.group))))continue;
  const proposed=[];
  for(const r of family.refs){const tag=v24SyntaxTag(source,r.start),hit=tag&&/\sname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i.exec(tag.raw);if(!hit||(hit[1]??hit[2]??hit[3])!==name){valid=false;break;}
   const valueAt=hit.index+hit[0].lastIndexOf(name),start=tag.start+valueAt;
   proposed.push({start,end:start+name.length,text:target,count:1,kind:'v2221-numeric-reference-name',proof:{name,target,group:r.group,bodyPreserved:r.body,closedProducerGraph:true}});}
  if(!valid)continue;
  for(const c of family.helpers){if(source.slice(c.start,c.end)!==name){valid=false;break;}proposed.push({start:c.start,end:c.end,text:target,count:1,kind:'v2221-numeric-helper-reference-name',proof:{name,target,group:c.group,helperOwnerStart:c.ownerStart,closedProducerGraph:true}});}
  if(valid){edits.push(...proposed);reserved.add(target);}
 }
 return v222ReferenceEdits(source,edits);
}
function v2221ReferenceSyntaxEdits(source) {
 const view=v24SyntaxProtected(source).view,edits=[],observed=v219NativeReferenceObserver(source);
 for(let at=view.indexOf('<');at>=0;){
  const tag=v24SyntaxTag(view,at);at=view.indexOf('<',tag?tag.end:at+1);
  if(!tag||tag.name!=='references'||tag.close||!tag.self||!v2221ReferenceOutside(source,tag.start,tag.end,view)||!v2221ReferenceNativeRow(source,tag))continue;
  const extra=/^[ \t\r\n]*(<\/references\s*>)/i.exec(source.slice(tag.end));
  if(extra){const start=tag.end+extra[0].length-extra[1].length;edits.push({start,end:start+extra[1].length,text:'',count:1,kind:'v2221-surplus-collector-close'});}
 }
 for(const r of observed.refs){
  if(!r.valid||r.body===null||r.container||observed.unclosed.some(x=>x.start<r.end&&x.start>=r.start))continue;
  const tag=v24SyntaxTag(source,r.start);if(!tag||!v2221ReferenceOutside(source,r.start,tag.end,view))continue;
  if(/^<\s+ref\b/i.test(tag.raw))edits.push({start:tag.start,end:tag.end,text:tag.raw.replace(/^<\s+ref\b/i,'<ref'),count:1,kind:'v2221-split-ref-opening'});
  const extra=/^[ \t]*(<\/ref\s*>)/i.exec(source.slice(r.end));
  if(extra){const start=r.end+extra[0].length-extra[1].length;if(v2221ReferenceOutside(source,start,start+extra[1].length,view))edits.push({start,end:start+extra[1].length,text:'',count:1,kind:'v2221-adjacent-surplus-ref-close'});}
  const calls=topNodes(protectedView(r.body));
  if(calls.length>1&&!r.body.slice(0,calls[0].start).trim()&&!r.body.slice(calls.at(-1).end).trim()&&calls.every(n=>v2221ReferenceBodyKey(r.body.slice(n.start,n.end)))&&calls.slice(1).every((n,i)=>!r.body.slice(calls[i].end,n.start).trim())){
   for(let i=1;i<calls.length;i++){if(calls[i-1].end!==calls[i].start)continue;const at=tag.end+calls[i].start;edits.push({start:at,end:at,text:'<br />',count:1,kind:'v2221-adjacent-citation-separator',proof:{left:r.body.slice(calls[i-1].start,calls[i-1].end),right:r.body.slice(calls[i].start,calls[i].end),referenceBodyPreserved:true}});}
  }
 }
 // A complete imported bibliographic call and a known collector establish
 // the narrow typo owner; prose inside an arbitrary HTML tag is never moved.
 if(v2221ReferenceRows(source).length)for(const m of view.matchAll(/<(reference|referência)(\s[^<>]*?)?>([\s\S]*?)<\/\1\s*>/giu)){
  const start=m.index,end=start+m[0].length,attrs=v2221ReferenceAttrs(m[2]||''),body=source.slice(start+m[0].indexOf('>')+1,end-m[0].slice(m[0].lastIndexOf('</')).length);
  if(!attrs||!body.trim().startsWith('{{')||!v2221ReferenceBodyKey(body)||!v2221ReferenceOutside(source,start,start+m[0].indexOf('>')+1,view))continue;
  const open='<ref'+[...attrs.values].map(([k,v])=>' '+k+'="'+v+'"').join('')+'>';
  const name=attrs.values.get('name')||'',group=attrs.values.get('group')||'';
  if(name&&observed.refs.some(r=>r.attrs?.name&&v2221ReferenceKey(r.group,r.attrs.name)===v2221ReferenceKey(group,name)&&r.body!==null&&r.body!==body))continue;
  edits.push({start,end,text:open+body+'</ref>',count:2,kind:'v2221-bibliographic-ref-tag-typo',proof:{originalTag:m[1],name,group,body}});
 }
 return v222ReferenceEdits(source,edits);
}
function v2221ReferencePunctuationEdits(source,cfg={}) {
 if(cfg.refPunctuation===false)return [];
 const ordinary=v2216ReferencePunctuationEdits(source).map(e=>({...e,count:1,kind:'v2221-reference-punctuation'})),intermediate=v24SyntaxApply(source,ordinary),legacy=v218LegacyMarkupPlan(intermediate,cfg);
 if(!v218LegacyMarkupProof(intermediate,legacy.text,legacy,cfg))return ordinary;
 // A preceding ASCII gap is a separate, already certified operation. It does
 // not read or rewrite the reference's attributes, name, body or later uses.
 const gaps=legacy.edits.filter(e=>e.ruleId==='referencePunctuation'&&e.text===''&&/^[ \t]+$/.test(intermediate.slice(e.start,e.end))).map(e=>({...e,count:1,kind:'v2221-reference-preceding-horizontal-space'}));
 if(!gaps.length)return ordinary;
 if(!ordinary.length)return gaps;
 const text=v24SyntaxApply(intermediate,gaps);let start=0,end=source.length,nextEnd=text.length;
 while(start<end&&start<nextEnd&&source[start]===text[start])start++;
 while(end>start&&nextEnd>start&&source[end-1]===text[nextEnd-1]){end--;nextEnd--;}
 return [{start,end,text:text.slice(start,nextEnd),count:ordinary.length+gaps.length,kind:'v2221-reference-punctuation-and-horizontal-space',proof:{sourceHash:v24SyntaxHash(source),intermediateHash:v24SyntaxHash(intermediate),ordinary,gaps}}];
}
function v2221ReferenceSubplan(source,kind,cfg={}) {
 if(typeof source!=='string')return {sourceHash:null,text:source,edits:[],kind};
 if(!v2221ReferenceScope(source,cfg))return {...v222EditsPlan(source,[]),kind};
 let edits=[];
 if(kind==='owner-closure')edits=v2221ReferenceOwnerClosureEdits(source,cfg);
 else if(kind==='syntax')edits=v2221ReferenceSyntaxEdits(source);
 else if(kind==='attributes')edits=v2221ReferenceAttributeEdits(source);
 else if(kind==='bank-alias')edits=v2221ReferenceBankAliasEdits(source);
 else if(kind==='isolation')edits=v2221ReferenceIsolationEdits(source);
 else if(kind==='groups'&&cfg.unifiedNotesReferences!==false)edits=v2221ReferenceGroupEdits(source);
 else if(kind==='definitions'&&cfg.automaticIdenticalReferences!==false)edits=v2221ReferenceDefinitionEdits(source,cfg);
 else if(kind==='orphans')edits=v2221ReferenceOrphanEdits(source);
 else if(kind==='numeric-names')edits=v2221ReferenceNumericNamesEdits(source,cfg);
 else if(kind==='names')edits=v2221ReferenceNamesEdits(source,cfg);
 else if(kind==='punctuation')edits=v2221ReferencePunctuationEdits(source,cfg);
 else if(kind==='collectors')edits=v2221ReferenceCollectorEdits(source,cfg);
 else if(kind==='spacing')edits=v2221ReferenceSpacingEdits(source);
 return {...v222EditsPlan(source,edits),kind};
}
function v2221ReferenceSubproof(before,after,plan,cfg,kind) {
 return plan?.kind===kind&&v222PlanProof(before,after,plan,cfg,(s,o)=>v2221ReferenceSubplan(s,kind,o));
}
function v2221ReferenceAttributesPlan(s,c={}){return v2221ReferenceSubplan(s,'attributes',c);}
function v2221ReferenceAttributesProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'attributes');}
function v2221ReferenceBankAliasPlan(s,c={}){return v2221ReferenceSubplan(s,'bank-alias',c);}
function v2221ReferenceBankAliasProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'bank-alias');}
function v2221ReferenceSyntaxPlan(s,c={}){return v2221ReferenceSubplan(s,'syntax',c);}
function v2221ReferenceSyntaxProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'syntax');}
function v2221ReferenceIsolationPlan(s,c={}){return v2221ReferenceSubplan(s,'isolation',c);}
function v2221ReferenceIsolationProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'isolation');}
function v2221ReferenceGroupsPlan(s,c={}){return v2221ReferenceSubplan(s,'groups',c);}
function v2221ReferenceGroupsProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'groups');}
function v2221ReferenceCollectorsPlan(s,c={}){return v2221ReferenceSubplan(s,'collectors',c);}
function v2221ReferenceCollectorsProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'collectors');}
function v2221ReferenceDefinitionsPlan(s,c={}){return v2221ReferenceSubplan(s,'definitions',c);}
function v2221ReferenceDefinitionsProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'definitions');}
function v2221ReferenceOrphansPlan(s,c={}){return v2221ReferenceSubplan(s,'orphans',c);}
function v2221ReferenceOrphansProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'orphans');}
function v2221ReferenceOwnerClosurePlan(s,c={}){return v2221ReferenceSubplan(s,'owner-closure',c);}
function v2221ReferenceOwnerClosureProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'owner-closure');}
function v2221ReferenceNamesPlan(s,c={}){return v2221ReferenceSubplan(s,'names',c);}
function v2221ReferenceNamesProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'names');}
function v2221ReferenceNumericNamesPlan(s,c={}){return v2221ReferenceSubplan(s,'numeric-names',c);}
function v2221ReferenceNumericNamesProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'numeric-names');}
function v2221ReferencePunctuationPlan(s,c={}){return v2221ReferenceSubplan(s,'punctuation',c);}
function v2221ReferencePunctuationProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'punctuation');}
function v2221ReferenceSpacingPlan(s,c={}){return v2221ReferenceSubplan(s,'spacing',c);}
function v2221ReferenceSpacingProof(a,b,p,c={}){return v2221ReferenceSubproof(a,b,p,c,'spacing');}
function v2221ReferencePlan(source,cfg={}) {
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};if(!v2221ReferenceScope(source,cfg))return empty;
 let text=source;const steps=[];
 for(const kind of V2221_REFERENCE_STAGES){const p=v2221ReferenceSubplan(text,kind,cfg);if(p.text===text||!v2221ReferenceSubproof(text,p.text,p,cfg,kind))continue;steps.push({kind,before:text,text:p.text,edits:p.edits});text=p.text;}
 if(text===source)return empty;const count=steps.reduce((n,s)=>n+s.edits.reduce((k,e)=>k+e.count,0),0);
 return {...empty,text,steps,edits:[{start:0,end:source.length,text,count,kind:'v2221-source-bound-reference-plan'}]};
}
function v2221ReferenceProof(before,after,plan,cfg={}) {
 if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||v24SyntaxApply(before,plan.edits)!==after)return false;
 const fresh=v2221ReferencePlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
