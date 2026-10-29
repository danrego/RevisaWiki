'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.3/RevisaWiki_v2_21_3.js'),api=require(core),{box}=require('./fixtures.cjs');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa de teste',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-10-28'};
let checks=0,calculations=0;const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};const rows=[];
for(const name of ['Biografia','Cientista','Escritor'])for(const framed of ['miniatura','thumb','frameless']){
 const prefix='imagem=[[Ficheiro:Example.jpg|'+framed+'|200px|',inline=prefix+'alt=Texto da opção|Legenda]]',generic=prefix+'Legenda]]';
 const fixtures=[
  {id:'conflicting-new-alt',fields:inline+'|imagem_alt=Texto do campo novo',preserve:true},
  {id:'conflicting-old-alt',fields:inline+'|alt=Outro texto',preserve:true},
  {id:'same-new-alt',fields:inline+'|imagem_alt=Texto da opção',preserve:false},
  {id:'no-alt-target',fields:inline,preserve:false},
  {id:'both-alt-fields',fields:inline+'|imagem_alt=|alt=Texto da opção',preserve:true},
  {id:'image-class',fields:inline+'|imagem_classe=classe-local',preserve:true},
  {id:'generic-new-alt',fields:generic+'|imagem_alt=Texto do campo novo',preserve:true},
  {id:'generic-old-alt',fields:generic+'|alt=Outro texto',preserve:true},
  {id:'generic-class',fields:generic+'|imagem_classe=classe-local',preserve:true},
  {id:'generic-control',fields:generic,preserve:false},
  {id:'without-size',fields:inline.replace('|200px',''),preserve:true},
  {id:'caption-conflict',fields:inline+'|legenda=Legenda externa',preserve:true},
  {id:'size-conflict',fields:inline+'|imagem_tamanho=180px',preserve:true},
  {id:'dynamic-alt',fields:inline+'|imagem_alt={{Modelo|Texto}}',preserve:true},
  {id:'empty-new-alt',fields:inline+'|imagem_alt=',preserve:false}
 ];
 for(const item of fixtures){
  const source=box(item.fields,name),r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
  eq(api.v219AutomaticResultSafety(source,r).accepted,true,name+' '+framed+' '+item.id+' passes full integrity gate');
  eq(r.text.includes('[[Ficheiro:Example.jpg|'),item.preserve,name+' '+framed+' '+item.id+' activates no unproved image branch');
  if(!item.preserve){eq(r.text.includes('imagem=Example.jpg'),true,'Filename remains exact');eq(r.text.includes('200px'),true,'Explicit size remains exact');eq(r.text.includes('Legenda'),true,'Caption remains exact');if(item.fields.includes('alt='))eq(r.text.includes('Texto da opção'),true,'ALT remains exact');}
  if(item.id==='conflicting-new-alt')eq(r.text.includes('|imagem_alt=Texto do campo novo'),true,'Conflicting source ALT is preserved');
  const second=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:cfg});calculations++;eq(second.text,r.text,'Image repair is idempotent');
  rows.push({name,framed,id:item.id,unwrapped:!item.preserve});
 }
}
const receipt={suite:'biography-image-compatibility-2.21.3',runtimeSha256:crypto.createHash('sha256').update(fs.readFileSync(core)).digest('hex'),checks,calculations,cases:rows};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
