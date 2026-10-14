from pathlib import Path
import hashlib,json,re,subprocess,shutil,os
ROOT=Path(__file__).resolve().parents[1];O=ROOT/'dist/2.1.1'
VERSION='2.1.1';NODE=os.environ.get('REVISAWIKI_NODE')or shutil.which('node')or'node'
s=(O/'RevisaWiki_v2_1_1_completo.js').read_text()
assert hashlib.sha256(s.encode()).hexdigest()=='764688f85130cddc4e3c95cc1e68e395795c85ee4f14d3ace6a89adf89af706c','Use the tested complete 2.1.1 source.'
data={'version':VERSION,'schema':1,'catalogDate':'2026-10-14','packed':{}}
for pattern,key,replacement in [(r'^    const PACKED_PTWIKI_CATALOG = (.*);$','ptwiki','    const PACKED_PTWIKI_CATALOG = root.RevisaWikiDataV2.packed.ptwiki;'),(r'^    const TRANSLATION_RULES = unpackTranslationData\((.*)\);$','translations','    const TRANSLATION_RULES = unpackTranslationData(root.RevisaWikiDataV2.packed.translations);'),(r'^    const SPELLING_RULES = Object.freeze\(unpackSpellingRows\((.*)\)\);$','spelling','    const SPELLING_RULES = Object.freeze(unpackSpellingRows(root.RevisaWikiDataV2.packed.spelling));')]:
 m=re.search(pattern,s,re.M);assert m,key;data['packed'][key]=json.loads(m.group(1));s=s[:m.start()]+replacement+s[m.end():]
raw=json.dumps(data,ensure_ascii=False,separators=(',',':'));(O/'RevisaWiki_v2_1_1_dados.js').write_text('/* RevisaWiki 2.1.1, pacote de dados. CC BY-SA 4.0.\n * Catálogos versionados, sem ações de edição. */\n(function(root){\n    const data='+raw+';\n    if(typeof module === "object" && module.exports) module.exports=data;\n    else root.RevisaWikiDataV2=data;\n})(typeof globalThis !== "undefined" ? globalThis : this);\n')
digest='1daf86b796e70e117891abef91e3447ea8c0b211cc03b9966d39920f3f0d4323'
check='const d=require(process.argv[1]);const c=v=>Array.isArray(v)?"["+v.map(c).join(",")+"]":v&&typeof v==="object"?"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+c(v[k])).join(",")+"}":JSON.stringify(v);process.stdout.write(require("node:crypto").createHash("sha256").update(c(d.packed)).digest("hex"));'
assert subprocess.check_output([NODE,'-e',check,str(O/'RevisaWiki_v2_1_1_dados.js')],text=True)==digest
s=s.replace("const blob = new root.Blob(['(' + RevisaWikiBoot.toString() + ')(globalThis);']","const blob = new root.Blob(['globalThis.RevisaWikiDataV2='+JSON.stringify(root.RevisaWikiDataV2)+';\\n(' + RevisaWikiBoot.toString() + ')(globalThis);']")
bootstrap=(ROOT/'build/module_bootstrap_v2_1_1.js').read_text().replace('__CORE_BOOT__',s)
(O/'RevisaWiki_v2_1_1.js').write_text(bootstrap)
print('Rebuilt the 2.1.1 core and data from the tested complete 2.1.1 source. Run npm test to verify exact hashes.')
