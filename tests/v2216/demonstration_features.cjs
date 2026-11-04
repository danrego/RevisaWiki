'use strict';
// Independently authored documentation endpoints, separate from viewer fixtures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),fixture=path.join(__dirname,'feature_examples.json'),raw=fs.readFileSync(fixture),book=JSON.parse(raw),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={kind:'independent-documentation-contracts',version:'2.21.6',status:'passed',fixtureSha256:sha(raw),examples:book.examples.length,cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
for(const name of ['RevisaWiki_v2_21_6.js','RevisaWiki_v2_21_6_completo.js']){
 const filename=path.join(root,'dist/2.21.6',name),api=require(filename),runtimeSha256=sha(fs.readFileSync(filename));
 for(const x of book.examples){const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',autoPreview:false,registryDoiCheck:false,authorityControl:false,...x.options};
  const call=source=>x.entryPoint==='calculate'?api.calculate({kind:'adjust',source,originalSource:source,options:cfg}):api[x.entryPoint](source,cfg);
  try{
   const result=call(x.source);assert.equal(result.text,x.expected,x.id+' independently specified exact endpoint');report.checks++;
   assert.equal(call(result.text).text,x.expected,x.id+' idempotence');report.checks++;
   report.cases.push({id:x.id,bundle:name,runtimeSha256,entryPoint:x.entryPoint,kind:x.kind,status:'passed',sourceSha256:sha(x.source),expectedSha256:sha(x.expected),featureIds:x.featureIds});
  }catch(error){report.status='failed';report.failures.push({id:x.id,bundle:name,message:String(error.message)});report.cases.push({id:x.id,bundle:name,status:'failed'});}
 }
}
report.passedExamples=new Set(report.cases.filter(x=>x.status==='passed').map(x=>x.id)).size;
if(process.env.REVISAWIKI_FEATURE_REPORT)fs.writeFileSync(process.env.REVISAWIKI_FEATURE_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({kind:report.kind,status:report.status,examples:report.examples,passedExamples:report.passedExamples,checks:report.checks,failures:report.failures}));
if(report.failures.length)process.exitCode=1;
