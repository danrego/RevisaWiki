'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const report={kind:'real-stage-signature-source-only-native-header-regressions',status:'passed',checks:0,cases:[],failures:[],runnerSha256:sha(fs.readFileSync(__filename))};
const args=process.argv.slice(2),runtimeFiles=args.length?args.flatMap(file=>fs.statSync(path.resolve(file)).isDirectory()?['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(path.resolve(file),name)):[path.resolve(file)]):['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.resolve(__dirname,'../../dist/2.19.0',name));
const receipt=require('./reference_receipt_metadata.cjs').begin(report,runtimeFiles,[path.join(__dirname,'native_partial_collector_header_contract.json'),path.join(__dirname,'native_partial_collector_stage_contract.json')],__filename);
for(const file of runtimeFiles){
 const a=require(file),bundle=path.basename(file),off=Object.fromEntries(Object.entries(a.defaults).filter(([,v])=>typeof v==='boolean').map(([k])=>[k,false])),cfg={...a.defaults,...off,references:true,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',stageProbe:'native-partial-header-source-only'},source='{{Referência|refs=<ref>{{Refn|Fonte literal.}}</ref>}}\n{{Referências}}',expected=source.replace('{{Referência|','{{Referências|');
 const check=(ok,message)=>{report.checks++;if(!ok)throw Error(message);},record=(id,kind,fn)=>{const row={id,bundle,evidenceKind:kind};try{fn(row);row.status='passed';}catch(error){row.status='failed';row.error=error.message;report.status='failed';report.failures.push(row);}report.cases.push(row);};
 for(const [id,text,wanted,options]of [
  ['ordinary',source,expected,cfg],
  ['references-off',source,source,{...cfg,references:false}],
  ['template-namespace',source,source,{...cfg,namespaceNumber:10}],
  ['code-owner','<code>'+source+'</code>','<code>'+source+'</code>',cfg],
  ['quoted-owner','"'+source+'"','"'+source+'"',cfg],
  ['unknown-owner','{{Dono desconhecido|'+source+'}}','{{Dono desconhecido|'+source+'}}',cfg],
  ['mixed-code',source+'\n<code>{{Referência}}</code>',expected+'\n<code>{{Referência}}</code>',cfg],
  ['mixed-quoted',source+'\n"{{Referência}}"',expected+'\n"{{Referência}}"',cfg]
 ])record('actual/'+id,'actual-full-action-exact-endpoint',row=>{
  receipt.whole(row,text,options,wanted,'actual/'+id);const result=a.calculate({kind:'adjust',source:text,options});row.actualEndpointSha256=sha(result.text);row.appliedRuleIds=result.changes.map(x=>x.id);
  check(result.text===wanted,'unchanged real calculate endpoint');check(!result.preservation?.length,'real pipeline accepts source permissions');check(a.calculate({kind:'adjust',source:result.text,options}).text===wanted,'real convergence');
  check(a.v219PartialNativeCollectorHeaderSource(text,options)===wanted,'direct source-only helper honors exact namespace/options/protected permissions');
 });
 record('non-wikitext-source-plan-only','source-proof-only',()=>{check(a.v219PartialNativeCollectorHeaderSource(source,{...cfg,contentModel:'json'})===source,'source proof refuses a non-wikitext frame');});
 record('real-stage-delegating-argument-observation','instrumented-real-stage-argument-observation',row=>{
  const raw=fs.readFileSync(file,'utf8'),anchor='function v219StageSafeEdits(source,edits,name,cfg={}) {';check(raw.split(anchor).length===2,'one actual stage implementation');
  // Only record arguments. The complete original stage body runs unchanged,
  // with its real owner, quarantine, atomic-family and option checks.
  const instrumented=raw.replace(anchor,anchor+' globalThis.__partialStageCalls.push({source,edits,name,cfg});'),traced=new Module(file+'.stage-signature',module);traced.filename=file;traced.paths=Module._nodeModulePaths(path.dirname(file));globalThis.__partialStageCalls=[];
  // The modular loader expands its in-memory packed data. Re-evaluate the
  // same pinned data file for this fresh instrumented module, never reuse
  // the already expanded object as though it were the original data bytes.
  const dataFile=path.join(path.dirname(file),'RevisaWiki_v2_19_0_dados.js');delete require.cache[require.resolve(dataFile)];
  traced._compile(instrumented,file);const api=traced.exports;
  check(api.v219PartialNativeCollectorHeaderSource(source,cfg)===expected,'instrumented delegate reaches same independent endpoint');
  const authored=globalThis.__partialStageCalls.filter(call=>call.source===source&&call.edits.some(edit=>edit.start===2&&edit.end===12&&edit.text==='Referências'));
  check(authored.length===1,'observe the actual separately authored header stage');check(authored[0].name==='v219-bank-native-collector-source','third actual argument is the stage name');check(authored[0].cfg===cfg&&authored[0].cfg.stageProbe===cfg.stageProbe,'fourth actual argument is the original option object');
  row.instrumentation='argument logging only, original StageSafeEdits body and dependencies retained; no mock returns';row.observedStage=authored[0].name;row.observedOptionsSha256=sha(JSON.stringify(authored[0].cfg));delete globalThis.__partialStageCalls;
 });
}
receipt.finish();console.log(JSON.stringify(report,null,2));if(report.status==='failed')process.exitCode=1;
