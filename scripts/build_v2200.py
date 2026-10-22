"""Rebuild 2.20 from the pinned public 2.19.1 distribution and reviewed fragments."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'dist/2.19.1'
OUT = ROOT / 'dist/2.20.0'
HELPERS = ['citation_repairs.js', 'structure_repairs.js', 'biography_portals.js', 'integration.js', 'ui_preflights.js']

def sha(value):
    return hashlib.sha256(value).hexdigest()

def once(source, before, after):
    assert source.count(before) == 1, 'Integration anchor differs: ' + before[:100]
    return source.replace(before, after, 1)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
    parser.add_argument('--output', type=Path, default=OUT)
    parser.add_argument('--manifest', type=Path, default=ROOT / 'tests/expected_release_v2200.json')
    args = parser.parse_args()
    assert args.node
    baseline = json.loads((ROOT / 'tests/expected_release_v2191.json').read_text())
    inputs = {str(Path('src/v2_20') / name): (ROOT / 'src/v2_20' / name).read_bytes() for name in HELPERS}
    helper = '\n'.join(value.decode() for value in inputs.values())
    header = ROOT / 'src/v2_20/header.txt'
    for path in [header, Path(__file__), ROOT / 'scripts/v220_compact.cjs', ROOT / 'package-lock.json']:
        inputs[str(path.relative_to(ROOT))] = path.read_bytes()
    output = args.output.resolve()
    output.mkdir(exist_ok=True, parents=True)
    files, proofs = {}, []
    for name, pin in baseline['files'].items():
        original = raw = (BASE / name).read_bytes()
        assert len(raw) == pin['bytes'] and sha(raw) == pin['sha256'], name
        text = raw.decode()
        if name in ['RevisaWiki_v2_19_1.js', 'RevisaWiki_v2_19_1_completo.js']:
            start = text.index('/*\n * RevisaWiki para a ptwiki, versão ')
            end = text.index('*/', start) + 2
            text = text[:start] + header.read_text().rstrip() + text[end:]
            for before, after in [
                ('    function* cleanupStages(source, options) {', '    function* v220LegacyCleanupStages(source, options) {'),
                ('    function preservationAudit(before,after,options={}) {', '    function v220LegacyPreservationAudit(before,after,options={}) {'),
                ('    function safeComposition(before,after,options={}) {', '    function v220LegacySafeComposition(before,after,options={}) {'),
                ('    function referenceAudit(source, options = {}) {', '    function v220LegacyReferenceAudit(source, options = {}) {'),
                ('    function reviewSuggestions(source, cfg) {', '    function v220LegacyReviewSuggestions(source, cfg) {'),
                ('    function normalizeRefs(s, cfg, bump, warn) {', '    function v220BaselineNormalizeRefs(s, cfg, bump, warn) {'),
                ('    function v211RetainedAdjustments(before,after,kinds=[],options={}) {', '    function v220BaselineRetainedAdjustments(before,after,kinds=[],options={}) {'),
                ('    function v28BiographyFieldPlan(raw,cfg={}) {', '    function v220BaselineBiographyFieldPlan(raw,cfg={}) {'),
                ('    function v2151BiographyImageAltPlan(source,cfg={}) {', '    function v220BaselineBiographyImageAltPlan(source,cfg={}) {'),
                ('    function v218CitationKeyValue(field,rule) {', '    function v220LegacyCitationKeyValue(field,rule) {'),
                ('    function v218CitationKeyEdits(source,options={}) {', '    function v220LegacyCitationKeyEdits(source,options={}) {'),
            ]:
                text = once(text, before, after)
            text = once(text, r'!/[{}\[\]<>|\r\n\uE000]/.test(years[0].value)', 'v220CitationYearKeyValue(years[0])')
            text = once(text, '    function* calculationSteps(job) {', helper + '\n    function* calculationSteps(job) {')
            text = once(text, "result = yield* cleanupStages(job.source, job.kind === 'refresh' ? {...cfg, review: false} : cfg);", "result = yield* cleanupStages(job.source, job.kind === 'refresh' ? {...cfg, review: false} : cfg, job.kind !== 'refresh');")
            text = once(text, 'const cfg = await prepareHeadingMainArticles(task,options);', 'const cfg = await v220PrepareHeadingReferences(task,await prepareHeadingMainArticles(task,options));')
            text = once(text, 'const prepared = await prepareBirthCategory(task,await prepareBiographyGender(', 'const prepared = await v220PrepareHumanIdentity(task,await prepareBirthCategory(task,await prepareBiographyGender(')
            text = once(text, 'await prepareMinorBaseline(task,proofs))))));', 'await prepareMinorBaseline(task,proofs)))))));')
            text = once(text, "'headingMainArticleProofSource','birthCategoryContext','birthCategoryProof','leadImageProof']) {", "'headingMainArticleProofSource','birthCategoryContext','birthCategoryProof','leadImageProof','v220HeadingReferenceProofs','v220HumanProof']) {")
            text = once(text, "(['authorityData','footerProfiles','biographyGenderProof','birthCategoryContext','birthCategoryProof','leadImageProof'].includes(key)", "(['authorityData','footerProfiles','biographyGenderProof','birthCategoryContext','birthCategoryProof','leadImageProof','v220HumanProof'].includes(key)")
            text = once(text, '    const api = {inlineHelpers:', '    const api = {v220CitationFragmentMayBeParameter,v220RawReferenceAttributeBoundary,v220LegacyTablePrerequisitePlan,v220LegacyTablePrerequisiteProof,v220RepairPlan,v220RepairProof,v220StructurePlan,v220StructureProof,v220CitationPlan,v220CitationPlanProof,v220CitationCall,v220CitationFields,v220CitationRefTagEdits,v220CitationDefinitionInventory,v220FilterReferenceFindings,v220HeadingReferenceRequests,v220HeadingReferenceHtmlProof,v220FilterCitationSuggestions,v220BiographyPlan,v220BiographyProof,v220BioNodes,v220BioPrincipal,v220BioFieldEdits,v220BioPortalCandidates,v220BioPortalCleanup,v220BioWebsiteValue,v220BioMediaEdits,v220BioUrlCallEdits,v220BioLiteralFields,inlineHelpers:')
        text = text.replace('2.19.1', '2.20.0').replace('_v2_19_1', '_v2_20_0')
        target = output / name.replace('_v2_19_1', '_v2_20_0')
        if name == 'RevisaWiki_v2_19_1.js':
            temporary = ROOT / 'artifacts/v220/build/core_uncompacted.js'
            temporary.parent.mkdir(parents=True, exist_ok=True)
            temporary.write_text(text)
            receipt = temporary.with_name('COMPACT_PROOF.json')
            subprocess.run([args.node, str(ROOT / 'scripts/v220_compact.cjs'), '--input=' + str(temporary), '--output=' + str(target), '--receipt=' + str(receipt)], check=True)
            proofs.append(json.loads(receipt.read_text()))
        else:
            target.write_text(text)
        emitted = target.read_bytes()
        subprocess.run([args.node, '--check', str(target)], check=True)
        if name.startswith('Chamada_fixa_'):
            assert emitted == original
        files[target.name] = {'bytes': len(emitted), 'sha256': sha(emitted)}
    for name in ['RevisaWiki_v2_20_0.js', 'RevisaWiki_v2_20_0_dados.js']:
        assert files[name]['bytes'] < 2097152, name
    manifest = {'version': '2.20.0', 'runtimeVersion': '2.20.0', 'distributionRevision': '2.20.0', 'baseVersion': '2.19.1',
                'baseManifestSha256': sha((ROOT / 'tests/expected_release_v2191.json').read_bytes()), 'packedCatalogSha256': baseline['packedCatalogSha256'],
                'files': files, 'sourceInputs': {name: {'bytes': len(value), 'sha256': sha(value)} for name, value in inputs.items()}, 'compactSourceProofs': proofs}
    args.manifest.parent.mkdir(exist_ok=True, parents=True)
    args.manifest.write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({'version': '2.20.0', 'files': files}, indent=2))

if __name__ == '__main__':
    main()
