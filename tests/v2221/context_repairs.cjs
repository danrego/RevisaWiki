'use strict';
const assert=require('node:assert/strict'),{load,cfg}=require('./harness.cjs');
const api=load(['context_repairs','citation_repairs'],{contextPatch:true});let checks=0;
function yes(v,m){checks++;assert.ok(v,m);}
for(const text of ['[[Ficheiro:Portrait of "Example.jpg|miniatura|Legenda.]]\n{{Citar web|title=T|website=Site}}','Uma frase encerrada".\n{{Citar web|title=T|website=Site}}']){
 const shield=api.v219LegacySyntaxProtected(text);yes(!shield.unclosed.length,'filename/closing quote does not hide rest');
 yes(api.v2221CitationFieldsPlan(text,{...api.defaults,...cfg}).text.includes('|obra=Site'),'independent citation remains visible');
}
for(const text of ['"{{Citar web|title=T}}"','"Uma citação realmente sem fim\n{{Citar web|title=T}}']){
 yes(api.v2221CitationFieldsPlan(text,{...api.defaults,...cfg}).text===text,'true quote remains protected');
}
for(const text of ['{{Info/Biografia|nome=A\n|}}\nTexto.','{{Começa caixa}}\n{{S-ttl|titulo=Exemplo|anos=2024}}\n{{Termina caixa}}']){
 const scan=api.v24SyntaxScan(text);yes(!scan.issues.some(i=>/table/.test(i.code)),'valid template/table ending is recognized');
}
const tag='Texto.<ref>{{Citar web|título=x < y > z|url=https://example.org}}</ref>\n{{Referências}}';
const scan=api.v24SyntaxScan(tag);yes(!scan.issues.some(i=>i.code==='syntax-unclosed-tag'),'literal less-than is not a new HTML tag');
yes(api.v2221NativeTagIntent('< ref name="x">',0),'spaced ref remains tag intent');
yes(!api.v2221NativeTagIntent('< y >',0),'comparison is text');
yes(!api.v2221ISBNValid('4006381333931'),'EAN rejected');
console.log(JSON.stringify({suite:'v2221-context-repairs',checks,passed:true,wikipediaWrites:0}));
