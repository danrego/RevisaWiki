"""Capture anonymous GET-only native quote projections for the fixed release."""
from pathlib import Path
import hashlib
import json
import subprocess
import urllib.parse

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).with_name('quote_native')
OUT.mkdir(exist_ok=True)
cases = []
for index, (box, author) in enumerate([
        ('direita', 'direita'), ('esquerda', 'esquerda'),
        ('centro', 'centro'), ('none', 'right')]):
    before = '{{caixa de citação|alinhar=' + box + '|alinhar_fonte=' + author + \
        '|citação=Palavras literais.|fonte=Fonte literal.}}'
    after = before.replace('|alinhar=', '|posição=').replace('|alinhar_fonte=', '|posição-autor=')
    cases.append({'id': str(index), 'before': before, 'after': after,
                  'box': box, 'author': author})
records = {}
for state in ['before', 'after']:
    text = '\n'.join('<div id="q' + row['id'] + '">' + row[state] + '</div>' for row in cases)
    query = urllib.parse.urlencode({'action': 'parse', 'format': 'json', 'formatversion': 2,
        'title': 'RevisaWiki teste', 'text': text, 'contentmodel': 'wikitext',
        'prop': 'text|categories|parsewarnings', 'uselang': 'pt'})
    completed = subprocess.run(['/usr/bin/curl', '--disable', '--fail', '--silent',
        '--show-error', '--max-time', '60', 'https://pt.wikipedia.org/w/api.php?' + query],
        capture_output=True)
    if completed.returncode:
        raise SystemExit('Native anonymous capture unavailable. No assertion result was produced.')
    data = json.loads(completed.stdout)
    assert 'error' not in data and 'parse' in data
    html = data['parse']['text']
    (OUT / (state + '.wiki')).write_text(text)
    (OUT / (state + '.html')).write_text(html)
    (OUT / (state + '.json')).write_bytes(completed.stdout)
    records[state] = {'responseSha256': hashlib.sha256(completed.stdout).hexdigest(),
                     'htmlSha256': hashlib.sha256(html.encode()).hexdigest(),
                     'sourceSha256': hashlib.sha256(text.encode()).hexdigest()}
manifest = {'version': '2.14.0', 'scope': 'Synthetic quote projections only, anonymous GET requests.',
    'sources': [{'title': 'Predefinição:Caixa de citação', 'oldid': 68629072,
        'url': 'https://pt.wikipedia.org/w/index.php?oldid=68629072'}],
    'cases': cases, 'captures': records, 'wikipediaWrites': 0, 'accountsUsed': 0}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': 'captured', 'cases': len(cases), 'requests': len(records),
                  'wikipediaWrites': 0}))
