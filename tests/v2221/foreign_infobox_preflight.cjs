'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),files=['foreign_infobox_registry.js','foreign_infobox_preflight.js'],source=files.map(x=>fs.readFileSync(path.join(root,'src/v2_22_1',x),'utf8')).join('\n');
const names=[...source.matchAll(/^(?:async )?function (v2221Infobox\w+)\(/gm)].map(x=>x[1]),api=vm.runInNewContext(source+'\n({'+names.join(',')+'})',{});
const hash=text=>crypto.createHash('sha256').update(text).digest('hex'),digest=value=>hash(api.v2221InfoboxCanonical(value)),copy=value=>JSON.parse(JSON.stringify(value)),pin={revision:1,sha256:'a'.repeat(64)};
let cases=0,checks=0;const groups=[];
function equal(a,b){checks++;assert.deepEqual(copy(a),copy(b));}function ok(a){checks++;assert(a);}async function test(name,fn){await fn();cases++;groups.push(name);}
function record(id,title,wiki='en',target='nome') {return {id,state:'active',source:{wiki,title,aliases:[],...pin},target:{wiki:'pt',title:'Info/Registro',accepted:['nome','texto'],...pin},proof:{kind:'native-contract',defaults:'equivalent',suppressions:'equivalent',aliasPrecedence:'equivalent',dynamic:'absent',embedding:'standalone'},fields:{name:{target,transform:'identity',evidence:{status:'verified',role:'fixture.scalar.'+target,sourceConsumed:true,targetConsumed:true,semantics:'equivalent'}}}};}
function fixture(){
 const data={a:{schema:1,snapshotId:'snapshot',id:'a',records:[record('en:A','Template:Infobox A')]},b:{schema:1,snapshotId:'snapshot',id:'b',records:[record('it:A','Template:Infobox A','it')]},c:{schema:1,snapshotId:'snapshot',id:'c',records:[record('de:C','Vorlage:Infobox C','de')]}};
 const manifest={schema:1,snapshotId:'snapshot',nativeAliases:[{title:'Info/Registro',aliases:[],...pin}],headers:{'Infobox A':['a','b'],'Infobox C':['c']},shards:Object.entries(data).map(([id,value])=>({id,sha256:digest(value)}))};
 const calls=[],verifyCalls=[],adapters={fetchShard:async descriptor=>{calls.push(descriptor.id);return copy(data[descriptor.id]);},verifySha256:async(text,wanted)=>{verifyCalls.push(wanted);return hash(text)===wanted;}};
 return {data,manifest,calls,verifyCalls,adapters};
}
function nativeRepair(id){
 const r=record(id,'Info/Registro','pt');r.mode='native-repair';r.fields.name.evidence.sourceConsumed=false;r.fields.name.foreignEvidence=[{wiki:'en',title:'Template:Infobox A',key:'name',...pin,role:r.fields.name.evidence.role,consumed:true,semantics:'equivalent'}];
 r.fields.nome={target:'nome',transform:'identity',evidence:{status:'verified',role:'fixture.scalar.nome',sourceConsumed:true,targetConsumed:true,semantics:'equivalent'}};
 r.proof.nativeRepair={status:'verified',originIndependent:true,unconsumedKeys:['name'],nativeReader:{status:'verified',coverage:'complete',forwarding:'resolved',lua:'absent',...pin}};return r;
}
async function run(f,headers=['Infobox A'],options={}){return api.v2221InfoboxPreflight(headers,f.manifest,f.adapters,{expectedManifestSha256:digest(f.manifest),...options});}
function unchanged(raw,catalog,context={}){const p=api.v2221InfoboxMigrate(raw,catalog,context);equal(p.text,raw);equal(p.count,0);return p;}
function converted(raw,catalog,wanted){const p=api.v2221InfoboxMigrate(raw,catalog);equal(p.status,'converted');equal(p.text,wanted);ok(api.v2221InfoboxProof(raw,wanted,p,catalog));}
(async()=>{
await test('authenticated header index loads only required unique shards, not six editions blindly',async()=>{
 const f=fixture(),result=await run(f,['template:infobox_A','Infobox A','Info/Registro']);equal(result.status,'ready');equal(f.calls,['a','b']);equal(result.selectedShards,['a','b']);equal(result.catalog.eligibleTitles,['Infobox A','Info/Registro']);converted('{{Infobox A|name=A}}',result.catalog,'{{Info/Registro|nome=A}}');
 unchanged('{{Infobox C|name=C}}',result.catalog);equal(result.blockedTitles,[]);
});
await test('unknown header and empty selection cause no shard requests',async()=>{
 const f=fixture();equal((await run(f,['Unknown'])).selectedShards,[]);equal((await run(f,[])).selectedShards,[]);equal(f.calls,[]);
});
await test('manifest authentication failure precedes every fetch and header use',async()=>{
 const f=fixture(),r=await run(f,['Infobox A'],{expectedManifestSha256:'b'.repeat(64)});equal(r.status,'unavailable');equal(f.calls,[]);equal(r.failures,[{reason:'manifest-digest'}]);unchanged('{{Infobox A|name=A}}',r.catalog);
});
await test('invalid manifests fail closed without network use',async()=>{
 for(const mutate of [m=>m.schema=2,m=>m.shards.push(copy(m.shards[0])),m=>m.headers['Infobox A']=['absent'],m=>m.headers['infobox A']=['a'],m=>m.headers['Infobox A']=['a','a'],m=>m.nativeAliases[0].revision=0,m=>m.shards[0].sha256='bad']){const f=fixture();mutate(f.manifest);equal((await run(f)).status,'unavailable');equal(f.calls,[]);}
 const f=fixture();equal((await api.v2221InfoboxPreflight(['Infobox A'],f.manifest,{},{})).status,'unavailable');
});
await test('missing plausible source preserves its header while another box still migrates',async()=>{
 const f=fixture();f.adapters.fetchShard=async descriptor=>{f.calls.push(descriptor.id);if(descriptor.id==='b')throw Error('offline');return copy(f.data[descriptor.id]);};
 const r=await run(f,['Infobox A','Infobox C']);equal(r.status,'partial');equal(r.blockedTitles,['Infobox A']);equal(unchanged('{{Infobox A|name=A}}',r.catalog).status,'unresolved');
 for(const wiki of ['en','es','fr','de','ca','it'])unchanged('{{Infobox A|name=A}}',r.catalog,{sourceWiki:wiki});
 converted('{{Infobox C|name=C}}',r.catalog,'{{Info/Registro|nome=C}}');equal(r.loadedShards,['a','c']);
});
await test('digest mismatch and malformed source contracts preserve affected calls',async()=>{
 for(const mutation of [f=>f.data.b.records[0].fields.name.target='texto',f=>f.data.b.schema=2,f=>f.data.b.snapshotId='other',f=>f.data.b.id='other',f=>f.data.b.records[0].source.revision=0,f=>f.data.b.records[0].source.aliases=['Missing alias']]){
  const f=fixture();mutation(f);const r=await run(f);equal(r.status,'partial');unchanged('{{Infobox A|name=A}}',r.catalog);equal(r.blockedTitles,['Infobox A']);
 }
 const f=fixture();f.adapters.fetchShard=async descriptor=>descriptor.id==='b'?'not JSON':copy(f.data[descriptor.id]);const r=await run(f);equal(r.failures,[{shardId:'b',reason:'shard-json'}]);
});
await test('authenticated shard aliases must be fully represented by manifest index',async()=>{
 const f=fixture();f.data.a.records[0].source.aliases=['Unindexed'];f.manifest.shards[0].sha256=digest(f.data.a);const r=await run(f);equal(r.status,'partial');equal(r.failures,[{shardId:'a',reason:'shard-index-coverage'}]);
});
await test('memo shares concurrent loads, freezes copied data and excludes rejected fetches',async()=>{
 const f=fixture(),[a,b]=await Promise.all([run(f),run(f)]);equal(f.calls,['a','b']);equal(a.status,'ready');equal(b.status,'ready');equal(b.cachedShards,['a','b']);
 f.data.a.records[0].fields.name.target='texto';const r=await run(f);equal(f.calls,['a','b']);converted('{{Infobox A|name=A}}',r.catalog,'{{Info/Registro|nome=A}}');
 const g=fixture();let fails=true;g.adapters.fetchShard=async descriptor=>{g.calls.push(descriptor.id);if(descriptor.id==='b'&&fails)throw Error('offline');return copy(g.data[descriptor.id]);};
 equal((await run(g)).status,'partial');fails=false;equal((await run(g)).status,'ready');equal(g.calls,['a','b','b']);
});
await test('memo validates the current authenticated header index even on cache hit',async()=>{
 const f=fixture();equal((await run(f)).status,'ready');delete f.manifest.headers['Infobox A'];f.manifest.headers['Infobox Other']=['a'];const r=await run(f,['Infobox Other']);equal(r.status,'partial');equal(r.failures,[{shardId:'a',reason:'shard-index-coverage'}]);equal(f.calls,['a','b']);
});
await test('changed content pins do not reuse older cached records',async()=>{
 const f=fixture();await run(f);for(const id of ['a','b']){f.data[id].records[0].fields.name.target='texto';f.manifest.shards.find(x=>x.id===id).sha256=digest(f.data[id]);}
 const r=await run(f);equal(f.calls,['a','b','a','b']);converted('{{Infobox A|name=A}}',r.catalog,'{{Info/Registro|texto=A}}');
});
await test('memo is bounded and least-recently-used eviction only increases fetches',async()=>{
 const f=fixture();await run(f,['Infobox C'],{maxCacheEntries:1});await run(f,['Infobox A'],{maxCacheEntries:1});await run(f,['Infobox C'],{maxCacheEntries:1});equal(f.calls,['c','a','b','c']);
});
await test('all aliases in a loaded shard remain limited to fully selected headers',async()=>{
 const f=fixture();f.data.a.records[0].source.aliases=['Infobox Alias'];f.data.b.records[0].source.aliases=['Infobox Alias'];f.manifest.headers['Infobox Alias']=['a','b'];for(const d of f.manifest.shards)d.sha256=digest(f.data[d.id]);
 const r=await run(f);converted('{{Infobox A|name=A}}',r.catalog,'{{Info/Registro|nome=A}}');equal(unchanged('{{Infobox Alias|name=A}}',r.catalog).reason,'outside-prefetched-title-scope');
});
await test('conflicting contract IDs block all of their selected source titles',async()=>{
 const f=fixture();f.data.c.records[0].id=f.data.a.records[0].id;f.manifest.shards.find(x=>x.id==='c').sha256=digest(f.data.c);const r=await run(f,['Infobox A','Infobox C']);equal(r.status,'partial');equal(r.blockedTitles,['Infobox A','Infobox C']);unchanged('{{Infobox A|name=A}}',r.catalog);unchanged('{{Infobox C|name=C}}',r.catalog);
});
await test('only JSON data reaches fetch-validation and subset serialization is lossless',async()=>{
 const f=fixture(),r=await run(f);equal(r.status,'ready');equal(api.v2221InfoboxCatalogValidate(r.catalog).recordErrors,[]);const roundtrip=copy(r.catalog);converted('{{Infobox A|name=A\u0301<ref name="Re\u0301f"/>}}',roundtrip,'{{Info/Registro|nome=A\u0301<ref name="Re\u0301f"/>}}');
 let reads=0;const g=fixture(),expected=digest(g.manifest);Object.defineProperty(g.manifest,'bad',{enumerable:true,get(){reads++;return true;}});equal((await api.v2221InfoboxPreflight(['Infobox A'],g.manifest,g.adapters,{expectedManifestSha256:expected})).status,'unavailable');equal(reads,0);
});
await test('native-repair shard consensus is preserved on partial retrieval and native calls remain intact',async()=>{
 const f=fixture();f.data.a.records=[nativeRepair('pt:a')];f.data.b.records=[nativeRepair('pt:b')];f.manifest.headers={'Info/Registro':['a','b'],'Infobox C':['c']};for(const descriptor of f.manifest.shards)descriptor.sha256=digest(f.data[descriptor.id]);
 let r=await run(f,['Info/Registro']);converted('{{Info/Registro|name=A}}',r.catalog,'{{Info/Registro|nome=A}}');equal(unchanged('{{Info/Registro|nome=A}}',r.catalog).status,'already-native');
 const g=fixture();g.data=copy(f.data);g.manifest=copy(f.manifest);g.adapters.fetchShard=async descriptor=>{if(descriptor.id==='b')throw Error('offline');return copy(g.data[descriptor.id]);};
 r=await run(g,['Info/Registro','Infobox C']);equal(r.status,'partial');equal(unchanged('{{Info/Registro|name=A}}',r.catalog).status,'unresolved');equal(unchanged('{{Info/Registro|nome=A}}',r.catalog).status,'already-native');converted('{{Infobox C|name=C}}',r.catalog,'{{Info/Registro|nome=C}}');
});
console.log(JSON.stringify({suite:'foreign-infobox-preflight-v2221',status:'passed',cases,checks,groups},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
