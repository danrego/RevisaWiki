    // Recompute only the unchanged original draft. Rejected output is never
    // an input, and every accepted subset keeps the normal preservation guards.
    const V2214_RECOVERY_GROUPS=Object.freeze([
        ['syntax',['syntaxRepairs','partialSyntaxRecovery','structuralRepairs','automaticLegacyMarkup','templateDefinitionRepairs','templateReadableFormatting','markup']],
        ['prose',['links','headings','shortDescriptions','automaticProseGaps','automaticSpelling','translationResidues','shortcuts','maintenance']],
        ['citations',['citations','citationRepairs','automaticCitationKeyRepairs','automaticCitationDateValues','automaticCitationIslands','automaticSourceCompatibility','historicalCitationRepairs','identifierUrlRepairs','authors','singleLineCitations','dates','birthDates','registryDoiCheck','auxiliaryTemplates','obsoleteTemplates','automaticParameterNames','automaticParameterDuplicates','automaticEmptyParameters']],
        ['references',['references','automaticReferenceRepairs','referenceGraphRepairs','harvardAnchorRepairs','automaticIdenticalReferences','numericRefNames','neutralReferenceNames','moveNamedRefs','bareReferences','referenceColumns','automaticReferenceCollectorHeadings','unifiedNotesReferences']],
        ['tables',['automaticTableRepairs','tableAccessibility','tableSyntaxRepairs','responsiveTableWrappers','independentRepairGroups','tableChecks']],
        ['biography',['infoboxes','automaticBiographyFields','automaticInfoboxValues','automaticInfoboxOrder','automaticFieldSyntax','automaticInfoboxImages','automaticBiographyLead','occupationCase','livingBirthAge','redundantBirthCategories']],
        ['footer',['portals','biographyPortal','automaticBiographyPortals','automaticTopicPortals','authorityControl','endMatter','endTemplateOrder','endSectionOrder','externalLinkColumns','endMatterColumns','categories']]
    ]);
    function v2214RecoveryOptions(requested,enabled) {
        if(!requested||typeof requested!=='object'||Array.isArray(requested)||!Array.isArray(enabled))return null;
        const names=V2214_RECOVERY_GROUPS.map(row=>row[0]);
        if(new Set(enabled).size!==enabled.length||enabled.some(name=>!names.includes(name))||
            JSON.stringify(enabled)!==JSON.stringify(names.filter(name=>enabled.includes(name))))return null;
        const cfg=JSON.parse(JSON.stringify(requested));
        for(const [name,keys]of V2214_RECOVERY_GROUPS)if(!enabled.includes(name))for(const key of keys){
            const value=Object.hasOwn(cfg,key)?cfg[key]:DEFAULTS[key];
            if(value===true)cfg[key]=false;
        }
        return cfg;
    }
    function v2214RecoveryCertificate(source,requested,effective,enabled,context) {
        const expected=v2214RecoveryOptions(requested,enabled);
        if(!expected||JSON.stringify(expected)!==JSON.stringify(effective))return null;
        return {kind:'restricted-original-draft-recovery',sourceHash:v24SyntaxHash(source),
            requestedOptionsSnapshot:JSON.stringify(requested),effectiveOptionsSnapshot:JSON.stringify(effective),
            enabledGroups:enabled.slice(),contextSnapshot:context??null};
    }
    function v2214EffectiveResultOptions(source,result,requested=null,context=undefined) {
        if(typeof source!=='string'||!result||typeof result.text!=='string')return null;
        const proof=result.localCompositionSafety,certificate=result.automaticRecovery;
        if(!certificate){
            if(!proof||!v219CompositionSafetyMatches(source,result.text,proof,null,context))return null;
            try{const cfg=JSON.parse(proof.optionsSnapshot);return requested!==null&&JSON.stringify(requested)!==proof.optionsSnapshot?null:cfg;}catch{return null;}
        }
        if(certificate.kind!=='restricted-original-draft-recovery'||certificate.sourceHash!==v24SyntaxHash(source)||
            context!==undefined&&certificate.contextSnapshot!==context)return null;
        try{
            const base=JSON.parse(certificate.requestedOptionsSnapshot),cfg=v2214RecoveryOptions(base,certificate.enabledGroups);
            if(!cfg||JSON.stringify(base)!==certificate.requestedOptionsSnapshot||
                requested!==null&&JSON.stringify(requested)!==certificate.requestedOptionsSnapshot||
                JSON.stringify(cfg)!==certificate.effectiveOptionsSnapshot||
                !v219CompositionSafetyMatches(source,result.text,proof,certificate.effectiveOptionsSnapshot,certificate.contextSnapshot))return null;
            return cfg;
        }catch{return null;}
    }
    function v2214DeadlineError() {
        const error=new Error('A análise demorou demais. O rascunho foi preservado.');error.noFallback=true;return error;
    }
    function v2214Remaining(task) {
        if(!Number.isFinite(task.v2214Deadline))task.v2214Deadline=root.performance.now()+60000;
        const remaining=task.v2214Deadline-root.performance.now();if(remaining<=0)throw v2214DeadlineError();return Math.max(1,Math.floor(remaining));
    }
    function v2214RecoveryJobAllowed(job) {
        return job.kind==='adjust'&&typeof job.source==='string'&&job.source.length<=4194304&&
            !job.explicitChoice&&!job.semanticHistory&&
            [job.originalSource,job.safetySource,job.previousSource].every(value=>value===undefined||value===job.source)&&
            (job.localSafetyOptionsSnapshot===undefined||job.localSafetyOptionsSnapshot===JSON.stringify(job.options||{}))&&
            (job.options?.v2212OriginalDraftHash===undefined||job.options.v2212OriginalDraftHash===v24SyntaxHash(job.source));
    }
    function v2214PreservedResult(job) {
        const cfg=job.options||{},snapshot=JSON.stringify(cfg),context=job.localSafetyContext??null;
        return {text:job.source,changes:[],warnings:[],removedDescriptions:[],audit:[],trace:[],notApplied:[],suggestions:[],
            preservation:[],localCompositionSafety:v219CompositionSafetyVerdict(job.source,job.source,cfg,snapshot,context),
            localReports:{references:[],syntax:[],translation:[],tables:[],biographies:[],dates:[]},hunks:[],
            comparisonBefore:job.originalSource??job.source,v2214Outcome:'preserved'};
    }
    function* v2214RecoverLocalAdjustment(job) {
        const allowed=v2214RecoveryJobAllowed(job),requested=job.options||{},context=job.localSafetyContext??null,
            deadline=Number.isFinite(job.v2214DeadlineEpochMs)?Math.min(job.v2214DeadlineEpochMs,Date.now()+60000):Date.now()+60000;
        let initial=null,initialError=null;
        try{initial=yield* calculationSteps({...job,v2214Trial:true});}catch(error){initialError=error;if(!allowed||error?.noFallback)throw error;}
        if(!allowed)return initial;
        if(initial&&v219AutomaticResultSafety(job.source,initial,context).accepted)return initial;
        let best=null,enabled=[];const attempts=[];
        for(const [name]of V2214_RECOVERY_GROUPS){
            if(Date.now()>=deadline){if(best)break;throw v2214DeadlineError();}
            const selected=V2214_RECOVERY_GROUPS.map(row=>row[0]).filter(value=>enabled.includes(value)||value===name),cfg=v2214RecoveryOptions(requested,selected);
            if(!cfg)continue;
            try{
                const candidate=yield* calculationSteps({...job,options:cfg,v2214Trial:true,
                    localSafetyOptionsSnapshot:JSON.stringify(cfg),v2214DeadlineEpochMs:deadline}),
                    verdict=v219AutomaticResultSafety(job.source,candidate,context);
                attempts.push({group:name,accepted:verdict.accepted,changed:candidate.text!==job.source});
                if(!verdict.accepted)continue;
                const certificate=v2214RecoveryCertificate(job.source,requested,cfg,selected,context);
                if(!certificate)continue;
                best={...candidate,automaticRecovery:certificate};enabled=selected;
            }catch(error){if(error?.noFallback){if(best)break;throw error;}attempts.push({group:name,accepted:false,exception:true});}
        }
        const result=best||v2214PreservedResult(job);
        result.v2214RecoveryTrace={initialFailure:initialError?'exception':'preservation-or-composition',attempts};
        return result;
    }

    function* calculationSteps(job){if(job.kind==='adjust'&&!job.v2214Trial)return yield* v2214RecoverLocalAdjustment(job);if(job.kind==='adjust'&&job.options?.v2212OriginalDraftHash!==undefined&&job.options.v2212OriginalDraftHash!==v24SyntaxHash(job.source))throw new Error('A confirmação não pertence a este rascunho. Nenhum ajuste foi aplicado.');const cfg=job.options||{},v219SafetySource=job.safetySource??job.previousSource??job.source,v219SafetyOptionsSnapshot=job.localSafetyOptionsSnapshot??JSON.stringify(cfg),v219SafetyContext=job.localSafetyContext??null;if(v219SafetyOptionsSnapshot!==JSON.stringify(cfg))throw new Error('As opções da análise mudaram. Nenhum ajuste foi aplicado.');const v219SafetyOptions=JSON.parse(v219SafetyOptionsSnapshot);let v219InputSafety=null;if(job.kind==='presentation'){yield'Contando os ajustes mantidos...';return v219UIPresentationMetadata(job);}yield'Lendo o código-fonte...';if(job.kind==='comparison')return{kind:'comparison',text:job.source,hunks:yield*comparisonStages(job.originalSource,{text:job.source},cfg)};if(job.kind==='styles')return{kind:'styles',text:job.source,...templateStylesAudit(job.source)};if(job.kind==='audit')return v219UIBindReviewReports({kind:'audit',text:job.source,changes:[],warnings:[],suggestions:cfg.tableChecks===false||discussionProtectionRanges(job.source,pageContextOptions(cfg)).length?[]:tableSuggestions(job.source),localReports:{references:referenceAudit(job.source,cfg),syntax:syntaxAudit(job.source),translation:cfg.multilingual?translationAudit(job.source):[],tables:cfg.tableChecks===false?[]:tableAnalysis(job.source).findings,biographies:biographyStyleAudit(job.source,cfg),dates:cfg.dateChecks===false?[]:dateAudit(job.source)}},cfg);let v219History=job.semanticHistory||null,v219Manual=null,v219AuditBefore=job.originalSource??job.source;const v219PageContext=job.localPageContext??null;if(v219History){const baseline=v219ManualHistoryBaseline(v219History,job.originalSource,v219SafetySource,cfg,v219PageContext);if(baseline===null)throw new Error('O histórico das escolhas não corresponde a este rascunho. Nenhum ajuste foi aplicado.');v219AuditBefore=baseline;}if(job.explicitChoice){if(!['refresh','spelling'].includes(job.kind)||job.safetySource===undefined||
job.explicitChoice.taskContext!==v219SafetyContext||
(job.kind==='spelling')!==(job.explicitChoice.kind==='spelling'))throw new Error('A escolha não pertence a esta análise.');const selected=v219ExplicitChoiceRead(job.explicitChoice,v219SafetySource,job.source,v219PageContext);if(!selected)throw new Error('A sugestão ficou desatualizada. Faça a análise novamente.');v219History={origin:job.originalSource??v219SafetySource,context:v219PageContext,choices:[...(v219History?.choices||[]),selected]};if(v219ManualHistoryBaseline(v219History,v219History.origin,job.source,cfg,v219PageContext)!==job.source)
throw new Error('A escolha não preservou o restante do rascunho.');v219AuditBefore=job.source;v219Manual={kind:'source-bound-explicit-choice',before:v219SafetySource,after:job.source,requestSnapshot:JSON.stringify(job.explicitChoice),taskContext:v219SafetyContext,optionsSnapshot:v219SafetyOptionsSnapshot};}if(job.safetySource!==undefined){v219InputSafety=v219CompositionSafetyVerdict(v219Manual?job.source:v219SafetySource,job.source,v219SafetyOptions,v219SafetyOptionsSnapshot,v219SafetyContext);if(!v219InputSafety.accepted)throw new Error('A conferência local não confirmou a preservação da escolha. Nenhum ajuste foi aplicado.');}let result;if(job.kind==='spelling'){yield'Conferindo a lista de ortografia...';result=spellingReview(job.source,cfg);if(job.previousSource!==undefined)result.preservation=preservationAudit(v219Manual?job.source:job.previousSource,job.source,cfg).filter(f=>f.code!=='lost-prose');else result.preservation=[];if(v219History)result.semanticHistory=v219History;if(v219Manual)result.explicitChoice=v219Manual;result.localCompositionSafety=v219InputSafety&&result.text===job.source?v219InputSafety:
v219CompositionSafetyVerdict(v219SafetySource,result.text,v219SafetyOptions,v219SafetyOptionsSnapshot,v219SafetyContext);if(job.originalSource!==undefined&&job.previousSource!==undefined){result.comparisonBefore=job.originalSource;result.appliedHunks=yield*comparisonStages(job.originalSource,{text:job.source},cfg);}return result;}result=yield*cleanupStages(job.source,['refresh','adjust'].includes(job.kind)?{...cfg,review:false}:cfg,job.kind!=='refresh');if(job.kind==='refresh')result={...result,text:job.source,changes:[],removedDescriptions:[],suggestions:reviewSuggestions(job.source,cfg)};yield'Conferindo a preservação do conteúdo...';const preservationBefore=v219AuditBefore;if(v219History)result.semanticHistory=v219History;if(v219Manual)result.explicitChoice=v219Manual;const expectedSpelling=result.changes?.some(c=>c.id==='automaticSpelling')?
automaticSpelling(preservationBefore,pageContextOptions({...DEFAULTS,...cfg}),()=>{},()=>{}):preservationBefore;result.preservation=preservationAudit(verifiedDOIExpectedSource(expectedSpelling,cfg),result.text,cfg);yield'Conferindo a composição dos ajustes...';result.localCompositionSafety=v219InputSafety&&result.text===job.source?v219InputSafety:
v219CompositionSafetyVerdict(v219SafetySource,result.text,v219SafetyOptions,v219SafetyOptionsSnapshot,v219SafetyContext);yield job.kind==='adjust'?'Conferindo os ajustes...':'Preparando os avisos...';result.localReports=job.kind==='adjust'?{references:[],syntax:[],translation:[],tables:[],biographies:[],dates:[]}:{references:referenceAudit(result.text,cfg),syntax:syntaxAudit(result.text),translation:cfg.multilingual?translationAudit(result.text):[],tables:cfg.tableChecks===false?[]:tableAnalysis(result.text).findings,biographies:biographyStyleAudit(result.text,cfg),dates:cfg.dateChecks===false?[]:dateAudit(result.text)};if(job.kind==='adjust')result.suggestions=[];result=v219UIBindReviewReports(result,cfg);if(job.kind==='adjust'){yield'Preparando a comparação dos ajustes...';result.comparisonBefore=job.originalSource??job.source;result.hunks=yield*comparisonStages(result.comparisonBefore,result,cfg);}if(job.kind==='refresh'&&job.originalSource!==undefined){result.comparisonBefore=job.originalSource;result.appliedHunks=yield*comparisonStages(job.originalSource,{text:result.text},cfg);}const byteBefore=job.originalSource??job.source;const byteHunks=result.hunks||result.appliedHunks||diffHunks(byteBefore,result.text);result.byteMetrics=byteMetrics(byteBefore,result.text,byteHunks);result.minorCheck=minorEligibility(byteBefore,result.text,{...cfg,hunks:byteHunks,metrics:result.byteMetrics});return result;}
    function v219BindLocalResultSafety(job,result) {
        if(!['adjust','refresh','spelling','audit'].includes(job.kind))return result;
        const offer=value=>({...value,choiceOffer:{optionsSnapshot:job.localSafetyOptionsSnapshot,
            context:job.localPageContext,uiBinding:job.manualOfferUIBinding??job.manualUIBinding,taskContext:job.localSafetyContext}});
        if(job.kind==='audit')return offer(result);
        const source=job.safetySource??job.previousSource??job.source;
        if(job.kind==='adjust'&&v2214ReferenceActivationAudit(source,result?.text,job.options||{}).length)throw new Error('A análise local não confirmou a preservação deste texto. Nenhum ajuste foi aplicado.');
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

    async function computeLocal(task,job){v2214Remaining(task);if(job.v2214PreserveRuntimeOptions){let base;try{base=JSON.parse(task.v2214RequestedOptionsSnapshot);}catch{throw new Error('As opções originais não foram confirmadas.');}const expected=v2214RecoveryOptions(base,job.v2214EnabledGroups);if(job.kind!=='adjust'||job.source!==task.source||!expected||JSON.stringify(expected)!==JSON.stringify(job.options))throw new Error('As opções da recuperação não pertencem a esta análise.');}const started=root.performance.now();const progress=text=>{if(localTask===task&& !task.cancelled)message(text);};await pauseLocal();task.guard();if(['adjust','refresh','spelling'].includes(job.kind)&&job.originalSource===undefined&&
lastEditorContextMatches(editor())&&last.after===task.source&&last.semanticHistory)
job={...job,originalSource:last.before};job={...job,options:serializableOptions(job.v2214PreserveRuntimeOptions?job.options:birthCategoryRuntimeOptions(confirmedMinorOptions(task,job)))};if(job.kind==='adjust'&&task.v2214RequestedOptionsSnapshot===undefined)task.v2214RequestedOptionsSnapshot=JSON.stringify(job.options);job={...job,v2214DeadlineEpochMs:Date.now()+v2214Remaining(task)};if(job.explicitChoice&&(task.explicitChoice!==job.explicitChoice||
job.explicitChoice.uiBinding!==v219ManualUIBinding(job.explicitChoice.kind)))throw new Error('As opções da sugestão mudaram. Faça a análise novamente.');job={...job,localSafetyOptionsSnapshot:JSON.stringify(job.options),localSafetyContext:v219SafetyTaskContext(task),localPageContext:v219UIContextKey(task.context),manualUIBinding:v219ManualUIBinding(job.kind==='spelling'?'spelling':'review'),semanticHistory:['adjust','refresh','spelling'].includes(job.kind)&&lastEditorContextMatches(editor())&&
last.after===task.source?last.semanticHistory||null:null};if(job.explicitChoice)task.manualApplyOptionsSnapshot=job.localSafetyOptionsSnapshot;if(job.explicitChoice?.kind==='spelling'){const nextUI=JSON.parse(job.manualUIBinding);if(!Object.hasOwn(nextUI,'spellingIgnored')||!Array.isArray(job.options.spellingIgnored))
throw new Error('As ocorrências ignoradas não correspondem à escolha.');nextUI.spellingIgnored=job.options.spellingIgnored;job.manualOfferUIBinding=JSON.stringify(nextUI);}try{const state=createWorker();const result=await new Promise((resolve,reject)=>{const timer=root.setTimeout(()=>{const error=new Error(job.kind==='presentation'?'A contagem não terminou. Os ajustes do rascunho foram preservados.':'A análise demorou demais. Nenhum ajuste foi aplicado. Tente novamente ou revise uma seção.');error.noFallback=true;dropWorker(error);},v2214Remaining(task));state.pending={id:task.id,resolve,reject,timer,progress};try{state.worker.postMessage({type:'calculate',id:task.id,job});}catch(error){root.clearTimeout(timer);state.pending=null;reject(error);}});task.guard();v2214Remaining(task);api.processing.engine='worker';api.processing.milliseconds=root.performance.now()-started;return v219BindLocalResultSafety(job,result);}catch(error){task.guard();if(error.noFallback)throw error;if(!workerUnavailable&&workerState)throw error;workerUnavailable=true;api.processing.workerFailure=error.message;progress('Preparando os ajustes em etapas...');const steps=calculationSteps(job);let next;do{await pauseLocal();task.guard();v2214Remaining(task);next=steps.next();if(!next.done)progress(next.value);}while(!next.done);task.guard();v2214Remaining(task);api.processing.engine='staged';api.processing.milliseconds=root.performance.now()-started;return v219BindLocalResultSafety(job,next.value);}}
    async function verifyAutomaticResult(task,result,options) {
        const context=v219SafetyTaskContext(task),localSafety=v219AutomaticResultSafety(task.source,result,context);
        if(!localSafety.accepted)return v219AutomaticResultRollback(task,result,options,localSafety);
        let requested;
        try{requested=JSON.parse(task.v2214RequestedOptionsSnapshot??JSON.stringify(options));}catch{throw new Error('As opções da análise não foram confirmadas.');}
        const effective=v2214EffectiveResultOptions(task.source,result,requested,context);
        if(!effective)throw new Error('A análise não corresponde às opções deste rascunho.');
        options=effective;
        if(options.autoPreview===false||result.text===task.source||discussionProtectionRanges(task.source,options).length)return result;
        let previewTimer=null,nativeRejected=false,best=null,before=null;
        const preserved=()=>v2214PreservedResult({kind:'adjust',source:task.source,options:requested,localSafetyContext:context});
        const inspect=async(candidate,cfg)=>{
            if(candidate===task.source)return {accepted:true,checked:true,status:'unchanged'};
            task.guard();v2214Remaining(task);
            const parsed=await taskParse(task,candidate),proof=syntaxRepairSourceProof(task.source,candidate,cfg);
            let baseline=null;
            if(proof.applied&&proof.accepted)baseline={...await taskParse(task,proof.baseline),source:proof.baseline};
            task.guard();v2214Remaining(task);
            return syntaxPreviewDecision(before,baseline,parsed,root.DOMParser,task.source,candidate,cfg);
        };
        try{
            task.previewDeadlinePromise=new Promise((resolve,reject)=>{previewTimer=root.setTimeout(()=>{
                task.previewTimedOut=true;for(const pending of task.previewSession?.requests||[])pending.abort?.();
                reject(new Error('Tempo de consulta online encerrado.'));
            },Math.min(12000,v2214Remaining(task)));});
            message('Conferindo os ajustes na pré-visualização, sem salvar...');
            before=task.previewBaseline||await taskParse(task,task.source);task.guard();
            const first=await inspect(result.text,options);
            if(first.accepted){result.previewCheck={...first,status:'checked'};return result;}
            nativeRejected=true;
            let enabled=[];const attempts=[];
            for(const [name]of V2214_RECOVERY_GROUPS){
                task.guard();v2214Remaining(task);
                const selected=V2214_RECOVERY_GROUPS.map(row=>row[0]).filter(value=>enabled.includes(value)||value===name),cfg=v2214RecoveryOptions(requested,selected);
                if(!cfg)continue;
                let locallyComputed=false;
                try{
                    const candidate=await computeLocal(task,{kind:'adjust',source:task.source,originalSource:task.source,
                        options:cfg,v2214Trial:true,v2214PreserveRuntimeOptions:true,v2214EnabledGroups:selected});
                    task.guard();locallyComputed=true;
                    if(!v219AutomaticResultSafety(task.source,candidate,context).accepted){attempts.push({group:name,localAccepted:false});continue;}
                    const decision=await inspect(candidate.text,cfg);
                    attempts.push({group:name,localAccepted:true,nativeAccepted:decision.accepted});
                    if(!decision.accepted)continue;
                    const certificate=v2214RecoveryCertificate(task.source,requested,cfg,selected,context);
                    if(!certificate)continue;
                    best={...candidate,automaticRecovery:certificate,previewCheck:{...decision,status:'checked'}};enabled=selected;
                }catch(error){
                    task.guard();attempts.push({group:name,exception:true});
                    if(error?.noFallback||task.previewTimedOut)break;
                    if(!locallyComputed)continue;
                    // An unavailable native response never promotes a locally
                    // accepted but unparsed candidate after an actual refusal.
                    break;
                }
            }
            const retained=best||preserved();retained.v2214NativeRecoveryTrace={attempts};return retained;
        }catch(error){
            task.guard();if(best)return best;
            if(nativeRejected)return preserved();
            if(error?.noFallback)throw error;
            result.previewCheck={checked:false,status:'incomplete',reason:onlineError(error)};return result;
        }finally{
            if(previewTimer!==null)root.clearTimeout(previewTimer);
            if(task.previewSession)task.previewSession.cancelled=true;
            for(const pending of task.previewSession?.requests||[])pending.abort?.();
            task.previewDeadlinePromise=null;task.previewSession=null;task.preflightRequests=[];
        }
    }
    // Literal reference owners are indexed without consulting writer options.
    // An unchanged ignored field stays untouched; a changed field/owner cannot
    // acquire rendering semantics while its matching reference list is absent.
    function v2214ReferenceActivationIndex(source) {
        return v210Memo(source,'v2214-reference-activation',()=>{
            const observed=v219NativeReferenceObserver(source),nodes=templates(observed.view).nodes,boxes=[];
            for(const node of nodes){
                const raw=source.slice(node.start,node.end),parsed=parsedTemplate(raw),native=INFOBOX_CATALOG[parsed.name],
                    translated=native?null:translationProfile(raw);
                if(!native&&translated?.kind!=='infobox'&&!/^(?:info\/|infobox\b)/.test(parsed.name))continue;
                const fields=v221BioFields(raw);if(!fields)continue;
                const owner=norm(native?.redirectTo||native?.title||translated?.target||parsed.name),references=[];
                for(const field of fields){
                    if(field.positional)continue;
                    const start=node.start+field.start,end=node.start+field.end;
                    for(const ref of observed.refs)if(start<=ref.start&&ref.end<=end)
                        references.push({key:field.key,start:ref.start,end:ref.end,group:ref.group});
                }
                boxes.push({owner,keys:fields.filter(field=>!field.positional).map(field=>field.key),references});
            }
            const collectors=[];
            for(const range of rendererRanges(observed.view)){
                const context=v219IndexedSyntaxContext(source,range.start);
                if(!context||['templates','html','tables','links','external'].some(key=>context[key]?.length))continue;
                const raw=source.slice(range.start,range.end),tag=v24SyntaxTag(raw,0);
                if(tag?.name==='references'){
                    const attrs=v24SyntaxAttrs(tag.attrs);
                    if(!attrs||Object.keys(attrs).some(key=>!['group','responsive'].includes(key))||!v24SyntaxLiteralIdentity({group:attrs.group??''})||attrs.responsive!==undefined&&!['0','1'].includes(attrs.responsive))continue;
                    collectors.push({start:range.start,end:range.end,groups:[attrs.group??'']});continue;
                }
                const native=v219NativeCollectorGroups(raw);
                if(native.recognized&&!native.ambiguous&&Array.isArray(native.groups)&&native.groups.every(group=>typeof group==='string'))
                    collectors.push({start:range.start,end:range.end,groups:native.groups.slice()});
            }
            return {boxes,collectors};
        });
    }
    function v2214ReferenceActivationAudit(before,after,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||before===after||!/<ref\b/i.test(after)||!after.includes('{{'))return [];
        const original=v2214ReferenceActivationIndex(before),candidate=v2214ReferenceActivationIndex(after),findings=[];
        for(const [ordinal,box]of candidate.boxes.entries()){
            const prior=original.boxes[ordinal],sameOwner=prior?.owner===box.owner,cursors=new Map();
            for(const ref of box.references){
                // Each unchanged field/group consumes one original occurrence.
                // Removals can form a subsequence; an extra or changed group
                // cannot borrow another tag's already established lineage.
                if(sameOwner){
                    const previous=prior.references.filter(old=>old.key===ref.key),cursor=cursors.get(ref.key)||0,
                        found=previous.findIndex((old,index)=>index>=cursor&&old.group===ref.group);
                    if(found>=0){cursors.set(ref.key,found+1);continue;}
                }
                if(candidate.collectors.some(collector=>collector.start>=ref.end&&collector.groups.includes(ref.group)))continue;
                findings.push({code:'reference-activation-unconfirmed',severity:'warning',start:ref.start,
                    message:'A mudança de um campo com referência não confirmou uma lista nativa posterior do mesmo grupo.'});
            }
        }
        return findings;
    }
