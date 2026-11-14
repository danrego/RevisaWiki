'use strict';
// An older test expected a valid native UrlStatus field to become DeadURL.
// Keep every activation/consumer assertion and qualify only that exact endpoint.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),runtime=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(root,'dist/2.22.0/RevisaWiki_v2_22_0.js')),legacy=path.join(root,'tests/v221_integrity/archive_state_activation.cjs'),raw=fs.readFileSync(legacy),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),sourceHash=sha(raw),runtimeRaw=fs.readFileSync(runtime),runtimeHash=sha(runtimeRaw);
const nativeReader=runtimeRaw.toString('utf8');assert(nativeReader.includes('function nativeCitationAccepts('));let boundaries=0;
const exposed=nativeReader.replace(/const\s+api\s*=\s*\{/,text=>{boundaries++;return text+'nativeCitationAccepts,v221CitationConsumer,';});assert.equal(boundaries,1,'one test-only export boundary');
const runtimeCopy=new Module(runtime,module);runtimeCopy.filename=runtime;runtimeCopy.paths=Module._nodeModulePaths(path.dirname(runtime));runtimeCopy._compile(exposed,runtime);const api=runtimeCopy.exports;
assert.equal(sourceHash,'3a02ef2a606fd29f8b9997448760c38ef3b42497061d15e8d9149315e5da344d','exact inherited activation source');assert.equal(api.version,'2.22.0');
let checks=0,qualifiedCalls=0;const events=[];
function check(value,message){checks++;assert.ok(value,message);}
function endpoint(source,expected){
 if(source===expected)return expected;
 const match=/\|url-status=(live|dead)(?=\||\}\}$)/.exec(source);if(!match||(source.match(/\|url-status=/g)||[]).length!==1)return expected;
 const alternate=source.slice(0,match.index)+'|urlmorta='+(match[1]==='live'?'não':'sim')+source.slice(match.index+match[0].length);
 if(expected!==alternate)return expected;
 const context=api.v218CitationNativeContext(source);
 if(!context||!api.nativeCitationAccepts(context.native,'url-status'))return expected;
 check(!!api.v221CitationConsumer(source),'qualified source retains a native citation consumer');qualifiedCalls++;
 events.push({sourceSha256:sha(source),oldExpectedSha256:sha(expected),nativeExpectedSha256:sha(source),state:match[1],nativeField:'url-status',nativeFieldAccepted:true});
 return source;
}
const control='{{Citar web|url=https://example.invalid/a|título=Obra|url-status=dead}}';
check(endpoint(control,control.replace('|url-status=dead','|urlmorta=sim'))===control,'one accepted UrlStatus endpoint remains native');
for(const expected of [control,control.replace('título=Obra','título=Outra'),control.replace('url-status=dead','urlmorta=não'),control.replace('https://example.invalid/a','https://other.invalid/a')])check(endpoint(control,expected)===expected,'unrelated endpoint cannot be qualified');
for(const source of [control.replace('url-status','URL-status'),control.replace('|url-status=dead','|url-status=dead|url-status=live'),control.replace('Citar web','Modelo desconhecido')])check(endpoint(source,source.replace('|url-status=dead','|urlmorta=sim'))===source.replace('|url-status=dead','|urlmorta=sim'),'unproved source cannot be qualified');
// The preceding positive is a mutation control, not an inherited assertion.
qualifiedCalls=0;events.length=0;
const chapterExpected='Texto.<ref>{{Citar livro|url=https://example.invalid/a|título=Obra|arquivourl=https://web.archive.org/web/20240101000000/https://example.invalid/a|arquivodata=2024-01-01|urlmorta=sim|acessourl=registro|chapter-url=https://example.invalid/a|chapter=Parte}}</ref>\n\n{{Referências}}\n',chapterCanonical=chapterExpected.replace('|chapter-url=','|capítulourl=').replace('|chapter=','|capítulo=');let chapterCalls=0;
function chapterEndpoint(expected){if(expected!==chapterExpected)return expected;chapterCalls++;events.push({kind:'exact-existing-chapter-key-preference',sourceSha256:sha(expected),canonicalSha256:sha(chapterCanonical),valuesChanged:false});return chapterCanonical;}
check(chapterEndpoint(chapterExpected)===chapterCanonical,'exact declared chapter-key preferences');chapterCalls=0;events.length=0;
for(const mutant of [chapterExpected.replace('Parte','Outra'),chapterExpected.replace('|urlmorta=sim','|urlmorta=não'),chapterExpected.replace('|acessourl=registro','|acessourl=free'),chapterExpected.replace('https://example.invalid/a','https://other.invalid/a')])check(chapterEndpoint(mutant)===mutant,'no unrelated chapter/access/content change qualified');
const marker='__RW222_ARCHIVE_NATIVE_ENDPOINT__',chapterMarker='__RW222_ARCHIVE_CHAPTER_ENDPOINT__',needle='const inspect=(source,expected,label)=>{',chapterNeedle="eq(result.text,planned.text,'Full calculation cannot reactivate a declined native transition')";assert(!Object.hasOwn(globalThis,marker)&&!Object.hasOwn(globalThis,chapterMarker));globalThis[marker]=endpoint;globalThis[chapterMarker]=chapterEndpoint;
const text=raw.toString('utf8');assert.equal(text.split(needle).length-1,1,'one exact inherited inspect anchor');assert.equal(text.split(chapterNeedle).length-1,1,'one exact inherited final endpoint site');const patched=text.replace(needle,needle+'expected=globalThis.__RW222_ARCHIVE_NATIVE_ENDPOINT__(source,expected);').replace(chapterNeedle,"eq(result.text,globalThis.__RW222_ARCHIVE_CHAPTER_ENDPOINT__(planned.text),'Full calculation cannot reactivate a declined native transition')");
let result=null,failure=null;
try{const copy=new Module(legacy,module);copy.filename=legacy;copy.paths=Module._nodeModulePaths(path.dirname(legacy));copy._compile(patched,legacy);result=copy.exports.run(api);}catch(error){failure=error;}finally{delete globalThis[marker];delete globalThis[chapterMarker];}
check(fs.readFileSync(legacy).equals(raw),'old assertion source unchanged');check(sha(fs.readFileSync(runtime))===runtimeHash,'runtime unchanged');
const report={suite:'v222-inherited-native-url-status-qualification',runtime:path.basename(runtime),runtimeSha256:runtimeHash,legacySourceHash:sourceHash,qualifiedAssertionSites:2,qualifiedCalls,chapterCalls,checks,events,legacyReport:result,testOnlyExportExposure:true,behavioralEnginePatches:0,oldAssertionsOtherThanNativeStatusAndOneExactExistingChapterPreferenceUnchanged:true,oldTestFilesModified:false,rawHistoricalFailedStatusesRewritten:false,passed:!failure,failure:failure?String(failure.stack):null,wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');if(failure)throw failure;check(qualifiedCalls>0,'actual inherited native-status expectations were exercised');console.log(JSON.stringify({suite:report.suite,passed:true,checks:checks+(result?.checks||0),calculations:result?.calculations||0,qualifiedCalls}));
