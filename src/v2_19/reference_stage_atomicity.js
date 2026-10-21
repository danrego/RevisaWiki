    function v219NativeRStageOwners(source,edits,name,cfg={}) {
        if(!['v27-references','v219-native-r-numeric'].includes(name))return [];
        const numeric=name==='v219-native-r-numeric';
        if(!edits.some(edit=>numeric?edit.proof?.kind==='native-r-numeric-name':edit.ruleId==='v27NamedReferences'))return [];
        const owners=edits.filter(edit=>numeric?edit.proof?.kind==='native-r-numeric-name':edit.ruleId==='v27NamedReferences').map(edit=>v219NativeRNameOwner(source,edit)).filter(Boolean);
        if(!owners.length||JSON.stringify(edits)!==JSON.stringify(numeric?v219NativeRNumericPlan(source,cfg).edits:v27SafeAutomationEdits(source,cfg,'references')))return [];
        return owners.map(owner=>({start:owner.start,end:owner.end,referenceHelper:true}));
    }
    function v219AtomicReferenceStageEdits(original,allowed) {
        const key=edit=>edit.proof?.kind==='native-r-numeric-name'?JSON.stringify(['numeric',edit.proof.identity]):edit.ruleId==='v27NamedReferences'&&edit.proof?
            JSON.stringify([edit.proof.group,edit.proof.region,edit.proof.name,
                edit.proof.normalizedBody,edit.proof.names,edit.proof.bodies]):null,
            span=edit=>JSON.stringify([edit.start,edit.end,edit.text]),
            retained=new Set(allowed.map(span)),blocked=new Set();
        for(const edit of original){const family=key(edit);if(family&&!retained.has(span(edit)))blocked.add(family);}
        return blocked.size?allowed.filter(edit=>!blocked.has(key(edit))):allowed;
    }

    // A masked editing view cannot prove that a collector interval is empty.
    function v219RestoredCollectorPlanAllowed(source,cfg,plan,restore) {
        if(typeof restore!=='function')return true;
        const whole=restore(source);
        if(whole===source)return true;
        const full=structuralArticlePlan(whole,cfg).referencePlan;
        return !!full&&full.text===restore(plan.text);
    }

    // Read-only normalization uses the same source owner permissions as the
    // real stages. A proposed plan is not authorization to edit its owners.
    function v219ReferenceProjection(source,cfg,stages) {
        if(typeof source!=='string')throw new TypeError('O texto precisa ser uma string.');
        let text=source;
        for(const [name,find]of stages){
            const edits=v219StageSafeEdits(text,find(text,cfg),name,cfg);
            if(edits.length)text=v24SyntaxApply(text,edits);
        }
        return text;
    }
