'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),report={kind:'source-proven-typed-citation-syntax-subsets',status:'passed',
    runnerSha256:sha(fs.readFileSync(__filename)),helperSha256:sha(fs.readFileSync(path.join(root,'src/v2_19/source_compatibility.js'))),
    bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),m);},ok=(v,m)=>{report.checks++;assert.ok(v,m);};
function test(bundle,id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:error.message});}}
for(const file of files){
    const api=require(file),bundle=path.basename(file);report.bundles.push({bundle,runtimeSha256:sha(fs.readFileSync(file)),version:api.version,helperPreview:false});
    const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,
        authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,registryDoiCheck:false,
        referenceColumns:false,externalLinkColumns:false,endMatterColumns:false},
        calc=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}}),
        plan=(source,extra={})=>api.v219SourceCompatibilityPlan(source,{...cfg,...extra}),
        call=(name,field)=>'{{'+name+'|título=Fonte literal|'+field+'}}';
    const positive=[];
    for(const key of ['doi','DOI'])for(const before of ['10.1000 /example','10.1000/ example','10.1000  /  example',' 10.12345 / EXAMPLE(2):test ', '\t10.1000 / example\t'])positive.push([key+'='+before,key+'='+before.replace(/ *(\/) */,'$1'),'typed-doi-slash-spacing']);
    for(const key of ['url','URL'])for(const gap of [' ','  ','\t'])for(const value of ['https://example.org/fonte','http://example.org/fonte?a=b&c=d'])positive.push([key+gap+value,key+'='+gap+value,'typed-native-missing-equals']);
    for(const key of ['acessodata','acessadoem'])for(const gap of [' ','  ','\t'])for(const value of ['5 março 2001','15 de março de 2001','2001-03-05'])positive.push([key+gap+value,key+'='+gap+value,'typed-native-missing-equals']);
    for(const key of ['data','date','acessodata','acessadoem','arquivodata','archive-date','data-publicação'])for(const padding of ['',' ','\t'])positive.push([key+'='+padding+'2000-02-29.'+padding,key+'='+padding+'2000-02-29'+padding,'typed-iso-terminal-period']);
    for(const key of ['página','páginas','pagina','paginas','page','pages','p','pp'])for(const range of ['5','5-7','5–7'])positive.push([key+'={{P.|'+range+'}}',key+'='+range,'native-page-prefix-wrapper']);
    for(const name of ['Citar web','Citar jornal','Citar livro','Citar revista','Citar periódico','Cite web','Cite news','Cite book','Cite journal','Cite magazine'])for(const [before,after,kind]of positive)test(bundle,'positive-'+name+'-'+sha(before).slice(0,16),()=>{
        const source=call(name,before),expected=call(name,after),first=plan(source);
        eq(first.text,expected,'Only the independently bounded key separator or adjacent DOI spaces change');
        ok(first.edits.length>0&&first.edits.every(edit=>edit.proof.kind===kind&&edit.proof.minorSafe===false),'Every repair binds its typed source and remains nonminor');
        ok(api.v219SourceCompatibilityProof(source,expected,first,cfg),'The original source plan replays exactly');
        const action=calc(source);eq(action.text,calc(expected).text,'The actual production action reaches the declared native endpoint');
        eq(calc(action.text).text,action.text,'The typed repair and later native formatting compose in one action');
        eq(api.preservationAudit(source,action.text,cfg),[],'Publication identity and every unchanged field are retained');
        eq(api.safeComposition(source,action.text,cfg),'','No composition refusal is hidden by a helper-only assertion');
    });
    const negatives=['doi=10.1000\t/ example','doi=10.1000 /\texample','doi=10.1000 / exam ple','doi=10.1000 / example.',
        'doi=10.100 / example','doi=10.1000 /','doi=10.1000 / example|DOI=','doi=10.1000 / example|DOI=10.1000/other',
        'doi=10.1000 <!--nota--> / example','doi="10.1000 / example"','doi=10.1000 / {{Identificador fictício}}',
        'url http://example.org/fonte|URL=','url http://example.org/fonte|url=Outro valor','url http://example.org/fonte|1=',
        'url http://example.org/fonte|Texto posicional','url http://example.org/fonte|','url http://example.org/fonte|acessodata 5 março 2001',
        'url http://example.org/fonte texto','url //example.org/fonte','url javascript:alert(1)','url http://nome@example.org/fonte',
        'url http://example.org/fonte|campo_desconhecido=Valor','url "http://example.org/fonte"','url {{URL fictícia}}',
        'acessodata 5 março 2001|access-date=','acessodata 29 fevereiro 2001','acessodata 05/03/2001','acessodata March 2001',
        'acessodata 2001-03','acessodata 5 março 2001 extra','acessodata 5 março 2001<!--nota-->','acessodata {{DataExt|5|3|2001}}',
        'data=2001-02-29.','data=2001-03-05.?','data=2001-03-05.extra','data=2001-03-05.|date=',
        'data=2001-03-05.|date=2002-03-05','ano=2001-03-05.','data=2001-03.','data={{DataExt|5|3|2001}}.',
        'página={{P.|vii}}','página={{P.|0}}','página={{P.|5|7}}','página={{P.|5|texto=literal}}',
        'página={{P.|{{Página fictícia}}}}','página={{P.|5}}|page=','página={{P.|5}}|pages=7',
        'página={{P.|5}} extra','página="{{P.|5}}"','página={{P.|5 - 7}}','página={{P.|5/7}}'];
    for(const before of negatives)test(bundle,'negative-'+sha(before).slice(0,16),()=>{
        const source=call('Citar web',before);eq(plan(source).text,source,'Ambiguous, competing, invalid, dynamic and unsupported syntax remains exact');
    });
    for(const source of [call('CITAR WEB','url http://example.org/fonte'),call('Citar Web','doi=10.1000 / example'),
        call('Modelo fictício','url http://example.org/fonte'),call('Info/Biografia','acessodata 5 março 2001'),
        '{{Citar web|url http://example.org/fonte|Texto}}'])test(bundle,'identity-'+sha(source).slice(0,16),()=>{eq(plan(source).text,source,'Only an exact proved named-only native interface enables a repair');});
    const wrappers=[s=>'"'+s+'"',s=>"''"+s+"''",s=>'<nowiki>'+s+'</nowiki>',s=>'<code>'+s+'</code>',s=>'{{Modelo fictício|codigo='+s+'}}',s=>'```wikitext\n'+s+'\n```'];
    for(const [before]of positive)for(let index=0;index<wrappers.length;index++)test(bundle,'protected-'+sha(before).slice(0,16)+'-'+index,()=>{
        const source=wrappers[index](call('Citar web',before));eq(plan(source).text,source,'The complete literal example retains its source bytes');
    });
    for(const extra of [{automaticSourceCompatibility:false},{automaticParameterNames:false},{citations:false},{namespaceNumber:1},{sectionOnly:true}])for(const before of ['doi=10.1000 / example','url http://example.org/fonte','acessodata 5 março 2001'])test(bundle,'optout-'+sha(before+JSON.stringify(extra)).slice(0,16),()=>{
        const source=call('Citar web',before);eq(plan(source,extra).text,source,'Explicit scope and option gates prevent the repair');
    });
    for(const extra of [{citationRepairs:false},{syntaxRepairs:false},{structuralRepairs:false}])for(const before of ['url http://example.org/fonte','acessodata 5 março 2001'])test(bundle,'structural-optout-'+sha(before+JSON.stringify(extra)).slice(0,16),()=>{
        const source=call('Citar web',before);eq(plan(source,extra).text,source,'The missing-equals structural repair respects its own gates');
    });
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
