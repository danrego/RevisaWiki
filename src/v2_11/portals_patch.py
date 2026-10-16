"""Add finite, source-preserving subject portal rules to the frozen baseline."""


def once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Portal patch anchor is absent or repeated: ' + before[:80])
    return source.replace(before, after, 1)


MODULE = r'''
    // Native profile contracts and canonical targets were checked against
    // permanent source revisions. Unknown fields never create a specific topic.
    function v211FooterLookupNeeded(cfg) {
        return !!(cfg.endTemplateOrder||cfg.portals&&(cfg.biographyPortal||cfg.automaticBiographyPortals||cfg.automaticTopicPortals));
    }
    function v211FooterLookupFailure(cfg) {
        return cfg.endTemplateOrder?'Não foi possível confirmar todas as predefinições finais. Os blocos sem equivalência confirmada serão preservados.':null;
    }
    const V211_TOPIC_PROFILES=new Set(['info/filme','info/televisão','info/série de televisão',
        'info/taxonomia','taxobox','speciesbox','automatic taxobox','info/vacina',
        'info/droga','info/patologia','info/doença','info/química']);
    const V211_TAXON_PROFILES=new Set(['info/taxonomia','taxobox','speciesbox','automatic taxobox']);
    const V211_TV_FORMATS=new Set(['telejornal','jornalístico','telenovela','minissérie','minissérie animada',
        'microssérie','sitcom','série','seriado','programa de auditório','série de desenho animado',
        'série animada','desenho animado','animação','desenho','reality show','talk show',
        'late-night talk show','talent show','entrevista','entrevistas','religioso','educativo',
        'didático','erótico','game show','concerto','programa de variedades','debate','documentário',
        'telefilme','telefilme animado']);
    const V211_TV_ENTERTAINMENT=new Set(['telenovela','minissérie','minissérie animada','microssérie',
        'sitcom','série','seriado','programa de auditório','série de desenho animado','série animada',
        'desenho animado','animação','desenho','reality show','talk show','late-night talk show',
        'talent show','erótico','game show','concerto','programa de variedades','telefilme','telefilme animado']);
    const V211_TV_ANIMATION=new Set(['minissérie animada','série de desenho animado','série animada',
        'desenho animado','animação','desenho','telefilme animado']);
    const V211_TOPIC_PORTALS=new Set(['Cinema','Entretenimento','Televisão','Animação','Biologia',
        'Zoologia','Botânica','Micologia','Microbiologia','Vírus','Mamíferos','Entomologia',
        'Aves','Anfíbios e répteis','Peixes','Farmácia','Medicina','Saúde'].map(portalIdentity));
    const V211_TAXON_LATIN=new Set(['animalia','plantae','fungi','bacteria','eubacteria','monera','archaea',
        'eukaryota','eukarya','eukariota','mammalia','insecta','aves','amphibia','reptilia','sauropsida',
        'chondrichthyes','sarcopterygii','osteichthyes','squamata','crocodylia','crocodilia','testudines','sphenodontia']);
    const V211_TAXON_EQUIVALENTS=ownDictionary({eukarya:'eukaryota',eukariota:'eukaryota',crocodilia:'crocodylia'});
    function v211Scalar(value) {
        let text=protectedView(value);
        if(malformedRefs(text))return null;
        text=applyEdits(text,refTokens(text).map(r=>({start:r.start,end:r.end,text:''}))).trim();
        text=text.replace(/^('{2,3})([\s\S]*?)\1$/,'$2').trim();
        const link=text.match(/^\[\[([^|\]#]+)(?:\|([^\]]+))?\]\]$/);
        if(link){
            const target=norm(link[1]),label=norm((link[2]||'').replace(/^'{2,5}|'{2,5}$/g,''));
            const identity=value=>V211_TAXON_EQUIVALENTS[value]||value;
            if(V211_TAXON_LATIN.has(target)&&V211_TAXON_LATIN.has(label)&&identity(target)!==identity(label))return null;
            text=link[1].trim();
        }
        if(!text||/[{}<>\[\]\uE000\uE001\n]/.test(text)||/\?|\b(?:ou|talvez|incert[oa]|desconhecid[oa])\b/iu.test(text))return null;
        return norm(text);
    }
    function v211Field(box,keys) {
        const entries=box.fields.filter(e=>keys.includes(norm(e.key))&&e.value.trim());
        if(!entries.length)return {present:false,value:null,conflict:false};
        const values=entries.map(e=>v211Scalar(e.value)),unique=new Set(values);
        return {present:true,value:unique.size===1?values[0]:null,conflict:values.some(v=>v===null)||unique.size!==1};
    }
    function v211PrincipalTopicBox(source,cfg={}) {
        if(cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.pageRedirect||cfg.pageDisambiguation||
            /^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle||'')))return null;
        const {view,nodes}=biographyNodes(source);
        if(/^\s*#(?:REDIRECT|REDIRECIONAMENTO)\b/i.test(view)||/~{4}/.test(view))return null;
        const name=n=>parsedTemplate(source.slice(n.start,n.end)).name.replace(/^(?:predefinição|template)\s*:\s*/,'');
        if(nodes.some(n=>/^(?:desambig(?:uação)?|disambig|desambiguar)$/.test(name(n))))return null;
        const boxes=nodes.filter(n=>/^(?:info\/|infobox\b)/.test(name(n))||V211_TAXON_PROFILES.has(name(n)));
        if(boxes.length!==1||!V211_TOPIC_PROFILES.has(name(boxes[0])))return null;
        const node=boxes[0],firstSection=view.search(/^={2,6}[^=\n].*?={2,6}\s*$/m);
        if(firstSection>=0&&node.start>=firstSection)return null;
        const start=view.lastIndexOf('\n',node.start-1)+1,at=view.indexOf('\n',node.end),end=at<0?view.length:at;
        if(view.slice(start,node.start).trim()||view.slice(node.end,end).trim())return null;
        const p=parsedTemplate(source.slice(node.start,node.end)),fields=foreignEntries(p);
        if(fields.some(e=>['embed','child','embutido','subcaixa'].includes(norm(e.key))&&e.value.trim()&&
            !/^(?:não|nao|no|false|0)$/i.test(e.value.trim())))return null;
        return {infobox:name(node),node,p,fields};
    }
    function v211ProductionCountries(box) {
        const fields=box.fields.filter(e=>['país','pais'].includes(norm(e.key))&&e.value.trim());
        if(!fields.length)return [];
        const results=[];
        for(const field of fields) {
            let text=protectedView(field.value);
            if(malformedRefs(text))return [];
            text=applyEdits(text,refTokens(text).map(r=>({start:r.start,end:r.end,text:''})));
            text=text.replace(/<br\s*\/?\s*>/gi,'\n').trim();
            if(/[{}<>\uE000\uE001]/.test(text))return [];
            const countries=[];
            for(const part of text.split(/[,;\n]|\s+e\s+/i)) {
                const key=v211Scalar(part);if(!key)return [];
                const name=COUNTRY_PORTALS[key]||ownDictionary({'estados unidos da américa':'Estados Unidos','eua':'Estados Unidos',
                    'polónia':'Polônia','roménia':'Romênia','holanda':'Países Baixos'})[key];
                if(!name||!VERIFIED_BIOGRAPHY_PORTALS.has(portalIdentity(name)))return [];
                const link=part.trim().match(/^\[\[([^|\]]+)\|([^\]]+)\]\]$/);
                if(link&&COUNTRY_PORTALS[norm(link[2])]&&portalIdentity(COUNTRY_PORTALS[norm(link[2])])!==portalIdentity(name))return [];
                countries.push(name);
            }
            results.push([...new Set(countries)]);
        }
        if(results.some(row=>JSON.stringify(row.slice().sort())!==JSON.stringify(results[0].slice().sort())))return [];
        return results[0];
    }
    function v211DrugChemistry(box) {
        const nested=[];
        for(const field of box.fields) {
            if(!/^seção\d+$|^section\d+$/i.test(field.key.trim()))continue;
            const value=field.value.trim(),nodes=topNodes(protectedView(value));
            if(nodes.length!==1||nodes[0].start!==0||nodes[0].end!==value.length)continue;
            const p=parsedTemplate(value),name=p.name;
            if(['chembox identifiers','info/química/identifiers','chembox pharmacology'].includes(name))nested.push({name,fields:foreignEntries(p)});
        }
        const identifiers=nested.filter(n=>['chembox identifiers','info/química/identifiers'].includes(n.name)),pharmacology=nested.filter(n=>n.name==='chembox pharmacology');
        if(identifiers.length!==1||pharmacology.length!==1)return false;
        const prefix=v211Field(identifiers[0],['atc prefix','atccode prefix']),suffix=v211Field(identifiers[0],['atc suffix','atccode suffix']);
        if(prefix.conflict||suffix.conflict||!prefix.value||!suffix.value||!/^[a-z]\d{2}$/i.test(prefix.value)||!/^\d?[a-z]{2}\d{2}$/i.test(suffix.value))return false;
        // A copied empty pharmacology skeleton is not a classification.
        return pharmacology[0].fields.some(e=>['drugclass','classe','adminroutes','bioavail','halflife','routes of administration','vias de administração',
            'metabolism','metabolismo','bioavailability','biodisponibilidade','elimination half-life',
            'meia-vida','excretion','excreção'].includes(norm(e.key))&&e.value.trim()&&!/^(?:\?|n\/a|desconhecid[oa])$/i.test(e.value.trim()));
    }
    function v211TaxonPortals(box) {
        const desired=['Biologia'];
        if(['speciesbox','automatic taxobox'].includes(box.infobox))return desired;
        const kingdom=v211Field(box,['reino','regnum']),domain=v211Field(box,['domínio','dominio','domain']),
            rank=v211Field(box,['classe','classis']),order=v211Field(box,['ordem','ordo']),viral=v211Field(box,['grupo viral','virus group']);
        if(kingdom.conflict||domain.conflict||viral.conflict)return desired;
        if(['animalia','plantae','fungi'].includes(kingdom.value)&&domain.present&&
            !['eukaryota','eukarya','eukariota'].includes(domain.value))return desired;
        const virus=viral.value&&/^(?:i|ii|iii|iv|v|vi|vii)$/.test(viral.value),bacteria=domain.value==='bacteria';
        if(virus&&kingdom.value||bacteria&&kingdom.value&&!['monera','bacteria','eubacteria'].includes(kingdom.value))return desired;
        if(virus&&bacteria)return desired;
        if(virus)return desired.concat('Vírus');
        if(bacteria)return desired.concat('Microbiologia');
        if(kingdom.value==='plantae')return desired.concat('Botânica');
        if(kingdom.value==='fungi')return desired.concat('Micologia');
        if(kingdom.value!=='animalia')return desired;
        desired.push('Zoologia');if(rank.conflict||order.conflict)return desired;
        const map=ownDictionary({mammalia:'Mamíferos',insecta:'Entomologia',aves:'Aves',amphibia:'Anfíbios e répteis',
            reptilia:'Anfíbios e répteis',chondrichthyes:'Peixes'});
        const reptileOrder=['squamata','crocodylia','crocodilia','testudines','sphenodontia'].includes(order.value);
        if(reptileOrder&&rank.value&&!['reptilia','sauropsida'].includes(rank.value))return desired;
        if(map[rank.value])desired.push(map[rank.value]);
        else if(rank.value==='sauropsida'&&reptileOrder)desired.push('Anfíbios e répteis');
        return desired;
    }
    function v211TopicPortalCandidates(source,cfg={}) {
        const box=v211PrincipalTopicBox(source,cfg);if(!box)return [];
        let desired=[];
        if(box.infobox==='info/filme')desired=['Cinema','Entretenimento',...v211ProductionCountries(box)];
        else if(['info/televisão','info/série de televisão'].includes(box.infobox)) {
            const format=v211Field(box,['formato']);
            if(format.conflict||!V211_TV_FORMATS.has(format.value))return [];
            desired.push('Televisão');
            if(V211_TV_ENTERTAINMENT.has(format.value))desired.push('Entretenimento');
            if(V211_TV_ANIMATION.has(format.value))desired.push('Animação');
            desired.push(...v211ProductionCountries(box));
        }else if(V211_TAXON_PROFILES.has(box.infobox))desired=v211TaxonPortals(box);
        else if(box.infobox==='info/vacina')desired=['Farmácia','Medicina','Saúde'];
        else if(box.infobox==='info/droga')desired=['Farmácia'];
        else if(['info/patologia','info/doença'].includes(box.infobox))desired=['Medicina','Saúde'];
        else if(box.infobox==='info/química'&&v211DrugChemistry(box))desired=['Farmácia'];
        return [...new Set(desired)].filter(name=>V211_TOPIC_PORTALS.has(portalIdentity(name))||
            Object.values(COUNTRY_PORTALS).some(country=>portalIdentity(country)===portalIdentity(name)));
    }
    function addAutomaticTopicPortals(source,cfg,bump) {
        if(!cfg.portals||!cfg.endMatter||!cfg.automaticTopicPortals)return source;
        return v211AppendConfirmedPortals(source,cfg,bump,v211TopicPortalCandidates(source,cfg),'automaticTopicPortals');
    }
'''


def apply(source):
    source=once(source,'automaticSpelling: true, automaticBiographyPortals: true,','automaticSpelling: true, automaticBiographyPortals: true, automaticTopicPortals: true,')
    source=once(source,"automaticBiographyPortals: 'Portais de biografias acrescentados',","automaticBiographyPortals: 'Portais de biografias acrescentados', automaticTopicPortals: 'Portais temáticos confirmados acrescentados',")
    source=once(source,"'info/ciclista', 'info/artista marcial', 'info/futebolista', 'info/treinador de futebol',","'info/ciclista', 'info/artista marcial', 'info/futebolista', 'info/futebol', 'info/treinador de futebol',")
    source=once(source,'    const SPORTS_BOXES=new Set(',"    SPORTS_BOX_PORTALS['info/futebol']=['Futebol'];\n    const SPORTS_BOXES=new Set(")
    source=once(source,'    const SPORT_PORTAL_IDENTITIES=new Set(',"    SPORT_LABEL_PORTALS.futsal=['Esportes'];\n    const SPORT_PORTAL_IDENTITIES=new Set(")
    source=once(source,'    function portalIdentity(value)',"    Object.assign(PORTAL_IDENTITY_ALIASES,{'animais':'zoologia','plantas':'botânica','fungos':'micologia',\n        'insetos':'entomologia','virologia':'vírus','répteis':'anfíbios e répteis'});\n    function portalIdentity(value)")
    source=once(source,"if (names.some(n => FOOTER_NAVBOXES.has(n)) || /\\{\\{\\s*#invoke\\s*:\\s*Navbox\\b/i.test(view)) return 'navbox';", "if (names.some(n => FOOTER_NAVBOXES.has(n) || ['time','info/time'].includes(n)) || /\\{\\{\\s*#invoke\\s*:\\s*Navbox\\b/i.test(view)) return 'navbox';")
    source=once(source,"const names = cfg.endTemplateOrder ? footerCandidates(task.source) : [];", "const names = v211FooterLookupNeeded(cfg) ? footerCandidates(task.source) : [];")
    source=once(source,"task.guard(); cfg.footerLookupWarning = 'Não foi possível confirmar todas as predefinições finais. Os blocos sem equivalência confirmada serão preservados.';", "task.guard(); const warning=v211FooterLookupFailure(cfg); if(warning)cfg.footerLookupWarning=warning;")
    before="""        const births=box.fields.filter(e=>['local nascimento','nascimento local','local de nascimento',
            'país nascimento','pais nascimento','país de nascimento','pais de nascimento','nascimento país',
            'nascimento pais','paisnatal','nascimento cidade','cidade natal','cidadenatal'].includes(norm(e.key))&&e.value.trim());
        if(births.length!==1)return [];
        return countryPortals(births[0].value,/pa[ií]s/.test(norm(births[0].key)));"""
    after="""        const dedicated=box.fields.filter(e=>['país nascimento','pais nascimento','país de nascimento','pais de nascimento',
            'nascimento país','nascimento pais','paisnatal'].includes(norm(e.key))&&e.value.trim());
        const places=box.fields.filter(e=>['local nascimento','nascimento local','local de nascimento',
            'nascimento cidade','cidade natal','cidadenatal'].includes(norm(e.key))&&e.value.trim());
        if(dedicated.length){
            const confirmed=dedicated.map(e=>v211ProductionCountries({fields:[{key:'país',value:e.value}]}));
            if(confirmed.some(row=>row.length!==1)||new Set(confirmed.flat()).size!==1)return [];
            const country=confirmed[0][0];
            if(places.some(e=>countryPortals(e.value).some(other=>portalIdentity(other)!==portalIdentity(country))))return [];
            return [country];
        }
        const confirmed=places.map(e=>countryPortals(e.value));
        if(confirmed.some(row=>row.length!==1)||new Set(confirmed.flat()).size!==1)return [];
        return confirmed.length?confirmed[0]:[];"""
    source=once(source,before,after)
    source=once(source,"        const typed=[...desired].filter(x=>portalIdentity(x)!=='desporto');", """        // Explicit futsal or American-football data veto association-football
        // defaults. This veto does not infer another modality from a club.
        const subtype=box.fields.some(e=>['posição','posicao','esporte','desporto','modalidade','selecaonacional','seleção nacional'].includes(norm(e.key))&&
            /futsal|futebol(?:_| )de(?:_| )salão|futebol(?:_| )americano|posi%c3%a7%c3%b5es_do_futsal/i.test(e.value));
        if(subtype&&desired.has('Futebol'))desired.delete('Futebol');
        const typed=[...desired].filter(x=>portalIdentity(x)!=='desporto');""")
    source=once(source,"        if(p.name!=='rusn'||p.parts.length!==2)return null;", """        const countries=ownDictionary({rusn:'Rússia',fran:'França',norn:'Noruega',bran:'Brasil',porn:'Portugal',prtn:'Portugal',
            espn:'Espanha',itan:'Itália',suen:'Suécia',swen:'Suécia'});
        if(!countries[p.name]||p.parts.length!==2)return null;""")
    source=once(source,"return ['o','a'].includes((named?named.value:p.parts[1]).trim())?['Rússia']:null;", "return ['o','a'].includes((named?named.value:p.parts[1]).trim())?[countries[p.name]]:null;")
    source=once(source,'    const BRAZIL_STATE_PORTAL_ALIASES=',MODULE+'\n    const BRAZIL_STATE_PORTAL_ALIASES=')
    source=once(source,"    function addAutomaticBiographyPortals(source,cfg,bump) {\n        if(!cfg.portals||!cfg.endMatter||!cfg.automaticBiographyPortals)return source;\n        let desired=biographyPortalCandidates(source,cfg);if(!desired.length)return source;", """    function addAutomaticBiographyPortals(source,cfg,bump) {
        if(!cfg.portals||!cfg.endMatter||!cfg.automaticBiographyPortals)return source;
        return v211AppendConfirmedPortals(source,cfg,bump,biographyPortalCandidates(source,cfg),'automaticBiographyPortals');
    }
    function v211AppendConfirmedPortals(source,cfg,bump,candidates,rule) {
        let desired=candidates.slice();if(!desired.length)return source;""")
    # Restrict the shared writer edit to its own function region.
    start=source.index('    function v211AppendConfirmedPortals(')
    end=source.index('    function finalEndMatter(',start)
    chunk=source[start:end].replace("bump('automaticBiographyPortals')","bump(rule)")
    source=source[:start]+chunk+source[end:]
    source=once(source,'        result = addAutomaticBiographyPortals(result,cfg,bump);','        result = addAutomaticBiographyPortals(result,cfg,bump);\n        result = addAutomaticTopicPortals(result,cfg,bump);')
    source=once(source,"['automaticBiographyPortals','Acrescentar portais confirmados para biografias'],", "['automaticBiographyPortals','Acrescentar portais confirmados para biografias'], ['automaticTopicPortals','Acrescentar portais temáticos confirmados'],")
    source=once(source,'livingBirthAge, livingDniValue, biographyPortalCandidates,','livingBirthAge, livingDniValue, biographyPortalCandidates, v211FooterLookupNeeded, v211FooterLookupFailure, v211TopicPortalCandidates, v211PrincipalTopicBox, v211AppendConfirmedPortals, addAutomaticTopicPortals, v211ProductionCountries, v211DrugChemistry,')
    return source
