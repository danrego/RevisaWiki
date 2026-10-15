"""Check the current manual, installation order and complete copy payloads."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS, DIST = ROOT / 'docs/2.6.2', ROOT / 'dist/2.6.2'
checks = []


def check(condition, name):
    checks.append({'name': name, 'passed': bool(condition)})


manual = (DOCS / 'Documentacao_RevisaWiki_v2_6_2.wiki').read_text()
previous = (ROOT / 'docs/2.6.1-hotfix.1/Documentacao_RevisaWiki_v2_6_1.wiki').read_text()
headings = lambda text: re.findall(r'^=== (\d+\.\d+\.\d+) ===$', text, re.M)
check(headings(manual) == ['2.6.2'] + headings(previous), 'Newest-first history retains previous releases')
check('https://github.com/danrego/RevisaWiki' in manual, 'Repository is linked')
check('Testes anteriores da interface' not in manual, 'No detached historical test sections')
stub = (DIST / 'Chamada_fixa_RevisaWiki_common.js').read_bytes()
check(stub == (ROOT / 'dist/2.6.1-hotfix.1/Chamada_fixa_RevisaWiki_common.js').read_bytes(), 'Existing common.js bootstrap stays identical')
blocks = re.findall(r'<syntaxhighlight[^>]*>([\s\S]*?)</syntaxhighlight>', manual)
check(any(block.strip().encode() == stub.strip() for block in blocks), 'Manual includes the complete permanent bootstrap')
for path in sorted(DOCS.iterdir()):
    if not path.is_file():
        continue
    text = path.read_text()
    check(path.read_bytes() == (DIST / path.name).read_bytes(), 'Exact documentation copy: ' + path.name)
    check(not re.search(r'\b[A-Z_]*PENDING\b', text), 'No unfinished report: ' + path.name)
    check(not re.search(r'\n[ \t]*\n[ \t]*\n', text), 'Single blank-line spacing: ' + path.name)
manifest = json.loads((ROOT / 'tests/expected_release_v262.json').read_text())
check(manifest['version'] == manifest['runtimeVersion'] == '2.6.2', 'Executable and distribution versions match')
for name, proof in manifest['files'].items():
    raw = (DIST / name).read_bytes()
    check(len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], 'Executable pin: ' + name)
    check(b'~~~' not in raw, 'Save-time signature safety: ' + name)
for path in sorted(DIST.glob('Catalogo_*.json')):
    record = json.loads(path.read_text())
    valid = record.get('releaseVersion') == record.get('distributionVersion') == '2.6.2'
    if 'releaseCoreSha256' in record:
        valid = valid and record['releaseCoreSha256'] == manifest['files']['RevisaWiki_v2_6_2.js']['sha256']
    check(valid, 'Current catalog metadata: ' + path.name)
index = (DIST / 'INICIO.html').read_text()
match = re.search(r'<script type="application/json" id="payloads">([\s\S]*?)</script>', index)
check(bool(match), 'Complete copy payload exists')
if match:
    payload = json.loads(match[1])
    check(list(payload) == ['dados', 'programa', 'central', 'documentacao', 'carregador'], 'Update order keeps common.js optional')
    for key, item in payload.items():
        raw = (DIST / item['filename']).read_bytes()
        check(item['text'].encode() == raw, 'Copy includes the entire file: ' + key)
        check(item['sha256'] == hashlib.sha256(raw).hexdigest() and item['bytes'] == len(raw), 'Copy byte integrity: ' + key)
        check(bool(item['summary'].strip()), 'Nonempty edit summary: ' + key)
    check(payload['central']['destination'] == 'Usuário:Daniel G Rego/RevisaWiki/Carregador.js', 'Central loader has its own destination')
    check(payload['carregador']['filename'] == 'Chamada_fixa_RevisaWiki_common.js', 'Only the permanent bootstrap goes in common.js')
check('action=edit' in index, 'Direct destination-editor links are present')
result = {'version': '2.6.2', 'status': 'passed' if all(row['passed'] for row in checks) else 'failed',
          'checks': len(checks), 'failed': [row for row in checks if not row['passed']], 'networkRequests': 0, 'wikipediaWrites': 0}
out = ROOT / 'artifacts/v262'
out.mkdir(parents=True, exist_ok=True)
(out / 'documentation.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
raise SystemExit(0 if result['status'] == 'passed' else 1)
