"""Build an isolated selection of 2.19 repairs on the tested beta.1 base."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'dist/2.19.0-beta.1'
VERSION = '2.19.0-beta.2'
OUT = ROOT / 'dist' / VERSION


def once(text, old, new):
    assert text.count(old) == 1, 'Pinned beta integration anchor differs: ' + old[:90]
    return text.replace(old, new, 1)


def patch(text):
    selection = json.loads((ROOT / 'src/beta219_2/SELECTION.json').read_text())
    helpers = []
    for row in selection['modules']:
        raw = (ROOT / row['file']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == row['sha256']
        helpers.append(raw.decode())
    helper = '\n'.join(helpers)
    text = once(text, "    function v25TalkPreparationPlan(source,article='',cfg={}) {",
                helper + "\n    function v25TalkPreparationPlan(source,article='',cfg={}) {")
    # The existing planner supplies protection, source-bound transactions and
    # counters. No new global reference normalization or guard is imported.
    text = once(text, "        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));",
                "        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));\n"
                "        stage('v219-identical-biography-date-aliases',s=>v219BiographyDateAliasPlan(s,cfg).edits);")
    text = once(text, "            stage('v216-field-values',s=>v216FieldValueEdits(s,cfg));",
                "            stage('v219-native-repeated-age',s=>v219NativeAgePlan(s,cfg).edits);\n"
                ""
                "            stage('v216-field-values',s=>v216FieldValueEdits(s,cfg));")
    text = once(text, '    function v273MarriageInventory(source,cfg,wanted) {',
                '    function v273MarriageInventory(source,cfg,wanted) {\n'
                '        source=v219NativeAgeInventoryProjection(source,cfg);')
    text = once(text, "        if(native?.title)return v215SameTemplateTitle(literal,native.title);",
                "        if(native?.title)return v215SameTemplateTitle(literal,native.title)||v219NativePersonAliasIdentity(literal,native);")
    text = once(text, "analysis.repairs.filter(r=>r.rule!=='tableHeaderScopes'||cfg.tableAccessibility!==false)",
                "analysis.repairs.filter(r=>v219TableAutomaticRepairAllowed(r,source,analysis)&&(r.rule!=='tableHeaderScopes'||cfg.tableAccessibility!==false))")
    text = once(text, '            if(t.nested||t.end-t.start>500000||report.edits.length>=100)continue;',
                '            if(t.nested||t.end-t.start>500000||report.edits.length>=100||!v219TableSourceIsLiteral(source,t.start,t.end))continue;')
    text = once(text, 'table-(?:dynamic|nested|large|complex|year-heading|header-scope)$',
                'table-(?:dynamic|nested|large|complex|year-heading|header-scope|rowspan-overflow)$')
    exports = ','.join(re.findall(r'^    function (v219\w+)\(', helper, re.M))
    text = once(text, '    const api = {', '    const api = {' + exports + ',')
    start = text.index(' * Beta separada, baseada')
    end = text.index(' * Licença:', start)
    text = text[:start] + (
        ' * Beta separada, baseada na 2.18 e na beta.1. Acrescenta a seleção\n'
        ' * conferida de datas duplicadas e idade repetida em infocaixas,\n'
        ' * com proteção dos valores de rowspan e dos cabeçalhos de tabelas.\n'
        ' * As demais mudanças da 2.19 final continuam fora desta beta.\n'
        ' * A validação ampla da versão final permanece pausada.\n') + text[end:]
    return text


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=shutil.which('node'))
    args = parser.parse_args()
    assert args.node
    base_raw = (ROOT / 'tests/expected_release_beta219.json').read_bytes()
    base = json.loads(base_raw)
    assert base['version'] == '2.19.0-beta.1'
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    for name, pin in base['files'].items():
        raw = (BASE / name).read_bytes()
        assert len(raw) == pin['bytes'] and hashlib.sha256(raw).hexdigest() == pin['sha256']
        text = raw.decode()
        if name in ['RevisaWiki_v2_19_0_beta_1.js', 'RevisaWiki_v2_19_0_beta_1_completo.js']:
            text = patch(text)
        text = text.replace('2.19.0-beta.1', VERSION).replace('v2_19_0_beta_1', 'v2_19_0_beta_2')
        target = OUT / name.replace('v2_19_0_beta_1', 'v2_19_0_beta_2')
        target.write_text(text)
        subprocess.run([args.node, '--check', str(target)], check=True)
        raw = target.read_bytes();files[target.name] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
    for suffix in ['.js', '_dados.js']:
        assert files['RevisaWiki_v2_19_0_beta_2' + suffix]['bytes'] < 2097152
    manifest = {**base, 'version': VERSION, 'baseVersion': '2.19.0-beta.1',
                'baseManifestSha256': hashlib.sha256(base_raw).hexdigest(),
                'changes': ['discussion-header-native-alias-identity', 'identical-native-biography-date-aliases',
                            'displayed-birth-field-repeated-age', 'native-person-infobox-redirect',
                            'table-span-and-header-safety'], 'files': files}
    (ROOT / 'tests/expected_release_beta219_2.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({'version': VERSION, 'files': files}, indent=2))


if __name__ == '__main__':
    main()
