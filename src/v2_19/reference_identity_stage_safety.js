    // Quarantine is a source identity boundary, not a page-wide failure. A
    // candidate outside the frozen spans can still insert a new collector or
    // reference, so its exact ordered inventory must also remain unchanged.
    function v219ReferenceIdentityStageEdits(source,edits,cfg={}) {
        if(!Array.isArray(edits)||!edits.length)return edits;
        const quarantine=v219ReferenceIdentityQuarantine(source,cfg);
        if(!quarantine.opaque)return edits;
        const inventory=JSON.stringify(quarantine.ranges.map(range=>[range.kind,source.slice(range.start,range.end)]));
        const retained=edits.filter(edit=>{
            if(!Number.isInteger(edit.start)||!Number.isInteger(edit.end)||edit.start<0||
                edit.start>edit.end||edit.end>source.length||typeof edit.text!=='string')return false;
            const unchanged=source.slice(edit.start,edit.end)===edit.text;
            if(unchanged)return true;
            if(quarantine.ranges.some(range=>edit.start===edit.end?
                range.start<edit.start&&edit.start<range.end:
                range.start<=edit.start&&edit.end<=range.end))return false;
            const candidate=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
            return inventory===JSON.stringify(v219UncertainReferenceInventory(candidate,cfg,true));
        });
        if(!retained.length)return retained;
        const ordered=retained.slice().sort((a,b)=>a.start-b.start||a.end-b.end);
        if(ordered.some((edit,index)=>index&&edit.start<ordered[index-1].end))return [];
        const combined=v24SyntaxApply(source,ordered);
        if(combined===source)return retained;
        return inventory===JSON.stringify(v219UncertainReferenceInventory(combined,cfg,true))?retained:[];
    }
