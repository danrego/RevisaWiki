'use strict';
// A read-only presentation job preserves the exact existing retained counter.
// Differential cache checks do not prove article transformations or native rendering.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x));if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const report={kind:'read-only-presentation-job-and-report-cache-contract',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,presentationExecutions:0,transformationExecutions:0,networkRequests:0,wikipediaWrites:0,limits:['Count equivalence uses the existing exact retained-count helper, including unknown counts.','This runner executes no native DOM Undo, deadline or responsiveness scenario. Native browser tests are required separately.']};
for(const file of files){const a=require(file),bundle=path.basename(file),bytes=fs.readFileSync(file),cfg={...a.defaults,namespaceNumber:0,pageTitle:'Tema fictício',autoPreview:false,portals:false,authorityControl:false};report.bundles.push({bundle,sha256:sha(bytes)});
 function check(id,run){const row={bundle,id,evidenceKind:'read-only-or-helper-differential',status:'passed'};report.cases.push(row);try{run();report.checks++;}catch(e){row.status='failed';row.message=e.message;report.status='failed';}}
 for(const[before,after,kinds]of [['[[Tema fictício|Tema fictício]]','[[Tema fictício]]',['syntax']],['Texto literal.','Texto literal.',['syntax']],['Texto.\n\n\nTrecho.','Texto.\n\nTrecho.',['syntax']],['<ref>Fonte literal.</ref>','<ref>Fonte literal.</ref>',['discussion']],['{{Modelo fictício|texto=valor}}','{{Modelo fictício|texto=valor}}',['spelling']]]){
  const id=sha(JSON.stringify([before,after,kinds])).slice(0,12);let result;
  check(id+'/read-only-exact-count',()=>{result=a.calculate({kind:'presentation',source:after,originalSource:before,presentationKinds:kinds,options:cfg});report.presentationExecutions++;assert.equal(result.kind,'presentation');assert.equal(result.text,after);assert.equal(result.changes,undefined);assert.deepEqual(result.presentation.retained,a.v211RetainedAdjustments(before,after,kinds,cfg));assert.equal(a.v219UIPresentationMatches(result,before,after,kinds,cfg),true);});
  if(!result)continue;
  for(const[label,b,c,d,e]of [['before',before+'x',after,kinds,cfg],['after',before,after+'x',kinds,cfg],['kinds',before,after,['styles'],cfg],['options',before,after,kinds,{...cfg,links:!cfg.links}]])check(id+'/stale-'+label,()=>assert.equal(a.v219UIPresentationMatches(result,b,c,d,e),false));
  check(id+'/retained-mutant',()=>{const mutant=JSON.parse(JSON.stringify(result));mutant.presentation.retained.count=99;assert.equal(a.v219UIPresentationMatches(mutant,before,after,kinds,cfg),false);});
  check(id+'/topics-mutant',()=>{const mutant=JSON.parse(JSON.stringify(result));mutant.presentation.topics=['Rótulo fictício alterado'];assert.equal(a.v219UIPresentationMatches(mutant,before,after,kinds,cfg),false);});
 }
 for(const extra of [{},{originalSource:3},{originalSource:'Texto',presentationKinds:'syntax'},{originalSource:'Texto',presentationKinds:['unknown-kind']}])check('invalid-job/'+sha(JSON.stringify(extra)).slice(0,12),()=>assert.throws(()=>a.calculate({kind:'presentation',source:'Texto',options:cfg,...extra}),TypeError));
 const source='Texto literal.<ref>Fonte literal.</ref>\n\n{{Referências}}';let result;
 check('audit-reports-bound',()=>{result=a.calculate({kind:'audit',source,options:cfg});assert.equal(result.text,source);assert.equal(a.v219UIReviewReportsBound(result,cfg),true);assert.equal(a.v217FinalReviewResult(result,cfg),result);});
 if(result){
  for(const[label,mutate,options]of [['text',x=>{x.text+='x';},cfg],['report',x=>{x.localReports.references.push({code:'fictional-mutant'});},cfg],['missing-report',x=>{delete x.localReports.dates;},cfg],['options',()=>{},{...cfg,multilingual:!cfg.multilingual}]])check('review-cache-'+label,()=>{const mutant=JSON.parse(JSON.stringify(result));mutate(mutant);assert.equal(a.v219UIReviewReportsBound(mutant,options),false);const refreshed=a.v217FinalReviewResult(mutant,options);assert.equal(a.v219UIReviewReportsBound(refreshed,options),true);assert.deepEqual(refreshed.localReports.references,a.referenceAudit(refreshed.text,options));});
 }
 check('runtime-immutable',()=>assert.equal(sha(fs.readFileSync(file)),sha(bytes)));
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
