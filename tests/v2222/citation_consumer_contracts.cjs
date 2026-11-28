'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
// Independent native outer-reader contracts. Their CS1 implementation roles
// do not authorize replacing a public field with an unrelated core spelling.
const models=[
 ['Citar mapa','cartography','cartografia','Pessoa',48253463],
 ['Citar mapa','trans-map','mapa-trad','Tradução',48253463],
 ['Citar mapa','map-format','formato-mapa','PDF',48253463],
 ['Citar mapa','map-url','urlmapa','https://example.org/map',48253463],
 ['Citar mapa','mapurl','urlmapa','https://example.org/map',48253463],
 ['Citar lista de discussão','mailing-list','lista-discussão','Lista',48176994],
 ['Citar lista de discussão','mailinglist','lista-discussão','Lista',48176994],
 ['Citar jogo eletrônico','platform','plataforma','PC',49700086],
 ['Citar jogo eletrônico','scene','cena','Final',49700086],
 ['Citar jogo eletrônico','level','nível','2',49700086],
 ['Citar jogo eletrônico','developer','desenvolvedor','Equipe',49700086],
 ...[1,2,12].map(i=>['Citar jogo eletrônico','developer'+i,'desenvolvedor'+i,'Equipe',49700086]),
 ['Citar jogo eletrônico','isolang','língua','en',49700086],
 ['Citar episódio','began','início','2000',49700078],
 ['Citar episódio','ended','fim','2001',49700078],
 ['Citar livro','editor','editor-sobrenome','Pessoa',49448102],
 ...[1,2,12].map(i=>['Citar livro','editor'+i,'editor-sobrenome'+i,'Pessoa',49448102])
];
function run(api){
 const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo'},rows=[];let calculations=0;
 const wrap=raw=>'Texto.<ref>'+raw+'</ref>\n\n{{Referências}}';
 const fields=text=>{const ref=/<ref\b[^>]*>([\s\S]*?)<\/ref>/.exec(text),raw=ref?.[1].trim();return raw&&api.v2222CitationContext(raw)?api.v222Fields(raw).fields:[];};
 function check(id,source,verify){const r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;verify(r.text);assert(api.v219AutomaticResultSafety(source,r).accepted,id+' preservation');const second=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:cfg});calculations++;assert.equal(second.text,r.text,id+' idempotence');let retained=r.retainedAdjustments;if(retained?.pending){const counted=api.calculate({kind:'final-count',source:r.text,originalSource:source,options:cfg});calculations++;assert.equal(counted.text,r.text);retained=counted.retainedAdjustments;}if(api.version==='2.22.2')assert(retained?.exact,id+' exact count');rows.push({id,passed:true,count:retained?.count??null,pendingPrimary:r.retainedAdjustments?.pending===true});}
 const has=(text,key,value)=>fields(text).some(f=>f.key===key&&f.value.trim()===value);
 for(const [owner,from,to,value,pin]of models){
  const id=owner+':'+from,raw='{{'+owner+'|título=Documento|'+from+'='+value+'}}';
  const context=api.v2222CitationContext(raw),reader=api.v2215CitationReader(context);assert.equal(reader.oldid,pin,id+' pinned reader');
  check(id,wrap(raw),text=>assert(has(text,to,value),id+' local target'));
  check(id+':native-target',wrap('{{'+owner+'|título=Documento|'+to+'='+value+'}}'),text=>assert(has(text,to,value),id+' native target remains'));
  for(const conflicting of ['Outro',''])check(id+':conflict-'+(conflicting?'filled':'empty'),wrap('{{'+owner+'|título=Documento|'+from+'='+value+'|'+to+'='+conflicting+'}}'),text=>{assert(has(text,from,value),id+' source survives conflict');assert(has(text,to,conflicting),id+' target survives conflict');});
  check(id+':opaque-neighbor',wrap('{{'+owner+'|título=Documento|'+from+'='+value+'|campo_desconhecido=Preservar}}'),text=>{assert(has(text,to,value));assert(has(text,'campo_desconhecido','Preservar'));});
 }
 for(const[owner,key,value]of [
  ['Citar jogo eletrônico','desenvolvedora3','Equipe'],['Citar jogo eletrônico','produtor2','Equipe'],['Citar jogo eletrônico','publicadora','Entidade'],['Citar jogo eletrônico','distribuidora','Entidade'],['Citar jogo eletrônico','versão','1.2'],['Citar jogo eletrônico','fase','Final'],
  ['Citar mapa','mapa','Região'],['Citar mapa','folha','A1'],['Citar mapa','folhas','A1–A3'],['Citar lista de discussão','lista','Lista'],['Citar lista de discussão','lista-correio','Lista'],['Citar episódio','episódio','2'],['Citar entrevista','entrevistado2','Pessoa']
 ])check(owner+':native-public-field:'+key,wrap('{{'+owner+'|título=Documento|'+key+'='+value+'}}'),text=>assert(has(text,key,value),'Native public field retained '+key));
 for(const[owner,key,target,value]of [['Citar jogo eletrônico','version','versão','1.2'],['Citar conferência','conference','conferência','Evento'],['Citar enciclopédia','encyclopedia','enciclopédia','Enciclopédia'],['Citar relatório','publisher','publicado','Entidade'],['Citar relatório técnico','number','número','000123'],['Citar livro','translator-first','tradutor-primeiro','Pessoa']])check(owner+':other-native-contract:'+key,wrap('{{'+owner+'|título=Documento|'+key+'='+value+'}}'),text=>assert(has(text,target,value),'Other native public contract '+key));
 for(const key of ['journal','periódico','jornal']){const source=wrap('{{Citation|'+key+'=Publicação|title=Documento|year=2024}}'),plan=api.v2222CitationFieldsPlan(source,cfg);assert(plan.text.includes('|'+key+'=Publicação'),'Generic source family discriminator precedes localization');}
 const bank='Texto.<ref name="a"/><ref name="b"/><ref name="c"/>\n<references>\n<ref name="a">{{Citation|periódico=Revista|título=Artigo|data=2 de fevereiro de 2024|página=7}}</ref>\n<ref name="b">{{Citation|jornal=Jornal|título=Notícia|data=3 de março de 2024|página=9}}</ref>\n<ref name="c">{{Citation|título=Livro|publicado=Editora|ano=2024}}</ref>\n</references>';
 check('generic-bank-retains-three-source-proved-families',bank,text=>{for(const header of ['Citar periódico','Citar jornal','Citar livro'])assert(text.includes('{{'+header),'Original source family '+header);});
 const subtypes=[
  ...['newspaper','jornal'].map(k=>[k+'=Publicação','Citar jornal']),
  ...['journal','periódico','periodico'].map(k=>[k+'=Publicação','Citar periódico']),
  ...['magazine','revista'].map(k=>[k+'=Publicação','Citar revista']),
  ...['website','work','obra'].map(k=>[k+'=example.org|url=https://example.org/fonte','Citar web']),
  ['isbn=9780306406157','Citar livro'],['publisher=Editora','Citar livro'],['edition=2nd','Citar livro'],['chapter=Capítulo','Citar livro'],['last=Pessoa|year=2024','Citar livro'],['editor=Pessoa|year=2024','Citar livro'],
  ['conference=Evento|publisher=Editora','Citar livro'],
  ['encyclopedia=Enciclopédia|publisher=Editora',null],['contribution=Parte','Citar livro'],['booktitle=Coletânea',null],['conference=Evento',null],['website=Outra publicação|url=https://example.org/fonte',null],['journal=Revista|newspaper=Jornal',null],['journal=Revista|chapter=Capítulo',null],['publisher=Editora|campo_desconhecido=Valor',null]
 ];
 for(const [parameters,header]of subtypes){const raw='{{Citation|title=Documento|'+parameters+'}}',target=api.v2217CitationTarget(raw);assert.equal(target?.target??null,header,'Existing source-proved subtype obligation '+parameters);check('generic-subtype:'+parameters,wrap(raw),text=>{const f=/<ref\b[^>]*>\s*\{\{([^|}]+)/.exec(text);assert.equal(f?.[1].trim(),header||'Citation','Subtype survives independent parameter normalization '+parameters);});}
 for(const[owner,from,to]of [['Citar jogo eletrônico','developer2','ultimo2'],['Citar jogo eletrônico','platform','volume'],['Citar mapa','map-url','capítulourl'],['Citar lista de discussão','mailing-list','obra']]){
  const raw=wrap('{{'+owner+'|título=Documento|'+from+'=Valor}}'),plan=api.v2222CitationFieldsPlan(raw,cfg),edit=plan.edits.find(e=>raw.slice(e.start,e.end)===from);assert(edit,owner+' local planner runs');const badEdits=plan.edits.map(e=>e===edit?{...e,text:to}:e);let text=raw;for(const e of badEdits.slice().sort((a,b)=>b.start-a.start))text=text.slice(0,e.start)+e.text+text.slice(e.end);assert.equal(api.v2222CitationFieldsProof(raw,text,{...plan,text,edits:badEdits},cfg),false,owner+' rejects internal-role target mutation');
 }
 return{kind:'native-citation-consumer-contracts',version:api.version,modelContracts:17,indexVariants:models.length,cases:rows.length,calculations,proofMutationCases:4,rows,wikipediaWrites:0};
}
if(require.main===module){const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.22.2/RevisaWiki_v2_22_2.js'),r=run(require(file));if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({...r,rows:undefined}));}
module.exports={run,models};
