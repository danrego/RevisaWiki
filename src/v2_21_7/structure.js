// Native source programs are read as structures without rewriting their output.
const V2217_SCAN_CACHE = {map:new Map(),bytes:0};
function v2217CopyStructuralScan(result){
 const copy={...result};for(const key of ['issues','tokens','tables','html','templates','links','external','boundaries'])if(Array.isArray(result[key]))copy[key]=result[key].map(v=>v&&typeof v==='object'?{...v}:v);
 if(result.shield){copy.shield={...result.shield};for(const key of ['ranges','unclosed'])if(Array.isArray(result.shield[key]))copy.shield[key]=result.shield[key].map(v=>v&&typeof v==='object'?{...v}:v);}
 return copy;
}
function v2217NativeTableName(raw){return parsedTemplate(raw).name.replace(/^(?:predefinição|template)\s*:/i,'');}
function v2217NativeTableStandalone(source,node){const a=source.lastIndexOf('\n',Math.max(0,node.start-1))+1,b=source.indexOf('\n',node.end);return !source.slice(a,node.start).trim()&&!source.slice(node.end,b<0?source.length:b).trim();}
function v2217NativeTableShadow(source){
 if(typeof source!=='string'||!/(?:\{\{\s*(?:Começa caixa|S-start|S-end|Fim|Election box begin no change)[|\s}]|<\/a\s*>)/i.test(source))return source;
 const shield=v24SyntaxProtected(source),edits=[],all=templates(shield.view).nodes,events=[];
 for(const node of all){
  if(node.depth!==0||!v2217NativeTableStandalone(source,node))continue;
  const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),name=v2217NativeTableName(raw);
  const open=['começa caixa','s-start'].includes(name)&&p.parts.length===1||name==='election box begin no change',close=['fim','s-end'].includes(name)&&p.parts.length===1;
  if(!open&&!close)continue;
  events.push({start:node.start,end:node.end,open,native:true,raw});
 }
 for(const m of shield.view.matchAll(/^[ \t]*(\{\||\|\})/gm)){
  const start=m.index+m[0].length-2;if(all.some(n=>n.start<start&&n.end>start))continue;
  events.push({start,end:start+2,open:m[1]==='{|',native:false});
 }
 const stack=[];for(const e of events.sort((a,b)=>a.start-b.start)){
  if(e.open)stack.push(e);else if(!stack.length)continue;else stack.pop();
  if(e.native){const token=e.open?'{|':'|}';edits.push({start:e.start,end:e.end,text:token+e.raw.slice(2).replace(/[^\r\n]/g,' ')});}
 }
 const tableShadow=v24SyntaxApply(source,edits);
 // A stray inline anchor close does not open a region. Keep its source bytes,
 // but do not quarantine all subsequent paragraphs because of this old residue.
 for(const m of shield.view.matchAll(/<\/a\s*>/gi)){
  const tag=v24SyntaxTag(source,m.index);if(!tag||!tag.close||tag.attrs.trim())continue;
  const state=v2217Previous_v24SyntaxScan(tableShadow.slice(0,m.index));
  if(state.templates.length||state.links.length||state.external.length||state.tables.length||state.html.length)continue;
  edits.push({start:m.index,end:m.index+m[0].length,text:m[0].replace(/[^\r\n]/g,' ')});
 }
 return v24SyntaxApply(source,edits);
}
function v24SyntaxScan(source){
 const cached=V2217_SCAN_CACHE.map.get(source);if(cached){V2217_SCAN_CACHE.map.delete(source);V2217_SCAN_CACHE.map.set(source,cached);return v2217CopyStructuralScan(cached.result);}
 const shadow=v2217NativeTableShadow(source),result=v2217Previous_v24SyntaxScan(shadow);
 const shield=shadow===source?null:v24SyntaxProtected(source),value=shield?{...result,view:shield.view,shield}:result;
 const bytes=source.length*4+(value.tokens?.length||0)*192+(value.issues?.length||0)*96+(value.boundaries?.length||0)*16+256;
 if(bytes<=33554432){V2217_SCAN_CACHE.map.set(source,{result:v2217CopyStructuralScan(value),bytes});V2217_SCAN_CACHE.bytes+=bytes;
  while(V2217_SCAN_CACHE.map.size>2048||V2217_SCAN_CACHE.bytes>33554432){const key=V2217_SCAN_CACHE.map.keys().next().value,old=V2217_SCAN_CACHE.map.get(key);V2217_SCAN_CACHE.map.delete(key);V2217_SCAN_CACHE.bytes-=old.bytes;}
 }
 return value;
}
function v24SyntaxTemplateProfile(body){
 const ordinary=v2217Previous_v24SyntaxTemplateProfile(body);if(ordinary)return ordinary;
 if(/[{}<>\uE000]/.test(body))return null;
 const parts=v24SyntaxParts(body);if(!parts||v24SyntaxName(parts[0].text)!=='portal3')return null;
 const args=parts.slice(1).map(p=>p.text.trim());
 return args.length>0&&args.length<=10&&args.every(a=>/^[\p{L}\p{N} _.-]+$/u.test(a))?{name:'portal3',kind:'literal-portals'}:null;
}
function v2217SuccessionBlocks(source){
 if(!/\{\{\s*(?:Começa caixa|S-start)\s*\}\}/i.test(source))return [];
 const view=scanProtectedView(source),nodes=topNodes(view),blocks=[];
 for(const node of nodes){
  if(!v2217NativeTableStandalone(source,node)||!['começa caixa','s-start'].includes(v2217NativeTableName(source.slice(node.start,node.end)))||parsedTemplate(source.slice(node.start,node.end)).parts.length!==1)continue;
  let end=null;
  for(const m of view.slice(node.end).matchAll(/^[ \t]*(?:\|\}|\{\{\s*(?:Fim|S-end)\s*\}\})[ \t]*(?:\r?$)/gmi)){
   const start=node.end+m.index,until=start+m[0].length,inside=nodes.filter(n=>n.start>=node.end&&n.end<=start);
   if(inside.some(n=>!/^s-(?:ppo|par(?:\/[a-z-]+)?|bef|aft|ttl|inc|non|bus|gov|mil|reg|off|edu|rel|ach|sports|awards|culture|vac|new|break)$/i.test(v2217NativeTableName(source.slice(n.start,n.end)))))break;
   let rest=view.slice(node.end,start);for(const n of inside.slice().reverse())rest=rest.slice(0,n.start-node.end)+rest.slice(n.start-node.end,n.end-node.end).replace(/[^\r\n]/g,' ')+rest.slice(n.end-node.end);
   if(rest.split(/\r?\n/).every(line=>!line.trim()||/^\s*\|-\s*$/.test(line))){end=until;break;}
   break;
  }
  if(end!==null)blocks.push({start:node.start,end,raw:source.slice(node.start,end),role:'navbox'});
 }
 return blocks;
}
function footerTokens(source,profiles={}){
 const blocks=v2217SuccessionBlocks(source);if(!blocks.length)return v2217Previous_footerTokens(source,profiles);
 const marker='{{V2217 sucessão nativa}}',edits=blocks.map(b=>({start:b.start,end:b.end,text:marker+source.slice(b.start+marker.length,b.end).replace(/[^\r\n]/g,' ')}));
 const shadow=v24SyntaxApply(source,edits),result=v2217Previous_footerTokens(shadow,{...profiles,'v2217 sucessão nativa':'navbox'});
 return {...result,tokens:result.tokens.map(t=>{const b=blocks.find(b=>b.start===t.start);return b?{...t,...b}:{...t,raw:source.slice(t.start,t.end)};})};
}
function footerRole(raw,profiles={}){
 // These native consumers produce external-link text, not movable footer boxes.
 const name=v2217NativeTableName(raw);
 if(['conglinks','c-span'].includes(name))return 'boundary';
 return v2217Previous_footerRole(raw,profiles);
}
function v2217StructureScope(source,cfg={}){return typeof source==='string'&&v2215AliasScope(source,cfg,false)&&cfg.markup!==false;}
function v2217StructureTemplateEdits(source,cfg){
 const edits=[],view=scanProtectedView(source),blocked=v219MarkdownLiteralRanges(source).concat(v219QuotedTemplateRanges(source));
 for(const node of templates(view).nodes){
  if(blocked.some(r=>r.start<node.end&&r.end>node.start))continue;
  const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),name=v2217NativeTableName(raw);let parts=p.parts.slice(),count=0;
  const entries=foreignEntries(p),keys=new Set(entries.map(e=>e.positional?'':norm(e.key)));
  if(name==='s-bef')for(let i=0;i<entries.length;i++){
   const e=entries[i],m=!e.positional&&/^before([2-5]?)$/i.exec(e.key.trim());if(!m)continue;
   const key='antes'+m[1];if(keys.has(key))continue;
   parts[i+1]=parts[i+1].replace(/^(\s*)before([2-5]?)(\s*=)/i,'$1antes$2$3');count++;
  }
  if(name==='s-inc'&&entries.length===1&&entries[0].positional&&entries[0].value.trim()==='recent'){
   parts[1]=parts[1].replace('recent','recente');count++;
  }
  if(/^election box (?:winning )?candidate with party link no change$/.test(name)&&cfg.links!==false){
   const party=entries.filter(e=>!e.positional&&norm(e.key)==='party');
   if(party.length===1&&party[0].value.trim()==='Democratic Party (United States)'){
    const i=entries.indexOf(party[0])+1;parts[i]=parts[i].replace('Democratic Party (United States)','Partido Democrata (Estados Unidos)');count++;
   }
  }
  if(count)edits.push({start:node.start,end:node.end,text:'{{'+parts.join('|')+'}}',kind:'native-succession-or-party-fields',count,witness:{source:raw,nativeName:name}});
 }
 return edits;
}
function v2217StructureCellEdits(source,cfg){
 if(cfg.automaticTableRepairs===false||!/\{\{\s*Td fmtn\s*\|/i.test(source))return [];
 const view=scanProtectedView(source),tables=v272LiteralTables(source).tables,edits=[];
 for(const node of templates(view).nodes){
  const raw=source.slice(node.start,node.end),p=parsedTemplate(raw);
  if(node.depth||!['td fmtn','célula com número formatado'].includes(p.name)||p.parts.length!==2||!/^\s*[+-]?(?:\d+(?:\.\d+)?|\.\d+)\s*$/.test(p.parts[1])||!tables.some(t=>node.start>t.start&&node.end<t.end))continue;
  const line=source.lastIndexOf('\n',node.start-1)+1,prefix=source.slice(line,node.start),m=/[ \t]*\|[ \t]*$/.exec(prefix);
  if(!m||m.index>0&&prefix[m.index-1]==='|')continue;
  const at=line+m.index,token=source.slice(at,node.start);
  // The native producer emits its own initial pipe. A redundant ordinary cell
  // delimiter can be removed without interpreting or reformatting the number.
  edits.push({start:at,end:node.start,text:prefix.slice(0,m.index).trim()?'\n':'',kind:'native-cell-producer-line',count:1,witness:{producer:raw,removed:token,nativeOldid:72998463}});
 }
 return edits;
}
function v2217StructureSpacingEdits(source,cfg){
 if(cfg.links===false||cfg.automaticProseGaps===false||!/(?:\]\],\[\[|\be\[\[|\bou\[\[|^\*+[^\s*])/m.test(source))return [];
 const shield=v24SyntaxProtected(source),view=shield.view,edits=[],refs=refTokens(view),nodes=templates(view).nodes,
  quoted=v219WholeQuotedCodeRanges(source).concat(v219QuotedTemplateRanges(source)),urls=[...view.matchAll(/\b[a-z][a-z0-9+.-]*:\/\/[^\s<>]+/gi)].map(m=>({start:m.index,end:m.index+m[0].length}));
 const allowed=(start,end)=>{
  if(shield.ranges.some(r=>r.start<end&&r.end>start)||refs.some(r=>r.start<end&&r.end>start)||quoted.some(r=>r.start<end&&r.end>start)||urls.some(r=>r.start<end&&r.end>start))return false;
  const state=v24SyntaxContext(view,start);if(state.html.length||state.tables.length||state.links.length||state.external.length)return false;
  if(!state.templates.length)return true;
  if(state.templates.length!==1)return false;
  const owner=nodes.find(n=>n.start===state.templates[0].start);if(!owner)return false;
  const raw=source.slice(owner.start,owner.end),p=parsedTemplate(raw);if(!/^info\/(?:conflito militar|conflito civil)$/i.test(p.name))return false;
  const fields=v220BioLiteralFields(raw);if(!fields)return false;
  return fields.some(f=>!f.positional&&/^(?:local|causas|objetivos|resultado|métodos|metodos|lado[1-3]|combatente[1-3]|comandante[1-3])$/.test(f.key)&&owner.start+f.start<=start&&owner.start+f.end>=end);
 };
 for(const m of view.matchAll(/\]\],(?=\[\[)/g)){
  const start=m.index,end=start+m[0].length,at=end;
  // The match begins inside its completed link. Check ownership immediately
  // after that link, while retaining the comma and both destinations verbatim.
  if(allowed(at,at+1))edits.push({start:at,end:at,text:' ',kind:'prose-link-separator-space',count:1});
 }
 for(const m of view.matchAll(/\b(?:e|ou)(?=\[\[)/g)){
  const at=m.index+m[0].length;if(allowed(m.index,at))edits.push({start:at,end:at,text:' ',kind:'prose-coordinator-space',count:1});
 }
 for(const m of view.matchAll(/^\*+(?=[^\s*\r\n])/gm)){
  const at=m.index+m[0].length;if(allowed(m.index,at))edits.push({start:at,end:at,text:' ',kind:'bullet-source-space',count:1});
 }
 return edits;
}
function v2217StructurePlan(source,options={}){
 const plan={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,steps:[],edits:[]};
 if(!v2217StructureScope(source,options))return plan;
 const cfg=pageContextOptions({...DEFAULTS,...options});
 for(const [name,find]of [['template-closers',s=>cfg.syntaxRepairs===false?[]:v24SyntaxTemplateEdits(s)],['native-fields',s=>v2217StructureTemplateEdits(s,cfg)],['cell-producers',s=>v2217StructureCellEdits(s,cfg)],['source-spacing',s=>v2217StructureSpacingEdits(s,cfg)]]){
  const before=plan.text;let edits;try{edits=find(before).sort((a,b)=>a.start-b.start||a.end-b.end);}catch{continue;}
  if(!edits.length||edits.some((e,i)=>i&&e.start<edits[i-1].end))continue;
  const after=v24SyntaxApply(before,edits);if(after===before)continue;
  plan.steps.push({name,before,after,edits});plan.edits.push(...edits);plan.text=after;
 }
 return plan;
}
function v2217StructureProof(before,after,plan,options={}){
 if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
 const fresh=v2217StructurePlan(before,options);return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
function v2217StructureProjection(source,cfg={}){const plan=v2217StructurePlan(source,cfg);return v2217StructureProof(source,plan.text,plan,cfg)?plan.text:source;}
