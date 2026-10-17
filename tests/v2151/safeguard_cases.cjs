'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),Module=require('node:module');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),isolated=process.argv.includes('--isolated'),args=process.argv.slice(2).filter(value=>value!=='--isolated');
const files=args.length?args:process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:['RevisaWiki_v2_15_1.js','RevisaWiki_v2_15_1_completo.js'].map(file=>path.join(root,'dist/2.15.1',file));
const report={version:'2.15.1',kind:'opening-source-binding',status:'passed',isolated,runtimeInjection:[],cases:0,checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
function eq(actual,expected,message){report.checks++;assert.deepEqual(actual,expected,message);}
function ok(value,message){report.checks++;assert(value,message);}
function test(bundle,id,run){report.cases++;try{run();}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}}
function load(file){
 let source=fs.readFileSync(file,'utf8');
 if(!source.includes('function v2151LeadProofTuple(')){
  assert(isolated,'The final distribution must include the actual per-fact source binding');
  source=source.replace('    const api = {',fs.readFileSync(path.join(root,'src/v2_15_1/retained_count.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/v2_15_1/safeguards.js'),'utf8')+
   '\n    const api = {v2151LeadPunctuationCanonical,v2151LeadProofTuple,v2151LeadReferenceBindings,v2151LeadTupleBinding,v2151LeadObjectProof,');report.runtimeInjection.push(path.basename(file));
 }
 const compiled=new Module(path.resolve(file),module);compiled.filename=path.resolve(file);compiled.paths=module.paths;compiled._compile(source,compiled.filename);return compiled.exports;
}
for(const file of files){
 const api=load(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de controle',minorBaseConfirmed:true},name="'''Pessoa de controle'''",ref=(id,body)=>'<ref name="'+id+'">'+body+'</ref>',call=id=>'<ref name="'+id+'" />',
  fields='|nascimento_data={{Dni|2|3|1930|si}}'+ref('data-nascimento','Data exata.')+'|nascimento_local=[[Cidade de controle]]'+ref('local-nascimento','Local exato.')+
   '|morte_data={{Morte|5|6|2010}}'+ref('data-morte','Data final exata.')+'|morte_local=[[Outra cidade]]'+ref('local-morte','Local final exato.'),
  box='{{Info/Biografia|nome=Pessoa de controle'+fields+'}}',tail='\n\n{{Referências}}',source=box+'\n'+name+' foi uma escritora.'+tail,
  opening=name+' ([[Cidade de controle]]'+call('local-nascimento')+', {{DataExt|2|3|1930}}'+call('data-nascimento')+' – [[Outra cidade]]'+call('local-morte')+', {{DataExt|5|6|2010}}'+call('data-morte')+') foi uma escritora.',
  expected=box+'\n'+opening+tail,plan=api.v25ApprovedSyntaxPlan(source,cfg);
 report.bundles.push({name:bundle,sha256:sha(fs.readFileSync(file))});
 function direct(actual,wanted=true){eq(api.v2151LeadObjectProof(plan,expected,actual).accepted,wanted,'The exact value and its reference association survive together');}
 test(bundle,'the generated four-fact tuple keeps its original source bindings',()=>direct(expected));
 test(bundle,'approved comma placement is equivalent for date and place binding',()=>{
  const actual=expected.replace(call('local-nascimento')+',',','+call('local-nascimento')).replace(call('local-morte')+',',','+call('local-morte'));
  direct(actual);const tuple=api.v2151LeadOpening(actual,cfg).tuple.raw;ok(api.v2151LeadProofTuple(tuple,actual,cfg),'The proof reader accepts the exact normal reference punctuation');
 });
 const mutants=[
  ['changed generated birth date',opening.replace('{{DataExt|2|3|1930}}','{{DataExt|3|3|1930}}')],
  ['changed generated birth place',opening.replace('[[Cidade de controle]]','[[Lugar diferente]]')],
  ['changed generated death date',opening.replace('{{DataExt|5|6|2010}}','{{DataExt|6|6|2010}}')],
  ['changed generated death place',opening.replace('[[Outra cidade]]','[[Lugar diferente]]')],
  ['birth date uses birth place reference',opening.replace(call('data-nascimento'),call('local-nascimento'))],
  ['birth place uses birth date reference',opening.replace(call('local-nascimento'),call('data-nascimento'))],
  ['death date uses death place reference',opening.replace(call('data-morte'),call('local-morte'))],
  ['death place uses death date reference',opening.replace(call('local-morte'),call('data-morte'))],
  ['birth and death references are exchanged',opening.replace(call('data-nascimento'),'@@TEMP@@').replace(call('data-morte'),call('data-nascimento')).replace('@@TEMP@@',call('data-morte'))],
  ['date reference is removed',opening.replace(call('data-nascimento'),'')],
  ['place reference is removed',opening.replace(call('local-nascimento'),'')],
  ['death reference is unresolved',opening.replace(call('data-morte'),call('unknown'))],
  ['reference group changes',opening.replace(call('data-morte'),'<ref name="data-morte" group="outra" />')]
 ];
 for(const [id,text]of mutants)test(bundle,id,()=>direct(box+'\n'+text+tail,false));
 test(bundle,'a changed referenced definition cannot reuse the same name',()=>direct(expected.replace('Data exata.','Fonte diferente.'),false));
 test(bundle,'an undefined source call is not an accepted fact binding',()=>{
  const bindings=api.v2151LeadReferenceBindings(call('ausente'),expected,cfg);eq(bindings,null,'The name must resolve to one explicit local definition');
 });
 test(bundle,'a duplicate name with different bodies is not accepted',()=>{
  eq(api.v2151LeadReferenceBindings(call('data-nascimento'),expected+'\n'+ref('data-nascimento','Outro corpo.'),cfg),null,'Conflicting definitions cannot support a copied fact');
 });
 for(const ids of [['a'],['a','b'],['a','b','c']])test(bundle,'adjacent reference run punctuation '+ids.length,()=>{
  const calls=ids.map(call).join(''),before='[[Cidade]],'+calls+' {{DataExt|2|3|1930}}',after='[[Cidade]]'+calls+', {{DataExt|2|3|1930}}';
  eq(api.v2151LeadPunctuationCanonical(before),after,'Only the comma crosses the complete adjacent reference run');
  eq(api.v2151LeadPunctuationCanonical(after),after,'The canonical reference attachment is idempotent');
 });
 test(bundle,'commas inside a reference body stay literal',()=>{
  const value='[[Cidade]]'+ref('local','Fonte, com uma vírgula.')+', {{DataExt|2|3|1930}}';eq(api.v2151LeadPunctuationCanonical(value),value,'Reference content is never punctuation-rewritten by the proof reader');
 });
 test(bundle,'the full ordinary pipeline accepts the reference punctuation it generates',()=>{
  const result=api.calculate({kind:'adjust',source,options:cfg});ok(result.text!==source,'The default pipeline actually performs the four-fact completion');
  eq(result.preservation,[],'The generated result passes preservation');eq(api.safeComposition(source,result.text,cfg),'','The complete generated result passes selection safety');
  const actualOpening=api.v2151LeadOpening(result.text,cfg);ok(actualOpening?.tuple,'The emitted output has its complete birth/death tuple');
  eq(api.v2151LeadObjectProof(plan,expected,result.text).accepted,true,'Direct source binding accepts the real pipeline output');
  eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'The actual full pipeline is idempotent');
  const retained=api.v211RetainedAdjustments(source,result.text,[],cfg);eq(retained.exact,true,'The final count is exact after normal punctuation');
  eq(retained.count,result.changes.reduce((sum,change)=>sum+change.count,0),'The displayed count equals all completed atomic operations');
  const cut=result.text.indexOf(name),prefix=result.text.slice(0,cut),lead=result.text.slice(cut);
  for(const [id,altered]of [['wrong generated date',lead.replace('{{DataExt|2|3|1930}}','{{DataExt|3|3|1930}}')],
   ['wrong generated place',lead.replace('[[Cidade de controle]]','[[Lugar diferente]]')],
   ['birth reference swap',lead.replace(call('data-nascimento'),call('local-nascimento'))],
   ['death reference swap',lead.replace(call('data-morte'),call('local-morte'))]]){
    ok(api.safeComposition(source,prefix+altered,cfg),'The full gate rejects '+id);
    ok(api.preservationAudit(source,prefix+altered,cfg).length,'The preservation check rejects '+id);
   }
 });
 for(const original of ['{{Infobox person|name=Pessoa de controle|birth_date={{Birth date|1930|3|2}}'+ref('data-nascimento','Data exata.')+'|birth_place=[[Cidade de controle]]'+ref('local-nascimento','Local exato.')+'}}',
  '{{Info/Biografia|nome=Pessoa de controle|birth_date={{Birth date and age|1930|3|2}}'+ref('data-nascimento','Data exata.')+'|nascimento_local=[[Cidade de controle]]'+ref('local-nascimento','Local exato.')+'}}'])test(bundle,'one-click prepared facts keep their original references '+sha(original).slice(0,12),()=>{
  const before=original+'\n'+name+' é uma escritora.'+tail,options={...cfg,portals:false},result=api.calculate({kind:'adjust',source:before,options});
  ok(result.text.includes('{{DataExt|2|3|1930}}'+call('data-nascimento')),'The same click adds the exact normalized date with its original source');
  ok(result.text.includes('[[Cidade de controle]],'+call('local-nascimento')),'The place keeps its separate source through punctuation normalization');
  eq((result.text.match(/<ref name="data-nascimento">/g)||[]).length,1,'The original named date definition remains exactly once');
  eq((result.text.match(/<ref name="local-nascimento">/g)||[]).length,1,'The original named place definition remains exactly once');
  eq(result.preservation,[],'Prepared original facts pass the complete preservation gate');
  eq(api.safeComposition(before,result.text,options),'','The complete source-bound transaction is approved');
  eq(api.calculate({kind:'adjust',source:result.text,options}).text,result.text,'Migration and enabled facts reach their endpoint in one click');
  eq(result.minorCheck.eligible,false,'The confirmed source revision cannot mark copied facts as a minor edit');
  ok(api.summaryTopics(before,result.text,[]).includes('identificação inicial'),'The summary names the retained opening change after an approved import');
  const withoutFacts=api.calculate({kind:'adjust',source:before,options:{...options,automaticBiographyLead:false}});
  eq(api.summaryTopics(before,withoutFacts.text,[]).includes('identificação inicial'),false,'A disabled opening group does not claim the potential copied fact');
  ok(!api.v2151MechanicalPresentation(before,options).includes('{{DataExt|2|3|1930}}'),'The mechanical projection excludes generated biographical facts');
  const cut=result.text.indexOf(name),prefix=result.text.slice(0,cut),opening=result.text.slice(cut),swapped=prefix+opening.replace(call('data-nascimento'),call('local-nascimento'));
  ok(api.safeComposition(before,swapped,options),'An imported fact cannot exchange its valid named reference for another source');
  ok(api.preservationAudit(before,swapped,options).length,'The preservation check also rejects the prepared source swap');
 });
 for(const [id,fields,originalOpening,retainedKeys]of [
  ['empty native birth date','nome=Pessoa de controle|birth_date={{Birth date|1930|3|2}}'+ref('data','Data exata.')+'|nascimento_data=',name+' é uma escritora.',['|birth_date=','|nascimento_data=']],
  ['empty native header','nome=|name=Pessoa de controle|nascimento_data={{Dni|2|3|1930|si}}'+ref('data','Data exata.'),name+' é uma escritora.',['|nome=','|name=']],
  ['empty native birthplace','nome=Pessoa de controle|nascimento_local=|birth_place=[[Cidade de controle]]'+ref('local','Local exato.'),name+' ({{Dni|2|3|1930|si}}) é uma escritora.',['|nascimento_local=','|birth_place=']],
  ['same explicit birth aliases','nome=Pessoa de controle|birth_date={{Dni|2|3|1930|si}}'+ref('data','Data exata.')+'|nascimento_data={{Dni|2|3|1930|si}}'+ref('data','Data exata.'),name+' é uma escritora.',['|birth_date=','|nascimento_data=']]
 ])test(bundle,'native source precedence remains blocked through ordinary cleanup '+id,()=>{
  const raw='{{Info/Biografia|'+fields+'}}',before=raw+'\n'+originalOpening+tail,options={...cfg,portals:false},result=api.calculate({kind:'adjust',source:before,options});
  eq(api.v2151NativeBiographySourceConflict(raw),true,'The pure native guard confirms the original alias collision');
  const opening=api.v2151LeadOpening(result.text,options);ok(opening,'The unchanged subject remains readable');
  eq(opening.tuple?.raw||null,api.v2151LeadOpening(before,options).tuple?.raw||null,'No hidden native fact is promoted into the opening');
  for(const key of retainedKeys)ok(result.text.includes(key),'The original native/imported role key stays explicit: '+key);
  eq(api.calculate({kind:'adjust',source:result.text,options}).text,result.text,'A later click cannot wash away the source conflict');
  eq(result.preservation,[],'Conservative native alias refusal preserves the complete source');
 });
}
if(process.env.REVISAWIKI_REPORT){fs.mkdirSync(path.dirname(process.env.REVISAWIKI_REPORT),{recursive:true});fs.writeFileSync(process.env.REVISAWIKI_REPORT,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
