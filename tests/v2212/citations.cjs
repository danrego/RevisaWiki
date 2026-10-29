'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const api=require(process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.2/RevisaWiki_v2_21_2.js'));
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Artigo de teste',autoPreview:false,registryDoiCheck:false};
let checks=0;
function plan(source,options={}){
 const p=api.v2212CitationPlan(source,{...cfg,...options});assert.equal(p.source,source);
 assert.equal(api.v2212CitationProof(source,p.text,p,{...cfg,...options}),true);checks+=2;
 const again=api.v2212CitationPlan(p.text,{...cfg,...options});assert.equal(again.text,p.text,'idempotence: '+source);checks++;
 return p;
}
function changed(source,expected,options={}){
 const p=plan(source,options);assert.notEqual(p.text,source,source);
 assert.equal(p.text,expected,source);checks+=2;return p;
}
function same(source,options={}){assert.equal(plan(source,options).text,source,source);checks++;}
changed('{{Cite web url=https://example.org/item|title=Documento}}','{{Cite web |url=https://example.org/item|title=Documento}}');
same('{{Cite web url=not-a-url|title=Documento}}');
same('{{Unknown web url=https://example.org/item|title=Documento}}');
same('<!-- tabela histórica {{Cite web url=https://example.org/item|title=Documento}} -->');
changed('{{Citar web|url=https://example.org/item|título=Documento|data=Fecha 6 de septiembre de 1995}}',
 '{{Citar web|url=https://example.org/item|título=Documento|data=6 de setembro de 1995}}');
same('{{Citar web|url=https://example.org/item|título=Documento|data=Fecha aproximada}}');
same('{{Citar web|url=https://example.org/item|título=Documento|data=Fecha 6 de septiembre de 1995}}',{dates:false});
changed('{{Citar web|url=https://example.org/item|título=Documento|url-acesso=registo}}',
 '{{Citar web|url=https://example.org/item|título=Documento|acesso-url=registo}}');
changed('{{citar livro\n |título=Obra\n |url-acesso=registo\n |url=https://example.org/book\n }}',
 '{{citar livro\n |título=Obra\n |acesso-url=registo\n |url=https://example.org/book\n }}');
same('{{Citar livro|título=Obra|url-acesso=registo|url=https://example.org/\nbook}}');
same('{{Citar livro|título=Obra|url-acesso=registo|url=\u00a0https://example.org/book}}');
for(const value of ['subscrição','registo','registro','registration','limitada','limitado','limited']){
 const before='{{Citar web|url=https://example.org/item|título=Documento|url-acesso='+value+'}}';
 assert.ok(plan(before).text.includes('|acesso-url='+value));checks++;
}
same('{{Citar web|url=https://example.org/item|título=Documento|url-acesso=registo|url-access=limited}}');
same('{{Citar web|título=Documento|url-acesso=registo}}');
changed('{{Citar livro|título=Livro|isbn=0306406152.}}','{{Citar livro|título=Livro|isbn=0306406152}}');
changed('{{Citation|title=Book|isbn=9780306406157; 9780306406157}}','{{Citation|title=Book|isbn=9780306406157}}');
changed('{{Citar livro|título=Livro|isbn=0306406152, 9780306406157}}',
 '{{Citar livro|título=Livro|isbn=0306406152|id={{ISBN|9780306406157}}}}');
changed('{{Citar livro|título=Livro|isbn=9780306406157, 0306406152}}',
 '{{Citar livro|título=Livro|isbn=9780306406157|id={{ISBN|0306406152}}}}');
for(const value of ['0306406153.','0306406152..','0306406152. p. 12','0306406152, 9781861972712','0306406152, 0306406152, outra edição']){
 same('{{Citar livro|título=Livro|isbn='+value+'}}');
}
same('{{Citar livro|título=Livro|isbn=0306406152, 9780306406157|id=Registro}}');
same('{{Citar livro|título=Livro|isbn=0306406152.}}',{identifierUrlRepairs:false});
changed('{{Citar web|título=Documento|url=https://example.org/item\u200e\u200e}}',
 '{{Citar web|título=Documento|url=https://example.org/item}}');
same('{{Citar web|título=Documento|url=https://example.org/it\u200eem}}');
same('{{Citar web|título=Documento|url=https://example.org/ação\u200e}}');
same('{{Citar web|título=Documento|url=https://example.org/item\u200f}}');
changed('{{Citar web|título=Documento|url=https://example.org/item|arquivourl=https://web.archive.org/web/20240302040506/https://example.org/item}}',
 '{{Citar web|título=Documento|url=https://example.org/item|arquivourl=https://web.archive.org/web/20240302040506/https://example.org/item|arquivodata=2024-03-02}}');
for(const stamp of ['20240230040506','20240302250506','20240302046506','202403','202403020405']){
 same('{{Citar web|título=Documento|url=https://example.org/item|arquivourl=https://web.archive.org/web/'+stamp+'/https://example.org/item}}');
}
same('{{Citar web|título=Documento|url=https://example.org/item|arquivourl=https://web.archive.org/web/20240302040506/http://example.org/item}}');
same('{{Citar web|título=Documento|url=https://example.org/item|arquivourl=https://web.archive.org/web/20240302040506/https://example.org/item|archive-date=incerta}}');
changed('{{Citar periódico|vautores=Alpha AB, Beta CD|título=Estudo|ano=2024}}',
 '{{Citar periódico|vauthors=Alpha AB, Beta CD|título=Estudo|ano=2024}}');
changed('{{Citar livro|veditores=Alpha AB, Beta CD|título=Livro|ano=2024}}',
 '{{Citar livro|veditors=Alpha AB, Beta CD|título=Livro|ano=2024}}');
same('{{Citar periódico|vautores=Alpha AB|vauthors=Beta CD|título=Estudo}}');
same('{{Citar periódico|vautores=Alpha AB|título=Estudo}}',{v2212NativeCS1Revision:99999999});
same('{{Citar periódico|vautores=Alpha AB|título=Estudo}}',{authors:false});
changed('{{Citar livro|título=Livro|autor=Alpha|autor=Alpha}}','{{Citar livro|título=Livro|autor=Alpha}}');
same('{{Citar livro|título=Livro|autor=Alpha|autor=Beta|autor=Alpha}}');
same('{{Citar livro|título=Livro|autor=Alpha|autor=Alpha<!-- razão -->}}');
changed('{{Citar enciclopédia|título=Tema|loc=§4; AA 1:187–190}}','{{Citar enciclopédia|título=Tema|em=§4; AA 1:187–190}}');
changed('{{Citar conferência|título=Tema|conferência-url=https://example.org/event}}',
 '{{Citar conferência|título=Tema|conference-url=https://example.org/event}}');
same('{{harvtxt|Alpha|2024|loc=§4; AA 1:187–190}}');
same('{{Citar enciclopédia|título=Tema|loc=§4; AA 1:187–190|em=§2}}');
same('{{Citar periódico|título=Estudo|número-artigo=001234}}');
same('{{Citar tese|título=Estudo|url=https:/example.org/item}}');
changed('{{Citar livro|título=Livro| [https://example.org/book Livro]|ano=2024}}',
 '{{Citar livro|título=Livro|url=https://example.org/book|ano=2024}}');
same('{{Citar livro|título=Livro| [https://example.org/book Outro livro]|ano=2024}}');
changed('{{Citar periódico| {{arxiv|archive=gr-qc|id=0306083}}|título=Estudo}}',
 '{{Citar periódico|arxiv=gr-qc/0306083|título=Estudo}}');
same('{{Citar periódico| {{arxiv|archive=gr-qc|id=0306083}}|arxiv=gr-qc/0100001|título=Estudo}}');
same('{{Citar periódico| {{arxiv|archive=unknown|id=0306083}}|título=Estudo}}');
const note='{{Citar web|url=https://example.org/item|título=Documento|data-acesso=2024-01-02}}';
const box='{{Info/Biografia|nome=Pessoa|notas=<ref>'+note+'</ref>}}';
assert.ok(plan(box).text.includes('|acessodata=2024-01-02'));checks++;
const annotatedBox='{{Info/Biografia\n<!-- cabeçalho -->\n|nome=Pessoa|notas=<ref>{{Citar web|título=Documento|autor=Instituição|autor=Instituição}}</ref>}}';
assert.equal(plan(annotatedBox).text,annotatedBox.replace('|autor=Instituição|autor=Instituição','|autor=Instituição'));checks++;
const image='[[Ficheiro:Example.svg|miniatura|Legenda<ref>'+note+'</ref>|200px]]';
assert.ok(plan(image).text.includes('|acessodata=2024-01-02'));checks++;
same('[[Tema|Legenda<ref>'+note+'</ref>]]');
same('{{Modelo desconhecido|1=<ref>'+note+'</ref>}}');
same('{{Info/Biografia|nome=Pessoa|notas='+note+'}}');
same('<nowiki>'+box+'</nowiki>');
same('<syntaxhighlight lang="wikitext">'+image+'</syntaxhighlight>');
const table='{| class="wikitable"\n! Valor !! Fonte\n|-\n| <math>x=1</math> 25 km || <ref>{{Citar web|título=Documento|url=https://example.org/item\u200e}}</ref>\n|}';
changed(table,table.replace('/item\u200e','/item'));
same(table.slice(0,-2));
same('"<ref>'+note+'</ref>"');
same('{{Citar web|url=https://example.org/item|título=Documento|url-acesso=registo}}',{citations:false});
const formerlyProtected='{{Unknown wrapper|1=<ref>{{Citar web|url=https://example.org/frozen|título=Documento|url-acesso=registo}}</ref>}}';
same('<ref>{{Citar web|url=https://example.org/frozen|título=Documento|url-acesso=registo}}</ref>',{citationOriginalSource:formerlyProtected});
same(note,{namespaceNumber:1});
same(note,{section:'1'});
const donor='{{Citar web|url=https://example.org/article/one|título=Documento|língua=en}}';
const target='{{Citar web|url=https://example.org/article/one}}';
assert.ok(plan(donor+'\n'+target).text.endsWith('{{Citar web|url=https://example.org/article/one|título=Documento}}'));checks++;
same(donor+'\n{{Citar web|url=https://example.org/article/one|língua=pt}}');
same(donor+'\n{{Citar web|url=https://example.org/article/one|título=Outro}}\n'+target);
same('{{Citar web|url=https://example.org/|título=Página inicial}}\n{{Citar web|url=https://example.org/}}');
same(donor+'\n{{Citar web|url=https://example.org/article/one?different=yes}}');
changed('{{Cite music release notes|Name=Album|Artist=Artist|Type=album|ano=2024|formato=liner notes|publicado=Label}}',
 '{{Cite music release notes|Name=Album|Artist=Artist|Type=album|year=2024|Format=liner notes|publisher=Label}}');
assert.equal(plan('{{Cite music release notes|Name=Album|Artist=Artist|Type=album|ano=2024|formato=liner notes|publicado=Label}}').edits[0].ruleIds.length,3);checks++;
same('{{Cite music release notes|Name=Album|Artist=Artist|Type=album|ano=2024|year=2023}}');
changed('{{Cita web|url=https://example.org/item|titolo=Documento|accesso=8 agosto 2006|dataarchivio=5 aprile 2007|urlarchivio=https://web.archive.org/web/20070405201701/https://example.org/item|urlmorto=sì}}',
 '{{Citar web|url=https://example.org/item|título=Documento|acessodata=2006-08-08|arquivodata=2007-04-05|arquivourl=https://web.archive.org/web/20070405201701/https://example.org/item|urlmorta=sim}}');
same('{{Cita web|url=https://example.org/item|titolo=Documento|accesso=data incerta}}');
same('{{Cita web|url=https://example.org/item|titolo=Documento|título=Outro|accesso=8 agosto 2006}}');
changed('{{notelist-ua}}','{{Referências|grupo=upper-alpha|nível=0}}');
changed('{{Listanota-ua|notes=<ref name="z">Nota [[Tema]]</ref>}}',
 '{{Referências|grupo=upper-alpha|nível=0|refs=<ref name="z">Nota [[Tema]]</ref>}}');
same('{{notelist-ua|colwidth=30em}}');
same('{{notelist-ua|1=2}}');
same('{{NOTELIST-UA}}');
same('{{notelist-ua|refs=<ref>Nota anônima</ref>}}');
same('<ref>{{notelist-ua}}</ref>');
same('<nowiki>{{notelist-ua}}</nowiki>');
const p=plan('{{Citar livro|título=Livro|isbn=0306406152.}}');
assert.equal(api.v2212CitationProof(p.source,p.text+'x',p,cfg),false);checks++;
assert.equal(api.v2212CitationProof(p.source+'x',p.text,p,cfg),false);checks++;
// Many unrelated literals must remain untouched even when a nearby repair runs.
for(let i=0;i<500;i++){
 const protectedText='<nowiki>{{Citar livro|isbn=0306406152.|url=https:/example.org/'+i+'}}</nowiki>';
 const body=protectedText+'\n{{Citar livro|título=Livro '+i+'|isbn=0306406152.}}';
 const out=plan(body).text;assert.ok(out.startsWith(protectedText));assert.ok(out.endsWith('|isbn=0306406152}}'));checks+=2;
}
console.log(JSON.stringify({suite:'v2212-citations',checks,passed:true}));

