'use strict';
// Replays retained metadata against the actual candidate. No network or
// synthetic asynchronous proof context is used by this runtime test.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const [bundle,metadataDirectory,planFile]=process.argv.slice(2);if(!bundle||!metadataDirectory||!planFile)throw Error('Candidate, retained metadata directory and frozen plan are required');
const file=path.resolve(bundle),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),bundleSha=sha(fs.readFileSync(file)),api=require(file),
    plan=JSON.parse(fs.readFileSync(planFile,'utf8')),rows=plan.candidates.find(row=>row.id==='C3REF-EXT-TITLE').sourceEvidence,
    index=JSON.parse(fs.readFileSync(path.join(metadataDirectory,'INDEX.json'),'utf8')),results=[],failures=[];
let calculations=0,gates=0,checks=0;
for(const [ordinal,row]of rows.entries()){
    const entry=index.find(item=>item.doi.toLowerCase()===row.doi.toLowerCase());assert.ok(entry);checks++;
    assert.equal(path.basename(entry.file),entry.file);checks++;
    const raw=fs.readFileSync(path.join(metadataDirectory,entry.file),'utf8');assert.equal(sha(raw),row.metadataSha256);checks++;
    for(const quote of ['quoted','unquoted']){
        const call='{{Citar periódico|título='+row.capturedTitle+'|'+row.followingUnknownArgument+'|periodico=Periódico|doi='+row.doi+'}}',
            source='Texto.<ref name='+ (quote==='quoted'?'"fonte"':'fonte') +'>'+call+'</ref>\n\n{{Referências}}\n',
            options={...api.defaults,namespaceNumber:0,pageTitle:'Teste de metadados',contentModel:'wikitext',v216CalendarUTC:'2026-10-23'},
            request=api.v221CitationTitleRequests(source,options)[0],proof=api.v221CitationTitleMetadataProof(source,request,raw);
        assert.ok(proof);checks++;
        for(const mode of ['qualified','missing-proof','stale-proof']){
            const cfg={...options,v221DOITitleProofs:mode==='missing-proof'?[]:[mode==='stale-proof'?{...proof,sourceHash:'stale'}:proof]},
                began=performance.now(),result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
            const gate=api.v219AutomaticResultSafety(source,result);gates++;
            const record={id:'retained-doi-'+ordinal+'-'+quote+'-'+mode,sourceSha256:sha(source),metadataSha256:sha(raw),
                outputSha256:sha(result.text),accepted:gate.accepted===true,gate,durationMs:performance.now()-began};
            const repaired=result.text.includes(row.confirmedTitle)&&!result.text.includes(row.capturedTitle+'|'+row.followingUnknownArgument);
            if(mode==='qualified'){
                if(!record.accepted||!repaired||quote==='unquoted'&&!result.text.includes('<ref name="fonte">'))record.failure='qualified-composition-not-applied';
                const forged={...result,text:result.text.replace(row.confirmedTitle,'Título diferente sem prova')},refusal=api.v219AutomaticResultSafety(source,forged);gates++;
                record.changedTitleRefused=refusal.accepted!==true;if(!record.changedTitleRefused)record.failure='changed-title-accepted';
            }else if(repaired)record.failure='missing-or-stale-proof-used';
            if(record.failure)failures.push(record);results.push(record);
        }
    }
}
assert.equal(sha(fs.readFileSync(file)),bundleSha);checks++;
process.stdout.write(JSON.stringify({suite:'citation-retained-metadata-end-to-end',version:api.version,bundleSha256:bundleSha,checks,
    actualCalculateCalls:calculations,actualFinalGateCalls:gates,status:failures.length?'investigation-required':'passed',failures,results,
    scope:'Actual unmodified candidate with retained checksum-verified DOI metadata and quote-prerequisite composition; no external network or browser claim'},null,2)+'\n');
if(failures.length)process.exitCode=1;
