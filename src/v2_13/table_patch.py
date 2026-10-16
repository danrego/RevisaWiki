"""Add finite, source-bound literal table repairs to the frozen release."""
from pathlib import Path
import re


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('2.13 table anchor changed: ' + repr(old[:100]))
    return source.replace(old, new, 1)


def apply(source):
    module = Path(__file__).with_name('table_helpers.js').read_text()
    source = once(source, '    function v210ResponsiveTableStyle(raw) {', module + '\n    function v210ResponsiveTableStyle(raw) {')
    source = once(source,
        "        if(!v210TableEnabled(source,cfg)||!/^\\s*\\|-[ \\t]*\\r?\\n(?:[ \\t]*\\r?\\n)*[ \\t]*\\|[-}]|\\b(?:rowspan|colspan)[ \\t]*=[ \\t]*[“‘]|^[ \\t]*[!|][^\\r\\n]*\\b(?:scope|rowspan|colspan)[ \\t]*=[ \\t]*[\"']|^\\s*<\\/table[ \\t]*>[ \\t]*$/im.test(source))return [];",
        "        if(!v210TableEnabled(source,cfg)||!v213TableFiniteTrigger(source)&&!/^\\s*\\|-[ \\t]*\\r?\\n(?:[ \\t]*\\r?\\n)*[ \\t]*\\|[-}]|\\b(?:rowspan|colspan)[ \\t]*=[ \\t]*[“‘]|^[ \\t]*[!|][^\\r\\n]*\\b(?:scope|rowspan|colspan)[ \\t]*=[ \\t]*[\"']|^\\s*<\\/table[ \\t]*>[ \\t]*$/im.test(source))return [];")
    source = once(source,
        '[v210TableMixedCloserEdits,v210TableEmptyRowEdits,v210TableCurlyQuoteEdits,v212TableOppositeSpanQuoteEdits,v210TableMissingBarEdits]',
        '[v213TableFiniteRepairEdits,v210TableMixedCloserEdits,v210TableEmptyRowEdits,v210TableCurlyQuoteEdits,v212TableOppositeSpanQuoteEdits,v210TableMissingBarEdits]')
    # Recover an independently bounded table before whole-source reference
    # checks. The later transaction remains for newly unwrapped source.
    early = "        stage('v213-reference-closer-slash',s=>v213ReferenceCloserEdits(s,cfg));"
    if early not in source:
        early = "        stage('v210-harvard-anchors',s=>v210HarvardAnchorEdits(s,cfg));"
    source = once(source, early,
        "        stage('v210-table-syntax',s=>v213TableFiniteRepairEdits(s,cfg));\n" + early)
    composition = "        stage('v213-reference-closer-slash',edits(v213ReferenceCloserEdits));"
    if composition not in source:
        composition = "        stage('reference-tag-spacing',edits(v210ReferenceSyntaxEdits));"
    source = once(source, composition,
        "        stage('table-syntax',edits(v213TableFiniteRepairEdits));\n" + composition)
    source = once(source, '        v210ResponsiveTableStyle,v210ResponsiveTopLevel,',
        '        ' + ','.join(re.findall(r'^    function (v213\w+)\(', module, re.MULTILINE)) + ',\n        v210ResponsiveTableStyle,v210ResponsiveTopLevel,')
    source = once(source,
        '        // Confirma uma movimentação simples retirando o mesmo objeto dos dois',
        '''        // A transposition in one proved literal attribute name is one
        // correction, even when the lexical diff separates its characters.
        const v213TableWitnesses=v213TableCountWitnesses(before);
        const v213DuplicateGroups=new Map();
        for(const edit of v213TableWitnesses.filter(edit=>edit.ruleId==='tableDuplicateSortValues')){const key=edit.proof.attributeStart+':'+edit.proof.attributeEnd;let group=v213DuplicateGroups.get(key);if(!group)v213DuplicateGroups.set(key,group=[]);group.push(edit);}
        for(const group of v213DuplicateGroups.values()){
            const a=group[0].proof.attributeStart,b=group[0].proof.attributeEnd,c=v211CountAnchor(a,edits),d=v211CountAnchor(b,edits,false,true),base=v213TableWitnesses.filter(edit=>edit.proof.attributeStart===a&&edit.proof.attributeEnd===b),scopes=v213TableWitnesses.filter(edit=>edit.proof.optionalScope&&edit.start===a);
            const variants=[base,base.concat(scopes)].map(items=>items.slice().sort((left,right)=>left.start-right.start||left.end-right.end)),matched=variants.find(items=>v24SyntaxApply(before.slice(a,b),items.map(edit=>({...edit,start:edit.start-a,end:edit.end-a})))===after.slice(c,d));
            if(!matched)continue;
            const ids=edits.map((part,index)=>part.start>=a&&part.end<=b&&part.newStart>=c&&part.newEnd<=d?index:-1).filter(index=>index>=0);
            if(!ids.length||ids.some(index=>claimed.has(index)))continue;ids.forEach(index=>claimed.add(index));let delta=0;
            for(const edit of matched){const at=c+edit.start-a+delta;component('table-attribute',edit.ruleId==='tableDuplicateSortValues'?'Retirada de atributo idêntico de ordenação':edit.ruleId==='tableHeaderScopes'?'Alcance de cabeçalho':'Nome de atributo de tabela',edit.start,edit.end,at,at+edit.text.length);delta+=edit.text.length-(edit.end-edit.start);}
        }
        for(const edit of v213TableWitnesses){
            if(!['tableSpanAttributeTypos','tableSortAttributeTypos'].includes(edit.ruleId))continue;
            const a=edit.start,b=edit.end,c=v211CountAnchor(a,edits),d=v211CountAnchor(b,edits,false,true),ids=edits.map((part,index)=>part.start>=a&&part.end<=b&&part.newStart>=c&&part.newEnd<=d?index:-1).filter(index=>index>=0);
            if(!ids.length||ids.some(index=>claimed.has(index))||after.slice(c,d)!==edit.text)continue;
            emit('table-attribute','Nome de atributo de tabela',ids,[{start:a,end:b}],[{start:c,end:d}]);
        }
        // Confirma uma movimentação simples retirando o mesmo objeto dos dois''')
    return source
