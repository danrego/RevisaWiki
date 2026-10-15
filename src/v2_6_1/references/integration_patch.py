"""Recognize the two verified singular redirects before reference-list decisions."""


def apply(source):
    def once(old, new):
        nonlocal source
        assert source.count(old) == 1, old[:120]
        source = source.replace(old, new, 1)

    once(
        """    function parsedTemplate(raw) {
        const parts = splitParts(raw.slice(2, -2));
        return {name: nameOf(parts[0]).replace(/^#tag\\s*:\\s*ref$/,'#tag:ref'), parts};
    }""",
        """    function isVerifiedReferenceRedirect(rawName) {
        const literal=String(rawName).replace(/_/g,' ').trim().replace(/^(?:predefinição|template)\\s*:\\s*/i,'');
        return /^(?:[Rr]eferência|[Rr]eferencia)$/.test(literal);
    }
    function parsedTemplate(raw) {
        const parts = splitParts(raw.slice(2, -2));
        const name = nameOf(parts[0]).replace(/^#tag\\s*:\\s*ref$/,'#tag:ref');
        // Both singular names are verified redirects, including their parameters.
        // Use their target for detection and source proofs before changing bytes.
        return {name: isVerifiedReferenceRedirect(parts[0]) ? 'referências' : name, parts};
    }""",
    )
    once(
        """    function normalizeLists(s, bump, warn) {
        const edits = [], ranges = structuralRanges(s);
        for (const n of topNodes(s)) {
            const raw = s.slice(n.start, n.end), p = parsedTemplate(raw);
            if (inRangeExcept(n.start,ranges,n.start,n.end)) continue;
            if (['referências', 'referencias', 'reflist', 'references'].includes(p.name) && p.parts.length === 1) {""",
        """    function normalizeLists(s, bump, warn) {
        const edits = [], ranges = structuralRanges(s);
        let aliasQuoteRanges = null;
        for (const n of topNodes(s)) {
            const raw = s.slice(n.start, n.end), p = parsedTemplate(raw);
            if (inRangeExcept(n.start,ranges,n.start,n.end)) continue;
            if (isVerifiedReferenceRedirect(p.parts[0])) {
                if (!aliasQuoteRanges) aliasQuoteRanges=structuralQuoteRanges(protectedView(s));
                if (inRange(n.start,aliasQuoteRanges)) continue;
                // Change only the name. Keep every field and list-defined source.
                const trailing=p.parts[0].match(/\\s*$/)[0];
                edits.push({start:n.start,end:n.end,text:'{{Referências'+trailing+raw.slice(2+p.parts[0].length)});
                bump('referenceLists');
            } else if (['referências', 'referencias', 'reflist', 'references'].includes(p.name) && p.parts.length === 1) {""",
    )
    return source
