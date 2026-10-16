"""Rebuild the complete 2.10.0 package in an isolated temporary tree."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    if not args.node:
        raise SystemExit('Set REVISAWIKI_NODE or pass --node.')
    checks = 0
    with tempfile.TemporaryDirectory(prefix='revisawiki-rebuild-') as directory:
        tree = Path(directory)

        def copy(relative):
            source, target = ROOT / relative, tree / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)

        for name in ['build_v2100.py', 'package_v2100.py', 'build_index_v2100.py', 'build_index.py']:
            copy('scripts/' + name)
        for name in ['expected_release_v290.json', 'expected_release_v2100.json']:
            copy('tests/' + name)
        baseline = json.loads((ROOT / 'tests/expected_release_v290.json').read_text())
        for name in baseline['files']:
            copy('dist/2.9.0/' + name)
        for path in (ROOT / 'dist/2.9.0').glob('Catalogo_*.json'):
            copy(path.relative_to(ROOT))
        for relative in ['src/v2_10', 'docs/2.10.0']:
            shutil.copytree(ROOT / relative, tree / relative, ignore=shutil.ignore_patterns('__pycache__'))
        copy('LICENSE')
        for command in [
            [sys.executable, 'scripts/build_v2100.py', '--node', args.node],
            [sys.executable, 'scripts/package_v2100.py'],
        ]:
            result = subprocess.run(command, cwd=tree, capture_output=True, text=True)
            assert result.returncode == 0, 'Isolated build step failed: ' + Path(command[1]).name
            checks += 1
        assert (tree / 'tests/expected_release_v2100.json').read_bytes() == (ROOT / 'tests/expected_release_v2100.json').read_bytes()
        checks += 1
        original = ROOT / 'dist/2.10.0'
        rebuilt = tree / 'dist/2.10.0'
        names = sorted(path.name for path in original.iterdir() if path.is_file())
        assert names == sorted(path.name for path in rebuilt.iterdir() if path.is_file())
        checks += 1
        files = {}
        for name in names:
            raw = (original / name).read_bytes()
            assert raw == (rebuilt / name).read_bytes(), 'Rebuild mismatch: ' + name
            checks += 1
            files[name] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
    report = {'version': '2.10.0', 'status': 'passed', 'files': files, 'checks': checks,
              'method': 'Fresh temporary tree containing only pinned baseline, source patches, documentation and build inputs. Every package byte compared, including ZIP and copy index.',
              'networkRequests': 0, 'wikipediaWrites': 0}
    destination = ROOT / 'artifacts/v2100/rebuild.json'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'version': '2.10.0', 'status': 'passed', 'files': len(files), 'checks': checks}))


if __name__ == '__main__':
    main()
