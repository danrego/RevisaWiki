"""Keep one actionable warning for each remaining named-reference conflict."""


def apply(source):
    anchor = '    function* cleanupStages(source, options) {'
    assert source.count(anchor) == 1
    helper = '''    // A auditoria final distingue nome e grupo. O aviso antigo não informa o grupo.
    function v2111RedundantReferenceWarnings(warnings, findings) {
        const names=new Set();
        for(const finding of findings||[]){
            if(finding.code!=='conflicting-definition')continue;
            const match=String(finding.message||'').match(/^Definições diferentes para "([^"\\r\\n]+)"(?:, grupo [^\\r\\n]+)?\\.$/);
            if(match)names.add(match[1]);
        }
        return (warnings||[]).filter(message=>{
            const match=String(message).match(/^Referência "([^"\\r\\n]+)" tem definições diferentes\\. Nenhuma foi descartada\\.$/);
            return match&&names.has(match[1]);
        });
    }

'''
    source = source.replace(anchor, helper + anchor, 1)
    anchor = '        audit.forEach(f => warn(f.message));'
    assert source.count(anchor) == 1
    return source.replace(anchor, anchor + '\n        for(const message of v2111RedundantReferenceWarnings([...warnings],audit))warnings.delete(message);', 1)
