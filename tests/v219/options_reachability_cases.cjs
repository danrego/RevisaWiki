'use strict';
// Exact independent contracts for option gates and reachable catalog rules.
// This suite imports the built runtime without exporting or replacing helpers.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).filter(value=>!value.startsWith('--')).map(value=>path.resolve(value));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(value=>path.join(root,'dist/2.19.0',value)));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const report={schemaVersion:1,kind:'option-and-rule-reachability',runnerSha256:sha(fs.readFileSync(__filename)),status:'passed',bundles:[],cases:[],checks:0,failures:[],helperInjection:false,wikipediaWrites:0,networkRequests:0};
function eq(actual,expected,message){report.checks++;assert.deepEqual(actual,expected,message);}
const nativeHeaderAdjudicationBytes=fs.readFileSync(path.join(__dirname,'native_header_expectation_adjudication.json'));
assert.equal(shaNativeHeader(nativeHeaderAdjudicationBytes),'5558f87e7b70a0a4911b6f63bc80c245c74a020a72c74e1661aa83e65b10ad16','The exact native-header adjudications are pinned');
const nativeHeaderAdjudication=JSON.parse(nativeHeaderAdjudicationBytes),nativeHeaderRows=new Map(nativeHeaderAdjudication.rows.map(row=>[row.runner+'/'+row.id,row])),nativeHeaderMatches=[];
assert.equal(shaNativeHeader(fs.readFileSync(path.join(__dirname,nativeHeaderAdjudication.primaryContract.file))),nativeHeaderAdjudication.primaryContract.sha256,'The exact primary local redirect contract is pinned');
function shaNativeHeader(value){return crypto.createHash('sha256').update(value).digest('hex');}
function nativeHeaderCanonical(value){return Array.isArray(value)?value.map(nativeHeaderCanonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,nativeHeaderCanonical(value[key])])):value;}
function reviewedNativeHeaderFixture(f,options,bundle,runner){
 const row=nativeHeaderRows.get(runner+'/'+f.id);if(!row)return f;
 assert.equal(f.source,row.source,'The reviewed original source is exact');assert.equal(shaNativeHeader(f.source),row.sourceSha256,'The original source hash is pinned');
 assert.deepEqual(nativeHeaderCanonical(options),nativeHeaderCanonical(row.options),'Every original option remains exact');assert.equal(shaNativeHeader(JSON.stringify(nativeHeaderCanonical(options))),row.optionsSha256,'The original option hash is pinned');
 assert.equal(f.expected,row.oldExpected,'The old independently supplied endpoint remains exact');assert.equal(shaNativeHeader(f.expected),row.oldExpectedEndpointSha256,'The old expected hash is pinned');
 const suffix=f.source.slice(f.source.indexOf('|'));assert.equal(shaNativeHeader(suffix),row.argumentSuffixSha256,'Every original raw invocation argument remains exact');assert.equal(row.expected,'{{'+row.nativeTarget+suffix,'The new endpoint is solely the pinned native header plus the unchanged argument suffix');
 nativeHeaderMatches.push({bundle,runner,id:f.id});return{...f,expected:row.expected,expectedAdjudication:{reason:row.reason,primaryOldid:row.primaryOldid,nativeTargetOldid:row.nativeTargetOldid,primaryContractSha256:nativeHeaderAdjudication.primaryContract.sha256,adjudicationSha256:shaNativeHeader(nativeHeaderAdjudicationBytes),oldExpectedEndpointSha256:row.oldExpectedEndpointSha256,expectedEndpointSha256:row.expectedEndpointSha256}};
}
for(const file of files){
 const api=require(file),bundle=path.basename(file),runtimeBytes=fs.readFileSync(file);
 report.bundles.push({bundle,version:api.version,sha256:sha(runtimeBytes),bytes:runtimeBytes.length});
 const base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',review:false,autoPreview:false,now:Date.UTC(2026,9,17,12)};
 const cases=[
  {id:'native-duplicate-enabled',source:'{{Info|Alt=Valor literal|Alt=Valor literal}}',expected:'{{Info|Alt=Valor literal}}',options:{infoboxes:true,automaticParameterDuplicates:true}},
  {id:'native-duplicate-disabled',source:'{{Info|Alt=Valor literal|Alt=Valor literal}}',expected:'{{Info|Alt=Valor literal|Alt=Valor literal}}',options:{infoboxes:true,automaticParameterDuplicates:false}},
  {id:'native-duplicate-conflict',source:'{{Info|Alt=Primeiro valor|Alt=Segundo valor}}',expected:'{{Info|Alt=Primeiro valor|Alt=Segundo valor}}',options:{infoboxes:true,automaticParameterDuplicates:true}},
  {id:'foreign-citation-enabled',source:'{{Lien web|titre=Valor literal}}',expected:'{{Citar web|título=Valor literal}}',options:{citations:true,multilingual:true}},
  {id:'foreign-citation-disabled',source:'{{Lien web|titre=Valor literal}}',expected:'{{Lien web|titre=Valor literal}}',options:{citations:true,multilingual:false}},
  {id:'foreign-citation-family-disabled',source:'{{Lien web|titre=Valor literal}}',expected:'{{Lien web|titre=Valor literal}}',options:{citations:false,multilingual:true}},
  {id:'foreign-unknown-field-is-not-half-migrated',source:'{{Lien web|titre=Valor literal|champ_inconnu=Conservar}}',expected:'{{Lien web|titre=Valor literal|champ_inconnu=Conservar}}',options:{citations:true,multilingual:true}},
  {id:'foreign-internal-case-is-not-guessed',source:'{{Lien Web|titre=Valor literal}}',expected:'{{Lien Web|titre=Valor literal}}',options:{citations:true,multilingual:true}},
  {id:'magic-page-name-alias',source:'{{NOMBASEDEPAGE}}',expected:'{{NOMEDAPAGINABASE}}',options:{multilingual:true,links:true,auxiliaryTemplates:true}},
  {id:'magic-page-name-disabled',source:'{{NOMBASEDEPAGE}}',expected:'{{NOMBASEDEPAGE}}',options:{multilingual:false,links:true,auxiliaryTemplates:true}},
  {id:'magic-page-name-unknown-neighbor',source:'{{NOMBASEDEPAGEX}}',expected:'{{NOMBASEDEPAGEX}}',options:{multilingual:true,links:true,auxiliaryTemplates:true}},
  {id:'magic-switch-proof',source:'__SOMMAIRE__',expected:'__TDC__',options:{multilingual:true,links:true,auxiliaryTemplates:true}},
  {id:'magic-redirect-proof',source:'#REDIRECTION [[Tema fictício]]',expected:'#REDIRECIONAMENTO [[Tema fictício]]',options:{multilingual:true,links:true,auxiliaryTemplates:true}}
 ];
 for(const seed of cases.filter(row=>row.source!==row.expected))for(const [kind,wrap]of [
  ['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!-- '+s+' -->'],['code',s=>'<code>'+s+'</code>'],['pre',s=>'<pre>'+s+'</pre>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>']
 ])cases.push({...seed,id:seed.id+'-protected-'+kind,source:wrap(seed.source),expected:wrap(seed.source)});
 for(const originalRow of cases){
  const row=reviewedNativeHeaderFixture(originalRow,{...base,...originalRow.options},bundle,'options_reachability_cases.cjs');
  try{
   const options={...base,...row.options},first=api.calculate({kind:'adjust',source:row.source,originalSource:row.source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});
   eq(first.text,row.expected,'The actual action must reach the declared exact endpoint');
   eq(second.text,first.text,'A complete adjustment must be idempotent');
   eq(first.preservation||[],[],'The exact permitted repair needs a valid preservation proof');
   eq(api.preservationAudit(row.source,first.text,options),[],'Independent preservation must accept the exact repair');
   eq(api.safeComposition(row.source,first.text,options),'','A standalone source is a complete safe edit context');
   report.cases.push({bundle,id:row.id,status:'passed',...(row.expectedAdjudication?{expectedAdjudication:row.expectedAdjudication,sourceSha256:sha(row.source),optionsSha256:sha(JSON.stringify(nativeHeaderCanonical(options))),expectedEndpointSha256:sha(row.expected),actualEndpointSha256:sha(first.text),appliedIds:(first.changes||[]).filter(change=>change.count>0).map(change=>change.id)}:{})});
  }catch(error){report.status='failed';report.cases.push({bundle,id:row.id,status:'failed'});report.failures.push({bundle,id:row.id,message:error.message});}
 }
 assert.equal(nativeHeaderMatches.filter(row=>row.bundle===bundle&&row.runner==='options_reachability_cases.cjs').length,2,'Exactly the primary-reviewed original scenarios are adjudicated per bundle');
 eq(sha(fs.readFileSync(file)),sha(runtimeBytes),'The runtime bytes must not change during execution');
}
report.caseCount=report.cases.length;
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(report.status!=='passed')process.exitCode=1;
