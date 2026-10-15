from pathlib import Path


def apply(source):
    before = '''    // Estes nomes foram conferidos no Módulo:Avaliação/Marcas. Um portal
    // existente, por si só, não confirma a existência de uma marca de projeto.
    // https://pt.wikipedia.org/w/index.php?oldid=73060837'''
    after = '''    // Nomes conferidos no registro de marcas e na resolução por projeto ou
    // portal do Módulo:Avaliação. Tecnologia usa o Portal:Tecnologia existente.
    // https://pt.wikipedia.org/w/index.php?oldid=73060837
    // https://pt.wikipedia.org/w/index.php?oldid=73060844'''
    assert source.count(before) == 1
    source = source.replace(before, after)
    before = "        'física':'Física','matemática':'Matemática','política':'Política',"
    after = before + "\n        'ciência':'Ciência','ciencia':'Ciência','tecnologia':'Tecnologia',"
    assert source.count(before) == 1
    source = source.replace(before, after)
    start = source.index('    async function prepareTalkHeader() {')
    end = source.index('    function personalConfig()', start)
    source = source[:start] + Path(__file__).with_name('create_talk_code_ui.js').read_text() + '\n' + source[end:]
    before = "actions.append(control('Preparar discussão',prepareTalkHeader,'ajg-prepare-talk','Preparar PD e marcas dos projetos confirmados nos portais do artigo, sem publicar.','prepare-talk'))"
    after = "actions.append(control('Criar código',prepareTalkHeader,'ajg-prepare-talk','Criar PD e marcas de projeto no código da discussão, com opção de desfazer. Não publica a página.','create-talk-code'))"
    assert source.count(before) == 1
    return source.replace(before, after)
