"""Preserve citation families and use verified native news formatters."""
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Citation integration anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    source = replace(source, '    function preservationAudit(before,after,options={}) {',
                     '    function v281PreviousPreservationAudit(before,after,options={}) {')
    source = replace(source, '    function safeComposition(before,after,options={}) {',
                     '    function v281PreviousSafeComposition(before,after,options={}) {')
    module = Path(__file__).with_name('citations.js').read_text()
    source = replace(source, '    function extendedCitation(raw, cfg, bump, warn) {',
                     module + '\n    function extendedCitation(raw, cfg, bump, warn) {')
    source = replace(source, '    function translationProfile(raw) {\n        const p = parsedTemplate(raw), name = norm(p.parts[0]);',
                     '    function v281LegacyTranslationProfile(raw) {\n        const p = parsedTemplate(raw), name = norm(p.parts[0]);')
    source = replace(source,
                     "        const urls = !!CITATION_KEY_CATALOG[p.name] || entries.some(e => !e.remove && /^(url|capítulourl|arquivourl|conferência-url|mapa-url|resumo-url|transcriçãourl|lay-url)$/.test(norm(e.key)) && e.value.trim());\n"
                     "        if (!urls) {\n"
                     "            for (const e of entries) if (!e.remove && norm(e.key) === 'acessodata') { e.remove = true; bump('citationCleanup'); }\n"
                     "            if (p.name === 'citar web') { p.parts[0] = 'Citation'; bump('citationNames'); }\n"
                     "        }\n", '')
    source = replace(source,
                     "            if(profile.kind==='citation')return citationKeys.includes(key) || citationKeys.includes(key.replace(/\\d+$/,'#'));",
                     "            if(profile.kind==='citation')return profile.strictNativeCitation?!!targetProfile&&profileAccepts(targetProfile,key):citationKeys.includes(key) || citationKeys.includes(key.replace(/\\d+$/,'#'));")
    source = replace(source, '        let target=choiceTarget || profile.target;\n',
                     "        let target=choiceTarget || profile.target;\n        const nativeOnlyIssues=profile.strictNativeCitation&&norm(target)==='citar jornal'?new Set():null;\n")
    source = replace(source,
                     "            if(!mapped || !accepts(mapped)) {\n                if(value)message('Campo sem equivalência confirmada: '+e.key+'.');\n                continue;\n            }",
                     "            if(!mapped || !accepts(mapped)) {\n                if(value){\n                    const issue='Campo sem equivalência confirmada: '+e.key+'.',candidate=mapped||citationParam(e.key,nameOf(target));message(issue);\n                    if(nativeOnlyIssues&&(citationKeys.includes(candidate)||citationKeys.includes(candidate.replace(/\\d+$/,'#'))))nativeOnlyIssues.add(issue);\n                }\n                continue;\n            }")
    source = replace(source,
                     '        return {profile,candidate,issues,blocked:issues.length>0,text:issues.length?raw:candidate};',
                     '        return {profile,candidate,issues,blocked:issues.length>0,text:issues.length?raw:candidate,quietNativeRefusal:!!nativeOnlyIssues&&issues.length>0&&issues.every(issue=>nativeOnlyIssues.has(issue))};')
    source = replace(source,
                     "        if(migration.blocked)warn((migration.profile.nativeRenderer ? 'Conferir colunas de ' : 'Rever tradução de ')+parsedTemplate(raw).parts[0].trim()+': '+migration.issues.join(' '));",
                     "        if(migration.blocked&&!migration.quietNativeRefusal)warn((migration.profile.nativeRenderer ? 'Conferir colunas de ' : 'Rever tradução de ')+parsedTemplate(raw).parts[0].trim()+': '+migration.issues.join(' '));")
    source = replace(source,
                     '            const raw=s.slice(n.start,n.end),p=parsedTemplate(raw),profile=translationProfile(raw);\n            if(profile && norm(p.parts[0])!==norm(profile.target)',
                     '            const raw=s.slice(n.start,n.end),p=parsedTemplate(raw),profile=translationProfile(raw);\n            if(v281QuietCitationRefusal(raw,profile))continue;\n            if(profile && norm(p.parts[0])!==norm(profile.target)')
    source = replace(source,
                     '            if(!migration?.blocked || proposals.length>=60)continue;',
                     '            if(!migration?.blocked || migration.quietNativeRefusal || proposals.length>=60)continue;')
    source = replace(source, '        v28BiographyFieldPlan,v28BiographyFieldProof,v28BiographyFieldEdits,',
                     '        citationNewsProfiles:V281_CITATION_NEWS_PROFILES,v281CitationProfile,v281CitationObligation,v281CitationRetention,\n        v28BiographyFieldPlan,v28BiographyFieldProof,v28BiographyFieldEdits,')
    return source
