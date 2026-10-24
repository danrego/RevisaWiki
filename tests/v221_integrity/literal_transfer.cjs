'use strict';
// The catalog contains JSON values, never functions, regular expressions or code.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-literal-transfer-'));
const value={alpha:'fictional value '.repeat(12),accent:'ação Café científico',list:[1,true,null,'same  text'],nested:{beta:'other literal'}};
const json=JSON.stringify(value),long=JSON.stringify('fictional value '.repeat(15)),condition=JSON.stringify('The supplied value remains attached to its exact native argument and source. '.repeat(4));
const cases=[
 {body:'const Example=Object.freeze('+json+');return [Example,Object.isFrozen(Example)];',take:['Example']},
 {body:'const Example='+json+';return Example;',take:['Example']},
 {body:'const Example=['+long+',1,true,null];return Example;',take:['Example']},
 {body:'const Example=Object.freeze('+json+');return Example.alpha;',take:['Example']},
 {body:'const Example={alpha:'+long+',/* preserve this exact comment */ beta:1};return Example.alpha;',deny:['Example']},
 {body:'const Example={alpha:'+long+',method:()=>17};return Example.alpha;',deny:['Example']},
 {body:'const Example={alpha:'+long+',regexp:/[a-z]+/};return Example.alpha;',deny:['Example']},
 {body:'const Example={alpha:'+long+',...{beta:1}};return Example.alpha;',deny:['Example']},
 {body:'const Example={alpha:'+long+',__proto__:{beta:1}};return Example.alpha;',deny:['Example']},
 {body:'const Example=['+long+',,1];return Example[0];',deny:['Example']},
 {body:'function inner(){const Example='+json+';return Example}return inner();',deny:['Example']},
 {body:'const Example='+json+';function inner(){const Example='+json+';return Example}return [Example,inner()];',deny:['Example']},
 {body:'const Example="small";return Example;',deny:['Example']},
 {body:'const Example={alpha:'+long+',number:1e309};return String(Example.number);',deny:['Example']},
 {body:'const Example={alpha:'+long+',number:-1e309};return String(Example.number);',deny:['Example']},
 {body:'const Example={alpha:'+long+',number:-0};return Object.is(Example.number,-0);',deny:['Example']},
 {body:'const Example={alpha:'+long+',number:1e308};return String(Example.number);',take:['Example']},
 {body:'function create(){return {condition:'+condition+',payload:{n:1}}}const a=create(),b=create();a.payload.n=2;return [a!==b,b.payload.n,a.condition===b.condition];',take:['literal_condition0']},
 {body:'function create(){return {"condition":'+condition+'}}return create().condition;',take:['literal_condition0']},
 {body:'function create(){return {["condition"]:'+condition+'}}return create().condition;',deny:['literal_condition0']},
 {body:'function create(){return {condition:'+JSON.stringify('A source with {code} remains literal. '.repeat(8))+'}}return create().condition;',deny:['literal_condition0']},
 {body:'function create(){return {condition:'+JSON.stringify('word'.repeat(80))+'}}return create().condition;',deny:['literal_condition0']},
 {body:'const Example={condition:'+condition+'};return Example.condition;',take:['Example'],deny:['literal_condition0']},
 {body:'function inspect(root){return {condition:'+condition+'}}return inspect({}).condition;',take:['literal_condition0']},
 {body:'function inspect(){const root=[];return {condition:'+condition+'}}return inspect().condition;',take:['literal_condition0']},
 {body:'function inspect(V221_LITERAL_VALUES_221){return {condition:'+condition+'}}return inspect({}).condition;',deny:['literal_condition0']},
 {body:'function inspect(){const V221_LITERAL_VALUES_221={};return {condition:'+condition+'}}return inspect().condition;',deny:['literal_condition0']},
 {body:'function inspect(){try{throw 1}catch(V221_LITERAL_VALUES_221){return {condition:'+condition+'}}}return inspect().condition;',deny:['literal_condition0']},
 {body:'function inspect(){with({}){return {condition:'+condition+'}}}return inspect().condition;',deny:['literal_condition0']},
 {body:'function inspect(){eval("var x=1");return {condition:'+condition+'}}return inspect().condition;',deny:['literal_condition0']},
 {body:'function create(){root.RevisaWikiDataV2={packed:{support221:{literals:{}}}};return {condition:'+condition+'}}return create().condition;',take:['literal_condition0']}
];
let checks=0;
try{
 for(const [i,c]of cases.entries()){
  const source='(function RevisaWikiBoot(root){'+c.body+'})(root)',input=path.join(temp,i+'.js'),output=path.join(temp,i+'-out.js'),values=path.join(temp,i+'.json');fs.writeFileSync(input,source);
  const r=cp.spawnSync(process.execPath,[path.join(root,'scripts/v221_extract_data.cjs'),input,output,values],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);checks++;
  const literals=JSON.parse(fs.readFileSync(values,'utf8')),transformed=fs.readFileSync(output,'utf8');
  for(const name of c.take||[]){assert.equal(Object.hasOwn(literals,name),true);checks++;}
  for(const name of c.deny||[]){assert.equal(Object.hasOwn(literals,name),false);checks++;}
  const before=vm.runInNewContext(source,{root:{}},{timeout:1000}),after=vm.runInNewContext(transformed,{root:{RevisaWikiDataV2:{packed:{support221:{literals}}}},V221_LITERAL_VALUES_221:Object.freeze({...literals})},{timeout:1000});
  assert.equal(JSON.stringify(after),JSON.stringify(before));checks++;
  if(c.deny&&!c.take){assert.equal(transformed,source);checks++;}
  assert.equal(fs.readFileSync(input,'utf8'),source);checks++;
 }
 console.log(JSON.stringify({status:'passed',cases:cases.length,checks,networkRequests:0,wikipediaWrites:0}));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
