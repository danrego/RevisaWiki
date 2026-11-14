// Metadata ordering never authorizes moving comments, signatures or prose.
const V222_TALK_ORDER=Object.freeze({pd:0,projects:1,translation:2,oka:3,other:4});

function v222TalkFooterScope(source,cfg={}) {
 return typeof source==='string'&&v2215AliasScope(source,cfg,!!cfg.discussionPage||[1,11,101].includes(cfg.namespaceNumber));
}
function v222TalkMetadataKind(raw) {
 const p=parsedTemplate(raw);if(!p||!v219OriginalTemplateHeaderAllowed(p.parts[0]))return null;
 if(v2215PdName(p.parts[0]))return'pd';
 const name=v2216LayoutIdentity(raw);
 if(name==='marca de projeto')return'projects';
 if(name==='traduzido')return'translation';
 if(v215SameTemplateTitle(p.parts[0],'OKA'))return'oka';
 if(v2217TalkMetadataKind(raw)==='fusion')return'other';
 return null;
}
function v222TalkUnknownQualityEdits(source) {
 const edits=[];
 for(const node of v2216TalkNodes(source,raw=>v2216LayoutIdentity(raw)==='marca de projeto')){
  const slots=v2216LayoutSlots(node.raw);if(!slots||slots.has('qualidade')||slots.has('bot'))continue;
  const old=slots.get('1');if(old===undefined||!['x','"x"'].includes(old.trim()))continue;
  const p=parsedTemplate(node.raw),entry=foreignEntries(p).find(e=>e.key==='1'),parts=v24SyntaxParts(node.raw.slice(2,-2));if(!entry||!parts)continue;
  const part=parts[entry.index];if(!part)continue;
  const offset=entry.positional?0:part.text.indexOf('=')+1,start=node.start+2+part.start+offset,end=node.start+2+part.end,pad=old.match(/^(\s*)[\s\S]*?(\s*)$/),text=pad[1]+'?'+pad[2];
  edits.push({start,end,text,count:1,kind:'v222-project-unknown-quality',proof:{firstParameter:old,quality:'?',nativeModule:73333184,projectAndImportancePreserved:true,botAbsent:true}});
 }
 return edits;
}
function v222TalkHeaderNodes(source) {
 const view=scanProtectedView(source),nodes=v2216TalkNodes(source,raw=>!!v222TalkMetadataKind(raw)),out=[];let cursor=0;
 for(const node of nodes){
  // A heading, comment, signature, unknown banner or prose is a hard boundary.
  if(source.slice(cursor,node.start).trim())break;
  if(templates(node.raw).nodes.some(n=>n.depth>0)||/<\/?(?:includeonly|noinclude|onlyinclude)\b/i.test(node.raw))break;
  out.push({...node,kind:v222TalkMetadataKind(node.raw)});cursor=node.end;
 }
 return out;
}
function v222TalkOrderEdits(source) {
 const nodes=v222TalkHeaderNodes(source);if(!nodes.length)return[];
 const ordered=nodes.map((n,i)=>({...n,index:i})).sort((a,b)=>V222_TALK_ORDER[a.kind]-V222_TALK_ORDER[b.kind]||a.index-b.index),newline=source.includes('\r\n')?'\r\n':'\n';
 const calls=ordered.map(n=>{
  if(n.kind!=='pd')return n.raw;
  const p=parsedTemplate(n.raw),old=p.parts[0],pad=old.match(/^(\s*)[\s\S]*?(\s*)$/);return'{{'+pad[1]+'PD'+pad[2]+n.raw.slice(2+old.length);
 }),start=nodes[0].start,end=nodes.at(-1).end,text=calls.join(newline),before=source.slice(start,end);
 if(text===before)return[];
 const moved=ordered.filter((n,i)=>n.index!==i||n.raw!==calls[i]).length,joined=nodes.slice(1).filter((n,i)=>source.slice(nodes[i].end,n.start)!==newline).length;
 return[{start,end,text,count:moved||joined||1,kind:'v222-discussion-metadata-order',proof:{order:ordered.map(n=>n.kind),calls:ordered.map(n=>n.raw),conversationUntouched:true}}];
}
function v222FooterAuthority(raw) {
 const head=parsedTemplate(raw)?.parts[0]||'';
 if(v215SameTemplateTitle(head,'Taxonbar'))return'taxonbar';
 if(['NM','NF'].some(n=>v215SameTemplateTitle(head,n)))return'composite';
 if(['Controle de autoridade','Controlo de autoria','Controlo de autoridade','Authority control','Authority Control'].some(n=>v215SameTemplateTitle(head,n)))return'authority';
 return null;
}
function v222FooterNodes(source,cfg={}) {
 const view=scanProtectedView(source),hard=[...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)];
 return topNodes(view).filter(n=>v2216LayoutStandalone(source,n,view)&&!hard.some(r=>r.start<n.end&&n.start<r.end)).map(n=>{
  const raw=source.slice(n.start,n.end),authority=v222FooterAuthority(raw),role=authority||footerRole(raw,cfg.footerProfiles||{});return{...n,raw,role};
 });
}
function v222FooterAuthorityEdits(source,cfg={}) {
 if(cfg.endMatter===false||cfg.authorityControl===false)return[];
 const edits=[];
 for(const n of v222FooterNodes(source,cfg)){
  if(n.role!=='authority'||v215SameTemplateTitle(parsedTemplate(n.raw).parts[0],'Controle de autoridade'))continue;
  const old=parsedTemplate(n.raw).parts[0],pad=old.match(/^(\s*)[\s\S]*?(\s*)$/);
  edits.push({start:n.start+2,end:n.start+2+old.length,text:pad[1]+'Controle de autoridade'+pad[2],count:1,kind:'v222-authority-native-alias',proof:{before:old,argumentsPreserved:true,composite:false}});
 }
 return edits;
}
function v222FooterTailSafe(source,start,cfg={}) {
 const tail=source.slice(start),view=scanProtectedView(tail),nodes=topNodes(view);let rest=view;
 for(const n of nodes.slice().reverse()){
  const raw=tail.slice(n.start,n.end),kind=v222FooterAuthority(raw)||footerRole(raw,cfg.footerProfiles||{});
  if(!['navbox','authority','taxonbar','portal','stub','sort','project'].includes(kind))return false;
  rest=rest.slice(0,n.start)+rest.slice(n.start,n.end).replace(/[^\r\n]/g,' ')+rest.slice(n.end);
 }
 return !rest.replace(/\[\[(?:Categoria|Category):[^\[\]{}<>\r\n]+\]\]/gi,'').replace(/\[\[[a-z][a-z-]{1,20}:[^\[\]{}<>\r\n]+\]\]/gi,'').trim();
}
function v222FooterOrderEdits(source,cfg={}) {
 if(cfg.endMatter===false)return[];
 const nodes=v222FooterNodes(source,cfg),roles=new Set(['navbox','taxonbar','portal',...(cfg.authorityControl===false?[]:['authority'])]),edits=[],newline=source.includes('\r\n')?'\r\n':'\n';
 for(let i=0;i<nodes.length;){
  if(!roles.has(nodes[i].role)){i++;continue;}
  let end=i+1;while(end<nodes.length&&roles.has(nodes[end].role)&&!source.slice(nodes[end-1].end,nodes[end].start).trim())end++;
  const group=nodes.slice(i,end);i=end;
  if(group.length<2||!group.some(n=>n.role==='authority'||n.role==='taxonbar')||!v222FooterTailSafe(source,group[0].start,cfg))continue;
  // NM/NF can emit sort/category metadata. Their evaluation order is retained.
  if(nodes.some(n=>n.role==='composite'&&n.start>=group[0].start))continue;
  const priority={navbox:0,authority:1,taxonbar:1,portal:2},ordered=group.map((n,index)=>({...n,index})).sort((a,b)=>priority[a.role]-priority[b.role]||a.index-b.index),text=ordered.map(n=>n.raw).join(newline),start=group[0].start,until=group.at(-1).end;
  if(text===source.slice(start,until))continue;
  const moved=ordered.filter((n,index)=>n.index!==index).length;
  edits.push({start,end:until,text,count:moved||1,kind:'v222-footer-native-order',proof:{order:ordered.map(n=>n.role),calls:ordered.map(n=>n.raw),taxonbarDistinct:true,compositeMoved:false}});
 }
 return edits;
}
function v222FooterDuplicateAuthorityEdits(source,cfg={}) {
 if(cfg.endMatter===false||cfg.authorityControl===false)return[];
 const nodes=v222FooterNodes(source,cfg).filter(n=>n.role==='authority'),seen=new Set(),edits=[];
 for(const n of nodes){
  if(!v222FooterTailSafe(source,n.start,cfg)||!v2216LayoutSlots(n.raw)||n.raw.slice(2,-2).includes('{{'))continue;
  const p=parsedTemplate(n.raw),identity=JSON.stringify(p.parts.slice(1));
  if(!seen.has(identity)){seen.add(identity);continue;}
  const removal=v2216LayoutRemoval(source,n);edits.push({...removal,count:1,kind:'v222-duplicate-authority-call',proof:{arguments:p.parts.slice(1),identicalArguments:true}});
 }
 return edits;
}
function v222FooterSisterEdits(source,cfg={}) {
 if(cfg.endMatter===false)return[];
 const view=scanProtectedView(source),headings=[...view.matchAll(/^==[ \t]*Ver tamb[ée]m[ \t]*==[ \t]*\r?$/gmi)];if(headings.length!==1)return[];
 const h=headings[0],start=h.index+h[0].length,tail=view.slice(start),next=/\r?\n={2,6}[^\n]*={2,6}[ \t]*(?:\r?\n|$)/.exec(tail),end=next?start+next.index:source.length,
  boxes=v222FooterNodes(source,cfg).filter(n=>n.start>=start&&n.end<=end&&
   (v2216LayoutSister(n.raw)||v215SameTemplateTitle(parsedTemplate(n.raw).parts[0],'Correlatos')));
 if(!boxes.length||boxes.some(n=>templates(n.raw).nodes.length!==1||/[<>]|\{\{\{|__|\x7e{3}|(?:^|[\r\n])[ \t]*={1,6}(?!=)/.test(n.raw)))return[];
 let cursor=start,aligned=true;for(const n of boxes){if(source.slice(cursor,n.start).trim())aligned=false;cursor=n.end;}
 if(aligned)return[];
 const section=source.slice(start,end),sectionView=view.slice(start,end);
 if(/[<>]|__|\x7e{3}/.test(sectionView)||templates(sectionView).nodes.some(n=>!boxes.some(b=>b.start<=start+n.start&&b.end>=start+n.end)))return[];
 const local=boxes.map(n=>({...v2216LayoutRemoval(source,n),start:v2216LayoutRemoval(source,n).start-start,end:v2216LayoutRemoval(source,n).end-start}));
 if(local.some(e=>e.start<0||e.end>section.length))return[];
 const body=v24SyntaxApply(section,local),newline=source.includes('\r\n')?'\r\n':'\n',text=newline+boxes.map(n=>n.raw).join(newline)+(body?newline+body.replace(/^(?:[ \t]*\r?\n)+/,''):'');
 return[{start,end,text,count:boxes.length,kind:'v222-sister-project-section-start',proof:{calls:boxes.map(n=>n.raw),section:'Ver também',otherContentPreserved:true,noHtmlOrDynamicHeading:true}}];
}
function v222FooterEmptyExternalHeadingEdits(source,cfg={}) {
 if(cfg.headings===false||cfg.endMatter===false||cfg.sectionOnly||cfg.discussionPage||
  !(cfg.namespaceNumber===0||v2215ArticleDraftContext(cfg,source)))return[];
 // The retained empty-section reader predates article drafts. Reuse its
 // literal grammar only after the draft has passed the existing recognizer.
 // Only the retained empty-heading grammar is borrowed. Its historical
 // biography switch does not control this general end-matter operation.
 const policy={...cfg,namespaceNumber:0,automaticBiographyFields:true},plan=v216EmptyEndHeadingPlan(source,policy);
 if(!plan.edits.length||!v216EmptyEndHeadingProof(source,plan.text,plan,policy))return[];
 const edits=[];
 for(const edit of plan.edits){
  if(!/^==[ \t]*Ligações externas[ \t]*==[ \t]*(?:\r?\n[ \t]*)*$/i.test(source.slice(edit.start,edit.end)))continue;
  const tail=source.slice(edit.end);
  if(/[<>]|\{\{\{|__|\x7e{3}|(?:^|\n)[ \t]*=/.test(tail))continue;
  let rest=tail;const view=scanProtectedView(tail),nodes=topNodes(view);let safe=true;
  for(const node of nodes.slice().reverse()){
   const raw=tail.slice(node.start,node.end),head=parsedTemplate(raw).parts[0],authority=v222FooterAuthority(raw),
    metadata=v215SameTemplateTitle(head,'Portal3')||['authority','taxonbar'].includes(authority)||footerRole(raw,{})==='sort';
   if(!metadata||templates(raw).nodes.length!==1||!v2216LayoutStandalone(tail,node,view)){safe=false;break;}
   rest=rest.slice(0,node.start)+rest.slice(node.start,node.end).replace(/[^\r\n]/g,' ')+rest.slice(node.end);
  }
  if(!safe||rest.replace(/^[ \t]*\[\[(?:Categoria|Category):[^\[\]{}<>\r\n]+\]\][ \t]*(?:\r?\n|$)/gmi,'').trim())continue;
  // Removing the heading can join two existing blank boundaries. Consume
  // only the newly redundant blank lines, leaving at most one blank line.
  const prior=/[ \t\r\n]*$/.exec(source.slice(0,edit.start))[0],following=/^[ \t\r\n]*/.exec(source.slice(edit.end))[0];
  let extra=Math.max(0,(prior.match(/\r?\n/g)||[]).length+(following.match(/\r?\n/g)||[]).length-2),end=edit.end;
  while(extra>0){const blank=/^[ \t]*\r?\n/.exec(source.slice(end));if(!blank)break;end+=blank[0].length;extra--;}
  edits.push({...edit,end,count:1,kind:'v222-final-empty-external-heading',proof:{sourceHash:v24SyntaxHash(source),oldHeadingProof:edit.proof,finalPass:true,onlyNativeFooterMetadata:true}});
 }
 return v2217AnchorRetainedEdits(source,edits,policy);
}
function v222TalkFooterPlan(source,cfg={}) {
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};if(!v222TalkFooterScope(source,cfg))return empty;
 let text=source;const steps=[],talk=!!cfg.discussionPage||[1,11,101].includes(cfg.namespaceNumber);
 const stage=(kind,make)=>{const before=text,edits=make(before).filter(e=>before.slice(e.start,e.end)!==e.text).sort((a,b)=>a.start-b.start||a.end-b.end);if(!edits.length||edits.some((e,i)=>i&&e.start<edits[i-1].end))return;const after=v24SyntaxApply(before,edits);if(after!==before){steps.push({kind,sourceHash:v24SyntaxHash(before),edits});text=after;}};
 if(talk&&cfg.auxiliaryTemplates!==false){stage('unknown-quality',v222TalkUnknownQualityEdits);stage('discussion-order',v222TalkOrderEdits);}
 if(!talk){stage('authority-duplicates',s=>v222FooterDuplicateAuthorityEdits(s,cfg));stage('authority-alias',s=>v222FooterAuthorityEdits(s,cfg));stage('footer-order',s=>v222FooterOrderEdits(s,cfg));stage('sister-projects',s=>v222FooterSisterEdits(s,cfg));stage('final-empty-external-heading',s=>v222FooterEmptyExternalHeadingEdits(s,cfg));}
 if(text===source)return empty;
 return{...empty,text,steps,edits:[{start:0,end:source.length,text,count:steps.reduce((n,s)=>n+s.edits.reduce((a,e)=>a+(e.count??1),0),0),kind:'v222-talk-footer-plan',proof:{sourceHash:empty.sourceHash,steps:steps.map(s=>s.kind)}}]};
}
function v222TalkFooterProof(before,after,plan,cfg={}) {
 try{
  if(typeof before!=='string'||typeof after!=='string'||!plan||!Array.isArray(plan.edits)||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||v24SyntaxApply(before,plan.edits)!==after)return false;
  const fresh=v222TalkFooterPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits)&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);
 }catch{return false;}
}
