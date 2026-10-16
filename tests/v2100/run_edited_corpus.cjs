'use strict';
/* Local-only tests of immutable, publicly licensed article revisions.
 * This runner cannot retrieve articles or publish edits. Final execution needs
 * independently relayed release-manifest and corpus-manifest SHA-256 pins.
 * Source text and detailed diagnostics remain in the private output directory.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
const root = path.resolve(__dirname, '../..');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const sha1 = value => crypto.createHash('sha1').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
const options = Object.fromEntries(process.argv.slice(2).map(argument => {
    const [key, ...value] = argument.replace(/^--/, '').split('=');
    return [key, value.length ? value.join('=') : true];
}));
const literalNames = new Set(['nowiki', 'pre', 'syntaxhighlight', 'source', 'code', 'math', 'blockquote', 'q', 'chem', 'score', 'timeline', 'graph', 'templatedata', 'poem', 'gallery', 'hiero', 'imagemap', 'mapframe', 'maplink', 'inputbox']);

function htmlTag(text, start) {
    if (text[start] !== '<') return null;
    let index = start + 1, quote = '';
    while (index < text.length) {
        const character = text[index++];
        if (quote) { if (character === quote) quote = ''; }
        else if (character === '"' || character === "'") quote = character;
        else if (character === '>') {
            const raw = text.slice(start, index), match = raw.match(/^<\s*(\/?)\s*([a-z][\w:-]*)\b/i);
            return match ? {start, end: index, raw, name: match[2].toLowerCase(), closing: !!match[1], selfClosing: /\/\s*>$/.test(raw)} : null;
        }
    }
    return null;
}

function literalRanges(text) {
    const ranges = [];
    for (let index = 0; index < text.length;) {
        if (text.startsWith('<!--', index)) {
            const close = text.indexOf('-->', index + 4), end = close < 0 ? text.length : close + 3;
            ranges.push({start: index, end, kind: 'comment', raw: text.slice(index, end)}); index = end; continue;
        }
        const tag = htmlTag(text, index);
        if (tag && !tag.closing && literalNames.has(tag.name)) {
            const expression = new RegExp('<\\s*\\/\\s*' + tag.name + '\\s*>', 'gi'); expression.lastIndex = tag.end;
            const close = tag.selfClosing ? null : expression.exec(text);
            const end = tag.selfClosing ? tag.end : close ? expression.lastIndex : text.length;
            ranges.push({start: index, end, kind: tag.name, raw: text.slice(index, end)}); index = end; continue;
        }
        index = tag ? tag.end : index + 1;
    }
    return ranges;
}

function maskRanges(text, ranges) {
    const parts = []; let cursor = 0;
    for (const range of ranges.slice().sort((a, b) => a.start - b.start || b.end - a.end)) {
        if (range.start < cursor) continue;
        parts.push(text.slice(cursor, range.start), text.slice(range.start, range.end).replace(/[^\r\n]/g, ' ')); cursor = range.end;
    }
    parts.push(text.slice(cursor)); return parts.join('');
}

function entities(value) {
    return value.replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi, raw => {
        const named = {'&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' '};
        if (named[raw.toLowerCase()] !== undefined) return named[raw.toLowerCase()];
        const number = raw[2].toLowerCase() === 'x' ? parseInt(raw.slice(3, -1), 16) : parseInt(raw.slice(2, -1), 10);
        return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? String.fromCodePoint(number) : raw;
    });
}

function occurrences(items) {
    const counts = new Map(); for (const item of items) counts.set(item, (counts.get(item) || 0) + 1); return counts;
}
function missing(before, after, multiplicity = false) {
    const a = occurrences(before), b = occurrences(after), result = [];
    for (const [value, count] of a) if ((b.get(value) || 0) < (multiplicity ? count : 1)) result.push({value, before: count, after: b.get(value) || 0});
    return result;
}
function sorted(items) { return items.slice().sort(); }

function urls(text) {
    const view = entities(maskRanges(text, literalRanges(text).filter(range => range.kind === 'comment')));
    return view.match(/(?:https?:\/\/|\/\/)[^\s<>\]{}|"']+/g) || [];
}
function imageFiles(text) {
    const result = [], view = maskRanges(text, literalRanges(text).filter(range => range.kind !== 'gallery'));
    const normalize = value => entities(value).trim().replace(/_/g, ' ').normalize('NFC').replace(/^(?:Ficheiro|Imagem|Arquivo|File|Image|Fichier|Datei|Bild|Archivo)\s*:\s*/i, '');
    for (const match of view.matchAll(/\[\[\s*(?:Ficheiro|Imagem|Arquivo|File|Image|Fichier|Datei|Bild|Archivo)\s*:\s*([^\n|\]]+)/gi)) result.push(normalize(match[1]));
    for (const match of view.matchAll(/\|\s*(?:imagem(?:[_ ](?:mapa\d*|bandeira|brasão|assinatura))?|image|foto|capa|mapa|logo|logotipo|emblema|bandeira|brasão)\s*=\s*([^|\n{}]+)/gi)) {
        const file = normalize(match[1]); if (/\.(?:svg|png|jpe?g|gif|webp|tiff?|pdf|djvu|og[gv]|webm|mp[34]|wav|flac)$/i.test(file)) result.push(file);
    }
    for (const match of text.matchAll(/<gallery\b[^>]*>([\s\S]*?)<\/gallery\s*>/gi)) for (const line of match[1].split(/\r?\n/)) {
        const file = normalize(line.split('|')[0]); if (/\.(?:svg|png|jpe?g|gif|webp|tiff?|pdf|djvu|og[gv]|webm|mp[34]|wav|flac)$/i.test(file)) result.push(file);
    }
    return result;
}
function citationIdentifiers(text) {
    const view = entities(maskRanges(text, literalRanges(text))), result = [];
    const normalize = (key, value) => {
        key = key.toLowerCase().replace(/\d+$/, ''); value = value.trim();
        if (['isbn', 'issn'].includes(key)) value = value.replace(/[\s-]/g, '').toUpperCase();
        else if (['pmid', 'pmc', 'oclc'].includes(key)) value = value.replace(/\s/g, '');
        return key + '=' + value;
    };
    for (const match of view.matchAll(/\|\s*(doi|isbn\d*|issn\d*|pmid|pmc|oclc|jstor|arxiv|bibcode|hdl|s2cid)\s*=\s*([^|\r\n}]+)/gi)) result.push(normalize(match[1], match[2]));
    for (const match of view.matchAll(/\b10\.\d{4,9}\/[A-Za-z0-9._;()/:+-]+/g)) result.push(normalize('doi', match[0]));
    for (const match of view.matchAll(/\bISBN(?:-1[03])?\s*:?\s*((?:\d[ \t-]*){12}\d|(?:\d[ \t-]*){9}[\dXx])(?![\d-])/gi)) result.push(normalize('isbn', match[1]));
    for (const match of view.matchAll(/\{\{\s*ISBN\s*\|\s*([\dXx -]+)/gi)) result.push(normalize('isbn', match[1]));
    return result;
}
function literalContents(text) {
    return literalRanges(text).map(range => range.kind === 'gallery'
        ? range.raw.replace(/^(\s*)(?:File|Image|Imagem|Arquivo|Ficheiro)\s*:/gmi, '$1Ficheiro:')
        : range.raw);
}

// The table reader is deliberately independent from RevisaWiki's parser.
// It ignores presentation attributes, not row labels, values, links or order.
function tableRanges(text) {
    const view = maskRanges(text, literalRanges(text)), tables = [], stack = [];
    for (const match of view.matchAll(/^[ \t]*(\{\||\|\})[^\r\n]*(?:\r?\n|$)/gm)) {
        if (match[1] === '{|') stack.push({start: match.index, openEnd: match.index + match[0].length, depth: stack.length, kind: 'wiki'});
        else if (stack.length) tables.push({...stack.pop(), end: match.index + match[0].length, closed: true});
    }
    for (const open of stack) tables.push({...open, end: text.length, closed: false});
    const htmlStack = [];
    for (let index = 0; index < view.length;) {
        const tag = htmlTag(view, index);
        if (!tag) { index++; continue; }
        if (tag.name === 'table') {
            if (tag.closing && htmlStack.length) tables.push({...htmlStack.pop(), end: tag.end, closed: true});
            else if (!tag.closing && !tag.selfClosing) htmlStack.push({start: index, openEnd: tag.end, depth: htmlStack.length, kind: 'html'});
        }
        index = tag.end;
    }
    for (const open of htmlStack) tables.push({...open, end: text.length, closed: false});
    return tables.sort((a, b) => a.start - b.start || b.end - a.end);
}
function delimiterPositions(text, delimiter) {
    const found = []; let template = 0, link = 0;
    for (let index = 0; index < text.length;) {
        const tag = htmlTag(text, index); if (tag) { index = tag.end; continue; }
        const pair = text.slice(index, index + 2);
        if (pair === '{{') { template++; index += 2; continue; }
        if (pair === '}}' && template) { template--; index += 2; continue; }
        if (pair === '[[') { link++; index += 2; continue; }
        if (pair === ']]' && link) { link--; index += 2; continue; }
        if (!template && !link && delimiter.includes(pair)) { found.push({start: index, length: 2}); index += 2; continue; }
        index++;
    }
    return found;
}
function cellContent(raw) {
    let value = raw.replace(/<!--[\s\S]*?-->/g, '').replace(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>|<ref\b[^>]*\/\s*>/gi, ' ');
    const pipe = value.indexOf('|');
    if (pipe >= 0 && /^\s*(?:(?:scope|class|style|id|align|valign|width|height|rowspan|colspan|bgcolor|data-sort-value)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s|]+)\s*)+$/i.test(value.slice(0, pipe))) value = value.slice(pipe + 1);
    value = value.replace(/\[\[([^\[\]]*)\]\]/g, (_, body) => body.includes('|') ? body.slice(body.lastIndexOf('|') + 1) : body)
        .replace(/\[(?:https?:\/\/|\/\/)[^\s\]]+(?:\s+([^\]]*))?\]/g, (_, label) => label || '')
        .replace(/<\/?(?:span|div|small|big|b|i|strong|em|font|center|sup|sub|br|p|abbr)\b[^>]*>/gi, ' ')
        .replace(/'{2,5}/g, '');
    return entities(value).normalize('NFC').replace(/\s+/g, ' ').trim();
}
function tableRows(text) {
    const ranges = tableRanges(text), tables = [];
    for (const range of ranges) {
        const nested = ranges.filter(child => child.start > range.start && child.end <= range.end);
        let body = maskRanges(text.slice(range.openEnd, range.end), nested.map(child => ({start: child.start - range.openEnd, end: child.end - range.openEnd})));
        const rows = [], captions = []; let current = [];
        const flush = () => { if (current.length) rows.push(current.map(cellContent)); current = []; };
        if (range.kind === 'wiki') {
            body = maskRanges(body, literalRanges(body).filter(item => item.kind === 'comment'));
            for (const line of body.split(/\r?\n/)) {
                if (/^\s*\|[-}]/.test(line)) { flush(); continue; }
                if (/^\s*\|\+/.test(line)) { captions.push(cellContent(line.replace(/^\s*\|\+/, ''))); continue; }
                const start = line.match(/^\s*([!|])/);
                if (!start) { if (current.length && line.trim()) current[current.length - 1] += '\n' + line; continue; }
                const content = line.slice(start[0].length), delimiters = delimiterPositions(content, start[1] === '!' ? ['!!', '||'] : ['||']);
                let cursor = 0;
                for (const delimiter of delimiters) { current.push(content.slice(cursor, delimiter.start)); cursor = delimiter.start + delimiter.length; }
                current.push(content.slice(cursor));
            }
            flush();
        } else {
            for (const match of body.matchAll(/<caption\b[^>]*>([\s\S]*?)<\/caption\s*>/gi)) captions.push(cellContent(match[1]));
            for (const row of body.matchAll(/<tr\b[^>]*>([\s\S]*?)(?:<\/tr\s*>|(?=<tr\b)|$)/gi)) {
                const cells = [...row[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)(?:<\/(?:td|th)\s*>|(?=<(?:td|th)\b)|$)/gi)].map(match => cellContent(match[1]));
                if (cells.length) rows.push(cells);
            }
        }
        tables.push({kind: range.kind, depth: range.depth, closed: range.closed, captions, rows});
    }
    return tables;
}
function inventory(text) {
    const tables = tableRows(text), strings = tables.flatMap(table => [...table.captions, ...table.rows.flat()]);
    return {urls: urls(text), images: imageFiles(text), identifiers: citationIdentifiers(text), protected: literalContents(text), tables,
        numericTableRows: tables.map(table => table.rows.map(row => row.map(cell => cell.match(/[+−-]?\d+(?:[.,:\/\u00a0 ]\d+)*(?:[%‰]|[eE][+−-]?\d+)?/g) || []))),
        tableLabels: tables.map(table => table.rows.map(row => row.map(cell => cell.match(/[\p{L}\p{M}]+/gu) || []))),
        tableSummary: {tables: tables.length, closedTables: tables.filter(table => table.closed).length, rows: tables.reduce((count, table) => count + table.rows.length, 0), cells: tables.reduce((count, table) => count + table.rows.reduce((sum, row) => sum + row.length, 0), 0), numericRows: tables.reduce((count, table) => count + table.rows.filter(row => row.some(cell => /\d/.test(cell))).length, 0), labelTokens: strings.reduce((count, cell) => count + (cell.match(/[\p{L}\p{M}]+/gu) || []).length, 0)}};
}
function counts(values) {
    const result = {}; for (const value of values || []) { const key = typeof value === 'object' && value ? String(value.code || value.type || 'uncoded') : 'uncoded'; result[key] = (result[key] || 0) + 1; } return result;
}
function safeChanges(changes) { return (changes || []).map(change => ({id: String(change.id || 'uncoded'), count: Number.isFinite(change.count) ? change.count : 1})); }
function verifyByteMetrics(metrics, originalBytes, outputBytes) {
    assert.equal(metrics.before, originalBytes); assert.equal(metrics.after, outputBytes);
    assert.equal(metrics.delta, outputBytes - originalBytes); assert.equal(metrics.netExact, true);
    assert.equal(typeof metrics.precise, 'boolean');
    if (metrics.precise) {
        assert.equal(metrics.precision, 'local-diff'); assert.equal(metrics.consistent, true);
        for (const field of ['added', 'removed', 'changed']) assert(Number.isSafeInteger(metrics[field]) && metrics[field] >= 0, 'Precise ' + field + ' is a nonnegative exact byte count');
        assert.equal(metrics.added - metrics.removed, outputBytes - originalBytes);
        assert.equal(metrics.changed, metrics.added + metrics.removed);
    } else {
        assert.equal(metrics.precision, 'bounded-fallback'); assert.equal(metrics.consistent, false);
        for (const field of ['added', 'removed', 'changed']) assert.equal(metrics[field], null, 'Bounded fallback never claims an exact ' + field + ' byte count');
    }
}
function reconstructHunks(source, hunks, expected) {
    const ordered = hunks.slice().sort((a, b) => a.start - b.start || a.newStart - b.newStart || a.end - b.end);
    let cursor = 0;
    for (const hunk of ordered) {
        assert(Number.isSafeInteger(hunk.start) && Number.isSafeInteger(hunk.end) && hunk.start >= cursor && hunk.end >= hunk.start && hunk.end <= source.length, 'Hunk source intervals do not overlap');
        assert.equal(source.slice(hunk.start, hunk.end), hunk.before, 'Exact original hunk slice');
        if (expected !== undefined) {
            assert(Number.isSafeInteger(hunk.newStart) && Number.isSafeInteger(hunk.newEnd) && hunk.newStart >= 0 && hunk.newEnd >= hunk.newStart && hunk.newEnd <= expected.length, 'Valid output hunk interval');
            assert.equal(expected.slice(hunk.newStart, hunk.newEnd), hunk.after, 'Exact output hunk slice');
        }
        cursor = hunk.end;
    }
    let reconstructed = source;
    for (const hunk of hunks.slice().sort((a, b) => b.start - a.start || b.newStart - a.newStart || b.end - a.end)) reconstructed = reconstructed.slice(0, hunk.start) + hunk.after + reconstructed.slice(hunk.end);
    return reconstructed;
}

function selfTest() {
    let checks = 0;
    const check = (name, callback) => { callback(); checks++; };
    const table = '{| class="wikitable"\n! Cidade !! 2025\n|-\n| [[Lisboa]] || 12,5\n|-\n| [[Porto|Porto]] || −8\n|}\n';
    check('row labels and numeric cells', () => assert.deepEqual(tableRows(table)[0].rows, [['Cidade', '2025'], ['Lisboa', '12,5'], ['Porto', '−8']]));
    check('scopes are presentation only', () => assert.deepEqual(tableRows(table), tableRows(table.replace('! Cidade', '! scope="col" | Cidade'))));
    check('numeric mutation detected', () => assert.notDeepEqual(inventory(table).numericTableRows, inventory(table.replace('12,5', '12,6')).numericTableRows));
    check('label mutation detected', () => assert.notDeepEqual(inventory(table).tableLabels, inventory(table.replace('Lisboa', 'Madrid')).tableLabels));
    check('row deletion detected', () => assert.notDeepEqual(tableRows(table), tableRows(table.replace('| [[Lisboa]] || 12,5\n', ''))));
    check('identical numeric duplicate retained', () => assert.equal(inventory(table.replace('| [[Lisboa]] || 12,5', '| [[Lisboa]] || 12,5 || 12,5')).numericTableRows[0][1].length, 3));
    check('nested table inventory', () => assert.equal(tableRows('{|\n| A\n{|\n| B || 2\n|}\n|}\n').length, 2));
    check('template pipes not delimiters', () => assert.deepEqual(tableRows('{|\n| {{x|a||b}} || 2\n|}\n')[0].rows, [['{{x|a||b}}', '2']]));
    check('link pipes not delimiters', () => assert.deepEqual(tableRows('{|\n| [[A|B]] || 2\n|}\n')[0].rows, [['B', '2']]));
    check('HTML table', () => assert.deepEqual(tableRows('<table><tr><th>Cidade</th><th>Valor</th></tr><tr><td>Lisboa</td><td>12</td></tr></table>')[0].rows, [['Cidade', 'Valor'], ['Lisboa', '12']]));
    check('table caption retained', () => assert.deepEqual(tableRows('{|\n|+ Números\n| 2\n|}\n')[0].captions, ['Números']));
    check('table in nowiki excluded', () => assert.equal(tableRows('<nowiki>\n' + table + '</nowiki>').length, 0));
    check('quote-aware HTML attributes', () => assert.equal(htmlTag('<span title="a>b">', 0).end, 18));
    check('protected exact multiplicity', () => assert.equal(missing(literalContents('<nowiki>A</nowiki><nowiki>A</nowiki>'), literalContents('<nowiki>A</nowiki>'), true).length, 1));
    check('protected mutation detected', () => assert.equal(missing(literalContents('<math>x+1</math>'), literalContents('<math>x+2</math>'), true).length, 1));
    check('unclosed literal retained', () => assert.equal(literalContents('A<pre>B')[0], '<pre>B'));
    check('gallery namespace normalization', () => assert.deepEqual(literalContents('<gallery>\nFile:A.png|A\n</gallery>'), literalContents('<gallery>\nFicheiro:A.png|A\n</gallery>')));
    check('gallery caption mutation detected', () => assert.notDeepEqual(literalContents('<gallery>\nFile:A.png|A\n</gallery>'), literalContents('<gallery>\nFile:A.png|B\n</gallery>')));
    check('URL entity rendering', () => assert.deepEqual(urls('[https://example.invalid/?a=1&amp;b=2 A]'), ['https://example.invalid/?a=1&b=2']));
    check('URL change detected', () => assert.equal(missing(urls('https://example.invalid/A'), urls('https://example.invalid/B')).length, 1));
    check('citation parameter identifiers', () => assert.deepEqual(citationIdentifiers('{{Citar|pmid=123|isbn=978-0-123456-78-9}}'), ['pmid=123', 'isbn=9780123456789']));
    check('ISBN presentation conversion', () => assert.deepEqual(citationIdentifiers('ISBN 978-0-123456-78-9'), citationIdentifiers('{{ISBN|978-0-123456-78-9}}')));
    check('DOI value retained', () => assert(citationIdentifiers('{{Citar|doi=10.1234/abc}}').includes('doi=10.1234/abc')));
    check('image namespace conversion', () => assert.deepEqual(imageFiles('[[File:A_B.png|x]]'), imageFiles('[[Ficheiro:A B.png|x]]')));
    check('infobox image retained', () => assert.deepEqual(imageFiles('{{Info|imagem=A.jpg}}'), ['A.jpg']));
    check('gallery image retained', () => assert.deepEqual(imageFiles('<gallery>\nFile:A.png|caption\n</gallery>'), ['A.png']));
    const exactMetrics = {before: 100, after: 105, delta: 5, added: 12, removed: 7, changed: 19, consistent: true, netExact: true, precise: true, precision: 'local-diff'};
    const boundedMetrics = {...exactMetrics, added: null, removed: null, changed: null, consistent: false, precise: false, precision: 'bounded-fallback'};
    check('exact local byte accounting', () => verifyByteMetrics(exactMetrics, 100, 105));
    check('honest bounded byte accounting', () => verifyByteMetrics(boundedMetrics, 100, 105));
    check('incorrect exact net delta rejected', () => assert.throws(() => verifyByteMetrics({...exactMetrics, delta: 6}, 100, 105)));
    check('invented bounded byte counts rejected', () => assert.throws(() => verifyByteMetrics({...boundedMetrics, added: 12, removed: 7, changed: 19}, 100, 105)));
    const tiedHunks = [{start: 1, end: 1, newStart: 1, newEnd: 2, before: '', after: '*'}, {start: 1, end: 2, newStart: 2, newEnd: 3, before: 'B', after: 'b'}];
    check('co-located insertion and replacement', () => assert.equal(reconstructHunks('ABC', tiedHunks, 'A*bC'), 'A*bC'));
    check('co-located reconstruction independent of input order', () => assert.equal(reconstructHunks('ABC', tiedHunks.slice().reverse(), 'A*bC'), 'A*bC'));
    check('two co-located insertions follow output positions', () => assert.equal(reconstructHunks('AC', [{start: 1, end: 1, newStart: 2, newEnd: 3, before: '', after: 'b'}, {start: 1, end: 1, newStart: 1, newEnd: 2, before: '', after: '*'}], 'A*bC'), 'A*bC'));
    check('UTF-16 source offsets retained', () => assert.equal(reconstructHunks('A😀C', [{start: 1, end: 3, newStart: 1, newEnd: 3, before: '😀', after: '🙂'}], 'A🙂C'), 'A🙂C'));
    check('overlapping source ranges rejected', () => assert.throws(() => reconstructHunks('ABC', [{start: 0, end: 2, newStart: 0, newEnd: 1, before: 'AB', after: 'x'}, {start: 1, end: 3, newStart: 1, newEnd: 2, before: 'BC', after: 'y'}], 'xy')));
    check('wrong original slice rejected', () => assert.throws(() => reconstructHunks('ABC', [{...tiedHunks[1], before: 'x'}])));
    check('wrong destination slice rejected', () => assert.throws(() => reconstructHunks('ABC', tiedHunks, 'A*yC')));
    return {status: 'passed', checks};
}

function forbidNetwork() {
    const attempts = [], block = name => function blocked() { attempts.push(name); throw Error('Offline test blocked network/process API: ' + name); };
    for (const [moduleName, methods] of [['node:http', ['request', 'get']], ['node:https', ['request', 'get']], ['node:net', ['connect', 'createConnection']], ['node:tls', ['connect']], ['node:dgram', ['createSocket']], ['node:child_process', ['exec', 'execFile', 'spawn', 'fork', 'execSync', 'execFileSync', 'spawnSync']]]) {
        const module = require(moduleName); for (const method of methods) module[method] = block(moduleName + '.' + method);
    }
    globalThis.fetch = block('fetch'); globalThis.WebSocket = block('WebSocket'); globalThis.XMLHttpRequest = block('XMLHttpRequest');
    return attempts;
}
function requireHexPin(value, name) { assert(typeof value === 'string' && /^[0-9a-f]{64}$/.test(value), name + ' must be an explicitly relayed lowercase SHA-256 pin'); }
function writeJSON(file, data) { const temporary = file + '.tmp'; fs.writeFileSync(temporary, JSON.stringify(data, null, 2) + '\n'); fs.renameSync(temporary, file); }

function readCorpus(corpusFile, expectedPin) {
    requireHexPin(expectedPin, '--corpus-pin');
    const corpusDirectory = path.dirname(corpusFile), corpusRaw = fs.readFileSync(corpusFile);
    assert.equal(sha256(corpusRaw), expectedPin, 'Corpus manifest equals the explicitly relayed final pin');
    const manifest = JSON.parse(corpusRaw), articles = Array.isArray(manifest) ? manifest : manifest.articles || manifest.entries;
    assert(Array.isArray(articles) && articles.length >= 30, 'At least 30 frozen complete public article revisions');
    assert.equal(new Set(articles.map(item => item.revid)).size, articles.length, 'Distinct revisions');
    assert.equal(new Set(articles.map(item => item.title.normalize('NFC').replace(/_/g, ' '))).size, articles.length, 'Distinct articles');
    const inputs = articles.map(item => {
        assert.equal(item.ns, 0); assert(Number.isSafeInteger(item.revid) && item.revid > 0); assert(typeof item.title === 'string' && item.title.length); assert(Number.isFinite(Date.parse(item.timestamp)));
        assert(typeof item.file === 'string' && /^sources\/[A-Za-z0-9_.-]+\.wiki(?:\.gz)?$/.test(item.file), 'Relative source file under sources/');
        assert(Number.isInteger(item.bytes) && item.bytes > 100000, 'Each article exceeds 100,000 bytes'); requireHexPin(item.sha256, 'Source SHA-256');
        const sourcePath = path.join(corpusDirectory, item.file); assert.equal(fs.lstatSync(sourcePath).isSymbolicLink(), false, 'Source is a regular immutable local capture');
        const savedRaw = fs.readFileSync(sourcePath), compressed = item.compression === 'gzip';
        assert.equal(item.file.endsWith('.gz'), compressed, 'Compression declaration matches the source filename');
        if (compressed) { requireHexPin(item.compressedSha256, 'Compressed source SHA-256'); assert.equal(savedRaw.length, item.compressedBytes); assert.equal(sha256(savedRaw), item.compressedSha256); }
        const raw = compressed ? zlib.gunzipSync(savedRaw) : savedRaw;
        assert.equal(raw.length, item.bytes, 'Exact captured UTF-8 byte count'); assert.equal(sha256(raw), item.sha256, 'Exact source SHA-256');
        const serverSha1 = String(item.sha1 || '').toLowerCase(), localSha1 = sha1(raw), base36 = BigInt('0x' + localSha1).toString(36).padStart(31, '0');
        assert(serverSha1 === localSha1 || serverSha1.padStart(31, '0') === base36, 'Server SHA-1 binds the exact captured full source');
        const permalink = new URL(item.permalink); assert.equal(permalink.protocol, 'https:'); assert.equal(permalink.hostname, 'pt.wikipedia.org'); assert.equal(Number(permalink.searchParams.get('oldid')), item.revid);
        const source = new TextDecoder('utf-8', {fatal: true}).decode(raw); assert.equal(Buffer.byteLength(source), item.bytes, 'No UTF-8 replacement or BOM stripping');
        return {item, sourcePath, source};
    });
    return {corpusFile, corpusRaw, manifest, inputs};
}

function main() {
    if (options.help) { console.log('Offline corpus runner. Prepare: --self-test or --provenance-only --corpus-pin=CORPUS_MANIFEST_SHA256. Final execution: --final-pin=RELEASE_MANIFEST_SHA256 --corpus-pin=CORPUS_MANIFEST_SHA256 [--manifest=LOCAL_MANIFEST] [--output-dir=LOCAL_DIRECTORY] [--run=UNIQUE_NAME]. Output defaults to artifacts/v2100/large-corpus inside the repository. Source text and detailed diagnostics stay in that local output directory. No candidate is loaded without both pins.'); return; }
    if (options['self-test']) { console.log(JSON.stringify(selfTest())); return; }
    const corpusFile = path.resolve(String(options.manifest || (options.corpus ? path.join(String(options.corpus), 'manifest.json') : path.join(root, 'tests/v27/fixtures/large_articles/manifest.json'))));
    if (options['provenance-only']) { const corpus = readCorpus(corpusFile, options['corpus-pin']); console.log(JSON.stringify({status: 'passed', articles: corpus.inputs.length, totalOriginalBytes: corpus.inputs.reduce((sum, input) => sum + input.item.bytes, 0), corpusManifestSha256: sha256(corpus.corpusRaw), candidateLoaded: false})); return; }
    requireHexPin(options['final-pin'], '--final-pin'); requireHexPin(options['corpus-pin'], '--corpus-pin');
    const releaseManifestFile = path.join(root, 'tests/expected_release_v2100.json'), releaseRaw = fs.readFileSync(releaseManifestFile);
    assert.equal(sha256(releaseRaw), options['final-pin'], 'Release manifest equals the explicitly relayed final pin');
    const candidate = require('./candidate.cjs'), verified = candidate.verify(), releaseManifest = JSON.parse(releaseRaw);
    assert.equal(verified.version, '2.10.0'); assert.equal(releaseManifest.runtimeVersion, '2.10.0');
    const {corpusRaw, inputs} = readCorpus(corpusFile, options['corpus-pin']);
    const run = String(options.run || 'final_' + new Date().toISOString().replace(/[:.]/g, '-')); assert(/^[A-Za-z0-9_-]+$/.test(run));
    const privateRoot = path.resolve(String(options['output-dir'] || path.join(root, 'artifacts/v2100/large-corpus'))), runDirectory = path.join(privateRoot, run);
    assert(!fs.existsSync(runDirectory), 'Refuse to overwrite previous evidence'); fs.mkdirSync(runDirectory, {recursive: true});
    const frozenDirectory = path.join(runDirectory, 'frozen_release'); fs.mkdirSync(frozenDirectory);
    const frozenFiles = {};
    for (const [name, pin] of Object.entries(releaseManifest.files)) {
        assert.equal(path.basename(name), name); const raw = fs.readFileSync(path.join(verified.dist, name)); assert.equal(raw.length, pin.bytes); assert.equal(sha256(raw), pin.sha256);
        fs.writeFileSync(path.join(frozenDirectory, name), raw); frozenFiles[name] = {bytes: raw.length, sha256: sha256(raw)};
    }
    const attempts = forbidNetwork(), core = require(path.join(frozenDirectory, 'RevisaWiki_v2_10_0.js')), complete = require(path.join(frozenDirectory, 'RevisaWiki_v2_10_0_completo.js'));
    assert.equal(core.version, '2.10.0'); assert.equal(complete.version, '2.10.0');
    const started = performance.now(), settings = {namespaceNumber: 0, authorityControl: false, endTemplateOrder: false, minorBaseConfirmed: false, autoPreview: false, registryDoiCheck: false};
    const report = {schema: 1, version: core.version, status: 'running', startedAt: new Date().toISOString(), runnerSha256: sha256(fs.readFileSync(__filename)), releaseManifestSha256: sha256(releaseRaw), corpusManifestSha256: sha256(corpusRaw), frozenFiles, articleCount: inputs.length, settings, independentNormalization: ['HTML entities decoded once in URL inventory', 'Image namespace aliases and underscores normalized', 'ISBN/ISSN separator presentation normalized', 'Gallery file namespaces normalized, captions retained', 'Table presentation attributes, whitespace, inline emphasis and ref tags excluded from cell labels; table/cell/row order and values retained'], checks: 0, passed: 0, failed: 0, networkAttempts: 0, wikipediaWrites: 0, accountAccess: false, clipboardAccess: false, screenshots: false, articles: []};
    const diagnostics = {schema: 1, failures: []};
    function save() { report.completed = report.articles.length; report.passed = report.articles.filter(row => row.passed).length; report.failed = report.completed - report.passed; writeJSON(path.join(runDirectory, 'public_report.json'), report); writeJSON(path.join(runDirectory, 'private_diagnostics.json'), diagnostics); }
    function check(row, code, callback) {
        report.checks++; row.checks++;
        try { callback(); } catch (error) { row.failures.push(code); diagnostics.failures.push({revid: row.revid, code, message: error.message, stack: error.stack}); }
    }
    for (const [index, {item, sourcePath, source}] of inputs.entries()) {
        const rowStart = performance.now(), before = inventory(source), row = {title: item.title, revid: item.revid, revisionTimestamp: item.timestamp, permalink: item.permalink, originalBytes: item.bytes, inputSha256: item.sha256, inputServerSha1: item.sha1, independentBefore: {urls: new Set(before.urls).size, images: new Set(before.images).size, identifiers: new Set(before.identifiers).size, protectedBlocks: before.protected.length, ...before.tableSummary}, checks: 0, failures: [], modes: {}};
        const outputs = {};
        for (const [mode, api] of [['core', core], ['complete', complete]]) {
            const modeStart = performance.now(), cfg = {...settings, pageTitle: item.title}, modeReport = {passed: false}; row.modes[mode] = modeReport;
            try {
                const result = api.calculate({kind: 'adjust', source, originalSource: source, options: cfg}); outputs[mode] = result;
                assert.equal(typeof result.text, 'string'); const after = inventory(result.text);
                modeReport.outputSha256 = sha256(result.text); modeReport.outputBytes = Buffer.byteLength(result.text); modeReport.deltaBytes = modeReport.outputBytes - item.bytes; modeReport.hunks = result.hunks.length; modeReport.changes = safeChanges(result.changes); modeReport.changeCount = modeReport.changes.reduce((sum, change) => sum + change.count, 0); modeReport.warningCounts = counts(result.warnings); modeReport.preservationWarningCounts = counts(result.preservation); modeReport.tableSignatureSha256 = digest(after.tables); modeReport.independentAfter = {urls: new Set(after.urls).size, images: new Set(after.images).size, identifiers: new Set(after.identifiers).size, protectedBlocks: after.protected.length, ...after.tableSummary};
                const writeOutput = mode === 'core'; if (writeOutput) { const directory = path.join(runDirectory, 'outputs'); fs.mkdirSync(directory, {recursive: true}); fs.writeFileSync(path.join(directory, String(item.revid) + '.wiki'), result.text); }
                modeReport.byteMetrics = Object.fromEntries(['before', 'after', 'delta', 'added', 'removed', 'changed', 'hunks', 'consistent', 'netExact', 'precise', 'precision'].map(key => [key, result.byteMetrics[key]]));
                check(row, mode + ':byte-accounting', () => verifyByteMetrics(result.byteMetrics, item.bytes, modeReport.outputBytes));
                check(row, mode + ':engine-preservation', () => assert.deepEqual(result.preservation, [], 'Every engine preservation warning remains an unresolved failure'));
                check(row, mode + ':independent-URLs', () => assert.deepEqual(missing(before.urls, after.urls), []));
                check(row, mode + ':independent-images', () => assert.deepEqual(missing(before.images, after.images), []));
                check(row, mode + ':independent-citation-identifiers', () => assert.deepEqual(missing(before.identifiers, after.identifiers), []));
                check(row, mode + ':independent-protected-block-multiplicity', () => assert.deepEqual(missing(before.protected, after.protected, true), []));
                check(row, mode + ':independent-tabular-numeric-rows', () => assert.deepEqual(after.numericTableRows, before.numericTableRows));
                check(row, mode + ':independent-tabular-labels', () => assert.deepEqual(after.tableLabels, before.tableLabels));
                check(row, mode + ':independent-tabular-cells-order', () => assert.deepEqual(after.tables, before.tables));
                const repeated = api.calculate({kind: 'adjust', source: result.text, originalSource: result.text, options: cfg}); modeReport.secondSha256 = sha256(repeated.text);
                check(row, mode + ':idempotence', () => assert.equal(modeReport.secondSha256, modeReport.outputSha256));
                for (const [audit, name] of [[value => api.referenceAudit(value, cfg), 'reference'], [value => api.syntaxAudit(value, cfg), 'syntax']]) {
                    const originalErrors = counts(audit(source).filter(finding => finding.severity === 'error')), outputErrors = counts(audit(result.text).filter(finding => finding.severity === 'error'));
                    modeReport[name + 'ErrorsBefore'] = originalErrors; modeReport[name + 'ErrorsAfter'] = outputErrors;
                    check(row, mode + ':no-new-' + name + '-errors', () => { for (const [code, count] of Object.entries(outputErrors)) assert(count <= (originalErrors[code] || 0), code + ': ' + (originalErrors[code] || 0) + ' -> ' + count); });
                }
                check(row, mode + ':no-unconfirmed-minor-edit', () => assert.equal(result.minorCheck.eligible, false));
                check(row, mode + ':hunks-reconstruct-output', () => assert.equal(reconstructHunks(source, result.hunks, result.text), result.text));
                check(row, mode + ':engine-composition-reconstructs-output', () => assert.equal(api.composeChanges(source, result.hunks), result.text));
                modeReport.passed = !row.failures.some(code => code.startsWith(mode + ':'));
            } catch (error) { row.failures.push(mode + ':calculation'); diagnostics.failures.push({revid: item.revid, code: mode + ':calculation', message: error.message, stack: error.stack}); }
            modeReport.milliseconds = +(performance.now() - modeStart).toFixed(2);
        }
        if (outputs.core && outputs.complete) {
            check(row, 'bundles:exact-output', () => assert.equal(sha256(outputs.core.text), sha256(outputs.complete.text)));
            for (const field of ['changes', 'warnings', 'preservation', 'byteMetrics', 'minorCheck']) check(row, 'bundles:equivalent-' + field, () => assert.deepEqual(outputs.core[field], outputs.complete[field]));
        }
        check(row, 'source:still-immutable', () => { const savedRaw = fs.readFileSync(sourcePath), compressed = item.compression === 'gzip', raw = compressed ? zlib.gunzipSync(savedRaw) : savedRaw; if (compressed) { assert.equal(savedRaw.length, item.compressedBytes); assert.equal(sha256(savedRaw), item.compressedSha256); } assert.equal(raw.length, item.bytes); assert.equal(sha256(raw), item.sha256); });
        row.passed = row.failures.length === 0; row.milliseconds = +(performance.now() - rowStart).toFixed(2); report.articles.push(row); save();
        console.log(JSON.stringify({completed: index + 1, total: inputs.length, passed: report.passed, failed: report.failed, checks: report.checks, currentRevision: item.revid, failures: row.failures}));
    }
    report.releaseStillPinned = sha256(fs.readFileSync(releaseManifestFile)) === options['final-pin'] && Object.entries(frozenFiles).every(([name, pin]) => sha256(fs.readFileSync(path.join(verified.dist, name))) === pin.sha256 && sha256(fs.readFileSync(path.join(frozenDirectory, name))) === pin.sha256);
    report.corpusStillPinned = sha256(fs.readFileSync(corpusFile)) === options['corpus-pin']; report.networkAttempts = attempts.length;
    report.finishedAt = new Date().toISOString(); report.totalMilliseconds = +(performance.now() - started).toFixed(2);
    report.status = report.articles.every(row => row.passed) && report.releaseStillPinned && report.corpusStillPinned && !attempts.length ? 'passed' : 'failed'; save();
    console.log(JSON.stringify({status: report.status, articles: report.completed, passed: report.passed, failed: report.failed, checks: report.checks, reportSha256: sha256(fs.readFileSync(path.join(runDirectory, 'public_report.json')))}));
    if (report.status !== 'passed') process.exitCode = 1;
}

if (require.main === module) { try { main(); } catch (error) { console.error(JSON.stringify({status: 'blocked-before-completion', error: String(error.message).replaceAll(root, '<local-repository>')})); process.exitCode = 1; } }
module.exports = {htmlTag, literalRanges, maskRanges, entities, urls, imageFiles, citationIdentifiers, literalContents, tableRanges, tableRows, inventory, missing, verifyByteMetrics, reconstructHunks, selfTest, readCorpus};
