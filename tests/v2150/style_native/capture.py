"""Capture anonymous GET-only native sanitizer results for synthetic sheets."""
from pathlib import Path
import hashlib
import json
import subprocess
import time
import urllib.parse

ROOT = Path(__file__).parent
CASES = {
    'border': '.rw-test { color: red; border-color: var(--border-color-base, #a2a9b1) !important; }',
    'cascade': '.rw-test{border-left-color:blue;border-color:var(--border-color-base,#a2a9b1);border-top-color:red;} .rw-test{color:green;}',
    'dimension': '.rw-test { color: red; width: 24 px !important; }',
    'media': '@media (max-width: 600px){.rw-test, .rw-other > a:hover {color:red;max-width: 24 px;}}',
    'selector': '.rw-test{color:red;} .rw-test:focus-visible{outline:2px solid blue;}',
}


def transformed(source):
    if 'border-color: ' in source:
        return source.replace('border-color: var(--border-color-base, #a2a9b1) !important', ';\n'.join('border-' + side + '-color: var(--border-color-base, #a2a9b1) !important' for side in ['top', 'right', 'bottom', 'left']))
    if 'border-color:var(' in source:
        return source.replace('border-color:var(--border-color-base,#a2a9b1)', ';\n'.join('border-' + side + '-color: var(--border-color-base,#a2a9b1)' for side in ['top', 'right', 'bottom', 'left']))
    return source.replace('width: 24 px', 'width: 24px')


manifest = {'version': '2.15.0', 'kind': 'synthetic-native-template-styles', 'method': 'GET', 'accountAccess': False, 'wikipediaWrites': 0, 'cases': []}
for name, before in CASES.items():
    row = {'id': name, 'states': {}}
    for state, source in [('before', before), ('after', transformed(before))]:
        parameters = {'action': 'parse', 'format': 'json', 'formatversion': '2', 'uselang': 'pt', 'title': 'RevisaWiki/Teste de estilos', 'text': '<templatestyles src="Predefinição:RevisaWiki/Teste/styles.css" />', 'prop': 'text|parsewarnings', 'templatesandboxtitle': 'Predefinição:RevisaWiki/Teste/styles.css', 'templatesandboxtext': source, 'templatesandboxcontentmodel': 'sanitized-css', 'templatesandboxcontentformat': 'text/css', 'preview': '1'}
        target = ROOT / (name + '_' + state + '.json')
        if target.exists():
            raw = target.read_bytes()
        else:
            raw = subprocess.check_output(['/usr/bin/curl', '--disable', '--fail', '--silent', '--show-error', '--retry', '2', '--retry-delay', '12', '--max-time', '45', '--user-agent', 'RevisaWiki-test-fixtures/2.15 (read-only validation)', 'https://pt.wikipedia.org/w/api.php?' + urllib.parse.urlencode(parameters)])
            time.sleep(2)
        response = json.loads(raw)
        assert isinstance(response.get('parse', {}).get('text'), str), response
        # Retain the native response verbatim, including sanitizer diagnostics.
        (ROOT / (name + '_' + state + '.json')).write_bytes(raw)
        (ROOT / (name + '_' + state + '.css')).write_text(source)
        row['states'][state] = {'responseSha256': hashlib.sha256(raw).hexdigest(), 'sourceSha256': hashlib.sha256(source.encode()).hexdigest()}
    manifest['cases'].append(row)
(ROOT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'cases': len(CASES), 'anonymousReads': len(CASES) * 2, 'wikipediaWrites': 0}))
