'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),
 sha=value=>crypto.createHash('sha256').update(Buffer.isBuffer(value)?value:typeof value==='string'?value:JSON.stringify(value)).digest('hex'),
 stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value,
 fixturePath=path.join(__dirname,'native_citation_language_safety_fixtures.json'),fixture=JSON.parse(fs.readFileSync(fixturePath)),
 args=process.argv.slice(2),runtimeFiles=args.length===1&&fs.statSync(args[0]).isDirectory()?['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.resolve(args[0],name)):args.length?args.map(file=>path.resolve(file)):['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.resolve(__dirname,'../../dist/2.19.0',name)),
 report={kind:'native-citation-language-source-safety',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),fixtureSha256:sha(fs.readFileSync(fixturePath)),contractSha256:sha(fs.readFileSync(path.join(__dirname,'native_citation_language_safety_contract.json'))),networkRequests:0,wikipediaWrites:0,bundles:[],cases:[],checks:0,failures:[],primaryCalculateInvocations:0,idempotenceCalculateInvocations:0,guardTransactions:0,sourceProofControls:0,scenarioUnit:'One independently authored source/options/expected complete-action descriptor. Bundle repeats and idempotence are separate executions. Guard transactions and fresh/stale source-proof controls are not action scenarios.'};
const receiptInputFiles=[...new Set([...runtimeFiles,...runtimeFiles.map(file=>path.join(path.dirname(file),'RevisaWiki_v2_19_0_dados.js')).filter(file=>fs.existsSync(file)),__filename,fixturePath,path.join(__dirname,'native_citation_language_safety_contract.json')])],
 receiptPins=()=>receiptInputFiles.map(file=>({file:path.basename(file),bytes:fs.statSync(file).size,sha256:sha(fs.readFileSync(file))}));
const headerAmendmentFile=path.join(__dirname,'citation_native_header_adjudication.json'),headerAmendmentBytes=fs.readFileSync(headerAmendmentFile);
assert.equal(sha(headerAmendmentBytes),'d2b65aef7ffbeb89c99f118bfed65b1c09dd2c1fbc3584285ce40f537aa2177a','The exact source-authored native header amendments are pinned');
const headerAmendment=JSON.parse(headerAmendmentBytes),headerRows=new Map(headerAmendment.rows.map(row=>[row.id,row]));
assert.equal(sha(fs.readFileSync(path.join(__dirname,headerAmendment.primaryContract.file))),headerAmendment.primaryContract.sha256,'Primary native header contract remains pinned');
function reviewedHeaderCase(c){
 const row=headerRows.get(c.id);if(!row)return c;
 assert.equal(c.source,row.source);assert.equal(sha(c.source),row.sourceSha256);assert.deepEqual(c.extra||{},row.extra);
 assert.equal(c.expected,row.previousExpected);assert.equal(sha(c.expected),row.previousExpectedEndpointSha256);
 assert.ok(['Lien web','Predefinição:Lien web','Cite web'].includes(row.nativeHeader));
 assert.equal(row.expected,c.expected.replace('{{'+row.nativeHeader+'|','{{Citar web|'),'Only the pinned local native redirect header changes');
 assert.equal(sha(row.expected),row.expectedEndpointSha256);
 return {...c,expected:row.expected,previousExpected:c.expected};
}
let blockedNetworkAttempts=0;
globalThis.fetch=function(){blockedNetworkAttempts++;throw Error('Network disabled in the local native Language receipt');};
globalThis.XMLHttpRequest=class{constructor(){blockedNetworkAttempts++;throw Error('XMLHttpRequest disabled in the local native Language receipt');}};
receiptInputFiles.push(headerAmendmentFile);report.networkBlocked=true;report.inputPinsBefore=receiptPins();
function check(actual,expected,message){report.checks++;assert.deepEqual(actual,expected,message);}
function record(row,body){try{body();row.status='passed';}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle:row.bundle,id:row.id,message:error.message});}report.cases.push(row);}
for(const file of runtimeFiles){
 const a=require(file),bundle=path.basename(file),runtimeSha256=sha(fs.readFileSync(file)),base={...a.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,registryDoiCheck:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false};
 report.bundles.push({bundle,runtimeSha256,version:a.version});
 for(const originalCase of fixture.actions){
  const c=reviewedHeaderCase(originalCase);
  const options={...base,...c.extra},row={id:c.id,bundle,runtimeSha256,evidenceKind:'actual-whole-action',source:c.source,options,expected:c.expected,sourceSha256:sha(c.source),optionsSha256:sha(options),expectedEndpointSha256:sha(c.expected),enabledBooleanOptions:Object.keys(options).filter(key=>options[key]===true).sort(),...(c.previousExpected?{previousExpectedEndpointSha256:sha(c.previousExpected),headerAmendmentSha256:sha(headerAmendmentBytes)}:{}),scopeContext:{namespaceNumber:options.namespaceNumber,contentModel:options.contentModel,pageTitle:options.pageTitle,sectionOnly:!!options.sectionOnly,discussionPage:!!options.discussionPage}};
  row.canonicalDescriptorSha256=sha(stable({source:c.source,options,expected:c.expected}));
  record(row,()=>{report.primaryCalculateInvocations++;const result=a.calculate({kind:'adjust',source:c.source,options});row.actualEndpointSha256=sha(result.text);row.appliedIds=(result.changes||[]).filter(change=>change.count>0).map(change=>change.id);check(result.text,c.expected,'Exact preauthored complete-action endpoint');check(result.preservation||[],[],'Pipeline retains source obligations');check(a.preservationAudit(c.source,result.text,options),[],'Independent preservation accepts the endpoint');check(a.safeComposition(c.source,result.text,options),'','Independent composition accepts the endpoint');report.idempotenceCalculateInvocations++;check(a.calculate({kind:'adjust',source:result.text,options}).text,c.expected,'The endpoint is stable on the second click');});
 }
 for(const c of fixture.appendGuardTransactions){
  const options={...base,...c.extra},row={id:'guard-'+c.id,bundle,runtimeSha256,evidenceKind:'guard-only-preauthored-transaction',sourceSha256:sha(c.source),candidateSha256:sha(c.target),optionsSha256:sha(options),acceptedExpected:c.accepted};report.guardTransactions++;
  record(row,()=>{const audit=a.preservationAudit(c.source,c.target,options),composition=a.safeComposition(c.source,c.target,options);check(Array.isArray(audit)&&audit.length===0,c.accepted,'Preservation independently enforces the source boundary');check(composition==='',c.accepted,'Composition independently enforces the same boundary');row.auditCodes=(audit||[]).map(item=>item.code);row.compositionReason=composition;});
 }
 const source='Texto.<ref name="externa">Fonte externa literal.</ref>\n\n{{Lien web|titre=Fonte literal|langue=<ref name="incerta" group="n">Fonte incerta literal.</ref>}}',expected=source+'\n\n{{Referências}}\n\n',plan=a.v219OpaqueLangueDefaultCollectorPlan(source,base),proof=a.v219OpaqueLangueDefaultCollectorProof;
 const proofCases=[['fresh',()=>proof(source,expected,plan,base),true],['source-retained',()=>plan.text.startsWith(source),true],['sole-append',()=>plan.text===expected,true],['one-source-span',()=>plan.edits.length===1&&plan.edits[0].start===0&&plan.edits[0].end===source.length&&plan.edits[0].text===expected,true],['stale-source',()=>proof(source+'\n',expected,plan,base),false],['forged-hash',()=>proof(source,expected,{...plan,sourceHash:'forged'},base),false],['forged-body',()=>proof(source,expected,{...plan,edits:plan.edits.map(edit=>({...edit,text:edit.text.replace('Fonte incerta','Outra fonte incerta')}))},base),false],['endMatter-off',()=>proof(source,expected,plan,{...base,endMatter:false}),false],['references-off',()=>proof(source,expected,plan,{...base,references:false}),false],['changed-target',()=>proof(source,expected.replace('{{Referências}}','{{Referências|grupo=n}}'),plan,base),false],['no-language-obligation',()=>a.v219CitationLanguageInventory('{{Quadro|lang=en}}\n{{Citar web|título=Fonte literal}}',base).hasLanguage,false]];
 for(const[id,run,wanted]of proofCases){report.sourceProofControls++;record({id:'source-proof-'+id,bundle,runtimeSha256,evidenceKind:'source-proof-control'},()=>check(run(),wanted,'Fresh source proof or exact stale/forged refusal'));}
}
report.actionCaseCount=report.primaryCalculateInvocations;report.caseCount=report.cases.length;report.distinctCanonicalActionDescriptors=new Set(report.cases.filter(row=>row.evidenceKind==='actual-whole-action').map(row=>row.canonicalDescriptorSha256)).size;
report.networkRequests=blockedNetworkAttempts;report.inputPinsAfter=receiptPins();report.inputPinsUnchanged=JSON.stringify(report.inputPinsBefore)===JSON.stringify(report.inputPinsAfter);report.receiptIntegrityChecks=2;
if(blockedNetworkAttempts||!report.inputPinsUnchanged){report.status='failed';report.failures.push({id:'receipt-input-integrity',message:blockedNetworkAttempts?'An attempted network request was blocked':'An executed runtime, data, runner, fixture or contract changed'});}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
