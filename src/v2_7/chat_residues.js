    Object.assign(GROUP_LABELS,{chatCopyResidues:'Marcas de cópia removidas'});
    function v27ChatCopyEdits(source,cfg={}) {
        if(!translationResidueAllowed(cfg)||cfg.markup===false||!v24SyntaxScope(cfg)||residueLiteralTopic(source,cfg))return [];
        if(!source.includes(':contentReference[')&&!source.includes('\uE200'))return [];
        const shield=v24SyntaxProtected(source);if(shield.unclosed.length||v24SyntaxScan(source).issues.length)return [];
        const firstHeading=source.search(/^={2,6}/m),lead=source.slice(0,Math.min(firstHeading<0?source.length:firstHeading,3000));
        if(/\b(?:ChatGPT|Claude|Gemini|modelos? de linguagem|inteligência artificial generativa)\b/iu.test(lead))return [];
        const context=residueRanges(source),ranges=context.ranges.concat(shield.ranges),edits=[];
        const headings=[...source.matchAll(/^={2,6}\s*([^=\r\n]+?)\s*={2,6}\s*$/gm)];let headingIndex=0;
        const opaqueMarkers=[...source.matchAll(/[\uE200\uE201]/g)];let opaqueIndex=0,opaqueDepth=0;
        const pattern=/:contentReference\[oaicite:(\d{1,6})\]\{index=\1\}|\uE200cite\uE202turn\d{1,6}(?:search|view|fetch)\d{1,6}(?:\uE202turn\d{1,6}(?:search|view|fetch)\d{1,6})*\uE201|\uE200filecite\uE202turn\d{1,6}file\d{1,6}(?:\uE202turn\d{1,6}file\d{1,6})*\uE201/g;
        const tokens=[...source.matchAll(pattern)].map(match=>({start:match.index,end:match.index+match[0].length,raw:match[0]}));
        if(!tokens.length)return [];
        // Opaque known markers cannot turn a neighbouring marker into prose
        // about syntax. Actual explanatory words outside these exact spans stay.
        const contextView=v24SyntaxApply(source,tokens.map(t=>({start:t.start,end:t.end,text:' '.repeat(t.end-t.start)}))),runs=[];
        for(const token of tokens){const last=runs[runs.length-1],gap=last?source.slice(last.end,token.start):'';
            if(last&&/^[ \t]*$/.test(gap)){last.gaps.push(gap);last.tokens.push(token);last.end=token.end;}
            else runs.push({start:token.start,end:token.end,tokens:[token],gaps:[]});
        }
        const sourceHash=v24SyntaxHash(source);
        for(const run of runs){
            const {start,end}=run;
            while(opaqueIndex<opaqueMarkers.length&&opaqueMarkers[opaqueIndex].index<start){opaqueDepth=Math.max(0,opaqueDepth+(opaqueMarkers[opaqueIndex][0]==='\uE200'?1:-1));opaqueIndex++;}
            if(opaqueDepth)continue;
            if(ranges.some(r=>r.start<end&&r.end>start&&!(r.start>=start&&r.end<=end)))continue;
            const lineStart=source.lastIndexOf('\n',start-1)+1,lineBreak=source.indexOf('\n',end),lineEnd=lineBreak<0?source.length:lineBreak;
            const surrounding=contextView.slice(Math.max(lineStart,start-180),start)+' '+contextView.slice(end,Math.min(lineEnd,end+180));
            if(/\b(?:sintaxe|marcador(?:es)?|exemplo(?:s)?|c[oó]digo|literal|tokens?|ChatGPT|Claude|Gemini|oaicite|contentReference)\b/iu.test(surrounding))continue;
            while(headingIndex<headings.length&&headings[headingIndex].index<start)headingIndex++;
            const heading=headingIndex?headings[headingIndex-1][1]:'';
            if(/\b(?:sintaxe|marcador(?:es)?|exemplo(?:s)?|c[oó]digo|literal|tokens?|ChatGPT|Claude|Gemini|formatos?|exporta[çc][ãa]o|linguagem)\b/iu.test(heading))continue;
            const gaps=run.gaps.join(''),joinsWords=!gaps&&/[\p{L}\p{N}\p{M}]$/u.test(source.slice(Math.max(0,start-2),start))&&/^[\p{L}\p{N}\p{M}]/u.test(source.slice(end,end+2));
            edits.push({start,end,text:gaps||(joinsWords?' ':''),kind:'chatCopyResidues',proof:{sourceHash,raw:source.slice(start,end),tokens:run.tokens,gaps:run.gaps,boundary:joinsWords?'word-separator':'existing-separator',condition:'exact recognized export-token run outside protected source and metalinguistic context'}});
        }
        return edits;
    }
    function v27WholeArticleWrapperEdits(source,cfg={}) {
        const edits=wholeArticleMarkdownFenceEdits(source,cfg);if(!edits.length)return [];
        return [{start:0,end:source.length,text:applyEdits(source,edits),ruleId:'markdownWrappers',proof:{sourceHash:v24SyntaxHash(source),condition:'existing complete whole-article wrapper proof before structural normalization',edits:edits.map(e=>({...e,before:source.slice(e.start,e.end)}))}}];
    }
    function removeChatCopyResidues(source,cfg,bump) {return applyTranslationResidueEdits(source,v27ChatCopyEdits(source,cfg),bump);}
    function v27ChatCopyPlan(source,cfg={}) {
        const edits=v27ChatCopyEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:applyEdits(source,edits)};
    }
    function v27ChatCopyProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        const fresh=v27ChatCopyPlan(before,cfg);return plan.text===after&&fresh.text===after&&JSON.stringify(plan.edits)===JSON.stringify(fresh.edits);
    }
