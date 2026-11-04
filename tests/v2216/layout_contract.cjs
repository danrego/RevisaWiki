'use strict';
const assert=require('node:assert/strict'),api=require('./layout_helpers.cjs')(),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false};let checks=0;
function test(source,expected,label){const p=api.v2216LayoutPlan(source,cfg);checks++;assert.equal(p.text,expected,label);checks++;assert(api.v2216LayoutProof(source,p.text,p,cfg),label+' proof');checks++;assert.equal(api.v2216LayoutPlan(p.text,cfg).text,p.text,label+' idempotence');checks++;assert(!api.v2216LayoutProof(source,p.text+'X',p,cfg),label+' mutation');}
const items=n=>Array.from({length:n},(_,i)=>'* [https://example.org/'+i+' Item '+i+']').join('\n');
for(let n=1;n<=14;n++)for(const title of ['Ligações externas','Bibliografia','Leitura adicional']){
 const list=items(n),wrapped='{{Colunas-lista|2|2=\n'+list+'\n}}',desired=n<8?list:wrapped;
 test('== '+title+' ==\n'+wrapped,'== '+title+' ==\n'+desired,'explicit threshold '+title+n);
 test('== '+title+' ==\n'+list,'== '+title+' ==\n'+desired,'plain threshold '+title+n);
}
for(const n of [1,5,8,12]){const a=items(Math.ceil(n/2)),b=items(Math.floor(n/2));if(!b)continue;const body=a+'\n'+b;test('== Ligações externas ==\n{{Colunas|col1=\n'+a+'\n|col2=\n'+b+'\n}}','== Ligações externas ==\n'+(n<8?body:'{{Colunas-lista|2|2=\n'+body+'\n}}'),'manual columns '+n);}
const infobox='{{Info/Biografia/Wikidata}}',lead="'''Exemplo''' é uma pessoa.";
test(infobox+lead,infobox+'\n'+lead,'inline native infobox');
test('<div style="float:right;clear:right;max-width:100%;overflow-x:auto" tabindex="0" role="region" aria-label="Informações">\n{{Info/Biografia|nome=Exemplo|dados=<ref>Fonte</ref>}}\n</div>\n'+lead,'{{Info/Biografia|nome=Exemplo|dados=<ref>Fonte</ref>}}\n'+lead,'native infobox wrapper');
test('<div style="max-width:100%;overflow-x:auto" tabindex="0" role="region" aria-label="Navegação">\n{{Portal3|Ciência}}\n</div>','{{Portal3|Ciência}}','native footer wrapper');
test('{{Artigo bom}}\nTexto.\n{{Artigo bom}}','{{Artigo bom}}\nTexto.\n','quality duplicate');
test('{{Artigo destacado}}\nTexto.\n{{Artigo destacado}}','{{Artigo destacado}}\nTexto.\n','featured duplicate');
test('Texto.\n{{Controle de autoridade}}\n{{NF|1900|1980|Exemplo}}\n{{Portal3|Biografias}}','Texto.\n{{NF|1900|1980|Exemplo}}\n{{Portal3|Biografias}}','indirect authority retains all composite metadata');
test('Texto.\n[[Categoria:Exemplos| ]]\n\n[[Categoria:Outros]]\n{{DEFAULTSORT:Nome}}','Texto.\n\n{{DEFAULTSORT:Nome}}\n[[Categoria:Exemplos| ]]\n[[Categoria:Outros]]\n','metadata block');
for(const source of [
 '<nowiki>'+infobox+lead+'</nowiki>', '<!--'+infobox+lead+'-->', '{{Exemplo|'+infobox+lead+'}}',
 '<div class="interactive" style="max-width:100%;overflow-x:auto">{{Portal3|Ciência}}</div>',
 '<div style="max-width:100%;overflow-x:auto" tabindex="0" role="region" aria-label="Tabela">\n{|\n| A || B\n|}\n</div>',
 '{{Artigo bom|configuração=outra}}\n{{Artigo bom}}',
 '== Ligações externas ==\n{{Colunas|col1=Primeira comparação|col2=Segunda comparação}}',
 '== Ligações externas ==\n{{Colunas-lista|2|2=\n'+items(2)+'\n|estilo=background:red}}',
 '== Ligações externas ==\n{{Colunas|col1=\n* Primeiro\n|col3=\n* Terceiro\n}}',
 '{{Controle de autoridade|VIAF=123}}\n{{NF|1900|1980|Exemplo}}'
])test(source,source,'protected or meaningful owner');


const metadataStatus='Texto.\n\n{{Navbox}}\n{{Navbox}}\n\n[[Categoria:Uma]]\n[[Categoria:Duas]]\n[[Categoria:Três]]\n{{Artigo destacado}}';const metadataStatusResult=api.v2216LayoutPlan(metadataStatus,cfg);assert(!/\n(?:[ \t]*\n){2,}/.test(metadataStatusResult.text));checks++;


for(const options of [{endMatterColumns:false},{externalLinkColumns:false},{endMatter:false}]){const source='== Ligações externas ==\n'+items(8);assert.equal(api.v2216LayoutPlan(source,{...cfg,...options}).text,source);checks++;}
console.log(JSON.stringify({suite:'layout-2.21.6',checks,passed:true}));
