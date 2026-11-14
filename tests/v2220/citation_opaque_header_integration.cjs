'use strict';
const assert=require('node:assert/strict'),{api:a,cfg,sourceSha}=require('./harness.cjs');let checks=0,calculations=0,cases=0;
const eq=(x,y,m)=>{checks++;assert.deepEqual(x,y,m)};
for(const [from,to]of [['cite book','Citar livro'],['Cite book','Citar livro'],['cite journal','Citar periódico'],['Cite journal','Citar periódico']]){
 const body='Consulte: {{'+from+'|título=Fonte|url={{google books|id=ABC|plainurl=y}}|ano=2001|língua=en}}',s='Texto.<ref name="fonte">'+body+'</ref>\nOutra passagem.<ref name="fonte"/>\n{{Referências}}\n',o={...cfg,pageTitle:'Tema'},expected=body.replace('{{'+from,'{{'+to),r=a.calculate({kind:'adjust',source:s,originalSource:s,options:o});calculations++;cases++;
 eq(a.v219AutomaticResultSafety(s,r).accepted,true,'normal action accepted');eq(r.text.includes(expected),true,'native redirect header applied with exact opaque args/prose');eq(a.preservationAudit(s,r.text,o),[],'complete audit');eq(a.safeComposition(s,r.text,o),'','complete composition');
 for(const [id,m]of [['nested-url',r.text.replace('id=ABC','id=OTHER')],['language',r.text.replace('língua=en','língua=fr')],['name',r.text.replace('name="fonte"','name="other"')],['group',r.text.replace('name="fonte"','group="other" name="fonte"')]])eq(a.preservationAudit(s,m,o).length>0||!!a.safeComposition(s,m,o),true,id+' cannot hide behind header proof');
 const repeated=a.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:o});calculations++;eq(repeated.text,r.text,'normal action idempotent');
}
console.log(JSON.stringify({suite:'v2220-source-bound-opaque-citation-header-whole-action',sourceSha,cases,checks,calculations,passed:true,wikipediaWrites:0}));
