'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.3/RevisaWiki_v2_21_3.js'),api=require(core),native=require('../../src/v2_21_3/native_contract.json'),{box}=require('./fixtures.cjs');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa de teste',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-10-28'};
let checks=0,calculations=0;const failures=[],eq=(a,b,message)=>{checks++;try{assert.deepEqual(a,b,message);}catch(e){failures.push({message,actual:a,expected:b});}};const rows=[];
for(const name of ['Biografia','Cientista','Escritor'])for(const key of native.addedRendererKeys)for(const value of ['', 'Valor de teste']){
 const source=box(key+'='+value,name),first=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 eq(first.text.includes('|'+key+'='+value),true,'Current native key and full value preserved: '+name+' '+key+' '+(value?'populated':'blank'));
 eq(api.v219AutomaticResultSafety(source,first).accepted,true,'Whole result retains integrity gate');
 const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options:cfg});calculations++;eq(second.text,first.text,'Current native fields remain idempotent');
 eq(first.warnings.some(w=>w.includes('"'+key+'" é aceito pelo verificador, mas não é lido')),false,'No stale ignored-field diagnosis for a consumed slot');rows.push({name,key,populated:!!value});
}
const receipt={suite:'biography-all-new-native-fields-2.21.3',runtimeSha256:crypto.createHash('sha256').update(fs.readFileSync(core)).digest('hex'),nativeRevision:73315036,checks,calculations,failures,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'All current consumed fields must be preserved');
