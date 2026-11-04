"""Build verified automatic repairs and resumable results from 2.21.5."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import shutil
import subprocess

from check_wiki_presave_v2212 import canonical, decode_data_source
from wiki_safe_data import protect_data_module

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'dist/2.21.5'
SOURCE = ROOT / 'src/v2_21_6'
OUT = ROOT / 'dist/2.21.6'


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def reconstruct_previous(node, work):
    previous=json.loads((ROOT/'tests/expected_release_v2215.json').read_text())
    older=json.loads((ROOT/'tests/expected_release_v2214.json').read_text())
    original=(ROOT/'dist/2.21.4/RevisaWiki_v2_21_4.js').read_text()
    assert sha(original.encode())==older['files']['RevisaWiki_v2_21_4.js']['sha256']
    core=original.replace(older['packedCatalogSha256'],previous['packedCatalogSha256'])
    core=core.replace("'2.21.4'","'2.21.5'").replace('"2.21.4"','"2.21.5"')
    core=core.replace('RevisaWiki.catalogs.2.21.4','RevisaWiki.catalogs.2.21.5').replace('_v2_21_4','_v2_21_5')
    start=core.index('/*\n * RevisaWiki para a ptwiki');end=core.index('*/',start)+2
    core=core[:start]+(ROOT/'src/v2_21_5/header.txt').read_text().rstrip()+core[end:]
    source=work/'previous-base.js';source.write_text(core)
    helpers=work/'previous-helpers.js';helpers.write_text('\n'.join(p.read_text() for p in sorted((ROOT/'src/v2_21_5').glob('*.js'))))
    patched=work/'previous-patched.js';compact=work/'previous-compact.js'
    subprocess.run([node,str(ROOT/'scripts/v2215_patch.cjs'),str(source),str(helpers),str(patched),str(work/'PREVIOUS_PATCH.json')],cwd=ROOT,check=True)
    subprocess.run([node,str(ROOT/'scripts/v2215_compact.cjs'),str(patched),str(compact),str(work/'PREVIOUS_COMPACT.json')],cwd=ROOT,check=True)
    assert sha(compact.read_bytes())==previous['files']['RevisaWiki_v2_21_5.js']['sha256'], 'Reconstructed baseline differs'
    return patched.read_text()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = ap.parse_args()
    assert args.node and __debug__
    manifest_raw = (ROOT / 'tests/expected_release_v2215.json').read_bytes()
    assert sha(manifest_raw) == '58dfc891536a83e6e3e9869de558ff846104d4d6531a13f25026e7e9137bf2c3'
    baseline = json.loads(manifest_raw)
    base = {}
    for name, expected in baseline['files'].items():
        raw = (BASE / name).read_bytes()
        assert {'bytes': len(raw), 'sha256': sha(raw)} == expected
        base[name] = raw
    sources = sorted(SOURCE.glob('*.js'))
    assert sources, 'Explicit compatibility sources are required'
    paths = sources + [SOURCE / 'header.txt', ROOT/'package.json', ROOT/'package-lock.json']
    paths += sorted((ROOT/'src/v2_21_5').glob('*')) + [ROOT/'tests/expected_release_v2214.json',ROOT/'tests/expected_release_v2215.json',ROOT/'scripts/v2215_patch.cjs']
    paths += [ROOT / 'scripts' / name for name in ('build_v2216.py', 'v2216_patch.cjs', 'v2215_compact.cjs', 'wiki_safe_data.py')]
    inputs = {str(path.relative_to(ROOT)): path.read_bytes() for path in paths}
    original = decode_data_source(base['RevisaWiki_v2_21_5_dados.js'], version='2.21.5', prefix='/* RevisaWiki 2.21.5, dados. CC BY-SA 4.0. */\n(function(root){const data=')
    data = {**original, 'version': '2.21.6'}
    packed_hash = sha(canonical(data['packed']).encode())
    work = ROOT / 'artifacts/v2216/build'
    work.mkdir(exist_ok=True, parents=True)
    OUT.mkdir(exist_ok=True, parents=True)
    literal = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    old_data = base['RevisaWiki_v2_21_5_dados.js'].decode()
    start = old_data.index('const data=') + len('const data=')
    end = old_data.index(';if(typeof module', start)
    data_source = protect_data_module(old_data[:start].replace('2.21.5', '2.21.6') + literal + old_data[end:])
    data_file = OUT / 'RevisaWiki_v2_21_6_dados.js'
    data_file.write_text(data_source)
    core = reconstruct_previous(args.node, work)
    assert core.count(baseline['packedCatalogSha256']) == 1
    core = core.replace(baseline['packedCatalogSha256'], packed_hash)
    # Only runtime/package identities change. Historical repair family IDs stay.
    core = core.replace("'2.21.5'", "'2.21.6'").replace('"2.21.5"', '"2.21.6"')
    core = core.replace('RevisaWiki.catalogs.2.21.5', 'RevisaWiki.catalogs.2.21.6').replace('_v2_21_5', '_v2_21_6')
    header_start = core.index('/*\n * RevisaWiki para a ptwiki')
    header_end = core.index('*/', header_start) + 2
    header = inputs['src/v2_21_6/header.txt'].decode()
    core = core[:header_start] + header.rstrip() + core[header_end:]
    before = work / 'baseline-updated.js'
    before.write_text(core)
    helpers = work / 'compatibility-source.js'
    helpers.write_text('\n'.join(inputs[str(path.relative_to(ROOT))].decode() for path in sources))
    patched = work / 'patched.js'
    patch_receipt = work / 'PATCH.json'
    subprocess.run([args.node, str(ROOT / 'scripts/v2216_patch.cjs'), str(before), str(helpers), str(patched), str(patch_receipt)], cwd=ROOT, check=True)
    core_file = OUT / 'RevisaWiki_v2_21_6.js'
    format_receipt = work / 'FORMAT.json'
    subprocess.run([args.node, str(ROOT / 'scripts/v2215_compact.cjs'), str(patched), str(core_file), str(format_receipt)], cwd=ROOT, check=True)
    # The standalone runs the exact same boot with the same save-safe data.
    boot = work / 'boot.js'
    extract = "const f=require('node:fs'),p=require('@babel/parser'),s=f.readFileSync(process.argv[1],'utf8'),a=p.parse(s),r=[];function w(n){if(!n||typeof n!=='object')return;if(['FunctionExpression','FunctionDeclaration'].includes(n.type)&&n.id?.name==='RevisaWikiBoot')r.push(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(w);else if(v&&typeof v==='object')w(v);}}w(a);if(r.length!==1)throw Error('Boot identity');f.writeFileSync(process.argv[2],s.slice(r[0].start,r[0].end));"
    subprocess.run([args.node, '-e', extract, str(core_file), str(boot)], cwd=ROOT, check=True)
    a = data_source.index('const data=') + len('const data=')
    b = data_source.index(';if(typeof module', a)
    complete = header + "\n(function(root){'use strict';root.RevisaWikiDataV2=" + data_source[a:b] + ';\n(' + boot.read_text() + ")(root);\n}(typeof window==='undefined'?globalThis:window));\n"
    (OUT / 'RevisaWiki_v2_21_6_completo.js').write_text(complete)
    files = {}
    for name, raw in base.items():
        target = name.replace('_v2_21_5', '_v2_21_6')
        if target not in ('RevisaWiki_v2_21_6.js', 'RevisaWiki_v2_21_6_dados.js', 'RevisaWiki_v2_21_6_completo.js'):
            updated = raw.decode().replace('2.21.5', '2.21.6').replace('_v2_21_5', '_v2_21_6').replace(baseline['packedCatalogSha256'], packed_hash).encode()
            if name.startswith('Chamada_fixa'):
                assert updated == raw
            (OUT / target).write_bytes(updated)
        actual = (OUT / target).read_bytes()
        subprocess.run([args.node, '--check', str(OUT / target)], check=True, capture_output=True)
        files[target] = {'bytes': len(actual), 'sha256': sha(actual)}
        if not target.endswith('_completo.js'):
            assert len(actual) < 2097152, (target, len(actual))
    manifest = {'version': '2.21.6', 'distributionRevision': '2.21.6', 'baseVersion': '2.21.5', 'baseManifestSha256': sha(manifest_raw), 'basePackedCatalogSha256': baseline['packedCatalogSha256'], 'packedCatalogSha256': packed_hash, 'files': files, 'sourceInputs': {name: {'bytes': len(raw), 'sha256': sha(raw)} for name, raw in inputs.items()}, 'patch': json.loads(patch_receipt.read_text()), 'compactSourceProof': json.loads(format_receipt.read_text()), 'limits': {**baseline['limits'], 'calculationDeadlineMilliseconds': None, 'fixedAnalysisDeadline': False}, 'wikipediaWrites': 0}
    encoded = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    (ROOT / 'tests/expected_release_v2216.json').write_bytes(encoded)
    (OUT / 'MANIFESTO_RUNTIME.json').write_bytes(encoded)
    assert all((ROOT / name).read_bytes() == raw for name, raw in inputs.items())
    print(json.dumps({'version': '2.21.6', 'files': files, 'manifestSha256': sha(encoded), 'wikipediaWrites': 0}))


if __name__ == '__main__':
    main()
