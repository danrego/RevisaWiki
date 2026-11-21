"""Check each installable script through unsaved native pre-save processing."""
from pathlib import Path
import argparse
import json
import os
import shutil
import subprocess
import check_wiki_presave_v2221 as gate

ROOT=Path(__file__).resolve().parents[1]
VERSION='2.22.1'


def current_inputs(manifest_path):
    manifest_path=Path(manifest_path)
    raw=manifest_path.read_bytes()
    manifest=gate.strict_json(raw)
    if manifest.get('version')!=VERSION:
        raise gate.GateError('wrong-runtime-release')
    runtime_dir=manifest_path.parent if (manifest_path.parent/gate.DATA_NAME).is_file() else ROOT/'dist'/VERSION
    data=runtime_dir/gate.DATA_NAME
    gate.inspect_inputs(manifest_path,data)
    expected={name:pin for name,pin in manifest['files'].items() if not name.endswith('_completo.js')}
    if not 8<=len(expected)<=72:
        raise gate.GateError('unexpected-installable-script-count')
    sources={}
    for name,pin in expected.items():
        if Path(name).is_absolute() or '..' in Path(name).parts or (len(Path(name).parts)>1 and (len(Path(name).parts)!=2 or Path(name).parts[0]!='Infocaixas' or not name.endswith('.json'))):
            raise gate.GateError('invalid-script-path')
        source=(runtime_dir/name).read_bytes()
        if len(source)>=2097152: raise gate.GateError('installable-page-too-large')
        gate._check_file_pin(source,pin)
        sources[name]=source
    node=os.environ.get('REVISAWIKI_NODE')or shutil.which('node')
    if not node:raise gate.GateError('node-required-for-static-catalogue-reader')
    catalog_name='RevisaWiki_v2_22_1_catalogo.js'
    decoded=subprocess.run([node,str(ROOT/'scripts/v2220_inspect_catalog.cjs'),str(runtime_dir/catalog_name)],capture_output=True,check=False)
    if decoded.returncode:raise gate.GateError('additional-catalogue-is-not-static-data')
    literal=gate.strict_json(decoded.stdout)
    originals={name:gate.strict_json((ROOT/'src/v2_22'/file).read_bytes())for name,file in [('inference','inference_data.json'),('syntax','syntax_data.json')]}
    originals['focusedInfoboxes']=gate.strict_json((ROOT/'src/v2_22_1/focused_infobox_data.json').read_bytes())
    expected_hash=gate.sha(gate.canonical(originals).encode('utf8'))
    if literal!={'version':VERSION,'sha256':expected_hash,'data':originals}or manifest.get('additionalCatalogSha256')!=expected_hash:raise gate.GateError('additional-catalogue-literal-mismatch')
    return raw,expected,sources


def validate_receipt(receipt,manifest_path):
    manifest_raw,expected,sources=current_inputs(manifest_path)
    if not isinstance(receipt,dict) or any(receipt.get(k)!=v for k,v in {
        'kind':'native-installable-script-pre-save', 'version':VERSION,
        'status':'passed', 'runtimeManifestSha256':gate.sha(manifest_raw),
        'gateScriptSha256':gate.sha(Path(__file__).read_bytes()),
        'endpoint':gate.ENDPOINT,'apiAction':'parse','onlypst':True,
        'authenticated':False,'wikipediaWrites':0,
    }.items()):
        raise gate.GateError('invalid-runtime-presave-receipt')
    rows=receipt.get('scripts')
    if not isinstance(rows,dict) or set(rows)!=set(expected):
        raise gate.GateError('incomplete-runtime-presave-receipt')
    for name,row in rows.items():
        source=sources[name]
        allowed=[{'bytes':len(source),'sha256':gate.sha(source)}]
        if source.endswith(b'\n'):
            allowed.append({'bytes':len(source)-1,'sha256':gate.sha(source[:-1])})
        if not isinstance(row,dict) or row.get('input')!=expected[name] or row.get('nativeOutput') not in allowed or row.get('sourcePreservedExceptTerminalNewline') is not True:
            raise gate.GateError('changed-runtime-presave-source')
        model='wikitext' if name.endswith('.json') else 'javascript'
        if row.get('contentModel')!=model:
            raise gate.GateError('wrong-native-script-content-model')
        if name.endswith('.json'):
            native=row.get('nativeJsonModel')
            if not isinstance(native,dict) or native.get('contentModel')!='json' or not isinstance(native.get('transformedSource'),str):
                raise gate.GateError('missing-native-json-content-roundtrip')
            transformed=native['transformedSource'].encode('utf8')
            if native.get('nativeOutput')!={'bytes':len(transformed),'sha256':gate.sha(transformed)} or gate.canonical(gate.strict_json(transformed))!=gate.canonical(gate.strict_json(source)):
                raise gate.GateError('changed-native-json-content')
            if native.get('canonicalDataPreserved') is not True:
                raise gate.GateError('unconfirmed-native-json-content')
    return receipt


def check(manifest_path):
    manifest_raw,expected,sources=current_inputs(manifest_path)
    rows={}
    for name,source in sources.items():
        model='wikitext' if name.endswith('.json') else 'javascript'
        after=gate.request_presave(source,content_model=model)
        if after!=source and not (source.endswith(b'\n') and after==source[:-1]):
            raise gate.GateError('native-pre-save-changed-installable-script')
        rows[name]={'input':expected[name],'contentModel':model,'nativeOutput':{'bytes':len(after),'sha256':gate.sha(after)},'sourcePreservedExceptTerminalNewline':True}
        if name.endswith('.json'):
            transformed=gate.request_presave(source,content_model='json')
            if gate.canonical(gate.strict_json(transformed))!=gate.canonical(gate.strict_json(source)):
                raise gate.GateError('native-json-presave-changed-contract-data')
            rows[name]['nativeJsonModel']={'contentModel':'json','transformedSource':transformed.decode('utf8'),'nativeOutput':{'bytes':len(transformed),'sha256':gate.sha(transformed)},'canonicalDataPreserved':True}
    receipt={'kind':'native-installable-script-pre-save','version':VERSION,'status':'passed',
        'runtimeManifestSha256':gate.sha(manifest_raw),'gateScriptSha256':gate.sha(Path(__file__).read_bytes()),
        'endpoint':gate.ENDPOINT,'apiAction':'parse','onlypst':True,'authenticated':False,
        'scripts':rows,'wikipediaWrites':0}
    return validate_receipt(receipt,manifest_path)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--manifest',type=Path,default=ROOT/'tests/expected_release_v2221.json')
    p.add_argument('--receipt',type=Path,required=True)
    p.add_argument('--check-receipt',action='store_true')
    args=p.parse_args()
    if args.check_receipt:
        receipt=validate_receipt(gate.strict_json(args.receipt.read_bytes()),args.manifest)
    else:
        if args.receipt.exists():
            raise gate.GateError('keep-the-previous-runtime-presave-receipt')
        receipt=check(args.manifest)
        args.receipt.parent.mkdir(parents=True,exist_ok=True)
        args.receipt.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'status':receipt['status'],'version':VERSION,'installableScripts':len(receipt['scripts']),'wikipediaWrites':0}))


if __name__=='__main__':main()
