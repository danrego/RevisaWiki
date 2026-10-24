"""Shared checks for the current release's portable delivery files."""
from pathlib import Path
import hashlib
import json
import os
import re
import stat
import uuid

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2.21.0'
STEM = 'v2_21_0'
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
    'Funcionalidades_RevisaWiki_2_21.md',
)
SOURCE_INPUTS = frozenset((
    'src/v2_21/composition_prerequisites.js', 'src/v2_21/citation_repairs.js',
    'src/v2_21/structure_repairs.js', 'src/v2_21/biography_infoboxes.js',
    'src/v2_21/integration.js', 'src/v2_21/ui_preflights.js', 'src/v2_21/header.txt',
    'scripts/build_v2210.py', 'scripts/v221_extract_data.cjs',
    'scripts/v220_compact.cjs', 'package-lock.json',
))


class ReleaseRecord(dict):
    """A parsed public record plus private, byte-exact input witnesses."""
    def __init__(self, value, records):
        super().__init__(value)
        self.records = records


def relative_name(name):
    if not isinstance(name, str):
        raise ValueError('A delivery filename must be text')
    relative = Path(name)
    if relative.is_absolute() or not relative.parts or '..' in relative.parts or '\\' in name or '\0' in name:
        raise ValueError('Unsafe delivery filename')
    return relative


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def pin(path):
    raw = path.read_bytes()
    return {'bytes': len(raw), 'sha256': sha(raw)}


def safe_file(root, name):
    root = Path(root)
    relative = relative_name(name)
    path = root / relative
    ancestors = [root.joinpath(*relative.parts[:count]) for count in range(1, len(relative.parts) + 1)]
    if root.is_symlink() or any(part.is_symlink() for part in ancestors) or not path.is_file():
        raise ValueError('Missing or unsupported delivery file: ' + name)
    return path


def captured(root, name, expected=None):
    root = Path(root)
    raw = safe_file(root, name).read_bytes()
    actual = {'bytes': len(raw), 'sha256': sha(raw)}
    if expected is not None and actual != expected:
        raise ValueError('Release input bytes changed: ' + name)
    return {'root': root, 'name': name, 'raw': raw, 'pin': actual}


def record_path(path):
    path = Path(path)
    return captured(path.parent, path.name)


def verify_records(records):
    """Re-read every captured input immediately before committing owned output."""
    for record in records:
        captured(record['root'], record['name'], record['pin'])


def records_of(*values):
    return [record for value in values for record in getattr(value, 'records', [])]


def output_preflight(root, names):
    root = Path(root)
    if root.is_symlink() or (root.exists() and not root.is_dir()):
        raise ValueError('Unsupported delivery output directory')
    for name in names:
        relative = relative_name(name)
        parts = [root.joinpath(*relative.parts[:count]) for count in range(1, len(relative.parts) + 1)]
        if any(part.is_symlink() for part in parts):
            raise ValueError('A delivery destination is a symbolic link: ' + name)
        if any(part.exists() and not part.is_dir() for part in parts[:-1]):
            raise ValueError('A delivery parent is not a directory: ' + name)
        if parts[-1].exists() and not parts[-1].is_file():
            raise ValueError('A delivery destination is not a regular file: ' + name)


def atomic_write(root, name, raw):
    """Replace an owned regular payload, never following an output symlink."""
    root = Path(root)
    relative = relative_name(name)
    output_preflight(root, [name])
    root.mkdir(parents=True, exist_ok=True)
    directory = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    temporary = '.revisawiki-' + uuid.uuid4().hex
    created = False
    try:
        for part in relative.parts[:-1]:
            try:
                os.mkdir(part, dir_fd=directory)
            except FileExistsError:
                pass
            next_directory = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=directory)
            os.close(directory)
            directory = next_directory
        def check_destination():
            try:
                status = os.stat(relative.name, dir_fd=directory, follow_symlinks=False)
            except FileNotFoundError:
                return
            if not stat.S_ISREG(status.st_mode):
                raise ValueError('A delivery destination is not a regular file: ' + name)
        check_destination()
        descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o644, dir_fd=directory)
        created = True
        with os.fdopen(descriptor, 'wb') as output:
            output.write(raw)
            output.flush()
            os.fsync(output.fileno())
        check_destination()
        os.replace(temporary, relative.name, src_dir_fd=directory, dst_dir_fd=directory)
        os.fsync(directory)
    finally:
        if created:
            try:
                os.unlink(temporary, dir_fd=directory)
            except FileNotFoundError:
                pass
        os.close(directory)


def commit_payloads(root, payloads, records):
    output_preflight(root, payloads)
    verify_records(records)
    for name, raw in payloads.items():
        atomic_write(root, name, raw)


def read_json(path):
    if path.is_symlink() or not path.is_file():
        raise ValueError('A required release record is missing')
    return json.loads(path.read_text(encoding='utf-8'))


def checked_manifest(path=None):
    path = path or ROOT / 'tests/expected_release_v2210.json'
    manifest_record = record_path(path)
    manifest = json.loads(manifest_record['raw'])
    records = [manifest_record]
    if manifest.get('version') != VERSION or not isinstance(manifest.get('files'), dict):
        raise ValueError('The runtime manifest has a different release version')
    for name, expected in manifest['files'].items():
        records.append(captured(DIST, name, expected))
    if not isinstance(manifest.get('sourceInputs'), dict) or set(manifest['sourceInputs']) != SOURCE_INPUTS:
        raise ValueError('The runtime manifest must bind exactly the eleven build inputs')
    for name, expected in manifest['sourceInputs'].items():
        records.append(captured(ROOT, name, expected))
    if set(manifest['files']) != RUNTIME_FILES:
        raise ValueError('The runtime manifest must name exactly the seven release files')
    for name in RUNTIME_FILES - {f'RevisaWiki_{STEM}_completo.js'}:
        if name not in manifest['files'] or manifest['files'][name]['bytes'] >= WIKI_PAGE_LIMIT:
            raise ValueError('An installable part reaches the wiki page-size limit')
    previous_record = captured(ROOT, 'tests/expected_release_v2200.json')
    records.append(previous_record)
    previous = json.loads(previous_record['raw'])
    for name in FIXED_CALLS:
        if manifest['files'].get(name) != previous['files'].get(name):
            raise ValueError('An existing fixed common.js call has changed: ' + name)
    return ReleaseRecord(manifest, records)


def checked_qa(manifest, path=None):
    path = path or ROOT / 'tests/evidence/2.21.0/QA_SUMMARY.json'
    qa_record = record_path(path)
    qa = json.loads(qa_record['raw'])
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
    if isinstance(manifest, ReleaseRecord):
        manifest_record = manifest.records[0]
        base_record = manifest.records[-1]
    else:
        manifest_record = captured(ROOT, 'tests/expected_release_v2210.json')
        base_record = captured(ROOT, 'tests/expected_release_v2200.json')
        if json.loads(manifest_record['raw']) != manifest:
            raise ValueError('The QA requires the exact frozen runtime manifest')
    if qa.get('runtimeManifestSha256') != manifest_record['pin']['sha256']:
        raise ValueError('The final QA is not bound to this runtime manifest')
    if qa.get('baseManifestSha256') != base_record['pin']['sha256']:
        raise ValueError('The final QA is not bound to the frozen baseline manifest')
    return ReleaseRecord(qa, [qa_record])


def checked_text(path):
    return checked_text_bytes(path.read_bytes(), path.name)


def checked_text_bytes(raw, name):
    text = raw.decode('utf-8')
    if re.search(r'\b[A-Z_]*PENDING\b|\bTODO\b|\bFIXME\b', text):
        raise ValueError('An unfinished delivery text was found: ' + name)
    return text


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
