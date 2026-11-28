// Finite native readers. Unknown fields and unproved values stay in place.
const V2222_IB = V222_CATALOG.v2222?.infoboxes || {keyRules:[],nativePins:{},registry:{records:[]},civilFlagFields:{},femaleOccupations:{}};

function v2222InfoboxScope(source,cfg={}) {
 return v2221FocusedScope(source,cfg)&&cfg.infoboxes!==false&&!cfg.sectionOnly&&!cfg.discussionPage;
}
function v2222InfoboxUnique(parsed,key) {const rows=parsed.fields.filter(f=>f.key===key&&!f.positional);return rows.length===1?rows[0]:null;}
function v2222InfoboxCanonicalOwner(owner) {const row=(V2222_IB.nativeOwnerAliases||[]).find(r=>r.owner===owner);if(!row)return owner;return v2221InfoboxPin(row.source)&&v2221InfoboxPin(row.target)&&row.sourceText==='#REDIRECIONAMENTO [[Predefinição:'+row.to+']]'&&v2221InfoboxSamePin(row.target,V2222_IB.nativePins['Predefinição:'+row.to])?row.to:owner;}
function v2222InfoboxPin(owner) {return V2222_IB.nativePins['Predefinição:'+v2222InfoboxCanonicalOwner(owner)]||null;}
function v2222InfoboxProgramView(value) {const parsed=v24SyntaxProtected(value),literal=new Set(['comment','nowiki','pre','source','syntaxhighlight','math','chem']);if(parsed.unclosed.some(r=>literal.has(r.kind)))return null;const ranges=parsed.ranges.filter(r=>literal.has(r.kind));for(const range of ranges){if(range.kind==='comment')continue;const tag=v24SyntaxTag(value,range.start);if(!tag||tag.attrs.trim())return null;}return v24SyntaxMaskRanges(value,ranges);}
function v2222InfoboxSafeValue(value,kind='text',depth=0) {
 if(typeof value!=='string'||value.length>32768||depth>8||/[\uE000-\uF8FF]/u.test(value))return false;
 const refs=v219NativeReferenceObserver(value);if(refs.unclosed.length||refs.empties.length||refs.refs.some(r=>!r.valid||r.typo||r.container))return false;
 const view=v2222InfoboxProgramView(value);if(view===null)return false;const syntax=v24SyntaxScan(view),programs=v24SyntaxTemplates(view);
 if(syntax.issues.length||programs.unclosed.length)return false;
 if(kind==='module')return v2222InfoboxModuleSafe(value,depth+1);
 if(kind==='file')return /^\s*[^:{}\[\]<>|\r\n]+\.(?:jpe?g|png|svg|gif|webp|tiff?|pdf|djvu)\s*$/i.test(value);
 if(kind==='number')return /^\s*\d+(?:[.,]\d+)?\s*$/.test(value);
 if(kind==='language')return /^\s*(?:[a-z]{2,3}(?:-[a-z0-9]{2,8})*)?\s*$/i.test(value);
 if(kind==='size')return /^\s*(?:[1-9]\d{0,3})(?:x[1-9]\d{0,3})?px\s*$/.test(value);
 for(let at=view.indexOf('<');at>=0;){const tag=v24SyntaxTag(view,at);if(!tag)return false;const attrs=v24SyntaxAttrs(tag.attrs);if(!attrs||!['ref','br','small','sup','sub','b','i','em','strong','cite','span'].includes(tag.name))return false;if(tag.name==='ref'){if(Object.keys(attrs).some(k=>!['name','group'].includes(k))||!v24SyntaxLiteralIdentity(attrs))return false;}else if(tag.name==='span'){if(Object.keys(attrs).some(k=>!['lang','dir'].includes(k))||attrs.lang&&!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(attrs.lang)||attrs.dir&&!['ltr','rtl'].includes(attrs.dir))return false;}else if(Object.keys(attrs).length)return false;at=view.indexOf('<',tag.end);}
 const nodes=programs.nodes;if(nodes.length>256)return false;
 for(const node of nodes)if(node.size!==2||!v2222InfoboxKnownProgram(value.slice(node.start,node.end),depth+1))return false;
 return true;
}
function v2222InfoboxKnownProgram(raw,depth=0) {
 if(depth>8)return false;const p=v2221InfoboxRead(raw),name=parsedTemplate(raw).name;if(['!','='].includes(name))return raw==='{{'+name+'}}';
 if(/^\{\{formatnum:/i.test(raw)||name==='séc')return v2111ReferenceFreeTemplate(raw);
 const country=v222FlagKey(raw);if(country&&V222_INFERENCE_FLAG_CALLS.has(country))return true;
 if(!p||new Set(p.fields.map(f=>f.key)).size!==p.fields.length)return false;
 const inline=['dni','dataext','morte','ubl','unbulleted list','hlist','lista simples','plainlist','small','smaller','sup','nowrap','nobreak','lang','langx','url','isbn'];if(inline.includes(name)&&!v2221InfoboxPin(V2222_IB.inlineProgramPins?.['Predefinição:'+p.title]))return false;
 if(['dni','dataext','morte'].includes(name))return v2222InfoboxReadDate(raw)!==null;
 if(['ubl','unbulleted list','hlist'].includes(name))return p.fields.length<=128&&p.fields.some(f=>f.value.trim())&&p.fields.every(f=>/^[1-9]\d*$/.test(f.key));
 if(['lista simples','plainlist'].includes(name))return p.fields.length===1&&p.fields[0].key==='1'&&!!p.fields[0].value.trim();
 if(['small','smaller','sup','nowrap','nobreak'].includes(name))return p.fields.length===1&&p.fields[0].key==='1'&&!!p.fields[0].value.trim();
 if(['lang','langx'].includes(name)){const fields=new Map(p.fields.map(f=>[f.key,f.value.trim()]));return p.fields.length===2&&fields.has('2')&&['pt','en','es','fr','de','it','ru','uk','he','tr','ja','zh','ko','ar','vi','th','nl','da','sv','no','fi','la','el','fa','pl','ca'].includes(fields.get('1'));}
 if(name==='url'){const id=p.fields.find(f=>f.key==='1');if(!id||!p.fields.every(f=>['1','2'].includes(f.key)))return false;const value=id.value.trim();if(!value||/[\s<>{}|]/.test(value))return false;try{const url=new URL(value.startsWith('//')?'https:'+value:/^https?:\/\//i.test(value)?value:'https://'+value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password&&url.hostname.includes('.');}catch{return false;}}
 if(name==='isbn'){if(p.fields.length!==1||p.fields[0].key!=='1')return false;const id=p.fields[0].value.replace(/[- ]/g,'');if(/^\d{9}[\dX]$/i.test(id))return Array.from(id).reduce((s,c,i)=>s+(10-i)*(c.toUpperCase()==='X'?10:Number(c)),0)%11===0;if(/^\d{13}$/.test(id))return Array.from(id).reduce((s,c,i)=>s+Number(c)*(i%2?3:1),0)%10===0;return false;}
 if(v219NativeCitationStateInterface(raw)){const parsed=parsedTemplate(raw);return p.fields.every(f=>!f.positional&&nativeCitationAccepts(parsed,f.key))&&p.fields.some(f=>['título','titulo','title'].includes(f.key)&&f.value.trim());}
 return false;
}
function v2222InfoboxReadDate(value,target) {
 const core=v2221InfoboxTrim(value),p=v2221InfoboxRead(core);if(!p||!['Dni','DataExt','Morte'].includes(p.title))return null;
 if(target==='nascimento_data'&&p.title==='Morte'||target==='morte_data'&&p.title==='Dni')return null;
 const fields=new Map();for(const f of p.fields){if(fields.has(f.key))return null;fields.set(f.key,f.value.trim());}
 const allowed=p.title==='DataExt'?['1','2','3','4','lang']:p.title==='Dni'?['1','2','3','4','lang','nowrap','nocat']:['1','2','3','4','5','6','lang','nowrap','nwrap','nocat','cat'];if([...fields].some(([k,v])=>!allowed.includes(k)||/[{}<>\r\n]/.test(v)))return null;
 const nums=['1','2','3'].map(k=>fields.get(k));if(!nums.every(v=>/^\d+$/.test(v||''))||!validDate(...nums.map(Number)))return null;
 if(p.title==='Morte'&&fields.has('6')){const birth=['4','5','6'].map(k=>fields.get(k));if(!birth.every(v=>/^\d+$/.test(v||''))||!validDate(...birth.map(Number)))return null;}
 else if(fields.has('5')||fields.has('6')||fields.has('4')&&!['si','sem idade',...(p.title==='DataExt'?['idade']:[])].includes(norm(fields.get('4'))))return null;
 return value;
}
function v2222InfoboxForeignValue(field,value,positional) {
 const ordinary=v2221InfoboxValue(field,value,positional);if(ordinary.valid||field.transform!=='date-ymd-to-dmy')return ordinary;
 const native=v2222InfoboxReadDate(value,field.target);return native===null?ordinary:{valid:true,value:native,existingNativeDatePreserved:true};
}
function v2222InfoboxForeignCandidate(raw,record) {
 const parsed=v2221InfoboxRead(raw);if(!parsed||!v2221InfoboxPreconditions(parsed,record).valid||parsed.fields.some(f=>f.positional)||new Set(parsed.fields.map(f=>f.key)).size!==parsed.fields.length)return null;
 const targets=new Set(),roles=new Set(),edits=[];
 for(const f of parsed.fields){const mapping=record.fields[f.key];if(!mapping||targets.has(mapping.target)||roles.has(mapping.evidence.role))return null;targets.add(mapping.target);roles.add(mapping.evidence.role);
  if(!v2222InfoboxSafeValue(f.value,/^module[2-6]?$/.test(f.key)?'module':f.key==='native_name_lang'?'language':'text'))return null;
  if(/^module[2-6]?$/.test(f.key)&&f.value.trim()&&!v2222InfoboxModuleSafe(f.value))return null;
  const value=v2222InfoboxForeignValue(mapping,f.value,false);if(!value.valid)return null;
  if(f.key!==mapping.target)edits.push({start:f.keyStart,end:f.keyEnd,text:mapping.target,count:1});
  if(value.value!==f.value)edits.push({start:f.valueStart,end:f.valueEnd,text:value.value,count:1});
 }
 edits.push({start:parsed.headerStart,end:parsed.headerEnd,text:v2221InfoboxTitle(record.target.title),count:1});
 return {text:v24SyntaxApply(raw,edits),count:edits.reduce((n,e)=>n+e.count,0),record:record.id};
}
function v2222InfoboxForeignPlan(source,cfg={}) {
 const edits=[];if(!v2222InfoboxScope(source,cfg)||cfg.multilingual===false||cfg.automaticParameterNames===false)return v222EditsPlan(source,edits);
 const catalog=v2221InfoboxPipelineCatalog(cfg);if(!catalog)return v222EditsPlan(source,edits);
 for(const node of v2221InfoboxPipelineNodes(source,cfg)){
  if(edits.some(e=>e.start<=node.start&&node.end<=e.end))continue;
  if(!v2222InfoboxReferenceRenderers(source,node.raw))continue;
  const context=v24SyntaxContext(v222Protected(source).view,node.start);if([context.templates,context.html,context.tables,context.links,context.external].some(a=>a.length))continue;
  const resolved=v2221InfoboxResolve(node.raw,catalog,v2221InfoboxPipelineContext(cfg,false));if(resolved.status!=='ready'||resolved.records.length!==1)continue;
  const record=resolved.records[0];if(!['en-person-explicit-subset','en-scientist-explicit-subset','en-football-literal-subset'].includes(record.id))continue;
  const result=record.id==='en-football-literal-subset'?v2222InfoboxForeignFootball(node.raw,record,cfg):v2222InfoboxForeignCandidate(node.raw,record);if(result&&result.text!==node.raw)edits.push({start:node.start,end:node.end,text:result.text,count:result.count,kind:'source-bound-person-fields',proof:{record:result.record,sourceHash:v24SyntaxHash(node.raw)}});
 }
 return v222EditsPlan(source,edits);
}
function v2222InfoboxForeignFootball(raw,record,cfg={}) {
 const p=v2221InfoboxRead(raw);if(!p||!v2221InfoboxPreconditions(p,record).valid||p.fields.some(f=>f.positional)||new Set(p.fields.map(f=>f.key)).size!==p.fields.length)return null;
 const edits=[],targets=new Set(),roles=new Set();let count=1;const career=/^(?:(?:years|clubs|caps|goals|youthyears|youthclubs|nationalyears|nationalteam|nationalcaps|nationalgoals)[1-9]\d?|club-update|nationalteam-update)$/;
 for(const f of p.fields){if(career.test(f.key))continue;const map=record.fields[f.key];if(!map||targets.has(map.target)||roles.has(map.evidence.role)||!v2222InfoboxSafeValue(f.value))return null;targets.add(map.target);roles.add(map.evidence.role);const value=v2222InfoboxForeignValue(map,f.value,false);if(!value.valid)return null;if(f.key!==map.target){edits.push({start:f.keyStart,end:f.keyEnd,text:map.target});count++;}if(value.value!==f.value){edits.push({start:f.valueStart,end:f.valueEnd,text:value.value});count++;}}
 edits.push({start:p.headerStart,end:p.headerEnd,text:v2221InfoboxTitle(record.target.title)});const native=v24SyntaxApply(raw,edits),careerPlan=v2222InfoboxCareerCall(native,cfg),text=careerPlan?.text||native,parsed=v2221InfoboxRead(text);
 if(!parsed||parsed.fields.some(f=>career.test(f.key)))return null;
 return {text,count:count+(careerPlan?.count||0),record:record.id};
}
function v2222InfoboxFormat(raw,cfg={}) {
 if(cfg.infoboxAlignment===false||cfg.alignInfoboxParameters===false||cfg.automaticFieldSyntax===false)return null;
 const p=v2221InfoboxRead(raw);if(!p||p.fields.some(f=>f.positional)||!p.fields.length)return null;
 const profile=INFOBOX_CATALOG[nameOf(p.title)];if(!profile||v2221InfoboxTitle(profile.title)!==p.title)return null;
 const width=Math.max(22,...p.fields.map(f=>Array.from(f.key).length+1));if(width>80)return null;
 const eol=raw.includes('\r\n')?'\r\n':'\n',parts=p.fields.map(f=>'|'+f.key+' '.repeat(width-Array.from(f.key).length)+'='+v2221FocusedInfoboxSpacingValue(f.value)+eol);
 const text='{{'+p.literal+eol+parts.join('')+'}}';if(text===raw)return null;
 const again=v2221InfoboxRead(text);if(!again||JSON.stringify(again.fields.map(f=>[f.key,f.value.trim()]))!==JSON.stringify(p.fields.map(f=>[f.key,f.value.trim()])))return null;
 return {text,count:Math.max(1,p.fields.filter((f,i)=>raw.slice(f.start-1,f.end).replace(/\r?\n[ \t]*$/,'')!==parts[i].replace(/\r?\n$/,'')).length)};
}
function v2222InfoboxReferenceRenderers(source,value) {
 const refs=v219NativeReferenceObserver(value);if(!refs.refs.length)return true;
 const rows=v2215ReferenceCollectorRows(source).rows;return refs.refs.every(r=>rows.some(row=>!row.typo&&(r.group===''?(row.kind==='combined'||row.kind==='references'&&row.group===''):row.group===r.group)));
}
function v2222InfoboxForeignReferenceGuard(raw,source) {const p=v2221InfoboxRead(raw);if(!p||v2222InfoboxReferenceRenderers(source,raw))return true;const keys=V2222_IB.foreignReferenceGuardKeys?.[p.title];return !keys||!p.fields.some(f=>keys.includes(f.key)||p.title==='Infobox football biography'&&/^(?:years|clubs|caps|goals|youthyears|youthclubs|nationalyears|nationalteam|nationalcaps|nationalgoals)\d+$/.test(f.key));}
function v2222InfoboxForeignStructuralGuard(raw,source=raw,cfg={}) {const p=v2221InfoboxRead(raw);if(!p)return true;const native=(V2222_IB.registry?.records||[]).find(r=>r.mode==='native-repair'&&v2221InfoboxTitle(r.source.title)===v2222InfoboxCanonicalOwner(p.title));if(native&&!p.fields.every(f=>!native.fields[f.key]||v2222InfoboxLegacyMapAllowed(source,{name:p.title,fields:p.fields},{from:f.key,to:native.fields[f.key].target},cfg)))return false;if(!['Infobox person','Infobox scientist','Infobox football biography'].includes(p.title))return true;return p.fields.every(f=>v2222InfoboxSafeValue(f.value,/^module[2-6]?$/.test(f.key)?'module':f.key==='native_name_lang'?'language':'text'));}
function v2222InfoboxLegacyReferenceProof(source,box,mapping,value,cfg={}) {
 if(cfg.namespaceNumber!==0||typeof value!=='string'||!v2222InfoboxSafeValue(value))return null;
 const named=v2221InfoboxTitle(box.name),owner=v2222InfoboxCanonicalOwner((V2222_IB.nativeOwnerAliases||[]).find(r=>nameOf(r.owner)===nameOf(named))?.owner||named);if(owner!=='Info/Biografia')return null;
 const prior=V221_INFOBOX_MAPPINGS.find(r=>nameOf(r.owner)===nameOf(named)&&r.from===mapping.from&&r.to===mapping.to),consumer=(V2222_IB.legacyReferenceConsumers||[]).find(r=>r.key===mapping.to);if(!prior||!consumer||!v2221InfoboxSamePin(consumer.native,v2222InfoboxPin(owner)))return null;
 const refs=v219NativeReferenceObserver(value);if(!refs.refs.length||refs.unclosed.length||refs.empties.length||refs.helpers.length||refs.refs.some(r=>!r.valid||r.group||r.typo||r.container))return null;
 for(const ref of refs.refs)if(ref.body===null&&!refs.refs.some(d=>d.body!==null&&d.body.trim()&&d.attrs?.name&&d.attrs.name===ref.attrs?.name&&d.group===ref.group))return null;
 return {owner,sourceOwner:named,from:prior.from,to:prior.to,native:consumer.native,reader:consumer.reader,superscript:consumer.superscript===true};
}
function v2222InfoboxLegacyMapAllowed(source,box,mapping,cfg={}) {
 const named=v2221InfoboxTitle(box.name),alias=(V2222_IB.nativeOwnerAliases||[]).find(r=>nameOf(r.owner)===nameOf(named)),owner=v2222InfoboxCanonicalOwner(alias?.owner||named),all=(V2222_IB.keyRules||[]).filter(r=>nameOf(r.owner)===nameOf(owner)),rules=all.filter(r=>r.target===mapping.to),field=box.fields.find(f=>f.key===mapping.from),rule=all.find(r=>r.source===mapping.from),readers=V2222_IB.nativeBiographyReaderKeys,bio=nameOf(owner)===nameOf('Info/Biografia'),legacyRef=field&&v2222InfoboxLegacyReferenceProof(source,box,mapping,field.value,cfg);
 if(field&&bio&&Array.isArray(readers)&&readers.includes(mapping.to)&&!readers.includes(mapping.from)&&(!v2222InfoboxSafeValue(field.value,/^módulo[2-6]?$/.test(mapping.to)?'module':'text')||!legacyRef&&!v2222InfoboxReferenceRenderers(source,field.value)))return false;
 if(rule&&field){
  if(mapping.to!==rule.target||box.fields.some(f=>f!==field&&rule.conflicts.includes(f.key)))return false;
  if(bio&&rule.source==='birth_name'&&v2221InfoboxPipelineContext(cfg,false).sourceWiki!=='en')return false;
  if(bio&&['works','credits','notable_works'].includes(rule.source)&&box.fields.some(f=>f!==field&&['works','credits','notable_works','label_name'].includes(f.key)&&f.value.trim()))return false;
  if(rule.kind==='locality'&&!/^\s*(?:\[\[[^\[\]{}|,;\r\n]+(?:\|[^\[\]{}|,;\r\n]+)?\]\]|[^\[\]{}|,;\r\n<>]+)\s*$/.test(field.value))return false;
 }
 if(rules.some(r=>r.source!==mapping.from&&box.fields.some(f=>f.key===r.source)))return false;
 const sameReader=bio&&mapping.from==='website'&&mapping.to==='site'&&readers?.includes('website')&&readers.includes('site');
 return !field||!rule||sameReader||v2222InfoboxSafeValue(field.value,rule.kind)&&(legacyRef||v2222InfoboxReferenceRenderers(source,field.value));
}
function v2222InfoboxNativeCall(raw,source,cfg={},depth=0,guardReferences=false) {
 if(depth>8)return null;const p=v2221InfoboxRead(raw);if(!p||!v2222InfoboxPin(p.title))return null;
 const edits=[];let count=0;const add=(a,b,text,n=1)=>{if(raw.slice(a,b)!==text&&!edits.some(e=>a<e.end&&e.start<b)){edits.push({start:a,end:b,text});count+=n;}};
 if(cfg.automaticParameterNames!==false&&cfg.multilingual!==false)for(const rule of V2222_IB.keyRules||[]){
  if(rule.owner!==v2222InfoboxCanonicalOwner(p.title)||!v2221InfoboxPin(rule.native))continue;
  const f=v2222InfoboxUnique(p,rule.source);if(!f||p.fields.some(other=>other!==f&&rule.conflicts.includes(other.key))||!v2222InfoboxSafeValue(f.value,rule.kind))continue;
  if((V2222_IB.keyRules||[]).some(other=>other!==rule&&other.owner===rule.owner&&other.target===rule.target&&p.fields.some(field=>field.key===other.source)))continue;
  if(guardReferences&&!v2222InfoboxReferenceRenderers(source,f.value))continue;
  if(rule.owner==='Info/Biografia'&&rule.source==='birth_name'&&v2221InfoboxPipelineContext(cfg,false).sourceWiki!=='en')continue;
  if(rule.kind==='locality'&&!/^\s*(?:\[\[[^\[\]{}|,;\r\n]+(?:\|[^\[\]{}|,;\r\n]+)?\]\]|[^\[\]{}|,;\r\n<>]+)\s*$/.test(f.value))continue;
  if(rule.kind==='module'&&v2222InfoboxUnique(p,rule.source)&&v2221InfoboxTrim(f.value)&&!v2222InfoboxModuleSafe(f.value))continue;
  if(p.title==='Info/Biografia'&&['works','credits','notable_works'].includes(f.key)&&p.fields.some(other=>other!==f&&['works','credits','notable_works','label_name'].includes(other.key)&&other.value.trim()))continue;
  add(f.keyStart,f.keyEnd,rule.target);
 }
 // This native reader takes a template identifier, not a rendered country.
 if(p.title==='Info/Aeroporto'&&cfg.automaticParameterNames!==false&&cfg.automaticInfoboxValues!==false){const f=v2222InfoboxUnique(p,'pais');if(f&&!p.fields.some(x=>x.key==='país')){const m=/^\s*\{\{([A-Z]{3})\}\}\s*$/.exec(f.value);if(m&&(V2222_IB.airportCountryCalls||[]).includes(m[1])){add(f.keyStart,f.keyEnd,'país');add(f.valueStart,f.valueEnd,' '+m[1]);}}}
 // A labelled observation keeps the chip distinct from the CPU field.
 if(p.title==='Info/Computador'&&cfg.automaticBiographyFields!==false&&cfg.automaticParameterNames!==false){const f=v2222InfoboxUnique(p,'soc'),obs=p.fields.filter(x=>x.key==='obs');if(f&&f.value.trim()&&obs.length<=1&&!obs.some(x=>x.value.trim())&&v2222InfoboxSafeValue(f.value)&&(!guardReferences||v2222InfoboxReferenceRenderers(source,f.value))){if(obs.length){add(obs[0].valueStart,obs[0].valueEnd,' SoC: '+f.value.trim());add(f.start-1,f.end,'');}else{add(f.keyStart,f.keyEnd,'obs');add(f.valueStart,f.valueEnd,' SoC: '+f.value.trim(),1);}}}
 for(const f of p.fields){if(edits.some(e=>f.valueStart<e.end&&e.start<f.valueEnd))continue;const local=[],nodes=v24SyntaxTemplates(v2221FocusedValueView(f.value)).nodes.filter(n=>n.size===2);for(const n of nodes){if(nodes.some(q=>q!==n&&q.start<n.start&&n.end<q.end)||v219NativeReferenceObserver(f.value).refs.some(q=>q.start<=n.start&&n.end<=q.end))continue;const next=v2222InfoboxNativeCall(f.value.slice(n.start,n.end),source,cfg,depth+1,guardReferences);if(next){local.push({start:n.start,end:n.end,text:next.text});count+=next.count;}}if(local.length)add(f.valueStart,f.valueEnd,v24SyntaxApply(f.value,local),0);}
 if(!edits.length)return null;const text=v24SyntaxApply(raw,edits);return {text,count};
}
function v2222InfoboxModuleSafe(value,depth=0){
 if(depth>8)return false;
 const view=v2222InfoboxProgramView(value);if(view===null)return false;const parsed=v24SyntaxTemplates(view);if(parsed.unclosed.length||parsed.nodes.some(n=>n.size!==2))return false;const nodes=parsed.nodes,top=nodes.filter(n=>!nodes.some(q=>q!==n&&q.start<n.start&&n.end<q.end));
 if(!top.length)return !value.trim();
 for(const n of top){const p=v2221InfoboxRead(value.slice(n.start,n.end));if(!p||p.fields.some(f=>f.positional)||new Set(p.fields.map(f=>f.key)).size!==p.fields.length||!v2222InfoboxPin(p.title)||v2222InfoboxCanonicalOwner(p.title)!=='Info/Biografia')return false;const keys=V2222_IB.nativeBiographyReaderKeys;if(!Array.isArray(keys))return false;const embed=p.fields.filter(f=>['child','embed'].includes(f.key));if(embed.length!==1||!['sim','s','yes','y'].includes(norm(embed[0].value)))return false;for(const f of p.fields){if(!keys.includes(f.key)||!v2222InfoboxSafeValue(f.value,/^módulo[2-6]?$/.test(f.key)?'module':'text',depth+1))return false;}}
 return !v24SyntaxMaskRanges(value,top).trim();
}
function v2222InfoboxNativePlan(source,cfg={}) {
 const edits=[];if(!v2222InfoboxScope(source,cfg))return v222EditsPlan(source,edits);
 const nodes=v2221FocusedNodes(source,cfg);for(const n of nodes){if(nodes.some(q=>q!==n&&q.start<n.start&&n.end<q.end)||edits.some(q=>q.start<=n.start&&n.end<=q.end))continue;const raw=source.slice(n.start,n.end),p=v2221InfoboxRead(raw);if(!p)continue;const fixed=v2222InfoboxNativeCall(raw,source,cfg,0,true),formatted=v2222InfoboxFormat(fixed?.text||raw,cfg);const text=formatted?.text||fixed?.text||raw;if(text!==raw)edits.push({start:n.start,end:n.end,text,count:(fixed?.count||0)+(formatted?.count||0),kind:'native-reader-field-repair',proof:{owner:p.title,native:v2222InfoboxPin(p.title),sourceHash:v24SyntaxHash(raw)}});}
 return v222EditsPlan(source,edits);
}
function v2222InfoboxGenderPlan(source,cfg={}) {
 const edits=[];if(!v2222InfoboxScope(source,cfg)||cfg.automaticBiographyFields===false||v2221FocusedBiographyConflict(source,cfg))return v222EditsPlan(source,edits);
 const box=principalBiographyBox(source,cfg);if(!box||!biographyIsWoman(source,cfg,box))return v222EditsPlan(source,edits);
 const p=v2221InfoboxRead(box.node?source.slice(box.node.start,box.node.end):'');if(!p)return v222EditsPlan(source,edits);
 for(const f of p.fields){if(!['ocupação','ocupacao','profissão','profissao','occupation'].includes(f.key)||p.fields.filter(q=>q.key===f.key).length!==1||!v219NativeOccupationFieldAllowed(source.slice(box.node.start,box.node.end),f.key))continue;
  const raw=f.value,view=v2221FocusedValueView(raw,true),ranges=[...v24SyntaxTemplates(view).nodes,...v219WholeQuotedCodeRanges(raw)];const changes=[];
  const links=[...view.matchAll(/\[\[([^\[\]{}|\r\n]+)(?:\|([^\[\]{}\r\n]+))?\]\]/g)];
  for(const m of links){if(ranges.some(r=>r.start<=m.index&&m.index<r.end)||/^[\p{L}\p{M}]/u.test(view.slice(m.index+m[0].length)))continue;const label=m[2]===undefined?m[1]:m[2],lower=label.toLocaleLowerCase('pt'),to=V2222_IB.femaleOccupations[lower];if(!to||to===lower)continue;const shown=label[0]===label[0].toLocaleUpperCase('pt')?to[0].toLocaleUpperCase('pt')+to.slice(1):to;changes.push({start:m.index,end:m.index+m[0].length,text:'[['+m[1]+'|'+shown+']]'});ranges.push({start:m.index,end:m.index+m[0].length});}
  const masked=v24SyntaxMaskRanges(view,[...ranges,...links.map(m=>({start:m.index,end:m.index+m[0].length}))]);for(const m of masked.matchAll(/(?:^|[,;]|\be\b|<br\s*\/?\s*>|\n)([ \t]*)([\p{L}\p{M}]+)([ \t]*)(?=$|[,;]|\be\b|<br\s*\/?\s*>|\n)/gu)){const word=m[2],lower=word.toLocaleLowerCase('pt'),to=V2222_IB.femaleOccupations[lower];if(!to||to===lower)continue;const text=word[0]===word[0].toLocaleUpperCase('pt')?to[0].toLocaleUpperCase('pt')+to.slice(1):to,start=m.index+m[0].length-m[3].length-word.length;changes.push({start,end:start+word.length,text});}
  if(changes.length)edits.push({start:box.node.start+f.valueStart,end:box.node.start+f.valueEnd,text:v24SyntaxApply(raw,changes),count:changes.length,kind:'confirmed-female-occupation',proof:{sourceHash:v24SyntaxHash(source),owner:p.title,key:f.key}});
 }
 return v222EditsPlan(source,edits);
}
function v2222InfoboxCareerCall(raw,cfg={},referenceSource=null) {
 const p=v2221InfoboxRead(raw);if(!p||p.fields.some(f=>f.positional)||new Set(p.fields.map(f=>f.key)).size!==p.fields.length)return null;
 const office=p.title==='Info/Titular de cargo',football=p.title==='Info/Futebolista';if(!office&&!football)return null;
 const readable=f=>!f||referenceSource===null||v2222InfoboxReferenceRenderers(referenceSource,f.value),edits=[];let count=0;const add=(f,key,value)=>{if(!readable(f))return;if(key!==f.key){edits.push({start:f.keyStart,end:f.keyEnd,text:key});count++;}if(value!==undefined&&value!==f.value){edits.push({start:f.valueStart,end:f.valueEnd,text:value});count++;}};
 if(office){for(let i=0;i<=8;i++){const suffix=i===0?'':String(i),start=v2222InfoboxUnique(p,'term_start'+suffix),end=v2222InfoboxUnique(p,'term_end'+suffix),role=v2222InfoboxUnique(p,'office'+suffix),nativeIndex=i<=1?'':String(i),dest='mandato'+nativeIndex;
   if(i===1&&p.fields.some(f=>['office','term_start','term_end','predecessor','successor'].includes(f.key)))continue;
   if(start&&end&&readable(start)&&readable(end)&&start.value.trim()&&end.value.trim()&&v2222InfoboxSafeValue(start.value)&&v2222InfoboxSafeValue(end.value)&&!p.fields.some(f=>[dest,'mandato_início'+nativeIndex,'mandato_fim'+nativeIndex,...(i<=1?['mandato1','mandato_inicio','mandato_final']:[])].includes(f.key))){add(start,dest,start.value.trim()+' – '+end.value.trim());edits.push({start:end.start-1,end:end.end,text:''});count++;}
   else if(start&&!end&&i<=1&&!p.fields.some(f=>['mandato','mandato1','mandato_início'].includes(f.key))&&v2222InfoboxSafeValue(start.value))add(start,'mandato_início');
   for(const [src,target,conf]of [['office','título',['titulo']],['predecessor','antes',['antecessor','sucedendo']],['successor','depois',['sucessor']]]){const f=v2222InfoboxUnique(p,src+suffix),key=target+nativeIndex,aliases=[key,...conf.map(k=>k+nativeIndex),...(i<=1?[target+'1',...conf.map(k=>k+'1')]:[]),...(src==='predecessor'?['sucedendo']:[])];if(f&&v2222InfoboxSafeValue(f.value)&&!p.fields.some(q=>q!==f&&aliases.includes(q.key)))add(f,key);}
  }}else{
  for(const group of [{prefix:'',keys:['years','clubs','caps','goals'],targets:['ano','clubes','jogos(gols)']},{prefix:'youth',keys:['youthyears','youthclubs'],targets:['jovemanos','jovemclubes']},{prefix:'national',keys:['nationalyears','nationalteam','nationalcaps','nationalgoals'],targets:['anoselecao','selecaonacional','partidasselecao']}]){
   const indices=[...new Set(p.fields.map(f=>{const m=new RegExp('^(?:'+group.keys.join('|')+')(\\d+)$').exec(f.key);return m?Number(m[1]):0;}).filter(Boolean))].sort((a,b)=>a-b);if(!indices.length||indices.length>30||indices.some((n,j)=>n!==j+1)||p.fields.some(f=>group.targets.includes(f.key)))continue;
   const rows=[];let valid=true;for(const index of indices){const fields=group.keys.map(k=>v2222InfoboxUnique(p,k+index));if(!fields[0]?.value.trim()||!fields[1]?.value.trim()||fields.some(f=>f&&(!v2222InfoboxSafeValue(f.value)||!readable(f)))||fields.length>2&&(!!fields[2]!==!!fields[3]||fields[2]&&(!/^\d+$/.test(fields[2].value.trim())||!/^\d+$/.test(fields[3].value.trim())))){valid=false;break;}rows.push(fields);}if(!valid)continue;
   const values=group.targets.map((_,col)=>rows.map(fields=>col<2?fields[col].value.trim():fields[2]?fields[2].value.trim()+' ('+fields[3].value.trim()+')':'').join('<br />'));
   const anchor=rows[0][0],text=group.targets.map((key,j)=>'|'+key+'='+values[j]).join('\n');edits.push({start:anchor.start-1,end:anchor.end,text});count+=group.targets.length;
   for(const fields of rows)for(const f of fields)if(f&&f!==anchor){edits.push({start:f.start-1,end:f.end,text:''});count++;}
  }
  for(const [src,dest]of [['club-update','pcupdate'],['nationalteam-update','ntupdate']]){const f=v2222InfoboxUnique(p,src);if(f&&!p.fields.some(q=>q.key===dest)&&v2222InfoboxSafeValue(f.value))add(f,dest);}
 }
 if(!edits.length)return null;edits.sort((a,b)=>a.start-b.start||a.end-b.end);if(edits.some((e,i)=>i&&e.start<edits[i-1].end))return null;return{text:v24SyntaxApply(raw,edits),count};
}
function v2222InfoboxCareerPlan(source,cfg={}) {
 const edits=[];if(!v2222InfoboxScope(source,cfg)||cfg.automaticBiographyFields===false||cfg.automaticParameterNames===false)return v222EditsPlan(source,edits);
 const nodes=v2221FocusedNodes(source,cfg);for(const n of nodes){if(nodes.some(q=>q!==n&&q.start<n.start&&n.end<q.end))continue;const raw=source.slice(n.start,n.end),r=v2222InfoboxCareerCall(raw,cfg,source);if(r)edits.push({start:n.start,end:n.end,text:r.text,count:r.count,kind:'native-aligned-career',proof:{sourceHash:v24SyntaxHash(raw)}});}
 return v222EditsPlan(source,edits);
}
function v2222InfoboxRunwayPlan(source,cfg={}) {
 const edits=[];if(!v2222InfoboxScope(source,cfg)||cfg.automaticParameterNames===false||cfg.automaticInfoboxValues===false)return v222EditsPlan(source,edits);
 const contract=V2222_IB.airportRunways;if(!contract||!v2221InfoboxPin(contract.native))return v222EditsPlan(source,edits);
 for(const n of v2221FocusedNodes(source,cfg)){const raw=source.slice(n.start,n.end),p=v2221InfoboxRead(raw);if(!p||p.title!=='Info/Aeroporto'||p.fields.some(f=>f.positional||f.key==='pistas')||new Set(p.fields.map(f=>f.key)).size!==p.fields.length)continue;
  const groups=new Map();let valid=true;for(const f of p.fields){const m=/^pista([1-9]\d*)_(.+)$/.exec(f.key);if(!m)continue;const index=Number(m[1]);if(index>30||!['numero','comprimento_m','superficie'].includes(m[2])){valid=false;break;}if(!groups.has(index))groups.set(index,new Map());groups.get(index).set(m[2],f);}
  const ordered=[...groups].sort((a,b)=>a[0]-b[0]);if(!valid||!ordered.length||ordered.some(([index],i)=>index!==i+1))continue;
  const rows=[],consumed=[];for(const [,group]of ordered){const number=group.get('numero'),length=group.get('comprimento_m'),surface=group.get('superficie'),code=surface&&contract.surfaces[norm(surface.value)];if(!number||!length||!surface||!/^[0-3]\d[LRC]?\/[0-3]\d[LRC]?$/.test(number.value.trim())||!/^\d+(?:\.\d+)?$/.test(length.value.trim())||Number(length.value.trim())<=0||!code){valid=false;break;}rows.push('{{Info/Aeroporto/Pistas|cabeceira='+number.value.trim()+'|comprimento='+length.value.trim()+'|superfície='+code+'}}');consumed.push(number,length,surface);}
  if(!valid)continue;const anchor=consumed[0],local=[{start:anchor.start-1,end:anchor.end,text:'|pistas='+rows.join('\n')}];for(const f of consumed.slice(1))local.push({start:f.start-1,end:f.end,text:''});
  edits.push({start:n.start,end:n.end,text:v24SyntaxApply(raw,local),count:consumed.length,kind:'native-airport-runway-rows',proof:{native:contract.native,sourceHash:v24SyntaxHash(raw),rows:ordered.length}});
 }
 return v222EditsPlan(source,edits);
}
function v2222InfoboxImdbPlan(source,cfg={}) {
 const empty=v222EditsPlan(source,[]);if(!v2222InfoboxScope(source,cfg)||cfg.automaticParameterNames===false||cfg.links===false||cfg.endMatter===false)return empty;
 const nodes=v2221FocusedNodes(source,cfg),boxes=nodes.filter(n=>v2221InfoboxRead(source.slice(n.start,n.end))?.title==='Info/Filme'&&v222InferenceTop(source,n.start));if(boxes.length!==1)return empty;
 const box=boxes[0],p=v2221InfoboxRead(source.slice(box.start,box.end)),names=V2221_FOCUSED.preserveFilledObsolete['Info/Filme']||[],fields=p.fields.filter(f=>names.includes(f.key)&&f.value.trim());if(fields.length!==1||p.fields.filter(f=>f.key===fields[0].key).length!==1)return empty;
 const f=fields[0],m=/^(?:tt)?(\d{7,8})$/.exec(f.value.trim());if(!m)return empty;const id='tt'+m[1],view=v222InferenceView(source),existing=[...view.matchAll(/https?:\/\/(?:www\.)?imdb\.com\/title\/(tt\d{7,9})\b/g)];if(existing.some(x=>x[1]!==id))return empty;
 const top=structuralReaders(source).nodes,helperNodes=v24SyntaxTemplates(view).nodes.filter(n=>n.size===2&&v2221InfoboxRead(source.slice(n.start,n.end))?.title==='IMDb título');if(helperNodes.some(n=>!top.some(t=>t.start===n.start&&t.end===n.end)))return empty;
 const helpers=helperNodes.map(n=>v2221InfoboxRead(source.slice(n.start,n.end)));for(const helper of helpers){const ids=helper.fields.filter(f=>['1','id'].includes(f.key));if(ids.length!==1||!new RegExp('^(?:tt)?'+m[1]+'$').test(ids[0].value.trim()))return empty;}
 const edits=[{start:box.start+f.start-1,end:box.start+f.end,text:'',count:1,kind:'obsolete-imdb-retained',proof:{owner:'Info/Filme',identifier:id}}];if(!existing.length&&!helpers.length){const headings=structuralReaders(source).headings,external=headings.filter(h=>norm(h.title||h.text||'')==='ligações externas');if(external.length>1)return empty;let at;
  if(external.length===1){const h=external[0];at=source.indexOf('\n',h.start);if(at<0)return empty;at++;edits.push({start:at,end:at,text:'* {{IMDb título|'+id+'}}\n',count:1,kind:'native-imdb-external-link'});}
  else {at=v222InferenceFooterPoint(source,v222InferenceCategories(source));if(at===null||!v222InferenceTop(source,at))return empty;edits.push({start:at,end:at,text:'\n\n== Ligações externas ==\n* {{IMDb título|'+id+'}}\n\n',count:1,kind:'native-imdb-external-link'});}
 }
 return v222EditsPlan(source,edits);
}
function v2222InfoboxPlan(source,cfg={}) {
 if(!v2222InfoboxScope(source,cfg))return v222EditsPlan(source,[]);let text=source,count=0;const phases=[];
 for(const make of [v2222InfoboxForeignPlan,v2222InfoboxCareerPlan,v2222InfoboxRunwayPlan,v2222InfoboxNativePlan,v2222InfoboxGenderPlan,v2222InfoboxImdbPlan]){const p=make(text,cfg);if(p.text!==text&&p.edits.length){phases.push({source:text,plan:p});text=p.text;count+=p.edits.reduce((s,e)=>s+(e.count??1),0);}}
 if(text===source)return v222EditsPlan(source,[]);let start=0,end=source.length,tail=text.length;while(start<end&&start<tail&&source[start]===text[start])start++;while(end>start&&tail>start&&source[end-1]===text[tail-1]){end--;tail--;}
 return v222EditsPlan(source,[{start,end,text:text.slice(start,tail),count:Math.max(1,count),kind:'finite-infobox-readers',proof:{sourceHash:v24SyntaxHash(source),phases}}]);
}
function v2222InfoboxProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2222InfoboxPlan);}
