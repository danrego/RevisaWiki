"""Check the patch manual, installation payloads and final release byte pins."""
from pathlib import Path
import argparse
import hashlib
import json
import re


ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--allow-pending', action='store_true')
    args = parser.parse_args()
    docs = ROOT / 'docs/2.6.1'
    dist = ROOT / 'dist/2.6.1'
    old = (ROOT / 'docs/2.6.0/Documentacao_RevisaWiki_v2_6.wiki').read_text()
    manual = (docs / 'Documentacao_RevisaWiki_v2_6_1.wiki').read_text()
    checks = []

    def check(condition, name):
        checks.append({'name': name, 'passed': bool(condition)})

    headings = lambda text: re.findall(r'^=== (\d+\.\d+\.\d+) ===$', text, re.M)
    history = headings(manual)
    check(history == ['2.6.1'] + headings(old), 'Previous release history retained in order')
    check(history == sorted(history, key=lambda v: tuple(map(int, v.split('.'))), reverse=True), 'Release history is newest first')
    blocks = re.findall(r'<syntaxhighlight[^>]*>([\s\S]*?)</syntaxhighlight>', manual)
    loader = (dist / 'Carregador_comunitario_RevisaWiki_v2_6_1.js').read_text()
    check(any(block.strip() == loader.strip() for block in blocks), 'Installation example is the complete current loader')
    check('Por que alguns ajustes não entraram' in manual, 'Partial-analysis label matches the interface')
    check('https://github.com/danrego/RevisaWiki' in manual, 'Repository access link retained')
    check(len(re.findall(r'^\{\{Referências\}\}$', manual, re.M)) == 1, 'One manual reference collector outside inline examples')
    for path in sorted(docs.iterdir()):
        if not path.is_file():
            continue
        raw = path.read_bytes()
        check((dist / path.name).read_bytes() == raw, 'Documentation copy matches: ' + path.name)
        text = raw.decode('utf-8')
        check(not re.search(r'\b[A-Z_]*PENDING\b', text) or args.allow_pending, 'No unfinished release text: ' + path.name)
        check(not re.search(r'\n[ \t]*\n[ \t]*\n', text), 'No multiple blank lines: ' + path.name)
    frozen = json.loads((ROOT / 'tests/expected_release_v261.json').read_text())
    for name, proof in frozen['files'].items():
        raw = (dist / name).read_bytes()
        check(len(raw) == proof['bytes'] and hashlib.sha256(raw).hexdigest() == proof['sha256'], 'Final executable pin: ' + name)
    index = dist / 'INICIO.html'
    if index.exists():
        text = index.read_text()
        match = re.search(r'<script type="application/json" id="payloads">([\s\S]*?)</script>', text)
        check(bool(match), 'Copy-index payload exists')
        if match:
            payload = json.loads(match[1])
            check(len(payload) == 5, 'Five copy cards')
            for key, record in payload.items():
                raw = (dist / record['filename']).read_bytes()
                check(record['text'].encode('utf-8') == raw, 'Exact full-content copy: ' + key)
                check(hashlib.sha256(raw).hexdigest() == record['sha256'], 'Copy payload hash: ' + key)
                check(record['bytes'] == len(raw), 'Copy payload length: ' + key)
                check('action=edit' in text, 'Direct editor access: ' + key)
    result = {'version': '2.6.1', 'status': 'passed' if all(c['passed'] for c in checks) else 'failed',
              'checks': len(checks), 'failed': [c for c in checks if not c['passed']],
              'networkRequests': 0, 'wikipediaWrites': 0}
    out = ROOT / 'artifacts/v261'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'documentation.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
    return 0 if result['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
