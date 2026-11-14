// Each proof owns literal spans. An unsupported neighboring field stays opaque.
function v222Scope(source,cfg={}) {
 return typeof source==='string'&&source.length<=4194304&&(!cfg.contentModel||cfg.contentModel==='wikitext')&&
  (!cfg.model||cfg.model==='wikitext')&&!cfg.pageDisambiguation&&!cfg.sectionOnly&&!cfg.discussionPage&&
  (cfg.namespaceNumber===0||cfg.namespaceNumber===10||v2215ArticleDraftContext(cfg,source));
}
function v222Fields(raw) {
 const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
 const fields=[];
 for(const part of parts.slice(1)){
  const m=/^([ \t\r\n]*)([^={}\[\]<>\r\n]+?)([ \t]*)=([\s\S]*)$/.exec(part.text);if(!m)continue;
  // Parameter names are literal. Unicode spaces/format characters may make
  // a different, ignored key and must not shorten the replacement span.
  const key=m[2].replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,''),leading=/^[ \t\r\n]*/.exec(m[2])[0].length;if(!key||/^\d+$/.test(key))continue;
  const keyStart=2+part.start+m[1].length+leading;
  fields.push({key,keyStart,keyEnd:keyStart+key.length,value:m[4],valueStart:2+part.start+m[1].length+m[2].length+m[3].length+1,start:2+part.start,end:2+part.end,part});
 }
 return {parts,header:parts[0].text,fields};
}
function v222EditsPlan(source,edits) {
 const accepted=[];let end=-1;
 for(const e of edits.slice().sort((a,b)=>a.start-b.start||a.end-b.end)){
  if(e.start<end||e.start<0||e.end<e.start||e.end>source.length||source.slice(e.start,e.end)===e.text)continue;
  accepted.push({...e,count:Number.isInteger(e.count)&&e.count>0?e.count:1});end=e.end;
 }
 return {sourceHash:v24SyntaxHash(source),text:v24SyntaxApply(source,accepted),edits:accepted};
}
function v222PlanProof(before,after,plan,cfg,planner) {
 if(!plan||typeof before!=='string'||typeof after!=='string'||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||!Array.isArray(plan.edits))return false;
 try {
  if(v24SyntaxApply(before,plan.edits)!==after)return false;
  const repeated=planner(before,cfg);
  return repeated.text===after&&JSON.stringify(repeated.edits)===JSON.stringify(plan.edits);
 }catch(_){return false;}
}
function v222Protected(source) {return v24SyntaxProtected(source);}
function v222CitationRoles(key,reader) {
 const roles=v2215CitationModelRoles(key,reader);
 // These global legacy roles have no consumer in the pinned specialized model.
 const ignored=reader.kind==='map'?['Map','MapURL','MapFormat','TransMap']:reader.kind==='mailing-list'?['MailingList']:[];
 const effective=roles.filter(x=>!ignored.includes(x));
 if(reader.kind==='episode'){
  if(['began','início'].includes(key))effective.push('Native-Episode-Start');
  if(['ended','fim'].includes(key))effective.push('Native-Episode-End');
 }
 return [...new Set(effective)].sort();
}
function v222CitationKeyTarget(key,reader) {
 for(const [from,to,revision] of V222_CATALOG.syntax.citationModel){
  if(revision&&revision!==reader.oldid)continue;
  if(from===key)return to;
  if(from.includes('#')){
   const [a,b]=from.split('#'),escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),m=new RegExp('^'+escape(a)+'([1-9]\\d*)'+escape(b)+'$').exec(key);
   if(m)return to.replace('#',m[1]);
  }
 }
 return v2215PortugueseCitationKey(key);
}
function v222CitationRepairTarget(key,reader) {
 const ordinary={url_seção:'capítulourl',autora:'autor',sobrename:'ultimo','sobrenome-editor':'editor-sobrenome','local de publicação':'local-publicação',localdepublicação:'local-publicação','local-publicacao':'local-publicação',fecha:'data','année':'ano'};
 const m=/^(autora|sobrename|sobrenome-editor)([1-9]\d*)$/.exec(key);
 const target=m?ordinary[m[1]]+m[2]:Object.hasOwn(ordinary,key)?ordinary[key]:null;
 if(!target)return null;
 // Episode/conference models deliberately use the main URL for ChapterURL.
 if(key==='url_seção'&&['map','episode','conference'].includes(reader.kind))return null;
 return target;
}
function v222CitationUnique(field,roles,fields,reader) {
 return roles.length>0&&!fields.some(other=>{
  if(other===field)return false;if(other.key===field.key)return true;
  const key=v222CitationRepairTarget(other.key,reader)||other.key;
  return v222CitationRoles(key,reader).some(x=>roles.includes(x));
 });
}
function v222CitationTargetAccepted(context,target,reader) {
 if(nativeCitationAccepts(context.native,target))return true;
 // The old flattened catalogue omits aliases added by specialized modules.
 // Exact pinned model rows carry their own observed native reader contract.
 return V222_CATALOG.syntax.citationModel.some(([from,to,revision])=>{
  if(!revision||revision!==reader.oldid)return false;
  if(target===to)return true;
  if(!to.includes('#'))return false;
  const [a,b]=to.split('#');return target.startsWith(a)&&target.endsWith(b)&&/^[1-9]\d*$/.test(target.slice(a.length,target.length-b.length||undefined));
 });
}
function v222CitationDateLiteral(value) {
 const text=value.trim(),parsed=v218CitationDateValue(text,'archive')||v219SupplementalCitationDateValue(text,'archive');
 return !!parsed&&/^(?:\d{4}-\d{2}-\d{2}|\d{1,2} de [A-Za-zÀ-ÿ]+ de \d{4})$/.test(text);
}
function v222CitationURLLiteral(value) {
 return /^https?:\/\/[^\s{}<>\[\]|]+$/i.test(value.trim());
}
function v222CitationPageLocator(value) {
 return value.split(/[ \t]*[–-][ \t]*/).every(part=>/^[1-9]\d*$/.test(part)||
  !!part&&/^(?=[MDCLXVI]+$)M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/i.test(part));
}
function v222CitationStateIntent(key) {
 if(typeof key!=='string')return false;
 // Intent detection is deliberately broader than key activation. Case and
 // underscore variants can veto a conflict but are never thereby translated.
 const literal=key.toLowerCase().replace(/_/g,'-');
 return ['status-url','url-status','urlstatus','url-estado','statusurl','urlmorto','url-morto','urlmorta','url-morta','dead-url','deadurl','datali','li','ligação inativa','ligação inactiva','ligação-inativa','ligação-inactiva'].includes(literal);
}
function v222OpaqueCitationHeaderPlan(source,cfg={}) {
 const edits=[];if(!v222Scope(source,cfg)||cfg.citations===false)return v222EditsPlan(source,edits);
 const shield=v222Protected(source),syntax=v24SyntaxTemplates(shield.view);
 if(syntax.unclosed.length)return v222EditsPlan(source,edits);
 for(const node of syntax.nodes){
  if(node.depth!==0||node.size!==2||shield.ranges.some(r=>r.start<node.end&&node.start<r.end))continue;
  const raw=source.slice(node.start,node.end),parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)continue;
  const header=parts[0].text;
  // These are pinned native redirects. The existing producer must prove the
  // exact header-only migration, even when a nested URL keeps the body opaque.
  if(!/^[ \t]*(?:[Cc]ite book|[Cc]ite journal)[ \t]*$/.test(header))continue;
  const redirect=v219LocalCitationRedirectProfile(raw),migration=migrateForeignTemplate(raw,cfg);
  if(!redirect?.v219LocalCitationRedirect||!migration||migration.blocked||migration.text===raw||
   migration.proof?.sourceHash!==v24SyntaxHash(raw)||migration.proof.composedNativeMigration!==false||
   migration.proof.nativeAliasOldid!==redirect.nativeAliasOldid||migration.proof.nativeTemplateOldid!==redirect.nativeTemplateOldid)continue;
  const next=v24SyntaxParts(migration.text.slice(2,-2));
  if(!next||next.length!==parts.length||next[0].text.trim()!==redirect.target||
   parts.slice(1).some((part,i)=>part.text!==next[i+1].text))continue;
  const expected='{{'+next[0].text+raw.slice(2+header.length);
  if(expected!==migration.text)continue;
  edits.push({start:node.start+2,end:node.start+2+header.length,text:next[0].text,count:1,kind:'opaque-citation-proved-header',
   proof:{sourceHash:v24SyntaxHash(raw),nativeAliasOldid:redirect.nativeAliasOldid,nativeTemplateOldid:redirect.nativeTemplateOldid,
    target:redirect.target,argumentHash:v24SyntaxHash(parts.slice(1).map(part=>part.text).join('|'))}});
 }
 return v222EditsPlan(source,edits);
}
function v222OpaqueCitationHeaderProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v222OpaqueCitationHeaderPlan);}
function v222OpaqueCitationHeaderProjection(source,cfg={}) {
 const plan=v222OpaqueCitationHeaderPlan(source,cfg),text=plan.edits.length&&v222OpaqueCitationHeaderProof(source,plan.text,plan,cfg)?plan.text:source;
 return v2212OpaqueCiteWebHeader(text);
}
function v222CitationBareAutonameCertificate(before,after,options={}) {
 const cfg=pageContextOptions({...DEFAULTS,...options});
 if(typeof before!=='string'||typeof after!=='string'||before===after||before.length>524288||after.length>524288||
  !v222Scope(before,cfg)||cfg.references===false||cfg.bareReferences===false||cfg.neutralReferenceNames===false)return null;
 const bare=v219CitationLanguageBareReferencePlan(before,cfg);
 if(!bare.edits.length||!v219CitationLanguageBareReferenceProof(before,bare.text,bare,cfg))return null;
 const named=v2216AutonamePlan(bare.text,cfg);
 if(!named.edits.length||!v2216AutonameProof(bare.text,named.text,named,cfg)||
  v219CitationLanguageInventory(named.text,cfg).key!==v219CitationLanguageInventory(after,cfg).key)return null;
 const source=v219NativeReferenceObserver(bare.text),expected=v219NativeReferenceObserver(named.text),actual=v219NativeReferenceObserver(after);
 if([source,expected,actual].some(x=>x.unclosed.length||x.empties.length||x.shield.unclosed.length)||
  source.refs.length!==expected.refs.length||expected.refs.length!==actual.refs.length)return null;
 const inverse=[];
 for(let i=0;i<source.refs.length;i++){
  const old=source.refs[i],planned=expected.refs[i],found=actual.refs[i];
  if(!old.valid||!planned.valid||!found.valid||!old.attrs||!planned.attrs||!found.attrs||
   JSON.stringify(planned.attrs)!==JSON.stringify(found.attrs)||(planned.body===null)!==(found.body===null)||
   !planned.renderer?.valid||!found.renderer?.valid||(planned.group||'')!==(found.group||''))return null;
  if((old.attrs.name||'')===(planned.attrs.name||''))continue;
  const opening=n=>n.start+n.raw.length,oldOpen=bare.text.slice(old.start,opening(old)),plannedOpen=named.text.slice(planned.start,opening(planned)),actualOpen=after.slice(found.start,opening(found));
  if(plannedOpen!==actualOpen)return null;
  inverse.push({start:found.start,end:opening(found),text:oldOpen});
 }
 if(inverse.length!==named.edits.length)return null;
 const shadow=v24SyntaxApply(after,inverse);
 if(!v219CitationLanguageBareReferenceSitesRetained(before,shadow,bare,null,cfg))return null;
 // Only proved automatic names are undone in this comparison witness. The
 // exact ordered language ledger, every bare URL/body and native site still
 // pass their existing checks; the real candidate is never changed here.
 return {kind:'proved-bare-reference-and-automatic-name-composition',sourceHash:v24SyntaxHash(before),candidateHash:v24SyntaxHash(after),
  bareHash:v24SyntaxHash(bare.text),namedHash:v24SyntaxHash(named.text),siteWitnessHash:v24SyntaxHash(shadow),bareEdits:bare.edits.length,nameEdits:named.edits.length,
  inventoryHash:v24SyntaxHash(v219CitationLanguageInventory(after,cfg).key)};
}
function v222CitationLanguageDateBinding(field,parsed,entries,cfg={},fallback=field.value,literalSyntax=false) {
 if(!literalSyntax||cfg.dates===false||cfg.automaticCitationDateValues===false||field.positional||!nativeCitationAccepts(parsed,field.key))return fallback;
 const roles=v219NativeCitationRoles(field.key),role=roles.length===1?roles[0]:null,
  kinds={Date:'date',AccessDate:'access',ArchiveDate:'archive'};
 if(!Object.hasOwn(kinds,role)||entries.filter(other=>!other.positional&&nativeCitationAccepts(parsed,other.key)&&v219NativeCitationRoles(other.key).includes(role)).length!==1)return fallback;
 const literal=field.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
 if(!literal||/[{}\[\]<>\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\uFEFF\uE000-\uF8FF]/u.test(literal))return fallback;
 let date=v218CitationDateValue(literal,kinds[role])||v219SupplementalCitationDateValue(literal,kinds[role]);
 if(!date){
  const numeric=/^(0?[1-9]|[12]\d|3[01])-(0?[1-9]|1[0-2])-([1-9]\d{3})$/.exec(literal);
  if(!numeric)return fallback;
  const day=Number(numeric[1]),month=Number(numeric[2]),year=Number(numeric[3]);
  if(day<=12||!validDate(day,month,year))return fallback;
  const months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],verbose=day+' de '+months[month-1]+' de '+year;
  if(normalizeDate(literal,()=>{})!==verbose)return fallback;
  date=v218CitationDateValue(verbose,kinds[role])||v219SupplementalCitationDateValue(verbose,kinds[role]);
  if(!date||date.identity?.day!==day||date.identity?.month!==month||date.identity?.year!==year)return fallback;
 }
 if(date.precision!=='day'||!date.identity||!validDate(date.identity.day,date.identity.month,date.identity.year))return fallback;
 // Only the comparison ledger receives this typed value. No source, language
 // field, generic native-value reader or citation writer is changed here.
 return ['v222-native-citation-date-binding',role,date.identity.year,date.identity.month,date.identity.day];
}
function v222CitationValue(value,roles,cfg={}) {
 const text=value.trim();let next=null;
 if(roles.includes('Language')){
  // The native language reader uses comma-delimited codes, not a slash.
  const finite={jp:'ja',pt_BR:'pt-BR','en/fr':'en, fr',Ukranian:'uk'};
  if(Object.hasOwn(finite,text))next=finite[text];
 }
 if(roles.includes('Page')||roles.includes('Pages')){
  const m=/^(?:pp?\.|págs?\.)[ \t]+((?:[1-9]\d*|[ivxlcdmIVXLCDM]+)(?:[ \t]*[–-][ \t]*(?:[1-9]\d*|[ivxlcdmIVXLCDM]+))?)$/.exec(text);
  if(m&&v222CitationPageLocator(m[1]))next=m[1];
 }
 if(roles.includes('Identifier:PMC')&&/^PMC[1-9]\d*$/.test(text))next=text.slice(3);
 if(roles.includes('Identifier:ISBN')){
  const m=/^ISBN(?:-1[03])?:?[ \t]+(?:ISBN(?:-1[03])?:?[ \t]+)([\dXx -]+)$/.exec(text);
  if(m){const compact=m[1].replace(/[ -]/g,'');let valid=false;
   if(/^\d{13}$/.test(compact))valid=[...compact].reduce((s,c,i)=>s+(+c)*(i%2?3:1),0)%10===0;
   if(/^\d{9}[\dXx]$/.test(compact))valid=[...compact.toUpperCase()].reduce((s,c,i)=>s+(c==='X'?10:+c)*(10-i),0)%11===0;
   if(valid)next=m[1];
  }
 }
 if(roles.includes('Title')&&cfg.automaticCitationTitleValues!==false){
  // A line break between literal words is not a bibliographic formatting tag.
  if(!/[{}<>\[\]|]/.test(text)&&!/(?:https?:|mailto:|www\.)/i.test(text)&&!/(?:\r?\n)[ \t]*(?:\r?\n)/.test(text)){
   const cleaned=text.replace(/([\p{Script=Latin}0-9])[ \t]*\r?\n[ \t]*(?=[\p{Script=Latin}0-9])/gu,'$1 ').replace(/(?<=[\p{Script=Latin}0-9])\u200B(?=[\p{Script=Latin}0-9])/gu,'');
   if(cleaned!==text)next=cleaned;
  }
 }
 if(next===null||next===text)return null;
 const at=value.indexOf(text);return value.slice(0,at)+next+value.slice(at+text.length);
}
function v222CitationsPlan(source,cfg={}) {
 const edits=[];if(!v222Scope(source,cfg)||cfg.citations===false)return v222EditsPlan(source,edits);
 const shield=v222Protected(source),nodes=v24SyntaxTemplates(shield.view).nodes;
 for(const node of nodes){
  if(node.size!==2)continue;
  const raw=source.slice(node.start,node.end),syntax=v222Fields(raw),context=v218CitationNativeContext(raw),reader=context&&v2215CitationReader(context);
  if(!syntax||!reader)continue;
  const fields=syntax.fields,add=(start,end,text,kind,proof)=>edits.push({start:node.start+start,end:node.start+end,text,count:1,kind,proof:{reader:reader.module,oldid:reader.oldid,...proof}});
  const stateFields=fields.filter(field=>v222CitationStateIntent(field.key)||v222CitationRoles(field.key,reader).some(role=>['DeadURL','UrlStatus'].includes(role)));
  const archiveURLs=fields.filter(f=>v222CitationRoles(f.key,reader).includes('ArchiveURL')),
   archiveDates=fields.filter(f=>v222CitationRoles(f.key,reader).includes('ArchiveDate'));
  const swapped=archiveURLs.length===1&&archiveDates.length===1&&v222CitationDateLiteral(archiveURLs[0].value)&&v222CitationURLLiteral(archiveDates[0].value);
  if(swapped&&cfg.automaticCitationDateValues!==false){
   const a=archiveURLs[0],b=archiveDates[0];
   add(a.valueStart,a.end,b.value,'citation-archive-pair',{pair:[a.key,b.key],role:'ArchiveURL'});
   add(b.valueStart,b.end,a.value,'citation-archive-pair',{pair:[a.key,b.key],role:'ArchiveDate'});
  }
  for(const field of fields){
   if(shield.view.slice(node.start+field.keyStart,node.start+field.keyEnd)!==field.key)continue;
   const roles=v222CitationRoles(field.key,reader);
   if(stateFields.length>1&&stateFields.includes(field))continue;
   const target=cfg.automaticParameterNames!==false&&(v222CitationKeyTarget(field.key,reader)||v222CitationRepairTarget(field.key,reader));
   if(target&&target!==field.key){
    const targetRoles=v222CitationRoles(target,reader),repair=v222CitationRepairTarget(field.key,reader)===target,
     expected=repair?targetRoles:roles;
    if(expected.length&&JSON.stringify(expected)===JSON.stringify(targetRoles)&&
      (repair||JSON.stringify(roles)===JSON.stringify(targetRoles))&&v222CitationUnique(field,expected,fields,reader)&&v222CitationTargetAccepted(context,target,reader))
     add(field.keyStart,field.keyEnd,target,repair?'citation-parameter-repair':'citation-portuguese-key',{from:field.key,to:target,roles:targetRoles});
   }
   if(field.key==='status-url'&&field.value.trim()==='dead'&&cfg.automaticParameterNames!==false&&fields.filter(f=>f.key==='status-url').length===1&&
      !fields.some(f=>f!==field&&(v222CitationStateIntent(f.key)||v222CitationRoles(f.key,reader).some(r=>['DeadURL','UrlStatus'].includes(r))))){
    add(field.keyStart,field.keyEnd,'urlmorta','citation-dead-key',{from:'status-url',to:'urlmorta',role:'DeadURL'});
    const at=field.value.indexOf('dead');add(field.valueStart+at,field.valueStart+at+4,'sim','citation-dead-state',{from:'dead',to:'sim'});
   }
   if(!roles.length||!v222CitationUnique(field,roles,fields,reader)||swapped&&[archiveURLs[0],archiveDates[0]].includes(field))continue;
   const value=v222CitationValue(field.value,roles,cfg);
   if(value!==null&&shield.view.slice(node.start+field.valueStart,node.start+field.end)===field.value){
    add(field.valueStart,field.end,value,'citation-literal-value',{key:field.key,roles,before:field.value,after:value});
    if(roles.includes('Title'))edits.at(-1).count=Math.max(1,(field.value.match(/\r?\n|\u200B/g)||[]).length-(value.match(/\r?\n|\u200B/g)||[]).length);
   }
  }
 }
 const plan=v222EditsPlan(source,edits);
 return v222EditsPlan(source,v219AtomicNamedReferenceEdits(source,plan.edits,cfg));
}
function v222CitationsProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v222CitationsPlan);}
