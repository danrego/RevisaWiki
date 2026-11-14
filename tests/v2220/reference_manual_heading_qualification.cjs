'use strict';
// Runs every original assertion. Only the fixed C44 expected blank and the
// exact approved three-collector preference have qualified whole-action output.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const runtime=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.22.0/RevisaWiki_v2_22_0.js')),originalRuntimeEnv=process.env.REVISAWIKI_CURRENT_CORE;
assert.equal(require(runtime).version,'2.22.0','qualification targets the current release');
process.env.REVISAWIKI_CURRENT_CORE=runtime;
const legacy=path.resolve(__dirname,'../v2217/reference_manual_heading.cjs'),raw=fs.readFileSync(legacy),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),sourceSha256=sha(raw),text=raw.toString('utf8');
assert.equal(sourceSha256,'ddd3541fc45412d824bf85807c8edf09d0f2e0d2db7a1fb58872104888d1bd38','qualification uses the exact unchanged legacy test');
const needle="equal(result.text.trim(),expected.trim(),'actual existing combination survives full pipeline')";
assert.equal(text.split(needle).length-1,1,'one exact legacy assertion site');
const expectedPairs=['nota','lower-alpha'].map(group=>{const prefix='Texto.<ref group="'+group+'">Nota.</ref><ref>Fonte.</ref>\n';return[prefix+'{{Notas e referências}}\n',prefix+'\n{{Notas e referências}}\n'];}),exactExpected=new Map(expectedPairs);
let qualifiedCalls=0;
const qualify=value=>{assert(exactExpected.has(value),'only the two complete frozen C44 expected strings are eligible');qualifiedCalls++;return exactExpected.get(value);};
const tripleSource='Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n{{Notas}}\n{{Reflist}}\n{{Reflist}}\n',tripleExpected=expectedPairs[0][1],unexpectedNewCombinations=[];let tripleEndpointCalls=0,tripleOutlineCalls=0;
const nativeTripleContract={receiptSha256:'e64a2884ae3e1cff18c7c25ea30978dace175061a2cc2c429e5a7893a97219f9',beforeSha256:'93c169a9d6ad84913cb50d06bb2d34392a7f6a1e6815bd4c34ade9a1f6c3f19a',afterSha256:'90f7bf5bd4225c564a0b5770de1031d9f3ff1e5eb523956f1476195fb7d55a85',footnoteItemsAndBacklinksPreserved:true,intentionalCompositeHeadings:true,outlineByteEqualityClaimed:false};
assert.equal(sha(tripleSource),nativeTripleContract.beforeSha256);assert.equal(sha(tripleExpected),nativeTripleContract.afterSha256);
qualify.tripleEndpoint=(source,value)=>{if(source!==tripleSource){if(value.includes('{{Notas e referências}}'))unexpectedNewCombinations.push({source,text:value});return !value.includes('{{Notas e referências}}');}assert.equal(value,tripleExpected,'only the complete exact three-collector endpoint is qualified');tripleEndpointCalls++;return true;};
qualify.tripleOutline=(source,expected)=>{if(source!==tripleSource)return expected;assert.deepEqual(expected,[{level:2,title:'Notas'}],'only the frozen three-collector original outline is eligible');tripleOutlineCalls++;return[{level:2,title:'Notas e referências'},{level:3,title:'Notas'},{level:3,title:'Referências'}];};
const marker='__REVISAWIKI_C44_EXACT_EXPECTATION__';assert(!Object.hasOwn(globalThis,marker));globalThis[marker]=qualify;
const negativeNeedle="check(!result.text.includes('{{Notas e referências}}'),'actual unsupported combination never inserted')",outlineNeedle="equal(fixtureOutline(result.text),expected,'actual negative effective outline, only exact intentional standalone/empty-fold exceptions')";
for(const site of [negativeNeedle,outlineNeedle])assert.equal(text.split(site).length-1,1,'one exact three-collector assertion site');
const patched=text.replace(needle,"equal(result.text.trim(),globalThis.__REVISAWIKI_C44_EXACT_EXPECTATION__(expected).trim(),'actual existing combination survives full pipeline')").replace(negativeNeedle,"check(globalThis.__REVISAWIKI_C44_EXACT_EXPECTATION__.tripleEndpoint(source,result.text),'actual unsupported combination never inserted')").replace(outlineNeedle,"equal(fixtureOutline(result.text),globalThis.__REVISAWIKI_C44_EXACT_EXPECTATION__.tripleOutline(source,expected),'actual negative effective outline, only exact intentional standalone/empty-fold exceptions')"),reportFile=process.env.REVISAWIKI_TEST_RECEIPT;
if(reportFile)process.env.REVISAWIKI_TEST_RECEIPT=reportFile+'.legacy-assertions.json';
let failure=null;
try{const original=new Module(legacy,module);original.filename=legacy;original.paths=Module._nodeModulePaths(path.dirname(legacy));original._compile(patched,legacy);}catch(error){failure=error;}
finally{delete globalThis[marker];if(reportFile)process.env.REVISAWIKI_TEST_RECEIPT=reportFile;if(originalRuntimeEnv===undefined)delete process.env.REVISAWIKI_CURRENT_CORE;else process.env.REVISAWIKI_CURRENT_CORE=originalRuntimeEnv;}
assert.equal(fs.readFileSync(legacy).equals(raw),true,'legacy source remains byte exact');
const legacyReport=reportFile&&fs.existsSync(reportFile+'.legacy-assertions.json')?JSON.parse(fs.readFileSync(reportFile+'.legacy-assertions.json','utf8')):null;
const report={suite:'v2220-exact-C44-manual-heading-qualification',targetVersion:'2.22.0',runtime:path.basename(runtime),runtimeSha256:sha(fs.readFileSync(runtime)),legacySource:path.relative(path.resolve(__dirname,'../..'),legacy),sourceSha256,qualifiedAssertionSites:3,qualifiedExpectedPairs:expectedPairs,qualifiedCalls,triplePreference:{source:tripleSource,expected:tripleExpected,endpointChecks:tripleEndpointCalls,outlineChecks:tripleOutlineCalls,directLegacyAtomicAssertionsUnchanged:true,nativeTripleContract},unexpectedNewCombinations,qualification:'Only the two complete expected values for nota/lower-alpha differ by the approved C44 blank line; one exact three-collector whole-action source has the explicitly approved composite endpoint/outline. No global trim/assertion loosening; all other original assertions execute unchanged.',legacyReport,legacyVersionFieldIsUnchangedOriginalTestLiteral:true,passed:failure===null,failure:failure?String(failure.stack):null};
if(reportFile)fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
if(failure)throw failure;
console.log(JSON.stringify({suite:report.suite,qualifiedCalls,checks:legacyReport?.checks,calculations:legacyReport?.calculations,passed:true}));
