'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),manifest=require('./expected_release.json');
for(const [name,proof]of Object.entries(manifest.files)){
 const bytes=fs.readFileSync(path.join(root,'dist/2.2.1',name));
 assert.equal(bytes.length,proof.bytes,name+' byte length');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),proof.sha256,name+' tested bytes');
}
console.log('All five executable files match the tested release.');
