    // These readers change comparison inputs only. They never write page text,
    // suppress findings, discard identifiers or relax reference multiplicity.
    function v219TypedIdentifierRole(field,p) {
        const key=field.nativeKey;
        if(key===undefined&&field.emptyCleanup===true)return null;
        const role=parameterFamily(mappedParam(key,p.name));
        return ['isbn','doi','pmid','pmc'].includes(role)?role:null;
    }
    function v219CanonicalTypedIdentifier(role,value) {
        if(typeof value!=='string'||value!==value.trim())return false;
        if(role==='isbn')return v213ISBN(value);
        if(role==='doi')return v213DOI(value);
        return ['pmid','pmc'].includes(role)&&/^[1-9]\d{0,8}$/.test(value);
    }
    function v219LiteralISBNValues(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!source.includes('SBN')||
            TEMPLATE_CATALOG.isbn?.oldid!==67618988)return [];
        const view=protectedView(source),protectedRanges=v219StageProtectedRanges(source,cfg),ids=new Set();
        // ISBN 67618988 prints its first positional value. Read only that
        // exact literal one-value call, independently of unrelated malformed
        // angle-bracket text that can interrupt the general template reader.
        // Other fields, dynamic values and protected examples give no proof.
        for(const match of view.matchAll(/\{\{[ \t\r\n]*(?:(?:[Pp]redefinição|[Tt]emplate)[ \t]*:[ \t]*)?[Ii]SBN[ \t\r\n]*\|[ \t\r\n]*([0-9Xx -]+)[ \t\r\n]*\}\}/g)){
            if(protectedRanges.some(range=>range.start<match.index+match[0].length&&range.end>match.index))continue;
            const value=match[1].trim().toUpperCase();
            if(v213ISBN(value))ids.add(value.replace(/[ -]/g,''));
        }
        return [...ids].sort();
    }
    function v219CitationHeaderProbe(source,node) {
        if(typeof source!=='string'||!Number.isInteger(node?.start)||!Number.isInteger(node?.end)||
            node.start<0||node.end>source.length||node.end<=node.start+4)return null;
        let start=node.start+2;
        while(start<node.end&&/[ \t\r\n]/.test(source[start]))start++;
        // Only exterior whitespace is skipped. A newline within the title
        // still stops this cheap gate, and the exact native/profile identity
        // check remains authoritative after the header reaches that reader.
        return /^([^|{}\r\n]+)/.exec(source.slice(start,Math.min(node.end,start+240)));
    }
    function v219IdentifierCitationFields(raw) {
        const native=v213NativeCitationFields(raw);if(native)return native;
        if(typeof raw!=='string'||!raw.endsWith('}}')||
            /<!--|[<>\uE000-\uF8FF]|\{\{\{/.test(raw))return null;
        const p=parsedTemplate(raw),head=p.parts[0].trim().replace(/_/g,' ')
            .replace(/^(?:predefinição|template)\s*:\s*/i,''),profile=TEMPLATE_CATALOG.citation;
        // The generic native citation uses the same CS1 identifier handlers.
        // It is read separately because it intentionally has no guessed book,
        // newspaper or journal family in the ordinary field-repair reader.
        if(!/^[Cc]itation$/.test(head)||!profile||profile.oldid!==62525251||
            !v215LiteralTemplateIdentity(raw))return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
        const canonical={name:'citation',parts:['Citation']},fields=[];
        for(const part of parts.slice(1)) {
            const match=/^(\s*)([^={}\[\]<>\r\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);
            if(!match)return null;
            const key=match[2].trim(),value=match[4];
            if(!/^[\p{L}\d _/-]+$/u.test(key)||!profileAccepts(profile,key)||
                /^(?:inventor(?:[1-4])?(?:[- ]|$)|country-code$|publication-number$|patent-number$)/i.test(key))return null;
            if(/[{}]/.test(value)&&!/^\s*\{\{ISBN\|[0-9Xx -]+\}\}\s*$/.test(value))return null;
            fields.push({key,nativeKey:key,value,emptyCleanup:false,parameterStart:1+part.start,
                start:2+part.start+match[1].length+match[2].length+match[3].length,end:2+part.end});
        }
        return {p:canonical,fields,profile:null,target:'Citation',english:false};
    }
    function v219IdentifierPreservationCall(raw,cfg={}) {
        const empty={source:raw,text:raw,edits:[]};
        if(cfg.citations===false||typeof raw!=='string'||!v215LiteralTemplateIdentity(raw))return empty;
        const original=v219IdentifierCitationFields(raw);if(!original)return empty;
        // Reuse the existing, option-sensitive native normalization. Merely
        // looking like an identifier is insufficient to authorize equivalence.
        const normalized=v24InventoryTemplate(raw,cfg),after=v219IdentifierCitationFields(normalized);
        if(!after)return empty;
        const edits=[];
        for(const field of original.fields) {
            const role=v219TypedIdentifierRole(field,original.p);if(!role)continue;
            if(original.fields.filter(other=>v219TypedIdentifierRole(other,original.p)===role).length!==1)continue;
            const matches=after.fields.filter(other=>v219TypedIdentifierRole(other,after.p)===role);
            if(matches.length!==1||!v219CanonicalTypedIdentifier(role,matches[0].value.trim()))continue;
            const canonical=matches[0].value.trim();if(canonical===field.value)continue;
            edits.push({start:field.start,end:field.end,text:canonical,role,
                before:field.value,canonical,nativeKey:field.nativeKey});
        }
        return {source:raw,text:v24SyntaxApply(raw,edits),edits};
    }
    function v219IdentifierPreservationPlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options}),empty={source,
            sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.citations===false||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg))return empty;
        if(!/(?:isbn|doi|pmid|pmc)/i.test(source))return empty;
        const shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source),parsed=templates(shield.view),
            ranges=[...shield.ranges,...markdown];
        const edits=[];
        for(const node of parsed.nodes) {
            // A quoted title does not turn a different, literal identifier
            // field into an example. A quote enclosing the call or the typed
            // field still excludes it. An incomplete later tail cannot give
            // or withdraw equivalence for an earlier complete literal call.
            if(ranges.some(range=>range.start<=node.start&&range.end>node.start)||
                parsed.unclosed.some(open=>open.start<node.end)||
                shield.unclosed.some(range=>range.start<node.end&&range.end>node.start))continue;
            const raw=source.slice(node.start,node.end),plan=v219IdentifierPreservationCall(raw,cfg);
            for(const edit of plan.edits) {
                if(ranges.some(range=>range.start<node.start+edit.end&&range.end>node.start+edit.start))continue;
                edits.push({...edit,start:node.start+edit.start,end:node.start+edit.end,
                proof:{sourceHash:empty.sourceHash,callStart:node.start,callEnd:node.end,raw,
                    normalization:plan.text,condition:'one complete literal known native CS1 call outside a protected example; one unique unprotected typed identifier field; the existing option-sensitive normalization produces the exact validated identifier; all other source bytes and every other guard remain unchanged'}});
            }
        }
        edits.sort((a,b)=>a.start-b.start);
        if(edits.some((edit,index)=>index&&edit.start<edits[index-1].end))return empty;
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219IdentifierPreservationSource(source,options={}) {
        return v219IdentifierPreservationPlan(source,options).text;
    }
    function v219IdentifierPreservationProof(before,after,plan,options={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||
            plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219IdentifierPreservationPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219CitationDayContext(raw,cfg={}) {
        if(cfg.dates===false)return raw;
        const context=v218CitationNativeContext(raw),fields=v2151FieldSyntaxParts(raw);
        if(!context||!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))return raw;
        const edits=[];
        for(const field of fields) {
            const kind=V218_CITATION_DATE_FIELDS[field.key];
            if(!kind||kind==='year'||!nativeCitationAccepts(context.native,field.key))continue;
            const parsed=v218CitationDateValue(field.value,kind)||v218CitationDateValue(normalizeDate(field.value,()=>{}),kind),day=parsed?.identity;
            if(parsed?.precision!=='day'||!day||!validDate(day.day,day.month,day.year))continue;
            const padding=/^([ \t\r\n]*)([\s\S]*?)([ \t\r\n]*)$/.exec(field.value),
                canonical=padding[1]+day.year+'-'+String(day.month).padStart(2,'0')+'-'+String(day.day).padStart(2,'0')+padding[3];
            if(canonical!==field.value)edits.push({start:field.start,end:field.end,text:canonical});
        }
        // Compare one independently validated native date field at a time.
        // An unmatched quote in a different title field cannot turn the same
        // archive/access/publication day into a different publication context.
        return v24SyntaxApply(raw,edits);
    }
    function v219CitationNativeRoleContext(raw,cfg={}) {
        const context=v218CitationNativeContext(raw),fields=v2151FieldSyntaxParts(raw),
            pins={...V218_CITATION_ISLAND_CONTRACTS,citation:62525251,'citar comunicado de imprensa':50506646,'citar conferência':48055134,'citar relatório':62084675,'citar vídeo':62110903,'citar enciclopédia':60787857,'citar tese':47976404};
        if(!context||pins[context.native.name]!==context.profile.oldid||!fields||
            !v215LiteralTemplateIdentity(raw)||fields.some(field=>field.key!==field.plain||field.separator!=='='))return raw;
        const header=context.parsed.parts[0],redirect=v219LocalCitationRedirectProfile(raw),
            local=v215SameTemplateTitle(header,context.profile.title)||redirect&&
                norm(redirect.target)===context.native.name&&redirect.nativeTemplateOldid===context.profile.oldid;
        if(!local)return raw;
        const rows=fields.map(field=>{const roles=nativeCitationAccepts(context.native,field.key)?v219NativeCitationRoles(field.key):[];
            return {field,roles,role:roles.length===1?roles[0]:null};}),edits=[];
        for(const row of rows){
            // These four native aliases have the same two configured roles.
            // A partial overlap with another field still blocks rewriting,
            // including an explicit blank that can affect alias priority.
            const sharedEncyclopedia=JSON.stringify(row.roles.slice().sort())===JSON.stringify(['Encyclopedia','Periodical']);
            if(sharedEncyclopedia){
                if(rows.some(other=>other!==row&&other.roles.some(role=>row.roles.includes(role))&&other.field.value.trim()!==row.field.value.trim()))continue;
                const target='enciclopedia';
                if(nativeCitationAccepts(context.native,target)&&JSON.stringify(v219NativeCitationRoles(target).slice().sort())===JSON.stringify(row.roles.slice().sort())&&target!==row.field.key)
                    edits.push({start:row.field.keyStart,end:row.field.keyEnd,text:target});
                continue;
            }
            if(!row.role||rows.some(other=>other.roles.includes(row.role)&&other.field.value.trim()!==row.field.value.trim()))continue;
            const numbered=/^(.*):([1-9]\d*)$/.exec(row.role),base=numbered?numbered[1]:row.role,
                aliases=V219_NATIVE_CS1_ALIAS_ROLES[base]||[],candidates=[];
            for(const alias of aliases){
                if(numbered&&alias.includes('#')){
                    if(numbered[2]==='1')candidates.push(alias.replace('#',''));
                    candidates.push(alias.replace('#',numbered[2]));
                }else if(!numbered&&!alias.includes('#'))candidates.push(alias);
            }
            // The existing body reader proves a whole editor wikilink and
            // its separate link field under these accepted native aliases.
            // Retain that reader vocabulary without changing either role,
            // person index, value, link target or the page source.
            const readerAlias={'EditorList-Last':'editor#','EditorList-Link':'editorlink#'}[base];
            if(numbered&&readerAlias)candidates.unshift(readerAlias.replace('#',numbered[2]==='1'?'':numbered[2]));
            // The existing finite numeric-edition cleanup reads this native
            // spelling. Keep it reachable in comparison input instead of
            // translating it to another accepted alias before that reader.
            if(base==='Edition')candidates.unshift('edição');
            const target=candidates.find(key=>nativeCitationAccepts(context.native,key)&&
                JSON.stringify(v219NativeCitationRoles(key))===JSON.stringify([row.role]));
            if(target&&target!==row.field.key)edits.push({start:row.field.keyStart,end:row.field.keyEnd,text:target});
        }
        // Compare accepted aliases of the same pinned native role. Every raw
        // value and numbered person index stays attached to its own role.
        // Unequal aliases, including blank competition, retain their keys.
        return v24SyntaxApply(raw,edits);
    }
    // Existing language-value aliases, individually checked against native
    // languageinfo names/autonyms in pt/en/fr/de/es. A foreign literal is an
    // explicitly declared language-name repair, never rendered equivalence.
    const V219_NATIVE_LANGUAGE_NAMES=Object.freeze(ownDictionary({"inglês":"en","português":"pt","francês":"fr","espanhol":"es","alemão":"de","italiano":"it","japonês":"ja","chinês":"zh","russo":"ru","neerlandês":"nl","checo":"cs","árabe":"ar","hindi":"hi","coreano":"ko","polaco":"pl","grego":"el","sueco":"sv"}));
    const V219_FOREIGN_LANGUAGE_NAMES=Object.freeze(ownDictionary({"english":"en","portuguese":"pt","french":"fr","français":"fr","spanish":"es","español":"es","german":"de","deutsch":"de","italian":"it","japanese":"ja","chinese":"zh","russian":"ru","dutch":"nl","czech":"cs","arabic":"ar","korean":"ko","polish":"pl","greek":"el","swedish":"sv","anglais":"en","allemand":"de","espagnol":"es","portugais":"pt","italien":"it","englisch":"en","französisch":"fr","spanisch":"es","portugiesisch":"pt","inglés":"en","francés":"fr","alemán":"de","portugués":"pt","afrikaans":"af","bulgarian":"bg","български":"bg","catalan":"ca","català":"ca","danish":"da","dansk":"da","dzongkha":"dz","ཇོང་ཁ":"dz","estonian":"et","eesti":"et","persian":"fa","فارسی":"fa","finnish":"fi","suomi":"fi","galician":"gl","galego":"gl","hebrew":"he","עברית":"he","croatian":"hr","hrvatski":"hr","hungarian":"hu","magyar":"hu","indonesian":"id","bahasa indonesia":"id","icelandic":"is","íslenska":"is","日本語":"ja","latin":"la","latina":"la","lithuanian":"lt","lietuvių":"lt","latvian":"lv","latviešu":"lv","macedonian":"mk","македонски":"mk","norwegian bokmål":"nb","norsk bokmål":"nb","nepali":"ne","नेपाली":"ne","norwegian nynorsk":"nn","norsk nynorsk":"nn","serbo-croatian":"sh","srpskohrvatski / српскохрватски":"sh","albanian":"sq","shqip":"sq","tagalog":"tl","turkish":"tr","türkçe":"tr","ukrainian":"uk","українська":"uk","vietnamese":"vi","tiếng việt":"vi"}));
    // Finite target/label pairs pinned in the independent local-language
    // concept contract. A complete supplied link is a declared repair.
    const V219_CITATION_LANGUAGE_LINKS=Object.freeze([{"target":"Língua francesa","code":"fr","labels":["francês"],"bareAllowed":true},{"target":"Língua neerlandesa","code":"nl","labels":["neerlandês"],"bareAllowed":true},{"target":"Língua holandesa","code":"nl","labels":["holandês"],"bareAllowed":true},{"target":"Língua portuguesa","code":"pt","labels":["Português"],"bareAllowed":true},{"target":"Português brasileiro","code":"pt-br","labels":["Português brasileiro"],"bareAllowed":true},{"target":"Língua inglesa","code":"en","labels":["Inglês"],"bareAllowed":true},{"target":"Língua alemã","code":"de","labels":["alemão"],"bareAllowed":true},{"target":"Língua castelhana","code":"es","labels":["espanhol","castelhano"],"bareAllowed":true},{"target":"Spanish language","code":"es","labels":["Spanish"],"bareAllowed":true},{"target":"Língua catalã","code":"ca","labels":["Catalão"],"bareAllowed":true},{"target":"Língua islandesa","code":"is","labels":["Islandês"],"bareAllowed":true},{"target":"Língua hindi","code":"hi","labels":["Hindi"],"bareAllowed":true},{"target":"Língua montenegrina","code":"cnr","labels":["Montenegrino"],"bareAllowed":true},{"target":"Língua nepali","code":"ne","labels":["Nepali"],"bareAllowed":true},{"target":"Língua italiana","code":"it","labels":["italiano"],"bareAllowed":true},{"target":"Língua albanesa","code":"sq","labels":["albanês"],"bareAllowed":true},{"target":"Língua ucraniana","code":"uk","labels":["ucraniana"],"bareAllowed":true},{"target":"Língua árabe","code":"ar","labels":["árabe"],"bareAllowed":true},{"target":"Língua croata","code":"hr","labels":["croata"],"bareAllowed":false},{"target":"Latim","code":"la","labels":["Latim"],"bareAllowed":true},{"target":"Língua sueca","code":"sv","labels":["sueca"],"bareAllowed":true},{"target":"Sueco (idioma)","code":"sv","labels":["Sueco"],"bareAllowed":false},{"target":"Língua norueguesa","code":"no","labels":["Norueguês"],"bareAllowed":true},{"target":"Língua dinamarquesa","code":"da","labels":["Dinamarquês"],"bareAllowed":true}]);
    function v219CitationLanguageLinkValue(value,cfg={}) {
        if(cfg.citations===false||typeof value!=='string')return null;
        const link=/^\[\[([^|\[\]{}<>#\r\n]+)(?:\|([^|\[\]{}<>#\r\n]+))?\]\]$/.exec(value.trim());
        if(!link)return null;
        const target=link[1].trim().replace(/_/g,' ').replace(/ +/g,' '),label=link[2]?.trim();
        for(const row of V219_CITATION_LANGUAGE_LINKS) {
            if(!target||target[0].toLocaleUpperCase('pt')!==row.target[0].toLocaleUpperCase('pt')||target.slice(1)!==row.target.slice(1))continue;
            if(label===undefined?!row.bareAllowed:!row.labels.some(name=>name.toLocaleLowerCase('pt')===label.toLocaleLowerCase('pt')))return null;
            return {code:row.code,kind:'declared-complete-language-link-repair',value:value.trim()};
        }
        return null;
    }
    function v219CitationLanguageValue(value,cfg={}) {
        if(typeof value!=='string')return null;
        const linked=v219CitationLanguageLinkValue(value,cfg);if(linked)return linked;
        const literal=value.trim().toLocaleLowerCase('pt'),native=V219_NATIVE_LANGUAGE_NAMES[literal],foreign=V219_FOREIGN_LANGUAGE_NAMES[literal];
        if(native)return {code:native,kind:'native-name-code-equivalence',value:value.trim()};
        if(foreign&&cfg.citations!==false)return {code:foreign,kind:'declared-foreign-language-name-repair',value:value.trim()};
        return null;
    }
    function v219CitationLanguageForeignIdentity(raw,profile) {
        if(profile?.kind!=='citation')return false;
        if(v219ForeignTemplateIdentity(raw,profile))return true;
        const header=parsedTemplate(raw).parts[0].trim().replace(/_/g,' '),key=norm(header),
            contracts={
                'cita web':['Cita web','es','Plantilla:Cita web',149592242],
                'plantilla:cita web':['Plantilla:Cita web','es','Plantilla:Cita web',149592242],
                'lien web':['Lien web','fr','Modèle:Lien web',98348577],
                'modèle:lien web':['Modèle:Lien web','fr','Modèle:Lien web',98348577]
            },contract=Object.hasOwn(contracts,key)?contracts[key]:null,
            registered=contract&&TRANSLATION_RULES.profiles[key];
        // These two existing source profiles predate the override registry.
        // Require their exact registered fields and primary revision, plus
        // literal native first-letter title identity. Similar names, a stale
        // profile or a profile borrowed from another call give no authority.
        const stem=value=>{const colon=value.indexOf(':');return colon<0?value:value.slice(colon+1);};
        return !!contract&&!!registered&&profile===registered&&profile.target==='Citar web'&&
            v215SameTemplateTitle(stem(header),stem(contract[0]))&&profile.source?.language===contract[1]&&
            profile.source.title===contract[2]&&profile.source.oldid===contract[3];
    }
    function v219CitationLanguageFieldValue(raw,index,cfg={},profile=null) {
        const verifiedForeign=v219CitationLanguageForeignIdentity(raw,profile),
            context=v218CitationNativeContext(raw)||verifiedForeign&&v218CitationNativeContext('{{'+profile.target+'}}'),syntax=v2151FieldSyntaxParts(raw),
            pins={...V218_CITATION_ISLAND_CONTRACTS,citation:62525251,'citar comunicado de imprensa':50506646,'citar conferência':48055134,'citar relatório':62084675,'citar vídeo':62110903,'citar enciclopédia':60787857,'citar tese':47976404};
        if(!context||pins[context.native.name]!==context.profile.oldid||!syntax||
            !v215LiteralTemplateIdentity(raw)||syntax.some(field=>field.key!==field.plain||field.separator!=='='))return null;
        const parsed=parsedTemplate(raw),redirect=v219LocalCitationRedirectProfile(raw),
            local=v215SameTemplateTitle(parsed.parts[0],context.profile.title)||redirect&&
                norm(redirect.target)===context.native.name&&redirect.nativeTemplateOldid===context.profile.oldid;
        if(local&&cfg.citations===false)return null;
        if(!local&&(!verifiedForeign||!translationEnabled(profile,cfg)))return null;
        const target=parsedTemplate('{{'+context.profile.title+'}}'),entries=foreignEntries(parsed),
            language=entries.filter(field=>{
                if(field.positional)return false;
                let mapped=field.key;
                if(!local){
                    const key=norm(field.key);mapped=profile.fields?.[key];
                    if(!mapped&&profile.numbered){const numbered=/^(.*?)(\d+)$/.exec(key);
                        if(numbered&&profile.numbered[numbered[1]])mapped=profile.numbered[numbered[1]]+numbered[2];}
                    if(!mapped&&nativeCitationAccepts(target,field.key))mapped=field.key;
                }
                return !!mapped&&nativeCitationAccepts(target,mapped)&&
                    JSON.stringify(v219NativeCitationRoles(mapped))===JSON.stringify(['Language']);
            });
        // Read all original fields, including explicit blanks, before a
        // migration loop can rename one of them. Duplicate values do not
        // authorize a second effective language field or change precedence.
        if(language.length!==1||language[0].index!==index)return null;
        const identity=v219CitationLanguageValue(language[0].value,local?cfg:{...cfg,citations:true});
        return identity?{...identity,index,key:language[0].key,authority:local?'native-citation-values':'verified-foreign-migration'}:null;
    }
    function v219CitationNativeLanguageContext(raw,cfg={}) {
        const context=v218CitationNativeContext(raw),fields=v2151FieldSyntaxParts(raw),
            pins={...V218_CITATION_ISLAND_CONTRACTS,citation:62525251,'citar comunicado de imprensa':50506646,'citar conferência':48055134,'citar relatório':62084675,'citar vídeo':62110903,'citar enciclopédia':60787857,'citar tese':47976404};
        if(!context||pins[context.native.name]!==context.profile.oldid||!fields||
            !v215LiteralTemplateIdentity(raw)||fields.some(field=>field.key!==field.plain||field.separator!=='='))return raw;
        const redirect=v219LocalCitationRedirectProfile(raw),local=v215SameTemplateTitle(context.parsed.parts[0],context.profile.title)||
            redirect&&norm(redirect.target)===context.native.name&&redirect.nativeTemplateOldid===context.profile.oldid;
        if(!local)return raw;
        const language=fields.filter(field=>nativeCitationAccepts(context.native,field.key)&&
            JSON.stringify(v219NativeCitationRoles(field.key))===JSON.stringify(['Language']));
        if(language.length!==1)return raw;
        // CS1 72936771 resolves the primary Portuguese name/code pairs to
        // the same label and source category. Foreign literals have a separate
        // declared-repair contract and require the citation-value option.
        const field=language[0],padding=/^([ \t\r\n]*)([\s\S]*?)([ \t\r\n]*)$/.exec(field.value),
            identity=v219CitationLanguageValue(padding[2],cfg);
        if(!identity)return raw;
        return v24SyntaxApply(raw,[{start:field.start,end:field.end,text:padding[1]+identity.code+padding[3]}]);
    }
    function v219CitationPrecedenceValue(field,cfg={}) {
        const value=field.value.trim(),kind=V218_CITATION_DATE_FIELDS[field.key];
        if(cfg.dates===false||!kind||kind==='year')return value;
        const parsed=v218CitationDateValue(value,kind)||v218CitationDateValue(normalizeDate(value,()=>{}),kind),day=parsed?.identity;
        // This compares a value without removing or renaming its field. All
        // competing aliases, their order and explicit blanks remain present.
        // A complete calendar-valid day may change written format while its
        // date role and exact selected day stay the same.
        return parsed?.precision==='day'&&day&&validDate(day.day,day.month,day.year)?
            JSON.stringify(['native-day',day.year,day.month,day.day]):value;
    }
    function v219CitationUrlStateObligations(raw,cfg={}) {
        if(typeof raw!=='string'||!/[|]\s*(?:url-status|urlmorta|dead-url|deadurl|datali|li|ligação inativa|ligação inactiva)\s*=/.test(raw))return [];
        let value=v219CitationProtocolProjection(raw,cfg),p=parsedTemplate(value);
        const native=parsed=>{
            const head=parsed.parts[0].trim().replace(/^(?:Predefinição|Template)\s*:\s*/i,'');
            return nativeCitationTitle({...parsed,parts:[head,...parsed.parts.slice(1)]})||v219LocalCitationRedirectIdentity(value);
        };
        if(!native(p)) {
            const migration=migrateForeignTemplate(raw,cfg);
            if(!migration||migration.blocked||migration.text===raw)return [];
            value=migration.text;p=parsedTemplate(value);if(!native(p))return [];
        }
        const rows=[],stateFields=[],seen=new Set();
        for(const field of foreignEntries(p)) {
            if(field.positional||!nativeCitationAccepts(p,field.key))continue;
            const state=v219CitationUrlState(field.key,field.value);if(!state)continue;
            const row=[state.role,field.value.trim()],identity=JSON.stringify(row);
            stateFields.push([state.role,field.key,field.value.trim()]);
            // Identical duplicate aliases may be consolidated by the existing
            // source-bound duplicate rule. Unequal/blank role values remain
            // separate obligations in their original relative order.
            if(!seen.has(identity)){seen.add(identity);rows.push(row);}
        }
        if(!rows.length)return [];
        const contextFields=foreignEntries(p).map(field=>({...field,
            remove:!field.positional&&nativeCitationAccepts(p,field.key)&&!!v219CitationUrlState(field.key,field.value)})),
            contextRaw=translatedEntries(p,contextFields),
            projected=v219CitationDayContext(v218CitationMetadataProjection(v219SourceCompatibilityPlan(v219CitationEmptyPartsPlan(contextRaw,cfg).text,cfg).text,cfg),cfg),
            roleProjected=v219CitationNativeRoleContext(projected,cfg),
            languageProjected=v219CitationNativeLanguageContext(roleProjected,cfg),canonicalContext=v24InventoryTemplate(languageProjected,cfg),
            canonicalParsed=parsedTemplate(canonicalContext),unknownFields=foreignEntries(canonicalParsed)
                .filter(field=>field.positional||!nativeCitationAccepts(canonicalParsed,field.key))
                .map(field=>[field.positional?'positional:'+field.index:field.key,field.value]),
            context=JSON.stringify([v218ReferenceBodyInventory(canonicalContext,cfg),unknownFields]),roleFields=[];
        for(const field of contextFields)if(!field.remove) {
            const nativeRoles=v219NativeCitationRoles(field.key),role=nativeRoles.length===1?nativeRoles[0]:'key:'+parameterFamily(field.key);
            roleFields.push([role,field.key,v219CitationPrecedenceValue(field,cfg)]);
        }
        const collided=new Set(roleFields.filter(row=>roleFields.filter(other=>other[0]===row[0]).length>1&&
            new Set(roleFields.filter(other=>other[0]===row[0]).map(other=>other[2])).size>1).map(row=>row[0])),
            precedence=roleFields.filter(row=>collided.has(row[0])),
            stateCollisions=new Set(stateFields.filter(row=>new Set(stateFields.filter(other=>other[0]===row[0])
                .map(other=>other[2])).size>1).map(row=>row[0])),
            statePrecedence=stateFields.filter(row=>stateCollisions.has(row[0]));
        // The complete non-state publication context binds a status to its
        // own authors, year, quoted passage and other retained fields. Unequal
        // duplicate-role precedence cannot disappear in a sorted inventory.
        // Native aliases have their own priority, and repeated identical keys
        // can override earlier values. Retain every key/value occurrence when
        // a state role contains unequal values, including an explicit blank.
        return [['native-citation-context',context,precedence,statePrecedence],...rows.sort((a,b)=>a[0].localeCompare(b[0]))];
    }
    function v219CitationAccessDateIdentity(value,cfg={}) {
        if(cfg.dates===false)return v24InventorySpace(value);
        const native=v218CitationDateValue(value,'access')||v218CitationDateValue(normalizeDate(value,()=>{}),'access'),date=native?.identity;
        if(native?.precision==='day'&&date&&validDate(date.day,date.month,date.year))
            return JSON.stringify(['native-access-day',date.year,date.month,date.day]);
        return v24InventorySpace(normalizeDate(value,()=>{}));
    }
    function v219ProseExpectedSource(source,options={}) {
        if(typeof source!=='string')return source;
        const cfg=pageContextOptions({...DEFAULTS,...options});
        if(cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg))return source;
        const noop=()=>{};
        let local=cfg,part=source,tail='',prefixGuard=null;
        const recovery=syntaxRepairPrefix(source,cfg);
        if(cfg.partialSyntaxRecovery!==false&&recovery.unresolved.length&&
            recovery.end>0&&recovery.end<source.length) {
            part=source.slice(0,recovery.end);tail=source.slice(recovery.end);
            // The real partial cleanup keeps named references opaque because
            // their later definitions may be in the retained incomplete tail.
            const namedRanges=refTokens(protectedView(part)).filter(ref=>{
                const attributes=attrsOf(ref.attrs);return attributes&&(attributes.name||attributes.follow);
            });
            prefixGuard=maskProtected(part,noop,mergeEditorialRanges([...namedRanges,...v219PartialReferenceQuarantineRanges(source,recovery.end,cfg),
                ...v219ReferenceDefinitionPeerRanges(part,namedRanges,cfg)]));
            part=prefixGuard.text;local=syntaxPrefixOptions(cfg);
        }
        part=v219NativeHelperCosmeticContextSource(part,local);
        const normalRanges=mergeEditorialRanges([
            ...discussionProtectionRanges(part,local),...v215DefinitionProtectedRanges(part,local),
            ...v219QuotedTemplateRanges(part),...v219UnknownTemplateRanges(part,local),...v219MarkdownLiteralRanges(part),
            ...v219UncertainReferenceRanges(part,local)]),
            shield=maskProtected(part,noop,mergeEditorialRanges([...normalRanges,
                ...v219ReferenceDefinitionPeerRanges(part,normalRanges,local)]));
        // These are the actual pre-spelling cleanup exits. A spelling that
        // was never reachable cannot become a required comparison token.
        if(templates(shield.text).unclosed.length||malformedRefs(shield.text))return source;
        let expected=local.shortcuts?shield.restore(expandShortcuts(shield.text,noop,noop)):part;
        expected=automaticSpelling(expected,local,noop,noop);
        if(typeof v219MagicWordPlan==='function')expected=v219MagicWordPlan(expected,local).text;
        return (prefixGuard?prefixGuard.restore(expected):expected)+tail;
    }
    function v219NativeBankBodyIdentity(body,cfg={}) {
        if(typeof body!=='string'||!v29ReferenceBody(body))return null;
        body=v219CitationProtocolProjection(body,cfg);
        const states=[],pins={...V218_CITATION_ISLAND_CONTRACTS,citation:62525251,
            'citar comunicado de imprensa':50506646,'citar conferência':48055134,'citar relatório':62084675,
            'citar vídeo':62110903,'citar enciclopédia':60787857,'citar tese':47976404};
        for(const node of templates(body).nodes) {
            const raw=body.slice(node.start,node.end),p=parsedTemplate(raw);
            if(!CITE_NAMES[p.name])return null;
            const roles=new Set();
            for(const field of foreignEntries(p)) {
                if(field.positional)return null;
                const native=v219NativeCitationRoles(field.key),role=native.length===1?native[0]:'key:'+parameterFamily(field.key);
                if(native.length>1||roles.has(role))return null;roles.add(role);
            }
            const obligation=v219CitationUrlStateObligations(raw,cfg);
            if(obligation.length)states.push(obligation);
        }
        // Canonicalize from the innermost supplied citation outward. Applying
        // edits for both an enclosing title and its nested citation would
        // overlap source spans and lose the publication boundary.
        const nativeBody=mapTemplateTree(body,raw=>{
            const p=parsedTemplate(raw),context=v218CitationNativeContext(raw),redirect=v219LocalCitationRedirectProfile(raw);
            if(context&&pins[context.native.name]===context.profile.oldid&&
                (v215SameTemplateTitle(p.parts[0],context.profile.title)||redirect&&
                    norm(redirect.target)===context.native.name&&redirect.nativeTemplateOldid===context.profile.oldid)){
                // Local forwarding changes no interface or publication type.
                // Compare the same literal native roles after forwarding the
                // header only. Eligibility above excludes competing fields.
                const forwarded='{{'+context.profile.title+raw.slice(2+p.parts[0].length),
                    canonical=v219CitationNativeLanguageContext(v219CitationNativeRoleContext(v219CitationDayContext(forwarded,cfg),cfg),cfg);
                return canonical;
            }
            return raw;
        });
        // Keep native URL state fields separate even when a generic citation
        // parameter normalizer has a broader historical alias dictionary.
        const projected=v218CitationMetadataProjection(v219TableCellMediaPlan(nativeBody,cfg).text,cfg);
        return JSON.stringify([v218ReferenceBodyInventory(projected,cfg),states]);
    }
    function v219NativeBankSource(source,cfg={},includeInline=false) {
        const result={eligible:false,complete:false,definitions:new Map(),obligations:new Map()};
        if(typeof source!=='string'||source.length>4194304||cfg.contentModel&&cfg.contentModel!=='wikitext'||
            v20DefinitionContext(cfg)||!/<ref\b/i.test(source))return result;
        const shield=v24SyntaxProtected(source),syntax=v24SyntaxScan(source),parsed=templates(shield.view);
        if(shield.unclosed.length||syntax.issues.length||parsed.unclosed.length)return result;
        const blockers=mergeEditorialRanges([...shield.ranges,...v27SafeMarkdownRanges(source),
            ...v219QuotedTemplateRanges(source),...v219UnknownTemplateRanges(source,cfg)]),
            blocked=(start,end)=>blockers.some(range=>range.start<end&&start<range.end),
            add=(map,key)=>map.set(key,(map.get(key)||0)+1),bankRanges=[],bankRows=[];
        let ambiguous=false;
        for(const node of parsed.nodes) {
            if(node.depth!==0||blocked(node.start,node.end))continue;
            const raw=source.slice(node.start,node.end),native=v219NativeCollectorGroups(raw);
            if(native.ambiguous||native.bankGroups?.length!==1)continue;
            const p=parsedTemplate(raw),fields=foreignEntries(p),banks=fields.filter(field=>field.key==='refs');
            if(!banks.length)continue;
            const accepted=native.kind==='reflist'?new Set(['group','grupo','refs','liststyle','estilolista','listaestilo','1','colwidth','largcol','larguracol']):
                native.kind==='references'?new Set(['grupo','refs','título','estilo','nível','estilolista','extra','1','2','3','5']):new Set(['grupo','refs']);
            if(banks.length!==1||fields.some(field=>!accepted.has(field.key)||field.positional)||
                fields.filter(field=>['group','grupo'].includes(field.key)).length>1||
                fields.some(field=>field.key!=='refs'&&/[{}<>]/.test(field.value))||
                new Set(fields.map(field=>field.key)).size!==fields.length) {ambiguous=true;continue;}
            const value=banks[0].value,refs=refTokens(value),group=native.bankGroups[0],seen=new Set(),rows=[];
            if(!refs.length||malformedRefs(value)||templates(value).unclosed.length){ambiguous=true;continue;}
            let remainder=value;
            for(const ref of [...refs].reverse())remainder=remainder.slice(0,ref.start)+remainder.slice(ref.end);
            if(remainder.replace(/<!--[\s\S]*?-->/g,'').trim()){ambiguous=true;continue;}
            let valid=true;
            for(const ref of refs) {
                const attrs=attrsOf(ref.attrs),name=attrs?.name,
                    selected=attrs?.group??group,body=ref.body===null?null:v219NativeBankBodyIdentity(ref.body,cfg);
                if(!attrs||Object.keys(attrs).some(key=>!['name','group'].includes(key))||
                    !v29ReferenceName(name)||/^\d+$/.test(name)||selected!==group||body===null||
                    seen.has(JSON.stringify([selected,name]))) {valid=false;break;}
                seen.add(JSON.stringify([selected,name]));rows.push({group:selected,name,body});
            }
            if(!valid){ambiguous=true;continue;}
            bankRanges.push({start:node.start,end:node.end});bankRows.push(...rows);
        }
        const identities=new Map();
        for(const row of bankRows){const identity=JSON.stringify([row.group,row.name]);
            if(!identities.has(identity))identities.set(identity,new Set());identities.get(identity).add(row.body);}
        for(const ref of refTokens(shield.view)) {
            if(ref.body===null||blocked(ref.start,ref.end)||inRange(ref.start,parsed.nodes)||inRange(ref.start,bankRanges))continue;
            const attrs=attrsOf(ref.attrs),body=v219NativeBankBodyIdentity(source.slice(ref.openEnd,ref.openEnd+ref.body.length),cfg);
            if(!attrs||Object.keys(attrs).some(key=>!['name','group'].includes(key))||!v29ReferenceName(attrs.name))continue;
            const identity=JSON.stringify([attrs.group||'',attrs.name]);
            if(identities.has(identity)) {
                if(body===null)ambiguous=true;else identities.get(identity).add(body);
            }
            if(includeInline&&body!==null)add(result.definitions,JSON.stringify([attrs.group||'',attrs.name,body]));
        }
        for(const row of bankRows) {
            if(identities.get(JSON.stringify([row.group,row.name])).size!==1){ambiguous=true;continue;}
            const key=JSON.stringify([row.group,row.name,row.body]);add(result.definitions,key);add(result.obligations,key);
        }
        result.eligible=result.obligations.size>0;result.complete=!ambiguous;
        return result;
    }
    function v219NativeBankMergedObligations(before,after,obligations,cfg={}) {
        const edits=v210ReferenceBankEdits(before,cfg),groups=new Map(),renames=new Map();
        if(!edits.length)return null;
        for(const edit of edits) {
            const proof=edit.proof,body=proof&&v219NativeBankBodyIdentity(proof.body,cfg);
            if(edit.ruleId!=='v210ReferenceBanks'||!proof||proof.sourceHash!==v24SyntaxHash(before)||
                body===null||!Array.isArray(proof.names)||!Array.isArray(proof.bodies)||
                proof.bodies.some(value=>v219NativeBankBodyIdentity(value,cfg)!==body)||
                !proof.names.includes(proof.name))return null;
            const key=JSON.stringify([proof.group,proof.name]);
            groups.set(key,{...proof,canonicalBody:body});
            for(const name of proof.names) {
                const identity=JSON.stringify([proof.group,name]),prior=renames.get(identity);
                if(prior&&prior!==proof.name)return null;renames.set(identity,proof.name);
            }
        }
        const original=v210ReferenceGraph(before,cfg),actual=v210ReferenceGraph(after,cfg);
        if(!original||!actual)return null;
        for(const proof of groups.values()) {
            const expectedUses=original.refs.filter(ref=>!ref.bank&&ref.group===proof.group&&proof.names.includes(ref.attrs.name)),
                keeper=actual.families.get(actual.key(proof.group,proof.name));
            if(!expectedUses.length||!keeper||keeper.uses.filter(ref=>!ref.bank).length!==expectedUses.length||
                !keeper.definitions.length||new Set(keeper.uses.map(ref=>ref.region)).size!==1||
                keeper.definitions.some(ref=>v219NativeBankBodyIdentity(ref.body,cfg)!==proof.canonicalBody)||
                proof.names.some(name=>name!==proof.name&&actual.families.has(actual.key(proof.group,name))))return null;
        }
        const projected=new Map();
        for(const [key,count]of obligations) {
            const [group,name,body]=JSON.parse(key),target=renames.get(JSON.stringify([group,name]));
            if(!target){projected.set(key,(projected.get(key)||0)+count);continue;}
            const proof=groups.get(JSON.stringify([group,target]));if(!proof||proof.canonicalBody!==body)return null;
            // The exact graph plan merges identical definitions and every
            // corresponding use into one retained identity. This is not a
            // general permission to rename or delete a bank definition.
            projected.set(JSON.stringify([group,target,body]),1);
        }
        return projected;
    }
    function v219NativeBankRetention(before,after,options={}) {
        const empty={accepted:true,reason:'',checked:0};
        if(before===after||typeof before!=='string'||typeof after!=='string'||!/[|]\s*refs\s*=/.test(before))return empty;
        const cfg=pageContextOptions({...DEFAULTS,...options}),source=v219NativeBankSource(before,cfg);
        if(!source.eligible||!source.complete)return empty;
        const actual=v219NativeBankSource(after,cfg,true);
        if(!actual.complete)return {accepted:false,checked:source.obligations.size,
            reason:'A lista de referências passou a ter uma definição ou um grupo sem equivalência confirmada.'};
        let expected=source.obligations;
        if([...expected].some(([key,count])=>(actual.definitions.get(key)||0)<count))
            expected=v219NativeBankMergedObligations(before,after,source.obligations,cfg)||expected;
        for(const [key,count]of expected)if((actual.definitions.get(key)||0)<count)
            return {accepted:false,checked:source.obligations.size,
                reason:'Uma definição da lista de referências perdeu conteúdo, nome ou grupo fora dos ajustes confirmados.'};
        return {...empty,checked:source.obligations.size};
    }
    function v219BiographyImageInventoryValue(value,cfg={},field='',template='') {
        if(typeof value!=='string'||cfg.multilingual===false||cfg.links===false)return value;
        const contract=v28BiographyFieldContract(template),profile=INFOBOX_CATALOG[template];
        if(!contract||!profile||!contract.image.includes(field)||!profileAccepts(profile,field))return value;
        const match=/^([ \t\r\n]*)\[\[((?:File|Image|Arquivo|Ficheiro|Imagem)):([^{}\[\]\r\n]+)\]\]([ \t\r\n]*)$/i.exec(value);
        if(!match)return value;
        const parts=splitParts(match[3]);if(!parts[0].trim())return value;
        const options=parts.slice(1).map(part=>['thumb','thumbnail','miniatura','miniaturadaimagem'].includes(part.trim())?
            'miniaturadaimagem':part);
        return match[1]+'[[Imagem:'+[parts[0],...options].join('|')+']]'+match[4];
    }
    function v219BiographyInventoryBody(value,cfg={},field='',template='') {
        value=v219NativeDisplayedMediaInventoryValue(value,cfg,field,template);
        return v24InventoryBody(v219BiographyImageInventoryValue(value,cfg,field,template),cfg);
    }
    function v219TableCellMediaPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||cfg.multilingual===false||cfg.links===false||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg)||
            ![...source.matchAll(/\[\[((?:File|Image|Arquivo|Ficheiro|Imagem)):/gi)].some(match=>match[1]!=='Imagem'))return empty;
        // The first cell line begins after its literal table separator. Its
        // ordinary padding is not a preformatted prose line. Later indented
        // lines retain their normal protection and every edit stays bound to
        // its position in the complete original cell value.
        const padding=/^[ \t]*/.exec(source)[0].length,context=source.slice(padding),
            shield=v24SyntaxProtected(context),parsed=templates(shield.view),
            ranges=[...shield.ranges,...v27SafeMarkdownRanges(context)],edits=[];
        if(shield.unclosed.length||parsed.unclosed.length||v24SyntaxScan(context).issues.length)return empty;
        for(const link of editorialWikiLinkRanges(shield.view)) {
            const raw=context.slice(link.start,link.end),match=/^\[\[((?:File|Image|Arquivo|Ficheiro|Imagem)):([^{}\[\]\r\n]+)\]\]$/i.exec(raw);
            if(!match||!match[2].split('|')[0].trim()||
                ranges.some(range=>range.start<link.end&&link.start<range.end)||
                parsed.nodes.some(node=>node.start<link.end&&link.start<node.end))continue;
            if(match[1]==='Imagem')continue;
            edits.push({start:padding+link.start+2,end:padding+link.start+2+match[1].length,text:'Imagem',
                proof:{sourceHash:empty.sourceHash,linkStart:padding+link.start,linkEnd:padding+link.end,raw,
                    condition:'guard-only native media namespace equivalence in one complete literal table-cell link outside protected examples and templates; exact filename, caption, alt, size, other options and their order retained; no leading colon'}});
        }
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219TableCellMediaProof(before,after,plan,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||
            plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219TableCellMediaPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219TableCellInventoryBody(value,cfg={}) {
        return v24InventoryBody(v219StructuralValueMarkupPlan(v219TableCellMediaPlan(value,cfg).text,cfg).text,cfg);
    }
    function v219ReferenceMarkupPlan(raw,cfg={}) {
        const prior=v218ReferenceMarkupPlan(raw,cfg);
        if(typeof raw!=='string'||cfg.markup===false||cfg.citations===false||
            !/\[\[[^|\[\]\r\n]+\|'{2,3}/.test(raw))return prior;
        const shield=v24SyntaxProtected(raw),parsed=templates(shield.view),
            ranges=[...shield.ranges,...v27SafeMarkdownRanges(raw)],extra=[];
        if(shield.unclosed.length||parsed.unclosed.length||v24SyntaxScan(raw).issues.length)return prior;
        const keys=new Set(['publicado','publicação','publicacao','publicador','obra','website',
            'editora','jornal','periódico','periodico','work','publisher']);
        for(const node of parsed.nodes) {
            if(node.depth!==0||ranges.some(range=>range.start<=node.start&&node.start<range.end))continue;
            const call=raw.slice(node.start,node.end),fields=v219IdentifierCitationFields(call);
            if(!fields)continue;
            for(const field of fields.fields) {
                if(!keys.has(field.key)||fields.fields.filter(other=>other.key===field.key).length!==1)continue;
                const plan=v218ReferenceMarkupPlan(field.value,cfg);
                // This extension covers the exact native emphasis movement
                // already written by the ordinary markup pass. URLs, IDs,
                // arbitrary nested templates and other field roles stay exact.
                if(!plan.edits.length||plan.edits.some(edit=>edit.proof.kind!=='piped-label-emphasis'))continue;
                for(const edit of plan.edits) {
                    const start=node.start+field.start+edit.start,end=node.start+field.start+edit.end;
                    if(ranges.some(range=>range.start<end&&start<range.end&&
                        !(range.kind==='quotation-markup'&&range.start===start+2+edit.proof.target.length+1&&range.end<=end)))continue;
                    extra.push({...edit,start,end,proof:{...edit.proof,sourceHash:prior.sourceHash,
                        template:fields.p.name,field:field.key,nativeTemplateOldid:TEMPLATE_CATALOG[fields.p.name]?.oldid,
                        condition:'guard-only native emphasis relocation in one complete known literal citation publication field; exact target, label, delimiter and every surrounding byte retained'}});
                }
            }
        }
        const edits=[...prior.edits,...extra].sort((a,b)=>a.start-b.start||a.end-b.end);
        if(edits.some((edit,index)=>index&&edit.start<edits[index-1].end))return prior;
        return {...prior,edits,text:v24SyntaxApply(raw,edits)};
    }
    function v219ReferenceMarkupProof(before,after,plan,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||
            plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219ReferenceMarkupPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219ReferenceBodyMarkupPlan(body,cfg={}) {
        const empty={source:body,sourceHash:typeof body==='string'?v24SyntaxHash(body):null,text:body,edits:[]};
        if(typeof body!=='string'||cfg.markup===false||!/\[\[[^|\[\]\r\n]+\|'{2,3}/.test(body))return empty;
        const prior=v219ReferenceMarkupPlan(body,cfg);
        if(!prior.edits.length||!v219ReferenceMarkupProof(body,prior.text,prior,cfg))return empty;
        const edits=prior.edits.filter(edit=>edit.proof?.kind==='piped-label-emphasis').map(edit=>{
            const {target,label,delimiter}=edit.proof;
            // An implicit basic title displays its exact supplied spelling.
            // Namespace, fragment, underscore, entity and encoded spellings
            // never obtain a redundant-label projection here.
            const self=cfg.links!==false&&target===label&&/^[\p{L}\p{N}][\p{L}\p{N} .,-]*$/u.test(target)&&
                !/ {2}/.test(target)&&target===target.trim();
            const text=self?delimiter+'[['+target+']]'+delimiter:edit.text;
            return {...edit,text,proof:{...edit.proof,after:text,redundantBasicSelfLabel:self,
                condition:'guard-only fresh native emphasis transaction; optional identical basic self-label; all other reference-body bytes retained'}};
        });
        return edits.length?{...empty,edits,text:v24SyntaxApply(body,edits)}:empty;
    }
    function v219ReferenceBodyMarkupProof(before,after,plan,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||
            plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219ReferenceBodyMarkupPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

    // Narrow SOURCE constructor. The candidate is compared raw, never projected.
    const v219FrenchQuotedURLSourceEquivalent=(before,after,cfg={})=>{
        if(typeof before!=='string'||typeof after!=='string'||before===after||before.length>65536||
            cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.discussionPage||cfg.pageRedirect||cfg.pageDisambiguation||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||
            ['citations','citationRepairs','multilingual','automaticSourceCompatibility','automaticParameterNames'].some(key=>cfg[key]!==true)||
            syntaxRepairPrefix(before,cfg).unresolved.length)return false;
        const observed=v219NativeReferenceObserver(before);
        if(observed.refs.length!==1||observed.unclosed.length||observed.empties.length||observed.helpers.length)return false;
        const ref=observed.refs[0],opening=v24SyntaxTag(before,ref.start),raw=ref.body;
        if(!ref.valid||!ref.close||ref.container||!opening||!v29ReferenceTag(before,ref)||
            !v24SyntaxLiteralIdentity(ref.attrs)||Object.keys(ref.attrs).some(key=>!['name','group'].includes(key))||
            typeof raw!=='string'||before.slice(opening.end,ref.close.start)!==raw)return false;
        const m=/^\{\{Lien web\|titre=([^{}|<>\[\]&"'\r\n\u0000-\u001f\u007f-\u009f\u2028\u2029]+)\|auteur=([^{}|<>\[\]&"'\r\n\u0000-\u001f\u007f-\u009f\u2028\u2029]+)\|url=(["'])(https?:\/\/[^\s{}|<>\[\]"']+)\3\}\}$/.exec(raw);
        if(!m||m[1]!==m[1].trim()||m[2]!==m[2].trim()||!v213LiteralURL(m[4]))return false;
        const profile=v219LocalCitationRedirectProfile(raw),native=TEMPLATE_CATALOG['citar web'],dependencies=native?.dependencies;
        if(profile?.nativeAliasOldid!==46288422||profile.nativeTemplateOldid!==48262420||native?.oldid!==48262420||!Array.isArray(dependencies))return false;
        const consumer=dependencies.map(row=>[row.title,row.oldid]);
        if(![['Módulo:Citação/CS1/Configuração',73016847],['Módulo:Citação/CS1/Whitelist',71860752]].every(([title,oldid])=>{
            const found=consumer.filter(row=>row[0]===title);return found.length===1&&found[0][1]===oldid;}))return false;
        const titled=raw.replace('|titre=','|título='),compat=v219SourceCompatibilityPlan(before,cfg),
            titledSource=before.slice(0,opening.end)+titled+before.slice(ref.close.start);
        if(compat.edits.length!==1||compat.text!==titledSource||!v219SourceCompatibilityProof(before,titledSource,compat,cfg)||
            JSON.stringify(v219StageSafeEdits(before,compat.edits,'v219-source-compatibility',cfg))!==JSON.stringify(compat.edits))return false;
        const canonical='{{Citar web|título='+m[1]+'|autor='+m[2]+'|url='+m[3]+m[4]+m[3]+'}}',
            migration=migrateForeignTemplate(titled,cfg);
        if(!migration||migration.blocked||migration.text!==canonical||migration.proof?.sourceHash!==v24SyntaxHash(titled)||
            migration.proof.nativeAliasOldid!==46288422||migration.proof.nativeTemplateOldid!==48262420)return false;
        const fields=v213ReferenceFieldPlan(canonical,cfg),expected=canonical.replace(m[3]+m[4]+m[3],m[4]);
        if(fields.edits.length!==1||fields.text!==expected||!v213ReferenceFieldProof(canonical,expected,fields,cfg)||
            fields.edits[0].ruleId!=='v213URLQuotes'||fields.edits[0].proof.role!=='url:URL'||
            JSON.stringify(fields.edits[0].proof.changeRules)!=='["v213URLQuotes"]'||
            JSON.stringify(v219StageSafeEdits(canonical,fields.edits,'v213-reference-fields',cfg))!==JSON.stringify(fields.edits))return false;
        return before.slice(0,opening.end)+expected+before.slice(ref.close.start)===after;
    };
