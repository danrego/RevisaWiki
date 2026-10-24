'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const file=path.resolve(process.argv[2]||process.env.REVISAWIKI_V221_BUNDLE||''),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),
    bundleSha=sha(fs.readFileSync(file)),api=require(file),base='{{Citar livro|título=Obra|edicao=1ª ed.|edition=1ª ed.}}',
    full=raw=>'Texto.<ref>'+raw+'</ref>\n\n{{Referências}}\n',cases=[
        {id:'same-native-alias-value',source:full(base),expectSuffix:true},
        {id:'same-native-key-value',source:full(base.replace('edition=','edicao=')),expectSuffix:true},
        {id:'pinned-native-redirect',source:full(base.replace('Citar livro','Cite book')),expectSuffix:true},
        {id:'native-ascii-value-padding',source:full(base.replace('edition=1ª ed.','edition=1ª ed. \t')),expectSuffix:true},
        {id:'three-native-alias-values',source:full(base.replace('}}','|ed=1ª ed.}}')),expectSuffix:true},
        {id:'repeated-identical-native-owners',source:'Texto.<ref>'+base+'</ref> Mais texto.<ref>'+base+'</ref>\n\n{{Referências}}\n',expectSuffix:true},
        {id:'different-edition-values',source:full(base.replace('edition=1ª ed.','edition=2ª ed.')),expectSuffix:false},
        {id:'homonymous-cannot-lend-to-conflict',source:full(base.replace('edition=1ª ed.','edition=2ª ed.'))+'\n'+full('{{Citar livro|título=Obra|edicao=1ª ed.}}'),expectSuffix:false},
        {id:'distinct-isbn-bindings',source:full(base.replace('título=Obra','título=Obra|isbn=9780306406157'))+'\n'+full('{{Citar livro|título=Obra|isbn=9788535902775|edicao=2ª ed.}}'),expectSuffix:true}
    ],options={...api.defaults,namespaceNumber:0,pageTitle:'Teste de edição bibliográfica',contentModel:'wikitext',v216CalendarUTC:'2026-10-23'},results=[],failures=[];
let calculations=0,gates=0;
for(const row of cases){
    const began=performance.now(),first=api.calculate({kind:'adjust',source:row.source,originalSource:row.source,options});calculations++;
    const firstGate=api.v219AutomaticResultSafety(row.source,first);gates++;
    const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});calculations++;
    const secondGate=api.v219AutomaticResultSafety(first.text,second);gates++;
    const record={id:row.id,sourceSha256:sha(row.source),firstSha256:sha(first.text),secondSha256:sha(second.text),
        firstAccepted:firstGate.accepted===true,secondAccepted:secondGate.accepted===true,idempotent:first.text===second.text,
        gates:[firstGate,secondGate],durationMs:performance.now()-began};
    if(!record.firstAccepted||!record.secondAccepted||!record.idempotent)record.failure='calculation-gate-or-convergence';
    if(row.expectSuffix&&first.text.includes('1ª ed.'))record.failure='qualified-first-pass-incomplete';
    if(!row.expectSuffix&&!first.text.includes('1ª ed.'))record.failure='conflicting-original-borrowed-eligibility';
    if(record.failure)failures.push(record);results.push(record);
}
if(sha(fs.readFileSync(file))!==bundleSha)throw Error('Candidate changed during the test');
process.stdout.write(JSON.stringify({suite:'citation-edition-two-pass-convergence',version:api.version,bundleSha256:bundleSha,actualCalculateCalls:calculations,
    actualFinalGateCalls:gates,status:failures.length?'investigation-required':'passed',failures,results,
    scope:'Actual candidate calculation and final gates for source-bound Edition composition and two-pass convergence'},null,2)+'\n');
if(failures.length)process.exitCode=1;
