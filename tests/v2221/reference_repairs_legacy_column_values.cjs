'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{api,cfg,sha}=require('./reference_repairs_harness.cjs').load();let checks=0;const rows=[];
function columns(id,args,removed){const source='Texto.<ref>Fonte.</ref>\n\n{{Referências|'+args+'}}',plans=api.v211ReferenceColumnPlans(source,cfg,true);checks++;assert.equal(plans.length>0,removed,id);if(!removed){checks++;assert.equal(plans.length,0,id+' source remains untouched');}else{checks++;assert.equal(plans[0].after,'{{Referências}}',id+' only known presentation is removed');}rows.push({id,sourceSha256:sha(source),plans:plans.length});return source;}
for(const key of ['col','cols','colunas','colwidth','largcol','larguracol'])columns('known-legacy-key-'+key,key+'=2',true);
for(const value of ['30em','30px','2.5em','auto',' 2 ',''])columns('known-presentation-'+rows.length,'colwidth='+value,true);
columns('matching-count-aliases','col=2|cols=2',true);columns('independent-count-and-width','col=2|colwidth=30em',true);
for(const [id,args]of [
 ['textual-bibliography','col=Autora. Obra. Editora, 2020.'],
 ['plain-url','col=https://example.org/fonte/'],
 ['url-in-bibliography','col=Autora. Obra. Disponível em: https://example.org/fonte/. Acesso em: 2 de janeiro de 2026.'],
 ['literal-reference','col=<ref name="A">Fonte.</ref>'],
 ['template-body','col={{Citar livro|titulo=Obra|ano=2020}}'],
 ['comment','col=2<!-- texto preservado -->'],
 ['line-feed','col=2\n'],['unknown-value','col=duas'],['unknown-unit','col=30rem'],
 ['conflicting-count-aliases','col=2|colunas=3'],['conflicting-width-aliases','colwidth=30em|largcol=40em'],
 ['duplicate-key','col=2|col=2'],['unsupported-columns-key','columns=2'],['native-title-is-not-width','1=30em']
])columns(id,args,false);
const bank='<ref name="A">{{Citar web|titulo=Fonte|url=https://example.org/banco/}}</ref>',bankSource='Texto.<ref name="A" />\n\n{{Referências|col=2|refs='+bank+'}}',bankPlan=api.v211ReferenceColumnPlans(bankSource,cfg,true);checks++;assert.equal(bankPlan.length,1,'Known presentation may be removed beside a functional bank');checks++;assert(bankPlan[0].after.includes('refs='+bank),'Literal bank and all URLs are preserved');
const nativeTitle=api.v2221ReferencePlan('Texto.<ref>Fonte.</ref>\n\n{{Referências|30em}}',cfg);checks++;assert(nativeTitle.text.includes('{{Referências|30em}}'),'Native title parameter is preserved');const imported=api.v2221ReferencePlan('Texto.<ref>Fonte.</ref>\n\n{{Reflist|30em}}',cfg);checks++;assert(imported.text.includes('{{Referências}}'),'Imported Reflist width has its separate contract');
const citation='{{Citar livro|ultimo=Pereira|titulo=Obra|ano=2020}}',details='<ref name="B" details="&quot;Texto intacto.&quot;" />',col='Autora. Obra. https://example.org/fonte/. Acesso em: 2 de janeiro de 2026.',source="'''Tema''' é um exemplo.<ref name=\":0\">"+citation+'</ref> Outra frase.<ref name=":0" /> Fonte.<ref name="B">Fonte.</ref> Última. '+details+'\n\n{{Referências|col='+col+'}}\n\n== Leitura adicional ==\n* Obra. https://example.org/fonte/.\n{{Widget}}',result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
checks++;assert(result.text.includes('|col='+col+'}}'),'Textual column value is byte-exact');checks++;assert(result.text.includes('Última.'+details),'Independent punctuation applies on the first click');checks++;assert(result.text.includes('name=":0"'),'Opaque name graph is not rekeyed');checks++;assert.equal(JSON.parse(result.localCompositionSafety.optionsSnapshot).references,true,'References need no group-wide recovery');checks++;assert(api.v219AutomaticResultSafety(source,result).accepted,'Automatic guard accepts actual retained text');checks++;assert.equal(api.preservationAudit(source,result.text,cfg).length,0,'No URL or content loss');checks++;assert(!api.safeComposition(source,result.text,cfg),'Independent composition remains strict');
const again=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg});checks++;assert.equal(again.text,result.text,'Complete action is idempotent');checks++;assert.equal(api.v211RetainedAdjustments(result.text,again.text,[],cfg).count,0,'No phantom repeat adjustments');
const report={suite:'legacy-reference-column-values-remain-source-bound',passed:true,cases:rows.length+4,checks,rows,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,cases:report.cases,checks}));
