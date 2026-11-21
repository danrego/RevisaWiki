'use strict';
// Runs the new planners in the exact expanded baseline lexical environment.
// A final release must additionally pass these cases through api.calculate.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
function load(){
 if(process.env.REVISAWIKI_CURRENT_CORE){const file=path.resolve(process.env.REVISAWIKI_CURRENT_CORE),api=require(file);assert.equal(api.version,'2.22.1','The exact current candidate is required; no historical fallback');for(const name of ['calculate','v2221FocusedInfoboxPlan','v2221FocusedInfoboxProof','v2221FocusedPortalsPlan','v2221FocusedPortalsProof','v2221FocusedPersonOwner','v2221InfoboxRead','v219LatePortalPass','v2215PreferredCall'])assert.equal(typeof api[name],'function','Missing current API: '+name);return {api,receipt:{mode:'actual-current-complete-API',runtimeSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex'),changes:[]}};}
 const baseline=process.env.REVISAWIKI_EXPANDED_BASELINE||path.join(root,'artifacts/v2220/build/v2220_runtime.cjs.js');
 assert(fs.existsSync(baseline),'Provide the frozen expanded baseline using REVISAWIKI_EXPANDED_BASELINE');
 let code=fs.readFileSync(baseline,'utf8');
 let helpers=fs.readdirSync(path.join(root,'src/v2_22')).filter(name=>name.endsWith('.js')).sort().map(name=>fs.readFileSync(path.join(root,'src/v2_22',name),'utf8')).join('\n');
 helpers+='\n'+['foreign_infobox_registry','focused_infoboxes'].map(name=>fs.readFileSync(path.join(root,'src/v2_22_1',name+'.js'),'utf8')).join('\n');
 const patched=require('../../scripts/v2221_infobox_patch.cjs').patch(code,helpers);code=patched.code;helpers=patched.helpers;
 const prerequisitePatch=require('../../scripts/v2221_reference_prerequisite_patch.cjs').patch(code);code=prerequisitePatch.code;
 const data={inference:JSON.parse(fs.readFileSync(path.join(root,'src/v2_22/inference_data.json'),'utf8')),syntax:JSON.parse(fs.readFileSync(path.join(root,'src/v2_22/syntax_data.json'),'utf8')),focusedInfoboxes:JSON.parse(fs.readFileSync(path.join(root,'src/v2_22_1/focused_infobox_data.json'),'utf8'))};
 const names=[...helpers.matchAll(/^function (v222\w+)\(/gm)].map(match=>match[1]);names.push('v219LatePortalPass','v2215PreferredCall');
 assert.equal(code.split('const api={').length,2,'single lexical API declaration');
 code=code.replace('const api={',()=> 'const V222_CATALOG='+JSON.stringify(data)+';\n'+helpers+'\nconst api={'+names.join(',')+',');
 const packed=JSON.parse(JSON.stringify(require('../../dist/2.22.0/RevisaWiki_v2_22_0_dados.js'))),version=/const VERSION='([^']+)'/.exec(code)[1];packed.version=version;
 const context={module:{exports:{}},console,TextEncoder,TextDecoder,URL,URLSearchParams,setTimeout,clearTimeout,performance,require(name){if(/RevisaWiki_.*_dados\.js$/.test(name))return packed;if(name==='node:crypto')return require(name);throw Error('Unexpected test dependency: '+name);}};
 vm.runInNewContext(code,context,{filename:'focused-infobox-test-baseline.cjs'});
 return {api:context.module.exports,receipt:{...patched.receipt,referencePrerequisitePatch:prerequisitePatch.receipt,mode:'source-unit-lexical-baseline-not-complete-current-API'}};
}
module.exports={load};
