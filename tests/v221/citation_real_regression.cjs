'use strict';
// Explicit local frozen source only. This runner never fetches or publishes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const [bundle,sourceFile,title='Teste de regressão',calendarUTC='2026-10-22']=process.argv.slice(2);
if(!bundle||!sourceFile)throw Error('Actual candidate and frozen local wikitext source are required');
const file=path.resolve(bundle),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),bundleSha=sha(fs.readFileSync(file)),api=require(file),
    source=fs.readFileSync(sourceFile,'utf8'),options={...api.defaults,namespaceNumber:0,pageTitle:title,contentModel:'wikitext',v216CalendarUTC:calendarUTC},
    began=performance.now(),first=api.calculate({kind:'adjust',source,originalSource:source,options}),firstGate=api.v219AutomaticResultSafety(source,first),
    second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options}),secondGate=api.v219AutomaticResultSafety(first.text,second),
    accepted=firstGate.accepted===true&&secondGate.accepted===true,idempotent=first.text===second.text;
if(sha(fs.readFileSync(file))!==bundleSha)throw Error('Candidate changed during the test');
process.stdout.write(JSON.stringify({suite:'citation-frozen-real-source',version:api.version,bundleSha256:bundleSha,sourceSha256:sha(source),
    firstSha256:sha(first.text),secondSha256:sha(second.text),actualCalculateCalls:2,actualFinalGateCalls:2,
    accepted,idempotent,status:accepted&&idempotent?'passed':'investigation-required',gates:[firstGate,secondGate],
    durationMs:performance.now()-began,firstChanges:first.changes,firstOutput:first.text,
    scope:'Actual candidate and final gates on one explicit frozen source; native rendering and broader corpus validation are separate'},null,2)+'\n');
if(!accepted||!idempotent)process.exitCode=1;
