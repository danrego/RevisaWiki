'use strict';
// Compile the preceding focused suites in memory. Their fixtures and assertions
// remain unchanged; only release addresses and version labels are retargeted.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Module=require('node:module');
const root=path.resolve(__dirname,'../..'),oldDirectory=path.join(root,'tests/v2140');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'tests/expected_release_v2150.json')));
for(const [name,pin]of Object.entries(manifest.files)){const bytes=fs.readFileSync(path.join(root,'dist/2.15.0',name));assert.equal(bytes.length,pin.bytes);assert.equal(sha(bytes),pin.sha256);}
const records=[],load=Module._extensions['.cjs']||Module._extensions['.js'];
Module._extensions['.cjs']=function(module,filename){
 if(filename.startsWith(oldDirectory+path.sep)&&!filename.includes(path.sep+'inherited'+path.sep)&&!filename.includes(path.sep+'native_browser'+path.sep)){
  const original=fs.readFileSync(filename),text=original.toString().replaceAll('expected_release_v2140.json','expected_release_v2150.json').replaceAll('v2_14_0','v2_15_0').replaceAll('2.14.0','2.15.0');
  records.push({file:path.relative(root,filename),sourceSha256:sha(original),compiledSha256:sha(text)});module._compile(text,filename);return;
 }return load(module,filename);
};
const allowed=['quote_alignment','prose_spacing','quote_native','spacing_native','nsrw_native_test','nsrw_test','drug_fields','drug_import_fields','drug_composition_case','drug_native_test','ui_report','spacing_independent'];
const selected=process.argv[2];assert(allowed.includes(selected),'Choose one explicit preceding focused suite');
process.argv=[process.execPath,path.join(oldDirectory,selected+'.cjs')];
process.env.REVISAWIKI_SCRIPT ||= path.join(root,'dist/2.15.0/RevisaWiki_v2_15_0.js');
require(path.join(oldDirectory,selected+'.cjs'));
const output=path.resolve(root,process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2150/previous-focused');fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'adaptation-'+selected+'.json'),JSON.stringify({version:'2.15.0',status:'passed',method:'version-and-runtime-address-retargeting-only',records,behavioralAssertionWaivers:[],wikipediaWrites:0},null,2)+'\n');
