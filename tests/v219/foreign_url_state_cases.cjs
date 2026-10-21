'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const contractPath=path.join(__dirname,'foreign_url_state_contract.json'),contract=JSON.parse(fs.readFileSync(contractPath)),report={kind:'unproved-foreign-citation-state-refusal',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),contractSha256:sha(fs.readFileSync(contractPath)),bundles:[],cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0};
const eq=(a,b,m)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),m);},ok=(x,m)=>{report.checks++;assert.ok(x,m);};
function test(bundle,id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:error.message});}}
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);report.bundles.push({bundle,runtimeSha256:sha(bytes),bytes:bytes.length,runtimeVersion:api.version,helperPreview:false});assert.equal(typeof api.v219ForeignCitationStateRefusal,'function');
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false,dates:false},calc=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}}),seenKeys=new Set();let declared=0;
 for(const[name,profile]of Object.entries(api.translationRules.profiles)){
  if(profile.kind!=='citation')continue;
  for(const[key,mapped]of Object.entries(profile.fields||{})){
   if(mapped!=='urlmorta')continue;declared++;seenKeys.add(key);
   // Canonical native interfaces and proved local aliases are checked in the
   // separate native cases below. Their shared surface syntax is deliberate.
   const header='{{'+name+'}}';if(api.v219NativeCitationStateInterface(header)||api.v219LocalCitationRedirectProfile(header))continue;
   for(const value of ['yes','no','dead','live','unfit','','valor indefinido','{{Valor fictício}}'])test(bundle,'foreign-'+sha(name+'|'+key+'='+value).slice(0,20),()=>{
    const source='{{'+name+'|'+key+'='+value+'}}',refusal=api.v219ForeignCitationStateRefusal(source,profile);ok(refusal&&refusal.blocked&&refusal.quietNativeRefusal,'No enum equivalence is invented from a catalog field declaration');eq(refusal.text,source,'The entire foreign call is retained including blank/dynamic values');eq(refusal.proof.disabledForeignStateReason,'unproved-source-state-semantics','The refusal has a bounded explicit source-contract reason');eq(refusal.issues,[],'No advisory alert is created');
    const migrated=api.migrateForeignTemplate(source,cfg);if(migrated){ok(migrated.blocked,'The complete migration does not activate an unproved foreign state');eq(migrated.text,source,'The actual adapter preserves the whole call');}
    const result=calc(source);eq(result.text,source,'The actual action also preserves the source');eq(calc(result.text).text,result.text,'The refusal is stable');eq(result.warnings,[],'No new review alert is emitted for an intentional boundary');
   });
  }
 }
 eq([...seenKeys].sort(),[...contract.declaredSourceKeys].sort(),'All declared foreign state key spellings are reviewed');eq(declared,contract.declaredBindingCount,'The current declared catalog is exactly bound');
 for(const [header,key,title,date]of [['plantilla:Cita web','urlmuerta','título','fecha'],['Vorlage:Internetquelle','offline','titel','datum'],['шаблон:Книга','deadlink','название','год']])for(const status of ['yes','no','','{{Valor fictício}}'])for(const extra of [{},{multilingual:false},{automaticParameterNames:false}])test(bundle,'default-options-protected-call-'+sha(header+key+status+JSON.stringify(extra)).slice(0,20),()=>{
  const call='{{'+header+'|'+title+'=Fonte fictícia|'+date+'=5 de março de 2001|'+key+'='+status+'|pág=12}}',source=call+'\n\nTexto sobre [[Brasil|Brasil]].',expected=call+'\n\nTexto sobre [[Brasil]].',result=calc(source,{dates:true,...extra});eq(result.text,expected,'An unproved foreign state keeps the entire call opaque while an independent outside repair remains reachable');eq(result.warnings,[],'The intentional refusal does not add an alert');eq(calc(result.text,{dates:true,...extra}).text,result.text,'Opaque foreign source stays stable with ordinary date and key rules enabled');
 });
 const localTitles=['Citar web','Citar jornal','Citar livro','Citar periódico','Citar revista','Citation'];
 for(const title of localTitles)for(const prefix of ['', 'Template:', 'Predefinição:'])for(const fields of ['urlmorta=no','li=no|urlmorta=sim','url-status=yes','deadurl=live','urlmorta=','urlmorta=unfit'])test(bundle,'native-interface-'+sha(prefix+title+fields).slice(0,20),()=>{
  const source='{{'+prefix+title+'|título=Fonte fictícia|'+fields+'}}';ok(api.v219NativeCitationStateInterface(source),'The native prefix is part of the same exact proved template interface');
  const beforeState=fields.split('|');eq(api.v219ForeignCitationStateRefusal(source,{kind:'citation',source:{language:'mixed'},fields:{}}),null,'The foreign guard does not capture an already native call');
  const result=calc(source);for(const field of beforeState)ok(result.text.includes('|'+field),'The original native state key/value association remains intact');eq(calc(result.text).text,result.text,'Native generic/header routing remains stable');
 });
 for(const[source,expected]of [['{{Lien web|titre=Fonte fictícia}}','{{Citar web|título=Fonte fictícia}}'],['{{Kilde nyheder|title=Fonte fictícia}}','{{Citar jornal|título=Fonte fictícia}}']])test(bundle,'independent-foreign-repair-'+sha(source).slice(0,20),()=>{eq(calc(source).text,expected,'A source-proved unrelated translation remains automatic');});
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
