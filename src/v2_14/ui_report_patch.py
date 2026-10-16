"""Group review proposals by explicit producer identity and keep recovery text quiet."""
from pathlib import Path


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('2.14.0 review UI anchor changed: ' + repr(old[:120]))
    return source.replace(old, new, 1)


def section(source, begin, end, replacement):
    if source.count(begin) != 1 or source.count(end) != 1:
        raise ValueError('2.14.0 review UI section changed: ' + begin)
    start = source.index(begin)
    stop = source.index(end, start)
    return source[:start] + replacement + source[stop:]


def simplify(source):
    source = once(source,
        "if (cfg.authors && ['autor', 'autores', 'editor', 'editores', 'vauthors', 'veditors', 'vautores', 'veditores'].includes(k))",
        "if (cfg.authors && ['autor', 'autores', 'editor', 'editores'].includes(k))")
    source = once(source,
        'v214ReviewGroupKey, v214ReviewGroups, technicalFinding,',
        'v214ReviewGroupKey, v214ReviewGroups, v214ReviewFindingVisible, v214RepresentedReviewMessages, technicalFinding,')
    source = once(source,
        "        let container = report.querySelector('.ajg-issues');\n        if (!container) { container = node('div', undefined, 'ajg-issues'); report.append(container); }\n        container.replaceChildren();",
        "        for(const old of report.querySelectorAll('.ajg-issues,.ajg-technical-info,.ajg-review-history,.ajg-not-applied'))old.remove();")
    source = once(source,
        "        const report = panel.querySelector('.ajg-report');\n        for(const old",
        "        const report=panel.querySelector('.ajg-report');\n        for(const duplicate of panel.querySelectorAll('.ajg-report'))if(duplicate!==report)duplicate.remove();\n        for(const old")
    source = once(source,
        "        const live=findings.filter(current),technical=groupedTechnicalFindings(live.filter(technicalFinding));\n        const pending=live.filter(f=>!technicalFinding(f)&&!represented(f)),history=findings.filter(finding=>!current(finding));",
        "        const live=findings.filter(current);\n        const pending=live.filter(f=>v214ReviewFindingVisible(f)&&!represented(f));")
    source = once(source,
        "        const suggestionsHost=report.querySelector('.ajg-suggestions');\n        v214SyncReviewGroups(suggestionsHost);",
        "        const suggestionsHost=report.querySelector('.ajg-suggestions');\n        if(lastLocalResult?.text!==source)suggestionsHost?.replaceChildren();\n        v214SyncReviewGroups(suggestionsHost);")
    source = once(source,
        "        let review = report.querySelector('.ajg-review-area');\n        if (!review) {",
        """        const existingReviews=[...report.querySelectorAll('.ajg-review-area')];
        let review=existingReviews.find(item=>item.parentNode===report)||existingReviews[0];
        for(const duplicate of existingReviews)if(duplicate!==review)duplicate.remove();
        if(review&&review.parentNode!==report)report.append(review);
        if (!review) {""")
    source = section(source,
        '        if(technical.length){',
        '        updateAppliedResult();\n    }\n\n    function showReport(result) {',
        "        report.hidden=!pending.length&&!suggestionsCount&&!report.querySelector('.ajg-automatic')?.textContent;\n")
    source = section(source,
        "        if (result.kind !== 'spelling' && result.notApplied?.length) {",
        "        if (result.kind !== 'spelling') {\n        setIssues('spelling'",
        '')
    source = once(source,
        "            const status=node('p','Conferência online indisponível. Use Mostrar previsão para ver o resultado.','ajg-preview-status');\n            status.dataset.status='incomplete';automatic.append(status);",
        "            setIssues('preview-availability',[{code:'preview-unavailable',severity:'warning',message:'Conferência online indisponível. Use Mostrar previsão para ver o resultado.'}],result.text,false);")
    source = once(source,
        "        if(result.previewCheck?.checked) setIssues('automatic-preview'",
        "        if(result.previewCheck?.status!=='incomplete')setIssues('preview-availability',[],result.text,false);\n        if(result.previewCheck?.checked) setIssues('automatic-preview'")
    source = once(source,
        '        renderIssues(); detail.hidden = !detail.textContent;',
        '        renderIssues();')
    source = once(source,
        '        if (last && result.appliedHunks && result.comparisonBefore === last.before && result.text === last.after)\n            last.displayGroups = comparisonDisplayGroups(last.before, last.after, result.appliedHunks);\n',
        '')
    source = section(source,
        '    async function writeChosenChanges() {',
        '    function appliedBaseline(adapter, source) {',
        '')
    source = once(source,
        "        view.disabled = !!stale || localBusy || onlineBusy;\n        host.querySelector('.ajg-undo').hidden = !last;\n        const expanded = !!panel.querySelector('.ajg-diff > details')?.open;\n        view.setAttribute('aria-expanded', String(expanded));",
        "        const nativeDiff=v214NativeDiffControl();view.hidden=!nativeDiff;view.disabled=localBusy||onlineBusy||!nativeDiff||nativeDiff.disabled;\n        host.querySelector('.ajg-undo').hidden = !last;")
    source = section(source,
        '    async function showAppliedChanges() {',
        '    const endMatterReadCache = new Map();',
        """    function v214NativeDiffControl() {
        const candidate=root.document.querySelector('#editform #wpDiff[name="wpDiff"],#editform #wpDiffWidget [name="wpDiff"]');
        if(candidate&&candidate.matches('input[type="submit"],button')&&candidate.type==='submit'&&candidate.form?.id==='editform'&&!candidate.closest('#revisawiki-ptwiki'))return candidate;
        return null;
    }
    function showAppliedChanges() {
        if(localBusy||onlineBusy)return;
        const nativeDiff=v214NativeDiffControl();
        if(!nativeDiff||nativeDiff.disabled)return;
        nativeDiff.click();
    }

""")
    source = once(source,
        '            showComparison(adapter, result.comparisonBefore ?? before, result, !compareOnly); renderIssues();',
        '            comparisonPlan=null;renderIssues();')
    source = once(source,
        "            message(compareOnly ? 'Comparação pronta. Escolha os trechos e clique em Aplicar escolhas.' : 'Código ajustado. Confira as alterações e a pré-visualização antes de publicar.');",
        "            message('Código ajustado. Confira Mostrar alterações e a pré-visualização antes de publicar.');")
    source = once(source,
        "        const changesControl = control('Ver o que mudou', showAppliedChanges, 'ajg-show-changes', 'Abrir ou recolher a comparação antes e depois.', 'changes');\n        changesControl.setAttribute('aria-expanded', 'false'); changesControl.setAttribute('aria-controls', 'revisawiki-comparison');",
        "        const changesControl=control('Mostrar alterações',showAppliedChanges,'ajg-show-changes','Usar Mostrar alterações do próprio editor.','changes');changesControl.hidden=!v214NativeDiffControl();")
    # The native shortcut has its own native-control availability state. The
    # generic busy reset must not re-enable a disabled native submit control.
    source = once(source,
        "panel.querySelectorAll('.ajg-check-all,.ajg-show-changes,.ajg-select-changes,",
        "panel.querySelectorAll('.ajg-check-all,.ajg-select-changes,")
    source = once(source,
        "        online.append(control('Ver ajustes antes de aplicar', () => run(true), 'ajg-compare', 'Comparar ajustes propostos sem mudar o texto.', 'compare'));\n",
        '')
    source = once(source,
        "stale?'Execute o ajuste novamente para atualizar a comparação.'",
        "stale?'Execute o ajuste novamente para atualizar o resultado.'")
    source = once(source, '    async function run(compareOnly) {', '    async function run() {')
    source = once(source,
        'originalSource: compareOnly ? before : appliedBaseline(adapter, before), options: prepared',
        'originalSource: appliedBaseline(adapter, before), options: prepared')
    source = once(source, '            task.guard(); result.proposed = !!compareOnly;', '            task.guard(); result.proposed = false;')
    source = once(source, '            if (!compareOnly && result.text !== before) {', '            if (result.text !== before) {')
    source = once(source, '            v211MarkCheckedDraft(adapter,result,compareOnly,checkedOptions);', '            v211MarkCheckedDraft(adapter,result,false,checkedOptions);')
    source = source.replace('run(false)', 'run()')
    source = once(source,
        "        const diffs = node('div', undefined, 'ajg-diff'); diffs.id = 'revisawiki-comparison';\n        panel.append(top, intro, status, stop, onlineControls, resultSummary, diffs, report, tools);",
        "        panel.append(top, intro, status, stop, onlineControls, resultSummary, report, tools);")
    source = once(source,
        '        if (panel && panel.isConnected && panelEditor === adapter.id) return;',
        "        if(panel&&panel.isConnected&&panelEditor===adapter.id){for(const duplicate of root.document.querySelectorAll('#revisawiki-ptwiki'))if(duplicate!==panel)duplicate.remove();return;}")
    source = once(source,
        '        if (panel) panel.remove();\n        if (panelEditor !== adapter.id)',
        "        if (panel) panel.remove();\n        for(const duplicate of root.document.querySelectorAll('#revisawiki-ptwiki'))duplicate.remove();\n        if (panelEditor !== adapter.id)")
    # Cleanup calls may still run after undo, spelling or a canceled task. No
    # custom comparison container is created by this interface anymore.
    source = source.replace("panel.querySelector('.ajg-diff').replaceChildren()", "panel.querySelector('.ajg-diff')?.replaceChildren()")
    return source


def apply(source):
    helpers = Path(__file__).with_name('ui_report_helpers.js').read_text()
    source = once(source, '    function technicalFinding(finding) {', helpers + '\n    function technicalFinding(finding) {')
    source = once(source, '        function offer(start, end, label, choices) {', '        function offer(start, end, label, choices, reviewGroup) {')
    source = once(source,
        "            proposals.push({id: 'review-' + proposals.length, start, end, before, label,\n                choices: choices.filter(c => c.after !== before)});",
        "            proposals.push({id: 'review-' + proposals.length, start, end, before, label,\n                ...(reviewGroup?{reviewGroup}:{}),choices: choices.filter(c => c.after !== before)});")
    source = once(source,
        "                        offer(n.start, n.end, 'Parâmetro fora do catálogo de ' + p.parts[0].trim() + ': ' + e.key, choices);",
        "                        offer(n.start, n.end, 'Parâmetro fora do catálogo de ' + p.parts[0].trim() + ': ' + e.key, choices,\n                            {kind:'unsupported-template-parameter',template:p.name,parameter:e.key,warningMessages:v214ReviewWarningMessages(p,e,profile)});")
    source = once(source,
        'captionTerminalPeriods, repairCenturySyntax, technicalFinding, groupedTechnicalFindings, renderedTableRegroupingProof,',
        'captionTerminalPeriods, repairCenturySyntax, v214ReviewGroupKey, v214ReviewGroups, technicalFinding, groupedTechnicalFindings, renderedTableRegroupingProof,')
    source = once(source,
        '    function suggestionKey(p) { return JSON.stringify([p.label, p.before, p.choices]); }',
        '    function suggestionKey(p) { const group=v214ReviewGroupKey(p);return JSON.stringify([p.label,p.before,p.choices,...(group?[group,p.start,p.end]:[])]); }')
    source = once(source,
        "        const live=findings.filter(current),technical=groupedTechnicalFindings(live.filter(technicalFinding));\n        const pending=live.filter(f=>!technicalFinding(f)),history=findings.filter(finding=>!current(finding));",
        """        const suggestionsHost=report.querySelector('.ajg-suggestions');
        v214SyncReviewGroups(suggestionsHost);
        const representedMessages=v214RepresentedReviewMessages(lastLocalResult,source);
        const represented=finding=>finding.domain==='local'&&finding.code==='warning'&&finding.severity!=='error'&&representedMessages.has(finding.message);
        const live=findings.filter(current),technical=groupedTechnicalFindings(live.filter(technicalFinding));
        const pending=live.filter(f=>!technicalFinding(f)&&!represented(f)),history=findings.filter(finding=>!current(finding));""")
    source = once(source,
        "        if (review.hidden) review.open = false;\n        else if (pending.length || suggestionsCount) review.open = true;",
        "        if(!review.hidden&&review.dataset.initiallyOpened!=='1'){review.open=true;review.dataset.initiallyOpened='1';}")
    source = once(source,
        "        const list = node('ul');\n        if ((result.removedDescriptions || []).length) list.appendChild(node('li',\n            'Descrições removidas, caso queira aproveitar no Wikidata: ' + result.removedDescriptions.join(' ')));\n        automatic.appendChild(list);",
        """        if((result.removedDescriptions||[]).length){
            const recovery=node('details',undefined,'ajg-description-recovery');
            recovery.append(node('summary','Descrição curta retirada · '+result.removedDescriptions.length));
            recovery.append(node('p','Texto guardado para consulta ou uso no Wikidata.'));
            for(const description of result.removedDescriptions)recovery.append(snippet(description));
            suggestions.append(recovery);
        }""")
    source = once(source,
        "        for (const proposal of result.suggestions || []) {\n            if (ignoredSuggestions.has(suggestionKey(proposal))) continue;\n            const row = node('details', undefined, proposal.kind === 'spelling' ? 'ajg-spelling-suggestion' : ''), title = node('summary', 'Rever: ' + proposal.label);",
        """        for(const group of v214ReviewGroups((result.suggestions||[]).filter(proposal=>!ignoredSuggestions.has(suggestionKey(proposal))))){
            let target=suggestions;
            if(group.key){
                target=node('details',undefined,'ajg-review-group');target.dataset.label=group.label;
                target.dataset.warningMessages=JSON.stringify(group.warningMessages);target.dataset.reviewKey=group.key;
                target.append(node('summary','Rever: '+group.label));suggestions.append(target);
            }
            for(const [occurrence,proposal]of group.proposals.entries()){
            const row = node('details', undefined, proposal.kind === 'spelling' ? 'ajg-spelling-suggestion' : 'ajg-review-occurrence'), title = node('summary', group.key?'Ocorrência '+(occurrence+1):'Rever: ' + proposal.label);""")
    source = once(source,
        '            suggestions.appendChild(row);\n        }\n        renderIssues(); detail.hidden = !detail.textContent;',
        '            target.appendChild(row);\n            }\n        }\n        renderIssues(); detail.hidden = !detail.textContent;')
    return simplify(source)
