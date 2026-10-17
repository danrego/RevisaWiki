'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),Module=require('node:module');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),isolated=process.argv.includes('--isolated');
const files=process.argv.slice(2).filter(value=>value!=='--isolated').length?process.argv.slice(2).filter(value=>value!=='--isolated'):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:
 ['RevisaWiki_v2_15_1.js','RevisaWiki_v2_15_1_completo.js'].map(file=>path.join(root,'dist/2.15.1',file));
const report={version:'2.15.1',kind:'literal-biography-opening',status:'passed',isolated,runtimeInjection:[],cases:0,checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
function eq(actual,expected,message){report.checks++;assert.deepEqual(actual,expected,message);}
function test(bundle,id,run){report.cases++;if(process.env.REVISAWIKI_TRACE_CASES)console.error(bundle+': '+id);try{run();}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}}
function load(file){
 let source=fs.readFileSync(file,'utf8');
 if(!source.includes('function v2151BiographyLeadPlan(')){
  assert(isolated,'The final distribution must include the actual biography-opening engine');
  let addition='';if(!source.includes('function v2151InfoboxOrderPlan('))addition+=fs.readFileSync(path.join(root,'src/v2_15_1/infobox_order.js'),'utf8');
  if(!source.includes('function v2151FieldSyntaxPlan('))addition+=fs.readFileSync(path.join(root,'src/v2_15_1/field_syntax.js'),'utf8');
  if(!source.includes('function v2151BiographyImageAltPlan('))addition+=fs.readFileSync(path.join(root,'src/v2_15_1/image_alt.js'),'utf8');
  addition+=fs.readFileSync(path.join(root,'src/v2_15_1/biography_lead.js'),'utf8');
  const exports=[...addition.matchAll(/^    function (v2151\w+|automaticBiographyLead|automaticInfoboxOrder)\(/gm)].map(match=>match[1]);
  source=source.replace('    const api = {',addition+'\n    const api = {'+exports.join(',')+',');
  report.runtimeInjection.push(path.basename(file));
 }
 const compiled=new Module(path.resolve(file),module);compiled.filename=path.resolve(file);compiled.paths=module.paths;compiled._compile(source,compiled.filename);return compiled.exports;
}
for(const file of files){
 const api=load(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de exemplo',contentModel:'wikitext',automaticBiographyLead:true},name="'''Pessoa de exemplo'''",lead=name+' é uma escritora.',
  tail='\n\n== Biografia ==\nTexto intacto.\n{{Referências}}',ref='<ref>Fonte específica.</ref>',birth='{{Dni|2|3|1930|si}}',death='{{Morte|5|6|2010}}',bd='{{DataExt|2|3|1930}}',dd='{{DataExt|5|6|2010}}',place='[[Cidade de exemplo]]',other='[[Outra cidade]]';
 report.bundles.push({name:bundle,sha256:sha(fs.readFileSync(file))});
 const box=fields=>'{{Info/Biografia|nome=Pessoa de exemplo'+fields+'}}',page=(fields,opening=lead)=>box(fields)+'\n'+opening+tail;
 function prove(source,expected,extra={},counts=null){
  const options={...cfg,...extra},plan=api.v2151BiographyLeadPlan(source,options);
  eq(plan.text,expected,'The engine returns the independently assembled literal endpoint');
  eq(api.v2151BiographyLeadProof(source,expected,plan,options),true,'The exact source-bound plan proves its endpoint');
  eq(api.v2151BiographyLeadPlan(expected,options).text,expected,'A second pass is byte-identical');
  const actualCounts={},result=api.automaticBiographyLead(source,options,rule=>actualCounts[rule]=(actualCounts[rule]||0)+1);
  eq(result,expected,'The automation wrapper uses the same exact endpoint');
  if(counts)eq(actualCounts,counts,'Each subject, place and date operation has an atomic count');
  const originalBoxes=source.match(/\{\{Info\/Biografia[^\n]*/g),newBoxes=expected.match(/\{\{Info\/Biografia[^\n]*/g);
  eq(newBoxes,originalBoxes,'The source infobox remains byte-identical');
  eq(result.endsWith(tail),source.endsWith(tail),'The rest of the article remains in place');
  for(const edit of plan.edits)eq(source.slice(edit.start,edit.end),edit.proof.before,'The witness contains the exact replaced bytes');
  if(source!==expected){
   eq(api.v2151BiographyLeadProof(source+' ',expected,plan,options),false,'A stale source cannot reuse an opening proof');
   eq(api.v2151BiographyLeadProof(source,expected,{...plan,edits:[]},options),false,'An erased edit witness cannot reuse the proof');
   eq(api.v2151BiographyLeadProof(source,expected+' ',plan,options),false,'A changed endpoint cannot reuse the proof');
  }
 }
 for(const [opening,expected,counts]of [
  ['Pessoa de exemplo é uma escritora.',lead,{biographyLeadBold:1}],
  ['[[Pessoa de exemplo]] é uma escritora.',lead,{biographyLeadSelfLink:1,biographyLeadBold:1}],
  ["'''[[Pessoa de exemplo]]''' é uma escritora.",lead,{biographyLeadSelfLink:1}],
  ['[[Pessoa de exemplo|Pessoa de exemplo]] é uma escritora.',lead,{biographyLeadSelfLink:1,biographyLeadBold:1}],
  ['[[Pessoa_de_exemplo|Pessoa de exemplo]] é uma escritora.',lead,{biographyLeadSelfLink:1,biographyLeadBold:1}],
  ['[[pessoa de exemplo|Pessoa de exemplo]] é uma escritora.',lead,{biographyLeadSelfLink:1,biographyLeadBold:1}],
  [lead,lead,{}]
 ])for(const prefix of ['',box('')+'\n','{{Ver desambig|Outro tema}}\n'+box('')+'\n'])test(bundle,'initial subject '+sha(opening+prefix).slice(0,12),()=>prove(prefix+opening+tail,prefix+expected+tail,{},counts));
 test(bundle,'a qualified page title uses its exact initial subject',()=>{
  const opening='[[Pessoa de exemplo (escritora)|Pessoa de exemplo]] é uma escritora.';
  prove(opening+tail,lead+tail,{pageTitle:'Pessoa de exemplo (escritora)'},{biographyLeadSelfLink:1,biographyLeadBold:1});
 });
 test(bundle,'nonbiography first subject is bolded without copying dates',()=>{
  prove('Tema de exemplo é um conceito.','\'\'\'Tema de exemplo\'\'\' é um conceito.',{pageTitle:'Tema de exemplo'},{biographyLeadBold:1});
 });
 for(const date of [birth,'{{dni|2|3|1930}}','{{DataExt|2|3|1930}}','{{Dni|1=2|2=3|3=1930|4=si}}','2 de março de 1930','1930-03-02','[[2 de março]] de [[1930]]'])test(bundle,'referenced birth date '+sha(date).slice(0,12),()=>{
  const fields='|nascimento_data='+date+ref;prove(page(fields),page(fields,name+' ('+bd+ref+') é uma escritora.'),{}, {biographyLeadBirth:1});
 });
 test(bundle,'each separately sourced fact has its own reference and count',()=>{
  const fields='|nascimento_data='+birth+'<ref>Data de nascimento.</ref>|nascimento_local='+place+'<ref>Local de nascimento.</ref>|morte_data='+death+'<ref>Data de morte.</ref>|morte_local='+other+'<ref>Local de morte.</ref>',opening=name+' foi uma escritora.',
   expected=name+' ('+place+'<ref>Local de nascimento.</ref>, '+bd+'<ref>Data de nascimento.</ref> – '+other+'<ref>Local de morte.</ref>, '+dd+'<ref>Data de morte.</ref>) foi uma escritora.';
  prove(page(fields,opening),page(fields,expected),{}, {biographyLeadBirth:2,biographyLeadDeath:2});
 });
 test(bundle,'a date reference never supports an unreferenced place',()=>{
  const fields='|nascimento_data='+birth+ref+'|nascimento_local='+place;
  prove(page(fields),page(fields,name+' ('+bd+ref+') é uma escritora.'),{}, {biographyLeadBirth:1});
 });
 test(bundle,'an independently referenced location fills an existing exact date',()=>{
  const fields='|nascimento_local='+place+ref,opening=name+' ('+birth+') é uma escritora.';
  prove(page(fields,opening),page(fields,name+' ('+place+ref+', '+birth+') é uma escritora.'),{}, {biographyLeadBirth:1});
 });
 test(bundle,'a named source definition remains in the box and the lead reuses it',()=>{
  const fields='|nascimento_data='+birth+'<ref name="origem">Fonte específica.</ref>';
  prove(page(fields),page(fields,name+' ('+bd+'<ref name="origem" />) é uma escritora.'),{}, {biographyLeadBirth:1});
 });
 for(const attrs of [' name="origem"',' name=origem',' name="origem" group="nota"'])test(bundle,'referenced call resolves an existing literal definition '+sha(attrs).slice(0,12),()=>{
  const fields='|nascimento_data='+birth+'<ref'+attrs+' />|notas=<ref'+attrs+'>Fonte específica.</ref>';
  prove(page(fields),page(fields,name+' ('+bd+'<ref'+attrs+' />) é uma escritora.'),{}, {biographyLeadBirth:1});
 });
 for(const original of [birth,'{{dni|2|3|1930|si}}','{{DataExt|2|3|1930}}','[[2 de março]] de [[1930]]'])test(bundle,'existing date template is byte-preserved '+sha(original).slice(0,12),()=>{
  const fields='|nascimento_data='+birth+'|nascimento_local='+place+ref,opening=name+' ('+original+') é uma escritora.';
  prove(page(fields,opening),page(fields,name+' ('+place+ref+', '+original+') é uma escritora.'),{}, {biographyLeadBirth:1});
 });
 for(const original of [birth,'{{DataExt|2|3|1930}}','2 de março de 1930'])test(bundle,'explicit reversed tuple is reordered without changing its date '+sha(original).slice(0,12),()=>{
  const opening=name+' ('+original+', '+place+') é uma escritora.';
  prove(page('',opening),page('',name+' ('+place+', '+original+') é uma escritora.'),{}, {biographyLeadTuple:1});
 });
 test(bundle,'a date-first tuple with internal citations preserves its scope unchanged',()=>{
  const opening=name+' ('+birth+'<ref name="data">Data exata.</ref>, '+place+'<ref name="local">Local exato.</ref>) é uma escritora.';
  prove(page('',opening),page('',opening),{}, {});
 });
 test(bundle,'a source for the complete existing tuple remains complete after reorder',()=>{
  const opening=name+' ('+birth+', '+place+ref+') é uma escritora.',expected=name+' ('+place+', '+birth+ref+') é uma escritora.';
  prove(page('',opening),page('',expected),{}, {biographyLeadTuple:1});
 });
 test(bundle,'death completion uses foi and preserves existing birth syntax',()=>{
  const fields='|morte_data='+death+ref,opening=name+' ('+birth+') foi uma escritora.',expected=name+' ('+birth+' – '+dd+ref+') foi uma escritora.';
  prove(page(fields,opening),page(fields,expected),{}, {biographyLeadDeath:1});
 });
 test(bundle,'two independently reversed tuples count as two operations',()=>{
  const opening=name+' ('+birth+', '+place+' – '+death+', '+other+') foi uma escritora.',expected=name+' ('+place+', '+birth+' – '+other+', '+death+') foi uma escritora.';
  prove(page('',opening),page('',expected),{}, {biographyLeadTuple:2});
 });
 test(bundle,'date fields and the initial title can be adjusted together',()=>{
  const fields='|nascimento_data='+birth+ref;
  prove(page(fields,'[[Pessoa de exemplo]] é uma escritora.'),page(fields,name+' ('+bd+ref+') é uma escritora.'),{}, {biographyLeadSelfLink:1,biographyLeadBold:1,biographyLeadBirth:1});
 });
 const blockedOpenings=[
  'Outra pessoa é uma escritora.','Pessoa de exemplo, uma escritora, publicou obras.',"''Pessoa de exemplo'' é uma escritora.",
  '[[Outro assunto|Pessoa de exemplo]] é uma escritora.','[[Pessoa de exemplo#Biografia|Pessoa de exemplo]] é uma escritora.',
  '[[Pessoa de exemplo|Nome público]] é uma escritora.','[[Pessoa de exemplo|]] é uma escritora.','PESSOA DE EXEMPLO é uma escritora.',
  'Pessoa de exemplo foi-se embora.',' Pessoa de exemplo é uma escritora.','* Pessoa de exemplo é uma escritora.',
  '{{Modelo desconhecido}}\nPessoa de exemplo é uma escritora.','<!-- posição intencional -->\nPessoa de exemplo é uma escritora.',
  '<div>\nPessoa de exemplo é uma escritora.\n</div>','<blockquote>Pessoa de exemplo é uma escritora.</blockquote>',
  '<nowiki>Pessoa de exemplo é uma escritora.</nowiki>','<syntaxhighlight>Pessoa de exemplo é uma escritora.</syntaxhighlight>',
  '{|\n|Pessoa de exemplo é uma escritora.\n|}','== Pessoa de exemplo ==\nPessoa de exemplo é uma escritora.'
 ];
 for(const opening of blockedOpenings)test(bundle,'uncertain initial subject '+sha(opening).slice(0,12),()=>prove(opening+tail,opening+tail,{},{}));
 const unsafeFields=[
  '|nascimento_data='+birth,'|nascimento_local='+place+ref,
  '|nascimento_data=02/03/1930'+ref,'|nascimento_data=1930'+ref,'|nascimento_data=cerca de 1930'+ref,'|nascimento_data=2 de março de 1500'+ref,
  '|nascimento_data={{Dni|31|2|1930}}'+ref,'|nascimento_data={{Dni|2|3|2999}}'+ref,'|nascimento_data={{Dni|2|3|1930|lang=br}}'+ref,
  '|nascimento_data={{Dni|2|3|1930|9999}}'+ref,
  '|nascimento_data={{#if:x|2 de março de 1930|3 de março de 1930}}'+ref,'|nascimento_data='+birth+'<ref name="inexistente" />',
  '|nascimento_data='+birth+'<ref follow="origem">Fonte.</ref>','|nascimento_data='+birth+'<ref name="origem">Fonte A.</ref>|notas=<ref name="origem">Fonte B.</ref>',
  '|nascimento_data='+birth+'<ref></ref>','|nascimento_data='+birth+'<ref>Fonte sem fechamento.',
  '|nascimento_data='+birth+ref+'|data_nascimento=',
  '|nascimento_data='+birth+ref+'|data_nascimento='+birth+ref,
  '|nascimento_data='+birth+ref+'|calendário=juliano',
  '|nascimento_data='+birth+ref+'|nascimento_local={{#if:x|Cidade|Outra cidade}}',
  '|nascimento_data='+birth+ref+'|nascimento_local={{flag|BR}} Cidade',
  '|nascimento_data='+birth+ref+'|morte_data={{Morte|1|1|1900}}'+ref,
  '|nascimento_data='+birth+ref+'|morte_data='+death+ref,
  '|nascimento_data='+birth+ref+'|child=sim'
 ];
 for(const fields of unsafeFields)test(bundle,'uncertain or unreferenced source fact '+sha(fields).slice(0,12),()=>prove(page(fields),page(fields),{},{}));
 for(const tuple of ['1930','cerca de 1930','2 de março de 1931','02/03/1930','Recife','nascida em 1930',birth+' e '+death,birth+' – cerca de 2010',birth+' (calendário antigo)'])test(bundle,'existing date ambiguity or disagreement '+sha(tuple).slice(0,12),()=>{
  const fields='|nascimento_data='+birth+ref+'|nascimento_local='+place+ref,source=page(fields,name+' ('+tuple+') é uma escritora.');prove(source,source,{},{});
 });
 test(bundle,'an unsourced conflicting box date still prevents copying a place',()=>{
  const fields='|nascimento_data={{Dni|3|3|1930}}|nascimento_local='+place+ref,source=page(fields,name+' ('+birth+') é uma escritora.');prove(source,source,{},{});
 });
 test(bundle,'an existing conflicting location prevents death completion',()=>{
  const fields='|nascimento_local='+other+'|morte_data='+death+ref,source=page(fields,name+' ('+place+', '+birth+') foi uma escritora.');prove(source,source,{},{});
 });
 test(bundle,'two person boxes do not establish one subject for copying',()=>{
  const fields='|nascimento_data='+birth+ref,source=box(fields)+'\n'+box('')+'\n'+lead+tail;prove(source,source,{},{});
 });
 for(const replacement of ['','Outra pessoa',"'''Outra pessoa'''",'[[Outra pessoa|Pessoa de exemplo]]','Pessoa de exemplo|nome=','Pessoa de exemplo|nome=Pessoa de exemplo'])test(bundle,'conflicting or duplicate explicit box identity '+sha(replacement).slice(0,12),()=>{
  const source=page('|nascimento_data='+birth+ref).replace('nome=Pessoa de exemplo','nome='+replacement);prove(source,source,{},{});
 });
 for(const replacement of ["'''Pessoa de exemplo'''",'[[Pessoa de exemplo]]','[[Pessoa de exemplo|Pessoa de exemplo]]'])test(bundle,'simple exact native header identity '+sha(replacement).slice(0,12),()=>{
  const source=page('|nascimento_data='+birth+ref).replace('nome=Pessoa de exemplo','nome='+replacement),expected=source.replace('\n'+lead,'\n'+name+' ('+bd+ref+') é uma escritora.');prove(source,expected,{}, {biographyLeadBirth:1});
 });
 for(const source of [page('|morte_data='+death+ref,name+' ('+birth+') foi uma escritora.')+'\n[[Categoria:Pessoas vivas]]',page('|nascimento_data='+birth+ref,lead).replace('Info/Biografia','Infobox person')])test(bundle,'no contradicted or foreign-box completion '+sha(source).slice(0,12),()=>prove(source,source,{},{}));
 for(const extra of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{sectionOnly:true},{section:0},{section:1},{section:'new'},
  {discussionPage:true},{pageRedirect:true},{pageDisambiguation:true},{redirectPage:true},{disambiguationPage:true},{contentModel:'javascript'},{model:'Scribunto'},
  {automaticBiographyLead:false},{markup:false},{structuralRepairs:false},{pageTitle:''},{pageTitle:'Lista de pessoas'}])test(bundle,'scope optout '+JSON.stringify(extra),()=>{
  const source=page('|nascimento_data='+birth+ref,'Pessoa de exemplo é uma escritora.');prove(source,source,extra,{});
 });
 for(const [template,key]of [['Info/Biografia','nascimento_data'],['Info/Ator','data_nascimento'],['Info/Político','data_nascimento'],['Info/Cientista','nascimento_data'],['Info/Escritor','nascimento_data']])test(bundle,'accepted native biography date fields '+template,()=>{
  const source='{{'+template+'|nome=Pessoa de exemplo|'+key+'='+birth+ref+'}}\n'+lead+tail,
   expected=source.replace('\n'+lead,'\n'+name+' ('+bd+ref+') é uma escritora.');prove(source,expected,{}, {biographyLeadBirth:1});
 });
 for(const key of ['nascimento_cidade','cidade natal','localnasc'])test(bundle,'checker or condition-only birthplace is not transferred '+key,()=>{
  const fields='|nascimento_data='+birth+ref+'|'+key+'='+place+ref;
  prove(page(fields),page(fields,name+' ('+bd+ref+') é uma escritora.'),{}, {biographyLeadBirth:1});
 });
 for(const template of ['Info/Futebol','Info/Artista marcial','Info/Enxadrista'])for(const higher of ['',other+ref])test(bundle,'all native spaced birthplace aliases block competing fallback '+template+' '+Boolean(higher),()=>{
  const source='{{'+template+'|nome=Pessoa de exemplo|nascimento_data='+birth+ref+'|local de nascimento='+higher+'|nascimento_local='+place+ref+'}}\n'+lead+tail;
  prove(source,source,{},{});
 });
 for(const [template,key]of [['Info/Astronauta','nascimento_data'],['Info/Ciclista','data_nascimento'],['Info/Surfista','data_nascimento'],['Info/Nadador','data_nascimento'],['Info/Artista','nascimento_data'],['Info/Arquiteto','data_nascimento'],['Info/Motociclista','nascimento_data'],['Info/Youtuber','nascimento_data'],['Info/Treinador de natação','data_nascimento']])test(bundle,'unproved dependency family cannot supply lead facts '+template,()=>{
  const source='{{'+template+'|nome=Pessoa de exemplo|'+key+'='+birth+ref+'}}\n'+lead+tail;prove(source,source,{},{});
 });
 for(const template of ['Info/Modelo','Info/Boxeador'])for(const burial of ['',other+ref])test(bundle,'burial alias never supplies or shadows a copied death place '+template+' '+Boolean(burial),()=>{
  const opening=name+' ('+birth+') foi uma escritora.',source='{{'+template+'|nome=Pessoa de exemplo|morte_data='+death+ref+'|enterro_local='+burial+'|local_falecimento='+other+ref+'}}\n'+opening+tail;
  prove(source,source,{},{});
 });
 for(const template of ['Info/Futebolista','Info/Treinador de futebol'])test(bundle,'conditionally hidden death city is not transferred '+template,()=>{
  const opening=name+' ('+birth+') foi uma escritora.',source='{{'+template+'|nome=Pessoa de exemplo|morte_data='+death+ref+'|morte_cidade='+other+ref+'}}\n'+opening+tail,
   expected=source.replace('\n'+opening,'\n'+name+' ('+birth+' – '+dd+ref+') foi uma escritora.');
  prove(source,expected,{}, {biographyLeadDeath:1});
 });
 for(const key of ['Name','nome'])test(bundle,'racing-driver native header alias conflict '+key,()=>{
  const fields=key==='Name'?'Name=Outra pessoa|nome=Pessoa de exemplo':'Name=Pessoa de exemplo|nome=Outra pessoa',
   source='{{Info/Piloto de corrida|'+fields+'|data_de_nascimento='+birth+ref+'}}\n'+lead+tail;prove(source,source,{},{});
 });
 for(const flag of ['incorporar','subbox'])test(bundle,'native embedded control cannot supply lead facts '+flag,()=>{
  const source=page('|'+flag+'=sim|nascimento_data='+birth+ref);prove(source,source,{},{});
 });
 const nativeCatalog=JSON.parse(fs.readFileSync(path.join(root,'dist/2.15.1/Catalogo_ptwiki_RevisaWiki_v2_15_1.json'),'utf8')).infoboxes;
 for(const [nativeName,profile]of Object.entries(nativeCatalog)){
  const contract=api.v2151LeadTransferContract(profile);if(!contract)continue;
  for(const kind of ['birthDate','birthPlace','deathDate','deathPlace'])for(const key of contract[kind])test(bundle,'exact pinned displayed role '+nativeName+' '+kind+' '+key,()=>{
   const value=(kind==='birthDate'?birth:kind==='deathDate'?death:place)+ref,field={key,value,start:0,end:value.length},fields=[field];
   if(contract.placeNeedsDate&&kind.endsWith('Place'))fields.push({key:contract[kind.replace('Place','Date')][0],value:(kind==='birthPlace'?birth:death)+ref,start:0,end:birth.length+ref.length});
   const model={profile,fields,node:{start:0}},fact=api.v2151LeadFactField(model,kind,value);
   eq(Boolean(fact),profile.accepted.includes(key),'A native value role also needs its exact key accepted by the pinned catalog');
   if(fact){eq(fact.key,key,'The role uses the literal selected key');eq(fact.raw,(kind==='birthDate'?bd:kind==='deathDate'?dd:place)+ref,'The exact fact and its reference are preserved');}
   const forged={...model,profile:{...profile,oldid:1}};eq(api.v2151LeadFactField(forged,kind,value),null,'A different revision cannot borrow the role proof');
   const wrongCase=key.toLowerCase()===key?key.toUpperCase():key.toLowerCase();
   if(!contract[kind].includes(wrongCase))eq(api.v2151LeadFactField({...model,fields:[{...field,key:wrongCase}]},kind,value),null,'MediaWiki parameter case is preserved');
  });
 }
 for(const [original,canonical]of [
  ['{{Infobox person|name=Pessoa de exemplo|birth_date={{Birth date|1930|3|2}}'+ref+'}}',box('|nascimento_data='+birth+ref)],
  [box('|birth_date={{Birth date|1930|3|2}}'+ref),box('|nascimento_data='+birth+ref)],
  [box('|nascimento_data={{Birth date|1930|3|2}}'+ref),box('|nascimento_data='+birth+ref)],
  [box('|nascimento_data={{Birth date and age|1930|3|2}}'+ref),box('|nascimento_data={{Dni|2|3|1930}}'+ref)]
 ])test(bundle,'existing preparation enables a directly bound lead fact '+sha(original).slice(0,12),()=>{
  const source=original+'\n'+lead+tail,expected=canonical+'\n'+lead+tail,plan=api.v2151BiographyPreparationPlan(source,cfg);
  eq(plan.text,expected,'Only existing box/date normalization prepares the exact native source');
  eq(api.v2151BiographyPreparationProof(source,expected,plan,cfg),true,'The preparation proof regenerates the exact source-bound transaction');
  eq(plan.edits.length,1,'The one complete principal source box is the transaction');
  const facts=plan.edits[0].proof.sourceFacts;eq(facts.length,1,'The enabled birth date retains its one original individual field');
  eq(source.slice(facts[0].originalStart,facts[0].originalEnd),facts[0].originalValue,'Original fact coordinates are before migration');
  eq(facts[0].referenceSuffix,ref,'The original individual reference is unchanged');
  eq(api.v2151BiographyPreparationPlan(expected,cfg).edits,[],'The source normalizations do not repeat');
  eq(api.v2151BiographyPreparationProof(source,expected+' ',plan,cfg),false,'An altered preparation endpoint is refused');
 });
 const imported='{{Infobox person|name=Pessoa de exemplo|birth_date={{Birth date|1930|3|2}}'+ref+'}}\n'+lead+tail;
 for(const [id,source,options]of [
  ['all new groups disabled',imported,{automaticBiographyLead:false,automaticInfoboxOrder:false,automaticFieldSyntax:false,automaticInfoboxImages:false}],
  ['infobox group disabled',imported,{infoboxes:false}],['translation group disabled',imported,{multilingual:false}],
  ['unproved target',page('|nascimento_data={{Birth date|1930|3|2}}'+ref).replace('Info/Biografia','Info/Astronauta'),{}],
  ['original conflicting native aliases',page('|nascimento_data='+birth+ref+'|birth_date={{Birth date|1931|3|2}}'+ref),{}],
  ['explicit empty native birth precedence',page('|birth_date={{Birth date|1930|3|2}}'+ref+'|nascimento_data='),{}],
  ['explicit empty imported birth precedence',imported.replace('}}\n'+lead,'|nascimento_data=}}\n'+lead),{}],
  ['explicit empty native name precedence',page('|name=Pessoa de exemplo|nome=|birth_date={{Birth date|1930|3|2}}'+ref),{}],
  ['original conflicting person',imported.replace('name=Pessoa de exemplo','name=Outra pessoa'),{}],
  ['original empty person',imported.replace('name=Pessoa de exemplo','name='),{}],
  ['frozen foreign burial alias',imported.replace('}}\n'+lead,'|resting_place=[[Lugar]]}}\n'+lead),{}],
  ['nothing newly enabled',imported.replace(ref,''),{}]
 ])test(bundle,'gated preparation refusal '+id,()=>{
  eq(api.v2151BiographyPreparationPlan(source,{...cfg,...options}).text,source,'Unproved or disabled preparation stays on the existing route');
 });
 test(bundle,'native burial field remains wholly unchanged during preparation',()=>{
  const frozen='|sepultamento = [[Lugar]]<ref>Local de sepultamento.</ref>',source=page('|birth_date={{Birth date|1930|3|2}}'+ref+frozen),plan=api.v2151BiographyPreparationPlan(source,cfg);
  eq(plan.text.includes(frozen),true,'The native burial key, spacing, value and source remain exact');
  eq(plan.edits.length,1,'Independent approved preparation remains possible');
 });
 for(const type of ['Info/Biografia','Infobox person'])for(const [nativeKey,importedKey,value]of [
  ['nascimento_data','birth_date','{{Birth date|1930|3|2}}'+ref],['nascimento_local','birth_place',place+ref],
  ['morte_data','death_date','{{Death date|2010|6|5}}'+ref],['morte_local','death_place',other+ref],['nome','name','Pessoa de exemplo']
 ])for(const blank of ['',value])test(bundle,'original alias collision precedes normalization '+[type,nativeKey,Boolean(blank)].join('|'),()=>{
  const fields=(nativeKey==='nome'?'':(type==='Info/Biografia'?'|nome=Pessoa de exemplo':'|name=Pessoa de exemplo'))+
   '|'+nativeKey+'='+blank+'|'+importedKey+'='+value+(nativeKey.includes('data')?'':'|nascimento_data='+birth+ref),
   source='{{'+type+fields+'}}\n'+name+' foi uma escritora.'+tail;
  eq(api.v2151BiographyPreparationPlan(source,cfg).text,source,'No explicit empty or duplicate native role is displaced by an imported alias');
 });
 test(bundle,'large body remains outside the changed opening',()=>{
  const source=page('|nascimento_data='+birth+ref)+'\n'+('Texto com [[Ligação]] e {{lang|en|word}}.\n'.repeat(8000)),
   expected=source.replace('\n'+lead,'\n'+name+' ('+bd+ref+') é uma escritora.');prove(source,expected,{}, {biographyLeadBirth:1});
 });
}
if(process.env.REVISAWIKI_REPORT){fs.mkdirSync(path.dirname(process.env.REVISAWIKI_REPORT),{recursive:true});fs.writeFileSync(process.env.REVISAWIKI_REPORT,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
