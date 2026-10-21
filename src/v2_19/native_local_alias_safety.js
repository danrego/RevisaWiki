    // Exact locally existing template interfaces take precedence over a
    // same-spelled foreign catalog profile. Redirects forward every raw arg.
    const V219_OTHER_NATIVE_ALIASES=Object.freeze([
        {title:'Main',oldid:46260353,target:'Artigo principal',targetOldid:72102523,kind:'positional'},
        {title:'AP',oldid:46228305,target:'Artigo principal',targetOldid:72102523,kind:'positional'},
        {title:'Ap',oldid:57134504,target:'Artigo principal',targetOldid:72102523,kind:'positional'},
        {title:'Further',oldid:22735218,target:'Mais informações',targetOldid:66455278,kind:'positional'},
        {title:'See also',oldid:53662830,target:'VT',targetOldid:72767371,kind:'positional'},
        {title:'Commons category',oldid:46243699,target:'Commonscat',targetOldid:69308503,kind:'positional'},
        {title:'Plainlist',oldid:62301792,target:'Lista simples',targetOldid:69807403,kind:'list'},
        {title:'Unbulleted list',oldid:60995174,target:'Lista sem marcas',targetOldid:60788492,kind:'list'},
        {title:'Official website',oldid:46302697,target:'Oficial',targetOldid:70230751,kind:'official'},
        {title:'Authority control',oldid:60995102,target:'Controle de autoridade',targetOldid:71897402,kind:'authority'},
        {title:'Normdaten',oldid:60995183,target:'Controle de autoridade',targetOldid:71897402,kind:'authority'},
        {title:'Ficha de persona',oldid:50341076,target:'Info/Biografia',targetOldid:72993800,kind:'infobox'}
    ]);
    const V219_OTHER_NATIVE_WRAPPERS=Object.freeze([
        {title:'Infobox person',oldid:63097825,kind:'infobox'},
        {title:'Infobox scientist',oldid:67624760,kind:'infobox'},
        {title:'Infobox film',oldid:67999132,kind:'infobox'},
        {title:'Date',oldid:59283611,kind:'date'},
        {title:'Commonscat',oldid:69308503,kind:'positional'}
    ]);
    function v219OtherNativeHeader(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return null;
        const literal=v219ReaderLiteralHeader(raw);
        if(literal!==null){
            const candidate=literal.replace(/[\u0000-\u001F\u007F-\u009F\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF]/g,' ');
            if(!v219TitleRecordLookup(candidate,V219_OTHER_NATIVE_ALIASES)&&
                !v219TitleRecordLookup(candidate,V219_OTHER_NATIVE_WRAPPERS))return null;
        }
        const parts=v215BraceParts(raw.slice(2,-2));if(!parts?.length)return null;
        const header=parts[0].text;
        const uncertain=/[{}<>\r\n\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF\uE000-\uF8FF]/.test(header),
            candidate=uncertain?header.replace(/[\u0000-\u001F\u007F-\u009F\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF]/g,' '):header;
        // A weak match is refusal-only. It cannot strip a control character
        // and authorize a local header rewrite or foreign role activation.
        const alias=v219TitleRecordLookup(candidate,V219_OTHER_NATIVE_ALIASES),
            wrapper=v219TitleRecordLookup(candidate,V219_OTHER_NATIVE_WRAPPERS);
        return alias||wrapper?{header,parts,record:alias||wrapper,wrapper:!!wrapper||uncertain,uncertain}:null;
    }
    function v219OtherNativeWrapper(raw) {return v219OtherNativeHeader(raw)?.wrapper===true;}
    function v219OtherNativeCall(raw,cfg={}) {
        const identity=v219OtherNativeHeader(raw);if(!identity)return null;
        const record=identity.record,profile={kind:record.kind,target:record.target||record.title,
            source:{language:'pt',title:'Predefinição:'+record.title,oldid:record.oldid}};
        const enabled=cfg.multilingual===true&&(record.kind==='infobox'?cfg.infoboxes!==false:cfg.auxiliaryTemplates!==false);
        if(identity.wrapper||v219OfficialUrlCallRefusal(raw)||!enabled)return {profile,source:raw,text:raw,candidate:raw,handled:true,converted:false,
            blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[],proof:{kind:'accepted-local-native-interface',nativeOldid:record.oldid}};
        const padding=/^([ \t]*)[\s\S]*?([ \t]*)$/.exec(identity.header),
            text='{{'+padding[1]+record.target+padding[2]+raw.slice(2+identity.header.length);
        const nativeName=v219LocalBiographyNameComposition(raw,cfg);
        if(nativeName)return {profile,source:raw,text:nativeName.text,candidate:nativeName.text,handled:true,converted:true,blocked:false,issues:[],issueEvidence:[],proof:nativeName.proof};
        return {profile,source:raw,text,candidate:text,handled:true,converted:text!==raw,blocked:false,issues:[],issueEvidence:[],
            proof:{kind:'exact-local-native-redirect-header-only',nativeAliasOldid:record.oldid,nativeTargetOldid:record.targetOldid,
                argumentBytesBefore:raw.slice(2+identity.header.length),argumentBytesAfter:text.slice(2+padding[1].length+record.target.length+padding[2].length)}};
    }

    // A local redirect forwards its arguments unchanged. Only the existing
    // native mixed-field correction can separately repair this supplied key.
    const v219LocalBiographyNameComposition=(raw,cfg={})=>{
        if(typeof raw!=='string'||cfg.multilingual!==true||cfg.infoboxes===false||
            cfg.automaticParameterNames!==true)return null;
        const identity=v219OtherNativeHeader(raw),record=identity?.record;
        if(!record||identity.wrapper||identity.uncertain||record.oldid!==50341076||
            record.targetOldid!==72993800||record.target!=='Info/Biografia'||record.kind!=='infobox')return null;
        const native=INFOBOX_CATALOG['info/biografia'];
        if(native?.oldid!==72993800||native.title!==record.target||
            infoboxAccepts(native,'nombre')||!infoboxAccepts(native,'nome'))return null;
        const padding=/^([ \t]*)[\s\S]*?([ \t]*)$/.exec(identity.header),
            forwarded='{{'+padding[1]+record.target+padding[2]+raw.slice(2+identity.header.length),
            fields=v2151FieldSyntaxParts(forwarded),profile=translationProfile(forwarded);
        if(!fields?.length||fields.some(field=>field.key!==field.plain||field.separator!=='=')||
            new Set(fields.map(field=>field.key)).size!==fields.length||
            profile?.kind!=='infobox'||profile.source?.language!=='mixed'||profile.target!==native.title||
            !Object.hasOwn(profile.fields||{},'nombre')||profile.fields.nombre!=='nome')return null;
        const names=fields.filter(field=>field.key==='nombre');if(names.length!==1)return null;
        const name=names[0],literal=name.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
        if(!literal||name.value.length>1024||/''|[{}<>\[\]&\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\ufeff\uE000-\uF8FF]/u.test(literal)||
            fields.some(field=>field!==name&&(norm(field.key)==='nome'||
                Object.hasOwn(profile.fields,norm(field.key))&&profile.fields[norm(field.key)]==='nome')))return null;
        const candidate=v24SyntaxApply(forwarded,[{start:name.keyStart,end:name.keyEnd,text:'nome'}]),
            continuation=migrateForeignTemplate(forwarded,cfg);
        if(!continuation||continuation.blocked!==false||!Array.isArray(continuation.issues)||continuation.issues.length||
            continuation.profile?.kind!=='infobox'||continuation.profile.source?.language!=='mixed'||
            continuation.profile.target!==native.title||continuation.text!==candidate||continuation.candidate!==candidate)return null;
        return {text:candidate,proof:{kind:'exact-local-redirect-and-existing-native-name-repair',
            sourceHash:v24SyntaxHash(raw),nativeAliasOldid:50341076,nativeTargetOldid:72993800,
            forwardedSourceHash:v24SyntaxHash(forwarded),sourceKey:'nombre',targetKey:'nome',
            nativeKeyStart:name.keyStart,nativeKeyEnd:name.keyEnd,value:name.value,
            method:'exact local header forwarding plus independently constructed unique native supplied-key repair; every other argument byte retained'}};
    };
