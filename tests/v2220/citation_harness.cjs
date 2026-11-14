'use strict';
// Executes the assigned modules inside the frozen engine's lexical factory.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function load(){
 const sources=['citations','native_syntax','infoboxes'].map(n=>fs.readFileSync(path.join(root,'src/v2_22',n+'.js'),'utf8')),
  names=sources.flatMap(s=>[...s.matchAll(/^function (v222\w+)\(/gm)].map(m=>m[1])),
  data=JSON.parse(fs.readFileSync(path.join(root,'src/v2_22/syntax_data.json'),'utf8')),
  old=fs.readFileSync(path.join(root,'src/v2_21_7/infoboxes.js'),'utf8'),person=old.match(/const V2217_PERSON_FIELDS = Object\.freeze\(([^\n]+)\);/)[1];
 let code=fs.readFileSync(path.join(root,'dist/2.21.7/RevisaWiki_v2_21_7_completo.js'),'utf8');
 code=code.replace('const api={',()=>sources.join('\n')+'\nconst api={');
 const bridge='const V222_CATALOG={syntax:'+JSON.stringify(data)+'};const INFOBOX_CATALOG=api.infoboxCatalog;const V2217_PERSON_FIELDS='+person+';Object.assign(api,{'+names.join(',')+'});';
 code=code.replace("if(typeof module==='object'&&module.exports){",()=>bridge+"if(typeof module==='object'&&module.exports){");
 const context={module:{exports:{}},console,TextEncoder,TextDecoder,URL,URLSearchParams,setTimeout,clearTimeout,performance};
 vm.runInNewContext(code,context,{filename:'assigned-v222-modules.cjs'});return context.module.exports;
}
module.exports={load};
