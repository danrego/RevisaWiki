# Testes do RevisaWiki 2.21

Os resultados desta versão estão em [QA_SUMMARY.json](../evidence/2.21.0/QA_SUMMARY.json). O [registro de cobertura](../evidence/2.21.0/COVERAGE.json) liga cada uma das 144 fichas a uma disposição e aos testes correspondentes. Os arquivos públicos trazem totais, hashes e limites. As fontes reais completas e os perfis dos navegadores ficam locais.

## Reconstruir o programa

Com Python 3, Node.js 24 ou superior e npm 10 ou superior, na raiz do repositório:

```sh
npm ci
python3 scripts/build_v2210.py
```

O construtor confere os sete arquivos imutáveis da 2.20, os módulos novos e os valores transferidos para o catálogo. Os sete arquivos resultantes estão vinculados em `tests/expected_release_v2210.json`. A chamada fixa do common.js precisa permanecer idêntica à da versão anterior. A compactação de espaços do JavaScript confere a árvore sintática, cada token e todos os comentários antes e depois, sem renomear variáveis ou remover verificações. A transferência de valores para o catálogo é verificada separadamente. Esses controles não substituem a renderização do wikitexto no MediaWiki.

Uma reconstrução isolada pode usar outros diretórios:

```sh
python3 scripts/build_v2210.py --output artifacts/local-build/dist --manifest artifacts/local-build/manifest.json --workdir artifacts/local-build/work
```

Esse comando não atualiza o manifesto oficial nem os resultados anteriores. Use um diretório novo para cada rodada.

Os testes de navegador e algumas suítes históricas usam uma dependência oficial fixada por versão e hash. Para prepará-la, execute `npm run setup:test-dependencies`. O [guia de dependências](../DEPENDENCIES.md) também explica como usar uma cópia local já disponível, preservando a licença original.

## Contratos atuais

```sh
npm test
npm run test:documentation
npm run test:privacy
```

`npm test` executa os contratos da 2.21 em ambos os pacotes, quando aplicável. O executor copia o código para um diretório próprio, confere os hashes antes e depois e registra separadamente chamadas de cálculo, verificações e timeouts. A cobertura inclui módulos, ação completa, guarda final, opções desligadas e consultas externas fictícias.

O comando usa `tests/v221_integrity/run_current.cjs` para carregar nos subprocessos o adaptador de quatro expectativas nativas, vinculado aos hashes dos casos e do programa. Nesses casos, o resultado exigido é a conservação da fonte, com zero crédito de correção automática. As entradas, assertivas e divergências históricas permanecem registradas. O arquivo `tests/v221/run_all.cjs` conserva o executor original.

Há controles para campos nativos e importados, destinos vazios ou preenchidos, imagens concorrentes, identificadores, nomes e grupos de referências, aliases, coletores, código literal e fronteiras incompletas. Cada controle tem um resultado esperado próprio. A prova de um auxiliar não é apresentada como prova de que a interface aplicou o resultado.

O prazo por artigo continua em 60.000 ms. O orçamento total de uma suíte pode ser maior porque ela executa muitos casos. Recusas, erros e timeouts preservam o texto original. Fontes com timeout já registrado não são repetidas para tentar obter um resultado melhor.

Para escolher contratos atuais e manter os recibos em um diretório novo:

```sh
node tests/v221_integrity/run_current.cjs --output=artifacts/local-focused --tasks=composition-prerequisites,count-rule-migration
```

## Regressão histórica

```sh
npm run test:regression
npm run test:legacy-directed
```

A regressão reutiliza as entradas e as expectativas anteriores sem reescrevê-las. Uma correção nova pode contrariar uma expectativa antiga. Nesse caso, o resultado original permanece como divergência, e uma prova independente precisa demonstrar o comportamento atual, a guarda final e os casos que devem permanecer intactos. Uma divergência sem essa prova impede a aprovação.

Os resultados distinguem defeitos corrigidos, restrições de segurança e mudanças de contrato confirmadas. Os recibos de rodadas anteriores conservam seus status. Os totais de chamadas, casos e verificações não são somados como se fossem artigos distintos.

Para executar apenas uma suíte histórica:

```sh
node tests/v221/legacy_run.cjs --suite=reference_collector_cases.cjs --output=artifacts/local-collector
```

O código de saída e os recibos dessa execução descrevem as expectativas históricas brutas. Consulte a reconciliação da versão no relatório agregado para distinguir divergências já investigadas de uma falha nova. Não substitua resultados esperados apenas para fazer a execução passar.

## Fontes reais e analisador nativo

A campanha local usa as revisões congeladas da auditoria, incluindo versões anteriores e posteriores às intervenções. Cada revisão passa pelo cálculo e pela conferência final do resultado. Fontes ocultas, timeouts conhecidos, novas recusas e falhas de transporte têm estados separados. Somente o resultado aceito pode substituir o rascunho na comparação.

O WikiManager guarda fontes e resultados por hash e permite retomar uma campanha sem repetir recibos completos. As consultas de validação não publicam edições. A execução anterior é mantida quando uma correção do programa ou do teste exige uma rodada nova.

O analisador implantado de WikiLint é executado sem aplicar suas correções. As comparações usam a mesma versão, configuração e fonte. Um resultado reutilizado precisa corresponder aos mesmos bytes. Avisos novos são investigados individualmente. A análise sintática não comprova verificabilidade, notoriedade ou neutralidade do artigo.

Os testes de predefinições usam pares processados pelo MediaWiki local, com revisões e dependências registradas. Uma dependência ausente limita a prova local. Ela não é classificada automaticamente como erro do artigo ou da documentação.

## Navegadores e demonstração

Os ensaios de interface usam os navegadores instalados no Mac, páginas locais e respostas controladas para consultas públicas. Conferem a leitura do rascunho, os executores de produção, aplicação, desfazer e recusa de respostas antigas. Uma resposta fictícia não estabelece um fato sobre uma pessoa ou um artigo real.

A demonstração portátil tem 95 exemplos fictícios e usa o motor completo desta distribuição. Os testes verificam o resultado aplicável depois da guarda, incluindo a preservação do original em uma recusa. A preparação de páginas de discussão tem um caminho dedicado e provas próprias. Os exemplos herdados permanecem registrados separadamente dos exemplos novos.

As sessões de navegador não usam contas da Wikipédia, não publicam páginas e não produzem capturas de tela para o pacote público.

## Preparar uma entrega

Os construtores de documentação, demonstração e pacote exigem os hashes do código e a aprovação final dos testes. Eles conferem as entradas antes de substituir a saída. Os testes de entrega abrangem caminhos simbólicos, alterações durante a leitura, colisões e arquivos ausentes.

```sh
python3 scripts/build_delivery_docs_v2210.py
python3 scripts/build_demo_v2210.py
python3 scripts/build_package_v2210.py
```

Esses comandos não transformam uma campanha incompleta em versão aprovada. A documentação final e o ZIP só podem ser gerados quando o registro de QA corresponde ao código distribuído.
