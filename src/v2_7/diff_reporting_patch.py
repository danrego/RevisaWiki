from pathlib import Path


def replace_once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Diff/report integration anchor changed: ' + before[:90])
    return source.replace(before, after, 1)


def replace_function(source, start, following, replacement):
    if source.count(start) != 1 or source.count(following) != 1:
        raise ValueError('Diff/report function boundary changed: ' + start)
    left = source.index(start)
    right = source.index(following, left)
    return source[:left] + replacement + source[right:]


def apply(source):
    helper = Path(__file__).with_name('diff_reporting.js').read_text()
    if 'function v27SequenceMatches(' in source:
        raise ValueError('Diff/report patch was already applied')
    source = replace_once(source, '    function lineDiffHunks(before, after) {', helper + '\n    function lineDiffHunks(before, after) {')
    source = replace_function(source, '    function lineDiffHunks(before, after) {', '    // Analisa sem alterar exemplos literais',
        '    function lineDiffHunks(before, after) { return v27LineDiffHunks(before, after); }\n')
    source = replace_function(source, '    function lexicalDiff(before, after, start = 0, newStart = 0) {', '    function reviewAtoms(source) {',
        '    function lexicalDiff(before, after, start = 0, newStart = 0) { return v27LexicalDiff(before,after,start,newStart); }\n')
    left = source.index('    function diffHunks(before, after) {')
    right = source.index('        for (const h of edits) {', left)
    source = source[:left] + '''    function diffHunks(before, after) {
        if (before === after) return [];
        const a = reviewAtoms(before), b = reviewAtoms(after), edits = v27RawDiff(before,after), findOld=v27AtomLookup(a), findNew=v27AtomLookup(b);
''' + source[right:]
    source = replace_once(source, 'const aa = a.find(x => h.start >= x.start && h.end <= x.end && h.start < x.end && h.end > x.start);', 'const aa = findOld(h.start,h.end);')
    source = replace_once(source, 'const bb = b.find(x => h.newStart >= x.start && h.newEnd <= x.end && h.newStart < x.end && h.newEnd > x.start);', 'const bb = findNew(h.newStart,h.newEnd);')
    source = replace_once(source, "return coarse.map(h => ({...h, unit: 'Trecho composto'}));", "return lineDiffHunks(before,after).map(h => ({...h, unit: 'Trecho composto'}));")
    source = replace_function(source, '    function byteMetrics(before,after,hunks) {', '    function mechanicalMinorResult(source,options={}) {',
        '    function byteMetrics(before,after,hunks) { return v27ByteMetrics(before,after,hunks); }\n\n')
    source = replace_once(source, 'if(!metrics.consistent||metrics.changed>500||metrics.hunks>5)', 'if(metrics.precise===false||!metrics.consistent||metrics.changed>500||metrics.hunks>5)')
    source = replace_once(source, "const signature = predicate => nodes.filter(n => predicate(n.name)).map(n => n.raw).join('\\n');", "const signature = (predicate,outsideReferences=false) => nodes.filter(n => predicate(n.name)&&(!outsideReferences||!inRange(n.start,references))).map(n => n.raw).join('\\n');")
    source = replace_once(source, """            const html = (view.match(/<\\/?[a-z][^<>]*>/gi) || [])
                .filter(tag => !/^<\\/?(?:ref|references)\\b/i.test(tag)).join('\\n');""", """            const html = [...view.matchAll(/<\\/?[a-z][^<>]*>/gi)]
                .filter(tag => !inRange(tag.index,references)&&!/^<\\/?(?:ref|references)\\b/i.test(tag[0])).map(tag=>tag[0]).join('\\n');""")
    source = replace_once(source, "formatting: signature(n => wrappers.has(n)) + '\\n' + html,", "formatting: signature(n => wrappers.has(n),true) + '\\n' + html,")
    source = replace_once(source, "                else links.push(m[0]);", "                else if(!inRange(m.index,references))links.push(m[0]);")
    source = replace_once(source, "categories: categories.join('\\n'), images: images.join('\\n'),", "categories: categories.join('\\n')+'\\n'+signature(n=>/^(?:defaultsort|ordenaçãopadrão|ordenacaopadrao|ordempadrão|ordempadrao|ordenação)\\s*:/i.test(n)), images: images.join('\\n'),")
    old = '''        const groups = proposed ? comparisonPlan.groups : actual ? last.displayGroups : null;
        host.querySelector('.ajg-result-count').textContent = groups?.length ? groups.length + ' trecho' + (groups.length === 1 ? '' : 's') + ' alterado' + (groups.length === 1 ? '' : 's') :
            stale ? 'Execute o ajuste novamente para atualizar a comparação.' : '';
'''
    new = '''        let retained = null;
        if(proposed){
            const key=comparisonPlan.hunks.map(h=>h.accepted?'1':'0').join('');
            if(comparisonPlan.typeKey!==key){comparisonPlan.selectedSource=composeChanges(comparisonPlan.before,comparisonPlan.hunks);comparisonPlan.selectedTypes=v27RetainedTypes(comparisonPlan.before,comparisonPlan.selectedSource);comparisonPlan.typeKey=key;}
            retained=comparisonPlan.selectedTypes;
        }else if(actual)retained=last.retainedTypes||(last.retainedTypes=v27RetainedTypes(last.before,last.after,last.kinds||[]));
        host.querySelector('.ajg-result-count').textContent=stale?'Execute o ajuste novamente para atualizar a comparação.':retained?retained.text:'';
'''
    source = replace_once(source, old, new)
    source = replace_once(source, "const selected=composeChanges(comparisonPlan.before,comparisonPlan.hunks);comparisonPlan.selectedBytes=", "const selected=comparisonPlan.selectedSource;comparisonPlan.selectedBytes=")
    source = replace_once(source, '''        const actual = last && adapter?.id === last.id && source === last.after;
''', '''        if(last&&adapter?.id===last.id&&source!==last.after&&!localBusy&&!onlineBusy){
            restoreOwnedSummary(last.summary);last.summary=null;
            if(source===last.before){restoreOwnedMinor();last=null;}
        }
        const actual = last && adapter?.id === last.id && source === last.after;
''')
    source = replace_once(source, "        const before = adapter.read(), task = beginLocalAnalysis(adapter, before, 'Preparando os ajustes...');", "        const before = adapter.read();\n        if(last&&last.id===adapter.id&&last.after!==before){restoreOwnedSummary(last.summary);restoreOwnedMinor();last=null;}\n        const task = beginLocalAnalysis(adapter, before, 'Preparando os ajustes...');")
    source = replace_once(source, "        wrap.append(node('summary', 'Antes e depois'));", "        plan.header=node('summary','Antes e depois');wrap.append(plan.header);")
    source = replace_once(source, '''        const groups = comparisonDisplayGroups(before, after, hunks);
        if (!groups.length)''', '''        const groups = comparisonDisplayGroups(before, after, hunks);
        if(plan.header)plan.header.textContent='Antes e depois · '+groups.length+' bloco'+(groups.length===1?'':'s');
        if (!groups.length)''')
    source = replace_once(source, "        message('Escolhas aplicadas: ' + plan.hunks.filter(h => h.accepted).length + ' de ' + plan.hunks.length + ' trechos. Confira antes de salvar.');", "        message('Escolhas aplicadas. Confira o resultado antes de salvar.');")
    source = replace_once(source, "check.setAttribute('aria-label', 'Manter alteração ' + (Number(h.id.split('-')[1]) + 1));", "check.setAttribute('aria-label', 'Manter trecho ' + (index + 1));")
    source = replace_once(source, "node('span', ' Manter ajuste ' + (index + 1))", "node('span', ' Manter trecho ' + (index + 1))")
    source = replace_once(source, "        host.title='Antes: '+metrics.before.toLocaleString('pt-BR')+' bytes. Depois: '+metrics.after.toLocaleString('pt-BR')+' bytes. Inserções contabilizadas: '+metrics.added+'. Remoções contabilizadas: '+metrics.removed+'.';", "        host.title='Antes: '+metrics.before.toLocaleString('pt-BR')+' bytes. Depois: '+metrics.after.toLocaleString('pt-BR')+' bytes. '+(metrics.precise===false?'Variação líquida exata. O detalhamento das inserções e remoções ultrapassou o limite de cálculo.':'Inserções contabilizadas: '+metrics.added+'. Remoções contabilizadas: '+metrics.removed+'.');")
    source = replace_once(source, '        defaults: Object.assign({}, DEFAULTS), cleanup,', '        v27RetainedTypes, v27RawDiff, v27DiffCacheStatus, v27AtomLookup,\n        defaults: Object.assign({}, DEFAULTS), cleanup,')
    return source
