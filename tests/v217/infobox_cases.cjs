'use strict';
// Fictional fixtures execute the requested release files without source injection.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:
 ['RevisaWiki_v2_17_0.js','RevisaWiki_v2_17_0_completo.js'].map(name=>path.join(root,'dist/2.17.0',name));
const report={version:'2.17.0',kind:'native-infobox-accents-and-empty-aliases',status:'passed',bundles:[],cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,message){report.checks++;assert.deepEqual(a,b,message);}
function ok(a,message){report.checks++;assert(a,message);}
const accentCases=[
 [
  "Info/Biografia",
  "residencia",
  "residência"
 ],
 [
  "Info/Biografia",
  "educacao",
  "educação"
 ],
 [
  "Info/Biografia",
  "outras_ocupacoes",
  "outras_ocupações"
 ],
 [
  "Info/Biografia",
  "profissao",
  "profissão"
 ],
 [
  "Info/Biografia",
  "religiao",
  "religião"
 ],
 [
  "Info/Biografia",
  "organizacao",
  "organização"
 ],
 [
  "Info/Biografia",
  "titulos",
  "títulos"
 ],
 [
  "Info/Biografia",
  "nome_mae",
  "nome_mãe"
 ],
 [
  "Info/Futebolista",
  "posicao",
  "posição"
 ],
 [
  "Info/Futebolista",
  "pe",
  "pé"
 ],
 [
  "Info/Futebolista",
  "nascimento_pais",
  "nascimento_país"
 ],
 [
  "Info/Ator",
  "educacao",
  "educação"
 ],
 [
  "Info/Ator",
  "residencia",
  "residência"
 ],
 [
  "Info/Ator",
  "ocupacao",
  "ocupação"
 ],
 [
  "Info/Ator",
  "nome_mae",
  "nome_mãe"
 ],
 [
  "Info/Ator",
  "conjuge",
  "cônjuge"
 ],
 [
  "Info/Político",
  "religiao",
  "religião"
 ],
 [
  "Info/Político",
  "profissao",
  "profissão"
 ],
 [
  "Info/Político",
  "ocupacao",
  "ocupação"
 ],
 [
  "Info/Político",
  "residencia",
  "residência"
 ],
 [
  "Info/Político",
  "nome_mae",
  "nome_mãe"
 ]
];
const aliasCases=[
 ['Info/Biografia','ocupação','ocupações','presence'],['Info/Biografia','ocupação','ocupacao','presence'],
 ['Info/Biografia','ocupações','trabalho civil','presence'],['Info/Biografia','ocupacao','Ocupação','presence'],
 ['Info/Biografia','cônjuge','conjuge','presence'],['Info/Biografia','nome_completo','nome_de_batismo','presence'],
 ['Info/Biografia','website','site','presence'],['Info/Biografia','url','homepage','presence'],
 ['Info/Político','cônjuge','conjuge','presence'],['Info/Político','website','homepage','presence'],
 ['Info/Militar','cônjuge','conjuge','presence'],['Info/Modelo','conjuge','cônjuge','presence'],
 ['Info/Modelo','ocupacao','ocupação','presence'],['Info/Modelo','website','site','presence']
];
for(const file of files){
 const bytes=fs.readFileSync(file),source=bytes.toString(),api=require(path.resolve(file)),bundle=path.basename(file);
 report.bundles.push({file:bundle,sha256:hash(bytes),bytes:bytes.length});
 ok(source.includes('function v217InfoboxValuePlan('),'The actual release contains the new stage');
 eq(typeof api.v217InfoboxValueProof,'function','The source-bound proof is publicly testable');
 const cfg={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Pessoa de teste',contentModel:'wikitext',
  infoboxes:true,markup:true,syntaxRepairs:true,structuralRepairs:true,automaticBiographyFields:true,automaticInfoboxValues:true};
 const lead="\n\n'''Pessoa de teste''' é uma escritora.",tail='\n\n== Biografia ==\nTexto.\n{{Referências}}';
 const box=(fields,name='Info/Biografia')=>'{{'+name+'|nome=Pessoa de teste'+(name==='Info/Música/artista'?'|fundo=cantor_solo':'')+'|'+fields+'}}'+lead+tail;
 const check=(id,run)=>{report.cases++;try{run();}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}};
 function prove(before,expected,rules=[],options={}){
  const settings={...cfg,...options},plan=api.v217InfoboxValuePlan(before,settings);
  eq(plan.text,expected,'Exact independently specified endpoint');
  eq(api.v217InfoboxValueEdits(before,settings),plan.edits,'The public edit finder uses the same source');
  eq(plan.edits.flatMap(edit=>edit.proof.changeRules),rules,'Every retained operation is counted once');
  eq(api.v217InfoboxValueProof(before,expected,plan,settings),true,'The exact source and endpoint reproduce the witness');
  const counts={};eq(api.automaticInfoboxValues(before,settings,key=>counts[key]=(counts[key]||0)+1),expected,'Automation applies the same complete transaction');
  eq(counts,Object.fromEntries([...new Set(rules)].map(key=>[key,rules.filter(rule=>rule===key).length])),'Wrapper counts bind the actual operations');
  eq(api.v217InfoboxValuePlan(expected,settings).text,expected,'Second helper pass is byte-identical');
  const refs=text=>(text.match(/<ref\b[^>]*?\/\s*>|<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi)||[]);
  eq(refs(expected),refs(before),'All literal reference calls and bodies retain their order and bytes');
  if(before!==expected){
   const edit=plan.edits[0];eq(before.slice(edit.start,edit.end),edit.proof.raw,'Witness binds the original box');
   eq(api.v217InfoboxValueProof(before+' ',expected,plan,settings),false,'Stale source rejected');
   eq(api.v217InfoboxValueProof(before,expected+' ',plan,settings),false,'Changed endpoint rejected');
   const forged=JSON.parse(JSON.stringify(plan));forged.edits[0].proof.edits[0].text+='x';
   eq(api.v217InfoboxValueProof(before,expected,forged,settings),false,'Tampered local edit rejected');
   eq(api.v217InfoboxValueProof(before,expected,plan,{...settings,automaticInfoboxValues:false}),false,'Changed scope cannot reuse the witness');
   eq(edit.proof.minorSafe,rules.every(rule=>rule==='v217InfoboxEmptyAliases'),'Only native display-equivalent removals have a minor-safe witness');
  }
  return plan;
 }
 for(const [name,wrong,right]of accentCases)for(const value of ['Texto de teste',' [[Ligação de teste|rótulo]]<ref>Fonte sintética.</ref> '])check('sourced accent '+[name,wrong,hash(value).slice(0,8)].join('|'),()=>{
  prove(box(wrong+'='+value,name),box(right+'='+value,name),['v217InfoboxParameterAccents']);
 });
 for(const [name,wrong,right]of [['Info/Futebolista','POSICAO','posição'],['Info/Futebolista','nascimento pais','nascimento_país'],['Info/Biografia','Outras ocupacoes','outras_ocupações']])check('existing normalization composes with a sourced accent '+wrong,()=>{
  prove(box(wrong+'=Texto de teste',name),box(right+'=Texto de teste',name),['v217InfoboxParameterAccents']);
 });
 check('nested value markup is retained without interpretation',()=>{
  const value='{{lang|fr|Texte}}<ref>{{Citar livro|título=Fonte sintética|ano=2000}}</ref>';
  prove(box('profissao='+value),box('profissão='+value),['v217InfoboxParameterAccents']);
 });
 for(const [name,a,b,mode]of aliasCases)for(const swap of [false,true])for(const empty of ['',' \t ','\r\n'])for(const ref of ['','<ref name="prova">Fonte sintética.</ref>'])check('native alias precedence '+hash(JSON.stringify([name,a,b,mode,swap,empty,ref])).slice(0,14),()=>{
  const value='Texto de teste'+ref,fields=swap?a+'='+empty+'|'+b+'='+value:a+'='+value+'|'+b+'='+empty,
   expected=mode==='nonempty'||!swap?box((swap?b:a)+'='+value,name):box(fields,name);
  prove(box(fields,name),expected,mode==='nonempty'||!swap?['v217InfoboxEmptyAliases']:[]);
 });
 for(const fields of ['ocupação=Escritora|ocupações=Escritora','ocupação=Escritora|ocupações=Editora',
  'ocupação=|ocupações=Escritora','ocupação=|ocupações=','ocupação=Escritora|ocupações=|ocupacao=',
  'ocupação=Escritora|ocupações=<!-- não preencher -->','ocupação=Escritora|ocupações=&nbsp;',
  'ocupação=Escritora|ocupações=\u00a0','ocupação=Escritora|ocupações=\u200b',
  'profissão=|ocupação=Escritora','profissao=Editora|profissão=','educacao=Escola|educação=',
  'ocupacao=Escritora','conjuge=Pessoa de teste','agencia=Agência de teste','premio=Prêmio de teste',
  'parametro_desconhecido=','ocupação=Escritora|occupation=|ocupações=',
  'ocupação=Escritora|ocupações=|ocuapção=Editora','profissao=','profissao= \t '])check('explicit or uncertain content retained '+hash(fields).slice(0,12),()=>prove(box(fields),box(fields)));
 for(const [name,fields]of [['Info/Ciclista','ocupação=|profissão=Escritora'],['Info/Ciclista','data_nascimento=|nascimento_data=1980-02-01'],
  ['Info/Ator','nome=Pessoa de teste|profissao=Escritora'],['Info/Futebol','posicao=Defensora'],
  ['Info/Modelo','ocupacao=Escritora'],['Info/Magistrado','cônjuge=|conjuge=Pessoa de teste'],['Info/Magistrado','ocupacao=Escritora'],['Info/Biografia','organizacoes=Grupo'],['Info/Futebolista','morte_pais=País'],['Info/Ator','descricao=Legenda'],['Info/Biografia','ocupação=Escritora|ocupação=']])check('no generic inference '+name+hash(fields).slice(0,8),()=>prove(box(fields,name),box(fields,name)));
 check('dates and all frozen burial values retain their bytes',()=>{
  const rest='|nascimento_data=1980-02-01|morte_data=2020-02-01|sepultamento=[[Local de teste]]<ref>Fonte A.</ref>|enterro_local=Local B|resting_place=Local C';
  prove(box('profissao=Escritora'+rest),box('profissão=Escritora'+rest),['v217InfoboxParameterAccents']);
 });
 const trigger=box('profissao=Escritora');
 for(const options of [{namespaceNumber:undefined},{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:828},
  {sectionOnly:true},{section:0},{section:1},{section:'new'},{discussionPage:true},{redirectPage:true},{disambiguationPage:true},
  {pageRedirect:true},{pageDisambiguation:true},{contentModel:'javascript'},{model:'Scribunto'},
  {infoboxes:false},{markup:false},{syntaxRepairs:false},{structuralRepairs:false},{automaticBiographyFields:false},{automaticInfoboxValues:false},
  {pageTitle:'Lista de pessoas'}])check('scope refusal '+JSON.stringify(options),()=>prove(trigger,trigger,[],options));
 for(const source of ['<!--'+trigger+'-->','<nowiki>'+trigger+'</nowiki>','<pre>'+trigger+'</pre>',
  '<source lang="wikitext">'+trigger+'</source>','<syntaxhighlight lang="wikitext">'+trigger+'</syntaxhighlight>',
  '<ref>'+trigger+'</ref>','{{Modelo de teste|conteúdo='+trigger+'}}',trigger+'\n{{Info/Biografia|nome=Outra pessoa}}',
  '== Biografia ==\n'+trigger,'Texto '+trigger,' '+trigger,trigger.replace('|profissao=','|profissao＝'),
  trigger.replace('|profissao=','|profi\u200bssao='),trigger.replace('Info/Biografia','INFO/Biografia'),
  trigger.replace('|profissao=','|child=sim|profissao='),trigger.replace('|profissao=','|dados={{Info/Ator|nome=Pessoa de teste}}|profissao='),
  trigger.replace('|profissao=','|modelo={{{parâmetro|valor}}}|profissao='),trigger+'\n~~~~'])
  check('protected or nonprincipal call retained '+hash(source).slice(0,12),()=>prove(source,source));
 function pipeline(before,expected,rule,minor){
  const out=api.calculate({kind:'adjust',source:before,options:cfg});
  eq(out.text,expected,'The real production pipeline reaches the exact endpoint');
  eq(api.calculate({kind:'adjust',source:out.text,options:cfg}).text,expected,'A complete second click changes no bytes');
  eq(api.safeComposition(before,out.text,cfg),'','Production selection safety accepts the source-bound edit');
  eq(api.preservationAudit(before,out.text,cfg),[],'Independent production preservation accepts all facts and references');
  eq(out.preservation,[],'No internal preservation rollback occurs');
  const count=api.v211RetainedAdjustments(before,out.text,[],cfg);eq(count.exact,true,'The final adjustment count is proven');eq(count.count,1,'One visible native operation is counted');
  eq(api.minorEligibility(before,out.text,{...cfg,minorBaseConfirmed:true}).eligible,minor,'The minor decision follows display equivalence');
  ok(out.changes.some(row=>row.key===rule||row.type===rule||row.id===rule||row.ruleId===rule),'The actual production changes retain the native operation');
 }
 check('real pipeline accent repair',()=>pipeline(box('posicao=Defensora','Info/Futebolista'),box('posição=Defensora','Info/Futebolista'),'v217InfoboxParameterAccents',false));
 check('real pipeline harmless empty-alias collapse',()=>pipeline(box('ocupação=Escritora|ocupações='),box('ocupação=Escritora'),'v217InfoboxEmptyAliases',true));
 check('real pipeline empty higher priority remains a manual conflict',()=>{
  const before=box('ocupação=|ocupações=Escritora'),out=api.calculate({kind:'adjust',source:before,options:cfg});
  eq(out.text,before,'Explicit native suppression is preserved');ok(out.warnings.some(w=>/manualmente|conflit|valores diferentes/i.test(w)),'The existing manual review remains available');
 });
 check('the new module flag blocks its production stage',()=>{
  const before=box('posicao=Defensora','Info/Futebolista'),out=api.calculate({kind:'adjust',source:before,options:{...cfg,automaticInfoboxValues:false}});
  eq(out.text,before,'The actual pipeline honors the module opt-out');
 });
}
for(const file of files){const record=report.bundles.find(row=>row.file===path.basename(file));eq(hash(fs.readFileSync(file)),record.sha256,'The executed release bytes remain unchanged');}
if(process.env.REVISAWIKI_REPORT){fs.mkdirSync(path.dirname(process.env.REVISAWIKI_REPORT),{recursive:true});fs.writeFileSync(process.env.REVISAWIKI_REPORT,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;
