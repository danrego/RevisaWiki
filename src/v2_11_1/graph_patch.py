"""Recognize finite reference-free native calls without weakening graph proofs."""

ENGINE = r'''
    function v2111ReferenceStyle(value) {
        if(typeof value!=='string'||value.length>2048||/[{}<>\[\]&"'`\\\r\n\u0000-\u001f\uE000-\uF8FF]|\/\*|\*\//.test(value))return false;
        return value.split(';').map(part=>part.trim()).filter(Boolean).every(part=>/^[a-z][a-z-]*\s*:\s*[a-z0-9#%., +\-]+$/i.test(part));
    }
    function v2111ReferenceFreeTemplate(raw) {
        const parsed=parsedTemplate(raw),head=parsed.parts[0].trim();
        // Numeric magic-word arguments cannot contain another expansion or tag.
        if(parsed.parts.length===1&&/^formatnum:[ \t]*[+\-]?\d{1,24}(?:\.\d{1,24})?[ \t]*$/i.test(head))return true;
        // These exact local profiles were checked against native expansion.
        // No argument is admitted for notices that may expand arbitrary input.
        if(parsed.parts.length===1&&/^(?:[Dd]eslista|[Ee]sboço-aviação)$/.test(head))return true;
        if(!/^[Cc]ommonscat$/.test(head)||parsed.parts.length<2||parsed.parts.length>3)return false;
        const entries=foreignEntries(parsed);
        if(entries.some(entry=>!entry.positional||!entry.value.trim()||entry.value.length>240||/[{}<>\[\]&|\r\n\u0000-\u001f\uE000-\uF8FF]/.test(entry.value)))return false;
        return norm(entries[0].value)!=='getwikidata';
    }
'''


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('2.11.1 graph anchor changed: ' + repr(old[:100]))
    return source.replace(old, new, 1)


def apply(source):
    source = once(source, '    function v210ReferenceRenderer(source,range) {', ENGINE + '\n    function v210ReferenceRenderer(source,range) {')
    source = once(source,
        "        const allowed=new Set(['grupo','group','refs','colunas','cols','columns','largura','width','nível','nivel','1']);",
        "        const nativeStyle=['referências','referencias'].includes(p.name);\n        const allowed=new Set(['grupo','group','refs','colunas','cols','columns','largura','width','nível','nivel','1',...(nativeStyle?['estilo']:[])]);")
    source = once(source,
        "        for(const entry of entries){const key=norm(entry.key);if(key==='refs'||['grupo','group'].includes(key))continue;\n            if(!/^(?:\\d{1,3}(?:em|px|%)?)?$/.test(entry.value.trim()))return null;}",
        "        for(const entry of entries){const key=norm(entry.key);if(key==='refs'||['grupo','group'].includes(key))continue;\n            if(key==='estilo'){if(!nativeStyle||!v2111ReferenceStyle(entry.value))return null;continue;}\n            if(!/^(?:\\d{1,3}(?:em|px|%)?)?$/.test(entry.value.trim()))return null;}")
    source = once(source,
        "            return renderers.some(renderer=>renderer.kind==='template'&&renderer.start===node.start&&renderer.end===node.end)||['portal3','controle de autoridade'].includes(name)||/^(?:defaultsort|ordem padrão|ordenação):[^{}<>]+$/.test(name)||allowShort&&['harvnb','harv','harvtxt','sfnp','sfn'].includes(name);",
        "            return renderers.some(renderer=>renderer.kind==='template'&&renderer.start===node.start&&renderer.end===node.end)||v2111ReferenceFreeTemplate(source.slice(node.start,node.end))||['portal3','controle de autoridade'].includes(name)||/^(?:defaultsort|ordem padrão|ordenação):[^{}<>]+$/.test(name)||allowShort&&['harvnb','harv','harvtxt','sfnp','sfn'].includes(name);")
    source = once(source, '        v210ReferenceScope,v210ReferenceSyntaxEdits,v210ReferenceRenderer,v210ReferenceGraph,', '        v2111ReferenceStyle,v2111ReferenceFreeTemplate,\n        v210ReferenceScope,v210ReferenceSyntaxEdits,v210ReferenceRenderer,v210ReferenceGraph,')
    return source
