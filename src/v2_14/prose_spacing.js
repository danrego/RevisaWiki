    function v214ProseSpacingScope(cfg={}) {
        return v24SyntaxScope(cfg)&&cfg.namespaceNumber===0&&cfg.markup!==false&&!cfg.discussionPage&&
            !cfg.sectionOnly&&(cfg.section===undefined||cfg.section===null||cfg.section==='')&&
            !cfg.pageRedirect&&!cfg.pageDisambiguation;
    }
    function v214ProseSpacingEdits(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!v214ProseSpacingScope(cfg)||!/(?:\r?\n){3}/.test(source)||
            /~{3,5}/.test(source)||discussionProtectionRanges(source,{discussionPage:true}).length)return [];
        const shield=v24SyntaxProtected(source),index=v210StructuralIndex(source);
        if(shield.unclosed.length||index.templates.unclosed.length||v24SyntaxScan(source).issues.length||
            /<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return [];
        const ranges=[...shield.ranges,...index.templates.nodes,...v24SyntaxTemplates(shield.view).nodes,...index.references,...index.collectors,
            ...index.tables,...proseRanges(shield.view),...v27SafeMarkdownRanges(source)],stack=[];
        for(const match of source.matchAll(/\[(?:[A-Za-z][A-Za-z0-9+.-]*:|\/\/)[^\]]*\]/g))ranges.push({start:match.index,end:match.index+match[0].length});
        // Even ordinary HTML can give line breaks a special meaning through
        // white-space styles. Never alter a gap inside an element or tag.
        for(let at=0;at<source.length;){
            const tag=tagAt(source,at);if(!tag){at++;continue;}
            if(shield.ranges.some(range=>range.start<=at&&at<range.end)){at=tag.end;continue;}
            ranges.push({start:tag.start,end:tag.end});
            if(tag.close){const open=stack.pop();if(!open||open.name!==tag.name)return [];
                ranges.push({start:open.start,end:tag.end});}
            else if(!tag.self&&!['br','hr','wbr','img','meta','link','input','source','track','area','base','col','embed','param'].includes(tag.name))stack.push(tag);
            at=tag.end;
        }
        if(stack.length)return [];
        const plain=line=>{
            if(!line||/^\s|^[*#:;|!{}<>\[\]_=\-]/.test(line))return /^={2,6}[^=<>\[\]{}\r\n]+={2,6}[ \t]*$/.test(line);
            return /[\p{L}\p{N}]/u.test(line)&&!/[{}]/.test(line);
        };
        const edits=[],hash=v24SyntaxHash(source);
        for(const match of source.matchAll(/(?:\r?\n){3,}/g)){
            const start=match.index,end=start+match[0].length;
            if(ranges.some(range=>range.start<end&&range.end>start))continue;
            const previous=source.slice(source.lastIndexOf('\n',start-1)+1,start).replace(/\r$/,''),nextEnd=source.indexOf('\n',end),
                next=source.slice(end,nextEnd<0?source.length:nextEnd).replace(/\r$/,'');
            if(!plain(previous)||!plain(next))continue;
            const newline=match[0].startsWith('\r\n')?'\r\n':'\n';
            if(match[0].replaceAll(newline,'')!=='')continue;
            edits.push({start,end,text:newline+newline,ruleId:'v214ProseSpacing',proof:{sourceHash:hash,
                before:match[0],after:newline+newline,condition:'literal empty lines between ordinary top-level prose or headings; protected structures excluded; one paragraph boundary retained'}});
        }
        return edits;
    }
    function v214ProseSpacingPlan(source,cfg={}) {
        const edits=v214ProseSpacingEdits(source,cfg);
        return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v214ProseSpacingCleanup(source,cfg={},bump=()=>{}) {
        const plan=v214ProseSpacingPlan(source,cfg);
        for(const edit of plan.edits)bump(edit.ruleId);
        return plan.text;
    }
    function v214ProseSpacingProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v214ProseSpacingPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
