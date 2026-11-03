'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const compiler=path.resolve(__dirname,'../../scripts/v2215_compact.cjs'),{saveSafeJavaScript,format}=require(compiler),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
let checks=0;const rows=[],failures=[];
const eq=(a,b,label)=>{checks++;try{assert.deepEqual(a,b,label);}catch{failures.push({label});}},value=s=>vm.runInNewContext(s,Object.create(null),{timeout:1000});
async function positive(id,source){
 const expected=value(source),saved=saveSafeJavaScript(source),formatted=await format(source);
 eq(value(saved.code),expected,'Save-safe literal values: '+id);eq(value(formatted.code),expected,'Formatted literal values: '+id);
 eq(value(saved.code.normalize('NFC')),expected,'Native NFC cannot change a protected literal: '+id);
 eq(value(formatted.code.normalize('NFC')),expected,'Formatted native NFC identity: '+id);
 eq(saved.code.normalize('NFC'),saved.code,'The protected source itself is NFC stable: '+id);
 eq(formatted.code.normalize('NFC'),formatted.code,'The formatted source itself is NFC stable: '+id);
 eq(/\{\{(?:safe)?subst\s*:/i.test(saved.code),false,'No active substitution trigger remains: '+id);
 eq(saved.code.includes('~~~'),false,'No active signature trigger remains: '+id);
 const again=saveSafeJavaScript(saved.code);eq(again.code,saved.code,'Literal protection is idempotent: '+id);
 rows.push({id,kind:'semantic-roundtrip',sourceSha256:sha(source),protectedSha256:sha(saved.code),formattedSha256:sha(formatted.code),protectedLiterals:saved.protectedLiterals});
}
async function main(){
 const specimens=[
  ['combining-latin','cafe\u0301'],['combining-greek','\u03b1\u0313\u0301'],['hangul-jamo','\u1100\u1161\u11a8'],
  ['astral-combining','A'+String.fromCodePoint(0x1d165)+'B'],['emoji-astral','A'+String.fromCodePoint(0x1f680)+'B'],
  ['substitution-literal','{{subst:EXEMPLO}}'],['safe-substitution-literal','{{safesubst:EXEMPLO}}'],['signature-literal','a~~~~b'],
  ['escaped-text','\\u0301 \\` \\${value} \\n'],['template-markers','` ${notAnExpression} {{texto}}'],
  ['line-terminators','a\r\nb\n\tc\u2028d\u2029e'],['control-codes','a\0b\u0001c'],['lone-surrogates','a\ud800b\udc00c']
 ];
 for(const[id,text]of specimens){
  await positive(id+'-string','(()=>{const data='+JSON.stringify(text)+';return data})()');
  const raw=text.replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$/g,'\\$');
  await positive(id+'-template','(()=>{const data=`'+raw+'`;return data})()');
 }
 const templateSources=[
  ['interpolated','(()=>{const n=7;return `cafe\u0301 ${n} {{subst:EXEMPLO}}`})()'],
  ['nested','(()=>{const n=7;return `x${`cafe\u0301 ${n}`}y`})()'],
  ['backtick-interpolation','(()=>{const n=7;return `a\\`b\\${literal} ${n} \\` {{texto}}`})()'],
  ['raw-escape-stable','String.raw`\\n\\t\\u0301`'],
  ['tag-value-interpolation','((tag)=>tag`safe ${"{{subst:EXEMPLO}}"}`)((parts,...args)=>parts.raw[0]+args[0]+parts.raw[1])'],
  ['string-property','(()=>{const data={"cafe\u0301":"{{subst:EXEMPLO}}"};return JSON.stringify(data)})()'],
  ['escaped-unicode-template','(()=>{return `cafe\\u0301`})()']
 ];
 for(const[id,source]of templateSources)await positive(id,source);
 const refused=[
  ['tagged-combining','String.raw`cafe\u0301`'],['tagged-substitution','String.raw`{{subst:EXEMPLO}}`'],
  ['tagged-signature','String.raw`~~~~`'],['tagged-astral-combining','String.raw`A'+String.fromCodePoint(0x1d165)+'B`'],
  ['tagged-hangul','String.raw`\u1100\u1161`'],['unprotected-directive','"{{subst:EXEMPLO}}";'],
  ['nfc-identifier','const cafe\u0301=1;cafe\u0301;'],['raw-pattern-trigger','/{{subst:EXEMPLO}}/.source;']
 ];
 for(const[id,source]of refused){let threw=false;try{saveSafeJavaScript(source);}catch{threw=true;}eq(threw,true,'An unproved raw or lexical normalization is rejected: '+id);rows.push({id,kind:'closed-refusal-control',sourceSha256:sha(source)});}
 const report={version:'2.21.5',suite:'independent-save-safe-literal-roundtrips',compilerSha256:sha(fs.readFileSync(compiler)),testSha256:sha(fs.readFileSync(__filename)),checks,positiveCases:specimens.length*2+templateSources.length,negativeCases:refused.length,failures,rows,networkRequests:0,wikipediaWrites:0};
 if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));assert.equal(failures.length,0,'Every admitted source preserves its values and every unproved raw spelling is rejected');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
