"""Capture anonymous GET projections of the finite native syntax contracts."""
from pathlib import Path
import hashlib
import json
import subprocess
import urllib.parse

ROOT = Path(__file__).resolve().parent / 'reference_contracts'
CASES = {
    'collector_group': (
        'Texto.<ref group="nota">Fonte de controle.</ref>\n{{Referências|group=nota}}',
        'Texto.<ref group="nota">Fonte de controle.</ref>\n{{Referências|grupo=nota}}'),
    'publication_alias': (
        '{{Citar jornal|titulo=Fonte de controle|jornal=Jornal de controle|obra=Jornal de controle|url=https://example.test/fonte}}',
        '{{Citar jornal|titulo=Fonte de controle|jornal=Jornal de controle|url=https://example.test/fonte}}'),
    'isolated_url': (
        '{{Citar web|titulo=Fonte de controle|url=[https://example.test/fonte]}}',
        '{{Citar web|titulo=Fonte de controle|url=https://example.test/fonte}}'),
    'collector_attributes': (
        'Texto.<ref group="nota" name="a"/>\n<references group="nota" group="nota"><ref name="a">Fonte de controle.</ref></references>',
        'Texto.<ref group="nota" name="a"/>\n<references group="nota"><ref name="a">Fonte de controle.</ref></references>'),
}


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    report = {'schema': 1, 'version': '2.13.0', 'method': 'anonymous public GET', 'wikipediaWrites': 0, 'cases': []}
    for name, pair in CASES.items():
        item = {'name': name, 'projections': []}
        for phase, text in zip(('before', 'after'), pair):
            query = urllib.parse.urlencode({'action': 'parse', 'format': 'json', 'formatversion': 2, 'title': 'Teste de sintaxe', 'contentmodel': 'wikitext', 'text': text, 'prop': 'text|parsewarnings', 'disableeditsection': 1})
            data = subprocess.check_output(['/usr/bin/curl', '--disable', '--fail', '--silent', '--show-error', 'https://pt.wikipedia.org/w/api.php?' + query])
            decoded = json.loads(data)
            if 'error' in decoded:
                raise ValueError(decoded['error'])
            html = decoded['parse']['text']
            filename = name + '_' + phase + '.html'
            (ROOT / filename).write_text(html)
            item['projections'].append({'phase': phase, 'source': text, 'sourceSha256': hashlib.sha256(text.encode()).hexdigest(), 'htmlFile': filename, 'htmlSha256': hashlib.sha256(html.encode()).hexdigest(), 'parsewarnings': decoded['parse'].get('parsewarnings', [])})
        report['cases'].append(item)
    (ROOT / 'projections.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'cases': len(report['cases']), 'requests': len(report['cases']) * 2, 'wikipediaWrites': 0}))


if __name__ == '__main__':
    main()
