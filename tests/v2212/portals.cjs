'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.2/RevisaWiki_v2_21_2.js'),api=require(file);
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo de assunto',sectionOnly:false,pageRedirect:false,pageDisambiguation:false,autoPreview:false,registryDoiCheck:false,footerProfiles:{}};
let assertions=0,plans=0;function eq(a,b,label){assert.deepEqual(a,b,label);assertions++;}
function plan(source,options={}){plans++;return api.v2212PortalPlan(source,{...cfg,...options});}
function has(text,theme){return [...text.matchAll(/\{\{Portal3\|([^{}]*)\}\}/g)].some(match=>match[1].split('|').map(part=>part.replace(/^\s*\d+\s*=/,'').trim()).includes(theme));}
const wrap=(box,body="'''Exemplo''' é o assunto do artigo.",tail='')=>box+'\n\n'+body+'\n\n'+tail+'[[Categoria:Exemplos]]\n';
const positives=[
 ['book','{{Info/Livro|nome=Exemplo|gênero=[[Romance]]}}',['Literatura']],
 ['album','{{Info/Álbum|nome=Exemplo|gênero=Rock}}',['Música']],
 ['album-opening','{{Info/Álbum|nome=Exemplo}}',['Música'],"'''''Exemplo''''' é um álbum do cantor Exemplo."],
 ['university','{{Info/Universidade|nome=Exemplo}}',['Educação']],
 ['network','{{Info/Rede de televisão|nome=Exemplo}}',['Televisão']],
 ['newspaper','{{Info/Jornal|nome=Exemplo|periodicidade=Diário}}',['Jornalismo']],
 ['town','{{Info/Município do Brasil|nome=Exemplo}}',['Geografia']],
 ['river','{{Info/Rio|nome=Exemplo}}',['Geografia']],
 ['island','{{Info/Ilha|nome=Exemplo}}',['Geografia']],
 ['conflict','{{Info/Conflito militar|nome_batalha=Exemplo}}',['Guerra']],
 ['software','{{Info/Software|nome=Exemplo}}',['Tecnologias de informação']],
 ['club','{{Info/Clube de futebol|nome=Exemplo}}',['Futebol','Esportes']],
 ['military','{{Info/Militar|nome=Exemplo}}',['Guerra']],
 ['artist','{{Info/Artista|nome=Exemplo}}',['Arte']],
 ['journal','{{Info/Revista científica|nome=Exemplo}}',['Ciência']],
 ['computer','{{Info/Computador|nome=Exemplo}}',['Tecnologias de informação']],
 ['car','{{Info/Automóvel|nome=Exemplo}}',['Carros']],
 ['currency','{{Info/Moeda|nome=Exemplo|moedas=1, 2, 5|notas=10, 20}}',['Numismática']],
 ['stadium','{{Info/Estádio|nome=Exemplo|capacidade=40000}}',['Esportes']],
 ['party','{{Info/Partido político|nome=Exemplo}}',['Política']],
 ['weather','{{Info/Evento meteorológico|duração=Um dia}}',['Meteorologia']],
 ['brewery','{{Info/Cerveja|nome=Exemplo|classe=cervejaria}}',['Cerveja']],
 ['beer','{{Info/Cerveja|nome=Exemplo|classe=cerveja}}',['Cerveja']],
 ['rocket','{{Info/Foguete|nome=Exemplo|função=[[Orbital launch vehicle]]}}',['Exploração espacial']],
 ['animation','{{Info/Televisão|título=Exemplo|formato=[[Série de animação]]}}',['Televisão','Animação']],
 ['scientist','{{Info/Cientista|nome=Exemplo|campo=[[Física]]}}',['Física']],
 ['biochemistry','{{Info/Cientista|nome=Exemplo|campo=[[Bioquímica]]}}',['Bioquímica']],
 ['scientist-fields','{{Info/Cientista|nome=Exemplo|campo=[[Física]]<br />[[Bioquímica]]}}',['Física','Bioquímica']],
 ['band','{{Info/Música/artista|nome=Exemplo|fundo=grupo_ou_banda}}',['Música']]
];
for(const [id,box,targets,body]of positives)for(const eol of['\n','\r\n']){
 const source=wrap(box,body).replace(/\n/g,eol),p=plan(source);
 for(const target of targets)eq(has(p.text,target),true,id+' adds '+target);
 eq(p.text.includes(box),true,id+' box byte-identical');
 eq(p.text.includes('[[Categoria:Exemplos]]'),true,id+' category preserved');
 eq(api.v2212PortalProof(source,p.text,p,cfg),true,id+' fresh proof');
 eq(plan(p.text).text,p.text,id+' idempotent');
 eq(api.v2212PortalProof(source,p.text+'X',p,cfg),false,id+' altered result refused');
 eq(api.v2212PortalProof(source,p.text,p,{...cfg,portals:false}),false,id+' changed config refused');
 for(const opts of[{portals:false},{endMatter:false},{automaticTopicPortals:false},{namespaceNumber:1},{discussionPage:true},{sectionOnly:true},{pageRedirect:true},{pageDisambiguation:true},{pageTitle:'Lista de exemplos'},{contentModel:'javascript'}])eq(plan(source,opts).text,source,id+' preference/scope');
}
for(const [stub,category,target]of[['esboço-matemática','Topologia (matemática)','Matemática'],['Esboço-física','Ondulatória','Física'],['esboço-política','Eleições','Política'],['esboço-informática','Periféricos de computador','Tecnologias de informação']]){
 const source="'''Exemplo''' é o assunto.\n\n{{"+stub+'}}\n[[Categoria:'+category+']]\n';const p=plan(source);
 eq(has(p.text,target),true,stub+' non-infobox insertion');eq(p.text.includes('{{'+stub+'}}'),true,'stub preserved');eq(p.text.includes('[[Categoria:'+category+']]'),true,'category preserved');eq(plan(p.text).text,p.text,'stub idempotence');
 eq(plan(source.replace('[[Categoria:'+category+']]','[[Categoria:Outro assunto]]')).text,source.replace('[[Categoria:'+category+']]','[[Categoria:Outro assunto]]'),'uncorroborated stub');
 eq(plan(source.replace('{{'+stub+'}}','{{'+stub+'|tema=outro}}')).text,source.replace('{{'+stub+'}}','{{'+stub+'|tema=outro}}'),'parameterized stub');
}
const negatives=[
 wrap('{{Info/Livro|nome=Exemplo|gênero=Manual de matemática}}'),
 wrap('{{Info/Livro|gênero=[[Romance|Manual]]}}'),
 wrap('{{Info/Álbum|gênero=Comédia}}'),
 wrap('{{Info/Álbum|nome=Exemplo}}',"'''Exemplo''' é um álbum de fotografias. O cantor escreveu sobre ele."),
 wrap('{{Info/Álbum|gênero=Rock}}',"'''Exemplo''' é um audiolivro humorístico."),
 wrap('{{Info/Moeda|moedas=1, 2|tipo=criptomoeda}}'),
 wrap('{{Info/Moeda|nome=Exemplo}}'),
 wrap('{{Info/Estádio|nome=Exemplo}}'),
 wrap('{{Info/Foguete|função=Míssil antitanque}}'),
 wrap('{{Info/Televisão|formato=[[Série de animação|Documentário]]}}'),
 wrap('{{Info/Cientista|campo=[[Física|Química]]}}'),
 wrap('{{Info/Cientista|campo=[[Física]]|campo=[[Bioquímica]]}}'),
 wrap('{{Info/Música/artista|fundo=compositor}}'),
 wrap('{{Info/Música/artista|fundo=cantor_solo}}'),
 wrap('{{Info/Cerveja|classe=empresa}}'),
 wrap('{{Info/Universidade|child=yes}}'),
 wrap('{{Info/Universidade|nome=Exemplo}}\n{{Info/Empresa|nome=Outro}}'),
 wrap('{{Info/UNIVERSIDADE|nome=Exemplo}}'),
 wrap('{{Info/Jornal|nome=Exemplo}}',"'''Exemplo''' é um jornal fictício."),
 "'''Exemplo''' é uma revista médica.\n{{Esboço-literatura}}\n[[Categoria:Revistas científicas]]\n",
 'Texto.\n{{Desambig}}\n{{Esboço-matemática}}\n[[Categoria:Topologia (matemática)]]\n',
 '<nowiki>{{Info/Universidade|nome=Exemplo}}</nowiki>\nTexto.\n',
 '<ref>{{Info/Universidade|nome=Exemplo}}</ref>\n{{Referências}}\n',
 '{|\n| {{Info/Universidade|nome=Exemplo}}\n|}\n',
 '<div>{{Info/Universidade|nome=Exemplo}}</div>\n',
 '{{Exemplo|{{Info/Universidade|nome=Exemplo}}}}\n',
 '"{{Info/Universidade|nome=Exemplo}}"\n',
 '#REDIRECIONAMENTO [[Exemplo]]\n{{Info/Universidade|nome=Exemplo}}\n',
 '{{Info/Universidade|nome=Exemplo}\nTexto\n',
 '{{Info/Universidade|nome=Exemplo}}\n<ref>Incompleto\n'
];
for(const [i,source]of negatives.entries())eq(plan(source).text,source,'negative-'+i);
for(const prefix of['{{Fusão com|Exemplo}}\n','{{Não confundir com|Exemplo}}','{{Descrição curta|Exemplo}}\n','{{Sem-fontes|data=outubro de 2026}}\n','{{Sem fontes|data=outubro de 2026}}\n{{Coor title dms|1|2|3|N|4|5|6|E}}\n']){
 const source=prefix+wrap('{{Info/Universidade|nome=Exemplo}}');eq(has(plan(source).text,'Educação'),true,'audited metadata prefix');eq(plan(source).text.includes(prefix.trim()),true,'metadata preserved');
}
const headerComment=wrap('{{Info/Universidade\n<!-- Código interno -->\n|nome=Exemplo}}');eq(has(plan(headerComment).text,'Educação'),true,'native comment after header is metadata');
const channel=wrap('{{Info/Canal de televisão|nome=Exemplo}}');eq(has(plan(channel).text,'Televisão'),true,'audited channel contract');
for(const value of['constructor','__proto__','toString','valueOf']){
 const source=wrap('{{Info/Cientista|campo='+value+'}}');eq(plan(source).text,source,'unknown field token is not an inherited map entry');
 const portal='Texto.\n{{Portal3|'+value+'}}\n';eq(plan(portal).text,portal,'unknown portal is not a prototype property');
}
const scientistLines=wrap('{{Info/Cientista\n|nome=Exemplo\n|campo=[[Física]]\n}}');eq(has(plan(scientistLines).text,'Física'),true,'field trailing newline is not an empty second discipline');
const metadata='{{Título em itálico}}{{Info/Álbum|nome=Exemplo|gênero=Rock}}\n\n'+"'''''Exemplo''''' é um álbum musical.\n";
eq(has(plan(metadata).text,'Música'),true,'audited adjacent title wrapper');
const weather=wrap('{{Info/Evento meteorológico|duração=Um dia}}\n{{Info/Evento meteorológico/Surto de tornado|child=yes}}\n{{Info/Evento meteorológico/Efeitos|child=yes}}\n{{Info/Evento meteorológico/Rodapé|child=yes}}');
eq(has(plan(weather).text,'Meteorologia'),true,'one meteorological owner and finite children');
eq(plan(weather.replace('|child=yes','|child=no')).text,weather.replace('|child=yes','|child=no'),'detached weather child refused');
const localized="Texto.\n\n{{Portal3|Germany|Money|Numismatics|Biography}}\n[[Categoria:Exemplos]]\n",localizedPlan=plan(localized);
eq(localizedPlan.text.includes('{{Portal3|Alemanha|Money|Numismática|Biografias}}'),true,'finite portal translations retain unmatched meaning');eq(plan(localizedPlan.text).text,localizedPlan.text,'alias idempotence');
const located="Texto.\n\n== Ver também ==\n{{Portal3|Ciência|Biologia}}\n* [[Exemplo]]\n\n{{Referências}}\n\n== Ligações externas ==\n* [https://example.invalid Exemplo]\n\n{{Controle de autoridade}}\n[[Categoria:Exemplos|Chave]]\n",moved=plan(located);
eq(moved.text.indexOf('{{Portal3')>moved.text.indexOf('{{Controle de autoridade}}'),true,'portal follows authority');eq(moved.text.indexOf('{{Portal3')<moved.text.indexOf('[[Categoria:'),true,'portal precedes categories');eq(moved.text.includes('* [[Exemplo]]'),true,'bullet retained');eq(moved.text.includes('[[Categoria:Exemplos|Chave]]'),true,'sort key retained');eq(plan(moved.text).text,moved.text,'movement idempotent');
const nested="Texto.\n\n<nowiki>{{Portal3|Germany}}</nowiki>\n";eq(plan(nested).text,nested,'protected portal');
const fullSlots=wrap('{{Info/Universidade|nome=Exemplo}}',undefined,'{{Portal3|Física|Química|História|Brasil|Portugal|Alemanha|Biografias|Música|Arte|Ciência}}\n');eq(plan(fullSlots).text,fullSlots,'ten slots never overwritten');
const preserved=wrap('{{Info/Universidade|nome=Exemplo|nota=<ref name="fonte">{{citar web|título=Exemplo|url=https://example.invalid}}</ref>}}',"'''Exemplo''' tem <math>E=mc^2</math> e 5 km.",'{{Referências}}\n');const pp=plan(preserved);eq(has(pp.text,'Educação'),true,'formula/reference example eligible');for(const literal of['<math>E=mc^2</math>','5 km','<ref name="fonte">{{citar web|título=Exemplo|url=https://example.invalid}}</ref>','{{Referências}}'])eq(pp.text.includes(literal),true,'literal retained '+literal);
const strictSource=wrap('{{Info/Universidade|nome=Exemplo}}'),originalHash=plan(strictSource).sourceHash,required={v2212PortalProofRequired:true};
eq(plan(strictSource,required).text,strictSource,'missing availability abstains only from new theme');
for(const availability of[{sourceHash:originalHash,exists:[]},{sourceHash:'stale',exists:['Educação']},{sourceHash:originalHash,exists:['Física']},{sourceHash:originalHash,exists:'Educação'}])eq(plan(strictSource,{...required,v2212PortalAvailability:availability}).text,strictSource,'strict negative or invalid proof');
const confirmed={...required,v2212PortalAvailability:{sourceHash:originalHash,exists:['Educação']}},strictPlan=plan(strictSource,confirmed);
eq(has(strictPlan.text,'Educação'),true,'strict confirmed destination inserted');eq(api.v2212PortalProof(strictSource,strictPlan.text,strictPlan,{...cfg,...confirmed}),true,'strict fresh plan proof');eq(api.v2212PortalProof(strictSource,strictPlan.text,strictPlan,{...cfg,...required,v2212PortalAvailability:{sourceHash:originalHash,exists:[]}}),false,'availability tamper refused');
const projected=strictSource.replace('é o assunto','já é o assunto'),projectedOptions={...confirmed,citationOriginalSource:strictSource,biographyOriginalSource:strictSource};eq(has(plan(projected,projectedOptions).text,'Educação'),true,'separate accepted source changes retain original task binding');
const explicitBinding={...required,v2212OriginalDraftHash:originalHash,v2212PortalAvailability:{source:strictSource,sourceHash:originalHash,exists:['Educação']}};eq(has(plan(projected,explicitBinding).text,'Educação'),true,'explicit original draft binding');eq(plan(projected,{...explicitBinding,v2212PortalAvailability:{...explicitBinding.v2212PortalAvailability,source:strictSource+'X'}}).text,projected,'availability source tamper');
const aliasStrict='Texto.\n{{Portal3|Germany|Numismatics|Money}}\n',aliasHash=plan(aliasStrict).sourceHash,aliasOut=plan(aliasStrict,{...required,v2212PortalAvailability:{sourceHash:aliasHash,exists:['Alemanha']}}).text;eq(aliasOut.includes('Alemanha|Numismatics|Money'),true,'availability filters each alias independently');
console.log(JSON.stringify({suite:'v2212-portals',assertions,plans,core:path.basename(file),status:'passed'}));
