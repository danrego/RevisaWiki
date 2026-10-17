    // Read the key and its separator independently from the value. A confirmed
    // native key can be repaired without interpreting or reformatting its data.
    function v2151FieldSyntaxScope(cfg={}) {
        return cfg.namespaceNumber===0&&cfg.infoboxes!==false&&cfg.markup!==false&&
            cfg.structuralRepairs!==false&&cfg.automaticFieldSyntax!==false&&
            !cfg.sectionOnly&&(cfg.section===undefined||cfg.section===null||cfg.section==='')&&
            !cfg.discussionPage&&!cfg.redirectPage&&!cfg.disambiguationPage&&
            !cfg.pageRedirect&&!cfg.pageDisambiguation&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&(!cfg.model||cfg.model==='wikitext');
    }
    function v2151FrozenBurialField(key) {
        return /^(?:sepultamento|enterro(?:[ _]local)?|resting[ _]place)$/.test(
            String(key).replace(/[\u200B\uFEFF]/g,'').trim().toLowerCase());
    }
    function v2151FieldSyntaxParts(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}')||
            /\{\{\{|\{\{[ \t\r\n]*(?:#|subst[ \t]*:|safesubst[ \t]*:)/i.test(raw))return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
        const fields=[];
        for(const part of parts.slice(1)){
            const match=/^([ \t\r\n]*)([\p{L}\p{N} _/()\-\u200B\uFEFF]+?)([ \t\r\n]*)([=＝])([\s\S]*)$/u.exec(part.text);
            if(!match)return null;
            const key=match[2],plain=key.replace(/[\u200B\uFEFF]/g,'');
            if(!/^\p{L}[\p{L}\p{N} _/()\-]*$/u.test(plain)||plain!==plain.trim())return null;
            const keyStart=2+part.start+match[1].length,keyEnd=keyStart+key.length,
                separator=keyEnd+match[3].length,valueStart=separator+1;
            fields.push({key,plain,separator:match[4],keyStart,keyEnd,separatorStart:separator,
                start:valueStart,end:2+part.end,value:match[5],partStart:2+part.start,partEnd:2+part.end});
        }
        return fields;
    }
    // These are displayed native fields, not a parameter-checker allowlist.
    // Each oldid identifies the reviewed literal header or value expression.
    const V2151_FIELD_DISPLAY_GROUPS=Object.freeze({
        72993800:{name:['nome'],fullName:['nome_completo','nome_de_batismo'],nationality:['nacionalidade'],citizenship:['cidadania'],
            occupation:['ocupação','ocupações','ocupacao','trabalho civil','Ocupação'],otherOccupation:['outras_ocupações'],profession:['profissão'],
            image:['imagem','foto'],size:['imagem tamanho','imagem_tamanho','imagemtamanho'],caption:['legenda','imagem_legenda','desc'],alt:['alt'],
            website:['website','site','url','sítio','site_oficial','homepage'],
            birthDate:['nascimento_data','data_nascimento','nasceu','nascimento'],birthPlace:['local_nascimento','nascimento_local'],
            deathDate:['morte_data','data_morte','data_falecimento','faleceu','falecimento'],deathPlace:['local_morte','morte_local','local_falecimento','localfaleceu']},
        72882232:{name:['nome']},72931974:{name:['nome']},72594140:{name:['nome']},
        70403402:{name:['nome']},72130922:{name:['nome']},73044750:{name:['nome']}
    });
    function v2151FieldSyntaxContract(profile) {
        const native=V2151_FIELD_DISPLAY_GROUPS[profile?.oldid]||{},
            transfer=typeof v2151LeadTransferContract==='function'?v2151LeadTransferContract(profile):null,
            displayed={...native};
        if(transfer?.headers?.length)displayed.name=transfer.headers;
        for(const kind of ['birthDate','birthPlace','deathDate','deathPlace'])if(transfer?.[kind]?.length)displayed[kind]=transfer[kind];
        const guardOnly={birthDate:['nascimento_data','data_nascimento','nasceu','nascimento','datadenascimento','data de nascimento'],
            birthPlace:['nascimento_local','local_nascimento','nascimento_cidade','cidade natal','localnasc'],
            deathDate:['morte_data','data_morte','data_falecimento','faleceu','falecimento','data de morte','morte'],
            deathPlace:['morte_local','local_morte','local_falecimento','localfaleceu']};
        const allowed=new Set(Object.values(displayed).flat()),groups=Object.entries(displayed).map(([kind,keys])=>({kind,keys:new Set([...keys,...(guardOnly[kind]||[]),...(transfer?.guardOnly?.[kind]||[])])}));
        if(!allowed.size)return null;
        // Known imported aliases participate only as collision blockers. An
        // accepted or renamed key is never enough to enable a repair itself.
        const edges=[...Object.entries(profile.aliases||{}),...Object.entries(profile.renames||{})];
        for(const group of groups){let changed=true;while(changed){changed=false;for(const [a,b]of edges)if(typeof b==='string'&&(group.keys.has(a)||group.keys.has(b))){if(!group.keys.has(a)){group.keys.add(a);changed=true;}if(!group.keys.has(b)){group.keys.add(b);changed=true;}}}}
        // Native condition-only birth aliases affect row visibility, but are
        // not valid value sources. They block conflicting corrections only.
        if(profile.oldid===72993800){const group=groups.find(item=>item.kind==='birthPlace');if(group)for(const key of ['nascimento_cidade','cidade natal','localnasc'])group.keys.add(key);}
        const components=groups.map(group=>({kinds:[group.kind],keys:new Set(group.keys)}));
        for(let i=0;i<components.length;i++)for(let j=i+1;j<components.length;j++)if([...components[j].keys].some(key=>components[i].keys.has(key))){
            for(const key of components[j].keys)components[i].keys.add(key);components[i].kinds.push(...components[j].kinds);components.splice(j,1);i=-1;break;
        }
        const families=new Map();for(const component of components){const family='group:'+component.kinds.sort().join(',');for(const key of component.keys)families.set(key,family);}
        return {allowed,groups,families};
    }
    function v2151FieldSyntaxFamily(key,profile,contract,name='') {
        const reviewed=contract?.allowed instanceof Set?contract:v2151FieldSyntaxContract(profile);
        if(!reviewed)return 'unreviewed:'+key;
        return reviewed.families.get(key)||'key:'+key;
    }
    function v2151FieldSyntaxEdits(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!v2151FieldSyntaxScope(cfg)||
            !/[\u200B\uFEFF＝]|pxpx/.test(source)||/^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle||''))||/~{3,5}/.test(source))return [];
        const context=v27SafeContext(source,cfg);if(!context)return [];
        const boxes=context.nodes.filter(node=>/^(?:info\/|infobox\b)/.test(parsedTemplate(source.slice(node.start,node.end)).name));
        if(boxes.length!==1)return [];
        const node=boxes[0],raw=source.slice(node.start,node.end),name=parsedTemplate(raw).name,
            profile=INFOBOX_CATALOG[name],contract=v2151FieldSyntaxContract(profile),fields=v2151FieldSyntaxParts(raw);
        if(!V28_PERSON_NATIVE_NAMES.has(name)||!profile?.title||!Number.isInteger(profile.oldid)||!contract||
            !v215LiteralTemplateIdentity(raw,profile)||!fields||
            inRange(node.start,context.shield.ranges)||discussionProtectionRanges(source,{discussionPage:true}).length)return [];
        if(!structuralReaders(source).nodes.some(item=>item.start===node.start&&item.end===node.end))return [];
        const firstSection=context.view.search(/^={2,6}[^=\n].*?={2,6}\s*$/m),lineEnd=source.indexOf('\n',node.end);
        if(firstSection>=0&&node.start>=firstSection||
            source.slice(source.lastIndexOf('\n',node.start-1)+1,node.start).trim()||
            source.slice(node.end,lineEnd<0?source.length:lineEnd).trim())return [];
        if(fields.some(field=>['embed','child','embutido','subcaixa','nested'].includes(field.plain)&&
            field.value.trim()&&!/^(?:não|nao|no|false|0)$/i.test(field.value.trim())))return [];
        const inner=raw.slice(2,-2);
        if(templates(protectedView(inner)).nodes.some(item=>/^(?:info\/|infobox\b)/.test(parsedTemplate(inner.slice(item.start,item.end)).name)))return [];
        const music=BIOGRAPHY_MUSIC_BOXES.has(name)||V273_MARRIAGE_MUSIC.has(name);
        if(music){const types=fields.filter(field=>field.plain==='fundo');
            if(types.length!==1||!BIOGRAPHY_SOLO_TYPES.has(norm(types[0].value))||
                fields.some(field=>['integrantes','exintegrantes'].includes(field.plain)&&field.value.trim()))return [];
        }
        const local=[],rules=[],add=(start,end,text,ruleId,detail)=>{
            local.push({start,end,text,ruleId,detail});rules.push(ruleId);
        };
        const family=key=>v2151FieldSyntaxFamily(key,profile,contract,name),
            collisions=field=>fields.some(other=>other!==field&&family(other.plain)===family(field.plain));
        for(const field of fields){
            // The burial aliases are deliberately frozen while their native
            // checker is discussed. Neither their keys nor their values move.
            if(v2151FrozenBurialField(field.key)||!contract.allowed.has(field.plain)||!profile.accepted.includes(field.plain)||collisions(field))continue;
            if(field.key!==field.plain&&!profile.accepted.includes(field.key))
                add(field.keyStart,field.keyEnd,field.plain,'fieldInvisibleKey',{key:field.key,target:field.plain});
            if(field.separator==='＝')add(field.separatorStart,field.separatorStart+1,'=',
                'fieldFullwidthEquals',{key:field.plain,separator:'＝'});
            // Only this pinned definition has been checked here for an explicit
            // px value, through InfoboxImage. Other boxes may expect a number.
            if(profile.oldid!==72993800||!profile.dependencies?.some(item=>item.title==='Módulo:InfoboxImage'&&item.oldid===72932632)||
                !V2151_FIELD_DISPLAY_GROUPS[72993800].size.includes(field.plain)||
                fields.some(other=>other!==field&&V2151_FIELD_DISPLAY_GROUPS[72993800].size.includes(other.plain))||
                fields.some(other=>other.plain==='landscape'&&other.value.trim()))continue;
            const size=/^([ \t\r\n]*)([1-9]\d{1,2})pxpx([ \t\r\n]*)$/.exec(field.value);
            if(size&&+size[2]>=10&&+size[2]<=500)
                add(field.start+size[1].length+size[2].length+2,field.start+size[1].length+size[2].length+4,'',
                    'infoboxImageUnitDuplicate',{key:field.plain,pixels:+size[2],definition:72993800,module:72932632});
        }
        if(!local.length)return [];
        local.sort((a,b)=>a.start-b.start||a.end-b.end);
        if(local.some((edit,index)=>index&&edit.start<local[index-1].end))return [];
        const canonical=v24SyntaxApply(raw,local);
        // Validate the resulting literal fields directly. The broader existing
        // biography reader can migrate imported aliases while it reads, which
        // must not become a prerequisite for this narrowly bounded correction.
        if(!v28LiteralInfoboxFields(canonical,name))return [];
        for(const field of fields.filter(field=>v2151FrozenBurialField(field.key)))
            if(local.some(edit=>edit.start<field.partEnd&&edit.end>field.partStart))return [];
        return [{start:node.start,end:node.end,text:canonical,ruleId:'fieldSyntax',proof:{sourceHash:v24SyntaxHash(source),
            template:name,oldid:profile.oldid,raw,canonical,edits:local,changeRules:rules,
            condition:'single literal principal native person infobox; reviewed displayed native key and complete confirmed alias blockers; unreviewed accepted keys declined; explicit value bytes preserved except one pinned duplicate image unit; burial fields untouched'}}];
    }
    function v2151FieldSyntaxPlan(source,cfg={}) {
        const edits=v2151FieldSyntaxEdits(source,cfg);
        return {source,sourceHash:typeof source==='string'?v24SyntaxHash(source):'',text:typeof source==='string'?v24SyntaxApply(source,edits):source,edits};
    }
    function automaticFieldSyntax(source,cfg={},bump=()=>{}) {
        const plan=v2151FieldSyntaxPlan(source,cfg);
        for(const edit of plan.edits)for(const rule of edit.proof.changeRules)bump(rule);
        return plan.text;
    }
    function v2151FieldSyntaxProof(source,result,plan,cfg={}) {
        if(!plan||plan.source!==source||plan.sourceHash!==v24SyntaxHash(source)||plan.text!==result)return false;
        const fresh=v2151FieldSyntaxPlan(source,cfg);
        return fresh.text===result&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
