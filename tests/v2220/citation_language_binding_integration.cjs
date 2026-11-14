'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{api,cfg,sourceSha}=require('./harness.cjs');let checks=0,calculations=0;const rows=[];
function yes(value,message){checks++;assert.ok(value,message);}
const plain='{{cite news|title=Fonte A|url=https://example.org/a|date=19-05-2013|access-date=22-02-2016|language=fr}}',opaque='{{cite web|title=Fonte B|url=https://example.org/b|date=2000|access-date=22-02-2016|language=fr|author=<!-- Autor -->|ref={{harvid|Autor|2000}}}}',source='== Fontes ==\n* '+plain+'\n* '+opaque;
function run(id,before){
 calculations++;const result=api.calculate({kind:'adjust',source:before,originalSource:before,options:cfg});yes(api.v219AutomaticResultSafety(before,result).accepted,id+' safety accepted');
 yes(result.text.includes('língua=fr'),'language retained '+id);yes(!result.text.includes('|language='),'safe Portuguese language alias applied '+id);
 calculations++;const again=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg});yes(again.text===result.text,id+' idempotence');yes(api.v219AutomaticResultSafety(result.text,again).accepted,id+' repeated safety');
 rows.push({id,before,after:result.text});return result.text;
}
const result=run('combined-plain-opaque',source);yes(result.includes('data=19 de maio de 2013'),'proved unambiguous publication date retained');yes(result.includes('acessodata=22 de fevereiro de 2016'),'proved unambiguous access date retained');yes(result.includes('acessodata=22-02-2016'),'opaque owner keeps its date spelling');yes(result.includes('autor=<!-- Autor -->|ref={{harvid|Autor|2000}}'),'opaque author and nested reference program exact');
run('plain-alone','* '+plain);run('opaque-alone','* '+opaque);
const mutants=[
 ['changed-language',result.replace('língua=fr','língua=en')],
 ['removed-language',result.replace('|língua=fr','')],
 ['changed-access-day',result.replace('acessodata=22 de fevereiro de 2016','acessodata=23 de fevereiro de 2016')],
 ['changed-publication-day',result.replace('data=19 de maio de 2013','data=20 de maio de 2013')],
 ['changed-date-role',result.replace('acessodata=22 de fevereiro de 2016','data-publicação=22 de fevereiro de 2016')],
 ['changed-opaque-comment',result.replace('<!-- Autor -->','<!-- Outro -->')],
 ['changed-nested-reference-program',result.replace('{{harvid|Autor|2000}}','{{harvid|Autor|2001}}')]
];
for(const[id,after]of mutants)yes(!api.v219CitationLanguageRetention(source,after,cfg).accepted,id+' cannot be hidden by date equivalence');
const duplicate=plain.replace('|access-date=22-02-2016','|access-date=22-02-2016|acessodata=23-02-2016');
yes(!api.v219CitationLanguageRetention(duplicate,duplicate.replace('acessodata=23-02-2016','acessodata=24-02-2016'),cfg).accepted,'conflicting aliases cannot hide a changed date');
for(const options of [{dates:false},{automaticCitationDateValues:false}])yes(!api.v219CitationLanguageRetention(source,result,{...cfg,...options}).accepted,'disabled date correction cannot license a changed spelling');
for(const key of ['\u00a0acessodata','acessodata\u00a0','\u200bacessodata','Access-date']){const before='{{Citar web|título=Fonte|língua=fr|'+key+'=22-02-2016}}',after=before.replace('22-02-2016','22 de fevereiro de 2016');yes(!api.v219CitationLanguageRetention(before,after,cfg).accepted,'ignored or wrong-case date key remains unproved '+key);}
const receipt={suite:'v222-citation-language-binding-composition',checks,calculations,sourceSha,passed:true,rows,mutationControls:mutants.length+7,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({...receipt,rows:undefined}));
