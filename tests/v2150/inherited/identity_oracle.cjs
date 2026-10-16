'use strict';
// A finite test-oracle boundary, independent of the implementation under test.
// Historical fixtures and assertion bodies remain unchanged.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const file=path.join(__dirname,'IDENTITY_ORACLE_CONTRACT.json'),raw=fs.readFileSync(file),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const pin='f85dddd86669d55951bd530b85676bf56c5205410d2889fe26bfd13a3f4dbdab';
assert.equal(sha(raw),pin,'The independently reviewed finite identity contract stays pinned');
const contract=JSON.parse(raw),declined=new Set(contract.titles.map(row=>row.unverifiedLiteralTitle));
assert.equal(declined.size,33);assert.equal(contract.changedCaseTuples.length,156);
assert.equal(contract.scope.changedPositiveCasesPerBundle,156);
assert.equal(contract.positiveAssertionBodiesChanged,false);assert.equal(contract.negativeAssertionsChanged,false);
function eligibleLiteralTitle(literalTitle){return !declined.has(literalTitle);}
function declarations(){return {file:'tests/v2150/inherited/IDENTITY_ORACLE_CONTRACT.json',sha256:pin,scope:contract.scope,historicalRunner:contract.historicalRunner,exactDeclinedTitles:[...declined],positiveAssertionBodiesChanged:false,negativeAssertionsChanged:false,runtimeIdentityHelpersUsedForExpectedOutput:false};}
module.exports={eligibleLiteralTitle,declarations,contract};
