'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const api=require(path.resolve(process.argv[2]||path.join(__dirname,'../../../dist/2.6.1/RevisaWiki_v2_6_1.js'))),cfg={namespaceNumber:1};
const report={kind:'one-click-talk-header-plan',cases:[],checks:0,failures:[]};
function check(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function test(name,fn){try{fn();report.cases.push({name,status:'passed'});}catch(error){report.cases.push({name,status:'failed'});report.failures.push({name,message:error.message});}}
const expected='{{PD}}\n{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}\n';
for(const [id,source]of [
    ['inline-three-labels','Portal da física Portal da tecnologia Portal da ciência'],
    ['three-separate-lines','Portal da física\nPortal da tecnologia\nPortal da ciência\n'],
    ['portal-template','{{Portal3|Física|Tecnologia|Ciência}}\n'],
    ['portal-alias-template','{{Portal|Física|Tecnologia|Ciência}}\n'],
    ['numbered-portals','{{Portal3|1=Física|2=Tecnologia|3=Ciência}}\n']
])test(id,()=>{
    const plan=api.v25TalkPreparationPlan(source,'',cfg);
    check(plan.text,expected,'all three labels become complete project pairs');
    check(plan.summary,'{{PD}}{{Marca de projeto}}','exact summary');
    check(plan.projects,['Física','Tecnologia','Ciência'],'all project names retained');
    check(api.v25TalkPreparationPlan(plan.text,'',cfg).text,plan.text,'idempotent');
});
test('read-only article portals support verified additional names',()=>{
    const article='Texto.\n{{Portal3|Física|Tecnologia|Ciência|Tema inexistente}}';
    check(api.v25TalkPreparationPlan('',article,cfg).text,expected,'verified markers imported and unknown article portal ignored');
});
test('ratings and discussion text stay exact',()=>{
    const body='== Debate ==\nTexto assinado. [[Usuário:Exemplo|Exemplo]] 12h00min de 1 de janeiro de 2000 (UTC)\n';
    const source='{{Marca de projeto|3|Física|2|motivo=Manter este texto}}\n{{PD}}\nPortal da tecnologia Portal da ciência\n'+body;
    const plan=api.v25TalkPreparationPlan(source,'',cfg);
    check(plan.text,'{{PD}}\n{{Marca de projeto|3|Física|2|motivo=Manter este texto|Tecnologia|?|Ciência|?}}\n'+body,'existing ratings, parameters and signed conversation preserved');
    check(api.v25TalkPreparationPlan(plan.text,'',cfg).text,plan.text,'merged result stable');
});
test('translation attribution and unrelated templates stay exact',()=>{
    const tail='{{Traduzido|en|Example|oldid=1}}\n== Debate ==\nTexto original.\n';
    const plan=api.v25TalkPreparationPlan('Portal da física Portal da tecnologia Portal da ciência\n'+tail,'',cfg);
    check(plan.text,expected+tail,'attribution and discussion retained');
});
for(const source of [
    'Portal da física Portal da Abacaxilândia Portal da ciência',
    '{{Portal3|Física|Abacaxilândia|Ciência}}\n',
    'Quero discutir o Portal da física e os demais projetos.\n',
    '== Debate ==\nPortal da física Portal da tecnologia Portal da ciência\n',
    '<!-- Portal da física Portal da tecnologia Portal da ciência -->\n'
])test('unknown or conversational text retained '+report.cases.length,()=>{
    const plan=api.v25TalkPreparationPlan(source,'',cfg);
    check(plan.text.includes(source.trim()),true,'literal unconverted content preserved');
    check(plan.projects,[],'no project guessed from conversational or unknown text');
});
for(const options of [{namespaceNumber:0},{namespaceNumber:3},{namespaceNumber:1,sectionOnly:true},{namespaceNumber:1,section:'2'}])test('unsupported scope '+report.cases.length,()=>{
    const source='Portal da física Portal da tecnologia Portal da ciência';
    check(api.v25TalkPreparationPlan(source,'',options).text,source,'scope cannot create article or partial-discussion header');
});
for(const source of ['{{PD}}\n{{PD}}\n','{{Marca de projeto|?|Física|?}}\n{{Marca de projeto|?|Ciência|?}}\n','{{PD}\nTexto','{{Marca de projeto|3|1=Física|2=2}}\n== Debate ==\nTexto'])test('existing ambiguous header preserved '+report.cases.length,()=>{
    const plan=api.v25TalkPreparationPlan(source,'{{Portal3|Ciência}}',cfg);
    check(plan.text.includes(source.trim()),true,'ambiguous existing source not destroyed');
});
report.status=report.failures.length?'failed':'passed';console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
