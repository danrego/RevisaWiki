    // Exact local inline Harvard wrappers consume Ref and ignore ref.
    // Their foreign/module interfaces are deliberately not inferred here.
    function v219NativeHarvardKeyActivationRefusal(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}')||!/harv/i.test(raw))return false;
        const parsed=parsedTemplate(raw),pins={harvnb:['Harvnb',50774774],harvtxt:['Harvtxt',70788993],harvcoltxt:['Harvcoltxt',67090727]},
            header=parsed.parts[0],identity=norm(v215TemplateTitle(header)),pin=pins[identity],profile=TEMPLATE_CATALOG[identity];
        if(!pin||profile?.oldid!==pin[1]||!profile.accepted.includes('Ref')||
            !v215SameTemplateTitle(header,pin[0])||!v215LiteralTemplateIdentity(raw,profile)||
            /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(header)||/[^\S \t\r\n]/u.test(header))return false;
        return foreignEntries(parsed).some(field=>!field.positional&&field.key!=='Ref'&&norm(field.key)===norm('Ref'));
    }
