'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x));
const rows=[],heads=[['Plantilla:Ficha de persona','Info/Biografia'],['Ficha de científico','Info/Cientista'],['Plantilla:Ficha de científico','Info/Cientista'],['Ficha de película','Info/Filme'],['Plantilla:Ficha de película','Info/Filme']],add=(id,source,expected,kind,extra={})=>rows.push({id,source,expected,kind,...extra});
for(const[head,target]of heads){const film=target==='Info/Filme',field=film?'título':'nombre';for(const value of ['no',' no ','\nno\n'])add('suppression/'+rows.length,'{{'+head+'|'+field+'='+value+'}}','{{'+head+'|'+field+'='+value+'}}','source-refusal',{refusal:'source-suppression-value'});
 for(const value of ['NO','no literal','Valor literal'])add('ordinary/'+rows.length,'{{'+head+'|'+field+'='+value+'}}','{{'+target+'|nome='+value+'}}','positive',{refusal:null});
}
for(const head of heads.filter(x=>x[1]!=='Info/Filme').map(x=>x[0]))for(const field of ['padre','madre'])for(const value of ['','Valor literal'])add('unproved-parent/'+rows.length,'{{'+head+'|'+field+'='+value+'}}','{{'+head+'|'+field+'='+value+'}}','source-refusal',{refusal:'unproved-source-parent-role'});
for(const head of ['Ficha de película','Plantilla:Ficha de película'])for(const year of ['','2001'])for(const release of ['','2001','2002'])for(const reverse of [false,true]){
 const fields=reverse?'estreno='+release+'|año='+year:'año='+year+'|estreno='+release,source='{{'+head+'|'+fields+'}}';add('year-priority/'+rows.length,source,source,'source-refusal',{refusal:'source-year-alias-priority'});
}
for(const value of ['','Legenda literal'])for(const image of ['','|Bild=Exemplo.jpg']){const source='{{Vorlage:Infobox Film|Bildbeschreibung='+value+image+'}}';add('unproved-caption/'+rows.length,source,source,'source-refusal',{refusal:'unproved-source-caption-role'});}
for(const[source,expected]of [
 ['{{Plantilla:Ficha de persona|ocupación=Pesquisadora}}','{{Info/Biografia|ocupação=Pesquisadora}}'],
 ['{{Plantilla:Ficha de persona|firma=Assinatura.svg}}','{{Info/Biografia|assinatura=Assinatura.svg}}'],
 ['{{Plantilla:Ficha de persona|empleador=Instituição literal}}','{{Info/Biografia|empregador=Instituição literal}}'],
 ['{{Plantilla:Ficha de película|dirección=Pessoa literal}}','{{Info/Filme|diretor=Pessoa literal}}'],
 ['{{Plantilla:Ficha de película|producción=Pessoa literal}}','{{Info/Filme|produtor=Pessoa literal}}'],
 ['{{Plantilla:Ficha de película|música=Pessoa literal}}','{{Info/Filme|música=Pessoa literal}}'],
 ['{{Plantilla:Ficha de película|año=2001}}','{{Info/Filme|ano=2001}}'],
 ['{{Plantilla:Ficha de película|estreno=2001}}','{{Info/Filme|lançamento=2001}}'],
 ['{{Vorlage:Infobox Film|Regie=Pessoa literal}}','{{Info/Filme|diretor=Pessoa literal}}'],
 ['{{Vorlage:Infobox Film|Originaltitel=Nome literal}}','{{Info/Filme|título-or=Nome literal}}'],
 ['{{Vorlage:Infobox Film|Regie=no}}','{{Info/Filme|diretor=no}}'],
 ['{{Modèle:Infobox Cinéma (film)|réalisation=no}}','{{Info/Filme|diretor=no}}'],
 ['{{Modèle:Infobox Cinéma (film)|année de sortie=2001}}','{{Info/Filme|ano=2001}}'],
 ['{{Ficha de persona|nombre=no|padre=Valor literal}}','{{Info/Biografia|nombre=no|padre=Valor literal}}'],
 ['{{Template:Ficha de persona|nombre=no}}','{{Info/Biografia|nombre=no}}']
])add('primary-positive/'+rows.length,source,expected,'positive',{refusal:null});
const unsafe='{{Plantilla:Ficha de persona|nombre=no}}';
for(const option of ['multilingual','infoboxes'])add('off/'+option,unsafe,unsafe,'off',{options:{[option]:false},refusal:'source-suppression-value'});
for(const wrapper of [x=>'<nowiki>'+x+'</nowiki>',x=>'```wikitext\n'+x+'\n```',x=>'"'+x+'"',x=>'{{Modelo desconhecido|'+x+'}}',x=>'<ref>'+x+'</ref>'])add('protected/'+rows.length,wrapper(unsafe),wrapper(unsafe),'protected');
for(const head of ['PLANTILLA:FICHA DE PERSONA','Plantilla:Ficha de Persona','Template:Ficha de película','Vorlage:INFOBOX FILM']){const source='{{'+head+'|nombre=no|Bildbeschreibung=Legenda literal}}';add('invalid-identity/'+rows.length,source,source,'identity-boundary');}
for(const source of ['{{Plantilla:Ficha de persona|nombre=Nome literal}}','{{Plantilla:Ficha de película|año=2001}}','{{Vorlage:Infobox Film|Regie=Pessoa literal}}']){
 const unsafe=source.includes('persona')?source.replace('Nome literal','no'):source.includes('película')?source.replace('2001}}','2001|estreno=2002}}'):source.replace('Regie=Pessoa literal','Bildbeschreibung=Legenda literal');add('fresh-mutant/'+rows.length,unsafe,unsafe,'source-refusal');
}
const report={kind:'private-source-bound-foreign-infobox-selection-actions',status:'passed',checks:0,bundles:[],cases:[],failures:[],canonicalScenarios:new Set(rows.map(r=>sha(JSON.stringify([r.source,r.expected,r.options||{}])))).size};
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
for(const file of files){const name=path.basename(file),a=require(file),cfg={...Object.fromEntries(Object.entries(a.defaults).map(([k,v])=>[k,typeof v==='boolean'?false:v])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',multilingual:true,infoboxes:true};report.bundles.push({file,runtimeSha256:sha(fs.readFileSync(file)),version:a.version});for(const r of rows){const options={...cfg,...r.options},row={id:r.id,bundle:name,kind:r.kind,sourceSha256:sha(r.source),expectedEndpointSha256:sha(r.expected),optionsSha256:sha(JSON.stringify(options)),status:'passed'};try{
 const output=a.calculate({kind:'adjust',source:r.source,options});row.actualEndpointSha256=sha(output.text);row.appliedIds=output.changes.map(x=>x.id);report.checks++;assert.equal(output.text,r.expected);report.checks++;assert.deepEqual(output.preservation,[]);report.checks++;assert.equal(a.calculate({kind:'adjust',source:output.text,options}).text,output.text);
 if(Object.hasOwn(r,'refusal')){const guard=a.v219ForeignInfoboxRefusal(r.source);report.checks++;assert.equal(guard?.proof?.reason??null,r.refusal);}
 }catch(e){row.status='failed';row.error=e.message;report.status='failed';report.failures.push(row);}report.cases.push(row);}}
report.runnerSha256=sha(fs.readFileSync(__filename));report.contractSha256=sha(fs.readFileSync(path.join(__dirname,'foreign_infobox_role_contract.json')));report.networkRequests=0;report.wikipediaWrites=0;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
