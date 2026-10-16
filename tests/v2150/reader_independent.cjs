'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:['RevisaWiki_v2_15_0.js','RevisaWiki_v2_15_0_completo.js'].map(name=>path.join(root,'dist/2.15.0',name));
const report={version:null,kind:'independent-template-style-adversarial-review',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
function eq(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function test(bundle,id,run){try{run();report.cases++;}catch(error){report.status='failed';report.failures.push({bundle,id,message:error.message});}}
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:10,pageTitle:'Predefinição:Modelo de controle',contentModel:'wikitext',autoPreview:false};
 report.version=api.version;report.bundles.push({file:bundle,version:api.version,sha256:sha(fs.readFileSync(file))});
 for(const [id,source]of [
  ['onlyinclude-doc','<onlyinclude>{{Navbox|title=Teste|list1=A}}</onlyinclude><noinclude>{{Documentação}}</noinclude><noinclude>{{Documentação}}</noinclude>'],
  ['dynamic-param-name','{{Navbox|{{{campo|title}}}=Teste|list1=A}}'],
  ['alias-empty-conflict','{{Navbox|titulo=Teste|título=|list1=A}}'],
  ['anonymous-param','{{Navbox|child|title=Teste|list1=A}}'],
  ['number-gaps','{{Navbox|title=Teste|group1=A|list1=X|group3=C|list3=Z}}'],
  ['documentation-comment-boundary','{{Navbox|title=Teste|list1=A}}<noinclude>{{Documentação}}</noinclude><!-- manter --><noinclude>{{Documentação}}</noinclude>'],
  ['templatedata-duplicate-key','<templatedata>{"params":{"x":{"label":"A","label":"B"}},}</templatedata>'],
  ['templatedata-unknown-schema','<templatedata>{"params":{"x":{"label":"A"}},"invented":true,}</templatedata>'],
  ['templatedata-nested-call','{{X|<templatedata>{"params":{"x":{}},}</templatedata>}}'],
  ['templatedata-code-example','<syntaxhighlight lang="json"><templatedata>{"params":{},}</templatedata></syntaxhighlight>']
 ])test(bundle,id,()=>eq(api.v215TemplateDefinitionPlan(source,cfg).text,source,'The independent negative endpoint is byte-identical'));
 for(const [id,source]of [
  ['unknown-variable','.x { border-color: var(--custom, #abc); }'],
  ['local-variable','.x { --border-color-base: red blue; border-color: var(--border-color-base, #abc); }'],
  ['multi-color-shorthand','.x { border-color: var(--border-color-base, #abc) red; }'],
  ['quoted-unit','.x { content: "24 px"; width:24px; }'],
  ['other-spaced-unit','.x { width:240 px; }'],
  ['escaped-property','.x { b\\6frder-color:var(--border-color-base,#abc); }']
 ])test(bundle,id,()=>eq(api.v215StylePlan(source).edits,[],'No unproved CSS correction is proposed'));
 const original='.x { color:red; }';
 for(const [id,changed]of [['value','.x { color:blue; }'],['selector','.y { color:red; }'],['condition','@media print { .x { color:red; } }']])
  test(bundle,'contextual-retention-'+id,()=>eq(api.v215StyleRetention(original,changed).accepted,false,'A changed value, selector or condition cannot authorize a CSS write'));
}
const output=process.env.REVISAWIKI_REPORT;if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;
