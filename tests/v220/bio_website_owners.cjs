'use strict';
const assert=require('node:assert/strict'),a=require('./bio_harness.cjs');
const cfg={...a.defaults,namespaceNumber:0,pageTitle:'Exemplo',authorityControl:false,autoPreview:false,automaticTopicPortals:false,automaticBiographyPortals:false,biographyPortal:false};
let cases=0,checks=0;
const link='[https://www.example.invalid Site oficial]',head='{{Info/Empresa|nome=Exemplo|website=www.example.invalid}}\n\nExemplo.\n\n',hidden=[
 ['modelo desconhecido','{{Modelo desconhecido|'+link+'}}'],
 ['parâmetro nativo sem função','{{Citar web|titulo=Exemplo|url=https://other.invalid|campo_sem_funcao='+link+'}}'],
 ['parâmetro ignorado da própria caixa',''],
 ['modelo de formatação sem prova','{{Pequeno|'+link+'}}'],
 ['chamada desconhecida aberta','{{Modelo desconhecido|'+link],
 ['aspas','"Veja '+link+'."'],
 ['código','<code>'+link+'</code>'],
 ['nowiki','<nowiki>'+link+'</nowiki>'],
 ['comentário','<!-- '+link+' -->'],
 ['includeonly','<includeonly>'+link+'</includeonly>'],
 ['onlyinclude','<onlyinclude>'+link+'</onlyinclude>'],
 ['noinclude','<noinclude>'+link+'</noinclude>'],
 ['legenda de imagem','[[File:Example.jpg|thumb|'+link+']]'],
 ['atributo HTML','<span title="'+link+'">Texto.</span>'],
 ['atributo HTML com delimitador no valor','<span title="<i> '+link+'">Texto.</span>'],
 ['referência','<ref>'+link+'</ref>\n\n{{Referências}}']
];
for(const[id,owner]of hidden){const source=id==='parâmetro ignorado da própria caixa'?'{{Info/Empresa|nome=Exemplo|website=www.example.invalid|campo_sem_funcao='+link+'}}\n\nExemplo.':head+owner,p=a.v220BiographyPlan(source,cfg);assert.equal(p.text,source,id+' plano não usa dado oculto');checks++;const r=a.calculate({kind:'adjust',source,originalSource:source,options:cfg});assert(/\bwebsite\s*=\s*www\.example\.invalid/.test(r.text),id+' ação mantém host sem protocolo');checks++;assert(!r.changes.some(c=>c.id==='v220WebsiteValue'),id+' não conta reparo vetado');checks++;assert(a.v219AutomaticResultSafety(source,r).accepted,id);checks++;const second=a.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:cfg});assert.equal(second.text,r.text,id+' segunda ação estável');checks++;cases++;}
for(const[id,owner]of [['corpo literal',link],['ligações externas','== Ligações externas ==\n* '+link]]){const source=head+owner,expected=source.replace('website=www.example.invalid','website=[https://www.example.invalid www.example.invalid]'),p=a.v220BiographyPlan(source,cfg);assert.equal(p.text,expected,id);checks++;const r=a.calculate({kind:'adjust',source,originalSource:source,options:cfg});assert.equal(r.text,expected,id);checks++;assert.equal(r.changes.find(c=>c.id==='v220WebsiteValue')?.count,1,id);checks++;assert(a.v219AutomaticResultSafety(source,r).accepted,id);checks++;assert.equal(a.calculate({kind:'adjust',source:expected,originalSource:expected,options:cfg}).text,expected,id);checks++;cases++;}
console.log(JSON.stringify({suite:'v220-bio-website-owners',cases,checks,status:'passed'}));
