'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex'),files=process.argv.slice(2);
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.resolve(__dirname,'../../dist/2.19.0',name)));
const report={kind:'semicolon-people-and-named-definition-composition',status:'passed',checks:0,cases:[],bundles:[],failures:[],networkRequests:0,wikipediaWrites:0};
function check(value,message){report.checks++;assert(value,message);}
for(const file of files){
    const a=require(file),bundle=path.basename(file);report.bundles.push({bundle,sha256:hash(fs.readFileSync(file))});
    const cfg={...a.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,endMatter:false};
    for(const family of ['autor','editor'])for(const ignored of ['', '|wayb=20200101120000 ']){
        const before='{{Citar web|url=https://example.invalid/a|título=Fonte literal|'+family+'=Silva, A.; Costa, B.'+ignored+'}}';
        const after='{{Citar web|url=https://example.invalid/a|título=Fonte literal|'+family+'=Silva, A.'+ignored+'|'+family+'2=Costa, B.}}';
        const source='A.<ref name="fonte" /> B.<ref>{{Citar web|título=Outra fonte|língua=en}}</ref> C.<ref name="fonte">'+before+'</ref>';
        const expected='A.<ref name="fonte">'+after+'</ref> B.<ref>{{Citar web|título=Outra fonte|língua=en}}</ref> C.<ref name="fonte" />';
        const row={bundle,id:family+(ignored?' with ignored field':' native fields'),sourceSha256:hash(source),expectedEndpointSha256:hash(expected),status:'passed'};
        try{
            check(a.v219CitationLanguageKeeperPeople(before,cfg)===after,'Only source-delimited personal names become indexed fields');
            const result=a.calculate({kind:'adjust',source,options:cfg});
            check(result.text===expected,'The whole action preserves both sources and places the complete definition first');
            check(!result.preservation?.length,'The pipeline preserves source obligations');
            check(!a.preservationAudit(source,expected,cfg).length,'The independent source guard accepts the exact composition');
            check(a.safeComposition(source,expected,cfg)==='','The independent composition guard accepts the exact composition');
            check(a.calculate({kind:'adjust',source:expected,options:cfg}).text===expected,'A second action does not change the endpoint');
            const mutations=[expected.replace('Costa, B.','Souza, C.'),expected.replace('|'+family+'2=Costa, B.',''),expected.replace('https://example.invalid/a','https://example.invalid/other'),expected.replace('língua=en','língua=fr'),expected.replace('Outra fonte','Outra publicação')];
            if(ignored)mutations.push(expected.replace(ignored,''));
            for(const candidate of mutations){check(a.preservationAudit(source,candidate,cfg).length>0,'Changed names, URLs, language, sources and ignored fields remain refused');check(a.safeComposition(source,candidate,cfg)!=='','The composition guard also refuses each unrelated mutation');}
            for(const disabled of ['authors','citations'])check(a.v219CitationLanguageKeeperPeople(before,{...cfg,[disabled]:false})===null,'The read certificate obeys the disabled option');
            for(const unsafe of [before.replace('Silva, A.; Costa, B.','Instituto de Estudos; Universidade de Exemplo'),before.replace('Silva, A.; Costa, B.','Silva, A.;'),before.slice(0,-2)+'|'+family+'2=Pessoa Existente}}',before.slice(0,-2)+'|ref=harv}}',before.slice(0,-2)+'|ignorado={{Modelo fictício}}}}'])check(a.v219CitationLanguageKeeperPeople(unsafe,cfg)===null,'Institutional, incomplete, competing, anchored and expanding calls remain refused');
        }catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id:row.id,message:error.message});}
        report.cases.push(row);
    }
}
console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
