// Keep the declared metadata obligation and add only a source-proved native
// generic-citation branch. This does not approve arbitrary family changes.
// Reuse only the already proved native month/year bindings before other
// citation keys can hide that dependency. Unknown date structures stay intact.
// Empty anonymous arguments must be removed by their original native proof
// before named-field cleanup; named empty overrides are never deleted.
function v2221CitationEmptyPartsPrerequisitePlan(source,cfg={}) {
 if(!v222Scope(source,cfg)||cfg.citations===false)return v222EditsPlan(source,[]);
 const original=v219CitationEmptyPartsPlan(source,cfg);
 if(!v219CitationEmptyPartsProof(source,original.text,original,cfg))return v222EditsPlan(source,[]);
 const edits=original.edits.filter(edit=>edit.ruleId==='v219CitationEmptyParts').map(edit=>({...edit,count:1,kind:'source-proved-empty-anonymous-citation-part'}));
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2221CitationEmptyPartsPrerequisiteProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221CitationEmptyPartsPrerequisitePlan);}
function v2221CitationMonthYearPrerequisitePlan(source,cfg={}) {
 const edits=[];
 if(!v222Scope(source,cfg)||cfg.citations===false||cfg.dates===false||cfg.automaticParameterNames===false||cfg.automaticCitationDateValues===false)return v222EditsPlan(source,edits);
 const original=v219SourceCompatibilityPlan(source,cfg);
 for(const edit of original.edits||[]){
  if(!['typed-native-month-year-pair','typed-year-month-scalar'].includes(edit.proof?.kind))continue;
  edits.push({...edit,count:1,kind:'source-proved-native-citation-month-year'});
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2221CitationMonthYearPrerequisiteProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221CitationMonthYearPrerequisitePlan);}
function v2221CitationTypedTargetAllowed(raw,target) {
 const syntax=v222Fields(raw);
 return !!target&&!!syntax&&!syntax.fields.some(f=>/[{}]/.test(f.value))&&
  !!v2221CitationHeaderEquivalent(raw,target.target)&&v2221CitationTypedAnchorBinding(target.text)!==null;
}
// A literal HTML bank is an existing native collector, not a generic HTML
// ancestor. Only a complete named definition whose whole body is this call
// receives the same source-bound type proof used outside the bank.
function v2221CitationLiteralBankContext(source) {
 if(!v2221ReferenceWellFormedOwners(source))return null;
 const observed=v219NativeReferenceObserver(source);
 if(observed.unclosed.length||observed.empties.length||observed.shield.unclosed.length)return null;
 const rows=v2221ReferenceRows(source).filter(row=>row.native&&row.descriptor?.safe&&row.descriptor.bank);
 return {observed,rows};
}
function v2221CitationLiteralBankCall(source,node,context,banks) {
 if(!banks||node.size&&node.size!==2||node.end-node.start>131072||context.protected.some(r=>r.start<node.end&&node.start<r.end)||context.nodes.some(n=>n.start<node.start&&node.end<=n.end))return null;
 const raw=source.slice(node.start,node.end),ref=banks.observed.refs.find(r=>r.container&&r.valid&&r.close&&r.body?.trim()===raw&&r.start<node.start&&node.end<r.end&&r.attrs?.name&&Object.keys(r.attrs).every(k=>k==='name'||k==='group')&&v24SyntaxLiteralIdentity(r.attrs));
 if(!ref)return null;
 const row=banks.rows.find(row=>row.start===ref.container.start&&ref.end<row.end&&row.descriptor.group===ref.group);if(!row)return null;
 const definitions=banks.observed.refs.filter(r=>r.body!==null&&r.attrs?.name===ref.attrs.name&&(r.group||'')===(ref.group||''));
 if(definitions.length!==1)return null;
 const p=parsedTemplate(raw);if(!v219OriginalTemplateHeaderAllowed(p.parts[0]))return null;
 return {raw,p,ownerWitness:{kind:'complete-native-literal-html-reference-bank',bankHash:v24SyntaxHash(row.raw),referenceName:ref.attrs.name,referenceGroup:ref.group||'',bodyHash:v24SyntaxHash(ref.body)}};
}
function v2221CitationTypedPlan(source,cfg={}) {
 const edits=[];
 if(!v222Scope(source,cfg)||cfg.citations===false||cfg.automaticParameterNames===false)return v222EditsPlan(source,edits);
 const context=v2217ReferenceOwnerContext(source);let banks;
 for(const node of context.nodes){
  let call=v2217ReferenceLiteralCall(source,node,context);
  if(!call&&/<references\b/i.test(source)){if(banks===undefined)banks=v2221CitationLiteralBankContext(source);call=v2221CitationLiteralBankCall(source,node,context,banks);}
  if(!call)continue;
  const target=v2217CitationTarget(call.raw);if(!target)continue;
  edits.push({start:node.start,end:node.end,text:target.text,count:target.count,kind:'source-proved-generic-citation-type',proof:{sourceHash:v24SyntaxHash(call.raw),candidateHash:v24SyntaxHash(target.text),nativeContract:target.witness,...(call.ownerWitness?{owner:call.ownerWitness}:{})}});
 }
 return v222EditsPlan(source,edits.filter(e=>!edits.some(o=>o!==e&&o.start<e.end&&e.start<o.end)));
}
function v2221CitationTypedProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221CitationTypedPlan);}
function v2221CitationTypedAnchorBinding(raw) {
 const context=v2212CitationContext(raw),reader=context&&v2215CitationReader(context),syntax=v222Fields(raw);
 if(!context||!reader||!syntax||syntax.parts.length!==syntax.fields.length+1)return null;
 const out=[];
 for(const role of ['Ref','Mode']){
  const fields=syntax.fields.filter(f=>v222CitationRoles(f.key,reader).includes(role));
  if(fields.length>1)return null;
  if(fields.length){const f=fields[0];if(!v222CitationTargetAccepted(context,f.key,reader)||!f.value.trim()||/[{}<>\r\n]/.test(f.value.trim()))return null;out.push([role,f.value.trim()]);}
 }
 return JSON.stringify(out);
}
function v2221CitationTypedRetentionAlternatives(before,after,cfg={}) {
 const accepted=new Set();
 if(!v222Scope(before,cfg)||cfg.citations===false||cfg.automaticParameterNames===false)return accepted;
 const actual=[];
 for(const node of templates(protectedView(after)).nodes){
  const raw=after.slice(node.start,node.end),binding=v2221CitationTypedAnchorBinding(raw);
  if(binding===null)continue;
  const key=v281CitationObligation(raw,cfg);if(key!==null)actual.push({raw,key,binding});
 }
 for(const node of templates(protectedView(before)).nodes){
  const raw=before.slice(node.start,node.end),syntax=v222Fields(raw);
  if(!syntax||!v215SameTemplateTitle(syntax.header,'Citation')||syntax.fields.some(f=>/[{}]/.test(f.value)))continue;
  const target=v2217CitationTarget(raw);
  if(!target||!v2221CitationHeaderEquivalent(raw,target.target))continue;
  const binding=v2221CitationTypedAnchorBinding(target.text),wanted=v281CitationObligation(target.text,cfg),original=v281CitationObligation(raw,cfg);
  if(binding===null||wanted===null||original===null)continue;
  if(actual.some(row=>row.key===wanted&&row.binding===binding&&v215SameTemplateTitle(parsedTemplate(row.raw).parts[0],target.target)))accepted.add(original);
 }
 return accepted;
}
