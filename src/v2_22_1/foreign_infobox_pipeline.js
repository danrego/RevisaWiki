// Catalogue data crosses the worker boundary as JSON, never as prepared handles.
const V2221_INFOBOX_PIPELINE_CACHE = new Map();
const V2221_INFOBOX_DATA_CACHE = {map:new Map(),bytes:0,active:0,waiting:[]};
const V2221_INFOBOX_MANIFEST_PIN = root.RevisaWikiRulesV222?.infoboxManifest?.sha256;
const V2221_INFOBOX_MANIFEST_HEADERS = new Set(Object.keys(root.RevisaWikiRulesV222?.infoboxManifest?.data?.headers||{}));
const V2221_INFOBOX_GOVERNED_HEADERS = new WeakMap();

function v2221InfoboxPipelineCatalog(cfg={}) {
 const json=cfg.v2221InfoboxCatalogJson;
 if(typeof json!=='string'||json.length>1048576)return null;
 if(V2221_INFOBOX_PIPELINE_CACHE.has(json))return V2221_INFOBOX_PIPELINE_CACHE.get(json);
 let catalog;
 try {
  catalog=JSON.parse(json);
  const validated=v2221InfoboxCatalogValidate(catalog);
  if(!validated.valid||validated.recordErrors.length||validated.nativeAliasErrors.length)return null;
  const titles=new Set(validated.records.flatMap(row=>[row.source.title,...row.source.aliases]).map(v2221InfoboxTitle).filter(Boolean));
  catalog=v2221InfoboxRegistryPrepare(catalog);V2221_INFOBOX_GOVERNED_HEADERS.set(catalog,titles);
 } catch {return null;}
 V2221_INFOBOX_PIPELINE_CACHE.set(json,catalog);
 while(V2221_INFOBOX_PIPELINE_CACHE.size>4)V2221_INFOBOX_PIPELINE_CACHE.delete(V2221_INFOBOX_PIPELINE_CACHE.keys().next().value);
 return catalog;
}

function v2221InfoboxPipelineNodes(source,cfg={}) {
 if(!v222Scope(source,cfg)||cfg.infoboxes===false||cfg.multilingual===false||cfg.automaticParameterNames===false)return [];
 if(cfg.namespaceNumber!==0&&!v2215ArticleDraftContext(cfg,source))return [];
 const shield=v222Protected(source),references=v219NativeReferenceObserver(source).refs;
 return v24SyntaxTemplates(shield.view).nodes.filter(node=>node.size===2&&!references.some(ref=>ref.start<=node.start&&node.end<=ref.end))
  .map(node=>({...node,raw:source.slice(node.start,node.end)})).sort((a,b)=>a.start-b.start||b.end-a.end);
}

function v2221InfoboxPipelineHeaders(source,cfg={}) {
 return [...new Set(v2221InfoboxPipelineNodes(source,cfg).map(node=>v2221InfoboxRead(node.raw)?.title).filter(Boolean))];
}
function v2221InfoboxPipelineContext(cfg={},embedded=false) {
 const context={embedded},wiki=v2221InfoboxOwn(cfg,'v2221InfoboxSourceWiki');
 if(wiki!==undefined)context.sourceWiki=wiki;
 return context;
}

function v2221InfoboxGoverned(raw,cfg={}) {
 const parsed=v2221InfoboxRead(raw);if(!parsed)return false;
 const catalog=v2221InfoboxPipelineCatalog(cfg);
 return V2221_INFOBOX_MANIFEST_HEADERS.has(parsed.title)||!!catalog&&!!V2221_INFOBOX_GOVERNED_HEADERS.get(catalog)?.has(parsed.title);
}

function v2221InfoboxPipelinePlan(source,cfg={}) {
 const edits=[],catalog=v2221InfoboxPipelineCatalog(cfg);
 if(!catalog)return v222EditsPlan(source,edits);
 const nodes=v2221InfoboxPipelineNodes(source,cfg),known=V2221_INFOBOX_GOVERNED_HEADERS.get(catalog),view=v222Protected(source).view;
 for(const node of nodes) {
  if(edits.some(edit=>edit.start<=node.start&&node.end<=edit.end))continue;
  const parsed=v2221InfoboxRead(node.raw);if(!parsed||!known?.has(parsed.title))continue;
  const owner=v24SyntaxContext(view,node.start),embedded=nodes.some(parent=>parent!==node&&parent.start<node.start&&node.end<parent.end)||[owner.templates,owner.html,owner.tables,owner.links,owner.external].some(rows=>rows.length>0);
  let result;
  const context=v2221InfoboxPipelineContext(cfg,embedded);
  try {result=v2221InfoboxMigrate(node.raw,catalog,context);}catch{continue;}
  if(result.status!=='converted'||!v2221InfoboxProof(node.raw,result.text,result,catalog,context))continue;
  edits.push({start:node.start,end:node.end,text:result.text,count:result.count,kind:'verified-foreign-infobox',proof:result.proof});
 }
 return v222EditsPlan(source,edits);
}

function v2221InfoboxPipelineProof(before,after,plan,cfg={}) {
 return v222PlanProof(before,after,plan,cfg,v2221InfoboxPipelinePlan);
}

function v2221InfoboxNetworkDeadline(operation,controller,milliseconds=8000) {
 let timer;
 const timeout=new Promise((resolve,reject)=>{timer=root.setTimeout(()=>{controller?.abort();reject(new Error('infobox-catalogue-network-timeout'));},milliseconds);});
 return Promise.race([operation,timeout]).finally(()=>root.clearTimeout(timer));
}

async function v2221InfoboxDigest(text) {
 const digest=await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}

async function v2221InfoboxReadData(task,title,expected) {
 if(typeof title!=='string'||!title||typeof expected!=='string'||!/^[0-9a-f]{64}$/.test(expected))throw new Error('infobox-data-address');
 const key=v2221InfoboxCanonical([title,expected]);
 task.guard();
 const cached=V2221_INFOBOX_DATA_CACHE.map.get(key);
 if(cached){V2221_INFOBOX_DATA_CACHE.map.delete(key);V2221_INFOBOX_DATA_CACHE.map.set(key,cached);return cached.data;}
 const controller=new root.AbortController();
 const pending={abort:()=>controller.abort()};task.preflightRequests||=[];task.preflightRequests.push(pending);
 if(V2221_INFOBOX_DATA_CACHE.active>=2)await new Promise(resolve=>V2221_INFOBOX_DATA_CACHE.waiting.push(resolve));
 else V2221_INFOBOX_DATA_CACHE.active++;
 try {
  task.guard();
  const address='/w/index.php?title='+encodeURIComponent(title)+'&action=raw&ctype=application/json&v='+expected;
  const response=await v2221InfoboxNetworkDeadline(root.fetch(address,{credentials:'omit',signal:controller.signal}),controller);
  if(!response.ok)throw new Error('infobox-data-unavailable');
  const size=response.headers?.get('content-length');if(size&&Number(size)>2097152)throw new Error('infobox-data-size');
  const text=await v2221InfoboxNetworkDeadline(response.text(),controller);
  if(new TextEncoder().encode(text).length>2097152)throw new Error('infobox-data-size');
  const data=JSON.parse(text);
  if(await v2221InfoboxDigest(v2221InfoboxCanonical(data))!==expected)throw new Error('infobox-data-digest');
  task.guard();
  const frozen=v2221InfoboxFreeze(data),bytes=text.length*2;
  if(bytes<=8388608){const prior=V2221_INFOBOX_DATA_CACHE.map.get(key);if(prior)V2221_INFOBOX_DATA_CACHE.bytes-=prior.bytes;V2221_INFOBOX_DATA_CACHE.map.set(key,{data:frozen,bytes});V2221_INFOBOX_DATA_CACHE.bytes+=bytes;
   while(V2221_INFOBOX_DATA_CACHE.bytes>8388608||V2221_INFOBOX_DATA_CACHE.map.size>16){const first=V2221_INFOBOX_DATA_CACHE.map.keys().next().value,entry=V2221_INFOBOX_DATA_CACHE.map.get(first);V2221_INFOBOX_DATA_CACHE.map.delete(first);V2221_INFOBOX_DATA_CACHE.bytes-=entry.bytes;}}
  return frozen;
 } finally {task.preflightRequests=task.preflightRequests.filter(item=>item!==pending);const next=V2221_INFOBOX_DATA_CACHE.waiting.shift();if(next)next();else V2221_INFOBOX_DATA_CACHE.active--;}
}

async function v2221PrepareInfoboxEvidence(task,options={}) {
 const cfg={...options};delete cfg.v2221InfoboxCatalogJson;
 const headers=v2221InfoboxPipelineHeaders(task.source,cfg);
 if(!headers.length)return cfg;
 const index=root.RevisaWikiRulesV222?.infoboxManifest;
 if(!index||typeof V2221_INFOBOX_MANIFEST_PIN!=='string'||typeof root.fetch!=='function'||!root.crypto?.subtle||typeof root.AbortController!=='function')return cfg;
 const config=root.RevisaWikiConfig||{},base=(config.dataPage||'Usuário:Daniel G Rego/RevisaWiki/Dados.js').replace(/\/Dados\.js$/,'');
 const adapters={fetchShard:descriptor=>{
  if(!/^[A-Za-z0-9_-]+$/.test(descriptor.id))throw new Error('infobox-shard-id');
  return v2221InfoboxReadData(task,base+'/Infocaixas/'+descriptor.id+'.json',descriptor.sha256);
 },verifySha256:async(text,expected)=>await v2221InfoboxDigest(text)===expected};
 try {
  const result=await v2221InfoboxPreflight(headers,v2221InfoboxOwn(index,'data'),adapters,{expectedManifestSha256:V2221_INFOBOX_MANIFEST_PIN});
  task.guard();
  const json=v2221InfoboxCanonical(result.catalog);
  if(json.length<=1048576)cfg.v2221InfoboxCatalogJson=json;
 } catch {task.guard();}
 return cfg;
}
