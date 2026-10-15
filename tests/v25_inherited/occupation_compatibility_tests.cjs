'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const script = require('./harness.cjs').apiPath;
const api = require(script);
for (const name of ['occupationValueCase', 'occupationCase']) assert.equal(typeof api[name], 'function', 'Expected exported helper ' + name);
const cfg = {...Object.fromEntries(Object.keys(api.defaults).map(k => [k, false])), infoboxes:true, occupationCase:true, namespaceNumber:0};
let passed=0;
const failures=[];
function targets(s) {
  // All fixture links are simple wikilinks. Canonicalize only the first letter,
  // which ptwiki normalizes in article titles, and retain all other characters.
  return [...s.matchAll(/\[\[([^\]\n]*?)\]\]/g)].map(m=>{
    const target=m[1].split('|')[0];
    return target.charAt(0).toLocaleUpperCase('pt')+target.slice(1);
  });
}
function canonicalLinks(s) {
  return s.replace(/\[\[([^\]\n]*?)\]\]/g,(all,body)=>{
    const parts=body.split('|');
    const target=parts[0].charAt(0).toLocaleUpperCase('pt')+parts[0].slice(1);
    return '[['+target+'|'+(parts.length>1?parts.slice(1).join('|'):parts[0])+']]';
  });
}
function equalWiki(actual, expected, label) {
  assert.equal(canonicalLinks(actual),canonicalLinks(expected),label);
}
function check(label,fn) {
  try {fn();passed++;} catch(e) {failures.push({label,error:e.message});}
}
const values = [
  ['simple occupation','Músico','músico'],
  ['female occupation','Médica','médica'],
  ['European spelling','Arquitecto','arquitecto'],
  ['compound profession','Professor universitário','professor universitário'],
  ['plain institution tail','Professor da Universidade de Coimbra','professor da Universidade de Coimbra'],
  ['institution with multiple common nouns capitalized','Diretor do Instituto Médico Legal','diretor do Instituto Médico Legal'],
  ['proper-name field without occupation','Universidade de Coimbra','Universidade de Coimbra'],
  ['person nickname beginning occupation','Professor Pardal','Professor Pardal'],
  ['CEO acronym','CEO','CEO'],
  ['DJ acronym','DJ','DJ'],
  ['allcaps conservative','MÉDICO','MÉDICO'],
  ['existing lower case','médico','médico'],
  ['line break list','Professor<br />Escritor<br>Político','professor<br />escritor<br>político'],
  ['list comma and conjunction','Músico, Escritor e Professor','músico, escritor e professor'],
  ['known occupation is lowercased beside opaque acronym','Professor e CEO','professor e CEO'],
  ['qualified mixed comma list is opaque','Professor da Universidade de Coimbra, CEO','Professor da Universidade de Coimbra, CEO'],
  ['qualified mixed conjunction list is opaque','Diretor do Instituto Médico Legal e CEO','Diretor do Instituto Médico Legal e CEO'],
  ['two qualified comma items remain conservative','Professor da Universidade de Coimbra, Diretor do Instituto Médico Legal','Professor da Universidade de Coimbra, Diretor do Instituto Médico Legal'],
  ['plain item with reference','Professor<ref name="p">{{citar web|título=Professor|url=https://example.test/Professor}}</ref>','professor<ref name="p">{{citar web|título=Professor|url=https://example.test/Professor}}</ref>'],
  ['template value','{{lang|pt|Professor}}','{{lang|pt|Professor}}'],
  ['dynamic parser value','{{#if:1|Professor|Médico}}','{{#if:1|Professor|Médico}}'],
  ['reference alone','<ref name="Professor">Professor</ref>','<ref name="Professor">Professor</ref>'],
  ['nowiki value','<nowiki>Professor</nowiki>','<nowiki>Professor</nowiki>'],
  ['literal URL','https://example.test/Professor','https://example.test/Professor'],
  ['external label','[https://example.test/Professor Professor]','[https://example.test/Professor Professor]'],
  ['interwiki value','[[en:Professor]]','[[en:Professor]]'],
  ['category value','[[Categoria:Professor]]','[[Categoria:Professor]]'],
  ['image value','[[Ficheiro:Professor.jpg|Professor]]','[[Ficheiro:Professor.jpg|Professor]]'],
  ['piped occupation','[[Medicina|Médico]]','[[Medicina|médico]]'],
  ['unpiped occupation','[[Professor]]','[[Professor|professor]]'],
  ['linked proper nickname','[[Professor Pardal]]','[[Professor Pardal]]'],
  ['linked common word before proper institution','[[Professor]] da [[Universidade de Coimbra]]','[[Professor|professor]] da [[Universidade de Coimbra]]'],
  ['two linked occupations','[[Professor]] e [[Escritor]]','[[Professor|professor]] e [[Escritor|escritor]]']
];
for(const [label,before,after] of values)check('value: '+label,()=>{
  const result=api.occupationValueCase(before);
  equalWiki(result,after,label);
  assert.deepEqual(targets(result),targets(before),'Link destinations changed');
  assert.equal(api.occupationValueCase(result),result,'Not idempotent');
});
const sourceCases = [
  ['simple person','{{Info/Biografia|nome=Ana|ocupação=Médica}}','{{Info/Biografia|nome=Ana|ocupação=médica}}'],
  ['Professor Pardal name and institution preserved','{{Info/Biografia|nome=Professor Pardal|empregador=Universidade de Coimbra|ocupação=Professor da Universidade de Coimbra}}','{{Info/Biografia|nome=Professor Pardal|empregador=Universidade de Coimbra|ocupação=professor da Universidade de Coimbra}}'],
  ['legal institute tail preserved','{{Info/Político|nome=Ana|profissão=Diretor do Instituto Médico Legal}}','{{Info/Político|nome=Ana|profissão=diretor do Instituto Médico Legal}}'],
  ['music field','{{Info/Música/artista|fundo=cantor_solo|ocupação=Cantor|outras ocupações=Compositor}}','{{Info/Música/artista|fundo=cantor_solo|ocupação=cantor|outras ocupações=compositor}}'],
  ['linked professor institution','{{Info/Biografia|ocupação=[[Professor]] da [[Universidade de Coimbra]]}}','{{Info/Biografia|ocupação=[[Professor|professor]] da [[Universidade de Coimbra]]}}'],
  ['proper nickname occupation opaque','{{Info/Biografia|ocupação=Professor Pardal}}','{{Info/Biografia|ocupação=Professor Pardal}}'],
  ['medical person box','{{Info/Médico|ocupação=Professor}}','{{Info/Médico|ocupação=professor}}'],
  ['magistrate person box','{{Info/Magistrado|profissão=Advogada}}','{{Info/Magistrado|profissão=advogada}}'],
  ['rugby native English parameter','{{Info/Jogador de rugby|occupation=Professor}}','{{Info/Jogador de rugby|occupation=professor}}'],
  ['monarchy native spelling','{{Info/Nobre|ocupaçao=Escritor}}','{{Info/Nobre|ocupaçao=escritor}}'],
  ['redirect writer box','{{Info/Escritor|ocupação=Professor}}','{{Info/Escritor|ocupação=professor}}'],
  ['institution box skipped','{{Info/Organização|profissão=Professor}}','{{Info/Organização|profissão=Professor}}'],
  ['unknown box skipped','{{Info/Outra coisa|ocupação=Professor}}','{{Info/Outra coisa|ocupação=Professor}}'],
  ['vows fields skipped','{{Info/Bispo da Igreja Católica|profissão_local=Professor|profissão_data=Professor}}','{{Info/Bispo da Igreja Católica|profissão_local=Professor|profissão_data=Professor}}'],
  ['numeric suffix not assumed','{{Info/Biografia|ocupação1d=Professor|ocupação1r=Professor}}','{{Info/Biografia|ocupação1d=Professor|ocupação1r=Professor}}'],
  ['template occupation unchanged','{{Info/Biografia|ocupação={{lang|pt|Professor}}}}','{{Info/Biografia|ocupação={{lang|pt|Professor}}}}'],
  ['dates and refs untouched','{{Info/Biografia|nome=Ana|nascimento_data={{Dni|20|9|1945|si}}<ref name="Professor"/>|ocupação=Professor<ref name="Médico">{{citar web|título=Professor|url=https://example.test/Professor}}</ref>}}','{{Info/Biografia|nome=Ana|nascimento_data={{Dni|20|9|1945|si}}<ref name="Professor"/>|ocupação=professor<ref name="Médico">{{citar web|título=Professor|url=https://example.test/Professor}}</ref>}}']
];
for(const [label,before,after] of sourceCases)check('source: '+label,()=>{
  const result=api.occupationCase(before,cfg,()=>{});
  equalWiki(result,after,label);
  assert.deepEqual(targets(result),targets(before),'Link destinations changed');
  assert.equal(api.occupationCase(result,cfg,()=>{}),result,'Not idempotent');
});
const simple='{{Info/Biografia|ocupação=Professor}}';
check('occupation feature disabled',()=>assert.equal(api.occupationCase(simple,{...cfg,occupationCase:false},()=>{}),simple));
check('infobox feature disabled',()=>assert.equal(api.occupationCase(simple,{...cfg,infoboxes:false},()=>{}),simple));
check('template definition protected',()=>assert.equal(api.cleanup(simple,{...cfg,namespaceNumber:10,pageTitle:'Predefinição:Exemplo'}).text,simple));
const discussion='Mensagem assinada. [[Usuário:Exemplo]] 12h34min de 13 de outubro de 2026 (UTC)\n'+simple;
check('signed discussion protected',()=>assert.equal(api.cleanup(discussion,{...cfg,namespaceNumber:1,pageTitle:'Discussão:Exemplo'}).text,discussion));
check('cleanup integration',()=>equalWiki(api.cleanup(simple,cfg).text,'{{Info/Biografia|ocupação=professor}}','cleanup integration'));
const results={passed,failed:failures.length,failures,script,sha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(script)).digest('hex')};
fs.writeFileSync(path.join(__dirname,'occupation_compatibility_results.json'),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify({passed,failed:failures.length,failures}));
process.exitCode=failures.length?1:0;
