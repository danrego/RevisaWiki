'use strict';
// Replace named functions and one reviewed native contract. Never rewrite tokens
// outside those exact AST ranges. The subsequent formatter proves token identity.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}}
function patch(source,helpers,styles){
 const ast=parser.parse(source),nodes={},variables={},declarations=[],edits=[],proof=[];
 walk(ast,n=>{if(n.type==='FunctionDeclaration'&&n.id)(nodes[n.id.name]??=[]).push(n);});
 walk(ast,n=>{if(n.type==='VariableDeclarator'&&n.id?.type==='Identifier')(variables[n.id.name]??=[]).push(n);});
 const helperTree=parser.parse(helpers);assert(helperTree.program.body.every(n=>['FunctionDeclaration','VariableDeclaration'].includes(n.type)),'Only explicit declarations are allowed');
 const styleFunctions=nodes.installPanelStyle||[];assert.equal(styleFunctions.length,1);const styleNodes=[];
 walk(styleFunctions[0],n=>{if(n.type==='StringLiteral'&&Buffer.byteLength(source.slice(n.start,n.end))>2000)styleNodes.push(n);});
 assert.deepEqual(styleNodes.map(n=>n.value),styles,'Frozen native panel CSS values changed');
 styleNodes.forEach((n,i)=>{edits.push({start:n.start,end:n.end,text:'root.RevisaWikiDataV2.packed.support2213.styles['+i+']'});proof.push({kind:'unchanged-style-string',index:i,valueSha256:sha(n.value)});});
 for(const n of helperTree.program.body){
  if(n.type!=='FunctionDeclaration'){
   assert.equal(n.kind,'const');assert.equal(n.declarations.length,1);const d=n.declarations[0],found=variables[d.id.name]||[];assert(found.length<=1);
   if(!found.length){declarations.push(helpers.slice(n.start,n.end));continue;}
   assert.equal(found[0].init.type,'ArrowFunctionExpression');assert.equal(d.init.type,'ArrowFunctionExpression');
   const old=found[0].init,raw=helpers.slice(d.init.start,d.init.end);edits.push({start:old.start,end:old.end,text:raw});proof.push({kind:'arrow-binding',name:d.id.name,beforeSha256:sha(source.slice(old.start,old.end)),afterSha256:sha(raw)});continue;
  }
  const name=n.id.name,raw=helpers.slice(n.start,n.end),found=nodes[name]||[];assert(found.length<=1,'Ambiguous function '+name);
  if(found.length){const old=found[0];edits.push({start:old.start,end:old.end,text:raw});proof.push({kind:'function',name,beforeSha256:sha(source.slice(old.start,old.end)),afterSha256:sha(raw)});}
  else{declarations.push(raw);proof.push({kind:'new-helper',name,sha256:sha(raw)});}
 }
 const contracts=[];walk(ast,n=>{if(n.type==='VariableDeclarator'&&n.id?.name==='V221_INFOBOX_CONTRACTS')contracts.push(n);});assert.equal(contracts.length,1);
 assert.equal(source.slice(contracts[0].init.start,contracts[0].init.end),'Object.freeze(root.RevisaWikiDataV2.packed.support221.biography.V221_INFOBOX_CONTRACTS)');
 proof.push({kind:'native-contract-data-binding-preserved',dataPath:'packed.support221.biography.V221_INFOBOX_CONTRACTS'});
 const emptySets=[];walk(ast,n=>{if(n.type==='VariableDeclarator'&&n.id?.name==='V216_LITERAL_EMPTY_DATE_PLACE')emptySets.push(n);});assert.equal(emptySets.length,1);
 const set=emptySets[0].init;assert.equal(set.type,'NewExpression');assert.equal(set.callee.name,'Set');assert.equal(set.arguments[0].type,'ArrayExpression');assert(set.arguments[0].elements.some(n=>n.value===72993800));
 edits.push({start:set.arguments[0].end-1,end:set.arguments[0].end-1,text:',73315036'});
 proof.push({kind:'existing-literal-date-place-contract',oldid:73315036,priorOldid:72993800});
 const api=[];walk(ast,n=>{if(n.type==='VariableDeclarator'&&n.id?.name==='api')api.push(n);});assert.equal(api.length,1);assert.equal(api[0].init.type,'ObjectExpression');
 const already=new Set(api[0].init.properties.map(p=>p.key?.name??p.key?.value));const added=helperTree.program.body.filter(n=>n.type==='FunctionDeclaration'&&!already.has(n.id.name)).map(n=>n.id.name);
 if(added.length)edits.push({start:api[0].init.start+1,end:api[0].init.start+1,text:added.join(',')+','});
 const declarationAt=source.lastIndexOf('const api',api[0].start);assert(declarationAt>=0);
 if(declarations.length)edits.push({start:declarationAt,end:declarationAt,text:declarations.join('\n')+'\n'});
 edits.sort((a,b)=>b.start-a.start||b.end-a.end);let previous=source.length,code=source;for(const e of edits){assert(e.end<=previous,'Overlapping patches');code=code.slice(0,e.start)+e.text+code.slice(e.end);previous=e.start;}
 parser.parse(code);return {code,proof:{method:'Exact AST-range function replacements, explicit new helpers and one native contract binding',sourceSha256:sha(source),helperSha256:sha(helpers),changes:proof,exportsAdded:added}};
}
if(require.main===module){const [input,helper,output,receipt,styles]=process.argv.slice(2),r=patch(fs.readFileSync(input,'utf8'),fs.readFileSync(helper,'utf8'),JSON.parse(fs.readFileSync(styles)));fs.writeFileSync(output,r.code);fs.writeFileSync(receipt,JSON.stringify(r.proof,null,2)+'\n');}
module.exports={patch};
