"""Shared checks for the current release's portable delivery files."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.20.0'
STEM = 'v2_20_0'
DIST = ROOT / 'dist' / VERSION
DOCS = ROOT / 'docs' / VERSION
WIKI_PAGE_LIMIT = 2_097_152
FIXED_CALLS = ('Chamada_fixa_RevisaWiki_common.js', 'Chamada_fixa_RevisaWiki_copia_propria.js')
INSTALL_FILES = (f'RevisaWiki_{STEM}_dados.js', f'RevisaWiki_{STEM}.js')
RUNTIME_FILES = frozenset((
    *INSTALL_FILES, f'RevisaWiki_{STEM}_completo.js',
    f'Carregador_common_js_RevisaWiki_{STEM}.js',
    f'Carregador_comunitario_RevisaWiki_{STEM}.js', *FIXED_CALLS,
))
REQUIRED_DOCS = (
    f'Documentacao_RevisaWiki_{STEM}.wiki', f'Instalacao_RevisaWiki_{STEM}.txt',
    f'Notas_da_versao_RevisaWiki_{STEM}.txt', f'Referencia_tecnica_RevisaWiki_{STEM}.txt',
    f'Relatorio_testes_RevisaWiki_{STEM}.txt', f'Resumo_atualizacao_RevisaWiki_{STEM}.txt',
    f'Resumo_documentacao_RevisaWiki_{STEM}.txt', 'LEIA_PRIMEIRO.txt',
    'Funcionalidades_RevisaWiki_2_20.md',
)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def pin(path):
    raw = path.read_bytes()
    return {'bytes': len(raw), 'sha256': sha(raw)}


def safe_file(root, name):
    relative = Path(name)
    if relative.is_absolute() or '..' in relative.parts or '\\' in name or '\0' in name:
        raise ValueError('Unsafe delivery filename')
    path = root / relative
    ancestors = [root.joinpath(*relative.parts[:count]) for count in range(1, len(relative.parts) + 1)]
    if any(part.is_symlink() for part in ancestors) or not path.is_file():
        raise ValueError('Missing or unsupported delivery file: ' + name)
    return path


def read_json(path):
    if path.is_symlink() or not path.is_file():
        raise ValueError('A required release record is missing')
    return json.loads(path.read_text(encoding='utf-8'))


def checked_manifest(path=None):
    path = path or ROOT / 'tests/expected_release_v2200.json'
    manifest = read_json(path)
    if manifest.get('version') != VERSION or not isinstance(manifest.get('files'), dict):
        raise ValueError('The runtime manifest has a different release version')
    for name, expected in manifest['files'].items():
        if pin(safe_file(DIST, name)) != expected:
            raise ValueError('Runtime bytes differ from the frozen manifest: ' + name)
    if set(manifest['files']) != RUNTIME_FILES:
        raise ValueError('The runtime manifest must name exactly the seven release files')
    for name in INSTALL_FILES:
        if name not in manifest['files'] or manifest['files'][name]['bytes'] >= WIKI_PAGE_LIMIT:
            raise ValueError('An installable part reaches the wiki page-size limit')
    previous = read_json(ROOT / 'tests/expected_release_v2191.json')
    for name in FIXED_CALLS:
        if manifest['files'].get(name) != previous['files'].get(name):
            raise ValueError('An existing fixed common.js call has changed: ' + name)
    return manifest


def checked_qa(manifest, path=None):
    path = path or ROOT / 'tests/evidence/2.20.0/QA_SUMMARY.json'
    qa = read_json(path)
    if qa.get('version') != VERSION or qa.get('releaseGatesPassed') is not True:
        raise ValueError('The final release gates have not passed')
    if qa.get('frozenFiles') != manifest['files']:
        raise ValueError('The final QA is not bound to these runtime bytes')
    if qa.get('wikipediaWrites') != 0:
        raise ValueError('The QA must confirm that no Wikipedia write was made')
    if qa.get('workerDeadlineMilliseconds') != 60_000:
        raise ValueError('The release must retain the 60-second worker deadline')
    if qa.get('unresolvedIntegrityFailures') != 0:
        raise ValueError('The final QA must confirm zero unresolved integrity failures')
    return qa


def checked_text(path):
    text = path.read_bytes().decode('utf-8')
    if re.search(r'\b[A-Z_]*PENDING\b|\bTODO\b|\bFIXME\b', text):
        raise ValueError('An unfinished delivery text was found: ' + path.name)
    return text


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
