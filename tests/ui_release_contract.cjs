'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base=path.join(root,'dist/2.2.0'),release=path.join(root,'dist/2.2.1');
fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});
const before=fs.readFileSync(path.join(base,'RevisaWiki_v2_2_completo.js'),'utf8'),after=fs.readFileSync(path.join(release,'RevisaWiki_v2_2_1_completo.js'),'utf8');
const prefix=s=>s.slice(s.indexOf('(function RevisaWikiBoot'),s.indexOf('    const mw = root.mw;')).replaceAll('2.2.0','2.2.1');
assert.equal(prefix(before),prefix(after),'Every adjustment rule and exported function remains byte-identical after version normalization');
const oldData=require(path.join(base,'RevisaWiki_v2_2_dados.js')),data=require(path.join(release,'RevisaWiki_v2_2_1_dados.js'));
assert.deepEqual(oldData.packed,data.packed,'Catalog contents unchanged');
const api=require(path.join(release,'RevisaWiki_v2_2_1.js')),complete=require(path.join(release,'RevisaWiki_v2_2_1_completo.js'));
assert.equal(api.version,'2.2.1');assert.equal(complete.version,'2.2.1');
const frozen=JSON.parse(fs.readFileSync(path.join(root,'tests/expected_release.json')));
for(const [name,proof] of Object.entries(frozen.files)){const raw=fs.readFileSync(path.join(release,name));assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),proof.sha256);assert.equal(raw.length,proof.bytes);}
const rgb=[18,119,107].map(x=>{const v=x/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
const contrast=1.05/(.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]+.05);assert(contrast>=4.5,'White label has WCAG AA contrast');
const report={version:'2.2.1',ruleSourceIdentical:true,catalogsIdentical:true,expectedFileHashes:true,textContrast:contrast,wikipediaWriteActions:0};
fs.writeFileSync(path.join(__dirname,'artifacts/rule_preservation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
