'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),{extract,literal}=require('../../scripts/v2212_literals.cjs'),manifest=JSON.parse(fs.readFileSync(path.join(root,'tests/expected_release_v2212.json'))),sha=x=>crypto.createHash('sha256').update(x).digest('hex');let checks=0;
const names=['structure.js','citations.js','portals.js','opaque_citation_alias.js','integration.js'],source=names.map(n=>fs.readFileSync(path.join(root,'src/v2_21_2',n),'utf8')).join('\n'),output=extract(source),expected=JSON.parse(fs.readFileSync(path.join(root,'tests/expected_v2212_literals.json')));
assert.deepEqual(output.data,expected);checks++;
const data=require('../../dist/2.21.2/RevisaWiki_v2_21_2_dados.js'),before=require('../../dist/2.21.1-installation.1/RevisaWiki_v2_21_1_dados.js');
assert.deepEqual(data.packed.support2212,expected);checks++;const packed={...data.packed};delete packed.support2212;assert.deepEqual(packed,before.packed);checks++;
for(const value of ['1e999','9007199254740992','get item(){return 1}','...other','[other]:1','item:call()','item:1,item:2','__proto__:1']){
 const field=value.includes(':')||/^(?:get|\.\.\.)/.test(value)?value:'item:'+value;
 const mutation=source.replace(/const V2212_CITATION_CONTRACT=Object\.freeze\(\{[\s\S]*?\}\);/,'const V2212_CITATION_CONTRACT=Object.freeze({'+field+'});');
 assert.notEqual(mutation,source);assert.throws(()=>extract(mutation));checks+=2;
}
for(const[name,expectedPin]of Object.entries(manifest.files)){
 const raw=fs.readFileSync(path.join(root,'dist/2.21.2',name));assert.deepEqual({bytes:raw.length,sha256:sha(raw)},expectedPin);checks++;
 if(!name.endsWith('_completo.js')){assert(raw.length<2097152);checks++;}
}
for(const name of ['Chamada_fixa_RevisaWiki_common.js','Chamada_fixa_RevisaWiki_copia_propria.js']){
 assert.deepEqual(fs.readFileSync(path.join(root,'dist/2.21.2',name)),fs.readFileSync(path.join(root,'dist/2.21.1-installation.1',name)));checks++;
}
console.log(JSON.stringify({status:'passed',version:'2.21.2',checks,buildMapValuesEqual:true,baselineCatalogueUnchanged:true,sourceEvaluation:false,wikipediaWrites:0}));
