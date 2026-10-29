'use strict';
// Move only finite JSON maps introduced in this release to the data module.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
const names=['V2212_PORTAL_BOXES','V2212_PORTAL_ALIASES','V2212_PORTAL_STUBS','V2212_PORTAL_DESTINATIONS','V2212_CITATION_CONTRACT'];
function literal(node){
 if(node.type==='NumericLiteral'){assert(Number.isSafeInteger(node.value),'Release maps require finite safe integers');return node.value;}
 if(['StringLiteral','BooleanLiteral'].includes(node.type))return node.value;
 if(node.type==='NullLiteral')return null;
 if(node.type==='ArrayExpression')return node.elements.map(literal);
 if(node.type==='ObjectExpression'){
  const out={};for(const p of node.properties){assert.equal(p.type,'ObjectProperty');assert.equal(p.computed,false);const k=p.key.name??p.key.value;assert.equal(typeof k,'string');assert.notEqual(k,'__proto__','Prototype setters are not JSON map properties');assert(!Object.hasOwn(out,k));out[k]=literal(p.value);}return out;
 }
 throw Error('Non-literal release map');
}
function extract(source){const tree=parser.parse(source),maps={},edits=[];
 function visit(node){if(!node||typeof node!=='object')return;
  if(node.type==='VariableDeclarator'&&names.includes(node.id?.name)){
   assert(!Object.hasOwn(maps,node.id.name));assert.equal(node.init.type,'CallExpression');assert.equal(source.slice(node.init.callee.start,node.init.callee.end),'Object.freeze');assert.equal(node.init.arguments.length,1);
   const arg=node.init.arguments[0];maps[node.id.name]=literal(arg);edits.push({start:arg.start,end:arg.end,text:'root.RevisaWikiDataV2.packed.support2212.literals.'+node.id.name});
  }
  for(const[k,v]of Object.entries(node)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}
 }visit(tree);assert.deepEqual(Object.keys(maps).sort(),names.slice().sort());let code=source;for(const e of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,e.start)+e.text+code.slice(e.end);
 return{code,data:{literals:maps},proof:{method:'Finite JSON-only maps, exact decoded values, no evaluation',names,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),removedExecutableLiteralBytes:Buffer.byteLength(source)-Buffer.byteLength(code)}};
}
if(require.main===module){const r=extract(fs.readFileSync(process.argv[2],'utf8'));fs.writeFileSync(process.argv[3],r.code);fs.writeFileSync(process.argv[4],JSON.stringify(r.data,null,2)+'\n');fs.writeFileSync(process.argv[5],JSON.stringify(r.proof,null,2)+'\n');}
module.exports={extract,literal};
