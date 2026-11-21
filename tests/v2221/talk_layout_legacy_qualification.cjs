'use strict';
// Only the approved projects-before-translation preference is adapted.
// The frozen tests and their original failure receipts remain unchanged.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
assert(process.env.REVISAWIKI_CURRENT_CORE,'Select the actual 2.22.1 runtime');
const runtime=path.resolve(process.env.REVISAWIKI_CURRENT_CORE),api=require(runtime),root=path.resolve(__dirname,'../..'),hash=raw=>crypto.createHash('sha256').update(raw).digest('hex'),runtimeHash=hash(fs.readFileSync(runtime));
assert.equal(api.version,'2.22.1','A legacy runtime is not a qualification target');
const pins={
 'tests/v2217/talk_contract.cjs':'818f72cd3ffb67355311b65e010b2edfd7ac70aa639c0f8f3068e0088ab3f15a',
 'tests/v2217/talk_properties.cjs':'53562d654a3ed48e4c7f4eb4bbf991cb31636ddcaafbea2e232030a06a326f2c',
 'tests/v2217/talk_layout_integration.cjs':'afc7e737c031e8d36c97a7f44d388cfabee37c5a4b4d5684466f3abfe8aec498',
 'tests/v2220/talk_layout_qualification.cjs':'9ee883ae1339474a5e5aa3de84b35c6ff8391d199af36ad3e1beda6b602611ac',
};
for(const[name,pin]of Object.entries(pins))assert.equal(hash(fs.readFileSync(path.join(root,name))),pin,'Frozen legacy test '+name);
let checks=0;const eq=(a,b,label)=>{checks++;assert.equal(a,b,label);},ok=(value,label)=>{checks++;assert(value,label);};
function replaceOnce(source,before,after,label){eq(source.split(before).length,2,'One exact approved order site: '+label);return source.replace(before,after);}
const changes=[];
function contract(source){
 source=replaceOnce(source,String.raw`'{{PD}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123|data=2026-01-02|fontes=}}\n{{Marca de projeto|?|Antropologia|?|África|?|rev=20210319}}\n{{fusões a avaliar|Tema A|Tema B}}\n== Assunto ==\nMensagem.\n\n'`,String.raw`'{{PD}}\n{{Marca de projeto|?|Antropologia|?|África|?|rev=20210319}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123|data=2026-01-02|fontes=}}\n{{fusões a avaliar|Tema A|Tema B}}\n== Assunto ==\nMensagem.\n\n'`,'one translation and merger');
 source=replaceOnce(source,String.raw`'{{PD}}\n{{Traduzido|página=First|cód_idioma=en|oldid=123}}\n{{Traduzido|página=Deuxième|cód_idioma=fr|oldid=456}}\n{{Marca de projeto|?|Ciência|?}}\n{{Fusão com|Tema A}}\n{{Fusão de|Tema B}}\nMensagem.'`,String.raw`'{{PD}}\n{{Marca de projeto|?|Ciência|?}}\n{{Traduzido|página=First|cód_idioma=en|oldid=123}}\n{{Traduzido|página=Deuxième|cód_idioma=fr|oldid=456}}\n{{Fusão com|Tema A}}\n{{Fusão de|Tema B}}\nMensagem.'`,'two independent translations and mergers');
 source=replaceOnce(source,"assert(prepare.text.indexOf('{{Traduzido')<prepare.text.indexOf('{{Marca de projeto'))","assert(prepare.text.indexOf('{{Marca de projeto')<prepare.text.indexOf('{{Traduzido'))",'preparation order predicate');
 changes.push({file:'tests/v2217/talk_contract.cjs',qualifiedSites:3,scope:'Only canonical output order and the same order predicate; all values, guards and mutation assertions retained.'});return source;
}
function properties(source){
 source=replaceOnce(source,String.raw`const calls=['{{PD}}','{{Traduzido|página=Example|cód_idioma=en|oldid=123}}','{{Marca de projeto|?|Ciência|?}}','{{fusões a avaliar|Tema A|Tema B}}'];`,String.raw`const calls=['{{PD}}','{{Marca de projeto|?|Ciência|?}}','{{Traduzido|página=Example|cód_idioma=en|oldid=123}}','{{fusões a avaliar|Tema A|Tema B}}'];`,'all 24 permutations have the selected canonical order');
 changes.push({file:'tests/v2217/talk_properties.cjs',qualifiedSites:1,scope:'Only canonical order in the permutation vector; the source permutation set and all 150 quality/importance/bot combinations remain.'});return source;
}
const integrationSource='{{pd}}\n{{Marca de projeto|1|História militar|?|bot=?/20131103|rev=20140530}}\n== Assunto ==\nMensagem.\n\n{{fusões a avaliar|Tema A|Tema B}}\n{{Traduzido|en|Example|oldid=123|data=2026-01-02}}\n',integrationCanonical='{{PD}}\n{{Marca de projeto|?|História militar|?}}\n{{Traduzido|página=Example|cód_idioma=en|oldid=123|data=2026-01-02}}\n{{fusões a avaliar|Tema A|Tema B}}\n== Assunto ==\nMensagem.\n\n';
function accepts(before,after){return before===integrationSource&&after===integrationCanonical;}
ok(accepts(integrationSource,integrationCanonical),'Exact approved source and endpoint');
const mutants=[integrationCanonical.replace('{{PD}}\n',''),integrationCanonical.replace('{{PD}}\n','{{PD}}\n{{PD}}\n'),integrationCanonical.replace('|?|História militar|?','|?|História militar|2'),integrationCanonical.replace('oldid=123','oldid=124'),integrationCanonical.replace('Example','Another'),integrationCanonical.replace('Mensagem.','Outra mensagem.'),integrationCanonical.replace('{{PD}}\n{{Marca de projeto|?|História militar|?}}\n','{{Marca de projeto|?|História militar|?}}\n{{PD}}\n')];
for(const mutant of mutants)ok(!accepts(integrationSource,mutant),'Unrelated data/order/prose mutation does not qualify');
const hook='__RW2221ExactTalkOrder';ok(!Object.hasOwn(globalThis,hook),'No qualification hook collision');let hookCalls=0;
function integration(source){changes.push({file:'tests/v2217/talk_layout_integration.cjs',qualifiedSites:1,scope:'Only the old prefix assertion; the replacement requires the exact entire output including all attribution fields and conversation bytes.'});return replaceOnce(source,String.raw`assert(t.startsWith('{{PD}}\n{{Traduzido|'))`,'assert(globalThis.__RW2221ExactTalkOrder(talk,t))','complete action exact endpoint');}
async function main(){
 const oldSummary=process.env.REVISAWIKI_TEST_RECEIPT,oldExit=process.exitCode,oldMw=globalThis.mw,temporary=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-talk-order-')),reports=[];let failure=null;
 globalThis[hook]=(before,after)=>{ok(accepts(before,after),'Only exact full output can replace historical prefix');hookCalls++;return true;};
 try{
  for(const[file,adapt]of [['tests/v2217/talk_contract.cjs',contract],['tests/v2217/talk_properties.cjs',properties],['tests/v2217/talk_layout_integration.cjs',integration]]){
   const filename=path.join(root,file),raw=fs.readFileSync(filename),text=adapt(raw.toString()),report=path.join(temporary,path.basename(file)+'.json');process.env.REVISAWIKI_TEST_RECEIPT=report;
   const copy=new Module(filename,module);copy.filename=filename;copy.paths=Module._nodeModulePaths(path.dirname(filename));const log=console.log;console.log=()=>{};
   try{copy._compile(text,filename);await new Promise(resolve=>setImmediate(resolve));}finally{console.log=log;}
   eq(process.exitCode,oldExit,'No asynchronous legacy assertion failed');ok(fs.existsSync(report),'Every legacy assertion set reached its receipt');const result=JSON.parse(fs.readFileSync(report));ok(result.passed===true,'Legacy assertion receipt passed');reports.push({file,suite:result.suite,checks:result.checks,calculations:result.calculations,entrypoint:file.endsWith('talk_layout_integration.cjs')?'calculate':'v2217TalkPlan',passed:true});eq(hash(fs.readFileSync(filename)),pins[file],'Legacy source file remains unchanged');
  }
  eq(hookCalls,1,'Exactly one full-action prefix expectation qualified');eq(hash(fs.readFileSync(runtime)),runtimeHash,'Runtime bytes unchanged');
 }catch(error){failure=error;}
 finally{delete globalThis[hook];if(oldSummary===undefined)delete process.env.REVISAWIKI_TEST_RECEIPT;else process.env.REVISAWIKI_TEST_RECEIPT=oldSummary;if(oldMw===undefined)delete globalThis.mw;else globalThis.mw=oldMw;fs.rmSync(temporary,{recursive:true,force:true});}
 const report={suite:'v2221-talk-layout-precise-historical-qualification',version:'2.22.1',runtime:path.basename(runtime),runtimeSha256:runtimeHash,passed:!failure,checks:checks+reports.reduce((n,r)=>n+r.checks,0),qualificationChecks:checks,calculations:reports.reduce((n,r)=>n+r.calculations,0),fullActionCalls:reports.filter(r=>r.entrypoint==='calculate').reduce((n,r)=>n+r.calculations,0),directPlannerCases:reports.filter(r=>r.entrypoint==='v2217TalkPlan').reduce((n,r)=>n+r.calculations,0),inheritedCounterIsNotAllFullActionCalls:true,legacyAssertions:reports,qualifiedAssertionSites:5,qualifiedChanges:changes,sourcePins:pins,mutationControls:mutants.length,oldTestFilesModified:false,historicalFailedStatusesRewritten:false,productOrPreservationGuardsModified:false,versionGuardQualification:'The previous 2.22.0 qualification is superseded only as a version-specific harness; this runner requires 2.22.1 and executes the same full integration assertion set.',wikipediaWrites:0};
 if(oldSummary)fs.writeFileSync(oldSummary,JSON.stringify(report,null,2)+'\n');if(failure)throw failure;console.log(JSON.stringify({suite:report.suite,checks:report.checks,calculations:report.calculations,qualifiedAssertionSites:5,passed:true}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
