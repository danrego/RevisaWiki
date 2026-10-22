'use strict';
// Finite catalog conformance and protected-context campaign. Expected mappings
// are enumerated from the declared contract tables, never from a repair helper.
// Current native rendering/freshness proofs are a separate release obligation.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const [key,...tail]=value.replace(/^--/,'').split('=');return [key,tail.join('=')||true];}));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const scenarioIdentity=test=>sha(JSON.stringify(canonical({source:test.source,expected:test.expected,options:test.options,kind:test.jobKind||'adjust'})));
const version=String(args.version||'2.20.0'),slug='v'+version.replaceAll('.','_');
const files=[args.core||process.env.REVISAWIKI_SCRIPT||path.join(root,'dist',version,'RevisaWiki_'+slug+'.js'),args.complete||path.join(root,'dist',version,'RevisaWiki_'+slug+'_completo.js')].map(file=>path.resolve(root,file));
const shard=Number(args.shard||0),shards=Number(args.shards||1),limit=args.limit?Number(args.limit):Infinity;
if(!Number.isInteger(shard)||!Number.isInteger(shards)||shards<1||shard<0||shard>=shards||!(limit>0))throw new Error('Invalid deterministic shard/limit');
if(args.enumerate&&!args.development)throw new Error('Descriptor enumeration is not an executed final campaign');
if(version!=='2.20.0'&&!args.development)throw new Error('A nonfinal development runtime must be explicitly labeled');
const output=path.resolve(args.output||path.join(root,'artifacts/v220/catalog_campaign'));
fs.mkdirSync(output,{recursive:true});
const rowFile=path.join(output,'rows-'+shard+'.jsonl'),failureFile=path.join(output,'PRIVATE_FAILURES-'+shard+'.jsonl'),summaryFile=path.join(output,'SUMMARY-'+shard+'.json');
const bundles=files.map(file=>({file,filename:path.basename(file),bytes:fs.statSync(file).size,sha256:sha(fs.readFileSync(file)),api:require(file)}));
for(const bundle of bundles)if(bundle.api.version!==version)throw new Error('The actual bundle version differs from the requested campaign version');
const manifestFile=args.manifest?path.resolve(root,args.manifest):null;
if(!args.development&&!manifestFile)throw new Error('A final campaign requires --manifest bound to the frozen release bytes');
let manifestSha256=null;
if(manifestFile){
 const manifestBytes=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestBytes);manifestSha256=sha(manifestBytes);
 if(manifest.version!==version)throw new Error('The frozen manifest has another version');
 const entries=manifest.items||Object.entries(manifest.files||{}).map(([filename,pin])=>({filename,...pin}));if(!entries.length)throw new Error('The frozen manifest has no pinned files');
 for(const item of entries){const file=path.join(path.dirname(manifestFile),item.filename),bytes=fs.readFileSync(file);if(sha(bytes)!==item.sha256||bytes.length!==item.bytes)throw new Error('Frozen manifest item differs: '+item.filename);}
 for(const bundle of bundles){const pin=entries.find(item=>item.filename===bundle.filename);if(!pin||pin.sha256!==bundle.sha256)throw new Error('An actual runtime bundle is not pinned by the release manifest');}
}
const data=bundles[0].api;
const nativeMagicFile=args['native-magic']?path.resolve(String(args['native-magic'])):null;
if(!args.development&&!nativeMagicFile)throw new Error('The final finite campaign requires independent --native-magic siteinfo evidence');
const nativeMagicBytes=nativeMagicFile?fs.readFileSync(nativeMagicFile):null,nativeMagicSha256=nativeMagicBytes?sha(nativeMagicBytes):null;
const nativeMagicGroups=nativeMagicBytes?JSON.parse(nativeMagicBytes).query.magicwords:[];
if(nativeMagicBytes&&nativeMagicSha256!=='538de6faabec88cc996ca57e29551b2b91ff9c4b7f4952114dcaf768ca444efe')throw new Error('Native magicword capture differs from the independently pinned primary source');
function nativeMagicAccepted(alias,kind){
 const candidate=alias.replace(/[:：]$/,'');
 return nativeMagicGroups.some(group=>group.aliases.some(native=>{
  if(kind!=='redirect'&&candidate.startsWith('#'))native='#'+native.replace(/^#/,'');
  native=native.replace(/:$/,'');
  return group['case-sensitive']?candidate===native:candidate.toLocaleLowerCase('pt')===native.toLocaleLowerCase('pt');
 }));
}
function nativeImageAccepted(value){
 return nativeMagicGroups.filter(group=>/^img_/.test(group.name)).some(group=>group.aliases.some(alias=>{
  if(!alias.includes('$1'))return value===alias;
  const [prefix,suffix]=alias.split('$1');if(!value.startsWith(prefix)||!value.endsWith(suffix)||value.length<prefix.length+suffix.length)return false;
  const captured=value.slice(prefix.length,suffix?value.length-suffix.length:undefined);
  return group.name!=='img_width'||/^(?:\d+(?:x\d+)?|x\d+)$/.test(captured);
 }));
}
const translationContractsFile=path.join(root,'tests/v219','translation_contracts.json'),translationContractsBytes=fs.readFileSync(translationContractsFile),translationContracts=JSON.parse(translationContractsBytes);
const spanishOfficialFile=path.join(root,'tests/v219','spanish_official_contract.json'),spanishOfficialBytes=fs.readFileSync(spanishOfficialFile);
const aliasContractFile=path.join(root,'tests/v219','citation_alias_contract.json'),aliasContractBytes=fs.readFileSync(aliasContractFile),aliasContract=JSON.parse(aliasContractBytes);
const localRedirectFile=path.join(root,'tests/v219','local_citation_redirects.json'),localRedirectBytes=fs.readFileSync(localRedirectFile),localRedirectContracts=JSON.parse(localRedirectBytes).redirects;
const nativeReflistContractFile=path.join(root,'tests/v219','native_reflist_contract.json'),nativeReflistContractBytes=fs.readFileSync(nativeReflistContractFile);
const foreignStateContractFile=path.join(root,'tests/v219','foreign_url_state_contract.json'),foreignStateContractBytes=fs.readFileSync(foreignStateContractFile),foreignStateContract=JSON.parse(foreignStateContractBytes),unprovedForeignStateKeys=new Set(foreignStateContract.declaredSourceKeys);
const dateWrapperContractFile=path.join(root,'tests/v219','date_wrapper_contracts.json'),dateWrapperContractBytes=fs.readFileSync(dateWrapperContractFile);
const nativeShortCitationContractFile=path.join(root,'tests/v219','native_short_citation_positions_contract.json'),nativeShortCitationContractBytes=fs.readFileSync(nativeShortCitationContractFile);
const foreignShortContractFile=path.join(root,'tests/v219','foreign_short_citation_contract.json'),foreignShortContractBytes=fs.readFileSync(foreignShortContractFile),foreignShortContract=JSON.parse(foreignShortContractBytes);
const foreignShortRefusals=new Set(foreignShortContract.actualCatalogProfiles.filter(row=>row.disposition==='quiet-whole-call-preservation').map(row=>row.literal));
if(foreignShortRefusals.size!==3||!['modèle:sfn','vorlage:sfn','plantilla:sfn'].every(name=>foreignShortRefusals.has(name)))throw new Error('Review the precise foreign generated-reference contract before changing its scope');
const nativeShortCitationName=name=>/^[Ss]fn$/.test(name.replace(/^(?:template|predefinição)\s*:\s*/i,''));
const magicSwitchContractFile=path.join(root,'tests/v219','magic_switch_contract.json'),magicSwitchContractBytes=fs.readFileSync(magicSwitchContractFile),magicSwitchContract=JSON.parse(magicSwitchContractBytes),nativeParserContractFile=path.join(root,'tests/v219','native_parser_call_contract.json'),nativeParserContractBytes=fs.readFileSync(nativeParserContractFile);
if(foreignStateContract.disposition!=='quiet-whole-call-refusal')throw new Error('Foreign state primary contract changed');
const ownData={infoboxes:data.infoboxCatalog,templates:data.templateCatalog,translations:data.translationRules,spelling:data.spellingRules,citationParameters:data.citationParameters,obsolete:data.obsoleteCatalog};
const dataSha256=sha(JSON.stringify(ownData)),runnerSha256=sha(fs.readFileSync(__filename));
for(const bundle of bundles.slice(1))if(sha(JSON.stringify({infoboxes:bundle.api.infoboxCatalog,templates:bundle.api.templateCatalog,translations:bundle.api.translationRules,spelling:bundle.api.spellingRules,citationParameters:bundle.api.citationParameters,obsolete:bundle.api.obsoleteCatalog}))!==dataSha256)throw new Error('Modular and complete catalog tables differ');
const falseOptions=Object.fromEntries(Object.keys(data.defaults).map(key=>[key,false]));
const common={...falseOptions,namespaceNumber:0,pageTitle:'Assunto fictício',contentModel:'wikitext',minorBaseConfirmed:true,now:Date.UTC(2026,9,17,12),review:false,autoPreview:false,registryDoiCheck:false};
const textValue='Valor literal';
const nativeConfig=kind=>({...common,infoboxes:kind==='infobox',citations:kind==='citation',auxiliaryTemplates:kind==='auxiliary'||kind==='citation',automaticParameterNames:true,automaticParameterDuplicates:true,automaticEmptyParameters:true});
const nativeKind=(name,kind)=>kind==='infobox'?'infobox':/^citar\b|^citation$/.test(name)?'citation':'auxiliary';
const foreignConfig=profile=>({...common,multilingual:true,citations:profile.kind==='citation',infoboxes:profile.kind==='infobox',auxiliaryTemplates:!['citation','infobox','date','renderer','notesRenderer','note'].includes(profile.kind),references:['renderer','notesRenderer','note'].includes(profile.kind),dates:profile.kind==='date',birthDates:profile.kind==='date',singleLineCitations:false,moveNamedRefs:false,automaticIdenticalReferences:false});
const norm=value=>String(value).normalize('NFC').replace(/_/g,' ').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt');
const call=(name,fields=[])=>'{{'+name+fields.map(([key,value])=>'|'+key+'='+value).join('')+'}}';
const nativeAccepts=(profile,key)=>!!profile&&(profile.accepted.includes(key)||profile.accepted.some(value=>value.includes('#')&&new RegExp('^'+value.split('#').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[1-9]\\d*')+'$').test(key))||(profile.patterns||[]).some(pattern=>new RegExp(pattern).test(key)));
const localAccepts={Oficial:['1','nome'],Lang:['1','2'],Nre:['1','nome','grupo','conteúdo','name','group','reference','content','text','referência','texto'],Referências:['grupo','refs','título','estilo','nível','estilolista','extra'],Notas:['grupo','refs'],'Lista simples':['1','classe','estilo','indent','indentação']};
function targetAccepts(profile,target,key){
 if(profile.kind==='citation')return (profile.strictNativeCitation||norm(profile.target)==='citation'&&norm(target)==='citar jornal')?nativeAccepts(data.templateCatalog[norm(target)],key):data.citationParameters.includes(key)||data.citationParameters.includes(key.replace(/\d+$/,'#'))||nativeAccepts(data.templateCatalog[norm(target)],key);
 if(localAccepts[target])return localAccepts[target].includes(key);
 if(profile.kind==='authority')return key==='';
 return nativeAccepts(data.infoboxCatalog[norm(target)]||data.templateCatalog[norm(target)],key);
}
function valueFor(target,profile,key){
 if(target==='acessourl')return profile.source.language==='fr'?{input:'limité',expected:'limitado'}:{input:'limitado',expected:'limitado'};
 if(/(?:^|[-_ ])(?:url|website|site)$/.test(target)||/url$/.test(target)||target==='1'&&profile.kind==='official')return {input:'https://example.invalid/catalogo',expected:'https://example.invalid/catalogo'};
 if(['data','ano','acessodata','arquivodata','nascimento_data','morte_data','lançamento'].includes(target))return {input:target==='ano'?'2001':'2001-02-03',expected:target==='ano'?'2001':'2001-02-03'};
 if(target==='língua')return {input:'pt',expected:'pt'};
 if(['urlmorta','subscricao','registro'].includes(target))return {input:'yes',expected:'sim'};
 if(key==='et al.')return {input:'oui',expected:'et al'};
 if(target==='duração')return {input:'42',expected:'42'};
 if(['pmid','pmc','oclc','jstor','volume','página','páginas','número','edição','total-páginas'].includes(target))return {input:'42',expected:'42'};
 if(target==='doi')return {input:'10.1234/catalogo',expected:'10.1234/catalogo'};
 if(target==='isbn')return {input:'9780306406157',expected:'9780306406157'};
 if(target==='grupo'||target==='group')return {input:'lower-alpha',expected:'lower-alpha'};
 if(target==='refs')return {input:'<ref name="fonte">Fonte literal</ref>',expected:'<ref name="fonte">Fonte literal</ref>'};
 if(target==='ref')return {input:'catalogo',expected:'catalogo'};
 return {input:textValue,expected:textValue};
}
function canonicalTarget(name,profile){
 // The current independent source review proves these two foreign news
 // formatter identities. They do not inherit the generic Citation class.
 if([['da',11752300],['ar',70513200]].some(([language,oldid])=>profile.source.language===language&&profile.source.oldid===oldid))return 'Citar jornal';
 const found=data.citationNewsProfiles.find(row=>row.language===profile.source.language&&row.title===profile.source.title&&(row.oldid??null)===(profile.source.oldid??null));
 return found&&norm(profile.target)==='citation'?'Citar jornal':profile.target;
}
function foreignLiteralName(key,profile){
 const native=data.infoboxCatalog[key]||data.templateCatalog[key];
 if(native)return native.title;
 const colon=key.indexOf(':'),stem=colon<0?key:key.slice(colon+1),declared=profile.source.title.replace(/^[^:]+:/,'');
 const literal=norm(stem)===norm(declared)?declared:stem[0].toLocaleUpperCase('pt')+stem.slice(1);
 return colon<0?literal:key.slice(0,colon+1)+literal;
}
function nativeOutputField(target,key,value){
 // Independent documented role handling. This is an endpoint oracle, not a
 // call to the citation/translation helper under examination.
 if(/^citar\b|^citation$/.test(norm(target))){
  if(key==='language'||key==='lang')key='língua';
  if(key==='acessourl')value={limited:'limitado',registration:'registo',subscription:'subscrição'}[value]||value;
 }
 return [key,value];
}
const protectedWrappers=[
 ['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!-- '+s+' -->'],['code',s=>'<code>'+s+'</code>'],['pre',s=>'<pre>'+s+'</pre>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],['blockquote',s=>'<blockquote>'+s+'</blockquote>'],['unknown-template',s=>'{{Modelo fictício|demonstração='+s+'}}']
];
const protectedTemplateWrappers=protectedWrappers;
let ordinal=0;
function make(category,identity,scenario,source,expected,options,meta={}){
 // Keep the existing inputs, identities and scenario denominator. Only these
 // three source-bound unproved generated-reference migrations now preserve.
 if(category.startsWith('foreign-')&&Array.isArray(identity)&&foreignShortRefusals.has(norm(identity[0]))){
  const priorExpected=expected;expected=source;
  meta={...meta,...(Object.hasOwn(meta,'helperExpected')?{helperExpected:source}:{}),branch:{...(meta.branch||{}),foreignGeneratedRefusalContractSha256:sha(foreignShortContractBytes),...(priorExpected!==source?{previousExpectedSha256:sha(priorExpected),expectedAmendment:'quiet-complete-foreign-generated-reference-preservation'}:{})}};
 }
 return {ordinal:ordinal++,id:sha(JSON.stringify([category,identity,scenario])).slice(0,32),category,identity,scenario,source,expected,options,...meta};
}
function* nativeCases(){
 for(const [catalogKind,catalog]of [['infobox',data.infoboxCatalog],['template',data.templateCatalog]])for(const [name,profile]of Object.entries(catalog)){
  const kind=nativeKind(name,catalogKind),cfg=nativeConfig(kind),keys=profile.accepted,quoted=['quote','quotation','cquote','blockquote','citação','citar','citação em bloco','epígrafe'].includes(name);
  for(const key of keys){
   const source=call(profile.title,[[key,textValue]]);
   yield make(key.includes('#')?'native-placeholder-metadata':'native-accepted',[catalogKind,name,key],key.includes('#')?'literal-placeholder-is-not-invented-or-erased':'populated-valid-key-is-preserved',source,source,cfg,{helper:'automaticParameters',helperExpected:source,branch:{catalogKind,profile:name,key,nativeOldid:profile.oldid}});
   if(key.includes('#'))for(const index of [1,2,9,10,99,100]){const concrete=key.replaceAll('#',String(index)),raw=call(profile.title,[[concrete,textValue]]);yield make('native-numbered',[catalogKind,name,key,index],'concrete-parameter-family-boundary',raw,raw,cfg,{helper:'automaticParameters',helperExpected:raw,branch:{catalogKind,profile:name,key:concrete,nativeOldid:profile.oldid}});}
   if(args.smoke)break;
  }
  const sample=keys.find(key=>!/^[0-9]+$/.test(key)&&!/[#{}<>]/.test(key));
  if(sample){
   const source=call(profile.title,[[sample,textValue],[sample,textValue]]),expected=call(profile.title,[[sample,textValue]]);
   yield make(quoted?'native-quotation-guard':'native-duplicates',[catalogKind,name,sample],'identical-key-values',source,quoted?source:expected,cfg,{helper:'automaticParameters',helperExpected:expected});
   yield make('native-duplicates',[catalogKind,name,sample],'conflicting-key-values',call(profile.title,[[sample,'Primeiro valor'],[sample,'Segundo valor']]),call(profile.title,[[sample,'Primeiro valor'],[sample,'Segundo valor']]),cfg,{helper:'automaticParameters'});
   yield make('native-options',[catalogKind,name,sample],'duplicate-option-disabled',source,source,{...cfg,automaticParameterDuplicates:false},{helper:'automaticParameters',helperExpected:source});
  }
  const unknown='campo_catalogo_sem_destino_7349',unknownFull=call(profile.title,[[unknown,textValue]]),unknownEmpty=call(profile.title,[[unknown,'']]);
  yield make('native-unknown',[catalogKind,name],'unknown-populated-field',unknownFull,unknownFull,cfg,{helper:'automaticParameters'});
  yield make(quoted?'native-quotation-guard':'native-unknown',[catalogKind,name],'unknown-empty-field',unknownEmpty,quoted||profile.partial?unknownEmpty:call(profile.title),cfg,{helper:'automaticParameters',helperExpected:profile.partial?unknownEmpty:call(profile.title)});
  yield make('native-options',[catalogKind,name],'empty-option-disabled',unknownEmpty,unknownEmpty,{...cfg,automaticEmptyParameters:false},{helper:'automaticParameters'});
  for(const [from,to]of Object.entries(profile.renames||{})){
   const source=call(profile.title,[[from,textValue]]),allowed=!nativeAccepts(profile,from)&&nativeAccepts(profile,to),expected=allowed?call(profile.title,[[to,textValue]]):source;
   yield make('native-renames',[catalogKind,name,from,to],'single-literal-rename',source,expected,cfg,{helperObservationOnly:true});
   const conflict=call(profile.title,[[from,'Primeiro valor'],[to,'Segundo valor']]);
   yield make('native-renames',[catalogKind,name,from,to],'conflicting-target',conflict,conflict,cfg);
   const disabled={...cfg,[kind==='infobox'?'infoboxes':kind==='citation'?'citations':'auxiliaryTemplates']:false,...(kind==='citation'?{auxiliaryTemplates:false}:{})};
   yield make('native-options',[catalogKind,name,from,to],'native-family-disabled',source,source,disabled);
  }
  for(const [alias,target]of Object.entries(profile.aliases||{})){
   const provenChapterUrl=['citar tese','citar dissertação'].includes(name)&&profile.oldid===47976404&&alias==='capitulourl'&&target==='capítulourl',value=provenChapterUrl?'https://example.invalid/capitulo':textValue,source=call(profile.title,[[alias,value]]);
   const uniqueExpected=provenChapterUrl?call(profile.title,[[target,value]]):source;
   yield make('native-aliases',[catalogKind,name,alias,target],provenChapterUrl?'independently-proved-invalid-url-key':'declared-alias-preservation',source,uniqueExpected,cfg,{branch:{catalogKind,profile:name,key:alias,target,nativeAcceptedByDeclaredKeys:nativeAccepts(profile,alias),nativeOldid:profile.oldid,partial:!!profile.partial}});
   const conflict=call(profile.title,[[alias,'Primeiro valor'],[target,'Segundo valor']]);
   yield make('native-aliases',[catalogKind,name,alias,target],'different-alias-values',conflict,conflict,cfg);
  }
  for(const pattern of profile.patterns||[]){
   const seeds=['cabeçalho','rótulo','dados','imagem','p','s','ano_governante','ano_líder','ano_vice','bandeira_p','bandeira_s','borda_p','borda_s','dados_ano','dados_pop','dados_área','governante','imagem_p','imagem_s','líder','ref_pop','ref_área','vice','lista','grupo','classe-lista','estilo-lista','estilo-grupo','group','list'];
   const regex=new RegExp(pattern),matches=new Set();for(const stem of seeds)for(const n of [0,1,9,10,99,100,1000])for(const ending of ['','-classe','-estilo','-legenda','style','class']){const key=stem+n+ending;if(regex.test(key))matches.add(key);}
   if(!matches.size)throw new Error('A native parameter pattern has no independently enumerated boundary witness');
   for(const key of matches){const source=call(profile.title,[[key,textValue]]);yield make('native-patterns',[catalogKind,name,pattern,key],'accepted-numeric-boundary',source,source,cfg,{helper:'automaticParameters'});}
  }
 }
}
function foreignMappedExpected(name,profile,key,target,value){
 if(['efn','refn'].includes(norm(name).replace(/^(?:template|predefinição)\s*:\s*/,'')))return null;
 if(profile.kind==='infobox'&&profile.source.language==='fr'&&/biographie/i.test(profile.source.title))return null;
 if(!targetAccepts(profile,target,key))return null;
 return nativeOutputField(target,key,value);
}
function* foreignCases(){
 for(const [catalogName,profile]of Object.entries(data.translationRules.profiles)){
  const name=foreignLiteralName(catalogName,profile);
  const cfg=foreignConfig(profile),target=canonicalTarget(name,profile),fieldRows=Object.entries(profile.fields||{});
  const local=localRedirectContracts.find(row=>norm(row.title)===norm(name.replace(/^(?:template|predefinição)\s*:\s*/i,''))&&!name.includes(':')||norm(row.title)===norm(name.replace(/^(?:template|predefinição)\s*:\s*/i,''))&&/^(?:template|predefinição)\s*:/i.test(name));
  if(local){
   for(const [key,mapped]of fieldRows){const value=valueFor(mapped,profile,key),source=call(name,[[key,value.input]]),expected=call(local.target,[[key,value.input]]);
    yield make('foreign-local-redirect',[name,key],'pinned-local-interface',source,expected,cfg,{helper:'migrateForeignTemplate',helperExpected:expected,branch:{nativeRedirectOldid:local.oldid,target:local.target,retainsOriginalInterface:true}});
    yield make('foreign-options',[name,key],'pinned-local-multilingual-disabled',source,source,{...cfg,multilingual:false},{helper:'migrateForeignTemplate',helperExpected:source});
    for(const [wrapper,wrap]of protectedTemplateWrappers.slice(0,args.smoke?1:protectedTemplateWrappers.length))yield make(wrapper==='unknown-template'?'foreign-owner-protected':'foreign-protected',[name,key],'local-interface-'+wrapper,wrap(source),wrap(source),cfg);
    if(args.smoke)break;
   }
   for(const fields of [[['1','Entrada posicional']],[['campo_inexistente_7349','Valor preservado']],[['title','']],[['title','Primeiro valor'],['título','Segundo valor']]]){const source=call(name,fields),expected=call(local.target,fields);yield make('foreign-local-redirect',[name,fields],'pinned-original-positional-unknown-or-blank',source,expected,cfg,{helper:'migrateForeignTemplate',helperExpected:expected});}
   continue;
  }
  if(/^[Rr]eflist$/.test(name.replace(/^(?:template|predefinição)\s*:\s*/i,''))){
   const nativeTargets={group:'grupo',grupo:'grupo',refs:'refs',liststyle:'estilolista',estilolista:'estilolista',listaestilo:'estilolista'};
   for(const [key,mapped]of fieldRows){const value=valueFor(mapped,profile,key).input,source=call(name,[[key,value]]),expected=Object.hasOwn(nativeTargets,key)?call('Referências',[[nativeTargets[key],value],['nível','0']]):source;
    yield make('foreign-native-reflist',[name,key],'native-headingless-interface',source,expected,cfg,{helper:'migrateForeignTemplate',helperExpected:expected,branch:{nativeSourceOldid:56151616,nativeTargetOldid:63785697,headingLevel:0}});
    yield make('foreign-options',[name,key],'native-independent-of-multilingual',source,expected,{...cfg,multilingual:false},{helper:'migrateForeignTemplate',helperExpected:expected});
    yield make('foreign-options',[name,key],'native-references-disabled',source,source,{...cfg,references:false},{helper:'migrateForeignTemplate',helperExpected:source});
    for(const [wrapper,wrap]of protectedTemplateWrappers.slice(0,args.smoke?1:protectedTemplateWrappers.length))yield make(wrapper==='unknown-template'?'foreign-owner-protected':'foreign-protected',[name,key],'native-reflist-'+wrapper,wrap(source),wrap(source),cfg);
   }
   const bare=call(name),headless=call('Referências',[['nível','0']]);
   for(const multilingual of [true,false])yield make('foreign-native-reflist',[name,multilingual],'bare-native-headless',bare,headless,{...cfg,multilingual},{helper:'migrateForeignTemplate',helperExpected:headless});
   for(const fields of [[['1','2']],[['colwidth','30em']],[['group',''],['grupo','lower-alpha']],[['group','lower-alpha'],['group','lower-alpha']],[['campo_inexistente_7349','']]]){const source=call(name,fields);yield make('foreign-native-reflist',[name,fields],'native-interface-refusal',source,source,cfg,{helper:'migrateForeignTemplate',helperExpected:source});}
   continue;
  }
  if(profile.kind==='official'&&profile.source.language==='es'){
   // Exact implementation 161327230 emits its own bullet and accepts distinct
   // URL/label roles. Generic field migration has no equivalence witness.
   const values=[...fieldRows.map(([key,mapped])=>[key,valueFor(mapped,profile,key).input]),['URL','https://example.invalid/oficial'],['noa','1'],['idioma','en'],['formato','java'],['móvil','https://example.invalid/movel']];
   for(const [key,value]of values){const source=call(name,[[key,value]]);
    yield make('foreign-quarantine',[name,key],'unproved-official-role',source,source,cfg,{helper:'migrateForeignTemplate',helperExpected:source,branch:{kind:profile.kind,language:'es',sourceOldid:161327230,key}});
    yield make('foreign-options',[name,key],'unproved-official-disabled',source,source,{...cfg,multilingual:false},{helper:'migrateForeignTemplate',helperExpected:source});
    for(const [wrapper,wrap]of protectedTemplateWrappers.slice(0,args.smoke?1:protectedTemplateWrappers.length))yield make(wrapper==='unknown-template'?'foreign-owner-protected':'foreign-protected',[name,key],'unproved-official-'+wrapper,wrap(source),wrap(source),cfg);
   }
   for(const payload of [[],['https://example.invalid/oficial'],['https://example.invalid/oficial','Rótulo literal'],['https://example.invalid/oficial','Rótulo literal','pt']]){const source='{{'+name+(payload.length?'|'+payload.join('|'):'')+'}}';yield make('foreign-quarantine',[name,payload.length],'unproved-official-positional',source,source,cfg,{helper:'migrateForeignTemplate',helperExpected:source});}
   continue;
  }
  if(!fieldRows.length&&!['date','list','note','notesRenderer','official'].includes(profile.kind)){
   const source=call(name),expected=['efn','refn'].includes(norm(name))||nativeShortCitationName(name)?source:call(target);
   yield make('foreign-kind',[name,profile.kind],'empty-known-call',source,expected,cfg,{helper:'migrateForeignTemplate',helperExpected:expected});
  }
  for(const [key,mapped]of fieldRows){
   const value=valueFor(mapped,profile,key),field=foreignMappedExpected(name,profile,mapped==='grupo'&&norm(target)==='nre'?'group':mapped,target,value.expected),source=call(name,[[key,value.input]]);
   let expected=field?call(target,[field]):source;
   if(profile.subtitles?.[norm(key)])expected=source;
   if(profile.kind==='notesRenderer'&&field){if(mapped==='grupo'){const group=value.expected,localTarget=['nota','lower-alpha'].includes(group)?target:'Referências';expected=call(localTarget,[field,...(localTarget==='Referências'?[['título','Notas']]:[])]);}else{const group=profile.defaultGroup||'lower-alpha',localTarget=['nota','lower-alpha'].includes(group)?target:'Referências';expected=call(localTarget,[field,['grupo',group],...(localTarget==='Referências'?[['título','Notas']]:[])]);}}
   if(profile.kind==='official')expected=mapped==='1'?call(target,[['1',value.expected]]):source;
   // Wrapper-bound source review found inconsistent enums and ignored source
   // spellings. A declared mapper entry is not semantic proof for URL state.
   if(profile.kind==='citation'&&mapped==='urlmorta'&&unprovedForeignStateKeys.has(key))expected=source;
   const baseline={helper:'migrateForeignTemplate',helperExpected:expected,branch:{kind:profile.kind,language:profile.source.language,field:key,targetField:mapped,sourceOldid:profile.source.oldid||null}};
   yield make('foreign-fields',[name,key,mapped],'literal-field-map',source,expected,cfg,baseline);
   const nativeHeadless=norm(name.replace(/^(?:template|predefinição)\s*:\s*/i,''))==='reflist'&&mapped==='grupo';
   yield make('foreign-options',[name,key,mapped],'multilingual-disabled',source,nativeHeadless?call('Referências',[['grupo',value.expected],['nível','0']]):source,{...cfg,multilingual:false},{helper:'migrateForeignTemplate',helperExpected:source,branch:nativeHeadless?{nativeOldid:56151616,independentNativeGate:'references',foreignGate:false}:null});
   for(const [wrapper,wrap]of protectedTemplateWrappers.slice(0,args.smoke?1:protectedTemplateWrappers.length))yield make(wrapper==='unknown-template'?'foreign-owner-protected':'foreign-protected',[name,key,mapped],wrapper,wrap(source),wrap(source),cfg);
   const conflict=call(name,[[key,'Primeiro valor'],[mapped,'Segundo valor']]);
   // Identical source/target keys are ordinary duplicate parameters. Only
   // distinct mappings exercise a collision at the target role.
   if(key!==mapped&&targetAccepts(profile,target,mapped))yield make('foreign-conflicts',[name,key,mapped],'different-mapped-target-values',conflict,conflict,cfg,{helper:'migrateForeignTemplate'});
   if(args.smoke)break;
  }
  for(const [base,mapped]of Object.entries(profile.numbered||{}))for(const n of [1,2,9,10,99,100]){
   const declared=profile.fields?.[base+n]||mapped+n;
   // The newly authorized typed-news adapter deliberately proves only1..99.
   // That finite tool boundary is not a claim that native CS1 stops at99.
   const strictNews=norm(profile.target)==='citation'&&target==='Citar jornal',
    source=call(name,[[base+n,textValue]]),field=foreignMappedExpected(name,profile,declared,target,textValue),expected=strictNews&&n===100?source:field?call(target,[field]):source;
   yield make('foreign-numbered',[name,base,mapped,n],'explicit-numbered-field',source,expected,cfg,{helper:'migrateForeignTemplate',helperExpected:expected});
   const conflict=call(name,[[base+n,'Primeiro valor'],[declared,'Segundo valor']]);yield make('foreign-numbered',[name,base,mapped,n],'numbered-target-conflict',conflict,conflict,cfg,{helper:'migrateForeignTemplate'});
   if(strictNews&&n===1)for(const index of ['0','01','1000']){
    const raw=call(name,[[base+index,textValue]]);yield make('foreign-numbered',[name,base,mapped,index],'outside-finite-typed-adapter-boundary',raw,raw,cfg,{helper:'migrateForeignTemplate',helperExpected:raw,branch:{nativeMayAcceptBroaderSpelling:true,toolMigrationIndices:'1..99',zeroOrPaddedIndex:index}});
   }
  }
  if(profile.dateParts){
   const [day,month,year]=profile.dateParts,good=call(name,[[day,'3'],[month,'2'],[year,'2001']]),fr=profile.source.language==='fr'&&profile.kind==='infobox'&&/biographie/i.test(profile.source.title),expected=fr?good:call(target,[['data','3 de fevereiro de 2001']]);
   yield make('foreign-date-parts',[name,profile.dateParts],'complete-calendar-date',good,expected,cfg,{helper:'migrateForeignTemplate',helperExpected:expected});
   for(const [scenario,fields]of [['missing-year',[[day,'3'],[month,'2']]],['invalid-day',[[day,'31'],[month,'2'],[year,'2001']]],['unknown-month',[[day,'3'],[month,'mês indefinido'],[year,'2001']]],['conflicting-whole-date',[[day,'3'],[month,'2'],[year,'2001'],['date','2002-04-05']]]]){const source=call(name,fields);yield make('foreign-date-parts',[name,profile.dateParts],scenario,source,source,cfg,{helper:'migrateForeignTemplate'});}
  }
  for(const [subtitle,title]of Object.entries(profile.subtitles||{})){
   const titleKey=fieldRows.find(([,to])=>to===title)?.[0];if(!titleKey)throw new Error('Subtitle contract lacks an independently declared title field');
   const source=call(name,[[titleKey,'Título literal'],[subtitle,'Subtítulo literal']]),expected=call(target,[[title,'Título literal: Subtítulo literal']]);
   yield make('foreign-subtitles',[name,subtitle,titleKey],'title-plus-subtitle',source,expected,cfg,{helper:'migrateForeignTemplate',helperExpected:expected});
   const missing=call(name,[[subtitle,'Subtítulo literal']]);yield make('foreign-subtitles',[name,subtitle,titleKey],'subtitle-without-title',missing,missing,cfg,{helper:'migrateForeignTemplate'});
  }
  if(profile.kind==='date'){
   for(const [scenario,fields,expected]of [['complete-date',[['1','3'],['2','2'],['3','2001']],call(profile.birth?'Dni':'DataExt',[['1','3'],['2','2'],['3','2001'],...(profile.birth?[['4','si']]:[])])],['invalid-leap-day',[['1','29'],['2','2'],['3','2001']],null],['missing-day',[['2','2'],['3','2001']],null],['unknown-calendar',[['1','3'],['2','2'],['3','2001'],['calendar','outro']],null]]){
    const source=call(name,fields),native=profile.birth||norm(name)==='date'?source:expected?.replace('|1=3|2=2|3=2001','|3|2|2001').replace('|4=si','|si')||source;yield make('foreign-date',[name,profile.birth],scenario,source,native,cfg,{helper:'migrateForeignTemplate',helperExpected:native});
   }
  }
  if(profile.maxPos!==undefined&&profile.kind!=='date')for(const count of [...new Set([0,1,profile.maxPos,profile.maxPos+1,...(profile.kind==='official'?[2,3]:[])])].filter(n=>n>=0&&n<=101)){
   const payload=Array.from({length:count},(_,i)=>profile.kind==='official'?(profile.source.language==='fr'&&count>=2&&i===0?'pt':i===1&&profile.source.language==='en'?'Rótulo literal':'https://example.invalid/oficial-'+(i+1)):'Entrada literal '+(i+1)),source='{{'+name+(count?'|'+payload.join('|'):'')+'}}';let expected=source;
   if(!['list','official','note','notesRenderer'].includes(profile.kind)&&count<=profile.maxPos)expected='{{'+target+(count?'|'+payload.join('|'):'')+'}}';
   if(profile.kind==='list'&&count===0)expected='{{'+target+'}}';
   if(profile.kind==='list'&&profile.variadic&&count>0&&count<=profile.maxPos)expected='{{'+target+'|\n'+payload.map(value=>'* '+value).join('\n')+'\n}}';
   if(profile.kind==='official'&&count===1)expected=call(target,[['1',payload[0]]]);
   if(profile.kind==='official'&&count===2)expected=profile.source.language==='fr'?call(target,[['1',payload[1]],['2',payload[0]]]):call(target,[['1',payload[0]],['nome',payload[1]]]);
   if(/^(?:(?:template|predefinição)\s*:\s*)?(?:main|ap)$/i.test(name))expected='{{Artigo principal'+(count?'|'+payload.join('|'):'')+'}}';
   if(profile.kind==='authority'&&count===0)expected='{{Controle de autoridade}}';
   if(nativeShortCitationName(name))expected=source;
   yield make('foreign-positional',[name,profile.kind,count],'max-position-boundary',source,expected,cfg,{helper:'migrateForeignTemplate',helperExpected:expected});
  }
  if(profile.kind==='list'){
   const source='{{'+name+'|* Primeiro item\n* Segundo item\n}}',expected='{{'+target+'|* Primeiro item\n* Segundo item\n}}';
   yield make('foreign-list',[name,!!profile.variadic],'existing-literal-list',source,profile.variadic?source:expected,cfg,{helper:'migrateForeignTemplate'});
   if(profile.variadic){const raw='{{'+name+'|Primeiro item|Segundo item}}',fixed='{{'+target+'|\n* Primeiro item\n* Segundo item\n}}';yield make('foreign-list',[name,true],'explicit-variadic-items',raw,fixed,cfg,{helper:'migrateForeignTemplate',helperExpected:fixed});}
  }
  if(profile.kind==='official'){
   const source='{{'+name+'|https://example.invalid/oficial}}',expected=call(target,[['1','https://example.invalid/oficial']]);yield make('foreign-official',[name],'literal-url',source,expected,cfg,{helper:'migrateForeignTemplate'});
   const labelSource=call(name,profile.source.language==='fr'?[['url','https://example.invalid/oficial'],['titre','Rótulo literal']]:[['1','https://example.invalid/oficial'],['2','Rótulo literal']]),labelExpected=call(target,[['1','https://example.invalid/oficial'],['nome','Rótulo literal']]);
   yield make('foreign-official',[name],'explicit-url-and-label',labelSource,labelExpected,cfg,{helper:'migrateForeignTemplate'});
  }
  if(profile.offline){const source=call(name,[[profile.offline,'yes']]);yield make('foreign-offline',[name,profile.offline],'offline-state-does-not-invent-url',source,source,cfg,{helper:'migrateForeignTemplate'});}
  if(profile.ambiguousWork){const source=call(name,[[profile.ambiguousWork,textValue]]);yield make('foreign-ambiguous-publication',[name,profile.ambiguousWork],'no-guessed-publication-type',source,source,cfg,{helper:'migrateForeignTemplate'});}
  if(profile.columnLayout){
   const source=call(name,[['colonnes','2']]),expected=call(target,[['estilo','column-count:2;']]);
   yield make('foreign-column-layout',[name],'explicit-two-columns',source,expected,cfg,{helper:'migrateForeignTemplate'});
   const invalid=call(name,[['colonnes','muitas']]);yield make('foreign-column-layout',[name],'invalid-column-count',invalid,invalid,cfg,{helper:'migrateForeignTemplate'});
  }
 }
}
function* spellingCases(){
 let automaticSeen=false;
 for(const rule of data.spellingRules){
  if(args.smoke&&rule.automatic&&automaticSeen)continue;
  const plain='O registro continha '+rule.wrong+' no trecho.',fixed='O registro continha '+rule.correct+' no trecho.',cfg={...common,automaticSpelling:true},identity=[rule.wrong,rule.correct||rule.alternatives];
  if(rule.automatic){
   automaticSeen=true;
   yield make('spelling-automatic',identity,'lowercase-prose',plain,fixed,cfg,{helper:'automaticSpelling',helperExpected:fixed});
   for(const [scenario,source,options]of [
    ['disabled',plain,{...cfg,automaticSpelling:false}],['allowed-word',plain,{...cfg,spellingAllowedWords:[rule.wrong]}],['ignored-rule',plain,{...cfg,spellingIgnoredRules:['word:'+rule.wrong]}],['subject-name',plain,{...cfg,pageTitle:rule.wrong}],['talk-namespace',plain,{...cfg,namespaceNumber:1}],['template-namespace',plain,{...cfg,namespaceNumber:10}],['uppercase',plain.replace(rule.wrong,rule.wrong.toLocaleUpperCase('pt')),cfg],['initial-uppercase',plain.replace(rule.wrong,rule.wrong[0].toLocaleUpperCase('pt')+rule.wrong.slice(1)),cfg]
   ])yield make('spelling-guards',identity,scenario,source,source,options);
   for(const [wrapper,wrap]of [...protectedWrappers,['reference',s=>'<ref>'+s+'</ref>'],['template',s=>'{{Exemplo|texto='+s+'}}'],['foreign-language-template',s=>'{{lang|es|'+s+'}}'],['foreign-language-span',s=>'<span lang="es">'+s+'</span>'],['foreign-language-paragraph',s=>'<p lang="es">'+s+'</p>'],['quoted',s=>'"'+s+'"'],['parentheses',s=>'('+s+')'],['italic',s=>"''"+s+"''"],['bold',s=>"'''"+s+"'''"],['link-label',s=>'[[Assunto fictício|'+s+']]'],['table',s=>'{| class="wikitable"\n| '+s+'\n|}'],['url',s=>'https://example.invalid/'+s.replaceAll(' ','_')]])yield make('spelling-protected',identity,wrapper,wrap(plain),wrap(plain),cfg);
  }else{
   yield make('spelling-suggestion-only',identity,'not-automatic',plain,plain,cfg);
   yield make('spelling-suggestion-only',identity,'separate-review',plain,plain,{...cfg,spellingLimit:100},{jobKind:'spelling',suggestionWord:rule.wrong});
  }
 }
}
function* finiteSyntaxCases(){
 const cfg={...common,multilingual:true,links:true,auxiliaryTemplates:true,headings:true};
 for(const [alias,target]of Object.entries(data.translationRules.namespaceAliases)){
  const source='[['+alias+':Arquivo fictício.svg|miniatura|Legenda literal]]',expected='[['+target+':Arquivo fictício.svg|miniatura|Legenda literal]]';
  yield make('foreign-namespace',[alias,target],'literal-prefix',source,expected,cfg);
  for(const [kind,wrap]of protectedWrappers)yield make(kind==='unknown-template'?'foreign-owner-protected':'foreign-namespace-protected',[alias,target],kind,wrap(source),wrap(source),cfg);
 }
 for(const [alias,rule]of Object.entries(data.translationRules.imageOptions)){
  const payload=/^(?:img_width|img_page|img_thumbtime|img_start|img_end)$/.test(rule.kind)?'120':rule.kind==='img_lang'?'pt':'Valor literal';
  const input=alias.replaceAll('$1',payload),translated=rule.target.replaceAll('$1',payload),source='[[Ficheiro:Figura fictícia.svg|'+input+']]',expected=nativeImageAccepted(input)||!alias.includes('$1')&&rule.target.includes('$1')?source:'[[Ficheiro:Figura fictícia.svg|'+translated+']]';
  yield make('foreign-image-option',[alias,rule.target],'exact-option',source,expected,cfg);
  for(const [kind,wrap]of protectedWrappers)yield make(kind==='unknown-template'?'foreign-owner-protected':'foreign-image-protected',[alias,rule.target],kind,wrap(source),wrap(source),cfg);
  // A capture can legitimately begin with an arbitrary letter. Corrupt the
  // whole option role, and prove this new value matches no declared grammar.
  const nearOption='opcao_catalogo_sem_destino_7349 '+input+' fim_catalogo';
  const matchesDeclared=Object.keys(data.translationRules.imageOptions).some(key=>{if(!key.includes('$1'))return key===nearOption;const [before,after]=key.split('$1');return nearOption.startsWith(before)&&nearOption.endsWith(after)&&nearOption.length>=before.length+after.length;});
  if(matchesDeclared)throw new Error('An image negative fixture is actually accepted by another declared alias');
  const near='[[Ficheiro:Figura fictícia.svg|'+nearOption+']]';yield make('foreign-image-near-miss',[alias,rule.target],'nearby-key-is-not-option',near,near,cfg);
 }
 if(!nativeMagicFile&&(!args.category||String(args.category).split(',').some(value=>value.startsWith('foreign-magic'))))throw new Error('Magicword expectations require independent primary siteinfo evidence, including for development pilots');
 for(const [alias,rule]of Object.entries(data.translationRules.magicAliases)){
  const colon=['defaultsort','displaytitle'].includes(rule.kind)||/[:：]$/.test(alias),switchToken=/^(?:__|＿＿)/.test(alias),redirect=rule.kind==='redirect';
  if(alias.startsWith('＿＿')&&!magicSwitchContract.bindings.some(row=>row.alias===alias&&row.kind===rule.kind&&row.target===rule.target))throw new Error('A fullwidth behavior spelling lacks independent primary-source binding');
  const payload={if:'1|Texto verdadeiro|Texto falso',iferror:'1|Texto de erro|Texto válido',ifeq:'A|A|Texto igual|Texto diferente',ifexpr:'2>1|Texto verdadeiro|Texto falso',ifexist:'Assunto fictício|Texto existente|Texto ausente',switch:'A|A=Texto A|#default=Texto padrão',invoke:'Módulo fictício|funcao|argumento=Valor literal',tag:'span|Texto literal|class=classe-literal',expr:'1+2',defaultsort:'Chave literal',displaytitle:'Título literal'}[rule.kind]||'Chave literal';
  const source=switchToken?alias:redirect?alias+' [[Assunto fictício]]':'{{'+(colon?alias.replace(/[:：]$/,'')+(alias.endsWith('：')?'：':':')+payload:alias)+'}}';
  const target=rule.target+(colon?(/[:：]$/.test(rule.target)?'':':')+payload:'');
  const expected=nativeMagicAccepted(alias,rule.kind)?source:switchToken?rule.target:redirect?rule.target+' [[Assunto fictício]]':'{{'+target+'}}';
  yield make('foreign-magic',[alias,rule.target,rule.kind],'exact-magic-token',source,expected,cfg);
  if(switchToken){const unprovedCall='{{'+alias+'}}';yield make('foreign-magic-call-boundaries',[alias,rule.target,rule.kind],'behavior-switch-is-not-brace-template',unprovedCall,unprovedCall,cfg);}
  for(const [kind,wrap]of protectedWrappers)yield make(kind==='unknown-template'?'foreign-owner-protected':'foreign-magic-protected',[alias,rule.target,rule.kind],kind,wrap(source),wrap(source),cfg);
 }
 for(const [alias,target]of Object.entries(data.translationRules.headings)){
  const source='== '+alias+' ==\n* Texto literal\n',expected='== '+target+' ==\n* Texto literal\n';yield make('foreign-heading',[alias,target],'known-heading',source,expected,cfg);
  for(const [kind,wrap]of protectedWrappers)yield make(kind==='unknown-template'?'foreign-owner-protected':'foreign-heading-protected',[alias,target],kind,wrap(source),wrap(source),cfg);
 }
}
function* defaultIntegrationCases(){
 const cfg={...data.defaults,namespaceNumber:0,pageTitle:'Assunto fictício',contentModel:'wikitext',minorBaseConfirmed:true,now:Date.UTC(2026,9,17,12),review:false,autoPreview:false,registryDoiCheck:false};
 const seenNative=new Set();
 for(const test of nativeCases())if(test.category==='native-accepted'){
  // Auxiliary templates can intentionally invoke other default rules or emit
  // a reference. Their exact multi-rule contracts belong to the dedicated
  // template/reference fixtures, not an invented isolated-key no-op oracle.
  if(test.identity[0]==='template'&&nativeKind(test.identity[1],'template')!=='citation')continue;
  const identity=test.identity.slice(0,2).join('|');if(seenNative.has(identity))continue;seenNative.add(identity);
  yield make('default-integration-native',test.identity,'accepted-key-with-all-default-rules',test.source,test.expected,cfg);
 }
 const seenForeign=new Set();
 for(const test of foreignCases())if(test.category==='foreign-fields'&&test.source!==test.expected&&test.source.includes('='+textValue+'}}')&&!/\|(?:data|ano|acessodata|arquivodata|nascimento_data|morte_data|lançamento|duração|url|urlmorta|acessourl|língua)=/.test(test.expected)){
  const identity=test.identity[0];if(seenForeign.has(identity))continue;seenForeign.add(identity);
  yield make('default-integration-foreign',test.identity,'proved-field-with-all-default-rules',test.source,test.expected,cfg);
 }
 for(const test of spellingCases())if(test.category==='spelling-automatic')yield make('default-integration-spelling',test.identity,'literal-prose-with-all-default-rules',test.source,test.expected,cfg);
}
const retainedInputFile=path.join(root,'tests/v219','catalog_retained_inputs.json'),retainedInputBytes=fs.readFileSync(retainedInputFile),retainedInputRows=JSON.parse(retainedInputBytes).rows;
if(retainedInputRows.length!==899)throw new Error('Retained original-input fixture count differs');
function* allCases(){yield* nativeCases();yield* foreignCases();yield* spellingCases();yield* finiteSyntaxCases();yield* defaultIntegrationCases();yield* retainedInputRows;}
const primaryOracle=require('../v219/catalog_primary_oracle.cjs'),oracleAudit={contractSha256:primaryOracle.contractSha256,sourceSha256:primaryOracle.sourceSha256,retainedInputsSha256:sha(retainedInputBytes),reviewed:0,changed:0,byReason:{},oldDistinct:new Set()};
const metadata={schemaVersion:2,kind:'finite-catalog-full-pipeline-campaign',version,development:!!args.development,status:'running',runnerSha256,catalogSha256:dataSha256,manifestSha256,nativeMagicSha256,dateWrapperContractSha256:sha(dateWrapperContractBytes),nativeShortCitationContractSha256:sha(nativeShortCitationContractBytes),foreignShortContractSha256:sha(foreignShortContractBytes),magicSwitchContractSha256:sha(magicSwitchContractBytes),nativeParserContractSha256:sha(nativeParserContractBytes),translationContractsSha256:sha(translationContractsBytes),spanishOfficialSha256:sha(spanishOfficialBytes),nativeReflistContractSha256:sha(nativeReflistContractBytes),foreignStateContractSha256:sha(foreignStateContractBytes),aliasContractSha256:sha(aliasContractBytes),localRedirectSha256:sha(localRedirectBytes),shard,shards,limit:Number.isFinite(limit)?limit:null,smoke:!!args.smoke,enumerationOnly:!!args.enumerate,category:args.category||null,bundles:bundles.map(({file,api,...rest})=>rest),actualBundleFiles:true,helperInjection:false,wikipediaWrites:0,networkRequests:0,accountUse:false,cases:0,checks:0,failures:0,byCategory:{},byEvidence:{expectedRepairCases:0,expectedPreservationCases:0,protectedContextCases:0,optionGuardCases:0,defaultIntegrationCases:0,helperEndpointAssertions:0,calculateExecutions:0},resumeRows:0,claimLimits:['A preserved accepted-key fixture proves source preservation, not native rendered field support.','Custom citation templates outside the legacy citation-name registry require the auxiliary-template gate as well.','Catalog tables enumerate endpoint contracts; current native implementations and dependency freshness are checked by separate primary-source evidence.','Helper endpoint checks are separate from both actual calculate executions.','Case counts, executed assertions, data rows and distinct real articles are different quantities.']};
const prior=new Map(),distinctScenarios=new Set();
if(fs.existsSync(rowFile)){
 if(!args.resume)throw new Error('Existing campaign rows require explicit --resume');
 const old=JSON.parse(fs.readFileSync(summaryFile));
 for(const key of ['runnerSha256','catalogSha256','manifestSha256','nativeMagicSha256','dateWrapperContractSha256','nativeShortCitationContractSha256','foreignShortContractSha256','magicSwitchContractSha256','nativeParserContractSha256','translationContractsSha256','spanishOfficialSha256','nativeReflistContractSha256','foreignStateContractSha256','aliasContractSha256','localRedirectSha256','version','development','shard','shards','smoke','enumerationOnly','category'])if(JSON.stringify(old[key])!==JSON.stringify(metadata[key]))throw new Error('Resume configuration changed: '+key);
 if(JSON.stringify(old.bundles)!==JSON.stringify(metadata.bundles))throw new Error('Resume runtime bytes changed');
 for(const line of fs.readFileSync(rowFile,'utf8').split('\n').filter(Boolean)){const row=JSON.parse(line);if(prior.has(row.id))throw new Error('Duplicate case receipt in existing shard');prior.set(row.id,row);}
}
const started=Date.now(),append=(file,value)=>fs.appendFileSync(file,JSON.stringify(value)+'\n');
function check(state,value,message){state.checks++;if(!value)state.failures.push(message);}
function runCase(test){
 const caseHash=sha(JSON.stringify({id:test.id,category:test.category,scenario:test.scenario,source:test.source,expected:test.expected,options:test.options,jobKind:test.jobKind||'adjust'}));
 const old=prior.get(test.id);if(old){if(old.caseSha256!==caseHash)throw new Error('A resumed case changed');metadata.resumeRows++;return old;}
 const result={id:test.id,ordinal:test.ordinal,category:test.category,scenario:test.scenario,caseSha256:caseHash,scenarioSha256:scenarioIdentity(test),sourceSha256:sha(test.source),expectedEndpointSha256:sha(test.expected),optionsSha256:sha(JSON.stringify(canonical(test.options))),intentSha256:sha(JSON.stringify(canonical(test.identity))),enabledBooleanOptions:Object.keys(test.options).filter(key=>test.options[key]===true).sort(),scopeContext:{namespaceNumber:test.options.namespaceNumber,section:test.options.section??null,sectionOnly:!!test.options.sectionOnly,contentModel:test.options.contentModel||'wikitext',pageRedirect:!!test.options.pageRedirect,pageDisambiguation:!!test.options.pageDisambiguation,pageTitleSha256:sha(test.options.pageTitle||'')},status:'passed',expectedRepair:test.source!==test.expected,protectedContext:/protected|quotation-guard/.test(test.category),optionGuard:/options|guards/.test(test.category),defaultIntegration:test.category.startsWith('default-integration'),branch:test.branch||null,helperEndpointAssertions:0,calculateExecutions:0,checks:0,bundles:[]};let parity=null;
 for(const bundle of bundles){
  const state={bundle:bundle.filename,checks:0,failures:[]},api=bundle.api;
  try{
   if(test.helper){
    let helper;if(test.helper==='migrateForeignTemplate'){const plan=api.migrateForeignTemplate(test.source,test.options);helper=plan?.text??test.source;}else helper=api[test.helper](test.source,test.options,()=>{},()=>{});
    check(state,helper===(test.helperExpected??test.expected),'helper endpoint differs from the independent contract');state.helperEndpointSha256=sha(helper);result.helperEndpointAssertions++;
   }
   const job={kind:test.jobKind||'adjust',source:test.source,originalSource:test.source,options:test.options},first=api.calculate(job),second=api.calculate({...job,source:first.text,originalSource:first.text});
   result.calculateExecutions+=2;
   check(state,first.text===test.expected,'full calculate endpoint differs from the independent contract');
   check(state,second.text===first.text,'full calculate is not idempotent');
   check(state,!(first.preservation||[]).length,'calculate reports a preservation failure');
   const preservationSource=['spelling-automatic','default-integration-spelling'].includes(test.category)?test.expected:test.source;
   check(state,api.preservationAudit(preservationSource,first.text,test.options).length===0,'independent preservation endpoint refuses the result');
   check(state,api.safeComposition(test.source,first.text,test.options)==='','selection/composition guard refuses the result');
   if(test.suggestionWord)check(state,first.suggestions.some(item=>item.word===test.suggestionWord),'ambiguous spelling has no explicit optional suggestion');
   if(first.byteMetrics)check(state,first.byteMetrics.delta===Buffer.byteLength(first.text)-Buffer.byteLength(test.source),'UTF-8 byte delta is incorrect');
   if(parity===null)parity=first.text;else check(state,first.text===parity,'modular and complete endpoints differ');
   state.endpointSha256=sha(first.text);state.changed=first.text!==test.source;state.appliedIds=(first.changes||[]).map(row=>row.id);
   if(state.failures.length)append(failureFile,{id:test.id,category:test.category,scenario:test.scenario,identity:test.identity,bundle:bundle.filename,failures:state.failures,source:test.source,expected:test.expected,actual:first.text,helperExpected:test.helperExpected,options:test.options,preservation:first.preservation||[]});
  }catch(error){state.failures.push('execution exception: '+String(error.message));append(failureFile,{id:test.id,category:test.category,scenario:test.scenario,identity:test.identity,bundle:bundle.filename,error:String(error.stack),source:test.source,expected:test.expected,options:test.options});}
  result.checks+=state.checks;if(state.failures.length)result.status='failed';result.bundles.push(state);
 }
 append(rowFile,result);return result;
}
function save(){metadata.elapsedMs=Date.now()-started;metadata.sourceBytesUnchanged=primaryOracle.inputsUnchanged()&&sha(fs.readFileSync(retainedInputFile))===sha(retainedInputBytes)&&bundles.every(bundle=>sha(fs.readFileSync(bundle.file))===bundle.sha256)&&sha(fs.readFileSync(__filename))===runnerSha256&&(!manifestFile||sha(fs.readFileSync(manifestFile))===manifestSha256)&&(!nativeMagicFile||sha(fs.readFileSync(nativeMagicFile))===nativeMagicSha256)&&sha(fs.readFileSync(translationContractsFile))===metadata.translationContractsSha256&&sha(fs.readFileSync(spanishOfficialFile))===metadata.spanishOfficialSha256&&sha(fs.readFileSync(nativeReflistContractFile))===metadata.nativeReflistContractSha256&&sha(fs.readFileSync(aliasContractFile))===metadata.aliasContractSha256&&sha(fs.readFileSync(localRedirectFile))===metadata.localRedirectSha256&&sha(fs.readFileSync(foreignStateContractFile))===metadata.foreignStateContractSha256&&sha(fs.readFileSync(dateWrapperContractFile))===metadata.dateWrapperContractSha256&&sha(fs.readFileSync(nativeShortCitationContractFile))===metadata.nativeShortCitationContractSha256&&sha(fs.readFileSync(foreignShortContractFile))===metadata.foreignShortContractSha256&&sha(fs.readFileSync(magicSwitchContractFile))===metadata.magicSwitchContractSha256&&sha(fs.readFileSync(nativeParserContractFile))===metadata.nativeParserContractSha256;metadata.distinctScenarioCount=distinctScenarios.size;metadata.duplicateScenarioDescriptors=metadata.cases-distinctScenarios.size;metadata.caseUnit='one generated source/options/expected descriptor, both bundles inside';fs.writeFileSync(summaryFile,JSON.stringify(metadata,null,2)+'\n');}
save();
let selected=0;
for(let test of allCases()){
 if(args.category&&!test.category.split(',').some(category=>String(args.category).split(',').includes(category)))continue;
 if(parseInt(test.id.slice(0,8),16)%shards!==shard)continue;
 if(selected++>=limit)break;
 const originalTest=test,adjustment=primaryOracle.amend(test,{data,canonicalTarget});
 test=adjustment?.test||test;
 if(test.source!==originalTest.source||JSON.stringify(test.options)!==JSON.stringify(originalTest.options)||test.id!==originalTest.id||test.category!==originalTest.category||test.scenario!==originalTest.scenario)throw new Error('The primary oracle changed source/options/case identity');
 oracleAudit.oldDistinct.add(scenarioIdentity(originalTest));
 if(adjustment){oracleAudit.reviewed++;oracleAudit.byReason[adjustment.review.reason]=(oracleAudit.byReason[adjustment.review.reason]||0)+1;if(adjustment.review.changed){oracleAudit.changed++;append(path.join(output,'EXPECTED_AMENDMENTS-'+shard+'.jsonl'),{...adjustment.review,oldScenarioSha256:scenarioIdentity(originalTest),newScenarioSha256:scenarioIdentity(test)});}}

 const row=args.enumerate?{id:test.id,category:test.category,scenario:test.scenario,scenarioSha256:scenarioIdentity(test),status:'enumerated-not-executed',expectedRepair:test.source!==test.expected,checks:0,helperEndpointAssertions:0,calculateExecutions:0}:runCase(test);if(args.enumerate)append(rowFile,row);distinctScenarios.add(row.scenarioSha256);metadata.cases++;metadata.checks+=row.checks;if(!args.enumerate&&row.status!=='passed')metadata.failures++;
 metadata.byEvidence[row.expectedRepair?'expectedRepairCases':'expectedPreservationCases']++;
 for(const [field,key]of [['protectedContext','protectedContextCases'],['optionGuard','optionGuardCases'],['defaultIntegration','defaultIntegrationCases']])if(row[field])metadata.byEvidence[key]++;
 metadata.byEvidence.helperEndpointAssertions+=row.helperEndpointAssertions;metadata.byEvidence.calculateExecutions+=row.calculateExecutions;
 const category=metadata.byCategory[row.category]||={cases:0,checks:0,failures:0};category.cases++;category.checks+=row.checks;if(!args.enumerate&&row.status!=='passed')category.failures++;
 if(metadata.cases%100===0){save();process.stdout.write(JSON.stringify({shard,cases:metadata.cases,checks:metadata.checks,failures:metadata.failures,elapsedMs:metadata.elapsedMs})+'\n');}
}
metadata.catalogObjectsUnchanged=bundles.every(bundle=>sha(JSON.stringify({infoboxes:bundle.api.infoboxCatalog,templates:bundle.api.templateCatalog,translations:bundle.api.translationRules,spelling:bundle.api.spellingRules,citationParameters:bundle.api.citationParameters,obsolete:bundle.api.obsoleteCatalog}))===dataSha256);
if(!metadata.catalogObjectsUnchanged)throw new Error('A catalog object changed during actual execution');
metadata.primaryOracleAudit={contractSha256:oracleAudit.contractSha256,oracleSha256:oracleAudit.sourceSha256,retainedInputsSha256:oracleAudit.retainedInputsSha256,retainedInputCases:899,reviewed:oracleAudit.reviewed,changed:oracleAudit.changed,byReason:oracleAudit.byReason,originalDistinctScenarioCount:oracleAudit.oldDistinct.size};
metadata.status=args.enumerate?'enumerated-not-executed':metadata.failures?'failed':'passed';save();
if(!metadata.sourceBytesUnchanged)throw new Error('Runtime or runner bytes changed during execution');
process.stdout.write(JSON.stringify(metadata)+'\n');if(!args.enumerate&&metadata.status!=='passed')process.exitCode=1;
