'use strict';
// Current artifact-path adapter. All observer fixtures and assertions remain unchanged.
// The child preloader translates only exact release filenames and records every source change.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process');
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const hashObject=v=>sha(JSON.stringify(canonical(v)));
function run(leaf,suite,args){
 const testDir=path.dirname(leaf),root=path.resolve(testDir,'../..'),dir=path.join(testDir,'new_writer_observers',suite),spec=JSON.parse(fs.readFileSync(path.join(dir,'SUITE.json')));
 if(args.length!==2)throw Error('Supply explicit core and complete artifact paths');
 const files=args.map(f=>fs.realpathSync(f));if(files[0]===files[1])throw Error('Two different artifacts required');
 const data=fs.realpathSync(path.join(path.dirname(files[0]),'RevisaWiki_v2_20_0_dados.js'));
 if(data!==fs.realpathSync(path.join(path.dirname(files[1]),'RevisaWiki_v2_20_0_dados.js')))throw Error('Adjacent DATA differs');
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-finite-')),output=path.join(scratch,'observer.json');
 const replacement={'<CORE>':files[0],'<FULL>':files[1],'<DATA>':data,'<ROOT>':root,'<DIR>':dir,'<OUTPUT>':output};
 const argv=[path.join(dir,'observer.cjs'),...spec.argv.map(value=>{for(const[k,v]of Object.entries(replacement))value=value.split(k).join(v);if(/<(?:CORE|FULL|DATA|ROOT|DIR|OUTPUT)>/.test(value))throw Error('Unresolved local artifact argument');return value;})];
 const pin=f=>{const raw=fs.readFileSync(f);return {file:fs.realpathSync(f),bytes:raw.length,sha256:sha(raw)};};
 const inputFiles=[leaf,__filename,process.execPath,...files,data,...spec.inputs.map(value=>{for(const[k,v]of Object.entries(replacement))value=value.split(k).join(v);return value;})];
 const before=inputFiles.map(pin),runtimes=files.map(pin),contractFile=path.join(dir,'CONTRACT.json'),contractSha256=sha(fs.readFileSync(contractFile));
 const child=cp.spawnSync(process.execPath,[path.join(__dirname,'legacy_compat.cjs'),...argv],{cwd:root,encoding:'utf8',maxBuffer:256*1024*1024,env:{...process.env,NODE_OPTIONS:'',NODE_PATH:''}});
 fs.writeFileSync(path.join(scratch,'observer.stdout.json'),child.stdout||'');fs.writeFileSync(path.join(scratch,'observer.stderr.txt'),child.stderr||'');
 let raw;try{raw=JSON.parse(child.stdout);}catch(error){raw={status:'unreadable-observer-report',failures:[{message:String(error),childExitCode:child.status}],checks:0};}
 const failures=Array.isArray(raw.failures)?[...raw.failures]:[{message:'Observer failure array is absent'}];
 const cases=[],partitions=[];for(const field of spec.rowArrays){const rows=raw[field];partitions.push({field,actualRows:Array.isArray(rows)?rows.length:null});if(!Array.isArray(rows)){failures.push({message:'Missing original row array',field});continue;}for(const row of rows){
  const item={...row,observerRole:row.kind||spec.defaultRole};
  const planExpected=row.expectedEndpointSha256||row.expectedSha256||row.afterSha256,wholeExpected=row.kind==='plan-and-whole-action'&&typeof row.wholeExpectedSeparate==='string'?sha(row.wholeExpectedSeparate):null,expected=wholeExpected||planExpected,options=row.optionsSha256||(row.options?hashObject(row.options):null);
  if(/^[a-f0-9]{64}$/.test(row.sourceSha256||'')&&/^[a-f0-9]{64}$/.test(options||'')&&/^[a-f0-9]{64}$/.test(expected||'')){
   item.canonicalDescriptor={action:item.observerRole,sourceSha256:row.sourceSha256,optionsSha256:options,expectedEndpointSha256:expected};
   if(wholeExpected)item.canonicalDescriptor.planExpectedEndpointSha256=planExpected;
   if(typeof row.expectedAccepted==='boolean')item.canonicalDescriptor.expectedAccepted=row.expectedAccepted;
   if(row.afterSha256)item.canonicalDescriptor.endpointRole='literal-supplied-guard-candidate; acceptance is separately asserted';
   item.scenarioSha256=hashObject(item.canonicalDescriptor);
  }else item.scenarioBindingMissing='The original typed observer does not expose every source/options/endpoint component for this role.';
  cases.push(item);
 }}
 const observedRuntimeHashes=new Set();for(const value of [...(raw.bundles||[]),...cases]){const h=value.runtimeSha256||value.sha256;if(h)observedRuntimeHashes.add(h);}
 if(child.status!==0||child.error||raw.status!=='passed')failures.push({message:'Original observer did not pass',childExitCode:child.status,rawStatus:raw.status,childError:child.error?String(child.error):null});
 if(cases.length!==spec.expectedRows)failures.push({message:'Original typed row denominator differs',actual:cases.length,expected:spec.expectedRows});
 for(const r of runtimes)if(!observedRuntimeHashes.has(r.sha256))failures.push({message:'Original report does not bind an executed artifact',sha256:r.sha256});
 if(raw.networkRequests!==0||raw.wikipediaWrites!==0)failures.push({message:'Original observer network/write zero fields differ'});
 const after=inputFiles.map(pin);if(JSON.stringify(before)!==JSON.stringify(after))failures.push({message:'Portable adapter input bytes changed'});
 const wholeRows=cases.filter(row=>typeof row.first?.text==='string'&&typeof row.second?.text==='string').length;
 const report={...raw,schemaVersion:1,status:failures.length?'failed':'passed',rawObserverStatus:raw.status,failures,cases,bundles:runtimes.map(r=>({...r,runtimeSha256:r.sha256,executedHashBoundByOriginalRows:observedRuntimeHashes.has(r.sha256)})),contractSha256,sourceContractSha256:contractSha256,fixtureFilesSha256:hashObject(spec.fixtureFiles.map(name=>({name,sha256:sha(fs.readFileSync(path.join(dir,name)))}))),actualRowPartitions:partitions,declaredTypedCounts:spec.typedCounts,actualCompletedFirstSecondRows:wholeRows,actualObserverCounters:raw.observerDirectCallCounts||raw.executions||raw.calls||(typeof raw.directPlanCalls==='number'?{directPlanCalls:raw.directPlanCalls,calculateCalls:raw.calculateCalls,standaloneGuardCalls:raw.standaloneGuardCalls}:null),calculateCallsCounterScope:'Only explicit original observer counters; absence is not replaced by a planned count.',adapterInputsBefore:before,adapterInputsAfter:after,adapterInputsUnchanged:JSON.stringify(before)===JSON.stringify(after),rawObserverStdoutSha256:sha(child.stdout||''),rawObserverStderrSha256:sha(child.stderr||''),rawObserverReportDirectory:scratch,networkRequests:raw.networkRequests,wikipediaWrites:raw.wikipediaWrites,semanticAcceptanceClaim:false,writerCreditFromHelperRows:0,articleCoverageCredit:0};
 process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
}
module.exports={run};
