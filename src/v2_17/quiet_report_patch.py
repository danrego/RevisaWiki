"""Project current source-bound defects into the existing review interface."""
from pathlib import Path


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('2.17 quiet report anchor changed: ' + repr(old[:120]))
    return source.replace(old, new, 1)


def apply(source):
    helpers = Path(__file__).with_name('quiet_report.js').read_text()
    source = once(source, '    function technicalFinding(finding) {', helpers + '\n    function technicalFinding(finding) {')
    source = once(source, 'v214ReviewGroupKey, v214ReviewGroups, v214ReviewFindingVisible,',
                  'v217VisibleReviewPlan,v217BaselineVisibleReviewPlan,v217ResultFindings,v217FinalReviewResult,v217FindingVisible,v217SourceProposal,v217ProposalKey,v214ReviewGroupKey, v214ReviewGroups, v214ReviewFindingVisible,')
    source = once(source,
                  'function suggestionKey(p) { const group=v214ReviewGroupKey(p);return JSON.stringify([p.label,p.before,p.choices,...(group?[group,p.start,p.end]:[])]); }',
                  'function suggestionKey(p) { return v217ProposalKey(p); }')
    # A final producer check can certify a defect without interpreting its prose.
    warnings = [
        ("warn('Confira o DOI: ' + v + '. O identificador foi preservado.');", "warn('Confira o DOI: ' + v + '. O identificador foi preservado.',{confirmed:true,family:'identifier-doi',kind:'invalid-identifier',value:v});"),
        ("warn('Confira o PMID: ' + v + '.');", "warn('Confira o PMID: ' + v + '.',{confirmed:true,family:'identifier-pmid',kind:'invalid-identifier',value:v});"),
        ("warn('ISBN com formato ou dígito de controle inválido: ' + v + '.');", "warn('ISBN com formato ou dígito de controle inválido: ' + v + '.',{confirmed:true,family:'identifier-isbn',kind:'invalid-identifier',value:v});"),
        ("warn('Ligação de autor conflitante preservada: ' + field + '.');", "warn('Ligação de autor conflitante preservada: ' + field + '.',{confirmed:true,family:'author-link-conflict',kind:'field-conflict'});"),
        ("warn('Parâmetros conflitantes preservados em ' + chosen + ': ' + prev.key + ' / ' + p.key + '.');", "warn('Parâmetros conflitantes preservados em ' + chosen + ': ' + prev.key + ' / ' + p.key + '.',{confirmed:true,family:'template-field:'+parsed.name+':'+parameterFamily(p.key),kind:'field-conflict'});"),
        ("warn('Infocaixa ' + profile.title + ': ' + entry.key + ' conflita com ' + target + '. Ambos foram preservados.');", "warn('Infocaixa ' + profile.title + ': ' + entry.key + ' conflita com ' + target + '. Ambos foram preservados.',{confirmed:true,family:'template-field:'+p.name+':'+target,kind:'field-conflict'});"),
        ("warn('Infocaixa ' + profile.title + ': valores diferentes em ' + before.key + ' / ' + entry.key + '. Confira manualmente.');", "warn('Infocaixa ' + profile.title + ': valores diferentes em ' + before.key + ' / ' + entry.key + '. Confira manualmente.',{confirmed:true,family:'template-field:'+p.name+':'+family,kind:'field-conflict'});"),
        ("warn('Categoria repetida com chaves de ordenação diferentes: ' + key + '.');", "warn('Categoria repetida com chaves de ordenação diferentes: ' + key + '.',{confirmed:true,family:'category-sort-conflict',kind:'field-conflict'});"),
    ]
    for old, new in warnings:
        source = once(source, old, new)
    source = once(source, 'function offer(start, end, label, choices, reviewGroup) {',
                  'function offer(start, end, label, choices, reviewGroup, reviewEvidence) {')
    source = once(source, '...(reviewGroup?{reviewGroup}:{}),choices: choices.filter(c => c.after !== before)',
                  '...(reviewGroup?{reviewGroup}:{}),...(reviewEvidence?{reviewEvidence}:{}),choices: choices.filter(c => c.after !== before)')
    source = once(source, "                    }));\n                }\n                for (const e of entries) {",
                  "                    }),null,{confirmed:true,family:'template-field:'+p.name+':'+family,kind:'field-conflict'});\n                }\n                for (const e of entries) {")
    # Preserve every migration refusal and its rollback semantics. Only its
    # display evidence changes, with catalog gaps explicitly distinguished.
    source = once(source, 'const p=parsedTemplate(raw), entries=foreignEntries(p), issues=[];',
                  'const p=parsedTemplate(raw), entries=foreignEntries(p), issues=[],issueEvidence=[];')
    source = once(source, 'const message=text=>{if(!issues.includes(text))issues.push(text);};',
                  "const message=(text,evidence={kind:'manual-review'})=>{if(!issues.includes(text)){issues.push(text);issueEvidence.push({...evidence,message:text});}};")
    source = once(source,"message('Sammelwerk pode ser livro, revista ou jornal. Escolha o tipo de publicação.');",
                  "message('Sammelwerk pode ser livro, revista ou jornal. Escolha o tipo de publicação.',{confirmed:true,kind:'publication-type'});")
    source = once(source,"message('Campos conflitantes para '+e.key+'.');",
                  "message('Campos conflitantes para '+e.key+'.',{confirmed:true,kind:'field-conflict',parameter:e.key});")
    source = once(source, "candidate=mapped||citationParam(e.key,nameOf(target));message(issue);",
                  "candidate=mapped||citationParam(e.key,nameOf(target));message(issue,{kind:'catalog-gap',parameter:e.key});")
    source = once(source, 'return {profile,candidate,issues,blocked:issues.length>0,text:issues.length?raw:candidate,quietNativeRefusal:',
                  'return {profile,candidate,issues,issueEvidence,blocked:issues.length>0,text:issues.length?raw:candidate,quietNativeRefusal:')
    # The existing result.audit can precede final cleanup. Final reports must
    # describe the bytes that actually reached the editor, including rollback.
    source = once(source, "references: job.kind === 'refresh' ? referenceAudit(result.text,cfg) : result.audit || referenceAudit(result.text,cfg)",
                  'references: referenceAudit(result.text,cfg)')
    source = once(source,
        "        const findings = [...issueStore.values()];\n        const current = finding => finding.source === source && finding.state === 'pending';",
        "        const findings = [...issueStore.values()];")
    source = once(source,
        "        const representedMessages=v214RepresentedReviewMessages(lastLocalResult,source);\n        const represented=finding=>finding.domain==='local'&&finding.code==='warning'&&finding.severity!=='error'&&representedMessages.has(finding.message);\n        const live=findings.filter(current);\n        const pending=live.filter(f=>v214ReviewFindingVisible(f)&&!represented(f));",
        "        const visiblePlan=v217VisibleReviewPlan({result:lastLocalResult,source,findings,options:currentOptions(false),ignoredSuggestionKeys:[...ignoredSuggestions]});\n        const pending=visiblePlan.findings;")
    source = once(source,
        "const row = node('li', (status ? status + ': ' : '') + finding.message, 'ajg-issue');",
        "const row = node('li', (status ? status + ': ' : '') + finding.message+(finding.occurrences>1?' · '+finding.occurrences+' ocorrências':''), 'ajg-issue');\n                row.dataset.occurrences=String(finding.occurrences||1);")
    source = once(source,
        "                    finding.state = finding.state === 'ignored' ? 'pending' : 'ignored'; renderIssues();",
        "                    const state=finding.state==='ignored'?'pending':'ignored';for(const member of finding.members||[finding])member.state=state;renderIssues();")
    source = once(source,
        "                    const go = button('Ir ao trecho', () => goToFinding(finding), 'ajg-locate');",
        "                    const locations=finding.locations?.length?finding.locations:[finding.anchor];let location=0;\n                    const label=()=>locations.length>1?'Ir ao trecho · '+(location+1)+' de '+locations.length:'Ir ao trecho';\n                    const go=button(label(),()=>{goToFinding({...finding,anchor:locations[location]});location=(location+1)%locations.length;go.textContent=label();},'ajg-locate');")
    source = once(source,
        "        for(const group of v214ReviewGroups((result.suggestions||[]).filter(proposal=>!ignoredSuggestions.has(suggestionKey(proposal))))){",
        "        const visiblePlan=v217VisibleReviewPlan({result,source:editor()?.read(),findings:[...issueStore.values()],options:currentOptions(false),ignoredSuggestionKeys:[...ignoredSuggestions]});\n        for(const group of visiblePlan.groups){")
    source = once(source,'    function showReport(result) {\n        const inline',
                  '    function showReport(result) {\n        result=v217FinalReviewResult(result,currentOptions(false));\n        const inline')
    # Online destination checks distinguish a verified missing target from a
    # catalog revision notice at the producer, never by message wording.
    source = once(source, "finding('Arquivo sem imagem disponível na ptwiki ou no Commons: ' + target.title, target.title);",
                  "finding('Arquivo sem imagem disponível na ptwiki ou no Commons: ' + target.title, target.title,{code:'missing-file'});")
    source = once(source, "'Ligação inexistente em Ver também' : 'Ligação inexistente') + ': ' + target.title, target.title);",
                  "'Ligação inexistente em Ver também' : 'Ligação inexistente') + ': ' + target.title, target.title,{code:'missing-page'});")
    source = once(source, "finding('Título inválido: ' + target.title, target.title);",
                  "finding('Título inválido: ' + target.title, target.title,{code:'invalid-title'});")
    return source
