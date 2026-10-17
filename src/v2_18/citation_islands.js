    // A complete native reference before an unresolved boundary can retain its
    // identity while the literal citation name and accepted field names change.
    // Values, surrounding tags, list membership and prose stay exact. A later
    // complete section needs a separate, quotation-only structural witness.
    const V218_CITATION_ISLAND_CONTRACTS=Object.freeze({'citar web':48262420,'citar jornal':55834874,'citar livro':48159689,'citar revista':68628855,'citar periódico':48090957});
    const V218_CITATION_ISLAND_ENUMS=Object.freeze({'url-status':['dead','live'],'dead-url':['yes','no'],deadurl:['yes','no'],subscription:['yes'],registration:['yes'],'url-access':['registration','limited']});
    function v218CitationIslandScope(cfg={}) {
        return cfg.automaticCitationIslands!==false&&cfg.citations!==false&&cfg.references!==false&&cfg.partialSyntaxRecovery!==false&&
            cfg.namespaceNumber===0&&!cfg.discussionPage&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&
            !cfg.sectionOnly&&(cfg.section===undefined||cfg.section===null||cfg.section==='')&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&(!cfg.model||cfg.model==='wikitext');
    }
    function v218CitationCommentView(raw) {
        const ranges=[];let at=0;
        while((at=raw.indexOf('<!--',at))>=0){const close=raw.indexOf('-->',at+4);if(close<0||raw.slice(at+4,close).includes('<!--'))return null;ranges.push({start:at,end:close+3});at=close+3;}
        return {view:v24SyntaxMaskRanges(raw,ranges),ranges};
    }
    function v218CitationOriginalValues(raw,parts) {
        const values=[];
        for(const field of parts.slice(1)){const match=/^(\s*)([^=\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(raw.slice(2+field.start,2+field.end));if(!match)return null;const start=2+field.start+match[1].length+match[2].length+match[3].length;values.push(raw.slice(start,2+field.end));}
        return values;
    }
    function v218CitationIslandCall(raw,cfg={}) {
        const empty={text:raw,edits:[],rules:[]};
        if(cfg.citations===false||typeof raw!=='string')return empty;
        const comments=v218CitationCommentView(raw);if(!comments||!v215LiteralTemplateIdentity(comments.view))return empty;
        const parsed=v213NativeCitationFields(comments.view);if(!parsed||parsed.profile)return empty;
        const p=parsedTemplate(comments.view),target=CITE_NAMES[p.name],targetName=norm(target||'');
        if(!['citar web','citar jornal','citar livro','citar revista','citar periódico'].includes(targetName))return empty;
        const contract=TEMPLATE_CATALOG[targetName];if(!contract?.oldid||contract.oldid!==V218_CITATION_ISLAND_CONTRACTS[targetName])return empty;
        const fields=v24SyntaxParts(comments.view.slice(2,-2));if(!fields||fields.length<2||parsed.fields.length!==fields.length-1)return empty;
        const edits=[],families=new Set(),values=[],valueRanges=[];
        for(const field of fields.slice(1)){
            const match=/^(\s*)([^=\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(raw.slice(2+field.start,2+field.end));if(!match)return empty;
            const original=match[2].trim(),valueStart=2+field.start+match[1].length+match[2].length+match[3].length,valueEnd=2+field.end,value=raw.slice(valueStart,valueEnd);
            if(!/^[\p{L}\d _-]+$/u.test(original)||/[{}<>\uE000-\uF8FF]/.test(comments.view.slice(valueStart,valueEnd)))return empty;
            valueRanges.push({start:valueStart,end:valueEnd});
            let key=nativeCitationTitle(p)&&nativeCitationAccepts(p,original)?original:mappedParam(original,p.name);
            if(Object.hasOwn(V218_CITATION_ISLAND_ENUMS,norm(original))){if(!V218_CITATION_ISLAND_ENUMS[norm(original)].includes(norm(value))||!nativeCitationAccepts({name:targetName,parts:[target]},original))return empty;key=original;}
            if(!nativeCitationAccepts({name:targetName,parts:[target]},key))return empty;
            // Any alias collision, including an empty override, stays for the
            // established complete-page pipeline. No value is chosen here.
            const family=parameterFamily(key);if(families.has(family))return empty;families.add(family);values.push(value);
            if(key!==original){
                const leading=match[2].length-match[2].trimStart().length,trailing=match[2].match(/\s*$/)?.[0].length||0;
                const start=2+field.start+match[1].length+leading,end=2+field.start+match[1].length+match[2].length-trailing;
                edits.push({start,end,text:key,ruleId:'citationParameters'});
            }
        }
        if(comments.ranges.some(range=>!valueRanges.some(value=>value.start<=range.start&&range.end<=value.end)))return empty;
        const literal=p.parts[0],head=literal.trim();
        if(!nativeCitationTitle(p)&&head!==target){const leading=literal.length-literal.trimStart().length;edits.unshift({start:2+leading,end:2+leading+head.length,text:target,ruleId:'citationNames'});}
        if(!edits.length)return empty;
        edits.sort((a,b)=>a.start-b.start);
        const text=v24SyntaxApply(raw,edits),afterComments=v218CitationCommentView(text),check=afterComments&&v213NativeCitationFields(afterComments.view),afterParts=afterComments&&v24SyntaxParts(afterComments.view.slice(2,-2));
        if(!check||!afterParts||norm(check.target)!==targetName||JSON.stringify(v218CitationOriginalValues(text,afterParts))!==JSON.stringify(values))return empty;
        return {text,edits,rules:edits.map(edit=>edit.ruleId),contract:{title:contract.title,oldid:contract.oldid}};
    }
    function v218CitationQuoteDiagnostic(source) {
        let view='';
        for(let at=0;at<source.length;){const tag=v24SyntaxTag(source,at);if(tag){if(tag.raw.slice(1).includes('<')||tag.attrs.trim()&&!v24SyntaxAttrs(tag.attrs))return null;view+=tag.raw;at=tag.end;continue;}if(source[at]==='<'&&/^<\s*\/?\s*[a-z]/i.test(source.slice(at,at+40)))return null;view+=/["“”«»]/.test(source[at])?' ':source[at];at++;}
        return view;
    }
    function v218CitationIslandSegments(source,recovery) {
        const segments=[{start:0,end:recovery.end,kind:'complete-prefix'}],issues=recovery.unresolved;
        if(!issues.length||issues.some(issue=>!(issue.code==='syntax-opaque-unclosed'&&issue.kind==='quotation')&&issue.code!=='syntax-stray-link-close'))return segments;
        const diagnostic=v218CitationQuoteDiagnostic(source);if(diagnostic===null)return segments;
        const scan=v24SyntaxScan(diagnostic);
        if(scan.issues.length)return segments;
        const view=protectedView(diagnostic),headings=[];
        for(const match of view.matchAll(/^==[ \t]*([^=\r\n]+?)[ \t]*==[ \t]*(?:\r?\n|$)/gm)){
            if(match.index<recovery.end)continue;
            const context=v24SyntaxContext(diagnostic,match.index);
            if(Object.values(context).some(stack=>stack.length))continue;
            headings.push({start:match.index,title:match[1]});
        }
        for(let index=0;index<headings.length;index++){
            const head=headings[index],end=headings[index+1]?.start??source.length,raw=source.slice(head.start,end);
            if(/\b(?:sintaxe|exemplos?|c[oó]digo|marcadores?|predefini[cç][aã]o|etiquetas?|literais)\b/iu.test(head.title)||v24SyntaxScan(raw).issues.length)continue;
            segments.push({start:head.start,end,kind:'complete-section-after-prose-quotation'});
        }
        return segments;
    }
    function v218CitationIslandPlan(source,cfg={}) {
        const base={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,edits:[],text:source,boundary:source?.length??0,segments:[]};
        if(typeof source!=='string'||source.length>4194304||!v218CitationIslandScope(cfg)||!/<ref\b/i.test(source))return base;
        const recovery=syntaxRepairPrefix(source,cfg);
        if(recovery.text!==source||!recovery.unresolved.length||recovery.end<=0||recovery.end>=source.length)return base;
        const boundary=recovery.end,segments=v218CitationIslandSegments(source,recovery),edits=[],sourceHash=base.sourceHash;
        for(const segment of segments){
            // The original full-source quotation context is necessary here:
            // rescanning a truncated prefix can mistake a closing quote for a
            // fresh opener and hide otherwise complete earlier references.
            const originalContext=segment.kind==='complete-prefix',prefix=originalContext?source:source.slice(segment.start,segment.end),context=v24SyntaxReferences(prefix);
            const limit=originalContext?segment.end:prefix.length;
            if(context.unclosed.some(range=>range.start<limit)||context.empties.some(range=>range.start<limit)||context.shield.unclosed.some(range=>range.start<limit)||!originalContext&&v24SyntaxScan(prefix).issues.length)continue;
            const nodes=templates(context.view);
            if(nodes.unclosed.some(range=>range.start<limit)||/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(context.view.slice(0,limit)))continue;
            for(const ref of context.refs){
                if(ref.start<0||ref.end>limit)continue;
                if(ref.body===null||!ref.close||!ref.valid||ref.container||!v24SyntaxLiteralIdentity(ref.attrs,segment.kind==='complete-prefix')||ref.attrs.name&&!v29ReferenceName(ref.attrs.name)||ref.attrs.group&&!v29ReferenceName(ref.attrs.group))continue;
                if(!/^<ref\b/i.test(ref.raw)||!/^<\/ref\s*>$/i.test(ref.close.raw)||ref.typo||ref.close.typo)continue;
                if(nodes.nodes.some(node=>node.start<ref.start&&node.end>=ref.end))continue;
                const bodyStart=ref.close.start-ref.body.length;
                if(context.shield.ranges.some(range=>range.start<ref.end&&range.end>ref.start&&(range.start<bodyStart||range.end>ref.close.start)))continue;
                const raw=ref.body.trim(),leading=ref.body.length-ref.body.trimStart().length;
                if(!raw||ref.body.slice(leading+raw.length).trim())continue;
                const bodyNodes=templates(protectedView(raw));
                if(bodyNodes.unclosed.length||bodyNodes.nodes.length!==1||bodyNodes.nodes[0].start!==0||bodyNodes.nodes[0].end!==raw.length)continue;
                const call=v218CitationIslandCall(raw,cfg);if(!call.edits.length)continue;
                const proof={sourceHash,boundary,segment,referenceStart:segment.start+ref.start,referenceEnd:segment.start+ref.end,
                    opening:prefix.slice(ref.start,bodyStart),closing:ref.close.raw,
                    before:raw,after:call.text,contract:call.contract,templateRules:call.rules,
                    condition:'one complete sole literal native citation in a closed reference within an independently balanced prefix or later complete section; later sections require only prose-quotation diagnostic uncertainty and a fully balanced quotation-neutral diagnostic; values and reference tags retained exactly'};
                for(const edit of call.edits)edits.push({...edit,start:segment.start+bodyStart+leading+edit.start,end:segment.start+bodyStart+leading+edit.end,proof:{...proof,changeRules:[edit.ruleId]}});
            }
        }
        edits.sort((a,b)=>a.start-b.start);
        const text=v24SyntaxApply(source,edits);
        return {...base,boundary,segments,edits,text};
    }
    function v218CitationIslandProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v218CitationIslandPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits)&&fresh.boundary===plan.boundary&&JSON.stringify(fresh.segments)===JSON.stringify(plan.segments);
    }
    function automaticCitationIslands(source,cfg,bump=()=>{}) {
        const plan=v218CitationIslandPlan(source,cfg);for(const edit of plan.edits)bump(edit.ruleId);return plan.text;
    }
