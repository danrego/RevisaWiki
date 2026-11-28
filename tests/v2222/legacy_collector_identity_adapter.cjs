'use strict';
// Port only three exact runtime-eligibility identities in the immutable
// composite collector qualification. Its fixture/output/mutation tests remain.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const sourceSha256='6ea1ba8313c327bf7f2d9c46c1d21cc03077af7186c679de1a3c2509d60c314e';
function adapt(source){assert.equal(sha(source),sourceSha256,'Immutable composite collector program');const pairs=[
 ["assert.equal(api.version,'2.22.1','The selected runtime must be the current release');","assert.equal(api.version,'2.22.2','The selected runtime must be the current release');"],
 ['"assert.equal(require(runtime).version,\'2.22.1\',\'qualification targets the current release\');"','"assert.equal(require(runtime).version,\'2.22.2\',\'qualification targets the current release\');"'],
 ['"assert.equal(require(runtime).version,\'2.22.1\');"','"assert.equal(require(runtime).version,\'2.22.2\');"']
];let text=source;for(const[before,after]of pairs){assert.equal(text.split(before).length,2,'One exact existing runtime eligibility site');text=text.replace(before,after);}return{text,changes:pairs.map(([before,after])=>({before,after})),originalSha256:sourceSha256,adaptedSha256:sha(text),behavioralAssertionsChanged:false,fixtureSourcesChanged:false,historicalFilesChanged:false,productionFunctionsReplaced:false};}
module.exports={adapt,sourceSha256};
