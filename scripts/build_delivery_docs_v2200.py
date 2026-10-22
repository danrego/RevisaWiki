"""Write the delivery notes only after the matching final QA has passed."""
from pathlib import Path
import argparse
import json

from v220_delivery import ROOT, VERSION, STEM, DOCS, checked_manifest, checked_qa, pin


NOTES = '''RevisaWiki 2.20.0

- Amplia os reparos de referências com leitura do papel de cada parâmetro e dos blocos que exibem notas.
- Corrige casos finitos em campos de infocaixas, endereços de sites e opções de imagem, conservando os valores que têm função nativa.
- Amplia a confirmação de portais por caixas e dados explícitos, sem deduzir nacionalidade por local de nascimento ou preencher relações pessoais.
- Corrige limites inequívocos de tabelas, ligações e marcação, e reduz espaços excedentes em contextos conferidos.
- Retira propostas inadequadas de citações e conserva os campos cujo destino ainda depende de mudança na predefinição de origem.
- Mantém o rascunho quando uma proteção recusa o resultado ou quando a análise atinge 60 segundos.
- Mantém as chamadas fixas já instaladas no common.js. Atualize dados, programa e carregador central nessa ordem.

As migrações de center, font e big foram estudadas, mas não foram liberadas como novas conversões automáticas. As contraprovas mostraram diferenças de apresentação dependentes do CSS. Esses elementos precisam permanecer como estão quando não há equivalência comprovada.

O manual de funcionalidades explica as condições de cada reparo. A semelhança com um exemplo não autoriza alterar um trecho com conteúdo calculado, parâmetros concorrentes ou função diferente.
'''


def build_docs(manifest_path=None, qa_path=None):
    manifest = checked_manifest(manifest_path)
    qa = checked_qa(manifest, qa_path)
    summary = qa.get('docValidationSummary')
    paragraphs = qa.get('docValidationParagraphs')
    if not isinstance(summary, str) or not summary.strip():
        raise ValueError('The final QA needs its reviewed Portuguese validation summary')
    if not isinstance(paragraphs, list) or not paragraphs or not all(isinstance(p, str) and p.strip() for p in paragraphs):
        raise ValueError('The final QA needs reviewed validation paragraphs')
    qa_file = qa_path or ROOT / 'tests/evidence/2.20.0/QA_SUMMARY.json'
    reference = 'https://github.com/danrego/RevisaWiki'
    core = manifest['files'][f'RevisaWiki_{STEM}.js']['bytes']
    data = manifest['files'][f'RevisaWiki_{STEM}_dados.js']['bytes']
    complete = manifest['files'][f'RevisaWiki_{STEM}_completo.js']['bytes']
    validation = summary.strip() + '\n\n' + '\n\n'.join(p.strip() for p in paragraphs)
    pins = '\n\n'.join(f"{name}: {record['bytes']} bytes\nSHA-256: {record['sha256']}" for name, record in sorted(manifest['files'].items()))
    grouped = lambda value: format(value, ',').replace(',', '.')
    technical = f'''RevisaWiki {VERSION}: referência técnica

Com {grouped(core)} bytes no núcleo e {grouped(data)} bytes nos dados, a instalação separa o programa em duas partes que ficam abaixo de 2 MiB cada uma. O arquivo completo tem {grouped(complete)} bytes e serve para download, demonstração e testes locais. Ele não deve ser colado numa página .js da Wikipédia.

Os planos de reparo ficam ligados ao texto e às opções de origem. As verificações de preservação e composição continuam ativas antes da aplicação. Uma prova de outro texto, título ou contexto não autoriza alterar o rascunho atual. As regras novas não apagam um parâmetro apenas para suprimir um aviso.

As confirmações que dependem da renderização nativa usam os textos exatos comparados. Um exemplo offline não substitui essas consultas. Campos cujo leitor nativo não oferece destino equivalente permanecem intactos, incluindo relações de influência e outros dados que não podem ser deduzidos por semelhança de nomes.

Os campos nativos de sepultamento são preservados. A versão não modifica predefinições da Wikipédia para criar novos parâmetros. As propostas de mudança nas predefinições continuam separadas dos reparos locais.

O prazo do processamento separado é de 60.000 milissegundos. Ao atingi-lo, o resultado não deve substituir o rascunho. O limite conhecido em fontes excepcionalmente grandes continua documentado. Os resultados históricos, recusas e timeouts mantêm seus próprios registros e não são transformados em aprovações desta versão.

As novas conversões de center, font e big não foram liberadas. Testes de apresentação encontraram casos em que o CSS muda a equivalência aparente do código. As contraprovas ficam preservadas na validação.

As chamadas fixas do common.js permanecem idênticas às da 2.19.1. O carregador central espera {VERSION}, e programa e dados precisam declarar essa mesma versão. A identificação do editor evita converter seus objetos em JSON e preserva a proteção contra resultados de outro rascunho.

{validation}

ARQUIVOS DO PROGRAMA

{pins}

QA_SUMMARY.json, SHA-256: {pin(qa_file)['sha256']}

Os arquivos e os comprovantes públicos estão em {reference}. A relação de funcionalidades descreve os limites de cada regra. Casos de auxiliares e execuções repetidas ficam separados das contagens de artigos e situações distintas. Testar a distribuição completa e a distribuição em partes não duplica o total de casos.
'''
    report = f'''RevisaWiki {VERSION}: resultados dos testes

{validation}

O prazo de 60 segundos e as verificações de preservação permanecem ativos. Timeouts e recusas são registrados separadamente. Os resultados de versões anteriores continuam nos relatórios de origem, sem serem contabilizados como execuções novas.

As migrações novas de center, font e big não foram liberadas após as contraprovas de apresentação. Testar uma possibilidade não significa incluí-la no programa.

Os testes de interface usam páginas locais. A demonstração usa exemplos fixos e não comprova as consultas externas de confirmação em um artigo real. Nenhuma edição foi feita na Wikipédia durante a validação.

ARQUIVOS EXECUTADOS

{pins}

QA_SUMMARY.json, SHA-256: {pin(qa_file)['sha256']}
Comprovantes e código: {reference}
'''
    first = f'''RevisaWiki {VERSION}

Abra INICIO.html para copiar os arquivos completos, os destinos e os resumos. Atualize dados, programa, carregador central e documentação nessa ordem. Se já usa a chamada fixa no common.js, mantenha esse bloco.

Para experimentar, abra Demonstracao_RevisaWiki_{STEM}.html. Os exemplos usam o mesmo motor desta distribuição e incluem correções e casos que devem ficar intactos. A demonstração funciona offline e não faz as consultas necessárias para algumas confirmações em artigos reais.

Use os arquivos separados de dados e programa para a instalação. RevisaWiki_{STEM}_completo.js ultrapassa o limite por página da ptwiki e serve somente para uso local e testes.

{summary.strip()}

O índice, o pacote e a demonstração não publicam na Wikipédia. Confira a comparação e a pré-visualização no editor antes de salvar uma edição.

Código e arquivos: {reference}
'''
    outputs = {
        f'Notas_da_versao_RevisaWiki_{STEM}.txt': NOTES + '\n' + summary.strip() + '\n',
        f'Referencia_tecnica_RevisaWiki_{STEM}.txt': technical,
        f'Relatorio_testes_RevisaWiki_{STEM}.txt': report,
        f'Resumo_atualizacao_RevisaWiki_{STEM}.txt': 'Atualização do RevisaWiki para 2.20.0: reparos de referências, infocaixas, imagens, tabelas e espaços com verificações de preservação.\n',
        f'Resumo_documentacao_RevisaWiki_{STEM}.txt': 'Atualização da documentação do RevisaWiki para 2.20.0, com funcionalidades, limites, instalação e resultados da validação.\n',
        'LEIA_PRIMEIRO.txt': first,
    }
    DOCS.mkdir(parents=True, exist_ok=True)
    for name, content in outputs.items():
        (DOCS / name).write_text(content, encoding='utf-8')
    return {'version': VERSION, 'files': sorted(outputs), 'qaSummarySha256': pin(qa_file)['sha256'], 'wikipediaWrites': 0}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--qa', type=Path)
    args = parser.parse_args()
    print(json.dumps(build_docs(args.manifest, args.qa), ensure_ascii=False))


if __name__ == '__main__':
    main()
