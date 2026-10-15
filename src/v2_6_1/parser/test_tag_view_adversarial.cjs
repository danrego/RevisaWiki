'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const candidate=path.resolve(process.argv[2]||path.join(__dirname,'../../../dist/2.6.1/RevisaWiki_v2_6_1.js'));
const api=require(candidate),cfg={namespaceNumber:0,authorityControl:false};
const report={kind:'quotation-tag-adversarial',cases:[],checks:0,failures:[]};
function check(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function test(name,fn){try{fn();report.cases.push({name,status:'passed'});}catch(e){report.cases.push({name,status:'failed'});report.failures.push({name,message:e.message});}}
function calculate(source){return api.calculate({kind:'adjust',source,originalSource:source,options:cfg});}

const delimiters=[['"','"'],["''","''"],["'''","'''"],["'''''","'''''"],['«','»'],['“','”']];
for(const [index,[open,close]]of delimiters.entries())for(const paired of [false,true]){
    const collector=paired?'<references group="nota"></references>':'<references group="nota"/>';
    test('quoted collectors remain literal '+index+' '+paired,()=>{
        const quoted=open+collector+collector+close,source='Antes\n'+quoted;
        check(api.v25SafeRepairPlan(source,cfg).text,source,'no safe repair inside quoted collector example');
        const result=calculate(source);
        check(result.text,source,'full engine preserves both quoted collectors exactly');
        check(calculate(result.text).text,result.text,'quoted example idempotent');
        check(result.preservation,[],'preservation audit accepts unchanged protected example');
    });
    test('quoted collectors and real collectors stay separate '+index+' '+paired,()=>{
        const quoted=open+collector+collector+close,source='Antes\n'+quoted+'\n\n'+collector+'\n'+collector;
        const safe=api.v25SafeRepairPlan(source,cfg);
        check(safe.text.includes(quoted),true,'quoted example retained byte for byte');
        check(safe.text.endsWith(collector+'\n'),true,'actual duplicate removed separately');
        check(safe.steps.filter(step=>step.name==='adjacent-empty-collectors').flatMap(step=>step.edits).length,1,'one outside duplicate only');
        check(api.syntaxRepairSourceProof(source,safe.text,cfg).accepted,true,'object and reference proof accepts intended outside repair');
    });
}

for(const [index,[open,close]]of delimiters.entries()){
    test('duplicate attributes in quoted references stay literal '+index,()=>{
        const source='Antes\n'+open+'<ref name="a" name="a">Fonte</ref>'+close;
        check(api.v25SafeRepairPlan(source,cfg).text,source,'duplicate-attribute repair respects original quote masks');
        check(api.syntaxRepairPlan(source,cfg).text,source,'legacy syntax does not alter quotation');
    });
    test('nested quoted references stay literal '+index,()=>{
        const source='Antes\n'+open+'<ref>Um<ref>Dois</ref></ref>'+close;
        check(api.v25SafeRepairPlan(source,cfg).text,source,'raw nested references do not enable restoration');
        check(api.syntaxRepairPlan(source,cfg).text,source,'quoted nesting stays untouched');
    });
}

for(const [index,source]of [
    '<span title="<ref>">\'\'Texto</span>\'\'',
    '<span title="<references group=\'nota\'/>">\'\'Texto</span>\'\'',
    '<span title="<table>">\'\'Texto</span>\'\'',
    '<div>\'\'Texto</div>\'\'\n<nowiki><ref>Exemplo</nowiki>',
    '<div>\'\'Texto</div>\'\'\n<!-- <ref>Exemplo -->',
    '<div>\'\'Texto</div>\'\'\n<syntaxhighlight lang="html"><ref>Exemplo</syntaxhighlight>',
    '<div>\'\'Texto</div>\'\'\n{{Citação|<ref>Exemplo}}',
    '<div>\'\'Texto</div>\'\'\n <ref>Exemplo preformatado'
].entries())test('tag attributes and opaque contexts '+index,()=>{
    const plan=api.syntaxRepairPlan(source,cfg);
    check(plan.text,source,'diagnostic tag view does not change source');
    check(plan.unresolved.filter(issue=>/syntax-(?:unclosed|stray)-tag/.test(issue.code)),[],'literal tags in attributes or opaque blocks do not enter HTML stack');
    check(api.v25SafeRepairPlan(source,cfg).text,source,'safe repairs do not touch opaque content');
});

for(const [index,source]of [
    'Antes\n<div>\'\'Texto\'\'\n{{Main|Brasil}}',
    'Antes\n<span>\'\'Texto</div>\'\'\n{{Main|Brasil}}',
    'Antes\n<ref>Texto\n\n== Seção ==\n{{Main|Brasil}}',
    'Antes\n<ref>Um<ref>Dois</ref></ref>\n{{Main|Brasil}}',
    'Antes\n<small>Um</small extra=x>\n{{Main|Brasil}}'
].entries())test('actual incomplete or invalid HTML remains guarded '+index,()=>{
    const plan=api.syntaxRepairPlan(source,cfg);
    check(plan.unresolved.length>0,true,'real malformed context remains unresolved');
    check(plan.text,source,'no guessed malformed context repair');
    const result=calculate(source);
    check(result.text.endsWith(source.slice(plan.safePrefixEnd)),true,'unresolved source suffix preserved');
});

test('all finite syntax repair classes stay outside a quoted example',()=>{
    const examples=[
        '"<ref>Fonte<\\ref>"',
        "''{{Citar web|titulo=Fonte|url=https://example.invalid/a}]''",
        '«<ref name="a"/><ref name="a"/>»',
        '“<references group="nota"/><references group="nota"/>”',
        '<nowiki><ref name="a" name="a">Fonte</ref></nowiki>',
        '<!-- <ref name="a" name="a">Fonte</ref> -->',
        '<pre><references group="nota"/><references group="nota"/></pre>'
    ];
    for(const example of examples){
        const source='Antes\n'+example;
        check(api.syntaxRepairPlan(source,cfg).text,source,'legacy syntax repair preserves literal example');
        check(api.v25SafeRepairPlan(source,cfg).text,source,'new syntax repair preserves literal example');
    }
});

report.status=report.failures.length?'failed':'passed';
console.log(JSON.stringify(report,null,2));
if(process.env.REVISAWIKI_REPORT_DIR){fs.mkdirSync(process.env.REVISAWIKI_REPORT_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.REVISAWIKI_REPORT_DIR,'tag_view_adversarial.json'),JSON.stringify(report,null,2)+'\n');}
if(report.failures.length)process.exitCode=1;
