'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.3/RevisaWiki_v2_21_3.js'),api=require(core),native=require('../../src/v2_21_3/native_contract.json');
const {cases}=require('./fixtures.cjs');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa de teste',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-10-28'};
let checks=0,calculations=0;const failures=[];const eq=(a,b,msg)=>{checks++;try{assert.deepEqual(a,b,msg);}catch(e){failures.push({message:msg,actual:a,expected:b});}};
for(const name of ['info/biografia','info/cientista','info/escritor']){
 const profile=api.infoboxCatalog[name];eq(profile.oldid,73315036,'Current target contract is revision-bound');
 for(const key of native.native.consumed)eq(profile.accepted.includes(key),true,'Every consumed native parameter is retained in '+name+': '+key);
 for(const key of ['localnasc','companheiro','companheira','nascimento_país'])eq(profile.ignored.includes(key),false,'Consumed parameters are not diagnosed as ignored');
}
for(const [fields,conflict]of [['ocupação=|ocupações=Escritor',false],['ocupação=Escritor|ocupações=Físico',true],['imagem_tamanho=|imagem tamanho=250px|imagem=Example.jpg',false]]){
 const source=require('./fixtures.cjs').box(fields),r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 eq(r.warnings.some(w=>w.includes('valores diferentes')),conflict,'Only populated current alias conflicts require a warning');
}
const rows=[];
for(const item of cases){
 const r=api.calculate({kind:'adjust',source:item.source,originalSource:item.source,options:cfg});calculations++;
 const gate=api.v219AutomaticResultSafety(item.source,r);eq(gate.accepted,true,item.id+' passes unchanged integrity checks');
 const output=gate.accepted?r.text:item.source;
 for(const value of item.preserve||[]){if(item.id.startsWith('first-nonempty-'))continue;eq(output.includes(value),true,item.id+' preserves literal native data: '+value);}
 for(const value of item.forbidden||[])eq(output.includes(value),false,item.id+' does not infer from child data');
 if(item.parentDate)eq(output.includes('nascimento_data={{DataExt|2|1|1980}}'),true,item.id+' retains the parent date repair');
 if(item.blockedDate)eq(output.includes('nascimento_data=1980-01-02'),true,item.id+' keeps unresolved nesting conservative');
 const second=api.calculate({kind:'adjust',source:output,originalSource:output,options:cfg});calculations++;
 eq(second.text,output,item.id+' is idempotent');eq(api.v219AutomaticResultSafety(output,second).accepted,true,item.id+' second run retains preservation');
 rows.push({id:item.id,accepted:gate.accepted,changed:output!==item.source});
}
const receipt={suite:'biography-compatibility-2.21.3',runtimeSha256:crypto.createHash('sha256').update(fs.readFileSync(core)).digest('hex'),checks,calculations,failures,cases:rows};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'All compatibility guards must pass');
