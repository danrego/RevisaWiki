'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),Module=require('node:module');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),isolated=process.argv.includes('--isolated'),args=process.argv.slice(2).filter(value=>value!=='--isolated');
const files=args.length?args:process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:
 ['RevisaWiki_v2_16_0.js','RevisaWiki_v2_16_0_completo.js'].map(name=>path.join(root,'dist/2.16.0',name));
const report={version:'2.16.0',kind:'source-bound-biography-transfer',status:'passed',isolated,runtimeInjection:[],cases:0,checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);},inputs=[];
function load(file){
 let source=fs.readFileSync(file,'utf8');
 if(!source.includes('function v216TransferPlan(')){
  assert(isolated,'The final distribution must include the actual transfer implementation');
  const addition=fs.readFileSync(path.join(root,'src/v2_16/biography_transfer.js'),'utf8'),exports=[...addition.matchAll(/^    function (\w+)\(/gm)].map(match=>match[1]);
  source=source.replace('    const api = {',addition+'\n    const api = {'+exports.join(',')+',');report.runtimeInjection.push(path.basename(file));
 }
 const compiled=new Module(path.resolve(file),module);compiled.filename=path.resolve(file);compiled.paths=module.paths;compiled._compile(source,compiled.filename);return compiled.exports;
}
for(const file of files){
 const api=load(file),bundle=path.basename(file),raw=fs.readFileSync(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de exemplo',contentModel:'wikitext',automaticBiographyFields:true},
  name="'''Pessoa de exemplo'''",born='{{DataExt|2|3|1930}}',died='{{DataExt|5|6|2010}}',place='[[Cidade Alfa]]',other='[[Cidade Beta]]',
  rb='<ref>Fonte da data inicial.</ref>',rp='<ref>Fonte do lugar inicial.</ref>',rd='<ref>Fonte da data final.</ref>',rl='<ref>Fonte do lugar final.</ref>',
  tail='\n\n== Biografia ==\nTexto intacto.\n{{Referências}}',box=fields=>'{{Info/Biografia|nome=Pessoa de exemplo'+fields+'}}',
  page=(fields,tuple,verb='foi')=>box(fields)+'\n'+name+(tuple?' ('+tuple+')':'')+' '+verb+' uma pessoa.'+tail;
 report.bundles.push({name:bundle,sha256:sha(raw),bytes:raw.length});inputs.push({file,sha256:sha(raw)});
 const check=(id,run)=>{report.cases++;try{run();}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}};
 function prove(source,expected,rules=[],extra={}){
  const options={...cfg,...extra},plan=api.v216TransferPlan(source,options);
  eq(plan.text,expected,'The literal endpoint matches the independently written expectation');eq(plan.edits.length,Number(source!==expected),'The native box changes in one source-bound transaction');
  eq(plan.edits.flatMap(edit=>edit.proof.changeRules),rules,'Each inserted or separated field has one retained operation');
  eq(api.v216TransferEdits(source,options),plan.edits,'The edit finder and plan agree');eq(api.v216TransferProof(source,expected,plan,options),true,'The proof binds exact input, edits, references and output');
  eq(api.v216TransferPlan(expected,options).text,expected,'The exact transfer endpoint is idempotent');
  const counts={},actual=api.automaticBiographyTransfer(source,options,key=>counts[key]=(counts[key]||0)+1),wanted={};for(const rule of rules)wanted[rule]=(wanted[rule]||0)+1;
  eq(actual,expected,'The automatic wrapper applies the same transaction');eq(counts,wanted,'The wrapper counts each logical field operation');
  if(source!==expected){
   const edit=plan.edits[0];eq(source.slice(edit.start,edit.end),edit.proof.raw,'The proof retains the original box');eq(edit.text,edit.proof.canonical,'The proof retains the precise replacement');
   eq(source.slice(0,edit.start),expected.slice(0,edit.start),'All bytes before the infobox survive');
   eq(source.slice(edit.end),expected.slice(edit.start+edit.text.length),'The opening and every byte after the box remain unchanged');
   eq(api.v216TransferProof(source+' ',expected,plan,options),false,'A stale source cannot reuse a witness');eq(api.v216TransferProof(source,expected+' ',plan,options),false,'A changed endpoint cannot reuse a witness');
   eq(api.v216TransferProof(source,expected,{...plan,edits:[]},options),false,'Erased nested evidence is rejected');
   const forged=JSON.parse(JSON.stringify(plan));forged.edits[0].proof.phases[0].changeRules=[];eq(api.v216TransferProof(source,expected,forged,options),false,'Tampered nested operation evidence is rejected');
  }
 }
 const birthRule='biographyLeadToInfoboxBirth',deathRule='biographyLeadToInfoboxDeath';
 check('all four individually cited source facts',()=>{
  const tuple=place+rp+', '+born+rb+' – '+other+rl+', '+died+rd;
  prove(page('',tuple),page('|nascimento_data='+born+rb+'|local_nascimento='+place+rp+'|morte_data='+died+rd+'|local_morte='+other+rl,tuple),[birthRule,birthRule,deathRule,deathRule]);
 });
 for(const date of [born,'2 de março de 1930','1930-03-02','[[2 de março]] de [[1930]]','{{dni|2|3|1930|si}}'])check('literal complete date '+sha(date).slice(0,12),()=>{
  prove(page('',date+rb),page('|nascimento_data='+born+rb,date+rb),[birthRule]);
 });
 check('unreferenced place is not copied with the date reference',()=>{
  const tuple=place+', '+born+rb;prove(page('',tuple),page('|nascimento_data='+born+rb,tuple),[birthRule]);
 });
 check('separately cited place can fill the box beside an already matching date',()=>{
  const tuple=place+rp+', '+born;prove(page('|nascimento_data='+born,tuple),page('|nascimento_data='+born+'|local_nascimento='+place+rp,tuple),[birthRule]);
 });
 check('source for the complete opening never becomes a place source',()=>{
  const tuple=place+', '+born+rb;prove(page('|nascimento_data='+born,tuple),page('|nascimento_data='+born,tuple));
 });
 check('a present empty argument is not filled',()=>{
  prove(page('|nascimento_data=',born+rb),page('|nascimento_data=',born+rb));
 });
 check('an empty place stays empty while a missing date is filled',()=>{
  const tuple=place+rp+', '+born+rb;prove(page('|nascimento_local=',tuple),page('|nascimento_local=|nascimento_data='+born+rb,tuple),[birthRule]);
 });
 check('a named definition stays in the opening and is only reused in the box',()=>{
  const ref='<ref name="data">Fonte exata.</ref>',tuple=born+ref;prove(page('',tuple),page('|nascimento_data='+born+'<ref name="data" />',tuple),[birthRule]);
 });
 for(const attrs of [' name=origem',' name="origem" group="nota"'])check('literal resolved named reference '+sha(attrs).slice(0,12),()=>{
  const tuple=born+'<ref'+attrs+' />',end='\n<ref'+attrs+'>Fonte exata.</ref>';
  prove(page('',tuple)+end,page('|nascimento_data='+born+'<ref'+attrs+' />',tuple)+end,[birthRule]);
 });
 check('date-first separately sourced facts remain in the same opening order',()=>{
  const tuple=born+rb+', '+place+rp;prove(page('',tuple),page('|nascimento_data='+born+rb+'|local_nascimento='+place+rp,tuple),[birthRule,birthRule]);
 });
 check('finite native reference punctuation does not lose the place binding',()=>{
  const tuple=place+','+rp+' '+born+rb;prove(page('',tuple),page('|nascimento_data='+born+rb+'|local_nascimento='+place+rp,tuple),[birthRule,birthRule]);
 });
 for(const separator of ['\n','\r\n'])check('multiline native whitespace is retained '+JSON.stringify(separator),()=>{
  const source='{{Info/Biografia'+separator+'| nome = Pessoa de exemplo'+separator+'}}'+separator+name+' ('+born+rb+') foi uma pessoa.';
  const expected=source.replace(separator+'}}',separator+'| nascimento_data = '+born+rb+separator+'}}');prove(source,expected,[birthRule]);
 });
 for(const left of [born,'2 de março de 1930','1930-03-02','{{dni|2|3|1930|si}}'])for(const target of ['', '|nascimento_local='])check('packed date source preserved '+sha(left+target).slice(0,12),()=>{
  const source=page('|nascimento_data='+left+rb+', '+place+rp+target,'');
  const expected=page('|nascimento_data='+left+rb+(target?'|nascimento_local='+place+rp:'|local_nascimento='+place+rp),'');
  prove(source,expected,['biographyPackedDate','biographyPackedPlace']);
 });
 check('packed death fields preserve distinct references',()=>{
  prove(page('|morte_data='+died+rd+', '+other+rl,''),page('|morte_data='+died+rd+'|local_morte='+other+rl,''),['biographyPackedDate','biographyPackedPlace']);
 });
 for(const delimiter of ['<br>','<br/>','<br />','<BR />'])check('one literal line break splits individually cited facts '+delimiter,()=>{
  prove(page('|nascimento_data='+born+rb+delimiter+place+rp,''),page('|nascimento_data='+born+rb+'|local_nascimento='+place+rp,''),['biographyPackedDate','biographyPackedPlace']);
 });
 for(const delimiter of ['<br><br>','<br clear="all" />','<br class="quebra">','<br / >','<hr />','\n'])check('unproved packed delimiter '+sha(delimiter).slice(0,12),()=>{
  const source=page('|nascimento_data='+born+rb+delimiter+place+rp,'');prove(source,source);
 });
 check('a line break inside a source body is not a field boundary',()=>{
  const source=page('|nascimento_data='+born+'<ref>Fonte<br />da data.</ref>'+place+rp,'');prove(source,source);
 });
 check('packed field named definitions move with their own component',()=>{
  const date=born+'<ref name="data">Fonte da data.</ref>',location=place+'<ref name="local">Fonte do lugar.</ref>';
  prove(page('|nascimento_data='+date+', '+location,''),page('|nascimento_data='+date+'|local_nascimento='+location,''),['biographyPackedDate','biographyPackedPlace']);
 });
 check('packed split and independently cited lead fields compose',()=>{
  const tuple=born+rb+' – '+died+rd;
  prove(page('|nascimento_data='+born+rb+', '+place+rp,tuple),page('|nascimento_data='+born+rb+'|local_nascimento='+place+rp+'|morte_data='+died+rd,tuple),['biographyPackedDate','biographyPackedPlace',deathRule]);
 });
 const negativeSources=[
  page('',born),page('',place+', '+born),page('|nascimento_data='+died,born+rb),page('|nascimento_data=',born+rb),
  page('|nascimento_data='+born+'|data_nascimento=',born+rb),page('|nascimento_data='+born+'|data_nascimento='+born,born+rb),
  page('|nascimento_data={{#if:x|'+born+'|'+died+'}}',born+rb),page('|local_nascimento='+other,place+rp+', '+born+rb),
  page('|nascimento_cidade=',place+rp+', '+born+rb),page('|nascimento_data={{Dni|3|3|1930}}',place+rp+', '+born+rb),
  page('|morte_data='+born,place+rp+', '+born+rb+' – '+other+rl+', '+died+rd),
  page('',born+rb+' – '+died+rd,'é'),page('',born+rb+' – '+died+rd)+'\n[[Categoria:Pessoas vivas]]',
  page('',born+rb).replace('nome=Pessoa de exemplo','nome=Outra pessoa'),page('',born+rb).replace('nome=Pessoa de exemplo','nome='),
  page('',born+rb).replace('nome=Pessoa de exemplo','nome=Pessoa de exemplo|name=Pessoa de exemplo'),
  page('',born+rb).replace("'''Pessoa de exemplo'''","'''Outra pessoa'''"),page('',born+rb).replace('Info/Biografia','Infobox person'),
  page('|child=sim',born+rb),page('|incorporar=sim',born+rb),page('|calendário=juliano',born+rb),
  page('',born+'<ref name="sem destino" />'),page('',born+'<ref>Fonte sem fechamento.'),page('',born+'<ref></ref>'),
  page('',born+'<ref follow="data">Fonte.</ref>'),page('',born+'<ref name="data">Fonte A.</ref>')+'\n<ref name="data">Fonte B.</ref>',
  page('', '1930'+rb),page('', '02/03/1930'+rb),page('', 'cerca de 1930'+rb),page('', '{{DataExt|31|2|1930}}'+rb),
  page('', '{{DataExt|2|3|2999}}'+rb),page('', '{{DataExt|2|3|1500}}'+rb),page('', '{{DataExt|2|3|1800}}'+rb,'é'),
  page('',place+rp+', '+born+rb+' – '+other+rl+', {{DataExt|2|3|1900}}'+rd),
  page('',born+rb+' – '+died+rd+' – '+died+rd),page('', '{{lang|pt|2 de março de 1930}}'+rb),
  page('|nascimento_data='+born+rb+', '+place,''),page('|nascimento_data='+born+', '+place+rp,''),
  page('|nascimento_data='+born+rb+', '+place+rp+'|nascimento_local='+other,''),
  page('|nascimento_data='+born+rb+', '+place+rp+'|nascimento_local=|local_nascimento=',''),
  page('|nascimento_data='+born+rb+', '+place+rp, died+rb),
  page('|nascimento_data='+born+rb+', '+place+rp+'|morte_data={{DataExt|2|3|1900}}',''),
  page('|morte_data='+died+rd+', '+other+rl,'','é'),page('|nascimento_data='+place+rp+', '+born+rb,''),
  '<nowiki>'+page('',born+rb)+'</nowiki>','<blockquote>'+page('',born+rb)+'</blockquote>',
  '<!-- posição intencional -->\n'+page('',born+rb),'== Biografia ==\n'+page('',born+rb),
  box('')+'\n'+page('',born+rb),page('',born+rb)+'\n{{Info/Ator|nome=Outra pessoa}}'
 ];
 for(const source of negativeSources)check('unsafe source '+sha(source).slice(0,14),()=>prove(source,source));
 for(const key of ['nascimento_país','nascimento_pais','paisnatal','paísnatal','país de nascimento','pais_nascimento'])check('country conflict blocks only place '+key,()=>{
  const tuple=place+rp+', '+born+rb,fields='|'+key+'=País de exemplo';prove(page(fields,tuple),page(fields+'|nascimento_data='+born+rb,tuple),[birthRule]);
  const packed=page('|nascimento_data='+born+rb+', '+place+rp+fields,'');prove(packed,packed);
 });
 for(const field of ['sepultamento','enterro','enterro_local','resting_place'])check('burial remains byte exact '+field,()=>{
  const fields='|'+field+'=[[Lugar de exemplo]]<ref>Fonte do lugar.</ref>';
  prove(page(fields,born+rb),page(fields+'|nascimento_data='+born+rb,born+rb),[birthRule]);
 });
 for(const extra of [{namespaceNumber:undefined},{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:828},{sectionOnly:true},{section:0},{section:'1'},
  {discussionPage:true},{pageRedirect:true},{pageDisambiguation:true},{redirectPage:true},{disambiguationPage:true},{contentModel:'javascript'},{model:'Scribunto'},
  {automaticBiographyFields:false},{infoboxes:false},{markup:false},{structuralRepairs:false},{pageTitle:''},{pageTitle:'Lista de pessoas'},{pageTitle:'Anexo:Pessoas'}])
  check('scope decline '+JSON.stringify(extra),()=>{const source=page('',born+rb);prove(source,source,[],extra);});
 check('the independent lead option does not disable field transfers',()=>{
  prove(page('',born+rb),page('|nascimento_data='+born+rb,born+rb),[birthRule],{automaticBiographyLead:false});
 });
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'dist/2.15.1/Catalogo_ptwiki_RevisaWiki_v2_15_1.json'),'utf8')).infoboxes;
 for(const [native,profile]of Object.entries(catalog)){
  const contract=api.v216TransferContract(profile);if(!contract)continue;
  const type=contract.headers[0],music=/^info\/(?:música\/artista|artista musical|cantor|músico)$/.test(native),
   template=profile.title.replace(/^Predefinição:/i,''),start='{{'+template+'|'+type+'=Pessoa de exemplo'+(music?'|fundo=cantor_solo':''),
   tuple=place+rp+', '+born+rb+' – '+other+rl+', '+died+rd,
   source=start+'}}\n'+name+' ('+tuple+') foi uma pessoa.'+tail,
   expected=start+'|'+contract.birthDate[0]+'='+born+rb+'|'+contract.birthPlace[0]+'='+place+rp+'|'+contract.deathDate[0]+'='+died+rd+'|'+contract.deathPlace[0]+'='+other+rl+'}}\n'+name+' ('+tuple+') foi uma pessoa.'+tail;
  check('reviewed literal empty role family '+native,()=>prove(source,expected,[birthRule,birthRule,deathRule,deathRule]));
 }
 for(let month=1;month<=12;month++)for(const day of [1,15,28])for(const year of [1900,1930,1980])check('complete referenced Gregorian date '+[day,month,year].join('/'),()=>{
  const date='{{DataExt|'+[day,month,year].join('|')+'}}';prove(page('',date+rb),page('|nascimento_data='+date+rb,date+rb),[birthRule]);
 });
}
for(const input of inputs)eq(sha(fs.readFileSync(input.file)),input.sha256,'Executed runtime bytes remain immutable during the test');
if(process.env.REVISAWIKI_REPORT_DIR){const folder=path.resolve(root,process.env.REVISAWIKI_REPORT_DIR);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'transfer_cases.json'),JSON.stringify(report,null,2)+'\n');}
process.stdout.write(JSON.stringify({version:report.version,kind:report.kind,status:report.status,cases:report.cases,checks:report.checks,failures:report.failures,networkRequests:0,wikipediaWrites:0})+'\n');if(report.failures.length)process.exitCode=1;
