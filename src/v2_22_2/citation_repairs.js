// Native field roles, rather than a flat accepted-name list, own each rewrite.
function v2222CitationScope(source,cfg={}) {
 if(v222Scope(source,cfg))return true;
 return typeof source==='string'&&source.length<=4194304&&[12,14].includes(cfg.namespaceNumber)&&!cfg.discussionPage&&!cfg.sectionOnly&&!cfg.pageDisambiguation&&(!cfg.contentModel||cfg.contentModel==='wikitext')&&(!cfg.model||cfg.model==='wikitext');
}
// Reuse the established context witnesses only outside enclosing programs.
// This view changes no output bytes and retains every real quoted/code owner.
function v2222CitationUnpairedRootQuote(source,view,shield,at){
 const later=[];for(let q=source.indexOf('"',at+1);q>=0;q=source.indexOf('"',q+1))later.push(q);if(!later.length)return true;
 const data=[],literal=[];
 for(const range of shield.ranges){
  if(/^(?:<!--|<\s*(?:nowiki|pre|source|syntaxhighlight|math|chem|ce|score|timeline|graph|code|kbd|samp)\b)/i.test(source.slice(range.start,range.start+80)))literal.push(range);
  else if(range.kind==='quotation'&&!shield.unclosed.some(r=>r.start===range.start&&r.end===range.end)&&source[range.start]==='"'&&source[range.end-1]==='"')data.push(range);
 }
 if(later.some(q=>![...literal,...data].some(r=>r.start<=q&&q<r.end)))return false;
 const context=v2217ReferenceOwnerContext(v24SyntaxApply(source,[{start:at,end:at+1,text:' '}])),owned=[];
 for(const node of context.nodes){
  const raw=source.slice(node.start,node.end),native=v2222CitationContext(raw),reader=native&&v2215CitationReader(native),p=reader&&v222Fields(raw);if(!p||!v2217ReferenceLiteralCall(source,node,context))continue;
  for(const f of p.fields)if(!/[{}<>\r\n]/.test(f.value)&&!v2222CitationOpaqueField(f,native,reader))for(const range of data)if(node.start+f.valueStart<=range.start&&range.end<=node.start+f.end)owned.push(range);
 }
 return later.every(q=>[...literal,...owned].some(r=>r.start<=q&&q<r.end));
}
// Quotes inside a literal HTML owner cannot open a quotation in later prose.
// This projection is read only; the original nodes, fields and bytes stay put.
function v2222CitationOpaqueQuoteView(source,shield){
 const ranges=mergeEditorialRanges(shield.ranges.filter(r=>source[r.start]==='<'));
 return v24SyntaxApply(source,ranges.map(r=>({...r,text:source.slice(r.start,r.end).replace(/[^\r\n]/g,' ')})));
}
// A consumed reference has its own text flow. An unrelated prose quotation
// cannot make its native citation fields into quoted program text. Preserve
// every typed literal/program range and split only the legacy untyped ranges.
function v2222CitationReferenceQuoteContext(source,view,context,literals){
 const prose=structuralQuoteRanges(view),same=(a,b)=>a.start===b.start&&a.end===b.end;
 if(!prose.length||context.protected.length<prose.length||context.strict.literals.length<prose.length)return null;
 const tail=context.protected.slice(-prose.length),strictTail=context.strict.literals.slice(-prose.length);if(!prose.every((r,i)=>same(r,tail[i])&&same(r,strictTail[i])))return null;
 const typed=context.protected.slice(0,-prose.length),strict=context.strict.literals.slice(0,-prose.length),observed=v219NativeReferenceObserver(source),flows=[];
 if(observed.unclosed.length||observed.empties.length||observed.shield.unclosed.length||observed.refs.length>256)return null;
 for(const r of observed.refs){
  if(!r.valid||!r.renderer?.valid||r.container||r.body===null||!v24SyntaxLiteralIdentity(r.attrs)||typed.some(t=>t.start<=r.start&&r.start<t.end))continue;
  const raw=r.body.trim(),native=v2222CitationContext(raw),reader=native&&v2215CitationReader(native),p=reader&&v222Fields(raw);if(!p||p.parts.length!==p.fields.length+1)continue;
  const c=v219IndexedSyntaxContext(source,r.start);if(!c||['templates','html','tables','links','external'].some(k=>c[k].length))continue;flows.push(r);
 }
 if(!flows.some(r=>prose.some(p=>p.start<r.end&&r.start<p.end)))return null;
 const split=[];for(const range of prose){let at=range.start;for(const r of flows){if(r.end<=at||r.start>=range.end)continue;if(r.start>at)split.push({...range,start:at,end:r.start});at=Math.max(at,r.end);if(at>=range.end)break;}if(at<range.end)split.push({...range,start:at,end:range.end});}
 return{protected:[...typed,...split,...literals],literals:[...strict,...split,...literals]};
}
function v2222CitationOwnerContext(source){
 const shield=v222Protected(source),view=shield.view,edits=[],links=editorialWikiLinkRanges(view),tags=[];
 // A complete tag owns its attribute quotes even when a prose-quote scan
 // jumps into that tag. Masking an attribute would corrupt the read view.
 for(let at=0;at<view.length;){const tag=v24SyntaxTag(view,at);if(tag){tags.push({start:tag.start,end:tag.end});at=tag.end;}else at++;}
 const rootAt=at=>{if(tags.some(tag=>tag.start<=at&&at<tag.end))return false;const state=v24SyntaxContext(view,at);return !['templates','html','tables','links','external'].some(key=>state[key]?.length);};
 for(let at=0;at<view.length;){
  const end=v2221FileNameQuoteEnd(view,at);
  if(end!==null&&rootAt(at)&&links.some(link=>link.start===at&&link.end>=end)){for(let q=at;q<end;q++)if(view[q]==='"')edits.push({start:q,end:q+1,text:' '});at=end;continue;}
  if(view[at]==='"'){
   if(v2221ClosingProseQuote(view,at)&&rootAt(at)&&v2222CitationUnpairedRootQuote(source,view,shield,at)){edits.push({start:at,end:at+1,text:' '});at++;continue;}
   const close=view.indexOf('"',at+1);if(close<0)break;at=close+1;continue;
  }
  at++;
 }
 const projected=edits.length?v24SyntaxApply(source,edits):source,context=v2217ReferenceOwnerContext(projected),protectedSource=v222Protected(projected),quoteView=v2222CitationOpaqueQuoteView(projected,protectedSource);
 const quotations=v2217ReferenceOwnerContext(quoteView),literals=protectedSource.ranges.filter(r=>projected[r.start]==='<'),referenceFlow=v2222CitationReferenceQuoteContext(projected,quoteView,quotations,literals);
 if(referenceFlow){context.protected=referenceFlow.protected;context.strict={...context.strict,literals:referenceFlow.literals};}
 else if(quoteView!==projected){
  context.protected=[...quotations.protected,...literals];
  context.strict={...context.strict,literals:[...quotations.strict.literals,...literals]};
 }
 return context;
}
// A legacy source-state repair is one coupled native key/value operation.
// Its exact value span may be retained only with its independently checked key.
function v2222CitationCoupledStateEdits(source,scope,edits){
 const accepted=new Set(),eligible=new Set(scope.eligible.map(x=>x.node.start+':'+x.node.end));
 for(const call of scope.calls){
  const pin=V2215_CITATION_READER_PINS[call.reader.module];if(!eligible.has(call.node.start+':'+call.node.end)||!pin||pin[0]!==call.reader.oldid||!v222CitationTargetAccepted(call.native,'urlmorta',call.reader)||JSON.stringify(v222CitationRoles('urlmorta',call.reader))!==JSON.stringify(['DeadURL']))continue;
  const p=v222Fields(call.raw),states=p?.fields.filter(f=>v222CitationStateIntent(f.key)||v222CitationRoles(f.key,call.reader).some(role=>role==='DeadURL'||role==='UrlStatus'));if(states?.length!==1)continue;const f=states[0];if(f.key!=='status-url'||f.value.trim()!=='dead')continue;
  const base=call.node.start,valueStart=base+f.valueStart+f.value.indexOf('dead'),keys=edits.filter(e=>e.kind==='citation-dead-key'&&e.start===base+f.keyStart&&e.end===base+f.keyEnd&&e.text==='urlmorta'),values=edits.filter(e=>e.kind==='citation-dead-state'&&e.start===valueStart&&e.end===valueStart+4&&e.text==='sim');
  if(keys.length!==1||values.length!==1||edits.some(e=>e!==keys[0]&&e!==values[0]&&(e.start<keys[0].end&&keys[0].start<e.end||e.start<values[0].end&&values[0].start<e.end)))continue;
  const candidate=v24SyntaxApply(call.raw,[keys[0],values[0]].map(e=>({...e,start:e.start-base,end:e.end-base}))),next=v222Fields(candidate),state=next?.fields.filter(f=>v222CitationStateIntent(f.key)||v222CitationRoles(f.key,call.reader).some(role=>role==='DeadURL'||role==='UrlStatus'));
  if(state?.length!==1||state[0].key!=='urlmorta'||state[0].value.trim()!=='sim')continue;accepted.add(keys[0]);accepted.add(values[0]);
 }
 return accepted;
}
function v2222CitationContext(raw) {
 const native=v218CitationNativeContext(raw);if(native)return native;
 // Native newspaper wrapper, permanent revision 55834874.
 const p=v222Fields(raw);return p&&/^citar noticia$/i.test(p.header.trim())?v218CitationNativeContext('{{Citar jornal'+raw.slice(2+p.header.length)):null;
}
function v2222CitationKey(key,reader) {
 const finite={tradtítulo:'títulotrad',dataarquivo:'arquivodata','data-arquivo':'arquivodata','conferencia-url':'conferência-url','urlconferência':'conferência-url'};
 if(Object.hasOwn(finite,key))return finite[key];
 if(/^(?:autor|autora|ultimo|último|primeiro|autorlink)(?:[1-9]\d*)?$/.test(key))return key;
 const fullAuthor=/^author([1-9]\d*)?$/.exec(key);if(fullAuthor)return 'autor'+(fullAuthor[1]||'');
 let m=/^editor([1-9]\d*)-(sobrenome|nome|link)$/.exec(key);if(m)return 'editor-'+m[2]+m[1];
 m=/^tradutor-(sobrenome|nome)([1-9]\d*)?$/.exec(key);if(m)return 'tradutor-'+(m[1]==='sobrenome'?'ultimo':'primeiro')+(m[2]||'');
 // A wrapper's named fields own its public contract. Internal CS1 roles may
 // represent a game platform as Volume or a developer as AuthorList-Last.
 // Prefer the pinned outer-reader aliases before any generic role spelling.
 const nativeTarget=v2221CitationPreferredKey(key,reader);if(nativeTarget)return nativeTarget;
 if(!['ordinary','periodical'].includes(reader.kind))return null;
 const roles=v222CitationRoles(key,reader);if(roles.length!==1)return null;
 const names={Title:'título',TransTitle:'títulotrad',BookTitle:'títulolivro',Chapter:'capítulo',ChapterURL:'capítulourl',Conference:'conferência',ConferenceURL:'conferência-url',URL:'url',Periodical:'obra',PublisherName:'publicado',AccessDate:'acessodata',ArchiveDate:'arquivodata',ArchiveURL:'arquivourl',Date:'data',Year:'ano',Language:'língua',Pages:'páginas',Page:'página',Volume:'volume',Issue:'número',Edition:'edição',Location:'local',Format:'formato',TitleType:'tipo',Mode:'modo',Class:'classe',ScriptTitle:'título-translit',ScriptChapter:'capitulo-translit',DisplayAuthors:'numero-autores'};
 const person=/^(AuthorList|EditorList|TranslatorList)-(First|Last|Link):([1-9]\d*)$/.exec(roles[0]);
 if(person){const base={AuthorList:{First:'primeiro',Last:'ultimo',Link:'autorlink'},EditorList:{First:'editor-nome',Last:'editor-sobrenome',Link:'editor-link'},TranslatorList:{First:'tradutor-primeiro',Last:'tradutor-ultimo',Link:'tradutor-link'}}[person[1]][person[2]];return base+(person[3]==='1'&&!/[1-9]\d*$/.test(key)?'':person[3]);}
 return names[roles[0]]||null;
}
function v2222CitationRolesForRepair(key,reader) {
 const target=v2222CitationKey(key,reader);return v222CitationRoles(key,reader).length?v222CitationRoles(key,reader):target?v222CitationRoles(target,reader):[];
}
function v2222CitationDateIdentity(value) {
 const parsed=v218CitationDateValue(value.trim(),'archive')||v219SupplementalCitationDateValue(value.trim(),'archive');
 if(parsed?.precision==='day'&&parsed.identity&&validDate(parsed.identity.day,parsed.identity.month,parsed.identity.year))return parsed.identity;
 return null;
}
function v2222CitationFieldsPlan(source,cfg={}) {
 const edits=[];if(!v2222CitationScope(source,cfg)||cfg.citations===false||cfg.automaticParameterNames===false)return v2221CitationEditsPlan(source,edits,cfg);
 const shield=v222Protected(source);
 for(const n of v24SyntaxTemplates(shield.view).nodes){
  if(n.size!==2)continue;const raw=source.slice(n.start,n.end),p=v222Fields(raw),context=v2222CitationContext(raw),reader=context&&v2215CitationReader(context);if(!p||!reader)continue;
  const fields=p.fields,stateFields=fields.filter(f=>v222CitationStateIntent(f.key)||v222CitationRoles(f.key,reader).some(role=>['DeadURL','UrlStatus'].includes(role)));
  for(const f of fields){
   if(stateFields.length>1&&stateFields.includes(f))continue;
   if(shield.view.slice(n.start+f.keyStart,n.start+f.keyEnd)!==f.key)continue;
   // The existing generic-citation type proof still needs the distinction
   // between journal and newspaper fields. Do not erase it before that stage.
   if(/^citation$/i.test(p.header.trim())&&v222CitationRoles(f.key,reader).includes('Periodical'))continue;
   const target=v2222CitationKey(f.key,reader);if(!target||target===f.key||!v222CitationTargetAccepted(context,target,reader))continue;
   const roles=v222CitationRoles(target,reader),oldRoles=v222CitationRoles(f.key,reader);if(!roles.length||oldRoles.length&&JSON.stringify(roles)!==JSON.stringify(oldRoles))continue;
   const others=fields.filter(g=>g!==f&&v2222CitationRolesForRepair(g.key,reader).some(r=>roles.includes(r)));
   if(others.length){
    // A misspelled archive-date alias can be redundant, but never wins a conflict.
    if(['dataarquivo','data-arquivo'].includes(f.key)&&others.length===1&&v222CitationRoles(others[0].key,reader).includes('ArchiveDate')){
     const a=v2222CitationDateIdentity(f.value),b=v2222CitationDateIdentity(others[0].value),archives=fields.filter(g=>v222CitationRoles(g.key,reader).includes('ArchiveURL'));
     if(a&&b&&JSON.stringify(a)===JSON.stringify(b)&&archives.length===1&&v222CitationURLLiteral(archives[0].value))edits.push({start:n.start+f.start-1,end:n.start+f.end,text:'',count:1,kind:'citation-redundant-archive-date',proof:{reader:reader.oldid,date:a,retainedKey:others[0].key}});
    }continue;
   }
   if(['dataarquivo','data-arquivo'].includes(f.key)&&(!v2222CitationDateIdentity(f.value)||fields.filter(g=>v222CitationRoles(g.key,reader).includes('ArchiveURL')&&v222CitationURLLiteral(g.value)).length!==1))continue;
   edits.push({start:n.start+f.keyStart,end:n.start+f.keyEnd,text:target,count:1,kind:'citation-native-role-key',proof:{reader:reader.oldid,from:f.key,to:target,roles}});
  }
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2222CitationFieldsProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2222CitationFieldsPlan);}
// An explicit imported state may be ignored by the local consumer. This is
// a source-bound state activation, not a claim that both parameter names alias.
function v2222CitationStatePlan(source,cfg={}){
 const edits=[];if(!v2222CitationScope(source,cfg)||cfg.citations===false||cfg.automaticParameterNames===false||!/(?:url-status|url-estado|statusurl|urlmorto|dead-url|deadurl)[ \t\r\n]*=/.test(source))return v2221CitationEditsPlan(source,edits,cfg);const shield=v222Protected(source);
 for(const {node:n,raw} of v2222CitationStateOwners(source,cfg)){const p=v222Fields(raw),c=p&&v2222CitationContext(raw),r=c&&v2215CitationReader(c);if(!p||!r||!v2222CitationStateAdmission(raw,cfg)||![[48965255,'Módulo:Citar web'],[49448102,'Módulo:Citar livro'],[49463910,'Módulo:Citar periódico']].some(([id,name])=>r.oldid===id&&r.module===name))continue;
  const states=p.fields.filter(f=>v222CitationStateIntent(f.key));if(states.length!==1)continue;const f=states[0],literal=f.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');if(literal!==f.value.trim())continue;const value=({dead:'sim',live:'não',morto:'sim',ativo:'não','ao vivo':'não'})[literal];if(!value||!['url-status','url-estado','statusurl','urlmorto','dead-url','deadurl'].includes(f.key)||!v222CitationTargetAccepted(c,'urlmorta',r))continue;
  const urls=p.fields.filter(x=>v222CitationRoles(x.key,r).includes('URL')),archives=p.fields.filter(x=>v222CitationRoles(x.key,r).includes('ArchiveURL')),dates=p.fields.filter(x=>v222CitationRoles(x.key,r).includes('ArchiveDate')),chapters=p.fields.filter(x=>v222CitationRoles(x.key,r).includes('ChapterURL')&&x.value.trim());if(chapters.length>1||chapters.length&&r.module!=='Módulo:Citar livro'&&r.module!=='Módulo:Citar web')continue;const effective=chapters.length&&r.module==='Módulo:Citar livro'?chapters[0]:urls[0];if(!effective||!v2222CitationLiteralURL(effective.value.trim()))continue;if(urls.length!==1||archives.length!==1||dates.length!==1||!v2222CitationLiteralURL(urls[0].value.trim())||!v2222CitationLiteralURL(archives[0].value.trim()))continue;const date=v2222CitationDateIdentity(dates[0].value),match=/^https?:\/\/web\.archive\.org\/web\/(\d{8}|\d{14})(?:[a-z_]+)?\/(https?:\/\/[\s\S]+)$/.exec(archives[0].value.trim());if(!date||!match||match[2]!==effective.value.trim()||Number(match[1].slice(0,4))!==date.year||Number(match[1].slice(4,6))!==date.month||Number(match[1].slice(6,8))!==date.day||match[1].length===14&&(Number(match[1].slice(8,10))>=24||Number(match[1].slice(10,12))>=60||Number(match[1].slice(12,14))>=60))continue;
  if(shield.view.slice(n.start+f.keyStart,n.start+f.keyEnd)!==f.key||shield.view.slice(n.start+f.valueStart,n.start+f.end)!==f.value)continue;const replacement='urlmorta'+raw.slice(f.keyEnd,f.valueStart)+f.value.replace(f.value.trim(),value),next=raw.slice(0,f.keyStart)+replacement+raw.slice(f.end);if(!v221CitationMigrationSafe(raw,next))continue;edits.push({start:n.start+f.keyStart,end:n.start+f.end,text:replacement,count:2,kind:'source-proved-native-archive-state',proof:{reader:r.module,oldid:r.oldid,from:f.key,sourceValue:f.value.trim(),target:'urlmorta',targetValue:value,originalURL:urls[0].value,effectiveArchivedOriginal:effective.value,archiveURL:archives[0].value,archiveDate:dates[0].value,nativeCOinS:'unchanged',intent:'explicit-state'}});
 }return v2221CitationEditsPlan(source,edits,cfg);
}
function v2222CitationStateProof(before,after,plan,cfg={}){return v222PlanProof(before,after,plan,cfg,v2222CitationStatePlan);}
function v2222CitationISSN(value) {
 const s=value.replace(/[ -]/g,'').toUpperCase();if(!/^\d{7}[\dX]$/.test(s))return null;const out=s.slice(0,4)+'-'+s.slice(4);return v2221ISSNValid(out)?out:null;
}
function v2222CitationIdentifierTypography(value) {
 return value.replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0)).replace(/[Ｘｘ]/g,'X').replace(/[‐‑‒–—−﹣－]/g,'-').replace(/[\u00a0\u2007\u202f]/g,' ');
}
function v2222CitationArxiv(value) {
 const id='(?:\\d{4}\\.\\d{4,5}|[a-z][a-z.-]+/\\d{7})(?:v[1-9]\\d*)?';
 let m=new RegExp('^https?://arxiv\\.org/pdf/('+id+')(?:\\.pdf)?$','i').exec(value);if(m)return m[1];
 m=new RegExp('^(?:arXiv:)?('+id+')$','i').exec(value);return m?m[1]:null;
}
function v2222CitationLiteralURL(value) {
 if(!v222CitationURLLiteral(value))return false;
 try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i.test(u.hostname);}catch(_){return false;}
}
function v2222CitationPageList(value) {
 const atom='(?:[A-Z]?[1-9]\\d*|[ivxlcdmIVXLCDM]+)',part=atom+'(?:[ \\t]*[–-][ \\t]*'+atom+')?';return new RegExp('^'+part+'(?:[ \\t]*,[ \\t]*'+part+')*$').test(value);
}
function v2222CitationGoogleBooks(value) {
 const p=value.startsWith('{{')&&value.endsWith('}}')&&v222Fields(value);if(!p||!/^google books$/i.test(p.header.trim())||p.parts.length!==p.fields.length+1)return null;
 const m=new Map();for(const f of p.fields){if(m.has(f.key)||!['id','page','pg','text','keywords','plainurl','plain-url'].includes(f.key))return null;m.set(f.key,f.value.trim());}
 if(!/^(?:yes|true|1)$/i.test(m.get('plainurl')||m.get('plain-url')||'')||m.has('plainurl')&&m.has('plain-url')||!/^[-A-Za-z0-9_]+$/.test(m.get('id')||'')||m.has('page')&&m.has('pg'))return null;
 const encode=s=>encodeURIComponent(s).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g,'+');let url='https://books.google.com/books?id='+m.get('id');
 if(m.has('page')){if(!/^[1-9]\d*$/.test(m.get('page')))return null;url+='&pg=PA'+m.get('page');}
 if(m.has('pg')){if(!/^(?:PA|PR)[1-9]\d*$/.test(m.get('pg')))return null;url+='&pg='+m.get('pg');}
 if(m.has('text')){if(/[{}<>|\r\n]/.test(m.get('text')))return null;url+='&dq='+encode('"'+m.get('text')+'"');}
 if(m.has('keywords')){if(/[{}<>|\r\n]/.test(m.get('keywords')))return null;url+='&q='+encode(m.get('keywords'));}
 return url;
}
function v2222CitationValue(field,roles,fields,reader) {
 const text=field.value.trim();let next=null;
 if(roles.some(r=>['URL','ChapterURL','ArchiveURL'].includes(r))){
  const m=/^\[(https?:\/\/[^\s\[\]{}<>|]+)[ \t]+([^\[\]{}<>|\r\n]+)\]$/.exec(text),titleRole=roles.includes('ChapterURL')?'Chapter':'Title',titles=fields.filter(f=>v222CitationRoles(f.key,reader).includes(titleRole));
  if(m&&titles.length===1&&titles[0].value.trim()===m[2].trim()&&v2222CitationLiteralURL(m[1]))next=m[1];
  const slash=/^(https?):\/([^/\s\\][^\s\\]*)$/i.exec(text);if(slash&&v2222CitationLiteralURL(slash[1]+'://'+slash[2]))next=slash[1]+'://'+slash[2];
  if(roles.includes('URL'))next=v2222CitationGoogleBooks(text)||next;
 }
 const typed=roles.find(r=>/^Identifier:(ISBN|ISSN|eISSN)$/.test(r));
 if(typed){const cleaned=v2222CitationIdentifierTypography(text);if(typed==='Identifier:ISBN'&&v2221ISBNValid(cleaned))next=cleaned;if(/ISSN/.test(typed)){const issn=v2222CitationISSN(cleaned);if(issn)next=issn;}}
 if(roles.some(r=>/^Identifier:(ISBN|ISSN|DOI|PMID|PMC)$/.test(r))){
  const m=/^([^;\s]+);[ \t]+\1$/.exec(text);
  if(m){const id=m[1],valid=roles.includes('Identifier:ISBN')&&v2221ISBNValid(id)||roles.includes('Identifier:ISSN')&&!!v2222CitationISSN(id)||roles.includes('Identifier:DOI')&&/^10\.\d{4,9}\/[^\s;<>"{}|]+$/.test(id)||roles.some(r=>['Identifier:PMID','Identifier:PMC'].includes(r))&&/^[1-9]\d*$/.test(id);if(valid)next=id;}
 }
 if(roles.includes('Identifier:JSTOR')){const m=/^https?:\/\/(?:www\.)?jstor\.org\/stable\/([1-9]\d*)\/?$/.exec(text);if(m)next=m[1];}
 if(roles.includes('Identifier:ARXIV')){const id=v2222CitationArxiv(text);if(id)next=id;}
 if(roles.some(r=>['Pages','Page'].includes(r))){const m=/^(?:pp?\.|págs?\.)[ \t]+(.+)$/.exec(text);if(m&&v2222CitationPageList(m[1]))next=m[1];}
 if(roles.includes('Mode')&&/^(?:CS1|CS2|MLA)$/.test(text))next=text.toLowerCase();
 if(roles.some(r=>['NoPP','RegistrationRequired','SubscriptionRequired','LastAuthorAmp','NoTracking'].includes(r))&&/^(?:verdadeiro|vrai|verdadero|wahr)$/i.test(text))next='sim';
 if(roles.includes('Edition')){const ord={first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10};if(Object.hasOwn(ord,text.toLowerCase()))next=ord[text.toLowerCase()]+'.ª';}
 if(roles.some(r=>['Format','ChapterFormat','ArchiveFormat'].includes(r))){const m=/^\((PDF|EPUB|HTML|DOCX?|RTF|TXT)\)$/i.exec(text);if(m)next=m[1];}
 if(roles.some(r=>['ScriptTitle','ScriptChapter'].includes(r))){const m=/^(ja|zh|ko|ru|ar|he|el)=([^\r\n]+)$/.exec(text);if(m)next=m[1]+':'+m[2];}
 if(next===null||next===text)return null;const at=field.value.indexOf(text);return field.value.slice(0,at)+next+field.value.slice(at+text.length);
}
function v2222CitationValuesPlan(source,cfg={}) {
 const edits=[];if(!v2222CitationScope(source,cfg)||cfg.citations===false)return v2221CitationEditsPlan(source,edits,cfg);
 const shield=v222Protected(source);
 for(const n of v24SyntaxTemplates(shield.view).nodes){
  if(n.size!==2)continue;const raw=source.slice(n.start,n.end),p=v222Fields(raw),context=v2222CitationContext(raw),reader=context&&v2215CitationReader(context);if(!p||!reader)continue;
  const fields=p.fields,role=r=>fields.filter(f=>v222CitationRoles(f.key,reader).includes(r)),add=(f,text,kind,count=1)=>edits.push({start:n.start+f.valueStart,end:n.start+f.end,text,kind,count,proof:{reader:reader.oldid,key:f.key}});
  const isbn=role('Identifier:ISBN'),issn=role('Identifier:ISSN');let swapped=false;
  if(isbn.length===1&&issn.length===1&&v2222CitationISSN(isbn[0].value.trim())&&v2221ISBNValid(issn[0].value.trim())&&!v2221ISBNValid(isbn[0].value.trim())&&!v2222CitationISSN(issn[0].value.trim())){add(isbn[0],issn[0].value,'citation-id-role-swap');add(issn[0],isbn[0].value,'citation-id-role-swap');swapped=true;}
  for(const f of fields){const roles=v222CitationRoles(f.key,reader);if(!roles.length||!v222CitationUnique(f,roles,fields,reader)||swapped&&[...isbn,...issn].includes(f))continue;
   const value=v2222CitationValue(f,roles,fields,reader);if(value!==null&&shield.view.slice(n.start+f.valueStart,n.start+f.end)===f.value)add(f,value,'citation-native-literal');
  }
  const urls=role('URL'),archives=role('ArchiveURL'),dates=role('ArchiveDate');
  if(urls.length<=1&&(!urls.length||!urls[0].value.trim())&&archives.length===1&&dates.length===1&&(!role('ChapterURL').some(f=>f.value.trim())||reader.module==='Módulo:Citar web'&&reader.oldid===48965255)){
   const m=/^https:\/\/web\.archive\.org\/web\/(\d{14})\/(https?:\/\/[^\s{}<>\[\]|]+)$/.exec(archives[0].value.trim()),d=v2222CitationDateIdentity(dates[0].value);
   if(m&&d&&Number(m[1].slice(0,4))===d.year&&Number(m[1].slice(4,6))===d.month&&Number(m[1].slice(6,8))===d.day&&Number(m[1].slice(8,10))<24&&Number(m[1].slice(10,12))<60&&Number(m[1].slice(12,14))<60&&v2222CitationLiteralURL(m[2])&&v222CitationTargetAccepted(context,'url',reader)){
    if(urls.length)add(urls[0],m[2],'citation-explicit-archive-original');else edits.push({start:n.end-2,end:n.end-2,text:'|url='+m[2],count:1,kind:'citation-explicit-archive-original',proof:{reader:reader.oldid,capture:m[1]}});
   }
  }
  const ids=role('ID'),dois=role('Identifier:DOI');
  if(ids.length===1&&dois.length<=1){const m=/^DOI\s*:\s*(10\.\d{4,9}\/[^\s<>"{}|]+)$/i.exec(ids[0].value.trim());if(m&&(!dois.length||dois[0].value.trim()===m[1])&&v222CitationTargetAccepted(context,'doi',reader)){
   edits.push({start:n.start+ids[0].start-1,end:n.start+ids[0].end,text:dois.length?'':'|doi='+m[1],kind:'citation-explicit-doi-role',count:1,proof:{reader:reader.oldid,doi:m[1]}});
  }}
  const arx=role('Identifier:ARXIV'),classes=role('Class');if(arx.length===1&&classes.length<=1){const m=/^arXiv:([\w./-]+)[ \t]+\[([A-Za-z.-]+)\]$/.exec(arx[0].value.trim()),allowed=new Set('hep-th hep-ph hep-ex hep-lat gr-qc quant-ph math-ph astro-ph astro-ph.CO astro-ph.EP astro-ph.GA astro-ph.HE astro-ph.IM astro-ph.SR cond-mat.dis-nn cond-mat.mes-hall cond-mat.mtrl-sci cond-mat.other cond-mat.quant-gas cond-mat.soft cond-mat.stat-mech cond-mat.str-el cond-mat.supr-con math.AC math.AG math.AP math.AT math.CA math.CO math.CT math.CV math.DG math.DS math.FA math.GM math.GN math.GR math.GT math.HO math.IT math.KT math.LO math.MG math.MP math.NA math.NT math.OA math.OC math.PR math.QA math.RA math.RT math.SG math.SP math.ST cs.AI cs.AR cs.CC cs.CE cs.CG cs.CL cs.CR cs.CV cs.CY cs.DB cs.DC cs.DL cs.DM cs.DS cs.ET cs.FL cs.GL cs.GR cs.GT cs.HC cs.IR cs.IT cs.LG cs.LO cs.MA cs.MM cs.MS cs.NA cs.NE cs.NI cs.OH cs.OS cs.PF cs.PL cs.RO cs.SC cs.SD cs.SE cs.SI cs.SY stat.AP stat.CO stat.ME stat.ML stat.OT stat.TH physics.acc-ph physics.ao-ph physics.app-ph physics.atm-clus physics.atom-ph physics.bio-ph physics.chem-ph physics.class-ph physics.comp-ph physics.data-an physics.ed-ph physics.flu-dyn physics.gen-ph physics.geo-ph physics.hist-ph physics.ins-det physics.med-ph physics.optics physics.plasm-ph physics.pop-ph physics.soc-ph physics.space-ph nucl-ex nucl-th q-bio.BM q-bio.CB q-bio.GN q-bio.MN q-bio.NC q-bio.OT q-bio.PE q-bio.QM q-bio.SC q-bio.TO q-fin.CP q-fin.EC q-fin.GN q-fin.MF q-fin.PM q-fin.PR q-fin.RM q-fin.ST q-fin.TR econ.EM econ.GN econ.TH eess.AS eess.IV eess.SP eess.SY'.split(' '));
   if(m&&v2222CitationArxiv(m[1])&&allowed.has(m[2])&&(!classes.length||classes[0].value.trim()===m[2])&&v222CitationTargetAccepted(context,'classe',reader)){add(arx[0],m[1]+(!classes.length?'|classe='+m[2]:''),'citation-explicit-arxiv-class',classes.length?1:2);}
  }
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2222CitationValuesProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2222CitationValuesPlan);}
function v2222CitationLanguagesPlan(source,cfg={}) {
 const edits=[];if(!v2222CitationScope(source,cfg)||cfg.citations===false)return v2221CitationEditsPlan(source,edits,cfg);const shield=v222Protected(source);
 for(const n of v24SyntaxTemplates(shield.view).nodes){if(n.size!==2)continue;const raw=source.slice(n.start,n.end),p=v222Fields(raw),c=v2222CitationContext(raw),r=c&&v2215CitationReader(c);if(!p||!r)continue;
  const main=p.fields.filter(f=>v222CitationRoles(f.key,r).includes('Language')&&!/\d$/.test(f.key)),extra=p.fields.filter(f=>/^(?:língua|lingua|idioma|language)([2-9]|1\d|20)$/.test(f.key));
  if(main.length!==1||!extra.length||p.fields.some(f=>/^(?:língua|lingua|idioma|language)\d+$/.test(f.key)&&!extra.includes(f))||new Set(extra.map(f=>/\d+$/.exec(f.key)[0])).size!==extra.length)continue;
  const ordered=[main[0],...extra.slice().sort((a,b)=>Number(/\d+$/.exec(a.key)[0])-Number(/\d+$/.exec(b.key)[0]))],lists=ordered.map(f=>v2221CitationLanguageList(f.value));if(lists.some(v=>!v)||extra.some((f,i)=>lists[i+1].length!==1))continue;
  if(ordered.some(f=>shield.view.slice(n.start+f.valueStart,n.start+f.end)!==f.value))continue;
  const value=[...new Set(lists.flat())].join(', ');edits.push({start:n.start+main[0].valueStart,end:n.start+main[0].end,text:value,count:1,kind:'citation-language-list',proof:{reader:r.oldid}});
  for(const f of extra)edits.push({start:n.start+f.start-1,end:n.start+f.end,text:'',count:1,kind:'citation-language-extra',proof:{reader:r.oldid,language:f.value}});
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2222CitationLanguagesProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2222CitationLanguagesPlan);}
function v2222CitationSingleRef(source,node) {
 const rows=v219NativeReferenceObserver(source).refs.filter(r=>r.valid&&r.body!==null&&r.close&&r.start<node.start&&node.end<=r.close.start);
 if(rows.length!==1)return null;const r=rows[0];return !source.slice(r.start+r.raw.length,node.start).trim()&&!source.slice(node.end,r.close.start).trim()?r:null;
}
function v2222CitationStructuredPlan(source,cfg={}) {
 const edits=[];if(!v2222CitationScope(source,cfg)||cfg.citations===false)return v2221CitationEditsPlan(source,edits,cfg);const shield=v222Protected(source);
 for(const n of v24SyntaxTemplates(shield.view).nodes){if(n.size!==2)continue;const raw=source.slice(n.start,n.end),p=v222Fields(raw),c=v2222CitationContext(raw),r=c&&v2215CitationReader(c);if(!p||!r)continue;
  const fields=p.fields,role=x=>fields.filter(f=>v222CitationRoles(f.key,r).includes(x)),single=v2222CitationSingleRef(source,n);
  const at=role('At'),pages=[...role('Page'),...role('Pages')];
  if(single&&at.length===1&&pages.length===1&&/^(?:§{1,2}[ \t]+[1-9]\d*(?:[.–-][1-9]\d*)?|cap\.[ \t]+[1-9]\d*)$/.test(at[0].value.trim())&&v2222CitationPageList(pages[0].value.trim())&&!fields.some(f=>['postscript','ps'].includes(f.key))){
   const f=at[0];edits.push({start:n.start+f.start-1,end:n.start+f.end,text:'',count:1,kind:'citation-external-explicit-locator',proof:{reader:r.oldid,retainedPages:pages[0].value,locator:f.value.trim()}});edits.push({start:n.end,end:n.end,text:' '+f.value.trim(),count:0,kind:'citation-external-explicit-locator',proof:{reader:r.oldid,ref:single.attrs,locator:f.value.trim()}});
  }
  const isbn=role('Identifier:ISBN');if(single&&isbn.length===1){const m=/^([\dXx -]+)[ \t]+\((brochura|capa dura|capa mole|paperback|hardback|hardcover)\)$/i.exec(isbn[0].value.trim());if(m&&v2221ISBNValid(m[1])&&!fields.some(f=>['outros','others','tipo','type','formato','format'].includes(f.key)&&f.value.trim())){
   const f=isbn[0];edits.push({start:n.start+f.valueStart,end:n.start+f.end,text:m[1],count:1,kind:'citation-isbn-physical-qualifier',proof:{reader:r.oldid,isbn:m[1],qualifier:m[2]}});edits.push({start:n.end,end:n.end,text:' ('+m[2]+')',count:0,kind:'citation-isbn-physical-qualifier',proof:{reader:r.oldid,ref:single.attrs,qualifier:m[2]}});
  }}
  // Native CS1 has no article-number role. Preserve its explicit locator as
  // literal reference-body text, without pretending it is a physical page.
  const article=fields.filter(f=>['article-number','número-artigo'].includes(f.key));
  if(single&&r.kind==='periodical'&&article.length===1&&!pages.length&&!at.length&&/^[A-Za-z]?[0-9]{1,18}$/.test(article[0].value.trim())&&!fields.some(f=>['elocation-id','eid','article-number','número-artigo'].includes(f.key)&&f!==article[0])){
   const f=article[0],code=f.value.trim();edits.push({start:n.start+f.start-1,end:n.start+f.end,text:'',count:1,kind:'citation-explicit-electronic-locator',proof:{reader:r.oldid,sourceRole:f.key,code}});edits.push({start:n.end,end:n.end,text:' Artigo '+code,count:0,kind:'citation-explicit-electronic-locator',proof:{reader:r.oldid,sourceRole:f.key,code,ref:single.attrs}});
  }
  const authors=fields.filter(f=>v222CitationRoles(f.key,r).some(x=>/^AuthorList-(?:First|Last):/.test(x))&&f.value.trim()),display=role('DisplayAuthors'),flags=fields.filter(f=>f.key==='etal');
  if(flags.length===1&&flags[0].value.trim()==='sim'&&authors.length&&display.length===0&&v222CitationTargetAccepted(c,'numero-autores',r)){
   const f=flags[0];edits.push({start:n.start+f.keyStart,end:n.start+f.end,text:'numero-autores=etal',count:1,kind:'citation-explicit-etal-flag',proof:{reader:r.oldid,authorsRetained:authors.map(a=>[a.key,a.value])}});
  }
  const broken=fields.filter(f=>!f.value.trim()&&/^autor([A-ZÀ-ÖØ-Þ][\p{L}\p{M}'-]+(?: [\p{L}\p{M}.'-]+)+)$/u.test(f.key)&&!/^autor(?:Nome|Sobrenome|Primeiro|Link|Mascara|Máscara|Author)(?: |$)/u.test(f.key)&&!v222CitationRoles(f.key,r).length&&!v222CitationTargetAccepted(c,f.key,r)&&!v222CitationRoles(f.key.toLowerCase(),r).length&&!v222CitationTargetAccepted(c,f.key.toLowerCase(),r)&&!v2221CitationRepairKey(f.key,r));
  if(broken.length===1&&!fields.some(f=>f!==broken[0]&&(/^(?:autor|autora|author|autores|authors|coautor|coauthor|primeiro|ultimo|último|last|first|nome|sobrenome|authorlink|autorlink|ref|máscaraautor|author-mask)(?:[1-9]\d*)?$/.test(f.key)||v222CitationRoles(f.key,r).some(x=>/^AuthorList-/.test(x))))&&v222CitationTargetAccepted(c,'autor',r)){
   const f=broken[0],name=f.key.slice(5);if(name.trim()===name&&!/[{}<>\[\]|\r\n]/.test(name))edits.push({start:n.start+f.keyStart,end:n.start+f.end,text:'autor='+name,count:1,kind:'citation-author-missing-separator',proof:{reader:r.oldid,explicitPrefix:'autor',literal:name}});
  }
  const original=fields.filter(f=>f.key==='orig-date'),oldyear=role('OrigYear');
  if(original.length===1&&!oldyear.length&&v222CitationTargetAccepted(c,'anooriginal',r)&&/^(?:\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ [1-9]\d?, \d{4}|[1-9]\d? de [a-zç]+ de \d{4})$/.test(original[0].value.trim())){
   const f=original[0];edits.push({start:n.start+f.keyStart,end:n.start+f.keyEnd,text:'anooriginal',count:1,kind:'citation-original-publication-date',proof:{reader:r.oldid,fullValueRetained:f.value}});
  }
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2222CitationStructuredProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2222CitationStructuredPlan);}
function v2222CitationAPODDate(value) {
 const literal=v2222CitationDateIdentity(value);if(literal)return literal;
 const map={january:1,janeiro:1,february:2,fevereiro:2,march:3,março:3,april:4,abril:4,may:5,maio:5,june:6,junho:6,july:7,julho:7,august:8,agosto:8,september:9,setembro:9,october:10,outubro:10,november:11,novembro:11,december:12,dezembro:12};
 const m=/^(\d{1,2})(?: de)? ([A-Za-zÀ-ÿ]+)(?: de)? (\d{4})$/.exec(value.trim());if(!m)return null;const day=Number(m[1]),month=map[m[2].toLowerCase()],year=Number(m[3]);return month&&validDate(day,month,year)?{day,month,year}:null;
}
function v2222CitationImport(raw) {
 const p=v222Fields(raw);if(!p||p.parts.length!==p.fields.length+1)return null;const head=p.header.trim().toLowerCase(),fields=p.fields,m=new Map();for(const f of fields){if(m.has(f.key))return null;m.set(f.key,f.value.trim());}
 const ordinary=v218CitationNativeContext('{{Citar web|título=X}}'),reader=ordinary&&v2215CitationReader(ordinary);if(!reader)return null;
 if(head==='cite apod'){
  // Source producer: Template:Cite APOD, revision 1265028226.
  const allowed=new Set(['title','date','access-date','accessdate','apod','language','trans-title']);if([...m.keys()].some(k=>!allowed.has(k))||m.has('accessdate')&&m.has('access-date')||!m.get('title')||!m.get('date'))return null;
  const d=v2222CitationAPODDate(m.get('date'));if(!d||d.year<1995||d.year>2094)return null;const selector=String(d.year).slice(-2)+String(d.month).padStart(2,'0')+String(d.day).padStart(2,'0');if(m.has('apod')&&m.get('apod')!==selector)return null;
  const names={title:'título',date:'data','access-date':'acessodata',accessdate:'acessodata',language:'língua','trans-title':'títulotrad'},out=[];for(const f of fields){if(f.key==='apod')continue;out.push('|'+names[f.key]+'='+f.value);}
  return '{{Citar web'+out.join('')+'|url=https://apod.nasa.gov/apod/ap'+selector+'.html|obra=[[Astronomy Picture of the Day]]|publicado=[[NASA]]|editor-sobrenome1=Nemiroff|editor-nome1=R.|editor-sobrenome2=Bonnell|editor-nome2=J.}}';
 }
 if(head==='cite instagram'){
  // Active local producer: Predefinição:Cite Instagram, revision 69620519.
  // Its canonical URL and credited account differ from the English wrapper.
  const allowed=new Set(['user','postid','title','author','date','access-date','accessdate','language','trans-title','link']);if([...m.keys()].some(k=>!allowed.has(k))||m.has('accessdate')&&m.has('access-date')||!m.get('author')||!m.get('title')||/https?:\/\//i.test(m.get('title'))||!m.get('date')||!/^[-\w.]{1,30}$/.test(m.get('user')||'')||!/^[-\w]+$/.test(m.get('postid')||'')||m.has('link')&&!['yes','no'].includes(m.get('link')))return null;
  const names={title:'título',author:'autor',date:'data','access-date':'acessodata',accessdate:'acessodata',language:'língua','trans-title':'títulotrad'},out=[];for(const f of fields){if(!Object.hasOwn(names,f.key))continue;out.push('|'+names[f.key]+'='+f.value);}
  return '{{Citar web'+out.filter(v=>!v.startsWith('|autor=')).join('')+'|autor='+m.get('author')+' [@'+m.get('user')+']|url=https://www.instagram.com/p/'+m.get('postid')+'/|via='+(m.get('link')==='no'?'Instagram':'[[Instagram]]')+'}}';
 }
 return null;
}
function v2222CitationImportCount(before,after) {
 const a=v222Fields(before),b=v222Fields(after);if(!a||!b)return 1;let count=a.header===b.header?0:1;const used=new Set(),map={title:'título',date:'data','access-date':'acessodata',accessdate:'acessodata',language:'língua','trans-title':'títulotrad',author:'autor'};
 for(const field of a.fields){const key=map[field.key]||field.key,next=b.fields.find(f=>f.key===key&&!used.has(f));if(!next){count++;continue;}used.add(next);if(field.key!==next.key)count++;if(field.value!==next.value)count++;}
 for(const field of b.fields)if(!used.has(field))count++;
 return Math.max(1,count);
}
function v2222CitationHeadersPlan(source,cfg={}) {
 const edits=[];if(!v2222CitationScope(source,cfg)||cfg.citations===false||cfg.multilingual===false)return v2221CitationEditsPlan(source,edits,cfg);const shield=v222Protected(source);
 for(const n of v24SyntaxTemplates(shield.view).nodes){if(n.size!==2)continue;const raw=source.slice(n.start,n.end),p=v222Fields(raw);if(!p)continue;
  if(/^citar noticia$/i.test(p.header.trim())){edits.push({start:n.start+2,end:n.start+2+p.header.length,text:'Citar jornal',count:1,kind:'citation-native-newspaper-wrapper',proof:{nativeWrapper:55834874,nativeModule:49463910,argumentHash:v24SyntaxHash(raw.slice(2+p.header.length))}});continue;}
  const imported=v2222CitationImport(raw);if(imported)edits.push({start:n.start,end:n.end,text:imported,count:v2222CitationImportCount(raw,imported),kind:'citation-specialized-source-import',proof:{sourceHash:v24SyntaxHash(raw),candidateHash:v24SyntaxHash(imported),header:p.header}});
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2222CitationHeadersProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2222CitationHeadersPlan);}
