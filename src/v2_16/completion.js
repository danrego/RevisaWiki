    function v216TimeDependentSource(source) {
        return /\{\{\s*dni\s*\|[^{}]{0,300}\}\}[ \t]*\(\d{1,3} anos?\)/i.test(source);
    }
    // Reuse only the old heading-removal proof after final footer movement.
    // Reference relocation, box removal and other structural actions do not
    // participate in this final pass.
    function v216EmptyEndHeadingPlan(source,cfg={}) {
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,edits:[]};
        if(cfg.automaticBiographyFields===false||!structuralScope(cfg)||cfg.headings===false||typeof source!=='string'||source.length>4194304)return plan;
        const pending=structuralArticlePlan(source,cfg).headingRemovals;
        const edits=pending.map(edit=>({...edit,ruleId:'emptyEndHeadings',proof:{sourceHash:plan.sourceHash,before:source.slice(edit.start,edit.end),condition:'existing exact empty final section proof after collector and footer transformations; no text, comments, unknown template or subsection removed'}}));
        return {...plan,edits,text:applyEdits(source,edits)};
    }
    function v216EmptyEndHeadingProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        const fresh=v216EmptyEndHeadingPlan(before,cfg);
        return fresh.text===after&&plan.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v216EmptyEndHeadingCleanup(source,cfg={},bump=()=>{}) {
        const plan=v216EmptyEndHeadingPlan(source,cfg);
        if(!plan.edits.length||!v216EmptyEndHeadingProof(source,plan.text,plan,cfg))return source;
        for(const edit of plan.edits)bump(edit.ruleId);
        return plan.text;
    }
    function v216MediaNamespaceSource(source,cfg={}) {
        if(cfg.categories===false||typeof source!=='string')return source;
        const view=protectedView(source),edits=[];
        for(const match of view.matchAll(/\[\[([ \t]*:?[ \t]*)(?:File|Image|Ficheiro|Arquivo|Imagem)([ \t]*:)/gi)){
            // categoryPass already uses this native namespace equivalence.
            // Only the namespace changes here; filenames, options, captions,
            // source bindings and complete protected literals remain exact.
            const start=match.index+2+match[1].length,end=match.index+match[0].length-match[2].length;
            if(source.slice(start,end)==='Imagem')continue;
            edits.push({start,end,text:'Imagem'});
        }
        return v24SyntaxApply(source,edits);
    }
    function v216BiographyObjectProof(plan,expected,actual) {
        const steps=(plan.safe?.steps||[]).filter(step=>step.name.startsWith('v216-'));
        if(!steps.length)return {accepted:true,reason:''};
        const wanted=new Set(steps.flatMap(step=>step.edits.map(edit=>edit.proof?.template)));
        const reject=()=>({accepted:false,reason:'A infocaixa perdeu ou alterou dados fora dos ajustes confirmados.'});
        if(!wanted.size||wanted.has(undefined))return reject();
        const cfg={...plan.cfg,bareReferences:false},before=v273MarriageInventory(v216MediaNamespaceSource(expected,cfg),cfg,wanted),after=v273MarriageInventory(v216MediaNamespaceSource(actual,cfg),cfg,wanted);
        return before.size&&v24InventoryContains(before,after)?{accepted:true,reason:''}:reject();
    }
    function v216MechanicalPresentation(source,cfg={}) {
        // The reverse transfer adds facts to a new display location and is
        // deliberately absent from the automatic minor-edit proof.
        let text=source;
        for(let round=0;round<3;round++){
            const next=v28BiographyDatePlan(v216FieldValuePlan(text,cfg).text,cfg).text;if(next===text)break;text=next;
        }
        return v216EmptyEndHeadingPlan(text,cfg).text;
    }
    function v216RetainedCount(before,after,topics=[],kinds=[],options={}) {
        if(before===after||typeof before!=='string'||typeof after!=='string'||options.v216RetainedCountSkip)return null;
        const cfg=v2151RetainedContext(before,after,options);if(!cfg)return null;
        const plan=v25SafeRepairPlan(before,cfg);
        if(!plan.steps.some(step=>step.name.startsWith('v216-'))||plan.text===before)return null;
        if(v25SafeRepairPlan(after,cfg).text!==after||!v216BiographyObjectProof({cfg,safe:plan},plan.text,after).accepted)return null;
        const remainder=plan.text===after?{count:0,exact:true,events:[]}:
            v211RetainedAdjustments(plan.text,after,kinds,{...options,...cfg,v216RetainedCountSkip:true,v2151RetainedCountSkip:true});
        if(!remainder.exact||!Number.isInteger(remainder.count)||remainder.count<0||remainder.events?.length!==remainder.count)return null;
        const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after),events=[];
        for(let stage=0;stage<plan.steps.length;stage++){
            const step=plan.steps[stage];let delta=0;
            for(let index=0;index<step.edits.length;index++){
                const edit=step.edits[index],rules=edit.proof?.changeRules||[edit.ruleId],newStart=edit.start+delta;delta+=edit.text.length-(edit.end-edit.start);
                if(!rules.length||rules.some(rule=>typeof rule!=='string'||!rule))return null;
                for(let operation=0;operation<rules.length;operation++){
                    const rule=rules[operation],fragment={start:edit.start,end:edit.end,newStart,newEnd:newStart+edit.text.length,before:step.before.slice(edit.start,edit.end),after:edit.text};
                    events.push({id:sourceHash+':v216:'+stage+':'+index+':'+operation,rule,kind:'source-bound-operation',label:GROUP_LABELS[rule]||rule,
                        sourceHash:v24SyntaxHash(step.before),outputHash:v24SyntaxHash(step.after),rootSourceHash:sourceHash,rootOutputHash:outputHash,
                        sourceAnchors:[{start:edit.start,end:edit.end}],outputAnchors:[{start:newStart,end:newStart+edit.text.length}],before:fragment.before,after:fragment.after,
                        fragments:[fragment],coordinateSpace:'logical-plan-step',witness:{stage:step.name,operation,changeRules:rules,proof:edit.proof}});
                }
            }
        }
        events.push(...remainder.events.map(event=>({...event,rootSourceHash:sourceHash,rootOutputHash:outputHash,coordinateSpace:'retained-remainder'})));
        const count=events.length;
        return {count,exact:true,events,topics,sourceHash,outputHash,unit:'retained-syntax-component',coveredFragments:count,totalFragments:count,
            unresolvedFragments:0,unresolved:[],projectionHash:v24SyntaxHash(plan.text),projectedOperations:count-remainder.count,remainderOperations:remainder.count,
            text:count+' ajuste'+(count===1?'':'s')+' aplicado'+(count===1?'':'s')};
    }
