'use strict';
const {fs,path,assert,sha,load:loadFrozen,report:makeReport,finish}=require('./engine.cjs');
const actual=true,report=makeReport('corpus-regressions');
function load(name){const frozen=loadFrozen(name);report[name]=frozen.sha256;return frozen.api;}
function check(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
const sources=JSON.parse(fs.readFileSync(path.join(__dirname,'regression_sources.json'),'utf8'));
try{for(const name of ['RevisaWiki_v2_6.js','RevisaWiki_v2_6_completo.js']){const api=load(name);for(const item of sources){const entry=item,before=fs.readFileSync(path.join(__dirname,entry.file),'utf8'),cfg={namespaceNumber:0,pageTitle:item.title,authorityControl:false,endTemplateOrder:false,minorBaseConfirmed:false},plan=api.v25ApprovedSyntaxPlan(before,cfg);check(sha(before),entry.sha256,item.title+' immutable source');
    const result=api.calculate({kind:'adjust',source:actual?before:plan.text,originalSource:before,options:cfg}),proof=api.syntaxRepairSourceProof(before,result.text,cfg);check(proof.accepted,true,item.title+' strict source proof '+proof.reason);check(api.preservationAudit(before,result.text,cfg),[],item.title+' no false lost-data warning');check(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,item.title+' idempotent');check(api.syntaxAudit(result.text),[],item.title+' syntax intact');check(api.safeComposition(before,result.text),'',item.title+' composition');
    report.cases.push({bundle:name,title:item.title,revid:item.revid,sourceSha256:entry.sha256,outputSha256:sha(result.text),newRepairSteps:plan.safe.steps.map(s=>s.name),status:'passed'});
    if(item.revid===73045540){const first='<ref name="ref-auto-4" />',second='<ref name="ref-auto-5" />';check(result.text.includes(first)&&result.text.includes(second),true,'both frozen generated bindings exist');const mutations=[
        ['balanced two binding swap',result.text.replace(first,'UNIQUE_REFERENCE_SWAP_TOKEN').replace(second,first).replace('UNIQUE_REFERENCE_SWAP_TOKEN',second)],
        ['lost exact DOI literal',result.text.replace('https://doi.org/10.1590/1981.81222019000300012','https://doi.org/10.1590/CHANGED')],
        ['wrong single binding',result.text.replace(first,second)],
        ['missing one occurrence',result.text.replace(first,'')],
        ['changed group',result.text.replace(first,'<ref name="ref-auto-4" group="nota" />')]
    ];for(const [label,mutated]of mutations){check(mutated===result.text,false,label+' mutation is real');check(api.syntaxRepairSourceProof(before,mutated,cfg).accepted,false,label+' cannot borrow source repair authorization');check(api.preservationAudit(before,mutated,cfg).some(f=>f.code==='lost-repaired-reference'),true,label+' visible preservation guard');check(api.safeComposition(before,mutated).length>0,true,label+' composition blocks mutation');report.cases.push({bundle:name,title:item.title,name:label,kind:'frozen-negative-binding-contract',status:'passed'});}}
} }report.status='passed';}catch(error){report.status='failed';report.failures.push({message:error.message,stack:error.stack});process.exitCode=1;}
finish(report,'corpus-regressions');
