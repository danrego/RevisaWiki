"""Rebuild in a disposable tree and compare exact release bytes, without writes to runtime files."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile

ROOT=Path(__file__).resolve().parents[2]
HELPERS=['infobox_order.js','field_syntax.js','image_alt.js','biography_lead.js','retained_count.js','safeguards.js']


def sha(data):
    return hashlib.sha256(data).hexdigest()


def run(node, output):
    raw=(ROOT/'tests/expected_release_v2151.json').read_bytes()
    manifest=json.loads(raw)
    baseline=json.loads((ROOT/'tests/expected_release_v2150.json').read_bytes())
    baseline_files=[ROOT/'dist/2.15.0'/name for name in baseline['files']]
    baseline_files += [ROOT/'dist/2.15.0/ARQUIVOS.json']
    baseline_files += sorted((ROOT/'dist/2.15.0').glob('Catalogo_*.json'))
    inputs=[ROOT/'scripts/build_v2151.py',ROOT/'tests/expected_release_v2150.json']+baseline_files+[ROOT/'src/v2_15_1'/name for name in HELPERS]
    current=[ROOT/'dist/2.15.1'/name for name in manifest['files']]
    current+=sorted((ROOT/'dist/2.15.1').glob('Catalogo_*.json'))
    snapshot={path:sha(path.read_bytes()) for path in set(inputs+current+[ROOT/'tests/expected_release_v2151.json'])}
    checks=0
    def expect(condition,label):
        nonlocal checks
        checks+=1
        if not condition:raise ValueError(label)
    result={'version':'2.15.1','kind':'independent-isolated-reproducible-build','runnerSha256':sha(Path(__file__).read_bytes()),
            'status':'running','isolation':'fresh temporary directory containing only required baseline, helper sources, build script and baseline manifest',
            'command':'python3 scripts/build_v2151.py --node <node-runtime>','runtimeFiles':[],'catalogs':[],'helperEmbedding':[],
            'inputFiles':[{'file':str(path.relative_to(ROOT)),'sha256':sha(path.read_bytes())} for path in inputs],
            'wikipediaWrites':0,'networkRequests':0,'currentRuntimeWrites':0}
    with tempfile.TemporaryDirectory(prefix='revisawiki-rebuild-') as directory:
        tree=Path(directory)
        for path in inputs:
            target=tree/path.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,target)
        (tree/'tests').mkdir(exist_ok=True)
        build=subprocess.run(['python3','scripts/build_v2151.py','--node',str(node)],cwd=tree,capture_output=True,check=False)
        expect(build.returncode==0,'Isolated build failed')
        result['builderStdoutSha256']=sha(build.stdout)
        expect(not build.stderr,'Isolated build produced unexpected error output')
        rebuilt_manifest=(tree/'tests/expected_release_v2151.json').read_bytes()
        expect(rebuilt_manifest==raw,'Rebuilt manifest differs from current release')
        result['manifestSha256']=sha(raw)
        for name,pin in manifest['files'].items():
            actual=(ROOT/'dist/2.15.1'/name).read_bytes();rebuilt=(tree/'dist/2.15.1'/name).read_bytes()
            expect(len(actual)==pin['bytes'],'Current byte count differs from manifest')
            expect(sha(actual)==pin['sha256'],'Current runtime hash differs from manifest')
            expect(rebuilt==actual,'Rebuilt runtime differs from current bytes')
            result['runtimeFiles'].append({'file':name,'bytes':len(rebuilt),'sha256':sha(rebuilt),'byteIdentical':True})
        catalogs=sorted((ROOT/'dist/2.15.1').glob('Catalogo_*.json'))
        expected_catalogs={path.name.replace('_v2_15_0','_v2_15_1') for path in (ROOT/'dist/2.15.0').glob('Catalogo_*.json')}
        expect({path.name for path in catalogs}==expected_catalogs and len(expected_catalogs)==8,'Catalog inventory differs from the eight baseline catalogs')
        for path in catalogs:
            rebuilt=(tree/'dist/2.15.1'/path.name).read_bytes();actual=path.read_bytes()
            expect(rebuilt==actual,'Rebuilt catalog differs from current catalog')
            result['catalogs'].append({'file':path.name,'bytes':len(rebuilt),'sha256':sha(rebuilt),'byteIdentical':True})
        for bundle in ['RevisaWiki_v2_15_1.js','RevisaWiki_v2_15_1_completo.js']:
            data=(tree/'dist/2.15.1'/bundle).read_bytes()
            for name in HELPERS:
                helper=(ROOT/'src/v2_15_1'/name).read_bytes();occurrences=data.count(helper)
                expect(occurrences==1,'A complete helper source is absent or repeated in the actual runtime')
                result['helperEmbedding'].append({'bundle':bundle,'source':'src/v2_15_1/'+name,'sha256':sha(helper),'occurrences':occurrences})
    result['temporaryDirectoryRemoved']=not Path(directory).exists()
    expect(result['temporaryDirectoryRemoved'],'Disposable build directory was not removed')
    for path,digest in snapshot.items():expect(sha(path.read_bytes())==digest,'Build input or current release changed during isolated verification')
    result.update(status='passed',checks=checks)
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'status':result['status'],'checks':checks,'runtimeFiles':len(result['runtimeFiles']),
                      'catalogs':len(result['catalogs']),'manifestSha256':result['manifestSha256']}))


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--node',required=True,type=Path)
    parser.add_argument('--output',type=Path,default=ROOT/'artifacts/v2151/rebuild.json')
    args=parser.parse_args();run(args.node,args.output)
