'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const file=path.resolve(process.argv[2]||process.env.REVISAWIKI_V221_BUNDLE||''),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),
    bundleSha=sha(fs.readFileSync(file)),api=require(file),results=[],failures=[];
// Compile proof fixtures in another process: a second complete bundle can
// populate the shared legacy data namespace and must not contaminate startup.
const {cases,negatives}=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'citation_collector_prerequisite.cjs'),file,'--fixture-cases'],
    {encoding:'utf8',timeout:30000}));
if(typeof api.v221MissingDefaultCollectorPlan!=='function'||typeof api.v219AutomaticResultSafety!=='function')throw Error('The actual candidate must export both producer and final gate');
const options={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo',contentModel:'wikitext',v216CalendarUTC:'2026-10-22'};
let calculations=0,gates=0;
for(const row of [...cases.map(item=>({...item,expectation:'positive'})),...negatives.map((before,index)=>({id:'negative-'+index,before,expectation:'preserve-new-producer'}))]){
    const began=performance.now(),plan=api.v221MissingDefaultCollectorPlan(row.before,options),record={id:row.id,expectation:row.expectation,sourceSha256:sha(row.before)};
    if(row.expectation==='preserve-new-producer'){
        record.newProducerPreserved=plan.text===row.before;
        if(!record.newProducerPreserved)record.failure='false-positive-producer';
    }else{
        try{
            const result=api.calculate({kind:'adjust',source:row.before,originalSource:row.before,options});calculations++;
            const gate=api.v219AutomaticResultSafety(row.before,result);gates++;
            record.accepted=gate.accepted===true;record.gate=gate;record.outputSha256=sha(result.text);
            record.collectorCount=(result.text.match(/\{\{Referências(?:[|}])/g)||[]).length;
            if(!record.accepted||record.collectorCount!==1)record.failure='actual-calculate-or-gate';
            const corrupted={...result,text:'Outro texto.\n'+result.text},refusal=api.v219AutomaticResultSafety(row.before,corrupted);gates++;
            record.mutatedContentRefused=refusal.accepted!==true;
            if(!record.mutatedContentRefused)record.failure='mutated-content-accepted';
        }catch(error){record.failure='runtime-error';record.error=String(error);}
    }
    record.durationMs=performance.now()-began;if(record.failure)failures.push(record);results.push(record);
}
if(sha(fs.readFileSync(file))!==bundleSha)throw Error('Candidate bytes changed during the test round');
process.stdout.write(JSON.stringify({suite:'citation-collector-end-to-end',version:api.version,bundleSha256:bundleSha,
    actualCalculateCalls:calculations,actualFinalGateCalls:gates,positiveCases:cases.length,negativeCases:negatives.length,
    status:failures.length?'investigation-required':'passed',failures,results,
    scope:'Actual unmodified candidate calculation and final gate; focused producer negatives; native/browser validation is separate'},null,2)+'\n');
if(failures.length)process.exitCode=1;
