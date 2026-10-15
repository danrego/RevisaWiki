"""Reuse the reviewed copy-index layout for the separately pinned 2.6.1 files."""
from pathlib import Path

source = Path(__file__).with_name('build_index.py').read_text()
source = source.replace('2.6.0', '2.6.1').replace('_v2_6', '_v2_6_1')
source = source.replace('tests/expected_release.json', 'tests/expected_release_v261.json')
exec(compile(source, str(Path(__file__).with_name('build_index.py')), 'exec'))
