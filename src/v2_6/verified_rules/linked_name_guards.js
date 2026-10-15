    // Estes nomes foram conferidos nos redirecionamentos da ptwiki.
    // A forma estrangeira só muda quando é o próprio rótulo da ligação.
    const V26_CONFIRMED_LINK_ALIASES = Object.freeze(__V26_LINK_ALIASES__);
    function v26ConfirmedLinkedName(target,label) {
        const exact=String(target||'').trim().replace(/_/g,' ').normalize('NFC'),visible=String(label||'').trim().normalize('NFC');
        for(const [alias,canonical]of Object.entries(V26_CONFIRMED_LINK_ALIASES))
            if((exact===alias||exact===canonical)&&visible===alias)return {alias,canonical};
        return null;
    }
    function v26AdditionalLinkedNameProtection(view) {
        const parsed=templates(view),ranges=parsed.nodes.map(n=>({start:n.start,end:n.end}));
        for(const node of parsed.unclosed)ranges.push({start:node.start,end:view.length});
        for(const match of view.matchAll(/^[^\r\n]*["'“”‘’«»][^\r\n]*$/gm))
            ranges.push({start:match.index,end:match.index+match[0].length});
        for(const match of view.matchAll(/^[^\r\n]*&(?:quot|apos|ldquo|rdquo|lsquo|rsquo|laquo|raquo|#34|#39|#x22|#x27);[^\r\n]*$/gmi))
            ranges.push({start:match.index,end:match.index+match[0].length});
        for(const match of view.matchAll(/"[^"\r\n]*"|“[^”\r\n]*”|«[^»\r\n]*»|'{2,3}[^\r\n]*?'{2,3}|\[(?:https?:|\/\/)[^\]\r\n]*\]/g))
            ranges.push({start:match.index,end:match.index+match[0].length});
        return mergeEditorialRanges(ranges);
    }
