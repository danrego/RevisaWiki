"""Build source-bound biography repairs from the pinned 2.15.1 distribution."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'dist/2.15.1'
OUT = ROOT / 'dist/2.16.0'
BASE_PIN = '0035161078b19e0f2a9f08f2fa05db1c3e9a6b1536cd01320811c10c2a40988d'


def once(source, old, new):
    assert source.count(old) == 1, 'The pinned integration anchor changed: ' + old[:90]
    return source.replace(old, new, 1)


def patch(source):
    helpers = '\n'.join((ROOT / 'src/v2_16' / name).read_text()
                        for name in ('biography_transfer.js', 'field_values.js', 'completion.js'))
    source = once(source, '    function auxiliaryParameters(raw, bump, warn) {',
                  helpers + '\n    function auxiliaryParameters(raw, bump, warn) {')
    source = once(source, '        automaticInfoboxOrder: true, automaticFieldSyntax: true,',
                  '        automaticBiographyFields: true,\n        automaticInfoboxOrder: true, automaticFieldSyntax: true,')
    # Preserve richer existing paired-date repairs before formatting standalone
    # dates. The bounded native loop completes dependent stages afterward.
    anchor = "            stage('v2151-image-alt',s=>v2151BiographyImageAltPlan(s,cfg).edits);"
    assert source.count(anchor) == 2
    before, after = source.rsplit(anchor, 1)
    source = before + anchor + "\n            stage('v216-field-values',s=>v216FieldValueEdits(s,cfg));\n            stage('v28-biography-dates',s=>v28BiographyDateEdits(s,cfg));\n            stage('v216-biography-transfer',s=>v216TransferEdits(s,cfg));" + after
    source = once(source, '        const finalText=v214ProseSpacingCleanup(shield.restore(s),cfg,bump);',
                  '        const completedText=v216EmptyEndHeadingCleanup(shield.restore(s),cfg,bump);\n'
                  '        const finalText=v214ProseSpacingCleanup(completedText,cfg,bump);')
    source = once(source, '        auxiliaryParameters:',
                  '        biographyLeadToInfoboxBirth:"Nascimento acrescentado à infocaixa",\n'
                  '        biographyLeadToInfoboxDeath:"Falecimento acrescentado à infocaixa",\n'
                  '        biographyPackedDate:"Data e local separados na infocaixa",\n'
                  '        biographyPackedPlace:"Local separado da data na infocaixa",\n'
                  '        v216InfoboxStandaloneDates:"Data completa organizada na infocaixa",\n'
                  '        v216InfoboxDuplicateAge:"Idade manual duplicada retirada",\n'
                  '        v216InfoboxDuplicateUnits:"Unidade repetida na infocaixa corrigida",\n'
                  '        v216InfoboxLists:"Lista da infocaixa corrigida",\n'
                  '        v216InfoboxValueLabels:"Rótulo repetido na infocaixa retirado",\n'
                  '        v216InfoboxHeaderSelfLinks:"Ligação do cabeçalho para o próprio artigo retirada",\n'
                  '        auxiliaryParameters:')
    source = once(source, '!cfg.birthCategoryProof,cacheOptions=v25SafeCacheOptions(cfg)',
                  '!cfg.birthCategoryProof&&!v216TimeDependentSource(source),cacheOptions=v25SafeCacheOptions(cfg)')
    source = once(source,
                  'cfg.pageDisambiguation,cfg.discussionPage,cfg.contentModel,cfg.model]);',
                  'cfg.pageDisambiguation,cfg.discussionPage,cfg.contentModel,cfg.model,new Date().toISOString().slice(0,10)]);')
    source = once(source, '    function v211FreshnessKey(options={}) {',
                  '    function v211FreshnessKey(options={}) {\n        options={...options,v216CalendarUTC:new Date().toISOString().slice(0,10)};')
    source = once(source, "'spellingAllowedWords','spellingIgnoredRules','templateDefinitionInputEnabled'];",
                  "'spellingAllowedWords','spellingIgnoredRules','templateDefinitionInputEnabled','v216CalendarUTC'];")
    source = once(source,
                  'for(const build of [v2151BiographyLeadPlan,v2151InfoboxOrderPlan,v2151FieldSyntaxPlan,v2151BiographyImageAltPlan]){',
                  'for(const build of [v2151BiographyLeadPlan,v2151InfoboxOrderPlan,v2151FieldSyntaxPlan,v2151BiographyImageAltPlan,v216FieldValuePlan,v216TransferPlan]){')
    source = once(source,
                  '[cfg.automaticBiographyLead,cfg.automaticInfoboxOrder,cfg.automaticFieldSyntax,cfg.automaticInfoboxImages].every(value=>value===false)',
                  '[cfg.automaticBiographyLead,cfg.automaticInfoboxOrder,cfg.automaticFieldSyntax,cfg.automaticInfoboxImages,cfg.automaticBiographyFields].every(value=>value===false)')
    exports = ','.join(re.findall(r'^    function (v216\w+|automaticBiographyTransfer|automaticBiographyFieldValues)\(', helpers, re.MULTILINE))
    source = once(source, '        v212ReferenceFieldScope,v212LiteralCitationFields,',
                  '        ' + exports + ',\n        v212ReferenceFieldScope,v212LiteralCitationFields,')
    source = once(source, "step.name.startsWith('v2151-'))&&Array.isArray(edit.proof?.changeRules)",
                  "step.name.startsWith('v2151-')||step.name.startsWith('v216-'))&&Array.isArray(edit.proof?.changeRules)")
    source = once(source, '        const biographyObjects=v28BiographyObjectProof(plan,expected,actual);',
                  '        const newBiographyObjects=v216BiographyObjectProof(plan,expected,actual);if(!newBiographyObjects.accepted)return reject(newBiographyObjects.reason);\n'
                  '        const biographyObjects=v28BiographyObjectProof(plan,expected,actual);')
    source = once(source, '        if(!options.v2151RetainedCountSkip){const patchCount=',
                  '        if(!options.v216RetainedCountSkip){const count=v216RetainedCount(before,after,topics,kinds,options);if(count)return count;}\n'
                  '        if(!options.v2151RetainedCountSkip){const patchCount=')
    source = once(source, "        stage('v2151-mechanical-presentation',s=>v2151MechanicalPresentation(s,cfg));",
                  "        stage('v216-mechanical-presentation',s=>v216MechanicalPresentation(s,cfg));\n"
                  "        stage('v2151-mechanical-presentation',s=>v2151MechanicalPresentation(s,cfg));")
    start = source.index(' * A versão 2.15.1 organiza a abertura')
    end = source.index(' * Licença:', start)
    source = source[:start] + (
        ' * A versão 2.16 corrige o preenchimento de infocaixas pessoais.\n'
        ' * Datas e locais explícitos e referenciados podem completar campos\n'
        ' * ausentes. Corrige datas isoladas, listas e repetições nos campos\n'
        ' * cujo funcionamento foi conferido, preservando fatos e fontes.\n') + source[end:]
    return source


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    assert args.node, 'Set REVISAWIKI_NODE or pass --node.'
    raw = (ROOT / 'tests/expected_release_v2151.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE_PIN
    baseline = json.loads(raw)
    OUT.mkdir(parents=True, exist_ok=True)
    names = {name: name.replace('_v2_15_1', '_v2_16_0') for name in baseline['files']}
    files = {}
    for name, proof in baseline['files'].items():
        original = (BASE / name).read_bytes()
        assert len(original) == proof['bytes'] and hashlib.sha256(original).hexdigest() == proof['sha256']
        text = original.decode('utf-8')
        if name in ('RevisaWiki_v2_15_1.js', 'RevisaWiki_v2_15_1_completo.js'):
            text = patch(text)
        text = text.replace('2.15.1', '2.16.0')
        for before, after in names.items():
            text = text.replace(before, after)
        destination = OUT / names[name]
        destination.write_text(text)
        emitted = destination.read_bytes()
        subprocess.run([args.node, '--check', str(destination)], check=True)
        assert b'~~~' not in emitted
        if name.startswith('Chamada_fixa_'):
            assert emitted == original, 'The permanent bootstrap must remain unchanged.'
        files[destination.name] = {'bytes': len(emitted), 'sha256': hashlib.sha256(emitted).hexdigest()}
    for name in ('RevisaWiki_v2_16_0.js', 'RevisaWiki_v2_16_0_dados.js'):
        assert files[name]['bytes'] < 2097152
    archived = json.loads((BASE / 'ARQUIVOS.json').read_text())['files']
    for path in sorted(BASE.glob('Catalogo_*.json')):
        raw = path.read_bytes()
        assert hashlib.sha256(raw).hexdigest() == archived[path.name]['sha256']
        catalog = json.loads(raw)
        catalog['releaseVersion'] = catalog['distributionVersion'] = '2.16.0'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_16_0.js']['sha256']
        (OUT / path.name.replace('_v2_15_1', '_v2_16_0')).write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    manifest = {'version': '2.16.0', 'runtimeVersion': '2.16.0', 'distributionRevision': '2.16.0',
                'baseVersion': '2.15.1', 'baseManifestSha256': BASE_PIN,
                'packedCatalogSha256': baseline['packedCatalogSha256'], 'files': files}
    (ROOT / 'tests/expected_release_v2160.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({'version': manifest['version'], 'files': files}, indent=2))


if __name__ == '__main__':
    main()
