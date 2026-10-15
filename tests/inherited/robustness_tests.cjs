'use strict';
const qa = require('./harness.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const api = qa.api;
const results = [], timings = [];
function test(name, fn) {
    try { fn(); results.push({name, passed: true}); }
    catch (error) { results.push({name, passed: false, error: error.stack}); }
}
function urlSet(s) {
    return [...new Set(s.match(/https?:\/\/[^\s<>\]{}|"']+/g) || [])].sort();
}
function elapsed(label, fn) {
    const begin = performance.now();
    const result = fn();
    const milliseconds = performance.now() - begin;
    timings.push({label, milliseconds});
    assert(milliseconds < 15000, label + ' exceeded broad headless safety budget: ' + milliseconds + ' ms');
    return result;
}
// Frozen real articles used in earlier live investigations. Each test validates
// final-engine behavior, not an expected text manufactured from the same rule.
const fixtures = [
    ['Sudão', 'tests/inherited/fixtures/sudao_before_test.wiki'],
    ['Hernán Cortés', 'tests/inherited/fixtures/cortes_72543725.wiki'],
    ['Telma de Souza', 'tests/inherited/fixtures/telma_73195532.wiki'],
    ['Navi Pillay', 'tests/inherited/fixtures/Navanethem_Pillay_v2.wiki'],
    ['Política econômica', 'tests/inherited/fixtures/Politica_economica_ptwiki_v1.wiki'],
];
for (const [label, filename] of fixtures) {
    const source = fs.readFileSync(path.join(qa.root, filename), 'utf8');
    const result = elapsed('cleanup ' + label, () => api.cleanup(source));
    test(label + ': second click does not introduce further edits', () => {
        assert.equal(api.cleanup(result.text).text, result.text);
    });
    test(label + ': no source URL disappears', () => {
        const afterURLs = new Set(urlSet(result.text));
        for (const url of urlSet(source)) assert(afterURLs.has(url), 'Missing source URL: ' + url);
    });
    test(label + ': diff reproduces full output and full rejection restores source', () => {
        const changes = elapsed('comparison ' + label, () => api.comparison(source, result));
        assert.equal(api.composeChanges(source, changes), result.text);
        assert.equal(api.composeChanges(source, changes.map(h => ({...h, accepted: false}))), source);
        assert.equal(api.safeComposition(source, result.text), '');
    });
    test(label + ': checks leave draft byte-for-byte unchanged', () => {
        assert.equal(elapsed('audit ' + label, () => api.calculate({kind:'audit', source, options:{}})).text, source);
        assert.equal(api.spellingReview(source).text, source);
    });
}
const sentinel = 'A bióloga escreveu ç, ﬁ, e\u0301, שלום, 中文 e 😀 exatamente assim.';
const imported = '{{Cite web|title=A title|url=https://example.org/x?a=1&b=2|date=2025-01-01}}';
for (const [label, literal] of [
    ['nowiki', '<nowiki>==References== {{Cite web|title=Original}} [[File:X.jpg]]</nowiki>'],
    ['HTML comment', '<!-- {{Short description|Original}} <ref name=12>Original</ref> -->'],
    ['source code', '<syntaxhighlight lang="javascript">const x = "{{Cite web|title=X}}";</syntaxhighlight>'],
    ['math', '<math>\uE000AJG0\uE001 + \alpha = 2</math>'],
    ['private-use source', '\uE000AJG0\uE001'],
]) {
    test(label + ': unrelated automatic edits preserve exact literal and visible prose', () => {
        const source = sentinel + '\n' + literal + '\n' + imported;
        const result = api.cleanup(source);
        assert(result.text.includes(sentinel));
        assert(result.text.includes(literal));
        assert(result.text.includes('https://example.org/x?a=1&b=2'));
        assert.equal(api.cleanup(result.text).text, result.text);
    });
}
for (const unknown of [
    '{{Info/Biografia|nome=Ana|campo_futuro=Verificação única}}',
    '{{Info/Ator|nome=Ana|campo_futuro=Verificação única}}',
    '{{Info/Político|nome=Ana|campo_futuro=Verificação única}}',
    '{{Учёный|Имя=Иван|campo_futuro=Verificação única}}',
    '{{基礎情報人物|名前=名前|campo_futuro=Verificação única}}',
]) {
    test('unknown populated field is retained: ' + unknown.slice(0,30), () => {
        const source = sentinel + '\n' + unknown;
        const result = api.cleanup(source);
        assert(result.text.includes('campo_futuro=Verificação única'));
        assert(result.text.includes(sentinel));
    });
}
// Random-looking deterministic edits exercise repeated line alignment and raw
// UTF-16 offsets, including insertions/deletions before and after long repeats.
for (let i = 0; i < 20; i++) {
    test('diff roundtrip with repeated text and Unicode, case ' + i, () => {
        const pieces = Array.from({length:60}, (_,n) => n % 5 ? 'Texto repetido 😀.\n' : 'Linha ' + n + ': e\u0301 {{X|a=b}} [[A|B]].\n');
        const before = pieces.join('');
        pieces.splice((i * 7) % pieces.length, i % 3, 'Inserção ' + i + ' [[Página|rótulo]] 😀.\n');
        pieces[pieces.length - 1] = 'Fim ' + i + '.\n';
        const after = pieces.join('');
        const hunks = api.diffHunks(before, after);
        assert.equal(api.composeChanges(before, hunks.map(h => ({...h, accepted:true}))), after);
        for (const h of hunks) {
            assert.equal(before.slice(h.start,h.end), h.before);
            assert.equal(after.slice(h.newStart,h.newEnd), h.after);
        }
    });
}
test('malformed reference cannot trigger cleanup outside the broken structure', () => {
    const source = sentinel + '\n<ref name="x">Broken reference\n{{Short description|X}}\n==References==\n{{Reflist}}';
    assert.equal(api.cleanup(source).text, source);
});
test('unbalanced template cannot discard adjacent imported citation', () => {
    const source = sentinel + '\n{{Broken|value=\n' + imported;
    assert.equal(api.cleanup(source).text, source);
});
test('stale spelling correction cannot affect changed draft at original offsets', () => {
    const source = 'É interressante. 😀';
    const suggestion = api.spellingReview(source).suggestions[0];
    assert.throws(() => api.applySuggestion('É perfeitamente correto. 😀', suggestion, 0));
});
test('large repeated article cleanup and comparison stay bounded with no content loss', () => {
    const prose = 'Texto com acentuação ç e Unicode 😀 que não deve mudar.\n';
    const source = (prose + '<!-- literal {{Cite web|title=X}} -->\n').repeat(2000) + imported;
    const result = elapsed('large repeated cleanup', () => api.cleanup(source));
    assert(result.text.startsWith((prose + '<!-- literal {{Cite web|title=X}} -->\n').repeat(2000)));
    assert.deepEqual(urlSet(result.text), urlSet(source));
    const changes = elapsed('large repeated comparison', () => api.comparison(source,result));
    assert.equal(api.composeChanges(source,changes),result.text);
});
const report = {version: api.version, scriptSha256: qa.sha256,
    passed:results.filter(r=>r.passed).length, failed:results.filter(r=>!r.passed).length, results, timings};
fs.writeFileSync(path.join(__dirname,'robustness_results.json'),JSON.stringify(report,null,2)+'\n');
for (const r of results.filter(r=>!r.passed)) console.error(r.name + '\n' + r.error);
console.log(JSON.stringify({passed:report.passed,failed:report.failed,timings}));
process.exitCode=report.failed?1:0;
