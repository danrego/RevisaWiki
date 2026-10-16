"""Connect the anonymous category check to the existing editor and Worker."""
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Birth category runtime anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    module = Path(__file__).with_name('runtime.js').read_text()
    source = replace(source, '    function currentOptions(trace) {', module + '\n    function currentOptions(trace) {')
    source = replace(source, 'return pageContextOptions({...presetOptions(preferences.preset, preferences.overrides)', 'return birthCategoryRuntimeOptions(pageContextOptions({...presetOptions(preferences.preset, preferences.overrides)')
    source = replace(source, "pageRedirect: inline ? false : !!mw.config.get('wgIsRedirect'), pageDisambiguation: inline ? false : !!mw.config.get('wgIsDisambiguationPage')});", "pageRedirect: inline ? false : !!mw.config.get('wgIsRedirect'), pageDisambiguation: inline ? false : !!mw.config.get('wgIsDisambiguationPage')}));")
    source = replace(source, "const prepared = await prepareBiographyGender(task,await prepareLivingCategory(task,await prepareEndMatter(task, await prepareReferenceColumns(task,await prepareMinorBaseline(task,proofs)))));", "const prepared = await prepareBirthCategory(task,await prepareBiographyGender(task,await prepareLivingCategory(task,await prepareEndMatter(task, await prepareReferenceColumns(task,await prepareMinorBaseline(task,proofs))))));")
    source = replace(source, "'headingMainArticleProofs','headingMainArticleProofSource'])", "'headingMainArticleProofs','headingMainArticleProofSource','birthCategoryContext','birthCategoryProof'])")
    source = replace(source, "['authorityData','footerProfiles','biographyGenderProof'].includes(key)", "['authorityData','footerProfiles','biographyGenderProof','birthCategoryContext','birthCategoryProof'].includes(key)")
    source = replace(source, 'serializableOptions(confirmedMinorOptions(task,job))', 'serializableOptions(birthCategoryRuntimeOptions(confirmedMinorOptions(task,job)))')
    return source
