'use strict';
// Build-only decoding of six pinned inert constants. No program evaluation.
const fs=require('node:fs'),parser=require('@babel/parser'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const specs=new Map([
 ['V2151_LEAD_TRANSFER_CONTRACTS',{key:'leadTransferContracts',wrapper:'plain',count:33,sha256:'7e1c4408468721c2dbcd26c80001a631e1b4229f3b0ceedab1bbe1eefa147a0f'}],
 ['V214_DRUG_FIELDS',{key:'drugFieldContracts',wrapper:'plain',count:2,sha256:'eea868509722b80d82c1725197026244d7a9b0200c2cdd25c0c5a78ebb193438'}],
 ['V28_DATE_FIELDS',{key:'biographyDateFields',wrapper:'Object.freeze',count:30,sha256:'bf865b53a12fe55267e9ddbd9c53b8949e19382b7a8eecd599792028c48e9bd0'}],
 ['OBSOLETE_CATALOG',{key:'obsoleteCatalog',wrapper:'ownDictionary',count:33,sha256:'0603c48d721a3dc9bdca0aaf8d0313fad1e409282b68e9c99b6ad7a4a445151a'}],
 ['NATIONALITY_PORTALS',{key:'nationalityPortals',wrapper:'ownDictionary',count:90,sha256:'216414a017941448efe6dfaa71c4b7c6ce9971bb83002e2c3e9413549d70db7b'}],
 ['COUNTRY_PORTALS',{key:'countryPortals',wrapper:'ownDictionary',count:46,sha256:'da768c1f37996e715d67899e2622e719b0edd27bc0a39d3e600e029d346a17d8'}]
]);
function decodeLiteral(node){
 if(node?.type==='NullLiteral')return null;
 if(node?.type==='StringLiteral'||node?.type==='BooleanLiteral')return node.value;
 if(node?.type==='NumericLiteral'&&Number.isSafeInteger(node.value))return node.value;
 if(node?.type==='ArrayExpression')return node.elements.map(value=>decodeLiteral(value));
 if(node?.type!=='ObjectExpression')throw Error('Only inert JSON object/array/string/boolean/safe-integer values allowed');
 const value={};for(const field of node.properties){
  if(field.type!=='ObjectProperty'||field.computed||field.shorthand||field.key.type!=='StringLiteral')throw Error('Plain quoted JSON property required');
  const key=field.key.value;if(key==='__proto__'||Object.hasOwn(value,key))throw Error('Prototype or duplicate key refused');
  Object.defineProperty(value,key,{value:decodeLiteral(field.value),enumerable:true,writable:true,configurable:true});
 }return value;
}
function extract(source){
 const ast=parser.parse(source,{sourceType:'unambiguous'}),found=[];
 function visit(node){if(!node||typeof node!=='object')return;
  if(node.type==='VariableDeclaration'&&node.kind==='const')for(const declaration of node.declarations){
   if(declaration.id.type!=='Identifier'||!specs.has(declaration.id.name))continue;
   const spec=specs.get(declaration.id.name),start=source.lastIndexOf('\n',node.start-1)+1;let literal=declaration.init;
   if(node.declarations.length!==1||source.slice(start,node.start)!=='    ')throw Error('Exact inert declaration scope differs');
   if(spec.wrapper==='Object.freeze'){
    if(literal?.type!=='CallExpression'||literal.arguments.length!==1||literal.callee?.type!=='MemberExpression'||literal.callee.computed||literal.callee.object?.type!=='Identifier'||literal.callee.object.name!=='Object'||literal.callee.property?.name!=='freeze')throw Error('Original shallow freeze differs');
    literal=literal.arguments[0];
   }else if(spec.wrapper==='ownDictionary'){
    if(literal?.type!=='CallExpression'||literal.arguments.length!==1||literal.callee?.type!=='Identifier'||literal.callee.name!=='ownDictionary')throw Error('Original own-dictionary constructor differs');
    literal=literal.arguments[0];
   }
   if(literal?.type!=='ObjectExpression')throw Error('Original table is not a literal object');
   const raw=source.slice(literal.start,literal.end),value=decodeLiteral(literal);
   if(sha(raw)!==spec.sha256||Object.keys(value).length!==spec.count)throw Error('Pinned inert Source literal differs: '+declaration.id.name);
   if(declaration.id.name==='COUNTRY_PORTALS'&&Object.values(value).some(item=>typeof item!=='string'))throw Error('Country dictionary values must remain literal strings');
   if(declaration.id.name==='NATIONALITY_PORTALS'&&Object.values(value).some(item=>typeof item!=='string'))throw Error('Nationality dictionary values must remain literal strings');
   found.push({variable:declaration.id.name,key:spec.key,wrapper:spec.wrapper,value,statement:source.slice(start,node.end),literalSha256:sha(raw),literalBytes:Buffer.byteLength(raw),keyOrder:Object.keys(value)});
  }
  for(const[key,value]of Object.entries(node))if(!['loc','comments','leadingComments','trailingComments','innerComments'].includes(key)){
   if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
  }
 }visit(ast.program);if(found.length!==6||new Set(found.map(row=>row.variable)).size!==6)throw Error('Exactly the six pinned inert bindings required');
 return[...specs.keys()].map(name=>found.find(row=>row.variable===name));
}
module.exports={extract,decodeLiteral};
if(require.main===module){const source=fs.readFileSync(0,'utf8');process.stdout.write(JSON.stringify({kind:'build-only-six-pinned-inert-tables',sourceSha256:sha(source),tables:extract(source)}));}
