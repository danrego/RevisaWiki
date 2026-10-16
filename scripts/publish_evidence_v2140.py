"""Copy completed final JSON reports, excluding private logs and withdrawn runs."""
from pathlib import Path
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE, DESTINATION = ROOT / 'artifacts/v2140', ROOT / 'tests/evidence/2.14.0'
pin_bytes = (ROOT / 'tests/expected_release_v2140.json').read_bytes()
manifest = json.loads(pin_bytes)
qa = json.loads((SOURCE / 'RELEASE_QA_SUMMARY.json').read_text())
assert qa['status'] == 'passed' and qa['releaseManifestSha256'] == hashlib.sha256(pin_bytes).hexdigest()
assert qa['frozenFiles'] == manifest['files']
inputs = []
for folder in ['final_main', 'final_focused', 'native_browser', 'final_image', 'final_ui_browser', 'final_fixes_browser', 'final_performance']:
    for path in sorted((SOURCE / folder).glob('*.json')):
        inputs.append((path, folder + '/' + path.name))
for folder in ['modular', 'complete']:
    inputs.extend((path, 'final_focused/' + folder + '/' + path.name) for path in sorted((SOURCE / 'final_focused' / folder).glob('*.json')))
inputs += [(SOURCE / 'large-corpus/final_v2140/public_report.json', 'large_articles.json')]
for name in ['RELEASE_QA_SUMMARY.json', 'documentation.json', 'copy_index.json', 'rebuild.json']:
    inputs.append((SOURCE / name, name))
DESTINATION.mkdir(parents=True, exist_ok=True)
files = {}
for path, name in inputs:
    raw = path.read_bytes()
    value = json.loads(raw)
    assert value.get('status', 'passed') == 'passed' and not value.get('failed') and not value.get('failures'), name
    assert value.get('version', '2.14.0') == '2.14.0', name
    if 'frozenFiles' in value:
        assert value['frozenFiles'] == manifest['files'], name
    if 'releaseManifestSha256' in value:
        assert value['releaseManifestSha256'] == qa['releaseManifestSha256'], name
    target = DESTINATION / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, target)
    files[name] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
(DESTINATION / 'EVIDENCE_INDEX.json').write_text(json.dumps({'version': '2.14.0', 'status': 'passed', 'files': files,
    'scope': 'Final JSON evidence only, bound to the final runtime. No preliminary receipts, withdrawn runs, logs, browser profiles, account data, screenshots or private paths. The full privacy gate runs after this inventory is prepared.',
    'wikipediaWrites': 0}, indent=2) + '\n')
print(json.dumps({'version': '2.14.0', 'status': 'passed', 'reports': len(files), 'wikipediaWrites': 0}))
