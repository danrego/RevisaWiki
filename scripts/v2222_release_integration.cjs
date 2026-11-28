'use strict';
const fs=require('node:fs'),parser=require('@babel/parser'),crypto=require('node:crypto');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function patch(source,helpers){
 let code=source,h=helpers;const receipts=[];
 for(const name of ['reference','infobox','layout','ui']){
  const file='./v2222_'+name+'_patch.cjs',module=require(file);
  for(const [method,kind]of [['applyRuntimePatches','runtime'],['applyHelperPatches','helpers']]){
   if(typeof module[method]!=='function')throw Error('Missing patch interface '+file+':'+method);
   const before=kind==='runtime'?code:h,result=module[method](before);
   const after=result.code??result.helpers;
   if(typeof after!=='string')throw Error('Missing transformed source '+file+':'+method);
   parser.parse(after);if(kind==='runtime')code=after;else h=after;
   receipts.push({patch:name,kind,beforeSha256:sha(before),afterSha256:sha(after),details:result.receipt??result.proof??null});
  }
 }
 return{code,helpers:h,receipt:{sourceSha256:sha(source),helperSha256:sha(helpers),receipts,wikipediaWrites:0}};
}
if(require.main===module){const[input,helperInput,out,helperOut,receipt]=process.argv.slice(2),r=patch(fs.readFileSync(input,'utf8'),fs.readFileSync(helperInput,'utf8'));fs.writeFileSync(out,r.code);fs.writeFileSync(helperOut,r.helpers);fs.writeFileSync(receipt,JSON.stringify(r.receipt,null,2)+'\n');}
module.exports={patch};
