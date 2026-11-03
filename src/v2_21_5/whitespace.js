    // Empty paragraph lines can be repaired without entering protected owners.
    // A broken later owner protects its own suffix, not the earlier prose.
    function v2215WhitespaceScope(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options});
        return typeof source==='string'&&source.length<=4194304&&!!source.trim()&&
            cfg.automaticProseGaps!==false&&cfg.markup!==false&&(cfg.namespaceNumber===0||v2215ArticleDraftContext(cfg,source))&&
            !cfg.sectionOnly&&!cfg.discussionPage&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&!v20DefinitionContext(cfg)&&v20AutomationAllowed(source,cfg);
    }
    function v2215WhitespaceRanges(source) {
        const shield=v24SyntaxProtected(source),parsed=templates(shield.view),ranges=[...shield.ranges,
            ...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),
            ...parsed.nodes,...parsed.unclosed.map(n=>({start:n.start,end:source.length}))];
        for(const issue of v24SyntaxScan(source).issues){
            const start=Number.isInteger(issue.start)&&issue.start>=0?issue.start:0;
            ranges.push({start,end:source.length});
        }
        const view=v24SyntaxMaskRanges(shield.view,[...parsed.nodes,...parsed.unclosed.map(n=>({start:n.start,end:source.length}))]),
            html=[],tables=[],links=[],voids=new Set(['br','hr','wbr','img','meta','link','input','source','track','area','base','col','embed','param']);
        for(let at=0;at<view.length;){
            const tag=v24SyntaxTag(view,at);
            if(tag){
                ranges.push({start:tag.start,end:tag.end});
                if(!voids.has(tag.name)&&!tag.self){
                    if(!tag.close)html.push(tag);
                    else if(html.at(-1)?.name===tag.name){const open=html.pop();ranges.push({start:open.start,end:tag.end});}
                    else{ranges.push({start:html[0]?.start??tag.start,end:source.length});break;}
                }
                at=tag.end;continue;
            }
            const two=view.slice(at,at+2);
            if(two==='{|'&&/^[ \t]*$/.test(view.slice(view.lastIndexOf('\n',at-1)+1,at))){tables.push(at);at+=2;continue;}
            if(two==='|}'&&/^[ \t]*$/.test(view.slice(view.lastIndexOf('\n',at-1)+1,at))){
                const opening=tables.pop();ranges.push({start:opening??at,end:opening===undefined?source.length:at+2});at+=2;continue;
            }
            if(view[at]==='[')links.push(at);
            else if(view[at]===']'&&links.length)ranges.push({start:links.pop(),end:at+1});
            at++;
        }
        for(const open of html)ranges.push({start:open.start,end:source.length});
        for(const start of [...tables,...links])ranges.push({start,end:source.length});
        const sorted=ranges.filter(r=>Number.isInteger(r.start)&&Number.isInteger(r.end)&&r.start>=0&&r.end>r.start)
            .map(r=>({start:r.start,end:Math.min(source.length,r.end)})).sort((a,b)=>a.start-b.start||a.end-b.end),merged=[];
        for(const r of sorted){const previous=merged.at(-1);if(previous&&r.start<=previous.end)previous.end=Math.max(previous.end,r.end);else merged.push({...r});}
        return merged;
    }
    function v2215WhitespaceOutside(ranges,start,end) {
        let a=0,b=ranges.length;
        while(a<b){const middle=(a+b)>>>1;if(ranges[middle].end<=start)a=middle+1;else b=middle;}
        return a===ranges.length||ranges[a].start>=end;
    }
    function v2215WhitespacePreformattedNeighbour(source,start,end) {
        const first=source.lastIndexOf('\n',Math.max(0,start-1))+1,next=source.indexOf('\n',end),
            before=source.slice(first,start).replace(/\r$/,''),after=source.slice(end,next<0?source.length:next).replace(/\r$/,'');
        return /^[ \t]+\S/.test(before)||/^[ \t]+\S/.test(after);
    }
    function v2215WhitespacePlan(source,options={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(!v2215WhitespaceScope(source,options)||!/(?:^[ \t]*\r?\n|\n[ \t]+(?:\r?\n|$)|\n(?:[ \t]*\r?\n){2})/.test(source))return empty;
        const crlf=source.includes('\r\n');
        if(crlf&&/(?:^|[^\r])\n/.test(source)||/\r(?!\n)/.test(source))return empty;
        const newline=crlf?'\r\n':'\n',ranges=v2215WhitespaceRanges(source),edits=[];
        const add=(start,end,text,kind)=>{
            if(source.slice(start,end)!==text&&v2215WhitespaceOutside(ranges,start,end)&&
                !v2215WhitespacePreformattedNeighbour(source,start,end))edits.push({start,end,text,kind,ruleId:'v2215Whitespace',
                    proof:{sourceHash:empty.sourceHash,minorSafe:true,newline}});
        };
        const leading=/^(?:[ \t]*\r?\n)+/.exec(source);
        if(leading)add(0,leading[0].length,'','leading-empty-lines');
        const leadingEnd=edits[0]?.kind==='leading-empty-lines'?edits[0].end:0;
        for(const match of source.matchAll(/\r?\n(?:[ \t]*\r?\n)+/g)){
            const start=match.index,end=start+match[0].length;if(start<leadingEnd)continue;
            const count=(match[0].match(/\n/g)||[]).length;
            add(start,end,newline.repeat(Math.min(2,count)),count>2?'excess-empty-lines':'space-only-empty-lines');
        }
        const tail=/[\r\n]([ \t]+)$/.exec(source);
        if(tail&&!v2215WhitespacePreformattedNeighbour(source,tail.index,source.length)){const start=tail.index+tail[0].length-tail[1].length;add(start,source.length,'','space-only-final-line');}
        edits.sort((a,b)=>a.start-b.start||a.end-b.end);
        if(edits.some((e,i)=>i&&e.start<edits[i-1].end))return empty;
        return {...empty,newline,edits,text:v24SyntaxApply(source,edits)};
    }
    function v2215WhitespaceProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2215WhitespacePlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits)&&
            before.replace(/[ \t\r\n]/g,'')===after.replace(/[ \t\r\n]/g,'');
    }
