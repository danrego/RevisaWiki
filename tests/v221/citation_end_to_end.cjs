'use strict';
// Uses the actual candidate file, without injecting test exports or rewriting it.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const bundle=path.resolve(process.argv[2]||process.env.REVISAWIKI_V221_BUNDLE||'');
if(!fs.existsSync(bundle)||!fs.statSync(bundle).isFile())throw Error('An actual candidate bundle is required');
// The focused compiler must not populate the data singleton in the actual
// candidate process. Generate fixtures in isolation, then boot the core once.
const {cases,negatives}=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'citation_contracts.cjs'),'--fixture-cases'],
    {encoding:'utf8',timeout:30000,env:{...process.env,REVISAWIKI_V221_BUNDLE:bundle}}));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),bundleSha=sha(fs.readFileSync(bundle)),api=require(bundle);
if(typeof api.calculate!=='function'||typeof api.v219AutomaticResultSafety!=='function')throw Error('Actual calculation and final gate are required');
const results=[],failures=[],options={...api.defaults,namespaceNumber:0,pageTitle:'Teste de contrato',contentModel:'wikitext',v216CalendarUTC:'2026-10-23'};
for(const row of [...cases.map(item=>({...item,expectation:'new-positive'})),...negatives.map((item,index)=>({...item,id:'negative-'+index,expectation:'new-plan-preserves'}))]){
    const source=row.source,began=performance.now();let result,gate,error;
    try{result=api.calculate({kind:'adjust',source,originalSource:source,options});gate=api.v219AutomaticResultSafety(source,result);}
    catch(caught){error=String(caught);}
    const receipt={id:row.id,expectation:row.expectation,sourceSha256:sha(source),outputSha256:typeof result?.text==='string'?sha(result.text):null,
        accepted:gate?.accepted===true,gate,error,durationMs:performance.now()-began,changed:typeof result?.text==='string'&&result.text!==source};
    if(error||!gate?.accepted)receipt.failure='actual-calculate-or-gate';
    else if(row.after&&!result.text.includes(row.after))receipt.failure='qualified-repair-not-reached-or-following-stage-changed-call';
    if(receipt.failure)failures.push(receipt);results.push(receipt);
}
if(sha(fs.readFileSync(bundle))!==bundleSha)throw Error('Candidate bytes changed during execution; this test round has no pinned result');
const report={suite:'citation-end-to-end',version:api.version,bundleSha256:bundleSha,actualCalculateCalls:results.length,actualFinalGateCalls:results.filter(row=>row.gate!==undefined).length,
    positiveCases:cases.length,negativeCases:negatives.length,status:failures.length?'investigation-required':'passed',failures,results,
    scope:'Actual candidate calculate and final safety on bounded citation fixtures; not a native/browser or corpus claim'};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(failures.length)process.exitCode=1;
