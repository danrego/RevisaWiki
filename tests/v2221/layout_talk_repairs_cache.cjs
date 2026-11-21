'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{load}=require('./layout_talk_repairs_harness.cjs'),api=load();let checks=0;
const equal=(a,b,label)=>{checks++;assert.equal(a,b,label);};
for(const source of ['Texto {{Exemplo|valor=1}}.','<div>Texto {{Exemplo}}</div>','{|\n| [[Tema]]\n|}','<nowiki>{{Exemplo}}</nowiki>','{{Exemplo|texto="aspas"}}\nTexto.']){
 const a=api.v2221LayoutContext(source),b=api.v2221LayoutContext(source);equal(a.view,b.view,'read view exact');for(const at of [0,Math.floor(source.length/2),source.length]){const before=JSON.stringify(b.stateAt(at)),state=a.stateAt(at);state.templates.push({start:-1});state.html.push({name:'poison'});state.tables.push(-2);state.links.push(-3);state.external.push(-4);equal(JSON.stringify(b.stateAt(at)),before,'caller cannot mutate cached context');}
 if(a.nodes.length){const old=b.nodes[0].start;a.nodes[0].start=-100;equal(api.v2221LayoutContext(source).nodes[0].start,old,'caller cannot mutate cached nodes');}
}
const a=api.v2221LayoutContext('e\u0301 {{Exemplo}}'),b=api.v2221LayoutContext('é {{Exemplo}}');equal(a.nodes[0].start,3,'decomposed Unicode exact offset');equal(b.nodes[0].start,2,'composed Unicode exact offset');
for(let i=0;i<80;i++)api.v2221LayoutContext('Texto '+i+' '+('x'.repeat(8192))+'\n{{Exemplo}}').stateAt(0);
const status=api.v2221LayoutReadCacheStatus();equal(status.entries<=status.maximumEntries,true,'entry budget');equal(status.bytes<=status.maximumBytes,true,'byte budget');equal(status.cachedStates<=status.entries*2048,true,'per-source state budget');
const report={suite:'v2221-layout-talk-read-cache',checks,passed:true,status};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
