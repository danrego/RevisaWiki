// Source-bound reference repairs. A refusal is confined to its dependent family.
const V222_REFERENCE_CONTRACTS=Object.freeze({references:63785697,notes:59102402,notelist:59274856,reflist:56151616,combined:73218466});
const V222_REFERENCE_NOTE_GROUPS=Object.freeze(['nota','lower-alpha','Nota','nt']);
const V222_REFERENCE_SUBSTEPS=Object.freeze(['attributes','outer-whitespace','orphan-reuses','collectors','collector-spacing','short-reference-gap','prose-spacing']);
const V222_REFERENCE_CORRELATOS=Object.freeze({revision:70692962,sha256:'05cd4f6f1f122ebb7238c94e4f64010342339e9d0bb76b29a632a6e7301b12f4',fields:Object.freeze(['commons','commonscat','largura','media','meta','metacat','ocultar','título','wikcionario','wikcionariocat','wikcionário','wikcionáriocat','wikidata','wikilivros','wikilivroscat','wikinoticias','wikinoticiascat','wikinotícias','wikinotíciascat','wikiquote','wikiquotecat','wikisource','wikisourcecat','wikispecies','wikiversidade','wikivoyage'])});
const V222_REFERENCE_BINDING_ACTIVE=new Set();

function v222ReferenceScope(source,cfg={}) {
 return typeof source==='string'&&v2215ReferenceCollectorScope(source,cfg);
}
function v222ReferenceOutside(source,start,end,view=null,allowHtml=false,hardRanges=null) {
 const hard=hardRanges||[...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)];
 if(hard.some(r=>r.start<end&&start<r.end))return false;
 const c=v24SyntaxContext(view||v24SyntaxProtected(source).view,start);
 return !['templates','tables','links','external',...(allowHtml?[]:['html'])].some(k=>c[k]?.length);
}
function v222ReferenceEdits(source,edits) {
 const sorted=edits.filter(e=>Number.isInteger(e.start)&&Number.isInteger(e.end)&&e.start>=0&&e.end>=e.start&&e.end<=source.length&&typeof e.text==='string'&&source.slice(e.start,e.end)!==e.text).sort((a,b)=>a.start-b.start||a.end-b.end);
 // Keep independent proposals even if another local proposal has a bad span.
 return sorted.filter((e,i)=>!sorted.some((o,j)=>i!==j&&o.start<e.end&&e.start<o.end));
}
function v222ReferenceHeadingFreeCorrelatos(raw) {
 const parsed=parsedTemplate(raw);if(!v219OriginalTemplateHeaderAllowed(parsed.parts[0])||!v215SameTemplateTitle(v215TemplateTitle(parsed.parts[0]),'Correlatos')||/[{}<>\[\]]|''|__|\x7e{3}/.test(raw.slice(2,-2)))return false;
 const slots=v2216LayoutSlots(raw);return !!slots&&[...slots].every(([key,value])=>V222_REFERENCE_CORRELATOS.fields.includes(key)&&!/[\r\n]/.test(value.trim())&&(key!=='largura'||/^[1-9]\d{0,3}$/.test(value.trim())));
}
function v222ReferenceManualOwner(source,start) {
 let view=protectedView(source);const masks=[];
 for(const node of topNodes(view))if(node.end<=start&&v222ReferenceHeadingFreeCorrelatos(source.slice(node.start,node.end))&&v222ReferenceOutside(source,node.start,node.end,view))masks.push(node);
 for(const node of masks.sort((a,b)=>b.start-a.start))view=view.slice(0,node.start)+view.slice(node.start,node.end).replace(/[^\r\n]/g,' ')+view.slice(node.end);
 return v2217ReferenceManualSection(source,start,view);
}
function v222ReferenceAttributeFields(raw) {
 const fields=[],seen=new Set(),re=/\s+([A-Za-z][A-Za-z-]*)(\s*(?:==|=|:)\s*)(?:"([^"<>]*)"|'([^'<>]*)'|([^\s"'=<>`]+))/g;let m,last=0;
 while((m=re.exec(raw))){
  if(raw.slice(last,m.index).trim())return null;
  const original=m[1],key=({nome:'name',grupo:'group'})[original.toLowerCase()]||original.toLowerCase(),value=m[3]??m[4]??m[5];
  if(!['name','group'].includes(key)||seen.has(key)||!value||value!==value.trim()||/[{}\[\]<>|&\r\n]/.test(value))return null;
  seen.add(key);fields.push({key,value,start:m.index+m[0].indexOf(original),keyEnd:m.index+m[0].indexOf(original)+original.length,operatorStart:m.index+m[0].indexOf(original)+original.length,operatorEnd:m.index+m[0].indexOf(original)+original.length+m[2].length,original,operator:m[2]});last=re.lastIndex;
 }
 return raw.slice(last).trim()?null:fields;
}
function v222ReferenceAttributeEdits(source) {
 // The legacy quote reader also quarantines malformed ref attributes. Recheck
 // actual quotation ranges after the finite attribute repair, never bypassing
 // a literal container or a quoted example merely because it contains a typo.
 const view=v24SyntaxProtected(source).view,proposals=[],hard=[...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source)];
 for(let at=view.indexOf('<');at>=0;){
  const tag=v24SyntaxTag(view,at);at=view.indexOf('<',tag?tag.end:at+1);
  if(!tag||tag.name!=='ref'||tag.close||tag.typo||!v222ReferenceOutside(source,tag.start,tag.end,view,false,hard))continue;
  const fields=v222ReferenceAttributeFields(tag.attrs);if(!fields)continue;
  const edits=[];let count=0;
  for(const f of fields){
   if(f.original!==f.key){edits.push({start:f.start,end:f.keyEnd,text:f.key});count++;}
   if(f.operator.trim()!=='='){edits.push({start:f.operatorStart,end:f.operatorEnd,text:'='});count++;}
  }
  if(!edits.length)continue;
  const attrs=v24SyntaxApply(tag.attrs,edits),prefix=tag.raw.indexOf(tag.attrs),text=tag.raw.slice(0,prefix)+attrs+tag.raw.slice(prefix+tag.attrs.length),key=JSON.stringify([fields.find(f=>f.key==='group')?.value||'',fields.find(f=>f.key==='name')?.value||'']);
  proposals.push({start:tag.start,end:tag.end,text,count,kind:'v222-native-ref-attributes',proof:{key,fields:fields.map(f=>[f.key,f.value]),before:tag.raw,selfClosing:tag.self}});
 }
 // A repaired identity must not introduce conflicting definitions.
 const candidate=v24SyntaxApply(source,proposals),observed=v219NativeReferenceObserver(candidate),bad=new Set(),defs=new Map();
 for(const r of observed.refs){if(!r.attrs?.name||r.body===null)continue;const key=JSON.stringify([r.group||'',r.attrs.name]);if(!defs.has(key))defs.set(key,new Set());defs.get(key).add(r.body);}
 for(const h of observed.helpers||[])for(const call of h.calls||[]){if(!call.value||call.body===null)continue;const key=JSON.stringify([call.group||'',call.value]);if(!defs.has(key))defs.set(key,new Set());defs.get(key).add(call.body);}
 for(const r of [...observed.unclosed,...observed.empties])bad.add(JSON.stringify([r.group||'',r.attrs?.name||'']));
 for(const [key,bodies] of defs)if(bodies.size>1)bad.add(key);
 const quoted=v219QuotedTemplateRanges(candidate,false);let delta=0;
 return proposals.filter(e=>{const start=e.start+delta,end=start+e.text.length;delta+=e.text.length-(e.end-e.start);return !bad.has(e.proof.key)&&(!e.proof.selfClosing||defs.has(e.proof.key))&&!quoted.some(r=>r.start<end&&start<r.end);});
}
function v222ReferenceKnownProducers(source,rows=[],group=null) {
 const observed=v219NativeReferenceObserver(source),view=observed.view;
 if(observed.unclosed.length||observed.empties.length||/\{\{\{|\{\{\s*#(?:invoke|tag)\s*:/i.test(view))return false;
 if(observed.refs.some(r=>(group===null||r.group===group||!r.attrs)&&(!r.valid||!v24SyntaxLiteralIdentity(r.attrs))))return false;
 const helpers=observed.helpers||[];
 for(const h of helpers){
  if(h.attributeScope||h.helperKind==='generated-note'&&(group===null||!h.nativeGroup||h.nativeGroup===group))return false;
  if(h.helperKind==='note'&&!h.eligible)return false;
 }
 for(const node of v24SyntaxTemplates(view).nodes){
  if(rows.some(r=>r.start<=node.start&&r.end>=node.end)||helpers.some(h=>h.start<=node.start&&h.end>=node.end))continue;
  const raw=source.slice(node.start,node.end),head=v215TemplateTitle(parsedTemplate(raw).parts[0]);
  if(v219NativeCitationStateInterface(raw)||v2111ReferenceFreeTemplate(raw))continue;
  // These literal footer/heading consumers do not generate Cite objects.
  if(['Correlatos','Ver também','Veja também','Links externos','Portal3','Controle de autoridade','Controlo de autoria','Controlo de autoridade','Taxonbar'].some(n=>v215SameTemplateTitle(head,n))&&
   !/[<>]/.test(raw)&&!raw.slice(2,-2).includes('{{'))continue;
  return false;
 }
 return true;
}
function v222ReferenceOrphanEdits(source) {
 const observed=v219NativeReferenceObserver(source),graph=v2216ReferenceGraph(source),rows=v222ReferenceCollectorRows(source),defs=new Set(),edits=[],producerGroups=new Map();
 for(const r of observed.refs)if(r.attrs?.name&&r.body!==null)defs.add(JSON.stringify([r.group||'',r.attrs.name]));
 const helperNames=new Set();for(const h of observed.helpers||[])for(const call of h.calls||[])if(call.value&&call.body!==null)helperNames.add(call.value);
 for(const r of graph.refs){
  if(!r.eligible||!r.name||r.body!==null||!v24SyntaxLiteralIdentity(r.attrs,true)||defs.has(JSON.stringify([r.group,r.name]))||helperNames.has(r.name))continue;
  if(!producerGroups.has(r.group))producerGroups.set(r.group,v222ReferenceKnownProducers(source,rows,r.group));
  if(!producerGroups.get(r.group))continue;
  edits.push({start:r.start,end:r.end,text:'',count:1,kind:'v222-orphan-reference-reuse',proof:{name:r.name,group:r.group,completePage:true,definitions:0,bodyPreserved:true}});
 }
 return edits;
}
function v222ReferenceComparableBody(body) {
 const value=body.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
 return value&&!/[\r\n<>]/.test(value)&&!/^\s*[=*#:;|!]/.test(value)&&v24SyntaxBodySafe(value)?value:null;
}
function v222ReferenceOuterWhitespaceEdits(source) {
 const graph=v2216ReferenceGraph(source),regions=rendererRanges(graph.view),families=new Map(),names=v2216ReferenceLiteralReservations(source),edits=[];
 for(const use of referenceNameUses(source))names.add(decodedReferenceName(use.value).normalize('NFC'));
 for(const r of graph.refs){
  if(!r.eligible||r.name||r.body===null)continue;
  const body=v222ReferenceComparableBody(r.body);if(!body)continue;
  const key=JSON.stringify([r.group,regions.filter(n=>n.end<=r.start).length,body]);if(!families.has(key))families.set(key,[]);families.get(key).push(r);
 }
 let serial=1;
 for(const family of families.values()){
  if(family.length<2||new Set(family.map(r=>r.body)).size<2)continue;
  let name;do{name='ref-auto-'+serial++;}while(names.has(name));names.add(name);
  family.forEach((r,i)=>edits.push({start:r.start,end:r.end,text:'<ref name="'+name+'"'+(r.group?' group="'+r.group+'"':'')+(i?' />':'>'+r.body+'</ref>'),count:1,kind:'v222-reference-outer-whitespace',proof:{group:r.group,name,definition:!i,body:family[0].body,comparisonBody:v222ReferenceComparableBody(r.body),firstStart:family[0].start}}));
 }
 return edits;
}
function v222ReferenceHeading(source,start) {
 const m=/(?:^|\n)(==)[ \t]*(Notas|Notes|Referência|Referências|Referencias|References|Notas e referências)[ \t]*\1[ \t]*\r?\n[ \t\r\n]*$/i.exec(source.slice(0,start));
 return m?{start:m.index+(m[0][0]==='\n'?1:0),end:start,name:m[2],level:2}:null;
}
function v222ReferenceCollectorRows(source) {
 const scan=v2215ReferenceCollectorRows(source),view=v24SyntaxProtected(source).view,rows=scan.rows.map(r=>({...r,heading:v222ReferenceHeading(source,r.start)||r.heading}));
 // COL-HTML-01: a wrapper is eligible only with one exact class and no data.
 for(let at=view.indexOf('<');at>=0;){
  const tag=v24SyntaxTag(view,at);at=view.indexOf('<',tag?tag.end:at+1);
  if(!tag||tag.name!=='div'||tag.close||tag.self||!v222ReferenceOutside(source,tag.start,tag.end,view))continue;
  const attrs=v24SyntaxAttrs(tag.attrs);if(!attrs||Object.keys(attrs).length!==1||attrs.class!=='references')continue;
  const gap=/^[ \t\r\n]*/.exec(source.slice(tag.end))[0],inner=v24SyntaxTag(source,tag.end+gap.length);
  if(!inner||inner.name!=='references'||inner.close||inner.typo)continue;
  const fields=v24SyntaxAttrs(inner.attrs);if(!fields||Object.keys(fields).some(k=>k!=='group')||!v24SyntaxLiteralIdentity(fields))continue;
  let end=inner.end;
  if(!inner.self){const close=/^[ \t\r\n]*<\/references\s*>/i.exec(source.slice(end));if(!close)continue;end+=close[0].length;}
  const closing=/^[ \t\r\n]*<\/div\s*>/i.exec(source.slice(end));if(!closing)continue;end+=closing[0].length;
  const lineStart=source.lastIndexOf('\n',tag.start-1)+1,lineEnd=source.indexOf('\n',end);
  if(source.slice(lineStart,tag.start).trim()||source.slice(end,lineEnd<0?source.length:lineEnd).trim())continue;
  rows.push({start:tag.start,end,raw:source.slice(tag.start,end),head:'references',native:true,wrapper:true,entries:[],plain:true,group:fields.group||'',kind:fields.group?'notes':'references',heading:v222ReferenceHeading(source,tag.start)});
 }
 return rows.sort((a,b)=>a.start-b.start||a.end-b.end).filter((r,i,a)=>!a.some((o,j)=>i!==j&&o.start<r.start&&o.end>=r.end));
}
function v222ReferenceCollectorContract(row) {
 if(row.native)return {groups:[row.group||''],notes:!!row.group,default:!row.group};
 const head=v215TemplateTitle(row.head),slots=v2216LayoutSlots(row.raw);if(!slots)return null;
 const plain=['Notas','Notas e referências','Referências'].some(n=>v215SameTemplateTitle(head,n))||v219NativeReferenceCollectorAlias(head);
 if(plain){
  if(slots.size)return null;
  if(v215SameTemplateTitle(head,'Notas'))return{groups:['nota','lower-alpha'],notes:true,default:false};
  if(v215SameTemplateTitle(head,'Notas e referências'))return{groups:['nota','lower-alpha','Nota','nt',''],notes:true,default:true};
  return{groups:[''],notes:false,default:true};
 }
 if(!row.reflist&&!row.notelist)return null;
 if([...slots.keys()].some(k=>!['1','colwidth','largcol','larguracol','group','grupo'].includes(k)))return null;
 const widths=['1','colwidth','largcol','larguracol'].filter(k=>slots.has(k));if(widths.length>1)return null;
 if(widths.length&&!/^(?:[1-9]\d?|[1-9]\d?(?:\.\d+)?(?:em|px))$/.test(slots.get(widths[0]).trim()))return null;
 if(slots.has('group')&&slots.has('grupo'))return null;
 const group=(slots.get('group')??slots.get('grupo')??(row.notelist?'lower-alpha':'')).trim();
 if(row.notelist&&!['nota','upper-alpha','upper-roman','lower-alpha','lower-greek','lower-roman'].includes(group))return null;
 if(/[{}<>\[\]|&\r\n]/.test(group))return null;
 return{groups:[group],notes:!!group,default:!group,width:widths.length?slots.get(widths[0]):null};
}
function v222ReferenceCollectorEdits(source,cfg={}) {
 if(cfg.unifiedNotesReferences===false||cfg.automaticReferenceCollectorHeadings===false||cfg.headings===false)return [];
 const rows=v222ReferenceCollectorRows(source);if(!rows.length||v219ReferenceCollectorTargeted(source)||/\[\[\s*#|\{\{\s*(?:âncora|anchor)\b|<[A-Za-z][^>]*\bid\s*=/i.test(source))return [];
 const contracts=rows.map(v222ReferenceCollectorContract),observed=v219NativeReferenceObserver(source),closed=v222ReferenceKnownProducers(source,rows),groups=new Set(observed.refs.map(r=>r.group||''));
 for(const h of observed.helpers||[])for(const call of h.calls||[])groups.add(call.group||'');
 // A lone native Notas is empty only with the complete closed producer proof.
 // A custom title or section prose is not part of the removed widget.
 if(closed&&rows.length===1&&v215SameTemplateTitle(rows[0].head,'Notas')&&contracts[0]&&!observed.refs.length&&!observed.helpers.length){
  const row=rows[0],heading=row.heading&&row.heading.level===2&&['notas','notes'].includes(norm(row.heading.name))?row.heading:null,start=heading?.start??row.start;
  return[{start,end:row.end,text:'',count:1+(heading?1:0),kind:'v222-proved-empty-notes',proof:{contract:V222_REFERENCE_CONTRACTS.notes,closedProducers:true,referenceCalls:0,helperCalls:0,customTitlesAndContentPreserved:true,occurrences:{collectors:1,headings:heading?1:0}}}];
 }
 // A plain Notas cannot render actual default references. Restore the missing
 // renderer directly, retaining its two native note groups when they are used.
 if(closed&&rows.length===1&&v215SameTemplateTitle(rows[0].head,'Notas')&&contracts[0]&&observed.refs.some(r=>!r.group&&r.body!==null)&&observed.refs.every(r=>!r.container&&r.end<=rows[0].start)&&observed.helpers.every(h=>h.end<=rows[0].start)&&[...groups].every(g=>['','nota','lower-alpha'].includes(g))){
  const row=rows[0],heading=row.heading&&row.heading.level===2&&['notas','notes'].includes(norm(row.heading.name))?row.heading:null,owner=v222ReferenceManualOwner(source,row.start);
  if(!owner||heading&&owner.start===heading.start&&owner.syntax==='wiki'&&owner.level===2){
   const start=heading?.start??row.start,text=[...groups].some(Boolean)?'{{Notas e referências}}':'{{Referências}}';
   return[{start,end:row.end,text,count:1+(heading?1:0),kind:'v222-missing-default-renderer-after-notes',proof:{contracts:V222_REFERENCE_CONTRACTS,headingFreeCorrelatosContract:V222_REFERENCE_CORRELATOS,closedProducers:true,groups:[...groups],defaultReferenceDefinitions:observed.refs.filter(r=>!r.group&&r.body!==null).length,allProducersBeforeCollector:true,noDefinitionsInCollectors:true,occurrences:{collectors:1,headings:heading?1:0}}}];
  }
 }
 // The established atomic contract can rename one explicitly owned custom
 // note group. Do not pre-empt it by migrating its default renderer alone.
 if([...groups].some(g=>g&&!V222_REFERENCE_NOTE_GROUPS.includes(g))&&v2217ReferenceAtomicCombinedEdits(source,cfg).length)return[];
 const allSimple=contracts.every(Boolean),first=rows[0],last=rows.at(-1),start=first.heading?.start??first.start,
  contiguous=rows.every((r,i)=>!i||!source.slice(rows[i-1].end,r.heading?.start??r.start).trim()),
  onlyBefore=observed.refs.every(r=>r.end<=start),allowed=[...groups].every(g=>V222_REFERENCE_NOTE_GROUPS.includes(g)||g===''),
  defaultPresent=contracts.some(c=>c?.default),notePresent=[...groups].some(g=>V222_REFERENCE_NOTE_GROUPS.includes(g));
 const collectorGroupsAllowed=contracts.every(c=>c&&c.groups.every(g=>V222_REFERENCE_NOTE_GROUPS.includes(g)||g==='')),
  headingsAllowed=rows.every((r,i)=>!r.heading||r.heading.level===2&&(contracts[i]?.notes?['notas','notes','notas e referências']:['referência','referências','referencias','references']).includes(norm(r.heading.name)));
 const collected=new Set();let activeCustomWidth=false;
 for(const c of contracts){if(!c)continue;if(c.width&&/(?:em|px)$/.test(c.width.trim())&&c.groups.some(g=>!collected.has(g)))activeCustomWidth=true;for(const group of c.groups)collected.add(group);}
 const firstOwner=v222ReferenceManualOwner(source,first.start),
  ownerAllowed=!firstOwner||firstOwner.start>=start&&firstOwner.end<=first.start&&firstOwner.syntax==='wiki'&&firstOwner.level===2&&['notas','notes','notas e referências','referência','referências','referencias','references'].includes(norm(firstOwner.name))||!v2217ReferenceSourceUnheaded(first)&&['ver também','ligações externas','bibliografia','leitura adicional'].includes(norm(firstOwner.name))&&!!source.slice(firstOwner.end,first.start).trim();
 if(closed&&allSimple&&contiguous&&onlyBefore&&allowed&&collectorGroupsAllowed&&headingsAllowed&&!activeCustomWidth&&ownerAllowed&&defaultPresent&&rows.length<=8&&contracts.some(c=>c.notes)){
  // Additional native groups in the target have no hidden producer here.
  const text=notePresent?'{{Notas e referências}}':'{{Referências}}';
  const collectorCount=rows.filter(r=>r.raw!==text).length||1,headingCount=new Set(rows.filter(r=>r.heading).map(r=>r.heading.start)).size,wrapperCount=rows.filter(r=>r.wrapper).length;
  if(source.slice(start,last.end)!==text)return[{start,end:last.end,text,count:collectorCount+headingCount+wrapperCount,kind:'v222-reference-collector-convergence',proof:{contracts:V222_REFERENCE_CONTRACTS,headingFreeCorrelatosContract:V222_REFERENCE_CORRELATOS,rows:rows.map(r=>r.raw),groups:[...groups],closedProducers:true,noDefinitionsInCollectors:true,customWidthsOnlyOnRedundantCollectors:true,notesPresent:notePresent,occurrences:{collectors:collectorCount,headings:headingCount,wrappers:wrapperCount}}}];
 }
 // An independent default renderer can migrate without changing note groups.
 return rows.flatMap((r,i)=>{
  const c=contracts[i];if(!c||!c.default||c.notes||r.kind==='combined'||!r.reflist&&!r.native)return[];
  // An explicit width on an effective list is not a mere alias preference.
  // The native migration documentation does not prove identical layout.
  if(c.width&&/(?:em|px)$/.test(c.width.trim()))return[];
  const heading=r.heading,start=heading?.level===2?heading.start:r.start;
  if(heading&&!/^(?:Referência|Referências|Referencias|References)$/i.test(heading.name))return[];
  const owned=v2217ReferenceOwnedCollectorEdit(source,r,start,'{{Referências}}',cfg),text=owned.target,removedHeading=owned.start<r.start;
  return source.slice(owned.start,r.end)===text?[]:[{start:owned.start,end:r.end,text,count:1+(removedHeading?1:0)+(r.wrapper?1:0),kind:'v222-responsive-default-collector',proof:{original:r.raw,legacyWidth:c.width||null,contract:V222_REFERENCE_CONTRACTS.references,heading:removedHeading?heading?.name||null:null,retainedManualOwner:!removedHeading?v2217ReferenceManualSection(source,r.start,protectedView(source)):null,occurrences:{collectors:1,headings:removedHeading?1:0,wrappers:r.wrapper?1:0}}}];
 });
}
function v222ReferenceSpacingEdits(source) {
 const rows=v222ReferenceCollectorRows(source),edits=[],newline=source.includes('\r\n')?'\r\n':'\n';
 for(const r of rows){
  if(r.heading||!r.raw.startsWith('{{')||!v222ReferenceCollectorContract(r))continue;
  const before=/[ \t\r\n]*$/.exec(source.slice(0,r.start))[0],after=/^[ \t\r\n]*/.exec(source.slice(r.end))[0],start=r.start-before.length,end=r.end+after.length;
  const text=(source.slice(0,start)?newline+newline:'')+r.raw+(source.slice(end)?newline+newline:(after?newline:''));
  if(source.slice(start,end)!==text)edits.push({start,end,text,count:1,kind:'v222-independent-collector-spacing',proof:{collector:r.raw,leadingContent:!!source.slice(0,start),trailingContent:!!source.slice(end)}});
 }
 return v222ReferenceEdits(source,edits);
}
function v222ReferenceShortCallEdits(source) {
 const view=v24SyntaxProtected(source).view,edits=[],hard=[...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)];
 for(const h of v219NativeNoteProfiles(source)){
  if(h.attributeScope||h.helperKind!=='generated-note'||!/^\{\{[Ss]fn(?:[|}])/.test(h.raw)||!v222ReferenceOutside(source,h.start,h.end,view,false,hard))continue;
  const gap=/[ \t]+$/.exec(source.slice(0,h.start));if(!gap)continue;
  const start=h.start-gap[0].length;if(!/[.,;:!?]/.test(source[start-1]||''))continue;
  edits.push({start,end:h.start,text:'',count:1,kind:'v222-short-reference-gap',proof:{call:h.raw,nativeOldid:h.nativeOldid}});
 }
 return edits;
}
function v222ReferenceProseSpacingEdits(source) {
 const protectedSyntax=v24SyntaxProtected(source),view=protectedSyntax.view,nodes=v24SyntaxTemplates(view).nodes,refs=v24SyntaxReferences(source).refs,edits=[],hard=[...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)];
 const outside=(start,end)=>!nodes.some(n=>n.start<end&&start<n.end)&&!refs.some(r=>r.start<end&&start<r.end)&&v222ReferenceOutside(source,start,end,view,false,hard);
 for(const match of source.matchAll(/[^\r\n]+/g)){
  const line=match[0],at=match.index;
  if(/^[ \t]*[=|!;:]|https?:|[\d"'«»“”`=<>+*/\\]/i.test(line))continue;
  for(const gap of line.matchAll(/(?<=\p{L}\p{L})[ \t]+(?=[,.](?:[ \t]|$))/gu)){
   const start=at+gap.index,end=start+gap[0].length;if(outside(start,end))edits.push({start,end,text:'',count:1,kind:'v222-prose-punctuation-spacing',proof:{lineStart:at,role:'horizontal-space-before-punctuation'}});
  }
  for(const pair of line.matchAll(/\(([ \t]+)?([\p{L}][\p{L} \t-]*?)([ \t]+)?\)/gu)){
   if(!pair[1]&&!pair[3]||!/[\p{L}]{2}/u.test(pair[2]))continue;const start=at+pair.index,end=start+pair[0].length;if(!outside(start,end))continue;
   edits.push({start,end,text:'('+pair[2]+')',count:(pair[1]?1:0)+(pair[3]?1:0),kind:'v222-prose-parenthesis-spacing',proof:{lineStart:at,role:'simple-prose-parenthesis'}});
  }
 }
 return v222ReferenceEdits(source,edits);
}
function v222ReferenceSubplan(source,kind,cfg={}) {
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],kind};if(!v222ReferenceScope(source,cfg))return empty;
 let proposed=[];
 if(kind==='attributes')proposed=v222ReferenceAttributeEdits(source);
 else if(kind==='outer-whitespace'&&cfg.automaticIdenticalReferences!==false)proposed=v222ReferenceOuterWhitespaceEdits(source);
 else if(kind==='orphan-reuses')proposed=v222ReferenceOrphanEdits(source);
 else if(kind==='collectors')proposed=v222ReferenceCollectorEdits(source,cfg);
 else if(kind==='collector-spacing')proposed=v222ReferenceSpacingEdits(source);
 else if(kind==='short-reference-gap'&&cfg.refPunctuation!==false)proposed=v222ReferenceShortCallEdits(source);
 else if(kind==='prose-spacing'&&cfg.refPunctuation!==false)proposed=v222ReferenceProseSpacingEdits(source);
 const edits=v222ReferenceEdits(source,proposed);return edits.length?{...empty,edits,text:v24SyntaxApply(source,edits)}:empty;
}
function v222ReferenceSubproof(before,after,plan,cfg,kind) {
 try{
  if(typeof before!=='string'||typeof after!=='string'||!plan||plan.kind!==kind||!Array.isArray(plan.edits)||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||v24SyntaxApply(before,plan.edits)!==after)return false;
  const fresh=v222ReferenceSubplan(before,kind,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
 }catch{return false;}
}
function v222ReferenceAttributesPlan(source,cfg={}){return v222ReferenceSubplan(source,'attributes',cfg);}
function v222ReferenceAttributesProof(before,after,plan,cfg={}){return v222ReferenceSubproof(before,after,plan,cfg,'attributes');}
function v222ReferenceDedupPlan(source,cfg={}){return v222ReferenceSubplan(source,'outer-whitespace',cfg);}
function v222ReferenceDedupProof(before,after,plan,cfg={}){return v222ReferenceSubproof(before,after,plan,cfg,'outer-whitespace');}
function v222ReferenceOrphansPlan(source,cfg={}){return v222ReferenceSubplan(source,'orphan-reuses',cfg);}
function v222ReferenceOrphansProof(before,after,plan,cfg={}){return v222ReferenceSubproof(before,after,plan,cfg,'orphan-reuses');}
function v222ReferenceCollectorsPlan(source,cfg={}){return v222ReferenceSubplan(source,'collectors',cfg);}
function v222ReferenceCollectorsProof(before,after,plan,cfg={}){return v222ReferenceSubproof(before,after,plan,cfg,'collectors');}
function v222ReferenceCollectorSpacingPlan(source,cfg={}){return v222ReferenceSubplan(source,'collector-spacing',cfg);}
function v222ReferenceCollectorSpacingProof(before,after,plan,cfg={}){return v222ReferenceSubproof(before,after,plan,cfg,'collector-spacing');}
function v222ReferenceShortGapPlan(source,cfg={}){return v222ReferenceSubplan(source,'short-reference-gap',cfg);}
function v222ReferenceShortGapProof(before,after,plan,cfg={}){return v222ReferenceSubproof(before,after,plan,cfg,'short-reference-gap');}
function v222ReferenceProseSpacingPlan(source,cfg={}){return v222ReferenceSubplan(source,'prose-spacing',cfg);}
function v222ReferenceProseSpacingProof(before,after,plan,cfg={}){return v222ReferenceSubproof(before,after,plan,cfg,'prose-spacing');}
function v222ReferencePlan(source,cfg={}) {
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};if(!v222ReferenceScope(source,cfg))return empty;
 let text=source;const steps=[];
 for(const kind of V222_REFERENCE_SUBSTEPS){const sub=v222ReferenceSubplan(text,kind,cfg);if(sub.text!==text){steps.push({kind,sourceHash:sub.sourceHash,edits:sub.edits,text:sub.text});text=sub.text;}}
 if(text===source)return empty;
 const count=steps.reduce((n,s)=>n+s.edits.reduce((a,e)=>a+(e.count??1),0),0);
 return{...empty,text,steps,edits:[{start:0,end:source.length,text,count,kind:'v222-reference-plan',proof:{sourceHash:empty.sourceHash,steps:steps.map(s=>s.kind)}}]};
}
function v222ReferenceProof(before,after,plan,cfg={}) {
 try{
  if(typeof before!=='string'||typeof after!=='string'||!plan||!Array.isArray(plan.edits)||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||v24SyntaxApply(before,plan.edits)!==after)return false;
  const fresh=v222ReferencePlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits)&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);
 }catch{return false;}
}

// A comparison-only name is not an identity authored in the input. This
// fallback starts with the actual input supplied to the outer audit. It never
// starts with an inherited repair baseline or guesses provenance from a name.
function v222ReferenceBindingSites(source,observed) {
 const events=[...observed.refs.map((r,index)=>({...r,index,kind:'ref'})),...observed.helpers.map((r,index)=>({...r,index,kind:'helper'}))].sort((a,b)=>a.start-b.start||a.end-b.end);
 let residue='',cursor=0;const sites=[];
 for(const event of events){
  if(event.start<cursor)return null;
  residue+=source.slice(cursor,event.start);sites.push({kind:event.kind,index:event.index,offset:residue.length});cursor=event.end;
 }
 residue+=source.slice(cursor);const normalize=value=>value.replace(/[ \t\r\n]+/g,' '),text=normalize(residue);
 for(const site of sites){
  const at=normalize(residue.slice(0,site.offset)).length,left=text.slice(Math.max(0,at-40),at),right=text.slice(at,at+40),context=left+right;
  // Repeated prose is not a reliable site witness.
  if(!context||text.indexOf(context)!==text.lastIndexOf(context))return null;
  site.left=left;site.right=right;delete site.offset;
 }
 return sites;
}
function v222ReferenceBindingRead(source,cfg={}) {
 const observed=v219NativeReferenceObserver(source),state=v219ReferenceBindingState(source,cfg,false,true);
 if(v24SyntaxScan(source).issues.length||observed.unclosed.length||observed.empties.length||observed.shield.unclosed.length||
  observed.refs.length>256||observed.helpers.length>64||state.unread||state.opaqueRefs.length||state.opaqueCollectors.length||
  observed.refs.some(r=>!r.valid||!r.attrs||r.container||!r.renderer?.valid||!v24SyntaxLiteralIdentity(r.attrs)||Object.hasOwn(r.attrs,'name')&&!r.attrs.name||Object.keys(r.attrs).some(k=>!['name','group'].includes(k)))||
  observed.helpers.some(h=>!h.eligible||h.attributeScope||h.helperKind!=='note')||state.rawClasses.some(([,bodies])=>bodies.length!==1)||
  state.calls.some(call=>call[3]!=='resolved'))return null;
 const sites=v222ReferenceBindingSites(source,observed);if(!sites)return null;
 const opaqueProducers=[],owners=[...observed.refs,...observed.helpers,...rendererRanges(observed.view)];
 for(const node of topNodes(observed.view)){
  if(owners.some(owner=>owner.start<=node.start&&node.end<=owner.end))continue;
  const raw=source.slice(node.start,node.end),head=parsedTemplate(raw).parts[0];
  if(v2111ReferenceFreeTemplate(raw)||v222ReferenceHeadingFreeCorrelatos(raw)||
   ['Portal3','Controle de autoridade','Controlo de autoria','Controlo de autoridade','Authority control','Authority Control','Taxonbar'].some(name=>v215SameTemplateTitle(head,name)))continue;
  opaqueProducers.push([raw,observed.refs.filter(r=>r.end<=node.start).length,observed.helpers.filter(h=>h.end<=node.start).length]);
 }
 return {observed,state,sites,opaqueProducers};
}
function v222ReferenceBindingVariants(source,cfg={}) {
 const variants=[{text:source,path:[],generated:[]}],bare=v219CitationLanguageBareReferencePlan(source,cfg);
 if(bare.edits.length&&v219CitationLanguageBareReferenceProof(source,bare.text,bare,cfg))variants.push({text:bare.text,path:[{kind:'literal-bare-url',sourceHash:bare.sourceHash,outputHash:v24SyntaxHash(bare.text),count:bare.edits.length}],generated:[]});
 for(const base of variants.slice()){
  const edits=v2216ReferenceReuseEdits(base.text,cfg);
  if(!edits.length||edits.some(e=>e.kind!=='identical-reference-reuse'))continue;
  const text=v24SyntaxApply(base.text,edits);
  if(!v2216ReferenceStepWitness(base.text,text,edits)||JSON.stringify(edits)!==JSON.stringify(v2216ReferenceReuseEdits(base.text,cfg)))continue;
  const generated=[...new Set(edits.map(e=>e.witness.name))],path=[...base.path,{kind:'literal-identical-reference-reuse',sourceHash:v24SyntaxHash(base.text),outputHash:v24SyntaxHash(text),count:edits.length}];
  variants.push({text,path,generated});
  const named=v2216AutonamePlan(text,cfg);
  if(named.edits.length&&named.families.every(f=>generated.includes(f.before))&&v2216AutonameProof(text,named.text,named,cfg))variants.push({text:named.text,path:[...path,{kind:'proved-descriptive-name',sourceHash:named.sourceHash,outputHash:v24SyntaxHash(named.text),count:named.edits.length}],generated:named.families.map(f=>f.after)});
 }
 return variants;
}
function v222ReferenceBindingFallback(before,after,options={}) {
 const reject=reason=>({accepted:false,reason}),cfg=pageContextOptions({...DEFAULTS,...options});
 if(typeof before!=='string'||typeof after!=='string'||before===after||before.length>524288||after.length>524288||
  !v222ReferenceScope(before,cfg)||cfg.automaticIdenticalReferences===false)return reject('outside-finite-reference-binding-scope');
 const key=v24SyntaxHash(before)+':'+v24SyntaxHash(after);
 if(V222_REFERENCE_BINDING_ACTIVE.has(key))return reject('reference-binding-reentry');
 V222_REFERENCE_BINDING_ACTIVE.add(key);
 try{
  const original=v222ReferenceBindingRead(before,cfg),actual=v222ReferenceBindingRead(after,cfg);
  if(!original||!actual||original.observed.refs.length!==actual.observed.refs.length||
   JSON.stringify(original.sites)!==JSON.stringify(actual.sites)||JSON.stringify(original.opaqueProducers)!==JSON.stringify(actual.opaqueProducers)||
   JSON.stringify(original.observed.helpers.map(h=>h.raw))!==JSON.stringify(actual.observed.helpers.map(h=>h.raw)))return reject('unproved-reference-site-or-helper');
  // Every identity present in the real input retains its exact name, group,
  // ordinal and definition/reuse role. New names need the producers below.
  for(let i=0;i<original.observed.refs.length;i++){
   const left=original.observed.refs[i],right=actual.observed.refs[i];
   if(left.attrs.name&&(left.attrs.name!==right.attrs.name||(left.group||'')!==(right.group||'')||(left.body===null)!==(right.body===null)))return reject('preexisting-reference-identity-changed');
  }
  const originalNames=new Set(original.observed.refs.filter(r=>r.attrs.name).map(r=>JSON.stringify([r.group||'',r.attrs.name]))),
   hasAnonymousDuplicates=v2216ReferenceReuseEdits(before,cfg).length>0;
  if(!hasAnonymousDuplicates)return reject('no-proved-anonymous-family');
  for(const variant of v222ReferenceBindingVariants(before,cfg)){
   const expected=v222ReferenceBindingRead(variant.text,cfg);if(!expected)continue;
   if(JSON.stringify(expected.state.topology)!==JSON.stringify(actual.state.topology))continue;
   if(actual.observed.refs.some(r=>r.attrs.name&&!originalNames.has(JSON.stringify([r.group||'',r.attrs.name]))&&!variant.generated.includes(r.attrs.name)))continue;
   const normalizedExpected=v222ReferenceBindingRead(v25ReferenceProofNormalization(variant.text,cfg),cfg),normalizedActual=v222ReferenceBindingRead(v25ReferenceProofNormalization(after,cfg),cfg);
   if(!normalizedExpected||!normalizedActual||JSON.stringify(normalizedExpected.state.calls)!==JSON.stringify(normalizedActual.state.calls)||
    JSON.stringify(normalizedExpected.state.definitions)!==JSON.stringify(normalizedActual.state.definitions)||
    JSON.stringify(normalizedExpected.state.opaqueCollectors)!==JSON.stringify(normalizedActual.state.opaqueCollectors))continue;
   return {accepted:true,reason:'',proof:{kind:'original-source-reference-only-binding',sourceHash:v24SyntaxHash(before),candidateHash:v24SyntaxHash(after),
    path:variant.path,preexistingNames:[...originalNames],referenceCount:original.observed.refs.length,helperCount:original.observed.helpers.length,
    siteHash:v24SyntaxHash(JSON.stringify(original.sites)),resolvedGraphHash:v24SyntaxHash(JSON.stringify(normalizedExpected.state.calls)),definitionsHash:v24SyntaxHash(JSON.stringify(normalizedExpected.state.definitions))}};
  }
  return reject('no-reference-only-producer-equivalence');
 }catch{return reject('unreadable-reference-only-proof');}finally{V222_REFERENCE_BINDING_ACTIVE.delete(key);}
}
function v222ReferenceBindingFallbackProof(before,after,result,cfg={}) {
 if(!result?.accepted||result.proof?.sourceHash!==v24SyntaxHash(before)||result.proof?.candidateHash!==v24SyntaxHash(after))return false;
 const fresh=v222ReferenceBindingFallback(before,after,cfg);return fresh.accepted&&JSON.stringify(fresh)===JSON.stringify(result);
}
// Cite compares the literal bodies of repeated named definitions. A native
// parameter alias cannot excuse changing just one member of that family.
// This observes the original input, independently of writer preferences.
function v222RawNamedDefinitionAudit(before,after,options={}) {
 if(typeof before!=='string'||typeof after!=='string'||before===after||before.length>4194304||after.length>4194304||!/<ref\b/i.test(before))return[];
 const cfg=pageContextOptions({...DEFAULTS,...options});
 if(cfg.sectionOnly||cfg.discussionPage||cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||
  cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.model&&cfg.model!=='wikitext'||
  !(cfg.namespaceNumber===0||v2215ArticleDraftContext(cfg,before)))return[];
 const original=v219RawNamedReferenceClasses(before),actual=v219RawNamedReferenceClasses(after),findings=[];let binding=null;
 for(const [identity,bodies]of original){
  const next=actual.get(identity);
  if(bodies.size!==1||!next||next.size<=1)continue;
  if(!binding)binding={sourceHash:v24SyntaxHash(before),candidateHash:v24SyntaxHash(after)};
  findings.push({code:'new-raw-named-reference-split',severity:'warning',start:-1,
   message:'Definições idênticas de uma referência passaram a ter códigos diferentes.',
   detail:{...binding,identityHash:v24SyntaxHash(identity),beforeBodies:1,afterBodies:next.size}});
 }
 return findings;
}
