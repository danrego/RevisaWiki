'use strict';
// Only release labels and executable addresses are retargeted in memory.
// Historical fixtures and behavioral assertions remain unchanged on disk.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Module=require('node:module');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const selected=process.argv[2],allowed=['reader_test','reader_native','reader_independent','template_test','style_test','identity_boundary','previous_release'];
assert(allowed.includes(selected),'Choose a recorded preceding suite');
const versions=[['expected_release_v2150.json','expected_release_v2151.json'],['v2_15_0','v2_15_1'],['2.15.0','2.15.1']],records=[];
const load=Module._extensions['.cjs']||Module._extensions['.js'];
Module._extensions['.cjs']=function(module,filename){
 if(filename.startsWith(path.join(root,'tests/v2150')+path.sep)&&!filename.includes(path.sep+'inherited'+path.sep)&&!filename.includes(path.sep+'native_browser'+path.sep)){
  const original=fs.readFileSync(filename),compiled=versions.reduce((text,[before,after])=>text.replaceAll(before,after),original.toString());
  records.push({file:path.relative(root,filename),sourceSha256:sha(original),compiledSha256:sha(compiled),substitutions:versions});
  module._compile(compiled,filename);return;
 }
 return load(module,filename);
};
const extra=process.argv.slice(3);process.argv=[process.execPath,path.join(root,'tests/v2150',selected+'.cjs'),...extra];
process.env.REVISAWIKI_SCRIPT ||= path.join(root,'dist/2.15.1/RevisaWiki_v2_15_1.js');
require(path.join(root,'tests/v2150',selected+'.cjs'));
const out=path.resolve(root,process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2151/previous');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'adaptation-'+selected+(extra.length?'-'+extra.join('-'):'')+'.json'),JSON.stringify({version:'2.15.1',status:'passed',method:'release-address-and-label-retargeting-only',records,behavioralAssertionWaivers:[],wikipediaWrites:0,networkRequests:0},null,2)+'\n');
