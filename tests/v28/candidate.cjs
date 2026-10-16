'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'tests/expected_release_v280.json'),'utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function verify(){const dist=path.join(root,'dist',manifest.version);assert.equal(manifest.version,'2.8.0');assert.equal(manifest.runtimeVersion,'2.8.0');for(const [name,expected]of Object.entries(manifest.files)){const bytes=fs.readFileSync(path.join(dist,name));assert.equal(bytes.length,expected.bytes,name+' exact byte count');assert.equal(sha(bytes),expected.sha256,name+' exact pinned SHA-256');}return {dist,version:manifest.version,files:manifest.files};}
function bundleFiles(baseline=false){assert.equal(baseline,false,'Historical baseline stays in the original frozen tests');const {dist}=verify();return ['RevisaWiki_v2_8.js','RevisaWiki_v2_8_completo.js'].map(name=>path.join(dist,name));}
function load(name){const {dist}=verify(),mapping={'RevisaWiki_v2_6.js':'RevisaWiki_v2_8.js','RevisaWiki_v2_6_completo.js':'RevisaWiki_v2_8_completo.js','RevisaWiki_v2_7.js':'RevisaWiki_v2_8.js','RevisaWiki_v2_7_completo.js':'RevisaWiki_v2_8_completo.js'},actual=mapping[name]||name;assert(Object.hasOwn(manifest.files,actual));const api=require(path.join(dist,actual));assert.equal(api.version,manifest.runtimeVersion);return {api,sha256:manifest.files[actual].sha256};}
function artifactDirectory(){const directory=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v280'));fs.mkdirSync(directory,{recursive:true});return directory;}
function sanitized(value,extra=[]){let text=String(value);for(const prefix of [root,process.cwd(),...extra].sort((a,b)=>b.length-a.length))if(prefix.length>1)text=text.replaceAll(prefix,'<local-path>');return text;}
module.exports={root,manifest,sha,verify,bundleFiles,load,artifactDirectory,sanitized};
