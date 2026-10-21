    // These local templates already have native implementations. Replacing
    // them with Dni/Morte can add birth/death categories to lists and tables,
    // and can alter age, link and microformat behavior. Preserve the call.
    const V219_NATIVE_DATE_WRAPPER_PRESERVATION=Object.freeze({
        'Birth date':58362992,'Death date':58364211,
        'Death date and age':50557924,Date:59283611
    });
    function v219NativeDateWrapperPreserved(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return false;
        const parts=v24SyntaxParts(raw.slice(2,-2));
        if(!parts?.length||/[{}<>\r\n\uE000-\uF8FF]/.test(parts[0].text))return false;
        return Object.keys(V219_NATIVE_DATE_WRAPPER_PRESERVATION).some(title=>
            v215SameTemplateTitle(parts[0].text,title));
    }
    function v219DateWrapperMigrationRefusal(raw,profile) {
        const native=v219NativeDateWrapperPreserved(raw),
            foreignBirth=profile?.kind==='date'&&profile.birth===true;
        if(!native&&!foreignBirth)return null;
        return {profile,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,
            issues:[],issueEvidence:[],proof:{
                kind:native?'accepted-native-date-wrapper':'unproved-birth-category-equivalence',
                condition:native?'the exact local native date implementation is preserved, including every argument byte, age, links, hidden date and category behavior':
                    'a foreign birth-date call does not authorize adding native birth-year or living-person categories; no principal-person or no-category equivalence has been proved'
            }};
    }
