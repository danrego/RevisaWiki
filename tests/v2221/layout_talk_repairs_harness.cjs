'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function load({proseColumns=false,portalReader=false}={}){
 const fragment=fs.readFileSync(path.join(root,'src/v2_22_1/layout_talk_repairs.js'),'utf8'),names=[...fragment.matchAll(/^function (v2221Layout\w+)\(/gm)].map(m=>m[1]);
 if(process.env.REVISAWIKI_CURRENT_CORE){
  const selected=path.resolve(process.env.REVISAWIKI_CURRENT_CORE),api=require(selected);
  if(api.version!=='2.22.1')throw Error('The selected layout runtime must be version 2.22.1');
  const missing=names.filter(name=>typeof api[name]!=='function');if(missing.length)throw Error('The selected layout runtime is missing exports: '+missing.join(', '));
  return api;
 }
 let source=fs.readFileSync(path.join(root,'dist/2.21.7/RevisaWiki_v2_21_7_completo.js'),'utf8');
 if(proseColumns){
  const found=[],parser=require('@babel/parser');
  function visit(node){if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration'&&node.id?.name==='preservationFormattingText')found.push(node);for(const[key,value]of Object.entries(node)){if(['loc','start','end','extra'].includes(key))continue;if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}
  visit(parser.parse(source));if(found.length!==1)throw Error('One original prose-formatting reader required');
  const node=found[0],raw=source.slice(node.start,node.end),patched=require('../../scripts/v2221_layout_patch.cjs').patch(raw);
  if(patched.proof.changes.length!==1)throw Error('The production column reader patch must be used');
  source=source.slice(0,node.start)+patched.code+source.slice(node.end);
 }
 if(portalReader){
  const found=[],parser=require('@babel/parser'),wanted=new Set(['v211AppendConfirmedPortals','addBiographyPortal','v2212PortalRelocate']);
  function visit(node){if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration'&&wanted.has(node.id?.name))found.push(node);for(const[key,value]of Object.entries(node)){if(['loc','start','end','extra'].includes(key))continue;if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}
  visit(parser.parse(source));if(found.length!==3)throw Error('All three original portal writers required');
  for(const node of found.sort((a,b)=>b.start-a.start)){const raw=source.slice(node.start,node.end),patched=require('../../scripts/v2221_layout_patch.cjs').patch(raw);if(patched.proof.changes.length!==1)throw Error('The production portal reader patch must be used');source=source.slice(0,node.start)+patched.code+source.slice(node.end);}
 }
 if(source.split('const api={').length!==2)throw Error('Frozen lexical harness anchor changed');
 source=source.replace('const api={',()=>fragment+'\nconst api={');
 source=source.replace("if(typeof module==='object'&&module.exports){",()=> 'Object.assign(api,{'+names.join(',')+'});'+"if(typeof module==='object'&&module.exports){");
 const context={module:{exports:{}},console,TextEncoder,TextDecoder,URL,URLSearchParams,setTimeout,clearTimeout,performance};
 vm.runInNewContext(source,context,{filename:'layout-talk-repairs-lexical-fixture.cjs'});
 return context.module.exports;
}
module.exports={load,root};
