'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),api=require(path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(__dirname,'../../dist/2.21.6/RevisaWiki_v2_21_6.js'))),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false,footerProfiles:{navbox:'navbox'}};let checks=0;
const cases=[
 ['nested-sort-prose','{{DEFAULTSORT:A}}\nTexto.\n{{Navbox|name=Exemplo|title=Exemplo|list1={{DEFAULTSORT:B}}}}\n[[Categoria:Exemplo]]'],
 ['nested-sort-adjacent','{{DEFAULTSORT:A}}\n{{Navbox|name=Exemplo|title=Exemplo|list1={{DEFAULTSORT:B}}}}\n[[Categoria:Exemplo]]'],
 ['nested-composite','{{DEFAULTSORT:A}}\n{{Navbox|list1={{NM|1900|1980|B}}}}\n[[Categoria:Exemplo]]'],
 ['nested-sort-quote','{{DEFAULTSORT:A}}\n{{Citação|{{DEFAULTSORT:B}}}}\n[[Categoria:Exemplo]]'],
 ['composite-across-sort','{{NM|1900|1980|A}}\n{{DEFAULTSORT:B}}\n{{Portal3|Biografias}}'],
 ['composite-across-nested-sort','{{NM|1900|1980|A}}\n{{Navbox|list1={{DEFAULTSORT:B}}}}\n{{Portal3|Biografias}}'],
 ['duplicate-composite-around-sort','{{NM|1900|1980|A}}\n{{DEFAULTSORT:B}}\n{{NM|1900|1980|A}}\n{{Portal3|Biografias}}'],
 ['category-key-program','[[Categoria:Exemplo|{{DEFAULTSORT:B}}]]\n{{DEFAULTSORT:A}}\n[[Categoria:Outra]]'],
 ['opaque-program','{{DEFAULTSORT:A}}\n{{Unknown program}}\n[[Categoria:Exemplo]]'],
 ['opaque-extension','{{DEFAULTSORT:A}}\n<unknown-extension>value</unknown-extension>\n[[Categoria:Exemplo]]'],
 ['pure-relocation','{{DEFAULTSORT:A}}\n{{Portal3|Ciência}}\n[[Categoria:Exemplo]]']
];
for(const [ownerIndex,owner] of ['Descrição curta','Short description','Sem interwiki'].entries())for(const [programIndex,program]of ['{{DEFAULTSORT:B}}','{{NM|1980||B}}','{{NF|1980||B}}','{{Unknown program}}','<poem>{{DEFAULTSORT:B}}</poem>'].entries())cases.push(['obsolete-owner-'+ownerIndex+'-'+programIndex,'{{'+owner+'|'+program+'}}\n[[Categoria:Um]]']);
const rows=[];
for(const[id,body]of cases){const source='Texto sobre [[Brasil|Brasil]].\n'+body,r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});assert(api.v219AutomaticResultSafety(source,r).accepted,id+' no overall refusal');assert.deepEqual(r.preservation,[],id+' original preservation remains active');assert(r.text.includes('Texto sobre [[Brasil]].'),id+' independent safe correction applies');assert(api.v2216LayoutSortWitness(source,r.text).accepted,id+' all program order retained');const again=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:cfg});assert.equal(again.text,r.text,id+' complete endpoint idempotent');checks+=5;rows.push({id,source,text:r.text});}
console.log(JSON.stringify({suite:'full-writer-sort-integrity-2.21.6',checks,cases:rows.map(r=>r.id),passed:true}));
if(process.env.REVISAWIKI_SORT_NATIVE_INPUTS)require('fs').writeFileSync(process.env.REVISAWIKI_SORT_NATIVE_INPUTS,JSON.stringify(rows,null,2)+'\n');
