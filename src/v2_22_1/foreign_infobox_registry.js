// Data-only, source-bound infobox contracts. Unresolved inventory entries are not migration rules.
const V2221_INFOBOX_WIKIS = new Set(['en','es','fr','de','ca','it']);
const V2221_INFOBOX_NAMESPACES = new Set(['template','plantilla','modèle','vorlage','modello','predefinição']);
const V2221_INFOBOX_HTML_TAGS = new Set('a abbr b bdi bdo big blockquote br caption center cite code col colgroup dd del div dl dt em font h1 h2 h3 h4 h5 h6 hr i ins kbd li mark ol p q rb rp rt ruby s samp small span strike strong sub sup table tbody td th thead tr tt u ul var wbr'.split(' '));
const V2221_INFOBOX_EXTENSIONS = new Set('ref references nowiki pre source syntaxhighlight math chem ce gallery score timeline graph poem imagemap inputbox hiero templatestyles'.split(' '));
const V2221_INFOBOX_LITERAL_EXTENSIONS = new Set('nowiki pre source syntaxhighlight math chem ce gallery score timeline graph imagemap inputbox hiero templatestyles'.split(' '));
const V2221_INFOBOX_EMBED_KEYS = new Set(['child','embed','embedded','embutido','subcaixa','nested']);
const V2221_INFOBOX_PREPARED = new WeakMap();

function v2221InfoboxTrim(value){return value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');}
function v2221InfoboxOwn(value,key){const d=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,key):null;return d&&Object.hasOwn(d,'value')?d.value:undefined;}
function v2221InfoboxClone(value,seen=new Set(),depth=0){
 if(value===null||typeof value==='string'||typeof value==='boolean')return value;
 if(typeof value==='number'){if(!Number.isSafeInteger(value))throw Error('non-integer-data');return value;}
 if(!value||typeof value!=='object'||depth>64||seen.has(value)||Object.getOwnPropertySymbols(value).length)throw Error('non-json-data');
 const array=Array.isArray(value);if(!array&&Object.prototype.toString.call(value)!=='[object Object]')throw Error('non-json-object');
 const ds=Object.getOwnPropertyDescriptors(value),out=array?[]:Object.create(null);seen.add(value);
 if(array&&(Object.keys(ds).length!==value.length+1||Array.from({length:value.length},(_,i)=>String(i)).some(k=>!Object.hasOwn(ds,k))))throw Error('non-json-array');
 for(const key of Object.keys(ds)){
  if(array&&key==='length')continue;const d=ds[key];
  if(!d.enumerable||!Object.hasOwn(d,'value'))throw Error('non-json-property');
  Object.defineProperty(out,key,{value:v2221InfoboxClone(d.value,seen,depth+1),enumerable:true,writable:true,configurable:true});
 }
 seen.delete(value);return out;
}
function v2221InfoboxCanonical(value){
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(v2221InfoboxCanonical).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+v2221InfoboxCanonical(value[k])).join(',')+'}';
}
function v2221InfoboxTitle(value){
 if(typeof value!=='string'||!value||/[{}<>|\u0000-\u001f\u007f]/.test(value))return null;
 let title=value.normalize('NFC').replace(/_/g,' ').replace(/[ \t\r\n]+/g,' ').replace(/^ +| +$/g,'');
 const at=title.indexOf(':');if(at>=0&&V2221_INFOBOX_NAMESPACES.has(title.slice(0,at).toLocaleLowerCase('pt')))title=title.slice(at+1).replace(/^ +| +$/g,'');
 if(!title||title[0]===':'||/^(?:#|subst\s*:|safesubst\s*:)/i.test(title))return null;
 // Title normalization belongs to page identity only. Argument names, values and reference names stay literal.
 const first=Array.from(title)[0],upper=first.toUpperCase();
 return Array.from(upper).length===1?upper+title.slice(first.length):title;
}
function v2221InfoboxTagAt(text,at){
 if(text[at]!=='<')return null;
 const m=/^<(\/)?([A-Za-z][A-Za-z0-9:-]*)(?=[\s/>])/.exec(text.slice(at));if(!m)return null;
 const name=m[2].toLowerCase();if(!V2221_INFOBOX_HTML_TAGS.has(name)&&!V2221_INFOBOX_EXTENSIONS.has(name))return null;
 let quote=null;
 for(let i=at+m[0].length;i<text.length;i++){
  const c=text[i];if(quote){if(c===quote)quote=null;continue;}
  if(c==='"'||c==="'"){quote=c;continue;}
  if(c==='>')return {name,start:at,end:i+1,close:!!m[1],self:/\/\s*>$/.test(text.slice(at,i+1))||['br','hr','wbr','col'].includes(name)};
 }
 return {name,start:at,end:text.length,invalid:true};
}
function v2221InfoboxExtensionEnd(text,tag,depth=0){
 if(depth>64||tag.invalid)return null;if(tag.self)return tag.end;
 if(V2221_INFOBOX_LITERAL_EXTENSIONS.has(tag.name)){
  const re=new RegExp('<\\/'+tag.name+'[ \\t\\r\\n]*>','gi');re.lastIndex=tag.end;const close=re.exec(text);return close?re.lastIndex:null;
 }
 for(let i=tag.end;i<text.length;){
  if(text.startsWith('<!--',i)){const stop=text.indexOf('-->',i+4);if(stop<0)return null;i=stop+3;continue;}
  const inner=v2221InfoboxTagAt(text,i);
  if(!inner){i++;continue;}if(inner.invalid)return null;
  if(inner.close&&inner.name===tag.name)return inner.end;
  if(!inner.close&&!inner.self&&V2221_INFOBOX_EXTENSIONS.has(inner.name)){
   if(inner.name===tag.name)return null;const stop=v2221InfoboxExtensionEnd(text,inner,depth+1);if(stop===null)return null;i=stop;continue;
  }
  i=inner.end;
 }
 return null;
}
function v2221InfoboxRead(raw){
 if(typeof raw!=='string'||!raw.startsWith('{{')||raw.startsWith('{{{')||!raw.endsWith('}}')||raw.length>4194304)return null;
 const stop=raw.length-2,parts=[],stack=[];let start=2,equal=null,links=0,external=0;
 for(let i=2;i<stop;){
  if(raw.startsWith('<!--',i)){const end=raw.indexOf('-->',i+4);if(end<0||end+3>stop)return null;i=end+3;continue;}
  const tag=v2221InfoboxTagAt(raw,i);
  if(tag){if(tag.invalid||tag.end>stop)return null;if(!tag.close&&V2221_INFOBOX_EXTENSIONS.has(tag.name)){const end=v2221InfoboxExtensionEnd(raw,tag);if(end===null||end>stop)return null;i=end;continue;}i=tag.end;continue;}
  const top=stack.at(-1),two=raw.slice(i,i+2);
  if(top&&raw.slice(i,i+top)==='}'.repeat(top)){stack.pop();i+=top;continue;}
  if(raw.slice(i,i+3)==='{{{'){stack.push(3);i+=3;continue;}
  if(two==='{{'){stack.push(2);i+=2;continue;}
  if(two==='}}')return null;
  if(two==='[['){links++;i+=2;continue;}if(two===']]'){if(!links)return null;links--;i+=2;continue;}
  if(raw[i]==='['&&!links&&/^(?:https?:\/\/|ftp:\/\/|mailto:|\/\/)/i.test(raw.slice(i+1))){external++;i++;continue;}
  if(raw[i]===']'&&!links&&external){external--;i++;continue;}
  if(!stack.length&&!links&&raw[i]==='|'&&external)return null;
  if(!stack.length&&!links&&!external&&raw[i]==='|'){parts.push({start,end:i,equal});start=i+1;equal=null;i++;continue;}
  if(!stack.length&&!links&&raw[i]==='='&&equal===null){if(external)return null;equal=i;}
  i++;
 }
 if(stack.length||links||external)return null;parts.push({start,end:stop,equal});
 const first=parts.shift(),header=raw.slice(first.start,first.end),literal=v2221InfoboxTrim(header),title=v2221InfoboxTitle(literal);
 if(!title||/<!--|[{}\r\n]/.test(literal))return null;
 const headerStart=first.start+header.indexOf(literal),fields=[];let next=1;
 for(const part of parts){
  if(part.equal===null){fields.push({...part,key:String(next++),positional:true,value:raw.slice(part.start,part.end),valueStart:part.start,valueEnd:part.end,keyStart:part.start,keyEnd:part.start});continue;}
  const keyRaw=raw.slice(part.start,part.equal),key=v2221InfoboxTrim(keyRaw);
  if(!key||/[{}<>|\[\]\r\n\u0000-\u001f\u007f]/.test(key))return null;
  const keyStart=part.start+keyRaw.indexOf(key);fields.push({...part,key,positional:false,keyStart,keyEnd:keyStart+key.length,valueStart:part.equal+1,valueEnd:part.end,value:raw.slice(part.equal+1,part.end)});
 }
 return {title,literal,headerStart,headerEnd:headerStart+literal.length,fields};
}
function v2221InfoboxPin(value){return !!value&&Number.isSafeInteger(value.revision)&&value.revision>0&&typeof value.sha256==='string'&&/^[0-9a-f]{64}$/i.test(value.sha256);}
function v2221InfoboxSamePin(a,b){return v2221InfoboxPin(a)&&v2221InfoboxPin(b)&&a.revision===b.revision&&a.sha256.toLowerCase()===b.sha256.toLowerCase();}
function v2221InfoboxReaderComplete(reader,pin){return !!reader&&reader.status==='verified'&&reader.coverage==='complete'&&reader.forwarding==='resolved'&&['absent','resolved'].includes(reader.lua)&&v2221InfoboxSamePin(reader,pin);}
function v2221InfoboxRole(value){return typeof value==='string'&&/^[^.\s]+(?:\.[^.\s]+)+$/.test(value);}
function v2221InfoboxForeignEvidence(rows,role){
 return Array.isArray(rows)&&rows.length>0&&rows.every(row=>row&&V2221_INFOBOX_WIKIS.has(row.wiki)&&v2221InfoboxTitle(row.title)&&v2221InfoboxPin(row)&&typeof row.key==='string'&&row.key&&row.role===role&&row.consumed===true&&row.semantics==='equivalent');
}
function v2221InfoboxInputEvidence(evidence,record,key,foreignEvidence){
 if(!evidence||evidence.status!=='verified'||!v2221InfoboxRole(evidence.role)||evidence.semantics!=='equivalent')return false;
 if(evidence.sourceConsumed===true)return true;
 const native=record.mode==='native-repair'?record.proof?.nativeRepair:record.mode==='native-wrapper'?record.proof?.nativeWrapper:null;
 return !!native&&evidence.sourceConsumed===false&&Array.isArray(native.unconsumedKeys)&&native.unconsumedKeys.includes(key)&&v2221InfoboxForeignEvidence(foreignEvidence,evidence.role);
}
function v2221InfoboxRecordErrors(record){
 if(!record||typeof record!=='object'||Array.isArray(record))return ['record-object'];
 const errors=[],bad=x=>errors.push(x),source=record.source,target=record.target;
 if(typeof record.id!=='string'||!record.id)bad('record-id');
 if(record.mode!==undefined&&!['migration','native-repair','native-wrapper'].includes(record.mode))bad('record-mode');
 if(!source||!(V2221_INFOBOX_WIKIS.has(source.wiki)||source.wiki==='pt'&&['native-repair','native-wrapper'].includes(record.mode))||!v2221InfoboxTitle(source.title)||!Array.isArray(source.aliases)||source.aliases.some(x=>!v2221InfoboxTitle(x)))bad('source-identity');
 if(['native-repair','native-wrapper'].includes(record.mode)&&source?.wiki!=='pt')bad('native-source');
 if(!['active','unresolved','unsupported','ambiguous'].includes(record.state))bad('record-state');
 if(record.state!=='active')return errors;
 if(!v2221InfoboxPin(source))bad('source-pin');
 if(!target||target.wiki!=='pt'||!v2221InfoboxPin(target)||!v2221InfoboxTitle(target.title)||!Array.isArray(target.accepted)||target.accepted.some(x=>typeof x!=='string'||!x||/[{}<>|=\r\n\u0000-\u001f]/.test(x)))bad('target-contract');
 const proof=record.proof;
 if(!proof||proof.kind!=='native-contract'||proof.defaults!=='equivalent'||proof.suppressions!=='equivalent'||proof.aliasPrecedence!=='equivalent'||!['absent','equivalent'].includes(proof.dynamic)||!['standalone','equivalent'].includes(proof.embedding))bad('record-equivalence');
 if(record.mode==='native-repair'){
  const repair=proof?.nativeRepair,reader=repair?.nativeReader;
  if(!v2221InfoboxSamePin(source,target)||v2221InfoboxTitle(source?.title)!==v2221InfoboxTitle(target?.title)||!repair||repair.status!=='verified'||repair.originIndependent!==true||!Array.isArray(repair.unconsumedKeys)||!repair.unconsumedKeys.length||repair.unconsumedKeys.some(x=>typeof x!=='string'||!x)||new Set(repair.unconsumedKeys).size!==repair.unconsumedKeys.length||!v2221InfoboxReaderComplete(reader,source))bad('native-repair-reader');
 }
 if(record.mode==='native-wrapper'){
  const wrapper=proof?.nativeWrapper;
  if(!wrapper||wrapper.status!=='verified'||wrapper.originIndependent!==true||!Array.isArray(wrapper.unconsumedKeys)||wrapper.unconsumedKeys.some(x=>typeof x!=='string'||!x)||new Set(wrapper.unconsumedKeys).size!==wrapper.unconsumedKeys.length||!v2221InfoboxReaderComplete(wrapper.sourceReader,source)||!v2221InfoboxReaderComplete(wrapper.targetReader,target)||v2221InfoboxTitle(source?.title)===v2221InfoboxTitle(target?.title))bad('native-wrapper-readers');
 }
 const used=new Set();
 if(!record.fields||Array.isArray(record.fields)||typeof record.fields!=='object')bad('field-map');
 else for(const[key,field]of Object.entries(record.fields)){
  used.add(key);
  if(!key||/[{}<>|=\r\n\u0000-\u001f]/.test(key)||!field||typeof field!=='object'||Array.isArray(field)||!Array.isArray(target?.accepted)||!target.accepted.includes(field.target))bad('field-target:'+key);
  const ev=field?.evidence;if(!v2221InfoboxInputEvidence(ev,record,key,field?.foreignEvidence)||ev.targetConsumed!==true)bad('field-evidence:'+key);
  if(record.mode==='native-repair'&&ev?.sourceConsumed===true&&(field.target!==key||field.transform!=='identity'))bad('native-consumed-field:'+key);
  if(!['identity','literal-map','date-ymd-to-dmy'].includes(field?.transform))bad('field-transform:'+key);
  if(field?.transform==='literal-map'&&(!field.values||typeof field.values!=='object'||Array.isArray(field.values)||Object.values(field.values).some(x=>typeof x!=='string'||/[{}<>]/.test(x))))bad('literal-map:'+key);
  if(field?.transform==='date-ymd-to-dmy'){
   const ev=field.transformEvidence;if(!ev||ev.source!=='gregorian-iso-date'||ev.target!=='gregorian-pt-long-date'||ev.age!==false||ev.categorySideEffects!==false)bad('date-transform-evidence:'+key);
  }
 }
 if(record.compounds!==undefined){
  if(!Array.isArray(record.compounds))bad('compound-list');
  else{const ids=new Set();for(const compound of record.compounds){
   if(!compound||typeof compound!=='object'||typeof compound.id!=='string'||!compound.id||ids.has(compound.id)){bad('compound-id');continue;}ids.add(compound.id);
   const ev=compound.evidence;if(!Array.isArray(target?.accepted)||!target.accepted.includes(compound.target)||!ev||ev.status!=='verified'||!v2221InfoboxRole(ev.role)||ev.targetConsumed!==true||ev.semantics!=='equivalent')bad('compound-target:'+compound.id);
   if(!Array.isArray(compound.sources)||compound.sources.length<2){bad('compound-sources:'+compound.id);continue;}
   const roles=new Set();for(const input of compound.sources){const key=input?.key;
    if(typeof key!=='string'||!key||/[{}<>|=\r\n\u0000-\u001f]/.test(key)||used.has(key))bad('compound-source-key:'+compound.id);else used.add(key);
    if(!v2221InfoboxInputEvidence(input?.evidence,record,key,input?.foreignEvidence)||roles.has(input?.evidence?.role)||record.mode==='native-repair'&&input?.evidence?.sourceConsumed!==false)bad('compound-source-evidence:'+compound.id);roles.add(input?.evidence?.role);
   }
   if(compound.transform==='date-parts-to-dmy'){
    const parts=compound.sources.map(x=>x?.component),te=compound.transformEvidence;if(parts.length!==3||new Set(parts).size!==3||!['year','month','day'].every(x=>parts.includes(x))||!te||te.calendar!=='gregorian'||te.target!=='gregorian-pt-long-date'||te.partial!=='reject'||te.age!==false||te.categorySideEffects!==false)bad('compound-date-evidence:'+compound.id);
   }else if(compound.transform==='join-exact'){
    const te=compound.transformEvidence;if(!te||![' – ', ', ', ' / ', '<br />'].includes(te.separator)||!['preserve','named-margin'].includes(te.whitespace)||te.partial!=='reject'||te.whitespace==='named-margin'&&compound.sources.some(x=>x?.evidence?.whitespace!=='trim-equivalent'))bad('compound-join-evidence:'+compound.id);
   }else bad('compound-transform:'+compound.id);
  }}
 }
 if(['native-repair','native-wrapper'].includes(record.mode)){
  const declared=[...Object.entries(record.fields||{}).filter(([,x])=>x?.evidence?.sourceConsumed===false).map(([key])=>key),...(Array.isArray(record.compounds)?record.compounds.flatMap(x=>Array.isArray(x?.sources)?x.sources.filter(y=>y?.evidence?.sourceConsumed===false).map(y=>y.key):[]):[])],expected=(record.mode==='native-repair'?record.proof?.nativeRepair:record.proof?.nativeWrapper)?.unconsumedKeys;
  if(!Array.isArray(expected)||declared.length!==expected.length||declared.some(key=>!expected.includes(key)))bad('native-unconsumed-contract');
 }
 const pc=record.preconditions;
 if(pc!==undefined){
  if(!pc||typeof pc!=='object'||Array.isArray(pc))bad('preconditions');
  else{
   for(const key of ['requiredKeys','forbiddenKeys','literalNonemptyKeys','bareFileKeys','literalNonemptyWhenPresentKeys'])if(pc[key]!==undefined&&(!Array.isArray(pc[key])||pc[key].some(x=>typeof x!=='string'||!x)))bad('precondition-'+key);
   if(pc.requiresNonemptyWhenPresent!==undefined&&(!pc.requiresNonemptyWhenPresent||typeof pc.requiresNonemptyWhenPresent!=='object'||Array.isArray(pc.requiresNonemptyWhenPresent)||Object.entries(pc.requiresNonemptyWhenPresent).some(([key,value])=>!key||!Array.isArray(value)||!value.length||value.some(x=>typeof x!=='string'||!x))))bad('precondition-requires-nonempty');
   if(pc.mutuallyExclusiveNonempty!==undefined&&(!Array.isArray(pc.mutuallyExclusiveNonempty)||pc.mutuallyExclusiveNonempty.some(group=>!Array.isArray(group)||group.length<2||new Set(group).size!==group.length||group.some(key=>typeof key!=='string'||!key))))bad('precondition-mutually-exclusive-nonempty');
   for(const key of ['sourceValues','inactiveEmbedValues'])if(pc[key]!==undefined&&(!pc[key]||typeof pc[key]!=='object'||Array.isArray(pc[key])||Object.values(pc[key]).some(x=>!Array.isArray(x)||x.some(y=>typeof y!=='string'))))bad('precondition-'+key);
   if(pc.positional!==undefined&&!['reject','mapped'].includes(pc.positional))bad('precondition-positional');
  }
 }
 return errors;
}
function v2221InfoboxCatalogValidate(catalog){
 const out={valid:false,errors:[],recordErrors:[],nativeAliasErrors:[],records:[],nativeAliases:[]};
 if(!catalog||typeof catalog!=='object'||v2221InfoboxOwn(catalog,'schema')!==1||typeof v2221InfoboxOwn(catalog,'snapshotId')!=='string'||!v2221InfoboxOwn(catalog,'snapshotId')||!Array.isArray(v2221InfoboxOwn(catalog,'records'))){out.errors.push('catalog-envelope');return out;}
 const scope=v2221InfoboxOwn(catalog,'eligibleTitles');if(scope!==undefined){try{out.eligibleTitles=v2221InfoboxClone(scope);if(!Array.isArray(out.eligibleTitles)||out.eligibleTitles.some(x=>typeof x!=='string'||v2221InfoboxTitle(x)!==x))out.errors.push('catalog-title-scope');}catch{out.errors.push('catalog-title-scope');}}
 out.snapshotId=catalog.snapshotId;const ids=new Set();
 for(let i=0;i<catalog.records.length;i++){
  let record;try{record=v2221InfoboxClone(v2221InfoboxOwn(catalog.records,String(i)));}catch{out.recordErrors.push({index:i,errors:['non-json-record']});continue;}
  const errors=v2221InfoboxRecordErrors(record),id=record?.id;if(ids.has(id))errors.push('duplicate-record-id');else if(id)ids.add(id);
  if(errors.length)out.recordErrors.push({index:i,id:id||null,errors,source:record?.source||null});else out.records.push(record);
 }
 const aliases=v2221InfoboxOwn(catalog,'nativeAliases')||[];
 if(!Array.isArray(aliases)){out.errors.push('native-alias-list');return out;}
 for(let i=0;i<aliases.length;i++){
  let row;try{row=v2221InfoboxClone(v2221InfoboxOwn(aliases,String(i)));}catch{out.nativeAliasErrors.push({index:i,errors:['non-json-native-alias']});continue;}
  if(!v2221InfoboxPin(row)||!v2221InfoboxTitle(row?.title)||!Array.isArray(row?.aliases)||row.aliases.some(x=>!v2221InfoboxTitle(x)))out.nativeAliasErrors.push({index:i,errors:['unproved-native-alias'],source:row||null});else out.nativeAliases.push(row);
 }
 out.valid=out.errors.length===0;out.activeRecords=out.records.filter(x=>x.state==='active').length;return out;
}
function v2221InfoboxFreeze(value){
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const key of Object.keys(value))v2221InfoboxFreeze(value[key]);Object.freeze(value);}return value;
}
function v2221InfoboxRegistryPrepare(catalog){
 if(catalog&&typeof catalog==='object'&&V2221_INFOBOX_PREPARED.has(catalog))return catalog;
 const validated=v2221InfoboxCatalogValidate(catalog),index=new Map(),invalid=new Map(),native=new Map(),invalidNative=new Set();
 const add=(map,title,row)=>{const key=v2221InfoboxTitle(title);if(key){if(!map.has(key))map.set(key,[]);if(!map.get(key).includes(row))map.get(key).push(row);}};
 for(const row of validated.records)for(const title of [row.source.title,...row.source.aliases])add(index,title,row);
 for(const row of validated.recordErrors)if(row.source)for(const title of [row.source.title,...(Array.isArray(row.source.aliases)?row.source.aliases:[])])add(invalid,title,row);
 for(const row of validated.nativeAliases)for(const title of [row.title,...row.aliases])add(native,title,row);
 for(const error of validated.nativeAliasErrors){const row=error.source;if(row)for(const title of [row.title,...(Array.isArray(row.aliases)?row.aliases:[])]){const key=v2221InfoboxTitle(title);if(key)invalidNative.add(key);}}
 v2221InfoboxFreeze(validated);
 const handle=Object.freeze({schema:1,kind:'prepared-infobox-registry',snapshotId:validated.snapshotId||null,valid:validated.valid,activeRecords:validated.activeRecords||0});
 V2221_INFOBOX_PREPARED.set(handle,{validated,index,invalid,native,invalidNative});return handle;
}
function v2221InfoboxResolveNative(parsed,registry,sourceWiki){
 const validated=registry.validated,nativeRows=registry.native.get(parsed.title)||[],native=nativeRows[0],unchanged={status:'already-native',reason:'verified-native-identity',candidates:[],parsed,native};
 if(nativeRows.some(row=>v2221InfoboxTitle(row.title)!==v2221InfoboxTitle(native.title)||!v2221InfoboxSamePin(row,native)))return {status:'invalid-contract',reason:'conflicting-native-owners',candidates:[],parsed};
 if(validated.eligibleTitles&&!validated.eligibleTitles.includes(parsed.title))return unchanged;
 if(registry.invalidNative.has(parsed.title))return {status:'invalid-contract',reason:'unproved-native-identity',candidates:[],parsed};
 const all=registry.index.get(parsed.title)||[],local=all.filter(r=>r.source.wiki==='pt'),wrappers=local.filter(r=>r.state==='active'&&r.mode==='native-wrapper'),invalid=(registry.invalid.get(parsed.title)||[]).filter(r=>r.source.wiki==='pt');
 if(wrappers.length){
  if(invalid.length||wrappers.some(row=>!v2221InfoboxSamePin(row.source,native)||v2221InfoboxTitle(row.source.title)!==v2221InfoboxTitle(native.title)))return {status:'invalid-contract',reason:'native-wrapper-source-pin',candidates:invalid.map(x=>x.id),parsed};
  if(local.some(r=>r.state!=='active'))return {status:'unresolved',reason:'native-wrapper-unverified',candidates:local.map(r=>r.id),parsed};
  if(local.some(r=>r.mode==='native-repair'))return {status:'ambiguous',reason:'conflicting-native-strategies',candidates:local.map(r=>r.id),parsed};
  for(const row of wrappers){
   const targets=registry.native.get(v2221InfoboxTitle(row.target.title))||[];
   if(!targets.length||targets.some(target=>v2221InfoboxTitle(target.title)!==v2221InfoboxTitle(row.target.title)||!v2221InfoboxSamePin(target,row.target)))return {status:'invalid-contract',reason:'native-wrapper-target-pin',candidates:wrappers.map(r=>r.id),parsed};
  }
  const first=wrappers[0];if(wrappers.some(row=>v2221InfoboxTitle(row.target.title)!==v2221InfoboxTitle(first.target.title)||!v2221InfoboxSamePin(row.target,first.target)))return {status:'ambiguous',reason:'native-wrapper-targets-disagree',candidates:wrappers.map(r=>r.id),parsed};
  const foreign=sourceWiki==='pt'?[]:all.filter(r=>V2221_INFOBOX_WIKIS.has(r.source.wiki)&&(sourceWiki===undefined||r.source.wiki===sourceWiki)),foreignInvalid=(registry.invalid.get(parsed.title)||[]).filter(r=>V2221_INFOBOX_WIKIS.has(r.source.wiki)&&(sourceWiki===undefined||r.source.wiki===sourceWiki));
  if(foreignInvalid.length)return {status:'invalid-contract',reason:'matching-invalid-record',candidates:foreignInvalid.map(r=>r.id),parsed};
  if(foreign.some(r=>r.state!=='active'))return {status:'unresolved',reason:'native-wrapper-foreign-origin-unverified',candidates:foreign.map(r=>r.id),parsed};
  if(sourceWiki!==undefined&&sourceWiki!=='pt'&&!foreign.length)return unchanged;
  if(foreign.some(row=>v2221InfoboxTitle(row.target.title)!==v2221InfoboxTitle(first.target.title)||!v2221InfoboxSamePin(row.target,first.target)))return {status:'ambiguous',reason:'native-wrapper-origin-target-disagreement',candidates:[...wrappers,...foreign].map(r=>r.id),parsed};
  const records=sourceWiki===undefined?[...wrappers,...foreign]:sourceWiki==='pt'?wrappers:foreign;
  return {status:'ready',reason:'verified-native-wrapper-canonicalization',candidates:records.map(r=>r.id),records,authorizers:wrappers,parsed,snapshotId:validated.snapshotId};
 }
 const repairs=local.filter(r=>r.mode==='native-repair'),keys=new Set(parsed.fields.map(x=>x.key));
 if(!repairs.some(r=>r.state==='active'&&r.proof.nativeRepair.unconsumedKeys.some(key=>keys.has(key))))return unchanged;
 if(invalid.length||repairs.some(r=>r.state==='active'&&(!v2221InfoboxSamePin(r.source,native)||!v2221InfoboxSamePin(r.target,native)||v2221InfoboxTitle(r.target.title)!==v2221InfoboxTitle(native.title))))return {status:'invalid-contract',reason:'native-repair-pin',candidates:invalid.map(x=>x.id),parsed};
 if(local.some(r=>r.state!=='active'))return {status:'unresolved',reason:'native-repair-unverified',candidates:local.map(r=>r.id),parsed};
 return {status:'ready',reason:'native-unconsumed-key-contract',candidates:repairs.map(r=>r.id),records:repairs,parsed,snapshotId:validated.snapshotId};
}
function v2221InfoboxResolve(raw,catalog,context={}){
 const parsed=v2221InfoboxRead(raw);if(!parsed)return {status:'invalid-input',reason:'not-one-complete-literal-template',candidates:[]};
 const prepared=v2221InfoboxRegistryPrepare(catalog),registry=V2221_INFOBOX_PREPARED.get(prepared),validated=registry.validated;if(!validated.valid)return {status:'invalid-catalog',reason:validated.errors.join(','),candidates:[]};
 const sourceWiki=v2221InfoboxOwn(context,'sourceWiki');if(sourceWiki!==undefined&&!V2221_INFOBOX_WIKIS.has(sourceWiki)&&sourceWiki!=='pt')return {status:'invalid-context',reason:'source-wiki',candidates:[]};
 if(registry.native.has(parsed.title))return v2221InfoboxResolveNative(parsed,registry,sourceWiki);
 if(sourceWiki==='pt')return {status:'invalid-context',reason:'source-wiki',candidates:[],parsed};
 if(validated.eligibleTitles&&!validated.eligibleTitles.includes(parsed.title))return {status:'unmapped',reason:'outside-prefetched-title-scope',candidates:[],parsed};
 if(registry.invalidNative.has(parsed.title))return {status:'invalid-contract',reason:'unproved-native-identity',candidates:[],parsed};
 const matches=(registry.index.get(parsed.title)||[]).filter(r=>V2221_INFOBOX_WIKIS.has(r.source.wiki)&&(sourceWiki===undefined||r.source.wiki===sourceWiki));
 const invalid=(registry.invalid.get(parsed.title)||[]).filter(r=>r.source.wiki!=='pt'&&(sourceWiki===undefined||r.source.wiki===sourceWiki));
 if(invalid.length)return {status:'invalid-contract',reason:'matching-invalid-record',candidates:invalid.map(x=>x.id),parsed};
 if(!matches.length)return {status:'unmapped',reason:'no-exact-source-contract',candidates:[],parsed};
 if(matches.some(r=>r.state!=='active'))return {status:'unresolved',reason:'matching-unverified-source',candidates:matches.map(r=>r.id),parsed};
 return {status:'ready',reason:'source-contracts-found',candidates:matches.map(r=>r.id),parsed,records:matches,snapshotId:validated.snapshotId};
}
function v2221InfoboxValue(field,value,positional){
 if(field.transform==='identity')return {valid:true,value};
 const lead=positional?'':value.match(/^[ \t\r\n]*/)[0],tail=positional||lead.length===value.length?'':value.match(/[ \t\r\n]*$/)[0],core=positional?value:value.slice(lead.length,value.length-tail.length);
 if(field.transform==='literal-map')return Object.hasOwn(field.values,core)?{valid:true,value:lead+field.values[core]+tail}:{valid:false,reason:'unmapped-literal-value'};
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(core);if(!match)return {valid:false,reason:'non-iso-date'};
 const y=Number(match[1]),m=Number(match[2]),d=Number(match[3]),leap=y%4===0&&(y%100!==0||y%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(y<1||m<1||m>12||d<1||d>days[m-1])return {valid:false,reason:'invalid-calendar-date'};
 const months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
 return {valid:true,value:lead+d+' de '+months[m-1]+' de '+y+tail};
}
function v2221InfoboxCompoundValue(compound,fields){
 if(fields.some(field=>field.positional))return {valid:false,reason:'compound-positional-input'};
 if(fields.some(field=>!v2221InfoboxTrim(field.value)))return {valid:false,reason:'compound-empty-input'};
 if(compound.transform==='join-exact')return {valid:true,value:fields.map(field=>compound.transformEvidence.whitespace==='named-margin'?v2221InfoboxTrim(field.value):field.value).join(compound.transformEvidence.separator)};
 const parts=Object.create(null);for(let i=0;i<fields.length;i++)parts[compound.sources[i].component]=v2221InfoboxTrim(fields[i].value);
 if(!/^\d{1,4}$/.test(parts.year)||!/^\d{1,2}$/.test(parts.month)||!/^\d{1,2}$/.test(parts.day))return {valid:false,reason:'compound-numeric-date'};
 const value=v2221InfoboxValue({transform:'date-ymd-to-dmy'},parts.year.padStart(4,'0')+'-'+parts.month.padStart(2,'0')+'-'+parts.day.padStart(2,'0'),false);if(!value.valid)return value;
 const anchor=fields[0].value,lead=anchor.match(/^[ \t\r\n]*/)[0],tail=anchor.match(/[ \t\r\n]*$/)[0];
 return {valid:true,value:lead+value.value+tail};
}
function v2221InfoboxLiteralNonempty(value){
 const core=v2221InfoboxTrim(value);
 return !!core&&!/[{}\[\]<>|\r\n]/.test(core)&&!core.includes("''")&&!/&(?:#(?:x[0-9a-f]+|\d+)|[a-z][a-z0-9]+);/i.test(core);
}
function v2221InfoboxPreconditions(parsed,record){
 const pc=record.preconditions||{},keys=new Set(parsed.fields.map(field=>field.key));
 if((pc.requiredKeys||[]).some(key=>!keys.has(key)))return {valid:false,reason:'required-source-key'};
 if((pc.forbiddenKeys||[]).some(key=>keys.has(key)))return {valid:false,reason:'forbidden-source-key'};
 for(const key of pc.literalNonemptyKeys||[]){const field=parsed.fields.find(x=>x.key===key);if(!field||!v2221InfoboxLiteralNonempty(field.value))return {valid:false,reason:'literal-nonempty-source-key',key};}
 for(const key of pc.literalNonemptyWhenPresentKeys||[]){const field=parsed.fields.find(x=>x.key===key);if(field&&!v2221InfoboxLiteralNonempty(field.value))return {valid:false,reason:'literal-nonempty-source-key',key};}
 for(const key of pc.bareFileKeys||[]){const field=parsed.fields.find(x=>x.key===key),core=field&&v2221InfoboxTrim(field.value);if(core&&(!v2221InfoboxLiteralNonempty(core)||/[:]/.test(core)||!/\.(?:jpe?g|png|svg|gif|webp|tiff?|pdf|djvu)$/i.test(core)))return {valid:false,reason:'bare-file-source-key',key};}
 for(const[key,required]of Object.entries(pc.requiresNonemptyWhenPresent||{})){const field=parsed.fields.find(x=>x.key===key);if(field&&v2221InfoboxTrim(field.value)&&required.some(other=>!parsed.fields.some(x=>x.key===other&&v2221InfoboxTrim(x.value))))return {valid:false,reason:'conditionally-required-source-key',key};}
 for(const group of pc.mutuallyExclusiveNonempty||[])if(parsed.fields.filter(field=>group.includes(field.key)&&v2221InfoboxTrim(field.value)).length>1)return {valid:false,reason:'mutually-exclusive-nonempty-source-keys',key:group.join(',')};
 for(const field of parsed.fields)if(pc.sourceValues?.[field.key]&&!pc.sourceValues[field.key].includes(field.positional?field.value:v2221InfoboxTrim(field.value)))return {valid:false,reason:'source-value-precondition',key:field.key};
 return {valid:true};
}
function v2221InfoboxCandidate(raw,parsed,record){
 const pc=record.preconditions||{},keys=new Set(),targets=new Set(),roles=new Set(),edits=[],compoundKeys=new Set((record.compounds||[]).flatMap(x=>x.sources.map(y=>y.key)));let removed=0;
 for(const field of parsed.fields){if(keys.has(field.key))return {valid:false,reason:'duplicate-source-key'};keys.add(field.key);}
 const preconditions=v2221InfoboxPreconditions(parsed,record);if(!preconditions.valid)return preconditions;
 for(const field of parsed.fields){
  const core=field.positional?field.value:v2221InfoboxTrim(field.value);
  if(pc.sourceValues?.[field.key]&&!pc.sourceValues[field.key].includes(core))return {valid:false,reason:'source-value-precondition',key:field.key};
  const map=record.fields[field.key];if(!map){if(compoundKeys.has(field.key))continue;return {valid:false,reason:'unmapped-source-key',key:field.key};}
  if(targets.has(map.target))return {valid:false,reason:'target-key-collision',key:field.key};targets.add(map.target);
  if(roles.has(map.evidence.role))return {valid:false,reason:'target-role-collision',key:field.key};roles.add(map.evidence.role);
  if(field.positional&&pc.positional!=='mapped')return {valid:false,reason:'unproved-positional-field',key:field.key};
  if(V2221_INFOBOX_EMBED_KEYS.has(field.key)||V2221_INFOBOX_EMBED_KEYS.has(map.target)){
   const inactive=pc.inactiveEmbedValues?.[field.key]||[''];if(!inactive.includes(core)&&record.proof.embedding!=='equivalent')return {valid:false,reason:'unproved-embedding-mode',key:field.key};
  }
  if(field.positional&&map.target!==field.key&&map.evidence.positionalWhitespace!=='trim-equivalent')return {valid:false,reason:'positional-whitespace-contract',key:field.key};
  const value=v2221InfoboxValue(map,field.value,field.positional);if(!value.valid)return {valid:false,reason:value.reason,key:field.key};
  if(field.positional&&map.target!==field.key)edits.push({start:field.keyStart,end:field.keyEnd,before:'',text:map.target+'=',kind:'parameter',sourceKey:field.key,targetKey:map.target,count:1});
  else if(!field.positional&&field.key!==map.target)edits.push({start:field.keyStart,end:field.keyEnd,before:raw.slice(field.keyStart,field.keyEnd),text:map.target,kind:'parameter',sourceKey:field.key,targetKey:map.target,count:1});
  if(value.value!==field.value)edits.push({start:field.valueStart,end:field.valueEnd,before:field.value,text:value.value,kind:'value',sourceKey:field.key,targetKey:map.target,transform:map.transform,count:1});
 }
 for(const compound of record.compounds||[]){
  const fields=compound.sources.map(input=>parsed.fields.find(field=>field.key===input.key)),present=fields.filter(Boolean).length;
  if(!present)continue;if(present!==fields.length)return {valid:false,reason:'compound-partial-input',key:compound.id};
  if(targets.has(compound.target))return {valid:false,reason:'target-key-collision',key:compound.id};targets.add(compound.target);
  if(roles.has(compound.evidence.role))return {valid:false,reason:'target-role-collision',key:compound.id};roles.add(compound.evidence.role);
  for(const field of fields)if(V2221_INFOBOX_EMBED_KEYS.has(field.key)&&!['',...(pc.inactiveEmbedValues?.[field.key]||[])].includes(v2221InfoboxTrim(field.value))&&record.proof.embedding!=='equivalent')return {valid:false,reason:'unproved-embedding-mode',key:field.key};
  const value=v2221InfoboxCompoundValue(compound,fields);if(!value.valid)return {valid:false,reason:value.reason,key:compound.id};
  if(V2221_INFOBOX_EMBED_KEYS.has(compound.target)&&v2221InfoboxTrim(value.value)&&record.proof.embedding!=='equivalent')return {valid:false,reason:'unproved-embedding-mode',key:compound.id};
  const anchor=fields[0],metadata={compoundId:compound.id,sourceKeys:compound.sources.map(x=>x.key),targetKey:compound.target,consumedRawSpans:fields.map(field=>({key:field.key,start:field.valueStart,end:field.valueEnd,before:field.value}))};
  if(anchor.key!==compound.target)edits.push({start:anchor.keyStart,end:anchor.keyEnd,before:raw.slice(anchor.keyStart,anchor.keyEnd),text:compound.target,kind:'parameter',sourceKey:anchor.key,count:1,...metadata});
  if(anchor.value!==value.value)edits.push({start:anchor.valueStart,end:anchor.valueEnd,before:anchor.value,text:value.value,kind:'value',sourceKey:anchor.key,transform:compound.transform,count:1,...metadata});
  for(const field of fields.slice(1)){edits.push({start:field.start-1,end:field.end,before:raw.slice(field.start-1,field.end),text:'',kind:'compound-parameter',sourceKey:field.key,count:1,...metadata});removed++;}
 }
 const target=v2221InfoboxTitle(record.target.title);
 if(record.mode!=='native-repair'&&raw.slice(parsed.headerStart,parsed.headerEnd)!==target)edits.push({start:parsed.headerStart,end:parsed.headerEnd,before:raw.slice(parsed.headerStart,parsed.headerEnd),text:target,kind:'owner',count:1});
 edits.sort((a,b)=>a.start-b.start||a.end-b.end);let previous=-1;
 for(const e of edits){if(e.start<previous||raw.slice(e.start,e.end)!==e.before)return {valid:false,reason:'overlapping-edits'};previous=e.end;}
 let text=raw;for(const edit of edits.slice().reverse())text=text.slice(0,edit.start)+edit.text+text.slice(edit.end);
 const after=v2221InfoboxRead(text);if(!after||after.fields.length!==parsed.fields.length-removed)return {valid:false,reason:'output-interface'};
 const semanticProjection=parsed.fields.map(field=>{const map=record.fields[field.key];if(map)return {key:field.key,sourceRole:map.evidence.role,target:map.target,targetRole:map.evidence.role,transform:map.transform};const compound=(record.compounds||[]).find(x=>x.sources.some(input=>input.key===field.key)),input=compound.sources.find(x=>x.key===field.key);return {key:field.key,sourceRole:input.evidence.role,target:compound.target,targetRole:compound.evidence.role,transform:compound.transform,component:input.component||null};});
 return {valid:true,text,edits,count:edits.reduce((n,e)=>n+e.count,0),recordId:record.id,semanticProjection,evidence:v2221InfoboxCanonical(record)};
}
function v2221InfoboxMigrate(raw,catalog,context={}){
 const base={source:raw,text:raw,edits:[],count:0,offsetUnits:'utf16',status:'unchanged'};
 for(const key of ['multilingual','infoboxes','automaticParameterNames'])if(v2221InfoboxOwn(context,key)===false)return {...base,status:'disabled',reason:key};
 const resolved=v2221InfoboxResolve(raw,catalog,context);if(resolved.status!=='ready')return {...base,status:resolved.status,reason:resolved.reason,candidates:resolved.candidates};
 if(v2221InfoboxOwn(context,'embedded')===true&&[...resolved.records,...(resolved.authorizers||[])].some(record=>record.proof.embedding!=='equivalent'))return {...base,status:'preserved',reason:'unproved-embedded-context',candidates:resolved.candidates};
 if((resolved.authorizers||[]).some(record=>!v2221InfoboxPreconditions(resolved.parsed,record).valid))return {...base,status:'preserved',reason:'native-wrapper-authorizer-precondition',candidates:resolved.candidates};
 const candidates=resolved.records.map(record=>v2221InfoboxCandidate(raw,resolved.parsed,record));
 if(candidates.some(x=>!x.valid))return {...base,status:'preserved',reason:'source-precondition',candidates:resolved.candidates,refusals:candidates.filter(x=>!x.valid).map(x=>({reason:x.reason,key:x.key||null}))};
 const selected=candidates[0];if(candidates.some(x=>x.text!==selected.text||v2221InfoboxCanonical(x.edits)!==v2221InfoboxCanonical(selected.edits)||v2221InfoboxCanonical(x.semanticProjection)!==v2221InfoboxCanonical(selected.semanticProjection)))return {...base,status:'ambiguous',reason:'source-contracts-disagree',candidates:resolved.candidates};
 return {...base,text:selected.text,edits:selected.edits,count:selected.count,status:selected.text===raw?'unchanged':'converted',proof:{snapshotId:resolved.snapshotId,sourceWiki:v2221InfoboxOwn(context,'sourceWiki')||null,placement:v2221InfoboxOwn(context,'embedded')===true?'embedded':'standalone',recordIds:resolved.candidates,contracts:candidates.map(x=>x.evidence),authorizers:(resolved.authorizers||[]).map(v2221InfoboxCanonical),semanticProjection:selected.semanticProjection,source:raw,output:selected.text}};
}
function v2221InfoboxProof(before,after,plan,catalog,context={}){
 if(!plan||plan.source!==before||plan.text!==after)return false;
 const fresh=v2221InfoboxMigrate(before,catalog,context);
 return fresh.text===after&&fresh.status===plan.status&&fresh.count===plan.count&&v2221InfoboxCanonical(fresh.edits)===v2221InfoboxCanonical(plan.edits)&&v2221InfoboxCanonical(fresh.proof||null)===v2221InfoboxCanonical(plan.proof||null);
}
