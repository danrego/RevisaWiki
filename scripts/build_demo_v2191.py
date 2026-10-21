"""Package the existing examples with the exact hotfix engine."""
from pathlib import Path

path = Path(__file__).with_name('build_demo_v2190.py')
source = path.read_text().replace('2.19.0', '2.19.1').replace('_v2_19_0', '_v2_19_1')
anchor = '        shutil.copyfile(source, destination / source.name)'
assert source.count(anchor) == 1
source = source.replace(anchor, anchor + "\n        copied = destination / source.name\n        copied.write_text(copied.read_text().replace('2.19.0', '2.19.1').replace('_v2_19_0', '_v2_19_1'))")
exec(compile(source, str(path), 'exec'))
