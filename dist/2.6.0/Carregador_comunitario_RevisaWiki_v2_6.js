// Carregador de RevisaWiki 2.6.0 para o common.js, com edição em código-fonte e edição rápida.
(function () {
    'use strict';
    const expectedVersion = '2.6.0';
    if (window.RevisaWikiLoaderRegistered) {
        mw.notify('Há mais de um carregador de RevisaWiki no common.js. Mantenha uma única chamada e recarregue a página.', {type:'warn',autoHide:false});
        return;
    }
    window.RevisaWikiLoaderRegistered = {version:expectedVersion};
    let started = false, loadingPromise = null, ownedLoadInfo = null;
    function loadRevisaWiki() {
        if (started) return loadingPromise;
        const previous = window.RevisaWikiLoadInfo || window.AjusteGeralPTLoadInfo;
        if (previous && previous!==ownedLoadInfo) {
            previous.requests = (previous.requests || 1) + 1;
            mw.notify('Há mais de um carregador de RevisaWiki no common.js. Mantenha uma única chamada e recarregue a página.', {type:'warn',autoHide:false});
            return;
        }
        started = true;
        const inlineLoadAttempt = window.RevisaWikiInlinePending || null;
        const loadInfo = {expectedVersion,requests:1,state:'loading'};
        ownedLoadInfo = loadInfo;
        window.RevisaWikiLoadInfo = loadInfo;
        window.AjusteGeralPTLoadInfo = window.RevisaWikiLoadInfo;
        const user = mw.config.get('wgUserName');
        if (!user) { loadInfo.state = 'logged-out'; started=false; window.RevisaWikiInlineLoadFailed?.(inlineLoadAttempt,'Entre na sua conta ou use a edição normal.'); return; }
        window.RevisaWikiConfig = Object.assign({dataPage:'User:Daniel G Rego/RevisaWiki/Dados.js'},window.RevisaWikiConfig || {});
        loadingPromise = (window.RevisaWikiModuleReady && typeof window.RevisaWikiLoadInline==='function' ? Promise.resolve().then(()=>{window.RevisaWikiModulePromise=window.RevisaWikiLoadInline();return window.RevisaWikiModulePromise;}) : mw.loader.getScript('/w/index.php?title=' + encodeURIComponent('User:Daniel G Rego/RevisaWiki.js') +
            '&action=raw&ctype=text/javascript&v=' + expectedVersion)).then(async function () {
            if (window.RevisaWikiModulePromise) await window.RevisaWikiModulePromise;
            if(ownedLoadInfo!==loadInfo)return;
            const script = window.RevisaWiki;
            loadInfo.state = script ? 'loaded' : window.RevisaWikiModuleError ? 'data-error' : window.RevisaWikiModuleReady ? 'waiting-editor' : 'missing-api';
            if (!script && (window.RevisaWikiModuleError || !window.RevisaWikiModuleReady)) {started=false;window.RevisaWikiInlineLoadFailed?.(inlineLoadAttempt);}
            if (!script && !window.RevisaWikiModuleReady) mw.notify('O arquivo foi recebido, mas RevisaWiki não iniciou. Confira se colou o código completo e consulte o console do navegador.', {type:'error',autoHide:false});
            else if (script && script.version !== expectedVersion) mw.notify('RevisaWiki carregou a versão ' + script.version +
                ', mas o carregador pede ' + expectedVersion + '. Atualize os arquivos do script e recarregue a página.', {type:'warn',autoHide:false});
        }).catch(function () {
            if(ownedLoadInfo!==loadInfo)return;
            started=false; loadInfo.state = 'error';
            window.RevisaWikiInlineLoadFailed?.(inlineLoadAttempt);
            mw.notify('Não foi possível carregar RevisaWiki.js. Confira se o arquivo inteiro está salvo na sua página pessoal e recarregue a página.', {type:'error',autoHide:false});
        });
        return loadingPromise;
    }
    // Instala apenas os controles de leitura. O catálogo e o núcleo aguardam o clique.
    function v26InstallReadLauncher(root, mw, load) {
        if (root.RevisaWikiInlineLauncherRegistered) return;
        root.RevisaWikiInlineLauncherRegistered = true;
        const doc = root.document, origin = root.location.origin;
        function valid(href) {
            try {
                const url = new URL(href,origin), section = url.searchParams.get('section');
                return url.origin===origin && !url.username && !url.password && new Set(url.searchParams.keys()).size===[...url.searchParams.keys()].length && /\/w\/index\.php$/.test(url.pathname) && url.searchParams.get('action')==='edit' &&
                    !!url.searchParams.get('title') && /^\d+$/.test(section||'') && ![...url.searchParams.keys()].some(k=>!['title','action','section','veswitched','uselang'].includes(k));
            } catch (_) { return false; }
        }
        function settle(pending,failed,message) {
            if (!pending || root.RevisaWikiInlinePending!==pending) return false;
            root.clearTimeout(pending.timer); root.RevisaWikiInlinePending=null;
            pending.button.disabled=false; pending.button.textContent=pending.label;
            if(failed)mw.notify?.(message||'Não foi possível carregar a edição rápida. Você pode tentar novamente ou usar a edição normal.',{type:'warn'});
            return true;
        }
        root.RevisaWikiInlineLoadFailed=(pending,message)=>settle(pending,true,message);
        root.RevisaWikiInlineLoadSettled=pending=>settle(pending,false);
        function launch(href, native, button) {
            if (root.RevisaWiki?.inlineEditing) { root.RevisaWiki.inlineEditing.open(href,native); return; }
            if (root.RevisaWiki?.uiStatus==='error') { mw.notify?.('A interface não ficou disponível. Recarregue a página ou use a edição normal.',{type:'warn'}); return; }
            if (root.RevisaWikiInlinePending) { mw.notify?.('A edição rápida já está carregando. Aguarde ou use a ligação de edição normal.'); return; }
            const pending = {href,anchor:native,button,label:button.textContent}; root.RevisaWikiInlinePending = pending; button.disabled=true; button.textContent='Carregando...';
            pending.timer=root.setTimeout(()=>settle(pending,true,'A edição rápida ainda não ficou disponível. Você pode tentar novamente ou usar a edição normal.'),30000);
            function watch(request) {
                if(!request || typeof request.then!=='function')return;
                Promise.resolve(request).then(()=>{
                    if(!root.RevisaWiki && (root.RevisaWikiModuleError || ['error','data-error','missing-api','logged-out'].includes(root.RevisaWikiLoadInfo?.state)))settle(pending,true);
                    else if(root.RevisaWiki?.uiStatus==='error')settle(pending,true,'A interface não ficou disponível. Recarregue a página ou use a edição normal.');
                },()=>settle(pending,true));
            }
            try {
                watch(load());
                if (root.RevisaWikiInlinePending===pending && typeof root.RevisaWikiLoadInline === 'function') { root.RevisaWikiModulePromise=root.RevisaWikiLoadInline(); watch(root.RevisaWikiModulePromise); }
            } catch (_) { settle(pending,true); }
        }
        function add(native,href,label,lead) {
            const button=doc.createElement('button'); button.type='button'; button.className='rw26-launch rw26-lazy-launch'+(lead?' rw26-lead-launch':'');
            button.textContent=label; button.style.cssText='font-size:inherit;padding:.1em .45em;min-height:0;line-height:1.4;margin-inline-start:.4em;';
            button.addEventListener('click',()=>launch(href,native,button));
            if(lead)native.append(button);else native.after(button);
        }
        function mount(content) {
            if (root.RevisaWiki?.inlineEditing || mw.config.get('wgAction')!=='view' || mw.config.get('wgPageContentModel')!=='wikitext' || root.RevisaWikiConfig?.inlineEditing===false || root.location.hostname!=='pt.wikipedia.org') return;
            const url=new URL(root.location.href);
            if (url.searchParams.has('diff') || mw.config.get('wgDiffNewId') || Number(mw.config.get('wgRevisionId')) && Number(mw.config.get('wgCurRevisionId')) && Number(mw.config.get('wgRevisionId'))!==Number(mw.config.get('wgCurRevisionId'))) return;
            const container=content?.jquery?content[0]:content?.nodeType?content:doc;
            for(const native of container.querySelectorAll('.mw-editsection a[href]')) {
                if(native.closest('.rw26-inline,.rw26-preview-body') || native.classList.contains('mw-editsection-visualeditor') || native.dataset.rw26Lazy || !valid(native.href))continue;
                native.dataset.rw26Lazy='1'; add(native,native.href,'Editar aqui',false);
            }
            const heading=doc.getElementById('firstHeading'), native=doc.querySelector('#ca-edit a[href]');
            if(heading&&native&&!doc.querySelector('.rw26-lead-launch')){const lead=new URL(native.href,origin);lead.searchParams.set('section','0');if(valid(lead.href))add(heading,lead.href,'Editar introdução aqui',true);}
        }
        mw.hook('wikipage.content').add(mount);
        if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>mount(doc),{once:true});else mount(doc);
    }

    v26InstallReadLauncher(window,mw,loadRevisaWiki);
    if (['edit','submit'].includes(mw.config.get('wgAction')) || document.getElementById('wpTextbox1')) loadRevisaWiki();
    mw.hook('ve.activationComplete').add(loadRevisaWiki);
    mw.hook('ve.wikitextInteractive').add(loadRevisaWiki);
    mw.hook('wikipage.content').add(function () {
        if (document.getElementById('wpTextbox1')) loadRevisaWiki();
    });
}());
