// Fetching and digest implementations are supplied by the authenticated loader, never by template data.
const V2221_INFOBOX_PREFLIGHT_CACHE = new WeakMap();

function v2221InfoboxManifestValidate(manifest){
 const errors=[],byId=new Map();
 if(!manifest||manifest.schema!==1||typeof manifest.snapshotId!=='string'||!manifest.snapshotId||!Array.isArray(manifest.shards)||!manifest.headers||typeof manifest.headers!=='object'||Array.isArray(manifest.headers)||!Array.isArray(manifest.nativeAliases))return {valid:false,errors:['manifest-envelope'],byId};
 for(const descriptor of manifest.shards){
  if(!descriptor||typeof descriptor.id!=='string'||!descriptor.id||/[\u0000-\u001f\u007f]/.test(descriptor.id)||typeof descriptor.sha256!=='string'||!/^[0-9a-f]{64}$/i.test(descriptor.sha256)){errors.push('shard-descriptor');continue;}
  if(byId.has(descriptor.id))errors.push('duplicate-shard-id');else byId.set(descriptor.id,descriptor);
  if(descriptor.bytes!==undefined&&(!Number.isSafeInteger(descriptor.bytes)||descriptor.bytes<1))errors.push('shard-bytes');
 }
 for(const[title,ids]of Object.entries(manifest.headers)){
  if(v2221InfoboxTitle(title)!==title||!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!byId.has(id)))errors.push('header-index');
 }
 const aliases=v2221InfoboxCatalogValidate({schema:1,snapshotId:manifest.snapshotId,records:[],nativeAliases:manifest.nativeAliases});
 if(!aliases.valid||aliases.nativeAliasErrors.length)errors.push('manifest-native-aliases');
 return {valid:errors.length===0,errors,byId};
}
function v2221InfoboxPreflightShard(value,descriptor,manifest){
 let data;try{data=v2221InfoboxClone(typeof value==='string'?JSON.parse(value):value);}catch{return {valid:false,reason:'shard-json'};}
 if(!data||data.schema!==1||data.snapshotId!==manifest.snapshotId||data.id!==undefined&&data.id!==descriptor.id||!Array.isArray(data.records)||data.nativeAliases!==undefined&&!Array.isArray(data.nativeAliases))return {valid:false,reason:'shard-envelope'};
 const validated=v2221InfoboxCatalogValidate({...data,nativeAliases:data.nativeAliases||[]});
 if(!validated.valid||validated.recordErrors.length||validated.nativeAliasErrors.length)return {valid:false,reason:'shard-contract'};
 for(const row of validated.records)for(const rawTitle of [row.source.title,...row.source.aliases]){
  const title=v2221InfoboxTitle(rawTitle),ids=v2221InfoboxOwn(manifest.headers,title);
  if(!Array.isArray(ids)||!ids.includes(descriptor.id))return {valid:false,reason:'shard-index-coverage'};
 }
 return {valid:true,data,canonical:v2221InfoboxCanonical(data)};
}
async function v2221InfoboxPreflightFetch(descriptor,manifest,adapters,limit){
 let cache=V2221_INFOBOX_PREFLIGHT_CACHE.get(adapters);if(!cache){cache=new Map();V2221_INFOBOX_PREFLIGHT_CACHE.set(adapters,cache);}
 const key=v2221InfoboxCanonical([manifest.snapshotId,descriptor.id,descriptor.sha256]);
 if(cache.has(key)){const promise=cache.get(key);cache.delete(key);cache.set(key,promise);const data=await promise,shard=v2221InfoboxPreflightShard(data,descriptor,manifest);if(!shard.valid)throw Error(shard.reason);return {data,cached:true};}
 const fetch=v2221InfoboxOwn(adapters,'fetchShard'),verify=v2221InfoboxOwn(adapters,'verifySha256');
 const promise=Promise.resolve().then(()=>fetch(v2221InfoboxFreeze(v2221InfoboxClone(descriptor)))).then(async value=>{
  const shard=v2221InfoboxPreflightShard(value,descriptor,manifest);if(!shard.valid)throw Error(shard.reason);
  if(await verify(shard.canonical,descriptor.sha256)!==true)throw Error('shard-digest');
  return v2221InfoboxFreeze(shard.data);
 });
 cache.set(key,promise);while(cache.size>limit)cache.delete(cache.keys().next().value);
 try{return {data:await promise,cached:false};}catch(error){if(cache.get(key)===promise)cache.delete(key);throw error;}
}
async function v2221InfoboxPreflight(headers,input,adapters,options={}){
 const empty={schema:1,snapshotId:'unavailable',nativeAliases:[],records:[],eligibleTitles:[]},base={status:'unavailable',catalog:empty,selectedShards:[],loadedShards:[],cachedShards:[],blockedTitles:[],failures:[]};
 const fetch=v2221InfoboxOwn(adapters,'fetchShard'),verify=v2221InfoboxOwn(adapters,'verifySha256'),expected=v2221InfoboxOwn(options,'expectedManifestSha256');
 if(typeof fetch!=='function'||typeof verify!=='function'||typeof expected!=='string'||!/^[0-9a-f]{64}$/i.test(expected))return {...base,failures:[{reason:'preflight-adapter-contract'}]};
 let manifest;try{manifest=v2221InfoboxClone(input);}catch{return {...base,failures:[{reason:'manifest-json'}]};}
 let authenticated=false;try{authenticated=await verify(v2221InfoboxCanonical(manifest),expected)===true;}catch{}
 if(!authenticated)return {...base,failures:[{reason:'manifest-digest'}]};
 const validated=v2221InfoboxManifestValidate(manifest);if(!validated.valid)return {...base,failures:validated.errors.map(reason=>({reason}))};
 if(!Array.isArray(headers)||headers.some(x=>typeof x!=='string'))return {...base,failures:[{reason:'preflight-headers'}]};
 const titles=[...new Set(headers.map(v2221InfoboxTitle).filter(Boolean))],selected=[...new Set(titles.flatMap(title=>v2221InfoboxOwn(manifest.headers,title)||[]))];
 const maximum=v2221InfoboxOwn(options,'maxCacheEntries'),limit=Number.isSafeInteger(maximum)&&maximum>=1&&maximum<=256?maximum:32;
 const outcomes=await Promise.all(selected.map(async id=>{try{return {id,...await v2221InfoboxPreflightFetch(validated.byId.get(id),manifest,adapters,limit)};}catch(error){return {id,reason:['shard-json','shard-envelope','shard-contract','shard-index-coverage','shard-digest'].includes(error?.message)?error.message:'shard-unavailable'};}}));
 const failed=new Set(outcomes.filter(x=>x.reason).map(x=>x.id)),blockedSet=new Set(titles.filter(title=>(v2221InfoboxOwn(manifest.headers,title)||[]).some(id=>failed.has(id))));
 const rows=[],native=manifest.nativeAliases.slice(),seenIds=new Map(),conflictedIds=new Set();
 for(const result of outcomes)if(result.data){
  native.push(...(result.data.nativeAliases||[]));
  for(const row of result.data.records){const prior=seenIds.get(row.id),canonical=v2221InfoboxCanonical(row);if(prior===canonical)continue;if(prior!==undefined)conflictedIds.add(row.id);seenIds.set(row.id,canonical);rows.push(row);}
 }
 for(const row of rows)if(conflictedIds.has(row.id))for(const rawTitle of [row.source.title,...row.source.aliases]){const title=v2221InfoboxTitle(rawTitle);if(titles.includes(title))blockedSet.add(title);}
 const blocked=[...blockedSet],reserved=new Set(rows.map(x=>x.id));
 // A missing plausible source cannot turn an ambiguous header into a confident migration.
 for(let i=0;i<blocked.length;i++)for(const wiki of [...V2221_INFOBOX_WIKIS,'pt']){let id='preflight-unavailable:'+i+':'+wiki;while(reserved.has(id))id+=':';reserved.add(id);rows.push({id,state:'unresolved',...(wiki==='pt'?{mode:'native-repair'}:{}),source:{wiki,title:blocked[i],aliases:[]},discovery:{kind:'unavailable-authenticated-shard'}});}
 const catalog={schema:1,snapshotId:manifest.snapshotId,nativeAliases:native,records:rows,eligibleTitles:titles};
 return {status:failed.size||conflictedIds.size?'partial':'ready',catalog,selectedShards:selected,loadedShards:outcomes.filter(x=>x.data).map(x=>x.id),cachedShards:outcomes.filter(x=>x.cached).map(x=>x.id),blockedTitles:blocked,failures:[...outcomes.filter(x=>x.reason).map(x=>({shardId:x.id,reason:x.reason})),...Array.from(conflictedIds,id=>({recordId:id,reason:'conflicting-record-id'}))]};
}
