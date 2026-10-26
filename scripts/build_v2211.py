"""Build the reversible column patch with save-safe catalogue serialization.

The originally published distributions and manifests remain frozen. This
installation revision preserves the decoded catalogue and all executable code.
"""
from pathlib import Path
import argparse,hashlib,json,os,shutil,subprocess
from wiki_safe_data import protect_data_module
ROOT=Path(__file__).resolve().parents[1]
SOURCES=['src/v2_21_1/short_columns.js','src/v2_21_1/patches.json','scripts/build_v2211.py','scripts/wiki_safe_data.py']
sha=lambda b:hashlib.sha256(b).hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--node',default=os.environ.get('REVISAWIKI_NODE')or shutil.which('node'));a=ap.parse_args();assert a.node
 sources={n:(ROOT/n).read_bytes() for n in SOURCES};spec=json.loads(sources[SOURCES[1]]);pin=ROOT/'tests/expected_release_v2210.json';assert sha(pin.read_bytes())==spec['baseManifestSha256'];base=json.loads(pin.read_bytes());out=ROOT/'dist/2.21.1-installation.1';out.mkdir(parents=True,exist_ok=True);files={};proofs=[]
 published_pin=ROOT/'tests/expected_release_v2211.json';published=json.loads(published_pin.read_bytes());serialization_proof=None
 for name,v in base['files'].items():
  raw=(ROOT/'dist/2.21.0'/name).read_bytes();assert {'bytes':len(raw),'sha256':sha(raw)}==v;original=text=raw.decode();edits=[]
  def replace(before,after,count=1):
   nonlocal text
   assert text.count(before)==count,(name,before,text.count(before));text=text.replace(before,after);edits.append((before,after,count))
  if name in ['RevisaWiki_v2_21_0.js','RevisaWiki_v2_21_0_completo.js']:
   compact=name=='RevisaWiki_v2_21_0.js'
   replace('const END_MATTER_COLUMN_MINIMUM=6;' if compact else 'const END_MATTER_COLUMN_MINIMUM = 6;','const END_MATTER_COLUMN_MINIMUM=8;' if compact else 'const END_MATTER_COLUMN_MINIMUM = 8;')
   start=text.index('function endMatterColumnBlocks(');end=text.index('function unprotectedColumnListEquals(',start);old=text[start:end];new=old.replace(r'/^\*(?!\*)',r'/^\*(?![*#:;])');assert old.count(r'/^\*(?!\*)')==1
   assert spec['retireLegacyUnwrap'] is True
   begin=new.index('if(wrappers.test(body)){' if compact else 'if (wrappers.test(body)) {');finish=new.index('const lines=lineRows' if compact else 'const lines = lineRows',begin)
   new=new[:begin]+'if(wrappers.test(body))continue;\n'+new[finish:];replace(old,new)
   for function,next_function,operations in spec['functions']:
    start=text.index('function '+function+'(');end=text.index('function '+next_function+'(',start);old=text[start:end];new=old
    for before,after,count in operations:assert new.count(before)==count,(name,function,before);new=new.replace(before,after)
    replace(old,new)
   replace(*spec['commonReplacement']);replace(*spec['headerReplacement'])
   helper=sources[SOURCES[0]].decode();helper=''.join(line.lstrip(' ')for line in helper.splitlines(keepends=True))if compact else helper
   replace('function endMatterColumns(',helper+'function endMatterColumns(')
   before='source=repairColumnListArguments(source,bump);'if compact else 'source = repairColumnListArguments(source,bump);';replace(before,before+'\nsource=v2211ShortEndMatterColumns(source,cfg,bump);')
  text=text.replace('2.21.0','2.21.1').replace('_v2_21_0','_v2_21_1')
  restored=text.replace('2.21.1','2.21.0').replace('_v2_21_1','_v2_21_0')
  for before,after,count in reversed(edits):assert restored.count(after)==count,(name,'inverse',after[:80]);restored=restored.replace(after,before)
  assert restored==original,(name,'unexpected bytes outside intended patch')
  target=out/name.replace('_v2_21_0','_v2_21_1');before_protection=text.encode();assert {'bytes':len(before_protection),'sha256':sha(before_protection)}==published['files'][target.name]
  assert (ROOT/'dist/2.21.1'/target.name).read_bytes()==before_protection
  if name.endswith('_dados.js'):
   text=protect_data_module(text);serialization_proof={'originalSourceSha256':sha(before_protection),'protectedSourceSha256':sha(text.encode()),'decodedCatalogueUnchanged':True,'sourceNfcStable':True,'literalPreSaveTriggersAbsent':True,'expectedIntegrityHashUnchanged':True}
  target.write_text(text);b=target.read_bytes();subprocess.run([a.node,'--check',str(target)],check=True);files[target.name]={'bytes':len(b),'sha256':sha(b)}
  if name.startswith('Chamada_fixa'):assert b==raw
  proofs.append({'file':target.name,'baseSha256':sha(raw),'restoredBaseSha256':sha(restored.encode()),'exactInverse':True,'columnPatchOperations':len(edits)})
 old_data=(ROOT/'dist/2.21.0/RevisaWiki_v2_21_0_dados.js').read_text();new_data=(out/'RevisaWiki_v2_21_1_dados.js').read_text()
 def data(s):return json.loads(s[s.index('const data=')+11:s.index(';if(typeof module')])
 assert data(old_data)['packed']==data(new_data)['packed'];assert data(new_data)['version']=='2.21.1'
 for n,v in files.items():
  if not n.endswith('_completo.js'):assert v['bytes']<2097152,n
 assert serialization_proof
 m={'version':'2.21.1','runtimeVersion':'2.21.1','distributionRevision':'2.21.1-installation.1','baseVersion':'2.21.0','baseManifestSha256':sha(pin.read_bytes()),'publishedRuntimeManifestSha256':sha(published_pin.read_bytes()),'packedCatalogSha256':base['packedCatalogSha256'],'packedCatalogByteValuesUnchanged':True,'files':files,'sourceInputs':{n:{'bytes':len(b),'sha256':sha(b)}for n,b in sources.items()},'reversibleChangeProofs':proofs,'dataSerialization':serialization_proof,'limits':{'endMatterRootItemMinimum':8,'referenceMinimumUnchanged':10,'calculationDeadlineMillisecondsUnchanged':60000}}
 b=(json.dumps(m,ensure_ascii=False,indent=2)+'\n').encode();(ROOT/'tests/expected_release_v2211_installation1.json').write_bytes(b);(out/'MANIFESTO_RUNTIME.json').write_bytes(b);assert all((ROOT/n).read_bytes()==v for n,v in sources.items());print(json.dumps({'version':'2.21.1','distributionRevision':'2.21.1-installation.1','runtimeManifestSha256':sha(b),'files':files,'allInverseProofsPassed':True}))
if __name__=='__main__':main()
