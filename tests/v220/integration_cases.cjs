'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const files=process.argv.slice(2);assert(files.length,'Supply actual release bundles');
const baseline=require('../../dist/2.19.1/RevisaWiki_v2_19_1_completo.js');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const report={kind:'source-bound-prerequisite-and-late-repair-composition',status:'passed',cases:[],checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0,limits:['The inherited content guards do not validate every arbitrary prose substitution. Mutation controls prove exact new-plan rejection and retention of every inherited guard outcome, not a general-purpose content validator.']};
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file),cfg={...Object.fromEntries(Object.keys(api.defaults).map(k=>[k,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',markup:true,structuralRepairs:true,syntaxRepairs:true,automaticTableRepairs:true,tableChecks:true,tableSyntaxRepairs:true,automaticLegacyMarkup:true};
 report.bundles.push({bundle,sha256:sha(fs.readFileSync(file))});
 const check=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);};
 function test(id,source,fn){const row={id,bundle,sourceSha256:sha(source),status:'passed'};report.cases.push(row);try{fn(row);}catch(error){row.status='failed';row.error=error.message;report.failures.push({id,bundle,error:error.message});report.status='failed';}}
 for(const [attribute,style]of [['align="center"','text-align:center;'],['width="90"','width:90px;'],['valign="top"','vertical-align:top;']])for(const eol of ['\n','\r\n']){
  const make=(field,empty)=>['{| class="wikitable"','! Coluna','|-',...(empty?['|-']:[]),'| '+field+'style="'+style+'" | Valor literal','|}'].join(eol);
  const source=make(attribute+' ',true),expected=make('',false),id=attribute+'-'+JSON.stringify(eol);
  test(id,source,row=>{
   const r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});row.expectedSha256=sha(expected);row.actualSha256=sha(r.text);
   check(r.text,expected,'The pre-existing empty-row repair and new redundant-attribute repair compose in one action');
   check(r.preservation,[],'All original preservation obligations remain satisfied');
   check(r.localCompositionSafety.accepted,true,'The production gate accepts the bound chain');
   check(api.preservationAudit(source,r.text,cfg),[],'Independent API invocation accepts the same complete endpoint');
   check(api.safeComposition(source,r.text,cfg),'','Independent composition invocation accepts the same endpoint');
   check(api.calculate({kind:'adjust',source:r.text,options:cfg}).text,expected,'The complete action converges');
   const p=api.v220LegacyTablePrerequisitePlan(source,cfg);check(p.text!==source,true,'The real prerequisite was exercised');
   check(p.legacyPreservationAccepted&&p.legacyCompositionAccepted,true,'The prerequisite has both inherited checks');
   check(api.v220LegacyTablePrerequisiteProof(source,p.text,p,cfg),true,'The exact source plan is reproducible');
   const forged=structuredClone(p);forged.edits[0].text='Inventado';check(api.v220LegacyTablePrerequisiteProof(source,p.text,forged,cfg),false,'An altered prerequisite cannot grant permission');
   check(api.v220LegacyTablePrerequisiteProof(source+' ',p.text,p,cfg),false,'An old source proof cannot grant permission');
   check(api.v220LegacyTablePrerequisiteProof(source,p.text,p,{...cfg,tableSyntaxRepairs:false}),false,'A changed preference invalidates the prerequisite');
   for(const [name,target]of [['cell-value',expected.replace('Valor literal','Valor inventado')],['table-removal',''],['row-extra',expected.replace('|}', '|-'+eol+'| Outro valor'+eol+'|}')],['style-value',expected.replace(style,style.replace(/center|90|top/,x=>({center:'right','90':'91',top:'bottom'}[x])))]] ){
    const plan=api.v220RepairPlan(source,cfg);check(api.v220RepairProof(source,target,plan,cfg),false,'A changed '+name+' cannot use the bound new repair permission');
    check(api.preservationAudit(source,target,cfg),baseline.preservationAudit(expected,target,cfg),'All inherited preservation obligations remain active for '+name);
    check(api.safeComposition(source,target,cfg),baseline.safeComposition(expected,target,cfg),'All inherited composition obligations remain active for '+name);
   }
  });
  for(const option of ['tableSyntaxRepairs','automaticTableRepairs','tableChecks','automaticLegacyMarkup'])test(id+'-disabled-'+option,source,()=>check(api.v220LegacyTablePrerequisitePlan(source,{...cfg,[option]:false}).text,source,'The disabled prerequisite never adds permission'));
  for(const wrapper of [x=>'<nowiki>'+x+'</nowiki>',x=>'<pre>'+x+'</pre>',x=>'{{Modelo desconhecido|exemplo='+x+'}}']){
   const protectedSource=wrapper(source);test(id+'-protected-'+sha(protectedSource).slice(0,8),protectedSource,()=>check(api.v220LegacyTablePrerequisitePlan(protectedSource,cfg).text,protectedSource,'Protected and unknown owners retain all bytes'));
  }
 }
}
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
