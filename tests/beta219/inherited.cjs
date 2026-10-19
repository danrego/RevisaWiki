'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),version='2.19.0-beta.1',sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const files=['RevisaWiki_v2_19_0_beta_1.js','RevisaWiki_v2_19_0_beta_1_completo.js'].map(x=>path.join(root,'dist',version,x));
const suites=['prose_gap_cases','reference_layout_cases','citation_island_cases','legacy_markup_cases','independent_cases','source_coverage_cases'];
const report={version,status:'running',runs:[],wikipediaWrites:0,mainValidationResumed:false};
for(const name of suites){
 const suite=path.join(root,'tests/v218',name+'.cjs'),result=cp.spawnSync(process.execPath,[suite,...files],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
 let observed=null;try{observed=JSON.parse(result.stdout);}catch{}
 const item={suite:'tests/v218/'+name+'.cjs',runnerSha256:sha(fs.readFileSync(suite)),exitCode:result.status,result:observed,stderr:(result.stderr||'').replaceAll(root,'<checkout>')};
 if(result.status!==0||observed?.status!=='passed'||observed?.failures?.length)report.status='failed';
 report.runs.push(item);process.stderr.write(name+': '+(result.status===0?'passed':'failed')+'\n');
}
if(report.status==='running')report.status='passed';
const out=path.join(root,'tests/evidence',version);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'inherited.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({version,status:report.status,runs:report.runs.map(x=>({suite:x.suite,exitCode:x.exitCode,cases:Array.isArray(x.result?.cases)?x.result.cases.length:x.result?.cases,checks:x.result?.checks}))}));if(report.status!=='passed')process.exitCode=1;
