'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const files=process.argv.slice(2).map(f=>path.resolve(f));if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(f=>path.join(root,'dist/2.19.0',f)));
const contractFile=path.join(__dirname,'native_age_field_contract.json'),contract=JSON.parse(fs.readFileSync(contractFile));
const dateFile=path.join(__dirname,'biography_date_contracts.json'),dateContracts=JSON.parse(fs.readFileSync(dateFile));
const now=new Date(),clock={year:now.getUTCFullYear(),month:now.getUTCMonth()+1,day:now.getUTCDate()},ageAt=([d,m,y])=>clock.year-y-Number(clock.month<m||clock.month===m&&clock.day<d);
const report={kind:'native-displayed-birth-field-duplicate-age-only-actions',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),contractSha256:sha(fs.readFileSync(contractFile)),pairedDateContractSha256:sha(fs.readFileSync(dateFile)),clockUTC:[clock.year,clock.month,clock.day].join('-'),bundles:[],cases:[],guards:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const fixtures=[],add=(id,source,expected=source,extra={},defaults=false)=>fixtures.push({id,source,expected,extra,defaults});
const article=(title,fields)=>'{{'+title+'|nome=Pessoa fictícia|'+fields+"}}\n\n'''Pessoa fictícia''' é uma pessoa.\n";
for(const profile of contract.profiles)for(const key of profile.displayedBirthFallbackKeys){
 for(const tuple of [[1,1,2000],[31,12,2000],[29,2,2000]])for(const gap of [' ','\t']){
  const [d,m,y]=tuple,age=ageAt(tuple),call='{{Dni|'+d+'|'+m+'|'+y+'}}',value=call+gap+'('+age+' anos)';
  add('displayed/'+sha(profile.title+key+value).slice(0,20),article(profile.title,key+'='+value),article(profile.title,key+'='+call));
 }
 const call='{{dni|3=2000|1=1|2=1}}',value=call+' ('+ageAt([1,1,2000])+' anos)';
 add('named-numeric/'+sha(profile.title+key).slice(0,20),article(profile.title,key+'='+value),article(profile.title,key+'='+call));
 for(const tail of [' \n',' \r\n'])add('field-padding/'+sha(profile.title+key+tail).slice(0,20),article(profile.title,key+'= \t'+value+tail),article(profile.title,key+'= \t'+call+tail));
 for(const other of profile.displayedBirthFallbackKeys.filter(other=>other!==key))for(const otherValue of ['',value]){
  const source=article(profile.title,key+'='+value+'|'+other+'='+otherValue);add('competing/'+sha(source).slice(0,20),source);
 }
 const age=ageAt([1,1,2000]),dni='{{Dni|1|1|2000}}';
 for(const [id,bad]of [['wrong-age',dni+' ('+(age+1)+' anos)'],['wrong-plural',dni+' ('+age+' ano)'],['suppressed','{{Dni|1|1|2000|si}} ('+age+' anos)'],['extra-flag','{{Dni|1|1|2000|nocat=sim}} ('+age+' anos)'],['invalid-date','{{Dni|31|2|2000}} ('+age+' anos)'],['qualified',dni+' ('+age+' anos em 2020)'],['comment',dni+' ('+age+' anos)<!-- nota -->']])add('boundary/'+id+'/'+sha(profile.title+key).slice(0,16),article(profile.title,key+'='+bad));
 const ref='<ref name="nascimento">Fonte fictícia.</ref>';
 add('reference/'+sha(profile.title+key).slice(0,20),article(profile.title,key+'='+dni+' ('+age+' anos)'+ref),article(profile.title,key+'='+dni+ref));
 for(const extra of ['|calendar=Juliano','|calendário=Juliano','|suprimir=data_nascimento'])add('control/'+sha(profile.title+key+extra).slice(0,20),article(profile.title,key+'='+value+extra));
 const defaultSource=article(profile.title,key+'='+value)+'{{Portal3|Biografias}}\n',defaultExpected=article(profile.title,key+'='+call)+'{{Portal3|Biografias}}\n';
 if(profile.title==='Info/Gastrônomo')add('default/'+sha(profile.title+key).slice(0,20),defaultSource,defaultExpected,{},true);
}
for(const profile of contract.profiles){
 const paired=dateContracts.profiles.find(row=>row.oldid===profile.oldid),birth=paired.birthFields[0],death=paired.deathFields[0];
 const fields=birth+'={{Dni|1|1|2000}} ('+ageAt([1,1,2000])+' anos)|'+death+'=2 de janeiro de 2020';
 const finalFields=birth+'={{Dni|1|1|2000|si}}|'+death+'={{Morte|2|1|2020|1|1|2000}}';
 add('paired-existing-dates/'+sha(profile.title).slice(0,20),article(profile.title,fields),article(profile.title,finalFields));
}
const profile=contract.profiles.find(p=>p.title==='Info/Gastrônomo'),age=ageAt([1,1,2000]),sample=article(profile.title,'nascimento={{Dni|1|1|2000}} ('+age+' anos)'),expected=article(profile.title,'nascimento={{Dni|1|1|2000}}');
for(const key of ['birthDates','automaticBiographyFields','infoboxes','markup','structuralRepairs','syntaxRepairs'])add('off/'+key,sample,sample,{[key]:false});
for(const extra of [{namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true},{section:1},{contentModel:'javascript'},{pageTitle:'Lista de pessoas fictícias'},{pageRedirect:true},{pageDisambiguation:true}])add('scope/'+sha(JSON.stringify(extra)).slice(0,16),sample,sample,extra);
for(const [id,wrap]of [['quote',s=>'"'+s+'"'],['curly',s=>'“'+s+'”'],['guillemet',s=>'«'+s+'»'],['italic',s=>"''"+s+"''"],['bold',s=>"'''"+s+"'''"],['fence',s=>'Exemplo:\n```wikitext\n'+s+'```'],['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['unknown-owner',s=>'{{Modelo fictício|exemplo='+s+'}}'],['blockquote',s=>'<blockquote>'+s+'</blockquote>'],['table',s=>'{|\n| '+s+'\n|}']])add('protected/'+id,wrap(sample));
add('multiple-persons',sample+'\n{{Info/Gastrônomo|nome=Outra pessoa}}\n');
add('singular',article(profile.title,'nascimento={{Dni|1|1|'+(clock.year-1)+'}} (1 ano)'),article(profile.title,'nascimento={{Dni|1|1|'+(clock.year-1)+'}}'));
for(const title of ['INFO/Gastrônomo','Info/GASTRÔNOMO','Info/gastrônomo'])add('unproved-identity/'+sha(title).slice(0,16),sample.replace(profile.title,title));
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(k=>[k,false])),namespaceNumber:0,pageTitle:'Pessoa fictícia',contentModel:'wikitext',infoboxes:true,markup:true,syntaxRepairs:true,structuralRepairs:true,automaticBiographyFields:true,birthDates:true};
 report.bundles.push({bundle,sha256:sha(bytes),version:api.version});
 for(const f of fixtures){const options={...(f.defaults?{...api.defaults,namespaceNumber:0,pageTitle:'Pessoa fictícia',contentModel:'wikitext',authorityControl:false,autoPreview:false}:base),...f.extra},row={id:f.id,bundle,status:'passed',kind:f.source!==f.expected?'positive':f.id.startsWith('protected/')?'protected':f.id.startsWith('off/')?'off':'boundary',expectedRepair:f.source!==f.expected,sourceSha256:sha(f.source),optionsSha256:sha(JSON.stringify(canonical(options))),expectedEndpointSha256:sha(f.expected),intentSha256:sha('native-displayed-birth-field-duplicate-age-only'),defaultIntegration:f.defaults,enabledBooleanOptions:Object.keys(options).filter(k=>options[k]===true).sort(),scopeContext:{namespaceNumber:options.namespaceNumber,sectionOnly:!!options.sectionOnly},scenarioSha256:sha(JSON.stringify(canonical({source:f.source,options,expected:f.expected,kind:'adjust'})))};
  report.cases.push(row);try{const result=api.calculate({kind:'adjust',source:f.source,originalSource:f.source,options});report.checks++;assert.equal(result.text,f.expected,'Only the source-proved repeated age suffix changes');report.checks++;assert.deepEqual(result.preservation||[],[],'Native date, references and all other fields remain bound');report.checks++;assert.equal(api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options}).text,f.expected,'No delayed second-click repair');row.actualEndpointSha256=sha(result.text);row.appliedIds=(result.changes||[]).map(c=>c.id);}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id:f.id,message:error.message});}}
 const plan=api.v219NativeAgePlan(sample,base);
 for(const [id,run,wanted]of [['fresh',()=>api.v219NativeAgeProof(sample,expected,plan,base),true],['stale-source',()=>api.v219NativeAgeProof(sample+'x',expected,plan,base),false],['forged-edits',()=>api.v219NativeAgeProof(sample,expected,{...plan,edits:[]},base),false],['changed-endpoint',()=>api.v219NativeAgeProof(sample,expected+'x',plan,base),false],['changed-native-date',()=>api.v219NativeAgeInventoryProjection(sample.replace('|2000}}','|2001}}'),base)===expected,false],['changed-subject',()=>api.v219NativeAgeInventoryProjection(sample.replaceAll('Pessoa fictícia','Outra pessoa'),base)===expected,false]]){const row={id,bundle,status:'passed',evidenceKind:'guard-only-fresh-source-plan'};report.guards.push(row);try{report.checks++;assert.equal(run(),wanted,'Only the exact fresh native transaction is authorized');}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}}
 report.checks++;assert.equal(sha(fs.readFileSync(file)),sha(bytes),'Runtime bytes remain frozen');
}
report.distinctScenarioCount=new Set(report.cases.map(r=>r.scenarioSha256)).size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
