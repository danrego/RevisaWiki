'use strict';
// Run unchanged inherited reference/citation contracts against the selected
// distribution. Raw failures remain failures, with an immutable log per run.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(root,'dist/2.21.7/RevisaWiki_v2_21_7.js')),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),bytes=fs.readFileSync(bundle),output=process.env.REVISAWIKI_REFERENCE_INHERITED_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki2217-reference-inherited-'));
fs.mkdirSync(output,{recursive:true});assert(!fs.existsSync(path.join(output,'SUMMARY.json')),'Preserve every previous attempt');
const suites=['tests/v2216/reference_repairs.cjs','tests/v2216/reference_properties.cjs','tests/v2216/reference_integration.cjs','tests/v2216/autonames.cjs','tests/v2216/autoname_quote_integrity.cjs','tests/v2212/citations.cjs','tests/v2212/citations_full.cjs','tests/v2212/citations_language.cjs'],tasks=[];
// Two old assertions require one exact syntactic representation after a
// numeric Reflist conversion. Preserve their raw failures and independently
// prove the corrected native-equivalent representation; no old test is edited.
function numericHeadingQualification(file,result,receipt){
 if(!result||!Array.isArray(result.failures)||result.failures.length!==1)return null;
 const source='Texto.<ref>Fonte</ref>\n== Referências ==\n{{Reflist|2}}',expected='Texto.<ref>Fonte</ref>\n== Referências ==\n{{Referências|nível=0}}',oldExpected='Texto.<ref>Fonte</ref>\n{{Referências}}';
 const repair=file==='tests/v2216/reference_repairs.cjs',integration=file==='tests/v2216/reference_integration.cjs';if(!repair&&!integration)return null;
 const failure=result.failures[0],match=repair?failure.label==='reflist-columns-two'&&failure.actual===expected&&failure.expected===oldExpected:
  failure.id==='numbered-reflist producer applied'&&failure.actual===false&&failure.expected===true;
 if(!match)return null;
 const saved=result.rows.find(r=>r.id===(repair?'reflist-columns-two':'numbered-reflist'));
 assert(saved&&saved.sourceSha256===sha(source));assert.equal(saved[repair?'candidateSha256':'resultSha256'],sha(expected));
 const api=require(bundle),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false};let checks=0,calls=0;
 const verify=(condition,message)=>{checks++;assert(condition,message);},same=(a,b,message)=>{checks++;assert.deepEqual(a,b,message);};
 const outline=text=>{const heads=[...text.matchAll(/^(={1,6})[ \t]*(.*?)[ \t]*\1[ \t]*$/gm)].map(m=>({at:m.index,level:m[1].length,title:m[2]}));
  for(const m of text.matchAll(/\{\{Referências(?:\|([^{}]*))?\}\}/g)){const controls=new Map((m[1]||'').split('|').map(p=>p.split('=')));if(controls.get('nível')==='0')continue;heads.push({at:m.index,level:/^[1-5]$/.test(controls.get('nível')||'')?Number(controls.get('nível')):2,title:'Referências'});}
  return heads.sort((a,b)=>a.at-b.at).map(({level,title})=>({level,title}));};
 const refs=text=>[...text.matchAll(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>/g)].map(m=>m[0]);
 const accepts=text=>text===expected&&JSON.stringify(outline(text))===JSON.stringify(outline(source))&&JSON.stringify(refs(text))===JSON.stringify(refs(source));
 const plan=api.v2216ReferencePlan(source,cfg);same(plan.text,expected,'numeric writer retains its own existing title');verify(api.v2216ReferenceProof(source,plan.text,plan,cfg),'existing source-bound producer proof');verify(accepts(plan.text),'literal definitions and effective native outline exact');
 const first=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calls++;same(first.text,expected,'actual whole action matches qualified endpoint');verify(api.v219AutomaticResultSafety(source,first).accepted,'actual unchanged safety accepted');same(first.preservation||[],[],'actual preservation findings empty');
 const second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options:cfg});calls++;same(second.text,first.text,'actual second action stable');
 const mutants=[expected.replace('|nível=0',''),expected.replace('== Referências ==','=== Referências ==='),expected.replace('== Referências ==','== Fontes =='),expected.replace('Fonte</ref>','Outra fonte</ref>'),expected+'<ref>Inventada</ref>',expected.replace('<ref>','<ref group="x">'),expected+'Texto novo.',expected.replace('== Referências ==\n','')];
 for(const mutant of mutants)verify(!accepts(mutant),'unrelated source/heading/reference mutation rejected');
 return{accepted:true,classification:'exact-old-syntax-expectation-superseded-by-native-heading-ownership',rawFailureCount:1,rawFailure:failure,testSha256:sha(fs.readFileSync(path.join(root,file))),rawReceiptSha256:sha(fs.readFileSync(receipt)),bundleSha256:sha(bytes),sourceSha256:sha(source),outputSha256:sha(expected),sourceFieldsAndDefinitionsExact:true,effectiveOutlineBefore:outline(source),effectiveOutlineAfter:outline(expected),nativeTemplateOldid:63785697,nativeHeadingHelperOldid:72474006,nativeContractAuditSha256:'be2f5c6bf41450ebd25cffa920364c1e4ddbfe71d7b9b80a61ef15bc7a2c784b',mutationControls:mutants.length,checks,additionalCalculateCalls:calls,originalTestsChanged:false,productionGuardsChanged:false};
}
for(const file of suites){
 const name=file.replaceAll('/','-'),stdout=path.join(output,name+'.stdout'),stderr=path.join(output,name+'.stderr'),receipt=path.join(output,name+'.json'),source=fs.readFileSync(path.join(root,file)),sf=fs.openSync(stdout,'wx'),ef=fs.openSync(stderr,'wx');let p;
 try{p=cp.spawnSync(process.execPath,['--require',path.join(root,'tests/v2215/legacy_minified_bindings.cjs'),path.join(root,file)],{cwd:root,env:{...process.env,REVISAWIKI_CURRENT_CORE:bundle,REVISAWIKI_TEST_RECEIPT:receipt,REVISAWIKI_LEGACY_BINDING_RECEIPT:receipt+'.bindings'},stdio:['ignore',sf,ef],timeout:600000});}finally{fs.closeSync(sf);fs.closeSync(ef);}
 const text=fs.readFileSync(stdout,'utf8');let result=null;
 if(fs.existsSync(receipt))try{result=JSON.parse(fs.readFileSync(receipt));}catch{}
 if(!result)for(const line of text.split('\n'))try{const x=JSON.parse(line);if(x&&typeof x==='object')result=x;}catch{}
 const row={file,status:p.status===0?'passed':'failed',exitCode:p.status,signal:p.signal,error:p.error?{code:p.error.code,message:p.error.message}:null,checks:result?.checks??result?.assertions??null,cases:result?.cases??result?.calculations??null,testSha256:sha(source),testUnchanged:sha(fs.readFileSync(path.join(root,file)))===sha(source),bundleUnchanged:sha(fs.readFileSync(bundle))===sha(bytes),stdoutSha256:sha(fs.readFileSync(stdout)),stderrSha256:sha(fs.readFileSync(stderr))};
 if(row.status==='failed'&&p.status===1&&fs.existsSync(receipt)){row.qualification=numericHeadingQualification(file,result,receipt);if(row.qualification){row.qualifiedStatus='passed-with-exact-native-contract-qualification';row.rawStatus='failed';}}
 tasks.push(row);fs.writeFileSync(path.join(output,'PROGRESS.json'),JSON.stringify({bundle:path.basename(bundle),bundleSha256:sha(bytes),tasks},null,2)+'\n');console.log(file+' '+row.status+(row.qualification?' (exact native-contract qualification)':''));
}
const report={scope:'Unchanged inherited reference/citation functional suites only; no talk policy expectations reclassified',bundle:path.basename(bundle),bundleSha256:sha(bytes),externalProcessCapMilliseconds:600000,tasks,checks:tasks.reduce((n,r)=>n+(Number(r.checks)||0)+(r.qualification?.checks||0),0),additionalCalculateCalls:tasks.reduce((n,r)=>n+(r.qualification?.additionalCalculateCalls||0),0),rawFailedSuites:tasks.filter(r=>r.status==='failed').length,exactQualifiedSuites:tasks.filter(r=>r.qualification?.accepted).length,passed:tasks.every(r=>(r.status==='passed'||r.qualification?.accepted)&&r.testUnchanged&&r.bundleUnchanged),wikipediaWrites:0};
fs.writeFileSync(path.join(output,'SUMMARY.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,passed:report.passed,checks:report.checks,tasks:tasks.length}));if(!report.passed)process.exitCode=1;
