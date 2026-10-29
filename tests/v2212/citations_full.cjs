'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const api=require(process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.2/RevisaWiki_v2_21_2.js'));
const options={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Assunto de teste',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-10-28'};
const wrap=call=>"'''Assunto''' é o tema desta página.<ref>"+call+"</ref>\n{{Referências}}";
const cases=[
 ['access-key',wrap('{{Citar web|url=https://example.org/article|título=Documento|url-acesso=registo}}'),s=>s.includes('acesso-url=registo')||s.includes('acessourl=registo')],
 ['multiline-access-key',"'''Assunto''' é o tema.<ref name=fonte>\n{{citar livro\n |título=Obra\n |url-acesso=registo\n |url=https://example.org/book\n }}</ref> Mais texto<ref name=fonte />.\n{{Referências}}",s=>!s.includes('url-acesso=registo')&&s.includes('acesso-url=registo')],
 ['literal-section-locator',wrap('{{Citar livro|título=Obra|loc=§1}}'),s=>s.includes('|em=§1')&&!s.includes('|loc=')],
 ['terminal-isbn',wrap('{{Citar livro|título=Livro|isbn=0306406152.}}'),s=>s.includes('isbn=0306406152')&&!s.includes('isbn=0306406152.')],
 ['identical-isbns',wrap('{{Citar livro|título=Livro|isbn=9780306406157; 9780306406157}}'),s=>!s.includes('9780306406157;')],
 ['equivalent-isbns',wrap('{{Citar livro|título=Livro|isbn=0306406152, 9780306406157}}'),s=>s.includes('0306406152')&&s.includes('{{ISBN|9780306406157}}')&&!s.includes('0306406152, 9780306406157')],
 ['url-boundary',wrap('{{Citar web|título=Documento|url=https://example.org/article\u200e}}'),s=>s.includes('https://example.org/article')&&!s.includes('\u200e')],
 ['capture-date',wrap('{{Citar web|título=Documento|url=https://example.org/article|arquivourl=https://web.archive.org/web/20240302040506/https://example.org/article}}'),s=>s.includes('arquivodata=2024-03-02')],
 ['vancouver-authors',wrap('{{Citar periódico|vautores=Alpha AB, Beta CD|título=Estudo|ano=2024}}'),s=>s.includes('vauthors=Alpha AB, Beta CD')&&!s.includes('vautores=')],
 ['vancouver-editors',wrap('{{Citar livro|veditores=Alpha AB, Beta CD|título=Livro|ano=2024}}'),s=>s.includes('veditors=Alpha AB, Beta CD')&&!s.includes('veditores=')],
 ['anonymous-url',wrap('{{Citar livro|título=Livro| [https://example.org/book Livro]|ano=2024}}'),s=>s.includes('url=https://example.org/book')],
 ['italian-interface',wrap('{{Cita web|url=https://example.org/item|titolo=Documento|accesso=8 agosto 2006|dataarchivio=5 aprile 2007|urlarchivio=https://web.archive.org/web/20070405201701/https://example.org/item|urlmorto=sì}}'),s=>!s.includes('titolo=')&&!s.includes('urlmorto=')&&s.includes('Documento')],
 ['native-box-ref','{{Info/Biografia|nome=Pessoa|notas=<ref>{{Citar web|url=https://example.org/item|título=Documento|data-acesso=2024-01-02}}</ref>}}\n'+ "'''Pessoa''' é o tema desta página.\n{{Referências}}",s=>s.includes('acessodata=2024-01-02')],
 ['native-image-ref',"'''Tema''' é o assunto.\n[[Ficheiro:Example.svg|miniatura|Legenda<ref>{{Citar web|url=https://example.org/item|título=Documento|data-acesso=2024-01-02}}</ref>]]\n{{Referências}}",s=>s.includes('acessodata=2024-01-02')],
 ['native-table-ref',"{| class=\"wikitable\"\n! Valor !! Fonte\n|-\n| <math>x=1</math> 25 km || <ref>{{Citar web|título=Documento|url=https://example.org/item\u200e}}</ref>\n|}\n{{Referências}}",s=>s.includes('<math>x=1</math>')&&s.includes('25 km')&&!s.includes('\u200e')],
 ['upper-alpha',"'''Tema''' é o assunto.{{Nre-ua|Nota de teste}}\n== Notas ==\n{{notelist-ua}}",s=>!s.includes('{{notelist-ua}}')&&s.includes('upper-alpha')],
 ['local-title',"'''Tema''' é o assunto.<ref>{{Citar web|url=https://example.org/article/item|título=Documento}}</ref><ref>{{Citar web|url=https://example.org/article/item}}</ref>\n{{Referências}}",s=>!s.includes('{{Citar web|url=https://example.org/article/item}}')],
 ['arxiv-helper',wrap('{{Citar periódico| {{arxiv|archive=gr-qc|id=0306083}}|título=Estudo}}'),s=>s.includes('arxiv=gr-qc/0306083')]
];
const results=[];
for(const [id,source,accept]of cases){
 const result=api.calculate({kind:'adjust',source,originalSource:source,options});
 const gate=api.v219AutomaticResultSafety(source,result);
 const item={id,accepted:gate.accepted,gate:gate.code,changed:result.text!==source,expected:accept(result.text)};
 results.push(item);
 assert.equal(gate.accepted,true,JSON.stringify({item,gate,preservation:result.preservation}));
 assert.equal(item.expected,true,JSON.stringify({item,text:result.text}));
 const second=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options});
 assert.equal(second.text,result.text,'full pipeline idempotence: '+id);
}
console.log(JSON.stringify({suite:'v2212-citations-full',passed:true,caseCount:results.length,results}));

