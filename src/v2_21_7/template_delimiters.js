// Delimiter repair requires a known literal program and one complete parse.
function v2217DelimiterProfile(raw){
 if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}')||!v215LiteralTemplateIdentity(raw))return null;
 const p=parsedTemplate(raw),name=p.name.replace(/^(?:predefinição|template)\s*:/i,'');
 if(!name||/[{}<>\r\n]/.test(p.parts[0])||/^(?:#|subst\s*:|safesubst\s*:)/i.test(name))return null;
 const ordinary=v24SyntaxTemplateProfile(raw.slice(2,-2));if(ordinary)return ordinary;
 const known=INFOBOX_CATALOG[name]||TEMPLATE_CATALOG[name]||CITE_NAMES[name]||MAINTENANCE[name]||OBSOLETE_CATALOG[name]||DIRECT_TEMPLATE_ALIASES[name]||TRANSLATION_RULES.profiles[name]||FOOTER_NAVBOXES.has(name)||FOOTER_PROJECTS.has(name)||v219OtherNativeHeader(raw)?.record||['pd','marca de projeto','traduzido'].includes(name);
 return known?{name,kind:CITE_NAMES[name]?'citation':'verified-native-template'}:null;
}
function v2217DelimiterContext(source,start,prefixKind,accepted,cfg={}){
 const prefix=v24SyntaxApply(source.slice(0,start),accepted.filter(e=>e.end<=start)),state=v24SyntaxScan(prefix);
 if(state.links.length||state.external.length||state.tables.length)return false;
 if(prefixKind==='reference')return !state.templates.length&&state.html.length===1&&state.html[0].name==='ref';
 if(prefixKind==='field'){
  if(state.html.length||!state.templates.length)return false;
  const parent=state.templates.at(-1);if(parent.size!==2)return false;
  const tail=prefix.slice(parent.start),m=/^\{\{\s*([^|{}\r\n]+)/.exec(tail);if(!m)return false;
  const name=nameOf(m[1].trim());return !!(INFOBOX_CATALOG[name]||CITE_NAMES[name]||TRANSLATION_RULES.profiles[name]?.kind==='infobox'||typeof v2217InfoboxIsName==='function'&&v2217InfoboxIsName(name));
 }
 return !state.templates.length&&(!state.html.length||cfg.namespaceNumber===10&&state.html.every(t=>['includeonly','noinclude','onlyinclude'].includes(t.name)));
}
function v2217TemplateDelimiterEdits(source,cfg={}){
 if(cfg.syntaxRepairs===false||cfg.markup===false||!/[([{][([{]|[)}\]][)}\]]/.test(source))return [];
 const shield=v24SyntaxProtected(source),view=shield.view,existing=new Map(templates(view).nodes.map(n=>[n.start,n])),edits=[];
 const protectedRanges=v219MarkdownLiteralRanges(source).concat(v219WholeQuotedCodeRanges(source),v219QuotedTemplateRanges(source));
 const starts=/^[ \t]*(?:(<ref\b[^<>]*>[ \t]*)|(\|[^|=\r\n]+=[ \t]*))?([([{]{1,2})(?=[ \t]*[\p{L}_])/gimu;
 for(const m of view.matchAll(starts)){
  const opener=m[3],start=m.index+m[0].length-opener.length,kind=m[1]?'reference':m[2]?'field':'block';
  if(edits.some(e=>e.start<=start&&e.end>start)||protectedRanges.some(r=>r.start<=start&&r.end>start))continue;
  // A complete existing template or wiki link is not a typo merely because its
  // argument contains parentheses or closing brackets on another source line.
  if(opener==='{{'&&existing.has(start)||opener==='[['&&/^\[\[[^\r\n]*?\]\]/.test(view.slice(start)))continue;
  if(cfg.namespaceNumber===1&&start>=(source.search(/^\s*==/m)<0?source.length:source.search(/^\s*==/m)))continue;
  if(!v2217DelimiterContext(source,start,kind,edits,cfg))continue;
  const bodyStart=start+opener.length,limit=Math.min(source.length,bodyStart+262144);let attempts=0;
  const ends=/[)}\]]{1,2}(?=[ \t]*(?:\r?$|<\/ref\s*>|\{\{|\}\}))/gmi;
  for(const end of view.slice(bodyStart,limit).matchAll(ends)){
   const closer=end[0],at=bodyStart+end.index,finish=at+closer.length;
   if(opener==='{{'&&closer==='}}')continue;
   if(!opener.includes('{')&&!closer.includes('}'))continue;
   if(++attempts>64)break;
   const body=source.slice(bodyStart,at),candidate='{{'+body+'}}',profile=v2217DelimiterProfile(candidate);
   if(!profile||kind==='reference'&&profile.kind!=='citation')continue;
   if(cfg.namespaceNumber===1&&!['pd','marca de projeto','traduzido'].includes(profile.name))continue;
   if(opener==='[['&&!body.includes('|')&&!/^(?:referências|referencias|notas|notas e referências|info\/|infobox )/i.test(body.trim()))continue;
   const parsed=templates(candidate),rootNode=parsed.nodes.find(n=>n.start===0&&n.end===candidate.length);
   if(!rootNode||parsed.unclosed.length||v24SyntaxScan(candidate).issues.length)continue;
   if(kind==='block'&&source.slice(finish,source.indexOf('\n',finish)<0?source.length:source.indexOf('\n',finish)).trim()&&!/^\s*\{\{/.test(source.slice(finish)))continue;
   const count=Number(opener!=='{{')+Number(closer!=='}}');if(!count)continue;
   edits.push({start,end:finish,text:candidate,kind:'verified-template-delimiters',count,witness:{template:profile.name,opener,closer,body,context:kind}});break;
  }
 }
 return edits;
}
function v2217DelimiterPlan(source,options={}){
 const plan={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
 if(typeof source!=='string'||source.length>4194304||options.syntaxRepairs===false||options.pageRedirect||options.pageDisambiguation||options.contentModel&&options.contentModel!=='wikitext')return plan;
 const cfg=pageContextOptions({...DEFAULTS,...options});
 if(cfg.namespaceNumber===1){if(!v2216TalkScope(source,cfg))return plan;cfg.markup=true;}
 else if(cfg.namespaceNumber===10){if(!cfg.templateDefinitionInputEnabled||cfg.templateDefinitionRepairs===false||cfg.syntaxRepairs===false)return plan;cfg.markup=true;}
 else if(cfg.markup===false)return plan;
 if(![0,1,10].includes(cfg.namespaceNumber)&&!v2215AliasScope(source,cfg,false))return plan;
 plan.edits=v2217TemplateDelimiterEdits(source,cfg);plan.text=v24SyntaxApply(source,plan.edits);return plan;
}
function v2217DelimiterProof(before,after,plan,options={}){
 if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
 const fresh=v2217DelimiterPlan(before,options);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
function v2217DelimiterProjection(source,options={}){const plan=v2217DelimiterPlan(source,options);return v2217DelimiterProof(source,plan.text,plan,options)?plan.text:source;}
