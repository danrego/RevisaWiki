    // A self-closing ref inside a references body is an invalid definition slot.
    // This finite repair retains its unique complete outside source and all markers.
    function v219InvalidBankSelfLiteral(source,ref) {
        if(!ref||!Number.isInteger(ref.start)||!Number.isInteger(ref.end))return null;
        const openEnd=ref.body===null?ref.end:ref.close?.start-ref.body.length,
            open=source.slice(ref.start,openEnd),
            match=/^<ref name="([A-Za-z][A-Za-z0-9_.:-]{0,127})"(?: group="([A-Za-z][A-Za-z0-9_.:-]{0,127})")?( ?\/)?>$/.exec(open);
        if(!match||!!match[3]!==!!ref.self||!ref.valid||ref.attrs?.name!==match[1]||
            (ref.attrs?.group??'')!==(match[2]||'')||Object.keys(ref.attrs).some(key=>!['name','group'].includes(key)))return null;
        if(ref.body!==null&&(!ref.close||source.slice(ref.close.start,ref.end)!=='</ref>'))return null;
        return {name:match[1],group:match[2]||'',raw:source.slice(ref.start,ref.end),body:ref.body};
    }
    function v219InvalidBankSelfPlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options}),empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||!source.includes('<references')||
            cfg.references!==true||cfg.automaticReferenceRepairs!==true||!v24SyntaxScope(cfg)||cfg.namespaceNumber!==0||
            cfg.pageRedirect||cfg.pageDisambiguation||!v20AutomationAllowed(source,cfg))return empty;
        const index=v219SyntaxContextIndex(source);if(!index)return empty;
        const observed=v219NativeReferenceObserver(source);if(observed.unclosed.length||observed.empties.length)return empty;
        const ranges=rendererRanges(observed.view),protectedRanges=v219StageProtectedRanges(source,cfg),edits=[],root=at=>{
            const context=v219IndexedSyntaxContext(source,at);
            return !!context&&['templates','html','tables','links','external'].every(key=>!context[key].length);
        };
        // Weak title resemblance only refuses this producer. It never adds a renderer.
        const classified=new Set(ranges.map(peer=>peer.start+':'+peer.end));
        for(const node of v24SyntaxTemplates(observed.view).nodes){
            if(!root(node.start))continue;
            const call=source.slice(node.start,node.end),parts=v215BraceParts(call.slice(2,-2)),header=parts?.[0]?.text;
            if(typeof header!=='string')return empty;
            const weak=header.replace(/[\s_\u0000-\u001F\u007F-\u009F]/g,'').toLocaleLowerCase('pt');
            if(!/(?:^|:)(?:referências|referencias|references|referência|referencia|notas(?:ereferências)?|reflist|notelist|listanota|références|listaref)$/.test(weak))continue;
            const native=v219NativeReferenceCollectorAlias(header)||
                ['Notas','Notas e referências','Reflist'].some(title=>v215SameTemplateTitle(header,title))||
                v219BankImplementation().identity(header);
            if(!v219OriginalTemplateHeaderAllowed(header)||!native||!classified.has(node.start+':'+node.end))return empty;
        }
        for(const [bankOrdinal,range]of ranges.entries()){
            const raw=source.slice(range.start,range.end),bank=/^<references(?: group="([A-Za-z][A-Za-z0-9_.:-]{0,127})")?>([\s\S]*)<\/references>$/.exec(raw);
            if(!bank||!root(range.start))continue;
            const group=bank[1]||'',opening=raw.indexOf('>')+1,bodyStart=range.start+opening,bodyEnd=range.end-13,
                inside=observed.refs.filter(ref=>bodyStart<=ref.start&&ref.end<=bodyEnd);
            let cursor=bodyStart,complete=true;
            for(const ref of inside){if(source.slice(cursor,ref.start).trim()||ref.container?.start!==range.start){complete=false;break;}cursor=ref.end;}
            if(!complete||source.slice(cursor,bodyEnd).trim())continue;
            // A second native collector of this group makes placement ambiguous.
            if(ranges.some((peer,ordinal)=>{
                if(ordinal===bankOrdinal)return false;
                const call=source.slice(peer.start,peer.end),tag=v24SyntaxTag(call,0);let groups;
                if(tag?.name==='references'){
                    if(/[^\t\r\n\x20-\x7E]/.test(tag.raw))return true;
                    const attrs=v24SyntaxAttrs(tag.attrs);
                    if(!attrs||Object.keys(attrs).some(key=>!['group','responsive'].includes(key)||
                        !new RegExp('\\s'+key+'\\s*=').test(tag.attrs))||
                        attrs.responsive!==undefined&&!['0','1'].includes(attrs.responsive))return true;
                    groups=[attrs.group??''];
                }else{
                    const parts=v215BraceParts(call.slice(2,-2));
                    if(!parts?.length||!v219OriginalTemplateHeaderAllowed(parts[0].text))return true;
                    const native=v219NativeCollectorGroups(call);
                    if(!native.recognized||native.ambiguous)return true;
                    groups=native.groups;
                }
                return !Array.isArray(groups)||!groups.length||groups.some(value=>
                    typeof value!=='string'||value!==''&&!/^[A-Za-z][A-Za-z0-9_.:-]{0,127}$/.test(value)||value===group);
            }))continue;
            for(const ref of inside){
                if(ref.body!==null||!ref.self||ref.group!==group)continue;
                const literal=v219InvalidBankSelfLiteral(source,ref);
                if(!literal||literal.group!==group)continue;
                const family=observed.refs.filter(peer=>peer.group===group&&peer.attrs?.name===literal.name),
                    definitions=family.filter(peer=>peer.body!==null),outside=family.filter(peer=>!peer.container);
                if(definitions.length!==1||!outside.length||definitions[0].container)continue;
                const definition=definitions[0];
                if(!definition.body.trim()||/[\uE000-\uF8FF]/u.test(definition.body)||!v219CitationLanguageNamedMoveBody(definition.body)||
                    outside.some(peer=>peer.end>range.start||!root(peer.start)||!v219InvalidBankSelfLiteral(source,peer)||
                        protectedRanges.some(owner=>owner.start<peer.end&&peer.start<owner.end)))continue;
                // The target and outside definition are literal named siblings. No body is rewritten.
                edits.push({start:ref.start,end:ref.end,text:'',ruleId:'v219InvalidBankSelfCalls',proof:{
                    kind:'invalid-literal-bank-self-slot',sourceHash:empty.sourceHash,bankOrdinal,
                    bankStart:range.start,bankEnd:range.end,bankRaw:raw,name:literal.name,group,
                    refOrdinal:observed.refs.indexOf(ref),refRaw:literal.raw,definitionOrdinal:observed.refs.indexOf(definition),
                    definitionRaw:source.slice(definition.start,definition.end),outside:outside.map(peer=>
                        [observed.refs.indexOf(peer),source.slice(peer.start,peer.end),peer.group]),
                    primary:'anonymous-native-default-and-grouped-bank-self-pairs',retainedOutsideMarkers:true,retainedCompleteBody:true}});
            }
        }
        const allowed=v219StageSafeEdits(source,edits,'v219-invalid-bank-self-calls',cfg);
        return {...empty,edits:allowed,text:v24SyntaxApply(source,allowed)};
    }
    function v219InvalidBankSelfProof(before,after,plan,options={}) {
        if(typeof before!=='string'||!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219InvalidBankSelfPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219InvalidBankSelfEdits(source,cfg={}) {
        const plan=v219InvalidBankSelfPlan(source,cfg);
        return plan.edits.length&&v219InvalidBankSelfProof(source,plan.text,plan,cfg)?plan.edits:[];
    }
