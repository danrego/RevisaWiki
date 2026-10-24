"""Run explicit citation pairs against the already running local native wiki.

No page is saved or imported. Full request/response evidence stays in the ignored
development evidence folder, outside the distribution and test source tree.
"""
import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.parse
import urllib.request


ROOT = Path(__file__).resolve().parents[2]
NODE = os.environ.get('REVISAWIKI_NODE', 'node')


def native_owners(rendered):
    """Keep complete owners even when a native template adds nested divs."""
    offsets = [0]
    for line in rendered.splitlines(keepends=True):
        offsets.append(offsets[-1] + len(line))

    class Owners(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=False)
            self.depth = 0
            self.active = None
            self.records = {}

        def at(self):
            line, column = self.getpos()
            return offsets[line - 1] + column

        def handle_starttag(self, tag, attrs):
            if tag != 'div':
                return
            self.depth += 1
            key = dict(attrs).get('id', '')
            if re.fullmatch(r'v221-native-\d+-(?:before|after)', key):
                if self.active is not None:
                    raise ValueError('Nested native pair test owners')
                self.active = (key, self.depth, self.at())

        def handle_endtag(self, tag):
            if tag != 'div':
                return
            if self.active is not None and self.active[1] == self.depth:
                key, _, start = self.active
                end = rendered.index('>', self.at()) + 1
                self.records[key] = rendered[start:end]
                self.active = None
            self.depth -= 1

    parser = Owners()
    parser.feed(rendered)
    if parser.active is not None:
        raise ValueError('Unclosed native pair test owner')
    return parser.records


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--evidence', type=Path, required=True)
    parser.add_argument('--cases-file', type=Path)
    args = parser.parse_args()
    args.evidence.mkdir(parents=True, exist_ok=True)
    if args.cases_file:
        cases = json.loads(args.cases_file.read_text())['cases']
    else:
        proc = subprocess.run([str(NODE), str(ROOT / 'tests/v221/citation_contracts.cjs'), '--native-cases'],
                              check=True, capture_output=True, text=True, timeout=30)
        cases = json.loads(proc.stdout)['cases']
    source = '\n'.join('<div id="v221-native-' + str(index) + '-' + side + '">' + case[side] + '</div>'
                       for index, case in enumerate(cases) for side in ['before', 'after'])
    payload = urllib.parse.urlencode({'action': 'parse', 'title': 'RevisaWiki citation contract tests',
                                     'text': source, 'contentmodel': 'wikitext',
                                     'prop': 'text|templates|parsewarnings', 'format': 'json', 'formatversion': 2}).encode()
    request = urllib.request.Request('http://127.0.0.1:8890/pt/api.php', data=payload,
                                     headers={'User-Agent': 'RevisaWiki local regression tests'})
    response = urllib.request.urlopen(request, timeout=120).read()
    parsed = json.loads(response)
    if 'error' in parsed:
        raise RuntimeError(parsed['error'])
    rendered = parsed['parse']['text']
    owners = native_owners(rendered)
    records = []
    for index, case in enumerate(cases):
        record = {'id': case['id']}
        for side in ['before', 'after']:
            fragment = owners.get('v221-native-' + str(index) + '-' + side)
            if not fragment:
                raise ValueError('Missing native pair owner: ' + case['id'] + '/' + side)
            record[side] = {
                'text': html.unescape(re.sub(r'<[^>]+>', '', re.sub(r'<(?:style|script)\b[^>]*>[\s\S]*?</(?:style|script)>', '', fragment, flags=re.I))),
                'errors': len(re.findall(r'class="[^"]*(?:citation-comment|scribunto-error|mw-ext-cite-error)', fragment)),
                'links': [{'url': html.unescape(url), 'label': html.unescape(re.sub(r'<[^>]+>', '', label))}
                          for url, label in re.findall(r'<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>', fragment)],
                'imageAlts': [html.unescape(value) for value in re.findall(r'<img\b[^>]*alt="([^"]*)"', fragment)],
                'sha256': hashlib.sha256(fragment.encode()).hexdigest(),
            }
        record['errorIncrease'] = record['after']['errors'] > record['before']['errors']
        records.append(record)
    files = {'NATIVE_CITATION_PAIRS_SOURCE_PRIVATE.wiki': source.encode(),
             'NATIVE_CITATION_PAIRS_RESPONSE_PRIVATE.json': response,
             'NATIVE_CITATION_PAIRS_HTML_PRIVATE.html': rendered.encode(),
             'NATIVE_CITATION_PAIRS_CASES_PRIVATE.json': json.dumps(cases, ensure_ascii=False, indent=2).encode()}
    for filename, raw in files.items():
        target = args.evidence / filename
        if target.exists() and target.read_bytes() != raw:
            raise ValueError('Preserve the earlier native evidence round; choose a new folder')
        target.write_bytes(raw)
    result = {'kind': 'local-native-citation-pair-evidence', 'pairs': len(cases),
              'nativeParseRequests': 1, 'publicationWrites': 0, 'localPageImports': 0,
              'sourceSha256': hashlib.sha256(source.encode()).hexdigest(),
              'responseSha256': hashlib.sha256(response).hexdigest(),
              'missingTemplates': [item.get('title') for item in parsed['parse'].get('templates', []) if not item.get('exists')],
              'errorIncreases': [row['id'] for row in records if row['errorIncrease']], 'records': records,
              'limits': ['Native local snapshot only. Per-case semantic qualification is separate from an error count.']}
    (args.evidence / 'NATIVE_CITATION_PAIRS_RECEIPT_PRIVATE.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(json.dumps({key: value for key, value in result.items() if key != 'records'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
