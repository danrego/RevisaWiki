// Only these directly displayed native fields activate the existing collector
// prerequisite. A generic catalogue entry is not proof of visible references.
const V2222_REFERENCE_INFOBOX_CONSUMERS=Object.freeze([
 {owner:'Info/Navio',key:'propulsão',source:'propulsao',native:{title:'Predefinição:Info/Navio',revision:72041787,sha256:'940bb2e08da1d08b6b3490d748479cae1c3f08cd4be62c6d1a192cbd4e250771'},reader:'dados173={{{propulsão|}}}'},
 {owner:'Info/Computador',key:'obs',source:'soc',native:{title:'Predefinição:Info/Computador',revision:72837193,sha256:'464ca1a18802dacca46a2547532ece3540a07cbd926f11ba939877d38e8c7daa'},reader:'dados61={{#if:{{{obs|}}}|{{{obs|}}}}}'}
]);
function v2222PreviousReferenceInfoboxActivation(source,cfg={}) {
 if(!v2221ReferenceScope(source,cfg)||source.length>524288||cfg.namespaceNumber!==0||cfg.infoboxes===false||cfg.automaticReferenceRepairs===false||cfg.endMatter!==true||!/<ref\b/i.test(source)||v24SyntaxScan(source).issues.length)return null;
 const view=v24SyntaxProtected(source),nodes=topNodes(view.view),boxes=[];
 for(const node of nodes){const raw=source.slice(node.start,node.end),p=v2221InfoboxRead(raw);if(!p)continue;const row=V2222_REFERENCE_INFOBOX_CONSUMERS.find(r=>r.owner===p.title);if(row)boxes.push({node,raw,p,row});}
 if(boxes.length!==1)return null;const box=boxes[0],pin=v2222InfoboxPin(box.p.title);if(!pin||!v2221InfoboxSamePin(pin,box.row.native)||new Set(box.p.fields.map(f=>f.key)).size!==box.p.fields.length)return null;
 const sourceFields=box.p.fields.filter(f=>f.key===box.row.source),targetFields=box.p.fields.filter(f=>f.key===box.row.key);if(sourceFields.length>1||targetFields.length>1||sourceFields.length&&targetFields.some(f=>f.value.trim()))return null;
 const originalField=sourceFields.length?sourceFields:targetFields;if(originalField.length!==1||!/<ref\b/i.test(originalField[0].value))return null;
 const native=v2222InfoboxNativeCall(box.raw,source,cfg),mappedRaw=native?.text||box.raw,parsed=v2221InfoboxRead(mappedRaw);if(!parsed||parsed.title!==box.p.title)return null;const target=parsed.fields.filter(f=>f.key===box.row.key);if(target.length!==1||!/<ref\b/i.test(target[0].value))return null;
 const mapped=v24SyntaxApply(source,[{start:box.node.start,end:box.node.end,text:mappedRaw}]),before=v219NativeReferenceObserver(source),after=v219NativeReferenceObserver(mapped),owner={name:box.p.title,start:box.node.start,end:box.node.start+mappedRaw.length,native:box.row.native};
 if(!after.refs.length||[before,after].some(x=>x.unclosed.length||x.empties.length||x.helpers.length)||rendererRanges(after.view).length)return null;
 const inventory=(text,observer)=>observer.refs.map(r=>[text.slice(r.start,r.end),r.attrs,r.group]);if(JSON.stringify(inventory(source,before))!==JSON.stringify(inventory(mapped,after)))return null;
 for(const ref of after.refs){if(!ref.attrs||ref.typo||ref.container||ref.group||ref.body!==null&&(!ref.close||!ref.body.trim())||!v24SyntaxLiteralIdentity(ref.attrs)||Object.keys(ref.attrs).some(k=>!['name','group'].includes(k)))return null;
  if(!(owner.start+target[0].valueStart<=ref.start&&ref.end<=owner.start+target[0].valueEnd))return null;
  const context=v24SyntaxContext(after.view,ref.start);if(context.templates.length!==1||context.templates[0].start!==owner.start||['html','tables','links','external'].some(k=>context[k]?.length))return null;
 }
 const packet={schema:2,originalSource:source,sourceHash:v24SyntaxHash(source),mappedHash:v24SyntaxHash(mapped),owner,fields:[{from:originalField[0].key,to:box.row.key,valueHash:v24SyntaxHash(target[0].value),native:box.row.native,reader:box.row.reader}],referenceInventoryHash:v24SyntaxHash(JSON.stringify(inventory(mapped,after)))};
 return {source,mapped,count:native?.count||0,packet};
}
function v2222ReferenceInfoboxAllows(mapped,cfg={},packet=null,ownerSpan=null) {
 if(!packet||packet.schema!==2||typeof packet.originalSource!=='string'||packet.sourceHash!==v24SyntaxHash(packet.originalSource)||packet.mappedHash!==v24SyntaxHash(mapped))return false;
 const fresh=v2222ReferenceInfoboxActivation(packet.originalSource,cfg);if(!fresh||fresh.mapped!==mapped||JSON.stringify(fresh.packet)!==JSON.stringify(packet))return false;
 return ownerSpan===null||ownerSpan.start===packet.owner.start&&ownerSpan.end===packet.owner.end;
}
function v2222ReferenceInfoboxPlan(source,cfg={}) {
 const empty=v222EditsPlan(source,[]),activation=v2222ReferenceInfoboxActivation(source,cfg);if(!activation)return empty;
 const collector=v221MissingDefaultCollectorPlan(activation.mapped,cfg,activation.packet);if(!collector.edits?.length||!v221MissingDefaultCollectorProof(activation.mapped,collector.text,collector,cfg,activation.packet))return empty;
 let start=0,end=source.length,tail=collector.text.length;while(start<end&&start<tail&&source[start]===collector.text[start])start++;while(end>start&&tail>start&&source[end-1]===collector.text[tail-1]){end--;tail--;}
 return v222EditsPlan(source,[{start,end,text:collector.text.slice(start,tail),count:activation.count+collector.edits.length,kind:'native-infobox-reference-prerequisite',proof:{activation:activation.packet,collector:collector.edits}}]);
}
function v2222ReferenceInfoboxProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2222ReferenceInfoboxPlan);}

// Reuse the original native mapper as a read-only probe. A temporary collector
// proves eligibility without bypassing its role, alias or value safeguards.
function v2222ReferenceLegacyBioActivation(source,cfg={}) {
 if(!v2221ReferenceScope(source,cfg)||source.length>524288||cfg.namespaceNumber!==0||cfg.infoboxes===false||cfg.automaticReferenceRepairs===false||cfg.endMatter!==true||!/<ref\b/i.test(source)||v24SyntaxScan(source).issues.length)return null;
 const principal=v221BioPrincipal(source);if(!principal)return null;const p=v2221InfoboxRead(principal.raw);if(!p||v2222InfoboxCanonicalOwner(p.title)!=='Info/Biografia'||p.fields.some(f=>f.positional)||new Set(p.fields.map(f=>f.key)).size!==p.fields.length)return null;
 const pin=v2222InfoboxPin('Info/Biografia'),consumers=(V2222_IB.legacyReferenceConsumers||[]).filter(r=>r.superscript===true&&v2221InfoboxSamePin(pin,r.native));if(!consumers.length)return null;
 const probe=source+'\n{{Referências}}\n',probeBox=v221BioPrincipal(probe);if(!probeBox||probeBox.node.start!==principal.node.start||probeBox.raw!==principal.raw)return null;
 const planned=v221BioMappingEdits(probe,cfg,probeBox),selected=[],activated=[];
 for(const edit of planned){if(edit.ruleId!=='v221InfoboxField'||!edit.proof?.from||!edit.proof?.to)continue;const field=p.fields.find(f=>f.key===edit.proof.from),proof=field&&v2222InfoboxLegacyReferenceProof(source,{name:p.title,fields:p.fields},{from:edit.proof.from,to:edit.proof.to},field.value,cfg);if(!proof?.superscript)continue;selected.push(edit);activated.push(proof);}
 for(const edit of planned)if(edit.ruleId==='v221InfoboxEmptyDestination'&&activated.some(r=>r.to===edit.proof?.destination)){const field=p.fields.find(f=>f.key===edit.proof.destination);if(!field||!/^[ \t\r\n]*$/.test(field.value))return null;selected.push(edit);}
 const mapped=v24SyntaxApply(source,selected),mappedPrincipal=v221BioPrincipal(mapped),afterP=mappedPrincipal&&v2221InfoboxRead(mappedPrincipal.raw);if(!afterP||afterP.title!==p.title||new Set(afterP.fields.map(f=>f.key)).size!==afterP.fields.length)return null;
 const targetFields=[];for(const field of afterP.fields){const consumer=consumers.find(r=>r.key===field.key);if(!consumer||!/<ref\b/i.test(field.value)||!v2222InfoboxSafeValue(field.value)||consumer.requiresEmptyOrAbsent?.some(key=>afterP.fields.some(f=>f.key===key&&f.value.trim())))continue;targetFields.push({field,consumer});}
 if(!targetFields.length)return null;const before=v219NativeReferenceObserver(source),after=v219NativeReferenceObserver(mapped);if(!after.refs.length||[before,after].some(x=>x.unclosed.length||x.empties.length||x.helpers.length)||rendererRanges(after.view).length)return null;
 const inventory=(text,observer)=>observer.refs.map(r=>[text.slice(r.start,r.end),r.attrs,r.group]);if(JSON.stringify(inventory(source,before))!==JSON.stringify(inventory(mapped,after)))return null;
 const owner={name:p.title,start:mappedPrincipal.node.start,end:mappedPrincipal.node.end,native:pin};
 for(const ref of after.refs){if(!ref.attrs||ref.typo||ref.container||ref.group||ref.body!==null&&(!ref.close||!ref.body.trim())||!v24SyntaxLiteralIdentity(ref.attrs)||Object.keys(ref.attrs).some(k=>!['name','group'].includes(k)))return null;
  const target=targetFields.find(({field})=>owner.start+field.valueStart<=ref.start&&ref.end<=owner.start+field.valueEnd);if(!target)return null;
  const context=v24SyntaxContext(after.view,ref.start);if(context.templates.length!==1||context.templates[0].start!==owner.start||['html','tables','links','external'].some(k=>context[k]?.length))return null;
 }
 const fields=targetFields.map(({field,consumer})=>({from:activated.find(r=>r.to===field.key)?.from||field.key,to:field.key,valueHash:v24SyntaxHash(field.value),native:consumer.native,reader:consumer.reader}));
 const packet={schema:2,kind:'verified-base-biography-fields',originalSource:source,sourceHash:v24SyntaxHash(source),mappedHash:v24SyntaxHash(mapped),owner,fields,referenceInventoryHash:v24SyntaxHash(JSON.stringify(inventory(mapped,after)))};
 return {source,mapped,count:selected.reduce((n,e)=>n+(e.count??1),0),packet};
}
function v2222ReferenceInfoboxActivation(source,cfg={}) {
 return v2222ReferenceLegacyBioActivation(source,cfg)||v2222PreviousReferenceInfoboxActivation(source,cfg);
}
