    // Copying a fact to the opening does not release its original infobox
    // field from preservation. Read candidate fields literally, never through
    // v28PrincipalPersonBox, whose canonicalization belongs to source writers.
    function v219BiographyFactLiteralBox(source,cfg,oldid) {
        const head=v2151LeadHead(source);if(head===null)return null;
        const nodes=biographyNodes(head).nodes.filter(node=>v273MarriageBoxName(parsedTemplate(head.slice(node.start,node.end)).name));
        if(nodes.length!==1)return null;
        const node=nodes[0],raw=head.slice(node.start,node.end),p=parsedTemplate(raw),profile=INFOBOX_CATALOG[p.name];
        if(!profile||profile.oldid!==oldid||!v215LiteralTemplateIdentity(raw,profile))return null;
        const fields=v28LiteralInfoboxFields(raw,p.name),contract=v2151LeadTransferContract(profile);
        if(!fields||!contract||new Set(fields.map(field=>field.key)).size!==fields.length)return null;
        return {node,raw,sourceRaw:raw,name:p.name,profile,fields,contract};
    }
    function v219BiographyFactHeader(box) {
        const keys=new Set(['nome',...box.contract.headers].map(norm));
        for(const [key,target]of Object.entries({...box.profile.aliases,...box.profile.renames}))if(keys.has(norm(target)))keys.add(norm(key));
        const fields=box.fields.filter(field=>keys.has(norm(field.key)));
        if(fields.length>1||fields.some(field=>!box.contract.headers.includes(field.key)))return null;
        return fields.map(field=>field.value);
    }
    function v219BiographyFactPresentation(source,cfg={}) {
        if(cfg.links===false)return source;
        // Author only the two existing literal cleanLinks branches. The
        // actual writer must independently reach this complete source value.
        const authored=source.replace(/\[\[([A-Za-z][\p{L}\p{M} .,'-]*)\|([A-Za-z][\p{L}\p{M} .,'-]*)\]\]/gu,(raw,target,label)=>
            target===label||target.slice(1)===label.slice(1)&&target[0].toLowerCase()===label[0].toLowerCase()?'[['+label+']]':raw);
        return authored!==source&&cleanLinks(source,()=>{})===authored?authored:source;
    }
    function v219BiographySourceFactProof(plan,expected,actual) {
        const pass={accepted:true,reason:'',checked:0},reject=()=>({accepted:false,checked:pass.checked,
            reason:'A infocaixa perdeu ou alterou a fonte de um dado copiado para a identificação inicial.'}),cfg=plan?.cfg||{},
            steps=(plan?.safe?.steps||[]).filter(step=>step.name==='v2151-biography-lead'&&step.edits.some(edit=>edit.proof?.copiedFacts?.length));
        if(!steps.length)return pass;
        for(const step of steps){
            if(typeof step.before!=='string'||typeof step.after!=='string')return reject();
            const fresh=v2151BiographyLeadPlan(step.before,cfg);
            if(!v2151BiographyLeadProof(step.before,step.after,fresh,cfg)||
                JSON.stringify(fresh.edits)!==JSON.stringify(step.edits)||
                JSON.stringify(v219StageSafeEdits(step.before,fresh.edits,'v2151-biography-lead',cfg))!==JSON.stringify(fresh.edits))return reject();
            const head=v2151LeadHead(step.before);if(head===null)return reject();
            const source=v28PrincipalPersonBox(head,cfg);
            if(!source||source.raw!==source.sourceRaw)return reject();
            const wanted=v219BiographyFactLiteralBox(expected,cfg,source.profile.oldid),candidate=v219BiographyFactLiteralBox(actual,cfg,source.profile.oldid);
            if(!wanted||!candidate)return reject();
            const sourceHeaders=v219BiographyFactHeader({...source,contract:v2151LeadTransferContract(source.profile)}),wantedHeaders=v219BiographyFactHeader(wanted),actualHeaders=v219BiographyFactHeader(candidate);
            if(sourceHeaders===null||wantedHeaders===null||actualHeaders===null||sourceHeaders.length!==wantedHeaders.length||wantedHeaders.length!==actualHeaders.length)return reject();
            for(let index=0;index<wantedHeaders.length;index++)if(wantedHeaders[index]!==actualHeaders[index]&&v219BiographyFactPresentation(wantedHeaders[index],cfg)!==actualHeaders[index])return reject();
            for(const edit of fresh.edits)for(const fact of edit.proof?.copiedFacts||[]){
                pass.checked++;
                if(edit.proof.boxRaw!==source.sourceRaw)return reject();
                const original=v2151LeadFactField(source,fact.kind,step.before,true),a=v2151LeadFactField(wanted,fact.kind,expected,true),b=v2151LeadFactField(candidate,fact.kind,actual,true);
                if(!original||original.key!==fact.key||original.fieldValue!==fact.fieldValue||original.identity!==fact.identity||
                    !a||!b||a.identity!==fact.identity||b.identity!==fact.identity)return reject();
                // Keep the complete selected field, including its original
                // reference markup. Only a separately authored, exact existing
                // SOURCE cleanLinks endpoint can change this literal value.
                if(a.fieldValue!==b.fieldValue&&v219BiographyFactPresentation(a.fieldValue,cfg)!==b.fieldValue)return reject();
                const originalBindings=v2151LeadReferenceBindings(a.fieldValue,expected,cfg),actualBindings=v2151LeadReferenceBindings(b.fieldValue,actual,cfg);
                if(originalBindings===null||actualBindings===null||JSON.stringify(originalBindings)!==JSON.stringify(actualBindings))return reject();
            }
        }
        return pass;
    }
