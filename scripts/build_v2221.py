"""Build a complete release candidate without changing historical distributions."""
from pathlib import Path
import argparse,hashlib,json,os,shutil,subprocess
from check_wiki_presave_v2212 import canonical
from wiki_safe_data import protect_data_module,protect_json_source
from reconstruct_v2220_baseline import ensure_baseline

ROOT=Path(__file__).resolve().parents[1]
VERSION='2.22.1'
STEM='v2_22_1'
def sha(raw):return hashlib.sha256(raw).hexdigest()
def pin(raw):return {'bytes':len(raw),'sha256':sha(raw)}
def run(node,*args):subprocess.run([node,*map(str,args)],cwd=ROOT,check=True)
def replace_once(source,old,new):
 if source.count(old)!=1:raise ValueError('Missing or repeated exact build anchor: '+old[:100])
 return source.replace(old,new,1)
def write_json(path,value):path.write_text(protect_json_source(json.dumps(value,ensure_ascii=False,separators=(',',':')))+'\n')
def shard_catalog(catalog,out,title_map,maximum=524288):
 if catalog.get('schema')!=1 or not isinstance(catalog.get('records'),list) or not isinstance(catalog.get('nativeAliases'),list):raise ValueError('Catalogue envelope')
 headers={};shards=[];current=[];groups=[]
 for record in catalog['records']:
  trial={'schema':1,'snapshotId':catalog['snapshotId'],'id':'parte0000','records':current+[record]}
  size=len(protect_json_source(json.dumps(trial,ensure_ascii=False,separators=(',',':'))).encode())
  if size>maximum and current:groups.append(current);current=[]
  current.append(record)
 if current:groups.append(current)
 for number,records in enumerate(groups,1):
  name=f'parte{number:04d}';value={'schema':1,'snapshotId':catalog['snapshotId'],'id':name,'records':records}
  path=out/(name+'.json');write_json(path,value);raw=path.read_bytes()
  if len(raw)>=2097152:raise ValueError('An individual contract exceeds the install-file limit')
  shards.append({'id':name,'sha256':sha(canonical(value).encode()),'bytes':len(raw)})
  for record in records:
   for raw_title in [record['source']['title'],*record['source'].get('aliases',[])]:
    title=title_map[raw_title]
    ids=headers.setdefault(title,[])
    if name not in ids:ids.append(name)
 manifest={'schema':1,'snapshotId':catalog['snapshotId'],'headers':headers,'shards':shards,'nativeAliases':catalog['nativeAliases']}
 return {'data':manifest,'sha256':sha(canonical(manifest).encode())}
def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--node',default=os.environ.get('REVISAWIKI_NODE')or shutil.which('node'))
 parser.add_argument('--base-expanded',type=Path,help='Optional exact pinned expanded baseline; the default is reconstructed locally when needed')
 parser.add_argument('--catalog',type=Path,default=ROOT/'src/v2_22_1/infobox_registry_data.json')
 parser.add_argument('--out',type=Path,default=ROOT/'artifacts/v2221/candidate-r1')
 args=parser.parse_args();node=args.node;out=args.out.resolve()
 if not node or not __debug__:raise ValueError('A JavaScript runtime and enabled assertions are required')
 if out.exists():raise ValueError('Use a new candidate directory; previous attempts are immutable')
 if ROOT/'dist' in out.parents:raise ValueError('This builder writes local candidates, not historical releases')
 baseline_path=ROOT/'tests/expected_release_v2220.json';baseline=json.loads(baseline_path.read_bytes())
 reconstruction_names=['scripts/reconstruct_v2220_baseline.py','scripts/baselines/v2220/package.json','scripts/baselines/v2220/package-lock.json']
 reconstruction_inputs={name:(ROOT/name).read_bytes()for name in reconstruction_names}
 for name in ['package.json','package-lock.json']:
  if pin(reconstruction_inputs['scripts/baselines/v2220/'+name])!=baseline['sourceInputs'][name]:raise ValueError('Historical package snapshot differs: '+name)
 for name,expected in baseline['files'].items():
  if pin((ROOT/'dist/2.22.0'/name).read_bytes())!=expected:raise ValueError('Released baseline differs: '+name)
 expanded_path=args.base_expanded if args.base_expanded is not None else ensure_baseline(ROOT,node=node)
 if any((ROOT/name).read_bytes()!=raw for name,raw in reconstruction_inputs.items()):raise ValueError('A reconstruction input changed; retain the attempt and retry')
 expanded=expanded_path.read_bytes()
 if sha(expanded)!=baseline['factory']['baselineSha256']:raise ValueError('Expanded baseline does not match the released factory receipt')
 old_helper_files=sorted((ROOT/'src/v2_22').glob('*.js'))
 old_helpers='\n'.join(p.read_text()for p in old_helper_files)
 if sha(old_helpers.encode())!=baseline['factory']['helperSha256']:raise ValueError('The historical helper inputs changed')
 inputs={str(p.relative_to(ROOT)):p.read_bytes()for p in old_helper_files+sorted((ROOT/'src/v2_22_1').glob('*.js'))+sorted((ROOT/'src/v2_22_1').glob('*.json'))+sorted((ROOT/'scripts').glob('v2221_*patch.cjs'))+[ROOT/'src/v2_22/inference_data.json',ROOT/'src/v2_22/syntax_data.json',ROOT/'src/v2_22/bootstrap.txt',ROOT/'src/v2_22/complete_bootstrap.txt',ROOT/'scripts/v2221_infobox_integration.cjs',ROOT/'scripts/v2221_release_integration.cjs',ROOT/'scripts/v2221_extract_build.cjs',ROOT/'scripts/v2220_factory.cjs',ROOT/'scripts/v2215_compact.cjs',ROOT/'scripts/wiki_safe_data.py',ROOT/'scripts/check_wiki_presave_v2212.py',ROOT/'scripts/check_wiki_presave_v2221.py',ROOT/'scripts/check_runtime_presave_v2221.py',ROOT/'package.json',ROOT/'package-lock.json',Path(__file__)]}
 inputs['scripts/v2221_catalog_index.cjs']=(ROOT/'scripts/v2221_catalog_index.cjs').read_bytes()
 inputs.update(reconstruction_inputs)
 catalog_raw=args.catalog.read_bytes();catalog=json.loads(catalog_raw)
 out.mkdir(parents=True);work=out/'build';work.mkdir();data_dir=out/'Infocaixas';data_dir.mkdir()
 title_map=json.loads(subprocess.check_output([node,str(ROOT/'scripts/v2221_catalog_index.cjs'),str(args.catalog)],cwd=ROOT))
 index=shard_catalog(catalog,data_dir,title_map)
 source=expanded.decode().replace("'2.22.0'","'2.22.1'").replace('"2.22.0"','"2.22.1"').replace('RevisaWiki.catalogs.2.22.0','RevisaWiki.catalogs.2.22.1').replace('_v2_22_0','_v2_22_1')
 helpers=old_helpers+'\n'+'\n'.join(p.read_text()for p in sorted((ROOT/'src/v2_22_1').glob('*.js')))
 before=work/'before.js';before.write_text(source);h=work/'helpers-before.js';h.write_text(helpers)
 integrated=work/'integrated.js';helper=work/'helpers.js'
 run(node,ROOT/'scripts/v2221_release_integration.cjs',before,h,integrated,helper,work/'INTEGRATION.json')
 patched=work/'patched.js';factory=work/'factory.js'
 run(node,ROOT/'scripts/v2220_factory.cjs',integrated,helper,patched,factory,work/'FACTORY.json')
 old_data=(ROOT/'dist/2.22.0/RevisaWiki_v2_22_0_dados.js').read_text();start=old_data.index('const data=')+len('const data=');value,end=json.JSONDecoder().raw_decode(old_data,start);value['version']=VERSION
 data=protect_data_module(old_data[:start].replace('2.22.0',VERSION)+json.dumps(value,ensure_ascii=False,separators=(',',':'))+old_data[end:]);(out/('RevisaWiki_'+STEM+'_dados.js')).write_text(data)
 additional={key:json.loads((ROOT/'src/v2_22'/file).read_bytes())for key,file in [('inference','inference_data.json'),('syntax','syntax_data.json')]}
 if sha(canonical(additional).encode())!=baseline['additionalCatalogSha256']:raise ValueError('Historical additional catalogue data changed')
 additional['focusedInfoboxes']=json.loads((ROOT/'src/v2_22_1/focused_infobox_data.json').read_bytes())
 additional_hash=sha(canonical(additional).encode())
 value={'version':VERSION,'sha256':additional_hash,'data':additional}
 catalogue="/* RevisaWiki, catálogo adicional. CC BY-SA 4.0. */\n(function(root){const data="+json.dumps(value,ensure_ascii=False,separators=(',',':'))+";root.RevisaWikiCatalogV222=data;if(typeof module==='object'&&module.exports)module.exports=data;})(typeof window==='undefined'?globalThis:window);\n"
 c=work/'catalog.js';c.write_text(catalogue);run(node,ROOT/'scripts/v2215_compact.cjs',c,out/('RevisaWiki_'+STEM+'_catalogo.js'),work/'CATALOG_COMPACT.json')
 rules="/* RevisaWiki, regras e índice de infocaixas. CC BY-SA 4.0. */\n(function(root){const rules={version:"+json.dumps(VERSION)+',catalogSha256:'+json.dumps(additional_hash)+',infoboxManifest:'+json.dumps(index,ensure_ascii=False,separators=(',',':'))+',factory:'+factory.read_text()+"};root.RevisaWikiRulesV222=rules;if(typeof module==='object'&&module.exports)module.exports=rules;})(typeof window==='undefined'?globalThis:window);\n"
 r=work/'rules.js';r.write_text(rules);rules_path=out/('RevisaWiki_'+STEM+'_regras.js');run(node,ROOT/'scripts/v2215_compact.cjs',r,rules_path,work/'RULES_COMPACT.json')
 extract=ROOT/'scripts/v2221_extract_build.cjs'
 if not extract.exists():raise ValueError('Missing structural build extractor')
 rules_hash=subprocess.check_output([node,str(extract),'factory-sha256',str(rules_path)],cwd=ROOT).decode().strip()
 bootstrap=(ROOT/'src/v2_22/bootstrap.txt').read_text().replace('@@VERSION@@',VERSION).replace('@@STEM@@',STEM).replace('@@CATALOG_HASH@@',additional_hash).replace('@@RULES_HASH@@',rules_hash)
 validation="if(!root.RevisaWikiRulesV222.infoboxManifest||root.RevisaWikiRulesV222.infoboxManifest.sha256!=="+json.dumps(index['sha256'])+")throw new Error('Índice de infocaixas incompatível');"
 bootstrap=replace_once(bootstrap,'start();return;',validation+"if(crypto.createHash('sha256').update(canonical(root.RevisaWikiRulesV222.infoboxManifest.data)).digest('hex')!=="+json.dumps(index['sha256'])+")throw new Error('Índice de infocaixas alterado');start();return;")
 bootstrap=replace_once(bootstrap,'start();}).catch(',validation+"const infoboxDigest=await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(root.RevisaWikiRulesV222.infoboxManifest.data)));if(Array.from(new Uint8Array(infoboxDigest),byte=>byte.toString(16).padStart(2,'0')).join('')!=="+json.dumps(index['sha256'])+")throw new Error('Índice de infocaixas alterado');start();}).catch(")
 core_before=work/'core-before.js';core_before.write_text(bootstrap.replace('@@CORE@@',patched.read_text()));core=out/('RevisaWiki_'+STEM+'.js');run(node,ROOT/'scripts/v2215_compact.cjs',core_before,core,work/'CORE_COMPACT.json')
 complete_boot=(ROOT/'src/v2_22/complete_bootstrap.txt').read_text().replace('@@PACKED_HASH@@',baseline['packedCatalogSha256']).replace('@@CATALOG_HASH@@',additional_hash).replace('@@RULES_HASH@@',rules_hash)
 complete_boot=replace_once(complete_boot,'const inputs=[[canonical(root.RevisaWikiDataV2.packed),expectedData]',"if(!root.RevisaWikiRulesV222.infoboxManifest||root.RevisaWikiRulesV222.infoboxManifest.sha256!=="+json.dumps(index['sha256'])+")throw new Error('Índice de infocaixas incompatível');const inputs=[[canonical(root.RevisaWikiRulesV222.infoboxManifest.data),"+json.dumps(index['sha256'])+"],[canonical(root.RevisaWikiDataV2.packed),expectedData]")
 boot=subprocess.check_output([node,str(extract),'boot',str(core)],cwd=ROOT).decode()
 complete_boot=complete_boot.replace('@@BOOT@@',boot)
 a=data.index('const data=')+len('const data=');b=data.index(';if(typeof module',a)
 complete='/* RevisaWiki 2.22.1, versão completa para testes locais. CC BY-SA 4.0. */\n(function(root){root.RevisaWikiDataV2='+data[a:b]+";})(typeof window==='undefined'?globalThis:window);\n"+(out/('RevisaWiki_'+STEM+'_catalogo.js')).read_text()+'\n'+rules_path.read_text()+'\n'+complete_boot
 (out/('RevisaWiki_'+STEM+'_completo.js')).write_text(complete)
 for name in baseline['files']:
  if not name.startswith(('Carregador_','Chamada_fixa_')):continue
  raw=(ROOT/'dist/2.22.0'/name).read_bytes();text=raw.decode().replace('2.22.0',VERSION).replace('_v2_22_0','_'+STEM)
  if name.startswith('Chamada_fixa') and text.encode()!=raw:raise ValueError('The fixed common.js call must remain unchanged')
  (out/name.replace('_v2_22_0','_'+STEM)).write_text(text)
 files={}
 for path in sorted(out.glob('*.js')):
  run(node,'--check',path);raw=path.read_bytes()
  if not path.name.endswith('_completo.js') and len(raw)>=2097152:raise ValueError('Installable file exceeds the native limit: '+path.name)
  files[path.name]=pin(raw)
 for path in sorted(data_dir.glob('*.json')):files[str(path.relative_to(out))]=pin(path.read_bytes())
 if args.catalog.read_bytes()!=catalog_raw or any((ROOT/name).read_bytes()!=raw for name,raw in inputs.items()):raise ValueError('An input changed during this build; retain this attempt and rebuild')
 receipt={'version':VERSION,'status':'complete-candidate-awaiting-release-validation','baseVersion':'2.22.0','baseManifestSha256':sha(baseline_path.read_bytes()),'expandedBaselineSha256':sha(expanded),'inputCatalogSha256':sha(catalog_raw),'infoboxManifestSha256':index['sha256'],'sourceInputs':{name:pin(raw)for name,raw in inputs.items()},'files':files,'additionalCatalogSha256':additional_hash,'packedCatalogSha256':baseline['packedCatalogSha256'],'additionalRulesFunctionSha256':rules_hash,'catalogueRecords':len(catalog['records']),'catalogueActiveRecords':sum(r.get('state')=='active'for r in catalog['records']),'shards':len(index['data']['shards']),'wikipediaWrites':0,'githubUploads':0,'nativePresavePassed':False,'browserValidationPassed':False}
 runtime={k:v for k,v in receipt.items()if k not in ['status','githubUploads','nativePresavePassed','browserValidationPassed']}
 runtime.update(distributionRevision=VERSION,basePackedCatalogSha256=baseline['packedCatalogSha256'],factory=json.loads((work/'FACTORY.json').read_text()),limits={**baseline['limits'],'calculationDeadlineMilliseconds':None,'fixedAnalysisDeadline':False})
 (out/'MANIFESTO_RUNTIME.json').write_text(json.dumps(runtime,ensure_ascii=False,indent=2)+'\n')
 (out/'CANDIDATE_MANIFEST.private.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in receipt.items()if k not in ['sourceInputs','files']}))
if __name__=='__main__':main()
