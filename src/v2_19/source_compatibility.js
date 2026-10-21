    // Finite corrections proved against the native citation configuration and
    // whitelist. Accepted spellings are retained. No general fuzzy matching.
    const V219_SOURCE_ACCESS_KEYS=Object.freeze(['acessado-em','acesssodata','accesodata','acssodata',
        'acsseodata','aessodata','dataaceso','acesso_data','data_acesso','data_de_acesso',
        'data de acesso','acesso data','consultado em','consultado','visitadoem','acessdata','fechaaceso']);
    const V219_SOURCE_ACCESS_FAMILY=Object.freeze(['acesso','acessodata','acesso-data','accessodata','acessadoem',
        'dataacesso','accessdate','access-date','fechaacceso','consulta','acessdate',...V219_SOURCE_ACCESS_KEYS]);
    const V219_NATIVE_CITATION_REDIRECTS=Object.freeze([
        {title:'Cite web',target:'citar web',oldid:46214208},
        {title:'Cite news',target:'citar jornal',oldid:50398889},
        {title:'Cite book',target:'citar livro',oldid:50398808},
        {title:'Cite journal',target:'citar periódico',oldid:50398876},
        {title:'Cite magazine',target:'citar revista',oldid:60995882}
    ]);
    function v219NativeHeaderProfile(header) {
        if(typeof header!=='string')return null;
        const name=norm(v215TemplateTitle(header));
        return Object.hasOwn(INFOBOX_CATALOG,name)?INFOBOX_CATALOG[name]:
            Object.hasOwn(TEMPLATE_CATALOG,name)?TEMPLATE_CATALOG[name]:null;
    }
    function v219NormalizedNativeCitationContext(raw) {
        if(v219CitationHeaderControlRefusal(raw))return null;
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return null;
        const parsed=parsedTemplate(raw),header=parsed.parts[0],name=norm(v215TemplateTitle(header)),
            alias=v219LocalCitationRedirectProfile(raw),target=Object.hasOwn(V218_CITATION_ISLAND_CONTRACTS,name)?name:
                alias?norm(alias.target):null;
        if(!target||!Object.hasOwn(V218_CITATION_ISLAND_CONTRACTS,target)||!Object.hasOwn(TEMPLATE_CATALOG,target))return null;
        const profile=TEMPLATE_CATALOG[target];
        if(profile.oldid!==V218_CITATION_ISLAND_CONTRACTS[target]||
            !v215SameTemplateTitle(header,profile.title)&&!(alias&&alias.target===profile.title&&
                alias.nativeTemplateOldid===profile.oldid))return null;
        const native={...parsed,name:target,parts:[profile.title,...parsed.parts.slice(1)]};
        return nativeCitationTitle(native)?{parsed,native,profile}:null;
    }
    function v219SourceNativeContract(raw,context) {
        if(!context||V218_CITATION_ISLAND_CONTRACTS[context.native.name]!==context.profile.oldid)return null;
        const header=context.parsed.parts[0];
        if(v215LiteralTemplateIdentity(raw)&&v215SameTemplateTitle(header,context.profile.title))return {aliasOldid:null};
        const local=v219LocalCitationRedirectProfile(raw);
        if(local&&local.target===context.profile.title&&local.nativeTemplateOldid===context.profile.oldid)return {aliasOldid:local.nativeAliasOldid};
        const alias=V219_NATIVE_CITATION_REDIRECTS.find(item=>item.target===context.native.name&&v215SameTemplateTitle(header,item.title));
        return alias?{aliasOldid:alias.oldid}:null;
    }
    function v219CitationIdentifierNormalization(role,value) {
        if(typeof value!=='string'||value.length>8192||/[{}<>\uE000-\uF8FF\r\n]/.test(value))return null;
        const outer=/^([ \t]*)([\s\S]*?)([ \t]*)$/.exec(value),literal=outer[2];let match,candidate;
        if(role==='isbn'){
            if(v213ISBN(literal))return value;
            match=/^ISBN(?:-(10|13))?[ \t]*:?[ \t]*([0-9Xx -]+)$/i.exec(literal);if(!match)return null;
            candidate=match[2];const count=candidate.replace(/[ -]/g,'').length;
            if(!v213ISBN(candidate)||match[1]&&count!==Number(match[1]))return null;
        }else if(role==='doi'){
            if(v213DOI(literal))return value;
            match=/^(?:doi[ \t]*:[ \t]*|https?:\/\/(?:dx\.)?doi\.org\/)(10\.[\s\S]+)$/i.exec(literal);
            if(!match||!v213DOI(match[1]))return null;candidate=match[1];
        }else if(role==='pmid'||role==='pmc'){
            const limit=role==='pmid'?42900000:7500000;
            if(/^[1-9]\d{0,8}$/.test(literal))return Number(literal)<=limit?value:null;
            match=role==='pmid'?/^PMID[ \t]*:?[ \t]*([1-9]\d{0,8})$/i.exec(literal)||
                /^https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/([1-9]\d{0,8})\/?$/i.exec(literal):
                /^PMC[ \t]*:?[ \t]*([1-9]\d{0,8})$/i.exec(literal);
            if(!match||Number(match[1])>limit)return null;candidate=match[1];
        }else return null;
        return outer[1]+candidate+outer[3];
    }
    const V219_NATIVE_URL_STATE_ROLES=Object.freeze({
        UrlStatus:Object.freeze(['url-status']),
        DeadURL:Object.freeze(['datali','li','ligação inativa','ligação inactiva','urlmorta','dead-url','deadurl'])
    });
    function v219CitationUrlState(key,value) {
        if(typeof key!=='string'||typeof value!=='string')return null;
        const role=Object.keys(V219_NATIVE_URL_STATE_ROLES).find(name=>V219_NATIVE_URL_STATE_ROLES[name].includes(key));
        // The native configuration assigns different roles to these fields.
        // UrlStatus is not read by the pinned renderer. DeadURL is read as
        // supplied, including dated markers and non-boolean native values.
        // This result only preserves a field; it never authorizes migration
        // of a foreign template or converts a status into a boolean.
        return role?{key,value,role,preserve:true}:null;
    }
    function v219ScalarValueWithPadding(value,converted) {
        if(typeof value!=='string'||typeof converted!=='string'||converted===value)return value;
        const match=/^(\s*)([\s\S]*?)(\s*)$/.exec(value),core=converted.trim();
        if(!match||!match[2]||!core)return value;
        return match[1]+core+match[3];
    }
    // Supplied-key repair from predecessor72349758 c.citation.tradpred.124.
    // This is not a claim about an uncaptured French template consumer.
    function v219NativeTitreContext(raw) {
        if(typeof raw!=='string'||v219CitationHeaderControlRefusal(raw))return null;
        const parsed=parsedTemplate(raw),alias=v219LocalCitationRedirectProfile(raw),
            profile=alias?TEMPLATE_CATALOG[norm(alias.target)]:v219NativeHeaderProfile(parsed.parts[0]);
        if(!profile?.dependencies?.some(row=>row.title==='Módulo:Citação/CS1/Configuração'&&row.oldid===73016847)||
            !profile.dependencies.some(row=>row.title==='Módulo:Citação/CS1/Whitelist'&&row.oldid===71860752)||
            (alias?(alias.nativeTemplateOldid!==profile?.oldid||alias.target!==profile?.title):!profile||!v215LiteralTemplateIdentity(raw,profile)))return null;
        return {parsed,profile,alias,native:{...parsed,name:norm(profile.title),parts:[profile.title,...parsed.parts.slice(1)]}};
    }
    function v219NativeTitreAmbiguity(raw) {
        if(typeof raw!=='string'||!/[|][^|=]*titre[^|=]*=/i.test(raw))return false;
        const context=v219NativeTitreContext(raw);if(!context)return false;
        const fields=v2151FieldSyntaxParts(raw);if(!fields)return true;
        const canonical='{{'+context.profile.title+raw.slice(2+context.parsed.parts[0].length),candidates=translationProfile(canonical)?.fields;
        return fields.filter(field=>!v219NativeCitationRoles(field.key).includes('Title')&&
            (norm(field.key)==='titre'||v219NativeCitationRoles(norm(field.key)).includes('Title')||
                v219NativeCitationRoles(candidates?.[norm(field.key)]||'').includes('Title'))).length>1;
    }
    function v219NativeTitreAmbiguityCall(raw,profile) {
        if(!v219NativeTitreAmbiguity(raw))return null;
        const alias=v219LocalCitationRedirectProfile(raw);
        if(alias){
            const header=parsedTemplate(raw).parts[0],padding=/^([ \t\r\n]*)[\s\S]*?([ \t\r\n]*)$/.exec(header),
                candidate='{{'+padding[1]+alias.target+padding[2]+raw.slice(2+header.length);
            return {profile:alias,candidate,text:candidate,blocked:false,issues:[],issueEvidence:[],proof:{sourceHash:v24SyntaxHash(raw),
                nativeAliasOldid:alias.nativeAliasOldid,nativeTemplateOldid:alias.nativeTemplateOldid,
                method:'exact native redirect forwards header only; competing ignored Title hints and all raw arguments retained'}};
        }
        return {profile,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[],proof:{sourceHash:v24SyntaxHash(raw),
            method:'competing ignored Title hints; no unique intended supplied title; complete native call retained'}};
    }
    function v219NativeTitreRepair(raw,cfg={}) {
        if(cfg.citations===false||cfg.multilingual===false||cfg.automaticParameterNames===false||cfg.automaticSourceCompatibility===false||
            typeof raw!=='string'||!/[|][ \t\r\n]*titre[ \t\r\n]*=/.test(raw))return null;
        const context=v219NativeTitreContext(raw),fields=context&&v2151FieldSyntaxParts(raw),
            canonical=context&&'{{'+context.profile.title+raw.slice(2+context.parsed.parts[0].length),
            candidates=canonical&&translationProfile(canonical)?.fields;
        if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='=')||
            fields.filter(field=>norm(field.key)==='titre'||v219NativeCitationRoles(field.key).includes('Title')||
                v219NativeCitationRoles(norm(field.key)).includes('Title')||
                v219NativeCitationRoles(candidates?.[norm(field.key)]||'').includes('Title')).length!==1)return null;
        const field=fields.find(field=>field.key==='titre');
        if(!field||nativeCitationAccepts(context.native,field.key)||!nativeCitationAccepts(context.native,'título')||
            !field.value.trim()||/[\r\n]/.test(field.value.trim())||/[{}<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\uE000-\uF8FF]/.test(field.value))return null;
        return {field,context,target:'título',text:raw.slice(0,field.keyStart)+'título'+raw.slice(field.keyEnd)};
    }
    function v219SourceCompatibilityRule(key) {
        if(V219_SOURCE_ACCESS_KEYS.includes(key))return {target:'acessodata',kind:'access',family:V219_SOURCE_ACCESS_FAMILY};
        if(['pág','pag','pg'].includes(key))return {target:'página',kind:'page',family:['pág','pag','pg','pagina','página','page','p','Página']};
        if(['sub-titulo','sub-título'].includes(key))return {target:'subtítulo',kind:'title-note',
            family:['sub-titulo','sub-título','departamento','subtitulo','subtítulo','Subtítulo','department']};
        if(key==='colecção')return {target:'coleção',kind:'series',
            family:['colecção','Colecção','series','serie','série','séries','coleção','Coleção','colecao','versão','version']};
        if(key==='seriesno')return {target:'numero-serie',kind:'series-number',
            family:['seriesnumber','numero-serie','series-no','seriesno','series-number']};
        if(key==='urlaccess')return {target:'acessourl',kind:'url-access',family:['url-access','acesso-url','acessourl','urlaccess']};
        const link=/^(?:enlace|link)-?editor([1-9]\d?)?$/.exec(key);
        if(link){
            const indices=link[1]&&link[1]!=='1'?[link[1]]:['','1'],family=[];
            for(const index of indices)family.push('editor-link'+index,'editor'+index+'-link','editorlink'+index,
                'editor'+index+'link','enlaceeditor'+index,'enlace-editor'+index,'linkeditor'+index,'link-editor'+index);
            return {target:'editor-link'+(link[1]||''),kind:'editor-link',family};
        }
        let match=/^editor([1-9]\d?)?-(nome|sobrenome|name|lastname)$/.exec(key);
        if(match&&!match[1]&&!['name','lastname'].includes(match[2]))return null;
        if(match)match=[match[0],match[1]||'1',/^(?:sobrenome|lastname)$/.test(match[2])?'sobrenome':'nome'];
        if(!match&&(match=/^último-editor([1-9]\d?)?$/.exec(key)))match=[match[0],match[1]||'1','sobrenome'];
        if(!match)return null;
        const number=Number(match[1]),last=match[2]==='sobrenome',n=String(number),indices=number===1?['','1']:[n];
        const family=[];
        for(const index of indices){
            if(last)family.push('editor-sobrenome'+index,'editor'+index,'editor'+index+'-last',
                'editor-last'+index,'editor-surname'+index,'editor'+index+'-surname',
                'editor'+index+'-sobrenome','editor'+index+'-lastname','último-editor'+index);
            else family.push('editor-nome'+index,'editor'+index+'-first','editor-first'+index,
                'editor-given'+index,'editor'+index+'-given','editor-primeiro'+index,'editor'+index+'-nome','editor'+index+'-name');
        }
        return {target:'editor-'+(last?'sobrenome':'nome')+(number===1&&['último-editor','editor-name','editor-lastname'].includes(key)?'':n),
            kind:last?'editor-last':'editor-first',family};
    }
    function v219SourceCompatibilityValue(value,rule) {
        if(typeof value!=='string'||value.length>4096)return false;
        const comments=v218CitationCommentView(value);if(!comments)return false;
        const literal=comments.view.trim();
        if(!literal||/[{}<>\uE000-\uF8FF\r\n]/.test(literal))return false;
        if(rule.kind==='access')return !!v218CitationDateValue(literal,'access');
        if(rule.kind==='url-access')return ['subscrição','limitada','limitado','registo','registro','registration','limited','subscription'].includes(literal);
        if(rule.kind==='editor-link')return !/[\[\]|]/.test(literal)&&!/^https?:/i.test(literal);
        return true;
    }
    function v219SourceLinkDateCandidate(source) {
        return typeof source==='string'&&/\{\{[ \t_]*(?:(?:[Pp]redefinição|[Tt]emplate)[ \t_]*:[ \t_]*)?[Ll]ink[ \t\r\n_]*\|/i.test(source)&&
            /\|[ \t]*(?:acessodata|acesso_data|acdt)[ \t]*=[ \t\r\n]*\{\{[ \t]*[Dd]tlink[ \t]*\|/.test(source);
    }
    function v219SourceLinkDate(raw,options={}) {
        if(options.dates===false||options.automaticCitationDateValues===false||options.automaticSourceCompatibility===false||
            options.citations===false||!v219SourceLinkDateCandidate(raw))return null;
        const parsed=parsedTemplate(raw);if(!v215SameTemplateTitle(parsed.parts[0],'Link'))return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
        const accepted=new Set(['idioma','língua','1','url','2','título','titulo','3','descr','notas','4','wayb','datali','urlmorta',
            'ligação inativa','li','acessodata','acesso_data','acdt']),dates=[];
        let positional=0;
        for(const part of parts.slice(1)){
            const match=/^([ \t\r\n]*)([\p{L}\p{N}_ -]+?)([ \t\r\n]*=[ \t]*)([\s\S]*)$/u.exec(part.text);
            if(!match){if(part.text.includes('=')||++positional>4)return null;continue;}
            const key=match[2];if(key!==key.trim()||!accepted.has(key))return null;
            if(['acessodata','acesso_data','acdt'].includes(key))dates.push({key,value:match[4],
                start:2+part.start+match[1].length+match[2].length+match[3].length,end:2+part.end});
        }
        if(dates.length!==1)return null;
        const field=dates[0],match=/^(\s*)\{\{[ \t]*[Dd]tlink[ \t]*\|[ \t]*(\d{1,2})[ \t]*\|[ \t]*(\d{1,2})[ \t]*\|[ \t]*([1-9]\d{3})[ \t]*\}\}(\s*)$/.exec(field.value);
        if(!match||!validDate(+match[2],+match[3],+match[4]))return null;
        const tuple=[+match[2],+match[3],+match[4]],value=match[1]+tuple[0]+' de '+MONTH_PT[tuple[1]]+' de '+tuple[2]+match[5];
        return {field,tuple,value,wrapperStart:field.start+match[1].length,wrapperEnd:field.end-match[5].length,
            text:raw.slice(0,field.start)+value+raw.slice(field.end)};
    }
    function v219SourceCompatibilityCandidate(source) {
        return typeof source==='string'&&(v219SourceLinkDateCandidate(source)||/[|][ \t\r\n]*titre[ \t\r\n]*=/.test(source)||/\|[ \t\r\n]*(?:acessado-em|acesssodata|accesodata|acssodata|acsseodata|aessodata|dataaceso|acesso_data|data_acesso|data_de_acesso|data de acesso|acesso data|consultado em|consultado|visitadoem|acessdata|fechaaceso|pág|pag|pg|sub-titulo|sub-título|colecção|seriesno|urlaccess|(?:enlace|link)-?editor(?:[1-9]\d?)?|editor(?:[1-9]\d?-(?:nome|sobrenome|name|lastname)|-(?:name|lastname))|último-editor(?:[1-9]\d?)?)[ \t\r\n]*=/.test(source)||
            /\|[ \t\r\n]*(?:doi|DOI)[ \t]*=[ \t]*(?:\/10\.|10\.\d{4,9}(?: +\/|\/ +))/.test(source)||
            /\|[ \t\r\n]*(?:url-access|acesso-url|acessourl)[ \t]*=[^|}\r\n]*\bsubscription\b/.test(source)||
            /\|[ \t]*(?:url|URL|Url|acessodata|acessadoem)[ \t]+(?:https?:\/\/|\d)/.test(source)||
            /\|[ \t\r\n]*(?:data|date|ano|year|Ano|año)[ \t]*=[ \t\r\n]*[1-9]\d{3}[ \t]+[A-Za-z]+/.test(source)||
            /\|[ \t\r\n]*(?:mês|mes|month)[ \t]*=/.test(source)||
            /\|[ \t]*[^|={}\r\n]{1,80}[ \t]*=[ \t]*[1-9]\d{3}-\d{2}-\d{2}\./.test(source)||
            /\|[ \t]*(?:página|páginas|pagina|paginas|page|pages|p|pp)[ \t]*=[ \t]*\{\{[Pp]\.[ \t]*\|/.test(source)||v219AuxiliaryKeyCandidate(source));
    }
    function v219SourceISOPeriodEdits(fields,context,sourceContract,options={}) {
        if(options.dates===false||options.automaticCitationDateValues===false||!sourceContract)return [];
        const edits=[];
        for(const field of fields){
            if(!nativeCitationAccepts(context.native,field.key))continue;
            const roles=v219NativeCitationRoles(field.key).filter(role=>['Date','AccessDate','ArchiveDate','PublicationDate','AirDate'].includes(role)),
                match=/^([ \t]*)([1-9]\d{3})-(\d{2})-(\d{2})\.([ \t]*)$/.exec(field.value);
            if(!roles.length||!match||!validDate(Number(match[4]),Number(match[3]),Number(match[2]))||
                fields.some(other=>other!==field&&v219NativeCitationRoles(other.key).some(role=>roles.includes(role))))continue;
            const at=field.start+match[1].length+10;
            edits.push({start:at,end:at+1,text:'',ruleId:'v218CitationDateValues',proof:{nativeTemplate:context.native.name,
                nativeTemplateOldid:context.profile.oldid,nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,
                nativeAliasOldid:sourceContract.aliasOldid,sourceRevision:72349758,sourceKey:field.key,
                kind:'typed-iso-terminal-period',valueBefore:field.value,valueAfter:field.value.slice(0,match[1].length+10)+field.value.slice(match[1].length+11),
                changeRules:['v218CitationDateValues'],minorSafe:false,
                method:'one unique native complete calendar-day field; valid ISO day; one isolated terminal period; all other bytes retained'}});
        }
        return edits;
    }
    function v219SourcePageWrapperEdits(fields,context,sourceContract,options={}) {
        if(options.citationRepairs===false||!sourceContract)return [];
        const pages=fields.filter(field=>v219NativeCitationRoles(field.key).some(role=>['Page','Pages'].includes(role)));
        if(pages.length!==1||!nativeCitationAccepts(context.native,pages[0].key))return [];
        const field=pages[0],match=/^([ \t]*)\{\{[Pp]\.[ \t]*\|([ \t]*[1-9]\d*(?:[-–][1-9]\d*)?[ \t]*)\}\}([ \t]*)$/.exec(field.value);
        if(!match)return [];
        const value=match[1]+match[2]+match[3];
        return [{start:field.start,end:field.end,text:value,ruleId:'citationCleanup',proof:{nativeTemplate:context.native.name,
            nativeTemplateOldid:context.profile.oldid,nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,
            nativeAliasOldid:sourceContract.aliasOldid,sourceRevision:72349758,nativeWrapperOldid:47405734,
            nativeWrapperSourceSha256:'d1487d41f8c3bf4e63d1066c4838f7586f658119b5afedeeb101056694a9b3cc',
            sourceKey:field.key,kind:'native-page-prefix-wrapper',valueBefore:field.value,valueAfter:value,
            changeRules:['citationCleanup'],minorSafe:false,
            method:'one native Page/Pages role; exact one-argument native P. wrapper; only numeric page/range payload; duplicate native page prefix removed; supplied digits and range character retained'}}];
    }
    const V219_SOURCE_ENGLISH_MONTH_WORDS=Object.freeze({january:1,february:2,march:3,april:4,may:5,june:6,
        july:7,august:8,september:9,october:10,november:11,december:12});
    const V219_SOURCE_MONTH_WORDS=Object.freeze({...V219_SOURCE_ENGLISH_MONTH_WORDS,
        janeiro:1,fevereiro:2,'março':3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12});
    function v219SourceMonthToken(value) {
        return typeof value==='string'&&Object.hasOwn(V219_SOURCE_MONTH_WORDS,value.toLocaleLowerCase('pt'))?
            V219_SOURCE_MONTH_WORDS[value.toLocaleLowerCase('pt')]:0;
    }
    function v219SourcePublicationDateRole(key) {
        return v219NativeCitationRoles(key).some(role=>['Date','Year','PublicationDate','OrigYear','OrigDate','AirDate'].includes(role));
    }
    function v219SourceMonthYearEdits(fields,context,sourceContract,options={}) {
        if(options.dates===false||options.automaticCitationDateValues===false||!sourceContract)return [];
        const months=fields.filter(field=>v219NativeCitationRoles(field.key).includes('Month')||['mês','mes','month'].includes(field.key)),publication=fields.filter(field=>v219SourcePublicationDateRole(field.key)),
            dateRoles=field=>v219NativeCitationRoles(field.key),edits=[];
        if(fields.some(field=>['day','Day','dia','origdate','orig-date','data-original'].includes(field.key)))return [];
        const proof=(field,kind,before,after)=>({nativeTemplate:context.native.name,nativeTemplateOldid:context.profile.oldid,
            nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,nativeAliasOldid:sourceContract.aliasOldid,
            sourceRevision:72349758,sourceKey:field.key,kind,valueBefore:before,valueAfter:after,
            changeRules:['v218CitationDateValues'],minorSafe:false,
            method:'source-proven full month words; unique native publication year/date roles; no invented day; exact month precision'});
        if(months.length===0&&publication.length===1){
            const field=publication[0],roles=dateRoles(field),match=/^([ \t\r\n]*)([1-9]\d{3})[ \t]+([A-Za-z]+)([ \t\r\n]*)$/.exec(field.value),
                token=match&&match[3].toLowerCase(),
                month=token&&Object.hasOwn(V219_SOURCE_ENGLISH_MONTH_WORDS,token)?V219_SOURCE_ENGLISH_MONTH_WORDS[token]:0;
            if(!match||!month||!roles.some(role=>['Date','Year'].includes(role)))return [];
            const value=match[1]+MONTH_PT[month]+' de '+match[2]+match[4];
            if(roles.includes('Year'))edits.push({start:field.keyStart,end:field.keyEnd,text:'data',proof:proof(field,'typed-year-month-scalar',field.key,'data')});
            edits.push({start:field.start,end:field.end,text:value,proof:proof(field,'typed-year-month-scalar',field.value,value)});
            return edits;
        }
        if(months.length!==1||publication.length!==1)return [];
        const year=publication[0],month=months[0];if(!dateRoles(year).includes('Year')||!['mês','mes','month'].includes(month.key))return [];
        const yearValue=/^([ \t\r\n]*)([1-9]\d{3})([ \t\r\n]*)$/.exec(year.value),
            monthValue=/^[ \t\r\n]*([\p{L}]+)(?:[ \t]*\/[ \t]*([\p{L}]+))?[ \t\r\n]*$/u.exec(month.value);
        if(!yearValue||!monthValue)return [];
        const first=v219SourceMonthToken(monthValue[1]),last=monthValue[2]?v219SourceMonthToken(monthValue[2]):0;
        if(!first||monthValue[2]&&(!last||first>=last))return [];
        const value=yearValue[1]+MONTH_PT[first]+(last?'–'+MONTH_PT[last]:'')+' de '+yearValue[2]+yearValue[3],
            binding={yearKey:year.key,yearValue:year.value,monthKey:month.key,monthValue:month.value,precision:last?'month-range':'month'};
        edits.push({start:year.keyStart,end:year.keyEnd,text:'data',proof:{...proof(year,'typed-native-month-year-pair',year.key,'data'),...binding}},
            {start:year.start,end:year.end,text:value,proof:{...proof(year,'typed-native-month-year-pair',year.value,value),...binding}},
            {start:month.partStart-1,end:month.partEnd,text:'',proof:{...proof(month,'typed-native-month-year-pair',month.value,value),...binding}});
        return edits;
    }
    function v219SourceMissingEquals(raw,context,sourceContract,options={}) {
        if(options.citationRepairs===false||options.syntaxRepairs===false||options.structuralRepairs===false||
            !sourceContract||context.profile.accepted.some(key=>/^\d+$/.test(key)))return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts||parts.length<2)return null;
        const candidates=[];
        for(const part of parts.slice(1)){
            const match=/^([ \t]*)(url|URL|Url|acessodata|acessadoem)([ \t]+)([^\r\n{}<>\uE000-\uF8FF]+?)([ \t]*)$/.exec(part.text);
            if(!match)continue;
            const key=match[2],value=match[4],role=/^url$/i.test(key)?'URL':'AccessDate';
            if(!nativeCitationAccepts(context.native,key)||!v219NativeCitationRoles(key).includes(role))continue;
            const date=role==='AccessDate'?v218CitationDateValue(value,'access'):null;
            if(role==='URL'?!v213LiteralURL(value):!date||date.precision!=='day')continue;
            candidates.push({part,key,value,role,at:2+part.start+match[1].length+key.length});
        }
        if(candidates.length!==1)return null;
        const candidate=candidates[0],after=raw.slice(0,candidate.at)+'='+raw.slice(candidate.at),fields=v2151FieldSyntaxParts(after);
        if(!fields||fields.some(field=>field.separator!=='='||field.key!==field.plain||!nativeCitationAccepts(context.native,field.key))||
            fields.filter(field=>v219NativeCitationRoles(field.key).includes(candidate.role)).length!==1)return null;
        return {...candidate,after};
    }
    function v219SourceDOISlashSpacing(value) {
        if(typeof value!=='string'||value.length>8192)return null;
        const match=/^([ \t]*)(10\.\d{4,9})( *)\/( *)([A-Za-z0-9][A-Za-z0-9._;()/:-]*)([ \t]*)$/.exec(value);
        if(!match||!match[3]&&!match[4]||!v213DOI(match[2]+'/'+match[5]))return null;
        const edits=[],before=match[1].length+match[2].length;
        if(match[3])edits.push({start:before,end:before+match[3].length,text:''});
        if(match[4])edits.push({start:before+match[3].length+1,end:before+match[3].length+1+match[4].length,text:''});
        return {edits,identifier:match[2]+'/'+match[5],after:match[1]+match[2]+'/'+match[5]+match[6]};
    }
    function v219SourceNativeUrlAccessEdits(fields,context,sourceContract) {
        if(!sourceContract)return [];
        const family=['url-access','acesso-url','acessourl','urlaccess'],present=fields.filter(field=>family.includes(field.key));
        if(present.length!==1)return [];
        const field=present[0];
        if(!['url-access','acesso-url','acessourl'].includes(field.key)||!nativeCitationAccepts(context.native,field.key))return [];
        const literal=v218CitationCommentView(field.value),match=literal&&/^([ \t]*)(subscription)([ \t]*)$/.exec(literal.view);
        if(!match)return [];
        const start=field.start+match[1].length,
            after=field.value.slice(0,match[1].length)+'subscrição'+field.value.slice(match[1].length+match[2].length);
        return [{start,end:start+match[2].length,text:'subscrição',ruleId:'v219SourceCompatibility',proof:{
            nativeTemplate:context.native.name,nativeTemplateOldid:context.profile.oldid,nativeConfigOldid:73016847,
            nativeWhitelistOldid:71860752,nativeAliasOldid:sourceContract.aliasOldid,sourceRevision:73087684,
            sourceKey:field.key,targetKey:field.key,kind:'url-access-english-enum',valueBefore:field.value,valueAfter:after,
            sourceEnum:'subscription',targetEnum:'subscrição',changeRules:['v219SourceCompatibility'],minorSafe:false,
            method:'one accepted native UrlAccess field; exact invalid subscription enum; separately reviewed active native enum; no competing alias or blank; key and surrounding bytes retained'}}];
    }
    function v219AuxiliaryKeyCandidate(source) {
        return typeof source==='string'&&/\|[ \t\r\n]*título[ \t\r\n]*=/.test(source)&&
            /\{\{[ \t_]*(?:(?:[Pp]redefinição|[Tt]emplate)[ \t_]*:[ \t_]*)?(?:[Bb]ar[ _]+box|[Yy]ou(?:Tube|tube))[ \t_]*(?:\||\}\})/i.test(source);
    }
    function v219AuxiliaryNativeTitle(raw,options={}) {
        const cfg={...DEFAULTS,...options};if(!cfg.auxiliaryTemplates||!v219AuxiliaryKeyCandidate(raw))return null;
        const parts=splitParts(raw.slice(2,-2)),name=v215TemplateTitle(parts[0]),
            fields=v2151FieldSyntaxParts(raw);
        if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))return null;
        const labels=fields.filter(field=>['título','titulo','title'].includes(field.key));
        if(labels.length!==1||labels[0].key!=='título'||!v219SourceCompatibilityValue(labels[0].value,{kind:'label'}))return null;
        if(/^[Bb]ar box$/.test(name)){
            const allowed=new Set(['float','border_width','width','background-color','style','título','titlebar',
                'left1','left2','barwidth','right1','right2','bars','caption']);
            if(fields.some(field=>!allowed.has(field.key))||new Set(fields.map(field=>field.key)).size!==fields.length)return null;
            return {field:labels[0],target:'title',kind:'bar-label',nativeTemplate:'bar box',nativeTemplateOldid:56190182,
                nativeSourceSha256:'61d086537b72a03f18944028856d45131b173824110d8c42687cebfc84258e84'};
        }
        if(!/^[Yy]ou(?:Tube|tube)$/.test(name)||TEMPLATE_CATALOG.youtube?.oldid!==68628923)return null;
        const selectors=['user','usuario','u','channel','canal','c','show','programa','s','pgm','id'],
            present=fields.filter(field=>selectors.includes(field.key)),allowed=new Set([...selectors,'título','link']);
        if(present.length!==1||fields.some(field=>!allowed.has(field.key))||
            new Set(fields.map(field=>field.key)).size!==fields.length)return null;
        const selector=present[0],value=selector.value.trim();
        if(!/^[A-Za-z0-9_-]{1,100}$/.test(value)||selector.key==='id'&&!/^[A-Za-z0-9_-]{11}$/.test(value))return null;
        return {field:labels[0],target:'titulo',kind:'video-label',nativeTemplate:'youtube',nativeTemplateOldid:68628923,
            nativeRedirectOldid:/Tube$/.test(name)?46314985:null,selector:selector.key,
            nativeSourceSha256:'cf237dcffe6efe3db07e9be8307f73bec0f23bc1729eb9ecc179c3d8cf4957ef'};
    }
    function v219SourceCompatibilityScope(source,options={}) {
        const cfg={...DEFAULTS,...options};
        return v219SourceCompatibilityCandidate(source)&&source.length<=4194304&&cfg.automaticSourceCompatibility!==false&&
            (cfg.citations!==false||cfg.auxiliaryTemplates!==false&&v219AuxiliaryKeyCandidate(source))&&
            cfg.automaticParameterNames!==false&&cfg.namespaceNumber===0&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&
            !cfg.sectionOnly&&!cfg.discussionPage&&(!cfg.contentModel||cfg.contentModel==='wikitext')&&
            v20AutomationAllowed(source,cfg)&&!v24SyntaxScan(source).issues.length;
    }
    function v219SourceCompatibilityShield(source) {
        const shield=v24SyntaxProtected(source),code=v219QuotedTemplateRanges(source),
            refs=refTokens(scanProtectedView(source)).filter(ref=>ref.body!==null&&attrsOf(ref.attrs)!==null),
            ranges=[];
        let exposed=false;
        for(const range of shield.ranges){
            if(range.kind!=='quotation'){ranges.push(range);continue;}
            const ordinary=refs.filter(ref=>range.start<ref.start&&ref.end<range.end&&
                !code.some(item=>item.start<ref.end&&item.end>ref.start)&&
                !shield.ranges.some(item=>item!==range&&item.kind!=='quotation'&&item.start<ref.end&&item.end>ref.start));
            if(!ordinary.length){ranges.push(range);continue;}
            let start=range.start;
            for(const ref of ordinary){if(start<ref.start)ranges.push({...range,start,end:ref.start});start=ref.end;}
            if(start<range.end)ranges.push({...range,start});exposed=true;
        }
        if(!exposed&&!code.length)return shield;
        ranges.push(...code.map(range=>({...range,kind:'quoted-code'})));
        let view=source;
        for(const range of [...ranges].sort((a,b)=>b.start-a.start))
            view=view.slice(0,range.start)+view.slice(range.start,range.end).replace(/[^\r\n]/g,' ')+view.slice(range.end);
        return {...shield,ranges,view};
    }
    function v219SourceCompatibilityEdits(source,options={}) {
        if(!v219SourceCompatibilityScope(source,options))return [];
        const sourceHash=v24SyntaxHash(source),shield=v219SourceCompatibilityShield(source),parsedNodes=templates(shield.view),
            markdown=v27SafeMarkdownRanges(source),edits=[];
        if(shield.unclosed.length||parsedNodes.unclosed.length)return [];
        for(const node of parsedNodes.nodes){
            const raw=source.slice(node.start,node.end);if(!v219SourceCompatibilityCandidate(raw))continue;
            if(parsedNodes.nodes.some(parent=>parent.start<node.start&&parent.end>=node.end)||
                markdown.some(range=>range.start<node.end&&range.end>node.start))continue;
            const linkDate=v219SourceLinkDate(raw,options);
            if(linkDate){
                const field=linkDate.field;
                if(shield.ranges.some(range=>range.start<node.end&&range.end>node.start))continue;
                edits.push({start:node.start+field.start,end:node.start+field.end,text:linkDate.value,ruleId:'v218CitationDateValues',
                    proof:{sourceHash,nativeTemplate:'Link',nativeTemplateOldid:72099361,nativeWrapperOldid:72119762,
                        sourceKey:field.key,kind:'native-link-access-date-wrapper',valueBefore:field.value,valueAfter:linkDate.value,
                        fieldStart:field.start,fieldEnd:field.end,wrapperStart:linkDate.wrapperStart,wrapperEnd:linkDate.wrapperEnd,
                        identity:linkDate.tuple,changeRules:['v218CitationDateValues'],minorSafe:false,
                        method:'exact native Link access-date forwarding role; one unique alias including blank competitors; exact native Dtlink three-numeral full-day wrapper; valid calendar and all surrounding bytes retained'}});
                continue;
            }
            const titre=v219NativeTitreRepair(raw,options);
            if(titre&&!shield.ranges.some(range=>range.start<node.start+titre.field.keyEnd&&range.end>node.start+titre.field.keyStart)){
                const {field,context}=titre;
                edits.push({start:node.start+field.keyStart,end:node.start+field.keyEnd,text:'título',ruleId:'v219SourceCompatibility',proof:{sourceHash,
                    nativeTemplate:context.native.name,nativeTemplateOldid:context.profile.oldid,nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,
                    nativeAliasOldid:context.alias?.nativeAliasOldid??null,sourceRevision:72349758,sourceRule:'c.citation.tradpred.124',sourceKey:'titre',targetKey:'título',
                    value:field.value,kind:'declared-supplied-title-key',changeRules:['v219SourceCompatibility'],minorSafe:false,
                    method:'exact predecessor-supplied key; unique native Title role; no blank/filled/duplicate target competitor; unchanged supplied value and header'}});
            }
            const auxiliary=v219AuxiliaryNativeTitle(raw,options);
            if(auxiliary){
                const field=auxiliary.field;
                if(shield.ranges.some(range=>range.start<=node.start&&range.end>=node.end)||
                    shield.ranges.some(range=>range.start<node.start+field.keyEnd&&range.end>node.start+field.keyStart))continue;
                edits.push({start:node.start+field.keyStart,end:node.start+field.keyEnd,text:auxiliary.target,
                    ruleId:'v219SourceCompatibility',proof:{sourceHash,nativeTemplate:auxiliary.nativeTemplate,
                        nativeTemplateOldid:auxiliary.nativeTemplateOldid,nativeSourceSha256:auxiliary.nativeSourceSha256,
                        nativeRedirectOldid:auxiliary.nativeRedirectOldid??null,sourceKey:field.key,targetKey:auxiliary.target,
                        kind:auxiliary.kind,selector:auxiliary.selector??null,value:field.value,
                        changeRules:['v219SourceCompatibility'],minorSafe:false,
                        method:'exact-native-template-branch; ignored-label-key; no-competing-label-or-selector; exact-value-bytes'}});
                continue;
            }
            if(options.citations===false)continue;
            const context=v218CitationNativeContext(raw),sourceContract=v219SourceNativeContract(raw,context);
            if(!sourceContract)continue;
            if(shield.ranges.some(range=>range.start<=node.start&&range.end>=node.end))continue;
            const missingEquals=v219SourceMissingEquals(raw,context,sourceContract,options);
            if(missingEquals){
                const at=node.start+missingEquals.at;
                if(!shield.ranges.some(range=>range.start<at+1&&range.end>at))edits.push({start:at,end:at,text:'=',
                    ruleId:'v219SourceCompatibility',proof:{sourceHash,nativeTemplate:context.native.name,
                        nativeTemplateOldid:context.profile.oldid,nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,
                        nativeAliasOldid:sourceContract.aliasOldid,sourceKey:missingEquals.key,targetKey:missingEquals.key,
                        kind:'typed-native-missing-equals',value:missingEquals.value,role:missingEquals.role,
                        changeRules:['v219SourceCompatibility'],minorSafe:false,
                        method:'one otherwise-invalid unnamed part; pure native named-argument interface; complete typed value; no competing native role; one inserted equals'}});
                continue;
            }
            const comments=v218CitationCommentView(raw),fields=comments&&v2151FieldSyntaxParts(raw);
            if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))continue;
            if(shield.ranges.some(range=>range.start<=node.start&&range.end>=node.end))continue;
            const {parsed,native,profile}=context;
            for(const edit of v219SourceMonthYearEdits(fields,context,sourceContract,options)){
                if(shield.ranges.some(range=>range.start<node.start+edit.end&&range.end>node.start+edit.start))continue;
                edits.push({...edit,start:node.start+edit.start,end:node.start+edit.end,ruleId:'v218CitationDateValues',
                    proof:{...edit.proof,sourceHash}});
            }
            for(const edit of [...v219SourceISOPeriodEdits(fields,context,sourceContract,options),
                ...v219SourcePageWrapperEdits(fields,context,sourceContract,options),
                ...v219SourceNativeUrlAccessEdits(fields,context,sourceContract)]){
                if(shield.ranges.some(range=>range.start<node.start+edit.end&&range.end>node.start+edit.start))continue;
                edits.push({...edit,start:node.start+edit.start,end:node.start+edit.end,proof:{...edit.proof,sourceHash}});
            }
            const doi=fields.filter(field=>['doi','DOI'].includes(field.key));
            if(doi.length===1){
                const field=doi[0],view=v218CitationCommentView(field.value),match=view&&/^([ \t]*)\/(10\.[\s\S]*?)([ \t]*)$/.exec(view.view);
                const spacing=v219SourceDOISlashSpacing(field.value);
                if(spacing&&!shield.ranges.some(range=>range.start<node.start+field.end&&range.end>node.start+field.start))
                    for(const edit of spacing.edits)edits.push({start:node.start+field.start+edit.start,end:node.start+field.start+edit.end,text:'',
                        ruleId:'v219SourceCompatibility',proof:{sourceHash,nativeTemplate:native.name,nativeTemplateOldid:profile.oldid,
                            nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,nativeAliasOldid:sourceContract.aliasOldid,
                            sourceKey:field.key,targetKey:field.key,kind:'typed-doi-slash-spacing',valueBefore:field.value,valueAfter:spacing.after,
                            sourceIdentifier:spacing.identifier,changeRules:['v219SourceCompatibility'],minorSafe:false,
                            method:'one unique exact DOI role; ASCII spaces immediately beside its first slash; complete DOI predicate; all other bytes retained'}});
                if(match&&v213DOI(match[2])&&!shield.ranges.some(range=>range.start<node.start+field.end&&range.end>node.start+field.start)){
                    const start=node.start+field.start+match[1].length;
                    edits.push({start,end:start+1,text:'',ruleId:'v219SourceCompatibility',proof:{sourceHash,
                        nativeTemplate:native.name,nativeTemplateOldid:profile.oldid,nativeConfigOldid:73016847,
                        nativeWhitelistOldid:71860752,nativeAliasOldid:sourceContract.aliasOldid,
                        sourceKey:field.key,targetKey:field.key,kind:'typed-doi-leading-slash',
                        valueBefore:field.value,valueAfter:field.value.slice(0,match[1].length)+field.value.slice(match[1].length+1),
                        sourceIdentifier:match[2],changeRules:['v219SourceCompatibility'],minorSafe:false,
                        method:'one exact typed native DOI field; one leading extraneous slash; existing DOI predicate; no competing alias; other bytes retained'}});
                }
            }
            for(const field of fields){
                const rule=v219SourceCompatibilityRule(field.key);
                if(!rule||nativeCitationAccepts(native,field.key)||!nativeCitationAccepts(native,rule.target)||
                    fields.filter(other=>rule.family.some(key=>norm(key)===norm(other.key))).length!==1||
                    !v219SourceCompatibilityValue(field.value,rule)||
                    shield.ranges.some(range=>range.start<node.start+field.keyEnd&&range.end>node.start+field.keyStart))continue;
                edits.push({start:node.start+field.keyStart,end:node.start+field.keyEnd,text:rule.target,
                    ruleId:'v219SourceCompatibility',proof:{sourceHash,template:parsed.name,nativeTemplate:native.name,
                        nativeTemplateOldid:profile.oldid,nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,
                        nativeAliasOldid:sourceContract.aliasOldid,
                        sourceKey:field.key,targetKey:rule.target,value:field.value,kind:rule.kind,
                        changeRules:['v219SourceCompatibility'],minorSafe:false,
                        method:'finite-unknown-key; native-target; unique-complete-alias-family; exact-value-bytes'}});
                if(rule.kind==='url-access'){
                    const literal=v218CitationCommentView(field.value),match=literal&&/^([ \t]*)(subscription)([ \t]*)$/.exec(literal.view);
                    if(match){
                        const start=node.start+field.start+match[1].length,after=field.value.slice(0,match[1].length)+'subscrição'+field.value.slice(match[1].length+match[2].length);
                        edits.push({start,end:start+match[2].length,text:'subscrição',ruleId:'v219SourceCompatibility',
                            proof:{sourceHash,template:parsed.name,nativeTemplate:native.name,nativeTemplateOldid:profile.oldid,
                                nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,sourceRevision:73087684,
                                sourceKey:field.key,targetKey:rule.target,kind:'url-access-english-enum',
                                valueBefore:field.value,valueAfter:after,sourceEnum:'subscription',targetEnum:'subscrição',
                                changeRules:['v219SourceCompatibility'],minorSafe:false,
                                method:'exact-whole-foreign-access-enum; reviewed-native-enum; one-literal-token; surrounding-bytes-retained'}});
                    }
                }
            }
        }
        return edits.sort((a,b)=>a.start-b.start||a.end-b.end);
    }
    function v219SourceCompatibilityPlan(source,options={}) {
        const edits=v219SourceCompatibilityEdits(source,options);
        return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v219SourceCompatibilityProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219SourceCompatibilityPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219SourceDateCallObligation(raw,options={}) {
        const context=v218CitationNativeContext(raw),contract=v219SourceNativeContract(raw,context);if(!contract)return null;
        const projected=v219SourceCompatibilityPlan(v219CitationEmptyPartsPlan(raw,options).text,options).text,fields=v2151FieldSyntaxParts(projected);
        if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))return null;
        const dates=[],remove=[];
        for(const field of fields){
            const roles=v219NativeCitationRoles(field.key).filter(role=>['Date','Year','PublicationDate','OrigYear','OrigDate','AirDate'].includes(role));
            if(!roles.length)continue;
            const value=field.value.trim(),kind=roles.includes('Year')?'year':'date',date=v218CitationDateValue(value,kind),
                identity=date?[date.precision,date.identity]:['literal',value];
            dates.push(JSON.stringify([roles,identity]));remove.push({start:field.partStart-1,end:field.partEnd,text:''});
        }
        const cfg={...DEFAULTS,...options},withoutDates=v24SyntaxApply(projected,remove),
            roleContext=v219CitationNativeRoleContext(withoutDates,cfg),languageContext=v219CitationNativeLanguageContext(roleContext,cfg),
            canonical=v24InventoryTemplate(languageContext,cfg),parsed=parsedTemplate(canonical),
            unknown=foreignEntries(parsed).filter(field=>field.positional||!nativeCitationAccepts(parsed,field.key))
                .map(field=>[field.positional?'positional:'+field.index:field.key,field.value]),
            rows=foreignEntries(parsedTemplate(withoutDates)).filter(field=>!field.positional).map(field=>{
                const roles=v219NativeCitationRoles(field.key);return [roles.length===1?roles[0]:'key:'+field.key,field.key,field.value.trim()];
            }),collisions=new Set(rows.filter(row=>new Set(rows.filter(other=>other[0]===row[0]).map(other=>other[2])).size>1).map(row=>row[0])),
            precedence=rows.filter(row=>collisions.has(row[0])),
            binding=JSON.stringify([context.native.name,context.profile.oldid,v218ReferenceBodyInventory(canonical,cfg),unknown,precedence]);
        return {binding,dates:[...new Set(dates)].sort(),nativeTemplate:context.native.name,nativeTemplateOldid:context.profile.oldid};
    }
    function v219SourceDateRetention(before,after,options={}) {
        if(before===after||typeof before!=='string'||typeof after!=='string'||
            !/\|[ \t\r\n]*(?:(?:data|date|ano|year|Ano|año)[ \t]*=[ \t\r\n]*[1-9]\d{3}[ \t]+[A-Za-z]+|(?:mês|mes|month)[ \t]*=|[^|={}\r\n]{1,80}[ \t]*=[ \t]*[1-9]\d{3}-\d{2}-\d{2}\.)/.test(before))return {accepted:true,reason:''};
        const cfg={...DEFAULTS,...options},prepared=v219CitationEmptyPartsPlan(before,cfg).text,plan=v219SourceCompatibilityPlan(prepared,cfg),
            edits=v219StageSafeEdits(prepared,plan.edits,'v219-source-compatibility',cfg).filter(edit=>
            ['typed-year-month-scalar','typed-native-month-year-pair','typed-iso-terminal-period'].includes(edit.proof?.kind));
        if(!edits.length)return {accepted:true,reason:''};
        const required=new Map(),allBefore=new Map(),retained=new Map(),memo=new Map(),collect=(source,map,triggered=false)=>{
            const protectedOwners=v219StageProtectedRanges(source,cfg);
            for(const node of templates(protectedView(source)).nodes){
                if(protectedOwners.some(range=>range.start<=node.start&&range.end>=node.end))continue;
                const raw=source.slice(node.start,node.end);if(!memo.has(raw))memo.set(raw,v219SourceDateCallObligation(raw,cfg));
                const obligation=memo.get(raw);if(!obligation)continue;
                if(!map.has(obligation.binding))map.set(obligation.binding,new Set());
                for(const date of obligation.dates)map.get(obligation.binding).add(date);
                if(triggered&&edits.some(edit=>edit.start>=node.start&&edit.end<=node.end)){
                    if(!required.has(obligation.binding))required.set(obligation.binding,new Set());
                    for(const date of obligation.dates)required.get(obligation.binding).add(date);
                }
            }
        };
        collect(prepared,allBefore,true);if(!required.size)return {accepted:false,reason:'Não foi possível confirmar a data e a publicação do reparo de data.'};
        collect(after,retained);
        for(const [binding,dates]of required){
            const actual=retained.get(binding),known=allBefore.get(binding);
            if(!actual||[...dates].some(date=>!actual.has(date))||[...actual].some(date=>!known.has(date)))
                return {accepted:false,reason:'Uma data reparada perdeu o ano, o mês, a precisão ou a publicação a que pertencia.'};
        }
        return {accepted:true,reason:''};
    }
    function v219CitationEmptyPartsPlan(source,options={}) {
        const cfg={...DEFAULTS,...options},empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,edits:[],text:source};
        if(typeof source!=='string'||source.length>4194304||cfg.automaticSourceCompatibility===false||cfg.citations===false||
            cfg.citationRepairs===false||cfg.syntaxRepairs===false||cfg.structuralRepairs===false||cfg.namespaceNumber!==0||
            cfg.pageRedirect||cfg.pageDisambiguation||cfg.sectionOnly||cfg.discussionPage||cfg.contentModel&&cfg.contentModel!=='wikitext'||
            !/\|[ \t\r\n]*(?:\||\}\})/.test(source)||!/\{\{[ \t_]*(?:(?:[Pp]redefinição|[Tt]emplate)[\s_]*:[\s_]*)?(?:[Cc]itar[ _]+(?:web|jornal|revista|livro|periódico)|[Cc]ite[ _]+(?:web|news|book|journal|magazine))[ \t\r\n_]*\|/i.test(source)||
            !v20AutomationAllowed(source,cfg)||v24SyntaxScan(source).issues.length)return empty;
        const shield=v24SyntaxProtected(source),parsed=templates(shield.view),markdown=v27SafeMarkdownRanges(source);
        if(shield.unclosed.length||parsed.unclosed.length)return empty;
        const edits=[];
        for(const node of parsed.nodes){
            if(parsed.nodes.some(parent=>parent.start<node.start&&parent.end>=node.end)||
                markdown.some(range=>range.start<node.end&&range.end>node.start))continue;
            const raw=source.slice(node.start,node.end),context=v218CitationNativeContext(raw),sourceContract=v219SourceNativeContract(raw,context);
            if(!sourceContract||
                context.profile.accepted.some(key=>/^\d+$/.test(key))||
                shield.ranges.some(range=>range.start<=node.start&&range.end>=node.end))continue;
            const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts||parts.length<3)continue;
            const fields=parts.slice(1),blanks=fields.filter(part=>!part.text.trim());
            if(!blanks.length||blanks.length===fields.length||fields.some(part=>part.text.trim()&&
                !/^[ \t\r\n]*\p{L}[\p{L}\p{N} _/()\-]*[ \t]*=[\s\S]*$/u.test(part.text)))continue;
            for(const blank of blanks){
                const start=node.start+1+blank.start,end=node.start+2+blank.end;
                if(shield.ranges.some(range=>range.start<end&&range.end>start))continue;
                edits.push({start,end,text:'',ruleId:'v219CitationEmptyParts',proof:{sourceHash:empty.sourceHash,
                    nativeTemplate:context.native.name,nativeTemplateOldid:context.profile.oldid,
                    nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,nativeModuleOldid:72936771,
                    nativeAliasOldid:sourceContract.aliasOldid,
                    changeRules:['v219CitationEmptyParts'],minorSafe:true,
                    method:'one pinned native CS1 call; no accepted numeric argument; every surviving argument explicitly named; only empty unnamed parts removed; named blank overrides retained'}});
            }
        }
        edits.sort((a,b)=>a.start-b.start||a.end-b.end);
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219CitationEmptyPartsProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219CitationEmptyPartsPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219CitationProtocolPlan(source,options={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]},cfg={...DEFAULTS,...options};
        if(typeof source!=='string'||source.length>4194304||!v213ReferenceScope(cfg)||
            cfg.citations===false||cfg.citationRepairs===false||cfg.automaticSourceCompatibility===false||
            !/https?:\/\/https?:\/\//.test(source)||v24SyntaxScan(source).issues.length)return empty;
        const shield=v219SourceCompatibilityShield(source),nodes=templates(shield.view),
            hard=v219StageProtectedRanges(source,cfg),edits=[];
        if(shield.unclosed.length||nodes.unclosed.length)return empty;
        for(const node of nodes.nodes){
            if(nodes.nodes.some(parent=>parent.start<node.start&&parent.end>=node.end)||
                hard.some(range=>range.start<node.end&&range.end>node.start))continue;
            const raw=source.slice(node.start,node.end);if(!/https?:\/\/https?:\/\//.test(raw))continue;
            const local=v219LocalCitationRedirectProfile(raw),original=v2151FieldSyntaxParts(raw);
            let candidate=raw,aliasOldid=null;
            if(local){
                const forwarded=v219LocalCitationRedirectCall(raw,cfg);
                if(!forwarded||forwarded.blocked)continue;
                candidate=forwarded.text;aliasOldid=local.nativeAliasOldid;
            }else{
                const native=TEMPLATE_CATALOG[parsedTemplate(raw).name];
                if(!native||!v215LiteralTemplateIdentity(raw,native))continue;
            }
            // The existing typed reader expects its header on one line.
            // Exterior native-title padding is irrelevant to that proof,
            // but remains untouched in the source and in every mapped field.
            const parts=splitParts(candidate.slice(2,-2));
            candidate='{{'+parts[0].trim()+candidate.slice(2+parts[0].length);
            const parsed=v213NativeCitationFields(candidate),mapped=v2151FieldSyntaxParts(candidate);
            if(!parsed||parsed.profile||parsed.english||!original||!mapped||original.length!==mapped.length||
                mapped.length!==parsed.fields.length||original.some(field=>field.key!==field.plain||field.separator!=='=')||
                mapped.some(field=>field.key!==field.plain||field.separator!=='='))continue;
            const fresh=v213ReferenceFieldPlan(candidate,cfg);
            if(!v213ReferenceFieldProof(candidate,fresh.text,fresh,cfg))continue;
            for(let index=0;index<parsed.fields.length;index++){
                const field=parsed.fields[index],prior=original[index],role=v213FieldRole(parsed.p,field.nativeKey),
                    literal=field.value.trim(),value=v213ProtocolValue(literal);
                if(!role?.startsWith('url:')||value===null||prior.value!==field.value||
                    parsed.fields.filter(other=>v213FieldRole(parsed.p,other.nativeKey)===role).length!==1)continue;
                const lead=field.value.length-field.value.trimStart().length,change=fresh.edits.find(edit=>
                    edit.start===field.start+lead&&edit.end===field.start+lead+literal.length&&edit.text===value&&
                    edit.ruleId==='v213ProtocolChains'&&JSON.stringify(edit.proof?.changeRules)==='["v213ProtocolChains"]'&&
                    edit.proof?.role===role);
                if(!change)continue;
                const start=node.start+prior.start+lead,end=start+literal.length;
                if(source.slice(start,end)!==literal)continue;
                edits.push({start,end,text:value,ruleId:'v213ProtocolChains',proof:{sourceHash:empty.sourceHash,
                    kind:'native-forwarded-protocol-chain',nativeTemplate:parsed.p.name,nativeAliasOldid:aliasOldid,
                    nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,callStart:node.start,callEnd:node.end,
                    sourceKey:prior.key,nativeKey:field.nativeKey,role,before:literal,after:value,
                    changeRules:['v213ProtocolChains'],minorSafe:true,
                    method:'exact native citation or pinned native redirect; existing native argument adaptation; identical supplied field value and part index; one unique native URL role; existing fresh v213 typed same-scheme protocol correction only'}});
            }
        }
        edits.sort((a,b)=>a.start-b.start||a.end-b.end);
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219CitationProtocolProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219CitationProtocolPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219CitationProtocolProjection(source,options={}) {
        return v219CitationProtocolPlan(source,options).text;
    }
