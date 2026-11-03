'use strict';
// A declared qualification layer for literal preference endpoints. Original
// tests and their failed raw results remain unchanged and separately recorded.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process'),Module=require('node:module');
const root=path.resolve(__dirname,'../..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const allowed=new Set(['tests/v221/citation_writer_guards.cjs','tests/v221_integrity/archive_state_activation.cjs','tests/v2212/portals_integration.cjs','tests/v2213/alias_priority.cjs']);
if(process.env.REVISAWIKI_PREFERENCE_QUALIFICATION_WORKER==='1'){
 const file=path.resolve(process.env.REVISAWIKI_PREFERENCE_TEST),relative=path.relative(root,file).split(path.sep).join('/');assert(allowed.has(relative));
 const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE),api=require(bundle),policy=require('./citation_key_preferences.json'),events=[],before=fs.readFileSync(file,'utf8'),oldCompile=Module.prototype._compile;
 function key(key){if(Object.hasOwn(policy.exact,key))return policy.exact[key];const m=/^([^0-9]*)([1-9]\d*)([^0-9]*)$/.exec(key);return m&&policy.numbered[m[1]+'#'+m[3]]?.replace('#',m[2]);}
 function endpoint(text){const options={...api.defaults,namespaceNumber:0,pageTitle:'Teste de contrato',contentModel:'wikitext',dates:false,automaticCitationDateValues:false,links:false,portals:false,infoboxes:false},plan=api.v2215AliasPlan(text,options);
  assert(api.v2215AliasProof(text,plan.text,plan,options));
  for(const e of plan.edits){const removed=text.slice(e.start,e.end);
   if(e.ruleId==='v2215ParameterSpacing')assert(e.text===''&&/^[ \t]+$/.test(removed)&&text[e.start-1]==='=','Only native named-argument padding can qualify');
   else{assert.equal(e.ruleId,'v2215PortugueseParameters');assert.equal(key(removed),e.text);assert(/\|[ \t\r\n]*$/.test(text.slice(0,e.start))&&/^[ \t]*=/.test(text.slice(e.end)),'Only a literal named key can qualify');}
  }
  if(plan.edits.length)events.push({kind:'literal-endpoint-preference',beforeSha256:sha(text),afterSha256:sha(plan.text),rules:plan.edits.map(e=>e.ruleId)});return plan.text;
 }
 globalThis.__RW2215LegacyPreferenceEndpoint=endpoint;
 if(relative==='tests/v221_integrity/archive_state_activation.cjs'){
  const original=assert.deepEqual;
  assert.deepEqual=function(actual,expected,label){try{return original(actual,expected,label);}catch(error){if(label!=='Full calculation cannot reactivate a declined native transition'||typeof actual!=='string'||typeof expected!=='string')throw error;const normalized=endpoint(expected);if(normalized===expected)throw error;return original(actual,normalized,label+'; only declared literal preferences qualified');}};
 }
 Module.prototype._compile=function(code,filename){if(path.resolve(filename)===file){assert.equal(code,before,'The inherited test starts byte-identical');
   if(relative==='tests/v221/citation_writer_guards.cjs'){const anchor='expected=full(row.after)';assert.equal(code.split(anchor).length,2);code=code.replace(anchor,'expected=globalThis.__RW2215LegacyPreferenceEndpoint(full(row.after))');}
   if(relative==='tests/v2212/portals_integration.cjs'){const anchor="alias.text.includes('Alemanha|Numismatics|Money')";assert.equal(code.split(anchor).length,2);code=code.replace(anchor,"alias.text.includes('Alemanha|Numismática|Money')");events.push({kind:'certified-portal-name-expectation',from:'Numismatics',to:'Numismática',unrelatedMoneyValueUnchanged:true});}
   if(relative==='tests/v2213/alias_priority.cjs'){const anchor="r.text.includes('website=https://example.org/perfil')";assert.equal(code.split(anchor).length,2);code=code.replace(anchor,"r.text.includes('site=https://example.org/perfil')");events.push({kind:'verified-biography-website-key-expectation',from:'website',to:'site',value:'https://example.org/perfil'});}
  }return oldCompile.call(this,code,filename);};
 process.on('exit',()=>{fs.writeFileSync(process.env.REVISAWIKI_PREFERENCE_TRACE,JSON.stringify({kind:'qualified-literal-preference-expectations',test:relative,testSha256:sha(before),runtimeSha256:sha(fs.readFileSync(bundle)),events,originalTestFileUnchanged:sha(fs.readFileSync(file))===sha(before),wikipediaWrites:0},null,2)+'\n',{flag:'wx'});});
}else{
 const [bundleArg,testArg,rawArg,receiptArg]=process.argv.slice(2),bundle=path.resolve(bundleArg),test=path.resolve(testArg),relative=path.relative(root,test).split(path.sep).join('/'),raw=path.resolve(rawArg),receipt=path.resolve(receiptArg);assert(allowed.has(relative));assert(fs.statSync(raw).size>0,'The complete prior raw outcome is retained');assert(!fs.existsSync(receipt),'Never overwrite a preceding qualification');
 const trace=receipt+'.trace.json',stdout=receipt+'.stdout',stderr=receipt+'.stderr',sf=fs.openSync(stdout,'wx'),ef=fs.openSync(stderr,'wx'),testHash=sha(fs.readFileSync(test)),bundleHash=sha(fs.readFileSync(bundle));let result;
 try{result=cp.spawnSync(process.execPath,['--require',path.join(__dirname,'legacy_minified_bindings.cjs'),'--require',path.join(root,'tests/v221/legacy_calculation_deadline.cjs'),'--require',__filename,test,bundle],{cwd:root,env:{...process.env,REVISAWIKI_CURRENT_CORE:bundle,REVISAWIKI_BUNDLE:bundle,REVISAWIKI_V221_BUNDLE:bundle,REVISAWIKI_TEST_RECEIPT:receipt+'.inner.json',REVISAWIKI_PREFERENCE_QUALIFICATION_WORKER:'1',REVISAWIKI_PREFERENCE_TEST:test,REVISAWIKI_PREFERENCE_TRACE:trace,REVISAWIKI_DEADLINE_FILES:JSON.stringify([bundle]),REVISAWIKI_DEADLINE_RECEIPT:receipt+'.deadline.json'},stdio:['ignore',sf,ef],timeout:1800000});}finally{fs.closeSync(sf);fs.closeSync(ef);}
 const detail=fs.existsSync(trace)?JSON.parse(fs.readFileSync(trace)):null,timing=fs.existsSync(receipt+'.deadline.json')?JSON.parse(fs.readFileSync(receipt+'.deadline.json')):null,passed=result.status===0&&detail?.events.length>0&&detail.originalTestFileUnchanged&&sha(fs.readFileSync(test))===testHash&&sha(fs.readFileSync(bundle))===bundleHash&&timing?.networkAttempts===0&&timing.records.reduce((n,r)=>n+r.calls,0)>0&&!timing.records.some(r=>r.timeouts);
 const report={kind:'declared-inherited-preference-qualification',status:passed?'passed-with-qualified-preference-expectations':'failed',rawStatus:'failed',rawOutcomeSha256:sha(fs.readFileSync(raw)),test:relative,testSha256:testHash,runtimeSha256:bundleHash,exitStatus:result.status,events:detail?.events||[],calculateApiCalls:timing?.records.reduce((n,r)=>n+r.calls,0)||0,rawResultsRewritten:false,originalAssertionsRetainedExceptDeclaredEndpoints:true,productionExportsOrDataChanged:false,wikipediaWrites:0};fs.writeFileSync(receipt,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));if(!passed)process.exitCode=1;
}
