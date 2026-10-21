'use strict';
// Independently authored oracle controls. No production program is imported.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const oracle=require('../catalog_primary_oracle.cjs'),scope=require('../catalog_native_header_scope_contract.json'),contract=require('../catalog_native_header_composition_adjudication.json');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),ctx={data:{translationRules:{profiles:{}}}},rows=[];
let checks=0;
function run(id,fn){fn();rows.push({id,status:'passed'});}
for(const original of scope.rows){
 const test={...original,expected:original.oldExpected,helperExpected:original.oldHelperExpected};
 run('original-header-'+original.id,()=>{const amended=oracle.amend(test,ctx);assert.equal(amended.test.expected,original.oldExpected);assert.equal(amended.test.helperExpected,original.oldHelperExpected);assert.equal(amended.test.expected.slice(amended.test.expected.indexOf('|')),test.source.slice(test.source.indexOf('|')));checks+=3;});
 for(const tag of ['nowiki','pre','code','syntaxhighlight','source','math','chem'])run('protected-'+tag+'-'+original.id,()=>{assert.equal(oracle.amend({...test,source:'<'+tag+'>'+test.source+'</'+tag+'>',category:'foreign-protected'},ctx),null);checks++;});
 run('multilingual-off-'+original.id,()=>{assert.equal(oracle.amend({...test,options:{...test.options,multilingual:false}},ctx),null);checks++;});
 for(const patch of [{source:original.source.replace('9780306406157','9780306406158')},{options:{...test.options,citations:false}},{expected:original.oldExpected+' '}])run('binding-mutation-'+original.id+'-'+rows.length,()=>{assert.throws(()=>oracle.amend({...test,...patch},ctx));checks++;});
}
for(const row of contract.declaredRepairs){
 const target=row.expected.slice(2,row.expected.indexOf('|')),raw='{{'+target+'|'+row.sourceKey+'=Valor literal}}';
 const test={id:row.id,category:'default-integration-foreign',scenario:'proved-field-with-all-default-rules',identity:[row.source.slice(2,row.source.indexOf('|')),row.sourceKey,row.targetKey],source:row.source,expected:raw,options:{multilingual:true,automaticParameterNames:true,citations:true,infoboxes:true,auxiliaryTemplates:true}};
 run('explicit-composition-'+row.id,()=>{const amended=oracle.amend(test,ctx);assert.equal(amended.test.expected,row.expected);assert.equal(amended.review.changed,true);checks+=2;});
 run('different-literal-refuses-adjudication-'+row.id,()=>{assert.throws(()=>oracle.amend({...test,source:row.source.replace('Valor literal','Outro valor')},ctx));checks++;});
 run('protected-composition-'+row.id,()=>{assert.equal(oracle.amend({...test,source:'<nowiki>'+row.source+'</nowiki>',category:'foreign-protected'},ctx),null);checks++;});
 run('translation-disabled-'+row.id,()=>{assert.equal(oracle.amend({...test,options:{...test.options,multilingual:false}},ctx),null);checks++;});
 run('key-repair-disabled-'+row.id,()=>{assert.throws(()=>oracle.amend({...test,options:{...test.options,automaticParameterNames:false}},ctx));checks++;});
 run('unrelated-descriptor-not-broadened-'+row.id,()=>{assert.equal(oracle.amend({...test,id:'unrelated-control',source:row.source.replace('Valor literal','no')},ctx).test.expected,raw.replace('Valor literal','no'));checks++;});
}
run('all-original-contract-inputs-preserved',()=>{assert.equal(oracle.inputsUnchanged(),true);assert.equal(contract.productionRuntimeChanged,false);assert.equal(contract.oldReceiptsReclassified,false);checks+=3;});
process.stdout.write(JSON.stringify({kind:'native-header-and-declared-key-catalog-oracle-unit',status:'passed',cases:rows,checks,runnerSha256:sha(fs.readFileSync(__filename)),oracleSha256:oracle.sourceSha256,productionRuntimeImports:0,actualRuntimeCalculations:0,articleCoverageCredit:0,wikipediaWrites:0},null,2)+'\n');
