'use strict';
// Real source-level stage calls and integrated calculations. No guard, parser,
// native contract or aggregate release verdict is mocked by these controls.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js')),api=require(file),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
assert.equal(typeof api.endMatterPass,'function');
const options={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',sectionOnly:false,autoPreview:false,registryDoiCheck:false};
let checks=0,directStageCalls=0,calculateCalls=0;const rows=[];
function eq(actual,expected,label){checks++;assert.deepEqual(actual,expected,label);}
function check(value,label){checks++;assert(value,label);}
function stage(id,source,expected,expectedKinds=[],overrides={}){
 const cfg={...options,...overrides},snapshot=JSON.stringify(cfg),timeline=[],started=performance.now();
 const output=api.endMatterPass(source,(...args)=>timeline.push({kind:'mark',args}),(...args)=>timeline.push({kind:'warn',args}),cfg);directStageCalls++;
 eq(output,expected,id+' exact stage endpoint');eq(timeline.map(row=>row.kind),expectedKinds,id+' exact callback ordering/count');
 eq(JSON.stringify(cfg),snapshot,id+' caller options are not mutated');
 check(performance.now()-started<5000,id+' bounded stage return');
 const second=api.endMatterPass(output,()=>{},()=>{},cfg);directStageCalls++;
 eq(second,output,id+' stage idempotence');
 rows.push({id,sourceSha256:sha(source),outputSha256:sha(output),callbackKinds:timeline.map(row=>row.kind),status:'passed'});
 return {output,timeline};
}
const body='Texto.<ref>Fonte.</ref>',custom='<references group="grupo particular"/>',withCustom=body+'\n\n'+custom;
stage('custom-group-append-isolated',withCustom,withCustom);
stage('multiple-custom-collectors-retained',withCustom+'\n<references group="outro grupo"/>',withCustom+'\n<references group="outro grupo"/>');
stage('native-custom-call-retained',body+'\n{{Referências|grupo=grupo particular}}',body+'\n{{Referências|grupo=grupo particular}}');
stage('existing-default-retained',body+'\n{{Referências}}',body+'\n{{Referências}}');
const bank='Texto.<ref name="A"/>\n\n{{Referências|refs=<ref name="A">Fonte.</ref>}}';
stage('definition-bank-retained',bank,bank);
stage('missing-default-still-inserted',body,body+'\n\n{{Referências}}\n\n',['mark']);
const quoted='<nowiki>{{Referências}}</nowiki>\n'+body;
stage('quoted-renderer-not-an-existing-bank',quoted,quoted+'\n\n{{Referências}}\n\n',['mark']);
const hierarchy='= Entrada =\n'+withCustom+'\n\n{{Bibliografia}}',hierarchyExpected='== Entrada ==\n'+withCustom+'\n\n=== Bibliografia ===';
const normalized=stage('rejected-append-keeps-heading-work',hierarchy,hierarchyExpected,['mark','mark','mark']);
eq(normalized.timeline.map(row=>row.args[0]),['endMatter','headings','headings'],'Rejected preliminary append does not leak its counter callback');
stage('reference-option-off-keeps-heading-work',hierarchy,hierarchyExpected,['mark','mark','mark'],{references:false});
stage('section-only-is-untouched',hierarchy,hierarchy,[],{sectionOnly:true});
const warningSource='= Entrada =\n====== Preservado ======\n== Seguinte ==',warningExpected='== Entrada ==\n====== Preservado ======\n=== Seguinte ===';
const warning=stage('accepted-path-preserves-interleaving',warningSource,warningExpected,['mark','warn','mark']);
eq(warning.timeline.filter(row=>row.kind==='mark').map(row=>row.args[0]),['headings','headings'],'Marks preserve their original values');
check(warning.timeline[1].args[0].includes('nível 6'),'The original warning is retained once in its original position');
let restoreCalls=0;
const restored=api.endMatterPass(withCustom,()=>{},()=>{},options,text=>{restoreCalls++;return text;});directStageCalls++;
eq(restored,withCustom,'The original-source callback does not reactivate an unsafe append');
eq(restoreCalls,1,'The references-disabled retry does not repeat the source-restoration callback');
check(!api.v219BankRetention(withCustom,withCustom+'\n\n{{Referências}}\n\n',options).accepted,'The unchanged bank reader rejects the original forbidden proposal');
const opaque='{{Citar web|url=https://example.invalid|título=Fonte|langue=<ref name="L">Nota opaca.</ref>}}',opaqueSource=body+'\n'+opaque;
check(api.v219OpaqueNativeLangueOwners(opaqueSource).length===1,'The recursion control uses an actual opaque native language owner');
stage('opaque-owner-no-existing-renderer',opaqueSource,opaqueSource+'\n\n{{Referências}}\n\n',['mark']);
const opaqueExisting=opaqueSource+'\n'+custom;
stage('opaque-owner-existing-renderer',opaqueExisting,opaqueExisting);
const started=performance.now(),opaquePlan=api.v219OpaqueLangueDefaultCollectorPlan(opaqueSource,options);
check(opaquePlan.edits.length===1,'The inherited no-existing-renderer proof remains usable');
check(api.v219BankRetention(opaqueSource,opaquePlan.text,options).accepted,'The indirect endMatterPass reader path returns normally');
eq(api.v219OpaqueLangueDefaultCollectorPlan(opaqueExisting,options).edits.length,0,'The reader path excludes existing-renderer sources before calling the wrapper');
check(performance.now()-started<5000,'The real reader/wrapper call graph remains bounded');

const url='https://example.invalid/fonte',archive='https://web.archive.org/web/20070405201701/'+url;
const imported='{{Cita web|url='+url+'|titolo=Fonte de exemplo|accesso=8 agosto 2006|dataarchivio=5 aprile 2007|urlarchivio='+archive+'|urlmorto=sì}}';
const migrated='{{Citar web|url='+url+'|título=Fonte de exemplo|acessodata=2006-08-08|arquivodata=2007-04-05|arquivourl='+archive+'|urlmorta=sim}}';
for(const [id,source,valid]of [
 ['independent-native-migration','Texto [[Brasil|Brasil]].<ref>'+imported+'</ref>\n\n'+custom,true],
 ['independent-migration-with-heading','= Entrada =\nTexto.<ref>'+imported+'</ref>\n\n'+custom+'\n\n{{Bibliografia}}',true],
 ['invalid-date-remains-literal','Texto [[Brasil|Brasil]].<ref>'+imported.replace('8 agosto 2006','31 febbraio 2006')+'</ref>\n\n'+custom,false]
]){
 const first=api.calculate({kind:'adjust',source,originalSource:source,options});calculateCalls++;
 check(api.v219AutomaticResultSafety(source,first).accepted,id+' accepted integrated endpoint');
 if(valid)check(first.text.includes(migrated),id+' independent citation migration survives');
 else {
  const invalid=imported.replace('8 agosto 2006','31 febbraio 2006'),argumentsOnly=invalid.slice(invalid.indexOf('|'));
  check(first.text.includes('{{Citar web'+argumentsOnly),id+' established header alias may normalize while every invalid-source field remains exact');
 }
 if(source.includes('[[Brasil|Brasil]]'))check(first.text.includes('[[Brasil]]'),id+' unrelated safe link correction survives');
 check(!/\{\{Referências\}\}/.test(first.text),id+' forbidden late default collector remains absent');
 const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});calculateCalls++;
 eq(second.text,first.text,id+' integrated idempotence');
 rows.push({id,sourceSha256:sha(source),outputSha256:sha(first.text),status:'passed'});
}
const receipt={kind:'legacy-collector-stage-isolation-and-callback-contract',version:'2.21.7',bundle:path.basename(file),bundleSha256:sha(fs.readFileSync(file)),cases:rows.length,checks,directStageCalls,calculateCalls,rows,guardReplaced:false,wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({cases:rows.length,checks,directStageCalls,calculateCalls,passed:true}));
