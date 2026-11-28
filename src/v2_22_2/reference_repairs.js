// Establish an already-approved literal link boundary before dependent citation
// owners and their independently regenerated preservation baseline are read.
function v2222ReferenceLinkPrerequisitePlan(source,cfg={}){
 const edits=cfg.citations!==false&&v220StructureScope(source,cfg)?v220UniqueWikiLinkCloser(source,cfg):[];
 const view=edits.length?v24SyntaxProtected(source).view:'';
 return v222EditsPlan(source,edits.length&&v2222CitationOwnerScope(source,cfg).calls.length?edits.filter(e=>!v24SyntaxContext(view,e.start-1).external.length):[]);
}
function v2222ReferenceLinkPrerequisiteProof(before,after,plan,cfg={}){return v222PlanProof(before,after,plan,cfg,v2222ReferenceLinkPrerequisitePlan);}
// A syntax defect in one owner never prevents independent owners being checked.
function v2222ReferenceSyntaxPlan(source,cfg={}) {
 const edits=[];if(!v2221ReferenceScope(source,cfg))return v222EditsPlan(source,edits);const view=v24SyntaxProtected(source).view,nodes=v24SyntaxTemplates(view).nodes,observed=v219NativeReferenceObserver(source);
 for(let at=view.indexOf('<');at>=0;){const tag=v24SyntaxTag(view,at);at=view.indexOf('<',tag?tag.end:at+1);if(!tag||tag.name!=='ref'||!tag.self||tag.close||tag.typo||!v2221ReferenceOutside(source,tag.start,tag.end,view))continue;
  const attrs=v24SyntaxAttrs(tag.attrs);if(!attrs||!v24SyntaxLiteralIdentity(attrs)||Object.keys(attrs).some(k=>!['name','group'].includes(k)))continue;
  const next=nodes.find(n=>n.size===2&&n.start>=tag.end&&!source.slice(tag.end,n.start).trim());if(!next)continue;
  const raw=source.slice(next.start,next.end),context=v2222CitationContext(raw);if(!context||!v222Fields(raw))continue;
  const tail=/^[ \t\r\n]*<\/ref\s*>/i.exec(source.slice(next.end));if(!tail)continue;const stop=next.end+tail[0].length;
  if(attrs.name&&observed.refs.some(r=>r.body!==null&&r.attrs?.name===attrs.name&&(r.group||'')===(attrs.group||'')))continue;
  // A complete balanced citation is the sole body between the accidental slash
  // and its explicit closing tag. Never consume adjacent prose or another ref.
  const citationNodes=v24SyntaxTemplates(protectedView(raw));if(citationNodes.unclosed.length||citationNodes.nodes.filter(n=>n.depth===0).length!==1)continue;
  edits.push({start:tag.start,end:tag.end,text:tag.raw.replace(/\/\s*>$/,'>'),count:1,kind:'reference-early-self-close',proof:{attrs,citationHash:v24SyntaxHash(raw),closingEnd:stop}});
 }
 return v222EditsPlan(source,edits);
}
function v2222ReferenceSyntaxProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2222ReferenceSyntaxPlan);}
function v2222ReferenceCollectorPlan(source,cfg={}) {
 const edits=[];if(!v2221ReferenceScope(source,cfg)||cfg.headings===false||cfg.automaticReferenceCollectorHeadings===false)return v222EditsPlan(source,edits);
 const rows=v2221ReferenceRows(source),observed=v219NativeReferenceObserver(source),closed=v2221ReferenceClosed(source,rows);
 if(!closed||observed.unclosed.length||observed.empties.length||v2221ReferenceOpaqueConsumers(source,rows,observed).length)return v222EditsPlan(source,edits);
 const noteCalls=observed.refs.some(r=>r.group)||(observed.helpers||[]).some(h=>h.nativeGroup||(h.calls||[]).some(c=>c.group));
 if(noteCalls)return v222EditsPlan(source,edits);
 for(const row of rows){const d=row.descriptor;if(!d?.combined||!d.safe||d.bank||d.groupExplicit||d.presentationFields||!v2221ReferenceCombinable(d))continue;
  const p=v222Fields(row.raw);if(!p||p.parts.length!==1||v2221ReferenceHeadingTargeted(source,v2221ReferenceHeadingChain(source,row.start)))continue;
  edits.push({start:row.start,end:row.end,text:'{{Referências}}',count:1,kind:'reference-empty-combined-notes',proof:{closedProducerGraph:true,noNotes:true,argumentFree:true}});
 }
 return v222EditsPlan(source,edits);
}
function v2222ReferenceCollectorProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2222ReferenceCollectorPlan);}
function v2222ReferenceDeadLinkPlan(source,cfg={}) {
 const edits=[];if(!v2221ReferenceScope(source,cfg)||cfg.citations===false)return v2221CitationEditsPlan(source,edits,cfg);
 const shield=v222Protected(source),nodes=v24SyntaxTemplates(shield.view).nodes,refs=v219NativeReferenceObserver(source).refs;
 for(const {node:n,raw} of v2222CitationStateOwners(source,cfg)){const p=v222Fields(raw),c=v2222CitationContext(raw),r=c&&v2215CitationReader(c);if(!p||!r||!v2221CitationAccessReader(r)||!v2222CitationStateAdmission(raw,cfg))continue;
  const gap=/^[ \t\r\n]*/.exec(source.slice(n.end))[0],next=nodes.find(m=>m.size===2&&m.start===n.end+gap.length);if(!next)continue;
  const marker=source.slice(next.start,next.end),mp=v222Fields(marker);if(!mp||!/^ligação inac?tiva$/i.test(mp.header.trim())||mp.parts.length!==mp.fields.length+1)continue;
  const owner=refs.find(ref=>ref.valid&&ref.body!==null&&ref.close&&ref.start<n.start&&next.end<=ref.close.start);if(!owner)continue;
  const dates=mp.fields.filter(f=>f.key==='data'),bots=mp.fields.filter(f=>f.key==='bot'),unknown=mp.fields.filter(f=>!['data','bot'].includes(f.key));if(unknown.length||dates.length>1||bots.length>1||bots.some(f=>!v2222ReferenceLiteralBotMetadata(f.value)))continue;
  const urls=p.fields.filter(f=>v222CitationRoles(f.key,r).includes('URL')&&v2222CitationLiteralURL(f.value.trim())),status=p.fields.filter(f=>v222CitationStateIntent(f.key));if(urls.length!==1||status.length>1||status.length===1&&status[0].key!=='datali')continue;
  const existing=status[0],date=dates[0]?.value.trim()||'',typed=date&&(v218CitationDateValue(date,'date')||v219SupplementalCitationDateValue(date,'date'));
  if(date&&!typed)continue;
  if(existing){const prior=v218CitationDateValue(existing.value.trim(),'date')||v219SupplementalCitationDateValue(existing.value.trim(),'date');if(!prior||date&&(JSON.stringify(prior.identity)!==JSON.stringify(typed.identity)||prior.precision!==typed.precision))continue;}
  else if(!date)continue;
  const replacement=existing?raw:raw.slice(0,-2)+'|datali='+date+'}}';edits.push({start:n.start,end:next.end,text:replacement,count:1,kind:'reference-dead-marker-native-date',proof:{reader:r.oldid,markerHash:v24SyntaxHash(marker),date:date||existing.value.trim(),archiveFieldsRetained:true,completeRef:owner.attrs}});
 }
 return v2221CitationEditsPlan(source,edits,cfg);
}
function v2222ReferenceDeadLinkProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2222ReferenceDeadLinkPlan);}
function v2222ReferenceBiblePlan(source,cfg={}) {
 const edits=[];if(!v2221ReferenceScope(source,cfg))return v222EditsPlan(source,edits);const shield=v222Protected(source);
 for(const n of v24SyntaxTemplates(shield.view).nodes){if(n.size!==2)continue;const raw=source.slice(n.start,n.end),p=v222Fields(raw);if(!p||!/^citar bíblia$/i.test(p.header.trim())||p.parts.length!==p.fields.length+1)continue;
  const f=p.fields.filter(f=>f.key==='verso'),keys=p.fields.map(f=>f.key),books=p.fields.filter(f=>f.key==='livro');if(f.length!==1||books.length!==1||keys.some(k=>['capítulo','capitulo','verso_final','verso-final'].includes(k)))continue;
  const passage=/^([1-9]\d*):([1-9]\d*)(?:[-–]([1-9]\d*))?$/.exec(f[0].value.trim());if(!passage||passage[3]&&Number(passage[3])<Number(passage[2]))continue;
  // Reuse the existing native book recognizer and positional passage parser.
  const name=books[0].value.trim(),known=Object.values(V2217_BIBLE_BOOKS).includes(name)||Object.hasOwn(V2217_BIBLE_BOOKS,norm(name));if(!known)continue;
  const field=f[0];edits.push({start:n.start+field.valueStart,end:n.start+field.end,text:passage[2]+'|capítulo='+passage[1]+(passage[3]?'|verso_final='+passage[3]:''),count:passage[3]?3:2,kind:'reference-explicit-bible-passage',proof:{nativeBook:books[0].value,chapter:passage[1],verse:passage[2],last:passage[3]||null}});
 }
 return v222EditsPlan(source,edits);
}
function v2222ReferenceBibleProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2222ReferenceBiblePlan);}
