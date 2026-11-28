// Read duplicate infobox slots for counting only. This never edits a draft.
function v2222InfoboxCountFields(raw) {
 if(typeof raw!=='string'||raw.length>65536)return null;
 const parsed=v2221InfoboxRead(raw);if(!parsed||!/^Info\/|^Infobox(?:[ _]|$)/i.test(parsed.title)||parsed.fields.length>2048)return null;
 const headerEnd=parsed.fields.length?parsed.fields[0].start-1:raw.length-2;if(!Number.isInteger(parsed.headerStart)||!Number.isInteger(parsed.headerEnd)||parsed.headerStart<2||parsed.headerEnd<parsed.headerStart||parsed.headerEnd>headerEnd||headerEnd>raw.length-2||raw.slice(2,parsed.headerStart).trim()||raw.slice(parsed.headerEnd,headerEnd).trim())return null;
 const parts=[{text:raw.slice(2,headerEnd),start:0,end:headerEnd-2}],fields=[],slots=new Map(),occurrences=new Map();let previous=headerEnd;
 for(let i=0;i<parsed.fields.length;i++){
  const field=parsed.fields[i];if(![field.start,field.end,field.valueStart,field.valueEnd].every(Number.isInteger)||field.start!==previous+1||raw[field.start-1]!=='|'||field.end<field.start||field.end>raw.length-2||field.valueStart<field.start||field.valueEnd!==field.end||raw.slice(field.valueStart,field.valueEnd)!==field.value)return null;
  const part={text:raw.slice(field.start,field.end),start:field.start-2,end:field.end-2},equals=field.positional?-1:field.equal-field.start;
  if(field.positional){if(field.equal!==null||field.valueStart!==field.start)return null;}
  else if(!Number.isInteger(field.equal)||field.equal<field.start||field.equal>=field.end||raw[field.equal]!=='='||field.valueStart!==field.equal+1||raw.slice(field.keyStart,field.keyEnd)!==field.key)return null;
  const row={key:field.key,value:field.value,positional:field.positional,index:i+1,part,equals};parts.push(part);fields.push(row);slots.set(field.key,field.value);if(!occurrences.has(field.key))occurrences.set(field.key,[]);occurrences.get(field.key).push(row);previous=field.end;
 }
 if(previous!==raw.length-2||'{{'+parts.map(p=>p.text).join('|')+'}}'!==raw)return null;
 return {parts,fields,slots,occurrences};
}
// Read the original principal box with the writer's context and ownership
// guards. Counting cannot canonicalize, migrate or complete this source.
function v2222InfoboxCountPrincipalPersonBox(source,cfg={}) {
 if(!v28PotentialPersonSource(source))return null;
 if(cfg.namespaceNumber!==0||cfg.infoboxes===false||cfg.markup===false||cfg.pageRedirect||cfg.pageDisambiguation||cfg.sectionOnly||cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||!v24SyntaxScope(cfg)||/^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle||''))||/~{3,5}/.test(source)||discussionProtectionRanges(source,{discussionPage:true}).length)return null;
 const context=v27SafeContext(source,cfg);if(!context)return null;
 const nodes=biographyNodes(context.view).nodes,boxes=v2213PrincipalPersonNodes(source,nodes);if(boxes.length!==1)return null;
 const node=boxes[0],sourceRaw=source.slice(node.start,node.end),raw=sourceRaw,name=parsedTemplate(raw).name,profile=INFOBOX_CATALOG[name],fields=v28LiteralInfoboxFields(raw,name);if(!profile||!fields)return null;
 const firstSection=context.view.search(/^={2,6}[^=\n].*?={2,6}\s*$/m),lineEnd=source.indexOf('\n',node.end);
 if(firstSection>=0&&node.start>=firstSection||source.slice(source.lastIndexOf('\n',node.start-1)+1,node.start).trim()||source.slice(node.end,lineEnd<0?source.length:lineEnd).trim()||context.shield.ranges.some(range=>range.start<=node.start&&node.start<range.end)||v273MarriagePotentialInfobox(source.slice(0,node.start))||v273MarriagePotentialInfobox(source.slice(node.end)))return null;
 if(v2213PrincipalFlags(profile,fields))return null;
 const music=BIOGRAPHY_MUSIC_BOXES.has(name)||V273_MARRIAGE_MUSIC.has(name),person=BIOGRAPHY_INFOBOXES.has(name)||!music&&Object.hasOwn(V273_MARRIAGE_PROFILES,name);
 if(!person&&!music)return null;
 if(music){const types=fields.filter(field=>norm(field.key)==='fundo');if(types.length!==1||!BIOGRAPHY_SOLO_TYPES.has(norm(types[0].value))||fields.some(field=>['integrantes','exintegrantes'].includes(norm(field.key))&&field.value.trim()))return null;}
 return {context,node,sourceRaw,originalRaw:sourceRaw,raw,name,profile,fields};
}
// Reference bodies are opaque literal evidence here. Inventory normalization
// belongs to repair/retention, and can itself call repair producers.
function v2222InfoboxCountLeadReferenceBindings(value,source) {
 const refs=refTokens(value),definitions=new Map();
 for(const ref of refTokens(protectedView(source))){
  const attrs=attrsOf(ref.attrs);if(!attrs||!attrs.name||ref.body===null)continue;
  const key=JSON.stringify([attrs.group||'',attrs.name]),body=source.slice(ref.openEnd,ref.openEnd+ref.body.length);
  if(!definitions.has(key))definitions.set(key,new Set());definitions.get(key).add(body);
 }
 const bindings=[];
 for(const ref of refs){
  const attrs=attrsOf(ref.attrs);if(!attrs||Object.keys(attrs).some(key=>!['name','group'].includes(key)))return null;
  const group=attrs.group||'',name=attrs.name||'',bodies=ref.body===null?definitions.get(JSON.stringify([group,name])):new Set([ref.body]);
  if(!bodies||bodies.size!==1)return null;
  bindings.push([group,name,[...bodies][0]]);
 }
 return bindings;
}
// Recognize an endpoint-only lead addition from cited native infobox facts.
// This reads the two drafts; it never invokes a repair or completion producer.
function v2222InfoboxCountLeadProjection(before,after,cfg={}) {
 if(typeof before!=='string'||typeof after!=='string'||before===after||cfg.namespaceNumber!==0)return null;
 const left=v2151LeadOpening(before,cfg),right=v2151LeadOpening(after,cfg);if(!left||!right||left.tuple||!right.tuple||left.nameRaw!==right.nameRaw||left.verb!==right.verb||!['é','foi'].includes(left.verb))return null;
 const head=v2151LeadHead(before),box=head!==null&&v2222InfoboxCountPrincipalPersonBox(head,cfg);if(!box||!v215LiteralTemplateIdentity(box.raw,box.profile)||!v2151LeadTransferContract(box.profile))return null;
 if(box.fields.some(f=>/calend[aá]rio|calendar/i.test(f.key)&&f.value.trim()||['incorporar','subbox','subcaixa','nested','child','embed','embutido'].includes(norm(f.key))&&f.value.trim()&&!/^(?:não|nao|no|false|0)$/i.test(f.value.trim())))return null;
 const tuple=v2151LeadProofTuple(right.tuple.raw,after,cfg);if(!tuple||tuple.birth.reversed||tuple.death?.reversed||left.verb==='é'&&tuple.death)return null;
 const facts=Object.fromEntries(['birthDate','birthPlace','deathDate','deathPlace'].map(k=>[k,v2151LeadFactField(box,k,before)]));let count=0;const events=[];
 for(const[kind,part]of [['birth',tuple.birth],['death',tuple.death]]){if(!part)continue;if(part.suffix)return null;for(const type of ['Date','Place']){const actual=part[type.toLowerCase()],fact=facts[kind+type];if(!actual){if(type==='Date')return null;continue;}if(!fact||actual.identity!==fact.identity||type==='Date'&&actual.template!=='dataext')return null;const actualRefs=v2222InfoboxCountLeadReferenceBindings(actual.raw,after),factRefs=v2222InfoboxCountLeadReferenceBindings(fact.raw,before);if(!actualRefs?.length||!factRefs?.length||JSON.stringify(actualRefs)!==JSON.stringify(factRefs))return null;count++;events.push({kind:'native-cited-biography-lead-fact',role:kind+type,field:fact.key,count:1});}}
 if(!count||tuple.death&&(!facts.deathDate||tuple.death.date.stamp<tuple.birth.date.stamp))return null;
 const start=right.end,end=right.tupleEnd;if(after.slice(start,right.tupleStart)!==' ')return null;
 return {before,after:after.slice(0,start)+after.slice(end),count,events,native:{title:box.profile.title,revision:box.profile.oldid}};
}
