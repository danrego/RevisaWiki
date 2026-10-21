'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x));if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const contractBytes=fs.readFileSync(path.join(__dirname,'citation_partial_reachability_contract.json'));assert.equal(sha(contractBytes),'627084463b654e2789f3054b274dc546b706c621f3d022a8ab67f5499bf62603','The independent primary repair contract remains pinned');
const report={kind:'fresh-source-only-citation-partial-reachability',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],proofControls:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,message){report.checks++;assert.deepEqual(a,b,message);}
for(const file of files){
 const api=require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticTopicPortals:false,automaticBiographyPortals:false,biographyPortal:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false,singleLineCitations:false,endMatter:false},runtime=fs.readFileSync(file),fixtures=[];
 report.bundles.push({bundle,sha256:sha(runtime),bytes:runtime.length});
 const add=(id,source,expected,options={})=>fixtures.push({id,source,expected,options});
 for(const family of ['Citar web','Citar jornal','Citar livro','Citar periódico','Citar revista'])for(const value of ['Valor literal','0306406153','9780306406157','030640615','ISBN 0306406153','{{Valor fictício}}','"0306406152"','0306406152 extra']){
  const source='{{'+family+'|título=Fonte literal|isbn10='+value+'|pág=2}}';add('native-page/'+sha(source).slice(0,16),source,source.replace('|pág=2','|página=2'));
 }
 for(const [name,target]of [['Cite web','Citar web'],['template:Cite news','Citar jornal'],['Cite book','Citar livro'],['Cite journal','Citar periódico'],['Cite magazine','Citar revista']]){
  const source='{{'+name+'|title=Fonte literal|isbn10=Valor literal}}',expected='{{'+target+'|title=Fonte literal|isbn10=Valor literal}}';
  add('local-header/'+name,source,expected);add('local-header/source-compatibility-off/'+name,source,expected,{automaticSourceCompatibility:false});add('local-header/names-off/'+name,source,expected,{automaticParameterNames:false});
  add('local-header/foreign-options-off/'+name,source,source,{multilingual:false});add('local-header/citations-off/'+name,source,source,{citations:false});
  add('local-header-and-page/'+name,source.slice(0,-2)+'|pág=2}}',expected.slice(0,-2)+'|página=2}}');
 }
 for(const fields of ['title=Fonte literal|isbn10=|isbn10=Valor literal','title=Fonte literal|isbn10=Valor literal|isbn10=','title=Fonte literal|isbn10=Valor literal|isbn10=Outro valor','title=|título=Fonte literal|isbn10=Valor literal','title=Fonte literal|isbn10=Valor literal|campo_fictício=Conservar']){const source='{{Cite web\n|'+fields+'}}';add('header-argument-byte-retention/'+sha(fields).slice(0,16),source,'{{Citar web\n|'+fields+'}}');}
 const page='{{Citar web|título=Fonte literal|isbn10=Valor literal|pág=2}}',pageExpected='{{Citar web|título=Fonte literal|isbn10=Valor literal|página=2}}',header='{{Cite web|title=Fonte literal|isbn10=Valor literal}}';
 for(const key of ['automaticSourceCompatibility','automaticParameterNames','citations'])add('page-off/'+key,page,page,{[key]:false});
 for(const key of ['syntaxRepairs','structuralRepairs'])add('page-source-key-policy-independent/'+key,page,pageExpected,{[key]:false});
 for(const suffix of ['|página=','|página=3','|page=','|pág=2','|pág=3'])add('page-competitor/'+sha(suffix).slice(0,12),page.slice(0,-2)+suffix+'}}',page.slice(0,-2)+suffix+'}}');
 for(const key of ['linguagem','lengua','volumenes','sítio','urlacceso','ano original','namelist-style','fecha de acceso']){
  const source=page.slice(0,-2)+'|'+key+'=Valor literal}}';add('another-unproved-role/'+key,source,source);
 }
 for(const [id,source]of [['wrong-case-page',page.replace('Citar web','Citar Web')],['unknown-native-page',page.replace('Citar web','Citar exemplo')],['unknown-local-header',header.replace('Cite web','Cite exemplo')],['wrong-case-local-header',header.replace('Cite web','Cite Web')]])add(id,source,source);
 for(const [id,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['code',s=>'<code>'+s+'</code>'],['quote',s=>'"'+s+'"'],['unknown-owner',s=>'{{Modelo fictício|texto='+s+'}}'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],['comment',s=>'<!-- '+s+' -->']])for(const [kind,source]of [['page',page],['header',header]])add('protected/'+id+'/'+kind,wrap(source),wrap(source));
 add('outside-fix-remains-independent','[[Tema fictício|Tema fictício]]\n'+page,'[[Tema fictício]]\n'+pageExpected);
 for(const fixture of fixtures){const options={...cfg,...fixture.options},row={bundle,id:fixture.id,status:'passed',sourceSha256:sha(fixture.source),optionsSha256:sha(JSON.stringify(canonical(options))),expectedEndpointSha256:sha(fixture.expected)};report.cases.push(row);try{
  const first=api.calculate({kind:'adjust',source:fixture.source,originalSource:fixture.source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});
  eq(first.text,fixture.expected,'The complete one-click action reaches the independently supplied literal endpoint');eq(second.text,fixture.expected,'No deferred activation or duplicate argument cleanup appears on a second click');eq(first.preservation||[],[],'The production preservation verdict accepts exactly the permitted repair');eq(api.preservationAudit(fixture.source,first.text,options),[],'The preservation guard accepts the independently bound endpoint');eq(api.safeComposition(fixture.source,first.text,options),'','The composition guard accepts the independently bound endpoint');
  row.actualEndpointSha256=sha(first.text);row.appliedIds=(first.changes||[]).filter(x=>x.count>0).map(x=>x.id);
 }catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id:fixture.id,message:error.message});}}
 for(const [kind,source,stage]of [['page',page,'v219-source-compatibility'],['header',header,'v219-ignored-citation-header']]){
  const plan=kind==='page'?api.v219SourceCompatibilityPlan(source,cfg):api.v219IgnoredCitationHeaderPlan(source,cfg),owner=()=>api.v219IgnoredCitationStageOwners(source,plan.edits,stage,cfg),row={bundle,id:'fresh-stale-forged/'+kind,status:'passed'};report.proofControls.push(row);try{
   eq(owner().length,1,'One exact fresh source owner is authorized');eq(api.v219StageSafeEdits(source,plan.edits,stage,cfg),plan.edits,'Only this exact fresh transaction passes its own ignored identifier owner');
   eq(api.v219IgnoredCitationStageOwners(source,plan.edits,'unrelated-stage',cfg),[],'A different stage cannot borrow the owner proof');
   eq(api.v219IgnoredCitationStageOwners(source+' ',plan.edits,stage,cfg),[],'A changed original source invalidates the exact plan');
   for(const mutate of [e=>({...e,text:e.text+'x'}),e=>({...e,proof:{...e.proof,nativeTemplateOldid:1}}),e=>({...e,proof:{...e.proof,sourceHash:'forged'}}),e=>({...e,start:e.start+1})])eq(api.v219IgnoredCitationStageOwners(source,plan.edits.map(mutate),stage,cfg),[],'Changed text, provenance, source binding or offsets cannot borrow the owner proof');
   if(kind==='page')eq(api.v219IgnoredCitationStageOwners(source,plan.edits,stage,{...cfg,automaticSourceCompatibility:false}),[],'A disabled source key repair cannot borrow an enabled plan');
  }catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id:row.id,message:error.message});}
 }
 eq(sha(fs.readFileSync(file)),sha(runtime),'The actual runtime bytes remain frozen');
}
report.actionExecutions=report.cases.length;report.directProofChecks=report.proofControls.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
