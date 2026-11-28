// Discussion metadata is distinct from signed conversation and source attribution.
function v2222TalkFamily(raw,cfg={}){if(typeof raw!=='string'||v2222NonWikitext(cfg))return null;const p=parsedTemplate(v2222CommentView(raw));if(!p||v2221LayoutHeader(v2222CommentView(raw))===null)return null;if(v2215PdName(p.parts[0]))return'PD';if(v2222TalkProjectOwner(raw))return'Marca de projeto';if(v2221LayoutNamed(raw,['Traduzido','Tradução']))return'Traduzido';return null;}
// The native redirect keeps its spelling and all supplied assessments. The
// historical forwarding banner is also an existing owner, not an empty slot.
function v2222TalkProjectOwner(raw){return v2221LayoutNamed(v2222CommentView(raw),['Marca de projeto','Marca de projecto','Wikipédia:Projetos/Subdivisões do Brasil/Artigo membro','Wikipedia:Projetos/Subdivisões do Brasil/Artigo membro']);}
function v2222TalkProjectDisplayName(record){return record&&typeof record.raw==='string'&&v2221LayoutNamed(v2222CommentView(record.raw),['Marca de projecto'])?'Marca de projecto':'Marca de projeto';}
function v2222TalkUncollectedProjectOwner(source,markers){const c=v2221LayoutContext(source);return templates(c.view).nodes.some(n=>!c.blocked(n.start,n.end)&&v2222TalkProjectOwner(source.slice(n.start,n.end))&&!markers.some(m=>m.start===n.start&&m.end===n.end));}
function v2222TalkArticleHeaderEdits(source,cfg={}){
 if(cfg.namespaceNumber!==1||!v2215AliasScope(source,cfg,true)||v2222NonWikitext(cfg)||cfg.model&&cfg.model!=='wikitext'||cfg.auxiliaryTemplates===false)return[];
 const c=v2221LayoutContext(source);if(/^[ \t\r\n]*#(?:redirect|redirecionamento)\b/iu.test(c.view))return[];
 // An existing transclusion in a container or nested owner is not evidence
 // of absence. Only protected literal examples may be ignored here.
 if(templates(c.view).nodes.some(n=>!c.blocked(n.start,n.end)&&v2222TalkProjectOwner(source.slice(n.start,n.end))))return[];
 const active=c.nodes.filter(n=>v2221LayoutOutside(c,n.start,n.end));
 const pd=active.find(n=>{const p=parsedTemplate(v2222CommentView(source.slice(n.start,n.end)));return p&&v2215PdName(p.parts[0])&&v2222TalkLoose(source,n);}),nl=v2221LayoutNewline(source);
 if(pd)return[v2221LayoutEdit(pd.end,pd.end,nl+'{{Marca de projeto|?}}','v2222-article-talk-empty-project-header',1,{articleTalkOnly:true,existingHeaderPreserved:true,noInferredAssessment:true})];
 return[v2221LayoutEdit(0,0,'{{PD}}'+nl+'{{Marca de projeto|?}}'+(source?nl:''),'v2222-article-talk-empty-project-header',2,{articleTalkOnly:true,noInferredAssessment:true,conversationUntouched:true})];
}
function v2222TalkArticleHeaderPlan(source,cfg={}){return v2222Plan(source,'article-talk-header',v2222TalkArticleHeaderEdits,cfg);}
function v2222TalkArticleHeaderProof(before,after,plan,cfg={}){return v2222PlanProof(before,after,plan,cfg,v2222TalkArticleHeaderPlan);}
function v2222TalkLoose(source,node){const view=v2222CommentView(source);return v2221LayoutLoose(view,node,v2221LayoutContext(view));}
function v2222TalkParts(raw){
 if(!v2221LayoutHeader(v2222CommentView(raw)))return null;const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;const fields=[];let ordinal=1;
 for(let i=1;i<parts.length;i++){const p=parts[i],view=v2222CommentView(p.text),nodes=templates(scanProtectedView(view)).nodes;let equal=-1;for(let at=0;at<view.length;at++)if(view[at]==='='&&!nodes.some(n=>n.start<=at&&at<n.end)){equal=at;break;}
  const key=equal<0?String(ordinal++):view.slice(0,equal).trim();if(!key||/[{}\[\]<>|\r\n]/.test(key))return null;fields.push({key,value:equal<0?p.text:p.text.slice(equal+1),part:p.text,positional:equal<0});
 }
 return{header:parts[0].text,fields};
}
function v2222TalkOldReviewDate(value){const m=/^(\d{4})(\d{2})(\d{2})$/.exec(v2222CommentView(value).trim());if(!m)return false;const y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]),date=new Date(Date.UTC(y,mo-1,d));return y>=1000&&y<2021&&date.getUTCFullYear()===y&&date.getUTCMonth()===mo-1&&date.getUTCDate()===d;}
function v2222TalkProjectPrerequisite(raw){
 if(!v2221LayoutNamed(raw,['Marca de projeto','Marca de projecto']))return{raw,count:0};const parts=v2222TalkParts(raw);if(!parts)return{raw,count:0};const bot=parts.fields.some(f=>f.key==='bot'),removed=parts.fields.filter(f=>f.key==='bot'||f.key==='rev'&&(bot||v2222TalkOldReviewDate(f.value)));if(!removed.length)return{raw,count:0};
 const comments=value=>[...value.matchAll(/<!--[\s\S]*?-->/g)].map(m=>m[0]).join(''),rewritten=[];let pending='',qualityChanges=0;
 for(const f of parts.fields){if(removed.includes(f)){const inert=comments(f.part);if(rewritten.length)rewritten.at(-1).value+=inert;else pending+=inert;continue;}
  const keyComments=f.positional?'':comments(f.part.slice(0,f.part.length-f.value.length)),reset=bot&&['1','qualidade'].includes(f.key);let value=reset?'?'+comments(f.value):f.value;if(reset&&v2222CommentView(f.value).trim()!=='?')qualityChanges++;
  value=pending+keyComments+value;pending='';rewritten.push({...f,value});
 }
 if(bot&&!rewritten.some(f=>['1','qualidade'].includes(f.key)))rewritten.push({key:'1',value:pending+'?'});else if(pending&&rewritten.length)rewritten.at(-1).value+=pending;
 // Explicit numbering keeps the native slots. Inert comments stay inside
 // surviving argument values, in their original order, without activation.
 const text='{{'+v2222TalkProjectDisplayName({raw})+rewritten.map(f=>'|'+f.key+'='+f.value).join('')+'}}',originalComments=comments(raw),retainedComments=comments(text);if(originalComments!==retainedComments)return{raw,count:0};
 return{raw:text,count:removed.length+qualityChanges};
}
function v2222TalkRevision(value,language,page){
 const trimmed=value.trim();if(/^[1-9]\d*$/.test(trimmed))return trimmed;
 const external=/^\[(https:\/\/[^\s\[\]]+)(?:[ \t]+([^\[\]\r\n]+))?\]$/.exec(trimmed);
 if(external){try{const u=new URL(external[1]),revision=u.searchParams.get('oldid'),title=u.searchParams.get('title');if(u.hostname!==language+'.wikipedia.org'||u.pathname!=='/w/index.php'||u.username||u.password||!revision||!/^[1-9]\d*$/.test(revision)||new Set(u.searchParams.keys()).size!==[...u.searchParams.keys()].length||[...u.searchParams.keys()].some(k=>!['title','oldid'].includes(k))||title&&title.replace(/_/g,' ')!==page.replace(/_/g,' ')||external[2]&&/^[1-9]\d*$/.test(external[2])&&external[2]!==revision)return null;return revision;}catch{return null;}}
 const m=/^\[\[:([a-z][a-z0-9-]{1,19}):Special:PermaLink\/([1-9]\d*)(#[^\[\]{}<>|\r\n]+)?(?:\|([1-9]\d*))?\]\]$/i.exec(trimmed);
 if(!m||m[1]!==language||m[4]&&m[4]!==m[2])return null;const fragment=page.includes('#')?'#'+page.split('#').slice(1).join('#'):'';if((m[3]||'')!==fragment)return null;return m[2];
}
function v2222TalkLegacyProject(raw){
 if(!v2221LayoutNamed(raw,['Wikipédia:Projetos/Subdivisões do Brasil/Artigo membro','Wikipedia:Projetos/Subdivisões do Brasil/Artigo membro']))return raw;
 const f=v2222TalkParts(raw);if(!f||f.fields.some(x=>!['qualidade','importância','rev'].includes(x.key)||/[{}<>\r\n]/.test(x.value))||new Set(f.fields.map(x=>x.key)).size!==f.fields.length)return raw;const slots=new Map(f.fields.map(x=>[x.key,x.value.trim()]));
 if(!/^[?1-5]?$/.test(slots.get('qualidade')||'')||!/^[?1-4]?$/.test(slots.get('importância')||''))return raw;
 const text='{{Marca de projeto|'+(slots.get('qualidade')||'?')+'|Subdivisões do Brasil|'+(slots.get('importância')||'?')+(slots.has('rev')?'|rev='+slots.get('rev'):'')+'}}';return v2222TalkProjectPrerequisite(text).raw;
}
function v2222TalkTranslation(raw){
 if(!v2221LayoutNamed(v2222CommentView(raw),['Traduzido','Tradução']))return raw;const parts=v2222TalkParts(raw);if(!parts)return raw;const fields=parts.fields,seen=new Set();if(fields.some(f=>seen.has(f.key)||!seen.add(f.key)))return raw;
 const comments=value=>[...value.matchAll(/<!--[\s\S]*?-->/g)].map(m=>m[0]),clean=value=>v2222CommentView(value).trim(),slots=new Map(fields.map(f=>[f.key,f.value]));
 const take=keys=>{const entries=keys.filter(k=>slots.has(k)).map(k=>clean(slots.get(k)));return new Set(entries.filter(Boolean)).size>1?null:entries.find(Boolean)||'';};
 let language=take(['cód_idioma']),page=take(['página','texto','Texto']);if(language===null||page===null)return raw;const p1=clean(slots.get('1')||''),p2=clean(slots.get('2')||'');let used=[];
 if(p1&&/^[a-z][a-z0-9-]{1,19}$/.test(p1)&&p2){if(language&&language!==p1||page&&page!==p2)return raw;language=language||p1;page=page||p2;used.push('1','2');}
 else if(p1&&!p2&&!page&&!/^(?:V|NV|SEM|NT)$/.test(p1)){page=p1;used.push('1');}
 const prefix=/^([a-z][a-z0-9-]{1,19}):([^{}<>\r\n]+)$/.exec(page||'');if(prefix){if(language&&language!==prefix[1])return raw;language=language||prefix[1];page=prefix[2];}
 if(!/^[a-z][a-z0-9-]{1,19}$/.test(language)||!page||/[{}<>\r\n]/.test(page))return raw;
 const oldKeys=['oldid original','oldid_original'],revisions=oldKeys.filter(k=>slots.has(k)).map(k=>v2222TalkRevision(clean(slots.get(k)),language,page));
 if(revisions.some(x=>!x)||new Set(revisions).size>1)return raw;if(revisions.length){const existing=take(['oldid']);if(existing&&existing!==revisions[0])return raw;slots.set('oldid',revisions[0]);used.push(...oldKeys);}
 const sourceKeys=['3','fontes','Fontes'],status=take(sourceKeys);if(status===null)return raw;const displaced=fields.filter(f=>f.positional&&!used.includes(f.key)&&/^(?:V|NV|SEM|NT)$/.test(clean(f.value)));
 if(displaced.length===1){const value=clean(displaced[0].value);if(status&&status!==value)return raw;slots.set('fontes',value);used.push(displaced[0].key);}
 const extracted=[];for(const key of ['página','texto','Texto','cód_idioma',...used]){if(slots.has(key))extracted.push(...comments(slots.get(key)));slots.delete(key);}
 const rendered=[];for(const[key,value]of slots){if(oldKeys.includes(key))continue;const noComments=v2222CommentView(value);if(/[\r\n]/.test(noComments.trim())||/[{}]/.test(noComments))return raw;rendered.push('|'+key+'='+value.trim());}
 const output='{{Traduzido|página='+page+'|cód_idioma='+language+rendered.join('')+extracted.join('')+'}}';
 // No comment may disappear when an obsolete field is replaced.
 const beforeComments=[...raw.matchAll(/<!--[\s\S]*?-->/g)].map(m=>m[0]),afterComments=[...output.matchAll(/<!--[\s\S]*?-->/g)].map(m=>m[0]);if(beforeComments.length!==afterComments.length||beforeComments.some((x,i)=>x!==afterComments[i]))return raw;return output;
}
function v2222TalkEdits(source,cfg={}){
 if(!v2221LayoutScope(source,cfg,true)||cfg.auxiliaryTemplates===false||!cfg.discussionPage&&!(Number.isInteger(cfg.namespaceNumber)&&cfg.namespaceNumber%2===1))return[];
 const c=v2221LayoutContext(source),edits=[];
 for(const n of c.nodes){if(!v2222TalkLoose(source,n))continue;const raw=source.slice(n.start,n.end),legacy=v2222TalkLegacyProject(raw),kind=v2221LayoutTalkKind(v2222CommentView(legacy));let result=legacy,count=Number(legacy!==raw);
  if(kind==='projects'){const prerequisite=v2222TalkProjectPrerequisite(legacy);result=prerequisite.raw;count+=prerequisite.count;}
  else if(kind==='translation')result=v2222TalkTranslation(raw);
  if(result!==raw)edits.push(v2221LayoutEdit(n.start,n.end,result,'v2222-talk-native-argument-repair',Math.max(1,count),{nativeOwner:kind,conversationUntouched:true}));
 }
 return edits;
}
function v2222TalkPlan(source,cfg={}){return v2222Plan(source,'talk',v2222TalkEdits,cfg);}
function v2222TalkProof(before,after,plan,cfg={}){return v2222PlanProof(before,after,plan,cfg,v2222TalkPlan);}
