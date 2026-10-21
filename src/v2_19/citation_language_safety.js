    // Read-only native named-argument identity. No source or candidate writer runs.
    function v219CitationLanguageNativeFieldValue(field,parsed,entries,literalSyntax) {
        if(!literalSyntax||field.positional||!nativeCitationAccepts(parsed,field.key)||
            norm(field.key)==='langue')return field.value;
        const value=field.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
        if(/[{}\[\]<>\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\uE000-\uF8FF]/u.test(value))return field.value;
        const roles=v219NativeCitationRoles(field.key),role=roles.length===1?roles[0]:null;
        if(!['AccessDate','ArchiveDate'].includes(role)||entries.some(other=>other!==field&&
            !other.positional&&nativeCitationAccepts(parsed,other.key)&&v219NativeCitationRoles(other.key).includes(role)))return value;
        const date=/^([1-9]\d?) de ([A-Za-zç]+) de ([1-9]\d{3})$/.exec(value);
        if(!date)return value;
        const months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],
            month=date[2][0].toLowerCase()+date[2].slice(1),number=months.indexOf(month)+1;
        if(!number||!validDate(Number(date[1]),number,Number(date[3])))return value;
        return date[1]+' de '+month+' de '+date[3];
    }
    // This read certificate admits only the captured geographic population consumer.
    // The complete owner must later equal its source with one planned body substitution.
    function v219CitationLanguageBareOwner(source,ref) {
        const context=v219IndexedSyntaxContext(source,ref.start);
        if(!context||context.html.length||context.links.length||context.external.length)return null;
        if(context.tables.length)return v219CitationLanguageBareTableOwner(source,ref);
        if(!context.templates.length)return {kind:'root'};
        if(context.templates.length!==1)return null;
        const start=context.templates[0].start,node=templates(protectedView(source)).nodes.find(item=>item.start===start),
            raw=node&&source.slice(node.start,node.end),parsed=raw&&parsedTemplate(raw),profile=parsed&&INFOBOX_CATALOG[parsed.name];
        if(!node||!v215SameTemplateTitle(parsed.parts[0],'Info/Território geográfico')||
            profile?.oldid!==72297344||!v215LiteralTemplateIdentity(raw,profile))return null;
        const fields=v2151FieldSyntaxParts(raw);
        if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))return null;
        const population=fields.filter(field=>field.key==='populacao');
        if(population.length!==1)return null;
        const field=population[0];
        if(start+field.start>ref.start||ref.end>start+field.end)return null;
        return {kind:'native-geographic-population',start,end:node.end,raw,
            key:'populacao',fieldIndex:fields.indexOf(field),fieldStart:field.start,fieldEnd:field.end,
            nativeOldid:72297344,wrapperOldid:70262218,moduleOldid:72782381};
    }
    // Independently derive only the literal URL and label supplied in an existing ref.
    function v219CitationLanguageBareReferencePlan(source,options={}) {
        const cfg={...DEFAULTS,...options},empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||!cfg.bareReferences||!/<ref\b/i.test(source)||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg)||!v20AutomationAllowed(source,cfg))return empty;
        const recovery=syntaxRepairPrefix(source,cfg);let end=source.length,local=cfg;
        const partial=[];
        if(recovery.unresolved.length){
            if(cfg.partialSyntaxRecovery===false||recovery.plan.text!==source||recovery.end<=0||recovery.end>=source.length)return empty;
            end=recovery.end;local=syntaxPrefixOptions(cfg);
            for(const ref of refTokens(protectedView(source.slice(0,end)))){
                const attrs=attrsOf(ref.attrs);if(attrs&&(attrs.name||attrs.follow))partial.push({start:ref.start,end:ref.end});
            }
            partial.push(...v219PartialReferenceQuarantineRanges(source,end,cfg));
            partial.push(...v219ReferenceDefinitionPeerRanges(source,partial,cfg));
        }
        const contextSource=source.slice(0,end),view=protectedView(contextSource),allRefs=refTokens(protectedView(source)),
            ordinals=new Map(allRefs.map((ref,index)=>[ref.start+':'+ref.end,index])),proposed=[],target=TEMPLATE_CATALOG['citar web'];
        if(target?.oldid!==48262420||!target.dependencies?.some(row=>row.title==='Módulo:Citação/CS1/Configuração'&&row.oldid===73016847)||
            !target.dependencies.some(row=>row.title==='Módulo:Citação/CS1/Whitelist'&&row.oldid===71860752))return empty;
        for(const ref of refTokens(view)){
            if(ref.body===null||ref.end>end||partial.some(range=>range.start<ref.end&&ref.start<range.end))continue;
            const raw=source.slice(ref.start,ref.end),close=/<\s*\/\s*ref\s*>$/i.exec(raw),attrs=attrsOf(ref.attrs);
            if(!close||!attrs||Object.keys(attrs).some(key=>!['name','group'].includes(key))||
                v219UncertainReferenceIdentity(attrs.name||'')||v219UncertainReferenceIdentity(attrs.group||''))continue;
            const ordinal=ordinals.get(ref.start+':'+ref.end);if(!Number.isInteger(ordinal))continue;
            const start=ref.openEnd,finish=ref.end-close[0].length,body=source.slice(start,finish),
                link=/^\[(https?:\/\/[^\s\[\]{}<>|"'\uE000-\uF8FF]+) +([^\[\]{}<>|]+)\]$/.exec(body);
            if(!link||/[\u0000-\u001f\u007f-\u009f\u00a0\u200b-\u200f\u202a-\u202e\u2028\u2029\u2060-\u206f\uE000-\uF8FF]/u.test(body)||
                /'{2}/.test(link[2]))continue;
            if(/(?:^|[^ ])&|&(?! )/.test(link[2])){
                const spans=link[2].split('&');
                if(/https?:\/\//i.test(link[2])||spans.some((part,index)=>index&&
                    !(spans[index-1].endsWith(' ')&&part.startsWith(' '))&&
                    !(/[A-Za-z0-9]$/.test(spans[index-1])&&/^[A-Za-z0-9](?:$|[ .,:!?()\/-])/.test(part))))continue;
                const dependencies=target.dependencies;
                if(!Array.isArray(dependencies)||![['Módulo:Citar web',48965255],['Módulo:Citação/CS1',72936771],
                    ['Módulo:Citação/CS1/Utilidades',72714591],['Módulo:Citação/CS1/Configuração',73016847],
                    ['Módulo:Citação/CS1/Whitelist',71860752]].every(([title,oldid])=>{
                        const rows=dependencies.filter(row=>row.title===title);return rows.length===1&&rows[0].oldid===oldid;}))continue;
            }
            const owner=v219CitationLanguageBareOwner(contextSource,ref);
            if(!owner||owner.kind!=='root'&&Object.keys(attrs).length||!v20ValidURL(link[1]))continue;
            const text='{{Citar web|url='+link[1]+'|título='+link[2]+'}}';
            proposed.push({start,end:finish,text,ruleId:'bareReferences',proof:{kind:'source-literal-reference-url-label',
                sourceHash:empty.sourceHash,referenceStart:ref.start,referenceEnd:ref.end,referenceOrdinal:ordinal,contextEnd:end,owner,
                open:source.slice(ref.start,ref.openEnd),close:close[0],name:attrs.name||'',group:attrs.group||'',
                body,url:link[1],title:link[2],nativeTemplateOldid:48262420,nativeConfigOldid:73016847,nativeWhitelistOldid:71860752}});
        }
        const oneOwner=proposed.filter(edit=>edit.proof.owner.kind==='root'||
            proposed.filter(other=>other.proof.owner.kind!=='root'&&other.proof.owner.start===edit.proof.owner.start).length===1),
            edits=v219StageSafeEdits(source,oneOwner,'citation-language-bare-source',local);
        return {...empty,edits,text:edits.length?v24SyntaxApply(source,edits):source};
    }
    function v219CitationLanguageBareReferenceProof(before,after,plan,options={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||
            plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219CitationLanguageBareReferencePlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219CitationLanguageBareReferenceSitesRetained(before,after,plan,namedPlan=null,options={}) {
        if(!plan?.edits?.length)return true;
        if(plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        const end=plan.edits[0].proof?.contextEnd;
        if(!Number.isInteger(end)||end<=0||end>before.length||plan.edits.some(edit=>edit.proof?.contextEnd!==end))return false;
        const tail=before.slice(end);if(!after.endsWith(tail))return false;
        const actualEnd=after.length-tail.length,contextSource=after.slice(0,actualEnd);
        if(!v219SyntaxContextIndex(before.slice(0,end))||!v219SyntaxContextIndex(contextSource))return false;
        let markerSource=before;
        if(namedPlan){
            const bareOrdinals=new Set(plan.edits.map(edit=>edit.proof.referenceOrdinal));
            if(!namedPlan.edits?.length||!v219CitationLanguageNamedMoveProof(before,namedPlan.text,namedPlan,options)||
                namedPlan.families.some(family=>family.sites.some(site=>bareOrdinals.has(site.ordinal)))||
                !v219CitationLanguageNamedMoveSitesRetained(before,after,namedPlan,options))return false;
            markerSource=namedPlan.text;
        }
        const original=refTokens(protectedView(markerSource)),actual=refTokens(protectedView(after)),
            opening=(source,ref)=>source.slice(ref.start,ref.body===null?ref.end:ref.openEnd);
        if(original.length!==actual.length)return false;
        if(original.some((ref,index)=>(ref.body===null)!==(actual[index].body===null)||
            opening(markerSource,ref)!==opening(after,actual[index]))&&
            !v219CitationLanguageOpeningsRetained(markerSource,after,options))return false;
        const sourceEdits=plan.edits.slice();let cfg=null,archived=false;
        for(const [index,edit]of plan.edits.entries()){
            const ref=actual[edit.proof.referenceOrdinal];if(!ref||ref.body===null||ref.end>actualEnd)return false;
            const owner=v219CitationLanguageBareOwner(contextSource,ref),expectedOwner=edit.proof.owner;
            if(!owner||owner.kind!==expectedOwner?.kind)return false;
            if(owner.kind==='native-wikitable-cell'){
                if(owner.tableIndex!==expectedOwner.tableIndex||owner.rowIndex!==expectedOwner.rowIndex||
                    owner.cellIndex!==expectedOwner.cellIndex||owner.structure!==expectedOwner.structure)return false;
            }else if(owner.kind!=='root'){
                const expected=v24SyntaxApply(expectedOwner.raw,[{start:edit.start-expectedOwner.start,
                    end:edit.end-expectedOwner.start,text:edit.text}]);
                if(owner.raw!==expected||owner.key!==expectedOwner.key||owner.fieldIndex!==expectedOwner.fieldIndex)return false;
            }
            const raw=after.slice(ref.start,ref.end),close=/<\s*\/\s*ref\s*>$/i.exec(raw);
            if(!close||close[0]!==edit.proof.close||after.slice(ref.start,ref.openEnd)!==edit.proof.open)return false;
            const body=after.slice(ref.openEnd,ref.end-close[0].length);
            if(body!==edit.text){
                if(owner.kind!=='root')return false;
                cfg||={...DEFAULTS,...options};
                const text=v219CitationLanguageKeeperArchive(edit.text,cfg);
                if(text===null||body!==text)return false;
                sourceEdits[index]={...edit,text};archived=true;
            }
        }
        return !archived||v219CitationLanguageBareReferenceProof(before,plan.text,plan,options)&&
            JSON.stringify(v219StageSafeEdits(before,sourceEdits,'citation-language-bare-source',end<before.length?syntaxPrefixOptions(cfg):cfg))===JSON.stringify(sourceEdits);
    }
    function v219CitationLanguageCall(raw,cfg={}) {
        if(typeof raw!=='string')return null;
        const parsed=parsedTemplate(raw),literal=parsed.parts[0],local=v219LocalCitationRedirectProfile(raw),
            nativeRaw=local?'{{'+local.target+raw.slice(2+literal.length):raw,
            header=local?local.target:literal,native=TEMPLATE_CATALOG[v219ReaderNativeName(header)],
            exact=v219OriginalTemplateHeaderAllowed(literal)&&!!native&&v215SameTemplateTitle(header,native.title)&&
                native.dependencies?.some(row=>row.title==='Módulo:Citação/CS1/Configuração'&&row.oldid===73016847)&&
                native.dependencies.some(row=>row.title==='Módulo:Citação/CS1/Whitelist'&&row.oldid===71860752);
        if(!exact){
            const profile=translationProfile(raw);if(profile?.kind!=='citation')return null;
            const sourceLanguage=foreignEntries(parsed).some(field=>!field.positional&&
                v219NativeCitationRoles(profile.fields?.[norm(field.key)]||field.key).includes('Language'));
            return {family:norm(profile.target),raw,fields:[],foreign:true,sourceLanguage};
        }
        const p=parsedTemplate(nativeRaw),entries=foreignEntries(p),isLanguage=field=>!field.positional&&
            (v219NativeCitationRoles(field.key).includes('Language')||norm(field.key)==='langue'),
            fields=entries.filter(isLanguage),ignored=fields.filter(field=>norm(field.key)==='langue'&&!nativeCitationAccepts(p,field.key)),
            opaque=ignored.some(field=>!v219NativeLangueActivationAllowed(p,field.index)),
            titles=entries.filter(field=>!field.positional&&nativeCitationAccepts(p,field.key)&&
                JSON.stringify(v219NativeCitationRoles(field.key))==='["Title"]'),
            syntax=!opaque?v2151FieldSyntaxParts(raw):null,
            literalSyntax=!!syntax&&syntax.length===entries.length&&syntax.every((field,index)=>
                field.key===field.plain&&field.separator==='='&&!entries[index].positional&&field.key===entries[index].key),
            readValue=field=>v219CitationLanguageNativeFieldValue(field,p,entries,literalSyntax),
            readAliases=literalSyntax&&!opaque&&fields.length===1&&nativeCitationAccepts(p,fields[0].key)&&
                JSON.stringify(v219NativeCitationRoles(fields[0].key))==='["Language"]'&&titles.length<=1&&
                [...fields,...titles].every(field=>field.value.trim()&&!/[{}\[\]<>\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/u.test(readValue(field)));
        return {family:norm(native.title),raw,opaqueIdentity:opaque?[norm(native.title),raw.slice(2+literal.length)]:null,fields:fields.map(field=>[readAliases?['native-role','Language']:field.key,readValue(field)]),opaque,sourceLanguage:fields.length>0,
            binding:entries.filter(field=>!isLanguage(field)).map(field=>{
                const roles=field.positional?[]:v219NativeCitationRoles(field.key),alias=readAliases&&
                    !field.positional&&nativeCitationAccepts(p,field.key)&&roles.length===1&&
                    entries.filter(other=>!other.positional&&nativeCitationAccepts(p,other.key)&&
                        v219NativeCitationRoles(other.key).includes(roles[0])).length===1;
                return [field.positional?'positional':alias?'native-role':'named',alias?roles[0]:field.key,readValue(field)];
            })};
    }
    function v219OpaqueNativeLangueOwners(source) {
        if(typeof source!=='string'||!/[|][\s_]*langue[\s_]*=/iu.test(source))return [];
        const owners=[];
        for(const node of templates(protectedView(source)).nodes){
            const raw=source.slice(node.start,node.end),call=v219CitationLanguageCall(raw);
            if(call?.opaque)owners.push({start:node.start,end:node.end,raw,identity:call.opaqueIdentity});
        }
        return owners;
    }
    function v219CitationLanguageInventory(source,cfg={}) {
        const result=[];let hasLanguage=false;
        for(const node of templates(protectedView(source)).nodes){
            const raw=source.slice(node.start,node.end),call=v219CitationLanguageCall(raw,cfg);if(!call)continue;
            hasLanguage=hasLanguage||call.sourceLanguage;
            result.push(call.opaque?['opaque-native-langue',call.opaqueIdentity]:[call.family,call.fields,call.fields.length?call.binding:null]);
        }
        return {hasLanguage,key:JSON.stringify(result)};
    }
    function v219CitationLanguageSource(source,cfg={}) {
        source=v219CitationLanguageScriptTitleSource(source,cfg);
        // Match the original partial cleanup boundary before any value projection.
        const recovery=syntaxRepairPrefix(source,cfg);
        if(recovery.unresolved.length){
            if(cfg.partialSyntaxRecovery===false||recovery.plan.text!==source||recovery.end<=0||recovery.end>=source.length)return source;
            const prefix=source.slice(0,recovery.end),tail=source.slice(recovery.end),
                named=refTokens(protectedView(prefix)).filter(ref=>{const attrs=attrsOf(ref.attrs);return attrs&&(attrs.name||attrs.follow);}),
                shield=maskProtected(prefix,()=>{},mergeEditorialRanges([...named,
                    ...v219PartialReferenceQuarantineRanges(source,recovery.end,cfg),
                    ...v219ReferenceDefinitionPeerRanges(prefix,named,cfg)])),
                projected=shield.restore(v219CitationLanguageSource(shield.text,syntaxPrefixOptions(cfg))),
                ending=prefix.match(/(?:\r?\n)[ \t\r\n]*$/)?.[0]||'';
            return (ending?projected.replace(/[ \t\r\n]*$/,'')+ending:projected)+tail;
        }
        for(const [make,prove,name]of [[v2151InfoboxOrderPlan,v2151InfoboxOrderProof,'v2151-infobox-order'],
            [v214NSRWPlan,v214NSRWProof,'v214-nsrw-native-citation'],
            [v219IgnoredCitationHeaderPlan,v219IgnoredCitationHeaderProof,'v219-ignored-citation-header'],
            [v219CitationEmptyPartsPlan,v219CitationEmptyPartsProof,'v219-citation-empty-parts'],
            [v219SourceCompatibilityPlan,v219SourceCompatibilityProof,'v219-source-compatibility']]){
            const plan=make(source,cfg);
            if(plan.edits.length&&prove(source,plan.text,plan,cfg)&&
                JSON.stringify(v219StageSafeEdits(source,plan.edits,name,cfg))===JSON.stringify(plan.edits))source=plan.text;
        }
        const edits=[],nodes=templates(protectedView(source)).nodes.slice().sort((a,b)=>a.start-b.start||b.end-a.end);let covered=-1;
        for(const node of nodes){
            if(node.start<covered)continue;
            const raw=source.slice(node.start,node.end),call=v219CitationLanguageCall(raw,cfg);
            if(!call?.sourceLanguage)continue;
            covered=node.end;if(call.opaque)continue;
            const text=mapTemplateTree(raw,part=>v219CitationLanguageProjectionCall(part,cfg));
            if(text!==raw)edits.push({start:node.start,end:node.end,text});
        }
        return v24SyntaxApply(source,v219StageSafeEdits(source,edits,'citation-language-source',cfg));
    }
    function v219CitationLanguageProjectionCall(raw,cfg={}) {
        const call=v219CitationLanguageCall(raw,cfg),noop=()=>{};
        if(!call?.sourceLanguage||call.opaque)return raw;
        const migration=migrateForeignTemplate(raw,cfg);let text=migration&&!migration.blocked?migration.text:raw;
        if(cfg.citations){
            text=v219CitationProtocolProjection(text,cfg);
            const compatibility=v219SourceCompatibilityPlan(text,cfg);
            if(compatibility.edits.length&&v219SourceCompatibilityProof(text,compatibility.text,compatibility,cfg))text=compatibility.text;
            text=v218CitationMetadataProjection(text,cfg);
            text=v219CitationNativeLanguageContext(automaticParameters(extendedCitation(citation(text,cfg,noop,noop),cfg,noop,noop),cfg,noop),cfg);
        }
        return text;
    }
    function v219CitationLanguageReferenceSource(source,cfg={}) {
        if(cfg.references===false||cfg.automaticIdenticalReferences===false||cfg.sectionOnly||syntaxRepairPrefix(source,cfg).unresolved.length)return source;
        const repeated=v219RepeatedNamedDefinitionPlan(source,cfg);
        if(repeated.edits.length&&v219RepeatedNamedDefinitionProof(source,repeated.text,repeated,cfg)&&
            JSON.stringify(v219StageSafeEdits(source,repeated.edits,'v219-repeated-named-definitions',cfg))===JSON.stringify(repeated.edits))source=repeated.text;
        const named=v219StageSafeEdits(source,v27SafeAutomationEdits(source,cfg,'references'),'v27-references',cfg);
        const namedSource=named.length?v24SyntaxApply(source,named):source,
            text=automaticIdenticalReferences(namedSource,cfg,()=>{});if(text===namedSource)return namedSource;
        source=namedSource;
        let start=0,end=source.length,nextEnd=text.length;
        while(start<end&&start<nextEnd&&source[start]===text[start])start++;
        while(end>start&&nextEnd>start&&source[end-1]===text[nextEnd-1]){end--;nextEnd--;}
        const edits=[{start,end,text:text.slice(start,nextEnd)}];
        return JSON.stringify(v219StageSafeEdits(source,edits,'citation-language-reference-reuse',cfg))===JSON.stringify(edits)?text:source;
    }
    // Fixed patent49050190/make-link49050195/authors48723886 graph, not metadata equivalence.
    function v219CitationLanguagePatentBody(raw) {
        const parsed=parsedTemplate(raw),header=parsed.parts[0],native=TEMPLATE_CATALOG[v219ReaderNativeName(header)],
            generic=native?.oldid===62525251,patent=native?.oldid===49050208;
        if((!generic&&!patent)||!v219OriginalTemplateHeaderAllowed(header)||!v215SameTemplateTitle(header,native.title))return false;
        const fields=v2151FieldSyntaxParts(raw);
        if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))return false;
        const priority=['inventor-surname','inventor1-surname','inventor-last','inventor1-last','inventor'],
            supplied=generic&&fields.some(field=>priority.includes(field.key));
        if(generic&&!supplied)return v219NativeCitationStateInterface(raw);
        const seen=new Set();
        for(const field of fields){
            if(seen.has(field.key))return false;seen.add(field.key);
            const value=field.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
            if(/[{}\[\]<>&"'\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f\u2060-\u206f\u3000\ufeff\uE000-\uF8FF]/u.test(value))return false;
        }
        if(patent)return true;
        const selected=priority.map(key=>fields.find(field=>field.key===key)).find(Boolean);
        // Presence, including an earlier blank, controls the original fallback chain.
        return selected.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'')!==''||v219NativeCitationStateInterface(raw);
    }
    // Exact native citation interfaces only; specialized wrappers need their own proof.
    function v219CitationLanguageNamedMoveBody(value) {
        if(typeof value!=='string'||!value.trim()||/<!--|<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(value))return false;
        let read=value,shield=v24SyntaxBodySafe(value)?v29ReferenceShield(value):null;
        if(!shield||shield.unclosed.length||shield.ranges.length){
            // Read-only mirror for closed literal link labels; output retains the full body.
            if(/[{}<>&\p{Cc}\p{Cf}\p{Co}]|'{3}/u.test(value))return false;
            let quoted=false;
            read=value.replace(/\[https?:\/\/[^\s[\]{}<>&"']+ [^\[\]{}<>&'\r\n]*\]/g,link=>{
                if(link.includes('"'))quoted=true;
                return ' '.repeat(link.length);
            }).replace(/''[^'\r\n]+''/g,part=>'  '+part.slice(2,-2)+'  ');
            if(!quoted||/[\[\]"]|''/.test(read)||!v24SyntaxBodySafe(read))return false;
            shield=v29ReferenceShield(read);
        }
        if(shield.unclosed.length||shield.ranges.length)return false;
        const nodes=templates(read);if(nodes.unclosed.length)return false;
        return nodes.nodes.every(node=>{
            const raw=value.slice(node.start,node.end),header=parsedTemplate(raw).parts[0];
            if(!v219OriginalTemplateHeaderAllowed(header))return false;
            const local=v219LocalCitationRedirectProfile(raw),nativeRaw=local?'{{'+local.target+raw.slice(2+header.length):raw,
                native=TEMPLATE_CATALOG[v219ReaderNativeName(parsedTemplate(nativeRaw).parts[0])];
            if(native?.oldid===49050208||native?.oldid===62525251)return v219CitationLanguagePatentBody(nativeRaw);
            return v219NativeCitationStateInterface(nativeRaw);
        });
    }
    // Both SOURCE and actual spans use this same bounded expansion read.
    function v219CitationLanguageNamedMoveCrossingSafe(source,refs,nodes,intervals,bodyProofs=new Map()) {
        // The exact-source cached index sees tag attributes skipped by brace nodes.
        const index=v219SyntaxContextIndex(source);if(!index)return false;
        for(const interval of intervals){
            if(source.slice(interval.start,interval.end).includes('{{{'))return false;
            let low=0,high=index.tokens.length;
            while(low<high){const middle=(low+high)>>>1;
                if(index.tokens[middle].end<=interval.start)low=middle+1;else high=middle;}
            for(let at=low;at<index.tokens.length&&index.tokens[at].start<interval.end;at++){
                const token=index.tokens[at];if(source[token.start]!=='<')continue;
                const tag=v24SyntaxTag(source,token.start);
                if(!tag||tag.end!==token.end||/[{}]/.test(tag.attrs))return false;
            }
        }
        return !nodes.some(node=>{
            if(!intervals.some(interval=>interval.start<=node.start&&node.start<interval.end))return false;
            const inside=refs.some(ref=>{
                if(ref.body===null||!ref.close||!(v24SyntaxTag(source,ref.start)?.end<=node.start&&node.end<=ref.close.start))return false;
                if(!bodyProofs.has(ref.body))bodyProofs.set(ref.body,v219CitationLanguageNamedMoveBody(ref.body));
                return bodyProofs.get(ref.body);
            });
            if(inside)return false;
            const raw=source.slice(node.start,node.end);
            return !v219OriginalTemplateHeaderAllowed(parsedTemplate(raw).parts[0])||!v2111ReferenceFreeTemplate(raw);
        });
    }
    // Derive literal same-name reuse without calling the reference writer or its body signature.
    // Duplicate reduction keeps one exact source body; only moveNamedRefs relocates that keeper.
    function v219CitationLanguageNamedMovePlan(source,options={}) {
        const cfg={...DEFAULTS,...options},empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],families:[]};
        if(typeof source!=='string'||source.length>4194304||!cfg.references||cfg.sectionOnly||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg)||!v20AutomationAllowed(source,cfg)||
            v24SyntaxScan(source).issues.length)return empty;
        const observed=v219NativeReferenceObserver(source);
        if(observed.unclosed.length||observed.empties.length||observed.shield.unclosed.length)return empty;
        const refs=observed.refs,renderers=rendererRanges(observed.view),nodes=templates(observed.view).nodes,families=new Map(),edits=[],proofs=[],bodyProofs=new Map(),
            stageSafe=v219NamedMoveStageFilter(source,cfg);
        for(const [ordinal,ref]of refs.entries()){
            const attrs=ref.attrs;if(!attrs?.name)continue;
            const key=JSON.stringify([attrs.group||'',attrs.name]);if(!families.has(key))families.set(key,[]);
            families.get(key).push({ref,ordinal,attrs});
        }
        for(const [key,family]of families){
            const first=family[0],name=first.attrs.name,group=first.attrs.group||'',
                definitions=family.filter(item=>item.ref.body!==null),head='<ref name="'+name+'"'+(group?' group="'+group+'"':'');
            if(!v29ReferenceName(name)||group&&!v29ReferenceName(group)||v219UncertainReferenceIdentity(name)||
                v219UncertainReferenceIdentity(group)||!definitions.length||new Set(definitions.map(item=>item.ref.body)).size!==1||
                !v219CitationLanguageNamedMoveBody(definitions[0].ref.body)||
                refs.some(ref=>ref.attrs?.follow===name&&(ref.attrs.group||'')===group)||
                observed.helpers.some(helper=>helper.calls.some(call=>call.value===name&&call.group===group)))continue;
            const body=definitions[0].ref.body,full=head+'>'+body+'</ref>',self=head+' />',
                keeper=cfg.moveNamedRefs&&first.ref.start<definitions[0].ref.start?first.ordinal:definitions[0].ordinal,
                region=renderers.filter(range=>range.end<=first.ref.start).length;
            // A citation's explicit anchor must keep its original definition site.
            if(templates(body).nodes.some(node=>{
                const supplied=parsedTemplate(body.slice(node.start,node.end));
                return foreignEntries(supplied).some(field=>!field.positional&&nativeCitationAccepts(supplied,field.key)&&
                    v219NativeCitationRoles(field.key).includes('Ref'));
            }))continue;
            if(family.some(({ref,attrs})=>!ref.valid||Object.keys(attrs).some(field=>!['name','group'].includes(field))||
                Object.hasOwn(attrs,'group')&&!attrs.group||ref.container||!ref.renderer.valid||
                renderers.some(range=>range.start<=ref.start&&ref.end<=range.end)||
                renderers.filter(range=>range.end<=ref.start).length!==region||
                !v24SyntaxLiteralIdentity(attrs,true)||!v29ReferenceTag(source,ref)))continue;
            if(family.every(({ref,ordinal})=>source.slice(ref.start,ref.end)===(ordinal===keeper?full:self)))continue;
            const contexts=family.map(({ref})=>v219IndexedSyntaxContext(source,ref.start));
            if(contexts.some(context=>!context||context.templates.length||context.html.length||context.tables.length||context.links.length||context.external.length))continue;
            // Each removed full definition must stay in its keeper's proved expansion interval.
            // This covers duplicate reduction and relocation without banning unrelated page owners.
            const intervals=definitions.filter(item=>item.ordinal!==keeper).map(item=>({start:refs[keeper].end,end:item.ref.start}));
            if(!v219CitationLanguageNamedMoveCrossingSafe(source,refs,nodes,intervals,bodyProofs))continue;
            const sites=family.map(({ref,ordinal})=>({ordinal,before:source.slice(ref.start,ref.end),after:ordinal===keeper?full:self})),
                proposed=sites.filter(site=>site.before!==site.after).map(site=>({start:refs[site.ordinal].start,
                    end:refs[site.ordinal].end,text:site.after,ruleId:(refs[site.ordinal].body===null)!==(site.ordinal!==keeper)?'namedRefs':'refAttributes',
                    proof:{kind:'literal-named-definition-reuse',sourceHash:empty.sourceHash,key,ordinal:site.ordinal,keeper}}));
            if(!proposed.length||JSON.stringify(stageSafe(proposed))!==JSON.stringify(proposed))continue;
            edits.push(...proposed);proofs.push({key,name,group,region,body,keeper,relocated:keeper!==definitions[0].ordinal,sites});
        }
        edits.sort((a,b)=>a.start-b.start);if(edits.some((edit,index)=>index&&edits[index-1].end>edit.start)||
            JSON.stringify(stageSafe(edits))!==JSON.stringify(edits))return empty;
        return {...empty,edits,families:proofs,text:edits.length?v24SyntaxApply(source,edits):source};
    }
    function v219CitationLanguageNamedMoveProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219CitationLanguageNamedMovePlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits)&&JSON.stringify(fresh.families)===JSON.stringify(plan.families);
    }
    function v219CitationLanguageNamedMoveSitesRetained(before,after,plan,options={},selection=null) {
        const cfg={...DEFAULTS,...options};
        if(!plan?.families?.length||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        if(selection!==null&&(!Array.isArray(selection)||!selection.length||
            new Set(selection.map(family=>JSON.stringify(family))).size!==selection.length||
            selection.some(family=>!plan.families.some(original=>JSON.stringify(original)===JSON.stringify(family)))||
            !v219CitationLanguageNamedMoveProof(before,plan.text,plan,cfg)))return false;
        const families=selection===null?plan.families:selection,
            original=v219NativeReferenceObserver(before),actual=v219NativeReferenceObserver(after),
            originalRenderers=rendererRanges(original.view),actualRenderers=rendererRanges(actual.view),
            lists=(source,ranges)=>ranges.map(range=>{
                const raw=source.slice(range.start,range.end),tag=v24SyntaxTag(source,range.start);
                if(tag?.name==='references'&&!tag.close){
                    const attrs=v24SyntaxAttrs(tag.attrs);
                    return attrs&&Object.keys(attrs).every(key=>['group','responsive'].includes(key))&&
                        !/[{}<>\[\]&\r\n]/.test(attrs.group||'')?[attrs.group||'']:['opaque',raw];
                }
                const native=v219NativeCollectorGroups(raw);return native.recognized&&!native.ambiguous?native.groups:['opaque',raw];
            }),region=(ranges,at)=>ranges.filter(range=>range.end<=at).length,
            attrsEqual=(left,right)=>{
                if(!left||!right)return left===right;
                const keys=Object.keys(left);
                return keys.length===Object.keys(right).length&&keys.every(key=>Object.hasOwn(right,key)&&left[key]===right[key]);
            };
        if(original.unclosed.length||actual.unclosed.length||original.empties.length||actual.empties.length||
            original.refs.length!==actual.refs.length||JSON.stringify(lists(before,originalRenderers))!==JSON.stringify(lists(after,actualRenderers)))return false;
        const changed=new Map(families.flatMap(family=>family.sites.map(site=>[site.ordinal,site])));
        for(const [ordinal,ref]of original.refs.entries()){
            const next=actual.refs[ordinal],site=changed.get(ordinal);
            if(!attrsEqual(ref.attrs,next.attrs)||ref.group!==next.group||
                region(originalRenderers,ref.start)!==region(actualRenderers,next.start)||!site&&(ref.body===null)!==(next.body===null))return false;
            if(!site)continue;
            if(after.slice(next.start,next.end)!==site.after&&
                !v219CitationLanguageKeeperBodyRetained(before,after,plan,site,next,cfg))return false;
            const context=v219IndexedSyntaxContext(after,next.start);
            if(!context||context.templates.length||context.html.length||context.tables.length||context.links.length||context.external.length)return false;
        }
        const intervals=families.flatMap(family=>family.sites.filter(site=>site.ordinal!==family.keeper&&original.refs[site.ordinal].body!==null)
            .map(site=>({start:actual.refs[family.keeper].end,end:actual.refs[site.ordinal].start})));
        return v219CitationLanguageNamedMoveCrossingSafe(after,actual.refs,templates(actual.view).nodes,intervals);
    }
    function v219OpaqueLangueDefaultCollectorPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||!cfg.endMatter||!cfg.references||cfg.namespaceNumber!==0||
            cfg.sectionOnly||cfg.discussionPage||cfg.contentModel&&cfg.contentModel!=='wikitext'||
            v20DefinitionContext(cfg)||!v20AutomationAllowed(source,cfg)||v24SyntaxScan(source).issues.length)return empty;
        const owners=v219OpaqueNativeLangueOwners(source);if(!owners.length)return empty;
        const observed=v219NativeReferenceObserver(source),inside=range=>owners.some(owner=>owner.start<=range.start&&range.end<=owner.end);
        if(observed.unclosed.length||observed.empties.length||observed.helpers.length||rendererRanges(observed.view).length||
            v219ReferenceIdentityQuarantine(source,cfg).opaque||v219StageProtectedRanges(source,cfg).some(range=>!inside(range)))return empty;
        for(const owner of owners){
            if(/\{\{|\}\}|<(?!\/?ref(?=[ \t\r\n/>]))/i.test(owner.raw.slice(2,-2))||malformedRefs(owner.raw))return empty;
        }
        const refs=observed.refs;
        if(refs.some(ref=>!ref.close||!ref.attrs||ref.body===null||Object.keys(ref.attrs).some(key=>!['name','group'].includes(key))||
            v219UncertainReferenceIdentity(ref.attrs.name||'')||v219UncertainReferenceIdentity(ref.attrs.group||''))||
            !refs.some(ref=>!inside(ref)&&ref.valid&&!ref.group&&ref.body.trim())||refs.some(ref=>!inside(ref)&&!ref.valid))return empty;
        for(const node of templates(observed.view).nodes){
            if(inside(node))continue;
            const raw=source.slice(node.start,node.end);
            if(!v219NativeCitationStateInterface(raw)&&!v2111ReferenceFreeTemplate(raw)&&!v219LiteralDefaultSortCall(raw))return empty;
        }
        const text=endMatterPass(source,()=>{},()=>{},cfg),suffix=text.slice(source.length);
        if(!text.startsWith(source)||!/^\n{0,2}\{\{Referências\}\}\n\n$/.test(suffix))return empty;
        // The exact existing producer only appends. At an opaque owner's EOF
        // boundary a zero-width edit is protected, so prove a containing span
        // which retains every original byte and adds this sole literal suffix.
        const edit={start:0,end:source.length,text,ruleId:'endMatter',proof:{kind:'source-exact-default-collector-append',sourceHash:empty.sourceHash}},
            allowed=v219StageSafeEdits(source,[edit],'endMatter',cfg);
        return JSON.stringify(allowed)===JSON.stringify([edit])?{...empty,text,edits:allowed}:empty;
    }
    function v219OpaqueLangueDefaultCollectorProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||!plan.edits?.length)return false;
        const fresh=v219OpaqueLangueDefaultCollectorPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219CitationLanguageRetention(before,after,options={}) {
        const pass={accepted:true,reason:''};
        if(before===after||typeof before!=='string'||typeof after!=='string'||
            !/[|][\s_]*(?:langue|lingua|língua|idioma|language|in|lang|codling|ling)[0-9]*[\s_]*=/iu.test(before))return pass;
        const cfg={...DEFAULTS,...options},original=v219CitationLanguageInventory(before,cfg);if(!original.hasLanguage)return pass;
        const actual=v219CitationLanguageInventory(after,cfg).key,same=source=>v219CitationLanguageInventory(source,cfg).key===actual;
        if(same(before))return pass;
        const date=v218CitationDatePlan(before,cfg);
        if(date.edits.length&&v218CitationDateProof(before,date.text,date,cfg)&&
            JSON.stringify(v219StageSafeEdits(before,date.edits,'v218-citation-date-values',cfg))===JSON.stringify(date.edits)&&
            same(date.text))return pass;
        const source=v219CitationLanguageSource(before,cfg);if(same(source))return pass;
        // Only compose the separately fresh original-source date certificate.
        // The actual inventory and every older fallback remain unchanged.
        if(date.edits.length&&v218CitationDateProof(before,date.text,date,cfg)&&
            JSON.stringify(v219StageSafeEdits(before,date.edits,'v218-citation-date-values',cfg))===JSON.stringify(date.edits)&&
            same(v219CitationLanguageSource(date.text,cfg)))return pass;
        const referenceSame=value=>{
            const reference=v219CitationLanguageReferenceSource(value,cfg);if(same(reference))return true;
            const moved=v219CitationLanguageNamedMovePlan(reference,cfg);
            if(!moved.edits.length||!v219CitationLanguageNamedMoveProof(reference,moved.text,moved,cfg))return false;
            if(v219CitationLanguageNamedMoveSitesRetained(reference,after,moved,cfg)&&same(moved.text))return true;
            const refs=v219NativeReferenceObserver(after).refs,selected=[];
            for(const family of moved.families){
                const tokens=family.sites.map(site=>{const ref=refs[site.ordinal];return ref?after.slice(ref.start,ref.end):null;});
                if(tokens.every((token,index)=>token===family.sites[index].before))continue;
                if(!tokens.every((token,index)=>token===family.sites[index].after))return false;
                selected.push(family);
            }
            if(!selected.length||selected.length===moved.families.length)return false;
            const keys=new Set(selected.map(family=>family.key)),edits=moved.edits.filter(edit=>keys.has(edit.proof.key));
            return v219CitationLanguageNamedMoveSitesRetained(reference,after,moved,cfg,selected)&&same(v24SyntaxApply(reference,edits));
        };
        if(referenceSame(source))return pass;
        const bare=v219CitationLanguageBareReferencePlan(before,cfg);
        const bareSites=()=>{
            if(v219CitationLanguageBareReferenceSitesRetained(before,after,bare,null,cfg))return true;
            const named=v219CitationLanguageNamedMovePlan(before,cfg);
            return v219CitationLanguageBareReferenceSitesRetained(before,after,bare,named,cfg);
        };
        // A root anonymous URL/label can be checked at its own original call
        // site while separate, already certified native fields are formatted.
        // The language inventory and named-family proof below still apply.
        const literalBareSites=()=>{
            if(!cfg.references||!cfg.bareReferences||cfg.sectionOnly||Number(cfg.namespaceNumber??0)!==0||
                syntaxRepairPrefix(before,cfg).unresolved.length)return false;
            const original=v219NativeReferenceObserver(before),actual=v219NativeReferenceObserver(after);
            if(original.unclosed.length||actual.unclosed.length||original.empties.length||actual.empties.length||
                original.refs.length!==actual.refs.length)return false;
            return bare.edits.every(edit=>{
                const proof=edit.proof,ref=original.refs[proof?.referenceOrdinal],next=actual.refs[proof?.referenceOrdinal];
                if(proof?.kind!=='source-literal-reference-url-label'||proof.owner?.kind!=='root'||
                    proof.sourceHash!==bare.sourceHash||!ref||!next||!ref.valid||!next.valid||
                    !ref.attrs||!next.attrs||Object.keys(ref.attrs).some(key=>!['name','group'].includes(key))||
                    JSON.stringify(ref.attrs)!==JSON.stringify(next.attrs)||
                    ref.start!==proof.referenceStart||ref.end!==proof.referenceEnd||ref.body!==proof.body||
                    next.body!==edit.text||ref.container||next.container||
                    rendererRanges(original.view).filter(list=>list.end<=ref.start).length!==
                        rendererRanges(actual.view).filter(list=>list.end<=next.start).length)return false;
                const open=v24SyntaxTag(after,next.start),close=/<\/ref>$/.exec(after.slice(next.start,next.end)),
                    context=v219IndexedSyntaxContext(after,next.start);
                return !!open&&!!close&&after.slice(next.start,open.end)===proof.open&&close[0]===proof.close&&
                    !!context&&!Object.values(context).some(stack=>stack.length);
            });
        };
        if(bare.edits.length&&v219CitationLanguageBareReferenceProof(before,bare.text,bare,cfg)&&(bareSites()||literalBareSites())){
            const projected=v219CitationLanguageSource(bare.text,cfg);
            if(same(projected)||referenceSame(projected))return pass;
        }
        const nativeRead=value=>{
            if(cfg.sectionOnly||Number(cfg.namespaceNumber??0)!==0||cfg.contentModel&&cfg.contentModel!=='wikitext')return null;
            const recovery=syntaxRepairPrefix(value,cfg),partial=recovery.unresolved.length;
            if(partial&&(cfg.partialSyntaxRecovery===false||recovery.plan.text!==value||recovery.end<=0||recovery.end>=value.length))return null;
            const part=partial?value.slice(0,recovery.end):value,parsed=templates(protectedView(part)),references=v24SyntaxReferences(part),
                hard=[...v219MarkdownLiteralRanges(value),...v219QuotedTemplateRanges(value,false)],edits=[];
            if(parsed.unclosed.length||references.unclosed.length||!v219SyntaxContextIndex(part))return null;
            for(const node of parsed.nodes){
                if(hard.some(range=>range.start<node.end&&node.start<range.end))continue;
                const raw=part.slice(node.start,node.end),call=v219CitationLanguageCall(raw,cfg),fields=v2151FieldSyntaxParts(raw),p=parsedTemplate(raw);
                if(!call?.sourceLanguage||call.foreign||call.opaque||!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))continue;
                const language=fields.filter(field=>nativeCitationAccepts(p,field.key)&&v219NativeCitationRoles(field.key).includes('Language'));
                if(language.length!==1||JSON.stringify(v219NativeCitationRoles(language[0].key))!=='["Language"]'||fields.some(field=>norm(field.key)==='langue'))continue;
                const field=language[0],padding=/^([ \t\r\n]*)([\s\S]*?)([ \t\r\n]*)$/.exec(field.value),literal=padding[2],
                    code=V219_NATIVE_LANGUAGE_NAMES[literal.toLocaleLowerCase('pt')]||Object.values(V219_NATIVE_LANGUAGE_NAMES).includes(literal)&&literal,
                    context=v219IndexedSyntaxContext(part,node.start);
                if(!code||!context||context.templates.length||context.tables.length||context.links.length||context.external.length)continue;
                if(context.html.length){
                    if(context.html.length!==1||context.html[0].name!=='ref')continue;
                    const ref=references.refs.find(item=>item.start===context.html[0].start);
                    if(!ref||!ref.renderer.valid||ref.body===null||ref.container||!ref.close||!v29ReferenceTag(part,ref)||!ref.attrs||
                        Object.keys(ref.attrs).some(key=>!['name','group'].includes(key))||Object.values(ref.attrs).some(value=>
                            value!==value.trim()||/[{}\[\]<>&\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\ufeff\uE000-\uF8FF]/u.test(value))||
                        Object.values(ref.attrs).some(value=>value.includes('|'))&&!/^<ref(?:\s+(?:name|group)\s*=\s*(?:"[^"<>\r\n]*"|'[^'<>\r\n]*'))*\s*>$/i.test(ref.raw))continue;
                }
                const text=padding[1]+code+padding[3];if(text!==field.value)edits.push({start:node.start+field.start,end:node.start+field.end,text});
            }
            return {text:v24SyntaxApply(value,edits),changed:edits.length};
        },nativeSource=nativeRead(before),nativeActual=nativeRead(after);
        if(nativeSource?.changed&&nativeActual&&nativeSource.text===nativeActual.text)return pass;
        return {accepted:false,reason:'Uma citação perdeu o campo de idioma, o valor original ou os argumentos ignorados pela interface nativa.'};
    }
    // Protection-only family recognition; editing requires the existing exact bare certificate.
    // Table and geographic owners require the same fresh Source body certificate.
    function v219BareReferenceProducerFilter(source,cfg={}) {
        if(cfg.partialSyntaxRecovery===false&&syntaxRepairPrefix(source,cfg).unresolved.length)return ()=>false;
        const owners=templates(source).nodes.filter(node=>{
            const header=parsedTemplate(source.slice(node.start,node.end)).parts[0];
            return INFOBOX_CATALOG[v219ReaderNativeName(header)]?.oldid===72297344;
        }),tables=v272LiteralTables(source).tables,unclosedTables=v24SyntaxScan(source).tables;
        let certificate=null;
        const certified=(ref,kind,parent=null)=>{
            if(certificate===null){
                const plan=v219CitationLanguageBareReferencePlan(source,cfg);
                certificate=v219CitationLanguageBareReferenceProof(source,plan.text,plan,cfg)?
                    {plan,refs:refTokens(protectedView(source))}:false;
            }
            if(!certificate)return false;
            return certificate.plan.edits.some(edit=>{
                const proof=edit.proof,original=certificate.refs[proof?.referenceOrdinal];
                return proof?.kind==='source-literal-reference-url-label'&&proof.sourceHash===certificate.plan.sourceHash&&
                    proof.referenceStart===ref.start&&proof.referenceEnd===ref.end&&original?.start===ref.start&&
                    original.end===ref.end&&original.body===ref.body&&proof.body===ref.body&&edit.start===ref.openEnd&&
                    proof.owner?.kind===kind&&(!parent||proof.owner.start===parent.start&&
                    proof.owner.end===parent.end&&proof.owner.raw===source.slice(parent.start,parent.end));
            });
        };
        return ref=>{
            const context=v219IndexedSyntaxContext(source,ref.start),tableOwned=
                tables.some(table=>table.start<ref.start&&ref.end<=table.end)||
                unclosedTables.some(start=>start<ref.start)||context?.tables.length||
                context?.html.some(tag=>['table','tr','td','th','thead','tbody','tfoot'].includes(tag.name));
            if(tableOwned)return certified(ref,'native-wikitable-cell');
            const parent=owners.find(node=>node.start<ref.start&&ref.end<=node.end);
            if(!parent)return v219CitationLanguageBareOwner(source,ref)?.kind==='root'&&certified(ref,'root');
            const header=parsedTemplate(source.slice(parent.start,parent.end)).parts[0];
            if(!v219OriginalTemplateHeaderAllowed(header))return false;
            return certified(ref,'native-geographic-population',parent);
        };
    }
    // Same-source, family-local topology authority. Attribute-only normalization stays legacy.
    function v219NamedReferenceTopologyFilter(source,cfg={}) {
        let certified=null;
        return family=>{
            if(!Array.isArray(family)||!family.length)return false;
            const definitions=family.filter(ref=>ref.body!==null&&ref.body.trim()),first=family[0],definition=definitions[0];
            if(!definition)return false;
            if(definitions.some(ref=>/[\uE000-\uF8FF]/u.test(ref.body)))return false;
            const keeper=cfg.moveNamedRefs&&first.start<definition.start?first:definition;
            // Masked unknown/protected source is still an expansion barrier, not erased authority.
            if(definitions.some(ref=>ref!==keeper&&/[\uE000-\uF8FF]/u.test(source.slice(keeper.end,ref.start))))return false;
            if(certified===null){
                const plan=v219CitationLanguageNamedMovePlan(source,cfg);
                certified=plan.edits.length&&v219CitationLanguageNamedMoveProof(source,plan.text,plan,cfg)?
                    {families:new Map(plan.families.map(proof=>[proof.key,proof])),refs:v219NativeReferenceObserver(source).refs}:false;
            }
            if(!certified)return false;
            const proof=certified.families.get(JSON.stringify([first.a.group||'',first.a.name]));
            return !!proof&&proof.sites.length===family.length&&family.every((ref,index)=>
                certified.refs[proof.sites[index].ordinal]?.start===ref.start&&
                certified.refs[proof.sites[index].ordinal].end===ref.end&&
                ref.raw===source.slice(ref.start,ref.end)&&proof.sites[index].before===ref.raw);
        };
    }

    // C keeps its literal marker topology. This additional certificate concerns
    // only a keeper's five directly proved native CS1 call bodies.
    function v219CitationLanguageKeeperCall(raw) {
        if(typeof raw!=='string')return null;
        const match=/^([ \t\r\n]*)(\{\{[\s\S]*\}\})([ \t\r\n]*)$/.exec(raw);
        if(!match)return null;
        const call=match[2],parsed=parsedTemplate(call),profile=TEMPLATE_CATALOG[parsed.name],
            profiles={'citar web':48262420,'citar livro':48159689,'citar jornal':55834874,
                'citar periódico':48090957,'citar revista':68628855,citation:62525251},nodes=templates(call);
        if(!Object.hasOwn(profiles,parsed.name)||profile?.oldid!==profiles[parsed.name]||
            !v219OriginalTemplateHeaderAllowed(parsed.parts[0])||!v215SameTemplateTitle(parsed.parts[0],profile.title)||
            !v219NativeCitationStateInterface(call)||parsed.name==='citation'&&!v219NativeCitationCS1Consumer(call)||
            nodes.unclosed.length||nodes.nodes.length!==1||
            !profile.dependencies?.some(row=>row.title==='Módulo:Citação/CS1/Configuração'&&row.oldid===73016847)||
            !profile.dependencies.some(row=>row.title==='Módulo:Citação/CS1/Whitelist'&&row.oldid===71860752))return null;
        const fields=v2151FieldSyntaxParts(call);
        if(!fields?.length||fields.some(field=>field.key!==field.plain||field.separator!=='='))return null;
        return {raw,call,parsed,profile,fields,lead:match[1],tail:match[3]};
    }
    function v219CitationLanguageKeeperScalar(before,after,cfg={}) {
        const source=v219CitationLanguageKeeperCall(before),actual=v219CitationLanguageKeeperCall(after);
        if(!source||!actual||source.profile.oldid!==actual.profile.oldid||source.lead!==actual.lead||source.tail!==actual.tail||
            source.fields.length!==actual.fields.length)return null;
        // A single proved Date month-initial repair is not a global Date read.
        // Require the complete existing date writer to reach this exact call.
        if(cfg.dates!==false&&cfg.automaticCitationDateValues!==false){
            let dateField=null,dateIndex=-1,dateCount=0;
            for(let index=0;index<source.fields.length;index++){
                const field=source.fields[index],roles=v219NativeCitationRoles(field.key);
                if(nativeCitationAccepts(source.parsed,field.key)&&roles.includes('Date')){
                    dateCount++;if(roles.length===1){dateField=field;dateIndex=index;}
                }
            }
            const monthCase=dateCount===1&&dateField&&
                /^([ \t\r\n]*(?:[1-9]\d? de )?)([A-Z][a-zç]+)( de [1-9]\d{3}[ \t\r\n]*)$/.exec(dateField.value);
            if(monthCase){
                const month=monthCase[2][0].toLowerCase()+monthCase[2].slice(1),
                    value=monthCase[1]+month+monthCase[3],next=actual.fields[dateIndex];
                if(Object.values(MONTH_PT).includes(month)&&next?.key===dateField.key&&next.value===value){
                    const left=v218CitationDateValue(dateField.value,'date'),right=v218CitationDateValue(value,'date'),
                        date=v218CitationDatePlan(source.call,cfg),edit=date.edits[0];
                    const authored=source.lead+date.text+source.tail;
                    if(left&&right&&['day','month'].includes(left.precision)&&left.precision===right.precision&&
                        JSON.stringify(left.identity)===JSON.stringify(right.identity)&&date.edits.length===1&&
                        edit.start===dateField.start&&edit.end===dateField.end&&edit.text===value&&
                        date.text===v24SyntaxApply(source.call,[{start:dateField.start,end:dateField.end,text:value}])&&
                        v218CitationDateProof(source.call,date.text,date,cfg)&&
                        JSON.stringify(v219StageSafeEdits(source.call,date.edits,'v218-citation-date-values',cfg))===JSON.stringify(date.edits))
                        return authored===after?authored:v219CitationLanguageKeeperScalar(authored,after,
                            {...cfg,automaticCitationDateValues:false});
                }
            }
        }
        const edge=value=>value.replace(/\r?\n[ \t]*$/,''),edits=[],flat=cfg.singleLineCitations&&!/[\r\n]/.test(actual.call);
        if(source.parsed.parts[0]!==actual.parsed.parts[0]){
            if(!flat||edge(source.parsed.parts[0])!==actual.parsed.parts[0])return null;
            edits.push({start:2,end:2+source.parsed.parts[0].length,text:actual.parsed.parts[0]});
        }
        let sourceEnd=2+source.parsed.parts[0].length,actualEnd=2+actual.parsed.parts[0].length;
        for(let index=0;index<source.fields.length;index++){
            const field=source.fields[index],next=actual.fields[index];
            if(field.key!==next.key||source.call.slice(sourceEnd,field.start)!==actual.call.slice(actualEnd,next.start))return null;
            sourceEnd=field.end;actualEnd=next.end;
            if(field.value===next.value)continue;
            const roles=v219NativeCitationRoles(field.key),role=roles.length===1?roles[0]:null,
                literal=value=>{const core=value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
                    return !!core&&!/[{}\[\]<>&\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\uFEFF\uE000-\uF8FF]/u.test(core);};
            if(flat&&roles.length&&nativeCitationAccepts(source.parsed,field.key)&&
                edge(field.value)===next.value&&literal(field.value)&&literal(next.value)&&
                v219CitationLanguageNativeFieldValue(field,source.parsed,source.fields,true)===
                    v219CitationLanguageNativeFieldValue(next,actual.parsed,actual.fields,true)){
                edits.push({start:field.start,end:field.end,text:edge(field.value)});continue;
            }
            if(!role||!nativeCitationAccepts(source.parsed,field.key)||norm(field.key)==='langue'||
                source.fields.filter(row=>nativeCitationAccepts(source.parsed,row.key)&&v219NativeCitationRoles(row.key).includes(role)).length!==1||
                !literal(field.value)||!literal(next.value)||
                /[\r\n]/.test(field.value+next.value)&&!flat)return null;
            const value=v219CitationLanguageNativeFieldValue(field,source.parsed,source.fields,true),
                retained=v219CitationLanguageNativeFieldValue(next,actual.parsed,actual.fields,true);
            if(value!==retained)return null;
            edits.push({start:field.start,end:field.end,text:value});
        }
        if(source.call.slice(sourceEnd)!==actual.call.slice(actualEnd)||!edits.length)return null;
        return source.lead+v24SyntaxApply(source.call,edits)+source.tail;
    }
    // This is the explicit original URL/timestamp decomposition, not a replay of
    // citation/extendedCitation or a guess from the candidate's new parameters.
    function v219CitationLanguageKeeperArchive(raw,cfg={}) {
        const source=v219CitationLanguageKeeperCall(raw);
        if(!source||!cfg.citations||!v219CitationArchiveDecompositionAllowed(source.call,cfg))return null;
        const urls=source.fields.filter(field=>nativeCitationAccepts(source.parsed,field.key)&&
            JSON.stringify(v219NativeCitationRoles(field.key))==='["URL"]');
        if(urls.length!==1)return null;
        const field=urls[0],value=field.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,''),
            match=/^https?:\/\/web\.archive\.org\/web\/(\d{8})(?:\d{6})?(?:id_|if_)?\/(https?:\/\/[^\s{}<>]+)$/i.exec(value);
        if(!match||!v213LiteralURL(value)||!v213LiteralURL(match[2])||
            !validDate(Number(match[1].slice(6)),Number(match[1].slice(4,6)),Number(match[1].slice(0,4))))return null;
        const call=v24SyntaxApply(source.call,[{start:field.start,end:field.end,text:match[2]}]),
            date=match[1].slice(0,4)+'-'+match[1].slice(4,6)+'-'+match[1].slice(6);
        return source.lead+call.slice(0,-2)+'|arquivourl='+value+'|arquivodata='+date+'}}'+source.tail;
    }
    function v219CitationLanguageKeeperBodyRetained(before,after,plan,site,next,cfg={}) {
        if(!cfg.references||cfg.sectionOnly||Number(cfg.namespaceNumber??0)!==0||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||
            !v219CitationLanguageNamedMoveProof(before,plan.text,plan,cfg))return false;
        const family=plan.families.find(row=>row.keeper===site.ordinal),
            member=family?.sites.find(row=>row.ordinal===site.ordinal),
            actual=v219NativeReferenceObserver(after).refs[site.ordinal];
        if(!member||JSON.stringify(member)!==JSON.stringify(site)||!actual||
            next.start!==actual.start||next.end!==actual.end||next.raw!==actual.raw||next.body!==actual.body||
            next.group!==actual.group||JSON.stringify(next.attrs)!==JSON.stringify(actual.attrs))return false;
        const expected=/^(<ref[^>]*>)([\s\S]*)(<\/ref>)$/.exec(site.after),
            current=/^(<ref[^>]*>)([\s\S]*)(<\/ref>)$/.exec(after.slice(next.start,next.end));
        if(!family||!expected||!current||expected[1]!==current[1]||expected[3]!==current[3]||
            !v219CitationLanguageNamedMoveBody(expected[2])||!v219CitationLanguageNamedMoveBody(current[2]))return false;
        const refs=v219NativeReferenceObserver(before).refs,original=refs[site.ordinal];
        if(!original)return false;
        const permit=body=>{
            const text=expected[1]+body+expected[3],proposed=plan.edits.filter(edit=>edit.start!==original.start),
                edit={start:original.start,end:original.end,text,ruleId:'citationParameters',
                    proof:{kind:'source-native-keeper-body',sourceHash:plan.sourceHash,ordinal:site.ordinal,keeper:family.keeper}};
            proposed.push(edit);proposed.sort((a,b)=>a.start-b.start||a.end-b.end);
            return JSON.stringify(v219StageSafeEdits(before,proposed,'citation-language-named-keeper-source',cfg))===JSON.stringify(proposed);
        };
        if(cfg.citations&&cfg.multilingual){
            const redirect=v219LocalCitationRedirectProfile(expected[2]),header=v219ReaderLiteralHeader(expected[2]);
            if(redirect&&header!==null&&/^[ \tA-Za-z_]+$/.test(header)&&V219_NATIVE_CITATION_REDIRECTS.some(alias=>
                alias.oldid===redirect.nativeAliasOldid&&alias.target===norm(redirect.target)&&v215SameTemplateTitle(header,alias.title))){
                const padding=/^([ \t]*)([\s\S]*?)([ \t]*)$/.exec(header),
                    body='{{'+padding[1]+redirect.target+padding[3]+expected[2].slice(2+header.length);
                if(body===current[2]&&permit(body))return true;
            }
        }
        const scalar=v219CitationLanguageKeeperScalar(expected[2],current[2],cfg);
        if(scalar!==null&&permit(scalar))return true;
        // Compose a complete-call native body certificate, never a whole-source projection.
        // Family/site identity above and the exact Source stage permission remain mandatory.
        if(cfg.dates){
            const full=v219CitationLanguageKeeperCall(expected[2]),changed=v219CitationLanguageKeeperCall(current[2]),
                owner=v219IndexedSyntaxContext(after,next.start);
            if(full&&changed&&full.profile.oldid===changed.profile.oldid&&full.fields.length===changed.fields.length&&
                full.lead===changed.lead&&full.tail===changed.tail&&owner&&!owner.templates.length&&!owner.html.length&&
                !owner.tables.length&&!owner.links.length&&!owner.external.length){
                for(let index=0;index<full.fields.length;index++){
                    const field=full.fields[index],value=changed.fields[index],roles=v219NativeCitationRoles(field.key);
                    if(field.value===value.value||field.key!==value.key||!nativeCitationAccepts(full.parsed,field.key)||
                        roles.length!==1||!['Date','AccessDate','ArchiveDate'].includes(roles[0])||
                        !/^[ \t\r\n]*(?:1[3-9]|2\d|3[01])([/-])\d{1,2}\1[1-9]\d{3}[ \t\r\n]*$/.test(field.value))continue;
                    let count=0;
                    for(const other of full.fields)if(v219NativeCitationRoles(other.key).includes(roles[0]))count++;
                    if(count!==1||full.lead+v24SyntaxApply(full.call,[{start:field.start,end:field.end,text:value.value}])+full.tail!==current[2])continue;
                    const framed='<ref>'+full.call+'</ref>',certified=v219PartialNativeFieldSource(framed,cfg);
                    if(certified!==framed&&certified==='<ref>'+changed.call+'</ref>'&&permit(current[2]))return true;
                }
            }
        }
        const people=v219CitationLanguageKeeperPeople(expected[2],cfg);
        if(people!==null&&permit(people)&&(people===current[2]||
            v219CitationLanguageKeeperScalar(people,current[2],cfg)!==null))return true;
        const archive=v219CitationLanguageKeeperArchive(expected[2],cfg);
        if(archive===null||!permit(archive))return false;
        const alternatives=[archive],projected=plan.text,observed=v219NativeReferenceObserver(projected),keeper=observed.refs[site.ordinal];
        if(!keeper||keeper.body===null||keeper.body!==expected[2])return false;
        const open=v24SyntaxTag(projected,keeper.start),close=/<\/ref>$/.exec(projected.slice(keeper.start,keeper.end));
        if(!open||!close)return false;
        const base=v24SyntaxApply(projected,[{start:open.end,end:keeper.end-close[0].length,text:archive}]),
            date=v218CitationDatePlan(base,cfg);
        if(date.edits.length&&v218CitationDateProof(base,date.text,date,cfg)&&
            JSON.stringify(v219StageSafeEdits(base,date.edits,'v218-citation-date-values',cfg))===JSON.stringify(date.edits)){
            const dated=v219NativeReferenceObserver(date.text).refs[site.ordinal];
            if(dated?.body!==null&&dated?.attrs?.name===next.attrs?.name&&dated?.group===next.group)alternatives.push(dated.body);
        }
        return alternatives.some(body=>body===current[2]||v219CitationLanguageKeeperScalar(body,current[2],cfg)!==null);
    }

    // Read one anonymous ref in a fully parsed literal wikitable data cell.
    // Only content spans are hidden from the raw structural comparison.
    function v219CitationLanguageBareTableOwner(source,ref) {
        if(typeof source!=='string'||source.length>4194304||!ref||ref.body===null||
            !Number.isInteger(ref.start)||!Number.isInteger(ref.end)||!Number.isInteger(ref.openEnd)||
            !/^<ref[ \t]*>$/.test(source.slice(ref.start,ref.openEnd)))return null;
        const context=v219IndexedSyntaxContext(source,ref.start);
        if(!context||context.tables.length!==1||context.templates.length||context.html.length||
            context.links.length||context.external.length)return null;
        const tables=v272LiteralTables(source).tables,index=tables.findIndex(table=>table.start===context.tables[0]&&
            table.openEnd<=ref.start&&ref.end<=table.closeStart),table=tables[index];
        if(!table||table.nested||!table.attrs.valid||source.slice(table.start,table.start+2)!=='{|'||
            !table.attrs.attrs.some(attr=>attr.key==='class'&&/\bwikitable\b/.test(attr.value||''))||
            table.attrs.attrs.some(attr=>!V29_TABLE_ATTRIBUTES.table.has(attr.key)||
                attr.key==='class'&&/\b(?:infobox|navbox|toc)\b/.test(attr.value||'')||
                attr.key==='role'&&['presentation','none'].includes((attr.value||'').toLowerCase())))return null;
        const outer=v219IndexedSyntaxContext(source,table.start),model=v29TableModel(source,table);
        if(!outer||Object.values(outer).some(stack=>stack.length)||!model||model.captions.length)return null;
        const spans=[];let selected=null;
        for(const [rowIndex,row]of model.rows.entries())for(const [cellIndex,cell]of row.cells.entries()){
            // The legacy model stores only the first physical line's end.
            // Continuations belong to the last cell until the next row/closer.
            const end=cellIndex+1<row.cells.length?cell.end:(model.rows[rowIndex+1]?.start??table.closeStart),
                contentStart=cell.attrsEnd===null?cell.start:cell.attrsEnd+1;
            if(cell.start<table.openEnd||contentStart<cell.start||end<contentStart||end>table.closeStart)return null;
            spans.push({start:contentStart,end,text:'@@cell('+rowIndex+','+cellIndex+')@@'});
            if(contentStart<=ref.start&&ref.end<=end){
                if(selected||cell.kind!=='|')return null;
                selected={start:cell.start,end,contentStart,rowIndex,cellIndex};
            }
        }
        spans.sort((a,b)=>a.start-b.start);
        if(!selected||spans.some((span,at)=>at&&span.start<spans[at-1].end)||
            v29TablePrepared(source).dynamic.some(range=>range.start<selected.end&&selected.start<range.end))return null;
        const structure=v24SyntaxApply(source.slice(table.start,table.end),spans.map(span=>({
            start:span.start-table.start,end:span.end-table.start,text:span.text})));
        if(/[^\t\r\n\x20-\x7E]/.test(structure))return null;
        return {kind:'native-wikitable-cell',start:selected.start,end:selected.end,
            raw:source.slice(selected.start,selected.end),tableIndex:index,rowIndex:selected.rowIndex,
            cellIndex:selected.cellIndex,structure};
    }

    // Source-only person-link decomposition for the retained named keeper.
    // The original native people predicate remains the alias/precedence owner.
    function v219CitationLanguageKeeperPeople(raw,cfg={}) {
        if(!cfg.citations||!cfg.authors)return null;
        const source=v219CitationLanguageKeeperCall(raw);
        // Read the existing semicolon-separated native person list. Every
        // unrelated argument, including ignored fields, stays byte-identical.
        if(source&&new Set(source.fields.map(field=>field.key)).size===source.fields.length&&
            !source.fields.some(field=>v219NativeCitationRoles(field.key).includes('Ref')||
                /[{}<>\p{Cc}\p{Cf}\p{Co}]/u.test(field.value))){
            const entries=templateEntries(source.parsed);
            for(const field of source.fields){
                if(!['autor','editor'].includes(field.key)||!nativeCitationAccepts(source.parsed,field.key)||
                    !field.value.includes(';')||/[{}<>\[\]\p{Cc}\p{Cf}\p{Co}]/u.test(field.value))continue;
                const entry=entries.find(item=>item.key===field.key),
                    names=field.value.trim().split(/\s*;\s*/);
                if(!entry||names.length<2||names.length>20||!names.every(name=>personalAuthorName(name,true))||
                    !v219CitationPeopleSplitAllowed(source.call,cfg,entries,entry,field.key)||
                    names.slice(1).some((name,index)=>!nativeCitationAccepts(source.parsed,field.key+(index+2))))continue;
                const call=v24SyntaxApply(source.call,[{start:field.start,end:field.end,text:field.value.match(/^[ \t]*/)[0]+names[0]}]);
                return source.lead+call.slice(0,-2)+names.slice(1).map((name,index)=>'|'+field.key+(index+2)+'='+name).join('')+'}}'+source.tail;
            }
        }
        if(!source||source.fields.some(field=>!nativeCitationAccepts(source.parsed,field.key)||
            v219NativeCitationRoles(field.key).includes('Ref'))||
            new Set(source.fields.map(field=>field.key)).size!==source.fields.length)return null;
        const entries=templateEntries(source.parsed);
        if(entries.length!==source.fields.length||entries.some((entry,index)=>
            entry.index!==index+1||entry.key!==source.fields[index].key||entry.value!==source.fields[index].value.replace(/^[ \t]+/,'')))return null;
        const linked=[];
        for(const [index,field]of source.fields.entries()){
            const who=norm(field.key).match(/^(autor|editor|tradutor)(\d*)$/),
                link=/^\[\[([^|\[\]#]+)(?:\|([^\[\]]+))?\]\]$/.exec(field.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,''));
            if(!who||!link)continue;
            if(/[{}<>&\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\ufeff\uE000-\uF8FF]/u.test((link[1]+(link[2]||'')).replace(/ & /g,'   '))||
                !v219CitationPeopleLinkAllowed(source.call,cfg,entries,entries[index],who,link))return null;
            linked.push({field,who,link});
        }
        if(linked.length!==1)return null;
        const {field,who,link}=linked[0],key=(who[1]==='tradutor'?'tradutor-link':who[1]+'link')+who[2],
            existing=source.fields.find(row=>norm(row.key)===key),
            call=v24SyntaxApply(source.call,[{start:field.start,end:field.end,text:field.value.match(/^[ \t]*/)[0]+(link[2]||link[1])}]);
        return source.lead+(existing?call:call.slice(0,-2)+'|'+key+'='+link[1]+'}}')+source.tail;
    }

    // Generating a free name needs a closed Source expansion scope.
    // Unknown emitters cause silent refusal, leaving every original body intact.
    function v219AnonymousReferenceGenerationAllowed(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!cfg.references||!cfg.automaticIdenticalReferences||
            cfg.sectionOnly||Number(cfg.namespaceNumber??0)!==0||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.model&&cfg.model!=='wikitext'||
            /\{\{\{|[\uE000-\uF8FF]/u.test(source)||/<\s*\/?\s*(?!ref(?:erences)?\b)[A-Za-z]/i.test(source))return false;
        const observed=v219NativeReferenceObserver(source),shield=v24SyntaxProtected(source),
            reservation=v219ReferenceNameReservation(source,cfg);
        const lead=shield.ranges.length===1?shield.ranges[0]:null,
            plainLead=lead?.kind==='quotation-markup'&&lead.start===source.search(/\S/u)&&
                /^'''[\p{L}\p{N}][^'"\[\]{}<>&\p{Cc}\p{Cf}\p{Co}\p{Zl}\p{Zp}]{0,219}'''$/u.test(source.slice(lead.start,lead.end))&&
                observed.refs.every(ref=>ref.end<=lead.start||ref.start>=lead.end)&&
                rendererRanges(observed.view).every(range=>range.end<=lead.start||range.start>=lead.end);
        if(observed.unclosed.length||observed.empties.length||observed.helpers.length||shield.ranges.length&&!plainLead||
            shield.unclosed.length||observed.refs.some(ref=>!ref.valid||!ref.attrs||
                Object.keys(ref.attrs).some(key=>!['name','group'].includes(key))||
                !v24SyntaxLiteralIdentity(ref.attrs))||reservation.dynamic||reservation.names.some(name=>
                typeof name!=='string'||/[&{}<>\[\]|\u0000-\u001f\u007f-\u009f]/u.test(name)||
                v219UncertainReferenceIdentity(name)))return false;
        const nodes=templates(observed.view).nodes,collectors=rendererRanges(observed.view).filter(range=>{
            const raw=source.slice(range.start,range.end);if(!raw.startsWith('{{'))return false;
            const parsed=parsedTemplate(raw),native=v219BankBaseNativeCollectorGroups(raw),fields=foreignEntries(parsed),seen=new Set();
            return v219NativeReferenceCollectorAlias(parsed.parts[0])&&
                v219OriginalTemplateHeaderAllowed(parsed.parts[0])&&native.recognized&&!native.ambiguous&&
                fields.every(field=>{
                    if(seen.has(field.key)||!['1','colunas','grupo'].includes(field.key))return false;
                    seen.add(field.key);
                    const value=field.value.trim();
                    return field.key==='grupo'?(value===''||v29ReferenceName(value)&&!v219UncertainReferenceIdentity(value)):
                        /^(?:[1-9]|10)$/.test(value);
                });
        }).sort((a,b)=>a.start-b.start),intervals=[];
        let start=0;
        for(const collector of collectors){
            if(collector.start<start)return false;
            intervals.push({start,end:collector.start});start=collector.end;
        }
        intervals.push({start,end:source.length});
        return v219CitationLanguageNamedMoveCrossingSafe(source,observed.refs,nodes,intervals);
    }

    // Certify only the original name/group values and native opening spelling.
    // Definition/call state stays exact. Changed full bodies need the existing
    // independent native scalar or literal people-link certificate.
    function v219CitationLanguageOpeningsRetained(before,after,options={}) {
        const cfg={...DEFAULTS,...options};
        if(typeof before!=='string'||typeof after!=='string'||before.length>4194304||after.length>4194304||
            !cfg.references||cfg.sectionOnly||Number(cfg.namespaceNumber??0)!==0||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.model&&cfg.model!=='wikitext')return false;
        const sources=[before,after],observed=sources.map(source=>v219NativeReferenceObserver(source)),edits=[];
        if(observed.some(value=>value.unclosed.length||value.empties.length)||
            observed[0].refs.length!==observed[1].refs.length)return false;
        const renderers=observed.map(value=>rendererRanges(value.view)),tables=sources.map(source=>v272LiteralTables(source).tables),
            indexes=tables.map(value=>new Map(value.map((table,index)=>[table.start,index]))),
            bindings=sources.map(source=>v219ReferenceBindingState(source,cfg,true));
        if(JSON.stringify([bindings[0].collectorGroups,bindings[0].opaqueCollectors])!==
            JSON.stringify([bindings[1].collectorGroups,bindings[1].opaqueCollectors]))return false;
        const context=(index,ref)=>{
            const source=sources[index],state=v219IndexedSyntaxContext(source,ref.start);
            if(!state||state.templates.length||state.html.length||state.links.length||state.external.length||state.tables.length>1)return null;
            let owner=[-1,-1,-1];
            if(state.tables.length){
                const at=indexes[index].get(state.tables[0]),table=tables[index][at],model=table&&v29TableModel(source,table),found=[];
                if(!model)return null;
                for(const [rowIndex,row]of model.rows.entries())for(const [cellIndex,cell]of row.cells.entries()){
                    const start=cell.attrsEnd===null?cell.start:cell.attrsEnd+1,
                        end=cellIndex+1<row.cells.length?cell.end:(model.rows[rowIndex+1]?.start??table.closeStart);
                    if(start<=ref.start&&ref.end<=end)found.push([at,rowIndex,cellIndex]);
                }
                if(found.length!==1)return null;owner=found[0];
            }
            return [ref.group,renderers[index].filter(range=>range.end<=ref.start).length,...owner];
        };
        for(const [ordinal,ref]of observed[0].refs.entries()){
            const next=observed[1].refs[ordinal],open=v24SyntaxTag(before,ref.start),actual=v24SyntaxTag(after,next.start);
            if(!open||!actual||(ref.body===null)!==(next.body===null))return false;
            if(open.raw===actual.raw)continue;
            const attrs=ref.attrs,keys=attrs&&Object.keys(attrs);
            if(!attrs||!next.attrs||!ref.renderer.valid||!next.renderer.valid||ref.container||next.container||
                keys.some(key=>!['name','group'].includes(key))||Object.keys(next.attrs).length!==keys.length||
                !v24SyntaxLiteralIdentity(attrs,true)||keys.some(key=>!attrs[key]||!v29ReferenceName(attrs[key])||
                    v219UncertainReferenceIdentity(attrs[key])||next.attrs[key]!==attrs[key])||
                ref.body!==null&&ref.close?.raw!==next.close?.raw)return false;
            const expected='<ref'+(attrs.name?' name="'+attrs.name+'"':'')+(attrs.group?' group="'+attrs.group+'"':'')+
                (ref.body===null?' />':'>'),left=context(0,ref),right=context(1,next);
            if(actual.raw!==expected||!left||!right||JSON.stringify(left)!==JSON.stringify(right))return false;
            edits.push({start:ref.start,end:open.end,text:expected,ruleId:'refAttributes',
                proof:{kind:'source-native-reference-opening',sourceHash:v24SyntaxHash(before),ordinal,
                    attrs:{...attrs},self:ref.body===null,context:left}});
            if(ref.body!==null&&ref.body!==next.body){
                let body=v219CitationLanguageKeeperScalar(ref.body,next.body,cfg);
                if(body!==next.body){
                    const people=v219CitationLanguageKeeperPeople(ref.body,cfg);
                    body=people===next.body?people:people===null?null:
                        v219CitationLanguageKeeperScalar(people,next.body,cfg);
                }
                if(body!==next.body)return false;
                edits.push({start:open.end,end:ref.close.start,text:body,ruleId:'citationParameters',
                    proof:{kind:'source-native-reference-opening-body-composition',sourceHash:v24SyntaxHash(before),
                        ordinal,body:ref.body,attrs:{...attrs},context:left}});
            }
        }
        return edits.length>0&&JSON.stringify(v219StageSafeEdits(before,edits,'citation-language-reference-openings',cfg))===JSON.stringify(edits);
    }

    // Source-only role projection. No target or raw inventory is normalized.
    const v219CitationLanguageScriptTitleSource=(source,cfg)=>{
        if(typeof source!=='string'||!/[|][ \t]*(?:script-title|titulo-translit)[ \t]*=/.test(source))return source;
        const plan=v218CitationIslandPlan(source,cfg);
        if(!plan.edits.length||!v218CitationIslandProof(source,plan.text,plan,cfg))return source;
        const edits=[],aliases=V219_NATIVE_CS1_ALIAS_ROLES.ScriptTitle;
        for(const edit of plan.edits){
            const proof=edit.proof,raw=proof?.before,context=raw&&v219NormalizedNativeCitationContext(raw),
                fields=raw&&v2151FieldSyntaxParts(raw);
            if(edit.ruleId!=='citationParameters'||proof?.segment?.kind!=='complete-prefix'||
                !context||!v219SourceNativeContract(raw,context)||!fields||
                fields.some(field=>field.key!==field.plain||field.separator!=='=')||
                !context.profile.dependencies?.some(row=>row.title==='Módulo:Citação/CS1/Configuração'&&row.oldid===73016847)||
                !context.profile.dependencies.some(row=>row.title==='Módulo:Citação/CS1/Whitelist'&&row.oldid===71860752))continue;
            const scripts=fields.filter(field=>aliases.some(alias=>norm(alias)===norm(field.key)));
            if(scripts.length!==1)continue;
            const field=scripts[0];
            if(!nativeCitationAccepts(context.native,field.key)||JSON.stringify(v219NativeCitationRoles(field.key))!=='["ScriptTitle"]'||
                edit.text!==aliases[0]||!nativeCitationAccepts(context.native,edit.text)||
                JSON.stringify(v219NativeCitationRoles(edit.text))!=='["ScriptTitle"]'||
                !field.value.trim()||field.value.length>4096||/[{}\[\]<>\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\uE000-\uF8FF]/u.test(field.value))continue;
            const bodyStart=proof.referenceStart+proof.opening.length,
                body=source.slice(bodyStart,proof.referenceEnd-proof.closing.length),
                start=bodyStart+body.length-body.trimStart().length+field.keyStart,
                afterFields=v2151FieldSyntaxParts(proof.after),next=afterFields?.filter(row=>aliases.some(alias=>norm(alias)===norm(row.key)));
            if(body.trim()!==raw||edit.start!==start||edit.end!==start+field.key.length||
                source.slice(edit.start,edit.end)!==field.key||!next||next.length!==1||
                next[0].key!==edit.text||next[0].value!==field.value)continue;
            edits.push(edit);
        }
        return edits.length&&JSON.stringify(v219StageSafeEdits(source,edits,'citation-language-script-title-source',cfg))===JSON.stringify(edits)?
            v24SyntaxApply(source,edits):source;
    };
