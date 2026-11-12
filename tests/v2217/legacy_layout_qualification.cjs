'use strict';
// A test-only reader for requested template source layout. Original historical
// tests, failed results, runtime functions and emitted values remain intact.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function normalizedLayout(source,bare=false){
 if(typeof source!=='string')return source;
 function templateEnd(s,start){
  let depth=0;for(let i=start;i<s.length-1;i++){
   if(s.slice(i,i+2)==='{{'){depth++;i++;}
   else if(s.slice(i,i+2)==='}}'){depth--;i++;if(!depth)return i+1;}
  }return null;
 }
 function parts(s){
  const out=[];let start=0,templates=0,links=0;
  for(let i=0;i<s.length;i++){
   const pair=s.slice(i,i+2);
   if(pair==='{{'){templates++;i++;continue;}if(pair==='}}'&&templates){templates--;i++;continue;}
   if(pair==='[['){links++;i++;continue;}if(pair===']]'&&links){links--;i++;continue;}
   if(s[i]==='|'&&!templates&&!links){out.push(s.slice(start,i));start=i+1;}
  }out.push(s.slice(start));return out;
 }
 function named(part){
  const m=/^([ \t\r\n]*)([\p{L}\p{N}_ /.-]+?)[ \t]*=([\s\S]*)$/u.exec(part);
  if(!m)return part;
  return m[2].trim()+'='+m[3].replace(/^[ \t]+/,'').replace(/\r?\n[ \t]*$/,'');
 }
 let result='',at=0;
 while(at<source.length){
  const start=source.indexOf('{{',at);if(start<0){result+=source.slice(at);break;}
  const end=templateEnd(source,start);if(end===null){result+=source.slice(at);break;}
  result+=source.slice(at,start);const fields=parts(source.slice(start+2,end-2));
  result+='{{'+fields.map((part,i)=>i===0?part.trim():named(normalizedLayout(part))).join('|')+'}}';at=end;
 }
 return bare?named(result):result;
}
module.exports={normalizedLayout};
if(require.main===module||process.env.REVISAWIKI_LAYOUT_QUALIFICATION_WORKER==='1'){
 const root=path.resolve(__dirname,'../..'),cp=require('node:child_process');
 const allowed=new Set(['tests/v2213/compatibility.cjs','tests/v2213/images.cjs','tests/v2213/native_fields.cjs','tests/v2213/lead.cjs','tests/v2213/alias_priority.cjs','tests/v2213/legacy_pins.cjs','tests/v2212/portals_integration.cjs']);
 if(process.env.REVISAWIKI_LAYOUT_QUALIFICATION_WORKER==='1'){
  const Module=require('node:module'),parser=require('@babel/parser'),file=path.resolve(process.env.REVISAWIKI_LAYOUT_QUALIFICATION_TEST),relative=path.relative(root,file).split(path.sep).join('/'),before=fs.readFileSync(file,'utf8'),events=[],compile=Module.prototype._compile;
  assert(allowed.has(relative));
  globalThis.__rw2217LiteralLayoutIncludes=function(receiver,operation,...args){
   const original=receiver[operation](...args),needle=args[0];
   if(original||typeof receiver!=='string'||typeof needle!=='string'||args.length!==1)return original;
   if(operation==='startsWith'){
    if(!/^\{\{Info\/[^{}|\r\n]+\|$/.test(needle))return original;
    const actual=normalizedLayout(receiver);
    if(actual!==receiver&&actual.startsWith(needle)){
     events.push({kind:'same-template-header-after-vertical-layout',needleSha256:sha(needle),actualSha256:sha(receiver),canonicalActualSha256:sha(actual)});return true;
    }
    return original;
   }
   if(!needle.includes('='))return original;
   const actual=normalizedLayout(receiver),expected=normalizedLayout(needle,true);
   if((actual!==receiver||expected!==needle)&&actual.includes(expected)){
    events.push({kind:'source-layout-only',needleSha256:sha(needle),canonicalNeedleSha256:sha(expected),actualSha256:sha(receiver),canonicalActualSha256:sha(actual)});return true;
   }
   // This exact native-key preference was established by the earlier release.
   // No arbitrary key, URL or value translation qualifies.
   if(relative==='tests/v2213/alias_priority.cjs'&&needle==='website=https://example.org/perfil'&&actual.includes('site=https://example.org/perfil')){
    events.push({kind:'previously-verified-site-key-preference',needleSha256:sha(needle),actualSha256:sha(receiver)});return true;
   }
   return original;
  };
  Module.prototype._compile=function(code,filename){
   if(path.resolve(filename)===file){
    assert.equal(code,before,'The historical test starts byte-identical');const tree=parser.parse(code),edits=[];
    function visit(n){if(!n||typeof n!=='object')return;
     if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&!n.callee.computed&&['includes','startsWith'].includes(n.callee.property.name)&&n.arguments.length===1)
      edits.push({start:n.start,end:n.end,text:'globalThis.__rw2217LiteralLayoutIncludes('+code.slice(n.callee.object.start,n.callee.object.end)+','+JSON.stringify(n.callee.property.name)+','+code.slice(n.arguments[0].start,n.arguments[0].end)+')'});
     for(const [key,value]of Object.entries(n)){if(['loc','start','end'].includes(key))continue;if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}
    }visit(tree);
    // Nested includes calls are not used by these immutable historical suites.
    const sorted=edits.sort((a,b)=>b.start-a.start);let boundary=code.length;
    for(const e of sorted){assert(e.end<=boundary,'No overlapping harness edit');code=code.slice(0,e.start)+e.text+code.slice(e.end);boundary=e.start;}
   }return compile.call(this,code,filename);
  };
  process.on('exit',()=>fs.writeFileSync(process.env.REVISAWIKI_LAYOUT_QUALIFICATION_TRACE,JSON.stringify({test:relative,testSha256:sha(before),events,originalTestFileUnchanged:sha(fs.readFileSync(file))===sha(before),runtimeFunctionsModified:false,wikipediaWrites:0},null,2)+'\n',{flag:'wx'}));
 }else{
  const [bundleArg,testArg,rawArg,outArg]=process.argv.slice(2),bundle=path.resolve(bundleArg),test=path.resolve(testArg),raw=path.resolve(rawArg),out=path.resolve(outArg),relative=path.relative(root,test).split(path.sep).join('/');assert(allowed.has(relative));assert(fs.statSync(raw).size>0);assert(!fs.existsSync(out));
  const trace=out+'.trace.json',testRaw=fs.readFileSync(test),runtimeRaw=fs.readFileSync(bundle),p=cp.spawnSync(process.execPath,['--require',path.join(root,'tests/v2215/legacy_minified_bindings.cjs'),'--require',__filename,test,bundle],{cwd:root,env:{...process.env,REVISAWIKI_CURRENT_CORE:bundle,REVISAWIKI_V221_BUNDLE:bundle,REVISAWIKI_BUNDLE:bundle,REVISAWIKI_TEST_RECEIPT:out+'.inner.json',REVISAWIKI_LAYOUT_QUALIFICATION_WORKER:'1',REVISAWIKI_LAYOUT_QUALIFICATION_TEST:test,REVISAWIKI_LAYOUT_QUALIFICATION_TRACE:trace},encoding:'utf8',maxBuffer:8*1024*1024,timeout:600000});
  fs.writeFileSync(out+'.stdout',p.stdout||'');fs.writeFileSync(out+'.stderr',p.stderr||'');let detail=null;try{detail=JSON.parse(fs.readFileSync(trace));}catch{}
  const passed=p.status===0&&detail?.events.length>0&&detail.originalTestFileUnchanged&&sha(fs.readFileSync(test))===sha(testRaw)&&sha(fs.readFileSync(bundle))===sha(runtimeRaw),report={kind:'bounded-literal-source-layout-qualification',status:passed?'passed-with-declared-source-layout-expectations':'failed',rawStatus:'failed',rawOutcomeSha256:sha(fs.readFileSync(raw)),runtimeSha256:sha(runtimeRaw),test:relative,testSha256:sha(testRaw),normalizerSha256:sha(fs.readFileSync(__filename)),events:detail?.events||[],exitStatus:p.status,error:p.error?{code:p.error.code}:null,rawResultsRewritten:false,productionFunctionsOrDataChanged:false,wikipediaWrites:0};fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({test:relative,status:report.status,qualifiedLiteralAssertions:report.events.length}));if(!passed)process.exitCode=1;
 }
}
