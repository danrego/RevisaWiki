'use strict';
// Exact fictional endpoints and adversarial inputs exercise the delivered files.
// The production program is not injected, patched or given a network service.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:['RevisaWiki_v2_16_0.js','RevisaWiki_v2_16_0_completo.js'].map(name=>path.join(root,'dist/2.16.0',name));
const report={version:'2.16.0',kind:'independent-biography-boundaries',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),cases:0,checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0,runtimeInjection:[]};
const eq=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);},ok=(value,message)=>{report.checks++;assert(value,message);};
global.fetch=()=>{report.networkRequests++;throw Error('Network unavailable in the independent local test');};
global.XMLHttpRequest=class{constructor(){report.networkRequests++;throw Error('Network unavailable in the independent local test');}};
const outputs=new Map();
function test(bundle,id,run){report.cases++;try{run();}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}}
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file),title='Pessoa de controle',name="'''"+title+"'''",intro='\n'+name+' é uma escritora.',birth='{{DataExt|1|2|1980}}',place='[[Cidade de controle]]';
 report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(file))});eq(api.version,'2.16.0','The actual release reports the correct version');
 const cfg={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:title,contentModel:'wikitext',infoboxes:true,markup:true,structuralRepairs:true,syntaxRepairs:true,birthDates:true,automaticBiographyFields:true};
 const box=fields=>'{{Info/Biografia|nome='+title+fields+'}}',ref=(id,text)=>'<ref name="'+id+'">'+text+'</ref>',call=id=>'<ref name="'+id+'" />',dref=ref('data','Fonte da data.'),pref=ref('local','Fonte do local.');
 const planned=(id,reader,proof,source,expected,options={})=>test(bundle,id,()=>{
  const settings={...cfg,...options},plan=api[reader](source,settings);
  eq(plan.text,expected,'The independently written full source endpoint is exact');eq(api[reader](expected,settings).text,expected,'The isolated operation reaches a fixed point');
  eq(api[proof](source,expected,plan,settings),true,'The fresh source-bound witness proves the exact endpoint');
  if(source!==expected){eq(api[proof](source+' ',expected,plan,settings),false,'A witness from another source cannot be reused');eq(api[proof](source,expected+' ',plan,settings),false,'A changed result cannot borrow a proof');eq(api[proof](source,expected,{...plan,edits:[]},settings),false,'An erased edit witness cannot authorize the change');}
  const key=sha(reader+'\0'+source+'\0'+JSON.stringify(options));if(outputs.has(key))eq(sha(expected),outputs.get(key),'The modular and complete files return the same result');else outputs.set(key,sha(expected));
 });
 const field=(id,before,after,options={})=>planned(id,'v216FieldValuePlan','v216FieldValueProof',before,after,options);
 const transfer=(id,before,after,options={})=>planned(id,'v216TransferPlan','v216TransferProof',before,after,options);
 const sourced=name+' ('+place+pref+', '+birth+dref+') é uma escritora.';
 const empty=box('')+'\n'+sourced,filled=box('|nascimento_data='+birth+call('data')+'|local_nascimento='+place+call('local'))+'\n'+sourced;
 transfer('two separately sourced lead facts fill two genuinely absent native slots',empty,filled);
 for(const [id,source,options]of [
  ['unsourced tuple',box('')+'\n'+name+' ('+place+', '+birth+') é uma escritora.',{}],
  ['explicit empty native date remains an editorial choice',box('|nascimento_data=')+'\n'+name+' ('+birth+dref+') é uma escritora.',{}],
  ['conflicting native date',box('|nascimento_data={{DataExt|2|2|1980}}')+'\n'+sourced,{}],
  ['different native person',empty.replace('|nome='+title,'|nome=Outra pessoa'),{}],
  ['missing local named definition',box('')+'\n'+name+' ('+birth+call('ausente')+') é uma escritora.',{}],
  ['conflicting named source bodies',empty+'\n'+ref('data','Outra fonte.'),{}],
  ['approximate date',box('')+'\n'+name+' (cerca de 1980'+dref+') é uma escritora.',{}],
  ['incomplete date',box('')+'\n'+name+' (fevereiro de 1980'+dref+') é uma escritora.',{}],
  ['foreign calendar remains literal',box('|calendário=juliano')+'\n'+sourced,{}],
  ['namespace boundary',empty,{namespaceNumber:1}],
  ['section edit boundary',empty,{sectionOnly:true}],
  ['disabled feature',empty,{automaticBiographyFields:false}],
  ['unknown template wrapper','{{Modelo|exemplo='+empty+'}}',{}],
  ['literal nowiki example','<nowiki>'+empty+'</nowiki>',{}],
  ['comment example','<!--'+empty+'-->',{}],
  ['uncertain chronology',box('')+'\n'+name+' ({{DataExt|1|2|1980}}'+dref+' – {{DataExt|1|2|1970}}'+pref+') foi uma escritora.',{}]
 ])transfer('no inferred fact: '+id,source,source,options);
 // A reference attached solely to the date can copy that date, but never its
 // neighboring unsourced place. The independently expected narrow result is explicit.
 const oneSource=box('')+'\n'+name+' ('+place+', '+birth+dref+') é uma escritora.';
 transfer('a sourced date never lends its reference to an unsourced city',oneSource,box('|nascimento_data='+birth+call('data'))+'\n'+name+' ('+place+', '+birth+dref+') é uma escritora.');
 const packed=box('|nascimento_data='+birth+dref+', '+place+pref)+intro;
 transfer('packed date and city separate with their own references',packed,box('|nascimento_data='+birth+dref+'|local_nascimento='+place+pref)+intro);
 for(const [id,source]of [
  ['a single source after the city',box('|nascimento_data='+birth+', '+place+pref)+intro],
  ['a populated target slot',box('|nascimento_data='+birth+dref+', '+place+pref+'|local_nascimento=[[Outra cidade]]')+intro],
  ['a source placed between unseparated values',box('|nascimento_data='+birth+dref+' '+place+pref)+intro],
  ['a burial field remains outside the date/place rule',box('|sepultamento='+birth+dref+', '+place+pref)+intro]
 ])transfer('packed-field refusal: '+id,source,source);
 field('a complete isolated native birth date uses a display-only date template',box('|nascimento_data=1 de fevereiro de 1980'+dref),box('|nascimento_data='+birth+dref));
 for(const value of ['1980','fevereiro de 1980','01/02/1980','1980-02-30','cerca de 1980','{{Dni|1|2|1980}}','{{dni|1|2|1980}}','{{Dni|1|2|1980|si}}'])field('dates preserve accepted or uncertain form '+sha(value).slice(0,8),box('|nascimento_data='+value),box('|nascimento_data='+value));
 const now=new Date(),age=now.getUTCFullYear()-1980-Number(now.getUTCMonth()+1<2||now.getUTCMonth()+1===2&&now.getUTCDate()<1),dni='{{Dni|1|2|1980}}';
 field('only an exactly duplicated current age is removed',box('|nascimento_data='+dni+' ('+age+' anos)'+dref),box('|nascimento_data='+dni+dref));
 for(const value of [dni+' ('+(age+1)+' anos)',dni+' ('+age+' anos em 2020)','{{Dni|1|2|1980|si}} ('+age+' anos)',dni+' <small>('+age+' anos)</small>'])field('age with a different meaning stays '+sha(value).slice(0,8),box('|nascimento_data='+value),box('|nascimento_data='+value));
 const pilot=value=>'{{Info/Piloto de automóvel|nome='+title+'|altura='+value+'}}';
 field('a proven template-supplied height unit is not repeated',pilot('1,80 m'+dref),pilot('1,80'+dref));
 for(const value of ['1,80','1,80 metros','180 cm','1,80 m (medido)','{{nowrap|1,80 m}}'])field('unproven height interpretation stays '+sha(value).slice(0,8),pilot(value),pilot(value));
 field('a biography that expects the literal unit keeps it',box('|altura=1,80 m'),box('|altura=1,80 m'));
 field('explicit linked bullet markers receive missing line boundaries',box('|ocupação=* [[Escritor]] * [[Poeta]]'),box('|ocupação=* [[Escritor]]\n* [[Poeta]]'));
 for(const value of ['[[Escritor]] * [[Poeta]]','* 2 * 3','* escritor * poeta','* [[Escritor]] ** [[Poeta]]','* [[Escritor]] * {{Modelo}}','* [[Escritor]]<ref>Uma fonte.</ref> * nota'])field('asterisks with another possible meaning stay '+sha(value).slice(0,8),box('|ocupação='+value),box('|ocupação='+value));
 field('duplicate local field labels disappear without changing the value',box('|local_nascimento=Nascimento: Nascimento: '+place+pref),box('|local_nascimento='+place+pref));
 field('a header self-link keeps its complete visible alternative name',box('').replace('|nome='+title,'|nome=[['+title+'|Nome exibido]]'),box('').replace('|nome='+title,'|nome=Nome exibido'));
 for(const value of ['[[Outra pessoa|Pessoa de controle]]','[[Pessoa de controle#Biografia|Pessoa de controle]]','[[:Pessoa de controle]]','[[Pessoa de controle]] e outra pessoa'])field('a header link requiring interpretation stays '+sha(value).slice(0,8),box('').replace('|nome='+title,'|nome='+value),box('').replace('|nome='+title,'|nome='+value));
 for(const key of ['sepultamento','enterro','enterro_local','resting_place'])field('burial field remains frozen '+key,box('|'+key+'=Nascimento: '+place),box('|'+key+'=Nascimento: '+place));
 for(const [id,source]of [
  ['a comment owns the final section','== Notas ==\n<!-- Manter informação. -->\n{{Portal3|Biografias}}'],
  ['a subsection owns the final section','== Notas ==\n=== Detalhe ===\nTexto.'],
  ['an unknown template owns the final section','== Notas ==\n{{Modelo desconhecido}}\n{{Portal3|Biografias}}'],
  ['ordinary nonfinal section','== Biografia ==\n\n== Bibliografia ==\n* Uma obra.']
 ])planned('heading completion refusal: '+id,'v216EmptyEndHeadingPlan','v216EmptyEndHeadingProof',source,source,{headings:true});
 const emptyHeading='== Notas ==\n\n== Bibliografia ==\n* Uma obra.\n';
 planned('an actually empty final notes heading finishes in one pass','v216EmptyEndHeadingPlan','v216EmptyEndHeadingProof',emptyHeading,'\n== Bibliografia ==\n* Uma obra.\n',{headings:true});
 test(bundle,'new fact transfer cannot be forged through the selection gate',()=>{
  const result=api.calculate({kind:'adjust',source:empty,options:cfg});eq(result.text,filled,'The full pipeline retains the separately referenced facts');
  eq(api.safeComposition(empty,result.text,cfg),'','The full source-bound endpoint is accepted');eq(api.preservationAudit(empty,result.text,cfg),[],'All original facts and references remain');
  for(const wrong of [filled.replace('|nascimento_data='+birth,'|nascimento_data={{DataExt|2|2|1980}}'),filled.replace('|local_nascimento='+place,'|local_nascimento=[[Outra cidade]]'),filled.replace(call('data'),call('local'))])ok(api.safeComposition(empty,wrong,cfg),'A copied date, place or source association cannot be changed');
  eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'The complete result is idempotent');eq(result.minorCheck.eligible,false,'Copied facts do not become an automatically minor edit');
 });
}
const output=process.env.REVISAWIKI_REPORT;if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify(report));if(report.status!=='passed'||report.networkRequests)process.exitCode=1;
