'use strict';
/* Twelve independent local shards use the same immutable distribution snapshot. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const run=process.argv[2]||'release_001';if(!/^[A-Za-z0-9_-]+$/.test(run))throw new Error('Invalid run');
const root=path.resolve(__dirname,'../..'),folder=path.join(__dirname,run);if(fs.existsSync(folder))throw new Error('Evidence already exists, refusing to overwrite');fs.mkdirSync(folder,{recursive:true});
const src=path.join(root,'dist/2.5.0'),frozen=path.join(folder,'frozen_distribution');fs.mkdirSync(frozen);
const names=['RevisaWiki_v2_5.js','RevisaWiki_v2_5_dados.js','RevisaWiki_v2_5_completo.js'];const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const hashes=names.map(name=>{const raw=fs.readFileSync(path.join(src,name));fs.writeFileSync(path.join(frozen,name),raw);return{name,bytes:raw.length,sha256:sha(raw)};});
for(const file of hashes)if(sha(fs.readFileSync(path.join(src,file.name)))!==file.sha256)throw new Error('Production distribution changed during snapshot');
fs.writeFileSync(path.join(folder,'snapshot.json'),JSON.stringify({run,startedAt:new Date().toISOString(),hashes,shards:12},null,2)+'\n');
console.log(JSON.stringify({run,hashes,shards:12}));
Promise.all(Array.from({length:12},(_,index)=>new Promise(resolve=>{
 const shard=run+'_part'+index,log=fs.openSync(path.join(folder,'part'+index+'.log'),'w');
 const child=cp.spawn(process.execPath,[path.join(__dirname,'run_dual_corpus.cjs'),'--run='+shard,'--frozen-dir='+frozen,'--start='+index,'--stride=12'],{stdio:['ignore',log,log]});
 child.on('error',error=>resolve({index,error:error.message}));child.on('exit',code=>{fs.closeSync(log);console.log(JSON.stringify({shard:index,exitCode:code}));resolve({index,exitCode:code});});
}))).then(results=>{fs.writeFileSync(path.join(folder,'shard_exit_codes.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({run,results}));process.exitCode=results.some(x=>x.exitCode!==0)?1:0;});
