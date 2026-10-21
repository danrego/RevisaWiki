    const V219_ITALIAN_CITATION_MONTHS=Object.freeze(ownDictionary({gennaio:1,febbraio:2,marzo:3,aprile:4,maggio:5,giugno:6,
        luglio:7,agosto:8,settembre:9,ottobre:10,novembre:11,dicembre:12}));
    function v219CitationDateMonth(value) {
        const original=v218CitationDateMonth(value),key=String(value).toLocaleLowerCase('pt').replace(/\.$/,'');
        if(Number.isInteger(original)&&original>=1&&original<=12)return original;
        const month=Object.hasOwn(V219_ITALIAN_CITATION_MONTHS,key)?V219_ITALIAN_CITATION_MONTHS[key]:0;
        return Number.isInteger(month)&&month>=1&&month<=12?month:0;
    }
    function v219SupplementalCitationDateValue(value,kind='date') {
        if(typeof value!=='string'||!['date','access','archive','publication','year'].includes(kind))return null;
        const padding=/^([ \t]*)([^\r\n]*?)([ \t]*)$/.exec(value);if(!padding||!padding[2])return null;
        let raw=padding[2],match,precision='',canonical='',identity;
        // Only unpiped complete links may be removed from an explicit date
        // field. Their displayed value is exactly their target.
        raw=raw.replace(/\[\[([^\[\]|{}<>\r\n]+)\]\]/g,'$1');
        if(/[{}\[\]<>|&\\\uE000-\uF8FF]/.test(raw))return null;
        const day=(d,m,y,iso=false)=>{
            if(kind==='year'||!validDate(d,m,y))return false;
            precision='day';identity={day:d,month:m,year:y};
            canonical=iso?y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'):d+' de '+MONTH_PT[m]+' de '+y;
            return true;
        };
        if((match=/^([1-9]\d{3})(\d{2})(\d{2})$/.exec(raw))){
            if(!day(Number(match[3]),Number(match[2]),Number(match[1]),true))return null;
        }else if((match=/^([1-9]\d{3})-(\d{1,2})-(\d{1,2})$/.exec(raw))){
            if(!day(Number(match[3]),Number(match[2]),Number(match[1]),true))return null;
        }else if((match=/^(\d{1,2})[ \t]+-[ \t]*(\d{1,2})[ \t]*-[ \t]*([1-9]\d{3})$/.exec(raw))){
            // A first number greater than twelve rules out month-first input.
            if(Number(match[1])<=12||!day(Number(match[1]),Number(match[2]),Number(match[3])))return null;
        }else if((match=/^(\d{1,2})de([\p{L}.]+)de([1-9]\d{3})$/iu.exec(raw))){
            if(!day(Number(match[1]),v219CitationDateMonth(match[2]),Number(match[3])))return null;
        }else if((match=/^(\d{1,2})[ \t]+(?:de[ \t]+)?([\p{L}.]+)[ \t]+(?:de[ \t]+)?([1-9]\d{3})$/iu.exec(raw))||
            (match=/^([\p{L}.]+)[ \t]+(\d{1,2}),?[ \t]+([1-9]\d{3})$/iu.exec(raw))){
            const first=/^\d/.test(raw);
            if(!day(Number(match[first?1:2]),v219CitationDateMonth(match[first?2:1]),Number(match[3])))return null;
        }else if((match=/^(\d{1,2})[ \t]+a[ \t]+(\d{1,2})[ \t]+(?:de[ \t]+)?([\p{L}.]+)[ \t]+(?:de[ \t]+)?([1-9]\d{3})$/iu.exec(raw))){
            const first=Number(match[1]),last=Number(match[2]),month=v219CitationDateMonth(match[3]),year=Number(match[4]);
            if(kind==='year'||first>=last||!validDate(first,month,year)||!validDate(last,month,year))return null;
            precision='day-range';identity={first,last,month,year};canonical=first+'–'+last+' de '+MONTH_PT[month]+' de '+year;
        }else if((match=/^([\p{L}.]+)[ \t]+a[ \t]+([\p{L}.]+)[ \t]+(?:de[ \t]+)?([1-9]\d{3})$/iu.exec(raw))){
            const first=v219CitationDateMonth(match[1]),last=v219CitationDateMonth(match[2]),year=Number(match[3]);
            if(kind==='year'||!first||!last||first>=last)return null;
            precision='month-range';identity={first,last,year};canonical=MONTH_PT[first]+'–'+MONTH_PT[last]+' de '+year;
        }else if((match=/^([1-9]\d{3})[ \t]*(?:-|–|a)[ \t]*([1-9]\d{3})$/.exec(raw))){
            const first=Number(match[1]),last=Number(match[2]);if(first>=last)return null;
            precision='year-range';identity={first,last};canonical=first+'–'+last;
        }else if((match=/^([\p{L}.]+)[ \t]+(?:de[ \t]+)?([1-9]\d{3})$/iu.exec(raw))){
            const month=v219CitationDateMonth(match[1]),year=Number(match[2]);if(kind==='year'||!month)return null;
            precision='month';identity={month,year};canonical=MONTH_PT[month]+' de '+year;
        }else if(/^[1-9]\d{3}$/.test(raw)){
            precision='year';canonical=raw;identity={year:Number(raw)};
        }else return null;
        if(['access','archive'].includes(kind)&&precision!=='day')return null;
        return {text:padding[1]+canonical+padding[3],precision,identity,kind};
    }
    function v219CitationDateEdits(source,options={}) {
        const edits=v219LegacyCitationDateEdits(source,options);if(!edits.length)return edits;
        const shield=v24SyntaxProtected(source),ranges=[...shield.ranges,...v27SafeMarkdownRanges(source)],
            nodes=templates(protectedView(source)).nodes;
        return edits.filter(edit=>{
            if(ranges.some(range=>range.start<edit.end&&range.end>edit.start))return false;
            const owners=nodes.filter(node=>node.start<edit.start&&node.end>=edit.end).sort((a,b)=>a.start-b.start||b.end-a.end);
            return owners.every((node,index)=>{
                if(index===owners.length-1)return true;
                const raw=source.slice(node.start,node.end),name=parsedTemplate(raw).name;
                return v215LiteralTemplateIdentity(raw)&&!!(INFOBOX_CATALOG[name]||TEMPLATE_CATALOG[name]||CITE_NAMES[name]);
            });
        });
    }
