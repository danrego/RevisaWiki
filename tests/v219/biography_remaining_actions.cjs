'use strict';
// Complete-action witnesses for two existing rules. The independent native
// contracts determine the expected endpoints; helper hits are not counted.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const files=process.argv.slice(2).map(f=>path.resolve(f));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(f=>path.join(root,'dist/2.19.0',f)));
const contractFile=path.join(__dirname,'biography_date_contracts.json'),contracts=JSON.parse(fs.readFileSync(contractFile));
const transferFile=path.join(root,'tests/v216/transfer_contract_review.json'),transferContracts=JSON.parse(fs.readFileSync(transferFile)),nativeAgeFile=path.join(__dirname,'native_age_field_contract.json'),nativeAgeContracts=JSON.parse(fs.readFileSync(nativeAgeFile)),fieldValueIds=new Set([...transferContracts.definitions,...nativeAgeContracts.profiles].map(row=>row.oldid));
const now=new Date(),clock={year:now.getUTCFullYear(),month:now.getUTCMonth()+1,day:now.getUTCDate()};
const age=clock.year-2000,day=clock.year+'-'+clock.month+'-'+clock.day;
const report={kind:'remaining-native-biography-complete-action-witnesses',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),nativeDateContractSha256:sha(fs.readFileSync(contractFile)),nativeFieldValueScopeSha256:sha(fs.readFileSync(transferFile)),nativeAdditionalAgeContractSha256:sha(fs.readFileSync(nativeAgeFile)),clockUTC:day,nativeSources:[{oldid:72993800,role:'Info/Biografia does not display fundo'},{oldid:69218531,role:'Three numeric Dni parameters display the current UTC age'}],bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const fixtures=[],add=(id,source,expected=source,extra={},control=null)=>fixtures.push({id,source,expected,extra,control});
const article=(fields,title='Info/Biografia')=>'{{'+title+'|nome=Pessoa fictícia|'+fields+"}}\n\n'''Pessoa fictícia''' é uma pessoa.\n";
for(const value of ['', 'instrumentista_sem_vocal'])add('ignored-fundo/'+sha(value).slice(0,12),article('fundo='+value),article('').replace('|}}','}}'));
for(const value of ['cantor_solo','instrumentista_sem_vocal extra','{{Modelo fictício}}','instrumentista_sem_vocal<!-- nota -->'])add('unknown-fundo/'+sha(value).slice(0,12),article('fundo='+value));
add('duplicate-fundo',article('fundo=instrumentista_sem_vocal|fundo=instrumentista_sem_vocal'));
add('competing-fundo',article('fundo=instrumentista_sem_vocal|fundo='));
const ageSource=article('nascimento_data={{Dni|1|1|2000}} ('+age+' anos)'),ageExpected=article('nascimento_data={{Dni|1|1|2000}}');
for(const profile of [...contracts.profiles,...contracts.verifiedRedirectAliases])for(const key of profile.birthFields){
 const prefix=(profile.soloMusic?'fundo=cantor_solo|':'')+key+'=';
 for(const call of ['{{Dni|1|1|2000}}','{{dni|3=2000|1=1|2=1}}']){const source=article(prefix+call+' ('+age+' anos)',profile.title),provedFieldValueFamily=fieldValueIds.has(profile.oldid);add((provedFieldValueFamily?'manual-age/':'unproved-field-value-family/')+sha(profile.title+key+call).slice(0,20),source,provedFieldValueFamily?article(prefix+call,profile.title):source);}
}
add('singular-age',article('nascimento_data={{Dni|1|1|'+(clock.year-1)+'}} (1 ano)'),article('nascimento_data={{Dni|1|1|'+(clock.year-1)+'}}'));
for(const [id,value]of [['wrong-age','{{Dni|1|1|2000}} ('+(age+1)+' anos)'],['wrong-plural','{{Dni|1|1|2000}} ('+age+' ano)'],['suppressed','{{Dni|1|1|2000|si}} ('+age+' anos)'],['qualified','{{Dni|1|1|2000}} ('+age+' anos em 2020)'],['unknown-child','{{Data fictícia|1|1|2000}} ('+age+' anos)'],['reference-before-age','{{Dni|1|1|2000}}<ref>Fonte.</ref> ('+age+' anos)']])add('age-boundary/'+id,article('nascimento_data='+value));
for(const key of ['profissão','sepultamento'])add('unrelated-field/'+key,article(key+'={{Dni|1|1|2000}} ('+age+' anos)'));
for(const key of ['birthDates','automaticBiographyFields','infoboxes','markup','structuralRepairs'])add('age-off/'+key,ageSource,ageSource,{[key]:false},base=>({kind:'option-off',positive:{source:ageSource,expected:ageExpected,options:base}}));
add('fundo-off/infoboxes',article('fundo=instrumentista_sem_vocal'),undefined,{infoboxes:false},base=>({kind:'option-off',positive:{source:article('fundo=instrumentista_sem_vocal'),expected:article('').replace('|}}','}}'),options:base}}));
for(const [id,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['quotation',s=>'"'+s+'"'],['italic',s=>"''"+s+"''"],['fence',s=>'Exemplo:\n```wikitext\n'+s+'```'],['unknown-owner',s=>'{{Modelo fictício|exemplo='+s+'}}']])for(const [kind,source]of [['age',ageSource],['fundo',article('fundo=instrumentista_sem_vocal')]])add('protected/'+kind+'/'+id,wrap(source),undefined,{},base=>protectedEndpointControl(wrap(source),{source,expected:kind==='age'?ageExpected:article('').replace('|}}','}}'),options:base}));
for(const extra of [{namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true},{section:1},{pageTitle:'Lista de pessoas fictícias'},{pageRedirect:true}])add('age-scope/'+sha(JSON.stringify(extra)).slice(0,14),ageSource,ageSource,extra,base=>({kind:'scope-off',positive:{source:ageSource,expected:ageExpected,options:base}}));
// Receipt metadata binds controls to independently supplied fixture endpoints.
// It never reads a calculate result or authorizes a production transformation.
const endpointControlMetadata=(source,options,expected,kind,control=null)=>{
 const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),snapshot=value=>JSON.parse(JSON.stringify(canonical(value))),describe=(s,o,e)=>{const d={sourceSha256:digest(s),optionsSha256:digest(JSON.stringify(canonical(o))),expectedEndpointSha256:digest(e)};return {...d,scenarioSha256:digest(JSON.stringify([d.sourceSha256,d.optionsSha256,d.expectedEndpointSha256]))};},current=describe(source,options,expected),metadata={controlMetadataSchemaVersion:1,requestedOptionsSnapshot:snapshot(options),enabledBooleanOptions:Object.keys(options).filter(key=>options[key]===true).sort(),scopeContext:snapshot(Object.fromEntries(Object.entries(options).filter(([,value])=>typeof value!=='boolean'))),declaredEndpoint:current,protectedContext:false,optionGuard:false};
 if(!control){if(source!==expected&&kind==='positive'){metadata.intentSha256=current.scenarioSha256;metadata.intentPairSha256=current.scenarioSha256;}return metadata;}
 const p=control.positive;if(p.source===p.expected)return metadata;const positive=describe(p.source,p.options,p.expected),before=snapshot(p.options),after=snapshot(options),keys=[...new Set([...Object.keys(before),...Object.keys(after)])].sort(),changed=keys.filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key]));
 assert.equal(expected,source,'A declared negative retains the complete literal input');
 const relation={kind:control.kind,positive,control:current,positiveOptionsSnapshot:before};
 if(control.kind==='option-off'){assert.equal(source,p.source,'An option control uses exactly the positive source');assert.equal(changed.length,1,'Exactly one complete option changes');assert.equal(before[changed[0]],true,'The positive option is enabled');assert.equal(after[changed[0]],false,'The negative option is explicitly disabled');relation.option=changed[0];metadata.optionGuard=true;}
 else if(control.kind==='protected'){assert.deepEqual(after,before,'Protected controls retain every complete positive option');assert.equal(source,control.prefix+p.source+control.suffix,'Protected bytes enclose exactly the independent positive source');relation.prefix=control.prefix;relation.suffix=control.suffix;metadata.protectedContext=true;}
 else if(control.kind==='scope-off'){assert.equal(source,p.source,'A scope control uses the exact positive input');assert(changed.length,'A scope control has an explicit context difference');relation.changedOptions=changed;metadata.optionGuard=true;}
 else throw new Error('Unknown declared fixture control relation');
 metadata.sourceBoundControl=relation;metadata.intentSha256=positive.scenarioSha256;metadata.intentPairSha256=positive.scenarioSha256;return metadata;
};
const protectedEndpointControl=(source,positive)=>{const at=source.indexOf(positive.source);assert(at>=0&&source.indexOf(positive.source,at+positive.source.length)===-1,'One literal fixture payload defines the protected relation');return {kind:'protected',positive,prefix:source.slice(0,at),suffix:source.slice(at+positive.source.length)};};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);
 const base={...Object.fromEntries(Object.keys(api.defaults).map(k=>[k,false])),namespaceNumber:0,pageTitle:'Pessoa fictícia',contentModel:'wikitext',infoboxes:true,markup:true,syntaxRepairs:true,structuralRepairs:true,automaticBiographyFields:true,birthDates:true};
 report.bundles.push({bundle,sha256:sha(bytes),version:api.version});
 for(const f of fixtures){
  const options={...base,...f.extra},row={id:f.id,bundle,status:'passed',kind:f.source===f.expected?(f.id.startsWith('protected/')?'protected':f.id.includes('-off/')?'off':'boundary'):'positive',expectedRepair:f.source!==f.expected,sourceSha256:sha(f.source),optionsSha256:sha(JSON.stringify(canonical(options))),expectedEndpointSha256:sha(f.expected),intentSha256:sha(f.source.includes('fundo=')?'native-ignored-fundo':'native-manual-age'),enabledBooleanOptions:Object.keys(options).filter(k=>options[k]===true).sort(),scopeContext:{namespaceNumber:options.namespaceNumber,sectionOnly:!!options.sectionOnly},scenarioSha256:sha(JSON.stringify(canonical({source:f.source,options,expected:f.expected,kind:'adjust'})))};
  Object.assign(row,endpointControlMetadata(f.source,options,f.expected,row.kind,f.control?f.control(base):null));
  report.cases.push(row);
  try{const out=api.calculate({kind:'adjust',source:f.source,originalSource:f.source,options});report.checks++;assert.equal(out.text,f.expected,'The independently specified native endpoint matches');report.checks++;assert.deepEqual(out.preservation||[],[],'Source guards accept only the contracted native change');report.checks++;assert.equal(api.calculate({kind:'adjust',source:out.text,originalSource:out.text,options}).text,f.expected,'The single click reaches a stable endpoint');row.actualEndpointSha256=sha(out.text);row.appliedIds=(out.changes||[]).filter(c=>c.count>0).map(c=>c.id);}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id:f.id,message:error.message});}
 }
 report.checks++;assert.equal(sha(fs.readFileSync(file)),sha(bytes),'The actual bundle bytes remain frozen');
}
report.distinctScenarioCount=new Set(report.cases.map(r=>r.scenarioSha256)).size;
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
