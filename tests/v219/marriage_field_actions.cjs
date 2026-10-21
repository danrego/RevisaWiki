'use strict';
// Independent actual-action endpoints from byte-identical native spouse fields.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.env.REVISAWIKI_TEST_REPO||path.join(__dirname,'../..')),files=process.argv.slice(2).map(file=>path.resolve(file)),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const contractBytes=fs.readFileSync(path.join(__dirname,'marriage_field_contracts.json')),contracts=JSON.parse(contractBytes),report={schemaVersion:1,kind:'native-marriage-field-whole-actions',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),contracts:{nativeSpouseFieldsSha256:sha(contractBytes)},bundles:[],cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0,helperInjection:false},identities=new Set(),eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);},fixtures=[];
const add=(id,source,expected,options={},gates=['infoboxes','markup'])=>fixtures.push({id,source,expected,options,gates}),
 marriage=(person,type,date,end='',status='')=>'{{casamento|tipo='+type+'|()=pequeno|'+person+'|'+date+(end?'|'+end:'')+(status?'|fim='+status:'')+'}}',
 page=(name,key,value,extra={})=>'{{'+name+'|nome=Pessoa fictícia|'+key+'='+value+Object.entries(extra).map(([field,data])=>'|'+field+'='+data).join('')+'}}\n\nTexto preservado.';
for(const profile of contracts.profiles){
 const names=[profile.name,...profile.aliases.map(row=>row.name)];
 for(const name of names)for(const key of profile.fields)for(const [word,type]of [['casado','h'],['casada','m'],['casados','c']])for(const date of ['2000','2000-02-29','29 de fevereiro de 2000']){
  const source=page(name,key,'[[Pessoa Alfa]] ('+word+' em '+date+')',profile.requiredFields),expected=page(name,key,marriage('[[Pessoa Alfa]]',type,date),profile.requiredFields);
  add(name+'/'+key+'/'+word+'/'+date,source,expected);
 }
 for(const key of profile.fields){
  for(const [word,type,status]of [['casado','h','divorciado'],['casada','m','divorciada'],['casados','c','divorciados'],['casado','h','separado'],['casada','m','separada'],['casados','c','separados'],['casado','h','viúvo'],['casada','m','viúva']])for(const separator of ['; ', ', ']){
   const source=page(profile.name,key,'Pessoa Alfa ('+word+' em 2000'+separator+status+' em 2005)',profile.requiredFields),expected=page(profile.name,key,marriage('Pessoa Alfa',type,'2000','2005',status),profile.requiredFields);add(profile.name+'/'+key+'/'+status+'/'+separator,source,expected);
  }
  for(const range of ['de 2000 a 2005','entre 2000 e 2005']){const source=page(profile.name,key,'Pessoa Alfa (casada '+range+')',profile.requiredFields);add(profile.name+'/'+key+'/'+range,source,page(profile.name,key,marriage('Pessoa Alfa','m','2000','2005'),profile.requiredFields));}
  const source=page(profile.name,key,'Pessoa Alfa (casada em 1950; divorciada em 1960)<br />[[Pessoa Beta]] (casado em 1970)',profile.requiredFields),expected=page(profile.name,key,marriage('Pessoa Alfa','m','1950','1960','divorciada')+'<br />'+marriage('[[Pessoa Beta]]','h','1970'),profile.requiredFields);add(profile.name+'/'+key+'/two-explicit',source,expected);
  for(const invalid of ['Pessoa Alfa (casada desde 2000)','Pessoa Alfa (casada em 31 de fevereiro de 2000)','Pessoa Alfa (casada em 15/03/2000)','Pessoa Alfa (casada em 1900-02-29)','Pessoa Alfa (casada em 2005; divorciada em 2000)','Pessoa Alfa (casada em 2000; divorciado em 2005)','Pessoa Alfa (2000–2005)','Pessoa Alfa e Pessoa Beta (casados em 2000)','Pessoa Alfa (casada em cerca de 2000)','Pessoa Alfa (casada em {{{ano}}})']){const raw=page(profile.name,key,invalid,profile.requiredFields);add(profile.name+'/'+key+'/uncertain/'+sha(invalid).slice(0,12),raw,raw,{},[]);}
 }
 for(const first of profile.fields)for(const second of profile.fields)if(first!==second)for(const values of [['Pessoa Alfa (casada em 2000)',''],['','Pessoa Alfa (casada em 2000)'],['Pessoa Alfa (casada em 2000)','Pessoa Beta (casada em 2001)']]){
  const source=page(profile.name,first,values[0],{...profile.requiredFields,[second]:values[1]});add(profile.name+'/competing/'+first+'/'+second+'/'+sha(JSON.stringify(values)).slice(0,8),source,source,{},[]);
 }
}
const ordinary='Pessoa Alfa (casada em 2000)',canonicalPage=page('Info/Biografia','cônjuge',ordinary);
for(const nativeName of ['info/Biografia','Template:Info/Biografia','Predefinição:Info/Biografia']){const source=page(nativeName,'cônjuge',ordinary);add('native-title/'+nativeName,source,page(nativeName,'cônjuge',marriage('Pessoa Alfa','m','2000')));}
for(const name of ['Info/biografia','Info/cientista','Info/CaNtOr','Modelo fictício']){const source=page(name,'cônjuge',ordinary);add('unproved-title/'+name,source,source,{},[]);}
for(const [key,value]of Object.entries({namespaceNumber:1,sectionOnly:true,discussionPage:true,contentModel:'javascript',pageRedirect:true,pageDisambiguation:true})){add('scope/'+key,canonicalPage,canonicalPage,{[key]:value},[]);}
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Pessoa fictícia',contentModel:'wikitext',infoboxes:true,markup:true,syntaxRepairs:true,structuralRepairs:true,minorBaseConfirmed:true};report.bundles.push({bundle,sha256:sha(bytes),version:api.version});
 function run(fixture,id,source,expected,options,kind){
  const scenarioSha256=sha(JSON.stringify(canonical({source,expected,options,kind:'adjust'}))),row={id,bundle,kind,scenarioSha256,sourceSha256:sha(source),expectedEndpointSha256:sha(expected),optionsSha256:sha(JSON.stringify(canonical(options))),intentSha256:sha(fixture.id),enabledBooleanOptions:Object.keys(options).filter(key=>options[key]===true).sort(),scopeContext:{namespaceNumber:options.namespaceNumber,section:options.section??null,sectionOnly:!!options.sectionOnly,contentModel:options.contentModel||'wikitext',pageRedirect:!!options.pageRedirect,pageDisambiguation:!!options.pageDisambiguation,pageTitleSha256:sha(options.pageTitle||'')},status:'passed'};identities.add(scenarioSha256);report.cases.push(row);
  try{const first=api.calculate({kind:'adjust',source,originalSource:source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});eq(first.text,expected,'Exact independently assembled whole-action endpoint');eq(second.text,expected,'A second action is byte-identical');eq(first.preservation||[],[],'Names, dates, reference bodies and values remain intact');eq(api.safeComposition(source,expected,options),'','The full article context accepts only the exact transaction');row.actualEndpointSha256=sha(first.text);row.appliedIds=(first.changes||[]).map(change=>change.id);}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}
 }
 for(const fixture of fixtures){const options={...base,...fixture.options};run(fixture,fixture.id+'-positive',fixture.source,fixture.expected,options,'positive');
  for(const gate of fixture.gates)run(fixture,fixture.id+'-off-'+gate,fixture.source,fixture.source,{...options,[gate]:false},'off');
  for(const [id,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!--'+s+'-->'],['code',s=>'<code>'+s+'</code>'],['unknown-owner',s=>'{{Modelo fictício|exemplo='+s+'}}']]){const source=wrap(fixture.source);run(fixture,fixture.id+'-protected-'+id,source,source,options,'protected');}
 }
 eq(sha(fs.readFileSync(file)),sha(bytes),'The actual bundle remains immutable');
}
report.distinctScenarioCount=identities.size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
