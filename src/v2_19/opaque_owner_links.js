    // A complete opaque template can contain code that is not independently
    // balanced HTML or table syntax. Do not interpret or repair that payload.
    // Only the exact flat-link equivalence outside every owner is selected.
    function v219OpaqueOwnerLinkPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.namespaceNumber!==0||cfg.links===false||
            cfg.partialSyntaxRecovery===false||cfg.sectionOnly||cfg.discussionPage||cfg.pageRedirect||
            cfg.pageDisambiguation||cfg.contentModel&&cfg.contentModel!=='wikitext'||
            !v24SyntaxScope(cfg)||!source.includes('{{'))return empty;
        const candidates=[...source.matchAll(/\[\[([\p{L}\p{N}][\p{L}\p{N}\p{M} -]*)\|\1\]\]/gu)]
            .filter(match=>match[1]===match[1].trim()&&match[1]===match[1].normalize('NFC')&&
                !/  /.test(match[1]));
        if(!candidates.length)return empty;
        const owners=v219UnknownTemplateRanges(source,cfg);
        if(!owners.length||owners.length>2048||!v24SyntaxScan(source).issues.length)return empty;
        // This view is used only to locate an independent outside link. It
        // never replaces the source used by the syntax-repair pipeline.
        const view=tableMaskRanges(source,owners),scan=v24SyntaxScan(view);
        if(scan.issues.length)return empty;
        const parsed=templates(view);
        if(parsed.unclosed.length)return empty;
        const blocked=[...v219StageProtectedRanges(source,cfg),...parsed.nodes,...refTokens(view),...scan.tokens],edits=[];
        for(const match of candidates){
            const start=match.index,end=start+match[0].length;
            if(blocked.some(range=>range.start<end&&start<range.end))continue;
            edits.push({start,end,text:'[['+match[1]+']]',ruleId:'links',proof:{sourceHash:empty.sourceHash,
                before:match[0],target:match[1],changeRules:['links'],minorSafe:true,
                opaqueOwners:owners.map(range=>({start:range.start,end:range.end,sourceHash:v24SyntaxHash(source.slice(range.start,range.end))})),
                method:'exact identical flat literal target and label outside every complete opaque owner, template, reference and literal range; outside structural view complete; opaque source bytes unchanged'}});
        }
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219OpaqueOwnerLinkEdits(source,cfg={}) {
        return v219OpaqueOwnerLinkPlan(source,cfg).edits;
    }
    function v219OpaqueOwnerLinkProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219OpaqueOwnerLinkPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
