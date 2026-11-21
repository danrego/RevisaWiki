// Bounded native-reader repairs; an opaque neighboring field is never discarded.
const V2221_FOCUSED = V222_CATALOG.focusedInfoboxes || {schema:1,keyRules:[],genericLabelOwners:[],websiteOwners:{},occupationKeys:[],topicBoxes:{},stubs:[],preserveFilledObsolete:{}};

function v2221FocusedScope(source,cfg={}) {
 return v222Scope(source,cfg)&&(cfg.namespaceNumber===0||v2215ArticleDraftContext(cfg,source))&&!cfg.pageRedirect&&!cfg.pageDisambiguation;
}
function v2221FocusedOwner(raw) {
 const parsed=v2221InfoboxRead(raw);if(!parsed)return null;
 const profile=INFOBOX_CATALOG[nameOf(parsed.title)],native=V2221_FOCUSED.nativePins?.['Predefinição:'+parsed.title];
 if(profile&&v2221InfoboxTitle(profile.title)===parsed.title||native&&v2221InfoboxPin(native))return {title:parsed.title,parsed,profile};
 return null;
}
function v2221FocusedNodes(source,cfg={}) {
 if(!v2221FocusedScope(source,cfg))return [];
 const shield=v222Protected(source),refs=v219NativeReferenceObserver(source).refs;
 return v24SyntaxTemplates(shield.view).nodes.filter(node=>node.size===2&&!refs.some(ref=>ref.start<=node.start&&node.end<=ref.end)).sort((a,b)=>a.start-b.start||b.end-a.end);
}
function v2221FocusedInfoboxSpacingValue(value) {
 const core=v2221InfoboxTrim(value);if(!core)return '';
 return /^[ \t]*\r?\n/.test(value)?value.replace(/[ \t\r\n]+$/,''):' '+core;
}
// Interpret only the ASCII margin of a named value, keeping every raw offset.
// A formatting space after '=' is not an article-level preformatted block.
function v2221FocusedValueView(value,omitReferences=false) {
 const margin=/^[ \t\r\n]*/.exec(value)[0].length;
 const view=' '.repeat(margin)+v222Protected(value.slice(margin)).view;
 return omitReferences?v24SyntaxMaskRanges(view,refTokens(view)):view;
}
function v2221FocusedInfoboxFormat(raw,cfg={}) {
 if(cfg.infoboxes===false||cfg.infoboxAlignment===false||cfg.alignInfoboxParameters===false||cfg.automaticFieldSyntax===false)return null;
 const owner=v2221FocusedOwner(raw);if(!owner)return null;
 const fields=owner.parsed.fields;if(!fields.length||fields.some(field=>field.positional)||new Set(fields.map(field=>field.key)).size!==fields.length)return null;
 const width=Math.max(22,...fields.map(field=>Array.from(field.key).length+1));if(width>80)return null;
 const eol=raw.includes('\r\n')?'\r\n':'\n';let count=0;
 const parts=fields.map(field=>{
  const text='|'+field.key+' '.repeat(width-Array.from(field.key).length)+'='+v2221FocusedInfoboxSpacingValue(field.value)+eol;
  if(raw.slice(field.start-1,field.end).replace(/\r?\n[ \t]*$/,'')!==text.replace(/\r?\n$/,''))count++;
  return text;
 });
 const text='{{'+owner.parsed.literal+eol+parts.join('')+'}}';if(text===raw)return null;
 if(!/\r?\n[ \t]*\}\}$/.test(raw))count++;
 return {text,count:Math.max(1,count)};
}
function v2221FocusedBiographyConflict(source,cfg={}) {
 if(cfg.v2221KnownNonhumanSubject===true)return true;
 if(typeof source!=='string')return false;
 const lead=v222InferenceOpening(source);
 return /^(?:é|foi|era|são|foram)[ \t]+(?:um|uma|uns|umas|o|a)?[ \t]*(?:(?:modelo|tipo|família|familia|sistema)[ \t]+de[ \t]+)?(?:radar(?:es)?|equipamento(?:s)?|dispositivo(?:s)?|satélite(?:s)?|míssil|mísseis|foguete(?:s)?|sonda espacial|helicóptero(?:s)?|aeronave(?:s)?|navio(?:s)?|software|programa de computador|linguagem de programação|empresa|organização|banda|grupo étnico|povo|etnia|personagem fictíci[oa]|cavalo|cão|animal|planta)(?=[ \t.,;:!?]|$)/iu.test(lead);
}
function v2221FocusedAlbumConflict(source) {
 const opening=v222InferenceOpening(source);
 return /^(?:é|foi|era|são|foram)[ \t]+(?:(?:um|uma|o|a)[ \t]+)?(?:álbum|album)[ \t]+(?:fotográfic[oa]|de[ \t]+(?:fotografias|fotos|figurinhas|cromos|banda desenhada|histórias em quadrinhos))(?=[ \t.,;:!?]|$)/iu.test(opening);
}
function v2221FocusedPersonOwner(box) {
 if(!box||typeof box.raw!=='string')return false;const owner=v2221FocusedOwner(box.raw);
 return !!owner&&(V2221_FOCUSED.personOwners||[]).some(row=>row.owner===owner.title&&v2221InfoboxPin(row.native));
}
function v2221FocusedOccupation(value) {
 const view=v2221FocusedValueView(value),edits=[],refs=v219NativeReferenceObserver(value).refs;
 for(const match of view.matchAll(/\[\[([^\[\]|{}\r\n]+)\|([^\[\]{}\r\n]+)\]\]/g)){
  if(refs.some(ref=>ref.start<=match.index&&match.index<ref.end))continue;
  const label=match[2],lower=label[0]?.toLocaleLowerCase('pt')+label.slice(1);
  if(!label||lower===label||!COMMON_OCCUPATIONS.has(norm(label)))continue;
  const start=match.index+2+match[1].length+1;edits.push({start,end:start+label.length,text:lower,count:1});
 }
 return {text:v24SyntaxApply(value,edits),count:edits.length};
}
function v2221FocusedImdbRetained(value,source) {
 const core=v2221InfoboxTrim(value),match=/^(?:tt)?(\d{7,9})$/.exec(core);if(!match)return null;
 const wanted='tt'+match[1],view=v222InferenceView(source);
 for(const link of view.matchAll(/\[https?:\/\/(?:www\.)?imdb\.com\/title\/(tt\d{7,9})(?:\/|(?=[ ?#\]]))[^\]\r\n]*\]/g))if(link[1]===wanted&&v222InferenceTop(source,link.index))return {start:link.index,end:link.index+link[0].length,text:source.slice(link.index,link.index+link[0].length),identifier:wanted};
 return null;
}
function v2221FocusedInfoboxTransform(raw,source,cfg={},depth=0) {
 if(depth>12)return null;const owner=v2221FocusedOwner(raw);if(!owner)return null;
 if(cfg.automaticParameterNames!==false&&cfg.multilingual!==false)for(const rule of V2221_FOCUSED.literalNameRedirects||[]){
  if(owner.title!==rule.owner||!v2221InfoboxPin(rule.nativeAlias)||!v2221InfoboxPin(rule.targetNative)||owner.parsed.fields.length!==1)continue;
  const field=owner.parsed.fields[0],value=v2221InfoboxTrim(field.value);
  if(field.positional||field.key!==rule.sourceKey||field.value.length>1024||!v2221InfoboxLiteralNonempty(field.value)||/[\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\ufeff\uE000-\uF8FF]/u.test(value))continue;
  const next=v24SyntaxApply(raw,[{start:owner.parsed.headerStart,end:owner.parsed.headerEnd,text:rule.targetOwner},{start:field.keyStart,end:field.keyEnd,text:rule.targetKey}]),formatted=v2221FocusedInfoboxTransform(next,source,cfg,depth+1);
  return {text:formatted?.text||next,count:2+(formatted?.count||0)};
 }
 const fields=owner.parsed.fields,edits=[];let count=0;
 const add=(start,end,text,kind,proof,n=1)=>{if(raw.slice(start,end)!==text){edits.push({start,end,text,kind,proof});count+=n;}};
 if(cfg.automaticParameterNames!==false&&cfg.multilingual!==false){
  for(const rule of V2221_FOCUSED.keyRules||[]){
   if(owner.title!==rule.owner||!v2221InfoboxPin(rule.native))continue;
   const found=fields.filter(field=>!field.positional&&field.key===rule.source);if(found.length!==1||fields.some(field=>field!==found[0]&&rule.conflicts.includes(field.key)))continue;
   if(rule.literalNonempty&&!v2221InfoboxLiteralNonempty(found[0].value))continue;
   const field=found[0];add(field.keyStart,field.keyEnd,rule.target,'typed-native-field',{owner:owner.title,sourceKey:field.key,targetKey:rule.target,native:rule.native});
  }
  if((V2221_FOCUSED.genericLabelOwners||[]).includes(owner.title))for(const field of fields){
   const match=/^rotulo([1-9]\d*)$/.exec(field.key);if(!match||Number(match[1])>V2221_FOCUSED.genericLabelMaxIndex||fields.filter(x=>x.key===field.key).length!==1)continue;
   const target='rótulo'+match[1];if(fields.some(x=>x.key===target))continue;
   add(field.keyStart,field.keyEnd,target,'typed-generic-label',{owner:owner.title,sourceKey:field.key,targetKey:target});
  }
 }
 const obsolete=V2221_FOCUSED.preserveFilledObsolete?.[owner.title]||[];
 for(const field of fields){
  if(field.positional||fields.filter(x=>x.key===field.key).length!==1)continue;
  if(obsolete.includes(field.key)){
   const empty=!v2221InfoboxTrim(field.value),retained=!empty&&owner.title==='Info/Filme'?v2221FocusedImdbRetained(field.value,source):null;
   if(empty||retained)add(field.start-1,field.end,'','obsolete-native-field-with-preservation',{owner:owner.title,sourceKey:field.key,retained});
   continue;
  }
  let value=field.value,changes=0;
  if(cfg.automaticBiographyFields!==false&&(V2221_FOCUSED.occupationKeys||[]).includes(field.key)&&owner.profile?.accepted.includes(field.key)&&!(owner.profile.ignored||[]).includes(field.key)&&v2217VerifiedPersonBox({name:nameOf(owner.title),raw})){
   const occupation=v2221FocusedOccupation(value);value=occupation.text;changes+=occupation.count;
  }
  if(cfg.automaticInfoboxValues!==false&&(V2221_FOCUSED.websiteOwners?.[owner.title]||[]).includes(field.key)){
   const fixed=v28BiographyWebsiteValue(value);if(fixed){value=value.slice(0,fixed.start)+fixed.text+value.slice(fixed.end);changes++;}
  }
  const nested=v24SyntaxTemplates(v2221FocusedValueView(value)).nodes.filter(node=>node.size===2&&!v219NativeReferenceObserver(value).refs.some(ref=>ref.start<=node.start&&node.end<=ref.end)),local=[];
  for(const node of nested){if(nested.some(parent=>parent!==node&&parent.start<node.start&&node.end<parent.end))continue;const repaired=v2221FocusedInfoboxTransform(value.slice(node.start,node.end),source,cfg,depth+1);if(repaired){local.push({start:node.start,end:node.end,text:repaired.text});changes+=repaired.count;}}
  if(local.length)value=v24SyntaxApply(value,local);
  if(value!==field.value)add(field.valueStart,field.valueEnd,value,'typed-native-value',{owner:owner.title,key:field.key},changes||1);
 }
 let text=v24SyntaxApply(raw,edits);const formatted=v2221FocusedInfoboxFormat(text,cfg);if(formatted){text=formatted.text;count+=formatted.count;}
 return text===raw?null:{text,count:Math.max(1,count)};
}
function v2221FocusedInfoboxPlan(source,cfg={}) {
 const edits=[];if(!v2221FocusedScope(source,cfg)||cfg.infoboxes===false)return v222EditsPlan(source,edits);
 const nodes=v2221FocusedNodes(source,cfg),owners=nodes.filter(node=>v2221FocusedOwner(source.slice(node.start,node.end)));
 for(const node of owners){
  if(edits.some(edit=>edit.start<=node.start&&node.end<=edit.end))continue;
  if(owners.some(parent=>parent.start<node.start&&node.end<parent.end))continue;
  const raw=source.slice(node.start,node.end),next=v2221FocusedInfoboxTransform(raw,source,cfg);if(next)edits.push({start:node.start,end:node.end,text:next.text,count:next.count,kind:'focused-native-infobox',proof:{owner:v2221InfoboxRead(raw)?.title,sourceHash:v24SyntaxHash(raw)}});
 }
 return v222EditsPlan(source,edits);
}
function v2221FocusedInfoboxProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221FocusedInfoboxPlan);}
function v2221FocusedPortalCandidates(source,cfg={}) {
 if(!v222InferenceScope(source,cfg)||cfg.portals===false||cfg.endMatter===false||cfg.automaticTopicPortals===false)return [];
 const nodes=v2221FocusedNodes(source,cfg),first=source.search(/^==/m),top=nodes.filter(node=>!nodes.some(parent=>parent.start<node.start&&node.end<parent.end)&&v222InferenceTop(source,node.start)&&(first<0||node.start<first)),boxes=top.map(node=>({node,raw:source.slice(node.start,node.end),owner:v2221FocusedOwner(source.slice(node.start,node.end))})).filter(row=>row.owner&&v2217StandaloneInfobox(row.raw));
 const candidates=[];
 if(boxes.length===1){
  const box=boxes[0],title=box.owner.title;
  if(!v2221FocusedBiographyConflict(source,cfg)&&!(title==='Info/Álbum'&&v2221FocusedAlbumConflict(source)))for(const portal of V2221_FOCUSED.topicBoxes?.[title]||[])candidates.push({portal,kind:'native-box-theme',owner:title});
  if(title==='Info/Filme')for(const field of box.owner.parsed.fields.filter(field=>(V2221_FOCUSED.filmCountryKeys||[]).includes(field.key)&&field.value.trim())){
   if(box.owner.parsed.fields.filter(other=>other.key===field.key).length!==1)continue;
   for(const portal of v2217CountryValues(field.value,true))candidates.push({portal,kind:'native-film-production-country',owner:title,field:field.key});
  }
 }
 const allTop=nodes.filter(node=>!nodes.some(parent=>parent.start<node.start&&node.end<parent.end)&&v222InferenceTop(source,node.start)),stubs=allTop.map(node=>({node,parsed:v2221InfoboxRead(source.slice(node.start,node.end))})).filter(row=>row.parsed&&/^Esboço(?:-|$)/.test(row.parsed.title));
 if(stubs.length===1&&!stubs[0].parsed.fields.length){const stub=V2221_FOCUSED.stubs.find(row=>row.owner===stubs[0].parsed.title);if(stub)candidates.push({portal:stub.portal,kind:'verified-existing-stub-theme',owner:stub.owner,native:{revision:stub.revision,sha256:stub.sha256}});}
 const seen=new Set();return candidates.filter(row=>{const target=v222InferencePortalIdentity(row.portal);if(target.startsWith('unverified:')||seen.has(target)||!v222InferencePortalAvailable(source,cfg,target))return false;seen.add(target);return true;});
}
function v2221FocusedPortalRequests(source,cfg={}) {return v2221FocusedPortalCandidates(source,{...cfg,v2212PortalProofRequired:false}).map(row=>row.portal);}
function v2221FocusedPortalsPlan(source,cfg={}) {
 const edits=[],desired=v2221FocusedPortalCandidates(source,cfg);if(!desired.length)return v222EditsPlan(source,edits);
 const view=v222InferenceView(source),nodes=v24SyntaxTemplates(view).nodes.filter(node=>node.size===2&&v222InferenceTop(source,node.start)),portals=nodes.map(node=>({node,raw:source.slice(node.start,node.end)})).filter(row=>['Portal','Portal2','Portal3'].includes(v2221InfoboxRead(row.raw)?.title));
 const seen=new Set();let first=null;
 for(const row of portals){const slots=biographyPortalSlots(row.raw);if(slots.unsafe)return v222EditsPlan(source,[]);const args=[...slots.slots].sort((a,b)=>a[0]-b[0]).map(([,field])=>field.value.trim());if(args.some(arg=>!arg||/[{}<>\r\n]/.test(arg)))return v222EditsPlan(source,[]);for(const arg of args)seen.add(v222InferencePortalIdentity(arg));if(!first)first={...row,args};}
 const existing=portals.flatMap(row=>[...biographyPortalSlots(row.raw).slots.values()].map(field=>field.value.trim()));
 const added=desired.filter(row=>!seen.has(v222InferencePortalIdentity(row.portal))&&!v222InferenceCountryCovered(row.portal,existing.concat(desired.map(candidate=>candidate.portal))));if(!added.length)return v222EditsPlan(source,[]);
 if(first){const selected=added.slice(0,Math.max(0,10-first.args.length));if(selected.length)edits.push({start:first.node.start,end:first.node.end,text:'{{Portal3|'+first.args.concat(selected.map(row=>row.portal)).join('|')+'}}',count:selected.length,kind:'focused-verified-portals',proof:selected});}
 else {const at=v222InferenceFooterPoint(source,v222InferenceCategories(source));if(at===null||!v222InferenceTop(source,at))return v222EditsPlan(source,[]);const prefix=source.slice(0,at),suffix=source.slice(at),tail=!suffix.trim(),before=!prefix?'':/\r?\n[ \t]*\r?\n$/.test(prefix)?'':/\r?\n$/.test(prefix)?'\n':'\n\n',after=tail?'\n':/^\r?\n[ \t]*\r?\n/.test(suffix)?'':/^\r?\n/.test(suffix)?'\n':'\n\n';edits.push({start:at,end:tail?source.length:at,text:before+'{{Portal3|'+added.map(row=>row.portal).join('|')+'}}'+after,count:added.length,kind:'focused-verified-portals',proof:added});}
 return v222EditsPlan(source,edits);
}
function v2221FocusedPortalsProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221FocusedPortalsPlan);}

// The field rename and its newly required Cite collector are one dependency.
// A parameter name alone never proves that a reference will be displayed.
function v2221FocusedReferenceRedirect(owner,native,key,proofs=V2221_FOCUSED.nativeReferenceRedirects||[]) {
 if(!['Info/Cientista','Info/Escritor'].includes(owner)||native?.title!=='Predefinição:Info/Biografia'||!Array.isArray(proofs)||!(V2221_FOCUSED.nativeReferenceConsumers||[]).some(row=>row.owner==='Info/Biografia'&&row.key===key&&v2221InfoboxSamePin(row.native,native)))return null;
 const rows=proofs.filter(row=>row?.source?.title==='Predefinição:'+owner);if(rows.length!==1)return null;
 const row=rows[0],sourcePin=V2221_FOCUSED.nativeReferenceRedirectPins?.[row.source.title],targetPin=V2221_FOCUSED.nativePins?.[native.title];
 if(row.status!=='verified'||row.sourceText!=='#REDIRECIONAMENTO [[Predefinição:Info/Biografia]]'||row.target?.title!==native.title||!v2221InfoboxSamePin(row.source,sourcePin)||!v2221InfoboxSamePin(row.target,targetPin)||!v2221InfoboxSamePin(row.target,native)||!Array.isArray(row.keys)||new Set(row.keys).size!==row.keys.length||!row.keys.includes(key)||!row.keys.every(k=>(V2221_FOCUSED.nativeReferenceConsumers||[]).some(item=>item.owner==='Info/Biografia'&&item.key===k&&v2221InfoboxSamePin(item.native,native)))||!Array.isArray(row.chain)||row.chain.length!==1||row.chain[0]!==native.title)return null;
 return JSON.parse(JSON.stringify(row));
}
// These finite reader contracts describe how the current native owner consumes
// a value. A field name, a date-looking label or an accepted-key list is no proof.
function v2221FocusedBranchTruth(value) {
 const unknown={state:'unknown',literal:null};
 if(typeof value!=='string'||/[\u0000-\u0008\u000e-\u001f\u007f]/.test(value))return unknown;
 const pieces=[];let cursor=0;
 for(let start=value.indexOf('<!--');start>=0;start=value.indexOf('<!--',cursor)){const end=value.indexOf('-->',start+4);if(end<0)return unknown;pieces.push(value.slice(cursor,start));cursor=end+3;}
 pieces.push(value.slice(cursor));const text=pieces.join('');
 const ranges=[];let opaque=false,knownNowiki=false;
 for(let i=0;i<text.length;){
  if(text.startsWith('-->',i))return unknown;
  const tag=v2221InfoboxTagAt(text,i);
  if(tag){if(tag.invalid||tag.close)return unknown;const end=tag.self?tag.end:v2221InfoboxExtensionEnd(text,tag);if(end===null)return unknown;
   if(text.slice(i,end)==='<nowiki/>')knownNowiki=true;else opaque=true;
   ranges.push({start:i,end});i=end;continue;
  }
  if(text[i]==='<'&&/^<\s*\/?[A-Za-z!]/.test(text.slice(i)))return unknown;
  i++;
 }
 let view=v24SyntaxMaskRanges(text,ranges);const parsed=v24SyntaxTemplates(view);
 if(parsed.unclosed.length)return unknown;
 const programs=parsed.nodes.filter(node=>node.depth===0);if(programs.length)opaque=true;
 view=v24SyntaxMaskRanges(view,programs);
 const magic=[...view.matchAll(/__[\p{L}_]+__/gu)].map(match=>({start:match.index,end:match.index+match[0].length}));if(magic.length)opaque=true;
 view=v24SyntaxMaskRanges(view,magic);
 const literal=v2221InfoboxTrim(view),visible=literal.replace(/[\s\u200b-\u200f\u2060-\u206f\ufeff]/gu,'');
 if(knownNowiki||visible)return {state:'true',literal:opaque||knownNowiki?null:literal};
 if(literal||opaque)return unknown;
 return {state:'false',literal:''};
}
function v2221FocusedReferenceKeyParity(row,box,parsed=null) {
 const native=parsed||v2221InfoboxRead(box.raw);if(!native||native.title!==box.name||native.fields.length!==box.fields.length)return false;
 if(!Array.isArray(row.sourceKeys)||row.aliases&&!Array.isArray(row.aliases)||row.forbiddenNonemptyKeys&&!Array.isArray(row.forbiddenNonemptyKeys))return false;
 const c=row.reader.conditions||{};if(c.absentKeys&&!Array.isArray(c.absentKeys)||c.emptyOrAbsentKeys&&!Array.isArray(c.emptyOrAbsentKeys))return false;
 const relevant=new Set([row.key,...row.sourceKeys,...row.aliases||[],...row.forbiddenNonemptyKeys||[],...c.absentKeys||[],...c.emptyOrAbsentKeys||[]]);
 for(const name of ['anyNonempty','selectedNonempty','firstNonempty']){if(c[name]&&!Array.isArray(c[name]))return false;for(const group of c[name]||[])if(Array.isArray(group))for(const key of group)relevant.add(key);}
 if(c.literalEqualsOrAbsent&&!Array.isArray(c.literalEqualsOrAbsent))return false;
 for(const test of c.literalEqualsOrAbsent||[])if(test&&typeof test.key==='string')relevant.add(test.key);
 return native.fields.every((field,index)=>field.key===box.fields[index].key||!relevant.has(field.key)&&!relevant.has(box.fields[index].key));
}
function v2221FocusedReferenceConsumer(row,box,field=null,parsed=null) {
 const roles=['direct-visible-infobox-data-text','direct-visible-table-cell-text','direct-visible-native-text','conditional-visible-native-text','nested-visible-native-text','native-caption-reference-registration','native-number-reference-text','native-selector-reference-text'];
 if(!row||!roles.includes(row.role)||row.reader?.literalDefaultRefs!==true||!['first','first-present','first-nonempty','independent'].includes(row.reader.priority)||!v2221InfoboxPin(row.native)||row.native.title!=='Predefinição:'+row.owner)return false;
 if(row.sourceOwners&&(!Array.isArray(row.sourceOwners)||!row.sourceOwners.length||!row.sourceOwners.includes(box.name)||row.sourceOwners.some(owner=>typeof owner!=='string'||owner!==row.owner&&!v2221FocusedReferenceRedirect(owner,row.native,row.key))))return false;
 const conditions=row.reader.conditions||{},keys=name=>Array.isArray(conditions[name])&&conditions[name].every(k=>typeof k==='string'&&k.length),values=key=>box.fields.filter(item=>item.key===key),truth=key=>{const items=values(key);return items.length===1?v2221FocusedBranchTruth(items[0].value).state:items.length?'unknown':'false';};
 if(Object.keys(conditions).some(key=>!['absentKeys','emptyOrAbsentKeys','anyNonempty','selectedNonempty','firstNonempty','literalEqualsOrAbsent'].includes(key))||!v2221FocusedReferenceKeyParity(row,box,parsed))return false;
 if(conditions.absentKeys&&(!keys('absentKeys')||conditions.absentKeys.some(key=>values(key).length)))return false;
 if(conditions.emptyOrAbsentKeys&&(!keys('emptyOrAbsentKeys')||conditions.emptyOrAbsentKeys.some(key=>truth(key)!=='false')))return false;
 if(conditions.anyNonempty&&(!Array.isArray(conditions.anyNonempty)||conditions.anyNonempty.some(group=>!Array.isArray(group)||!group.length||group.some(key=>typeof key!=='string')||!group.some(key=>truth(key)==='true'))))return false;
 if(conditions.selectedNonempty&&(!Array.isArray(conditions.selectedNonempty)||conditions.selectedNonempty.some(chain=>{if(!Array.isArray(chain)||!chain.length||chain.some(key=>typeof key!=='string'))return true;const chosen=chain.find(key=>values(key).length);return chosen===undefined||truth(chosen)!=='true';})))return false;
 if(conditions.firstNonempty&&(!Array.isArray(conditions.firstNonempty)||conditions.firstNonempty.some(chain=>{if(!Array.isArray(chain)||!chain.length||chain.some(key=>typeof key!=='string'))return true;for(const key of chain){const state=truth(key);if(state==='unknown')return true;if(state==='true')return false;}return true;})))return false;
 if(conditions.literalEqualsOrAbsent&&(!Array.isArray(conditions.literalEqualsOrAbsent)||conditions.literalEqualsOrAbsent.some(test=>!test||typeof test.key!=='string'||!Array.isArray(test.values)||test.values.some(value=>typeof value!=='string')||values(test.key).some(item=>{const literal=v2221FocusedBranchTruth(item.value).literal;return literal===null||!test.values.includes(literal);}))))return false;
 if(row.role==='native-caption-reference-registration'){
  const proof=row.reader.registrationProof,pins=V2221_FOCUSED.nativeReferenceDependencyPins||{};
  if(!proof||proof.kind!=='native-caption-argument-expansion'||!/^[a-f0-9]{64}$/.test(proof.nativePairSha256)||!Array.isArray(proof.dependencies)||!proof.dependencies.length||proof.dependencies.some(title=>!v2221InfoboxPin({title,...pins[title]})))return false;
 }
 if(['native-number-reference-text','native-selector-reference-text'].includes(row.role)){
  const proof=row.reader.valueProof,pins=V2221_FOCUSED.nativeReferenceDependencyPins||{},kind=row.role==='native-number-reference-text'?'native-integer-reference-format':'native-selector-literal-fallback';
  if(!proof||proof.kind!==kind||!/^[a-f0-9]{64}$/.test(proof.nativePairSha256)||!Array.isArray(proof.dependencies)||!proof.dependencies.length||proof.dependencies.some(title=>!v2221InfoboxPin({title,...pins[title]})))return false;
 }
 if(row.reader.branchProof){const proof=row.reader.branchProof,pins=V2221_FOCUSED.nativeReferenceDependencyPins||{};if(proof.kind!=='native-explicit-version-branches'||!/^[a-f0-9]{64}$/.test(proof.nativePairSha256)||!Array.isArray(proof.dependencies)||!proof.dependencies.length||proof.dependencies.some(title=>!v2221InfoboxPin({title,...pins[title]})))return false;}
 if(field){const refs=v219NativeReferenceObserver(field.value),text=v24SyntaxMaskRanges(v2221FocusedValueView(field.value),refs.refs).replace(/<br[ \t]*\/?[ \t]*>/gi,'');if(!text.trim()||box.fields.some(item=>item.key===row.key&&item.key!==field.key&&!/^[ \t\r\n]*$/.test(item.value)))return false;}
 if(field&&row.role==='native-number-reference-text'){const refs=v219NativeReferenceObserver(field.value),text=v24SyntaxMaskRanges(field.value,refs.refs).trim();if(!/^\d+$/.test(text))return false;}
 return true;
}
function v2221FocusedCaptionKeyRepair(source,cfg,box,mapping,field) {
 if(!v2221FocusedScope(source,cfg)||cfg.namespaceNumber!==0||!v221BioUniqueFields(box)||!field?.value||!/<ref\b/i.test(field.value))return false;
 const rows=(V2221_FOCUSED.nativeReferenceConsumers||[]).filter(row=>row.role==='native-caption-reference-registration'&&row.owner===box.name&&row.key===mapping.to&&row.sourceKeys.includes(mapping.from));
 if(rows.length!==1||!v2221FocusedReferenceConsumer(rows[0],box,field)||(rows[0].aliases||[]).some(key=>key!==field.key&&key!==mapping.to&&box.fields.some(item=>item.key===key&&item.value.trim())))return false;
 const observed=v219NativeReferenceObserver(field.value);
 if(!observed.refs.length||observed.unclosed.length||observed.empties.length||observed.helpers.length||observed.refs.some(ref=>!ref.valid||!ref.attrs||ref.typo||ref.container||ref.group!==''))return false;
 const shield=v24SyntaxProtected(field.value);
 for(const ref of observed.refs)if(ref.body!==null&&(!ref.close||!v220LiteralReferenceBodySafe(field.value,ref.end-ref.close.raw.length-ref.body.length,ref.close.start,shield)))return false;
 const outside=v24SyntaxMaskRanges(v2221FocusedValueView(field.value),observed.refs).replace(/<br[ \t]*\/?[ \t]*>/gi,'');
 if(/[{}<>]/.test(outside)||!outside.trim())return false;
 for(const other of box.fields)if(other!==field&&(/\{\{|<ref\b|<references\b/i.test(other.value)))return false;
 return true;
}
function v2221FocusedNativeMapping(source,cfg,box,mapping) {
 if(box.name!=='Info/Futebolista'||!['nascimentocidade','cidade_morte'].includes(mapping.from)||!['nascimento_cidade','morte_cidade'].includes(mapping.to)||!v2221FocusedScope(source,cfg)||cfg.namespaceNumber!==0)return mapping;
 const rows=(V2221_FOCUSED.nativeReferenceConsumers||[]).filter(row=>row.owner===box.name&&row.key===mapping.to&&row.sourceKeys.includes(mapping.from)),field=box.fields.find(item=>item.key===mapping.from);
 if(rows.length!==1||!field||!/<ref\b/i.test(field.value)||!v2221FocusedReferenceConsumer(rows[0],box,field))return mapping;
 // Country is a separate native slot that opens the death-location row. It is
 // never a spelling of the city slot, and neither supplied value is changed.
 return {...mapping,aliases:rows[0].aliases};
}
function v2221FocusedReferenceActivation(source,cfg={}) {
 if(!v2221FocusedScope(source,cfg)||source.length>524288||cfg.namespaceNumber!==0||cfg.infoboxes===false||cfg.references===false||cfg.automaticReferenceRepairs===false||cfg.automaticBiographyFields===false||cfg.automaticParameterNames===false||cfg.endMatter!==true||!/<ref\b/i.test(source))return null;
 const consumers=V2221_FOCUSED.nativeReferenceConsumers||[];
 if(!consumers.some(row=>row.sourceKeys.some(key=>source.includes(key))))return null;
 const box=v221BioPrincipal(source);if(!box||!v221BioUniqueFields(box))return null;
 const parsed=v2221InfoboxRead(box.raw);if(!parsed||parsed.title!==box.name)return null;
 const candidates=consumers.filter(row=>(row.owner===box.name||v2221FocusedReferenceRedirect(box.name,row.native,row.key))&&v2221FocusedReferenceConsumer(row,box,null,parsed));
 if(!candidates.length)return null;
 const original=v221BiographyPlan(source,cfg),phaseIndex=original.stages?.findIndex(step=>step.name==='native-field-mappings')??-1,phase=original.stages?.[phaseIndex];
 if(!phase||!v221BiographyProof(source,original.text,original,cfg))return null;
 const prior=original.stages.slice(0,phaseIndex),boundary=[];
 if(prior.length){
  if(prior.length!==1||prior[0].name!=='infobox-prose-boundary'||prior[0].source!==source||prior[0].edits.length!==1)return null;
  const edit=prior[0].edits[0];
  if(edit.ruleId!=='v221InfoboxProseBoundary'||edit.proof.owner!==box.name||edit.start!==box.node.end||edit.end!==edit.start||edit.text!=='\n')return null;
  boundary.push(edit);
 }
 if(phase.source!==v24SyntaxApply(source,boundary))return null;
 const selected=[],bindings=[];
 for(const edit of phase.edits){
  if(edit.ruleId!=='v221InfoboxField')continue;
  const row=candidates.find(item=>item.key===edit.proof.to&&item.sourceKeys.includes(edit.proof.from));if(!row)continue;
  const field=box.fields.find(item=>item.key===edit.proof.from);if(!field||field.value!==edit.proof.value||!/<ref\b/i.test(field.value))continue;
  if(!v2221FocusedReferenceConsumer(row,box,field,parsed))continue;
  if((row.forbiddenNonemptyKeys||[]).some(key=>box.fields.some(item=>item.key===key&&item.value.trim())))continue;
  if((row.aliases||[]).some(key=>key!==edit.proof.to&&key!==field.key&&box.fields.some(item=>item.key===key&&item.value.trim())))continue;
  const refs=v219NativeReferenceObserver(field.value);
  if(!refs.refs.length||refs.unclosed.length||refs.empties.length||refs.helpers.length||refs.refs.some(ref=>!ref.valid||!ref.attrs||ref.typo||ref.container||ref.group!==''))continue;
  const outside=v24SyntaxMaskRanges(v2221FocusedValueView(field.value),refs.refs).replace(/<br[ \t]*\/?[ \t]*>/gi,'');
  if(/[{}<>]/.test(outside))continue;
  const redirect=row.owner===box.name?null:v2221FocusedReferenceRedirect(box.name,row.native,row.key);if(row.owner!==box.name&&!redirect)continue;
  selected.push(edit);bindings.push({from:field.key,to:row.key,valueHash:v24SyntaxHash(field.value),native:{title:row.native.title,revision:row.native.revision,sha256:row.native.sha256},reader:row.reader.path,consumption:{role:row.role,conditions:row.reader.conditions||{}},...(redirect?{redirect}: {})});
 }
 if(!selected.length)return null;
 for(const edit of phase.edits){
  if(edit.ruleId!=='v221InfoboxEmptyDestination'||!selected.some(item=>item.proof.owner===edit.proof.owner&&item.proof.to===edit.proof.destination))continue;
  if(typeof edit.proof.value!=='string'||!/^[ \t\r\n]*$/.test(edit.proof.value))return null;
  selected.push(edit);
 }
 if(selected.some(edit=>edit.start<box.node.start+2||edit.end>box.node.end-2))return null;
 selected.push(...boundary);
 selected.sort((a,b)=>a.start-b.start||a.end-b.end);if(selected.some((edit,index)=>index&&edit.start<selected[index-1].end))return null;
 const mapped=v24SyntaxApply(source,selected),afterBox=v221BioPrincipal(mapped);if(!afterBox||afterBox.name!==box.name||!v221BioUniqueFields(afterBox))return null;
 const observed=v219NativeReferenceObserver(mapped),before=v219NativeReferenceObserver(source);
 if(!observed.refs.length||observed.unclosed.length||observed.empties.length||observed.helpers.length||rendererRanges(observed.view).length)return null;
 if(!observed.refs.some(ref=>ref.body!==null&&ref.body.trim()))return null;
 for(const binding of bindings){const field=afterBox.fields.filter(item=>item.key===binding.to);if(field.length!==1||v24SyntaxHash(field[0].value)!==binding.valueHash)return null;}
 for(const ref of observed.refs){
  if(!ref.attrs||ref.typo||ref.container||ref.group!=='')return null;
  const context=v24SyntaxContext(observed.view,ref.start);if(!context||[context.html,context.tables,context.links,context.external].some(rows=>rows.length))return null;
  const fields=afterBox.fields.filter(field=>afterBox.node.start+field.start<=ref.start&&ref.end<=afterBox.node.start+field.end);
  if(fields.length!==1||!bindings.some(binding=>binding.to===fields[0].key))return null;
 }
 const shield=v24SyntaxProtected(mapped),programs=[];
 for(const ref of observed.refs)if(ref.body!==null&&(!ref.close||!v220LiteralReferenceBodySafe(mapped,ref.end-ref.close.raw.length-ref.body.length,ref.close.start,shield)))return null;
 for(const node of templates(observed.view).nodes){
  if(node.start<=afterBox.node.start||node.end>=afterBox.node.end)continue;
  const raw=mapped.slice(node.start,node.end);
  if(observed.refs.some(ref=>ref.body!==null&&ref.start<node.start&&node.end<ref.end))continue;
  if(!v219NativeCitationStateInterface(raw)&&!v2111ReferenceFreeTemplate(raw))return null;
  programs.push({start:node.start,end:node.end,hash:v24SyntaxHash(raw)});
 }
 const inventory=(text,view)=>view.refs.map(ref=>text.slice(ref.start,ref.end));
 if(JSON.stringify(inventory(source,before))!==JSON.stringify(inventory(mapped,observed)))return null;
 const native=bindings[0].native;if(bindings.some(binding=>!v2221InfoboxSamePin(binding.native,native)))return null;
 const packet={schema:1,originalSource:source,sourceHash:v24SyntaxHash(source),mappedHash:v24SyntaxHash(mapped),owner:{name:box.name,start:afterBox.node.start,end:afterBox.node.end,native},fields:bindings,ownerInventoryHash:v24SyntaxHash(JSON.stringify({fields:afterBox.fields.map(field=>[field.key,v24SyntaxHash(field.value)]),programs})),referenceInventoryHash:v24SyntaxHash(JSON.stringify(inventory(mapped,observed)))};
 return {source,mapped,edits:JSON.parse(JSON.stringify(selected)),packet};
}
function v2221FocusedActivatedReferenceAllows(mappedSource,cfg={},packet=null,ownerSpan=null) {
 if(typeof mappedSource!=='string'||!packet||packet.schema!==1||typeof packet.originalSource!=='string'||packet.sourceHash!==v24SyntaxHash(packet.originalSource)||packet.mappedHash!==v24SyntaxHash(mappedSource))return false;
 const fresh=v2221FocusedReferenceActivation(packet.originalSource,cfg);
 if(!fresh||fresh.mapped!==mappedSource||JSON.stringify(fresh.packet)!==JSON.stringify(packet))return false;
 if(ownerSpan!==null&&(!Number.isSafeInteger(ownerSpan.start)||!Number.isSafeInteger(ownerSpan.end)||ownerSpan.start!==fresh.packet.owner.start||ownerSpan.end!==fresh.packet.owner.end))return false;
 return true;
}
function v2221FocusedReferencePrerequisitePlan(source,cfg={}) {
 const empty=v222EditsPlan(source,[]),activation=v2221FocusedReferenceActivation(source,cfg);if(!activation)return empty;
 const collector=v221MissingDefaultCollectorPlan(activation.mapped,cfg,activation.packet);
 if(!collector.edits?.length||!v221MissingDefaultCollectorProof(activation.mapped,collector.text,collector,cfg,activation.packet))return empty;
 let start=0,end=source.length,tail=collector.text.length;
 while(start<end&&start<tail&&source[start]===collector.text[start])start++;
 while(end>start&&tail>start&&source[end-1]===collector.text[tail-1]){end--;tail--;}
 const edit={start,end,text:collector.text.slice(start,tail),count:activation.edits.length+collector.edits.length,kind:'native-field-reference-prerequisite',proof:{sourceHash:v24SyntaxHash(source),activation:activation.packet,fieldEdits:activation.edits,collector:collector.edits}};
 return v222EditsPlan(source,[edit]);
}
function v2221FocusedReferencePrerequisiteProof(before,after,plan,cfg={}) {
 return v222PlanProof(before,after,plan,cfg,v2221FocusedReferencePrerequisitePlan);
}

// Project only two independently authored source repairs before an older whole-
// box inventory. The candidate stays literal; changed facts still fail it.
function v2221FocusedBiographyInventorySource(source,cfg={}) {
 if(!v2221FocusedScope(source,cfg)||cfg.infoboxes===false||cfg.automaticBiographyFields===false||v2221FocusedBiographyConflict(source,cfg))return source;
 const box=v221BioPrincipal(source);if(!box||!v2217VerifiedPersonBox({name:nameOf(box.name),raw:box.raw}))return source;
 let text=source;
 const legacy=v221BiographyPlan(text,cfg),phase=legacy.stages?.find(step=>step.name==='native-field-mappings'&&step.source===text);
 if(phase&&v221BiographyProof(text,legacy.text,legacy,cfg)){
  const edits=phase.edits.filter(edit=>edit.ruleId==='v221InfoboxEmptyUnknown'&&edit.proof.owner===box.name&&typeof edit.proof.value==='string'&&/^[ \t\r\n]*$/.test(edit.proof.value));
  if(edits.length)text=v24SyntaxApply(text,edits);
 }
 const occupation=v219LateOccupationPlan(text,cfg);
 if(occupation.text!==text&&v219LateOccupationProof(text,occupation.text,occupation,cfg))text=occupation.text;
 return text;
}

// Remove the same proved literal prefix before dependent reference stages.
// An unrelated incomplete tail retains its original quarantine boundary.
function v2221DescriptionPrefixPlan(source,cfg={}) {
 const empty=v222EditsPlan(source,[]);
 if(!v222Scope(source,cfg)||cfg.namespaceNumber!==0||cfg.shortDescriptions!==true||cfg.pageRedirect)return empty;
 const recovery=syntaxRepairPrefix(source,cfg),partial=!!recovery.unresolved?.length;
 if(!Number.isSafeInteger(recovery.end)||recovery.end<=0||recovery.end>source.length||partial&&recovery.end>=source.length||!partial&&recovery.end!==source.length)return empty;
 const first=/^(?:[ \t]*\r?\n)*/.exec(source)[0].length;
 const shield=v24SyntaxProtected(source),node=v24SyntaxTemplates(shield.view).nodes.find(n=>n.start===first&&n.size===2);if(!node||node.end>recovery.end)return empty;
 const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),context=v24SyntaxContext(shield.view,node.start);
 if(!['descrição curta','descricao curta','short description','shortdescription'].includes(p.name)||p.parts.length!==2||!p.parts[1].trim()||p.parts[1].includes('=')&&!/^[ \t\r\n]*1[ \t]*=/.test(p.parts[1])||/[{}<>]/.test(p.parts[1])||!v2216ObsoleteOwnerRemovalAllowed(raw)||['templates','html','tables','links','external'].some(k=>context[k]?.length)||v219WholeQuotedCodeRanges(source).some(r=>r.start<node.end&&node.start<r.end))return empty;
 const next=source.indexOf('\n',node.end),lineEnd=next<0?source.length:next;
 if(source.slice(node.end,lineEnd).trim())return empty;
 const end=next<0?lineEnd:next+1;if(end>recovery.end)return empty;
 return v222EditsPlan(source,[{start:node.start,end,text:'',count:1,kind:partial?'verified-literal-description-before-incomplete-tail':'verified-literal-description-at-start',proof:{ownerHash:v24SyntaxHash(raw),safePrefixEnd:recovery.end,sourceHash:v24SyntaxHash(source)}}]);
}
function v2221DescriptionPrefixProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221DescriptionPrefixPlan);}

// The same previously approved removals must precede dependent reference
// stages in both the calculation and its source-side projection.
function v2221ApprovedObsoleteRemovalPlan(source,cfg={}) {
 const empty=v222EditsPlan(source,[]);
 if(!v222Scope(source,cfg)||cfg.pageRedirect||cfg.namespaceNumber!==0&&!v2215ArticleDraftContext(cfg,source)||!cfg.shortDescriptions&&!cfg.obsoleteTemplates)return empty;
 const recovery=syntaxRepairPrefix(source,cfg);if(recovery.unresolved?.length||recovery.end!==source.length)return empty;
 const shield=v24SyntaxProtected(source);if(shield.unclosed.length)return empty;
 const context=structuralRanges(shield.view),edits=[];
 for(const node of topNodes(shield.view)){
  const raw=source.slice(node.start,node.end);
  if(v2221ExistingObsoleteOwnerResult(raw,cfg)!==''||!v2216ObsoleteOwnerRemovalAllowed(raw)||inRangeExcept(node.start,context,node.start,node.end))continue;
  const start=source.lastIndexOf('\n',node.start-1)+1,next=source.indexOf('\n',node.end),end=next<0?source.length:next,standalone=!source.slice(start,node.start).trim()&&!source.slice(node.end,end).trim();
  edits.push({start:standalone?start:node.start,end:standalone&&next>=0?end+1:standalone?end:node.end,text:'',count:1,kind:'existing-approved-obsolete-owner-removal',proof:{sourceHash:v24SyntaxHash(source),ownerHash:v24SyntaxHash(raw)}});
 }
 if(!edits.length)return empty;
 const plan=v222EditsPlan(source,edits);
 const retained=v2216LayoutSortEvents(source).filter(event=>!edits.some(edit=>edit.start<=event.start&&event.end<=edit.end)).map(({kind,signature})=>({kind,signature})),after=v2216LayoutSortEvents(plan.text).map(({kind,signature})=>({kind,signature}));
 return JSON.stringify(retained)===JSON.stringify(after)?plan:empty;
}
function v2221ApprovedObsoleteRemovalProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221ApprovedObsoleteRemovalPlan);}

// Masking quoted values cannot turn a complete parent template into an open
// owner that hides a genuine portal. Match any remaining opening to its exact
// original offset; this changes only the late portal producer's local view.
function v2221FocusedPortalMaskCoherent(source,masked,ranges,prefix) {
 if(typeof source!=='string'||typeof masked!=='string'||!Array.isArray(ranges)||typeof prefix!=='string')return false;
 const edits=[];let end=0;
 for(let i=0;i<ranges.length;i++){const r=ranges[i];if(!Number.isSafeInteger(r.start)||!Number.isSafeInteger(r.end)||r.start<end||r.start<0||r.end<=r.start||r.end>source.length)return false;edits.push({start:r.start,end:r.end,text:prefix+i+'\uE001'});end=r.end;}
 if(v24SyntaxApply(source,edits)!==masked)return false;
 const before=v24SyntaxTemplates(v24SyntaxProtected(source).view).unclosed,after=v24SyntaxTemplates(v24SyntaxProtected(masked).view).unclosed;
 for(const node of after){
  if(node.size!==2)continue;let delta=0;
  for(const edit of edits){const at=edit.start-delta;if(node.start<at)break;if(node.start<at+edit.text.length)return false;delta+=edit.end-edit.start-edit.text.length;}
  if(!before.some(original=>original.size===2&&original.start===node.start+delta))return false;
 }
 return true;
}
