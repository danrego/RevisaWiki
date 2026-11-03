    function v219BindLocalResultSafety(job,result) {
        if(!['adjust','refresh','spelling','audit'].includes(job.kind))return result;
        const offer=value=>({...value,choiceOffer:{optionsSnapshot:job.localSafetyOptionsSnapshot,
            context:job.localPageContext,uiBinding:job.manualOfferUIBinding??job.manualUIBinding,taskContext:job.localSafetyContext}});
        if(job.kind==='audit')return offer(result);
        const source=job.safetySource??job.previousSource??job.source;
        if(job.kind==='adjust'&&v2214ReferenceActivationAudit(source,result?.text,job.options||{}).length)throw new Error('A análise local não confirmou a preservação deste texto. Nenhum ajuste foi aplicado.');
        if(job.kind==='adjust'&&v2215NativeCitationReadAudit(source,result?.text,job.options||{}).length)throw new Error('A análise local não confirmou a preservação deste texto. Nenhum ajuste foi aplicado.');
        if(job.kind==='adjust'&&v2215NamedDefinitionConsistencyAudit(source,result?.text,job.options||{}).length)throw new Error('A análise local não confirmou a preservação deste texto. Nenhum ajuste foi aplicado.');
        if(job.explicitChoice){
            if(!v219ExplicitChoiceResultMatches(source,job.source,result,job.explicitChoice,
                job.localSafetyContext,job.localSafetyOptionsSnapshot))throw new Error('A escolha não foi confirmada. Nenhum ajuste foi aplicado.');
            return offer(result);
        }
        let snapshot=job.localSafetyOptionsSnapshot??JSON.stringify(job.options||{});
        if(result?.automaticRecovery){
            if(job.kind!=='adjust'||source!==job.source||!v2214RecoveryJobAllowed(job))throw new Error('A recuperação não pertence a este rascunho.');
            const cfg=v2214EffectiveResultOptions(source,result,job.options||{},job.localSafetyContext??null);
            if(!cfg||!v219AutomaticResultSafety(source,result,job.localSafetyContext??null).accepted)
                throw new Error('A recuperação não confirmou a preservação deste texto.');
            snapshot=JSON.stringify(cfg);
        }
        if(typeof result?.text!=='string'||!v219CompositionSafetyMatches(source,result.text,result.localCompositionSafety,
            snapshot,job.localSafetyContext??null))throw new Error('A análise local não confirmou a preservação deste texto. Nenhum ajuste foi aplicado.');
        return offer(result);
    }

