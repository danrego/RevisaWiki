'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function load(files,options={}){
 const api=require(path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(root,'dist/2.22.0/RevisaWiki_v2_22_0.js')));
 const sources=files.map(name=>fs.readFileSync(path.join(root,'src/v2_22_1',name+'.js'),'utf8'));
 const names=sources.flatMap(s=>[...s.matchAll(/^(?:async )?function (v2221\w+)\(/gm)].map(m=>m[1]));
 if(process.env.REVISAWIKI_CURRENT_CORE){const missing=names.filter(n=>typeof api[n]!=='function');if(missing.length)throw new Error('Selected runtime does not export requested current helpers: '+missing.join(', '));return api;}
 const base=path.resolve(root,'../../../2.21.0/repository/artifacts/v2220/build/v2220_runtime.cjs.js');
 let helpers=fs.readdirSync(path.join(root,'src/v2_22')).filter(n=>n.endsWith('.js')).sort().map(n=>fs.readFileSync(path.join(root,'src/v2_22',n),'utf8')).join('\n');
 let code=fs.readFileSync(base,'utf8');
 if(options.contextPatch){const patched=require('../../scripts/v2221_context_patch.cjs').patch(code,helpers);code=patched.code;helpers=patched.helpers;}
 code=code.replace('const api={',()=>"const V222_CATALOG="+JSON.stringify(api.v222Catalog())+';\n'+helpers+'\n'+sources.join('\n')+'\nconst api={'+names.join(',')+',');
 const localRequire=require('node:module').createRequire(path.join(root,'dist/2.22.0/RevisaWiki_v2_22_0.js'));
 const requireFresh=name=>{if(name==='./RevisaWiki_v2_22_0_dados.js'){const dataScope={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(path.join(root,'dist/2.22.0/RevisaWiki_v2_22_0_dados.js'),'utf8'),dataScope);return dataScope.module.exports;}return localRequire(name);};
 const scope={module:{exports:{}},require:requireFresh,console,TextEncoder,TextDecoder,URL,URLSearchParams,setTimeout,clearTimeout,performance};
 vm.runInNewContext(code,scope,{filename:'v2221-focused-modules.cjs'});return scope.module.exports;
}
const cfg={namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',sectionOnly:false,autoPreview:false,registryDoiCheck:false};
module.exports={load,root,cfg};
