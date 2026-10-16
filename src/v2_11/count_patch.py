"""Count retained syntax occurrences separately from topics and diff choices."""
from pathlib import Path


def replace_once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('count patch anchor count: ' + repr(old[:90]))
    return source.replace(old, new, 1)


def apply(source):
    engine = Path(__file__).with_name('count_engine.js').read_text()
    source = replace_once(source, '    function lineDiffHunks(before, after) {', engine + '\n    function lineDiffHunks(before, after) {')
    source = replace_once(source, ' * locais em artigos extensos, e o resultado informa os tipos de\n * ajuste mantidos no texto, sem contar blocos como correções.', ' * locais em artigos extensos. O resultado conta os componentes\n * corrigidos que permanecem no texto e informa os temas em separado.\n * A versão 2.11 permite conferir as ocorrências na comparação, sem\n * apresentar tipos de ajuste ou blocos como quantidades de correções.')
    source = replace_once(source, '        v27RetainedTypes, v27RawDiff,', '        v211RetainedAdjustments,v211CountUnits,\n        v27RetainedTypes, v27RawDiff,')
    source = replace_once(source, 'comparisonPlan.selectedTypes=v27RetainedTypes(comparisonPlan.before,comparisonPlan.selectedSource);', 'comparisonPlan.selectedTypes=v211RetainedAdjustments(comparisonPlan.before,comparisonPlan.selectedSource);')
    source = replace_once(source, 'last.retainedTypes||(last.retainedTypes=v27RetainedTypes(last.before,last.after,last.kinds||[]))', 'last.retainedTypes||(last.retainedTypes=v211RetainedAdjustments(last.before,last.after,last.kinds||[]))')
    source = replace_once(source, "retained?retained.text:'';", "retained?(proposed&&retained.exact?retained.count+' ajuste'+(retained.count===1?'':'s')+' selecionado'+(retained.count===1?'':'s'):retained.text):'';\n        let topicLine=host.querySelector('.ajg-result-topics');if(!topicLine){topicLine=node('div',undefined,'ajg-result-topics');host.querySelector('.ajg-result-count').after(topicLine);}topicLine.textContent=retained?.topics?.join(', ')||'';")
    source = replace_once(source, '        const groups = comparisonDisplayGroups(before, after, hunks);\n        if(plan.header)', "        const retained=v211RetainedAdjustments(before,after);\n        const ledger=node('details',undefined,'ajg-occurrence-ledger');ledger.append(node('summary',retained.exact?'Conferir '+retained.count+' ajustes':'Conferir os ajustes'));\n        const items=node('ol');for(const event of retained.events){const item=node('li',event.label+': ');item.dataset.adjustmentId=event.id;item.append(node('code',event.before.slice(0,100)+' → '+event.after.slice(0,100)));items.append(item);}ledger.append(items);content.append(ledger);\n        const groups = comparisonDisplayGroups(before, after, hunks);\n        if(plan.header)")
    return source
