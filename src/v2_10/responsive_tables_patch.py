"""Insert finite responsive wrapper helpers and their test API."""
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Responsive table helper anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('responsive_tables.js').read_text()
    source = replace(source, '    function v29TableEnabled(source,cfg={}) {',
                     module + '\n    function v29TableEnabled(source,cfg={}) {')
    source = replace(source, '        v29TableEnabled,v29TableAttributes,',
                     '        v210ResponsiveTableStyle,v210ResponsiveTopLevel,v210ResponsiveTableEdits,v210ResponsiveTablePlan,v210ResponsiveTableProof,\n'
                     '        v29TableEnabled,v29TableAttributes,')
    return source
