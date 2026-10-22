"""Deliver the inherited catalog snapshots with explicit runtime provenance."""
import argparse
import json
from pathlib import Path

from v220_delivery import ROOT, DIST, checked_manifest, pin, safe_file


def export_catalogs(output=DIST):
    manifest = checked_manifest()
    baseline = ROOT / 'dist/2.19.1'
    archive = json.loads(safe_file(baseline, 'ARQUIVOS.json').read_text())['files']
    previous = json.loads((ROOT / 'tests/expected_release_v2191.json').read_text())
    if manifest['packedCatalogSha256'] != previous['packedCatalogSha256']:
        raise ValueError('The inherited snapshots need a new catalog review')
    files = sorted(baseline.glob('Catalogo_*_v2_19_1.json'))
    if len(files) != 8:
        raise ValueError('The baseline must supply the eight reviewed snapshots')
    output = output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    records = {}
    for source in files:
        original = pin(source)
        if original != {key: archive[source.name][key] for key in ('bytes', 'sha256')}:
            raise ValueError('An inherited catalog differs from its public archive')
        catalog = json.loads(source.read_text(encoding='utf-8'))
        # Keep research dates, native revisions, rules and historical scope.
        # The fragments in src/v2_20 add contextual rules, not a new snapshot.
        catalog['releaseVersion'] = catalog['distributionVersion'] = '2.20.0'
        catalog['deliveryProvenance'] = {
            'kind': 'inherited-reviewed-snapshot',
            'sourceFile': source.name,
            **original,
            'packedCatalogSha256': manifest['packedCatalogSha256'],
            'runtimeCoreSha256': manifest['files']['RevisaWiki_v2_20_0.js']['sha256'],
            'contextualRulesDirectory': 'src/v2_20',
            'nativeRevisionsRequeriedByThisExport': False,
        }
        destination = output / source.name.replace('_v2_19_1', '_v2_20_0')
        if destination.is_symlink():
            raise ValueError('A catalog destination must not be a symlink')
        destination.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        records[destination.name] = pin(destination)
    return records


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DIST)
    args = parser.parse_args()
    print(json.dumps(export_catalogs(args.output), indent=2))
