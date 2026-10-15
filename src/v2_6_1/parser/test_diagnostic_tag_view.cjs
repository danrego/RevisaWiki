'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const candidate=path.resolve(process.argv[2]||path.join(__dirname,'../../../dist/2.6.1/RevisaWiki_v2_6_1.js'));
const fixture=path.resolve(process.argv[3]||path.join(__dirname,'../fixtures/article_partial_markup.wiki'));
const api=require(candidate),cfg={namespaceNumber:0,authorityControl:false};
const report={kind:'quotation-tag-diagnostics',cases:[],checks:0,failures:[]};
function check(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function test(name,fn){try{fn();report.cases.push({name,status:'passed'});}catch(e){report.cases.push({name,status:'failed'});report.failures.push({name,message:e.message});}}

test('bold caption across an explicit closing div',()=>{
    const source="Antes\n<div align=\"center\">'''Legenda</div>'''\n{{Main|Brasil}}";
    check(api.syntaxRepairPlan(source,cfg).unresolved,[],'balanced HTML remains balanced');
    const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
    check(result.text.includes('{{Artigo principal|Brasil}}'),true,'complete trailing template is visited');
    check(result.text.includes('<div align="center">\'\'\'Legenda</div>\'\'\''),true,'crossing formatting preserved byte for byte');
    check(result.preservation,[],'existing preservation audit passes');
});

test('quoted titles do not create stray reference closers',()=>{
    const source='Antes\n<ref>"Uma fonte</ref>\n<ref name="fonte">Outra" fonte</ref>\n{{AP|Brasil}}';
    const plan=api.syntaxRepairPlan(source,cfg);
    check(plan.unresolved.filter(issue=>/syntax-(?:stray|unclosed)-tag/.test(issue.code)),[],'quote pairing cannot hide balanced reference tags');
    check(plan.text,source,'diagnostic repair never writes quotation text');
});

test('real incomplete outer tag still freezes its remaining text',()=>{
    const source='Antes\n<div>Sem fechamento\n{{Main|Brasil}}';
    const plan=api.syntaxRepairPlan(source,cfg);
    check(plan.unresolved.some(issue=>issue.code==='syntax-unclosed-tag'),true,'actual unclosed div remains unresolved');
    const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
    check(result.text.endsWith(source.slice(plan.safePrefixEnd)),true,'unresolved tail preserved');
    check(result.text.includes('{{Main|Brasil}}'),true,'no blanket rewrite within ambiguous tail');
});

test('malformed quoted examples remain opaque',()=>{
    const sources=[
        'Antes\n"Exemplo <ref>Sem fechamento"\n{{Main|Brasil}}',
        "Antes\n''Exemplo <ref>{{Citar web|titulo=Fonte|url=https://example.invalid/a}]</ref>''.",
        "Antes\n''Exemplo <ref>Fonte<\\ref>''.",
        'Antes\n"Exemplo <ref>um<ref>dois</ref></ref>"',
        'Antes\n<nowiki><div>Exemplo sem fechamento</nowiki>',
        'Antes\n<!-- <div>Exemplo sem fechamento -->',
        'Antes\n<syntaxhighlight lang="html"><div>Exemplo sem fechamento</syntaxhighlight>',
        'Antes\n{{Citação|<div>Exemplo sem fechamento}}'
    ];
    for(const source of sources){
        check(api.syntaxRepairPlan(source,cfg).text,source,'syntax repair preserves protected source');
        check(api.v25SafeRepairPlan(source,cfg).text,source,'finite safe repairs preserve protected source');
    }
});

test('unclosed actual reference does not pass independent balance',()=>{
    const source='Antes\n<ref>Texto\n\n== Seção ==\n{{Main|Brasil}}';
    const plan=api.syntaxRepairPlan(source,cfg);
    check(plan.unresolved.some(issue=>issue.code==='syntax-unclosed-tag'),true,'actual unclosed ref stays unresolved');
    check(plan.text,source,'no guessed reference closer');
});

test('paired quote containing balanced literal HTML stays unchanged',()=>{
    const source='Antes\n"Exemplo <span>literal</span>"\n{{Main|Brasil}}';
    const plan=api.syntaxRepairPlan(source,cfg);
    check(plan.unresolved,[],'balanced quoted tags remain balanced');
    check(plan.text,source,'no source mutation in diagnostics');
});

test('fresh article is no longer reduced to its first two templates',()=>{
    const source=fs.readFileSync(fixture,'utf8'),plan=api.syntaxRepairPlan(source,cfg);
    check(plan.unresolved,[],'all actual tags are complete');
    check(plan.safePrefixEnd,source.length,'complete page scope retained');
    check(plan.text,source,'no source-level syntax alteration needed');
    const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
    check(api.translationAudit(result.text).filter(f=>f.code==='foreign-template'&&/^(?:AP|Main)\b/.test(result.text.slice(f.start+2,f.end))),[],'all AP/Main calls migrated');
    check((result.text.match(/\{\{Artigo principal\|/g)||[]).length,5,'all five article links retained');
    check(result.preservation,[],'existing preservation audit passes');
    check(result.warnings.some(message=>/O código incompleto e tudo/.test(message)),false,'obsolete false warning absent');
    check(api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg}).text,result.text,'result idempotent');
});

report.status=report.failures.length?'failed':'passed';
console.log(JSON.stringify(report,null,2));
if(process.env.REVISAWIKI_REPORT_DIR){fs.mkdirSync(process.env.REVISAWIKI_REPORT_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.REVISAWIKI_REPORT_DIR,'diagnostic_tag_view.json'),JSON.stringify(report,null,2)+'\n');}
if(report.failures.length)process.exitCode=1;
