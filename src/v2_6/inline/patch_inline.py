"""Exact-anchor integration for the pinned 2.5/retagged 2.6 core. No network."""
from pathlib import Path
import json
HERE=Path(__file__).resolve().parent

def patch(source):
    def replace(old,new):
        nonlocal source
        count=source.count(old)
        if count != 1: raise ValueError(f'inline anchor count {count}: {old[:100]}')
        source=source.replace(old,new,1)
    # Isolated sections must not acquire whole-page collectors or footer layouts.
    replace('    function endMatterPass(s, bump, warn, cfg = {}) {\n        const context', '    function endMatterPass(s, bump, warn, cfg = {}) {\n        if (cfg.sectionOnly) return s;\n        const context')
    replace('        if(!cfg.references || !cfg.unifiedNotesReferences)return s;', '        if(!cfg.references || !cfg.unifiedNotesReferences || cfg.sectionOnly)return s;')
    replace('        if (!cfg.endMatter || !cfg.endMatterColumns) return source;', '        if (!cfg.endMatter || !cfg.endMatterColumns || cfg.sectionOnly) return source;')
    replace('        if (!cfg.review || !cfg.externalLinkColumns || !cfg.endMatter) return [];', '        if (!cfg.review || !cfg.externalLinkColumns || !cfg.endMatter || cfg.sectionOnly) return [];')
    replace('    const api = {v25LeadTitle,v25LeadHeadingPlan,automaticLeadHeadingCleanup,',
            (HERE/'inline_controller.js').read_text()+'\n    const api = {inlineHelpers:v26InlineHelpers,createInlineController:v26CreateInlineController,\n        v25LeadTitle,v25LeadHeadingPlan,automaticLeadHeadingCleanup,')
    replace('    let $ = null, last = null, panel = null, panelEditor = null, publishAdjustment = null;',
            '    let $ = null, last = null, panel = null, panelEditor = null, publishAdjustment = null, inlineController = null;\n    const inlineLoadAttempt = root.RevisaWikiInlinePending || null;')
    replace('    function editor() {\n        const target = root.ve',
            '    function editor() {\n        if (inlineController?.context()) return inlineController.adapter();\n        const target = root.ve')
    replace('    function summaryEditor() {\n        const target = sourceTarget();',
            '    function summaryEditor() {\n        if (inlineController?.context()) return inlineController.summaryAdapter();\n        const target = sourceTarget();')
    replace('    function currentOptions(trace) {\n        return pageContextOptions(',
            '    function currentOptions(trace) {\n        const inline = inlineController?.context();\n        return pageContextOptions(')
    replace("namespaceNumber: Number(mw.config.get('wgNamespaceNumber')), pageTitle: currentTitle(),\n            pageRedirect: !!mw.config.get('wgIsRedirect'), pageDisambiguation: !!mw.config.get('wgIsDisambiguationPage')});",
            "namespaceNumber: inline ? inline.namespace : Number(mw.config.get('wgNamespaceNumber')), pageTitle: currentTitle(),\n            pageRedirect: inline ? false : !!mw.config.get('wgIsRedirect'), pageDisambiguation: inline ? false : !!mw.config.get('wgIsDisambiguationPage')});")
    replace('    function showReport(result) {\n        lastLocalResult = result;', '''    function showReport(result) {
        const inline = inlineController?.context();
        if (inline && typeof result.text === 'string') {
            const context = composeSection(inline.pageSource,inline.sections,inline.section,result.text);
            const references = referenceAudit(context.text,currentOptions(false)).filter(f=>f.code==='missing-renderer' ||
                f.start>=context.start && f.start<context.end).map(f=>({...f,start:f.start>=context.start?f.start-context.start:-1}));
            const warnings = (result.warnings||[]).filter(w=>{
                const missing=w.match(/^Referência \"([^\"]+)\" sem definição/);
                return !missing || references.some(f=>f.code==='missing-definition' && f.message.startsWith('Referência \"'+missing[1]+'\" sem definição'));
            });
            result={...result,audit:references,warnings,localReports:{...(result.localReports||{}),references}};
        }
        lastLocalResult = result;''')
    replace("    function currentTitle() { return (mw.config.get('wgPageName') || mw.config.get('wgTitle') || 'RevisaWiki/Testes').replace(/_/g, ' '); }",
            "    function currentTitle() { return inlineController?.context()?.title || (mw.config.get('wgPageName') || mw.config.get('wgTitle') || 'RevisaWiki/Testes').replace(/_/g, ' '); }")
    replace("    function baseRevision() {\n        for (const id", "    function baseRevision() {\n        if (inlineController?.context()) return inlineController.context().base;\n        for (const id")
    replace("    function editingSection() {\n        const element", "    function editingSection() {\n        if (inlineController?.context()) return inlineController.context().section;\n        const element")
    replace("    async function draftContext(session, source) {\n        if (session.section", "    async function draftContext(session, source) {\n        if (inlineController?.context() && inlineController.adapter()?.id === session.adapter?.id) return inlineController.draftContext(session, source);\n        if (session.section")
    replace("    function minorCheckbox(){const box=root.document.getElementById('wpMinoredit');return box?.type==='checkbox'&&!box.disabled?box:null;}",
            "    function minorCheckbox(){const box=inlineController?.context()?.minor || root.document.getElementById('wpMinoredit');return box?.type==='checkbox'&&!box.disabled?box:null;}")
    replace("    function mount() {\n        if (stylesMode)", "    function mount() {\n        inlineController?.mount(root.document);\n        inlineController?.restoreNativeDraft();\n        if (stylesMode)")
    replace("        const namespace=Number(mw.config.get('wgNamespaceNumber'));\n        const introText=", "        const namespace=inlineController?.context()?.namespace ?? Number(mw.config.get('wgNamespaceNumber'));\n        const introText=")
    replace("        const anchor = sourceVE || classic;", "        const anchor = inlineController?.context()?.editorSlot?.querySelector('.rw26-source') || sourceVE || classic;")
    replace("        root.document.getElementById('wpTextbox1')?.addEventListener('input', changed);", "        (inlineController?.adapter()?.id || root.document.getElementById('wpTextbox1'))?.addEventListener('input', changed);")
    replace("    mw.loader.using(['jquery.textSelection', 'mediawiki.util', 'mediawiki.api', 'mediawiki.ForeignApi']).then(function () {",
            "    mw.loader.using(['jquery.textSelection', 'mediawiki.util', 'mediawiki.api', 'mediawiki.ForeignApi', 'mediawiki.confirmCloseWindow']).then(function () {")
    replace("        $(mount);\n        mw.hook('wikipage.content').add(mount);", """        inlineController = v26CreateInlineController(root,mw,{
            composeSection,sectionRange,config:personalConfig,isBusy:()=>localBusy||onlineBusy,
            cancel(){cancelLocalAnalysis();cancelCheck();},editorChanged:mount});
        api.inlineEditing = inlineController;
        $(mount);
        mw.hook('wikipage.content').add(mount);""")
    replace("        api.uiStatus = 'ready';\n    }).catch(function (error) {", """        api.uiStatus = 'ready';
        const pendingInline = root.RevisaWikiInlinePending;
        if (pendingInline && typeof pendingInline.href === 'string') {
            root.RevisaWikiInlineLoadSettled?.(pendingInline);
            if(root.RevisaWikiInlinePending===pendingInline)root.RevisaWikiInlinePending = null;
            root.document.querySelectorAll('.rw26-lazy-launch').forEach(item=>item.remove());
            inlineController.open(pendingInline.href,pendingInline.anchor);
        }
    }).catch(function (error) {""")
    replace("        api.uiStatus = 'error';\n        root.console.error", "        api.uiStatus = 'error';\n        root.RevisaWikiInlineLoadFailed?.(inlineLoadAttempt,'A interface não ficou disponível. Recarregue a página ou use a edição normal.');\n        root.console.error")
    return source

if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');args=p.parse_args()
    Path(args.output).write_text(patch(Path(args.source).read_text()))
