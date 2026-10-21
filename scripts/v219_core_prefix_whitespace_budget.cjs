'use strict';
// Build-only formatting. The delivered program never loads this module.
const crypto = require('node:crypto');
const parser = require('@babel/parser');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const expectedContractSha256 = '17a60dcdc2292cfde596d08a2065d4394b9070799f070a0899089f2abacbd49c';
const parse = source => parser.parse(source, { sourceType: 'unambiguous', tokens: true });

function semanticTree(value) {
    if (Array.isArray(value)) return value.map(semanticTree);
    if (!value || typeof value !== 'object') return value;
    const result = {};
    for (const [key, item] of Object.entries(value)) {
        if (['loc', 'start', 'end', 'extra', 'comments', 'leadingComments',
            'trailingComments', 'innerComments', 'tokens', 'errors'].includes(key)) continue;
        result[key] = semanticTree(item);
    }
    return result;
}

function protectedLiteralSpans(ast) {
    const spans = [];
    function visit(value) {
        if (!value || typeof value !== 'object') return;
        if (Array.isArray(value)) {
            for (const item of value) visit(item);
            return;
        }
        // Protect the whole template, including lines inside its expressions.
        if (['TemplateLiteral', 'StringLiteral', 'DirectiveLiteral',
            'RegExpLiteral'].includes(value.type)) {
            spans.push({ start: value.start, end: value.end });
        }
        for (const [key, item] of Object.entries(value)) {
            if (!['loc', 'tokens', 'comments', 'leadingComments',
                'trailingComments', 'innerComments'].includes(key)) visit(item);
        }
    }
    visit(ast);
    return spans;
}

function linesOf(source) {
    const lines = [];
    const expression = /\r\n|\r|\n|\u2028|\u2029/g;
    let start = 0;
    for (let match; (match = expression.exec(source));) {
        lines.push({ start, end: match.index, separator: match[0] });
        start = expression.lastIndex;
    }
    lines.push({ start, end: source.length, separator: '' });
    return lines;
}

function unionSpans(spans) {
    const result = [];
    for (const span of [...spans].sort((a, b) => a.start - b.start || a.end - b.end)) {
        if (span.start === span.end) continue;
        const previous = result[result.length - 1];
        if (previous && span.start <= previous.end) previous.end = Math.max(previous.end, span.end);
        else result.push({ start: span.start, end: span.end });
    }
    return result;
}

function intersects(start, end, spans) {
    let left = 0, right = spans.length;
    while (left < right) {
        const middle = (left + right) >>> 1;
        if (spans[middle].end <= start) left = middle + 1;
        else right = middle;
    }
    return left < spans.length && spans[left].start < end;
}

function rawTokens(source, ast) {
    return ast.tokens.map(token => ({
        type: typeof token.type === 'string' ? token.type : token.type.label,
        raw: source.slice(token.start, token.end)
    }));
}

function rawComments(source, ast) {
    return ast.comments.map(comment => ({
        type: comment.type, raw: source.slice(comment.start, comment.end)
    }));
}

function functionHeaders(source) {
    return linesOf(source).map(line => source.slice(line.start, line.end))
        .filter(line => /^[ \t]*(?:async[ \t]+)?function\b/.test(line));
}

function formatCorePrefixWhitespace(source, completeSource, contract) {
    if (typeof source !== 'string' || typeof completeSource !== 'string' ||
        contract?.kind !== 'reviewed-generated-core-leading-whitespace-budget') {
        throw Error('Invalid generated-core whitespace budget input');
    }
    if (sha(JSON.stringify(contract)) !== expectedContractSha256) {
        throw Error('Pinned whitespace budget contract changed');
    }
    const ast = parse(source), completeBeforeSha256 = sha(completeSource);
    const tokens = ast.tokens.map(token => ({ start: token.start, end: token.end }));
    const comments = unionSpans(ast.comments.map(comment => ({ start: comment.start, end: comment.end })));
    const excluded = unionSpans([...tokens, ...comments, ...protectedLiteralSpans(ast)]);
    const edits = [];
    let savedBytes = 0, delta = 0;
    const lines = linesOf(source);
    const preservedLines = new Set(contract.preservedStatementLines);
    if (preservedLines.size !== 6 || contract.preservedStatementLines.some(statement =>
        lines.filter(line => source.slice(line.start, line.end) === statement).length !== 1)) {
        throw Error('An exact pinned inert constructor line is missing or repeated');
    }
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (savedBytes >= contract.minimumBytesSaved) break;
        if (line.start < contract.minimumUtf16Offset || line.start === line.end) continue;
        const rawLine = source.slice(line.start, line.end), prefix = /^[ \t]+/.exec(rawLine)?.[0];
        if (!prefix || prefix.length === rawLine.length || preservedLines.has(rawLine)) continue;
        const end = line.start + prefix.length;
        if (intersects(line.start, end, excluded)) continue;
        // A comment's surrounding indentation stays byte-exact too.
        if (intersects(line.start, line.end, comments)) continue;
        if (/^(?:async[ \t]+)?function\b/.test(rawLine.slice(prefix.length))) continue;
        const after = prefix.replace(/ {4}/g, '\t');
        const saved = Buffer.byteLength(prefix) - Buffer.byteLength(after);
        if (saved <= 0 || saved > contract.maximumBytesSavedPerPrefix ||
            savedBytes + saved > contract.maximumBytesSaved) continue;
        edits.push({ line: index + 1, beforeUtf16Start: line.start, beforeUtf16End: end,
            afterUtf16Start: line.start - delta, afterUtf16End: line.start - delta + after.length,
            before: prefix, after, savedBytes: saved });
        savedBytes += saved;
        delta += prefix.length - after.length;
    }
    if (savedBytes < contract.minimumBytesSaved || savedBytes > contract.maximumBytesSaved) {
        throw Error('Eligible outside-token prefixes do not meet the pinned byte budget');
    }
    let next = source;
    for (const edit of [...edits].reverse()) {
        if (next.slice(edit.beforeUtf16Start, edit.beforeUtf16End) !== edit.before) {
            throw Error('Whitespace prefix freshness failed');
        }
        next = next.slice(0, edit.beforeUtf16Start) + edit.after + next.slice(edit.beforeUtf16End);
    }
    let reversed = next;
    for (const edit of [...edits].reverse()) {
        if (reversed.slice(edit.afterUtf16Start, edit.afterUtf16End) !== edit.after) {
            throw Error('Whitespace inverse prefix freshness failed');
        }
        reversed = reversed.slice(0, edit.afterUtf16Start) + edit.before +
            reversed.slice(edit.afterUtf16End);
    }
    if (reversed !== source) throw Error('Whitespace transformation is not byte-reversible');
    const afterAst = parse(next);
    const beforeTree = JSON.stringify(semanticTree(ast)), afterTree = JSON.stringify(semanticTree(afterAst));
    if (beforeTree !== afterTree) throw Error('Generated whitespace changed the complete semantic AST');
    const beforeTokens = JSON.stringify(rawTokens(source, ast));
    const afterTokens = JSON.stringify(rawTokens(next, afterAst));
    if (beforeTokens !== afterTokens) throw Error('A JavaScript token raw byte sequence changed');
    const beforeComments = JSON.stringify(rawComments(source, ast));
    const afterComments = JSON.stringify(rawComments(next, afterAst));
    if (beforeComments !== afterComments) throw Error('A comment raw byte sequence changed');
    const beforeTerminators = JSON.stringify(lines.map(line => line.separator));
    const afterTerminators = JSON.stringify(linesOf(next).map(line => line.separator));
    if (beforeTerminators !== afterTerminators) throw Error('A line terminator changed');
    if (source.slice(0, contract.minimumUtf16Offset) !== next.slice(0, contract.minimumUtf16Offset)) {
        throw Error('The legal/header prefix changed');
    }
    if (JSON.stringify(functionHeaders(source)) !== JSON.stringify(functionHeaders(next))) {
        throw Error('A literal function declaration header changed');
    }
    if (Buffer.byteLength(source) - Buffer.byteLength(next) !== savedBytes) {
        throw Error('Whitespace byte accounting changed');
    }
    for (const statement of preservedLines) {
        if (linesOf(next).filter(line => next.slice(line.start, line.end) === statement).length !== 1) {
            throw Error('An exact pinned inert constructor line changed');
        }
    }
    const ledgerSha256 = sha(JSON.stringify(edits));
    return { source: next, edits, proof: {
        kind: 'build-only-generated-core-prefix-whitespace-AST-token-comment-parity',
        contractSha256: expectedContractSha256,
        minimumUtf16Offset: contract.minimumUtf16Offset,
        minimumBytesSaved: contract.minimumBytesSaved, maximumBytesSaved: contract.maximumBytesSaved,
        actualBytesSaved: savedBytes, prefixEdits: edits.length, ledgerSha256,
        sourceBeforeSha256: sha(source), sourceAfterSha256: sha(next),
        sourceBeforeBytes: Buffer.byteLength(source), sourceAfterBytes: Buffer.byteLength(next),
        completeBeforeSha256, completeAfterSha256: sha(completeSource),
        semanticAstBeforeSha256: sha(beforeTree), semanticAstAfterSha256: sha(afterTree),
        orderedTokenRawBytesSha256: sha(beforeTokens), orderedCommentRawBytesSha256: sha(beforeComments),
        orderedLineTerminatorsSha256: sha(beforeTerminators),
        everyTokenAndCommentRawBytePreserved: true, everyLineTerminatorPreserved: true,
        allFunctionDeclarationHeaderLinesPreserved: true,
        allSixInertConstructorLinesPreserved: true,
        inertConstructorLinesSha256: sha(JSON.stringify(contract.preservedStatementLines)),
        exactReverseSha256: sha(reversed),
        runtimeStatementsChanged: 0, sourceFullOrDataFormattingChanged: false,
        prefixCharactersOnly: 'ASCII-space-groups-of-four-to-tab', executableTokenEdits: 0,
        entireTemplateAndLiteralSpansExcluded: true, everyCommentLineExcluded: true
    } };
}

module.exports = { formatCorePrefixWhitespace };
if (require.main === module) {
    const fs = require('node:fs'), input = JSON.parse(fs.readFileSync(0, 'utf8'));
    process.stdout.write(JSON.stringify(formatCorePrefixWhitespace(
        input.source, input.completeSource, input.contract)));
}
