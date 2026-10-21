    // People fields use the exact CS1 aliases in configuration 73016847.
    // An explicit blank is a competing argument, not an available slot.
    // CS1 72936771 lists translators with etal=false; no translator display
    // field is inferred from the whitelist alone.
    const V219_CITATION_PEOPLE=Object.freeze({
        autor:{prefix:'AuthorList-',unstructured:['Authors','Vauthors','Coauthors'],display:'DisplayAuthors'},
        editor:{prefix:'EditorList-',unstructured:['Editors','Veditors'],display:'DisplayEditors'},
        tradutor:{prefix:'TranslatorList-',unstructured:[],display:null}
    });
    function v219CitationPeopleNative(raw,cfg={}) {
        if(cfg.citations===false||cfg.authors===false||typeof raw!=='string')return null;
        const parsed=parsedTemplate(raw),local=v219LocalCitationRedirectProfile(raw),
            native=local?TEMPLATE_CATALOG[norm(local.target)]:TEMPLATE_CATALOG[parsed.name];
        if(!native||!native.dependencies?.some(item=>item.title==='Módulo:Citação/CS1/Configuração'&&item.oldid===73016847)||
            !native.dependencies?.some(item=>item.title==='Módulo:Citação/CS1/Whitelist'&&item.oldid===71860752))return null;
        if(!local&&!v215LiteralTemplateIdentity(raw,native))return null;
        return {parsed,native};
    }
    function v219CitationPeopleRoles(key) {
        const roles=v219NativeCitationRoles(key);
        return [...new Set(roles)];
    }
    function v219CitationPeopleFamily(key) {
        const roles=v219CitationPeopleRoles(key);
        for(const [family,contract]of Object.entries(V219_CITATION_PEOPLE)){
            const indexed=roles.find(role=>role.startsWith(contract.prefix+'Last:')||role.startsWith(contract.prefix+'First:'));
            if(indexed)return {family,contract,index:Number(indexed.slice(indexed.lastIndexOf(':')+1)),role:indexed,unstructured:false};
            if(roles.some(role=>family==='autor'?role==='Authors':family==='editor'&&role==='Editors'))
                return {family,contract,index:1,role:family==='autor'?'Authors':'Editors',unstructured:true};
        }
        return null;
    }
    function v219CitationPeopleEntrySafe(entry) {
        return !!entry&&!entry.remove&&typeof entry.key==='string'&&typeof entry.value==='string'&&
            !/[{}<>\uE000-\uF8FF]/.test(entry.value)&&!entry.value.includes("''");
    }
    function v219CitationPeopleSplitAllowed(raw,cfg,entries,entry,family) {
        if(v219CitationPeopleHasCoauthor(raw))return false;
        if(!v219CitationPeopleNative(raw,cfg)||!v219CitationPeopleEntrySafe(entry)||!Array.isArray(entries))return false;
        const own=v219CitationPeopleFamily(entry.key);if(!own||own.family!==family||own.index!==1)return false;
        const contract=own.contract;
        return !entries.some(other=>other!==entry&&!other.remove&&v219CitationPeopleRoles(other.key).some(role=>
            role.startsWith(contract.prefix)||contract.unstructured.includes(role)||role===contract.display));
    }
    function v219CitationPersonalTail(body) {
        if(typeof body!=='string'||institutionalAuthor(body))return false;
        if(personalAuthorName(body,true))return true;
        const names=body.split(',').map(value=>value.trim());
        return names.length>=2&&names.length<=20&&names.every(name=>personalAuthorName(name,false));
    }
    function v219CitationPeopleTailAllowed(raw,cfg,entries,entry,display,body) {
        if(v219CitationPeopleHasCoauthor(raw))return false;
        if(!v219CitationPeopleNative(raw,cfg)||!v219CitationPeopleEntrySafe(entry)||!Array.isArray(entries)||
            typeof body!=='string'||/[{}<>\uE000-\uF8FF"`]/.test(body)||body.includes("''"))return false;
        if(/[\[\]]/.test(body)&&!/^\[\[[^|\[\]#]+(?:\|[^\[\]]+)?\]\]$/.test(body.trim()))return false;
        const own=v219CitationPeopleFamily(entry.key);if(!own||own.family==='tradutor'||own.index<1||own.index>99)return false;
        const contract=own.contract,bodyName=body.trim().replace(/[,;\s]+$/,''),
            link=/^\[\[([^|\[\]#]+)(?:\|([^\[\]]+))?\]\]$/.exec(bodyName),plain=link?(link[2]||link[1]):bodyName,
            companionKind=own.role.startsWith(contract.prefix+'First:')?'Last':'First',
            companions=entries.filter(other=>other!==entry&&!other.remove&&v219CitationPeopleRoles(other.key).includes(contract.prefix+companionKind+':'+own.index));
        if(companions.some(other=>institutionalAuthor(other.value))||companions.length>1||own.role.startsWith(contract.prefix+'First:')&&(!companions.length||!companions[0].value.trim()))return false;
        if(!v219CitationPersonalTail(plain)&&!(companions.length===1&&
            v219CitationPeopleEntrySafe(companions[0])&&v219CitationPersonalTail(companionKind==='First'?companions[0].value.trim()+' '+plain:plain+' '+companions[0].value.trim())))return false;
        const expected={autor:'numero-autores',editor:'numero-editores'}[own.family];
        if(display!==expected)return false;
        const others=entries.filter(other=>other!==entry&&!other.remove),roleLists=others.map(other=>v219CitationPeopleRoles(other.key));
        if(roleLists.some(roles=>roles.some(role=>role===contract.display||role===own.role||
            contract.unstructured.includes(role)||role.startsWith(contract.prefix+'Mask:')||
            own.unstructured&&role.startsWith(contract.prefix)||
            role.startsWith(contract.prefix)&&Number(role.slice(role.lastIndexOf(':')+1))>own.index)))return false;
        if(own.index>1)for(let index=1;index<own.index;index++){
            const preceding=others.filter(other=>v219CitationPeopleRoles(other.key).includes(contract.prefix+'Last:'+index));
            if(preceding.length!==1||!preceding[0].value.trim())return false;
        }
        return true;
    }
    // Config73016847 still consumes Coauthors as a separate display string.
    // CS172936771 appends it after structured-name formatting, omits it from
    // COinS authors and computes Harvard anchors from structured lists. Mode
    // cs2 also creates that anchor when ref is omitted. Preserve this native
    // deprecated field instead of silently inventing a numbered person slot.
    function v219CitationPeopleCoauthorCandidate(raw) {
        return typeof raw==='string'&&/(?:coautor|coauthor|[|][^|=]*[{}<>\uE000-\uF8FF])/.test(raw);
    }
    function v219CitationPeopleHasCoauthor(raw) {
        if(!v219CitationPeopleCoauthorCandidate(raw))return false;
        const fields=v2151FieldSyntaxParts(raw);
        // Unsupported control, comment or dynamic key spellings grant no
        // writing authority. Conservatively retain the people fields when
        // the strong parser cannot prove a separate safe native key.
        return !fields||fields.some(field=>v219CitationPeopleRoles(field.key).includes('Coauthors')||/(?:coautor|coauthor|[{}<>\uE000-\uF8FF])/.test(field.key));
    }
    function v219CitationCoauthorEntriesTemplate(p,entries) {
        const retained=entries.map(entry=>{
            if(!/(?:coautor|coauthor)/.test(entry.key)||typeof p.parts[entry.index]!=='string')return entry;
            const original=p.parts[entry.index].match(/^(\s*)([^=\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/);
            return original&&original[2].trim()===entry.key?{...entry,key:original[2]}:entry;
        });
        return entriesTemplate(p,retained);
    }
    function v219CitationCoauthorAllowed(raw,cfg,entries,entry) {
        return false;
    }
    function v219CitationCoauthorMetadataObligation(raw,options={}) {
        if(!v219CitationPeopleCoauthorCandidate(raw))return null;
        const cfg={...DEFAULTS,...options},context=v219CitationPeopleNative(raw,{...cfg,authors:true,citations:true});
        let fields=v2151FieldSyntaxParts(raw);
        if(!context)return null;
        if(!fields){
            const controls={...cfg,authors:false},empty=v219CitationEmptyPartsPlan(raw,controls);
            if(empty.edits.length&&empty.text!==raw&&v219CitationEmptyPartsProof(raw,empty.text,empty,controls)&&
                JSON.stringify(v219StageSafeEdits(raw,empty.edits,'v219-citation-empty-parts',controls))===JSON.stringify(empty.edits)){
                const preparedFields=v2151FieldSyntaxParts(empty.text);
                if(preparedFields){raw=empty.text;fields=preparedFields;}
            }
        }
        if(!fields){
            // A known native Coauthors argument plus an unproved key cannot
            // borrow a typed metadata projection. Preserve the complete
            // original call instead of granting authority to that key.
            return /[|][ \t\r\n]*(?:coautor(?:es)?|coauthors?)[ \t\r\n]*=/.test(raw)?
                JSON.stringify(['opaque-native-coauthors',context.native.title,context.native.oldid,raw]):null;
        }
        if(!fields.some(field=>v219CitationPeopleRoles(field.key).includes('Coauthors')))return null;
        // A source-only comparison view may compose the independently proved
        // non-person repairs. People transformations are explicitly disabled:
        // display-list normalization is not proof of the generated anchor.
        const controls={...cfg,authors:false},empty=v219CitationEmptyPartsPlan(raw,controls).text,
            projected=v218CitationMetadataProjection(v219SourceCompatibilityPlan(v219CitationProtocolProjection(empty,controls),controls).text,controls),
            roles=v219CitationNativeRoleContext(v219CitationDayContext(projected,controls),controls),canonical=v24InventoryTemplate(roles,controls),parsed=parsedTemplate(canonical),entries=foreignEntries(parsed),rows=[];
        for(const entry of entries){
            const nativeRoles=entry.positional?[]:v219CitationPeopleRoles(entry.key),role=nativeRoles.length?JSON.stringify(nativeRoles):'key:'+entry.key;
            rows.push({roles:nativeRoles.length?nativeRoles:['key:'+entry.key],key:entry.key,role,value:entry.value.trim(),positional:entry.positional});
        }
        const values=new Map();for(const row of rows)for(const role of row.roles){if(!values.has(role))values.set(role,new Set());values.get(role).add(row.value);}
        const conflicts=new Set([...values].filter(([role,values])=>values.size>1).map(([role])=>role)),
            precedence=rows.filter(row=>row.roles.some(role=>conflicts.has(role))).map(row=>[row.roles,row.key,row.value]),
            facts=[...new Set(rows.map(row=>JSON.stringify([row.roles,row.positional?row.key:null,row.value])))].sort();
        return JSON.stringify([context.native.title,context.native.oldid,facts,precedence]);
    }
    function v219CitationCoauthorMetadataRetention(before,after,options={}) {
        if(before===after||typeof before!=='string'||typeof after!=='string'||
            !v219CitationPeopleCoauthorCandidate(before))return {accepted:true,reason:''};
        const collect=source=>{const found=new Set(),memo=new Map();for(const node of templates(protectedView(source)).nodes){
            const raw=source.slice(node.start,node.end);if(!memo.has(raw))memo.set(raw,v219CitationCoauthorMetadataObligation(raw,options));const fact=memo.get(raw);if(fact!==null)found.add(fact);
        }return found;},required=collect(before);
        if(!required.size)return {accepted:true,reason:''};const actual=collect(after);
        for(const fact of required)if(!actual.has(fact))return {accepted:false,reason:'Uma citação perdeu a relação original entre coautores, nomes estruturados e publicação.'};
        return {accepted:true,reason:''};
    }

    function v219CitationPeopleLinkAllowed(raw,cfg,entries,entry,who,link) {
        if(v219CitationPeopleHasCoauthor(raw))return false;
        if(!v219CitationPeopleNative(raw,cfg)||!v219CitationPeopleEntrySafe(entry)||!Array.isArray(entries)||
            !Array.isArray(who)||!Array.isArray(link))return false;
        const own=v219CitationPeopleFamily(entry.key),family=who[1],index=Number(who[2]||1);
        if(!own||own.family!==family||own.index!==index||own.unstructured||!Number.isInteger(index)||index<1||index>99)return false;
        const prefix=own.contract.prefix,field=(family==='tradutor'?'tradutor-link':family+'link')+(who[2]||''),
            links=entries.filter(other=>other!==entry&&!other.remove&&v219CitationPeopleRoles(other.key).includes(prefix+'Link:'+index));
        if(links.length>1||links.some(other=>norm(other.key)!==field||other.value.trim()!==link[1]))return false;
        // Blank name aliases have precedence too. Do not unwrap a linked
        // person when another original field competes for that same name,
        // first-name component or mask, even if its visible value is blank.
        return !entries.some(other=>other!==entry&&!other.remove&&v219CitationPeopleRoles(other.key).some(role=>
            ['Last','First','Mask'].some(part=>role===prefix+part+':'+index)));
    }

    // A rendered label alone does not prove the CS1 person/anchor input.
    // Preserve rich person values before the generic emphasis relocation.
    const v219RichPersonEmphasisRanges=source=>{
        if(typeof source!=='string'||!/\[\[[^|\[\]\r\n]+\|'{2,3}/.test(source))return [];
        const ranges=[];
        for(const node of templates(protectedView(source)).nodes){
            const raw=source.slice(node.start,node.end),native=v219CitationPeopleNative(raw,{citations:true,authors:true});
            if(!native)continue;
            const fields=v2151FieldSyntaxParts(raw);
            if(!fields){ranges.push({start:node.start,end:node.end});continue;}
            const parsed={...native.parsed,name:norm(native.native.title),parts:[native.native.title,...native.parsed.parts.slice(1)]};
            for(const field of fields){
                if(!nativeCitationAccepts(parsed,field.key))continue;
                const roles=v219CitationPeopleRoles(field.key);
                if(roles.some(role=>/^(?:AuthorList-|EditorList-|TranslatorList-)/.test(role)||
                    ['Authors','Vauthors','Coauthors','Editors','Veditors'].includes(role)))
                    ranges.push({start:node.start+field.start,end:node.start+field.end});
            }
        }
        return ranges;
    };
