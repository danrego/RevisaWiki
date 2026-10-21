    // Oficial70230751 reads lower-case url after positional 1. An invalid
    // case variant may be repaired only when its supplied literal is a URL.
    function v219OfficialUrlParameterSafe(raw,profile,entries) {
        if(profile?.title!=='Oficial')return true;
        const candidates=entries.filter(entry=>!entry.positional&&entry.key!=='url'&&norm(entry.key)==='url');
        if(!candidates.length)return true;
        if(profile.oldid!==70230751||candidates.length!==1)return false;
        const entry=candidates[0],part=v215BraceParts(raw.slice(2,-2))[entry.index]?.text;
        if(!part||!/^[ \t\r\n]*[uU][rR][lL][ \t]*=/.test(part)||
            entries.some(other=>other!==entry&&(other.key==='url'||other.key==='1')))return false;
        const value=entry.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
        return !/[\uE000-\uF8FF]/.test(value)&&!!v213LiteralURL(value);
    }

    function v219OfficialUrlCallRefusal(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return false;
        const literal=v219ReaderLiteralHeader(raw);
        if(literal!==null&&!v215SameTemplateTitle(literal,'Oficial')&&!v215SameTemplateTitle(literal,'Official website'))return false;
        const parts=v215BraceParts(raw.slice(2,-2));if(!parts.length)return false;
        if(!v215SameTemplateTitle(parts[0].text,'Oficial')&&!v215SameTemplateTitle(parts[0].text,'Official website'))return false;
        return !v219OfficialUrlParameterSafe(raw,TEMPLATE_CATALOG.oficial,foreignEntries({parts:parts.map(part=>part.text)}));
    }
