    // Collector names and a single coherent note group are canonicalized only
    // from complete, literal source calls. A second group keeps its identity.
    function v2215ReferenceCollectorScope(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options});
        return typeof source==='string'&&source.length<=4194304&&cfg.references!==false&&
            (cfg.namespaceNumber===0||v2215ArticleDraftContext(cfg,source))&&!cfg.sectionOnly&&!cfg.discussionPage&&!cfg.pageRedirect&&
            !cfg.pageDisambiguation&&(!cfg.contentModel||cfg.contentModel==='wikitext')&&
            !v20DefinitionContext(cfg)&&v20AutomationAllowed(source,cfg);
    }
    function v2215ReferenceCollectorRows(source) {
        const view=protectedView(source),parsed=templates(view),rows=[],hard=[
            ...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),
            ...v219QuotedTemplateRanges(source,false)];
        const outside=(start,end)=>!hard.some(r=>r.start<end&&start<r.end);
        const standalone=(start,end)=>{
            const a=source.lastIndexOf('\n',start-1)+1,z=source.indexOf('\n',end),b=z<0?source.length:z;
            if(/[^ \t\r]/.test(source.slice(a,start)+source.slice(end,b)))return false;
            const c=v24SyntaxContext(view,start);
            return !['templates','html','tables','links','external'].some(k=>c[k]?.length)&&outside(start,end);
        };
        const preceding=(start)=>{
            const match=source.slice(0,start).match(/(?:^|\n)(={2,6})[ \t]*(Referências|Referencias|References|Notas|Notes|Notas e referências)[ \t]*\1[ \t]*\r?\n[ \t\r\n]*$/i);
            return match?{start:match.index+(match[0][0]==='\n'?1:0),end:start,level:match[1].length,
                name:norm(match[2]),raw:match[0]}:null;
        };
        const typos=new Set(['refereencias','referên cias','referéncias','referênçias','referncias','referênicas','refrências']);
        for(const node of topNodes(view)){
            const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),head=v215TemplateTitle(p.parts[0]),
                key=norm(head),alias=v219NativeReferenceCollectorAlias(head)||/^[Ll]istaref$/.test(head),notes=/^[Nn]otas$/.test(head),
                notelist=/^[Nn]otelist$|^[Ll]istanota$/.test(head),reflist=/^[Rr]eflist$/.test(head),
                combined=/^[Nn]otas e referências$/.test(head)||head==='Notas e Referências'&&p.parts.length===1,typo=typos.has(key);
            if(!alias&&!notes&&!notelist&&!reflist&&!combined&&!typo||!standalone(node.start,node.end))continue;
            if(!v219OriginalTemplateHeaderAllowed(p.parts[0]))continue;
            const entries=foreignEntries(p),selected=k=>entries.filter(e=>!e.positional&&e.key===k).at(-1),
                groupField=reflist||notelist?(selected('group')||selected('grupo')):selected('grupo');
            const group=notelist?(groupField&&['nota','upper-alpha','upper-roman','lower-alpha','lower-greek','lower-roman'].includes(groupField.value.trim())?groupField.value.trim():'lower-alpha'):
                groupField?.value.trim()??(notes?'nota':combined?'Nota':'');
            if(group&&!v29ReferenceName(group)||groupField&&/[{}<>\[\]&|\r\n]/.test(groupField.value))continue;
            const heading=preceding(node.start),plain=entries.length===0||entries.every(e=>!e.positional&&e.key===(reflist||notelist?'group':'grupo'))&&entries.length===1;
            // An unknown misspelling gets no invented parameter interface.
            if(typo&&entries.length)continue;
            rows.push({...node,raw,head,key,group,kind:combined?'combined':notes||notelist||group&&heading&&['notas','notes'].includes(heading.name)?'notes':'references',
                alias:!!alias,typo,reflist,notelist,entries,plain,heading,native:false});
        }
        for(let at=view.indexOf('<');at>=0&&at<view.length;){
            const tag=v24SyntaxTag(view,at);if(!tag){at=view.indexOf('<',at+1);continue;}at=view.indexOf('<',tag.end);
            if(tag.name!=='references'||tag.close||tag.typo)continue;
            const attrs=v24SyntaxAttrs(tag.attrs);if(!attrs||Object.keys(attrs).some(k=>k!=='group')||
                Object.values(attrs).some(v=>v&&!v29ReferenceName(v)))continue;
            let end=tag.end;
            if(!tag.self){const close=/^\s*<\s*\/\s*references\s*>/i.exec(source.slice(tag.end));if(!close)continue;end=tag.end+close[0].length;}
            if(!standalone(tag.start,end))continue;
            const heading=preceding(tag.start),group=attrs.group??'';
            rows.push({start:tag.start,end,raw:source.slice(tag.start,end),head:'references',key:'references',group,
                kind:group&&heading&&['notas','notes'].includes(heading.name)?'notes':'references',
                native:true,plain:true,heading,entries:[]});
        }
        return {view,parsed,rows:rows.sort((a,b)=>a.start-b.start),outside};
    }
    function v2215ReferenceVisibleGroups(source) {
        const observed=v219NativeReferenceObserver(source),groups=new Set();
        if(observed.unclosed.length||observed.empties.length||observed.refs.some(r=>!r.valid))return null;
        for(const ref of observed.refs)if(ref.group)groups.add(ref.group);
        for(const helper of observed.helpers){
            if(helper.attributeScope)return null;
            if(helper.helperKind==='generated-note'){if(helper.nativeGroup)groups.add(helper.nativeGroup);continue;}
            if(helper.helperKind!=='note')return null;
            for(const call of helper.calls||[])if(call.group)groups.add(call.group);
        }
        return groups;
    }
    function v2215ReferenceObservedProducers(source,scan,helpers) {
        for(const node of scan.parsed.nodes){
            const raw=source.slice(node.start,node.end);
            if(scan.rows.some(r=>r.start===node.start&&r.end===node.end)||
                helpers.some(h=>h.start===node.start&&h.end===node.end)||
                v219NativeCitationStateInterface(raw)||v2111ReferenceFreeTemplate(raw))continue;
            return false;
        }
        return true;
    }
    function v2215ReferenceSingleGroupPlan(source,cfg={}) {
        const empty={source,sourceHash:v24SyntaxHash(source),text:source,edits:[],group:null};
        if(cfg.unifiedNotesReferences===false||v24SyntaxScan(source).issues.length||/\{\{\{/.test(source))return empty;
        const scan=v2215ReferenceCollectorRows(source),notes=scan.rows.filter(r=>r.kind==='notes'&&r.plain);
        if(notes.length!==1||!notes[0].group||notes[0].group==='nota')return empty;
        const group=notes[0].group;
        // Native alphabetic/roman groups have an explicit numbering style.
        if(['lower-alpha','upper-alpha','lower-roman','upper-roman','lower-greek','Nota','nt'].includes(group))return empty;
        const observed=v219NativeReferenceObserver(source);
        if(observed.unclosed.length||observed.empties.length||observed.refs.some(r=>!r.valid||!r.attrs||
            Object.keys(r.attrs).some(k=>!['name','group'].includes(k))))return empty;
        const used=new Set(observed.refs.map(r=>r.group).filter(Boolean)),edits=[];
        if(scan.rows.some(r=>r.kind==='combined'||r.group&&r.group!==group))return empty;
        for(const ref of observed.refs){
            if(ref.group!==group)continue;
            const tag=v24SyntaxTag(source,ref.start);
            if(!tag||!scan.outside(tag.start,tag.end)||ref.container)return empty;
            const attrs=v24SyntaxAttrs(tag.attrs);
            if(attrs?.group!==group)return empty;
            const text=tag.raw.replace(/(\bgroup\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,
                (all,p,a,b,c)=>a===group?p+'"nota"':b===group?p+"'nota'":c===group?p+'nota':tag.self&&c===group+'/'?p+'nota/':all);
            if(text===tag.raw)return empty;
            edits.push({start:tag.start,end:tag.end,text,kind:'single-note-group'});
        }
        const helpers=v219NativeNoteProfiles(source);
        for(const helper of helpers){
            if(helper.attributeScope)return empty;
            if(helper.helperKind==='generated-note'){
                if(helper.nativeGroup)used.add(helper.nativeGroup);
                continue;
            }
            if(helper.helperKind!=='note')return empty;
            const raw=source.slice(helper.start,helper.end),p=parsedTemplate(raw),head=v215TemplateTitle(p.parts[0]),
                isRefn=/^[Rr]efn$/.test(head)||/^#tag\s*:\s*ref$/.test(head);
            if(!isRefn){for(const call of helper.calls||[])if(call.group)used.add(call.group);continue;}
            const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts||!scan.outside(helper.start,helper.end))return empty;
            const groups=[];let next=1,index=0;
            for(const part of parts.slice(1)){
                if(/^#tag\s*:\s*ref$/.test(head)&&index++===0)continue;
                const m=/^([ \t\r\n]*)([^=\n{}<>]+?)([ \t\r\n]*)=([\s\S]*)$/.exec(part.text);
                if(!m){if(next++>1)return empty;continue;}
                const key=m[2].trim();if(!['1','refn','group','name'].includes(key))return empty;
                if(key==='group')groups.push({part,m,value:m[4].trim()});
            }
            if(groups.length>1)return empty;
            if(!groups.length)continue;
            const field=groups[0];if(!v29ReferenceName(field.value)||/[{}<>\[\]&|\r\n]/.test(field.m[4]))return empty;
            if(field.value)used.add(field.value);
            if(field.value!==group)continue;
            const value=field.m[4],pad=value.match(/^(\s*)[\s\S]*?(\s*)$/),at=helper.start+2+field.part.start+field.part.text.indexOf('=')+1;
            edits.push({start:at,end:helper.start+2+field.part.end,text:pad[1]+'nota'+pad[2],kind:'single-note-group'});
        }
        if(used.size!==1||!used.has(group)||!edits.length)return empty;
        // Every literal occurrence of the old identity belongs to an observed
        // group field. Unknown templates with such a field retain the group.
        for(const node of scan.parsed.nodes){
            const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),entries=foreignEntries(p);
            if(!entries.some(e=>!e.positional&&['group','grupo'].includes(e.key)&&e.value.trim()===group))continue;
            if(scan.rows.some(r=>r.start===node.start&&r.end===node.end)||helpers.some(h=>h.start===node.start&&h.end===node.end&&h.helperKind==='note'))continue;
            return empty;
        }
        if(!v2215ReferenceObservedProducers(source,scan,helpers))return empty;
        const row=notes[0],text='{{Notas}}';
        edits.push({start:row.start,end:row.end,text,kind:'single-note-collector'});
        const sorted=edits.slice().sort((a,b)=>a.start-b.start||a.end-b.end);
        if(sorted.some((e,i)=>i&&e.start<sorted[i-1].end))return empty;
        return {...empty,group,edits:sorted,text:v24SyntaxApply(source,sorted)};
    }
    function v2215ReferenceCollectorPlan(source,options={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};
        if(!v2215ReferenceCollectorScope(source,options))return empty;
        const cfg=pageContextOptions({...DEFAULTS,...options}),steps=[];let text=source;
        const stage=(name,edits)=>{if(!edits.length)return;const before=text,next=v24SyntaxApply(before,edits);
            if(next!==before){steps.push({name,sourceHash:v24SyntaxHash(before),edits,text:next});text=next;}};
        const group=v2215ReferenceSingleGroupPlan(text,cfg);stage('single-note-group',group.edits);
        const scan=v2215ReferenceCollectorRows(text),edits=[],visibleGroups=v2215ReferenceVisibleGroups(text),
            customNote=cfg.unifiedNotesReferences!==false&&scan.rows.filter(r=>r.kind==='notes').length===1&&
                visibleGroups?.size===1?[...visibleGroups][0]:null;
        for(const row of scan.rows){
            if(row.kind==='combined'){
                if(row.head==='Notas e Referências'&&row.entries.length===0)edits.push({start:row.start,end:row.end,text:'{{Notas e referências}}',kind:'preferred-reference-collector'});
                continue;
            }
            if(row.kind==='notes'&&row.group!=='nota'&&(row.alias||row.reflist)&&row.group!==customNote)continue;
            let target=null;
            if(row.kind==='notes'&&row.group===customNote&&!['nota','lower-alpha'].includes(row.group)&&row.plain)target='{{Notas|grupo='+row.group+'}}';
            else if(row.native){
                if(row.kind==='notes'&&row.group!=='nota'&&row.group!==customNote)continue;
                target=row.kind==='notes'?'{{Notas'+(!['nota','lower-alpha'].includes(row.group)?'|grupo='+row.group:'')+'}}':'{{Referências'+(row.group?'|grupo='+row.group:'')+'}}';
            }else if(row.alias||row.typo){
                const p=parsedTemplate(row.raw);target='{{Referências'+row.raw.slice(2+p.parts[0].length);
            }else if(row.kind==='notes'&&!row.notelist){
                const p=parsedTemplate(row.raw);target='{{Notas'+row.raw.slice(2+p.parts[0].length);
            }else if(row.notelist&&row.plain&&['nota','lower-alpha'].includes(row.group))target='{{Notas}}';
            else if(row.reflist&&row.plain)target='{{Referências'+(row.group?'|grupo='+row.group:'')+'}}';
            if(!target)continue;
            let start=row.start;
            const sameHeading=row.kind==='notes'?['notas','notes'].includes(row.heading?.name):
                ['referências','referencias','references'].includes(row.heading?.name);
            if(row.plain&&sameHeading){
                if(cfg.headings!==false&&cfg.automaticReferenceCollectorHeadings!==false){
                    start=row.heading.start;
                    if(row.heading.level!==2)target=target.slice(0,-2)+'|nível='+row.heading.level+'}}';
                }else if(row.native||row.reflist||row.notelist)target=target.slice(0,-2)+'|nível=0}}';
            }
            if((cfg.headings===false||cfg.automaticReferenceCollectorHeadings===false)&&
                (row.native||row.reflist||row.notelist||row.typo)&&!target.includes('|nível='))
                target=target.slice(0,-2)+'|nível=0}}';
            if(start!==row.start||target!==row.raw)edits.push({start,end:row.end,text:target,kind:'preferred-reference-collector'});
        }
        stage('preferred-collectors',edits);
        const peers=v2215ReferenceCollectorRows(text).rows,duplicates=[],emptyLayout=row=>row.plain||
            (row.alias||row.kind==='notes'&&!row.notelist)&&row.entries.length>0&&
            row.entries.every(e=>!e.positional&&(e.key==='grupo'||['nível','nivel'].includes(e.key)&&e.value.trim()==='0'))&&
            new Set(row.entries.map(e=>e.key==='nivel'?'nível':e.key)).size===row.entries.length;
        for(let index=1;index<peers.length;index++){
            const a=peers[index-1],b=peers[index];
            if(a.raw===b.raw&&emptyLayout(a)&&emptyLayout(b)&&a.kind===b.kind&&a.group===b.group&&
                !a.native&&!b.native&&!text.slice(a.end,b.start).trim())
                duplicates.push({start:b.start,end:b.end,text:'',kind:'duplicate-empty-collector'});
        }
        stage('duplicate-collectors',duplicates);
        if(cfg.unifiedNotesReferences!==false&&!v219ReferenceCollectorTargeted(text)){
            const current=v2215ReferenceCollectorRows(text),notes=current.rows.filter(r=>r.kind==='notes'&&r.plain),
                refs=current.rows.filter(r=>r.kind==='references'&&!r.group&&r.plain);
            if(current.rows.length===2&&notes.length===1&&refs.length===1&&notes[0].start<refs[0].start&&
                !text.slice(notes[0].end,refs[0].start).trim()){
                const observed=v219NativeReferenceObserver(text),custom=!['nota','lower-alpha'].includes(notes[0].group),
                    visible=v2215ReferenceVisibleGroups(text),groups=new Set(custom?['',notes[0].group]:['','nota','lower-alpha']);
                if(custom&&(!visible||visible.size!==1||!visible.has(notes[0].group)))return {...empty,text,steps,edits:steps.flatMap(s=>s.edits)};
                if(!observed.unclosed.length&&!observed.empties.length&&observed.refs.every(r=>r.valid&&groups.has(r.group))&&
                    observed.helpers.every(h=>(h.helperKind==='generated-note'?groups.has(h.nativeGroup||''):
                        h.calls?.every(c=>groups.has(c.group||'')))))
                    {
                    const heading=notes[0].heading,hasCombinedHeading=heading?.name==='notas e referências';
                    if(!hasCombinedHeading||heading.level===2)stage('unified-notes-references',[{start:hasCombinedHeading?heading.start:notes[0].start,end:refs[0].end,text:'{{Notas e referências'+(custom?'|grupo='+notes[0].group:'')+'}}',kind:'unified-note-collector'}]);
                }
            }
        }
        return {...empty,text,steps,edits:steps.flatMap(s=>s.edits)};
    }
    function v2215ReferenceCollectorProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2215ReferenceCollectorPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&
            JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
