'use strict';
const assert=require('node:assert/strict'),api=require('./layout_helpers.cjs')(),base={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false};let checks=0;
function run(source,cfg=base){const p=api.v2216LayoutPlan(source,cfg);assert(api.v2216LayoutProof(source,p.text,p,cfg));assert.equal(api.v2216LayoutPlan(p.text,cfg).text,p.text);assert(!api.v2216LayoutProof(source,p.text,{...p,sourceHash:'wrong'},cfg));checks+=3;return p.text;}
const items=n=>Array.from({length:n},(_,i)=>'* {{Citar web|url=https://example.org/'+i+'?a=b&c=d|título=Item '+i+'|data=2026-01-02}}').join('\n');
for(let n=1;n<=40;n++)for(const subsection of ['', '=== Estatísticas ===\n','=== Estatísticas ===\n==== Históricas ====\n']){
 const source='== Ligações externas ==\n'+subsection+items(n),text=run(source);assert.equal(text.includes('{{Colunas-lista|2|2='),n>=8);assert.equal((text.match(/\* \{\{Citar web/g)||[]).length,n);checks+=2;
}
for(const template of ['Info/Biografia','Info/Político','Info/Cientista','Info/Localidade dos Estados Unidos','Info/Biografia/Wikidata'])for(const style of ['max-width:100%;overflow-x:auto','float:right;clear:right;max-width:100%;overflow-x:auto']){
 const info='{{'+template+'|nome=Exemplo|dados=<ref name="n">{{Citar web|url=https://example.org/?a=b|título=Título}}</ref>|imagem=[[Ficheiro:Example.jpg|300px|alt=Descrição|Legenda]]}}',source='<div style="'+style+'" tabindex="0" role="region" aria-label="Informações">\n'+info+'\n</div>\nTexto <ref name="n"/>.',text=run(source);assert.equal(text,info+'\nTexto <ref name="n"/>.');checks++;
}
for(const outer of ['nowiki','syntaxhighlight','pre','code','poem','math','chem','source','gallery']){
 const body='{{Artigo bom}}{{Artigo bom}}\n{{Info/Biografia/Wikidata}}Texto.\n[[Categoria:Exemplo]]\n\n[[Categoria:Outra]]';const source='<'+outer+'>'+body+'</'+outer+'>';assert.equal(run(source),source);checks++;
}
for(const extra of ['class="table"','id="custom"','aria-live="polite"','data-sort="numeric"']){
 const source='<div style="max-width:100%;overflow-x:auto" '+extra+'>\n{{Portal3|Ciência}}\n</div>';assert.equal(run(source),source);checks++;
}
for(const name of ['Commonscat','Wikiquote','Wikivoyage','Wikisource','Wikcionário']){
 const box='{{'+name+'|1=Destino|2=Rótulo}}',source='== Ver também ==\n* [[Outro]]\n\n== Ligações externas ==\n'+box,expected='== Ver também ==\n'+box+'\n* [[Outro]]\n\n== Ligações externas ==\n';assert.equal(run(source),expected);checks++;
}
for(const [name,expected] of [['Commonscat-inline','{{Commonscat|1=Destino|2=Rótulo}}'],['Commons em linha','{{Commons|1=Destino|2=Rótulo}}'],['Wikisource-inline','{{Wikisource|1=Destino|2=Rótulo}}'],['Wikiquote-inline','{{Wikiquote|1=Destino|2=Rótulo}}']]){assert.equal(run('== Ligações externas ==\n* {{'+name+'|Destino|Rótulo}}'),'== Ligações externas ==\n'+expected);checks++;}
assert.equal(run('== Ligações externas ==\n{{Wikivoyage em linha|fr|Destination|Rótulo}}'),'== Ligações externas ==\n{{Wikivoyage|1=fr:Destination|2=Rótulo}}');checks++;
for(const source of ['== Ligações externas ==\n{{Wikiquote-inline|Destino|Rótulo|links=personalizado}}','== Ligações externas ==\n{{Wikivoyage em linha|fr|Destination|Rótulo|oldid=12345}}','== Ligações externas ==\n{{Wikcionário em linha|Destino|Rótulo}}']){assert.equal(run(source),source);checks++;}
assert.equal(run('{{Artigo destacado}}{{Featured article}}'),'{{Artigo destacado}}');checks++;
assert.equal(run('{{NF|1900|1980|Exemplo}}\n{{NM|1900|1980|Exemplo}}\n{{Portal3|Biografias}}'),'{{NM|1900|1980|Exemplo}}\n{{Portal3|Biografias}}');checks++;
for(const name of ['Controlo de autoridade','Authority control','Authority Control','Controle de autoriade']){assert.equal(run('{{'+name+'|VIAF=123}}\n{{Portal3|Ciência}}'),'{{Controle de autoridade|VIAF=123}}\n{{Portal3|Ciência}}');checks++;}
const conflicting='{{DEFAULTSORT:Primeiro}}\n{{NM|1900|1980|Segundo}}\n{{Portal3|Biografias}}\n[[Categoria:Exemplo]]';const t=run(conflicting);assert(t.indexOf('DEFAULTSORT:Primeiro')<t.indexOf('NM|1900|1980|Segundo'));checks++;
const protectedOwner='== Ligações externas ==\n{{Colunas|col1=\n* Vantagem um\n* Vantagem dois\n|col2=\n* Problema um\n* Problema dois\n}}';assert.equal(run(protectedOwner),protectedOwner);checks++;
const unknown='{{Controle de autoridade}}\n{{Unknown footer}}\n{{Portal3|Ciência}}';assert.equal(run(unknown),unknown);checks++;
for(const n of [7,8,10]){const nested=items(n)+'\n** Subitem sem nova coluna';const text=run('== Bibliografia ==\n'+nested);assert.equal(text.includes('{{Colunas-lista|2|2='),n>=8);assert(text.includes('** Subitem sem nova coluna'));checks+=2;}


for(const flag of ['embed','child','embutido','incorporado']){const source='<div style="float:right;clear:right;max-width:100%;overflow-x:auto" role="region" tabindex="0">\n{{Info/Biografia|'+flag+'=sim|nome=Exemplo}}\n</div>';assert.equal(run(source),source);checks++;}
console.log(JSON.stringify({suite:'layout-matrix-2.21.6',checks,passed:true}));
