'use strict';
const assert=require('node:assert/strict');
const a=require('./bio_harness.cjs');
const cfg={...a.defaults,namespaceNumber:0,pageTitle:'Exemplo',authorityControl:false,autoPreview:false};
const head='{{Info/Biografia/Wikidata}}\n\n',closed='Exemplo.',portal='{{Portal3|Biografias}}';
let cases=0,checks=0;
function plan(source,expected,options={}){const optionsAll={...cfg,...options},p=a.v220BiographyPlan(source,optionsAll);assert.equal(p.text,expected);checks++;assert(a.v220BiographyProof(source,expected,p,optionsAll));checks++;assert(!p.stages.some(s=>/portal/.test(s.name))||source===head+closed||source===head+closed+'\n\n{{Portal3|Biografias|Biografias}}');checks++;return p;}
function whole(source,expected,options={}){const opts={...cfg,...options},r=a.calculate({kind:'adjust',source,originalSource:source,options:opts});assert.equal(r.text,expected);checks++;assert(a.v219AutomaticResultSafety(source,r).accepted);checks++;const second=a.calculate({kind:'adjust',source:expected,originalSource:expected,options:opts});assert.equal(second.text,expected);checks++;assert(!second.changes.some(c=>c.id.startsWith('v220')));checks++;return r;}
const bodies=[
 ['chamada aberta','{{Lugar]] texto.'],
 ['parâmetro aberto','{{{campo|texto'],
 ['ligação interna aberta','[[Lugar'],
 ['ligação externa aberta','[https://example.invalid Página'],
 ['tabela irregular aberta','{| class="wikitable"\n|-\n| a || b\n|-\n| c'],
 ['elemento HTML aberto','<section>Texto'],
 ['referência aberta','<ref>Fonte'],
 ['atributo HTML aberto','<section title="texto'],
 ['nowiki aberto','<nowiki>Texto'],
 ['comentário aberto','<!-- Texto']
];
for(const[label,body]of bodies)for(const footer of ['',portal,portal+'\n'+portal]){const source=head+body+'\n\n'+footer;const p=plan(source,source);assert.equal(p.stages.length,0,label);checks++;const repairedRef=label==='referência aberta'&&!footer,expected=repairedRef?head+body+'\n\n</ref>\n\n{{Referências}}\n\n'+portal+'\n':source,r=whole(source,expected);if(repairedRef)assert.equal(r.changes.find(c=>c.id==='v220TopicPortals')?.count,1,label+' só após reparo independente');else assert(!r.changes.some(c=>/v220(?:TopicPortals|PortalCleanup)/.test(c.id)),label);checks++;cases++;}
for(const[label,body]of bodies.slice(0,7)){const source='{{Info/Biografia|nome=Exemplo|occupation=Investidor}}\n\n'+body+'\n\n'+portal+'\n'+portal,expected=source.replace('occupation=Investidor','ocupação=Investidor'),p=plan(source,expected,{occupationCase:false});assert(p.stages.some(s=>s.name==='native-infobox-fields'),label);checks++;const r=whole(source,expected,{occupationCase:false});assert.equal(r.changes.find(c=>c.id==='v220InfoboxField')?.count,1,label);checks++;assert(!r.changes.some(c=>/v220(?:TopicPortals|PortalCleanup)/.test(c.id)),label);checks++;cases++;}
const positive=head+closed,expected=positive+'\n\n'+portal+'\n';plan(positive,expected);const added=whole(positive,expected);assert.equal(added.changes.find(c=>c.id==='v220TopicPortals')?.count,1);checks++;cases++;
const duplicated=head+closed+'\n\n{{Portal3|Biografias|Biografias}}',clean=head+closed+'\n\n'+portal;plan(duplicated,clean);const cleaned=whole(duplicated,clean);assert.equal(cleaned.changes.find(c=>c.id==='v220PortalCleanup')?.count,1);checks++;cases++;
console.log(JSON.stringify({suite:'v220-bio-footer-boundary',cases,checks,status:'passed'}));
