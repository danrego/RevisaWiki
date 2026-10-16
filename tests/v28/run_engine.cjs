'use strict';
// Original assertions and fixtures are copied unchanged to a disposable folder.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const candidate=require('./candidate.cjs'),complex=process.argv.includes('--complex');
candidate.verify();
const source=path.join(candidate.root,'tests/v26_engine'),stage=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-qa-'));
const selected=complex?['run_complex_all.cjs']:['run_contracts.cjs','run_integration.cjs','run_composition_options.cjs','run_quote_lexer.cjs','run_corpus_regressions.cjs'];
const originalAssertions=[],results=[];
try {
 fs.cpSync(source,stage,{recursive:true});
 for(const name of fs.readdirSync(source).filter(name=>name.endsWith('.cjs')&&name!=='engine.cjs')){
  const original=fs.readFileSync(path.join(source,name)),copied=fs.readFileSync(path.join(stage,name));
  if(!original.equals(copied))throw new Error('An inherited assertion file changed during staging: '+name);
  originalAssertions.push({file:'tests/v26_engine/'+name,sha256:candidate.sha(original)});
 }
 // This generated local file is never included in the repository or a release.
 fs.writeFileSync(path.join(stage,'engine.cjs'),'module.exports=require('+JSON.stringify(path.join(__dirname,'engine_helper.cjs'))+');\n');
 for(const name of selected){
  const run=spawnSync(process.execPath,[path.join(stage,name)],{cwd:stage,env:{...process.env,REVISAWIKI_REPORT_DIR:candidate.artifactDirectory()},encoding:'utf8',maxBuffer:8*1024*1024});
  process.stdout.write(candidate.sanitized(run.stdout||'',[stage]));process.stderr.write(candidate.sanitized(run.stderr||'',[stage]));
  results.push({file:'tests/v26_engine/'+name,exitCode:run.status,error:run.error?candidate.sanitized(run.error.message,[stage]):undefined});
  if(run.status!==0){process.exitCode=1;break;}
 }
} finally {
 fs.rmSync(stage,{recursive:true,force:true});
 const report={version:candidate.manifest.version,kind:'unchanged-inherited-assertions-candidate-adapter',complex,frozenFiles:candidate.manifest.files,originalAssertionFiles:originalAssertions,results,networkRequests:0,wikipediaWrites:0};
 fs.writeFileSync(path.join(candidate.artifactDirectory(),complex?'engine_complex_adapter.json':'engine_adapter.json'),JSON.stringify(report,null,2)+'\n');
}
