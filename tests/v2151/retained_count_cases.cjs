'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),Module=require('node:module');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),isolated=process.argv.includes('--isolated'),args=process.argv.slice(2).filter(value=>value!=='--isolated');
const files=args.length?args:process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:['RevisaWiki_v2_15_1.js','RevisaWiki_v2_15_1_completo.js'].map(file=>path.join(root,'dist/2.15.1',file));
const report={version:'2.15.1',kind:'exact-retained-operation-count',status:'passed',isolated,runtimeInjection:[],cases:0,checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
function eq(actual,expected,message){report.checks++;assert.deepEqual(actual,expected,message);}
function ok(value,message){report.checks++;assert(value,message);}
function test(bundle,id,run){report.cases++;try{run();}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}}
function load(file){
 let source=fs.readFileSync(file,'utf8'),added='';
 for(const [marker,name]of [['function v2151InfoboxOrderPlan(','infobox_order'],['function v2151BiographyLeadPlan(','biography_lead'],['function v2151FieldSyntaxPlan(','field_syntax'],['function v2151BiographyImageAltPlan(','image_alt'],['function v2151RetainedCount(','retained_count'],['function v2151LeadProofTuple(','safeguards']]){
  if(source.includes(marker))continue;assert(isolated,'The final distribution must include '+name);added+=fs.readFileSync(path.join(root,'src/v2_15_1/'+name+'.js'),'utf8')+'\n';
 }
 if(added){source=source.replace('    const api = {',added+'\n    const api = {v2151RetainedContext,v2151RetainedProjection,v2151RetainedFeatures,v2151RetainedCount,');report.runtimeInjection.push(path.basename(file));}
 const compiled=new Module(path.resolve(file),module);compiled.filename=path.resolve(file);compiled.paths=module.paths;compiled._compile(source,compiled.filename);return compiled.exports;
}
for(const file of files){
 const api=load(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de exemplo',contentModel:'wikitext'},name="'''Pessoa de exemplo'''",lead=name+' é uma escritora.',plain='Pessoa de exemplo é uma escritora.',
  tail='\n\n== Biografia ==\nTexto.\n{{Referências}}',box=fields=>'{{Info/Biografia|nome=Pessoa de exemplo'+fields+'}}',ref='<ref>Fonte específica.</ref>',born='{{Dni|2|3|1930|si}}',dob='{{DataExt|2|3|1930}}',place='[[Cidade de exemplo]]';
 report.bundles.push({name:bundle,sha256:sha(fs.readFileSync(file))});
 function prove(before,after,count,options=cfg){
  const result=api.v2151RetainedCount(before,after,['código'],[],options);ok(result,'An exact new-feature count is available');
  eq(result.count,count,'Every retained logical operation is counted once');eq(result.exact,true,'The display count is exact');eq(result.events.length,count,'Every displayed adjustment has a concrete event');
  eq(result.unresolvedFragments,0,'There are no uncertain fragments');eq(result.sourceHash,api.syntaxHash?api.syntaxHash(before):result.sourceHash,'The result is bound to its source');
  eq(new Set(result.events.map(event=>event.id)).size,count,'Event identifiers are unique across rounds and composed operations');
  for(const event of result.events){ok(event.sourceAnchors.length&&event.outputAnchors.length,'Event anchors are explicit');if(event.coordinateSpace==='logical-plan-step'){
   ok(event.witness?.proof&&Number.isInteger(event.witness.operation),'A source-plan witness supports every new event');eq(event.fragments[0].before,event.before,'The fragment is the literal planned replacement');
  }}
  eq(api.v2151RetainedCount(after,after,['código'],[],options),null,'No new event is counted after the endpoint is unchanged');
 }
 test(bundle,'one missing initial bold is one operation',()=>prove(plain+tail,lead+tail,1));
 test(bundle,'a self link and missing bold are separate operations',()=>prove('[[Pessoa de exemplo]] é uma escritora.'+tail,lead+tail,2));
 test(bundle,'a pre-existing bold self link needs only one operation',()=>prove("'''[[Pessoa de exemplo]]''' é uma escritora."+tail,lead+tail,1));
 test(bundle,'a literal infobox movement is one operation',()=>prove(lead+'\n'+box('')+tail,box('')+'\n'+lead+tail,1));
 test(bundle,'movement and indentation are separate operations',()=>prove(lead+'\n  '+box('')+tail,box('')+'\n'+lead+tail,2));
 test(bundle,'a missing date is one operation',()=>{
  const fields='|nascimento_data='+born+ref;prove(box(fields)+'\n'+lead+tail,box(fields)+'\n'+name+' ('+dob+ref+') é uma escritora.'+tail,1);
 });
 test(bundle,'a birth place and birth date are separate operations',()=>{
  const fields='|nascimento_data='+born+ref+'|nascimento_local='+place+ref;prove(box(fields)+'\n'+lead+tail,box(fields)+'\n'+name+' ('+place+ref+', '+dob+ref+') é uma escritora.'+tail,2);
 });
 test(bundle,'the approved full birth triplet inside Morte is one age operation',()=>{
  const fields='|nascimento_data='+born+ref+'|morte_data={{Morte|5|6|2010}}'+ref,expectedFields=fields.replace('{{Morte|5|6|2010}}','{{Morte|5|6|2010|2|3|1930}}'),
   opening=name+' foi uma escritora.',after=name+' ('+dob+ref+' – {{DataExt|5|6|2010}}'+ref+') foi uma escritora.';
  prove(box(fields)+'\n'+opening+tail,box(expectedFields)+'\n'+after+tail,3);
 });
 test(bundle,'identity movement date and place remain distinct in one combined result',()=>{
  const fields='|nascimento_data='+born+ref+'|nascimento_local='+place+ref;prove(plain+'\n'+box(fields)+tail,box(fields)+'\n'+name+' ('+place+ref+', '+dob+ref+') é uma escritora.'+tail,4);
 });
 test(bundle,'a full-width equals and invisible key are separate corrections',()=>{
  const before=box('|ocupa\u200Bção＝escritora')+'\n'+lead+tail,after=box('|ocupação=escritora')+'\n'+lead+tail;prove(before,after,2);
 });
 test(bundle,'an exact filename ALT size and caption extraction counts four fields',()=>{
  const before=box('|imagem=[[Ficheiro:Retrato.svg|thumb|200px|alt=Retrato de exemplo|Uma legenda.]]')+'\n'+lead+tail,
   after=box('|imagem=Retrato.svg|alt=Retrato de exemplo|imagem_tamanho=200px|imagem_legenda=Uma legenda.')+'\n'+lead+tail;
  prove(before,after,4);
 });
 test(bundle,'title inference is bounded by the literal first opening',()=>prove(plain+tail,lead+tail,1,{}));
 test(bundle,'a disabled feature is not credited by the new counter',()=>{
  eq(api.v2151RetainedCount(plain+tail,lead+tail,[],[],{...cfg,automaticBiographyLead:false}),null,'Disabled formatting never supplies an approved plan');
 });
 test(bundle,'a reverted new bold is not credited',()=>{
  const fields='|nascimento_data='+born+ref,before=box(fields)+'\n'+plain+tail,after=box(fields)+'\nPessoa de exemplo ('+dob+ref+') é uma escritora.'+tail;
  eq(api.v2151RetainedCount(before,after,[],[],cfg),null,'An output that still needs the missing approved operation has no exact new count');
 });
 test(bundle,'a copied date that was changed is not credited',()=>{
  const fields='|nascimento_data='+born+ref,before=box(fields)+'\n'+lead+tail,after=box(fields)+'\n'+name+' ({{DataExt|3|3|1930}}'+ref+') é uma escritora.'+tail;
  eq(api.v2151RetainedCount(before,after,[],[],cfg),null,'A different copied value cannot reuse a retained source-plan count');
 });
 test(bundle,'a removed copied place is not credited',()=>{
  const fields='|nascimento_data='+born+ref+'|nascimento_local='+place+ref,before=box(fields)+'\n'+lead+tail,after=box(fields)+'\n'+name+' ('+dob+ref+') é uma escritora.'+tail;
  eq(api.v2151RetainedCount(before,after,[],[],cfg),null,'A partially retained completion does not overstate its original fact count');
 });
 test(bundle,'a copied source call cannot be swapped while retaining its adjustment count',()=>{
  const fields='|nascimento_data='+born+'<ref name="data">Fonte da data.</ref>|nascimento_local='+place+'<ref name="local">Fonte do local.</ref>',
   before=box(fields)+'\n'+lead+tail,after=box(fields)+'\n'+name+' ('+place+'<ref name="local" />, '+dob+'<ref name="local" />) é uma escritora.'+tail;
  eq(api.v2151RetainedCount(before,after,[],[],cfg),null,'The displayed count does not credit a different fact/reference binding');
 });
 test(bundle,'an incomplete image extraction is not credited',()=>{
  const before=box('|imagem=[[Ficheiro:Retrato.svg|alt=Retrato de exemplo|Legenda.]]')+'\n'+lead+tail,after=box('|imagem=Retrato.svg|imagem_legenda=Legenda.')+'\n'+lead+tail;
  eq(api.v2151RetainedCount(before,after,[],[],cfg),null,'A discarded ALT value never receives the full extraction count');
 });
 test(bundle,'an unrelated output without any approved source rule uses the old counter only',()=>{
  eq(api.v2151RetainedCount(lead+tail,lead.replace('escritora','editora')+tail,[],[],cfg),null,'The new rules do not claim unrelated manual prose');
 });
 test(bundle,'legacy reference layout changes are counted after the exact new endpoint',()=>{
  const before=plain+'<ref name=x>Fonte.</ref>'+tail,projected=lead+'<ref name=x>Fonte.</ref>'+tail,after=lead+'<ref name="x">Fonte.</ref>'+tail,
   legacy=api.v211RetainedAdjustments(projected,after,[],{...cfg,v2151RetainedCountSkip:true});
  ok(legacy.exact,'The isolated old reference syntax has an exact retained count');prove(before,after,legacy.count+1);
 });
 for(const [original,prepared,count]of [
  ['{{Infobox person|name=Pessoa de exemplo|birth_date={{Birth date|1930|3|2}}'+ref+'}}',box('|nascimento_data='+born+ref),3],
  [box('|birth_date='+born+ref),box('|nascimento_data='+born+ref),2],
  [box('|nascimento_data={{Birth date and age|1930|3|2}}'+ref),box('|nascimento_data={{Dni|2|3|1930}}'+ref),2]
 ])test(bundle,'preparation and newly enabled date have separate retained operations '+sha(original).slice(0,12),()=>{
  prove(original+'\n'+lead+tail,prepared+'\n'+name+' ('+dob+ref+') é uma escritora.'+tail,count);
 });
 test(bundle,'a modified imported fact cannot retain a preparation count',()=>{
  const before='{{Infobox person|name=Pessoa de exemplo|birth_date={{Birth date|1930|3|2}}'+ref+'}}\n'+lead+tail,
   after=box('|nascimento_data='+born+ref)+'\n'+name+' ({{DataExt|3|3|1930}}'+ref+') é uma escritora.'+tail;
  eq(api.v2151RetainedCount(before,after,[],[],cfg),null,'A prepared source does not authorize a different generated date');
 });
 for(const options of [{namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true},{section:0},{discussionPage:true},{contentModel:'javascript'},{pageTitle:''}])test(bundle,'unapproved count scope '+JSON.stringify(options),()=>{
  eq(api.v2151RetainedCount(plain+tail,lead+tail,[],[],{...cfg,...options}),null,'The counter respects the same source-edit scope as its rules');
 });
}
if(process.env.REVISAWIKI_REPORT){fs.mkdirSync(path.dirname(process.env.REVISAWIKI_REPORT),{recursive:true});fs.writeFileSync(process.env.REVISAWIKI_REPORT,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
