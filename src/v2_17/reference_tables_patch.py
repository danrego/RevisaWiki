"""Bind jointly proved reference openers to individual retained attributes."""


def apply(source):
    start = source.index('        for(const edit of v213ReferenceAttributeCountEdits(before)){')
    end = source.index('        // Reordering the two literal reference identity fields', start)
    replacement = r'''        for(const group of v217ReferenceAttributeCountGroups(before)){
            const edit=group[0],tag=v24SyntaxTag(before,edit.proof.openingStart),start=v211CountAnchor(tag.start,edits),end=v211CountAnchor(tag.end,edits,false,true),target=v24SyntaxTag(after,start);
            if(!target||target.end!==end||target.name!=='ref'||target.close||target.self!==tag.self)continue;
            const local=group.map(member=>({start:member.start-tag.start,end:member.end-tag.start,text:member.text})),fixed=v24SyntaxApply(tag.raw,local),probe=normalizeRefs(fixed+'x</ref>',{...DEFAULTS,moveNamedRefs:false},()=>{},()=>{}),expected=probe.slice(0,probe.indexOf('>')+1);
            if(target.raw!==fixed&&target.raw!==expected)continue;
            const ids=[...new Set([...indices('old',tag.start,tag.end),...indices('new',start,end)])];if(!ids.length||ids.some(i=>claimed.has(i)||!contained(edits[i],'old',tag.start,tag.end)||!contained(edits[i],'new',start,end)))continue;
            const members=group.map(member=>{const hit=new RegExp('\\s('+member.text+')(?=\\s*=)','i').exec(target.raw);return hit?{member,at:start+hit.index+hit[0].indexOf(hit[1])}:null;});if(members.some(member=>!member))continue;
            ids.forEach(i=>claimed.add(i));for(const {member,at}of members)component('reference-attribute','Atributo nativo de referência recuperado',member.start,member.end,at,at+member.text.length);
        }
'''
    return source[:start] + replacement + source[end:]
