// UrlStatus is already a native CS1 role. Preserve its exact valid field
// while the retained producer checks every other archive/access operation.
function v221CitationArchiveAccessEdits(raw,context,cfg,add,rename,value){
 const native=(context?.fields||[]).filter(field=>field.key==='url-status'&&
  typeof field.value==='string'&&/^(?:live|dead)$/.test(field.value.trim()));
 if(!native.length)return v2217Previous_v221CitationArchiveAccessEdits(raw,context,cfg,add,rename,value);
 const consumer=typeof context.title==='string'&&v218CitationNativeContext('{{'+context.title+'}}');
 if(!consumer||!nativeCitationAccepts(consumer.native,'url-status'))return v2217Previous_v221CitationArchiveAccessEdits(raw,context,cfg,add,rename,value);
 const protectedFields=new Set(native),retained=(field,rule)=>
  rule==='v221CitationURLState'&&protectedFields.has(field);
 return v2217Previous_v221CitationArchiveAccessEdits(raw,context,cfg,add,
  (field,target,rule)=>{if(!retained(field,rule))rename(field,target,rule);},
  (field,text,rule)=>{if(!retained(field,rule))value(field,text,rule);});
}
