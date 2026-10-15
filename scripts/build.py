"""Rebuild RevisaWiki2.6 from the pinned2.5 distribution, keeping catalogs intact."""
from pathlib import Path
import argparse,difflib,hashlib,importlib.util,json,os,re,shutil,subprocess
HERE=Path(__file__).resolve();PORTABLE=HERE.parent.name=='scripts'
R=HERE.parents[1] if PORTABLE else HERE.parents[2]
W=R/'src/v2_6' if PORTABLE else R/'work/revisawiki_v2_6'
B=R/'dist/2.5.0' if PORTABLE else R/'outputs/revisawiki_v2_5'
O=R/'dist/2.6.0' if PORTABLE else R/'outputs/revisawiki_v2_6'
BASE_SHA='b277d8d82846e3060057ffa07335f1ecca1ee7b4e82213da90e2eb7ca96aff23'
PACKED_SHA='1daf86b796e70e117891abef91e3447ea8c0b211cc03b9966d39920f3f0d4323'
p=argparse.ArgumentParser();p.add_argument('--node',default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'));p.add_argument('--prototype',action='store_true');args=p.parse_args()
if not args.node:raise SystemExit('Node.js is required. Set REVISAWIKI_NODE or pass --node.')
original=(B/'RevisaWiki_v2_5_completo.js').read_text();assert hashlib.sha256(original.encode()).hexdigest()==BASE_SHA
s=original.replace('2.5.0','2.6.0')
def load_module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
patch=load_module('revisawiki_inline_patch',W/'inline/integration_patch.py')
s=patch.apply(s)
verified=W/'verified_rules/integration_patch.py'
if verified.exists():s=load_module('revisawiki_verified_patch',verified).apply(s)
quiet=W/'quiet_review/integration_patch.py'
if quiet.exists():s=load_module('revisawiki_quiet_review_patch',quiet).apply(s)
harvard=W/'matriz/integration_patch.py'
if harvard.exists():s=load_module('revisawiki_harvard_patch',harvard).apply(s)
portals=W/'portals/integration_patch.py'
if portals.exists():s=load_module('revisawiki_portal_patch',portals).apply(s)
fundo=W/'fundo/integration_patch.py'
if fundo.exists():s=load_module('revisawiki_fundo_patch',fundo).apply(s)
privacy=W/'anonymity/shortcut_anonymization_patch.py'
if privacy.exists():s=load_module('revisawiki_shortcut_privacy_patch',privacy).apply(s)
start=s.index('/*\n');end=s.index(' */',start)+3
header='''/*
 * RevisaWiki para a ptwiki, versão 2.6.0, 15 de outubro de 2026.
 * Licença: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/
 *
 * Ajustar código aplica as regras de sintaxe, citações, infocaixas,
 * ligações, notas, seções finais e grafia. As alterações ficam no rascunho,
 * com comparação, escolha das mudanças e opção de desfazer.
 *
 * Editar aqui abre uma seção na página de leitura, com resumo, prévia
 * visual e recuperação do texto. Somente um clique deliberado em Publicar
 * alterações inicia o envio. Ajustes, prévias e temporizadores não publicam.
 * A sessão mantém o título, a seção e a revisão de origem. Regras que
 * dependem do artigo inteiro continuam restritas à edição completa.
 *
 * Há regras de código para inglês, francês, alemão, espanhol, russo,
 * ucraniano, turco, hebraico, italiano, romeno, coreano, japonês, chinês,
 * cantonês, vietnamita, tailandês, neerlandês, dinamarquês, sueco,
 * norueguês bokmål, norueguês nynorsk, finlandês e árabe. A ferramenta
 * não traduz prosa nem avalia se uma fonte sustenta uma afirmação.
 *
 * As regras aproveitam scripts anteriores e correções verificadas em
 * revisões públicas. O fluxo do AjaxEdit orientou a edição de seções,
 * reimplementada com APIs públicas. Os créditos e as licenças das fontes
 * podem ser consultados nas revisões permanentes abaixo.
 * Fontes e revisões:
 * https://pt.wikipedia.org/w/index.php?oldid=66288743
 * https://pt.wikipedia.org/w/index.php?oldid=72349758
 * https://pt.wikipedia.org/w/index.php?oldid=73087684
 * https://en.wiktionary.org/w/index.php?title=MediaWiki:Gadget-AjaxEdit.js&oldid=91689859
 */'''
s=s[:start]+header+s[end:]
O.mkdir(parents=True,exist_ok=True)
if args.prototype:
 target=W/'prototype_current.js';target.write_text(s);subprocess.run([args.node,'--check',str(target)],check=True);print('Prototype built.');raise SystemExit(0)
(O/'RevisaWiki_v2_6_completo.js').write_text(s)
(O/'Alteracoes_codigo_v2_5_para_v2_6.diff').write_text(''.join(difflib.unified_diff(original.splitlines(True),s.splitlines(True),fromfile='RevisaWiki_2.5.0',tofile='RevisaWiki_2.6.0')))
data={'version':'2.6.0','schema':1,'catalogDate':'2026-10-14','packed':{}}
patterns=[(r'^    const PACKED_PTWIKI_CATALOG = (.*);$','ptwiki','    const PACKED_PTWIKI_CATALOG = root.RevisaWikiDataV2.packed.ptwiki;'),(r'^    const TRANSLATION_RULES = unpackTranslationData\((.*)\);$','translations','    const TRANSLATION_RULES = unpackTranslationData(root.RevisaWikiDataV2.packed.translations);'),(r'^    const SPELLING_RULES = Object.freeze\(unpackSpellingRows\((.*)\)\.concat\(V26_RESEARCH_SPELLING_ADDITIONS\)\);$','spelling','    const SPELLING_RULES = Object.freeze(unpackSpellingRows(root.RevisaWikiDataV2.packed.spelling).concat(V26_RESEARCH_SPELLING_ADDITIONS));')]
for pattern,key,replacement in patterns:
 m=re.search(pattern,s,re.M);assert m,key;data['packed'][key]=json.loads(m.group(1));s=s[:m.start()]+replacement+s[m.end():]
canonical=lambda obj:json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(',',':'))
assert hashlib.sha256(canonical(data['packed']).encode()).hexdigest()==PACKED_SHA,'Packed catalogs changed.'
(O/'RevisaWiki_v2_6_dados.js').write_text('/* RevisaWiki 2.6.0, dados. CC BY-SA 4.0. */\n(function(root){const data='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';if(typeof module === "object" && module.exports) module.exports=data;else root.RevisaWikiDataV2=data;})(typeof globalThis !== "undefined" ? globalThis : this);\n')
s=s.replace("const blob = new root.Blob(['(' + RevisaWikiBoot.toString() + ')(globalThis);']", "const blob = new root.Blob(['globalThis.RevisaWikiDataV2='+JSON.stringify(root.RevisaWikiDataV2)+';\\n(' + RevisaWikiBoot.toString() + ')(globalThis);']")
boot=(W/'build/module_bootstrap_v2_6.js').read_text();assert boot.count('__CORE_BOOT__')==1
if hasattr(patch,'patch_bootstrap'):boot=patch.patch_bootstrap(boot)
(O/'RevisaWiki_v2_6.js').write_text(boot.replace('__CORE_BOOT__',s))
for kind in ['common_js','comunitario']:
 text=(W/f'build/Carregador_{kind}_RevisaWiki_v2_6.js').read_text()
 if hasattr(patch,'patch_loader'):text=patch.patch_loader(text)
 (O/f'Carregador_{kind}_RevisaWiki_v2_6.js').write_text(text)
for p in B.glob('Catalogo_*_v2_5.json'):
 c=json.loads(p.read_text());c['releaseVersion']='2.6.0'
 if p.name=='Catalogo_ortografia_RevisaWiki_v2_5.json':
  additions=json.loads((W/'verified_rules/spelling_additions.json').read_text())
  assert not {x['wrong'] for x in c['rules']} & {x['wrong'] for x in additions}
  c['rules']+=additions;c['automaticRules']+=additions
  c['releaseAdditions']={'version':'2.6.0','checkedOn':'2026-10-15','rules':additions}
 if p.name in ['Catalogo_portais_RevisaWiki_v2_5.json','Catalogo_profissoes_portais_RevisaWiki_v2_5.json']:
  c['releaseAdditions']=json.loads((W/'portals/release_additions.json').read_text())
  c['releaseCoreSha256']=hashlib.sha256((O/'RevisaWiki_v2_6.js').read_bytes()).hexdigest()
 if p.name=='Catalogo_ptwiki_RevisaWiki_v2_5.json':
  for key in ['it','tw','er','wf','wm','w1','tf','w4','ws']:
   c.get('shortcuts',{}).pop(key,None)
  c['releaseExceptions']=[{'template':'Info/Biografia','templateOldid':72993800,'parameter':'fundo','literalValues':['','instrumentista_sem_vocal'],'condition':'One literal field, verified unused in this template. Other unknown or populated values remain unchanged.','source':'https://pt.wikipedia.org/w/index.php?oldid=72993800','realArticleRevision':72983004,'equalRenderedInfoboxSha256':'9fb293ed2ced38e4e5ef733efab9b54c8d1d1f98a84b988a5a671bfc5ab8c832'}]
 (O/p.name.replace('_v2_5','_v2_6')).write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
for p in O.glob('*.js'):subprocess.run([args.node,'--check',str(p)],check=True)
files={p.name:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in O.glob('*.js')}
assert files['RevisaWiki_v2_6.js']['bytes']<2097152 and files['RevisaWiki_v2_6_dados.js']['bytes']<2097152
freeze={'version':'2.6.0','baseSha256':BASE_SHA,'packedCatalogSha256':PACKED_SHA,'files':files}
if not PORTABLE:(W/'final_test_freeze.json').write_text(json.dumps(freeze,indent=2)+'\n')
print(json.dumps(freeze,indent=2))
