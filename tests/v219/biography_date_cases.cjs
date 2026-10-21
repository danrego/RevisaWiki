'use strict';
// Current canonical native families and explicit calendar tuples. The source
// role ledger is independent of the runtime's normalized profile-name keys.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),hash=value=>crypto.createHash('sha256').update(value).digest('hex'),
 canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value,
 contractBytes=fs.readFileSync(path.join(__dirname,'biography_date_contracts.json')),contracts=JSON.parse(contractBytes),identities=new Set();
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={schemaVersion:1,kind:'current-native-biography-date-actions',status:'passed',runnerSha256:hash(fs.readFileSync(__filename)),contractSha256:hash(contractBytes),bundles:[],cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0,helperInjection:false},
 eq=(actual,expected,label)=>{report.checks++;assert.deepEqual(actual,expected,label);};
const tuples=[
 ['ordinary','{{Dni|1|1|1900}}','2 de janeiro de 1980','{{Dni|1|1|1900|si}}','{{Morte|2|1|1980|1|1|1900}}'],
 ['padded-native','{{dni|01|01|1900}}','1980-01-02','{{dni|01|01|1900|si}}','{{Morte|2|1|1980|1|1|1900}}'],
 ['named-native','{{Dni|1=1|2=1|3=1900}}','{{Morte|2|1|1980}}','{{Dni|1=1|2=1|3=1900|4=si}}','{{Morte|2|1|1980|1|1|1900}}'],
 ['mixed-named','{{Dni|1|2=1|3=1900}}','{{Morte|1=2|2=1|3=1980}}','{{Dni|1|2=1|3=1900|4=si}}','{{Morte|1=2|2=1|3=1980|4=1|5=1|6=1900}}'],
 ['plain-birth','1 de janeiro de 1900','1980-01-02','1 de janeiro de 1900','{{Morte|2|1|1980|1|1|1900}}'],
 ['iso-birth','1900-01-01','{{Morte|2|1|1980}}','1900-01-01','{{Morte|2|1|1980|1|1|1900}}']
];
const article=(profile,title,birthKey,deathKey,birth,death,extra='')=>'{{'+title+'|nome=Pessoa fictícia'+(profile.soloMusic?'|fundo=cantor_solo':'')+'|'+birthKey+'='+birth+'|'+deathKey+'='+death+extra+'}}\n\n'+"'''Pessoa fictícia''' foi uma pesquisadora.\n";
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Pessoa fictícia',contentModel:'wikitext',infoboxes:true,markup:true,birthDates:true,syntaxRepairs:true,structuralRepairs:true,minorBaseConfirmed:true};
 let activeProfile=null;
 report.bundles.push({bundle,sha256:hash(bytes),version:api.version});
 function run(id,source,expected,options=base,meta={}){
  const scenarioSha256=hash(JSON.stringify(canonical({source,expected,options,kind:'adjust'}))),row={id,bundle,scenarioSha256,sourceSha256:hash(source),expectedEndpointSha256:hash(expected),optionsSha256:hash(JSON.stringify(canonical(options))),intentSha256:hash(JSON.stringify({nativeOldid:activeProfile?.oldid,capability:'biographyDates'})),enabledBooleanOptions:Object.keys(options).filter(key=>options[key]===true).sort(),scopeContext:{namespaceNumber:options.namespaceNumber,section:options.section??null,sectionOnly:!!options.sectionOnly,contentModel:options.contentModel||'wikitext',pageRedirect:!!options.pageRedirect,pageDisambiguation:!!options.pageDisambiguation,pageTitleSha256:hash(options.pageTitle||'')},status:'passed',...meta};identities.add(scenarioSha256);report.cases.push(row);
  try{
   const first=api.calculate({kind:'adjust',source,originalSource:source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options}),plan=api.v28BiographyDatePlan(source,options);
   eq(first.text,expected,'The whole action uses the independently specified exact tuple');eq(second.text,expected,'The whole action is idempotent');eq(first.preservation||[],[],'Names and dates remain intact');eq(api.safeComposition(source,expected,options),'','The complete source context composes safely');
   if(meta.directPlan!==false){eq(plan.text,expected,'The direct plan agrees with the full action');eq(api.v28BiographyDateProof(source,expected,plan,options),true,'The exact native-family plan is fresh');eq(api.v28BiographyDateProof(source+'x',expected,plan,options),false,'A stale source cannot authorize the edit');eq(api.v28BiographyDateProof(source,expected+'x',plan,options),false,'Collateral prose cannot join the tuple edit');}
   row.actualEndpointSha256=hash(first.text);row.appliedIds=(first.changes||[]).map(change=>change.id);
  }catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}
 }
 for(const profile of [...contracts.profiles,...contracts.verifiedRedirectAliases]){
  activeProfile=profile;
  const native=api.infoboxCatalog[profile.title.toLocaleLowerCase('pt')];eq(native?.oldid,profile.oldid,'The current native family is pinned');
  for(const birthKey of profile.birthFields)for(const deathKey of profile.deathFields)for(const [format,birth,death,birthAfter,deathAfter]of tuples)for(const title of [profile.title,profile.title[0].toLocaleLowerCase('pt')+profile.title.slice(1),'Predefinição:'+profile.title,'Template:'+profile.title]){
   const source=article(profile,title,birthKey,deathKey,birth,death),expected=article(profile,title,birthKey,deathKey,birthAfter,deathAfter);
   run(profile.title+'/'+birthKey+'/'+deathKey+'/'+format+'/'+title,source,expected,base,{nativeOldid:profile.oldid,birthKey,deathKey,format,kind:'positive'});
  }
  const birthKey=profile.birthFields[0],deathKey=profile.deathFields[0],source=article(profile,profile.title,birthKey,deathKey,tuples[0][1],tuples[0][2]);
  if(profile.soloMusic){const unknown=source.replace('|fundo=cantor_solo','|fundo=artista_solo');run(profile.title+'/unconfirmed-music-person-type',unknown,unknown,base,{kind:'unconfirmed-person-type'});}
  for(const [id,options]of [
   ['disabled-birthDates',{birthDates:false}],['disabled-infoboxes',{infoboxes:false}],['disabled-markup',{markup:false}],['disabled-syntax',{syntaxRepairs:false}],['disabled-structure',{structuralRepairs:false}],['talk',{namespaceNumber:1}],['template',{namespaceNumber:10}],['section',{section:'0'}],['section-only',{sectionOnly:true}],['redirect',{pageRedirect:true}],['disambiguation',{pageDisambiguation:true}],['living-proof',{livingCategoryConfirmed:true}],['list-title',{pageTitle:'Lista de pessoas fictícias'}]
  ])run(profile.title+'/'+id,source,source,{...base,...options},{kind:'off-or-scope'});
  for(const [id,wrap]of [
   ['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!--'+s+'-->'],['pre',s=>'<pre>'+s+'</pre>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],['quotation',s=>'"'+s+'"'],['nested-table',s=>'{|\n| '+s+'\n|}'],['secondary-box',s=>s+'\n{{Info/Biografia|nome=Outra pessoa fictícia}}'],['later-section',s=>'== Biografia ==\n'+s],['living-category',s=>s+'[[Categoria:Pessoas vivas]]'],['signed',s=>s+'~~~~']
  ]){const raw=wrap(source);run(profile.title+'/'+id,raw,raw,base,{kind:'protected-or-scope'});}
  const lowerTitle=profile.title.toLocaleLowerCase('pt'),nativeTitle=lowerTitle.slice(0,1).toLocaleUpperCase('pt')+lowerTitle.slice(1),verifiedAlias=contracts.verifiedRedirectAliases.some(item=>item.title===nativeTitle);if(lowerTitle.slice(1)!==profile.title.slice(1)&&!verifiedAlias){
   const raw=article(profile,lowerTitle,birthKey,deathKey,tuples[0][1],tuples[0][2]);run(profile.title+'/unproved-interior-case-family',raw,raw,base,{kind:'unproved-native-family-identity'});
  }
  for(const [id,birth,death,extra]of [
   ['qualified-birth','cerca de 1900','2 de janeiro de 1980',''],['future-death','{{Dni|1|1|2000}}','2 de janeiro de 2100',''],['negative-age','{{Dni|1|1|2000}}','2 de janeiro de 1980',''],['implausible-age','{{Dni|1|1|1800}}','2 de janeiro de 1980',''],['calendar','{{Dni|1|1|1900}}','2 de janeiro de 1980','|calendário=Juliano'],['explicit-blank-alias','{{Dni|1|1|1900}}','2 de janeiro de 1980',profile.birthFields.length>1?'|'+profile.birthFields[1]+'=':'|'+birthKey+'='],['identical-alias','{{Dni|1|1|1900}}','2 de janeiro de 1980','|'+(profile.birthFields[1]||birthKey)+'={{Dni|1|1|1900}}']
  ]){const raw=article(profile,profile.title,birthKey,deathKey,birth,death,extra);run(profile.title+'/'+id,raw,raw,base,{kind:'ambiguous-or-conflicting'});}
  const birth='{{Dni|1|1|1900}}<ref name="nascimento">Fonte do nascimento.</ref>',death='2 de janeiro de 1980<ref name="morte">Fonte da morte.</ref>',raw=article(profile,profile.title,birthKey,deathKey,birth,death),expected=article(profile,profile.title,birthKey,deathKey,birth.replace('1900}}','1900|si}}'),death.replace('2 de janeiro de 1980','{{Morte|2|1|1980|1|1|1900}}'));
  run(profile.title+'/references',raw,expected,base,{kind:'reference-retention'});
 }
 eq(hash(fs.readFileSync(file)),hash(bytes),'The actual runtime is immutable');
}
report.distinctScenarioCount=identities.size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
