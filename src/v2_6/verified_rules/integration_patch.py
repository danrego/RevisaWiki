"""Add the finite verified linked-name catalog and four protected spelling rows."""
from pathlib import Path
import json
HERE=Path(__file__).resolve().parent

def apply(source):
    aliases=json.loads((HERE/'linked_name_aliases.json').read_text())
    beginning='    const PORTUGUESE_LINK_EQUIVALENTS = Object.freeze('
    start=source.index(beginning)+len(beginning)
    end=source.index(');',start)
    old=json.loads(source[start:end].replace("'",'"'))
    assert not set(old)&set(aliases), 'New aliases must not replace earlier verified entries'
    source=source[:start]+json.dumps({**old,**aliases},ensure_ascii=False,separators=(',',':'))+source[end:]
    marker='    function portugueseEquivalent(target,label) {'
    assert source.count(marker)==1
    helpers=(HERE/'linked_name_guards.js').read_text().replace('__V26_LINK_ALIASES__',json.dumps(aliases,ensure_ascii=False,separators=(',',':')))
    source=source.replace(marker,helpers+'\n'+marker,1)
    old="""const shield=maskProtected(source,()=>{},mergeEditorialRanges([...discussionProtectionRanges(source,cfg),...protectedRanges])),edits=[];
        for(const m of shield.text.matchAll(/\\[\\[([^\\[\\]|\\n]+)(?:\\|([^\\[\\]\\n]+))?\\]\\]/g)){
            const label=m[2]??m[1],next=portugueseEquivalent(m[1],label);
            if(!next)continue;"""
    new=old.replace('edits=[];', 'edits=[];let v26LiteralRanges=null;').replace('            if(!next)continue;', """            if(!next)continue;
            const added=Object.entries(V26_CONFIRMED_LINK_ALIASES).some(([alias,canonical])=>
                (v20WikiTarget(m[1])===alias||v20WikiTarget(m[1])===canonical)&&label.trim().toLocaleLowerCase('pt')===alias.toLocaleLowerCase('pt'));
            if(added){
                if(!v26ConfirmedLinkedName(m[1],label))continue;
                if(v26LiteralRanges===null)v26LiteralRanges=v26AdditionalLinkedNameProtection(shield.text);
                if(inRange(m.index,v26LiteralRanges))continue;
            }""")
    assert source.count(old)==1, 'Expected exactly one canonical linked-name function'
    source=source.replace(old,new,1)
    spelling=json.loads((HERE/'spelling_additions.json').read_text())
    spelling_prefix='    const SPELLING_RULES = Object.freeze(unpackSpellingRows('
    spelling_start=source.index(spelling_prefix)
    spelling_end=source.index('\n',spelling_start)
    declaration=source[spelling_start:spelling_end]
    assert declaration.endswith('));'), 'Expected an unpackSpellingRows declaration'
    data_expression=declaration[len(spelling_prefix):-3]
    replacement='    const V26_RESEARCH_SPELLING_ADDITIONS = Object.freeze('+json.dumps(spelling,ensure_ascii=False,separators=(',',':'))+');\n    const SPELLING_RULES = Object.freeze(unpackSpellingRows('+data_expression+').concat(V26_RESEARCH_SPELLING_ADDITIONS));'
    source=source[:spelling_start]+replacement+source[spelling_end:]
    marker='canonicalPortugueseLinks, historicalDateMarkup'
    assert source.count(marker)==1
    return source.replace(marker,'canonicalPortugueseLinks, v26ConfirmedLinkedName, v26AdditionalLinkedNameProtection, historicalDateMarkup',1)

if __name__=='__main__':
    import sys
    assert len(sys.argv)==3, 'Usage: integration_patch.py input.js output.js'
    Path(sys.argv[2]).write_text(apply(Path(sys.argv[1]).read_text()))
