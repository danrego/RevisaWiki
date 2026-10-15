const qa = require('./harness.cjs');
const fs = require('node:fs');
const path = require('node:path');
const script = qa.api;
const engine=script.cleanup; script.cleanup=(text,options)=>engine(text,{endMatter:false,markup:false,...options});
const tests = [];
function test(name, input, expected) { tests.push({name, input, expected}); }
test('plain duplicate header', '== Referências ==\n{{Referências}}', '{{Referências}}');
test('repeated plain headers', '== Referências ==\n\n== Referências ==\n{{Referências}}', '{{Referências}}');
test('heading suppression level0', '==Referências==\n{{Referências|nível=0}}', '== Referências ==\n{{Referências|nível=0}}');
test('suppression positional', '==Referências==\n{{Referências|Referências|0}}', '== Referências ==\n{{Referências|Referências|0}}');
test('custom heading', '== Referências ==\n{{Referências|título=Fontes}}', '== Referências ==\n{{Referências|título=Fontes}}');
test('adjacent empty', '{{Referências}}\n\n{{Referências}}', '{{Referências}}');
test('two sections', 'A.<ref>Fonte A.</ref>\n{{Referências}}\nB.<ref>Fonte B.</ref>\n{{Referências}}', 'A.<ref>Fonte A.</ref>\n{{Referências}}\nB.<ref>Fonte B.</ref>\n{{Referências}}');
test('two groups', '{{Referências|grupo=nota}}\n{{Referências}}', '{{Referências|grupo=nota}}\n{{Referências}}');
test('list-defined', 'A.<ref name="x" />\n{{Referências|refs=<ref name="x">Fonte.</ref>}}', 'A.<ref name="x" />\n{{Referências|refs=<ref name="x">Fonte.</ref>}}');
test('inherited group', 'A.<ref group="nota" name="x" />\n<references group="nota"><ref name="x">Nota.</ref></references>', 'A.<ref name="x" group="nota" />\n<references group="nota"><ref name="x">Nota.</ref></references>');
test('named full duplicate', 'A.<ref name="x">Fonte.</ref> B.<ref name="x">Fonte.</ref>', 'A.<ref name="x">Fonte.</ref> B.<ref name="x" />');
test('definition conflict', 'A.<ref name="x">Fonte, p. 10.</ref> B.<ref name="x">Fonte, p. 20.</ref>', 'A.<ref name="x">Fonte, p. 10.</ref> B.<ref name="x">Fonte, p. 20.</ref>');
test('details protects family', 'A.<ref name="x">Fonte.</ref> B.<ref name="x" details="p. 10" /> C.<ref name="x">Fonte.</ref>', 'A.<ref name="x">Fonte.</ref> B.<ref name="x" details="p. 10" /> C.<ref name="x">Fonte.</ref>');
test('follow protects family', 'A.<ref name="x">Fonte.</ref> B.<ref follow="x">Complemento.</ref> C.<ref name="x">Fonte.</ref>', 'A.<ref name="x">Fonte.</ref> B.<ref follow="x">Complemento.</ref> C.<ref name="x">Fonte.</ref>');
test('groups distinct', 'A.<ref name="x">Fonte.</ref> B.<ref group="nota" name="x">Nota.</ref>', 'A.<ref name="x">Fonte.</ref> B.<ref name="x" group="nota">Nota.</ref>');
test('move first', 'A.<ref name="x" /> B.<ref name="x">Fonte.</ref>', 'A.<ref name="x">Fonte.</ref> B.<ref name="x" />');
test('move across lists blocked', 'A.<ref name="x" />\n{{Referências}}\nB.<ref name="x">Fonte.</ref>\n{{Referências}}', 'A.<ref name="x" />\n{{Referências}}\nB.<ref name="x">Fonte.</ref>\n{{Referências}}');
test('quoted greater than protected', `A.<ref name='a>b'>Fonte.</ref> B.<ref name='a>b' />`, `A.<ref name='a>b'>Fonte.</ref> B.<ref name='a>b' />`);
test('doublequote in ref name', `A.<ref name='a"b'>Fonte.</ref> B.<ref name='a"b' />`, `A.<ref name='a"b'>Fonte.</ref> B.<ref name='a"b' />`);
test('doublequote in group', `A.<ref name="x" group='a"b'>Fonte.</ref> B.<ref name="x" group='a"b' />`, `A.<ref name="x" group='a"b'>Fonte.</ref> B.<ref name="x" group='a"b' />`);
test('ampersand remains', 'A.<ref name="a&amp;b">Fonte.</ref> B.<ref name="a&amp;b" />', 'A.<ref name="a&amp;b">Fonte.</ref> B.<ref name="a&amp;b" />');
test('same ref names uppercase independent', 'A.<ref name="A">Fonte.</ref> B.<ref name="a">Outro.</ref>', 'A.<ref name="A">Fonte.</ref> B.<ref name="a">Outro.</ref>');
test('unnamed duplicates reused automatically', 'A.<ref>Fonte.</ref> B.<ref>Fonte.</ref>', 'A.<ref name="ref-auto-1">Fonte.</ref> B.<ref name="ref-auto-1" />');
test('unclosed ref', 'A.<ref name=x>Fonte.', 'A.<ref name=x>Fonte.');
test('malformed nesting', 'A.<ref name=x>Outer.<ref name=y>Inner.</ref>Tail.</ref> B.<ref name=y />', 'A.<ref name=x>Outer.<ref name=y>Inner.</ref>Tail.</ref> B.<ref name=y />');
test('malformed nested ref receives moved definition', 'A.<ref name=x>Outer.<ref name=y />Tail.</ref> B.<ref name=y>Inner.</ref>', 'A.<ref name=x>Outer.<ref name=y />Tail.</ref> B.<ref name=y>Inner.</ref>');
test('unclosed ref heading preserved', '<ref name=x>\n==References==\n{{Referências}}', '<ref name=x>\n==References==\n{{Referências}}');
test('renderer inside ref preserved', '<ref>\n<references />\n</ref>', '<ref>\n<references />\n</ref>');
test('unclosed renderer', 'A.<ref name=x />\n<references><ref name=x>Fonte.</ref>', 'A.<ref name="x" />\n<references><ref name=x>Fonte.</ref>');
test('headers in ordinary template', '{{Modelo|exemplo=\n==Referências==\n{{Referências}}\n}}', '{{Modelo|exemplo=\n==Referências==\n{{Referências}}\n}}');
test('headers in ref', '<ref>\n==Referências==\n{{Referências}}\n</ref>', '<ref>\n==Referências==\n{{Referências}}\n</ref>');
test('headers in table', '{|\n|\n==Referências==\n{{Referências}}\n|}', '{|\n|\n==Referências==\n{{Referências}}\n|}');
test('shortdescription nested', '{{Descrição curta|Algo com {{Outra predefinição|x=y}}}}\nTexto.', 'Texto.');
test('shortdescription inside ordinary template', '{{Modelo|exemplo={{Descrição curta|Algo}}}}', '{{Modelo|exemplo={{Descrição curta|Algo}}}}');
test('shortdescription inside ref', '<ref>{{Descrição curta|Título de um exemplo}}</ref>', '<ref>{{Descrição curta|Título de um exemplo}}</ref>');
test('shortdescription inside table', '{|\n|{{Descrição curta|Algo}}\n|}', '{|\n|{{Descrição curta|Algo}}\n|}');
test('ref before nbsp text', 'A.<ref name="x">{{Citar web|título= Fonte |url=http://x}}</ref> B.<ref name="x">{{Citar web|título=Fonte|url=http://x}}</ref>', 'A.<ref name="x">{{Citar web|título= Fonte |url=http://x}}</ref> B.<ref name="x">{{Citar web|título=Fonte|url=http://x}}</ref>');
for (const tag of ['nowiki', 'pre', 'syntaxhighlight', 'source', 'code', 'math', 'templatedata', 'gallery']) {
  const input = `<${tag}>\n{{Descrição curta|x}}\n==Referências==\n{{Referências}}\n<ref name=x>Fonte.</ref><ref name=x>Fonte.</ref>\n</${tag}>`;
  test('literal '+tag, input, input);
}
test('comments', '<!-- {{Descrição curta|x}} ==Referências== {{Referências}} <ref name=x>Fonte.</ref><ref name=x>Fonte.</ref> -->', '<!-- {{Descrição curta|x}} ==Referências== {{Referências}} <ref name=x>Fonte.</ref><ref name=x>Fonte.</ref> -->');
test('space preformatted', ' ==Referências==\n {{Descrição curta|x}}\n {{Referências}}', ' ==Referências==\n {{Descrição curta|x}}\n {{Referências}}');
test('mixed placeholder protected reference', 'A.<ref name=x><nowiki>{{x}}</nowiki></ref> B.<ref name=x><nowiki>{{x}}</nowiki></ref>', 'A.<ref name=x><nowiki>{{x}}</nowiki></ref> B.<ref name=x><nowiki>{{x}}</nowiki></ref>');
test('unbalanced template preserves all', '{{Descrição curta|x\n==References==\n{{Referências}}', '{{Descrição curta|x\n==References==\n{{Referências}}');
test('heading plain bibliography not removed', '==Referências==\n* Uma fonte.', '== Referências ==\n* Uma fonte.');
test('two heads with content', '==Referências==\nTexto.\n==Referências==\n{{Referências}}', '== Referências ==\nTexto.\n{{Referências}}');
test('parameter pipeline nested nowiki', '{{Cite web|title=<nowiki>a|b</nowiki>|url=http://x}}', '{{Citar web|título=<nowiki>a|b</nowiki>|url=http://x}}');
let failures = [];
for (const t of tests) {
  let actual, idempotent;
  try { actual = script.cleanup(t.input); idempotent = script.cleanup(actual.text).text; }
  catch (error) { failures.push({...t, error: String(error)}); continue; }
  if (actual.text !== t.expected) failures.push({...t, actual:actual.text, warnings:actual.warnings});
  if (idempotent !== actual.text) failures.push({name:t.name+' IDEMPOTENCE', input:actual.text, actual:idempotent, expected:actual.text});
}
process.stdout.write(JSON.stringify({count:tests.length, failures}, null, 2)+'\n');
fs.writeFileSync(__dirname+'/'+'reference_audit_results.json', JSON.stringify({count:tests.length, failures}, null, 2));
process.exitCode = failures.length ? 1 : 0;
