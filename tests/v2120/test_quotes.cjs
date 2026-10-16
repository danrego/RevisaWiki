'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const candidate=require('./candidate.cjs');
const script=process.env.REVISAWIKI_SCRIPT||path.join(candidate.root,'dist/2.12.0/RevisaWiki_v2_12_0_completo.js');
if(!process.env.REVISAWIKI_SCRIPT)candidate.verify();
const api=require(path.resolve(script)),cfg={namespaceNumber:0,authorityControl:false};
const report={version:api.version,kind:'quotation-structure-boundaries',frozenFiles:process.env.REVISAWIKI_SCRIPT?undefined:candidate.manifest.files,bundles:[{file:path.basename(script),version:api.version,sha256:candidate.sha(fs.readFileSync(script))}],cases:[],assertions:0,failures:[],networkRequests:0,wikipediaWrites:0};
function check(value,expected,label){report.assertions++;assert.deepEqual(value,expected,label);}
function test(name,fn){try{fn();report.cases.push({name,passed:true});}catch(error){report.cases.push({name,passed:false});report.failures.push({name,error:error.message});}}
const calculate=source=>api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
const owners=[
 ['inline-reference','Texto.<ref>[https://example.test/a "Título sem aspas finais]. Fonte.</ref>'],
 ['external-label','Texto [https://example.test/a "Título sem aspas finais].'],
 ['table-cell','{| class="wikitable"\n! Cabeçalho\n|-\n| Texto com "aspas sem par\n|}'],
 ['reference-table-cell','{| class="wikitable"\n! Cabeçalho\n|-\n| <ref>[https://example.test/a "Título]. Fonte.</ref>\n| style="text-align:left" | Outra célula\n|}']
];
for(const [name,body]of owners)test(name+' keeps quote and parses next complete block',()=>{
 const source=body+'\n\n{{Main|Brasil}}',plan=api.syntaxRepairPlan(source,cfg),result=calculate(source);
 check(plan.unresolved,[],'Complete wiki structure is not hidden by ordinary punctuation');
 check(result.text.includes('{{Artigo principal|Brasil}}'),true,'Independent complete template is converted');
 check(result.text.includes('"'),true,'Original quote is retained');
 check(result.syntaxIsolation,undefined,'No false partial scope');
 check(result.preservation,[],'Preservation audit accepts result');
 check(calculate(result.text).text,result.text,'Second run is idempotent');
});
for(const [index,[left,right]]of [['"','"'],['“','”'],['«','»'],["''","''"],["'''","'''"],["'''''","'''''"]].entries()){
 for(const owner of ['plain','reference','external','table'])test('deliberate quoted markup stays literal '+index+' '+owner,()=>{
  const quoted=left+'{{Exemplo|valor}} <references group="nota"/><references group="nota"/>'+right;
  const source=owner==='reference'?'Antes.<ref>'+quoted+'</ref>':owner==='external'?'Antes [https://example.test/a '+quoted+']':owner==='table'?'{| class="wikitable"\n! Cabeçalho\n|-\n| '+quoted+'\n|}':'Antes '+quoted;
  const result=calculate(source);check(result.text.includes(quoted),true,'Protected markup and duplicate collector examples remain exact');check(result.preservation,[],'No protected source loss');check(calculate(result.text).text,result.text,'Protected example idempotent');
 });
}
for(const [index,source]of [
 'Antes.\n<ref>[https://example.test/a "Título]\n{{Main|Brasil}}',
 'Antes.\n[https://example.test/a "Título\n{{Main|Brasil}}',
 'Antes.\n{| class="wikitable"\n| Texto com "aspas\n{{Main|Brasil}}',
 'Antes.\n{| class="wikitable"\n| style="incompleto\n|}\n{{Main|Brasil}}',
 'Antes.\n<span title="incompleto\n{{Main|Brasil}}',
 'Antes.\n<nowiki>"{{Main|Brasil}}',
 'Antes.\n<!-- "{{Main|Brasil}}',
 'Antes.\n<ref>Texto <ref>aninhado</ref> "\n{{Main|Brasil}}'
].entries())test('genuinely incomplete context remains guarded '+index,()=>{
 const plan=api.syntaxRepairPlan(source,cfg),result=calculate(source);check(plan.unresolved.length>0,true,'Actual incomplete markup remains unresolved');check(result.text.includes('{{Main|Brasil}}'),true,'Ambiguous tail remains unchanged');check(result.preservation,[],'Preserved tail has no source loss');
});
for(const [index,source]of [
 'Antes "um <span title="atributo">trecho</span> {{Main|Brasil}}" depois.',
 'Antes "<ref name="exemplo">{{Main|Brasil}}</ref>" depois.',
 'Antes "<references group="nota"/><references group="nota"/>" depois.',
 'Antes "{| class="wikitable"\n| {{Main|Brasil}}\n|}" depois.'
].entries())test('attribute quotes cannot end surrounding quotation '+index,()=>{
 const syntax=api.syntaxRepairPlan(source,cfg),safe=api.v25SafeRepairPlan(source,cfg);check(syntax.text,source,'Syntax planner preserves surrounding literal quote');check(syntax.unresolved,[],'Attribute delimiters do not split the literal quote');check(safe.text,source,'Safe duplicate collectors do not alter the literal example');
});
test('indexed unmatched quote search has bounded work',()=>{
 const source='<ref>'+('“'.repeat(10000))+'</ref>\n{{Main|Brasil}}',start=performance.now(),plan=api.syntaxRepairPlan(source,cfg);
 check(plan.unresolved,[],'Unmatched ordinary punctuation stays inside complete reference');check(plan.safePrefixEnd,source.length,'Complete article remains available');check(performance.now()-start<5000,true,'Ten thousand openers do not cause repeated suffix scans');
});
test('paired multiline quotation inside complete reference keeps its literal syntax',()=>{
 const source='{| class="wikitable"\n! Cabeçalho\n|-\n| <ref>"{{Main|Dentro}}\n{{Exemplo|aberto".</ref>\n|}',plan=api.syntaxRepairPlan(source,cfg);
 check(plan.text,source,'Literal malformed syntax is unchanged');check(plan.unresolved,[],'A complete multiline reference owns its full quote span');
});
for(const attrs of ['dir="rtl"','dir="ltr"','follow="nota"','name="nota" group="nota" dir="rtl"'])test('complete supported Cite owner '+attrs,()=>{
 const source='<ref '+attrs+'>"Pontuação solta.</ref>\n{{Main|Brasil}}',plan=api.syntaxRepairPlan(source,cfg);
 check(plan.unresolved,[],'Supported literal Cite attributes retain complete ref ownership');check(calculate(source).text.includes('{{Artigo principal|Brasil}}'),true,'Independent template can be adjusted');
});
for(const owner of ['<ref>"Título"</ref>','<ref dir="rtl">“Título”</ref>','[https://example.test/a "Título"]'])test('outer quotation skips complete nested owner '+owner,()=>{
 const source='Texto "citação com '+owner+' continuação".\n{{Main|Brasil}}',plan=api.syntaxRepairPlan(source,cfg);
 check(plan.unresolved,[],'Inner owner punctuation cannot strand a reference or link');check(plan.text,source,'Syntax scanner leaves the literal source unchanged');
});
for(const spacing of ['', ' '])for(const middle of ['', '\n', '\n\n'])test('closing-looking opener still protects a quoted malformed reference '+spacing.length+' '+middle.length,()=>{
 const sample='.'+spacing+'"<ref>{{Portal|Biologia}]</ref>'+middle+'"',plan=api.syntaxRepairPlan(sample,cfg);
 check(plan.text,sample,'Malformed quoted Portal template is not repaired');check(plan.unresolved,[],'A real outer closer still defines one literal quote');
});
for(const before of [')','}','word'])for(const middle of ['', '\n\n'])test('punctuation fallback does not claim an opening literal '+before+' '+middle.length,()=>{
 const source=before+'"<ref>{{Portal|Biologia}]</ref>'+middle+'"',plan=api.syntaxRepairPlan(source,cfg);
 check(plan.text,source,'An opening literal after other characters is not rewritten');check(plan.unresolved,[],'Its real outer closer is honored');
});
for(const payload of ['{{Portal|Biologia}}','<references/><references/>','{| class="wikitable"\n| 1\n|}'])test('balanced code remains protected across a paragraph boundary '+payload.slice(0,12),()=>{
 const source='."<ref>'+payload+'</ref>\n\n"',plan=api.syntaxRepairPlan(source,cfg);
 check(plan.text,source,'A balanced outer quoted code example is unchanged');check(plan.unresolved,[],'Complete source does not gain an opaque suffix');check(api.v25SafeRepairPlan(source,cfg).text,source,'No safe repair enters the quoted code');
});
test('multiline quoted template parameter keeps the outside-field guard',()=>{
 const source='{{Exemplo\n|texto="Amostra de código\n{{Portal|Biologia}]\nFim da amostra"\n}}',plan=api.syntaxRepairPlan(source,cfg);
 check(plan.text,source,'Template parameter is not mistaken for a wikitable cell');
});
test('multiline template inside real table keeps its quoted parameter literal',()=>{
 const source='{| class="wikitable"\n| {{Exemplo\n|texto="{{Portal|Biologia}]\ntexto final"\n}}\n|}',plan=api.syntaxRepairPlan(source,cfg);
 check(plan.text,source,'A pipe parameter inside a table is not treated as a new cell');
});
const fixture=process.env.REVISAWIKI_CITY_FIXTURE||path.join(__dirname,'fixtures/city_temperature/article.wiki');
if(fixture)test('temperature-list captured source keeps every quote and parses all six tables',()=>{
 const source=fs.readFileSync(fixture,'utf8'),plan=api.syntaxRepairPlan(source,cfg),result=calculate(source);
 check(plan.unresolved,[],'Original source parses without removing its stray citation quote');
 check(result.text.includes('# "Météo Climat 1991–2020 averages for Lithuania]'),true,'Stray punctuation is not silently edited');
 check(result.syntaxIsolation,undefined,'Entire article analyzed');check(result.preservation,[],'No source or data loss');
 check(result.changes.some(change=>change.id==='tableHeaderScopes'),true,'Table maintenance can run');
 check(result.changes.some(change=>change.id==='referenceColumns'),true,'Reference maintenance can run');
 check(calculate(result.text).text,result.text,'Large article is idempotent');
});
report.checks=report.assertions;report.status=report.failures.length?'failed':'passed';
const output=process.env.REVISAWIKI_QUOTE_REPORT||path.join(candidate.artifactDirectory(),'quotes.json');if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({kind:report.kind,cases:report.cases.length,assertions:report.assertions,failed:report.failures.length,failures:report.failures},null,2));if(report.failures.length)process.exitCode=1;
