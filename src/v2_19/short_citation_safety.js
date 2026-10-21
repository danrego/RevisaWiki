    // Native Sfn reads explicit author/year slots. A missing slot is not
    // permission to compact later named numeric arguments into earlier ones.
    function v219NativeShortCitationRefusal(raw,profile) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));
        if(!parts?.length||/[{}<>\r\n\uE000-\uF8FF]/.test(parts[0].text)||
            !v215SameTemplateTitle(parts[0].text,'Sfn'))return null;
        return {profile,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,
            issues:[],issueEvidence:[],proof:{kind:'accepted-native-short-citation',
                nativeTemplateOldid:67697954,nativeModuleOldid:52819217,
                condition:'the exact native Sfn call and every explicit numeric author/year binding remain unchanged; native slot5 can mean et al. and cannot be packed into slot3'}};
    }

    // Foreign short-note wrappers can choose different generated names,
    // groups and bibliography targets even when their positional fields look
    // alike. A header change alone does not prove those dependencies survive.
    function v219ForeignShortCitationRefusal(raw,profile) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}')||
            !profile||!['Sfn','Sfnp','Sfnm','Sfnmp','HarvRef'].includes(profile.target))return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));
        if(!parts?.length)return null;
        const title=v215TemplateTitle(parts[0].text);
        if(/^[Ss]fn(?:p|m|mp)?$|^[Hh]arvRef$/.test(title))return null;
        return {profile,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,
            issues:[],issueEvidence:[],proof:{kind:'foreign-short-reference-dependencies-unproved',
                sourceOldid:Number.isSafeInteger(profile.source?.oldid)?profile.source.oldid:null,
                nativeTarget:profile.target,nativeTemplateOldid:profile.target==='Sfn'?67697954:null,
                nativeModuleOldid:52819217,
                condition:'the foreign wrapper has no approved source-bound equivalence for generated names, group selection and bibliography dependencies; retain the complete original call'}};
    }
