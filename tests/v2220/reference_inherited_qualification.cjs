'use strict';
// Execute the complete inherited runner; qualify one exact whole-action
// representation without changing its direct-plan checks or child assertions.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),runtime=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(root,'dist/2.22.0/RevisaWiki_v2_22_0.js')),legacy=path.join(root,'tests/v2217/reference_inherited.cjs'),raw=fs.readFileSync(legacy),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),sourceHash=sha(raw),text=raw.toString('utf8'),runtimeHash=sha(fs.readFileSync(runtime));
assert.equal(sourceHash,'552269cb9f74a42799f7a42b61609dfab399b72a301656e885f11b8b20888420','exact frozen inherited runner');assert.equal(require(runtime).version,'2.22.0');
const source='Texto.<ref>Fonte</ref>\n== Referências ==\n{{Reflist|2}}',oldExpected='Texto.<ref>Fonte</ref>\n== Referências ==\n{{Referências|nível=0}}',canonical='Texto.<ref>Fonte</ref>\n\n{{Referências}}',refs=s=>[...s.matchAll(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>/g)].map(m=>m[0]);
function outline(s){
 const rows=[...s.matchAll(/^(={1,6})[ \t]*(.*?)[ \t]*\1[ \t]*$/gm)].map(m=>({at:m.index,level:m[1].length,title:m[2]}));
 for(const m of s.matchAll(/\{\{Referências(?:\|([^{}]*))?\}\}/g)){
  const fields=new Map((m[1]||'').split('|').map(p=>p.split('=')));if(fields.get('nível')==='0')continue;
  rows.push({at:m.index,level:/^[1-5]$/.test(fields.get('nível')||'')?Number(fields.get('nível')):2,title:'Referências'});
 }
 return rows.sort((a,b)=>a.at-b.at).map(({level,title})=>({level,title}));
}
let checks=0,qualifiedCalls=0;function check(x,message){checks++;assert.ok(x,message);}
function accepts(actual){return actual===canonical&&JSON.stringify(refs(actual))===JSON.stringify(refs(source))&&JSON.stringify(outline(actual))===JSON.stringify(outline(source));}
const mutants=[canonical.replace('{{Referências}}','== Referências ==\n{{Referências}}'),canonical.replace('Fonte</ref>','Outra fonte</ref>'),canonical+'<ref>Inventada</ref>',canonical.replace('<ref>','<ref group="x">'),canonical+'Texto novo.',canonical.replace('{{Referências}}','{{Referências|nível=0}}'),canonical.replace('{{Referências}}','{{Referências|nível=3}}'),canonical.replace('\n\n{{Referências}}','\n{{Referências}}')];
check(accepts(canonical),'exact canonical endpoint and effective outline');for(const mutant of mutants)check(!accepts(mutant),'unrelated or unapproved endpoint rejected');
const marker='__RW222_EXACT_NUMERIC_CANONICAL__';assert(!Object.hasOwn(globalThis,marker));
globalThis[marker]=(before,actual,prior)=>{check(before===source,'one exact numeric collector source');check(prior===oldExpected,'one exact superseded whole-action representation');check(accepts(actual),'raw reference definitions and native heading tree exact');qualifiedCalls++;return canonical;};
const needle="same(first.text,expected,'actual whole action matches qualified endpoint')";assert.equal(text.split(needle).length-1,1,'one assertion site only');
const patched=text.replace(needle,"same(first.text,globalThis.__RW222_EXACT_NUMERIC_CANONICAL__(source,first.text,expected),'actual whole action matches qualified endpoint')"),reportFile=process.env.REVISAWIKI_TEST_RECEIPT,oldRuntime=process.env.REVISAWIKI_CURRENT_CORE,oldDir=process.env.REVISAWIKI_REFERENCE_INHERITED_DIR;
process.env.REVISAWIKI_CURRENT_CORE=runtime;if(reportFile)process.env.REVISAWIKI_REFERENCE_INHERITED_DIR=reportFile+'.legacy-inherited';let failure=null;
try{const moduleCopy=new Module(legacy,module);moduleCopy.filename=legacy;moduleCopy.paths=Module._nodeModulePaths(path.dirname(legacy));moduleCopy._compile(patched,legacy);}catch(error){failure=error;}
finally{delete globalThis[marker];if(oldRuntime===undefined)delete process.env.REVISAWIKI_CURRENT_CORE;else process.env.REVISAWIKI_CURRENT_CORE=oldRuntime;if(oldDir===undefined)delete process.env.REVISAWIKI_REFERENCE_INHERITED_DIR;else process.env.REVISAWIKI_REFERENCE_INHERITED_DIR=oldDir;}
check(fs.readFileSync(legacy).equals(raw),'historical test unchanged');check(sha(fs.readFileSync(runtime))===runtimeHash,'runtime unchanged');
const summaryPath=reportFile?reportFile+'.legacy-inherited/SUMMARY.json':null,summary=summaryPath&&fs.existsSync(summaryPath)?JSON.parse(fs.readFileSync(summaryPath)):null;
if(!failure){check(qualifiedCalls>0,'exact representation qualification was exercised');check(summary?.passed===true||!reportFile,'all inherited child assertions and other native qualifications passed');}
const report={suite:'v222-reference-inherited-exact-canonical-qualification',runtime:path.basename(runtime),runtimeSha256:runtimeHash,legacySourceHash:sourceHash,qualifiedAssertionSites:1,qualifiedCalls,checks,sourceSha256:sha(source),oldWholeActionExpectedSha256:sha(oldExpected),canonicalWholeActionExpectedSha256:sha(canonical),effectiveOutlineBefore:outline(source),effectiveOutlineAfter:outline(canonical),rawReferenceDefinitionsPreserved:true,nativeCollectorOldid:63785697,nativeHeadingHelperOldid:72474006,mutationControls:mutants.length,directNumericPlanAssertionsUnchanged:true,inheritedSummary:summary,oldTestFilesModified:false,rawHistoricalFailedStatusesRewritten:false,passed:!failure,failure:failure?String(failure.stack):null,wikipediaWrites:0};
if(reportFile)fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');if(failure)throw failure;console.log(JSON.stringify({suite:report.suite,passed:true,checks:checks+(summary?.checks||0),qualifiedCalls,childSuites:summary?.tasks?.length||null}));
