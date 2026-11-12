'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js')),api=require(bundle);
let checks=0;assert.equal(typeof api.pageContextOptions,'function');checks++;
for(const ns of [1,3,5,11,101]){
 const source={...api.defaults,namespaceNumber:ns,contentModel:'wikitext'},saved=JSON.stringify(source),result=api.pageContextOptions(source);
 assert.equal(result.autoMinor,true,'Talk metadata retains automatic minor eligibility');checks++;
 assert.equal(JSON.stringify(source),saved,'The caller options remain exact');checks++;
 for(const key of ['automaticSpelling','occupationCase','birthDates','headings','endMatter','endTemplateOrder','endSectionOrder','portals','shortDescriptions','obsoleteTemplates','maintenance','shortcuts','markup','categories','multilingual']){
  assert.equal(result[key],false,'The non-minor talk exclusion remains: '+key);checks++;
 }
 assert.equal(api.pageContextOptions({...source,autoMinor:false}).autoMinor,false,'Explicit opt-out remains effective');checks++;
 assert.equal(api.pageContextOptions({...source,contentModel:'javascript'}).autoMinor,false,'Non-wikitext context does not acquire minor eligibility');checks++;
}
for(const ns of [2,4,10,100]){
 assert.equal(api.pageContextOptions({...api.defaults,namespaceNumber:ns,contentModel:'wikitext'}).autoMinor,false,'Other namespaces keep their existing policy');checks++;
}
const result={suite:'talk-minor-2.21.7',bundle,checks,passed:true};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
