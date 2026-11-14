"""Build a separately versioned release without mutating historical distributions."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,os,shutil,subprocess
from check_wiki_presave_v2212 import canonical,decode_data_source
from wiki_safe_data import protect_data_module
ROOT=Path(__file__).resolve().parents[1];VERSION='2.22.0';STEM='v2_22_0';OUT=ROOT/'dist'/VERSION;SOURCE=ROOT/'src/v2_22'
def sha(x):return hashlib.sha256(x).hexdigest()
def pin(x):return {'bytes':len(x),'sha256':sha(x)}
def run(node,*args):subprocess.run([node,*map(str,args)],cwd=ROOT,check=True)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--node',default=os.environ.get('REVISAWIKI_NODE')or shutil.which('node'));args=ap.parse_args();node=args.node;assert node and __debug__
 input_paths=sorted(SOURCE.glob('*.js'))+sorted(SOURCE.glob('*.json'))+[SOURCE/'header.txt',SOURCE/'bootstrap.txt',SOURCE/'complete_bootstrap.txt',Path(__file__),ROOT/'scripts/v2220_factory.cjs']+[p for p in [ROOT/'scripts/v2220_integration.cjs',ROOT/'scripts/v2220_compat.cjs',ROOT/'scripts/v2220_runtime.cjs',ROOT/'scripts/v2215_compact.cjs',ROOT/'scripts/wiki_safe_data.py',ROOT/'scripts/check_wiki_presave_v2220.py',ROOT/'scripts/check_runtime_presave_v2220.py',ROOT/'scripts/v2220_inspect_catalog.cjs',ROOT/'package.json',ROOT/'package-lock.json']if p.exists()]
 inputs={str(p.relative_to(ROOT)):p.read_bytes()for p in input_paths}
 baseline_file=ROOT/'tests/expected_release_v2217.json';baseline=json.loads(baseline_file.read_bytes());base={}
 for name,expected in baseline['files'].items():
  raw=(ROOT/'dist/2.21.7'/name).read_bytes();assert pin(raw)==expected; base[name]=raw
 work=ROOT/'artifacts/v2220/build';work.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
 cached=ROOT/'artifacts/v2217/build/patched.js'
 if not cached.exists():
  import build_v2217
  reconstruct=work/'reconstruct';reconstruct.mkdir(parents=True,exist_ok=True)
  older=json.loads((ROOT/'tests/expected_release_v2216.json').read_bytes())
  restored=build_v2217.baseline_source(node,reconstruct,older)
  restored=restored.replace("'2.21.6'","'2.21.7'").replace('"2.21.6"','"2.21.7"').replace('RevisaWiki.catalogs.2.21.6','RevisaWiki.catalogs.2.21.7').replace('_v2_21_6','_v2_21_7')
  a=restored.index('/*\n * RevisaWiki para a ptwiki');b=restored.index('*/',a)+2
  restored=restored[:a]+(ROOT/'src/v2_21_7/header.txt').read_text().rstrip()+restored[b:]
  raw=reconstruct/'before2217.js';raw.write_text(restored)
  helpers2217=reconstruct/'helpers2217.js';helpers2217.write_text('\n'.join(x.read_text()for x in sorted((ROOT/'src/v2_21_7').glob('*.js'))))
  run(node,ROOT/'scripts/v2217_patch.cjs',raw,helpers2217,reconstruct/'patched2217.js',reconstruct/'PATCH2217.json')
  cached=reconstruct/'patched2217.js'
 checked=work/'baseline-compact.js';compactor=ROOT/'scripts/v2215_compact.cjs';proof=work/'BASELINE_COMPACT.json'
 can_reuse=checked.exists()and proof.exists()and pin(checked.read_bytes())==baseline['files']['RevisaWiki_v2_21_7.js']and json.loads(proof.read_text()).get('sourceSha256')==sha(cached.read_bytes())
 if not can_reuse:run(node,compactor,cached,checked,proof)
 assert pin(checked.read_bytes())==baseline['files']['RevisaWiki_v2_21_7.js'],'Expanded baseline must reproduce the exact released core'
 source=cached.read_text().replace("'2.21.7'","'2.22.0'").replace('"2.21.7"','"2.22.0"').replace('RevisaWiki.catalogs.2.21.7','RevisaWiki.catalogs.2.22.0').replace('_v2_21_7','_v2_22_0')
 header=(SOURCE/'header.txt').read_text();a=source.index('/*\n * RevisaWiki para a ptwiki');b=source.index('*/',a)+2;source=source[:a]+header.rstrip()+source[b:]
 helper_files=sorted(SOURCE.glob('*.js'));helpers='\n'.join(inputs[str(p.relative_to(ROOT))].decode()for p in helper_files);assert helpers.strip()
 before=work/'baseline-updated.js';before.write_text(source);helper_file=work/'helpers.js';helper_file.write_text(helpers)
 # Version-specific stage integration is applied before the lexical factory.
 integrated=work/'integrated.js'
 patch=ROOT/'scripts/v2220_integration.cjs'
 if patch.exists():run(node,patch,before,helper_file,integrated,work/'INTEGRATION.json')
 else:integrated.write_text(source)
 for script in ['v2220_compat.cjs','v2220_runtime.cjs']:
  target=work/(script+'.js');run(node,ROOT/'scripts'/script,integrated,target,work/(script+'.json'));integrated=target
 patched=work/'patched.js';factory=work/'factory.js';run(node,ROOT/'scripts/v2220_factory.cjs',integrated,helper_file,patched,factory,work/'FACTORY.json')
 catalog={}
 for key,file in [('inference','inference_data.json'),('syntax','syntax_data.json')]:
  if(SOURCE/file).exists():catalog[key]=json.loads(inputs[str((SOURCE/file).relative_to(ROOT))])
 catalog_hash=sha(canonical(catalog).encode())
 catalog_source='/* RevisaWiki 2.22.0, catálogos adicionais. CC BY-SA 4.0. */\n(function(root){const data='+json.dumps({'version':VERSION,'sha256':catalog_hash,'data':catalog},ensure_ascii=False,separators=(',',':'))+';root.RevisaWikiCatalogV222=data;if(typeof module===\'object\'&&module.exports)module.exports=data;})(typeof window===\'undefined\'?globalThis:window);\n'
 rules_source='/* RevisaWiki 2.22.0, regras adicionais. CC BY-SA 4.0. */\n(function(root){const rules={version:'+json.dumps(VERSION)+',catalogSha256:'+json.dumps(catalog_hash)+',factory:'+factory.read_text()+'};root.RevisaWikiRulesV222=rules;if(typeof module===\'object\'&&module.exports)module.exports=rules;})(typeof window===\'undefined\'?globalThis:window);\n'
 for label,text in [('catalog',catalog_source),('rules',rules_source)]:
  f=work/(label+'.js');f.write_text(text);target=OUT/('RevisaWiki_'+STEM+('_catalogo.js'if label=='catalog'else'_regras.js'));run(node,ROOT/'scripts/v2215_compact.cjs',f,target,work/(label.upper()+'_COMPACT.json'))
 extract_rules="const f=require('node:fs'),p=require('@babel/parser'),c=require('node:crypto'),a=p.parse(f.readFileSync(process.argv[1],'utf8'));let v;function w(n){if(!n||typeof n!=='object')return;if(n.type==='ObjectProperty'&&(n.key.name||n.key.value)==='factory')v=n.value;for(const[k,x]of Object.entries(n)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(x))x.forEach(w);else if(x&&typeof x==='object')w(x);}}w(a);if(!v)throw Error('Missing factory');const s=f.readFileSync(process.argv[1],'utf8');process.stdout.write(c.createHash('sha256').update(s.slice(v.start,v.end)).digest('hex'));"
 rules_hash=subprocess.check_output([node,'-e',extract_rules,str(OUT/('RevisaWiki_'+STEM+'_regras.js'))],cwd=ROOT).decode()
 old=base['RevisaWiki_v2_21_7_dados.js'].decode();a=old.index('const data=')+len('const data=');b=old.index(';if(typeof module',a)
 # JSON source from the reviewed data module is decoded by the shared reader.
 value=json.loads(old[a:b]);value['version']=VERSION
 data=protect_data_module(old[:a].replace('2.21.7',VERSION)+json.dumps(value,ensure_ascii=False,separators=(',',':'))+old[b:]);(OUT/('RevisaWiki_'+STEM+'_dados.js')).write_text(data)
 bootstrap=(SOURCE/'bootstrap.txt').read_text().replace('@@VERSION@@',VERSION).replace('@@STEM@@',STEM).replace('@@CATALOG_HASH@@',catalog_hash).replace('@@RULES_HASH@@',rules_hash)
 fullcore=bootstrap.replace('@@CORE@@',patched.read_text());uncompact=work/'core-before.js';uncompact.write_text(fullcore);core=OUT/('RevisaWiki_'+STEM+'.js');run(node,ROOT/'scripts/v2215_compact.cjs',uncompact,core,work/'CORE_COMPACT.json')
 files={}
 for oldname,raw in base.items():
  name=oldname.replace('_v2_21_7','_'+STEM)
  if oldname.endswith('_completo.js')or oldname in ['RevisaWiki_v2_21_7.js','RevisaWiki_v2_21_7_dados.js']:continue
  updated=raw.decode().replace('2.21.7',VERSION).replace('_v2_21_7','_'+STEM)
  if oldname.startswith('Carregador_'):
   anchor='.then(async function () {\n            if (window.RevisaWikiModulePromise)'
   assert anchor in updated,'Loader await anchor'
   updated=updated.replace(anchor,'.then(async function () {\n            if (window.RevisaWikiRulesBootPromise) await window.RevisaWikiRulesBootPromise;\n            if (window.RevisaWikiModulePromise)',1)
  if oldname.startswith('Chamada_fixa'):assert updated.encode()==raw
  (OUT/name).write_text(updated)
 # The complete bundle is for local testing, never a wiki installation target.
 extract_boot="const f=require('node:fs'),p=require('@babel/parser'),s=f.readFileSync(process.argv[1],'utf8'),a=p.parse(s),r=[];function w(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionExpression'&&n.id?.name==='RevisaWikiBoot')r.push(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(w);else if(v&&typeof v==='object')w(v);}}w(a);if(r.length!==1)throw Error('Boot identity');process.stdout.write(s.slice(r[0].start,r[0].end));"
 boot=subprocess.check_output([node,'-e',extract_boot,str(core)],cwd=ROOT).decode()
 complete_start=inputs[str((SOURCE/'complete_bootstrap.txt').relative_to(ROOT))].decode().replace('@@PACKED_HASH@@',baseline['packedCatalogSha256']).replace('@@CATALOG_HASH@@',catalog_hash).replace('@@RULES_HASH@@',rules_hash).replace('@@BOOT@@',boot)
 a=data.index('const data=')+len('const data=');b=data.index(';if(typeof module',a)
 complete=header+'\n(function(root){root.RevisaWikiDataV2='+data[a:b]+";})(typeof window==='undefined'?globalThis:window);\n"+(OUT/('RevisaWiki_'+STEM+'_catalogo.js')).read_text()+'\n'+(OUT/('RevisaWiki_'+STEM+'_regras.js')).read_text()+'\n'+complete_start
 (OUT/('RevisaWiki_'+STEM+'_completo.js')).write_text(complete)
 targets=['RevisaWiki_'+STEM+s for s in ['.js','_dados.js','_catalogo.js','_regras.js','_completo.js']]+[n.replace('_v2_21_7','_'+STEM)for n in base if not n.startswith('RevisaWiki_')]
 for name in targets:
  raw=(OUT/name).read_bytes();run(node,'--check',OUT/name);files[name]=pin(raw)
  if not name.endswith('_completo.js'):assert len(raw)<2097152,(name,len(raw))
 source_inputs=helper_files+[SOURCE/'header.txt',SOURCE/'bootstrap.txt',ROOT/'scripts/build_v2220.py',ROOT/'scripts/v2220_factory.cjs']+[p for p in [patch,SOURCE/'inference_data.json',SOURCE/'syntax_data.json']if p.exists()]
 manifest={'version':VERSION,'distributionRevision':VERSION,'baseVersion':'2.21.7','baseManifestSha256':sha(baseline_file.read_bytes()),'basePackedCatalogSha256':baseline['packedCatalogSha256'],'packedCatalogSha256':baseline['packedCatalogSha256'],'additionalCatalogSha256':catalog_hash,'additionalRulesFunctionSha256':rules_hash,'files':files,'sourceInputs':{name:pin(raw)for name,raw in inputs.items()},'factory':json.loads((work/'FACTORY.json').read_text()),'limits':{**baseline['limits'],'calculationDeadlineMilliseconds':None,'fixedAnalysisDeadline':False},'wikipediaWrites':0}
 assert set(str(p.relative_to(ROOT))for p in sorted(SOURCE.glob('*.js'))+sorted(SOURCE.glob('*.json'))+[SOURCE/'header.txt',SOURCE/'bootstrap.txt',SOURCE/'complete_bootstrap.txt',Path(__file__),ROOT/'scripts/v2220_factory.cjs']+[p for p in [ROOT/'scripts/v2220_integration.cjs',ROOT/'scripts/v2220_compat.cjs',ROOT/'scripts/v2220_runtime.cjs',ROOT/'scripts/v2215_compact.cjs',ROOT/'scripts/wiki_safe_data.py',ROOT/'scripts/check_wiki_presave_v2220.py',ROOT/'scripts/check_runtime_presave_v2220.py',ROOT/'scripts/v2220_inspect_catalog.cjs',ROOT/'package.json',ROOT/'package-lock.json']if p.exists()])==set(inputs),'Build source set changed'
 assert all((ROOT/name).read_bytes()==raw for name,raw in inputs.items()),'An input changed during the build; preserve attempt and rebuild'
 raw=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode();(ROOT/'tests/expected_release_v2220.json').write_bytes(raw);(OUT/'MANIFESTO_RUNTIME.json').write_bytes(raw);print(json.dumps({'version':VERSION,'files':files,'manifestSha256':sha(raw)}))
if __name__=='__main__':main()
