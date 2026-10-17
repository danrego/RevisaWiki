"""Build reviewed automatic repairs and a quiet report from pinned 2.17.0."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'dist/2.17.0'
OUT = ROOT / 'dist/2.18.0'
BASE_PIN = '6b5d26107594246a437da8adac5a4680c16313b0c975386a2c9e655c6bfce3d7'


def once(source, old, new):
    assert source.count(old) == 1, 'Pinned integration anchor differs: ' + old[:100]
    return source.replace(old, new, 1)


def load_patch(name):
    path = ROOT / 'src/v2_18' / name
    spec = importlib.util.spec_from_file_location('v218_' + path.stem, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def delegate(source, name, replacement, signature):
    header = '    function ' + name + signature + ' {'
    legacy = 'v218Legacy' + name[0].upper() + name[1:]
    source = once(source, header, '    function ' + legacy + signature + ' {')
    wrapper = header + '\n        return ' + replacement + '(...arguments);\n    }\n'
    return once(source, '    function ' + legacy + signature + ' {', wrapper + '    function ' + legacy + signature + ' {')


def patch(source):
    source = once(source, 'versão 2.17.0, 16 de outubro de 2026.', 'versão 2.17.0, 17 de outubro de 2026.')
    names = ('reference_layout.js', 'prose_gaps.js', 'citation_islands.js', 'legacy_compatibility.js', 'citation_keys.js', 'legacy_markup.js', 'reference_markup_proof.js', 'integration.js')
    helpers = '\n'.join((ROOT / 'src/v2_18' / name).read_text() for name in names)
    source = once(source, '    function auxiliaryParameters(raw, bump, warn) {', helpers + '\n    function auxiliaryParameters(raw, bump, warn) {')
    source = once(source, '        automaticBiographyFields: true,', '        automaticCitationIslands: true, automaticProseGaps: true, automaticCitationDateValues: true, automaticCitationKeyRepairs: true, automaticLegacyMarkup: true,\n        automaticBiographyFields: true,')
    source = delegate(source, 'v211ReferenceColumnPlans', 'v218ReferenceColumnPlans', '(source,options={},legacyOnly=false)')
    source = once(source, "const canonical=raw.slice(2,-2).includes('{{')?mapTemplateTree(raw,node=>v24InventoryTemplate(node,cfg)):v24InventoryTemplate(raw,cfg),fields=foreignEntries(parsedTemplate(canonical)),anchors=[],dates=[];", "const legacyCanonical=raw.slice(2,-2).includes('{{')?mapTemplateTree(raw,node=>v24InventoryTemplate(node,cfg)):v24InventoryTemplate(raw,cfg);\n        const canonical=v218CitationMetadataProjection(legacyCanonical,cfg),fields=foreignEntries(parsedTemplate(canonical)),anchors=[],dates=[];")
    source = once(source, "        stage('v214-prose-spacing',s=>v214ProseSpacingEdits(s,cfg));", "        stage('v214-prose-spacing',s=>v214ProseSpacingEdits(s,cfg));\n        stage('v218-prose-gaps',s=>v218ProseGapEdits(s,cfg));\n        stage('v218-citation-islands',s=>v218CitationIslandPlan(s,cfg).edits);\n        stage('v218-citation-key-typos',s=>v218CitationKeyEdits(s,cfg));\n        stage('v218-citation-date-values',s=>v218CitationDateEdits(s,cfg));")
    source = once(source, "        stage('v214-prose-spacing',s=>v214ProseSpacingPlan(s,cfg).text);", "        stage('v214-prose-spacing',s=>v214ProseSpacingPlan(s,cfg).text);\n        stage('v218-prose-gaps',s=>v218ProseGapPlan(s,cfg).text);\n        stage('v218-citation-islands',s=>v218CitationIslandPlan(s,cfg).text);\n        stage('v218-citation-date-values',s=>v218CitationDatePlan(s,cfg).text);")
    source = once(source, "        stage('v218-prose-gaps',s=>v218ProseGapEdits(s,cfg));", "        stage('v218-prose-gaps',s=>v218ProseGapEdits(s,cfg));\n        stage('v218-legacy-markup',s=>v218LegacyMarkupEdits(s,cfg));")
    source = once(source, "        stage('v214-prose-spacing',s=>v214ProseSpacingEdits(s,cfg));", "        stage('v218-reference-layout',s=>v218ReferenceLayoutEdits(s,cfg));\n        stage('v214-prose-spacing',s=>v214ProseSpacingEdits(s,cfg));")
    source = once(source, "        stage('v218-prose-gaps',s=>v218ProseGapPlan(s,cfg).text);", "        stage('v218-prose-gaps',s=>v218ProseGapPlan(s,cfg).text);\n        stage('v218-legacy-markup',s=>v218LegacyMarkupPlan(s,cfg).text);")
    source = once(source, "        stage('v214-prose-spacing',s=>v214ProseSpacingPlan(s,cfg).text);", "        stage('v218-reference-layout',s=>v218ReferenceLayoutPlan(s,cfg).text);\n        stage('v214-prose-spacing',s=>v214ProseSpacingPlan(s,cfg).text);")
    source = once(source, "        stage('v218-citation-date-values',s=>v218CitationDatePlan(s,cfg).text);", "        stage('v218-citation-key-aliases',s=>v218MechanicalCitationKeys(s,cfg));\n        stage('v218-citation-date-values',s=>v218CitationDatePlan(s,cfg).text);")
    source = once(source, "if(expected!==after&&!v211MinorSubset(before,after,expected,options)){", "if(expected!==after&&!v211MinorSubset(before,after,expected,options)&&!v218MinorCitationProof(before,after,options)){")
    source = once(source, '        const finalText=v214ProseSpacingCleanup(completedText,cfg,bump);', '        const spacedText=v214ProseSpacingCleanup(completedText,cfg,bump);\n        const finalText=v218ProseGapCleanup(spacedText,cfg,bump);')
    source = once(source, '        const restored=v214ProseSpacingCleanup(shield.restore(s),cfg,noop);', '        const restored=v218ProseGapCleanup(v214ProseSpacingCleanup(shield.restore(s),cfg,noop),cfg,noop);')
    source = once(source, '        if(!options.v217RetainedCountSkip){const count=', '        if(!options.v218RetainedCountSkip){const count=v218RetainedCount(before,after,topics,kinds,options);if(count)return count;}\n        if(!options.v217RetainedCountSkip){const count=')
    source = once(source, '        for(const spacing of v214ProseSpacingEdits(before,{...DEFAULTS,namespaceNumber:0})){', "        for(const spacing of v218ProseGapEdits(before,{...DEFAULTS,namespaceNumber:0})){\n            const start=v211CountAnchor(spacing.start,edits),end=v211CountAnchor(spacing.end,edits,false,true);\n            if(after.slice(start,end)!==spacing.text)continue;\n            const ids=[...new Set([...indices('old',spacing.start,spacing.end),...indices('new',start,end)])];\n            if(!ids.length||ids.some(i=>claimed.has(i)||/[^\\r\\n \\t]/.test(edits[i].before+edits[i].after)))continue;\n            emit('prose-spacing','Linhas vazias excedentes na prosa',ids,[{start:spacing.start,end:spacing.end}],[{start,end}]);\n        }\n        for(const spacing of v214ProseSpacingEdits(before,{...DEFAULTS,namespaceNumber:0})){")
    source = once(source, "step.name.startsWith('v217-'))&&Array.isArray(edit.proof?.changeRules)", "step.name.startsWith('v217-')||step.name.startsWith('v218-'))&&Array.isArray(edit.proof?.changeRules)")
    source = once(source, "referenceColumns: 'Referências com dez entradas ou mais em até duas colunas'", "referenceColumns: 'Formatação responsiva das referências'")
    source = once(source, "checkpoint('Referências em duas colunas');", "checkpoint('Formatação responsiva das referências');")
    source = once(source, '        auxiliaryParameters:', '        v218ResponsiveReferenceLayout:"Estilo fixo redundante de referências retirado",\n        v218ProseGaps:"Linhas vazias excedentes na prosa",\n        v218CitationDateValues:"Valor de data da citação corrigido",\n        v218LegacyCitationKeys:"Nome inválido de campo de citação corrigido",\n        auxiliaryParameters:')
    # Restrict the additional native markup equivalences to reference-body
    # comparison. Citation metadata, templates and table inventories retain
    # their existing comparisons, and names/groups/multiplicity stay exact.
    source = once(source, "keys.push(JSON.stringify([group,attrs.name||'',v24InventoryBody(ref.body,cfg)]));", "keys.push(JSON.stringify([group,attrs.name||'',v218ReferenceBodyInventory(ref.body,cfg)]));")
    source = once(source, 'definitions.get(key).add(v24InventoryBody(ref.body,cfg));', 'definitions.get(key).add(v218ReferenceBodyInventory(ref.body,cfg));')
    source = once(source, "return [group,'resolved',v24InventoryBody(ref.body,cfg)];", "return [group,'resolved',v218ReferenceBodyInventory(ref.body,cfg)];")
    exports = ','.join(re.findall(r'^    function (v218\w+|automaticCitationIslands)\(', helpers, re.M))
    source = once(source, '        v212ReferenceFieldScope,v212LiteralCitationFields,', '        ' + exports + ',\n        v212ReferenceFieldScope,v212LiteralCitationFields,')
    start = source.index(' * A versão 2.17 reduz os avisos')
    end = source.index(' * Licença:', start)
    source = source[:start] + (' * A versão 2.18 amplia a correção de citações completas em páginas\n'
                              ' * com trechos incompletos, corrige datas literais aceitas pelas\n'
                              ' * predefinições locais e remove linhas vazias excedentes na prosa.\n'
                              ' * A divisão das referências acompanha o comportamento nativo\n'
                              ' * do MediaWiki, sem impor uma largura ou quantidade de colunas.\n') + source[end:]
    return source


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    assert args.node, 'Set REVISAWIKI_NODE or pass --node.'
    raw = (ROOT / 'tests/expected_release_v2170.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE_PIN
    baseline = json.loads(raw)
    OUT.mkdir(parents=True, exist_ok=True)
    names = {name: name.replace('_v2_17_0', '_v2_18_0') for name in baseline['files']}
    files = {}
    for name, proof in baseline['files'].items():
        original = (BASE / name).read_bytes()
        assert len(original) == proof['bytes'] and hashlib.sha256(original).hexdigest() == proof['sha256']
        text = original.decode('utf-8')
        if name in ('RevisaWiki_v2_17_0.js', 'RevisaWiki_v2_17_0_completo.js'):
            text = patch(text)
        text = text.replace('2.17.0', '2.18.0')
        for before, after in names.items():
            text = text.replace(before, after)
        destination = OUT / names[name]
        destination.write_text(text)
        emitted = destination.read_bytes()
        subprocess.run([args.node, '--check', str(destination)], check=True)
        assert b'~~~' not in emitted
        if name.startswith('Chamada_fixa_'):
            assert emitted == original
        files[destination.name] = {'bytes': len(emitted), 'sha256': hashlib.sha256(emitted).hexdigest()}
    for name in ('RevisaWiki_v2_18_0.js', 'RevisaWiki_v2_18_0_dados.js'):
        assert files[name]['bytes'] < 2097152
    archived = json.loads((BASE / 'ARQUIVOS.json').read_text())['files']
    for path in sorted(BASE.glob('Catalogo_*.json')):
        raw = path.read_bytes()
        assert hashlib.sha256(raw).hexdigest() == archived[path.name]['sha256']
        catalog = json.loads(raw)
        catalog['releaseVersion'] = catalog['distributionVersion'] = '2.18.0'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_18_0.js']['sha256']
        (OUT / path.name.replace('_v2_17_0', '_v2_18_0')).write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    manifest = {'version':'2.18.0','runtimeVersion':'2.18.0','distributionRevision':'2.18.0',
                'baseVersion':'2.17.0','baseManifestSha256':BASE_PIN,
                'packedCatalogSha256':baseline['packedCatalogSha256'],'files':files}
    (ROOT / 'tests/expected_release_v2180.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
