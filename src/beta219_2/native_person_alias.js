    // Exact local redirect48060416 forwards unchanged arguments to the
    // independently pinned native target66124641. Other internal casing is
    // still unproved and retains the original source.
    function v219NativePersonAliasIdentity(literal,profile) {
        return typeof literal==='string'&&(profile?.oldid===66124641&&
            profile.title==='Info/Piloto de corrida'&&
            v215SameTemplateTitle(literal,'Info/piloto de corrida')||
            profile?.oldid===73044750&&profile.title==='Info/Música/artista'&&
            v215SameTemplateTitle(literal,'Info/música/artista'));
    }
