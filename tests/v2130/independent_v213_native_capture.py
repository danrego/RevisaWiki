"""Capture small public native projections using sequential anonymous GETs."""
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import time
import urllib.parse

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = HERE / 'independent_v213_native'
NODE = shutil.which('node')
if not NODE:
    raise RuntimeError('Node.js is needed to load the handwritten synthetic sources.')
ITEMS = json.loads(subprocess.check_output([NODE, '-e', 'console.log(JSON.stringify(require("./tests/v2130/independent_v213_cases.cjs").items.filter(item=>item.native||item.sorter)))'], cwd=ROOT))
SHA = lambda value: hashlib.sha256(value).hexdigest()


def capture(item, phase, attempts=4):
    source = item['source' if phase == 'before' else 'expected']
    stem = item['id'] + '_' + phase
    receipt_path = OUT / (stem + '_receipt.json')
    if receipt_path.exists():
        receipt = json.loads(receipt_path.read_text())
        if receipt['sourceSha256'] == SHA(source.encode()) and SHA((OUT / receipt['renderFile']).read_bytes()) == receipt['renderSha256']:
            return receipt, 0
    params = {'action': 'parse', 'format': 'json', 'formatversion': '2', 'title': 'RevisaWiki/Teste técnico', 'text': source, 'contentmodel': 'wikitext', 'prop': 'text|modules|parsewarnings', 'disableeditsection': '1', 'disablelimitreport': '1'}
    url = 'https://pt.wikipedia.org/w/api.php?' + urllib.parse.urlencode(params)
    assert len(url.encode()) < 6000
    requests = 0
    for attempt in range(attempts):
        response = subprocess.run(['/usr/bin/curl', '--disable', '--fail', '--silent', '--show-error', '--max-time', '30', '--user-agent', 'RevisaWiki-read-only-native-check/2.13.0', '--write-out', '\n%{http_code}', url], capture_output=True)
        requests += 1
        body, status = response.stdout.rsplit(b'\n', 1)
        if status == b'429' and attempt + 1 < attempts:
            time.sleep(5 * (2 ** attempt))
            continue
        if response.returncode:
            raise RuntimeError('Anonymous GET failed for ' + stem + ', HTTP ' + status.decode(errors='replace'))
        payload = json.loads(body)
        if 'error' in payload:
            raise RuntimeError('Native parser refused ' + stem + ': ' + str(payload['error'].get('code', 'unknown')))
        parsed = payload['parse']
        rendered = parsed['text']
        (OUT / (stem + '.wiki')).write_text(source)
        (OUT / (stem + '.html')).write_text(rendered)
        receipt = {'id': item['id'], 'feature': item['feature'], 'phase': phase, 'method': 'GET', 'credentials': 'omit', 'httpStatus': int(status), 'sourceFile': stem + '.wiki', 'sourceBytes': len(source.encode()), 'sourceSha256': SHA(source.encode()), 'renderFile': stem + '.html', 'renderBytes': len(rendered.encode()), 'renderSha256': SHA(rendered.encode()), 'responseSha256': SHA(body), 'responseSavedAt': datetime.now(timezone.utc).isoformat(), 'responseSavedAtMethod': 'UTC time immediately after the successful anonymous GET', 'parseWarnings': parsed.get('parsewarnings', []), 'modules': parsed.get('modules', []), 'wikipediaWrites': 0}
        receipt_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
        time.sleep(1)
        return receipt, requests
    raise RuntimeError('Native capture did not finish for ' + stem)


class Slices(HTMLParser):
    """Locate exact response substrings, without inventing separate responses."""
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self, source, identifiers):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.identifiers = set(identifiers)
        self.starts = [0]
        for index, char in enumerate(source):
            if char == '\n':
                self.starts.append(index + 1)
        self.active = None
        self.results = {}

    def absolute_offset(self):
        line, column = self.getpos()
        return self.starts[line - 1] + column

    def handle_starttag(self, tag, attrs):
        key = dict(attrs).get('id')
        if self.active is None and tag == 'div' and key in self.identifiers:
            self.active = [key, self.absolute_offset(), 1]
        elif self.active is not None and tag not in self.VOID:
            self.active[2] += 1

    def handle_startendtag(self, tag, attrs):
        return

    def handle_endtag(self, tag):
        if self.active is None or tag in self.VOID:
            return
        self.active[2] -= 1
        if self.active[2] == 0:
            key, start, _ = self.active
            end = self.source.index('>', self.absolute_offset()) + 1
            if key in self.results:
                raise RuntimeError('Native batch emitted a duplicate projection marker.')
            self.results[key] = (start, end)
            self.active = None


def batch_capture(rows, phase):
    key_for = lambda item: 'rw-native-' + item['id'] + ('-' + item['_nativePhase'] if phase == 'mixed' else '')
    source = '\n\n'.join('<div id="' + key_for(item) + '">\n' + item['source' if item.get('_nativePhase', phase) == 'before' else 'expected'] + '\n</div>' for item in rows)
    params = {'action': 'parse', 'format': 'json', 'formatversion': '2', 'title': 'RevisaWiki/Teste técnico', 'text': source, 'contentmodel': 'wikitext', 'prop': 'text|modules|parsewarnings', 'disableeditsection': '1', 'disablelimitreport': '1'}
    url = 'https://pt.wikipedia.org/w/api.php?' + urllib.parse.urlencode(params)
    assert len(url.encode()) < 6000
    name = 'batch_' + phase + '_' + SHA(source.encode())[:16]
    cached = None
    for stem in [name, 'batch_' + phase]:
        saved_source, saved_html = OUT / (stem + '.wiki'), OUT / (stem + '.html')
        if saved_source.exists() and saved_html.exists() and saved_source.read_text() == source:
            cached = (saved_html.read_text(), saved_html.stat().st_mtime)
            break
    if cached:
        rendered, saved_time = cached
        metadata_path = OUT / (name + '_request.json')
        if metadata_path.exists():
            metadata = json.loads(metadata_path.read_text())
        else:
            metadata = {'responseSha256': None, 'httpStatus': None, 'responseSavedAt': datetime.fromtimestamp(saved_time, timezone.utc).isoformat(), 'responseSavedAtMethod': 'Modification time of the exact native HTML saved by the successful GET before the local extractor stopped', 'parseWarnings': None, 'modules': None, 'retainedMetadata': 'The exact GET source and returned native HTML were saved. Enclosing JSON hash, HTTP status and parser metadata were not retained before the local extraction failed; they are not reconstructed.'}
        requests = 0
    else:
        response = subprocess.run(['/usr/bin/curl', '--disable', '--fail', '--silent', '--show-error', '--max-time', '30', '--user-agent', 'RevisaWiki-read-only-native-check/2.13.0', '--write-out', '\n%{http_code}', url], capture_output=True)
        body, status = response.stdout.rsplit(b'\n', 1)
        if response.returncode:
            raise RuntimeError('Anonymous batched GET stopped, HTTP ' + status.decode(errors='replace'))
        payload = json.loads(body)
        if 'error' in payload:
            raise RuntimeError('Native batch refused: ' + str(payload['error'].get('code', 'unknown')))
        parsed = payload['parse']
        rendered = parsed['text']
        metadata = {'responseSha256': SHA(body), 'httpStatus': int(status), 'responseSavedAt': datetime.now(timezone.utc).isoformat(), 'responseSavedAtMethod': 'UTC time immediately after the successful anonymous batched GET', 'parseWarnings': parsed.get('parsewarnings', []), 'modules': parsed.get('modules', [])}
        requests = 1
    (OUT / (name + '.wiki')).write_text(source)
    (OUT / (name + '.html')).write_text(rendered)
    (OUT / (name + '_request.json')).write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
    slices = Slices(rendered, [key_for(item) for item in rows])
    slices.feed(rendered)
    assert len(slices.results) == len(rows), 'Every batch case must have one complete explicit wrapper.'
    receipts = []
    for item in rows:
        item_phase = item.get('_nativePhase', phase)
        original = item['source' if item_phase == 'before' else 'expected']
        stem = item['id'] + '_' + item_phase
        start, end = slices.results[key_for(item)]
        fragment = rendered[start:end]
        (OUT / (stem + '.wiki')).write_text(original)
        (OUT / (stem + '.html')).write_text(fragment)
        receipt = {'id': item['id'], 'feature': item['feature'], 'phase': item_phase, 'method': 'GET', 'credentials': 'omit', **metadata, 'sourceFile': stem + '.wiki', 'sourceBytes': len(original.encode()), 'sourceSha256': SHA(original.encode()), 'renderFile': stem + '.html', 'renderBytes': len(fragment.encode()), 'renderSha256': SHA(fragment.encode()), 'renderKind': 'Exact native HTML fragment from the explicitly marked shared request', 'scopeSelector': '#' + key_for(item), 'requestSourceFile': name + '.wiki', 'requestSourceSha256': SHA(source.encode()), 'requestRenderFile': name + '.html', 'requestRenderSha256': SHA(rendered.encode()), 'projectionCharacterOffsets': {'start': start, 'end': end}, 'wikipediaWrites': 0}
        (OUT / (stem + '_receipt.json')).write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
        receipts.append(receipt)
    time.sleep(2)
    return receipts, requests


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    requests = 0
    if '--batch' in sys.argv:
        pending = [(item, phase) for item in ITEMS for phase in ['before', 'after'] if not (OUT / (item['id'] + '_' + phase + '_receipt.json')).exists()]
        if len(pending) == 2 and pending[0][0]['id'] == pending[1][0]['id'] and pending[0][0]['feature'] == 4:
            _, count = batch_capture([{**item, '_nativePhase': phase} for item, phase in pending], 'mixed')
            requests += count
        for phase in ['before', 'after']:
            remaining = []
            for item in ITEMS:
                receipt = OUT / (item['id'] + '_' + phase + '_receipt.json')
                if receipt.exists():
                    row, count = capture(item, phase, attempts=1)
                    rows.append(row)
                    requests += count
                elif phase == 'before' and item['feature'] in [8, 11]:
                    row, count = capture(item, phase, attempts=1)
                    rows.append(row)
                    requests += count
                else:
                    remaining.append(item)
            if remaining:
                batch_rows, count = batch_capture(remaining, phase)
                rows.extend(batch_rows)
                requests += count
    else:
        for item in ITEMS:
            for phase in ['before', 'after']:
                receipt, count = capture(item, phase)
                rows.append(receipt)
                requests += count
    rows.sort(key=lambda row: ([item['id'] for item in ITEMS].index(row['id']), ['before', 'after'].index(row['phase'])))
    manifest = {'version': '2.13.0', 'kind': 'independent-fourteen-native-synthetic-projections', 'method': 'GET', 'credentials': 'omit', 'oracleSha256': SHA((HERE / 'independent_v213_cases.cjs').read_bytes()), 'features': sorted(set(item['feature'] for item in ITEMS)), 'captures': rows, 'networkRequestsThisCapture': requests, 'distinctNativeRequestSources': len(set(row.get('requestSourceSha256', row['sourceSha256']) for row in rows)), 'scope': 'Synthetic affected components. Some responses contain several explicitly marked cases; their exact source, shared native response and substring offsets are retained. Unclosed reference cases are captured separately. No full-article render is claimed.', 'wikipediaWrites': 0, 'accountsUsed': 0}
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': 'captured', 'cases': len(rows), 'features': manifest['features'], 'networkRequests': requests, 'wikipediaWrites': 0}))


if __name__ == '__main__':
    main()
