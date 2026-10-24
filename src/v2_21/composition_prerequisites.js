    // These are existing transformations moved ahead of composition checks.
    // A changed reference identity, language field or populated collector value
    // cannot use this proof. Attribute URLs remain identities, never source URLs.
    function v221IntegrationScope(source,cfg={}) {
        return typeof source==='string'&&source.length<=4194304&&cfg.namespaceNumber===0&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&!cfg.sectionOnly&&!cfg.discussionPage&&
            !cfg.pageRedirect&&!cfg.pageDisambiguation&&cfg.references!==false&&cfg.markup!==false;
    }
    function v221IntegrationPrefixEnd(source) {
        const scan=v24SyntaxScan(source);
        if(!scan.issues.length)return source.length;
        const first=scan.issues.reduce((at,issue)=>Math.min(at,issue.start),source.length);
        return scan.boundaries.filter(at=>at<=first).at(-1)||0;
    }
    function v221ReferenceQuoteEdits(source,cfg={}) {
        if(!v221IntegrationScope(source,cfg)||!/<ref\b[^<>]*\b(?:name|group)\s*=\s*[^\s"']/i.test(source))return [];
        const shield=v24SyntaxProtected(source),blocked=[...shield.ranges,...v219MarkdownLiteralRanges(source),
            ...v219QuotedTemplateRanges(source),...v219WholeQuotedCodeRanges(source),...structuralQuoteRanges(source)],
            nodes=templates(shield.view).nodes,prefixEnd=v221IntegrationPrefixEnd(source),edits=[];
        if(malformedRefs(shield.view))return [];
        for(const ref of refTokens(shield.view)){
            const tag=v24SyntaxTag(source,ref.start);
            if(!tag||tag.end>prefixEnd||tag.name!=='ref'||tag.close||tag.typo||blocked.some(r=>r.start<tag.end&&r.end>tag.start)||
                nodes.some(n=>n.start<=tag.start&&n.end>=tag.end))continue;
            const attrs=v24SyntaxAttrs(tag.attrs);
            if(!v24SyntaxLiteralIdentity(attrs)||Object.values(attrs).some(v=>!v||v!==v.trim()||v.length>240||/[`\\]/.test(v)))continue;
            const base=tag.start+tag.raw.indexOf(tag.attrs),local=[];
            for(const m of tag.attrs.matchAll(/\s+(name|group)\s*=\s*([^\s"'=<>`]+)/gi)){
                const key=m[1].toLowerCase(),value=m[2];
                if(attrs[key]!==value||/[{}\[\]|&]/.test(value))continue;
                const start=base+m.index+m[0].lastIndexOf(value);
                local.push({start,end:start+value.length,text:'"'+value+'"',ruleId:'v221ReferenceAttributeQuote',
                    proof:{sourceHash:v24SyntaxHash(source),name:attrs.name??'',group:attrs.group??'',
                        value,tagStart:tag.start,nativeMeaning:'same literal Cite name/group; closing slash is tag syntax'}});
            }
            if(!local.length)continue;
            const raw=v24SyntaxApply(tag.raw,local.map(e=>({...e,start:e.start-tag.start,end:e.end-tag.start}))),
                check=v24SyntaxTag(raw,0),after=check&&v24SyntaxAttrs(check.attrs);
            if(!check||check.end!==raw.length||check.self!==tag.self||!after||
                JSON.stringify({...attrs})!==JSON.stringify({...after}))continue;
            edits.push(...local);
        }
        return edits.sort((a,b)=>a.start-b.start||a.end-b.end);
    }
    function v221EmptyCollectorPrerequisiteEdits(source,cfg={}) {
        if(!v221IntegrationScope(source,cfg)||cfg.automaticParameterNames===false||
            !/\{\{\s*(?:Refer[êe]ncias?|Notas e refer[êe]ncias)[\s|}]/i.test(source)||!/[|][^|{}]*=[ \t\r\n]*(?:[|}]|$)/.test(source))return [];
        const shield=v24SyntaxProtected(source),nodes=templates(shield.view).nodes,prefixEnd=v221IntegrationPrefixEnd(source),edits=[];
        for(const node of nodes.filter(n=>n.depth===0)){
            if(node.end>prefixEnd)continue;
            if(shield.ranges.some(r=>r.start<node.end&&r.end>node.start))continue;
            const owner=v24SyntaxContext(shield.view,node.start);
            if(owner.templates.length||owner.links.length||owner.external.length||owner.tables.length||owner.html.length)continue;
            const raw=source.slice(node.start,node.end),p=parsedTemplate(raw);
            if(!['referências','referencias','notas e referências'].includes(p.name))continue;
            const entries=foreignEntries(p),remove=[];
            // Native Referências 63785697 has an explicit closed parameter
            // interface. Positional fields and every supported alias remain.
            const known=new Set(['1','2','3','grupo','group','refs','referências','referencias','nível','nivel',
                'título','titulo','largura','col','colunas','estilo','estilolista','listaestilo','liststyle']);
            for(let index=0;index<entries.length;index++){
                const entry=entries[index];
                if(entry.positional||entry.value.trim()||!entry.key||known.has(norm(entry.key))||
                    /[{}\[\]<>|"'`\\\r\n]/.test(entry.key)||!/^\s*[^=]+=[ \t\r\n]*$/.test(p.parts[index+1]))continue;
                remove.push(index+1);
            }
            if(!remove.length)continue;
            const text='{{'+p.parts.filter((_,index)=>!remove.includes(index)).join('|')+'}}';
            edits.push({start:node.start,end:node.end,text,ruleId:'v221EmptyCollectorArgument',count:remove.length,
                proof:{sourceHash:v24SyntaxHash(source),nativeOldid:63785697,
                    removed:remove.map(index=>p.parts[index]),retained:p.parts.filter((_,index)=>!remove.includes(index)),
                    condition:'only unsupported literal empty named arguments; all other parts are byte-identical'}});
        }
        return edits;
    }
    function v221IntegrationPrerequisitePlan(source,cfg={}) {
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,edits:[],stages:[]};
        for(const [name,find]of [['reference-attributes',v221ReferenceQuoteEdits],['empty-collector',v221EmptyCollectorPrerequisiteEdits]]){
            const before=plan.text,edits=find(before,cfg);
            if(!edits.length)continue;
            const after=v24SyntaxApply(before,edits);
            plan.stages.push({name,before,after,edits});plan.edits.push(...edits);plan.text=after;
        }
        return plan;
    }
    function v221IntegrationPrerequisiteProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v221IntegrationPrerequisitePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.stages)===JSON.stringify(plan.stages);
    }
