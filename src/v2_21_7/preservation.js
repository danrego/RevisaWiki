// Canonicalize only source-derived, replayable native interface repairs.
// Retained preservation readers still inspect every other value and structure.
const V2217_PROJECTION_CACHE = {map:new Map(),bytes:0};
function v2217ProjectionKey(source,options){
 const parts=[];
 const primitive=value=>value===null?['null']:typeof value==='number'?['number',Object.is(value,-0)?'-0':String(value)]:[typeof value,value];
 for(const key of Object.keys(options).sort()){
  const value=options[key];
  if(value===null||['string','number','boolean','undefined'].includes(typeof value)){parts.push([key,primitive(value)]);continue;}
  if(Array.isArray(value)&&value.length<=512&&value.every(x=>x===null||['string','number','boolean'].includes(typeof x))){parts.push([key,'array',value.map(primitive)]);continue;}
  if(value&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype){const keys=Object.keys(value).sort();if(keys.length<=512&&keys.every(k=>value[k]===null||['string','number','boolean','undefined'].includes(typeof value[k]))){parts.push([key,'object',keys.map(k=>[k,primitive(value[k])])]);continue;}}
  return null;
 }
 return JSON.stringify(parts)+'\u0000'+source;
}
function v2217PreservationProjection(source,options={}){
 if(typeof source!=='string')return source;
 const key=v2217ProjectionKey(source,options),cached=key!==null?V2217_PROJECTION_CACHE.map.get(key):null;
 if(cached){V2217_PROJECTION_CACHE.map.delete(key);V2217_PROJECTION_CACHE.map.set(key,cached);return cached.text;}
 let text=source;
 if(typeof v2217DelimiterProjection==='function')text=v2217DelimiterProjection(text,options);
 if(typeof v2217StructureProjection==='function')text=v2217StructureProjection(text,options);
 if(typeof v2217ReferenceProjection==='function')text=v2217ReferenceProjection(text,options);
 if(typeof v2217InfoboxProjection==='function')text=v2217InfoboxProjection(text,options);
 if(key!==null){const bytes=(key.length+text.length)*2+128;if(bytes<=16777216){V2217_PROJECTION_CACHE.map.set(key,{text,bytes});V2217_PROJECTION_CACHE.bytes+=bytes;while(V2217_PROJECTION_CACHE.map.size>32||V2217_PROJECTION_CACHE.bytes>16777216){const oldest=V2217_PROJECTION_CACHE.map.keys().next().value,row=V2217_PROJECTION_CACHE.map.get(oldest);V2217_PROJECTION_CACHE.map.delete(oldest);V2217_PROJECTION_CACHE.bytes-=row.bytes;}}}
 return text;
}
function preservationAudit(before,after,options={}){
 const anchors=v2217AnchorRawAudit(before,after,options);
 return [...v2217Previous_preservationAudit(v2217PreservationProjection(before,options),v2217PreservationProjection(after,options),options),...anchors];
}
function safeComposition(before,after,options={}){
 const anchors=v2217AnchorRawAudit(before,after,options);
 return v2217Previous_safeComposition(v2217PreservationProjection(before,options),v2217PreservationProjection(after,options),options)||anchors[0]?.message||'';
}
