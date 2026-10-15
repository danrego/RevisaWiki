'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const file=process.argv[2];if(!file)throw Error('Informe o núcleo completo da versão a testar.');
const api=require(path.resolve(file));
const common={namespaceNumber:0,sectionOnly:true,pageTitle:'Teste de seção',autoPreview:false,registryDoiCheck:false};
let checks=0;
for(const section of ['== Biografia ==\nUma excessão.<ref name="externa" />\n','Texto.<ref>Fonte.</ref>\n','Texto.{{sfn|Autor|2000}}\n','Texto.<ref group="nota">Nota.</ref>\n',"== Referências ==\n{{Referências}}\n",'== Ligações externas ==\n'+Array.from({length:8},(_,i)=>'* [https://example.org/'+i+' Ligação '+i+']\n').join('')]){
 const result=api.cleanup(section,common),again=api.cleanup(result.text,common);
 assert.equal(result.text.includes('{{Referências}}'),section.includes('{{Referências}}'));checks++;
 assert.equal(result.text.includes('{{Notas e referências'),false);checks++;
 assert.equal(result.text.includes('{{Colunas-lista'),false);checks++;
 assert.equal(result.text.includes('{{Portal3'),false);checks++;
 assert.equal(result.text.includes('{{Controle de autoridade'),false);checks++;
 assert.equal(again.text,result.text);checks++;
}
const full=api.cleanup('Uma frase.<ref>Fonte.</ref>\n',{...common,sectionOnly:false});
assert.ok(full.text.includes('{{Referências}}'));checks++;
const s='Introdução.<ref name="externa">Fonte.</ref>\n== Seção ==\nUma excessão.<ref name="externa" />\n== Outra ==\nTexto.\n{{Referências}}\n';
const sections=[{index:'1',hLevel:2,codepointOffset:Array.from(s.slice(0,s.indexOf('== Seção'))).length},{index:'2',hLevel:2,codepointOffset:Array.from(s.slice(0,s.indexOf('== Outra'))).length}];
const range=api.sectionRange(s,sections,'1'),result=api.cleanup(s.slice(range.start,range.end),common);
const composed=api.composeSection(s,sections,'1',result.text);
assert.equal(composed.text.slice(0,range.start),s.slice(0,range.start));checks++;
assert.equal(composed.text.slice(composed.end),s.slice(range.end));checks++;
assert.equal(api.referenceAudit(composed.text).filter(f=>f.code==='missing-definition').length,0);checks++;
assert.ok(composed.text.includes('Uma exceção.'));checks++;
console.log(JSON.stringify({suite:'v26-section-contracts',passed:checks,failed:0,networkRequests:0,wikipediaWrites:0}));
