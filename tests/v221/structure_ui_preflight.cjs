'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),api=require(process.env.REVISAWIKI_V221_BUNDLE||path.join(root,'dist/2.21.0/RevisaWiki_v2_21_0.js')),
 code=fs.readFileSync(path.join(root,'src/v2_21/ui_preflights.js'),'utf8'),
 source='<gallery>\nFile::Example.jpg|Legenda preservada.\n</gallery>',options={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',revisionId:12};
let checks=0;
async function run(mutate=()=>{},cfg={}){
 const reply={query:{normalized:[{from:'File::Example.jpg',to:'Ficheiro::Example.jpg'},{from:'File:Example.jpg',to:'Ficheiro:Example.jpg'}],
  pages:[{title:'Ficheiro::Example.jpg',invalid:true},{title:'Ficheiro:Example.jpg',imageinfo:[{url:'https://example.org/Example.jpg'}]}]}},calls=[];
 mutate(reply);
 const task={source,title:options.pageTitle,base:12,section:null,guard(){},preflightRequests:[]},
  context={Map,Date,Number,JSON,Promise,encodeURIComponent,endMatterReadCache:new Map(),
   v221StructureExternalRequests:api.v221StructureExternalRequests,v221InfoboxEntityRequests:()=>[],
   v221CitationTitleRequests:()=>[],mw:{config:{get:()=>false},Api:class{get(p){calls.push(p);return Promise.resolve(reply);}}},$:{}};
 vm.createContext(context);vm.runInContext(code+'\nglobalThis.prepare=v221PrepareEvidence;',context);
 const result=await context.prepare(task,{...options,...cfg});assert.equal(task.source,source);checks++;
 assert.equal(task.preflightRequests.length,0);checks++;
 return {result,calls,text:api.v221StructurePlan(source,{...options,...result}).text};
}
(async()=>{
 const positive=await run();assert.equal(positive.text,source.replace('File::','File:'));checks++;
 assert.equal(positive.calls.length,1);checks++;assert.equal(positive.calls[0].action,'query');checks++;
 assert.equal(positive.calls[0].prop,'imageinfo');checks++;
 const missing=await run(r=>{delete r.query.pages[0].invalid;r.query.pages[0].missing=true;});
 assert.equal(missing.text,source.replace('File::','File:'));checks++;
 const shared=await run(r=>{r.query.pages[1].missing=true;r.query.pages[1].imagerepository='shared';});
 assert.equal(shared.text,source.replace('File::','File:'));checks++;
 for(const mutate of [
  r=>{r.query.normalized=[];},r=>{r.query.normalized.push({from:'File:Example.jpg',to:'Ficheiro:Outra.jpg'});},
  r=>{r.query.pages[0].imageinfo=[{url:'https://example.org/Original.jpg'}];},
  r=>{r.query.pages[0].imagerepository='shared';},r=>{r.query.pages[1].imageinfo=[];},
  r=>{delete r.query.pages[0].invalid;},r=>{r.query.pages.push({...r.query.pages[1]});},
  r=>{r.query.normalized.push({from:'Ficheiro:Example.jpg',to:'File:Example.jpg'});}
 ]){const negative=await run(mutate);assert.equal(negative.text,source);checks++;}
 const off=await run(()=>{},{images:false});assert.equal(off.calls.length,0);checks++;assert.equal(off.text,source);checks++;
 console.log(JSON.stringify({status:'passed',kind:'actual-read-preflight-normalization-and-file-existence-contract',checks,
  fixture:'Explicit fictional API replies; not evidence of a real file or a browser execution',wikipediaWrites:0,networkRequests:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
