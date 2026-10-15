"""Check installation instructions and exact copy payloads for the stable loader."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs/2.6.1-hotfix.1'
DIST = ROOT / 'dist/2.6.1-hotfix.1'
checks = []


def check(condition, name):
    checks.append({'name':name,'passed':bool(condition)})


manual = (DOCS / 'Documentacao_RevisaWiki_v2_6_1.wiki').read_text()
previous = (ROOT / 'docs/2.6.1/Documentacao_RevisaWiki_v2_6_1.wiki').read_text()
headings = lambda text: re.findall(r'^=== (\d+\.\d+\.\d+) ===$', text, re.M)
check(headings(manual) == headings(previous), 'Previous release history retained in order')
blocks = re.findall(r'<syntaxhighlight[^>]*>([\s\S]*?)</syntaxhighlight>', manual)
stub = (DIST / 'Chamada_fixa_RevisaWiki_common.js').read_text()
check(any(block.strip() == stub.strip() for block in blocks), 'Manual contains the complete stable bootstrap')
check('RevisaWiki/Carregador.js' in manual, 'New central loader destination is documented')
check('3.452' not in manual, 'Historical 2.6.1 counts are not relabeled as hotfix execution')
for path in sorted(DOCS.iterdir()):
    if path.is_file():
        check(path.read_bytes() == (DIST / path.name).read_bytes(), 'Exact documentation copy: ' + path.name)
        text = path.read_text()
        check(not re.search(r'\b[A-Z_]*PENDING\b', text), 'No unfinished instructions: ' + path.name)
        check(not re.search(r'\n[ \t]*\n[ \t]*\n', text), 'No multiple blank lines: ' + path.name)
manifest = json.loads((ROOT / 'tests/expected_release_v261_hotfix_1.json').read_text())
check(manifest['version'] == '2.6.1-hotfix.1' and manifest['runtimeVersion'] == '2.6.1', 'Distribution and runtime versions are separate')
for name, proof in manifest['files'].items():
    raw = (DIST / name).read_bytes()
    check(len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], 'Executable pin: ' + name)
    check(b'~~~' not in raw, 'Signature-safe installation source: ' + name)
for catalog in DIST.glob('Catalogo_*.json'):
    record = json.loads(catalog.read_text())
    valid = record.get('releaseVersion') == manifest['runtimeVersion'] and record.get('distributionVersion') == manifest['version']
    if 'releaseCoreSha256' in record:
        valid = valid and record['releaseCoreSha256'] == manifest['files']['RevisaWiki_v2_6_1.js']['sha256']
    check(valid, 'Catalog release metadata: ' + catalog.name)
index = (DIST / 'INICIO.html').read_text()
match = re.search(r'<script type="application/json" id="payloads">([\s\S]*?)</script>', index)
check(bool(match), 'Copy payload exists')
if match:
    payload = json.loads(match[1])
    check(list(payload) == ['dados','programa','central','carregador','documentacao'], 'Installation order includes the central loader')
    expected = {'central':'Carregador_comunitario_RevisaWiki_v2_6_1.js', 'carregador':'Chamada_fixa_RevisaWiki_common.js'}
    for key, item in payload.items():
        raw = (DIST / item['filename']).read_bytes()
        check(item['text'].encode() == raw, 'Complete copy: ' + key)
        check(item['sha256'] == hashlib.sha256(raw).hexdigest() and item['bytes'] == len(raw), 'Copy integrity: ' + key)
        check(bool(item['summary'].strip()), 'Edit summary: ' + key)
        if key in expected:
            check(item['filename'] == expected[key], 'Correct loader role: ' + key)
    check(payload['central']['destination'] == 'Usuário:Daniel G Rego/RevisaWiki/Carregador.js', 'Central script goes to its own technical page')
check('action=edit' in index, 'Direct edit links retained')
result = {'version':'2.6.1-hotfix.1','status':'passed' if all(c['passed'] for c in checks) else 'failed',
          'checks':len(checks),'failed':[c for c in checks if not c['passed']],
          'networkRequests':0,'wikipediaWrites':0}
out = ROOT / 'artifacts/v261_hotfix_1'
out.mkdir(parents=True, exist_ok=True)
(out / 'documentation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
raise SystemExit(0 if result['status'] == 'passed' else 1)
