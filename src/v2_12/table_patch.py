"""Extend the finite table proofs without rewriting data or sorting fields."""
from pathlib import Path
import re


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('2.12 table anchor changed: ' + repr(old[:120]))
    return source.replace(old, new, 1)


def apply(source):
    module = Path(__file__).with_name('table_helpers.js').read_text()
    source = once(source, '    function v210ResponsiveTableStyle(raw) {', module + '\n    function v210ResponsiveTableStyle(raw) {')
    source = once(source,
        "cell:new Set(['rowspan','colspan','scope','class','style','align','valign','width','height','bgcolor'])",
        "cell:new Set(['rowspan','colspan','scope','class','style','align','valign','width','height','bgcolor','data-sort-value','data-sort-type'])")
    source = once(source,
        "        return {entries,values:parsed.values,duplicates:parsed.duplicates.map(entry=>({...entry,start:start+Math.max(0,entry.start-1),end:start+entry.end-1}))};",
        "        if(!v212SortAttributes(entries,parsed.duplicates,kind))return null;\n        return {entries,values:parsed.values,duplicates:parsed.duplicates.map(entry=>({...entry,start:start+Math.max(0,entry.start-1),end:start+entry.end-1}))};")
    source = once(source,
        "return !dynamic.some(range=>range.start<table.end&&range.end>table.start)&&!/<\\/?(?:table|tr|td|th|thead|tbody|tfoot)\\b/i.test(inside)",
        "return !dynamic.some(range=>range.start<table.end&&range.end>table.start&&!v212TableLiteralFormatnum(source,range))&&!/<\\/?(?:table|tr|td|th|thead|tbody|tfoot)\\b/i.test(inside)")
    source = once(source,
        '        const grid=[],widths=[];let cost=0;\n        for(let row=0;row<rows.length;row++){',
        "        const sorting=boundaries.filter(cell=>cell.attrs.entries.some(entry=>entry.key==='data-sort-value'||entry.key==='data-sort-type'));\n        if(sorting.length&&(!table.attrs.attrs.some(attr=>attr.key==='class'&&/\\bsortable\\b/.test(attr.value||''))||sorting.some(cell=>cell.attrs.values.has('data-sort-type')&&cell.kind!=='!')))return null;\n        const grid=[],widths=[];let cost=0;\n        for(let row=0;row<rows.length;row++){")
    source = once(source,
        '    function v210ResponsiveTableEdits(source,cfg={}) {\n        if(!v29TableEnabled(source,cfg)||cfg.responsiveTableWrappers===false||v24SyntaxScan(source).issues.length)return [];\n        const edits=[],prepared=v272LiteralTables(source),shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source),hash=v24SyntaxHash(source);\n        for(const [tableIndex,table]of prepared.tables.entries()){' ,
        '    function v210ResponsiveTableEdits(source,cfg={}) {\n        if(!v29TableEnabled(source,cfg)||cfg.responsiveTableWrappers===false||v24SyntaxScan(source).issues.length)return [];\n        const edits=v212FixedWidthTableEdits(source,cfg),prepared=v272LiteralTables(source),shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source),hash=v24SyntaxHash(source);\n        for(const [tableIndex,table]of prepared.tables.entries()){' )
    source = once(source,
        '[v210TableMixedCloserEdits,v210TableEmptyRowEdits,v210TableCurlyQuoteEdits,v210TableMissingBarEdits]',
        '[v210TableMixedCloserEdits,v210TableEmptyRowEdits,v210TableCurlyQuoteEdits,v212TableOppositeSpanQuoteEdits,v210TableMissingBarEdits]')
    source = once(source,
        "        const steps=(plan.safe?.steps||plan.steps||[]).filter(step=>V210_TABLE_STAGE_NAMES.includes(step.name));if(!steps.length)return {accepted:true,reason:''};",
        "        const steps=(plan.safe?.steps||plan.steps||[]).filter(step=>V210_TABLE_STAGE_NAMES.includes(step.name)||step.name==='v210-responsive-table-wrapper');if(!steps.length)return {accepted:true,reason:''};")
    source = once(source, '        v210ResponsiveTableStyle,v210ResponsiveTopLevel,',
        '        ' + ','.join(re.findall(r'^    function (v212\w+)\(', module, re.MULTILINE)) + ',\n        v210ResponsiveTableStyle,v210ResponsiveTopLevel,')
    return source
