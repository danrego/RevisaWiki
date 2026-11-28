// Pure readers for the final count. These functions never propose a repair or
// change the draft, and are not used as a writer's scope or safety permission.
function v2222LayoutCountSealedHtml(source,nodes,state,at){
 if(typeof source!=='string'||!Array.isArray(nodes)||!state||!state.html?.length||['templates','tables','links','external'].some(k=>!Array.isArray(state[k])||state[k].length))return false;
 const owners=nodes.filter(n=>Number.isInteger(n.start)&&Number.isInteger(n.end)&&n.start>=0&&n.end<=at&&n.end>n.start&&/^\{\{\s*(?:(?:Predefinição|Template)\s*:\s*)?(?:Info\/|Infobox(?:[ _]|$))/i.test(source.slice(n.start,n.end)));
 // A complete image caption is another literal source owner. Its unclosed
 // formatting tag must not hide later count units outside the image itself.
 const stack=[];for(let i=0;i<at-1;i++){const pair=source.slice(i,i+2);if(pair==='[['){stack.push(i);i++;}else if(pair===']]'&&stack.length){const start=stack.pop(),end=i+2;if(/^\[\[(?:Ficheiro|Imagem|File|Image|Arquivo)\s*:[^\[\]{}<>|\r\n]+\|/i.test(source.slice(start,end)))owners.push({start,end});i++;}}
 // Masking gallery markup may turn a same-line closing center into an
 // apparently indented literal on a second parser pass. Its original source
 // proves the complete balanced wrapper; no general HTML exception is used.
 for(const m of source.slice(0,at).matchAll(/<center>[ \t\r\n]*<gallery\b[^{}<>]*>[\s\S]*?<\/gallery>[ \t\r\n]*<\/center>/gi))owners.push({start:m.index,end:m.index+m[0].length});
 for(const table of v272LiteralTables(source).tables)if(!table.nested&&table.attrs?.valid&&table.end<=at)owners.push({start:table.start,end:table.end});
 // Two native-previewed mathematical tuples are escaped text, not HTML x
 // containers. The exact original bytes prove this finite count-only case.
 const tuples=new Set(['<x+dx,y,f(x+dx,y)>','<x+dx,y+dy,f(x+dx,y+dy)>']);
 return state.html.every(tag=>Number.isInteger(tag.start)&&Number.isInteger(tag.end)&&tag.start<tag.end&&(owners.some(n=>n.start<=tag.start&&tag.end<n.end)||tag.name==='x'&&!tag.close&&!tag.self&&source.slice(tag.start,tag.end)===tag.raw&&tuples.has(tag.raw.replace(/[ \t]/g,''))));
}
function v2222LayoutCountOwnerAlias(raw){
 if(typeof raw!=='string')return null;
 const magic=/^([^{}|:<>\r\n]+):([^{}|<>\r\n]+)$/.exec(v2221LayoutHeader(raw)||'');if(magic&&v222MagicIdentity(magic[1])==='displaytitle')return'@displaytitle:'+magic[2];
 if(v2221LayoutNamed(raw,['Commonscat em linha','Commonscat-inline','Commons category']))return'@sister:commonscat';
 if(v2221LayoutNamed(raw,['Wikisource-inline','Wikisource em linha','Wikisource']))return'@sister:wikisource';
 if(v2221LayoutNamed(raw,['Refbegin','InícioRef']))return'@bibliography:begin';
 if(v2221LayoutNamed(raw,['Refend','-fim']))return'@bibliography:end';
 const sister=v2221LayoutFields(raw);if(sister&&sister.fields.length<=2&&sister.fields.every(f=>['1','2'].includes(f.key)&&!/[{}<>\r\n]/.test(f.value))&&v2221LayoutNamed(raw,['Commons-inline','Commons em linha','Commons']))return'@sister:commons';
 // Native Portal consumes numeric topics in order; Portal3 renders slots
 // 1 through 10. Keep every literal topic and reject styling, gaps or code.
 const portal=v2221LayoutFields(raw);if(portal&&portal.fields.length>0&&portal.fields.length<=10&&portal.fields.every((f,i)=>f.key===String(i+1)&&f.value.trim()&&!/[{}<>\[\]\r\n]/.test(f.value))&&v2221LayoutNamed(raw,['Portal']))return'portal3';
 if(v2221LayoutNamed(raw,['AP','Artigo principal','Main']))return'@hatnote:article-main';
 if(v2221LayoutNamed(raw,['desambigexplicada','Ver desambiguação2','Ver desambig']))return'@hatnote:ver-desambig';
 return null;
}
// Quote-box layout fields may be renamed while its complete quotation and
// attribution stay exact. That unchanged native payload identifies distinct
// boxes without borrowing a position or treating their layout as permission.
function v2222LayoutCountOwnerContentFingerprints(raw){
 const p=v2221LayoutFields(raw);if(!p||!v2221LayoutNamed(raw,['Caixa de citação']))return[];
 const roles=new Map([['alinhar','position'],['posição','position'],['largura','width'],['alinhar_fonte','source-position'],['posição-autor','source-position'],['citação','quotation'],['fonte','source']]),seen=new Set(),payload=new Map();
 for(const f of p.fields){const role=roles.get(f.key);if(!role||seen.has(role))return[];seen.add(role);if(['quotation','source'].includes(role)){if(!f.value.trim())return[];payload.set(role,f.value);}else if(!f.value.trim()||/[{}<>\[\]\r\n]/.test(f.value.trim()))return[];}
 return payload.size===2?['native-quote-payload:'+JSON.stringify([payload.get('quotation'),payload.get('source')])]:[];
}
function v2222LayoutCountFooterSection(source,c,start,end){
 const allowed=new Set(['bibliografia','leitura adicional','leituras adicionais','ligações externas','obras citadas']),heads=[...c.view.matchAll(/^(={2,6})[ \t]*([^=\r\n]+?)[ \t]*\1[ \t]*\r?$/gm)].filter(h=>v2222CountOutside(c,h.index,h.index+h[0].length)),i=heads.findLastIndex(h=>h.index+h[0].length<=start),head=heads[i];if(!head)return null;
 const title=head[2].trim().toLocaleLowerCase('pt'),limit=heads[i+1]?.index??source.length;
 return allowed.has(title)&&heads.filter(h=>h[2].trim().toLocaleLowerCase('pt')===title).length===1&&end<=limit?{key:'native-column-section:'+head[0],start:head.index+head[0].length,end:limit}:null;
}
// A complete native column frame can also be identified by its sole position
// inside a unique unchanged footer heading. Its body is never normalized or
// projected by this witness and must still pass the independent body counter.
function v2222LayoutCountColumnSectionIdentity(source,frame,frames){
 if(typeof source!=='string'||!frame||!Array.isArray(frames)||!Number.isInteger(frame.start)||!Number.isInteger(frame.end)||frame.start<0||frame.end>source.length||frame.start>=frame.end||typeof frame.body!=='string'||!frame.body.trim())return null;
 const c=v2222CountReadContext(source),open=c.nodes.find(n=>n.start===frame.start),close=c.nodes.find(n=>n.end===frame.end);
 if(!open||!close||!v2222CountOutside(c,open.start,open.end)||!v2222CountOutside(c,close.start,close.end))return null;
 const raw=source.slice(open.start,open.end),p=v2221LayoutFields(raw);if(!p)return null;
 if(frame.kind==='list'){if(open.end!==frame.end||!v2221LayoutNamed(raw,['Colunas-lista'])||p.fields.length!==2||p.fields.filter(f=>f.key==='1'&&/^\s*[1-9]\d?(?:\.\d+)?(?:em|px)?\s*$/.test(f.value)).length!==1||p.fields.filter(f=>f.key==='2'&&f.value===frame.body).length!==1)return null;}
 else{const last=source.slice(close.start,close.end),q=v2221LayoutFields(last);if(frame.kind!=='paired'||!v2221LayoutNamed(raw,['Div col'])||p.fields.length>1||p.fields.some(f=>f.key!=='colunas'||!/^\s*[1-9]\d?\s*$/.test(f.value))||!q||q.fields.length||!v2221LayoutNamed(last,['Div col fim','Div col end'])||source.slice(open.end,close.start)!==frame.body)return null;}
 const section=v2222LayoutCountFooterSection(source,c,frame.start,frame.end);if(!section)return null;const touching=frames.filter(f=>f.start<section.end&&section.start<f.end);
 return touching.length===1&&touching[0].start===frame.start&&touching[0].end===frame.end?section.key:null;
}
// The generic quoted-example reader can join two separate bold footer labels
// across a newly consolidated native list. Keep that reader unchanged. Only a
// complete readable original Div col with the same literal resource list,
// labels, section and column setting witnesses this after-only shell view.
function v2222LayoutCountWitnessedColumnsProjection(before,after,cfg={}){
 if(typeof before!=='string'||typeof after!=='string'||before===after||v2222NonWikitext(cfg))return null;
 const a=v2222CountColumnShells(before),b=v2222CountColumnShells(after);if(!a?.frames.length||!b||b.frames.length||a.frames.some(f=>f.kind!=='paired'||f.columns!=='2'))return null;
 const c=v2222CountReadContext(after),oldContext=v2222CountReadContext(before),quoted=v219QuotedTemplateRanges(after,false),literal=s=>v24SyntaxProtected(s).ranges.filter(r=>!['quotation','quotation-markup','quotation-template'].includes(r.kind)),hard=literal(after),oldHard=literal(before),used=new Set(),edits=[],events=[],labels=(s,start,end)=>{const left=s.slice(0,start).trimEnd(),prior=left.slice(left.lastIndexOf('\n')+1),next=/^[ \t\r\n]*([^\r\n]+)/.exec(s.slice(end))?.[1],pattern=/^[ \t]*'''[^'{}<>\[\]\r\n]+'''[ \t]*$/;return pattern.test(prior)&&typeof next==='string'&&pattern.test(next)?JSON.stringify([prior,next]):null;};
 for(const n of c.nodes){const raw=after.slice(n.start,n.end);if(n.depth!==0||!v2221LayoutNamed(raw,['Colunas-lista']))continue;const p=v2221LayoutFields(raw),body=p?.fields.find(f=>f.key==='2'),state=c.stateAt(n.start),ranges=c.countHard.filter(r=>r.start<n.end&&n.start<r.end),label=labels(after,n.start,n.end),section=v2222LayoutCountFooterSection(after,c,n.start,n.end);
  if(!p||p.fields.length!==2||p.fields.filter(f=>f.key==='1'&&f.value.trim()==='2').length!==1||!body||!body.value.trim()||!label||!section||['templates','html','tables','links','external'].some(k=>state[k].length)||!ranges.length||ranges.some(r=>r.start!==n.start||r.end!==n.end)||!quoted.some(r=>r.start===n.start&&r.end===n.end)||hard.some(r=>r.start<n.end&&n.start<r.end)||body.value.trim().split(/\r?\n/).some(line=>!/^\*[ \t]+(?:\[https?:\/\/|\{\{[ \t]*citar web[|}])/i.test(line.trimStart())))continue;
  const peers=c.nodes.filter(m=>m.depth===0&&v2221LayoutNamed(after.slice(m.start,m.end),['Colunas-lista'])&&v2221LayoutFields(after.slice(m.start,m.end))?.fields.some(f=>f.key==='2'&&f.value===body.value)),matches=a.frames.filter(f=>f.body===body.value);if(peers.length!==1||matches.length!==1||used.has(matches[0]))continue;const original=matches[0];if(labels(before,original.start,original.end)!==label||v2222LayoutCountFooterSection(before,oldContext,original.start,original.end)?.key!==section.key||oldHard.some(r=>r.start<original.end&&original.start<r.end))continue;const start=n.start+2+body.part.start+(body.positional?0:body.equals+1),end=n.start+2+body.part.end;if(after.slice(start,end)!==original.body)continue;used.add(original);edits.push({start:n.start,end:start,text:''},{start:end,end:n.end,text:''});events.push({id:'witnessed-column:'+original.start,kind:'column-wrapper-kind',count:1,anchor:{side:'before',start:original.start,end:original.end}});
 }
 return used.size===a.frames.length&&events.length?{before:a.text,after:v24SyntaxApply(after,edits),events}:null;
}
// Native Colunas renders col1 followed by col2. Accept its finite two-list
// replacement only when the actual target retains both complete payloads;
// a duplicate LF at their join belongs to that observed wrapper change.
function v2222LayoutCountSplitColumnsProjection(before,after,cfg={}){
 if(typeof before!=='string'||typeof after!=='string'||before===after||v2222NonWikitext(cfg))return null;
 const contexts=[before,after].map(v2222CountReadContext),read=(source,c,names)=>contexts[c].nodes.filter(n=>n.depth===0&&v2222CountOutside(contexts[c],n.start,n.end)&&v2221LayoutNamed(source.slice(n.start,n.end),names)).map(n=>({n,p:v2221LayoutFields(source.slice(n.start,n.end)),section:v2222LayoutCountFooterSection(source,contexts[c],n.start,n.end)})),old=read(before,0,['Colunas']),fresh=read(after,1,['Colunas-lista']),edits=[],events=[],used=new Set();
 for(const x of old){const f=x.p?.fields;if(!x.section||!f||f.length!==2||f[0].key!=='col1'||f[1].key!=='col2'||f.some(p=>!/^\r?\n[\s\S]+\r?\n$/.test(p.value)||p.value.trim().split(/\r?\n/).some(line=>!/^\*[ \t]+\S/.test(line))))continue;
  const body=f[0].value+f[1].value,joined=f[0].value+f[1].value.replace(/^\r?\n/,''),matches=fresh.filter(y=>y.section?.key===x.section.key&&y.p?.fields.length===2&&y.p.fields[0].key==='1'&&y.p.fields[0].value.trim()==='2'&&y.p.fields[1].key==='2'&&[body,joined].includes(y.p.fields[1].value));
  if(matches.length!==1||used.has(matches[0])||old.filter(y=>y.section?.key===x.section.key&&y.p?.fields.length===2&&y.p.fields[0].key==='col1'&&y.p.fields[1].key==='col2'&&y.p.fields[0].value===f[0].value&&y.p.fields[1].value===f[1].value).length!==1)continue;
  const y=matches[0];used.add(y);edits.push({start:x.n.start,end:x.n.end,text:after.slice(y.n.start,y.n.end)});events.push({id:'split-columns:'+x.n.start,kind:'column-wrapper-kind',count:1,anchor:{side:'before',start:x.n.start,end:x.n.end}});
 }
 return events.length?{before:v24SyntaxApply(before,edits),after,events}:null;
}
function v2222LayoutCountLinks(source,c){
 const result=[];for(const m of source.matchAll(/\[\[([^\[\]{}<>|\r\n]+)(?:\|([^\[\]{}<>\r\n]*))?\]\]([a-zà-öø-ÿ]*)/gu)){
  const target=m[1].replace(/_/g,' ').trim();if(!target||target.includes(':')||m[2]!==undefined&&!m[2])continue;
  let start=m.index,end=start+m[0].length,label=m[2]??target,style='',outer='';
  const inside=/^('{2}|'{3}|'{5})([^'](?:[^\r\n]*?[^'])?)\1$/.exec(label);if(inside){style=inside[1];label=inside[2];}if(/'{2,}/.test(label))continue;
  const left=source.slice(0,start).match(/('{2}|'{3}|'{5})$/);if(left&&source[start-left[1].length-1]!=="'"&&source.slice(end,end+left[1].length)===left[1]&&source[end+left[1].length]!=="'"){outer=left[1];if(style)continue;style=outer;start-=outer.length;end+=outer.length;}
  if(!v2222CountOutside(c,start,end))continue;const key=JSON.stringify([target[0].toLocaleUpperCase('pt')+target.slice(1),label+m[3],style]);result.push({start,end,key,raw:source.slice(start,end)});
 }return result;
}
// A native column-scope attribute is separate from an empty row. Read only
// this finite header attribute for table pairing; leave it in both endpoints
// so the independent attribute counter still has to account for its change.
function v2222LayoutCountTableScopes(source,view,c,table){
 const raw=source.slice(table.start,table.end),mask=view.slice(table.start,table.end),edits=[];
 for(const m of mask.matchAll(/^([ \t]*![ \t]+)(scope[ \t]*=[ \t]*(["'])col\3[ \t]+)(?=[^|\r\n]*\|)/gm)){
  const start=table.start+m.index+m[1].length,end=start+m[2].length,lineEnd=mask.indexOf('\n',m.index),line=raw.slice(m.index,lineEnd<0?raw.length:lineEnd),pipe=line.indexOf('|'),attrs=pipe>=0&&tableAttrs(line.slice(m[1].length,pipe),start);
  if(!attrs?.valid||attrs.attrs.filter(a=>a.key==='scope').length!==1||c.countHard.some(r=>r.start<end&&start<r.end)||source.slice(start,end)!==view.slice(start,end))continue;
  edits.push({start,end,text:''});
 }return edits;
}
function v2222LayoutCountProjection(before,after,cfg={}){
 if(typeof before!=='string'||typeof after!=='string'||before===after||v2222NonWikitext(cfg))return null;
 const edits=[[],[]],events=[],sources=[before,after],contexts=sources.map(v2222CountReadContext),emit=(kind,at)=>events.push({id:'layout-projection:'+events.length,kind,count:1,anchor:{side:'before',start:at,end:at}});
 // Keep the heading title and order exact. Only the observed marker level and
 // its surrounding horizontal spaces are projected as one heading adjustment.
 const heads=sources.map((source,i)=>[...source.matchAll(/^(={1,6})[ \t]*([^=\r\n]+?)[ \t]*\1[ \t]*\r?$/gm)].filter(h=>v2222CountOutside(contexts[i],h.index,h.index+h[0].length)));
 const paired=[];for(const a of heads[0]){const title=a[2].trim(),xs=heads[0].filter(h=>h[2].trim()===title),ys=heads[1].filter(h=>h[2].trim()===title);if(xs.length===1&&ys.length===1)paired.push([a,ys[0]]);}
 if(paired.every((p,i)=>!i||paired[i-1][1].index<p[1].index))for(const[a,b]of paired){
  if(a[0]===b[0])continue;const token='== '+a[2].trim()+' ==';for(const[side,h]of [[0,a],[1,b]])edits[side].push({start:h.index,end:h.index+h[0].length,text:token});emit('heading-layout',a.index);
 }
 // A list prefix is matched by its complete unchanged item, not by its line
 // number. Reordered or rewritten entries remain for the independent reader.
 const lists=sources.map((source,i)=>[...source.matchAll(/^([*#;:]+)([ \t]*)(\S[^\r\n]*)(\r?)$/gm)].filter(m=>v2222CountOutside(contexts[i],m.index,m.index+m[1].length+m[2].length)));
 for(const a of lists[0]){const identity=a[1]+'\n'+a[3],xs=lists[0].filter(x=>x[1]+'\n'+x[3]===identity),ys=lists[1].filter(x=>x[1]+'\n'+x[3]===identity);if(xs.length!==1||ys.length!==1||a[2]===ys[0][2])continue;const b=ys[0];for(const[side,m]of [[0,a],[1,b]])edits[side].push({start:m.index+m[1].length,end:m.index+m[1].length+m[2].length,text:' '});emit('list-prefix-spacing',a.index);}
 // Read the same literal link target, displayed letters and emphasis from
 // both endpoints. This counts an observed equivalent formatting change;
 // it does not invoke the link-repair rule or infer a replacement target.
 const links=sources.map((source,i)=>v2222LayoutCountLinks(source,contexts[i]));for(const a of links[0]){const xs=links[0].filter(x=>x.key===a.key),ys=links[1].filter(x=>x.key===a.key);if(xs.length!==1||ys.length!==1||a.raw===ys[0].raw)continue;const b=ys[0];if(edits.some((side,i)=>side.some(e=>e.start<[a,b][i].end&&[a,b][i].start<e.end)))continue;edits[0].push({start:a.start,end:a.end,text:a.raw});edits[1].push({start:b.start,end:b.end,text:a.raw});emit('equivalent-link-layout',a.start);}
 // Match the complete unchanged table after literal empty row separators and
 // finite native column scopes are removed from its pairing view. Only the
 // observed empty rows are projected. All scope changes remain to be counted;
 // every cell, other attribute, formula and reference stays byte exact.
 const tables=sources.map((source,side)=>{const prepared=v272LiteralTables(source);return prepared.tables.filter(t=>!t.nested&&t.attrs?.valid&&v2222CountOutside(contexts[side],t.start,t.start+2)).map(t=>{const rows=[];for(const m of prepared.view.slice(t.start,t.end).matchAll(/^[ \t]*\|-[ \t]*\r?\n(?=[ \t]*\|(?:-[ \t]*(?:\r?\n)|}[ \t]*(?:\r?\n|$)))/gm)){const start=t.start+m.index,end=start+m[0].length;if(!contexts[side].countHard.some(r=>r.start<end&&start<r.end))rows.push({start,end,text:''});}const raw=source.slice(t.start,t.end),scopes=v2222LayoutCountTableScopes(source,prepared.view,contexts[side],t),canonical=v24SyntaxApply(raw,[...rows,...scopes].map(r=>({...r,start:r.start-t.start,end:r.end-t.start})));return{...t,raw,canonical,rows};});});
 for(const a of tables[0]){if(!a.rows.length)continue;const xs=tables[0].filter(x=>x.canonical===a.canonical),ys=tables[1].filter(x=>!x.rows.length&&x.canonical===a.canonical);if(xs.length!==1||ys.length!==1||edits[0].some(e=>a.start<e.end&&e.start<a.end))continue;edits[0].push(...a.rows);for(const row of a.rows)emit('empty-table-row-removal',row.start);}
 if(!events.length)return null;
 for(const changes of edits)if(changes.some((a,i)=>changes.some((b,j)=>i!==j&&a.start<b.end&&b.start<a.end)))return null;
 return{before:v24SyntaxApply(before,edits[0]),after:v24SyntaxApply(after,edits[1]),events};
}
// An extra external-link closer can poison the indexed context of every later
// owner. Project only a complete, unique, literal link retained in the output;
// this read-only certificate is never used as a writer's scope permission.
function v2222LayoutCountExternalCloseProjection(before,after,cfg={}){
 if(typeof before!=='string'||typeof after!=='string'||before===after||v2222NonWikitext(cfg))return null;
 const candidates=[...before.matchAll(/\[(https?:\/\/[^\s<>\[\]{}]+)[ \t]+([^<>\[\]{}\r\n]+)\]\]/g)];if(!candidates.length||candidates.length>32)return null;
 const edits=[],events=[],targetContext=v2222CountReadContext(after),one=(source,raw)=>source.indexOf(raw)===source.lastIndexOf(raw);
 for(const m of candidates){
  const start=m.index,end=start+m[0].length;if(before[start-1]==='['||before[end]===']'||!m[2].trim()||!one(before,m[0]))continue;
  let url;try{url=new URL(m[1]);}catch{continue;}if(!['http:','https:'].includes(url.protocol)||!url.hostname)continue;
  const kept=m[0].slice(0,-1),at=after.indexOf(kept);if(at<0||!one(after,kept)||after[at-1]==='['||after[at+kept.length]===']'||!v2222CountOutside(targetContext,at,at+kept.length))continue;
  // Earlier proved literal repairs may clear the same indexed-context defect.
  // Re-read only that projected source; offsets of the original edits stay exact.
  const projected=v24SyntaxApply(before,edits),offset=start-edits.length,context=v2222CountReadContext(projected);if(!v2222CountOutside(context,offset,offset+1))continue;
  const extra=end-1;edits.push({start:extra,end:extra+1,text:''});events.push({id:'external-link-extra-close:'+extra,kind:'external-link-extra-close-removal',count:1,anchor:{side:'before',start:extra,end:extra+1},before:']',after:''});
 }
 return edits.length?{before:v24SyntaxApply(before,edits),after,events}:null;
}

// End is a verified native redirect to Fim (69301731, df70e026...). Its
// S-end and Termina caixa resolve to that same pinned native body. The
// three-letter canonical form keeps every source offset unchanged. This view
// is used only by count readers; the source and every writer stay untouched.
function v2222LayoutCountContextSource(source){
 if(typeof source!=='string'||!/(?:\{\{[ \t]*(?:S-start|s-start|Começa caixa|começa caixa)[ \t]*\}\})/.test(source)||!/(?:\{\{[ \t]*(?:End|end|S-end|s-end|Termina caixa|termina caixa)[ \t]*\}\})/.test(source))return source;
 const c=v2221LayoutContext(source),hard=v24SyntaxProtected(source).ranges,prefix=n=>/^[ \t]*$/.test(source.slice(source.lastIndexOf('\n',n.start-1)+1,n.start)),standalone=n=>prefix(n)&&/^[ \t]*(?:\r?\n|$)/.test(source.slice(n.end)),safe=n=>{const t=c.stateAt(n.start);return !t.templates.length&&!t.html.length&&!t.links.length&&!t.external.length&&!hard.some(r=>r.start<n.end&&n.start<r.end);},opens=c.nodes.filter(n=>n.depth===0&&standalone(n)&&safe(n)&&/^\{\{[ \t]*(?:S-start|s-start|Começa caixa|começa caixa)[ \t]*\}\}$/.test(source.slice(n.start,n.end)));
 if(!opens.length)return source;const edits=[];for(const n of c.nodes){
  if(n.depth!==0||!prefix(n)||!safe(n)||!opens.some(x=>x.end<=n.start))continue;const raw=source.slice(n.start,n.end),m=/^(\{\{[ \t]*)(?:End|end)[ \t]*\}\}$/.exec(raw);
  if(m&&standalone(n)){edits.push({start:n.start+m[1].length,end:n.start+m[1].length+3,text:'Fim'});continue;}
  if(!/^\{\{[ \t]*(?:S-end|s-end|Termina caixa|termina caixa)[ \t]*\}\}$/.test(raw)||standalone(n))continue;
  const end=source.indexOf('\n',n.end),lineEnd=end<0?source.length:end,tail=source.slice(n.end,lineEnd),nodes=c.nodes.filter(x=>x.depth===0&&n.end<=x.start&&x.end<=lineEnd),ranges=nodes.map(x=>({start:x.start-n.end,end:x.end-n.end,text:''}));
  if(!nodes.length||v24SyntaxApply(tail,ranges).trim()||nodes.some(x=>!v2222LayoutSister(source.slice(x.start,x.end))&&!v2221LayoutFooterKind(source.slice(x.start,x.end),{})))continue;
  edits.push({start:n.start,end:n.end,text:'|}'+raw.slice(2,-1).replace(/[^\r\n]/g,' ')+'\n'});
 }return edits.length?v24SyntaxApply(source,edits):source;
}

// Read only an observed native bibliography alias replacement. The entire
// argument tail is paired byte for byte; columns and bibliography text are not
// stripped, rewritten or used as permission for another repair.
function v2222LayoutCountBibliographyProjection(before,after,cfg={}){
 if(typeof before!=='string'||typeof after!=='string'||before===after||v2222NonWikitext(cfg))return null;
 const read=source=>{const c=v2222CountReadContext(source);return c.nodes.filter(n=>n.depth===0&&v2222CountOutside(c,n.start,n.end)).map(n=>{const raw=source.slice(n.start,n.end),key=v2222LayoutCountOwnerAlias(raw),head=/^\{\{([^{}|\r\n]+)(?=[|}])/.exec(raw);return head&&['@bibliography:begin','@bibliography:end'].includes(key)?{...n,raw,key,head:head[1],tail:raw.slice(2+head[1].length)}:null;}).filter(Boolean);};
 const a=read(before),b=read(after);if(a.length>32||b.length>32)return null;const edits=[],events=[];
 for(const x of a){const xs=a.filter(n=>n.key===x.key&&n.tail===x.tail),ys=b.filter(n=>n.key===x.key&&n.tail===x.tail);if(xs.length!==1||ys.length!==1)continue;const y=ys[0];if(x.head===y.head)continue;edits.push({start:y.start+2,end:y.start+2+y.head.length,text:x.head});events.push({id:'bibliography-native-alias:'+x.start,kind:'bibliography-template-header',count:1,anchor:{side:'before',start:x.start+2,end:x.start+2+x.head.length},before:x.head,after:y.head});}
 return edits.length?{before,after:v24SyntaxApply(after,edits),events}:null;
}

// Read the exact observed repair of one missing internal-link closer. A
// complete unique target and label must remain unchanged in the output.
function v2222LayoutCountInternalCloseProjection(before,after,cfg={}){
 if(typeof before!=='string'||typeof after!=='string'||before===after||v2222NonWikitext(cfg))return null;
 const candidates=[...before.matchAll(/\[\[([^\[\]{}<>:\r\n]+)\](?!\])/g)];if(!candidates.length||candidates.length>32)return null;
 const edits=[],events=[],targetContext=v2222CountReadContext(after);
 for(const m of candidates){const start=m.index,end=start+m[0].length,kept=m[0]+']',prefix=before.slice(Math.max(0,start-32),start),suffix=before.slice(end,end+32),targets=[];let at=-1;while(targets.length<33&&(at=after.indexOf(kept,at+1))>=0)targets.push(at);const matches=targets.filter(p=>(targets.length===1||after.slice(Math.max(0,p-prefix.length),p)===prefix&&after.slice(p+kept.length,p+kept.length+suffix.length)===suffix)&&after[p-1]!=='['&&after[p+kept.length]!==']'&&v2222CountOutside(targetContext,p,p+kept.length));if(before[start-1]==='['||!m[1].split('|')[0].trim()||m[1].split('|').length>2||candidates.filter(x=>x[0]===m[0]).length!==1||targets.length>32||matches.length!==1)continue;
  const source=v24SyntaxApply(before,edits),offset=start+edits.length,c=v2222CountReadContext(source);if(!v2222CountOutside(c,offset,offset+1))continue;edits.push({start:end,end,text:']'});events.push({id:'internal-link-missing-close:'+end,kind:'internal-link-missing-close',count:1,anchor:{side:'before',start:end,end},before:'',after:']'});}
 return edits.length?{before:v24SyntaxApply(before,edits),after,events}:null;
}
// An image-only indented source line may become a normal standalone image.
// Compare native filenames, literal captions and finite option aliases at both
// endpoints; removing the indent in this count view grants no writer access.
function v2222LayoutCountImageIndentProjection(before,after,cfg={}){
 if(typeof before!=='string'||typeof after!=='string'||before===after||v2222NonWikitext(cfg))return null;
 const read=raw=>{if(/[{}<>\r\n]/.test(raw)||!raw.startsWith('[[')||!raw.endsWith(']]')||v24SyntaxScan(raw).issues.length)return null;const parts=v24SyntaxParts(raw.slice(2,-2)),head=parts&&/^\s*(?:Ficheiro|Imagem|Arquivo|File|Image)\s*:([^\[\]{}<>|\r\n]+)$/i.exec(parts[0].text);if(!head||!head[1].trim())return null;return{raw,parts,key:'@image:'+head[1].replace(/_/g,' ').trim().normalize('NFC')};},same=(x,y)=>x.parts.length===y.parts.length&&x.parts.slice(1).every((p,i)=>p.text===y.parts[i+1].text||p.text.trim()==='thumb'&&y.parts[i+1].text.trim()==='miniatura'||/^upright=\d+(?:[.,]\d+)?$/.test(p.text.trim())&&y.parts[i+1].text.trim()==='superiordireito='+p.text.trim().slice(8));
 const c=v2222CountReadContext(before),targets=v2222CountIndependentOwners(after,cfg).filter(n=>n.image),lines=[];for(const m of before.matchAll(/^([ \t]+)(\[\[(?:Ficheiro|Imagem|Arquivo|File|Image)\s*:[^\r\n]*\]\])([ \t]*)(?=\r?$)/gmi)){const image=read(m[2]);if(image)lines.push({m,image,start:m.index+m[1].length,end:m.index+m[1].length+m[2].length});}if(lines.length>32)return null;const edits=[],events=[];
 for(const row of lines){const{m,image,start,end}=row,hard=c.countHard.filter(r=>r.start<end&&start<r.end),state=c.stateAt(start);if(hard.length!==1||hard[0].kind!=='preformatted'||['templates','html','tables','links','external'].some(k=>state[k].length)||lines.filter(x=>x.image.key===image.key).length!==1)continue;const matches=targets.filter(n=>n.key===image.key),target=matches.length===1&&matches[0],y=target&&read(target.raw);if(!y||!same(image,y)||target.start!==after.lastIndexOf('\n',target.start-1)+1||!/^\s*(?:\r?\n|$)/.test(after.slice(target.end)))continue;edits.push({start:m.index,end:start,text:''});events.push({id:'standalone-image-indent:'+m.index,kind:'standalone-image-indent-removal',count:1,anchor:{side:'before',start:m.index,end:start},before:m[1],after:''});}
 return edits.length?{before:v24SyntaxApply(before,edits),after,events}:null;
}
// These finite native title effects are metadata, not bibliography entries.
// The payload and every call remain literal; this only bounds a count owner.
function v2222LayoutCountTitleMetadata(raw){
 const alias=v2222LayoutCountOwnerAlias(raw);if(alias?.startsWith('@displaytitle:'))return true;
 const p=v2221LayoutFields(raw);return !!p&&!p.fields.length&&v2221LayoutNamed(raw,['Título em itálico']);
}
// Verified zero-argument status/navigation calls are standalone metadata,
// never entries belonging to the preceding bibliography or resource list.
function v2222LayoutCountFooterMetadata(raw){
 if(v2222LayoutCountTitleMetadata(raw))return true;
 const p=v2221LayoutFields(raw);if(!p)return false;
 if(!p.fields.length)return v2221LayoutNamed(raw,['Artigo destacado','Subdivisões do Reino Unido','Membros da Open Handset Alliance']);
 // The pinned native shell renders contiguous literal template slots 1–30.
 // Styled, dynamic, missing or non-template values keep their old boundary.
 return v2221LayoutNamed(raw,['Bloco de navegação'])&&p.fields.length<=30&&p.fields.every((f,i)=>f.key===String(i+1)&&f.value.trim()&&!/[{}<>\[\]|:#\r\n]/.test(f.value));
}
