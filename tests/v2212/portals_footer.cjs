'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),api=require(process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.2/RevisaWiki_v2_21_2.js'));let checks=0;function eq(a,b,label){assert.deepEqual(a,b,label);checks++;}
const samples=[
 ['{{esboço personalizado|tema=[[Física]]}}','stub'],
 ['<includeonly>{{Esboço personalizado|tema=[[Álbum]]|imagem={{Imagem de exemplo|{{{1|}}}}}|categoria={{#if:{{{1|}}}|X|Y}}}}</includeonly><noinclude>{{Documentação}}</noinclude>','stub'],
 ['{{esboço-personalizado|tema=[[Hidrografia]]}}[[Categoria:!Esboços sobre hidrografia|{{PAGENAME}}]]<noinclude>Documentação.</noinclude>','stub'],
 ['<!-- Aviso de manutenção -->{{Navbox/Artista musical|nome=Exemplo|grupo1=Obras|lista1=* Exemplo}}<noinclude>{{Documentação}}</noinclude>','navbox']
];for(const[source,role]of samples)eq(api.v2212PortalFooterRole(source),role,'confirmed finite wrapper');
const negatives=[
 'Texto de apresentação.{{esboço personalizado|tema=X}}',
 '{{esboço personalizado|tema=X}}Texto de conclusão.',
 '{{esboço personalizado|tema=X}}{{esboço personalizado|tema=Y}}',
 '{{#if:{{{x|}}}|{{esboço personalizado|tema=X}}}}',
 '<nowiki>{{esboço personalizado|tema=X}}</nowiki>',
 '{{esboço personalizado|tema=<nowiki>X</nowiki>}}',
 '<pre>{{esboço personalizado|tema=X}}</pre>',
 '{{esboço personalizado|child=yes|tema=X}}',
 '{{Navbox/Artista musical|child=yes}}',
 '{{Navbox/Artista musical|1=subgrupo}}',
 '{{Começa caixa}}{{Caixa de sucessão|título=X}}{{Termina caixa}}',
 '{{esboço personalizado|tema=X}}<ref>Fonte.</ref>',
 '{{esboço personalizado|tema=X}}[[Categoria:{{#if:x|Y|Z}}]]',
 '<onlyinclude>{{esboço personalizado|tema=X}}</onlyinclude>',
 '{{Esboço Personalizado|tema=X}}',
 '{{esboço personalizado|tema=X}',
 '{{esboço personalizado|tema=X}}<includeonly>',
 '{{esboço personalizado|tema=X}}<noinclude>aberto'
];for(const[source,index]of negatives.map((s,i)=>[s,i]))eq(api.v2212PortalFooterRole(source),null,'negative-'+index);
console.log(JSON.stringify({suite:'v2212-portals-footer',checks,status:'passed'}));
