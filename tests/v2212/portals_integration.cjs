'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.2/RevisaWiki_v2_21_2.js'),api=require(file);
const base={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',sectionOnly:false,pageRedirect:false,pageDisambiguation:false,autoPreview:false,registryDoiCheck:false,footerProfiles:{},v216CalendarUTC:'2026-10-28'};
let checks=0,calculations=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
const has=(text,target)=>[...text.matchAll(/\{\{Portal3\|([^{}]*)\}\}/g)].some(match=>match[1].split('|').map(part=>part.replace(/^\s*\d+\s*=/,'').trim()).includes(target));
function run(source,exists,extra={}){const hash=api.v2212PortalPlan(source,base).sourceHash,options={...base,v2212PortalProofRequired:true,v2212OriginalDraftHash:hash,v2212PortalAvailability:{source,sourceHash:hash,exists},...extra};const result=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;const guard=api.v219AutomaticResultSafety(source,result);eq(guard.accepted,true,'full integrated final guard: '+guard.reason);return result;}
const boxes=[
 ['Info/Livro','gênero=Romance',['Literatura']],['Info/Álbum','gênero=Rock',['Música']],['Info/Universidade','',['Educação']],
 ['Info/Rede de televisão','',['Televisão']],['Info/Canal de televisão','',['Televisão']],['Info/Jornal','periodicidade=Diário',['Jornalismo']],
 ['Info/Município do Brasil','',['Geografia']],['Info/Rio','',['Geografia']],['Info/Ilha','',['Geografia']],['Info/Conflito militar','',['Guerra']],
 ['Info/Software','',['Tecnologias de informação']],['Info/Clube de futebol','',['Futebol','Esportes']],['Info/Militar','',['Guerra']],['Info/Artista','',['Arte']],
 ['Info/Revista científica','',['Ciência']],['Info/Computador','',['Tecnologias de informação']],['Info/Automóvel','',['Carros']],
 ['Info/Moeda','moedas=1, 2|notas=10, 20',['Numismática']],['Info/Estádio','capacidade=40000',['Esportes']],['Info/Partido político','',['Política']],
 ['Info/Evento meteorológico','duração=Um dia',['Meteorologia']],['Info/Cerveja','classe=cervejaria',['Cerveja']],['Info/Foguete','função=Orbital launch vehicle',['Exploração espacial']],
 ['Info/Televisão','formato=Série de animação',['Televisão','Animação']],['Info/Cientista','campo=[[Física]]',['Física']],['Info/Cientista','campo=[[Bioquímica]]',['Bioquímica']],
 ['Info/Música/artista','fundo=grupo_ou_banda',['Música']]
];
for(const[owner,fields,targets]of boxes){
 const source='{{'+owner+'|nome=Exemplo'+(fields?'|'+fields:'')+'}}\n\n'+"'''Exemplo''' contém uma excessão e <math>E=mc^2</math>.\n\n[[Categoria:Exemplos]]\n";
 const result=run(source,targets);
 for(const target of targets)eq(has(result.text,target),true,owner+' inserts '+target+' through calculate');
 eq(result.text.includes('<math>E=mc^2</math>'),true,'formula retained');eq(result.text.includes('[[Categoria:Exemplos]]'),true,'category retained');
}
for(const[stub,category,target]of[['esboço-matemática','Topologia (matemática)','Matemática'],['Esboço-física','Ondulatória','Física'],['esboço-política','Eleições','Política'],['esboço-informática','Periféricos de computador','Tecnologias de informação']]){
 const source="'''Exemplo''' é o assunto.\n\n{{"+stub+'}}\n[[Categoria:'+category+']]\n',result=run(source,[target]);eq(has(result.text,target),true,'full source stub insertion');eq(result.text.includes('{{'+stub+'}}'),true,'stub retained');
}
const spellingSource='{{Info/Universidade|nome=Exemplo}}\n\n'+"'''Exemplo''' contém uma excessão.\n\n[[Categoria:Exemplos]]\n",spelling=run(spellingSource,['Educação']);eq(spelling.text.includes('exceção'),true,'independent spelling applied');eq(has(spelling.text,'Educação'),true,'original availability binding survives spelling phase');
const denied=run(spellingSource,[]);eq(denied.text.includes('exceção'),true,'unavailable portal does not block independent spelling');eq(has(denied.text,'Educação'),false,'unavailable portal not inserted');
const badHash=run(spellingSource,['Educação'],{v2212PortalAvailability:{sourceHash:'stale',exists:['Educação']}});eq(has(badHash.text,'Educação'),false,'strict stale proof not used');eq(badHash.text.includes('exceção'),true,'stale proof only blocks portal');
const aliasSource="Texto.\n\n{{Portal3|Germany|Numismatics|Money}}\n[[Categoria:Exemplos]]\n",alias=run(aliasSource,['Alemanha']);eq(alias.text.includes('Alemanha|Numismatics|Money'),true,'full calculation filters aliases separately');
const universe=api.v2212PortalDestinations();eq(universe.length,24,'finite global destination request universe');eq(new Set(universe).size,24,'request universe has no duplicates');
const misspelledBook='{{Info/Livro|nome=Exemplo|genero=Romance}}\n\n'+"'''Exemplo''' é um romance.\n\n";eq(api.v2212PortalCandidates(misspelledBook,base),[],'source before field repair has no confirmed literary classifier');const repairedBook=run(misspelledBook,universe);eq(repairedBook.text.includes('gênero=Romance'),true,'native field repair executes');eq(has(repairedBook.text,'Literatura'),true,'global availability allows later safely typed article');
const foreignBook='{{Infobox book|name=Exemplo|genre=Romance}}\n\n'+"'''Exemplo''' é um romance.\n\n",foreignResult=run(foreignBook,universe);if(/\{\{Info\/Livro[|\n]/.test(foreignResult.text))eq(has(foreignResult.text,'Literatura'),true,'verified migrated book can use the same global availability');else{eq(foreignResult.text.includes('{{Infobox book|name=Exemplo|genre=Romance}}'),true,'unverified import remains intact');eq(has(foreignResult.text,'Literatura'),false,'destination existence alone never invents subject classification');}
const manualBook='{{Info/Livro|nome=Exemplo|gênero=Manual de matemática}}\n\nTexto.\n',manualResult=run(manualBook,universe);eq(has(manualResult.text,'Literatura'),false,'global existence does not override genre guard');
console.log(JSON.stringify({suite:'v2212-portals-integration',checks,calculations,status:'passed',core:path.basename(file)}));
