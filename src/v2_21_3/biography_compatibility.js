    // Native biography revision 73315036 coalesces aliases by nonempty value.
    // Child certification changes reader scope only. It never edits module data.
    function v2213BiographyProfile(profile) {
        return profile?.oldid===73315036&&(norm(profile.title||'')==='info/biografia'||profile.redirectTo==='info/biografia');
    }
    function v2213PrincipalFlags(profile,fields) {
        const flags=fields.filter(f=>['embed','child','embutido','subcaixa','nested'].includes(norm(f.key)));
        if(!v2213BiographyProfile(profile))return flags.some(f=>f.value.trim()&&!/^(?:não|nao|no|false|0)$/i.test(f.value.trim()));
        if(new Set(flags.map(f=>f.key)).size!==flags.length)return true;
        if(flags.some(f=>!['embed','child'].includes(f.key)&&f.value.trim()&&!/^(?:não|nao|no|false|0)$/i.test(f.value.trim())))return true;
        const selected=['child','embed'].map(key=>flags.find(f=>f.key===key)).find(f=>f?.value.trim());
        return !!selected&&!/^(?:no|não|nao|n|false|falso|falsa|off|0)$/i.test(selected.value.trim());
    }
    function v2213ChildOwner(raw) {
        const p=parsedTemplate(raw),profile=INFOBOX_CATALOG[p.name],fields=v28LiteralInfoboxFields(raw,p.name);
        if(!profile||!fields||new Set(fields.map(f=>f.key)).size!==fields.length)return null;
        if(v2213BiographyProfile(profile))return {fields,modules:['módulo','módulo2','módulo3','módulo4','módulo5','módulo6'],flags:['child','embed'],yes:['yes','y','sim','s','true','verdadeiro','verdadeira','1']};
        if(p.name==='info/político'&&profile.oldid===72931974||p.name==='info/militar'&&profile.oldid===73236039)return {fields,modules:['módulo'],flags:['embed'],yes:['yes','sim']};
        return null;
    }
    function v2213EmbeddedPersonNodes(source,nodes) {
        const owned=new Set(),byRange=new Map(nodes.map(n=>[n.start+':'+n.end,n]));
        const visit=(node,owner,depth)=>{
            if(depth>12)return;
            for(const field of owner.fields){
                if(!owner.modules.includes(field.key))continue;
                const raw=field.value.trim(),leading=field.value.length-field.value.trimStart().length,
                    start=node.start+field.start+leading,child=byRange.get(start+':'+(start+raw.length));
                if(!child||!raw.startsWith('{{')||!raw.endsWith('}}'))continue;
                const next=v2213ChildOwner(raw);if(!next)continue;
                const chosen=next.flags.map(key=>next.fields.find(f=>f.key===key)).find(f=>f?.value.trim());
                if(!chosen||!next.yes.includes(chosen.value.trim().toLowerCase()))continue;
                owned.add(child.start);visit(child,next,depth+1);
            }
        };
        for(const node of nodes){
            if(node.depth!==0)continue;
            const raw=source.slice(node.start,node.end),profile=INFOBOX_CATALOG[parsedTemplate(raw).name];
            if(!v2213BiographyProfile(profile))continue;
            const owner=v2213ChildOwner(raw);if(owner)visit(node,owner,0);
        }
        return owned;
    }
    function v2213PrincipalPersonNodes(source,nodes) {
        const complete=new Map(nodes.map(n=>[n.start+':'+n.end,n]));
        for(const node of nodes){
            if(node.depth!==0||!v2213BiographyProfile(INFOBOX_CATALOG[parsedTemplate(source.slice(node.start,node.end)).name]))continue;
            for(const inner of templates(protectedView(source.slice(node.start,node.end))).nodes){
                if(!inner.start)continue;
                const child={...inner,start:node.start+inner.start,end:node.start+inner.end};complete.set(child.start+':'+child.end,child);
            }
        }
        const all=[...complete.values()],children=v2213EmbeddedPersonNodes(source,all);
        return all.filter(node=>!children.has(node.start)&&v273MarriageBoxName(parsedTemplate(source.slice(node.start,node.end)).name));
    }
    function v2213UncertifiedInnerInfo(raw) {
        const nodes=templates(protectedView(raw)).nodes,children=v2213EmbeddedPersonNodes(raw,nodes);
        return nodes.some(node=>node.start!==0&&/^(?:info\/|infobox\b)/.test(parsedTemplate(raw.slice(node.start,node.end)).name)&&!children.has(node.start));
    }
    function v2213ImageActivationSafe(profile,fields,inlineAlt=null) {
        if(!v2213BiographyProfile(profile))return true;
        if(fields.some(f=>f.key==='imagem_classe'&&f.value.trim()))return false;
        const alts=fields.filter(f=>['imagem_alt','alt'].includes(f.key));
        if(new Set(alts.map(f=>f.key)).size!==alts.length)return false;
        const selected=['imagem_alt','alt'].map(key=>alts.find(f=>f.key===key)).find(f=>f?.value.trim());
        return !selected||inlineAlt!==null&&selected.value.trim()===inlineAlt;
    }

    function v28PrincipalPersonBox(source,cfg={}) {
        if(!v28PotentialPersonSource(source))return null;
        if(cfg.namespaceNumber!==0||cfg.infoboxes===false||cfg.markup===false||cfg.pageRedirect||cfg.pageDisambiguation||cfg.sectionOnly||cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||!v24SyntaxScope(cfg)||/^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle||''))||/~{3,5}/.test(source)||discussionProtectionRanges(source,{discussionPage:true}).length)return null;
        const context=v27SafeContext(source,cfg);if(!context)return null;
        const nodes=biographyNodes(context.view).nodes,boxes=v2213PrincipalPersonNodes(source,nodes);if(boxes.length!==1)return null;
        const node=boxes[0],sourceRaw=source.slice(node.start,node.end),raw=v273MarriageCanonical(sourceRaw,cfg),name=parsedTemplate(raw).name,profile=INFOBOX_CATALOG[name],fields=v28LiteralInfoboxFields(raw,name);if(!profile||!fields)return null;
        const firstSection=context.view.search(/^={2,6}[^=\n].*?={2,6}\s*$/m),lineEnd=source.indexOf('\n',node.end);
        if(firstSection>=0&&node.start>=firstSection||source.slice(source.lastIndexOf('\n',node.start-1)+1,node.start).trim()||source.slice(node.end,lineEnd<0?source.length:lineEnd).trim()||context.shield.ranges.some(range=>range.start<=node.start&&node.start<range.end)||v273MarriagePotentialInfobox(source.slice(0,node.start))||v273MarriagePotentialInfobox(source.slice(node.end)))return null;
        if(v2213PrincipalFlags(profile,fields))return null;
        const music=BIOGRAPHY_MUSIC_BOXES.has(name)||V273_MARRIAGE_MUSIC.has(name),person=BIOGRAPHY_INFOBOXES.has(name)||!music&&Object.hasOwn(V273_MARRIAGE_PROFILES,name);
        if(!person&&!music)return null;
        if(music){const types=fields.filter(field=>norm(field.key)==='fundo');if(types.length!==1||!BIOGRAPHY_SOLO_TYPES.has(norm(types[0].value))||fields.some(field=>['integrantes','exintegrantes'].includes(norm(field.key))&&field.value.trim()))return null;}
        return {context,node,sourceRaw,originalRaw:sourceRaw,raw,name,profile,fields};
    }

    function v216FieldValueBox(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!v216FieldValueScope(cfg))return null;
        const box=v28PrincipalPersonBox(source,cfg);
        if(!box||box.sourceRaw!==box.raw||!v215LiteralTemplateIdentity(box.raw,box.profile)||
            !v2151LeadTransferContract(box.profile))return null;
        const fields=v2151FieldSyntaxParts(box.raw);
        if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))return null;
        if(v2213UncertifiedInnerInfo(box.raw))return null;
        return {...box,fields};
    }

    function v219BiographyFactLiteralBox(source,cfg,oldid) {
        const head=v2151LeadHead(source);if(head===null)return null;
        const nodes=v2213PrincipalPersonNodes(head,biographyNodes(head).nodes);
        if(nodes.length!==1)return null;
        const node=nodes[0],raw=head.slice(node.start,node.end),p=parsedTemplate(raw),profile=INFOBOX_CATALOG[p.name];
        if(!profile||profile.oldid!==oldid||!v215LiteralTemplateIdentity(raw,profile))return null;
        const fields=v28LiteralInfoboxFields(raw,p.name),contract=v2151LeadTransferContract(profile);
        if(!fields||!contract||new Set(fields.map(field=>field.key)).size!==fields.length)return null;
        return {node,raw,sourceRaw:raw,name:p.name,profile,fields,contract};
    }

    function v2151LeadFactFields(box,kind) {
        const groups={birthDate:['nascimento_data','data_nascimento','nasceu','nascimento','datadenascimento','data de nascimento'],
            birthPlace:['nascimento_local','local_nascimento','nascimento_cidade','cidade natal','localnasc'],
            deathDate:['morte_data','data_morte','data_falecimento','faleceu','falecimento','data de morte','morte'],
            deathPlace:['morte_local','local_morte','local_falecimento','localfaleceu']},contract=v2151LeadTransferContract(box.profile),
            keys=new Set([...groups[kind],...(contract?.[kind]||[]),...(contract?.guardOnly?.[kind]||[])].map(norm));
        for(const [key,target]of Object.entries({...box.profile?.aliases,...box.profile?.renames}))if(keys.has(norm(target)))keys.add(norm(key));
        const fields=box.fields.filter(field=>keys.has(norm(field.key)));
        if(!v2213BiographyProfile(box.profile)||!contract?.[kind])return fields;
        // A sole populated native alias is the first nonempty value. Unknown
        // aliases, duplicates and multiple populated values remain blockers.
        if(new Set(fields.map(f=>f.key)).size!==fields.length||fields.some(f=>!contract[kind].includes(f.key)))return fields;
        const populated=fields.filter(f=>f.value.trim());
        return populated.length===1?populated:fields;
    }

    function v28BiographyFieldPlan(raw,cfg={}) {
        const plan=v220BaselineBiographyFieldPlan(raw,cfg);
        if(!plan.edits?.some(e=>e.ruleId==='biographyImages'))return plan;
        const canonical=plan.canonical||raw,name=parsedTemplate(canonical).name,contract=v28BiographyFieldContract(name),fields=contract&&v220BioLiteralFields(canonical),image=fields&&v28BiographySingleField(fields,contract.image),parsed=image&&v28BiographyImageValue(image.value);
        if(!contract||!fields||parsed&&v220BioImageDimensionsLiteral(fields,contract.size,parsed.size)&&v2213ImageActivationSafe(INFOBOX_CATALOG[name],fields))return plan;
        const edits=plan.edits.filter(e=>e.ruleId!=='biographyImages'),rules=plan.rules.filter(id=>id!=='biographyImages');
        return {...plan,text:v24SyntaxApply(canonical,edits),edits,rules};
    }

    function v220BaselineBiographyImageAltPlan(source,cfg={}) {
        const plan={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):'',text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.automaticInfoboxImages===false||cfg.infoboxes===false||cfg.markup===false||
            cfg.discussionPage||cfg.redirectPage||cfg.disambiguationPage||!/\[\[(?:Ficheiro|Imagem|Arquivo|File|Image):[^\r\n]*\|alt=/i.test(source))return plan;
        const box=v28PrincipalPersonBox(source,cfg);if(!box||box.raw!==box.sourceRaw||!v215LiteralTemplateIdentity(box.raw,box.profile))return plan;
        const contract=v28BiographyFieldContract(box.name),fields=v28LiteralInfoboxFields(box.raw,box.name);
        if(!contract||!V2151_IMAGE_ALT_NAMES.has(box.name)||contract.base!=='info/biografia'||!v2213BiographyProfile(box.profile)||
            !box.profile.dependencies?.some(item=>item.title==='Módulo:InfoboxImage'&&item.oldid===72932632)||!fields||new Set(fields.map(field=>field.key)).size!==fields.length||
            !profileAccepts(box.profile,'alt')||fields.some(field=>/^(?:landscape|imagem_pequena|nome_imagem|imagem2|imagem3|foto2|image2)$/.test(field.key)&&field.value.trim()))return plan;
        const image=v28BiographySingleField(fields,contract.image);if(!image||!profileAccepts(box.profile,image.key))return plan;
        const parsed=v2151BiographyImageAltValue(image.value);if(!parsed||!v2213ImageActivationSafe(box.profile,fields,parsed.alt))return plan;
        const changes=[],additions=[],dest=(keys,target,value)=>{
            if(value===null)return true;
            const present=fields.filter(field=>keys.includes(field.key));if(present.length>1)return false;
            if(present.length){
                const field=present[0];if(!profileAccepts(box.profile,field.key))return false;
                if(field.value.trim()){if(field.value.trim()!==value||refTokens(value).length)return false;}
                else if(value!==''){
                    const split=/^[ \t]*/.exec(field.value)[0].length;
                    changes.push({start:field.start+split,end:field.start+split,text:value});
                }
            }else{if(!target||!profileAccepts(box.profile,target))return false;additions.push([target,value]);}
            return true;
        };
        if(!dest(['imagem_alt','alt'],'imagem_alt',parsed.alt)||!dest(contract.size,contract.sizeTarget,parsed.size)||!dest(contract.caption,contract.captionTarget,parsed.caption))return plan;
        changes.push({start:image.start,end:image.end,text:parsed.leading+parsed.filename+parsed.trailing});
        const changedFields=changes.length+additions.length;
        if(additions.length){
            const newline=box.raw.includes('\r\n')?'\r\n':'\n',multiline=box.raw.includes('\n'),text=additions.map(([key,value])=>'|'+(multiline?' ':'')+key+(multiline?' = ':'=')+value+(multiline?newline:'')).join('');
            changes.push({start:box.raw.length-2,end:box.raw.length-2,text});
        }
        const sorted=changes.slice().sort((a,b)=>a.start-b.start||a.end-b.end);if(sorted.some((edit,index)=>index&&edit.start<sorted[index-1].end))return plan;
        const raw=v24SyntaxApply(box.raw,changes),changeRules=Array(changedFields).fill('biographyImageAlt');
        const edit={start:box.node.start,end:box.node.end,text:raw,ruleId:'biographyImageAlt',proof:{sourceHash:plan.sourceHash,template:box.name,raw:box.raw,parsed,edits:changes,changeRules,
            conditions:['one complete native principal person infobox','pinned native ALT destination','all source and destination fields accepted',
                'one explicit ALT option and finite understood image options','no existing field conflict','literal filename caption ALT and reference contents preserved']}};
        return {...plan,text:v24SyntaxApply(source,[edit]),edits:[edit]};
    }

    function v2213BlankDisplayAlias(profile,a,b) {
        return v2213BiographyProfile(profile)&&(!a.value.trim()||!b.value.trim())&&Object.values(V2151_FIELD_DISPLAY_GROUPS[profile.oldid]||{}).some(keys=>keys.includes(a.key)&&keys.includes(b.key));
    }

    function infobox(raw,bump,warn,cfg={}){if(v2151NativeBiographySourceConflict(raw))return raw;if(!v215LiteralTemplateIdentity(raw))return raw;const p=parsedTemplate(raw),profile=INFOBOX_CATALOG[p.name];if(!profile){if(p.name==='info/pessoa')warn('Info/Pessoa não existia em '+CATALOG_DATE+'. Confira a infocaixa adequada antes de substituir.');else if(p.name.startsWith('info/'))warn('Infocaixa fora do catálogo local: '+p.parts[0].trim()+'. Seus parâmetros foram preservados.');return raw;}if(profile.obsolete)warn('Infocaixa obsoleta '+profile.title+': '+profile.obsolete+'. Os dados foram preservados para revisão.');const parts=p.parts.slice(),entries=[],accepted=new Set(profile.accepted);for(let i=1;i<parts.length;i++){const m=parts[i].match(/^(\s*)([^=\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/);if(m&& /^[\p{L}\d _/()-]+$/u.test(m[2].trim()))entries.push({i,original:m[2].trim(),key:m[2].trim(),value:m[4],before:m});}for(const entry of entries){let target=profile.renames&&profile.renames[entry.key],value=entry.value;if(accepted.has(entry.key))target=null;if(p.name==='info/filme'&&entry.key==='runtime'){const m=value.trim().match(/^(\d+)(?:\s*(?:minutes|minutos|min\.?))?$/i);if(m){target='duração';value=m[1];}else warn('runtime em Info/Filme requer revisão de unidade. O valor foi preservado.');}if(p.name==='info/assentamento'&&entry.key==='coord_escala'){if(/^[1-9]\d*$/.test(value.trim())){target='coord_sufixo';value='scale:'+value.trim();}else warn('coord_escala em Info/Assentamento não é um inteiro positivo. O valor foi preservado.');}if(target&&accepted.has(target)&&cfg.automaticParameterNames!==false&&!v2213AliasRenameBlocked(profile,entries,entry.key,target)){const existing=entries.find(e=>e!==entry&&e.key===target);if(existing&&existing.value.trim()!==value.trim()){warn('Infocaixa '+profile.title+': '+entry.key+' conflita com '+target+'. Ambos foram preservados.',{confirmed:true,family:'template-field:'+p.name+':'+target,kind:'field-conflict'});}else if(existing&&cfg.automaticParameterDuplicates!==false){parts[entry.i]=null;entry.deleted=true;bump('infoboxDuplicates');}else{entry.key=target;entry.value=value;parts[entry.i]=entry.before[1]+target+entry.before[3]+value;bump('infoboxParameters');}}}const groups=new Map();for(const entry of entries.filter(e=> !e.deleted)){const family=profile.aliases&&profile.aliases[entry.key]||entry.key;if(!groups.has(family))groups.set(family,entry);else{const before=groups.get(family);if(before.value.trim()===entry.value.trim()){if(cfg.automaticParameterDuplicates!==false){parts[entry.i]=null;entry.deleted=true;bump('infoboxDuplicates');}}else if(!v2213BlankDisplayAlias(profile,before,entry))warn('Infocaixa '+profile.title+': valores diferentes em '+before.key+' / '+entry.key+'. Confira manualmente.',{confirmed:true,family:'template-field:'+p.name+':'+family,kind:'field-conflict'});}if(!infoboxAccepts(profile,entry.key)&& !profile.partial){let hint=profile.report&&profile.report[entry.key];if(!hint){const candidates=profile.accepted.filter(k=>norm(k)===norm(entry.key));if(candidates.length===1)hint='Confira se o nome pretendido é '+candidates[0]+'.';}warn('Infocaixa '+profile.title+': parâmetro não reconhecido no catálogo, "'+entry.key+'".'+(hint?' '+hint:' Valor preservado.'));}else if(profile.ignored&&profile.ignored.includes(entry.key)){warn('Infocaixa '+profile.title+': "'+entry.key+'" é aceito pelo verificador, mas não é lido na exibição atual. Valor preservado.');}}return'{{'+parts.filter(x=>x!==null).join('|')+'}}';}
