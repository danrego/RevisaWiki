'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const load=require('./citation_loader.cjs');
const files=process.argv.slice(2);if(!files.length)throw new Error('Provide frozen bundle paths.');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const report={kind:'adjacent-duplicate-reference-boundary-regression',status:'passed',checks:0,cases:[],networkRequests:0,wikipediaWrites:0};
for(const file of files){
 const {api,preview:injected}=load(file),bundle=path.basename(file),runtimeSha256=sha(fs.readFileSync(file));
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false};
 const eq=(actual,expected,message)=>{report.checks++;assert.equal(actual,expected,message);},ok=(value,message)=>{report.checks++;assert.ok(value,message);};
 const native=JSON.parse(fs.readFileSync(path.join(__dirname,'citation_adjacent_native.json'),'utf8'));
 eq(native.status,'passed','native qualification unresolved');
 eq(JSON.stringify(native.observations.before.referenceIds),JSON.stringify(native.observations.after.referenceIds),'native reference IDs differ');
 eq(JSON.stringify(native.observations.before.referenceHrefs),JSON.stringify(native.observations.after.referenceHrefs),'native reference associations differ');
 eq(api.v220CitationPlan(native.sources.before,cfg).text,native.sources.after,'captured native source pair not reproduced');
 const nativeAction=api.calculate({kind:'adjust',source:native.sources.before,options:cfg});
 eq(nativeAction.text,native.sources.after.replace('<ref name="a"/>','<ref name="a" />'),'native source pair changed outside the duplicate closer and inherited self-closing spacing');
 report.cases.push({id:'native-note-id-and-reuse-preservation',bundle,runtimeSha256,status:'passed',helperInjection:injected,sourceSha256:sha(native.sources.before),appliedSha256:sha(nativeAction.text)});
 const cases=[
  ['anonymous-adjacent','Texto<ref>Fonte de controle.</ref></ref>','Texto<ref>Fonte de controle.</ref>'],
  ['named-adjacent','Texto<ref name="fonte-a">Fonte de controle.</ref></ref>','Texto<ref name="fonte-a">Fonte de controle.</ref>'],
  ['grouped-adjacent','Texto<ref name="fonte-a" group="nota">Fonte de controle.</ref></ref>','Texto<ref name="fonte-a" group="nota">Fonte de controle.</ref>'],
  ['native-citation-adjacent','Texto<ref>{{Citar web|url=https://example.invalid/|titulo=Fonte de controle}}</ref></ref>','Texto<ref>{{Citar web|url=https://example.invalid/|titulo=Fonte de controle}}</ref>'],
  ['three-closer-chain','Texto<ref>Fonte de controle.</ref></ref></ref>','Texto<ref>Fonte de controle.</ref>'],
  ['solitary-closer-prose','A etiqueta </ref> encerra uma referência.'],
  ['solitary-closer-start','</ref> é uma etiqueta de fechamento.'],
  ['nonadjacent-space','Texto<ref>Fonte de controle.</ref> </ref>'],
  ['nonadjacent-tab','Texto<ref>Fonte de controle.</ref>\t</ref>'],
  ['nonadjacent-newline','Texto<ref>Fonte de controle.</ref>\n</ref>'],
  ['nonadjacent-comment','Texto<ref>Fonte de controle.</ref><!-- comentário --></ref>'],
  ['nonadjacent-prose','Texto<ref>Fonte de controle.</ref> Explicação.</ref>'],
  ['selfclosing-reference','Texto<ref name="a"/></ref>'],
  ['empty-reference-body','Texto<ref> </ref></ref>'],
  ['dynamic-reference-body','Texto<ref>{{Modelo dinâmico}}</ref></ref>'],
  ['nested-reference-body','Texto<ref>A<ref>B</ref>C</ref></ref>'],
  ['hidden-html-opening','<span title="<ref>">Texto.</span></ref></ref>'],
  ['hidden-html-closing','Texto<ref><span title="</ref>">Fonte.</span></ref></ref>'],
  ['hidden-html-upper',"<span title=\"<REF NAME='a'>\">Texto.</span></REF></REF>"],
  ['literal-code','<code>Texto<ref>Fonte de controle.</ref></ref></code>'],
  ['literal-nowiki','<nowiki>Texto<ref>Fonte de controle.</ref></ref></nowiki>'],
  ['inside-table','{|\n| Texto<ref>Fonte de controle.</ref></ref>\n|}'],
  ['inside-template','{{Modelo de controle|texto=Texto<ref>Fonte de controle.</ref></ref>}}'],
  ['inside-incomplete-template','{{Modelo incerto|texto=<ref>Fonte literal.</ref></ref>'],
  ['inside-incomplete-argument','{{{texto|<ref>Fonte literal.</ref></ref>'],
  ['inside-incomplete-html-quote',"<span title='<ref>Fonte literal.</ref></ref>"],
  ['inside-incomplete-html-unquoted','<span data-raw=<ref>Fonte literal.</ref></ref>'],
  ['prior-uncertain-owner','<refname="a">Fonte A.</ref> Texto<ref>Fonte B.</ref></ref>'],
  ['numeric-name','Texto<ref name="123">Fonte de controle.</ref></ref>'],
  ['closing-case-variation','Texto<ref>Fonte de controle.</REF></REF>'],
  ['closing-space-variation','Texto<ref>Fonte de controle.</ref ></ref>'],
  ['closing-with-attribute','Texto<ref>Fonte de controle.</ref name="a"></ref>']
 ];
 const inheritedExpected={
  'nonadjacent-space':'Texto<ref>Fonte de controle.</ref>',
  'nonadjacent-tab':'Texto<ref>Fonte de controle.</ref>',
  'inside-table':'{|\n| Texto<ref>Fonte de controle.</ref>\n|}',
  'numeric-name':'Texto<ref name="ref-123">Fonte de controle.</ref>',
  'closing-case-variation':'Texto<ref>Fonte de controle.</REF>',
  'closing-space-variation':'Texto<ref>Fonte de controle.</ref >'
 };
 for(const [id,input,replacement]of cases){
  const source=input+'\n\n{{Referências}}\n',expected=(replacement??input)+'\n\n{{Referências}}\n';
  const plan=api.v220CitationPlan(source,cfg);eq(plan.text,expected,id+' plan changed unexpected bytes');
  ok(api.v220CitationPlanProof(source,expected,plan,cfg),id+' exact proof missing');
  eq(api.v220CitationPlan(expected,cfg).text,expected,id+' plan not idempotent');
  ok(!api.v220CitationPlanProof(source,expected+'x',plan,cfg),id+' stale candidate accepted');
  if(replacement){const result=api.calculate({kind:'adjust',source,options:cfg});
   ok(result.localCompositionSafety?.accepted!==false,id+' complete action refused');
   ok(result.text.includes(replacement),id+' complete action did not preserve complete note');
   ok(!result.text.includes('</ref></ref>'),id+' duplicate remains in complete action');
   eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,id+' complete action not idempotent');
  }else if(Object.hasOwn(inheritedExpected,id)){
   // The new finite helper refuses these shapes. Independently specified
   // inherited rules may still repair them in the complete action.
   const result=api.calculate({kind:'adjust',source,options:cfg});
   eq(result.text,inheritedExpected[id]+'\n\n{{Referências}}\n',id+' inherited repair changed additional content');
   ok(result.changes.some(row=>row.id==='v29ReferenceClosers'),id+' unexpected repair owner');
   ok(result.localCompositionSafety?.accepted===true,id+' inherited repair guards failed');
   eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,id+' inherited repair not idempotent');
   if(id==='numeric-name')ok(result.changes.some(row=>row.id==='numericRefNames'),'numeric name correction not accounted for');
  }else if(!['prior-uncertain-owner','closing-with-attribute'].includes(id)){
   const result=api.calculate({kind:'adjust',source,options:cfg});
   ok(result.text.includes(input),id+' complete action changed uncertain reference boundary');
  }
  report.cases.push({id,bundle,runtimeSha256,status:'passed',helperInjection:injected,sourceSha256:sha(source),appliedSha256:sha(expected),edits:plan.edits.length});
 }
 for(let count=2;count<=20;count++){
  const source='Texto<ref name="fonte" group="nota">Fonte literal.</ref>'+('</ref>'.repeat(count-1))+'\n\n{{Referências}}\n';
  const expected='Texto<ref name="fonte" group="nota">Fonte literal.</ref>\n\n{{Referências}}\n',plan=api.v220CitationPlan(source,cfg);
  eq(plan.text,expected,'chain '+count+' incomplete');ok(api.v220CitationPlanProof(source,expected,plan,cfg),'chain '+count+' proof');
  const altered=structuredClone(plan);if(altered.edits.length>1)altered.edits.pop();else altered.edits[0].start++;
  ok(!api.v220CitationPlanProof(source,expected,altered,cfg),'chain '+count+' partial proof accepted');
  report.cases.push({id:'property-chain-'+count,bundle,runtimeSha256,status:'passed',helperInjection:injected,sourceSha256:sha(source),appliedSha256:sha(expected),edits:plan.edits.length});
 }
 const incomplete='{{Modelo incerto|texto=<ref>Fonte literal.</ref></ref>',incompleteResult=api.calculate({kind:'adjust',source:incomplete,options:cfg});
 eq(incompleteResult.text,incomplete,'complete action changed an incomplete opaque owner');
 report.cases.push({id:'whole-action-incomplete-template-owner',bundle,runtimeSha256,status:'passed',helperInjection:injected,sourceSha256:sha(incomplete),appliedSha256:sha(incompleteResult.text)});
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');
