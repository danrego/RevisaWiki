    // These literal native calls have finite source-reviewed interfaces. This
    // classification only keeps their unchanged argument text visible to
    // existing subject checks. It does not authorize rewriting their fields.
    const V219_NATIVE_NATIONALITY_EMITTERS=Object.freeze({
        RUSn:50288640,FRAn:48873110,NORn:49236043,BRAn:49855292,
        PRTn:65025142,PORn:46315261,ESPn:49234918,ITAn:68629075,
        SWEn:53662600,SUEn:49236330
    });
    const V219_NATIVE_TAXON_EMITTERS=Object.freeze({
        Taxobox:{oldid:72742269,keys:['name','nome','genus','género','gênero','species','espécie',
            'regnum','reino','domain','domínio','classis','classe','ordo','ordem','virus_group','grupo_viral']},
        Speciesbox:{oldid:67142015,keys:['name','nome','taxon','táxon','genus','género','gênero','species','espécie']},
        'Automatic taxobox':{oldid:64110476,keys:[]}
    });
    function v219NativeTopicEmitterTitle(part) {
        if(typeof part!=='string'||/[{}<>\r\n\uE000-\uF8FF]/.test(part))return null;
        const title=part.replace(/_/g,' ').replace(/\s+/g,' ').trim()
            .replace(/^(?:Template|Predefinição)\s*:\s*/i,'');
        if(!title||title.includes(':'))return null;
        return title[0].toLocaleUpperCase('pt')+title.slice(1);
    }
    function v219NativeTopicEmitterValue(value) {
        const literal=value.trim();
        if(!literal)return true;
        if(/[{}<>\u0000-\u001f\u007f\uE000-\uF8FF]/.test(literal))return false;
        // A single literal wikilink is allowed as a value. Arbitrary template
        // content and embedded code stay opaque to all maintenance stages.
        return !/[\[\]|]/.test(literal)||/^\[\[[^\[\]{}<>\r\n|]+(?:\|[^\[\]{}<>\r\n|]+)?\]\]$/.test(literal);
    }
    function v219NativeTopicEmitterCall(raw) {
        if(typeof raw!=='string'||raw.length>32768||!raw.startsWith('{{')||!raw.endsWith('}}'))return false;
        const parts=splitParts(raw.slice(2,-2)),title=v219NativeTopicEmitterTitle(parts[0]);
        if(!title)return false;
        if(Object.prototype.hasOwnProperty.call(V219_NATIVE_NATIONALITY_EMITTERS,title)) {
            if(parts.length===1)return true;
            if(parts.length!==2)return false;
            return /^\s*(?:1\s*=\s*)?[oa]\s*$/.test(parts[1]);
        }
        const contract=V219_NATIVE_TAXON_EMITTERS[title];
        if(!contract||parts.length>33)return false;
        const seen=new Set();
        for(const part of parts.slice(1)) {
            const field=/^\s*([^=]+?)\s*=([\s\S]*)$/.exec(part);
            if(!field||!contract.keys.includes(field[1])||seen.has(field[1])||
                !v219NativeTopicEmitterValue(field[2]))return false;
            seen.add(field[1]);
        }
        return true;
    }
