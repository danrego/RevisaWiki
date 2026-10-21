'use strict';
// Independently supplied day and archive payloads survive composition with
// exact native/local citation identities and the approved empty-part repair.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x)),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={kind:'source-bound-citation-projection-composition',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],helperInjection:false,networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},ok=(x,m)=>{report.checks++;assert.ok(x,m);};
for(const file of files){const a=require(file),bundle=path.basename(file),cfg={...a.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,referenceColumns:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,registryDoiCheck:false};report.bundles.push({bundle,sha256:sha(fs.readFileSync(file)),version:a.version});
 const pairs=[
  {id:'single-digit-native-access-day',source:'{{Cite journal|title=Publicação literal|url=https://example.invalid/fonte|access-date=25-3-2019}}',expected:'{{Citar periódico|title=Publicação literal|url=https://example.invalid/fonte|access-date=25-3-2019}}',semanticEndpoint:'{{Citar periódico|título=Publicação literal|url=https://example.invalid/fonte|acessodata=25-03-2019}}'},
  {id:'empty-parts-before-native-archive',source:'{{citar web||url=https://web.archive.org/web/20090412024404/https://example.invalid/fonte||titulo=Publicação literal||acessodata=16 de Agosto de 2008||}}',expected:'{{citar web|url=https://web.archive.org/web/20090412024404/https://example.invalid/fonte|titulo=Publicação literal|acessodata=16 de agosto de 2008}}'},
 ];
 for(const pair of pairs){const source='Texto.<ref>'+pair.source+'</ref>\n{{Referências}}',expected='Texto.<ref>'+pair.expected+'</ref>\n{{Referências}}';
  const row={bundle,id:pair.id,evidenceKind:'actual-full-action-exact-endpoint',sourceSha256:sha(source),expectedEndpointSha256:sha(expected),optionsSha256:sha(JSON.stringify(cfg)),intentSha256:sha(JSON.stringify(pair)),status:'passed'};
  try{const actual=a.calculate({kind:'adjust',source,options:cfg});row.actualEndpointSha256=sha(actual.text);row.appliedIds=(actual.changes||[]).map(x=>x.id);eq(actual.text,expected,'One complete action reaches the independently supplied finite endpoint');eq(actual.preservation||[],[],'No false preservation finding');eq(a.calculate({kind:'adjust',source:expected,options:cfg}).text,expected,'One action is idempotent');eq(a.preservationAudit(source,expected,cfg),[],'Same typed access day and complete archive payload');eq(a.safeComposition(source,expected,cfg),'','Exact declared composition is retained');if(pair.semanticEndpoint){const semantic='Texto.<ref>'+pair.semanticEndpoint+'</ref>\n{{Referências}}';eq(a.preservationAudit(source,semantic,cfg),[],'The native role/day equivalent endpoint retains every supplied day');eq(a.safeComposition(source,semantic,cfg),'','The alias/date comparison endpoint also composes');}}catch(e){row.status='failed';report.status='failed';report.failures.push({bundle,id:pair.id,message:e.message});}report.cases.push(row);
  for(const [id,changed]of [['day',expected.replace('25-3-2019','26-3-2019').replace('25-03-2019','26-03-2019').replace('16 de agosto','17 de agosto')],['title',expected.replace('Publicação literal','Outra publicação')],['url',expected.replaceAll('example.invalid/fonte','example.invalid/outra')],['archive-day',expected.replace('2009-04-12','2009-04-13').replace('20090412024404','20090413024404')]]){
   if(changed===expected)continue;const mutant={bundle,id:pair.id+'-'+id,evidenceKind:'native-comparison-only-mutation',status:'passed'};
   try{ok(a.preservationAudit(source,changed,cfg).length>0,'A changed supplied day/title/URL/archive association fails');ok(Boolean(a.safeComposition(source,changed,cfg)),'Composition rejects the changed association');}catch(e){mutant.status='failed';report.status='failed';report.failures.push({bundle,id:mutant.id,message:e.message});}report.cases.push(mutant);
  }
 }
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
