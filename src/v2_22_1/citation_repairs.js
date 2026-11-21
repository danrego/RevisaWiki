// New field and value repairs keep the native archive-access guard.
// Only the affected citation owner is held; other owners remain independent.
function v2221CitationEditsPlan(source,edits,cfg={}) {
 if(!edits.length)return v222EditsPlan(source,edits);
 const blocked=[];
 for(const owner of templates(protectedView(source)).nodes){
  const owned=edits.filter(e=>owner.start<=e.start&&e.end<=owner.end);if(!owned.length)continue;
  const raw=source.slice(owner.start,owner.end);if(!v218CitationNativeContext(raw))continue;
  const after=v24SyntaxApply(raw,owned.map(e=>({...e,start:e.start-owner.start,end:e.end-owner.start}))),context=v221CitationArchiveSafetyContext(after);
  if(context&&!v221CitationOriginalAccessSafe(context))blocked.push(owner);
 }
 return v222EditsPlan(source,edits.filter(e=>!blocked.some(n=>n.start<=e.start&&e.end<=n.end)));
}
// Changes are bound to the pinned reader and to literal, nonconflicting fields.
function v2221CitationPreferredKey(key,reader) {
 const roleMap={Title:'título',URL:'url',Periodical:'obra',PublisherName:'publicado',AccessDate:'acessodata',ArchiveDate:'arquivodata',ArchiveURL:'arquivourl',Date:'data',Year:'ano',Language:'língua',Pages:'páginas',Page:'página',Volume:'volume',Issue:'número',Edition:'edição',Location:'local',Format:'formato',TitleType:'tipo'};
 const roles=v222CitationRoles(key,reader);if(roles.length!==1)return null;
 const matches=(pattern,value)=>{if(!pattern.includes('#'))return pattern===value;const [a,b]=pattern.split('#');return value.startsWith(a)&&value.endsWith(b)&&/^[1-9]\d*$/.test(value.slice(a.length,value.length-b.length||undefined));};
 for(const[from,to,revision]of V222_CATALOG.syntax.citationModel){if(revision!==reader.oldid)continue;if(matches(to,key))return key;if(matches(from,key))return v222CitationKeyTarget(key,reader);}
 const conventional=v2215PortugueseCitationKey(key);if(conventional)return conventional;
 if(!['ordinary','periodical'].includes(reader.kind))return null;
 // An interview subject is a native person alias, not an English surname key.
 if(/^(?:entrevistado|entrevistada)(?:[1-9]\d*)?$/.test(key))return key;
 if(/^(?:língua|idioma|language)[2-9]\d*$/.test(key))return key;
 if(/^(?:autor|autora|último|ultimo|primeiro|editor-sobrenome|editor-nome|editor-link|tradutor-sobrenome|tradutor-nome|tradutor-link|autorlink)(?:[1-9]\d*)?$/.test(key))return key;
 const role=roles[0],person=/^(AuthorList|EditorList|TranslatorList)-(First|Last|Link):([1-9]\d*)$/.exec(role);
 if(person){const names={AuthorList:{First:'primeiro',Last:'ultimo',Link:'autorlink'},EditorList:{First:'editor-nome',Last:'editor-sobrenome',Link:'editor-link'},TranslatorList:{First:'tradutor-nome',Last:'tradutor-sobrenome',Link:'tradutor-link'}},base=names[person[1]][person[2]];return base+(person[3]==='1'&&!/[1-9]\d*$/.test(key)?'':person[3]);}
 return roleMap[role]||v222CitationKeyTarget(key,reader);
}
function v2221CitationRepairKey(key,reader) {
 // Only known ASCII separators/case and invisible formatting characters may be
 // repaired. A field with a different lexical name remains untouched.
 const cleaned=key.replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g,'').trim(),lower=cleaned.toLowerCase();
 const finite={fechaacceso:'acessodata','fecha-acceso':'acessodata',fechaarchivo:'arquivodata','urlarchivo':'arquivourl',sitioweb:'obra','sitio-web':'obra',editorial:'publicado',año:'ano',année:'ano',langue:'língua',sprache:'língua',lingua:'língua',lingue:'língua',linguaggio:'língua',titel:'título',titolo:'título',titre:'título',páginas:'páginas',página:'página'};
 if(Object.hasOwn(finite,lower))return finite[lower];
 if(cleaned!==key||lower!==key){const target=v2221CitationPreferredKey(lower,reader)||v222CitationRepairTarget(lower,reader);if(target)return target;}
 return null;
}
function v2221CitationFieldsPlan(source,cfg={}) {
 const edits=[];if(!v222Scope(source,cfg)||cfg.citations===false||cfg.automaticParameterNames===false)return v2221CitationEditsPlan(source,edits,cfg);
 const shield=v222Protected(source),nodes=v24SyntaxTemplates(shield.view).nodes;
 for(const node of nodes){
  if(node.size!==2)continue;
  const raw=source.slice(node.start,node.end),syntax=v222Fields(raw),context=v218CitationNativeContext(raw),reader=context&&v2215CitationReader(context);
  if(!syntax||!reader)continue;
  const fields=syntax.fields;
  for(const field of fields){
   if(shield.view.slice(node.start+field.keyStart,node.start+field.keyEnd)!==field.key)continue;
   // URL-state repair has its own coupled key/value/conflict contract.
   if(v222CitationStateIntent(field.key))continue;
   const emptyRoles=v222CitationRoles(field.key,reader);
   if(/^[ \t]+$/.test(field.value)&&emptyRoles.length&&v222CitationTargetAccepted(context,field.key,reader)&&v222CitationUnique(field,emptyRoles,fields,reader)&&!fields.some(other=>other!==field&&[v2221CitationPreferredKey(other.key,reader),v2221CitationRepairKey(other.key,reader)].some(target=>target&&JSON.stringify(v222CitationRoles(target,reader))===JSON.stringify(emptyRoles)))){
    edits.push({start:node.start+field.valueStart,end:node.start+field.end,text:'',kind:'citation-empty-horizontal-margin',count:1,proof:{reader:reader.module,oldid:reader.oldid,key:field.key,roles:emptyRoles,emptyOnly:true,parameterRetained:true}});
   }
   const preferred=v2221CitationPreferredKey(field.key,reader),repair=preferred?null:v2221CitationRepairKey(field.key,reader),target=preferred||repair;
   if(!target||target===field.key||!v222CitationTargetAccepted(context,target,reader))continue;
   const roles=v222CitationRoles(target,reader);if(!roles.length||!v222CitationUnique(field,roles,fields,reader))continue;
   if(preferred&&JSON.stringify(v222CitationRoles(field.key,reader))!==JSON.stringify(roles))continue;
   // A repair must not steal the role of a populated or even empty alias.
   if(fields.some(f=>f!==field&&(v2221CitationRepairKey(f.key,reader)===target||v2221CitationPreferredKey(f.key,reader)===target)))continue;
   edits.push({start:node.start+field.keyStart,end:node.start+field.keyEnd,text:target,kind:'citation-reader-key',count:1,proof:{reader:reader.module,oldid:reader.oldid,from:field.key,to:target,roles}});
  }
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2221CitationFieldsProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221CitationFieldsPlan);}
function v2221ISBNValid(text) {
 const compact=text.replace(/[ -]/g,'').toUpperCase();
 if(/^97[89]\d{10}$/.test(compact))return [...compact].reduce((s,c,i)=>s+(+c)*(i%2?3:1),0)%10===0;
 if(/^\d{9}[\dX]$/.test(compact))return [...compact].reduce((s,c,i)=>s+(c==='X'?10:+c)*(10-i),0)%11===0;
 return false;
}
function v2221ISSNValid(text) {
 if(!/^\d{4}-\d{3}[\dX]$/.test(text))return false;
 return [...text.replace('-','')].reduce((s,c,i)=>s+(c==='X'?10:+c)*(8-i),0)%11===0;
}
function v2221CitationAccessReader(reader) {
 return reader.module==='Módulo:Citar web'&&reader.oldid===48965255||reader.module==='Módulo:Citar periódico'&&reader.oldid===49463910;
}
function v2221CitationLanguageList(text) {
 const names={english:'en',inglês:'en',ingles:'en',french:'fr',français:'fr',francês:'fr',german:'de',deutsch:'de',alemão:'de',spanish:'es',español:'es',espanhol:'es',portuguese:'pt',português:'pt',italian:'it',italiano:'it',catalan:'ca',català:'ca',catalão:'ca',russian:'ru',русский:'ru',ukrainian:'uk',ukranian:'uk',japanese:'ja',japones:'ja',japonês:'ja',korean:'ko',coreano:'ko',chinese:'zh',chinês:'zh'};
 const tokens=text.trim().split(/\s*(?:\/|;|,)\s*/),mapped=tokens.map(t=>names[t.toLowerCase()]||(/^(?:en|fr|de|es|pt|it|ca|ru|uk|ja|ko|zh|ar|nl|sv|da|no|fi|tr|he|vi|th)(?:-(?:[A-Z]{2}|[A-Z][a-z]{3}))?$/.test(t)?t:null));
 return mapped.length&&mapped.every(Boolean)&&new Set(mapped).size===mapped.length?mapped:null;
}
function v2221CitationURLUnwrap(value) {
 const text=value.trim(),pairs={'“':'”','«':'»','`':'`','"':'"',"'":"'"};let inner=null;
 if(Object.hasOwn(pairs,text[0])&&text.endsWith(pairs[text[0]]))inner=text.slice(1,-1);
 else if(text.startsWith('{{')&&text.endsWith('}}')){
  const p=v24SyntaxParts(text.slice(2,-2));
  if(p&&p.length===2&&(v215SameTemplateTitle(p[0].text.trim(),'URL')||v215SameTemplateTitle(p[0].text.trim(),'Url'))){
   const argument=p[1].text.trim(),named=/^1[ \t]*=[ \t]*([\s\S]+)$/.exec(argument);
   if(named)inner=named[1].trim();else if(!argument.includes('='))inner=argument;
  }
 }
 if(inner===null||!v222CitationURLLiteral(inner)||/[?#]$/.test(inner))return null;
 try{const url=new URL(inner);if(!['http:','https:'].includes(url.protocol)||!url.hostname||url.username||url.password)return null;}catch(_){return null;}
 const at=value.indexOf(text);return value.slice(0,at)+inner+value.slice(at+text.length);
}
function v2221CitationLiteralValue(field,roles,fields,reader,cfg={}) {
 const text=field.value.trim();let next=null;
 if(roles.some(r=>['URL','ArchiveURL','ChapterURL'].includes(r))){const unwrapped=v2221CitationURLUnwrap(field.value);if(unwrapped!==null)return unwrapped;}
 if(roles.includes('Identifier:ISBN')){
  const m=/^(?:ISBN(?:-1[03])?:?[ \t]+)+([\dXx -]+)$/.exec(text);
  if(m&&v2221ISBNValid(m[1]))next=m[1];
 }
 if(roles.includes('Identifier:DOI')){
  const m=/^(?:doi\s*:\s*|https?:\/\/(?:dx\.)?doi\.org\/)(10\.\d{4,9}\/[^\s<>"{}|?#]+)$/i.exec(text);if(m)next=m[1];
 }
 if(roles.includes('Identifier:ISSN')){const m=/^ISSN:?\s+(\d{4}-\d{3}[\dX])$/.exec(text);if(m){const compact=m[1].replace('-','');if([...compact].reduce((s,c,i)=>s+(c==='X'?10:+c)*(8-i),0)%11===0)next=m[1];}}
 if(roles.includes('Language')){
  const mapped=v2221CitationLanguageList(text);if(mapped)next=mapped.join(', ');
 }
 if(roles.includes('UrlAccess')&&v2221CitationAccessReader(reader)){
  const values={assinatura:'subscrição',subscription:'subscrição',registration:'registro',limited:'limitada',limitado:'limitada'};
  if(Object.hasOwn(values,text))next=values[text];
 }
 if(roles.some(r=>/^AuthorList-Link:|^EditorList-Link:/.test(r))){const m=/^\[\[([^\[\]{}|#\r\n]+)\]\]$/.exec(text);if(m)next=m[1];}
 if(roles.some(r=>['URL','ArchiveURL','ChapterURL'].includes(r))&&/[\r\n]/.test(text)&&!/[{}<>\[\]|]/.test(text)){
  // A second explicit address is not a continuation of the first URL.
  const wrap=/^(https?:\/\/[^\s]+[^\s])\r?\n([^\s][^\s]*)$/.exec(text);
  if(wrap&&!/^(?:[a-z][a-z\d+.-]*:|\/\/|www\.)/i.test(wrap[2])){const joined=wrap[1]+wrap[2];try{const url=new URL(joined);if(['https:','http:'].includes(url.protocol)&&url.hostname.includes('.')&&!url.username&&!url.password)next=joined;}catch(_){}}
 }
 if(next===null||next===text)return null;
 const at=field.value.indexOf(text);return field.value.slice(0,at)+next+field.value.slice(at+text.length);
}
function v2221CitationValuesPlan(source,cfg={}) {
 const edits=[];if(!v222Scope(source,cfg)||cfg.citations===false)return v2221CitationEditsPlan(source,edits,cfg);
 const shield=v222Protected(source);
 for(const node of v24SyntaxTemplates(shield.view).nodes){
  if(node.size!==2)continue;const raw=source.slice(node.start,node.end),syntax=v222Fields(raw),context=v218CitationNativeContext(raw),reader=context&&v2215CitationReader(context);if(!syntax||!reader)continue;
  const fields=syntax.fields,effective=new Map(),add=(f,text,kind)=>edits.push({start:node.start+f.valueStart,end:node.start+f.end,text,count:1,kind,proof:{reader:reader.module,oldid:reader.oldid,key:f.key}});
  for(const field of fields){const roles=v222CitationRoles(field.key,reader);if(!roles.length||!v222CitationUnique(field,roles,fields,reader))continue;
   const value=v2221CitationLiteralValue(field,roles,fields,reader,cfg);
   if(shield.view.slice(node.start+field.valueStart,node.start+field.end)!==field.value){
    const unwrap=roles.some(r=>['URL','ArchiveURL','ChapterURL'].includes(r))&&v2221CitationURLUnwrap(field.value);
    if(!unwrap||value!==unwrap||shield.ranges.some(r=>r.start<node.start+field.end&&node.start+field.valueStart<r.end&&(r.kind!=='quotation'||r.start<node.start+field.valueStart||r.end>node.start+field.end)))continue;
   }
   if(value!==null){add(field,value,'citation-typed-literal');effective.set(field,value);}
  }
  const titles=fields.filter(f=>v222CitationRoles(f.key,reader).includes('Title')),urls=fields.filter(f=>v222CitationRoles(f.key,reader).includes('URL'));
  if(titles.length<=1&&(!titles.length||!titles[0].value.trim())&&urls.length===1&&v222CitationURLLiteral(effective.get(urls[0])??urls[0].value)&&v222CitationTargetAccepted(context,'título',reader)){
   try{const url=new URL((effective.get(urls[0])??urls[0].value).trim()),host=url.hostname;if(!url.username&&!url.password&&host.includes('.')&&/^[a-z0-9.-]+$/i.test(host)&&!/^\d+(?:\.\d+){3}$/.test(host)){
    if(titles.length)add(titles[0],host,'citation-host-label');
    else edits.push({start:node.end-2,end:node.end-2,text:'|título='+host,count:1,kind:'citation-host-label',proof:{reader:reader.module,oldid:reader.oldid,host}});
   }}catch(_){}
  }
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2221CitationValuesProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221CitationValuesPlan);}
function v2221CitationLanguagesPlan(source,cfg={}) {
 const edits=[];if(!v222Scope(source,cfg)||cfg.citations===false||cfg.automaticParameterNames===false)return v2221CitationEditsPlan(source,edits,cfg);
 const shield=v222Protected(source);
 for(const node of v24SyntaxTemplates(shield.view).nodes){
  if(node.size!==2)continue;const raw=source.slice(node.start,node.end),syntax=v222Fields(raw),context=v218CitationNativeContext(raw),reader=context&&v2215CitationReader(context);
  if(!syntax||!reader||!v2221CitationAccessReader(reader))continue;
  const secondary=syntax.fields.filter(f=>f.key==='língua2'),primary=syntax.fields.filter(f=>f.key!=='língua2'&&v222CitationRoles(f.key,reader).includes('Language'));
  if(secondary.length!==1||primary.length!==1||syntax.fields.some(f=>/^(?:language|língua|idioma)[3-9]\d*$/.test(f.key)))continue;
  const a=primary[0],b=secondary[0],left=v2221CitationLanguageList(a.value),right=v2221CitationLanguageList(b.value);
  if(!left||!right||right.length!==1||!v222CitationTargetAccepted(context,a.key,reader)||[a,b].some(f=>shield.view.slice(node.start+f.valueStart,node.start+f.end)!==f.value))continue;
  const value=[...new Set([...left,...right])].join(', ');
  if(a.value.trim()!==value)edits.push({start:node.start+a.valueStart,end:node.start+a.end,text:value,count:1,kind:'citation-language-list',proof:{reader:reader.module,oldid:reader.oldid,values:[a.value,b.value]}});
  edits.push({start:node.start+b.start-1,end:node.start+b.end,text:'',count:1,kind:'citation-language-extra-slot',proof:{reader:reader.module,oldid:reader.oldid,target:a.key,allCodesRetained:value}});
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2221CitationLanguagesProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221CitationLanguagesPlan);}
function v2221CitationRoleAt(fields,reader,role) {return fields.filter(f=>v222CitationRoles(f.key,reader).includes(role));}
function v2221CitationStructuredFieldsPlan(source,cfg={}) {
 const edits=[];if(!v222Scope(source,cfg)||cfg.citations===false)return v2221CitationEditsPlan(source,edits,cfg);
 const shield=v222Protected(source);
 for(const node of v24SyntaxTemplates(shield.view).nodes){
  if(node.size!==2)continue;const raw=source.slice(node.start,node.end),syntax=v222Fields(raw),context=v218CitationNativeContext(raw),reader=context&&v2215CitationReader(context);if(!syntax||!reader)continue;
  const fields=syntax.fields;
  for(const field of fields){
   const roles=v222CitationRoles(field.key,reader),first=roles.length===1&&/^AuthorList-First:([1-9]\d*)$/.exec(roles[0]);
   const alternativeAuthors=fields.some(other=>other!==field&&(/^(?:vauthors|authors|autores|coauthors|coautores|lastauthoramp|author-mask|máscaraautor)(?:[1-9]\d*)?$/i.test(other.key)||v222CitationRoles(other.key,reader).some(role=>/^AuthorList-/.test(role)&&role!=='AuthorList-Link:'+first?.[1]&&!/^AuthorList-First:/.test(role))));
   if(first&&!alternativeAuthors&&cfg.automaticParameterNames!==false&&!v2221CitationRoleAt(fields,reader,'AuthorList-Last:'+first[1]).length&&v222CitationUnique(field,roles,fields,reader)&&/^[\p{L}\p{M} .,'’()-]+$/u.test(field.value.trim())&&field.value.trim()){
    const key='autor'+(first[1]==='1'&&!/1$/.test(field.key)?'':first[1]);if(v222CitationTargetAccepted(context,key,reader))edits.push({start:node.start+field.keyStart,end:node.start+field.keyEnd,text:key,count:1,kind:'citation-unsplit-author',proof:{reader:reader.module,oldid:reader.oldid,from:field.key,to:key}});
   }
   if(roles.includes('Volume')&&v222CitationUnique(field,roles,fields,reader)&&!v2221CitationRoleAt(fields,reader,'Issue').length&&!v2221CitationRoleAt(fields,reader,'Pages').length&&!v2221CitationRoleAt(fields,reader,'Page').length){
    const match=/^\s*(?:Vol\.?|volume)\s*([1-9]\d*)\s*,\s*(?:n\.?[ºo°]?\.?|número|no\.)\s*([1-9]\d*)\s*,\s*pp?\.\s*([1-9]\d*(?:[–-][1-9]\d*)?)\s*$/i.exec(field.value);
    if(match&&v222CitationTargetAccepted(context,'número',reader)&&v222CitationTargetAccepted(context,'páginas',reader))edits.push({start:node.start+field.valueStart,end:node.start+field.end,text:match[1]+'|número='+match[2]+'|páginas='+match[3],count:3,kind:'citation-explicit-locators',proof:{reader:reader.module,oldid:reader.oldid,labels:true}});
   }
   if(/^Citar livro$/i.test(syntax.header.trim())&&roles.includes('Title')&&v222CitationUnique(field,roles,fields,reader)){
    const m=/^([ \t]*)''([^'\r\n]+)''([ \t]*)$/.exec(field.value);if(m)edits.push({start:node.start+field.valueStart,end:node.start+field.end,text:m[1]+m[2]+m[3],count:1,kind:'citation-native-book-italics',proof:{reader:reader.module,oldid:reader.oldid}});
   }
   const identifier=roles.length===1&&/^Identifier:(DOI|ISBN|ISSN|PMID|PMC)$/.exec(roles[0]);
   if(identifier&&v222CitationUnique(field,roles,fields,reader)&&new RegExp('^'+identifier[1]+':?$','i').test(field.value.trim()))edits.push({start:node.start+field.valueStart,end:node.start+field.end,text:'',count:1,kind:'citation-empty-identifier-label',proof:{reader:reader.module,oldid:reader.oldid,identifier:identifier[1],noIdentifierValue:true}});
  }
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2221CitationStructuredFieldsProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221CitationStructuredFieldsPlan);}
function v2221CitationHeaderEquivalent(raw,target) {
 const before=v218CitationNativeContext(raw),oldReader=before&&v2215CitationReader(before),fields=v222Fields(raw);
 if(!fields||!oldReader||fields.parts.length!==fields.fields.length+1)return null;
 const next='{{'+target+raw.slice(2+fields.header.length),after=v218CitationNativeContext(next),newReader=after&&v2215CitationReader(after);
 if(!after||!newReader)return null;
 for(const f of fields.fields){
  const roles=v222CitationRoles(f.key,oldReader),newRoles=v222CitationRoles(f.key,newReader);
  if(!roles.length||JSON.stringify(roles)!==JSON.stringify(newRoles)||!v222CitationUnique(f,roles,fields.fields,oldReader)||!v222CitationTargetAccepted(after,f.key,newReader))return null;
 }
 return {text:next,sourceReader:oldReader.module,sourceOldid:oldReader.oldid,targetReader:newReader.module,targetOldid:newReader.oldid};
}
function v2221CitationHeadersPlan(source,cfg={}) {
 const edits=[];if(!v222Scope(source,cfg)||cfg.citations===false||cfg.multilingual===false)return v2221CitationEditsPlan(source,edits,cfg);
 const shield=v222Protected(source),nodes=v24SyntaxTemplates(shield.view).nodes;
 for(const node of nodes){
  if(node.size!==2)continue;const raw=source.slice(node.start,node.end),syntax=v222Fields(raw),context=v218CitationNativeContext(raw),reader=context&&v2215CitationReader(context);if(!syntax||!reader)continue;
  const header=syntax.header.trim(),fields=syntax.fields,one=role=>{const rows=v2221CitationRoleAt(fields,reader,role);return rows.length===1?rows[0].value.trim():'';};let target=null,proof=null;
  if(/^(?:citar web|cite web)$/i.test(header)&&one('Title')&&!one('URL')&&!one('ArchiveURL')&&one('Periodical')&&/^[1-9]\d*$/.test(one('Volume'))&&/^[1-9]\d*$/.test(one('Issue'))&&v222CitationPageLocator(one('Pages')||one('Page'))&&(!one('Identifier:ISSN')||v2221ISSNValid(one('Identifier:ISSN'))))target='Citar periódico';
  if(/^(?:citar web|cite web)$/i.test(header)&&/^(?:Associação Brasileira de Normas Técnicas|ABNT)$/.test(one('AuthorList-Last:1'))&&/^NBR[ \t]+\d{3,6}(?:[-:]\d+)?\b/.test(one('Title'))&&one('Year'))target='Citar relatório técnico';
  if(target){proof=v2221CitationHeaderEquivalent(raw,target);if(!proof)continue;}
  else if(!/^(?:Citar\b|Citação\b|Citation$)/i.test(header)){
   const migration=migrateForeignTemplate(raw,cfg);
   if(!migration||migration.blocked||migration.text===raw||!/^\{\{[ \t]*[Cc]itar\b/.test(migration.text)||!v221CitationMigrationSafe(raw,migration.text,cfg))continue;
   const parsed=v222Fields(migration.text);if(!parsed||parsed.fields.length!==fields.length)continue;
   // Existing source-bound translation owns both the header and parameters.
   edits.push({start:node.start,end:node.end,text:migration.text,count:Math.max(1,fields.filter((f,i)=>parsed.fields[i]?.key!==f.key).length+1),kind:'citation-source-bound-import',proof:{sourceHash:v24SyntaxHash(raw),candidateHash:v24SyntaxHash(migration.text)}});continue;
  }
  if(proof)edits.push({start:node.start+2,end:node.start+2+syntax.header.length,text:target,count:1,kind:'citation-explicit-source-type',proof});
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2221CitationHeadersProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221CitationHeadersPlan);}
function v2221CitationEmptyCallsPlan(source,cfg={}) {
 const edits=[];if(!v222Scope(source,cfg)||cfg.citations===false)return v2221CitationEditsPlan(source,edits,cfg);
 const shield=v222Protected(source),nodes=v24SyntaxTemplates(shield.view).nodes,refs=v219NativeReferenceObserver(source).refs;
 for(const node of nodes){
  if(node.size!==2)continue;const raw=source.slice(node.start,node.end),syntax=v222Fields(raw),context=v218CitationNativeContext(raw);
  if(!syntax||!context||syntax.parts.length!==syntax.fields.length+1||syntax.fields.some(f=>f.value.trim()))continue;
  const freeOwner=refs.find(r=>r.valid&&r.body!==null&&r.close&&r.start<node.start&&node.end<=r.close.start);
  if(freeOwner&&!source.slice(freeOwner.start+freeOwner.raw.length,node.start).trim()){
   const tail=source.slice(node.end,freeOwner.close.start),free=/^[ \t\r\n]*\[(https?:\/\/[^\s<>{}\[\]|]+)[ \t]+([^\[\]{}<>\r\n|]+)\](?:[ \t]*[,.;]?[ \t]*(?:\(?[12]\d{3}\)?)\.?)?[ \t\r\n]*$/.exec(tail);
   if(free&&free[2].trim()&&v222CitationURLLiteral(free[1])){edits.push({start:node.start,end:node.end,text:'',count:1,kind:'citation-empty-before-complete-free-source',proof:{emptyHash:v24SyntaxHash(raw),sourceTextHash:v24SyntaxHash(tail),referenceName:freeOwner.attrs?.name||null}});continue;}
  }
  const next=nodes.filter(n=>n.size===2&&n.start>=node.end&&n.depth===node.depth).sort((a,b)=>a.start-b.start)[0];
  if(!next||source.slice(node.end,next.start).trim())continue;
  const reader=v2215CitationReader(context),nextRaw=source.slice(next.start,next.end),target=v218CitationNativeContext(nextRaw),targetReader=target&&v2215CitationReader(target),nextSyntax=v222Fields(nextRaw);
  if(!reader||!targetReader||!nextSyntax||reader.module!==targetReader.module)continue;
  const titles=v2221CitationRoleAt(nextSyntax.fields,targetReader,'Title'),urls=v2221CitationRoleAt(nextSyntax.fields,targetReader,'URL');
  if(titles.length!==1||!titles[0].value.trim()||urls.length!==1||!v222CitationURLLiteral(urls[0].value))continue;
  // Require both calls to be in the same complete literal reference body.
  const owner=refs.find(r=>r.body!==null&&r.start<node.start&&next.end<=r.end);
  if(!owner||!owner.valid)continue;
  edits.push({start:node.start,end:next.start,text:'',count:1,kind:'citation-empty-adjacent-call',proof:{sourceHash:v24SyntaxHash(raw),completeSourceHash:v24SyntaxHash(nextRaw)}});
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2221CitationEmptyCallsProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221CitationEmptyCallsPlan);}
