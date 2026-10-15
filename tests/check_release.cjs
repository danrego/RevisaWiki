'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),manifest=require('./expected_release.json');
assert.equal(manifest.version,'2.6.0');
for(const [name,proof]of Object.entries(manifest.files)){
 const bytes=fs.readFileSync(path.join(root,'dist',manifest.version,name));
 assert.equal(bytes.length,proof.bytes,name+' byte length');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),proof.sha256,name+' tested bytes');
}
console.log(Object.keys(manifest.files).length+' executable files match the tested '+manifest.version+' release.');
