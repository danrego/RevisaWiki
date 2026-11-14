'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),parser=require('@babel/parser');
const root=path.resolve(__dirname,'../..');
function load(){
 const built=process.env.REVISAWIKI_CURRENT_CORE||path.join(root,'dist/2.22.0/RevisaWiki_v2_22_0.js'),catalog=JSON.parse(fs.readFileSync(path.join(root,'src/v2_22/inference_data.json'),'utf8'));
 if(fs.existsSync(built)&&process.env.REVISAWIKI_V222_INFERENCE_LEXICAL!=='1'){const api=require(built);if(api.version!=='2.22.0'||typeof api.v222InferencePlan!=='function')throw Error('Build the current2.22.0 package before running inference tests');return {api,catalog,baselinePath:built,testContext:globalThis};}
 const baselinePath=path.join(root,'artifacts/v2217/build/patched.js'),baseline=fs.readFileSync(baselinePath,'utf8'),tree=parser.parse(baseline),nodes=[];
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionExpression'&&n.id?.name==='RevisaWikiBoot')nodes.push(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);
 if(nodes.length!==1)throw Error('Frozen baseline factory not found');
 const helpers=['inference.js','category_producer.js'].filter(name=>fs.existsSync(path.join(root,'src/v2_22',name))).map(name=>fs.readFileSync(path.join(root,'src/v2_22',name),'utf8')).join('\n'),names=[...helpers.matchAll(/^(?:async )?function (v222\w+)\(/gm)].map(m=>m[1]);
 let boot=baseline.slice(nodes[0].start,nodes[0].end);boot=boot.replace('const api={',()=>`const V222_CATALOG={inference:${JSON.stringify(catalog)}};\n${helpers}\nconst api={`);boot=boot.replace("if(typeof module==='object'&&module.exports){",()=>`Object.assign(api,{${names.join(',')}});if(typeof module==='object'&&module.exports){`);
 const data=require(path.join(root,'dist/2.21.7/RevisaWiki_v2_21_7_dados.js')),context={RevisaWikiDataV2:data,module:{exports:{}},console,TextEncoder,TextDecoder,URL,URLSearchParams,setTimeout,clearTimeout,performance};
 vm.runInNewContext('('+boot+')(globalThis);',context,{filename:'inference-v222-under-frozen-engine.cjs'});return {api:context.module.exports,catalog,baselinePath,testContext:context};
}
module.exports={load};
