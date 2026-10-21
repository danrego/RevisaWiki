'use strict';
// Current, byte-identical native definitions supply the finite field roles.
// Expected endpoints do not call the runtime's field-repair helpers.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),hash=value=>crypto.createHash('sha256').update(value).digest('hex'),canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value,
 contractBytes=fs.readFileSync(path.join(__dirname,'biography_parameter_contracts.json')),contracts=JSON.parse(contractBytes),identities=new Set();
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={schemaVersion:1,kind:'current-native-biography-parameter-whole-actions',status:'passed',runnerSha256:hash(fs.readFileSync(__filename)),contractSha256:hash(contractBytes),bundles:[],cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0,helperInjection:false},eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);},
 lead="\n\n'''Pessoa fictícia''' foi uma pesquisadora.\n",box=(title,fields)=>'{{'+title+'|nome=Pessoa fictícia|'+fields+'}}'+lead,
 wrappers=[['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!--'+s+'-->'],['code',s=>'<code>'+s+'</code>'],['pre',s=>'<pre>'+s+'</pre>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],['unknown-parent',s=>'{{Modelo fictício|exemplo='+s+'}}']];
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Pessoa fictícia',contentModel:'wikitext',infoboxes:true,markup:true,syntaxRepairs:true,structuralRepairs:true,automaticBiographyFields:true,automaticInfoboxValues:true,automaticParameterNames:true};
 report.bundles.push({bundle,sha256:hash(bytes),version:api.version});
 function run(intent,id,source,expected,options=base,kind='positive'){
  const scenarioSha256=hash(JSON.stringify(canonical({source,expected,options,kind:'adjust'}))),row={id,bundle,kind,scenarioSha256,sourceSha256:hash(source),expectedEndpointSha256:hash(expected),optionsSha256:hash(JSON.stringify(canonical(options))),intentSha256:hash(JSON.stringify(intent)),enabledBooleanOptions:Object.keys(options).filter(key=>options[key]===true).sort(),scopeContext:{namespaceNumber:options.namespaceNumber,section:options.section??null,sectionOnly:!!options.sectionOnly,contentModel:options.contentModel||'wikitext',pageRedirect:!!options.pageRedirect,pageDisambiguation:!!options.pageDisambiguation,pageTitleSha256:hash(options.pageTitle||'')},status:'passed'};identities.add(scenarioSha256);report.cases.push(row);
  try{const first=api.calculate({kind:'adjust',source,originalSource:source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});eq(first.text,expected,'Exact independently written field/priority endpoint');eq(second.text,expected,'No delayed second action');eq(first.preservation||[],[],'All names, values, dates and references retained');eq(api.safeComposition(source,expected,options),'','The whole article permits only the exact transaction');row.actualEndpointSha256=hash(first.text);row.appliedIds=(first.changes||[]).map(change=>change.id);}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}
 }
 for(const contract of contracts.contracts){
  eq(api.infoboxCatalog[contract.template.toLocaleLowerCase('pt')]?.oldid,contract.oldid,'The current native source identity remains pinned');
  for(const [wrong,target]of Object.entries(contract.accents)){
   const intent={oldid:contract.oldid,kind:'key-accent',wrong,target};
   for(const value of ['Texto literal',' [[Tema fictício|rótulo]]<ref>Fonte publicada.</ref> ','{{Lang|fr|Texte}}<ref>{{Citar livro|título=Fonte literal|ano=2001}}</ref>']){
    const source=box(contract.template,wrong+'='+value),expected=box(contract.template,target+'='+value),tag=contract.template+'/'+wrong+'/'+hash(value).slice(0,12);
    run(intent,tag,source,expected);
    for(const option of ['infoboxes','markup','automaticBiographyFields','automaticInfoboxValues','automaticParameterNames'])run(intent,tag+'/off-'+option,source,source,{...base,[option]:false},'off');
    for(const [kind,wrap]of wrappers){const raw=wrap(source);run(intent,tag+'/'+kind,raw,raw,base,'protected');}
   }
   for(const blank of ['',' \t ']){
    const raw=box(contract.template,wrong+'='+blank);run(intent,contract.template+'/'+wrong+'/blank-'+hash(blank).slice(0,8),raw,raw,base,'boundary');
   }
   for(const reverse of [false,true])for(const targetValue of ['','Outro valor','Texto literal']){
    const fields=[wrong+'=Texto literal',target+'='+targetValue];if(reverse)fields.reverse();const raw=box(contract.template,fields.join('|'));
    run(intent,contract.template+'/'+wrong+'/competing-'+hash(fields.join('|')).slice(0,12),raw,raw,base,'boundary');
   }
  }
  for(const family of contract.aliases){
   eq(family.mode,'presence','This test does not infer a fallback mode');
   for(let first=0;first<family.keys.length;first++)for(let later=first+1;later<family.keys.length;later++){
    const high=family.keys[first],low=family.keys[later],intent={oldid:contract.oldid,kind:'alias-priority',high,low};
    for(const reverse of [false,true])for(const highBlank of [false,true])for(const empty of ['',' \t ','\r\n'])for(const ref of ['','<ref name="fonte">Fonte publicada.</ref>']){
     const value='Texto literal'+ref,fields=[high+'='+(highBlank?empty:value),low+'='+(highBlank?value:empty)];if(reverse)fields.reverse();
     const raw=box(contract.template,fields.join('|')),expected=highBlank?raw:box(contract.template,high+'='+value);
     run(intent,contract.template+'/'+family.kind+'/'+hash(fields.join('|')).slice(0,16),raw,expected,base,highBlank?'boundary':'positive');
    }
    const raw=box(contract.template,high+'=Texto literal|'+low+'='),expected=box(contract.template,high+'=Texto literal');
    for(const option of ['infoboxes','markup','automaticBiographyFields','automaticInfoboxValues'])run(intent,contract.template+'/'+family.kind+'/'+high+'/'+low+'/off-'+option,raw,raw,{...base,[option]:false},'off');
    // The key-name switch gates invalid-key spelling, not independently proved
    // removal of a lower-priority, already inactive native alias.
    run(intent,contract.template+'/'+family.kind+'/'+high+'/'+low+'/key-master-independent',raw,expected,{...base,automaticParameterNames:false});
    for(const [kind,wrap]of wrappers){const source=wrap(raw);run(intent,contract.template+'/'+family.kind+'/'+high+'/'+low+'/'+kind,source,source,base,'protected');}
   }
  }
 }
 eq(hash(fs.readFileSync(file)),hash(bytes),'The actual runtime remains immutable');
}
report.distinctScenarioCount=identities.size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
