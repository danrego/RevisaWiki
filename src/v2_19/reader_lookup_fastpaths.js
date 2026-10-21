    // Exact native title lookup for the same immutable catalog epoch. A cheap
    // literal-header rejection avoids parsing argument banks for unrelated calls.
    // Known or irregular headers still use the complete original reader.
    var v219TitleRecordLookupMemo, v219CitationRedirectRecordsMemo;
    var v219ReaderTitleKeyMemo, v219ReaderNativeNameMemo;
    function v219ReaderTitleKey(value) {
        const title=v215TemplateTitle(value);if(!title)return null;
        const direct=()=>JSON.stringify([title[0].toLocaleUpperCase('pt'),title.slice(1)]);
        if(typeof value!=='string'||value.length>512||title.length>512)return direct();
        v219ReaderTitleKeyMemo ||= new Map();
        if(v219ReaderTitleKeyMemo.has(title))return v219ReaderTitleKeyMemo.get(title);
        const result=direct();
        if(v219ReaderTitleKeyMemo.size>=2048)v219ReaderTitleKeyMemo.delete(v219ReaderTitleKeyMemo.keys().next().value);
        v219ReaderTitleKeyMemo.set(title,result);return result;
    }
    function v219ReaderNativeName(value) {
        if(typeof value!=='string'||value.length>512)return norm(v215TemplateTitle(value));
        v219ReaderNativeNameMemo ||= new Map();
        if(v219ReaderNativeNameMemo.has(value))return v219ReaderNativeNameMemo.get(value);
        const result=norm(v215TemplateTitle(value));
        if(v219ReaderNativeNameMemo.size>=2048)v219ReaderNativeNameMemo.delete(v219ReaderNativeNameMemo.keys().next().value);
        v219ReaderNativeNameMemo.set(value,result);return result;
    }
    function v219TitleRecordLookup(value,records) {
        if(!(records===V219_OTHER_NATIVE_ALIASES||records===V219_OTHER_NATIVE_WRAPPERS||
            v219CitationRedirectRecordsMemo!==undefined&&records===v219CitationRedirectRecordsMemo)||!Object.isFrozen(records))
            return records.find(record=>v215SameTemplateTitle(value,record.title))||null;
        v219TitleRecordLookupMemo ||= new WeakMap();
        let cached=v219TitleRecordLookupMemo.get(records),stale=!cached||cached.titles.length!==records.length;
        if(!stale)for(let index=0;index<records.length;index++){
            if(records[index].title!==cached.titles[index]){stale=true;break;}
        }
        if(stale){
            const titles=records.map(record=>record.title),index=new Map();
            for(const record of records){const key=v219ReaderTitleKey(record.title);if(!key)continue;
                if(!index.has(key))index.set(key,record);
            }
            cached={titles,index};v219TitleRecordLookupMemo.set(records,cached);
        }
        const key=v219ReaderTitleKey(value);return key?cached.index.get(key)||null:null;
    }
    function v219CitationRedirectRecords() {
        return v219CitationRedirectRecordsMemo ||= Object.freeze([...V219_NATIVE_CITATION_REDIRECTS,...V219_ADDITIONAL_NATIVE_CITATION_REDIRECTS]);
    }
    function v219ReaderLiteralHeader(raw) {
        const match=/^\{\{([^{}|]*)(?:\||\}\})/u.exec(raw);
        return match&&!/[<>\[\]]/.test(match[1])?match[1]:null;
    }
