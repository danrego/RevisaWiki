'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const report={kind:'archive-url-decomposition-blank-priority-boundaries',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0},eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},ok=(v,m)=>{report.checks++;assert.ok(v,m);};
function test(bundle,id,source,expected,fn){const row={bundle,id,scenarioSha256:sha(JSON.stringify({source,expected}))};try{fn();row.status='passed';}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}report.cases.push(row);}
const archived='https://web.archive.org/web/20010305060708/https://example.org/fonte',original='https://example.org/fonte',archiveKeys=['arquivourl','arquivo-url','archive-url','archiveurl','arquivodata','arquivo-data','archive-date','archivedate'];
for(const file of files){
 const api=require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false},calc=(s,e={})=>api.calculate({kind:'adjust',source:s,options:{...cfg,...e}});
 report.bundles.push({bundle,runtimeSha256:sha(fs.readFileSync(file)),version:api.version});
 for(const title of ['Citar web','Citar jornal','Citar livro','Citar periódico','Citar revista']){
  const cite=fields=>'{{'+title+'|título=Fonte literal|'+fields+'}}';
  // Archive decomposition was retired before this qualification. Retain the
  // former intended endpoint separately, and test the current no-op contract.
  const source=cite('url='+archived),expected=source,retiredEndpoint=cite('url='+original+'|arquivourl='+archived+'|arquivodata=2001-03-05');
  test(bundle,'complete-missing-archive-'+title,source,expected,()=>{eq(api.v219CitationArchiveDecompositionAllowed(source,cfg),false,'A bare archive URL is preserved while decomposition is disabled');const result=calc(source);eq(result.text,expected,'The complete original archive URL remains byte-for-byte');ok(retiredEndpoint!==expected,'The retired transformation is not counted as an executed repair');eq(calc(result.text).text,result.text,'The archived citation is complete in one action');eq(api.preservationAudit(source,result.text,cfg),[],'Every supplied URL and archive timestamp is preserved');});
  for(const key of archiveKeys)for(const value of ['', ' ',key.includes('url')?'https://example.org/another-archive':'2002-04-06'])for(const order of [0,1]){
   const fields=order?key+'='+value+'|url='+archived:'url='+archived+'|'+key+'='+value,source=cite(fields);
   test(bundle,'existing-alias-'+sha(source).slice(0,20),source,source,()=>{eq(api.v219CitationArchiveDecompositionAllowed(source,cfg),false,'An explicitly supplied archive field, including blank, blocks URL decomposition');const result=calc(source);ok(result.text.includes('url='+archived),'The original archived URL is not replaced beside a competing archive argument');ok(!result.text.includes('url='+original+'|'),'The normalizer does not manufacture an active duplicate archive key');eq(api.preservationAudit(source,result.text,cfg),[],'Alias priority and explicit blanks remain guarded');eq(calc(result.text).text,result.text,'The refusal remains idempotent');});
  }
  // Native uppercase URL is accepted, but does not enable the retired repair.
  const upper=cite('URL='+archived);test(bundle,'native-uppercase-url-'+title,upper,upper,()=>{eq(api.v219CitationArchiveDecompositionAllowed(upper,cfg),false,'An accepted URL alias does not override disabled decomposition');eq(calc(upper).text,upper,'The native uppercase key and complete archived URL are preserved');});
  for(const fields of ['url='+archived+'|url='+original,'url='+archived+'|url=','Url='+archived,'url='+archived+'|unnamed literal','url={{URL fictícia}}']){
   const source=cite(fields);test(bundle,'unproved-url-'+sha(source).slice(0,16),source,source,()=>{eq(api.v219CitationArchiveDecompositionAllowed(source,cfg),false,'Duplicate, non-native, positional and dynamic URL inputs are not source-bound decomposition proofs');});
  }
  for(const wrap of [s=>'<nowiki>'+s+'</nowiki>',s=>'<pre>'+s+'</pre>',s=>'"'+s+'"',s=>'{{Modelo fictício|código='+s+'}}',s=>'```wikitext\n'+s+'\n```']){const wrapped=wrap(source);test(bundle,'literal-'+sha(wrapped).slice(0,16),wrapped,wrapped,()=>{eq(calc(wrapped).text,wrapped,'A valid archive URL inside literal or unknown-owner code remains untouched');});}
  test(bundle,'citation-optout-'+title,source,source,()=>{eq(api.v219CitationArchiveDecompositionAllowed(source,{...cfg,citations:false}),false,'The citation master gate remains authoritative');eq(calc(source,{citations:false}).text,source,'No post-normalization stage bypasses the disabled citation action');});
 }
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
