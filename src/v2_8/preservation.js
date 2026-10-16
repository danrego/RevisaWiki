    function v28BiographyObjectProof(plan,expected,actual) {
        const steps=plan.safe.steps.filter(step=>['v273-explicit-marriage','v28-biography-fields','v28-biography-dates','v28-multiple-marriages'].includes(step.name));
        if(!steps.length)return {accepted:true,reason:''};
        const wanted=new Set(steps.flatMap(step=>step.edits.map(edit=>edit.proof.template)));
        if(wanted.has(undefined)||!wanted.size)return {accepted:false,reason:'Não foi possível conferir os campos da infocaixa ajustada.'};
        // These fields can already contain complete reference tags. Wrapping
        // a whole field in a synthetic reference would hide the surrounding
        // names or dates when the inner reference is extracted. References
        // have their own binding and body proof before this whole-field check.
        const cfg={...plan.cfg,bareReferences:false};
        const before=v273MarriageInventory(expected,cfg,wanted),after=v273MarriageInventory(actual,cfg,wanted);
        return before.size&&v24InventoryContains(before,after)?{accepted:true,reason:''}:{accepted:false,reason:'A infocaixa perdeu ou alterou dados fora dos ajustes confirmados.'};
    }
