'use strict';
// Independent literal endpoints combine a preserved native URL-state field
// with finite citation repairs. Expected text never comes from a repair plan.
// Native CS1 module 72936771/configuration 73016847 bind author/editor links to
// the same person. The existing split-link operation appends its unique native
// link field, preserving all pre-existing parameter positions and spellings.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x)),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={kind:'native-citation-state-composition-full-actions',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],helperInjection:false,networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},ok=(x,m)=>{report.checks++;assert.ok(x,m);};
const fixtures=[
 ['access-key','acessado-em=5 de março de 2001','acessodata=5 de março de 2001'],
 ['page-key','pág=5','página=5'],['subtitle-key','sub-titulo=Nota literal','subtítulo=Nota literal'],
 ['collection-key','colecção=Série literal','coleção=Série literal'],['series-number-key','seriesno=5','numero-serie=5'],
 ['editor-first-key','editor-name=Nome literal|editor=Pessoa literal','editor-nome=Nome literal|editor=Pessoa literal'],
 ['editor-last-key','editor-lastname=Pessoa literal','editor-sobrenome=Pessoa literal'],
 ['editor-link-key','editor=Pessoa literal|enlace-editor=Destino literal','editor=Pessoa literal|editor-link=Destino literal'],
 ['author-link','autor=[[Destino literal|Autoria literal]]','autor=Autoria literal','autorlink=Destino literal'],
 ['editor-link','editor=[[Destino literal|Pessoa literal]]','editor=Pessoa literal','editorlink=Destino literal'],
 ['doi-prefix','doi=doi:10.1000/example','doi=10.1000/example'],
 ['doi-leading-slash','doi=/10.1000/example','doi=10.1000/example'],
 ['isbn-prefix','isbn=ISBN 0-306-40615-2','isbn=0-306-40615-2'],
 ['pmid-prefix','pmid=PMID:12345678','pmid=12345678'],['pmc-prefix','pmc=PMC1234567','pmc=1234567'],
 ['access-day-padding','acessodata=2025-1-14','acessodata=2025-01-14'],
 ['archive-day-padding','arquivodata=2009-5-16','arquivodata=2009-05-16'],
 ['publication-day-numeric','data=31/12/2020','data=31 de dezembro de 2020'],
 ['publication-date-template','data={{DataExt|31|12|2020}}','data=31 de dezembro de 2020'],
 ['native-missing-accent-retained','subtitulo=Nota literal','subtitulo=Nota literal'],
 ['native-year-retained','ano=2020','ano=2020'],
 ['native-access-alias-retained','dataacesso=5 de março de 2001','dataacesso=5 de março de 2001']
];
const stateKeys=['url-status','datali','li','ligação inativa','ligação inactiva','urlmorta','dead-url','deadurl'],values=['','no','sim','live','unfit','2026-01-01','CUSTOM'];
for(const file of files){const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false,registryDoiCheck:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false};
 report.bundles.push({bundle,version:api.version,sha256:sha(bytes),bytes:bytes.length});
 for(const family of ['Citar web','Citar jornal','Citar livro','Citar revista','Citar periódico'])for(const [id,beforeField,afterField,appendedField='']of fixtures)for(const key of stateKeys)for(const value of values){
  const state=key+'='+value,wrap=(field,append='')=>'Texto.<ref>{{'+family+'|título=Publicação literal|url=https://example.invalid/fonte|'+field+'|'+state+(append?'|'+append:'')+'}}</ref>\n{{Referências}}',source=wrap(beforeField),expected=wrap(afterField,appendedField),optionsSha256=sha(JSON.stringify(canonical(cfg))),sourceSha256=sha(source),expectedEndpointSha256=sha(expected),intent={family,id,key,value},row={bundle,...intent,sourceSha256,expectedEndpointSha256,optionsSha256,intentSha256:sha(JSON.stringify(intent)),scenarioSha256:sha(JSON.stringify(canonical({source,expected,optionsSha256}))),evidenceKind:'actual-full-action-exact-endpoint',status:'passed'};
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
