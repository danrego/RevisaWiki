'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{load}=require('./layout_talk_repairs_harness.cjs');
const api=load(),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema',sectionOnly:false,footerProfiles:{'Esboço-livro':'stub','Esboço-ciência':'stub','Esboço':'stub'}},talk={...cfg,namespaceNumber:1,pageTitle:'Discussão:Tema',discussionPage:true};
let checks=0;const results=[];
function equal(actual,expected,label){checks++;assert.equal(actual,expected,label);}
function test(name,source,expected,stage,options={}){
 const options2={...cfg,...options},plan=stage?api.v2221LayoutSubplan(source,stage,options2):api.v2221LayoutPlan(source,options2),proof=stage?api.v2221LayoutSubproof(source,plan.text,plan,options2,stage):api.v2221LayoutProof(source,plan.text,plan,options2);
 equal(plan.text,expected,name);equal(proof,true,name+' proof');
 const tampered={...plan,sourceHash:'tampered'};equal(stage?api.v2221LayoutSubproof(source,plan.text,tampered,options2,stage):api.v2221LayoutProof(source,plan.text,tampered,options2),false,name+' tamper');
 const repeated=stage?api.v2221LayoutSubplan(plan.text,stage,options2):api.v2221LayoutPlan(plan.text,options2);equal(repeated.text,plan.text,name+' idempotent');
 results.push({name,changed:source!==expected,count:plan.edits.reduce((n,e)=>n+(e.count??1),0)});return plan;
}
const list=n=>Array.from({length:n},(_,i)=>'* [[Tema '+i+']]').join('\n');
for(const n of [1,2,3,7,8,9,13]){
 const body=list(n),wrapped='{{Colunas-lista|2|2=\n'+body+'\n}}';
 test('explicit columns threshold '+n,'== Ligações externas ==\n'+wrapped,'== Ligações externas ==\n'+(n<8?body:wrapped),'columns');
 test('implicit columns threshold '+n,'== Bibliografia ==\n{{Colunas-lista|2|\n'+body+'\n}}','== Bibliografia ==\n'+(n<8?body:wrapped),'columns');
}
test('query equals remains whole','== Ligações externas ==\n{{Colunas-lista|2|\n* [https://example.org/?a=b&c=d Ligação]\n}}','== Ligações externas ==\n* [https://example.org/?a=b&c=d Ligação]','columns');
test('col1 col2 flow','== Ligações externas ==\n{{Colunas|col1=\n* [[A]]\n* [[B]]\n|col2=\n* [[C]]\n}}','== Ligações externas ==\n* [[A]]\n* [[B]]\n* [[C]]','columns');
for(const body of ['|col1=\n* Vantagem do método\n|col2=\n* Problema do método\n','|col1=\n* Vantagens: [[A]]\n|col2=\n* Limitações: [[B]]\n','|col1=\n* {{Desconhecido|A}}\n|col2=\n* [[B]]\n']){const s='== Ligações externas ==\n{{Colunas'+body+'}}';test('manual comparison retained '+results.length,s,s,'columns');}
test('manual resource columns keep URLs and citations','== Bibliografia ==\n{{Colunas|col1=\n* [https://example.org/?a=b Obra]\n|col2=\n* {{Citar livro|título=Outra obra|ano=2024}}\n}}','== Bibliografia ==\n* [https://example.org/?a=b Obra]\n* {{Citar livro|título=Outra obra|ano=2024}}','columns');
test('plain eight wraps','== Ver também ==\n'+list(8),'== Ver também ==\n{{Colunas-lista|2|2=\n'+list(8)+'\n}}','columns');
test('subsections not summed','== Ligações externas ==\n=== Grupo A ===\n'+list(4)+'\n=== Grupo B ===\n'+list(4),'== Ligações externas ==\n=== Grupo A ===\n'+list(4)+'\n=== Grupo B ===\n'+list(4),'columns');
const headings='=== Documentos ===\n* [https://example.org/?a=b Um]\n=== Vídeos ===\n* [https://example.org/?x=y Dois]';
test('headings outside broken wrapper','== Ligações externas ==\n{{Colunas-lista|2|\n'+headings+'\n}}','== Ligações externas ==\n'+headings,'columns');
test('long child subsection normalized in same call','== Ligações externas ==\n{{Colunas-lista|2|2=\n=== Grupo ===\n'+list(8)+'\n}}','== Ligações externas ==\n=== Grupo ===\n{{Colunas-lista|2|2=\n'+list(8)+'\n}}','columns');
test('sisters and portals outside long column list','== Ligações externas ==\n{{Colunas-lista|2|2=\n{{Commonscat|Example}}\n'+list(8)+'\n{{Portal3|Ciência}}\n[[Categoria:Exemplo]]\n}}','== Ligações externas ==\n{{Colunas-lista|2|2=\n'+list(8)+'\n}}\n\n{{Commonscat|Example}}\n{{Portal3|Ciência}}\n[[Categoria:Exemplo]]','columns');
test('paired long bibliography footer outside columns','== Obras citadas ==\n{{InícioRef|30em}}\n'+list(8)+'\n{{Portal3|Ciência}}\n{{RefFim}}','== Obras citadas ==\n{{Colunas-lista|2|2=\n'+list(8)+'\n}}\n\n{{Portal3|Ciência}}','bibliography-boundary');
const unknownInList='== Bibliografia ==\n{{Colunas-lista|2|2=\n* [[A]]\n{{Programa desconhecido|fato=1}}\n* [[B]]\n}}';test('unknown block inside list preserved',unknownInList,unknownInList,'columns');
for(const raw of ['{{Colunas-lista|2|2=\n* [[A]]\n|estilo=custom}}','{{Colunas-lista|{{N}}|2=\n* [[A]]\n}}','{{Colunas|col1=Texto\n|col2=* [[A]]}}'])test('custom columns preserved '+results.length,'== Bibliografia ==\n'+raw,'== Bibliografia ==\n'+raw,'columns');
test('references inside list retained','== Bibliografia ==\n{{Colunas-lista|2|2=\n* Título.<ref name="r">Fonte.</ref>\n}}','== Bibliografia ==\n* Título.<ref name="r">Fonte.</ref>','columns');
test('paired short bibliography','== Obras citadas ==\n{{InícioRef|30em}}\n* [[Obra]]\n{{RefFim}}','== Obras citadas ==\n* [[Obra]]','bibliography-boundary');
test('unclosed bibliography before portal','== Obras citadas ==\n{{InícioRef|30em}}\n* [[Obra]]\n{{Portal3|Ciência}}','== Obras citadas ==\n* [[Obra]]\n\n{{Portal3|Ciência}}','bibliography-boundary');
for(const [open,close]of [['{{InícioRef|indent=yes}}','{{RefFim}}'],['{{Div col|colwidth=30em}}','{{RefFim}}'],['{{InícioRef|30em}}','{{RefFim|preservar=sim}}']]){const s='== Bibliografia ==\n'+open+'\n* [[Obra]]\n'+close;test('container semantics preserved '+results.length,s,s,'bibliography-boundary');}
test('missing indented bibliography close retains typography','== Bibliografia ==\n{{InícioRef|indent=yes}}\n* [[Obra]]\n{{Portal3|Ciência}}','== Bibliografia ==\n{{InícioRef|indent=yes}}\n* [[Obra]]\n{{RefFim}}\n\n{{Portal3|Ciência}}','bibliography-boundary');
test('no invented bibliography ending at prose','== Obras citadas ==\n{{InícioRef|30em}}\n* [[Obra]]\nExplicação.','== Obras citadas ==\n{{InícioRef|30em}}\n* [[Obra]]\nExplicação.','bibliography-boundary');
for(const heading of ['Ver também','Ligações externas','Leitura adicional'])test('sister fallback '+heading,'== '+heading+' ==\n* [[Tema]]\n\n{{Commonscat|Example}}','== '+heading+' ==\n{{Commonscat|Example}}\n\n* [[Tema]]\n\n','sisters');
test('correlatos fallback after refs','Texto.\n{{Referências}}\n{{Correlatos|wikidata=Q1}}','Texto.\n{{Referências}}\n{{Correlatos|wikidata=Q1}}','sisters');
for(const title of ['=== Outra seção ===','== Outra seção ==']){const s='== Ver também ==\n* Item anterior.\n{{Correlatos|título=\n'+title+'\n|commonscat=Example}}\nTexto posterior.';test('structural sister title remains at original location '+results.length,s,s,'sisters');}
test('ordinary multiline sister parameters remain movable','== Ver também ==\n* [[A]]\n\n{{Correlatos\n|título=Exemplo\n|commonscat=Example\n}}','== Ver também ==\n{{Correlatos\n|título=Exemplo\n|commonscat=Example\n}}\n\n* [[A]]\n\n','sisters');
for(const widget of ['{{Widget desconhecido}}','<div>{{Widget desconhecido}}</div>']){const s='== Ver também ==\n* Item anterior.\n'+widget+'\n{{Correlatos}}\nTexto posterior.';test('opaque producer blocks only sister crossing '+results.length,s,s,'sisters');}
test('known reference collector does not block preferred sister placement','== Ver também ==\n* [[A]]\n{{Referências}}\n{{Correlatos|wikidata=Q1}}','== Ver também ==\n{{Correlatos|wikidata=Q1}}\n\n* [[A]]\n{{Referências}}\n','sisters');
{
 const a=api.v2221LayoutAuthorityTaxonGap,call='{{Controle de autoridade}}',portal='{{Portal3|Biologia}}';
 for(const gap of ['\n{{Taxonbar|from=Q1}}\n\n','\n{{Taxonbar}}\n{{Taxonbar|from=Q2}}\n']){const text=call+gap+portal;checks++;assert(a(text,{end:call.length},{start:call.length+gap.length}),'taxonomy gap already keeps authority first');}
 for(const gap of ['\n{{Unknown}}\n','\ntext\n{{Taxonbar}}\n','\n<!--comment-->\n{{Taxonbar}}\n','\n{{Taxonbar|from={{{1}}}}}\n','\n{{Taxonbar|x={{Unknown}}}}\n','\n{{Taxonbar}}\n\u00a0']){const text=call+gap+portal;checks++;assert(!a(text,{end:call.length},{start:call.length+gap.length}),'unproved taxonomy gap is not admitted');}
}
test('portals preserve every theme','{{Portal3|Biografias|Música}}\n{{Portal3|Mulheres|Suécia}}','{{Portal3|Biografias|Música|Mulheres|Suécia}}\n','portals');
test('numeric portal slots become continuous','{{Portal3|LGBT|Crime}}\n{{Portal3|1=Filipinas|2=História}}','{{Portal3|LGBT|Crime|Filipinas|História}}\n','portals');
test('single portal verified alias is one theme','{{Portal3|Tecnologia da informação|Tecnologias de informação}}','{{Portal3|Tecnologia da informação}}','portals');
test('single portal case equivalence keeps first spelling','{{Portal3|Música|música}}','{{Portal3|Música}}','portals');
test('single distinct unknown themes retained','{{Portal3|Desconhecido A|Desconhecido B}}','{{Portal3|Desconhecido A|Desconhecido B}}','portals');
test('single equivalent aliases respect disabled flag','{{Portal3|Música|música}}','{{Portal3|Música|música}}','portals',{portals:false});
for(const rating of ['5','6','avaliação-local','{{#if:1|3|?}}']){const raw='{{PD}}\n{{Marca de projeto|'+rating+'|Ciência|?|rev=20260101}}';test('unknown non-bot quality keeps review date '+rating,raw,raw,'talk',talk);}
const portalConflict='{{Portal3|Música|tamanho=200}}\n{{Portal3|Biografias|tamanho=300}}';test('portal options conflict preserved',portalConflict,portalConflict,'portals');
for(const name of ['Controle de autoridade','Controlo de autoridade'])test('valid authority variant '+name,'{{'+name+'|VIAF=00123}}','{{'+name+'|VIAF=00123}}','authority');
test('authority typo alias','{{Controlo de autoria|VIAF=00123}}','{{Controle de autoridade|VIAF=00123}}','authority');
test('authority equivalent duplicate','{{Controlo de autoridade|VIAF=123}}\n{{Controle de autoridade|VIAF=123}}','{{Controlo de autoridade|VIAF=123}}\n','authority');
const authorityConflict='{{Controlo de autoridade|VIAF=123}}\n{{Controle de autoridade|VIAF=456}}';test('authority distinct IDs preserved',authorityConflict,authorityConflict,'authority');
test('stub equivalent duplicate','{{Esboço-livro}}\n{{Esboço-livro}}','{{Esboço-livro}}\n','stubs');
const distinctStubs='{{Esboço-livro}}\n{{Esboço-ciência}}';test('specific competing stubs preserved',distinctStubs,distinctStubs,'stubs');
test('no stub added','Texto.','Texto.','stubs');
test('generic stub removed for one proven specific','{{Esboço}}\n{{Esboço-livro}}','\n{{Esboço-livro}}','stubs');
test('parameterized stub content preserved','{{Esboço-livro|editor=sim}}\n{{Esboço-livro}}','{{Esboço-livro|editor=sim}}\n{{Esboço-livro}}','stubs');
const footerProfiles={...cfg.footerProfiles,Navegação:'navbox','Navegação A':'navbox','Navegação B':'navbox','Navegação C':'navbox','Navegação D':'navbox'};
test('general coordinate after stub','{{Coord|1|2|display=title}}\n{{Portal3|Ciência}}\n{{Esboço-livro}}\n[[Categoria:Exemplo]]','{{Portal3|Ciência}}\n\n{{Esboço-livro}}\n\n{{Coord|1|2|display=title}}\n\n[[Categoria:Exemplo]]\n','footer',{footerProfiles});
test('footer joined calls separate','{{Referências}}{{Navegação}}{{Portal3|Ciência}}\n[[Categoria:Exemplo]]','{{Referências}}\n\n{{Navegação}}\n\n{{Portal3|Ciência}}\n\n[[Categoria:Exemplo]]\n','footer',{footerProfiles});
test('taxon after navigation before portal','{{Taxonbar}}\n{{Navegação}}\n{{Portal3|Biologia}}','{{Navegação}}\n{{Taxonbar}}\n\n{{Portal3|Biologia}}\n','footer',{footerProfiles});
test('categories own lines no gaps','{{ORDENAÇÃOPADRÃO:Tema}}\n[[Categoria:Exemplo]]\n\n[[Categoria:Outro]]','{{ORDENAÇÃOPADRÃO:Tema}}\n[[Categoria:Exemplo]]\n[[Categoria:Outro]]\n','footer');
test('sort duplicate same key','{{DEFAULTSORT:Tema}}\n{{Portal3|Ciência}}\n{{ORDENAÇÃOPADRÃO:Tema}}\n[[Categoria:Exemplo]]','{{Portal3|Ciência}}\n\n{{ORDENAÇÃOPADRÃO:Tema}}\n[[Categoria:Exemplo]]\n','footer');
const distinctSort='{{DEFAULTSORT:Antes}}\n{{ORDENAÇÃOPADRÃO:Depois}}';test('conflicting sort untouched',distinctSort,distinctSort,'footer');
const grouped='{{Navegação A}}\n{{Navegação B}}\n{{Navegação C}}\n{{Navegação D}}\n{{Controlo de autoridade}}\n{{Portal3|Ciência}}';
test('four proven native navboxes grouped',grouped,'{{Navboxes|título=Tema|lista=\n{{Navegação A}}\n{{Navegação B}}\n{{Navegação C}}\n{{Navegação D}}\n{{Controlo de autoridade}}\n}}\n\n{{Portal3|Ciência}}\n','footer',{footerProfiles});
test('draft keeps navigation names out of user page title',grouped+'\n{{Coord|1|2|display=title}}','{{Navegação A}}\n{{Navegação B}}\n{{Navegação C}}\n{{Navegação D}}\n{{Controlo de autoridade}}\n\n{{Portal3|Ciência}}\n\n{{Coord|1|2|display=title}}\n','footer',{footerProfiles,namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes'});
test('unknown navbox not guessed','{{Desconhecida}}\n{{Portal3|Ciência}}','{{Desconhecida}}\n\n{{Portal3|Ciência}}\n','footer');
for(const raw of ['{{Info/Biografia|coordenadas={{Coord|1|2|display=title}}}}','Texto {{Coord|1|2|display=title}} explicativo.','* {{Coord|1|2|display=title}}','{|\n| {{Coord|1|2|display=title}}\n|}','{{Coord|1|2|display=inline}}'])test('embedded coordinate preserved '+results.length,raw,raw,'footer');
test('space before punctuation outside refs',"[[Tema]] . Outra palavra .\n",'[[Tema]]. Outra palavra.\n','whitespace');
for(const raw of ['<math>x . y</math>','{{Citar livro|título=Uma obra .}}','<nowiki>palavra .</nowiki>','2 . 3','https://example.org .com'])test('punctuation negative '+results.length,raw,raw,'whitespace');
test('leading empty lines','\n \nTexto.','Texto.','whitespace');
test('see also adjacent bullets no blank gaps','== Ver também ==\n* [[A]]\n \n\n* [[B]]','== Ver também ==\n* [[A]]\n* [[B]]','whitespace');
test('PD order and one per line','{{OKA}}{{Traduzido|en|Example}}{{Marca de projeto|3|Ciência|4|rev=20260101}}{{pd}}','{{PD}}\n{{Marca de projeto|3|Ciência|4|rev=20260101}}\n{{Traduzido|página=Example|cód_idioma=en}}\n{{OKA}}','talk',talk);
test('page context preserves talk scope when article markup is disabled','{{pd}}\n{{Traduzido|cód_idioma=en|página=Example|oldid=123}}\n{{Marca de projeto|qualidade|Aviação|?|rev=20200709}}\nConversa.','{{PD}}\n{{Marca de projeto|?|Aviação|?}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123}}\nConversa.','talk',api.pageContextOptions(talk));
test('PD aliases deduplicated','{{pd}}\n{{Página de discussão}}\n== Tema ==\nMensagem.','{{PD}}\n== Tema ==\nMensagem.','talk',talk);
test('bot cleanup preserves importance','{{PD}}\n{{Marca de projeto|1|Aviação|4|bot=?/20131103|rev=20140530}}','{{PD}}\n{{Marca de projeto|?|Aviação|4}}','talk',talk);
const ambiguousBotQuality='{{PD}}\n{{Marca de projeto|3|Ciência|?|qualidade=2|bot=sim|rev=20260101}}';test('conflicting general aliases retain provenance in local component',ambiguousBotQuality,ambiguousBotQuality,'talk',talk);
for(const q of ['1','2','3','4','AB','AD'])test('human quality preserved '+q,'{{PD}}\n{{Marca de projeto|'+q+'|Ciência|3|rev=20260101}}','{{PD}}\n{{Marca de projeto|'+q+'|Ciência|3|rev=20260101}}','talk',talk);
for(const rating of ['1','2','3','4'])test('human importance review date preserved '+rating,'{{PD}}\n{{Marca de projeto|?|Ciência|'+rating+'|rev=20260101}}','{{PD}}\n{{Marca de projeto|?|Ciência|'+rating+'|rev=20260101}}','talk',talk);
test('placeholder quality retains human importance date','{{PD}}\n{{Marca de projeto|qualidade|Aviação|3|rev=20200709}}','{{PD}}\n{{Marca de projeto|?|Aviação|3|rev=20200709}}','talk',talk);
test('unknown importance never proves stale review date','{{PD}}\n{{Marca de projeto|?|Ciência|{{Importância}}|rev=20260101}}','{{PD}}\n{{Marca de projeto|?|Ciência|{{Importância}}|rev=20260101}}','talk',talk);
for(const q of ['qualidade','x','"x"'])test('placeholder rev removed '+q,'{{Marca de projeto|'+q+'|Aviação|?|rev=20200709}}','{{PD}}\n{{Marca de projeto|?|Aviação|?}}','talk',talk);
test('Avançar active removed only','{{PD}}\n{{AvançarDiscussão}}\n== Tema ==\nMensagem.\n<nowiki>{{AvançarDiscussão}}</nowiki>','{{PD}}\n== Tema ==\nMensagem.\n<nowiki>{{AvançarDiscussão}}</nowiki>','talk',talk);
test('Marca projects merge','{{PD}}\n{{Marca de projeto|?|Ciência|3}}\n{{Marca de projeto|?|Física|4}}','{{PD}}\n{{Marca de projeto|?|Ciência|3|Física|4}}','talk',talk);
const qualityConflict='{{PD}}\n{{Marca de projeto|1|Ciência|3}}\n{{Marca de projeto|2|Física|4}}';test('human qualities conflict preserved',qualityConflict,qualityConflict,'talk',talk);
test('translation explicit language prefix','{{PD}}\n{{Tradução|en:Example}}','{{PD}}\n{{Traduzido|página=Example|cód_idioma=en}}','talk',talk);
test('translation oldid URL from existing data','{{PD}}\n{{Traduzido|texto=es:Example|oldid original=[https://es.wikipedia.org/w/index.php?title=Example&oldid=123 123]|data=2026-01-02}}','{{PD}}\n{{Traduzido|página=Example|cód_idioma=es|data=2026-01-02|oldid=123}}','talk',talk);
const translationConflict='{{PD}}\n{{Traduzido|texto=es:Example|cód_idioma=en}}';test('translation conflict preserved',translationConflict,translationConflict,'talk',talk);
test('user talk no invented PD or projects','Mensagem.','Mensagem.','talk',{...talk,namespaceNumber:3,pageTitle:'Usuário Discussão:Conta de Teste'});
for(const options of [{sectionOnly:true},{namespaceNumber:10},{contentModel:'javascript'},{pageRedirect:true}])test('scope hold '+results.length,'{{Portal3|Música}}\n{{Portal3|Biografias}}','{{Portal3|Música}}\n{{Portal3|Biografias}}','portals',options);
for(const raw of ['<nowiki>{{Portal3|A}}{{Portal3|B}}</nowiki>','<syntaxhighlight lang="wikitext">{{PD}}{{PD}}</syntaxhighlight>'])test('literal owner unchanged '+results.length,raw,raw,raw.includes('PD')?'talk':'portals',raw.includes('PD')?{...talk,namespaceNumber:3}:{});
const report={suite:'v2221-layout-talk-repairs',cases:results.length,checks,results,passed:true};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,cases:results.length,checks,passed:true}));
