'use strict';
const assert=require('node:assert/strict'),{load,cfg}=require('./harness.cjs'),api=load(['layout_talk_repairs','talk_preparation']);
const options={...api.defaults,...cfg,namespaceNumber:1,pageTitle:'Discussão:Tema de teste',markup:false};let checks=0,cases=0;
function run(source,verify,extra={}){cases++;const c={...options,...extra},plan=api.v2221TalkAdditionsPlan(source,c);checks++;assert(api.v2221TalkAdditionsProof(source,plan.text,plan,c));verify(plan.text,plan);const final=api.v2221LayoutTalkPlan(plan.text,c).text;const again=api.v2221TalkAdditionsPlan(final,c);checks++;assert.equal(again.text,final);checks++;assert(!api.v2221TalkAdditionsProof(source,plan.text+'x',plan,c));return final;}
const tail='== Conversa ==\nComentário com {{Portal3|Cinema}} e Portal da física que fica literal.\n';
for(const portals of ['Portal da física Portal da tecnologia Portal da ciência','{{Portal3|Física|Tecnologia|Ciência}}']){
 const final=run(portals+'\n'+tail,text=>{checks++;assert(text.includes('{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}'));checks++;assert(text.endsWith(tail));});
 checks++;assert(final.startsWith('{{PD}}\n{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}\n'));
}
run('{{PD}}\n{{Marca de projeto|3|Física|3|rev=20240101}}\nPortal da tecnologia Portal da ciência\n'+tail,text=>{checks++;assert(text.includes('|Física|3'));checks++;assert(text.includes('|rev=20240101'));checks++;assert.equal((text.match(/\{\{Marca de projeto/g)||[]).length,1);checks++;assert(text.includes('|Tecnologia|?')&&text.includes('|Ciência|?'));});
for(const header of ['{{pd}}','{{Página de discussão}}','{{Cabeçalho de discussão}}'])run(header+'\n'+tail,text=>{checks++;assert.equal((text.match(/\{\{(?:pd|Página de discussão|Cabeçalho de discussão)\}\}/gi)||[]).length,1);checks++;assert(text.endsWith(tail));});
for(const source of ['== Conversa ==\nPortal da física Portal da tecnologia\n','<nowiki>Portal da física Portal da tecnologia</nowiki>\n',' Portal da física Portal da tecnologia\n'])run(source,text=>{checks++;assert(text.includes(source));checks++;assert(!text.includes('{{Marca de projeto'));});
run('Portal da física Portal do tema inexistente\n'+tail,text=>{checks++;assert(text.includes('Portal da física Portal do tema inexistente'));checks++;assert(!text.includes('{{Marca de projeto'));});
for(const extra of [{auxiliaryTemplates:false},{namespaceNumber:0},{sectionOnly:true}])run('Portal da física\n'+tail,text=>{checks++;assert.equal(text,'Portal da física\n'+tail);},extra);
console.log(JSON.stringify({suite:'current-unified-talk-preparation',checks,cases,passed:true,wikipediaWrites:0}));
