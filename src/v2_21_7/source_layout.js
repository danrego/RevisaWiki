// Source-only whitespace repairs keep complete owners and their contents intact.
function v2217SourceView(source) {
 // Quoted examples remain literal even when their braces look executable.
 return v24SyntaxMaskRanges(scanProtectedView(source),v219QuotedTemplateRanges(source,false));
}
function v2217SourceContext(view,at) {
 return v219IndexedSyntaxContext(view,at)||v24SyntaxContext(view,at);
}
function v2217SourceOrdinary(view,at) {
 const c=v2217SourceContext(view,at);
 if(c.templates.length||c.html.length||c.tables.length||c.links.length||c.external.length)return false;
 const begin=view.lastIndexOf('\n',Math.max(0,at-1))+1;
 return !/^[ \t]*[*#:;!|=]/.test(view.slice(begin,at));
}
function v2217SourceBlockCall(raw,cfg={}) {
 const p=parsedTemplate(raw);if(!p||!v219OriginalTemplateHeaderAllowed(p.parts[0]))return false;
 const name=v2216LayoutIdentity(raw);
 if(v2217StandaloneInfobox(raw))return cfg.infoboxes!==false;
 if(/^info(?:box)?(?:[ /]|$)/.test(name)||Object.hasOwn(INFOBOX_CATALOG,name))return false;
 if(v2215PdName(p.parts[0])||v2217TalkMetadataKind(raw))return cfg.auxiliaryTemplates!==false;
 if(['notas','referências','referencias','referência','referencia','reflist','notas e referências','notas e referencias','notefoot'].includes(name)&&cfg.references===false)return false;
 if(['em construção','em construcao','em edição','em edicao','evento atual','eventos atuais','artigo bom','artigo destacado','featured article',
  'notas','referências','referencias','referência','referencia','reflist','notas e referências','notas e referencias','notefoot',
  'em tradução','em traducao','sob revisão','sob revisao',
  'mais fontes','mais notas','sem fontes','wikificar','wikificação','reciclar','reciclagem','parcial','corrigir',
  'artigo principal','ap','about','sobre','ver também','vt','ver desambig','outros significados','outros usos',
  'desambiguação','não confundir','não confundir com','d&d','dungeons & dragons','rpg'].includes(name))return true;
 const role=footerRole(raw,cfg.footerProfiles||{});
 return cfg.endMatter!==false&&(['stub','navbox','authority','portal','sort','project'].includes(role)||!!v2216LayoutSister(raw));
}
function v2217SourceTemplateLines(source,cfg={}) {
 const view=v2217SourceView(source),nodes=topNodes(view),edits=[],gaps=new Map(),newline=source.includes('\r\n')?'\r\n':'\n';
 for(const node of nodes){
  const raw=source.slice(node.start,node.end);if(!v2217SourceBlockCall(raw,cfg)||!v2217SourceOrdinary(view,node.start))continue;
  let start=node.start;while(start>0&&/[ \t]/.test(source[start-1]))start--;
  if(start>0&&source[start-1]!=='\n'&&source[start-1]!=='\r')gaps.set(start+':'+node.start,{start,end:node.start,text:newline,kind:'standalone-template-before',count:1});
  let end=node.end;while(end<source.length&&/[ \t]/.test(source[end]))end++;
  if(end<source.length&&source[end]!=='\n'&&source[end]!=='\r')gaps.set(node.end+':'+end,{start:node.end,end,text:newline,kind:'standalone-template-after',count:1});
 }
 for(const edit of gaps.values())edits.push(edit);
 return edits.sort((a,b)=>a.start-b.start||a.end-b.end).filter((e,i,a)=>!a.some((o,j)=>j<i&&o.end>e.start));
}
function v2216LayoutInfoboxLines(source,cfg={}) {
 if(cfg.infoboxes===false)return [];
 const view=v2217SourceView(source),edits=[];
 for(const node of topNodes(view)){
  const raw=source.slice(node.start,node.end);if(!v2217StandaloneInfobox(raw)||!v2217SourceOrdinary(view,node.start))continue;
  if(node.end<source.length&&!/^[ \t]*\r?\n/.test(source.slice(node.end))&&!/^[ \t]*$/.test(source.slice(node.end))){
   const following=/^[ \t]*(?=\S)/.exec(source.slice(node.end));
   edits.push({start:node.end,end:node.end+(following?.[0].length||0),text:source.includes('\r\n')?'\r\n':'\n',kind:'infobox-lead-line',count:1});
  }
 }
 return edits;
}
function v2217SourceImages(source) {
 const view=v2217SourceView(source),out=[];
 for(let at=0;at<view.length;){
  if(view.slice(at,at+2)!=='[['){at++;continue;}
  const header=/^\[\[[ \t]*(Ficheiro|Imagem|Arquivo|File|Image)[ \t]*:/i.exec(view.slice(at));
  if(!header||!v2217SourceOrdinary(view,at)){at+=2;continue;}
  let depth=1,end=at+2;
  for(;end<view.length&&depth;){const pair=view.slice(end,end+2);if(pair==='[['){depth++;end+=2;}else if(pair===']]'){depth--;end+=2;}else end++;}
  if(depth){at+=2;continue;}
  const raw=source.slice(at,end),parts=v24SyntaxParts(raw.slice(2,-2));
  if(!parts||!parts[0].text.slice(parts[0].text.indexOf(':')+1).trim()||v24SyntaxScan(raw).issues.length){at=end;continue;}
  const options=parts.slice(1).map(x=>x.text.trim());
  // Small icons and explicit baseline alignment can be meaningful inside prose.
  const inline=options.some(x=>/^(?:baseline|sub|super|text-top|text-bottom|middle|linha de base|meio)$/i.test(x)||
   /^(?:x?\d+(?:x\d+)?)px$/i.test(x)&&Math.max(...x.match(/\d+/g).map(Number))<=64);
  const attachedReference=/^[ \t]*(?:\r?\n[ \t]*)?(?:<ref\b|\{\{\s*(?:(?:Predefinição|Template|PRE)\s*:\s*)?(?:sfn|sfnp|sfnm|harv|harvnb|harvtxt|efn|nre|refn|ref|nota|r|rp)\s*[|}])/i.test(view.slice(end));
  if(!inline&&!attachedReference)out.push({start:at,end,raw});at=end;
 }
 return out;
}
function v2217SourceImageLines(source) {
 const images=v2217SourceImages(source),groups=[],edits=[],newline=source.includes('\r\n')?'\r\n':'\n';
 for(const image of images){const group=groups.at(-1);if(group&&/^[ \t\r\n]*$/.test(source.slice(group.at(-1).end,image.start)))group.push(image);else groups.push([image]);}
 for(const group of groups){
  const first=group[0],last=group.at(-1);let start=first.start,end=last.end;
  while(start>0&&/[ \t\r\n]/.test(source[start-1]))start--;
  while(end<source.length&&/[ \t\r\n]/.test(source[end]))end++;
  const prefix=start?newline+newline:'',suffix=end<source.length?newline+newline:(source.endsWith('\n')?newline:''),
   text=prefix+group.map(n=>n.raw).join(newline)+suffix;
  if(text===source.slice(start,end))continue;
  let count=Number(source.slice(start,first.start)!==prefix)+Number(source.slice(last.end,end)!==suffix);
  for(let i=1;i<group.length;i++)if(source.slice(group[i-1].end,group[i].start)!==newline)count++;
  edits.push({start,end,text,kind:'standalone-image-group',count:Math.max(1,count),
   witness:{images:group.map(n=>n.raw),sourceLeading:source.slice(start,first.start),sourceTrailing:source.slice(last.end,end)}});
 }
 return edits;
}
function v2217SourceEmptyInclusion(source) {
 const view=v2217SourceView(source),edits=[];
 for(const m of source.matchAll(/<noinclude[ \t]*>[ \t\r\n]*<\/noinclude[ \t]*>/gi)){
  if(!/^<noinclude\b/i.test(view.slice(m.index)))continue;
  if(!v2217SourceOrdinary(view,m.index))continue;
  edits.push({start:m.index,end:m.index+m[0].length,text:'',kind:'empty-noinclude-owner',count:1});
 }
 return edits;
}
function v2217SourceLayoutPlan(source,cfg={}) {
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};
 if(!v2216LayoutScope(source,cfg))return empty;
 let text=source;const steps=[];
 for(const [kind,make] of [
  ['empty-inclusion',v2217SourceEmptyInclusion],
  ['template-lines',s=>v2217SourceTemplateLines(s,cfg)],
  ['image-lines',v2217SourceImageLines],
  ['initial-blank-lines',s=>{const m=/^(?:[ \t]*\r?\n)+/.exec(s);return m?[{start:0,end:m[0].length,text:'',kind:'initial-blank-lines',count:1}]:[];}]
 ]){
  let edits;try{edits=make(text).sort((a,b)=>a.start-b.start||a.end-b.end);}catch{continue;}
  if(edits.some((e,i)=>i&&e.start<edits[i-1].end))continue;
  const next=v24SyntaxApply(text,edits);if(next!==text){steps.push({kind,sourceHash:v24SyntaxHash(text),edits});text=next;}
 }
 if(text===source)return empty;
 return {...empty,text,steps,edits:[{start:0,end:source.length,text,ruleId:'v2217SourceLayout',
  count:steps.reduce((n,s)=>n+s.edits.reduce((a,e)=>a+(e.count??1),0),0),
  proof:{sourceHash:empty.sourceHash,kinds:steps.map(s=>s.kind)}}]};
}
function v2217SourceLayoutProof(before,after,plan,cfg={}) {
 if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
 const fresh=v2217SourceLayoutPlan(before,cfg);
 return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
