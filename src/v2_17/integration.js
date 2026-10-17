    function v217InfoboxObjectProof(plan,expected,actual) {
        const steps=(plan.safe?.steps||[]).filter(step=>step.name==='v217-infobox-values');
        if(!steps.length)return {accepted:true,reason:''};
        const wanted=new Set(steps.flatMap(step=>step.edits.map(edit=>edit.proof?.template)));
        const reject=()=>({accepted:false,reason:'Os dados da infocaixa diferem dos ajustes confirmados.'});
        if(!wanted.size||wanted.has(undefined))return reject();
        const cfg={...plan.cfg,bareReferences:false};
        const before=v273MarriageInventory(v216MediaNamespaceSource(expected,cfg),cfg,wanted);
        const after=v273MarriageInventory(v216MediaNamespaceSource(actual,cfg),cfg,wanted);
        return before.size&&v24InventoryContains(before,after)?{accepted:true,reason:''}:reject();
    }
    function v217MechanicalPresentation(source,cfg={}) {
        const plan=v217InfoboxValuePlan(source,cfg);
        const edits=plan.edits.filter(edit=>edit.proof?.minorSafe===true);
        return v24SyntaxApply(source,edits);
    }
    function v217RetainedCount(before,after,topics=[],kinds=[],options={}) {
        if(before===after||typeof before!=='string'||typeof after!=='string'||options.v217RetainedCountSkip)return null;
        const cfg=v2151RetainedContext(before,after,options);if(!cfg)return null;
        let plan=v25SafeRepairPlan(before,cfg),selection=null;
        if(!plan.steps.some(step=>step.name.startsWith('v217-'))||plan.text===before)return null;
        if(v25SafeRepairPlan(after,cfg).text!==after){
            // Count a complete dependency transaction selected independently
            // from unchanged literal tables. This changes no repair decision.
            const subset=v210IndependentSubsetProof(before,after,cfg);
            if(!subset.accepted||subset.groups.length!==1||subset.groups[0]!=='dependencies')return null;
            const selected=v25SafeRepairPlan(before,{...cfg,automaticTableRepairs:false});
            if(selected.text!==after||!selected.steps.some(step=>step.name==='v217-infobox-values'))return null;
            selection={groups:subset.groups,sourceHash:subset.sourceHash,method:'complete-independent-dependency-transaction'};
            plan=selected;
        }
        if(!v217InfoboxObjectProof({cfg,safe:plan},plan.text,after).accepted)return null;
        const remainder=plan.text===after?{count:0,exact:true,events:[]}:
            v211RetainedAdjustments(plan.text,after,kinds,{...options,...cfg,v217RetainedCountSkip:true,v216RetainedCountSkip:true,v2151RetainedCountSkip:true});
        if(!remainder.exact||!Number.isInteger(remainder.count)||remainder.count<0||remainder.events?.length!==remainder.count)return null;
        const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after),events=[];
        for(let stage=0;stage<plan.steps.length;stage++){
            const step=plan.steps[stage];let delta=0;
            for(let index=0;index<step.edits.length;index++){
                const edit=step.edits[index],rules=edit.proof?.changeRules||[edit.ruleId],newStart=edit.start+delta;delta+=edit.text.length-(edit.end-edit.start);
                if(!rules.length||rules.some(rule=>typeof rule!=='string'||!rule))return null;
                for(let operation=0;operation<rules.length;operation++){
                    const rule=rules[operation],fragment={start:edit.start,end:edit.end,newStart,newEnd:newStart+edit.text.length,before:step.before.slice(edit.start,edit.end),after:edit.text};
                    events.push({id:sourceHash+':v217:'+stage+':'+index+':'+operation,rule,kind:'source-bound-operation',label:GROUP_LABELS[rule]||rule,
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
