"""Check each installable script through unsaved native pre-save processing."""
from pathlib import Path
import argparse
import json
import check_wiki_presave_v2217 as gate

ROOT=Path(__file__).resolve().parents[1]
VERSION='2.21.7'


def current_inputs(manifest_path):
    manifest_path=Path(manifest_path)
    raw=manifest_path.read_bytes()
    manifest=gate.strict_json(raw)
    if manifest.get('version')!=VERSION:
        raise gate.GateError('wrong-runtime-release')
    data=ROOT/'dist'/VERSION/gate.DATA_NAME
    gate.inspect_inputs(manifest_path,data)
    expected={name:pin for name,pin in manifest['files'].items() if not name.endswith('_completo.js')}
    if len(expected)!=6:
        raise gate.GateError('unexpected-installable-script-count')
    sources={}
    for name,pin in expected.items():
        if Path(name).name!=name:
            raise gate.GateError('invalid-script-path')
        source=(ROOT/'dist'/VERSION/name).read_bytes()
        gate._check_file_pin(source,pin)
        sources[name]=source
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
    return receipt


def check(manifest_path):
    manifest_raw,expected,sources=current_inputs(manifest_path)
    rows={}
    for name,source in sources.items():
        after=gate.request_presave(source)
        if after!=source and not (source.endswith(b'\n') and after==source[:-1]):
            raise gate.GateError('native-pre-save-changed-installable-script')
        rows[name]={'input':expected[name],'nativeOutput':{'bytes':len(after),'sha256':gate.sha(after)},'sourcePreservedExceptTerminalNewline':True}
    receipt={'kind':'native-installable-script-pre-save','version':VERSION,'status':'passed',
        'runtimeManifestSha256':gate.sha(manifest_raw),'gateScriptSha256':gate.sha(Path(__file__).read_bytes()),
        'endpoint':gate.ENDPOINT,'apiAction':'parse','onlypst':True,'authenticated':False,
        'scripts':rows,'wikipediaWrites':0}
    return validate_receipt(receipt,manifest_path)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--manifest',type=Path,default=ROOT/'tests/expected_release_v2217.json')
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
