    // Compare complete native CS1 citations by the native argument roles,
    // without changing any accepted key or the first reference's raw body.
    // The existing reference planner still owns groups, collectors, names,
    // opaque owners, source freshness and every actual replacement.
    function v219NativeCitationSemanticSignature(body,cfg={}) {
        if(v219CitationHeaderControlRefusal(body?.trim()))return null;
        if(typeof body!=='string')return null;
        const raw=body.trim();
        if(!raw.startsWith('{{')||!raw.endsWith('}}')||
            /[{}\[\]<>\u0000-\u001F\u007F\uE000-\uF8FF]/.test(raw.slice(2,-2))||
            raw.includes("''"))return null;
        const parsed=parsedTemplate(raw),local=v219LocalCitationRedirectProfile(raw),
            profile=local?TEMPLATE_CATALOG[norm(local.target)]:TEMPLATE_CATALOG[parsed.name];
        if(!profile||!profile.dependencies?.some(item=>item.title==='Módulo:Citação/CS1/Configuração'&&item.oldid===73016847)||
            !profile.dependencies?.some(item=>item.title==='Módulo:Citação/CS1/Whitelist'&&item.oldid===71860752)||
            !local&&!v215LiteralTemplateIdentity(raw,profile))return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts||parts.length<3)return null;
        const fields=[],seenRoles=new Set(),seenKeys=new Set();
        for(const part of parts.slice(1)){
            const equals=part.text.indexOf('=');if(equals<1)return null;
            const key=part.text.slice(0,equals).trim(),value=part.text.slice(equals+1).trim(),
                roles=v219NativeCitationRoles(key);
            const accepted=profileAccepts(profile,key)||profileAccepts(profile,key.replace(/\d+/g,'#'));
            if(!key||!value||seenKeys.has(key)||!accepted||roles.length!==1)return null;
            const role=roles[0];
            if(seenRoles.has(role)||/^(?:Ref|PostScript|Mode|DF|NoTracking|NoPP|NameListFormat|DisplayAuthors|DisplayEditors|LastAuthorAmp|IgnoreISBN|RegistrationRequired|SubscriptionRequired)$/.test(role))return null;
            seenKeys.add(key);seenRoles.add(role);fields.push([role,value]);
        }
        if(!seenRoles.has('Title'))return null;
        fields.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
        return JSON.stringify(['native-cs1-role-values',profile.title,fields]);
    }
