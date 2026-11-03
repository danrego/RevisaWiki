// Local syntax preferences use only literal calls and native alias identities.
function v2215ArticleDraftContext(cfg={},source=null){
 if(cfg.namespaceNumber!==2||typeof cfg.pageTitle!=='string'||cfg.sectionOnly||
  cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||cfg.pageRedirect||cfg.pageDisambiguation||
  cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.model&&cfg.model!=='wikitext'||
  cfg.contentModel!=='wikitext'&&cfg.model!=='wikitext'||cfg.templateDefinition===true)return false;
 const title=cfg.pageTitle.replace(/_/g,' ');
 if(!/^(?:Usuário(?:\(a\))?|Usuária|User):[^/:{}\[\]<>|\r\n]+\/(?:Testes|Rascunho)(?:\/|$)/iu.test(title)||
  /\.(?:js|css|json)(?:\/|$)/i.test(title)||/\/(?:Predefinição|Template|Módulo|Module)(?::|\/|$)/iu.test(title))return false;
 if(typeof source==='string'){
  const view=scanProtectedView(source);
  if(/<\/?(?:noinclude|includeonly|onlyinclude)\b/i.test(view)||view.includes('{{{'))return false;
 }
 return true;
}
function v2215AliasScope(source,cfg={},talk=false){
 return typeof source==='string'&&source.length<=4194304&&
  (talk?Number.isInteger(cfg.namespaceNumber)&&cfg.namespaceNumber>0&&cfg.namespaceNumber%2===1:cfg.namespaceNumber===0||v2215ArticleDraftContext(cfg,source))&&!cfg.sectionOnly&&
  (cfg.section===undefined||cfg.section===null||cfg.section==='')&&
  (!cfg.contentModel||cfg.contentModel==='wikitext')&&!cfg.pageRedirect&&!cfg.pageDisambiguation;
}
function v2215LiteralFields(raw){
 const p=parsedTemplate(raw),parts=v24SyntaxParts(raw.slice(2,-2));
 if(!parts||!v219OriginalTemplateHeaderAllowed(p.parts[0])||/^[ \t]*#/.test(p.parts[0]))return null;
 const fields=[];
 for(const part of parts.slice(1)){
  const m=/^([ \t\r\n]*)([^={}\[\]<>\r\n]+?)([ \t]*=)([ \t]*)([\s\S]*)$/.exec(part.text);
  if(!m)continue;
  const key=m[2].trim(),leading=m[2].length-m[2].trimStart().length;
  if(!key||/^\d+$/.test(key))continue;
  fields.push({key,value:m[4]+m[5],keyStart:2+part.start+m[1].length+leading,
   keyEnd:2+part.start+m[1].length+leading+key.length,
   spaceStart:2+part.start+m[1].length+m[2].length+m[3].length,spaces:m[4]});
 }
 return{p,fields};
}
const V2215_CITATION_PREFERENCE_EXACT=Object.freeze({"access-date":"acessodata","accessdate":"acessodata","accessodata":"acessodata","acessdate":"acessodata","agency":"agência","air-date":"transmissão","archive-date":"arquivodata","archive-format":"arquivoformato","archive-url":"arquivourl","archivedate":"arquivodata","archiveurl":"arquivourl","article":"capítulo","article-format":"formato-capitulo","article-url":"capítulourl","at":"em","authors":"autores","book-title":"títulolivro","booktitle":"títulolivro","call-sign":"indicativo","callsign":"indicativo","chapter":"capítulo","chapter-format":"formato-capitulo","chapter-url":"capítulourl","chapterurl":"capítulourl","city":"cidade","class":"classe","coauthor":"coautores","coauthors":"coautores","collaboration":"colaboração","conference":"conferência","conference-format":"formato-conferência","conference-url":"conferência-url","conferenceurl":"conferência-url","contribution":"contribuição","contribution-format":"formato-capitulo","contribution-url":"capítulourl","contributionurl":"capítulourl","credits":"autores","date":"data","dead-url":"urlmorta","deadurl":"urlmorta","degree":"grau","department":"subtítulo","dictionary":"obra","display-authors":"numero-autores","display-editors":"numero-editores","displayauthors":"numero-autores","displayeditors":"numero-editores","distributor":"publicado","docket":"expediente","doi-broken":"doi-incorrecto","doi-broken-date":"doi-incorrecto","doi-inactive-date":"doi-incorrecto","doi-inactivedate":"doi-incorrecto","ed":"edição","edition":"edição","editors":"editores","encyclopaedia":"enciclopédia","encyclopedia":"enciclopédia","entry":"capítulo","entry-format":"formato-capitulo","entry-url":"capítulourl","episode":"episódio","episode-link":"titulolink","episodelink":"titulolink","event":"conferência","event-format":"formato-conferência","event-url":"conferência-url","eventurl":"conferência-url","format":"formato","in":"língua","inset":"requadro","institution":"publicado","interviewer":"entrevistador","interviewers":"entrevistador","issue":"número","journal":"periódico","lang":"língua","language":"língua","last-author-amp":"ultimoamp","lastauthoramp":"ultimoamp","lay-date":"resumo-data","lay-format":"resumo-formato","lay-source":"resumo-fonte","lay-summary":"resumo-url","lay-url":"resumo-url","laydate":"resumo-data","laysource":"resumo-fonte","laysummary":"resumo-url","layurl":"resumo-url","location":"local","magazine":"revista","map":"mapa","map-format":"mapa-formato","map-url":"mapa-url","mapurl":"mapa-url","medium":"tipo","message-id":"id-mensagem","minutes":"minutos","mode":"modo","month":"mês","name-list-format":"formato-lista-nomes","name-list-style":"formato-lista-nomes","network":"rede","newsgroup":"publicado","newspaper":"jornal","no-pp":"nopp","no-tracking":"nocat","notracking":"nocat","number":"número","orig-year":"anooriginal","origyear":"anooriginal","others":"outros","page":"página","pages":"páginas","people":"autores","periodical":"obra","place":"local","postscript":"pontofinal","program":"programa","publication-date":"data-publicação","publication-place":"local-publicação","publicationdate":"data-publicação","publicationplace":"local-publicação","publisher":"publicado","quotation":"citação","quote":"citação","registration":"registro","scale":"escala","script-chapter":"capitulo-translit","script-title":"título-translit","season":"temporada","section":"seção","section-format":"formato-capitulo","section-url":"capítulourl","sections":"seções","sectionurl":"capítulourl","series":"série","series-link":"sérielink","series-no":"numero-serie","series-number":"numero-serie","series-separator":"separador-series","serieslink":"sérielink","seriesno":"numero-serie","seriesnumber":"numero-serie","sheet":"folha","sheets":"folhas","station":"estação","subscription":"subscrição","template-doc-demo":"nocat","time":"tempo","time-caption":"legenda","timecaption":"legenda","title":"título","title-link":"titulolink","titlelink":"titulolink","trans-chapter":"capítulo-trad","trans-title":"títulotrad","trans_chapter":"capítulo-trad","trans_title":"títulotrad","transcript":"transcrição","transcript-format":"transcrição-formato","transcript-url":"transcriçãourl","transcripturl":"transcriçãourl","type":"tipo","url-access":"acessourl","version":"versão","website":"obra","work":"obra","year":"ano","first":"primeiro","given":"primeiro","author-first":"primeiro","author":"autor","last":"ultimo","surname":"ultimo","author-last":"ultimo","subject":"autor","host":"autor","authorlink":"autorlink","author-link":"autorlink","subjectlink":"autorlink","subject-link":"autorlink","author-mask":"autor-mascara","authormask":"autor-mascara","contributor-first":"contribuidor-primeiro","contributor-last":"contribuidor-ultimo","contributor-link":"contribuidor-link","contributor-mask":"contribuidor-mascara","editor-first":"editor-nome","editor-given":"editor-nome","editor-last":"editor-sobrenome","editor-surname":"editor-sobrenome","editor-link":"editorlink","editorlink":"editorlink","editor-mask":"editor-mascara","editormask":"editor-mascara","translator-first":"tradutor-primeiro","translator-given":"tradutor-primeiro","translator":"tradutor","translator-last":"tradutor","translator-link":"tradutor-link","translator-mask":"tradutor-mascara"});
const V2215_CITATION_PREFERENCE_NUMBERED=Object.freeze({"first#":"primeiro#","given#":"primeiro#","author-first#":"primeiro#","author#-first":"primeiro#","author#":"autor#","last#":"ultimo#","surname#":"ultimo#","author-last#":"ultimo#","author#-last":"ultimo#","subject#":"autor#","host#":"autor#","authorlink#":"autorlink#","author#-link":"autorlink#","author-link#":"autorlink#","subjectlink#":"autorlink#","author#link":"autorlink#","subject-link#":"autorlink#","subject#-link":"autorlink#","author-mask#":"autor-mascara#","authormask#":"autor-mascara#","author#mask":"autor-mascara#","author#-mask":"autor-mascara#","contributor-first#":"contribuidor-primeiro#","contributor#-first":"contribuidor-primeiro#","contributor-last#":"contribuidor-ultimo#","contributor#-last":"contribuidor-ultimo#","contributor-link#":"contribuidor-link#","contributor#-link":"contribuidor-link#","contributor-mask#":"contribuidor-mascara#","contributor#-mask":"contribuidor-mascara#","editor#-first":"editor-nome#","editor-first#":"editor-nome#","editor-given#":"editor-nome#","editor#-given":"editor-nome#","editor#-last":"editor-sobrenome#","editor-last#":"editor-sobrenome#","editor-surname#":"editor-sobrenome#","editor#-surname":"editor-sobrenome#","editor#-link":"editorlink#","editorlink#":"editorlink#","editor#link":"editorlink#","editor-mask#":"editor-mascara#","editor#-mask":"editor-mascara#","editormask#":"editor-mascara#","editor#mask":"editor-mascara#","translator-first#":"tradutor-primeiro#","translator#-first":"tradutor-primeiro#","translator-given#":"tradutor-primeiro#","translator#-given":"tradutor-primeiro#","translator#":"tradutor#","translator-last#":"tradutor#","translator#-last":"tradutor#","translator-link#":"tradutor-link#","translator#-link":"tradutor-link#","translator-mask#":"tradutor-mascara#","translator#-mask":"tradutor-mascara#","editor-link#":"editorlink#"});
function v2215PortugueseCitationKey(key){
 if(typeof key!=='string')return null;
 if(Object.hasOwn(V2215_CITATION_PREFERENCE_EXACT,key))return V2215_CITATION_PREFERENCE_EXACT[key];
 const match=/^([^0-9]*)([1-9]\d*)([^0-9]*)$/.exec(key);
 if(!match)return null;
 const from=match[1]+'#'+match[3];
 return Object.hasOwn(V2215_CITATION_PREFERENCE_NUMBERED,from)?V2215_CITATION_PREFERENCE_NUMBERED[from].replace('#',match[2]):null;
}
const V2215_CITATION_READER_PINS=Object.freeze({"Módulo:Citar arXiv":[49700071,"ordinary"],"Módulo:Citar comunicado de imprensa":[53648408,"ordinary"],"Módulo:Citar conferência":[53655216,"conference"],"Módulo:Citar discurso":[48055217,"ordinary"],"Módulo:Citar tese":[49700092,"thesis"],"Módulo:Citar enciclopédia":[49700072,"ordinary"],"Módulo:Citar entrevista":[60323352,"ordinary"],"Módulo:Citar episódio":[49700078,"episode"],"Módulo:Citar grupo de notícias":[49700081,"ordinary"],"Módulo:Citar jogo eletrônico":[49700086,"game"],"Módulo:Citar periódico":[49463910,"periodical"],"Módulo:Citar lista de discussão":[48176994,"mailing-list"],"Módulo:Citar livro":[49448102,"book"],"Módulo:Citar mapa":[48253463,"map"],"Módulo:Citar audiovisual":[49699570,"ordinary"],"Módulo:Citar relatório":[49700087,"ordinary"],"Módulo:Citar relatório técnico":[49700088,"technical-report"],"Módulo:Citar série":[49700089,"series"],"Módulo:Citar web":[48965255,"ordinary"]});
function v2215CitationReader(context){
 const p=context?.profile,deps=p?.dependencies;
 if(!p||!Array.isArray(deps)||!deps.some(x=>x.title==='Módulo:Citação/CS1'&&x.oldid===72936771)||
  !deps.some(x=>x.title==='Módulo:Citação/CS1/Configuração'&&x.oldid===73016847)||
  !deps.some(x=>x.title==='Módulo:Citação/CS1/Whitelist'&&x.oldid===71860752))return null;
 for(const x of deps){const pin=V2215_CITATION_READER_PINS[x.title];if(pin&&x.oldid===pin[0])return{kind:pin[1],module:x.title,oldid:x.oldid};}
 return p.title==='Citation'&&p.oldid===62525251?{kind:'ordinary',module:'Módulo:Citação/CS1',oldid:72936771}:null;
}
function v2215CitationAliasRole(key,role,aliases){
 for(const alias of aliases){
  if(!alias.includes('#')){if(key===alias)return role;continue;}
  const [a,b]=alias.split('#'),escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),m=new RegExp('^'+escape(a)+'([1-9]\\d*)?'+escape(b)+'$').exec(key);
  if(m)return role+':'+(m[1]||'1');
 }
 return null;
}
function v2215CitationModelRoles(key,reader){
 const out=new Set(v219NativeCitationRoles(key));if(!reader)return [...out].sort();
 const replace=(role,aliases)=>{for(const x of out)if(x===role||x.startsWith(role+':'))out.delete(x);const found=v2215CitationAliasRole(key,role,aliases);if(found)out.add(found);};
 const add=(role,aliases)=>{const found=v2215CitationAliasRole(key,role,aliases);if(found)out.add(found);};
 if(reader.kind==='book')add('Native-BookNumber',['número','numero']);
 if(reader.kind==='technical-report')add('ID',['número','numero','number']);
 if(reader.kind==='map'){
  replace('Chapter',['mapa','map']);replace('ChapterURL',['urlmapa','mapurl','map-url']);
  replace('ChapterFormat',['formato-mapa','map-format']);replace('TransChapter',['trans-map','mapa-trad']);
  replace('Cartography',['cartografia','cartography']);replace('Sheet',['folha','sheet']);replace('Sheets',['folhas','sheets']);
 }
 if(reader.kind==='conference'||reader.kind==='episode')replace('ChapterURL',V219_NATIVE_CS1_ALIAS_ROLES.URL);
 if(reader.kind==='episode')add('Issue',['episódio','episodio','episode']);
 if(reader.kind==='series')replace('Chapter',['episodio','episódio','episode']);
 if(reader.kind==='mailing-list')replace('Periodical',['lista','lista-correio','lista-discussão','mailinglist','mailing-list']);
 if(reader.kind==='thesis')replace('Degree',['grau','degree','grado']);
 if(reader.kind==='game'){
  replace('Series',V219_NATIVE_CS1_ALIAS_ROLES.Series.filter(x=>!['version','versão'].includes(x)));
  add('AuthorList-Last',['desenvolvedor#','developer#','produtor#','desenvolvedora#']);
  add('PublisherName',['distribuidora','publicadora']);add('Volume',['plataforma','platform']);
  add('Issue',['versão','version']);add('Language',['isolang']);add('Native-Scene',['cena','scene']);add('Native-Level',['fase','nível','level']);
 }
 if(reader.kind==='periodical')add('Native-PeriodicalMonth',['mes','mês']);
 return [...out].sort();
}
function v2215CitationModelAliasSafe(from,to,context,fields){
 const reader=v2215CitationReader(context);if(!reader)return false;
 const a=v2215CitationModelRoles(from,reader),b=v2215CitationModelRoles(to,reader);
 if(JSON.stringify(a)!==JSON.stringify(b))return false;
 if(reader.kind==='map'&&['at','sheet','sheets','em','folha','folhas'].includes(from)&&
  fields.filter(f=>['at','sheet','sheets'].includes(f.key)).length>1)return false;
 return true;
}
function v2215CitationDateRole(roles,reader){
 const known={Date:'date',AccessDate:'access',ArchiveDate:'archive',PublicationDate:'publication',Year:'year',DoiBroken:'date',Embargo:'embargo',LayDate:'date'};
 const kinds=roles.filter(x=>Object.hasOwn(known,x)).map(x=>known[x]);
 if(!kinds.length&&reader?.kind==='episode'&&roles.includes('AirDate'))kinds.push('date');
 return new Set(kinds).size===1?kinds[0]:null;
}
function v2215PeriodicalMonthDate(raw,context){
 const fields=v2151FieldSyntaxParts(raw),contract=v219SourceNativeContract(raw,context);
 if(!fields||!contract||fields.some(f=>f.key!==f.plain||f.separator!=='='))return null;
 const edits=v219SourceMonthYearEdits(fields,context,contract,{dates:true,automaticCitationDateValues:true}),
  removal=edits.filter(e=>e.text===''&&e.proof?.kind==='typed-native-month-year-pair');
 if(removal.length!==1)return null;
 const text=removal[0].proof.valueAfter,value=v218CitationDateValue(text,'date')||v219SupplementalCitationDateValue(text,'date');
 return value?JSON.stringify([value.precision,value.identity]):null;
}
function v2215CitationReadRows(source){
 const rows=[],references=v219NativeReferenceObserver(source).refs;
 for(const n of templates(protectedView(source)).nodes){
  const raw=source.slice(n.start,n.end),context=v218CitationNativeContext(raw),reader=context&&v2215CitationReader(context),fields=reader&&v2215LiteralFields(raw)?.fields;
  if(!reader||!fields||!['book','map','game','technical-report','periodical'].includes(reader.kind)&&!fields.some(f=>['vauthors','veditors','vautores','veditores'].includes(f.key)&&f.value.trim()))continue;
  const values=[],identity=[],dates=[],vancouver=[];
  for(const field of fields){
   if(!field.value.trim())continue;
   const roles=v2215CitationModelRoles(field.key,reader);
   if(reader.kind==='periodical'&&roles.includes('Date')){const v=v218CitationDateValue(field.value.trim(),'date')||v219SupplementalCitationDateValue(field.value.trim(),'date');dates.push(v?JSON.stringify([v.precision,v.identity]):null);}
   const sensitive=roles.filter(role=>reader.kind==='book'?role==='Native-BookNumber':
    reader.kind==='map'?['Chapter','ChapterURL','ChapterFormat','TransChapter','Cartography','Sheet','Sheets'].includes(role):
    reader.kind==='game'?['Series','Issue'].includes(role):reader.kind==='technical-report'?role==='ID':role==='Native-PeriodicalMonth');
   const identityRoles=roles.filter(role=>role==='Title'||role==='ScriptTitle'||role==='URL'||role.startsWith('Identifier:'));
   const rawVancouver=['vauthors','veditors'].includes(field.key);
   if(!sensitive.length&&!identityRoles.length&&!rawVancouver)continue;
   const value=v24InventoryBody(field.value,{});
   if(rawVancouver)vancouver.push([field.key,value]);
   for(const role of sensitive)values.push([role,value]);
   for(const role of identityRoles)identity.push([role,value]);
  }
  const owners=references.filter(r=>r.valid&&!r.self&&r.start<n.start&&n.end<r.end&&v24SyntaxLiteralIdentity(r.attrs,true));
  const owner=owners.length===1?JSON.stringify([owners[0].group??'',owners[0].attrs.name]):null;
  rows.push({kind:reader.kind,module:reader.module,oldid:reader.oldid,owner,raw,dates,vancouver:[...new Map(vancouver.map(v=>[JSON.stringify(v),v])).values()],monthDate:reader.kind==='periodical'?v2215PeriodicalMonthDate(raw,context):null,identity:identity.length?JSON.stringify(identity.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))):null,values:[...new Map(values.map(x=>[JSON.stringify(x),x])).values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),start:n.start});
 }
 return rows;
}
function v2215NativeCitationReadAudit(before,after,options={}){
 if(typeof before!=='string'||typeof after!=='string'||before===after||before.length>4194304||after.length>4194304||
  options.namespaceNumber!==undefined&&options.namespaceNumber!==0&&!v2215ArticleDraftContext(options,before)||options.contentModel&&options.contentModel!=='wikitext')return [];
 const a=v2215CitationReadRows(before),b=v2215CitationReadRows(after),findings=[],pairs=[],usedA=new Set(),usedB=new Set();
 const matchBy=selector=>{
  const left=new Map(),right=new Map(),put=(m,k,i)=>{if(!m.has(k))m.set(k,[]);m.get(k).push(i);};
  a.forEach((row,i)=>{const key=!usedA.has(i)&&selector(row);if(key)put(left,key,i);});
  b.forEach((row,i)=>{const key=!usedB.has(i)&&selector(row);if(key)put(right,key,i);});
  for(const[key,indexes]of left){const next=right.get(key);if(indexes.length!==1||next?.length!==1)continue;
   const i=indexes[0],j=next[0];usedA.add(i);usedB.add(j);pairs.push([a[i],b[j]]);
  }
 };
 // Named definitions may move to first use. Match their literal owners before
 // bibliographic identity, so values cannot migrate between named sources.
 const model=row=>JSON.stringify([row.module,row.oldid]);
 matchBy(row=>row.owner&&model(row)+'|owner:'+row.owner);
 matchBy(row=>row.identity&&model(row)+'|identity:'+row.identity);
 // A sole remaining call of a verified model is unambiguous. Repeated calls
 // with no stable identity remain subject to the existing source checks.
 matchBy(model);
 const unmatched=()=>{
  const left=new Map(),right=new Map(),put=(m,row,i)=>{const k=model(row);if(!m.has(k))m.set(k,[]);m.get(k).push({row,i});};
  a.forEach((row,i)=>{if(!usedA.has(i))put(left,row,i);});b.forEach((row,i)=>{if(!usedB.has(i))put(right,row,i);});return{left,right};
 };
 // Byte-identical source calls are interchangeable only inside this reader
 // observation. Reference ownership and multiplicity keep their prior checks.
 for(const[key,left]of unmatched().left){const right=unmatched().right.get(key);
  if(!right?.length||!left.every(x=>x.row.raw===left[0].row.raw)||!right.every(x=>x.row.raw===right[0].row.raw))continue;
  left.forEach(x=>usedA.add(x.i));right.forEach(x=>usedB.add(x.i));pairs.push([left[0].row,right[0].row]);
 }
 const sameReadings=(priorRow,nextRow)=>{
  if(!priorRow.vancouver.every(v=>nextRow.vancouver.some(n=>JSON.stringify(n)===JSON.stringify(v))))return false;
  if(JSON.stringify(priorRow.values)===JSON.stringify(nextRow.values))return true;
  return priorRow.kind==='periodical'&&priorRow.values.length===1&&nextRow.values.length===0&&
   priorRow.monthDate!==null&&nextRow.dates.length===1&&nextRow.dates[0]===priorRow.monthDate;
 };
 for(const[priorRow,nextRow]of pairs)if(!sameReadings(priorRow,nextRow))
  findings.push({code:'changed-native-citation-reader',message:'Uma chave de citação mudou a função lida pelo modelo nativo.',start:priorRow.start,severity:'warning'});
 // An exact duplicate may disappear when its already matched copy retains
 // every native reading. This cannot discount a different call or value.
 a.forEach((row,i)=>{if(!usedA.has(i)&&pairs.some(([p,n])=>p.module===row.module&&p.oldid===row.oldid&&p.raw===row.raw&&sameReadings(p,n)))usedA.add(i);});
 b.forEach((row,i)=>{if(!usedB.has(i)&&pairs.some(([p,n])=>n.module===row.module&&n.oldid===row.oldid&&n.raw===row.raw&&sameReadings(p,n)))usedB.add(i);});
 const remaining=unmatched();
 for(const key of new Set([...remaining.left.keys(),...remaining.right.keys()])){
  const left=remaining.left.get(key)||[],right=remaining.right.get(key)||[],old=left.flatMap(x=>x.row.values.map(v=>JSON.stringify(v))).sort(),fresh=right.flatMap(x=>x.row.values.map(v=>JSON.stringify(v))).sort(),kind=(left[0]||right[0]).row.kind;
  let same=JSON.stringify(old)===JSON.stringify(fresh);
  const required=new Map(),available=new Map();for(const x of left)for(const v of x.row.vancouver){const k=JSON.stringify(v);required.set(k,(required.get(k)||0)+1);}for(const x of right)for(const v of x.row.vancouver){const k=JSON.stringify(v);available.set(k,(available.get(k)||0)+1);}
  if([...required].some(([k,n])=>(available.get(k)||0)<n))same=false;
  if(!same)findings.push({code:'changed-native-citation-reader',message:'Uma chave de citação mudou a função lida pelo modelo nativo.',start:(left[0]||right[0]).row.start,severity:'warning'});
 }
 return findings;
}
function v2215PreferredCall(raw,cfg={}){
 const out={text:raw,edits:[]},parsed=v2215LiteralFields(raw);if(!parsed)return out;
 const {p,fields}=parsed,context=v218CitationNativeContext(raw),profile=INFOBOX_CATALOG[p.name],
  native=context&&v219NativeCitationCS1Consumer(raw),citation=cfg.citations!==false&&!!native,
  infobox=cfg.infoboxes!==false&&!!profile&&v215LiteralTemplateIdentity(raw,profile);
 if(!citation&&!infobox)return out;
 const add=(start,end,text,ruleId)=>out.edits.push({start,end,text,ruleId});
 for(const f of fields){
  if(cfg.automaticParameterNames!==false){
   let to=null;
   if(citation){
    let target=v2215PortugueseCitationKey(f.key);
    const reader=v2215CitationReader(context);
    if(target&&!nativeCitationAccepts(context.native,target)&&v219NativeCitationRoles(f.key).every(x=>x.endsWith(':1'))&&
      nativeCitationAccepts(context.native,target+'1'))target+='1';
    const roles=v2215CitationModelRoles(f.key,reader),other=target&&v2215CitationModelRoles(target,reader);
    if(target&&target!==f.key&&roles.length&&JSON.stringify(roles)===JSON.stringify(other)&&
       (nativeCitationAccepts(context.native,f.key)||reader&&roles.length)&&nativeCitationAccepts(context.native,target)&&
       v2215CitationModelAliasSafe(f.key,target,context,fields)&&
       fields.filter(row=>v2215CitationModelRoles(row.key,reader).some(role=>roles.includes(role))).length===1)to=target;
   }else if(profile&&f.key==='website'&&profile.accepted.includes('site')&&profile.accepted.includes('website')&&
      profile.aliases?.site==='website'&&fields.filter(row=>row.key==='website'||profile.aliases?.[row.key]==='website').length===1)to='site';
   if(to)add(f.keyStart,f.keyEnd,to,'v2215PortugueseParameters');
  }
  if(citation&&cfg.dates!==false&&cfg.automaticCitationDateValues!==false){
   const reader=v2215CitationReader(context),roles=v2215CitationModelRoles(f.key,reader),kind=reader&&v2215CitationDateRole(roles,reader);
   if(kind&&fields.filter(row=>v2215CitationModelRoles(row.key,reader).some(role=>roles.includes(role))).length===1){
    const literal=f.value.slice(f.spaces.length),value=v218CitationDateValue(literal,kind==='embargo'?'date':kind)||v219SupplementalCitationDateValue(literal,kind==='embargo'?'date':kind);
    let text=value?.text;
    if(kind==='embargo')text=value?.precision==='day'?String(value.identity.year)+'-'+String(value.identity.month).padStart(2,'0')+'-'+String(value.identity.day).padStart(2,'0'):null;
    if(text&&text!==literal)add(f.spaceStart+f.spaces.length,f.spaceStart+f.value.length,text,'v2215CitationDates');
   }
  }
  // Named arguments are trimmed by the native parser. Keep line breaks and
  // every byte after this horizontal padding, including comments and markup.
  if(cfg.markup!==false&&f.spaces)add(f.spaceStart,f.spaceStart+f.spaces.length,'','v2215ParameterSpacing');
 }
 out.edits.sort((a,b)=>a.start-b.start||a.end-b.end);out.text=v24SyntaxApply(raw,out.edits);return out;
}
function v2215AliasPlan(source,cfg={}){
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
 if(!v2215AliasScope(source,cfg))return empty;
 const shield=v24SyntaxProtected(source),view=shield.view,inventory=templates(view),edits=[],blocked=[...shield.ranges,...v27SafeMarkdownRanges(source)],
  owns=(start,end)=>blocked.some(r=>r.start<end&&start<r.end);
 for(const node of inventory.nodes){
  if(node.size!==undefined&&node.size!==2||owns(node.start,node.end))continue;
  const ancestors=inventory.nodes.filter(n=>n.start<node.start&&n.end>=node.end);
  if(ancestors.some(n=>{const raw=source.slice(n.start,n.end),name=parsedTemplate(raw).name;return!v215LiteralTemplateIdentity(raw)||!(INFOBOX_CATALOG[name]||TEMPLATE_CATALOG[name]||CITE_NAMES[name]);}))continue;
  const call=v2215PreferredCall(source.slice(node.start,node.end),cfg);
  for(const e of call.edits)edits.push({...e,start:node.start+e.start,end:node.start+e.end});
 }
 if(cfg.links!==false&&cfg.markup!==false){
  const stack=[],links=[];
  for(let i=0;i<view.length-1;i++)if(view.slice(i,i+2)==='[['){stack.push(i);i++;}else if(view.slice(i,i+2)===']]'&&stack.length){links.push({start:stack.pop(),end:i+2});i++;}
  for(const link of links){
   if(owns(link.start,link.end))continue;
   const raw=source.slice(link.start,link.end),parts=v24SyntaxParts(raw.slice(2,-2)),head=parts&&/^([ \t]*)(Image|File|Imagem|Ficheiro|Arquivo)([ \t]*:[ \t]*)([^{}<>\r\n]+)$/i.exec(parts[0].text);
   if(!head||head[4].includes('|'))continue;
   const ctx=v24SyntaxContext(view,link.start);if(ctx.templates?.length||ctx.html?.length||ctx.links?.length||ctx.external?.length)continue;
   if(/^(?:Image|File)$/i.test(head[2]))edits.push({start:link.start+2+head[1].length,end:link.start+2+head[1].length+head[2].length,text:'Imagem',ruleId:'v2215ImageSyntax'});
   // A final unknown option is a caption. Translate only native flags, leaving
   // all caption bytes, dimensions, alt text and destinations untouched.
   for(const part of parts.slice(1)){
    const m=/^([ \t]*)(thumb|thumbnail|miniaturadaimagem)([ \t]*)$/.exec(part.text);if(!m)continue;
    edits.push({start:link.start+2+part.start,end:link.start+2+part.end,text:m[1]+'miniatura'+m[3],ruleId:'v2215ImageSyntax'});
   }
  }
 }
 if(cfg.portals!==false){
  const aliases={"biography":"Biografias","biographies":"Biografias","women":"Mulheres","science":"Ciência","physics":"Física","chemistry":"Química","biology":"Biologia","medicine":"Medicina","health":"Saúde","pharmacy":"Farmácia","technology":"Tecnologia","television":"Televisão","music":"Música","literature":"Literatura","film":"Cinema","films":"Cinema","sports":"Esportes","sport":"Esportes","geography":"Geografia","mathematics":"Matemática","math":"Matemática","maths":"Matemática","history":"História","politics":"Política","economics":"Economia","business":"Negócios","education":"Educação","religion":"Religião","christianity":"Cristianismo","catholicism":"Catolicismo","judaism":"Judaísmo","buddhism":"Budismo","hinduism":"Hinduísmo","art":"Arte","arts":"Arte","architecture":"Arquitetura","painting":"Pintura","photography":"Fotografia","dance":"Dança","theatre":"Teatro","theater":"Teatro","entertainment":"Entretenimento","animation":"Animação","comics":"Banda desenhada","video games":"Jogos eletrônicos","games":"Jogos","information technology":"Tecnologias de informação","aviation":"Aviação","cars":"Carros","automobiles":"Carros","spaceflight":"Exploração espacial","space exploration":"Exploração espacial","astronomy":"Astronomia","solar system":"Sistema Solar","earth sciences":"Ciências da Terra","geology":"Geologia","meteorology":"Meteorologia","weather":"Meteorologia","ecology":"Ecologia","zoology":"Zoologia","botany":"Botânica","birds":"Aves","mammals":"Mamíferos","reptiles":"Répteis","fish":"Peixes","insects":"Insetos","viruses":"Vírus","fungi":"Fungos","genetics":"Genética","psychology":"Psicologia","sociology":"Sociologia","anthropology":"Antropologia","archaeology":"Arqueologia","philosophy":"Filosofia","linguistics":"Linguística","law":"Direito","human rights":"Direitos humanos","war":"Guerra","world war i":"Primeira Guerra Mundial","world war ii":"Segunda Guerra Mundial","wwii":"Segunda Guerra Mundial","ww2":"Segunda Guerra Mundial","ancient rome":"Roma Antiga","ancient greece":"Grécia Antiga","middle ages":"Idade Média","european union":"União Europeia","monarchy":"Monarquia","numismatics":"Numismática","beer":"Cerveja","drinks":"Bebidas","wine":"Vinho","basketball":"Basquetebol","volleyball":"Voleibol","tennis":"Tênis","baseball":"Beisebol","american football":"Futebol americano","association football":"Futebol","soccer":"Futebol","ice hockey":"Hóquei no gelo","swimming":"Natação","athletics":"Atletismo","cycling":"Ciclismo","auto racing":"Automobilismo","formula one":"Fórmula 1","olympics":"Jogos Olímpicos","olympic games":"Jogos Olímpicos","chess":"Xadrez","martial arts":"Artes marciais","gymnastics":"Ginástica","surfing":"Surfe","united states":"Estados Unidos","united kingdom":"Reino Unido","england":"Inglaterra","scotland":"Escócia","wales":"País de Gales","northern ireland":"Irlanda do Norte","france":"França","germany":"Alemanha","brazil":"Brasil","spain":"Espanha","italy":"Itália","switzerland":"Suíça","sweden":"Suécia","norway":"Noruega","finland":"Finlândia","netherlands":"Países Baixos","denmark":"Dinamarca","belgium":"Bélgica","austria":"Áustria","australia":"Austrália","canada":"Canadá","mexico":"México","colombia":"Colômbia","ecuador":"Equador","bolivia":"Bolívia","uruguay":"Uruguai","paraguay":"Paraguai","panama":"Panamá","dominican republic":"República Dominicana","india":"Índia","pakistan":"Paquistão","afghanistan":"Afeganistão","russia":"Rússia","south korea":"Coreia do Sul","north korea":"Coreia do Norte","thailand":"Tailândia","indonesia":"Indonésia","philippines":"Filipinas","singapore":"Singapura","malaysia":"Malásia","new zealand":"Nova Zelândia","saudi arabia":"Arábia Saudita","united arab emirates":"Emirados Árabes Unidos","iraq":"Iraque","palestine":"Palestina","lebanon":"Líbano","jordan":"Jordânia","egypt":"Egito","morocco":"Marrocos","algeria":"Argélia","tunisia":"Tunísia","libya":"Líbia","south africa":"África do Sul","nigeria":"Nigéria","ghana":"Gana","ethiopia":"Etiópia","mozambique":"Moçambique","cape verde":"Cabo Verde","east timor":"Timor-Leste","guinea-bissau":"Guiné-Bissau","são tomé and príncipe":"São Tomé e Príncipe","equatorial guinea":"Guiné Equatorial","zambia":"Zâmbia","namibia":"Namíbia","tanzania":"Tanzânia","sudan":"Sudão","south sudan":"Sudão do Sul","somalia":"Somália","cameroon":"Camarões","democratic republic of the congo":"República Democrática do Congo","republic of the congo":"República do Congo","central african republic":"República Centro-Africana","rwanda":"Ruanda","mauritius":"Maurícia","bhutan":"Butão","macao":"Macau","armenia":"Armênia","azerbaijan":"Azerbaijão","kazakhstan":"Cazaquistão","ukraine":"Ucrânia","belarus":"Bielorrússia","moldova":"Moldávia","romania":"Romênia","bulgaria":"Bulgária","greece":"Grécia","turkey":"Turquia","cyprus":"Chipre","iceland":"Islândia","estonia":"Estônia","latvia":"Letônia","lithuania":"Lituânia","poland":"Polônia","czech republic":"Chéquia","czechia":"Chéquia","slovakia":"Eslováquia","slovenia":"Eslovênia","croatia":"Croácia","bosnia and herzegovina":"Bósnia e Herzegovina","serbia":"Sérvia","albania":"Albânia","luxembourg":"Luxemburgo","monaco":"Mônaco","vatican city":"Vaticano","vatican":"Vaticano","california":"Califórnia","virginia":"Virgínia","west virginia":"Virgínia Ocidental","pennsylvania":"Pensilvânia","florida":"Flórida","danse":"Dança","belgique":"Bélgica","segunda gerra mundial":"Segunda Guerra Mundial","fármacia":"Farmácia","lietratura":"Literatura"};
  for(const node of topNodes(view)){
   if(owns(node.start,node.end))continue;
   const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),parts=v24SyntaxParts(raw.slice(2,-2)),
    known=v215SameTemplateTitle(p.parts[0],'Portal')||v215SameTemplateTitle(p.parts[0],'Portal3');
   if(!known||!parts||!v219OriginalTemplateHeaderAllowed(p.parts[0]))continue;
   const ctx=v24SyntaxContext(view,node.start);if(ctx.html?.length||ctx.tables?.length||ctx.links?.length||ctx.external?.length)continue;
   for(const part of parts.slice(1)){
    const m=/^([ \t]*(?:(?:[1-9]|10)[ \t]*=[ \t]*)?)([^{}\[\]<>|=\r\n]*?)([ \t]*)$/.exec(part.text);
    if(!m||!Object.hasOwn(aliases,m[2].toLocaleLowerCase('pt')))continue;
    edits.push({start:node.start+2+part.start+m[1].length,end:node.start+2+part.start+m[1].length+m[2].length,
     text:aliases[m[2].toLocaleLowerCase('pt')],ruleId:'v2215PortalAliases'});
   }
  }
 }
 const sorted=edits.sort((a,b)=>a.start-b.start||a.end-b.end).filter((e,i,a)=>!a.some((o,j)=>i!==j&&o.start<e.end&&e.start<o.end));
 const atomic=v219AtomicNamedReferenceEdits(source,sorted,cfg);
 return{...empty,edits:atomic,text:v24SyntaxApply(source,atomic)};
}
function v2215AliasProof(before,after,plan,cfg={}){
 if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
 const fresh=v2215AliasPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
function v2215PdName(header){
 if(typeof header!=='string'||!v219OriginalTemplateHeaderAllowed(header))return false;
 header=header.replace(/^[ \t]*(?:Predefinição|Template|PRE)[ \t]*:[ \t]*/i,'');
 return ['Cabeçalho de discussão','PD','Pd','Página de discussão','PW-Alvo','BPV','Bpv','Coisas a não fazer',
 'Discussão de portal','Página de discussão/Arquivo 1','Portais-aviso'].some(title=>v215SameTemplateTitle(header,title));
}
function v2215PdPlan(source,cfg={}){
 const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
 if(!v2215AliasScope(source,cfg,true)||cfg.auxiliaryTemplates===false)return empty;
 const view=scanProtectedView(source);if(/^[ \t\r\n]*#(?:redirect|redirecionamento)\b/iu.test(view))return empty;
 const nodes=topNodes(view),eligible=[];let unsafe=false;
 for(const node of nodes){
  const raw=source.slice(node.start,node.end),p=parsedTemplate(raw);if(!v2215PdName(p.parts[0]))continue;
  const ctx=v24SyntaxContext(view,node.start);if(ctx.html?.length||ctx.tables?.length||ctx.links?.length||ctx.external?.length){unsafe=true;continue;}
  // Configured banners keep every argument. Only identical configurations
  // can be deduplicated, and a configured banner wins over plain peers.
  const start=source.lastIndexOf('\n',node.start-1)+1,next=source.indexOf('\n',node.end),end=next<0?source.length:next,
   neighbors=nodes.filter(n=>n.start>=start&&n.end<=end),line=view.slice(start,end);
  let residual=line;for(const n of neighbors.slice().sort((a,b)=>b.start-a.start))residual=residual.slice(0,n.start-start)+residual.slice(n.end-start);
  if(residual.trim()||/^[ \t]*[:*#;]/.test(line)){unsafe=true;continue;}
  eligible.push({...node,lineStart:start,lineEnd:end,args:raw.slice(2+p.parts[0].length,-2)});
 }
 if(!eligible.length||unsafe)return empty;
 const configured=eligible.filter(n=>n.args),configurations=new Set(configured.map(n=>n.args));
 if(configurations.size>1)return empty;
 const selected=configured[0]||eligible[0],banner='{{PD'+selected.args+'}}',cuts=[];
 for(const n of eligible){let start=n.start,end=n.end;
  if(!source.slice(n.lineStart,n.start).trim()&&!source.slice(n.end,n.lineEnd).trim()){
   start=n.lineStart;end=n.lineEnd+(source[n.lineEnd]==='\n'?1:0);
  }
  cuts.push({start,end,text:''});
 }
 let body=v24SyntaxApply(source,cuts).replace(/^(?:[ \t]*\r?\n)+/,''),newline=source.includes('\r\n')?'\r\n':'\n',text=banner+(body?newline+body:newline);
 if(text===source)return empty;
 return{...empty,text,edits:[{start:0,end:source.length,text,ruleId:'v2215DiscussionHeader',count:eligible.length,
  proof:{kind:'native-discussion-banner-redirects',removed:eligible.map(n=>source.slice(n.start,n.end))}}]};
}
function v2215PdProof(before,after,plan,cfg={}){
 if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
 const fresh=v2215PdPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
function v25TalkPreparationPlan(source,article='',cfg={}){
 const normalized=v2215PdPlan(source,cfg),result=v2215BaselineTalkPreparationPlan(normalized.text,article,cfg);
 return{...result,source,changed:result.text!==source};
}
