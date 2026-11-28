// This alternative certifies one explicit imported archive-state transition.
// All other declared metadata, including the access day, remains obligatory.
// The imported state belongs to a complete consumed citation, never to a
// citation-shaped program inside another citation's opaque parameter value.
// Producer and certificate collection use this same literal owner boundary.
function v2222CitationOwnerScope(source,cfg={}){
 const context=v2222CitationOwnerContext(source),calls=[],eligible=[];let banks;
 for(const node of context.nodes){if(node.size&&node.size!==2)continue;const raw=source.slice(node.start,node.end),native=v2222CitationContext(raw),reader=native&&v2215CitationReader(native);if(!reader)continue;calls.push({node,raw,native,reader});
  let call=v2217ReferenceLiteralCall(source,node,context);
  if(!call&&/<references\b/i.test(source)){if(banks===undefined)banks=v2221CitationLiteralBankContext(source);call=v2221CitationLiteralBankCall(source,node,context,banks);}
  if(call)eligible.push({node,raw});
 }
 return{calls,eligible};
}
function v2222CitationStateOwners(source,cfg={}){return v2222CitationOwnerScope(source,cfg).eligible;}
function v2222CitationOpaqueField(field,native,reader){const roles=v222CitationRoles(field.key,reader);return !roles.length||!v222CitationTargetAccepted(native,field.key,reader)||/[{}]/.test(field.value)&&roles.some(r=>['Ref','Mode','DeadURL','UrlStatus'].includes(r));}
function v2222CitationOpaqueTree(raw,transform){
 const p=v222Fields(raw),context=p&&v2222CitationContext(raw),reader=context&&v2215CitationReader(context);if(!p||!reader)return null;
 const opaque=p.fields.filter(f=>/[{}]/.test(f.value)&&v2222CitationOpaqueField(f,context,reader));if(!opaque.length)return null;
 let inner='',cursor=2;for(const f of opaque){if(f.valueStart<cursor)return null;inner+=mapTemplateTree(raw.slice(cursor,f.valueStart),transform)+raw.slice(f.valueStart,f.end);cursor=f.end;}return inner+mapTemplateTree(raw.slice(cursor,-2),transform);
}
function v2222CitationOwnerEdits(source,edits,cfg={}){
 if(!edits.length)return edits;const scope=v2222CitationOwnerScope(source,cfg),eligible=new Set(scope.eligible.map(x=>x.node.start+':'+x.node.end)),opaque=[];
 for(const call of scope.calls){const p=v222Fields(call.raw);if(!p)continue;for(const f of p.fields)if(v2222CitationOpaqueField(f,call.native,call.reader))opaque.push({start:call.node.start+f.valueStart,end:call.node.start+f.end});}
 const coupled=v2222CitationCoupledStateEdits(source,scope,edits);return edits.filter(e=>{
  if(['citation-dead-key','citation-dead-state'].includes(e.kind)&&!coupled.has(e))return false;
  if(opaque.some(r=>r.start<=e.start&&e.end<=r.end)&&!coupled.has(e))return false;
  const owners=scope.calls.filter(x=>x.node.start<=e.start&&e.end<=x.node.end).sort((a,b)=>(a.node.end-a.node.start)-(b.node.end-b.node.start));
  return !owners.length||eligible.has(owners[0].node.start+':'+owners[0].node.end);
 });
}
// This reader proves only finite parameter aliases and literal value forms.
// It never repairs the candidate or excuses a changed unknown parameter.
function v2222CitationActualFieldsEquivalent(before,after,cfg={}){
 const a=v222Fields(before),b=v222Fields(after),ca=a&&v2222CitationContext(before),cb=b&&v2222CitationContext(after),ra=ca&&v2215CitationReader(ca),rb=cb&&v2215CitationReader(cb);if(!a||!b||!ra||!rb||ra.module!==rb.module||ra.oldid!==rb.oldid||a.parts.length!==a.fields.length+1||b.parts.length!==b.fields.length+1)return false;
 const read=(p,r)=>{const groups=new Map();for(const f of p.fields){const roles=v222CitationRoles(f.key,r),key=roles.length?'role:'+JSON.stringify(roles):'opaque:'+f.key;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({f,roles});}return groups;},old=read(a,ra),fresh=read(b,rb),date=value=>{const normalized=normalizeDate(value.trim(),()=>{}),d=v218CitationDateValue(normalized,'date')||v219SupplementalCitationDateValue(normalized,'date');return d?JSON.stringify([d.precision,d.identity]):null;};
 for(const[key,xs]of old){const ys=fresh.get(key);if(!ys){if(key.startsWith('opaque:')&&cfg.automaticEmptyParameters!==false&&xs.every(x=>!x.f.value.trim()&&!v222CitationTargetAccepted(ca,x.f.key,ra)))continue;return false;}if(xs.length!==ys.length)return false;
  for(let i=0;i<xs.length;i++){const {f,roles}=xs[i],g=ys[i].f;if(key.startsWith('opaque:')){if(f.key!==g.key||f.value!==g.value)return false;continue;}if(xs.length>1&&f.key!==g.key)return false;const u=f.value.trim(),v=g.value.trim();if(u===v)continue;if(roles.some(r=>['Date','AccessDate','ArchiveDate','OrigYear','DeadURL'].includes(r))&&date(u)&&date(u)===date(v))continue;if(roles.includes('Language')){const x=v2221CitationLanguageList(u),y=v2221CitationLanguageList(v);if(x&&y&&JSON.stringify(x)===JSON.stringify(y))continue;}const value=v2222CitationValue(f,roles,a.fields,ra);if(value!==null&&value.trim()===v)continue;return false;
  }
 }
 return [...fresh.keys()].every(key=>old.has(key));
}
function v2222CitationStateAdmission(raw,cfg={}){
 const p=v222Fields(raw),context=p&&v2222CitationContext(raw),reader=context&&v2215CitationReader(context),original=p&&v281CitationObligation(raw,cfg),binding=p&&v2221CitationTypedAnchorBinding(raw);if(!p||!reader||original===null||binding===null||p.parts.length!==p.fields.length+1||!v2222CitationStateOwners(raw,cfg).some(x=>x.node.start===0&&x.node.end===raw.length))return null;
 return{p,reader,original,binding};
}
function v2222CitationStateRetentionWitness(raw,cfg={}){
 const admission=v2222CitationStateAdmission(raw,cfg);if(!admission)return null;const {p,reader,original,binding}=admission;
 const dates=p.fields.filter(f=>v222CitationRoles(f.key,reader).includes('ArchiveDate'));if(dates.length!==1)return null;let source=raw;const date=dates[0],literal=date.value.trim();
 if(!v2222CitationDateIdentity(literal)){
  // Use only the existing unambiguous date normalization. An ambiguous
  // numeric spelling stays untouched, so it cannot gain a state proposal.
  const value=normalizeDate(literal,()=>{});if(value===literal||!v2222CitationDateIdentity(value))return null;source=raw.slice(0,date.valueStart)+date.value.replace(literal,value)+raw.slice(date.end);if(v281CitationObligation(source,cfg)!==original)return null;
 }
 const plan=v2222CitationStatePlan(source,cfg);if(plan.edits.length!==1||plan.text===source||!v2222CitationStateProof(source,plan.text,plan,cfg))return null;const expected=v281CitationObligation(plan.text,cfg),nextBinding=v2221CitationTypedAnchorBinding(plan.text);if(expected===null||binding!==nextBinding)return null;
 return{source:plan.text,original,expected,binding,module:reader.module,revision:reader.oldid,proof:plan.edits[0].proof};
}
function v2222CitationStateRetentionContext(before,after,cfg={}){
 const empty={source:before,alternatives:new Set(),proofs:[]};if(!v2222CitationScope(before,cfg)||cfg.citations===false||cfg.automaticParameterNames===false||!/(?:url-status|url-estado|statusurl|urlmorto|dead-url|deadurl)[ \t\r\n]*=/.test(before))return empty;
 const actual=[];for(const {node,raw} of v2222CitationStateOwners(after,cfg)){const context=v2222CitationContext(raw),reader=context&&v2215CitationReader(context);if(!reader)continue;const key=v281CitationObligation(raw,cfg),binding=v2221CitationTypedAnchorBinding(raw);if(key!==null&&binding!==null){const p=v222Fields(raw),states=p?.fields.filter(f=>v222CitationStateIntent(f.key)||v222CitationRoles(f.key,reader).some(r=>r==='DeadURL'||r==='UrlStatus'))||[];if(states.length===1)actual.push({key,binding,raw,module:reader.module,revision:reader.oldid,stateKey:states[0].key,stateValue:states[0].value.trim()});}}
 const edits=[],alternatives=new Set(),proofs=[];for(const {node,raw} of v2222CitationStateOwners(before,cfg)){const w=v2222CitationStateRetentionWitness(raw,cfg);const matched=w&&actual.filter(a=>a.key===w.expected&&a.binding===w.binding&&a.module===w.module&&a.revision===w.revision&&a.stateKey===w.proof.target&&a.stateValue===w.proof.targetValue);if(!w||!matched.length)continue;const exact=matched.find(a=>v2222CitationActualFieldsEquivalent(w.source,a.raw,cfg));if(!exact)continue;edits.push({start:node.start,end:node.end,text:exact.raw});alternatives.add(w.original);proofs.push({start:node.start,end:node.end,native:w.proof});}
 if(edits.some((e,i)=>edits.some((f,j)=>i!==j&&e.start<f.end&&f.start<e.end)))return empty;return{source:v24SyntaxApply(before,edits),alternatives,proofs};
}
