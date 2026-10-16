"""Capture small anonymous native paragraph-spacing projections without edits."""
from pathlib import Path
import hashlib
import json
import subprocess
import urllib.parse

OUT = Path(__file__).with_name('spacing_native')
OUT.mkdir(exist_ok=True)
cases = [
    {'id': 'paragraphs', 'before': 'Primeiro parágrafo literal.\n\n\n\nSegundo parágrafo literal.',
     'after': 'Primeiro parágrafo literal.\n\nSegundo parágrafo literal.'},
    {'id': 'heading', 'before': 'Parágrafo literal.\n\n\n== Seção literal ==\n\n\nOutro parágrafo literal.',
     'after': 'Parágrafo literal.\n\n== Seção literal ==\n\nOutro parágrafo literal.'},
    {'id': 'poem', 'before': '<poem>Primeiro verso.\n\n\n\nSegundo verso.</poem>',
     'after': '<poem>Primeiro verso.\n\n\n\nSegundo verso.</poem>'},
    {'id': 'code', 'before': '<pre>Primeira linha.\n\n\n\nSegunda linha.</pre>',
     'after': '<pre>Primeira linha.\n\n\n\nSegunda linha.</pre>'},
]
records = {}
for state in ['before', 'after']:
    text = '\n'.join('<div id="spacing-' + row['id'] + '">\n' + row[state] + '\n</div>' for row in cases)
    query = urllib.parse.urlencode({'action': 'parse', 'format': 'json', 'formatversion': 2,
        'title': 'RevisaWiki teste', 'text': text, 'contentmodel': 'wikitext',
        'prop': 'text|parsewarnings', 'uselang': 'pt'})
    result = subprocess.run(['/usr/bin/curl', '--disable', '--fail', '--silent', '--show-error',
        '--max-time', '60', 'https://pt.wikipedia.org/w/api.php?' + query], capture_output=True)
    if result.returncode:
        raise SystemExit('Native capture unavailable. No result or assertion was accepted.')
    data = json.loads(result.stdout)
    assert 'parse' in data and 'error' not in data
    html = data['parse']['text']
    (OUT / (state + '.wiki')).write_text(text)
    (OUT / (state + '.html')).write_text(html)
    (OUT / (state + '.json')).write_bytes(result.stdout)
    records[state] = {'responseSha256': hashlib.sha256(result.stdout).hexdigest(),
        'htmlSha256': hashlib.sha256(html.encode()).hexdigest(),
        'sourceSha256': hashlib.sha256(text.encode()).hexdigest()}
manifest = {'version': '2.14.0', 'scope': 'Synthetic spacing projections, anonymous GET only.',
    'cases': cases, 'captures': records, 'sources': ['https://www.mediawiki.org/wiki/Help:Formatting#Paragraphs'],
    'networkRequests': 2, 'accountsUsed': 0, 'wikipediaWrites': 0}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': 'captured', 'cases': len(cases), 'networkRequests': 2, 'wikipediaWrites': 0}))
