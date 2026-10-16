"""Match the two adjustment controls and bind their status to the current draft."""


def replace_once(source, old, new):
    if source.count(old) != 1:
        raise ValueError("UI patch anchor count: " + repr(old[:100]))
    return source.replace(old, new, 1)


def apply(source):
    pure = r'''    function v211FreshnessKey(options={}) {
        const keys=[...Object.keys(DEFAULTS),'namespaceNumber','pageTitle','sectionOnly','pageRedirect','pageDisambiguation',
            'spellingAllowedWords','spellingIgnoredRules'];
        return JSON.stringify([...new Set(keys)].sort().map(key=>[key,Array.isArray(options[key])?[...options[key]].sort():options[key]??null]));
    }
    function v211FreshnessSame(saved,current) {
        return !!saved&&!!current&&saved.editor===current.editor&&saved.source===current.source&&
            saved.revision===current.revision&&saved.title===current.title&&saved.section===current.section&&saved.options===current.options;
    }
'''
    source = replace_once(source, "    function mechanicalMinorResult(source,options={}) {", pure + "    function mechanicalMinorResult(source,options={}) {")
    source = replace_once(source, "        v27RetainedTypes, v27RawDiff,", "        v211FreshnessKey,v211FreshnessSame,\n        v27RetainedTypes, v27RawDiff,")
    runtime = r'''    let v211CheckedDraft=null;
    function v211FreshnessCurrent() {
        if(!$||!panel)return null;
        const adapter=editor();
        return adapter?{editor:adapter.id,source:adapter.read(),revision:baseRevision(),title:currentTitle(),
            section:editingSection(),options:v211FreshnessKey(currentOptions(false))}:null;
    }
    function v211SyncFreshness() {
        const current=v211FreshnessCurrent(),checked=v211FreshnessSame(v211CheckedDraft,current);
        if(!checked)v211CheckedDraft=null;
        const controls=[panel?.querySelector('.ajg-run'),publishAdjustment].filter(Boolean);
        for(const control of controls){
            control.classList.toggle('ajg-code-checked',checked);
            if(control.dataset.codeChecked!==String(checked))control.dataset.codeChecked=String(checked);
            const label=checked?'Código conferido':'Ajustar código';
            if(control.textContent!==label)control.textContent=label;
            control.title=checked?'Este texto já foi analisado com estas opções. Clique para repetir a análise e atualizar as verificações públicas.':
                'Aplicar os ajustes do RevisaWiki ao rascunho. Confira o resultado antes de publicar.';
            control.setAttribute('aria-label',checked?'Código conferido. Ajustar código novamente com RevisaWiki':'Ajustar código com RevisaWiki');
        }
    }
    function v211MarkCheckedDraft(adapter,result,compareOnly,optionsKey) {
        const current=v211FreshnessCurrent();
        if(compareOnly||!current||adapter.id!==current.editor||current.source!==result.text||current.options!==optionsKey||
            result.syntaxIsolation||['rollback','local-rollback'].includes(result.previewCheck?.status))return;
        v211CheckedDraft=current;v211SyncFreshness();
    }
'''
    declarations = "    let $ = null, last = null, panel = null, panelEditor = null, publishAdjustment = null, inlineController = null;\n"
    source = replace_once(source, declarations + "    const inlineLoadAttempt = null;", declarations + runtime + "    const inlineLoadAttempt = null;")
    source = replace_once(source, "    function savePreferences() {", "    function savePreferences() {\n        v211SyncFreshness();")
    source = replace_once(source, "    function updateAppliedResult() {\n        if (!panel || stylesMode) return;", "    function updateAppliedResult() {\n        if (!panel || stylesMode) return;\n        v211SyncFreshness();")
    source = replace_once(source, "        const before = adapter.read();\n        if(last&&last.id===adapter.id&&last.after!==before)", "        const before = adapter.read();\n        const checkedOptions=v211FreshnessKey(currentOptions(false));\n        v211CheckedDraft=null;v211SyncFreshness();\n        if(last&&last.id===adapter.id&&last.after!==before)")
    source = replace_once(source, "            showReport(result);\n            if (result.text === before) { panel.querySelector('.ajg-diff')", "            showReport(result);\n            v211MarkCheckedDraft(adapter,result,compareOnly,checkedOptions);\n            if (result.text === before) { panel.querySelector('.ajg-diff')")
    source = replace_once(source, "        } catch (error) { if (localTask === task) message(error.message); }\n        finally { finishLocalAnalysis(task); }\n    }\n    async function runSpelling()", "        } catch (error) { v211CheckedDraft=null;v211SyncFreshness();if (localTask === task) message(error.message); }\n        finally { finishLocalAnalysis(task); }\n    }\n    async function runSpelling()")
    source = replace_once(source, "        publishAdjustment.disabled = localBusy || onlineBusy;\n    }", "        publishAdjustment.disabled = localBusy || onlineBusy;\n        v211SyncFreshness();\n    }")
    source = replace_once(source, "'mw-ui-progressive ajg-run'", "'ajg-run'")
    css = r'''        style.textContent += '\n#revisawiki-ptwiki .ajg-run,#revisawiki-adjust-before-publish{background:#12776b;border-color:#12776b;color:#fff;font-weight:600}\n#revisawiki-ptwiki .ajg-run:hover:not(:disabled),#revisawiki-adjust-before-publish:hover:not(:disabled){background:#0d5d54;border-color:#0d5d54}\n#revisawiki-ptwiki .ajg-run:active:not(:disabled),#revisawiki-adjust-before-publish:active:not(:disabled){background:#09463f;border-color:#09463f}\n#revisawiki-ptwiki .ajg-run.ajg-code-checked,#revisawiki-adjust-before-publish.ajg-code-checked{background:#e8f3ee;border-color:#88b3a1;color:#22513f}\n#revisawiki-ptwiki .ajg-run.ajg-code-checked:hover:not(:disabled),#revisawiki-adjust-before-publish.ajg-code-checked:hover:not(:disabled){background:#d7eade;border-color:#668f7c}\n#revisawiki-ptwiki .ajg-run:disabled,#revisawiki-adjust-before-publish:disabled{background:#eaecf0;border-color:#c8ccd1;color:#72777d;cursor:default}\n';
'''
    source = replace_once(source, "        root.document.head.appendChild(style);\n    }\n    // O segundo atalho", css + "        root.document.head.appendChild(style);\n    }\n    // O segundo atalho")
    source = replace_once(source, "    root.document.addEventListener('change',onMinorManualChange);", "    root.document.addEventListener('change',onMinorManualChange);\n    root.document.addEventListener('change',()=>v211SyncFreshness());")
    return source
