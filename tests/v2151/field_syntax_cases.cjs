'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:
 ['RevisaWiki_v2_15_1.js','RevisaWiki_v2_15_1_completo.js'].map(name=>path.join(root,'dist/2.15.1',name));
const report={version:'2.15.1',kind:'native-biography-field-syntax',status:'passed',cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0,bundles:[]},runtimeInputs=[];
function eq(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function load(file){
 const raw=fs.readFileSync(file),sha256=hash(raw),absolute=path.resolve(file),api=require(absolute);
 assert.equal(typeof api.v2151FieldSyntaxPlan,'function','The actual release bundle must contain the tested implementation');
 report.bundles.push({file:path.basename(file),sha256,bytes:raw.length});runtimeInputs.push({file:absolute,sha256});return api;
}
for(const file of files){
 const api=load(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',contentModel:'wikitext',automaticFieldSyntax:true};
 const check=(id,run)=>{try{run();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}};
 const lead="\n\n'''Pessoa de teste''' é uma pesquisadora.",tail='\n\n== Biografia ==\nTexto.\n{{Referências}}',box=(fields,name='Info/Biografia')=>'{{'+name+'|'+fields+'}}'+lead+tail;
 function prove(source,expected,rules=[],options={}){
  const settings={...cfg,...options},plan=api.v2151FieldSyntaxPlan(source,settings),expectedCounts={};for(const rule of rules)expectedCounts[rule]=(expectedCounts[rule]||0)+1;
  eq(plan.text,expected,'The exact literal edit agrees with the independent expected source');
  eq(plan.edits.length,Number(source!==expected),'One complete box transaction or no transaction');
  eq(plan.edits.flatMap(edit=>edit.proof.changeRules),rules,'Every changed field token is counted separately');
  eq(api.v2151FieldSyntaxProof(source,expected,plan,settings),true,'The proof is bound to source, exact edits and output');
  eq(api.v2151FieldSyntaxEdits(source,settings),plan.edits,'The exported edit finder matches the plan');
  const counts={},result=api.automaticFieldSyntax(source,settings,key=>counts[key]=(counts[key]||0)+1);
  eq(result,expected,'The automatic wrapper applies the same source-bound endpoint');eq(counts,expectedCounts,'The wrapper reports the individual repairs');
  eq(api.v2151FieldSyntaxPlan(expected,settings).text,expected,'The second pass is byte-identical');
  if(source!==expected){
   const witness=plan.edits[0];eq(witness.proof.raw,source.slice(witness.start,witness.end),'The witness holds the exact original box');
   eq(witness.proof.canonical,witness.text,'The canonical box is the exact replacement');
   eq(expected.slice(0,witness.start),source.slice(0,witness.start),'All bytes before the box survive');
   eq(expected.slice(witness.start+witness.text.length),source.slice(witness.end),'All bytes after the box survive');
   eq(api.v2151FieldSyntaxProof(source+' ',expected,plan,settings),false,'A stale input rejects the witness');
   eq(api.v2151FieldSyntaxProof(source,expected,{...plan,edits:[]},settings),false,'An erased witness is rejected');
   eq(api.v2151FieldSyntaxProof(source,expected+' ',plan,settings),false,'A changed output is rejected');
   const forged=JSON.parse(JSON.stringify(plan));forged.edits[0].proof.changeRules=[];
   eq(api.v2151FieldSyntaxProof(source,expected,forged,settings),false,'Tampered rule counts are rejected');
  }
 }
 const keys=['nome','nome_completo','nascimento_data','nascimento_local','morte_data','morte_local','nacionalidade','ocupação','imagem','imagem_tamanho','imagem_legenda','alt','website'];
 const values=['Dado literal',' [[Cidade|rótulo]] ','{{Dni|1|2|1980}}','Nome<ref name="origem">{{Citar livro|titulo=Fonte|ano=2000}}</ref>','https://example.invalid/?a=b&c=d','Valor ＝ literal','Valor com \u200B e \uFEFF no conteúdo.'];
 for(const key of keys)for(const mark of ['\u200B','\uFEFF'])for(const index of [0,Math.ceil(key.length/2),key.length])for(const value of values){
  const wrong=key.slice(0,index)+mark+key.slice(index);
  check('one invisible key '+hash([key,mark,index,value].join('|')).slice(0,14),()=>prove(box(wrong+'='+value),box(key+'='+value),['fieldInvisibleKey']));
 }
 for(const key of keys)for(const spacing of ['',' ','\t','\r\n'])for(const value of values)
  check('one fullwidth separator '+hash([key,spacing,value].join('|')).slice(0,14),()=>prove(box(spacing+key+spacing+'＝'+value),box(spacing+key+spacing+'='+value),['fieldFullwidthEquals']));
 for(const key of keys)for(const mark of ['\u200B','\uFEFF'])
  check('combined invisible key and separator '+key+mark.charCodeAt(0),()=>prove(box(key.slice(0,2)+mark+key.slice(2)+' ＝ Dado'),box(key+' = Dado'),['fieldInvisibleKey','fieldFullwidthEquals']));
 check('several fields in one transaction',()=>prove(box('no\u200Bme ＝ Pessoa de teste|nacionali\uFEFFdade=brasileira|imagem_tamanho=200pxpx'),
  box('nome = Pessoa de teste|nacionalidade=brasileira|imagem_tamanho=200px'),['fieldInvisibleKey','fieldFullwidthEquals','fieldInvisibleKey','infoboxImageUnitDuplicate']));
 for(const name of ['Info/Biografia','Info/Cientista','Info/Escritor','Info/Autor','Info/Jornalista'])for(const key of ['imagem_tamanho','imagemtamanho','imagem tamanho'])
  for(const pixels of [10,11,50,99,100,199,200,250,300,499,500])check('pinned duplicate unit '+[name,key,pixels].join('|'),()=>prove(box('nome=Pessoa de teste|'+key+'= \t'+pixels+'pxpx\r\n',name),box('nome=Pessoa de teste|'+key+'= \t'+pixels+'px\r\n',name),['infoboxImageUnitDuplicate']));
 for(let pixels=10;pixels<=500;pixels++)check('complete bounded pixel domain '+pixels,()=>prove(box('imagem_tamanho='+pixels+'pxpx'),box('imagem_tamanho='+pixels+'px'),['infoboxImageUnitDuplicate']));
 for(const name of ['Info/Ator','Info/Político','Info/Futebol','Info/Cientista','Info/Escritor','Info/Militar','Info/Modelo'])
  check('other literal person family '+name,()=>prove(box('no\u200Bme ＝ Pessoa de teste',name),box('nome = Pessoa de teste',name),['fieldInvisibleKey','fieldFullwidthEquals']));
 for(const name of ['Info/Música/artista','Info/Cantor'])check('solo musician '+name,()=>prove(box('fundo=cantor_solo|no\u200Bme=Pessoa de teste',name),box('fundo=cantor_solo|nome=Pessoa de teste',name),['fieldInvisibleKey']));
 for(const key of ['sepultamento','enterro','enterro_local','resting_place'])for(const mark of ['','\u200B','\uFEFF'])for(const separator of ['=','＝']){
  const field=key.slice(0,2)+mark+key.slice(2)+separator+'[[Lugar|Lugar ＝ literal]]\u200B<ref>Fonte \uFEFF.</ref>';
  check('burial field wholly frozen '+hash(field).slice(0,14),()=>prove(box(field),box(field)));
 }
 for(const key of ['sepultamento','enterro','enterro_local','resting_place'])check('burial value alongside independent repair '+key,()=>{
  const frozen='|'+key+' = [[Lugar]] 200pxpx \u200B \uFEFF<ref>Fonte.</ref>';
  prove(box('no\u200Bme=Pessoa de teste'+frozen),box('nome=Pessoa de teste'+frozen),['fieldInvisibleKey']);
 });
 const sameFamily=[['imagem','foto'],['imagem_tamanho','imagemtamanho'],['imagem_tamanho','imagem tamanho'],['imagem_legenda','desc'],
  ['website','site'],['nascimento_data','data_nascimento'],['morte_data','falecimento'],['nascimento_local','local_nascimento'],['ocupação','ocupacao'],['cônjuge','conjuge'],
  ['nome','name'],['imagem_tamanho','image_size'],['nascimento_data','birth_date'],['morte_data','death_date']];
 for(const [a,b]of sameFamily)for(const separator of ['=','＝'])check('existing alias collision '+[a,b,separator].join('|'),()=>{
  const source=box(a.slice(0,2)+'\u200B'+a.slice(2)+separator+'Valor A|'+b+'=Valor B');prove(source,source);
 });
 for(const name of ['Info/Ator','Info/Militar','Info/Político','Info/Música/artista'])
  for(const pair of [['nascimento_data','data_nascimento'],['morte_data','data_morte'],['nascimento_local','local_nascimento']])
   check('other-family date and place collision '+name+' '+pair.join('|'),()=>{
    const extra=name==='Info/Música/artista'?'fundo=cantor_solo|':'',a=pair[0],source=box(extra+a.slice(0,2)+'\u200B'+a.slice(2)+'＝Valor A|'+pair[1]+'=Valor B',name);prove(source,source);
   });
 for(const key of keys)check('same repaired key collision '+key,()=>{
  const source=box(key.slice(0,1)+'\u200B'+key.slice(1)+'=A|'+key.slice(0,2)+'\uFEFF'+key.slice(2)+'=B');prove(source,source);
 });
 for(const [name,high,low]of [
  ['Info/Futebol','local de nascimento','nascimento_local'],['Info/Futebol','data de nascimento','nascimento_data'],
  ['Info/Futebol','local de morte','morte_local'],['Info/Futebol','data de morte','morte_data'],
  ['Info/Modelo','morte_local','enterro_local'],['Info/Boxeador','morte_local','enterro_local'],
  ['Info/Biografia','nascimento_local','nascimento_cidade'],['Info/Biografia','nascimento_local','cidade natal'],
  ['Info/Biografia','nascimento_local','localnasc'],['Info/Biografia','nome_completo','nome_de_batismo']
 ])for(const [a,b]of [[high,low],[low,high]])for(const separator of ['=','＝']){
  const source=box(a.slice(0,2)+'\u200B'+a.slice(2)+separator+'Valor A|'+b+'=Valor B',name);
  check('native priority collision '+[name,a,b,separator].join('|'),()=>prove(source,source));
 }
 for(const [name,key]of [['Info/Biografia','afiliações'],['Info/Biografia','campo'],['Info/Ator','nome_completo'],
  ['Info/Político','mandato'],['Info/Música/artista','gênero'],['Info/Música/artista','fundo']]){
  const extra=name==='Info/Música/artista'&&key!=='fundo'?'fundo=cantor_solo|':'',source=box(extra+key.slice(0,2)+'\u200B'+key.slice(2)+'＝Dado',name);
  check('unreviewed accepted field declined '+name+' '+key,()=>prove(source,source));
 }
 for(const [name,key]of [['Info/Futebol','local de nascimento'],['Info/Futebol','data de nascimento'],
  ['Info/Futebol','local de morte'],['Info/Futebol','data de morte']]){
  const broken=key.slice(0,3)+'\u200B'+key.slice(3);
  check('reviewed spaced native field '+name+' '+key,()=>prove(box(broken+'＝Dado',name),box(key+'=Dado',name),['fieldInvisibleKey','fieldFullwidthEquals']));
 }
 const negatives=[
  box('nome=Pessoa de teste'),box('nome ＝ Pessoa de teste|nome=Outra pessoa'),box('nome_completto ＝ Pessoa de teste'),box('no\u200Dme=Pessoa'),box('no\u2060me=Pessoa'),box('no\u00A0me=Pessoa'),
  box('nome{{!}}=Pessoa'),box('nome<!-- comentário -->=Pessoa'),box('nome ＝ Pessoa|texto sem separador'),box('nome ＝ Pessoa|{{{campo}}}=Valor'),box('nome ＝ Pessoa|nascimento_data={{{data|1980}}}'),
  box('nome ＝ Pessoa|nacionalidade={{#if:x|a|b}}'),box('nome ＝ Pessoa|nacionalidade={{subst:Modelo}}'),box('nome ＝ Pessoa|child=sim'),box('nome ＝ Pessoa|embed=yes'),
  box('nome ＝ Pessoa|subcaixa=sim'),box('fundo=banda|no\u200Bme=Pessoa','Info/Música/artista'),box('nome=Pessoa|imagem_tamanho=200pxpx|imagemtamanho=200px'),
  box('nome=Pessoa|imagem_tamanho=200pxpx|landscape=sim'),box('nome=Pessoa|imagem_tamanho=200pxpx|landscape=não'),
  '{{Info/Biografia|nome ＝ Pessoa|dados={{Info/Biografia|nome=Outra pessoa}}}}'+lead,
  '{{Info/Biografia|nome ＝ Pessoa}}\n{{Info/Ator|nome=Outra pessoa}}'+lead,
  '{{Info/Biografia|nome ＝ Pessoa}}\n{{Infobox person|name=Other person}}'+lead,
  '== Biografia ==\n{{Info/Biografia|nome ＝ Pessoa}}'+lead,
  '<nowiki>{{Info/Biografia|nome ＝ Pessoa}}</nowiki>'+lead,
  '<syntaxhighlight lang="wikitext">{{Info/Biografia|nome ＝ Pessoa}}</syntaxhighlight>'+lead,
  '<pre>{{Info/Biografia|nome ＝ Pessoa}}</pre>'+lead,
  '<code>{{Info/Biografia|nome ＝ Pessoa}}</code>'+lead,
  '<!-- {{Info/Biografia|nome ＝ Pessoa}} -->'+lead,
  '<blockquote>\n{{Info/Biografia|nome ＝ Pessoa}}\n</blockquote>'+lead,
  '<div>\n{{Info/Biografia|nome ＝ Pessoa}}\n</div>'+lead,
  '<ref>\n{{Info/Biografia|nome ＝ Pessoa}}\n</ref>'+lead,
  '```wikitext\n{{Info/Biografia|nome ＝ Pessoa}}\n```'+lead,
  '{|\n|{{Info/Biografia|nome ＝ Pessoa}}\n|}'+lead,
  '{{INFO/Biografia|nome ＝ Pessoa}}'+lead,'{{info/biografia|nome ＝ Pessoa}}'+lead,
  '{{Info/biografia|nome ＝ Pessoa}}'+lead,'{{Info/Biografia|nome ＝ Pessoa}'+lead,
  '{{Infobox person|name ＝ Example}}'+lead,box('nome ＝ Pessoa','Info/Não existe'),box('nome ＝ Pessoa','Info/Empresa'),
  '* {{Info/Biografia|nome ＝ Pessoa}}'+lead,': {{Info/Biografia|nome ＝ Pessoa}}'+lead,box('nome ＝ Pessoa')+'\n~~~~'
 ];
 for(const source of negatives)check('ambiguous or protected source '+hash(source).slice(0,14),()=>prove(source,source));
 for(const name of ['Info/Ator','Info/Militar','Info/Modelo','Info/Político','Info/Futebol','Info/Artista marcial','Info/Magistrado','Info/Criminoso'])
  for(const key of ['imagem_tamanho','tamanho_imagem','tamanho imagem','largura'])check('unproven width grammar '+name+' '+key,()=>{
   const source=box('nome=Pessoa de teste|'+key+'=200pxpx',name);prove(source,source);
  });
 for(const value of ['0pxpx','1pxpx','9pxpx','501pxpx','999pxpx','1000pxpx','0200pxpx','-200pxpx','200.0pxpx','200,0pxpx','200PXpx','200pxPX','200 pxpx','200px px','200pxpxpx','200x300pxpx','200pxpx<ref>Fonte.</ref>','{{nowrap|200pxpx}}','200px','200','200%','20em'])
  check('unproven width value '+value,()=>prove(box('imagem_tamanho='+value),box('imagem_tamanho='+value)));
 for(const options of [{namespaceNumber:undefined},{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:828},
  {sectionOnly:true},{section:0},{section:'1'},{section:'new'},{discussionPage:true},{redirectPage:true},{disambiguationPage:true},
  {pageRedirect:true},{pageDisambiguation:true},{contentModel:'javascript'},{model:'Scribunto'},{infoboxes:false},{markup:false},
  {structuralRepairs:false},{automaticFieldSyntax:false},{pageTitle:'Lista de pessoas'},{pageTitle:'Anexo:Pessoas'}])
  check('scope optout '+JSON.stringify(options),()=>prove(box('nome ＝ Pessoa'),box('nome ＝ Pessoa'),[],options));
 check('invisible characters in data are retained',()=>{
  const source=box('nome=Pessoa\u200B de\uFEFF teste|imagem_legenda=Texto ＝ dado|sepultamento=200pxpx');prove(source,source);
 });
 check('large complex unchanged tail',()=>{
  const end='\n\n== Dados ==\n'+('Texto com {{lang|en|word}} e [[Ligação|rótulo]]<ref>Fonte.</ref>.\n'.repeat(3500));
  prove(box('no\u200Bme=Pessoa')+end,box('nome=Pessoa')+end,['fieldInvisibleKey']);
 });
}
for(const input of runtimeInputs){report.checks++;if(hash(fs.readFileSync(input.file))!==input.sha256){report.status='failed';report.failures.push({bundle:path.basename(input.file),id:'runtime-input-immutable',message:'The executed release bundle changed during the test'});}}
const output=process.env.REVISAWIKI_REPORT_DIR;
if(output){fs.mkdirSync(path.resolve(root,output),{recursive:true});fs.writeFileSync(path.resolve(root,output,'field_syntax.json'),JSON.stringify(report,null,2)+'\n');}
process.stdout.write(JSON.stringify({version:report.version,kind:report.kind,status:report.status,cases:report.cases.length,checks:report.checks,failures:report.failures,networkRequests:0,wikipediaWrites:0})+'\n');
if(report.failures.length)process.exitCode=1;
