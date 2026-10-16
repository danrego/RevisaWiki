"""Two anonymous GET parser projections of five bounded native template contexts."""
from pathlib import Path
import hashlib
import html.parser
import json
import re
import subprocess
import time
import urllib.parse

BASE = Path(__file__).resolve().parent


class Projection(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.images = []
        self.links = []
        self.classes = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'img':
            self.images.append({key: attrs.get(key, '') for key in ['alt', 'width', 'height', 'class']})
        if tag == 'a':
            self.links.append(attrs.get('href', ''))
        if 'class' in attrs:
            self.classes.append(attrs['class'])

    def handle_data(self, text):
        self.text.append(text)


def capture(text):
    query = {'action': 'parse', 'title': 'Tema de controle', 'text': text,
             'prop': 'text|categories|parsewarnings', 'format': 'json', 'formatversion': '2'}
    raw = subprocess.check_output(['curl', '-fsSL', '--max-time', '90',
                                 'https://pt.wikipedia.org/w/api.php?' + urllib.parse.urlencode(query)])
    data = json.loads(raw)
    if 'error' in data:
        raise RuntimeError(data['error'])
    parsed = data['parse']
    html = re.sub(r'<!--[\s\S]*?-->', '', parsed['text'])
    projection = Projection()
    projection.feed(html)
    return {'responseSha256': hashlib.sha256(raw).hexdigest(),
            'inputSha256': hashlib.sha256(text.encode()).hexdigest(),
            'visibleText': ''.join(projection.text), 'images': projection.images,
            'links': projection.links, 'classes': projection.classes,
            'categories': parsed.get('categories', []), 'parsewarnings': parsed.get('parsewarnings', [])}


def main():
    fixtures = json.loads(BASE.joinpath('drug_native_cases.json').read_text())
    before_source = '\n\n'.join('== ' + case['id'] + ' ==\n' + case['source'] for case in fixtures)
    after_source = '\n\n'.join('== ' + case['id'] + ' ==\n' + case['expected'] for case in fixtures)
    before = capture(before_source)
    time.sleep(5)
    after = capture(after_source)
    report = {'schema': 1, 'version': '2.14.0', 'kind': 'native-chemical-template-fields',
              'captureMethod': 'two anonymous GET parse projections; five native template contexts',
              'networkRequests': 2, 'wikipediaWrites': 0, 'source': before_source, 'expected': after_source,
              'fixturesSha256': hashlib.sha256(BASE.joinpath('drug_native_cases.json').read_bytes()).hexdigest(),
              'nativeSources': [
                  {'title': 'Predefinição:Info/Droga', 'oldid': 69873897},
                  {'title': 'Predefinição:Info/Química', 'oldid': 69946908},
                  {'title': 'Predefinição:Chembox', 'oldid': 46323499},
                  {'title': 'Predefinição:Chembox Identifiers', 'oldid': 69934566},
                  {'title': 'Predefinição:Chembox Pharmacology', 'oldid': 70092713},
                  {'title': 'Predefinição:Chembox Properties', 'oldid': 69934732}],
              'before': before, 'after': after}
    destination = BASE.joinpath('drug_import_native_capture.json')
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'captured': True, 'cases': len(fixtures), 'anonymousGETs': 2, 'wikipediaWrites': 0}))


if __name__ == '__main__':
    main()
