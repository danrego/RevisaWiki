    // The key is retained when the native citation already accepts its spelling.
    // Dates with incomplete access/archive precision never acquire a new day.
    const V218_CITATION_DATE_FIELDS=Object.freeze({
        data:'date',date:'date',transmissão:'date','air-date':'date',airdate:'date',
        acessodata:'access',acessadoem:'access','access-date':'access',accessdate:'access',
        'acesso-data':'access',accessodata:'access',acessdate:'access',
        arquivodata:'archive','archive-date':'archive',archivedate:'archive','arquivo-data':'archive',
        'data-publicação':'publication','data-publicacao':'publication','publication-date':'publication',
        ano:'year',year:'year'
    });
    // All native aliases participate in collision checks, including spellings
    // that are not enabled as value-repair sources in this release.
    const V218_CITATION_DATE_FAMILIES=Object.freeze({
        date:['data','date','airdate','dataemissão','fecha','data2','transmissão','air-date'],
        access:['acesso','acessodata','acesso-data','accessodata','acessadoem','dataacesso',
            'accessdate','access-date','fechaacceso','consulta','acessdate'],
        archive:['arquivodata','arquivo-data','archive-date','archivedate'],
        publication:['data-publicação','data-publicacao','publication-date','publicationdate','fecha-publicación'],
        year:['ano','year','Ano','año']
    });
    function v218CitationDateMonth(value) {
        const month=String(value).toLocaleLowerCase('pt').replace(/\.$/,'');
        return month==='marco'?3:Object.hasOwn(MONTHS,month)?MONTHS[month]:0;
    }
    function v218CitationDateValue(value,kind='date') {
        if(typeof value!=='string'||!Object.values(V218_CITATION_DATE_FIELDS).includes(kind))return null;
        const padding=/^([ \t\r\n]*)([\s\S]*?)([ \t\r\n]*)$/.exec(value);
        if(!padding||!padding[2]||/[\uE000\r\n<>]|<!--|&|\\/.test(padding[2]))return null;
        let raw=padding[2],match,precision='',canonical='',identity;
        const dateTemplate=/^\{\{\s*(Data|DataExt)\s*\|\s*(\d{1,4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,4})\s*\}\}$/i.exec(raw);
        if(dateTemplate){
            const day=Number(dateTemplate[dateTemplate[1].toLowerCase()==='data'?4:2]),
                month=Number(dateTemplate[3]),year=Number(dateTemplate[dateTemplate[1].toLowerCase()==='data'?2:4]);
            if(kind==='year'||!validDate(day,month,year))return null;
            precision='day';canonical=day+' de '+MONTH_PT[month]+' de '+year;identity={day,month,year};
        }else{
            if(/[{}]/.test(raw))return null;
            raw=raw.replace(/\[\[([^\[\]|]+)\]\]/g,'$1');
            if(/[\[\]|]/.test(raw))return null;
            // A terminal punctuation mark is accepted only after a complete
            // named-month expression and never discarded from arbitrary text.
            if(/\p{L}.*\d{4}\.$/u.test(raw))raw=raw.slice(0,-1);
            if(kind==='year'){
                if(!/^[1-9]\d{3}$/.test(raw))return null;
                precision='year';canonical=raw;identity={year:Number(raw)};
            }else if((match=/^([1-9]\d{3})-(\d{2})-(\d{2})$/.exec(raw))){
                const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
                if(!validDate(day,month,year))return null;
                precision='day';canonical=raw;identity={day,month,year};
            }else if((match=/^([1-9]\d{3})[-/]([\p{L}.]+)[-/](\d{1,2})$/u.exec(raw))||
                (match=/^(\d{1,2})[-/]([\p{L}.]+)[-/]([1-9]\d{3})$/u.exec(raw))){
                const yearFirst=/^[1-9]\d{3}[-/]/.test(raw),year=Number(match[yearFirst?1:3]),
                    day=Number(match[yearFirst?3:1]),month=v218CitationDateMonth(match[2]);
                if(!validDate(day,month,year))return null;
                precision='day';canonical=day+' de '+MONTH_PT[month]+' de '+year;identity={day,month,year};
            }else if((match=/^(\d{1,2})(?:st|nd|rd|th|\.?[º°])?\s+(?:de\s+)?([\p{L}.]+)\s+(?:de\s+)?([1-9]\d{3})$/iu.exec(raw))||
                (match=/^([\p{L}.]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s+([1-9]\d{3})$/iu.exec(raw))){
                const dayFirst=/^\d/.test(raw),day=Number(match[dayFirst?1:2]),
                    month=v218CitationDateMonth(match[dayFirst?2:1]),year=Number(match[3]);
                if(!validDate(day,month,year))return null;
                precision='day';canonical=day+' de '+MONTH_PT[month]+' de '+year;identity={day,month,year};
            }else if((match=/^(\d{1,2})\s*[–/-]\s*(\d{1,2})\s+(?:de\s+)?([\p{L}.]+)\s+(?:de\s+)?([1-9]\d{3})$/u.exec(raw))||
                (match=/^([\p{L}.]+)\s+(\d{1,2})\s*[–/-]\s*(\d{1,2}),?\s+([1-9]\d{3})$/u.exec(raw))){
                const dayFirst=/^\d/.test(raw),first=Number(match[dayFirst?1:2]),last=Number(match[dayFirst?2:3]),
                    month=v218CitationDateMonth(match[dayFirst?3:1]),year=Number(match[4]);
                if(first>=last||!validDate(first,month,year)||!validDate(last,month,year))return null;
                precision='day-range';canonical=first+'–'+last+' de '+MONTH_PT[month]+' de '+year;identity={first,last,month,year};
            }else if((match=/^([\p{L}.]+)\s*[–/-]\s*([\p{L}.]+),?\s+(?:de\s+)?([1-9]\d{3})$/u.exec(raw))){
                const first=v218CitationDateMonth(match[1]),last=v218CitationDateMonth(match[2]),year=Number(match[3]);
                if(!first||!last||first>=last)return null;
                precision='month-range';canonical=MONTH_PT[first]+'–'+MONTH_PT[last]+' de '+year;identity={first,last,year};
            }else if((match=/^([1-9]\d{3})[-/](\d{1,2})$/.exec(raw))||
                (match=/^(\d{1,2})[-/]([1-9]\d{3})$/.exec(raw))){
                const yearFirst=/^[1-9]\d{3}[-/]/.test(raw),month=Number(match[yearFirst?2:1]),year=Number(match[yearFirst?1:2]);
                if(month<1||month>12)return null;
                precision='month';canonical=yearFirst&&/^\d{4}-\d{2}$/.test(raw)?raw:MONTH_PT[month]+' de '+year;identity={month,year};
            }else if((match=/^([\p{L}.]+),?\s+(?:de\s+)?([1-9]\d{3})$/u.exec(raw))){
                const month=v218CitationDateMonth(match[1]),year=Number(match[2]);
                if(month){precision='month';canonical=MONTH_PT[month]+' de '+year;identity={month,year};}
                else{
                    const seasons={spring:'primavera',summer:'verão',fall:'outono',autumn:'outono',winter:'inverno',
                        primavera:'primavera',verão:'verão',outono:'outono',inverno:'inverno'},key=match[1].toLowerCase(),
                        season=Object.hasOwn(seasons,key)?seasons[key]:null;
                    if(!season)return null;
                    precision='season';canonical=season+' de '+year;identity={season,year};
                }
            }else return null;
        }
        if(['access','archive'].includes(kind)&&precision!=='day')return null;
        return {text:padding[1]+canonical+padding[3],precision,identity,kind};
    }
    function v218CitationDateScope(source,options={}) {
        const cfg={...DEFAULTS,...options};
        return typeof source==='string'&&source.length<=4194304&&cfg.dates!==false&&cfg.automaticCitationDateValues!==false&&
            cfg.namespaceNumber===0&&!cfg.sectionOnly&&(!cfg.contentModel||cfg.contentModel==='wikitext')&&
            v20AutomationAllowed(source,cfg)&&!v24SyntaxScan(source).issues.length;
    }
    function v218CitationNativeContext(raw) {
        const parsed=parsedTemplate(raw),chosen=Object.hasOwn(CITE_NAMES,parsed.name)?CITE_NAMES[parsed.name]:null;
        if(typeof chosen!=='string')return null;
        const profile=TEMPLATE_CATALOG[norm(chosen)];
        if(!profile?.title||!Number.isInteger(profile.oldid)||norm(profile.title)!==norm(chosen))return null;
        const native={...parsed,name:norm(profile.title),parts:[profile.title,...parsed.parts.slice(1)]};
        return nativeCitationTitle(native)?{parsed,native,profile}:null;
    }
    function v218CitationDateEdits(source,options={}) {
        const cfg={...DEFAULTS,...options};if(!v218CitationDateScope(source,cfg))return [];
        const view=protectedView(source),sourceHash=v24SyntaxHash(source),edits=[];
        for(const node of templates(view).nodes){
            const raw=source.slice(node.start,node.end),context=v218CitationNativeContext(raw);
            if(!context)continue;const {parsed,native,profile}=context;
            const fields=v2151FieldSyntaxParts(raw);if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))continue;
            const dateFields=fields.filter(field=>Object.hasOwn(V218_CITATION_DATE_FIELDS,field.key));
            for(const field of dateFields){
                const kind=V218_CITATION_DATE_FIELDS[field.key];
                if(!nativeCitationAccepts(native,field.key)||
                    fields.filter(other=>V218_CITATION_DATE_FAMILIES[kind].some(key=>norm(key)===norm(other.key))).length!==1)continue;
                const value=v218CitationDateValue(field.value,kind);
                if(!value||value.text===field.value)continue;
                edits.push({start:node.start+field.start,end:node.start+field.end,text:value.text,
                    ruleId:'v218CitationDateValues',proof:{sourceHash,template:parsed.name,nativeTemplate:native.name,
                        nativeTemplateOldid:profile.oldid,key:field.key,
                        valueBefore:field.value,valueAfter:value.text,kind,precision:value.precision,
                        identity:value.identity,changeRules:['v218CitationDateValues'],minorSafe:true,
                        method:'explicit-native-date-alias; exact-precision calendar-valid literal'}});
            }
        }
        return edits.sort((a,b)=>a.start-b.start||a.end-b.end).filter((edit,index,all)=>
            !all.some((other,otherIndex)=>otherIndex!==index&&other.start<edit.end&&edit.start<other.end));
    }
    function v218CitationDatePlan(source,options={}) {
        const edits=v218CitationDateEdits(source,options);
        return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v218CitationDateProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v218CitationDatePlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
