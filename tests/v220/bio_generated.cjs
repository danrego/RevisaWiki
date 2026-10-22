'use strict';
const assert=require('node:assert/strict'),api=require('./bio_harness.cjs');
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo',automaticBiographyPortals:false,automaticTopicPortals:false};let checks=0;
const profiles=['Info/Biografia','Info/Cientista','Info/Escritor','Info/Ator','Info/Político','Info/Música/artista','Info/Empresa','Info/Organização','Info/Sítio','Info/Aeroporto','Info/Futebolista','Info/Cavalo nomeado','Info/Animal','Info/Evento de MMA'];
const literal=['Texto','[[Exemplo]]','[[Exemplo|Legenda]]','{{Lang|en|Example}}','[https://example.invalid/?a=b&c=d#Fragment Exemplo]','<ref name="n">{{citar web|url=https://example.invalid/?a=b|titulo=Fonte}}</ref>','<nowiki>{{Dni|1|1|2001}}</nowiki>'];
const unknownKeys=['outro','resting_place','influenciado','influenciado_por','influenciados','influências','companheiro','companheira','birth_country','localnasc','instrução','obras_destaque'];
for(const name of profiles)for(const key of unknownKeys)for(const value of literal){const source='{{'+name+'|nome=Exemplo|'+key+'='+value+'}}\n\nExemplo.';const p=api.v220BiographyPlan(source,cfg);assert.equal(p.text,source);assert(api.v220BiographyProof(source,p.text,p,cfg));checks+=2;}
const imageBad=['{{Imagem múltipla|image3=Example.jpg|height2=203|image4=Other.jpg|height2=1536}}','[[File:Example.jpg|thumb|200px|alt=Texto|Legenda]]','[[File:Example.jpg|left|Legenda]]','[[File:Example.jpg|upright=1.5|Legenda]]','[[File:Example.jpg|thumb|class=Outra|Legenda]]','[[File:Example.jpg|thumb|page=2|Legenda]]','[[File:Example.jpg|thumb|thumbtime=1|Legenda]]','[[File:Example.jpg|frame|Legenda]]','[[File:Example.jpg|300x900px|Legenda]]','[[File:Example.jpg|thumb|Legenda|Nova legenda]]'];
for(const name of profiles)for(const value of imageBad){const source='{{'+name+'|nome=Exemplo|imagem='+value+'}}\n\nExemplo.';const p=api.v220BiographyPlan(source,cfg);assert.equal(p.text,source);checks++;}
const filenames=['Example.jpg','Example space.png','Exemplo ação.svg'];
for(const file of filenames)for(const opt of ['semmdolura','width250px','vertical'])for(const owner of ['nowiki','pre','syntaxhighlight','source','gallery','math','chem','score','timeline','mapframe','templatedata']){
 const image='[[Ficheiro:'+file+'|thumb|'+opt+'|200px|Legenda]]',source='<'+owner+'>'+image+'</'+owner+'>';assert.equal(api.v220BiographyPlan(source,cfg).text,source);checks++;
}
for(const scheme of ['http','https'])for(const host of ['example.invalid','www.example.invalid','exemplo.invalid'])for(const path of ['/','/a/b','/ação','/a%20b'])for(const query of ['?a=b','?a=b&c=d','?a=b&amp;c=d','?a=%2F&z=%23'])for(const fragment of ['','#frag','#ação']){
 const url=scheme+'://'+host+path+query+fragment,source='{{URL|'+url+'|Página}}',expected='{{URL|1='+url+'|2=Página}}';const p=api.v220BiographyPlan(source,cfg);assert.equal(p.text,expected);assert(api.v220BiographyProof(source,expected,p,cfg));assert.equal(api.v220BiographyPlan(expected,cfg).text,expected);checks+=3;
 const good='{{URL|1='+url+'|2=Página}}';assert.equal(api.v220BiographyPlan(good,cfg).text,good);checks++;
}
for(const marker of ['<!--','<nowiki>','<pre>']){const ending=marker==='<!--'?'-->':marker.replace('<','</'),source=marker+'{{Info/Empresa|website=[[https://example.invalid]]}}'+ending;assert.equal(api.v220BiographyPlan(source,cfg).text,source);checks++;}
const company='{{Info/Empresa|nome=Exemplo}}\n\nExemplo.';
for(const flags of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{sectionOnly:true},{section:'1'},{section:0},{pageDisambiguation:true},{pageRedirect:true},{contentModel:'javascript'},{discussionPage:true},{syntaxRepairs:false},{structuralRepairs:false}]){const opts={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo',...flags};assert.equal(api.v220BiographyPlan(company,opts).text,company);checks++;}
console.log(JSON.stringify({suite:'v220-bio-generated',checks,status:'passed'}));
