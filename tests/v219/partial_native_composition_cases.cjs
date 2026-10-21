'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),fixture=path.join(__dirname,'partial_native_composition_controls.json'),fixtures=JSON.parse(fs.readFileSync(fixture)).controls,files=process.argv.slice(2);
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.resolve(__dirname,'../../dist/2.19.0',name)));
const report={kind:'partial-native-volume-publication-and-comment-retention',status:'passed',fixtureSha256:sha(fs.readFileSync(fixture)),checks:0,cases:[],bundles:[],failures:[],networkRequests:0,wikipediaWrites:0,limits:['Only controls with an independently authored target are executed as isolated retention assertions. Other retained constructor intents are not claimed as covered by this public relation.']};
function check(value,message){report.checks++;assert(value,message);}
for(const file of files){
 const a=require(file),bundle=path.basename(file);report.bundles.push({bundle,sha256:sha(fs.readFileSync(file))});
 const base={...a.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,endMatter:false};
 for(const c of fixtures.filter(c=>typeof c.target==='string')){
  const source='<ref>'+c.source+'</ref>',target='<ref>'+c.target+'</ref>',cfg={...base,...c.optionsDelta},accept=!/^(?:material-|drop-)/.test(c.id),row={bundle,id:c.id,sourceSha256:sha(source),expectedEndpointSha256:sha(target),acceptedExpected:accept,status:'passed',kind:'isolated-public-retention'};
  try{check(a.v219PartialReferenceRetention(source,source,target,cfg).accepted===accept,'The public retention relation honors the independently authored native field endpoint');}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id:c.id,message:error.message});}report.cases.push(row);
  if(!accept)continue;
  for(const tail of ['', '\n<ref name="incompleta">']){
   const s=source+tail,t=target+tail,whole={bundle,id:c.id+(tail?'/partial':'/complete'),kind:'actual-whole-action',sourceSha256:sha(s),expectedEndpointSha256:sha(t),status:'passed'};
   try{const result=a.calculate({kind:'adjust',source:s,originalSource:s,options:cfg});check(result.text===t,'The production action changes only the native source field and retains the complete tail');check(!result.preservation?.length,'The actual production pipeline preserves every source obligation');check(!a.preservationAudit(s,t,cfg).length,'The independent preservation audit accepts the exact whole endpoint');check(a.safeComposition(s,t,cfg)==='','The independent composition audit also accepts it');check(a.calculate({kind:'adjust',source:t,options:cfg}).text===t,'The endpoint is stable on a second action');}catch(error){whole.status='failed';report.status='failed';report.failures.push({bundle,id:whole.id,message:error.message});}report.cases.push(whole);
  }
 }
 for(const c of fixtures.filter(c=>/^protected-/.test(c.id))){
  const row={bundle,id:c.id,kind:'actual-whole-protected-action',status:'passed'};
  try{check(a.calculate({kind:'adjust',source:c.source,options:base}).text===c.source,'Protected markup never acquires the new field-read permission');}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id:c.id,message:error.message});}report.cases.push(row);
 }
}
report.constructorIntentsNotClaimedExecuted=fixtures.filter(c=>c.target===null&&!/^protected-/.test(c.id)).map(c=>c.id);
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
