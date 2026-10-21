    // Source plans must preserve ordered partial-reference obligations.
    function v219PartialReferenceEvents(source,cfg={}) {
        const observed=v219NativeReferenceObserver(source),events=[],collectors=rendererRanges(observed.view);
        for(const collector of collectors){
            const raw=source.slice(collector.start,collector.end),tag=v24SyntaxTag(source,collector.start),
                native=tag?.name==='references'?null:v219NativeCollectorGroups(raw),
                attrs=tag?.name==='references'?v24SyntaxAttrs(tag.attrs):null,
                groups=native?.recognized&&!native.ambiguous?native.groups:
                    attrs&&Object.keys(attrs).every(key=>['group','responsive'].includes(key))?[attrs.group||'']:null;
            events.push({start:collector.start,end:collector.end,kind:0,value:['collector',groups,raw]});
        }
        const refs=[...observed.refs,...observed.unclosed,...observed.empties],seen=new Set();
        for(const ref of refs){
            const key=ref.start+':'+ref.end;if(seen.has(key))continue;seen.add(key);
            const raw=source.slice(ref.start,ref.end),attrs=ref.attrs,body=ref.body===null?null:
                ref.valid&&attrs&&Object.keys(attrs).every(key=>['name','group'].includes(key))&&(!ref.container||ref.container.valid)?
                    v219NativeBankBodyIdentity(ref.body,cfg):null,
                value=body===null?['raw-reference',raw]:['reference',attrs,
                    source.slice(ref.start,ref.end-ref.close.raw.length-ref.body.length),['native-body',body],ref.close.raw],
                parent=collectors.find(collector=>collector.start<=ref.start&&ref.end<=collector.end);
            events.push({start:ref.start,end:ref.end,kind:1,value:[...value,
                ['native-context',ref.group??null,ref.renderer?.valid??null,ref.renderer?.group??null,
                    ref.container?.valid??null,ref.container?.group??null,!!parent]]});
        }
        for(const helper of observed.helpers)events.push({start:helper.start,end:helper.end,kind:2,
            value:['native-reference-helper',helper.raw,helper.eligible,helper.calls.map(call=>[call.value,call.group,call.body??null])]});
        return events.sort((a,b)=>a.start-b.start||a.kind-b.kind||b.end-a.end).map(event=>event.value);
    }

    // This projection is only a proved native redirect header change.
    // The separately fresh legacy plan must reach that exact source-authored
    // header-only endpoint. All bank arguments, children and context remain raw.
    function v219PartialNativeCollectorHeaderSource(source,cfg={}) {
        if(typeof source!=='string'||!source.includes('{{')||
            typeof v219BankNativeCollectorPlan!=='function'||typeof v219BankNativeCollectorProof!=='function')return source;
        const plan=v219BankNativeCollectorPlan(source,cfg);
        if(!plan.changed||!v219BankNativeCollectorProof(source,plan.text,plan,cfg))return source;
        const parsed=v24SyntaxTemplates(source),edits=[];
        if(parsed.unclosed.length)return source;
        for(const node of parsed.nodes){
            if(node.depth!==0||node.size!==2)continue;
            const raw=source.slice(node.start,node.end),parts=v215BraceParts(raw.slice(2,-2));
            if(!parts?.length||parts[0].text==='Referências')continue;
            const alias=v219NativeReferenceCollectorAlias(parts[0].text);
            if(!alias||![63785697,53514607,57539382,46305837,68804251].includes(alias.oldid))continue;
            edits.push({start:node.start+2,end:node.start+2+parts[0].end,text:'Referências',ruleId:'referenceLists'});
        }
        if(!edits.length)return source;
        // Reuse the original producer's source permissions for each exact
        // header interval. A protected neighboring alias must remain raw.
        const permitted=v219StageSafeEdits(source,edits,'v219-bank-native-collector-source',cfg);
        const authored=permitted.length?v24SyntaxApply(source,permitted):source;
        return authored===plan.text?authored:source;
    }

    function v219PartialNativeFieldSource(source,cfg={}) {
        const ordinary=mergeEditorialRanges([...v219QuotedTemplateRanges(source),...v219UnknownTemplateRanges(source,cfg),
            ...v219UncertainReferenceRanges(source,cfg)]),
            shield=maskProtected(source,()=>{},mergeEditorialRanges([...ordinary,...v219ReferenceDefinitionPeerRanges(source,ordinary,cfg)])),edits=[];
        for(const ref of refTokens(shield.text)){
            const attrs=attrsOf(ref.attrs);if(ref.body===null||!attrs||attrs.name||attrs.follow)continue;
            const padding=/^([ \t\r\n]*)([\s\S]*?)([ \t\r\n]*)$/.exec(ref.body),body=padding[2],
                bodySyntax=v24SyntaxTemplates(body),bodyRoots=bodySyntax.nodes.filter(node=>node.size===2&&node.depth===0);
            if(bodySyntax.unclosed.length||!bodyRoots.length||bodyRoots[0].start!==0)continue;
            const raw=body.slice(0,bodyRoots[0].end),tail=body.slice(bodyRoots[0].end),parsed=parsedTemplate(raw),
                context=v218CitationNativeContext(raw);
            if(tail.trim()){
                const maintenance=tail.trim(),p=parsedTemplate(maintenance),profile=TEMPLATE_CATALOG[p.name];
                if(bodyRoots.length!==2||bodyRoots[1].end!==body.length||p.parts.length!==1||
                    profile?.oldid!==72931857||profile.title!=='Ligação inativa'||
                    !v215LiteralTemplateIdentity(maintenance,profile)||!v215SameTemplateTitle(p.parts[0],profile.title))continue;
            }else if(bodyRoots.length!==1)continue;
            if(!raw.startsWith('{{')||!raw.endsWith('}}')||!v219NativeCitationTitle(parsed)||
                !v219SourceNativeContract(raw,context)||!v215LiteralTemplateIdentity(raw))continue;
            const structure=v24SyntaxTemplates(raw),roots=structure.nodes.filter(node=>node.size===2&&node.depth===0);
            if(structure.unclosed.length||roots.length!==1||roots[0].start!==0||roots[0].end!==raw.length)continue;
            const roles=foreignEntries(parsed).map(field=>({field,roles:field.positional?[]:v219NativeCitationRoles(field.key)})),parts=parsed.parts.slice();
            for(let index=1;index<parts.length;index++){
                const match=/^(\s*)([^=\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(parts[index]);if(!match)continue;
                const key=match[2].trim(),role=v219NativeCitationRoles(key),old=match[4];let value=old;
                if(cfg.dates&&role.length===1&&['AccessDate','ArchiveDate','Date'].includes(role[0])&&
                    roles.filter(row=>row.roles.includes(role[0])).length===1){
                    const literal=/^([ \t\r\n]*)(\d{1,2} de )([\p{L}]+)( de \d{4})([ \t\r\n]*)$/u.exec(old),
                        numeric=/^([ \t\r\n]*)(1[3-9]|2\d|3[01])([/-])(\d{1,2})\3([1-9]\d{3})([ \t\r\n]*)$/.exec(old),
                        smallNumeric=/^([ \t\r\n]*)(0?[1-9]|1[0-2])([/-])(\d{1,2})\3([1-9]\d{3})([ \t\r\n]*)$/.exec(old),
                        kind=role[0]==='AccessDate'?'access':role[0]==='ArchiveDate'?'archive':'publication';
                    let candidate=null,original=null;
                    if(literal&&Object.values(MONTH_PT).includes(literal[3].toLowerCase())){
                        candidate=literal[1]+literal[2]+literal[3].toLowerCase()+literal[4]+literal[5];
                        original=v218CitationDateValue(old,kind);
                    }else if(numeric&&validDate(Number(numeric[2]),Number(numeric[4]),Number(numeric[5]))){
                        candidate=numeric[1]+Number(numeric[2])+' de '+MONTH_PT[Number(numeric[4])]+' de '+Number(numeric[5])+numeric[6];
                        original={precision:'day',identity:{day:Number(numeric[2]),month:Number(numeric[4]),year:Number(numeric[5])}};
                    }else if(smallNumeric&&Number(smallNumeric[5])>=1583&&Number(smallNumeric[5])<=9999&&
                        validDate(Number(smallNumeric[2]),Number(smallNumeric[4]),Number(smallNumeric[5]))){
                        const dependencies=context.profile.dependencies,
                            cs1=Array.isArray(dependencies)?dependencies.filter(row=>row?.title==='Módulo:Citação/CS1'):[],
                            converter=Array.isArray(dependencies)?dependencies.filter(row=>row?.title==='Módulo:Conversor de data'):[];
                        if(cs1.length===1&&cs1[0].oldid===72936771&&converter.length===1&&converter[0].oldid===59166319){
                            candidate=smallNumeric[1]+Number(smallNumeric[2])+' de '+MONTH_PT[Number(smallNumeric[4])]+' de '+Number(smallNumeric[5])+smallNumeric[6];
                            original={precision:'day',identity:{day:Number(smallNumeric[2]),month:Number(smallNumeric[4]),year:Number(smallNumeric[5])}};
                        }
                    }
                    if(candidate!==null){
                        const next=v218CitationDateValue(candidate,kind),writer=v219ScalarValueWithPadding(old,normalizeDate(old,()=>{}));
                        if(original&&next&&original.precision==='day'&&next.precision==='day'&&
                            JSON.stringify(original.identity)===JSON.stringify(next.identity)&&writer===candidate)value=candidate;
                    }
                }
                const language=v219CitationLanguageFieldValue(raw,index,cfg);
                if(language)value=v219ScalarValueWithPadding(value,language.code);
                parts[index]=match[1]+match[2]+match[3]+value;
            }
            const candidate='{{'+parts.join('|')+'}}';if(candidate===raw)continue;
            // Existing source writers independently have to reach exactly
            // these selected fields. No other content rewrite is authorized.
            const writer=extendedCitation(citation(raw,cfg,()=>{},()=>{}),cfg,()=>{},()=>{});
            if(writer!==candidate)continue;
            edits.push({start:ref.openEnd,end:ref.end-ref.raw.match(/<\s*\/\s*ref\s*>$/i)[0].length,
                text:padding[1]+candidate+tail+padding[3]});
        }
        return shield.restore(edits.length?v24SyntaxApply(shield.text,edits):shield.text);
    }

    // The pinned native press-release module delegates PublicationDate to CS1.
    // The only comment admitted here is an intact, otherwise empty author slot.
    const v219FinitePartialPressPublicationCall=(raw,cfg)=>{
        if(!cfg.dates||cfg.automaticCitationDateValues===false)return raw;
        const parsed=parsedTemplate(raw),profile=TEMPLATE_CATALOG[parsed.name],
            direct=parsed.name==='citar jornal'&&profile?.oldid===55834874?['Módulo:Citar periódico',49463910]:
                parsed.name==='citar web'&&profile?.oldid===48262420?['Módulo:Citar web',48965255]:null;
        if(!direct&&(parsed.name!=='citar comunicado de imprensa'||profile?.oldid!==50506646)||
            !v215LiteralTemplateIdentity(raw,profile)||!v215SameTemplateTitle(parsed.parts[0],profile.title)||
            !v219OriginalTemplateHeaderAllowed(parsed.parts[0])||!v219NativeCitationStateInterface(raw))return raw;
        const dependencies=profile.dependencies,required=[direct||['Módulo:Citar comunicado de imprensa',53648408],
            ['Módulo:Citação/CS1',72936771],['Módulo:Citação/CS1/Configuração',73016847],
            ['Módulo:Citação/CS1/Whitelist',71860752],['Módulo:Conversor de data',59166319]];
        if(!Array.isArray(dependencies)||!required.every(([title,oldid])=>{
            const rows=dependencies.filter(row=>row?.title===title);return rows.length===1&&rows[0].oldid===oldid;
        }))return raw;
        const syntax=v24SyntaxTemplates(raw),fields=v2151FieldSyntaxParts(raw);
        if(syntax.unclosed.length||syntax.nodes.length!==1||syntax.nodes[0].start!==0||
            syntax.nodes[0].end!==raw.length||!fields?.length||fields.length>256||
            fields.some(field=>field.key!==field.plain||field.separator!=='='))return raw;
        if(direct){
            const comments=raw.match(/<!--[\s\S]*?-->/g)||[];
            if(comments.length>1||comments.length===1&&
                (!['<!--Not stated-->','<!--Not Stated-->'].includes(comments[0])||
                raw.split('<!--').length!==2||raw.split('-->').length!==2)||
                !comments.length&&(raw.includes('<!--')||raw.includes('-->')))return raw;
            let authors=0;
            for(const field of fields){
                if(!nativeCitationAccepts(parsed,field.key))return raw;
                if(field.key==='autor'&&/^[ \t]*<!--Not (?:stated|Stated)-->[ \t]*$/.test(field.value))authors++;
            }
            if(comments.length&&authors!==1)return raw;
        }else if(raw.includes('<!--')||raw.includes('-->')){
            const comments=raw.match(/<!--[\s\S]*?-->/g)||[];
            if(comments.length!==1||comments[0]!=='<!--Not stated-->'||
                raw.split('<!--').length!==2||raw.split('-->').length!==2||
                fields.filter(field=>field.key==='autor'&&/^[ \t]*<!--Not stated-->[ \t]*$/.test(field.value)).length!==1)return raw;
        }
        const dates=fields.filter(field=>v219NativeCitationRoles(field.key).includes('PublicationDate'));
        if(dates.length!==1)return raw;
        const field=dates[0],roles=v219NativeCitationRoles(field.key),
            match=/^([ \t]*)(1[3-9]|2\d|3[01])([/-])(\d{1,2})\3([1-9]\d{3})([ \t]*)$/.exec(field.value);
        if(roles.length!==1||!nativeCitationAccepts(parsed,field.key)||!match||
            Number(match[5])<1583||Number(match[5])>9999||!validDate(Number(match[2]),Number(match[4]),Number(match[5])))return raw;
        const value=match[1]+Number(match[2])+' de '+MONTH_PT[Number(match[4])]+' de '+Number(match[5])+match[6],
            native=v218CitationDateValue(value,'publication'),
            identity={day:Number(match[2]),month:Number(match[4]),year:Number(match[5])};
        if(!native||native.precision!=='day'||JSON.stringify(native.identity)!==JSON.stringify(identity)||
            v219ScalarValueWithPadding(field.value,normalizeDate(field.value,()=>{}))!==value)return raw;
        const candidate=v24SyntaxApply(raw,[{start:field.start,end:field.end,text:value}]),
            writer=extendedCitation(citation(raw,cfg,()=>{},()=>{}),cfg,()=>{},()=>{});
        return writer===candidate?candidate:raw;
    };

    const v219FinitePartialCitationCall=(raw,cfg)=>{
        if(!cfg.citations||typeof raw!=='string'||raw.length>65536)return raw;
        let call=raw,alias=v219LocalCitationRedirectProfile(call);
        if(alias){
            if(!cfg.multilingual||![48262420,48159689,55834874,48090957,68628855].includes(alias.nativeTemplateOldid)||
                alias.source.language!=='pt'||Object.keys(alias.fields).length||Object.keys(alias.numbered).length)return raw;
            const header=splitParts(call.slice(2,-2))[0],pad=/^([ \t]*)[^\r\n]*?([ \t]*)$/.exec(header);
            if(!pad||!v219OriginalTemplateHeaderAllowed(header))return raw;
            const candidate='{{'+pad[1]+alias.target+pad[2]+call.slice(2+header.length),
                declared=v219LocalCitationRedirectCall(call,cfg,alias);
            if(!declared||declared.blocked||declared.text!==candidate)return raw;
            call=candidate;
        }
        const publication=v219FinitePartialPressPublicationCall(call,cfg);
        if(publication!==call)return publication;
        // This existing source-only field certificate retains rich neighboring
        // arguments byte-for-byte, including literal title helper calls.
        const fieldFrame='<ref>'+call+'</ref>',fieldSource=v219PartialNativeFieldSource(fieldFrame,cfg);
        if(fieldSource.startsWith('<ref>')&&fieldSource.endsWith('</ref>'))call=fieldSource.slice(5,-6);
        const original=v219CitationLanguageKeeperCall(call);
        if(!original)return call;
        if(original.fields.length>256)return raw;
        const people=v219CitationLanguageKeeperPeople(call,cfg);
        if(people!==null)call=people;
        call=v219FinitePartialPressPublicationCall(call,cfg);
        const date=v218CitationDatePlan(call,cfg);
        if(date.edits.length&&v218CitationDateProof(call,date.text,date,cfg)&&
            JSON.stringify(v219StageSafeEdits(call,date.edits,'v218-citation-date-values',cfg))===JSON.stringify(date.edits))call=date.text;
        const archive=v219CitationLanguageKeeperArchive(call,cfg);
        if(archive!==null)call=archive;
        const source=v219CitationLanguageKeeperCall(call),pages=source?.fields.filter(field=>
            nativeCitationAccepts(source.parsed,field.key)&&v219NativeCitationRoles(field.key).some(role=>role==='Page'||role==='Pages'));
        if(pages?.length===1){
            const field=pages[0],value=field.value.match(/^[ \t]*/)[0]+field.value.replace(/^[ \t]+|[ \t]+$/g,'');
            if(['página','páginas','p','pp'].includes(norm(field.key))&&
                value!==field.value&&value&&!/[\r\n]/.test(field.value)){
                const candidate=v24SyntaxApply(call,[{start:field.start,end:field.end,text:value}]);
                if(v219CitationLanguageKeeperScalar(call,candidate,cfg)!==null)call=candidate;
            }
        }
        for(const role of ['Volume','Edition']){
            const current=v219CitationLanguageKeeperCall(call),selected=current?.fields.filter(field=>
                v219NativeCitationRoles(field.key).includes(role));
            if(!current||selected.length!==1||!current.fields.every(field=>nativeCitationAccepts(current.parsed,field.key))||
                current.fields.filter(field=>v219NativeCitationRoles(field.key).some(key=>key==='Page'||key==='Pages')).length>1)continue;
            const field=selected[0],roles=v219NativeCitationRoles(field.key),value=field.value.match(/^[ \t]*/)[0]+field.value.replace(/^[ \t]+|[ \t]+$/g,'');
            if(roles.length!==1||norm(field.key)!==(role==='Volume'?'volume':'edição')||
                value===field.value||!value||/[\r\n]/.test(field.value))continue;
            const candidate=v24SyntaxApply(call,[{start:field.start,end:field.end,text:value}]);
            if(v219CitationLanguageKeeperScalar(call,candidate,cfg)!==null)call=candidate;
        }
        const framed='<ref>'+call+'</ref>',dates=v219PartialNativeFieldSource(framed,cfg);
        if(dates.startsWith('<ref>')&&dates.endsWith('</ref>'))call=dates.slice(5,-6);
        if(cfg.singleLineCitations&&/[\r\n]/.test(call)){
            const compact=call.replace(/\r?\n[ \t]*(?=\||}})/g,'').replace(/\r?\n[ \t]*(?=}}$)/g,'');
            if(!/[\r\n]/.test(compact)&&v219CitationLanguageKeeperScalar(call,compact,cfg)===compact)call=compact;
        }
        return v219CitationLanguageKeeperCall(call)?call:raw;
    };
    const v219FinitePartialCitationSource=(source,cfg)=>{
        if(typeof source!=='string'||source.length>4194304||!cfg.citations||cfg.sectionOnly||
            Number(cfg.namespaceNumber??0)!==0||cfg.contentModel&&cfg.contentModel!=='wikitext'||
            cfg.model&&cfg.model!=='wikitext'||!v20AutomationAllowed(source,cfg))return source;
        const recovery=syntaxRepairPrefix(source,cfg),end=recovery.unresolved.length?recovery.end:source.length;
        if(recovery.unresolved.length&&(cfg.partialSyntaxRecovery===false||end<=0))return source;
        const observed=v219NativeReferenceObserver(source),edits=[];
        for(const ref of observed.refs){
            if(ref.end>end||!ref.valid||!ref.attrs||Object.keys(ref.attrs).some(key=>key!=='group')||!v24SyntaxLiteralIdentity(ref.attrs)||
                ref.body===null||ref.body.length>65536||!ref.renderer.valid||ref.container&&!ref.container.valid)continue;
            const padding=/^([ \t\r\n]*)([\s\S]*?)([ \t\r\n]*)$/.exec(ref.body),body=padding[2],syntax=v24SyntaxTemplates(body),
                roots=syntax.nodes.filter(node=>node.depth===0&&node.size===2);
            if(syntax.unclosed.length||roots.length!==1||roots[0].start!==0)continue;
            const raw=body.slice(0,roots[0].end),tail=body.slice(roots[0].end);
            if(tail.length>1024)continue;
            let safe=true;
            for(let at=0;at<tail.length;){
                if(tail.startsWith("''",at)){
                    const end=tail.indexOf("''",at+2),inside=end<0?'':tail.slice(at+2,end);
                    if(!inside.trim()||!/^[ \t\p{L}\p{N}.,:;!?()/-]+$/u.test(inside)){safe=false;break;}
                    at=end+2;
                }else if(/^[ \t\p{L}\p{N}.,:;!?()/-]$/u.test(tail[at]))at++;
                else{safe=false;break;}
            }
            if(!safe)continue;
            const call=v219FinitePartialCitationCall(raw,cfg);
            if(call===raw)continue;
            const opening=v24SyntaxTag(source,ref.start),close=ref.close;
            if(!opening||!close||source.slice(opening.end,close.start)!==ref.body||close.end!==ref.end||!/^<\/ref\s*>$/i.test(close.raw))continue;
            edits.push({start:opening.end,end:close.start,text:padding[1]+call+tail+padding[3],ruleId:'citationParameters'});
        }
        if(!edits.length)return source;
        const permitted=v219StageSafeEdits(source,edits,'v219-finite-partial-citation-source',cfg);
        return permitted.length?v24SyntaxApply(source,permitted):source;
    };

    function v219PartialReferenceRetention(before,baseline,after,cfg={}) {
        const empty={accepted:true,reason:'',checked:0},actual=v219PartialReferenceEvents(after,cfg),
            source=v219PartialReferenceEvents(before,cfg),expected=v219PartialReferenceEvents(baseline,cfg);
        if(!source.length&&!expected.length)return empty;
        const same=(value,events)=>{
            const recovery=syntaxRepairPrefix(value,cfg),tailUnchanged=cfg.partialSyntaxRecovery===false||
                !recovery.unresolved.length||after.endsWith(value.slice(recovery.end));
            return tailUnchanged&&JSON.stringify(events)===JSON.stringify(actual);
        },accept=events=>({...empty,checked:events.length,rawFallback:true,partialEventFallback:true});
        if(same(before,source))return accept(source);
        if(same(baseline,expected))return accept(expected);
        for(const input of before===baseline?[baseline]:[before,baseline]){
            // Compose only fresh, already checked source producers. Neither
            // the supplied output nor its raw reference inventory is projected.
            let certified=input;
            for(const [make,prove]of [[v219BankExistingCollectorPlan,v219BankExistingCollectorProof],
                [v219ReferenceLegacyCollectorPlan,v219ReferenceLegacyCollectorProof],
                [v219BankNativeCollectorPlan,v219BankNativeCollectorProof],
                [v219SourceCompatibilityPlan,v219SourceCompatibilityProof]]){
                const plan=make(certified,cfg);
                if(plan.text!==certified&&prove(certified,plan.text,plan,cfg)&&
                    (make!==v219SourceCompatibilityPlan||JSON.stringify(v219StageSafeEdits(certified,
                        plan.edits,'v219-source-compatibility',cfg))===JSON.stringify(plan.edits)))certified=plan.text;
            }
            const bank=v219BankProjection(certified,cfg);if(bank!==certified)certified=bank;
            const openings=[];
            for(const ref of v219NativeReferenceObserver(certified).refs){
                const attrs=ref.attrs,state=v219IndexedSyntaxContext(certified,ref.start),open=v24SyntaxTag(certified,ref.start);
                if(!attrs||!open||!state||state.templates.length||state.html.length||state.links.length||state.external.length||
                    Object.keys(attrs).some(key=>!['name','group'].includes(key)))continue;
                const text='<ref'+(attrs.name?' name="'+attrs.name+'"':'')+(attrs.group?' group="'+attrs.group+'"':'')+
                    (ref.body===null?' />':'>');
                if(text!==open.raw)openings.push({start:ref.start,end:open.end,text});
            }
            if(openings.length){const quoted=v24SyntaxApply(certified,openings);
                if(v219CitationLanguageOpeningsRetained(certified,quoted,cfg))certified=quoted;}
            const certifiedEvents=v219PartialReferenceEvents(certified,cfg);
            if(certified!==input&&same(certified,certifiedEvents))return accept(certifiedEvents);
            const finite=v219FinitePartialCitationSource(certified,cfg);
            if(finite===certified)continue;
            const original=v219NativeReferenceObserver(certified).refs,planned=v219NativeReferenceObserver(finite).refs,
                current=v219NativeReferenceObserver(after).refs;
            if(original.length===planned.length&&planned.length===current.length&&planned.every((ref,index)=>
                certified.slice(original[index].start,original[index].end)===finite.slice(ref.start,ref.end)||
                finite.slice(ref.start,ref.end)===after.slice(current[index].start,current[index].end))){
                const events=v219PartialReferenceEvents(finite,cfg);if(same(finite,events))return accept(events);
            }
        }
        const nativeCitation=v219NestedCitationSourcePlan(baseline,cfg);
        if(nativeCitation.edits.length&&v219NestedCitationSourceProof(baseline,nativeCitation.text,nativeCitation,cfg)&&
            v219NestedCitationOwnersRetained(nativeCitation.text,after,nativeCitation)){
            const events=v219PartialReferenceEvents(nativeCitation.text,cfg);
            if(same(nativeCitation.text,events))return accept(events);
        }
        if(typeof v219BankProjection==='function'){
            // Exact source plan/proof only, including dormant argument bytes
            // and original hard-owner permissions. Never project the target.
            const bank=v219BankProjection(baseline,cfg);
            if(bank!==baseline){const events=v219PartialReferenceEvents(bank,cfg);if(same(bank,events))return accept(events);}
        }
        const nativeHeader=v219PartialNativeCollectorHeaderSource(baseline,cfg);
        if(nativeHeader!==baseline){const events=v219PartialReferenceEvents(nativeHeader,cfg);if(same(nativeHeader,events))return accept(events);}
        if(typeof v219BankNativeGroupPlan==='function'&&typeof v219BankNativeGroupProof==='function'){
            // A separately declared supplied-group repair may follow a fresh
            // exact native redirect/source-bank header projection. Both are
            // original-source producers; the candidate is never projected.
            const bank=typeof v219BankProjection==='function'?v219BankProjection(baseline,cfg):baseline,
                groups=v219BankNativeGroupPlan(bank,cfg);
            if(groups.edits?.length&&v219BankNativeGroupProof(bank,groups.text,groups,cfg)){
                const events=v219PartialReferenceEvents(groups.text,cfg);
                if(same(groups.text,events))return accept(events);
            }
        }
        return {accepted:false,checked:expected.length,rawFallback:true,
            reason:'Uma referência preservada no código incompleto perdeu o nome, grupo, conteúdo ou ordem original.'};
    }
