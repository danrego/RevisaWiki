'use strict';
// Move only JSON literals. Preserve every surrounding expression and freeze.
const fs=require('node:fs'),parser=require('@babel/parser'),assert=require('node:assert/strict');
function literal(n){
 if(!n)throw Error('not literal');
 if(n.type==='NumericLiteral'&&!Number.isFinite(n.value))throw Error('not finite JSON number');
 if(['StringLiteral','NumericLiteral','BooleanLiteral'].includes(n.type))return n.value;
 if(n.type==='NullLiteral')return null;
 if(n.type==='ArrayExpression')return n.elements.map(literal);
 if(n.type==='ObjectExpression'){
  const result={};for(const p of n.properties){
   if(p.type!=='ObjectProperty'||p.computed)throw Error('not literal');
   const key=p.key.name??p.key.value;if(key==='__proto__')throw Error('prototype');result[key]=literal(p.value);
  }return result;
 }throw Error('not literal');
}
const [input,output,valuesFile,stringPrefix='literal']=process.argv.slice(2),source=fs.readFileSync(input,'utf8'),ast=parser.parse(source),nodes=[],conditions=[],names=new Map();
const snapshot='V221_LITERAL_VALUES_221';let unsafeConditionScope=false;
assert(/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(stringPrefix),'A literal namespace must be an identifier');
function walk(n,functions=[]){
 if(!n||typeof n!=='object')return;
 if(n.type==='Identifier'&&n.name===snapshot||n.type==='WithStatement'||n.type==='CallExpression'&&!n.optional&&n.callee?.type==='Identifier'&&n.callee.name==='eval')unsafeConditionScope=true;
 if(/Function/.test(n.type||''))functions=[...functions,n.id?.name||'anonymous'];
 if(n.type==='VariableDeclarator'&&n.id.type==='Identifier'){
  names.set(n.id.name,(names.get(n.id.name)||0)+1);let value=n.init;
  if(value?.type==='CallExpression'&&value.arguments.length===1)value=value.arguments[0];
  const reference='root.RevisaWikiDataV2.packed.support221.literals.'+n.id.name;
  if(value&&value.end-value.start>=80&&Buffer.byteLength(source.slice(value.start,value.end))-Buffer.byteLength(reference)>=32&&functions.every(name=>['RevisaWikiModuleStart','start','RevisaWikiBoot'].includes(name))&&
      !(ast.comments||[]).some(comment=>comment.start>=value.start&&comment.end<=value.end))
      try{nodes.push({name:n.id.name,node:value,value:literal(value)});}catch(_){}
 }
 if(functions.length&&n.type==='ObjectProperty'&&!n.computed&&(n.key.name??n.key.value)==='condition'&&
     n.value?.type==='StringLiteral'&&n.value.end-n.value.start>=128&&
     !/[{}<>`\r\n\u2028\u2029]/.test(n.value.value)&&n.value.value.includes(' '))
     conditions.push({node:n.value,value:n.value.value});
 for(const[k,v]of Object.entries(n)){if(['loc','extra','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(child=>walk(child,functions));else walk(v,functions);}
}
walk(ast);const selected=nodes.filter(n=>names.get(n.name)===1),values={},edits=[];
for(const row of selected){values[row.name]=row.value;edits.push({start:row.node.start,end:row.node.end,text:'root.RevisaWikiDataV2.packed.support221.literals.'+row.name});}
let conditionIndex=0;
for(const row of conditions){
 if(unsafeConditionScope)continue;
 if(selected.some(outer=>outer.node.start<=row.node.start&&row.node.end<=outer.node.end))continue;
 let name;do{name=stringPrefix+'_condition'+conditionIndex++;}while(names.has(name)||Object.hasOwn(values,name));
 const text=snapshot+'.'+name;
 if(Buffer.byteLength(source.slice(row.node.start,row.node.end))-Buffer.byteLength(text)<32)continue;
 values[name]=row.value;edits.push({start:row.node.start,end:row.node.end,text});
}
let result=source;for(const e of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,e.start)+e.text+result.slice(e.end);
assert.equal(edits.length,Object.keys(values).length);
fs.writeFileSync(output,result);fs.writeFileSync(valuesFile,JSON.stringify(values));
