'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(file=>path.join(root,'dist/2.19.0',file)));
const contract=JSON.parse(fs.readFileSync(path.join(__dirname,'native_citation_alias_roles.json'))),report={kind:'complete-native-CS1-alias-role-collisions',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),contractSha256:sha(fs.readFileSync(path.join(__dirname,'native_citation_alias_roles.json'))),sourceOldid:contract.sourceOldid,roleFamilies:contract.roleCount,aliasDeclarations:contract.aliasDeclarations,bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,message)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),message);},ok=(x,message)=>{report.checks++;assert.ok(x,message);};
function test(bundle,id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:error.message});}}
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);report.bundles.push({bundle,runtimeSha256:sha(bytes),bytes:bytes.length,helperPreview:false});
 for(const name of ['v219NativeCitationRoles','v219ForeignCitationRoleCollision'])eq(typeof api[name],'function','The actual production bundle exports '+name);
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false,registryDoiCheck:false},calculate=source=>api.calculate({kind:'adjust',source,options:cfg});
 const raw='{{Cite web|entrada-a=Primeiro valor|entrada-b=Segundo valor}}',profile={kind:'citation',target:'Citar web',source:{language:'mixed',title:'Citar web'}};
 for(const [role,declared]of Object.entries(contract.roles)){
  const aliases=[...new Set(declared)],numbered=aliases.some(alias=>alias.includes('#'));
  for(const number of numbered?['','1','2','5','99','100']:[''])for(const alias of aliases)test(bundle,'role-'+sha(role+'\0'+alias+'\0'+number).slice(0,20),()=>{
   const key=alias.replace('#',number),expected=role+(numbered?':'+(number||'1'):'');
   ok(api.v219NativeCitationRoles(key).includes(expected),'Every exact primary native alias reaches its complete declared role');
   const first=aliases[0].replace('#',number),fields=[{index:1,key:first,value:'Primeiro valor'},{index:2,key,value:'Segundo valor'}],collision=api.v219ForeignCitationRoleCollision(raw,profile,'Citar web',fields);
   ok(collision,'Two source fields mapped to one native role cannot silently select a winner');
   ok(collision.nativeConfigurationOldid===73016847,'The refusal is tied to the exact native primary configuration');
   for(const values of [['',''],['Valor literal',''],['Valor literal','Valor literal']])ok(api.v219ForeignCitationRoleCollision(raw,profile,'Citar web',fields.map((field,index)=>({...field,value:values[index]}))),'Blank and identical alias values remain competing declarations');
  });
  if(numbered)for(const alias of aliases)test(bundle,'distinct-number-'+sha(role+alias).slice(0,20),()=>{
   const fields=[{index:1,key:alias.replace('#','1'),value:'Primeiro valor'},{index:2,key:alias.replace('#','2'),value:'Segundo valor'}];
   eq(api.v219ForeignCitationRoleCollision(raw,profile,'Citar web',fields),null,'Separate numbered people retain separate native roles');
  });
 }
 for(const [first,second]of [['title','author'],['first1','last1'],['last1','last2'],['website','publisher'],['url','archive-url'],['doi','isbn'],['page','pages']])test(bundle,'distinct-roles-'+first+'-'+second,()=>{
  eq(api.v219ForeignCitationRoleCollision(raw,profile,'Citar web',[{index:1,key:first,value:'Primeiro valor'},{index:2,key:second,value:'Segundo valor'}]),null,'Distinct primary native roles do not trigger a collision');
 });
 for(const key of ['website2','first0','first01','first-1','Last1','TITLE','doi2','primeiroX','editor01-last','author2-unknown','nome#'])test(bundle,'unproved-key-'+key,()=>eq(api.v219NativeCitationRoles(key),[],'Unknown spelling and numbering gain no invented native role'));
 for(const fields of [
  'sitio web=Primeiro valor|website=Segundo valor','sitioweb=Primeiro valor|website=',
  'sítio=Mesmo valor|website=Mesmo valor'
 ])test(bundle,'foreign-periodical-'+sha(fields).slice(0,16),()=>{
  const source='{{шаблон:Cite journal|'+fields+'}}',result=calculate(source);
  eq(result.text,source,'The complete foreign article action preserves competing Periodical values and blank overrides');
  eq(calculate(result.text).text,result.text,'The quiet whole-call refusal is stable');
  ok(!result.changes.length,'No discarded or blocked value is counted as an applied correction');
  eq(result.warnings,[],'The conservative whole-call refusal creates no boilerplate warning');
  eq(api.v217VisibleReviewPlan(result,cfg).findingEntries,0,'The unresolved unproved migration does not add a generic review alert');
 });
 for(const source of [
  '{{Citar web|title=Primeiro valor|título=Segundo valor}}',
  '{{Citar web|title=Primeiro valor|título=}}',
  '{{Citar web|website=Primeiro valor|periódico=Segundo valor}}',
  '{{Citar web|last=Primeiro valor|author=Segundo valor}}'
 ])test(bundle,'native-existing-conflict-'+sha(source).slice(0,16),()=>eq(calculate(source).text,source,'Existing accepted native aliases and their precedence remain intact'));
 test(bundle,'native-identical-accepted-aliases',()=>eq(calculate('{{Citar web|title=Mesmo valor|título=Mesmo valor}}').text,'{{Citar web|title=Mesmo valor}}','Existing native aliases with exactly identical values may use the already reviewed same-value duplicate cleanup'));
 for(const source of [
  '{{skabelon:Cite news|title=Fonte fictícia|url=https://example.org/fonte}}',
  '{{Cite web|title=Fonte fictícia|last1=Primeiro nome|last2=Segundo nome}}'
 ])test(bundle,'full-distinct-roles-'+sha(source).slice(0,16),()=>{
  const first=calculate(source),second=calculate(first.text);ok(first.text!==source,'Independent source roles can still migrate automatically');eq(second.text,first.text,'The distinct-role migration finishes in one action');eq(api.preservationAudit(source,first.text,cfg),[],'The complete independent metadata inventory remains intact');
 });
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
