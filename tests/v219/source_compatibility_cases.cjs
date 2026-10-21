'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),args=process.argv.slice(2),files=args.filter(x=>!x.startsWith('--')).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const report={kind:'finite-source-compatibility',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),
    helperSha256:sha(fs.readFileSync(path.join(root,'src/v2_19/source_compatibility.js'))),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),m);},ok=(x,m)=>{report.checks++;assert.ok(x,m);};
function test(bundle,id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(e){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:e.message});}}
for(const file of files){
    const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);
    for(const name of ['v219SourceCompatibilityRule','v219SourceCompatibilityValue','v219SourceCompatibilityScope','v219SourceCompatibilityPlan','v219SourceCompatibilityProof',
        'v219CitationEmptyPartsPlan','v219CitationEmptyPartsProof','v219CitationIdentifierNormalization'])assert.equal(typeof api[name],'function','The actual release exports '+name);
    report.bundles.push({bundle,runtimeVersion:api.version,runtimeSha256:sha(bytes),bytes:bytes.length,helperPreview:false});
    const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,
        authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,
        registryDoiCheck:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false};
    const cite=field=>'Texto.<ref>{{Citar web|título=Fonte fictícia|url=https://example.org/fonte|'+field+'}}</ref>\n{{Referências}}',
        plan=(source,extra={})=>api.v219SourceCompatibilityPlan(source,{...cfg,...extra}),
        calc=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}});
    const fixes=[...['acessado-em','acesssodata','accesodata','acssodata','acsseodata','aessodata','dataaceso','acesso_data','data_acesso',
        'data_de_acesso','data de acesso','acesso data','consultado em','consultado','visitadoem','acessdata','fechaaceso'].map(key=>[key+'=5 de março de 2001','acessodata=5 de março de 2001']),
        ['pág=5','página=5'],['pag=5','página=5'],['pg=5','página=5'],['sub-titulo=Nota literal','subtítulo=Nota literal'],
        ['sub-título=Nota literal','subtítulo=Nota literal'],['colecção=Série literal','coleção=Série literal'],
        ['seriesno=5','numero-serie=5'],['urlaccess=registration','acessourl=registration'],['urlaccess=limited','acessourl=limited'],
        ['urlaccess=subscription','acessourl=subscrição'],['último-editor=Nome literal','editor-sobrenome=Nome literal'],
        ['editor-name=Nome literal','editor-nome=Nome literal'],['editor-lastname=Nome literal','editor-sobrenome=Nome literal']];
    for(let index=1;index<=99;index++)for(const part of ['nome','sobrenome','name','lastname'])fixes.push(['editor'+index+'-'+part+'=Nome literal','editor-'+(/^(?:sobrenome|lastname)$/.test(part)?'sobrenome':'nome')+index+'=Nome literal']);
    for(let index=1;index<=99;index++)fixes.push(['último-editor'+index+'=Nome literal','editor-sobrenome'+index+'=Nome literal']);
    for(const index of ['',...Array.from({length:99},(_,i)=>String(i+1))])for(const key of ['enlaceeditor','enlace-editor','linkeditor','link-editor'])
        fixes.push([key+index+'=Título fictício','editor-link'+index+'=Título fictício']);
    for(const [before,after]of fixes)test(bundle,'exact-'+before.split('=')[0],()=>{
        const source=cite(before),expected=cite(after),first=plan(source);
        eq(first.text,expected,'Only the reviewed native key and separately typed status token change');
        eq(first.edits.length,before==='urlaccess=subscription'?2:1,'Each literal key/value edit has its own operation');
        ok(first.edits.every(x=>x.proof.minorSafe===false),'A previously ignored field is never declared minor-safe');
        ok(api.v219SourceCompatibilityProof(source,expected,first,cfg),'The complete exact plan replays');
        eq(plan(expected).text,expected,'The native target is stable');
        const action=calc(source),native=calc(expected);
        eq(action.text,native.text,'The production action reaches the same result as the proved native destination');
        eq(calc(action.text).text,action.text,'The real production action completes in one pass');
        ok(!action.preservation?.length,'No repair-specific preservation warning remains');
        const changed={...first,text:first.text+'X'};
        eq(api.v219SourceCompatibilityProof(source,changed.text,changed,cfg),false,'An altered destination cannot borrow the original proof');
    });
    for(const [before]of fixes){const key=before.split('=')[0],rule=api.v219SourceCompatibilityRule(key);for(const alias of rule.family){
        if(alias===key)continue;
        for(const value of ['','Outro valor'])test(bundle,'collision-'+key+'-'+alias+'-'+(value?'nonempty':'empty'),()=>{
            const source=cite(before+'|'+alias+'='+value);eq(plan(source).text,source,'Every complete native-family alias blocks choosing a value');
        });
    }}
    for(const alias of api.citationParameters){
        if(!/^(?:access|acesso|dataacesso|fecha|editor|pagina|página|page|p$|subtitulo|subtítulo|departamento|department|series|cole|url-access|acessourl|acesso-url)/.test(alias))continue;
        test(bundle,'accepted-native-key-'+alias,()=>{const source=cite(alias.replace('#','2')+'=Valor literal');eq(plan(source).text,source,'Accepted native spellings do not create cosmetic churn');});
    }
    const raw='{{Citar web|título=Fonte fictícia|url=https://example.org/fonte|pág=5}}',wrappers=[
        ['straight',s=>'"'+s+'"'],['curly',s=>'“'+s+'”'],['guillemet',s=>'«'+s+'»'],['italic',s=>"''"+s+"''"],['bold',s=>"'''"+s+"'''"],
        ...['nowiki','pre','code','syntaxhighlight','source','math','blockquote','q','chem','poem','gallery'].map(tag=>[tag,s=>'<'+tag+'>'+s+'</'+tag+'>']),
        ['comment',s=>'<!--'+s+'-->'],['quotation-template',s=>'{{Quotation|'+s+'}}'],['native-quotation-template',s=>'{{Citação|'+s+'}}'],
        ['unknown-parent-template',s=>'{{Modelo fictício|codigo='+s+'}}'],['fenced',s=>'```wikitext\n'+s+'\n```'],['fenced-tilde',s=>'~~~wikitext\n'+s+'\n~~~']];
    for(const [label,wrap]of wrappers)test(bundle,'protected-'+label,()=>{const source=wrap(raw);eq(plan(source).text,source,'Quoted, nested and literal examples remain exact');});
    for(const [key,val]of [['pág',' 5 <!--comentário literal--> '],['sub-titulo','"Texto literal"'],['pág','<!--nota--> 5'],
        ['urlaccess',' subscription <!--nota literal--> '],['urlaccess','<!--nota literal--> subscription']])test(bundle,'value-bytes-'+sha(key+val).slice(0,10),()=>{
        const source=cite(key+'='+val),first=plan(source),target=api.v219SourceCompatibilityRule(key).target;
        const expected=cite(target+'='+(key==='urlaccess'?val.replace('subscription','subscrição'):val));
        eq(first.text,expected,'Padding, literal quotation and complete comments stay exact around the changed token');
        eq(plan(expected).text,expected,'The value-preserving result is stable');
    });
    for(const [key,value]of [['acessado-em','March 2001'],['acessado-em','29 de fevereiro de 2001'],['acessado-em','05/03/2001'],
        ['urlaccess','subscription extra'],['urlaccess','unknown'],['urlaccess','Subscription'],['urlaccess','true'],['pág',''],['pág','{{Valor fictício}}'],
        ['enlace-editor2','[[Nome fictício]]'],['enlace-editor2','https://example.org/'],['sub-titulo','Texto\nOutra linha'],['editor02-nome','Nome'],['editor100-nome','Nome'],['Editor2-nome','Nome'],['pág','<!-- comentário sem fim']])test(bundle,'unproved-'+sha(key+value).slice(0,10),()=>{
        const source=cite(key+'='+value);eq(plan(source).text,source,'Incomplete, dynamic, invalid and unreviewed values are preserved');
    });
    for(const extra of [{namespaceNumber:1},{namespaceNumber:10},{discussionPage:true},{sectionOnly:true},{contentModel:'javascript'},
        {automaticSourceCompatibility:false},{citations:false},{automaticParameterNames:false},{pageRedirect:true},{pageDisambiguation:true}])test(bundle,'scope-'+sha(JSON.stringify(extra)).slice(0,10),()=>{
        const source=cite('pág=5');eq(plan(source,extra).text,source,'The explicit scope or option gate prevents the repair');
    });
    for(const name of ['Citar web','Citar jornal','Citar livro','Citar revista','Citar periódico'])test(bundle,'pinned-native-family-'+name,()=>{
        const source='{{'+name+'|título=Fonte fictícia|url=https://example.org/fonte|pág=5}}',expected=source.replace('|pág=','|página=');
        eq(plan(source).text,expected,'Only the five pinned CS1 renderer contracts receive this key repair');
    });
    for(const name of ['Modelo fictício','Cite unknown','Citar webx','Citar web/doc','Info/Biografia','Citar episódio','Citar vídeo','Citar sports-reference','Citar discurso','Citar Box Office Mojo'])test(bundle,'unknown-family-'+name,()=>{
        const source='{{'+name+'|pág=5}}';eq(plan(source).text,source,'An unproved template family gains no citation semantics');
    });
    for(const name of ['CITAR WEB','Citar Web','CITAR JORNAL','Citar Jornal','Cite Web'])test(bundle,'noncanonical-native-header-'+name,()=>{
        const source='{{'+name+'|pág=5}}';eq(plan(source).text,source,'Only exact native contract identities receive the native-key plan');
    });
    for(const key of ['doi','DOI'])for(const value of ['/10.1000/example',' /10.12345/EXAMPLE(2):test ','/10.1000/example_1/part'])test(bundle,'typed-doi-slash-'+sha(key+value).slice(0,16),()=>{
        const source=cite(key+'='+value),expected=cite(key+'='+value.replace('/10.','10.')),first=plan(source);
        eq(first.text,expected,'Only one extraneous slash is removed from a unique typed DOI field');
        eq(first.edits.length,1,'The single source slash has one operation');
        ok(first.edits[0].proof.minorSafe===false,'A repaired identifier is not represented as newly invisible cosmetic metadata');
        ok(api.v219SourceCompatibilityProof(source,expected,first,cfg),'The original typed DOI plan is replayable');
        const result=calc(source);eq(result.text,calc(expected).text,'The complete action reaches the exact native identifier');
        eq(calc(result.text).text,result.text,'The DOI repair finishes in one action');
        eq(api.preservationAudit(source,result.text,cfg),[],'The independent identifier inventory retains the exact DOI identity');
        eq(api.safeComposition(source,result.text,cfg),'','The typed identifier repair composes with all surrounding source');
    });
    for(const fields of ['doi=//10.1000/example','doi=/10.1000/example.', 'doi=/10.1000/example extra',
        'doi=/10.1000/example|DOI=','doi=/10.1000/example|DOI=10.1000/other','doi=/10.1000/example|doi=/10.1000/example',
        'doi=/10.100/example','doi=/10.1000/','doi={{Valor fictício}}','ID=ISBN 9780306406157'])test(bundle,'unproved-typed-identifier-'+sha(fields).slice(0,16),()=>{
        const source=cite(fields);eq(plan(source).text,source,'Duplicate aliases, invalid DOI grammar, generic valid ID and uncertain suffixes are retained');
    });
    for(const name of ['Citar web','Citar jornal','Citar livro','Citar revista','Citar periódico'])for(const middle of ['', '  ', '\n', '\t'])test(bundle,'native-empty-part-'+name+'-'+sha(middle).slice(0,8),()=>{
        const source='{{'+name+'|título=Fonte fictícia|'+middle+'|url=https://example.org/|}}',
            expected='{{'+name+'|título=Fonte fictícia|url=https://example.org/}}',first=api.v219CitationEmptyPartsPlan(source,cfg);
        eq(first.text,expected,'Only empty unnamed parts of the exact native named-argument contract are removed');
        eq(first.edits.length,2,'Every empty unnamed part is separately counted');
        ok(api.v219CitationEmptyPartsProof(source,expected,first,cfg),'The source-bound empty-part proof replays');
        eq(api.v219CitationEmptyPartsPlan(expected,cfg).text,expected,'The native named-argument call is stable');
        const result=calc(source);eq(result.text,calc(expected).text,'The production transaction reaches the native endpoint');
        eq(calc(result.text).text,result.text,'Removing an empty part does not leave repairs for a second click');
        eq(api.preservationAudit(source,result.text,cfg),[],'Removing ignored empty positions loses no named metadata');
    });
    for(const source of ['{{Citar web||título=Fonte fictícia|title=|url=https://example.org/}}',
        '{{Citar web|título=Fonte fictícia||pontofinal=|ref=|url=https://example.org/}}'])test(bundle,'named-blank-retention-'+sha(source).slice(0,16),()=>{
        const expected=source.replace('||','|'),first=api.v219CitationEmptyPartsPlan(source,cfg);
        eq(first.text,expected,'Named blank overrides remain byte-for-byte while the unrelated unnamed blank is removed');
    });
    for(const source of ['{{Citar web|Texto posicional||título=Fonte fictícia}}','{{Citar web|1=||título=Fonte fictícia}}',
        '{{Citar web|||}}','{{Cite Web||title=Fonte fictícia}}','{{Citar Web||título=Fonte fictícia}}','{{Modelo fictício||nome=Valor}}',
        '{{Citar web||{{{campo}}}=Valor}}'])test(bundle,'unproved-empty-part-'+sha(source).slice(0,16),()=>{
        eq(api.v219CitationEmptyPartsPlan(source,cfg).text,source,'Unproved numeric, nonempty positional, empty-only and dynamic argument roles remain untouched');
    });
    for(const [label,wrap]of wrappers)test(bundle,'protected-empty-part-'+label,()=>{
        const source=wrap('{{Citar web||título=Fonte fictícia}}');eq(api.v219CitationEmptyPartsPlan(source,cfg).text,source,'Literal '+label+' examples retain empty syntax');
    });
    for(const extra of [{citations:false},{citationRepairs:false},{syntaxRepairs:false},{structuralRepairs:false},{automaticSourceCompatibility:false},
        {namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true},{discussionPage:true},{pageRedirect:true},{pageDisambiguation:true}])test(bundle,'empty-part-option-'+sha(JSON.stringify(extra)).slice(0,16),()=>{
        const source='{{Citar web||título=Fonte fictícia}}';eq(api.v219CitationEmptyPartsPlan(source,{...cfg,...extra}).text,source,'The exact option/context gate controls structural empty-part repair');
    });
    for(const [name,target]of [['Cite web','Citar web'],['Cite news','Citar jornal'],['Cite book','Citar livro'],['Cite journal','Citar periódico'],['Cite magazine','Citar revista']])for(const prefix of ['', 'Predefinição:', 'Template:'])test(bundle,'local-citation-redirect-'+name+'-'+prefix,()=>{
        const source='{{'+prefix+name+'|title=Fonte fictícia|pág=12|editor-name=Nome literal|last2=Sobrenome literal}}',
            planned=source.replace('|pág=','|página=').replace('|editor-name=','|editor-nome='),first=plan(source);
        eq(first.text,planned,'A verified local redirect shares the exact native parameter interface without an inferred foreign contract');
        ok(first.edits.every(edit=>Number.isInteger(edit.proof.nativeAliasOldid)),'Every redirect repair records its exact alias revision');
        const result=calc(source),expected='{{'+target+'|title=Fonte fictícia|página=12|editor-nome=Nome literal|last2=Sobrenome literal}}';
        eq(result.text,calc(expected).text,'The verified header and metadata compose in one production action');
        eq(calc(result.text).text,result.text,'An English-spelled local redirect requires no second click');
        eq(api.preservationAudit(source,result.text,cfg),[],'The complete mixed-language native metadata remains intact');
        const emptySource='{{'+prefix+name+'||title=Fonte fictícia|pág=12}}',emptyPlan=api.v219CitationEmptyPartsPlan(emptySource,cfg);
        eq(emptyPlan.text,emptySource.replace('||','|'),'The same local redirect has no hidden positional interface');
        const combined=calc(emptySource);eq(combined.text,calc('{{'+target+'|title=Fonte fictícia|página=12}}').text,'Empty-part and key fixes compose with the local redirect');
        eq(calc(combined.text).text,combined.text,'No delayed second-click edit remains');
    });
    test(bundle,'empty-part-unblocks-finite-metadata',()=>{
        const source='{{Citar web||título=Fonte fictícia|pág=5|doi=/10.1000/example}}',expected='{{Citar web|título=Fonte fictícia|página=5|doi=10.1000/example}}',result=calc(source);
        eq(result.text,calc(expected).text,'The structural cleanup makes the already-supported key and identifier repairs reachable in the same action');
        eq(calc(result.text).text,result.text,'The combined repair needs no second click');
    });
    for(const [role,value,expected]of [
        ['isbn','ISBN 9780306406157','9780306406157'],['isbn','ISBN-13: 978-0-306-40615-7','978-0-306-40615-7'],
        ['isbn',' ISBN-10: 0-306-40615-2 ',' 0-306-40615-2 '],['isbn','0-306-40615-2','0-306-40615-2'],
        ['doi','DOI: 10.1000/example','10.1000/example'],['doi','https://doi.org/10.1000/example','10.1000/example'],
        ['doi',' http://dx.doi.org/10.1000/EXAMPLE ',' 10.1000/EXAMPLE '],['doi',' 10.1000/example ',' 10.1000/example '],
        ['pmid','PMID: 12345','12345'],['pmid','https://pubmed.ncbi.nlm.nih.gov/12345/','12345'],
        ['pmid',' PMID 42900000 ',' 42900000 '],['pmc','PMC: 12345','12345'],['pmc',' PMC7500000 ',' 7500000 ']
    ])test(bundle,'validated-prefix-'+sha(role+value).slice(0,16),()=>{
        eq(api.v219CitationIdentifierNormalization(role,value),expected,'Only a complete identifier with validated native grammar is normalized');
        const source=cite(role+'='+value),result=calc(source);
        ok(result.text.includes('|'+role+'='+expected+'}}'),'The actual identifier writer uses the validated padding-preserving value');
        eq(calc(result.text).text,result.text,'Validated prefix normalization is idempotent');
        eq(api.preservationAudit(source,result.text,cfg),[],'The independent typed inventory agrees with the validated normalization');
    });
    for(const [role,value]of [
        ['isbn','ISBN 9780306406158'],['isbn','ISBN-10: 9780306406157'],['isbn','ISBN-13: 0306406152'],
        ['isbn','ISBN 1234'],['isbn','ISBN 9780306406157 extra'],['isbn','"ISBN 9780306406157"'],
        ['doi','doi: invalid'],['doi','doi:10.1000/example.'],['doi','https://doi.org/invalid'],
        ['doi','https://doi.org/10.1000/example?x=1'],['doi','doi:10.1000/example extra'],['doi','DOI:/10.1000/example'],
        ['pmid','PMID 0'],['pmid','PMID 0123'],['pmid','PMID 42900001'],['pmid','PMID 123/'],['pmid','PMID 1234567890'],
        ['pmc','PMC 0'],['pmc','PMC 0123'],['pmc','PMC 7500001'],['pmc','PMC 123 extra'],['pmc','PMC 1234567890'],
        ['doi','doi:{{Valor fictício}}'],['isbn','ISBN 9780306406157\nOutro'],['doi','doi:<!--nota-->10.1000/example']
    ])test(bundle,'invalid-prefix-preserved-'+sha(role+value).slice(0,16),()=>{
        eq(api.v219CitationIdentifierNormalization(role,value),null,'Invalid checksum, prefix mismatch, unsupported suffix, zero, leading zero and native limit failures do not authorize a rewrite');
        const source=cite(role+'='+value),result=calc(source);
        ok(result.text.includes('|'+role+'='+value+'}}'),'The actual writer preserves the complete invalid identifier instead of letting the guard reject its own change');
    });
    test(bundle,'cheap-candidate-gate',()=>{eq(api.v219SourceCompatibilityCandidate('Texto literal sem parâmetros.'),false,'No template parse is needed without an exact candidate');});
    const auxiliary=[
        ['{{Bar box|título=Rótulo literal|bars=Conteúdo literal}}','{{Bar box|title=Rótulo literal|bars=Conteúdo literal}}'],
        ['{{bar box|bars={{Bar percent|Valor fictício|60}}|título=Rótulo literal}}','{{bar box|bars={{Bar percent|Valor fictício|60}}|title=Rótulo literal}}'],
        ['{{Bar box|título= "Rótulo literal" <!--comentário--> }}','{{Bar box|title= "Rótulo literal" <!--comentário--> }}']
    ];
    for(const name of ['Youtube','YouTube'])for(const selector of ['user','usuario','u','channel','canal','c','show','programa','s','pgm','id']){
        const value=selector==='id'?'abcdefghijk':'Identificador_literal';
        auxiliary.push(['{{'+name+'|'+selector+'='+value+'|título=Rótulo literal}}','{{'+name+'|'+selector+'='+value+'|titulo=Rótulo literal}}']);
    }
    for(const [source,expected]of auxiliary)test(bundle,'native-auxiliary-label-'+sha(source).slice(0,16),()=>{
        const first=plan(source);eq(first.text,expected,'Only the exact unsupported branch-specific label key changes');
        eq(first.edits.length,1,'One original key is one operation');
        ok(first.edits[0].proof.minorSafe===false,'Newly displayed label metadata does not receive an automatic minor classification');
        ok(api.v219SourceCompatibilityProof(source,expected,first,cfg),'The complete native auxiliary plan replays from the original source');
        eq(plan(expected).text,expected,'The valid native key is stable');
        const result=calc(source);eq(result.text,calc(expected).text,'The actual production action reaches the exact native auxiliary endpoint');
        eq(calc(result.text).text,result.text,'The auxiliary conversion completes in one action');
        eq(api.preservationAudit(source,result.text,cfg),[],'No original label or nested bar content is lost');
        eq(api.safeComposition(source,result.text,cfg),'','The independent whole-source composition accepts the bounded key repair');
        eq(plan(source,{auxiliaryTemplates:false}).text,source,'The auxiliary feature switch disables its own conversion');
        eq(plan(source,{citations:false}).text,expected,'The auxiliary label repair does not depend on the citation feature switch');
        for(const [label,wrap]of wrappers){const literal=wrap(source);eq(plan(literal).text,literal,'Protected '+label+' auxiliary examples retain their exact source');}
    });
    for(const source of [
        '{{Youtube|título=Rótulo literal}}','{{Youtube|id_canal=Identificador|título=Rótulo literal}}',
        '{{Youtube|playlist=Identificador|título=Rótulo literal}}','{{Youtube|id=abcdefghijk|1=Outro|título=Rótulo literal}}',
        '{{Youtube|id=abcdefghijk|2=Outro|título=Rótulo literal}}','{{Youtube|id=abcdefghijk|title=Outro|título=Rótulo literal}}',
        '{{Youtube|id=abcdefghijk|title=|título=Rótulo literal}}','{{Youtube|id=abcdefghijk|titulo=|título=Rótulo literal}}',
        '{{Youtube|id=abcdefghijk|user=Outro|título=Rótulo literal}}','{{Youtube|id=abcdefghijk|user=|título=Rótulo literal}}',
        '{{Youtube|user={{Valor fictício}}|título=Rótulo literal}}','{{Youtube|id=curto|título=Rótulo literal}}',
        '{{Youtube|user=Identificador|título=Rótulo literal|outro=Valor}}','{{Youtube|user=Identificador|título=}}',
        '{{Bar box|title=Outro|título=Rótulo literal}}','{{Bar box|title=|título=Rótulo literal}}',
        '{{Bar box|titulo=Outro|título=Rótulo literal}}','{{Bar box|título=Rótulo literal|outro=Valor}}',
        '{{Bar box|título={{Nome fictício}}}}','{{Bar box|título=Rótulo\nOutra linha}}','{{Bar box|1=Outro|título=Rótulo}}',
        '{{Bar Box|título=Rótulo}}','{{YOUTUBE|user=Identificador|título=Rótulo}}'
    ])test(bundle,'unproved-auxiliary-'+sha(source).slice(0,16),()=>{
        eq(plan(source).text,source,'Unproved native branches, conflicting aliases, positional labels and dynamic selectors remain intact');
    });
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
