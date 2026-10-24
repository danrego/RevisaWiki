'use strict';
// Focused proof contracts use the actual candidate's parser and native-owner
// inventory with the current helper compiled in memory. Actual unmodified
// candidate calculate/final-gate coverage is reported separately.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),file=path.resolve(process.argv.slice(2).find(arg=>!arg.startsWith('--'))||process.env.REVISAWIKI_V221_BUNDLE||path.join(root,'dist/2.21.0/RevisaWiki_v2_21_0_completo.js'));
let program=fs.readFileSync(file,'utf8'),injected=false;
{
    const source=fs.readFileSync(path.join(root,'src/v2_21/citation_repairs.js'),'utf8'),start=source.indexOf('    function v221MissingDefaultCollectorPlan('),end=source.indexOf('    function v221ReferenceNameEdits(',start);
    assert.ok(start>0&&end>start);program=program.replace(/\bconst api\s*=\s*\{/,source.slice(start,end)+'\nconst api={');injected=true;
}
program=program.replace(/\bconst api\s*=\s*\{/,'const api={v221MissingDefaultCollectorPlan,v221MissingDefaultCollectorProof,v219NativeReferenceObserver,');
const compiled=new Module(file,module);compiled.filename=file;compiled.paths=Module._nodeModulePaths(path.dirname(file));compiled._compile(program,file);
const api=compiled.exports,cfg={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo',contentModel:'wikitext',v216CalendarUTC:'2026-10-22'},cases=[];
const add=(id,before)=>cases.push({id,before});
add('native-infobox-field-with-body-reference','{{Info/Político|nome=Exemplo|vice_título2=Valor preservado<ref name="A">Fonte.</ref>}}\n\nExemplo.<ref>Fonte do corpo.</ref>\n\n[[Categoria:Exemplos]]');
add('native-biography-field-with-body-reference','{{Info/Biografia|nome=Exemplo|ocupação=Profissão<ref name="B">Outra fonte.</ref>}}\n\nExemplo.<ref>Fonte do corpo.</ref>');
add('plain-anonymous','Exemplo.<ref>Fonte.</ref>');
add('named-use-order','Exemplo.<ref name="A">Fonte.</ref> Texto.<ref name="A" />\n\n[[Categoria:Exemplos]]');
add('citation-body-with-body-reference','{{Info/Biografia|nome=Exemplo|ocupação=Profissão<ref name="C">{{Citar web|url=https://example.invalid/a|título=Obra}}</ref>}}\n\nExemplo.<ref>Fonte do corpo.</ref>');
add('formula-and-unit','Texto <math>E=mc^2</math> e 12 kg.<ref>Fonte.</ref>\n\n[[Categoria:Exemplos]]');
add('bibliography-footer','Exemplo.<ref>Fonte.</ref>\n\n== Bibliografia ==\n* Obra.');
add('trailing-newlines','Texto.<ref>Fonte.</ref>\n\n');
let assertions=0;
for(const row of cases){
    const plan=api.v221MissingDefaultCollectorPlan(row.before,cfg);assert.notEqual(plan.text,row.before,row.id);assertions++;
    assert.equal(plan.edits.length,1,row.id);assertions++;row.after=plan.text;
    assert.equal(api.v221MissingDefaultCollectorProof(row.before,row.after,plan,cfg),true,row.id);assertions++;
    assert.equal(api.v221MissingDefaultCollectorPlan(row.after,cfg).text,row.after,row.id+' idempotence');assertions++;
    assert.equal(api.v221MissingDefaultCollectorProof(row.before,row.after,{...plan,sourceHash:'forged'},cfg),false,row.id+' forged hash');assertions++;
    const altered='Outro texto.\n'+row.after;
    assert.equal(api.v221MissingDefaultCollectorProof(row.before,altered,plan,cfg),false,row.id+' mutated proposal');assertions++;
    for(const disabled of [{references:false},{endMatter:false},{markup:false},{namespaceNumber:1},{sectionOnly:true},{discussionPage:true},{pageRedirect:true},{pageDisambiguation:true},{contentModel:'javascript'}]){
        assert.equal(api.v221MissingDefaultCollectorPlan(row.before,{...cfg,...disabled}).text,row.before,row.id+' scope');assertions++;
    }
}
const original=cases[0].before.replace('Exemplo.<ref>Fonte do corpo.</ref>','Exemplo.'),negatives=[
    original.replace('Exemplo.<ref>Fonte do corpo.</ref>','Exemplo.'),
    original.replace('Exemplo.<ref>Fonte do corpo.</ref>','Exemplo.').replace('vice_título2=','vice2=Pessoa|vice_título2='),
    original.replace('Exemplo.<ref>Fonte do corpo.</ref>','Exemplo.').replace('vice_título2=','vice-título2='),
    original.replace('Exemplo.<ref>Fonte do corpo.</ref>','Exemplo.').replace('vice_título2=','vice_título2=Outro valor|vice2=Pessoa|vice-título2='),
    cases[1].before.replace('Exemplo.<ref>Fonte do corpo.</ref>','Exemplo.'),
    cases[4].before.replace('Exemplo.<ref>Fonte do corpo.</ref>','Exemplo.'),
    original.replace('vice_título2','vice--título2'),
    original.replace('Info/Político','Modelo desconhecido'),
    original.replace('vice_título2','campo inexistente'),
    original.replace('nome=Exemplo','nome=Exemplo|nome=Outra pessoa'),
    original+'\n{{Info/Biografia|nome=Outra pessoa}}',
    original+'\n{{Modelo desconhecido}}',
    original.replace('nome=Exemplo','nome=Exemplo|embed=sim'),
    original.replace('nome=Exemplo','nome=Exemplo|child=yes'),
    original+'\n{{Referências}}',
    original+'\n<references />',
    original.replace('name="A"','name="A" group="nota"'),
    original.replace('name="A"','name="{{Nome}}"'),
    original.replace('name="A"','name="A" follow="B"'),
    original.replace('Fonte.','{{Modelo desconhecido}}'),
    original.replace('Fonte.','{{#if:1|Fonte.}}'),
    original.replace('Fonte.',''),
    original.replace('</ref>',''),
    original.replace('name="A"','name="A'),
    original.replace('<ref name="A">Fonte.</ref>','<ref name="A" />'),
    original+'\nTexto.<ref name="A">Fonte diferente.</ref>',
    original+'\n{{Sfn|Silva|2020}}',
    original.replace('<ref name="A">Fonte.</ref>','<nowiki><ref name="A">Fonte.</ref></nowiki>'),
    original.replace('<ref name="A">Fonte.</ref>','<!-- <ref name="A">Fonte.</ref> -->'),
    '{{Modelo desconhecido|'+original+'}}',
    '= Seção =\n'+original,
    original+'\n{{Bibliografia}}',
    original.replace('Fonte.','<ref>Interna.</ref>'),
    '<syntaxhighlight lang="wikitext">'+original+'</syntaxhighlight>',
    '````wikitext\n'+original+'\n````'
];
for(const [index,source]of negatives.entries()){
    assert.equal(api.v221MissingDefaultCollectorPlan(source,cfg).text,source,'negative '+index);assertions++;
}
const report={suite:'citation-missing-default-collector',positiveCases:cases.length,negativeCases:negatives.length,assertions,status:'passed',
    helperInjectedIntoPinnedCandidate:injected,scope:'Actual parser/native-owner helpers with source-bound insertion proof; no native or browser claim'};
if(require.main===module){
    if(process.argv.includes('--fixture-cases'))process.stdout.write(JSON.stringify({cases,negatives},null,2)+'\n');
    else if(process.argv.includes('--native-cases'))process.stdout.write(JSON.stringify({cases},null,2)+'\n');
    else process.stdout.write(JSON.stringify(report)+'\n');
}
module.exports={cases,negatives,report};
