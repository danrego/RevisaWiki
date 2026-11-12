// Complete literal consumers are repaired independently. Unknown groups,
// unresolved sources and differing locators keep their original identity.
const V2217_BIBLE_BOOKS=Object.freeze({"titus":"Tito","1 timothy":"I Timóteo","ephesians":"Efésios","luke":"Lucas","mark":"Marcos","matthew":"Mateus","judges":"Juízes","2 kings":"II Reis","acts":"Atos","genesis":"Gênesis","galatians":"Gálatas","1 corinthians":"I Coríntios","john":"João","romans":"Romanos","2 corinthians":"II Coríntios","1 thessalonians":"I Tessalonicenses","1 peter":"I Pedro","1 timoteo":"I Timóteo","1 timóteo":"I Timóteo"});
const V2217_REFERENCE_CONTRACTS=Object.freeze({bible:64493702,citation:62525251,cs1:72936771,configuration:73016847,whitelist:71860752,references:63785697});
const V2217_BIBLIOGRAPHIC_TARGETS=Object.freeze({"John Piper (theologian)":Object.freeze({target:"John Piper",identity:"Q1151352"})});

function v2217ReferenceScope(source,options={}){
 const cfg=pageContextOptions({...DEFAULTS,...options});
 return typeof source==='string'&&v2215AliasScope(source,cfg)&&cfg.references!==false&&
  !cfg.discussionPage&&!v20DefinitionContext(cfg)&&v20AutomationAllowed(source,cfg);
}
function v2217ReferenceOwnerContext(source){return v2212CitationSourceContext(source);}
function v2217ReferenceBankOwner(source,node,context){
 if(context.protected.some(r=>r.start<node.end&&r.end>node.start))return false;
 const parents=context.nodes.filter(n=>n.start<node.start&&n.end>=node.end);
 if(parents.length!==1)return false;
 const parent=parents[0],raw=source.slice(parent.start,parent.end),p=parsedTemplate(raw),head=v215TemplateTitle(p.parts[0]);
 if(!['Reflist','Referências','Notas','Notas e referências','RodapéNota'].some(n=>v215SameTemplateTitle(head,n))||!v215LiteralTemplateIdentity(raw))return false;
 const outer=v24SyntaxContext(context.view,parent.start);if(['templates','html','tables','links','external'].some(k=>outer[k]?.length))return false;
 const entries=foreignEntries(p),banks=entries.filter(e=>!e.positional&&e.key==='refs'),parts=v24SyntaxParts(raw.slice(2,-2));
 if(banks.length!==1||!parts||entries.some(e=>!e.positional&&['notes','notas'].includes(e.key)))return false;
 const part=parts[banks[0].index],start=parent.start+2+part.start+part.text.indexOf('=')+1,bank=banks[0].value,refs=refTokens(bank);
 if(!refs.length)return false;
 let cursor=0,owner=false;
 for(const ref of refs){
  const attrs=attrsOf(ref.attrs);
  if(bank.slice(cursor,ref.start).trim()||ref.body===null||!attrs||!attrs.name||!v24SyntaxLiteralIdentity(attrs)||
   Object.keys(attrs).some(k=>!['name','group'].includes(k))||/<\s*\/?\s*ref\b/i.test(ref.body))return false;
  const before=start+ref.openEnd,after=before+ref.body.length;
  if(node.start>=before&&node.end<=after&&ref.body.trim()===source.slice(node.start,node.end))owner=true;
  cursor=ref.end;
 }
 return owner&&!bank.slice(cursor).trim();
}
function v2217ReferenceLiteralCall(source,node,context){
 if(node.size&&node.size!==2||node.end-node.start>131072||!v2212CitationOwner(source,node,context)&&!v2217ReferenceBankOwner(source,node,context))return null;
 const raw=source.slice(node.start,node.end),p=parsedTemplate(raw);
 return v219OriginalTemplateHeaderAllowed(p.parts[0])?{raw,p}:null;
}
function v2217BibleCall(raw){
 const p=parsedTemplate(raw),head=v215TemplateTitle(p.parts[0]);
 if(!['Bibleverse','Citar bíblia','Citar Bíblia'].some(n=>v215SameTemplateTitle(head,n)))return null;
 const entries=foreignEntries(p),positions=entries.filter(e=>e.positional||/^\d+$/.test(e.key)),named=entries.filter(e=>!e.positional&&!/^\d+$/.test(e.key));
 if(entries.some(e=>/[{}<>\r\n]/.test(e.value)))return null;
 // The reviewed local alias has a fixed edition and no version selector.
 // Never discard an explicit edition or flatten cross-chapter endpoints.
 if(!named.length&&positions.length===2&&positions[0].key==='1'&&positions[1].key==='2'){
  const book=V2217_BIBLE_BOOKS[norm(positions[0].value)],passage=/^([1-9]\d{0,2}):([1-9]\d{0,2})(?:[–-]([1-9]\d{0,2}))?$/.exec(positions[1].value.trim());
  if(!book||!passage||passage[3]&&+passage[3]<+passage[2])return null;
  return {text:'{{Citar bíblia|livro='+book+'|capítulo='+passage[1]+'|verso='+passage[2]+(passage[3]?'|verso_final='+passage[3]:'')+'}}',
   count:1,witness:{kind:'native-bible-single-chapter',contract:V2217_REFERENCE_CONTRACTS.bible,book,chapter:passage[1],verse:passage[2],last:passage[3]||'',originalBook:positions[0].value,originalPassage:positions[1].value}};
 }
 if(named.length&&named.every(e=>['livro','capítulo','verso','verso_final','citação'].includes(e.key))&&
  positions.every(e=>!e.value.trim())&&new Set(named.map(e=>e.key)).size===named.length){
  const books=named.filter(e=>e.key==='livro'),chapter=named.find(e=>e.key==='capítulo'),verse=named.find(e=>e.key==='verso'),last=named.find(e=>e.key==='verso_final');
  if(books.length!==1||!chapter||!verse||!/^\s*[1-9]\d{0,2}\s*$/.test(chapter.value)||!/^\s*[1-9]\d{0,2}\s*$/.test(verse.value)||
   last&&(!/^\s*[1-9]\d{0,2}\s*$/.test(last.value)||+last.value<+verse.value))return null;
  const book=V2217_BIBLE_BOOKS[norm(books[0].value)];if(!book||books[0].value.trim()===book)return null;
  const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
  const part=parts[books[0].index],at=2+part.start+part.text.indexOf('=')+1,value=books[0].value,
   padded=v221CitationPadded(value,book),text=v24SyntaxApply(raw,[{start:at,end:2+part.end,text:padded}]);
  return{text,count:1,witness:{kind:'native-bible-canonical-book',contract:V2217_REFERENCE_CONTRACTS.bible,book,originalBook:value}};
 }
 return null;
}
function v2217CitationTarget(raw){
 const p=parsedTemplate(raw);if(!v215SameTemplateTitle(p.parts[0],'Citation'))return null;
 const context=v2212CitationContext(raw),fields=context?.fields;
 if(!context||context.profile.oldid!==V2217_REFERENCE_CONTRACTS.citation||!fields||fields.some(f=>f.positional)||!v220CitationNamedFields(fields))return null;
 const nonempty=fields.filter(f=>f.value.trim()),one=role=>nonempty.filter(f=>v219NativeCitationRoles(f.key).includes(role)),
  periodicals=one('Periodical'),encyclopedias=one('Encyclopedia'),titles=one('Title');
 if(titles.length!==1||encyclopedias.length)return null;
 let target=null;
 if(periodicals.length===1){
  const key=periodicals[0].key;
  if(['jornal','newspaper'].includes(key))target='Citar jornal';
  else if(['revista','magazine'].includes(key))target='Citar revista';
  else if(['periódico','periodico','journal'].includes(key))target='Citar periódico';
  else if(['obra','work','website'].includes(key)){
   const urls=one('URL');
   if(urls.length===1){try{const host=new URL(urls[0].value.trim()).hostname.toLowerCase().replace(/^www\./,''),label=periodicals[0].value.trim().toLowerCase().replace(/^www\./,'');if(host===label)target='Citar web';}catch{}}
  }
  if(!target||one('Chapter').length)return null;
 }else if(!periodicals.length){
  // This is the local generic consumer's book branch. A bare URL with no
  // book/person metadata remains generic until its publication type is known.
  const people=nonempty.some(f=>v219NativeCitationRoles(f.key).some(r=>/^(?:AuthorList|EditorList)-(?:First|Last):/.test(r))),
   book=one('Identifier:ISBN').length||one('PublisherName').length||one('Edition').length||one('Chapter').length||people&&one('Year').length;
  if(book)target='Citar livro';
  else return null;
 }else return null;
 const candidate='{{'+target+raw.slice(2+p.parts[0].length),native=v2212CitationContext(candidate);
 if(!native||!v2215CitationReader(native)||fields.some(f=>f.value.trim()&&!nativeCitationAccepts(native.native,f.key)))return null;
 const originalReader=v2215CitationReader(context),targetReader=v2215CitationReader(native);
 if(!originalReader||fields.some(f=>f.value.trim()&&JSON.stringify(v2215CitationModelRoles(f.key,originalReader))!==JSON.stringify(v2215CitationModelRoles(f.key,targetReader))))return null;
 const refs=fields.filter(f=>v219NativeCitationRoles(f.key).includes('Ref')),modes=fields.filter(f=>v219NativeCitationRoles(f.key).includes('Mode'));
 if(refs.length>1||refs.length===1&&!refs[0].value.trim()||modes.length>1||modes.length===1&&!['cs1','cs2','mla'].includes(modes[0].value.trim().toLowerCase()))return null;
 const addedHarvard=!refs.length&&(!modes.length||modes[0].value.trim().toLowerCase()==='cs2');
 return{target,text:addedHarvard?candidate.slice(0,-2)+'|ref=harv}}':candidate,count:addedHarvard?2:1,
  witness:{kind:'native-generic-citation-type',contract:V2217_REFERENCE_CONTRACTS,from:context.profile.title,to:target,addedHarvard,argumentsHash:v24SyntaxHash(JSON.stringify(p.parts.slice(1)))}};
}
function v2217CitationEditionCall(raw,cfg={}){
 if(cfg.dates===false||cfg.citationRepairs===false)return null;
 const context=v2212CitationContext(raw);if(!context)return null;
 const editions=context.fields.filter(f=>v219NativeCitationRoles(f.key).includes('Edition'));
 if(editions.length!==1)return null;
 const field=editions[0],m=/^([1-9]\d{0,2})(st|nd|rd|th)(?:\s+ed(?:ition|\.)?)?$/i.exec(field.value.trim());if(!m)return null;
 const n=+m[1],suffix=n%100>=11&&n%100<=13?'th':({1:'st',2:'nd',3:'rd'})[n%10]||'th';
 if(m[2].toLowerCase()!==suffix)return null;
 const replacement=v221CitationPadded(field.value,n+'.ª'),text=v24SyntaxApply(raw,[{start:field.start,end:field.end,text:replacement}]);
 return{text,count:1,witness:{kind:'native-edition-ordinal',from:field.value,to:replacement,number:n}};
}
function v2217CitationLinkEdits(raw,cfg={}){
 if(cfg.links===false||cfg.authors===false)return[];
 const context=v2212CitationContext(raw);if(!context)return[];
 const edits=[];
 for(const field of context.fields){
  const roles=v219NativeCitationRoles(field.key),target=V2217_BIBLIOGRAPHIC_TARGETS[field.value.trim()];
  if(target&&roles.some(r=>/^(?:AuthorList|EditorList|TranslatorList|ContributorList)-Link:/.test(r)))
   edits.push({start:field.start,end:field.end,text:v221CitationPadded(field.value,target.target),kind:'native-bibliographic-target',count:1,witness:{source:field.value.trim(),target:target.target,identity:target.identity,field:field.key}});
 }
 return edits;
}
function v2217CitationCall(raw,cfg={}){
 const steps=[];let text=raw;
 const apply=(name,call)=>{if(!call||typeof call.text!=='string'||call.text===text)return;steps.push({name,before:text,after:call.text,count:call.count??1,witness:call.witness});text=call.text;};
 if(cfg.citations!==false&&cfg.automaticParameterNames!==false){
  apply('typed-citation-header',v2217CitationTarget(text));
  apply('native-edition',v2217CitationEditionCall(text,cfg));
  const edits=v2217CitationLinkEdits(text,cfg);if(edits.length)apply('bibliographic-targets',{text:v24SyntaxApply(text,edits),count:edits.length,witness:{edits}});
 }
 return{text,steps,count:steps.reduce((n,s)=>n+s.count,0)};
}
function v2217ReferenceCallEdits(source,cfg={}){
 if(!/\{\{\s*(?:(?:Predefinição|Template)\s*:\s*)?(?:[Cc]itation|[Bb]ibleverse|[Cc]itar [Bb]íblia)\b/.test(source)&&
  !/(?:\||\s)(?:edição|edicao|edition|ed)\s*=\s*[1-9]\d{0,2}(?:st|nd|rd|th)\b/i.test(source)&&!source.includes('John Piper (theologian)'))return[];
 const context=v2217ReferenceOwnerContext(source),edits=[];
 for(const node of context.nodes){
  const candidate=source.slice(node.start,node.end),head=parsedTemplate(candidate).name;
  if(!['citation','bibleverse','citar bíblia'].includes(head)&&
   !/(?:\||\s)(?:edição|edicao|edition|ed)\s*=\s*[1-9]\d{0,2}(?:st|nd|rd|th)\b/i.test(candidate)&&!candidate.includes('John Piper (theologian)'))continue;
  const call=v2217ReferenceLiteralCall(source,node,context);if(!call)continue;
  const bible=cfg.citations!==false&&cfg.multilingual!==false?v2217BibleCall(call.raw):null,
   citation=!bible?v2217CitationCall(call.raw,cfg):null,next=bible||citation;
  if(!next||next.text===call.raw)continue;
  edits.push({start:node.start,end:node.end,text:next.text,count:next.count||1,kind:bible?'native-bible-reference':'native-citation-call',witness:bible?.witness||{steps:citation.steps,before:call.raw}});
 }
 return edits.filter(e=>!edits.some(o=>o!==e&&o.start<e.end&&e.start<o.end));
}
function v2217ReferenceHeadingChain(source,start){
 const out=[];let end=start;
 while(true){
  const match=source.slice(0,end).match(/(?:^|\n)(={2,6})[ \t]*(Referências|Referencias|References|Notas|Notes|Notas e referências|Citações|Cita[cç][oõ]es)[ \t]*\1[ \t]*\r?\n[ \t\r\n]*$/i);
  if(!match)break;
  const at=match.index+(match[0][0]==='\n'?1:0);out.unshift({start:at,end,level:match[1].length,name:norm(match[2])});end=at;
 }
 return out;
}
function v2217ReferenceNestedHeadingChain(chain){return chain.every((heading,index)=>!index||heading.level>chain[index-1].level);}
function v2217ReferenceCategoryGapHeading(source,start,view){
 const headings=[...view.slice(0,start).matchAll(/(?:^|\n)(={2,6})[ \t]*(Referências|Referencias|References|Notas|Notes)[ \t]*\1[ \t]*\r?\n/g)];
 if(!headings.length)return null;
 const match=headings.at(-1),at=match.index+(match[0][0]==='\n'?1:0),end=match.index+match[0].length,
  context=v24SyntaxContext(view,at);
 if(['templates','html','tables','links','external'].some(key=>context[key]?.length))return null;
 const gap=source.slice(end,start);let cursor=0,categories=0,comments=0;
 while(cursor<gap.length){
  const rest=gap.slice(cursor),space=/^[ \t\r\n]+/.exec(rest),comment=/^<!--[\s\S]*?-->/.exec(rest),
   category=/^\[\[[ \t]*(?:Categoria|Category)[ \t]*:[^\[\]{}<>\r\n]+\]\]/i.exec(rest),token=space||comment||category;
  if(!token)return null;
  if(category&&token===category)categories++;
  if(comment&&token===comment)comments++;
  cursor+=token[0].length;
 }
 return categories||comments?{start:at,end,level:match[1].length,name:norm(match[2]),categories,comments}:null;
}
function v2217ReferenceManualHeading(source,start,view){
 const headings=[...view.slice(0,start).matchAll(/(?:^|\n)(={2,6})[ \t]*([^\r\n]*?)[ \t]*\1[ \t]*\r?\n/g)];
 if(!headings.length)return null;
 const match=headings.at(-1),at=match.index+(match[0][0]==='\n'?1:0),end=match.index+match[0].length,
  context=v24SyntaxContext(view,at);
 if(!match[2].trim()||['templates','html','tables','links','external'].some(key=>context[key]?.length))return null;
 const gap=source.slice(end,start);let cursor=0,categories=0,comments=0;
 while(cursor<gap.length){
  const rest=gap.slice(cursor),space=/^[ \t\r\n]+/.exec(rest),comment=/^<!--[\s\S]*?-->/.exec(rest),
   category=/^\[\[[ \t]*(?:Categoria|Category)[ \t]*:[^\[\]{}<>\r\n]+\]\]/i.exec(rest),token=space||comment||category;
  if(!token)return null;
  if(category&&token===category)categories++;
  if(comment&&token===comment)comments++;
  cursor+=token[0].length;
 }
 return{start:at,end,level:match[1].length,name:norm(match[2]),categories,comments};
}
function v2217ReferenceRendererMode(row){
 if(row.native)return'unheaded';
 const head=v215TemplateTitle(row.head||'');
 if(row.reflist||row.notelist||['Reflist','Notelist','Listanota','NoteFoot','Notefoot','RodapéNota'].some(n=>v215SameTemplateTitle(head,n)))return'unheaded';
 if(v219NativeReferenceCollectorAlias(head)||['Listaref','Références','Notas','Notas e referências'].some(n=>v215SameTemplateTitle(head,n)))return'headed';
 if(['REFLIST','Rodapénota','Rodapenota','Refrências','Referênicas','Referncias','Referênçias','Referéncias','Referên cias','Refereencias','Notes','Notas e Referências'].some(n=>v215SameTemplateTitle(head,n)))return'missing';
 return'unknown';
}
function v2217ReferenceHeadingProvider(raw){
 const p=parsedTemplate(raw),head=v215TemplateTitle(p.parts[0]),entries=foreignEntries(p),selected=key=>entries.filter(e=>e.key===key).at(-1);
 if(v215SameTemplateTitle(head,'Notas e referências'))return{known:true,headed:true,level:3,name:'referências',provider:head};
 const refs=!!v219NativeReferenceCollectorAlias(head)||['Listaref','Références'].some(n=>v215SameTemplateTitle(head,n)),notes=v215SameTemplateTitle(head,'Notas'),direct=v215SameTemplateTitle(head,'Esconder link para editar seção');
 if(!refs&&!notes&&!direct)return{known:false};
 const named=selected('nível'),visible=direct?null:named||(notes?selected('2'):selected('3')),
  levelField=direct?selected('2'):named||selected('2'),literal=levelField?.value.trim(),level=/^[1-5]$/.test(literal||'')?Number(literal):2;
 if(!direct&&visible?.value.trim()==='0')return{known:true,headed:false,level:0,name:refs?'referências':'notas',provider:head};
 return{known:true,headed:true,level,name:refs?'referências':notes?'notas':'',provider:head};
}
function v2217ReferenceHtmlOwnerClosed(view,opening,limit){
 const stack=[],voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
 for(let at=opening.start;at<limit;){const next=view.indexOf('<',at);if(next<0||next>=limit)return false;const tag=v24SyntaxTag(view,next);at=tag?tag.end:next+1;if(!tag)continue;
  if(tag.close){if(stack.at(-1)!==tag.name)return false;stack.pop();if(!stack.length)return tag.end<=limit;}
  else if(!tag.self&&!voids.has(tag.name))stack.push(tag.name);
 }
 return false;
}
function v2217ReferenceManualSection(source,start,view){
 const candidates=[],hard=[...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)],tags=[],notes=v219NativeNoteProfiles(source);
 for(let at=view.indexOf('<');at>=0&&at<start;){const tag=v24SyntaxTag(view,at);if(tag)tags.push(tag);at=view.indexOf('<',tag?tag.end:at+1);}
 const outside=(at,end,heading=false)=>{
  if(hard.some(r=>r.start<end&&r.end>at)||tags.some(tag=>tag.start<at&&tag.end>at))return false;
  const context=v24SyntaxContext(view,at);if(['templates','tables','links','external'].some(key=>context[key]?.length))return false;
  return!context.html.length||heading&&context.html.every(tag=>['div','section','article','main','aside','header','footer','nav'].includes(tag.name)&&v2217ReferenceHtmlOwnerClosed(view,tag,start));
 };
 for(const match of view.slice(0,start).matchAll(/(?:^|\n)(={1,6})[ \t]*([^\r\n]*?)[ \t]*\1[ \t]*(?:\r?\n|$)/g)){
  const at=match.index+(match[0][0]==='\n'?1:0),end=match.index+match[0].length;
  if(match[2].trim()&&outside(at,end,true))candidates.push({start:at,end,level:match[1].length,name:norm(match[2]),syntax:'wiki'});
 }
 // Only complete, quote-aware HTML heading pairs can be owners. Never infer
 // an end tag or take a heading from inside a literal, ref, table or template.
 for(let at=view.indexOf('<');at>=0&&at<start;){
  const tag=v24SyntaxTag(view,at);at=tag?tag.end:view.indexOf('<',at+1);if(!tag)continue;
  if(!/^h[1-6]$/.test(tag.name)||tag.close||tag.self||!outside(tag.start,tag.end,true))continue;
  let cursor=tag.end,depth=1,close=null;
  while(cursor<start){const next=view.indexOf('<',cursor);if(next<0||next>=start)break;const peer=v24SyntaxTag(view,next);cursor=peer?peer.end:next+1;if(!peer)continue;
   if(peer.name===tag.name&&!peer.self){depth+=peer.close?-1:1;if(!depth){close=peer;break;}}
  }
  if(close&&close.end<=start)candidates.push({start:tag.start,end:close.end,level:Number(tag.name[1]),name:'',syntax:'html',headingHash:v24SyntaxHash(source.slice(tag.start,close.end))});
 }
 for(const node of topNodes(view)){
  if(node.end>start||!outside(node.start,node.end))continue;
  const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),head=v215TemplateTitle(p.parts[0]),provider=v2217ReferenceHeadingProvider(raw);
  if(provider.known){if(provider.headed)candidates.push({start:node.start,end:node.end,level:provider.level,name:provider.name,syntax:'native-provider',provider:provider.provider});continue;}
  if(notes.some(note=>note.start===node.start&&note.end===node.end&&note.raw===raw&&note.eligible===true&&note.helperKind==='note'&&[57056787,68628864,68628877].includes(note.nativeOldid)))continue;
  const mode=v2217ReferenceRendererMode({head}),profile=INFOBOX_CATALOG[norm(head)];
  if(mode==='unheaded'||mode==='missing'){candidates.push({start:node.start,end:node.end,level:null,name:'',syntax:'prior-unheaded-renderer',provider:head});continue;}
  if(mode!=='unknown'||profile&&v215SameTemplateTitle(head,profile.title)||v219NativeCitationStateInterface(raw)||v2111ReferenceFreeTemplate(raw)||v219LiteralDefaultSortCall(raw)||['Portal3','Controle de autoridade'].some(n=>v215SameTemplateTitle(head,n)))continue;
  // An unknown top-level expansion is not evidence that the article has no
  // heading. A headless migration preserves either possible source result.
  candidates.push({start:node.start,end:node.end,level:null,name:'',syntax:'unknown-provider',provider:head});
 }
 for(const row of v2215ReferenceCollectorRows(source).rows){
  if(row.end<=start&&row.native&&outside(row.start,row.end))candidates.push({start:row.start,end:row.end,level:null,name:'',syntax:'prior-unheaded-renderer',provider:'references'});
 }
 const owner=candidates.sort((a,b)=>b.start-a.start||b.end-a.end)[0];return owner?{...owner,retainedSectionContentEnd:start}:null;
}
function v2217ReferenceSourceUnheaded(row){return['unheaded','missing'].includes(v2217ReferenceRendererMode(row));}
function v2217ReferenceDropGeneratedLevel(target,row,level=6){
 if(row.entries.some(e=>['nível','nivel','3'].includes(e.key)))return target;
 const p=parsedTemplate(target),levels=foreignEntries(p).filter(e=>!e.positional&&e.key==='nível');
 if(levels.length!==1||levels[0].value.trim()!==String(level))return target;
 return'{{'+p.parts.filter((part,index)=>index!==levels[0].index).join('|')+'}}';
}
function v2217ReferenceOwnedCollectorEdit(source,row,start,target,cfg={}){
 const identity={start:row.start,target:row.raw},mode=v2217ReferenceRendererMode(row),p=parsedTemplate(target),head=v215TemplateTitle(p.parts[0]),combined=v215SameTemplateTitle(head,'Notas e referências');
 if(mode==='unknown')return identity;
 if(start<row.start){
  const chain=v2217ReferenceHeadingChain(source,row.start),outer=chain.find(h=>h.start===start);
  if(combined){if(!outer||outer.level!==2||cfg.headings===false||cfg.automaticReferenceCollectorHeadings===false)return identity;return{start,target};}
  if(outer&&(outer.level===6||['notas','notes'].includes(outer.name)&&v2217ReferenceHeadingProvider(target).name==='referências')){start=row.start;target=v2217ReferenceDropGeneratedLevel(target,row,outer.level);}
  else return{start,target};
 }
 const owner=v2217ReferenceManualSection(source,row.start,protectedView(source));
 if(combined){
  if(mode==='headed')return{start,target};
  if(cfg.headings===false||cfg.automaticReferenceCollectorHeadings===false||owner)return identity;
  return{start,target};
 }
 if(!v2217ReferenceSourceUnheaded(row)||!owner)return{start,target};
 if(row.entries.some(e=>['nível','nivel','3'].includes(e.key)))return identity;
 const current=parsedTemplate(target),fields=foreignEntries(current),provider=v2217ReferenceHeadingProvider(target);
 if(provider.known&&!provider.headed)return{start,target};
 if(fields.some(e=>['nível','nivel','3'].includes(e.key)))return identity;
 if(!['Referências','Notas'].some(n=>v215SameTemplateTitle(v215TemplateTitle(current.parts[0]),n)))return identity;
 return{start,target:target.slice(0,-2)+'|nível=0}}'};
}
function v2217ReferenceOwnedCollectorTarget(source,row,start,target,cfg={}){return v2217ReferenceOwnedCollectorEdit(source,row,start,target,cfg).target;}
function v221MissingDefaultCollectorPlan(source,cfg={}){
 const plan=v2217Previous_v221MissingDefaultCollectorPlan(source,cfg);
 if(plan.edits?.length!==1)return plan;
 const edit=plan.edits[0];if(!/^[ \t\r\n]*\{\{Referências\}\}[ \t\r\n]*$/.test(edit.text))return plan;
 const owner=v2217ReferenceManualSection(source,edit.start,protectedView(source));if(!owner)return plan;
 const next={...edit,text:edit.text.replace('{{Referências}}','{{Referências|nível=0}}'),proof:{...edit.proof,retainedHeadingOwner:owner,headingContract:63785697}};
 return{...plan,edits:[next],text:v24SyntaxApply(source,[next])};
}
function v2217ReferenceCombinedAllowed(source,a,b,edit,cfg={}){
 if(cfg.headings===false||cfg.automaticReferenceCollectorHeadings===false)return false;
 const view=protectedView(source),owner=v2217ReferenceManualSection(source,a.start,view);
 if(!owner)return true;
 return owner.start>=edit.start&&owner.end<=a.start&&owner.syntax==='wiki'&&owner.level===2&&['notas','notes','notas e referências'].includes(owner.name);
}
function v2216ReferenceCombinedCollectorEdits(source,cfg={}){
 const edits=v2217Previous_v2216ReferenceCombinedCollectorEdits(source,cfg);if(!edits.length)return edits;
 const rows=v2215ReferenceCollectorRows(source).rows;return edits.filter(edit=>{
  const inside=rows.filter(row=>row.start>=edit.start&&row.end<=edit.end);return inside.length===2&&v2217ReferenceCombinedAllowed(source,inside[0],inside[1],edit,cfg);
 });
}
// The retained numeric-column producer must honor the same original manual
// heading as the plain/native producer. All its existing scope, group and
// numeric-interface checks run before this bounded replacement adjustment.
function v2216ReferenceReflistEdits(source,cfg={}){
 const edits=v2217Previous_v2216ReferenceReflistEdits(source,cfg);if(!edits.length)return edits;
 const scan=v2215ReferenceCollectorRows(source);return edits.map(edit=>{
  if(edit.kind!=='reflist-literal-columns')return edit;
  const row=scan.rows.find(r=>r.reflist&&r.start===edit.start&&r.end===edit.end);if(!row)return edit;
  const owned=v2217ReferenceOwnedCollectorEdit(source,row,edit.start,edit.text,cfg);
  if(owned.start===edit.start&&owned.target===edit.text)return edit;
  return{...edit,start:owned.start,text:owned.target,witness:{...edit.witness,retainedHeadingOwner:v2217ReferenceManualSection(source,row.start,scan.view)}};
 });
}
// Preserve an already supported atomic combination before per-row suppression.
// Only levels generated by these exact delegated steps enter the private trial;
// a caller's explicit layout or level never becomes an eligibility shortcut.
function v2217ReferenceAtomicCombinedEdits(source,cfg={}){
 if(cfg.references===false||cfg.unifiedNotesReferences===false||cfg.headings===false||cfg.automaticReferenceCollectorHeadings===false||v24SyntaxScan(source).issues.length||v219ReferenceCollectorTargeted(source))return[];
 const original=v2215ReferenceCollectorRows(source).rows;
 if(original.length!==2)return[];
 const [a,b]=original,plainOrNumeric=row=>row.plain||row.reflist&&row.entries.filter(e=>e.positional||e.key==='1').length===1&&
  row.entries.filter(e=>e.positional||e.key==='1').every(e=>/^[1-9]\d?$/.test(e.value.trim()))&&
  row.entries.filter(e=>!e.positional&&e.key!=='1').length<=1&&row.entries.filter(e=>!e.positional&&e.key!=='1').every(e=>['group','grupo'].includes(e.key));
 if(a.kind!=='notes'||!a.group||b.kind!=='references'||b.group||a.start>=b.start||
  original.some(row=>!['headed','unheaded'].includes(v2217ReferenceRendererMode(row))||!plainOrNumeric(row)||row.entries.some(e=>['nível','nivel','3'].includes(e.key))))return[];
 const noteHeading=a.heading&&a.heading.level===2&&['notas','notes','notas e referências'].includes(a.heading.name)?a.heading:null;
 if(a.heading&&!noteHeading)return[];
 const gap=source.slice(a.end,b.start),referenceHeading=b.heading&&b.heading.level===2&&['referências','referencias','references'].includes(b.heading.name)?b.heading:null;
 if(gap.trim()&&(!referenceHeading||referenceHeading.start<a.end||source.slice(a.end,referenceHeading.start).trim()||source.slice(referenceHeading.end,b.start).trim()))return[];
 const range={start:noteHeading?noteHeading.start:a.start,end:b.end};
 if(!v2217ReferenceCombinedAllowed(source,a,b,range,cfg))return[];
 let text=source;const steps=[],generated=[],step=(name,edits)=>{if(!edits.length)return;const before=text;edits=edits.slice().sort((a,b)=>a.start-b.start||a.end-b.end);
  if(edits.some((e,i)=>i&&e.start<edits[i-1].end))throw new Error('Overlapping collector proof');
  text=v24SyntaxApply(before,edits);steps.push({name,sourceHash:v24SyntaxHash(before),textHash:v24SyntaxHash(text),edits});
 };
 const group=v2215ReferenceSingleGroupPlan(text,cfg);
 if(group.source!==text||group.sourceHash!==v24SyntaxHash(text)||v24SyntaxApply(text,group.edits)!==group.text||JSON.stringify(v2215ReferenceSingleGroupPlan(text,cfg))!==JSON.stringify(group))return[];
 generated.push(...group.edits.filter(e=>e.kind==='single-note-collector').map(e=>e.text));step('existing-single-note-group',group.edits);
 const numeric=v2216ReferenceReflistEdits(text,cfg);if(numeric.some(e=>e.kind!=='reflist-literal-columns'))return[];
 generated.push(...numeric.map(e=>e.text));step('existing-numeric-collector',numeric);
 const normalization=v2215ReferenceCollectorPlan(text,cfg);
 if(!v2215ReferenceCollectorProof(text,normalization.text,normalization,cfg))return[];
 for(const part of normalization.steps){if(part.sourceHash!==v24SyntaxHash(text))return[];generated.push(...part.edits.map(e=>e.text));step('existing-normalization-'+part.name,part.edits);if(text!==part.text)return[];}
 const normalized=v2215ReferenceCollectorRows(text).rows;
 if(normalized.length===1&&normalized[0].kind==='combined'){}
 else if(normalized.length!==2)return[];
 const rows=normalized,masks=[];
 for(const row of rows){const level=row.entries.filter(e=>!e.positional&&e.key==='nível');if(!level.length)continue;
  if(level.length!==1||level[0].value.trim()!=='0'||!generated.includes(row.raw))return[];
  const p=parsedTemplate(row.raw),target='{{'+p.parts.filter((part,index)=>index!==level[0].index).join('|')+'}}';
  masks.push({start:row.start,end:row.end,text:target,kind:'derived-generated-heading-control',count:0,witness:{generated:row.raw,nativeTemplateOldid:63785697}});
 }
 step('private-generated-control-trial',masks);
 const preferred=v2215ReferenceCollectorPlan(text,cfg);
 if(!v2215ReferenceCollectorProof(text,preferred.text,preferred,cfg))return[];
 for(const part of preferred.steps){if(part.sourceHash!==v24SyntaxHash(text))return[];step('existing-'+part.name,part.edits);if(text!==part.text)return[];}
 const final=v2215ReferenceCollectorRows(text).rows;
 if(final.length!==1||final[0].kind!=='combined'||!v215SameTemplateTitle(final[0].head,'Notas e referências')||
  final[0].entries.length>1||final[0].entries.some(e=>e.positional||e.key!=='grupo')||text===source)return[];
 if(!steps.some(s=>s.name.endsWith('unified-notes-references')))return[];
 let start=0,end=source.length,next=text.length;while(start<end&&start<next&&source[start]===text[start])start++;while(end>start&&next>start&&source[end-1]===text[next-1]){end--;next--;}
 const count=steps.filter(s=>s.name!=='private-generated-control-trial').reduce((n,s)=>n+s.edits.reduce((m,e)=>m+(e.count??1),0),0);
 return[{start,end,text:text.slice(start,next),count:Math.max(1,count),kind:'atomic-existing-native-collector-combination',witness:{sourceHash:v24SyntaxHash(source),originalCollectors:original.map(r=>r.raw),originalRange:range,steps,nativeCombinedOldid:73218466}}];
}
function v2217ReferenceCollectorEdits(source,cfg={}){
 if(!/(?:\{\{[^|{}]{0,100}(?:ref|nota|note)|<\s*references\b)/i.test(source))return[];
 let needsScan=/<\s*references\b/i.test(source)||/(?:^|\n)[ \t]*={2,6}[ \t]*(?:Refer[eê]ncias|References|Notas|Notes|Notas e referências|Cita[cç][oõ]es)[ \t]*={2,6}/i.test(source);
 if(!needsScan)for(const match of source.matchAll(/\{\{[ \t]*([^{}|\r\n]{1,100})(?=\||\}\})/g)){
  const head=v215TemplateTitle(match[1]),key=norm(head);
  if(['Referências','Notas','Notas e referências'].includes(head))continue;
  if(v219NativeReferenceCollectorAlias(head)||['reflist','referências','referencias','referência','refereencias','notas e referencias','notas e referências','notas','notefoot','rodapénota','rodapenota'].includes(key)){needsScan=true;break;}
 }
 if(!needsScan)return[];
 let observedGroups,groupsRead=false;const visibleGroups=()=>{if(!groupsRead){observedGroups=v2215ReferenceVisibleGroups(source);groupsRead=true;}return observedGroups;};
 const rows=v2215ReferenceCollectorRows(source).rows,edits=[],view=protectedView(source),
  protectedRanges=[...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)];
 for(const node of topNodes(view)){
  if(rows.some(r=>r.start===node.start)||protectedRanges.some(r=>r.start<node.end&&r.end>node.start))continue;
  const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),key=norm(v215TemplateTitle(p.parts[0]));
  if(p.parts.length!==1||!v219OriginalTemplateHeaderAllowed(p.parts[0]))continue;
  const a=source.lastIndexOf('\n',node.start-1)+1,z=source.indexOf('\n',node.end),b=z<0?source.length:z,c=v24SyntaxContext(view,node.start);
  if(source.slice(a,node.start).trim()||source.slice(node.end,b).trim()||['templates','html','tables','links','external'].some(k=>c[k]?.length))continue;
  let target=null,kind='references',group='';
  if(['referências','referencias','referência','refereencias','reflist'].includes(key))target='{{Referências}}';
  else if(['notas e referencias','notas e referências'].includes(key)){target='{{Notas e referências}}';kind='combined';}
  else if(['notas','notefoot','rodapénota','rodapenota'].includes(key)&&visibleGroups()&&[...visibleGroups()].every(g=>g==='nota')&&
   v2215ReferenceObservedProducers(source,{parsed:templates(view),rows:rows.concat(node)},v219NativeNoteProfiles(source))){target='{{Notas}}';kind='notes';group='nota';}
  if(target)rows.push({...node,raw,head:p.parts[0],key,kind,group,plain:true,entries:[],extraTarget:target});
 }
 rows.sort((a,b)=>a.start-b.start);
 for(const row of rows){
  let target=null;
  const chain=v2217ReferenceHeadingChain(source,row.start),categoryHeading=chain.length?null:v2217ReferenceCategoryGapHeading(source,row.start,view),
   referenceTitle=new Set(['referências','referencias','references']),notesTitle=new Set(['notas','notes']),
   headerAllowed=cfg.headings!==false&&cfg.automaticReferenceCollectorHeadings!==false&&
    !row.entries.some(e=>['nível','nivel','3'].includes(e.key));
  if(row.extraTarget)target=row.extraTarget;
  else if(row.reflist){
   // A width or numeric column interface has a native responsive=0 contract.
   // Do not imitate it with CSS around a second responsive renderer.
   const keys=new Set(),allowed=row.entries.every(e=>!e.positional&&['group','grupo','refs','liststyle','estilolista','listaestilo'].includes(e.key)&&!keys.has(e.key)&&keys.add(e.key));
   const groupFields=row.entries.filter(e=>['group','grupo'].includes(e.key)),styleFields=row.entries.filter(e=>['liststyle','estilolista','listaestilo'].includes(e.key));
   if(allowed&&groupFields.length<=1&&styleFields.length<=1){
    const rest=[];for(const e of row.entries)rest.push('|'+(e.key==='group'?'grupo':['liststyle','listaestilo'].includes(e.key)?'estilolista':e.key)+'='+e.value);
    target='{{Referências'+rest.join('')+'}}';
   }
  }else if(row.native&&row.plain)target=row.kind==='notes'?'{{Notas'+(row.group&&row.group!=='nota'?'|grupo='+row.group:'')+'}}':'{{Referências'+(row.group?'|grupo='+row.group:'')+'}}';
  else if((row.alias||row.typo)&&row.kind==='references'){const p=parsedTemplate(row.raw);target='{{Referências'+row.raw.slice(2+p.parts[0].length);}
  else if(row.kind==='references'&&row.head==='Referências')target=row.raw;
  if(!target){
   // Keep the functional custom collector and its parent heading; remove a
   // blank Citações subsection only when its reference parent is explicit.
   if(headerAllowed&&row.reflist&&chain.length>=2&&v2217ReferenceNestedHeadingChain(chain)&&referenceTitle.has(chain[0].name)&&['citações','citacoes'].includes(chain.at(-1).name))
    edits.push({start:chain.at(-1).start,end:row.start,text:'',kind:'empty-reference-subheading',count:1,witness:{collector:row.raw,keptParent:chain[0]}});
   continue;
  }
  let start=row.start,count=target===row.raw?0:1;
  if(headerAllowed&&chain.length&&chain[0].level<=5&&v2217ReferenceNestedHeadingChain(chain)){
   const acceptable=chain.every(h=>referenceTitle.has(h.name)||['citações','citacoes'].includes(h.name)||notesTitle.has(h.name)&&visibleGroups()?.size===0);
   const hasReferences=chain.some(h=>referenceTitle.has(h.name));
   if(row.kind==='references'&&!row.group&&acceptable&&hasReferences){start=chain[0].start;count+=chain.length;if(chain[0].level!==2)target=target.slice(0,-2)+'|nível='+chain[0].level+'}}';}
   else if(chain.length===1&&((row.kind==='references'&&referenceTitle.has(chain[0].name))||(row.kind==='notes'&&notesTitle.has(chain[0].name)&&v2217ReferenceHeadingProvider(target).name==='notas')||(row.kind==='combined'&&chain[0].name==='notas e referências'))){
    start=chain[0].start;count++;
    if(chain[0].level!==2)target=target.slice(0,-2)+'|nível='+chain[0].level+'}}';
   }
  }
  // Category declarations and comments do not render section content. Keep
  // the existing manual title when they separate it from a native renderer.
  // Every gap byte and the renderer's literal group remain unchanged.
  // An unheaded source renderer may belong to a differently named manual
  // section. Keep that title and its literal nonrendering gap when replacing
  // the renderer; adding another automatic heading would change the sections.
  const manualHeading=start===row.start&&v2217ReferenceSourceUnheaded(row)?v2217ReferenceManualSection(source,row.start,view):null,
   suppressHeading=!headerAllowed||manualHeading||categoryHeading&&
   (referenceTitle.has(categoryHeading.name)||row.group&&notesTitle.has(categoryHeading.name));
  if(suppressHeading&&v2217ReferenceSourceUnheaded(row)&&!v215SameTemplateTitle(v215TemplateTitle(parsedTemplate(target).parts[0]),'Notas e referências')&&!row.entries.some(e=>['nível','nivel','3'].includes(e.key)))target=target.slice(0,-2)+'|nível=0}}';
  const owned=v2217ReferenceOwnedCollectorEdit(source,row,start,target,cfg);start=owned.start;target=owned.target;
  if(start!==row.start||target!==row.raw)edits.push({start,end:row.end,text:target,kind:'native-reference-collector',count:Math.max(1,count),witness:{original:row.raw,headingChain:chain,group:row.group}});
 }
 return edits.filter(e=>!edits.some(o=>o!==e&&o.start<e.end&&e.start<o.end));
}
function v2217ReferenceCitationRecord(body){
 if(typeof body!=='string'||/<!--|<\/?(?:ref|references)\b/i.test(body))return null;
 const raw=body.trim(),p=parsedTemplate(raw),context=v2212CitationContext(raw);
 if(!context||!v215LiteralTemplateIdentity(raw)||!v2215CitationReader(context)||context.fields.some(f=>f.positional)||!v220CitationNamedFields(context.fields))return null;
 if(raw!==body.trim()||!/^\{\{[\s\S]*\}\}$/.test(raw))return null;
 const parsed=templates(protectedView(raw));if(parsed.unclosed.length||!parsed.nodes.some(n=>n.start===0&&n.end===raw.length)||parsed.nodes.length!==1)return null;
 const reader=v2215CitationReader(context),map=new Map();
 for(const field of context.fields){
  if(!nativeCitationAccepts(context.native,field.key))return null;
  const roles=v2215CitationModelRoles(field.key,reader);if(roles.length!==1||map.has(roles[0])||/[{}<>]/.test(field.value))return null;
  map.set(roles[0],{...field,value:field.value.trim()});
 }
 return{raw,p,context,reader,map,padding:body.slice(0,body.indexOf(raw)),suffix:body.slice(body.indexOf(raw)+raw.length)};
}
function v2217ReferenceComplementaryBody(bodies){
 const records=bodies.map(v2217ReferenceCitationRecord);if(records.some(r=>!r)||new Set(records.map(r=>r.reader.kind)).size!==1||records[0].reader.kind!=='book')return null;
 const ancillary=role=>role==='Language'||role==='TitleLink'||/^(?:AuthorList|EditorList|TranslatorList|ContributorList)-Link:/.test(role),base=records[0],core=r=>JSON.stringify([...r.map].filter(([k])=>!ancillary(k)).map(([k,f])=>[k,f.value]).sort());
 if(records.some(r=>core(r)!==core(base)))return null;
 if(!['Title','Year','PublisherName','Identifier:ISBN'].every(k=>base.map.get(k)?.value)||!v213ISBN(base.map.get('Identifier:ISBN').value)||![...base.map].some(([k,f])=>/^(?:AuthorList|EditorList)-Last:/.test(k)&&f.value))return null;
 const union=new Map(base.map);let additions=0;
 for(const r of records.slice(1))for(const [role,field]of r.map){
  const prior=union.get(role);
  if(prior?.value&&field.value&&prior.value!==field.value)return null;
  if(field.value&&(!prior||!prior.value)){if(!ancillary(role))return null;union.set(role,field);additions++;}
 }
 if(!additions&&records.every(r=>r.raw===base.raw))return null;
 const edits=[];
 for(const[role,field]of union){
  const prior=base.map.get(role);if(prior?.value===field.value)continue;
  if(prior)edits.push({start:prior.start,end:prior.end,text:v221CitationPadded(base.context.fields.find(f=>f.key===prior.key).value,field.value)});
  else edits.push({start:base.raw.length-2,end:base.raw.length-2,text:'|'+field.key+'='+field.value});
 }
 const raw=v24SyntaxApply(base.raw,edits),check=v2217ReferenceCitationRecord(raw);
 if(!check||[...union].some(([role,f])=>check.map.get(role)?.value!==f.value))return null;
 return{body:base.padding+raw+base.suffix,count:edits.length,identity:{title:base.map.get('Title').value,isbn:base.map.get('Identifier:ISBN').value,year:base.map.get('Year').value},fields:[...union].map(([role,f])=>[role,f.value])};
}
function v2217ReferenceNamedDefinitionEdits(source,cfg={}){
 if(cfg.automaticIdenticalReferences===false)return[];
 const names=new Set();let repeated=false;
 for(const match of source.matchAll(/<ref\b[^>]*\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))[^>]*>/gi)){
  if(/\/\s*>$/.test(match[0]))continue;
  const name=decodedReferenceName(match[1]??match[2]??match[3]??'');if(names.has(name)){repeated=true;break;}names.add(name);
 }
 if(!repeated)return[];
 const graph=v2216ReferenceGraph(source),families=new Map(),edits=[],renderers=rendererRanges(graph.view);
 if(/\{\{\{|\{\{\s*#tag\s*:\s*ref\b/i.test(graph.view))return[];
 for(const ref of graph.refs){if(!ref.name)continue;const key=JSON.stringify([ref.group,ref.name]),family=families.get(key)||[];family.push(ref);families.set(key,family);}
 for(const family of families.values()){
  if(family.some(r=>!r.eligible)||graph.unclosed.some(r=>r.name===family[0].name&&r.group===family[0].group)||graph.empties.some(r=>r.name===family[0].name&&r.group===family[0].group))continue;
  if(new Set(family.map(r=>renderers.filter(n=>n.end<=r.start).length)).size!==1)continue;
  const defs=family.filter(r=>r.body!==null);if(defs.length<2||defs.some(r=>!r.body.trim()))continue;
  const bodies=defs.map(r=>r.body),same=bodies.every(body=>body===bodies[0]),merged=same?null:v2217ReferenceComplementaryBody(bodies);
  if(!same&&!merged)continue;
  const first=defs[0];
  if(merged&&merged.body!==first.body)edits.push({start:first.openEnd,end:first.openEnd+first.body.length,text:merged.body,kind:'complementary-reference-metadata',count:Math.max(1,merged.count),witness:{name:first.name,group:first.group,originalBodies:bodies,mergedBody:merged.body,identity:merged.identity,fields:merged.fields}});
  for(const ref of defs.slice(1)){
   const opening=source.slice(ref.start,ref.openEnd),text=opening.replace(/>$/,' />');
   edits.push({start:ref.start,end:ref.end,text,kind:'repeated-named-definition',count:1,witness:{name:ref.name,group:ref.group,originalBody:ref.body,retainedBody:merged?.body||first.body,definitionStart:first.start}});
  }
 }
 return edits;
}
function v2217ReferencePlan(source,options={}){
 const plan={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};
 if(!v2217ReferenceScope(source,options))return plan;
 const cfg=pageContextOptions({...DEFAULTS,...options}),stage=(name,find)=>{
  const before=plan.text;let edits;try{edits=find(before)||[];}catch{return;}
  if(!edits.length)return;
  const sorted=edits.slice().sort((a,b)=>a.start-b.start||a.end-b.end);if(sorted.some((e,i)=>i&&e.start<sorted[i-1].end))return;
  const after=v24SyntaxApply(before,sorted);if(after===before)return;
  plan.steps.push({name,before,after,edits:sorted});plan.edits.push(...sorted);plan.text=after;
 };
 stage('native-reference-calls',s=>v2217ReferenceCallEdits(s,cfg));
 stage('atomic-existing-collector-combination',s=>v2217ReferenceAtomicCombinedEdits(s,cfg));
 stage('native-collector-headings',s=>v2217ReferenceCollectorEdits(s,cfg));
 stage('named-definitions',s=>v2217ReferenceNamedDefinitionEdits(s,cfg));
 return plan;
}
function v2217ReferenceProof(before,after,plan,options={}){
 if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
 let current=before;for(const step of plan.steps||[]){if(step.before!==current||v24SyntaxApply(current,step.edits)!==step.after)return false;current=step.after;}
 if(current!==after)return false;
 const fresh=v2217ReferencePlan(before,options);
 return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
function v2217ReferenceProjection(source,options={}){
 const plan=v2217ReferencePlan(source,options);return v2217ReferenceProof(source,plan.text,plan,options)?plan.text:source;
}
