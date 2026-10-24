    // Every new family is rederived from the exact draft before inherited guards
    // inspect the remaining changes. No diagnostic class is globally ignored.
    function v221ConfirmedExternalPlan(source,cfg={}) {
        const base={source,sourceHash:v24SyntaxHash(source),text:source,edits:[]};
        if(!v220StructureScope(source,cfg))return base;
        const candidates=cfg.v221StructureRepairs===false?[]:v221StructureExternal(source,cfg);
        if(cfg.registryDoiCheck!==false&&cfg.citations!==false&&cfg.citationRepairs!==false&&Array.isArray(cfg.v221DOITitleProofs)){
            for(const request of v221CitationTitleRequests(source,cfg)){
                const proof=cfg.v221DOITitleProofs.find(item=>v221CitationTitleProof(source,request,item));
                if(proof)candidates.push({start:request.start,end:request.end,text:request.after,ruleId:'v221CitationDOITitle',
                    proof:{sourceHash:base.sourceHash,request,metadataSha:proof.metadataSha}});
            }
        }
        const edits=candidates.filter(edit=>!candidates.some(other=>other!==edit&&edit.start<other.end&&other.start<edit.end))
            .sort((a,b)=>a.start-b.start||a.end-b.end);
        return {...base,text:v24SyntaxApply(source,edits),edits};
    }
    function v221ConfirmedExternalProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v221ConfirmedExternalPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v221RepairPlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options});
        cfg.biographyOriginalSource=options.biographyOriginalSource??source;
        cfg.citationOriginalSource=options.citationOriginalSource??source;
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,steps:[],edits:[]};
        const families=[['confirmed-external',v221ConfirmedExternalPlan,v221ConfirmedExternalProof],
            ['composition-prerequisites',v221IntegrationPrerequisitePlan,v221IntegrationPrerequisiteProof],
            ['default-collector-prerequisite',v221MissingDefaultCollectorPlan,v221MissingDefaultCollectorProof],
            ['citation-header-prerequisite',v221CitationHeaderPlan,v221CitationHeaderProof],
            ['edition-alias-prerequisite',v221CitationEditionAliasPlan,v221CitationEditionAliasProof],
            ['citations',v221CitationPlan,v221CitationPlanProof],
            ['structure',v221StructurePlan,v221StructureProof],
            ['biography',v221BiographyPlan,v221BiographyProof],
            ['inline-infobox-layout',v221InlineInfoboxPlan,v221InlineInfoboxProof]];
        for(let round=0;round<2;round++){
            const start=plan.text;
            for(const [family,make,prove]of families){
                const before=plan.text,part=make(before,cfg);
                if(!part||typeof part.text!=='string')throw new Error('O plano não corresponde ao código recebido.');
                if(part.text===before)continue;
                if(!prove(before,part.text,part,cfg))throw new Error('O plano não preservou seus limites. O rascunho foi mantido.');
                const edits=part.edits||(part.steps||part.stages||[]).flatMap(row=>row.edits||[]);
                plan.steps.push({family,round,before,after:part.text,plan:part});
                plan.edits.push(...edits);plan.text=part.text;
            }
            if(start===plan.text)break;
        }
        return plan;
    }
    function v221RepairProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v221RepairPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);
    }
    function preservationAudit(before,after,options={}) {
        if(before===after)return v221BaselinePreservationAudit(before,after,options);
        return v221BaselinePreservationAudit(v221RepairPlan(before,options).text,after,options);
    }
    function safeComposition(before,after,options={}) {
        if(before===after)return v221BaselineSafeComposition(before,after,options);
        return v221BaselineSafeComposition(v221RepairPlan(before,options).text,after,options);
    }
    function referenceAudit(source,options={}) {
        return v221FilterCitationWarnings(source,v221BaselineReferenceAudit(source,options),options);
    }
    function reviewSuggestions(source,cfg) {
        return v221FilterCitationSuggestions(source,v221BaselineReviewSuggestions(source,cfg),cfg).filter(row=>
            !(row.reviewGroup?.kind==='unsupported-template-parameter'&&typeof row.before==='string'&&
                Number.isSafeInteger(row.start)&&Number.isSafeInteger(row.end)&&source.slice(row.start,row.end)===row.before&&
                v221InfoboxKnownField(v220CitationTitle(row.before),row.reviewGroup.parameter)));
    }
    function migrateForeignTemplate(raw,cfg,choiceTarget) {
        const result=v221BaselineMigrateForeignTemplate(raw,cfg,choiceTarget);
        if(result&&!v221CitationMigrationSafe(raw,result.text,cfg))return {...result,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true};
        return result;
    }
    function* cleanupStages(source,options,applyNewRepairs=true) {
        const cfg=pageContextOptions({...DEFAULTS,...(options||{})});
        cfg.biographyOriginalSource=source;
        cfg.citationOriginalSource=source;
        if(!applyNewRepairs)return yield* v221BaselineCleanupStages(source,cfg,false);
        yield 'Conferindo os campos e a sintaxe...';
        const first=v221RepairPlan(source,cfg);
        const result=yield* v221BaselineCleanupStages(first.text,cfg,true);
        yield 'Conferindo o código resultante...';
        const last=v221RepairPlan(result.text,cfg),counts=new Map((result.changes||[]).map(row=>[row.id,{...row}]));
        for(const edit of [...first.edits,...last.edits])for(const id of edit.ruleIds||[edit.ruleId||'v221Repair']){
            const amount=Number.isSafeInteger(edit.count)&&edit.count>0?edit.count:1,old=counts.get(id);
            if(old)old.count+=amount;
            else counts.set(id,{id,label:edit.label||'Campos e sintaxe conferidos',count:amount});
        }
        const trace=cfg.captureTrace?[...(first.text!==source?[{label:'Ajustes iniciais',before:source,after:first.text}]:[]),
            ...(result.trace||[]),...(last.text!==result.text?[{label:'Ajustes finais',before:result.text,after:last.text}]:[])]:result.trace;
        return {...result,text:last.text,changes:[...counts.values()],trace,
            warnings:v221FilterCitationWarnings(last.text,result.warnings||[],cfg),
            suggestions:v221FilterCitationSuggestions(last.text,result.suggestions||[],cfg),
            v221Repairs:{sourceHash:v24SyntaxHash(source),initialHash:v24SyntaxHash(first.text),finalHash:v24SyntaxHash(last.text),
                initialSteps:first.steps.map(row=>row.family),finalSteps:last.steps.map(row=>row.family)}};
    }
