'use strict';
const assert=require('node:assert/strict');

function run(api){
 const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false};
 const cite='{{Citar web|URL=https://example.org/a|titulo=Fonte|website=Site|data=18 de novembro 2014|lingua=en}}';
 const fixed='{{Citar web|url=https://example.org/a|título=Fonte|obra=Site|data=18 de novembro de 2014|língua=en}}';
 const reference='<ref name="fonte">'+cite+'</ref>',rows=[];let checks=0,calculations=0;
 const eq=(a,b,message)=>{checks++;assert.equal(a,b,message);},ok=(value,message)=>{checks++;assert(value,message);};
 const adjust=source=>{calculations++;return api.calculate({kind:'adjust',source,originalSource:source,options:cfg});};
 const finish=body=>body+'\n\n{{Referências}}';
 const literals=[['nowiki','<nowiki>','</nowiki>'],['pre','<pre>','</pre>'],['code','<code>','</code>'],['syntaxhighlight','<syntaxhighlight lang="text" data-label="a>b">','</syntaxhighlight>'],['source','<source lang="text">','</source>'],['math','<math>','</math>'],['chem','<chem>','</chem>'],['score','<score>','</score>'],['blockquote','<blockquote>','</blockquote>'],['comment','<!--','-->']];
 for(const[name,open,close]of literals)for(const quote of ['"','“'])for(const placement of ['before','after']){
  const literal=open+'Texto literal '+quote+close;
  const source=finish(placement==='before'?literal+'\nTexto. '+reference:'Texto. '+reference+'\n'+literal),tag=name+':'+quote+':'+placement;
  const scope=api.v2222CitationOwnerScope(source,cfg);
  eq(scope.calls.length,1,tag+' original active citation remains discoverable');
  eq(scope.eligible.length,1,tag+' literal owner cannot quote later source');
  const result=adjust(source);
  ok(result.text.includes(literal),tag+' complete literal bytes preserved');
  ok(result.text.includes(fixed),tag+' actual complete native citation repaired');
  ok(!result.automaticRecovery,tag+' no unrelated-group recovery');
  ok(api.v219AutomaticResultSafety(source,result).accepted,tag+' actual result safety');
  eq(api.preservationAudit(source,result.text,cfg).length,0,tag+' independent full audit');
  eq(api.safeComposition(source,result.text,cfg),'',tag+' independent composition');
  const again=adjust(result.text);eq(again.text,result.text,tag+' stable second apply');
  calculations++;const counted=api.calculate({kind:'final-count',source:result.text,originalSource:source,options:cfg});
  eq(counted.text,result.text,tag+' count cannot alter draft');ok(counted.retainedAdjustments?.exact,tag+' exact endpoint count');
  rows.push({id:tag,passed:true,count:counted.retainedAdjustments.count});
 }
 const table=finish('<nowiki>Literal "</nowiki>\n{| class="wikitable"\n| Texto '+reference+'\n|}');
 const tableResult=adjust(table);ok(tableResult.text.includes(fixed),'literal quote before a complete table does not block citation');ok(tableResult.text.includes('<nowiki>Literal "</nowiki>'),'table preserves literal owner');eq(api.preservationAudit(table,tableResult.text,cfg).length,0,'table source retained');rows.push({id:'citation-in-complete-table',passed:true});
 // These prose controls use a valid date. The existing general date repair
 // has a separate contract; literal HTML controls still contain broken syntax.
 const validReference=reference.replace('18 de novembro 2014','18 de novembro de 2014');
 const protectedBodies=[
  ['real-double-quotation','"Texto '+validReference+' final"'],
  ['real-curly-quotation','“Texto '+validReference+' final”'],
  ['real-guillemets','«Texto '+validReference+' final»'],
  ['emphasized-quotation','\'\'"Texto '+validReference+' final"\'\''],
  ['quotation-around-literal','"Texto <nowiki>"</nowiki> '+validReference+' final"'],
  ['nested-program','{{Programa|valor='+validReference+'}}'],
  ...literals.map(([name,open,close])=>['literal-citation-'+name,open+'" '+reference+' '+close])
 ];
 for(const[id,body]of protectedBodies){
  const source=finish(body),scope=api.v2222CitationOwnerScope(source,cfg);eq(scope.eligible.length,0,id+' no active consumed citation admitted');
  const result=adjust(source);ok(result.text.includes(body),id+' entire quoted or opaque program remains byte exact');
  rows.push({id,passed:true,negative:true});
 }
 const opaque='<ref>{{Citar web|url=https://example.org/a|título=Fonte|x=<nowiki>" '+cite+'</nowiki>}}</ref>';
 const opaqueResult=adjust(finish(opaque));ok(opaqueResult.text.includes(opaque),'unknown field and its nested citation stay byte exact');rows.push({id:'literal-program-in-opaque-field',passed:true,negative:true});
 const disabled=finish('<nowiki>"</nowiki>\n'+validReference);calculations++;
 const disabledResult=api.calculate({kind:'adjust',source:disabled,originalSource:disabled,options:{...cfg,citations:false}});ok(disabledResult.text.includes(cite.replace('18 de novembro 2014','18 de novembro de 2014')),'disabled citations remain disabled');rows.push({id:'disabled-citations',passed:true,negative:true});
 return{suite:'literal-owner-quotes-do-not-change-citation-scope',version:api.version,status:'passed',cases:rows.length,checks,calculations,negativeCases:rows.filter(r=>r.negative).length,rows,contextProjectionOnly:true,originalGuardsRetained:true,networkRequests:0,wikipediaWrites:0};
}
module.exports={run};
if(require.main===module)console.log(JSON.stringify(run(require('./harness.cjs').load())));
