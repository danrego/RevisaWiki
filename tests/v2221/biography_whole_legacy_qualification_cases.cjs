'use strict';
// Metadata-only negative controls for the precise qualification selector. These
// do not stand in for the actual native-binding/value execution qualification.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),q=require('./biography_whole_legacy_qualification.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');let checks=0;const eq=(a,b)=>{assert.equal(a,b);checks++;};
eq(q.rawFailureKind({id:'map-1',error:'map-1 missing v221InfoboxField'}),'field-stage-diagnostic');
for(const error of ['map-2 missing v221InfoboxField','map-1 missing v221SpecializedBirthDate','map-1 missing v221InfoboxField\nTypeError: missing value','map-1 final native value retained','map-1 final whole idempotence','TypeError: cannot read value','external-timeout'])eq(q.rawFailureKind({id:'map-1',error}),null);
eq(q.rawFailureKind({id:'image-ignored-alias-not-component-proof',error:'image-ignored-alias-not-component-proof independently specified post-prerequisite endpoint\n+ actual - expected'}),'reviewed-format-endpoint');
eq(q.rawFailureKind({id:'other-case',error:'other-case independently specified post-prerequisite endpoint'}),null);
eq(q.rawFailureKind({id:'box-immediately-before-lead',error:'box-immediately-before-lead missing v221InfoboxProseBoundary'}),'boundary-stage-diagnostic');
eq(q.rawFailureKind({id:'other-case',error:'other-case missing v221InfoboxProseBoundary'}),null);
eq(q.rawFailureKind({id:'map-143-reference-active-body',error:'map-143-reference-active-body one final native binding\n\n0 !== 1\n'}),'current-native-alt-destination');
eq(q.rawFailureKind({id:'map-142-reference-active-body',error:'map-142-reference-active-body one final native binding\n\n0 !== 1\n'}),null);
eq(q.rawFailureKind({id:'map-143-reference-active-body',error:'map-143-reference-active-body final native value retained'}),null);
eq(sha(fs.readFileSync(require.resolve('../v221/biography_whole_current.cjs'))),q.SUITE_SHA);
eq(sha(fs.readFileSync(require.resolve('../v221/biography_cases.cjs'))),q.FIXTURES_SHA);
eq(q.FORMAT_SOURCE.includes('|image=Example.jpg|imagesize=250px'),true);eq(q.FORMAT_EXPECTED.includes('|imagem                = Example.jpg\n|imagem_tamanho        = 250px\n'),true);
q.executeNativeRealm("assert.deepEqual(actual(),['P563']);",{assert,actual:()=>['P563']},'same-realm-test.cjs');checks++;assert.throws(()=>q.executeNativeRealm("assert.deepEqual(actual(),['P563']);",{assert,actual:()=>['OTHER']},'same-realm-negative.cjs'),/AssertionError/);checks++;
console.log(JSON.stringify({kind:'heavy-biography-exact-qualification-selector-negative-controls',status:'passed',cases:17,checks,articleCalculations:0,scope:'Metadata selector only; full runtime qualification still required',wikipediaWrites:0}));
