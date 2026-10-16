"""Check the current manual, native UI contract and full copy payloads."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS, DIST = ROOT / 'docs/2.14.0', ROOT / 'dist/2.14.0'
checks = []


def check(value, name):
    checks.append({'name': name, 'passed': bool(value)})


manual = (DOCS / 'Documentacao_RevisaWiki_v2_14_0.wiki').read_text()
base = (ROOT / 'docs/2.13.0/Documentacao_RevisaWiki_v2_13_0.wiki').read_text()
active = manual.split('== Histórico das versões ==', 1)[0]
history = lambda text: text.split('=== 2.13.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
versions = lambda text: re.findall(r'^=== (\d+\.\d+\.\d+) ===$', text, re.M)
headings = lambda text: re.findall(r'^== ([^=\n]+) ==$', text, re.M)
check(versions(manual) == ['2.14.0'] + versions(base), 'Newest-first history with no unpublished intermediate release')
check(history(manual) == history(base), 'Published historical release notes remain byte-identical')
check(headings(manual) == headings(base), 'All main manual sections remain in order')
check('Testes anteriores da interface' not in manual, 'No detached historical testing blocks')
check(manual.index('As versões aparecem da mais recente') < manual.index('=== 2.14.0 ==='), 'Chronological history introduction precedes the latest version')
for phrase in ["'''Ver o que mudou'''", "'''Escolher alterações'''", "'''Ver ajustes antes de aplicar'''", "'''Informações técnicas'''", "'''Resultados anteriores e conferências'''", "'''Por que alguns ajustes não entraram'''"]:
    check(phrase not in active, 'Retired UI instructions absent: ' + phrase)
for phrase in ['Mostrar alterações', 'controle nativo', 'atalho fica oculto', 'nunca usa Publicar como alternativa', 'Desfazer ajustes', 'mesmo nome e o mesmo verde']:
    check(phrase in active, 'Current native UI instruction: ' + phrase)
check('não tem uma comparação própria nem seleção de blocos' in active, 'Custom diff and hunk-selection retirement is explicit')
check('começa aberta' in active and 'escolha de recolhê-la' in active, 'Review expansion and user preference are documented')
check('mesmo parâmetro na mesma predefinição' in active and 'opções individuais' in active, 'Exact review grouping retains occurrence details')
check('descrição curta retirada' in active and 'detalhe' in active, 'Quiet description recovery remains available')
for title in ['Campos importados de medicamentos e substâncias químicas', 'Linhas vazias na prosa', 'Citações enciclopédicas importadas', 'Alinhamento das caixas de citação', 'Organização dos avisos']:
    check(active.count('=== ' + title + ' ===') == 1, 'One scope explanation: ' + title)
check(all(language in active for language in ['inglês', 'espanhol', 'francês', 'alemão']), 'All four audited source languages are named')
check('não muda números ou unidades' in active and 'não calcula a massa molar' in active and 'já funcionam permanecem iguais' in active, 'Chemical values and working native names are protected')
check('não apaga categorias avulsas' in active and 'wstitle literal e não vazio' in active, 'Encyclopedia migration is finite and does not delete categories generally')
check('Texto citado' in active or 'texto citado' in active, 'Quoted-text preservation is documented')
check('ordem dos campos repetidos' in active, 'Duplicate-field precedence is preserved')
check('linhas completamente vazias' in active and 'uma única linha vazia' in active, 'Only excess literal blank lines are removed')
check(all(word in active for word in ['poemas', 'tabulações', 'formatos misturados', 'discussões']), 'Spacing exclusions are documented')
check('dez ou mais entradas reconhecidas na mesma lista' in active, 'Reference-column threshold remains ten')
check('seis' in active and 'Em telas estreitas, a lista volta a uma coluna' in active, 'End-list threshold and responsive presentation remain')
new_entry = manual.split('=== 2.14.0 ===', 1)[1].split('=== ', 1)[0]
check(len(re.findall(r'^\* ', new_entry, re.M)) == 8, 'Latest release has eight concise feature bullets')
check(not re.search('[\u2014\u201c\u201d\u2018\u2019]', new_entry), 'New release prose uses plain straight punctuation')
check('https://github.com/danrego/RevisaWiki' in manual, 'Repository is linked')
check('2.13.1' not in manual, 'Unpublished patch is not listed as released')

raw = (ROOT / 'tests/expected_release_v2140.json').read_bytes()
manifest = json.loads(raw)
qa_path = ROOT / 'artifacts/v2140/RELEASE_QA_SUMMARY.json'
if not qa_path.exists():
    qa_path = ROOT / 'tests/evidence/2.14.0/RELEASE_QA_SUMMARY.json'
qa = json.loads(qa_path.read_text())
check(qa['version'] == '2.14.0' and qa['status'] == 'passed', 'Only completed current QA is described')
check(qa['releaseManifestSha256'] == hashlib.sha256(raw).hexdigest() and qa['frozenFiles'] == manifest['files'], 'QA binds every exact current executable')
check(qa['portugueseSummary'] in manual, 'Manual includes the actual completed QA summary')
for name, proof in manifest['files'].items():
    content = (DIST / name).read_bytes()
    check(len(content) == proof['bytes'] and hashlib.sha256(content).hexdigest() == proof['sha256'], 'Executable pin: ' + name)
    check(b'~~~' not in content, 'No literal save-time signature trigger: ' + name)
for name in ['Chamada_fixa_RevisaWiki_common.js', 'Chamada_fixa_RevisaWiki_copia_propria.js']:
    check((DIST / name).read_bytes() == (ROOT / 'dist/2.13.0' / name).read_bytes(), 'Permanent bootstrap unchanged: ' + name)
for name in ['RevisaWiki_v2_14_0.js', 'RevisaWiki_v2_14_0_dados.js']:
    check((DIST / name).stat().st_size < 2097152, 'Modular install file below page limit: ' + name)
for file in DOCS.iterdir():
    if not file.is_file():
        continue
    text = file.read_text()
    check(file.read_bytes() == (DIST / file.name).read_bytes(), 'Complete documentation copy: ' + file.name)
    check(not re.search(r'\n[ \t]*\n[ \t]*\n', text), 'Only one blank line: ' + file.name)
    private_path_pattern = r'\bPENDING\b|TODO|/' + 'Users/|/' + r'private/|127\.0\.0\.1:\d+'
    check(not re.search(private_path_pattern, text), 'No unfinished text or local paths: ' + file.name)
installation = (DOCS / 'Instalacao_RevisaWiki_v2_14_0.txt').read_text()
check('mesmo que a 2.13.0 já esteja instalada' in installation, 'Existing distribution update is explained')
check('Mostrar alterações usa o controle nativo' in installation, 'Installation text matches the new UI')
index = (DIST / 'INICIO.html').read_text()
match = re.search(r'<script type="application/json" id="payloads">([\s\S]*?)</script>', index)
check(bool(match), 'Full copy payload is present')
if match:
    payload = json.loads(match[1])
    check(list(payload) == ['dados', 'programa', 'central', 'documentacao', 'carregador'], 'Installation order with optional common.js')
    for key, item in payload.items():
        content = (DIST / item['filename']).read_bytes()
        check(item['text'].encode() == content, 'Full file copied: ' + key)
        check(item['sha256'] == hashlib.sha256(content).hexdigest() and item['bytes'] == len(content), 'Copy integrity: ' + key)
        check(bool(item['destination'].strip()) and bool(item['summary'].strip()), 'Copy destination and edit summary: ' + key)
    check(payload['central']['destination'] == 'Usuário:Daniel G Rego/RevisaWiki/Carregador.js', 'Central loader has the correct destination')
check(index.count('class="raw-source"') == 5 and 'action=edit' in index, 'Each card has raw-source and editor links')
check('PTwiki 2.14.0' in active and "loaderRevision = '2.14.0'" in active, 'Version is consistent in installation diagnostics')
failed = [row for row in checks if not row['passed']]
out = ROOT / 'artifacts/v2140'
out.mkdir(parents=True, exist_ok=True)
report = {'version': '2.14.0', 'status': 'failed' if failed else 'passed', 'checks': len(checks),
    'failed': len(failed), 'failures': failed, 'results': checks,
    'releaseManifestSha256': hashlib.sha256(raw).hexdigest(), 'frozenFiles': manifest['files'],
    'wikipediaWrites': 0}
(out / 'documentation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': report['status'], 'checks': len(checks), 'failed': failed}, ensure_ascii=False))
if failed:
    raise SystemExit(1)
