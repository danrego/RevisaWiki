    // Only explicitly reviewed news classes receive the newspaper formatter.
    // A missing URL never establishes a different kind of publication.
    const V281_CITATION_NEWS_PROFILES=Object.freeze([
        {language:'es',title:'Plantilla:Cita noticia',oldid:null,verifiedOldid:149592334,citationClass:'noticia'},
        {language:'uk',title:'Шаблон:Cite news',oldid:42405689,verifiedOldid:42405689,citationClass:'news'},
        {language:'tr',title:'Şablon:Haber kaynağı',oldid:35161944,verifiedOldid:35161944,citationClass:'haber'},
        {language:'he',title:'תבנית:Cite news',oldid:33360675,verifiedOldid:33360675,citationClass:'news'},
        {language:'it',title:'Template:Cita news',oldid:91879730,verifiedOldid:91879730,citationClass:'news'},
        {language:'ro',title:'Format:Citat știre',oldid:14027248,verifiedOldid:14027248,citationClass:'news'},
        {language:'ko',title:'틀:뉴스 인용',oldid:40659264,verifiedOldid:40659264,citationClass:'news'},
        {language:'zh-yue',title:'Template:Cite news',oldid:1112516,verifiedOldid:1112516,citationClass:'news'},
        {language:'vi',title:'Bản mẫu:Chú thích báo',oldid:11397954,verifiedOldid:11397954,citationClass:'news'},
        {language:'th',title:'แม่แบบ:Cite news',oldid:12018825,verifiedOldid:12018825,citationClass:'news'}
    ].map(profile=>Object.freeze(profile)));
    function v281CitationProfile(raw,profile) {
        if(!profile||profile.kind!=='citation'||norm(profile.target)!=='citation'||parsedTemplate(raw).name==='citation')return profile;
        const source=profile.source,confirmed=source&&V281_CITATION_NEWS_PROFILES.some(contract=>source.language===contract.language&&source.title===contract.title&&(source.oldid??null)===contract.oldid);
        return confirmed?{...profile,target:'Citar jornal',strictNativeCitation:true}:profile;
    }
    function translationProfile(raw) {return v281CitationProfile(raw,v281LegacyTranslationProfile(raw));}
    function v281QuietCitationRefusal(raw,profile,cfg=DEFAULTS) {
        return !!profile?.strictNativeCitation&&!!migrateForeignTemplate(raw,cfg)?.quietNativeRefusal;
    }
    function v281CitationObligation(raw,cfg) {
        const parsed=parsedTemplate(raw);let family=CITE_NAMES[parsed.name];
        if(!family){
            const profile=translationProfile(raw);if(!profile||profile.kind!=='citation')return null;
            const migration=migrateForeignTemplate(raw,cfg);
            family=migration&&!migration.blocked?migration.profile.target:'foreign:'+parsed.name;
        }
        // The family comes from the declared name or an approved migration,
        // separately from the cleanup used to compare title/identifier fields.
        const canonical=raw.slice(2,-2).includes('{{')?mapTemplateTree(raw,node=>v24InventoryTemplate(node,cfg)):v24InventoryTemplate(raw,cfg),fields=foreignEntries(parsedTemplate(canonical)),anchors=[],dates=[];
        for(const field of fields){
            if(field.positional||!field.value.trim())continue;
            const key=norm(citationParam(field.key,norm(family)));
            if(['título','url','doi','isbn','pmid','pmc'].includes(key))anchors.push([key,v24InventoryText(field.value,cfg)]);
            if(key==='acessodata')dates.push(v24InventorySpace(cfg.dates?normalizeDate(field.value,()=>{}):field.value));
        }
        return JSON.stringify([norm(family),anchors.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),[...new Set(dates)].sort()]);
    }
    function v281CitationRetention(before,after,options={}) {
        if(before===after||!before.includes('{{'))return {accepted:true,reason:''};
        const cfg={...DEFAULTS,...options},memo=new Map(),collect=source=>{
            const view=protectedView(source),out=new Set();
            for(const node of templates(view).nodes){
                const header=/^([^|{}\r\n]+)/.exec(source.slice(node.start+2,Math.min(node.end,node.start+242)));if(!header)continue;
                const name=nameOf(header[1]),literal=norm(header[1]),registered=TRANSLATION_RULES.profiles[literal]||TRANSLATION_RULES.profiles[literal.replace(TRANSLATION_PREFIX,'')];
                if(!CITE_NAMES[name]&&registered?.kind!=='citation')continue;
                const raw=source.slice(node.start,node.end);if(!memo.has(raw))memo.set(raw,v281CitationObligation(raw,cfg));const key=memo.get(raw);if(key!==null)out.add(key);
            }
            return out;
        },required=collect(before);
        if(!required.size)return {accepted:true,reason:''};const retained=collect(after);
        for(const key of required)if(!retained.has(key))return {accepted:false,reason:'Uma referência perdeu o tipo de citação ou a data de consulta ligada aos mesmos título e identificadores.'};
        return {accepted:true,reason:''};
    }
    function preservationAudit(before,after,options={}) {
        const findings=v281PreviousPreservationAudit(before,after,options),proof=v281CitationRetention(before,after,options);
        if(!proof.accepted)findings.push({code:'lost-citation-metadata',message:proof.reason,start:-1,severity:'warning'});
        return findings;
    }
    function safeComposition(before,after,options={}) {
        const proof=v281CitationRetention(before,after,options);return proof.accepted?v281PreviousSafeComposition(before,after,options):proof.reason;
    }
