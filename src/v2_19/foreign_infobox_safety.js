    // Source selection is not inferred from translated parameter names.
    // ES persona 149592279/174164758 and película 149592502/168323586
    // suppress literal "no" and remove empty fields before alias fallback.
    // DE Film 271099997 does not consume Bildbeschreibung.
    function v219ForeignInfoboxRefusal(raw,profile=null) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return null;
        const parts=splitParts(raw.slice(2,-2)),parsed={parts},key=norm(parts[0].replace(/_/g,' ')),
            native=INFOBOX_CATALOG[key];
        // A title role in a citation does not establish a person's name.
        // Retain an ignored mixed-language key in an existing native box.
        if(native&&v215SameTemplateTitle(parts[0],native.title)&&!infoboxAccepts(native,'titre')&&
            foreignEntries(parsed).some(entry=>!entry.positional&&norm(entry.key)==='titre')){
            const profile={kind:'infobox',target:native.title,source:{language:'pt',title:'Predefinição:'+native.title,oldid:native.oldid}};
            return {profile,candidate:raw,text:raw,handled:true,converted:false,blocked:true,quietNativeRefusal:true,
                issues:[],issueEvidence:[],proof:{kind:'native-infobox-ignored-key-retention',nativeOldid:native.oldid,
                    reason:'unproved-native-titre-role',sourceHash:v24SyntaxHash(raw)}};
        }
        if(v219OtherNativeHeader(raw))return null;
        const direct=Object.hasOwn(TRANSLATION_RULES.profiles,key)?TRANSLATION_RULES.profiles[key]:null;
        if(!direct||direct.kind!=='infobox')return null;
        profile=direct;
        const spanish=profile.source?.language==='es'&&
            ['Plantilla:Ficha de persona','Plantilla:Ficha de científico','Plantilla:Ficha de película'].includes(profile.source.title),
            german=profile.source?.language==='de'&&profile.source.title==='Vorlage:Infobox Film'&&profile.source.oldid===271099997;
        if(!spanish&&!german)return null;
        const entries=foreignEntries(parsed),keys=entries.map(entry=>norm(entry.key)),
            ascii=value=>value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
        let reason='';
        if(spanish&&entries.some(entry=>ascii(entry.value)==='no'))reason='source-suppression-value';
        else if(spanish&&profile.source.title!=='Plantilla:Ficha de película'&&keys.some(key=>key==='padre'||key==='madre'))
            reason='unproved-source-parent-role';
        else if(spanish&&profile.source.title==='Plantilla:Ficha de película'&&keys.includes('año')&&keys.includes('estreno'))
            reason='source-year-alias-priority';
        else if(german&&keys.includes('bildbeschreibung'))reason='unproved-source-caption-role';
        if(!reason)return null;
        return {profile,candidate:raw,text:raw,handled:true,converted:false,blocked:true,quietNativeRefusal:true,
            issues:[],issueEvidence:[],proof:{kind:'source-bound-foreign-infobox-refusal',reason,
                sourceTemplateOldid:german?271099997:profile.source.title==='Plantilla:Ficha de película'?149592502:149592279,
                sourceModuleOldid:german?null:profile.source.title==='Plantilla:Ficha de película'?168323586:174164758}};
    }
