// Independent source-bound layout and discussion repairs.
const V2221_LAYOUT_STAGES=Object.freeze(['columns','bibliography-boundary','sisters','portals','authority','stubs','footer','whitespace','talk']);
const V2221_LAYOUT_READ_CACHE={entries:new Map(),bytes:0,maximumBytes:16777216,maximumEntries:8};
function v2221LayoutScope(source,cfg={},talk=false){return typeof source==='string'&&v2215AliasScope(source,cfg,talk)&&(talk||cfg.markup!==false);}
function v2221LayoutNewline(source){return source.includes('\r\n')?'\r\n':'\n';}
function v2221LayoutCloneContextState(state){return Object.fromEntries(['templates','html','tables','links','external'].map(key=>[key,state[key].map(row=>row&&typeof row==='object'?{...row}:row)]));}
function v2221LayoutTrimReadCache(){const cache=V2221_LAYOUT_READ_CACHE;while(cache.entries.size>cache.maximumEntries||cache.bytes>cache.maximumBytes){const first=cache.entries.keys().next().value,entry=cache.entries.get(first);cache.entries.delete(first);cache.bytes-=entry.weight;}}
function v2221LayoutContext(source){
 const cache=V2221_LAYOUT_READ_CACHE;let entry=cache.entries.get(source);
 if(entry){cache.entries.delete(source);cache.entries.set(source,entry);}else{
  const view=scanProtectedView(source),literal=v24SyntaxProtected(source).ranges.filter(r=>!['quotation','quotation-markup','quotation-template'].includes(r.kind)),hard=[...literal,...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)],nodes=topNodes(view),weight=source.length*4+nodes.length*112+hard.length*112+256;
  entry={view,hard,nodes,states:new Map(),weight};if(weight<=cache.maximumBytes){cache.entries.set(source,entry);cache.bytes+=weight;v2221LayoutTrimReadCache();}
 }
 const stateAt=at=>{const stored=entry.states.get(at);if(stored)return v2221LayoutCloneContextState(stored);const state=v24SyntaxContext(entry.view,at),weight=JSON.stringify(state).length*2+112;
  if(cache.entries.get(source)===entry&&entry.states.size<2048&&entry.weight+weight<=cache.maximumBytes){entry.states.set(at,v2221LayoutCloneContextState(state));entry.weight+=weight;cache.bytes+=weight;v2221LayoutTrimReadCache();}return state;
 };
 return{view:entry.view,nodes:entry.nodes.map(node=>({...node})),stateAt,blocked:(start,end)=>entry.hard.some(r=>r.start<end&&start<r.end)};
}
function v2221LayoutOutside(c,start,end){if(c.blocked(start,end))return false;const x=c.stateAt(start);return !x.templates.length&&!x.html.length&&!x.tables.length&&!x.links.length&&!x.external.length;}
function v2221LayoutReadCacheStatus(){const c=V2221_LAYOUT_READ_CACHE;return{entries:c.entries.size,bytes:c.bytes,maximumEntries:c.maximumEntries,maximumBytes:c.maximumBytes,cachedStates:[...c.entries.values()].reduce((n,e)=>n+e.states.size,0)};}
function v2221LayoutHeader(raw){const p=parsedTemplate(raw);return p&&v219OriginalTemplateHeaderAllowed(p.parts[0])?p.parts[0]:null;}
function v2221LayoutNamed(raw,names){const head=v2221LayoutHeader(raw);return head!==null&&names.some(name=>v215SameTemplateTitle(head,name));}
function v2221LayoutFields(raw){
 const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts||v2221LayoutHeader(raw)===null)return null;const result=[],seen=new Set();let positional=1;
 for(let index=1;index<parts.length;index++){
  const part=parts[index],nested=templates(scanProtectedView(part.text)).nodes;let at=-1;
  for(let i=0;i<part.text.length;i++)if(part.text[i]==='='&&!nested.some(n=>n.start<=i&&i<n.end)){at=i;break;}
  const key=at<0?String(positional++):part.text.slice(0,at).trim(),value=at<0?part.text:part.text.slice(at+1);
  if(!key||/[{}\[\]<>|\r\n]/.test(key)||seen.has(key))return null;seen.add(key);result.push({key,value,positional:at<0,index,part,equals:at});
 }
 return{parts,fields:result,slots:new Map(result.map(f=>[f.key,f.value]))};
}
function v2221LayoutEdit(start,end,text,kind,count=1,proof={}){return{start,end,text,kind,count,proof};}
function v2221LayoutWholeLine(source,node){const start=source.lastIndexOf('\n',Math.max(0,node.start-1))+1,next=source.indexOf('\n',node.end),end=next<0?source.length:next;return{start,end,next};}
function v2221LayoutLoose(source,node,c){
 if(!v2221LayoutOutside(c,node.start,node.end))return false;
 const line=v2221LayoutWholeLine(source,node);let residue=c.view.slice(line.start,line.end);
 for(const n of c.nodes.filter(n=>n.start>=line.start&&n.end<=line.end).slice().reverse())residue=residue.slice(0,n.start-line.start)+residue.slice(n.end-line.start);
 residue=residue.replace(/\[\[(?:Categoria|Category):[^\[\]{}<>\r\n]+\]\]/gi,'');
 return !residue.trim();
}
function v2221LayoutRemove(source,node){return{start:node.start,end:node.end,text:''};}
function v2221LayoutSections(source,c){
 const hs=[...c.view.matchAll(/^(={2,6})[ \t]*([^\r\n]*?)[ \t]*\1[ \t]*\r?$/gm)].filter(h=>v2221LayoutOutside(c,h.index,h.index+h[0].length)),names=new Set(['ver também','ligações externas','bibliografia','leitura adicional','leituras adicionais','obras citadas']);
 return hs.map((h,i)=>{let eligible=names.has(h[2].trim().toLocaleLowerCase('pt'));if(!eligible){let level=h[1].length;for(let j=i-1;j>=0;j--)if(hs[j][1].length<level){level=hs[j][1].length;if(names.has(hs[j][2].trim().toLocaleLowerCase('pt'))){eligible=true;break;}}}
  return{title:h[2].trim(),level:h[1].length,start:h.index,bodyStart:h.index+h[0].length,end:hs[i+1]?.index??source.length,eligible};});
}
function v2221LayoutList(body){
 const list=v2216LayoutList(body);if(!list)return null;
 const c=v2221LayoutContext(body);if(c.blocked(0,body.length)||/^(?:[ \t]*={1,6}|[ \t]*[#;:!|])/m.test(c.view))return null;
 if(c.nodes.some(node=>v2221LayoutLoose(body,node,c)))return null;
 return list;
}
function v2221LayoutListPartition(body,cfg={}){
 const c=v2221LayoutContext(body),extracted=c.nodes.filter(n=>v2221LayoutLoose(body,n,c)).filter(n=>{const raw=body.slice(n.start,n.end);return(v2221LayoutMovableSister(raw)||['navbox','authority','taxonbar','portal','stub'].includes(v2221LayoutFooterKind(raw,cfg)))&&templates(raw).nodes.length===1&&!/[<>]|\{\{\{/.test(raw)&&v2221LayoutFields(raw)!==null;});
 const bullets=[...c.view.matchAll(/^\*(?!\*)/gm)],last=bullets.at(-1)?.index??body.length;
 extracted.push(...v2221LayoutCategoryItems(body,c).filter(n=>n.start>last));extracted.sort((a,b)=>a.start-b.start);
 return{body:v24SyntaxApply(body,extracted.map(n=>v2221LayoutRemove(body,n))).trim(),blocks:extracted.map(n=>body.slice(n.start,n.end)),extracted};
}
function v2221LayoutHeadingList(body){
 const view=scanProtectedView(body),headings=[...view.matchAll(/^(={2,6})[ \t]*[^\r\n{}<>]+?[ \t]*\1[ \t]*\r?$/gm)];
 if(!headings.length)return false;let at=0;
 for(const h of headings){const part=body.slice(at,h.index);if(part.trim()&&!v2221LayoutList(part))return false;at=h.index+h[0].length;}
 return !body.slice(at).trim()||!!v2221LayoutList(body.slice(at));
}
function v2221LayoutSeeAlsoGaps(source,c=v2221LayoutContext(source)){
 const lines=[...source.matchAll(/^\*(?!\*)[^\r\n]+/gm)],edits=[];
 for(let i=1;i<lines.length;i++){const start=lines[i-1].index+lines[i-1][0].length,end=lines[i].index,gap=source.slice(start,end);if(/^(?:\r?\n[ \t]*){2,}$/.test(gap)&&v2221LayoutOutside(c,start,end))edits.push(v2221LayoutEdit(start,end,v2221LayoutNewline(source),'v2221-continuous-see-also-list'));}
 return edits;
}
function v2221LayoutResourceColumn(body){
 const list=v2221LayoutList(body);if(!list)return false;
 // Manually named columns may encode a comparison. Only an ordinary list
 // whose entries start with a resource link or citation establishes flow.
 const entries=[...list.body.matchAll(/^\*(?!\*)[ \t]*([^\r\n]*)/gm)];
 return entries.length>0&&entries.every(entry=>{
  const text=entry[1];if(/^(?:\[\[[^\[\]{}<>\r\n]+\]\]|\[https?:\/\/[^\]\r\n<>]+\])/.test(text))return true;
  const first=topNodes(scanProtectedView(text))[0];if(!first||first.start!==0)return false;
  return v2221LayoutNamed(text.slice(first.start,first.end),['Citar livro','Citar web','Citar periódico','Citar jornal','Citar relatório','Citar relatório técnico','Citation','Cite book','Cite web','Cite journal','Cite news']);
 });
}
function v2221LayoutColumnsBody(raw,cfg={}){
 const p=v24SyntaxParts(raw.slice(2,-2));if(!p)return null;
 if(v2221LayoutNamed(raw,['Colunas-lista'])){
  // An anonymous list containing '=' is explicitly named before re-emission.
  if(p.length===3&&/^\s*[1-5]\s*$/.test(p[1].text)&&/^\s*(?:\*(?!\*)|={2,6})/.test(p[2].text))return{body:p[2].text,anonymous:true};
  const f=v2221LayoutFields(raw);if(!f||f.fields.some(x=>!['1','2','colunas'].includes(x.key)))return null;
  const count=(f.slots.get('colunas')??f.slots.get('1')??'2').trim();if(!/^[1-5]$/.test(count))return null;
  const body=f.slots.get('2');return body===undefined?null:{body,anonymous:false};
 }
 if(v2221LayoutNamed(raw,['Colunas'])){
  const f=v2221LayoutFields(raw);if(!f||!f.fields.length||f.fields.some(x=>!/^col[1-9]\d*$/.test(x.key)))return null;
  const cols=f.fields.map(x=>({n:Number(x.key.slice(3)),body:x.value})).sort((a,b)=>a.n-b.n);
  if(cols.some((x,i)=>x.n!==i+1||!v2221LayoutResourceColumn(v2221LayoutListPartition(x.body,cfg).body)))return null;
  return{body:cols.map(x=>x.body.trim()).join('\n'),continuous:true};
 }
 return null;
}
function v2221LayoutProseColumns(raw){
 if(!v2221LayoutNamed(raw,['Colunas-lista']))return null;
 const fields=v2221LayoutFields(raw);
 if(!fields||fields.fields.some(field=>!['1','2','colunas'].includes(field.key)))return null;
 const count=(fields.slots.get('colunas')??fields.slots.get('1')??'2').trim();
 if(!/^[1-5]$/.test(count)||!fields.slots.has('2'))return null;
 return fields.slots.get('2');
}
function v2221LayoutColumnsEdits(source,cfg={}){
 if(cfg.endMatter===false||cfg.endMatterColumns===false)return[];
 const c=v2221LayoutContext(source),sections=v2221LayoutSections(source,c),edits=[],nl=v2221LayoutNewline(source);
 for(const section of sections){
  if(!section.eligible||cfg.externalLinkColumns===false&&/^ligações externas$/i.test(section.title))continue;
  const owners=c.nodes.filter(n=>n.start>=section.bodyStart&&n.end<=section.end);
  for(const n of owners){
   const raw=source.slice(n.start,n.end);if(!v2221LayoutNamed(raw,['Colunas-lista','Colunas'])||!v2221LayoutLoose(source,n,c))continue;
   const parsed=v2221LayoutColumnsBody(raw,cfg);if(!parsed)continue;const partition=v2221LayoutListPartition(parsed.body,cfg);
   const list=v2221LayoutList(partition.body),headings=!list&&v2221LayoutHeadingList(partition.body);if(!list&&!headings)continue;
   const headingResult=headings?v2221LayoutHeadingColumns(partition.body,cfg,section.title):null,gaps=list&&/^ver também$/i.test(section.title)?v2221LayoutSeeAlsoGaps(list.body):[],body=list?v24SyntaxApply(list.body,gaps):null,rendered=headings?headingResult.body:list.count<8?body:'{{Colunas-lista|2|2='+nl+body+nl+'}}',text=rendered+(partition.blocks.length?nl+nl+partition.blocks.join(nl):'');
   if(text!==raw)edits.push(v2221LayoutEdit(n.start,n.end,text,headings?'v2221-columns-outside-subheadings':list.count<8?'v2221-short-list-no-columns':'v2221-continuous-two-columns',1+gaps.length+partition.blocks.length+(headingResult?.count||0),{listCount:list?.count??null,threshold:8,bodyPreserved:true,anonymousBodyNamed:!!parsed.anonymous,rawMetadataExtracted:partition.blocks}));
  }
  if(owners.some(n=>v2221LayoutNamed(source.slice(n.start,n.end),['Colunas-lista','Colunas','Div col','Divcol','InícioRef','Início ref'])))continue;
  const body=source.slice(section.bodyStart,section.end),lines=body.split(/\r?\n/);let offset=0,first=-1,last=-1;
  for(const line of lines){if(/^\*(?!\*)\s*\S/.test(line)){if(first<0)first=offset;last=offset+line.length;}offset+=line.length+nl.length;}
  if(first<0)continue;const list=v2221LayoutList(body.slice(first,last));if(!list||list.count<8)continue;
  const harmless=part=>{const pc=v2221LayoutContext(part);let rest=pc.view;for(const n of pc.nodes.slice().reverse()){const raw=part.slice(n.start,n.end);if(!v2221LayoutSister(raw)&&!['navbox','authority','portal','stub','sort','coord','taxonbar'].includes(v2221LayoutFooterKind(raw,cfg)))return false;rest=rest.slice(0,n.start)+rest.slice(n.start,n.end).replace(/[^\r\n]/g,' ')+rest.slice(n.end);}return !rest.replace(/\[\[(?:Categoria|Category):[^\[\]\r\n]+\]\]/g,'').trim();};
  if(!harmless(body.slice(0,first))||!harmless(body.slice(last)))continue;
  const gaps=/^ver também$/i.test(section.title)?v2221LayoutSeeAlsoGaps(list.body):[];
  edits.push(v2221LayoutEdit(section.bodyStart+first,section.bodyStart+last,'{{Colunas-lista|2|2='+nl+v24SyntaxApply(list.body,gaps)+nl+'}}','v2221-long-list-two-columns',1+gaps.length,{listCount:list.count,threshold:8}));
 }
 return edits;
}
function v2221LayoutHeadingColumns(body,cfg,title){const prefix='== '+title+' =='+v2221LayoutNewline(body),source=prefix+body,edits=v2221LayoutColumnsEdits(source,cfg);return{body:v24SyntaxApply(source,edits).slice(prefix.length),count:edits.reduce((n,e)=>n+(e.count??1),0)};}
function v2221LayoutSister(raw){return v2216LayoutSister(raw)||v2221LayoutNamed(raw,['Correlatos']);}
function v2221LayoutMovableSister(raw){return v2221LayoutSister(raw)&&!/[<>]|\{\{\{|__|\x7e{3}/.test(raw)&&!/^\s*={1,6}[^\r\n]*=+[ \t]*\r?$/m.test(raw)&&templates(raw).nodes.length===1&&v2221LayoutFields(raw)!==null;}
function v2221LayoutSisterCrossingKnown(source,c,from,to,cfg={}){
 const left=Math.min(from,to),right=Math.max(from,to);
 return c.nodes.filter(n=>n.start>=left&&n.end<=right&&!c.blocked(n.start,n.end)).every(n=>{
  const raw=source.slice(n.start,n.end);if(v2221LayoutSister(raw))return v2221LayoutMovableSister(raw);
  if(v2216LayoutPureProgram(raw)||v2216LayoutLiteralComposite(raw)!==null)return true;
  if(v2221LayoutNamed(raw,['Referências','Referencias','Reflist','References','Notas','Notas e referências','Notelist','NoteFoot','InícioRef','RefFim','Taxonbar','Citar livro','Citar web','Citar periódico','Citar jornal','Citar relatório','Citar relatório técnico','Citation','Cite book','Cite web','Cite journal','Cite news']))return true;
  return ['navbox','authority','taxonbar','portal','stub','sort','coord'].includes(v2221LayoutProfile(raw,cfg)?.role);
 });
}
function v2221LayoutValidPortugueseAuthority(header){return typeof header==='string'&&['Controle de autoridade','Controlo de autoridade'].some(n=>v215SameTemplateTitle(header,n));}
function v2221LayoutAuthorityCall(raw){const head=v2221LayoutHeader(raw);if(head===null||v2221LayoutValidPortugueseAuthority(head))return raw;const pad=head.match(/^(\s*)[\s\S]*?(\s*)$/);return'{{'+pad[1]+'Controle de autoridade'+pad[2]+raw.slice(2+head.length);}
function v2221LayoutFooterKind(raw,cfg={}){
 if(v2221LayoutNamed(raw,['NM','NF']))return'composite';
 if(v2221LayoutNamed(raw,['Controle de autoridade','Controlo de autoridade','Controlo de autoria','Authority control','Authority Control','Controle de autoriade']))return'authority';
 if(v2221LayoutNamed(raw,['Taxonbar']))return'taxonbar';
 if(v2221LayoutNamed(raw,['Portal3']))return'portal';
 if(v2221LayoutNamed(raw,['Coord','Coordenadas']))return'coord';
 if(/^\{\{[ \t]*(?:DEFAULTSORT|DEFAULTSORTKEY|DEFAULTCATEGORYSORT|ORDENAÇÃOPADRÃO|ORDENAÇÃO|ORDENACAO|ORDENACAOPADRAO)[ \t]*:/i.test(raw))return'sort';
 return v2221LayoutProfile(raw,cfg)?.role||footerRole(raw,cfg.footerProfiles||{});
}
function v2221LayoutPortalPresence(source){
 const originalView=protectedView(source),malformed=malformedRefs(originalView),owners=refTokens(originalView);
 const view=v24SyntaxApply(originalView,owners.map(owner=>({start:owner.start,end:owner.end,text:originalView.slice(owner.start,owner.end).replace(/[^\r\n]/g,' ')})));
 const isPortal=raw=>['portal','portal2','portal3','barra de portal','portal bar'].includes(parsedTemplate(raw).name.replace(/^(?:predefinição|template)\s*:\s*/,'')),parsed=templates(view),outside=parsed.nodes.filter(node=>node.depth===0&&isPortal(source.slice(node.start,node.end))),
  internal=owners.flatMap(owner=>templates(originalView.slice(owner.start,owner.end)).nodes.filter(node=>isPortal(originalView.slice(owner.start+node.start,owner.start+node.end))).map(node=>({...node,start:owner.start+node.start,end:owner.start+node.end}))),any=[...outside,...internal],
  loose=outside.filter(node=>{const state=v24SyntaxContext(view,node.start);return !['templates','html','tables','links','external'].some(key=>state[key].length);});
 return{view,any,loose,uncertain:malformed||parsed.unclosed.length>0};
}
function v2221LayoutPortalFooter(source,profiles,context=v2221LayoutPortalPresence(source)){
 const footer=footerTokens(context.view,profiles);
 return{...footer,tokens:footer.tokens.map(token=>({...token,raw:source.slice(token.start,token.end)}))};
}
function v2221LayoutBibliographyEdits(source,cfg={}){
 if(cfg.endMatter===false||cfg.endMatterColumns===false)return[];
 const c=v2221LayoutContext(source),sections=v2221LayoutSections(source,c),edits=[],nl=v2221LayoutNewline(source),kind=raw=>v2221LayoutNamed(raw,['InícioRef','Início ref','RefFim','Refend','FimRef'])?'references':'columns',opening=raw=>v2221LayoutNamed(raw,['InícioRef','Início ref','Div col','Divcol']),closing=raw=>v2221LayoutNamed(raw,['RefFim','Refend','FimRef','Div col fim','Div col end','Divcol end']),presentation=raw=>{const f=v2221LayoutFields(raw);return f&&f.fields.every(x=>['1','colwidth','colunas','cols','indent'].includes(x.key))&&!raw.includes('{{{')&&!f.fields.some(x=>x.key==='indent'&&!/^(?:no|não|nao)?$/.test(x.value.trim()));},listText=list=>list.count<8?list.body:'{{Colunas-lista|2|2='+nl+list.body+nl+'}}';
 for(const section of sections){
  if(!section.eligible)continue;const nodes=c.nodes.filter(n=>n.start>=section.bodyStart&&n.start<section.end),stack=[];
  for(const n of nodes){const raw=source.slice(n.start,n.end);
   if(!v2221LayoutLoose(source,n,c))continue;
   if(opening(raw)){stack.push({...n,raw});continue;}
   if(closing(raw)){
    const closingFields=v2221LayoutFields(raw);if(stack.length!==1||kind(stack[0].raw)!==kind(raw)||!closingFields||closingFields.fields.some(x=>x.value.trim())){stack.length=0;continue;}
    const open=stack.pop(),partition=v2221LayoutListPartition(source.slice(open.end,n.start),cfg),list=v2221LayoutList(partition.body);if(!list||!presentation(open.raw))continue;
    edits.push(v2221LayoutEdit(open.start,n.end,listText(list)+(partition.blocks.length?nl+nl+partition.blocks.join(nl):''),'v2221-bibliography-continuous-list',1+partition.blocks.length,{listCount:list.count,pairedClosures:true,threshold:8,rawMetadataExtracted:partition.blocks}));continue;
   }
   if(stack.length===1&&['navbox','authority','taxonbar','portal','stub','sort','coord'].includes(v2221LayoutFooterKind(raw,cfg))){
    const open=stack[0],body=source.slice(open.end,n.start),partition=v2221LayoutListPartition(body,cfg),list=v2221LayoutList(partition.body);
    if(!list||c.nodes.some(x=>x.start>n.start&&x.start<section.end&&closing(source.slice(x.start,x.end))))continue;
    const openFields=v2221LayoutFields(open.raw);if(!openFields||openFields.fields.some(x=>!['1','colwidth','colunas','cols','indent'].includes(x.key))||open.raw.includes('{{{'))continue;
    if(presentation(open.raw))edits.push(v2221LayoutEdit(open.start,n.start,listText(list)+(partition.blocks.length?nl+nl+partition.blocks.join(nl):'')+nl+nl,'v2221-bibliography-footer-boundary',1+partition.blocks.length,{openingStart:open.start,completeList:true,footerKind:v2221LayoutFooterKind(raw,cfg),listCount:list.count,rawMetadataExtracted:partition.blocks}));
    else{const close=kind(open.raw)==='references'?'{{RefFim}}':'{{Div col fim}}';edits.push(v2221LayoutEdit(n.start,n.start,close+nl+nl,'v2221-bibliography-footer-boundary',1,{openingStart:open.start,completeList:true,typographyPreserved:true,footerKind:v2221LayoutFooterKind(raw,cfg)}));}
    stack.pop();
   }
  }
 }
 return edits;
}
function v2221LayoutSisterEdits(source,cfg={}){
 if(cfg.endMatter===false)return[];const c=v2221LayoutContext(source),sections=v2221LayoutSections(source,c),priority=['Ver também','Ligações externas','Leitura adicional','Leituras adicionais'];
 let destination=null;
 for(const title of priority){const matches=sections.filter(s=>s.level===2&&s.title.toLocaleLowerCase('pt')===title.toLocaleLowerCase('pt'));if(matches.length===1){destination=matches[0].bodyStart;break;}if(matches.length>1)return[];}
 let boxes=c.nodes.filter(n=>v2221LayoutLoose(source,n,c)&&v2221LayoutMovableSister(source.slice(n.start,n.end)));
 if(!boxes.length)return[];
 if(destination===null){const refs=c.nodes.filter(n=>v2221LayoutLoose(source,n,c)&&v2221LayoutNamed(source.slice(n.start,n.end),['Referências','Notas e referências']));if(refs.length!==1)return[];destination=refs[0].end;}
 boxes=boxes.filter(n=>v2221LayoutSisterCrossingKnown(source,c,destination,n.start,cfg));if(!boxes.length)return[];
 const nl=v2221LayoutNewline(source),body=boxes.map(n=>source.slice(n.start,n.end)),atStart=source.slice(destination).match(/^[ \t\r\n]*/)[0],initial=source.slice(destination+atStart.length,destination+atStart.length+body.join(nl).length);
 if(initial===body.join(nl)&&boxes.every((n,i)=>i===0||!source.slice(boxes[i-1].end,n.start).trim()))return[];
 const removals=boxes.map(n=>v2221LayoutRemove(source,n));
 if(removals.some(e=>e.start<destination&&destination<e.end))return[];
 const insert=nl+body.join(nl)+nl;
 return [...removals.map(e=>({...e,count:1,kind:'v2221-sister-existing-call-move',proof:{raw:source.slice(e.start,e.end)}})),v2221LayoutEdit(destination,destination,insert,'v2221-sister-fallback-destination',0,{priority,destination})];
}
// Do not relocate metadata across a category title the literal reader cannot prove.
function v2221LayoutUnprovedCategory(source){
 let context=null;
 for(const match of source.matchAll(/\[\[[ \t]*(?:Categoria|Category)[ \t]*:/gi)){
  const start=match.index+match[0].length,close=source.indexOf(']]',start),newline=source.indexOf('\n',start),end=close<0?source.length:close,body=source.slice(start,end);
  if(close>=0&&(newline<0||newline>close)&&body.split('|',1)[0].trim()&&!/[\[\]{}<>\r]/.test(body))continue;
  context??=v2221LayoutContext(source);
  if(!v2221LayoutOutside(context,match.index,match.index+match[0].length))continue;
  return true;
 }
 return false;
}
// A native taxonomy bar may legitimately separate authority control from portals.
// Keep that already ordered gap; moving authority past it would be undone later.
function v2221LayoutAuthorityTaxonGap(source,node,portal){
 if(node.end>=portal.start)return false;
 const gap=source.slice(node.end,portal.start),nodes=topNodes(scanProtectedView(gap));if(!nodes.length)return false;
 let remaining=gap;
 for(const item of [...nodes].sort((a,b)=>b.start-a.start)){
  const raw=gap.slice(item.start,item.end);if(!v2221LayoutNamed(raw,['Taxonbar'])||!v2221LayoutFields(raw)||/[<>]|\{\{\{|<!--/.test(raw)||templates(raw).nodes.length!==1)return false;
  remaining=remaining.slice(0,item.start)+remaining.slice(item.end);
 }
 return /^[ \t\r\n]*$/.test(remaining);
}
function v2221LayoutPortalEdits(source,cfg={}){
 if(cfg.endMatter===false||cfg.portals===false)return[];
 const c=v2221LayoutContext(source),nodes=c.nodes.filter(n=>v2221LayoutNamed(source.slice(n.start,n.end),['Portal3'])&&v2221LayoutLoose(source,n,c));
 if(!nodes.length)return[];const themes=[],seen=new Set(),options=new Map();let equivalentThemes=0;
 for(const n of nodes){const raw=source.slice(n.start,n.end),f=v2221LayoutFields(raw);if(!f||/[<>]|\{\{\{|<!--/.test(raw)||templates(raw).nodes.length!==1)return[];
  const nums=f.fields.filter(x=>/^[1-9]\d*$/.test(x.key)).sort((a,b)=>Number(a.key)-Number(b.key));
  for(const x of nums){const value=x.value.trim();if(!value||/[{}\[\]\r\n|]/.test(value))return[];const identity=portalIdentity(value);if(!seen.has(identity)){seen.add(identity);themes.push(value);}else equivalentThemes++;}
  for(const x of f.fields.filter(x=>!/^\d+$/.test(x.key))){if(options.has(x.key)&&options.get(x.key)!==x.value)return[];if(!options.has(x.key))options.set(x.key,x.value);}
 }
 if(nodes.length===1&&!equivalentThemes)return[];
 const raw='{{Portal3'+themes.map(x=>'|'+x).join('')+[...options].map(([key,value])=>'|'+key+'='+value).join('')+'}}';
 return nodes.map((n,i)=>v2221LayoutEdit(n.start,n.end,i?'':raw,i?'v2221-duplicate-portal-call':'v2221-merged-existing-portals',i?1:equivalentThemes,{themesPreserved:true,inferredThemes:0,optionsPreserved:true,equivalence:'existing-verified-portalIdentity'}));
}
function v2221LayoutAuthorityEdits(source,cfg={}){
 if(cfg.endMatter===false||cfg.authorityControl===false)return[];
 const c=v2221LayoutContext(source),nodes=c.nodes.filter(n=>v2221LayoutFooterKind(source.slice(n.start,n.end),cfg)==='authority'&&v2221LayoutLoose(source,n,c)),seen=new Set(),edits=[];
 for(const n of nodes){const raw=source.slice(n.start,n.end),f=v2221LayoutFields(raw);if(!f||raw.includes('<!--')||raw.includes('{{{'))continue;
  const signature=JSON.stringify(f.fields.map(x=>[x.key,x.positional?x.value:x.value.trim()]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0));
  if(seen.has(signature)){edits.push(v2221LayoutEdit(n.start,n.end,'','v2221-equivalent-authority-duplicate',1,{sameArguments:true,compositesUntouched:true}));continue;}
  seen.add(signature);const text=v2221LayoutAuthorityCall(raw);if(text!==raw)edits.push(v2221LayoutEdit(n.start,n.end,text,'v2221-authority-confirmed-alias',1,{PortugueseVariantsPreserved:true,argumentsPreserved:true}));
 }
 return edits;
}
function v2221LayoutStubEdits(source,cfg={}){
 if(cfg.endMatter===false)return[];const c=v2221LayoutContext(source),nodes=c.nodes.filter(n=>v2221LayoutFooterKind(source.slice(n.start,n.end),cfg)==='stub'&&v2221LayoutLoose(source,n,c)),seen=new Set(),edits=[];
 for(const n of nodes){const raw=source.slice(n.start,n.end),f=v2221LayoutFields(raw);if(!f||f.fields.some(x=>x.value.trim())||raw.includes('<!--'))continue;
  const name=v2221LayoutHeader(raw),signature=v215TemplateTitle(name);
  if(seen.has(signature))edits.push(v2221LayoutEdit(n.start,n.end,'','v2221-equivalent-stub-duplicate',1,{existingOnly:true}));else seen.add(signature);
 }
 const generic=nodes.filter(n=>v2221LayoutNamed(source.slice(n.start,n.end),['Esboço'])&&v2221LayoutFields(source.slice(n.start,n.end))?.fields.every(x=>!x.value.trim())),
  specific=nodes.filter(n=>!v2221LayoutNamed(source.slice(n.start,n.end),['Esboço'])&&v2221LayoutProfile(source.slice(n.start,n.end),cfg)?.role==='stub'&&v2221LayoutFields(source.slice(n.start,n.end))?.fields.every(x=>!x.value.trim()));
 if(specific.length===1)for(const n of generic)if(!edits.some(e=>e.start===n.start))edits.push(v2221LayoutEdit(n.start,n.end,'','v2221-generic-stub-with-proven-specific',1,{existingOnly:true,specificStart:specific[0].start}));
 return edits;
}
function v2221LayoutProfile(raw,cfg={}){
 const header=v2221LayoutHeader(raw);if(header===null)return null;
 for(const[key,value]of Object.entries(cfg.footerProfiles||{})){
  const title=typeof value==='object'&&value?value.title||key:key;if(!v215SameTemplateTitle(header,title))continue;
  return typeof value==='string'?{role:value}:value&&typeof value==='object'?value:null;
 }
 return null;
}
function v2221LayoutCategoryItems(source,c){
 const result=[];
 for(const m of c.view.matchAll(/\[\[(?:Categoria|Category):[^\[\]{}<>\r\n]+\]\]/gi)){
  const n={start:m.index,end:m.index+m[0].length};if(v2221LayoutLoose(source,n,c))result.push({...n,raw:source.slice(n.start,n.end),role:'category'});
 }
 return result;
}
function v2221LayoutSort(raw){
 const m=/^\{\{[ \t]*(?:DEFAULTSORT|DEFAULTSORTKEY|DEFAULTCATEGORYSORT|ORDENAÇÃOPADRÃO|ORDENAÇÃO|ORDENACAO|ORDENACAOPADRAO)[ \t]*:([^{}|<>\r\n]+)\}\}$/i.exec(raw);
 return m?{key:m[1],text:'{{ORDENAÇÃOPADRÃO:'+m[1]+'}}'}:null;
}
function v2221LayoutGeneralCoord(raw){
 if(!v2221LayoutNamed(raw,['Coord','Coordenadas']))return false;const f=v2221LayoutFields(raw);if(!f)return false;
 const value=f.slots.get('display')?.trim();return value==='title'||value==='inline,title'||value==='title,inline';
}
function v2221LayoutCategoryGapEdits(source,items){
 const categories=items.filter(n=>n.role==='category'),gaps=[];for(let i=1;i<categories.length;i++){const start=categories[i-1].end,end=categories[i].start;if(/^(?:\r?\n[ \t]*){2,}$/.test(source.slice(start,end)))gaps.push(v2221LayoutEdit(start,end,v2221LayoutNewline(source),'v2221-category-gap-preserving-sort-owners'));}return gaps;
}
function v2221LayoutFooterEdits(source,cfg={}){
 if(cfg.endMatter===false||cfg.endTemplateOrder===false)return[];
 const c=v2221LayoutContext(source),nodes=c.nodes.filter(n=>v2221LayoutLoose(source,n,c)).map(n=>({...n,raw:source.slice(n.start,n.end),role:v2221LayoutFooterKind(source.slice(n.start,n.end),cfg)})),
  allowed=new Set(['navbox','authority','taxonbar','portal','stub','sort','coord']),items=nodes.filter(n=>allowed.has(n.role)&&n.role!=='sort'&&n.role!=='coord'||n.role==='sort'&&v2221LayoutSort(n.raw)||n.role==='coord'&&v2221LayoutGeneralCoord(n.raw));
 items.push(...v2221LayoutCategoryItems(source,c));if(!items.length)return[];
 if(cfg.categories===false&&items.some(n=>n.role==='category'||n.role==='sort')||cfg.portals===false&&items.some(n=>n.role==='portal')||cfg.authorityControl===false&&items.some(n=>['authority','taxonbar'].includes(n.role)))return[];
 // Composite sort/category emitters keep their source position and constrain
 // relocation of literal sort owners; they are never treated as pure authority.
 const sorts=items.filter(n=>n.role==='sort'),keys=new Set(sorts.map(n=>v2221LayoutSort(n.raw).key)),hasComposite=nodes.some(n=>n.role==='composite');
 if(keys.size>1||hasComposite)return v2221LayoutCategoryGapEdits(source,items);
 let moving=items.filter(n=>n.role!=='sort');
 if(keys.size===1&&!hasComposite){
  const from=sorts[0]?.start??source.length,opaque=c.nodes.some(n=>n.start>=from&&!sorts.some(i=>i.start===n.start)&&!v2216LayoutPureProgram(source.slice(n.start,n.end)));
  if(!opaque)moving.push(...sorts);else return v2221LayoutCategoryGapEdits(source,items);
 }
 if(!moving.length)return[];
 if(moving.some(n=>n.raw.includes('<!--')||n.raw.includes('{{{')||c.blocked(n.start,n.end)))return[];
 const nl=v2221LayoutNewline(source),groups={navbox:[],authority:[],taxonbar:[],portal:[],stub:[],coord:[],sort:[],category:[]};
 for(const n of moving.sort((a,b)=>a.start-b.start))groups[n.role].push(n);
 if(groups.sort.length>1)groups.sort=groups.sort.slice(0,1);
 const sortText=n=>v2221LayoutSort(n.raw)?.text||n.raw;
 let navigation=groups.navbox.map(n=>n.raw),authority=groups.authority.map(n=>n.raw);
 const provenNav=groups.navbox.filter(n=>v2221LayoutProfile(n.raw,cfg)?.role==='navbox'&&!v2221LayoutNamed(n.raw,['Navboxes','Bloco de navegação'])&&templates(n.raw).nodes.length===1),title=String(cfg.pageTitle||'');
 const groupNav=cfg.namespaceNumber===0&&provenNav.length===groups.navbox.length&&provenNav.length>=4&&authority.length<=1&&title&&!/[{}|<>\r\n]/.test(title);
 if(groupNav){navigation=['{{Navboxes|título='+title+'|lista='+nl+navigation.concat(authority).join(nl)+nl+'}}'];authority=[];}
 const blocks=[navigation.concat(authority,groups.taxonbar.map(n=>n.raw)).join(nl),groups.portal.map(n=>n.raw).join(nl),groups.stub.map(n=>n.raw).join(nl),groups.coord.map(n=>n.raw).join(nl),groups.sort.map(sortText).concat(groups.category.map(n=>n.raw)).join(nl)].filter(Boolean);
 const removals=moving.map(n=>({start:n.start,end:n.end,text:''})).sort((a,b)=>a.start-b.start),without=v24SyntaxApply(source,removals),interwiki=/(?:\r?\n)?((?:[ \t]*\[\[[a-z][a-z-]{1,20}:[^\[\]{}<>\r\n]+\]\][ \t]*(?:\r?\n|$))+)[ \t\r\n]*$/i.exec(without),at=interwiki?interwiki.index:without.length,
  prefix=without.slice(0,at).replace(/[ \t\r\n]+$/,''),suffix=interwiki?without.slice(at).replace(/^[ \t\r\n]+/,''):'',text=(prefix?prefix+nl+nl:'')+blocks.join(nl+nl)+(suffix?nl+suffix:nl);
 if(text===source)return[];
 const desired=['navbox','authority','taxonbar','portal','stub','coord','sort','category'].flatMap(role=>groups[role]),original=moving.filter(n=>desired.includes(n)),reordered=desired.filter((n,i)=>original[i]!==n).length,aliases=groups.sort.filter(n=>n.raw!==sortText(n)).length,duplicates=moving.filter(n=>n.role==='sort').length-groups.sort.length,
  gaps=desired.slice(1).filter((n,i)=>{const previous=desired[i];if(previous.end>n.start)return false;const expected=previous.role===n.role||previous.role==='navbox'&&['authority','taxonbar'].includes(n.role)||previous.role==='authority'&&n.role==='taxonbar'||previous.role==='sort'&&n.role==='category'?nl:nl+nl;return source.slice(previous.end,n.start)!==expected;}).length;
 return[v2221LayoutEdit(0,source.length,text,'v2221-existing-footer-order',Math.max(1,reordered+aliases+Math.max(0,duplicates)+gaps+(groupNav?1:0)),{existingOnly:true,portalInference:false,authorityPortugueseVariantsRetained:true,compositesMoved:false,navboxGrouping:groupNav,navboxesNativeRevision:groupNav?56437452:null,sortConflictPreserved:keys.size>1||hasComposite,categoryContentsPreserved:true,counts:{reordered,aliases,duplicates:Math.max(0,duplicates),gaps,grouped:groupNav?1:0}})];
}
function v2221LayoutWhitespaceEdits(source,cfg={}){
 if(cfg.automaticProseGaps===false)return[];
 const c=v2221LayoutContext(source),quotes=v24SyntaxProtected(source).ranges.filter(r=>['quotation','quotation-markup','quotation-template'].includes(r.kind)),edits=[],add=edit=>{if(!edits.some(e=>e.start<edit.end&&edit.start<e.end))edits.push(edit);},outside=(start,end)=>v2221LayoutOutside(c,start,end)&&!quotes.some(r=>r.start<end&&start<r.end);
 if(!cfg.discussionPage&&cfg.namespaceNumber===0){const leading=/^(?:[ \t]*\r?\n)+/.exec(source);if(leading)add(v2221LayoutEdit(0,leading[0].length,'','v2221-no-leading-empty-lines'));}
 for(const section of v2221LayoutSections(source,c).filter(s=>/^ver também$/i.test(s.title)))for(const gap of v2221LayoutSeeAlsoGaps(source.slice(section.bodyStart,section.end))){const edit={...gap,start:gap.start+section.bodyStart,end:gap.end+section.bodyStart};if(outside(edit.start,edit.end))add(edit);}
 for(const m of source.matchAll(/(?:\r?\n[ \t]*){3,}/g))if(outside(m.index,m.index+m[0].length))add(v2221LayoutEdit(m.index,m.index+m[0].length,v2221LayoutNewline(source).repeat(2),'v2221-extra-empty-lines'));
 for(const m of source.matchAll(/([\p{L}\]\)'”»])[ \t]+([.,!?])/gu)){
  const start=m.index+m[1].length,end=m.index+m[0].length-m[2].length;if(!outside(start,end)||/[0-9]/.test(source[start-1])||/https?:\/\/\S+$/.test(source.slice(Math.max(0,start-200),start)))continue;
  add(v2221LayoutEdit(start,end,'','v2221-prose-space-before-punctuation'));
 }
 for(const m of source.matchAll(/[ \t]+(?=\r?$)/gm))if(outside(m.index,m.index+m[0].length))add(v2221LayoutEdit(m.index,m.index+m[0].length,'','v2221-prose-trailing-horizontal-space'));
 return edits;
}
function v2221LayoutTalkKind(raw){
 const p=parsedTemplate(raw);if(!p||v2221LayoutHeader(raw)===null)return null;
 if(v2215PdName(p.parts[0]))return'pd';
 if(v2221LayoutNamed(raw,['Marca de projeto']))return'projects';
 if(v2221LayoutNamed(raw,['Traduzido','Tradução']))return'translation';
 if(v2221LayoutNamed(raw,['OKA']))return'oka';
 if(v2221LayoutNamed(raw,['AvançarDiscussão']))return'advance';
 return v2217TalkMetadataKind(raw)==='fusion'?'other':null;
}
function v2221LayoutTalkProject(raw){
 const f=v2221LayoutFields(raw);if(!f)return null;const slots=new Map(f.slots),bot=slots.has('bot'),q1=slots.get('1'),qn=slots.get('qualidade'),conflict=q1!==undefined&&qn!==undefined&&q1.trim()!==qn.trim();
 let quality=(q1??qn??'?').trim(),changes=0;const placeholder=q=>['qualidade','x','"x"','X','"X"'].includes(q);
 if(conflict)return{mergeable:false,raw,slots,changes:0,quality,bot};
 if(bot){slots.delete('bot');changes++;if(!conflict){if(slots.has('rev')){slots.delete('rev');changes++;}if(quality!=='?'){quality='?';changes++;}slots.delete('qualidade');slots.set('1','?');}}
 if(!conflict&&placeholder(quality)){quality='?';slots.delete('qualidade');slots.set('1','?');changes++;}
 const numbers=[...slots.keys()].filter(k=>/^\d+$/.test(k)).map(Number),projects=[];if(numbers.some(n=>n<1)||conflict)return{mergeable:false,raw,slots,changes,quality,bot};
 for(let i=2;i<=Math.max(1,...numbers);i+=2){const name=slots.get(String(i)),rating=slots.get(String(i+1))??'?';if(!name||!name.trim()||/[{}\[\]<>\r\n]/.test(name)||!/^[?1-4]?$/.test(rating.trim()))return{mergeable:false,raw,slots,changes,quality,bot};projects.push({name:name.trim(),rating:rating.trim()||'?'});}
 if(!bot&&['','?'].includes(quality)&&!projects.some(p=>/^[1-4]$/.test(p.rating))&&slots.has('rev')){slots.delete('rev');changes++;}
 const named=new Map([...slots].filter(([key])=>!/^\d+$/.test(key)&&key!=='qualidade'));
 return{mergeable:true,raw,slots,changes,quality:quality||'?',projects,named,bot};
}
function v2221LayoutTalkProjectText(record){
 if(!record.mergeable){let text='{{Marca de projeto';for(const[key,value]of record.slots)text+='|'+key+'='+value;return text+'}}';}
 return'{{Marca de projeto|'+record.quality+record.projects.map(p=>'|'+p.name+'|'+p.rating).join('')+[...record.named].map(([key,value])=>'|'+key+'='+value).join('')+'}}';
}
function v2221LayoutTalkTranslation(raw){
 const f=v2221LayoutFields(raw);if(!f)return raw;const slots=new Map(f.slots),take=names=>{const values=names.filter(k=>slots.has(k)).map(k=>slots.get(k).trim());if(new Set(values.filter(Boolean)).size>1)return null;return values.find(Boolean)||'';};
 let language=take(['cód_idioma']),page=take(['página','texto','Texto']);if(language===null||page===null)return raw;
 const positional1=slots.get('1')?.trim(),positional2=slots.get('2')?.trim();
 if(positional1&&/^[a-z][a-z0-9-]{1,19}$/.test(positional1)&&positional2){if(language&&language!==positional1||page&&page!==positional2)return raw;language=language||positional1;page=page||positional2;slots.delete('1');slots.delete('2');}
 else if(positional1&&!positional2&&!page){page=positional1;slots.delete('1');}
 const prefix=/^([a-z][a-z0-9-]{1,19}):([^{}<>\r\n]+)$/.exec(page||'');if(prefix){if(language&&language!==prefix[1])return raw;language=language||prefix[1];page=prefix[2];}
 if(!/^[a-z][a-z0-9-]{1,19}$/.test(language)||!page||/[{}<>\r\n]/.test(page))return raw;
 if(slots.has('oldid original')){
  const old=slots.get('oldid original').trim(),link=/^\[(https:\/\/[^\s\[\]]+)(?:[ \t]+[^\[\]\r\n]+)?\]$/.exec(old);let revision=/^[1-9]\d*$/.test(old)?old:null;
  if(link){try{const u=new URL(link[1]);if(u.hostname!==language+'.wikipedia.org'||u.pathname!=='/w/index.php'||u.username||u.password)return raw;const title=u.searchParams.get('title');if(title&&title.replace(/_/g,' ')!==page.replace(/_/g,' '))return raw;revision=u.searchParams.get('oldid');}catch{return raw;}}
  if(!revision||!/^[1-9]\d*$/.test(revision)||slots.has('oldid')&&slots.get('oldid').trim()!==revision)return raw;slots.set('oldid',revision);slots.delete('oldid original');
 }
 for(const key of ['página','texto','Texto','cód_idioma'])slots.delete(key);
 return'{{Traduzido|página='+page+'|cód_idioma='+language+[...slots].map(([key,value])=>'|'+key+'='+value).join('')+'}}';
}
function v2221LayoutTalkEdits(source,cfg={}){
 if(!v2221LayoutScope(source,cfg,true)||cfg.auxiliaryTemplates===false)return[];
 const c=v2221LayoutContext(source),nodes=c.nodes.filter(n=>v2221LayoutLoose(source,n,c)&&v2221LayoutTalkKind(source.slice(n.start,n.end))&&!source.slice(n.start,n.end).includes('<!--')).map(n=>({...n,raw:source.slice(n.start,n.end),kind:v2221LayoutTalkKind(source.slice(n.start,n.end))})),calls=[],removals=[],projects=[];let count=0,pdSlots=new Map(),pdConflict=false;
 for(const n of nodes){
  if(n.kind==='advance'){if(!/[<>]|\{\{\{|\x7e{3}/.test(n.raw)){removals.push(v2221LayoutRemove(source,n));count++;}continue;}
  if(n.kind==='pd'){const f=v2221LayoutFields(n.raw);if(!f){pdConflict=true;continue;}for(const[key,value]of f.slots){if(pdSlots.has(key)&&pdSlots.get(key)!==value)pdConflict=true;else pdSlots.set(key,value);}continue;}
  if(n.kind==='projects'){const record=v2221LayoutTalkProject(n.raw);if(record)projects.push({node:n,record});continue;}
  calls.push({kind:n.kind,raw:n.kind==='translation'?v2221LayoutTalkTranslation(n.raw):n.raw,node:n});
 }
 const pds=nodes.filter(n=>n.kind==='pd');if(!pdConflict&&(pds.length||[1,11,101].includes(cfg.namespaceNumber))){calls.push({kind:'pd',raw:'{{PD'+[...pdSlots].map(([key,value])=>'|'+key+'='+value).join('')+'}}'});for(const n of pds)removals.push(v2221LayoutRemove(source,n));count+=Math.max(0,pds.length-1);}
 let merged=null;
 if(projects.length&&projects.every(x=>x.record.mergeable)){
  let quality='?',validMerge=true;const selected=new Map(),named=new Map();
  for(const{record}of projects){if(record.quality!=='?'&&record.quality!==''){if(quality!=='?'&&quality!==record.quality)validMerge=false;quality=record.quality;}for(const p of record.projects){const old=selected.get(p.name);if(old&&old.rating!=='?'&&p.rating!=='?'&&old.rating!==p.rating)validMerge=false;if(!old||old.rating==='?')selected.set(p.name,p);}for(const[key,value]of record.named){if(named.has(key)&&named.get(key)!==value)validMerge=false;else named.set(key,value);}}
  if(validMerge)merged=v2221LayoutTalkProjectText({mergeable:true,quality,projects:[...selected.values()],named});
 }
 if(merged){calls.push({kind:'projects',raw:merged});for(const{node,record}of projects){removals.push(v2221LayoutRemove(source,node));count+=record.changes;}count+=Math.max(0,projects.length-1);}
 else for(const{node,record}of projects){calls.push({kind:'projects',raw:record.changes?v2221LayoutTalkProjectText(record):node.raw,node});removals.push(v2221LayoutRemove(source,node));count+=record.changes;}
 for(const call of calls)if(call.node&&!removals.some(e=>e.start===call.node.start))removals.push(v2221LayoutRemove(source,call.node));
 if(!calls.length&&!removals.length)return[];
 const order={pd:0,projects:1,translation:2,oka:3,other:4},nl=v2221LayoutNewline(source),ordered=calls.map((x,i)=>({...x,i})).sort((a,b)=>order[a.kind]-order[b.kind]||a.i-b.i),body=v24SyntaxApply(source,removals.sort((a,b)=>a.start-b.start)).replace(/^(?:[ \t]*\r?\n)+/,''),header=ordered.map(x=>x.raw).join(nl),text=header+(header&&body?nl:'')+body;
 if(text===source)return[];count+=ordered.filter(x=>x.node&&x.node.raw!==x.raw).length;count+=ordered.filter((x,i)=>x.node&&x.node.start!==ordered.slice(0,i).reduce((n,v)=>n+v.raw.length+nl.length,0)).length;
 return[v2221LayoutEdit(0,source.length,text,'v2221-discussion-local-metadata',Math.max(1,count),{order:ordered.map(x=>x.kind),conversationProjectionPreserved:true,botRemovalDoesNotDisableNativeModuleEstimate:true,noInventedSuppressionParameter:true,articleProjectAcquisition:false})];
}
function v2221LayoutSubplan(source,name,cfg={}){
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],name};
 const talk=!!cfg.discussionPage||Number.isInteger(cfg.namespaceNumber)&&cfg.namespaceNumber>0&&cfg.namespaceNumber%2===1;
 if(name==='talk'?!v2221LayoutScope(source,cfg,true):talk||!v2221LayoutScope(source,cfg,false))return empty;
 const make={columns:v2221LayoutColumnsEdits,'bibliography-boundary':v2221LayoutBibliographyEdits,sisters:v2221LayoutSisterEdits,portals:v2221LayoutPortalEdits,authority:v2221LayoutAuthorityEdits,stubs:v2221LayoutStubEdits,footer:v2221LayoutFooterEdits,whitespace:v2221LayoutWhitespaceEdits,talk:v2221LayoutTalkEdits}[name];if(!make)return empty;
 try{const edits=make(source,cfg).filter(e=>source.slice(e.start,e.end)!==e.text).sort((a,b)=>a.start-b.start||a.end-b.end);if(!edits.length||edits.some((e,i)=>i&&e.start<edits[i-1].end))return empty;return{...empty,edits,text:v24SyntaxApply(source,edits)};}catch{return empty;}
}
function v2221LayoutSubproof(before,after,plan,cfg={},name=plan?.name){
 try{if(!plan||plan.name!==name||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||v24SyntaxApply(before,plan.edits)!==after)return false;const fresh=v2221LayoutSubplan(before,name,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);}catch{return false;}
}
function v2221LayoutPlan(source,cfg={}){
 const out={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};
 for(const name of V2221_LAYOUT_STAGES){const before=out.text,plan=v2221LayoutSubplan(before,name,cfg);if(plan.text===before||!v2221LayoutSubproof(before,plan.text,plan,cfg,name))continue;out.text=plan.text;out.steps.push({name,sourceHash:plan.sourceHash,edits:plan.edits});}
 if(out.text!==source)out.edits=[v2221LayoutEdit(0,source.length,out.text,'v2221-layout-local-components',out.steps.reduce((n,s)=>n+s.edits.reduce((a,e)=>a+(e.count??1),0),0),{steps:out.steps.map(s=>s.name),sourceHash:out.sourceHash})];return out;
}
function v2221LayoutProof(before,after,plan,cfg={}){
 try{if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||v24SyntaxApply(before,plan.edits)!==after)return false;const fresh=v2221LayoutPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);}catch{return false;}
}
function v2221LayoutColumnsPlan(source,cfg={}){return v2221LayoutSubplan(source,'columns',cfg);}
function v2221LayoutColumnsProof(before,after,plan,cfg={}){return v2221LayoutSubproof(before,after,plan,cfg,'columns');}
function v2221LayoutBibliographyPlan(source,cfg={}){return v2221LayoutSubplan(source,'bibliography-boundary',cfg);}
function v2221LayoutBibliographyProof(before,after,plan,cfg={}){return v2221LayoutSubproof(before,after,plan,cfg,'bibliography-boundary');}
function v2221LayoutSistersPlan(source,cfg={}){return v2221LayoutSubplan(source,'sisters',cfg);}
function v2221LayoutSistersProof(before,after,plan,cfg={}){return v2221LayoutSubproof(before,after,plan,cfg,'sisters');}
function v2221LayoutPortalsPlan(source,cfg={}){return v2221LayoutSubplan(source,'portals',cfg);}
function v2221LayoutPortalsProof(before,after,plan,cfg={}){return v2221LayoutSubproof(before,after,plan,cfg,'portals');}
function v2221LayoutAuthorityPlan(source,cfg={}){return v2221LayoutSubplan(source,'authority',cfg);}
function v2221LayoutAuthorityProof(before,after,plan,cfg={}){return v2221LayoutSubproof(before,after,plan,cfg,'authority');}
function v2221LayoutStubsPlan(source,cfg={}){return v2221LayoutSubplan(source,'stubs',cfg);}
function v2221LayoutStubsProof(before,after,plan,cfg={}){return v2221LayoutSubproof(before,after,plan,cfg,'stubs');}
function v2221LayoutFooterPlan(source,cfg={}){return v2221LayoutSubplan(source,'footer',cfg);}
function v2221LayoutFooterProof(before,after,plan,cfg={}){return v2221LayoutSubproof(before,after,plan,cfg,'footer');}
function v2221LayoutWhitespacePlan(source,cfg={}){return v2221LayoutSubplan(source,'whitespace',cfg);}
function v2221LayoutWhitespaceProof(before,after,plan,cfg={}){return v2221LayoutSubproof(before,after,plan,cfg,'whitespace');}
function v2221LayoutTalkPlan(source,cfg={}){return v2221LayoutSubplan(source,'talk',cfg);}
function v2221LayoutTalkProof(before,after,plan,cfg={}){return v2221LayoutSubproof(before,after,plan,cfg,'talk');}
