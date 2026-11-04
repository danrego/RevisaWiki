'use strict';
const assert=require('node:assert/strict'),api=require('./layout_helpers.cjs')(),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false};let checks=0;
function plan(source){const p=api.v2216LayoutPlan(source,cfg);assert(api.v2216LayoutProof(source,p.text,p,cfg));assert.equal(api.v2216LayoutPlan(p.text,cfg).text,p.text);assert(api.v2216LayoutSortWitness(source,p.text).accepted);assert(p.steps.every(s=>s.sortWitness.accepted));checks+=4;return p;}
const protectedSorts=[
 '{{DEFAULTSORT:A}}\nTexto.\n{{Navbox|name=Exemplo|title=Exemplo|list1={{DEFAULTSORT:B}}}}\n[[Categoria:Exemplo]]',
 '{{DEFAULTSORT:A}}\n{{Navbox|name=Exemplo|title=Exemplo|list1={{DEFAULTSORT:B}}}}\n[[Categoria:Exemplo]]',
 '{{DEFAULTSORT:A}}\nTexto.\n{{Citação|{{DEFAULTSORT:B}}}}\n[[Categoria:Exemplo]]',
 '{{DEFAULTSORT:A}}\n{{Navbox|list1={{NM|1900|1980|B}}}}\n[[Categoria:Exemplo]]',
 '{{DEFAULTSORT:A}}\n<blockquote>{{DEFAULTSORT:B}}</blockquote>\n[[Categoria:Exemplo]]',
 '{{DEFAULTSORT:A}}\n<poem>{{DEFAULTSORT:B}}</poem>\n[[Categoria:Exemplo]]',
 '{{DEFAULTSORT:A}}\n{{ORDENAÇÃO:B}}\n{{Unknown program}}\n[[Categoria:Exemplo]]',
 '{{DEFAULTSORT:A}}\n{{Unknown program}}\n[[Categoria:Exemplo]]',
 '{{DEFAULTSORT:A}}\n<unknown-extension>program text</unknown-extension>\n[[Categoria:Exemplo]]',
 '[[Categoria:Exemplo|{{DEFAULTSORT:B}}]]\n{{DEFAULTSORT:A}}\n[[Categoria:Outra]]',
 '{{NM|1900|1980|A}}\n{{DEFAULTSORT:B}}\n{{Portal3|Biografias}}',
 '{{NM|1900|1980|A}}\n{{Navbox|list1={{DEFAULTSORT:B}}}}\n{{Portal3|Biografias}}',
 '{{NM|1900|1980|A}}\n{{Unknown program}}\n{{Portal3|Biografias}}',
 '{{NM|1900|1980|A}}\n{{DEFAULTSORT:B}}\n{{NM|1900|1980|A}}\n{{Portal3|Biografias}}',
 '{{NF|1900|1980|A}}\n{{Unknown program}}\n{{NM|1900|1980|A}}\n{{Portal3|Biografias}}'
];
for(const source of protectedSorts){const p=plan(source);assert.equal(p.text,source);checks++;}
for(const name of ['DEFAULTSORT','DEFAULTSORTKEY','DEFAULTCATEGORYSORT','ORDENAÇÃO','ORDENACAO']){const source='{{DEFAULTSORT:A}}\n{{Navbox|list1={{'+name+':B}}}}\n[[Categoria:Exemplo]]';assert.equal(plan(source).text,source);checks++;}
const gapSource='{{DEFAULTSORT:A}}\n{{Unknown program}}\n[[Categoria:Exemplo| ]]\n \n[[Categoria:Outra]]',gaps=plan(gapSource);assert.equal(gaps.text,'{{DEFAULTSORT:A}}\n{{Unknown program}}\n[[Categoria:Exemplo| ]]\n[[Categoria:Outra]]');assert(gaps.steps.some(s=>s.edits.some(e=>e.kind==='literal-category-gap')));checks+=2;
const mixed='{{Controle de autoridade}}\n{{NM|1900|1980|A}}\n{{Unknown program}}\n{{Portal3|Biografias}}',mixedPlan=plan(mixed);assert(!mixedPlan.text.includes('{{Controle de autoridade}}'));assert(mixedPlan.text.indexOf('{{NM')<mixedPlan.text.indexOf('{{Unknown'));checks+=2;
const adjacent='{{NF|1900|1980|A}}\n{{NM|1900|1980|A}}\n{{Portal3|Biografias}}';assert.equal(plan(adjacent).text,'{{NM|1900|1980|A}}\n{{Portal3|Biografias}}');checks++;
const unstable='{{NM|1900|1980|{{Unknown value}}}}\n{{NM|1900|1980|{{Unknown value}}}}\n{{Portal3|Biografias}}';assert.equal(plan(unstable).text,unstable);checks++;
const pure='{{DEFAULTSORT:A}}\n{{Portal3|Ciência}}\n[[Categoria:Exemplo]]';const purePlan=plan(pure);assert(purePlan.text.indexOf('{{DEFAULTSORT:A}}')>purePlan.text.indexOf('{{Portal3'));checks++;
assert.equal(api.v2216LayoutSortWitness('{{DEFAULTSORT:A}}\n{{Unknown program}}','{{Unknown program}}\n{{DEFAULTSORT:A}}').accepted,false);checks++;
assert.equal(api.v2216LayoutSortWitness('{{DEFAULTSORT:A}}\n{{Portal3|Ciência}}','{{Portal3|Ciência}}\n{{DEFAULTSORT:A}}').accepted,true);checks++;
console.log(JSON.stringify({suite:'layout-sort-integrity-2.21.6',checks,passed:true}));
