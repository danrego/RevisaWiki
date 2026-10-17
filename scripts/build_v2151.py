"""Build the biography and infobox repairs from the pinned 2.15.0 distribution."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'dist/2.15.0'
OUT = ROOT / 'dist/2.15.1'
BASE_PIN = '7525f04df70a28ce473d0bb9b747e3098931f24ef1e01a7820eb1795b8f84c24'


def once(source, old, new):
    assert source.count(old) == 1, 'The pinned integration anchor changed: ' + old[:90]
    return source.replace(old, new, 1)


def patch(source):
    helpers = '\n'.join((ROOT / 'src/v2_15_1' / name).read_text()
                        for name in ('infobox_order.js', 'field_syntax.js', 'image_alt.js', 'biography_lead.js', 'retained_count.js', 'safeguards.js'))
    source = once(source, '    function auxiliaryParameters(raw, bump, warn) {',
                  helpers + '\n    function auxiliaryParameters(raw, bump, warn) {')
    for signature, refusal in (
        ('    function infobox(raw, bump, warn) {', 'return raw;'),
        ('    function automaticParameters(raw,cfg,bump) {', 'return raw;'),
        ('    function multilingualTemplate(raw,cfg,bump,warn) {', 'return {text:raw,handled:false};'),
    ):
        source = once(source, signature,
                      signature + '\n        if(v2151NativeBiographySourceConflict(raw))' + refusal)
    source = once(source, '        templateDefinitionRepairs: true, templateReadableFormatting: true,',
                  '        automaticInfoboxOrder: true, automaticFieldSyntax: true,\n'
                  '        automaticInfoboxImages: true, automaticBiographyLead: true,\n'
                  '        templateDefinitionRepairs: true, templateReadableFormatting: true,')
    source = once(source, "        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));",
                  "        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));\n"
                  "        for(let round=0;round<3;round++){const previous=plan.text;\n"
                  "            stage('v2151-biography-lead',s=>v2151BiographyLeadEdits(s,cfg));\n"
                  "            stage('v2151-infobox-order',s=>v2151InfoboxOrderPlan(s,cfg).edits);\n"
                  "            stage('v2151-field-syntax',s=>v2151FieldSyntaxEdits(s,cfg));\n"
                  "            stage('v2151-image-alt',s=>v2151BiographyImageAltPlan(s,cfg).edits);\n"
                  "            if(plan.text===previous)break;\n"
                  "        }")
    source = once(source, "        stage('v28-multiple-marriages',s=>v28MultipleMarriageEdits(s,cfg));",
                  "        stage('v28-multiple-marriages',s=>v28MultipleMarriageEdits(s,cfg));\n"
                  "        stage('v2151-biography-preparation',s=>v2151BiographyPreparationPlan(s,cfg).edits);\n"
                  "        for(let round=0;round<3;round++){const previous=plan.text;\n"
                  "            stage('v2151-biography-lead',s=>v2151BiographyLeadEdits(s,cfg));\n"
                  "            stage('v2151-infobox-order',s=>v2151InfoboxOrderPlan(s,cfg).edits);\n"
                  "            stage('v2151-field-syntax',s=>v2151FieldSyntaxEdits(s,cfg));\n"
                  "            stage('v2151-image-alt',s=>v2151BiographyImageAltPlan(s,cfg).edits);\n"
                  "            if(plan.text===previous)break;\n"
                  "        }")
    source = once(source, '        auxiliaryParameters:',
                  '        infoboxLeadOrder:"Infocaixa posicionada antes da introdução",\n'
                  '        infoboxIndentation:"Espaço indevido antes da infocaixa retirado",\n'
                  '        fieldSyntax:"Sintaxe de campos da infocaixa corrigida",\n'
                  '        fieldInvisibleKey:"Caractere invisível no nome do campo retirado",\n'
                  '        fieldFullwidthEquals:"Separador do campo corrigido",\n'
                  '        infoboxImageUnitDuplicate:"Unidade de tamanho da imagem corrigida",\n'
                  '        biographyImageAlt:"Imagem e texto alternativo organizados na infocaixa",\n'
                  '        biographyLeadBold:"Assunto inicial destacado em negrito",\n'
                  '        biographyLeadSelfLink:"Ligação inicial para o próprio artigo retirada",\n'
                  '        biographyLeadBirth:"Nascimento acrescentado à identificação inicial",\n'
                  '        biographyLeadDeath:"Falecimento acrescentado à identificação inicial",\n'
                  '        biographyLeadTuple:"Datas e locais organizados na identificação inicial",\n'
                  '        auxiliaryParameters:')
    source = once(source, "            if(e.remove || e.generated)continue;\n            const key=norm(e.key), value=e.value.trim();",
                  "            if(e.remove || e.generated)continue;\n"
                  "            if(profile.kind==='infobox'&&INFOBOX_CATALOG[p.name]&&v215LiteralTemplateIdentity(raw)&&v2151FrozenBurialField(e.key))continue;\n"
                  "            const key=norm(e.key), value=e.value.trim();")
    source = once(source,
                  "const steps=plan.safe.steps.filter(step=>['v273-explicit-marriage','v28-biography-fields','v28-biography-dates','v28-multiple-marriages'].includes(step.name));",
                  "const steps=plan.safe.steps.filter(step=>['v273-explicit-marriage','v28-biography-fields','v28-biography-dates','v28-multiple-marriages','v2151-biography-preparation','v2151-infobox-order','v2151-field-syntax','v2151-image-alt'].includes(step.name));")
    exports = ','.join(re.findall(r'^    function (v2151\w+|automaticInfoboxOrder|automaticFieldSyntax|automaticBiographyImageAlt|automaticBiographyLead)\(', helpers, re.MULTILINE))
    source = once(source, '        v212ReferenceFieldScope,v212LiteralCitationFields,',
                  '        ' + exports + ',\n        v212ReferenceFieldScope,v212LiteralCitationFields,')
    source = once(source, "step.name.startsWith('v215-'))&&Array.isArray(edit.proof?.changeRules)",
                  "step.name.startsWith('v215-')||step.name.startsWith('v2151-'))&&Array.isArray(edit.proof?.changeRules)")
    source = once(source, '        const biographyObjects=v28BiographyObjectProof(plan,expected,actual);',
                  '        const leadObjects=v2151LeadObjectProof(plan,expected,actual);if(!leadObjects.accepted)return reject(leadObjects.reason);\n'
                  '        const biographyObjects=v28BiographyObjectProof(plan,expected,actual);')
    source = once(source, '    function v211RetainedAdjustments(before,after,kinds=[]) {',
                  '    function v211RetainedAdjustments(before,after,kinds=[],options={}) {')
    source = once(source, '        const templateCount=v215TemplateCount(before,after,topics);if(templateCount)return templateCount;',
                  '        if(!options.v2151RetainedCountSkip){const patchCount=v2151RetainedCount(before,after,topics,kinds,options);if(patchCount)return patchCount;}\n'
                  '        const templateCount=v215TemplateCount(before,after,topics);if(templateCount)return templateCount;')
    source = once(source, "v.kinds===kinds.join('|'))",
                  "v.kinds===kinds.join('|')&&v.options===v211FreshnessKey(options))")
    source = once(source, "v211CountMemo.unshift({before,after,kinds:kinds.join('|'),result})",
                  "v211CountMemo.unshift({before,after,kinds:kinds.join('|'),options:v211FreshnessKey(options),result})")
    source = once(source, 'v211RetainedAdjustments(comparisonPlan.before,comparisonPlan.selectedSource);',
                  'v211RetainedAdjustments(comparisonPlan.before,comparisonPlan.selectedSource,[],currentOptions(false));')
    source = once(source, 'v211RetainedAdjustments(last.before,last.after,last.kinds||[])',
                  'v211RetainedAdjustments(last.before,last.after,last.kinds||[],currentOptions(false))')
    source = once(source, "        if (!topics.length) topics.push('sintaxe e formatação');",
                  "        if(v2151IdentificationChanged(before,after))topics.push('identificação inicial');\n"
                  "        if (!topics.length) topics.push('sintaxe e formatação');")
    beginning = source.index('    function v211MinorMechanicalPlan(')
    ending = source.index('    function v211FreshnessKey(', beginning)
    block = source[beginning:ending]
    needle = "        stage('v214-prose-spacing',s=>v214ProseSpacingPlan(s,cfg).text);"
    assert block.count(needle) == 1
    block = block.replace(needle, "        stage('v2151-mechanical-presentation',s=>v2151MechanicalPresentation(s,cfg));\n" + needle)
    source = source[:beginning] + block + source[ending:]
    start = source.index(' * A versão 2.15 confere a sintaxe')
    end = source.index(' * Licença:', start)
    source = source[:start] + (
        ' * A versão 2.15.1 organiza a abertura e a posição de infocaixas.\n'
        ' * Corrige erros literais conferidos em nomes de campos,\n'
        ' * separadores e tamanhos, e conserva o texto alternativo das imagens.\n'
        ' * Dados biográficos explícitos e referenciados podem completar\n'
        ' * a identificação inicial, sem escolher entre dados conflitantes.\n') + source[end:]
    return source


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    assert args.node, 'Set REVISAWIKI_NODE or pass --node.'
    raw = (ROOT / 'tests/expected_release_v2150.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE_PIN
    baseline = json.loads(raw)
    OUT.mkdir(parents=True, exist_ok=True)
    names = {name: name.replace('_v2_15_0', '_v2_15_1') for name in baseline['files']}
    files = {}
    for name, proof in baseline['files'].items():
        original = (BASE / name).read_bytes()
        assert len(original) == proof['bytes'] and hashlib.sha256(original).hexdigest() == proof['sha256']
        text = original.decode('utf-8')
        if name in ('RevisaWiki_v2_15_0.js', 'RevisaWiki_v2_15_0_completo.js'):
            text = patch(text)
        text = text.replace('2.15.0', '2.15.1')
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
    for name in ('RevisaWiki_v2_15_1.js', 'RevisaWiki_v2_15_1_dados.js'):
        assert files[name]['bytes'] < 2097152
    archived = json.loads((BASE / 'ARQUIVOS.json').read_text())['files']
    for path in sorted(BASE.glob('Catalogo_*.json')):
        raw = path.read_bytes()
        assert hashlib.sha256(raw).hexdigest() == archived[path.name]['sha256']
        catalog = json.loads(raw)
        catalog['releaseVersion'] = catalog['distributionVersion'] = '2.15.1'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_15_1.js']['sha256']
        (OUT / path.name.replace('_v2_15_0', '_v2_15_1')).write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    manifest = {'version': '2.15.1', 'runtimeVersion': '2.15.1', 'distributionRevision': '2.15.1',
                'baseVersion': '2.15.0', 'baseManifestSha256': BASE_PIN,
                'packedCatalogSha256': baseline['packedCatalogSha256'], 'files': files}
    (ROOT / 'tests/expected_release_v2151.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({'version': manifest['version'], 'files': files}, indent=2))


if __name__ == '__main__':
    main()
