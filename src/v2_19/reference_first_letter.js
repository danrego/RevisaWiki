    // A source-only proof for the existing cleanLinks first-letter branch.
    // Namespace0 is first-letter on the pinned anonymous ptwiki siteinfo.
    function v219ReferenceFirstLetterPlan(source,options={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]},cfg={...DEFAULTS,...options};
        if(typeof source!=='string'||source.length>4194304||cfg.links===false||cfg.namespaceNumber!==0||
            cfg.sectionOnly||cfg.discussionPage||cfg.contentModel&&cfg.contentModel!=='wikitext'||
            !/\[\[[A-Za-z][^|\[\]\r\n]*\|(?:'{2,3})?[A-Za-z]/.test(source)||v24SyntaxScan(source).issues.length)return empty;
        const observed=v219NativeReferenceObserver(source);
        if(observed.unclosed.length||observed.empties.length||observed.shield.unclosed.length)return empty;
        const hard=v219StageProtectedRanges(source,cfg),peers=v219ReferenceDefinitionPeerRanges(source,hard,cfg),candidates=[];
        for(const ref of observed.refs){
            if(!ref.valid||!ref.attrs||!ref.renderer.valid||ref.body===null||!ref.close||
                Object.keys(ref.attrs).some(key=>!['name','group'].includes(key))||
                [...hard,...peers].some(range=>range.start<=ref.start&&ref.end<=range.end))continue;
            const originalBody=ref.body,offset=ref.close.start-originalBody.length,prior=v219ReferenceBodyMarkupPlan(originalBody,cfg);
            const emphasis=prior.edits.length&&prior.edits.every(edit=>edit.proof?.kind==='piped-label-emphasis'&&edit.text.length===edit.end-edit.start)&&
                v219ReferenceBodyMarkupProof(originalBody,prior.text,prior,cfg)?prior:null,body=emphasis?emphasis.text:originalBody,
                index=v210StructuralIndex(body),shield=v24SyntaxProtected(body),tags=[],links=[];
            if(index.templates.unclosed.length||shield.unclosed.length||v24SyntaxScan(body).issues.length)continue;
            for(let at=0;at<body.length;){const tag=tagAt(body,at);if(tag){tags.push({start:at,end:tag.end});at=tag.end;}else at++;}
            const blocked=[...index.templates.nodes,...index.tables,...index.references,...index.collectors,...tags,
                ...shield.ranges,...v27SafeMarkdownRanges(body)];
            for(const match of body.matchAll(/\[\[([A-Za-z][\p{L}\p{N} .,-]*)\|([A-Za-z][\p{L}\p{N} .,-]*)\]\]/gu)){
                const [raw,target,label]=match,start=match.index,end=start+raw.length,own=emphasis?.edits.find(edit=>
                    edit.proof.target===target&&edit.proof.label===label&&edit.start+edit.proof.delimiter.length===start&&
                    edit.text===edit.proof.delimiter+raw+edit.proof.delimiter); 
                if(target===label||target.slice(1)!==label.slice(1)||target[0].toLowerCase()!==label[0].toLowerCase()||
                    target!==target.trim()||label!==label.trim()||/ {2}/.test(target)||
                    blocked.some(range=>range.start<end&&start<range.end&&!(own&&range.kind==='quotation-markup'&&
                        range.start===start-own.proof.delimiter.length&&range.end===end+own.proof.delimiter.length)))continue;
                const context=v24SyntaxContext(body,start),text='[['+label+']]';
                if(context.links.length||context.external.length||context.tables.length||context.html.length||
                    /\b(?:https?|ftp):\/\/[^\s<>"']*$/i.test(body.slice(body.lastIndexOf('\n',start-1)+1,start))||
                    cleanLinks(raw,()=>{})!==text)continue;
                links.push({start,end,text,ruleId:'referenceNativeFirstLetterLink',proof:{
                    kind:'source-only-existing-cleanLinks-native-first-letter',sourceHash:empty.sourceHash,before:raw,after:text,
                    target,label,namespace:0,namespaceCase:'first-letter',siteinfoSha256:'92f25f23485000bfde80c0fa1f73a8f3b90a1d7ca6ada1b8e44031a7203b8198',
                    condition:'Only ASCII first-letter case differs. Every later code point, visible label and surrounding byte remains exact. No namespace, fragment, entity, underscore, dynamic owner or inferred redirect.'}});
            }
            if(links.length){const text=v24SyntaxApply(body,links);candidates.push({start:offset,end:offset+originalBody.length,text,
                ruleId:'referenceNativeFirstLetterLink',proof:{kind:'source-only-existing-emphasis-then-first-letter',sourceHash:empty.sourceHash,
                    before:originalBody,after:text,emphasisEdits:emphasis?.edits||[],links}});}
        }
        const edits=v219AtomicNamedReferenceEdits(source,candidates,cfg);
        return edits.length?{...empty,edits,text:v24SyntaxApply(source,edits)}:empty;
    }
    function v219ReferenceFirstLetterProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219ReferenceFirstLetterPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219ReferenceFirstLetterSource(source,cfg={}) {
        const plan=v219ReferenceFirstLetterPlan(source,cfg);
        return plan.edits.length&&v219ReferenceFirstLetterProof(source,plan.text,plan,cfg)?plan.text:source;
    }
