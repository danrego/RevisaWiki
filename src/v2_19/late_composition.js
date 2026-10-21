    // Existing local repairs can become eligible only after the legacy
    // normalizer removes an identical duplicate field or names a reference.
    // Replay only these finite plans, never the whole editing pipeline.
    function v219CitationArchiveDecompositionAllowed(raw,cfg={}) {
        const context=v218CitationNativeContext(raw),fields=v2151FieldSyntaxParts(raw);
        if(!context||!fields||!v215LiteralTemplateIdentity(raw)||cfg.citations===false)return false;
        const entries=foreignEntries(parsedTemplate(raw));
        if(entries.some(field=>field.positional))return false;
        if(entries.some(field=>v219NativeCitationRoles(field.key).some(role=>['ArchiveURL','ArchiveDate'].includes(role))))return false;
        const urls=entries.filter(field=>nativeCitationAccepts(context.native,field.key)&&
            JSON.stringify(v219NativeCitationRoles(field.key))===JSON.stringify(['URL']));
        if(urls.length!==1)return false;
        const archived=/^https?:\/\/web\.archive\.org\/web\/(\d{8})(?:\d{6})?(?:id_|if_)?\/(https?:\/\/[^\s{}<>]+)$/i.exec(urls[0].value.trim());
        return false;
    }
    function v219LateReferenceCandidate(source) {
        if(!/<ref\b[^>]*\bname\s*=/i.test(source))return false;
        let previous=null;
        for(const ref of refTokens(protectedView(source))){
            const attrs=attrsOf(ref.attrs),valid=attrs?.name&&Object.keys(attrs).every(key=>['name','group'].includes(key));
            if(valid&&previous&&attrs.name===previous.attrs.name&&
                (attrs.group||'')===(previous.attrs.group||'')&&/^[ \t]*$/.test(source.slice(previous.end,ref.start)))return true;
            previous=valid?{...ref,attrs}:null;
        }
        return false;
    }
    function v219LateNamedDefinitionCandidate(source) {
        if(!/<ref\b[^>]*\bname\s*=/i.test(source))return false;
        const bodies=new Set();
        for(const ref of refTokens(protectedView(source))){
            const attrs=attrsOf(ref.attrs);
            if(ref.body===null||!ref.body.trim()||!attrs?.name)continue;
            // This is only a cheap trigger. The complete fresh native repair
            // plan and its existing proof still decide body equivalence.
            const key=JSON.stringify([attrs.group||'',ref.body.trim().replace(/\s+/g,' ')]);
            if(bodies.has(key))return true;bodies.add(key);
        }
        return false;
    }
    // Read-only canonicalization for the exact adjacent-call stage that can
    // become eligible after anonymous definitions receive a name. Do not
    // invoke calculate, the late transaction or its composition guard here.
    function v219LateAdjacentReferenceProjection(source,cfg={}) {
        if(cfg.references===false||cfg.automaticReferenceRepairs===false||!v219LateReferenceCandidate(source))return source;
        const edits=v219StageSafeEdits(source,v25SafeAdjacentReferenceEdits(source),
            'consecutive-named-reference-calls',cfg);
        return v24SyntaxApply(source,edits);
    }
    function v219LateTableScopePlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.namespaceNumber!==0||cfg.sectionOnly||
            cfg.discussionPage||cfg.pageRedirect||cfg.pageDisambiguation||cfg.tableChecks===false||
            cfg.automaticTableRepairs===false||cfg.tableAccessibility===false||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||!source.includes('{|')||!source.includes('!'))return empty;
        const analysis=tableAnalysis(source),candidates=analysis.repairs.filter(repair=>repair.rule==='tableHeaderScopes'&&
                v219TableAutomaticRepairAllowed(repair,source,analysis))
            .map(repair=>({start:repair.start,end:repair.end,text:repair.after,ruleId:'tableHeaderScopes',
                proof:{sourceHash:empty.sourceHash,changeRules:['tableHeaderScopes'],minorSafe:true,
                    method:'existing explicit simple-table header scope rule, selected alone after literal normalization'}})),
            edits=v219StageSafeEdits(source,candidates,'v219-late-table-scopes',cfg);
        if(!edits.length||edits.some(edit=>edit.start!==edit.end||!/^ scope="(?:col|row)" \|?$/.test(edit.text)))return empty;
        const text=v24SyntaxApply(source,edits),next=tableAnalysis(text),grid=report=>JSON.stringify(report.tables.map(table=>
            [table.closed,table.nested,table.dynamic,table.rows,table.cells,table.width,table.irregular])),
            errors=report=>report.findings.filter(finding=>finding.severity==='error').map(finding=>finding.code).sort();
        if(analysis.count!==next.count||grid(analysis)!==grid(next)||JSON.stringify(errors(analysis))!==JSON.stringify(errors(next)))return empty;
        // The independent literal-table inventory keeps the order, payload,
        // captions and all existing attributes, while canonicalizing only
        // these already proved scope insertions on explicit header cells.
        if(JSON.stringify(v272TableInventories(source,cfg))!==JSON.stringify(v272TableInventories(text,cfg)))return empty;
        return {...empty,text,edits};
    }
    function v219LateTableScopeProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219LateTableScopePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219LateLiteralPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,steps:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.namespaceNumber!==0||cfg.sectionOnly||
            cfg.pageRedirect||cfg.pageDisambiguation||cfg.discussionPage||cfg.contentModel&&cfg.contentModel!=='wikitext')return empty;
        const recovery=syntaxRepairPrefix(source,cfg);
        if(recovery.unresolved.length&&recovery.end===0)return empty;
        const tail=recovery.unresolved.length?source.slice(recovery.end):'',plan={...empty};
        const take=(name,transaction,proof)=>{
            const before=plan.text;
            if(!transaction.edits.length||!proof(before,transaction.text,transaction,cfg))return;
            const limit=before.length-tail.length,edits=v219StageSafeEdits(before,transaction.edits,name,cfg)
                .filter(edit=>edit.end<=limit);
            if(!edits.length)return;
            const after=v24SyntaxApply(before,edits);
            if(tail&&!after.endsWith(tail))return;
            plan.steps.push({name,before,after,edits});plan.text=after;
        };
        take('v219-citation-empty-parts',v219CitationEmptyPartsPlan(plan.text,cfg),v219CitationEmptyPartsProof);
        take('v219-source-compatibility',v219SourceCompatibilityPlan(plan.text,cfg),v219SourceCompatibilityProof);
        const fields=v213ReferenceFieldPlan(plan.text,cfg);
        if(fields.edits.length&&fields.edits.every(edit=>edit.ruleId==='v213URLQuotes'&&edit.proof?.role==='url:URL'&&
            JSON.stringify(edit.proof.changeRules)==='["v213URLQuotes"]'))
            take('v213-reference-fields',fields,v213ReferenceFieldProof);
        take('v219-native-protocol',v219CitationProtocolPlan(plan.text,cfg),v219CitationProtocolProof);
        take('v218-citation-date-values',v218CitationDatePlan(plan.text,cfg),v218CitationDateProof);
        take('v219-native-age',v219NativeAgePlan(plan.text,cfg),v219NativeAgeProof);
        take('v28-biography-dates',v28BiographyDatePlan(plan.text,cfg),v28BiographyDateProof);
        take('v219-late-biography-dates',v219LateBiographyDatePlan(plan.text,cfg),v219LateBiographyDateProof);
        take('v219-identical-biography-date-aliases',v219BiographyDateAliasPlan(plan.text,cfg),v219BiographyDateAliasProof);
        take('v219-late-occupation-values',v219LateOccupationPlan(plan.text,cfg),v219LateOccupationProof);
        take('v219-late-marriage',v219LateMarriagePlan(plan.text,cfg),v219LateMarriageProof);
        take('v219-late-table-scopes',v219LateTableScopePlan(plan.text,cfg),v219LateTableScopeProof);
        if(cfg.references!==false&&cfg.automaticReferenceRepairs!==false&&
            (v219LateReferenceCandidate(plan.text)||cfg.automaticIdenticalReferences!==false&&v219LateNamedDefinitionCandidate(plan.text))){
            const before=plan.text,fresh=v25SafeRepairPlan(before,cfg),allowed=new Set([
                'v27-references','consecutive-named-reference-calls','v29-reference-repairs'
            ]);
            if(v25SafeRepairEquivalence(before,fresh.text,fresh,cfg))for(const step of fresh.steps){
                if(step.before!==plan.text||!allowed.has(step.name))break;
                const limit=step.before.length-tail.length;
                if(step.edits.some(edit=>edit.end>limit)||tail&&!step.after.endsWith(tail))break;
                plan.steps.push(step);plan.text=step.after;
            }
        }
        return plan;
    }
    function v219LateLiteralProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219LateLiteralPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);
    }
    function v219LateLiteralCleanup(source,cfg={},bump=()=>{}) {
        const plan=v219LateLiteralPlan(source,cfg);
        for(const step of plan.steps)for(const edit of step.edits){
            const rules=Array.isArray(edit.proof?.changeRules)?edit.proof.changeRules:[edit.ruleId];
            for(const rule of rules)bump(rule);
        }
        return plan.text;
    }
    function v219TrailingProseSpacePlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.markup===false||cfg.namespaceNumber!==0||cfg.sectionOnly||
            cfg.pageRedirect||cfg.pageDisambiguation||cfg.discussionPage||cfg.contentModel&&cfg.contentModel!=='wikitext'||
            !/[\t ]+(?:\r?\n|$)/.test(source))return empty;
        const recovery=syntaxRepairPrefix(source,cfg),limit=recovery.unresolved.length?recovery.end:source.length;
        if(!limit)return empty;
        const prefix=source.slice(0,limit),index=v210StructuralIndex(prefix),
            hard=v219StageProtectedRanges(prefix,cfg),ranges=[...hard,...v219ProtectedSyntax(prefix).ranges,...index.templates.nodes,...index.references,
                ...index.tables,...index.collectors,...proseRanges(protectedView(prefix))],stack=[];
        // Retain layout, code and paired HTML containers. A complete ref ends
        // before the inter-tag or end-of-line spacing that may be removed.
        for(let at=prefix.indexOf('<');at>=0;){
            const opaque=hard.find(range=>range.start<=at&&at<range.end);
            if(opaque){at=prefix.indexOf('<',opaque.end);continue;}
            const tag=v24SyntaxTag(prefix,at);
            if(!tag){at=prefix.indexOf('<',at+1);continue;}
            if(tag.close){const opening=stack.pop();if(!opening||opening.name!==tag.name)return empty;
                ranges.push({start:opening.start,end:tag.end});}
            else if(!tag.self&&!['br','hr','wbr','img','meta','link','input','source','track','area','base','col','embed','param'].includes(tag.name))stack.push(tag);
            at=prefix.indexOf('<',tag.end);
        }
        if(stack.length)return empty;
        const edits=[];
        for(const match of prefix.matchAll(/[\t ]+(?=\r?\n|$)/g)){
            const start=match.index,end=start+match[0].length,lineStart=prefix.lastIndexOf('\n',start-1)+1;
            // A parser prefix is not the end of the actual document. The
            // space before its unresolved tag or delimiter remains internal.
            if(end===prefix.length&&limit<source.length&&!/^\r?\n/.test(source.slice(end)))continue;
            if(ranges.some(range=>range.start<end&&start<range.end)||
                !v218ProseGapPlainLine(prefix,lineStart,end,index))continue;
            edits.push({start,end,text:'',ruleId:'markup',proof:{sourceHash:empty.sourceHash,
                before:match[0],completePrefixEnd:limit,changeRules:['markup'],minorSafe:true,
                method:'only trailing ASCII spaces on a proved ordinary prose line; all inline reference bytes, literal owners, containers and unresolved tail retained'}});
        }
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219TrailingProseSpaceProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219TrailingProseSpacePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219FinalLocalCleanup(source,cfg={},bump=()=>{}) {
        const cosmetic=v219PinnedNativeParameterSource(source,cfg,bump),
            literal=v219LateLiteralCleanup(cosmetic,cfg,bump),spaces=v219TrailingProseSpacePlan(literal,cfg);
        spaces.edits.forEach(edit=>bump(edit.ruleId));return spaces.text;
    }
