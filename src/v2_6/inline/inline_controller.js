    // Edição de seção integrada. Somente o botão Publicar pode enviar uma edição.
    const v26InlineHelpers = (() => {
        const normalizeTitle = value => String(value || '').replace(/_/g, ' ').trim().normalize('NFC');
        const error = (code, message, data) => Object.assign(new Error(message), {code, data});
        function parseEditTarget(href, origin) {
            let url; try { url = new URL(href, origin); } catch (_) { throw error('link', 'A ligação de edição não é válida.'); }
            if (url.origin !== origin || url.username || url.password || !/\/w\/index\.php$/.test(url.pathname) || url.searchParams.get('action') !== 'edit' || new Set(url.searchParams.keys()).size !== [...url.searchParams.keys()].length)
                throw error('link', 'Use a ligação de edição desta Wikipédia.');
            const title = normalizeTitle(url.searchParams.get('title')), section = url.searchParams.get('section');
            if (!title || !/^\d+$/.test(section || '') || url.searchParams.has('oldid') || url.searchParams.has('undo') || url.searchParams.has('preload') || url.searchParams.has('editintro'))
                throw error('native-required', 'Esta seção precisa do editor completo. A ligação original foi mantida.');
            if ([...url.searchParams.keys()].some(k => !['title', 'action', 'section', 'veswitched', 'uselang'].includes(k)))
                throw error('native-required', 'Esta ligação usa opções que precisam do editor completo.');
            return {title, section, href: url.href, anchor: url.hash};
        }
        function revisionContent(revision) {
            const slot = revision?.slots?.main;
            if (!slot || slot.contenthidden || revision.texthidden || typeof slot.content !== 'string')
                throw error('source-unavailable', 'O código da revisão não está disponível. Abra o editor completo.');
            if ((slot.contentmodel || 'wikitext') !== 'wikitext') throw error('content-model', 'A edição rápida aceita apenas wikitexto.');
            return slot.content;
        }
        function snapshotDraft(session) {
            return Object.freeze({text: session.textarea.value, summary: session.summaryInput.value,
                minor: !!session.minorInput.checked, watchlist: ['preferences','watch','unwatch','nochange'].includes(session.watchInput.value) ? session.watchInput.value : 'preferences',
                title: session.title, section: session.section, base: session.base, timestamp: session.timestamp,
                starttimestamp: session.starttimestamp, user: session.user, pageid: session.pageid});
        }
        function renderSummary(template, values) {
            const allowed = {section: values.section || '', sectionname: values.sectionname || '', sectionlink: values.sectionname ? '/* ' + String(values.sectionname).replace(/\*\//g, '').replace(/[\r\n]/g, ' ') + ' */' : '', scriptlink: values.scriptlink || 'Usuário:Daniel G Rego/RevisaWiki', summary: values.summary || ''};
            const raw = String(template || '$summary'), result = raw.replace(/\$(sectionname|sectionlink|scriptlink|section|summary)\b/g, (_, key) => allowed[key]);
            return result + (!/\$summary\b/.test(raw) && values.summary ? ' ' + values.summary : '');
        }
        function recoveryMatches(value, context) {
            return !!value && value.schema === 1 && value.origin === context.origin && normalizeTitle(value.title) === normalizeTitle(context.title) &&
                String(value.section) === String(context.section) && Number.isInteger(value.base) && value.base > 0 && value.base === Number(context.base);
        }
        function validateRecovery(value, context, now = Date.now()) {
            if (!recoveryMatches(value,context) || typeof value.savedAt !== 'number' || value.savedAt > now + 1000 || now - value.savedAt > 900000 ||
                typeof value.text !== 'string' || value.text.length > 4194304 || typeof value.summary !== 'string' || value.summary.length > 2000 ||
                !['preferences', 'watch', 'unwatch', 'nochange'].includes(value.watchlist)) return null;
            return {text: value.text, summary: value.summary, minor: value.minor === true, watchlist: value.watchlist};
        }
        function classifyError(reason) {
            const code = String(reason?.code || reason?.error?.code || (typeof reason === 'string' ? reason : 'unknown'));
            const conflict = ['editconflict', 'pagedeleted', 'missingtitle', 'nosuchrevid', 'invalidsection', 'nosuchsection', 'articleexists'].includes(code);
            const uncertain = /^(?:http|timeout|network|abort|unknown|empty-response|invalid-response)$/.test(code);
            const native = /captcha|abusefilter|spam|blocked|protected|permission|assert|token|readonly|ratelimit/i.test(code) || conflict;
            return {code, conflict, uncertain, native};
        }
        return {normalizeTitle, parseEditTarget, revisionContent, snapshotDraft, renderSummary, recoveryMatches, validateRecovery, classifyError, error};
    })();
    function v26CreateInlineController(root, mw, host) {
        const H = v26InlineHelpers, doc = root.document, origin = root.location.origin;
        const recoveryKey = 'RevisaWiki.inlineDraft.v1';
        let active = null, serial = 0, disposed = false, closeWindow = null;
        function config() { return host.config?.() || {}; }
        function competingEditor() { return doc.querySelector('#wpTextbox1,.ve-ui-surface,.ext-discussiontools-ui-replyWidget,.ext-discussiontools-ui-newTopic,.in-page-edit,.ipe-editor'); }
        function text(tag, value, className) { const n = doc.createElement(tag); if (value !== undefined) n.textContent = value; if (className) n.className = className; return n; }
        function action(label, className, fn) { const b = text('button', label, 'mw-ui-button ' + className); b.type = 'button'; b.addEventListener('click', fn); return b; }
        function isActive(s) { return active === s && !s.disposed && !disposed; }
        function guard(s) { if (!isActive(s)) throw H.error('disposed', 'A edição rápida foi encerrada.'); }
        function status(s, message, state) { if (!isActive(s)) return; s.status.textContent = message; if (state) s.state = state; s.box.dataset.state = s.state; }
        function matchesSentDraft(s) { return !!s.sentSnapshot && s.textarea.value===s.sentSnapshot.text && s.summaryInput.value===s.sentSnapshot.summary && s.minorInput.checked===s.sentSnapshot.minor && s.watchInput.value===s.sentSnapshot.watchlist; }
        function dirty(s) { return !!s.textarea && (s.unpublishedAfterSave ? !matchesSentDraft(s) : s.textarea.value !== s.original || s.summaryInput.value !== s.initialSummary); }
        function promise(request) {
            if (!request || typeof request.then !== 'function') return Promise.reject(H.error('empty-response', 'A API não respondeu.'));
            return new Promise((resolve, reject) => request.then(resolve, (code, data) => {
                if (code instanceof Error) { reject(code); return; }
                const payload = data?.error || data?.responseJSON?.error || data;
                const message = payload?.info || payload?.error?.info || (typeof code === 'string' ? code : 'A API não respondeu.');
                reject(H.error(typeof code === 'string' ? code : payload?.code || 'network', message, data));
            }));
        }
        async function read(s, method, params) {
            guard(s); const request = s.client[method](params); s.requests.add(request);
            try { const response = await promise(request); guard(s); if (response?.error) throw H.error(response.error.code, response.error.info || response.error.code, response.error); return response; }
            finally { s.requests.delete(request); }
        }
        function sourceContext(s, source) { guard(s); return host.composeSection(s.pageSource, s.sections, s.section, source); }
        function saveRecovery(s) {
            if (!s.textarea || !dirty(s)) return true;
            const snapshot = H.snapshotDraft(s), value = {schema: 1, origin, title: s.title, section: s.section, base: s.base,
                savedAt: Date.now(), text: snapshot.text, summary: snapshot.summary, minor: snapshot.minor, watchlist: snapshot.watchlist};
            try { root.sessionStorage.setItem(recoveryKey, JSON.stringify(value)); return true; } catch (_) { return false; }
        }
        function clearRecovery(s) {
            try { const value=JSON.parse(root.sessionStorage.getItem(recoveryKey)||'null');
                if(H.recoveryMatches(value,{origin,title:s.title,section:s.section,base:s.base}))root.sessionStorage.removeItem(recoveryKey);
            } catch (_) { /* A cópia em memória continua disponível. */ }
        }
        function emitInput(s) { s.textarea.dispatchEvent(new root.Event('input', {bubbles: true})); s.textarea.dispatchEvent(new root.Event('change', {bubbles: true})); }
        function requestClose(s) {
            if (!isActive(s)) return;
            if (s.state === 'saved') { finish(s); return; }
            if (s.state === 'publishing' || s.state === 'uncertain') { status(s, 'O resultado da publicação ainda precisa ser confirmado. Guarde o rascunho antes de sair.'); return; }
            if (host.isBusy?.()) { status(s, 'Aguarde ou cancele a análise antes de fechar esta edição.'); return; }
            if (dirty(s) && !root.confirm('Descartar as alterações desta seção?')) { s.textarea.focus(); return; }
            clearRecovery(s); finish(s); s.anchor?.focus?.();
        }
        function finish(s) {
            if (!isActive(s)) return;
            const ownsHost = !!s.textarea && !competingEditor();
            s.disposed = true; root.clearTimeout(s.previewTimer); root.clearTimeout(s.reloadTimer); s.previewGeneration++;
            for (const request of s.requests) request.abort?.(); s.requests.clear(); s.previewRequest?.abort?.();
            if(ownsHost)host.cancel?.(s.textarea); s.box.remove(); active = null; closeWindow?.release?.(); closeWindow = null; host.editorChanged?.();
        }
        function lock(s, locked) {
            for (const field of [s.textarea, s.summaryInput, s.minorInput, s.watchInput, s.publishButton, s.previewButton, s.liveInput, s.cancelButton, s.nativeButton])
                if (field) field.disabled = locked;
        }
        async function preview(s) {
            if (!isActive(s) || !s.textarea || s.state === 'publishing' || s.state === 'uncertain' || ['saved','saved-draft'].includes(s.state)) return;
            root.clearTimeout(s.previewTimer); const generation = ++s.previewGeneration, source = s.textarea.value;
            s.previewRequest?.abort?.(); status(s, 'Preparando a pré-visualização da página inteira, sem publicar...');
            let request;
            try {
                const composed = sourceContext(s, source);
                request = s.client.post({action: 'parse', formatversion: 2, title: s.title, text: composed.text,
                    contentmodel: 'wikitext', prop: 'text|modules|parsewarnings', preview: true, disableeditsection: true});
                s.previewRequest = request;
                const data = await promise(request);
                if (!isActive(s) || generation !== s.previewGeneration || s.textarea.value !== source) return;
                if (data.error || typeof data.parse?.text !== 'string') throw H.error(data.error?.code || 'preview', data.error?.info || 'A API não retornou a pré-visualização.');
                s.previewBody.innerHTML = data.parse.text; s.previewBody.hidden = false;
                s.previewLabel.textContent = 'Pré-visualização da página inteira em ' + s.title;
                const modules = [...(data.parse.modules || []), ...(data.parse.modulestyles || [])].filter(m => typeof m === 'string');
                if (modules.length) await mw.loader.using(modules);
                if (!isActive(s) || generation !== s.previewGeneration || s.textarea.value !== source) return;
                mw.hook('wikipage.content').fire(root.jQuery ? root.jQuery(s.previewBody) : s.previewBody);
                s.lastPreview = generation; status(s, 'Pré-visualização atualizada. O código do rascunho foi preservado.');
            } catch (reason) {
                if (isActive(s) && generation === s.previewGeneration && s.textarea.value === source)
                    status(s, 'Não foi possível atualizar a pré-visualização. Seu texto está preservado. Clique em Ver prévia para tentar novamente.');
            } finally { if (s.previewRequest === request) s.previewRequest = null; }
        }
        function nativeHandoff(s) {
            if (!isActive(s) || s.state === 'publishing' || s.state === 'uncertain') return;
            if (host.isBusy?.()) { status(s, 'Aguarde ou cancele a análise antes de mudar de editor.'); return; }
            if (s.sourceConflict) {
                saveRecovery(s);
                status(s,'A página ou a seção mudou. Este rascunho continua aberto. Copie ou baixe o texto antes de continuar no editor completo em outra aba.');
                const link=text('a','Abrir editor completo em outra aba','mw-ui-button rw26-conflict-native');
                link.href=s.href; link.target='_blank'; link.rel='noopener noreferrer'; s.status.append(doc.createTextNode(' '),link); return;
            }
            if (dirty(s) && !saveRecovery(s)) { status(s, 'O navegador não guardou o rascunho. Use Copiar rascunho ou Baixar rascunho antes de abrir o editor completo.'); return; }
            s.handoff = true; closeWindow?.release?.(); closeWindow = null;
            try { root.location.assign(s.href); }
            catch (_) { s.handoff=false; if(typeof mw.confirmCloseWindow==='function')closeWindow=mw.confirmCloseWindow({namespace:'revisawiki-inline',test:()=>isActive(s)&&dirty(s)&&!s.handoff&&s.state!=='saved'}); status(s,'Não foi possível abrir o editor completo. Seu rascunho continua disponível para copiar ou baixar.'); }
        }
        function download(s) {
            if (!isActive(s) || !s.textarea) return;
            const url = root.URL.createObjectURL(new root.Blob([s.textarea.value], {type: 'text/plain;charset=utf-8'}));
            const a = text('a'); a.href = url; a.download = 'rascunho-revisawiki.wiki'; doc.body.append(a); a.click(); a.remove(); root.setTimeout(() => root.URL.revokeObjectURL(url), 1000);
        }
        async function copy(s) {
            if (!isActive(s) || !s.textarea) return;
            try { if (!root.navigator.clipboard?.writeText) throw new Error(); await root.navigator.clipboard.writeText(s.textarea.value); status(s, 'Rascunho copiado.'); }
            catch (_) { s.textarea.focus(); s.textarea.select(); status(s, 'Texto selecionado. Use o comando Copiar do navegador.'); }
        }
        function errorText(reason) {
            const info = H.classifyError(reason);
            if (info.conflict) return 'A página ou a seção mudou. Seu rascunho foi preservado. Resolva a diferença no editor completo.';
            if (/assert|notloggedin/i.test(info.code)) return 'Sua sessão de usuário mudou. O rascunho foi preservado. Confira a sessão no editor completo.';
            if (/captcha|abusefilter|spam/i.test(info.code)) return 'A Wikipédia solicitou uma conferência adicional. Abra o editor completo com o rascunho preservado.';
            return 'A publicação foi recusada (' + info.code + '). Seu texto foi preservado. Confira o editor completo para continuar.';
        }
        function retainAfterSave(s,link) {
            s.unpublishedAfterSave=true; s.state='saved-draft'; lock(s,true); s.textarea.disabled=false; s.summaryInput.disabled=false;
            s.cancelButton.textContent='Fechar'; s.cancelButton.disabled=false; s.cancelButton.onclick=null; saveRecovery(s);
            if (!closeWindow && typeof mw.confirmCloseWindow==='function')closeWindow=mw.confirmCloseWindow({namespace:'revisawiki-inline',test:()=>isActive(s)&&dirty(s)&&!s.handoff});
            status(s,'A versão enviada foi confirmada, mas há alterações locais posteriores que não foram publicadas. Copie ou baixe este rascunho antes de abrir a revisão confirmada.','saved-draft');
            if(link)s.status.append(doc.createTextNode(' '),link);
        }
        function saved(s, revision, nochange) {
            guard(s); s.savedRevision = revision || s.base; s.state = 'saved'; lock(s, true);
            root.clearTimeout(s.previewTimer); s.previewGeneration++; s.previewRequest?.abort?.();
            const link = text('a', 'Abrir revisão confirmada', 'mw-ui-button rw26-saved-revision');
            const url = new URL('/w/index.php', origin); url.searchParams.set('title', s.title); url.searchParams.set('oldid', String(s.savedRevision));
            if (s.sectionAnchor) url.hash = s.sectionAnchor; link.href = url.href; s.savedLink=link;
            if (!matchesSentDraft(s)) { retainAfterSave(s,link); return; }
            clearRecovery(s); closeWindow?.release?.(); closeWindow = null;
            status(s, nochange ? 'A Wikipédia confirmou que não havia alterações para publicar.' : 'Alterações publicadas. Abra a revisão confirmada para atualizar o artigo.');
            s.status.append(doc.createTextNode(' '), link);
            const unchanged = () => matchesSentDraft(s) && mw.config.get('wgUserName') === s.sentSnapshot.user;
            if (unchanged() && !competingEditor()) {
                s.reloadTimer = root.setTimeout(() => {
                    if (!isActive(s)) return;
                    if (!matchesSentDraft(s)) { retainAfterSave(s,link); return; }
                    if (!unchanged() || competingEditor()) return;
                    try { root.location.assign(link.href); }
                    catch (_) { status(s, 'A publicação foi confirmada. Não foi possível recarregar a página. Use a ligação da revisão confirmada.'); s.status.append(doc.createTextNode(' '),link); }
                },100);
            }
            s.cancelButton.textContent = 'Fechar'; s.cancelButton.disabled = false; s.cancelButton.onclick = null;
        }
        async function reconcile(s, snapshot) {
            try {
                const response = await read(s, 'get', {action: 'query', formatversion: 2, pageids: s.pageid,
                    prop: 'info|revisions', rvslots: 'main', rvprop: 'ids|timestamp|content|contentmodel|user', rvlimit: 1});
                const page = response.query?.pages?.[0], rev = page?.revisions?.[0], expected = sourceContext(s, snapshot.text).text;
                if (page?.pageid === s.pageid && H.normalizeTitle(page.title) === s.title && rev?.parentid === s.base && rev?.user === snapshot.user && H.revisionContent(rev) === expected) {
                    saved(s, rev.revid, false); return;
                }
            } catch (_) { /* Sem confirmação não há novo envio. */ }
            if (!isActive(s)) return;
            status(s, 'Resultado ainda não confirmado. O envio não será repetido. Guarde o rascunho e confira o histórico da página.', 'uncertain');
            const link = text('a', 'Conferir histórico'); const url = new URL('/w/index.php', origin); url.searchParams.set('title', s.title); url.searchParams.set('action', 'history'); link.href = url.href; link.target = '_blank'; link.rel = 'noopener'; s.status.append(doc.createTextNode(' '), link);
            s.textarea.disabled = false; s.summaryInput.disabled = false;
        }
        async function publish(s, event) {
            if (!event.isTrusted || !isActive(s) || !s.textarea || ['publishing', 'uncertain', 'saved', 'saved-draft'].includes(s.state)) return;
            if (host.isBusy?.()) { status(s, 'Aguarde ou cancele a análise antes de publicar.'); return; }
            if (competingEditor()) { status(s, 'Outro editor foi aberto. Guarde este rascunho e conclua essa edição antes de publicar a seção.'); return; }
            if (s.textarea.value === s.original) { status(s, 'O texto desta seção não mudou. Nenhuma edição foi enviada.'); return; }
            const snapshot = H.snapshotDraft(s);
            if (Array.from(snapshot.summary).length > 500) { status(s, 'O resumo ultrapassa o limite de 500 caracteres. Reduza o texto antes de publicar.'); return; }
            if (!snapshot.user || mw.config.get('wgUserName') !== snapshot.user || typeof s.client.assertCurrentUser !== 'function' || typeof s.client.postWithToken !== 'function') {
                status(s, 'Não foi possível confirmar a sessão de usuário. Abra o editor completo com seu rascunho.'); return;
            }
            const params = {action: 'edit', formatversion: 2, title: snapshot.title, nocreate: true, section: snapshot.section, text: snapshot.text,
                summary: snapshot.summary, baserevid: snapshot.base, basetimestamp: snapshot.timestamp, starttimestamp: snapshot.starttimestamp,
                watchlist: snapshot.watchlist, ...(snapshot.minor ? {minor: true} : {notminor: true})};
            let asserted;
            try { asserted = s.client.assertCurrentUser(params); if (!asserted || asserted.assertuser !== snapshot.user) throw H.error('assertuser', 'Sessão sem confirmação.'); }
            catch (_) { status(s, 'Não foi possível confirmar a sessão de usuário. Abra o editor completo com seu rascunho.'); return; }
            s.sentSnapshot = snapshot; s.saveSubmitted = false; saveRecovery(s); lock(s, true); root.clearTimeout(s.previewTimer); s.previewGeneration++; s.previewRequest?.abort?.(); status(s, 'Publicando a versão que você confirmou...', 'publishing');
            try {
                const latest = await read(s,'get',{action:'query',formatversion:2,titles:snapshot.title,prop:'info|revisions',rvprop:'ids|timestamp',rvlimit:1});
                const page = latest.query?.pages?.[0], current = page?.revisions?.[0];
                if (page?.pageid !== snapshot.pageid || H.normalizeTitle(page?.title) !== snapshot.title || page?.missing || page?.redirect ||
                    current?.revid !== snapshot.base || current?.timestamp !== snapshot.timestamp)
                    throw H.error('editconflict','A origem ou a revisão da seção mudou.');
                if (mw.config.get('wgUserName') !== snapshot.user || competingEditor()) throw H.error('assertuser','A sessão de edição mudou.');
                s.saveSubmitted = true;
                // Esta é a única chamada de escrita. Não há repetição automática após falhas de transporte.
                const response = await promise(s.client.postWithToken('csrf', asserted)); guard(s);
                const edit = response?.edit;
                if (response?.error) throw H.error(response.error.code, response.error.info || response.error.code, response.error);
                if (edit?.result !== 'Success') throw H.error(edit?.captcha ? 'captcha' : edit?.code || 'invalid-response', 'A Wikipédia não confirmou a publicação.', edit);
                if (edit.pageid && edit.pageid !== snapshot.pageid || edit.title && H.normalizeTitle(edit.title) !== snapshot.title)
                    throw H.error('invalid-response', 'A resposta não corresponde à página editada.');
                if ('nochange' in edit) saved(s, edit.newrevid || s.base, true);
                else if (Number.isInteger(edit.newrevid) && edit.newrevid > s.base) saved(s, edit.newrevid, false);
                else throw H.error('invalid-response', 'A revisão publicada não foi confirmada.');
            } catch (reason) {
                if (!isActive(s)) return;
                const classification = H.classifyError(reason);
                if (classification.conflict) s.sourceConflict = true;
                if (classification.uncertain && !s.saveSubmitted) { lock(s,false); status(s,'Não foi possível conferir a revisão antes de publicar. Nenhuma edição foi enviada. Seu texto continua no editor.','rejected'); }
                else if (classification.uncertain) { status(s, 'Conferindo o resultado do envio, sem repeti-lo...', 'uncertain'); await reconcile(s, snapshot); }
                else { lock(s, false); status(s, errorText(reason), classification.conflict ? 'conflict' : 'rejected');
                    if (classification.native) s.publishButton.disabled = true; }
            }
        }
        function checkbox(s, label, className) { const wrap = text('label'), input = text('input'); input.type = 'checkbox'; input.className = className; wrap.append(input, doc.createTextNode(' ' + label)); s.options.append(wrap); return input; }
        function createEditor(s) {
            s.textarea = text('textarea', undefined, 'rw26-source'); s.textarea.value = s.original; s.textarea.rows = Math.min(24, Math.max(9, s.original.split('\n').length));
            s.textarea.spellcheck = false; s.textarea.setAttribute('aria-label', 'Código-fonte da seção'); s.textarea.style.cssText = 'display:block;box-sizing:border-box;width:100%;min-height:12em;resize:vertical;font-family:monospace;';
            s.editorSlot.append(s.textarea);
            const summaryLabel = text('label', 'Resumo da edição '); s.summaryInput = text('input', undefined, 'rw26-summary'); s.summaryInput.type = 'text'; s.summaryInput.maxLength = 1000; s.summaryInput.value = s.initialSummary;
            s.summaryInput.style.cssText = 'display:block;box-sizing:border-box;width:100%;'; summaryLabel.append(s.summaryInput); s.box.append(summaryLabel);
            s.options = text('div', undefined, 'rw26-options'); s.options.style.cssText = 'display:flex;gap:1em;flex-wrap:wrap;margin:.7em 0;'; s.box.append(s.options);
            s.minorInput = checkbox(s, 'Edição menor', 'rw26-minor');
            const watchLabel = text('label', 'Vigiar '); s.watchInput = text('select',undefined,'rw26-watch');
            for (const [value,label] of [['preferences','Seguir minhas preferências'],['watch','Vigiar esta página'],['unwatch','Deixar de vigiar'],['nochange','Manter como está']]) { const option=text('option',label); option.value=value; s.watchInput.append(option); }
            s.watchInput.value='preferences'; watchLabel.append(s.watchInput); s.options.append(watchLabel);
            s.liveInput = checkbox(s, 'Prévia enquanto digito', 'rw26-live');
            s.controls = text('div', undefined, 'rw26-controls'); s.controls.style.cssText = 'display:flex;gap:.5em;flex-wrap:wrap;';
            s.previewButton = action('Ver prévia', 'rw26-preview', () => preview(s));
            s.publishButton = action('Publicar alterações', 'mw-ui-progressive rw26-publish', event => publish(s, event));
            s.cancelButton = action('Cancelar', 'rw26-cancel', () => requestClose(s));
            s.nativeButton = action('Abrir na edição completa', 'rw26-native', () => nativeHandoff(s));
            s.controls.append(s.publishButton, s.previewButton, s.nativeButton, s.cancelButton,
                action('Copiar rascunho', 'rw26-copy', () => copy(s)), action('Baixar rascunho', 'rw26-download', () => download(s))); s.box.append(s.controls);
            s.previewLabel = text('p', '', 'rw26-preview-label'); s.previewBody = text('div', undefined, 'rw26-preview-body mw-parser-output'); s.previewBody.hidden = true; s.box.append(s.previewLabel, s.previewBody);
            const changed = () => { if (!isActive(s)) return; if (s.state==='saved' && !matchesSentDraft(s)) { retainAfterSave(s,s.savedLink); return; } if (!['publishing', 'uncertain', 'saved', 'saved-draft'].includes(s.state)) s.state = dirty(s) ? 'ready-dirty' : 'ready-clean';
                s.box.dataset.state = s.state; saveRecovery(s); if (s.lastPreview) s.previewLabel.textContent = 'Pré-visualização anterior. Atualize para conferir o texto atual.';
                root.clearTimeout(s.previewTimer); if (s.liveInput.checked) s.previewTimer = root.setTimeout(() => preview(s), 750); };
            s.textarea.addEventListener('input', changed); s.summaryInput.addEventListener('input', changed);
            s.liveInput.addEventListener('change', () => { root.clearTimeout(s.previewTimer); s.previewRequest?.abort?.(); s.previewGeneration++; if (s.liveInput.checked) preview(s); });
            s.minorInput.addEventListener('change', () => saveRecovery(s)); s.watchInput.addEventListener('change', () => saveRecovery(s));
            const previous = (() => { try { return JSON.parse(root.sessionStorage.getItem(recoveryKey) || 'null'); } catch (_) { return null; } })();
            const recovery = H.validateRecovery(previous, {origin, title: s.title, section: s.section, base: s.base});
            if (recovery) { const restore = action('Recuperar rascunho desta revisão', 'rw26-recover', () => { s.textarea.value = recovery.text; s.summaryInput.value = recovery.summary; s.minorInput.checked = recovery.minor; s.watchInput.value = recovery.watchlist; emitInput(s); restore.remove(); }); s.controls.append(restore); }
            if (typeof mw.confirmCloseWindow === 'function') { closeWindow = mw.confirmCloseWindow({namespace: 'revisawiki-inline', test: () => isActive(s) && dirty(s) && !s.handoff && s.state !== 'saved'}); }
            if (!s.user) { s.publishButton.disabled = true; status(s, 'Rascunho carregado. Para publicar sem uma sessão confirmada, use o editor completo.'); }
            else status(s, 'Seção carregada. Ajustar código modifica apenas este rascunho.', 'ready-clean');
            host.editorChanged?.(); s.textarea.focus();
        }
        async function open(href, anchor) {
            if (disposed) return false;
            if (active) { if (active.textarea) { status(active, 'Há um rascunho aberto. Continue nele ou cancele antes de abrir outra seção.'); active.textarea.focus(); } return false; }
            if (competingEditor()) { mw.notify?.('Outro editor está aberto. Conclua essa edição antes de usar Editar aqui.'); return false; }
            let target; try { target = H.parseEditTarget(href, origin); } catch (reason) { mw.notify?.(reason.message, {type: 'warn'}); return false; }
            const s = {id: ++serial, ...target, anchor, disposed: false, state: 'loading', requests: new Set(), previewGeneration: 0,
                client: new mw.Api({ajax: {timeout: 20000}}), user: mw.config.get('wgUserName') || '', displayTitle: H.normalizeTitle(mw.config.get('wgPageName')),
                displayRevision: Number(mw.config.get('wgRevisionId')), initialSummary: '', handoff: false}; active = s;
            s.box = text('section', undefined, 'rw26-inline'); s.box.setAttribute('role', 'region'); s.box.setAttribute('aria-label', 'RevisaWiki, edição rápida de seção'); s.box.dataset.state = 'loading';
            s.box.style.cssText = 'border:1px solid #a2a9b1;padding:1em;margin:.8em 0;background:var(--background-color-base,#fff);color:var(--color-base,#202122);';
            s.box.append(text('strong', 'Editando ' + s.title)); s.status = text('p', 'Carregando a revisão e a seção...', 'rw26-status'); s.status.setAttribute('role', 'status'); s.status.setAttribute('aria-live', 'polite'); s.box.append(s.status);
            s.editorSlot = text('div', undefined, 'rw26-editor-slot'); s.box.append(s.editorSlot);
            const loadingCancel = action('Cancelar', 'rw26-loading-cancel', () => finish(s)); s.box.append(loadingCancel);
            const heading = anchor?.closest('.mw-heading,h1,h2,h3,h4,h5,h6') || anchor?.closest('.mw-editsection')?.parentElement;
            if (heading?.parentNode && !heading.closest('.rw26-preview-body')) heading.after(s.box); else (doc.querySelector('#mw-content-text') || doc.body).prepend(s.box);
            try {
                const response = await read(s, 'get', {action: 'query', formatversion: 2, titles: s.title, prop: 'info|revisions',
                    rvslots: 'main', rvprop: 'ids|timestamp|content|contentmodel', rvlimit: 1, curtimestamp: 1,
                    intestactions: 'edit', inprop: 'protection|editintro'});
                const pages = response.query?.pages;
                if (!Array.isArray(pages) || pages.length !== 1) throw H.error('page', 'Não foi possível confirmar a página.');
                const page = pages[0], revision = page?.revisions?.[0];
                if (page.missing || page.invalid || page.redirect || H.normalizeTitle(page.title) !== s.title || !Number.isInteger(page.pageid) || !(page.pageid > 0) || !Number.isInteger(page.ns) || !Number.isInteger(revision?.revid) || !(revision.revid > 0) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(revision.timestamp || '') || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(response.curtimestamp || ''))
                    throw H.error('page', 'A página foi movida, removida ou não tem revisão disponível. Abra o editor completo.');
                if (page.contentmodel && page.contentmodel !== 'wikitext') throw H.error('content-model', 'O modelo desta página precisa do editor completo.');
                if (page.actions && page.actions.edit !== true) throw H.error('permission', 'A edição desta página precisa ser conferida no editor completo.');
                if (s.displayTitle === s.title && s.displayRevision && revision.revid !== s.displayRevision)
                    throw H.error('stale-view', 'A página mudou desde que foi aberta. Recarregue a leitura para escolher a seção correta.');
                s.base = revision.revid; s.timestamp = revision.timestamp; s.starttimestamp = response.curtimestamp; s.pageid = page.pageid; s.namespace = page.ns; s.pageSource = H.revisionContent(revision);
                if (s.pageSource.length > 4194304) throw H.error('size', 'Abra o editor completo para esta página.');
                const parsed = await read(s, 'get', {action: 'parse', formatversion: 2, oldid: s.base, prop: 'wikitext|tocdata'});
                const raw = parsed.parse, sections = raw?.tocdata?.sections || raw?.sections;
                if (raw?.wikitext !== s.pageSource || !Array.isArray(sections)) throw H.error('source-mismatch', 'As seções não correspondem à revisão confirmada. Abra o editor completo.');
                s.sections = sections; const range = host.sectionRange(s.pageSource, sections, s.section);
                const section = sections.find(entry => String(entry.index) === s.section);
                if (section?.fromTitle && H.normalizeTitle(section.fromTitle) !== s.title) throw H.error('transclusion', 'A origem desta seção é transcluída. Use a ligação original de edição.');
                s.sectionAnchor = section?.anchor || ''; s.sectionHeading = section?.line ? String(section.line).replace(/<[^>]*>/g, '') : '';
                s.original = s.pageSource.slice(range.start, range.end);
                const template = config().inlineSummaryTemplate;
                s.initialSummary = typeof template === 'string' ? H.renderSummary(template, {section: s.section, sectionname: s.sectionHeading, summary: ''}) : s.sectionHeading ? '/* ' + s.sectionHeading.replace(/\*\//g, '').replace(/[\r\n]/g, ' ') + ' */ ' : '';
                if (typeof template === 'string' && /\$(?!sectionname\b|sectionlink\b|scriptlink\b|section\b|summary\b)[a-z]+/i.test(template)) mw.notify?.('O modelo de resumo contém uma variável desconhecida. Confira o texto do resumo antes de publicar.',{type:'warn'});
                if (page.editintro) { const notice = text('div', undefined, 'rw26-editnotice'); notice.innerHTML = page.editintro; s.box.insertBefore(notice, s.editorSlot); }
                loadingCancel.remove(); createEditor(s); return true;
            } catch (reason) {
                if (!isActive(s)) return false;
                status(s, reason.message || 'Não foi possível abrir a seção. A edição normal continua disponível.', 'load-error');
                loadingCancel.textContent = 'Fechar'; const fallback = text('a', 'Abrir editor completo', 'mw-ui-button rw26-load-native'); fallback.href = s.href; s.box.append(fallback); return false;
            }
        }
        function mount(content) {
            if (active && !active.disposed && !active.box.isConnected && doc.body) { (doc.querySelector('#mw-content-text') || doc.body).prepend(active.box); status(active,'A página foi atualizada. Seu rascunho da revisão de origem foi preservado.'); }
            if (disposed || mw.config.get('wgAction') !== 'view' || config().inlineEditing === false || mw.config.get('wgPageContentModel') !== 'wikitext') return;
            const currentURL = new URL(root.location.href);
            if (currentURL.searchParams.has('diff') || mw.config.get('wgDiffNewId') || Number(mw.config.get('wgRevisionId')) && Number(mw.config.get('wgCurRevisionId')) && Number(mw.config.get('wgRevisionId')) !== Number(mw.config.get('wgCurRevisionId'))) return;
            const container = content?.jquery ? content[0] : content?.nodeType ? content : doc;
            if (container === doc && !doc.querySelector('.rw26-lead-launch')) {
                const first = doc.getElementById('firstHeading'), native = doc.querySelector('#ca-edit a[href]');
                if (first && native) {
                    const lead = new URL(native.href,origin); lead.searchParams.set('section','0');
                    try { H.parseEditTarget(lead.href,origin); const launch = action('Editar introdução aqui','rw26-launch rw26-lead-launch',()=>open(lead.href,first)); launch.style.cssText='font-size:.6em;margin-inline-start:.6em;'; first.append(launch); } catch (_) { /* A edição normal permanece disponível. */ }
                }
            }
            for (const native of container.querySelectorAll('.mw-editsection a[href]')) {
                if (native.closest('.rw26-inline,.rw26-preview-body') || native.dataset.rw26Mounted || native.classList.contains('mw-editsection-visualeditor')) continue;
                let target; try { target = H.parseEditTarget(native.href, origin); } catch (_) { continue; }
                native.dataset.rw26Mounted = '1'; const launch = action('Editar aqui', 'rw26-launch', () => open(target.href, native));
                launch.style.cssText = 'font-size:inherit;padding:.1em .45em;min-height:0;line-height:1.4;margin-inline-start:.4em;'; launch.title = 'Editar esta seção com RevisaWiki, sem sair da leitura.'; native.after(launch);
            }
        }
        function adapter() {
            const s = active; if (!s?.textarea || s.disposed || competingEditor() || ['saved', 'saved-draft', 'publishing', 'uncertain'].includes(s.state)) return null;
            return {id: s.textarea, read: () => s.textarea.value, locate(start, end) { s.textarea.focus(); s.textarea.setSelectionRange(start, end); },
                write(value) { guard(s); if (['publishing', 'uncertain'].includes(s.state)) throw H.error('busy', 'A publicação ainda precisa ser confirmada.');
                    const start = s.textarea.selectionStart, end = s.textarea.selectionEnd; s.textarea.value = value; s.textarea.setSelectionRange(Math.min(start, value.length), Math.min(end, value.length)); emitInput(s); }};
        }
        function summaryAdapter() { const s = active; return s?.summaryInput && !s.disposed && !['saved','saved-draft'].includes(s.state) ? {id: s.summaryInput, read: () => s.summaryInput.value,
            snapshot: () => s.summaryInput.value, write(value) { s.summaryInput.value = value; s.summaryInput.dispatchEvent(new root.Event('input', {bubbles: true})); }, restore(value) { this.write(value); }} : null; }
        function context() { const s = active; return s?.textarea && !s.disposed && !competingEditor() && !['saved','saved-draft'].includes(s.state) ? {title: s.title, namespace: s.namespace, base: s.base, section: s.section, state: s.state, pageSource: s.pageSource, sections: s.sections, editorSlot: s.editorSlot, minor: s.minorInput, sessionId: s.id} : null; }
        function draftContext(session, source) { const s = active; if (!s || session.adapter?.id !== s.textarea || session.title !== s.title || session.base !== s.base || session.section !== s.section) throw H.error('session', 'A seção aberta mudou.'); return sourceContext(s, source); }
        function restoreNativeDraft() {
            if (!['edit', 'submit'].includes(mw.config.get('wgAction'))) return false;
            const textarea = doc.getElementById('wpTextbox1'); if (!textarea || textarea.dataset.rw26RecoveryOffered) return false;
            const revision = Number(doc.getElementById('wpBaseRevId')?.value || doc.getElementById('editRevId')?.value || mw.config.get('wgRevisionId'));
            const section = doc.getElementById('wpSection')?.value || new URL(root.location.href).searchParams.get('section');
            let value; try { value = JSON.parse(root.sessionStorage.getItem(recoveryKey) || 'null'); } catch (_) { return false; }
            const recoveryContext={origin,title:mw.config.get('wgPageName'),section,base:revision};
            const draft = H.validateRecovery(value,recoveryContext); if (!draft) return false;
            const originalNative = root.jQuery?.fn.textSelection ? root.jQuery(textarea).textSelection('getContents') : textarea.value;
            textarea.dataset.rw26RecoveryOffered = '1'; const box = text('div', undefined, 'rw26-recovery'); box.append(text('p', 'Há um rascunho da edição rápida para esta seção e revisão.'));
            box.append(action('Recuperar rascunho', 'rw26-native-recover', () => { const currentNative=root.jQuery?.fn.textSelection?root.jQuery(textarea).textSelection('getContents'):textarea.value; if(currentNative!==originalNative && currentNative!==draft.text && !root.confirm('Substituir o texto que você já alterou neste editor pelo rascunho guardado?'))return; if (root.jQuery?.fn.textSelection) root.jQuery(textarea).textSelection('setContents', draft.text); else textarea.value = draft.text;
                textarea.dispatchEvent(new root.Event('input', {bubbles: true})); const summary = doc.getElementById('wpSummary'); if (summary) { summary.value = draft.summary; summary.dispatchEvent(new root.Event('input', {bubbles: true})); }
                const minor = doc.getElementById('wpMinoredit'); if (minor) minor.checked = draft.minor; const watch = doc.getElementById('wpWatchthis'); if (watch && ['watch','unwatch'].includes(draft.watchlist)) watch.checked = draft.watchlist === 'watch';
                clearRecovery(recoveryContext); box.remove(); }), action('Descartar rascunho guardado', 'rw26-native-discard', () => { clearRecovery(recoveryContext); box.remove(); }));
            textarea.parentNode.insertBefore(box, textarea); return true;
        }
        return Object.freeze({mount, open, adapter, summaryAdapter, context, draftContext, restoreNativeDraft,
            dispose() { if (active && ['publishing', 'uncertain'].includes(active.state)) { status(active,'A publicação ainda precisa ser confirmada. O rascunho continua disponível.'); return false; } if (active) { saveRecovery(active); finish(active); } disposed = true; return true; },
            state() { return active ? {state: active.state, title: active.title, section: active.section, base: active.base, dirty: dirty(active), savedRevision: active.savedRevision || null} : {state: 'closed'}; }});
    }
