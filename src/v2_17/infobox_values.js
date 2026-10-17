    // Native source and anonymous parse evidence: infobox_contract_review.json.
    // Keys already accepted by the native template are never renamed here.
    const V217_INFOBOX_VALUE_CONTRACTS=Object.freeze({"72993800":{"accents":{"residencia":"residência","educacao":"educação","outras_ocupacoes":"outras_ocupações","profissao":"profissão","religiao":"religião","organizacao":"organização","titulos":"títulos","nome_mae":"nome_mãe"},"groups":[{"kind":"occupation","mode":"presence","keys":["ocupação","ocupações","ocupacao","trabalho civil","Ocupação"]},{"kind":"spouse","mode":"presence","keys":["cônjuge","conjuge"]},{"kind":"fullName","mode":"presence","keys":["nome_completo","nome_de_batismo"]},{"kind":"website","mode":"presence","keys":["website","site","url","sítio","site_oficial","homepage"]}]},"70095373":{"accents":{"posicao":"posição","pe":"pé","nascimento_pais":"nascimento_país"},"groups":[]},"72882232":{"accents":{"educacao":"educação","residencia":"residência","ocupacao":"ocupação","nome_mae":"nome_mãe","conjuge":"cônjuge"},"groups":[]},"72931974":{"accents":{"religiao":"religião","profissao":"profissão","ocupacao":"ocupação","residencia":"residência","nome_mae":"nome_mãe"},"groups":[{"kind":"spouse","mode":"presence","keys":["cônjuge","conjuge"]},{"kind":"website","mode":"presence","keys":["website","homepage"]}]},"70403402":{"accents":{},"groups":[{"kind":"spouse","mode":"presence","keys":["cônjuge","conjuge"]}]},"72130922":{"accents":{},"groups":[{"kind":"spouse","mode":"presence","keys":["conjuge","cônjuge"]},{"kind":"occupation","mode":"presence","keys":["ocupacao","ocupação"]},{"kind":"website","mode":"presence","keys":["website","site","url","sítio","site_oficial","homepage"]}]}});
    function v217InfoboxValueScope(cfg={}) {
        return v2151FieldSyntaxScope({...cfg,automaticFieldSyntax:true})&&
            cfg.automaticBiographyFields!==false&&cfg.automaticInfoboxValues!==false;
    }
    function v217InfoboxValueBox(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!v217InfoboxValueScope(cfg)||
            /^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle||''))||/~{3,5}/.test(source))return null;
        const context=v27SafeContext(source,cfg);if(!context)return null;
        const nodes=context.nodes.filter(node=>/^(?:info\/|infobox\b)/.test(parsedTemplate(source.slice(node.start,node.end)).name));
        if(nodes.length!==1)return null;
        const node=nodes[0],raw=source.slice(node.start,node.end),name=parsedTemplate(raw).name,
            profile=INFOBOX_CATALOG[name],contract=V217_INFOBOX_VALUE_CONTRACTS[profile?.oldid],fields=v2151FieldSyntaxParts(raw);
        if(!V28_PERSON_NATIVE_NAMES.has(name)||!profile?.title||!contract||!fields||
            !v215LiteralTemplateIdentity(raw,profile)||fields.some(field=>field.key!==field.plain||field.separator!=='=')||
            new Set(fields.map(field=>field.key)).size!==fields.length||
            inRange(node.start,context.shield.ranges)||discussionProtectionRanges(source,{discussionPage:true}).length)return null;
        if(!structuralReaders(source).nodes.some(item=>item.start===node.start&&item.end===node.end))return null;
        const firstSection=context.view.search(/^={2,6}[^=\n].*?={2,6}\s*$/m),lineEnd=source.indexOf('\n',node.end);
        if(firstSection>=0&&node.start>=firstSection||
            source.slice(source.lastIndexOf('\n',node.start-1)+1,node.start).trim()||
            source.slice(node.end,lineEnd<0?source.length:lineEnd).trim())return null;
        if(fields.some(field=>['embed','child','embutido','subcaixa','nested'].includes(norm(field.key))&&
            field.value.trim()&&!/^(?:não|nao|no|false|0)$/i.test(field.value.trim())))return null;
        const inner=raw.slice(2,-2);
        if(templates(protectedView(inner)).nodes.some(item=>/^(?:info\/|infobox\b)/.test(parsedTemplate(inner.slice(item.start,item.end)).name)))return null;
        const music=BIOGRAPHY_MUSIC_BOXES.has(name)||V273_MARRIAGE_MUSIC.has(name);
        if(music){const types=fields.filter(field=>field.key==='fundo');
            if(types.length!==1||!BIOGRAPHY_SOLO_TYPES.has(norm(types[0].value))||
                fields.some(field=>['integrantes','exintegrantes'].includes(field.key)&&field.value.trim()))return null;
        }
        return {context,node,raw,name,profile,contract,fields};
    }
    function v217InfoboxValueFamily(box,keys) {
        const family=new Set(keys.map(norm)),edges=[...Object.entries(box.profile.aliases||{}),
            ...Object.entries(box.profile.renames||{}),...Object.entries(V28_BIOGRAPHY_PARAMETER_TYPOS),
            ...Object.entries(box.contract.accents)];
        for(const group of box.contract.groups)for(const key of group.keys)edges.push([key,group.keys[0]]);
        // Imported names block a collision. They never authorize an edit.
        for(const profile of Object.values(TRANSLATION_RULES.profiles))if(profile.kind==='infobox'&&nameOf(profile.target)===box.name)
            edges.push(...Object.entries(profile.fields||{}));
        let changed=true;
        while(changed){changed=false;for(const [a,b]of edges)if(typeof b==='string'&&(family.has(norm(a))||family.has(norm(b)))){
            if(!family.has(norm(a))){family.add(norm(a));changed=true;}
            if(!family.has(norm(b))){family.add(norm(b));changed=true;}
        }}
        return family;
    }
    function v217InfoboxValueEdits(source,cfg={}) {
        const box=v217InfoboxValueBox(source,cfg);if(!box)return [];
        const local=[],changeRules=[],add=(edit,ruleId,detail)=>{
            local.push({...edit,ruleId,detail});changeRules.push(ruleId);
        },acceptedNormalized=profileIndex(box.profile).normalized,
            accentMap=new Map(Object.entries(box.contract.accents).map(([key,target])=>[norm(key),target]));
        for(const field of box.fields){
            if(v2151FrozenBurialField(field.key)||profileAccepts(box.profile,field.key)||acceptedNormalized.has(norm(field.key))||
                /^[ \t\r\n]*$/.test(field.value))continue;
            const target=accentMap.get(norm(field.key));
            if(!target||!profileAccepts(box.profile,target)||v2151FrozenBurialField(target))continue;
            const family=v217InfoboxValueFamily(box,[target]);
            if(box.fields.some(other=>other!==field&&family.has(norm(other.key))))continue;
            add({start:field.keyStart,end:field.keyEnd,text:target},'v217InfoboxParameterAccents',{
                key:field.key,target,oldid:box.profile.oldid,contractVersion:'native-infobox-values-1',
                condition:'per-template missing-accent typo; unique reviewed displayed native field; value bytes retained'});
        }
        for(const group of box.contract.groups){
            const family=v217InfoboxValueFamily(box,group.keys),present=box.fields.filter(field=>family.has(norm(field.key)));
            if(present.length!==2||present.some(field=>!group.keys.includes(field.key)||
                !profileAccepts(box.profile,field.key)||v2151FrozenBurialField(field.key)))continue;
            const empty=present.filter(field=>/^[ \t\r\n]*$/.test(field.value)),populated=present.filter(field=>field.value.trim());
            if(empty.length!==1||populated.length!==1||empty[0]===populated[0])continue;
            if(group.mode!=='presence'||group.keys.indexOf(populated[0].key)>=group.keys.indexOf(empty[0].key))continue;
            // A blank high-priority presence fallback is intentional output
            // suppression. It cannot be removed to expose a lower argument.
            add({start:empty[0].partStart-1,end:empty[0].partEnd,text:''},'v217InfoboxEmptyAliases',{
                key:empty[0].key,retainedKey:populated[0].key,kind:group.kind,mode:group.mode,
                oldid:box.profile.oldid,contractVersion:'native-infobox-values-1',
                condition:'populated higher-priority native argument already supplies the exact displayed value'});
        }
        if(!local.length)return [];
        local.sort((a,b)=>a.start-b.start||a.end-b.end);
        if(local.some((edit,index)=>index&&edit.start<local[index-1].end))return [];
        const canonical=v24SyntaxApply(box.raw,local),after=v2151FieldSyntaxParts(canonical);
        if(!after)return [];
        for(const field of box.fields.filter(field=>v2151FrozenBurialField(field.key)))
            if(local.some(edit=>edit.start<field.partEnd&&edit.end>field.partStart))return [];
        return [{start:box.node.start,end:box.node.end,text:canonical,ruleId:'v217InfoboxValues',proof:{
            sourceHash:v24SyntaxHash(source),template:box.name,oldid:box.profile.oldid,raw:box.raw,canonical,
            contractVersion:'native-infobox-values-1',edits:local,changeRules,
            minorSafe:local.every(edit=>edit.ruleId==='v217InfoboxEmptyAliases'),
            condition:'one literal principal native person infobox; native definition and anonymous parse contract; accepted names and all populated values retained; explicit empty defaults, dates, Wikidata and burial fields untouched'}}];
    }
    function v217InfoboxValuePlan(source,cfg={}) {
        const edits=v217InfoboxValueEdits(source,cfg);
        return {source,sourceHash:typeof source==='string'?v24SyntaxHash(source):'',edits,
            text:typeof source==='string'?v24SyntaxApply(source,edits):source};
    }
    function v217InfoboxValueProof(source,result,plan,cfg={}) {
        if(typeof source!=='string'||!plan||plan.source!==source||plan.sourceHash!==v24SyntaxHash(source)||plan.text!==result)return false;
        const fresh=v217InfoboxValuePlan(source,cfg);
        return fresh.text===result&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function automaticInfoboxValues(source,cfg={},bump=()=>{}) {
        const plan=v217InfoboxValuePlan(source,cfg);
        for(const edit of plan.edits)for(const rule of edit.proof.changeRules)bump(rule);
        return plan.text;
    }
