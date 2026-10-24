'use strict';
// Actual candidate gates must not accept a new empty reference section merely
// because a literal tag occurs in a syntactically known infobox parameter.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const file=path.resolve(process.argv[2]||process.env.REVISAWIKI_V221_BUNDLE||''),
    sha=value=>crypto.createHash('sha256').update(value).digest('hex'),bundleSha=sha(fs.readFileSync(file)),api=require(file),
    cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',v216CalendarUTC:'2026-10-22'},
    wrap=box=>box+'\n\nTexto.\n\n[[Categoria:Exemplos]]',
    boxes=[
        ['conditional-consumed','{{Info/Político|nome=Tema fictício|vice_título2=Rótulo<ref name="A">Fonte.</ref>}}'],
        ['ignored-alias','{{Info/Político|nome=Tema fictício|vice-título2=Rótulo<ref name="A">Fonte.</ref>}}'],
        ['ignored-alias-conflict','{{Info/Político|nome=Tema fictício|vice-título2=Rótulo<ref name="A">Fonte.</ref>|vice_título2=Outro}}'],
        ['visible-native-field','{{Info/Biografia|nome=Tema fictício|ocupação=Profissão<ref name="A">Fonte.</ref>}}']
    ],cases=[],results=[],failures=[];
for(const [id,box]of boxes){
    cases.push({id:id+'-alone',source:wrap(box),expectation:'preserve-without-unconfirmed-rendering'});
    cases.push({id:id+'-existing-collector',source:wrap(box)+'\n\n{{Referências}}',expectation:'existing-collector'});
    if(id==='conditional-consumed'||id==='visible-native-field')cases.push({id:id+'-visible-body',
        source:wrap(box).replace('Texto.','Texto.<ref>Fonte visível no corpo.</ref>'),expectation:'body-reference'});
}
for(const row of cases){
    const began=performance.now(),record={id:row.id,expectation:row.expectation,sourceSha256:sha(row.source)};
    try{
        const plan=api.v221MissingDefaultCollectorPlan(row.source,cfg),result=api.calculate({kind:'adjust',source:row.source,originalSource:row.source,options:cfg}),
            gate=api.v219AutomaticResultSafety(row.source,result),applied=gate.accepted?result.text:row.source;
        Object.assign(record,{accepted:gate.accepted===true,gate,appliedSha256:sha(applied),proposalSha256:sha(result.text),
            collectorPlanChanges:plan.edits.length,collectorCount:(applied.match(/\{\{Referências(?:[|}])/g)||[]).length,
            sourcePreserved:applied===row.source});
        if(row.expectation==='preserve-without-unconfirmed-rendering'){
            if(plan.text!==row.source||applied!==row.source)record.failure='unconfirmed-infobox-only-reference-was-applied';
        }else if(!record.accepted||record.collectorCount!==1)record.failure='known-existing-or-body-collector-not-accepted';
        if(row.expectation==='body-reference'){
            const stale=row.source.replace('Fonte visível no corpo.','Outra fonte no corpo.');
            record.staleSourceProofRefused=!api.v221MissingDefaultCollectorProof(stale,plan.text,plan,cfg);
            if(!record.staleSourceProofRefused)record.failure='collector-proof-accepted-on-other-source';
        }
    }catch(error){record.failure='runtime-error';record.error=String(error);}
    record.durationMs=performance.now()-began;if(record.failure)failures.push(record);results.push(record);
}
if(sha(fs.readFileSync(file))!==bundleSha)throw Error('Candidate bytes changed during execution');
process.stdout.write(JSON.stringify({suite:'citation-collector-rendering-scope',version:api.version,bundleSha256:bundleSha,
    actualCalculateCalls:results.length,actualFinalGateCalls:results.filter(row=>row.gate).length,status:failures.length?'investigation-required':'passed',
    failures,results,scope:'Actual unmodified candidate; native rendering evidence is retained separately, and inactive or unconfirmed infobox-only references remain conservative.'},null,2)+'\n');
if(failures.length)process.exitCode=1;
