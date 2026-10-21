'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),files=process.argv.slice(2);
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.resolve(__dirname,'../../dist/2.19.0',name)));
const report={kind:'bare-link-native-date-and-named-keeper-composition',status:'passed',checks:0,cases:[],bundles:[],failures:[],networkRequests:0,wikipediaWrites:0};
function check(value,message){report.checks++;assert(value,message);}
for(const file of files){
    const a=require(file),bundle=path.basename(file);report.bundles.push({bundle,sha256:sha(fs.readFileSync(file))});
    const cfg={...a.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,endMatter:false};
    for(const label of ['Título literal',"Título com apóstrofo d'água"]){
        const body='{{Citar web|url=https://example.invalid/segunda|título=Outra fonte|editor=Silva, A.; Costa, B.|wayb=20200101120000 }}';
        const changed='{{Citar web|url=https://example.invalid/segunda|título=Outra fonte|editor=Silva, A.|wayb=20200101120000 |editor2=Costa, B.}}';
        const language='{{Citar livro|título=Obra literal|língua=en|acessodata=22-06-2019}}',dated='{{Citar livro|título=Obra literal|língua=en|acessodata=22 de junho de 2019}}';
        const bare='[https://example.invalid/primeira '+label+']',cited='{{Citar web|url=https://example.invalid/primeira|título='+label+'}}';
        const source='A.<ref name="fonte" /> B.<ref>'+language+'</ref> C.<ref>'+bare+'</ref> D.<ref name="fonte">'+body+'</ref>';
        const expected='A.<ref name="fonte">'+changed+'</ref> B.<ref>'+dated+'</ref> C.<ref>'+cited+'</ref> D.<ref name="fonte" />';
        const row={bundle,id:sha(label).slice(0,16),sourceSha256:sha(source),expectedEndpointSha256:sha(expected),status:'passed'};
        try{
            const result=a.calculate({kind:'adjust',source,options:cfg});
            check(result.text===expected,'Independent whole-action endpoint combines only the declared source repairs');
            check(!result.preservation?.length,'The original source obligations remain satisfied');
            check(!a.preservationAudit(source,expected,cfg).length,'The public preservation guard accepts the source-bound composition');
            check(a.safeComposition(source,expected,cfg)==='','The public composition guard also accepts it');
            check(a.calculate({kind:'adjust',source:expected,options:cfg}).text===expected,'The complete endpoint is stable');
            const mutants=[expected.replace('https://example.invalid/primeira','https://example.invalid/trocada'),expected.replace('|título='+label,''),expected.replace('Costa, B.','Souza, C.'),expected.replace('|wayb=20200101120000 ',''),expected.replace('língua=en','língua=fr'),expected.replace('C.<ref>','C.<ref name="inventada">'),expected.replace('B.<ref>'+dated+'</ref> C.<ref>'+cited+'</ref>','B.<ref>'+cited+'</ref> C.<ref>'+dated+'</ref>')];
            for(const candidate of mutants){check(a.preservationAudit(source,candidate,cfg).length>0,'Mutated metadata, source identities and call sites remain refused');check(a.safeComposition(source,candidate,cfg)!=='','The composition guard refuses each mutation as well');}
            check(!a.v219CitationLanguageRetention(source,expected,{...cfg,bareReferences:false}).accepted,'The bare-source certificate cannot bypass its disabled option');
        }catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id:row.id,message:error.message});}
        report.cases.push(row);
    }
}
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
