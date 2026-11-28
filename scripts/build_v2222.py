"""Rebuild from exact released inputs and write a separate release candidate."""
from pathlib import Path
import argparse, hashlib, json, os, shutil, subprocess, sys
from build_v2221 import shard_catalog
from check_wiki_presave_v2212 import canonical
from wiki_safe_data import protect_data_module, protect_json_source

ROOT=Path(__file__).resolve().parents[1]
VERSION='2.22.2'
STEM='v2_22_2'
BASE='2.22.1'

def sha(raw): return hashlib.sha256(raw).hexdigest()
def pin(raw): return {'bytes':len(raw),'sha256':sha(raw)}
def run(node,*args): subprocess.run([node,*map(str,args)],cwd=ROOT,check=True)
def once(source,old,new):
 if source.count(old)!=1: raise ValueError('Missing or repeated build anchor: '+old[:90])
 return source.replace(old,new,1)
def json_write(path,value): path.write_text(protect_json_source(json.dumps(value,ensure_ascii=False,separators=(',',':')))+'\n')
def require_baseline(node,explicit):
 manifest_path=ROOT/'tests/expected_release_v2221.json';manifest=json.loads(manifest_path.read_bytes())
 directory=(explicit or ROOT/'artifacts/v2222/baseline-2.22.1').resolve()
 if not directory.exists():
  subprocess.run([sys.executable,str(ROOT/'scripts/build_v2221.py'),'--node',node,'--out',str(directory)],cwd=ROOT,check=True)
 for name,expected in manifest['files'].items():
  if pin((ROOT/'dist'/BASE/name).read_bytes())!=expected or pin((directory/name).read_bytes())!=expected:
   raise ValueError('Released baseline bytes differ: '+name)
 source=(directory/'build/integrated.js').read_bytes();helpers=(directory/'build/helpers.js').read_bytes()
 if sha(source)!=manifest['factory']['baselineSha256'] or sha(helpers)!=manifest['factory']['helperSha256']:
  raise ValueError('Expanded released source is not pinned')
 return directory,manifest,source,helpers

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--node',default=os.environ.get('REVISAWIKI_NODE')or shutil.which('node'))
 parser.add_argument('--base-candidate',type=Path)
 parser.add_argument('--catalog',type=Path)
 parser.add_argument('--out',type=Path,default=ROOT/'artifacts/v2222/candidate-001')
 args=parser.parse_args();node=args.node;out=args.out.resolve()
 if not node or not __debug__: raise ValueError('Runtime and enabled assertions required')
 if out.exists() or ROOT/'dist' in out.parents: raise ValueError('Use a new candidate directory outside historical distributions')
 base,baseline,source_raw,helpers_raw=require_baseline(node,args.base_candidate)
 catalog_path=args.catalog or ROOT/'src/v2_22_2/infobox_registry_data.json'
 if not catalog_path.exists(): catalog_path=ROOT/'src/v2_22_1/infobox_registry_data.json'
 source_files=sorted((ROOT/'src/v2_22_2').glob('*'))
 input_paths=[p for p in source_files if p.suffix in {'.js','.json'}]+sorted((ROOT/'src/v2_22_2_ui').glob('*.js'))+sorted((ROOT/'scripts').glob('v2222_*.cjs'))+[Path(__file__),ROOT/'scripts/v2220_factory.cjs',ROOT/'scripts/v2215_compact.cjs',ROOT/'scripts/wiki_safe_data.py',ROOT/'src/v2_22/bootstrap.txt',ROOT/'src/v2_22/complete_bootstrap.txt',ROOT/'package.json',ROOT/'package-lock.json',catalog_path]
 inputs={str(p.relative_to(ROOT)):p.read_bytes()for p in input_paths}
 out.mkdir(parents=True);work=out/'build';work.mkdir();shards=out/'Infocaixas';shards.mkdir()
 catalog=json.loads(catalog_path.read_bytes())
 title_map=json.loads(subprocess.check_output([node,str(ROOT/'scripts/v2221_catalog_index.cjs'),str(catalog_path)],cwd=ROOT))
 index=shard_catalog(catalog,shards,title_map)
 source=source_raw.decode().replace("'2.22.1'","'2.22.2'").replace('"2.22.1"','"2.22.2"').replace('RevisaWiki.catalogs.2.22.1','RevisaWiki.catalogs.2.22.2').replace('_v2_22_1','_v2_22_2')
 helpers=helpers_raw.decode()+'\n'+'\n'.join(p.read_text()for p in source_files if p.suffix=='.js')
 (work/'before.js').write_text(source);(work/'helpers-before.js').write_text(helpers)
 run(node,ROOT/'scripts/v2222_release_integration.cjs',work/'before.js',work/'helpers-before.js',work/'integrated.js',work/'helpers.js',work/'INTEGRATION.json')
 run(node,ROOT/'scripts/v2220_factory.cjs',work/'integrated.js',work/'helpers.js',work/'patched.js',work/'factory.js',work/'FACTORY.json')
 old_data=(base/'RevisaWiki_v2_22_1_dados.js').read_text();at=old_data.index('const data=')+len('const data=');value,end=json.JSONDecoder().raw_decode(old_data,at);value['version']=VERSION
 data=protect_data_module(old_data[:at].replace(BASE,VERSION)+json.dumps(value,ensure_ascii=False,separators=(',',':'))+old_data[end:]);(out/f'RevisaWiki_{STEM}_dados.js').write_text(data)
 additional=json.loads(subprocess.check_output([node,'-e','process.stdout.write(JSON.stringify(require(process.argv[1]).data))',str(base/'RevisaWiki_v2_22_1_catalogo.js')],cwd=ROOT))
 extra={}
 for p in source_files:
  if p.suffix!='.json' or p.name=='infobox_registry_data.json':continue
  key={'infobox_data':'infoboxes','prose_data':'prose','layout_data':'layout','talk_data':'talk'}.get(p.stem,p.stem)
  extra[key]=json.loads(p.read_bytes())
 # New finite contracts travel inside the already hashed rule factory. The
 # existing catalogue remains below the native page-size limit without a
 # new installation page or a change to the fixed common.js call.
 factory_path=work/'factory.js';factory_before=factory_path.read_text()
 embedded=json.dumps(json.dumps(extra,ensure_ascii=False,separators=(',',':')),ensure_ascii=False)
 factory_after=once(factory_before,'const V222_CATALOG=deps.V222_CATALOG;','const V222_CATALOG={...deps.V222_CATALOG,v2222:JSON.parse('+embedded+')};')
 factory_path.write_text(factory_after)
 factory_receipt=json.loads((work/'FACTORY.json').read_text())
 factory_receipt.update(factoryOriginalSha256=sha(factory_before.encode()),factorySha256=sha(factory_after.encode()),moduleCatalogSha256=sha(canonical(extra).encode()),moduleCatalogPlacement='hashed-rule-factory')
 (work/'FACTORY.json').write_text(json.dumps(factory_receipt,ensure_ascii=False,indent=2)+'\n')
 additional_hash=sha(canonical(additional).encode())
 value={'version':VERSION,'sha256':additional_hash,'data':additional}
 (work/'catalog.js').write_text('/* RevisaWiki, catálogo adicional. CC BY-SA 4.0. */\n(function(root){const data='+json.dumps(value,ensure_ascii=False,separators=(',',':'))+';root.RevisaWikiCatalogV222=data;if(typeof module===\'object\'&&module.exports)module.exports=data;})(typeof window===\'undefined\'?globalThis:window);\n')
 run(node,ROOT/'scripts/v2215_compact.cjs',work/'catalog.js',out/f'RevisaWiki_{STEM}_catalogo.js',work/'CATALOG_COMPACT.json')
 rules='/* RevisaWiki, regras e índice de infocaixas. CC BY-SA 4.0. */\n(function(root){const rules={version:'+json.dumps(VERSION)+',catalogSha256:'+json.dumps(additional_hash)+',infoboxManifest:'+json.dumps(index,ensure_ascii=False,separators=(',',':'))+',factory:'+(work/'factory.js').read_text()+'};root.RevisaWikiRulesV222=rules;if(typeof module===\'object\'&&module.exports)module.exports=rules;})(typeof window===\'undefined\'?globalThis:window);\n'
 (work/'rules.js').write_text(rules);rules_path=out/f'RevisaWiki_{STEM}_regras.js'
 run(node,ROOT/'scripts/v2215_compact.cjs',work/'rules.js',rules_path,work/'RULES_COMPACT.json')
 extract=ROOT/'scripts/v2221_extract_build.cjs';rules_hash=subprocess.check_output([node,str(extract),'factory-sha256',str(rules_path)],cwd=ROOT).decode().strip()
 boot=(ROOT/'src/v2_22/bootstrap.txt').read_text().replace('@@VERSION@@',VERSION).replace('@@STEM@@',STEM).replace('@@CATALOG_HASH@@',additional_hash).replace('@@RULES_HASH@@',rules_hash)
 validation="if(!root.RevisaWikiRulesV222.infoboxManifest||root.RevisaWikiRulesV222.infoboxManifest.sha256!=="+json.dumps(index['sha256'])+")throw new Error('Índice de infocaixas incompatível');"
 boot=once(boot,'start();return;',validation+"if(crypto.createHash('sha256').update(canonical(root.RevisaWikiRulesV222.infoboxManifest.data)).digest('hex')!=="+json.dumps(index['sha256'])+")throw new Error('Índice de infocaixas alterado');start();return;")
 boot=once(boot,'start();}).catch(',validation+"const indexDigest=await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(root.RevisaWikiRulesV222.infoboxManifest.data)));if(Array.from(new Uint8Array(indexDigest),byte=>byte.toString(16).padStart(2,'0')).join('')!=="+json.dumps(index['sha256'])+")throw new Error('Índice de infocaixas alterado');start();}).catch(")
 (work/'core-before.js').write_text(boot.replace('@@CORE@@',(work/'patched.js').read_text()));core=out/f'RevisaWiki_{STEM}.js'
 run(node,ROOT/'scripts/v2215_compact.cjs',work/'core-before.js',core,work/'CORE_COMPACT.json')
 complete=(ROOT/'src/v2_22/complete_bootstrap.txt').read_text().replace('@@PACKED_HASH@@',baseline['packedCatalogSha256']).replace('@@CATALOG_HASH@@',additional_hash).replace('@@RULES_HASH@@',rules_hash)
 complete=once(complete,'const inputs=[[canonical(root.RevisaWikiDataV2.packed),expectedData]',"if(!root.RevisaWikiRulesV222.infoboxManifest||root.RevisaWikiRulesV222.infoboxManifest.sha256!=="+json.dumps(index['sha256'])+")throw new Error('Índice de infocaixas incompatível');const inputs=[[canonical(root.RevisaWikiRulesV222.infoboxManifest.data),"+json.dumps(index['sha256'])+"],[canonical(root.RevisaWikiDataV2.packed),expectedData]")
 complete=complete.replace('@@BOOT@@',subprocess.check_output([node,str(extract),'boot',str(core)],cwd=ROOT).decode())
 at=data.index('const data=')+len('const data=');end=data.index(';if(typeof module',at)
 (out/f'RevisaWiki_{STEM}_completo.js').write_text('/* RevisaWiki 2.22.2, versão completa para testes locais. CC BY-SA 4.0. */\n(function(root){root.RevisaWikiDataV2='+data[at:end]+';})(typeof window===\'undefined\'?globalThis:window);\n'+(out/f'RevisaWiki_{STEM}_catalogo.js').read_text()+'\n'+rules_path.read_text()+'\n'+complete)
 for name in baseline['files']:
  if not name.startswith(('Carregador_','Chamada_fixa_')):continue
  raw=(base/name).read_bytes();text=raw.decode().replace(BASE,VERSION).replace('_v2_22_1','_'+STEM)
  if name.startswith('Chamada_fixa')and text.encode()!=raw:raise ValueError('Fixed installation call changed')
  (out/name.replace('_v2_22_1','_'+STEM)).write_text(text)
 files={}
 for path in sorted(out.glob('*.js')):
  run(node,'--check',path);raw=path.read_bytes()
  if not path.name.endswith('_completo.js')and len(raw)>=2097152:raise ValueError('Installable file exceeds native limit: '+path.name)
  files[path.name]=pin(raw)
 for path in sorted(shards.glob('*.json')):files[str(path.relative_to(out))]=pin(path.read_bytes())
 if any((ROOT/name).read_bytes()!=raw for name,raw in inputs.items()):raise ValueError('Input changed during build; retain attempt and rebuild')
 runtime={'version':VERSION,'distributionRevision':VERSION,'baseVersion':BASE,'baseManifestSha256':sha((ROOT/'tests/expected_release_v2221.json').read_bytes()),'expandedBaselineSha256':sha(source_raw),'sourceInputs':{name:pin(raw)for name,raw in inputs.items()},'files':files,'additionalCatalogSha256':additional_hash,'packedCatalogSha256':baseline['packedCatalogSha256'],'basePackedCatalogSha256':baseline['packedCatalogSha256'],'additionalRulesFunctionSha256':rules_hash,'infoboxManifestSha256':index['sha256'],'factory':json.loads((work/'FACTORY.json').read_text()),'catalogueRecords':len(catalog['records']),'catalogueActiveRecords':sum(row.get('state')=='active'for row in catalog['records']),'shards':len(index['data']['shards']),'limits':{**baseline['limits'],'calculationDeadlineMilliseconds':None,'fixedAnalysisDeadline':False},'wikipediaWrites':0}
 (out/'MANIFESTO_RUNTIME.json').write_text(json.dumps(runtime,ensure_ascii=False,indent=2)+'\n')
 (out/'CANDIDATE_MANIFEST.private.json').write_text(json.dumps({**runtime,'status':'awaiting-validation','nativePresavePassed':False,'browserValidationPassed':False,'githubUploads':0},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'version':VERSION,'status':'candidate-built-not-release-certified','files':{k:v['bytes']for k,v in files.items()},'wikipediaWrites':0}))
if __name__=='__main__':main()
