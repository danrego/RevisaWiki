'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const load=require('./citation_loader.cjs'),args=process.argv.slice(2),preview=args.includes('--allow-preview'),files=args.filter(x=>!x.startsWith('--'));
if(!files.length)throw new Error('Provide the complete bundle path.');
const report={kind:'finite-native-citation-regression',status:'passed',checks:0,cases:[],networkRequests:0,wikipediaWrites:0};
for(const file of files){const {api,preview:injected}=load(file,preview),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',contentModel:'wikitext',autoPreview:false},bundle=path.basename(file);
 const eq=(a,b)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b));},ok=x=>{report.checks++;assert.ok(x);};
 const run=(id,source,expected,options={})=>{const c={...cfg,...options},plan=api.v220CitationPlan(source,c);eq(plan.text,expected);ok(api.v220CitationPlanProof(source,expected,plan,c));eq(api.v220CitationPlan(expected,c).text,expected);ok(!api.v220CitationPlanProof(source,expected+'x',plan,c));report.cases.push({id,bundle,status:'passed',helperInjection:injected,edits:plan.edits.length});return plan;};
 run('harvard-page','{{harvnb|Autoria|2024|page=12}}','{{harvnb|Autoria|2024|p=12}}');
 run('harvard-pages','{{Harvnb|Autoria|2024|pages=12–16}}','{{Harvnb|Autoria|2024|pp=12–16}}');
 run('harvard-preserve-ps','{{harvnb|Autoria|2024|ps=.}}','{{harvnb|Autoria|2024|ps=.}}');
 run('harvard-conflict','{{harvnb|Autoria|2024|pages=12–16|p=3}}','{{harvnb|Autoria|2024|pages=12–16|p=3}}');
 run('harvard-other-family','{{sfn|Autoria|2024|pages=12–16}}','{{sfn|Autoria|2024|pages=12–16}}');
 run('total-pages-and-locator','{{Citar livro|titulo=Obra|páginas-total=342|pagina=162}}','{{Citar livro|titulo=Obra|total-páginas=342|pagina=162}}');
 run('total-pages-conflict','{{Citar livro|titulo=Obra|páginas-total=342|total-páginas=300}}','{{Citar livro|titulo=Obra|páginas-total=342|total-páginas=300}}');
 run('equivalent-lay-alias','{{citar livro|titulo=Obra|layurl=https://example.invalid/r?q=a#X}}','{{citar livro|titulo=Obra|lay-url=https://example.invalid/r?q=a#X}}');
 run('lay-conflict','{{citar livro|titulo=Obra|layurl=https://example.invalid/|lay-url=https://example.invalid/outro}}','{{citar livro|titulo=Obra|layurl=https://example.invalid/|lay-url=https://example.invalid/outro}}');
 run('tweet-author','{{Citar tweet|first=Ana Maria|last=Silva|usuario=conta|numero=123|titulo=Texto}}','{{Citar tweet|autor=Ana Maria Silva|usuario=conta|numero=123|titulo=Texto}}');
 run('tweet-preserve-existing-author','{{Citar tweet|first=Ana|last=Silva|autor=Entidade}}','{{Citar tweet|first=Ana|last=Silva|autor=Entidade}}');
 run('tweet-preserve-last-first','{{Citar tweet|last=Silva|first=Ana|usuario=conta}}','{{Citar tweet|autor=Ana Silva|usuario=conta}}');
 run('title-literal-pipe','{{Citar web|url=https://example.invalid/|titulo=Título | Ciência em foco |data=2024}}','{{Citar web|url=https://example.invalid/|titulo=Título {{!}} Ciência em foco |data=2024}}');
 run('title-no-positional-multi','{{Citar web|titulo=Título|Parte|Outra}}','{{Citar web|titulo=Título|Parte|Outra}}');
 run('title-unrelated-positional','{{Citar web|titulo=Título|url=https://example.invalid/|Parte}}','{{Citar web|titulo=Título|url=https://example.invalid/|Parte}}');
 run('literal-example','<nowiki>{{Citar livro|titulo=Obra|páginas-total=342}}</nowiki>','<nowiki>{{Citar livro|titulo=Obra|páginas-total=342}}</nowiki>');
 run('comment-example','<!-- {{harvnb|Autoria|2024|page=12}} -->','<!-- {{harvnb|Autoria|2024|page=12}} -->');
 run('quotation-example','"{{harvnb|Autoria|2024|page=12}}"','"{{harvnb|Autoria|2024|page=12}}"');
 run('discussion-preserved','{{harvnb|Autoria|2024|page=12}}','{{harvnb|Autoria|2024|page=12}}',{namespaceNumber:1,discussionPage:true});
 run('ref-double-opening','Texto.<ref name="fonte-a" <ref>Documento A.</ref>\n{{Referências}}','Texto.<ref name="fonte-a">Documento A.</ref>\n{{Referências}}');
 run('ref-adjacent-duplicate-closer','Texto.<ref>Fonte de controle.</ref></ref>\n{{Referências}}','Texto.<ref>Fonte de controle.</ref>\n{{Referências}}');
 run('ref-isolated-closer-preserved','Texto sem abertura.</ref>\n{{Referências}}','Texto sem abertura.</ref>\n{{Referências}}');
 run('ref-adjacent-preserved','Texto<ref>Fonte A.</ref><ref>Fonte B.</ref>','Texto<ref>Fonte A.</ref><ref>Fonte B.</ref>');
 run('ref-literal-preserved','<pre>Texto.</ref></pre>','<pre>Texto.</ref></pre>');
 run('ref-nested-preserved','Texto<ref>A<ref>B</ref>C</ref>','Texto<ref>A<ref>B</ref>C</ref>');
 run('harvard-two-locators-preserved','{{harvnb|Autoria|2024|page=3|pages=3–7}}','{{harvnb|Autoria|2024|page=3|pages=3–7}}');
 run('title-missing-field-separator-not-guessed','{{Citar web|titulo=Título|acessodata}}','{{Citar web|titulo=Título|acessodata}}');
 run('title-single-external-url-not-joined','{{Citar web|titulo=Título|https://example.invalid/}}','{{Citar web|titulo=Título|https://example.invalid/}}');
 run('tweet-source-author-alias-conflict','{{Citar tweet|first=Ana|last=Silva|primeiro=Beatriz}}','{{Citar tweet|first=Ana|last=Silva|primeiro=Beatriz}}');
 run('numeric-malformed-name-preserved','Texto.<ref name="123" <ref>Fonte.</ref>','Texto.<ref name="123" <ref>Fonte.</ref>');
 for(const wrapper of [text=>'<syntaxhighlight lang="wikitext">'+text+'</syntaxhighlight>',text=>'```wikitext\n'+text+'\n```',text=>'<math>'+text+'</math>',text=>'<code>'+text+'</code>']){
  const example=wrapper('{{Citar livro|titulo=Obra|páginas-total=342}}');run('literal-container-'+report.cases.length,example,example);
 }
 for(const [flag,source] of [['citations','{{Citar livro|titulo=Obra|páginas-total=342}}'],['automaticParameterNames','{{harvnb|Autoria|2024|page=3}}'],['references','Texto.</ref>'],['authors','{{Citar tweet|first=Ana|last=Silva}}'],['citationRepairs','{{Citar web|titulo=Título|Publicação}}']])run('option-off-'+flag,source,source,{[flag]:false});
 const samples=[
 ['blockquote','<blockquote>Texto<ref name="a">Fonte A.</ref></blockquote> Depois<ref name="a"/>','a',''],
 ['columns-tag','Texto<ref name="a"/>\n{{Colunas-lista|2|<ref name="a">Fonte A.</ref>}}','a',''],
 ['columns-note','Texto<ref name="a" group="nota"/>\n{{Colunas-lista|2|2={{Nota de rodapé|nome=a|1=Uma nota explicativa.}}}}','a','nota'],
 ['efn-name','{{Efn|name=a|Uma nota explicativa.}}','a','lower-alpha'],
 ['refn-name','{{Refn|name=a|group=n|Uma nota explicativa.}}','a','n'],
 ['unknown-owner','{{Se condição|1=<ref name="a">Fonte A.</ref>}}','a',null],
 ['numeric-name','{{Refn|name=123|1=Nota explícita.}}','123',null],
 ['comment-only-note','{{Refn|name=a|1=<!-- comentário -->}}','a',null],
 ['column-body-overridden','{{Colunas-lista|1=<ref name="a">Fonte.</ref>|Outro texto}}','a',null],
 ['commander-body','{{Info/Conflito militar|nome=Conflito de controle|comandante2=Nome{{Refn|name=a|group=n|Nota explícita.}}}}','a','n'],
 ['commander-duplicate','{{Info/Conflito militar|nome=Conflito de controle|comandante2={{Refn|name=a|Nota explícita.}}|comandante2=}}','a',null],
 ['empty-note','{{Refn|name=a|1=}}','a',null],
 ['unknown-empty-content','{{Refn|name=a|1={{Modelo dinâmico}}}}','a',null],
 ['literal-note','<nowiki>{{Refn|name=a|1=Uma nota.}}</nowiki>','a',null]
 ];
 for(const [id,source,name,group]of samples){const defs=api.v220CitationDefinitionInventory(source,cfg);eq(defs.some(d=>d.name===name&&d.group===group),group!==null);const f={code:'missing-definition',message:'Referência "'+name+'" sem definição'+(group?', grupo '+group:'')+'.'};eq(api.v220FilterReferenceFindings(source,[f],cfg).length,group===null?1:0);report.cases.push({id:'definition-'+id,bundle,status:'passed',helperInjection:injected});}
 const legacy='Referência "a" sem definição no texto comum. Ela pode estar em uma lista ou predefinição.';
 for(const [id,source,remaining]of [
  ['group-omitted-confirmed','Texto<ref name="a" group="nota"/>\n{{Colunas-lista|2|2={{Nota de rodapé|nome=a|1=Uma nota explícita.}}}}',0],
  ['group-omitted-missing-default','Texto<ref name="a"/>\n{{Nota de rodapé|nome=a|1=Uma nota explícita.}}',1],
  ['group-omitted-missing-second','Texto<ref name="a" group="nota"/><ref name="a" group="b"/>\n{{Nota de rodapé|nome=a|1=Uma nota explícita.}}',1],
  ['group-omitted-conflicting-definition','Texto<ref name="a" group="nota"/>\n{{Nota de rodapé|nome=a|1=Primeira nota.}}{{Nota de rodapé|nome=a|1=Segunda nota.}}',1],
  ['group-omitted-literal-example','<nowiki><ref name="a" group="nota"/></nowiki>\n{{Nota de rodapé|nome=a|1=Uma nota explícita.}}',1]
 ]){eq(api.v220FilterReferenceFindings(source,[legacy],cfg).length,remaining);report.cases.push({id,bundle,status:'passed',helperInjection:injected});}
 const punctuationGroup='Texto<ref name="a" group="n.outro"/>\n{{Refn|name=a|group=n|Nota explícita.}}',punctuationWarning={code:'missing-definition',message:'Referência "a" sem definição, grupo n.outro.'};
 eq(api.v220FilterReferenceFindings(punctuationGroup,[punctuationWarning],cfg),[punctuationWarning]);
 report.cases.push({id:'group-punctuation-not-truncated',bundle,status:'passed',helperInjection:injected});
 const note={before:'Aqui, "termo" quer dizer uma explicação.',label:'Formatar a referência textual, confira autor e título',choices:[{after:'{{Citation|autor=Aqui,|título=termo}}'}]},ps={before:'{{harvnb|Obra|2024|ps=.}}',label:'Parâmetro desconhecido',reviewGroup:{kind:'unsupported-template-parameter',template:'harvnb',parameter:'ps'},choices:[{after:'{{harvnb|Obra|2024|pp=.}}'}]},other={before:'{{harvnb|Obra|2024|p=10}}',label:'Outra sugestão'};
 eq(api.v220FilterCitationSuggestions('',[note,ps,other],cfg),[other]);report.cases.push({id:'suggestion-semantic-filter',bundle,status:'passed',helperInjection:injected});
 for(let i=1;i<=80;i++){const value=String(i),s='{{harvnb|Nome de controle|2024|page='+value+'}}';run('property-locator-'+i,s,s.replace('page=','p='));}
 const combined='Texto<ref name="livro">{{Citar livro|titulo=Obra|páginas-total=342|pagina=162|layurl=https://example.invalid/resumo}}</ref>\nOutro fato<ref>{{harvnb|Autoria|2024|pages=12–14|Ref=obra|loc=capítulo 1}}</ref>\n{{Referências}}',
  combinedExpected=combined.replace('páginas-total=','total-páginas=').replace('layurl=','lay-url=').replace('pages=','pp=');
 const composition=run('composition-separate-calls',combined,combinedExpected);eq(composition.changes.map(row=>row.id).sort(),['v220CitationDeprecatedAlias','v220CitationTotalPages','v220HarvardLocator'].sort());eq(composition.edits.length,2);
 const staleProof=structuredClone(composition);staleProof.edits[0].proof.before='Texto diferente';ok(!api.v220CitationPlanProof(combined,combinedExpected,staleProof,cfg));
 for(const [id,s]of [
  ['malformed-name-definition-conflict','<ref name="a" <ref>Fonte A.</ref>\n<ref name="a">Fonte B.</ref>'],
  ['malformed-nested-joined-owner','<ref name="a" <ref>Fonte <refname="b">Outra fonte.</ref></ref>'],
  ['legacy-joined-ref-name','Texto.<refname="a">Fonte A.</ref>'],
  ['legacy-joined-ref-name-uppercase','Texto.<REFNAME="a">Fonte A.</REF>'],
  ['uncertain-joined-ref-group','Texto.<refgroup="nota">Fonte A.</ref>'],
  ['uncertain-joined-ref-attributes','Texto.<refname="a" class="nota">Fonte A.</ref>'],
  ['uncertain-incomplete-ref-header','Texto.<ref name="a" Fonte A.</ref>'],
  ['malformed-opening-unknown-attribute','<ref name="a" class="nota" <ref>Fonte.</ref>'],
  ['orphan-in-template','{{Modelo de controle|texto=Explicação.</ref>}}'],
  ['orphan-in-table','{|\n| Texto.</ref>\n|}'],
  ['tweet-duplicate-first','{{Citar tweet|first=Ana|first=Beatriz|last=Silva}}'],
  ['tweet-dynamic-name','{{Citar tweet|first={{Nome}}|last=Silva}}'],
  ['book-total-nonnumeric','{{Citar livro|titulo=Obra|páginas-total=cerca de 300}}'],
  ['alias-other-family','{{Citar web|titulo=Fonte|layurl=https://example.invalid/resumo}}'],
  ['pipe-has-explicit-positional','{{Citar web|1=Argumento|titulo=Título|Publicação}}'],
  ['pipe-two-title-aliases','{{Citar web|titulo=Título|título=Outro|Publicação}}']
 ])run(id,s,s);
 for(const [i,fragment]of ['url http://example.invalid/fonte','URL https://example.invalid/fonte','acessodata 5 março 2001','access-date 5 March 2001','fechaacceso 5 marzo 2001','consulté le 5 mars 2001','zugriff 5 März 2001','dataaccesso 5 marzo 2001','author2 Pessoa de controle','ISBN 978-0-0000-0000-0','2024, pp. 12–14','Link https://example.invalid/fonte','Publicação'].entries()){
  const s='{{Citar web|título=Fonte fictícia|'+fragment+'}}';run('pipe-incomplete-parameter-'+i,s,s);
 }
 for(const [i,name]of ['Ana Maria','João','Érica','Álvaro','Li','Anne-Marie','D\'Ana','M. A.'].entries()){
  const s='{{Citar tweet|first='+name+'|last=Silva|data=2024-01-02|usuario=conta|numero=123|url=https://example.invalid/publicacao|titulo=Texto|arquivourl=https://example.invalid/arquivo|arquivodata=2024-02-03}}';
  run('property-tweet-preservation-'+i,s,s.replace('first='+name+'|last=Silva','autor='+name+' Silva'));
 }
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');
