const path = require('path');
const fs = require('fs');
const crypto = require('node:crypto');
const scriptPath = require('./harness.cjs').apiPath;
const rw = require(scriptPath);
const scriptSha256 = crypto.createHash('sha256').update(fs.readFileSync(scriptPath)).digest('hex');
const old = 'RevisaWiki-auto-1';
const base = `<ref name="${old}">Fonte</ref>`;
const neutral = source => rw.neutralAutomaticReferenceNames(source,{...rw.defaults},()=>{});
const tests = [];
function test(name, body) {
  try { body(); tests.push({name,ok:true}); }
  catch(error) { tests.push({name,ok:false,error:error.message}); }
}
function assert(condition,message) { if(!condition)throw new Error(message); }
test('migration preserves all explicit R calls',()=>{
  const source = `${base}\n{{r|1=${old}|2=${old}|p=2}}`;
  const text = neutral(source);
  assert(!text.includes(old), text);
});
test('migration preserves spaced #tag ref calls and follow',()=>{
  const source = `${base}\n{{#tag: ref||name=${old}}}\n{{#tag: ref|Complemento|follow=${old}}}`;
  const text = neutral(source);
  assert(!text.includes(old),text);
});
test('R helpers use the same reference transaction as their definition',()=>{
  const source = `${base}\nTexto distante\n{{r|${old}}}\n{{Referências}}`;
  const hunks = rw.comparison(source,{text:neutral(source)});
  assert(new Set(hunks.map(h=>h.transaction)).size===1,JSON.stringify(hunks));
});
test('partial helper migration is refused by safeComposition',()=>{
  const source = `${base}\nTexto distante\n{{r|${old}}}\n{{Referências}}`;
  const partial = source.replace(`name="${old}"`,'name="ref-auto-1"');
  assert(rw.safeComposition(source,partial),partial);
});
test('explicit dynamic R names prevent automatic migration',()=>{
  const source = `${base}\n{{r|1={{{nome|${old}}}}}}`;
  assert(neutral(source)===source,neutral(source));
});
test('spaced #tag targets reserve collision names',()=>{
  const source = `${base}\n{{#tag: ref|Outra fonte|name=ref-auto-1}}\n<ref name="${old}" />`;
  const text = neutral(source);
  assert(text.startsWith('<ref name="ref-auto-1-2">'),text);
});
test('template definitions preserve their exported reference names',()=>{
  const source = `<includeonly>${base}</includeonly>`;
  const text = rw.cleanup(source,{namespaceNumber:10,pageTitle:'Predefinição:Minha'}).text;
  assert(text===source,text);
});
test('template definitions do not create reusable global reference names',()=>{
  const source = '<includeonly><ref>Fonte</ref><ref>Fonte</ref></includeonly>';
  const text = rw.cleanup(source,{namespaceNumber:10,pageTitle:'Predefinição:Minha'}).text;
  assert(text===source,text);
});
test('template parameter fallback definitions do not move to unconditional text',()=>{
  const source = '<ref name="n" />{{{x|<ref name="n">Fonte</ref>}}}';
  const text = rw.cleanup(source,{namespaceNumber:10,pageTitle:'Predefinição:Minha'}).text;
  assert(text===source,text);
});
test('neutral generation avoids entity-equivalent existing names',()=>{
  const source = '<ref name="ref-auto-&#49;">Outra fonte</ref><ref>Fonte</ref><ref>Fonte</ref>';
  const text = rw.automaticIdenticalReferences(source,{...rw.defaults},()=>{});
  assert(!text.includes('<ref name="ref-auto-1">'),text);
});
test('neutral generation avoids R helper call names',()=>{
  const source = '{{r|ref-auto-1}}<ref>Fonte</ref><ref>Fonte</ref>';
  const text = rw.automaticIdenticalReferences(source,{...rw.defaults},()=>{});
  assert(!text.includes('<ref name="ref-auto-1">'),text);
});
test('section editing preserves migration family names',()=>{
  const source = `${base}\n<ref name="${old}" />`;
  const text=rw.neutralAutomaticReferenceNames(source,{...rw.defaults,sectionOnly:true},()=>{});
  assert(text===source,text);
});
test('signed Portuguese discussions remain unchanged',()=>{
  const source = `: ${base} [[Foo|Foo]] 21h34min de 10 de outubro de 2026 (UTC)`;
  const text = rw.cleanup(source,{namespaceNumber:1}).text;
  assert(text===source,text);
});
fs.writeFileSync(path.join(__dirname,'namespace_compatibility_results.json'),JSON.stringify({version:rw.version,scriptSha256,tests},null,2)+'\n');
for(const item of tests)console.log((item.ok?'PASS':'FAIL')+' '+item.name+(item.ok?'':'\n  '+item.error));
console.log(JSON.stringify({passed:tests.filter(t=>t.ok).length,failed:tests.filter(t=>!t.ok).length}));
process.exitCode=tests.some(t=>!t.ok)?1:0;
