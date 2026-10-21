'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),report={kind:'source-proven-month-year-full-actions',status:'passed',
    runnerSha256:sha(fs.readFileSync(__filename)),contractSha256:sha(fs.readFileSync(path.join(__dirname,'source_month_year_contract.json'))),
    helperSha256:sha(fs.readFileSync(path.join(root,'src/v2_19/source_compatibility.js'))),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),m);},ok=(v,m)=>{report.checks++;assert.ok(v,m);};
function test(bundle,id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:error.message});}}
const english=['January','February','March','April','May','June','July','August','September','October','November','December'],
    portuguese=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
for(const file of files){
    const api=require(file),bundle=path.basename(file);report.bundles.push({bundle,runtimeSha256:sha(fs.readFileSync(file)),version:api.version,helperPreview:false});
    const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,
        authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,registryDoiCheck:false,
        referenceColumns:false,externalLinkColumns:false,endMatterColumns:false},
        calc=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}}),plan=(source,extra={})=>api.v219SourceCompatibilityPlan(source,{...cfg,...extra}),
        cite=(field,name='Citar web')=>'{{'+name+'|título=Fonte literal|url=https://example.org/fonte|'+field+'}}',
        check=(source,expected,kind)=>{const first=plan(source);eq(first.text,expected,'The source-bound month/year endpoint is exact');
            ok(first.edits.length>0&&first.edits.every(edit=>edit.proof.kind===kind&&edit.proof.minorSafe===false),'Each edit binds its date-repair kind and cannot mark newly visible metadata minor');
            ok(first.edits.every(edit=>edit.ruleId==='v218CitationDateValues'&&edit.proof.changeRules.includes('v218CitationDateValues')),'The change report uses the actual citation-date operation');
            ok(api.v219SourceCompatibilityProof(source,expected,first,cfg),'The exact source transaction replays');
            const result=calc(source);eq(result.text,calc(expected).text,'The full production action reaches the independently declared endpoint');
            eq(calc(result.text).text,result.text,'No second click is needed');eq(api.preservationAudit(source,result.text,cfg),[],'The declared repair retains the supplied year, month precision and publication association');
            eq(api.safeComposition(source,result.text,cfg),'','The source-bound repair composes with the whole document');};
    for(const name of ['Citar web','Citar jornal','Citar livro','Citar revista','Citar periódico'])for(const key of ['data','date','ano','year'])for(let month=0;month<12;month++)test(bundle,'scalar-'+name+'-'+key+'-'+month,()=>{
        check(cite(key+'=2001 '+english[month],name),cite((key==='ano'||key==='year'?'data':key)+'='+portuguese[month]+' de 2001',name),'typed-year-month-scalar');
    });
    for(const month of portuguese)for(const key of ['data','ano'])test(bundle,'native-scalar-not-in-declared-foreign-grammar-'+key+'-'+month,()=>{const source=cite(key+'=2001 '+month);eq(plan(source).text,source,'The new source-bound scalar rule is limited to the independently declared English month vocabulary');});
    for(const key of ['mês','mes','month'])for(const yearKey of ['ano','year','Ano','año'])for(const order of ['year-first','month-first'])for(let month=0;month<12;month++)test(bundle,'pair-'+key+'-'+yearKey+'-'+order+'-'+month,()=>{
        const fields=order==='year-first'?yearKey+'=2001|'+key+'='+english[month]:key+'='+english[month]+'|'+yearKey+'=2001';
        check(cite(fields),cite('data='+portuguese[month]+' de 2001'),'typed-native-month-year-pair');
    });
    for(const key of ['mês','mes','month'])for(let first=0;first<12;first++)for(let last=first+1;last<12;last++)test(bundle,'range-'+key+'-'+first+'-'+last,()=>{
        check(cite('ano=2001|'+key+'='+english[first]+'/'+portuguese[last]),cite('data='+portuguese[first]+'–'+portuguese[last]+' de 2001'),'typed-native-month-year-pair');
    });
    const negatives=['ano=2001|mês=March|month=','ano=2001|mês=March|year=','ano=2001|mês=March|date=',
        'ano=2001|mês=March|data-publicação=','ano=2001|mês=March|origyear=1998','ano=2001|mês=March|origdate=',
        'ano=2001|mês=March|day=5','ano=2001|mês=March|dia=','ano=2001|mês=March|acessomesdia=',
        'ano=2001|mês=April/March','ano=2001|mês=March/March','ano=2001|mês=March/April/May','ano=2001|mês=Unknown',
        'ano=01|mês=March','ano=2001?|mês=March','ano={{Ano fictício}}|mês=March','ano=2001|mês={{Mês fictício}}',
        'ano=2001|mês=Mar','ano=2001|mês=03','ano=2001|mês=March<!--nota-->','ano=2001|mês="March"',
        'data=2001 March|ano=','data=2001 March|mês=','data=2001 March|day=5','data=2001 March extra','data=2001 Unknown',
        'data=2001-03-XX','data=2001 March?','data=2001 Mar','data=2001\nMarch'];
    for(const fields of negatives)test(bundle,'negative-'+sha(fields).slice(0,16),()=>{const source=cite(fields);eq(plan(source).text,source,'No day, status, alias priority, extra date, dynamic component or uncertain month is discarded');});
    for(const key of ['data','ano'])for(const padding of [' ','\t'])test(bundle,'scalar-padding-'+key+'-'+sha(padding).slice(0,8),()=>{
        check(cite(key+'='+padding+'2001 March'+padding),cite((key==='ano'?'data':key)+'='+padding+'março de 2001'+padding),'typed-year-month-scalar');
    });
    for(const extra of [{dates:false},{automaticCitationDateValues:false},{automaticSourceCompatibility:false},{automaticParameterNames:false},{citations:false},{namespaceNumber:1},{sectionOnly:true}])for(const field of ['data=2001 March','ano=2001|mês=March'])test(bundle,'optout-'+sha(field+JSON.stringify(extra)).slice(0,16),()=>{
        const source=cite(field);eq(plan(source,extra).text,source,'The source/native/date option gates remain authoritative');
    });
    for(const wrap of [s=>'"'+s+'"',s=>"''"+s+"''",s=>'<nowiki>'+s+'</nowiki>',s=>'{{Modelo fictício|codigo='+s+'}}',s=>'```wikitext\n'+s+'\n```'])for(const fields of ['data=2001 March','ano=2001|mês=March'])test(bundle,'protected-'+sha(wrap(cite(fields))).slice(0,16),()=>{
        const source=wrap(cite(fields));eq(plan(source).text,source,'Quoted, nested and fenced examples retain all source bytes');
    });
    for(const key of ['autor','editor','publicado','editora'])test(bundle,'same-anchor-association-'+key,()=>{
        const source=cite(key+'=Nome Exemplo|ano=2001|mês=March')+'\n'+cite(key+'=Outra Pessoa|ano=2002|mês=April'),
            expected=cite(key+'=Nome Exemplo|data=março de 2001')+'\n'+cite(key+'=Outra Pessoa|data=abril de 2002'),
            mutation=cite(key+'=Nome Exemplo|data=abril de 2002')+'\n'+cite(key+'=Outra Pessoa|data=março de 2001');
        eq(calc(source).text,calc(expected).text,'Independent complete publication contexts retain their own supplied date');
        eq(api.v219SourceDateRetention(source,expected,cfg).accepted,true,'The exact source repair is retained');
        eq(api.v219SourceDateRetention(source,mutation,cfg).accepted,false,'Equal titles and URLs cannot lend a different author/editor/publisher date');
        ok(api.preservationAudit(source,mutation,cfg).length>0||!!api.safeComposition(source,mutation,cfg),'The complete production guard rejects the association swap');
    });
    for(const [source,expected]of [
        [cite('autor=Nome Exemplo; Outra Pessoa|ano=2001|mês=March'),cite('autor=Nome Exemplo|data=março de 2001|autor2=Outra Pessoa')],
        [cite('autor=Nome Exemplo|coautor=Outra Pessoa|ano=2001|mês=March'),cite('autor=Nome Exemplo|coautor=Outra Pessoa|data=março de 2001')],
        [cite('língua=inglês|ano=2001|mês=March'),cite('língua=en|data=março de 2001')],
        [cite('autor=[[Pessoa fictícia|Nome Exemplo]]|ano=2001|mês=March'),cite('autor=Nome Exemplo|data=março de 2001|autorlink=Pessoa fictícia')]
    ])test(bundle,'composed-native-context-'+sha(source).slice(0,16),()=>{
        const result=calc(source);eq(result.text,calc(expected).text,'Separately proved native people/language transformations compose with the date repair');
        eq(api.v219SourceDateRetention(source,result.text,cfg).accepted,true,'The complete native publication context recognizes only the proved composition');
        eq(api.preservationAudit(source,result.text,cfg),[],'The actual combined output is accepted by the complete production preservation check');
    });
    test(bundle,'literal-context-cannot-lend-date',()=>{
        const literal='"'+cite('data=abril de 2002')+'"',source=cite('ano=2001|mês=March')+'\n'+literal,
            mutation=cite('data=abril de 2002')+'\n'+literal;
        eq(api.v219SourceDateRetention(source,mutation,cfg).accepted,false,'A protected example with the same publication metadata cannot supply the active citation date');
    });
    for(const [source,expected]of [[cite('ano=2001|mês=March'),cite('data=março de 2001')],[cite('data=2001 March'),cite('data=março de 2001')]])for(const mutation of [expected.replace('2001','2002'),expected.replace('março','abril')])test(bundle,'mutation-'+sha(source+mutation).slice(0,16),()=>{
        const fresh=plan(source);eq(api.v219SourceCompatibilityProof(source,mutation,{...fresh,text:mutation},cfg),false,'The fresh source plan cannot authorize an altered date endpoint');
        ok(api.preservationAudit(source,mutation,cfg).length>0||!!api.safeComposition(source,mutation,cfg),'A changed supplied year or month cannot borrow a valid source repair proof');
    });
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
