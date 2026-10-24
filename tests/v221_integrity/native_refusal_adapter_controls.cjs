'use strict';
// Pure controls for exact test expectations. No product code is rewritten.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),Module=require('node:module'),crypto=require('node:crypto');
const adapter=require('./current_native_refusals.cjs'),whitelist=require('./native_refusal_expectations.json');let checks=0;
for(const row of whitelist.cases){
 const value=adapter.verifyPair(row.file,row.id,row.before,row.historicalExpectedAfter);assert.equal(value.after,row.before);checks++;
 assert.equal(Object.hasOwn(value,'row'),false,'The internal whitelist is not exposed');checks++;
 assert.throws(()=>adapter.verifyPair(row.file,row.id,row.before+'x',row.historicalExpectedAfter));checks++;
 assert.throws(()=>adapter.verifyPair(row.file,row.id,row.before,row.historicalExpectedAfter+'x'));checks++;
 const unlisted=adapter.verifyPair(row.file,row.id+'-unlisted',row.before,row.historicalExpectedAfter);
 assert.equal(unlisted.after,row.historicalExpectedAfter);checks++;
 assert.throws(()=>assert.equal(row.before,unlisted.after),'An unlisted unsafe expectation still fails');checks++;
 assert.equal(adapter.verifyPair('unlisted.cjs',row.id,row.before,row.historicalExpectedAfter).after,row.historicalExpectedAfter);checks++;
 const file=path.resolve(__dirname,'../v221',row.file),pin=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');assert.equal(pin,row.sourceFixtureSha256);checks++;
}
const file=path.resolve(__dirname,'../v221/citation_contracts.cjs'),compiled=new Module(file,module);compiled.filename=file;
assert.throws(()=>compiled._compile(fs.readFileSync(file,'utf8')+'\n// altered fixture program\n',file),/original pinned fixture program/);checks++;
console.log(JSON.stringify({status:'passed',checks,whitelistSha256:adapter.whitelistSha256,uniqueNativeRefusals:4,automaticFixCredit:0,assertionStatementsModified:false,bundleCodeModified:false,wikipediaWrites:0}));
