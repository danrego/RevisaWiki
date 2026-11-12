// Named arguments are whitespace-trimmed by MediaWiki. Positional values are opaque.
const V2217_PERSON_KEYS = Object.freeze(['name','nome','nome_comp','nome_completo','birth_name','nome_nascimento','nome de nascimento']);
const V2217_PERSON_FIELDS = Object.freeze({name:'nome',image:'imagem',caption:'legenda',alt:'alt',birth_name:'nome_nascimento',birth_date:'data_nascimento',birth_place:'local_nascimento',death_date:'data_morte',death_place:'local_morte',nationality:'nacionalidade',citizenship:'cidadania',education:'educação',alma_mater:'alma_mater',occupation:'ocupação',ocupation:'ocupação',years_active:'período_atividade',other_names:'outros_nomes',spouse:'cônjuge',children:'filhos',awards:'prêmios',parents:'parentesco',signature:'assinatura',website:'website'});
const V2217_FOREIGN_INFOBOX_NAMES = new Set(Object.entries(TRANSLATION_RULES.profiles).filter(([,p])=>p.kind==='infobox').flatMap(([name])=>[nameOf(name),nameOf(name.replace(TRANSLATION_PREFIX,''))]));
const V2217_INFOBOX_COMPONENTS = new Set(["designation/colour","ficha de color","ficha de taxón/colores","ficha/fila","info/aeronave/pic","info/aeroporto/pic","info/aeroporto/pistas","info/animangá/cabeçalho","info/animangá/rodapé","info/bandeira/cor","info/campeonato de tênis/cor","info/canção/cor","info/competição de patinação artística no gelo/cor","info/cor","info/divindade/cor","info/efeméride/cor","info/eleição parlamentar/linha","info/eleição2/imagem","info/eleição2/linha","info/evento meteorológico/rodapé","info/evento multiesportivo/cor","info/evento multiesportivo/imagem","info/evento patinação artística/cor","info/filme/cor","info/linha","info/lista de designações/cor","info/líder cristão/cor","info/língua/cores","info/música/artista/cor","info/nave espacial/rodapé","info/personagem fictícia/rodapé","info/rocha/cor","info/taxonomia/cor","info/televisão/cor","info/the walking dead/cor","info/topo/imagem","info/wikipedista/cor","info/álbum/cor","infobox album/color","infobox animanga cierre","infobox animanga encabezado","infobox animanga/footer","infobox animanga/header","infobox animation et bande dessinée asiatiques/entête","infobox animation et bande dessinée asiatiques/pied","infobox color","infobox couleur","infobox deity/color","infobox election/row","infobox farbe","infobox tennis event/footer","infobox v3/image","infobox v3/imagem","infobox weather event/footer","infobox/image","infobox/imagem","infobox/ligne","infobox/linha","infobox/linha/cor","infobox/row","infobox/titre avec icône","ipconexões/cor","pirâmide etária2/cabeçalho","taxobox colour","taxonomia/cor"]);
function v2217InfoboxNamedTrim(value) {
 return String(value).replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
}
function v2217InfoboxScope(source,cfg={}) {
 return typeof source==='string'&&source.length<=4194304&&cfg.namespaceNumber===0&&!cfg.sectionOnly&&
  (cfg.section===undefined||cfg.section===null||cfg.section==='')&&!cfg.discussionPage&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&
  (!cfg.contentModel||cfg.contentModel==='wikitext')&&cfg.infoboxes!==false&&cfg.markup!==false&&cfg.structuralRepairs!==false;
}
function v2217InfoboxName(raw) {
 const p=parsedTemplate(raw),literal=p.parts[0].replace(/<!--[\s\S]*?-->/g,''),header=v2217InfoboxNamedTrim(literal);
 if(header!==literal.trim())return null;
 if(!header||/[{}<>\r\n]/.test(header)||/^(?:#|subst\s*:|safesubst\s*:)/i.test(header))return null;
 return nameOf(header.replace(/^(?:predefinição|template|plantilla|modèle|vorlage)\s*:/i,''));
}
function v2217InfoboxIsName(name,raw='') {
 if(!name)return false;
 if(INFOBOX_CATALOG[name]||V2217_FOREIGN_INFOBOX_NAMES.has(name)||/^(?:info(?:box)?(?:[ /]|$)|infocaixa(?:[ /]|$)|ficha(?:[ /]|$)|caixa de informação(?:[ /]|$)|taxobox$|chembox$|drugbox$)/i.test(name))return true;
 const profile=raw&&translationProfile(raw);return profile?.kind==='infobox';
}
function v2217StandaloneInfobox(raw) {
 const name=v2217InfoboxName(raw);if(!name||V2217_INFOBOX_COMPONENTS.has(name))return false;
 if(/\/(?:cor|cores|color|colour|background|pic|linha|row|cabeçalho|rodapé|header|footer)(?:\/|$)/i.test(name))return false;
 if(['info','infocaixa'].includes(name)||V2217_PERSON_NAMES.has(name))return true;
 if(INFOBOX_CATALOG[name])return true;
 return translationProfile(raw)?.kind==='infobox';
}
function v2217InfoboxFields(raw) {
 const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
 const fields=[];let next=1;
 for(const part of parts.slice(1)){
  const named=/^([ \t\r\n]*)([^=]+?)([ \t\r\n]*)=([\s\S]*)$/.exec(part.text);
  if(!named){fields.push({key:String(next++),value:part.text,positional:true,part,start:2+part.start,end:2+part.end});continue;}
  const key=v2217InfoboxNamedTrim(named[2]);if(!key||/[{}<>|=\r\n\u0000-\u001F\u200B\uFEFF]/.test(key))return null;
  fields.push({key,value:named[4],positional:false,part,start:2+part.start,end:2+part.end});
 }
 return {header:parts[0].text,parts,fields};
}
function v2217InfoboxDate(value) {
 const core=value.trim(),p=core.startsWith('{{')&&core.endsWith('}}')&&parsedTemplate(core);if(!p)return null;
 const name=nameOf(p.parts[0]),fields=p.parts.slice(1);let y,m,d;
 // Ani is valid but does not emit Dni's living/birth categories or day anchor.
 if(name==='ani')return null;
 if(['birth date and age','birth date'].includes(name)){
  const numbers=fields.filter(x=>!/^\s*df\s*=\s*(?:y|yes|true)\s*$/i.test(x));
  if(numbers.length!==3||fields.length>4||!numbers.every(x=>/^\d+$/.test(x.trim())))return null;[y,m,d]=numbers.map(x=>+x.trim());
 }else return null;
 if(y<1||y>9999||!validDate(d,m,y))return null;
 // A non-age date is not silently changed into an age-producing template.
 if(name==='birth date')return null;
 return value.slice(0,value.indexOf(core))+'{{Dni|'+d+'|'+m+'|'+y+'}}'+value.slice(value.indexOf(core)+core.length);
}
function v2217InfoboxDeathContext(parsed,raw,cfg={}) {
 if(cfg.v2217DeceasedContext)return true;
 const profile=translationProfile(raw),death=new Set(['death date','deathdate','data morte','morte data','data falecimento','faleceu','falecimento','morte']);
 return parsed.fields.some(f=>{
  const key=profile?.kind==='infobox'&&profile.fields?.[norm(f.key)]||f.key;
  const semantic=v2217CountryKey(key).replace(/_/g,' ');
  return (death.has(semantic)||/^(?:morte (?:causa|local)|causa morte|death (?:cause|place))$/.test(semantic))&&v2217InfoboxNamedTrim(f.value)!=='';
 });
}
function v2217InfoboxPersonMigration(raw,cfg={}) {
 if(cfg.multilingual===false||cfg.automaticParameterNames===false||cfg.automaticBiographyFields===false)return null;
 if(v2217InfoboxName(raw)!=='infobox person')return null;
 const parsed=v2217InfoboxFields(raw);if(!parsed||parsed.fields.some(f=>f.positional))return null;
 const profile=INFOBOX_CATALOG['info/biografia'];if(!profile)return null;
 const groups=new Map();let count=1;
 for(const f of parsed.fields){
  const key=Object.hasOwn(V2217_PERSON_FIELDS,f.key)?V2217_PERSON_FIELDS[f.key]:f.key;
  if(!Object.hasOwn(V2217_PERSON_FIELDS,f.key)&&!profileAccepts(profile,f.key))return null;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);
 }
 // Do not overwrite aliases, even when the older wrapper ignored one of them.
 if([...groups.values()].some(g=>g.length>1))return null;
 const aliases=[['imagem','foto'],['legenda','imagem_legenda','desc'],['nome_nascimento','nome de nascimento'],['data_nascimento','nascimento_data','nasceu','nascimento'],['local_nascimento','nascimento_local','nascimento_cidade','cidade natal','localnasc'],['data_morte','morte_data','data_falecimento','faleceu','falecimento'],['local_morte','morte_local','local_falecimento','localfaleceu'],['ocupação','ocupações','ocupacao','trabalho civil','Ocupação'],['período_atividade','atividade','actividade','atividade_período'],['website','site','url','sítio','site_oficial','homepage'],['cônjuge','conjuge'],['filhos','filho','filhas','filha']];
 if(aliases.some(keys=>keys.filter(key=>groups.has(key)).length>1))return null;
 const fields=parsed.fields.map(f=>{
  const key=Object.hasOwn(V2217_PERSON_FIELDS,f.key)?V2217_PERSON_FIELDS[f.key]:f.key;
  let value=f.value;
  if(key!==f.key)count++;
  if(key==='data_nascimento'&&cfg.birthDates!==false&&cfg.dates!==false&&!cfg.v2217DeceasedContext){const date=v2217InfoboxDate(value);if(date&&date!==value){value=date;count++;}}
  if(key==='período_atividade'&&/^\s*\d{4}[ \t]*[–-][ \t]*present\s*$/i.test(value)){value=value.replace(/present/i,'presente');count++;}
  // Country identity Q38, not the unrelated Portuguese disambiguation Italy.
  if(['local_nascimento','cidadania','nacionalidade'].includes(key)){
   const next=value.replace(/\[\[Italy\]\]/g,'[[Itália]]').replace(/\[\[United Kingdom\]\]/g,'[[Reino Unido]]');
   if(next!==value){count+=(value.match(/\[\[(?:Italy|United Kingdom)\]\]/g)||[]).length;value=next;}
   if(key==='local_nascimento'&&/^\s*\[\[[^\[\]]+\]\],[ \t]*Italy\s*$/.test(value)){value=value.replace(/Italy(?=\s*$)/,'[[Itália]]');count++;}
  }
  return '|'+key+'='+value;
 });
 return {text:'{{Info/Biografia'+fields.join('')+'}}',count,kind:'atomic-native-person-interface',nativeOldids:[63097825,73325613]};
}
function v2217InfoboxEthnicMigration(raw,cfg={}) {
 if(cfg.multilingual===false||cfg.automaticParameterNames===false||v2217InfoboxName(raw)!=='infobox ethnic group')return null;
 const parsed=v2217InfoboxFields(raw);if(!parsed||parsed.fields.some(f=>f.positional))return null;
 const names={grupo:'header',group:'header',name:'header',image:'image',imagem:'image',população:'População',population:'População',pop:'População',regiões:'Regiões',regions:'Regiões',popplace:'Regiões',religiões:'Religiões',religions:'Religiões',religion:'Religiões',línguas:'Línguas',languages:'Línguas',language:'Línguas'};
 const slots=new Map();for(const f of parsed.fields){const role=names[f.key];if(!role||slots.has(role))return null;slots.set(role,f);}
 const header=slots.get('header');if(!header||!v2217InfoboxNamedTrim(header.value)||slots.get('image')&&v2217InfoboxNamedTrim(slots.get('image').value))return null;
 // The specific ethnic-group consumer currently omits its regions field.
 // A generic native box retains every explicit value without inventing totals.
 let index=0;const fields=[];
 for(const f of parsed.fields){const label=names[f.key];if(['header','image'].includes(label))continue;index++;fields.push('|rótulo'+index+'='+label+'\n|dados'+index+'='+v2217InfoboxNamedTrim(f.value)+'\n');}
 return {text:'{{Infocaixa\n|cabeçalho='+v2217InfoboxNamedTrim(header.value)+'\n'+fields.join('')+'}}',count:1+index,kind:'lossless-generic-ethnic-interface',nativeOldids:[70291795]};
}
function v2217InfoboxForeignPersonMigration(raw,cfg={}) {
 if(cfg.multilingual===false||cfg.automaticParameterNames===false||cfg.automaticBiographyFields===false)return null;
 const profile=translationProfile(raw),name=v2217InfoboxName(raw);
 if(!profile||profile.kind!=='infobox'||profile.wikidata||profile.dynamic||!profile.fields||nameOf(profile.target)===name||!v2217VerifiedPersonBox({name,raw}))return null;
 const target=INFOBOX_CATALOG[nameOf(profile.target)],native=target&&V221_INFOBOX_CONTRACTS[target.title],parsed=v2217InfoboxFields(raw);
 if(!target||!native||!parsed||parsed.fields.some(f=>f.positional))return null;
 const mapped=[],seen=new Set();let count=1;
 for(const field of parsed.fields){
  if(v2151FrozenBurialField(field.key))return null;
  let key=profile.fields[norm(field.key)];
  if(Object.hasOwn(V2217_PERSON_FIELDS,field.key))key=V2217_PERSON_FIELDS[field.key];
  if(!key&&native.consumed.includes(field.key))key=field.key;
  if(typeof key!=='string'||!native.consumed.includes(key)||seen.has(key))return null;
  seen.add(key);if(key!==field.key)count++;mapped.push({...field,key});
 }
 const contract=v2151FieldSyntaxContract(target);
 if(contract){const families=new Map();for(const field of mapped){const family=contract.families.get(field.key);if(family&&families.has(family))return null;if(family)families.set(family,field.key);}}
 return {text:'{{'+target.title+mapped.map(f=>'|'+f.key+'='+f.value).join('')+'}}',count,kind:'verified-foreign-person-interface',nativeOldids:[native.oldid]};
}
function v2217InfoboxLocalizedValue(key,value,cfg={}) {
 let next=value;
 if(cfg.multilingual!==false&&['homepage','website','site','site_oficial'].includes(key)){
  const parsed=templates(v24SyntaxProtected(value).view);
  const edits=[];
  for(const n of parsed.nodes.filter(n=>n.depth===0)){
   const raw=value.slice(n.start,n.end),p=parsedTemplate(raw),parts=v24SyntaxParts(raw.slice(2,-2));
   if(!['url','oficial'].includes(nameOf(p.parts[0]))||!parts||parts.length!==3)continue;
   const label=parts[2],m=/^([ \t]*)(?:(2)[ \t]*=[ \t]*)?(Office website|Official website|Campaign website)([ \t]*)$/.exec(label.text);
   if(!m)continue;
   const mapped=m[3]==='Campaign website'?'Sítio de campanha':'Sítio oficial';
   edits.push({start:n.start+2+label.start,end:n.start+2+label.end,text:m[1]+(m[2]?'2=':'')+mapped+m[4]});
  }
  next=v24SyntaxApply(value,edits);
 }
 if(cfg.multilingual!==false&&key==='partido')next=next.replace(/\[\[(Partido Democrata \(Estados Unidos\))\|Democratic\]\]/g,'[[$1|Democrata]]');
 return next!==value?next:null;
}
function v2217NativePersonFieldPlan(raw,cfg={}) {
 if(cfg.multilingual===false||cfg.automaticParameterNames===false||cfg.automaticBiographyFields===false)return null;
 const name=v2217InfoboxName(raw),profile=INFOBOX_CATALOG[name],native=profile&&V221_INFOBOX_CONTRACTS[profile.title],parsed=v2217InfoboxFields(raw);
 if(!profile||!native||!parsed||!v2217VerifiedPersonBox({name,raw})||parsed.fields.some(f=>f.positional))return null;
 const aliases=[['imagem','foto'],['legenda','imagem_legenda','desc'],['nome_nascimento','nome de nascimento'],['data_nascimento','nascimento_data','nasceu','nascimento'],['local_nascimento','nascimento_local','nascimento_cidade','cidade natal','localnasc'],['data_morte','morte_data','data_falecimento','faleceu','falecimento'],['local_morte','morte_local','local_falecimento','localfaleceu'],['ocupação','ocupações','ocupacao','trabalho civil','Ocupação'],['período_atividade','atividade','actividade','atividade_período'],['website','site','url','sítio','site_oficial','homepage'],['cônjuge','conjuge'],['filhos','filho','filhas','filha']];
 const fields=parsed.fields,edits=[];
 for(const field of fields){
  const portugueseSite=name==='info/biografia'&&['website','homepage'].includes(field.key)&&native.consumed.includes('site');
  const target=portugueseSite?'site':V2217_PERSON_FIELDS[field.key];if(!target||target===field.key||!portugueseSite&&profileAccepts(profile,field.key)||!native.consumed.includes(target))continue;
  const family=aliases.find(group=>group.includes(target))||[target];
  if(fields.some(other=>other!==field&&(family.includes(other.key)||family.includes(V2217_PERSON_FIELDS[other.key]))))continue;
  const part=field.part.text,at=part.indexOf('='),keyStart=field.start+part.slice(0,at).search(/\S/),keyEnd=field.start+part.slice(0,at).replace(/[ \t\r\n]+$/,'').length;
  if(keyStart<field.start||keyEnd<=keyStart)continue;
  edits.push({start:keyStart,end:keyEnd,text:target});
 }
 return edits.length?{text:v24SyntaxApply(raw,edits),count:edits.length,kind:'native-person-imported-key'}:null;
}
function v2217InfoboxFormatCall(raw,cfg={},depth=0) {
 if(depth>32)return null;
 const name=v2217InfoboxName(raw);if(!v2217InfoboxIsName(name,raw))return null;
 let parsed=v2217InfoboxFields(raw);if(!parsed||!parsed.fields.length)return null;
 cfg={...cfg,v2217DeceasedContext:v2217InfoboxDeathContext(parsed,raw,cfg)};
 let text=raw,count=0,kinds=[];
 // This certified local adapter has a literal-key guard. Run that unchanged
 // guard before padding fields, which would make its supplied keys ineligible.
 if(name==='ficha de persona'){
  const pinned=v219LocalBiographyNameComposition(text,cfg);
  if(pinned?.text&&pinned.text!==text){text=pinned.text;count+=2;kinds.push('existing-native-name-adapter');parsed=v2217InfoboxFields(text);}
 }
 const migrated=v2217InfoboxPersonMigration(text,cfg)||v2217InfoboxEthnicMigration(text,cfg)||v2217InfoboxForeignPersonMigration(text,cfg);
 if(migrated){text=migrated.text;count+=migrated.count;kinds.push(migrated.kind);parsed=v2217InfoboxFields(text);}
 const nativeFields=v2217NativePersonFieldPlan(text,cfg);if(nativeFields){text=nativeFields.text;count+=nativeFields.count;kinds.push(nativeFields.kind);parsed=v2217InfoboxFields(text);}
 const seen=new Set();if(parsed.fields.some(f=>seen.has(f.key)||!seen.add(f.key)))return migrated?{text,count,kinds}:null;
 const values=[],person=v2217VerifiedPersonBox({name:v2217InfoboxName(text),raw:text});
 for(const f of parsed.fields){
  let value=f.value;
  const nested=value.includes('{{')?templates(v24SyntaxProtected(value).view).nodes.filter(n=>n.depth===0):[],inside=[];
  for(const n of nested){const found=v2217InfoboxFormatCall(value.slice(n.start,n.end),cfg,depth+1);if(found&&found.text!==value.slice(n.start,n.end)){inside.push({start:n.start,end:n.end,text:found.text});count+=found.count;kinds.push(...found.kinds);}}
  if(inside.length)value=v24SyntaxApply(value,inside);
  if(cfg.dates!==false&&cfg.birthDates!==false&&person&&!cfg.v2217DeceasedContext&&['data_nascimento','nascimento_data','birth_date'].includes(f.key)){
   const date=v2217InfoboxDate(value);if(date&&date!==value){value=date;count++;kinds.push('native-birth-date-order');}
  }
  const localized=v2217InfoboxLocalizedValue(f.key,value,cfg);if(localized){value=localized;count++;kinds.push('typed-infobox-label');}
  values.push({...f,value});
 }
 const canFormat=cfg.infoboxAlignment!==false&&cfg.alignInfoboxParameters!==false&&cfg.automaticFieldSyntax!==false;
 const selector=name==='info/assentamento/marrocos'&&values[0]?.positional&&values[0].value==='com';
 const named=values.slice(selector?1:0);
 if(canFormat&&named.length&&named.every(f=>!f.positional)){
  const width=Math.max(22,...named.map(f=>Array.from(f.key).length+1));
  if(width<=80){
   const eol=raw.includes('\r\n')?'\r\n':'\n';
   const header=v2217InfoboxNamedTrim(parsed.header),lines=named.map(f=>'|'+f.key+' '.repeat(width-Array.from(f.key).length)+'='+v2217InfoboxNamedTrim(f.value)+eol);
   let formatted='{{'+header+(selector?'|com':'')+eol+lines.join('')+'}}';
   const oldFields=v2217InfoboxFields(text)?.fields||[];
   for(let i=selector?1:0;i<values.length;i++){
    const old=oldFields[i];if(!old)continue;
    const expected='\n|'+values[i].key+' '.repeat(width-Array.from(values[i].key).length)+'='+v2217InfoboxNamedTrim(values[i].value);
    const oldSegment=text.slice(old.start-1,old.end).replace(/\r\n/g,'\n').replace(/\n[ \t]*$/,'');
    if(oldSegment!==expected.slice(1)||!/^\r?\n/.test(text.slice(old.start-2,old.start-1)))count++;
   }
   if(!/\r?\n[ \t]*\}\}$/.test(text))count++;
   if(formatted!==text){text=formatted;kinds.push('named-infobox-lines');}
  }
 }else if(values.some((f,i)=>f.value!==parsed.fields[i].value)){
  text='{{'+parsed.header+values.map(f=>'|'+(f.positional?'':f.key+'=')+f.value).join('')+'}}';
 }
 if(text===raw)return null;
 return {text,count:Math.max(1,count),kinds:[...new Set(kinds)]};
}
function v2217InfoboxManualTable(source,cfg={}) {
 if(!/^\s*\{\|[ \t]+class="infobox vcard"\s*\r?\n/.test(source))return null;
 const stop=source.indexOf('\n|}');if(stop<0)return null;
 const end=stop+3,raw=source.slice(0,end),lines=raw.split(/\r?\n/),caption=/^\|\+ class="infobox-title fn org"(?: id="([A-Za-z0-9_-]+)")? \|([^\r\n]+)$/.exec(lines[1]||'');
 if(!caption||lines.some(l=>l.includes('{|')&&l!==lines[0]))return null;
 const cells=[];let color=null;
 for(const line of lines.slice(2,-1)){
  if(/^\|- class="infobox-(?:full-data|header)" colspan="2"(?: style="background-color:#[0-9a-fA-F]{6};")?$/.test(line))continue;
  const header=/^! colspan="2" class="infobox-header" style="background-color:(#[0-9a-fA-F]{6});" \| ?([^\r\n]+)$/.exec(line);
  const data=/^\| colspan="2" class="infobox-full-data" \| ?([^\r\n]+)$/.exec(line);
  if(header){if(color&&color!==header[1])return null;color=header[1];cells.push({kind:'tópico',value:header[2]});}
  else if(data)cells.push({kind:'dados',value:data[1]});else return null;
 }
 if(!color||!cells.length||cells.length%2||cells.some((c,i)=>c.kind!==(i%2?'dados':'tópico')||v24SyntaxParts(c.value)?.length!==1))return null;
 const title=(caption[1]?'{{Âncora|'+caption[1]+'}}':'')+caption[2];
 const text='{{Infocaixa\n|classe=vcard\n|cabeçalho-classe=fn org\n|cabeçalho='+title+'\n|tópico-estilo=background-color:'+color+';\n'+cells.map((c,i)=>'|'+c.kind+(i+1)+'='+c.value+'\n').join('')+'}}';
 return {start:0,end,text,kind:'literal-infobox-table',count:1,proof:{caption:caption[2],anchor:caption[1]||null,color,cells}};
}
function v2217InfoboxPlan(source,cfg={}) {
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};
 if(!v2217InfoboxScope(source,cfg)||!source.includes('{{')&&!source.includes('class="infobox vcard"'))return empty;
 let potential=source.includes('class="infobox vcard"');
 if(!potential)for(const match of source.matchAll(/\{\{\s*([^{}|\r\n]+)/g))if(v2217InfoboxIsName(nameOf(match[1].trim()))){potential=true;break;}
 if(!potential)return empty;
 let text=source;const steps=[];
 const manual=v2217InfoboxManualTable(text,cfg);if(manual){const before=text;text=v24SyntaxApply(text,[manual]);steps.push({source:before,text,edits:[manual]});}
 const shield=v24SyntaxProtected(text),view=v24SyntaxMaskRanges(shield.view,refTokens(shield.view)),nodes=templates(view).nodes,edits=[];
 const deceasedCategory=/^[ \t]*\[\[(?:(?:Categoria|Category):(?:Mortos|Deaths) (?:em |in )?\d{3,4}|Category:\d{3,4} deaths)(?:\||\]\])/im.test(view);
 for(const node of nodes.filter(n=>n.depth===0)){
  const raw=text.slice(node.start,node.end),next=v2217InfoboxFormatCall(raw,{...cfg,v2217DeceasedContext:deceasedCategory||cfg.v2217DeceasedContext===true});
  if(next&&next.text!==raw)edits.push({start:node.start,end:node.end,text:next.text,count:next.count,kind:'infobox-interface-and-layout',proof:{kinds:next.kinds}});
 }
 if(edits.length){const before=text;text=v24SyntaxApply(text,edits);steps.push({source:before,text,edits});}
 if(text===source)return empty;
 const all=v220BioSingleDifference(source,text,'v2217Infobox',{steps:steps.length});all[0].count=steps.reduce((n,s)=>n+s.edits.reduce((m,e)=>m+(e.count||1),0),0);
 return {...empty,text,steps,edits:all};
}
function v2217InfoboxProof(before,after,plan,cfg={}) {
 if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
 const fresh=v2217InfoboxPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
function v2217InfoboxProjection(source,cfg={}) {
 return v2217InfoboxPlan(source,cfg).text;
}
