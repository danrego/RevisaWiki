'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:
 ['RevisaWiki_v2_16_0.js','RevisaWiki_v2_16_0_completo.js'].map(name=>path.join(root,'dist/2.16.0',name));
const report={version:'2.16.0',kind:'native-biography-field-values',status:'passed',cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0,bundles:[]};
function eq(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
for(const file of files){
 const raw=fs.readFileSync(file),api=require(path.resolve(file)),bundle=path.basename(file),sha256=hash(raw);
 report.bundles.push({file:bundle,sha256,bytes:raw.length});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',contentModel:'wikitext',automaticBiographyFields:true};
 assert.equal(typeof api.v216FieldValuePlan,'function','The executed release contains the actual field-value stage');
 const check=(id,fn)=>{report.cases++;try{fn();}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}};
 const lead="\n\n'''Pessoa de teste''' é uma pesquisadora.",tail='\n\n== Biografia ==\nTexto.\n{{Referências}}',
  box=(fields,name='Info/Biografia')=>'{{'+name+'|'+fields+'}}'+lead+tail;
 function prove(source,expected,rules=[],options={}){
  const settings={...cfg,...options},plan=api.v216FieldValuePlan(source,settings);
  eq(plan.text,expected,'The exact literal replacement matches the independently specified result');
  eq(plan.edits.flatMap(edit=>edit.proof.changeRules),rules,'Each retained field operation has its own count');
  eq(api.v216FieldValueEdits(source,settings),plan.edits,'The edit finder agrees with the plan');
  eq(api.v216FieldValueProof(source,expected,plan,settings),true,'The source and replacement have a reproducible proof');
  if(source!==expected){
   const witness=plan.edits[0];eq(source.slice(witness.start,witness.end),witness.proof.raw,'The exact source box is bound');
   eq(expected.slice(0,witness.start),source.slice(0,witness.start),'The prefix is untouched');
   eq(expected.slice(witness.start+witness.text.length),source.slice(witness.end),'The article tail is untouched');
   eq(api.v216FieldValueProof(source+' ',expected,plan,settings),false,'An old source rejects the witness');
   eq(api.v216FieldValueProof(source,expected+' ',plan,settings),false,'Another output rejects the witness');
   const forged=JSON.parse(JSON.stringify(plan));forged.edits[0].proof.changeRules=[];
   eq(api.v216FieldValueProof(source,expected,forged,settings),false,'Changing the count invalidates the witness');
   eq(api.v216FieldValuePlan(source,{...settings,automaticBiographyFields:false}).text,source,'The module opt-out is honored');
  }
  return plan;
 }
 const dateFamilies=[
  ['Info/Biografia','nascimento_data','morte_data'],['Info/Cientista','data_nascimento','data_falecimento'],
  ['Info/Ator','nascimento_data','morte_data'],['Info/Político','data_nascimento','data_morte'],
  ['Info/Futebolista','data_nascimento','morte_data'],['Info/Futebol','data de nascimento','data de morte'],
  ['Info/Música/artista','nascimento_data','morte_data'],['Info/Militar','nascimento_data','morte_data'],
  ['Info/Modelo','nascimento_data','morte_data'],
  ['Info/Piloto de automóvel','nascimento_data','morte_data'],['Info/Filósofo','data_nascimento','data_falecimento']
 ];
 const references=['','<ref>Fonte publicada.</ref>','<ref name="data">{{Citar livro|titulo=Fonte|ano=2000}}</ref>',
  '<ref name="data" />'],dates=[['1980-02-01','1|2|1980'],['1 de fevereiro de 1980','1|2|1980'],
   ['2000-02-29','29|2|2000'],['29 de fevereiro de 2000','29|2|2000'],['1583-01-01','1|1|1583'],['1.º de janeiro de 2001','1|1|2001']];
 for(const [name,birth,death]of dateFamilies)for(const field of [birth,death])for(const [date,numbers]of dates)for(const ref of references)
  check('complete native standalone date '+[name,field,date,hash(ref).slice(0,8)].join('|'),()=>{
   const extra=name==='Info/Música/artista'?'fundo=cantor_solo|':'',definition=ref==='<ref name="data" />'?'\n<ref name="data">Fonte publicada.</ref>':'';
   prove(box(extra+field+'= \t'+date+ref+'\t ',name)+definition,box(extra+field+'= \t{{DataExt|'+numbers+'}}'+ref+'\t ',name)+definition,['v216InfoboxStandaloneDates']);
  });
 for(const value of ['1980','fevereiro de 1980','1980-2-1','01/02/1980','c. 1 de fevereiro de 1980','1980-02-30',
  '1900-02-29','1582-10-15','0000-01-01','9999-01-01','1 de fevereiro de 1980 ou 1981','data desconhecida',
  '{{Dni|1|2|1980}}','{{dni|1|2|1980|si}}','{{DataExt|1|2|1980}}','{{Morte|1|2|1980}}','{{Birth date|1980|2|1}}',
  '1980-02-01<ref name="semdefinição" />','1980-02-01<!-- comentário -->','1980-02-01<ref group="x"></ref>',
  '1980-02-01<ref name="x">A</ref><ref name="x">B</ref>'])
  check('ambiguous standalone date '+hash(value).slice(0,12),()=>prove(box('nascimento_data='+value),box('nascimento_data='+value)));
 for(const key of ['calendário','calendario','calendar'])check('calendar variant remains literal '+key,()=>{
  const source=box('nascimento_data=1980-02-01|'+key+'=juliano');prove(source,source);
 });
 const clock=api.v216FieldValueClock(),born=[1,2,1980],age=clock.year-1980-Number(clock.month<2||clock.month===2&&clock.day<1);
 for(const name of ['Dni','dni'])for(const gap of [' ','\t','  '])for(const ref of references.slice(0,3)){
  const value='{{'+name+'|1|2|1980}}'+gap+'('+age+' anos)'+ref;
  check('identical manual age '+name+hash(value).slice(0,12),()=>{
   const plan=prove(box('nascimento_data='+value),box('nascimento_data={{'+name+'|1|2|1980}}'+ref),['v216InfoboxDuplicateAge']);
   const detail=plan.edits[0].proof.edits[0].detail;
   eq(detail.definition,69218531,'The native age contract is pinned');eq(detail.calendarUTC,clock.calendarUTC,'The age proof is bound to the current UTC date');
   eq(detail.expiresUTC,Date.UTC(clock.year,clock.month-1,clock.day+1),'The age proof expires at the next UTC midnight');
  });
 }
 check('singular native age',()=>prove(box('nascimento_data={{Dni|1|1|'+(clock.year-1)+'}} (1 ano)'),
  box('nascimento_data={{Dni|1|1|'+(clock.year-1)+'}}'),['v216InfoboxDuplicateAge']));
 check('named numeric Dni parameters preserve their order and spelling',()=>prove(box('nascimento_data={{dni|3=1980|1=1|2=2}} ('+age+' anos)'),
  box('nascimento_data={{dni|3=1980|1=1|2=2}}'),['v216InfoboxDuplicateAge']));
 for(const suffix of ['si','sem idade','4=si','lang=br','nocat=sim','circa=sim'])check('modified Dni keeps manual age '+suffix,()=>{
  const value='{{Dni|1|2|1980|'+suffix+'}} ('+age+' anos)',source=box('nascimento_data='+value);prove(source,source);
 });
 for(const value of ['{{Dni|1|2|1980}} ('+(age-1)+' anos)','{{Dni|1|2|1980}} ('+(age+1)+' anos)',
  '{{Dni|1|2|1980}} ('+age+' ano)','{{Dni|1|2|1980}} (idade: '+age+' anos)',
  '{{Dni|1|2|1980}} ('+age+' anos em 2020)','{{Dni|1|2|1980}} ('+age+' anos)<ref>Fonte</ref> texto',
  '{{Dni|1|2|1980}} <ref>Fonte.</ref> ('+age+' anos)','{{dni|0|2|1980}} ('+age+' anos)'])
  check('different or qualified manual age '+hash(value).slice(0,12),()=>prove(box('nascimento_data='+value),box('nascimento_data='+value)));
 for(const number of ['1','1,8','1,80','1.80','12,345','999'])for(const edge of ['',' ','\t'])for(const ref of references.slice(0,3))
  check('native appended unit '+hash(number+edge+ref).slice(0,12),()=>prove(box('altura='+edge+number+' m'+ref+edge,'Info/Piloto de automóvel'),
   box('altura='+edge+number+ref+edge,'Info/Piloto de automóvel'),['v216InfoboxDuplicateUnits']));
 for(const name of ['Info/Biografia','Info/Modelo','Info/Futebolista','Info/Artista marcial','Info/Jogador de basquete'])
  for(const field of ['altura','peso'])check('boxes requiring explicit units '+name+field,()=>{
   const source=box(field+'=70 kg',name);prove(source,source);
  });
 for(const value of ['1,80','1,80 metros','1,80 cm','1,80 kg','1,80 m²','1,80m','1,80 [[Metro|m]]','{{convert|1.8|m}}',
  '1,80 m e 70 kg','1,80 m (2020)','1,80 m<ref name="missing" />'])check('unproven unit grammar '+hash(value).slice(0,12),()=>{
   const source=box('altura='+value,'Info/Piloto de automóvel');prove(source,source);
  });
 for(const collision of ['Altura=1,80','height=1.80','altura=1,80'])check('unit field collision '+collision,()=>{
  const source=box('altura=1,80 m|'+collision,'Info/Piloto de automóvel');prove(source,source);
 });
 for(const field of ['ocupação','outras_ocupações','profissão','filhos','parentesco','principais_trabalhos','instrumentos'])
  for(const newline of ['\n','\r\n'])for(const value of ['* [[Ligação A]] * [[Ligação B]]','* [[Ligação A]]\n* [[Ligação B]]',
   '\n* [[Ligação A]] * [[Ligação B]]'])check('linked bullet field '+hash(field+newline+value).slice(0,12),()=>{
    const actualNewline=value.includes('\n')?newline:'\n',source=box(field+'='+value.replaceAll('\n',newline)),
     count=Number(!value.includes('\n* [[Ligação B]]')),
     expected=count?box(field+'='+(value.startsWith('\n')?actualNewline:'')+'* [[Ligação A]]'+actualNewline+'* [[Ligação B]]'):source;
    prove(source,expected,Array(count).fill('v216InfoboxLists'));
   });
 const a='<ref name="a">Fonte A.</ref>',b='<ref name="b">Fonte B.</ref>';
 check('bullet reference bodies and bindings retained',()=>prove(box('filhos=* [[Ligação A|A]]'+a+' * [[Ligação B]]'+b),
  box('filhos=* [[Ligação A|A]]'+a+'\n* [[Ligação B]]'+b),['v216InfoboxLists']));
 for(const value of ['* pesquisador * escritor','2 * [[Ligação A]] * [[Ligação B]]','* [[A]] x * [[B]]','* [[A]] ** [[B]]',
  '* [[A]]','* [[A]] * {{Modelo|B}}','* [[A]]<ref name="missing" /> * [[B]]','* [[A]] * [[Categoria:B]]',
  '\n* [[A]]\n* [[B]]\n','* [[A]] * [[B]]\n# [[C]]','* [[A]] * [[B]] <!-- comentário -->','* [[A|B|C]] * [[D]]'])
  check('ambiguous list is preserved '+hash(value).slice(0,12),()=>prove(box('filhos='+value),box('filhos='+value)));
 for(const field of ['nome','website','notas','sepultamento'])check('unreviewed list field '+field,()=>{
  const source=box(field+'=* [[A]] * [[B]]');prove(source,source);
 });
 const labelFields=[['Info/Biografia','nacionalidade','Nacionalidade','brasileira'],['Info/Biografia','cidadania','Cidadania','brasileira'],
  ['Info/Biografia','ocupação','Ocupação','poeta'],['Info/Biografia','profissão','Profissão','professora'],
  ['Info/Biografia','nome_completo','Nome completo','Pessoa de teste'],['Info/Biografia','nascimento_local','Nascimento','[[Lisboa]]'],
  ['Info/Futebolista','nascimento_local','Local de nascimento','[[Lisboa]]'],['Info/Futebolista','morte_local','Local da morte','[[Lisboa]]']];
 for(const [name,field,label,payload]of labelFields)for(const count of [1,2,3])for(const ref of references.slice(0,3))
  check('literal native value label '+hash([name,field,label,count,ref].join('|')).slice(0,12),()=>prove(box(field+'='+((label+': ').repeat(count))+payload+ref,name),
   box(field+'='+payload+ref,name),Array(count).fill('v216InfoboxValueLabels')));
 for(const value of ['Nascimento: data desconhecida','NASCIMENTO: [[Lisboa]]','Nascimento: "Lisboa"','Local de nascimento: [[Lisboa]]',
  'Nascimento:','Nascimento: [[Lisboa]] ou [[Porto]]','Nascimento: {{Local|Lisboa}}'])check('qualified or wrong label '+hash(value).slice(0,12),()=>{
   const source=box('nascimento_local='+value);prove(source,source);
  });
 for(const title of ['Pessoa de teste','Pessoa_de_teste','pessoa de teste'])for(const label of ['', '|Pessoa de teste','|Pessoa'])
  check('exact native header self-link '+title+label,()=>prove(box('nome=[['+title+label+']]'),box('nome='+(label?label.slice(1):title.replaceAll('_',' '))),['v216InfoboxHeaderSelfLinks']));
 for(const value of ['[[Outra pessoa]]','[[Pessoa de teste#Biografia]]','[[:Pessoa de teste]]','[[Pessoa de teste| ]]',
  "'''[[Pessoa de teste]]'''",'[[Pessoa de teste]] e [[Outra pessoa]]','{{PAGENAME}}','[[Pessoa de teste|{{Nome}}]]'])
  check('unproven header identity '+hash(value).slice(0,12),()=>prove(box('nome='+value),box('nome='+value)));
 for(const pair of [['nascimento_data=1980-02-01','data_nascimento=1980-02-01'],['nascimento_data=1980-02-01','birth_date=1980-02-01'],
  ['nascimento_local=Nascimento: Lisboa','local_nascimento=Lisboa'],['nome=[[Pessoa de teste]]','name=Pessoa de teste'],
  ['ocupação=* [[A]] * [[B]]','ocupacao=escritor']])check('native or imported alias collision '+hash(pair.join('|')).slice(0,12),()=>{
   const source=box(pair.join('|'));prove(source,source);
  });
 for(const field of ['sepultamento','enterro','enterro_local','resting_place']){
  const frozen='|'+field+'=Nascimento: Lisboa 1,80 m * [[A]] * [[B]]<ref>Fonte.</ref>';
  check('burial bytes frozen '+field,()=>prove(box('nascimento_data=1980-02-01'+frozen),box('nascimento_data={{DataExt|1|2|1980}}'+frozen),['v216InfoboxStandaloneDates']));
 }
 for(const options of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:undefined},{sectionOnly:true},
  {section:'1'},{section:0},{discussionPage:true},{pageRedirect:true},{pageDisambiguation:true},{redirectPage:true},{disambiguationPage:true},
  {infoboxes:false},{markup:false},{structuralRepairs:false},{automaticBiographyFields:false},
  {contentModel:'javascript'},{pageTitle:'Lista de pessoas'},{birthDates:false}])check('scope or date opt-out '+JSON.stringify(options),()=>{
   const source=box('nascimento_data=1980-02-01');prove(source,source,[],options);
  });
 check('the previous field-key opt-out does not disable field values',()=>prove(box('nascimento_data=1980-02-01'),
  box('nascimento_data={{DataExt|1|2|1980}}'),['v216InfoboxStandaloneDates'],{automaticFieldSyntax:false}));
 for(const source of ['<nowiki>'+box('nascimento_data=1980-02-01')+'</nowiki>',
  '<pre>'+box('nascimento_data=1980-02-01')+'</pre>','<!-- '+box('nascimento_data=1980-02-01')+' -->',
  box('nascimento_data=1980-02-01')+'\n{{Info/Ator|nome=Outra pessoa}}',
  '{{Info/Biografia|nascimento_data=1980-02-01|child=sim}}'+lead,
  '{{Info/Biografia|nascimento_data=1980-02-01|dados={{Info/Biografia|nome=A}}}}'+lead,
  '== Biografia ==\n'+box('nascimento_data=1980-02-01'),box('nascimento_data=1980-02-01')+'\n~~~~',
  box('nascimento_data=1980-02-01','Info/Empresa'),box('fundo=banda|nascimento_data=1980-02-01','Info/Música/artista')])
  check('protected or nonprincipal source '+hash(source).slice(0,12),()=>prove(source,source));
 check('large untouched reference-heavy tail',()=>{
  const end='\n\n== Dados ==\n'+('Texto com {{lang|en|word}} e [[Ligação|rótulo]]<ref>Fonte.</ref>.\n'.repeat(4000));
  prove(box('nascimento_data=1980-02-01')+end,box('nascimento_data={{DataExt|1|2|1980}}')+end,['v216InfoboxStandaloneDates']);
 });
 if(api.version==='2.16.0'){
  const full={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',autoPreview:false,authorityControl:false,
   portals:false,automaticTopicPortals:false},run=(source,options=full)=>api.calculate({kind:'adjust',source,options});
  const paired=[
   ['duplicate age and literal death','nascimento_data={{Dni|1|2|1980}} ('+age+' anos)|morte_data=2020-02-01',
    'nascimento_data={{Dni|1|2|1980|si}}|morte_data={{Morte|1|2|2020|1|2|1980}}',3],
   ['duplicate age and three-argument Morte','nascimento_data={{Dni|1|2|1980}} ('+age+' anos)|morte_data={{Morte|1|2|2020}}',
    'nascimento_data={{Dni|1|2|1980|si}}|morte_data={{Morte|1|2|2020|1|2|1980}}',3],
   ['birth label and literal death','nascimento_data=Nascimento: 1980-02-01|morte_data=2020-02-01',
    'nascimento_data={{DataExt|1|2|1980}}|morte_data={{Morte|1|2|2020|1|2|1980}}',3],
   ['death label and native Dni','nascimento_data={{Dni|1|2|1980}}|morte_data=Morte: 2020-02-01',
    'nascimento_data={{Dni|1|2|1980|si}}|morte_data={{Morte|1|2|2020|1|2|1980}}',3],
   ['both native date labels','nascimento_data=Nascimento: 1980-02-01|morte_data=Morte: 2020-02-01',
    'nascimento_data={{DataExt|1|2|1980}}|morte_data={{Morte|1|2|2020|1|2|1980}}',4],
   ['birth label and three-argument Morte','nascimento_data=Nascimento: 1980-02-01|morte_data={{Morte|1|2|2020}}',
    'nascimento_data={{DataExt|1|2|1980}}|morte_data={{Morte|1|2|2020|1|2|1980}}',3]
  ];
  for(const [id,before,after,count]of paired)check('production pipeline completes the unlocked pair: '+id,()=>{
   const source=box('nome=Pessoa de teste|'+before),expected=box('nome=Pessoa de teste|'+after),out=run(source);
   eq(out.text,expected,'The existing paired-date rule runs before standalone formatting can obscure its source');
   eq(run(out.text).text,out.text,'The first click already reaches the exact stable endpoint');
   eq(api.safeComposition(source,out.text,full),'','The source-bound composition proof accepts the completed endpoint');
   eq(api.preservationAudit(source,out.text,full),[],'The facts and references survive the full pipeline');
   eq(out.preservation,[],'The production transaction retains its content proof');
   const counted=api.v211RetainedAdjustments(source,out.text,[],full);
   eq(counted.exact,true,'The operation count is proved against the retained output');eq(counted.count,count,'Replaced temporary spellings are not counted twice');
  });
  check('a living-category conflict does not force a death-age inference',()=>{
   const source=box('nome=Pessoa de teste|nascimento_data={{Dni|1|2|1980}} ('+age+' anos)|morte_data=2020-02-01')+'\n[[Categoria:Pessoas vivas]]',out=run(source);
   eq(out.text.includes('{{Dni|1|2|1980|si}}'),false,'The earlier explicit living-category guard remains in force');
   eq(out.text.includes('{{Morte|1|2|2020|1|2|1980}}'),false,'The conflict does not supply an inferred death-age template');
   eq(out.text.includes('[[Categoria:Pessoas vivas]]'),true,'The existing living category is retained');
   eq(run(out.text).text,out.text,'The conflict stays stable without repeated changes');
  });
 }
 eq(hash(fs.readFileSync(file)),sha256,'The tested bundle remained immutable');
}
const native=JSON.parse(fs.readFileSync(path.join(__dirname,'native_field_values.json'))),n=id=>native.cases.find(row=>row.id===id);
checkNative();
function checkNative(){
 report.cases++;
 try{
  eq(native.method,'GET','Only read-only native parse requests were captured');eq(native.wikipediaWrites,0,'No page writes were used');
  for(const row of native.cases){eq(hash(row.source),row.sourceSha256,'The native input is hash-bound');eq(hash(row.html),row.htmlSha256,'The native HTML is hash-bound');}
  eq(/1,80 m <a[^>]+title="Metro">m<\/a>/.test(n('unit-before').html),true,'The native unit was really duplicated');
  eq(/1,80 <a[^>]+title="Metro">m<\/a>/.test(n('unit-after').html),true,'The native template supplies the retained metre unit');
  eq((n('list-before').html.match(/<li>/g)||[]).length,1,'The inline markers produced only one native list item');
  eq((n('list-after').html.match(/<li>/g)||[]).length,2,'The repaired native field really displays two list items');
  eq(n('dataext-three').categories,[],'A three-argument DataExt does not add a category');
  eq(/anos|ano\)/.test(n('dataext-three').html),false,'A three-argument DataExt does not add an age');
 }catch(error){report.status='failed';report.failures.push({bundle:'native-evidence',id:'native-contract-check',message:error.message});}
}
const output=process.env.REVISAWIKI_REPORT_DIR;
if(output){fs.mkdirSync(path.resolve(root,output),{recursive:true});fs.writeFileSync(path.resolve(root,output,'field_values.json'),JSON.stringify(report,null,2)+'\n');}
process.stdout.write(JSON.stringify({version:report.version,kind:report.kind,status:report.status,cases:report.cases,checks:report.checks,failures:report.failures,networkRequests:0,wikipediaWrites:0})+'\n');
if(report.failures.length)process.exitCode=1;
