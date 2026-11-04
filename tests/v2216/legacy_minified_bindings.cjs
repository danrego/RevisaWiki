'use strict';
// Test-only bridge for inherited harness export injection. Exact production
// bindings are exposed under their former test names; function bodies, guards,
// data and on-disk distributions are never replaced.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const selected=process.env.REVISAWIKI_CURRENT_CORE||process.env.REVISAWIKI_BUNDLE,target=selected&&fs.realpathSync(selected),originalCompile=Module.prototype._compile,records=[];
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}}
Module.prototype._compile=function(code,filename){
 let exact;try{exact=fs.realpathSync(filename);}catch{}
 if(exact===target&&code!==fs.readFileSync(exact,'utf8')){
  const tree=parser.parse(code),boots=[];walk(tree,n=>{if(['FunctionDeclaration','FunctionExpression'].includes(n.type)&&n.id?.name==='RevisaWikiBoot')boots.push(n);});assert.equal(boots.length,1,'One production engine scope is required');
  const body=boots[0].body.body,bindings=new Map();for(const n of body){if(n.type==='FunctionDeclaration')bindings.set(n.id.name,n);if(n.type==='VariableDeclaration')for(const d of n.declarations)if(d.id.type==='Identifier')bindings.set(d.id.name,d);}
  const api=bindings.get('api');assert.equal(api?.init?.type,'ObjectExpression','The inherited export boundary must remain concrete');
  const wanted=[...new Set(api.init.properties.filter(p=>p.type==='ObjectProperty'&&p.shorthand&&p.value.type==='Identifier'&&!bindings.has(p.value.name)).map(p=>p.value.name))],aliases=[];
  for(const name of wanted){let actual=null;
   if(name==='INFOBOX_CATALOG'||name==='TEMPLATE_CATALOG'){
    const property=name==='INFOBOX_CATALOG'?'infoboxCatalog':'templateCatalog',values=api.init.properties.filter(p=>p.type==='ObjectProperty'&&(p.key.name||p.key.value)===property&&p.value.type==='Identifier');assert.equal(values.length,1);actual=values[0].value.name;
   }else if(name.startsWith('V')){
    const property=name==='V219_NATIVE_IMAGE_OPTIONS'?'nativeTimedMediaOptions':name,found=[];
    for(const [key,node]of bindings)if(node.type==='VariableDeclarator'&&node.init){let hit=false;walk(node.init,n=>{if(n.type==='MemberExpression'&&!n.computed&&n.property?.name===property)hit=true;});if(hit)found.push(key);}
    assert.equal(found.length,1,'One exact packed-data binding is required for '+name);actual=found[0];
   }
   assert(actual&&bindings.has(actual),'An inherited export must resolve to its exact production binding: '+name);aliases.push({name,actual});
  }
  if(aliases.length){const before=code,edits=[];for(const x of aliases)for(const prop of api.init.properties)if(prop.type==='ObjectProperty'&&prop.shorthand&&prop.value.name===x.name)edits.push({start:prop.start,end:prop.end,text:x.name+':'+x.actual});
   for(const e of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,e.start)+e.text+code.slice(e.end);
   const patched=parser.parse(code),beforeFunctions=[],afterFunctions=[];
   walk(tree,n=>{if(n.type==='FunctionDeclaration'&&!(n.start<=api.start&&api.end<=n.end))beforeFunctions.push(sha(before.slice(n.start,n.end)));});
   const currentApis=[];walk(patched,n=>{if(n.type==='VariableDeclarator'&&n.id?.name==='api')currentApis.push(n);});assert.equal(currentApis.length,1);
   walk(patched,n=>{if(n.type==='FunctionDeclaration'&&!(n.start<=currentApis[0].start&&currentApis[0].end<=n.end))afterFunctions.push(sha(code.slice(n.start,n.end)));});
   assert.deepEqual(afterFunctions,beforeFunctions,'Every transformation and safety function remains byte-identical');records.push({runtimeFile:path.basename(exact),runtimeSha256:sha(fs.readFileSync(exact)),harnessProgramSha256:sha(before),bridgedProgramSha256:sha(code),aliases,transformationAndSafetyFunctionsUnchanged:true,onlyInjectedExportValuesResolved:true,productionDataReplaced:false});
  }
 }
 return originalCompile.call(this,code,filename);
};
process.on('exit',()=>{if(records.length&&process.env.REVISAWIKI_LEGACY_BINDING_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_LEGACY_BINDING_RECEIPT+'.'+process.pid+'.json',JSON.stringify({kind:'test-only-minified-binding-export-bridge',records,wikipediaWrites:0},null,2)+'\n',{flag:'wx'});});
