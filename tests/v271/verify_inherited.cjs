'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),proof=JSON.parse(fs.readFileSync(path.join(__dirname,'ADAPTATION_PROVENANCE.json'),'utf8'));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');let checks=0;
function check(actual,expected,label){checks++;assert.deepEqual(actual,expected,label);}
function once(text,old,replacement){check(text.split(old).length-1,1,'Exact adaptation anchor');return text.replace(old,replacement);}
function adapt(name,text){
 let result=text.replaceAll('2.7.0','2.7.1').replaceAll('_v2_7','_v2_7_1').replaceAll('v270','v271');
 if(name==='run_edited_corpus.cjs')result=once(result,"path.join(__dirname, 'fixtures/large_articles/manifest.json')","path.join(root, 'tests/v27/fixtures/large_articles/manifest.json')");
 if(name==='candidate.cjs')result=once(result,"mapping={'RevisaWiki_v2_6.js':'RevisaWiki_v2_7_1.js','RevisaWiki_v2_6_completo.js':'RevisaWiki_v2_7_1_completo.js'}","mapping={'RevisaWiki_v2_6.js':'RevisaWiki_v2_7_1.js','RevisaWiki_v2_6_completo.js':'RevisaWiki_v2_7_1_completo.js','RevisaWiki_v2_7.js':'RevisaWiki_v2_7_1.js','RevisaWiki_v2_7_completo.js':'RevisaWiki_v2_7_1_completo.js'}");
 if(name==='run_all.cjs'){
  result=once(result,"['run_startup.cjs'","['verify_inherited.cjs','run_startup.cjs'");
  result=once(result,"'run_engine.cjs','summarize.cjs'",proof.additionalRunners.map(value=>"'"+value+"'").join(',')+",'run_engine.cjs','summarize.cjs'");
 }
 if(name==='summarize.cjs')result=once(result,"'contracts.json'",proof.additionalReports.map(value=>"'"+value+"'").join(',')+",'contracts.json'");
 return result;
}
check(sha(fs.readFileSync(path.join(root,proof.baselineManifest))),proof.baselineManifestSha256,'Original release manifest remains exact');
const files=[];
for(const record of proof.files){
 const source=fs.readFileSync(path.join(root,record.source)),target=fs.readFileSync(path.join(root,record.target));
 check(sha(source),record.sourceSha256,record.source+' unchanged');check(sha(target),record.targetSha256,record.target+' adapter integrity');
 check(target.toString('utf8'),adapt(path.basename(record.source),source.toString('utf8')),record.target+' allowed adaptation only');files.push({source:record.source,target:record.target,sourceSha256:record.sourceSha256,targetSha256:record.targetSha256});
}
for(const record of proof.fixtureCopies||[]){const source=fs.readFileSync(path.join(root,record.source)),target=fs.readFileSync(path.join(root,record.target));check(sha(source),record.sha256,'Frozen fixture source unchanged');check(sha(target),record.sha256,'Fixture copy exact');check(target,source,'Fixture source bytes preserved');}
const output={version:'2.7.1',kind:'inherited-suite-adaptation-integrity',status:'passed',baselineManifestSha256:proof.baselineManifestSha256,files,checks,networkRequests:0,wikipediaWrites:0};
const directory=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v271'));fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'inheritance_adaptation.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({kind:output.kind,status:output.status,files:files.length,checks}));
