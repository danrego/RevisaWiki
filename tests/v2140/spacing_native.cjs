'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),dir=path.join(__dirname,'spacing_native'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))),pin=fs.readFileSync(path.join(root,'tests/expected_release_v2140.json')),runtime=JSON.parse(pin);
const report={version:'2.14.0',kind:'native-paragraph-spacing',status:'passed',cases:0,checks:0,failures:[],releaseManifestSha256:sha(pin),frozenFiles:runtime.files,runnerSha256:sha(fs.readFileSync(__filename)),nativeManifestSha256:sha(fs.readFileSync(path.join(dir,'manifest.json'))),networkRequests:0,wikipediaWrites:0};
function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
try{
 const projections=JSON.parse(execFileSync(process.env.REVISAWIKI_PYTHON||'python3',[path.join(__dirname,'spacing_native_projection.py')],{encoding:'utf8'}));
 for(const state of ['before','after']){
  const raw=fs.readFileSync(path.join(dir,state+'.json')),html=fs.readFileSync(path.join(dir,state+'.html')),wiki=fs.readFileSync(path.join(dir,state+'.wiki'));
  eq(sha(raw),manifest.captures[state].responseSha256,'Native response hash');eq(sha(html),manifest.captures[state].htmlSha256,'Native HTML hash');eq(sha(wiki),manifest.captures[state].sourceSha256,'Native source hash');
  eq(JSON.parse(raw).parse.text,html.toString(),'Saved HTML is the exact native response');eq(/class="(?:error|mw-ext-cite-error)/.test(html),false,'No native parse error');
 }
 for(const row of manifest.cases){
  const old=projections.before[row.id],fresh=projections.after[row.id];
  eq(old.paragraphs,fresh.paragraphs,'Every nonempty paragraph remains complete and separate');eq(old.headings,fresh.headings,'Headings retain every word');eq(old.pre,fresh.pre,'Code retains its exact newlines');
  if(['paragraphs','heading'].includes(row.id)){eq(old.emptyParagraphs>0,true,'The original really generated an empty native paragraph');eq(fresh.emptyParagraphs,0,'The excess empty paragraph disappears');}
  else eq(old,fresh,'Poems and preformatted code retain all native spacing');
  for(const name of ['RevisaWiki_v2_14_0.js','RevisaWiki_v2_14_0_completo.js']){
   const file=path.join(root,'dist/2.14.0',name);eq(sha(fs.readFileSync(file)),runtime.files[name].sha256,'The executed runtime is pinned');const api=require(file);
   eq(api.v214ProseSpacingPlan(row.before,{...api.defaults,namespaceNumber:0}).text,row.after,'Finite repair matches the independently rendered endpoint');
  }
  report.cases++;
 }
}catch(error){report.status='failed';report.failures.push(String(error.message));}
const out=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2140'));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'spacing_native.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases,checks:report.checks,failed:report.failures.length}));if(report.failures.length)process.exitCode=1;
