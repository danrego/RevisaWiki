'use strict';
// Editor ownership remains an identity comparison. Transport uses opaque IDs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const sources=['src/v2_19/ui_context_safety.js','src/v2_19_1/ui_context_serialization.js'];
const helper=vm.runInNewContext(sources.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n')+'\n({v219UIContext,v219UIContextSame,v219UIContextKey})');
const files=process.argv.slice(2),targets=[{name:'source-helper',api:helper},...files.map(file=>({name:path.basename(file),api:require(path.resolve(file)),sha256:sha(fs.readFileSync(file))}))];
const report={kind:'cyclic-editor-context-serialization',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),sources:sources.map(file=>({file,sha256:sha(fs.readFileSync(path.join(root,file)))})),targets:targets.map(({api,...row})=>row),cases:[],checks:0,networkRequests:0,wikipediaWrites:0};
for(const target of targets){
 const api=target.api,base={title:'Tema fictício',namespace:0,model:'wikitext',base:100,section:null};
 const test=(id,run)=>{const row={target:target.name,id,status:'passed'};report.cases.push(row);try{run();report.checks++;}catch(error){row.status='failed';row.message=error.message;report.status='failed';}};
 const cyclic={nodeType:1,nodeName:'TEXTAREA'},jquery={element:cyclic},widget={element:cyclic};
 cyclic.jQuery123={wikiEditorContext:{'$textarea':[cyclic],widget}};cyclic.jQuery124={events:{input:[{data:jquery}]}};
 const value={...base,editor:cyclic},key=()=>api.v219UIContextKey(value);
 test('released-raw-DOM-serialization-reproduces-error',()=>assert.throws(()=>JSON.stringify(api.v219UIContext(value)),error=>error instanceof TypeError&&/circular|cyclic/i.test(error.message)));
 test('cyclic-editor-context-serializes',()=>assert.doesNotThrow(key));
 test('same-editor-has-stable-token',()=>assert.equal(key(),api.v219UIContextKey({...value})));
 test('DOM-data-is-not-transferred',()=>{const text=key();assert(!/wikiEditor|jQuery|TEXTAREA|widget/.test(text));assert.equal(typeof JSON.parse(text).editor,'number');});
 test('object-ownership-remains-raw-identity',()=>{assert.equal(api.v219UIContext(value).editor,cyclic);assert.equal(api.v219UIContextSame(value,{...value}),true);assert.equal(api.v219UIContextSame(value,{...value,editor:{}}),false);});
 test('replacement-textarea-invalidates-context',()=>assert.notEqual(key(),api.v219UIContextKey({...value,editor:{nodeType:1,nodeName:'TEXTAREA'}})));
 test('cyclic-visual-editor-model-serializes',()=>{const model={};model.document={surface:model};model.surface={model};assert.doesNotThrow(()=>api.v219UIContextKey({...base,editor:model}));assert.notEqual(key(),api.v219UIContextKey({...base,editor:model}));});
 test('serialization-never-reads-editor-getters-or-toJSON',()=>{let reads=0;const editor={};Object.defineProperty(editor,'toJSON',{enumerable:true,get(){reads++;throw Error('Do not inspect editor');}});Object.defineProperty(editor,'privateData',{enumerable:true,get(){reads++;throw Error('Do not inspect editor');}});assert.doesNotThrow(()=>api.v219UIContextKey({...base,editor}));assert.equal(reads,0);});
 test('serialization-never-traverses-editor-proxy',()=>{const editor=new Proxy({},{get(){throw Error('No editor traversal');},ownKeys(){throw Error('No editor enumeration');},getOwnPropertyDescriptor(){throw Error('No editor descriptors');}});assert.doesNotThrow(()=>api.v219UIContextKey({...base,editor}));});
 test('serialization-does-not-mutate-frozen-editor',()=>{const editor=Object.freeze({}),before=Reflect.ownKeys(editor);assert.doesNotThrow(()=>api.v219UIContextKey({...base,editor}));assert.deepEqual(Reflect.ownKeys(editor),before);});
 test('function-editor-identity-supported',()=>{const editor=function(){};editor.self=editor;assert.equal(api.v219UIContextKey({...base,editor}),api.v219UIContextKey({...base,editor}));assert.notEqual(api.v219UIContextKey({...base,editor}),api.v219UIContextKey({...base,editor:function(){}}));});
 const scalarIds=['editor',1,'1',true,false,0,'',1n,Symbol('editor'),Symbol('editor')];
 test('primitive-identity-types-do-not-collide',()=>{const keys=scalarIds.map(editor=>api.v219UIContextKey({...base,editor}));assert.equal(new Set(keys).size,scalarIds.length);scalarIds.forEach((editor,index)=>assert.equal(api.v219UIContextKey({...base,editor}),keys[index]));});
 for(const[field,next]of [['title','Outro tema'],['namespace',1],['model','javascript'],['base',101],['section','0'],['section','']])test('changed-'+field+'-'+String(next),()=>assert.notEqual(key(),api.v219UIContextKey({...value,[field]:next})));
 test('invalid-context-stays-null',()=>{assert.equal(api.v219UIContextKey(null),'null');assert.equal(api.v219UIContextKey({...value,editor:null}),'null');assert.equal(api.v219UIContextKey({...value,title:''}),'null');});
 test('unrelated-DOM-metadata-change-keeps-token',()=>{const prior=key();cyclic.newData={back:cyclic};assert.equal(key(),prior);});
 test('transport-payload-roundtrips-without-DOM',()=>{const payload={kind:'adjust',source:'Texto literal.',localPageContext:key(),options:{namespaceNumber:0}};assert.deepEqual(JSON.parse(JSON.stringify(payload)),payload);assert.equal(structuredClone(payload).localPageContext,payload.localPageContext);});
}
report.caseCount=report.cases.length;console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;
