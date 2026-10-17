    // Native CS1 configuration 73016847 confirms the target alias families.
    // Whitelist revision 71860752 identifies the reviewed deprecated spellings.
    const V218_LEGACY_CITATION_KEYS=Object.freeze({
        accessadoem:{target:'acessodata',kind:'access',family:['acesso','acessodata','acesso-data','accessodata',
            'acessadoem','dataacesso','accessdate','access-date','fechaacceso','consulta','acessdate','accessadoem']},
        Autorlink:{target:'autorlink',kind:'author-link',family:['autorlink','autor-link','entrevistadolink',
            'authorlink','author-link','subjectlink','subject-link','sujeitolink','Autorlink']},
        'Colecção':{target:'coleção',kind:'series',family:['series','serie','série','séries','coleção',
            'Coleção','colecao','versão','version','Colecção']},
        Editora:{target:'editora',kind:'publisher',deprecated:true,sameAliasFamily:true,
            family:['publicado','produtora','editora','Editora','instituição','instituicao','universidade',
                'publisher','grupo-noticias','distributor','institution','newsgroup','editorial','publicadopor','publicado por']},
        'Título':{target:'título',kind:'title',deprecated:true,sameAliasFamily:true,
            family:['titulo','título','title','titlo','Título']},
        'Página':{target:'página',kind:'page',deprecated:true,sameAliasFamily:false,
            family:['pagina','página','page','p','Página','paginas','pp','páginas','pages']},
        'Local de publicação':{target:'local-publicação',kind:'publication-place',deprecated:true,sameAliasFamily:false,
            family:['publication-place','publicationplace','local-publicação','local-publicacao',
                'lugar-publicación','Local publicação','Local de publicação']},
        'Subtítulo':{target:'subtítulo',kind:'title-note',deprecated:true,sameAliasFamily:true,
            family:['departamento','subtitulo','subtítulo','Subtítulo','department']},
        'Edição':{target:'edição',kind:'edition',deprecated:true,sameAliasFamily:true,
            family:['edicao','edition','edição','ed','Edição','edición']}
    });
    function v218CitationKeyScope(source,options={}) {
        const cfg={...DEFAULTS,...options};
        return typeof source==='string'&&source.length<=4194304&&cfg.citations!==false&&
            cfg.automaticParameterNames!==false&&cfg.automaticCitationKeyRepairs!==false&&
            cfg.namespaceNumber===0&&!cfg.sectionOnly&&(!cfg.contentModel||cfg.contentModel==='wikitext')&&
            v20AutomationAllowed(source,cfg)&&!v24SyntaxScan(source).issues.length;
    }
    function v218CitationKeyValue(field,rule) {
        if(!field.value.trim()||field.value.length>4096)return false;
        if(rule.kind==='access')return !!v218CitationDateValue(field.value,'access');
        if(rule.kind==='author-link')return field.value.trim().length<=255&&
            !/[{}\[\]<>|#\r\n\uE000]/.test(field.value)&&!/^https?:/i.test(field.value.trim());
        return !/[{}<>\uE000\r\n]/.test(field.value);
    }
    function v218CitationKeyEdits(source,options={}) {
        if(typeof source!=='string'||source.length>4194304)return [];
        const namedCandidate=/\|\s*(?:accessadoem|Autorlink|Colecção|Editora|Título|Página|Local de publicação|Subtítulo|Edição)\s*=/.test(source);
        let yearCandidate=false;
        if(!namedCandidate)for(const match of source.matchAll(/\|\s*(?:ano|year)\s*=\s*([^|{}<>\r\n]*)/g)){
            const value=match[1].trim(),numbers=value.match(/\d+/g)||[];
            if(numbers.length>=3||numbers.length>=2&&/\p{L}/u.test(value)){yearCandidate=true;break;}
        }
        if(!namedCandidate&&!yearCandidate)return [];
        const cfg={...DEFAULTS,...options};if(!v218CitationKeyScope(source,cfg))return [];
        const view=protectedView(source),sourceHash=v24SyntaxHash(source),edits=[];
        for(const node of templates(view).nodes){
            const raw=source.slice(node.start,node.end),context=v218CitationNativeContext(raw);
            if(!context)continue;const {parsed,native,profile}=context;
            const fields=v2151FieldSyntaxParts(raw);if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))continue;
            for(const field of fields){
                const rule=Object.hasOwn(V218_LEGACY_CITATION_KEYS,field.key)?V218_LEGACY_CITATION_KEYS[field.key]:null;
                if(!rule||(!rule.deprecated&&nativeCitationAccepts(native,field.key))||!nativeCitationAccepts(native,rule.target)||
                    fields.filter(other=>rule.family.some(key=>norm(key)===norm(other.key))).length!==1||!v218CitationKeyValue(field,rule))continue;
                if(rule.kind==='author-link'&&fields.some(other=>
                    /^(?:autorlink|autor-link|entrevistadolink|authorlink|author-link|subjectlink|subject-link|sujeitolink)1$/.test(other.key)||
                    /^(?:author|subject)1-?link$/.test(other.key)))continue;
                edits.push({start:node.start+field.keyStart,end:node.start+field.keyEnd,text:rule.target,
                    ruleId:'v218LegacyCitationKeys',proof:{sourceHash,template:parsed.name,nativeTemplate:native.name,
                        nativeTemplateOldid:profile.oldid,
                        sourceKey:field.key,targetKey:rule.target,value:field.value,
                        nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,
                        deprecated:!!rule.deprecated,sameAliasFamily:!!rule.sameAliasFamily,
                        changeRules:['v218LegacyCitationKeys'],minorSafe:rule.sameAliasFamily===true,
                        method:rule.deprecated?'exact-deprecated-key; reviewed-native-target; unique-family; value-bytes-retained':
                            'exact-unknown-key; reviewed-native-target; unique-family; value-bytes-retained'}});
            }
            if(cfg.dates!==false){
                const years=fields.filter(field=>V218_CITATION_DATE_FAMILIES.year.some(key=>norm(key)===norm(field.key))),
                    dates=fields.filter(field=>V218_CITATION_DATE_FAMILIES.date.some(key=>norm(key)===norm(field.key)));
                if(years.length===1&&!dates.length&&['ano','year'].includes(years[0].key)&&
                    nativeCitationAccepts(native,years[0].key)&&nativeCitationAccepts(native,'data')&&
                    !/[{}\[\]<>|\r\n\uE000]/.test(years[0].value)){
                    const field=years[0],value=v218CitationDateValue(field.value,'date');
                    if(value?.precision==='day')edits.push({start:node.start+field.keyStart,end:node.start+field.keyEnd,text:'data',
                        ruleId:'v218LegacyCitationKeys',proof:{sourceHash,template:parsed.name,nativeTemplate:native.name,
                            nativeTemplateOldid:profile.oldid,sourceKey:field.key,targetKey:'data',
                            value:field.value,identity:value.identity,precision:'day',nativeConfigOldid:73016847,
                            changeRules:['v218LegacyCitationKeys'],minorSafe:false,
                            method:'complete-valid-literal-date-in-year; no-date-or-year-alias-collision; value-bytes-retained'}});
                }
            }
        }
        return edits.sort((a,b)=>a.start-b.start||a.end-b.end);
    }
    function v218CitationKeyPlan(source,options={}) {
        const edits=v218CitationKeyEdits(source,options);
        return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v218CitationKeyProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v218CitationKeyPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
