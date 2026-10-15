// Carregador de RevisaWiki 2.3.0 para o common.js, ao abrir o editor.
(function () {
    'use strict';
    const expectedVersion = '2.3.0';
    if (window.RevisaWikiLoaderRegistered) {
        mw.notify('Há mais de um carregador de RevisaWiki no common.js. Mantenha uma única chamada e recarregue a página.', {type:'warn',autoHide:false});
        return;
    }
    window.RevisaWikiLoaderRegistered = {version:expectedVersion};
    let started = false;
    function loadRevisaWiki() {
        if (started) return;
        started = true;
        const previous = window.RevisaWikiLoadInfo || window.AjusteGeralPTLoadInfo;
        if (previous) {
            previous.requests = (previous.requests || 1) + 1;
            mw.notify('Há mais de um carregador de RevisaWiki no common.js. Mantenha uma única chamada e recarregue a página.', {type:'warn',autoHide:false});
            return;
        }
        window.RevisaWikiLoadInfo = {expectedVersion,requests:1,state:'loading'};
        window.AjusteGeralPTLoadInfo = window.RevisaWikiLoadInfo;
        const user = mw.config.get('wgUserName');
        if (!user) { window.RevisaWikiLoadInfo.state = 'logged-out'; return; }
        window.RevisaWikiConfig = Object.assign({dataPage:'User:' + user + '/RevisaWiki/Dados.js'},window.RevisaWikiConfig || {});
        mw.loader.getScript('/w/index.php?title=' + encodeURIComponent('User:' + user + '/RevisaWiki.js') +
            '&action=raw&ctype=text/javascript&v=' + expectedVersion).then(async function () {
            if (window.RevisaWikiModulePromise) await window.RevisaWikiModulePromise;
            const script = window.RevisaWiki;
            window.RevisaWikiLoadInfo.state = script ? 'loaded' : window.RevisaWikiModuleError ? 'data-error' : window.RevisaWikiModuleReady ? 'waiting-editor' : 'missing-api';
            if (!script && !window.RevisaWikiModuleReady) mw.notify('O arquivo foi recebido, mas RevisaWiki não iniciou. Confira se colou o código completo e consulte o console do navegador.', {type:'error',autoHide:false});
            else if (script && script.version !== expectedVersion) mw.notify('RevisaWiki carregou a versão ' + script.version +
                ', mas o carregador pede ' + expectedVersion + '. Atualize os arquivos do script e recarregue a página.', {type:'warn',autoHide:false});
        }).catch(function () {
            window.RevisaWikiLoadInfo.state = 'error';
            mw.notify('Não foi possível carregar RevisaWiki.js. Confira se o arquivo inteiro está salvo na sua página pessoal e recarregue a página.', {type:'error',autoHide:false});
        });
    }
    if (['edit','submit'].includes(mw.config.get('wgAction')) || document.getElementById('wpTextbox1')) loadRevisaWiki();
    mw.hook('ve.activationComplete').add(loadRevisaWiki);
    mw.hook('ve.wikitextInteractive').add(loadRevisaWiki);
    mw.hook('wikipage.content').add(function () {
        if (document.getElementById('wpTextbox1')) loadRevisaWiki();
    });
}());
