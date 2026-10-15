"""Builder hooks for the browser core, module bootstrap and common.js loaders."""
from pathlib import Path
import importlib.util,re
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('revisawiki_inline_patch',HERE/'patch_inline.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)

def apply(source):
    return mod.patch(source)

def once(source,old,new):
    count=source.count(old)
    if count!=1:raise ValueError(f'inline bootstrap/loader anchor count {count}: {old[:100]}')
    return source.replace(old,new,1)

def patch_bootstrap(source):
    source=once(source,"        if (root.RevisaWiki || root.RevisaWikiModuleLoading) return;\n        root.RevisaWikiModuleLoading = true;", "        if (root.RevisaWiki) return;\n        if (root.RevisaWikiModuleLoading) return root.RevisaWikiModulePromise;\n        root.RevisaWikiModuleLoading = true;\n        root.RevisaWikiModuleError = null;\n        const inlineLoadAttempt = root.RevisaWikiInlinePending || null;")
    source=once(source,"            root.RevisaWikiModuleError = error.message;", "            root.RevisaWikiModuleError = error.message;\n            root.RevisaWikiInlineLoadFailed?.(inlineLoadAttempt);")
    source=once(source,"    const action = root.mw.config?.get('wgAction');",(HERE/'read_launcher.js').read_text()+"\n    root.RevisaWikiLoadInline = load;\n    v26InstallReadLauncher(root,root.mw,load);\n    const action = root.mw.config?.get('wgAction');")
    return once(source,"    if (['edit','submit'].includes(action) || root.document?.getElementById('wpTextbox1')) root.RevisaWikiModulePromise=load();","    if (['edit','submit'].includes(action) || root.document?.getElementById('wpTextbox1') || root.RevisaWikiInlinePending) root.RevisaWikiModulePromise=load();")

def patch_loader(source):
    source=once(source,'    let started = false;', '    let started = false, loadingPromise = null, ownedLoadInfo = null;')
    source=once(source,'        if (started) return;\n        started = true;', '        if (started) return loadingPromise;')
    source=once(source,'        if (previous) {', '        if (previous && previous!==ownedLoadInfo) {')
    source=once(source,"        window.RevisaWikiLoadInfo = {expectedVersion,requests:1,state:'loading'};", "        started = true;\n        const inlineLoadAttempt = window.RevisaWikiInlinePending || null;\n        const loadInfo = {expectedVersion,requests:1,state:'loading'};\n        ownedLoadInfo = loadInfo;\n        window.RevisaWikiLoadInfo = loadInfo;")
    source=once(source,"        if (!user) { window.RevisaWikiLoadInfo.state = 'logged-out'; return; }", "        if (!user) { loadInfo.state = 'logged-out'; started=false; window.RevisaWikiInlineLoadFailed?.(inlineLoadAttempt,'Entre na sua conta ou use a edição normal.'); return; }")
    pattern=r"        mw\.loader\.getScript\(([\s\S]*?)\)\.then\(async function \(\) \{"
    matches=list(re.finditer(pattern,source))
    if len(matches)!=1:raise ValueError('Expected one core loader promise')
    m=matches[0]
    source=source[:m.start()]+"        loadingPromise = (window.RevisaWikiModuleReady && typeof window.RevisaWikiLoadInline==='function' ? Promise.resolve().then(()=>{window.RevisaWikiModulePromise=window.RevisaWikiLoadInline();return window.RevisaWikiModulePromise;}) : mw.loader.getScript("+m[1]+")).then(async function () {"+source[m.end():]
    source=once(source,"            const script = window.RevisaWiki;\n            window.RevisaWikiLoadInfo.state =", "            if(ownedLoadInfo!==loadInfo)return;\n            const script = window.RevisaWiki;\n            loadInfo.state =")
    source=once(source,"            if (!script && !window.RevisaWikiModuleReady) mw.notify", "            if (!script && (window.RevisaWikiModuleError || !window.RevisaWikiModuleReady)) {started=false;window.RevisaWikiInlineLoadFailed?.(inlineLoadAttempt);}\n            if (!script && !window.RevisaWikiModuleReady) mw.notify")
    source=once(source,"        }).catch(function () {\n            window.RevisaWikiLoadInfo.state = 'error';", "        }).catch(function () {\n            if(ownedLoadInfo!==loadInfo)return;\n            started=false; loadInfo.state = 'error';\n            window.RevisaWikiInlineLoadFailed?.(inlineLoadAttempt);")
    source=once(source,"        });\n    }\n    if (['edit','submit']", "        });\n        return loadingPromise;\n    }\n    if (['edit','submit']")
    return once(source,"    if (['edit','submit'].includes(mw.config.get('wgAction')) || document.getElementById('wpTextbox1')) loadRevisaWiki();",(HERE/'read_launcher.js').read_text()+"\n    v26InstallReadLauncher(window,mw,loadRevisaWiki);\n    if (['edit','submit'].includes(mw.config.get('wgAction')) || document.getElementById('wpTextbox1')) loadRevisaWiki();")
