# Verificações da versão 2.19.0

A rodada dirigida está em `run_all.cjs`. O registro `QA_execution_registry.json` relaciona cada arquivo executável atual, incluindo os testes que precisam de uma campanha separada. Ele não é um comprovante de execução.

Para montar o projeto e executar os testes, use Node.js 24 ou posterior e npm 10 ou posterior. `@babel/parser` 7.28.5 é uma dependência de desenvolvimento declarada. O arquivo `package-lock.json` fixa também as dependências transitivas. A instalação abaixo permite executar os testes da árvore JavaScript sem `NODE_PATH` e sem depender do parser interno do Playwright. A versão declarada pode ser conferida no [registro do pacote](https://registry.npmjs.org/@babel/parser/7.28.5) e na [documentação do Babel](https://babeljs.io/docs/babel-parser).

As campanhas de navegador têm pré-requisitos separados, incluindo [Playwright](https://playwright.dev/docs/library), os aplicativos de navegador e seus drivers. `npm ci` prepara a dependência do parser, não esses ambientes de navegador.

```sh
npm ci --ignore-scripts --no-audit --no-fund
python3 scripts/build_v2190.py
node tests/v219/run_all.cjs --output=PASTA_PRIVADA_NOVA --timeout-ms=14400000
```

O limite acima é de quatro horas por arquivo da bateria, para não cortar matrizes demoradas. Ele não muda os prazos do programa instalado. Para dividir o trabalho, execute todas as partes de uma mesma configuração `--shards=N`, de `--shard=0` até `--shard=N-1`, em diretórios de saída distintos. Nenhuma parte isolada substitui o conjunto.

## Tipos de prova

- Casos dirigidos executam a ação completa com fonte, opções e resultado esperado definidos antes da execução. A repetição precisa manter o resultado.
- A matriz dos catálogos percorre campos, valores, contextos protegidos e opções desligadas. Um auxiliar isolado não substitui a ação completa.
- O conjunto de artigos reais confere revisões locais fixadas por hash, as duas distribuições, a repetição do ajuste e a preservação. Os originais e os detalhes individuais ficam privados.
- A análise independente em Python lê as fontes e os resultados sem importar o programa. Uma estrutura fora do modelo finito recebe uma limitação explícita, sem ser aprovada por omissão.
- A regressão histórica identifica por hash a revisão de cada teste executado. Uma expectativa revista precisa de origem, motivo e prova atual. Os resultados antigos conservam o status que receberam.
- Os navegadores executam a interface real em páginas locais. O núcleo separado, o arquivo completo, o Worker, o caminho alternativo, o cancelamento e o desfazer têm comprovantes próprios.

Uma contagem de verificações não é uma contagem de artigos. Execuções nos dois arquivos, segundos cliques, auxiliares e repetições não criam novas situações semânticas.

## Matrizes e artigos

As campanhas longas exigem os caminhos explícitos dos arquivos congelados e uma nova pasta de saída. O catálogo exige também seu manifesto e a captura independente das palavras mágicas nativas. A campanha de artigos recebe o manifesto das fontes capturadas. Os comandos e suas opções estão em `catalog_campaign.cjs`, `person_topic_campaign.cjs`, `action_bounded_corpus.cjs` e `historical_campaign.cjs`.

```sh
node tests/v219/catalog_campaign.cjs --core=NUCLEO --complete=COMPLETO --manifest=MANIFESTO --native-magic=CAPTURA_NATIVA --output=PASTA_PRIVADA_NOVA
node tests/v219/person_topic_campaign.cjs --core=NUCLEO --complete=COMPLETO --manifest=MANIFESTO --output=PASTA_PRIVADA_NOVA
node tests/v219/action_bounded_corpus.cjs --core=NUCLEO --complete=COMPLETO --manifest=CAPTURAS --workers=4 --output=PASTA_PRIVADA_NOVA
```

O manifesto de artigos precisa indicar revisões distintas, bytes e hashes verificados. A campanha copia os dois arquivos atuais e os dados para um conjunto congelado. Cada chamada tem limite de 60 segundos. O resultado registra também a decisão usada pelo editor, separando propostas aceitas das recusadas. Uma recusa que mantém o rascunho intacto não conta como um reparo aplicado.

As comparações com distribuições anteriores usam campanhas próprias. Um achado igual ao anterior continua sendo informado e não prova que a mudança esteja correta. Fontes indisponíveis e execuções interrompidas ficam fora dos aprovados.

A análise independente usa `mwparserfromhell` 0.7.2. Seus testes de propriedades usam Hypothesis 6.170.1. As implementações e os contratos nativos têm revisões e hashes próprios. Reusar uma captura conferida não é uma nova consulta à Wikipédia. Casos de discordância entre esse leitor e a renderização nativa podem ter um comprovante separado, limitado aos hashes exatos da fonte, do resultado e do modelo. O resultado original continua registrado. Estruturas não expandidas permanecem ambíguas. Os controles desse procedimento ficam em `exact_native_adjudication_cases.py` e não contam como novas execuções do programa.

## Resultados e privacidade

Os resultados concluídos ficam em `tests/evidence/2.19.0` e no relatório da distribuição. As contagens finais vêm dos comprovantes dos arquivos efetivamente executados. Preparação, enumeração, inspeção estática e rodadas antigas não recebem um resultado novo sem execução.

Os testes não publicam páginas nem usam contas da Wikipédia. Capturas, credenciais, perfis, nomes de editores, detalhes do computador e capturas de tela ficam fora do conjunto público. Os controles de privacidade verificam os arquivos escolhidos e o conteúdo dos pacotes.
