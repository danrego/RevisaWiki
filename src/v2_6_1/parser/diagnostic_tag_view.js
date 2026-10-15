    // Quotation protection must not hide an otherwise balanced HTML boundary.
    // Only the diagnostic scanner uses this view. Repair passes keep the
    // original quotation masks and cannot change a quoted example.
    function v261SyntaxDiagnosticTagView(source,shield) {
        if(!shield.ranges.some(r=>r.kind==='quotation'||r.kind==='quotation-markup'))return shield.view;
        const opaque=shield.ranges.filter(r=>r.kind!=='quotation'&&r.kind!=='quotation-markup');
        const literalView=v24SyntaxMaskRanges(source,opaque),stack=[],pairs=[];
        for(let at=0;at<literalView.length;){
            const tag=v24SyntaxTag(literalView,at);
            if(!tag){
                if(literalView[at]==='<'&&/^<\s*[/\\]?\s*(?:ref|references|small|span|sup|sub)\b/i.test(literalView.slice(at)))return shield.view;
                at++;continue;
            }
            at=tag.end;
            if(tag.typo)return shield.view;
            if(V24_SYNTAX_VOID.has(tag.name)||tag.self)continue;
            if(!tag.close){
                if(tag.name==='ref'&&stack.some(open=>open.name==='ref'))return shield.view;
                stack.push(tag);
            }else{
                if(stack.at(-1)?.name!==tag.name||tag.attrs.trim())return shield.view;
                pairs.push([stack.pop(),tag]);
            }
        }
        if(stack.length)return shield.view;
        const view=shield.view.split('');
        // Fully quoted pairs and self-closing tags cannot strand an outside
        // opening or closer. Keep those tokens opaque as before.
        for(const pair of pairs){
            if(!pair.some(tag=>shield.view.slice(tag.start,tag.end).trim()))continue;
            for(const tag of pair)for(let at=tag.start;at<tag.end;at++)view[at]=source[at];
        }
        return view.join('');
    }
