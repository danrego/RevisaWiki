"""Bind finite CSS repairs to a contextual native sanitizer result."""
from pathlib import Path
import re


def once(source, old, new):
    assert source.count(old) == 1, 'Style integration anchor changed.'
    return source.replace(old, new, 1)


def apply(source):
    helpers = Path(__file__).with_name('style_engine.js').read_text()
    source = once(source, '    function cssDeclarations(source) {', helpers + '\n    function cssDeclarations(source) {')
    start = source.index('    function cssRetention(source, sanitized) {')
    end = source.index('    function diagnosticReport(data) {', start)
    source = source[:start] + '    function cssRetention(source, sanitized) { return v215StyleRetention(source,sanitized); }\n' + source[end:]
    start = source.index('    async function checkStyles() {')
    end = source.index('    function mountStyles() {', start)
    source = source[:start] + Path(__file__).with_name('style_ui.js').read_text() + '\n' + source[end:]
    source = once(source, "Conferência experimental de TemplateStyles. As correções são oferecidas para escolha.",
                  'Correções de CSS são aplicadas após conferência dos seletores, valores e condições no sanitizador.')
    exports = ','.join(re.findall(r'^    function (v215Style\w+)\(', helpers, re.MULTILINE))
    return once(source, '        comparisonDisplayGroups, changeExplanation, tableAnalysis,',
                '        ' + exports + ',\n        comparisonDisplayGroups, changeExplanation, tableAnalysis,')
