'use strict';
// Oracle-only controls. This file imports no production program and claims no
// editing capability or newly executed article test.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),oracle=require('../catalog_primary_oracle.cjs');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const source='{{Reflist|campo_catalogo_sem_destino_7349=}}',base={id:'fixture-native-unknown',category:'native-unknown',scenario:'unknown-empty-field',identity:['template','reflist'],source,expected:'{{Reflist}}',helperExpected:'{{Reflist}}',options:{auxiliaryTemplates:true,automaticEmptyParameters:true}},context={data:{translationRules:{profiles:{}}}};
const report={kind:'native-Reflist-catalog-policy-unit',status:'passed',cases:[],checks:0,productionRuntimeImports:0,actualRuntimeCalculations:0,articleCoverageCredit:0,wikipediaWrites:0,runnerSha256:sha(fs.readFileSync(__filename)),oracleSha256:oracle.sourceSha256};
function check(name,fn){fn();report.cases.push({id:name,status:'passed'});}
check('native-unknown-empty-preserved',()=>{const result=oracle.amend(base,context);assert.equal(result.test.expected,source);assert.equal(result.test.helperExpected,source);assert.equal(result.review.newExpected,source);assert.equal(result.review.nativeInterfaceContractSha256,sha(fs.readFileSync(path.join(__dirname,'../native_reflist_contract.json'))));report.checks+=4;});
for(const variant of [{identity:['template','Referências'],source:'{{Referências|campo_catalogo_sem_destino_7349=}}'},{source:'{{REFLIST|campo_catalogo_sem_destino_7349=}}'},{source:'{{Reflist|campo_catalogo_sem_destino_7349=Valor literal}}'},{source:'{{Reflist|campo_catalogo_sem_destino_7349=|refs=}}'},{source:'{{Reflist|outro_campo=}}'},{category:'native-quotation-guard',source:'"'+source+'"'},{scenario:'unknown-populated-field'}])check('no-unrelated-expectation-rewrite-'+report.cases.length,()=>{assert.equal(oracle.amend({...base,...variant},context),null);report.checks++;});
check('oracle-inputs-unchanged',()=>{assert.equal(oracle.inputsUnchanged(),true);report.checks++;});
process.stdout.write(JSON.stringify(report,null,2)+'\n');
