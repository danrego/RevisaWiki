"""Package the hotfix without changing the archived 2.19.0 release."""
from pathlib import Path

path = Path(__file__).with_name('package_v2190.py')
source = path.read_text().replace('2.19.0', '2.19.1').replace('_v2_19_0', '_v2_19_1')
source = source.replace('expected_release_v2190', 'expected_release_v2191')
source = source.replace('build_index_v2190.py', 'build_index_v2191.py')
exec(compile(source, str(path), 'exec'))
