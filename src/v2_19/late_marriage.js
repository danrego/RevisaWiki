    // A native key repair can expose the already supported spouse-value rule
    // after its first stage. Replay only its exact value edit, once.
    function v219LateMarriagePlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||! /\bcasad[oa]s?\b/iu.test(source)||cfg.infoboxes===false||cfg.markup===false||
            cfg.syntaxRepairs===false||cfg.structuralRepairs===false)return empty;
        const box=v28PrincipalPersonBox(source,cfg);
        if(!box||box.sourceRaw!==box.raw||!v215LiteralTemplateIdentity(box.raw,box.profile))return empty;
        const parsed=v273MarriageFields(box.raw,box.name);
        if(!parsed||!profileAccepts(box.profile,parsed.spouse.key))return empty;
        const value=v273MarriageValue(parsed.spouse.value);
        if(!value)return empty;
        const fresh=v273MarriagePlan(source,cfg);
        if(fresh.edits.length!==1||!v273MarriageProof(source,fresh.text,fresh,cfg))return empty;
        const aggregate=fresh.edits[0];
        if(aggregate.start!==box.node.start||aggregate.end!==box.node.end||
            aggregate.proof?.raw!==box.raw||aggregate.proof.canonical!==box.raw||
            aggregate.proof.key!==parsed.spouse.key)return empty;
        const start=box.node.start+parsed.spouse.start+value.start,end=box.node.start+parsed.spouse.start+value.end;
        if(source.slice(start,end)!==value.original)return empty;
        const edits=[{start,end,text:value.text,ruleId:'marriageInfoboxes',proof:{sourceHash:empty.sourceHash,
            nativeTemplate:box.profile.title,nativeTemplateOldid:box.profile.oldid,key:parsed.spouse.key,
            valueBefore:value.original,valueAfter:value.text,name:value.name,from:value.from,to:value.to,status:value.status,
            changeRules:['marriageInfoboxes'],condition:'only the exact already proved native single-spouse value conversion after a displayed field becomes valid; no field, name, date, status, reference or unrelated infobox byte is replayed'}}];
        const text=v24SyntaxApply(source,edits);
        if(text!==fresh.text)return empty;
        return {...empty,text,edits};
    }
    function v219LateMarriageProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219LateMarriagePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    // Guard-only projection of the same fresh, independently proved value
    // transaction. A changed name/date/status or any other field still differs.
    function v219LateMarriageInventoryProjection(source,cfg={}) {
        const plan=v219LateMarriagePlan(source,cfg);
        return plan.edits.length&&v219LateMarriageProof(source,plan.text,plan,cfg)?plan.text:source;
    }
