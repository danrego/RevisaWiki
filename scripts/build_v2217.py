"""Reconstruct the frozen baseline and build the next explicit repair overlay."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import shutil
import subprocess
from build_v2216 import reconstruct_previous
from check_wiki_presave_v2212 import canonical, decode_data_source
from wiki_safe_data import protect_data_module

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'src/v2_21_7'
OUT=ROOT/'dist/2.21.7'

def sha(raw):return hashlib.sha256(raw).hexdigest()
def pin(raw):return {'bytes':len(raw),'sha256':sha(raw)}
def run(node,*args):return subprocess.run([node,*map(str,args)],cwd=ROOT,check=True)

def baseline_source(node,work,baseline):
    key_paths=[ROOT/'scripts'/n for n in ['build_v2216.py','v2215_patch.cjs','v2216_patch.cjs','v2215_compact.cjs']]
    key_paths+=sorted((ROOT/'src/v2_21_5').glob('*'))+sorted((ROOT/'src/v2_21_6').glob('*'))
    key_paths += [ROOT/'tests'/f'expected_release_v221{n}.json'for n in [4,5,6]]
    signature=sha(canonical({str(p.relative_to(ROOT)):pin(p.read_bytes())for p in key_paths}).encode())
    cached=work/'baseline-expanded.js';receipt=work/'BASELINE_CACHE.json'
    if cached.exists()and receipt.exists():
        r=json.loads(receipt.read_text())
        if r.get('inputsSignature')==signature and r.get('expandedSha256')==sha(cached.read_bytes()):
            return cached.read_text()
    source=reconstruct_previous(node,work)
    source=source.replace("'2.21.5'","'2.21.6'").replace('"2.21.5"','"2.21.6"')
    source=source.replace('RevisaWiki.catalogs.2.21.5','RevisaWiki.catalogs.2.21.6').replace('_v2_21_5','_v2_21_6')
    a=source.index('/*\n * RevisaWiki para a ptwiki');b=source.index('*/',a)+2
    source=source[:a]+(ROOT/'src/v2_21_6/header.txt').read_text().rstrip()+source[b:]
    raw=work/'baseline-before.js';raw.write_text(source)
    helpers=work/'baseline-helpers.js';helpers.write_text('\n'.join(p.read_text()for p in sorted((ROOT/'src/v2_21_6').glob('*.js'))))
    run(node,ROOT/'scripts/v2216_patch.cjs',raw,helpers,cached,work/'BASELINE_PATCH.json')
    compact=work/'baseline-compact.js'
    run(node,ROOT/'scripts/v2215_compact.cjs',cached,compact,work/'BASELINE_COMPACT.json')
    assert pin(compact.read_bytes())==baseline['files']['RevisaWiki_v2_21_6.js'],'Reconstructed baseline must be byte-exact'
    receipt.write_text(json.dumps({'inputsSignature':signature,'expandedSha256':sha(cached.read_bytes()),'baselineCompact':pin(compact.read_bytes())},indent=2)+'\n')
    return cached.read_text()

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--node',default=os.environ.get('REVISAWIKI_NODE')or shutil.which('node'));args=ap.parse_args();assert args.node and __debug__
    manifest_file=ROOT/'tests/expected_release_v2216.json';manifest_raw=manifest_file.read_bytes();baseline=json.loads(manifest_raw)
    assert baseline['version']=='2.21.6'
    base={}
    for name,expected in baseline['files'].items():
        raw=(ROOT/'dist/2.21.6'/name).read_bytes();assert pin(raw)==expected;base[name]=raw
    paths=sorted(SOURCE.glob('*.js'))+[SOURCE/'header.txt',ROOT/'scripts/build_v2217.py',ROOT/'scripts/v2217_patch.cjs',ROOT/'scripts/wiki_safe_data.py',ROOT/'scripts/check_wiki_presave_v2217.py',ROOT/'scripts/build_v2216.py',ROOT/'scripts/v2216_patch.cjs',ROOT/'scripts/v2215_compact.cjs',manifest_file,ROOT/'package.json',ROOT/'package-lock.json']
    inputs={str(p.relative_to(ROOT)):p.read_bytes()for p in paths}
    work=ROOT/'artifacts/v2217/build';work.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
    source=baseline_source(args.node,work,baseline)
    original=decode_data_source(base['RevisaWiki_v2_21_6_dados.js'],version='2.21.6',prefix='/* RevisaWiki 2.21.6, dados. CC BY-SA 4.0. */\n(function(root){const data=')
    data={**original,'version':'2.21.7'};packed_hash=sha(canonical(data['packed']).encode());assert packed_hash==baseline['packedCatalogSha256']
    old_data=base['RevisaWiki_v2_21_6_dados.js'].decode();a=old_data.index('const data=')+len('const data=');b=old_data.index(';if(typeof module',a)
    data_source=protect_data_module(old_data[:a].replace('2.21.6','2.21.7')+json.dumps(data,ensure_ascii=False,separators=(',',':'))+old_data[b:])
    (OUT/'RevisaWiki_v2_21_7_dados.js').write_text(data_source)
    source=source.replace("'2.21.6'","'2.21.7'").replace('"2.21.6"','"2.21.7"')
    source=source.replace('RevisaWiki.catalogs.2.21.6','RevisaWiki.catalogs.2.21.7').replace('_v2_21_6','_v2_21_7')
    a=source.index('/*\n * RevisaWiki para a ptwiki');b=source.index('*/',a)+2;header=inputs['src/v2_21_7/header.txt'].decode();source=source[:a]+header.rstrip()+source[b:]
    before=work/'baseline-updated.js';before.write_text(source)
    helpers=work/'overlay-helpers.js';helpers.write_text('\n'.join(inputs[str(p.relative_to(ROOT))].decode()for p in sorted(SOURCE.glob('*.js'))if str(p.relative_to(ROOT))in inputs))
    patched=work/'patched.js';run(args.node,ROOT/'scripts/v2217_patch.cjs',before,helpers,patched,work/'PATCH.json')
    core=OUT/'RevisaWiki_v2_21_7.js';run(args.node,ROOT/'scripts/v2215_compact.cjs',patched,core,work/'COMPACT.json')
    boot=work/'boot.js'
    extract="const f=require('node:fs'),p=require('@babel/parser'),s=f.readFileSync(process.argv[1],'utf8'),a=p.parse(s),r=[];function w(n){if(!n||typeof n!=='object')return;if(['FunctionExpression','FunctionDeclaration'].includes(n.type)&&n.id?.name==='RevisaWikiBoot')r.push(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(w);else if(v&&typeof v==='object')w(v);}}w(a);if(r.length!==1)throw Error('Boot identity');f.writeFileSync(process.argv[2],s.slice(r[0].start,r[0].end));"
    run(args.node,'-e',extract,core,boot)
    a=data_source.index('const data=')+len('const data=');b=data_source.index(';if(typeof module',a)
    (OUT/'RevisaWiki_v2_21_7_completo.js').write_text(header+"\n(function(root){'use strict';root.RevisaWikiDataV2="+data_source[a:b]+';\n('+boot.read_text()+")(root);\n}(typeof window==='undefined'?globalThis:window));\n")
    files={}
    for name,raw in base.items():
        target=name.replace('_v2_21_6','_v2_21_7')
        if target not in ['RevisaWiki_v2_21_7.js','RevisaWiki_v2_21_7_dados.js','RevisaWiki_v2_21_7_completo.js']:
            updated=raw.decode().replace('2.21.6','2.21.7').replace('_v2_21_6','_v2_21_7').encode()
            if name.startswith('Chamada_fixa'):assert updated==raw
            (OUT/target).write_bytes(updated)
        raw=(OUT/target).read_bytes();run(args.node,'--check',OUT/target);files[target]=pin(raw)
        if not target.endswith('_completo.js'):assert len(raw)<2097152
    result={'version':'2.21.7','distributionRevision':'2.21.7','baseVersion':'2.21.6','baseManifestSha256':sha(manifest_raw),'basePackedCatalogSha256':baseline['packedCatalogSha256'],'packedCatalogSha256':packed_hash,'files':files,'sourceInputs':{name:pin(raw)for name,raw in inputs.items()},'patch':json.loads((work/'PATCH.json').read_text()),'compactSourceProof':json.loads((work/'COMPACT.json').read_text()),'limits':{**baseline['limits'],'calculationDeadlineMilliseconds':None,'fixedAnalysisDeadline':False},'wikipediaWrites':0}
    encoded=(json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode();(ROOT/'tests/expected_release_v2217.json').write_bytes(encoded);(OUT/'MANIFESTO_RUNTIME.json').write_bytes(encoded)
    assert all((ROOT/name).read_bytes()==raw for name,raw in inputs.items()),'An input changed during the build; repeat from current inputs'
    print(json.dumps({'version':'2.21.7','files':files,'manifestSha256':sha(encoded),'wikipediaWrites':0}))

if __name__=='__main__':main()
