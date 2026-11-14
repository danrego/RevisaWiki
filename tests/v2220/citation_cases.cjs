'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const api=process.env.REVISAWIKI_CURRENT_CORE?require('./harness.cjs').api:require('./citation_harness.cjs').load(),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo'};let checks=0,plans=0;
function yes(v,m){checks++;assert.ok(v,m);}
function run(source,expected,options={}){plans++;const c={...cfg,...options},p=api.v222CitationsPlan(source,c);yes(p.text===expected,source+' -> '+p.text+' expected '+expected);yes(api.v222CitationsProof(source,p.text,p,c),'exact proof');yes(api.v222CitationsPlan(p.text,c).text===p.text,'idempotence');if(p.edits.length){yes(!api.v222CitationsProof(source,p.text+'x',p,c),'tampered result rejected');yes(!api.v222CitationsProof(source+'x',p.text,p,c),'wrong source rejected');}return p;}
run('{{Citar web|title=Work|publisher=Org|unrecognized=untouched}}','{{Citar web|título=Work|publicado=Org|unrecognized=untouched}}');
run('{{Citar web|title=Work|mystery={{opaque|x=y}}|website=Site}}','{{Citar web|título=Work|mystery={{opaque|x=y}}|obra=Site}}');
run('{{Citar livro|editor=Pessoa Completa|editor2=Outra Pessoa}}','{{Citar livro|editor-sobrenome=Pessoa Completa|editor-sobrenome2=Outra Pessoa}}');
run('{{Citar livro|editor=Pessoa|editor-sobrenome=}}','{{Citar livro|editor=Pessoa|editor-sobrenome=}}');
run('{{Citar livro|last=One|author=Two}}','{{Citar livro|last=One|author=Two}}');
run('{{Citar livro|last=One|ultimo=}}','{{Citar livro|last=One|ultimo=}}');
run('{{Citar livro|autora=Pessoa|sobrenome-editor=Editora|local de publicação=Cidade|fecha=2020}}','{{Citar livro|autor=Pessoa|editor-sobrenome=Editora|local-publicação=Cidade|data=2020}}');
run('{{Citar livro|autora=Pessoa|autora=Outra|title=Work}}','{{Citar livro|autora=Pessoa|autora=Outra|título=Work}}');
run('{{Citar livro|année=2024|champinconnu=valor}}','{{Citar livro|ano=2024|champinconnu=valor}}');
run('{{Citar livro|année=2024|ano=2023|champinconnu=valor}}','{{Citar livro|année=2024|ano=2023|champinconnu=valor}}');
run('{{Citar livro|année=2024|ano=|champinconnu=valor}}','{{Citar livro|année=2024|ano=|champinconnu=valor}}');
run('{{Citar livro|année=2024|year=2023|champinconnu=valor}}','{{Citar livro|année=2024|year=2023|champinconnu=valor}}');
run('{{Citar livro|url_seção=https://example.org/part|unknown=X}}','{{Citar livro|capítulourl=https://example.org/part|unknown=X}}');
run('{{Citar livro|url_seção=https://example.org/a|chapter-url=https://example.org/b}}','{{Citar livro|url_seção=https://example.org/a|chapter-url=https://example.org/b}}');
run('{{Citar livro|status-url=dead}}','{{Citar livro|urlmorta=sim}}');
for(const value of ['unfit','usurped','live','2024','{{x}}'])run('{{Citar livro|status-url='+value+'}}','{{Citar livro|status-url='+value+'}}');
run('{{Citar livro|status-url=dead|url-status=live}}','{{Citar livro|status-url=dead|url-status=live}}');
run('{{Citar livro|status-url=dead|urlmorta=}}','{{Citar livro|status-url=dead|urlmorta=}}');
run('{{Citar livro|status-url=dead|status-url=dead}}','{{Citar livro|status-url=dead|status-url=dead}}');
const stateIntents=['DeadURL','UrlStatus','status-url','url-estado','statusurl','urlmorto','url-status','urlmorta','dead-url','deadurl','datali','li','ligação inativa','ligação inactiva','STATUS_URL','URL_STATUS','url_estado','URLMORTO','url_morta','dead_url','LIGAÇÃO_INATIVA'];
for(const key of stateIntents){
 yes(api.v222CitationStateIntent(key),'known state intent can veto '+key);
 for(const value of ['live','dead','']){
  const before='{{Citar web|status-url=dead|'+key+'='+value+'|title=Fonte|publisher=Instituição}}';
  const after='{{Citar web|status-url=dead|'+key+'='+value+'|título=Fonte|publicado=Instituição}}';
  run(before,after);
 }
}
for(const key of ['DeadURL','UrlStatus','STATUS_URL','URL_STATUS','url_estado','URLMORTO','url_morta','dead_url','LIGAÇÃO_INATIVA']){
 const before='{{Citar web|'+key+'=dead|title=Fonte}}';
 run(before,'{{Citar web|'+key+'=dead|título=Fonte}}');
}
for(const key of ['url','url-access','archive-url','urlmapa','estado','not-a-state'])yes(!api.v222CitationStateIntent(key),'unrelated field is not a state '+key);
run('{{Citar mapa|map-url=https://example.org/map|trans-map=Mapa|map-format=PDF|cartography=Pessoa}}','{{Citar mapa|urlmapa=https://example.org/map|mapa-trad=Mapa|formato-mapa=PDF|cartografia=Pessoa}}');
run('{{Citar mapa|mapurl=https://example.org/map|urlmapa=}}','{{Citar mapa|mapurl=https://example.org/map|urlmapa=}}');
run('{{Citar web|cartography=Pessoa}}','{{Citar web|cartography=Pessoa}}');
run('{{Citar lista de discussão|mailing-list=Lista}}','{{Citar lista de discussão|lista-discussão=Lista}}');
run('{{Citar lista de discussão|mailinglist=Lista|lista=}}','{{Citar lista de discussão|mailinglist=Lista|lista=}}');
run('{{Citar jogo eletrônico|developer=Equipe|developer2=Outra|platform=PC|scene=Final|level=2|isolang=en}}','{{Citar jogo eletrônico|desenvolvedor=Equipe|desenvolvedor2=Outra|plataforma=PC|cena=Final|nível=2|língua=en}}');
run('{{Citar jogo eletrônico|level=2|fase=}}','{{Citar jogo eletrônico|level=2|fase=}}');
run('{{Citar episódio|began=2020|ended=2021}}','{{Citar episódio|início=2020|fim=2021}}');
run('{{Citar episódio|began=2020|início=}}','{{Citar episódio|began=2020|início=}}');
run('{{Citar livro|issue=3|number=4}}','{{Citar livro|issue=3|number=4}}');
run('{{Citar livro|issue=3}}','{{Citar livro|issue=3}}');
run('{{Citar livro|airdate=2020|vauthors=Doe J|veditors=Smith A}}','{{Citar livro|airdate=2020|vauthors=Doe J|veditors=Smith A}}');
run('{{Citar livro|sous-titre=Subtítulo}}','{{Citar livro|sous-titre=Subtítulo}}');
const date='2024-03-17',url='https://web.archive.org/web/20240317000000/https://example.org/?x=1#part';
run('{{Citar livro|archive-date='+url+'|archive-url='+date+'}}','{{Citar livro|arquivodata='+date+'|arquivourl='+url+'}}');
run('{{Citar livro|arquivodata='+url+'|arquivourl='+date+'|archiveurl=}}','{{Citar livro|arquivodata='+url+'|arquivourl='+date+'|archiveurl=}}');
run('{{Citar livro|arquivodata='+url+'|arquivourl=2024}}','{{Citar livro|arquivodata='+url+'|arquivourl=2024}}');
for(const [before,after]of [['jp','ja'],['pt_BR','pt-BR'],['en/fr','en, fr'],['Ukranian','uk']])run('{{Citar livro|língua='+before+'}}','{{Citar livro|língua='+after+'}}');
run('{{Citar livro|língua=jp|language=en}}','{{Citar livro|língua=jp|language=en}}');
for(const value of ['en-GB','zh-Hant','en, fr','jp/en','pt_BR, en'])run('{{Citar livro|língua='+value+'}}','{{Citar livro|língua='+value+'}}');
run('{{Citar livro|páginas=pág. 12–14}}','{{Citar livro|páginas=12–14}}');
run('{{Citar livro|página=p. iv}}','{{Citar livro|página=iv}}');
for(const value of ['Vol.2','pág. [[12]]','pág. A12','pág. 1 e 3','pág. 01','pág. civil','pág. iiii','{{pág.|12}}'])run('{{Citar livro|páginas='+value+'}}','{{Citar livro|páginas='+value+'}}');
run('{{Citar periódico|pmc=PMC10730720}}','{{Citar periódico|pmc=10730720}}');
run('{{Citar periódico|pmc=PMC0123}}','{{Citar periódico|pmc=PMC0123}}');
run('{{Citar livro|isbn=ISBN ISBN: 9780306406157}}','{{Citar livro|isbn=9780306406157}}');
run('{{Citar livro|isbn=ISBN ISBN: 9780306406158}}','{{Citar livro|isbn=ISBN ISBN: 9780306406158}}');
run('{{Citar livro|título=Primeira\nsegunda}}','{{Citar livro|título=Primeira segunda}}');
run('{{Citar livro|título=pa\u200Blavra}}','{{Citar livro|título=palavra}}');
run('{{Citar livro|título=ภาษา\u200Bไทย}}','{{Citar livro|título=ภาษา\u200Bไทย}}');
run('{{Citar livro|título=https://example.org/a\npath}}','{{Citar livro|título=https://example.org/a\npath}}');
const titleCount=run('{{Citar livro|título=Uma\nsegunda\npa\u200Blavra}}','{{Citar livro|título=Uma segunda palavra}}');yes(titleCount.edits[0].count===3,'three title occurrences, one owned value span');
run('{{Citar livro|título=Primeira\n\nsegunda}}','{{Citar livro|título=Primeira\n\nsegunda}}');
run('{{Citar livro|título={{lang|en|pa\u200Blavra}}}}','{{Citar livro|título={{lang|en|pa\u200Blavra}}}}');
for(const wrap of [x=>'<nowiki>'+x+'</nowiki>',x=>'<!--'+x+'-->',x=>'<syntaxhighlight lang="wikitext">'+x+'</syntaxhighlight>',x=>'"'+x+'"',x=>'<math>'+x+'</math>']){const text=wrap('{{Citar livro|title=Work|língua=jp}}');run(text,text);}
run('{{Citar livro|title=Work}}','{{Citar livro|title=Work}}',{automaticParameterNames:false});
run('{{Citar livro|title=Work}}','{{Citar livro|title=Work}}',{citations:false});
run('{{Citar livro|title=Work}}','{{Citar livro|title=Work}}',{namespaceNumber:1});
for(const options of [
 {namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/PU'},
 {namespaceNumber:2,pageTitle:'Usuário:Conta de Teste'},
 {namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Arquivo'},
 {namespaceNumber:4,pageTitle:'Wikipédia:Projeto'},
 {namespaceNumber:14,pageTitle:'Categoria:Exemplos'},
 {namespaceNumber:undefined,pageTitle:'Exemplo'}
])run('{{Citar web|title=Fonte|publisher=Instituição}}','{{Citar web|title=Fonte|publisher=Instituição}}',options);
for(const pageTitle of ['Usuário:Conta de Teste/Testes','Usuário:Conta de Teste/Rascunho','Usuária:Conta de Teste/Testes/Exemplo'])run('{{Citar web|title=Fonte|publisher=Instituição}}','{{Citar web|título=Fonte|publicado=Instituição}}',{namespaceNumber:2,pageTitle});
run('{{Citar web|title=Fonte|publisher=Instituição}}','{{Citar web|título=Fonte|publicado=Instituição}}',{namespaceNumber:10,pageTitle:'Predefinição:Exemplo'});
run('{{Citar web|title=Fonte|publisher=Instituição}}','{{Citar web|title=Fonte|publisher=Instituição}}',{namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes',templateDefinition:true});
const receipt={suite:'v222-citations',checks,plans,passed:true,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
