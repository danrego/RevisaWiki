'use strict';
// Independent literal endpoints combine a preserved native URL-state field
// with finite citation repairs. Expected text never comes from a repair plan.
// Native CS1 72936771/configuration 73016847 resolve the four primary language
// names to the same codes and source categories. The complete source title
// contains an apostrophe, so the proof cannot depend on whole-call quote parsing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x)),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={kind:'native-citation-language-state-full-actions',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],helperInjection:false,networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},ok=(x,m)=>{report.checks++;assert.ok(x,m);};
const fixtures=[
 ['english-name','língua=inglês','língua=en'],
 ['czech-name','língua=Checo','língua=cs'],
 ['swedish-name','língua=sueco','língua=sv'],
 ['greek-name','língua=GREGO','língua=el']
];
const stateKeys=['url-status','datali','li','ligação inativa','ligação inactiva','urlmorta','dead-url','deadurl'],values=['','no','sim','live','unfit','2026-01-01','CUSTOM'];
for(const file of files){const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,registryDoiCheck:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false};
 report.bundles.push({bundle,version:api.version,sha256:sha(bytes),bytes:bytes.length});
 for(const family of ['Citar web','Citar jornal','Citar livro','Citar revista','Citar periódico'])for(const [id,beforeField,afterField,appendedField='']of fixtures)for(const key of stateKeys)for(const value of values){
  const state=key+'='+value,wrap=(field,append='')=>'Texto.<ref>{{'+family+'|título=Publicação d\'água|url=https://example.invalid/fonte|'+field+'|'+state+(append?'|'+append:'')+'}}</ref>\n{{Referências}}',source=wrap(beforeField),expected=wrap(afterField,appendedField),optionsSha256=sha(JSON.stringify(canonical(cfg))),sourceSha256=sha(source),expectedEndpointSha256=sha(expected),intent={family,id,key,value},row={bundle,...intent,sourceSha256,expectedEndpointSha256,optionsSha256,intentSha256:sha(JSON.stringify(intent)),scenarioSha256:sha(JSON.stringify(canonical({source,expected,optionsSha256}))),evidenceKind:'actual-full-action-exact-endpoint',status:'passed'};
  try{
   const actual=api.calculate({kind:'adjust',source,options:cfg});row.actualEndpointSha256=sha(actual.text);row.appliedIds=(actual.changes||[]).map(x=>x.id);row.actualChanges=(actual.changes||[]).map(({id,count})=>({id,count}));
   eq(actual.text,expected,'The full action reaches the independent complete citation endpoint');
   ok(actual.text.includes('|'+state+'}}')||actual.text.includes('|'+state+'|'),'The exact native state key/value, including blank and case, is retained');
   eq(actual.preservation||[],[],'The complete action has no citation retention rollback');eq(api.preservationAudit(source,expected,cfg),[],'The native state remains associated with the exact repaired publication');
   eq(api.safeComposition(source,expected,cfg),'','The exact complete endpoint composes');eq(api.calculate({kind:'adjust',source:expected,options:cfg}).text,expected,'Every eligible correction finishes in one action');
   const changed=expected.includes('|'+state+'|')?expected.replace('|'+state+'|','|'+key+'='+value+'-alterado|'):expected.replace('|'+state+'}}','|'+key+'='+value+'-alterado}}');
   ok(api.preservationAudit(source,changed,cfg).some(x=>x.code==='lost-citation-metadata'),'A changed state cannot borrow an unrelated safe field correction');ok(api.safeComposition(source,changed,cfg)!=='','The complete composition guard rejects a changed native state');
  }catch(error){row.status='failed';report.status='failed';if(report.failures.length<140)report.failures.push({bundle,...intent,message:error.message});}
  report.cases.push(row);
 }
 eq(sha(fs.readFileSync(file)),sha(bytes),'The actual tested runtime remains immutable');
}
report.caseCount=report.cases.length;report.distinctScenarios=new Set(report.cases.map(x=>x.scenarioSha256)).size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
