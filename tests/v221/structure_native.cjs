'use strict';
// Read-only local native-parser and browser qualification. Evidence stays outside the repository.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const evidenceAt = process.argv.indexOf('--evidence');
assert.ok(evidenceAt > 0 && process.argv[evidenceAt + 1], '--evidence directory required');
const evidence = path.resolve(process.argv[evidenceAt + 1]);
const playwright = require(process.env.REVISAWIKI_PLAYWRIGHT || 'playwright');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
(async () => {
  const native = fs.readFileSync(path.join(evidence, 'native_structure_response_PRIVATE.html'), 'utf8');
  const table = '{| class="wikitable" style="width:100%;min-width:900px;table-layout:fixed;font-size:90%;text-align:center;border-collapse:collapse;"\n! Coluna\n|-\n| Dado\n|}\n';
  const source = '<div id="responsive-before">\n' + table + '</div>\n' +
    '<div id="responsive-after">\n<div style="max-width:100%;min-width:0;overflow-x:auto;">\n' + table + '</div>\n</div>';
  const url = new URL(process.env.REVISAWIKI_NATIVE_API || 'http://127.0.0.1:8890/pt/api.php');
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'local native farm only');
  for (const [key, value] of Object.entries({action: 'parse', title: 'Teste estrutural local', text: source,
    contentmodel: 'wikitext', prop: 'text|parsewarnings', format: 'json', formatversion: '2', disableeditsection: '1'}))
    url.searchParams.set(key, value);
  const response = await fetch(url);
  assert.equal(response.status, 200);
  const raw = await response.text(), data = JSON.parse(raw);
  assert.equal(data.error, undefined);
  assert.deepEqual(data.parse.parsewarnings || [], []);
  const html = data.parse.text;
  fs.writeFileSync(path.join(evidence, 'native_responsive_probe.wiki'), source);
  fs.writeFileSync(path.join(evidence, 'native_responsive_response_PRIVATE.json'), raw);
  fs.writeFileSync(path.join(evidence, 'native_responsive_response_PRIVATE.html'), html);
  const browser = await playwright.chromium.launch({headless: true,
    executablePath: process.env.REVISAWIKI_CHROME || undefined});
  const assertions = [], checks = [];
  try {
    const page = await browser.newPage({viewport: {width: 1200, height: 800}});
    await page.route('**/*', route => route.abort());
    await page.setContent('<style>body{font:16px/1.5 sans-serif}small{font-size:85%}</style>' + native);
    const paired = await page.evaluate(() => {
      const galleries = [...document.querySelectorAll('ul.gallery')];
      const normalized = el => el.innerHTML.replace(/\s+/g, ' ').trim();
      const first = document.querySelector('#small-before'), second = document.querySelector('#small-after');
      const gap = id => [...document.querySelector(id).children].filter(el => el.tagName === 'P');
      const refs = id => [...document.querySelectorAll(id + ' sup.reference a')].map(el => el.hash);
      return {galleryEqual: normalized(galleries[0]) === normalized(galleries[1]),
        galleryBefore: galleries[0].textContent, galleryAfter: galleries[1].textContent,
        smallTextBefore: first.textContent.replace(/\s+/g, ' '), smallTextAfter: second.textContent.replace(/\s+/g, ' '),
        smallHeightBefore: first.getBoundingClientRect().height, smallHeightAfter: second.getBoundingClientRect().height,
        gapBeforeParagraphs: gap('#gap-before').length, gapAfterParagraphs: gap('#gap-after').length,
        gapAfterEmpty: gap('#gap-after').some(p => !p.textContent.trim()),
        refBefore: refs('#ref-before'), refAfter: refs('#ref-after'),
        scopeValues: [...document.querySelectorAll('table.wikitable th')].map(th => th.getAttribute('scope'))};
    });
    assert.equal(paired.galleryEqual, true); assertions.push('native gallery HTML identical with later captions');
    assert.equal(paired.smallTextBefore, paired.smallTextAfter);
    assert.equal(paired.smallHeightBefore, paired.smallHeightAfter); assertions.push('empty inline small preserves visible text and height');
    assert.equal(paired.gapAfterParagraphs, 2); assert.equal(paired.gapAfterEmpty, false);
    assert.ok(paired.gapBeforeParagraphs > paired.gapAfterParagraphs); assertions.push('comment gap becomes two complete nonempty paragraphs');
    assert.equal(paired.refBefore.length, 2); assert.equal(paired.refAfter.length, 2);
    assert.equal(new Set(paired.refBefore).size, 1); assert.equal(new Set(paired.refAfter).size, 1);
    assertions.push('finite ref slash repair preserves two reuses linked to one definition');
    assert.deepEqual(paired.scopeValues, ['column', 'col']); assertions.push('native header scope literal enum correction confirmed');
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({width, height: 800});
      for (const phase of ['before', 'after']) {
        await page.setContent('<style>body{margin:8px;font:16px/1.5 sans-serif}</style>' + html);
        await page.locator('#responsive-' + (phase === 'before' ? 'after' : 'before')).evaluate(el => el.remove());
        const measured = await page.evaluate(phase => {
          const owner = document.querySelector('#responsive-' + phase), table = owner.querySelector('table'),
            wrapper = phase === 'after' ? table.parentElement : null;
          return {viewport: innerWidth, documentScrollWidth: document.documentElement.scrollWidth,
            tableWidth: table.getBoundingClientRect().width, ownerWidth: owner.getBoundingClientRect().width,
            wrapperWidth: wrapper?.getBoundingClientRect().width || null, wrapperScrollWidth: wrapper?.scrollWidth || null,
            cells: [...table.querySelectorAll('th,td')].map(el => el.textContent.trim()),
            tableStyle: table.getAttribute('style')};
        }, phase);
        assert.deepEqual(measured.cells, ['Coluna', 'Dado']);
        if (phase === 'after') {
          assert.ok(measured.documentScrollWidth <= width, JSON.stringify(measured));
          assert.ok(measured.wrapperWidth <= width - 16);
          assert.ok(measured.tableWidth >= 900);
        } else if (width < 900) assert.ok(measured.documentScrollWidth > width);
        checks.push({phase, width, ...measured});
      }
    }
    await page.close();
    fs.writeFileSync(path.join(evidence, 'NATIVE_BROWSER_STRUCTURE_QUALIFICATION_PRIVATE.json'), JSON.stringify({
      kind: 'local-native-structure-qualification', status: 'passed', browser: browser.version(),
      sourceSha256: hash(source), responseSha256: hash(raw), priorNativeHtmlSha256: hash(native),
      assertions, checks, accountUsed: false, wikipediaWrites: 0, publicRequests: 0,
      limitation: 'Gallery asset is absent from the local farm; identical generated gallery markup and captions were verified. Live file existence is not inferred.',
      environmentSha256: hash(fs.readFileSync(path.join(evidence, 'native_environment_PRIVATE.json')))
    }, null, 2) + '\n');
    console.log(JSON.stringify({status: 'passed', nativeAssertions: assertions.length, viewportMeasurements: checks.length}));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
