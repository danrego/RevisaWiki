// RevisaWiki: chamada fixa para a distribuição compartilhada.
(function () {
    'use strict';
    if (window.RevisaWikiBootstrapRegistered) return;
    window.RevisaWikiBootstrapRegistered = true;
    var page = 'User:Daniel G Rego/RevisaWiki/Beta/Carregador.js';
    var url = '/w/index.php?title=' + encodeURIComponent(page) +
        '&action=raw&ctype=text/javascript&rw=' + Math.floor(Date.now() / 300000);
    mw.loader.getScript(url).then(function () {}, function () {
        if (typeof mw.notify === 'function') {
            mw.notify('Não foi possível abrir o carregador central do RevisaWiki. Confira a instalação e recarregue a página.', {type:'warn'});
        }
    });
}());
