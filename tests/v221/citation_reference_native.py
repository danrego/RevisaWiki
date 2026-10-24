"""Selected reference-identity contracts in the running local native parser."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.parse
import urllib.request


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--evidence', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    node = os.environ.get('REVISAWIKI_NODE', 'node')
    proc = subprocess.run([node, str(root / 'tests/v221/citation_contracts.cjs'), '--reference-cases'],
                          capture_output=True, text=True, check=True, timeout=30)
    cases = json.loads(proc.stdout)['cases']
    args.evidence.mkdir(parents=True, exist_ok=True)
    receipts = []
    for case in cases:
        receipt = {'id': case['id'], 'sides': {}}
        for side in ['before', 'after']:
            payload = urllib.parse.urlencode({'action': 'parse', 'title': 'Reference contract test',
                                             'text': case[side], 'prop': 'text|templates|parsewarnings',
                                             'format': 'json', 'formatversion': 2}).encode()
            response = urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8890/pt/api.php', data=payload), timeout=120).read()
            data = json.loads(response)
            if 'error' in data:
                raise RuntimeError(data['error'])
            rendered = data['parse']['text']
            record = {'sourceSha256': hashlib.sha256(case[side].encode()).hexdigest(),
                      'responseSha256': hashlib.sha256(response).hexdigest(),
                      'citationError': bool(re.search(r'class="[^"]*(?:mw-ext-cite-error|cite-error|error[^\"]*mw-ext-cite)', rendered)),
                      'bodyOccurrences': rendered.count('Fonte preservada.'),
                      'referenceListCount': len(re.findall(r'<ol\b[^>]*class="[^"]*references', rendered)),
                      'missingTemplates': [item.get('title') for item in data['parse'].get('templates', []) if not item.get('exists')]}
            filename = args.evidence / (case['id'] + '-' + side + '.json')
            if filename.exists() and filename.read_bytes() != response:
                raise ValueError('Earlier native evidence must be retained; use a new folder')
            filename.write_bytes(response)
            receipt['sides'][side] = record
        receipt['qualified'] = (not receipt['sides']['after']['citationError'] and
                                not receipt['sides']['after']['missingTemplates'] and
                                receipt['sides']['after']['bodyOccurrences'] == 1 and
                                receipt['sides']['after']['referenceListCount'] == 1)
        receipts.append(receipt)
    result = {'kind': 'local-native-reference-name-pairs', 'pairs': len(cases), 'nativeParseRequests': 2 * len(cases),
              'localImports': 0, 'publicWrites': 0, 'qualified': all(row['qualified'] for row in receipts), 'receipts': receipts}
    (args.evidence / 'NATIVE_REFERENCE_NAME_RECEIPT_PRIVATE.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(json.dumps(result, ensure_ascii=False))
    if not result['qualified']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
