"""Build the hotfix index using the unchanged installation-card layout."""
from pathlib import Path

path = Path(__file__).with_name('build_index_v2190.py')
source = path.read_text().replace('2.19.0', '2.19.1').replace('_v2_19_0', '_v2_19_1')
source = source.replace('expected_release_v2190', 'expected_release_v2191')
exec(compile(source, str(path), 'exec'))
