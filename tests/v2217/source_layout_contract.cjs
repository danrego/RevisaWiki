'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js')),api=require(bundle);
assert.equal(typeof api.v2217SourceLayoutPlan,'function');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false};let checks=0,calculations=0;
function test(source,expected,label,options=cfg){const p=api.v2217SourceLayoutPlan(source,options);calculations++;assert.equal(p.text,expected,label);checks++;assert(api.v2217SourceLayoutProof(source,p.text,p,options),label+' proof');checks++;assert.equal(api.v2217SourceLayoutPlan(p.text,options).text,p.text,label+' idempotence');checks++;assert(!api.v2217SourceLayoutProof(source,p.text+'X',p,options),label+' mutation');checks++;return p;}
test('{{Em construção}}{{Evento atual|Este artigo|expira=05122026|data=05112026|tema=protesto}}{{Info/conflito civil|título=Exemplo|local={{PAR}}}}\n',
 '{{Em construção}}\n{{Evento atual|Este artigo|expira=05122026|data=05112026|tema=protesto}}\n{{Info/conflito civil|título=Exemplo|local={{PAR}}}}\n','independent template chain');
test('{{Info/Biografia/Wikidata}}\'\'\'Pessoa Exemplo\'\'\' é uma autora.','{{Info/Biografia/Wikidata}}\n\'\'\'Pessoa Exemplo\'\'\' é uma autora.','infobox before lead');
test('{{Infocaixa|título=Exemplo}}Texto.','{{Infocaixa|título=Exemplo}}\nTexto.','catalogued generic native infobox');
test('{{AP|Tema}}{{Mais fontes}}{{Sem fontes}}{{Wikificar}}{{Reciclar}}{{D&D}}{{RPG}}Texto.',
 '{{AP|Tema}}\n{{Mais fontes}}\n{{Sem fontes}}\n{{Wikificar}}\n{{Reciclar}}\n{{D&D}}\n{{RPG}}\nTexto.','native hatnotes maintenance and navigation blocks');
test('Aqui está um texto.\n[[Ficheiro:exemplo.jpg]] Este é um ficheiro.\n','Aqui está um texto.\n\n[[Ficheiro:exemplo.jpg]]\n\nEste é um ficheiro.\n','single image');
test('Aqui está um texto.\n[[Ficheiro:exemplo.jpg]] [[Ficheiro:exemplo2.jpg]]Este é um ficheiro.\n','Aqui está um texto.\n\n[[Ficheiro:exemplo.jpg]]\n[[Ficheiro:exemplo2.jpg]]\n\nEste é um ficheiro.\n','adjacent image block');
for(const alias of ['Ficheiro','ficheiro','Imagem','imagem','Arquivo','arquivo','File','file','Image','image']){
 test('Texto. [['+alias+':exemplo.jpg|thumb|200px|Legenda.]] Texto.','Texto.\n\n[['+alias+':exemplo.jpg|thumb|200px|Legenda.]]\n\nTexto.','file alias '+alias);
}
test('Texto. [[ File : Example.jpg|thumb|200px|Legenda.]] Texto.','Texto.\n\n[[ File : Example.jpg|thumb|200px|Legenda.]]\n\nTexto.','native file header whitespace retained');
for(const source of [
 'A medida é {{val|10}} km, em {{lang|en|English}}.<ref>{{citar web|url=https://example.invalid|titulo=Exemplo}}</ref>\n',
 '{{Info/Biografia|nome=Exemplo|nacionalidade={{POR}}|imagem=exemplo.jpg|legenda=[[Ficheiro:icone.svg|15px]] Legenda}}\n',
 'Consulte [[:Ficheiro:exemplo.jpg]] para mais informações.\n',
 '<nowiki>{{Em construção}}{{Referências}} [[Ficheiro:exemplo.jpg]]</nowiki>\n',
 '<syntaxhighlight lang="wikitext">[[File:example.png]]{{Portal3|Ciência}}</syntaxhighlight>\n',
 '<gallery>\nFile:example.png|Legenda\nFile:example2.png|Legenda\n</gallery>\n',
 '<ref>[[File:example.png]]</ref>\n',
 '{| class="wikitable"\n| [[File:example.png]]\n|}\n',
 '* [[File:example.png]] Texto.\n',
 'A [[File:icon.svg|20px]] opção.\n',
 'A [[File:example.svg|baseline]] opção.\n',
 'Texto [[File:example.jpg|miniatura|Legenda.]]<ref>Fonte da imagem.</ref>\n',
 'Texto [[File:example.jpg|miniatura|Legenda.]]{{sfn|Exemplo|2001}}\n',
 '{{Exemplo|a={{Em construção}}{{Referências}}|b=[[File:example.png]]}}\n',
 'Uma chamada {{sfn|Exemplo|2001}} adjacente{{sfn|Exemplo|2002}}.\n',
 'Texto {{Nota|n|referência}} continua.\n',
 'A cor é {{Info/Música/artista/cor|cantor_solo}}.',
 'Um componente {{Info/Modelo fictício/componente|valor}} segue na frase.',
 '"{{Infobox person|name=Pessoa fictícia|birth_date=21 de março de 1752|death_date=1837}}\n\'\'\'Pessoa fictícia\'\'\' foi uma inventora.\n"',
 'A chamada "{{Em construção}}" é um exemplo.',
 'A chamada «{{Info/Biografia/Wikidata}}» é um exemplo.',
 'A imagem "[[File:example.jpg|thumb|200px|Legenda.]]" é um exemplo.',
 '<noinclude><!-- Comentário --></noinclude>\n',
 '<nowiki><noinclude> </noinclude></nowiki>\n',
 '<syntaxhighlight lang="wikitext"><noinclude> </noinclude></syntaxhighlight>\n',
 '<noinclude>Texto.</noinclude>\n',
 '{{Exemplo|<noinclude></noinclude>}}\n'
])test(source,source,'functional or protected content');
test('Texto.\n[[File:example.png|thumb|Legenda com [[Tema]] e {{lang|en|word}}.]]Texto.','Texto.\n\n[[File:example.png|thumb|Legenda com [[Tema]] e {{lang|en|word}}.]]\n\nTexto.','caption nesting preserved');
test('[[File:example.png]]','[[File:example.png]]','no initial or final blank lines invented');
test('[[File:example.png]]\n','[[File:example.png]]\n','one terminal newline retained');
test('Texto.\n\n[[File:example.png]]\n[[File:example2.png]]\n\nTexto.\n','Texto.\n\n[[File:example.png]]\n[[File:example2.png]]\n\nTexto.\n','already formatted image group');
test('Texto.\n\n\n[[File:example.png]]\n\n[[File:example2.png]]\n\n\nTexto.','Texto.\n\n[[File:example.png]]\n[[File:example2.png]]\n\nTexto.','redundant gaps around and inside image group');
test('<noinclude>\n </noinclude>\n\nTexto.','Texto.','empty noinclude and initial blank lines');
test('\n \t\nTexto.','Texto.','blank lines with whitespace at start');
test('Texto.\r\n[[File:example.png]]Texto.\r\n','Texto.\r\n\r\n[[File:example.png]]\r\n\r\nTexto.\r\n','CRLF preserved');
test('{{Em construção}}\r\n{{Evento atual}}\r\nTexto.','{{Em construção}}\r\n{{Evento atual}}\r\nTexto.','template CRLF idempotence');
test('{{Info/Biografia/Wikidata}}Texto.','{{Info/Biografia/Wikidata}}Texto.','disabled infobox family',{...cfg,infoboxes:false});
test('Texto.{{Referências}}','Texto.{{Referências}}','disabled reference family',{...cfg,references:false});
for(const options of [{namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true},{pageRedirect:true},{contentModel:'javascript'},{markup:false}])test('{{Em construção}}{{Evento atual}}','{{Em construção}}{{Evento atual}}','scope guard',{...cfg,...options});
const receipt={suite:'source-layout-2.21.7',bundle,checks,calculations,passed:true};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
