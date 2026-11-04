'use strict';
const assert=require('node:assert/strict'),api=require('./layout_helpers.cjs')();let checks=0;
for(const name of ['Descrição curta','Descricao curta','Short description','Shortdescription','Sem interwiki','Seminterwiki','Sem interwikis']){
 for(const value of ['Texto simples.','Texto com [[Outra página]].','{{PAGENAME}}','Texto {{BASEPAGENAME}}','{{!}}']){assert.equal(api.v2216ObsoleteOwnerRemovalAllowed('{{'+name+'|'+value+'}}'),true,name+' literal/text-only magic');checks++;}
 for(const value of ['{{DEFAULTSORT:B}}','{{NM|1980||B}}','{{NF|1980||B}}','{{Unknown program}}','{{#if:1|{{DEFAULTSORT:B}}}}','{{PAGENAME|{{DEFAULTSORT:B}}}}','<ref>Fonte</ref>','<poem>{{DEFAULTSORT:B}}</poem>','<unknown-extension>Texto</unknown-extension>','[[Categoria:Outra]]','[[Ficheiro:Example.jpg]]','__NOINDEX__','{|\n| Célula\n|}','{{{parâmetro|valor}}}']){assert.equal(api.v2216ObsoleteOwnerRemovalAllowed('{{'+name+'|'+value+'}}'),false,name+' retains nested program/metadata');checks++;}
}
assert.equal(api.v2216ObsoleteOwnerRemovalAllowed('{{Unknown obsolete owner|Texto}}'),false);checks++;
console.log(JSON.stringify({suite:'obsolete-owner-programs-2.21.6',checks,passed:true}));
