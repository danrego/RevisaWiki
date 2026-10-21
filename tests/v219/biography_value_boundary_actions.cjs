'use strict';
// Literal, independently assembled endpoints for the existing field-value
// grammar, including each reviewed label role and calendar-bound age copies.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),hash=value=>crypto.createHash('sha256').update(value).digest('hex'),canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value,
 contractBytes=fs.readFileSync(path.join(__dirname,'biography_parameter_contracts.json')),contracts=JSON.parse(contractBytes),identities=new Set(),clock=new Date(),calendarUTC=[clock.getUTCFullYear(),clock.getUTCMonth()+1,clock.getUTCDate()].join('-');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={schemaVersion:1,kind:'native-biography-value-boundary-actions',status:'passed',runnerSha256:hash(fs.readFileSync(__filename)),contractSha256:hash(contractBytes),calendarUTC,bundles:[],cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0,helperInjection:false},eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);},
 lead="\n\n'''Pessoa fictícia''' foi uma pesquisadora.\n",box=(title,fields)=>'{{'+title+'|nome=Pessoa fictícia|'+fields+'}}'+lead,
 labelRows=[
  ['Info/Biografia',72993800,'nome_completo','Nome completo','Pessoa fictícia'],
  ['Info/Biografia',72993800,'nascimento_data','Nascimento','1 de janeiro de 1900'],
  ['Info/Biografia',72993800,'local_nascimento','Nascimento','[[Cidade Alfa]]'],
  ['Info/Biografia',72993800,'morte_data','Morte','2 de janeiro de 1980'],
  ['Info/Biografia',72993800,'local_morte','Morte','[[Cidade Beta]]'],
  ['Info/Biografia',72993800,'nacionalidade','Nacionalidade','brasileira'],
  ['Info/Biografia',72993800,'cidadania','Cidadania','brasileira'],
  ['Info/Biografia',72993800,'ocupação','Ocupação','pesquisadora'],
  ['Info/Biografia',72993800,'outras_ocupações','Outras ocupações','pesquisadora'],
  ['Info/Biografia',72993800,'profissão','Profissão','pesquisadora'],
  ['Info/Futebolista',70095373,'data_nascimento','Data de nascimento','1 de janeiro de 1900'],
  ['Info/Futebolista',70095373,'nascimento_local','Local de nascimento','[[Cidade Alfa]]'],
  ['Info/Futebolista',70095373,'morte_data','Data da morte','2 de janeiro de 1980'],
  ['Info/Futebolista',70095373,'morte_local','Local da morte','[[Cidade Beta]]']
 ];
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Pessoa fictícia',contentModel:'wikitext',infoboxes:true,markup:true,syntaxRepairs:true,structuralRepairs:true,automaticBiographyFields:true};
 report.bundles.push({bundle,sha256:hash(bytes),version:api.version});
 function run(intent,id,source,expected,options=base,kind='positive'){
  const scenarioSha256=hash(JSON.stringify(canonical({source,expected,options,kind:'adjust'}))),row={id,bundle,kind,scenarioSha256,sourceSha256:hash(source),expectedEndpointSha256:hash(expected),optionsSha256:hash(JSON.stringify(canonical(options))),intentSha256:hash(JSON.stringify(intent)),enabledBooleanOptions:Object.keys(options).filter(key=>options[key]===true).sort(),scopeContext:{namespaceNumber:options.namespaceNumber,section:options.section??null,sectionOnly:!!options.sectionOnly,contentModel:options.contentModel||'wikitext',pageRedirect:!!options.pageRedirect,pageDisambiguation:!!options.pageDisambiguation,pageTitleSha256:hash(options.pageTitle||'')},status:'passed'};identities.add(scenarioSha256);report.cases.push(row);
  try{const first=api.calculate({kind:'adjust',source,originalSource:source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});eq(first.text,expected,'The whole action preserves the independently specified literal value');eq(second.text,expected,'No delayed field-value edit');eq(first.preservation||[],[],'Date, name and reference content retained');eq(api.safeComposition(source,expected,options),'','The exact transaction composes safely');row.actualEndpointSha256=hash(first.text);row.appliedIds=(first.changes||[]).map(change=>change.id);}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}
 }
 for(const [title,oldid,key,label,value]of labelRows){
  eq(api.infoboxCatalog[title.toLocaleLowerCase('pt')]?.oldid,oldid,'The current reviewed definition remains pinned');
  const intent={kind:'field-label',oldid,key,label};
  for(const repeat of [1,2,3,4])for(const suffix of ['','<ref>Fonte publicada.</ref>']){
   const prefix=(label+': ').repeat(repeat),raw=box(title,key+'='+prefix+value+suffix),expected=box(title,key+'='+value+suffix);run(intent,title+'/'+key+'/count-'+repeat+'/ref-'+!!suffix,raw,expected);
  }
  for(const rawValue of [(label+': ').repeat(5)+value,label+': ',label+': <ref>Fonte publicada.</ref>']){const raw=box(title,key+'='+rawValue);run(intent,title+'/'+key+'/boundary-'+hash(rawValue).slice(0,10),raw,raw,base,'boundary');}
  const source=box(title,key+'='+label+': '+value);
  for(const option of ['infoboxes','markup','automaticBiographyFields'])run(intent,title+'/'+key+'/off-'+option,source,source,{...base,[option]:false},'off');
  for(const [kind,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['quotation',s=>'"'+s+'"'],['unknown-owner',s=>'{{Modelo fictício|exemplo='+s+'}}']]){const raw=wrap(source);run(intent,title+'/'+key+'/'+kind,raw,raw,base,'protected');}
 }
 for(const age of [1,2,26]){
  const year=clock.getUTCFullYear()-age,call='{{Dni|1|1|'+year+'}}',word=age===1?'ano':'anos',intent={kind:'duplicate-age',nativeOldid:72993800,dateTemplateOldid:69218531,calendarUTC,age},source=box('Info/Biografia','nascimento_data='+call+' ('+age+' '+word+')'),expected=box('Info/Biografia','nascimento_data='+call),options={...base,birthDates:true};
  run(intent,'duplicate-age/'+age,source,expected,options);
  for(const option of ['birthDates','automaticBiographyFields','infoboxes','markup'])run(intent,'duplicate-age/'+age+'/off-'+option,source,source,{...options,[option]:false},'off');
  for(const value of [call+' ('+(age+1)+' anos)',call+' ('+age+' '+(word==='ano'?'anos':'ano')+')',call.replace('}}','|si}}')+' ('+age+' '+word+')']){const raw=box('Info/Biografia','nascimento_data='+value);run(intent,'duplicate-age/'+age+'/boundary-'+hash(value).slice(0,10),raw,raw,options,'boundary');}
 }
 eq(hash(fs.readFileSync(file)),hash(bytes),'The actual bundle is unchanged');
}
report.distinctScenarioCount=identities.size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
