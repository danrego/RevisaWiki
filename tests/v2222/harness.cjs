'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
function load(){
 const file=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(root,'dist/2.22.2/RevisaWiki_v2_22_2.js'));
 if(!fs.existsSync(file))throw Error('Build the selected current bundle before whole-action tests');
 const api=require(file);assert.equal(api.version,'2.22.2','The actual selected package must be current');return api;
}
module.exports={load,root};
