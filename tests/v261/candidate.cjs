'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'tests/expected_release_v261.json'),'utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function verify(baseline=false){
 const version=baseline?manifest.baseVersion:manifest.version,entries=baseline?manifest.baseFiles:manifest.files,dist=path.join(root,'dist',version);
 assert.equal(manifest.version,'2.6.1','Expected candidate release');
 for(const [name,expected] of Object.entries(entries)){
  const bytes=fs.readFileSync(path.join(dist,name));
  assert.equal(bytes.length,expected.bytes,name+' exact byte count');
  assert.equal(sha(bytes),expected.sha256,name+' exact pinned SHA-256');
 }
 return {version,dist,files:entries};
}
function bundleFiles(baseline=false){const verified=verify(baseline),stem=baseline?'v2_6':'v2_6_1';return [path.join(verified.dist,'RevisaWiki_'+stem+'.js'),path.join(verified.dist,'RevisaWiki_'+stem+'_completo.js')];}
function load(name){
 const verified=verify(),names={'RevisaWiki_v2_6.js':'RevisaWiki_v2_6_1.js','RevisaWiki_v2_6_completo.js':'RevisaWiki_v2_6_1_completo.js'},actual=names[name]||name;
 assert(Object.hasOwn(verified.files,actual),'Only manifest-approved programs may be loaded');
 const api=require(path.join(verified.dist,actual));assert.equal(api.version,verified.version,'Exact candidate program version');
 return {api,sha256:verified.files[actual].sha256};
}
function artifactDirectory(){const directory=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v261'));fs.mkdirSync(directory,{recursive:true});return directory;}
function sanitized(value,extra=[]){let text=String(value);for(const prefix of [root,process.cwd(),...extra].sort((a,b)=>b.length-a.length))if(prefix.length>1)text=text.replaceAll(prefix,'<local-path>');return text;}
module.exports={root,manifest,sha,verify,bundleFiles,load,artifactDirectory,sanitized};
