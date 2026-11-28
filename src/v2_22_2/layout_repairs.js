// Bounded repairs of existing article metadata. Each edit is replayed from its source.
function v2222Plan(source,name,make,cfg={}){
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],name};
 if(typeof source!=='string'||cfg.contentModel&&cfg.contentModel!=='wikitext')return empty;
 try{const edits=make(source,cfg).filter(e=>source.slice(e.start,e.end)!==e.text).sort((a,b)=>a.start-b.start||a.end-b.end);if(edits.some((e,i)=>!Number.isSafeInteger(e.start)||!Number.isSafeInteger(e.end)||e.start<0||e.end<e.start||e.end>source.length||i&&e.start<edits[i-1].end))return empty;return{...empty,edits,text:v24SyntaxApply(source,edits)};}catch{return empty;}
}
function v2222PlanProof(before,after,plan,cfg,make){try{if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||v24SyntaxApply(before,plan.edits)!==after)return false;const fresh=make(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);}catch{return false;}}
function v2222CommentView(raw){return raw.replace(/<!--[\s\S]*?-->/g,m=>m.replace(/[^\r\n]/g,' '));}
function v2222LayoutLoose(source,node){const view=v2222CommentView(source);return v2221LayoutLoose(view,node,v2221LayoutContext(view));}
function v2222LayoutStubEdits(source,cfg={}){
 if(cfg.endMatter===false)return[];const c=v2221LayoutContext(source),nodes=c.nodes.filter(n=>v2221LayoutLoose(source,n,c)&&v2221LayoutFooterKind(source.slice(n.start,n.end),cfg)==='stub');
 if(nodes.length<2)return[];const safe=nodes.filter(n=>{const raw=source.slice(n.start,n.end),f=v2221LayoutFields(raw);return f&&!f.fields.some(x=>/^(?:seção|secção|secao|seccao|section|trecho|scope)$/i.test(x.key)&&x.value.trim()||/^(?:seção|secção|secao|seccao|section|trecho)$/i.test(x.value.trim()))&&!/[<>]|\{\{\{|\x7e{3}/.test(raw)&&templates(raw).nodes.length===1;});
 // An unproved or section-scoped marker cannot authorize deleting another one.
 if(safe.length!==nodes.length)return[];const specific=safe.filter(n=>!v2221LayoutNamed(source.slice(n.start,n.end),['Esboço'])),keep=specific[0]||safe[0];
 return safe.filter(n=>n!==keep).map(n=>v2221LayoutEdit(n.start,n.end,'','v2222-single-existing-article-stub',1,{retainedStart:keep.start,retainedRaw:source.slice(keep.start,keep.end),specificPreferred:!!specific.length,parametersPreserved:true}));
}
function v2222LayoutPortalEdits(source,cfg={}){
 if(cfg.endMatter===false||cfg.portals===false)return[];const c=v2221LayoutContext(source),nodes=c.nodes.filter(n=>v2221LayoutNamed(v2222CommentView(source.slice(n.start,n.end)),['Portal3'])&&v2222LayoutLoose(source,n));
 if(!nodes.length)return[];const themes=[],seen=new Set(),options=new Map(),comments=[];let duplicate=0;
 for(const n of nodes){const raw=source.slice(n.start,n.end),view=v2222CommentView(raw),f=v2221LayoutFields(view);if(!f||/[<>]|\{\{\{/.test(view)||templates(view).nodes.length!==1)return[];
  comments.push(...[...raw.matchAll(/<!--[\s\S]*?-->/g)].map(m=>m[0]));
  for(const field of f.fields.filter(x=>/^[1-9]\d*$/.test(x.key)).sort((a,b)=>Number(a.key)-Number(b.key))){const value=field.value.trim();if(!value||/[{}\[\]\r\n|]/.test(value))return[];const key=portalIdentity(value);if(seen.has(key)){duplicate++;continue;}seen.add(key);themes.push(value);}
  for(const field of f.fields.filter(x=>!/^\d+$/.test(x.key))){const value=field.value.trim();if(/[{}\[\]<>\r\n]/.test(value)||options.has(field.key)&&options.get(field.key)!==value)return[];options.set(field.key,value);}
 }
 if(nodes.length===1&&!duplicate)return[];const text='{{Portal3'+themes.map(x=>'|'+x).join('')+[...options].map(([k,v])=>'|'+k+'='+v).join('')+'}}'+comments.join('');
 return nodes.map((n,i)=>v2221LayoutEdit(n.start,n.end,i?'':text,'v2222-comment-preserving-portal-merge',i?1:duplicate,{existingThemesOnly:true,commentBytesPreserved:true,optionsCompatible:true}));
}
function v2222LayoutSister(raw){return v2216LayoutSister(raw)||v2221LayoutNamed(raw,['Correlatos','Wikiversidade']);}
function v2222LayoutMovableSister(raw){const f=v2221LayoutFields(raw);return v2222LayoutSister(raw)&&!!f&&!f.fields.some(x=>['le','LE','section','heading'].includes(x.key)&&x.value.trim())&&!/[<>]|\{\{\{|__|\x7e{3}/.test(raw)&&!/^\s*={1,6}[^\r\n]*=+[ \t]*\r?$/m.test(raw)&&templates(raw).nodes.length===1;}
function v2222LayoutInlineSisterEdits(source,cfg={}){
 if(cfg.endMatter===false||cfg.namespaceNumber!==0||!cfg.pageTitle||/[\/{}<>\r\n]/.test(cfg.pageTitle))return[];const c=v2221LayoutContext(source),sections=v2221LayoutSections(source,c),edits=[];
 for(const n of c.nodes){const raw=source.slice(n.start,n.end);if(!v2221LayoutNamed(raw,['Commonscat em linha','Commonscat-inline'])||!v2221LayoutOutside(c,n.start,n.end))continue;const f=v2221LayoutFields(raw);if(!f||f.fields.some(x=>!['1','2'].includes(x.key)||/[{}<>\r\n]/.test(x.value)))continue;
  if(!sections.some(s=>['ver também','ligações externas'].includes(s.title.toLocaleLowerCase('pt'))&&s.bodyStart<=n.start&&n.end<=s.end))continue;
  const line=v2221LayoutWholeLine(source,n),prefix=source.slice(line.start,n.start),suffix=source.slice(n.end,line.end);if(!/^[ \t]*\*?[ \t]*$/.test(prefix)||suffix.trim())continue;
  const text='{{Commonscat'+f.fields.map(x=>'|'+x.key+'='+x.value.trim()).join('')+'}}';edits.push(v2221LayoutEdit(line.start,n.end,text,'v2222-equivalent-commons-inline-box',1,{targetAndLabelPreserved:true,implicitPageDefaultsEqual:true,dynamicPropertyConventionPreserved:f.slots.get('1')?.trim().toLowerCase()==='getwikidata'}));
 }
 return edits;
}
function v2222LayoutSisterCrossingKnown(source,c,from,to,cfg={}){
 const left=Math.min(from,to),right=Math.max(from,to);
 return c.nodes.filter(n=>n.start>=left&&n.end<=right&&!c.blocked(n.start,n.end)).every(n=>{
  const raw=source.slice(n.start,n.end);if(v2222LayoutSister(raw))return v2221LayoutMovableSister(raw);
  if(v2216LayoutPureProgram(raw)||v2216LayoutLiteralComposite(raw)!==null)return true;
  if(v2221LayoutNamed(raw,['Div col','Divcol','Div col fim','Div col end','Divcol end'])){const f=v2221LayoutFields(raw);return !!f&&f.fields.every(x=>['1','2','colunas','cols','colwidth','gap','rules'].includes(x.key)&&!/[{}<>\r\n]/.test(x.value));}
  if(v2221LayoutNamed(raw,['Colunas-lista','Colunas'])){const p=v2221LayoutColumnsBody(raw,cfg);return !!p&&(!!v2221LayoutList(v2221LayoutListPartition(p.body,cfg).body)||v2221LayoutHeadingList(p.body));}
  if(v2221LayoutNamed(raw,['Referências','Referencias','Reflist','References','Notas','Notas e referências','Notelist','NoteFoot','InícioRef','RefFim','Taxonbar','Citar livro','Citar web','Citar periódico','Citar jornal','Citar relatório','Citar relatório técnico','Citation','Cite book','Cite web','Cite journal','Cite news']))return true;
  return ['navbox','authority','taxonbar','portal','stub','sort','coord'].includes(v2221LayoutProfile(raw,cfg)?.role);
 });
}
function v2222LayoutCompositeEdits(source,cfg={}){
 if(cfg.endMatter===false||cfg.endTemplateOrder===false||cfg.portals===false)return[];const c=v2221LayoutContext(source),nodes=c.nodes.filter(n=>v2221LayoutLoose(source,n,c)).map(n=>({...n,raw:source.slice(n.start,n.end),role:v2221LayoutFooterKind(source.slice(n.start,n.end),cfg)})),composites=nodes.filter(n=>n.role==='composite');
 if(!composites.length)return[];const selected=nodes.filter(n=>['portal','stub'].includes(n.role));if(!selected.length)return[];const first=Math.min(...composites.concat(selected).map(n=>n.start)),tail=c.view.slice(first),known=nodes.filter(n=>n.start>=first),categories=v2221LayoutCategoryItems(source,c).filter(n=>n.start>=first);
 if(known.some(n=>!['navbox','authority','taxonbar','portal','stub','sort','coord','composite'].includes(n.role)))return[];
 const mask=known.concat(categories).map(n=>({start:n.start-first,end:n.end-first,text:tail.slice(n.start-first,n.end-first).replace(/[^\r\n]/g,' ')}));if(v24SyntaxApply(tail,mask).trim())return[];
 if(composites.some(n=>!v2221LayoutFields(n.raw)||/[<>]|\{\{\{/.test(n.raw)))return[];
 const anchor=composites.at(-1).end,nl=v2221LayoutNewline(source),ordered=selected.filter(n=>n.role==='portal').concat(selected.filter(n=>n.role==='stub')),joined=ordered.map(n=>n.raw).join(nl+nl);
 if(categories.some(n=>n.start<anchor))return[];
 if(selected.every((n,i)=>n===ordered[i]&&n.start>=anchor)){let gap=source.slice(anchor,selected.at(-1).end);for(const n of selected.slice().reverse())gap=gap.slice(0,n.start-anchor)+gap.slice(n.end-anchor);if(!gap.trim())return[];}
 const edits=selected.map(n=>({start:n.start,end:n.end,text:''}));edits.push({start:anchor,end:anchor,text:nl+nl+joined});
 const candidate=v24SyntaxApply(source,edits);if(candidate===source)return[];
 // Composite calls, literal sort owners and categories keep their relative event order.
 return[v2221LayoutEdit(0,source.length,candidate,'v2222-composite-footer-independent-metadata',selected.length,{compositeCalls:composites.map(n=>n.raw),sortAndCategoryOrderPreserved:true,existingOnly:true})];
}
function v2222LayoutHeadingEdits(source,cfg={}){
 if(cfg.headings===false)return[];const c=v2221LayoutContext(source),rows=[...c.view.matchAll(/^(==)[ \t]*(See also|Veja tambem|Veja também|Ver tambem|Leia na Wikipédia|Lei na Wikipédia)[ \t]*\1[ \t]*\r?$/gm)],edits=[];
 for(const h of rows){if(!v2221LayoutOutside(c,h.index,h.index+h[0].length)||/\[\[[^\]\n]*#(?:See also|Veja tambem|Veja também|Ver tambem|Leia na Wikipédia|Lei na Wikipédia)(?:\||\]\])/i.test(c.view))continue;
  const rest=source.slice(h.index+h[0].length),boundary=/^==[^=\r\n]/m.exec(rest),collector=topNodes(scanProtectedView(rest)).find(n=>v2221LayoutNamed(rest.slice(n.start,n.end),['Referências','Notas','Notas e referências','References','Reflist','Notelist'])),end=Math.min(boundary?.index??rest.length,collector?.start??rest.length),body=rest.slice(0,end);
  if(!v2221LayoutList(v2221LayoutListPartition(body,cfg).body)||/^==[ \t]*Ver também[ \t]*==[ \t]*\r?$/mi.test(source))continue;
  edits.push(v2221LayoutEdit(h.index,h.index+h[0].length,'== Ver também ==','v2222-remission-heading-before-collector',1,{completeRemissionList:true,referenceBoundaryPreserved:true}));
 }
 return edits;
}
function v2222LayoutEdits(source,cfg={}){if(!v2221LayoutScope(source,cfg,false)||cfg.discussionPage||cfg.namespaceNumber%2===1)return[];let text=source,count=0;const steps=[];for(const make of [v2222LayoutHeadingEdits,v2222LayoutInlineSisterEdits,v2222LayoutCompositeEdits]){const plan=v2222Plan(text,'layout-step',make,cfg);if(plan.text===text)continue;steps.push(...plan.edits);count+=plan.edits.reduce((n,e)=>n+(e.count??1),0);text=plan.text;}return text===source?[]:[v2221LayoutEdit(0,source.length,text,'v2222-source-bound-layout-components',count,{components:steps.map(x=>x.kind)})];}
function v2222LayoutPlan(source,cfg={}){return v2222Plan(source,'layout',v2222LayoutEdits,cfg);}
function v2222LayoutProof(before,after,plan,cfg={}){return v2222PlanProof(before,after,plan,cfg,v2222LayoutPlan);}
function v2222LayoutComponentPlan(source,name,make,cfg={}){const allowed=v2221LayoutScope(source,cfg,false)&&!cfg.discussionPage&&cfg.namespaceNumber%2!==1;return v2222Plan(source,name,allowed?make:()=>[],cfg);}
function v2222LayoutHeadingPlan(source,cfg={}){return v2222LayoutComponentPlan(source,'layout-heading',v2222LayoutHeadingEdits,cfg);}
function v2222LayoutHeadingProof(before,after,plan,cfg={}){return v2222PlanProof(before,after,plan,cfg,v2222LayoutHeadingPlan);}
function v2222LayoutInlinePlan(source,cfg={}){return v2222LayoutComponentPlan(source,'layout-inline',v2222LayoutInlineSisterEdits,cfg);}
function v2222LayoutInlineProof(before,after,plan,cfg={}){return v2222PlanProof(before,after,plan,cfg,v2222LayoutInlinePlan);}
function v2222LayoutCompositePlan(source,cfg={}){return v2222LayoutComponentPlan(source,'layout-composite',v2222LayoutCompositeEdits,cfg);}
function v2222LayoutCompositeProof(before,after,plan,cfg={}){return v2222PlanProof(before,after,plan,cfg,v2222LayoutCompositePlan);}
