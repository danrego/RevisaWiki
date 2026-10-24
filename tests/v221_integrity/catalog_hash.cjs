'use strict';
// The build must use the loader's JavaScript ordering and JSON spelling.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-catalog-hash-'));
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
const cases=[{},[],{ascii:{b:2,a:1}},{'\uff21':'BMP','\u{10000}':'supplementary','\ue000':'private'},[{nested:{'\uffff':1,'\u{1f600}':2}},'same  text'],{values:[1e308,1e-7,0,true,null,'ação Café científico']},{quote:'" backslash \\ and line\n same',key:'\u2028\u2029'}];
const python="import importlib.util,json,pathlib,sys; p=pathlib.Path(sys.argv[1]); s=importlib.util.spec_from_file_location('catalog_hash_builder',p); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); value=json.loads(pathlib.Path(sys.argv[2]).read_text()); h,proof=m.runtime_catalog_hash(value,sys.argv[3],pathlib.Path(sys.argv[4]),pathlib.Path(sys.argv[5]).read_text()); print(json.dumps(proof))";
let checks=0;
try{
 for(const [i,value]of cases.entries()){
  const dir=path.join(temporary,String(i));fs.mkdirSync(dir);const input=path.join(dir,'input.json');fs.writeFileSync(input,JSON.stringify(value));
  const r=cp.spawnSync('python3',['-c',python,path.join(root,'scripts/build_v2210.py'),input,process.execPath,dir,path.join(root,'dist/2.20.0/RevisaWiki_v2_20_0.js')],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);checks++;
  const proof=JSON.parse(r.stdout),raw=canonical(value);assert.equal(proof.sha256,crypto.createHash('sha256').update(raw).digest('hex'));checks++;assert.equal(proof.bytes,Buffer.byteLength(raw));checks++;
  assert.match(proof.canonicalFunctionSha256,/^[a-f0-9]{64}$/);checks++;
  assert.equal(fs.readFileSync(input,'utf8'),JSON.stringify(value));checks++;
 }
 assert.equal(Object.keys(cases[3]).sort()[0],'\u{10000}');checks++;
 console.log(JSON.stringify({status:'passed',cases:cases.length,checks,networkRequests:0,wikipediaWrites:0}));
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
