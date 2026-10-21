"""Reconstruct the audit release from the exact preceding distribution."""
from pathlib import Path
import argparse, hashlib, json, os, re, shutil, subprocess, sys
from v219_catalogs import packed_data, apply_packed, json_catalog, canonical
from v219_citation_catalog import apply_expanded_citation_targets, apply_packed_citation_targets

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'dist/2.18.0'
OUT=ROOT/'dist/2.19.0'
BASE_PIN='992cd2efe4a460270601c93f825164771fa50f8ef6c9c916c1ed01319406cb67'
HELPERS=('source_context.js','reader_performance.js','reference_collectors.js','source_compatibility.js','citation_people_safety.js','native_topic_emitters.js','portal_evidence_safety.js','option_safety.js','translation_safety.js','date_wrapper_safety.js','short_citation_safety.js','positional_safety.js','biography_date_aliases.js','media_context_safety.js','citation_semantic_signature.js','reference_binding_guard.js','preservation_equivalence.js','citation_date_boundaries.js','caption_safety.js','native_field_quarantine.js','native_person_alias.js','occupation_field_safety.js','table_span_safety.js','browser_yield.js','reference_stage_atomicity.js','native_r_numeric_names.js','reference_identity_stage_safety.js','stage_safety.js','late_marriage.js','native_age_fields.js','late_composition.js','structural_inventory_equivalence.js','maintenance_safety.js','late_biography_dates.js','opaque_owner_links.js','ui_context_safety.js','ui_presentation.js','foreign_reference_banks.js','native_helper_cosmetic_safety.js','native_nested_citation_source.js','partial_reference_guards.js','native_local_alias_safety.js','template_header_safety.js','unified_notes_safety.js','citation_import_safety.js','ui_apply_safety.js','foreign_infobox_safety.js','native_harvard_key_safety.js','reader_lookup_fastpaths.js','reference_first_letter.js','reference_quotation_recovery.js','official_url_parameter_safety.js','biography_source_fact_safety.js','citation_partial_reachability.js','citation_language_safety.js','native_literal_scalar_comparison.js','image_thumbnail_typo.js','gaia_wrapper_safety.js','invalid_bank_self_calls.js')

def once(source,old,new):
 assert source.count(old)==1,'Pinned integration anchor differs: '+old[:100]
 return source.replace(old,new,1)

def patch_ui_context(source):
 # Keep UI-owned drafts and anonymous replies bound to their original editor.
 # UI closure context readers
 old='    async function prepareTalkHeader() {'
 new="    function localEditorContext(adapter) {\n        const inline=inlineController?.context();\n        return v219UIContext({editor:adapter?.id,title:currentTitle(),\n            namespace:Number(inline?.namespace??mw.config.get('wgNamespaceNumber')),\n            model:mw.config.get('wgPageContentModel')||'wikitext',base:baseRevision(),section:editingSection()});\n    }\n    function lastEditorContextMatches(adapter) { return !!last&&v219UIContextSame(last.context,localEditorContext(adapter)); }\n    function reportEditorContextMatches(result,adapter) { return !!result&&v219UIContextSame(result.uiContext,localEditorContext(adapter)); }\n    async function prepareTalkHeader() {"
 assert source.count(old)==1,'UI context anchor differs: UI closure context readers'
 source=source.replace(old,new)
 # talk snapshot
 old="const source=adapter.read(),openedPanel=panel,title=String(mw.config.get('wgTitle')||'');"
 new="const source=adapter.read(),openedPanel=panel,title=String(mw.config.get('wgTitle')||''),context=localEditorContext(adapter);"
 assert source.count(old)==1,'UI context anchor differs: talk snapshot'
 source=source.replace(old,new)
 # both talk await guards
 old='if(localBusy||onlineBusy||panel!==openedPanel||editor()?.id!==adapter.id||adapter.read()!==source)'
 new='if(localBusy||onlineBusy||panel!==openedPanel||!v219UIContextSame(context,localEditorContext(editor()))||adapter.read()!==source)'
 assert source.count(old)==2,'UI context anchor differs: both talk await guards'
 source=source.replace(old,new)
 # returned article identity
 old="if(!page||page.missing||page.ns!==0||!slot||typeof slot.content!=='string'||slot.contentmodel&&slot.contentmodel!=='wikitext')"
 new='if(!v219UITalkArticle(page,title))'
 assert source.count(old)==1,'UI context anchor differs: returned article identity'
 source=source.replace(old,new)
 # talk rollback origin
 old='if(editor()?.id===adapter.id)adapter.write(source);'
 new='if(v219UIContextSame(context,localEditorContext(editor())))adapter.write(source);'
 assert source.count(old)==1,'UI context anchor differs: talk rollback origin'
 source=source.replace(old,new)
 # owned talk summary
 old="if(last)last.summary={id:summary.id,before:prior,after:plan.summary,prefix:''};"
 new="if(last)last.summary={id:summary.id,context,before:prior,after:plan.summary,prefix:''};"
 assert source.count(old)==1,'UI context anchor differs: owned talk summary'
 source=source.replace(old,new)
 # summary restore ownership
 old='if (summary && summary.id === generated.id && summary.read() === generated.after)'
 new='if (summary && v219UIContextSame(generated.context,localEditorContext(editor())) && summary.id === generated.id && summary.read() === generated.after)'
 assert source.count(old)==1,'UI context anchor differs: summary restore ownership'
 source=source.replace(old,new)
 # summary continuation ownership
 old='if (previous && previous.id === summary.id && before === previous.after)'
 new='if (previous && v219UIContextSame(previous.context,localEditorContext(editor())) && previous.id === summary.id && before === previous.after)'
 assert source.count(old)==1,'UI context anchor differs: summary continuation ownership'
 source=source.replace(old,new)
 # summary snapshot
 old='return {id: summary.id, before: snapshot, prefix, after};'
 new='return {id: summary.id, context:localEditorContext(editor()), before: snapshot, prefix, after};'
 assert source.count(old)==1,'UI context anchor differs: summary snapshot'
 source=source.replace(old,new)
 # edit continuation
 old='const continuing = last && last.id === adapter.id && last.after === before;'
 new='const context=localEditorContext(adapter),continuing=lastEditorContextMatches(adapter)&&last.after===before;'
 assert source.count(old)==1,'UI context anchor differs: edit continuation'
 source=source.replace(old,new)
 # edit ownership snapshot
 old='last = {id: adapter.id, before: originalText, after, summary: previousSummary, kinds, topics, rules};'
 new='last = {id: adapter.id, context, before: originalText, after, summary: previousSummary, kinds, topics, rules};'
 assert source.count(old)==1,'UI context anchor differs: edit ownership snapshot'
 source=source.replace(old,new)
 # undo origin
 old='if (!last || !adapter || adapter.id !== last.id || adapter.read() !== last.after)'
 new='if (!last || !adapter || !lastEditorContextMatches(adapter) || adapter.read() !== last.after)'
 assert source.count(old)==1,'UI context anchor differs: undo origin'
 source=source.replace(old,new)
 # undo summary origin
 old='            const summary = summaryEditor(), generated = last.summary;\n            if (generated && summary && summary.id === generated.id && summary.read() === generated.after) {\n                summary.restore(generated.before);\n            }'
 new='            restoreOwnedSummary(last.summary);'
 assert source.count(old)==1,'UI context anchor differs: undo summary origin'
 source=source.replace(old,new)
 # baseline origin
 old='return last && last.id === adapter.id && last.after === source ? last.before : source;'
 new='return lastEditorContextMatches(adapter)&&last.after===source?last.before:source;'
 assert source.count(old)==1,'UI context anchor differs: baseline origin'
 source=source.replace(old,new)
 # result context drop
 old='        const adapter = editor(), source = adapter?.read();\n        const proposed ='
 new='        const adapter = editor(), source = adapter?.read();\n        if(last&&!lastEditorContextMatches(adapter)){restoreOwnedSummary(last.summary);restoreOwnedMinor();last=null;}\n        const proposed ='
 assert source.count(old)==1,'UI context anchor differs: result context drop'
 source=source.replace(old,new)
 # actual result origin
 old='const actual = last && adapter?.id === last.id && source === last.after;'
 new='const actual = lastEditorContextMatches(adapter) && source === last.after;'
 assert source.count(old)==1,'UI context anchor differs: actual result origin'
 source=source.replace(old,new)
 # minor restoration ownership
 old='if(owned.box.isConnected&&owned.box.checked===owned.after)writeMinor(owned.box,owned.before);'
 new='if(v219UIContextSame(owned.context,localEditorContext(editor()))&&owned.box===minorCheckbox()&&owned.box.isConnected&&owned.box.checked===owned.after)writeMinor(owned.box,owned.before);'
 assert source.count(old)==1,'UI context anchor differs: minor restoration ownership'
 source=source.replace(old,new)
 # minor source origin
 old='if(!adapter||!last||last.id!==adapter.id||adapter.read()!==last.after||result.text!==last.after)return;'
 new='if(!adapter||!lastEditorContextMatches(adapter)||adapter.read()!==last.after||result.text!==last.after||!reportEditorContextMatches(result,adapter))return;'
 assert source.count(old)==1,'UI context anchor differs: minor source origin'
 source=source.replace(old,new)
 # minor owned snapshot
 old='minorOwned={box,before:false,after:true,source:last.after};'
 new='minorOwned={box,context:localEditorContext(adapter),before:false,after:true,source:last.after};'
 assert source.count(old)==1,'UI context anchor differs: minor owned snapshot'
 source=source.replace(old,new)
 # minor baseline snapshot
 old='minorVerifiedBaseline={id:task.adapterId,title:task.title,revision,source:cached.source};'
 new='minorVerifiedBaseline={id:task.adapterId,context:task.context,title:task.title,revision,source:cached.source};'
 assert source.count(old)==1,'UI context anchor differs: minor baseline snapshot'
 source=source.replace(old,new)
 # minor baseline current
 old='const currentConfirmed=minorVerifiedBaseline && minorVerifiedBaseline.id===adapter.id'
 new='const currentConfirmed=minorVerifiedBaseline && v219UIContextSame(minorVerifiedBaseline.context,localEditorContext(adapter)) && minorVerifiedBaseline.id===adapter.id'
 assert source.count(old)==1,'UI context anchor differs: minor baseline current'
 source=source.replace(old,new)
 # confirmed minor context
 old='cfg.minorBaseConfirmed=!!(cfg.autoMinor&&minorVerifiedBaseline&&minorVerifiedBaseline.id===task.adapterId'
 new='cfg.minorBaseConfirmed=!!(cfg.autoMinor&&minorVerifiedBaseline&&v219UIContextSame(minorVerifiedBaseline.context,task.context)&&minorVerifiedBaseline.id===task.adapterId'
 assert source.count(old)==1,'UI context anchor differs: confirmed minor context'
 source=source.replace(old,new)
 # run old ownership
 old='if(last&&last.id===adapter.id&&last.after!==before)'
 new='if(last&&(!lastEditorContextMatches(adapter)||last.after!==before))'
 assert source.count(old)==1,'UI context anchor differs: run old ownership'
 source=source.replace(old,new)
 # preview baseline origin
 old='if (last && last.id === session.adapter.id && last.after === session.source)'
 new='if (lastEditorContextMatches(session.adapter) && last.after === session.source)'
 assert source.count(old)==1,'UI context anchor differs: preview baseline origin'
 source=source.replace(old,new)
 # CSS undo origin
 old='if(!last||!adapter||last.id!==adapter.id||last.after!==adapter.read())'
 new='if(!last||!adapter||!lastEditorContextMatches(adapter)||last.after!==adapter.read())'
 assert source.count(old)==1,'UI context anchor differs: CSS undo origin'
 source=source.replace(old,new)
 # CSS summary restore
 old='        if(summary&&previous.summary&&summary.id===previous.summary.id&&summary.read()===previous.summary.after)summary.restore(previous.summary.before);'
 new='        restoreOwnedSummary(previous.summary);'
 assert source.count(old)==1,'UI context anchor differs: CSS summary restore'
 source=source.replace(old,new)
 # local async task snapshot
 old='const task = {id: ++localSerial, adapterId: adapter.id, source, panel, title: currentTitle(), section: editingSection(), base: baseRevision(), cancelled: false,'
 new='const task = {id: ++localSerial, adapterId: adapter.id, context:localEditorContext(adapter), source, panel, title: currentTitle(), section: editingSection(), base: baseRevision(), cancelled: false,'
 assert source.count(old)==1,'UI context anchor differs: local async task snapshot'
 source=source.replace(old,new)
 # local async task guard
 old='if (!current || current.id !== this.adapterId || current.read() !== this.source || panel !== this.panel ||'
 new='if (!current || !v219UIContextSame(this.context,localEditorContext(current)) || current.id !== this.adapterId || current.read() !== this.source || panel !== this.panel ||'
 assert source.count(old)==1,'UI context anchor differs: local async task guard'
 source=source.replace(old,new)
 # online session snapshot
 old='const session = {adapter, source, base, section, title, cancelled: false, requests: new Set(),'
 new='const session = {adapter, source, base, section, title, context:localEditorContext(adapter), cancelled: false, requests: new Set(),'
 assert source.count(old)==1,'UI context anchor differs: online session snapshot'
 source=source.replace(old,new)
 # online session guard
 old='if (!a || a.id !== adapter.id || a.read() !== source || editingSection() !== section || baseRevision() !== base || currentTitle() !== title)'
 new='if (!a || !v219UIContextSame(this.context,localEditorContext(a)) || a.id !== adapter.id || a.read() !== source || editingSection() !== section || baseRevision() !== base || currentTitle() !== title)'
 assert source.count(old)==1,'UI context anchor differs: online session guard'
 source=source.replace(old,new)
 # report ownership capture
 old='    function showReport(result) {\n        result=v217FinalReviewResult(result,currentOptions(false));'
 new='    function showReport(result) {\n        const uiContext=result.uiContext||localEditorContext(editor());\n        if(!v219UIContextSame(uiContext,localEditorContext(editor())))return;\n        result={...v217FinalReviewResult(result,currentOptions(false)),uiContext};'
 assert source.count(old)==1,'UI context anchor differs: report ownership capture'
 source=source.replace(old,new)
 # spelling refresh ownership
 old='if (!adapter || adapter.id !== previous.editorId || adapter.read() !== previous.text)'
 new='if (!adapter || !reportEditorContextMatches(previous,adapter) || adapter.id !== previous.editorId || adapter.read() !== previous.text)'
 assert source.count(old)==1,'UI context anchor differs: spelling refresh ownership'
 source=source.replace(old,new)
 # spelling report actions ownership
 old='if (!adapter || adapter.id !== result.editorId || adapter.read() !== result.text)'
 new='if (!adapter || !reportEditorContextMatches(result,adapter) || adapter.id !== result.editorId || adapter.read() !== result.text)'
 assert source.count(old)==3,'UI context anchor differs: spelling report actions ownership'
 source=source.replace(old,new)
 # suggestion action ownership
 old="if (!adapter || (result.kind === 'spelling' && adapter.id !== result.editorId) || adapter.read() !== result.text)"
 new="if (!adapter || !reportEditorContextMatches(result,adapter) || (result.kind === 'spelling' && adapter.id !== result.editorId) || adapter.read() !== result.text)"
 assert source.count(old)==1,'UI context anchor differs: suggestion action ownership'
 source=source.replace(old,new)
 # native recovery snapshot
 old="            const originalNative = root.jQuery?.fn.textSelection ? root.jQuery(textarea).textSelection('getContents') : textarea.value;"
 new="            const nativeContext=()=>v219UIContext({editor:doc.getElementById('wpTextbox1'),title:H.normalizeTitle(mw.config.get('wgPageName')),\n                namespace:Number(mw.config.get('wgNamespaceNumber')),model:mw.config.get('wgPageContentModel')||'wikitext',\n                base:Number(doc.getElementById('wpBaseRevId')?.value||doc.getElementById('editRevId')?.value||mw.config.get('wgRevisionId')),\n                section:doc.getElementById('wpSection')?.value||new URL(root.location.href).searchParams.get('section')});\n            const offeredContext=nativeContext(),recoveryCurrent=()=>['edit','submit'].includes(mw.config.get('wgAction'))&&textarea.isConnected&&v219UIContextSame(offeredContext,nativeContext());\n            const originalNative = root.jQuery?.fn.textSelection ? root.jQuery(textarea).textSelection('getContents') : textarea.value;"
 assert source.count(old)==1,'UI context anchor differs: native recovery snapshot'
 source=source.replace(old,new)
 # recovery click origin
 old="() => { const currentNative=root.jQuery?.fn.textSelection?root.jQuery(textarea).textSelection('getContents'):textarea.value;"
 new="() => { if(!recoveryCurrent())return; const currentNative=root.jQuery?.fn.textSelection?root.jQuery(textarea).textSelection('getContents'):textarea.value;"
 assert source.count(old)==1,'UI context anchor differs: recovery click origin'
 source=source.replace(old,new)
 # recovery after confirm origin
 old="pelo rascunho guardado?'))return; if (root.jQuery?.fn.textSelection)"
 new="pelo rascunho guardado?'))return; if(!recoveryCurrent())return; if (root.jQuery?.fn.textSelection)"
 assert source.count(old)==1,'UI context anchor differs: recovery after confirm origin'
 source=source.replace(old,new)
 # discard origin
 old="'rw26-native-discard', () => { clearRecovery(recoveryContext); box.remove(); }"
 new="'rw26-native-discard', () => { if(!recoveryCurrent())return; clearRecovery(recoveryContext); box.remove(); }"
 assert source.count(old)==1,'UI context anchor differs: discard origin'
 source=source.replace(old,new)
 return source

def patch_ui_presentation(source):
 # Keep full retained counts out of the large-draft UI event handler.
 # read-only presentation job before cleanup
 source=once(source,"        const cfg = job.options || {};\n        yield 'Lendo o código-fonte...';","        const cfg = job.options || {};\n        if(job.kind==='presentation'){yield 'Contando os ajustes mantidos...';return v219UIPresentationMetadata(job);}\n        yield 'Lendo o código-fonte...';")
 # reuse only sealed bound reports
 source=once(source,'        const source=result.text;\n        return {...result,reviewSource:source,reviewBinding:v211FreshnessKey(cfg),localReports:{...(result.localReports||{}),','        if(v219UIReviewReportsBound(result,cfg))return result;\n        const source=result.text;\n        return v219UIBindReviewReports({...result,reviewSource:source,reviewBinding:v211FreshnessKey(cfg),localReports:{...(result.localReports||{}),')
 # seal recomputed review reports
 source=once(source,'            biographies:biographyStyleAudit(source,cfg),dates:cfg.dateChecks===false?[]:dateAudit(source)}};','            biographies:biographyStyleAudit(source,cfg),dates:cfg.dateChecks===false?[]:dateAudit(source)}},cfg);')
 # bind ordinary Worker reports
 source=once(source,"        if (job.kind === 'adjust') {\n            yield 'Preparando a comparação dos ajustes...';","        result=v219UIBindReviewReports(result,cfg);\n        if (job.kind === 'adjust') {\n            yield 'Preparando a comparação dos ajustes...';")
 # bind audit-only Worker reports
 source=once(source,"        if (job.kind === 'audit') return {kind:'audit',text:job.source,changes:[],warnings:[],suggestions:cfg.tableChecks===false||discussionProtectionRanges(job.source,pageContextOptions(cfg)).length?[]:tableSuggestions(job.source),\n            localReports:{references:referenceAudit(job.source,cfg),syntax:syntaxAudit(job.source),translation:cfg.multilingual?translationAudit(job.source):[],\n                tables:cfg.tableChecks===false?[]:tableAnalysis(job.source).findings,biographies:biographyStyleAudit(job.source,cfg),dates:cfg.dateChecks===false?[]:dateAudit(job.source)}};","        if (job.kind === 'audit') return v219UIBindReviewReports({kind:'audit',text:job.source,changes:[],warnings:[],suggestions:cfg.tableChecks===false||discussionProtectionRanges(job.source,pageContextOptions(cfg)).length?[]:tableSuggestions(job.source),\n            localReports:{references:referenceAudit(job.source,cfg),syntax:syntaxAudit(job.source),translation:cfg.multilingual?translationAudit(job.source):[],\n                tables:cfg.tableChecks===false?[]:tableAnalysis(job.source).findings,biographies:biographyStyleAudit(job.source,cfg),dates:cfg.dateChecks===false?[]:dateAudit(job.source)}},cfg);")
 # defer giant summary classification
 source=once(source,'        const topics = summaryTopics(originalText, after, kinds);','        const presentationDeferred=!stylesMode&&originalText.length+after.length>=200000;\n        const topics = presentationDeferred?[]:summaryTopics(originalText, after, kinds);')
 # presentation ownership state
 source=once(source,'        last = {id: adapter.id, context, before: originalText, after, summary: previousSummary, kinds, topics, rules};','        last = {id: adapter.id, context, before: originalText, after, summary: previousSummary, kinds, topics, rules,presentationDeferred,presentationBinding:v211FreshnessKey(currentOptions(false))};')
 # defer giant summary write
 source=once(source,'        try { last.summary = fillSummary(kinds, previousSummary, topics); }','        try { if(!presentationDeferred)last.summary = fillSummary(kinds, previousSummary, topics); }')
 # presentation scheduling helper
 source=once(source,'    function appliedBaseline(adapter, source) {',"    function queueAppliedPresentation(record) {\n        if(!record?.presentationDeferred||record.presentationStarted||record.presentationTimer||record.retainedTypes||record.presentationError||localBusy||onlineBusy)return;\n        record.presentationTimer=root.setTimeout(async()=>{\n            record.presentationTimer=null;\n            const adapter=editor();\n            if(last!==record||!lastEditorContextMatches(adapter)||adapter.read()!==record.after||localBusy||onlineBusy)return;\n            const options=currentOptions(false),binding=v211FreshnessKey(options),summary=summaryEditor(),summaryValue=summary?.read();\n            record.presentationStarted=true;\n            const task=beginLocalAnalysis(adapter,record.after,'Contando os ajustes mantidos...');\n            if(!task){record.presentationStarted=false;return;}\n            task.presentation=true;updateBusyControls();\n            try {\n                const result=await computeLocal(task,{kind:'presentation',source:record.after,originalSource:record.before,presentationKinds:record.kinds,options});\n                task.guard();\n                if(last!==record||binding!==v211FreshnessKey(currentOptions(false))||!v219UIPresentationMatches(result,record.before,record.after,record.kinds,currentOptions(false)))throw new Error('A edição mudou durante a contagem.');\n                record.retainedTypes=result.presentation.retained;record.topics=result.presentation.topics;record.presentationError=false;\n                const currentSummary=summaryEditor();\n                if(summary&&currentSummary?.id===summary.id&&currentSummary.read()===summaryValue){\n                    try{record.summary=fillSummary(record.kinds,record.summary,record.topics);}catch(error){root.console.warn('RevisaWiki: não foi possível preencher o resumo.',error);}\n                }\n                updateAppliedResult();message('Código ajustado. Confira Mostrar alterações e a pré-visualização antes de publicar.');\n            }catch(error){\n                if(last===record&&v219UIContextSame(record.context,localEditorContext(editor()))&&adapter.read()===record.after&&binding===v211FreshnessKey(currentOptions(false)))record.presentationError=true;\n            }finally{record.presentationStarted=false;finishLocalAnalysis(task);}\n        },0);\n    }\n    function appliedBaseline(adapter, source) {")
 # retained cache source/options ownership
 source=once(source,'        const actual = lastEditorContextMatches(adapter) && source === last.after;','        const actual = lastEditorContextMatches(adapter) && source === last.after;\n        if(actual){const binding=v211FreshnessKey(currentOptions(false));if(last.presentationBinding!==binding){last.presentationBinding=binding;last.retainedTypes=null;last.presentationError=false;}}')
 # off-thread large retained counts
 source=once(source,'        }else if(actual)retained=last.retainedTypes||(last.retainedTypes=v211RetainedAdjustments(last.before,last.after,last.kinds||[],currentOptions(false)));','        }else if(actual){\n            if(last.presentationDeferred){retained=last.retainedTypes;queueAppliedPresentation(last);}\n            else retained=last.retainedTypes||(last.retainedTypes=v211RetainedAdjustments(last.before,last.after,last.kinds||[],currentOptions(false)));\n        }')
 # honest pending count label
 source=once(source,"(retained.count===1?'':'s'):retained.text):'';","(retained.count===1?'':'s'):retained.text):actual&&last.presentationDeferred?(last.presentationError?'Confira Mostrar alterações.':'Contando ajustes...'):'';")
 # immediate owned Undo without cleanup
 source=once(source,"    async function undo() {\n        const adapter = editor();\n        if (!last || !adapter || !lastEditorContextMatches(adapter) || adapter.read() !== last.after) {\n            message('O texto mudou após o ajuste. Use o Desfazer do editor para preservar suas edições posteriores.'); return;\n        }\n        const previous = last, task = beginLocalAnalysis(adapter, adapter.read(), 'Preparando o texto anterior...');\n        if (!task) return;\n        try {\n            const result = await computeLocal(task, {kind: 'refresh', source: previous.before, options: {...currentOptions(false), review: false}});\n            task.guard();\n            adapter.write(previous.before);\n            if (adapter.read() !== last.before) throw new Error('O editor não confirmou a restauração.');\n            restoreOwnedSummary(last.summary);\n            restoreOwnedMinor();last = null;\n            panel.querySelector('.ajg-undo').disabled = true;\n            showReport({...result, changes: [], suggestions: [], preservation: []});\n            comparisonPlan = null; panel.querySelector('.ajg-diff')?.replaceChildren();\n            message('Texto anterior ao ajuste restaurado.');\n        } catch (error) { if (localTask === task) message('Não foi possível desfazer: ' + error.message); }\n        finally { finishLocalAnalysis(task); }\n    }\n","    async function undo() {\n        if(localTask?.presentation)cancelLocalAnalysis();\n        if(localBusy||onlineBusy)return;\n        const adapter=editor();\n        if(!last||!adapter||!lastEditorContextMatches(adapter)||adapter.read()!==last.after){\n            message('O texto mudou após o ajuste. Use o Desfazer do editor para preservar suas edições posteriores.');return;\n        }\n        const previous=last;\n        try{\n            adapter.write(previous.before);\n            if(adapter.read()!==previous.before)throw new Error('O editor não confirmou a restauração.');\n            restoreOwnedSummary(previous.summary);restoreOwnedMinor();last=null;lastLocalResult=null;comparisonPlan=null;\n            issueStore.clear();v211CheckedDraft=null;v211SyncFreshness();\n            const report=panel.querySelector('.ajg-report');if(report){report.replaceChildren();report.hidden=true;}\n            panel.querySelector('.ajg-diff')?.replaceChildren();panel.querySelector('.ajg-undo').disabled=true;\n            updateAppliedResult();message('Texto anterior ao ajuste restaurado.');\n        }catch(error){message('Não foi possível desfazer: '+error.message);}\n    }\n")
 # Undo stays available while presentation runs
 source=once(source,'if (undoControl) undoControl.disabled = any || !last;','if (undoControl) undoControl.disabled = (any&&!localTask?.presentation) || !last;')
 # presentation timeout truthful to existing draft
 source=once(source,"const error = new Error('A análise demorou demais. Nenhum ajuste foi aplicado. Tente novamente ou revise uma seção.');","const error = new Error(job.kind==='presentation'?'A contagem não terminou. Os ajustes do rascunho foram preservados.':'A análise demorou demais. Nenhum ajuste foi aplicado. Tente novamente ou revise uma seção.');")
 return source

def patch(source, helpers):
 source=once(source,'        // These exact local profiles were checked against native expansion.\n',"        // Séc 56168644 forwards this exact literal form to Nowrap 62919652.\n        if(parsed.parts.length===2&&raw==='{{séc|'+parsed.parts[1]+'}}'&&validRomanCentury(parsed.parts[1]))return true;\n        // These exact local profiles were checked against native expansion.\n")
 source=once(source,"            const v = value.trim().replace(/^(?:Imagem|Image|File|Ficheiro|Arquivo|Fichier|Datei|Bild|Archivo)\\s*:/i, '').replace(/_/g, ' ');","            const v = value.trim().replace(/^(?:Imagem|Image|File|Ficheiro|Arquivo|Fichier|Datei|Bild|Archivo)\\s*:/i, '').replace(/^ +/, '').replace(/_/g, ' ');")
 source=once(source,"    function splitParts(s) { return boundedMemo(partsMemo,'parts',4194304,4096,s,'parts',()=>scanSplitParts(s),parts=>parts.reduce((n,p)=>n+p.length*2+32,0)).slice(); }","    function splitParts(s) { return boundedMemo(partsMemo,'parts',4194304,8192,s,'parts',()=>scanSplitParts(s),parts=>parts.reduce((n,p)=>n+p.length*2+32,0)).slice(); }")
 source=once(source,"    function norm(s) { return s.trim().replace(/_/g, ' ').replace(/\\s+/g, ' ').toLocaleLowerCase('pt'); }","    var v219NormMemo,v219NormMemoUnits;\n    function norm(s) {\n        if(typeof s!=='string'||s.length>512)return s.trim().replace(/_/g, ' ').replace(/\\s+/g, ' ').toLocaleLowerCase('pt');\n        const cached=v219NormMemo&&v219NormMemo.get(s);if(cached!==undefined)return cached;\n        const value=s.trim().replace(/_/g, ' ').replace(/\\s+/g, ' ').toLocaleLowerCase('pt');\n        if(value.length>1024)return value;\n        if(!v219NormMemo){v219NormMemo=new Map();v219NormMemoUnits=0;}\n        const weight=s.length+value.length;\n        while(v219NormMemo.size>=4096||v219NormMemoUnits+weight>131072){\n            const first=v219NormMemo.keys().next().value,previous=v219NormMemo.get(first);\n            v219NormMemo.delete(first);v219NormMemoUnits-=first.length+previous.length;\n        }\n        v219NormMemo.set(s,value);v219NormMemoUnits+=weight;return value;\n    }")
 source=once(source,'    const memoBudgets = {large:0,small:0,parts:0};\n','    const memoBudgets = {large:0,small:0,parts:0};\n    const memoTails=new WeakMap([[scanMemoLarge,null],[scanMemoSmall,null],[partsMemo,null]]);\n')
 source=once(source,'        let entry=map.get(key);\n','        const tracked=memoTails.has(map),tail=tracked?memoTails.get(map):null;let entry=tracked&&typeof key===\'string\'&&tail&&tail.key===key&&map.size>0?tail:map.get(key);\n')
 source=once(source,'            map.delete(key);map.set(key,entry);return entry.values[field];',"            if(!tracked||memoTails.get(map)!==entry){map.delete(key);map.set(map===partsMemo&&typeof key==='string'?entry.key:key,entry);if(tracked)memoTails.set(map,entry);}return entry.values[field];")
 source=once(source,'if(!entry){entry={values:{},weight:base};map.set(key,entry);memoBudgets[bucket]+=base;}',"if(!entry){entry={values:{},weight:base};const storedKey=map===partsMemo&&typeof key==='string'?JSON.parse(JSON.stringify(key)):key;if(tracked)entry.key=storedKey;if(tracked)memoTails.set(map,map.has(key)?null:entry);map.set(storedKey,entry);memoBudgets[bucket]+=base;}")
 source=once(source,'        while(map.size>maxEntries || memoBudgets[bucket]>limit){const first=map.keys().next().value;const old=map.get(first);map.delete(first);memoBudgets[bucket]-=old.weight;}\n        return value;\n    }\n','        while(map.size>maxEntries || memoBudgets[bucket]>limit){const first=map.keys().next().value;const old=map.get(first);map.delete(first);memoBudgets[bucket]-=old.weight;}\n        if(tracked&&!map.size)memoTails.set(map,null);\n        return value;\n    }\n')
 source=once(source,'        entry.values[field]=value;entry.weight+=added;memoBudgets[bucket]+=added;',"        const storedValue=map===partsMemo&&typeof key==='string'&&field==='parts'&&Array.isArray(value)?Object.freeze(value.map(text=>JSON.parse(JSON.stringify(text)))):value;entry.values[field]=storedValue;entry.weight+=added;memoBudgets[bucket]+=added;")
 source=once(source,"    const scanMemoLarge = new Map(), scanMemoSmall = new Map(), partsMemo = new Map();\n    const memoBudgets = {large:0,small:0,parts:0};\n    const memoTails=new WeakMap([[scanMemoLarge,null],[scanMemoSmall,null],[partsMemo,null]]);\n    function boundedMemo(map, bucket, limit, maxEntries, key, field, create, weight) {\n        const tracked=memoTails.has(map),tail=tracked?memoTails.get(map):null;let entry=tracked&&typeof key==='string'&&tail&&tail.key===key&&map.size>0?tail:map.get(key);\n        if(entry && Object.hasOwn(entry.values,field)) {\n            if(!tracked||memoTails.get(map)!==entry){map.delete(key);map.set(map===partsMemo&&typeof key==='string'?entry.key:key,entry);if(tracked)memoTails.set(map,entry);}return entry.values[field];\n        }\n        const value=create();\n        // A leitura pode chamar outro leitor e criar ou remover esta entrada.\n        entry=map.get(key);\n        const added=weight(value), base=entry?0:key.length*2+160;\n        if(base+added>limit)return value;\n        if(!entry){entry={values:{},weight:base};const storedKey=map===partsMemo&&typeof key==='string'?JSON.parse(JSON.stringify(key)):key;if(tracked)entry.key=storedKey;if(tracked)memoTails.set(map,map.has(key)?null:entry);map.set(storedKey,entry);memoBudgets[bucket]+=base;}\n        if(Array.isArray(value))Object.freeze(value);else if(value?.nodes){Object.freeze(value.nodes);Object.freeze(value.unclosed);}\n        const storedValue=map===partsMemo&&typeof key==='string'&&field==='parts'&&Array.isArray(value)?Object.freeze(value.map(text=>JSON.parse(JSON.stringify(text)))):value;entry.values[field]=storedValue;entry.weight+=added;memoBudgets[bucket]+=added;\n        while(map.size>maxEntries || memoBudgets[bucket]>limit){const first=map.keys().next().value;const old=map.get(first);map.delete(first);memoBudgets[bucket]-=old.weight;}\n        if(tracked&&!map.size)memoTails.set(map,null);\n        return value;\n    }\n","    const scanMemoLarge = new Map(), scanMemoSmall = new Map(), partsMemo = new Map();\n    const memoBudgets = {large:0,small:0,parts:0};\n    const memoTails=new WeakMap([[scanMemoLarge,null],[scanMemoSmall,null],[partsMemo,null]]);\n    const memoHeads=new WeakMap([[scanMemoLarge,null],[scanMemoSmall,null],[partsMemo,null]]);\n    const memoUnlinkEntry=(map,entry)=>{\n        if(!entry.next)return;\n        if(entry.next===entry)memoHeads.set(map,null);\n        else{entry.prev.next=entry.next;entry.next.prev=entry.prev;if(memoHeads.get(map)===entry)memoHeads.set(map,entry.next);}\n        entry.prev=entry.next=null;\n    };\n    const memoLinkEntry=(map,entry,previous)=>{\n        const head=memoHeads.get(map);\n        if(previous){\n            if(previous.next===previous){entry.prev=entry.next=entry;memoHeads.set(map,entry);}\n            else{entry.prev=previous.prev;entry.next=previous.next;previous.prev.next=entry;previous.next.prev=entry;if(head===previous)memoHeads.set(map,entry);}\n            previous.prev=previous.next=null;\n        }else if(!head){entry.prev=entry.next=entry;memoHeads.set(map,entry);}\n        else{const tail=head.prev;entry.prev=tail;entry.next=head;tail.next=entry;head.prev=entry;}\n    };\n    function boundedMemo(map, bucket, limit, maxEntries, key, field, create, weight) {\n        const tracked=memoTails.has(map),tail=tracked?memoTails.get(map):null;let entry=tracked&&typeof key==='string'&&tail&&tail.key===key&&map.size>0?tail:map.get(key);\n        if(entry && Object.hasOwn(entry.values,field)) {\n            if(!tracked||memoTails.get(map)!==entry){map.delete(key);map.set(map===partsMemo&&typeof key==='string'?entry.key:key,entry);if(tracked){memoUnlinkEntry(map,entry);memoLinkEntry(map,entry);memoTails.set(map,entry);}}return entry.values[field];\n        }\n        const value=create();\n        // A leitura pode chamar outro leitor e criar ou remover esta entrada.\n        entry=map.get(key);\n        const added=weight(value), base=entry?0:key.length*2+(tracked?192:160);\n        if(base+added>limit)return value;\n        if(!entry){entry={values:{},weight:base};const storedKey=map===partsMemo&&typeof key==='string'?JSON.parse(JSON.stringify(key)):key;let previous;if(tracked){entry.key=storedKey;entry.prev=entry.next=null;const present=map.has(key);previous=present?map.get(key):undefined;memoTails.set(map,present?null:entry);}map.set(storedKey,entry);if(tracked)memoLinkEntry(map,entry,previous);memoBudgets[bucket]+=base;}\n        if(Array.isArray(value))Object.freeze(value);else if(value?.nodes){Object.freeze(value.nodes);Object.freeze(value.unclosed);}\n        const storedValue=map===partsMemo&&typeof key==='string'&&field==='parts'&&Array.isArray(value)?Object.freeze(value.map(text=>JSON.parse(JSON.stringify(text)))):value;entry.values[field]=storedValue;entry.weight+=added;memoBudgets[bucket]+=added;\n        while(map.size>maxEntries || memoBudgets[bucket]>limit){const head=tracked?memoHeads.get(map):null,first=head?head.key:map.keys().next().value;const old=map.get(first);map.delete(first);if(tracked&&old)memoUnlinkEntry(map,old);memoBudgets[bucket]-=old.weight;}\n        if(tracked&&!map.size)memoTails.set(map,null);\n        return value;\n    }\n")
 source=once(source,'    function rReferenceUses(source) {','    function rReferenceUses(source) {return v219RReferenceUses(source); }\n    function v219LegacyRReferenceUses(source) {')
 source=once(source,'    function referenceNameUses(s) {','    function referenceNameUses(s) {return v219ReferenceNameUses(s); }\n    function v219LegacyReferenceNameUses(s) {')
 source=once(source,"if(rawNodes.some(n=>['refn','nre','efn','#tag:ref'].includes(parsedTemplate(source.slice(n.start,n.end)).name)))return [];",
   "if(v219NativeLiteralNoteHazard(source)||rawNodes.some(n=>['refn','nre','efn','#tag:ref'].includes(parsedTemplate(source.slice(n.start,n.end)).name)))return [];")
 source=once(source,"if(nodes.nodes.some(node=>['refn','nre','efn','r','#tag:ref'].includes(parsedTemplate(source.slice(node.start,node.end)).name)))return null;",
   "if(v219NativeLiteralNoteHazard(source)||nodes.nodes.some(node=>['refn','nre','efn','r','#tag:ref'].includes(parsedTemplate(source.slice(node.start,node.end)).name)))return null;")
 source=once(source,'    function v215TemplateTitle(value) {','    function v215TemplateTitle(value) {return v219TemplateTitle(value); }\n    function v219LegacyTemplateTitle(value) {')
 source=once(source,'    function v24SyntaxMaskRanges(source,ranges) {','    function v24SyntaxMaskRanges(source,ranges) {return v219MaskRanges(source,ranges); }\n    function v219LegacyMaskRanges(source,ranges) {')
 # Native reference names remain reserved even when the editing view masks
 # their owner, or a partial-syntax pass analyzes only an earlier prefix.
 source=once(source,'        cfg.biographyOriginalSource=source;',
   '        cfg.biographyOriginalSource=source;\n        cfg.v219ReferenceReservation=v219ReferenceNameReservation(source,cfg);')
 source=once(source,'    function nativeCitationTitle(p) {\n',
   '    function nativeCitationTitle(p) {\n        if(v219NativeCitationTitle(p))return true;\n')
 source=once(source,'    function normalizeNumericReferenceNames(s, cfg, bump, warn) {\n',
   '    function normalizeNumericReferenceNames(s, cfg, bump, warn) {\n        cfg=v219ReferenceReservationOptions(s,cfg);\n        if(cfg.v219ReferenceReservation.dynamic)return s;\n')
 source=once(source,'    function neutralAutomaticReferenceNames(source,cfg,bump) {\n',
   '    function neutralAutomaticReferenceNames(source,cfg,bump) {\n        cfg=v219ReferenceReservationOptions(source,cfg);\n        if(cfg.v219ReferenceReservation.dynamic)return source;\n')
 source=once(source,'    function automaticIdenticalReferences(source,cfg,bump) {\n',
   '    function automaticIdenticalReferences(source,cfg,bump) {\n        cfg=v219ReferenceReservationOptions(source,cfg);\n        if(cfg.v219ReferenceReservation.dynamic||!v219AnonymousReferenceGenerationAllowed(source,cfg))return source;\n')
 source=once(source,'    function v25SafeCitationReferenceEdits(source,cfg={}) {\n',
   '    function v25SafeCitationReferenceEdits(source,cfg={}) {\n        cfg=v219ReferenceReservationOptions(source,cfg);\n        if(cfg.v219ReferenceReservation.dynamic)return [];\n')
 source=once(source,'        const edits=[];let counter=1;\n        for(const family of families.values()){if(family.length<2)continue;let name;',
   '        const edits=[];let counter=1;\n        if([...families.values()].some(family=>family.length>=2)&&!v219AnonymousReferenceGenerationAllowed(source,{...DEFAULTS,...cfg}))return [];\n        for(const family of families.values()){if(family.length<2)continue;let name;')
 source=once(source,'        const actions=new Map(),virtual=new Map(),{refs,families,key,blocked,region,bodySignature}=context,hash=v24SyntaxHash(source),merge=cfg.automaticIdenticalReferences!==false;\n','        const actions=new Map(),virtual=new Map(),{refs,families,key,blocked,region,bodySignature}=context,hash=v24SyntaxHash(source),merge=cfg.automaticIdenticalReferences!==false;\n        let existingNameReuseAllowed;\n')
 source=once(source,'            const matches=bodyFamilies.get(JSON.stringify([group,region(ref.start),signature]))||[],family=matches[0];if(!family)continue;\n','            const matches=bodyFamilies.get(JSON.stringify([group,region(ref.start),signature]))||[],family=matches[0];if(!family)continue;\n            if(!(existingNameReuseAllowed??=v219AnonymousReferenceGenerationAllowed(source,{...DEFAULTS,...cfg})))continue;\n')
 source=once(source,'    function v210ReferenceConflictEdits(source,cfg={}) {\n',
   '    function v210ReferenceConflictEdits(source,cfg={}) {\n        cfg=v219ReferenceReservationOptions(source,cfg);\n        if(cfg.v219ReferenceReservation.dynamic)return [];\n')
 source=once(source,'const reserved = new Set(uses.map(u => decodedReferenceName(u.value))), mapping = new Map(), blocked = new Set();',
   'const reserved = new Set([...v219ReferenceOccupiedNames(s,cfg),...uses.map(u => decodedReferenceName(u.value))]), mapping = new Map(), blocked = new Set();')
 source=once(source,'const reserved=new Set(uses.map(u=>decodedReferenceName(u.value))),mapping=new Map();',
   'const reserved=new Set([...v219ReferenceOccupiedNames(source,cfg),...uses.map(u=>decodedReferenceName(u.value))]),mapping=new Map();')
 source=once(source,'renderers=rendererRanges(source), names=new Set(), families=new Map(), edits=[];',
   'renderers=rendererRanges(source), names=v219ReferenceOccupiedNames(source,cfg), families=new Map(), edits=[];')
 source=once(source,'const names=new Set(uses.map(u=>decodedReferenceName(u.value))),families=new Map(),renderers=rendererRanges(parsed.view)',
   'const names=new Set([...v219ReferenceOccupiedNames(source,cfg),...uses.map(u=>decodedReferenceName(u.value))]),families=new Map(),renderers=rendererRanges(parsed.view)')
 source=once(source,"const edits=[],occupied=new Set(graph.refs.map(ref=>graph.key(ref.group,ref.attrs.name||'')));",
   "const edits=[],reserved=v219ReferenceOccupiedNames(source,cfg),occupied=new Set(graph.refs.map(ref=>graph.key(ref.group,ref.attrs.name||'')));")
 source=once(source,"while(occupied.has(graph.key(family.group,family.name+'-'+suffix)))suffix++;name=family.name+'-'+suffix++;bodies.set(ref.body,name);occupied.add(graph.key(family.group,name));",
   "while(occupied.has(graph.key(family.group,family.name+'-'+suffix))||reserved.has(family.name+'-'+suffix))suffix++;name=family.name+'-'+suffix++;bodies.set(ref.body,name);occupied.add(graph.key(family.group,name));reserved.add(name);")
 source=once(source,'    function duplicateReferenceSuggestions(source) {\n',
   '    function duplicateReferenceSuggestions(source,cfg={}) {\n        cfg=v219ReferenceReservationOptions(source,cfg);\n        if(cfg.v219ReferenceReservation.dynamic||v219ReferenceIdentityQuarantine(source,cfg).opaque)return [];\n')
 source=once(source,'        const used = new Set(), families = new Map(), proposals = [];',
   '        const used = v219ReferenceOccupiedNames(source,cfg), families = new Map(), proposals = [];')
 source=once(source,'    function reviewSuggestions(source, cfg) {\n',
   '    function reviewSuggestions(source, cfg) {\n        cfg=v219ReferenceReservationOptions(source,cfg);\n')
 source=once(source,'if (cfg.references) proposals.push(...duplicateReferenceSuggestions(source));',
   'if (cfg.references) proposals.push(...duplicateReferenceSuggestions(source,cfg));')
 source=once(source,'const c={...DEFAULTS,...cfg,namespaceNumber:0},noop=()=>{},shield=maskProtected(source,noop);let text=shield.text;',
   'const c=v219ReferenceReservationOptions(source,{...DEFAULTS,...cfg,namespaceNumber:0}),noop=()=>{},shield=maskProtected(source,noop);let text=shield.text;')
 # These reference-only producers precede the ordinary protected view.
 # Their refusal is local to the reference subsystem, not the whole page.
 source=once(source,'    function automaticStructureCleanup(source,cfg={},bump=()=>{},warn=()=>{}) {',
   '    function automaticStructureCleanup(source,cfg={},bump=()=>{},warn=()=>{},restore=null) {')
 source=once(source,'if(plan.referencePlan&&plan.referencePlan.text!==s){',
   'if(!v219ReferenceIdentityQuarantine(s,cfg).opaque&&plan.referencePlan&&plan.referencePlan.text!==s&&v219RestoredCollectorPlanAllowed(s,cfg,plan.referencePlan,restore)){')
 source=once(source,'        s = automaticStructureCleanup(s,cfg,bump,warn);',
   '        s = automaticStructureCleanup(s,cfg,bump,warn,shield.restore);')
 source=once(source,'    function v29ReferenceRepairProjection(source,cfg={}) {return v29ReferenceRepairPlan(source,cfg).text;}',
   "    function v29ReferenceRepairProjection(source,cfg={}) {return v219ReferenceProjection(source,cfg,[['v29-reference-closers',v29ReferenceSyntaxEdits],['v29-reference-repairs',v29ReferenceRepairEdits]]);}")
 source=once(source,'    function v210ReferenceRepairProjection(source,cfg={}) {return v210ReferenceRepairPlan(source,cfg).text;}',
   "    function v210ReferenceRepairProjection(source,cfg={}) {return v219ReferenceProjection(source,cfg,[['v210-reference-tag-spacing',v210ReferenceSyntaxEdits],['v210-reference-conflicts',v210ReferenceConflictEdits],['v210-reference-banks',v210ReferenceBankEdits],['v210-harvard-anchors',v210HarvardAnchorEdits]]);}")
 source=once(source,"            edits.push({start:n.start,end:n.end,text:after});bump('shortCitationAuthors');",
   "            if(!v219GeneratedAuthorChangeAllowed(s,n.start,n.end,after,cfg))continue;\n            edits.push({start:n.start,end:n.end,text:after});bump('shortCitationAuthors');")
 source=once(source,'        s=livingBirthAge(s,cfg,bump);',
   '        {const shortBoundary=v219GeneratedReferenceBoundary(s);if(shortBoundary.present&&shortBoundary.safe)s=automaticShortCitationAuthors(s,cfg,bump);}\n        s=livingBirthAge(s,cfg,bump);')
 source=once(source,"                edits.push({start: r.start, end: r.end, text: r.body.trim()}); bump('referenceLists');",
   "                if(!v219GeneratedOuterReferenceAllowed(s,r,null,cfg))continue;\n                edits.push({start: r.start, end: r.end, text: r.body.trim()}); bump('referenceLists');")
 source=once(source,"if (['sfn', 'sfnm', 'harvnp', 'harvref', 'nre', 'refn'].includes(p.name)) {",
   "if (['sfn', 'sfnm', 'harvnp', 'harvref', 'nre', 'refn'].includes(norm(v215TemplateTitle(p.parts[0])))) {")
 source=once(source,"if(templates(r.body).nodes.some(n=>['sfn','sfnp','sfnm','sfnmp','nre','refn','efn','notas','referências'].includes(parsedTemplate(r.body.slice(n.start,n.end)).name)))continue;",
   "if(v219NativeNoteProfiles(r.body).length||v219NativeRProfiles(r.body).length||templates(r.body).nodes.some(n=>{const raw=r.body.slice(n.start,n.end);return v219NativeCollectorGroups(raw).recognized||['sfn','sfnp','sfnm','sfnmp','nre','refn','efn','notas','referências'].includes(parsedTemplate(raw).name);}))continue;")
 source=once(source,'    function refPunctuation(s, bump, warn) {',
   "    function refPunctuation(s, bump, warn, cfg={}) {\n        const defaultNotePlan=v219NativeOuterDefaultCollectorPlan(s,cfg);\n        if(defaultNotePlan.edits.length&&v219NativeOuterDefaultCollectorProof(s,defaultNotePlan.text,defaultNotePlan,cfg)){s=defaultNotePlan.text;bump('endMatter');}")
 source=once(source,"        for(const n of templates(source).nodes){const p=parsedTemplate(source.slice(n.start,n.end));\n            if(['nre','refn','efn','#tag:ref'].includes(p.name))\n                for(const e of templateEntries(p))if(['name','nome'].includes(e.key))defined.add(decodedReferenceName(e.value));\n        }",
   "        for(const profile of v219NativeNoteProfiles(source))if(profile.eligible&&profile.helperKind==='note')\n            for(const call of profile.calls)if(call.value&&call.body?.trim())defined.add(call.value);")
 source=once(source,'if(cfg.references)s=refPunctuation(s,noop,noop);','if(cfg.references)s=refPunctuation(s,noop,noop,cfg);')
 source=once(source,'if (cfg.references) s = refPunctuation(s, bump, warn);','if (cfg.references) s = refPunctuation(s, bump, warn,cfg);')
 source=once(source,"        if(options.namespaceNumber!==0||options.sectionOnly){result.reason='Marcação automática limitada à edição completa de artigos.';return result;}",
   "        if(!v219GeneratedMinorAllowed(before,after,options)){result.reason='Há alterações fora dos ajustes mecânicos confirmados.';return result;}\n        if(options.namespaceNumber!==0||options.sectionOnly){result.reason='Marcação automática limitada à edição completa de artigos.';return result;}")
 source=once(source,"        if(typeof chosen!=='string')return null;",
   "        if(typeof chosen!=='string')return v219NormalizedNativeCitationContext(raw);")
 source=once(source,'    function preserveLegacyRendererLayout(source,cfg={},bump=()=>{}) {\n',
   '    function preserveLegacyRendererLayout(source,cfg={},bump=()=>{}) {\n        if(v219ReferenceIdentityQuarantine(source,cfg).opaque)return source;\n')
 source=once(source,'    function automaticMissingNoteCollector(source,cfg,bump=()=>{}) {\n',
   '    function automaticMissingNoteCollector(source,cfg,bump=()=>{}) {\n        if(v219ReferenceIdentityQuarantine(source,cfg).opaque)return source;\n')
 source=once(source,'const stage=edits=>{if(!edits.length)return;const ordered=edits.slice().sort',
   'const stage=candidates=>{const edits=v219ReferenceIdentityStageEdits(current,candidates,cfg);if(!edits.length)return;const ordered=edits.slice().sort')
 source=once(source,'if(norm(p.parts[0])!==norm(target))p.parts[0]=target;','if(norm(p.parts[0])!==norm(target)&&!v219NativeMixedCitationIdentity(raw,profile))p.parts[0]=target;')
 source=once(source,'if(e.remove || e.generated)continue;','if(e.remove || e.generated)continue;\n            if(v219NativeMixedCitationField(raw,profile,e))continue;')
 source=once(source,'noop=()=>{},shield=maskProtected(source,noop);let text=shield.text;','noop=()=>{},normalRanges=mergeEditorialRanges([...v219QuotedTemplateRanges(source),...v219UnknownTemplateRanges(source,c),...v219UncertainReferenceRanges(source,c)]),shield=maskProtected(source,noop,mergeEditorialRanges([...normalRanges,...v219ReferenceDefinitionPeerRanges(source,normalRanges,c)]));let text=shield.text;')
 source=once(source,'text=applyEdits(text,edits);text=normalizeNumericReferenceNames(text,c,noop,noop);',
   'text=applyEdits(text,edits);if(c.references!==false)text=refPunctuation(text,noop,noop,c);text=normalizeNumericReferenceNames(text,c,noop,noop);')
 source=once(source,'    function v273MarriageInventory(source,cfg,wanted) {','    function v273MarriageInventory(source,cfg,wanted) {\n        source=v219NativeAgeInventoryProjection(v219LateMarriageInventoryProjection(source,cfg),cfg);')
 source=once(source,'    function auxiliaryParameters(raw, bump, warn) {',helpers+'\n    function auxiliaryParameters(raw, bump, warn) {')
 source=once(source,'            const guarded=maskProtected(prefix,()=>{},refTokens(protectedView(prefix)).filter(r=>{\n                const a=attrsOf(r.attrs);return a&&(a.name||a.follow);\n            }));',
   '            const namedRanges=refTokens(protectedView(prefix)).filter(r=>{\n                const a=attrsOf(r.attrs);return a&&(a.name||a.follow);\n            });\n            const guarded=maskProtected(prefix,()=>{},mergeEditorialRanges([...namedRanges,...v219PartialReferenceQuarantineRanges(syntactic,recovery.end,cfg),...v219ReferenceDefinitionPeerRanges(prefix,namedRanges,cfg)]));')
 source=once(source,'        edits.sort((a,b)=>a.start-b.start);\n        const text=v24SyntaxApply(source,edits);\n        return {...base,boundary,segments,edits,text};',
   '        const atomicEdits=v219AtomicNamedReferenceEdits(source,edits,cfg);\n        edits.splice(0,edits.length,...atomicEdits);\n        edits.sort((a,b)=>a.start-b.start);\n        const text=v24SyntaxApply(source,edits);\n        return {...base,boundary,segments,edits,text};')
 source=once(source,'    function v25SafeCitationSignature(body,cfg={}) {',
   '    function v25SafeCitationSignature(body,cfg={}) {\n        const nativeSignature=v219NativeCitationSemanticSignature(body,cfg);\n        if(nativeSignature!==null)return nativeSignature;')
 source=once(source,"s = s.replace(/\\[\\[\\s*(File|Image|Ficheiro|Arquivo|Imagem)\\s*:\\s*([^\\[\\]\\n]+)\\]\\]/gi, (all, ns, body) => {\n            const fields = splitParts(body);",
   "s = s.replace(/\\[\\[\\s*(File|Image|Ficheiro|Arquivo|Imagem)\\s*:\\s*([^\\[\\]\\n]+)\\]\\]/gi, (all, ns, body) => {\n            if(!v219NativeMediaHeaderAllowed(all))return all;\n            const fields = splitParts(body);")
 source=once(source,"if(namespace) {\n                changed[0]=match[1]+namespace[1]+':'+match[3];bump('translatedNamespaces');","if(namespace && v219ForeignNamespaceAllowed(match[2],namespace[1],match[3],s,r,cfg)) {\n                changed[0]=match[1]+namespace[1]+':'+match[3];bump('translatedNamespaces');")
 source=once(source,"return value.replace(/^(\\s*)([^:\\n]+):\\s*/, (all, spaces, prefix) =>\n            Object.entries(TRANSLATION_RULES.namespaceAliases).some(([k, v]) => norm(k) === norm(prefix) && v === 'Ficheiro') ? spaces : all);","if(typeof value!=='string')return value;\n        const match=/^(\\s*)([^:\\n]+):([ \\t]*)([\\s\\S]*)$/.exec(value);\n        if(!match||!v219LiteralMediaFilename(match[4]))return value;\n        return v219NativeNamespaceKind(match[2])==='file'||v219ForeignImageContext(match[2],match[4])?match[1]+match[4]:value;")
 source=once(source,"return raw.replace(/(^|\\n)([ \\t]*)([^:\\n]+):/g, (all, line, spaces, prefix) =>\n            Object.entries(TRANSLATION_RULES.namespaceAliases).some(([k,v]) => norm(k)===norm(prefix) && v==='Ficheiro') ? line+spaces+'Ficheiro:' : all);","return raw.replace(/(^|\\n)([ \\t]*)([^:\\n]+):([^\\n]*)/g, (all,line,spaces,prefix,payload) =>\n            v219ForeignImageContext(prefix,splitParts(payload)[0])?line+spaces+'Ficheiro:'+payload:all);")
 begin=source.index('    function preservationImageOption(value) {')
 end=source.index('    function preservationNamespace(target) {',begin)
 source=source[:begin]+'    function preservationImageOption(value) {return v219NativeMediaOption(value);}\n'+source[end:]
 begin=source.index('    function preservationNamespace(target) {')
 end=source.index('    function preservationLinks(source,depth=0) {',begin)
 source=source[:begin]+"    function preservationNamespace(target) {\n        const namespace=/^ *([^:\\n]+):/.exec(target),escaped=/^ *:/.test(target),kind=namespace&&!/[\\u0000-\\u001F\\u007F]/.test(namespace[1])&&v219NativeNamespaceKind(namespace[1]);\n        return {file:!escaped&&kind==='file'&&v219NativeMediaHeaderAllowed('[['+target+']]'),category:!escaped&&kind==='category'&&!/[\\u0000-\\u001F\\u007F]/.test(target)};\n    }\n"+source[end:]
 source=once(source,'            if (inRange(offset, ranges) || /[{}\\uE000]/.test(body)) return all;','            if (inRange(offset, ranges) || /[{}\\uE000]/.test(body)||/[\\u0000-\\u001F\\u007F]/.test(all)) return all;')
 # Dynamic metadata commands bypass the ordinary source-proof paths.
 # Retain their literal tokens rather than importing personal/category data.
 source=once(source,"        bb: '\\n{{Info/Biografia/Lua}}', ic: '\\n{{Wikidata Infobox/core}}',\n",'')
 source=once(source,"        im1: '|imagem={\\x7Bsubst:Valor Wikidata|P18|numval=1}}\\n|imagem_tamanho=250px',\n",'')
 source=once(source,"        ima: '{\\x7Bsubst:Valor Wikidata|P18|numval=1}}',\n",'')
 source=once(source,"        tb: '\\n{{Taxonbar|from={\\x7Bsubst:WD qid}}}}',\n",'')
 source=once(source,"        ir: '{{Info/Rio/Wikidata}}', ref: '{{Referências}}',\n","        ref: '{{Referências}}',\n")
 source=once(source,"        nm: '\\n{\\x7Bsubst:NM/Testes2}}', con: '\\n{{Controle de autoridade}}'\n",'')
 # Reference lists consume the preceding markers, not all later source.
 source=once(source,'            const m = r.body.trim().match(/^\\[(https?:\\/\\/[^\\s\\[\\]{}<>|]+)\\s+([^\\[\\]{}<>|]+)\\]$/);\n            if (!m) continue;\n','            const m = r.body.trim().match(/^\\[(https?:\\/\\/[^\\s\\[\\]{}<>|]+) +([^\\[\\]{}<>|]+)\\]$/);\n            if (!m||/[\'"]/.test(m[1])) continue;\n')
 source=once(source,'            const f = footer.exec(s); if (f) at = f.index;','            const lastMarker=[...refTokens(s),...templates(s).nodes.filter(node=>STRUCTURAL_NOTE_CALLS.has(parsedTemplate(s.slice(node.start,node.end)).name))].reduce((last,marker)=>Math.max(last,marker.end),0);\n            let f;while((f=footer.exec(s))){if(f.index>=lastMarker){at=f.index;break;}}')
 source=once(source,'        const segment = body.slice(blocks[0].start);\n        if (segment.includes','        const segment = body.slice(blocks[0].start);\n        // A bibliography or list can contain real reference markers. Moving\n        // its collector ahead of those markers leaves citations unrendered.\n        if(refTokens(segment).length||templates(segment).nodes.some(node=>STRUCTURAL_NOTE_CALLS.has(parsedTemplate(segment.slice(node.start,node.end)).name)))return source;\n        if (segment.includes')
 source=once(source,'} else if(profile.maxPos!==undefined && Number(key)<=profile.maxPos) {e.positional=true;}',
   '} else if(profile.maxPos!==undefined && Number(key)<=profile.maxPos) {/* Keep explicit numeric bindings and original implicit slots. */}')
 source=once(source,"if(e.index===1 && /(?:^|\\n)\\s*[*#]/.test(e.value))",
   "if(e.index===1 && e.key==='1' && /(?:^|\\n)\\s*[*#]/.test(e.value))")
 source=once(source,'    function obsoleteTemplate(raw, bump, warn) {','    function obsoleteTemplate(raw, bump, warn) {\n        if(v219NativeDateWrapperPreserved(raw))return raw;')
 source=once(source,'    function auxiliaryTemplate(raw, cfg, bump, warn) {',
   "    function auxiliaryTemplate(raw, cfg, bump, warn) {\n        const safeMaintenance=v219MaintenanceCall(raw,cfg);\n        if(safeMaintenance.handled){if(safeMaintenance.text!==raw)bump('maintenance');return safeMaintenance.text;}")
 source=once(source,'    function v271ChemicalBoxes(source,cfg={}) {\n',
   '    function v271ChemicalBoxes(source,cfg={}) {\n        if(cfg.markup===false)return [];\n')
 source=once(source,"'ver también': 'Ver também', 'veja também': 'Ver também',",
   "'ver también': 'Ver também', 'veja também': 'Ver também', 'veja tambem': 'Ver também', 'ver tambem': 'Ver também',")
 source=once(source,'        const p=parsedTemplate(source.slice(node.start,node.end)),fields=foreignEntries(p);',
   '        if(!v219NativeTopicBoxIdentity(source.slice(node.start,node.end)))return null;\n        const p=parsedTemplate(source.slice(node.start,node.end)),fields=foreignEntries(p);')
 source=once(source,'        const parts=v24SyntaxParts(core.slice(2,-2));if(!parts||parts.length<1)return null;',
   "        const parts=v24SyntaxParts(core.slice(2,-2));if(!parts||parts.length<1)return null;\n        if(!v219NativeMediaHeaderAllowed('[['+parts[0].text+']]'))return null;")
 source=once(source,'            if(/^(?:thumb|thumbnail|miniatura|frameless|sem moldura)$/i.test(option)){if(frame)return null;frame=true;}',
   '            if(v219BiographyImageFrameOption(option)){if(frame)return null;frame=true;}')
 source=once(source,"                if(caption!==null||raw!==raw.trim()||!raw||/^[\\p{L}_][\\p{L}\\p{N}_ -]*\\s*=|",
   "                if(v219NativeImageOption(raw))return null;\n                if(caption!==null||raw!==raw.trim()||!raw||/^[\\p{L}_][\\p{L}\\p{N}_ -]*\\s*=|")
 source=once(source,'const header=/^([^|{}\\r\\n]+)/.exec(source.slice(node.start+2,Math.min(node.end,node.start+242)));if(!header)continue;',
   'const header=v219CitationHeaderProbe(source,node);if(!header)continue;')
 source=once(source,"        if (!/^citar\\b|^citation$/i.test(p.parts[0].trim())) return false;\n        const raw=p.parts[0].trim().replace(/_/g,' ').replace(/\\s+/g,' '), title=profile?.title || CITE_NAMES[p.name];",
   "        const raw=p.parts[0].trim().replace(/_/g,' ').replace(/\\s+/g,' ');\n        if (!/^citar\\b|^citation$/i.test(raw)) return false;\n        const title=profile?.title || CITE_NAMES[p.name];")
 source=once(source,'        automaticCitationIslands: true,',
   '        automaticReferenceCollectorHeadings: true, automaticSourceCompatibility: true,\n        automaticCitationIslands: true,')
 source=once(source,"['referenceColumns', 'Até duas colunas em cada lista com dez ou mais entradas']",
   "['referenceColumns', 'Retirar estilos antigos do RevisaWiki nas referências']")
 # Native table layout may create implied rows. This source-only count
 # remains useful to conservative compound-repair refusals, not as a defect
 # to ask editors to fix in an otherwise valid table.
 source=once(source,'table-(?:dynamic|nested|large|complex|year-heading|header-scope)$',
   'table-(?:dynamic|nested|large|complex|year-heading|header-scope|rowspan-overflow)$')
 source=once(source,'if(!OCCUPATION_FIELDS.has(norm(field.key)))continue;',
   'if(!OCCUPATION_FIELDS.has(norm(field.key))||!v219NativeOccupationFieldAllowed(raw,field.key))continue;')
 source=once(source,'if (ordinaryRefs && !ordinaryList && !/<',
   'if (cfg.references!==false && ordinaryRefs && !ordinaryList && v219GeneratedDefaultCollectorAllowed(s,cfg) && !/<')
 source=once(source,'        const ordinaryList = renders.some(r => {\n            const raw = s.slice(r.start, r.end);\n            return !/(?:\\|\\s*(?:group|grupo)\\s*=\\s*[^|}\\s]+|<references\\b[^>]*\\bgroup\\s*=)/i.test(raw) &&\n                !/^\\{\\{\\s*(?:notas|notelist)(?=\\s*[|}])/i.test(raw);\n        });',"        const ordinaryList = renders.some(r => {\n            const raw = s.slice(r.start, r.end);\n            if (!/(?:\\|\\s*(?:group|grupo)\\s*=\\s*[^|}\\s]+|<references\\b[^>]*\\bgroup\\s*=)/i.test(raw) &&\n                !/^\\{\\{\\s*(?:notas|notelist)(?=\\s*[|}])/i.test(raw)) return true;\n            const tag = v24SyntaxTag(raw,0), attrs = tag?.name==='references'&&!tag.close&&!tag.typo?v24SyntaxAttrs(tag.attrs):null;\n            if (!attrs || !Object.hasOwn(attrs,'group') || attrs.group!=='' ||\n                !tag.self&&!/<\\/references\\s*>$/i.test(raw)) return false;\n            for (const ref of refTokens(s)) if (ref.start>=r.end) return false;\n            const scope = v24SyntaxContext(s,r.start);\n            return !scope.templates.length&&!scope.html.length&&!scope.tables.length&&!scope.links.length&&!scope.external.length;\n        });")
 source=once(source,"if (/^(?:coauthors?|coautores?)$/i.test(e.key) && !entries.some(x => /^(?:autor|último|primeiro)2$/.test(norm(x.key)))) {",
   "if (/^(?:coauthors?|coautor(?:es)?)$/i.test(e.key) && v219CitationCoauthorAllowed(raw,cfg,entries,e)) {")
 source=once(source,"if (tail && !entries.some(x => norm(x.key) === display)) {",
   "if (tail && v219CitationPeopleTailAllowed(raw,cfg,entries,e,display,tail[1])) {")
 source=once(source,'                if (link && who) {',
   '                if (link && who && v219CitationPeopleLinkAllowed(raw,cfg,entries,e,who,link)) {')
 source=once(source,"const k = norm(e.key), family = k === 'autores' || k === 'autor' ? 'autor' : k === 'editores' || k === 'editor' ? 'editor' : null;",
   "const k = norm(e.key), family = k === 'autores' || k === 'autor' ? 'autor' : k === 'editores' || k === 'editor' ? 'editor' : k === 'tradutor' ? 'tradutor' : null;")
 source=once(source,"if (!names || otherAuthorFields(entries, e, family)) continue;",
   "if (!names || !v219CitationPeopleSplitAllowed(raw,cfg,entries,e,family)) continue;")
 source=once(source,"        'citar conferência': 'Citar conferência', 'citar tese': 'Citar tese'",
   "        'citar conferência': 'Citar conferência', 'citar tese': 'Citar tese',\n        'citar comunicado de imprensa': 'Citar comunicado de imprensa', 'citar relatório': 'Citar relatório',\n        'citar vídeo': 'Citar vídeo', 'citar enciclopédia': 'Citar enciclopédia'")
 source=once(source,"            if (k === 'língua' && LANGUAGE_CODES[norm(v)]) change(e, LANGUAGE_CODES[norm(v)]);",
   "            const language=v219CitationLanguageFieldValue(raw,e.index,cfg);\n            if(language)change(e,v219ScalarValueWithPadding(e.value,language.code));")
 source=once(source,'                newValue = normalizeDate(value, warn);',
   '                newValue = v219ScalarValueWithPadding(value,normalizeDate(value, warn));')
 source=once(source,"            if (k === 'acessourl' && /^(?:subscription|registration|limited)$/i.test(v))\n                change(e, {subscription: 'subscrição', registration: 'registo', limited: 'limitado'}[v.toLowerCase()]);\n",'')
 source=once(source,"            if (k === 'url' && !hasParam(entries, 'arquivourl') && !hasParam(entries, 'arquivodata')) {",
   "            if (k === 'url' && v219CitationArchiveDecompositionAllowed(raw,cfg)) {")
 source=once(source,"            if(mapped==='língua' && LANGUAGE_CODES[norm(value)])e.value=LANGUAGE_CODES[norm(value)];",
   "            const language=profile.kind==='citation'?v219CitationLanguageFieldValue(raw,e.index,cfg,profile):null;\n            if(language)e.value=v219ScalarValueWithPadding(e.value,language.code);")
 source=once(source,"if(['data','ano','acessodata','arquivodata'].includes(mapped) && cfg.dates) e.value=translationDate(e.value,message);",
   "if(['data','ano','acessodata','arquivodata'].includes(mapped) && cfg.dates) e.value=v219ScalarValueWithPadding(e.value,translationDate(e.value,message));")
 source=once(source,"if(['nascimento_data','morte_data','lançamento'].includes(mapped) && cfg.dates && !/[{}]/.test(e.value))e.value=translationDate(e.value,message);",
   "if(['nascimento_data','morte_data','lançamento'].includes(mapped) && cfg.dates && !/[{}]/.test(e.value))e.value=v219ScalarValueWithPadding(e.value,translationDate(e.value,message));")
 for name,args,refusal in [('countryPortals','value,dedicated=false','[]'),
                         ('portalEvidenceText','value','null'),('v211Scalar','value','null'),
                         ('v26PortalOccupationList','value','null')]:
  anchor='    function '+name+'('+args+') {\n'
  source=once(source,anchor,anchor+'        if(v219OpaquePortalEvidence(value))return '+refusal+';\n')
 source=once(source,'    function v211ProductionCountries(box) {\n',
   "    function v211ProductionCountries(box) {\n        if(box.fields.some(field=>['país','pais'].includes(norm(field.key))&&v219OpaquePortalEvidence(field.value)))return [];\n")
 source=once(source,'        s = finalEndMatter(s, cfg, bump, warn);',
   '        s = finalEndMatter(s, {...cfg,portals:false}, bump, warn);')
 source=once(source,'        const completedText=v216EmptyEndHeadingCleanup(shield.restore(s),cfg,bump);',
   "        const localText=v219FinalLocalCleanup(shield.restore(s),cfg,bump);\n        if(cfg.captureTrace&&localText!==shield.restore(s))trace.push({label:'Reparos locais após a normalização',before:shield.restore(s),after:localText});\n        const portalText=v219LatePortalPass(localText,cfg,bump,warn);\n        if(cfg.captureTrace&&portalText!==localText)trace.push({label:'Portais confirmados',before:localText,after:portalText});\n        const completedText=v216EmptyEndHeadingCleanup(portalText,cfg,bump);")
 source=once(source,"        if(cfg.captureTrace&&finalText!==shield.restore(s))trace.push({label:'Linhas vazias excedentes na prosa',before:shield.restore(s),after:finalText});",
   "        if(cfg.captureTrace&&finalText!==portalText)trace.push({label:'Linhas vazias excedentes na prosa',before:portalText,after:finalText});")
 source=once(source,'        const recovery=syntaxRepairPrefix(syntactic,cfg);',
   '''        const recovery=syntaxRepairPrefix(syntactic,cfg);
        if(cfg.partialSyntaxRecovery!==false&&recovery.unresolved.length&&recovery.end===0){
            return {text:syntactic,changes:[...counts].map(([id,count])=>({id,label:GROUP_LABELS[id]||id,count})),
                warnings:[...warnings],removedDescriptions:[],suggestions:[],audit:referenceAudit(syntactic,cfg),
                syntaxIsolation:{start:0,tailUnchanged:true,approvedSourceHash:v24SyntaxHash(syntactic)},notApplied:[],
                trace:cfg.captureTrace&&syntactic!==source?[{label:'Reparos de sintaxe confirmados',before:source,after:syntactic}]:[]};
        }''')
 source=once(source,'            const text=prefixText+tail;',
   '            const text=v219FinalLocalCleanup(prefixText+tail,cfg,bump);')
 source=once(source,'            for(const id of preservationStandaloneISBNs(s))found.add(\'isbn=\'+id);',
   '            for(const id of preservationStandaloneISBNs(s))found.add(\'isbn=\'+id);\n            for(const id of v219LiteralISBNValues(s,options))found.add(\'isbn=\'+id);')
 source=once(source,"        return v210ReferenceRepairProjection(v29ReferenceRepairProjection(v24SyntaxApply(text,v27SafeAutomationEdits(text,c,'references')),c),c);",
   "        return v219LateAdjacentReferenceProjection(v210ReferenceRepairProjection(v29ReferenceRepairProjection(v24SyntaxApply(text,v219StageSafeEdits(text,v27SafeAutomationEdits(text,c,'references'),'v27-references',c)),c),c),c);")
 source=once(source,"        // Limpeza apenas de linhas de prosa. Preservar alinhamento de tabelas e parâmetros.\n        const blocks = structuralRanges(s);\n        s = s.replace(/\\S([ \\t]+)$/gm, (all, space, offset) => {\n            if (inRange(offset, blocks)) return all; bump('markup'); return all.slice(0, -space.length);\n        });",
   "        // Trailing spacing is handled once on restored source by the\n        // source-bound ordinary-prose plan. Masked fragments do not provide\n        // enough context to classify quotations or unresolved owners.")
 source=once(source,'                let text=raw;const noop=()=>{};',
   '                let text=v219StructuralValueMarkupPlan(raw,cfg,true).text;const noop=()=>{};')
 source=once(source,"        if(wantedTableIndexes.size){const tables=tableAnalysis(plan.text).tables,wanted=new Set();for(const index of wantedTableIndexes){if(!tables[index])return reject('A tabela corrigida deixou de existir no texto confirmado.');wanted.add(v24InventoryTable(plan.text,tables[index],cfg));}\n            const before=v24InventoryCount(tableAnalysis(expected).tables.map(t=>v24InventoryTable(expected,t,cfg)).filter(key=>wanted.has(key))),after=v24InventoryCount(tableAnalysis(actual).tables.map(t=>v24InventoryTable(actual,t,cfg)));\n            if(!before.size||!v24InventoryContains(before,after))return reject('A tabela corrigida perdeu uma célula, legenda, conteúdo ou a ordem das linhas.');}",
   "        if(wantedTableIndexes.size){const structural=v219DuplicateAttributeTableProof(plan,expected,actual);\n            if(!structural.accepted)return reject(structural.reason);}")
 # A caption can be a complete sentence or a fragment. The old heuristic
 # could not distinguish them, so punctuation is retained without an alert.
 start=source.index('    function captionTerminalPeriods(source,cfg,bump=()=>{}) {')
 end=source.index('    function v214ReviewGroupKey(',start)
 source=source[:start]+'    function captionTerminalPeriods(source,cfg,bump=()=>{}) {\n        return v219CaptionTerminalPeriods(source,cfg,bump);\n    }\n'+source[end:]
 source=once(source,'        const scan=v24SyntaxScan(view.slice(0,at));return {templates:scan.templates,html:scan.html,tables:scan.tables,links:scan.links,external:scan.external};',
   '        const indexed=v219IndexedSyntaxContext(view,at);if(indexed)return indexed;\n        const scan=v24SyntaxScan(view.slice(0,at));return {templates:scan.templates,html:scan.html,tables:scan.tables,links:scan.links,external:scan.external};')
 source=once(source,'inRange(n.start, contexts.filter(r => r.start < n.start || r.end > n.end))',
   'v219RangeOutside(n.start,contexts,n.start,n.end)')
 source=once(source,'    function v24SyntaxProtected(source) {',
   '    function v24SyntaxProtected(source) {return v219ProtectedSyntax(source);}\n    function v219LegacySyntaxProtected(source) {')
 source=once(source,'const view=protectedView(source), blockers=[...structuralRanges(view).filter',
   'const view=v219StructuralReadView(source), blockers=[...v219MarkdownLiteralRanges(source),...v219ProtectedSyntax(source).ranges.filter(range=>range.kind===\'quotation-template\'),...structuralRanges(view).filter')
 source=once(source,'const lists=rendererRanges(view).filter(n=>!inRange(n.start,info.blockers)).map',
   'const lists=rendererRanges(view).filter(n=>!inRange(n.start,info.blockers)&&!nodes.some(parent=>parent.start<n.start&&n.end<=parent.end)).map')
 source=once(source,'    function v215BraceParts(body,strict=false) {',
   '    function v215BraceParts(body,strict=false) {return v219CachedBraceParts(body,strict);}\n    function v219LegacyBraceParts(body,strict=false) {')
 source=once(source,'    function v215BraceStructure(source) {',
   '    function v215BraceStructure(source) {return v219CachedBraceStructure(source);}\n    function v219LegacyBraceStructure(source) {')
 source=once(source,'    function v24SyntaxRendererContext(source,at,templates) {',
   '    function v24SyntaxRendererContext(source,at,templates) {return v219RendererContext(source,at,templates);}\n    function v219LegacyRendererContext(source,at,templates) {')
 start=source.index('    function v214DrugCaseRefusal(raw,key,target,cfg={}) {')
 end=source.index('    function v214DrugOwner(',start)
 source=source[:start]+'''    function v214DrugCaseRefusal(raw,key,target,cfg={}) {
        if(typeof raw!=='string')return false;
        const context=v214DrugContext(parsedTemplate(raw).parts[0]);
        if(!context)return false;
        const rule=V214_DRUG_FIELDS.rules[context.id].find(item=>item.target===target&&item.aliases.includes(key));
        if(!rule)return false;
        // A declined typed medical-field repair is not permission for the
        // general capitalization fallback to activate that same field.
        return !v214DrugCall(raw,cfg).edits.some(edit=>edit.before===key&&edit.after===target);
    }
'''+source[end:]
 source=once(source,'const stage=(name,find)=>{const edits=find(plan.text);if(!edits.length)return;',
   'const stage=(name,find)=>{const edits=v219StageSafeEdits(plan.text,find(plan.text),name,cfg);if(!edits.length)return;')
 source=once(source,'        if(native?.title)return v215SameTemplateTitle(literal,native.title);',
   "        if(native?.oldid===73044750&&v215SameTemplateTitle(literal,'Info/música/artista')&&v215SameTemplateTitle(native.title,'Info/Música/artista'))return true;\n        if(native?.title)return v215SameTemplateTitle(literal,native.title);")
 source=once(source,'        if(native?.title)return v215SameTemplateTitle(literal,native.title);','        if(v219NativePersonAliasIdentity(literal,native))return true;\n        if(native?.title)return v215SameTemplateTitle(literal,native.title);')
 source=once(source,'    function v281CitationObligation(raw,cfg) {\n        raw=v213ReferenceCall(raw,cfg).text;',
   '    function v281CitationObligation(raw,cfg) {\n        raw=v219CitationProtocolProjection(raw,cfg);\n        const nativeUrlStates=v219CitationUrlStateObligations(raw,cfg);\n        raw=v219CitationEmptyPartsPlan(v213ReferenceCall(raw,cfg).text,cfg).text;')
 source=once(source,"return JSON.stringify([norm(family),anchors.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),[...new Set(dates)].sort()]);",
   "return JSON.stringify([norm(family),anchors.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),[...new Set(dates)].sort(),nativeUrlStates]);")
 source=once(source,"        if(!proof.accepted)findings.push({code:'lost-category',message:proof.reason,start:-1,severity:'warning'});",
   "        if(!proof.accepted)findings.push({code:'lost-category',message:proof.reason,start:-1,severity:'warning'});\n        const sourceDate=v219SourceDateRetention(before,after,options);\n        if(!sourceDate.accepted)findings.push({code:'lost-source-citation-date',message:sourceDate.reason,start:-1,severity:'warning'});\n        const bank=v219NativeBankRetention(before,after,options);\n        if(!bank.accepted)findings.push({code:'lost-native-reference-bank',message:bank.reason,start:-1,severity:'warning'});\n        const rawIdentity=v219UncertainReferenceRetention(before,after,options);\n        if(!rawIdentity.accepted)findings.push({code:'lost-uncertain-reference-identity',message:rawIdentity.reason,start:-1,severity:'warning'});\n        const binding=v219NamedReferenceRetention(before,after,options);\n        if(!binding.accepted)findings.push({code:'lost-reference-binding',message:binding.reason,start:-1,severity:'warning'});")
 source=once(source,'    function safeComposition(before,after,options={}) {\n        const nativeCitation=v214NSRWRetention(before,after,options);',
   '    function safeComposition(before,after,options={}) {\n        const sourceDate=v219SourceDateRetention(before,after,options);if(!sourceDate.accepted)return sourceDate.reason;\n        const bank=v219NativeBankRetention(before,after,options);if(!bank.accepted)return bank.reason;\n        const rawIdentity=v219UncertainReferenceRetention(before,after,options);if(!rawIdentity.accepted)return rawIdentity.reason;\n        const binding=v219NamedReferenceRetention(before,after,options);if(!binding.accepted)return binding.reason;\n        const nativeCitation=v214NSRWRetention(before,after,options);')
 source=once(source,"        let offset=0;for(const line of source.match(/[^\\n]*(?:\\n|$)/g)||[])",
   "        const preformattedOwners=[...parsed.nodes,...parsed.unclosed.map(n=>({...n,end:source.length}))];\n        let offset=0;for(const line of source.match(/[^\\n]*(?:\\n|$)/g)||[])")
 source=once(source,'![...parsed.nodes,...parsed.unclosed.map(n=>({...n,end:source.length}))].some(n=>n.start<=offset&&offset<n.end)',
   '!inRange(offset,preformattedOwners)')
 source=once(source,"analysis.repairs.filter(r=>r.rule!=='tableHeaderScopes'||cfg.tableAccessibility!==false)",
   "analysis.repairs.filter(r=>v219TableAutomaticRepairAllowed(r,source,analysis)&&(r.rule!=='tableHeaderScopes'||cfg.tableAccessibility!==false))")
 source=once(source,'            if(t.nested||t.end-t.start>500000||report.edits.length>=100)continue;',
   '            if(t.nested||t.end-t.start>500000||report.edits.length>=100||!v219TableSourceIsLiteral(source,t.start,t.end))continue;')
 source=once(source,'const protectedRanges=v24SyntaxProtected(source).ranges,edits=[];',
   'const protectedRanges=v219DuplicateAttributeProtectedRanges(source),edits=[];')
 source=once(source,'    function pauseLocal() { return new Promise(resolve => root.setTimeout(resolve, 0)); }',
   '''    function pauseLocal() {
        return new Promise(resolve=>{
            let channel;
            try {
                if(typeof root.MessageChannel==='function') {
                    channel=new root.MessageChannel();
                    channel.port1.onmessage=()=>{
                        channel.port1.close();channel.port2.close();resolve();
                    };
                    channel.port2.postMessage(null);return;
                }
            } catch(error) {channel?.port1.close();channel?.port2.close();}
            const posted=v219PostMessagePause();
            if(posted){posted.then(resolve);return;}
            root.setTimeout(resolve,0);
        });
    }''')
 source=once(source,"        stage('v210-table-syntax',s=>v213TableFiniteRepairEdits(s,cfg));",
   "        stage('v219-foreign-media',s=>v219ForeignMediaPlan(s,cfg).edits);\n        stage('v219-outside-opaque-links',s=>v219OpaqueOwnerLinkEdits(s,cfg));\n        stage('v210-table-syntax',s=>v213TableFiniteRepairEdits(s,cfg));")
 source=once(source,"        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));","        stage('v27-whole-article-wrapper',s=>v27WholeArticleWrapperEdits(s,cfg));\n        stage('v219-initial-lead-heading',s=>v25LeadHeadingPlan(s,cfg).edits);\n        stage('v219-identical-biography-date-aliases',s=>v219BiographyDateAliasPlan(s,cfg).edits);")
 source=once(source,"        stage('v218-citation-date-values',s=>v218CitationDateEdits(s,cfg));",
   "        stage('v219-source-compatibility',s=>v219SourceCompatibilityEdits(s,cfg));\n        stage('v218-citation-date-values',s=>v218CitationDateEdits(s,cfg));")
 source=once(source,"        stage('v218-reference-layout',s=>v218ReferenceLayoutEdits(s,cfg));",
   "        stage('v218-reference-layout',s=>v218ReferenceLayoutEdits(s,cfg));\n        stage('v219-reference-collector-headings',s=>v219ReferenceCollectorEdits(s,cfg));")
 source=once(source,'if(!/^[Rr]eferências$/.test(head))return result;',
   'if(!v219NativeReferenceCollectorAlias(head))return result;')
 source=once(source,"        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));",
   "        stage('v219-native-collector-groups',s=>v219NativeCollectorGroupEdits(s,cfg));\n        stage('v212-reference-fields',s=>v212ReferenceFieldEdits(s,cfg));")
 source=once(source,"        stage('v219-source-compatibility',s=>v219SourceCompatibilityEdits(s,cfg));",
   "        stage('v219-magic-words',s=>v219MagicWordEdits(s,cfg));\n        stage('v219-source-compatibility',s=>v219SourceCompatibilityEdits(s,cfg));")
 source=once(source,'                const {p, map} = fields(raw), group = v212NativeRendererGroup(p);',
   '                const native=v219NativeCollectorGroups(raw);\n                if(native.recognized){native.groups.forEach(group=>groups.add(group));continue;}\n                const {p, map} = fields(raw), group = v212NativeRendererGroup(p);')
 source=once(source,'else { const {p} = fields(raw); inheritedGroup = v212NativeRendererGroup(p); }',
   'else { const native=v219NativeCollectorGroups(raw),{p}=fields(raw); inheritedGroup=native.recognized&&!native.ambiguous?(native.bankGroups[0]??\'\'):v212NativeRendererGroup(p); }')
 source=once(source,"            const parsed=parsedTemplate(raw),entries=foreignEntries(parsed),groups=entries.filter(e=>['grupo','group'].includes(norm(e.key)));",
   "            const parsed=parsedTemplate(raw),entries=foreignEntries(parsed),native=v219NativeCollectorGroups(raw);\n            if(native.recognized){\n                if(native.ambiguous)globallyUncertain=true;\n                for(const group of native.groups)push(node,group===(native.bankGroups[0]??null)?parsed.name:'combined-notes',decodedReferenceName(group),!native.ambiguous,entries);\n                continue;\n            }\n            const groups=entries.filter(e=>['grupo','group'].includes(norm(e.key)));")
 source=once(source,"if (opts[fields[i].trim().toLowerCase()]) fields[i]","if (!v219NativeImageOption(fields[i]) && opts[fields[i].trim().toLowerCase()]) fields[i]")
 # Native file aliases and native flags are already accepted. The old
 # callback also case-folded literal caption words and counted an intermediate
 # namespace canonicalization a second time after a foreign media repair.
 begin=source.index('        s = s.replace(/\\[\\[\\s*(File|Image|Ficheiro|Arquivo|Imagem)',source.index('    function categoryPass('))
 end=source.index('        // Um título antigo com Anexo',begin)
 source=source[:begin]+source[end:]
 source=once(source,'    function v218CitationDateEdits(source,options={}) {','    function v218CitationDateEdits(source,options={}) {return v219CitationDateEdits(source,options); }\n    function v219LegacyCitationDateEdits(source,options={}) {')
 source=once(source,"    function v218CitationDateValue(value,kind='date') {","    function v218CitationDateValue(value,kind='date') {\n        return v219SupplementalCitationDateValue(value,kind)||v219LegacyCitationDateValue(value,kind);\n    }\n    function v219LegacyCitationDateValue(value,kind='date') {")
 source=once(source,"rule.kind === 'defaultsort' ? alias.replace", "['defaultsort','displaytitle'].includes(rule.kind) ? alias.replace")
 source=once(source,"return accepted.has(key) || accepted.has(key.replace(/\\d+$/,'#')) ||", "return accepted.has(key) || accepted.has(key.replace(/\\d+/g,'#')) ||")
 source=once(source,"const p=parsedTemplate(raw), entries=foreignEntries(p), issues=[],issueEvidence=[];", "const p=parsedTemplate(raw), entries=foreignEntries(p), issues=[],issueEvidence=[];\n        const sourceGroupDeclared=entries.some(entry=>['group','groupe','grupo'].includes(norm(entry.key)));")
 source=once(source,"if(!original('group') && !original('groupe'))", "if(!sourceGroupDeclared)")
 source=once(source,"const shield = maskProtected(gallerySyntax(initial,cfg,bump), warn, [...discussionProtectionRanges(initial,cfg),...v215DefinitionProtectedRanges(initial,cfg)]);", "let galleryInitial=gallerySyntax(initial,cfg,bump);\n        const generatedSortPlan=v219GeneratedDefaultSortPlan(galleryInitial,cfg);\n        if(generatedSortPlan.edits.length&&v219GeneratedDefaultSortProof(galleryInitial,generatedSortPlan.text,generatedSortPlan,cfg)){galleryInitial=generatedSortPlan.text;generatedSortPlan.edits.forEach(()=>bump('translatedMagicwords'));}\n        const normalRanges=mergeEditorialRanges([...discussionProtectionRanges(galleryInitial,cfg),...v215DefinitionProtectedRanges(galleryInitial,cfg),...v219QuotedTemplateRanges(galleryInitial,cfg),...v219UnknownTemplateRanges(galleryInitial,cfg),...v219MarkdownLiteralRanges(galleryInitial),...v219UncertainReferenceRanges(galleryInitial,cfg)]),\n            peerRanges=v219ReferenceDefinitionPeerRanges(galleryInitial,normalRanges,cfg);\n        const shield = maskProtected(galleryInitial, warn, mergeEditorialRanges([...normalRanges,...peerRanges]));")
 # Both native small markup and the two accepted end-section orders are
 # already valid. Retire presentation churn and the inverted option gate.
 begin=source.index('        const small = /<small>')
 end=source.index('        // Aplicar as conversões de HTML',begin)
 source=source[:begin]+source[end:]
 begin=source.index('        // Para uma única seção Ver também, mover só um bloco composto de lista simples.')
 end=source.index('        return s;',begin)
 source=source[:begin]+source[end:]
 source=once(source,"                if (newValue !== value) bump('identifiers'); value = newValue;","                if(['doi','isbn','pmid','pmc'].includes(k)){const normalized=v219CitationIdentifierNormalization(k,value);newValue=normalized===null?value:normalized;}\n                if (newValue !== value) bump('identifiers'); value = newValue;")
 source=once(source,'? mappedParam(originalKey, parsed.name) : originalKey;',
   '? v219CitationMappedParameter(parsed,originalKey,i,cfg) : originalKey;')
 source=once(source,'    function infobox(raw, bump, warn) {','    function infobox(raw, bump, warn, cfg={}) {')
 calls={
  'infobox(raw,noop,warn)':'infobox(raw,noop,warn,cfg)',
  'infobox(childFirst,bump,noop)':'infobox(childFirst,bump,noop,cfg)',
  'infobox(migration.text,bump,noop)':'infobox(migration.text,bump,noop,cfg)',
  'infobox(raw,bump,text=>{if(!/^Parâmetro fora do catálogo|^Infocaixa .*parâmetro não reconhecido/.test(text))warn(text);})':'infobox(raw,bump,text=>{if(!/^Parâmetro fora do catálogo|^Infocaixa .*parâmetro não reconhecido/.test(text))warn(text);},cfg)',
  'infobox(next, bump, warn)':'infobox(next, bump, warn,cfg)',
  'infobox(automaticParameters(raw,cfg,noop),noop,noop)':'infobox(automaticParameters(raw,cfg,noop),noop,noop,cfg)',
  'infobox(raw,noop,noop)':'infobox(raw,noop,noop,cfg)',
  'infobox(eligible?migration.text:mechanical,noop,noop)':'infobox(eligible?migration.text:mechanical,noop,noop,cfg)'
 }
 for old,new in calls.items():
  assert old in source,'Infobox call anchor missing: '+old
  source=source.replace(old,new)
 source=once(source,'if (target && accepted.has(target)) {',
   'if (target && accepted.has(target) && cfg.automaticParameterNames!==false) {')
 source=once(source,'            const target=V28_BIOGRAPHY_PARAMETER_TYPOS[field.key];',
   '            if(cfg.automaticParameterNames===false)continue;\n            const target=V28_BIOGRAPHY_PARAMETER_TYPOS[field.key];')
 source=once(source,"            if(v2151FrozenBurialField(field.key)||profileAccepts(box.profile,field.key)||acceptedNormalized.has(norm(field.key))||",
   "            if(cfg.automaticParameterNames===false||v2151FrozenBurialField(field.key)||profileAccepts(box.profile,field.key)||acceptedNormalized.has(norm(field.key))||")
 source=once(source,'if (existing && existing.value.trim() !== value.trim() && existing.value.trim() && value.trim()) {',
   'if (existing && existing.value.trim() !== value.trim()) {')
 old='''                } else if (existing) {
                    if (!existing.value.trim() && value.trim()) {
                        existing.value = value;
                        parts[existing.i] = existing.before[1] + target + existing.before[3] + value;
                        bump('infoboxParameters');
                    }
                    parts[entry.i] = null; entry.deleted = true; bump('infoboxDuplicates');
'''
 new='''                } else if (existing && cfg.automaticParameterDuplicates!==false) {
                    parts[entry.i] = null; entry.deleted = true; bump('infoboxDuplicates');
'''
 source=once(source,old,new)
 source=once(source,"if (before.value.trim() === entry.value.trim()) { parts[entry.i] = null; entry.deleted = true; bump('infoboxDuplicates'); }",
   "if (before.value.trim() === entry.value.trim()) { if(cfg.automaticParameterDuplicates!==false){parts[entry.i] = null; entry.deleted = true; bump('infoboxDuplicates');} }")
 source=once(source,"if (p.value.trim() === prev.value.trim()) { parts[p.i] = null; bump('duplicateParameters'); }",
   "if (p.value.trim() === prev.value.trim()) { if(cfg.automaticParameterDuplicates!==false){parts[p.i] = null; bump('duplicateParameters');} }")
 source=once(source,"if(seen.has(family)) {if(seen.get(family).value.trim()===e.value.trim())e.remove=true;else message(",
   "if(seen.has(family)) {if(seen.get(family).value.trim()===e.value.trim()){if(cfg.automaticParameterDuplicates!==false)e.remove=true;}else message(")
 source=once(source,"if(!profile.partial && cfg.automaticEmptyParameters && !e.value.trim()) {",
   "if(!profile.partial && cfg.automaticEmptyParameters && !e.value.trim()&&!v219EmptyParameterCollision(e,entries,profile)) {")
 source=once(source,"if (!v && !/^(pontofinal|ref|separator|separador)$/.test(k)) {",
   "if (cfg.automaticEmptyParameters!==false && !v && TEMPLATE_CATALOG[p.name] && !TEMPLATE_CATALOG[p.name].partial && !nativeCitationAccepts(p,e.key) && !/^(pontofinal|ref|separator|separador)$/.test(k) && !entries.some(other=>other!==e&&parameterFamily(other.key)===parameterFamily(e.key))) {")
 for name,args in [('citation','raw, cfg, bump, warn'),('extendedCitation','raw, cfg, bump, warn'),('automaticCitationRepairs','raw,cfg,bump=()=>{}')]:
  old='    function '+name+'('+args+') {\n'
  source=once(source,old,old+'        if(!v219CitationLanguageAllowed(raw,cfg))return raw;\n')
 source=once(source,'        const profile=translationProfile(raw); if(!profile || !translationEnabled(profile,cfg)) return null;',
   '        const profile=translationProfile(raw); if(!profile || !translationEnabled(profile,cfg)) return null;\n        const dateWrapper=v219DateWrapperMigrationRefusal(raw,profile);if(dateWrapper)return dateWrapper;\n        const shortCitation=v219NativeShortCitationRefusal(raw,profile);if(shortCitation)return shortCitation;\n        const foreignShortCitation=v219ForeignShortCitationRefusal(raw,profile);if(foreignShortCitation)return foreignShortCitation;\n        const listSlots=v219VariadicListSlotRefusal(raw,profile);if(listSlots)return listSlots;\n        const refusal=v219NativeMixedParameterRefusal(raw,profile,cfg);if(refusal)return refusal;\n        const identifier=v219NativeIdentifierActivationRefusal(raw,profile);if(identifier)return identifier;\n        const local=v219LocalCitationRedirectCall(raw,cfg,profile);if(local)return local;\n        const state=v219ForeignCitationStateRefusal(raw,profile);if(state)return state;\n        const official=v219OfficialSiteCall(raw,cfg);if(official)return official;')
 source=once(source,'    function migrateForeignTemplate(raw,cfg,choiceTarget) {',
   '''    function migrateForeignTemplate(raw,cfg,choiceTarget) {
        const nativeReflist=v219NativeReflistCall(raw,cfg);
        if(nativeReflist)return {...nativeReflist,candidate:nativeReflist.text,
            profile:{nativeRenderer:true,kind:'renderer',target:'Referências',
                source:{language:'pt',title:'Predefinição:Reflist',oldid:56151616}}};''')
 start=source.index('    function preserveLegacyRendererLayout(source,cfg={},bump=()=>{}) {')
 end=source.index('    function structuralAudit(',start)
 source=source[:start]+'''    function preserveLegacyRendererLayout(source,cfg={},bump=()=>{}) {
        if(!structuralScope(cfg)||cfg.references===false||v219ReferenceIdentityQuarantine(source,cfg).opaque)return source;
        const info=structuralReaders(source),edits=[],markdown=v27SafeMarkdownRanges(source);
        for(const node of info.nodes){
            if(inRange(node.start,markdown))continue;
            const native=v219NativeReflistCall(source.slice(node.start,node.end),cfg);
            if(native?.converted)edits.push({start:node.start,end:node.end,text:native.text});
        }
        edits.forEach(()=>bump('rendererHeadingPreserved'));
        return applyEdits(source,edits);
    }
'''+source[end:]
 start=source.index('    function migrateReflist(p, before, warn) {')
 end=source.index('    function normalizeRefs(',start)
 source=source[:start]+'''    function migrateReflist(p, before, warn) {
        const native=v219NativeReflistCall('{{'+p.parts.join('|')+'}}');
        return native?.converted?native.text:null;
    }
'''+source[end:]
 anchor="            if (inRangeExcept(n.start,ranges,n.start,n.end)) continue;\n            if (isVerifiedReferenceRedirect(p.parts[0])) {"
 replacement="""            if (inRangeExcept(n.start,ranges,n.start,n.end)) continue;
            const nativeReflist=v219NativeReflistCall(raw);
            if(nativeReflist){
                if(!aliasQuoteRanges)aliasQuoteRanges=[...structuralQuoteRanges(protectedView(s)),...v27SafeMarkdownRanges(s)];
                if(!inRange(n.start,aliasQuoteRanges)&&nativeReflist.converted){
                    edits.push({start:n.start,end:n.end,text:nativeReflist.text});bump('rendererHeadingPreserved');
                }
                continue;
            }
            if (isVerifiedReferenceRedirect(p.parts[0])) {"""
 source=once(source,anchor,replacement)
 source=once(source,"const title = m[2].replace(/^(['\"]{1,3})(.*?)\\1$/, '$2');",'if(/[\\p{Cc}\\p{Zl}\\p{Zp}]/u.test(m[2]))continue;\n            const title = m[2];')
 source=once(source,'            const m = r.body.trim().match(/^\\[(https?:\\/\\/[^\\s\\[\\]{}<>|]+) +([^\\[\\]{}<>|]+)\\]$/);','            if(/[\\uE000-\\uF8FF]/.test(r.body))continue;\n            const m = r.body.trim().match(/^\\[(https?:\\/\\/[^\\s\\[\\]{}<>|]+) +([^\\[\\]{}<>|]+)\\]$/);')
 source=once(source,"if(key==='acessodata')dates.push(v24InventorySpace(cfg.dates?normalizeDate(field.value,()=>{}):field.value));",
   "if(key==='acessodata')dates.push(v219CitationAccessDateIdentity(field.value,cfg));")
 old='''            if (cfg.citations && norm(originalKey) === 'url-status') {
                const status = norm(value);
                if (['dead', 'live', 'yes', 'no'].includes(status)) {
                    key = 'urlmorta'; newValue = ['dead', 'yes'].includes(status) ? 'sim' : 'não';
                } else warn('url-status=' + value.trim() + ' preservado. Esse estado precisa de revisão manual.');
            } else if (cfg.citations && key === 'urlmorta') {
                if (/^(?:yes|dead)$/i.test(value.trim())) newValue = 'sim';
                else if (/^(?:no|live)$/i.test(value.trim())) newValue = 'não';
            }
'''
 new='''            const nativeUrlState=v219CitationUrlState(originalKey,value);
            if(nativeUrlState){key=nativeUrlState.key;newValue=nativeUrlState.value;}
'''
 source=once(source,old,new)
 source=once(source,"            if (k === 'urlmorta') {\n                if (/^(?:1|ja|ya|yes|sì|morto|morta)$/i.test(v)) change(e, 'sim');\n                if (/^(?:0|live|vivo|activo|ativo)$/i.test(v)) change(e, 'não');\n            }\n",'')
 source=once(source,"        const name=nameOf(literal),native=profile||INFOBOX_CATALOG[name]||TEMPLATE_CATALOG[name];",
   "        if(v219LocalCitationRedirectIdentity(raw,profile))return true;\n        const name=nameOf(literal),native=profile||v219NativeHeaderProfile(literal);")
 old='''                    if(alias.includes('$1')) {
                        const [prefix,suffix]=alias.split('$1');
                        if(option.startsWith(prefix) && option.endsWith(suffix) && option.length>=prefix.length+suffix.length) {
                            changed[i]=rule.target.replace('$1',option.slice(prefix.length,suffix?option.length-suffix.length:undefined));
                            if(changed[i]!==parts[i])bump('translatedImageOptions');break;
                        }
                    } else if(option===alias) {changed[i]=rule.target;if(changed[i]!==parts[i])bump('translatedImageOptions');break;}
'''
 new='''                    const translated=v219ContextualImageOption(alias,rule,parts[i],match[2],match[3]);
                    if(translated!==null){changed[i]=translated;if(changed[i]!==parts[i])bump('translatedImageOptions');break;}
'''
 source=once(source,old,new)
 # All foreign magic-word changes use the same whole-source plan. Accepted
 # native aliases and literal examples are retained byte for byte.
 begin=source.index('        if(cfg.auxiliaryTemplates)for(const [alias,rule] of Object.entries(TRANSLATION_RULES.magicAliases)) {',source.index('    function foreignSyntax('))
 end=source.index('        const edits=[],stack=[],links=[];',begin)
 source=source[:begin]+"        const magic=v219MagicWordPlan(s,cfg);if(magic.edits.length){s=magic.text;for(const edit of magic.edits)bump('translatedMagicwords');}\n"+source[end:]
 source=once(source,'        const p = parsedTemplate(raw), name = p.parts[0].trim();\n        for (const [alias, rule] of Object.entries(TRANSLATION_RULES.magicAliases)) {',
   '        const p = parsedTemplate(raw), name = p.parts[0].trim();\n        if(v219NativeMagicWord(name))return null;\n        for (const [alias, rule] of Object.entries(TRANSLATION_RULES.magicAliases)) {')
 source=once(source,'function translationProfile(raw) {return v281CitationProfile(raw,v281LegacyTranslationProfile(raw));}',
   'function translationProfile(raw) {return v281CitationProfile(raw,v219TranslationProfile(raw,v281LegacyTranslationProfile(raw)));}')
 source=once(source,'        if(foreign){\n            const source=String(foreign.source?.title',
   '        if(foreign){\n            if(v219ForeignTemplateIdentity(raw,foreign))return true;\n            const source=String(foreign.source?.title')
 source=once(source,"if(profile.kind==='citation')return profile.strictNativeCitation?!!targetProfile&&profileAccepts(targetProfile,key):citationKeys.includes(key) || citationKeys.includes(key.replace(/\\d+$/,'#'));",
   "if(profile.kind==='citation')return profile.strictNativeCitation?!!targetProfile&&(profileAccepts(targetProfile,key)||v219NumberedCitationAccepts(targetProfile,key,raw,profile)):citationKeys.includes(key) || citationKeys.includes(key.replace(/\\d+$/,'#'));")
 source=once(source,'        const seen=new Map();\n        for(const e of entries.filter(e=>!e.remove)) {',
   '        const collision=v219ForeignCitationRoleCollision(raw,profile,target,entries);\n        if(collision)return {profile,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[],proof:collision};\n        const seen=new Map();\n        for(const e of entries.filter(e=>!e.remove)) {')
 source=once(source,"            if(profile.kind==='infobox'&&INFOBOX_CATALOG[p.name]&&v215LiteralTemplateIdentity(raw)&&v2151FrozenBurialField(e.key))continue;",
   "            if(profile.kind==='infobox'&&INFOBOX_CATALOG[p.name]&&v215LiteralTemplateIdentity(raw)&&v2151FrozenBurialField(e.key))continue;\n            if(profile.kind==='citation'&&v219NativeCitationStateInterface(raw)&&nativeCitationAccepts(p,e.key)&&v219CitationUrlState(e.key,e.value))continue;")
 source=once(source,'const shield=maskProtected(source,()=>{},mergeEditorialRanges([...discussionProtectionRanges(source,cfg),...ranges]));\n        const fixed=shield.text.replace(/(?:\\{\\[([Ss]éc)',
   'const shield=maskProtected(source,()=>{},mergeEditorialRanges([...discussionProtectionRanges(source,cfg),...ranges,...v219QuotedTemplateRanges(source),...v219UnknownTemplateRanges(source,cfg),...v219MarkdownLiteralRanges(source)]));\n        const fixed=shield.text.replace(/(?:\\{\\[([Ss]éc)')
 source=once(source,'v24InventoryBody(cell.content,cfg)','v219TableCellInventoryBody(cell.content,cfg)')
 source=once(source,"if(approved.unresolved.length&&!after.endsWith(plan.text.slice(approved.safePrefixEnd)))return reject('O trecho incompleto preservado foi alterado.');",
   "if(approved.unresolved.length&&!after.endsWith(plan.text.slice(approved.safePrefixEnd))&&!v219NativeCenterTailProof(plan.text,after,plan.cfg))return reject('O trecho incompleto preservado foi alterado.');")
 source=once(source,'return v24InventoryBody(v218ReferenceMarkupPlan(raw,cfg).text,cfg);','return v24InventoryBody(v219ReferenceMarkupPlan(raw,cfg).text,cfg);')
 source=once(source,'        const endpoints = s => new Set((protectedView(s).match(',
   '        const endpoints = s => new Set((protectedView(v219IdentifierPreservationSource(v219CitationProtocolProjection(s,options),options)).match(')
 source=once(source,'        function identifiers(s) {\n            const found = new Set(), view = protectedView(s);',
   '        function identifiers(s) {\n            s=v219IdentifierPreservationSource(v219CitationProtocolProjection(s,options),options);\n            const found = new Set(), view = protectedView(s);')
 source=once(source,'lostWords(plainProse(knownSyntax(before)), plainProse(knownSyntax(after)))',
   'lostWords(plainProse(v219ProseExpectedSource(knownSyntax(before),options)), plainProse(knownSyntax(after)))')
 source=once(source,'[p.name,templateEntries(p).map(f=>[f.key,v24InventoryBody(f.value,cfg)])]',
   '[p.name,templateEntries(p).map(f=>[f.key,v219BiographyInventoryBody(f.value,cfg,f.key,p.name)])]')
 source=once(source,"        stage('v219-source-compatibility',s=>v219SourceCompatibilityEdits(s,cfg));","        stage('v219-citation-empty-parts',s=>v219CitationEmptyPartsPlan(s,cfg).edits);\n        stage('v219-native-protocol',s=>v219CitationProtocolPlan(s,cfg).edits);\n        stage('v219-source-compatibility',s=>v219SourceCompatibilityEdits(s,cfg));")
 source=once(source,"        stage('v219-source-compatibility',s=>v219SourceCompatibilityEdits(s,cfg));","        stage('v219-ignored-citation-header',s=>v219IgnoredCitationHeaderPlan(s,cfg).edits);\n        stage('v219-source-compatibility',s=>v219SourceCompatibilityEdits(s,cfg));")
 # Retention compares the same finite native-field migration on both sides.
 source=once(source,'const canonical=v218CitationMetadataProjection(legacyCanonical,cfg),fields=',
   'const canonical=v218CitationMetadataProjection(v219SourceCompatibilityPlan(v219CitationEmptyPartsPlan(legacyCanonical,cfg).text,cfg).text,cfg),fields=')
 source=once(source,"if(!plan.steps.some(step=>step.name.startsWith('v218-'))||plan.text===before)return null;",
   "if(!plan.steps.some(step=>step.name.startsWith('v218-')||step.name.startsWith('v219-'))||plan.text===before)return null;")
 source=once(source,"step.name.startsWith('v218-'))&&Array.isArray(edit.proof?.changeRules)",
   "step.name.startsWith('v218-')||step.name.startsWith('v219-'))&&Array.isArray(edit.proof?.changeRules)")
 source=once(source,'        v218ResponsiveReferenceLayout:"Estilo fixo redundante de referências retirado",',
   '        v219RepeatedNamedDefinitions:"Definições idênticas de referências reutilizadas",\n        v219ReferenceCollectorHeadings:"Hierarquia das seções de notas e referências corrigida",\n        v219ReferenceSectionTree:"Seções de notas e referências reorganizadas",\n        v219NativeCollectorGroups:"Grupos das listas de referências corrigidos",\n        v219CitationEmptyParts:"Campos posicionais vazios retirados das citações",\n        v219SourceCompatibility:"Campos inválidos e identificadores corrigidos",\n        v218ResponsiveReferenceLayout:"Estilo fixo redundante de referências retirado",')
 source=once(source,"stage('v27-references',s=>v27SafeAutomationEdits(s,cfg,'references'));",
   "stage('v219-repeated-named-definitions',s=>v219RepeatedNamedDefinitionEdits(s,cfg));stage('v27-references',s=>v27SafeAutomationEdits(s,cfg,'references'));")
 start=source.index('    function normalizeNumericReferenceNames(s, cfg, bump, warn) {')
 end=source.index('    function numericReferenceAudit(',start)
 numeric=source[start:end]
 assert numeric.count('return applyEdits(s, edits);')==1
 numeric=numeric.replace('function normalizeNumericReferenceNames(s, cfg, bump, warn)', 'function v219NumericReferenceNameEdits(s, cfg, bump, warn)',1).replace('return s;','return [];').replace('return applyEdits(s, edits);','return edits;')
 source=source[:start]+'    function normalizeNumericReferenceNames(s,cfg,bump,warn) {return applyEdits(s,v219NumericReferenceNameEdits(s,cfg,bump,warn));}\n'+numeric+source[end:]
 source=once(source,"        stage('v210-reference-conflicts',s=>v210ReferenceConflictEdits(s,cfg));", "        stage('v219-native-r-numeric',s=>v219NativeRNumericPlan(s,cfg).edits);\n        stage('v210-reference-conflicts',s=>v210ReferenceConflictEdits(s,cfg));")
 source=patch_ui_context(source)
 source=patch_ui_presentation(source)
 source=patch_v219_reference_combination(source)
 source=patch_v219_native_language_safety(source)
 source=patch_v219_talk_header_aliases(source)
 source=patch_v219_image_thumbnail_typo(source)
 source=patch_v219_gaia_wrapper(source)
 source=patch_v219_invalid_bank_self_calls(source)
 source=patch_v219_tool_only_minor_preference(source)
 source=once(source,'            if(!profile.partial && cfg.automaticEmptyParameters && !e.value.trim()',"            if(!profile.partial && cfg.automaticEmptyParameters && p.name!=='reflist' && !e.value.trim()")
 source=once(source,'        const normalRanges=mergeEditorialRanges([...discussionProtectionRanges(galleryInitial,cfg)',"        const earlyAnonymous=v219EarlyAnonymousPlan(galleryInitial,cfg);\n        if(earlyAnonymous.edits.length&&v219EarlyAnonymousProof(galleryInitial,earlyAnonymous.text,earlyAnonymous,cfg)){\n            galleryInitial=earlyAnonymous.text;for(const family of earlyAnonymous.families)bump('identicalReferences');\n        }\n        const normalRanges=mergeEditorialRanges([...discussionProtectionRanges(galleryInitial,cfg)")
 source=once(source,'    function preservationAudit(before,after,options={}) {',"    function preservationAudit(before,after,options={}) {\n        const earlyAnonymous=v219EarlyAnonymousBaseline(before,after,options);\n        if(earlyAnonymous===null)return [{code:'lost-early-reference-binding',message:'A reutilização de referências alterou uma fonte, chamada ou trecho protegido.',start:-1,severity:'warning'}];\n        if(earlyAnonymous!==before)return preservationAudit(earlyAnonymous,after,options);")
 source=once(source,'    function safeComposition(before,after,options={}) {',"    function safeComposition(before,after,options={}) {\n        const earlyAnonymous=v219EarlyAnonymousBaseline(before,after,options);\n        if(earlyAnonymous===null)return 'A reutilização de referências alterou uma fonte, chamada ou trecho protegido.';\n        if(earlyAnonymous!==before)return safeComposition(earlyAnonymous,after,options);")
 exports=','.join(re.findall(r'^    function (v219\w+)\(',helpers,re.M))+',v219LegacySyntaxProtected,v219LegacyBraceParts,v219LegacyBraceStructure,v219LegacyRendererContext,v219LegacyTemplateTitle,v219LegacyMaskRanges,v219LegacyRReferenceUses,v219NumericReferenceNameEdits,v25ReferenceProofNormalization'
 source=once(source,'        v212ReferenceFieldScope,v212LiteralCitationFields,','        '+exports+',\n        v212ReferenceFieldScope,v212LiteralCitationFields,')
 start=source.index(' * A versão 2.18 amplia a correção')
 end=source.index(' * Licença:',start)
 source=source[:start]+(' * A versão 2.19 confere as regras de ajuste, seus limites de contexto\n'
   ' * e a preservação do conteúdo. Corrige hierarquias redundantes de\n'
   ' * seções de referências e campos literais inválidos de citações,\n'
   ' * com planos vinculados ao texto exato e aos contratos locais.\n')+source[end:]
 return source

def patch_v219_reference_combination(source):
 source=once(source,"        stage('v272-numeric-cell-quotes',s=>v272TableCellEdits(s,cfg));","        if(cfg.tableSyntaxRepairs!==false)stage('v272-numeric-cell-quotes',s=>v272TableCellEdits(s,cfg));")
 source=once(source,'    function refPunctuation(s, bump, warn, cfg={}) {\n        const defaultNotePlan=v219NativeOuterDefaultCollectorPlan(s,cfg);\n        if(defaultNotePlan.edits.length&&v219NativeOuterDefaultCollectorProof(s,defaultNotePlan.text,defaultNotePlan,cfg)){s=defaultNotePlan.text;bump(\'endMatter\');}\n        // Uma predefinição que emite a própria ref não pode ficar dentro de outra ref.\n        const edits = [];\n        for (const r of refTokens(s)) {\n            const attrs = attrsOf(r.attrs);\n            if (r.body === null || !attrs || Object.keys(attrs).length) continue;\n            const nodes = topNodes(r.body.trim());\n            if (nodes.length !== 1 || nodes[0].start !== 0 || nodes[0].end !== r.body.trim().length) continue;\n            const p = parsedTemplate(r.body.trim());\n            if ([\'sfn\', \'sfnm\', \'harvnp\', \'harvref\', \'nre\', \'refn\'].includes(norm(v215TemplateTitle(p.parts[0])))) {\n                if(!v219GeneratedOuterReferenceAllowed(s,r,null,cfg))continue;\n                edits.push({start: r.start, end: r.end, text: r.body.trim()}); bump(\'referenceLists\');\n            }\n        }\n        s = applyEdits(s, edits);\n        const refs = refTokens(s), context = templates(s).nodes.concat(structuralRanges(s).filter(r => s.slice(r.start,r.start+2) === "{|")), moves = [], renderers = rendererRanges(s);\n        for (let i = 0; i < refs.length; i++) {\n            const first = refs[i];\n            if (inRange(first.start, context) || inRange(first.start, renderers)) continue;\n            let end = first.end;\n            while (i + 1 < refs.length && /^\\s*$/.test(s.slice(end, refs[i + 1].start)) && !/[\\r\\n]/.test(s.slice(end, refs[i + 1].start))) end = refs[++i].end;\n            const tail = s.slice(end).match(/^[ \\t]*([.,;:!?])/);\n            if(tail&&/[.,:]/.test(tail[1])&&/[\\p{N}]$/u.test(s.slice(0,first.start))&&/^[\\p{N}]/u.test(s.slice(end+tail[0].length)))continue;\n            if (tail && /[\\p{L}\\p{N}\\])\'"”»]$/u.test(s.slice(0, first.start))) {\n                moves.push({start: first.start, end: end + tail[0].length, text: tail[1] + s.slice(first.start, end) + (/^[\\p{L}\\p{N}]/u.test(s.slice(end+tail[0].length))?\' \':\'\')}); bump(\'referencePunctuation\');\n            } else if (/^[\\p{L}\\p{N}]/u.test(s.slice(end)) && !(/[\\p{N}][.,:]$/u.test(s.slice(0,first.start)) && /^[\\p{N}]/u.test(s.slice(end)))) {\n                moves.push({start: end, end, text: \' \'}); bump(\'referencePunctuation\');\n            }\n        }\n        return applyEdits(s, moves);\n    }','    function refPunctuation(s, bump, warn, cfg={}) {\n        const defaultNotePlan=v219NativeOuterDefaultCollectorPlan(s,cfg);\n        if(defaultNotePlan.edits.length&&v219NativeOuterDefaultCollectorProof(s,defaultNotePlan.text,defaultNotePlan,cfg)){s=defaultNotePlan.text;bump(\'endMatter\');}\n        // Uma predefinição que emite a própria ref não pode ficar dentro de outra ref.\n        const edits = [];\n        for (const r of refTokens(s)) {\n            const attrs = attrsOf(r.attrs);\n            if (r.body === null || !attrs || Object.keys(attrs).length) continue;\n            const nodes = topNodes(r.body.trim());\n            if (nodes.length !== 1 || nodes[0].start !== 0 || nodes[0].end !== r.body.trim().length) continue;\n            const p = parsedTemplate(r.body.trim());\n            if ([\'sfn\', \'sfnm\', \'harvnp\', \'harvref\', \'nre\', \'refn\'].includes(norm(v215TemplateTitle(p.parts[0])))) {\n                if(!v219GeneratedOuterReferenceAllowed(s,r,null,cfg))continue;\n                edits.push({start: r.start, end: r.end, text: r.body.trim()}); bump(\'referenceLists\');\n            }\n        }\n        s = applyEdits(s, edits);\n        const refs = refTokens(s), context = templates(s).nodes.concat(structuralRanges(s).filter(r => s.slice(r.start,r.start+2) === "{|")), moves = [], renderers = rendererRanges(s);\n        let punctuationAfter=null;\n        for (let i = 0; i < refs.length; i++) {\n            const first = refs[i], clusterStart=i;\n            if (inRange(first.start, context) || inRange(first.start, renderers)) continue;\n            let end = first.end;\n            while (i + 1 < refs.length && /^\\s*$/.test(s.slice(end, refs[i + 1].start)) && !/[\\r\\n]/.test(s.slice(end, refs[i + 1].start))) end = refs[++i].end;\n            const tail = s.slice(end).match(/^[ \\t]*([.,;:!?])/);\n            const ordinary=refs.slice(clusterStart,i+1).every(ref=>ref.body!==null&&/[^\\t\\r\\n ]/.test(ref.body)&&/^<ref[ \\t]*>$/i.test(s.slice(ref.start,ref.openEnd)));\n            if(punctuationAfter===null){\n                const prefix=s.slice(0,first.start);\n                punctuationAfter=ordinary&&refs.slice(clusterStart,i+1).every(ref=>/[\\p{L}\\p{N}]/u.test(ref.body)&&!/[{}\\[\\]<>&_\\u0000-\\u001F\\u007F-\\u009F\\uE000-\\uF8FF]/.test(ref.body))&&\n                    /[.,;:!?]$/.test(prefix)&&!tail&&!/[{\\[<\\uE000-\\uF8FF]/.test(prefix)&&\n                    !(/[\\p{N}][.,:]$/u.test(prefix)&&/^[\\p{N}]/u.test(s.slice(end)));\n            }\n            if(tail&&/[.,:]/.test(tail[1])&&/[\\p{N}]$/u.test(s.slice(0,first.start))&&/^[\\p{N}]/u.test(s.slice(end+tail[0].length)))continue;\n            if (punctuationAfter && ordinary && !s.slice(0,first.start).includes(\'[\') && tail && /[\\p{L}\\p{N}\\])\'"”»]$/u.test(s.slice(0, first.start))) {\n                moves.push({start: first.start, end: end + tail[0].length, text: tail[1] + s.slice(first.start, end) + (/^[\\p{L}\\p{N}]/u.test(s.slice(end+tail[0].length))?\' \':\'\')}); bump(\'referencePunctuation\');\n            } else if (/^[\\p{L}\\p{N}]/u.test(s.slice(end)) && !(/[\\p{N}][.,:]$/u.test(s.slice(0,first.start)) && /^[\\p{N}]/u.test(s.slice(end)))) {\n                moves.push({start: end, end, text: \' \'}); bump(\'referencePunctuation\');\n            }\n        }\n        return applyEdits(s, moves);\n    }')
 source=once(source,'            } else if (/^[\\p{L}\\p{N}]/u.test(s.slice(end)) && !(/[\\p{N}][.,:]$/u.test(s.slice(0,first.start)) && /^[\\p{N}]/u.test(s.slice(end)))) {',"            } else if (ordinary && tail?.[0]==='.' &&\n                /^\\p{L}[\\p{L}\\p{M} \\r\\n]*$/u.test(s.slice(0,first.start)) && !/[\\r\\n] /.test(s.slice(0,first.start)) &&\n                /^\\p{Lu}[\\p{L}\\p{M}]*(?=[ \\t\\r\\n]|$)/u.test(s.slice(end+1)) &&\n                refs.slice(clusterStart,i+1).every(ref=>/[\\p{L}\\p{N}]/u.test(ref.body)&&!/[{}\\[\\]<>&_\\u0000-\\u001F\\u007F-\\u009F\\uE000-\\uF8FF]/.test(ref.body))) {\n                moves.push({start:end+1,end:end+1,text:' '}); bump('referencePunctuation');\n            } else if (/^[\\p{L}\\p{N}]/u.test(s.slice(end)) && !(/[\\p{N}][.,:]$/u.test(s.slice(0,first.start)) && /^[\\p{N}]/u.test(s.slice(end)))) {")
 source=once(source,'    function refPunctuation(s, bump, warn, cfg={}) {\n',"    function refPunctuation(s, bump, warn, cfg={}) {\n        if(cfg?.contentModel&&cfg.contentModel!=='wikitext')return s;\n")
 source=once(source,'    function endMatterPass(s, bump, warn, cfg = {}) {','    function endMatterPass(s, bump, warn, cfg = {}, restoreSource = null) {')
 source=once(source,'ordinaryRefs && !ordinaryList && v219GeneratedDefaultCollectorAllowed(s,cfg)',"ordinaryRefs && !ordinaryList && !v219RefSectionDefaultAppendRefusal(typeof restoreSource==='function'?restoreSource(s):s,cfg) && v219GeneratedDefaultCollectorAllowed(s,cfg)")
 source=once(source,'if (cfg.endMatter) s = endMatterPass(s, bump, warn, cfg);','if (cfg.endMatter) s = endMatterPass(s, bump, warn, cfg, shield.restore);')
 source=once(source,'function scanRendererRanges(s) {','function v219BankBaseScanRendererRanges(s) {')
 source=once(source,'        const structured=automaticStructureCleanup(residues,cfg,bump,warn);',"        let structureSource=residues;\n        if(structuralScope(cfg)&&cfg.references!==false&&cfg.referenceColumns!==false){\n            const columns=v218ReferenceColumnPlans(residues,cfg,true),edits=columns.map(row=>({start:row.start,end:row.end,text:row.after,ruleId:'legacyReferenceColumns',proof:row.proof}));\n            if(edits.length&&!v219ReferenceIdentityQuarantine(residues,cfg).opaque&&!structuralArticlePlan(residues,cfg).referencePlan&&\n                JSON.stringify(v219StageSafeEdits(residues,edits,'v218-reference-layout',cfg))===JSON.stringify(edits)){\n                const candidate=v24SyntaxApply(residues,edits);\n                if(structuralArticlePlan(candidate,cfg).referencePlan){structureSource=candidate;for(const edit of edits)bump('legacyReferenceColumns');}\n            }\n        }\n        const structured=automaticStructureCleanup(structureSource,cfg,bump,warn);")
 source=once(source,'    function migrateForeignTemplate(raw,cfg,choiceTarget) {','    function migrateForeignTemplate(raw,cfg,choiceTarget) {\n        const sourceCollector=v219BankSourceCall(raw,cfg);if(sourceCollector)return sourceCollector;')
 source=once(source,'            const nativeReflist=v219NativeReflistCall(raw);',"            const sourceCollector=v219BankSourceCall(raw,{...DEFAULTS,multilingual:false,references:true});\n            if(sourceCollector){if(!aliasQuoteRanges)aliasQuoteRanges=[...structuralQuoteRanges(protectedView(s)),...v27SafeMarkdownRanges(s)];if(!inRange(n.start,aliasQuoteRanges)&&sourceCollector.converted){edits.push({start:n.start,end:n.end,text:sourceCollector.text});bump('referenceLists');}continue;}\n            const nativeReflist=v219NativeReflistCall(raw);")
 source=once(source,'        const normalRanges=mergeEditorialRanges([...discussionProtectionRanges(galleryInitial,cfg)','        const sourceBanks=v219BankSourcePlan(galleryInitial,cfg);\n        if(sourceBanks.edits.length&&v219BankSourceProof(galleryInitial,sourceBanks.text,sourceBanks,cfg)){galleryInitial=sourceBanks.text;for(const edit of sourceBanks.edits)bump(edit.ruleId);}\n        const normalRanges=mergeEditorialRanges([...discussionProtectionRanges(galleryInitial,cfg)')
 source=once(source,'        return findings;\n    }\n    function safeComposition(before,after,options={}) {',"        const sourceBank=v219BankRetention(before,after,options);if(!sourceBank.accepted)findings.push({code:'lost-source-reference-collector',message:sourceBank.reason,start:-1,severity:'warning'});\n        return findings;\n    }\n    function safeComposition(before,after,options={}) {\n        const sourceBank=v219BankRetention(before,after,options);if(!sourceBank.accepted)return sourceBank.reason;")
 source=once(source,'        const imageAdjusted=v211AutomaticLeadImage(source,cfg,bump);','        let cosmeticSource=source;\n        const helperCosmetics=v219NativeHelperCosmeticPlan(source,cfg);\n        if(helperCosmetics.edits.length&&v219NativeHelperCosmeticProof(source,helperCosmetics.text,helperCosmetics,cfg)){\n            if(cfg.noteRendererProofSource===source)cfg.noteRendererProofSource=helperCosmetics.text;\n            cosmeticSource=helperCosmetics.text;for(const edit of helperCosmetics.edits)for(const id of edit.proof.ruleIds)bump(id);\n            cosmeticSource=automaticMissingNoteCollector(cosmeticSource,cfg,bump);\n        }\n        const imageAdjusted=v211AutomaticLeadImage(cosmeticSource,cfg,bump);')
 source=once(source,"        if(v219NativeLiteralNoteHazard(source)||rawNodes.some(n=>['refn','nre','efn','#tag:ref'].includes(parsedTemplate(source.slice(n.start,n.end)).name)))return [];","        const independentNotes=v219NativeAnonymousNoteOwners(source,cfg),independentNote=node=>independentNotes.owners.some(owner=>owner.start===node.start&&owner.end===node.end);\n        if(v219NativeLiteralNoteHazard(source)&&!independentNotes.safe||rawNodes.some(n=>['refn','nre','efn','#tag:ref'].includes(parsedTemplate(source.slice(n.start,n.end)).name)&&!independentNote(n)))return [];")
 source=once(source,"        if(v219NativeLiteralNoteHazard(source)||nodes.nodes.some(node=>['refn','nre','efn','r','#tag:ref'].includes(parsedTemplate(source.slice(node.start,node.end)).name)))return null;","        const independentNotes=v219NativeAnonymousNoteOwners(source,cfg),independentNote=node=>independentNotes.owners.some(owner=>owner.start===node.start&&owner.end===node.end);\n        if(v219NativeLiteralNoteHazard(source)&&!independentNotes.safe||nodes.nodes.some(node=>['refn','nre','efn','r','#tag:ref'].includes(parsedTemplate(source.slice(node.start,node.end)).name)&&!independentNote(node)))return null;")
 source=once(source,'    function migrateForeignTemplate(raw,cfg,choiceTarget) {','    function migrateForeignTemplate(raw,cfg,choiceTarget) {\n        const localOther=v219OtherNativeCall(raw,cfg);if(localOther)return localOther;')
 source=once(source,'function translationProfile(raw) {return','function translationProfile(raw) {if(v219OtherNativeHeader(raw))return null;return')
 source=once(source,'    function v215LiteralTemplateIdentity(raw,profile=null) {','    function v215LiteralTemplateIdentity(raw,profile=null) {\n        const localOther=v219OtherNativeHeader(raw);if(localOther)return !localOther.wrapper;')
 source=once(source,'            if (info && !translationProfile(raw) && !CITE_NAMES[p.name])','            if(v219OtherNativeHeader(raw))continue;\n            if (info && !translationProfile(raw) && !CITE_NAMES[p.name])')
 source=once(source,'            if(v281QuietCitationRefusal(raw,profile))continue;','            if(v219OtherNativeHeader(raw)||v281QuietCitationRefusal(raw,profile))continue;')
 source=once(source,"return ['controle de autoridade', 'controlo de autoridade', 'authority control', 'taxonbar', 'medbar'].includes(p.name) || profile?.kind === 'authority';","return ['controle de autoridade', 'controlo de autoridade', 'authority control', 'taxonbar', 'medbar'].includes(p.name) || v219OtherNativeHeader(source.slice(n.start,n.end))?.record.kind==='authority' || profile?.kind === 'authority';")
 source=once(source,"        if (['controle de autoridade', 'controlo de autoridade', 'authority control', 'taxonbar', 'medbar'].includes(name)) return 'authority';","        if (['controle de autoridade', 'controlo de autoridade', 'authority control', 'taxonbar', 'medbar'].includes(name)||v219OtherNativeHeader(raw)?.record.kind==='authority') return 'authority';")
 source=once(source,'    function v215LiteralTemplateIdentity(raw,profile=null) {',"    function v215LiteralTemplateIdentity(raw,profile=null) {\n        if(typeof raw==='string'&&raw.startsWith('{{')&&raw.endsWith('}}')&&!v219OriginalTemplateHeaderAllowed(((header)=>header!==null&&(raw[header.length+2]==='|'||raw.length===header.length+4)?header:splitParts(raw.slice(2,-2))[0])(v219ReaderLiteralHeader(raw))))return false;")
 source=once(source,'        const parts=splitParts(raw.slice(2,-2)),literal=parts[0].trim();',"        const literal=((header)=>header!==null&&(raw[header.length+2]==='|'||raw.length===header.length+4)?header:splitParts(raw.slice(2,-2))[0])(v219ReaderLiteralHeader(raw)).trim();")
 source=once(source,'    function unifiedNotesReferences(s,cfg,bump,warn) {','    function unifiedNotesReferences(s,cfg,bump,warn) {\n        if(!v219UnifiedNotesSourceAllowed(s,cfg))return s;')
 source=once(source,'    function migrateForeignTemplate(raw,cfg,choiceTarget) {','    function migrateForeignTemplate(raw,cfg,choiceTarget) {\n        const controlledHeader=v219CitationHeaderControlRefusal(raw);if(controlledHeader)return controlledHeader;\n        const nativeWrapper=v219LocalCitationWrapperRefusal(raw);if(nativeWrapper)return nativeWrapper;')
 source=once(source,'        const local=v219LocalCitationRedirectCall(raw,cfg,profile);if(local)return local;','        const local=v219LocalCitationRedirectCall(raw,cfg,profile);if(local)return local;\n        const unprovedKey=v219CitationUnprovedKeyRefusal(raw,profile);if(unprovedKey)return unprovedKey;')
 source=once(source,'        const state=v219ForeignCitationStateRefusal(raw,profile);if(state)return state;','        const crossRole=v219ForeignCitationCrossRoleRefusal(raw,profile);if(crossRole)return crossRole;\n        const state=v219ForeignCitationStateRefusal(raw,profile);if(state)return state;\n        const numbered=v219ForeignCitationNumberedRefusal(raw,profile);if(numbered)return numbered;')
 source=once(source,'if(match && profile.numbered[match[1]])mapped=profile.numbered[match[1]]+match[2];',"if(match && profile.numbered[match[1]]){const pattern=profile.numbered[match[1]];mapped=pattern.includes('#')?v219CitationNumberedTarget(profile,match[1],match[2],pattern):pattern+match[2];}")
 source=once(source,'    function v218CitationNativeContext(raw) {','    function v218CitationNativeContext(raw) {\n        if(v219CitationHeaderControlRefusal(raw))return null;')
 source=once(source,'    function v281CitationObligation(raw,cfg) {',"    function v281CitationObligation(raw,cfg) {\n        if(v219CitationHeaderControlRefusal(raw))return JSON.stringify(['opaque-citation-header',raw]);\n        const wrapper=v219LocalCitationWrapperProfile(raw);if(wrapper)return JSON.stringify(['native-local-wrapper',wrapper.source.oldid,raw]);")
 source=once(source,'    function* calculationSteps(job) {\n        const cfg = job.options || {};',"    function* calculationSteps(job) {\n        const cfg = job.options || {},v219SafetySource=job.safetySource??job.previousSource??job.source,\n            v219SafetyOptionsSnapshot=job.localSafetyOptionsSnapshot??JSON.stringify(cfg),\n            v219SafetyContext=job.localSafetyContext??null;\n        if(v219SafetyOptionsSnapshot!==JSON.stringify(cfg))throw new Error('As opções da análise mudaram. Nenhum ajuste foi aplicado.');\n        const v219SafetyOptions=JSON.parse(v219SafetyOptionsSnapshot);let v219InputSafety=null;")
 source=once(source,"        if (job.safetySource !== undefined) {\n            const problem = safeComposition(job.safetySource, job.source, cfg);\n            if (problem) throw new Error(problem + ' A escolha não foi aplicada.');\n        }","        if (job.safetySource !== undefined) {\n            v219InputSafety=v219CompositionSafetyVerdict(v219SafetySource,job.source,v219SafetyOptions,v219SafetyOptionsSnapshot,v219SafetyContext);\n            if(!v219InputSafety.accepted)throw new Error('A conferência local não confirmou a preservação da escolha. Nenhum ajuste foi aplicado.');\n        }")
 source=once(source,'            else result.preservation = [];\n            if (job.originalSource !== undefined && job.previousSource !== undefined) {','            else result.preservation = [];\n            result.localCompositionSafety=v219InputSafety&&result.text===job.source?v219InputSafety:\n                v219CompositionSafetyVerdict(v219SafetySource,result.text,v219SafetyOptions,v219SafetyOptionsSnapshot,v219SafetyContext);\n            if (job.originalSource !== undefined && job.previousSource !== undefined) {')
 source=once(source,"        result.preservation = preservationAudit(verifiedDOIExpectedSource(expectedSpelling,cfg),result.text,cfg);\n        yield 'Preparando os avisos...';","        result.preservation = preservationAudit(verifiedDOIExpectedSource(expectedSpelling,cfg),result.text,cfg);\n        yield 'Conferindo a composição dos ajustes...';\n        result.localCompositionSafety=v219InputSafety&&result.text===job.source?v219InputSafety:\n            v219CompositionSafetyVerdict(v219SafetySource,result.text,v219SafetyOptions,v219SafetyOptionsSnapshot,v219SafetyContext);\n        yield 'Preparando os avisos...';")
 source=once(source,'        job = {...job, options: serializableOptions(birthCategoryRuntimeOptions(confirmedMinorOptions(task,job)))};\n        try {','        job = {...job, options: serializableOptions(birthCategoryRuntimeOptions(confirmedMinorOptions(task,job)))};\n        job={...job,localSafetyOptionsSnapshot:JSON.stringify(job.options),localSafetyContext:v219SafetyTaskContext(task)};\n        try {')
 source=once(source,"            task.guard(); api.processing.engine = 'worker'; api.processing.milliseconds = root.performance.now() - started;\n            return result;","            task.guard(); api.processing.engine = 'worker'; api.processing.milliseconds = root.performance.now() - started;\n            return v219BindLocalResultSafety(job,result);")
 source=once(source,"            task.guard(); api.processing.engine = 'staged'; api.processing.milliseconds = root.performance.now() - started;\n            return next.value;","            task.guard(); api.processing.engine = 'staged'; api.processing.milliseconds = root.performance.now() - started;\n            return v219BindLocalResultSafety(job,next.value);")
 source=once(source,"        const loss = (result.preservation||[]).filter(f=>/^lost-(?:url|image|identifier|protected|prose|repaired-reference)$/.test(f.code));\n        if(result.text!==task.source && loss.length) {\n            const fresh = await computeLocal(task,{kind:'refresh',source:task.source,\n                originalSource:appliedBaseline(editor(),task.source),options});\n            task.guard();\n            fresh.previewCheck={status:'local-rollback',checked:false,reason:'A verificação local encontrou possível retirada de conteúdo.'};\n            fresh.warnings.push('Os ajustes desta execução foram recusados pela verificação de preservação: '+loss.map(f=>f.message).join(' '));\n            return fresh;\n        }\n",'        const localSafety=v219AutomaticResultSafety(task.source,result,v219SafetyTaskContext(task));\n        if(!localSafety.accepted)return v219AutomaticResultRollback(task,result,options,localSafety);\n')
 source=once(source,"            const fresh = await computeLocal(task,{kind:'refresh',source:candidate,\n                originalSource:appliedBaseline(editor(),task.source),options});","            const fresh = await computeLocal(task,{kind:'refresh',source:candidate,safetySource:task.source,\n                originalSource:appliedBaseline(editor(),task.source),options});")
 source=once(source,'            result = await verifyAutomaticResult(task,result,prepared);\n            task.guard(); result.proposed = false;','            result = await verifyAutomaticResult(task,result,prepared);\n            const applySafety=v219AutomaticResultSafety(before,result,v219SafetyTaskContext(task));\n            if(!applySafety.accepted)result=await v219AutomaticResultRollback(task,result,prepared,applySafety);\n            task.guard(); result.proposed = false;')
 source=once(source,"                        task.guard();\n                        if (proposal.kind === 'spelling') { next.editorId = adapter.id;","                        task.guard();\n                        const choiceSafety=v219AutomaticResultSafety(before,next,v219SafetyTaskContext(task));\n                        if(next.text!==after||!choiceSafety.accepted)throw new Error('A conferência local não confirmou a preservação da escolha. O texto anterior foi mantido.');\n                        if (proposal.kind === 'spelling') { next.editorId = adapter.id;")
 source=once(source,"                    task.guard();adapter.write(next.text);if(adapter.read()!==next.text)throw new Error('O editor não confirmou a atualização.');","                    task.guard();\n                    const linkSafety=v219AutomaticResultSafety(session.source,result,v219SafetyTaskContext(task));\n                    if(result.text!==next.text||!linkSafety.accepted)throw new Error('A conferência local não confirmou a preservação da escolha. O texto anterior foi mantido.');\n                    adapter.write(next.text);if(adapter.read()!==next.text)throw new Error('O editor não confirmou a atualização.');")
 source=once(source,'    function migrateForeignTemplate(raw,cfg,choiceTarget) {','    function migrateForeignTemplate(raw,cfg,choiceTarget) {\n        const infoboxRefusal=v219ForeignInfoboxRefusal(raw);if(infoboxRefusal)return infoboxRefusal;')
 source=once(source,'function translationProfile(raw) {if(v219OtherNativeHeader(raw))return null;','function translationProfile(raw) {if(v219OtherNativeHeader(raw)||v219ForeignInfoboxRefusal(raw))return null;')
 source=once(source,'    function v215LiteralTemplateIdentity(raw,profile=null) {','    function v215LiteralTemplateIdentity(raw,profile=null) {\n        if(v219ForeignInfoboxRefusal(raw,profile))return false;')
 source=once(source,'            if(v219OtherNativeHeader(raw))continue;','            if(v219OtherNativeHeader(raw)||v219ForeignInfoboxRefusal(raw))continue;')
 source=once(source,'            if(v219OtherNativeHeader(raw)||v281QuietCitationRefusal(raw,profile))continue;','            if(v219OtherNativeHeader(raw)||v219ForeignInfoboxRefusal(raw)||v281QuietCitationRefusal(raw,profile))continue;')
 source=once(source,'    function automaticParameters(raw,cfg,bump) {','    function automaticParameters(raw,cfg,bump) {\n        if(cfg.automaticParameterNames&&v219NativeHarvardKeyActivationRefusal(raw))return raw;')
 source=once(source,'        const entries=foreignEntries(p), families=new Map();let changed=false;','        const entries=foreignEntries(p), families=new Map();let changed=false;\n        if(!v219OfficialUrlParameterSafe(raw,profile,entries))return raw;')
 source=once(source,'    function v215LiteralTemplateIdentity(raw,profile=null) {','    function v215LiteralTemplateIdentity(raw,profile=null) {\n        if(v219OfficialUrlCallRefusal(raw))return false;')
 source=once(source,"        const sourceBank=v219BankRetention(before,after,options);if(!sourceBank.accepted)findings.push({code:'lost-source-reference-collector',message:sourceBank.reason,start:-1,severity:'warning'});\n        return findings;","        const sourceBank=v219BankRetention(before,after,options);if(!sourceBank.accepted)findings.push({code:'lost-source-reference-collector',message:sourceBank.reason,start:-1,severity:'warning'});\n        const coauthors=v219CitationCoauthorMetadataRetention(before,after,options);if(!coauthors.accepted)findings.push({code:'lost-native-coauthor-metadata',message:coauthors.reason,start:-1,severity:'warning'});\n        return findings;")
 source=once(source,'    function safeComposition(before,after,options={}) {\n','    function safeComposition(before,after,options={}) {\n        const coauthors=v219CitationCoauthorMetadataRetention(before,after,options);if(!coauthors.accepted)return coauthors.reason;\n')
 source=once(source,'parts[i] = m[1] + key + m[3] + value;','parts[i] = m[1] + (key===originalKey?m[2]:key) + m[3] + value;')
 source=once(source,'        return entriesTemplate(p, entries);\n    }\n    function validISBN(value)','        return v219CitationCoauthorEntriesTemplate(p, entries);\n    }\n    function validISBN(value)')
 source=once(source,'            let mapped=fields[key];',"            if(key==='titre'&&v219NativeTitreContext(raw))continue;\n            let mapped=fields[key];")
 source=once(source,'                if (p.value.trim() === prev.value.trim()) { if(cfg.automaticParameterDuplicates!==false)',"                if(norm(p.key)==='titre'||norm(prev.key)==='titre')continue;\n                if (p.value.trim() === prev.value.trim()) { if(cfg.automaticParameterDuplicates!==false)")
 source=once(source,'        for(const family of families.values())if(family.length>1 && family.every(e=>e.value===family[0].value)){',"        for(const family of families.values())if(norm(family[0].key)!=='titre'&&family.length>1 && family.every(e=>e.value===family[0].value)){")
 source=once(source,'        for(const e of entries.filter(e=>!e.remove)) {\n            const family=e.positional?e.key:parameterFamily(e.key);',"        for(const e of entries.filter(e=>!e.remove)) {\n            if(norm(e.key)==='titre'&&v219NativeTitreContext(raw))continue;\n            const family=e.positional?e.key:parameterFamily(e.key);")
 source=once(source,'        const dateWrapper=v219DateWrapperMigrationRefusal(raw,profile);if(dateWrapper)return dateWrapper;','        const correctedURL=v219CorrectedCitationURLRefusal(raw,profile);if(correctedURL)return correctedURL;\n        const dateWrapper=v219DateWrapperMigrationRefusal(raw,profile);if(dateWrapper)return dateWrapper;')
 source=once(source,'        const correctedURL=v219CorrectedCitationURLRefusal(raw,profile);if(correctedURL)return correctedURL;','        const titreAmbiguity=v219NativeTitreAmbiguityCall(raw,profile);if(titreAmbiguity)return titreAmbiguity;\n        const correctedURL=v219CorrectedCitationURLRefusal(raw,profile);if(correctedURL)return correctedURL;')
 source=once(source,'    function automaticParameters(raw,cfg,bump) {','    function automaticParameters(raw,cfg,bump) {\n        if(v219NativeTitreAmbiguity(raw))return raw;')
 source=once(source,'!inRange(r.start, templates(s).nodes) && !inRange(r.start, refTokens(s))) {','!inRange(r.start, templates(s).nodes) && !inRange(r.start, refTokens(s)) && v219BareHtmlCollectorAllowed(s,r)) {')
 source=once(source,"analysis.repairs.filter(r=>v219TableAutomaticRepairAllowed(r,source,analysis)&&(r.rule!=='tableHeaderScopes'||cfg.tableAccessibility!==false))","analysis.repairs.filter(r=>v219TableAutomaticRepairAllowed(r,source,analysis)&&(r.rule!=='tableSyntaxRepairs'||cfg.tableSyntaxRepairs!==false)&&(r.rule!=='tableHeaderScopes'||cfg.tableAccessibility!==false))")
 source=once(source,'const before=source.slice(node.start,node.end),collector=v212CollectorGroupCall(before,cfg),citation=v212CitationAliasCall(before,cfg),result=collector.text!==before?collector:citation;','const before=source.slice(node.start,node.end),candidateCollector=v212CollectorGroupCall(before,cfg),collector=v219BankCollectorGroupIntent(source,node,candidateCollector,cfg)?candidateCollector:{text:before,changes:[]},citation=v212CitationAliasCall(before,cfg),result=collector.text!==before?collector:citation;')
 source=once(source,'        if(sourceBanks.edits.length&&v219BankSourceProof(galleryInitial,sourceBanks.text,sourceBanks,cfg)){galleryInitial=sourceBanks.text;for(const edit of sourceBanks.edits)bump(edit.ruleId);}\n','        if(sourceBanks.edits.length&&v219BankSourceProof(galleryInitial,sourceBanks.text,sourceBanks,cfg)){galleryInitial=sourceBanks.text;for(const edit of sourceBanks.edits)bump(edit.ruleId);}\n        const nativeGroups=v219BankNativeGroupPlan(galleryInitial,cfg);\n        if(nativeGroups.edits.length&&v219BankNativeGroupProof(galleryInitial,nativeGroups.text,nativeGroups,cfg)){\n            galleryInitial=nativeGroups.text;\n            for(const edit of nativeGroups.edits)for(const rule of edit.proof?.changeRules||[edit.ruleId])bump(rule);\n        }\n')
 source=once(source,"if(!v219GeneratedMinorAllowed(before,after,options)){result.reason='Há alterações fora dos ajustes mecânicos confirmados.';return result;}","if(!v219GeneratedMinorAllowed(before,after,options)||!v219BankGroupMinorAllowed(before,after,options)){result.reason='Há alterações fora dos ajustes mecânicos confirmados.';return result;}")
 source=once(source,'        const segment = body.slice(blocks[0].start);\n','        const segment = body.slice(blocks[0].start);\n        if(!v219BankEndSectionSegmentAllowed(segment,cfg,source))return source;\n')
 source=once(source,"        if(!changedDates)return {accepted:true,reason:''};\n        if(!a.tuple||!b.tuple)return reject();","        if(!changedDates)return {accepted:true,reason:''};\n        const sourceFacts=v219BiographySourceFactProof(plan,expected,actual);if(!sourceFacts.accepted)return sourceFacts;\n        if(!a.tuple||!b.tuple)return reject();")
 return source

def patch_v219_talk_header_aliases(source):
 source=once(source,"        const pd=headers.filter(h=>['pd','cabeçalho de discussão'].includes(h.name));",'        const pdHeader=header=>v219OriginalTemplateHeaderAllowed(header)&&\n            ["Cabeçalho de discussão","PD","Pd","Página de discussão","PW-Alvo","BPV","Bpv","Coisas a não fazer","Discussão de portal","Página de discussão/Arquivo 1","Portais-aviso"]\n                .some(title=>v215SameTemplateTitle(header,title));\n        const pd=headers.filter(h=>pdHeader(h.p.parts[0]));')
 source=once(source,"        const all=templates(scanProtectedView(source)).nodes.filter(item=>{\n            const name=parsedTemplate(source.slice(item.start,item.end)).name;\n            return ['pd','cabeçalho de discussão','marca de projeto'].includes(name);\n        });","        const all=templates(scanProtectedView(source)).nodes.filter(item=>{\n            const parsed=parsedTemplate(source.slice(item.start,item.end));\n            return pdHeader(parsed.parts[0])||parsed.name==='marca de projeto';\n        });")
 return source

def patch_v219_image_thumbnail_typo(source):
 source=once(source,'        if (cfg.markup) s = markupPass(s, bump);','        if (cfg.markup) { s = markupPass(s, bump); s=v219AutomaticImageThumbnailTypo(s,cfg,bump); }')
 source=once(source,'        const syntactic=automaticSyntaxRepairs(leadHeading,cfg,bump,warn);\n        const recovery=syntaxRepairPrefix(syntactic,cfg);','        let syntactic=automaticSyntaxRepairs(leadHeading,cfg,bump,warn);\n        let recovery=syntaxRepairPrefix(syntactic,cfg);\n        if(!cfg.sectionOnly&&cfg.partialSyntaxRecovery!==false&&recovery.unresolved.length){\n            const thumbnails=v219AutomaticImageThumbnailTypo(syntactic,cfg,bump);\n            if(thumbnails!==syntactic){syntactic=thumbnails;recovery=syntaxRepairPrefix(syntactic,cfg);}\n        }')
 source=once(source,'    const GROUP_LABELS = {','    const GROUP_LABELS = {\n        v219ImageThumbnailTypo:"Opção de miniatura corrigida",')
 source=once(source,'        if(!v219GeneratedMinorAllowed(before,after,options)||!v219BankGroupMinorAllowed(before,after,options))','        if(v219ImageThumbnailTypoPlan(before,options).edits.length||!v219GeneratedMinorAllowed(before,after,options)||!v219BankGroupMinorAllowed(before,after,options))')
 return source

def patch_v219_gaia_wrapper(source):
 source=once(source,'        const imageAdjusted=v211AutomaticLeadImage(cosmeticSource,cfg,bump);','        const gaiaPeer=v219GaiaPeerDefinitionPlan(cosmeticSource,cfg);\n        if(gaiaPeer.edits.length&&v219GaiaPeerDefinitionProof(cosmeticSource,gaiaPeer.text,gaiaPeer,cfg)){\n            cosmeticSource=gaiaPeer.text;for(const edit of gaiaPeer.edits)bump(edit.ruleId);\n        }\n        const imageAdjusted=v211AutomaticLeadImage(cosmeticSource,cfg,bump);')
 source=once(source,'    function preservationAudit(before,after,options={}) {',"    function preservationAudit(before,after,options={}) {\n        if(before!==after){\n            const gaiaPeer=v219GaiaPeerDefinitionPlan(before,options);\n            if(gaiaPeer.edits.length){\n                const baseline=v219GaiaPeerDefinitionBaseline(before,after,gaiaPeer,options);\n                if(baseline===null)return [{code:'lost-gaia-wrapper-arguments',message:'Uma definição Gaia DR3 ou sua família nomeada perdeu bytes ou contexto.',start:-1,severity:'warning'}];\n                if(baseline!==before)return preservationAudit(baseline,after,options);\n            }\n        }")
 source=once(source,'    function safeComposition(before,after,options={}) {',"    function safeComposition(before,after,options={}) {\n        if(before!==after){\n            const gaiaPeer=v219GaiaPeerDefinitionPlan(before,options);\n            if(gaiaPeer.edits.length){\n                const baseline=v219GaiaPeerDefinitionBaseline(before,after,gaiaPeer,options);\n                if(baseline===null)return 'Uma definição Gaia DR3 ou sua família nomeada perdeu bytes ou contexto.';\n                if(baseline!==before)return safeComposition(baseline,after,options);\n            }\n        }")
 source=once(source,"        const coauthors=v219CitationCoauthorMetadataRetention(before,after,options);if(!coauthors.accepted)findings.push({code:'lost-native-coauthor-metadata',message:coauthors.reason,start:-1,severity:'warning'});","        const gaia=v219GaiaWrapperRetention(before,after,options);if(!gaia.accepted)findings.push({code:'lost-gaia-wrapper-arguments',message:gaia.reason,start:-1,severity:'warning'});\n        const coauthors=v219CitationCoauthorMetadataRetention(before,after,options);if(!coauthors.accepted)findings.push({code:'lost-native-coauthor-metadata',message:coauthors.reason,start:-1,severity:'warning'});")
 source=once(source,'        const coauthors=v219CitationCoauthorMetadataRetention(before,after,options);if(!coauthors.accepted)return coauthors.reason;','        const gaia=v219GaiaWrapperRetention(before,after,options);if(!gaia.accepted)return gaia.reason;\n        const coauthors=v219CitationCoauthorMetadataRetention(before,after,options);if(!coauthors.accepted)return coauthors.reason;')
 source=once(source,'        const localOther=v219OtherNativeHeader(raw);if(localOther)return !localOther.wrapper;',
   '        if(v219GaiaWrapperContext(raw))return true;\n        const localOther=v219OtherNativeHeader(raw);if(localOther)return !localOther.wrapper;')
 source=once(source,'    function migrateForeignTemplate(raw,cfg,choiceTarget) {',
   '    function migrateForeignTemplate(raw,cfg,choiceTarget) {\n        const gaia=v219GaiaWrapperCall(raw,cfg,choiceTarget);if(gaia)return gaia;')
 source=once(source,"    function minorEligibility(before,after,options={}) {\n        const metrics=options.metrics||byteMetrics(before,after,options.hunks);\n        const result={eligible:false,metrics,reason:''};\n        if(before===after){result.reason='Nenhuma alteração.';return result;}",
   "    function minorEligibility(before,after,options={}) {\n        const metrics=options.metrics||byteMetrics(before,after,options.hunks);\n        const result={eligible:false,metrics,reason:''};\n        if(before===after){result.reason='Nenhuma alteração.';return result;}\n        if(!v219GaiaWrapperMinorAllowed(before,after,options)){result.reason='A correção altera a exibição de uma referência.';return result;}")
 return source

def patch_v219_invalid_bank_self_calls(source):
 source=once(source,"for(const [name,find]of [['v210-reference-tag-spacing',v210ReferenceSyntaxEdits],['v210-reference-conflicts',v210ReferenceConflictEdits],['v210-reference-banks',v210ReferenceBankEdits],['v210-harvard-anchors',v210HarvardAnchorEdits]])","for(const [name,find]of [['v210-reference-tag-spacing',v210ReferenceSyntaxEdits],['v210-reference-conflicts',v210ReferenceConflictEdits],['v210-reference-banks',v210ReferenceBankEdits],['v219-invalid-bank-self-calls',v219InvalidBankSelfEdits],['v210-harvard-anchors',v210HarvardAnchorEdits]])")
 source=once(source,"function v210ReferenceRepairProjection(source,cfg={}) {return v219ReferenceProjection(source,cfg,[['v210-reference-tag-spacing',v210ReferenceSyntaxEdits],['v210-reference-conflicts',v210ReferenceConflictEdits],['v210-reference-banks',v210ReferenceBankEdits],['v210-harvard-anchors',v210HarvardAnchorEdits]]);}","function v210ReferenceRepairProjection(source,cfg={}) {return v219ReferenceProjection(source,cfg,[['v210-reference-tag-spacing',v210ReferenceSyntaxEdits],['v210-reference-conflicts',v210ReferenceConflictEdits],['v210-reference-banks',v210ReferenceBankEdits],['v219-invalid-bank-self-calls',v219InvalidBankSelfEdits],['v210-harvard-anchors',v210HarvardAnchorEdits]]);}")
 source=once(source,"stage('v210-reference-banks',s=>v210ReferenceBankEdits(s,cfg));","stage('v210-reference-banks',s=>v210ReferenceBankEdits(s,cfg));stage('v219-invalid-bank-self-calls',s=>v219InvalidBankSelfEdits(s,cfg));")
 source=once(source,'    const GROUP_LABELS = {','    const GROUP_LABELS = {\n        v219InvalidBankSelfCalls:"Chamadas vazias inválidas removidas do banco de referências",')
 source=once(source,'        if(v219ImageThumbnailTypoPlan(before,options).edits.length||!v219GeneratedMinorAllowed(before,after,options)||!v219BankGroupMinorAllowed(before,after,options))','        if(v219InvalidBankSelfPlan(before,options).edits.length||v219ImageThumbnailTypoPlan(before,options).edits.length||!v219GeneratedMinorAllowed(before,after,options)||!v219BankGroupMinorAllowed(before,after,options))')
 return source

def patch_v219_native_language_safety(source):
 source=once(source,'    function normalizeRefs(s, cfg, bump, warn) {\n        const renderers = rendererRanges(s), nested = templates(s).nodes;\n        const refs = refTokens(s), families = new Map(), edits = [];','    function normalizeRefs(s, cfg, bump, warn) {\n        const renderers = rendererRanges(s), nested = templates(s).nodes;\n        const refs = refTokens(s), families = new Map(), edits = [], topologyAllowed=v219NamedReferenceTopologyFilter(s,cfg);')
 source=once(source,'            const move = cfg.moveNamedRefs && definition && first.start < definition.start && !crossesList(first, definition);\n            for (const r of family) {','            const move = cfg.moveNamedRefs && definition && first.start < definition.start && !crossesList(first, definition);\n            const topology=move||\n                definitions.some(r=>r!==definition&&!crossesList(definition,r));\n            if(topology&&!topologyAllowed(family))continue;\n            for (const r of family) {')
 source=once(source,'    function simpleReferences(s, bump) {\n        const edits = [];\n        for (const r of refTokens(s)) {\n            if (r.body === null) continue;','    function simpleReferences(s, bump, cfg={}) {\n        const edits = [], allowed=v219BareReferenceProducerFilter(s,cfg);\n        for (const r of refTokens(s)) {\n            if (r.body === null||!allowed(r)) continue;')
 source=once(source,'        const recovery=syntaxRepairPrefix(syntactic,cfg);','        const recovery=syntaxRepairPrefix(syntactic,cfg);\n        if(cfg.partialSyntaxRecovery===false&&recovery.unresolved.length)cfg.bareReferences=false;')
 source=once(source,'        if (cfg.bareReferences) s = simpleReferences(s, bump);','        if (cfg.bareReferences) s = simpleReferences(s, bump, cfg);')
 source=once(source,'if(c.bareReferences)text=simpleReferences(text,noop);','if(c.bareReferences)text=simpleReferences(text,noop,c);')
 source=once(source,'    function nativeCitationAccepts(p,key) {',"    function nativeCitationAccepts(p,key) {\n        if(TEMPLATE_CATALOG[p.name]?.oldid===62525251&&(!Array.isArray(p.parts)||!v219NativeCitationCS1Consumer('{{'+p.parts.join('|')+'}}')))return false;")
 source=once(source,'    function v218CitationNativeContext(raw) {','    function v218CitationNativeContext(raw) {\n        if(!v219NativeCitationCS1Consumer(raw))return null;')
 source=once(source,'    function automaticParameters(raw,cfg,bump) {','    function automaticParameters(raw,cfg,bump) {\n        if(!v219NativeCitationCS1Consumer(raw))return raw;')
 source=once(source,'    function migrateForeignTemplate(raw,cfg,choiceTarget) {',"    function migrateForeignTemplate(raw,cfg,choiceTarget) {\n        if(!v219NativeCitationCS1Consumer(raw))return {profile:translationProfile(raw),candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[],proof:{kind:'native-conditional-citation-consumer',nativeOldid:62525251}};")
 source=once(source,'    function v281CitationRetention(before,after,options={}) {\n        before=v282HistoricalCitationProjection(before,options);after=v282HistoricalCitationProjection(after,options);','    function v281CitationRetention(before,after,options={}) {\n        const nativeScalarBefore=before,nativeScalarAfter=after;\n        before=v282HistoricalCitationProjection(before,options);after=v282HistoricalCitationProjection(after,options);')
 source=once(source,"        for(const key of required)if(!retained.has(key))return {accepted:false,reason:'Uma referência perdeu o tipo de citação ou a data de consulta ligada aos mesmos título e identificadores.'};","        for(const key of required)if(!retained.has(key))return (v219NativeLiteralScalarEquivalent(nativeScalarBefore,nativeScalarAfter,cfg)||v219FrenchQuotedURLSourceEquivalent(nativeScalarBefore,nativeScalarAfter,cfg))?{accepted:true,reason:''}:{accepted:false,reason:'Uma referência perdeu o tipo de citação ou a data de consulta ligada aos mesmos título e identificadores.'};")
 source=once(source,"        const coauthors=v219CitationCoauthorMetadataRetention(before,after,options);if(!coauthors.accepted)findings.push({code:'lost-native-coauthor-metadata',message:coauthors.reason,start:-1,severity:'warning'});","        const language=v219CitationLanguageRetention(before,after,options);if(!language.accepted)findings.push({code:'lost-native-citation-language',message:language.reason,start:-1,severity:'warning'});\n        const coauthors=v219CitationCoauthorMetadataRetention(before,after,options);if(!coauthors.accepted)findings.push({code:'lost-native-coauthor-metadata',message:coauthors.reason,start:-1,severity:'warning'});")
 source=once(source,'    function safeComposition(before,after,options={}) {\n        const coauthors=v219CitationCoauthorMetadataRetention(before,after,options);','    function safeComposition(before,after,options={}) {\n        const language=v219CitationLanguageRetention(before,after,options);if(!language.accepted)return language.reason;\n        const coauthors=v219CitationCoauthorMetadataRetention(before,after,options);')
 source=once(source,'    function v25ReferenceProofNormalization(source,cfg={}) {','    function v25ReferenceProofNormalization(source,cfg={},topology=false) {')
 source=once(source,'text=neutralAutomaticReferenceNames(text,c,noop);text=normalizeRefs(text,c,noop,noop);','text=neutralAutomaticReferenceNames(text,c,noop);\n        if(topology){\n            text=shield.restore(text);\n            // Marker movement needs the independent fresh Source proof.\n            const policy={...c,references:true,moveNamedRefs:true},plan=v219CitationLanguageNamedMovePlan(text,policy);\n            if(v219CitationLanguageNamedMoveProof(text,plan.text,plan,policy))text=plan.text;\n            return v219AnonymousReferenceGenerationAllowed(text,c)?v219CitationLanguageReferenceSource(text,c):text;\n        }\n        text=normalizeRefs(text,c,noop,noop);')
 source=once(source,'    function automaticParameters(raw,cfg,bump) {','    function automaticParameters(raw,cfg,bump) {\n        const cosmetic=v219PinnedNativeParameterCosmeticCall(raw,cfg);\n        if(cosmetic?.commonscat){cosmetic.rules.forEach(id=>bump(id));return cosmetic.text;}')
 source=once(source,'        if (job.safetySource !== undefined) {\n            v219InputSafety=v219CompositionSafetyVerdict(v219SafetySource,job.source,v219SafetyOptions,v219SafetyOptionsSnapshot,v219SafetyContext);',"        let v219History=job.semanticHistory||null,v219Manual=null,v219AuditBefore=job.originalSource??job.source;\n        const v219PageContext=job.localPageContext??null;\n        if(v219History){\n            const baseline=v219ManualHistoryBaseline(v219History,job.originalSource,v219SafetySource,cfg,v219PageContext);\n            if(baseline===null)throw new Error('O histórico das escolhas não corresponde a este rascunho. Nenhum ajuste foi aplicado.');\n            v219AuditBefore=baseline;\n        }\n        if(job.explicitChoice){\n            if(!['refresh','spelling'].includes(job.kind)||job.safetySource===undefined||\n                job.explicitChoice.taskContext!==v219SafetyContext||\n                (job.kind==='spelling')!==(job.explicitChoice.kind==='spelling'))throw new Error('A escolha não pertence a esta análise.');\n            const selected=v219ExplicitChoiceRead(job.explicitChoice,v219SafetySource,job.source,v219PageContext);\n            if(!selected)throw new Error('A sugestão ficou desatualizada. Faça a análise novamente.');\n            v219History={origin:job.originalSource??v219SafetySource,context:v219PageContext,\n                choices:[...(v219History?.choices||[]),selected]};\n            if(v219ManualHistoryBaseline(v219History,v219History.origin,job.source,cfg,v219PageContext)!==job.source)\n                throw new Error('A escolha não preservou o restante do rascunho.');\n            v219AuditBefore=job.source;\n            v219Manual={kind:'source-bound-explicit-choice',before:v219SafetySource,after:job.source,\n                requestSnapshot:JSON.stringify(job.explicitChoice),taskContext:v219SafetyContext,optionsSnapshot:v219SafetyOptionsSnapshot};\n        }\n        if (job.safetySource !== undefined) {\n            v219InputSafety=v219CompositionSafetyVerdict(v219Manual?job.source:v219SafetySource,job.source,v219SafetyOptions,v219SafetyOptionsSnapshot,v219SafetyContext);")
 source=once(source,"            if (job.previousSource !== undefined) result.preservation = preservationAudit(job.previousSource, job.source, cfg).filter(f => f.code !== 'lost-prose');\n            else result.preservation = [];","            if (job.previousSource !== undefined) result.preservation = preservationAudit(v219Manual?job.source:job.previousSource, job.source, cfg).filter(f => f.code !== 'lost-prose');\n            else result.preservation = [];\n            if(v219History)result.semanticHistory=v219History;\n            if(v219Manual)result.explicitChoice=v219Manual;")
 source=once(source,'        const preservationBefore=job.originalSource??job.source;','        const preservationBefore=v219AuditBefore;\n        if(v219History)result.semanticHistory=v219History;\n        if(v219Manual)result.explicitChoice=v219Manual;')
 source=once(source,'        result.minorCheck=minorEligibility(byteBefore,result.text,{...cfg,hunks:byteHunks,metrics:result.byteMetrics});',"        result.minorCheck=minorEligibility(byteBefore,result.text,{...cfg,hunks:byteHunks,metrics:result.byteMetrics});\n        if(v219History)result.minorCheck={...result.minorCheck,eligible:false,reason:'A edição contém uma escolha manual.'};")
 source=once(source,'        job = {...job, options: serializableOptions(birthCategoryRuntimeOptions(confirmedMinorOptions(task,job)))};',"        if(['adjust','refresh','spelling'].includes(job.kind)&&job.originalSource===undefined&&\n            lastEditorContextMatches(editor())&&last.after===task.source&&last.semanticHistory)\n            job={...job,originalSource:last.before};\n        job = {...job, options: serializableOptions(birthCategoryRuntimeOptions(confirmedMinorOptions(task,job)))};")
 source=once(source,'        job={...job,localSafetyOptionsSnapshot:JSON.stringify(job.options),localSafetyContext:v219SafetyTaskContext(task)};\n        try {',"        if(job.explicitChoice&&(task.explicitChoice!==job.explicitChoice||\n            job.explicitChoice.uiBinding!==v219ManualUIBinding(job.explicitChoice.kind)))throw new Error('As opções da sugestão mudaram. Faça a análise novamente.');\n        job={...job,localSafetyOptionsSnapshot:JSON.stringify(job.options),localSafetyContext:v219SafetyTaskContext(task),\n            localPageContext:JSON.stringify(v219UIContext(task.context)),\n            manualUIBinding:v219ManualUIBinding(job.kind==='spelling'?'spelling':'review'),\n            semanticHistory:['adjust','refresh','spelling'].includes(job.kind)&&lastEditorContextMatches(editor())&&\n                last.after===task.source?last.semanticHistory||null:null};\n        if(job.explicitChoice)task.manualApplyOptionsSnapshot=job.localSafetyOptionsSnapshot;\n        if(job.explicitChoice?.kind==='spelling'){\n            const nextUI=JSON.parse(job.manualUIBinding);\n            if(!Object.hasOwn(nextUI,'spellingIgnored')||!Array.isArray(job.options.spellingIgnored))\n                throw new Error('As ocorrências ignoradas não correspondem à escolha.');\n            nextUI.spellingIgnored=job.options.spellingIgnored;job.manualOfferUIBinding=JSON.stringify(nextUI);\n        }\n        try {")
 source=once(source,"                row.append(snippet(choice.after || '(remoção)'), button(choice.label, async () => {","                row.append(snippet(choice.after || '(remoção)'), button(choice.label, async event => {")
 source=once(source,"                        const before = adapter.read(), after = applySuggestion(before, proposal, i);\n                        task = beginLocalAnalysis(adapter, before, 'Preparando a substituição...');\n                        if (!task) return;","                        const kind=proposal.kind==='spelling'?'spelling':'review',offer=result.choiceOffer;\n                        if(event.isTrusted!==true||lastLocalResult!==result||!offer||\n                            offer.context!==JSON.stringify(v219UIContext(localEditorContext(adapter)))||\n                            offer.uiBinding!==v219ManualUIBinding(kind))throw new Error('A sugestão ou as opções mudaram. Faça a análise novamente.');\n                        const before = adapter.read(), after = applySuggestion(before, proposal, i);\n                        task = beginLocalAnalysis(adapter, before, 'Preparando a substituição...');\n                        if (!task) return;\n                        const selected=Object.freeze({kind,before,after,index:i,proposalSnapshot:JSON.stringify(proposal),\n                            optionsSnapshot:offer.optionsSnapshot,context:offer.context,uiBinding:offer.uiBinding,\n                            offerTask:offer.taskContext,taskContext:v219SafetyTaskContext(task)});\n                        task.explicitChoice=selected;")
 source=once(source,"                            {kind: 'spelling', source: after, previousSource: before, originalSource: appliedBaseline(adapter, before), safetySource: before, options: spellingOptions(ignores)} :\n                            {kind: 'refresh', source: after, safetySource: before, originalSource: appliedBaseline(adapter, before), options: currentOptions(false)});","                            {kind: 'spelling', source: after, previousSource: before, originalSource: appliedBaseline(adapter, before), safetySource: before, explicitChoice:selected,options: spellingOptions(ignores)} :\n                            {kind: 'refresh', source: after, safetySource: before, originalSource: appliedBaseline(adapter, before), explicitChoice:selected,options:JSON.parse(offer.optionsSnapshot)});")
 source=once(source,"                        const choiceSafety=v219AutomaticResultSafety(before,next,v219SafetyTaskContext(task));\n                        if(next.text!==after||!choiceSafety.accepted)throw new Error('A conferência local não confirmou a preservação da escolha. O texto anterior foi mantido.');","                        if(selected.uiBinding!==v219ManualUIBinding(kind)||\n                            !v219ExplicitChoiceResultMatches(before,after,next,selected,v219SafetyTaskContext(task),task.manualApplyOptionsSnapshot))\n                            throw new Error('A conferência local não confirmou a preservação da escolha. O texto anterior foi mantido.');")
 source=once(source,"                        if (after !== before) rememberEdit(adapter, before, after, proposal.kind === 'spelling' ? 'spelling' : 'syntax', proposal.label);","                        if (after !== before) {\n                            rememberEdit(adapter, before, after, proposal.kind === 'spelling' ? 'spelling' : 'syntax', proposal.label);\n                            if(last&&last.after===after){last.semanticHistory=next.semanticHistory;last.manualSemantic=true;restoreOwnedMinor();}\n                        }")
 source=once(source,'        const originalText = continuing ? last.before : before;\n        const previousSummary = continuing ? last.summary : null;','        const originalText = continuing ? last.before : before;\n        const semanticHistory=continuing?last.semanticHistory:null,manualSemantic=continuing&&last.manualSemantic===true;\n        const previousSummary = continuing ? last.summary : null;')
 source=once(source,'        last = {id: adapter.id, context, before: originalText, after, summary: previousSummary, kinds, topics, rules,presentationDeferred,presentationBinding:v211FreshnessKey(currentOptions(false))};','        last = {id: adapter.id, context, before: originalText, after, summary: previousSummary, kinds, topics, rules,presentationDeferred,presentationBinding:v211FreshnessKey(currentOptions(false)),semanticHistory,manualSemantic};')
 source=once(source,'        if(!result.minorCheck)return;\n        const box=minorCheckbox();','        if(last.manualSemantic){restoreOwnedMinor();return;}\n        if(!result.minorCheck)return;\n        const box=minorCheckbox();')
 source=once(source,"        s = s.replace(/\\[\\[([^|\\[\\]\\n]+)\\|('{2,3})([^'\\[\\]\\n]+)\\2\\]\\]/g, (all, target, quotes, label) => {\n            if (/[:#{}<>]/.test(target)) return all;","        const personEmphasis=v219RichPersonEmphasisRanges(s);\n        s = s.replace(/\\[\\[([^|\\[\\]\\n]+)\\|('{2,3})([^'\\[\\]\\n]+)\\2\\]\\]/g, (all, target, quotes, label, offset) => {\n            if (inRange(offset,personEmphasis)||/[:#{}<>]/.test(target)) return all;")
 return source


def patch_v219_tool_only_minor_preference(source):
 # The UI opts into the requested marking rule. Source ownership, manual
 # checkbox overrides and every preservation gate keep their original path.
 source=once(source,'    function minorEligibility(before,after,options={}) {',"""    function minorEligibility(before,after,options={}) {
        if(options.minorAllToolChanges===true){
            const eligible=typeof before==='string'&&typeof after==='string'&&before!==after&&
                options.autoMinor!==false&&options.namespaceNumber===0&&!options.sectionOnly&&options.minorBaseConfirmed===true;
            return {eligible,toolOnly:true,metrics:options.metrics||null,
                reason:eligible?'Alterações feitas pelo RevisaWiki a partir da revisão de origem.':
                    'A marcação depende de alterações exclusivas do RevisaWiki em um artigo completo.'};
        }""")
 source=once(source,"'templateDefinitionInputEnabled','minorBaseConfirmed','livingCategoryConfirmed'",
     "'templateDefinitionInputEnabled','minorBaseConfirmed','minorAllToolChanges','livingCategoryConfirmed'")
 source=once(source,"    function confirmedMinorOptions(task,job){\n        const cfg={...(job.options||{})},baseline=job.originalSource??job.source;",
     "    function confirmedMinorOptions(task,job){\n        const cfg={...(job.options||{}),minorAllToolChanges:true},baseline=job.originalSource??job.source;")
 source=once(source,"        if(v219History)result.minorCheck={...result.minorCheck,eligible:false,reason:'A edição contém uma escolha manual.'};",
     "        if(v219History&&!cfg.minorAllToolChanges)result.minorCheck={...result.minorCheck,eligible:false,reason:'A edição contém uma escolha manual.'};")
 source=once(source,'        if(last.manualSemantic){restoreOwnedMinor();return;}',
     '        if(last.manualSemantic&&!result.minorCheck?.toolOnly){restoreOwnedMinor();return;}')
 source=once(source,"'Marcar correções mecânicas confirmadas como edição menor'",
     "'Marcar ajustes do RevisaWiki como edição menor'")
 return source

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--node',default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
 args=parser.parse_args();assert args.node,'Set REVISAWIKI_NODE or pass --node.'
 raw=(ROOT/'tests/expected_release_v2180.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==BASE_PIN
 input_paths=[Path('scripts/build_v2190.py'),Path('scripts/v219_catalogs.py'),Path('scripts/v219_citation_catalog.py'),Path('tests/v219/citation_target_overlay_contract.json'),Path('scripts/v219_core_comment_budget.cjs'),Path('scripts/v219_core_comment_budget_contract.json'),Path('scripts/v219_core_prefix_whitespace_budget.cjs'),Path('scripts/v219_core_prefix_whitespace_budget_contract.json'),Path('scripts/v219_core_flat_tables.cjs'),Path('scripts/v219_core_inert_tables.cjs'),Path('package.json'),Path('package-lock.json'),Path('src/v2_19/documentation_changes.json')]+[Path('src/v2_19')/name for name in HELPERS]
 input_bytes={str(path):(ROOT/path).read_bytes() for path in input_paths}
 helpers='\n'.join(input_bytes[str(Path('src/v2_19')/name)].decode() for name in HELPERS)
 baseline=json.loads(raw);OUT.mkdir(parents=True,exist_ok=True)
 data_source=(BASE/'RevisaWiki_v2_18_0_dados.js').read_text()
 original_data,updated_data,data_at,data_length=packed_data(data_source)
 citation_target_contract=json.loads(input_bytes['tests/v219/citation_target_overlay_contract.json'])
 updated_data['packed']['translations']=apply_packed_citation_targets(updated_data['packed']['translations'],citation_target_contract)
 media_source=input_bytes['src/v2_19/media_context_safety.js'].decode()
 media_match=re.search(r'(?m)^    const V219_MEDIA_CONTEXT=Object\.freeze\((\{[^\n]+\})\);$',media_source)
 assert media_match,'The current primary media data statement differs'
 updated_data['packed']['media219']=json.loads(media_match[1])
 roles_source=input_bytes['src/v2_19/translation_safety.js'].decode()
 roles_match=re.search(r'(?m)^    const V219_NATIVE_CS1_ALIAS_ROLES=Object\.freeze\((\{[^\n]+\})\);$',roles_source)
 assert roles_match,'The current primary CS1 role data statement differs'
 updated_data['packed']['cs1roles219']=json.loads(roles_match[1])
 magic_source=input_bytes['src/v2_19/option_safety.js'].decode()
 magic_match=re.search(r'(?m)^    const V219_NATIVE_MAGIC_WORDS=Object\.freeze\((\[[^\n]+\])\);$',magic_source)
 assert magic_match,'The current primary native magic-word data statement differs'
 updated_data['packed']['magicwords219']=json.loads(magic_match[1])
 support_specs=[('V219_NATIVE_IMAGE_OPTIONS',roles_source,'nativeImageOptions'),
                ('V219_NATIVE_TIMED_MEDIA_OPTIONS',media_source,'nativeTimedMediaOptions'),
                ('V219_FOREIGN_IDENTITIES',roles_source,'foreignIdentities'),
                ('V219_ADDITIONAL_NATIVE_CITATION_REDIRECTS',roles_source,'additionalCitationRedirects'),
                ('V219_CITATION_LANGUAGE_LINKS',input_bytes['src/v2_19/preservation_equivalence.js'].decode(),'citationLanguageLinks'),
                ('V219_NATIVE_AGE_FIELDS',input_bytes['src/v2_19/native_age_fields.js'].decode(),'nativeAgeFields'),
                ('V219_NATIVE_VARIABLE_CALLS',magic_source,'nativeVariableCalls'),
                ('V219_NATIVE_COLON_CALLS',magic_source,'nativeColonCalls'),
                ('V219_NATIVE_HASH_CALLS',magic_source,'nativeHashCalls'),
                ('V219_NUMBERED_CITATION_ROLES',roles_source,'numberedCitationRoles')]
 citation_contract_source=input_bytes['src/v2_19/citation_import_safety.js'].decode()
 support_specs.extend([('V219_CITATION_UNPROVED_KEYS',citation_contract_source,'citationUnprovedKeys'),('V219_CITATION_UNPROVED_KEY_SOURCES',citation_contract_source,'citationUnprovedSources'),('V219_CITATION_UNPROVED_CROSS_ROLES',citation_contract_source,'citationCrossRoles'),('V219_CITATION_NUMBERED_TARGET_CONTRACTS',citation_contract_source,'citationNumberedTargets'),('V219_CITATION_CORRECTED_URL_FIELDS',citation_contract_source,'citationCorrectedURLFields')])
 support_matches=[];updated_data['packed']['support219']={}
 for variable,statement,key in support_specs:
  closing={'V219_FOREIGN_IDENTITIES':'}','V219_ADDITIONAL_NATIVE_CITATION_REDIRECTS':']','V219_NATIVE_AGE_FIELDS':'}','V219_NUMBERED_CITATION_ROLES':'}'}.get(variable)
  match=re.search(r'(?m)^    const '+variable+r'=Object\.freeze\(([\s\S]*?)^    '+re.escape(closing)+r'\);$',statement) if closing else re.search(r'(?m)^    const '+variable+r'=Object\.freeze\(([^\n]+)\);$',statement)
  assert match,'Pinned supplemental literal differs: '+variable
  literal=match[1]+closing if closing else match[1]
  # This is the reviewed local constant expression, evaluated only by the
  # offline build tool in an empty bounded VM. No evaluator is emitted.
  decoder="const fs=require('node:fs'),vm=require('node:vm');process.stdout.write(JSON.stringify(vm.runInNewContext('('+fs.readFileSync(0,'utf8')+')',Object.create(null),{timeout:1000})));"
  decoded=subprocess.run([args.node,'-e',decoder],input=literal,text=True,capture_output=True,check=True)
  updated_data['packed']['support219'][key]=json.loads(decoded.stdout)
  support_matches.append((variable,match[0],key))
 dictionary_support={'V219_NATIVE_LANGUAGE_NAMES':'nativeLanguageNames','V219_FOREIGN_LANGUAGE_NAMES':'foreignLanguageNames'}
 for variable,key in dictionary_support.items():
  statement=input_bytes['src/v2_19/preservation_equivalence.js'].decode()
  match=re.search(r'(?m)^    const '+variable+r'=Object\.freeze\(ownDictionary\((\{[^\n]+\})\)\);$',statement)
  assert match,'Pinned language dictionary differs: '+variable
  updated_data['packed']['support219'][key]=json.loads(match[1])
  support_matches.append((variable,match[0],key))
 # Move the unchanged legacy occupation portal dictionary as data. Keep its
 # original own-dictionary wrapper and mutability in the core.
 occupation_statement=(BASE/'RevisaWiki_v2_18_0.js').read_text()
 occupation_match=re.search(r'(?m)^    const OCCUPATION_PORTALS=ownDictionary\((\{[^\n]+\})\);$',occupation_statement)
 assert occupation_match,'Pinned legacy occupation portal dictionary differs'
 updated_data['packed']['support219']['occupationPortals']=json.loads(occupation_match[1])
 support_matches.append(('OCCUPATION_PORTALS',occupation_match[0],'occupationPortals'))
 common_match=re.search(r'(?m)^    const COMMON_OCCUPATIONS=new Set\((\[[^\n]+\])\);$',occupation_statement)
 assert common_match,'Pinned legacy occupation set differs'
 updated_data['packed']['support219']['commonOccupations']=json.loads(common_match[1])
 support_matches.append(('COMMON_OCCUPATIONS',common_match[0],'commonOccupations'))
 # Move only the unchanged legacy magic-word array; keep a fresh mutable Set.
 legacy_magic_match=re.search(r'(?m)^    const MAGIC_WORDS = new Set\((\[[^\n]+\])\);$',occupation_statement)
 assert legacy_magic_match and hashlib.sha256(legacy_magic_match[1].encode()).hexdigest()=='52d71501ecb3bc4744bc1eb4f35db1b6bb0ab527a2ac6627e0d0d1438ff9da59','Pinned legacy magic-word array differs'
 updated_data['packed']['support219']['legacyMagicWords']=json.loads(legacy_magic_match[1])
 support_matches.append(('MAGIC_WORDS',legacy_magic_match[0],'legacyMagicWords'))
 # Keep the unchanged legacy CS1 key array in modular data. Copy it at load.
 cs1_keys_match=re.search(r'(?m)^    const CS1_KEYS = (\[[^\n]+\]);$',occupation_statement)
 assert cs1_keys_match,'Pinned legacy CS1 key array differs'
 assert hashlib.sha256(cs1_keys_match[1].encode()).hexdigest()=='58ffb89e7f288ddd5860cd3aee7aee51348780add79be41ca2feddaa1a2b17b6'
 updated_data['packed']['support219']['cs1Keys']=json.loads(cs1_keys_match[1])
 support_matches.append(('CS1_KEYS',cs1_keys_match[0],'cs1Keys'))
 # Copy the two unchanged legacy authority arrays from modular data.
 for variable,key,wanted_hash in [('AUTHORITY_ARGUMENTS', 'authorityArguments', 'c134982f71edc65b9474004882646e364e8930f095a3aea1d33bb092b6b47195'), ('AUTHORITY_PROPERTIES', 'authorityProperties', '593df92699532559eaa256accfba87844aa0029ba62364c3b36a29c201a2b490')]:
  match=re.search(r'(?m)^    const '+variable+r' = (\[[^\n]+\]);$',occupation_statement)
  assert match and hashlib.sha256(match[1].encode()).hexdigest()==wanted_hash,'Pinned legacy authority array differs: '+variable
  assert key not in updated_data['packed']['support219']
  updated_data['packed']['support219'][key]=json.loads(match[1])
  support_matches.append((variable,match[0],key))
 # Preserve the existing frozen talk-project dictionary while keeping the
 # modular source below MediaWiki's size limit. No project mapping changes.
 talk_match=re.search(r'(?m)^    const V261_TALK_REGISTERED_PROJECTS = Object\.freeze\(ownDictionary\((\{[^\n]+\})\)\);$',occupation_statement)
 assert talk_match,'Pinned legacy talk-project dictionary differs'
 updated_data['packed']['support219']['talkRegisteredProjects']=json.loads(talk_match[1])
 support_matches.append(('V261_TALK_REGISTERED_PROJECTS',talk_match[0],'talkRegisteredProjects'))
 # Move only the unchanged pinned historical record into the modular data.
 # Keep the existing recursive-freeze function and every record byte value.
 historical_match=re.search(r'(?m)^    const V282_HISTORICAL_CITATIONS=v282HistoricalFreeze\((\{[^\n]+\})\);$',occupation_statement)
 assert historical_match,'Pinned historical citation data statement differs'
 updated_data['packed']['support219']['historicalCitations']=json.loads(historical_match[1])
 support_matches.append(('V282_HISTORICAL_CITATIONS',historical_match[0],'historicalCitations'))
 bank_contract_source=input_bytes['src/v2_19/foreign_reference_banks.js'].decode()
 bank_contract_match=re.search(r'(?m)^        const contract=(\{[^\n]+\});$',bank_contract_source)
 assert bank_contract_match,'Pinned literal collector contract differs'
 updated_data['packed']['support219']['foreignReferenceBankContracts']=json.loads(bank_contract_match[1])
 # Decode flat labels only after every approved SOURCE hook has run.
 # The full artifact is reused below, so hooks are never applied twice.
 full_baseline=(BASE/'RevisaWiki_v2_18_0_completo.js').read_text()
 patched_complete=patch(apply_packed(full_baseline,original_data,updated_data),helpers)
 flat_run=subprocess.run([args.node,str(ROOT/'scripts/v219_core_flat_tables.cjs')],
               input=patched_complete,text=True,capture_output=True,check=True)
 flat_tables=json.loads(flat_run.stdout)['tables']
 assert [row['variable'] for row in flat_tables]==['GROUP_LABELS','PORTAL_IDENTITY_ALIASES']
 for row in flat_tables:
  assert row['key'] not in updated_data['packed']['support219']
  assert all(isinstance(pair,list) and len(pair)==2 and all(isinstance(value,str) for value in pair) for pair in row['entries'])
  updated_data['packed']['support219'][row['key']]=row['entries']
  support_matches.append((row['variable'],row['statement'],row['key']))
 # Extract only the three pinned inert constants after all Source hooks.
 inert_run=subprocess.run([args.node,str(ROOT/'scripts/v219_core_inert_tables.cjs')],
              input=patched_complete,text=True,capture_output=True,check=True)
 inert_tables=json.loads(inert_run.stdout)['tables']
 assert [row['variable'] for row in inert_tables]==['V2151_LEAD_TRANSFER_CONTRACTS','V214_DRUG_FIELDS','V28_DATE_FIELDS','OBSOLETE_CATALOG','NATIONALITY_PORTALS','COUNTRY_PORTALS']
 for row in inert_tables:
  assert row['key'] not in updated_data['packed']['support219']
  updated_data['packed']['support219'][row['key']]=row['value']
  support_matches.append((row['variable'],row['statement'],row['key']))
 assert len(canonical(updated_data['packed']).encode())<1900000,'Packed catalog exceeds the existing parser budget'
 packed_hash=hashlib.sha256(canonical(updated_data['packed']).encode()).hexdigest()
 names={name:name.replace('_v2_18_0','_v2_19_0') for name in baseline['files']};files={}
 for name,pin in baseline['files'].items():
  original=(BASE/name).read_bytes();assert len(original)==pin['bytes'] and hashlib.sha256(original).hexdigest()==pin['sha256']
  text=original.decode()
  if name=='RevisaWiki_v2_18_0_dados.js':text=data_source[:data_at]+json.dumps(updated_data,ensure_ascii=False,separators=(',',':'))+data_source[data_at+data_length:]
  elif name=='RevisaWiki_v2_18_0_completo.js':text=patched_complete
  text=text.replace(baseline['packedCatalogSha256'],packed_hash)
  if name=='RevisaWiki_v2_18_0.js':text=patch(text,helpers)
  if name=='RevisaWiki_v2_18_0.js':
   text=once(text,media_match[0],"    const V219_MEDIA_CONTEXT=Object.freeze(root.RevisaWikiDataV2.packed.media219);")
   text=once(text,roles_match[0],"    const V219_NATIVE_CS1_ALIAS_ROLES=Object.freeze(root.RevisaWikiDataV2.packed.cs1roles219);")
   text=once(text,magic_match[0],"    const V219_NATIVE_MAGIC_WORDS=Object.freeze(root.RevisaWikiDataV2.packed.magicwords219);")
   text=once(text,'    var v219BankImplCache;',"    const v219BankContractData=root.RevisaWikiDataV2.packed.support219.foreignReferenceBankContracts;\n    var v219BankImplCache;")
   text=once(text,bank_contract_match[0],'        const contract=v219BankContractData;')
   for variable,statement,key in support_matches:
    value="root.RevisaWikiDataV2.packed.support219."+key
    if variable=="OCCUPATION_PORTALS":
     replacement="    const OCCUPATION_PORTALS = ownDictionary("+value+");"
    elif variable in ("COMMON_OCCUPATIONS","MAGIC_WORDS"):
     replacement="    const "+variable+" = new Set("+value+");"
    elif variable in ("CS1_KEYS","AUTHORITY_ARGUMENTS","AUTHORITY_PROPERTIES"):
     replacement="    const "+variable+" = "+value+".slice();"
    elif variable=="GROUP_LABELS":
     replacement="    const GROUP_LABELS = Object.fromEntries("+value+");"
    elif variable=="PORTAL_IDENTITY_ALIASES":
     replacement="    const PORTAL_IDENTITY_ALIASES=ownDictionary(Object.fromEntries("+value+"));"
    elif variable=="COUNTRY_PORTALS":
     replacement="    const COUNTRY_PORTALS=ownDictionary("+value+");"
    elif variable=="NATIONALITY_PORTALS":
     replacement="    const NATIONALITY_PORTALS=ownDictionary("+value+");"
    elif variable=="OBSOLETE_CATALOG":
     replacement="    const OBSOLETE_CATALOG = ownDictionary(JSON.parse(JSON.stringify("+value+")));"
    elif variable in ("V2151_LEAD_TRANSFER_CONTRACTS","V214_DRUG_FIELDS","V28_DATE_FIELDS"):
     copied="JSON.parse(JSON.stringify("+value+"))"
     if variable=="V28_DATE_FIELDS":copied="Object.freeze("+copied+")"
     replacement="    const "+variable+" = "+copied+";"
    elif variable=="V282_HISTORICAL_CITATIONS":
     replacement="    const V282_HISTORICAL_CITATIONS=v282HistoricalFreeze("+value+");"
    else:
     if variable in dictionary_support or variable=="V261_TALK_REGISTERED_PROJECTS":value="ownDictionary("+value+")"
     replacement="    const "+variable+"=Object.freeze("+value+");"
    text=once(text,statement,replacement)
  text=text.replace('2.18.0','2.19.0')
  for before,after in names.items():text=text.replace(before,after)
  target=OUT/names[name];target.write_text(text)
  emitted=target.read_bytes();subprocess.run([args.node,'--check',str(target)],check=True)
  if name.startswith('Chamada_fixa_'):assert emitted==original
  files[target.name]={'bytes':len(emitted),'sha256':hashlib.sha256(emitted).hexdigest()}
 # Apply this build-only budget once, after all SOURCE rendering and before
 # recording the final modular artifact size/hash. Complete/data stay exact.
 budget_core=OUT/'RevisaWiki_v2_19_0.js'
 budget_complete=OUT/'RevisaWiki_v2_19_0_completo.js'
 budget_data=OUT/'RevisaWiki_v2_19_0_dados.js'
 budget_full_before=budget_complete.read_bytes();budget_data_before=budget_data.read_bytes()
 budget_input={'source':budget_core.read_text(),'completeSource':budget_full_before.decode(),
               'contract':json.loads(input_bytes['scripts/v219_core_comment_budget_contract.json']),
               'tier':'reserve73KiB'}
 # Fail with the exact missing token hashes before the unchanged AST budget tool.
 assert len(budget_input['contract']['rows'])==1082 and len(budget_input['contract']['tiers'])==7
 for artifact_role,artifact_source in [('core',budget_input['source']),('complete',budget_input['completeSource'])]:
  missing_comments=[row['sha256'] for row in budget_input['contract']['rows'] if row['rawText'] not in artifact_source]
  assert not missing_comments,'Reviewed comment SOURCE presence failed in '+artifact_role+': '+','.join(missing_comments)
 budget_run=subprocess.run([args.node,str(ROOT/'scripts/v219_core_comment_budget.cjs')],
               input=json.dumps(budget_input,ensure_ascii=False),text=True,capture_output=True,check=True)
 budget_output=json.loads(budget_run.stdout)
 assert budget_output['proof']['semanticAstBeforeSha256']==budget_output['proof']['semanticAstAfterSha256']
 assert budget_output['proof']['runtimeStatementsChanged']==0
 # Generated indentation has its own reversible token/comment/AST proof.
 # It never changes readable SOURCE, the full bundle, DATA or comment tiers.
 whitespace_input={'source':budget_output['source'],'completeSource':budget_full_before.decode(),
                   'contract':json.loads(input_bytes['scripts/v219_core_prefix_whitespace_budget_contract.json'])}
 whitespace_run=subprocess.run([args.node,str(ROOT/'scripts/v219_core_prefix_whitespace_budget.cjs')],
               input=json.dumps(whitespace_input,ensure_ascii=False),text=True,capture_output=True,check=True)
 whitespace_output=json.loads(whitespace_run.stdout);whitespace_proof=whitespace_output['proof']
 assert whitespace_proof['semanticAstBeforeSha256']==whitespace_proof['semanticAstAfterSha256']
 assert whitespace_proof['runtimeStatementsChanged']==whitespace_proof['executableTokenEdits']==0
 assert whitespace_proof['everyTokenAndCommentRawBytePreserved'] and whitespace_proof['everyLineTerminatorPreserved']
 assert whitespace_proof['allFunctionDeclarationHeaderLinesPreserved'] and whitespace_proof['allSixInertConstructorLinesPreserved']
 assert whitespace_proof['sourceBeforeSha256']==hashlib.sha256(whitespace_input['source'].encode()).hexdigest()
 assert whitespace_proof['sourceAfterSha256']==hashlib.sha256(whitespace_output['source'].encode()).hexdigest()
 assert whitespace_proof['exactReverseSha256']==whitespace_proof['sourceBeforeSha256']
 assert whitespace_proof['completeBeforeSha256']==whitespace_proof['completeAfterSha256']==hashlib.sha256(budget_full_before).hexdigest()
 assert 98304<=whitespace_proof['actualBytesSaved']<=98559
 # The build launcher already retains stderr; no runtime/manifest file is added.
 sys.stderr.write(json.dumps({'kind':'generated-core-whitespace-build-proof','proof':whitespace_proof,
                             'edits':whitespace_output['edits']},ensure_ascii=False)+'\n')
 budget_core.write_text(whitespace_output['source'])
 assert budget_complete.read_bytes()==budget_full_before and budget_data.read_bytes()==budget_data_before
 budget_emitted=budget_core.read_bytes()
 files[budget_core.name]={'bytes':len(budget_emitted),'sha256':hashlib.sha256(budget_emitted).hexdigest()}
 subprocess.run([args.node,'--check',str(budget_core)],check=True)
 for name in ('RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_dados.js'):assert files[name]['bytes']<2097152
 archived=json.loads((BASE/'ARQUIVOS.json').read_text())['files']
 for path in sorted(BASE.glob('Catalogo_*.json')):
  raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==archived[path.name]['sha256']
  catalog=json_catalog(json.loads(raw))
  if catalog.get('profiles') and any(profile.get('kind')=='citation' for profile in catalog['profiles'].values()):catalog=apply_expanded_citation_targets(catalog,citation_target_contract)
  catalog['releaseVersion']=catalog['distributionVersion']='2.19.0'
  if 'releaseCoreSha256' in catalog:catalog['releaseCoreSha256']=files['RevisaWiki_v2_19_0.js']['sha256']
  (OUT/path.name.replace('_v2_18_0','_v2_19_0')).write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
 manifest={'version':'2.19.0','runtimeVersion':'2.19.0','distributionRevision':'2.19.0',
   'baseVersion':'2.18.0','baseManifestSha256':BASE_PIN,'packedCatalogSha256':packed_hash,'files':files,
   'sourceInputs':{name:{'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()} for name,content in input_bytes.items()}}
 for name,content in input_bytes.items():assert (ROOT/name).read_bytes()==content,'A build input changed during reconstruction: '+name
 (ROOT/'tests/expected_release_v2190.json').write_text(json.dumps(manifest,indent=2)+'\n')
 print(json.dumps(manifest,indent=2))

if __name__=='__main__':main()
