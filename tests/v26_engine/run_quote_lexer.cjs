'use strict';
const {fs,path,assert,sha,load:loadFrozen,report:makeReport,finish}=require('./engine.cjs');
const report=makeReport('quote-lexer'),cfg={namespaceNumber:0,authorityControl:false,endTemplateOrder:false,pageTitle:'Ken Jennings',minorBaseConfirmed:false,infoboxes:false};
function load(name){const frozen=loadFrozen(name);report[name]=frozen.sha256;return frozen.api;}
function check(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
try{for(const bundle of ['RevisaWiki_v2_6.js','RevisaWiki_v2_6_completo.js']){const api=load(bundle);
    const protectedExamples=[
        "Texto ''Obra<ref>''Título''</ref>''.",
        "Texto '''Obra<ref>''Título''</ref>'''.",
        "Texto '''''Obra<ref>''Título''</ref>'''''.",
        "Texto ''Exemplo <ref>{{Citar web|titulo=Fonte|url=https://example.invalid/a}]</ref>''.",
        "Texto ''Exemplo <ref>{{Citar web|titulo=''Interno''|url=https://example.invalid/a}]</ref>''.",
        "Texto ''Exemplo <ref>Fonte''.",
        "Texto ''Exemplo <ref>{{Citar web|titulo=Fonte|url=https://example.invalid/a}]''.",
        "Texto ''Exemplo <ref name=\"a\"/>''.",
        "Texto ''Exemplo <ref><ref>Fonte</ref></ref>''.",
        "Texto ''Exemplo <ref group=\"nota\">''Interno''</ref>''.",
        "Texto ''Exemplo <ref>Fonte<\\ref>''.",
        "Texto ''Exemplo <ref>Fonte\n</ref>''.",
        "Texto ''Exemplo <ref name=\"{{PAGENAME}}\">Fonte</ref>''."
    ];
    for(const source of protectedExamples){check(api.v25SafeRepairPlan(source,cfg).text,source,'quoted example stays literal '+source.slice(0,60));check(api.syntaxRepairPlan(source,cfg).text,source,'old syntax pass does not edit quoted example '+source.slice(0,60));report.cases.push({bundle,name:source.slice(0,80),kind:'opaque-quoted-example',status:'passed'});}
    const validTitles=["''Livro''","Livro ''A''","'Jeopardy!' host","Apresentador de ''Jeopardy!'', Ken cria ''Kennections''","'''Autor''' e ''Livro''","''IPF's''"];
    for(const title of validTitles){const source='<ref>{{Citar web|titulo='+title+'|url=https://example.invalid/a}}</ref>';check(api.syntaxRepairPlan(source,cfg).unresolved,[],'title markup never strands ref/template delimiters '+title);report.cases.push({bundle,name:title,kind:'reference-title-markup',status:'passed'});}
    const sourceEntry=JSON.parse(fs.readFileSync(path.join(__dirname,'regression_sources.json'),'utf8')).find(x=>x.revid===73139500),before=fs.readFileSync(path.join(__dirname,sourceEntry.file),'utf8'),derived=JSON.parse(fs.readFileSync(path.join(__dirname,'derived_fixture.json'),'utf8')),observed=fs.readFileSync(path.join(__dirname,derived.file),'utf8');check(sha(observed),derived.sha256,'frozen legacy output');
    check(sha(before),sourceEntry.sha256,'Ken frozen source');check(api.syntaxRepairPlan(before,cfg).unresolved,[],'Ken original syntax scope');check(api.syntaxRepairPlan(observed,cfg).unresolved,[],'Ken already-validated legacy output has no phantom closer');const result=api.calculate({kind:'adjust',source:before,originalSource:before,options:cfg});check(result.text,observed,'Ken page output remains byte-identical to existing2.4/04 cleanup');check(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'Ken idempotent');check(api.syntaxRepairSourceProof(before,result.text,cfg).accepted,true,'Ken full canonical object proof');check(result.preservation,[],'Ken no false data-loss warning');check(api.syntaxAudit(result.text),[],'Ken ordinary syntax audit unchanged');report.cases.push({bundle,name:'Ken Jennings oldid73139500',kind:'real-frozen-lexer-regression',sourceSha256:sha(before),outputSha256:sha(result.text),status:'passed'});
    const bad="Texto ''Obra<ref>''Título''</ref>''.\n{{Portal|Biologia}]",plan=api.v25ApprovedSyntaxPlan(bad,cfg);check(api.syntaxRepairSourceProof(bad,plan.text.replace('Biologia','Física'),cfg).accepted,false,'changed recovered template still rejected');check(api.preservationAudit(bad,plan.text.replace('Título','Outro'),cfg).some(f=>f.code==='lost-repaired-reference'||f.code==='lost-prose'||f.code==='lost-protected'),true,'changed reference example still rejected by existing content guards');report.cases.push({bundle,name:'destructive mutation guards remain',kind:'negative-inventory',status:'passed'});
}report.status='passed';}catch(error){report.status='failed';report.failures.push({message:error.message,stack:error.stack});process.exitCode=1;}
finish(report,'quote-lexer');
