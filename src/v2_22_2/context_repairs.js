// Wikitext transforms never operate on explicitly typed program source.
function v2222NonWikitext(options={}){const model=options.contentModel??options.contentmodel;return model!==undefined&&model!==null&&model!==''&&model!=='wikitext';}
function v2222ContextProtected(source,cfg={}){return [...v24SyntaxProtected(source).ranges,...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false),...(typeof v215DefinitionProtectedRanges==='function'?v215DefinitionProtectedRanges(source,cfg):[])];}
function v2222ParserFunctionEdits(source,cfg={}){
 if(cfg.syntaxRepairs===false||cfg.markup===false||v2222NonWikitext(cfg)||cfg.sectionOnly||cfg.pageRedirect||cfg.pageDisambiguation)return[];
 if(cfg.namespaceNumber===10&&!cfg.templateDefinitionInputEnabled||![0,10].includes(cfg.namespaceNumber)&&!v2215AliasScope(source,cfg,false))return[];
 const protectedRanges=v2222ContextProtected(source,cfg),view=scanProtectedView(source),nodes=templates(view).nodes,edits=[];let unknownRanges=null;
 // These spellings were compared as unsaved native expansions. Argument space stays exact.
 const pattern=/\{\{(#[ \t]*(?:if|se|ifeq|expr|switch))([ \t\r\n]+):/g;
 for(const m of view.matchAll(pattern)){const start=m.index,end=start+m[0].length,node=nodes.find(n=>n.start===start);if(!node||protectedRanges.some(r=>r.start<node.end&&node.start<r.end))continue;
  const context=v24SyntaxContext(view,start);if(context.html.some(tag=>tag.name==='noinclude'))continue;unknownRanges??=v219UnknownTemplateRanges(source,cfg);if(unknownRanges.some(r=>r.start<start&&start<r.end))continue;
  if(!/^#(?:if|se|ifeq|expr|switch)$/.test(m[1]))continue;
  const raw=source.slice(node.start,node.end);if(templates(raw).unclosed.length||v24SyntaxScan(raw).issues.length)continue;
  const at=end-1-m[2].length;edits.push(v2221LayoutEdit(at,end-1,'','v2222-native-parser-name-colon',1,{functionName:m[1],argumentBytesPreserved:true}));
 }
 return edits;
}
function v2222NativeDateDelimiterEdits(source,cfg={}){
 if(cfg.syntaxRepairs===false||cfg.markup===false||cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.discussionPage||v2222NonWikitext(cfg))return[];
 const protectedRanges=v2222ContextProtected(source,cfg),view=scanProtectedView(source),edits=[];
 const names='Dni|Dmn|Dni2|Dmn2|Data de nascimento|Data de morte|Nascimento|Morte';
 const expression=new RegExp('([({\\[]{1,2})[ \\t]*('+names+')([ \\t]*\\|[ \\t]*[0-9][^\\r\\n{}<>]*?)([)}\\]]{1,2})(?=[ \\t]*(?:[),.;]|$|<ref\\b))','gmi');
 for(const m of view.matchAll(expression)){const start=m.index,end=start+m[0].length;if(m[1]!=='{{'||m[4]==='}}'||!/^[}\]]{2}$/.test(m[4]))continue;if(protectedRanges.some(r=>r.start<end&&start<r.end))continue;
  const context=v24SyntaxContext(view,start);if(['templates','html','tables','links','external'].some(k=>context[k].length))continue;
  const candidate='{{'+m[2]+m[3]+'}}',f=v2221LayoutFields(candidate);if(!f||f.fields.some(x=>!/^\d+$/.test(x.key)||!/^\d+$/.test(x.value.trim()))||f.fields.length!==3)continue;
  const values=[...f.slots.values()].map(x=>Number(x.trim()));let day,month,year;if(values[0]>31){[year,month,day]=values;}else{[day,month,year]=values;}const date=new Date(Date.UTC(year,month-1,day));if(year<1000||year>9999||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)continue;
  if(!v2217DelimiterProfile(candidate)||templates(candidate).unclosed.length||v24SyntaxScan(candidate).issues.length)continue;
  edits.push(v2221LayoutEdit(start,end,candidate,'v2222-literal-native-date-delimiters',Number(m[1]!=='{{')+Number(m[4]!=='}}'),{nativeTemplate:m[2],numericArgumentsUnchanged:true,completeCalendarDate:true}));
 }
 return edits;
}
function v2222ContextEdits(source,cfg={}){return v2222ParserFunctionEdits(source,cfg).concat(v2222NativeDateDelimiterEdits(source,cfg));}
function v2222ContextPlan(source,cfg={}){return v2222Plan(source,'context',v2222ContextEdits,cfg);}
function v2222ContextProof(before,after,plan,cfg={}){return v2222PlanProof(before,after,plan,cfg,v2222ContextPlan);}
// A pinned native CSS colour is not a possible section-fragment target.
// This read-only view masks just its hash, never a label, URL or unknown slot.
function v2222HeadingNativeColourView(source){
 if(typeof source!=='string'||!source.includes('#'))return source;
 const native=INFOBOX_CATALOG.info;if(native?.oldid!==73035397||!native.dependencies?.some(d=>d.title==='Predefinição:Info/top'&&d.oldid===69364474))return source;
 const view=v24SyntaxProtected(source).view,edits=[],keys=new Set(['estilo','título-estilo','cabeçalho-estilo','imagem-estilo','tópico-estilo']);
 for(const node of templates(view).nodes){
  const raw=source.slice(node.start,node.end),p=v222Fields(raw);if(!p||!v215SameTemplateTitle(p.header,'Info')||!v215LiteralTemplateIdentity(raw,native)||p.parts.length!==p.fields.length+1)continue;
  const owner=v24SyntaxContext(view,node.start);if(['templates','links','external','tables','html'].some(k=>owner[k]?.length))continue;
  for(const f of p.fields){
   if(!keys.has(f.key)||p.fields.filter(g=>g.key===f.key).length!==1||!/^[ \t\r\n]*(?:color|background-color|background|border-color)[ \t]*:[ \t]*#[a-f\d]{3}(?:[a-f\d]{3})?[ \t]*;?[ \t\r\n]*$/i.test(f.value))continue;
   const at=node.start+f.valueStart+f.value.indexOf('#');if(view[at]==='#')edits.push({start:at,end:at+1,text:' '});
  }
 }
 return v24SyntaxApply(source,edits);
}
