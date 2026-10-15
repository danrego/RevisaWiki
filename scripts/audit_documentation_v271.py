"""Check the current manual, installation order and complete copy payloads."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS, DIST = ROOT / 'docs/2.7.1', ROOT / 'dist/2.7.1'
checks = []


def check(condition, name):
    checks.append({'name': name, 'passed': bool(condition)})


manual = (DOCS / 'Documentacao_RevisaWiki_v2_7_1.wiki').read_text()
previous = (ROOT / 'docs/2.7.0/Documentacao_RevisaWiki_v2_7.wiki').read_text()
headings = lambda text: re.findall(r'^=== (\d+\.\d+\.\d+) ===$', text, re.M)
check(headings(manual) == ['2.7.1'] + headings(previous), 'Newest-first history retains previous releases')
check(manual.index('As versões aparecem da mais recente') < manual.index('=== 2.7.1 ==='), 'General history introduction precedes the newest release entry')
h2 = lambda text: re.findall(r'^== ([^=\n]+) ==$', text, re.M)
check(h2(manual) == h2(previous), 'All previous main manual sections remain in order')
historical = lambda text: text.split('=== 2.7.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
check(historical(manual) == historical(previous), 'Historical release content remains byte-identical')
check('Desde a 2.6.2, a leitura das aspas' in manual, 'Quotation boundary change keeps its historical version')
qa_path = ROOT / 'artifacts/v271/RELEASE_QA_SUMMARY.json'
if not qa_path.exists():
    qa_path = ROOT / 'tests/evidence/2.7.1/RELEASE_QA_SUMMARY.json'
qa = json.loads(qa_path.read_text())
check(qa['status'] == 'passed' and qa['version'] == '2.7.1', 'Only completed current-version QA is described')
current_manifest = json.loads((ROOT / 'tests/expected_release_v271.json').read_text())
check(qa['frozenFiles'] == current_manifest['files'], 'QA describes these exact executable files')
check(qa['portugueseSummary'] in manual, 'Manual includes the exact final QA summary')
test_report = (DOCS / 'Relatorio_testes_RevisaWiki_v2_7_1.txt').read_text()
check(all(group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações' in test_report for group in qa['groups']), 'Test report describes the actual final QA groups')
check((DOCS / 'LEIA_PRIMEIRO.txt').exists(), 'Quick-start guide remains available')
check('Ajustes aplicados\'\'\' informa quantos trechos mudaram' not in manual, 'Old misleading block-as-correction wording is absent')
active_manual = manual.split('== Histórico das versões ==', 1)[0]
check("O link '''Editar aqui''' fica nos controles de cada seção" not in active_manual, 'Removed section-button instructions are absent from active manual')
check("Os botões adicionais '''Editar aqui''' foram retirados na 2.7" in active_manual, 'Current manual explains section-button removal')
check('https://github.com/danrego/RevisaWiki' in manual, 'Repository is linked')
check('=== Nomes químicos e montagem da infocaixa ===' in manual, 'Current chemical repair and boundaries are documented')
check('-{' not in active_manual, 'Active manual does not introduce an accidental language-converter opener')
check('Testes anteriores da interface' not in manual, 'No detached historical test sections')
stub = (DIST / 'Chamada_fixa_RevisaWiki_common.js').read_bytes()
check(stub == (ROOT / 'dist/2.7.0/Chamada_fixa_RevisaWiki_common.js').read_bytes(), 'Existing common.js bootstrap stays identical')
blocks = re.findall(r'<syntaxhighlight[^>]*>([\s\S]*?)</syntaxhighlight>', manual)
check(any(block.strip().encode() == stub.strip() for block in blocks), 'Manual includes the complete permanent bootstrap')
for path in sorted(DOCS.iterdir()):
    if not path.is_file():
        continue
    text = path.read_text()
    check(path.read_bytes() == (DIST / path.name).read_bytes(), 'Exact documentation copy: ' + path.name)
    check(not re.search(r'\b[A-Z_]*PENDING\b', text), 'No unfinished report: ' + path.name)
    check(not re.search(r'\n[ \t]*\n[ \t]*\n', text), 'Single blank-line spacing: ' + path.name)
manifest = json.loads((ROOT / 'tests/expected_release_v271.json').read_text())
check(manifest['version'] == manifest['runtimeVersion'] == '2.7.1', 'Executable and distribution versions match')
for name, proof in manifest['files'].items():
    raw = (DIST / name).read_bytes()
    check(len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], 'Executable pin: ' + name)
    check(b'~~~' not in raw, 'Save-time signature safety: ' + name)
for path in sorted(DIST.glob('Catalogo_*.json')):
    record = json.loads(path.read_text())
    valid = record.get('releaseVersion') == record.get('distributionVersion') == '2.7.1'
    if 'releaseCoreSha256' in record:
        valid = valid and record['releaseCoreSha256'] == manifest['files']['RevisaWiki_v2_7_1.js']['sha256']
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
result = {'version': '2.7.1', 'status': 'passed' if all(row['passed'] for row in checks) else 'failed',
          'checks': len(checks), 'failed': [row for row in checks if not row['passed']], 'networkRequests': 0, 'wikipediaWrites': 0}
out = ROOT / 'artifacts/v271'
out.mkdir(parents=True, exist_ok=True)
(out / 'documentation.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
raise SystemExit(0 if result['status'] == 'passed' else 1)
