    // Guard-only equivalences for complete literal markup in reference bodies.
    // The output text is never changed by this projection. Namespace 6 aliases
    // are confirmed by native siteinfo. Leading-colon file links are excluded:
    // their implicit visible label includes the written namespace spelling.
    const V218_REFERENCE_PAGE_KEYS=new Set(['página','páginas','page','pages']);
    const V218_REFERENCE_CS1_FAMILIES=new Set(['citar web','citar jornal','citar revista','citar periódico','citar livro']);
    function v218ReferenceMarkupPlan(raw,cfg={}) {
        const base={source:raw,sourceHash:typeof raw==='string'?v24SyntaxHash(raw):null,edits:[],text:raw};
        if(typeof raw!=='string'||raw.length>4194304)return base;
        const quotes=cfg.markup!==false&&/\[\[[^|\[\]\r\n]+\|'{2,3}[^'\[\]\r\n]+'{2,3}\]\]/.test(raw),
            files=cfg.categories!==false&&/\[\[(?:File|Image|Ficheiro|Arquivo|Imagem):/i.test(raw);
        if(!quotes&&!files)return base;
        const shield=v24SyntaxProtected(raw),index=v210StructuralIndex(raw);
        if(shield.unclosed.length||index.templates.unclosed.length||v24SyntaxScan(raw).issues.length)return base;
        const literals=[...shield.ranges,...v27SafeMarkdownRanges(raw)],tags=[];
        for(let at=0;at<raw.length;){const tag=tagAt(raw,at);if(tag){tags.push({start:at,end:tag.end});at=tag.end;}else at++;}
        const overlaps=(start,end,ranges)=>ranges.some(range=>range.start<end&&start<range.end),
            contextSafe=(start,end,ownQuoteStart=null,valueStart=0,afterClosedCitation=false)=>{
                if(overlaps(start,end,[...index.references,...index.collectors,...index.tables,...tags]))return false;
                if(literals.some(range=>range.start<end&&start<range.end&&!(ownQuoteStart!==null&&
                    range.kind==='quotation-markup'&&range.start===ownQuoteStart&&range.end<=end)))return false;
                let lineStart=Math.max(valueStart,raw.lastIndexOf('\n',start-1)+1),line=raw.slice(lineStart,start),url=/\b(?:https?|ftp):\/\/[^\s<>"']*$/i.exec(line);
                if(url&&afterClosedCitation){
                    // A URL inside a completed literal citation cannot continue
                    // beyond its closing braces into the following file token.
                    // The remaining tail is checked again for a real bare URL.
                    const urlStart=lineStart+url.index,closed=index.templates.nodes.filter(node=>
                        node.start<=urlStart&&urlStart<node.end&&node.end<=start);
                    if(closed.length===1){
                        const node=closed[0],call=raw.slice(node.start,node.end),native=v218CitationNativeContext(call),fields=v2151FieldSyntaxParts(call);
                        if(native&&V218_REFERENCE_CS1_FAMILIES.has(native.native.name)&&fields&&
                            fields.every(field=>field.key===field.plain&&field.separator==='=')&&
                            fields.some(field=>node.start+field.start<=urlStart&&urlStart<node.start+field.end)&&
                            !index.templates.nodes.some(other=>other!==node&&node.start<=other.start&&other.end<=node.end)){
                            line=raw.slice(Math.max(node.end,lineStart),start);
                            url=/\b(?:https?|ftp):\/\/[^\s<>"']*$/i.exec(line);
                        }
                    }
                }
                if(url)return false;
                const context=v24SyntaxContext(raw,start);
                return !context.links.length&&!context.external.length&&!context.tables.length&&!context.html.length;
            },
            add=(start,end,text,kind,evidence)=>base.edits.push({start,end,text,ruleId:'v218ReferenceMarkupEquivalence',
                proof:{sourceHash:base.sourceHash,before:raw.slice(start,end),after:text,kind,...evidence,
                    condition:'guard-only native-equivalent literal reference markup; all surrounding bytes retained'}});
        if(quotes)for(const match of raw.matchAll(/\[\[([^|\[\]\r\n]+)\|('{2,3})([^'\[\]\r\n]+)\2\]\]/g)){
            const [whole,target,delimiter,label]=match,start=match.index,end=start+whole.length,
                ownQuoteStart=start+2+target.length+1;
            if(/[:#{}<>&']/.test(target)||/[{}<>|&]/.test(label)||target!==target.trim()||label!==label.trim()||
                !target||!label||raw[start-1]==="'"||raw[end]==="'"||
                overlaps(start,end,index.templates.nodes)||!contextSafe(start,end,ownQuoteStart))continue;
            add(start,end,delimiter+'[['+target+'|'+label+']]'+delimiter,'piped-label-emphasis',
                {target,label,delimiter,delimiterLength:delimiter.length});
        }
        if(files)for(const match of raw.matchAll(/\[\[(File|Image|Ficheiro|Arquivo|Imagem):([^\[\]{}<>\r\n]+)\]\]/gi)){
            const [whole,alias,payload]=match,start=match.index,end=start+whole.length,filename=payload.split('|',1)[0];
            if(!filename||filename!==filename.trim()||/[#&]|:\/\//.test(filename))continue;
            const containers=index.templates.nodes.filter(node=>node.start<=start&&end<=node.end);
            let fieldProof=null,valueStart=0;
            if(containers.length){
                // This release proves rendered CS1 page fields only. A file-like
                // string in a URL, identifier or arbitrary value stays exact.
                if(containers.length!==1)continue;
                const node=containers[0],call=raw.slice(node.start,node.end),native=v218CitationNativeContext(call),fields=v2151FieldSyntaxParts(call);
                if(!native||!V218_REFERENCE_CS1_FAMILIES.has(native.native.name)||!fields||
                    fields.some(field=>field.key!==field.plain||field.separator!=='='))continue;
                const owners=fields.filter(field=>node.start+field.start<=start&&end<=node.start+field.end);
                if(owners.length!==1)continue;const field=owners[0];
                if(!V218_REFERENCE_PAGE_KEYS.has(field.key)||!nativeCitationAccepts(native.native,field.key)||
                    fields.filter(other=>V218_REFERENCE_PAGE_KEYS.has(other.key)).length!==1||
                    /[{}<>\r\n\uE000-\uF8FF]/.test(field.value.trim()))continue;
                fieldProof={template:native.native.name,nativeTemplateOldid:native.profile.oldid,key:field.key};
                valueStart=node.start+field.start;
            }
            if(!contextSafe(start,end,null,valueStart,containers.length===0))continue;
            if(alias==='Imagem')continue;
            add(start+2,start+2+alias.length,'Imagem','native-file-namespace',
                {namespace:6,alias,filename,payload,leadingColon:false,field:fieldProof});
        }
        base.edits.sort((a,b)=>a.start-b.start||a.end-b.end);
        if(base.edits.some((edit,i,all)=>all.some((other,j)=>i!==j&&other.start<edit.end&&edit.start<other.end)))return {...base,edits:[],text:raw};
        base.text=v24SyntaxApply(raw,base.edits);return base;
    }
    function v218ReferenceMarkupProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v218ReferenceMarkupPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v218ReferenceBodyInventory(raw,cfg={}) {
        return v24InventoryBody(v218ReferenceMarkupPlan(raw,cfg).text,cfg);
    }
