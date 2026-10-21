    // Read-only presentation jobs never run cleanup or write an editor.
    function v219UIPresentationMetadata(job) {
        if(!job||typeof job.source!=='string'||typeof job.originalSource!=='string'||
            !Array.isArray(job.presentationKinds)||job.presentationKinds.some(kind=>!['syntax','spelling','discussion','styles'].includes(kind)))
            throw new TypeError('A contagem precisa dos dois textos e das opções da edição.');
        const before=job.originalSource,after=job.source,cfg=job.options||{},kinds=job.presentationKinds;
        const retained=v211RetainedAdjustments(before,after,kinds,cfg);
        return {kind:'presentation',text:after,presentation:{beforeHash:v24SyntaxHash(before),afterHash:v24SyntaxHash(after),
            optionsBinding:v211FreshnessKey(cfg),kinds:kinds.join('|'),topics:retained.topics,retained,
            retainedHash:v24SyntaxHash(JSON.stringify(retained))}};
    }
    function v219UIPresentationMatches(result,before,after,kinds,cfg={}) {
        const value=result?.presentation;
        return !!value&&typeof before==='string'&&typeof after==='string'&&Array.isArray(kinds)&&result.text===after&&
            value.beforeHash===v24SyntaxHash(before)&&value.afterHash===v24SyntaxHash(after)&&
            value.optionsBinding===v211FreshnessKey(cfg)&&value.kinds===kinds.join('|')&&
            Array.isArray(value.topics)&&!!value.retained&&Array.isArray(value.retained.events)&&
            JSON.stringify(value.topics)===JSON.stringify(value.retained.topics)&&
            value.retained.sourceHash===v24SyntaxHash(before)&&value.retained.outputHash===v24SyntaxHash(after)&&
            value.retainedHash===v24SyntaxHash(JSON.stringify(value.retained));
    }
    function v219UIBindReviewReports(result,cfg={}) {
        if(!result||typeof result.text!=='string'||!result.localReports)return result;
        return {...result,reviewSource:result.text,reviewBinding:v211FreshnessKey(cfg),
            reviewReportsHash:v24SyntaxHash(JSON.stringify(result.localReports))};
    }
    function v219UIReviewReportsBound(result,cfg={}) {
        return !!result&&typeof result.text==='string'&&result.reviewSource===result.text&&
            result.reviewBinding===v211FreshnessKey(cfg)&&!!result.localReports&&
            ['references','syntax','translation','tables','biographies','dates'].every(key=>Array.isArray(result.localReports[key]))&&
            result.reviewReportsHash===v24SyntaxHash(JSON.stringify(result.localReports));
    }
