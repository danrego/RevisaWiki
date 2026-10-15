(function RevisaWikiModuleStart(root) {
    'use strict';
    const VERSION = '2.3.0', EXPECTED_HASH = '1daf86b796e70e117891abef91e3447ea8c0b211cc03b9966d39920f3f0d4323';
    const CACHE_KEY = 'RevisaWiki.catalogs.2.3.0', MAX_BYTES = 1900000;
    function canonical(value) {
        if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
        if (value && typeof value === 'object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
        return JSON.stringify(value);
    }
    function validShape(data) {
        return data && data.version === VERSION && data.schema === 1 && data.packed?.ptwiki &&
            Array.isArray(data.packed.translations?.records) && Array.isArray(data.packed.spelling?.rows);
    }
    async function verified(data) {
        if (!validShape(data) || !root.crypto?.subtle || !root.TextEncoder) return false;
        const raw = canonical(data.packed);
        if (new root.TextEncoder().encode(raw).length > MAX_BYTES) return false;
        const bytes = await root.crypto.subtle.digest('SHA-256',new root.TextEncoder().encode(raw));
        return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('') === EXPECTED_HASH;
    }
    function start(data, origin) {
        root.RevisaWikiDataV2 = data;
        __CORE_BOOT__
        if (root.RevisaWiki) root.RevisaWiki.catalogLoad = {version:VERSION,origin,sha256:EXPECTED_HASH};
        if (root.RevisaWikiLoadInfo) root.RevisaWikiLoadInfo.state = 'loaded';
    }
    if (typeof module === 'object' && module.exports) {
        const data = require('./RevisaWiki_v2_3_dados.js');
        const hash = require('node:crypto').createHash('sha256').update(canonical(data.packed)).digest('hex');
        if (!validShape(data) || hash !== EXPECTED_HASH) throw new Error('Pacote de dados incompatível com RevisaWiki '+VERSION+'.');
        start(data,'local'); return;
    }
    if (!root.mw?.loader || (root.location?.hostname || root.mw.config?.get('wgServerName')) !== 'pt.wikipedia.org') return;
    root.RevisaWikiModuleReady = true;
    async function load() {
        if (root.RevisaWiki || root.RevisaWikiModuleLoading) return;
        root.RevisaWikiModuleLoading = true;
        try {
            let data = root.RevisaWikiDataV2, origin = 'preloaded';
            if (!await verified(data)) {
                data = null;
                try {
                    const cached = root.localStorage.getItem(CACHE_KEY);
                    if (cached && cached.length <= MAX_BYTES) {
                        const candidate = JSON.parse(cached);
                        if (await verified(candidate)) { data = candidate; origin = 'cache'; }
                    }
                } catch (_) { /* A página continua funcionando sem armazenamento local. */ }
            }
            if (!data) {
                const config = root.RevisaWikiConfig || {}, title = config.dataPage || 'Usuário:Daniel G Rego/RevisaWiki/Dados.js';
                const revision = Number.isInteger(config.dataRevision) && config.dataRevision > 0 ? '&oldid='+config.dataRevision : '';
                await root.mw.loader.getScript('/w/index.php?title='+encodeURIComponent(title)+revision+'&action=raw&ctype=text/javascript');
                const candidate = root.RevisaWikiDataV2;
                if (!await verified(candidate)) throw new Error('O pacote de dados não corresponde à versão '+VERSION+'.');
                data = candidate; origin = 'wiki';
                try {
                    const cached = JSON.stringify(data);
                    if (cached.length <= MAX_BYTES) root.localStorage.setItem(CACHE_KEY,cached);
                } catch (_) { /* O catálogo validado também pode ser usado só nesta aba. */ }
            }
            start(data,origin);
        } catch(error) {
            root.RevisaWikiModuleError = error.message;
            root.mw.notify('RevisaWiki não carregou: '+error.message+' Confira se o núcleo e Dados.js são da versão '+VERSION+'.',
                {type:'error',autoHide:false});
        } finally { root.RevisaWikiModuleLoading = false; }
    }
    const action = root.mw.config?.get('wgAction');
    if (['edit','submit'].includes(action) || root.document?.getElementById('wpTextbox1')) root.RevisaWikiModulePromise=load();
    // The kernel mounts only in source mode and observes later mode switches.
    // Loading it on editor activation also covers visual -> source transitions.
    root.mw.hook('ve.activationComplete').add(()=>{root.RevisaWikiModulePromise=load();});
    root.mw.hook('ve.wikitextInteractive').add(()=>{root.RevisaWikiModulePromise=load();});
    root.mw.hook('wikipage.content').add(()=>{
        if(root.document?.getElementById('wpTextbox1'))root.RevisaWikiModulePromise=load();
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
