'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const files=process.argv.slice(2);if(!files.length)throw new Error('Provide built bundle paths.');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),report={kind:'complete-action-citation-regression',status:'passed',cases:[],checks:0,networkRequests:0,wikipediaWrites:0};
for(const file of files){const api=require(path.resolve(file)),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false},bundle=path.basename(file),ok=(v,m)=>{report.checks++;assert.ok(v,m);};
 const source=body=>'Um fato documentado.<ref>'+body+'</ref>\n\n{{Referências}}\n';
 const positive=[
 ['book-total',source('{{Citar livro|titulo=Obra de controle|páginas-total=342|pagina=162}}'),'total-páginas=342','páginas-total=342'],
 ['lay-alias',source('{{Citar livro|titulo=Obra de controle|layurl=https://example.invalid/documento}}'),'lay-url=https://example.invalid/documento','layurl='],
 ['tweet-author',source('{{Citar tweet|first=Ana Maria|last=Silva|usuario=conta|numero=123|titulo=Texto de controle}}'),'autor=Ana Maria Silva','first='],
 ['literal-title-pipe',source('{{Citar web|url=https://example.invalid/|titulo=Título | Ciência em foco |data=2024}}'),'Título {{!}} Ciência em foco','| Ciência em foco |'],
 ['harvard-page',source('{{harvnb|Autoria|2024|page=12}}')+'\n* {{Citar livro|autor=Autoria|ano=2024|titulo=Obra|ref=harv}}\n','p=12','page=12'],
 ['double-ref-opening','Um fato.<ref name="a" <ref>Fonte de controle.</ref>\n{{Referências}}','<ref name="a">Fonte de controle.</ref>','<ref name="a" <ref>'],
 ['adjacent-duplicate-ref-close','Um fato.<ref>Fonte de controle.</ref></ref>\n{{Referências}}','Um fato.<ref>Fonte de controle.</ref>','</ref></ref>']
 ,['legacy-joined-ref-name','Texto.<refname="origem">Fonte literal.</ref>\n\n{{Referências}}','<ref name="origem">Fonte literal.</ref>','<refname=']
 ,['legacy-missing-url-equals',source('{{Citar web|título=Fonte fictícia|url http://example.invalid/fonte}}'),'|url=','{{!}}url']
 ,['legacy-missing-accessdate-equals',source('{{Citar web|título=Fonte fictícia|acessodata 5 março 2001}}'),'|acessodata=','{{!}}acessodata']
 ];
 for(const [id,input,needle,removed]of positive){const out=api.calculate({kind:'adjust',source:input,options:cfg});ok(out.text.includes(needle),id+' result missing '+needle+' '+JSON.stringify(out.localCompositionSafety));ok(!out.text.includes(removed),id+' old syntax remains');ok(out.localCompositionSafety?.accepted!==false,id+' preservation refused');ok(api.calculate({kind:'adjust',source:out.text,options:cfg}).text===out.text,id+' action not idempotent');report.cases.push({id,bundle,status:'passed',sourceSha256:sha(input),appliedSha256:sha(out.text),rules:out.changes.map(x=>x.id),helperInjection:false});}
 const hidden='Um fato<ref name="a" group="nota"/>\n{{Colunas-lista|2|2={{Nota de rodapé|nome=a|1=Explicação explícita.}}}}\n{{Notas e referências}}';
 const out=api.calculate({kind:'adjust',source:hidden,options:cfg});ok(!out.audit.some(f=>f.code==='missing-definition'),'valid hidden definition flagged');ok(!out.warnings.some(w=>/Referência "a" sem definição/.test(w)),'old hidden-definition warning remains');report.cases.push({id:'whole-action-note-reachability',bundle,status:'passed',helperInjection:false});
 const note='Um fato.<ref group="nota">Aqui, "termo" significa uma explicação.</ref>\n{{Notas e referências}}';
 const noted=api.calculate({kind:'adjust',source:note,options:cfg});ok(!noted.suggestions.some(s=>s.label==='Formatar a referência textual, confira autor e título'),'false note bibliography suggestion remains');report.cases.push({id:'whole-action-note-suggestion-filter',bundle,status:'passed',helperInjection:false});
 const ps=source('{{harvnb|Autoria|2024|ps=.}}'),pst=api.calculate({kind:'adjust',source:ps,options:cfg});ok(!pst.suggestions.some(s=>s.reviewGroup?.template==='harvnb'&&s.reviewGroup?.parameter==='ps'),'wrong ps alternatives remain');ok(pst.text.includes('|ps=.'),'punctuation parameter mutated');report.cases.push({id:'whole-action-ps-semantic-filter',bundle,status:'passed',helperInjection:false});
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');
