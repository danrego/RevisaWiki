'use strict';
// The saved baseline supplies the actual parser helpers. The new module is
// inserted in memory for focused contracts; no frozen distribution is edited.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const bundle=process.env.REVISAWIKI_V221_BUNDLE||path.join(root,'dist/2.20.0/RevisaWiki_v2_20_0_completo.js');
const exports221=['v221CitationPlan','v221CitationPlanProof','v221CitationCall','v221CitationISSN','v221CitationConsumer',
    'v221CitationMigrationSafe','v221FilterCitationSuggestions','v221FilterCitationWarnings','v221CitationValidExtra',
    'v221ReferenceNameEdits','v221CitationTitleRequests','v221CitationTitleMetadataProof','v221CitationTitleProof','v221CitationResearchInventory',
    'v221CitationEditionAliasPlan','v221CitationEditionAliasProof','v221CitationHeaderPlan','v221CitationHeaderProof'];
let program=fs.readFileSync(bundle,'utf8');
const anchor=/\bconst api\s*=\s*\{/g;assert.equal([...program.matchAll(anchor)].length,1);
if(!program.includes('function v221CitationPlan(')){
    program=program.replace(anchor,()=>fs.readFileSync(path.join(root,'src/v2_21/citation_repairs.js'),'utf8')+'\nconst api={'+exports221.join(',')+',');
}else program=program.replace(anchor,()=> 'const api={'+exports221.join(',')+',');
const compiled=new Module(bundle,module);compiled.filename=bundle;compiled.paths=Module._nodeModulePaths(path.dirname(bundle));compiled._compile(program,bundle);
const api=compiled.exports;for(const name of exports221)assert.equal(typeof api[name],'function',name);
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Teste de contrato',contentModel:'wikitext',v216CalendarUTC:'2026-10-23'};
const full=raw=>'Texto de controle.<ref>'+raw+'</ref>\n\n{{Referências}}\n';
const cases=[];
const add=(id,before,after)=>cases.push({id,before,after});
for(const key of ['data-acesso','consultadoem','acessodadata','acessodate'])add('access-'+key,'{{Citar web|url=https://example.invalid/a|título=Obra|'+key+'=1 de janeiro de 2024}}','{{Citar web|url=https://example.invalid/a|título=Obra|acessodata=1 de janeiro de 2024}}');
add('publication-date','{{Citar livro|título=Obra|sdata=2026-10-05|acessodata=2026-10-06}}','{{Citar livro|título=Obra|data=2026-10-05|acessodata=2026-10-06}}');
add('author-count','{{Citar periódico|título=Obra|número-autores=et al.}}','{{Citar periódico|título=Obra|numero-autores=et al.}}');
add('editor-count','{{Citar livro|título=Obra|número-editores=3}}','{{Citar livro|título=Obra|numero-editores=3}}');
for(const key of ['ano-original','orig-ano'])add('original-year-'+key,'{{Citar livro|título=Obra|'+key+'=1999}}','{{Citar livro|título=Obra|anooriginal=1999}}');
add('edition-key','{{Citar livro|título=Obra|ediçao=5}}','{{Citar livro|título=Obra|edição=5}}');
for(const key of ['obral','pbra'])add('periodical-key-'+key,'{{Citar web|url=https://example.invalid|título=Obra|'+key+'=Revista}}','{{Citar web|url=https://example.invalid|título=Obra|obra=Revista}}');
for(const ordinal of ['1ª','2.º','11º'])add('edition-value-'+ordinal,'{{Citar livro|título=Obra|edicao='+ordinal+' ed.}}','{{Citar livro|título=Obra|edicao='+ordinal+'}}');
add('issn-label','{{Citar periódico|título=Obra|issn=ISSN 2183-1785}}','{{Citar periódico|título=Obra|issn=2183-1785}}');
add('isbn-period','{{Citar livro|título=Obra|isbn=ISBN 9780306406157.}}','{{Citar livro|título=Obra|isbn=9780306406157}}');
add('isbn-from-id','{{Citar livro|título=Obra|id=ISBN 978-0-306-40615-7}}','{{Citar livro|título=Obra|isbn=978-0-306-40615-7}}');
for(const key of ['questão','nº'])add('issue-'+key,'{{Citar jornal|título=Obra|volume=31|'+key+'=82-B}}','{{Citar jornal|título=Obra|volume=31|número=82-B}}');
add('locator','{{Citar livro|título=Obra|loc=§1}}','{{Citar livro|título=Obra|em=§1}}');
for(const key of ['link-autor1','linkautor1'])add('author-link-'+key,'{{Citar periódico|título=Obra|ultimo1=Silva|'+key+'=Pessoa fictícia}}','{{Citar periódico|título=Obra|ultimo1=Silva|autorlink1=Pessoa fictícia}}');
add('author-link-default','{{Citar livro|título=Obra|ultimo=Silva|linkautor=Pessoa fictícia}}','{{Citar livro|título=Obra|ultimo=Silva|autorlink=Pessoa fictícia}}');
for(const key of ['ultimo-editor','último-editor','editor-último','editor-ultimo'])add('editor-key-'+key,'{{Citar livro|título=Obra|'+key+'=Silva}}','{{Citar livro|título=Obra|editor-sobrenome=Silva}}');
for(const key of ['ultimo-editor2','último-editor2','editor-último2','editor-ultimo2','editor2-ultimo','editor2-último'])add('editor-key-'+key,'{{Citar livro|título=Obra|editor-sobrenome1=Anterior|'+key+'=Silva}}','{{Citar livro|título=Obra|editor-sobrenome1=Anterior|editor-sobrenome2=Silva}}');
add('editor-first','{{Citar livro|título=Obra|editor-sobrenome1=Anterior|editor-sobrenome2=Silva|primeiro-editor2=Nome}}','{{Citar livro|título=Obra|editor-sobrenome1=Anterior|editor-sobrenome2=Silva|editor-nome2=Nome}}');
for(const [key,target,value] of [['pais','país','BR'],['country','país','BR'],['numero','número','1234'],['number','número','1234'],['titulo','título','Obra']])add('patent-'+key,'{{Citar patente|'+key+'='+value+'}}','{{Citar patente|'+target+'='+value+'}}');
for(const [first,last] of [['primeiro','último'],['primeiro','ultimo'],['primeiro','sobrenome'],['nome','sobrenome']])add('tweet-name-'+first+last,'{{Citar tweet|'+first+'=Nome|'+last+'=Silva|usuário=conta|número=123|data=2024-01-01|título=Obra}}','{{Citar tweet|autor=Nome Silva|usuário=conta|número=123|data=2024-01-01|título=Obra}}');
add('tweet-handle','{{Citar tweet|usuário=@conta|número=123|url=https://twitter.com/conta/status/123|data=2024-01-01|título=Obra}}','{{Citar tweet|usuário=conta|número=123|url=https://twitter.com/conta/status/123|data=2024-01-01|título=Obra}}');
const original='https://example.invalid/a',archive='https://web.archive.org/web/20240102123456/'+original;
add('archive-url','{{Citar web|url='+original+'|título=Obra|arquivurl='+archive+'|arquivodata=2024-01-02}}','{{Citar web|url='+original+'|título=Obra|arquivourl='+archive+'|arquivodata=2024-01-02}}');
add('archive-date','{{Citar web|url='+original+'|título=Obra|arquivourl='+archive+'|dataarquivo=2024-01-02}}','{{Citar web|url='+original+'|título=Obra|arquivourl='+archive+'|arquivodata=2024-01-02}}');
for(const [key,from,to] of [['urlmorta','live','não'],['url-status','ativo','não'],['statusurl','morto','sim'],['urlmorta','dead','sim'],['urlmorta','ao vivo','não']])add('url-state-'+key+from,'{{Citar web|url='+original+'|título=Obra|arquivourl='+archive+'|arquivodata=2024-01-02|'+key+'='+from+'}}','{{Citar web|url='+original+'|título=Obra|arquivourl='+archive+'|arquivodata=2024-01-02|urlmorta='+to+'}}');
add('missing-pipe','{{Citar web|url='+original+'|título=Obra|arquivodata=2024-01-02|urlmorta=deadarchiveurl='+archive+'}}','{{Citar web|url='+original+'|título=Obra|arquivodata=2024-01-02|urlmorta=sim|arquivourl='+archive+'}}');
add('tweet-archive','{{Citar tweet|usuário=conta|número=123|data=2024-01-01|título=Obra|url-arquivo=https://web.archive.org/web/20240102123456/https://twitter.com/conta/status/123|data-arquivo=2024-01-02|url-status=ativo}}','{{Citar tweet|usuário=conta|número=123|data=2024-01-01|título=Obra|arquivourl=https://web.archive.org/web/20240102123456/https://twitter.com/conta/status/123|arquivodata=2024-01-02|urlmorta=não}}');
for(const [key,from,to,target] of [['url-acesso','assinatura','subscrição','acessourl'],['url-acess','subscription','subscrição','acessourl'],['url-access','registration','registro','url-access'],['acessourl','limited','limitada','acessourl'],['url-access','limitado','limitada','url-access'],['url-access','Subscrição','subscrição','url-access']])add('url-access-'+key+from,'{{Citar web|url='+original+'|título=Obra|'+key+'='+from+'}}','{{Citar web|url='+original+'|título=Obra|'+target+'='+to+'}}');
for(const [from,to]of [['registration','registro'],['limited','limitada'],['subscription','subscrição']])add('legacy-urlaccess-'+from,
    '{{Citar web|url='+original+'|título=Obra|urlaccess='+from+'}}','{{Citar web|url='+original+'|título=Obra|acessourl='+to+'}}');
add('doi-access','{{Citar periódico|título=Obra|doi=10.1000/example|doi-acesso=livre}}','{{Citar periódico|título=Obra|doi=10.1000/example|doi-access=free}}');
add('episode-caption-key','{{Citar episódio|série=Programa|título=Episódio|tempo=10:00|lengenda=Trecho}}','{{Citar episódio|série=Programa|título=Episódio|tempo=10:00|legenda=Trecho}}');
add('conference-url','{{Citar conferência|título=Obra|urlconferencia='+original+'|evento=Encontro}}','{{Citar conferência|título=Obra|conference-url='+original+'|evento=Encontro}}');
add('conference-format','{{Citar conferência|título=Obra|conference-url='+original+'|evento=Encontro|formato-conferencia=PDF}}','{{Citar conferência|título=Obra|conference-url='+original+'|evento=Encontro|formato-conferência=PDF}}');
let assertions=0;
for(const row of cases){
    const source=full(row.before),expected=full(row.after),plan=api.v221CitationPlan(source,cfg);
    assert.equal(plan.text,expected,row.id);assertions++;
    assert.equal(api.v221CitationPlanProof(source,expected,plan,cfg),true,row.id+' proof');assertions++;
    assert.equal(api.v221CitationPlan(expected,cfg).text,expected,row.id+' idempotence');assertions++;
    assert.equal(api.v221CitationPlanProof(source,expected,{...plan,sourceHash:'forged'},cfg),false,row.id+' forged proof');assertions++;
    for(const disabled of [{namespaceNumber:1},{sectionOnly:true},{pageRedirect:true},{pageDisambiguation:true},{citations:false},{citationRepairs:false},{automaticCitationKeyRepairs:false},{automaticParameterNames:false}]){
        assert.equal(api.v221CitationPlan(source,{...cfg,...disabled}).text,source,row.id+' scope');assertions++;
    }
}
const negatives=[
    '{{Unknown template|sdata=2026-10-05|número-autores=et al.}}',
    '{{Citar livro|título=Obra|sdata=2026-02-30}}','{{Citar livro|título=Obra|sdata=2026-10-05|data=2026-10-06}}',
    '{{Citar livro|título=Obra|sdata={{data|2026|10|05}}}}','{{Citar web|url='+original+'|data-acesso=2024-01-01|acessodata=2024-01-02}}',
    '{{Citar periódico|título=Obra|número-autores=et al. (Colaboração)}}',
    '{{Citar periódico|título=Obra|número-autores=3|display-authors=5}}',
    '{{Citar livro|título=Obra|id=ISBN 9780306406158}}','{{Citar livro|título=Obra|id=ISBN 9780306406157|isbn=9780306406157}}',
    '{{Citar livro|título=Obra|id=ISBN 9780306406157 e outra obra}}','{{Citar livro|título=Obra|isbn=ISBN 9780306406157. e 9780306406157}}',
    '{{Citar periódico|título=Obra|issn=ISSN 2183-1786}}','{{Citar periódico|título=Obra|issn=ISSN 2183-1785 / 2183-1785}}',
    '{{Citar livro|título=Obra|edicao=1ª ed. revista}}','{{Citar livro|título=Obra|ediçao=2|edição=3}}',
    '{{Citar livro|título=Obra|edicao=1ª ed.|edition=1ª ed.}}',
    '{{Citar web|url='+original+'|título=Obra|obral=Jornal|obra=Revista}}',
    '{{Citar jornal|título=Obra|questão=Crise econômica}}','{{Citar livro|título=Obra|questão=2}}',
    '{{Citar periódico|título=Obra|link-autor1=Pessoa}}','{{Citar periódico|título=Obra|ultimo2=Silva|link-autor1=Pessoa}}',
    '{{Citar periódico|título=Obra|ultimo1=Silva|link-autor1=Pessoa|autorlink1=Outra}}',
    '{{Citar livro|título=Obra|ultimo-editor=Silva|editor-sobrenome=Outra}}',
    '{{Citar livro|título=Obra|ultimo-editor2=Silva}}','{{Citar livro|título=Obra|primeiro-editor2=Nome}}',
    '{{Citar patente|pais=BR|país=PT}}','{{Citar patente|numero=123|número-patente=456}}',
    '{{Citar tweet|primeiro=Nome|sobrenome=Silva|autor=Empresa|usuário=conta|número=123|data=2024-01-01|título=Obra}}',
    '{{Citar tweet|primeiro=Nome|sobrenome={{Nome}}|usuário=conta|número=123|data=2024-01-01|título=Obra}}',
    '{{Citar tweet|usuário=@conta|número=123|url=https://twitter.com/outra/status/123|data=2024-01-01|título=Obra}}',
    '{{Citar web|url='+original+'|título=Obra|arquivurl='+archive+'|arquivodata=2024-01-03}}',
    '{{Citar web|url='+original+'|título=Obra|dataarquivo=2024-01-02}}',
    '{{Citar web|url='+original+'|título=Obra|arquivourl='+archive+'|dataarquivo=2024-01-02|url-status=sim}}',
    '{{Citar web|url='+original+'|título=Obra|url-acesso=assinatura|url-access=registro}}',
    '{{Citar web|url='+original+'|título=Obra|url-acesso=assinatura|registro=sim}}',
    '{{Citar web|url='+original+'|título=Obra|urlaccess=registration|acessourl=}}',
    '{{Citar web|url='+original+'|título=Obra|urlaccess=limited|url-access=subscription}}',
    '{{Citar web|url='+original+'|título=Obra|urlaccess=registration|registration=yes}}',
    '{{Citar web|título=Obra|urlaccess=registration}}',
    '{{Citar web|url='+original+'|título=Obra|urlaccess=open}}',
    '{{Citar periódico|título=Obra|doi-acesso=livre}}','{{Citar periódico|título=Obra|doi=10.1000/example|doi-acesso=livre|doi-access=free}}',
    '{{Citar mapa|mapa=Mapa|urlmapa='+original+'|formato-mapa=PDF}}',
    '{{Citar conferência|título=Obra|urlconferencia='+original+'|conference-url=https://example.invalid/b}}',
    '{{Citar conferência|título=Obra|urlconferencia='+original+'}}',
    '{{Citar livro|título=Obra|número-artigo=123|ignore-isbn-error=yes|isbn=9780306406158|língua=fr}}'
];
for(const raw of negatives){const source=full(raw);assert.equal(api.v221CitationPlan(source,cfg).text,source,raw);assertions++;}
for(const prefix of ['<nowiki>','<pre>','<source>','<syntaxhighlight lang="wikitext">','<code>','<!--']){
    const tag=prefix==='<!--'?'-->':'</'+/^<([a-z]+)/.exec(prefix)[1]+'>';
    const source=prefix+cases[0].before+tag;assert.equal(api.v221CitationPlan(source,cfg).text,source,'protected '+prefix);assertions++;
}
// Every finite native role family is exercised on every direct consumer. A
// field active in the source, even when empty, remains a collision rather than
// being overwritten by the repaired spelling.
for(const title of ['Citar web','Citar livro','Citar jornal','Citar notícia','Citar periódico','Citar revista','Citar enciclopédia','Citar conferência','Citar mapa','Citar episódio','Citar lista de discussão','Citar jogo eletrônico']){
    const core='{{'+title+'|url='+original+'|título=Obra|data-acesso=2024-01-01',raw=core+'}}';
    assert.equal(api.v221CitationPlan(full(raw),cfg).text,full(raw.replace('data-acesso=','acessodata=')));assertions++;
    for(const alias of ['acesso','acessodata','acesso-data','accessodata','acessadoem','dataacesso','accessdate','access-date','fechaacceso','consulta','acessdate']){
        for(const value of ['', '2024-01-01','2024-01-02']){
            const collision=core+'|'+alias+'='+value+'}}';
            assert.equal(api.v221CitationPlan(full(collision),cfg).text,full(collision),title+'/'+alias);assertions++;
        }
    }
}
for(const key of ['data-acesso','consultadoem','acessodadata','acessodate']){
    for(const date of ['2024-02-30','2023-02-29','0 de janeiro de 2024','32 de janeiro de 2024','2024-13-01','ontem','{{data}}','2024-01-01<!-- nota -->']){
        const raw='{{Citar web|url='+original+'|título=Obra|'+key+'='+date+'}}';
        assert.equal(api.v221CitationPlan(full(raw),cfg).text,full(raw));assertions++;
    }
}
const curly='Texto.<ref name=“fonte”>Fonte preservada.</ref> Outro.<ref name="fonte"/>\n{{Referências}}';
assert.equal(api.v221CitationPlan(curly,cfg).text,curly.replace('name=“fonte”','name=fonte'));assertions++;
for(const source of [curly.replace('Outro.<ref name="fonte"/>',''),curly.replace('Outro.', '<ref name="fonte">Outra fonte.</ref> Outro.'),'<nowiki>'+curly+'</nowiki>']){
    assert.equal(api.v221CitationPlan(source,cfg).text,source);assertions++;
}
const broken='Texto.<ref name="fonte>Fonte preservada.</ref> Outro.<ref name="fonte"/>\n{{Referências}}';
assert.equal(api.v221CitationPlan(broken,cfg).text,broken.replace('name="fonte>','name="fonte">'));assertions++;
for(const source of ['<nowiki>'+broken+'</nowiki>',broken.replace('fonte>','fonte group="x">'),broken.replace('Fonte preservada.','Fonte <ref>aninhada</ref>.')]){
    assert.equal(api.v221CitationPlan(source,cfg).text,source);assertions++;
}
for(const source of [broken.replace('Fonte preservada.','<b>Fonte preservada.'),broken.replace('fonte>','123>'),broken+'\n{{Outro produtor de referências}}', '<nowiki>'+broken]){
    assert.equal(api.v221CitationPlan(source,cfg).text,source);assertions++;
}
for(const delimiter of ['"',"'"])for(const nested of ["[[Alvo|''Rótulo literal'']]",'{{Citar web|título=Fonte literal|data=2001-3-18|url=https://example.invalid/fonte}}','{| class="wikitable"\n| Célula literal\n|}']){
    const payload='<ref name='+delimiter+'a>[https://example.invalid/primeira Fonte literal]</ref>\n'+nested+'\n'+delimiter+' broken>Corpo literal</ref>',
        source='[[Outro alvo|Outro alvo]].\n'+payload+'\nTexto final.\n{{Referências}}';
    assert.equal(api.v221CitationPlan(source,cfg).text,source,'garbled attribute literal retained');assertions++;
}
assert.equal(api.v221CitationMigrationSafe('{{Citar livro|título=Obra|loc=Paris}}','{{Citar livro|título=Obra|local=Paris}}'),false);assertions++;
assert.equal(api.v221CitationMigrationSafe('{{Cite book|title=Obra|loc=Paris}}','{{Citar livro|title=Obra|local=Paris}}'),false);assertions++;
for(const title of ['Cite web','Cite news','Cite book','Cite journal','Cite magazine']){
    const raw='{{'+title+'|url='+original+'|title=Obra|data-acesso=2024-01-01}}';
    assert.equal(api.v221CitationPlan(full(raw),cfg).text,full(raw.replace('data-acesso=','acessodata=')));assertions++;
}
for(const key of ['número-artigo','numero-artigo','article-number','ignore-isbn-error','ignore-isbn','ignoreisbnerror']){
    assert.equal(api.v221CitationMigrationSafe('{{Citar livro|título=Obra|'+key+'=valor}}','{{Citar livro|título=Obra|páginas=valor}}'),false);assertions++;
}
assert.equal(api.v221CitationMigrationSafe('{{Citar livro|título=Obra|lang=ja}}','{{Citar livro|título=Obra}}'),false);assertions++;
assert.equal(api.v221CitationMigrationSafe('{{Citar livro|título=Obra|lang=ja}}','{{Citar livro|título=Obra|língua=ja}}'),true);assertions++;
for(const extra of ['lang=ja','número-artigo=42','article-number=42','ignore-isbn-error=sim']){
    assert.equal(api.v221CitationMigrationSafe('{{Citar livro|título=Obra|'+extra+'}}','{{Citar web|título=Obra}}'),false);assertions++;
    assert.equal(api.v221CitationMigrationSafe('{{Citar livro|título=Obra|'+extra+'}}','{{Modelo desconhecido|título=Obra}}'),false);assertions++;
}
for(const alias of ['Cite web','Cite news','Cite book','Cite journal','Cite magazine','Cite document','Literatur','Cite conference',
    'Cite encyclopedia','Cite tweet','Cite mailing list','Cite video game','Cite episode','Cite map','Cita web','Cita libro','Lien web',
    'Cita noticia','Ouvrage','Cita news','Citeer web','Article','Webbref']){
    const raw='{{'+alias+'|título=Obra}}',source=full(raw);
    assert.ok(api.v221CitationConsumer(raw),alias+' pinned native redirect');assertions++;
    assert.equal(api.v221CitationHeaderPlan(source,cfg).text,source,alias+' no cosmetic header change');assertions++;
}
{
    const call='{{cite encyclopedia|url='+original+'|title=Obra|access-date=2024-01-03|archive-url='+archive+'|archive-date=2024-01-02|url-status=live}}',
        source=full(call),expected=source.replace('cite encyclopedia','Citar enciclopédia'),plan=api.v221CitationHeaderPlan(source,cfg);
    assert.equal(plan.text,expected);assertions++;
    assert.equal(api.v221CitationHeaderProof(source,expected,plan,cfg),true);assertions++;
    assert.equal(api.v221CitationHeaderProof(source,expected,{...plan,sourceHash:'forged'},cfg),false);assertions++;
    assert.equal(api.v221CitationHeaderPlan(expected,cfg).text,expected);assertions++;
    for(const other of ['<nowiki>'+source+'</nowiki>',source.replace('cite encyclopedia','Cite encylopedia')]){
        assert.equal(api.v221CitationHeaderPlan(other,cfg).text,other);assertions++;
    }
    assert.equal(api.v221CitationMigrationSafe('{{Cite encyclopedia|título=Obra|lang=pt}}','{{Citar enciclopédia|título=Obra}}'),false);assertions++;
    assert.equal(api.v221CitationMigrationSafe('{{Cite encyclopedia|título=Obra|article-number=42}}','{{Citar enciclopédia|título=Obra}}'),false);assertions++;
}
{
    const afterDedup=full('{{Citar livro|título=Obra|edicao=1ª ed.}}'),
        collided=full('{{Citar livro|título=Obra|edicao=1ª ed.|edition=1ª ed.}}');
    assert.equal(api.v221CitationPlan(afterDedup,{...cfg,citationOriginalSource:collided}).text,full('{{Citar livro|título=Obra|edicao=1ª}}'));assertions++;
    const prerequisite=api.v221CitationEditionAliasPlan(collided,cfg);
    assert.equal(prerequisite.text,afterDedup);assertions++;
    assert.equal(api.v221CitationEditionAliasProof(collided,afterDedup,prerequisite,cfg),true);assertions++;
    assert.equal(api.v221CitationEditionAliasProof(collided,afterDedup,{...prerequisite,sourceHash:'forged'},cfg),false);assertions++;
    assert.equal(api.v221CitationEditionAliasPlan(afterDedup,cfg).text,afterDedup);assertions++;
    const sameKey=collided.replace('edition=','edicao=');
    assert.equal(api.v221CitationEditionAliasPlan(sameKey,cfg).text,afterDedup);assertions++;
    const redirect=collided.replace('Citar livro','Cite book'),header=api.v221CitationHeaderPlan(redirect,cfg),aliases=api.v221CitationEditionAliasPlan(header.text,cfg);
    assert.equal(api.v221CitationPlan(aliases.text,{...cfg,citationOriginalSource:redirect}).text,full('{{Citar livro|título=Obra|edicao=1ª}}'));assertions++;
    const padded=collided.replace('edition=1ª ed.','edition=1ª ed. ');
    assert.equal(api.v221CitationEditionAliasPlan(padded,cfg).text,afterDedup);assertions++;
    for(const source of [collided.replace('edition=1ª ed.','edition=2ª ed.'),collided.replace('edition=1ª ed.','edition=1ª ed.\u00a0'),
        collided.replace('1ª ed.','primeira edição'),'<nowiki>'+collided+'</nowiki>']){
        assert.equal(api.v221CitationEditionAliasPlan(source,cfg).text,source);assertions++;
    }
    const clean=full('{{Citar livro|título=Obra|edition=1ª ed.}}');
    assert.equal(api.v221CitationPlan(afterDedup,{...cfg,citationOriginalSource:clean}).text,full('{{Citar livro|título=Obra|edicao=1ª}}'));assertions++;
    const homonymous=collided.replace('edition=1ª ed.','edition=2ª ed.')+'\n'+clean;
    assert.equal(api.v221CitationPlan(afterDedup,{...cfg,citationOriginalSource:homonymous}).text,afterDedup);assertions++;
    const identicalOwners=collided+'\n'+clean;
    assert.equal(api.v221CitationPlan(afterDedup,{...cfg,citationOriginalSource:identicalOwners}).text,full('{{Citar livro|título=Obra|edicao=1ª}}'));assertions++;
    const changedOwner=clean.replace('Obra','Outra obra');
    assert.equal(api.v221CitationPlan(afterDedup,{...cfg,citationOriginalSource:changedOwner}).text,afterDedup);assertions++;
    const changedOther=clean.replace('edition=','isbn=9780306406157|edition=');
    assert.equal(api.v221CitationPlan(afterDedup,{...cfg,citationOriginalSource:changedOther}).text,afterDedup);assertions++;
    const duplicateCurrent=afterDedup+'\n'+afterDedup;
    assert.equal(api.v221CitationPlan(duplicateCurrent,{...cfg,citationOriginalSource:clean}).text,full('{{Citar livro|título=Obra|edicao=1ª}}')+'\n'+full('{{Citar livro|título=Obra|edicao=1ª}}'));assertions++;
    const source=full('{{Citar livro|título=Obra|edicao=1ª ed.|edição=2ª ed.}}');
    assert.equal(api.v221CitationPlan(afterDedup,{...cfg,citationOriginalSource:source}).text,afterDedup);assertions++;
}
const source=full('{{Citar periódico|título=Exceptional boundary states at|c=1|periodico=Nuclear Physics B|doi=10.1016/S0550-3213(01)00486-2}}');
const request=api.v221CitationTitleRequests(source,cfg)[0];assert.ok(request);assertions++;
const metadata=JSON.stringify({status:'ok',message:{DOI:request.doi,title:[request.expectedTitle]}}),proof=api.v221CitationTitleMetadataProof(source,request,metadata);
assert.ok(proof);assertions++;
assert.equal(api.v221CitationPlan(source,cfg).text,source);assertions++;
const titlePlan=api.v221CitationPlan(source,{...cfg,v221DOITitleProofs:[proof]});
assert.equal(titlePlan.text,source.replace('states at|c=1','states at c=1'));assertions++;
for(const forged of [{...proof,sourceHash:'forged'},{...proof,responseRaw:metadata.replace('states at c=1','Other title')},{...proof,request:{...request,doi:'10.1000/other'}}]){
    assert.equal(api.v221CitationPlan(source,{...cfg,v221DOITitleProofs:[forged]}).text,source);assertions++;
}
for(const [title,key] of [['Citar jogo eletrônico','cena'],['Citar jogo eletrônico','plataforma'],['Citar lista de discussão','lista'],['Citar episódio','seriesno'],['Citar periódico','aspas'],['Convert','sp'],['Citar livro','ignore-isbn-error']]){
    const before='{{'+title+'|'+key+'=value}}',whole='Text '+before,at=whole.indexOf(before),finding={start:at,end:whole.length,before,reviewGroup:{kind:'unsupported-template-parameter',template:title.toLowerCase(),parameter:key},choices:[{after:'BAD'}]};
    assert.equal(api.v221FilterCitationSuggestions(whole,[finding],cfg).length,0);assertions++;
    assert.equal(api.v221FilterCitationWarnings(whole,['Parâmetro fora do catálogo de '+title+': '+key+'. Valor preservado.'],cfg).length,0);assertions++;
}
for(const title of ['Info/Biografia','Navbox','Ferramenta desconhecida']){
    const before='{{'+title+'|campo-desconhecido=preservar}}',whole='Text '+before,at=whole.indexOf(before),finding={start:at,end:whole.length,before,
        reviewGroup:{kind:'unsupported-template-parameter',template:title.toLowerCase(),parameter:'campo-desconhecido'},choices:[{after:'Other'}]};
    assert.deepEqual(api.v221FilterCitationSuggestions(whole,[finding],cfg),[finding]);assertions++;
}
{
    const before='{{Sfnm|1a1=Nome|1y=2020|pp=1}}',finding={start:0,end:before.length,before,
        reviewGroup:{kind:'unsupported-template-parameter',template:'sfnm',parameter:'pp'},choices:[{after:'{{Sfnm|ps=1}}'}]};
    assert.deepEqual(api.v221FilterCitationSuggestions(before,[finding],cfg),[]);assertions++;
}
for(const [id,raw] of [
    ['REF-12','{{Citar IUCN doi|doi=https://doi.org/10.2305/example|versão=3.1}}'],
    ['REF-STUDY-01','{{Citar periódico|título=Obra|número-artigo=123}}'],
    ['REF-STUDY-02','{{Citar web|título=Obra|url=[https://example.invalid rótulo]}}'],
    ['CEX-S01','{{Citar periódico|título=Obra|aspas=Passagem longa a preservar.}}'],
    ['CEX-S02','{{Citar web|título=Obra|urlmorta=https://example.invalid}}'],
    ['CEX-S03','{{Citar web|título=Obra|data_nascimento=2024-01-01}}'],
    ['CEX-S04','{{Citar web|título=Obra|url-status=sim}}'],
    ['CEX-S05','{{Citar livro|título=Obra|chapter-url-access=subscription}}']]){
    const source=full(raw);assert.equal(api.v221CitationPlan(source,cfg).text,source,id);assertions++;
    assert.ok(api.v221CitationResearchInventory(source,cfg).some(item=>item.id===id&&item.preserved&&!item.automatic),id);assertions++;
}
for(const [id,source] of [
    ['REF-STUDY-03',full('{{Citar livro|título=Obra|editora=Editora, 2020, v. 3, p. 12}}')],
    ['CEX-S06',full('{{Citar periódico|título=Obra|arxiv=arXiv:2501.00001}}')],
    ['EXT-ST-01','[[Ficheiro:Exemplo.jpg|miniaturada|Legenda, incluindo abreviação S.A.]]\n'+full('{{Citar livro|título=Obra}}')],
    ['EXT-ST-02-no-time',full('{{Citar episódio|série=Programa|título=Episódio|lengenda=Trecho}}')],
    ['EXT-ST-02-empty-time',full('{{Citar episódio|série=Programa|título=Episódio|tempo=|lengenda=Trecho}}')],
    ['EXT-ST-02-conflicting-caption',full('{{Citar episódio|série=Programa|título=Episódio|tempo=10:00|legenda=Outro trecho|lengenda=Trecho}}')],
    ['EXT-ST-02-empty-target',full('{{Citar episódio|série=Programa|título=Episódio|tempo=10:00|legenda=|lengenda=Trecho}}')],
    ['EXT-ST-02-wrong-consumer',full('{{Citar web|título=Obra|tempo=10:00|lengenda=Trecho}}')],
    ['EXT-ST-03',full('{{Citar mapa|título=Obra|mapurl=https://example.invalid/map|formato-mapa=PDF|mapa=Mapa}}')],
    ['EXT-ST-04','Texto seguido de espaço. <ref>Fonte.</ref>\n\n{{Referências}}']
]){
    const plan=api.v221CitationPlan(source,cfg);
    assert.equal(plan.text,source,id+' scoped preservation');assertions++;
    assert.equal(api.v221CitationPlanProof(source,source,plan,cfg),true,id+' preservation proof');assertions++;
}
module.exports={api,cfg,full,cases,negatives,assertions};
if(require.main===module){
    if(process.argv.includes('--fixture-cases'))process.stdout.write(JSON.stringify({cases:cases.map(row=>({...row,source:full(row.before)})),negatives:negatives.map(before=>({before,source:full(before)}))},null,2)+'\n');
    else if(process.argv.includes('--reference-cases'))process.stdout.write(JSON.stringify({cases:[{id:'missing-name-quote',before:broken,after:api.v221CitationPlan(broken,cfg).text},{id:'curly-name-graph',before:curly,after:api.v221CitationPlan(curly,cfg).text}]},null,2)+'\n');
    else if(process.argv.includes('--native-cases'))process.stdout.write(JSON.stringify({cases},null,2)+'\n');
    else process.stdout.write(JSON.stringify({suite:'citation-contracts',positiveCases:cases.length,negativeCases:negatives.length,assertions,status:'passed',scope:'Actual saved baseline parser plus module under test; full candidate calculation is separate'})+'\n');
}
