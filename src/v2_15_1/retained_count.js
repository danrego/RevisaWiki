    // Count the operations in a regenerated, source-bound plan. A logical
    // step keeps its own coordinates when a box crosses the opening text.
    function v2151RetainedContext(before,after,options={}) {
        if(typeof before!=='string'||typeof after!=='string'||!options||typeof options!=='object')return null;
        const cfg={...DEFAULTS,namespaceNumber:0,...options};
        if(!Object.hasOwn(options,'pageTitle')){
            const subjects=[...after.matchAll(/^'''([^'\r\n]+)'''(?=[ \t])/gm)];
            let found=null;
            for(const subject of subjects){
                const candidate={...cfg,pageTitle:subject[1]},opening=v2151LeadOpening(after,candidate);
                if(opening&&opening.start===subject.index){if(found)return null;found=candidate;}
            }
            if(!found)return null;cfg.pageTitle=found.pageTitle;
        }
        return cfg.pageTitle&&cfg.namespaceNumber===0?cfg:null;
    }
    function v2151RetainedProjection(source,cfg={}) {
        const result={sourceHash:typeof source==='string'?v24SyntaxHash(source):'',text:source,steps:[],fixedPoint:false};
        if(typeof source!=='string'||source.length>4194304)return result;
        const stages=[['lead',v2151BiographyLeadPlan,v2151BiographyLeadProof],['position',v2151InfoboxOrderPlan,v2151InfoboxOrderProof],
            ['fields',v2151FieldSyntaxPlan,v2151FieldSyntaxProof],['image',v2151BiographyImageAltPlan,v2151BiographyImageAltProof]];
        const applyStages=(firstRound=0)=>{for(let round=firstRound;round<firstRound+3;round++){
            const previous=result.text;
            for(const [name,build,prove]of stages){
                const input=result.text,plan=build(input,cfg);if(!plan.edits.length)continue;
                if(plan.source!==input||plan.sourceHash!==v24SyntaxHash(input)||!prove(input,plan.text,plan,cfg)||
                    v24SyntaxApply(input,plan.edits)!==plan.text){result.invalid=true;return;}
                result.steps.push({name,round,sourceHash:plan.sourceHash,outputHash:v24SyntaxHash(plan.text),edits:plan.edits.map(edit=>({...edit,before:input.slice(edit.start,edit.end)}))});result.text=plan.text;
            }
            if(result.text===previous){result.fixedPoint=true;break;}
        }};
        applyStages();if(result.invalid)return {...result,fixedPoint:false};
        const preparation=v2151BiographyPreparationPlan(result.text,cfg);
        if(preparation.edits.length){
            const input=result.text;if(!v2151BiographyPreparationProof(input,preparation.text,preparation,cfg))return {...result,fixedPoint:false,invalid:true};
            result.steps.push({name:'preparation',round:3,sourceHash:preparation.sourceHash,outputHash:v24SyntaxHash(preparation.text),edits:preparation.edits.map(edit=>({...edit,before:input.slice(edit.start,edit.end)}))});
            result.text=preparation.text;result.fixedPoint=false;applyStages(4);if(result.invalid)return {...result,fixedPoint:false};
        }
        if(!result.fixedPoint)result.fixedPoint=stages.every(([,build])=>build(result.text,cfg).edits.length===0);
        if(result.fixedPoint&&result.steps.length){
            // The existing date rule adds a complete birth triplet to Morte
            // as one proved age operation, not three unrelated parameters.
            const input=result.text,dates=v28BiographyDatePlan(input,cfg);
            if(dates.edits.length){
                if(!v28BiographyDateProof(input,dates.text,dates,cfg))return {...result,fixedPoint:false,invalid:true};
                result.steps.push({name:'biography-dates',round:3,sourceHash:dates.sourceHash,outputHash:v24SyntaxHash(dates.text),edits:dates.edits.map(edit=>({...edit,before:input.slice(edit.start,edit.end)}))});
                result.text=dates.text;result.fixedPoint=stages.every(([,build])=>build(result.text,cfg).edits.length===0)&&v28BiographyDatePlan(result.text,cfg).edits.length===0;
            }
        }
        return result;
    }
    function v2151RetainedFeatures(projected,after,cfg={}) {
        const all=projected.steps.flatMap(step=>step.edits.map(edit=>({name:step.name,edit}))),leadChanges=all.filter(item=>item.name==='lead');
        let opening=null,box=null;
        if(leadChanges.length||all.some(item=>item.name==='position')){
            opening=v2151LeadOpening(after,cfg);if(!opening)return false;
        }
        if(leadChanges.length){
            const expected=v2151LeadOpening(projected.text,cfg);if(!expected||opening.body!==expected.body)return false;
            const rules=leadChanges.flatMap(item=>item.edit.proof.changeRules||[item.edit.ruleId]);
            if(rules.some(rule=>['biographyLeadBold','biographyLeadSelfLink'].includes(rule))&&(!opening.bold||opening.selfLink))return false;
            if(rules.some(rule=>['biographyLeadBirth','biographyLeadDeath','biographyLeadTuple'].includes(rule))){
                const wanted=expected.tuple&&v2151LeadProofTuple(expected.tuple.raw,projected.text,cfg),actual=opening.tuple&&v2151LeadProofTuple(opening.tuple.raw,after,cfg);
                if(!wanted||!actual)return false;
                for(const side of ['birth','death']){
                    if(!!wanted[side]!==!!actual[side])return false;if(!wanted[side])continue;
                    if(wanted[side].date.identity!==actual[side].date.identity||wanted[side].reversed!==actual[side].reversed||
                        (wanted[side].place?.identity||'')!==(actual[side].place?.identity||''))return false;
                }
                const wantedBindings=v2151LeadTupleBinding(wanted,projected.text,cfg),actualBindings=v2151LeadTupleBinding(actual,after,cfg);
                if(wantedBindings===null||actualBindings===null||JSON.stringify(wantedBindings)!==JSON.stringify(actualBindings))return false;
            }
        }
        if(all.some(item=>item.name!=='lead')){
            const head=v2151LeadHead(after);box=head===null?null:v28PrincipalPersonBox(head,cfg);if(!box)return false;
        }
        for(const item of all){
            const p=item.edit.proof;if(item.name==='position'){
                if(box.name!==p.template||box.node.end>opening.start||after.slice(after.lastIndexOf('\n',box.node.start-1)+1,box.node.start))return false;
            }else if(item.name==='fields'){
                if(box.name!==p.template)return false;
                for(const edit of p.edits){const key=edit.detail?.target||edit.detail?.key,fields=box.fields.filter(field=>field.key===key);
                    if(fields.length!==1)return false;
                    if(edit.ruleId==='infoboxImageUnitDuplicate'&&fields[0].value.trim()!==edit.detail.pixels+'px')return false;
                }
            }else if(item.name==='image'){
                if(box.name!==p.template)return false;const contract=v28BiographyFieldContract(box.name),parsed=p.parsed;if(!contract||!parsed)return false;
                for(const [keys,value]of [[contract.image,parsed.filename],[['alt'],parsed.alt],[contract.size,parsed.size],[contract.caption,parsed.caption]]){
                    if(value===null)continue;const fields=box.fields.filter(field=>keys.includes(field.key));if(fields.length!==1)return false;
                    if(v24InventoryBody(fields[0].value.trim(),cfg)!==v24InventoryBody(value,cfg))return false;
                }
            }else if(item.name==='biography-dates'){
                const expectedHead=v2151LeadHead(projected.text),expectedBox=expectedHead===null?null:v28PrincipalPersonBox(expectedHead,cfg);
                if(!expectedBox||expectedBox.name!==box.name)return false;
                for(const key of [p.birthKey,p.deathKey]){
                    const wanted=expectedBox.fields.filter(field=>field.key===key),retained=box.fields.filter(field=>field.key===key);
                    if(wanted.length!==1||retained.length!==1||v24InventoryBody(wanted[0].value.trim(),cfg)!==v24InventoryBody(retained[0].value.trim(),cfg))return false;
                }
            }else if(item.name==='preparation'){
                if(box.name!==p.template||box.profile.oldid!==p.oldid)return false;
            }
        }
        return true;
    }
    function v2151RetainedCount(before,after,topics=[],kinds=[],options={}) {
        if(before===after||typeof before!=='string'||typeof after!=='string'||options.v2151RetainedCountSkip)return null;
        const cfg=v2151RetainedContext(before,after,options);if(!cfg)return null;
        const projected=v2151RetainedProjection(before,cfg);
        if(!projected.fixedPoint||projected.invalid||!projected.steps.length||projected.text===before)return null;
        const actual=v2151RetainedProjection(after,cfg);
        if(!actual.fixedPoint||actual.invalid||actual.text!==after||!v2151RetainedFeatures(projected,after,cfg))return null;
        const remainder=projected.text===after?{count:0,exact:true,events:[],unresolvedFragments:0,totalFragments:0,coveredFragments:0}:
            v211RetainedAdjustments(projected.text,after,kinds,{...options,...cfg,v2151RetainedCountSkip:true});
        if(!remainder.exact||!Number.isInteger(remainder.count)||remainder.count<0||!Array.isArray(remainder.events)||remainder.events.length!==remainder.count)return null;
        const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after),events=[];
        for(let stage=0;stage<projected.steps.length;stage++){
            const step=projected.steps[stage];let delta=0;
            for(let index=0;index<step.edits.length;index++){
                const edit=step.edits[index],rules=edit.proof.changeRules||[edit.ruleId],newStart=edit.start+delta;delta+=edit.text.length-(edit.end-edit.start);
                if(!rules.length||rules.some(rule=>typeof rule!=='string'||!rule))return null;
                for(let operation=0;operation<rules.length;operation++){
                    const rule=rules[operation],fragment={start:edit.start,end:edit.end,newStart,newEnd:newStart+edit.text.length,before:edit.before,after:edit.text};
                    events.push({id:sourceHash+':v2151:'+stage+':'+index+':'+operation,rule,kind:'source-bound-operation',label:GROUP_LABELS[rule]||rule,
                        sourceHash:step.sourceHash,outputHash:step.outputHash,rootSourceHash:sourceHash,rootOutputHash:outputHash,
                        sourceAnchors:[{start:edit.start,end:edit.end}],outputAnchors:[{start:newStart,end:newStart+edit.text.length}],
                        before:fragment.before,after:fragment.after,fragments:[fragment],coordinateSpace:'logical-plan-step',
                        witness:{stage:step.name,round:step.round,operation,changeRules:rules,proof:edit.proof}});
                }
            }
        }
        if(!events.length)return null;
        events.push(...remainder.events.map(event=>({...event,rootSourceHash:sourceHash,rootOutputHash:outputHash,coordinateSpace:'retained-remainder'})));
        const count=events.length;
        return {count,exact:true,events,topics,sourceHash,outputHash,unit:'retained-syntax-component',coveredFragments:count,totalFragments:count,
            unresolvedFragments:0,unresolved:[],projectionHash:v24SyntaxHash(projected.text),projectedOperations:count-remainder.count,remainderOperations:remainder.count,
            text:count+' ajuste'+(count===1?'':'s')+' aplicado'+(count===1?'':'s')};
    }
