'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),file=process.env.REVISAWIKI_BUNDLE||path.join(root,'dist/2.20.0/RevisaWiki_v2_20_0_completo.js'),api=require(file);
assert.equal(typeof api.v220BiographyPlan,'function');
let checks=0,cases=0;
const config={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo',authorityControl:false,autoPreview:false};
const box=(name,fields)=>'{{'+name+'|nome=Exemplo|'+fields+'}}\n\nExemplo.';
async function run(source,options={}){const r=await api.calculate({kind:'adjust',source,originalSource:source,options:{...config,...options}}),decision=api.v219AutomaticResultSafety(source,r);assert(decision.accepted,JSON.stringify({source,decision}));assert.equal(r.preservation.length,0);checks+=2;cases++;return r;}
(async()=>{
 for(const [source,want]of [
  [box('Info/Empresa','website=www.example.invalid')+'\n\n== Ligações externas ==\n* [https://www.example.invalid Página oficial]','[https://www.example.invalid www.example.invalid]'],
  [box('Info/Organização','website=[[https://example.invalid|Página]]'),'[https://example.invalid Página]'],
  [box('Info/Biografia','ocupação=[[Investidor]], [[empreendedor]]'),'[[investidor]], [[empreendedor]]'],
  [box('Info/Biografia','nascimento_data=outubro {{dni|||1977|sem idade}}<ref>Fonte.</ref>'),'{{dni||10|1977|sem idade}}<ref>Fonte.</ref>'],
  [box('Info/Cientista','campo=[[Física]]|instituições=[[Instituto Exemplo]]'),'instituicao_trabalho=[[Instituto Exemplo]]'],
  [box('Info/Evento de MMA','image={{Imagem múltipla|image1=Example.jpg|image2=Other.jpg}}|caption=Legenda'),'imagem={{Imagem múltipla|image1=Example.jpg|image2=Other.jpg}}'],
  [box('Info/Cavalo nomeado','imagem=[[File:Example.jpg|thumb|250px|Legenda]]'),'imagem_tamanho'],
  ['[[File:Example.png|semmdolura|75px]]','[[File:Example.png|semmdolura|75px]]'],
  ['[[File:Example.jpg|thumb|vertical|Legenda]]','|thumb|Legenda'],
  ['[[File:Example.jpg|thumb|width250px|Legenda]]','|thumb|250px|Legenda'],
  ['{{URL|https://example.invalid/?a=b&c=d#Frag|Página}}','{{URL|1=https://example.invalid/?a=b&c=d#Frag|2=Página}}'],
  ['{{Portal3|Portal3|Física}}','{{Portal3|Física}}'],
  ['{{Portal3|Economia|Economia e Negócios}}','{{Portal3|Economia}}']
 ]){const r=await run(source);assert(r.text.includes(want),JSON.stringify({source,want,text:r.text}));checks++;}
 for(const name of ['Info/Empresa','Info/Empresa/Wikidata','Info/Jogo de cartas','Info/Jogo de tabuleiro','Info/Astro','Info/Episódios de The Simpsons','Info/Filme/Wikidata','Info/Parque de diversão','Info/Assentamento/Marrocos','Info/Unidade Militar','Info/Bebida','Info/Biografia/Wikidata']){const source=box(name,name.endsWith('/Marrocos')?'com':''),r=await run(source);assert(/\{\{Portal3\|/.test(r.text),JSON.stringify({name,text:r.text}));assert(r.changes.some(c=>/portal/i.test(c.id)||c.id==='v220Biography'));checks+=2;}
 for(const source of [box('Info/Biografia','sepultamento=[[Cemitério Exemplo]]'),box('Info/Biografia','enterro=[[Cemitério Exemplo]]'),box('Info/Biografia','enterro_local=[[Cemitério Exemplo]]'),box('Info/Biografia','influenciado_por=[[Pessoa Exemplo]]'),box('Info/Artista','influências=[[Pessoa Exemplo]]'),box('Info/Empresa','website=hide'),box('Info/Empresa','website=www.example.invalid'),box('Info/Revista científica','sítio=https://example.invalid'),box('Info/Cavalo nomeado','imagem=[[File:Example.jpg|thumb|upright=1.2|Legenda]]'),'[[File:Example.jpg|thumb|vertical]]','[[File:Example.jpg|thumb|width1200px|Legenda]]','{{URL|1=https://example.invalid/?a=b|2=Página}}','[[Globo.com]]','<nowiki>[[File:Example.jpg|thumb|vertical|Legenda]]</nowiki>','{{citar web|url=https://example.invalid|website=BBC News|titulo=Exemplo}}']){const r=await run(source,{automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,infoboxes:false});const plan=api.v220BiographyPlan(source,{...config,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,infoboxes:false});assert.equal(plan.text,source);checks++;if(source.includes('website=BBC News'))assert(/(?:website|obra|publicado)\s*=\s*BBC News/.test(r.text)),checks++;}
 console.log(JSON.stringify({suite:'v220-bio-whole-actions',cases,checks,status:'passed'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
