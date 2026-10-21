    // The variadic list adapter emits one bullet for each supplied item.
    // It has no proved rule for gaps, argument overwrites, reordering or
    // empty values. Preserve that entire source call instead of guessing.
    function v219VariadicListSlotRefusal(raw,profile) {
        if(profile?.kind!=='list'||profile.variadic!==true||typeof raw!=='string')return null;
        const entries=foreignEntries(parsedTemplate(raw)),
            positions=entries.filter(entry=>entry.positional||/^\d+$/.test(entry.key));
        if(positions.every((entry,index)=>entry.key===String(index+1)&&entry.value.trim()&&
            index<profile.maxPos))return null;
        return {profile,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,
            issues:[],issueEvidence:[],proof:{kind:'unproved-variadic-list-slot-binding',
                sourceOldid:profile.source?.oldid||null,
                slots:positions.map(entry=>({key:entry.key,positional:entry.positional,value:entry.value})),
                condition:'only nonempty consecutive canonical source slots1..N in their declared order have a proved bullet-list conversion; named style fields are retained independently'}};
    }
