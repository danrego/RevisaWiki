from pathlib import Path


def apply(source):
    helper = Path(__file__).with_name('diagnostic_tag_view.js').read_text()
    marker = '    function v24SyntaxScan(source) {'
    assert source.count(marker) == 1
    source = source.replace(marker, helper + '\n' + marker)
    before = 'const shield=v24SyntaxProtected(source),view=shield.view,stack=[],links=[],external=[],tables=[],html=[],issues=shield.unclosed.slice(),boundaries=[0],tokens=[];'
    after = 'const shield=v24SyntaxProtected(source),view=v261SyntaxDiagnosticTagView(source,shield),stack=[],links=[],external=[],tables=[],html=[],issues=shield.unclosed.slice(),boundaries=[0],tokens=[];'
    assert source.count(before) == 1
    source = source.replace(before, after)
    before = '''    function v25SafeCollectorEdits(source) {
        const scan=v24SyntaxScan(source);if(scan.issues.length)return [];
        const collectors=[];'''
    after = '''    function v25SafeCollectorEdits(source) {
        const scan=v24SyntaxScan(source);if(scan.issues.length)return [];
        const protectedRanges=v24SyntaxProtected(source).ranges;
        const collectors=[];'''
    assert source.count(before) == 1
    source = source.replace(before, after)
    before = '''        const edits=[];let previous=null;for(const c of collectors){if(previous&&previous.key===c.key'''
    after = '''        const edits=[];let previous=null;for(const c of collectors){if(protectedRanges.some(r=>r.start<c.end&&r.end>c.start)){previous=null;continue;}if(previous&&previous.key===c.key'''
    assert source.count(before) == 1
    return source.replace(before, after)
