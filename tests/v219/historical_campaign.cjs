'use strict';
// Execute immutable leaves independently so an obsolete assertion cannot hide
// all later suites. A failed old expectation is never converted into a pass.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const [key,...tail]=value.replace(/^--/,'').split('=');return [key,tail.join('=')||true];})),root=path.resolve(args.repo||path.join(__dirname,'../..'));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex'),planFile=path.resolve(args.plan||path.join(__dirname,'historical_execution_plan.json')),planBytes=fs.readFileSync(planFile),plan=JSON.parse(planBytes);
const output=args.output&&path.resolve(args.output),preloadFile=path.resolve(args.preload||path.join(__dirname,'historical_preload_imports.cjs'));
const reportContractFile=path.join(path.dirname(preloadFile),'historical_report_output_contract.json'),reportOutputContractSha256=hash(fs.readFileSync(reportContractFile));
const additionalFile=path.join(__dirname,'historical_additional_leaves.json'),additionalBytes=fs.readFileSync(additionalFile),additional=JSON.parse(additionalBytes),additionalSha256=hash(additionalBytes),additionalByFile=new Map(additional.entries.map(row=>[row.file,row]));
const runnerSha256=hash(fs.readFileSync(__filename)),preloadSha256=hash(fs.readFileSync(preloadFile));if(args.execute&&!output)throw new Error('Execution requires a private --output directory');
if(output&&output.startsWith(root+path.sep))throw new Error('Historical receipts and raw failures must stay outside the repository');
const version=String(args.version||'2.19.0'),slug='v'+version.replaceAll('.','_'),bundles=[args.core||path.join(root,'dist',version,'RevisaWiki_'+slug+'.js'),args.complete||path.join(root,'dist',version,'RevisaWiki_'+slug+'_completo.js')].map(file=>path.resolve(file));
const shard=Number(args.shard||0),shards=Number(args.shards||1),limit=args.limit?Number(args.limit):Infinity,timeout=Number(args.timeout||120000);
if(!Number.isInteger(shard)||!Number.isInteger(shards)||shard<0||shard>=shards||shards<1)throw new Error('Invalid deterministic shard');
const manifestFile=args.manifest?path.resolve(args.manifest):null;
if(args.execute&&!args.development&&!manifestFile)throw new Error('A final historical campaign requires the frozen release manifest');
let manifestSha256=null;
if(manifestFile){const manifestBytes=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestBytes);manifestSha256=hash(manifestBytes);if(manifest.version!==version)throw new Error('Another release manifest cannot authorize this campaign');const entries=manifest.items||Object.entries(manifest.files||{}).map(([filename,pin])=>({filename,...pin}));if(!entries.length)throw new Error('The manifest has no pinned files');for(const item of entries){const bytes=fs.readFileSync(path.join(path.dirname(manifestFile),item.filename));if(hash(bytes)!==item.sha256||bytes.length!==item.bytes)throw new Error('The pinned release differs: '+item.filename);}for(const bundle of bundles){const pin=entries.find(item=>item.filename===path.basename(bundle));if(!pin||pin.sha256!==hash(fs.readFileSync(bundle)))throw new Error('An actual bundle is not bound by the release manifest');}}
const selection=[],excluded=[],filter=args.filter?new RegExp(String(args.filter)):null;
for(const row of plan.historicalFiles){
 let reason=null;const reviewed=additionalByFile.get(row.file);
 if(reviewed&&reviewed.sourceSha256!==row.sha256)throw new Error('Reviewed additional source differs from the immutable plan: '+row.file);
 if(!row.file.startsWith('tests/')&&!reviewed)reason='production-or-migration-tool';
 else if(row.classification!=='behavior-or-integrity-leaf')reason=row.classification;
 else if(!/\.cjs$/.test(row.file))reason='requires-separate-browser-javascript-contract';
 else if(/\/(?:browser|native|native_v\d+|native_browser|inline_v\d+|index_v\d+)\//.test(row.file)||/browser|geometry|responsive_layout|reference_column_geometry|ui_freshness|independent_v213_sorting/.test(path.basename(row.file)))reason='requires-separate-real-browser-contract';
 else if(!reviewed&&/(?:prepare_|collect_|capture_|download_|anonym|privacy|publish|upload)/.test(path.basename(row.file)))reason='capture-or-maintenance-tool-not-an-offline-behavior-leaf';
 if(reason){excluded.push({file:row.file,sha256:row.sha256,classification:reason,obligation:/^requires-separate-.*browser/.test(reason)?'separate-browser-execution':'source-inventory-only'});continue;}
 if(filter&&!filter.test(row.file))continue;
 if(parseInt(hash(row.file).slice(0,8),16)%shards!==shard)continue;
 if(selection.length>=limit)break;
 selection.push(row);
}
const report={schemaVersion:1,kind:'immutable-historical-leaf-execution',version,development:!!args.development,status:args.execute?'running':'plan-only',runnerSha256,preloadSha256,reportOutputContractSha256,additionalReviewedLeavesSha256:additionalSha256,sourceAddressMode:'imports-only',manifestSha256,planSha256:hash(planBytes),shard,shards,timeoutMs:timeout,selectedLeaves:selection.length,excluded,results:[],wikipediaWrites:0,orchestratorAssertionRewrites:0,orchestratorExpectedResultRewrites:0,deduplication:false};
if(!args.execute){report.selection=selection.map(({file,sha256,staticAssertionSiteCount})=>({file,sha256,staticAssertionSiteCount}));process.stdout.write(JSON.stringify(report,null,2)+'\n');process.exit(0);}
fs.mkdirSync(output,{recursive:true});
if(fs.existsSync(path.join(output,'rows.jsonl')))throw new Error('Use a new receipt directory; prior immutable execution evidence is not overwritten');
report.bundles=bundles.map(file=>{const bytes=fs.readFileSync(file);return {bundle:path.basename(file),sha256:hash(bytes),bytes:bytes.length};});
for(const row of selection)for(const [index,bundle]of bundles.entries()){
 const reviewed=additionalByFile.get(row.file),runtimeArgs=reviewed?.runtimePositionalArgument===2?[bundle]:[],runtimeEnvironment=reviewed?.runtimeEnvironmentPointer==='REVISAWIKI_BUNDLE'?{REVISAWIKI_BUNDLE:bundle}:{};
 const original=fs.readFileSync(path.join(root,row.file));
 const releaseVersionComparisons=[...original.toString('utf8').matchAll(/\.version\s*(?:===?|!==?)\s*(['"])(2\.[0-9]+(?:\.[0-9]+)?)\1/g)].map(match=>({offset:match.index,sha256:hash(match[0]),expectedRelease:match[2],conditionalExecutionRequiresReview:true}));if(hash(original)!==row.sha256)throw new Error('Historical immutable source changed: '+row.file);
 const id=hash(row.file+'|'+report.bundles[index].sha256).slice(0,24),bindingFile=path.join(output,id+'.binding.json'),stdoutFile=path.join(output,id+'.stdout'),stderrFile=path.join(output,id+'.stderr');
 const stdout=fs.openSync(stdoutFile,'w'),stderr=fs.openSync(stderrFile,'w');
 const reportsDirectory=path.join(output,id+'.reports');fs.mkdirSync(reportsDirectory,{recursive:true});
 const preload=preloadFile,nodeOptions=(process.env.NODE_OPTIONS||'')+' --require='+JSON.stringify(preload);
 const result=cp.spawnSync(process.execPath,[path.join(root,row.file),...runtimeArgs],{cwd:root,timeout,env:{...process.env,...runtimeEnvironment,NODE_OPTIONS:nodeOptions,REVISAWIKI_SCRIPT:bundle,REVISAWIKI_QA_SCRIPT:bundle,REVISAWIKI_CORE:bundles[0],REVISAWIKI_COMPLETE:bundles[1],REVISAWIKI_EXPECTED_VERSION:version,REVISAWIKI_REPORT_DIR:reportsDirectory,REVISAWIKI_QA_OUTPUT:reportsDirectory,REVISAWIKI_QA_REPORT:path.join(reportsDirectory,'REPORT.json'),REVISAWIKI_HISTORICAL_REPO:root,REVISAWIKI_HISTORICAL_RUNTIME:bundle,REVISAWIKI_HISTORICAL_BINDING:bindingFile},stdio:['ignore',stdout,stderr]});
 fs.closeSync(stdout);fs.closeSync(stderr);
 const bindingFiles=fs.readdirSync(output).filter(value=>value.startsWith(path.basename(bindingFile)+'.')&&value.endsWith('.json')).sort(),bindings=bindingFiles.map(value=>JSON.parse(fs.readFileSync(path.join(output,value))));
 const resultRow={id,file:row.file,sourceSha256:row.sha256,staticAssertionSites:row.staticAssertionSiteCount,releaseVersionComparisons,bundle:report.bundles[index].bundle,runtimeSha256:report.bundles[index].sha256,exitCode:result.status,signal:result.signal,errorCode:result.error?.code||null,status:result.status===0?'passed-immutable-execution':'failed-needs-classification',sourceBytesUnchanged:hash(fs.readFileSync(path.join(root,row.file)))===row.sha256,runtimeReached:bindings.some(value=>value.runtimeLoads),dynamicNonexactSources:bindings.reduce((n,value)=>n+(value.dynamicExecutions||[]).filter(row=>!row.exactRuntime).length,0),blockedNetwork:bindings.reduce((n,value)=>n+value.blockedNetwork,0),blockedRepositoryWrites:bindings.reduce((n,value)=>n+value.blockedRepositoryWrites,0),bindingSha256:hash(JSON.stringify(bindingFiles.map(value=>hash(fs.readFileSync(path.join(output,value)))))),stdoutSha256:hash(fs.readFileSync(stdoutFile)),stderrSha256:hash(fs.readFileSync(stderrFile)),assertionRewrites:0,expectedResultRewrites:0};
 if(!resultRow.sourceBytesUnchanged)throw new Error('Historical execution changed its immutable source');
 resultRow.assertionInstrumentation='transparent exported assertion call forwarding';
 resultRow.executedAssertionCalls=bindings.reduce((n,value)=>n+(value.assertionCalls||0),0);resultRow.assertionCallsAfterCandidateImport=bindings.reduce((n,value)=>n+(value.assertionCallsAfterCandidateImport||0),0);resultRow.legacyIntegrityAssertionCalls=bindings.reduce((n,value)=>n+(value.legacyIntegrityAssertionCalls||0),0);resultRow.conditionalVersionReviewRequired=bindings.some(value=>(value.conditionalVersionBranches||[]).length>0);resultRow.instrumentationBytesUnchanged=bindings.every(value=>value.instrumentationBytesUnchanged!==false);
 resultRow.generatedReportWrites=bindings.reduce((n,value)=>n+(value.reportOutputRedirects||[]).length,0);resultRow.generatedReportReads=bindings.reduce((n,value)=>n+(value.reportOutputReadRedirects||[]).length,0);
 resultRow.expectationAdapterLoads=bindings.reduce((n,value)=>n+(value.expectationAdapters||[]).length,0);
 resultRow.reviewedAdditionalLeaf=reviewed?{sourceSha256:reviewed.sourceSha256,role:reviewed.role,runtimeEnvironmentPointer:reviewed.runtimeEnvironmentPointer,runtimePositionalArgument:reviewed.runtimePositionalArgument}:null;
 resultRow.boundRuntimeHashesMatch=bindings.every(value=>value.runtimeSha256===report.bundles[index].sha256&&value.runtimeBytesUnchanged);
 if(resultRow.status.startsWith('passed')&&(!resultRow.runtimeReached||resultRow.dynamicNonexactSources||resultRow.expectationAdapterLoads||!resultRow.boundRuntimeHashesMatch))resultRow.status='passed-but-not-final-runtime-functional-evidence';
 if(resultRow.status==='passed-immutable-execution'&&resultRow.generatedReportWrites)resultRow.status='passed-immutable-assertions-with-exact-report-output-redirection';
 report.results.push(resultRow);fs.appendFileSync(path.join(output,'rows.jsonl'),JSON.stringify(resultRow)+'\n');
 fs.writeFileSync(path.join(output,'SUMMARY.json'),JSON.stringify(report,null,2)+'\n');
 process.stdout.write(JSON.stringify({leaf:row.file,bundle:resultRow.bundle,status:resultRow.status,completed:report.results.length})+'\n');
}
report.runnerBytesUnchanged=hash(fs.readFileSync(__filename))===runnerSha256;report.preloadBytesUnchanged=hash(fs.readFileSync(preloadFile))===preloadSha256;report.planBytesUnchanged=hash(fs.readFileSync(planFile))===hash(planBytes);report.manifestBytesUnchanged=!manifestFile||hash(fs.readFileSync(manifestFile))===manifestSha256;
report.reportOutputContractBytesUnchanged=hash(fs.readFileSync(reportContractFile))===reportOutputContractSha256;
report.additionalReviewedLeavesBytesUnchanged=hash(fs.readFileSync(additionalFile))===additionalSha256;
report.status=report.results.some(value=>value.status==='failed-needs-classification')?'completed-with-unclassified-failures':'completed';
report.counts=report.results.reduce((out,row)=>(out[row.status]=(out[row.status]||0)+1,out),{});
fs.writeFileSync(path.join(output,'SUMMARY.json'),JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({status:report.status,counts:report.counts})+'\n');if(!report.runnerBytesUnchanged||!report.preloadBytesUnchanged||!report.planBytesUnchanged||!report.manifestBytesUnchanged||!report.reportOutputContractBytesUnchanged||!report.additionalReviewedLeavesBytesUnchanged)throw new Error('Historical runner, preload or immutable plan changed during execution');
