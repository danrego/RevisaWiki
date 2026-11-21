'use strict';
// Read-only DOM verification of already captured native MediaWiki parse output.
// Usage: node native_documentation_browser.cjs <native-directory> <private-receipt>
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
assert(process.argv[2] && process.argv[3], 'Pass native capture directory and a new private receipt path');
const directory = path.resolve(process.argv[2]);
const receipt = path.resolve(process.argv[3]);
assert(!fs.existsSync(receipt), 'An earlier browser receipt cannot be overwritten');
assert(!receipt.startsWith(root + path.sep), 'Keep machine-local browser evidence outside the publication tree');
const sha = raw => crypto.createHash('sha256').update(raw).digest('hex');
const read = name => fs.readFileSync(path.join(directory, name));
const raw = {
    expected: read('EXPECTED_CODE_BODIES.private.json'),
    parseReceipt: read('NATIVE_PARSE.private.json'),
    manualHTML: read('manual.html.private.html'),
    controlHTML: read('pre-control.html.private.html'),
    manualRequest: read('manual.request.private.json'),
    controlRequest: read('pre-control.request.private.json'),
    manualResponse: read('manual.response.private.json'),
    controlResponse: read('pre-control.response.private.json'),
    source: fs.readFileSync(path.join(root, 'docs/2.22.1/Documentacao_RevisaWiki_v2_22_1.wiki')),
};
const expected = JSON.parse(raw.expected), native = JSON.parse(raw.parseReceipt);
const sourceText = raw.source.toString('utf8');
assert.equal(native.version, '2.22.1');
assert.equal(native.status, 'passed-native-awaiting-browser');
assert.equal(sha(raw.source), native.sourceSha256, 'The saved manual is the exact native-parsed source');
assert.equal(raw.source.length, native.sourceBytes);
assert.equal(JSON.parse(raw.manualRequest).text, sourceText, 'The native request contains the exact saved manual');
assert.equal(expected.manual.length, 446, 'The complete current manual has 446 code bodies');
for (const [label, response, html] of [
    ['manual', raw.manualResponse, raw.manualHTML],
    ['pre-control', raw.controlResponse, raw.controlHTML],
]) {
    const evidence = native.requests.find(item => item.label === label);
    assert(evidence, 'Native parse request evidence exists: ' + label);
    assert.equal(sha(response), evidence.response.sha256, 'The parse response remains frozen: ' + label);
    const parsed = JSON.parse(response);
    const body = typeof parsed.parse.text === 'string' ? parsed.parse.text : parsed.parse.text['*'];
    assert.equal(html.toString('utf8'), body, 'The served fragment is the exact captured native HTML: ' + label);
}
const driverPath = path.join(root, 'tests/v261/browser/native_driver.cjs');
const { NativeChrome } = require(driverPath);
const driver = new NativeChrome();
const report = {
    kind: 'v2221-native-documentation-code-body-browser', version: '2.22.1',
    status: 'running', checkedUtc: new Date().toISOString(),
    sourceSha256: sha(raw.source), sourceBytes: raw.source.length,
    manualHTMLSha256: sha(raw.manualHTML), controlHTMLSha256: sha(raw.controlHTML),
    expectedBodiesSha256: sha(raw.expected), nativeParseReceiptSha256: sha(raw.parseReceipt),
    manualResponseSha256: sha(raw.manualResponse), controlResponseSha256: sha(raw.controlResponse),
    harnessSha256: sha(fs.readFileSync(__filename)), driverSha256: sha(fs.readFileSync(driverPath)),
    expectedBodies: expected.manual.length, observedBodies: null, exactBodies: 0,
    trailingNativeNewlineAdjustments: 0, leadingNewlineAdjustments: 0,
    controls: [], mismatches: [], failures: [], requests: [],
    screenshots: 0, externalRequests: 0, networkMutations: 0, wikipediaWrites: 0,
    scope: 'Installed native Chrome DOM textContent of 446 code bodies from frozen native MediaWiki HTML; no transformation behavior or visual-layout certification.',
};
const policy = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; font-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
const server = http.createServer((request, response) => {
    report.requests.push({ method: request.method, path: request.url });
    if (request.method !== 'GET') { report.networkMutations++; response.writeHead(403).end(); return; }
    const body = request.url === '/manual' ? raw.manualHTML : request.url === '/pre-control' ? raw.controlHTML : null;
    if (!body) { response.writeHead(request.url === '/favicon.ico' ? 204 : 404).end(); return; }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': policy, 'Cache-Control': 'no-store' });
    response.end(Buffer.concat([Buffer.from('<!doctype html><meta charset="utf-8"><title>Native documentation code verification</title>'), body]));
});
const bodies = () => driver.evaluate('Array.from(document.querySelectorAll("pre"), element => element.textContent)');

(async () => {
    try {
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const origin = 'http://127.0.0.1:' + server.address().port;
        await driver.start(origin);
        report.browserVersion = driver.version;
        report.browser = 'Installed Google Chrome (NativeChrome)';
        await driver.navigate(origin + '/pre-control');
        const observedControls = await bodies();
        assert.equal(observedControls.length, expected.controls.length, 'Every native pre control is present');
        report.controls = expected.controls.map((value, index) => ({
            index, expected: value, observed: observedControls[index], exact: value === observedControls[index],
            expectedSha256: sha(value), observedSha256: sha(observedControls[index]),
        }));
        // A trailing LF is permissible only when the no-terminal-LF probe proves
        // it is generated natively. Leading LFs are never stripped or restored.
        const terminalGenerated = observedControls[0] === expected.controls[0] + '\n';
        assert(observedControls[0] === expected.controls[0] || terminalGenerated,
            'The native no-terminal-newline control must stay exact or add one terminal LF');
        assert.equal(observedControls[1], expected.controls[1], 'An existing terminal LF remains exact');
        assert.equal(observedControls[3], expected.controls[3], 'Entities, template text and internal LF remain exact');
        report.terminalNewlinePolicy = terminalGenerated ? 'one terminal LF proven generated by the no-terminal-newline native control' : 'exact; native control generates no terminal LF';
        await driver.navigate(origin + '/manual');
        const actual = await bodies();
        report.observedBodies = actual.length;
        assert.equal(actual.length, expected.manual.length, 'All 446 native manual pre elements remain present');
        for (let index = 0; index < expected.manual.length; index++) {
            const before = expected.manual[index], after = actual[index];
            if (after === before) { report.exactBodies++; continue; }
            if (terminalGenerated && !before.endsWith('\n') && after === before + '\n') {
                report.trailingNativeNewlineAdjustments++;
                continue;
            }
            let firstDifference = 0;
            while (firstDifference < Math.min(before.length, after.length) && before[firstDifference] === after[firstDifference]) firstDifference++;
            report.mismatches.push({ index, ordinal: index + 1, expectedSha256: sha(before), observedSha256: sha(after),
                expectedBytes: Buffer.byteLength(before), observedBytes: Buffer.byteLength(after), firstDifference,
                expectedContext: before.slice(Math.max(0, firstDifference - 20), firstDifference + 100),
                observedContext: after.slice(Math.max(0, firstDifference - 20), firstDifference + 100) });
        }
        report.externalRequests = driver.blocked.length;
        assert.deepEqual(driver.errors, [], 'No native browser page error');
        assert.deepEqual(driver.blocked, [], 'No attempted external request passes the offline CSP');
        assert.equal(report.networkMutations, 0, 'The local harness receives no write requests');
        assert(report.requests.every(item => ['/manual', '/pre-control', '/favicon.ico'].includes(item.path)), 'Only the two local captured fragments are requested');
        assert.equal(report.mismatches.length, 0, 'Every native DOM code body must match its expected bytes');
        report.status = 'passed';
    } catch (error) {
        report.status = 'failed';
        report.failures.push(String(error.stack || error));
        process.exitCode = 1;
    } finally {
        try { await driver.close(); report.ownedBrowserSessionClosed = true; }
        catch (error) { report.status = 'failed'; report.failures.push(String(error)); process.exitCode = 1; }
        await new Promise(resolve => server.close(resolve));
        report.finishedUtc = new Date().toISOString();
        fs.mkdirSync(path.dirname(receipt), { recursive: true });
        fs.writeFileSync(receipt, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
        console.log(JSON.stringify({ status: report.status, browserVersion: report.browserVersion,
            expectedBodies: report.expectedBodies, observedBodies: report.observedBodies,
            exactBodies: report.exactBodies, mismatches: report.mismatches,
            failures: report.failures, ownedBrowserSessionClosed: report.ownedBrowserSessionClosed }));
    }
})();
