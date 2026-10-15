"""Recognize accepted citation aliases in the read-only Harvard-anchor audit."""
def apply(source):
    start=source.index('    function shortCitationAudit(source) {')
    end=source.index('    function referenceAudit(',start)
    block=source[start:end]
    old="CITE_NAMES[p.name]?parameterFamily(e.key):e.key"
    assert block.count(old)==1
    block=block.replace(old,"CITE_NAMES[p.name]?parameterFamily(mappedParam(e.key,p.name)).replace(/^sobrenome(?=\\d*$)/,'último'):e.key",1)
    return source[:start]+block+source[end:]

if __name__=='__main__':
    from pathlib import Path
    import sys
    assert len(sys.argv)==3,'Usage: integration_patch.py input.js output.js'
    Path(sys.argv[2]).write_text(apply(Path(sys.argv[1]).read_text()))
