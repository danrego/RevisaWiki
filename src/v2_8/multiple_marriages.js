    Object.assign(GROUP_LABELS,{multipleMarriages:'Casamentos formatados na infocaixa'});
    function v28MultipleMarriageParts(value) {
        const refs=refTokens(value),nested=templates(protectedView(value)).nodes,ranges=refs.concat(nested),inside=at=>ranges.some(range=>range.start<=at&&at<range.end),breaks=[];
        for(const match of value.matchAll(/<br\s*\/?\s*>/gi))if(!inside(match.index))breaks.push({start:match.index,end:match.index+match[0].length});
        if(breaks.length){
            if(/(?:^|\n)[ \t]*\*/.test(value))return null;
            const parts=[];let at=0;for(const br of breaks){parts.push({start:at,end:br.start,text:value.slice(at,br.start)});at=br.end;}parts.push({start:at,end:value.length,text:value.slice(at)});
            return parts.length>=2&&parts.length<=10&&parts.every(part=>part.text.trim())?parts:null;
        }
        const markers=[...value.matchAll(/(?:^|\r?\n)[ \t]*\*[ \t]+/g)].filter(match=>!inside(match.index));if(markers.length<2||markers.length>10||value.slice(0,markers[0].index).trim())return null;
        const parts=[];for(let index=0;index<markers.length;index++){
            const marker=markers[index],start=marker.index+marker[0].length,end=index+1<markers.length?markers[index+1].index:value.length,text=value.slice(start,end);
            if(!text.trim()||/(?:^|\n)[ \t]*[*#:;]/.test(text))return null;parts.push({start,end,text});
        }
        return parts;
    }
    function v28MultipleMarriageValue(value) {
        const parts=v28MultipleMarriageParts(value);if(!parts)return null;const replacements=[];
        for(const part of parts){const parsed=v273MarriageValue(part.text);if(!parsed)return null;replacements.push({start:part.start+parsed.start,end:part.start+parsed.end,text:parsed.text,relationship:parsed});}
        return {text:v24SyntaxApply(value,replacements),replacements};
    }
    function v28MultipleMarriageEdits(source,cfg={}) {
        if(!/\bcasad[oa]s?\b/iu.test(source))return [];const box=v28PrincipalPersonBox(source,cfg);if(!box)return [];
        const parsed=v273MarriageFields(box.raw,box.name);if(!parsed)return [];const plan=v28MultipleMarriageValue(parsed.spouse.value);if(!plan)return [];
        const text=box.raw.slice(0,parsed.spouse.start)+plan.text+box.raw.slice(parsed.spouse.start+parsed.spouse.value.length);
        return [{start:box.node.start,end:box.node.end,text,ruleId:'multipleMarriages',proof:{sourceHash:v24SyntaxHash(source),template:box.name,key:parsed.spouse.key,raw:box.sourceRaw,canonical:box.raw,relationships:plan.replacements,changeRules:plan.replacements.map(()=> 'multipleMarriages'),condition:'one complete principal person infobox; approved existing native field normalization or foreign migration only; unique accepted spouse field; independently explicit separate marriage items; exact separators, names, dates, status and references retained'}}];
    }
    function v28MultipleMarriagePlan(source,cfg={}) {const edits=v28MultipleMarriageEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};}
    function v28MultipleMarriageProof(before,after,plan,cfg={}) {if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;const fresh=v28MultipleMarriagePlan(before,cfg);return fresh.text===after&&plan.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);}
