'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):['RevisaWiki_v2_14_0.js','RevisaWiki_v2_14_0_completo.js'].map(name=>path.join(root,'dist/2.14.0',name));
const gap='Primeiro texto.\n\n\nSegundo texto.';
const cases=[
 ...['ftp://example.test/','mail'+'to:example','irc://example.test/','tel:+000','HTTPS://example.test/','custom+scheme:literal','//example.test/'].map((prefix,index)=>({id:'external-uri-label-'+index,source:'Texto antes.\n\n['+prefix+' rótulo\n'+gap+'\n]\n\nTexto depois.',positive:false})),
 {id:'complete-triple-argument',source:'{{{argumento|'+gap+'}}}',positive:false},
 {id:'multiline-triple-argument',source:'{{{argumento|\n'+gap+'\n}}}',positive:false},
 {id:'styled-html-whitespace',source:'<div style="white-space:pre-wrap">'+gap+'</div>',positive:false},
 {id:'poem-literal-spacing',source:'<poem>'+gap+'</poem>',positive:false},
 {id:'ordinary-prose',source:gap,expected:'Primeiro texto.\n\nSegundo texto.',positive:true},
 {id:'heading-to-prose',source:'== Uma seção ==\n\n\nPrimeiro texto.',expected:'== Uma seção ==\n\nPrimeiro texto.',positive:true},
 {id:'unclosed-triple-argument',source:'{{{argumento|\n'+gap,positive:false},
 {id:'mismatched-triple-argument',source:'Texto antes.\n{{{argumento|\n'+gap+'\n}}\nTexto depois.',positive:false},
 {id:'uppercase-ftp-label',source:'[FTP://example.test/ rótulo\n'+gap+'\n]',positive:false}
];
assert.equal(cases.length,16);
const report={version:'2.14.0',kind:'independent-prose-spacing-protection-review',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
function equal(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',autoPreview:false,minorBaseConfirmed:true,spelling:false,dates:false,portals:false,automaticTopicPortals:false,automaticBiographyPortals:false,authorityControl:false,referenceColumns:false,unifiedNotesReferences:false,multilingual:false,links:false};
 report.bundles.push({file:bundle,version:api.version,sha256:sha(fs.readFileSync(file))});
 for(const item of cases){try{
  const expected=item.expected??item.source,plan=api.v214ProseSpacingPlan(item.source,cfg);
  equal(plan.text,expected,'The independent exact source endpoint is respected');equal(plan.edits.length,item.positive?1:0,'Only an ordinary top-level gap has an authorized edit');equal(api.v214ProseSpacingProof(item.source,expected,plan,cfg),true,'The exact source and complete regenerated plan agree');
  if(item.positive){const result=api.calculate({kind:'adjust',source:item.source,options:cfg});equal(result.text,expected,'The full engine composes the source-bound spacing edit');equal(result.preservation,[],'Independent preservation accepts the endpoint');equal(api.calculate({kind:'adjust',source:expected,options:cfg}).text,expected,'The second action preserves every byte');const count=api.v211RetainedAdjustments(item.source,expected);equal(count.exact,true,'The retained count has a complete witness');equal(count.count,1,'One independently located gap is one adjustment');equal(result.minorCheck.eligible,true,'The confirmed mechanical formatting is minor');}
  else{const changed=item.source.replace(/\n{3,}/,'\n\n');equal(api.v214ProseSpacingProof(item.source,changed,{...plan,text:changed},cfg),false,'A protected gap cannot borrow an ordinary prose-spacing proof');}
  report.cases.push({bundle,id:item.id,positive:item.positive,passed:true,inputSha256:sha(Buffer.from(item.source)),expectedSha256:sha(Buffer.from(expected))});
 }catch(error){report.status='failed';report.failures.push({bundle,id:item.id,error:String(error.message)});}}
}
const directory=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2140'));fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'spacing_independent.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failures:report.failures}));if(report.status!=='passed')process.exitCode=1;
