'use strict';
// This check documents the deliberately narrow safety change. It does not
// replace executions of the final distribution or origin-proof regressions.
const fs=require('node:fs'),assert=require('node:assert/strict'),parser=require('@babel/parser'),crypto=require('node:crypto');
const {normalized}=require('../../scripts/v220_compact.cjs'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const [oldFile,newFile]=process.argv.slice(2);assert(oldFile&&newFile,'Supply the retained earlier and final distributions');
const DROP=Symbol('remove-only-helper');
const old=fs.readFileSync(oldFile,'utf8'),fresh=fs.readFileSync(newFile,'utf8'),a=parser.parse(old),b=parser.parse(fresh),counts={helper:0,predicate:0,property:0};
function change(node,scope=[]){if(!node||typeof node!=='object')return node;
 if(node.type==='FunctionDeclaration'&&node.id?.name==='v2212StructureFileOriginProof'){counts.helper++;return DROP;}
 const chain=node.type==='FunctionDeclaration'?[...scope,node.id?.name]:scope;
 if(chain.includes('v2212StructureFileEdits')&&node.type==='LogicalExpression'&&node.operator==='&&'&&node.right.type==='CallExpression'&&node.right.callee.name==='v2212StructureFileOriginProof'){
  assert.deepEqual(node.right.arguments.map(n=>n.name),['r','p']);counts.predicate++;return change(node.left,chain);
 }
 if(chain.includes('v2212PrepareEvidence')&&node.type==='ObjectExpression'){
  node.properties=node.properties.filter(p=>{
   if(p.type!=='ObjectProperty'||p.key.name!=='canonicalTitle')return true;
   assert.equal(p.value.type,'MemberExpression');assert.equal(p.value.object.name,'page');assert.equal(p.value.property.name,'title');counts.property++;return false;
  });
 }
 for(const[k,v]of Object.entries(node)){
  if(['loc','start','end','comments','leadingComments','trailingComments','innerComments'].includes(k))continue;
  if(Array.isArray(v))node[k]=v.map(n=>change(n,chain)).filter(n=>n!==DROP);else if(v&&typeof v==='object')node[k]=change(v,chain);
 }
 return node;
}
const control=parser.parse('const [ , x]=parts; const a=[,1,,3];');assert.deepEqual(normalized(control.program),normalized(change(JSON.parse(JSON.stringify(control.program)))),'Array elisions are semantic and must stay intact');
change(b.program);assert.deepEqual(counts,{helper:1,predicate:1,property:1});assert.deepEqual(normalized(a.program),normalized(b.program));
console.log(JSON.stringify({status:'passed',method:'Remove only the new origin helper, its one proof predicate and the canonical title transport property; the complete remaining executable AST is identical',previousSha256:sha(old),currentSha256:sha(fresh),changes:counts,unchangedWhenNoExternalFileProofs:true,wikipediaWrites:0}));
