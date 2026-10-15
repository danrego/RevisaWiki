"""Remove automatic reading-page shortcuts without changing editor actions."""


def _replace(source, before, after, expected=1):
    if source.count(before) != expected:
        raise ValueError('Section-button integration anchor is absent or repeated')
    return source.replace(before, after)


_OLD_CLEANUP = "querySelectorAll('.rw26-lead-launch').forEach(button=>button.remove());"
_NEW_CLEANUP = "querySelectorAll('button.rw26-launch, button.rw26-lead-launch').forEach(button=>button.remove());"


def apply_loader(source):
    if 'const inlineLoadAttempt = window.RevisaWikiInlinePending || null;' in source:
        source = _replace(source, 'const inlineLoadAttempt = window.RevisaWikiInlinePending || null;', 'const inlineLoadAttempt = null;')
    source = _replace(source, 'root.document.' + _OLD_CLEANUP,
                      'root.document.' + _NEW_CLEANUP + "\n        const oldPending=root.RevisaWikiInlinePending;if(oldPending){root.clearTimeout(oldPending.timer);root.RevisaWikiInlinePending=null;}")
    source = _replace(source, 'doc.' + _OLD_CLEANUP,
                      'doc.' + _NEW_CLEANUP)
    source = _replace(source, """            const container=content?.jquery?content[0]:content?.nodeType?content:doc;
            for(const native of container.querySelectorAll('.mw-editsection a[href]')) {
                if(native.closest('.rw26-inline,.rw26-preview-body') || native.classList.contains('mw-editsection-visualeditor') || native.dataset.rw26Lazy || !valid(native.href))continue;
                native.dataset.rw26Lazy='1'; add(native,native.href,'Editar aqui');
            }
""", "            // As ligações nativas de edição permanecem sem controles adicionais.\n") if "content?.jquery?content[0]:content?.nodeType?content:doc" in source else _replace(source, """            const container=optionalValue(content, 'jquery')?content[0]:optionalValue(content, 'nodeType')?content:doc;
            for(const native of container.querySelectorAll('.mw-editsection a[href]')) {
                if(native.closest('.rw26-inline,.rw26-preview-body') || native.classList.contains('mw-editsection-visualeditor') || native.dataset.rw26Lazy || !valid(native.href))continue;
                native.dataset.rw26Lazy='1'; add(native,native.href,'Editar aqui');
            }
""", "            // As ligações nativas de edição permanecem sem controles adicionais.\n")
    return source


def apply_core(source):
    source = _replace(source, 'const inlineLoadAttempt = root.RevisaWikiInlinePending || null;', 'const inlineLoadAttempt = null;', expected=2 if '    function v26InstallReadLauncher(root, mw, load) {' in source else 1)
    source = _replace(source, """        function mount(content) {
            doc.querySelectorAll('.rw26-lead-launch').forEach(button=>button.remove());
            if (active && !active.disposed""", """        function mount(content) {
            doc.querySelectorAll('button.rw26-launch, button.rw26-lead-launch').forEach(button=>button.remove());
            if (active && !active.disposed""")
    source = _replace(source, """            const container = content?.jquery ? content[0] : content?.nodeType ? content : doc;
            for (const native of container.querySelectorAll('.mw-editsection a[href]')) {
                if (native.closest('.rw26-inline,.rw26-preview-body') || native.dataset.rw26Mounted || native.classList.contains('mw-editsection-visualeditor')) continue;
                let target; try { target = H.parseEditTarget(native.href, origin); } catch (_) { continue; }
                native.dataset.rw26Mounted = '1'; const launch = action('Editar aqui', 'rw26-launch', () => open(target.href, native));
                launch.style.cssText = 'font-size:inherit;padding:.1em .45em;min-height:0;line-height:1.4;margin-inline-start:.4em;'; launch.title = 'Editar esta seção com RevisaWiki, sem sair da leitura.'; native.after(launch);
            }
""", "            // O editor de código-fonte conserva os próprios botões de ajuste.\n")
    source = _replace(source, '''        const pendingInline = root.RevisaWikiInlinePending;
        if (pendingInline && typeof pendingInline.href === 'string') {
            root.RevisaWikiInlineLoadSettled?.(pendingInline);
            if(root.RevisaWikiInlinePending===pendingInline)root.RevisaWikiInlinePending = null;
            root.document.querySelectorAll('.rw26-lazy-launch').forEach(item=>item.remove());
            inlineController.open(pendingInline.href,pendingInline.anchor);
        }
''', '')
    if '    function v26InstallReadLauncher(root, mw, load) {' in source:
        source = apply_loader(source)
        source = _replace(source, "if (['edit','submit'].includes(action) || root.document?.getElementById('wpTextbox1') || root.RevisaWikiInlinePending)", "if (['edit','submit'].includes(action) || root.document?.getElementById('wpTextbox1'))")
    return source
