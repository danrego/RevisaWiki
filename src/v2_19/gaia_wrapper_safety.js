    // A missing imported wrapper is repaired only within its shared literal slot.
    // Native and donor fixed bibliographies are not claimed byte-equivalent.
    function v219GaiaWrapperContext(raw) {
        if(typeof raw!=='string'||raw.length>256)return null;
        const match=/^\{\{([ \t]*)([Cc]it(?:e|ar) Gaia DR3)([ \t]*)((?:\|[ \t]*(?:1[ \t]*=[ \t]*)?[1-9]\d{0,18}[ \t]*)?)\}\}$/.exec(raw);
        if(!match)return null;
        const header=match[1]+match[2]+match[3],source=/^[Cc]ite /.test(match[2]);
        return {source,header,text:source?'{{'+match[1]+'Citar Gaia DR3'+match[3]+raw.slice(2+header.length):raw,
            sourceTemplateOldid:1328407823,nativeTemplateOldid:68099941};
    }
    function v219GaiaWrapperCall(raw,cfg={},choiceTarget=null) {
        const context=v219GaiaWrapperContext(raw);
        if(!context?.source||!cfg.multilingual||!cfg.citations||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.model&&cfg.model!=='wikitext'||
            choiceTarget&&choiceTarget!=='Citar Gaia DR3')return null;
        return {profile:{target:'Citar Gaia DR3',kind:'citation',source:{language:'en',title:'Template:Cite Gaia DR3',oldid:1328407823}},
            candidate:context.text,text:context.text,blocked:false,issues:[],issueEvidence:[],proof:{
                kind:'declared-missing-Gaia-wrapper-header-repair',sourceHash:v24SyntaxHash(raw),
                sourceTemplateOldid:context.sourceTemplateOldid,nativeTemplateOldid:context.nativeTemplateOldid,
                rawArguments:raw.slice(2+context.header.length),minorSafe:false,
                method:'fixed Gaia DR3 bibliography; shared optional numeric slot1; unchanged raw argument suffix'}};
    }
    function v219GaiaWrapperMinorAllowed(before,after,options={}) {
        if(before===after||typeof before!=='string'||!before.includes('Gaia DR3'))return true;
        const cfg={...DEFAULTS,...options};
        if(!cfg.multilingual||!cfg.citations)return true;
        // A conservative veto cannot grant permission to any writer or guard.
        return !templates(protectedView(before)).nodes.some(node=>
            !!v219GaiaWrapperCall(before.slice(node.start,node.end),cfg));
    }

    // This obligation preserves supplied bytes, including unsupported arguments.
    // It grants no CS1 role, emission inference, or candidate-side rewrite.
    function v219GaiaWrapperRetention(before,after,options={}) {
        if(before===after||typeof before!=='string'||!before.includes('Gaia DR3'))return {accepted:true,reason:''};
        const cfg={...DEFAULTS,...options},calls=source=>templates(protectedView(source)).nodes
            .filter(node=>/^[ \t]*[Cc]it(?:e|ar) Gaia DR3[ \t]*$/.test(parsedTemplate(source.slice(node.start,node.end)).parts[0]))
            .sort((a,b)=>a.start-b.start).map(node=>source.slice(node.start,node.end));
        const original=calls(before),actual=typeof after==='string'?calls(after):[];
        if(!original.length)return {accepted:true,reason:''};
        if(original.length===actual.length&&original.every((raw,index)=>{
            if(raw===actual[index])return true;
            const repair=v219GaiaWrapperCall(raw,cfg);
            return !!repair&&repair.text===actual[index];
        }))return {accepted:true,reason:''};
        return {accepted:false,reason:'Uma chamada Gaia DR3 perdeu ou alterou argumentos fornecidos ou sua ordem.'};
    }

    // An opaque named self keeps its owner protected. Only this separately
    // proved outside definition may take the existing Gaia header repair.
    function v219GaiaPeerDefinitionEdits(source,options={}) {
        const cfg={...DEFAULTS,...options};
        if(typeof source!=='string'||source.length>4194304||!source.includes('Gaia DR3')||
            !cfg.multilingual||!cfg.citations||!cfg.references||!v24SyntaxScope(cfg)||
            cfg.pageRedirect||cfg.pageDisambiguation||cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||
            v20DefinitionContext(cfg)||!v20AutomationAllowed(source,cfg)||
            v219ReferenceIdentityQuarantine(source,cfg).opaque||!v219SyntaxContextIndex(source))return [];
        const parsed=v24SyntaxReferences(source);
        if(parsed.unclosed.length||parsed.empties.length||parsed.shield.unclosed.length)return [];
        const ordinary=[...parsed.shield.ranges,...v219StageProtectedRanges(source,cfg,true).filter(range=>range.kind!=='reference-definition-peer')],
            peers=v219ReferenceDefinitionPeerRanges(source,ordinary,cfg),edits=[],
            literal=ref=>(ref.valid||ref.body===null)&&ref.attrs&&Object.keys(ref.attrs).every(key=>['name','group'].includes(key))&&
                !!ref.attrs.name&&v29ReferenceName(ref.attrs.name)&&(!ref.group||v29ReferenceName(ref.group))&&
                /^<ref(?:[ \t]+(?:name|group)=(?:"[A-Za-z0-9_.:-]+"|'[A-Za-z0-9_.:-]+'|[A-Za-z0-9_.:-]+)){1,2}[ \t]*(?:\/>|>)$/.test(ref.raw),
            same=(ref,other)=>ref.attrs.name===other.attrs?.name&&ref.group===other.group;
        for(const ref of parsed.refs){
            if(ref.body===null||!literal(ref)||!ref.close||ref.close.raw!=='</ref>')continue;
            const repair=v219GaiaWrapperCall(ref.body,cfg);
            if(!repair||ordinary.some(range=>range.start<ref.end&&ref.start<range.end))continue;
            const family=parsed.refs.filter(other=>same(ref,other));
            if(family.some(other=>!literal(other))||family.filter(other=>other.body!==null).length!==1||
                !family.some(other=>other.body===null)||
                !peers.some(range=>range.start===ref.start&&range.end===ref.end&&range.protectedNamedCall&&range.definitions===1))continue;
            const context=v219IndexedSyntaxContext(source,ref.start);
            if(!context||context.templates.length||context.tables.length||context.links.length||context.external.length)continue;
            if(context.html.length){
                if(context.html.length!==1||context.html[0].name!=='references'||!ref.container?.valid||
                    context.html[0].start!==ref.container.start||
                    !/^<references(?: group="[A-Za-z0-9_.:-]+")?>$/.test(context.html[0].raw)||
                    Object.keys(ref.container.attrs).some(key=>key!=='group')||
                    ref.group!==(ref.container.attrs.group||''))continue;
                const outer=v219IndexedSyntaxContext(source,ref.container.start);
                if(!outer||Object.values(outer).some(stack=>stack.length))continue;
            }else if(ref.container)continue;
            const start=ref.close.start-ref.body.length,headerEnd=2+v219GaiaWrapperContext(ref.body).header.length;
            if(source.slice(start,ref.close.start)!==ref.body)continue;
            edits.push({start,end:start+headerEnd,text:repair.text.slice(0,repair.text.length-(ref.body.length-headerEnd)),
                ruleId:'translatedTemplates',proof:{kind:'existing-Gaia-header-in-outside-named-definition',sourceHash:v24SyntaxHash(source),
                    nativeOldid:68099941,sourceOldid:1328407823,name:ref.attrs.name,group:ref.group,
                    definitionStart:ref.start,definitionEnd:ref.end,rawDefinition:source.slice(ref.start,ref.end),
                    body:ref.body,rawArguments:repair.proof.rawArguments,
                    family:family.map(member=>({start:member.start,end:member.end,raw:source.slice(member.start,member.end)})),
                    context,collectorOpening:ref.container?source.slice(ref.container.start,ref.container.end):null}});
        }
        return edits;
    }
    function v219GaiaPeerDefinitionPlan(source,options={}) {
        const cfg={...DEFAULTS,...options},empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]},
            edits=v219StageSafeEdits(source,v219GaiaPeerDefinitionEdits(source,cfg),'v219-gaia-peer-definition',cfg);
        return {...empty,edits,text:edits.length?v24SyntaxApply(source,edits):source};
    }
    function v219GaiaPeerDefinitionProof(before,after,plan,options={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||
            plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219GaiaPeerDefinitionPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    // Each independently certified family may remain original or take only
    // its exact Source header repair. No candidate is passed to a writer.
    function v219GaiaPeerDefinitionBaseline(before,after,plan,options={}) {
        if(!v219GaiaPeerDefinitionProof(before,plan?.text,plan,options)||typeof after!=='string')return null;
        const read=(text,group,name)=>{
            if(!v219SyntaxContextIndex(text))return null;
            const parsed=v24SyntaxReferences(text),nodes=templates(protectedView(text)).nodes;
            if(parsed.unclosed.length||parsed.empties.length||parsed.shield.unclosed.length)return null;
            const family=parsed.refs.filter(ref=>ref.group===group&&ref.attrs?.name===name).map(ref=>{
                const context=v219IndexedSyntaxContext(text,ref.start);if(!context)return null;
                const owners=context.templates.map(frame=>{
                    const node=nodes.find(item=>item.start===frame.start);
                    return node?text.slice(node.start,node.end):null;
                });
                if(owners.some(owner=>owner===null))return null;
                return {raw:text.slice(ref.start,ref.end),owners,html:context.html.map(tag=>tag.raw),
                    tableDepth:context.tables.length,linkDepth:context.links.length,externalDepth:context.external.length};
            });
            return family.includes(null)?null:family;
        },selected=[];
        for(const edit of plan.edits){
            const {group,name}=edit.proof,original=read(before,group,name),actual=read(after,group,name);
            if(original===null||actual===null)return null;
            if(JSON.stringify(original)===JSON.stringify(actual))continue;
            const repaired=read(plan.text,group,name);
            if(repaired===null||JSON.stringify(repaired)!==JSON.stringify(actual))return null;
            selected.push(edit);
        }
        return selected.length?v24SyntaxApply(before,selected):before;
    }
    function v219GaiaPeerDefinitionRetained(before,after,plan,options={}) {
        return v219GaiaPeerDefinitionBaseline(before,after,plan,options)!==null;
    }
