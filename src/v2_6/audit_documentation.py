"""Check the complete manual, install payloads and release history."""
from pathlib import Path
import argparse,hashlib,json,re
P=Path(__file__).resolve();PORTABLE=P.parent.parent.name=='src'
R=P.parents[2] if PORTABLE else P.parents[2]
O=R/'dist/2.6.0' if PORTABLE else R/'outputs/revisawiki_v2_6'
ap=argparse.ArgumentParser();ap.add_argument('--final',action='store_true');a=ap.parse_args()
checks=[]
def check(ok,label):
 checks.append({'name':label,'passed':bool(ok)})
 if not ok:raise AssertionError(label)
manual=(O/'Documentacao_RevisaWiki_v2_6.wiki').read_text();install=(O/'Instalacao_RevisaWiki_v2_6.txt').read_text()
check('2.6.0' in manual and '2.6.0' in install,'Current version in manual and installation')
check('https://github.com/danrego/RevisaWiki' in manual,'Public repository link')
check('oldid=91689859' in manual,'Exact AjaxEdit study attribution')
for line in manual.splitlines():
 if re.match(r'^={2,6} ',line):
  match=re.match(r'^(={2,6}) .+? (={2,6})$',line)
  check(match is not None and match[1]==match[2],'Balanced heading: '+line)
history=manual.split('== Histórico das versões ==',1)[1].split('== Testes e detalhes técnicos ==',1)[0]
versions=re.findall(r'^=== (\d+(?:\.\d+)+) ===$',history,re.M)
check(versions and versions[0]=='2.6.0','Latest release first')
check(versions==sorted(versions,key=lambda v:tuple(map(int,v.split('.'))),reverse=True),'Release history in descending order')
check('Testes anteriores da interface' not in manual,'No obsolete test appendix')
check('Ajuste geral 2.5, comparação' in history,'Historical project name remains accurate')
for heading in versions:
 entry=history.split('=== '+heading+' ===',1)[1].split('===',1)[0]
 check(re.search(r'^\* ',entry,re.M) is not None,'Feature bullets for '+heading)
check('substitua o bloco inteiro' in manual,'Manual requires complete loader replacement')
check('substitua todo o bloco' in install and 'Não basta mudar expectedVersion' in install,'Installation does not suggest version-only upgrade')
embedded=re.search(r'<syntaxhighlight lang="javascript">\n([\s\S]*?)</syntaxhighlight>',manual)
check(embedded is not None and embedded[1]==(O/'Carregador_comunitario_RevisaWiki_v2_6.js').read_text(),'Embedded community loader is byte-exact')
for label in ['Editar aqui','Publicar alterações','Ver prévia','Cancelar','Desfazer']:
 check(label in manual,'Documented control '+label)
check('2.537 trocas exatas' in manual and '2.565 correspondências' in manual,'Current finite spelling totals')
check('oito segundos' in manual and 'doze segundos' in manual,'Preview timeout described as its own phase')
check('Ajustar código e as prévias alteram ou conferem o rascunho.' in manual,'Adjustment and explicit publication distinguished')
check(not re.search(r'Ajuste geral2|RevisaWiki2|Ajuste geral 2\.6,',manual),'No accidental version retagging or missing spaces')
check(not any(term in manual for term in ['pivotal','robusto','tapeçaria','alavancar','emblemático']),'No selected inflated prose terms')
if a.final:
 for p in O.iterdir():
  if p.suffix in ['.wiki','.txt']:
   check(not re.search(r'\b[A-Z_]*PENDING\b',p.read_text()),'No unfinished marker in '+p.name)
report={'version':'2.6.0','status':'passed','checks':len(checks),'versions':versions,'manualSha256':hashlib.sha256(manual.encode()).hexdigest(),'installationSha256':hashlib.sha256(install.encode()).hexdigest(),'findings':[],'wikipediaWrites':0}
target=R/'artifacts/documentation/v26_documentation.json' if PORTABLE else R/'work/revisawiki_v2_6/documentation_checks.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
