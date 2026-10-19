    // These displayed birth fields have their own source proof. They do not
    // acquire a contract for copying dates or places into the introduction.
    const V219_NATIVE_AGE_FIELDS=Object.freeze({
        70644942:{title:'Info/Ciclista',keys:['data_nascimento','nascimento_data','datadenascimento','datanascimento']},
        72109254:{title:'Info/Gastrônomo',keys:['nascimento']},
        69488735:{title:'Info/Lutador de wrestling profissional',keys:['birth_date','nascimento_data','data de nascimento']},
        71101279:{title:'Info/Motorista da F1',keys:['nascimento_data','Data nasc','Date of birth']},
        66194847:{title:'Info/Personalidade',keys:['data_nascimento','nascimento_data']},
        72581852:{title:'Info/Titular de cargo',keys:['data_nascimento','nascimento_data']},
        58866342:{title:'Info/Wrestler',keys:['birth_date','nascimento_data','data de nascimento']}
    });
    function v219NativeAgePlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.syntaxRepairs===false||cfg.birthDates===false||
            !v216FieldValueScope(cfg)||! /\{\{[dD]ni\|[^{}]*}}[ \t]+\(\d{1,3} anos?\)/.test(source))return empty;
        const box=v28PrincipalPersonBox(source,cfg);
        if(!box||box.sourceRaw!==box.raw||!v215LiteralTemplateIdentity(box.raw,box.profile)||
            !Object.hasOwn(V219_NATIVE_AGE_FIELDS,box.profile.oldid))return empty;
        const native=V219_NATIVE_AGE_FIELDS[box.profile.oldid];
        if(box.profile.title!==native.title)return empty;
        const fields=v2151FieldSyntaxParts(box.raw);
        if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))return empty;
        if(fields.some(field=>/calend[aá]rio|calendar|^suprimir$/i.test(field.key)&&field.value.trim()))return empty;
        const keys=new Set([...native.keys,'nascimento_data','data_nascimento','nasceu','nascimento',
            'datadenascimento','data de nascimento','birth_date','datanascimento','nascimentodata'].map(norm));
        const edges=[...Object.entries(box.profile.aliases||{}),...Object.entries(box.profile.renames||{})];
        let expanded=true;
        while(expanded){expanded=false;for(const [key,target]of edges)if(typeof target==='string'&&keys.has(norm(target))&&!keys.has(norm(key))){keys.add(norm(key));expanded=true;}}
        const selected=fields.filter(field=>keys.has(norm(field.key)));
        if(selected.length!==1||!native.keys.includes(selected[0].key)||!profileAccepts(box.profile,selected[0].key))return empty;
        const field=selected[0],parsed=v216DuplicateAgeValue(field.value,source);
        if(!parsed)return empty;
        const start=box.node.start+field.start+parsed.start,end=box.node.start+field.start+parsed.end;
        const edits=[{start,end,text:'',ruleId:'v216InfoboxDuplicateAge',proof:{sourceHash:empty.sourceHash,
            nativeTemplate:native.title,nativeTemplateOldid:box.profile.oldid,key:field.key,
            valueBefore:source.slice(start,end),valueAfter:'',age:parsed.age,calendarUTC:parsed.calendarUTC,
            expiresUTC:parsed.expiresUTC,nativeAgeOldid:69218531,changeRules:['v216InfoboxDuplicateAge'],
            condition:'only an identical current-UTC manual-age suffix in one source-proved native displayed birth field; complete Dni, references, other fields and article bytes retained'}}];
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219NativeAgeProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219NativeAgePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219NativeAgeInventoryProjection(source,cfg={}) {
        const plan=v219NativeAgePlan(source,cfg);
        return plan.edits.length&&v219NativeAgeProof(source,plan.text,plan,cfg)?plan.text:source;
    }
