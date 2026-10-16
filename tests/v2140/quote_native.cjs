'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process'),root=path.resolve(__dirname,'../..'),dir=path.join(__dirname,'quote_native');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const pin=fs.readFileSync(path.join(root,'tests/expected_release_v2140.json')),runtime=JSON.parse(pin);
const report={version:'2.14.0',status:'passed',cases:0,checks:0,failures:[],releaseManifestSha256:sha(pin),frozenFiles:runtime.files,
 runnerSha256:sha(fs.readFileSync(__filename)),nativeManifestSha256:sha(fs.readFileSync(path.join(dir,'manifest.json'))),networkRequests:0,wikipediaWrites:0};
function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
try{
 const projections=JSON.parse(execFileSync(process.env.REVISAWIKI_PYTHON||'python3',[path.join(__dirname,'quote_native_projection.py')],{encoding:'utf8'}));
 for(const state of ['before','after']){
  const raw=fs.readFileSync(path.join(dir,state+'.json')),html=fs.readFileSync(path.join(dir,state+'.html'));
  eq(sha(raw),manifest.captures[state].responseSha256,'Captured native response hash');eq(sha(html),manifest.captures[state].htmlSha256,'Captured HTML hash');
  eq(JSON.parse(raw).parse.text,html.toString(),'The projection is the exact saved native response');
  eq(/class="(?:error|mw-ext-cite-error)/.test(html.toString()),false,'No native parse error');
 }
 const align={direita:'floatright',esquerda:'floatleft',centro:'centered',none:null},author={direita:'right-aligned',esquerda:'left-aligned',centro:'center-aligned',right:'right-aligned'};
 for(const row of manifest.cases){
  const old=projections.before['q'+row.id],fresh=projections.after['q'+row.id];
  eq(old.quote,fresh.quote,'Every quoted word is identical');
  eq(old.author,fresh.author,'Every source word is identical');
  if(align[row.box])eq(fresh.boxClasses.includes(align[row.box]),true,'The native box uses the requested supported alignment');else eq(['floatleft','floatright','centered'].some(name=>fresh.boxClasses.includes(name)),false,'Native none alignment does not float the box');
  eq(fresh.authorClasses.includes(author[row.author]),true,'The native author alignment uses the requested supported value');
  for(const name of ['RevisaWiki_v2_14_0.js','RevisaWiki_v2_14_0_completo.js']){
   const file=path.join(root,'dist/2.14.0',name);eq(sha(fs.readFileSync(file)),runtime.files[name].sha256,'The tested runtime is fixed');
   const api=require(file),cfg={...api.defaults,namespaceNumber:0,multilingual:false};
   eq(api.v214QuoteAlignmentPlan(row.before,cfg).text,row.after,'The finite engine matches the independently captured native endpoint');
  }
  report.cases++;
 }
}catch(error){report.status='failed';report.failures.push(String(error.message));}
const output=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2140'));fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'quote_native.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:report.cases,checks:report.checks,failed:report.failures.length}));if(report.failures.length)process.exitCode=1;
