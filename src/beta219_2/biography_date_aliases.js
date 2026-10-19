    // Equal accepted date aliases can otherwise prevent the existing date
    // plan from reaching one principal native box. Remove only a redundant
    // same-role binding with exactly the same complete literal date value.
    function v219BiographyDateAliasPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||cfg.automaticParameterDuplicates===false||cfg.birthDates===false||
            cfg.automaticBiographyFields===false)return empty;
        const box=v28PrincipalPersonBox(source,cfg);
        if(!box||box.raw!==box.sourceRaw||!v215LiteralTemplateIdentity(box.raw,box.profile))return empty;
        const contract=V28_DATE_FIELDS[box.name],parts=v24SyntaxParts(box.raw.slice(2,-2));
        if(!contract||!parts||parts.length!==box.fields.length+1||
            box.fields.some(field=>/calend[aá]rio|calendar/i.test(field.key)&&field.value.trim()))return empty;
        const edits=[];
        for(const kind of ['birthDate','deathDate']){
            const keys=contract[kind==='birthDate'?'birth':'death']||[],fields=box.fields.filter(field=>keys.includes(field.key));
            if(fields.length<2||fields.some(field=>!profileAccepts(box.profile,field.key)||!field.value.trim()||
                field.value!==fields[0].value))continue;
            const core=fields[0].value.trim(),native=kind==='birthDate'?'dni':'morte',
                parsed=core.startsWith('{{')?parsedTemplate(core):null,
                date=parsed&&v215SameTemplateTitle(parsed.parts[0],native==='dni'?'Dni':'Morte')?
                    v28DateTemplate(core,native):v28DateNumbers(core);
            const leading=fields[0].value.indexOf(core),trailing=leading+core.length;
            if(!date||/[<>\[\]&\u0000-\u001F\u007F\uE000-\uF8FF]/.test(core)||
                !/^[ \t\r\n]*$/.test(fields[0].value.slice(0,leading)+fields[0].value.slice(trailing)))continue;
            for(const field of fields.slice(1)){
                const index=box.fields.indexOf(field)+1,part=parts[index];
                edits.push({start:box.node.start+1+part.start,end:box.node.start+2+part.end,text:'',ruleId:'infoboxDuplicates',
                    proof:{sourceHash:empty.sourceHash,nativeTemplate:box.profile.title,nativeTemplateOldid:box.profile.oldid,
                        kind:'identical-native-date-alias',role:kind,keptKey:fields[0].key,removedKey:field.key,
                        literalValue:field.value,condition:'one complete principal native box; accepted same-role date aliases; byte-identical nonempty validated date values; no references, comments, unknown children, calendar, blank priority or other changes'}});
            }
        }
        edits.sort((a,b)=>a.start-b.start||a.end-b.end);
        if(edits.some((edit,index)=>index&&edit.start<edits[index-1].end))return empty;
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219BiographyDateAliasProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219BiographyDateAliasPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
