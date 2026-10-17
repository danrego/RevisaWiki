'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:
 ['RevisaWiki_v2_15_1.js','RevisaWiki_v2_15_1_completo.js'].map(name=>path.join(root,'dist/2.15.1',name));
const report={version:'2.15.1',kind:'biography-image-alt',status:'passed',cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0,bundles:[]},runtimeInputs=[];
function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
function load(file){
 const raw=fs.readFileSync(file),sha256=hash(raw),absolute=path.resolve(file),api=require(absolute);
 assert.equal(typeof api.v2151BiographyImageAltPlan,'function','The actual release bundle must contain the tested implementation');
 report.bundles.push({file:path.basename(file),sha256,bytes:raw.length});runtimeInputs.push({file:absolute,sha256});return api;
}
for(const file of files){
 const api=load(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',contentModel:'wikitext'};
 const check=(id,run)=>{try{run();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}};
 const tail="\n\n'''Pessoa de teste''' é uma pesquisadora.\n\n== Biografia ==\nTexto.\n{{Referências}}",box=(value,extra='',name='Info/Biografia')=>'{{'+name+'|nome=Pessoa de teste|imagem='+value+extra+'}}'+tail;
 const refInventory=value=>(value.match(/<ref\b[^>]*?\/\s*>|<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi)||[]).sort();
 function prove(source,expected,options={},expectedCount=source===expected?0:2){
  const settings={...cfg,...options},plan=api.v2151BiographyImageAltPlan(source,settings);
  eq(plan.text,expected,'The exact endpoint matches the independent native field expansion');
  eq(plan.edits.length,Number(source!==expected),'There is one image conversion or no edit');
  eq(api.v2151BiographyImageAltProof(source,expected,plan,settings),true,'A fresh source-bound plan proves the endpoint');
  const counts={},actual=api.automaticBiographyImageAlt(source,settings,key=>counts[key]=(counts[key]||0)+1);
  eq(actual,expected,'The wrapper applies the proved source-bound conversion');
  eq(counts,source===expected?{}:{biographyImageAlt:expectedCount},'Each actually changed filename ALT size or caption field counts once');
  eq(plan.edits[0]?.proof.changeRules.length||0,expectedCount,'Field-level proof accounting matches the independently specified count');
  eq(refInventory(source),refInventory(expected),'Every literal source reference and call is retained byte-identically');
  eq(api.v2151BiographyImageAltPlan(expected,settings).text,expected,'A second pass is byte-identical');
  if(source!==expected){
   eq(api.v2151BiographyImageAltProof(source+' ',expected,plan,settings),false,'A stale source cannot reuse the proof');
   eq(api.v2151BiographyImageAltProof(source,expected,{...plan,edits:[]},settings),false,'A missing edit witness cannot reuse the proof');
   eq(api.v2151BiographyImageAltProof(source,expected+' ',plan,settings),false,'A different output cannot reuse the proof');
  }
 }
 for(const prefix of ['Ficheiro','Imagem','Arquivo','File','Image'])for(const ext of ['jpg','jpeg','png','gif','webp','svg','tif','tiff'])check('filename '+prefix+' '+ext,()=>{
  const image='Retrato.'+ext;prove(box('[['+prefix+':'+image+'|alt=Uma pessoa]]'),box(image,'|alt=Uma pessoa'));
 });
 for(const options of ['thumb|200px|alt=Uma pessoa|Legenda exata.','alt=Uma pessoa|miniatura|200px|Legenda exata.','200px|Legenda exata.|alt=Uma pessoa','sem moldura|alt=Uma pessoa|200px|Legenda exata.'])check('finite option order '+hash(options).slice(0,12),()=>{
  prove(box('[[Ficheiro:Retrato.jpg|'+options+']]'),box('Retrato.jpg','|alt=Uma pessoa|imagem_tamanho=200px|imagem_legenda=Legenda exata.'),{},4);
 });
 for(const name of ['Info/Biografia','Info/Cientista','Info/Escritor','Info/Autor','Info/Jornalista'])check('pinned biography contract '+name,()=>{
  prove(box('[[Ficheiro:Retrato.jpg|alt=Uma pessoa|Legenda exata.]]','',name),box('Retrato.jpg','|alt=Uma pessoa|imagem_legenda=Legenda exata.',name),{},3);
 });
 for(const alt of ['Uma pessoa.','Texto = exato','Texto com {{lang|fr|mot}}','Texto com [[Rosto|rosto]]','Uma pessoa<ref name="alternativa">Fonte da imagem.</ref>'])check('literal ALT '+hash(alt).slice(0,12),()=>{
  prove(box('[[Ficheiro:Retrato.jpg|alt='+alt+']]'),box('Retrato.jpg','|alt='+alt));
 });
 for(const caption of ['Legenda exata.','Retrato em [[Cidade|uma cidade]].','Retrato em {{DataExt|1|2|2000}}.','Legenda<ref>Fonte exata.</ref>','Legenda<ref name="foto">{{Citar web|url=https://example.invalid/a|titulo=Fonte}}</ref>'])check('literal caption '+hash(caption).slice(0,12),()=>{
  prove(box('[[Ficheiro:Retrato.jpg|alt=Uma pessoa|'+caption+']]'),box('Retrato.jpg','|alt=Uma pessoa|imagem_legenda='+caption),{},3);
 });
 for(const extra of ['|alt=Uma pessoa','|alt=','|imagem_legenda=Legenda exata.','|imagem_tamanho=200px'])check('existing compatible destination '+hash(extra).slice(0,12),()=>{
  const source=box('[[Ficheiro:Retrato.jpg|200px|alt=Uma pessoa|Legenda exata.]]',extra);
  const expected=extra==='|alt=Uma pessoa'?box('Retrato.jpg',extra+'|imagem_tamanho=200px|imagem_legenda=Legenda exata.'):
   extra==='|alt='?box('Retrato.jpg','|alt=Uma pessoa|imagem_tamanho=200px|imagem_legenda=Legenda exata.'):
   extra.startsWith('|imagem_legenda')?box('Retrato.jpg',extra+'|alt=Uma pessoa|imagem_tamanho=200px'):
   box('Retrato.jpg',extra+'|alt=Uma pessoa|imagem_legenda=Legenda exata.');
  prove(source,expected,{},extra==='|alt='?4:3);
 });
 for(const newline of ['\n','\r\n'])check('multiline source whitespace '+JSON.stringify(newline),()=>{
  const source='{{Info/Biografia'+newline+' |nome = Pessoa de teste'+newline+' |imagem = [[Ficheiro:Retrato.jpg|alt=Uma pessoa|Legenda exata.]]'+newline+' |alt = '+newline+'}}'+tail;
  const expected='{{Info/Biografia'+newline+' |nome = Pessoa de teste'+newline+' |imagem = Retrato.jpg'+newline+' |alt = Uma pessoa'+newline+'| imagem_legenda = Legenda exata.'+newline+'}}'+tail;
  prove(source,expected,{},3);
 });
 const uncertainValues=[
  '[[Ficheiro:Retrato.jpg|alt=]]','[[Ficheiro:Retrato.jpg|alt= ]]','[[Ficheiro:Retrato.jpg|alt= Uma pessoa]]','[[Ficheiro:Retrato.jpg|alt=Uma pessoa ]]',
  '[[Ficheiro:Retrato.jpg|thumb|Legenda sem ALT]]','[[Ficheiro:Retrato.jpg|alt=Uma pessoa|alt=Outra pessoa]]',
  '[[Ficheiro:Retrato.jpg|alt=Uma pessoa|left]]','[[Ficheiro:Retrato.jpg|alt=Uma pessoa|link=Outra página]]',
  '[[Ficheiro:Retrato.jpg|alt=Uma pessoa|upright=1.5]]','[[Ficheiro:Retrato.jpg|alt=Uma pessoa|200x300px]]',
  '[[Ficheiro:Retrato.jpg|alt=Uma pessoa|600px]]','[[Ficheiro:Retrato.jpg|alt=Uma pessoa|200px|250px]]',
  '[[Ficheiro:Retrato.jpg|alt=Uma pessoa|thumb|frameless]]','[[Ficheiro:Retrato.jpg|alt=Uma pessoa|Legenda A|Legenda B]]',
  '[[Ficheiro:Retrato.jpg|alt=Uma pessoa| Legenda com bordas ]]','[[Ficheiro:Retrato.jpg|alt=Uma pessoa|opção=desconhecida]]',
  '[[Ficheiro:Retrato.jpg|ALT=Uma pessoa]]','[[Ficheiro:Retrato.jpg|alt =Uma pessoa]]',
  '[[Ficheiro:Retrato.jpg|alt=Uma pessoa|Legenda<!-- anotação -->]]','[[Ficheiro:Retrato.jpg|alt=Uma pessoa<!-- anotação -->]]',
  '[[Ficheiro:Retrato.jpg|alt=Uma pessoa|Legenda<ref>Fonte sem fim]]','[[Ficheiro:Retrato.jpg|alt=<ref>Fonte sem fim]]',
  '[[Ficheiro:Retrato.jpg|alt=Uma pessoa|Legenda com {{{variável}}}]]','[[Ficheiro:Retrato.jpg|alt={{{variável}}}]]',
  '[[Ficheiro:Retrato.jpg|alt=Uma pessoa|[[Ficheiro:Outra.jpg]]]]','[[Ficheiro:Retrato.jpg|alt=Uma pessoa|[[Categoria:Teste]]]]',
  '[[Ficheiro:Retrato.pdf|alt=Uma pessoa]]','[[Ficheiro:Outro:Retrato.jpg|alt=Uma pessoa]]',
  '[[Ficheiro:Retrato.jpg|alt=Uma pessoa]] texto externo','[[Ficheiro:Retrato.jpg|alt=Uma pessoa]'
 ];
 for(const value of uncertainValues)check('uncertain image preserved '+hash(value).slice(0,12),()=>prove(box(value),box(value)));
 for(const extra of ['|alt=Outra pessoa','|alt=Uma pessoa|alt=Uma pessoa','|imagem_legenda=Outra legenda','|legenda=|imagem_legenda=',
  '|imagem_tamanho=250px','|imagem_tamanho=|imagem tamanho=','|landscape=sim','|imagem2=Outra.jpg','|foto=Outra.jpg','|child=sim','|embed=yes'])check('destination conflict preserved '+hash(extra).slice(0,12),()=>{
  const source=box('[[Ficheiro:Retrato.jpg|200px|alt=Uma pessoa|Legenda exata.]]',extra);prove(source,source);
 });
 check('duplicate reference destination is preserved',()=>{
  const caption='Legenda<ref name="foto">Fonte exata.</ref>',source=box('[[Ficheiro:Retrato.jpg|alt=Uma pessoa|'+caption+']]','|imagem_legenda='+caption);prove(source,source);
 });
 const simple=box('[[Ficheiro:Retrato.jpg|alt=Uma pessoa]]');
 for(const source of ['<nowiki>'+simple+'</nowiki>','<syntaxhighlight lang="wikitext">'+simple+'</syntaxhighlight>','<ref>'+simple+'</ref>',
  '{{Modelo|caixa='+simple+'}}','{|\n|'+simple+'\n|}','<div>'+simple+'</div>',' '+simple,
  simple+'\n{{Info/Biografia|nome=Outra pessoa}}'])check('uncertain context preserved '+hash(source).slice(0,12),()=>prove(source,source));
 for(const name of ['Info/Ator','Info/Político','Info/Música/artista','Info/Futebol','Info/Droga','Info/Senador do Império do Brasil','Info/Não existe'])check('unverified ALT destination '+name,()=>{
  const source=box('[[Ficheiro:Retrato.jpg|alt=Uma pessoa]]','',name);prove(source,source);
 });
 for(const options of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:828},{sectionOnly:true},{section:0},{section:1},
  {discussionPage:true},{redirectPage:true},{disambiguationPage:true},{pageRedirect:true},{pageDisambiguation:true},{contentModel:'javascript'},
  {automaticInfoboxImages:false},{infoboxes:false},{markup:false},{pageTitle:'Lista de pessoas'}])check('scope optout '+JSON.stringify(options),()=>prove(simple,simple,options));
 check('complex article tail is preserved',()=>{
  const rest='\n'+('Texto com [[Ligação|rótulo]] e {{lang|fr|mot}}.\n'.repeat(6000));
  prove(simple+rest,box('Retrato.jpg','|alt=Uma pessoa')+rest);
 });
}
for(const input of runtimeInputs){report.checks++;if(hash(fs.readFileSync(input.file))!==input.sha256){report.status='failed';report.failures.push({bundle:path.basename(input.file),id:'runtime-input-immutable',message:'The executed release bundle changed during the test'});}}
if(process.env.REVISAWIKI_REPORT){fs.mkdirSync(path.dirname(process.env.REVISAWIKI_REPORT),{recursive:true});fs.writeFileSync(process.env.REVISAWIKI_REPORT,JSON.stringify(report,null,2)+'\n');}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.failures.length)process.exitCode=1;
