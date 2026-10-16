"""Package the tested 2.12.0 bytes and complete copy index reproducibly."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist/2.12.0'
manifest = json.loads((ROOT / 'tests/expected_release_v2120.json').read_text())
for name, pin in manifest['files'].items():
    raw = (DIST / name).read_bytes()
    assert len(raw) == pin['bytes'] and hashlib.sha256(raw).hexdigest() == pin['sha256'], name
for source in (ROOT / 'docs/2.12.0').iterdir():
    if source.is_file():
        shutil.copyfile(source, DIST / source.name)
shutil.copyfile(ROOT / 'LICENSE', DIST / 'LICENSE.txt')
subprocess.run([sys.executable, str(ROOT / 'scripts/build_index_v2120.py')], cwd=ROOT, check=True)
archive = DIST / 'RevisaWiki_2.12.0.zip'
files = {}
for source in sorted(DIST.iterdir()):
    if source.is_file() and source.name not in [archive.name, 'ARQUIVOS.json']:
        raw = source.read_bytes()
        files[source.name] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
(DIST / 'ARQUIVOS.json').write_text(json.dumps({'version': '2.12.0', 'distributionRevision': manifest['distributionRevision'], 'files': files, 'wikipediaWrites': 0}, indent=2) + '\n')
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
    for source in sorted(DIST.iterdir()):
        if source.is_file() and source != archive:
            info = zipfile.ZipInfo(source.name, date_time=(2026, 10, 16, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            package.writestr(info, source.read_bytes())
print(json.dumps({'version': '2.12.0', 'files': len(files) + 2, 'archiveBytes': archive.stat().st_size,
                  'archiveSha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'wikipediaWrites': 0}))
