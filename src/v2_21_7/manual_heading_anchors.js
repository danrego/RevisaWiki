// Preserve authored section targets at existing write admissions.
function v2217HeadingDecoded(raw){
 let text=String(raw);for(let pass=0;pass<3;pass++){
  const next=v2217AnchorDecoded(text.replace(/(?:\.[0-9a-f]{2})+/gi,run=>run.replace(/\./g,'%')))
   .replace(/(?:%[0-9a-f]{2})+/gi,run=>{try{return decodeURIComponent(run);}catch{return run.replace(/%([0-9a-f]{2})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));}})
   .replace(/&(?:UnderBar|lowbar);/gi,'_').replace(/&ecirc;/gi,'ê').replace(/&eacute;/gi,'é').replace(/&aacute;/gi,'á').replace(/&atilde;/gi,'ã').replace(/&otilde;/gi,'õ');
  if(next===text)break;text=next;
 }return text;
}

function v2217HeadingKey(raw){return v2217HeadingDecoded(raw).replace(/'{2,5}/g,'').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,'$2').replace(/\[\[([^\]]+)\]\]/g,'$1').normalize('NFC').replace(/_/g,' ').replace(/\s+/g,' ').trim().toLowerCase();}

function v2217HeadingFragmentView(source){
 const view=v219NativeReferenceObserver(source).view,masks=[];
 const foreign=raw=>{let value=v2217HeadingDecoded(raw).trim();if(!/#/.test(value))return false;
  if(/^[a-z\d.-]+\.[a-z]{2,}(?:\/|#)/i.test(value))value='http://'+value;
  value=value.replace(/^(https?):\/?(?!\/)/i,'$1://');if(!/^(?:https?:|\/\/)/i.test(value))return false;
  try{const u=new URL(value,'https://pt.wikipedia.org');return !u.username&&!u.password&&!['pt.wikipedia.org','pt.m.wikipedia.org'].includes(u.hostname);}catch{return false;}
 };
 for(const m of view.matchAll(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)){const target=m[1]??m[2]??m[3],at=m.index+m[0].indexOf(target);if(foreign(target))masks.push({start:at,end:at+target.length});}
 for(const m of view.matchAll(/[^\s<>{}\[\]|"']+/g))if(foreign(m[0]))masks.push({start:m.index,end:m.index+m[0].length});

 // Only actual column-zero list-prefix hashes are syntax rather than targets.
 // Attribute spans and nested source owners retain their possible consumers.
 const tagOwners=[];for(let at=view.indexOf('<');at>=0;){const tag=v24SyntaxTag(view,at);if(tag){tagOwners.push({start:tag.start,end:tag.end});at=view.indexOf('<',tag.end);}else at=view.indexOf('<',at+1);}
 for(const marker of view.matchAll(/^[*#:;]+/gm)){
  if(!marker[0].includes('#'))continue;
  const context=v24SyntaxContext(view,marker.index);
  if(['templates','links','external','tables','html'].some(key=>context[key]?.length)||tagOwners.some(r=>r.start<=marker.index&&marker.index<r.end))continue;
  for(const hashes of marker[0].matchAll(/#+/g))masks.push({start:marker.index+hashes.index,end:marker.index+hashes.index+hashes[0].length});
 }

 // Incomplete tag-like source remains an unproved owner for these new roles.
 const newRoleUnknownTags=[];for(const tag of view.matchAll(/<\s*[/\\]?\s*[a-z][a-z0-9-]*(?=[\s/>])/gi))if(!v24SyntaxTag(view,tag.index))newRoleUnknownTags.push(tag.index);
 // A literal bracketed foreign target may contain a single apostrophe.
 // The target ends before its label; unknown owners and dynamic targets stay visible.
 for(const m of view.matchAll(/\[((?:https?:\/\/|\/\/)[^\s\u0000-\u0020\u007f\u180e\ufffd<>"{}\[\]|]+)(?=[\s\]<>"])/gi)){
  const target=m[1],start=m.index+1,end=start+target.length,close=view.indexOf(']',end),lineEnd=view.indexOf('\n',end),owner=v24SyntaxContext(view,m.index);
  if(view[m.index-1]==='['||newRoleUnknownTags.some(at=>at<m.index)||target.includes("''")||close<0||lineEnd>=0&&close>lineEnd||!foreign(target)||['templates','links','external','tables'].some(key=>owner[key]?.length)||owner.html.some(tag=>tag.name!=='ref')||tagOwners.some(r=>r.start<=m.index&&m.index<r.end))continue;
  masks.push({start,end});
 }
 // A verified CSS colour slot contains no link target; retain every other slot.
 const colours=(raw,at)=>{const attrs=tableAttrs(raw,at);if(!attrs.valid)return;
  for(const attr of attrs.attrs){const value=attr.value;if(typeof value!=='string')continue;const start=attr.start+attr.raw.indexOf(value);
   if(attr.key==='bgcolor'&&/^#[a-f\d]{3}(?:[a-f\d]{3})?$/i.test(value))masks.push({start,end:start+value.length});
   if(attr.key==='style')for(const m of value.matchAll(/(?:^|;)\s*(?:color|background-color|background|border-color)\s*:\s*(#[a-f\d]{3}(?:[a-f\d]{3})?)\s*(?=;|$)/gi)){const begin=start+m.index+m[0].indexOf(m[1]);masks.push({start:begin,end:begin+m[1].length});}
  }
 };
 for(const m of view.matchAll(/^[ \t]*\|(?:-)?[^\r\n]*/gm)){
  const prefix=/^[ \t]*\|(-?)/.exec(m[0]),context=v24SyntaxContext(view,m.index);if(!context.tables.length||context.templates.length||context.links.length||context.external.length||context.html.length)continue;
  let stop=m[0].length,quote='';if(!prefix[1]){stop=-1;for(let i=prefix[0].length;i<m[0].length;i++){const ch=m[0][i];if(quote){if(ch===quote)quote='';}else if(ch==='"'||ch==="'")quote=ch;else if(ch==='|'){stop=i;break;}}}
  if(stop>=prefix[0].length)colours(m[0].slice(prefix[0].length,stop),m.index+prefix[0].length);
 }
 for(const tag of tagOwners){const full=v24SyntaxTag(view,tag.start);if(full&&!full.close&&['table','tr','td','th'].includes(full.name))colours(full.attrs,full.start+full.raw.indexOf(full.attrs));}
 // Native CS1 URL roles are complete literal targets, never labels or payload.
 // These additional native roles are independently pinned; no field is removed.
 const colourNodes=templates(view).nodes,colourRoles=[
  ['Info/Sítio',['fundo']],['Info/Biografia',['bgcolour']],['Info/Biografia/Wikidata',['bgcolour']],
  ['Elenco atual de futebol',['cor_fundo1','cor_fundo2','cor_letra1','cor_letra2']],['Elenco de Futebol',['cor fundo1']],
  ['Info/Partido político',['colorcode']],['Info/Partido político/lugares',['3','hex']]
 ];
 const colourParts=node=>{const raw=view.slice(node.start,node.end),parts=v215BraceParts(raw.slice(2,-2));if(!parts)return null;const fields=[];let positional=0;
  for(const part of parts.slice(1)){const match=/^([ \t\r\n]*)([\p{L}\p{N} _/()\-]+?)([ \t\r\n]*)=([\s\S]*)$/u.exec(part.text);
   if(!match&&part.text.includes('='))return null;
   const key=match?match[2]:String(++positional),value=match?match[4]:part.text,prefix=match?match[1].length+match[2].length+match[3].length+1:0;
   fields.push({key,value,start:node.start+2+part.start+prefix,end:node.start+2+part.end});
  }return fields;
 };
 let colourTableScopes=null;
 const colourCellContent=node=>{if(!colourTableScopes)colourTableScopes=v262SyntaxQuotationScopes(view);const cell=v262SyntaxContainingRange(colourTableScopes.cells,node.start);if(!cell||node.end>cell.end)return false;
  if([...colourTableScopes.attributes.values()].some(r=>r.start<=node.start&&node.start<r.end))return false;
  let shadow=view.slice(cell.start,cell.end);for(const child of colourNodes.filter(r=>cell.start<=r.start&&r.end<=cell.end).sort((a,b)=>b.start-a.start))shadow=shadow.slice(0,child.start-cell.start)+shadow.slice(child.start-cell.start,child.end-cell.start).replace(/[^\r\n]/g,' ')+shadow.slice(child.end-cell.start);
  let invalid=false;const visible=tableCellView(shadow,()=>{invalid=true;}),separator=visible.indexOf('|');if(invalid)return false;
  if(separator>=0)return node.start>cell.start+separator&&tableAttrs(view.slice(cell.start,cell.start+separator),cell.start).valid;
  return !/^[ \t]*[A-Za-z_:][A-Za-z0-9_:.-]*[ \t]*=/.test(view.slice(cell.start,node.start));
 };
 const colourContext=node=>{const owner=v24SyntaxContext(view,node.start);if(newRoleUnknownTags.some(at=>at<node.start)||owner.links.length||owner.external.length||owner.html.some(tag=>tag.name!=='ref')||tagOwners.some(r=>r.start<=node.start&&node.start<r.end))return false;
  const parents=colourNodes.filter(parent=>parent.start<node.start&&node.end<=parent.end);if(owner.templates.length!==parents.length)return false;
  if(parents.length){if(parents.length!==1)return false;const parent=parents[0],parts=v215BraceParts(view.slice(parent.start+2,parent.end-2));if(!parts||!v215SameTemplateTitle(parts[0]?.text||'','Info/Partido político'))return false;
   const fields=colourParts(parent);if(!fields||!fields.some(field=>/^lugares[3-6]$/.test(field.key)&&field.start<=node.start&&node.end<=field.end))return false;
  }
  return !owner.tables.length||colourCellContent(node);
 };
 for(const node of colourNodes){const raw=view.slice(node.start,node.end),parts=v215BraceParts(raw.slice(2,-2)),header=parts[0]?.text||'',fields=v2151FieldSyntaxParts(raw)||[],context=v218CitationNativeContext(raw);
  if(context)for(const field of fields){const roles=v219NativeCitationRoles(field.key);if(field.key!==field.plain||field.separator!=='='||!roles.some(role=>['URL','ArchiveURL'].includes(role))||!nativeCitationAccepts(context.native,field.key))continue;
   const value=field.value.trim();if(value&&!/[\s<>{}\[\]|]/.test(value)&&foreign(value))masks.push({start:node.start+field.start,end:node.start+field.end});
  }
  const colourRole=colourRoles.find(([name])=>v215SameTemplateTitle(header,name));
  if(colourRole){const colourFields=colourParts(node);if(colourFields&&colourContext(node))for(const field of colourFields){
   if(!colourRole[1].includes(field.key)||!/^\s*(?:#[a-fA-F\d]{3}(?:[a-fA-F\d]{3})?|#\{\{[Rr]GBpol\s*\|\s*(?:PS|PSD|PCP|CDS|BE|PEV)\s*\}\})\s*$/.test(field.value))continue;
   const at=field.start+field.value.indexOf('#');masks.push({start:at,end:at+1});
  }}
  if(v215SameTemplateTitle(header,'Fb cl2 team'))for(const field of fields)if(field.key==='bc'&&field.plain==='bc'&&field.separator==='='&&/^\s*#[a-f\d]{3}(?:[a-f\d]{3})?\s*$/i.test(field.value))masks.push({start:node.start+field.start,end:node.start+field.end});
  if(v215SameTemplateTitle(header,'Legend')||v215SameTemplateTitle(header,'Legenda')){
   let positional=0;for(const part of parts.slice(1)){const named=/^\s*([\w-]+)\s*=/.exec(part.text),key=named?named[1]:String(++positional),value=named?part.text.slice(named[0].length):part.text;if(key!=='1')continue;
    if(/^\s*(?:#[a-fA-F\d]{3}(?:[a-fA-F\d]{3})?|#\{\{[Rr]GBpol\s*\|\s*(?:PS|PSD|PCP|CDS|BE|PEV)\s*\}\})\s*$/.test(value)){const at=node.start+2+part.start+(named?named[0].length:0)+value.indexOf('#');masks.push({start:at,end:at+1});}
   }
  }
 }
 // A verified foreign interwiki target is distinct from its still-visible label.
 for(const m of view.matchAll(/\[\[\s*:?[dD][eE]:([^\]\r\n|]*)/g)){
  const end=m.index+m[0].length,boundary=view.slice(end,end+2),context=v24SyntaxContext(view,m.index);
  if(!m[1].includes('#')||!m[1].split('#')[0].trim()||/[{}<>\[\]]/.test(m[1])||!(boundary==='\]\]'||boundary.startsWith('|'))||['templates','links','external','html'].some(key=>context[key]?.length)||tagOwners.some(r=>r.start<=m.index&&m.index<r.end))continue;
  masks.push({start:m.index+2,end});
 }
 // Ordinary prose is not an implicit link or helper parameter.
 for(const m of view.matchAll(/(?<![\p{L}\p{N}_:/?&=%])F#CK(?![\p{L}\p{N}_/?&=%])/giu)){
  const atomStart=m.index-(view.slice(0,m.index).match(/\S*$/)?.[0].length||0),atomEnd=m.index+m[0].length+(view.slice(m.index+m[0].length).match(/^\S*/)?.[0].length||0),atom=view.slice(atomStart,atomEnd);
  if(!/^['"“”‘’()*]*F#CK['"“”‘’(),.!?;:]*$/iu.test(atom))continue;
  const context=v24SyntaxContext(view,m.index);if(['templates','links','external','tables','html'].some(key=>context[key]?.length)||tagOwners.some(r=>r.start<=m.index&&m.index<r.end))continue;
  masks.push({start:m.index+1,end:m.index+2});
 }
 let safe=view;for(const r of masks.sort((a,b)=>b.start-a.start))safe=safe.slice(0,r.start)+safe.slice(r.start,r.end).replace(/[^\r\n]/g,' ')+safe.slice(r.end);
 return safe.split(/\r?\n/).map(line=>v2217HeadingDecoded(line).replace(/[\r\n]/g,' ')).join('\n').normalize('NFC').toLowerCase();
}

function v2217HeadingProducers(source){
 if(typeof source!=='string')return[];const view=v219NativeReferenceObserver(source).view,rows=[];
 for(const m of view.matchAll(/^(={1,6})(?!=)[ \t]*(.*?)[ \t]*\1[ \t]*\r?$/gm)){
  const c=v24SyntaxContext(view,m.index);if(['templates','links','external','tables'].some(k=>c[k]?.length)||c.html.some(t=>['ref','references'].includes(t.name)))continue;
  const key=v2217HeadingKey(m[2]);if(!key)continue;rows.push({start:m.index,end:m.index+m[0].length,key,kind:'literal-heading',uncertainLabel:/[<>{}]|&(?:#|[a-z])/i.test(m[2]),value:[m[1].length,m[2].replace(/^[ \t]+|[ \t]+$/g,'')]});
 }
 for(const range of rendererRanges(view)){
  const raw=source.slice(range.start,range.end);if(/^<references\b/i.test(raw))continue;const parsed=parsedTemplate(raw),head=v215TemplateTitle(parsed.parts[0]);if(v215SameTemplateTitle(head,'Notas e referências')){for(const[key,level]of[['notas e referências',2],['notas',3],['referências',3]])rows.push({...range,key,kind:'native-heading-provider',value:[level,raw]});continue;}const provider=v2217ReferenceHeadingProvider(raw);
  if(provider.known&&provider.headed&&provider.name)rows.push({...range,key:v2217HeadingKey(provider.name),kind:'native-heading-provider',value:[provider.level,raw]});
 }
 return rows.sort((a,b)=>a.start-b.start||a.end-b.end);
}

function v2217HeadingInventory(source,cfg={}){
 cfg=cfg&&typeof cfg==='object'?cfg:{};const original=typeof cfg.v2217HeadingSource==='string'?cfg.v2217HeadingSource:source;if(typeof source!=='string'||cfg.sectionOnly!==true&&!/#|%|&(?:num|#)/i.test(original))return{active:false,groups:[],ranges:[],duplicate:false};
 const producers=v2217HeadingProducers(source);if(!producers.length)return{active:false,groups:[],ranges:[],duplicate:false};
 const fragments=v2217HeadingFragmentView(original),targeted=new Set(),uncertain=/#/.test(fragments)&&v2217HeadingProducers(original).some(p=>p.uncertainLabel);
 for(const p of producers){const escaped=p.key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ /g,'[ _]+');
  if(cfg.sectionOnly===true||uncertain||new RegExp('#[ \\t]*'+escaped+'(?:[ _]+[1-9]\\d*)?(?=$|[^\\p{L}\\p{N}_])','u').test(fragments))targeted.add(p.key);
 }
 const groups=[...targeted].sort().map(key=>[key,producers.filter(p=>p.key===key).map(p=>[p.kind,p.value])]);
 return{active:groups.length>0,groups,ranges:producers.filter(p=>targeted.has(p.key)),duplicate:groups.some(g=>g[1].length>1)};
}

function v2217HeadingSnapshot(source,cfg={}){const h=v2217HeadingInventory(source,cfg);return h.active?JSON.stringify(h.groups):null;}

function v2217CombinedProtectionRequired(source,cfg={}){return v2217AnchorProtectionRequired(source,cfg)||v2217HeadingInventory(source,cfg).active;}

function cleanHeadings(source,bump,multilingual=true,cfg={}){
 cfg=cfg&&typeof cfg==='object'?cfg:{};if(!v2217HeadingInventory(source,cfg).active)return v2217Previous_cleanHeadings(source,bump,multilingual);
 const proposed=v2217Previous_cleanHeadings(source,()=>{},multilingual);if(proposed===source)return source;
 const before=source.split('\n'),after=proposed.split('\n');if(before.length!==after.length)return source;
 const edits=[];let offset=0;for(let i=0;i<before.length;i++){if(before[i]!==after[i]){let edit={start:offset,end:offset+before[i].length,text:after[i]};if(!v2217AnchorRetainedEdits(source,[edit],cfg).length){const m=/^(={2,6})[ \t]*(.*?)[ \t]*\1[ \t]*$/.exec(before[i]);if(m)edit={...edit,text:m[1]+' '+m[2].replace(/^[ \t]+|[ \t]+$/g,'')+' '+m[1]};}if(edit.text!==before[i])edits.push(edit);}offset+=before[i].length+1;}
 const kept=v2217AnchorRetainedEdits(source,edits,cfg),text=v24SyntaxApply(source,kept);for(const e of kept)if(source.slice(e.start,e.end)!==e.text)bump('headings');return text;
}

function orderEndSections(source,cfg,bump,warn){if(v2217HeadingInventory(source,cfg).duplicate)return source;return v2217Previous_orderEndSections(source,cfg,bump,warn);}
