"""Package only the frozen runtime, reviewed catalogs and completed manual."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.19.0'
DIST, DOCS = ROOT / 'dist' / VERSION, ROOT / 'docs' / VERSION


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    manifest = json.loads((ROOT / 'tests/expected_release_v2190.json').read_text())
    qa = json.loads((ROOT / 'tests/evidence/2.19.0/QA_SUMMARY.json').read_text())
    assert qa['version'] == VERSION and qa['releaseGatesPassed'] is True
    assert qa['frozenFiles'] == manifest['files']
    docs = {
        'Documentacao_RevisaWiki_v2_19_0.wiki', 'Instalacao_RevisaWiki_v2_19_0.txt',
        'Notas_da_versao_RevisaWiki_v2_19_0.txt', 'Referencia_tecnica_RevisaWiki_v2_19_0.txt',
        'Relatorio_testes_RevisaWiki_v2_19_0.txt', 'Resumo_atualizacao_RevisaWiki_v2_19_0.txt',
        'Resumo_documentacao_RevisaWiki_v2_19_0.txt', 'LEIA_PRIMEIRO.txt',
    }
    assert {p.name for p in DOCS.iterdir()} == docs
    catalogs = qa['catalogFiles']
    assert len(catalogs) == 8
    archive = 'RevisaWiki_2.19.0.zip'
    allowed = set(manifest['files']) | set(catalogs) | docs | {
        'LICENSE.txt', 'INICIO.html', 'MANIFESTO.json', 'ARQUIVOS.json', archive, 'Demonstracao_RevisaWiki_v2_19_0.html',
    }
    demo_names = {'DEMONSTRACAO.html', 'demonstracao.css', 'demonstracao.js', 'motor.js', 'exemplos.json'}
    demo = DIST / 'Demonstracao'
    assert demo.is_dir() and not demo.is_symlink() and {p.name for p in demo.iterdir()} == demo_names
    assert all(p.is_file() and not p.is_symlink() for p in demo.iterdir())
    demo_files = {'Demonstracao/' + name for name in demo_names}
    allowed |= demo_files
    assert all(not p.is_symlink() and (p.name == 'Demonstracao' and p.is_dir() or p.is_file() and p.name in allowed) for p in DIST.iterdir())
    for name, pin in {**manifest['files'], **catalogs}.items():
        raw = (DIST / name).read_bytes()
        assert len(raw) == pin['bytes'] and sha(raw) == pin['sha256'], name
    for name in docs:
        source = DOCS / name
        assert source.is_file() and not source.is_symlink()
        shutil.copyfile(source, DIST / name)
    shutil.copyfile(ROOT / 'LICENSE', DIST / 'LICENSE.txt')
    subprocess.run([sys.executable, str(ROOT / 'scripts/build_index_v2190.py')], cwd=ROOT, check=True)
    actual = {p.relative_to(DIST).as_posix() for p in DIST.rglob('*') if p.is_file()}
    assert actual <= allowed and allowed - {'ARQUIVOS.json', archive} <= actual
    files = {}
    for file in sorted(DIST.rglob('*')):
        if file.is_file() and file.name not in {'ARQUIVOS.json', archive}:
            raw = file.read_bytes()
            files[file.relative_to(DIST).as_posix()] = {'bytes': len(raw), 'sha256': sha(raw)}
    (DIST / 'ARQUIVOS.json').write_text(json.dumps({
        'version': VERSION, 'distributionRevision': VERSION, 'files': files,
        'wikipediaWrites': 0,
    }, indent=2) + '\n')
    with zipfile.ZipFile(DIST / archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
        for file in sorted(DIST.rglob('*')):
            if not file.is_file() or file.name == archive:
                continue
            info = zipfile.ZipInfo(file.relative_to(DIST).as_posix(), date_time=(2026, 10, 17, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            package.writestr(info, file.read_bytes())
    raw = (DIST / archive).read_bytes()
    print(json.dumps({'version': VERSION, 'files': len(files) + 2,
                      'archiveBytes': len(raw), 'archiveSha256': sha(raw), 'wikipediaWrites': 0}))


if __name__ == '__main__':
    main()
