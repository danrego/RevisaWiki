    // A complete comment can make a citation opaque to the general reader.
    // Reproduce only an existing pinned local redirect and validated date plan
    // in the source comparison. Comments and every other argument stay exact.
    function v2214ReferenceCitationPlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options}),empty={source,
            sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.discussionPage||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.citations===false||cfg.multilingual===false||
            !source.includes('<!--')||!/<ref\b[^>]*\bname\s*=/i.test(source)||
            v24SyntaxScan(source).issues.length||v20DefinitionContext(cfg))return empty;
        const observed=v219NativeReferenceObserver(source),edits=[];
        if(observed.unclosed.length||observed.empties.length)return empty;
        for(const ref of observed.refs){
            if(!ref.valid||!ref.attrs||!v29ReferenceName(ref.attrs.name)||ref.body===null||!ref.body.includes('<!--')||
                Object.keys(ref.attrs).some(key=>!['name','group'].includes(key)))continue;
            const body=ref.body,raw=body.trim(),padding=body.indexOf(raw),parsed=templates(protectedView(body));
            if(parsed.unclosed.length||parsed.nodes.length!==1||parsed.nodes[0].start!==padding||
                parsed.nodes[0].end!==padding+raw.length||!v215LiteralTemplateIdentity(raw))continue;
            const local=v219LocalCitationRedirectProfile(raw);
            if(!local)continue;
            const dates=v218CitationDatePlan(raw,cfg);
            if(!v218CitationDateProof(raw,dates.text,dates,cfg))continue;
            const forwarded=v219LocalCitationRedirectCall(dates.text,{...cfg,automaticParameterNames:false});
            if(!forwarded||forwarded.blocked||forwarded.issues?.length||
                forwarded.proof?.nativeAliasOldid!==local.nativeAliasOldid||
                forwarded.proof?.nativeTemplateOldid!==local.nativeTemplateOldid||
                forwarded.proof?.composedNativeMigration!==false)continue;
            const a=parsedTemplate(dates.text),b=parsedTemplate(forwarded.text);
            if(!v215SameTemplateTitle(b.parts[0],local.target)||
                JSON.stringify(a.parts.slice(1))!==JSON.stringify(b.parts.slice(1)))continue;
            const text=body.slice(0,padding)+forwarded.text+body.slice(padding+raw.length);
            if(text===body)continue;
            const start=ref.start+ref.raw.length;
            edits.push({start,end:start+body.length,text,proof:{sourceHash:empty.sourceHash,
                nativeAliasOldid:local.nativeAliasOldid,nativeTemplateOldid:local.nativeTemplateOldid,
                raw,dates,header:forwarded.proof}});
        }
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v2214ReferenceCitationProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2214ReferenceCitationPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219NamedReferenceRetention(before,after,cfg={}) {
        const original=v219CosmeticBaseNamedRetention(before,after,cfg);
        if(original.accepted)return original;
        const source=v219NativeHelperCosmeticContextSource(before,cfg),
            cosmetic=source===before?original:v219CosmeticBaseNamedRetention(source,after,cfg);
        if(cosmetic.accepted)return cosmetic;
        const linked=v219ReferenceFirstLetterSource(source,cfg),
            firstLetter=linked===source?cosmetic:v219CosmeticBaseNamedRetention(linked,after,cfg);
        if(firstLetter.accepted)return firstLetter;
        const recovered=v219ReferenceQuotationRecoveryRetention(source,after,cfg);
        if(recovered.accepted)return recovered;
        if(v219NativeLiteralScalarEquivalent(before,after,cfg))return {accepted:true,reason:''};
        const plan=v2214ReferenceCitationPlan(linked,cfg);
        return plan.text!==linked&&v2214ReferenceCitationProof(linked,plan.text,plan,cfg)?
            v219CosmeticBaseNamedRetention(plan.text,after,cfg):firstLetter;
    }
