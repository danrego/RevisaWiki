    // A foreign infobox can become native after the ordinary biography stage.
    // Reuse only the existing, pinned standalone-date edits in that now-native
    // principal box. No name, place, label, list or marital field is replayed.
    function v219LateBiographyDatePlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||cfg.birthDates===false||cfg.syntaxRepairs===false||
            cfg.infoboxes===false||cfg.automaticBiographyFields===false||!v216FieldValueScope(cfg))return empty;
        const box=v216FieldValueBox(source,cfg);if(!box)return empty;
        const native=v216FieldValuePlan(source,cfg);
        if(!native.edits.length||!v216FieldValueProof(source,native.text,native,cfg))return empty;
        const contract=v2151LeadTransferContract(box.profile),edits=[];
        if(!contract||box.fields.some(field=>/calend[aá]rio|calendar/i.test(field.key)&&field.value.trim()))return empty;
        for(const aggregate of native.edits){
            if(aggregate.start!==box.node.start||aggregate.end!==box.node.end||aggregate.proof?.raw!==box.raw)continue;
            for(const edit of aggregate.proof.edits||[]){
                if(edit.ruleId!=='v216InfoboxStandaloneDates'||!['birthDate','deathDate'].includes(edit.detail?.kind))continue;
                const field=box.fields.find(field=>field.key===edit.detail.key&&field.start<=edit.start&&edit.end<=field.end);
                if(!field||!profileAccepts(box.profile,field.key)||!contract[edit.detail.kind]?.includes(field.key)||
                    !v216FieldValueUnique(box,field,edit.detail.kind,contract))continue;
                const fresh=v216StandaloneDateValue(field.value,source);
                if(!fresh||edit.start!==field.start+fresh.start||edit.end!==field.start+fresh.end||edit.text!==fresh.text)continue;
                edits.push({start:box.node.start+edit.start,end:box.node.start+edit.end,text:edit.text,ruleId:edit.ruleId,
                    proof:{sourceHash:empty.sourceHash,template:box.profile.title,nativeTemplateOldid:box.profile.oldid,
                        key:field.key,kind:edit.detail.kind,date:fresh.date,valueBefore:source.slice(box.node.start+edit.start,box.node.start+edit.end),
                        valueAfter:edit.text,changeRules:[edit.ruleId],
                        condition:'only the exact fresh native standalone birth/death date plan in the principal displayed field; all remaining infobox, references and article bytes retained'}});
            }
        }
        edits.sort((a,b)=>a.start-b.start||a.end-b.end);
        if(edits.some((edit,index)=>index&&edit.start<edits[index-1].end))return empty;
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219LateBiographyDateProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219LateBiographyDatePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
