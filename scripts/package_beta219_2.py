"""Package only the tested beta files, documentation and portable receipts."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.19.0-beta.2'
DIST = ROOT / 'dist' / VERSION
EVIDENCE = ROOT / 'tests/evidence' / VERSION


def pin(raw):
    return {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


def main():
    manifest = json.loads((ROOT / 'tests/expected_release_beta219_2.json').read_text())
    qa = json.loads((EVIDENCE / 'QA_SUMMARY.json').read_text())
    assert qa['status'] == 'passed-beta-scope-with-safari-unavailable'
    assert qa['mainValidationResumed'] is False and qa['final219Qualified'] is False
    index = json.loads((DIST / 'MANIFESTO.json').read_text())
    assert pin((DIST / 'INICIO.html').read_bytes())['sha256'] == index['indexSha256']
    for name, expected in manifest['files'].items():
        assert pin((DIST / name).read_bytes()) == expected
    index_results = []
    for browser in ('chrome', 'firefox'):
        source = ROOT / 'artifacts/v2180/index' / browser / 'copy_index.json'
        receipt = json.loads(source.read_text())
        assert receipt['status'] == 'passed' and receipt['indexSha256'] == index['indexSha256']
        assert len(receipt['cases']) == 32 and receipt['wikipediaWrites'] == 0
        # The receipt has no loopback URLs, cookies, names or screenshot data.
        assert str(ROOT) not in source.read_text()
        shutil.copyfile(source, EVIDENCE / ('index-' + browser + '.json'))
        index_results.append({'browser': browser, 'cases': len(receipt['cases']), 'checks': receipt['checks']})
    qa['copyIndex'] = index_results
    (EVIDENCE / 'QA_SUMMARY.json').write_text(json.dumps(qa, ensure_ascii=False, indent=2) + '\n')
    shutil.copyfile(EVIDENCE / 'QA_SUMMARY.json', DIST / 'QA_SUMMARY.json')
    archive = DIST / ('RevisaWiki_' + VERSION + '.zip')
    allowed = set(manifest['files']) | {p.name for p in (ROOT / 'docs' / VERSION).iterdir()} | {
        'LICENSE.txt', 'INICIO.html', 'MANIFESTO.json', 'QA_SUMMARY.json', 'ARQUIVOS.json', archive.name}
    assert all(p.is_file() and not p.is_symlink() and p.name in allowed for p in DIST.iterdir())
    files = {p.name: pin(p.read_bytes()) for p in sorted(DIST.iterdir())
             if p.name not in ('ARQUIVOS.json', archive.name)}
    (DIST / 'ARQUIVOS.json').write_text(json.dumps({'version': VERSION, 'files': files,
        'wikipediaWrites': 0, 'mainValidationResumed': False}, indent=2) + '\n')
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as package:
        for source in sorted(DIST.iterdir()):
            if source == archive:
                continue
            info = zipfile.ZipInfo(source.name, (2026, 10, 19, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            package.writestr(info, source.read_bytes())
    with zipfile.ZipFile(archive) as package:
        assert set(package.namelist()) == allowed - {archive.name}
        for name in package.namelist():
            assert package.read(name) == (DIST / name).read_bytes()
    print(json.dumps({'version': VERSION, 'files': len(allowed), 'archive': pin(archive.read_bytes())}))


if __name__ == '__main__':
    main()
