    function v218ProseGapScope(cfg={}) {
        return cfg.automaticProseGaps!==false&&v214ProseSpacingScope(cfg);
    }
    function v218ProseGapEndMatter(source,at,index) {
        const lineEnd=source.indexOf('\n',at),end=lineEnd<0?source.length:lineEnd;
        const tail=node=>node.start===at&&/^[ \t\r]*$/.test(source.slice(node.end,source.indexOf('\n',node.end)<0?source.length:source.indexOf('\n',node.end)));
        const node=index.templates.nodes.find(node=>node.depth===0&&tail(node));
        if(node){
            const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),name=p.name.replace(/^(?:predefinição|template)\s*:\s*/i,'');
            if(/<!--|\{\{\{|\{\{[^{}]*\{\{|[\uE000-\uF8FF]/.test(raw))return null;
            if(['referências','referencias','notas','notas e referências'].includes(name)){
                const fields=foreignEntries(p),allowed=new Set(['1','2','colunas','col','grupo','largura','refs','notas','referências','referencias']);
                if(fields.some(field=>!allowed.has(field.key)||/[{}<>]/.test(field.value)))return null;
                return {kind:'native-reference-list',start:node.start,end:node.end};
            }
            if(['portal','portal2','portal3'].includes(name)){
                const portal=biographyPortalSlots(raw);
                if(portal.unsafe||!portal.slots.size||[...portal.slots.values()].some(slot=>!slot.value.trim()))return null;
                return {kind:'native-portal',start:node.start,end:node.end};
            }
            if(['controle de autoridade','controlo de autoridade'].includes(name)&&p.parts.length===1)
                return {kind:'native-authority',start:node.start,end:node.end};
            return null;
        }
        const raw=source.slice(at,end).replace(/\r$/,'');
        if(/^\[\[Categoria:[^\[\]{}<>\r\n]+\]\][ \t]*$/i.test(raw))return {kind:'native-category',start:at,end};
        const collector=index.collectors.find(node=>tail(node)&&/^<\s*references\b/i.test(source.slice(node.start,node.end)));
        if(collector){
            const raw=source.slice(collector.start,collector.end);
            if(/^<references(?:[ \t]+group[ \t]*=[ \t]*(?:"[^"{}<>\r\n]*"|'[^'{}<>\r\n]*'))?[ \t]*\/[ \t]*>$/i.test(raw))
                return {kind:'native-references-tag',start:collector.start,end:collector.end};
        }
        return null;
    }
    function v218ProseGapPlainLine(source,start,end,index) {
        const raw=source.slice(start,end).replace(/\r$/,'');
        if(/^={2,6}[^=<>\[\]{}\r\n]+={2,6}[ \t]*$/.test(raw))return {kind:'ordinary-heading',start,end};
        if(!raw||/^\s|^[*#:;|!{}<>\[\]_\-=]/.test(raw)||/<!--|-->|[\uE000-\uF8FF]/.test(raw))return null;
        // A complete citation can contain templates. Classify the surrounding
        // paragraph without reading or changing any of its reference bodies.
        const refs=index.references.filter(ref=>ref.start>=start&&ref.end<=end&&ref.start<ref.end);
        const text=v24SyntaxApply(raw,refs.map(ref=>({start:ref.start-start,end:ref.end-start,text:''})));
        if(/[{}]/.test(text)||!/[\p{L}\p{N}]/u.test(text)||/^\s|^[*#:;|!<>\[\]_\-=]/.test(text))return null;
        const quotation=v24SyntaxProtected(text);
        if(quotation.unclosed.length||/''/.test(quotation.view))return null;
        return {kind:'ordinary-prose',start,end,inlineReferences:refs.map(ref=>({start:ref.start,end:ref.end}))};
    }
    function v218ProseGapEdits(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!v218ProseGapScope(cfg)||
            !/(?:\r?\n)(?:[ \t]*\r?\n){2}/.test(source)||/~{3,5}/.test(source)||
            discussionProtectionRanges(source,{discussionPage:true}).length)return [];
        const shield=v24SyntaxProtected(source),index=v210StructuralIndex(source);
        if(shield.unclosed.length||index.templates.unclosed.length||v24SyntaxScan(source).issues.length||
            /<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return [];
        const ranges=[...shield.ranges,...index.templates.nodes,...v24SyntaxTemplates(shield.view).nodes,
            ...index.references,...index.collectors,...index.tables,...proseRanges(shield.view),...v27SafeMarkdownRanges(source)],stack=[];
        for(const match of source.matchAll(/\[(?:[A-Za-z][A-Za-z0-9+.-]*:|\/\/)[^\]]*\]/g))ranges.push({start:match.index,end:match.index+match[0].length});
        for(let at=0;at<source.length;){
            const tag=tagAt(source,at);if(!tag){at++;continue;}
            if(shield.ranges.some(range=>range.start<=at&&at<range.end)){at=tag.end;continue;}
            ranges.push({start:tag.start,end:tag.end});
            if(tag.close){const opening=stack.pop();if(!opening||opening.name!==tag.name)return [];ranges.push({start:opening.start,end:tag.end});}
            else if(!tag.self&&!['br','hr','wbr','img','meta','link','input','source','track','area','base','col','embed','param'].includes(tag.name))stack.push(tag);
            at=tag.end;
        }
        if(stack.length)return [];
        const edits=[],sourceHash=v24SyntaxHash(source);
        for(const match of source.matchAll(/(?:\r?\n)(?:[ \t]*\r?\n){2,}/g)){
            const start=match.index,end=start+match[0].length;
            if(ranges.some(range=>range.start<end&&range.end>start))continue;
            const newline=match[0].startsWith('\r\n')?'\r\n':'\n';
            if(match[0].replaceAll(newline,'').replace(/[ \t]/g,'')!=='')continue;
            const previousStart=source.lastIndexOf('\n',start-1)+1,nextEnd=source.indexOf('\n',end),
                left=v218ProseGapPlainLine(source,previousStart,start,index),
                right=v218ProseGapPlainLine(source,end,nextEnd<0?source.length:nextEnd,index)||v218ProseGapEndMatter(source,end,index);
            if(!left||!right)continue;
            edits.push({start,end,text:newline+newline,ruleId:'v218ProseGaps',proof:{sourceHash,before:match[0],after:newline+newline,
                left,right,minorSafe:true,condition:'two or more top-level ASCII blank lines after ordinary prose or a heading; one blank line remains; all neighboring content and protected structures remain byte-identical'}});
        }
        return edits;
    }
    function v218ProseGapPlan(source,cfg={}) {
        const edits=v218ProseGapEdits(source,cfg);
        return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v218ProseGapCleanup(source,cfg={},bump=()=>{}) {
        const plan=v218ProseGapPlan(source,cfg);for(const edit of plan.edits)bump(edit.ruleId);return plan.text;
    }
    function v218ProseGapProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v218ProseGapPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
