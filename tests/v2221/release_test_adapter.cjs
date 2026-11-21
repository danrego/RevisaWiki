'use strict';
// Reuse behavioral assertions unchanged, replacing only an older release's
// loader and obsolete version guard with a strict current-release loader.
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),file=path.resolve(process.env.REVISAWIKI_CURRENT_CORE),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function runtime(){const api=require(file);assert.equal(api.version,'2.22.1','Exact current runtime');return api;}
const values={root,file,sha,sourceSha:sha(fs.readFileSync(file)),get api(){return runtime();},get cfg(){return {...runtime().defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',sectionOnly:false,autoPreview:false,registryDoiCheck:false};}};
const target=path.join(root,'tests/v2220/harness.cjs');
require.cache[target]={id:target,filename:target,loaded:true,exports:values};
const inference=path.join(root,'tests/v2220/inference_harness.cjs');
require.cache[inference]={id:inference,filename:inference,loaded:true,exports:{load(){const api=runtime();assert.equal(typeof api.v222InferencePlan,'function');return {api,catalog:api.v222Catalog().inference,baselinePath:file,testContext:globalThis};}}};
