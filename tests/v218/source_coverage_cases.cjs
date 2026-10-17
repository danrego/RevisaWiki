'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),
    assert=require('node:assert/strict'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),inventoryFile=path.join(__dirname,'source_coverage_inventory.json'),
    inventory=JSON.parse(fs.readFileSync(inventoryFile,'utf8')),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const helperFiles=['legacy_compatibility.js','citation_keys.js','legacy_markup.js'].map(name=>path.join(root,'src/v2_18',name)),
    helperText=helperFiles.map(file=>fs.readFileSync(file,'utf8')).join('\n'),names=[
        'v218CitationDateMonth','v218CitationDateValue','v218CitationDateScope','v218CitationDateEdits',
        'v218CitationDatePlan','v218CitationDateProof','v218CitationNativeContext','v218CitationKeyScope','v218CitationKeyValue',
        'v218CitationKeyEdits','v218CitationKeyPlan','v218CitationKeyProof','v218LegacyMarkupPlan'];
const args=process.argv.slice(2),originalAt=args.indexOf('--original'),originalFile=originalAt<0?
    (process.env.REVISAWIKI_ORIGINAL_SOURCE?path.resolve(process.env.REVISAWIKI_ORIGINAL_SOURCE):null):path.resolve(args[originalAt+1]);
if(originalAt>=0)args.splice(originalAt,2);
const files=args.filter(value=>!value.startsWith('--')).map(value=>path.resolve(value));
if(!files.length)files.push(...['RevisaWiki_v2_18_0.js','RevisaWiki_v2_18_0_completo.js'].map(name=>path.join(root,'dist/2.18.0',name)));
function load(file){
    const bytes=fs.readFileSync(file),native=require(file);
    if(names.every(name=>typeof native[name]==='function'))return {api:native,preview:false,bytes};
    const base=path.join(root,'dist/2.17.0/RevisaWiki_v2_17_0_completo.js'),source=fs.readFileSync(base,'utf8'),marker='    const api = {';
    assert.equal(source.split(marker).length,2,'One immutable export boundary is required');
    const sandbox={module:{exports:{}},exports:{},require:createRequire(base),__dirname:path.dirname(base),__filename:base,
        console,Buffer,setTimeout,clearTimeout,TextEncoder,URL};
    vm.runInNewContext(source.replace(marker,helperText+'\n'+marker+names.join(',')+','),sandbox,{timeout:30000});
    return {api:sandbox.module.exports,preview:true,bytes};
}
const report={kind:'complete-source-rule-and-citation-compatibility',status:'passed',
    runnerSha256:sha(fs.readFileSync(__filename)),inventorySha256:sha(fs.readFileSync(inventoryFile)),
    sourceRevision:inventory.sourceRevision,helperSha256:Object.fromEntries(helperFiles.map(file=>[path.basename(file),sha(fs.readFileSync(file))])),
    classifications:inventory.totals,recordedRules:inventory.rules.length,originalPureExecution:false,
    bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(actual,expected,message)=>{report.checks++;assert.equal(JSON.stringify(actual),JSON.stringify(expected),message);},
    ok=(condition,message)=>{report.checks++;assert.ok(condition,message);};
function test(bundle,id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(error){
    report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:error.message});}}
test('inventory','all-active-rules-have-matching-witnesses',()=>{
    eq(inventory.rules.length,241,'The complete active-rule inventory contains 241 entries');
    eq(new Set(inventory.rules.map(row=>row.id)).size,241,'Each source rule has one anonymous identity');
    eq(inventory.rules.every(row=>row.originalRuleMatched===true),true,'Every recorded fixture matched its own original rule');
    eq(inventory.originalExecution.originalPipelineErrors,0,'The recorded pure original pipelines completed');
    eq(Object.values(inventory.totals).reduce((a,b)=>a+b,0),241,'Every rule receives an explicit classification');
});
if(originalFile)test('original','pinned-definitions-only-replay',()=>{
    const raw=fs.readFileSync(originalFile,'utf8');eq(sha(raw),inventory.sourceRevision.sha256,'The optional original source must match its pinned revision');
    const begin=raw.indexOf('var mesesEn ='),end=raw.indexOf('function validarSintaxePredefinicoes');
    ok(begin>=0&&end>begin,'Only the reviewed pure-definition slice is evaluated');const pure=raw.slice(begin,end);
    eq(/\b(?:require|process|fetch|XMLHttpRequest|importScripts)\s*[.(]/.test(pure),false,'The pure slice has no network, process or import operations');
    const context=vm.createContext(Object.create(null),{codeGeneration:{strings:false,wasm:false}});
    vm.runInContext('var novoEditor=false; var mw={notify:function(){throw Error("Unexpected UI call")}};'+pure,context,{timeout:1500});
    let number=0;
    for(const group of ['datas','tradpred','geral','duplicado','general','outside']){
        const count={datas:64,tradpred:109,geral:21,duplicado:8,general:37,outside:2}[group];
        for(let index=0;index<count;index++){
            const row=inventory.rules[number++];context.fixture=row.witness.source;context.ruleGroup=group;context.ruleIndex=index;
            const actual=JSON.parse(vm.runInContext(`JSON.stringify((()=>{const rules=ruleGroup==='general'?geral:ruleGroup==='outside'?foraDePredef:citacoes[ruleGroup].cond,rule=rules[ruleIndex],match=fixture.match(rule.reg);return {matched:!!match,after:match?fixture.replace(match[0],rule.subs(match)):fixture};})())`,context,{timeout:1500}));
            ok(actual.matched,'The isolated original rule matches '+row.id);
            // Clock-dependent maintenance backfills are not copied as behavior.
            if(!/data=outubro de 2026/.test(row.witness.directOriginalAfter)||/data=outubro de 2026/.test(row.witness.source))
                eq(actual.after,row.witness.directOriginalAfter,'The isolated direct transformation matches the captured witness '+row.id);
        }
    }
    report.originalPureExecution=true;
});
for(const file of files){
    const {api,preview,bytes}=load(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',
        contentModel:'wikitext',autoPreview:false,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,
        automaticTopicPortals:false,registryDoiCheck:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false};
    report.bundles.push({bundle,runtimeVersion:api.version,runtimeSha256:sha(bytes),bytes:bytes.length,helperPreview:preview});
    const datePlan=(source,extra={})=>api.v218CitationDatePlan(source,{...cfg,...extra}),
        keyPlan=(source,extra={})=>api.v218CitationKeyPlan(source,{...cfg,...extra}),
        calculate=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}}),
        cite=field=>'Texto.<ref>{{Citar web|título=Fonte fictícia|url=https://example.org/fonte|'+field+'}}</ref>\n{{Referências}}';
    const bridge=source=>api.v218LegacyMarkupPlan(api.v218CitationDatePlan(api.v218CitationKeyPlan(source,cfg).text,cfg).text,cfg).text;
    for(const row of inventory.rules)test(bundle,'inventory-'+row.id,()=>{
        const raw=calculate(row.witness.source),result={...raw,text:preview?bridge(raw.text):raw.text};
        ok(row.allowedEndpoints.includes(result.text),'The output remains within the documented source-rule alternatives for '+row.id);
        eq(preview?bridge(calculate(result.text).text):calculate(result.text).text,result.text,'The recorded source witness is idempotent for '+row.id);
        if(['citation-date-value-bridge','exact-citation-key-bridge','bounded-legacy-markup'].includes(row.resolution)){
            eq(bridge(row.witness.baselineAfter),row.witness.bridgeAfter,'The bounded helper reproduces the recorded source witness');
            if(!preview)eq(result.text,row.witness.bridgeAfter,'The production action retains the approved compatibility repair');
        }
    });
    for(const [before,kind,after,precision]of [
        ['March 5, 2001','date','5 de março de 2001','day'],['05 de Marco de 2001','date','5 de março de 2001','day'],
        ['2001-Mar-05','date','5 de março de 2001','day'],['05/Mar/2001','date','5 de março de 2001','day'],
        ['[[05 de março]] de [[2001]]','date','5 de março de 2001','day'],['{{Data|2001|3|5}}','date','5 de março de 2001','day'],
        ['{{DataExt|5|3|2001}}','date','5 de março de 2001','day'],['1° de janeiro de 2001','date','1 de janeiro de 2001','day'],
        ['February 29, 2000','date','29 de fevereiro de 2000','day'],['March 5-7, 2001','date','5–7 de março de 2001','day-range'],
        ['5/7 de março de 2001','date','5–7 de março de 2001','day-range'],['March–April 2001','date','março–abril de 2001','month-range'],
        ['March 2001','date','março de 2001','month'],['03/2001','date','março de 2001','month'],['2001-03','date','2001-03','month'],
        ['Spring 2001','date','primavera de 2001','season'],['[[2001]]','year','2001','year'],
        ['  March 5, 2001 \n','access','  5 de março de 2001 \n','day']
    ])test(bundle,'literal-date-'+sha(before+'|'+kind).slice(0,12),()=>{
        const value=api.v218CitationDateValue(before,kind);ok(value,'The exact literal form has a validated date interpretation');
        eq(value.text,after,'The date keeps all supplied precision');eq(value.precision,precision,'The precision is explicit in the proof');
    });
    for(const [value,kind]of [
        ['February 29, 2001','date'],['31 de abril de 2001','date'],['2001-13-05','date'],['2001-03-32','date'],
        ['05/03/2001','date'],['03/05/2001','date'],['December–January 2001','date'],['7–5 de março de 2001','date'],
        ['March 2001','access'],['2001-03','access'],['03-2001','access'],['Spring 2001','access'],
        ['March 2001','archive'],['March 5-7, 2001','access'],['March 2001','year'],['5 de março de 2001','year'],
        ['{{DataExt|5|3|2001|idade}}','date'],['{{DataExt|5|3|2001|si}}','date'],['{{Data|2001|3|5|extra=literal}}','date'],
        ['[[5 de março|5]] de [[2001]]','date'],['5 de março de 2001<ref>Fonte.</ref>','date'],
        ['{{CURRENTDAY}} de março de 2001','date'],['5 de março de 2001 e outra data','date'],
        ['constructor 2001','date'],['toString 2001','date'],['__proto__ 2001','date']
    ])test(bundle,'unproved-date-'+sha(value+'|'+kind).slice(0,12),()=>{
        eq(api.v218CitationDateValue(value,kind),null,'Ambiguity, invalid calendars, dynamic arguments and incomplete access precision are preserved');
    });
    for(const month of ['constructor','toString','__proto__','hasOwnProperty','not-a-month'])
        test(bundle,'month-name-own-property-'+month,()=>{
            eq(api.v218CitationDateMonth(month),0,'Unknown month names never read inherited object properties');
        });
    for(const key of ['date','data','access-date','acessodata','archive-date','arquivodata','publication-date','data-publicação','air-date'])
        test(bundle,'accepted-date-key-retained-'+key,()=>{
            const before=cite(key+'=March 5, 2001'),expected=cite(key+'=5 de março de 2001'),plan=datePlan(before);
            eq(plan.text,expected,'The accepted key spelling is retained byte-for-byte');
            eq(plan.edits.length,1,'One date value has one source operation');
            ok(api.v218CitationDateProof(before,expected,plan,cfg),'The exact literal plan is reproducible');
            eq(datePlan(expected).text,expected,'The date helper is idempotent');
        });
    for(const [name,field,after]of [['Cite web','date=2001-Mar-05','date=5 de março de 2001'],
        ['Cite web','accessadoem=March 5, 2001','acessodata=5 de março de 2001'],
        ['Cite book','year=March 5, 2001','data=5 de março de 2001']])
        test(bundle,'registered-foreign-family-'+sha(name+'|'+field).slice(0,12),()=>{
            const source=cite(field).replace('{{Citar web','{{'+name),helper=bridge(source),
                expectedHelper=cite(after).replace('{{Citar web','{{'+name);
            eq(helper,expectedHelper,'The registered native destination validates keys and values without changing the source call name');
            if(!preview){
                const first=calculate(source),expected=cite(after.replace(/^date=/,'data=')).replace('{{Citar web',name==='Cite book'?'{{Citar livro':'{{Citar web');
                eq(first.text,expected,'The real pipeline completes the mapped citation and its date in one action');
                eq(calculate(first.text).text,first.text,'A second action performs no delayed citation repair');
            }
        });
    for(const name of ['Cite unknown','Cite webx','Citar webx','Cite web/doc','Info/Biografia'])
        test(bundle,'unregistered-family-is-not-guessed-'+name,()=>{
            const before='{{'+name+'|accessadoem=March 5, 2001|date=2001-Mar-05}}';
            eq(datePlan(before).text,before,'Unknown call families do not gain guessed date semantics');
            eq(keyPlan(before).text,before,'Unknown call families do not gain guessed field semantics');
        });
    for(const field of ['date=March 5, 2001|data=','date=March 5, 2001|data=5 de março de 2001',
        'date=March 5, 2001|date=','access-date=March 5, 2001|acessodata=',
        'archive-date=March 5, 2001|arquivodata=','ano=[[2001]]|year=2001',
        'access-date=March 5, 2001|acesso=','access-date=March 5, 2001|dataacesso=',
        'publication-date=March 5, 2001|publicationdate=','date=March 5, 2001|fecha=',
        'ano=[[2001]]|Ano=','date=March 5, 2001|Date='])test(bundle,'date-alias-collision-'+sha(field).slice(0,12),()=>{
            const before=cite(field);eq(datePlan(before).text,before,'A duplicate alias, including an empty native override, prevents a date rewrite');
        });
    for(const [field,expected]of [['accessadoem=March 5, 2001','acessodata=March 5, 2001'],
        ['Autorlink=Pessoa fictícia','autorlink=Pessoa fictícia'],['Colecção=Coleção literal','coleção=Coleção literal']])test(bundle,'exact-unsupported-key-'+field.split('=')[0],()=>{
            const before=cite(field),after=cite(expected),plan=keyPlan(before);eq(plan.text,after,'Only the reviewed key changes');
            eq(plan.edits.length,1,'Each key repair has one operation witness');
            ok(api.v218CitationKeyProof(before,after,plan,cfg),'The exact source and target are bound to the key proof');
            eq(keyPlan(after).text,after,'A native target is not renamed again');
        });
    for(const [key,target,minor]of [['Editora','editora',true],['Título','título',true],['Página','página',false],
        ['Local de publicação','local-publicação',false],['Subtítulo','subtítulo',true],['Edição','edição',true]])
        test(bundle,'reviewed-deprecated-key-'+key,()=>{
            const before='{{Citar livro|'+key+'=Valor literal}}',after='{{Citar livro|'+target+'=Valor literal}}',plan=keyPlan(before);
            eq(plan.text,after,'Only the exact reviewed obsolete spelling changes');
            eq(plan.edits.length,1,'One deprecated field has one source operation');
            eq(plan.edits[0].proof.minorSafe,minor,'Only proved display-equivalent native aliases qualify as minor-safe');
            eq(keyPlan('{{Citar livro|'+target+'=Valor literal}}').edits,[],'An accepted nondeprecated target is retained');
            eq(keyPlan('{{Citar livro|'+key+'=Valor literal|'+target+'=}}').edits,[],'An empty native override prevents migration');
        });
    for(const key of ['ano','year'])test(bundle,'complete-date-in-year-'+key,()=>{
        const before=cite(key+'=March 5, 2001'),after=cite('data=March 5, 2001'),plan=keyPlan(before);
        eq(plan.text,after,'The full literal date changes argument family while retaining the exact value bytes');
        eq(plan.edits.length,1,'The key migration has one explicit operation');
        eq(plan.edits[0].proof.minorSafe,false,'Exposing a full date from a year-only argument is not automatically minor');
        eq(datePlan(after).text,cite('data=5 de março de 2001'),'The separate date stage retains the complete original precision');
    });
    for(const field of ['ano=2001','year=March 2001','ano=February 29, 2001','ano={{DataExt|5|3|2001}}',
        'ano=[[5 de março]] de [[2001]]','ano=5 de março de 2001|data=',
        'year=5 de março de 2001|date=Outra data','ano=5 de março de 2001|Ano=',
        'ano=5 de março de 2001|año=2001','year=5 de março de 2001|air-date=',
        'year=5 de março de 2001|fecha=','year=5 de março de 2001|Date=',
        'year=5 de março de 2001|YEAR='])test(bundle,'year-date-ambiguity-'+sha(field).slice(0,12),()=>{
            const before=cite(field);eq(keyPlan(before).text,before,'Incomplete, invalid, linked, dynamic or conflicting date/year fields are retained');
        });
    const collisions=['accessadoem=March 5, 2001|acessodata=','accessadoem=March 5, 2001|access-date=March 5, 2001',
        'Autorlink=Pessoa fictícia|autorlink=','Autorlink=Pessoa fictícia|author-link=Outra pessoa',
        'Autorlink=Pessoa fictícia|author1-link=','Autorlink=Pessoa fictícia|autorlink1=',
        'Autorlink=Pessoa fictícia|entrevistadolink1=',
        'Colecção=Coleção literal|coleção=','Colecção=Coleção literal|series=Outra coleção',
        'accessadoem=March 2001','accessadoem=February 29, 2001','Autorlink=[[Pessoa fictícia]]',
        'Autorlink=https://example.org/','Colecção={{Valor dinâmico}}','accessadoem=','Autorlink=','Colecção=',
        'constructor=Valor literal','toString=Valor literal','__proto__=Valor literal'];
    for(const field of collisions)test(bundle,'key-collision-or-uncertain-value-'+sha(field).slice(0,12),()=>{
        const before=cite(field);eq(keyPlan(before).text,before,'A conflicting, empty, unproved or dynamic argument retains its exact source');
    });
    for(const [name,wrap]of [['comment',text=>'<!-- '+text+' -->'],['nowiki',text=>'<nowiki>'+text+'</nowiki>'],
        ['pre',text=>'<pre>'+text+'</pre>'],['code',text=>'<syntaxhighlight lang="wikitext">'+text+'</syntaxhighlight>']])
        test(bundle,'protected-date-and-key-'+name,()=>{
            const before=wrap(cite('accessadoem=March 5, 2001|date=March 5, 2001'));
            eq(datePlan(before).text,before,'Protected examples retain date spellings');eq(keyPlan(before).text,before,'Protected examples retain field spellings');
        });
    for(const extra of [{namespaceNumber:1},{namespaceNumber:10},{namespaceNumber:2},{contentModel:'javascript'},
        {sectionOnly:true},{dates:false},{automaticCitationDateValues:false}])test(bundle,'date-disabled-scope-'+sha(JSON.stringify(extra)).slice(0,12),()=>{
            const before=cite('date=March 5, 2001');eq(datePlan(before,extra).text,before,'The date helper honors scope and feature options');
        });
    for(const extra of [{namespaceNumber:1},{namespaceNumber:10},{namespaceNumber:2},{contentModel:'javascript'},
        {sectionOnly:true},{citations:false},{automaticParameterNames:false},{automaticCitationKeyRepairs:false}])test(bundle,'key-disabled-scope-'+sha(JSON.stringify(extra)).slice(0,12),()=>{
            const before=cite('Autorlink=Pessoa fictícia');eq(keyPlan(before,extra).text,before,'The key helper honors scope and feature options');
        });
    test(bundle,'stale-and-mutated-plans-are-rejected',()=>{
        const before=cite('date=March 5, 2001'),plan=datePlan(before);
        eq(api.v218CitationDateProof(before+' ',plan.text,plan,cfg),false,'Another source cannot reuse the date proof');
        eq(api.v218CitationDateProof(before,plan.text.replace('Fonte fictícia','Fonte alterada'),plan,cfg),false,'A date proof cannot authorize citation-title edits');
        const keyBefore=cite('Autorlink=Pessoa fictícia'),keys=keyPlan(keyBefore);
        eq(api.v218CitationKeyProof(keyBefore,keys.text.replace('Pessoa fictícia','Outra pessoa'),keys,cfg),false,'A key proof cannot replace the retained value');
    });
    eq(sha(fs.readFileSync(file)),sha(bytes),'The supplied runtime remains immutable throughout the test');
}
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
