// Literal reference repairs use local owners. An unrelated template does not
// authorize a candidate, and does not cancel an independently proved edit.
function v2216ReferenceGraph(source) {
    const parsed=v24SyntaxReferences(source),owners=v24SyntaxTemplates(parsed.view).nodes,
        hard=[...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)],refs=[];
    for(const r of parsed.refs){
        const attrs=r.attrs||{},name=attrs.name||'',group=r.group||'',raw=source.slice(r.start,r.end),
            body=r.body===null?null:source.slice(r.end-r.body.length-(r.close?.raw.length||0),r.close?.start??r.end),
            literal=!!r.attrs&&v24SyntaxLiteralIdentity(r.attrs)&&Object.keys(attrs).every(k=>['name','group'].includes(k)),
            owned=owners.some(n=>n.start<r.start&&n.end>=r.end),
            quoted=hard.some(n=>n.start<r.end&&n.end>r.start),
            openOwner=parsed.unclosed.some(n=>n.start<r.start&&(!n.boundary||n.boundary.start>r.start)),
            eligible=literal&&!owned&&!quoted&&!openOwner&&!r.container&&!!r.renderer?.valid;
        refs.push({start:r.start,end:r.end,openEnd:r.end-(r.body===null?0:(r.close?.raw.length||0)+(r.body?.length||0)),
            raw,body,name,group,attrs,eligible,literal,container:!!r.container});
    }
    return {refs,unclosed:parsed.unclosed.map(r=>({start:r.start,name:r.attrs?.name||'',group:r.group||''})),
        empties:parsed.empties.map(r=>({start:r.start,name:r.attrs?.name||'',group:r.group||''})),view:parsed.view};
}

function v2216ReferenceCollectorIsolation(source) {
    const edits=[],rows=v2215ReferenceCollectorRows(source),view=rows.view,parsed=templates(view),
        protectedRanges=[...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)];
    const eligible=(start,end)=>{
        const lineStart=source.lastIndexOf('\n',start-1)+1,lineEnd=source.indexOf('\n',end),
            suffix=source.slice(end,lineEnd<0?source.length:lineEnd),prefix=source.slice(lineStart,start);
        if(!prefix.trim()||suffix.trim()||protectedRanges.some(r=>r.start<end&&r.end>start))return false;
        const c=v24SyntaxContext(view,start);
        return !c.templates.length&&!c.tables.length&&!c.links.length&&!c.external.length&&!c.html.length;
    };
    for(const n of topNodes(view)){
        const p=parsedTemplate(source.slice(n.start,n.end)),head=v215TemplateTitle(p.head??p.name),key=norm(head);
        if(!v219NativeReferenceCollectorAlias(head)&&!['reflist','notelist','listanota','notas','notas e referências','notas e referencias','refereencias','referên cias','referéncias','referênçias','referncias','referênicas','refrências','referência'].includes(key))continue;
        if(eligible(n.start,n.end))edits.push({start:n.start,end:n.start,text:'\n\n',kind:'isolate-reference-collector',witness:{owner:source.slice(n.start,n.end)}});
    }
    for(let at=0;at<view.length;){const tag=v24SyntaxTag(view,at);if(!tag){at++;continue;}at=tag.end;
        if(tag.name!=='references'||tag.close||!tag.self||!v24SyntaxAttrs(tag.attrs))continue;
        if(eligible(tag.start,tag.end))edits.push({start:tag.start,end:tag.start,text:'\n\n',kind:'isolate-reference-collector',witness:{owner:tag.raw}});
    }
    return edits;
}

function v2216ReferenceReflistEdits(source,cfg={}) {
    const rows=v2215ReferenceCollectorRows(source).rows,edits=[];
    for(const row of rows){
        if(!row.reflist)continue;
        const positional=row.entries.filter(e=>e.positional||e.key==='1'),other=row.entries.filter(e=>!e.positional&&e.key!=='1'),
            literalColumns=positional.length===1&&/^[1-9]\d?$/.test(positional[0].value.trim());
        if(!literalColumns||other.some(e=>!['group','grupo'].includes(e.key))||other.length>1)continue;
        const group=other[0]?.value.trim()||'';
        if(/[{}\[\]<>|&\r\n]/.test(group))continue;
        // Existing column policy runs afterwards, using the proved entry count.
        const level=cfg.headings===false||cfg.automaticReferenceCollectorHeadings===false?'|nível=0':'';
        edits.push({start:row.start,end:row.end,text:'{{Referências'+(group?'|grupo='+group:'')+level+'}}',kind:'reflist-literal-columns',
            witness:{group,original:row.raw,columns:positional[0].value.trim()}});
    }
    return edits;
}

function v2216ReferenceCombinedCollectorEdits(source,cfg={}) {
    if(cfg.unifiedNotesReferences===false||v219ReferenceCollectorTargeted(source))return [];
    const rows=v2215ReferenceCollectorRows(source).rows,notes=rows.filter(r=>r.kind==='notes'&&r.plain),
        references=rows.filter(r=>r.kind==='references'&&!r.group&&r.plain);
    if(rows.length!==2||notes.length!==1||references.length!==1)return [];
    const a=notes[0],b=references[0];if(a.start>=b.start||source.slice(a.end,b.start).trim())return [];
    const group=['nota','lower-alpha'].includes(a.group)?'':a.group;
    if(!a.group||/[{}\[\]<>|&\r\n]/.test(a.group))return [];
    const start=a.heading&&['notas','notes','notas e referências'].includes(a.heading.name)&&a.heading.level===2?a.heading.start:a.start;
    if(a.heading&&a.heading.level!==2)return [];
    return [{start,end:b.end,text:'{{Notas e referências'+(group?'|grupo='+group:'')+'}}',kind:'unified-reference-collectors',
        witness:{notes:a.raw,references:b.raw,noteGroup:a.group,group}}];
}

function v2216ReferencePunctuationEdits(source) {
    const refs=v2216ReferenceGraph(source).refs,edits=[];
    for(let i=0;i<refs.length;i++){
        const first=refs[i];if(!first.eligible)continue;let last=first,j=i;
        while(j+1<refs.length&&refs[j+1].eligible&&/^[ \t]*$/.test(source.slice(last.end,refs[j+1].start))){last=refs[++j];}
        const mark=source.slice(last.end).match(/^([.,;:!?])(?=\s|$|[<\[])/),lineStart=source.lastIndexOf('\n',first.start-1)+1,
            before=source.slice(lineStart,first.start),previous=before.trimEnd().slice(-1);
        if(mark&&before.trim()&&(!/[.,;:!?]/.test(previous)||previous===mark[1])&&!/^\s*[=|!]/.test(before)){
            const chain=source.slice(first.start,last.end),gap=before.match(/[ \t]*$/)[0];
            edits.push({start:first.start-gap.length,end:last.end+1,text:(previous===mark[1]?'':mark[1])+gap+chain,kind:'reference-punctuation',
                witness:{punctuation:mark[1],alreadyBefore:previous===mark[1],gap,chain,refs:refs.slice(i,j+1).map(r=>r.raw)}});
        }
        i=j;
    }
    return edits;
}

function v2216ReferenceLiteralReservations(source) {
    const names=new Set(),view=protectedView(source);
    for(const node of templates(view).nodes){
        const p=parsedTemplate(source.slice(node.start,node.end));
        for(const field of foreignEntries(p)){
            const value=field.value.trim();if(!value||/[{}\[\]<>|\r\n]/.test(value))continue;
            const decoded=decodedReferenceName(value).normalize('NFC');
            if(decoded&&!/[{}\[\]<>|\r\n]/.test(decoded))names.add(decoded);
        }
    }
    return names;
}

function v2216ReferenceReuseEdits(source,cfg={}) {
    const graph=v2216ReferenceGraph(source),edits=[],names=v2216ReferenceLiteralReservations(source),families=new Map(),renderers=rendererRanges(graph.view),
        dynamic=/\{\{\{|\{\{\s*#tag\s*:\s*ref\b/i.test(graph.view),uses=referenceNameUses(source);
    uses.forEach(r=>names.add(decodedReferenceName(r.value).normalize('NFC')));
    if(dynamic||uses.some(r=>/[{}\uE000-\uF8FF]/.test(r.value)))return edits;
    for(const r of graph.refs){
        if(!r.eligible||r.name||r.body===null||!r.body.trim()||!v24SyntaxBodySafe(r.body))continue;
        const region=renderers.filter(n=>n.end<=r.start).length,key=JSON.stringify([r.group,region,r.body]);
        if(!families.has(key))families.set(key,[]);families.get(key).push(r);
    }
    let serial=1;
    for(const family of families.values()){
        if(family.length<2)continue;let name;do{name='ref-auto-'+serial++;}while(names.has(name));names.add(name);
        family.forEach((r,index)=>edits.push({start:r.start,end:r.end,text:'<ref name="'+name+'"'+(r.group?' group="'+r.group+'"':'')+(index?' />':'>'+r.body+'</ref>'),
            kind:'identical-reference-reuse',witness:{name,group:r.group,body:r.body,first:family[0].start,count:family.length,definition:index===0}}));
    }
    return edits;
}

function v2216ReferenceAdjacentEdits(source) {
    const graph=v2216ReferenceGraph(source),defs=new Map(),bad=new Set(),key=r=>JSON.stringify([r.group,r.name]),edits=[];
    for(const r of graph.refs){if(!r.name)continue;const k=key(r);if(!r.literal){bad.add(k);continue;}
        if(r.body!==null){if(!r.body.trim()){bad.add(k);continue;}if(!defs.has(k))defs.set(k,new Set());defs.get(k).add(r.body);}}
    for(const r of [...graph.unclosed,...graph.empties])if(r.name)bad.add(key(r));
    let i=0;
    while(i<graph.refs.length){
        const first=graph.refs[i];if(!first.eligible||!first.name||bad.has(key(first))||defs.get(key(first))?.size!==1){i++;continue;}
        let end=i+1;
        while(end<graph.refs.length&&graph.refs[end].eligible&&key(graph.refs[end])===key(first)&&/^[ \t]*$/.test(source.slice(graph.refs[end-1].end,graph.refs[end].start)))end++;
        if(end-i>1){const chain=graph.refs.slice(i,end),keep=chain.find(r=>r.body!==null)||first;
            for(const r of chain)if(r!==keep)edits.push({start:r.start,end:r.end,text:'',kind:'adjacent-reference-duplicate',
                witness:{name:r.name,group:r.group,body:[...defs.get(key(r))][0],keptRaw:keep.raw,keptDefinition:keep.body!==null}});
        }
        i=end;
    }
    return edits;
}

function v2216ReferenceDeadLinkEdits(source) {
    const view=protectedView(source),nodes=templates(view).nodes,edits=[],blockedRanges=[...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)],
        aliases=new Set(['datali','li','ligação inativa','ligação inactiva','urlmorta','dead-url','deadurl','url-status','urlstatus','urlmorta-data']);
    for(const n of nodes){
        const raw=source.slice(n.start,n.end),p=parsedTemplate(raw),head=norm(v215TemplateTitle(p.head??p.name));
        if(!['citar web','citar jornal'].includes(head)||blockedRanges.some(r=>r.start<n.end&&r.end>n.start))continue;
        const tail=source.slice(n.end),gap=tail.match(/^[ \t]*/)[0],at=n.end+gap.length,next=nodes.find(r=>r.start===at);
        if(!next)continue;const markerRaw=source.slice(next.start,next.end),marker=parsedTemplate(markerRaw),markerName=norm(v215TemplateTitle(marker.head??marker.name));
        if(!['ligação inativa','ligação inactiva'].includes(markerName))continue;
        const fields=foreignEntries(p),mf=foreignEntries(marker),dates=mf.filter(e=>!e.positional&&e.key==='data'),
            other=mf.filter(e=>e.positional||!['data','bot'].includes(e.key));
        if(other.length||dates.length!==1||!dates[0].value.trim()||/[{}\[\]<>|\r\n]/.test(dates[0].value))continue;
        const date=dates[0].value.trim(),typedDate=v218CitationDateValue(date,'date')||v219SupplementalCitationDateValue(date,'date'),
            existing=fields.filter(e=>!e.positional&&aliases.has(norm(e.key)));
        if(!typedDate)continue;
        if(existing.length>1||existing.length===1&&(existing[0].key!=='datali'||existing[0].value.trim()!==date))continue;
        const urls=fields.filter(e=>!e.positional&&['url','capítulo-url','capitulo-url','chapter-url'].includes(norm(e.key))&&e.value.trim());
        if(urls.length!==1||urls[0].key!=='url'||!/^(?:https?:)?\/\/[^\s<>]+$/i.test(urls[0].value.trim()))continue;
        const replacement=existing.length?raw:raw.slice(0,-2)+'|datali='+date+'}}';
        edits.push({start:n.start,end:next.end,text:replacement,kind:'dead-link-date-parameter',
            witness:{citation:raw,marker:markerRaw,date,typedDate:typedDate.identity,datePrecision:typedDate.precision,hadDatali:existing.length===1,fields:fields.map(e=>[e.key,e.value,e.positional])}});
    }
    return edits;
}

function v2216ReferenceStepWitness(before,after,edits) {
    const prior=v2216ReferenceGraph(before),next=v2216ReferenceGraph(after),expected=new Set(),
        dead=edits.filter(e=>e.kind==='dead-link-date-parameter'),actual=new Set(next.refs.filter(r=>r.body!==null).map(r=>r.body));
    for(const ref of prior.refs.filter(r=>r.body!==null)){
        const local=dead.filter(e=>e.start>=ref.openEnd&&e.end<=ref.end-6).map(e=>({...e,start:e.start-ref.openEnd,end:e.end-ref.openEnd}));
        expected.add(local.length?v24SyntaxApply(ref.body,local):ref.body);
    }
    if(expected.size!==actual.size||[...expected].some(body=>!actual.has(body)))return false;
    // Every new name must resolve to exactly the literal source body certified
    // by the family witness, and every remaining reuse must still resolve.
    const definitions=new Map();for(const r of next.refs)if(r.name&&r.body!==null){const k=JSON.stringify([r.group,r.name]);if(!definitions.has(k))definitions.set(k,new Set());definitions.get(k).add(r.body);}
    for(const e of edits.filter(e=>e.kind==='identical-reference-reuse'))if(definitions.get(JSON.stringify([e.witness.group,e.witness.name]))?.size!==1||!definitions.get(JSON.stringify([e.witness.group,e.witness.name])).has(e.witness.body))return false;
    return true;
}

function v2216ReferencePlan(source,cfg={}) {
    const plan={source,sourceHash:v24SyntaxHash(source),text:source,edits:[],steps:[]};
    if(typeof source!=='string'||!v2215ReferenceCollectorScope(source,cfg))return plan;
    const stage=(name,find)=>{const before=plan.text,edits=find(before);if(!edits?.length)return;const after=v24SyntaxApply(before,edits);
        if(after===before||!v2216ReferenceStepWitness(before,after,edits))return;
        plan.steps.push({name,before,after,edits});plan.edits.push(...edits);plan.text=after;};
    stage('isolated-reference-collectors',v2216ReferenceCollectorIsolation);
    stage('literal-reflist-columns',s=>v2216ReferenceReflistEdits(s,cfg));
    // The existing collector plan contains multiple source-bound stages. Keep
    // those exact stage boundaries rather than flattening their offset spaces.
    const old=v2215ReferenceCollectorPlan(plan.text,cfg);
    for(const s of old.steps||[])stage('preferred-'+s.name,()=>s.edits);
    stage('local-notes-and-references',s=>v2216ReferenceCombinedCollectorEdits(s,cfg));
    if(cfg.citations!==false)stage('dead-link-date',v2216ReferenceDeadLinkEdits);
    if(cfg.automaticIdenticalReferences!==false)stage('identical-reference-bodies',s=>v2216ReferenceReuseEdits(s,cfg));
    stage('adjacent-reference-calls',v2216ReferenceAdjacentEdits);
    if(cfg.refPunctuation!==false)stage('reference-punctuation',v2216ReferencePunctuationEdits);
    return plan;
}

function v2216ReferenceProof(before,after,plan,cfg={}) {
    if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
    let current=before;
    for(const step of plan.steps||[]){if(step.before!==current||v24SyntaxApply(current,step.edits)!==step.after||!v2216ReferenceStepWitness(current,step.after,step.edits))return false;current=step.after;}
    if(current!==after)return false;
    const fresh=v2216ReferencePlan(before,cfg);
    return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
