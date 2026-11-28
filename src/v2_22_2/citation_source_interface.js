// An unapplied repair proposal is not source content. This alternative is
// limited to an unchanged, independently read active citation/ref interface.
// Applied migrations retain the existing complete projected-baseline path.
function v2222CitationSourceInterfaceRead(source,cfg={}){
 const observed=v219NativeReferenceObserver(source),state=v219ReferenceBindingState(source,cfg,false,true),shield=v24SyntaxProtected(source),syntax=v24SyntaxTemplates(observed.view),citations=[],collectors=[],opaque=[],outside=[];
 if(observed.unclosed.length||observed.empties.length||observed.shield.unclosed.length||syntax.unclosed.length||!state.eligible||state.unread||observed.refs.length>256||observed.helpers.length>64)return null;
 const root=(at,refAllowed=false)=>{const c=v219IndexedSyntaxContext(source,at);return !!c&&!c.templates.length&&!c.tables.length&&!c.links.length&&!c.external.length&&c.html.every(t=>refAllowed&&t.name==='ref');};
 const ownership=at=>{const c=v219IndexedSyntaxContext(source,at);return c?[c.html.map(t=>t.raw),c.tables.length,c.links.length,c.external.length,c.templates.map(t=>t.size)]:null;};
 const refs=[];for(const r of observed.refs){if(!r.valid||!r.renderer?.valid||r.container||!root(r.start))return null;refs.push([source.slice(r.start,r.end),r.attrs,r.group,r.renderer.valid,r.renderer.group]);}
 const helpers=[];for(const h of observed.helpers){if(!root(h.start))return null;helpers.push([h.raw,h.helperKind,h.eligible,h.nativeOldid,h.nativeGroup??null,h.attributeScope??false]);}
 for(const range of rendererRanges(observed.view)){if(!root(range.start))return null;collectors.push([source.slice(range.start,range.end),observed.refs.filter(r=>r.end<=range.start).length]);}
 for(const n of syntax.nodes){if(n.size&&n.size!==2)continue;const raw=source.slice(n.start,n.end),key=v281CitationObligation(raw,cfg);if(key===null)continue;if(!root(n.start,true))return null;const owners=observed.refs.map((r,i)=>({r,i})).filter(({r})=>r.start<n.start&&n.end<r.end);if(owners.length>1)return null;citations.push([raw,owners.length?owners[0].i:null]);if(!owners.length)outside.push(n);}
 if(!citations.length)return null;const sites=v222ReferenceBindingSites(source,{refs:observed.refs,helpers:[...observed.helpers,...outside].sort((a,b)=>a.start-b.start)});if(!sites)return null;
 const owners=[...observed.refs,...observed.helpers,...rendererRanges(observed.view)];
 for(const n of syntax.nodes.filter(n=>n.depth===0)){if(owners.some(o=>o.start<=n.start&&n.end<=o.end))continue;const raw=source.slice(n.start,n.end);if(v281CitationObligation(raw,cfg)!==null)continue;const p=v222Fields(raw),native=p&&INFOBOX_CATALOG[parsedTemplate(raw).name];
  // A known native infobox may change only field padding in this path. Its
  // complete ordered field values, including opaque children, remain literal.
  if(native&&p.parts.length===p.fields.length+1&&!/<\s*ref\b/i.test(raw))opaque.push(['native-infobox-padding',native.oldid,p.header.trim(),p.fields.map(f=>[f.key,f.value.trim()?f.value:'']),ownership(n.start)]);else opaque.push(['opaque-producer',raw,ownership(n.start)]);
 }
 const protectedBytes=shield.ranges.map(r=>[r.kind,source.slice(r.start,r.end),ownership(r.start)]);
 return {citations,refs,helpers,collectors,opaque,protectedBytes,sites,calls:state.calls,definitions:state.definitions,topology:state.topology,opaqueRefs:state.opaqueRefs,opaqueCollectors:state.opaqueCollectors};
}
function v2222CitationSourceInterfaceProof(before,after,options={}){
 try{
  if(typeof before!=='string'||typeof after!=='string'||before===after||before.length>524288||after.length>524288)return false;
  const cfg=pageContextOptions({...DEFAULTS,...options});if(cfg.namespaceNumber!==0||cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.model&&cfg.model!=='wikitext'||cfg.sectionOnly||cfg.discussionPage||cfg.section!==undefined&&cfg.section!==null&&cfg.section!=='')return false;
  const a=v2222CitationSourceInterfaceRead(before,cfg),b=v2222CitationSourceInterfaceRead(after,cfg);if(!a||!b||JSON.stringify(a)!==JSON.stringify(b))return false;
  return v281CitationRetention(before,after,cfg).accepted&&v219NamedReferenceRetention(before,after,cfg).accepted&&v219CitationLanguageRetention(before,after,cfg).accepted&&!v2215NativeCitationReadAudit(before,after,cfg).length&&!v2215NamedDefinitionConsistencyAudit(before,after,cfg).length&&!v2214LiteralValueAudit(before,after,cfg).length&&!v2214ReferenceActivationAudit(before,after,cfg).length;
 }catch{return false;}
}
function v2222CitationOriginalAuditFrame(before,after,options={}){
 const context=V222_ORIGINAL_AUDIT_STACK[V222_ORIGINAL_AUDIT_STACK.length-1];
 if(!context||context.busy||!context.inputs.has(before)||after!==context.projectedAfter||v222AuditPolicyKey(options)!==context.policyKey)return null;
 try{
  if(v222AuditOptionsSnapshot(context.originalOptions).key!==context.optionsKey)return null;
  if(context.unchangedCitationSourceProof===undefined){context.busy=true;try{context.unchangedCitationSourceProof=v2222CitationSourceInterfaceProof(context.before,context.after,context.options);}finally{context.busy=false;}}
  return context.unchangedCitationSourceProof?context:null;
 }catch{return null;}
}
