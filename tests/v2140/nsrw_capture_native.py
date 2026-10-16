"""Anonymous GET-only parser evidence. It never saves a Wikimedia page."""
from pathlib import Path
import hashlib
import html.parser
import json
import subprocess
import urllib.parse
import time

ROOT = Path(__file__).resolve().parents[2]
NODE = 'node'


class Citation(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.inside = 0
        self.citations = []
        self.text = []
        self.icons = []
        self.coinstitle = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'cite':
            self.inside += 1
            self.citations.append({'text': '', 'links': []})
        if tag == 'a' and self.inside:
            self.citations[-1]['links'].append(attrs.get('href', ''))
        if tag == 'img' and 'PD-icon' in attrs.get('src', ''):
            self.icons.append(attrs.get('alt', ''))
        if tag == 'span' and attrs.get('class') == 'Z3988':
            self.coinstitle.append(attrs.get('title', ''))

    def handle_endtag(self, tag):
        if tag == 'cite':
            self.inside -= 1

    def handle_data(self, text):
        self.text.append(text)
        if self.inside:
            self.citations[-1]['text'] += text


def capture(text):
    query = {'action': 'parse', 'title': 'Tema de controle', 'text': text,
             'prop': 'text|categories|iwlinks|parsewarnings', 'format': 'json', 'formatversion': '2'}
    url = 'https://pt.wikipedia.org/w/api.php?' + urllib.parse.urlencode(query)
    raw = subprocess.check_output(['curl', '-fsSL', '--max-time', '90', url])
    response = json.loads(raw)
    if 'error' in response:
        raise RuntimeError(response['error'])
    parsed = response['parse']
    # Backend cache diagnostics are irrelevant to citation equivalence.
    visible = parsed['text'].split('<!--')[0]
    parser = Citation()
    parser.feed(visible)
    return {'responseSha256': hashlib.sha256(raw).hexdigest(),
            'inputSha256': hashlib.sha256(text.encode()).hexdigest(),
            'citations': parser.citations, 'visibleText': ''.join(parser.text).strip(),
            'icons': parser.icons, 'coins': parser.coinstitle,
            'categories': parsed.get('categories', []), 'iwlinks': parsed.get('iwlinks', []),
            'parsewarnings': parsed.get('parsewarnings', [])}


def main():
    fixtures = json.loads(subprocess.check_output([NODE, '-e', "console.log(JSON.stringify(require('./tests/v2140/nsrw_cases.cjs').positives))"], cwd=ROOT))
    selected = [item for item in fixtures if item['id'] in {'default', 'display', 'short', 'no-icon', 'verbatim-article', 'verbatim-inline', 'verbatim-short'}]
    before = capture('\n\n'.join(item['source'] for item in selected))
    time.sleep(5)
    after = capture('\n\n'.join(item['expected'] for item in selected))
    if len(before['citations']) != len(selected) or len(after['citations']) != len(selected):
        raise RuntimeError('Native parser did not produce the expected citation count')
    captures = []
    for index, fixture in enumerate(selected):
        captures.append({'id': fixture['id'], 'source': fixture['source'], 'expected': fixture['expected'],
                         'attribution': fixture.get('attribution'),
                         'beforeCitation': before['citations'][index], 'afterCitation': after['citations'][index]})
    payload = {'schema': 1, 'language': 'pt', 'captureMethod': 'anonymous parse GET; source and native output projections',
               'networkRequests': 2, 'wikipediaWrites': 0, 'before': before, 'after': after,
               'sources': [
                   {'title': 'Predefinição:Cite NSRW', 'oldid': 60696160},
                   {'title': 'Predefinição:Citar enciclopédia', 'oldid': 60787857},
                   {'title': 'Módulo:Citar enciclopédia', 'oldid': 49700072},
                   {'title': 'Módulo:Citação/CS1/Configuração', 'oldid': 73016847},
                   {'title': 'Módulo:Citação/CS1/Whitelist', 'oldid': 71860752}],
               'captures': captures}
    destination = Path(__file__).with_name('nsrw_native_capture.json')
    destination.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'cases': len(captures), 'anonymousGETs': 2, 'wikipediaWrites': 0}))


if __name__ == '__main__':
    main()
