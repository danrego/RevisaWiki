    // Current native MediaWiki image-option aliases, read through siteinfo.
    const V219_NATIVE_IMAGE_OPTIONS=Object.freeze({"img_baseline":["linhadebase","baseline"],"img_border":["borda","border"],"img_bottom":["abaixo","bottom"],"img_center":["centro","center","centre"],"img_framed":["commoldura","comborda","frame","framed","enframed"],"img_frameless":["semmoldura","semborda","frameless"],"img_left":["esquerda","left"],"img_link":["ligação=$1","link=$1"],"img_manualthumb":["miniaturadaimagem=$1","miniatura=$1","thumbnail=$1","thumb=$1"],"img_middle":["meio","middle"],"img_none":["nenhum","none"],"img_page":["página=$1","página_$1","página $1","page=$1","page $1"],"img_right":["direita","right"],"img_thumbnail":["miniaturadaimagem","miniatura","thumb","thumbnail"],"img_top":["acima","top"],"img_upright":["superiordireito","superiordireito=$1","superiordireito_$1","superiordireito $1","upright","upright=$1","upright $1"],"img_lossy":["lossy=$1"],"img_alt":["alt=$1"],"img_class":["class=$1"],"img_lang":["lang=$1"],"img_sub":["sub"],"img_super":["super","sup"],"img_text_bottom":["text-bottom"],"img_text_top":["text-top"],"img_width":["$1px"]});
    function v219ImageAliasContract(alias,rule) {
        if(typeof alias!=='string'||!rule||typeof rule.target!=='string'||typeof rule.kind!=='string'||
            !Object.hasOwn(V219_NATIVE_IMAGE_OPTIONS,rule.kind)||!V219_NATIVE_IMAGE_OPTIONS[rule.kind].includes(rule.target))return false;
        const source=alias.match(/\$\d+/g)||[],target=rule.target.match(/\$\d+/g)||[];
        if(source.length!==target.length||source.length>1||[...source,...target].some(token=>token!=='$1')||
            alias.replaceAll('$1','').includes('$')||rule.target.replaceAll('$1','').includes('$'))return false;
        return source.length===0||alias!=='$1';
    }
    function v219NativeImageOption(raw) {
        if(typeof raw!=='string')return false;
        const option=raw.trim();
        for(const [kind,aliases]of Object.entries(V219_NATIVE_IMAGE_OPTIONS))for(const alias of aliases){
            if(!alias.includes('$1')){if(option===alias)return true;continue;}
            const [prefix,suffix]=alias.split('$1');
            if(!option.startsWith(prefix)||!option.endsWith(suffix)||option.length<prefix.length+suffix.length)continue;
            const value=option.slice(prefix.length,suffix?option.length-suffix.length:undefined);
            if(kind!=='img_width'||/^(?:\d+(?:x\d+)?|x\d+)$/.test(value))return true;
        }
        return false;
    }
    function v219TranslatedImageOption(alias,rule,raw) {
        if(typeof raw!=='string'||!v219ImageAliasContract(alias,rule))return null;
        const padding=/^([ \t]*)([\s\S]*?)([ \t]*)$/.exec(raw),option=padding[2];
        if(!alias.includes('$1'))return option===alias?(v219NativeImageOption(raw)?raw:padding[1]+rule.target+padding[3]):null;
        const [prefix,suffix]=alias.split('$1');
        if(!option.startsWith(prefix)||!option.endsWith(suffix)||option.length<prefix.length+suffix.length)return null;
        const value=option.slice(prefix.length,suffix?option.length-suffix.length:undefined);
        if(rule.kind==='img_width'&&!/^(?:\d+(?:x\d+)?|x\d+)$/.test(value))return null;
        if(v219NativeImageOption(raw))return raw;
        // A callback replacement retains literal dollar sequences in the value.
        return padding[1]+rule.target.replace('$1',()=>value)+padding[3];
    }
    const V219_OFFICIAL_SITE_CONTRACTS=Object.freeze({
        en:{templateOldid:1323412465,moduleOldid:1324548572,keys:['1','2','URL','url','name']},
        fr:{templateOldid:196984653,moduleOldid:235384911,keys:['1','2','titre','title','langue','lang','url']}
    });
    const V219_OFFICIAL_LANGUAGES=new Set(['ar','cs','da','de','el','en','es','fi','fr','he','it','ja','ko','nl',
        'no','pl','pt','pt-BR','pt-PT','ro','ru','sv','tr','uk','vi','zh','zh-Hans','zh-Hant']);
    function v219OfficialSiteFields(raw) {
        if(!v215LiteralTemplateIdentity(raw))return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts||parts.length<2)return null;
        const fields=[];let next=1;
        for(const part of parts.slice(1)){
            const match=/^([ \t]*)([^=\r\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);
            if(match){
                const key=match[2].trim();if(!/^(?:[1-9]\d*|[A-Za-z]+)$/.test(key))return null;
                fields.push({key,value:match[4],explicit:true,partStart:2+part.start});
            }else fields.push({key:String(next++),value:part.text,explicit:false,partStart:2+part.start});
        }
        if(fields.some(field=>/[{}<>\uE000-\uF8FF\r\n]/.test(field.value)||!field.value.trim())||
            new Set(fields.map(field=>field.key)).size!==fields.length)return null;
        return fields;
    }
    function v219OfficialSiteCall(raw,cfg={}) {
        if(v219OtherNativeHeader(raw)?.record.kind==="official")return v219OtherNativeCall(raw,cfg);
        const profile=translationProfile(raw);if(!profile||profile.kind!=='official'||!translationEnabled(profile,cfg))return null;
        // The reviewed Spanish wrapper prepends a list marker and has a
        // different named-argument interface. A bare rename cannot preserve it.
        if(profile.source?.language==='es')return {profile,candidate:raw,text:raw,blocked:true,
            quietNativeRefusal:true,issues:[],issueEvidence:[]};
        const language=profile.source?.language,
            contract=Object.hasOwn(V219_OFFICIAL_SITE_CONTRACTS,language)?V219_OFFICIAL_SITE_CONTRACTS[language]:null;
        if(!contract)return null;
        const blocked=()=>({profile,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[]});
        if(profile.source.oldid!==contract.templateOldid||TEMPLATE_CATALOG.oficial?.oldid!==70230751||
            norm(profile.target)!=='oficial')return blocked();
        const fields=v219OfficialSiteFields(raw);
        if(!fields||fields.some(field=>!contract.keys.includes(field.key)))return blocked();
        const by=key=>fields.filter(field=>field.key===key),get=keys=>fields.filter(field=>keys.includes(field.key));
        let urls,labels,languages=[];
        if(profile.source.language==='en'){
            urls=get(['1','URL','url']);labels=get(['2','name']);
        }else{
            const second=by('2');urls=get(second.length?['2','url']:['1','url']);labels=get(['titre','title']);
            languages=get(['langue','lang']);
            if(second.length&&by('1').length)languages.push(...by('1'));
        }
        if(urls.length!==1||labels.length>1||languages.length>1||
            !v213LiteralURL(urls[0].value.trim())||
            labels.some(field=>/[\[\]|]/.test(field.value))||
            languages.some(field=>!V219_OFFICIAL_LANGUAGES.has(field.value.trim()))||
            new Set([...urls,...labels,...languages]).size!==fields.length)return blocked();
        const candidate='{{Oficial|1='+urls[0].value+(labels.length?'|nome='+labels[0].value:'')+
            (languages.length?'|2='+languages[0].value:'')+'}}';
        return {profile,candidate,text:candidate,blocked:false,issues:[],issueEvidence:[],proof:{
            sourceHash:v24SyntaxHash(raw),sourceTemplateOldid:contract.templateOldid,sourceModuleOldid:contract.moduleOldid,
            nativeTemplateOldid:70230751,url:urls[0].value,label:labels[0]?.value??null,language:languages[0]?.value??null,
            method:'literal-URL; language-specific numeric argument roles; no competing or dropped fields; value-bytes-retained'}};
    }

    // Canonical foreign names and explicit namespaces have verified identities.
    // The finite alias record, rather than an unrelated same-title profile,
    // determines the language and formatter used for that invocation.
    const V219_FOREIGN_IDENTITIES=Object.freeze({
        'шаблон:примітки':{prefix:'шаблон',title:'Примітки',language:'uk',sourceTitle:'Шаблон:Reflist',
            oldid:44146530,aliasOldid:10775480,kind:'renderer',target:'Referências'},
        'template:примітки':{prefix:'template',title:'Примітки',language:'uk',sourceTitle:'Шаблон:Reflist',
            oldid:44146530,aliasOldid:10775480,kind:'renderer',target:'Referências'},
        'format:reflist':{prefix:'format',title:'Reflist',language:'ro',sourceTitle:'Format:Listănote',
            oldid:17208405,aliasOldid:6825700,kind:'renderer',target:'Referências'},
        'skabelon:cite news':{prefix:'skabelon',title:'Cite news',language:'da',sourceTitle:'Skabelon:Kilde nyheder',
            oldid:11752300,aliasOldid:11759544,kind:'citation',target:'Citar jornal',citationClass:'news'},
        'kilde nyheder':{prefix:'',title:'Kilde nyheder',language:'da',sourceTitle:'Skabelon:Kilde nyheder',
            oldid:11752300,kind:'citation',target:'Citar jornal',citationClass:'news'},
        'skabelon:kilde nyheder':{prefix:'skabelon',title:'Kilde nyheder',language:'da',sourceTitle:'Skabelon:Kilde nyheder',
            oldid:11752300,kind:'citation',target:'Citar jornal',citationClass:'news'},
        'template:kilde nyheder':{prefix:'template',title:'Kilde nyheder',language:'da',sourceTitle:'Skabelon:Kilde nyheder',
            oldid:11752300,kind:'citation',target:'Citar jornal',citationClass:'news'},
        'استشهاد بخبر':{prefix:'',title:'استشهاد بخبر',language:'ar',sourceTitle:'قالب:استشهاد بخبر',
            oldid:70513200,kind:'citation',target:'Citar jornal',citationClass:'news'},
        'قالب:استشهاد بخبر':{prefix:'قالب',title:'استشهاد بخبر',language:'ar',sourceTitle:'قالب:استشهاد بخبر',
            oldid:70513200,kind:'citation',target:'Citar jornal',citationClass:'news'},
        'template:استشهاد بخبر':{prefix:'template',title:'استشهاد بخبر',language:'ar',sourceTitle:'قالب:استشهاد بخبر',
            oldid:70513200,kind:'citation',target:'Citar jornal',citationClass:'news'},
        'قالب:استشهاد بدورية':{prefix:'قالب',title:'استشهاد بدورية',language:'ar',sourceTitle:'قالب:استشهاد بدورية محكمة',
            oldid:70513238,aliasOldid:45399100,kind:'citation',target:'Citar periódico'},
        'template:استشهاد بدورية':{prefix:'template',title:'استشهاد بدورية',language:'ar',sourceTitle:'قالب:استشهاد بدورية محكمة',
            oldid:70513238,aliasOldid:45399100,kind:'citation',target:'Citar periódico'},
        'قالب:استشهاد ويب':{prefix:'قالب',title:'استشهاد ويب',language:'ar',sourceTitle:'قالب:استشهاد بويب',
            oldid:70331151,aliasOldid:68945133,kind:'citation',target:'Citar web'},
        'template:استشهاد ويب':{prefix:'template',title:'استشهاد ويب',language:'ar',sourceTitle:'قالب:استشهاد بويب',
            oldid:70331151,aliasOldid:68945133,kind:'citation',target:'Citar web'}
    });
    function v219ForeignTemplateContract(raw) {
        if(v219CitationHeaderControlRefusal(raw)||v219LocalCitationWrapperProfile(raw))return null;
        if(v219OtherNativeWrapper(raw)||v219ForeignInfoboxRefusal(raw))return null;
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return null;
        const parts=splitParts(raw.slice(2,-2)),literal=parts[0].replace(/_/g,' ').trim().replace(/[ \t]+/g,' ');
        if(/[{}<>\uE000-\uF8FF\r\n]/.test(literal))return null;
        const pair=/^([^:]+)[ \t]*:[ \t]*(.+)$/.exec(literal),prefix=pair?norm(pair[1]):'',title=pair?pair[2]:literal,
            key=prefix?prefix+':'+norm(title):norm(title),contract=Object.hasOwn(V219_FOREIGN_IDENTITIES,key)?V219_FOREIGN_IDENTITIES[key]:null,
            direct=Object.hasOwn(TRANSLATION_RULES.profiles,key)?TRANSLATION_RULES.profiles[key]:null;
        if(!contract||!direct||prefix!==contract.prefix||!v215SameTemplateTitle(title,contract.title)||
            direct.kind!==contract.kind||direct.source?.language!==contract.language||
            direct.source.title!==contract.sourceTitle||direct.source.oldid!==contract.oldid)return null;
        return {contract,profile:direct};
    }
    function v219ForeignTemplateIdentity(raw,profile=null) {
        const verified=v219ForeignTemplateContract(raw);if(!verified)return false;
        return !profile||profile.kind===verified.profile.kind&&profile.source?.language===verified.contract.language&&
            profile.source.title===verified.contract.sourceTitle&&profile.source.oldid===verified.contract.oldid;
    }
    const V219_ADDITIONAL_NATIVE_CITATION_REDIRECTS=Object.freeze([
        {title:'Cite document',target:'citar periódico',oldid:49638207,nativeOldid:48090957},
        {title:'Literatur',target:'citar livro',oldid:50300652,nativeOldid:48159689},
        {title:'Cite press release',target:'citar comunicado de imprensa',oldid:47999283,nativeOldid:50506646},
        {title:'Cite conference',target:'citar conferência',oldid:46323680,nativeOldid:48055134},
        {title:'Cite report',target:'citar relatório',oldid:43688061,nativeOldid:62084675},
        {title:'Cite video',target:'citar vídeo',oldid:46315058,nativeOldid:62110903},
        {title:'Cite encyclopedia',target:'citar enciclopédia',oldid:48139752,nativeOldid:60787857},
        {title:'Cite thesis',target:'citar tese',oldid:48242328,nativeOldid:47976404},
        {title:'Cite tweet',target:'citar tweet',oldid:69618892,nativeOldid:69618888},
        {title:"Cite mailing list",target:"citar lista de discussão",oldid:48177436,nativeOldid:48176673,headerOnly:true},
        {title:"Cite newsgroup",target:"citar grupo de notícias",oldid:48196873,nativeOldid:48196367,headerOnly:true},
        {title:"Cite arXiv",target:"citar arxiv",oldid:43684360,nativeOldid:48010014,headerOnly:true},
        {title:"Cite interview",target:"citar entrevista",oldid:50402950,nativeOldid:47983577,headerOnly:true},
        {title:"Cite video game",target:"citar jogo eletrônico",oldid:35742661,nativeOldid:60995971,headerOnly:true},
        {title:"Cite episode",target:"citar episódio",oldid:46303217,nativeOldid:62839800,headerOnly:true},
        {title:"Cite map",target:"citar mapa",oldid:43722190,nativeOldid:48071490,headerOnly:true},
        {title:"Cite AV media notes",target:"citar vídeo notas",oldid:43930637,nativeOldid:48176821,headerOnly:true},
        {title:"Cite podcast",target:"citar podcast",oldid:47922510,nativeOldid:48176728,headerOnly:true},
        {title:"Cite techreport",target:"citar relatório técnico",oldid:47934705,nativeOldid:47965559,headerOnly:true},
        {title:"Cite speech",target:"citar discurso",oldid:56253593,nativeOldid:48055150,headerOnly:true},
        {title:"Cite Rotten Tomatoes",target:"citar rotten tomatoes",oldid:66460182,nativeOldid:71797055,headerOnly:true},
        {"title":"Cita web","target":"citar web","oldid":46255581,"nativeOldid":48262420},
        {"title":"Cita libro","target":"citar livro","oldid":46290037,"nativeOldid":48159689},
        {"title":"Lien web","target":"citar web","oldid":46288422,"nativeOldid":48262420},
        {"title":"Cita noticia","target":"citar jornal","oldid":50501995,"nativeOldid":55834874},
        {"title":"Ouvrage","target":"citar livro","oldid":50471877,"nativeOldid":48159689},
        {"title":"Cita news","target":"citar jornal","oldid":48241789,"nativeOldid":55834874},
        {"title":"Citeer web","target":"citar web","oldid":46020381,"nativeOldid":48262420},
        {"title":"Article","target":"citar periódico","oldid":49638218,"nativeOldid":48090957},
        {"title":"Webbref","target":"citar web","oldid":50271270,"nativeOldid":48262420},
    ]);
    function v219LocalCitationRedirectProfile(raw) {
        if(v219CitationHeaderControlRefusal(raw))return null;
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return null;
        const literal=v219ReaderLiteralHeader(raw);
        if(literal!==null&&!v219TitleRecordLookup(literal.trim(),v219CitationRedirectRecords()))return null;
        const parts=splitParts(raw.slice(2,-2)),header=parts[0].trim();
        if(/[{}<>\uE000-\uF8FF\r\n]/.test(header))return null;
        const contract=v219TitleRecordLookup(header,v219CitationRedirectRecords());
        if(!contract)return null;
        const native=TEMPLATE_CATALOG[contract.target];
        if(!native||(contract.nativeOldid||V218_CITATION_ISLAND_CONTRACTS[contract.target])!==native.oldid)return null;
        // A verified local redirect forwards the native interface unchanged.
        // It must not inherit a same-spelled profile from another language.
        return {kind:'citation',target:native.title,fields:{},numbered:{},v219LocalCitationRedirect:true,
            nativeAliasOldid:contract.oldid,nativeTemplateOldid:native.oldid,
            source:{language:'pt',title:'Predefinição:'+contract.title,oldid:contract.oldid}};
    }
    function v219LocalCitationRedirectIdentity(raw,profile=null) {
        const verified=v219LocalCitationRedirectProfile(raw);if(!verified)return false;
        return !profile||profile.v219LocalCitationRedirect===true&&profile.target===verified.target&&
            profile.nativeAliasOldid===verified.nativeAliasOldid;
    }
    function v219LocalCitationRedirectCall(raw,cfg={},profile=null) {
        const verified=v219LocalCitationRedirectProfile(raw);if(!verified||!translationEnabled(verified,cfg)||
            profile&&!v219LocalCitationRedirectIdentity(raw,profile))return null;
        const parts=splitParts(raw.slice(2,-2)),header=parts[0],padding=/^(\s*)[\s\S]*?(\s*)$/.exec(header),
            nativeRaw='{{'+padding[1]+verified.target+padding[2]+raw.slice(2+header.length),
            blocked=()=>({profile:verified,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[]});
        let candidate=nativeRaw,composed=false;
        // Canonicalizing the header must not expose a safe mixed-field repair
        // only on a later click. Reuse the canonical native transaction now,
        // while retaining every already accepted native argument verbatim.
        const contract=[...V219_NATIVE_CITATION_REDIRECTS,...V219_ADDITIONAL_NATIVE_CITATION_REDIRECTS].find(item=>item.oldid===verified.nativeAliasOldid),
            continuation=cfg.automaticParameterNames===false||contract?.headerOnly?null:migrateForeignTemplate(nativeRaw,cfg);
        if(continuation){
            if(continuation.blocked||continuation.issues?.length)return {profile:verified,candidate:nativeRaw,text:nativeRaw,
                blocked:false,issues:[],issueEvidence:[],proof:{sourceHash:v24SyntaxHash(raw),
                    nativeAliasOldid:verified.nativeAliasOldid,nativeTemplateOldid:verified.nativeTemplateOldid,
                    composedNativeMigration:false,method:'exact pinned local native redirect; header-only forwarding; optional unproved continuation refused; every argument byte retained'}};
            const nativeParsed=parsedTemplate(nativeRaw),after=splitParts(continuation.text.slice(2,-2));
            if(after.length!==parts.length||!v215SameTemplateTitle(after[0],verified.target))return {profile:verified,candidate:nativeRaw,text:nativeRaw,
                blocked:false,issues:[],issueEvidence:[],proof:{sourceHash:v24SyntaxHash(raw),nativeAliasOldid:verified.nativeAliasOldid,
                    nativeTemplateOldid:verified.nativeTemplateOldid,composedNativeMigration:false,
                    method:'exact pinned local native redirect; optional continuation changes argument shape; header-only forwarding retains every raw argument byte'}};
            for(const entry of foreignEntries(nativeParsed))if(!entry.positional&&nativeCitationAccepts(nativeParsed,entry.key))
                after[entry.index]=parts[entry.index];
            candidate='{{'+after.join('|')+'}}';composed=candidate!==nativeRaw;
        }
        return {profile:verified,candidate,text:candidate,blocked:false,issues:[],issueEvidence:[],proof:{
            sourceHash:v24SyntaxHash(raw),nativeAliasOldid:verified.nativeAliasOldid,
            nativeTemplateOldid:verified.nativeTemplateOldid,composedNativeMigration:composed,
            method:'verified local redirect; native interface; accepted argument bytes retained; bounded canonical native continuation composed in the same action'}};
    }
    function v219NativeMixedParameterRefusal(raw,profile,cfg={}) {
        if(cfg.automaticParameterNames!==false||profile?.source?.language!=='mixed'||
            !['citation','infobox'].includes(profile.kind)||typeof raw!=='string')return null;
        const parsed=parsedTemplate(raw),native=(profile.kind==='citation'?TEMPLATE_CATALOG:INFOBOX_CATALOG)[parsed.name];
        if(!native||!v215SameTemplateTitle(parsed.parts[0],native.title))return null;
        return {profile,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[],proof:{
            sourceHash:v24SyntaxHash(raw),nativeTemplateOldid:native.oldid,
            method:'native template; mixed parameter-name adaptation explicitly disabled; original argument bytes retained'}};
    }
    function v219TranslationProfile(raw,legacy) {
        const controlledHeader=v219CitationHeaderControlRefusal(raw);if(controlledHeader)return controlledHeader.profile;
        const wrapper=v219LocalCitationWrapperProfile(raw);if(wrapper)return wrapper;
        const local=v219LocalCitationRedirectProfile(raw);if(local)return local;
        if(v219NativeCitationStateInterface(raw)){
            const parsed=parsedTemplate(raw),native=TEMPLATE_CATALOG[parsed.name];
            if(['citar web','citar livro','citar jornal','citar periódico','citar revista'].includes(parsed.name)){
                const canonical='{{'+native.title+raw.slice(2+parsed.parts[0].length),profile=v281LegacyTranslationProfile(canonical);
                return v219NativeMixedCitationIdentity(raw,profile)?profile:null;
            }
        }
        const verified=v219ForeignTemplateContract(raw);if(!verified)return legacy;
        const {contract,profile}=verified;
        return contract.citationClass?{...profile,target:contract.target,strictNativeCitation:true}:profile;
    }

    const V219_NUMBERED_CITATION_ROLES=Object.freeze({
        autor:['author-last',['autor','cognome','ultimo','último','sobrenome','author','last','surname','author-last',
            'subject','Autor','apelido','apellido','apellidos','sujeito','entrevistado','host']],
        'último':['author-last',['autor','cognome','ultimo','último','sobrenome','author','last','surname','author-last',
            'subject','Autor','apelido','apellido','apellidos','sujeito','entrevistado','host']],
        primeiro:['author-first',['nome','primeiro','prenome','first','given','author-first','nombre']],
        autorlink:['author-link',['autorlink','autor-link','entrevistadolink','authorlink','author-link','subjectlink',
            'subject-link','sujeitolink']],
        editor:['editor-last',['editor','editor-sobrenome','editor-last','editor-surname']],
        editorlink:['editor-link',['editor-link','editorlink']]
    });
    function v219NumberedCitationRole(key) {
        for(const [role,aliases]of Object.values(V219_NUMBERED_CITATION_ROLES))for(const alias of aliases){
            if(key===alias)return role+':1';
            if(key.startsWith(alias)){
                const number=key.slice(alias.length);if(/^[1-9]\d?$/.test(number))return role+':'+number;
            }
        }
        const infix=/^(author|subject|editor)([1-9]\d?)-(last|first|link|surname|given)$/.exec(key);
        if(!infix)return null;
        const group=infix[1]==='editor'?'editor':'author',part=/^(?:last|surname)$/.test(infix[3])?'last':
            /^(?:first|given)$/.test(infix[3])?'first':'link';
        return group+'-'+part+':'+infix[2];
    }
    function v219NumberedCitationAccepts(target,key,raw,profile) {
        if(v219CitationRepairedNumberedAccepts(target,key,raw,profile))return true;
        const match=/^(autor|último|primeiro|autorlink|editor|editorlink)([1-9]\d?)$/.exec(key);
        if(!match||!target||target.title!=='Citar jornal'||target.oldid!==55834874||
            !profile?.strictNativeCitation||profile.kind!=='citation'||norm(profile.target)!=='citar jornal'||
            !target.accepted.includes(match[1]+'#')||
            !target.dependencies?.some(item=>item.title==='Módulo:Citação/CS1/Configuração'&&item.oldid===73016847)||
            !target.dependencies?.some(item=>item.title==='Módulo:Citação/CS1/Whitelist'&&item.oldid===71860752))return false;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return false;
        const roles=new Set(),usedGroups=new Set();let unstructured=false;
        for(const part of parts.slice(1)){
            const field=/^[ \t\r\n]*([^=\r\n]+?)[ \t]*=[ \t]*([\s\S]*)$/.exec(part.text);
            if(!field)return false;
            const sourceKey=norm(field[1]);if(/[{}<>\uE000-\uF8FF]/.test(sourceKey))return false;
            let mapped=Object.hasOwn(profile.fields,sourceKey)?profile.fields[sourceKey]:null;
            const numbered=/^(.*?)([1-9]\d?)$/.exec(sourceKey);
            if(!mapped&&numbered&&Object.hasOwn(profile.numbered||{},numbered[1])){
                const base=profile.numbered[numbered[1]];if(!Object.hasOwn(V219_NUMBERED_CITATION_ROLES,base))return false;
                mapped=base+numbered[2];
            }
            if(!mapped)mapped=field[1].trim();
            if(['autores','authors','vauthors','vautores','editores','editors','veditors','veditores'].includes(mapped))unstructured=true;
            const role=v219NumberedCitationRole(mapped);if(!role)continue;
            if(roles.has(role))return false;
            roles.add(role);usedGroups.add(role.split('-')[0]);
        }
        return !unstructured&&roles.has(v219NumberedCitationRole(key))&&usedGroups.size>0;
    }

    // Complete role aliases from native CS1 configuration revision 73016847.
    // Collisions preserve the original call, including blank overrides.
    const V219_NATIVE_CS1_ALIAS_ROLES=Object.freeze({"AccessDate":["acesso","acessodata","acesso-data","accessodata","acessadoem","dataacesso","accessdate","access-date","dataacesso","fechaacceso","consulta","acessdate"],"Agency":["agencia","agency","agência"],"AirDate":["transmissão","airdate","air-date"],"ArchiveDate":["arquivodata","arquivo-data","archive-date","archivedate"],"ArchiveFormat":["formato-arquivo","arquivoformato","archive-format"],"ArchiveURL":["arquivourl","arquivo-url","urlarquivo","archive-url","archiveurl","urlarchivo"],"ASINTLD":["ASIN-TLD","asin-tld"],"At":["at","em","en"],"Authors":["autores","pessoas","authors","people","credits","créditos","argumentistas","persona","personas"],"BookTitle":["titulolivro","títulolivro","título-livro","booktitle","book-title"],"Cartography":["cartography"],"Callsign":["indicativo","callsign","call-sign"],"Chapter":["capitulo","capítulo","artigo","chapter","article","contribuição","contribuicao","contribution","entry"],"ChapterFormat":["formato-capitulo","chapter-format","contribution-format","section-format","article-format","entry-format"],"ChapterURL":["urlcapitulo","urlcapítulo","capítulourl","capítulo-url","url-capítulo","chapter-url","chapterurl","contribution-url","contributionurl","section-url","sectionurl","article-url","entry-url"],"ChapterUrlAccess":["chapter-url-access","contribution-url-access","entry-url-access","article-url-access","section-url-access"],"City":["cidade","city"],"Class":["classe","class"],"Coauthors":["coautor","coautores","coauthors","coauthor"],"Collaboration":["colaboração","collaboration"],"Conference":["conference","event","conferencia","conferência","evento"],"ConferenceFormat":["conference-format","event-format","formato-conferência"],"ConferenceURL":["conference-url","conferenceurl","event-url","eventurl","url-conferência","conferência-url"],"Contribution":["contribuição","contribuicao","contribution"],"Date":["data","date","airdate","dataemissão","fecha","data2"],"DeadURL":["datali","li","ligação inativa","ligação inactiva","urlmorta","dead-url","deadurl"],"Degree":["degree","grau"],"DF":["df"],"DisplayAuthors":["numero-autores","display-authors","displayauthors"],"DisplayEditors":["numero-editores","displayeditors","display-editors"],"Docket":["expediente","docket"],"DoiBroken":["doi-incorrecto","doi-broken","doi-broken-date","doi-inactive-date","doi-inactivedate"],"Edition":["edicao","edition","edição","ed","Edição","edición"],"Editors":["editores","editors"],"Embargo":["embargo"],"Encyclopedia":["enciclopedia","enciclopédia","encyclopedia","encyclopaedia"],"Episode":["episode","episódio"],"Format":["formato","format"],"ID":["id","ID"],"IgnoreISBN":["ignore-isbn-error","ignore-isbn","ignoreisbnerror"],"Inset":["requadro","inset"],"Issue":["numero","número","issue","number"],"Interviewers":["interviewer","interviewers","entrevistador","entrevistadores"],"Language":["lingua","língua","idioma","language","in","língua2","lingua2","lingua3","língua3","lang","codling","ling","idioma2","idioma3","língua4","idioma4","lingua4"],"LastAuthorAmp":["ultimoamp","lastauthoramp","last-author-amp"],"LayDate":["resumo-data","data-resumo","lay-date","laydate"],"LayFormat":["resumo-formato","formato-resumo","lay-format"],"LaySource":["resumo-fonte","fonte-resumo","lay-source","laysource"],"LayURL":["url-resumo","resumo-url","resumo","lay-url","lay-summary","layurl","laysummary"],"MailingList":["mailing-list","mailinglist"],"Map":["map","mapa"],"MapFormat":["map-format","mapa-formato"],"MapURL":["map-url","mapurl","mapa-url"],"MapUrlAccess":["map-url-access"],"MessageID":["id-mensagem","mensagem-id","message-id"],"Minutes":["minuto","minutos","minutes"],"Mode":["modo","mode"],"Month":["mes","mês","month","acessomesdia"],"NameListFormat":["formato-lista-nomes","formato-autor","formato-editor","name-list-format","name-list-style"],"Network":["rede","network"],"NoPP":["nopp","no-pp"],"NoTracking":["template-doc-demo","template doc demo","nocat","no-tracking","notracking"],"OrigYear":["anooriginal","orig-year","origyear"],"Others":["outros","entrevistador","entrevistadores","notas","interviewer","interviewers","otros","others"],"Page":["pagina","página","page","p"],"Pages":["paginas","pp","páginas","pages"],"TotalPages":["total-paginas","total-páginas"],"Periodical":["jornal","revista","dicionario","dicionário","publicacao","publicação","periodico","periódico","website","site","obra","encyclopedia","encyclopaedia","enciclopedia","enciclopédia","trabalho","work","journal","newspaper","magazine","periodical","dictionary","publicación","diccionario"],"Place":["local","location","lugar","place","localização"],"PostScript":["pontofinal","postscript"],"Program":["programa","program"],"PublicationDate":["data-publicação","data-publicacao","publication-date","publicationdate","fecha-publicación"],"PublicationPlace":["publication-place","publicationplace","local-publicação","local-publicacao","lugar-publicación","Local publicação"],"PublisherName":["publicado","produtora","editora","Editora","instituição","instituicao","universidade","publisher","grupo-noticias","distributor","institution","newsgroup","editorial","publicadopor","publicado por"],"Quote":["citacao","citação","cita","quote","quotation","citar"],"Ref":["ref"],"RegistrationRequired":["registo","registro","registration","cadastro"],"Scale":["escala","scale"],"ScriptChapter":["capitulo-translit","script-chapter"],"ScriptMap":["script-map"],"ScriptPeriodical":["script-journal","script-magazine","script-newspaper","script-periodical","script-website","script-work"],"ScriptTitle":["título-translit","titulo-translit","script-title"],"Section":["secao","seccao","section","seção"],"Season":["temporada","season"],"Sections":["seções","secoes","sections"],"Series":["series","serie","série","séries","coleção","Coleção","colecao","versão","version"],"SeriesSeparator":["separador-series","series-separator"],"SeriesLink":["serieslink","series-link","sérielink"],"SeriesNumber":["seriesnumber","numero-serie","series-no","seriesno","series-number"],"Sheet":["sheet","folha"],"Sheets":["sheets","folhas"],"Station":["estacao","estação","station"],"SubscriptionRequired":["subscription","subscrição","subscriçao","subscricao","suscripción","assinatura"],"Time":["tempo","time","tiempo"],"TimeCaption":["time-caption","timecaption","legenda"],"Title":["titulo","título","title","titlo","Título"],"TitleLink":["title-link","episode-link","titlelink","episodelink","episódiolink","titulolink","títulolink"],"TitleNote":["departamento","subtitulo","subtítulo","Subtítulo","department"],"TitleType":["type","medium","tipo","medio"],"TransChapter":["trad-capitulo","trans-chapter","trans_chapter","capítulo-trad"],"TranscriptFormat":["transcrição-formato","transcricao-formato","transcript-format"],"Transcript":["transcript","transcricao","transcrição"],"TranscriptURL":["transcript-url","transcripturl","urltranscricao","transcricaourl","transcriçãourl"],"TransMap":["trans-map"],"TransPeriodical":["trans-journal","trans-magazine","trans-newspaper","trans-periodical","trans-website","trans-work"],"TransTitle":["títulotrad","titulotrad","trans-title","trans_title","títulotrad","título-trad"],"URL":["url","URL"],"UrlAccess":["url-access","acesso-url","acessourl"],"UrlStatus":["url-status"],"Vauthors":["vautores","vauthors"],"Veditors":["veditores","veditors"],"Via":["via"],"Volume":["volume","volumen"],"Wayb":["wayb"],"Year":["ano","year","Ano","año"],"AuthorList-First":["nome#","primeiro#","prenome#","first#","given#","author-first#","author#-first","nombre#"],"AuthorList-Last":["autor#","cognome#","ultimo#","último#","sobrenome#","author#","last#","surname#","author-last#","author#-last","subject#","Autor#","apelido#","apellido#","apellidos#","sujeito#","entrevistado#","host#"],"AuthorList-Link":["autorlink#","autor-link#","entrevistadolink#","authorlink#","author#-link","author-link#","subjectlink#","author#link","subject-link#","subject#-link","sujeitolink#"],"AuthorList-Mask":["autor-mascara#","author-mask#","authormask#","author#mask","author#-mask"],"ContributorList-First":["contribuidor#-primeiro","contribuidor-primeiro#","contributor-first#","contributor#-first"],"ContributorList-Last":["contribuidor#-ultimo","contribuidor-ultimo#","contributor-last#","contributor#-last"],"ContributorList-Link":["contribuidor-link#","contributor-link#","contributor#-link"],"ContributorList-Mask":["contribuidor-mascara#","contributor-mask#","contributor#-mask"],"EditorList-First":["editor-nome#","editor#-first","editor-first#","editor-given#","editor#-given","editor-primeiro#"],"EditorList-Last":["editor-sobrenome#","editor#","editor#-last","editor-last#","editor-surname#","editor#-surname"],"EditorList-Link":["editor-link#","editor#-link","editorlink#","editor#link"],"EditorList-Mask":["editor-mascara#","editor-mask#","editor#-mask","editormask#","editor#mask"],"TranslatorList-First":["tradutor-primeiro#","tradutor#-primeiro","translator-first#","translator#-first","translator-given#","translator#-given"],"TranslatorList-Last":["tradutor#","tradutor-ultimo#","tradutor#-ultimo","translator#","translator-last#","translator#-last"],"TranslatorList-Link":["tradutor-link#","tradutor#-link","translator-link#","translator#-link"],"TranslatorList-Mask":["tradutor-mascara#","tradutor#-mascara","translator-mask#","translator#-mask"],"Identifier:ARXIV":["arxiv","ARXIV","eprint"],"Identifier:ASIN":["asin","ASIN"],"Identifier:BIBCODE":["bibcode","BIBCODE"],"Identifier:BIORXIV":["biorxiv"],"Identifier:CITESEERX":["citeseerx"],"Identifier:DOI":["doi","DOI","rotulodoi","nomedoi","rótulodoi"],"Identifier:EISSN":["eissn","EISSN"],"Identifier:HDL":["hdl","HDL"],"Identifier:ISBN":["isbn","ISBN","isbn13","ISBN13","isbn2","isbn3"],"Identifier:ISMN":["ismn","ISMN"],"Identifier:ISSN":["issn","ISSN"],"Identifier:JFM":["jfm","JFM"],"Identifier:JSTOR":["jstor","JSTOR"],"Identifier:LCCN":["LCCN","lccn"],"Identifier:MR":["MR","mr"],"Identifier:OCLC":["OCLC","oclc"],"Identifier:OL":["ol","OL"],"Identifier:OSTI":["OSTI","osti"],"Identifier:PMC":["PMC","pmc"],"Identifier:PMID":["PMID","pmid"],"Identifier:RFC":["RFC","rfc"],"Identifier:SSRN":["SSRN","ssrn"],"Identifier:USENETID":["message-id","id-mensagem","mensagem-id"],"Identifier:ZBL":["ZBL","zbl"]});
    let v219NativeCitationRoleIndexMemo=null;
    function v219NativeCitationRoles(key) {
        if(typeof key!=='string'||key.length>512)return [];
        if(!v219NativeCitationRoleIndexMemo){
            const exact=new Map(),numbered=[];
            for(const [role,aliases]of Object.entries(V219_NATIVE_CS1_ALIAS_ROLES))for(const alias of aliases){
                if(alias.includes('#')){
                    const [prefix,suffix]=alias.split('#'),escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
                    numbered.push({role,expression:new RegExp('^'+escape(prefix)+'([1-9]\\d*)?'+escape(suffix)+'$')});
                }else{
                    if(!exact.has(alias))exact.set(alias,new Set());exact.get(alias).add(role);
                }
            }
            v219NativeCitationRoleIndexMemo={exact,numbered,cache:new Map()};
        }
        if(v219NativeCitationRoleIndexMemo.cache.has(key))return v219NativeCitationRoleIndexMemo.cache.get(key).slice();
        const roles=new Set(v219NativeCitationRoleIndexMemo.exact.get(key)||[]);
        for(const item of v219NativeCitationRoleIndexMemo.numbered){const match=item.expression.exec(key);
            if(match)roles.add(item.role+':'+(match[1]||'1'));
        }
        const result=[...roles].sort(),cache=v219NativeCitationRoleIndexMemo.cache;
        if(cache.size>=4096)cache.delete(cache.keys().next().value);
        cache.set(key,Object.freeze(result));return result.slice();
    }
    function v219KnownNativeRepairOwner(raw,cfg={}) {
        if(typeof raw!=='string')return false;
        const header=/^\{\{\s*([^|{}]{1,160})(?:\||\}\})/.exec(raw),name=header?v215TemplateTitle(header[1]):null;
        if(name&&/^[Ll]ink$/.test(name))return !!v219SourceLinkDate(raw,cfg);
        if(!name||!/^(?:[Cc]hembox (?:Identifiers|Pharmacology|Properties)|[Bb]ar box|[Yy]ou(?:Tube|tube)|[Cc]ite NSRW)$/.test(name))return false;
        if(/^[Cc]ite NSRW$/.test(name)){
            const call=v214NSRWCall(raw,cfg);
            return call.accepted===true&&call.text!==raw&&call.proof?.template==='Cite NSRW'&&call.proof.oldid===60696160;
        }
        const drug=v214DrugFields(raw),contexts={identifiers:69934566,pharmacology:70092713,properties:69934732};
        if(drug&&contexts[drug.context.id]===drug.context.oldid)return true;
        if(v219AuxiliaryNativeTitle(raw,{...cfg,auxiliaryTemplates:true}))return true;
        // A repaired label uses the same literal native branch. This local
        // classification does not write the hypothetical spelling back.
        const fields=v2151FieldSyntaxParts(raw);if(!fields)return false;
        const labels=fields.filter(field=>['title','titulo','título'].includes(field.key));
        if(labels.length!==1||labels[0].key==='título')return false;
        const field=labels[0],candidate=raw.slice(0,field.keyStart)+'título'+raw.slice(field.keyEnd);
        return !!v219AuxiliaryNativeTitle(candidate,{...cfg,auxiliaryTemplates:true});
    }
    function v219NativeCitationStateInterface(raw) {
        if(v219CitationHeaderControlRefusal(raw))return false;
        if(typeof raw!=='string')return false;
        const literal=v219ReaderLiteralHeader(raw);
        if(literal!==null){
            const candidate=TEMPLATE_CATALOG[v219ReaderNativeName(literal)];
            if(!candidate?.dependencies?.some(item=>item.title==='Módulo:Citação/CS1/Configuração'&&item.oldid===73016847)||
                !candidate.dependencies.some(item=>item.title==='Módulo:Citação/CS1/Whitelist'&&item.oldid===71860752))return false;
        }
        const parsed=parsedTemplate(raw),native=TEMPLATE_CATALOG[parsed.name];
        return !!native&&v215LiteralTemplateIdentity(raw)&&v215SameTemplateTitle(parsed.parts[0],native.title)&&
            !!native.dependencies?.some(item=>item.title==='Módulo:Citação/CS1/Configuração'&&item.oldid===73016847)&&
            !!native.dependencies?.some(item=>item.title==='Módulo:Citação/CS1/Whitelist'&&item.oldid===71860752);
    }
    function v219NativeMixedCitationField(raw,profile,entry) {
        if(!entry||entry.positional||typeof entry.key!=='string'||!v219NativeMixedCitationIdentity(raw,profile))return false;
        const parsed=parsedTemplate(raw);
        // A native field does not become foreign merely because another
        // argument needs adaptation. Keep its spelling and supplied bytes;
        // independent typed value repairs have their own source-bound plans.
        return nativeCitationAccepts(parsed,entry.key);
    }
    function v219NativeMixedCitationIdentity(raw,profile) {
        if(profile?.kind!=='citation'||profile.source?.language!=='mixed'||!v219NativeCitationStateInterface(raw))return false;
        const parsed=parsedTemplate(raw);
        return ['citar web','citar livro','citar jornal','citar periódico','citar revista'].includes(parsed.name)&&
            norm(profile.target)===parsed.name;
    }
    function v219NativeCitationTitle(parsed) {
        return !!parsed&&Array.isArray(parsed.parts)&&
            ['citar web','citar livro','citar jornal','citar periódico','citar revista'].includes(parsed.name)&&
            v219NativeCitationStateInterface('{{'+parsed.parts.join('|')+'}}');
    }
    function v219ForeignCitationStateRefusal(raw,profile) {
        if(profile?.kind!=='citation'||typeof raw!=='string')return null;
        if(v219LocalCitationRedirectIdentity(raw,profile))return null;
        const parsed=parsedTemplate(raw);
        // Already native calls retain their own accepted interface. A
        // foreign wrapper with a similar-looking name does not inherit it.
        if(v219NativeCitationStateInterface(raw))return null;
        const fields=profile.fields||{},state=[];
        for(const entry of foreignEntries(parsed)){
            if(entry.positional)continue;
            const mapped=fields[norm(entry.key)];
            if(v219CitationUrlState(entry.key,entry.value)||typeof mapped==='string'&&
                v219CitationUrlState(mapped,entry.value))state.push({key:entry.key,value:entry.value});
        }
        if(!state.length)return null;
        return {profile,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[],proof:{
            sourceHash:v24SyntaxHash(raw),sourceOldid:profile.source?.oldid??null,
            disabledForeignStateReason:'unproved-source-state-semantics',state,
            method:'whole foreign citation retained; a declared field mapping is not proof of URL-state meaning; native URL-state roles and values are never inferred'}};
    }
    function v219ForeignCitationRoleCollision(raw,profile,target,entries) {
        if(profile?.kind!=='citation'||typeof raw!=='string'||!Array.isArray(entries))return null;
        const native=TEMPLATE_CATALOG[norm(target)];
        if(!native||!native.dependencies?.some(item=>item.title==='Módulo:Citação/CS1/Configuração'&&item.oldid===73016847)||
            !native.dependencies?.some(item=>item.title==='Módulo:Citação/CS1/Whitelist'&&item.oldid===71860752))return null;
        const original=new Map(foreignEntries(parsedTemplate(raw)).map(entry=>[entry.index,entry])),seen=new Map();
        for(const entry of entries){
            if(entry.remove||entry.positional||typeof entry.key!=='string')continue;
            for(const role of v219NativeCitationRoles(entry.key)){
                const previous=seen.get(role),before=original.get(entry.index),originalRoles=before&&!before.positional?v219NativeCitationRoles(before.key):[];
                const field={key:entry.key,originalKey:before?.key??null,preexisting:originalRoles.includes(role)};
                if(previous)return {kind:previous.preexisting&&field.preexisting?'existing-native-role-conflict':'introduced-native-role-conflict',
                    role,keys:[previous.key,field.key],originalKeys:[previous.originalKey,field.originalKey],
                    sourceHash:v24SyntaxHash(raw),nativeTemplateOldid:native.oldid,nativeConfigurationOldid:73016847,
                    method:'complete native aliases and identifier parameters; exact numbered family; competing values and blank overrides are never selected'};
                seen.set(role,field);
            }
        }
        return null;
    }

    // Native Citation chooses its consumer before CS1 sees any supplied metadata.
    function v219NativeCitationCS1Consumer(raw) {
        if(typeof raw!=='string')return false;
        const literal=v219ReaderLiteralHeader(raw),profile=literal===null?null:TEMPLATE_CATALOG[v219ReaderNativeName(literal)];
        if(profile?.oldid!==62525251)return true;
        const parsed=parsedTemplate(raw);
        if(!v219OriginalTemplateHeaderAllowed(parsed.parts[0])||!v215SameTemplateTitle(parsed.parts[0],profile.title)||
            !profile.dependencies?.some(row=>row.title==='Módulo:Citação/CS1/Configuração'&&row.oldid===73016847)||
            !profile.dependencies.some(row=>row.title==='Módulo:Citação/CS1/Whitelist'&&row.oldid===71860752))return false;
        const fields=v2151FieldSyntaxParts(raw),priority=['inventor-surname','inventor1-surname','inventor-last','inventor1-last','inventor'];
        if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='||
            priority.includes(field.key.toLowerCase())&&!priority.includes(field.key)))return false;
        const selectors=fields.filter(field=>priority.includes(field.key));
        if(!selectors.length)return true;
        if(new Set(selectors.map(field=>field.key)).size!==selectors.length)return false;
        const values=new Map();
        for(const field of selectors){
            const value=field.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
            if(/[{}\[\]<>&|"'\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\uFEFF\uE000-\uF8FF]/u.test(value))return false;
            values.set(field.key,value);
        }
        return values.get(priority.find(key=>values.has(key)))==='';
    }
