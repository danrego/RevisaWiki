    // Info/Taxonomia 72880311 places this exact display field inside its own
    // closing div. Keep the native call unchanged while checking independent
    // syntax repairs outside that atom. No general unclosed-tag exemption.
    function v219NativeCenterQuarantine(before,after,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||!before.includes('<center>')||
            cfg.namespaceNumber!==0||cfg.discussionPage||cfg.sectionOnly||cfg.contentModel&&cfg.contentModel!=='wikitext')return null;
        const old=syntaxRepairPlan(before,cfg),next=syntaxRepairPlan(after,cfg);
        if(old.unresolved.length!==1||next.unresolved.length!==1||old.unresolved[0].code!=='syntax-unclosed-tag'||
            next.unresolved[0].code!=='syntax-unclosed-tag')return null;
        const issue=old.unresolved[0],nodes=topNodes(scanProtectedView(before)),candidates=[];
        for(const node of nodes){
            if(node.start>issue.start||node.end<=issue.start)continue;
            const raw=before.slice(node.start,node.end),p=parsedTemplate(raw),profile=INFOBOX_CATALOG[p.name];
            if(p.name!=='info/taxonomia'||profile?.oldid!==72880311||!v215LiteralTemplateIdentity(raw,profile))continue;
            const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)continue;
            const fields=parts.slice(1).map(part=>({part,match:/^\s*(subdivisão|subdivision)[ \t]*=([\s\S]*)$/.exec(part.text)})).filter(item=>item.match);
            if(fields.length!==1)continue;
            const field=fields[0],body=field.match[2];
            if(!/^\s*<center>[^{}<>"“”«»'\r\n]*\s*$/.test(body))continue;
            const at=node.start+2+field.part.start+field.part.text.indexOf('<center>');
            if(at!==issue.start||issue.end!==at+8||raw.indexOf('<center>')!==raw.lastIndexOf('<center>'))continue;
            candidates.push({node,raw});
        }
        if(candidates.length!==1)return null;
        const {node,raw}=candidates[0],at=after.indexOf(raw);
        if(at!==node.start||before.indexOf(raw)!==before.lastIndexOf(raw)||at!==after.lastIndexOf(raw)||
            before.slice(0,node.start)!==after.slice(0,node.start)||next.unresolved[0].start!==issue.start||
            next.unresolved[0].end!==issue.end)return null;
        const replacement=raw.replace(/[^\r\n]/g,' '),maskedBefore=before.slice(0,node.start)+replacement+before.slice(node.end),
            maskedAfter=after.slice(0,node.start)+replacement+after.slice(node.end);
        if(syntaxRepairPlan(maskedBefore,cfg).unresolved.length||syntaxRepairPlan(maskedAfter,cfg).unresolved.length)return null;
        return {maskedBefore,maskedAfter,sourceHash:v24SyntaxHash(before),targetHash:v24SyntaxHash(after),
            nativeTemplateOldid:72880311,atomHash:v24SyntaxHash(raw),start:node.start,end:node.end,
            method:'exact unchanged native display atom; unique position and prefix; one attribute-free center; independently complete outside source'};
    }
    function v219NativeCenterTailProof(before,after,cfg={}) {
        const atom=v219NativeCenterQuarantine(before,after,cfg);if(!atom)return false;
        // The masked text has no unresolved center, so this ordinary proof
        // cannot recurse through the same exception.
        return syntaxRepairSourceProof(atom.maskedBefore,atom.maskedAfter,cfg).accepted===true;
    }
