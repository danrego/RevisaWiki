    // Native-consumer contracts only. A recognised spelling is not a reason to
    // rename it, and an unknown spelling is never permission to delete its value.
    const V221_CITATION_CONSUMERS=Object.freeze({
        'Citar web':'web','Citar livro':'book','Citar jornal':'news','Citar notícia':'news',
        'Citar periódico':'journal','Citar revista':'magazine','Citar enciclopédia':'encyclopedia',
        'Citar conferência':'conference','Citar mapa':'map','Citar episódio':'episode',
        'Citar lista de discussão':'mailing','Citar jogo eletrônico':'game',
        'Citar tweet':'tweet','Citar patente':'patent'
    });
    const V221_CITATION_NATIVE_CONTRACT=Object.freeze({
        cs1Configuration:73016847,cs1Whitelist:71860752,tweet:69618888,patent:49050208,
        gameModule:49700086,convert:70491993,convertModule:72018796
    });
    const V221_CITATION_ACCESS_TYPOS=Object.freeze(['data-acesso','consultadoem','acessodadata','acessodate']);
    const V221_CITATION_EXTRA_FIELDS=Object.freeze({
        'Citar jogo eletrônico':['distribuidora','publicadora','platform','plataforma','versão','version','fase','nível','level','cena','scene','isolang','desenvolvedor','developer','produtor','desenvolvedora'],
        'Citar lista de discussão':['lista','lista-correio','lista-discussão','mailinglist','mailing-list'],
        'Citar episódio':['episódio','episodio','episode','início','began','fim','ended','seriesno'],
        'Citar periódico':['aspas','mes','mês'],
        'Citar mapa':['folha','folhas','sheet','sheets','mapa','map','formato-mapa','map-format','mapurl','map-url','urlmapa','trans-map','mapa-trad','cartografia','cartography'],
        'Convert':['sp','abbr','adj','lk','disp','spell','frac','sigfig','order','♥']
    });
    function v221CitationScope(source,cfg={}) {
        return typeof source==='string'&&source.length<=4194304&&(cfg.namespaceNumber===undefined||cfg.namespaceNumber===0)&&
            !cfg.sectionOnly&&!cfg.discussionPage&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&(!cfg.model||cfg.model==='wikitext');
    }
    function v221CitationSourceContext(source) {
        const shield=v24SyntaxProtected(source),view=protectedView(source);
        return {view,parsed:templates(view),unclosed:shield.unclosed,literals:[...shield.ranges,...v219MarkdownLiteralRanges(source),
            ...v219QuotedTemplateRanges(source),...v219WholeQuotedCodeRanges(source),...structuralQuoteRanges(source)]};
    }
    function v221CitationSourceOwner(source,node,context) {
        // Reuse the established source-owner contract: a complete literal ref
        // or native table cell may contain a citation, but an enclosing
        // template, link, quoted example or unproved HTML owner may not.
        return v220CitationKeyOwner(source,context.view,node,context.literals);
    }
    function v221CitationLiteral(value,limit=4096) {
        return typeof value==='string'&&value.trim().length>0&&value.length<=limit&&!/[{}<>\u0000-\u0008\u000b\u000c\u000e-\u001f\uE000-\uF8FF]/.test(value);
    }
    function v221CitationScalar(value,limit=4096) {return v221CitationLiteral(value,limit)&&!/[\[\]|\r\n]/.test(value);}
    function v221CitationPadded(value,replacement) {const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(value);return m[1]+replacement+m[3];}
    function v221CitationDate(value) {const date=v221CitationScalar(value,100)&&strictDate(value.trim());return date?.valid?date:null;}
    function v221CitationURL(value) {
        if(!v221CitationScalar(value,8192)||!/^[ \t]*https?:\/\/[^\s{}<>|]+[ \t]*$/.test(value))return null;
        try{const url=new URL(value.trim());return url.username||url.password||!url.hostname?null:url;}catch(_){return null;}
    }
    function v221CitationRole(field,role,index=null) {
        return v219NativeCitationRoles(field.key).some(actual=>actual===role||index!==null&&actual===role+':'+index);
    }
    function v221CitationRoleFields(fields,role) {return fields.filter(field=>!field.positional&&v219NativeCitationRoles(field.key).some(actual=>actual===role||actual.startsWith(role+':')));}
    function v221CitationConsumer(raw) {
        const literalTitle=v220CitationTitle(raw),alias=Object.hasOwn(V221_CITATION_CONSUMERS,literalTitle||'')?null:
            v219LocalCitationRedirectProfile(raw),title=alias?.target||literalTitle;
        if(!Object.hasOwn(V221_CITATION_CONSUMERS,title||''))return null;
        if(title!==literalTitle&&(!alias||alias.target!==title||!alias.nativeAliasOldid||!alias.nativeTemplateOldid))return null;
        const fields=v220CitationFields(raw);if(!fields||fields.some(field=>field.positional))return null;
        const map=v220CitationNamedFields(fields);if(!map)return null;
        return {title,literalTitle,kind:V221_CITATION_CONSUMERS[title],fields,map};
    }
    function v221CitationNativeHeaderCall(raw,cfg={}) {
        const alias=v219LocalCitationRedirectProfile(raw);
        if(!alias||alias.kind!=='citation'||!alias.nativeAliasOldid||!alias.nativeTemplateOldid||
            !Object.hasOwn(V221_CITATION_CONSUMERS,alias.target))return null;
        const result=migrateForeignTemplate(raw,{...cfg,automaticParameterNames:false});
        if(!result||result.blocked||result.issues?.length||result.text===raw||
            result.profile?.nativeAliasOldid!==alias.nativeAliasOldid||result.profile?.nativeTemplateOldid!==alias.nativeTemplateOldid)return null;
        const before=parsedTemplate(raw),after=parsedTemplate(result.text);
        if(v220CitationTitle(result.text)!==alias.target||before.parts.length!==after.parts.length||
            JSON.stringify(before.parts.slice(1))!==JSON.stringify(after.parts.slice(1)))return null;
        return {text:result.text,header:after.parts[0],oldHeader:before.parts[0],alias};
    }
    function v221CitationHeaderPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(!v221CitationScope(source,cfg)||cfg.citations===false||cfg.citationRepairs===false||cfg.automaticParameterNames===false||
            v24SyntaxScan(source).issues.length)return empty;
        const ownerContext=v221CitationSourceContext(source),parsed=ownerContext.parsed,edits=[];
        if(ownerContext.unclosed.length||parsed.unclosed.length)return empty;
        for(const node of parsed.nodes){
            if(!v221CitationSourceOwner(source,node,ownerContext))continue;
            const raw=source.slice(node.start,node.end),header=v221CitationNativeHeaderCall(raw,cfg);if(!header)continue;
            const repair=v221CitationCall(header.text,cfg),duplicates=v221CitationEditionDuplicateCall(header.text,cfg);
            if((!repair||repair.text===header.text)&&!duplicates.edits.length)continue;
            edits.push({start:node.start+2,end:node.start+2+header.oldHeader.length,text:header.header,ruleId:'translatedTemplates',
                label:'Cabeçalho nativo conferido',proof:{sourceHash:empty.sourceHash,nativeAliasOldid:header.alias.nativeAliasOldid,
                    nativeTemplateOldid:header.alias.nativeTemplateOldid,target:header.alias.target,
                    argumentsHash:v24SyntaxHash(JSON.stringify(parsedTemplate(raw).parts.slice(1))),
                    condition:'existing pinned local redirect producer; exact header-only endpoint; every argument byte retained; independently qualified new repair is reachable'}});
        }
        return {...empty,text:v24SyntaxApply(source,edits),edits};
    }
    function v221CitationHeaderProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v221CitationHeaderPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v221CitationEditionIdentity(context) {
        return JSON.stringify([context.title,context.fields.filter(field=>!v221CitationRole(field,'Edition')).map(field=>{
            const roles=v219NativeCitationRoles(field.key);
            return [roles.length===1?roles[0]:'literal:'+field.key,field.value];
        })]);
    }
    function v221CitationEditionDuplicateCall(raw,cfg={}) {
        const empty={text:raw,edits:[]};
        if(!v212ReferenceFieldScope(cfg)||cfg.citations===false||cfg.citationRepairs===false||cfg.automaticParameterDuplicates===false)return empty;
        const parsed=v212LiteralCitationFields(raw);if(!parsed)return empty;
        const editions=parsed.fields.filter(field=>v221CitationRole(field,'Edition'));
        const nativeValue=value=>value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
        if(editions.length<2||editions.some(field=>nativeValue(field.value)!==nativeValue(editions[0].value))||
            !/^[1-9]\d{0,2}(?:\.[ªº]|[ªº])\s+ed\.$/.test(editions[0].value.trim()))return empty;
        const supplied=v212CitationAliasCall(raw,cfg),edits=supplied.changes.filter(edit=>edit.ruleId==='v212CitationAliases'&&
            edit.family==='Edition'&&edit.text===''&&editions.some(field=>field.start===edit.start&&field.end===edit.end));
        if(edits.length!==editions.length-1)return empty;
        const text=v24SyntaxApply(raw,edits),after=v221CitationConsumer(text);
        if(!after||v221CitationRoleFields(after.fields,'Edition').length!==1||
            v221CitationRoleFields(after.fields,'Edition')[0].value!==editions[0].value)return empty;
        return {text,edits,originalEditionFields:editions};
    }
    function v221CitationEditionAliasPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(!v221CitationScope(source,cfg)||!v212ReferenceFieldScope(cfg)||v24SyntaxScan(source).issues.length)return empty;
        const ownerContext=v221CitationSourceContext(source),nodes=ownerContext.parsed,edits=[];
        if(ownerContext.unclosed.length||nodes.unclosed.length)return empty;
        for(const node of nodes.nodes){
            if(!v221CitationSourceOwner(source,node,ownerContext))continue;
            const raw=source.slice(node.start,node.end),call=v221CitationEditionDuplicateCall(raw,cfg);
            if(!call.edits.length)continue;
            for(const change of call.edits)edits.push({start:node.start+change.start,end:node.start+change.end,text:'',
                ruleId:'v212CitationAliases',label:'Campos equivalentes repetidos retirados',
                proof:{sourceHash:empty.sourceHash,before:raw,after:call.text,fieldFamily:'Edition',
                    exactOriginalValues:call.originalEditionFields.map(field=>[field.key,field.value]),
                    condition:'existing native producer; duplicate literal Edition values equal after native named-argument ASCII boundary trimming; exact retained value and every non-Edition byte unchanged'}});
        }
        return {...empty,text:v24SyntaxApply(source,edits),edits};
    }
    function v221CitationEditionAliasProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v221CitationEditionAliasPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v221CitationEditionBindings(source,original,cfg={}) {
        const read=value=>{
            const result=new Map(),ownerContext=v221CitationSourceContext(value),parsed=ownerContext.parsed;
            if(parsed.unclosed.length||v24SyntaxScan(value).issues.length)return result;
            for(const node of parsed.nodes){
                if(!v221CitationSourceOwner(value,node,ownerContext))continue;
                const raw=value.slice(node.start,node.end),header=v219LocalCitationRedirectProfile(raw)?v221CitationNativeHeaderCall(raw,cfg):null,
                    duplicate=v221CitationEditionDuplicateCall(header?.text||raw,cfg),
                    context=v221CitationConsumer(raw)||(duplicate.edits.length?v221CitationConsumer(duplicate.text):null);
                if(!context)continue;
                const key=v221CitationEditionIdentity(context),entries=result.get(key)||[];
                entries.push({...context,qualifiedEditionDuplicates:duplicate.edits.length>0,
                    originalEditionFields:duplicate.originalEditionFields??null});result.set(key,entries);
            }
            return result;
        };
        const current=read(source);return {original:source===original?current:read(original),current};
    }
    function v221CitationEditionAllowed(context,field,bindings) {
        if(!bindings)return true;
        const key=v221CitationEditionIdentity(context),original=bindings.original.get(key),current=bindings.current.get(key);
        if(!original?.length||!current?.length)return false;
        const nativeValue=value=>value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,''),value=nativeValue(field.value);
        const values=[];
        if(!original.every(owner=>{
            const editions=owner.qualifiedEditionDuplicates?owner.originalEditionFields:v221CitationRoleFields(owner.fields,'Edition');
            if(!editions.length||!owner.qualifiedEditionDuplicates&&editions.length!==1)return false;
            const selected=nativeValue(editions[0].value);
            if(!editions.every(old=>nativeValue(old.value)===selected))return false;
            values.push(selected);return true;
        }))return false;
        return values.includes(value)&&current.every(owner=>{
            const editions=v221CitationRoleFields(owner.fields,'Edition');
            return editions.length===1&&values.includes(nativeValue(editions[0].value));
        });
    }
    function v221CitationArchivePair(context,ignoredURL=null,ignoredDate=null) {
        if(context.kind==='tweet'){
            const users=context.fields.filter(f=>['user','usuario','usuário','utilizador'].includes(f.key)),
                numbers=context.fields.filter(f=>['number','número','numero'].includes(f.key));
            if(users.length!==1||numbers.length!==1||!/^\w{1,15}$/.test(users[0].value.trim())||!/^\d+$/.test(numbers[0].value.trim()))return null;
            const generated='https://twitter.com/'+users[0].value.trim()+'/status/'+numbers[0].value.trim(),
                supplied=context.fields.filter(f=>v221CitationRole(f,'URL'));
            if(supplied.length>1||supplied.length===1&&supplied[0].value.trim()!==generated)return null;
            if(!supplied.length)context={...context,fields:[...context.fields,{key:'url',value:generated}]};
        }
        const urls=context.fields.filter(field=>v221CitationRole(field,'ArchiveURL')||field===ignoredURL),
            dates=context.fields.filter(field=>v221CitationRole(field,'ArchiveDate')||field===ignoredDate),
            originals=v221CitationRoleFields(context.fields,'URL');
        if(urls.length!==1||dates.length!==1||originals.length!==1)return null;
        const archive=v221CitationURL(urls[0].value),original=v221CitationURL(originals[0].value),date=v221CitationDate(dates[0].value);
        if(!archive||!original||!date||archive.hostname.toLowerCase()!=='web.archive.org')return null;
        const match=/^\/web\/(\d{4})(\d{2})(\d{2})\d{0,6}(?:[a-z_]+)?\/(https?:\/\/[\s\S]+)$/.exec(archive.pathname+archive.search+archive.hash);
        if(!match||Number(match[1])!==date.year||Number(match[2])!==date.month||Number(match[3])!==date.day||match[4]!==originals[0].value.trim())return null;
        return {url:urls[0],date:dates[0],original:originals[0]};
    }
    function v221CitationImportedAuthorLink(key,kind) {
        if(kind==='tweet')return ['link-autor','linkautor','autor-link'].includes(key)?{index:1,target:'autorlink'}:null;
        const match=/^(?:link-autor|linkautor)([1-9]\d?)?$/.exec(key);
        return match?{index:Number(match[1]||1),target:'autorlink'+(match[1]||'')}:null;
    }
    function v221CitationImportedEditor(key) {
        const match=/^(?:(ultimo-editor|último-editor|primeiro-editor|editor-último|editor-ultimo)([1-9]\d?)?|editor([1-9]\d?)-(ultimo|último))$/.exec(key);
        if(!match)return null;
        const index=match[2]||match[3]||'',first=match[1]==='primeiro-editor';
        return {index:Number(index||1),first,role:first?'EditorList-First':'EditorList-Last',
            target:(first?'editor-nome':'editor-sobrenome')+index};
    }
    function v221CitationEditorRole(key) {
        if(typeof key!=='string')return null;
        const literal=norm(key),imported=v221CitationImportedEditor(literal);if(imported)return imported;
        const roles=v219NativeCitationRoles(literal).filter(role=>/^EditorList-(?:First|Last):[1-9]\d*$/.test(role));
        if(roles.length!==1)return null;
        const match=/^(EditorList-(First|Last)):([1-9]\d*)$/.exec(roles[0]);
        return {role:match[1],index:Number(match[3]),first:match[2]==='First'};
    }
    function v221CitationEditorAliases(role,index) {
        const suffixes=index===1?['','1']:[String(index)],keys=[];
        for(const alias of V219_NATIVE_CS1_ALIAS_ROLES[role]||[])
            for(const suffix of suffixes)keys.push(alias.includes('#')?alias.replace('#',suffix):alias);
        for(const suffix of suffixes)for(const stem of role==='EditorList-First'?['primeiro-editor']:
            ['ultimo-editor','último-editor','editor-último','editor-ultimo'])keys.push(stem+suffix);
        if(role==='EditorList-Last')for(const ending of ['ultimo','último'])
            for(const suffix of suffixes)keys.push('editor'+suffix+'-'+ending);
        return keys;
    }
    function v221CitationEditorCollision(raw,key,target=key) {
        const descriptor=v221CitationEditorRole(key)||v221CitationEditorRole(target);
        if(!descriptor)return false;
        const fields=v220CitationFields(raw);if(!fields)return true;
        return fields.filter(field=>{
            const candidate=v221CitationEditorRole(field.key);
            return candidate?.role===descriptor.role&&candidate.index===descriptor.index;
        }).length>1;
    }
    function v221CitationSameEditorRole(left,right) {
        const a=v221CitationEditorRole(left),b=v221CitationEditorRole(right);
        return !!a&&!!b&&a.role===b.role&&a.index===b.index;
    }
    function v221CitationStateFields(context) {
        return context.fields.filter(field=>['url-status','url-estado','statusurl','urlmorto','urlmorta','dead-url','deadurl',
            'datali','li','ligação inativa','ligação inactiva'].includes(field.key)||v221CitationRole(field,'DeadURL'));
    }
    const V221_NATIVE_TITLECASE_MAP=Object.freeze({"a":"A","b":"B","c":"C","d":"D","e":"E","f":"F","g":"G","h":"H","i":"I","j":"J","k":"K","l":"L","m":"M","n":"N","o":"O","p":"P","q":"Q","r":"R","s":"S","t":"T","u":"U","v":"V","w":"W","x":"X","y":"Y","z":"Z","µ":"Μ","ß":"Ss","à":"À","á":"Á","â":"Â","ã":"Ã","ä":"Ä","å":"Å","æ":"Æ","ç":"Ç","è":"È","é":"É","ê":"Ê","ë":"Ë","ì":"Ì","í":"Í","î":"Î","ï":"Ï","ð":"Ð","ñ":"Ñ","ò":"Ò","ó":"Ó","ô":"Ô","õ":"Õ","ö":"Ö","ø":"Ø","ù":"Ù","ú":"Ú","û":"Û","ü":"Ü","ý":"Ý","þ":"Þ","ÿ":"Ÿ","ā":"Ā","ă":"Ă","ą":"Ą","ć":"Ć","ĉ":"Ĉ","ċ":"Ċ","č":"Č","ď":"Ď","đ":"Đ","ē":"Ē","ĕ":"Ĕ","ė":"Ė","ę":"Ę","ě":"Ě","ĝ":"Ĝ","ğ":"Ğ","ġ":"Ġ","ģ":"Ģ","ĥ":"Ĥ","ħ":"Ħ","ĩ":"Ĩ","ī":"Ī","ĭ":"Ĭ","į":"Į","ı":"I","ĳ":"Ĳ","ĵ":"Ĵ","ķ":"Ķ","ĺ":"Ĺ","ļ":"Ļ","ľ":"Ľ","ŀ":"Ŀ","ł":"Ł","ń":"Ń","ņ":"Ņ","ň":"Ň","ŉ":"ʼN","ŋ":"Ŋ","ō":"Ō","ŏ":"Ŏ","ő":"Ő","œ":"Œ","ŕ":"Ŕ","ŗ":"Ŗ","ř":"Ř","ś":"Ś","ŝ":"Ŝ","ş":"Ş","š":"Š","ţ":"Ţ","ť":"Ť","ŧ":"Ŧ","ũ":"Ũ","ū":"Ū","ŭ":"Ŭ","ů":"Ů","ű":"Ű","ų":"Ų","ŵ":"Ŵ","ŷ":"Ŷ","ź":"Ź","ż":"Ż","ž":"Ž","ſ":"S","ƀ":"Ƀ","ƃ":"Ƃ","ƅ":"Ƅ","ƈ":"Ƈ","ƌ":"Ƌ","ƒ":"Ƒ","ƕ":"Ƕ","ƙ":"Ƙ","ƚ":"Ƚ","ƛ":"Ƛ","ƞ":"Ƞ","ơ":"Ơ","ƣ":"Ƣ","ƥ":"Ƥ","ƨ":"Ƨ","ƭ":"Ƭ","ư":"Ư","ƴ":"Ƴ","ƶ":"Ƶ","ƹ":"Ƹ","ƽ":"Ƽ","ƿ":"Ƿ","Ǆ":"ǅ","ǆ":"ǅ","Ǉ":"ǈ","ǉ":"ǈ","Ǌ":"ǋ","ǌ":"ǋ","ǎ":"Ǎ","ǐ":"Ǐ","ǒ":"Ǒ","ǔ":"Ǔ","ǖ":"Ǖ","ǘ":"Ǘ","ǚ":"Ǚ","ǜ":"Ǜ","ǝ":"Ǝ","ǟ":"Ǟ","ǡ":"Ǡ","ǣ":"Ǣ","ǥ":"Ǥ","ǧ":"Ǧ","ǩ":"Ǩ","ǫ":"Ǫ","ǭ":"Ǭ","ǯ":"Ǯ","ǰ":"J̌","Ǳ":"ǲ","ǳ":"ǲ","ǵ":"Ǵ","ǹ":"Ǹ","ǻ":"Ǻ","ǽ":"Ǽ","ǿ":"Ǿ","ȁ":"Ȁ","ȃ":"Ȃ","ȅ":"Ȅ","ȇ":"Ȇ","ȉ":"Ȉ","ȋ":"Ȋ","ȍ":"Ȍ","ȏ":"Ȏ","ȑ":"Ȑ","ȓ":"Ȓ","ȕ":"Ȕ","ȗ":"Ȗ","ș":"Ș","ț":"Ț","ȝ":"Ȝ","ȟ":"Ȟ","ȣ":"Ȣ","ȥ":"Ȥ","ȧ":"Ȧ","ȩ":"Ȩ","ȫ":"Ȫ","ȭ":"Ȭ","ȯ":"Ȯ","ȱ":"Ȱ","ȳ":"Ȳ","ȼ":"Ȼ","ȿ":"Ȿ","ɀ":"Ɀ","ɂ":"Ɂ","ɇ":"Ɇ","ɉ":"Ɉ","ɋ":"Ɋ","ɍ":"Ɍ","ɏ":"Ɏ","ɐ":"Ɐ","ɑ":"Ɑ","ɒ":"Ɒ","ɓ":"Ɓ","ɔ":"Ɔ","ɖ":"Ɖ","ɗ":"Ɗ","ə":"Ə","ɛ":"Ɛ","ɜ":"Ɜ","ɠ":"Ɠ","ɡ":"Ɡ","ɣ":"Ɣ","ɤ":"Ɤ","ɥ":"Ɥ","ɦ":"Ɦ","ɨ":"Ɨ","ɩ":"Ɩ","ɪ":"Ɪ","ɫ":"Ɫ","ɬ":"Ɬ","ɯ":"Ɯ","ɱ":"Ɱ","ɲ":"Ɲ","ɵ":"Ɵ","ɽ":"Ɽ","ʀ":"Ʀ","ʂ":"Ʂ","ʃ":"Ʃ","ʇ":"Ʇ","ʈ":"Ʈ","ʉ":"Ʉ","ʊ":"Ʊ","ʋ":"Ʋ","ʌ":"Ʌ","ʒ":"Ʒ","ʝ":"Ʝ","ʞ":"Ʞ","ͅ":"Ι","ͱ":"Ͱ","ͳ":"Ͳ","ͷ":"Ͷ","ͻ":"Ͻ","ͼ":"Ͼ","ͽ":"Ͽ","ΐ":"Ϊ́","ά":"Ά","έ":"Έ","ή":"Ή","ί":"Ί","ΰ":"Ϋ́","α":"Α","β":"Β","γ":"Γ","δ":"Δ","ε":"Ε","ζ":"Ζ","η":"Η","θ":"Θ","ι":"Ι","κ":"Κ","λ":"Λ","μ":"Μ","ν":"Ν","ξ":"Ξ","ο":"Ο","π":"Π","ρ":"Ρ","ς":"Σ","σ":"Σ","τ":"Τ","υ":"Υ","φ":"Φ","χ":"Χ","ψ":"Ψ","ω":"Ω","ϊ":"Ϊ","ϋ":"Ϋ","ό":"Ό","ύ":"Ύ","ώ":"Ώ","ϐ":"Β","ϑ":"Θ","ϕ":"Φ","ϖ":"Π","ϗ":"Ϗ","ϙ":"Ϙ","ϛ":"Ϛ","ϝ":"Ϝ","ϟ":"Ϟ","ϡ":"Ϡ","ϣ":"Ϣ","ϥ":"Ϥ","ϧ":"Ϧ","ϩ":"Ϩ","ϫ":"Ϫ","ϭ":"Ϭ","ϯ":"Ϯ","ϰ":"Κ","ϱ":"Ρ","ϲ":"Ϲ","ϳ":"Ϳ","ϵ":"Ε","ϸ":"Ϸ","ϻ":"Ϻ","а":"А","б":"Б","в":"В","г":"Г","д":"Д","е":"Е","ж":"Ж","з":"З","и":"И","й":"Й","к":"К","л":"Л","м":"М","н":"Н","о":"О","п":"П","р":"Р","с":"С","т":"Т","у":"У","ф":"Ф","х":"Х","ц":"Ц","ч":"Ч","ш":"Ш","щ":"Щ","ъ":"Ъ","ы":"Ы","ь":"Ь","э":"Э","ю":"Ю","я":"Я","ѐ":"Ѐ","ё":"Ё","ђ":"Ђ","ѓ":"Ѓ","є":"Є","ѕ":"Ѕ","і":"І","ї":"Ї","ј":"Ј","љ":"Љ","њ":"Њ","ћ":"Ћ","ќ":"Ќ","ѝ":"Ѝ","ў":"Ў","џ":"Џ","ѡ":"Ѡ","ѣ":"Ѣ","ѥ":"Ѥ","ѧ":"Ѧ","ѩ":"Ѩ","ѫ":"Ѫ","ѭ":"Ѭ","ѯ":"Ѯ","ѱ":"Ѱ","ѳ":"Ѳ","ѵ":"Ѵ","ѷ":"Ѷ","ѹ":"Ѹ","ѻ":"Ѻ","ѽ":"Ѽ","ѿ":"Ѿ","ҁ":"Ҁ","ҋ":"Ҋ","ҍ":"Ҍ","ҏ":"Ҏ","ґ":"Ґ","ғ":"Ғ","ҕ":"Ҕ","җ":"Җ","ҙ":"Ҙ","қ":"Қ","ҝ":"Ҝ","ҟ":"Ҟ","ҡ":"Ҡ","ң":"Ң","ҥ":"Ҥ","ҧ":"Ҧ","ҩ":"Ҩ","ҫ":"Ҫ","ҭ":"Ҭ","ү":"Ү","ұ":"Ұ","ҳ":"Ҳ","ҵ":"Ҵ","ҷ":"Ҷ","ҹ":"Ҹ","һ":"Һ","ҽ":"Ҽ","ҿ":"Ҿ","ӂ":"Ӂ","ӄ":"Ӄ","ӆ":"Ӆ","ӈ":"Ӈ","ӊ":"Ӊ","ӌ":"Ӌ","ӎ":"Ӎ","ӏ":"Ӏ","ӑ":"Ӑ","ӓ":"Ӓ","ӕ":"Ӕ","ӗ":"Ӗ","ә":"Ә","ӛ":"Ӛ","ӝ":"Ӝ","ӟ":"Ӟ","ӡ":"Ӡ","ӣ":"Ӣ","ӥ":"Ӥ","ӧ":"Ӧ","ө":"Ө","ӫ":"Ӫ","ӭ":"Ӭ","ӯ":"Ӯ","ӱ":"Ӱ","ӳ":"Ӳ","ӵ":"Ӵ","ӷ":"Ӷ","ӹ":"Ӹ","ӻ":"Ӻ","ӽ":"Ӽ","ӿ":"Ӿ","ԁ":"Ԁ","ԃ":"Ԃ","ԅ":"Ԅ","ԇ":"Ԇ","ԉ":"Ԉ","ԋ":"Ԋ","ԍ":"Ԍ","ԏ":"Ԏ","ԑ":"Ԑ","ԓ":"Ԓ","ԕ":"Ԕ","ԗ":"Ԗ","ԙ":"Ԙ","ԛ":"Ԛ","ԝ":"Ԝ","ԟ":"Ԟ","ԡ":"Ԡ","ԣ":"Ԣ","ԥ":"Ԥ","ԧ":"Ԧ","ԩ":"Ԩ","ԫ":"Ԫ","ԭ":"Ԭ","ԯ":"Ԯ","ա":"Ա","բ":"Բ","գ":"Գ","դ":"Դ","ե":"Ե","զ":"Զ","է":"Է","ը":"Ը","թ":"Թ","ժ":"Ժ","ի":"Ի","լ":"Լ","խ":"Խ","ծ":"Ծ","կ":"Կ","հ":"Հ","ձ":"Ձ","ղ":"Ղ","ճ":"Ճ","մ":"Մ","յ":"Յ","ն":"Ն","շ":"Շ","ո":"Ո","չ":"Չ","պ":"Պ","ջ":"Ջ","ռ":"Ռ","ս":"Ս","վ":"Վ","տ":"Տ","ր":"Ր","ց":"Ց","ւ":"Ւ","փ":"Փ","ք":"Ք","օ":"Օ","ֆ":"Ֆ","և":"Եւ","ᏸ":"Ᏸ","ᏹ":"Ᏹ","ᏺ":"Ᏺ","ᏻ":"Ᏻ","ᏼ":"Ᏼ","ᏽ":"Ᏽ","ᲀ":"В","ᲁ":"Д","ᲂ":"О","ᲃ":"С","ᲄ":"Т","ᲅ":"Т","ᲆ":"Ъ","ᲇ":"Ѣ","ᲈ":"Ꙋ","ᲊ":"Ᲊ","ᵹ":"Ᵹ","ᵽ":"Ᵽ","ᶎ":"Ᶎ","ḁ":"Ḁ","ḃ":"Ḃ","ḅ":"Ḅ","ḇ":"Ḇ","ḉ":"Ḉ","ḋ":"Ḋ","ḍ":"Ḍ","ḏ":"Ḏ","ḑ":"Ḑ","ḓ":"Ḓ","ḕ":"Ḕ","ḗ":"Ḗ","ḙ":"Ḙ","ḛ":"Ḛ","ḝ":"Ḝ","ḟ":"Ḟ","ḡ":"Ḡ","ḣ":"Ḣ","ḥ":"Ḥ","ḧ":"Ḧ","ḩ":"Ḩ","ḫ":"Ḫ","ḭ":"Ḭ","ḯ":"Ḯ","ḱ":"Ḱ","ḳ":"Ḳ","ḵ":"Ḵ","ḷ":"Ḷ","ḹ":"Ḹ","ḻ":"Ḻ","ḽ":"Ḽ","ḿ":"Ḿ","ṁ":"Ṁ","ṃ":"Ṃ","ṅ":"Ṅ","ṇ":"Ṇ","ṉ":"Ṉ","ṋ":"Ṋ","ṍ":"Ṍ","ṏ":"Ṏ","ṑ":"Ṑ","ṓ":"Ṓ","ṕ":"Ṕ","ṗ":"Ṗ","ṙ":"Ṙ","ṛ":"Ṛ","ṝ":"Ṝ","ṟ":"Ṟ","ṡ":"Ṡ","ṣ":"Ṣ","ṥ":"Ṥ","ṧ":"Ṧ","ṩ":"Ṩ","ṫ":"Ṫ","ṭ":"Ṭ","ṯ":"Ṯ","ṱ":"Ṱ","ṳ":"Ṳ","ṵ":"Ṵ","ṷ":"Ṷ","ṹ":"Ṹ","ṻ":"Ṻ","ṽ":"Ṽ","ṿ":"Ṿ","ẁ":"Ẁ","ẃ":"Ẃ","ẅ":"Ẅ","ẇ":"Ẇ","ẉ":"Ẉ","ẋ":"Ẋ","ẍ":"Ẍ","ẏ":"Ẏ","ẑ":"Ẑ","ẓ":"Ẓ","ẕ":"Ẕ","ẖ":"H̱","ẗ":"T̈","ẘ":"W̊","ẙ":"Y̊","ẚ":"Aʾ","ẛ":"Ṡ","ạ":"Ạ","ả":"Ả","ấ":"Ấ","ầ":"Ầ","ẩ":"Ẩ","ẫ":"Ẫ","ậ":"Ậ","ắ":"Ắ","ằ":"Ằ","ẳ":"Ẳ","ẵ":"Ẵ","ặ":"Ặ","ẹ":"Ẹ","ẻ":"Ẻ","ẽ":"Ẽ","ế":"Ế","ề":"Ề","ể":"Ể","ễ":"Ễ","ệ":"Ệ","ỉ":"Ỉ","ị":"Ị","ọ":"Ọ","ỏ":"Ỏ","ố":"Ố","ồ":"Ồ","ổ":"Ổ","ỗ":"Ỗ","ộ":"Ộ","ớ":"Ớ","ờ":"Ờ","ở":"Ở","ỡ":"Ỡ","ợ":"Ợ","ụ":"Ụ","ủ":"Ủ","ứ":"Ứ","ừ":"Ừ","ử":"Ử","ữ":"Ữ","ự":"Ự","ỳ":"Ỳ","ỵ":"Ỵ","ỷ":"Ỷ","ỹ":"Ỹ","ỻ":"Ỻ","ỽ":"Ỽ","ỿ":"Ỿ","ἀ":"Ἀ","ἁ":"Ἁ","ἂ":"Ἂ","ἃ":"Ἃ","ἄ":"Ἄ","ἅ":"Ἅ","ἆ":"Ἆ","ἇ":"Ἇ","ἐ":"Ἐ","ἑ":"Ἑ","ἒ":"Ἒ","ἓ":"Ἓ","ἔ":"Ἔ","ἕ":"Ἕ","ἠ":"Ἠ","ἡ":"Ἡ","ἢ":"Ἢ","ἣ":"Ἣ","ἤ":"Ἤ","ἥ":"Ἥ","ἦ":"Ἦ","ἧ":"Ἧ","ἰ":"Ἰ","ἱ":"Ἱ","ἲ":"Ἲ","ἳ":"Ἳ","ἴ":"Ἴ","ἵ":"Ἵ","ἶ":"Ἶ","ἷ":"Ἷ","ὀ":"Ὀ","ὁ":"Ὁ","ὂ":"Ὂ","ὃ":"Ὃ","ὄ":"Ὄ","ὅ":"Ὅ","ὐ":"Υ̓","ὑ":"Ὑ","ὒ":"Υ̓̀","ὓ":"Ὓ","ὔ":"Υ̓́","ὕ":"Ὕ","ὖ":"Υ̓͂","ὗ":"Ὗ","ὠ":"Ὠ","ὡ":"Ὡ","ὢ":"Ὢ","ὣ":"Ὣ","ὤ":"Ὤ","ὥ":"Ὥ","ὦ":"Ὦ","ὧ":"Ὧ","ὰ":"Ὰ","ά":"Ά","ὲ":"Ὲ","έ":"Έ","ὴ":"Ὴ","ή":"Ή","ὶ":"Ὶ","ί":"Ί","ὸ":"Ὸ","ό":"Ό","ὺ":"Ὺ","ύ":"Ύ","ὼ":"Ὼ","ώ":"Ώ","ᾀ":"ᾈ","ᾁ":"ᾉ","ᾂ":"ᾊ","ᾃ":"ᾋ","ᾄ":"ᾌ","ᾅ":"ᾍ","ᾆ":"ᾎ","ᾇ":"ᾏ","ᾐ":"ᾘ","ᾑ":"ᾙ","ᾒ":"ᾚ","ᾓ":"ᾛ","ᾔ":"ᾜ","ᾕ":"ᾝ","ᾖ":"ᾞ","ᾗ":"ᾟ","ᾠ":"ᾨ","ᾡ":"ᾩ","ᾢ":"ᾪ","ᾣ":"ᾫ","ᾤ":"ᾬ","ᾥ":"ᾭ","ᾦ":"ᾮ","ᾧ":"ᾯ","ᾰ":"Ᾰ","ᾱ":"Ᾱ","ᾲ":"Ὰͅ","ᾳ":"ᾼ","ᾴ":"Άͅ","ᾶ":"Α͂","ᾷ":"ᾼ͂","ι":"Ι","ῂ":"Ὴͅ","ῃ":"ῌ","ῄ":"Ήͅ","ῆ":"Η͂","ῇ":"ῌ͂","ῐ":"Ῐ","ῑ":"Ῑ","ῒ":"Ϊ̀","ΐ":"Ϊ́","ῖ":"Ι͂","ῗ":"Ϊ͂","ῠ":"Ῠ","ῡ":"Ῡ","ῢ":"Ϋ̀","ΰ":"Ϋ́","ῤ":"Ρ̓","ῥ":"Ῥ","ῦ":"Υ͂","ῧ":"Ϋ͂","ῲ":"Ὼͅ","ῳ":"ῼ","ῴ":"Ώͅ","ῶ":"Ω͂","ῷ":"ῼ͂","ⅎ":"Ⅎ","ⅰ":"Ⅰ","ⅱ":"Ⅱ","ⅲ":"Ⅲ","ⅳ":"Ⅳ","ⅴ":"Ⅴ","ⅵ":"Ⅵ","ⅶ":"Ⅶ","ⅷ":"Ⅷ","ⅸ":"Ⅸ","ⅹ":"Ⅹ","ⅺ":"Ⅺ","ⅻ":"Ⅻ","ⅼ":"Ⅼ","ⅽ":"Ⅽ","ⅾ":"Ⅾ","ⅿ":"Ⅿ","ↄ":"Ↄ","ⓐ":"Ⓐ","ⓑ":"Ⓑ","ⓒ":"Ⓒ","ⓓ":"Ⓓ","ⓔ":"Ⓔ","ⓕ":"Ⓕ","ⓖ":"Ⓖ","ⓗ":"Ⓗ","ⓘ":"Ⓘ","ⓙ":"Ⓙ","ⓚ":"Ⓚ","ⓛ":"Ⓛ","ⓜ":"Ⓜ","ⓝ":"Ⓝ","ⓞ":"Ⓞ","ⓟ":"Ⓟ","ⓠ":"Ⓠ","ⓡ":"Ⓡ","ⓢ":"Ⓢ","ⓣ":"Ⓣ","ⓤ":"Ⓤ","ⓥ":"Ⓥ","ⓦ":"Ⓦ","ⓧ":"Ⓧ","ⓨ":"Ⓨ","ⓩ":"Ⓩ","ⰰ":"Ⰰ","ⰱ":"Ⰱ","ⰲ":"Ⰲ","ⰳ":"Ⰳ","ⰴ":"Ⰴ","ⰵ":"Ⰵ","ⰶ":"Ⰶ","ⰷ":"Ⰷ","ⰸ":"Ⰸ","ⰹ":"Ⰹ","ⰺ":"Ⰺ","ⰻ":"Ⰻ","ⰼ":"Ⰼ","ⰽ":"Ⰽ","ⰾ":"Ⰾ","ⰿ":"Ⰿ","ⱀ":"Ⱀ","ⱁ":"Ⱁ","ⱂ":"Ⱂ","ⱃ":"Ⱃ","ⱄ":"Ⱄ","ⱅ":"Ⱅ","ⱆ":"Ⱆ","ⱇ":"Ⱇ","ⱈ":"Ⱈ","ⱉ":"Ⱉ","ⱊ":"Ⱊ","ⱋ":"Ⱋ","ⱌ":"Ⱌ","ⱍ":"Ⱍ","ⱎ":"Ⱎ","ⱏ":"Ⱏ","ⱐ":"Ⱐ","ⱑ":"Ⱑ","ⱒ":"Ⱒ","ⱓ":"Ⱓ","ⱔ":"Ⱔ","ⱕ":"Ⱕ","ⱖ":"Ⱖ","ⱗ":"Ⱗ","ⱘ":"Ⱘ","ⱙ":"Ⱙ","ⱚ":"Ⱚ","ⱛ":"Ⱛ","ⱜ":"Ⱜ","ⱝ":"Ⱝ","ⱞ":"Ⱞ","ⱟ":"Ⱟ","ⱡ":"Ⱡ","ⱥ":"Ⱥ","ⱦ":"Ⱦ","ⱨ":"Ⱨ","ⱪ":"Ⱪ","ⱬ":"Ⱬ","ⱳ":"Ⱳ","ⱶ":"Ⱶ","ⲁ":"Ⲁ","ⲃ":"Ⲃ","ⲅ":"Ⲅ","ⲇ":"Ⲇ","ⲉ":"Ⲉ","ⲋ":"Ⲋ","ⲍ":"Ⲍ","ⲏ":"Ⲏ","ⲑ":"Ⲑ","ⲓ":"Ⲓ","ⲕ":"Ⲕ","ⲗ":"Ⲗ","ⲙ":"Ⲙ","ⲛ":"Ⲛ","ⲝ":"Ⲝ","ⲟ":"Ⲟ","ⲡ":"Ⲡ","ⲣ":"Ⲣ","ⲥ":"Ⲥ","ⲧ":"Ⲧ","ⲩ":"Ⲩ","ⲫ":"Ⲫ","ⲭ":"Ⲭ","ⲯ":"Ⲯ","ⲱ":"Ⲱ","ⲳ":"Ⲳ","ⲵ":"Ⲵ","ⲷ":"Ⲷ","ⲹ":"Ⲹ","ⲻ":"Ⲻ","ⲽ":"Ⲽ","ⲿ":"Ⲿ","ⳁ":"Ⳁ","ⳃ":"Ⳃ","ⳅ":"Ⳅ","ⳇ":"Ⳇ","ⳉ":"Ⳉ","ⳋ":"Ⳋ","ⳍ":"Ⳍ","ⳏ":"Ⳏ","ⳑ":"Ⳑ","ⳓ":"Ⳓ","ⳕ":"Ⳕ","ⳗ":"Ⳗ","ⳙ":"Ⳙ","ⳛ":"Ⳛ","ⳝ":"Ⳝ","ⳟ":"Ⳟ","ⳡ":"Ⳡ","ⳣ":"Ⳣ","ⳬ":"Ⳬ","ⳮ":"Ⳮ","ⳳ":"Ⳳ","ⴀ":"Ⴀ","ⴁ":"Ⴁ","ⴂ":"Ⴂ","ⴃ":"Ⴃ","ⴄ":"Ⴄ","ⴅ":"Ⴅ","ⴆ":"Ⴆ","ⴇ":"Ⴇ","ⴈ":"Ⴈ","ⴉ":"Ⴉ","ⴊ":"Ⴊ","ⴋ":"Ⴋ","ⴌ":"Ⴌ","ⴍ":"Ⴍ","ⴎ":"Ⴎ","ⴏ":"Ⴏ","ⴐ":"Ⴐ","ⴑ":"Ⴑ","ⴒ":"Ⴒ","ⴓ":"Ⴓ","ⴔ":"Ⴔ","ⴕ":"Ⴕ","ⴖ":"Ⴖ","ⴗ":"Ⴗ","ⴘ":"Ⴘ","ⴙ":"Ⴙ","ⴚ":"Ⴚ","ⴛ":"Ⴛ","ⴜ":"Ⴜ","ⴝ":"Ⴝ","ⴞ":"Ⴞ","ⴟ":"Ⴟ","ⴠ":"Ⴠ","ⴡ":"Ⴡ","ⴢ":"Ⴢ","ⴣ":"Ⴣ","ⴤ":"Ⴤ","ⴥ":"Ⴥ","ⴧ":"Ⴧ","ⴭ":"Ⴭ","ꙁ":"Ꙁ","ꙃ":"Ꙃ","ꙅ":"Ꙅ","ꙇ":"Ꙇ","ꙉ":"Ꙉ","ꙋ":"Ꙋ","ꙍ":"Ꙍ","ꙏ":"Ꙏ","ꙑ":"Ꙑ","ꙓ":"Ꙓ","ꙕ":"Ꙕ","ꙗ":"Ꙗ","ꙙ":"Ꙙ","ꙛ":"Ꙛ","ꙝ":"Ꙝ","ꙟ":"Ꙟ","ꙡ":"Ꙡ","ꙣ":"Ꙣ","ꙥ":"Ꙥ","ꙧ":"Ꙧ","ꙩ":"Ꙩ","ꙫ":"Ꙫ","ꙭ":"Ꙭ","ꚁ":"Ꚁ","ꚃ":"Ꚃ","ꚅ":"Ꚅ","ꚇ":"Ꚇ","ꚉ":"Ꚉ","ꚋ":"Ꚋ","ꚍ":"Ꚍ","ꚏ":"Ꚏ","ꚑ":"Ꚑ","ꚓ":"Ꚓ","ꚕ":"Ꚕ","ꚗ":"Ꚗ","ꚙ":"Ꚙ","ꚛ":"Ꚛ","ꜣ":"Ꜣ","ꜥ":"Ꜥ","ꜧ":"Ꜧ","ꜩ":"Ꜩ","ꜫ":"Ꜫ","ꜭ":"Ꜭ","ꜯ":"Ꜯ","ꜳ":"Ꜳ","ꜵ":"Ꜵ","ꜷ":"Ꜷ","ꜹ":"Ꜹ","ꜻ":"Ꜻ","ꜽ":"Ꜽ","ꜿ":"Ꜿ","ꝁ":"Ꝁ","ꝃ":"Ꝃ","ꝅ":"Ꝅ","ꝇ":"Ꝇ","ꝉ":"Ꝉ","ꝋ":"Ꝋ","ꝍ":"Ꝍ","ꝏ":"Ꝏ","ꝑ":"Ꝑ","ꝓ":"Ꝓ","ꝕ":"Ꝕ","ꝗ":"Ꝗ","ꝙ":"Ꝙ","ꝛ":"Ꝛ","ꝝ":"Ꝝ","ꝟ":"Ꝟ","ꝡ":"Ꝡ","ꝣ":"Ꝣ","ꝥ":"Ꝥ","ꝧ":"Ꝧ","ꝩ":"Ꝩ","ꝫ":"Ꝫ","ꝭ":"Ꝭ","ꝯ":"Ꝯ","ꝺ":"Ꝺ","ꝼ":"Ꝼ","ꝿ":"Ꝿ","ꞁ":"Ꞁ","ꞃ":"Ꞃ","ꞅ":"Ꞅ","ꞇ":"Ꞇ","ꞌ":"Ꞌ","ꞑ":"Ꞑ","ꞓ":"Ꞓ","ꞔ":"Ꞔ","ꞗ":"Ꞗ","ꞙ":"Ꞙ","ꞛ":"Ꞛ","ꞝ":"Ꞝ","ꞟ":"Ꞟ","ꞡ":"Ꞡ","ꞣ":"Ꞣ","ꞥ":"Ꞥ","ꞧ":"Ꞧ","ꞩ":"Ꞩ","ꞵ":"Ꞵ","ꞷ":"Ꞷ","ꞹ":"Ꞹ","ꞻ":"Ꞻ","ꞽ":"Ꞽ","ꞿ":"Ꞿ","ꟁ":"Ꟁ","ꟃ":"Ꟃ","ꟈ":"Ꟈ","ꟊ":"Ꟊ","ꟍ":"Ꟍ","꟏":"꟎","ꟑ":"Ꟑ","ꟓ":"꟒","ꟕ":"꟔","ꟗ":"Ꟗ","ꟙ":"Ꟙ","ꟛ":"Ꟛ","ꟶ":"Ꟶ","ꭓ":"Ꭓ","ꭰ":"Ꭰ","ꭱ":"Ꭱ","ꭲ":"Ꭲ","ꭳ":"Ꭳ","ꭴ":"Ꭴ","ꭵ":"Ꭵ","ꭶ":"Ꭶ","ꭷ":"Ꭷ","ꭸ":"Ꭸ","ꭹ":"Ꭹ","ꭺ":"Ꭺ","ꭻ":"Ꭻ","ꭼ":"Ꭼ","ꭽ":"Ꭽ","ꭾ":"Ꭾ","ꭿ":"Ꭿ","ꮀ":"Ꮀ","ꮁ":"Ꮁ","ꮂ":"Ꮂ","ꮃ":"Ꮃ","ꮄ":"Ꮄ","ꮅ":"Ꮅ","ꮆ":"Ꮆ","ꮇ":"Ꮇ","ꮈ":"Ꮈ","ꮉ":"Ꮉ","ꮊ":"Ꮊ","ꮋ":"Ꮋ","ꮌ":"Ꮌ","ꮍ":"Ꮍ","ꮎ":"Ꮎ","ꮏ":"Ꮏ","ꮐ":"Ꮐ","ꮑ":"Ꮑ","ꮒ":"Ꮒ","ꮓ":"Ꮓ","ꮔ":"Ꮔ","ꮕ":"Ꮕ","ꮖ":"Ꮖ","ꮗ":"Ꮗ","ꮘ":"Ꮘ","ꮙ":"Ꮙ","ꮚ":"Ꮚ","ꮛ":"Ꮛ","ꮜ":"Ꮜ","ꮝ":"Ꮝ","ꮞ":"Ꮞ","ꮟ":"Ꮟ","ꮠ":"Ꮠ","ꮡ":"Ꮡ","ꮢ":"Ꮢ","ꮣ":"Ꮣ","ꮤ":"Ꮤ","ꮥ":"Ꮥ","ꮦ":"Ꮦ","ꮧ":"Ꮧ","ꮨ":"Ꮨ","ꮩ":"Ꮩ","ꮪ":"Ꮪ","ꮫ":"Ꮫ","ꮬ":"Ꮬ","ꮭ":"Ꮭ","ꮮ":"Ꮮ","ꮯ":"Ꮯ","ꮰ":"Ꮰ","ꮱ":"Ꮱ","ꮲ":"Ꮲ","ꮳ":"Ꮳ","ꮴ":"Ꮴ","ꮵ":"Ꮵ","ꮶ":"Ꮶ","ꮷ":"Ꮷ","ꮸ":"Ꮸ","ꮹ":"Ꮹ","ꮺ":"Ꮺ","ꮻ":"Ꮻ","ꮼ":"Ꮼ","ꮽ":"Ꮽ","ꮾ":"Ꮾ","ꮿ":"Ꮿ","ﬀ":"Ff","ﬁ":"Fi","ﬂ":"Fl","ﬃ":"Ffi","ﬄ":"Ffl","ﬅ":"St","ﬆ":"St","ﬓ":"Մն","ﬔ":"Մե","ﬕ":"Մի","ﬖ":"Վն","ﬗ":"Մխ","ａ":"Ａ","ｂ":"Ｂ","ｃ":"Ｃ","ｄ":"Ｄ","ｅ":"Ｅ","ｆ":"Ｆ","ｇ":"Ｇ","ｈ":"Ｈ","ｉ":"Ｉ","ｊ":"Ｊ","ｋ":"Ｋ","ｌ":"Ｌ","ｍ":"Ｍ","ｎ":"Ｎ","ｏ":"Ｏ","ｐ":"Ｐ","ｑ":"Ｑ","ｒ":"Ｒ","ｓ":"Ｓ","ｔ":"Ｔ","ｕ":"Ｕ","ｖ":"Ｖ","ｗ":"Ｗ","ｘ":"Ｘ","ｙ":"Ｙ","ｚ":"Ｚ","𐐨":"𐐀","𐐩":"𐐁","𐐪":"𐐂","𐐫":"𐐃","𐐬":"𐐄","𐐭":"𐐅","𐐮":"𐐆","𐐯":"𐐇","𐐰":"𐐈","𐐱":"𐐉","𐐲":"𐐊","𐐳":"𐐋","𐐴":"𐐌","𐐵":"𐐍","𐐶":"𐐎","𐐷":"𐐏","𐐸":"𐐐","𐐹":"𐐑","𐐺":"𐐒","𐐻":"𐐓","𐐼":"𐐔","𐐽":"𐐕","𐐾":"𐐖","𐐿":"𐐗","𐑀":"𐐘","𐑁":"𐐙","𐑂":"𐐚","𐑃":"𐐛","𐑄":"𐐜","𐑅":"𐐝","𐑆":"𐐞","𐑇":"𐐟","𐑈":"𐐠","𐑉":"𐐡","𐑊":"𐐢","𐑋":"𐐣","𐑌":"𐐤","𐑍":"𐐥","𐑎":"𐐦","𐑏":"𐐧","𐓘":"𐒰","𐓙":"𐒱","𐓚":"𐒲","𐓛":"𐒳","𐓜":"𐒴","𐓝":"𐒵","𐓞":"𐒶","𐓟":"𐒷","𐓠":"𐒸","𐓡":"𐒹","𐓢":"𐒺","𐓣":"𐒻","𐓤":"𐒼","𐓥":"𐒽","𐓦":"𐒾","𐓧":"𐒿","𐓨":"𐓀","𐓩":"𐓁","𐓪":"𐓂","𐓫":"𐓃","𐓬":"𐓄","𐓭":"𐓅","𐓮":"𐓆","𐓯":"𐓇","𐓰":"𐓈","𐓱":"𐓉","𐓲":"𐓊","𐓳":"𐓋","𐓴":"𐓌","𐓵":"𐓍","𐓶":"𐓎","𐓷":"𐓏","𐓸":"𐓐","𐓹":"𐓑","𐓺":"𐓒","𐓻":"𐓓","𐖗":"𐕰","𐖘":"𐕱","𐖙":"𐕲","𐖚":"𐕳","𐖛":"𐕴","𐖜":"𐕵","𐖝":"𐕶","𐖞":"𐕷","𐖟":"𐕸","𐖠":"𐕹","𐖡":"𐕺","𐖣":"𐕼","𐖤":"𐕽","𐖥":"𐕾","𐖦":"𐕿","𐖧":"𐖀","𐖨":"𐖁","𐖩":"𐖂","𐖪":"𐖃","𐖫":"𐖄","𐖬":"𐖅","𐖭":"𐖆","𐖮":"𐖇","𐖯":"𐖈","𐖰":"𐖉","𐖱":"𐖊","𐖳":"𐖌","𐖴":"𐖍","𐖵":"𐖎","𐖶":"𐖏","𐖷":"𐖐","𐖸":"𐖑","𐖹":"𐖒","𐖻":"𐖔","𐖼":"𐖕","𐳀":"𐲀","𐳁":"𐲁","𐳂":"𐲂","𐳃":"𐲃","𐳄":"𐲄","𐳅":"𐲅","𐳆":"𐲆","𐳇":"𐲇","𐳈":"𐲈","𐳉":"𐲉","𐳊":"𐲊","𐳋":"𐲋","𐳌":"𐲌","𐳍":"𐲍","𐳎":"𐲎","𐳏":"𐲏","𐳐":"𐲐","𐳑":"𐲑","𐳒":"𐲒","𐳓":"𐲓","𐳔":"𐲔","𐳕":"𐲕","𐳖":"𐲖","𐳗":"𐲗","𐳘":"𐲘","𐳙":"𐲙","𐳚":"𐲚","𐳛":"𐲛","𐳜":"𐲜","𐳝":"𐲝","𐳞":"𐲞","𐳟":"𐲟","𐳠":"𐲠","𐳡":"𐲡","𐳢":"𐲢","𐳣":"𐲣","𐳤":"𐲤","𐳥":"𐲥","𐳦":"𐲦","𐳧":"𐲧","𐳨":"𐲨","𐳩":"𐲩","𐳪":"𐲪","𐳫":"𐲫","𐳬":"𐲬","𐳭":"𐲭","𐳮":"𐲮","𐳯":"𐲯","𐳰":"𐲰","𐳱":"𐲱","𐳲":"𐲲","𐵰":"𐵐","𐵱":"𐵑","𐵲":"𐵒","𐵳":"𐵓","𐵴":"𐵔","𐵵":"𐵕","𐵶":"𐵖","𐵷":"𐵗","𐵸":"𐵘","𐵹":"𐵙","𐵺":"𐵚","𐵻":"𐵛","𐵼":"𐵜","𐵽":"𐵝","𐵾":"𐵞","𐵿":"𐵟","𐶀":"𐵠","𐶁":"𐵡","𐶂":"𐵢","𐶃":"𐵣","𐶄":"𐵤","𐶅":"𐵥","𑣀":"𑢠","𑣁":"𑢡","𑣂":"𑢢","𑣃":"𑢣","𑣄":"𑢤","𑣅":"𑢥","𑣆":"𑢦","𑣇":"𑢧","𑣈":"𑢨","𑣉":"𑢩","𑣊":"𑢪","𑣋":"𑢫","𑣌":"𑢬","𑣍":"𑢭","𑣎":"𑢮","𑣏":"𑢯","𑣐":"𑢰","𑣑":"𑢱","𑣒":"𑢲","𑣓":"𑢳","𑣔":"𑢴","𑣕":"𑢵","𑣖":"𑢶","𑣗":"𑢷","𑣘":"𑢸","𑣙":"𑢹","𑣚":"𑢺","𑣛":"𑢻","𑣜":"𑢼","𑣝":"𑢽","𑣞":"𑢾","𑣟":"𑢿","𖹠":"𖹀","𖹡":"𖹁","𖹢":"𖹂","𖹣":"𖹃","𖹤":"𖹄","𖹥":"𖹅","𖹦":"𖹆","𖹧":"𖹇","𖹨":"𖹈","𖹩":"𖹉","𖹪":"𖹊","𖹫":"𖹋","𖹬":"𖹌","𖹭":"𖹍","𖹮":"𖹎","𖹯":"𖹏","𖹰":"𖹐","𖹱":"𖹑","𖹲":"𖹒","𖹳":"𖹓","𖹴":"𖹔","𖹵":"𖹕","𖹶":"𖹖","𖹷":"𖹗","𖹸":"𖹘","𖹹":"𖹙","𖹺":"𖹚","𖹻":"𖹛","𖹼":"𖹜","𖹽":"𖹝","𖹾":"𖹞","𖹿":"𖹟","𖺻":"𖺠","𖺼":"𖺡","𖺽":"𖺢","𖺾":"𖺣","𖺿":"𖺤","𖻀":"𖺥","𖻁":"𖺦","𖻂":"𖺧","𖻃":"𖺨","𖻄":"𖺩","𖻅":"𖺪","𖻆":"𖺫","𖻇":"𖺬","𖻈":"𖺭","𖻉":"𖺮","𖻊":"𖺯","𖻋":"𖺰","𖻌":"𖺱","𖻍":"𖺲","𖻎":"𖺳","𖻏":"𖺴","𖻐":"𖺵","𖻑":"𖺶","𖻒":"𖺷","𖻓":"𖺸","𞤢":"𞤀","𞤣":"𞤁","𞤤":"𞤂","𞤥":"𞤃","𞤦":"𞤄","𞤧":"𞤅","𞤨":"𞤆","𞤩":"𞤇","𞤪":"𞤈","𞤫":"𞤉","𞤬":"𞤊","𞤭":"𞤋","𞤮":"𞤌","𞤯":"𞤍","𞤰":"𞤎","𞤱":"𞤏","𞤲":"𞤐","𞤳":"𞤑","𞤴":"𞤒","𞤵":"𞤓","𞤶":"𞤔","𞤷":"𞤕","𞤸":"𞤖","𞤹":"𞤗","𞤺":"𞤘","𞤻":"𞤙","𞤼":"𞤚","𞤽":"𞤛","𞤾":"𞤜","𞤿":"𞤝","𞥀":"𞤞","𞥁":"𞤟","𞥂":"𞤠","𞥃":"𞤡"});
    function v221FreshCOINSValueSafe(value) {
        if(typeof value!=='string')return false;
        // COinS revision 58159041 removes these individual UTF-8 bytes while
        // cleaning invisible characters. Keep a newly wrapped link unchanged
        // if its supplied values could lose bytes, including after native NFC.
        // Percent escapes stay literal; neither check decodes or rewrites them.
        try{
            return [value,value.normalize('NFC')].every(text=>
                !/%(?:80|8B|8D|AD|C2|E2)/i.test(encodeURIComponent(text)));
        }catch(_){return false;}
    }
    function v219CitationLanguageBareReferencePlan(source,options={}) {
        const plan=v221BaselineCitationLanguageBareReferencePlan(source,options);
        if(!plan.edits.length)return plan;
        const pageSafe=v221COINSPageContextSafe(options);
        const edits=plan.edits.filter(edit=>edit.proof?.kind==='source-literal-reference-url-label'&&
            pageSafe&&
            v221FreshCOINSValueSafe(edit.proof.url)&&v221FreshCOINSValueSafe(edit.proof.title)&&
            !/&(?:#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/i.test(edit.proof.url));
        return edits.length===plan.edits.length?plan:{...plan,edits,text:v24SyntaxApply(source,edits)};
    }
    function v221COINSPageContextSafe(cfg={}) {
        const title=cfg.pageTitle;
        if(typeof title!=='string'||!title.trim()||/[{}<>\[\]|\r\n\u0000-\u001f]/.test(title)||
            /&(?:#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/i.test(title))return false;
        const normalized=title.replace(/_/g,' ').trim(),views=new Set([title,title.normalize('NFC'),normalized,normalized.normalize('NFC')]);
        for(const view of views){
            if(!v221FreshCOINSValueSafe(view))return false;
            // Namespace parsing may move the first-letter boundary after a
            // colon. Assess both positions without changing the page title.
            for(const part of view.split(':')){
                const value=part.trim();if(!value)continue;
                const first=Array.from(value)[0],mapped=V221_NATIVE_TITLECASE_MAP[first]??first;
                if(!v221FreshCOINSValueSafe(mapped+value.slice(first.length)))return false;
            }
        }
        return true;
    }
    const V221_COINS_ROLE_GROUPS=Object.freeze({"Title":"work","ScriptTitle":"work","Chapter":"work","ScriptChapter":"work","Periodical":"work","Encyclopedia":"work","PublicationPlace":"place","Place":"place","Date":"date","PublicationDate":"date","Year":"date","Month":"date","Season":"date","Series":"series-number","Volume":"Volume","Issue":"series-number","Page":"pages","Pages":"pages","At":"pages","Sheet":"pages","Sheets":"pages","Degree":"Degree","Edition":"Edition","PublisherName":"PublisherName","URL":"uri","ChapterURL":"uri","AuthorList-First":"people","AuthorList-Last":"people","ContributorList-First":"people","ContributorList-Last":"people","Authors":"people","Vauthors":"people","Contribution":"people","NameListFormat":"people"});
    function v221COINSReader(raw) {
        if(!v219NativeCitationCS1Consumer(raw))return null;
        const native=v219NativeTitreContext(raw),profile=native?.profile;
        if(!profile?.dependencies?.some(row=>row.title==='Módulo:Citação/CS1'&&row.oldid===72936771)||
            !profile.dependencies.some(row=>row.title==='Módulo:Citação/CS1/COinS'&&row.oldid===58159041))return null;
        const fields=v220CitationFields(raw),map=fields&&!fields.some(field=>field.positional)&&v220CitationNamedFields(fields);
        return {reader:profile.title+'@'+profile.oldid,title:profile.title,fields:fields||[],unproved:!map};
    }
    function v221COINSContributions(context) {
        const result=[];
        for(const field of context.fields){
            const roles=v219NativeCitationRoles(field.key);
            // These aliases are installed by the pinned wrapper before CS1
            // reads its arguments; they are not shared CS1 aliases.
            if(context.title==='Citar mapa'){
                const role=({mapa:'Chapter',map:'Chapter',urlmapa:'ChapterURL',mapurl:'ChapterURL','map-url':'ChapterURL',
                    folha:'Sheet',sheet:'Sheet',folhas:'Sheets',sheets:'Sheets'})[field.key];
                if(role&&!roles.includes(role))roles.push(role);
            }
            if(context.title==='Citar tese'&&field.key==='grado')roles.push('Degree');
            for(const role of roles){
                const base=role.split(':')[0],group=base==='Degree'&&context.title!=='Citar tese'?null:V221_COINS_ROLE_GROUPS[base];
                if(group)result.push({role,group,key:field.key,value:v221CitationNativeTrim(field.value),
                    selector:base==='Authors'||base==='NameListFormat'||base==='Contribution'});
            }
        }
        return result;
    }
    function v221COINSGroupSignature(entries,group) {
        const roles=new Map();
        for(const entry of entries.filter(row=>row.group===group)){
            if(!roles.has(entry.role))roles.set(entry.role,[]);roles.get(entry.role).push(entry);
        }
        return JSON.stringify([...roles].sort(([a],[b])=>a.localeCompare(b)).map(([role,rows])=>
            [role,role!=='Vauthors'&&rows.every(row=>row.value===rows[0].value)?[[rows[0].value]]:rows.map(row=>[row.key,row.value])]));
    }
    function v221COINSPlainValueSafe(value) {
        const literal=value.replace(/\{\{!\}\}/g,'|');
        return !/[{}<>\[\]\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(literal)&&
            !/&(?:#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/i.test(literal)&&v221FreshCOINSValueSafe(literal);
    }
    function v221COINSRepairCertificate(before,after,proof) {
        if(!proof||!Array.isArray(proof.edits)||!proof.edits.length||v24SyntaxApply(before,proof.edits)!==after)return null;
        const old=v221COINSReader(before),next=v221COINSReader(after);
        if(!old||!next||next.unproved||old.reader!==next.reader)return null;
        const left=v221COINSContributions(old),right=v221COINSContributions(next);
        if(proof.kind==='native-duplicates'&&proof.edits.every(edit=>edit.ruleId==='v212CitationAliases')){
            const selected=new Map();
            for(const field of old.fields){
                if(field.positional)return null;
                const prior=selected.get(field.key);
                if(prior&&v221CitationNativeTrim(prior.value)!==v221CitationNativeTrim(field.value))return null;
                selected.set(field.key,field);
            }
            for(const edit of proof.edits){
                const aliases=V212_CITATION_ALIASES[edit.family],entries=aliases&&old.fields.filter(field=>aliases.includes(field.key)),
                    removed=old.fields.find(field=>field.partStart-1===edit.start&&field.partEnd===edit.end);
                if(!entries||entries.length<2||!removed||!entries.includes(removed)||edit.text!==''||
                    entries.some(field=>v221CitationNativeTrim(field.value)!==v221CitationNativeTrim(entries[0].value)))return null;
            }
            return {old:{...old,fields:[...selected.values()],unproved:false},groups:new Set()};
        }
        if(proof.kind==='edition'&&!old.unproved){
            const edits=proof.edits.filter(edit=>edit.ruleId==='v221CitationEditionSuffix'),
                fields=old.fields.filter(field=>v221CitationRole(field,'Edition')),
                targets=next.fields.filter(field=>v221CitationRole(field,'Edition'));
            if(edits.length!==1||fields.length!==1||targets.length!==1||fields[0].key!==targets[0].key)return null;
            const field=fields[0],edit=edits[0],match=/^([ \t\r\n\v\0]*)([1-9]\d{0,2}(?:\.[ªº]|[ªº]))[ \t]+ed\.([ \t\r\n\v\0]*)$/.exec(field.value);
            if(!match||edit.start!==field.start||edit.end!==field.end||edit.text!==match[1]+match[2]+match[3])return null;
            const adjusted=right.map(entry=>entry.group==='Edition'?{...entry,value:v221CitationNativeTrim(field.value)}:entry);
            return v221COINSGroupSignature(left,'Edition')===v221COINSGroupSignature(adjusted,'Edition')?{old,groups:new Set(['Edition'])}:null;
        }
        if(['url-quotes','url-brackets'].includes(proof.kind)&&!old.unproved&&proof.edits.length===1){
            const edit=proof.edits[0],fields=old.fields.filter(field=>v221CitationRole(field,'URL')),
                targets=next.fields.filter(field=>v221CitationRole(field,'URL'));
            if((proof.kind==='url-quotes'?(edit.ruleId!=='v213URLQuotes'||JSON.stringify(edit.changeRules)!=='["v213URLQuotes"]'):
                (edit.ruleId!=='v212BracketedURLs'||edit.role!=='URL'))||
                fields.length!==1||targets.length!==1||fields[0].key!==targets[0].key)return null;
            const field=fields[0],match=proof.kind==='url-quotes'?
                /^([ \t\r\n\v\0]*)(["'])(https?:\/\/[\s\S]+)\2([ \t\r\n\v\0]*)$/.exec(field.value):
                /^([ \t\r\n\v\0]*)(\[)(https?:\/\/[\s\S]+)\]([ \t\r\n\v\0]*)$/.exec(field.value);
            if(!match||!v213LiteralURL(match[3])||edit.start!==field.start+match[1].length||
                edit.end!==field.end-match[4].length||edit.text!==match[3]||
                targets[0].value!==match[1]+match[3]+match[4])return null;
            const adjusted=right.map(entry=>entry.role==='URL'?{...entry,value:v221CitationNativeTrim(field.value)}:entry);
            return v221COINSGroupSignature(left,'uri')===v221COINSGroupSignature(adjusted,'uri')?{old,groups:new Set(['uri'])}:null;
        }
        if(proof.kind==='literal-pipe'&&proof.edits.length===1){
            const edit=proof.edits[0],positional=old.fields.filter(field=>field.positional),
                named=old.fields.filter(field=>!field.positional),map=v220CitationNamedFields(named),
                titles=named.filter(field=>v221CitationRole(field,'Title')),targets=next.fields.filter(field=>v221CitationRole(field,'Title'));
            if(!map||positional.length!==1||titles.length!==1||targets.length!==1||titles[0].key!==targets[0].key||
                edit.ruleId!=='v220CitationLiteralPipe'||edit.start!==positional[0].partStart-1||edit.end!==positional[0].partStart||edit.text!=='{{!}}')return null;
            const at=old.fields.indexOf(positional[0]),plain=titles[0].value.replace(/\{\{!\}\}/g,'|');
            if(/[{}<>\[\]\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(plain)||/''/.test(plain)||
                /&(?:#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/i.test(plain))return null;
            if(at<1||old.fields[at-1]!==titles[0]||!v221COINSPlainValueSafe(positional[0].value)||/[^\x20-\x7e\t]/.test(positional[0].value))return null;
            const first=v221CitationNativeTrim(titles[0].value),last=v221CitationNativeTrim(targets[0].value).replace(/\{\{!\}\}/g,'|');
            if(!first||!last.startsWith(first)||/[^\x20-\x7e\t]/.test(last.slice(first.length)))return null;
            const adjusted=right.map(entry=>entry.role==='Title'?{...entry,value:first}:entry);
            return v221COINSGroupSignature(left,'work')===v221COINSGroupSignature(adjusted,'work')?{old:{...old,unproved:false},groups:new Set(['work'])}:null;
        }
        return null;
    }
    function v221COINSTransitionSafe(before,after,cfg={},proof=null) {
        if(before===after)return true;
        const next=v221COINSReader(after);
        if(!next)return !v218CitationNativeContext(after)?.profile?.dependencies?.some(row=>row.title==='Módulo:Citação/CS1'&&row.oldid===72936771);
        if(next.unproved)return false;
        const certificate=v221COINSRepairCertificate(before,after,proof),old=certificate?.old||v221COINSReader(before);
        if(old?.unproved)return false;
        let original=v221CitationArchiveSafetyContext(before);
        if(certificate&&original?.unprovedFields&&!old?.unproved)original={...original,
            fields:old.fields.filter(field=>!field.positional),unprovedFields:false};
        // An existing native reader is not an existing emitter when its
        // original-link branch fails before COinS can be emitted.
        const existing=old&&!old.unproved&&original&&v221CitationOriginalAccessSafe(original),
            same=existing&&old.reader===next.reader,left=existing?v221COINSContributions(old):[],right=v221COINSContributions(next);
        if(!existing&&!v221COINSPageContextSafe(cfg))return false;
        const genre=entries=>v221COINSGroupSignature(entries.filter(entry=>['Periodical','Encyclopedia'].includes(entry.role)),'work'),
            sameGenre=genre(left)===genre(right),preserved=new Map();
        for(const entry of right){
            if(entry.selector||v221COINSPlainValueSafe(entry.value))continue;
            if(!same||!sameGenre)return false;
            if(certificate?.groups.has(entry.group))continue;
            if(!preserved.has(entry.group))preserved.set(entry.group,
                v221COINSGroupSignature(left,entry.group)===v221COINSGroupSignature(right,entry.group));
            if(!preserved.get(entry.group))return false;
        }
        return true;
    }
    function v221CitationNativeTrim(value) {return value.replace(/^[ \t\r\n\v\0]+|[ \t\r\n\v\0]+$/g,'');}
    function v221CitationNativeLower(value) {return value.replace(/[A-Z]/g,char=>String.fromCharCode(char.charCodeAt(0)+32));}
    function v221CitationArchivedAccessSafe(context,plannedState=null,plannedArchive=null) {
        // CS1 retains the original access value when the archive becomes the
        // main link. That branch currently expects the English presentation
        // key and crashes on the otherwise accepted Portuguese enum.
        const roles=role=>v221CitationRoleFields(context.fields,role),archives=roles('ArchiveURL');
        if(!plannedArchive&&!archives.some(field=>v221CitationNativeTrim(field.value)))return true;
        const chapters=roles('ChapterURL');
        if(context.kind==='book'&&chapters.length===1&&v221CitationURL(chapters[0].value))return true;
        if(plannedState!==null)return ['não','no'].includes(plannedState);
        const states=roles('DeadURL');
        return !states.length||states.length===1&&(!v221CitationNativeTrim(states[0].value)||
            v221CitationScalar(states[0].value,100)&&
            ['não','no'].includes(v221CitationNativeLower(v221CitationNativeTrim(states[0].value))));
    }
    function v221CitationArchiveSafetyContext(raw) {
        const direct=v221CitationConsumer(raw);if(direct)return direct;
        const native=v218CitationNativeContext(raw);
        if(!native?.profile?.dependencies?.some(row=>row.title==='Módulo:Citação/CS1'&&row.oldid===72936771))return null;
        const fields=v220CitationFields(raw),map=fields&&!fields.some(field=>field.positional)&&v220CitationNamedFields(fields);
        return {kind:native.profile.title==='Citar livro'?'book':'legacy-cs1',fields:fields||[],map,
            unprovedFields:!map};
    }
    function v221CitationOriginalAccessSafe(context) {
        if(!context||context.unprovedFields)return false;
        if(['tweet','patent'].includes(context.kind)||v221CitationArchivedAccessSafe(context))return true;
        const urls=v221CitationRoleFields(context.fields,'URL');
        if(!urls.some(field=>v221CitationNativeTrim(field.value)))return true;
        const access=v221CitationRoleFields(context.fields,'UrlAccess');
        if(!access.length)return true;
        // CS1 saves the raw value before its ordinary title validation. Only
        // these four access-format entries exist in the pinned presentation
        // table. Unknown or competing values cannot activate this branch.
        return access.length===1&&(!v221CitationNativeTrim(access[0].value)||
            v221CitationScalar(access[0].value,100)&&
            ['free','subscription','registration','limited'].includes(v221CitationNativeTrim(access[0].value)));
    }
    function v221CitationTransactionEdits(source,edits,options={}) {
        const blocked=[],groups=new Map();
        if(!edits.length)return edits;
        const sourceOwners=templates(protectedView(source)).nodes;
        for(const edit of edits){
            const owners=sourceOwners.filter(node=>node.start<=edit.start&&node.end>=edit.end)
                .sort((a,b)=>(a.end-a.start)-(b.end-b.start)),owner=owners[0];
            if(!owner)return [];
            if(!groups.has(owner))groups.set(owner,[]);groups.get(owner).push(edit);
        }
        for(const [owner,owned]of groups){
            const raw=source.slice(owner.start,owner.end),
                after=v24SyntaxApply(raw,owned.map(row=>({...row,start:row.start-owner.start,end:row.end-owner.start}))),
                context=v221CitationArchiveSafetyContext(after);
            if(context&&!v221CitationOriginalAccessSafe(context)||!v221COINSTransitionSafe(raw,after,options))blocked.push(owner);
        }
        // Keep the complete inherited call when its mixed transaction would
        // activate the broken native branch. Other citations remain eligible.
        return edits.filter(edit=>!blocked.some(owner=>owner.start<=edit.start&&edit.end<=owner.end));
    }
    function v219SourceCompatibilityEdits(source,options={}) {
        return v221CitationTransactionEdits(source,v221BaselineSourceCompatibilityEdits(source,options),options);
    }
    function v218CitationKeyEdits(source,options={}) {
        return v221CitationTransactionEdits(source,v221BaselineCitationKeyEdits218(source,options),options);
    }
    function v221CitationWriterTransaction(raw,cfg,bump,warn,writer) {
        const bumps=[],warnings=[],result=writer(raw,cfg,(...args)=>bumps.push(args),(...args)=>warnings.push(args));
        if(result!==raw){
            const context=v221CitationArchiveSafetyContext(result);
            let safe=v221COINSTransitionSafe(raw,result,cfg);
            if(!safe){
                const aliases=v221BaselineCitationAliasCall212(raw,cfg);
                if(aliases.text===result)safe=v221COINSTransitionSafe(raw,result,cfg,
                    {kind:aliases.changes.every(edit=>edit.ruleId==='v212CitationAliases')?'native-duplicates':'url-brackets',edits:aliases.changes});
            }
            if(context&&!v221CitationOriginalAccessSafe(context)||!safe)return raw;
        }
        for(const args of bumps)bump(...args);
        for(const args of warnings)warn(...args);
        return result;
    }
    function citation(raw,cfg,bump,warn) {
        return v221CitationWriterTransaction(raw,cfg,bump,warn,v221BaselineCitation221);
    }
    function extendedCitation(raw,cfg,bump,warn) {
        return v221CitationWriterTransaction(raw,cfg,bump,warn,v221BaselineExtendedCitation221);
    }
    function v212CitationAliasCall(raw,cfg={}) {
        const result=v221BaselineCitationAliasCall212(raw,cfg);if(!result.changes.length||result.text===raw)return result;
        const fields=v220CitationFields(raw);
        if(!fields||fields.some(field=>field.positional))return {text:raw,changes:[]};
        for(const edit of result.changes.filter(row=>row.ruleId==='v212CitationAliases')){
            const aliases=V212_CITATION_ALIASES[edit.family],entries=aliases&&fields.filter(field=>aliases.includes(field.key));
            if(!entries||entries.length<2||entries.some(field=>v221CitationNativeTrim(field.value)!==v221CitationNativeTrim(entries[0].value)))return {text:raw,changes:[]};
        }
        const context=v221CitationArchiveSafetyContext(result.text),proof={kind:result.changes.every(edit=>edit.ruleId==='v212CitationAliases')?'native-duplicates':'url-brackets',edits:result.changes};
        if(context&&!v221CitationOriginalAccessSafe(context)||!v221COINSTransitionSafe(raw,result.text,cfg,proof))return {text:raw,changes:[]};
        return result;
    }
    function v213ReferenceCall(raw,cfg={}) {
        const result=v221BaselineReferenceCall213(raw,cfg);if(!result.changes.length||result.text===raw)return result;
        const context=v221CitationArchiveSafetyContext(result.text);
        if(context&&!v221CitationOriginalAccessSafe(context)||
            !v221COINSTransitionSafe(raw,result.text,cfg,{kind:'url-quotes',edits:result.changes}))return {text:raw,changes:[]};
        return result;
    }
    function v219SourceCompatibilityRule(key) {
        const rule=v221BaselineSourceCompatibilityRule(key);
        if(!rule||!['editor-first','editor-last'].includes(rule.kind))return rule;
        const descriptor=v221CitationEditorRole(rule.target);if(!descriptor)return rule;
        return {...rule,family:[...new Set([...rule.family,...v221CitationEditorAliases(descriptor.role,descriptor.index)])]};
    }
    function v219CitationMappedParameter(parsed,key,index,cfg={}) {
        const target=v221BaselineCitationMappedParameter(parsed,key,index,cfg);
        if(target===key)return target;
        return v221CitationEditorCollision('{{'+parsed.parts.join('|')+'}}',key,target)?key:target;
    }
    function v221CitationCall(raw,cfg={},editionBindings=null) {
        const context=v221CitationConsumer(raw);if(!context||cfg.citations===false||cfg.citationRepairs===false||cfg.automaticCitationKeyRepairs===false||cfg.automaticParameterNames===false)return null;
        const {title,kind,fields,map}=context,edits=[],used=new Set(),cs1=!['tweet','patent'].includes(kind),
            add=(start,end,text,rule)=>{edits.push({start,end,text,ruleId:rule});used.add(rule);},
            rename=(field,target,rule)=>{if(field.key!==target)add(field.keyStart,field.keyEnd,target,rule);},
            value=(field,text,rule)=>{const next=v221CitationPadded(field.value,text);if(next!==field.value)add(field.start,field.end,next,rule);},
            noRole=(role,field)=>!fields.some(other=>other!==field&&v221CitationRole(other,role)),
            oneRole=role=>{const found=v221CitationRoleFields(fields,role);return found.length===1?found[0]:null;};
        for(const field of fields){
            if(field.positional||!v221CitationLiteral(field.value))continue;
            if(cs1&&V221_CITATION_ACCESS_TYPOS.includes(field.key)&&v221CitationDate(field.value)&&
                noRole('AccessDate',field)&&!fields.some(other=>other!==field&&V221_CITATION_ACCESS_TYPOS.includes(other.key)))rename(field,'acessodata','v221CitationAccessDate');
            if(cs1&&field.key==='sdata'&&v221CitationDate(field.value)&&noRole('Date',field)&&noRole('PublicationDate',field)&&noRole('Year',field)&&
                (kind!=='episode'||!fields.some(other=>v221CitationRole(other,'AirDate')||['início','began','fim','ended'].includes(other.key))))rename(field,'data','v221CitationPublicationDate');
            if(cs1&&cfg.authors!==false&&['número-autores','número-editores'].includes(field.key)&&/^(?:[1-9]\d{0,2}|et\s+al\.?)$/i.test(field.value.trim())){
                const role=field.key==='número-autores'?'DisplayAuthors':'DisplayEditors';
                if(noRole(role,field))rename(field,role==='DisplayAuthors'?'numero-autores':'numero-editores','v221CitationDisplayPeople');
            }
            if(cs1&&['ano-original','orig-ano'].includes(field.key)&&/^[1-9]\d{3}$/.test(field.value.trim())&&noRole('OrigYear',field)&&
                !fields.some(other=>other!==field&&['ano-original','orig-ano'].includes(other.key)))rename(field,'anooriginal','v221CitationOriginalYear');
            if(cs1&&field.key==='ediçao'&&v221CitationScalar(field.value,100)&&noRole('Edition',field))rename(field,'edição','v221CitationEditionKey');
            if(cs1&&['obral','pbra'].includes(field.key)&&noRole('Periodical',field)&&
                !fields.some(other=>other!==field&&['obral','pbra'].includes(other.key))&&!['mailing'].includes(kind))rename(field,'obra','v221CitationPeriodicalKey');
            if(cs1&&['edicao','edição','edition','ed','Edição','edición'].includes(field.key)&&oneRole('Edition')===field&&
                v221CitationEditionAllowed(context,field,editionBindings)){
                const ordinal=/^([1-9]\d{0,2}(?:\.[ªº]|[ªº]))\s+ed\.$/.exec(field.value.trim());
                if(ordinal)value(field,ordinal[1],'v221CitationEditionSuffix');
            }
            if(cs1&&cfg.identifierUrlRepairs!==false&&v221CitationRole(field,'Identifier:ISSN')){
                const found=/^ISSN\s*:?\s*(\d{4}-\d{3}[\dXx])$/.exec(field.value.trim());
                if(found&&v221CitationISSN(found[1]))value(field,found[1],'v221CitationISSNLabel');
            }
            if(cs1&&cfg.identifierUrlRepairs!==false&&v221CitationRole(field,'Identifier:ISBN')){
                const found=/^ISBN(?:-(10|13))?\s*:?\s*([\dXx -]+)\.$/i.exec(field.value.trim());
                if(found&&v213ISBN(found[2])&&(!found[1]||found[2].replace(/[ -]/g,'').length===Number(found[1])))value(field,found[2],'v221CitationISBNPeriod');
            }
            if(kind==='book'&&cfg.identifierUrlRepairs!==false&&field.key==='id'&&noRole('Identifier:ISBN',field)){
                const found=/^ISBN(?:-(10|13))?(?:\s*:\s*|\s+)([\dXx -]+)$/i.exec(field.value.trim());
                if(found&&v213ISBN(found[2])&&(!found[1]||found[2].replace(/[ -]/g,'').length===Number(found[1]))){rename(field,'isbn','v221CitationISBNFromId');value(field,found[2],'v221CitationISBNFromId');}
            }
            if(cs1&&['questão','nº'].includes(field.key)&&['news','journal','magazine'].includes(kind)&&
                /^[1-9]\d{0,4}(?:[-–][1-9]\d{0,4}|-[A-Za-z])?$/.test(field.value.trim())&&noRole('Issue',field)&&
                !fields.some(other=>other!==field&&['questão','nº'].includes(other.key)))rename(field,'número','v221CitationIssueKey');
            if(cs1&&kind!=='game'&&field.key==='loc'&&/^§{1,2}\s*\d+[A-Za-z]?(?:\s*[-–,]\s*\d+[A-Za-z]?)*$/.test(field.value.trim())&&noRole('At',field))rename(field,'em','v221CitationSectionLocator');
            if(kind==='episode'&&field.key==='lengenda'&&v221CitationScalar(field.value,600)&&
                noRole('TimeCaption',field)&&oneRole('Time')&&v221CitationScalar(oneRole('Time').value,100))
                rename(field,'legenda','v221EpisodeCaptionKey');
            const importedLink=cfg.authors!==false&&(cs1||kind==='tweet')?v221CitationImportedAuthorLink(field.key,kind):null;
            if(importedLink){
                const {index,target}=importedLink,
                    competingImports=fields.filter(other=>v221CitationImportedAuthorLink(other.key,kind)?.index===index),
                    links=v221CitationRoleFields(fields,'AuthorList-Link').filter(other=>v221CitationRole(other,'AuthorList-Link',index)),
                    authors=kind==='tweet'?fields.filter(other=>['autor','author'].includes(other.key)):
                        v221CitationRoleFields(fields,'AuthorList-Last').filter(other=>v221CitationRole(other,'AuthorList-Last',index));
                // The tweet wrapper gives a present empty author precedence
                // over autor; it then renders @user. No inactive alias proves
                // the person a new author link would target.
                if(competingImports.length===1&&v221CitationScalar(field.value,240)&&!/[#\[\]|]/.test(field.value)&&
                    !map.has(target)&&links.length===0&&authors.length===1&&v221CitationLiteral(authors[0].value,160))
                    rename(field,target,'v221CitationAuthorLink');
            }
            const editor=cs1&&cfg.authors!==false?v221CitationImportedEditor(field.key):null;
            if(editor&&v221CitationScalar(field.value,160)){
                const family=(role,index)=>fields.filter(other=>{
                        const descriptor=v221CitationEditorRole(other.key);return descriptor?.role===role&&descriptor.index===index;
                    }),
                    peers=family(editor.role,editor.index),
                    surnames=index=>family('EditorList-Last',index),
                    singleLiteral=entries=>entries.length===1&&v221CitationScalar(entries[0].value,160),
                    completePrior=Array.from({length:editor.index-1},(_,at)=>surnames(at+1)).every(singleLiteral),
                    hasLast=!editor.first||singleLiteral(surnames(editor.index));
                if(peers.length===1&&peers[0]===field&&completePrior&&hasLast&&!map.has(editor.target))
                    rename(field,editor.target,'v221CitationEditorName');
            }
            if(kind==='patent'){
                const target=({pais:'país',country:'país',numero:'número',number:'número',titulo:'título'})[field.key],
                    families={'país':['país','código-país','1','pais','country'],'número':['número','número-publicação','número-patente','2','numero','number'],'título':['título','titulo']};
                if(target&&!families[target].some(key=>key!==field.key&&map.has(key))&&v221CitationScalar(field.value))rename(field,target,'v221PatentAlias');
            }
        }
        if(kind==='tweet')v221TweetEdits(raw,context,cfg,add,rename,value);
        if(cs1||kind==='tweet')v221CitationArchiveAccessEdits(raw,context,cfg,add,rename,value);
        if(kind==='conference'){
            const event=oneRole('Conference'),oldURL=map.get('urlconferencia'),
                urlPeers=fields.filter(other=>other.key==='urlconferencia'||v221CitationRole(other,'ConferenceURL')),
                nativeURL=urlPeers.length===1&&urlPeers[0]!==oldURL?urlPeers[0]:null,
                eligibleOldURL=!!(event&&v221CitationLiteral(event.value)&&oldURL&&urlPeers.length===1&&v221CitationURL(oldURL.value)),
                effectiveURL=nativeURL&&v221CitationURL(nativeURL.value)||eligibleOldURL;
            for(const [from,target,role] of [['urlconferencia','conference-url','ConferenceURL'],['formato-conferencia','formato-conferência','ConferenceFormat']]){
                const field=map.get(from);if(!event||!v221CitationLiteral(event.value)||!field||!noRole(role,field)||!v221CitationScalar(field.value))continue;
                if(role==='ConferenceURL'&&!eligibleOldURL)continue;
                if(role==='ConferenceFormat'&&!effectiveURL)continue;
                rename(field,target,'v221CitationConferenceKey');
            }
        }
        const ordered=edits.sort((a,b)=>a.start-b.start||a.end-b.end);
        for(let i=1;i<ordered.length;i++)if(ordered[i].start<ordered[i-1].end)return null;
        if(!ordered.length)return null;
        const text=v24SyntaxApply(raw,ordered),after=v221CitationConsumer(text);
        // A transaction may introduce a new argument only with one literal
        // binding. Duplicate keys or a changed native consumer abort the call.
        if(!after||after.title!==title||after.kind!==kind||!v221CitationOriginalAccessSafe(after)||
            !v221COINSTransitionSafe(raw,text,cfg,{kind:'edition',edits:ordered}))return null;
        return {text,fieldEdits:ordered,rules:[...used],contract:{title,kind,...V221_CITATION_NATIVE_CONTRACT}};
    }
    function v220CitationCall(raw,cfg={}) {
        const result=v221BaselineCitationCall220(raw,cfg);if(!result||result.text===raw)return result;
        const context=v221CitationArchiveSafetyContext(result.text);
        if(context&&!v221CitationOriginalAccessSafe(context)||
            !v221COINSTransitionSafe(raw,result.text,cfg,{kind:'literal-pipe',edits:result.fieldEdits}))return null;
        return result;
    }
    function v221CitationISSN(value) {
        if(!/^\d{4}-\d{3}[\dXx]$/.test(value))return false;const digits=value.replace('-','');
        return [...digits].reduce((sum,char,index)=>sum+(char.toUpperCase()==='X'?10:Number(char))*(8-index),0)%11===0;
    }
    function v221TweetEdits(raw,context,cfg,add,rename,value) {
        const {fields,map}=context;
        if(cfg.authors!==false){
            const first=fields.filter(field=>['primeiro','nome'].includes(field.key)),last=fields.filter(field=>['último','ultimo','sobrenome'].includes(field.key)),
                literal=text=>v221CitationScalar(text,120)&&/^[\p{L}\p{M}][\p{L}\p{M} .'’\-]*$/u.test(text.trim());
            if(first.length===1&&last.length===1&&!fields.some(field=>/^(?:autor|author|autores|authors|first|last)(?:\d+)?$/.test(field.key))&&literal(first[0].value)&&literal(last[0].value)){
                rename(first[0],'autor','v221TweetPortugueseName');value(first[0],first[0].value.trim()+' '+last[0].value.trim(),'v221TweetPortugueseName');
                add(last[0].partStart-1,last[0].partEnd,'','v221TweetPortugueseName');
            }
        }
        const users=fields.filter(field=>['user','usuario','usuário','utilizador'].includes(field.key)),numbers=fields.filter(field=>['number','número','numero'].includes(field.key)),urls=fields.filter(field=>field.key==='url');
        if(users.length===1&&numbers.length===1&&urls.length===1&&/^@[A-Za-z0-9_]{1,15}$/.test(users[0].value.trim())&&/^\d+$/.test(numbers[0].value.trim())){
            const url=v221CitationURL(urls[0].value),user=users[0].value.trim().slice(1),number=numbers[0].value.trim();
            if(url&&['twitter.com','www.twitter.com','x.com','www.x.com'].includes(url.hostname.toLowerCase())&&!url.search&&!url.hash&&url.pathname==='/'+user+'/status/'+number)value(users[0],user,'v221TweetVerifiedHandle');
        }
    }
    function v221CitationArchiveAccessEdits(raw,context,cfg,add,rename,value) {
        const {fields,map,kind}=context,cs1=kind!=='tweet',roles=role=>v221CitationRoleFields(fields,role),
            unique=role=>{const a=roles(role);return a.length===1?a[0]:null;},
            states=v221CitationStateFields(context),
            state=states.length===1?states[0]:null, stateValue=state?.value.trim(),
            translatedState=state&&(state.key!=='url-estado'||['web','book','news','journal','magazine'].includes(kind))&&
                ({live:'não',ativo:'não','ao vivo':'não',dead:'sim',morto:'sim'})[stateValue],
            conflictingState=states.length>1||state&&!translatedState&&['url-status','url-estado','statusurl','urlmorto'].includes(state.key);
        const oldURL=fields.filter(field=>['arquivurl','url-arquivo'].includes(field.key)),oldDate=fields.filter(field=>['dataarquivo','data-arquivo'].includes(field.key)),
            proposedURL=oldURL.length===1&&!roles('ArchiveURL').length?oldURL[0]:null,
            proposedDate=oldDate.length===1&&!roles('ArchiveDate').length?oldDate[0]:null;
        const pair=v221CitationArchivePair(context,proposedURL,proposedDate);
        let plannedArchive=null,plannedState=null;
        if(pair&&!conflictingState){
            plannedArchive=proposedURL;plannedState=translatedState||null;
            if(proposedURL)rename(proposedURL,'arquivourl',kind==='tweet'?'v221TweetArchive':'v221CitationArchiveURL');
            if(proposedDate)rename(proposedDate,'arquivodata',kind==='tweet'?'v221TweetArchive':'v221CitationArchiveDate');
            if(translatedState){if(state.key!=='urlmorta')rename(state,'urlmorta','v221CitationURLState');value(state,translatedState,'v221CitationURLState');}
        }
        // A missing pipe is recognised only with its literal deadarchiveurl
        // marker and an independently supplied, matching date and original URL.
        if(cs1&&state&&state.key==='urlmorta'&&!roles('ArchiveURL').length&&!oldURL.length&&stateValue.startsWith('deadarchiveurl=')){
            const archive=stateValue.slice('deadarchiveurl='.length),synthetic={...state,key:'arquivourl',value:archive};
            // Pass the synthetic field as a role-bearing source, never infer a
            // missing date or rewrite an unrelated query containing equals.
            const check=v221CitationArchivePair({...context,fields:[...fields.filter(field=>field!==state),synthetic]},synthetic,null);
            if(check&&v221CitationURL(archive)){
                value(state,'sim|arquivourl='+archive,'v221CitationArchiveMissingPipe');plannedArchive=synthetic;plannedState='sim';
            }
        }
        if(!cs1)return;
        const access=fields.filter(field=>['url-access','acesso-url','acessourl','url-acesso','url-acess','urlacesso','urlaccess'].includes(field.key)),url=unique('URL');
        if(access.length===1&&url&&v221CitationURL(url.value)&&!fields.some(field=>['registro','registo','registration','cadastro','subscription','subscrição','subscriçao','subscricao','assinatura'].includes(field.key)&&field.value.trim())){
            const field=access[0],literal=field.value.trim(),enumMap={subscription:'subscrição',assinatura:'subscrição',registration:'registro',limited:'limitada',limitado:'limitada','Subscrição':'subscrição'},translated=enumMap[literal];
            if(translated&&v221CitationArchivedAccessSafe(context,plannedState,plannedArchive)){
                if(['url-acesso','url-acess','urlacesso','urlaccess'].includes(field.key))rename(field,'acessourl','v221CitationURLAccessKey');
                value(field,translated,'v221CitationURLAccessValue');
            }
        }
        const doiAccess=fields.filter(field=>['doi-access','doi-acesso'].includes(field.key)),doi=unique('Identifier:DOI');
        if(doiAccess.length===1&&doi&&v221CitationScalar(doi.value)&&v213DOI(doi.value.trim())&&doiAccess[0].value.trim()==='livre'){
            rename(doiAccess[0],'doi-access','v221CitationDOIAccess');value(doiAccess[0],'free','v221CitationDOIAccess');
        }
    }
    function v221CitationPlan(source,cfg={}) {
        const base={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],proofs:[],changes:[]};
        if(!v221CitationScope(source,cfg))return base;
        const ownerContext=v221CitationSourceContext(source),all=[],editionBindings=typeof cfg.citationOriginalSource==='string'&&
            /[ªº]\s+ed\./.test(source)?v221CitationEditionBindings(source,cfg.citationOriginalSource,cfg):null;
        for(const node of ownerContext.parsed.nodes){
            if(!v221CitationSourceOwner(source,node,ownerContext))continue;
            const raw=source.slice(node.start,node.end),call=v221CitationCall(raw,cfg,editionBindings);if(!call)continue;
            all.push({start:node.start,end:node.end,text:call.text,ruleId:call.rules[0],ruleIds:call.rules,
                proof:{version:'2.21',sourceHash:base.sourceHash,before:raw,contract:call.contract,fieldEdits:call.fieldEdits}});
        }
        if(cfg.references!==false)all.push(...v221ReferenceNameEdits(source,cfg));
        if(cfg.citations!==false&&cfg.citationRepairs!==false&&Array.isArray(cfg.v221DOITitleProofs)){
            for(const request of v221CitationTitleRequests(source,cfg)){
                const proof=cfg.v221DOITitleProofs.find(item=>v221CitationTitleProof(source,request,item));
                if(proof)all.push({start:request.start,end:request.end,text:request.after,ruleId:'v221CitationDOITitle',ruleIds:['v221CitationDOITitle'],
                    proof:{version:'2.21',sourceHash:base.sourceHash,before:request.before,contract:{kind:'exact-same-DOI-deposited-title'},request,metadataSha:proof.metadataSha,fieldEdits:[{ruleId:'v221CitationDOITitle'}]}});
            }
        }
        // A parent owner and its child cannot independently consume the same
        // bytes. Preserve the complete parent when both propose a transaction.
        const edits=all.filter(edit=>!all.some(other=>other!==edit&&edit.start<other.end&&other.start<edit.end)).sort((a,b)=>a.start-b.start);
        const counts=new Map();for(const edit of edits)for(const id of edit.ruleIds)counts.set(id,(counts.get(id)||0)+edit.proof.fieldEdits.filter(f=>f.ruleId===id).length);
        return {...base,text:v24SyntaxApply(source,edits),edits,proofs:edits.map(edit=>edit.proof),changes:[...counts].map(([id,count])=>({id,count}))};
    }
    function v221CitationPlanProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v221CitationPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    // The existing end-matter writer can add a default collector for literal
    // references in an infobox. Prove that single insertion before comparing
    // the ordered reference events, which otherwise contain an extra collector.
    // No candidate output or reference body is projected by this producer.
    function v221MissingDefaultCollectorPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(!v221CitationScope(source,cfg)||source.length>524288||cfg.namespaceNumber!==0||cfg.references===false||
            cfg.endMatter!==true||cfg.markup===false||!/<ref\b/i.test(source)||
            v24SyntaxScan(source).issues.length||v219ReferenceIdentityQuarantine(source,cfg).opaque)return empty;
        const observed=v219NativeReferenceObserver(source),nodes=templates(observed.view),shield=v24SyntaxProtected(source);
        if(!observed.refs.length||observed.unclosed.length||observed.empties.length||observed.helpers.length||
            nodes.unclosed.length||shield.unclosed.length||rendererRanges(observed.view).length)return empty;
        const box=typeof v221BioPrincipal==='function'?v221BioPrincipal(source):null,
            protectedRanges=[...shield.ranges,...v219MarkdownLiteralRanges(source),...v219QuotedTemplateRanges(source),
                ...v219WholeQuotedCodeRanges(source),...structuralQuoteRanges(source)],definitions=new Map(),uses=[];
        let visibleLiteralReference=false;
        for(const ref of observed.refs){
            if(!ref.attrs||ref.typo||ref.container||ref.group!==''||!v24SyntaxLiteralIdentity(ref.attrs)||
                Object.keys(ref.attrs).some(key=>!['name','group'].includes(key))||
                Object.values(ref.attrs).some(value=>!value||value!==value.trim()||v219UncertainReferenceIdentity(value))||
                protectedRanges.some(range=>range.start<=ref.start&&ref.start<range.end)||
                ref.body!==null&&(!ref.close||!ref.body.trim()||!v220LiteralReferenceBodySafe(source,
                    ref.end-ref.close.raw.length-ref.body.length,ref.close.start,shield)))return empty;
            const ancestors=nodes.nodes.filter(node=>node.start<ref.start&&ref.end<node.end);
            if(ancestors.length){
                if(!box||ancestors.length!==1||ancestors[0].start!==box.node.start||ancestors[0].end!==box.node.end||
                    !box.native?.oldid||!box.native?.sha256||!v221BioUniqueFields(box))return empty;
                const owners=box.fields.filter(field=>box.node.start+field.start<=ref.start&&
                    ref.end<=box.node.start+field.end);
                if(owners.length!==1)return empty;
                if(!box.native.consumed.includes(owners[0].key))return empty;
            }else{
                if(!ref.renderer?.valid)return empty;
                visibleLiteralReference=true;
            }
            const name=ref.attrs.name;
            if(ref.body===null){if(!name)return empty;uses.push(name);}
            else if(name){
                if(definitions.has(name)&&definitions.get(name)!==ref.body)return empty;
                definitions.set(name,ref.body);
            }
        }
        // A consumed infobox key may still belong to an inactive conditional
        // row or lose to another alias. Require an independently rendered body
        // reference; syntactic ownership alone must not create an empty list.
        if(!visibleLiteralReference||uses.some(name=>!definitions.has(name)))return empty;
        for(const node of nodes.nodes){
            if(box&&node.start===box.node.start&&node.end===box.node.end||
                observed.refs.some(ref=>ref.body!==null&&ref.start<node.start&&node.end<ref.end))continue;
            const raw=source.slice(node.start,node.end);
            if(!v219NativeCitationStateInterface(raw)&&!v2111ReferenceFreeTemplate(raw)&&!v219LiteralDefaultSortCall(raw))return empty;
        }
        // endMatterPass has no plan/audit callback. Refuse its heading or
        // section conversions here, retaining only the exact collector suffix.
        const text=endMatterPass(source,()=>{},()=>{},cfg);if(text===source)return empty;
        let start=0,end=source.length,tail=text.length;
        while(start<end&&start<tail&&source[start]===text[start])start++;
        while(end>start&&tail>start&&source[end-1]===text[tail-1]){end--;tail--;}
        const replacement=text.slice(start,tail),context=v219IndexedSyntaxContext(source,start);
        if(!/^[ \t\r\n]*$/.test(source.slice(start,end))||
            !/^[ \t\r\n]*\{\{Referências\}\}[ \t\r\n]*$/.test(replacement)||
            observed.refs.some(ref=>ref.end>start)||!context||
            ['templates','html','tables','links','external'].some(key=>context[key]?.length))return empty;
        const after=v219NativeReferenceObserver(text),inventory=(input,parsed)=>parsed.refs.map(ref=>[
            input.slice(ref.start,ref.end),ref.attrs,ref.group,ref.renderer,ref.container??null]);
        if(after.unclosed.length||after.empties.length||after.helpers.length||
            JSON.stringify(inventory(source,observed))!==JSON.stringify(inventory(text,after)))return empty;
        const collectors=rendererRanges(after.view);
        if(collectors.length!==1||text.slice(collectors[0].start,collectors[0].end)!=='{{Referências}}'||
            collectors[0].start<start||collectors[0].end>start+replacement.length)return empty;
        const edit={start,end,text:replacement,ruleId:'v221MissingDefaultCollector',label:'Lista de referências completada',
            proof:{sourceHash:empty.sourceHash,nativeTemplateOldid:63785697,referenceCount:observed.refs.length,
                referenceInventoryHash:v24SyntaxHash(JSON.stringify(inventory(source,observed))),
                nativeOwner:box?{name:box.name,oldid:box.native.oldid,sha256:box.native.sha256}:null,
                condition:'one existing-producer default collector insertion after every complete literal reference; every original non-gap byte and ordered reference identity/context retained'}};
        return {...empty,text,edits:[edit]};
    }
    function v221MissingDefaultCollectorProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||plan.edits?.length!==1)return false;
        const fresh=v221MissingDefaultCollectorPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v221ReferenceNameEdits(source,cfg={}) {
        if(!v221CitationScope(source,cfg)||cfg.references===false||cfg.referenceGraphRepairs===false||cfg.automaticReferenceRepairs===false||source.length>524288)return [];
        // References produced by dynamic helpers, or inside a literal/quoted
        // owner, cannot be reconciled from plain tags alone.
        const observed=v219NativeReferenceObserver(source),nodes=templates(source).nodes,ownerContext=v221CitationSourceContext(source),edits=[],
            ownerSafe=(at,end=at+1)=>!inRange(at,nodes)&&!v220RawReferenceAttributeBoundary(source,at)&&
                v221CitationSourceOwner(source,{start:at,end},ownerContext),
            literalName=name=>typeof name==='string'&&!/^\d+$/.test(name)&&/^[\p{L}\p{N}_.:-]{1,120}$/u.test(name),
            add=(start,end,text,rule,proof)=>edits.push({start,end,text,ruleId:rule,ruleIds:[rule],proof:{version:'2.21',sourceHash:v24SyntaxHash(source),before:source.slice(start,end),contract:{extension:'Cite',method:'complete-literal-reference-graph'},fieldEdits:[{ruleId:rule}],...proof}});
        if(observed.helpers.length||observed.empties.length||nodes.some(node=>{
            const title=v220CitationTitle(source.slice(node.start,node.end));
            return title!=='Referências'&&title!=='!'&&!Object.hasOwn(V221_CITATION_CONSUMERS,title||'');
        }))return [];
        if(!observed.unclosed.length&&observed.refs.every(ref=>ref.valid&&ref.attrs&&ownerSafe(ref.start,ref.end)&&
            Object.keys(ref.attrs).every(key=>['name','group'].includes(key)))){
            for(const definition of observed.refs){
                const decorated=definition.attrs.name,match=typeof decorated==='string'&&/^[“”]([\p{L}\p{N}_.:-]{1,120})[“”]$/u.exec(decorated);
                if(!match||!literalName(match[1])||definition.body===null||!definition.body.trim()||!ownerSafe(definition.start))continue;
                const name=match[1],group=definition.group||'',peers=observed.refs.filter(ref=>ref.group===group&&ref.attrs.name===decorated),
                    ordinary=observed.refs.filter(ref=>ref.group===group&&ref.attrs.name===name);
                if(!ordinary.length||ordinary.some(ref=>ref.body!==null)||peers.filter(ref=>ref.body!==null).length!==1||
                    peers.some(ref=>!ownerSafe(ref.start))||observed.refs.some(ref=>ref.group!==group&&[name,decorated].includes(ref.attrs.name)))continue;
                const graph=observed.refs.map(ref=>({name:ref.attrs.name||'',group:ref.group||'',body:ref.body}));
                for(const peer of peers){const header=source.slice(peer.start,peer.body===null?peer.end:peer.close.start-peer.body.length),
                    re=/\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))/i,m=re.exec(header);
                    if(!m||[m[1],m[2],m[3]].filter(value=>value!==undefined).length!==1)continue;
                    const actual=m[1]??m[2]??m[3];if(actual!==decorated)continue;
                    const at=peer.start+m.index+m[0].indexOf(actual);
                    add(at,at+actual.length,name,'v221ReferenceCurlyIdentity',{graph,from:decorated,to:name,group,bodyHash:v24SyntaxHash(definition.body)});
                }
            }
        }
        // Missing quote: one simple name, the existing > boundary and one
        // complete, nonnested body. No attribute or body text is invented.
        if(edits.length)return edits;
        const malformed=/<ref[ \t]+name[ \t]*=[ \t]*(["'])([\p{L}\p{N}_.:-]{1,120})>/giu;let match;
        while((match=malformed.exec(source))){
            const start=match.index,name=match[2],close=/<\/ref[ \t]*>/gi;close.lastIndex=malformed.lastIndex;
            const end=close.exec(source);if(!end||!literalName(name))continue;
            if(!ownerSafe(start,end.index+end[0].length))continue;
            const body=source.slice(malformed.lastIndex,end.index);
            if(!body.trim()||body.length>8192||/<\s*\/?\s*ref\b/i.test(body)||/[\r\n]/.test(match[0])||v220RawReferenceAttributeBoundary(source,start))continue;
            if(!v220LiteralReferenceBodySafe(body,0,body.length,v24SyntaxProtected(body)))continue;
            const prefix=v219NativeReferenceObserver(source.slice(0,start));
            if(prefix.unclosed.length||prefix.helpers.length||inRange(start,nodes)||/<(?:nowiki|pre|source|syntaxhighlight|code|math)\b|<!--/i.test(body))continue;
            // A literal owner before the opening cannot be escaped by fixing
            // the reference-looking token inside it.
            const literalShield=v24SyntaxProtected(source.slice(0,start));if(literalShield.unclosed?.length||start>0&&inRange(start-1,literalShield.ranges))continue;
            const fixed=source.slice(0,malformed.lastIndex-1)+match[1]+source.slice(malformed.lastIndex-1),next=v219NativeReferenceObserver(fixed),
                all=next.refs.filter(ref=>ref.attrs?.name===name&&ref.group==='');
            if(v24SyntaxScan(fixed).issues.length||next.unclosed.length||next.helpers.length||next.empties.length||!all.length||
                next.refs.some(ref=>!ref.valid)||all.filter(ref=>ref.body!==null).length!==1||all.some(ref=>ref.group!==''))continue;
            const fixedOwnerContext=v221CitationSourceContext(fixed);
            if(next.refs.some(ref=>!v221CitationSourceOwner(fixed,{start:ref.start,end:ref.end},fixedOwnerContext)))continue;
            const target=all.find(ref=>ref.body!==null);if(target.start!==start||target.body!==body||target.attrs.group!==undefined)continue;
            // Prefix comparison is independent of the malformed global quote
            // mask. Closed literal blocks are checked against their raw spans.
            const literal=/(<!--[^]*?-->|<(nowiki|pre|source|syntaxhighlight|code|math)\b[^]*?<\/\2\s*>)/gi;
            if([...source.matchAll(literal)].some(row=>row.index<=start&&start<row.index+row[0].length))continue;
            add(malformed.lastIndex-1,malformed.lastIndex-1,match[1],'v221ReferenceMissingNameQuote',{
                name,group:'',bodyHash:v24SyntaxHash(body),expectedGraph:next.refs.map(ref=>({name:ref.attrs?.name||'',group:ref.group||'',body:ref.body}))});
        }
        return edits.length===1?edits:[];
    }
    function v221CitationTitleRequests(source,cfg={}) {
        if(!v221CitationScope(source,cfg)||cfg.citations===false||cfg.citationRepairs===false||source.length>524288)return [];
        const result=[],ownerContext=v221CitationSourceContext(source);
        for(const node of ownerContext.parsed.nodes){
            if(!v221CitationSourceOwner(source,node,ownerContext))continue;
            const raw=source.slice(node.start,node.end),context=v221CitationConsumer(raw);
            if(!context||!['web','book','news','journal','magazine','conference'].includes(context.kind))continue;
            const titles=v221CitationRoleFields(context.fields,'Title'),dois=v221CitationRoleFields(context.fields,'Identifier:DOI');
            if(titles.length!==1||dois.length!==1||!v213DOI(dois[0].value.trim())||!v221CitationScalar(titles[0].value,600))continue;
            const index=context.fields.indexOf(titles[0]),fragment=context.fields[index+1],after=context.fields[index+2];
            if(!fragment||!after||fragment.positional||v219NativeCitationRoles(fragment.key).length||v221CitationValidExtra(context.title,fragment.key)||
                !v219NativeCitationRoles(after.key).length||!v221CitationScalar(fragment.value,600))continue;
            const unknown=context.fields.filter(field=>!field.positional&&!v219NativeCitationRoles(field.key).length&&!v221CitationValidExtra(context.title,field.key));
            if(unknown.length!==1||unknown[0]!==fragment)continue;
            const tail=raw.slice(fragment.partStart,fragment.partEnd).trim();
            if(!tail.includes('=')||/[{}<>\[\]|\r\n]/.test(tail))continue;
            const expectedTitle=titles[0].value.trim()+' '+tail,
                replacement=v221CitationPadded(titles[0].value,expectedTitle),start=node.start+titles[0].start,end=node.start+fragment.partEnd,
                candidateSource=source.slice(0,start)+replacement+source.slice(end);
            const candidateRaw=raw.slice(0,titles[0].start)+replacement+raw.slice(fragment.partEnd);
            if(!v221COINSTransitionSafe(raw,candidateRaw,cfg))continue;
            result.push({kind:'v221-citation-doi-title-request',source,sourceHash:v24SyntaxHash(source),
                start,end,before:source.slice(start,end),after:replacement,candidateHash:v24SyntaxHash(candidateSource),
                doi:dois[0].value.trim(),expectedTitle,method:'same-DOI-exact-deposited-title'});
        }
        return result;
    }
    function v221CitationTitleMetadataProof(source,request,responseRaw) {
        if(typeof responseRaw!=='string'||responseRaw.length>1048576)return null;
        const fresh=v221CitationTitleRequests(source,{}).find(item=>item.start===request?.start&&item.end===request?.end);
        if(!fresh||JSON.stringify(fresh)!==JSON.stringify(request))return null;
        let data;try{data=JSON.parse(responseRaw);}catch(_){return null;}
        if(data.status!=='ok'||!data.message||typeof data.message.DOI!=='string'||
            data.message.DOI.toLowerCase()!==request.doi.toLowerCase()||!Array.isArray(data.message.title)||
            data.message.title.length!==1||data.message.title[0]!==request.expectedTitle)return null;
        return {kind:'v221-citation-doi-title-proof',source,sourceHash:v24SyntaxHash(source),request,
            responseRaw,metadataSha:v24SyntaxHash(responseRaw)};
    }
    function v221CitationTitleProof(source,request,proof) {
        if(!proof||proof.kind!=='v221-citation-doi-title-proof'||proof.source!==source||proof.sourceHash!==v24SyntaxHash(source)||
            proof.metadataSha!==v24SyntaxHash(proof.responseRaw||''))return false;
        const fresh=v221CitationTitleMetadataProof(source,request,proof.responseRaw);
        return !!fresh&&JSON.stringify(fresh)===JSON.stringify(proof);
    }
    function v221CitationResearchInventory(source,cfg={}) {
        // Internal coverage evidence, never an additional user-facing alert.
        // An unproved role is retained rather than assigned a plausible name.
        if(!v221CitationScope(source,cfg))return [];
        const result=[];
        const record=(id,node,reason)=>result.push({id,start:node.start,end:node.end,sourceHash:v24SyntaxHash(source),
            before:source.slice(node.start,node.end),automatic:false,preserved:true,reason});
        for(const node of templates(source).nodes){
            const raw=source.slice(node.start,node.end),title=v220CitationTitle(raw),context=v221CitationConsumer(raw);
            if(['Citar IUCN','Citar iucn','Citar IUCN doi','Citar iucn doi'].includes(title))record('REF-12',node,'Legacy wrapper and assessment identifier require their own native consumer; removing a DOI prefix cannot repair a page3.1 module failure.');
            if(!context)continue;
            for(const field of context.fields){
                if(['número-artigo','numero-artigo','article-number'].includes(field.key))record('REF-STUDY-01',node,'Article identifier is not a page locator or a total page count.');
                if(v221CitationRole(field,'URL')&&/^\s*\[https?:\/\//.test(field.value))record('REF-STUDY-02',node,'The link label has no proved destination field; preserve it with the URL.');
                if(context.kind==='journal'&&field.key==='aspas'&&field.value.trim()!=='não')record('CEX-S01',node,'Native formatting option is not a quotation-text alias.');
                if(v221CitationRole(field,'DeadURL')&&/^\s*https?:\/\//.test(field.value))record('CEX-S02',node,'An address in a URL-state field does not declare live/dead status.');
                if(['nome','nascimento','data_nascimento','imagem_tamanho','nascimento_local'].includes(field.key))record('CEX-S03',node,'Possible swallowed owner requires an independently proved template boundary.');
                if(['url-status','statusurl','urlmorto'].includes(field.key)&&/^(?:sim|não|yes|no|true|false|1|0)$/.test(field.value.trim()))record('CEX-S04',node,'A translated boolean in an ignored status field does not prove the source role.');
                if(v221CitationRole(field,'ChapterUrlAccess')||v221CitationRole(field,'MapUrlAccess'))record('CEX-S05',node,'Accepted access metadata may require a native module change; do not move it to general URL access.');
                if(['pmid','PMC','pmc','arxiv','oclc'].includes(field.key)&&/^(?:PMID|PMC|arXiv|OCLC|https?:)/i.test(field.value.trim()))record('CEX-S06',node,'Existing identifier contracts remain authoritative; no new broad prefix rule is inferred.');
            }
        }
        const observer=v219NativeReferenceObserver(source);
        if(observer.unclosed.length)result.push({id:'REF-03',start:observer.unclosed[0].start??0,end:source.length,
            sourceHash:v24SyntaxHash(source),automatic:false,preserved:true,
            reason:'An opaque or incomplete owner remains protected; citation deduplication cannot bypass whole-source preservation.'});
        return result;
    }
    function v221CitationMigrationSafe(before,after,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string')return false;
        if(before===after)return true;
        const old=v221CitationConsumer(before),literalTitle=v220CitationTitle(before),
            guarded=old||Object.hasOwn(V221_CITATION_CONSUMERS,literalTitle||'')||translationProfile(before)?.kind==='citation',
            fields=guarded?v220CitationFields(before):null,nextFields=guarded?v220CitationFields(after):null;
        const groups=new Map(),signature=entries=>JSON.stringify(entries.map(field=>[field.key,field.value]));
        for(const field of fields||[]){
            const descriptor=v221CitationEditorRole(field.key);if(!descriptor)continue;
            const key=descriptor.role+':'+descriptor.index;
            if(!groups.has(key))groups.set(key,[]);groups.get(key).push(field);
        }
        for(const [key,entries]of groups){
            if(entries.length<2)continue;
            if(!nextFields||v220CitationTitle(after)!==literalTitle||signature(entries)!==signature(nextFields.filter(field=>{
                const descriptor=v221CitationEditorRole(field.key);return descriptor&&descriptor.role+':'+descriptor.index===key;
            })))return false;
        }
        const states=fields?v221CitationStateFields({fields}):[];
        if(states.length>1&&(!nextFields||v220CitationTitle(after)!==literalTitle||
            signature(states)!==signature(v221CitationStateFields({fields:nextFields}))))return false;
        const migrated=v221CitationArchiveSafetyContext(after);
        if(migrated&&!v221CitationOriginalAccessSafe(migrated))return false;
        if(guarded&&!migrated&&nextFields&&
            v221CitationRoleFields(nextFields,'ArchiveURL').some(field=>v221CitationNativeTrim(field.value))&&
            v221CitationRoleFields(nextFields,'UrlAccess').some(field=>v221CitationNativeTrim(field.value)))return false;
        if(!v221COINSTransitionSafe(before,after,cfg)){
            const legacy=v221BaselineCitationCall220(before,cfg),current=legacy?.text===after?null:v221CitationCall(before,cfg),
                fields=legacy?.text===after||current?.text===after?null:v221BaselineReferenceCall213(before,cfg),
                proof=legacy?.text===after?{kind:'literal-pipe',edits:legacy.fieldEdits}:current?.text===after?{kind:'edition',edits:current.fieldEdits}:
                    fields?.text===after?{kind:'url-quotes',edits:fields.changes}:null;
            if(!proof||!v221COINSTransitionSafe(before,after,cfg,proof))return false;
        }
        if(!old)return true;
        const hasLanguage=context=>context.fields.some(field=>field.value.trim()&&(v221CitationRole(field,'Language')||
            context.kind==='tweet'&&['language','língua','lingua','linguagem','idioma'].includes(field.key)));
        const protectedKeys=['número-artigo','numero-artigo','article-number','ignore-isbn-error','ignore-isbn','ignoreisbnerror'],
            next=v221CitationConsumer(after);
        if(!next||next.title!==old.title)return !old.map.has('loc')&&!hasLanguage(old)&&!protectedKeys.some(key=>old.map.has(key));
        if(old.map.has('loc')&&!next.map.has('loc'))return false;
        if(hasLanguage(old)&&!hasLanguage(next))return false;
        // Article identifiers, language and checksum overrides are not aliases
        // of page counts, publication places or disposable diagnostics.
        for(const key of protectedKeys){
            const field=old.map.get(key);if(field&&(!next.map.has(key)||next.map.get(key).value!==field.value))return false;
        }
        return true;
    }
    function v221CitationValidExtra(title,key) {
        const accepted=V221_CITATION_EXTRA_FIELDS[title];
        if(accepted?.includes(key))return true;
        if(title==='Citar jogo eletrônico'&&/^(?:desenvolvedor|developer|produtor|desenvolvedora)[1-9]\d?$/.test(key))return true;
        if(Object.hasOwn(V221_CITATION_CONSUMERS,title)&&!['tweet','patent'].includes(V221_CITATION_CONSUMERS[title])&&['ignore-isbn-error','ignore-isbn','ignoreisbnerror'].includes(key))return true;
        return false;
    }
    function v221FilterCitationSuggestions(source,findings,cfg={}) {
        if(!Array.isArray(findings))return findings;
        return findings.filter(finding=>{
            const group=finding?.reviewGroup;if(group?.kind!=='unsupported-template-parameter')return true;
            if(typeof finding.before!=='string'||!Number.isInteger(finding.start)||!Number.isInteger(finding.end)||source.slice(finding.start,finding.end)!==finding.before)return true;
            const title=v220CitationTitle(finding.before),key=group.parameter;
            if(typeof key!=='string'||!title)return true;
            if(v221CitationValidExtra(title,key))return false;
            const owned=!!v221CitationConsumer(finding.before)||title==='Convert'||
                ['Harvnb','Harvtxt','Sfnm'].includes(title)||
                translationProfile(finding.before)?.kind==='citation';
            if(!owned)return true;
            // Unsupported-field offers are not semantic evidence. Do not offer
            // Levenshtein renames or deletion of a populated unknown field.
            // Exact finite repairs have already been attempted by the plan.
            return false;
        });
    }
    function v221FilterCitationWarnings(source,warnings,cfg={}) {
        if(!Array.isArray(warnings))return warnings;
        return warnings.filter(message=>{
            if(typeof message!=='string')return true;
            let match=/^Parâmetro fora do catálogo de (.+?): (.+?)\. Valor preservado\.$/.exec(message),title,key;
            if(match){title=match[1];key=match[2];}
            else{match=/^Parâmetro de citação fora do catálogo: (.+?) em (.+?)\.$/.exec(message);if(match){key=match[1];title=match[2];}}
            if(!title||!key)return true;
            const canonical=title.charAt(0).toUpperCase()+title.slice(1);
            return !v221CitationValidExtra(canonical,key);
        });
    }
