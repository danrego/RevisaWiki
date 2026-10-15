const qa = require('./harness.cjs');
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const api = qa.api;
let passed = 0;
const failures = [];
function test(label, fn) {
    try { fn(); passed++; } catch (error) { failures.push({label, error: error.message}); }
}
function author(value, key = 'autor', extra = '') {
    return api.cleanup('{{Citar livro|' + key + '=' + value + extra + '|título=Livro|url=https://example.org}}');
}
const authorProposals = result => result.suggestions.filter(x => x.label.startsWith('Separar uma lista'));
for (const name of [
    'Human Sciences Research Council. Group: Democracy and Governance',
    'Department of Research and Development', 'Instituto de Pesquisa e Desenvolvimento',
    'Conselho Nacional de Ciência e Tecnologia', 'Universidade de São Paulo e Universidade de Coimbra',
    'Université de Paris et Centre National de Recherche', 'Society for Research and Development',
    'Agência Reuters e Associated Press', 'John Wiley & Sons', 'Johnson & Johnson',
    'Research Group; Editorial Board', 'Silva Foundation; Costa Institute',
    'Inland Revenue and HM Treasury', 'New York Times and Washington Post',
    'British Library and National Museum', 'Biblioteca Nacional e Museu Nacional',
    'Judson, Horace', 'García Márquez, Gabriel José', 'Martin Luther King, Jr.',
    'Silva, João', 'Doe, John, Jr.', 'Merriam and Webster', 'Gilbert and George'
]) {
    test('Preserve unsplit author: ' + name, () => {
        const r = author(name);
        assert.equal(r.text, '{{Citar livro|autor=' + name + '|título=Livro|url=https://example.org}}');
        assert.equal(authorProposals(r).length, 0);
        assert.equal(api.cleanup(r.text).text, r.text);
    });
}
for (const [value, names] of [
    ['Ana Silva and Bruno Costa', ['Ana Silva', 'Bruno Costa']],
    ['Anne-Marie D\'Angelo & João da Silva', ['Anne-Marie D\'Angelo', 'João da Silva']],
    ['Silva, Ana and Costa, Bruno', ['Silva, Ana', 'Costa, Bruno']],
    ['Ana Silva e Bruno Costa', ['Ana Silva', 'Bruno Costa']],
    ['Aborghetti HP, Collin SM, dos Santos JD', ['Aborghetti HP', 'Collin SM', 'dos Santos JD']]
]) {
    for (const key of ['autor', 'editor', 'vautores', 'veditores']) {
        test('Explicit personal-name review: ' + key + ' ' + value, () => {
            const r = author(value, key), suggestions = authorProposals(r);
            assert.equal(suggestions.length, 1);
            assert.ok(r.text.includes('|' + key + '=' + value), 'Automatic pass changed the list');
            const out = api.applySuggestion(r.text, suggestions[0], 0);
            const base = key.includes('editor') ? 'editor' : 'autor';
            for (const [i, name] of names.entries()) assert.ok(out.includes('|' + base + (i ? i + 1 : '') + '=' + name));
        });
    }
}
test('Explicit semicolons between inverted personal names', () => {
    assert.equal(author('Silva, Ana; Costa, Bruno').text,
        '{{Citar livro|autor=Silva, Ana|título=Livro|url=https://example.org|autor2=Costa, Bruno}}');
});
for (const extra of ['|autor2=Maria Sousa', '|último=Silva|primeiro=Ana', '|editor2=Maria Sousa']) {
    test('Keep existing name fields: ' + extra, () => {
        const k = extra.includes('editor') ? 'editor' : 'autor';
        assert.equal(authorProposals(author('Ana Silva and Bruno Costa', k, extra)).length, 0);
    });
}
test('Protected author examples', () => {
    const s = '<nowiki>{{Citar livro|autor=Ana Silva and Bruno Costa}}</nowiki>';
    const r = api.cleanup(s); assert.equal(r.text, s); assert.equal(authorProposals(r).length, 0);
});
test('Definitions inside infoboxes are not missing references', () => {
    const s = '{{Info/Biografia|nome=Ana|notas=<ref name="x">Fonte</ref>}}\nTexto.<ref name="x" />\n{{Referências}}';
    const r = api.cleanup(s);
    assert.equal(r.text, s); assert.ok(!r.warnings.some(x => /sem definição/.test(x)));
});
test('Missing reference in a different group still warned', () => {
    const r = api.cleanup('{{Info/Biografia|notas=<ref name="x" group="nota">Nota</ref>}}\nTexto.<ref name="x" />');
    assert.ok(r.warnings.some(x => /sem definição/.test(x)));
});
for (const [key, profile] of Object.entries(api.infoboxCatalog)) {
    for (const parameter of profile.accepted) {
        test('Accepted field preserved: ' + key + ' ' + parameter, () => {
            const s = '{{' + profile.title + '|' + parameter + '=VALUE}}';
            const r = api.cleanup(s, {review: false});
            assert.equal(r.text, s);
            assert.ok(!r.warnings.some(x => /não reconhecido/.test(x)));
        });
    }
    for (const target of Object.values(profile.renames)) {
        test('Verified rename target exists: ' + key + ' ' + target, () => assert.ok(profile.accepted.includes(target)));
    }
    test('Unknown field value retained: ' + key, () => {
        const s = '{{' + profile.title + '|campo_futuro=VALOR IMPORTANTE}}';
        const r = api.cleanup(s);
        assert.equal(r.text, s);
        if (profile.partial) assert.ok(!r.suggestions.some(x => x.label.includes('campo_futuro')));
        else assert.ok(r.warnings.some(x => /não reconhecido/.test(x)));
    });
}
test('Country parameter family from Lua checker pattern', () => {
    const s = '{{Info/País|vice123=VALUE|ref_pop27=VALUE}}';
    const r = api.cleanup(s);
    assert.equal(r.text, s); assert.ok(!r.warnings.some(x => /não reconhecido/.test(x)));
    assert.ok(!r.suggestions.some(x => /vice123|ref_pop27/.test(x.label)));
});
test('Astronaut inherits biography fields through wrapper', () => {
    const s = '{{Info/Astronauta|nome=Ana|nascimento_data=VALUE|tempo_AEV=VALUE}}';
    const r = api.cleanup(s);
    assert.equal(r.text, s); assert.ok(!r.warnings.some(x => /não reconhecido/.test(x)));
});
for (const [article, subdir, revision] of [
    ['Pillay', 'practical_pillay_audit', 73182716],
    ['Nobel', 'practical_nobel_audit', 73182630]
]) {
    test('Live test snapshot remains unchanged: ' + article, () => {
        const s = fs.readFileSync(path.resolve(__dirname, 'fixtures/' + subdir + '/revision_' + revision + '.wiki'), 'utf8');
        if(article==='Pillay') {
            assert.equal(require('node:crypto').createHash('sha256').update(s).digest('hex'),'e76889dc68dceb66ac61f5054ad972bc8180dab6c30d99314487f18226039dad');
            assert.equal(s.split('<ref name="ohchr22" /><ref name="ohchr22" />').length-1,1);
        }
        const expected=article==='Nobel'?s.replace('Alfred Nobel mantinha laboratórios para experiências de fisiologia.]]','Alfred Nobel mantinha laboratórios para experiências de fisiologia]]').replace('em Edimburgo.]]','em Edimburgo]]').replace('em 1947.]]','em 1947]]').replace('a Assembleia Nobel soubesse de sua morte.]]','a Assembleia Nobel soubesse de sua morte]]').replace('em entrevista coletiva.]]','em entrevista coletiva]]'):article==='Pillay'?s.replace('<ref name="ohchr22" /><ref name="ohchr22" />','<ref name="ohchr22" />'):s;
        const r = api.cleanup(s,{endMatterColumns:false,referenceColumns:false,automaticIdenticalReferences:false}); assert.equal(api.cleanup(s,{unifiedNotesReferences:false,endMatterColumns:false,referenceColumns:false,automaticIdenticalReferences:false}).text,expected);
        assert.equal(r.text,article==='Nobel'?expected.replace('{{Notas}}\n\n{{Referências}}','{{Notas e referências}}'):expected);
        assert.equal(authorProposals(r).length, 0);
        assert.ok(!r.warnings.some(x => /Nobel2026.*sem definição/.test(x)));
    });
}
const report = {passed, failed: failures.length, failures: failures.slice(0, 20)};
fs.writeFileSync(path.join(__dirname, 'regression_results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
process.exitCode = failures.length ? 1 : 0;
