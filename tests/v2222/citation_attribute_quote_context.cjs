'use strict';
const assert=require('node:assert/strict');

function run(api){
 const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-11-21',numericRefNames:false,neutralReferenceNames:false};
 const body='{{Citar web|url=https://example.invalid/fonte|titulo=Fonte|website=Sítio de exemplo}}',fixed='{{Citar web|url=https://example.invalid/fonte|título=Fonte|obra=Sítio de exemplo}}';
 const rows=[];let checks=0,calculations=0;
 const eq=(x,y,label)=>{checks++;assert.equal(x,y,label);},ok=(x,label)=>{checks++;assert(x,label);};
 const finish=text=>text+'\n\n{{Referências}}\n';
 const adjust=(source,options=cfg)=>{calculations++;return api.calculate({kind:'adjust',source,originalSource:source,options});};
 function endpoint(id,source,expected,count=2){
  const first=adjust(source);eq(first.text,expected,id+' complete authored endpoint');
  ok(!first.automaticRecovery,id+' complete result needs no restricted recovery');
  eq(adjust(first.text).text,expected,id+' second application is stable');
  eq(api.preservationAudit(source,first.text,cfg).length,0,id+' independent preservation');
  eq(api.safeComposition(source,first.text,cfg),'',id+' independent composition');
  ok(api.v219AutomaticResultSafety(source,first).accepted,id+' ordinary automatic guard');
  calculations++;const counted=api.calculate({kind:'final-count',source:first.text,originalSource:source,options:cfg});
  eq(counted.text,expected,id+' counting retains output');ok(counted.retainedAdjustments?.exact,id+' exact final count');
  eq(counted.retainedAdjustments.count,count,id+' authored adjustment count');rows.push({id,passed:true});
 }
 for(const name of ['fonte','0',':0','fonte-2','fonte:3']){
  const source=finish('Afirmação".<ref name="'+name+'">'+body+'</ref> Outra.<ref name="'+name+'" />');
  endpoint('closing-prose-quote-before-final-reference-attribute-'+name,source,source.replace(body,fixed));
 }
 for(const prefix of ['Afirmação','2000','Expressão)','Resultado!']){
  const source=finish(prefix+'".<ref name="fonte">'+body+'</ref> Outra.<ref name="fonte" />');
  const plan=api.v2222CitationFieldsPlan(source,cfg);eq(plan.text,source.replace(body,fixed),prefix+' literal citation owner remains readable');
  ok(api.v2222CitationFieldsProof(source,plan.text,plan,cfg),prefix+' original field proof');
  ok(api.v2222CitationOwnerContext(source).view.includes('<ref name="fonte" />'),prefix+' attribute quote stays exact in read view');
  rows.push({id:'component-closing-prose-'+prefix,passed:true});
 }
 for(const tag of ['<span title="rótulo" />','<span title="a > b" />','<span title="a < b" />','<span data-x="rótulo" title="outro" />','<span title=\'rótulo\' />']){
  const source=finish('Afirmação".<ref>'+body+'</ref> '+tag),plan=api.v2222CitationFieldsPlan(source,cfg);
  eq(plan.text,source.replace(body,fixed),tag+' complete tag has an independent attribute owner');
  ok(api.v2222CitationFieldsProof(source,plan.text,plan,cfg),tag+' native citation proof');
  ok(api.v2222CitationOwnerContext(source).view.includes(tag),tag+' complete attribute bytes retained in read view');
  rows.push({id:'complete-html-tag-'+rows.length,passed:true});
 }
 const dates='{{Citar periódico|titulo=Artigo|jornal=Revista|ano=2010|mes=Outubro|acessadoem=26 de Junho de 2017}}';
 const normalizedDates='{{Citar periódico|título=Artigo|obra=Revista|data=outubro de 2010|acessodata=26 de junho de 2017}}';
 const dated=finish('Afirmação".<ref name="fonte">'+dates+'</ref> Outra.<ref name="fonte" />');
 endpoint('coupled-month-year-and-access-date-through-attribute-boundary',dated,dated.replace(dates,normalizedDates),7);
 for(const quote of [['"','"'],['“','”'],['«','»']]){
  const quoted=quote[0]+'Trecho <ref name="fonte">'+body+'</ref> preservado'+quote[1],source=finish(quoted+' Outra.<ref name="fonte" />');
  const result=adjust(source);ok(result.text.includes(quoted),'genuine paired quotation bytes remain exact');
  ok(!result.text.includes(fixed),'genuine quotation does not acquire normalized fields');
  rows.push({id:'preserve-genuine-paired-quotation-'+rows.length,passed:true,negative:true});
 }
 for(const [open,close]of [['<nowiki>','</nowiki>'],['<pre>','</pre>'],['<code>','</code>'],['<syntaxhighlight lang="wikitext">','</syntaxhighlight>'],['<!--','-->'],['<math>','</math>']]){
  const literal=open+'Afirmação".<ref name="fonte">'+body+'</ref> Outra.<ref name="fonte" />'+close,source=finish(literal),result=adjust(source);
  ok(result.text.includes(literal),open+' opaque bytes retained');ok(!result.text.includes(fixed),open+' native-looking citation remains opaque');
  rows.push({id:'preserve-literal-attribute-quotation-'+rows.length,passed:true,negative:true});
 }
 for(const attribute of ['title','data-example']){
  const tag='<span '+attribute+'=\''+body+'\'>Texto</span>',source=finish(tag),plan=api.v2222CitationFieldsPlan(source,cfg);
  eq(plan.text,source,attribute+' citation-looking attribute is not a native reference');
  eq(plan.edits.length,0,attribute+' attribute program has no field edits');
  rows.push({id:'preserve-citation-shaped-attribute-'+attribute,passed:true,negative:true});
 }
 const source=finish('Afirmação".<ref name="fonte">'+body+'</ref> Outra.<ref name="fonte" />'),expected=source.replace(body,fixed);
 for(const [id,target]of [['source-url',expected.replace('example.invalid/fonte','example.invalid/other')],['source-title',expected.replace('|título=Fonte','|título=Outra fonte')],['named-reuse',expected.replace('Outra.<ref name="fonte" />','Outra.<ref name="outro" />')]]){
  ok(api.preservationAudit(source,target,cfg).length>0,id+' arbitrary content change remains rejected');
  ok(api.safeComposition(source,target,cfg)!=='',id+' arbitrary composition remains rejected');
  rows.push({id:'reject-unrelated-mutation-'+id,passed:true,negative:true});
 }
 const disabled=adjust(source,{...cfg,citations:false});ok(disabled.text.includes(body),'disabled citation option remains disabled');
 rows.push({id:'disabled-citation-adjustments',passed:true,negative:true});
 return{suite:'citation-attribute-and-prose-quotation-owner-boundaries',version:api.version,status:'passed',cases:rows.length,checks,calculations,negativeCases:rows.filter(x=>x.negative).length,rows,sourceGuardExemptionsAdded:0,networkRequests:0,wikipediaWrites:0};
}
module.exports={run};
if(require.main===module)console.log(JSON.stringify(run(require('./harness.cjs').load())));
