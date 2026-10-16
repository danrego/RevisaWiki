    function v214ReviewGroupKey(proposal) {
        const group=proposal?.reviewGroup;
        if(!group||group.kind!=='unsupported-template-parameter'||typeof group.template!=='string'||!group.template||typeof group.parameter!=='string'||!group.parameter||typeof proposal.label!=='string')return null;
        return JSON.stringify([group.kind,group.template,group.parameter]);
    }
    const V214_QUIET_REVIEW_ADVISORIES=new Set(['Bloco final com predefinição sem função confirmada. A ordem foi preservada. Use a conferência de destinos ou reveja o bloco.']);
    function v214ReviewFindingVisible(finding) {
        if(finding?.state!=='pending')return false;
        if(finding.severity==='error')return true;
        if(finding.domain==='local'&&finding.code==='warning'&&V214_QUIET_REVIEW_ADVISORIES.has(finding.message))return false;
        return !technicalFinding(finding);
    }
    function v214ReviewWarningMessages(p,entry,profile) {
        const messages=['Parâmetro fora do catálogo de '+p.parts[0].trim()+': '+entry.key+'. Valor preservado.'];
        if(!profile)messages.push('Parâmetro de citação fora do catálogo: '+entry.key+' em '+p.parts[0].trim()+'.');
        else if(INFOBOX_CATALOG[p.name]){
            let hint=profile.report&&profile.report[entry.key];
            if(!hint){const candidates=profile.accepted.filter(key=>norm(key)===norm(entry.key));if(candidates.length===1)hint='Confira se o nome pretendido é '+candidates[0]+'.';}
            messages.push('Infocaixa '+profile.title+': parâmetro não reconhecido no catálogo, "'+entry.key+'".'+(hint?' '+hint:' Valor preservado.'));
        }
        return messages;
    }
    function v214ReviewGroups(proposals) {
        const rows=[],groups=new Map();
        for(const proposal of proposals){
            const key=v214ReviewGroupKey(proposal);
            if(key&&groups.has(key)){groups.get(key).proposals.push(proposal);continue;}
            const group={key,label:proposal.label,proposals:[proposal],warningMessages:[]};
            rows.push(group);if(key)groups.set(key,group);
        }
        for(const group of rows)if(group.key)group.warningMessages=[...new Set(group.proposals.flatMap(proposal=>Array.isArray(proposal.reviewGroup?.warningMessages)?proposal.reviewGroup.warningMessages.filter(message=>typeof message==='string'):[]))];
        return rows;
    }
    function v214RepresentedReviewMessages(result,source) {
        const messages=new Set();
        if(typeof source!=='string'||result?.text!==source||!Array.isArray(result.suggestions))return messages;
        for(const proposal of result.suggestions){
            if(!v214ReviewGroupKey(proposal)||!Number.isInteger(proposal.start)||!Number.isInteger(proposal.end)||
                proposal.start<0||proposal.end<=proposal.start||proposal.end>source.length||
                typeof proposal.before!=='string'||source.slice(proposal.start,proposal.end)!==proposal.before||
                !Array.isArray(proposal.reviewGroup.warningMessages))continue;
            for(const message of proposal.reviewGroup.warningMessages)if(typeof message==='string')messages.add(message);
        }
        return messages;
    }
    function v214SyncReviewGroups(suggestions) {
        if(!suggestions)return;
        for(const group of suggestions.querySelectorAll(':scope > .ajg-review-group')){
            const count=group.querySelectorAll(':scope > details').length;
            if(!count){group.remove();continue;}
            group.dataset.occurrences=String(count);
            group.querySelector(':scope > summary').textContent='Rever: '+group.dataset.label+' · '+count+(count===1?' ocorrência':' ocorrências');
        }
    }
