"""Build reviewed automatic repairs and a quiet report from pinned 2.16.0."""
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
BASE = ROOT / 'dist/2.16.0'
OUT = ROOT / 'dist/2.17.0'
BASE_PIN = 'd624e61cb576241ab6480b24d3bc43cfa1c5bc6b655bb7571d1413741f02d5ea'


def once(source, old, new):
    assert source.count(old) == 1, 'Pinned integration anchor differs: ' + old[:100]
    return source.replace(old, new, 1)


def load_patch(name):
    path = ROOT / 'src/v2_17' / name
    spec = importlib.util.spec_from_file_location('v217_' + path.stem, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def delegate(source, name, replacement, signature):
    header = '    function ' + name + signature + ' {'
    legacy = 'v217Legacy' + name[0].upper() + name[1:]
    source = once(source, header, '    function ' + legacy + signature + ' {')
    wrapper = header + '\n        return ' + replacement + '(...arguments);\n    }\n'
    return once(source, '    function ' + legacy + signature + ' {', wrapper + '    function ' + legacy + signature + ' {')


def patch(source):
    names = ('reference_tables.js', 'infobox_values.js', 'integration.js')
    helpers = '\n'.join((ROOT / 'src/v2_17' / name).read_text() for name in names)
    source = once(source, '    function auxiliaryParameters(raw, bump, warn) {', helpers + '\n    function auxiliaryParameters(raw, bump, warn) {')
    source = once(source, '        automaticBiographyFields: true,', '        automaticInfoboxValues: true,\n        automaticBiographyFields: true,')
    source = delegate(source, 'v213NativeRefAttributeEdits', 'v217NativeRefAttributeEdits', '(source,cfg={})')
    source = delegate(source, 'v213ReferenceAttributeCountEdits', 'v217ReferenceAttributeCountEdits', '(source)')
    source = delegate(source, 'v213TableFiniteRepairEdits', 'v217TableFiniteRepairEdits', '(source,cfg={},collectOnly=false)')
    source = once(source, "        stage('v28-biography-fields',s=>v28BiographyFieldEdits(s,cfg));", "        stage('v217-infobox-values',s=>v217InfoboxValueEdits(s,cfg));\n        stage('v28-biography-fields',s=>v28BiographyFieldEdits(s,cfg));")
    source = once(source, "            stage('v216-field-values',s=>v216FieldValueEdits(s,cfg));", "            stage('v216-field-values',s=>v216FieldValueEdits(s,cfg));\n            stage('v217-infobox-values',s=>v217InfoboxValueEdits(s,cfg));")
    source = once(source, '        auxiliaryParameters:', '        v217InfoboxParameterAccents:"Nome inválido de campo da infocaixa corrigido",\n        v217InfoboxEmptyAliases:"Alias vazio redundante da infocaixa retirado",\n        auxiliaryParameters:')
    source = once(source, '        if(!options.v216RetainedCountSkip){const count=', '        if(!options.v217RetainedCountSkip){const count=v217RetainedCount(before,after,topics,kinds,options);if(count)return count;}\n        if(!options.v216RetainedCountSkip){const count=')
    source = once(source, '        const newBiographyObjects=v216BiographyObjectProof(plan,expected,actual);', '        const v217Objects=v217InfoboxObjectProof(plan,expected,actual);if(!v217Objects.accepted)return reject(v217Objects.reason);\n        const newBiographyObjects=v216BiographyObjectProof(plan,expected,actual);')
    source = once(source, "step.name.startsWith('v216-'))&&Array.isArray(edit.proof?.changeRules)", "step.name.startsWith('v216-')||step.name.startsWith('v217-'))&&Array.isArray(edit.proof?.changeRules)")
    source = once(source, "        stage('v216-mechanical-presentation',s=>v216MechanicalPresentation(s,cfg));", "        stage('v217-mechanical-presentation',s=>v217MechanicalPresentation(s,cfg));\n        stage('v216-mechanical-presentation',s=>v216MechanicalPresentation(s,cfg));")
    source = once(source, 'v216FieldValuePlan,v216TransferPlan]){', 'v216FieldValuePlan,v216TransferPlan,v217InfoboxValuePlan]){')
    source = once(source, 'cfg.automaticBiographyFields].every(value=>value===false)', 'cfg.automaticBiographyFields,cfg.automaticInfoboxValues].every(value=>value===false)')
    exports = ','.join(re.findall(r'^    function (v217\w+|automaticInfoboxValues)\(', helpers, re.M))
    source = once(source, '        v212ReferenceFieldScope,v212LiteralCitationFields,', '        ' + exports + ',\n        v212ReferenceFieldScope,v212LiteralCitationFields,')
    source = load_patch('reference_tables_patch.py').apply(source)
    source = load_patch('quiet_report_patch.py').apply(source)
    start = source.index(' * A versão 2.16 corrige o preenchimento')
    end = source.index(' * Licença:', start)
    source = source[:start] + (' * A versão 2.17 reduz os avisos do relatório e corrige casos\n'
                              ' * comprovados de referências, tabelas e campos de infocaixas.\n'
                              ' * O relatório mostra somente pendências confirmadas no texto\n'
                              ' * final, sem repetir recusas de ajustes ou consultas inconclusivas.\n') + source[end:]
    return source


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    args = parser.parse_args()
    assert args.node, 'Set REVISAWIKI_NODE or pass --node.'
    raw = (ROOT / 'tests/expected_release_v2160.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE_PIN
    baseline = json.loads(raw)
    OUT.mkdir(parents=True, exist_ok=True)
    names = {name: name.replace('_v2_16_0', '_v2_17_0') for name in baseline['files']}
    files = {}
    for name, proof in baseline['files'].items():
        original = (BASE / name).read_bytes()
        assert len(original) == proof['bytes'] and hashlib.sha256(original).hexdigest() == proof['sha256']
        text = original.decode('utf-8')
        if name in ('RevisaWiki_v2_16_0.js', 'RevisaWiki_v2_16_0_completo.js'):
            text = patch(text)
        text = text.replace('2.16.0', '2.17.0')
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
    for name in ('RevisaWiki_v2_17_0.js', 'RevisaWiki_v2_17_0_dados.js'):
        assert files[name]['bytes'] < 2097152
    archived = json.loads((BASE / 'ARQUIVOS.json').read_text())['files']
    for path in sorted(BASE.glob('Catalogo_*.json')):
        raw = path.read_bytes()
        assert hashlib.sha256(raw).hexdigest() == archived[path.name]['sha256']
        catalog = json.loads(raw)
        catalog['releaseVersion'] = catalog['distributionVersion'] = '2.17.0'
        if 'releaseCoreSha256' in catalog:
            catalog['releaseCoreSha256'] = files['RevisaWiki_v2_17_0.js']['sha256']
        (OUT / path.name.replace('_v2_16_0', '_v2_17_0')).write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    manifest = {'version':'2.17.0','runtimeVersion':'2.17.0','distributionRevision':'2.17.0',
                'baseVersion':'2.16.0','baseManifestSha256':BASE_PIN,
                'packedCatalogSha256':baseline['packedCatalogSha256'],'files':files}
    (ROOT / 'tests/expected_release_v2170.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
