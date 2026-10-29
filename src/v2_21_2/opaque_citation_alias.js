    // Read-only identity of one complete reference body. Native redirects:
    // Cite web 46214208 -> Citar web 48262420. Arguments remain byte-identical.
    function v2212OpaqueCiteWebHeader(raw) {
        if(typeof raw!=='string')return raw;
        const match=/^(\s*\{\{\s*)(?:[Cc]ite web|[Cc]itar web)(?=\s*[|}])/.exec(raw);
        if(!match)return raw;
        const parsed=v24SyntaxTemplates(raw),start=raw.search(/\S/),end=raw.trimEnd().length;
        if(parsed.unclosed.length||!parsed.nodes.some(node=>node.depth===0&&node.size===2&&node.start===start&&node.end===end))return raw;
        return match[1]+'Citar web'+raw.slice(match[0].length);
    }
