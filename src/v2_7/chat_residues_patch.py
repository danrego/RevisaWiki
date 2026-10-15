"""Extend only the finite, source-bound article copy-residue rules."""
from pathlib import Path


def _replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Copy-residue integration anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    source = _replace(source, '```(wiki|wikitext|mediawiki)?',
                      '```(wiki|wikitext|mediawiki|wiketext|wikitex)?')
    module = Path(__file__).with_name('chat_residues.js').read_text()
    source = _replace(source, '    function removeKnownTranslationResidues(source,cfg,bump,warn) {',
                      module + '\n    function removeKnownTranslationResidues(source,cfg,bump,warn) {')
    source = _replace(source, '        return repairDoubleEncodedAmpersands(next,cfg,bump,warn);',
                      '        next=repairDoubleEncodedAmpersands(next,cfg,bump,warn);\n        return removeChatCopyResidues(next,cfg,bump);')
    source = _replace(source,
                      'for (const planner of [wholeArticleMarkdownFenceEdits,obsoleteShortDescriptionCategoryEdits,doubleEncodedAmpersandEdits])',
                      'for (const planner of [wholeArticleMarkdownFenceEdits,obsoleteShortDescriptionCategoryEdits,doubleEncodedAmpersandEdits,v27ChatCopyEdits])')
    source = _replace(source,
                      "        stage('mixed-template-closers',s=>{const edits=v25SafeMixedTemplateEdits(s);if(!edits.length)return edits;",
                      "        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));\n        stage('mixed-template-closers',s=>{const edits=v25SafeMixedTemplateEdits(s);if(!edits.length)return edits;")
    source = _replace(source, '        removeKnownTranslationResidues,knownTranslationResidueChanges,',
                      '        v27ChatCopyEdits,v27ChatCopyPlan,v27ChatCopyProof,v27WholeArticleWrapperEdits,removeChatCopyResidues,\n        removeKnownTranslationResidues,knownTranslationResidueChanges,')
    return source
