"""Canonical local hatnotes and quiet, truthful partial-analysis reporting."""


def apply(source):
    def once(old, new):
        nonlocal source
        assert source.count(old) == 1, old[:120]
        source = source.replace(old, new, 1)

    once(
        "    function migrateForeignTemplate(raw,cfg,choiceTarget) {",
        """    function v261LocalHatnoteName(rawName) {
        const name=String(rawName).trim().replace(/^(?:predefinição|template)\\s*:\\s*/i,'');
        return /^(?:[Mm]ain|[Aa][Pp])$/.test(name);
    }
    function migrateForeignTemplate(raw,cfg,choiceTarget) {""",
    )
    once(
        "        const p=parsedTemplate(raw), entries=foreignEntries(p), issues=[];\n        let target=choiceTarget || profile.target;",
        """        const p=parsedTemplate(raw), entries=foreignEntries(p), issues=[];
        if(v261LocalHatnoteName(p.parts[0])) {
            // Verified local redirects share the target's complete parameter
            // interface. Change only the name, including for explicit 1= and l1=.
            const header=p.parts[0],space=header.match(/^(\\s*)[\\s\\S]*?(\\s*)$/);
            const candidate='{{'+space[1]+'Artigo principal'+space[2]+raw.slice(2+header.length);
            return {profile,candidate,text:candidate,blocked:false,issues:[]};
        }
        let target=choiceTarget || profile.target;""",
    )
    once(
        "            if(profile && norm(p.parts[0])!==norm(profile.target))findings.push({code:'foreign-template',start:n.start,end:n.end,",
        "            if(profile && norm(p.parts[0])!==norm(profile.target) && !v261LocalHatnoteName(p.parts[0]))findings.push({code:'foreign-template',start:n.start,end:n.end,",
    )
    once(
        "            warn('O código incompleto e tudo o que vem depois dele foram preservados. Os ajustes ficaram no trecho completo anterior.');\n",
        "",
    )
    once(
        "                syntaxIsolation:{start:recovery.end,tailUnchanged:tail===syntactic.slice(recovery.end)},",
        """                syntaxIsolation:{start:recovery.end,tailUnchanged:tail===syntactic.slice(recovery.end)},
                notApplied:[{code:'preserved-unresolved-tail',severity:'info',
                    message:'Um trecho foi mantido sem alterações porque a estrutura não pôde ser interpretada com segurança.'}],""",
    )
    once(
        "'Nenhum ajuste automático necessário. Confira os avisos e as sugestões, se houver.'); return; }",
        "result.syntaxIsolation?'Não foram encontrados ajustes seguros no trecho analisado.':'Nenhum ajuste automático necessário. Confira os avisos e as sugestões, se houver.'); return; }",
    )
    return source
