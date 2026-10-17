"""Package the tested 2.15.1 bytes and complete copy index reproducibly."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist/2.15.1'
manifest = json.loads((ROOT / 'tests/expected_release_v2151.json').read_text())
doc_names = {
    'Documentacao_RevisaWiki_v2_15_1.wiki', 'Instalacao_RevisaWiki_v2_15_1.txt',
    'Resumo_atualizacao_RevisaWiki_v2_15_1.txt', 'Resumo_documentacao_RevisaWiki_v2_15_1.txt',
    'Notas_da_versao_RevisaWiki_v2_15_1.txt', 'LEIA_PRIMEIRO.txt',
    'Referencia_tecnica_RevisaWiki_v2_15_1.txt', 'Relatorio_testes_RevisaWiki_v2_15_1.txt',
}
catalog_names = {path.name.replace('_v2_15_0', '_v2_15_1') for path in (ROOT / 'dist/2.15.0').glob('Catalogo_*.json')}
assert len(catalog_names) == 8
allowed = set(manifest['files']) | catalog_names | doc_names | {
    'LICENSE.txt', 'INICIO.html', 'MANIFESTO.json', 'ARQUIVOS.json', 'RevisaWiki_2.15.1.zip',
}
assert all(path.is_file() and not path.is_symlink() and path.name in allowed for path in DIST.iterdir()), 'Unexpected distribution file'
docs = ROOT / 'docs/2.15.1'
assert {path.name for path in docs.iterdir()} == doc_names, 'Unexpected or missing documentation file'
assert all(path.is_file() and not path.is_symlink() for path in docs.iterdir())
for name, pin in manifest['files'].items():
    raw = (DIST / name).read_bytes()
    assert len(raw) == pin['bytes'] and hashlib.sha256(raw).hexdigest() == pin['sha256'], name
for name in sorted(doc_names):
    shutil.copyfile(docs / name, DIST / name)
shutil.copyfile(ROOT / 'LICENSE', DIST / 'LICENSE.txt')
subprocess.run([sys.executable, str(ROOT / 'scripts/build_index_v2151.py')], cwd=ROOT, check=True)
assert {path.name for path in DIST.iterdir()} <= allowed, 'Index generation added an unexpected file'
required = allowed - {'ARQUIVOS.json', 'RevisaWiki_2.15.1.zip'}
assert required <= {path.name for path in DIST.iterdir()}, 'A required release file is missing'
baseline = ROOT / 'dist/2.15.0'
baseline_inventory = json.loads((baseline / 'ARQUIVOS.json').read_text())['files']
for name in sorted(catalog_names):
    original_name = name.replace('_v2_15_1', '_v2_15_0')
    raw = (baseline / original_name).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == baseline_inventory[original_name]['sha256']
    catalog = json.loads(raw)
    catalog['releaseVersion'] = catalog['distributionVersion'] = '2.15.1'
    if 'releaseCoreSha256' in catalog:
        catalog['releaseCoreSha256'] = manifest['files']['RevisaWiki_v2_15_1.js']['sha256']
    expected = (json.dumps(catalog, ensure_ascii=False, indent=2) + '\n').encode()
    assert (DIST / name).read_bytes() == expected, 'Catalog differs from the pinned reconstruction'
archive = DIST / 'RevisaWiki_2.15.1.zip'
files = {}
for source in sorted(DIST.iterdir()):
    if source.is_file() and source.name not in [archive.name, 'ARQUIVOS.json']:
        raw = source.read_bytes()
        files[source.name] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
(DIST / 'ARQUIVOS.json').write_text(json.dumps({'version': '2.15.1', 'distributionRevision': manifest['distributionRevision'], 'files': files, 'wikipediaWrites': 0}, indent=2) + '\n')
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
    for source in sorted(DIST.iterdir()):
        if source.is_file() and source != archive:
            info = zipfile.ZipInfo(source.name, date_time=(2026, 10, 16, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            package.writestr(info, source.read_bytes())
print(json.dumps({'version': '2.15.1', 'files': len(files) + 2, 'archiveBytes': archive.stat().st_size,
                  'archiveSha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'wikipediaWrites': 0}))
