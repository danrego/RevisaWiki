    // Source-only normalization composes the verified native helper repairs.
    // The candidate still requires the complete reference-retention checks.
    function v219NativeHelperCosmeticCall(raw,options={}) {
        const cfg={...DEFAULTS,...options,automaticParameterNames:false};
        if(typeof raw!=='string'||cfg.auxiliaryTemplates!==true||!raw.startsWith('{{')||!raw.endsWith('}}'))return null;
        const p=parsedTemplate(raw),literalHeader=p.parts[0];
        // Native identity is established from the supplied header before any
        // canonical profile spelling is used to delegate argument cleanup.
        if(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(literalHeader)||
            /[^\S \t\r\n]/u.test(literalHeader))return null;
        const head=v215TemplateTitle(literalHeader),pins={
            Refn:[57056787,57056787],Efn:[68628864,68628877],Nre:[68628864,68628864],Sfn:[67697954,67697954],HarvRef:[60788260,60788260],
            Sfnp:[62112876,62112876],Sfnm:[44333336,44333336],Sfnmp:[72289570,72289570]};
        const family=Object.keys(pins).find(name=>head===name||head===name[0].toLowerCase()+name.slice(1)),
            pin=family&&pins[family],profile=family&&TEMPLATE_CATALOG[norm(family)],native=v219NativeNoteProfiles(raw);
        if(!pin||profile?.oldid!==pin[0]||!v215SameTemplateTitle(p.parts[0],family)||native.length!==1||native[0].start!==0||native[0].end!==raw.length||
            native[0].nativeOldid!==pin[1]||native[0].attributeScope)return null;
        const rows=[];let implicit=1;
        for(let index=1;index<p.parts.length;index++){
            const part=p.parts[index],named=biographyNamedPart(part),key=named?named.key:String(implicit++),value=named?named.value:part;
            if(!key||/[{}<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(key+value))return null;
            if(!profileAccepts(profile,key)&&value.trim())return null;
            rows.push({index,part,key,value,positional:!named});
        }
        const removed=new Set();
        if(cfg.automaticParameterDuplicates===true){
            const families=new Map();for(const row of rows)if(!row.positional){
                if(!families.has(row.key))families.set(row.key,[]);families.get(row.key).push(row);
            }
            for(const family of families.values())if(family.length>1&&family.every(row=>row.value===family[0].value))
                for(const row of family.slice(0,-1))removed.add(row.index);
        }
        if(cfg.automaticEmptyParameters===true&&!profile.partial)for(const row of rows)
            if(!removed.has(row.index)&&!row.positional&&!/^\d+$/.test(row.key)&&!profileAccepts(profile,row.key)&&!row.value.trim())removed.add(row.index);
        if(!removed.size)return null;
        const canonical='{{'+profile.title+raw.slice(2+p.parts[0].length);
        if(!v215LiteralTemplateIdentity(canonical,profile))return null;
        const ruleIds=[],delegated=automaticParameters(canonical,cfg,id=>ruleIds.push(id)),
            text='{{'+p.parts[0]+delegated.slice(2+profile.title.length),allowed='{{'+p.parts.filter((part,index)=>!removed.has(index)).join('|')+'}}';
        if(text===raw||text!==allowed||ruleIds.length!==removed.size||
            ruleIds.some(id=>!['parameterDuplicates','emptyInvalidParameters'].includes(id)))return null;
        const read=value=>{const result=new Map();let next=1;for(const part of parsedTemplate(value).parts.slice(1)){
            const named=biographyNamedPart(part),key=named?named.key:String(next++),body=named?named.value:part;
            if(profileAccepts(profile,key)||/^\d+$/.test(key))result.set(key,body);
        }return [...result].sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);};
        if(JSON.stringify(read(raw))!==JSON.stringify(read(text)))return null;
        return {text,ruleIds,proof:{kind:'native-helper-identical-or-ignored-empty-parameters',family,
            nativeProfileOldid:pin[0],nativeEmitterOldid:pin[1],before:raw,after:text,
            removedIndices:[...removed].sort((a,b)=>a-b),effectiveArguments:read(raw)}};
    }
    function v219NativeHelperCosmeticPlan(source,options={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]},
            cfg={...DEFAULTS,...options};
        if(typeof source!=='string'||source.length>4194304||cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.discussionPage||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.auxiliaryTemplates!==true||
            !/\{\{[\s_]*(?:(?:predefinição|template)[\s_]*:[\s_]*)?(?:refn|efn|nre|sfn|harvref|sfnp|sfnmp?)(?=[\s_|}])/i.test(source)||
            v24SyntaxScan(source).issues.length)return empty;
        const profiles=v219NativeNoteProfiles(source),candidates=[];
        for(const profile of profiles){
            if(profile.attributeScope)continue;
            const call=v219NativeHelperCosmeticCall(profile.raw,cfg);
            if(call)candidates.push({start:profile.start,end:profile.end,text:call.text,ruleId:call.ruleIds[0],
                proof:{...call.proof,sourceHash:empty.sourceHash,ruleIds:call.ruleIds}});
        }
        if(!candidates.length)return empty;
        const owners=candidates.map(edit=>({start:edit.start,end:edit.end,referenceHelper:true})),
            uncertain=kind=>typeof kind==='string'&&kind.startsWith('uncertain-reference-'),
            normal=v219StageProtectedRanges(source,cfg,true,owners,true).filter(range=>!uncertain(range.kind)&&
                range.kind!=='reference-definition-peer'&&!(range.kind==='unknown-template-owner'&&
                    owners.some(owner=>owner.start===range.start&&owner.end===range.end))),
            quotation=v24SyntaxProtected(source).ranges.filter(range=>['quotation','quotation-markup','quotation-template'].includes(range.kind)),
            hard=[...normal,...quotation],peers=v219ReferenceDefinitionPeerRanges(source,hard,cfg);
        let edits=candidates.filter(edit=>![...hard,...peers].some(range=>range.start<edit.end&&edit.start<range.end));
        edits=v219AtomicNamedReferenceEdits(source,edits,cfg);
        if(!edits.length)return empty;
        const text=v24SyntaxApply(source,edits);
        // Unrelated identity uncertainty keeps the entire reference subsystem
        // opaque. This exception never authorizes a partial quarantine escape.
        if(v219ReferenceIdentityQuarantine(text,cfg).opaque)return empty;
        return {...empty,text,edits};
    }
    function v219NativeHelperCosmeticProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219NativeHelperCosmeticPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219NativeHelperCosmeticSource(before,cfg={}) {
        const plan=v219NativeHelperCosmeticPlan(before,cfg);
        return plan.edits.length&&v219NativeHelperCosmeticProof(before,plan.text,plan,cfg)?plan.text:before;
    }
    // Existing renderer evidence remains bound to the original complete source.
    // Only this fresh argument-preserving cosmetic plan may carry it forward.
    function v219NativeHelperCosmeticContextSource(before,cfg={}) {
        const source=v219NativeHelperCosmeticSource(before,cfg);
        if(source===before||cfg.noteRendererProofSource!==before)return source;
        return automaticMissingNoteCollector(source,{...cfg,noteRendererProofSource:source},()=>{});
    }
    function v219ReferenceNameReservation(source,cfg={}) {
        const original=v219CosmeticBaseNameReservation(source,cfg),plan=v219NativeHelperCosmeticPlan(source,cfg);
        if(!plan.edits.length||!v219NativeHelperCosmeticProof(source,plan.text,plan,cfg))return original;
        // Read effective unchanged native arguments through the fresh source
        // proof. Re-observation retains all independent unknown/dynamic input
        // and every prior caller reservation. Never clear a supplied flag.
        const semantic=v219CosmeticBaseNameReservation(plan.text,cfg);
        return {names:[...new Set([...original.names,...semantic.names])],
            dynamic:semantic.dynamic||cfg.v219ReferenceReservation?.dynamic===true};
    }
    function v219NativeAnonymousNoteOwners(source,cfg={}) {
        const empty={safe:false,owners:[]};
        if(typeof source!=='string'||!/refn|nre|efn/i.test(source))return empty;
        const notes=v219NativeNoteProfiles(source).filter(note=>note.helperKind==='note');
        if(!notes.length||notes.some(note=>!note.eligible||note.attributeScope||
            ![57056787,68628864,68628877].includes(note.nativeOldid)||note.calls.length!==1||
            note.fields.some(field=>['name','nome'].includes(field.key))||
            note.calls.some(call=>call.value||!call.body||!call.body.trim()||/[{}<>\[\]&\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(call.body))))return empty;
        const owners=notes.map(note=>({start:note.start,end:note.end,referenceHelper:true})),
            ranges=v219StageProtectedRanges(source,cfg,true,owners,true).filter(range=>
                !range.kind?.startsWith('uncertain-reference-')&&range.kind!=='reference-definition-peer'&&
                !(range.kind==='unknown-template-owner'&&owners.some(owner=>owner.start===range.start&&owner.end===range.end))),
            quotes=v24SyntaxProtected(source).ranges.filter(range=>['quotation','quotation-markup','quotation-template'].includes(range.kind));
        if(owners.some(owner=>[...ranges,...quotes].some(range=>range.start<owner.end&&owner.start<range.end)))return empty;
        return {safe:true,owners};
    }
    function v219NativeHelperCosmeticAssociation(before,source,after,cfg={}) {
        const fail=reason=>({accepted:false,reason});
        const original=v219RawNamedReferenceClasses(before),actualClasses=v219RawNamedReferenceClasses(after);
        for(const [key,bodies]of original)if(bodies.size===1&&(actualClasses.get(key)?.size||0)>1)
            return fail('A limpeza cosmética não autoriza dividir definições antes idênticas.');
        const actual=v219ReferenceBindingState(after,cfg,true),same=value=>{
            const expected=v219ReferenceBindingState(value,cfg,true);
            return JSON.stringify([expected.definitions,expected.calls,expected.opaqueRefs,expected.opaqueCollectors,expected.bankEntries||[],expected.collectorGroups||[],expected.unread])===
                JSON.stringify([actual.definitions,actual.calls,actual.opaqueRefs,actual.opaqueCollectors,actual.bankEntries||[],actual.collectorGroups||[],actual.unread]);
        };
        if(same(source))return {accepted:true,reason:''};
        // Reuse only the existing finite source producers. The supplied
        // output never receives the new cosmetic source projection.
        let expected=v25ApprovedSyntaxPlan(source,cfg).text;
        expected=cfg.references===false?v219BareReferenceSourceProjection(expected,cfg):v25ReferenceProofNormalization(expected,cfg);
        if(same(expected))return {accepted:true,reason:''};
        if(typeof v219BankProjection==='function'){
            const bank=v219BankProjection(expected,cfg);
            if(bank!==expected&&same(bank))return {accepted:true,reason:''};
        }
        if(cfg.endMatter&&v219GeneratedDefaultCollectorAllowed(expected,cfg)){
            const base=v219ReferenceBindingState(expected,cfg,true),groups=base.collectorGroups||[];
            if(!groups.some(value=>value?.includes(''))){
                const added=endMatterPass(expected,()=>{},()=>{},cfg),next=v219ReferenceBindingState(added,cfg,true);
                if(JSON.stringify(next.collectorGroups)===JSON.stringify([...groups,['']])&&
                    JSON.stringify([base.definitions,base.calls,base.opaqueRefs,base.opaqueCollectors,base.bankEntries||[],base.unread])===
                    JSON.stringify([next.definitions,next.calls,next.opaqueRefs,next.opaqueCollectors,next.bankEntries||[],next.unread])&&same(added))
                    return {accepted:true,reason:''};
            }
        }
        return fail('A limpeza cosmética alterou uma chamada, fonte, grupo ou banco de referências.');
    }
    function v219UncertainReferenceRetention(before,after,cfg={}) {
        const original=v219CosmeticBaseUncertainRetention(before,after,cfg);
        if(original.accepted)return original;
        const source=v219NativeHelperCosmeticContextSource(before,cfg);
        if(source!==before){
            const retained=v219CosmeticBaseUncertainRetention(source,after,cfg);
            if(retained.accepted)return v219NativeHelperCosmeticAssociation(before,source,after,cfg);
        }
        // A disjoint native/source-bound collector may independently forward
        // its exact interface. Re-observe only its fresh SOURCE plan; every
        // uncertain identity and every candidate byte still faces the base guard.
        const bank=typeof v219BankProjection==='function'?v219BankProjection(before,cfg):before;
        if(bank===before)return original;
        const projected=v219NativeHelperCosmeticSource(bank,cfg),
            retained=v219CosmeticBaseUncertainRetention(projected,after,cfg);
        return retained.accepted?v219NativeHelperCosmeticAssociation(before,projected,after,cfg):retained;
    }
    function v219NamedReferenceRetention(before,after,cfg={}) {
        const original=v219CosmeticBaseNamedRetention(before,after,cfg);
        if(original.accepted)return original;
        const source=v219NativeHelperCosmeticContextSource(before,cfg),cosmetic=source===before?original:v219CosmeticBaseNamedRetention(source,after,cfg);
        if(cosmetic.accepted)return cosmetic;
        const linked=v219ReferenceFirstLetterSource(source,cfg);
        const firstLetter=linked===source?cosmetic:v219CosmeticBaseNamedRetention(linked,after,cfg);
        if(firstLetter.accepted)return firstLetter;
        const recovered=v219ReferenceQuotationRecoveryRetention(source,after,cfg);
        if(recovered.accepted)return recovered;
        return v219NativeLiteralScalarEquivalent(before,after,cfg)?{accepted:true,reason:''}:firstLetter;
    }
    function v219GeneratedReferenceOrderRetention(before,after,cfg={}) {
        if(v219CosmeticBaseGeneratedOrderRetention(before,after,cfg))return true;
        const source=v219NativeHelperCosmeticContextSource(before,cfg);
        return source!==before&&v219CosmeticBaseGeneratedOrderRetention(source,after,cfg);
    }
    function v219GeneratedReferenceRetention(before,after,cfg={}) {
        const original=v219CosmeticBaseGeneratedRetention(before,after,cfg);
        if(original.accepted)return original;
        const source=v219NativeHelperCosmeticContextSource(before,cfg);
        return source===before?original:v219CosmeticBaseGeneratedRetention(source,after,cfg);
    }

    // Read the complete restored Source. An editing placeholder is never
    // evidence that an unknown emitter cannot occupy the proposed name.
    const v219EarlyAnonymousRead=(source,cfg={})=>{
        if(typeof source!=='string'||source.length>4194304||cfg.references!==true||cfg.automaticIdenticalReferences!==true||
            cfg.sectionOnly||Number(cfg.namespaceNumber??0)!==0||cfg.discussionPage||cfg.pageRedirect||cfg.pageDisambiguation||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.model&&cfg.model!=='wikitext'||
            /\{\{\{|[\uE000-\uF8FF]/u.test(source)||v24SyntaxScan(source).issues.length)return null;
        const literal=value=>typeof value==='string'&&!!value.trim()&&
            !/[{}\[\]<>&|"'\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\ufeff]/u.test(value),
            identity=value=>value===''||v29ReferenceName(value)&&!v219UncertainReferenceIdentity(value),
            observed=v219NativeReferenceObserver(source),protectedSource=v24SyntaxProtected(source),
            reservation=v219ReferenceNameReservation(source,cfg),nodes=templates(v219NativeReferenceBraceView(source).view);
        if(observed.unclosed.length||observed.empties.length||protectedSource.unclosed.length||nodes.unclosed.length||reservation.dynamic)return null;
        const stack=[],wrappers=[];
        for(let at=source.indexOf('<');at>=0;){
            const tag=v24SyntaxTag(source,at);if(!tag||tag.typo)return null;
            at=source.indexOf('<',tag.end);
            if(tag.name==='ref')continue;
            if(!['code','blockquote'].includes(tag.name)||tag.attrs.trim()||tag.self||
                !/^<\/?(?:code|blockquote)>$/i.test(tag.raw))return null;
            if(!tag.close)stack.push(tag);
            else{
                const opening=stack.pop();if(!opening||opening.name!==tag.name)return null;
                wrappers.push({start:opening.start,end:tag.end,raw:source.slice(opening.start,tag.end)});
            }
        }
        if(stack.length)return null;
        const helpers=observed.helpers;
        for(const helper of helpers){
            if(!helper.eligible||helper.attributeScope||!helper.calls.length||helper.calls.some(call=>!identity(call.value)||!identity(call.group)))return null;
            if(helper.helperKind==='r'){
                if(![72110148,57611773].includes(helper.nativeOldid)||
                    helper.fields.some(field=>!(/^[1-9]$/.test(field.key)||field.key==='group')))return null;
            }else if(helper.helperKind==='note'){
                if(helper.nativeOldid!==57056787||helper.calls.length!==1||
                    helper.fields.some(field=>!['1','refn','name','group'].includes(field.key))||
                    helper.calls[0].body!==null&&!literal(helper.calls[0].body))return null;
            }else return null;
        }
        const collectors=[];
        for(const node of nodes.nodes){
            if(helpers.some(helper=>helper.start===node.start&&helper.end===node.end))continue;
            const raw=source.slice(node.start,node.end),parsed=parsedTemplate(raw),fields=foreignEntries(parsed),seen=new Set(),
                native=v219BankBaseNativeCollectorGroups(raw);
            if(!v219NativeReferenceCollectorAlias(parsed.parts[0])||!v219OriginalTemplateHeaderAllowed(parsed.parts[0])||
                !native.recognized||native.ambiguous||fields.some(field=>{
                    if(seen.has(field.key)||!['1','colunas','grupo'].includes(field.key))return true;
                    seen.add(field.key);const value=field.value.trim();
                    return field.key==='grupo'?!identity(value):!/^(?:[1-9]|10)$/.test(value);
                }))return null;
            collectors.push({start:node.start,end:node.end,raw,groups:native.groups});
        }
        for(const ref of observed.refs){
            const attrs=ref.attrs,entity=attrs?.name==='ref-auto-&#49;';
            if(!ref.valid||!attrs||ref.container||!ref.renderer.valid||!v29ReferenceTag(source,ref)||
                Object.keys(attrs).some(key=>!['name','group','follow'].includes(key))||
                Object.hasOwn(attrs,'name')&&!entity&&!identity(attrs.name)||
                Object.hasOwn(attrs,'group')&&!identity(attrs.group)||
                Object.hasOwn(attrs,'follow')&&(!identity(attrs.follow)||!attrs.follow||Object.hasOwn(attrs,'name')||Object.hasOwn(attrs,'group')||ref.body===null)||
                ref.body!==null&&!literal(ref.body))return null;
        }
        const renderers=rendererRanges(observed.view);
        if(renderers.length!==collectors.length||renderers.some(range=>!collectors.some(item=>item.start===range.start&&item.end===range.end)))return null;
        const events=[...observed.refs.map((ref,index)=>({start:ref.start,value:['ref',index,source.slice(ref.start,ref.end)]})),
            ...helpers.map(helper=>({start:helper.start,value:['helper',helper.raw,helper.nativeOldid]})),
            ...collectors.map(collector=>({start:collector.start,value:['collector',collector.raw]}))]
            .sort((a,b)=>a.start-b.start).map(event=>event.value);
        const signature={events,refs:observed.refs.map(ref=>[source.slice(ref.start,ref.end),ref.group,
                collectors.filter(collector=>collector.end<=ref.start).map(collector=>collector.groups)]),
            helpers:helpers.map(helper=>[helper.raw,helper.nativeOldid,helper.calls.map(call=>[call.value,call.group,call.body??null])]),
            collectors:collectors.map(collector=>[collector.raw,collector.groups]),wrappers:wrappers.map(wrapper=>wrapper.raw),
            protected:protectedSource.ranges.map(range=>[range.kind,source.slice(range.start,range.end)])};
        return {observed,collectors,helpers,protectedSource,reservation,signature};
    };

    // The independent family constructor never calls the old deduplication
    // writer, normalizeRefs, or a global retention guard.
    const v219EarlyAnonymousPlan=(source,options={})=>{
        const cfg={...DEFAULTS,...options},empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],families:[]},
            read=v219EarlyAnonymousRead(source,cfg);
        if(!read||v219AnonymousReferenceGenerationAllowed(source,cfg))return empty;
        const hard=[...v219StageProtectedRanges(source,cfg),...read.protectedSource.ranges],families=new Map(),
            names=new Set(read.reservation.names),refs=read.observed.refs;
        for(const [ordinal,ref]of refs.entries()){
            const attrs=ref.attrs,context=v219IndexedSyntaxContext(source,ref.start);
            if(Object.keys(attrs).some(key=>key!=='group')||Object.hasOwn(attrs,'group')&&!attrs.group||ref.body===null||
                !context||context.templates.length||context.html.length||context.tables.length||context.links.length||context.external.length||
                hard.some(range=>range.start<ref.end&&ref.start<range.end))continue;
            const region=read.collectors.filter(collector=>collector.end<=ref.start).length,
                key=JSON.stringify([ref.group,region,ref.body]);
            if(!families.has(key))families.set(key,[]);families.get(key).push({ref,ordinal});
        }
        const edits=[],selected=[];let counter=1;
        for(const family of families.values()){
            if(family.length<2)continue;
            let name;do{name='ref-auto-'+counter++;}while(names.has(name));names.add(name);
            const body=family[0].ref.body,group=family[0].ref.group,head='<ref name="'+name+'"'+(group?' group="'+group+'"':''),
                proposed=family.map(({ref,ordinal},index)=>({start:ref.start,end:ref.end,text:head+(index?' />':'>'+body+'</ref>'),ruleId:'identicalReferences',
                    proof:{kind:'complete-literal-anonymous-family',sourceHash:empty.sourceHash,name,group,body,ordinal,keeper:family[0].ordinal}}));
            if(JSON.stringify(v219StageSafeEdits(source,proposed,'v219-early-literal-anonymous',cfg))!==JSON.stringify(proposed))continue;
            edits.push(...proposed);selected.push({name,group,body,ordinals:family.map(item=>item.ordinal)});
        }
        if(!edits.length||JSON.stringify(v219StageSafeEdits(source,edits,'v219-early-literal-anonymous',cfg))!==JSON.stringify(edits))return empty;
        return {...empty,text:v24SyntaxApply(source,edits),edits,families:selected};
    };
    // This semantic witness reads original and target objects independently
    // of the producer. It neither generates a plan nor normalizes the target.
    const v219EarlyAnonymousWitness=(before,after,plan,cfg={})=>{
        const source=v219EarlyAnonymousRead(before,cfg),target=v219EarlyAnonymousRead(after,cfg);
        if(!source||!target||!Array.isArray(plan?.families)||!plan.families.length||!Array.isArray(plan.edits)||
            after!==v24SyntaxApply(before,plan.edits)||source.observed.refs.length!==target.observed.refs.length)return false;
        const {refs}=source.observed,actual=target.observed.refs,names=new Set(source.reservation.names),selected=new Map(),expectedEdits=[],
            hard=[...v219StageProtectedRanges(before,cfg),...source.protectedSource.ranges];
        const candidate=ref=>{
            const context=v219IndexedSyntaxContext(before,ref.start);
            return ref.body!==null&&Object.keys(ref.attrs).every(key=>key==='group')&&
                (!Object.hasOwn(ref.attrs,'group')||!!ref.attrs.group)&&context&&!context.templates.length&&!context.html.length&&
                !context.tables.length&&!context.links.length&&!context.external.length&&
                !hard.some(range=>range.start<ref.end&&ref.start<range.end);
        },region=ref=>source.collectors.filter(collector=>collector.end<=ref.start).length;
        for(const family of plan.families){
            if(!/^ref-auto-[1-9]\d*$/.test(family.name)||names.has(family.name)||!Array.isArray(family.ordinals)||family.ordinals.length<2)return false;
            names.add(family.name);
            const first=refs[family.ordinals[0]];
            if(!first||first.group!==family.group||first.body!==family.body)return false;
            const complete=refs.flatMap((ref,index)=>candidate(ref)&&ref.group===first.group&&ref.body===first.body&&region(ref)===region(first)?[index]:[]);
            if(JSON.stringify(complete)!==JSON.stringify(family.ordinals))return false;
            for(const [index,ordinal]of family.ordinals.entries()){
                if(selected.has(ordinal))return false;
                const ref=refs[ordinal],head='<ref name="'+family.name+'"'+(family.group?' group="'+family.group+'"':''),
                    raw=head+(index?' />':'>'+ref.body+'</ref>');
                if(after.slice(actual[ordinal].start,actual[ordinal].end)!==raw||actual[ordinal].group!==ref.group)return false;
                selected.set(ordinal,raw);expectedEdits.push([ref.start,ref.end,raw]);
            }
        }
        if(JSON.stringify(plan.edits.map(edit=>[edit.start,edit.end,edit.text]))!==JSON.stringify(expectedEdits))return false;
        for(const [ordinal,ref]of refs.entries())if(!selected.has(ordinal)&&
            before.slice(ref.start,ref.end)!==after.slice(actual[ordinal].start,actual[ordinal].end))return false;
        const context=read=>[read.signature.helpers,read.signature.collectors,read.signature.wrappers,read.signature.protected],
            regions=read=>read.observed.refs.map(ref=>read.collectors.filter(collector=>collector.end<=ref.start).map(collector=>collector.groups));
        const events=source.signature.events.map(event=>event[0]==='ref'&&selected.has(event[1])?['ref',event[1],selected.get(event[1])]:event);
        return JSON.stringify(events)===JSON.stringify(target.signature.events)&&
            JSON.stringify(context(source))===JSON.stringify(context(target))&&JSON.stringify(regions(source))===JSON.stringify(regions(target));
    };
    const v219EarlyAnonymousProof=(before,after,plan,cfg={})=>{
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||!plan.edits.length)return false;
        const fresh=v219EarlyAnonymousPlan(before,cfg);
        return fresh.text===after&&JSON.stringify([fresh.edits,fresh.families])===JSON.stringify([plan.edits,plan.families])&&
            v219EarlyAnonymousWitness(before,after,plan,{...DEFAULTS,...cfg});
    };

    // Rebase only an independently re-read, actually present complete
    // naming transaction. All old guards then inspect every residual change.
    const v219EarlyAnonymousBaseline=(before,after,options={})=>{
        if(typeof before!=='string'||typeof after!=='string'||before===after)return before;
        const cfg={...DEFAULTS,...options},source=v219NativeHelperCosmeticSource(before,cfg),plan=v219EarlyAnonymousPlan(source,cfg);
        if(!plan.edits.length||!v219EarlyAnonymousProof(source,plan.text,plan,cfg))return before;
        const observed=v219NativeReferenceObserver(after),names=new Set(plan.families.map(family=>family.name));
        if(!observed.refs.some(ref=>names.has(ref.attrs?.name)))return before;
        const expected=v219EarlyAnonymousRead(plan.text,cfg),actual=v219EarlyAnonymousRead(after,cfg);
        return expected&&actual&&JSON.stringify(expected.signature)===JSON.stringify(actual.signature)?plan.text:null;
    };
