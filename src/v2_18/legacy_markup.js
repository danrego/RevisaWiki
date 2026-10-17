    // Finite source mistakes are repaired only in active top-level markup.
    // Real templates with arguments and literal examples retain their bytes.
    // Bibliografia 60819487 invokes citeItem in module 60819166: a missing
    // argument 1 returns nil before any entity or current-page lookup.
    function v218LegacyMarkupScope(source,options={}) {
        const cfg={...DEFAULTS,...options};
        return typeof source==='string'&&source.length<=4194304&&cfg.automaticLegacyMarkup!==false&&
            v24SyntaxScope(cfg)&&cfg.namespaceNumber===0&&!cfg.sectionOnly&&!cfg.discussionPage&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&v20AutomationAllowed(source,cfg)&&
            !v24SyntaxScan(source).issues.length;
    }
    function v218LegacyMarkupEdits(source,options={}) {
        if(typeof source!=='string'||!(/[.,;:!?][ \t]+<ref\b/i.test(source)||/<br[ \t]*\\[ \t]*>/i.test(source)||/^={2,6}[ \t]*\{\{[ \t]*(?:Ligaç|Ver|Bibliografia)/m.test(source)))return [];
        const cfg={...DEFAULTS,...options};if(!v218LegacyMarkupScope(source,cfg))return [];
        const shield=v24SyntaxProtected(source),view=shield.view,index=v210StructuralIndex(source),sourceHash=v24SyntaxHash(source),edits=[],tags=[];
        if(shield.unclosed.length||index.templates.unclosed.length||/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(view))return [];
        for(let at=0;at<source.length;){const tag=tagAt(source,at);if(tag){tags.push({start:tag.start,end:tag.end});at=tag.end;}else at++;}
        const enclosing=[...shield.ranges,...index.templates.nodes,...index.tables,...index.references,...index.collectors,...v27SafeMarkdownRanges(source)];
        const protectedAt=(start,end,allowSelfTag=false)=>enclosing.some(r=>r.start<end&&start<r.end)||tags.some(r=>r.start<end&&start<r.end&&!(allowSelfTag&&r.start===start&&r.end===end));
        const top=at=>Object.values(v24SyntaxContext(view,at)).every(stack=>stack.length===0);
        const add=(start,end,text,rule,method)=>edits.push({start,end,text,ruleId:rule,proof:{sourceHash,before:source.slice(start,end),after:text,changeRules:[rule],minorSafe:true,method}});
        if(cfg.references!==false)for(const ref of refTokens(view)){
            // Most references have no preceding-space defect. Do not rescan
            // their entire source prefix before checking this cheap predicate.
            const match=/[.,;:!?]([ \t]+)$/.exec(source.slice(Math.max(0,ref.start-128),ref.start));
            if(!match||ref.start-match[1].length===0)continue;
            if(!/^<ref\b/i.test(source.slice(ref.start,ref.start+5))||protectedAt(ref.start,ref.start)||!top(ref.start))continue;
            if(ref.body!==null&&!/^<\/ref\s*>$/i.test(source.slice(ref.end-6,ref.end))&& !source.slice(ref.start,ref.end).match(/<\/ref\s*>$/i))continue;
            const start=ref.start-match[1].length;
            if(protectedAt(start,ref.start)||!top(start))continue;
            add(start,ref.start,'','referencePunctuation','horizontal ASCII space between sentence punctuation and a complete active top-level reference');
        }
        if(cfg.markup!==false)for(const match of view.matchAll(/<br[ \t]*\\[ \t]*>/gi)){
            const start=match.index,end=start+match[0].length;
            if(protectedAt(start,end,true)||!top(start)||source.slice(start,end)!==match[0])continue;
            const line=source.slice(source.lastIndexOf('\n',start-1)+1,start);
            if(/^\s|^[*#:;|!=]/.test(line))continue;
            add(start,end,'<br />','markup','exact attribute-free reverse slash on a top-level HTML void line break');
        }
        if(cfg.headings!==false)for(const match of view.matchAll(/^(={2,6})[ \t]*\{\{[ \t]*(Ligações Externas|Ligações externas|Ver Também|Ver também|Bibliografia)[ \t]*\}\}[ \t]*\1[ \t]*(?=\r?$)/gm)){
            const start=match.index,end=start+match[0].length;
            if(source.slice(start,end)!==match[0]||shield.ranges.some(r=>r.start<end&&start<r.end)||!top(start))continue;
            if(enclosing.some(r=>r.start<=start&&r.end>start))continue;
            const title=match[2].toLocaleLowerCase('pt'),canonical={'ligações externas':'Ligações externas','ver também':'Ver também',bibliografia:'Bibliografia'}[title];
            add(start,end,match[1]+' '+canonical+' '+match[1],'headings','argument-free exact section label incorrectly wrapped in a template; calls elsewhere retained');
        }
        return edits.sort((a,b)=>a.start-b.start||a.end-b.end).filter((edit,index,all)=>!all.some((other,i)=>i!==index&&other.start<edit.end&&edit.start<other.end));
    }
    function v218LegacyMarkupPlan(source,cfg={}) {
        const edits=v218LegacyMarkupEdits(source,cfg);
        return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v218LegacyMarkupProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v218LegacyMarkupPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
