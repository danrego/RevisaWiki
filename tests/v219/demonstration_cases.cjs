'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),fixture=path.join(__dirname,'demo_examples.json'),examples=JSON.parse(fs.readFileSync(fixture));
const report={kind:'demonstration-independent-endpoints-on-distributed-engines',status:'passed',fixtureSha256:sha(fs.readFileSync(fixture)),checks:0,cases:[],bundles:[],failures:[],networkRequests:0,wikipediaWrites:0};
for(const name of ['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js']){
 const file=path.join(root,'dist/2.19.0',name),bytes=fs.readFileSync(file),a=require(file);report.bundles.push({bundle:name,sha256:sha(bytes)});
 for(const item of examples){const row={bundle:name,id:item.id,operation:item.operation||'adjust',sourceSha256:sha(item.source),expectedEndpointSha256:sha(item.expected),status:'passed'};
  const equal=(actual,expected,label)=>{report.checks++;assert.deepEqual(actual,expected,label);};
  try{
   if(item.operation==='talkHeader'){
    equal(a.v25TalkPreparationPlan(item.source,item.articleSource||'',item.options).text,item.expected,'The real discussion API reaches the preauthored demonstration endpoint');
    equal(a.v25TalkPreparationPlan(item.expected,item.articleSource||'',item.options).text,item.expected,'The discussion endpoint is stable');
   }else{
    const result=a.calculate({kind:'adjust',source:item.source,originalSource:item.source,options:item.options});equal(result.text,item.expected,'The distributed engine reaches the independent example endpoint');equal(result.preservation||[],[],'The example has no pipeline preservation failure');equal(a.preservationAudit(item.source,result.text,item.options),[],'The independent source audit also accepts the example');equal(a.safeComposition(item.source,result.text,item.options),'','The independent composition audit also accepts it');equal(a.calculate({kind:'adjust',source:result.text,options:item.options}).text,item.expected,'The demonstration endpoint is stable');
   }
  }catch(error){row.status='failed';report.status='failed';report.failures.push({bundle:name,id:item.id,message:error.message});}
  report.cases.push(row);
 }
 if(sha(fs.readFileSync(file))!==sha(bytes))throw Error('The demonstration test runtime changed');
}
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
