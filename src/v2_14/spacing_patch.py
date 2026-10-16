"""Collapse excess literal empty lines only in ordinary article prose."""
from pathlib import Path
import re


def once(source, old, new):
    assert source.count(old) == 1, 'Prose-spacing integration anchor changed.'
    return source.replace(old, new, 1)


def apply(source):
    helpers = Path(__file__).with_name('prose_spacing.js').read_text()
    source = once(source, '    function auxiliaryParameters(raw, bump, warn) {',
                  helpers + '\n    function auxiliaryParameters(raw, bump, warn) {')
    source = once(source, "        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));",
                  "        stage('v214-prose-spacing',s=>v214ProseSpacingEdits(s,cfg));\n" +
                  "        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));")
    source = once(source, "        stage('v212-reference-fields',s=>v212ReferenceFieldPlan(s,cfg).text);",
                  "        stage('v214-prose-spacing',s=>v214ProseSpacingPlan(s,cfg).text);\n" +
                  "        stage('v212-reference-fields',s=>v212ReferenceFieldPlan(s,cfg).text);")
    source = once(source, "        auxiliaryParameters: 'Parâmetros de predefinições auxiliares',",
                  "        v214ProseSpacing:'Linhas vazias excedentes na prosa',\n" +
                  "        auxiliaryParameters: 'Parâmetros de predefinições auxiliares',")
    source = once(source, '        const restored=shield.restore(s);',
                  '        const restored=v214ProseSpacingCleanup(shield.restore(s),cfg,noop);')
    source = once(source,
                  '        return {text: shield.restore(s), changes: [...counts].map(([id, count]) =>',
                  "        const finalText=v214ProseSpacingCleanup(shield.restore(s),cfg,bump);\n" +
                  "        if(cfg.captureTrace&&finalText!==shield.restore(s))trace.push({label:'Linhas vazias excedentes na prosa',before:shield.restore(s),after:finalText});\n" +
                  '        return {text: finalText, changes: [...counts].map(([id, count]) =>')
    source = once(source,
                  'notApplied: notAppliedReasons(shield.restore(s),cfg), suggestions: reviewSuggestions(shield.restore(s), cfg)};',
                  'notApplied: notAppliedReasons(finalText,cfg), suggestions: reviewSuggestions(finalText, cfg)};')
    source = once(source, '        const component=(kind,label,a,b,c,d)=>{',
                  "        for(const spacing of v214ProseSpacingEdits(before,{...DEFAULTS,namespaceNumber:0})){\n" +
                  "            const start=v211CountAnchor(spacing.start,edits),end=v211CountAnchor(spacing.end,edits,false,true);\n" +
                  "            if(after.slice(start,end)!==spacing.text)continue;\n" +
                  "            const ids=[...new Set([...indices('old',spacing.start,spacing.end),...indices('new',start,end)])];\n" +
                  "            if(!ids.length||ids.some(i=>claimed.has(i)||/[^\\r\\n]/.test(edits[i].before+edits[i].after)))continue;\n" +
                  "            emit('prose-spacing','Linhas vazias excedentes na prosa',ids,[{start:spacing.start,end:spacing.end}],[{start,end}]);\n" +
                  "        }\n" +
                  '        const component=(kind,label,a,b,c,d)=>{')
    exports = ','.join(re.findall(r'^    function (v214\w+)\(', helpers, re.MULTILINE))
    assert exports
    return once(source, '        v212ReferenceFieldScope,v212LiteralCitationFields,',
                '        ' + exports + ',\n        v212ReferenceFieldScope,v212LiteralCitationFields,')
