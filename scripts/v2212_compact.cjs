'use strict';
// Runtime formatting only. Readable sources retain explanatory comments.
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const parser = require('@babel/parser');
const {compact, normalized} = require('./v220_compact.cjs');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const options = {sourceType: 'unambiguous', createParenthesizedExpressions: true, tokens: true};
function format(source) {
    const original = parser.parse(source, options);
    const removed = [], retained = [];
    for (const comment of original.comments || []) {
        if (/@license|\blicen[cs]e?\b|copyright|SPDX|CC[ -]BY|creativecommons\.org/i.test(comment.value)) retained.push(comment);
        else removed.push(comment);
    }
    let intermediate = source;
    for (const comment of [...removed].sort((a,b) => b.start-a.start)) {
        const raw = source.slice(comment.start, comment.end);
        intermediate = intermediate.slice(0, comment.start) + (/[\r\n\u2028\u2029]/.test(raw) ? '\n' : ' ') + intermediate.slice(comment.end);
    }
    const stripped = parser.parse(intermediate, options);
    assert.deepEqual(normalized(original.program), normalized(stripped.program), 'Comment removal changed the executable program');
    const lexemes = (ast, text) => ast.tokens.filter(token => !['CommentLine', 'CommentBlock'].includes(token.type))
        .map(token => text.slice(token.start, token.end));
    assert.deepEqual(lexemes(original, source), lexemes(stripped, intermediate), 'Comment removal changed an executable token');
    const formatted = compact(intermediate);
    const finalAST = parser.parse(formatted.code, options);
    assert.deepEqual(normalized(original.program), normalized(finalAST.program));
    const licenses = retained.map(comment => [comment.type, comment.value]);
    assert.deepEqual((finalAST.comments || []).map(comment => [comment.type, comment.value]), licenses);
    return {code: formatted.code, proof: {
        method: 'Remove only non-license comments and token-preserving whitespace; executable AST, token spelling and all license comments remain equal',
        sourceSha256: sha(source), outputSha256: sha(formatted.code), sourceBytes: Buffer.byteLength(source),
        outputBytes: Buffer.byteLength(formatted.code), removedExplanatoryComments: removed.length,
        retainedLicenseComments: licenses.length,
        executableASTSha256: sha(JSON.stringify(normalized(original.program))),
        executableTokensSha256: sha(JSON.stringify(lexemes(original, source))),
        whitespaceProof: formatted.proof
    }};
}
if (require.main === module) {
    const [input, output, receipt] = process.argv.slice(2);
    const result = format(fs.readFileSync(input, 'utf8'));
    fs.writeFileSync(output, result.code);
    if (receipt) fs.writeFileSync(receipt, JSON.stringify(result.proof, null, 2) + '\n');
}
module.exports = {format};
