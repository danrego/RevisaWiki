    function v218CitationMetadataProjection(source,options={}) {
        // Reproduce only the same finite, source-bound key/date migrations.
        // The original retention guard still compares family, title, all
        // identifiers and the exact equivalent access-date obligation.
        const keyed=v218CitationKeyPlan(source,options).text;
        return v218CitationDatePlan(keyed,options).text;
    }
    function v218MinorCitationProof(before,after,cfg={}) {
        const plan=v218CitationIslandPlan(before,cfg);
        if(!plan.edits.length||plan.text!==after||!plan.edits.every(edit=>
            ['citationNames','citationParameters'].includes(edit.ruleId)&&edit.proof?.changeRules?.length===1&&
            edit.proof.changeRules[0]===edit.ruleId))return false;
        // A name/key-only native-equivalence proof does not authorize any
        // additional value, tag, identifier, reference or prose change.
        return preservationAudit(before,after,cfg).length===0&&safeComposition(before,after,cfg)==='';
    }
    function v218MechanicalCitationKeys(source,cfg={}) {
        return v24SyntaxApply(source,v218CitationKeyEdits(source,cfg).filter(edit=>edit.proof?.minorSafe===true));
    }
    function v218RetainedCount(before,after,topics=[],kinds=[],options={}) {
        if(before===after||typeof before!=='string'||typeof after!=='string'||options.v218RetainedCountSkip)return null;
        const cfg=v2151RetainedContext(before,after,options);if(!cfg)return null;
        let plan=v25SafeRepairPlan(before,cfg),selection=null;
        if(!plan.steps.some(step=>step.name.startsWith('v218-'))||plan.text===before)return null;
        if(v25SafeRepairPlan(after,cfg).text!==after)return null;
        if(!v217InfoboxObjectProof({cfg,safe:plan},plan.text,after).accepted)return null;
        const remainder=plan.text===after?{count:0,exact:true,events:[]}:
            v211RetainedAdjustments(plan.text,after,kinds,{...options,...cfg,v218RetainedCountSkip:true,v217RetainedCountSkip:true,v216RetainedCountSkip:true,v2151RetainedCountSkip:true});
        if(!remainder.exact||!Number.isInteger(remainder.count)||remainder.count<0||remainder.events?.length!==remainder.count)return null;
        const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after),events=[];
        for(let stage=0;stage<plan.steps.length;stage++){
            const step=plan.steps[stage];let delta=0;
            for(let index=0;index<step.edits.length;index++){
                const edit=step.edits[index],rules=edit.proof?.changeRules||[edit.ruleId],newStart=edit.start+delta;delta+=edit.text.length-(edit.end-edit.start);
                if(!rules.length||rules.some(rule=>typeof rule!=='string'||!rule))return null;
                for(let operation=0;operation<rules.length;operation++){
                    const rule=rules[operation],fragment={start:edit.start,end:edit.end,newStart,newEnd:newStart+edit.text.length,before:step.before.slice(edit.start,edit.end),after:edit.text};
                    events.push({id:sourceHash+':v218:'+stage+':'+index+':'+operation,rule,kind:'source-bound-operation',label:GROUP_LABELS[rule]||rule,
                        sourceHash:v24SyntaxHash(step.before),outputHash:v24SyntaxHash(step.after),rootSourceHash:sourceHash,rootOutputHash:outputHash,
                        sourceAnchors:[{start:edit.start,end:edit.end}],outputAnchors:[{start:newStart,end:newStart+edit.text.length}],before:fragment.before,after:fragment.after,
                        fragments:[fragment],coordinateSpace:'logical-plan-step',witness:{stage:step.name,operation,changeRules:rules,proof:edit.proof,...(selection?{selection}: {})}});
                }
            }
        }
        events.push(...remainder.events.map(event=>({...event,rootSourceHash:sourceHash,rootOutputHash:outputHash,coordinateSpace:'retained-remainder'})));
        const count=events.length;
        return {count,exact:true,events,topics,sourceHash,outputHash,unit:'retained-syntax-component',coveredFragments:count,totalFragments:count,
            unresolvedFragments:0,unresolved:[],projectionHash:v24SyntaxHash(plan.text),projectedOperations:count-remainder.count,remainderOperations:remainder.count,
            text:count+' ajuste'+(count===1?'':'s')+' aplicado'+(count===1?'':'s')};
    }
