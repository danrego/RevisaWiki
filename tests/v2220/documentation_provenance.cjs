'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const oldFile=path.join(root,'tests/v2217/feature_examples.json'),nextFile=path.join(__dirname,'feature_examples.json'),oldRaw=fs.readFileSync(oldFile),nextRaw=fs.readFileSync(nextFile),old=JSON.parse(oldRaw),next=JSON.parse(nextRaw);let checks=0;const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
eq(old.examples.length,50,'All frozen example identities remain');eq(next.examples.length,50,'No inherited example is dropped');
const qualified=new Set(['doc-date','doc-isbn','doc-fields-english','doc-image']),changed=[];
for(let i=0;i<old.examples.length;i++){
 const before=old.examples[i],after=next.examples[i];eq({...after,expected:before.expected},before,'Original inputs, options and entry points are unchanged');
 if(before.expected===after.expected)continue;assert(qualified.has(before.id),'An unreviewed expected value changed');checks++;
 const wanted=before.id==='doc-image'?before.expected.replace('[[Imagem:Exemplo.jpg|','[[Ficheiro:Exemplo.jpg|'):before.expected.replace('\n{{Referências}}','\n\n{{Referências}}');eq(after.expected,wanted,'Only the exact approved presentation preference changes');changed.push(before.id);
}
eq(changed.sort(),[...qualified].sort(),'Exactly four documented representation expectations are qualified');
const priorTest=fs.readFileSync(path.join(root,'tests/v2217/documentation_examples.cjs'),'utf8'),currentTest=fs.readFileSync(path.join(__dirname,'documentation_examples.cjs'),'utf8');eq(currentTest,priorTest.replaceAll('2.21.7','2.22.0').replaceAll('v2_21_7','v2_22_0'),'All executable example assertions remain identical apart from version/path');
console.log(JSON.stringify({version:'2.22.0',kind:'exact-documented-preference-provenance',passed:true,checks,cases:50,qualifiedExamples:changed,oldFixtureSha256:sha(oldRaw),fixtureSha256:sha(nextRaw),wikipediaWrites:0}));
