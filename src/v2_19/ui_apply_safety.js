    // The production guards run inside the Worker/staged calculation. UI
    // checks compare the exact strings and sealed input snapshots only.
    function v219CompositionSafetyVerdict(source,candidate,options={},optionsSnapshot=null,contextSnapshot=null) {
        const snapshot=optionsSnapshot??JSON.stringify(options),proof={kind:'source-bound-local-composition',
            source,candidate,optionsSnapshot:snapshot,contextSnapshot,accepted:false,reason:''};
        if(typeof source!=='string'||typeof candidate!=='string')return {...proof,reason:'O texto da análise não pôde ser confirmado.'};
        if(source===candidate)return {...proof,accepted:true};
        try {
            const cfg=pageContextOptions({...DEFAULTS,...options}),noop=()=>{},
                spelling=cfg.automaticSpelling?automaticSpelling(source,cfg,noop,noop):source,
                expected=verifiedDOIExpectedSource(spelling,cfg);
            const problem=safeComposition(expected,candidate,cfg);
            if(typeof problem!=='string')return {...proof,reason:'A conferência local não retornou um resultado verificável.'};
            return {...proof,accepted:!problem,reason:problem};
        } catch(error) {
            return {...proof,reason:'A conferência local de preservação não foi concluída.'};
        }
    }
    function v219CompositionSafetyMatches(source,candidate,proof,optionsSnapshot=null,contextSnapshot=undefined) {
        return !!proof&&proof.kind==='source-bound-local-composition'&&typeof source==='string'&&typeof candidate==='string'&&
            proof.source===source&&proof.candidate===candidate&&typeof proof.optionsSnapshot==='string'&&
            typeof proof.accepted==='boolean'&&typeof proof.reason==='string'&&
            (optionsSnapshot===null||proof.optionsSnapshot===optionsSnapshot)&&
            (contextSnapshot===undefined||proof.contextSnapshot===contextSnapshot);
    }
    function v219SafetyTaskContext(task) {
        const context=task?.context;
        return context?JSON.stringify([task.id,context.title,context.namespace,context.model,context.base,context.section]):null;
    }
    function v219AutomaticResultSafety(source,result,contextSnapshot=undefined) {
        const reject=(code,reason,findings=[])=>({accepted:false,code,reason,findings});
        if(typeof source!=='string'||!result||typeof result.text!=='string')
            return reject('unverified-local-result','A análise local não retornou um texto verificável.');
        if(result.text===source)return {accepted:true,code:'unchanged',reason:'',findings:[]};
        // Preservation findings are failed retention obligations. Editorial
        // reports and pre-existing syntax warnings have separate channels.
        if(!Array.isArray(result.preservation))
            return reject('missing-preservation-check','A análise local não confirmou a preservação do texto.');
        if(result.preservation.length)return reject('preservation-rejected',
            'A conferência local não confirmou a preservação dos ajustes.',result.preservation);
        const proof=result.localCompositionSafety;
        if(!v219CompositionSafetyMatches(source,result.text,proof,null,contextSnapshot))
            return reject('unbound-composition-check','A análise local não confirmou a composição destes ajustes.');
        if(!proof.accepted)return reject('composition-rejected',proof.reason||'A composição dos ajustes não foi confirmada.');
        return {accepted:true,code:'locally-verified',reason:'',findings:[]};
    }
    function v219BindLocalResultSafety(job,result) {
        if(!['adjust','refresh','spelling','audit'].includes(job.kind))return result;
        const offer=value=>({...value,choiceOffer:{optionsSnapshot:job.localSafetyOptionsSnapshot,
            context:job.localPageContext,uiBinding:job.manualOfferUIBinding??job.manualUIBinding,taskContext:job.localSafetyContext}});
        if(job.kind==='audit')return offer(result);
        const source=job.safetySource??job.previousSource??job.source;
        if(job.explicitChoice){
            if(!v219ExplicitChoiceResultMatches(source,job.source,result,job.explicitChoice,
                job.localSafetyContext,job.localSafetyOptionsSnapshot))throw new Error('A escolha não foi confirmada. Nenhum ajuste foi aplicado.');
            return offer(result);
        }
        if(typeof result?.text!=='string'||!v219CompositionSafetyMatches(source,result.text,result.localCompositionSafety,
            job.localSafetyOptionsSnapshot??JSON.stringify(job.options||{}),job.localSafetyContext??null))
            throw new Error('A análise local não confirmou a preservação deste texto. Nenhum ajuste foi aplicado.');
        return offer(result);
    }
    async function v219AutomaticResultRollback(task,result,options,decision) {
        const fresh=await computeLocal(task,{kind:'refresh',source:task.source,
            originalSource:appliedBaseline(editor(),task.source),options});
        task.guard();
        fresh.text=task.source;fresh.changes=[];fresh.removedDescriptions=[];
        fresh.previewCheck={status:'local-rollback',checked:false,reason:decision.reason,
            localSafetyCode:decision.code,rejectedFindingCodes:(decision.findings||[]).map(item=>item?.code||'unclassified-preservation')};
        fresh.warnings=[...(fresh.warnings||[]),'O texto anterior foi mantido porque a conferência local não confirmou a preservação dos ajustes.'];
        return fresh;
    }

    // This exception belongs to one fresh, explicitly selected offer. The
    // ordinary automatic guards never receive a review-wide permission.
    const v219ExplicitChoiceRead=(request,before,after,context)=>{
        if(!request||request.before!==before||request.after!==after||request.context!==context||
            typeof before!=='string'||typeof after!=='string'||before===after||
            typeof context!=='string'||typeof request.optionsSnapshot!=='string'||
            typeof request.proposalSnapshot!=='string'||!Number.isInteger(request.index)||request.index<0||
            !['review','spelling'].includes(request.kind))return null;
        try{
            const options=JSON.parse(request.optionsSnapshot),proposal=JSON.parse(request.proposalSnapshot);
            if(!options||typeof options!=='object'||Array.isArray(options)||
                JSON.stringify(options)!==request.optionsSnapshot)return null;
            const offered=request.kind==='spelling'?spellingReview(before,options).suggestions:reviewSuggestions(before,options),
                matches=offered.filter(item=>JSON.stringify(item)===request.proposalSnapshot);
            if(matches.length!==1||!v217SourceProposal(proposal,before,request.kind)||
                request.index>=proposal.choices.length)return null;
            const fresh=matches[0],choice=fresh.choices[request.index],shield=maskProtected(before,()=>{}),
                prefix=shield.restore(shield.text.slice(0,fresh.start)),
                suffix=shield.restore(shield.text.slice(fresh.end));
            if(typeof choice.after!=='string'||shield.text.slice(fresh.start,fresh.end)!==fresh.before||
                before!==prefix+shield.restore(fresh.before)+suffix||
                after!==prefix+shield.restore(choice.after)+suffix||
                applySuggestion(before,fresh,request.index)!==after)return null;
            return {before,after,context,kind:request.kind,index:request.index,
                optionsSnapshot:request.optionsSnapshot,proposalSnapshot:request.proposalSnapshot};
        }catch(error){return null;}
    };
    const v219ManualOrdinarySegment=(before,after,options)=>{
        if(before===after)return true;
        const proof=v219CompositionSafetyVerdict(before,after,options);
        if(!proof.accepted)return false;
        const cfg=pageContextOptions({...DEFAULTS,...options}),noop=()=>{},
            spelling=cfg.automaticSpelling?automaticSpelling(before,cfg,noop,noop):before;
        return preservationAudit(verifiedDOIExpectedSource(spelling,cfg),after,cfg).length===0;
    };
    const v219ManualHistoryBaseline=(history,origin,current,options,context)=>{
        if(!history||history.origin!==origin||history.context!==context||
            !Array.isArray(history.choices)||!history.choices.length||history.choices.length>100)return null;
        let cursor=origin;
        try{
            for(const item of history.choices){
                if(!item||!v219ExplicitChoiceRead(item,item.before,item.after,context)||
                    !v219ManualOrdinarySegment(cursor,item.before,JSON.parse(item.optionsSnapshot)))return null;
                cursor=item.after;
            }
            return v219ManualOrdinarySegment(cursor,current,options)?cursor:null;
        }catch(error){return null;}
    };
    const v219ExplicitChoiceResultMatches=(before,after,result,request,context,optionsSnapshot)=>{
        const proof=result?.explicitChoice;
        return !!proof&&proof.kind==='source-bound-explicit-choice'&&proof.taskContext===context&&
            proof.optionsSnapshot===optionsSnapshot&&proof.requestSnapshot===JSON.stringify(request)&&
            proof.before===before&&proof.after===after&&result.text===after&&
            Array.isArray(result.preservation)&&result.preservation.length===0&&
            v219CompositionSafetyMatches(after,after,result.localCompositionSafety,optionsSnapshot,context)&&
            result.localCompositionSafety.accepted===true;
    };
    const v219ManualUIBinding=kind=>JSON.stringify(serializableOptions(kind==='spelling'?spellingOptions():currentOptions(false)));
