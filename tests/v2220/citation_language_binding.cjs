'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const api=process.env.REVISAWIKI_CURRENT_CORE?require('./harness.cjs').api:require('./citation_harness.cjs').load();let checks=0,cases=0;
function same(actual,expected,message){checks++;assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected,message);}
function read(key,value,tail='',options={}){
 cases++;const raw='{{Citar web|title=Fonte|language=fr|'+key+'='+value+tail+'}}',fields=api.v222Fields(raw).fields,field=fields.find(x=>x.key===key),context=api.v218CitationNativeContext(raw);
 const result=api.v222CitationLanguageDateBinding(field,context.native,fields,{dates:true,automaticCitationDateValues:true,...options},field.value,true);
 same(field.value,value,'source field unchanged');return result;
}
for(const [role,keys]of [['Date',['date','data']],['AccessDate',['access-date','acessodata']],['ArchiveDate',['archive-date','arquivodata']]])for(const key of keys){
 const identity=['v222-native-citation-date-binding',role,2016,2,22];
 for(const value of ['2016-02-22','22 de fevereiro de 2016','22-02-2016','22-2-2016',' 2016-02-22 '])same(read(key,value),identity,'same full-day identity '+key+' '+value);
 same(read(key,'13-1-2020'),['v222-native-citation-date-binding',role,2020,1,13],'unambiguous one-digit month');
 same(read(key,'29-02-2024'),['v222-native-citation-date-binding',role,2024,2,29],'Gregorian leap day');
 same(read(key,'2016-02-23'),['v222-native-citation-date-binding',role,2016,2,23],'changed day stays distinct');
 for(const value of ['03-04-2016','12-11-2016','31-02-2016','29-02-2023','00-02-2016','22-13-2016','22-02-0000','2016','fevereiro de 2016','{{Data|2016|2|22}}','2016-02-22<!--nota-->','2016-02-22\u00a0'])same(read(key,value),value,'invalid, ambiguous, partial or opaque value stays exact');
 for(const options of [{dates:false},{automaticCitationDateValues:false}])same(read(key,'22-02-2016','',options),'22-02-2016','disabled date option does not canonicalize');
}
for(const [key,other]of [['date','data'],['access-date','acessodata'],['archive-date','arquivodata']])for(const value of ['','2016-02-22','2016-02-23'])same(read(key,'22-02-2016','|'+other+'='+value),'22-02-2016','conflicting native aliases including empty remain exact');
for(const key of ['date','access-date','archive-date'])same(read(key,'22-02-2016','|'+key+'=22-02-2016'),'22-02-2016','duplicate exact date fields remain exact');
for(const key of ['language','title','url-access','publication-date','Access-date','ARCHIVE-DATE']){
 cases++;const raw='{{Citar web|'+key+'=22-02-2016}}',fields=api.v222Fields(raw).fields,context=api.v218CitationNativeContext(raw);same(api.v222CitationLanguageDateBinding(fields[0],context.native,fields,{dates:true,automaticCitationDateValues:true},fields[0].value,true),'22-02-2016','unrelated/unsupported role never receives a date identity '+key);
}
for(const key of ['\u00a0acessodata','acessodata\u00a0','\u200bacessodata','access-date']){
 cases++;const raw='{{Citar web|'+key+'=22-02-2016}}',fields=api.v222Fields(raw).fields,context=api.v218CitationNativeContext(raw);same(api.v222CitationLanguageDateBinding(fields[0],context.native,fields,{dates:true,automaticCitationDateValues:true},fields[0].value,false),'22-02-2016','unproved literal syntax cannot grant date identity '+key);
}
const receipt={suite:'v222-citation-language-date-binding-identity',cases,checks,passed:true,sourceTextChanged:false,generalNativeValueReaderChanged:false,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
