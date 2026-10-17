'use strict';
// Historical source fixtures, assertions and helper identifiers stay unchanged.
// Only release file addresses and version labels are retargeted in memory.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Module=require('node:module');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const focused=['infobox_order_cases','field_syntax_cases','image_alt_cases','biography_lead_cases','retained_count_cases','independent_cases','adversarial_release','safeguard_cases','native_image_cases','image_contract_audit','contract_composition'];
const inherited=['reader_test','reader_native','reader_independent','template_test','style_test','identity_boundary','previous_release'];
const selected=process.argv[2],isFocused=focused.includes(selected);assert(isFocused||inherited.includes(selected),'Choose an explicit preceding suite');
const directory=isFocused?'v2151':'v2150',records=[];
function versionAddresses(version,slug,token){return [
 ['expected_release_'+token+'.json','expected_release_v2160.json'],
 ['dist/'+version,'dist/2.16.0'],
 ['RevisaWiki_'+slug,'RevisaWiki_v2_16_0'],
 ["'"+slug+"'","'v2_16_0'"],
 ["'"+version+"'","'2.16.0'"],
 ['artifacts/'+token+'/','artifacts/v2160/previous-'+token+'/'],
 ["replaceAll('_"+slug+"',","replaceAll('_v2_16_0',"]];}
const load=Module._extensions['.cjs']||Module._extensions['.js'];
Module._extensions['.cjs']=function(module,filename){
 if(['v2151','v2150'].some(name=>filename.startsWith(path.join(root,'tests',name)+path.sep))&&!filename.includes(path.sep+'inherited'+path.sep)&&!filename.includes(path.sep+'native_browser'+path.sep)){
  const versions=filename.startsWith(path.join(root,'tests/v2151')+path.sep)?versionAddresses('2.15.1','v2_15_1','v2151'):versionAddresses('2.15.0','v2_15_0','v2150');
  const original=fs.readFileSync(filename),compiled=versions.reduce((text,[before,after])=>text.replaceAll(before,after),original.toString());
  records.push({file:path.relative(root,filename),sourceSha256:sha(original),compiledSha256:sha(compiled),substitutions:versions.filter(([before])=>original.includes(before))});
  module._compile(compiled,filename);return;
 }
 return load(module,filename);
};
const extra=process.argv.slice(3),filename=path.join(root,'tests',directory,selected+'.cjs');process.argv=[process.execPath,filename,...extra];
process.env.REVISAWIKI_SCRIPT ||=path.join(root,'dist/2.16.0/RevisaWiki_v2_16_0.js');
require(filename);
const out=path.resolve(root,process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2160/previous');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'adaptation-'+selected+(extra.length?'-'+extra.join('-'):'')+'.json'),JSON.stringify({version:'2.16.0',status:process.exitCode?'failed':'passed',method:'release-address-and-label-retargeting-only',records,behavioralAssertionWaivers:[],featureOptionsChanged:[],wikipediaWrites:0,networkRequests:0},null,2)+'\n');
