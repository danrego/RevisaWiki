    // Local maintenance redirects already forward the native target's exact
    // argument interface. Their English-looking names do not prove that an
    // English parameter should be renamed or that a new date may be activated.
    const V219_MAINTENANCE_REDIRECTS=Object.freeze({
        'dead link':{target:'Ligação inativa',oldid:71635506},
        deadlink:{target:'Ligação inativa',oldid:71635508},
        'link quebrado':{target:'Ligação inativa',oldid:71635505},
        'citation needed':{target:'Carece de fontes',oldid:35312407},
        fact:{target:'Carece de fontes',oldid:37590510},
        'carece fontes':{target:'Carece de fontes',oldid:46305853},
        maisfontes:{target:'Mais fontes',oldid:59244755},
        'faltam fontes':{target:'Mais fontes',oldid:59244751},
        cleanup:{target:'Reciclagem',oldid:36502849},
        reciclar:{target:'Reciclagem',oldid:46303209}
    });
    const V219_MAINTENANCE_REFUSALS=new Set(['sem notas','mfontes','ligação quebrada','blp sources']);
    function v219MaintenanceCall(raw,cfg={}) {
        const unhandled={handled:false,text:raw,edits:[]};
        if(typeof raw!=='string'||cfg.maintenance===false||!raw.startsWith('{{')||!raw.endsWith('}}')||
            !v215LiteralTemplateIdentity(raw))return unhandled;
        const parsed=parsedTemplate(raw),head=parsed.parts[0],name=parsed.name,
            redirect=Object.hasOwn(V219_MAINTENANCE_REDIRECTS,name)?V219_MAINTENANCE_REDIRECTS[name]:null,
            targetName=Object.values(V219_MAINTENANCE_REDIRECTS).some(row=>norm(row.target)===name)||
                ['mais notas-bpv','sem fontes'].includes(name);
        if(V219_MAINTENANCE_REFUSALS.has(name))return {handled:true,text:raw,edits:[],blocked:true,
            reason:name==='sem notas'?'native-distinct-maintenance-meaning':'unproved-maintenance-interface'};
        if(!redirect)return targetName?{handled:true,text:raw,edits:[]}:unhandled;
        const start=2,end=start+head.length,text=redirect.target,after=raw.slice(0,start)+text+raw.slice(end);
        return {handled:true,text:after,edits:[{start,end,text,ruleId:'maintenance',
            proof:{sourceHash:v24SyntaxHash(raw),sourceTemplateOldid:redirect.oldid,
                kind:'native-maintenance-redirect-header-only',before:head,after:text,
                argumentSuffix:raw.slice(end),condition:'exact verified local redirect interface; only the template header changes; every argument byte, explicit blank, duplicate, unknown key, reference and date remains unchanged'}}]};
    }
    function v219MaintenanceCallProof(before,after,plan,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.text!==after)return false;
        const fresh=v219MaintenanceCall(before,cfg);
        return fresh.handled===plan.handled&&fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
