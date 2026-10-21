'use strict';
// Unknown populated keys cannot acquire a conflicting native role merely
// because a global alias table has a similar spelling.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex'),root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(value=>path.resolve(value));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const contract=fs.readFileSync(path.join(__dirname,'citation_alias_contract.json')),
 report={schemaVersion:1,kind:'citation-alias-collision-precedence',status:'passed',runnerSha256:hash(fs.readFileSync(__filename)),contractSha256:hash(contract),bundles:[],cases:0,checks:0,failures:[],wikipediaWrites:0,networkRequests:0,helperInjection:false},
 eq=(actual,expected,label)=>{report.checks++;assert.deepEqual(actual,expected,label);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),options={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',citations:true,auxiliaryTemplates:true,automaticParameterNames:true,automaticParameterDuplicates:true,automaticEmptyParameters:true,minorBaseConfirmed:true};
 report.bundles.push({bundle,sha256:hash(bytes),version:api.version});
 const unique='{{Citar dissertação|capitulourl=https://example.invalid/capitulo}}',fixed=unique.replace('|capitulourl=','|capítulourl=');
 for(const [id,source,expected,override]of [
  ['unique-valid-url',unique,fixed,{}],['disabled-key-repair',unique,unique,{automaticParameterNames:false}],
  ...[['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!--'+s+'-->'],['code',s=>'<code>'+s+'</code>'],['pre',s=>'<pre>'+s+'</pre>']].map(([id,wrap])=>[id,wrap(unique),wrap(unique),{}])
 ]){report.cases++;try{
  const cfg={...options,...override},first=api.calculate({kind:'adjust',source,originalSource:source,options:cfg}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options:cfg});
  eq(first.text,expected,'Only the independently proved unique URL key is renamed');eq(second.text,expected,'The exact endpoint is idempotent');
  eq(first.preservation||[],[],'The URL is retained');eq(api.preservationAudit(source,expected,cfg),[],'The separate retention proof admits only the exact key change');eq(api.safeComposition(source,expected,cfg),'','The complete source context accepts the key-only repair');
 }catch(error){report.status='failed';report.failures.push({bundle,id,message:error.message});}}
 for(const [alias,target]of [['capitulourl','capítulourl'],['title','título'],['author','último']])for(const values of [['https://example.invalid/primeiro','https://example.invalid/segundo'],['https://example.invalid/primeiro',''],['','https://example.invalid/segundo']])for(const reverse of [false,true]){
  const fields=[[alias,values[0]],[target,values[1]]];if(reverse)fields.reverse();
  const source='{{Citar dissertação'+fields.map(([key,value])=>'|'+key+'='+value).join('')+'}}';report.cases++;
  try{
   const first=api.calculate({kind:'adjust',source,originalSource:source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});
   eq(first.text,source,'Competing populated or empty aliases retain their original source roles and precedence');
   eq(second.text,source,'The unchanged conflict remains idempotent');
   eq(first.preservation||[],[],'No source value or explicit default override is discarded');
   eq(api.preservationAudit(source,source,options),[],'The independent preservation check admits the exact original');
   eq(api.safeComposition(source,source,options),'','No unproved parameter equivalence is needed');
  }catch(error){report.status='failed';report.failures.push({bundle,id:hash(source).slice(0,24),message:error.message});}
 }
 eq(hash(fs.readFileSync(file)),hash(bytes),'The actual bundle remains immutable');
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
