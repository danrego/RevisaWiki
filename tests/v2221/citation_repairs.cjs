'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {load,cfg}=require('./harness.cjs'),api=load(['citation_repairs']);let checks=0,cases=0;
function yes(value,message){checks++;assert.ok(value,message);}
function run(kind,input,expected,opts={}){cases++;const plan=api['v2221Citation'+kind+'Plan'],proof=api['v2221Citation'+kind+'Proof'],c={...api.defaults,...cfg,...opts},p=plan(input,c);assert.equal(p.text,expected,input);yes(proof(input,p.text,p,c),'bound proof');yes(plan(p.text,c).text===p.text,'idempotent');if(p.edits.length){yes(!proof(input,p.text+'x',p,c),'reject altered result');yes(!proof(input+'x',p.text,p,c),'reject changed draft');}return p;}
run('Fields','{{Citar web|title=T|website=Site|publisher=Entidade|fechaacceso=2024-02-03}}','{{Citar web|título=T|obra=Site|publicado=Entidade|acessodata=2024-02-03}}');
run('Fields','<ref>{{Citar periódico|TITLE=T|tí\u200Btulo2=Outro|unknown=X|language=en}}</ref>','<ref>{{Citar periódico|título=T|tí\u200Btulo2=Outro|unknown=X|língua=en}}</ref>');
run('Fields','{{Citar livro|title=T|título=Outro|author-link=Pessoa}}','{{Citar livro|title=T|título=Outro|autorlink=Pessoa}}');
run('Fields','{{Citar web|website=Site|obra=Outro|publisher=Entidade}}','{{Citar web|website=Site|obra=Outro|publicado=Entidade}}');
run('Fields','{{Citar web|tí\u200Btulo=T}}','{{Citar web|título=T}}');
for(const [key,val,out] of [['isbn','ISBN: 9780306406157','9780306406157'],['doi','https://doi.org/10.1234/EXAMPLE','10.1234/EXAMPLE'],['língua','English / Français','en, fr'],['autorlink','[[Pessoa]]','Pessoa'],['url','https://example.org/long\npath','https://example.org/longpath']])run('Values','{{Citar livro|título=T|'+key+'='+val+'}}','{{Citar livro|título=T|'+key+'='+out+'}}');
for(const value of ['ISBN: 4006381333931','ISBN: 9780306406158','ISBN: 978030640615','ISBN: 9780306406157 extra'])run('Values','{{Citar livro|título=T|isbn='+value+'}}','{{Citar livro|título=T|isbn='+value+'}}');
yes(!api.v2221ISBNValid('4006381333931'),'EAN is not ISBN');yes(api.v2221ISBNValid('0-306-40615-2'),'ISBN10');
run('Values','{{Citar web|url=https://example.org/path?q=1}}','{{Citar web|url=https://example.org/path?q=1|título=example.org}}');
run('Values','{{Citar web|url=https://example.org|título=}}','{{Citar web|url=https://example.org|título=example.org}}');
for(const url of ['https://login:secret@example.org','https://example.org/a\n b','https://example.org/a\n\nb','https://127.0.0.1/a'])run('Values','{{Citar web|url='+url+'}}','{{Citar web|url='+url+'}}');
for(const key of ['url','arquivourl','capítulourl'])for(const second of ['https://second.invalid/b','http://second.invalid/b','ftp://second.invalid/b','//second.invalid/b','www.second.invalid/b'])for(const nl of ['\n','\r\n']){const s='{{Citar livro|título=Documento|'+key+'=https://example.org/a'+nl+second+'}}';run('Values',s,s);}
run('Values','{{Citar web|url=https://example.org|title=Title|título=}}','{{Citar web|url=https://example.org|title=Title|título=}}');
run('StructuredFields','{{Citar livro|primeiro=Pessoa Completa|título=T}}','{{Citar livro|autor=Pessoa Completa|título=T}}');
run('StructuredFields','{{Citar livro|primeiro=Pessoa|último=Silva|título=T}}','{{Citar livro|primeiro=Pessoa|último=Silva|título=T}}');
run('StructuredFields',"{{Citar livro|título=''Obra''|isbn=ISBN}}",'{{Citar livro|título=Obra|isbn=}}');
run('StructuredFields','{{Citar periódico|volume=Vol. 12, n.º 3, pp. 45–50|título=T}}','{{Citar periódico|volume=12|número=3|páginas=45–50|título=T}}');
run('StructuredFields','{{Citar periódico|volume=Vol. 12, n.º 3, pp. 45–50|número=4|título=T}}','{{Citar periódico|volume=Vol. 12, n.º 3, pp. 45–50|número=4|título=T}}');
run('Headers','<ref>{{cite book|title=T|isbn=9780306406157}}</ref>','<ref>{{Citar livro|title=T|isbn=9780306406157}}</ref>');
run('Headers','{{Citar web|título=Artigo|obra=Revista|issn=1234-5679|volume=2|número=3|páginas=10–12}}','{{Citar periódico|título=Artigo|obra=Revista|issn=1234-5679|volume=2|número=3|páginas=10–12}}');
for(const source of ['{{Citar web|título=Artigo|obra=Revista|issn=1234-567X}}','{{Citar web|título=Artigo|obra=Revista|issn=1234-5679}}','{{Citar web|obra=Revista|volume=2|número=3|páginas=10–12}}','{{Citar web|título=Artigo|obra=Revista|volume=2|número=3|páginas=10–12|arquivourl=https://example.org/archive}}'])run('Headers',source,source);
for(const value of ['https://doi.org/10.1234/fonte?download=1','https://doi.org/10.1234/fonte#page=3'])run('Values','{{Citar periódico|título=T|doi='+value+'}}','{{Citar periódico|título=T|doi='+value+'}}');
run('StructuredFields','{{Citar livro|primeiro=Pessoa|vauthors=Outra Pessoa|título=T}}','{{Citar livro|primeiro=Pessoa|vauthors=Outra Pessoa|título=T}}');
run('Headers','{{citar web|autor=Associação Brasileira de Normas Técnicas|título=NBR 10346: Tecnologia de informação|ano=1991}}','{{Citar relatório técnico|autor=Associação Brasileira de Normas Técnicas|título=NBR 10346: Tecnologia de informação|ano=1991}}');
run('Headers','{{Citar web|título=T|obra=Site}}','{{Citar web|título=T|obra=Site}}');
run('Headers','{{Citar web|autor=Equipe|título=NBR 12345: Norma|ano=2024}}','{{Citar web|autor=Equipe|título=NBR 12345: Norma|ano=2024}}');
run('EmptyCalls','Texto.<ref>{{Citar web}} {{Citar web|título=T|url=https://example.org}}</ref>','Texto.<ref>{{Citar web|título=T|url=https://example.org}}</ref>');
run('EmptyCalls','Texto.<ref>{{Citar web|id=identidade}} {{Citar web|título=T|url=https://example.org}}</ref>','Texto.<ref>{{Citar web|id=identidade}} {{Citar web|título=T|url=https://example.org}}</ref>');
for(const [value,expected]of [['assinatura','subscrição'],['subscription','subscrição'],['registration','registro'],['limited','limitada'],['limitado','limitada']])run('Values','{{Citar web|título=T|url-access='+value+'}}','{{Citar web|título=T|url-access='+expected+'}}');
run('Values','{{Citar web|título=T|subscription=assinatura}}','{{Citar web|título=T|subscription=assinatura}}');
run('Values','{{Citar web|título=T|url-access=assinatura|acessourl=registro}}','{{Citar web|título=T|url-access=assinatura|acessourl=registro}}');
run('Languages','{{Citar web|título=T|língua=en|língua2=fr}}','{{Citar web|título=T|língua=en, fr}}');
run('Languages','{{Citar web|título=T|língua=en|língua2=en}}','{{Citar web|título=T|língua=en}}');
for(const source of ['{{Citar web|língua=en|língua2={{Idioma|fr}}}}','{{Citar web|língua=|língua2=fr}}','{{Citar web|língua=en|língua2=fr|language=de}}','{{Citar web|língua=en|língua2=fr|língua3=de}}'])run('Languages',source,source);
run('EmptyCalls','Texto.<ref>{{citar web}} [https://example.org/fonte Fonte de exemplo], 2024</ref>','Texto.<ref> [https://example.org/fonte Fonte de exemplo], 2024</ref>');
for(const tail of ['Explicação {{citar web}} [https://example.org Fonte]','{{citar web}} [https://example.org]','{{citar web|id=fonte}} [https://example.org Fonte], 2024','{{citar web}} Texto que não é fonte'])run('EmptyCalls','<ref>'+tail+'</ref>','<ref>'+tail+'</ref>');
for(const wrapper of [s=>'“'+s+'”',s=>'«'+s+'»',s=>'`'+s+'`',s=>'{{URL|1='+s+'}}',s=>'{{Url|'+s+'}}'])run('Values','{{Citar web|título=T|url='+wrapper('https://example.org/path')+'}}','{{Citar web|título=T|url=https://example.org/path}}');
run('Values','{{Citar web|url={{URL|1=https://example.org/path?q=1}}}}','{{Citar web|url=https://example.org/path?q=1|título=example.org}}');
for(const value of ['{{URL|https://example.org/path?q=1}}','{{URL|1=https://example.org/path|2=Rótulo}}','{{URL|1=https://example.org/path?}}'])run('Values','{{Citar web|título=T|url='+value+'}}','{{Citar web|título=T|url='+value+'}}');
run('Fields','{{Citar web|título=T|língua2=desconhecido}}','{{Citar web|título=T|língua2=desconhecido}}');
run('Fields','{{Citar jogo eletrônico|title=Jogo|developer2=Equipe|platform=PC|scene=Final|level=2|isolang=en}}','{{Citar jogo eletrônico|título=Jogo|desenvolvedor2=Equipe|plataforma=PC|cena=Final|nível=2|língua=en}}');
run('Fields','{{Citar jogo eletrônico|título=Jogo|desenvolvedor2=Equipe}}','{{Citar jogo eletrônico|título=Jogo|desenvolvedor2=Equipe}}');
run('Fields','{{Citar entrevista|entrevistado=Pessoa|título=Entrevista}}','{{Citar entrevista|entrevistado=Pessoa|título=Entrevista}}');
for(const key of ['DeadURL','deadURL','dead_url','URL-status','url_status','UrlStatus']){
 const source='{{Citar web|title=Fonte|'+key+'=yes|url-status=live|urlmorta=não}}';
 run('Fields',source,source.replace('|title=Fonte','|título=Fonte'));
}
run('Fields','{{Citar web|subscription=yes|título=Fonte}}','{{Citar web|subscrição=yes|título=Fonte}}');
for(const kind of ['Fields','Values','Languages','StructuredFields','Headers','EmptyCalls']){
 for(const wrap of [s=>'<!--'+s+'-->',s=>'<nowiki>'+s+'</nowiki>',s=>'<math>'+s+'</math>',s=>'"'+s+'"']){const s=wrap('{{Citar web|title=T|url=https://example.org|isbn=ISBN}}');run(kind,s,s);}
 run(kind,'{{Citar web|title=T|url=https://example.org}}','{{Citar web|title=T|url=https://example.org}}',{citations:false});
 run(kind,'{{Citar web|title=T|url=https://example.org}}','{{Citar web|title=T|url=https://example.org}}',{namespaceNumber:1});
}
let fullActionCalculations=0;
if(process.env.REVISAWIKI_CURRENT_CORE)for(const key of ['url','arquivourl','capítulourl'])for(const second of ['https://second.invalid/b','http://second.invalid/b','ftp://second.invalid/b','//second.invalid/b','www.second.invalid/b'])for(const nl of ['\n','\r\n']){
 const literal='https://example.org/a'+nl+second,source='Texto sobre [[Brasil|Brasil]].<ref>{{Citar livro|título=Documento|'+key+'='+literal+'}}</ref>\n{{Referências}}',options={...api.defaults,...cfg},r=api.calculate({kind:'adjust',source,originalSource:source,options});cases++;fullActionCalculations++;
 yes(r.text.includes(literal),'Distinct explicit addresses survive the complete pipeline');yes(r.text.includes('[[Brasil]]'),'An unrelated safe adjustment still applies');yes(api.v219AutomaticResultSafety(source,r).accepted,'Full-action preservation accepts the retained addresses');
 const replay=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options});fullActionCalculations++;yes(replay.text===r.text,'Distinct-address control is idempotent');
}
const result={suite:'v2221-citation-repairs',cases,checks,fullActionCalculations,passed:true,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
