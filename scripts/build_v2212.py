"""Build the source-bound 2.21.2 runtime without rewriting historical releases."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess

from wiki_safe_data import protect_data_module
from check_wiki_presave_v2212 import canonical

if not __debug__:
    raise RuntimeError('Optimized Python disables required build checks')

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'dist/2.21.1-installation.1'
SOURCE=ROOT/'src/v2_21_2'
HELPERS=['structure.js','citations.js','portals.js','opaque_citation_alias.js','integration.js']
EXPORTS=['v2212StructurePlan','v2212StructureProof','v2212StructurePrerequisitePlan','v2212StructurePrerequisiteProof',
         'v2212StructureFileRequests','v2212CitationPlan','v2212CitationProof','v2212CitationLanguageMoveCertificate',
         'v2212PortalPlan','v2212PortalProof','v2212PortalCandidates','v2212PortalDestinations','v2212PortalScope','v2212PortalFooterRole','v2212OpaqueCiteWebHeader']


def sha(raw):return hashlib.sha256(raw).hexdigest()


def run(node,code,*args):
    return subprocess.run([node,'-e',code,*map(str,args)],cwd=ROOT,check=True,capture_output=True,text=True)


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--node',default=os.environ.get('REVISAWIKI_NODE')or shutil.which('node'))
    args=ap.parse_args();assert args.node
    out=ROOT/'dist/2.21.2';out.mkdir(exist_ok=True,parents=True)
    work=ROOT/'artifacts/v2212/build';work.mkdir(exist_ok=True,parents=True)
    pin=ROOT/'tests/expected_release_v2211_installation1.json'
    spec=json.loads((SOURCE/'contract.json').read_text())
    assert sha(pin.read_bytes())==spec['baselineManifestSha256']
    baseline=json.loads(pin.read_text())
    base={}
    for name,record in baseline['files'].items():
        raw=(BASE/name).read_bytes();assert {'bytes':len(raw),'sha256':sha(raw)}==record
        base[name]=raw
    source_names=[str((SOURCE/n).relative_to(ROOT))for n in HELPERS+['header.txt','contract.json','preflights.js']]
    source_names+=['scripts/build_v2212.py','scripts/v2212_ui.cjs','scripts/v2212_compact.cjs','scripts/v2212_literals.cjs','scripts/wiki_safe_data.py']
    inputs={name:(ROOT/name).read_bytes()for name in source_names}
    helper='\n'.join(inputs['src/v2_21_2/'+name].decode()for name in HELPERS)
    helper_raw=work/'helper-source.js';helper_raw.write_text(helper)
    helper_out=work/'helper-runtime.js';maps_file=work/'support2212.json';maps_receipt=work/'LITERAL_MAPS.json'
    subprocess.run([args.node,str(ROOT/'scripts/v2212_literals.cjs'),str(helper_raw),str(helper_out),str(maps_file),str(maps_receipt)],cwd=ROOT,check=True)
    helper=helper_out.read_text();extension=json.loads(maps_file.read_text())
    data_text=base['RevisaWiki_v2_21_1_dados.js'].decode()
    start=data_text.index('const data=')+len('const data=');end=data_text.index(';if(typeof module',start)
    original_data=json.loads(data_text[start:end]);data=json.loads(json.dumps(original_data))
    data['version']='2.21.2';assert 'support2212' not in data['packed'];data['packed']['support2212']=extension
    packed_hash=sha(canonical(data['packed']).encode())
    literal_json=json.dumps(data,ensure_ascii=False,separators=(',',':'))
    data_text=protect_data_module(data_text[:start].replace('2.21.1','2.21.2')+literal_json+data_text[end:])
    core=base['RevisaWiki_v2_21_1.js'].decode().replace(baseline['packedCatalogSha256'],packed_hash)
    core,n=re.subn(r'function\s+v221RepairPlan\(', 'function v2212BaselineRepairPlan(',core)
    assert n==1
    core,n=re.subn(r'function\s+v219CitationLanguageRetention\(', 'function v2212BaselineCitationLanguageRetention(',core)
    assert n==1
    helper+="\nfunction v219CitationLanguageRetention(before,after,options={}) {const retained=v2212BaselineCitationLanguageRetention(before,after,options);if(retained.accepted)return retained;const certificate=v2212CitationLanguageMoveCertificate(before,after,options);return certificate?{accepted:true,reason:'',certificate}:retained;}\n"
    identity="JSON.stringify(['opaque-raw-reference-body',canonical])"
    assert core.count(identity)==1
    core=core.replace(identity,"JSON.stringify(['opaque-raw-reference-body',markupAllowed?v2212OpaqueCiteWebHeader(canonical):canonical])",1)
    anchor=re.search(r'function\s*\*\s*calculationSteps\(',core);assert anchor
    core=core[:anchor.start()]+helper+'\n'+core[anchor.start():]
    assert core.count('const api={')==1
    core=core.replace('const api={','const api={'+','.join(EXPORTS)+',',1)
    core=core.replace('2.21.1','2.21.2').replace('_v2_21_1','_v2_21_2')
    entry='function*calculationSteps(job){const cfg=job.options||{},'
    assert core.count(entry)==1
    core=core.replace(entry,"function*calculationSteps(job){if(job.kind==='adjust'&&job.options?.v2212OriginalDraftHash!==undefined&&job.options.v2212OriginalDraftHash!==v24SyntaxHash(job.source))throw new Error('A confirmação não pertence a este rascunho. Nenhum ajuste foi aplicado.');const cfg=job.options||{},",1)
    header_start=core.index('/*\n * RevisaWiki para a ptwiki')
    header_end=core.index('*/',header_start)+2
    core=core[:header_start]+inputs['src/v2_21_2/header.txt'].decode().rstrip()+core[header_end:]
    raw_core=work/'with-helpers.js';raw_core.write_text(core)
    ui_core=work/'with-ui.js';ui_receipt=work/'UI_TRANSFORM.json'
    ui_code="const fs=require('node:fs'),m=require('./scripts/v2212_ui.cjs');const r=m.transform(fs.readFileSync(process.argv[1],'utf8'));fs.writeFileSync(process.argv[2],r.code);fs.writeFileSync(process.argv[3],JSON.stringify(r.proof,null,2)+'\\n');"
    run(args.node,ui_code,raw_core,ui_core,ui_receipt)
    core_file=out/'RevisaWiki_v2_21_2.js'
    subprocess.run([args.node,str(ROOT/'scripts/v2212_compact.cjs'),str(ui_core),str(core_file),str(work/'CORE_FORMAT.json')],cwd=ROOT,check=True)
    data_file=out/'RevisaWiki_v2_21_2_dados.js';data_file.write_text(data_text)
    start=data_text.index('const data=')+len('const data=');end=data_text.index(';if(typeof module',start)
    packed_literal=data_text[start:end]
    assert {k:v for k,v in data['packed'].items() if k!='support2212'}==original_data['packed']
    (ROOT/'tests/expected_v2212_literals.json').write_bytes(maps_file.read_bytes())
    # Both distributions execute the same patched boot function. The complete
    # file embeds data for local tests and is never an installable wiki page.
    boot_file=work/'boot.js'
    boot_code="const fs=require('node:fs'),p=require('@babel/parser'),s=fs.readFileSync(process.argv[1],'utf8'),a=p.parse(s),r=[];function w(n){if(!n||typeof n!=='object')return;if(['FunctionExpression','FunctionDeclaration'].includes(n.type)&&n.id?.name==='RevisaWikiBoot')r.push(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(w);else if(v&&typeof v==='object')w(v);}}w(a);if(r.length!==1)throw Error('Boot identity');fs.writeFileSync(process.argv[2],s.slice(r[0].start,r[0].end));"
    run(args.node,boot_code,ui_core,boot_file)
    complete=inputs['src/v2_21_2/header.txt'].decode()+"\n(function(root){'use strict';root.RevisaWikiDataV2="+packed_literal+';\n('+boot_file.read_text()+")(root);\n}(typeof window==='undefined'?globalThis:window));\n"
    (out/'RevisaWiki_v2_21_2_completo.js').write_text(complete)
    files={}
    for name,raw in base.items():
        target=name.replace('_v2_21_1','_v2_21_2')
        if target not in ['RevisaWiki_v2_21_2.js','RevisaWiki_v2_21_2_dados.js','RevisaWiki_v2_21_2_completo.js']:
            value=raw.decode().replace('2.21.1','2.21.2').replace('_v2_21_1','_v2_21_2').replace(baseline['packedCatalogSha256'],packed_hash).encode()
            if name.startswith('Chamada_fixa'):assert value==raw
            (out/target).write_bytes(value)
        actual=(out/target).read_bytes()
        subprocess.run([args.node,'--check',str(out/target)],check=True,capture_output=True)
        files[target]={'bytes':len(actual),'sha256':sha(actual)}
        if not target.endswith('_completo.js'):assert len(actual)<2097152,(target,len(actual))
    smoke=run(args.node,"const a=require(process.argv[1]);if(a.version!=='2.21.2')throw Error('Version');const r=a.calculate({kind:'adjust',source:'Texto de controle.',options:{...a.defaults,namespaceNumber:0,autoPreview:false,registryDoiCheck:false}});const s=a.v219AutomaticResultSafety('Texto de controle.',r);if(r.text!=='Texto de controle.'||!s.accepted)throw Error('Control draft');console.log(JSON.stringify({version:a.version,gate:s.code}));",core_file)
    manifest={'version':'2.21.2','distributionRevision':'2.21.2','baseVersion':'2.21.1-installation.1',
              'baseManifestSha256':sha(pin.read_bytes()),'packedCatalogSha256':packed_hash,'basePackedCatalogSha256':baseline['packedCatalogSha256'],
              'addedSupport2212Sha256':sha(canonical(extension).encode()),'literalExtraction':json.loads(maps_receipt.read_text()),
              'baselinePackedCatalogByteValuesUnchanged':True,'files':files,
              'sourceInputs':{name:{'bytes':len(raw),'sha256':sha(raw)}for name,raw in inputs.items()},
              'uiRemoval':json.loads(ui_receipt.read_text()),'compactSourceProof':json.loads((work/'CORE_FORMAT.json').read_text()),
              'runtimeSmoke':json.loads(smoke.stdout),'standaloneMethod':'Exact same patched boot with embedded save-safe data',
              'limits':{'perInstallableFileBytesExclusive':2097152,'calculationDeadlineMilliseconds':60000,
                        'endMatterRootItemMinimum':8,'referenceMinimum':10}}
    encoded=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
    (ROOT/'tests/expected_release_v2212.json').write_bytes(encoded);(out/'MANIFESTO_RUNTIME.json').write_bytes(encoded)
    assert all((ROOT/name).read_bytes()==raw for name,raw in inputs.items()),'Build inputs changed during compilation'
    print(json.dumps({'version':'2.21.2','files':files,'runtimeManifestSha256':sha(encoded),'wikipediaWrites':0}))


if __name__=='__main__':main()
