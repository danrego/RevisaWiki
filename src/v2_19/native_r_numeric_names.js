    function v219NativeRNumericPlan(source,cfg={}) {
        const empty={text:source,edits:[]};
        if(typeof source!=='string'||cfg.namespaceNumber!==0||cfg.sectionOnly||!v24SyntaxScope(cfg)||
            cfg.references===false||cfg.numericRefNames===false)return empty;
        const helpers=v219NativeRProfiles(source);
        if(!helpers.length||helpers.some(helper=>!helper.eligible)||!helpers.some(helper=>helper.calls.some(call=>numericReferenceName(call.value)))||
            v219ReferenceIdentityQuarantine(source,cfg).opaque)return empty;
        const observed=v219NativeReferenceObserver(source);
        if(!observed.refs.some(ref=>ref.attrs?.name&&numericReferenceName(ref.attrs.name)))return empty;
        const uses=referenceNameUses(source),edits=v219NumericReferenceNameEdits(source,cfg,()=>{},()=>{}).map(edit=>{
            const use=uses.find(use=>use.start===edit.start&&use.end===edit.end);
            return {...edit,ruleId:'numericRefNames',proof:{kind:'native-r-numeric-name',
                identity:decodedReferenceName(use.value),target:edit.text,sourceHash:v24SyntaxHash(source)}};
        });
        return {text:v24SyntaxApply(source,edits),edits};
    }
