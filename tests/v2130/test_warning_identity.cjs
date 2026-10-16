'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),candidate=require('./candidate.cjs');
candidate.verify();
const report={version:'2.13.0',kind:'reference-warning-identity',status:'passed',frozenFiles:candidate.manifest.files,runnerSha256:candidate.sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const equal=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);};
for(const script of candidate.bundleFiles()){
 const api=require(script),bundle=path.basename(script),options={...api.defaults,namespaceNumber:0,pageTitle:'Artigo de teste',authorityControl:false,endTemplateOrder:false,portals:false,spelling:false,dates:false,autoPreview:false};
 const ref=(name,body,group='')=>'<ref name="'+name+'"'+(group?' group="'+group+'"':'')+(body===null?'/>':'>'+body+'</ref>');
 const conflict=(name,group='')=>ref(name,'Fonte A.',group)+ref(name,'Fonte B.',group)+ref(name,null,group);
 const fixtures=[
  {id:'one-ambiguous-conflict',source:conflict('fonte')+'\n{{Referências}}',count:1,groups:0},
  {id:'distinct-names',source:conflict('fonte')+conflict('outra')+'\n{{Referências}}',count:2,groups:0},
  {id:'same-name-distinct-groups',source:conflict('fonte')+conflict('fonte','nota')+'\n{{Referências}}\n{{Referências|grupo=nota}}',count:2,groups:1},
  {id:'two-nondefault-groups',source:conflict('fonte','n')+conflict('fonte','m')+'\n{{Referências|grupo=n}}\n{{Referências|grupo=m}}',count:2,groups:2},
  {id:'independent-missing-definition',source:conflict('fonte')+ref('ausente',null)+'\n{{Referências}}',count:1,groups:0,missing:true},
  {id:'identical-definitions-not-conflicts',source:ref('fonte','Fonte A.')+ref('fonte','Fonte A.')+'\n{{Referências}}',count:0,groups:0},
  {id:'protected-example',source:'<nowiki>'+conflict('fonte')+'</nowiki>\n{{Referências}}',count:0,groups:0},
  {id:'fully-defined-repaired',source:ref('fonte','Fonte A.')+ref('fonte','Fonte B.')+'\n{{Referências}}',count:0,groups:0,repair:true}
 ];
 for(const item of fixtures){try{
  const result=api.calculate({kind:'adjust',source:item.source,options});
  const findings=result.localReports.references.filter(f=>f.code==='conflicting-definition');
  equal(findings.length,item.count,'Every remaining name/group conflict has its own structured finding');
  equal(result.warnings.filter(w=>/^Definições diferentes para /.test(w)).length,item.count,'Each remaining conflict has exactly one final warning');
  equal(result.warnings.filter(w=>/tem definições diferentes\. Nenhuma foi descartada\.$/.test(w)),[],'The less precise duplicate is suppressed only when a final conflict finding exists');
  equal(findings.filter(f=>/, grupo /.test(f.message)).length,item.groups,'Different groups retain their own warnings');
  equal(result.localReports.references.some(f=>f.code==='missing-definition'),!!item.missing,'Independent missing-reference evidence remains visible');
  equal(result.preservation,[],'No source is lost by presentation deduplication');
  if(item.repair)equal(result.text.includes('name="fonte-2"'),true,'Safe complete definitions are still separated');
  report.cases.push({bundle,id:item.id,status:'passed'});
 }catch(error){report.status='failed';report.failures.push({bundle,id:item.id,message:candidate.sanitized(error.message)});}}
}
fs.writeFileSync(path.join(candidate.artifactDirectory(),'warning_identity.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failures:report.failures}));if(report.status!=='passed')process.exitCode=1;
