// Build-only AST decoder. No product program is imported or evaluated.
'use strict';
const fs=require('node:fs'),parser=require('@babel/parser'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const source=fs.readFileSync(0,'utf8'),ast=parser.parse(source,{sourceType:'unambiguous'}),found=[];
const specs=new Map([['GROUP_LABELS',{key:'groupLabels',wrapper:'plain'}],['PORTAL_IDENTITY_ALIASES',{key:'portalIdentityAliases',wrapper:'ownDictionary'}]]);
function visit(node){
 if(!node||typeof node!=='object')return;
 if(node.type==='VariableDeclaration'&&node.kind==='const')for(const binding of node.declarations){
  if(binding.id.type!=='Identifier'||!specs.has(binding.id.name))continue;
  const variable=binding.id.name,spec=specs.get(variable);let literal=binding.init;
  if(spec.wrapper==='ownDictionary'){
   if(literal.type!=='CallExpression'||literal.callee.type!=='Identifier'||literal.callee.name!=='ownDictionary'||literal.arguments.length!==1)throw Error('Original own-dictionary wrapper differs');
   literal=literal.arguments[0];
  }
  if(literal.type!=='ObjectExpression')throw Error('Table is no longer a literal object');
  const value={};for(const property of literal.properties){
   if(property.type!=='ObjectProperty'||property.computed||property.shorthand||property.value.type!=='StringLiteral'||!['Identifier','StringLiteral'].includes(property.key.type))throw Error('Table is no longer a flat string map');
   const key=property.key.type==='Identifier'?property.key.name:property.key.value;
   if(key==='__proto__'||Object.hasOwn(value,key))throw Error('Prototype or duplicate key in table');
   Object.defineProperty(value,key,{value:property.value.value,enumerable:true,writable:true,configurable:true});
  }
  const start=source.lastIndexOf('\n',node.start-1)+1;if(source.slice(start,node.start)!=='    '||node.declarations.length!==1)throw Error('Table declaration scope differs');
  found.push({variable,key:spec.key,wrapper:spec.wrapper,value,statement:source.slice(start,node.end),literalSha256:sha(source.slice(literal.start,literal.end)),literalBytes:Buffer.byteLength(source.slice(literal.start,literal.end)),entries:Object.entries(value),entryCount:Object.keys(value).length,keyOrder:Object.keys(value),start,end:node.end});
 }
 for(const[key,value]of Object.entries(node))if(!['loc','start','end','extra','comments','leadingComments','trailingComments','innerComments'].includes(key)){
  if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
 }
}
visit(ast);if(found.length!==2||new Set(found.map(x=>x.variable)).size!==2)throw Error('Flat-table binding is not unique');
const tables=[...specs.keys()].map(name=>found.find(row=>row.variable===name));
process.stdout.write(JSON.stringify({kind:'SOURCE-only-flat-table-AST-decoding',sourceSha256:sha(source),tables}));
