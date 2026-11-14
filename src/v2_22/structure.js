// Finite source repairs with complete owners; literals and ambiguity remain unchanged.
const V222_STRUCTURE_NATIVE_PAIRS='sha256:dbb31685d21b8cce1f4b139c5e330237031adbd5e4195dd8301316599f66ce44';
const V222_STRUCTURE_STEPS=Object.freeze(['template-prefix','html-closures','html-headings','heading-aliases','gallery-empty','list-breaks','blank-list-gaps','image-digits','url-protocol','percent-links','youtube','isbn-links','categories']);
function v222StructureScope(source,cfg={}){return typeof source==='string'&&v2215AliasScope(source,cfg,false)&&cfg.markup!==false&&cfg.structuralRepairs!==false&&!cfg.discussionPage&&!v20DefinitionContext(cfg);}
function v222StructureContext(source){const shield=v24SyntaxProtected(source),view=shield.view,ranges=[...shield.ranges,...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)];return{view,ranges,nodes:templates(view).nodes,blocked:(a,b)=>ranges.some(r=>r.start<b&&a<r.end)};}
function v222StructurePlainOwner(c,a,b,{template=false,link=false}={}){if(c.blocked(a,b))return false;const state=v24SyntaxContext(c.view,a);return !state.html.length&&!state.tables.length&&!state.templates.length&&!state.links.length&&!state.external.length;}
function v222StructureEdit(source,start,end,text,kind,proof={}){return{start,end,text,count:1,kind,proof:{sourceHash:v24SyntaxHash(source),...proof}};}
function v222StructureCategoryEdits(source,cfg={}){
 if(cfg.categories===false||cfg.endMatter===false)return[];const c=v222StructureContext(source),edits=[],cats=editorialWikiLinkRanges(c.view).filter(n=>/^\[\[(?:Categoria|Category):[^\[\]{}<>\r\n]+\]\]$/i.test(source.slice(n.start,n.end))&&v222StructurePlainOwner(c,n.start,n.end,{link:true}));
 for(let j=1;j<cats.length;j++){const a=cats[j-1],b=cats[j],gap=source.slice(a.end,b.start);if(!/^[ \t\r\n]*$/.test(gap))continue;if(gap!=='\n')edits.push(v222StructureEdit(source,a.end,b.start,'\n','v222-category-line-boundary',{categoryCallsPreserved:true}));}
 for(const cat of cats){const prev=c.nodes.filter(n=>n.end<=cat.start).at(-1);if(!prev||source.slice(prev.end,cat.start).trim()||source.slice(prev.end,cat.start).includes('\n'))continue;const raw=source.slice(prev.start,prev.end),head=parsedTemplate(raw).parts[0],nativeStub=v215SameTemplateTitle(head,'Esboço-livro'),nativeTaxon=v215SameTemplateTitle(head,'Taxonbar'),role=footerRole(raw,cfg.footerProfiles||{})||(nativeStub?'stub':nativeTaxon?'taxonbar':null);if(['stub','navbox','authority','portal','sort','taxonbar'].includes(role)&&v222StructurePlainOwner(c,prev.start,prev.end,{template:true}))edits.push(v222StructureEdit(source,prev.end,cat.start,'\n','v222-footer-category-boundary',{role}));}
 return edits;
}
function v222StructureEmptyBulletEdits(source,cfg={}){
 if(cfg.endMatter===false)return[];const c=v222StructureContext(source),edits=[];
 for(const m of source.matchAll(/^\*[ \t]*(?:\r?\n|$)(?:[ \t]*\r?\n)*/gm)){
  const start=m.index,end=start+m[0].length;if(!v222StructurePlainOwner(c,start,end))continue;
  const left=source.slice(0,start).trimEnd(),tail=source.slice(end),previous=left.slice(left.lastIndexOf('\n')+1),next=tail.split(/\r?\n/)[0];
  if(!/^<\/gallery[ \t]*>$/i.test(previous)||/^\*\*/.test(next))continue;
  const n=c.nodes.find(n=>n.start===end),collector=n&&['Referências','Notas','Notas e referências','Reflist','Notelist'].some(x=>v215SameTemplateTitle(parsedTemplate(source.slice(n.start,n.end)).parts[0],x));
  if(!collector&&!/^={2,6}[ \t]*(?:Referências|Referência|Notas|Bibliografia|Ligações externas)[ \t]*={2,6}[ \t]*$/.test(next)&&!/^\[\[Categoria:/.test(next))continue;
  edits.push(v222StructureEdit(source,start,end,'','v222-empty-gallery-tail-bullet',{closedGallery:true,dependentSubitems:false}));
 }
 return edits;
}
function v222StructureListBreakEdits(source){const c=v222StructureContext(source),edits=[];
 for(const m of source.matchAll(/^([*#])(?=[^*#:;])[^\r\n]*?(<br[ \t]*\/?[ \t]*>)[ \t]*(?=\r?\n\1(?![*#:;]))/gmi)){
  const at=m.index+m[0].lastIndexOf(m[2]);if(!v222StructurePlainOwner(c,at,at+m[2].length))continue;
  edits.push(v222StructureEdit(source,at,at+m[2].length,'','v222-terminal-list-break',{sameLevelPeer:true}));}
 return edits;}
function v222StructureFullwidthImageEdits(source,cfg={}){
 if(cfg.images===false||!/[０-９]/.test(source))return[];const c=v222StructureContext(source),edits=[];
 for(const n of editorialWikiLinkRanges(c.view)){const raw=source.slice(n.start,n.end);if(!/^\[\[(?:File|Image|Ficheiro|Imagem|Arquivo):/i.test(raw)||!v222StructurePlainOwner(c,n.start,n.end,{link:true}))continue;const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)continue;
  for(const p of parts.slice(1)){const old=p.text.trim();if(!/^[0-9０-９]+(?:x[0-9０-９]+)?px$/.test(old)||!/[０-９]/.test(old))continue;const value=old.replace(/[０-９]/g,x=>String(x.charCodeAt(0)-65296)),dims=value.slice(0,-2).split('x').map(Number);if(dims.some(x=>x<1||x>10000))continue;const leading=p.text.indexOf(old),start=n.start+2+p.start+leading;edits.push(v222StructureEdit(source,start,start+old.length,value,'v222-fullwidth-image-dimension',{dimensionOnly:true}));}}
 return edits;}
function v222StructureHtmlCloseEdits(source,cfg={}){
 const c=v222StructureContext(source),edits=[],stack=[],voids=new Set(['br','hr','img','meta','link','input','source','wbr','area','base','col','embed','param','track']);
 for(let pos=c.view.indexOf('<');pos>=0;){const tag=v24SyntaxTag(c.view,pos);pos=c.view.indexOf('<',tag?tag.end:pos+1);if(!tag||c.blocked(tag.start,tag.end))continue;
  if(!tag.close&&!tag.self&&!voids.has(tag.name)){stack.push(tag);continue;}
  if(tag.close){if(stack.at(-1)?.name!==tag.name){stack.length=0;continue;}const opener=stack.pop();if(['td','th','tr','table'].includes(tag.name)&&tag.attrs?.trim()&&stack.concat(opener).some(x=>x.name==='table')&&cfg.automaticTableRepairs!==false)edits.push(v222StructureEdit(source,tag.start,tag.end,'</'+tag.name+'>','v222-html-table-closing-attributes',{matchingOpening:true}));continue;}
  if(tag.self&&tag.name==='small'&&!tag.attrs.trim()&&stack.at(-1)?.name==='small'&&stack.filter(t=>t.name==='small').length===1){const tail=source.slice(tag.end);if(!/<\/?small\b/i.test(tail)){edits.push(v222StructureEdit(source,tag.start,tag.end,'</small>','v222-small-close-typo',{matchingOpening:true,noLaterSmallTag:true}));stack.pop();}}
 }
 return edits;
}
function v222StructureUrlValue(value){
 const old=value.trim(),match=/^(https?:\/\/)\1([^\s<>"{}\[\]]+)$/i.exec(old);if(!match||/https?:\/\//i.test(match[2]))return null;
 const url=match[1]+match[2];try{const u=new URL(url);if(!u.hostname.includes('.')||u.username||u.password||u.protocol!==match[1].slice(0,-2))return null;}catch{return null;}
 return value.slice(0,value.indexOf(old))+url+value.slice(value.indexOf(old)+old.length);
}
function v222StructureProtocolEdits(source,cfg={}){
 if(cfg.links===false||!/(https?:\/\/)\1/i.test(source))return[];const c=v222StructureContext(source),edits=[];
 for(const m of source.matchAll(/\[(https?:\/\/https?:\/\/[^\s<>\[\]{}]+)(?:[ \t]+[^\[\]\r\n]*)?\]/gi)){
  if(source[m.index-1]==='['||!v222StructurePlainOwner(c,m.index,m.index+m[0].length,{link:true}))continue;const fixed=v222StructureUrlValue(m[1]);if(fixed)edits.push(v222StructureEdit(source,m.index+1,m.index+1+m[1].length,fixed,'v222-duplicate-url-protocol',{addressSuffixPreserved:true}));}
 if(cfg.citations===false||cfg.references===false)return edits;
 const citationContext=v2212CitationSourceContext(source);
 for(const n of citationContext.nodes){if(!v2212CitationOwner(source,n,citationContext))continue;const raw=source.slice(n.start,n.end),p=parsedTemplate(raw),fields=v222Fields(raw)?.fields;if(!fields||!/^citar (?:web|jornal|periódico|revista|livro)$/.test(p.name))continue;
  for(const f of fields){if(!v219NativeCitationRoles(f.key).some(x=>['URL','ChapterURL'].includes(x))||v219NativeCitationRoles(f.key).includes('ArchiveURL'))continue;const fixed=v222StructureUrlValue(f.value);if(fixed)edits.push(v222StructureEdit(source,n.start+f.valueStart,n.start+f.end,fixed,'v222-duplicate-url-protocol',{field:f.key}));}}
 return edits;}
function v222StructureYouTubeEdits(source,cfg={}){if(cfg.auxiliaryTemplates===false)return[];const c=v222StructureContext(source),edits=[];
 for(const n of c.nodes){if(!v222StructurePlainOwner(c,n.start,n.end,{template:true}))continue;const raw=source.slice(n.start,n.end),p=parsedTemplate(raw);if(!v215SameTemplateTitle(p.parts[0],'YouTube')&&!v215SameTemplateTitle(p.parts[0],'Youtube'))continue;const fields=foreignEntries(p);if(fields.some(e=>!e.positional&&['user','usuario','u','channel','canal','c','show','programa','s','pgm','id_canal','idcanal','idc','playlist','p','title','titulo'].includes(e.key)))continue;
  const ids=fields.filter(e=>['1','id'].includes(e.key)&&e.value.trim()),title=fields.filter(e=>e.key==='título');if(ids.length!==1||!/^[-_A-Za-z0-9]{11}$/.test(ids[0].value.trim())||title.length!==1||!title[0].value.trim())continue;
  const parts=v24SyntaxParts(raw.slice(2,-2)),part=parts?.[title[0].index];if(!part)continue;const m=/^([ \t]*)título([ \t]*=)/.exec(part.text);if(!m)continue;const at=n.start+2+part.start+m[1].length;edits.push(v222StructureEdit(source,at,at+6,'titulo','v222-youtube-video-title-key',{nativeRevision:68628923,ordinaryVideo:true}));}
 return edits;}
function v222StructureIsbnValid(value){const s=value.replace(/[- ]/g,'');if(/^\d{13}$/.test(s))return [...s].reduce((n,x,j)=>n+Number(x)*(j%2?3:1),0)%10===0;if(/^\d{9}[\dXx]$/.test(s))return [...s.toUpperCase()].reduce((n,x,j)=>n+(x==='X'?10:Number(x))*(10-j),0)%11===0;return false;}
function v222StructureCopiedIsbnEdits(source,cfg={}){if(cfg.links===false)return[];const c=v222StructureContext(source),edits=[];
 for(const m of source.matchAll(/\[\[(?:International Standard Book Number|ISBN)(?:\|ISBN)?\]\][ \t]+\[\[(?:Special:BookSources|Especial:Fontes de livros)\/([0-9Xx -]+)\|([0-9Xx -]+)\]\]/g)){
  if(!v222StructurePlainOwner(c,m.index,m.index+m[0].length,{link:true})||m[1].replace(/[- ]/g,'').toUpperCase()!==m[2].replace(/[- ]/g,'').toUpperCase()||!v222StructureIsbnValid(m[2]))continue;
  edits.push(v222StructureEdit(source,m.index,m.index+m[0].length,'{{ISBN|'+m[2]+'}}','v222-copied-isbn-links',{numberPreserved:true,checkDigit:true}));}
 return edits;}
function v222StructureHtmlHeadingEdits(source,cfg={}){
 if(cfg.headings===false||!/<h[2-6]>/.test(source))return[];
 const c=v222StructureContext(source),counts=new Map(),edits=[];
 const key=text=>v2217HeadingKey(text);
 for(const m of c.view.matchAll(/^(={1,6})[ \t]*([^\r\n]*?)[ \t]*\1[ \t]*\r?$/gm)){const k=key(m[2]);if(k)counts.set(k,(counts.get(k)||0)+1);}
 for(const m of c.view.matchAll(/<h[1-6](?:\s[^<>]*)?>([^<>\r\n]*)<\/h[1-6]>/gi)){const k=key(m[1]);if(k)counts.set(k,(counts.get(k)||0)+1);}
 for(const producer of v2217HeadingProducers(source))if(producer.kind==='native-heading-provider')counts.set(producer.key,(counts.get(producer.key)||0)+1);
 for(const m of source.matchAll(/^<h([2-6])>([^<>\r\n]+)<\/h\1>[ \t]*\r?$/gm)){
  const label=m[2],start=m.index,end=start+m[0].replace(/\r$/,'').length;
  if(label!==label.trim()||/[&{}\[\]|='"#\u0000-\u001f\u007f-\u009f\u200b\u200e\u200f\u202a-\u202e]/.test(label)||!/[\p{L}\p{N}]/u.test(label)||counts.get(key(label))!==1||!v222StructurePlainOwner(c,start,end))continue;
  const markers='='.repeat(Number(m[1]));edits.push(v222StructureEdit(source,start,end,markers+' '+label+' '+markers,'v222-html-heading-literal',{nativePairs:V222_STRUCTURE_NATIVE_PAIRS,level:Number(m[1]),headingText:label,unique:true,anchorAndTocPreserved:true,sectionEditingMetadataChanges:true}));
 }
 return edits;
}
function v222StructurePercentTarget(value){
 if(!value.includes('%')||/[\s{}\[\]<>|:]/.test(value)||value.startsWith('#')||value.split('#').length>2)return null;
 let valid=true,changed=false;
 const text=value.replace(/(?:%[a-fA-F\d]{2})+/g,run=>{
  const bytes=[...run.matchAll(/%([a-fA-F\d]{2})/g)].map(m=>parseInt(m[1],16));
  if(bytes.some(n=>n<128)){valid=false;return run;}
  let decoded;try{decoded=decodeURIComponent(run);}catch{valid=false;return run;}
  if(!decoded||[...decoded].some(ch=>ch.codePointAt(0)<128||!/[\p{L}\p{M}]/u.test(ch))){valid=false;return run;}
  changed=true;return decoded;
 });
 return valid&&changed&&!text.includes('%')?text:null;
}
function v222StructurePercentLinkEdits(source,cfg={}){
 if(cfg.links===false||!/%[a-fA-F\d]{2}/.test(source))return[];const c=v222StructureContext(source),edits=[];
 for(const n of editorialWikiLinkRanges(c.view)){
  const raw=source.slice(n.start,n.end);if(!v222StructurePlainOwner(c,n.start,n.end,{link:true}))continue;
  const inside=raw.slice(2,-2),split=inside.indexOf('|');if(split<1||inside.indexOf('|',split+1)>=0)continue;
  const target=inside.slice(0,split),label=inside.slice(split+1);if(!label||/[{}\[\]<>\r\n]/.test(label))continue;
  const decoded=v222StructurePercentTarget(target);if(!decoded)continue;
  edits.push(v222StructureEdit(source,n.start+2,n.start+2+target.length,decoded,'v222-non-ascii-wikilink-target',{nativePairs:V222_STRUCTURE_NATIVE_PAIRS,labelPreserved:true,sourceTarget:target,decodedTarget:decoded,asciiEscapes:false}));
 }
 return edits;
}
function v222StructureTemplatePrefixEdits(source,cfg={}){
 if(!/\{\{[ \t]*(?:Predefinição|Template)[ \t]*:/i.test(source))return[];
 const c=v222StructureContext(source),edits=[];let citationOwners=null;
 for(const n of c.nodes){
  const raw=source.slice(n.start,n.end),p=parsedTemplate(raw),header=p.parts[0],m=/^([ \t]*)(?:Predefinição|Template)[ \t]*:/i.exec(header);if(!m||c.blocked(n.start,n.end))continue;
  const nextHeader=header.slice(0,m[1].length)+header.slice(m[0].length),candidate='{{'+nextHeader+raw.slice(2+header.length),parsed=parsedTemplate(candidate),info=INFOBOX_CATALOG[parsed.name],citation=v2212CitationContext(candidate),
   infoKnown=cfg.infoboxes!==false&&info&&v215LiteralTemplateIdentity(candidate,info),citeKnown=cfg.citations!==false&&cfg.references!==false&&citation&&v215LiteralTemplateIdentity(candidate,citation.profile);
  if(!infoKnown&&!citeKnown)continue;
  if(!v222StructurePlainOwner(c,n.start,n.end,{template:true})){
   if(!citeKnown)continue;if(!citationOwners)citationOwners=v2212CitationSourceContext(source);if(!v2212CitationOwner(source,n,citationOwners))continue;
  }
  const start=n.start+2+m[1].length,end=n.start+2+m[0].length;
  edits.push(v222StructureEdit(source,start,end,'','v222-local-template-namespace-prefix',{nativeTitle:infoKnown?info.title:citation.profile.title,argumentsAndNameCasePreserved:true,whitespaceOutsidePrefixPreserved:true}));
 }
 return edits;
}
function v222StructureHeadingAliasEdits(source,cfg={}){
 if(cfg.headings===false)return[];const c=v222StructureContext(source),edits=[];
 for(const m of source.matchAll(/^(={2,6})[ \t]*(\{\{[^{}\r\n]+\}\})[ \t]*\1[ \t]*\r?$/gm)){
  const p=parsedTemplate(m[2]);if(p.parts.length!==1)continue;
  const name=v215TemplateTitle(p.parts[0]),target=v215SameTemplateTitle(name,'Veja também')?'Ver também':v215SameTemplateTitle(name,'Links externos')?'Ligações externas':null;
  const start=m.index,end=start+m[0].replace(/\r$/,'').length;if(!target||!v222StructurePlainOwner(c,start,end))continue;
  edits.push(v222StructureEdit(source,start,end,m[1]+' '+target+' '+m[1],'v222-whole-heading-template-alias',{sourceTemplate:name,wholeHeading:true,noArguments:true}));
 }
 return edits;
}
function v222StructureSimpleListBlock(source,start,end){
 const lines=source.split(/\r?\n/);let at=0,first=-1,last=-1;
 for(let i=0;i<lines.length;i++){const next=at+lines[i].length;if(at<=start&&start<=next)first=i;if(at<=end&&end<=next)last=i;at=next+(source.slice(next,next+2)==='\r\n'?2:1);}
 if(first<0||last<0)return false;
 let a=first,b=last;while(a>0&&(!lines[a-1].trim()||/^[ \t]*\*/.test(lines[a-1])))a--;while(b+1<lines.length&&(!lines[b+1].trim()||/^[ \t]*\*/.test(lines[b+1])))b++;
 if(a>0&&/^[ \t]+\S/.test(lines[a-1])||b+1<lines.length&&/^[ \t]+\S/.test(lines[b+1]))return false;
 return lines.slice(a,b+1).every(line=>!line.trim()||/^\*[ \t]+[^*#:;{}\[\]<>|"'`]+$/.test(line));
}
function v222StructureBlankListEdits(source){
 const c=v222StructureContext(source),edits=[];
 for(const m of source.matchAll(/^(\*[ \t]+[^\r\n]+)(\r?\n)((?:[ \t]*\r?\n)+)(?=\*[ \t]+\S)/gm)){
  const start=m.index+m[1].length+m[2].length,end=start+m[3].length,secondEnd=source.indexOf('\n',end),until=secondEnd<0?source.length:secondEnd-(source[secondEnd-1]==='\r'?1:0);
  if(!v222StructurePlainOwner(c,start,end)||!v222StructureSimpleListBlock(source,m.index,until))continue;
  edits.push(v222StructureEdit(source,start,end,'','v222-simple-unordered-list-gap',{simplePeers:true,numberedLists:false,subitems:false}));
 }
 return edits;
}
function v222StructureSubplan(source,name,cfg={}){
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],name};if(!v222StructureScope(source,cfg))return empty;
 const make={'template-prefix':v222StructureTemplatePrefixEdits,'html-closures':v222StructureHtmlCloseEdits,'html-headings':v222StructureHtmlHeadingEdits,'heading-aliases':v222StructureHeadingAliasEdits,'gallery-empty':v222StructureEmptyBulletEdits,'list-breaks':v222StructureListBreakEdits,'blank-list-gaps':v222StructureBlankListEdits,'image-digits':v222StructureFullwidthImageEdits,'url-protocol':v222StructureProtocolEdits,'percent-links':v222StructurePercentLinkEdits,'youtube':v222StructureYouTubeEdits,'isbn-links':v222StructureCopiedIsbnEdits,'categories':v222StructureCategoryEdits}[name];if(!make)return empty;
 try{const edits=make(source,cfg).filter(e=>source.slice(e.start,e.end)!==e.text).sort((a,b)=>a.start-b.start||a.end-b.end);if(!edits.length||edits.some((e,i)=>i&&e.start<edits[i-1].end))return empty;return{...empty,edits,text:v24SyntaxApply(source,edits)};}catch{return empty;}
}
function v222StructureSubproof(before,after,plan,cfg,name){try{if(typeof before!=='string'||typeof after!=='string'||!plan||plan.name!==name||!Array.isArray(plan.edits)||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||v24SyntaxApply(before,plan.edits)!==after)return false;const fresh=v222StructureSubplan(before,name,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);}catch{return false;}}
function v222StructureTemplatePrefixPlan(source,cfg={}){return v222StructureSubplan(source,'template-prefix',cfg);}
function v222StructureTemplatePrefixProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'template-prefix');}
function v222StructureHtmlClosuresPlan(source,cfg={}){return v222StructureSubplan(source,'html-closures',cfg);}
function v222StructureHtmlClosuresProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'html-closures');}
function v222StructureHtmlHeadingsPlan(source,cfg={}){return v222StructureSubplan(source,'html-headings',cfg);}
function v222StructureHtmlHeadingsProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'html-headings');}
function v222StructureHeadingAliasesPlan(source,cfg={}){return v222StructureSubplan(source,'heading-aliases',cfg);}
function v222StructureHeadingAliasesProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'heading-aliases');}
function v222StructureGalleryBulletPlan(source,cfg={}){return v222StructureSubplan(source,'gallery-empty',cfg);}
function v222StructureGalleryBulletProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'gallery-empty');}
function v222StructureListBreaksPlan(source,cfg={}){return v222StructureSubplan(source,'list-breaks',cfg);}
function v222StructureListBreaksProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'list-breaks');}
function v222StructureBlankListGapsPlan(source,cfg={}){return v222StructureSubplan(source,'blank-list-gaps',cfg);}
function v222StructureBlankListGapsProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'blank-list-gaps');}
function v222StructureImageDimensionsPlan(source,cfg={}){return v222StructureSubplan(source,'image-digits',cfg);}
function v222StructureImageDimensionsProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'image-digits');}
function v222StructureUrlProtocolPlan(source,cfg={}){return v222StructureSubplan(source,'url-protocol',cfg);}
function v222StructureUrlProtocolProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'url-protocol');}
function v222StructurePercentLinksPlan(source,cfg={}){return v222StructureSubplan(source,'percent-links',cfg);}
function v222StructurePercentLinksProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'percent-links');}
function v222StructureYouTubePlan(source,cfg={}){return v222StructureSubplan(source,'youtube',cfg);}
function v222StructureYouTubeProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'youtube');}
function v222StructureCopiedIsbnPlan(source,cfg={}){return v222StructureSubplan(source,'isbn-links',cfg);}
function v222StructureCopiedIsbnProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'isbn-links');}
function v222StructureCategoriesPlan(source,cfg={}){return v222StructureSubplan(source,'categories',cfg);}
function v222StructureCategoriesProof(before,after,plan,cfg={}){return v222StructureSubproof(before,after,plan,cfg,'categories');}
function v222StructurePlan(source,cfg={}){const out={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};if(!v222StructureScope(source,cfg))return out;
 for(const name of V222_STRUCTURE_STEPS){const before=out.text,sub=v222StructureSubplan(before,name,cfg);if(sub.text!==before){out.steps.push({name,before,after:sub.text,sourceHash:sub.sourceHash,edits:sub.edits});out.text=sub.text;}}
 if(out.text!==source)out.edits=[{start:0,end:source.length,text:out.text,count:out.steps.reduce((n,s)=>n+s.edits.reduce((a,e)=>a+(e.count??1),0),0),kind:'v222-structure-plan',proof:{sourceHash:out.sourceHash,steps:out.steps.map(s=>s.name)}}];return out;}
function v222StructureProof(before,after,plan,cfg={}){try{if(typeof before!=='string'||typeof after!=='string'||!plan||!Array.isArray(plan.edits)||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||v24SyntaxApply(before,plan.edits)!==after)return false;const fresh=v222StructurePlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);}catch{return false;}}
