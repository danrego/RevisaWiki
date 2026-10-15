    // O segundo atalho usa a mesma análise do painel e nunca envia o formulário.
    function mountPublishAdjustment(adapter) {
        const save = root.document.getElementById('wpSave');
        const form = root.document.getElementById('editform');
        if (stylesMode || !adapter || sourceTarget() || !form || !save || !form.contains(save)) {
            if (publishAdjustment) publishAdjustment.remove();
            publishAdjustment = null;
            return;
        }
        // O botão nativo pode estar dentro de um widget OOUI. Preserve esse widget.
        const widget = save.closest('#wpSaveWidget,.oo-ui-buttonElement');
        const anchor = widget && form.contains(widget) ? widget : save;
        if (!anchor.parentNode) return;
        if (!publishAdjustment || !publishAdjustment.isConnected) {
            if (publishAdjustment) publishAdjustment.remove();
            publishAdjustment = button('Ajustar código', () => run(false), 'ajg-save-adjust');
            publishAdjustment.id = 'revisawiki-adjust-before-publish';
            publishAdjustment.title = 'Aplicar os ajustes do RevisaWiki ao rascunho. Confira o resultado no painel antes de publicar.';
            publishAdjustment.setAttribute('aria-label', 'Ajustar código com RevisaWiki');
            publishAdjustment.setAttribute('aria-controls', 'revisawiki-ptwiki');
        }
        if (save.tabIndex > 0) publishAdjustment.tabIndex = save.tabIndex;
        else publishAdjustment.removeAttribute('tabindex');
        if (anchor.previousElementSibling !== publishAdjustment)
            anchor.parentNode.insertBefore(publishAdjustment, anchor);
        publishAdjustment.disabled = localBusy || onlineBusy;
    }

