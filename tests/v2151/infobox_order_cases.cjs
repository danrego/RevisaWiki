'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),Module=require('node:module');
const root=path.resolve(__dirname,'../..'),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:
 ['RevisaWiki_v2_15_1.js','RevisaWiki_v2_15_1_completo.js'].map(name=>path.join(root,'dist/2.15.1',name));
const report={version:'2.15.1',kind:'infobox-lead-order',status:'passed',bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
function load(file){
 const source=fs.readFileSync(file,'utf8');
 assert(source.includes('function v2151InfoboxOrderPlan('),'The actual published module contains the helper without test injection');
 report.bundles.push({file:path.basename(file),sha256:hash(fs.readFileSync(file)),bytes:fs.statSync(file).size});
 const compiled=new Module(path.resolve(file),module);compiled.filename=path.resolve(file);compiled.paths=module.paths;compiled._compile(source,compiled.filename);return compiled.exports;
}
for(const file of files){
 const api=load(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',contentModel:'wikitext'};
 const check=(id,run)=>{try{run();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}};
 const box='{{Info/Biografia|nome=Pessoa de teste}}',lead="'''Pessoa de teste''' é uma pesquisadora.",tail='\n\n== Biografia ==\nTexto.\n{{Referências}}';
 function prove(source,expected,options={}){
  const settings={...cfg,...options},plan=api.v2151InfoboxOrderPlan(source,settings);
  eq(plan.text,expected,'The exact source-bound endpoint matches the independent literal swap');
  eq(plan.edits.length,Number(source!==expected),'There is exactly one relocation or no edit');
  eq(api.v2151InfoboxOrderProof(source,expected,plan,settings),true,'The original source and inverse swap prove the planned endpoint');
  const removed=source!==expected?(source.match(/^ +(?=\{\{Info\/)/m)?.[0].length||0):0;
  eq(source.length-expected.length,removed,'Only the independently counted leading ASCII spaces can be removed');
  const counts={},result=api.automaticInfoboxOrder(source,settings,key=>counts[key]=(counts[key]||0)+1);
  eq(result,expected,'The automation wrapper uses the exact same source-bound plan');
  const order=source!==expected&&source.indexOf("'''Pessoa de teste'''")<source.indexOf('{{Info/');
  eq(counts,source===expected?{}:{...(order?{infoboxLeadOrder:1}:{}),...(removed?{infoboxIndentation:1}:{})},'Each relocation and accidental indentation is counted once');
  eq(api.v2151InfoboxOrderPlan(expected,settings).text,expected,'A second pass is byte-identical');
  if(source!==expected){
   eq(api.v2151InfoboxOrderProof(source+' ',expected,plan,settings),false,'A stale source cannot reuse the proof');
   eq(api.v2151InfoboxOrderProof(source,expected,{...plan,edits:[]},settings),false,'An erased edit witness cannot reuse the proof');
   eq(api.v2151InfoboxOrderProof(source,expected+' ',plan,settings),false,'A different output cannot reuse the proof');
  }
 }
 for(const gap of ['\n','\n\n','\n\n\n',' \n\t\n','\r\n','\r\n\r\n'])for(const suffix of ['',tail,'\r\n\r\n== Biografia ==\r\nTexto.'])check('literal separator '+JSON.stringify([gap,suffix.length]),()=>{
  prove(lead+gap+box+suffix,box+gap+lead+suffix);
 });
 for(const prefix of ['','\n','\uFEFF','{{Ver desambig|outro tema}}\n','{{Mais fontes|data=outubro de 2026}}\n\n',
  '{{Ver desambig|outro tema}}\r\n{{Reciclagem|data=outubro de 2026}}\r\n\r\n'])check('preserved prefix '+hash(prefix).slice(0,12),()=>{
  prove(prefix+lead+'\n'+box+tail,prefix+box+'\n'+lead+tail);
 });
 for(const name of ['Info/Biografia','Info/Futebol','Info/Futebolista','Info/Ator','Info/Político','Info/Cientista','Info/Escritor','Info/Tenista'])check('catalogued person box '+name,()=>{
  const b='{{'+name+'|nome=Pessoa de teste}}';prove(lead+'\n'+b+tail,b+'\n'+lead+tail);
 });
 for(const fields of ['|nascimento_data={{Dni|1|2|1980}}','|imagem=Retrato.png|imagem_legenda=Um retrato.',
  '|filhos=Nome<br />Outro nome','|nascimento_local=[[Cidade]]|nacionalidade={{FRAn|a}}'])check('native field payload '+hash(fields).slice(0,12),()=>{
  const b='{{Info/Biografia|nome=Pessoa de teste'+fields+'}}';prove(lead+'\n'+b+tail,b+'\n'+lead+tail);
 });
 for(const [a,b]of [
  ['<ref>Fonte da introdução.</ref>','<ref>Fonte da caixa.</ref>'],
  ['<ref name="origem">Fonte exata.</ref>','<ref name="origem" />'],
  ['<ref name="origem" />','<ref name="origem">Fonte exata.</ref>'],
  ['<ref name="origem">Fonte exata.</ref>','<ref name="origem">Fonte exata.</ref>'],
  ['<ref name="x" group="a">Fonte A.</ref>','<ref name="x" group="b">Fonte B.</ref>'],
  ['<ref>{{Citar web|url=https://example.invalid/a|titulo=Fonte A}}</ref>','<ref>{{Citar livro|titulo=Fonte B|ano=2000}}</ref>']
 ])check('reference payload '+hash(a+b).slice(0,12),()=>{
  const l=lead+a,bx='{{Info/Biografia|nome=Pessoa de teste|ocupação=pesquisadora'+b+'}}',source=l+'\n'+bx+tail,expected=bx+'\n'+l+tail;
  prove(source,expected);
  const refs=text=>(text.match(/<ref\b[^>]*?\/\s*>|<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi)||[]).sort();
  eq(refs(source),refs(expected),'Every literal reference call and definition survives byte-identically');
 });
 for(const indent of [' ','  ','        '])for(const prefix of ['','{{Ver desambig|outro tema}}\n','{{Mais fontes|data=outubro de 2026}}\r\n\r\n']){
  check('indented prose-first box '+hash(indent+prefix).slice(0,12),()=>prove(prefix+lead+'\n'+indent+box+tail,prefix+box+'\n'+lead+tail));
  check('indented box-first box '+hash(indent+prefix).slice(0,12),()=>prove(prefix+indent+box+'\n'+lead+tail,prefix+box+'\n'+lead+tail));
 }
 check('indentation inside fields is preserved',()=>{
  const b='{{Info/Biografia\n |nome = Pessoa de teste\n |ocupação = pesquisadora\n}}';
  prove(lead+'\n  '+b+tail,b+'\n'+lead+tail);
 });
 check('indentation optout',()=>prove(' '+box+'\n'+lead+tail,' '+box+'\n'+lead+tail,{automaticInfoboxOrder:false}));
 check('disambiguated title',()=>prove(lead+'\n'+box+tail,box+'\n'+lead+tail,{pageTitle:'Pessoa de teste (pesquisadora)'}));
 const forbidden=[
  box+'\n'+lead+tail,
  'Pessoa de teste é uma pesquisadora.\n'+box+tail,
  "'''Outra pessoa''' é uma pesquisadora.\n"+box+tail,
  lead+' '+box+tail,
  lead+'\n\t'+box+tail,
  lead+'\n \t'+box+tail,
  ' '+box+'\n'+"'''Outra pessoa''' é uma pesquisadora."+tail,
  'Texto anterior.\n '+box+'\n'+lead+tail,
  '<ref> '+box+'</ref>\n'+lead+tail,
  '{{Modelo desconhecido|caixa= '+box+'}}\n'+lead+tail,
  lead+'\n'+box+' texto na mesma linha'+tail,
  lead+'\n'+box+'\n'+box+tail,
  lead+'\n{{Info/Droga|nome=Pessoa de teste}}'+tail,
  lead+'\n{{Info/Não existe|nome=Pessoa de teste}}'+tail,
  lead+'\n{{INFO/Biografia|nome=Pessoa de teste}}'+tail,
  lead+'\n== Biografia ==\n'+box+'\nTexto.',
  '{{Modelo desconhecido}}\n'+lead+'\n'+box+tail,
  '{{Ver desambig|outro tema}} '+lead+'\n'+box+tail,
  '{{Ver desambig|{{#if:x|a|b}}}}\n'+lead+'\n'+box+tail,
  '<!-- orientação de posição -->\n'+lead+'\n'+box+tail,
  lead+'<!-- comentário de posição -->\n'+box+tail,
  '<div>\n'+lead+'\n'+box+'\n</div>'+tail,
  '<span>\n'+lead+'\n'+box+'\n</span>'+tail,
  '<blockquote>\n'+lead+'\n'+box+'\n</blockquote>'+tail,
  '<nowiki>\n'+lead+'\n'+box+'\n</nowiki>'+tail,
  '<syntaxhighlight lang="wikitext">\n'+lead+'\n'+box+'\n</syntaxhighlight>'+tail,
  '{|\n|'+lead+'\n'+box+'\n|}'+tail,
  lead+'\n* lista\n'+box+tail,
  lead+'\n[[Arquivo:Retrato.png|miniatura]]\n'+box+tail,
  lead+'\n{{Modelo desconhecido}}\n'+box+tail,
  lead+'{{#if:x|texto|outro texto}}\n'+box+tail,
  lead+'\n{{Info/Biografia|nome={{{nome|Pessoa de teste}}}}}'+tail,
  lead+'\n{{Info/Biografia|nome=Pessoa de teste|child=sim}}'+tail,
  lead+'\n{{Info/Biografia|nome=Pessoa de teste|embed=yes}}'+tail,
  lead+'\n{{Info/Biografia|nome=Pessoa de teste|estilo=float:left}}'+tail,
  lead+'\n{{Info/Biografia|nome=Pessoa de teste|dados={{Info/Ator|nome=Pessoa de teste}}}}'+tail,
  lead+'\n{{Info/Biografia|nome=Pessoa de teste|dados={{Referências}}}}'+tail,
  lead+'\n{{Info/Biografia|nome=Pessoa de teste|dados=<references />}}'+tail,
  lead+'<ref name="x">Fonte A.</ref>\n{{Info/Biografia|nome=Pessoa de teste|ocupação=pesquisadora<ref name="x">Fonte B.</ref>}}'+tail,
  lead+'<ref follow="x">Continuação.</ref>\n'+box+tail,
  lead+'<ref name="{{nome}}">Fonte.</ref>\n'+box+tail,
  lead+'<ref name="x&amp;y">Fonte.</ref>\n'+box+tail,
  lead+'<ref>Fonte sem fechamento.\n'+box+tail,
  lead+'\n{{Info/Biografia|nome=Pessoa de teste}'+tail,
  'Texto anterior.\n'+lead+'\n'+box+tail
 ];
 for(const source of forbidden)check('uncertain source preserved '+hash(source).slice(0,12),()=>prove(source,source));
 for(const options of [
  {namespaceNumber:undefined},{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:828},
  {sectionOnly:true},{section:0},{section:1},{section:'new'},{discussionPage:true},{redirectPage:true},{disambiguationPage:true},
  {pageRedirect:true},{pageDisambiguation:true},{contentModel:'javascript'},{model:'Scribunto'},
  {infoboxes:false},{structuralRepairs:false},{automaticInfoboxOrder:false},{pageTitle:''},{pageTitle:'Outro título'}
 ])check('scope optout '+JSON.stringify(options),()=>prove(lead+'\n'+box+tail,lead+'\n'+box+tail,options));
 check('large complex tail does not enter moved interval',()=>{
  const rest='\n\n== Biografia ==\n'+('Texto com [[Ligação|rótulo]] e {{lang|fr|mot}}.\n'.repeat(6000))+'\n{{Referências}}';
  prove(lead+'\n'+box+rest,box+'\n'+lead+rest);
 });
 check('large box-first page is unchanged',()=>{
  const source=box+'\n'+lead+'\n'+('Texto.\n'.repeat(18000));prove(source,source);
 });
}
for(const file of files){const saved=report.bundles.find(row=>row.file===path.basename(file));assert(saved&&saved.sha256===hash(fs.readFileSync(file)),'The executed bundle remains unchanged');}
if(process.env.REVISAWIKI_REPORT){fs.mkdirSync(path.dirname(process.env.REVISAWIKI_REPORT),{recursive:true});fs.writeFileSync(process.env.REVISAWIKI_REPORT,JSON.stringify(report,null,2)+'\n');}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.failures.length)process.exitCode=1;
