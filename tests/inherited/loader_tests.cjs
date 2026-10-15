const qa = require('./harness.cjs');
'use strict';
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(qa.output('Carregador_common_js_RevisaWiki','js'), 'utf8');
(async function () {
  const tests = [];
  for (const mode of ['success', 'missing', 'outdated', 'incomplete', 'logged-out', 'duplicate']) {
    const urls = [], notices = [], ctx = {};
    ctx.window = ctx;ctx.document={getElementById:()=>null};const hooks={};
    ctx.mw = {config: {get: key => key === 'wgUserName' ? mode === 'logged-out' ? null : 'Nome da Conta' : key === 'wgAction' ? 'edit' : undefined},
      loader: {getScript: url => {urls.push(url); if (mode === 'missing') return Promise.reject(new Error('404'));
        if (mode !== 'incomplete') ctx.RevisaWiki = {version: mode === 'outdated' ? '0.0.0' : qa.expectedVersion};
        return Promise.resolve();}}, hook:name=>({add:fn=>(hooks[name] ||= []).push(fn)}),notify: (text, config) => notices.push({text, config})};
    vm.runInNewContext(source, ctx);
    if (mode === 'duplicate') vm.runInNewContext(source, ctx);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(urls.length, mode === 'logged-out' ? 0 : 1);
    if (urls.length) {
      const url = new URL(urls[0], 'https://pt.wikipedia.org');
      assert.equal(url.searchParams.get('title'), 'User:Nome da Conta/RevisaWiki.js');
      assert.equal(url.searchParams.get('v'), qa.expectedVersion);
    }
    if (mode === 'success' || mode === 'logged-out') assert.equal(notices.length, 0);
    else assert.equal(notices.length, 1);
    const expectedState = {success: 'loaded', missing: 'error', outdated: 'loaded', incomplete: 'missing-api', 'logged-out': 'logged-out', duplicate: 'loaded'}[mode];
    assert.equal(ctx.RevisaWikiLoadInfo.state, expectedState);
    if (mode === 'duplicate') {assert.equal(ctx.RevisaWikiLoadInfo.requests, 1);assert.equal(ctx.RevisaWikiLoaderRegistered.version,qa.expectedVersion);}
    tests.push({test: mode, passed: true});
  }
  fs.writeFileSync(path.join(__dirname, 'loader_test_results.json'), JSON.stringify({tests}, null, 2));
  console.log(JSON.stringify({tests}));
})().catch(e => {console.error(e.stack); process.exitCode = 1;});
