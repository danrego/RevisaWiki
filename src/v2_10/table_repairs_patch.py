"""Insert the finite table module. Shared execution hooks belong to integration_patch."""
from pathlib import Path
import re


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Table structure insertion anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('table_repairs.js').read_text()
    names = re.findall(r'^    function (v210\w+)\(', module, re.MULTILINE)
    source = replace(source, '    function v25SafeRepairPlan(source,cfg={}) {',
                     module + '\n    function v25SafeRepairPlan(source,cfg={}) {')
    source = replace(source, '        v29TableEnabled,',
                     '        ' + ','.join(names) + ',\n        v29TableEnabled,')
    return source
