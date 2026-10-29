    // Repairs are derived from literal native citation consumers. Values are
    // retained unless a finite, checked representation is being restored.
    const V2212_CITATION_CONTRACT=Object.freeze({
        cs1:72936771,configuration:73016847,whitelist:71860752,identifiers:73016812,
        musicNotes:46752105,listanotaUA:59087952,nreUA:68063303,references:63785697
    });
    function v2212CitationScope(source,cfg={}) {
        return v221CitationScope(source,cfg)&&cfg.citations!==false&&cfg.citationRepairs!==false&&
            cfg.references!==false&&cfg.automaticReferenceRepairs!==false&&cfg.v2212CitationRepairs!==false&&
            (cfg.section===undefined||cfg.section===null||cfg.section==='')&&!cfg.redirectPage&&!cfg.disambiguationPage;
    }
    function v2212CitationContext(raw) {
        const context=v218CitationNativeContext(raw),fields=v220CitationFields(raw);
        if(!context||!fields)return null;
        const dependencies=context.profile.dependencies||[];
        if(!dependencies.some(x=>x.title==='Módulo:Citação/CS1/Configuração'&&x.oldid===73016847)||
            !dependencies.some(x=>x.title==='Módulo:Citação/CS1/Whitelist'&&x.oldid===71860752))return null;
        return {...context,fields};
    }
    function v2212CitationRoles(fields,role) {
        return fields.filter(f=>!f.positional&&v219NativeCitationRoles(f.key).some(x=>x===role||x.startsWith(role+':')));
    }
    function v2212CitationOnly(fields,role) {
        const matches=v2212CitationRoles(fields,role);return matches.length===1?matches[0]:null;
    }
    function v2212CitationPlain(value,maximum=8192) {
        return typeof value==='string'&&value.trim()&&value.length<=maximum&&
            !/[{}<>\u0000-\u0008\u000b\u000c\u000e-\u001f\uE000-\uF8FF]/.test(value);
    }
    function v2212CitationProtected(source,start,end,context) {
        return context.protected.some(r=>r.start<end&&start<r.end);
    }
    function v2212CitationSourceContext(source) {
        const shield=v24SyntaxProtected(source),view=protectedView(source);
        return {view,nodes:templates(view).nodes,refs:refTokens(view),
            protected:[...shield.ranges,...v219MarkdownLiteralRanges(source),...v219QuotedTemplateRanges(source,false),
                ...v219WholeQuotedCodeRanges(source),...structuralQuoteRanges(source)],
            strict:v221CitationSourceContext(source)};
    }
    function v2212CitationStrictOwner(source,node,context) {
        if(context.strict.literals.some(r=>r.start<=node.start&&r.end>=node.end))return false;
        const state=v24SyntaxContext(context.view,node.start);
        if(state.templates.length||state.links.length||state.external.length||state.html.length>1||
            state.html.some(t=>t.name!=='ref')||source.lastIndexOf('<',node.start-1)>source.lastIndexOf('>',node.start-1))return false;
        if(state.html.length){
            const tag=state.html[0],attrs=v24SyntaxAttrs(tag.attrs);
            if(!v24SyntaxLiteralIdentity(attrs)||!context.refs.some(r=>r.start===tag.start&&r.body!==null&&r.end>=node.end&&/<\/ref[ \t]*>$/i.test(r.raw)))return false;
        }
        // Reuse the complete baseline table/cell ownership proof unchanged.
        return state.tables.length?v221CitationSourceOwner(source,node,context.strict):true;
    }
    function v2212CitationOwner(source,node,context) {
        if(v2212CitationStrictOwner(source,node,context))return true;
        if(v2212CitationProtected(source,node.start,node.end,context))return false;
        const owners=context.refs.filter(r=>r.body!==null&&r.openEnd<=node.start&&node.end<=r.openEnd+r.body.length);
        if(owners.length!==1)return false;
        const ref=owners[0],attrs=attrsOf(ref.attrs),body=source.slice(ref.openEnd,ref.openEnd+ref.body.length);
        if(!attrs||!v24SyntaxLiteralIdentity(attrs)||/<\s*\/?\s*ref\b/i.test(body)||
            body.trim()!==source.slice(node.start,node.end)||!/<\/ref[ \t]*>$/i.test(ref.raw))return false;
        const owner=v24SyntaxContext(context.view,ref.start);
        if(owner.external.length||owner.html.length||owner.tables.length>1)return false;
        if(owner.templates.length){
            if(owner.templates.length!==1)return false;
            const outer=context.nodes.find(n=>n.start===owner.templates[0].start);
            if(!outer||outer.end<ref.end)return false;
            const masked=context.view.slice(outer.start,outer.end),
                title=splitParts(masked.slice(2,-2))[0].trim(),profile=INFOBOX_CATALOG[norm(title)];
            if(!profile?.title||!Number.isInteger(profile.oldid)||!v215LiteralTemplateIdentity(masked,profile)||
                !/^(?:info\/|infobox\b)/.test(norm(title)))return false;
        }
        if(owner.links.length){
            if(owner.links.length!==1||owner.templates.length)return false;
            const start=owner.links[0];
            if(!/^\[\[\s*(?:Ficheiro|Imagem|Arquivo|File|Image)\s*:/i.test(source.slice(start)))return false;
            const link=editorialWikiLinkRanges(context.view).find(r=>r.start===start);
            if(!link||link.end<ref.end)return false;
        }
        // An ordinary ref rejected by the baseline quarantine is not released
        // merely because it is balanced. Only proved enclosing native objects
        // gain this narrower path.
        if(owner.templates.length===1||owner.links.length===1)return true;
        if(owner.tables.length===1){
            const tables=context.nativeTables||(context.nativeTables=v272LiteralTables(source).tables);
            // Only the complete literal ref body is replaced. The table's
            // opening, cells, attributes, nesting and closing stay byte-exact.
            return tables.some(t=>t.start===owner.tables[0]&&!t.nested&&t.attrs.valid&&
                t.openEnd<=ref.start&&t.closeStart>=ref.end);
        }
        return false;
    }
    function v2212CitationItalianDate(value) {
        const match=/^(\d{1,2})(?:[º°])?\s+([a-z]+)\s+([1-9]\d{3})$/i.exec(value.trim()),
            months={gennaio:1,febbraio:2,marzo:3,aprile:4,maggio:5,giugno:6,luglio:7,agosto:8,settembre:9,ottobre:10,novembre:11,dicembre:12};
        if(!match)return null;
        const day=+match[1],month=months[match[2].toLowerCase()],year=+match[3];
        return month&&validDate(day,month,year)?year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0'):null;
    }
    function v2212CitationItalianCall(raw,cfg={}) {
        if(cfg.translationResidues===false||cfg.automaticParameterNames===false||
            !['cita web','citar web'].includes(parsedTemplate(raw).name))return null;
        const fields=v220CitationFields(raw),map=fields&&v220CitationNamedFields(fields);
        const aliases={titolo:'título',accesso:'acessodata',dataarchivio:'arquivodata',urlarchivio:'arquivourl',urlmorto:'urlmorta',sito:'obra'};
        if(!map||fields.filter(f=>Object.hasOwn(aliases,f.key)).length<2)return null;
        const edits=[],head=splitParts(raw.slice(2,-2))[0],target='{{Citar web'+raw.slice(2+head.length);
        const contract=v2212CitationContext(target);if(!contract)return null;
        for(const f of fields){
            if(!Object.hasOwn(aliases,f.key)){
                if(f.value.trim()&&!nativeCitationAccepts(contract.native,f.key))return null;
                continue;
            }
            const key=aliases[f.key];
            if(!v2212CitationPlain(f.value)||map.has(key)||fields.some(other=>other!==f&&
                v219NativeCitationRoles(other.key).some(role=>v219NativeCitationRoles(key).includes(role))))return null;
            let value=f.value.trim();
            if(['accesso','dataarchivio'].includes(f.key)){
                value=v2212CitationItalianDate(value);if(!value)return null;
            }else if(f.key==='urlmorto'){
                value=({sì:'sim',no:'não'})[value];if(!value)return null;
            }else if(f.key==='urlarchivio'&&!v213LiteralURL(value))return null;
            edits.push({start:f.keyStart,end:f.keyEnd,text:key});
            if(value!==f.value.trim())edits.push({start:f.start,end:f.end,text:v221CitationPadded(f.value,value)});
        }
        let text=v24SyntaxApply(raw,edits);
        if(parsedTemplate(raw).name==='cita web')text='{{Citar web'+text.slice(2+head.length);
        const after=v2212CitationContext(text),archive=after&&v2212CitationOnly(after.fields,'ArchiveURL'),
            date=after&&v2212CitationOnly(after.fields,'ArchiveDate'),url=after&&v2212CitationOnly(after.fields,'URL');
        if(!after||after.fields.some(f=>f.positional)||!url||!v221CitationURL(url.value))return null;
        if(archive){
            const capture=/^https:\/\/web\.archive\.org\/web\/(\d{14})\/(https?:\/\/.+)$/.exec(archive.value.trim());
            if(!capture||capture[2]!==url.value.trim()||!date||
                date.value.trim()!==capture[1].slice(0,4)+'-'+capture[1].slice(4,6)+'-'+capture[1].slice(6,8))return null;
        }
        return {text,count:edits.length+(parsedTemplate(raw).name==='cita web'?1:0)};
    }
    function v2212CitationCall(raw,cfg={}) {
        let text=raw;const rules=[],steps=[];
        const stage=(next,ids,counts=null)=>{
            if(next===text)return;const changes=ids.flatMap(id=>Array(Math.max(1,counts?.[id]||1)).fill(id));
            steps.push({before:text,after:next,ruleIds:changes});text=next;rules.push(...changes);
        };
        const italian=v2212CitationItalianCall(text,cfg);
        if(italian)stage(italian.text,['v2212ItalianCitationFields'],{v2212ItalianCitationFields:italian.count});
        // A missing first separator is accepted only before one explicit URL.
        if(cfg.automaticParameterNames!==false){
            const match=/^\{\{(\s*)([Cc]ite web)([ \t]+)(url[ \t]*=)/.exec(text);
            if(match){
                const next=text.slice(0,match[0].length-match[4].length)+'|'+text.slice(match[0].length-match[4].length),
                    context=v2212CitationContext(next),url=context&&v2212CitationOnly(context.fields,'URL');
                if(context&&url&&v221CitationURL(url.value)&&!context.fields.some(f=>f.positional))
                    stage(next,['v2212CitationFirstPipe']);
            }
        }
        // This helper deliberately keeps its verified legacy interface.
        if(cfg.automaticParameterNames!==false&&/^\{\{\s*[Cc]ite music release notes\s*\|/.test(text)){
            const fields=v220CitationFields(text),map=fields&&v220CitationNamedFields(fields);
            if(map&&['Name','Artist','Type'].every(k=>map.get(k)?.value.trim())&&
                fields.every(f=>['Name','Artist','Type','Year','year','Format','publisher','ano','formato','publicado'].includes(f.key))){
                const edits=[];for(const [from,to]of [['ano','year'],['formato','Format'],['publicado','publisher']]){
                    const field=map.get(from);if(!field||map.has(to)||!v2212CitationPlain(field.value))continue;
                    if(from==='ano'&&!/^[1-9]\d{3}$/.test(field.value.trim()))continue;
                    edits.push({start:field.keyStart,end:field.keyEnd,text:to});
                }
                if(edits.length)stage(v24SyntaxApply(text,edits),['v2212LegacyMusicFields'],{v2212LegacyMusicFields:edits.length});
            }
        }
        // Preserve complete literal fields while allowing an anonymous link to
        // become a URL only when it repeats the already supplied exact title.
        let context=v2212CitationContext(text);
        if(context&&context.fields.filter(f=>f.positional&&f.value.trim()).length===1){
            const field=context.fields.find(f=>f.positional&&f.value.trim()),title=v2212CitationOnly(context.fields,'Title'),
                url=v2212CitationRoles(context.fields,'URL'),found=/^\s*\[(https?:\/\/[^\s\[\]{}<>|]+)\s+([^\[\]{}<>\r\n|]+)\]\s*$/.exec(field.value);
            if(cfg.automaticParameterNames!==false&&found&&title&&!url.length&&v213LiteralURL(found[1])&&
                found[2].trim().replace(/\s+/g,' ')===title.value.trim().replace(/\s+/g,' '))
                stage(v24SyntaxApply(text,[{start:field.partStart,end:field.partEnd,text:'url='+found[1]}]),['v2212AnonymousCitationURL']);
            else if(cfg.identifierUrlRepairs!==false&&/^\s*\{\{\s*[Aa]rxiv\s*\|/.test(field.value)&&
                !v2212CitationRoles(context.fields,'Identifier:ARXIV').length&&!context.fields.some(f=>f.key==='arxiv')){
                const helper=v220CitationFields(field.value.trim()),map=helper&&v220CitationNamedFields(helper);
                if(map&&map.size===2&&map.has('archive')&&map.has('id')&&map.get('archive').value.trim()==='gr-qc'&&
                    /^\d{7}$/.test(map.get('id').value.trim())){
                    const id='gr-qc/'+map.get('id').value.trim();
                    if(v29IdentifierValue('arxiv','https://arxiv.org/abs/'+id)===id)
                        stage(v24SyntaxApply(text,[{start:field.partStart,end:field.partEnd,text:'arxiv='+id}]),['v2212AnonymousArxiv']);
                }
            }
        }
        context=v2212CitationContext(text);
        if(!context||context.fields.some(f=>f.positional))return {text,ruleIds:rules,steps};
        // Equal duplicate values may be removed, but not their comments or a
        // conflicting value that could represent another cited source.
        if(cfg.automaticParameterDuplicates!==false&&!/<!--/.test(text)){
            const seen=new Map(),edits=[];
            for(const f of context.fields){
                if(!nativeCitationAccepts(context.native,f.key))continue;
                const group=seen.get(f.key)||[];group.push(f);seen.set(f.key,group);
            }
            for(const group of seen.values()){
                if(group.length<2||!group.every(f=>v2212CitationPlain(f.value)&&f.value.trim()===group[0].value.trim()))continue;
                for(const f of group.slice(1))edits.push({start:f.partStart-1,end:f.partEnd,text:''});
            }
            if(edits.length)stage(v24SyntaxApply(text,edits),['v2212CitationEqualParameters'],{v2212CitationEqualParameters:edits.length});
        }
        context=v2212CitationContext(text);
        if(!context||!v220CitationNamedFields(context.fields))return {text,ruleIds:rules,steps};
        const fields=context.fields,edits=[],unique=role=>v2212CitationOnly(fields,role),has=role=>v2212CitationRoles(fields,role).length>0,
            add=(start,end,value,rule)=>edits.push({start,end,text:value,ruleId:rule}),
            rename=(field,key,rule)=>{if(field.key!==key)add(field.keyStart,field.keyEnd,key,rule);},
            value=(field,next,rule)=>{const result=v221CitationPadded(field.value,next);if(result!==field.value)add(field.start,field.end,result,rule);};
        if(cfg.automaticParameterNames!==false){
            for(const f of fields){
                if(!v2212CitationPlain(f.value))continue;
                for(const [from,to,role]of [['Título','título','Title'],['publicado por','publicado','PublisherName'],
                    ['conferência-url','conference-url','ConferenceURL']]){
                    if(f.key===from&&!v2212CitationRoles(fields,role).some(x=>x!==f)&&nativeCitationAccepts(context.native,to))
                        rename(f,to,'v2212CitationObsoleteKeys');
                }
                if(cfg.dates!==false&&cfg.automaticCitationDateValues!==false&&
                    v221CitationRole(f,'Date')&&/^Fecha[ \t]+/i.test(f.value.trim())){
                    const stripped=f.value.trim().replace(/^Fecha[ \t]+/i,''),date=v218CitationDateValue(stripped,'date');
                    if(date?.precision==='day')value(f,date.text.trim(),'v2212CitationCopiedDateLabel');
                }
                if(f.key==='loc'&&!has('At')&&!has('Page')&&!has('Pages')&&
                    /^§{1,2}\s*\d+[A-Za-z]?(?:\([a-z]\))?(?:[;,]\s*[\p{L}\p{N} §:(),.–\-]+)?$/u.test(f.value.trim())&&
                    f.value.trim().length<=180)rename(f,'em','v2212CitationLocator');
            }
            const access=fields.filter(f=>['url-acesso','url-acess','urlacesso','urlaccess'].includes(f.key)),url=unique('URL');
            if(access.length===1&&url&&v221CitationURL(v221CitationNativeTrim(url.value))&&!has('UrlAccess')&&
                !fields.some(f=>['registration','registro','registo','cadastro','subscription','subscrição','assinatura'].includes(f.key)&&f.value.trim())&&
                ['subscrição','limitada','limitado','registo','registro','registration','limited'].includes(access[0].value.trim())&&
                v221CitationArchivedAccessSafe({fields,kind:'web'},null,null))
                rename(access[0],'acesso-url','v2212CitationAccessKey');
            if(cfg.authors!==false&&context.profile.dependencies?.some(d=>d.title==='Módulo:Citação/CS1'&&d.oldid===72936771)&&
                (cfg.v2212NativeCS1Revision===undefined||cfg.v2212NativeCS1Revision===72936771)){
                for(const [from,to]of [['vautores','vauthors'],['veditores','veditors']]){
                    const field=fields.find(f=>f.key===from);
                    if(field&&v2212CitationPlain(field.value)&&!fields.some(f=>f.key===to))
                        rename(field,to,'v2212CitationVancouverCompatibility');
                }
            }
        }
        if(cfg.identifierUrlRepairs!==false){
            const isbn=unique('Identifier:ISBN');
            if(isbn&&v2212CitationPlain(isbn.value)){
                const literal=isbn.value.trim();
                if(/^[0-9Xx -]+\.$/.test(literal)&&v213ISBN(literal.slice(0,-1)))
                    value(isbn,literal.slice(0,-1),'v2212ISBNPeriod');
                else if(/[;,]/.test(literal)){
                    const ids=literal.split(/[;,]/).map(x=>x.trim());
                    if(ids.length>=2&&ids.length<=8&&ids.every(x=>v213ISBN(x))){
                        const canonical=ids.map(x=>x.replace(/[ -]/g,'').toUpperCase());
                        if(new Set(canonical).size===1)value(isbn,ids[0],'v2212ISBNRepeatedValue');
                        else if(ids.length===2&&!fields.some(f=>['id','ID'].includes(f.key))){
                            const ten=canonical.find(x=>x.length===10),thirteen=canonical.find(x=>x.length===13);
                            if(ten&&thirteen&&thirteen.startsWith('978')&&thirteen.slice(0,12)==='978'+ten.slice(0,9)){
                                value(isbn,ids[0],'v2212ISBNEquivalentPair');
                                add(text.length-2,text.length-2,'|id={{ISBN|'+ids[1]+'}}','v2212ISBNEquivalentPair');
                            }
                        }
                    }
                }
            }
            for(const f of fields){
                if(!v219NativeCitationRoles(f.key).some(role=>['URL','ArchiveURL','ChapterURL'].includes(role)))continue;
                const literal=f.value.trim();
                if(!/\u200e/.test(literal))continue;
                const found=/^[\u200e \t]*(https?:\/\/[\x21-\x7e]+?)[\u200e \t]*$/.exec(literal);
                if(found&&v213LiteralURL(found[1]))value(f,found[1],'v2212URLBoundaryLRM');
            }
        }
        if(cfg.dates!==false&&cfg.automaticCitationDateValues!==false&&!has('ArchiveDate')){
            const archive=unique('ArchiveURL'),urlFields=[...v2212CitationRoles(fields,'URL'),...v2212CitationRoles(fields,'ChapterURL')];
            if(archive&&v2212CitationPlain(archive.value)){
                const match=/^https:\/\/web\.archive\.org\/web\/(\d{8}(?:\d{6})?)\/(https?:\/\/[^\s{}<>|]+)$/.exec(archive.value.trim());
                if(match){
                    const stamp=match[1],year=+stamp.slice(0,4),month=+stamp.slice(4,6),day=+stamp.slice(6,8),
                        clock=stamp.length===8||(+stamp.slice(8,10)<24&&+stamp.slice(10,12)<60&&+stamp.slice(12,14)<60);
                    if(clock&&validDate(day,month,year)&&v213LiteralURL(match[2])&&
                        urlFields.filter(f=>f.value.trim()===match[2]).length===1)
                        add(text.length-2,text.length-2,'|arquivodata='+stamp.slice(0,4)+'-'+stamp.slice(4,6)+'-'+stamp.slice(6,8),'v2212ArchiveTimestampDate');
                }
            }
        }
        if(edits.length){
            const counts={};for(const edit of edits)counts[edit.ruleId]=(counts[edit.ruleId]||0)+1;
            stage(v24SyntaxApply(text,edits),Object.keys(counts),counts);
        }
        return {text,ruleIds:rules,steps};
    }
    function v2212CitationTitleDonors(calls) {
        const donors=new Map();
        for(const call of calls){
            const context=v2212CitationContext(call.raw);
            if(!context||norm(context.profile.title)!=='citar web'||context.fields.some(f=>f.positional)||
                !v220CitationNamedFields(context.fields))continue;
            const url=v2212CitationOnly(context.fields,'URL'),title=v2212CitationOnly(context.fields,'Title');
            if(!url||!title||!v213LiteralURL(url.value.trim())||!v2212CitationPlain(title.value,2000)||
                /[\r\n|]/.test(title.value))continue;
            const list=donors.get(url.value.trim())||[];list.push({call,context,title:title.value.trim()});donors.set(url.value.trim(),list);
        }
        return donors;
    }
    function v2212CitationBindingKeys(raw) {
        const context=v2212CitationContext(raw);if(!context)return [];
        const result=[],family=norm(context.profile.title);
        for(const role of ['URL','Identifier:DOI','Title']){
            const field=v2212CitationOnly(context.fields,role);
            if(field&&v2212CitationPlain(field.value))result.push(JSON.stringify([family,role,field.value.trim()]));
        }
        return result;
    }
    function v2212CitationOriginalOwners(source,cfg) {
        const original=cfg.citationOriginalSource;
        if(typeof original!=='string'||original===source||original.length>4194304)return null;
        const context=v2212CitationSourceContext(original),blocked=new Set();
        for(const node of context.nodes){
            if(node.size&&node.size!==2||node.end-node.start>131072)continue;
            const raw=original.slice(node.start,node.end);
            if(!/^\{\{\s*(?:[Cc]itar |[Cc]ite |[Cc]itation\b)/.test(raw))continue;
            const keys=v2212CitationBindingKeys(raw);
            if(keys.length&&!v2212CitationOwner(original,node,context))for(const key of keys)blocked.add(key);
        }
        return {sourceHash:v24SyntaxHash(original),blocked};
    }
    function v2212CitationRecoverTitle(raw,donors) {
        const context=v2212CitationContext(raw);
        if(!context||norm(context.profile.title)!=='citar web'||context.fields.some(f=>f.positional)||!v220CitationNamedFields(context.fields))return null;
        const url=v2212CitationOnly(context.fields,'URL'),titles=v2212CitationRoles(context.fields,'Title');
        if(!url||titles.length>1||titles.some(f=>f.value.trim())||!v213LiteralURL(url.value.trim()))return null;
        let parsed;try{parsed=new URL(url.value.trim());}catch(_){return null;}
        if(!parsed.pathname||parsed.pathname==='/'||/^\/(?:home|index)(?:\.[a-z]+)?\/?$/i.test(parsed.pathname))return null;
        const matches=donors.get(url.value.trim())||[],values=new Set(matches.map(x=>x.title));
        if(values.size!==1||!matches.length)return null;
        const comparable=fields=>{
            const result=new Map();
            for(const f of fields){
                if(!f.value.trim())continue;
                const roles=v219NativeCitationRoles(f.key);
                if(roles.length!==1)return null;
                const role=roles[0];
                if(['Title','URL','AccessDate','Page','Pages','At','Ref','PostScript'].includes(role))continue;
                if(result.has(role)&&result.get(role)!==f.value.trim())return null;
                result.set(role,f.value.trim());
            }
            return result;
        },target=comparable(context.fields);if(!target)return null;
        for(const donor of matches){
            const other=comparable(donor.context.fields);if(!other)return null;
            for(const [role,value]of target)if(!other.has(role)||other.get(role)!==value)return null;
        }
        const title=matches[0].title;
        if(titles.length){const f=titles[0];return v24SyntaxApply(raw,[{start:f.start,end:f.end,text:v221CitationPadded(f.value,title)}]);}
        return raw.slice(0,-2)+'|título='+title+'}}';
    }
    function v2212CitationUpperAlpha(raw,cfg={}) {
        if(cfg.unifiedNotesReferences===false)return null;
        const title=v220CitationTitle(raw);
        if(!['Notelist-ua','Listanota-ua'].some(name=>v215SameTemplateTitle(title,name)))return null;
        const fields=v220CitationFields(raw),map=fields&&v220CitationNamedFields(fields);
        if(!map||fields.some(f=>!['refs','notes','notas'].includes(f.key))||fields.length>1)return null;
        const bank=fields[0]?.value;
        if(bank?.trim()){
            const refs=refTokens(bank);let cursor=0;
            for(const ref of refs){
                const attrs=attrsOf(ref.attrs);
                if(bank.slice(cursor,ref.start).trim()||ref.body===null||!attrs||!attrs.name||
                    !v24SyntaxLiteralIdentity(attrs)||Object.keys(attrs).some(k=>!['name','group'].includes(k))||
                    attrs.group&&attrs.group!=='upper-alpha'||/<\s*\/?\s*ref\b/i.test(ref.body))return null;
                cursor=ref.end;
            }
            if(!refs.length||bank.slice(cursor).trim())return null;
        }
        return '{{Referências|grupo=upper-alpha|nível=0'+(fields.length?'|refs='+bank:'')+'}}';
    }
    function v2212CitationPlan(source,cfg={}) {
        const base={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(!v2212CitationScope(source,cfg))return base;
        const context=v2212CitationSourceContext(source),originalOwners=v2212CitationOriginalOwners(source,cfg),calls=[],collectors=[];
        for(const node of context.nodes){
            if(node.size&&node.size!==2)continue;
            const raw=source.slice(node.start,node.end);
            if(raw.length>131072)continue;
            const opening=/^\{\{\s*([^|{}\r\n]{1,200})/.exec(raw),head=opening&&norm(opening[1].replace(/^(?:Predefinição|Template)\s*:/i,''));
            if(['notelist-ua','listanota-ua'].includes(head)&&v2212CitationStrictOwner(source,node,context)&&
                !v24SyntaxContext(context.view,node.start).html.length&&!v24SyntaxContext(context.view,node.start).tables.length){
                const text=v2212CitationUpperAlpha(raw,cfg);
                if(text&&text!==raw)collectors.push({start:node.start,end:node.end,text,ruleId:'v2212UpperAlphaCollector',
                    label:'Coletor de notas padronizado',proof:{sourceHash:base.sourceHash,before:raw,after:text,
                        contract:V2212_CITATION_CONTRACT,condition:'native fixed upper-alpha collector; same bank bytes, labels and graph; no custom widths or columns'}});
                continue;
            }
            if(!head||!Object.hasOwn(CITE_NAMES,head)&&head!=='cita web'&&head!=='cite music release notes'&&!/^cite web\s+url\s*=/.test(head))continue;
            if(!v2212CitationOwner(source,node,context))continue;
            if(originalOwners&&v2212CitationBindingKeys(raw).some(key=>originalOwners.blocked.has(key)))continue;
            calls.push({node,raw,nested:!v2212CitationStrictOwner(source,node,context)});
        }
        const donors=v2212CitationTitleDonors(calls),edits=collectors.slice();
        for(const {node,raw,nested}of calls){
            const call=v2212CitationCall(raw,cfg);
            let text=call.text,ruleIds=call.ruleIds.slice(),baseline=null;
            // Existing native field repairs gain only the proved native ref
            // owner above. Their own value and collision checks stay intact.
            if(nested&&v2212CitationContext(text)){
                baseline=v221CitationCall(text,cfg);
                if(baseline?.text!==undefined&&baseline.text!==text){
                    text=baseline.text;ruleIds.push(...(baseline.fieldEdits||[]).map(edit=>edit.ruleId));
                }
            }
            if(cfg.automaticParameterNames!==false){
                const recovered=v2212CitationRecoverTitle(text,donors);
                if(recovered&&recovered!==text){text=recovered;ruleIds.push('v2212LocalCitationTitle');}
            }
            if(text===raw)continue;
            edits.push({start:node.start,end:node.end,text,ruleId:ruleIds[0]||'v2212CitationRepair',ruleIds,
                label:'Referências e campos conferidos',
                proof:{sourceHash:base.sourceHash,before:raw,after:text,contract:V2212_CITATION_CONTRACT,
                    localSteps:call.steps,baselineRules:baseline?.rules||[],expandedNativeRefOwner:nested,
                    originalSourceHash:originalOwners?.sourceHash||base.sourceHash,
                    condition:'exact native citation, literal proved source owner, unchanged unrelated argument bytes; checked identifiers and exact URL identities'}});
        }
        // A parent citation may contain a helper candidate. Never compose
        // overlapping replacements from independently derived ownership.
        const safe=edits.filter(e=>!edits.some(other=>other!==e&&other.start<e.end&&e.start<other.end))
            .sort((a,b)=>a.start-b.start||a.end-b.end);
        return {...base,text:v24SyntaxApply(source,safe),edits:safe};
    }
    function v2212CitationProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2212CitationPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v2212CitationLanguageMoveCertificate(before,after,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options});
        if(typeof before!=='string'||typeof after!=='string'||before===after||!v221CitationScope(before,cfg)||
            cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||
            !cfg.references||!cfg.moveNamedRefs||!v219CitationLanguageInventory(before,cfg).hasLanguage||
            !v219CosmeticBaseNamedRetention(before,after,cfg).accepted)return null;
        const source=v219CitationLanguageReferenceSource(v219CitationLanguageSource(before,cfg),cfg),
            plan=v219CitationLanguageNamedMovePlan(source,cfg);
        if(!plan.edits.length||!v219CitationLanguageNamedMoveProof(source,plan.text,plan,cfg))return null;
        const original=v219NativeReferenceObserver(source),actual=v219NativeReferenceObserver(after);
        if(original.refs.length!==actual.refs.length)return null;
        const selected=plan.families.filter(f=>f.relocated&&f.sites.some(site=>
            (original.refs[site.ordinal].body===null)!==(actual.refs[site.ordinal].body===null))&&
            f.sites.every(site=>(actual.refs[site.ordinal].body!==null)===(site.ordinal===f.keeper)));
        if(!selected.length||!v219CitationLanguageNamedMoveSitesRetained(source,after,plan,cfg,selected))return null;
        const keys=new Set(selected.map(f=>f.key)),edits=plan.edits.filter(e=>keys.has(e.proof.key)),
            projected=v24SyntaxApply(source,edits);
        if(v219CitationLanguageInventory(projected,cfg).key!==v219CitationLanguageInventory(after,cfg).key)return null;
        return {sourceHash:v24SyntaxHash(before),projectionHash:v24SyntaxHash(projected),families:[...keys],
            method:'fresh literal same-name first-use move; native sites and bindings retained; exact ordered language inventory'};
    }

