# Testes da versão 2.18

Os casos executam os arquivos reais das distribuições modular e completa, sem inserir auxiliares no programa. As entradas públicas são fictícias. As fontes, os títulos e os resultados individuais do corpus ficam em uma pasta privada explícita. Nenhum teste salva páginas na Wikipédia.

## Casos novos

- `prose_gap_cases.cjs` confere linhas vazias consecutivas, inclusive linhas contendo somente espaços ou tabulações. Testa referências completas no parágrafo e limites finais reconhecidos, preservando a indentação, listas, tabelas, valores de predefinições, citações, código e poemas. Também confere a composição com o coletor nativo de referências.
- `reference_layout_cases.cjs` confere a apresentação responsiva nativa das referências e a retirada do conjunto exato de estilos fixos anteriormente acrescentado pelo programa. Estilos próprios, argumentos posicionais e conteúdo das fontes precisam permanecer intactos. A regra de seis itens das listas finais é verificada separadamente.
- `citation_island_cases.cjs` confere citações completas em páginas com outros trechos incompletos, os limites de contexto, comentários completos, campos de estado ou acesso conferidos e a composição com o restante do cálculo. O trecho de uma citação não perde proteção apenas por parecer completo isoladamente.
- `source_coverage_cases.cjs` executa os casos da matriz de 241 regras do código de referência. A matriz separa reparos cobertos, ajustes acrescentados, escolhas válidas preservadas e diferenças ainda sem comprovação suficiente. Datas e nomes de campos recebem verificações de valores, conflitos e precedência.
- `legacy_markup_cases.cjs` confere espaços horizontais entre pontuação e referências ativas, uma barra invertida em quebras de linha sem atributos e rótulos finais envolvidos em chamadas sem argumentos. Exemplos, parâmetros, comentários, chamadas com argumentos e outras estruturas protegidas permanecem iguais.
- `independent_cases.cjs` confere as ampliações em conjunto, incluindo composição, preservação, repetição da execução e decisões sobre edição menor.

```sh
node tests/v218/run_all.cjs --focused --extra=source_coverage_cases.cjs --extra=independent_cases.cjs --extra=legacy_markup_cases.cjs
```

Cada suíte compara os mesmos arquivos publicados e precisa conservar o resultado numa segunda execução. As verificações incluem contagem, resumo da edição, composição e proteção das fontes. Corrigir um campo antes ignorado pode fazer dados aparecerem e não autoriza, por si só, a marcação automática de edição menor.

## Comparação com o código de referência

`source_coverage_inventory.json` guarda a revisão de origem, o hash e as 241 regras examinadas. O teste aceita uma cópia local exata desse código em `REVISAWIKI_ORIGINAL_SOURCE`. Com essa variável, também executa as substituições puras do código original e registra `originalPureExecution: true`. Não baixa o código durante a execução.

```sh
REVISAWIKI_ORIGINAL_SOURCE=ARQUIVO_LOCAL_CONFERIDO node tests/v218/run_all.cjs --extra=source_coverage_cases.cjs --extra=independent_cases.cjs --extra=legacy_markup_cases.cjs
```

Esse comando corresponde a 71 invocações explícitas, seis suítes novas nas duas distribuições e 65 invocações históricas. O comprovante final da versão exige a execução original das 241 regras, os resultados individuais vinculados e os hashes das fontes. Sem a cópia original conferida, a execução dos exemplos não comprova essa comparação adicional.

`editorial_pattern_audit.json` e `reported_case_audit.json` registram as diferenças estudadas de forma anônima. Uma preferência de edição não vira regra automática apenas por ter sido aplicada por outra pessoa. Os documentos separam os reparos comprovados das decisões editoriais e dos casos preservados.

Os 241 itens tratam de substituições no texto de artigos. `feature_coverage_audit.json` separa esse conjunto das outras funções do programa de origem. Os exemplos executáveis adicionais conferem prefixos em famílias confirmadas no catálogo, sem se somarem às 71 invocações. A abertura em lote por categorias ou afluentes, o fluxo do editor visual e a integração com wikEd não são funcionalidades do RevisaWiki. A conferência dessas funções no código de origem não é contada como teste novo nos navegadores. Os adaptadores atuais atendem aos editores de código-fonte clássico, CodeMirror e de 2017.

## Suítes anteriores

`previous.cjs` executa as verificações históricas da 2.17, da 2.16, da 2.15.1 e da 2.15.0. A adaptação em memória troca somente endereços dos arquivos e rótulos de distribuição. Conserva as entradas e as asserções originais. O comprovante registra os hashes do teste de origem e do texto executado.

```sh
node tests/v218/run_all.cjs --previous-only
node tests/v218/previous.cjs v217 reference_table_cases
node tests/v218/previous.cjs v216 field_value_cases
```

As expectativas históricas de interface mantêm sua origem. Os casos próprios do relatório continuam comparando a interface com a referência documentada da 2.16. Uma simples troca do número de versão não transforma uma expectativa antiga numa prova nova.

## Comparações nativas

Os arquivos em `native/` guardam exemplos fictícios, revisões de implementação e hashes das respostas usadas na comparação. Os comprovantes explicam as diferenças esperadas e os conteúdos que precisam permanecer iguais. As respostas completas e o HTML temporário ficam locais.

A conversão de um rótulo final exige uma chamada literal sem argumentos na seção inteira. O comprovante da bibliografia acompanha o caminho de chamada até o retorno vazio anterior à consulta de entidade. O comprovante da remissão acompanha a lista numérica vazia até o erro nativo por falta de página. Uma chamada com argumentos pode exibir conteúdo e permanece intacta.

## Navegadores locais e índice de cópia

`alert_ui_probe.cjs` executa Chrome, Firefox ou Safari instalado numa página local de edição simulada. Confere o relatório, um Worker real, as ocorrências agrupadas e as escolhas que continuam disponíveis. Um erro controlado de pré-visualização precisa recusar a mudança e recuperar o texto de origem. O filtro do relatório não pode mudar o código calculado.

```sh
node tests/v218/alert_ui_probe.cjs --browser=chrome dist/2.18.0/RevisaWiki_v2_18_0.js dist/2.18.0/RevisaWiki_v2_18_0_completo.js
```

Use `firefox` ou `safari` para os outros navegadores. O Safari precisa permitir automação remota. Os testes de navegador exigem Node.js 22 ou posterior e os aplicativos correspondentes. As sessões pertencem aos testes. As páginas impedem envio de formulários e requisições de escrita, sem conta conectada ou capturas de tela.

Depois de gerar o pacote final, `index_probe.cjs` retoma os 32 casos do índice com os endereços da 2.18. Confere os conteúdos completos, os destinos, os resumos, os downloads e o encaixe dos cartões. A ordem de atualização é dados, programa, carregador central e documentação. A chamada fixa do common.js mantém os bytes anteriores. A cópia usa um destino simulado e não modifica a área de transferência do sistema.

## Corpus privado

`corpus.cjs` recebe um manifesto explícito de revisões públicas guardadas e uma pasta privada de saída. A coleta é separada. A execução não baixa páginas nem consulta contas e confere os hashes de cada fonte antes do cálculo.

```sh
node tests/v218/corpus.cjs --manifest=MANIFESTO_PRIVADO --output=PASTA_PRIVADA_NOVA --core=dist/2.18.0/RevisaWiki_v2_18_0.js --complete=dist/2.18.0/RevisaWiki_v2_18_0_completo.js --phase=final --core-sha=SHA_DO_NUCLEO --complete-sha=SHA_DO_COMPLETO --baseline=dist/2.17.0/RevisaWiki_v2_17_0.js --baseline-complete=dist/2.17.0/RevisaWiki_v2_17_0_completo.js
```

O teste compara as duas distribuições, a segunda execução, a preservação e a composição. Compara também os planos atuais de revisão das duas distribuições, separando páginas conferidas daquelas sem medição disponível. Essa comparação não mede redução de avisos em relação à versão anterior.

A 2.17 só é executada quando há um resultado atual que precisa de classificação. Uma falha anterior exige a mesma impressão digital para ficar separada de uma regressão nova. O agregado confere todos os arquivos e recusa fontes ausentes, resultados incompletos ou totais incompatíveis. Executar um caso nas duas distribuições não cria dois artigos distintos.

## Construção, comprovantes e documentação

`python3 scripts/build_v2180.py` parte dos sete arquivos fixados da 2.17.0 e aplica os módulos de `src/v2_18`. Use Node.js 18 ou posterior e informe `REVISAWIKI_NODE` ou `--node` quando necessário. Os arquivos históricos permanecem intactos.

`rebuild_probe.py` reconstrói os sete executáveis e os oito catálogos numa pasta temporária e compara todos os bytes. Confere os auxiliares incorporados, os módulos e os números de revisão dos contratos nativos. Os arquivos atuais não são modificados.

`summarize_v2180.py` lê somente os comprovantes declarados em `artifacts/v2180/QA_INPUTS.json`. A lista informa o manifesto exato, cada execução, os vínculos dos navegadores, os testes das ferramentas e o agregado do corpus. A execução finita exige as 71 invocações previstas, os resultados originais, os hashes das fontes e seu `verification.json`. Recibos ausentes, duplicados, adulterados ou pertencentes a outros arquivos impedem a conclusão.

`verify_execution_v2180.py` confere os arquivos congelados, os resultados originais e o relatório completo das suítes históricas que imprimem apenas um resumo. Reproduz os hashes do código histórico executado com a lista exata de trocas de endereços e versões, confere as fontes arquivadas e os registros locais, e só então escreve `verification.json`.

`document_v2180.py` só escreve os oito documentos depois da aprovação de `DOCUMENTATION_SCOPE.json` e da conclusão de `QA_SUMMARY.json` com os hashes finais. Os números vêm dos comprovantes completos. As entradas históricas das versões anteriores permanecem idênticas em bytes.

`package_v2180.py` confere a lista exata dos arquivos, os catálogos, a cópia completa da documentação e o índice antes de gerar o pacote. `audit_documentation_v2180.py` confere o manual, a instalação, o histórico preservado, os limites das regras e a correspondência dos conteúdos copiáveis.

`publish_evidence_v2180.py` valida novamente todos os resultados originais e seus vínculos antes de gerar resumos públicos anônimos. Os resumos incluem totais, hashes e arquivos executados. Os comprovantes originais, as coordenadas dos casos, os resultados individuais do corpus e os registros de execução ficam locais. A matriz de regras, os testes públicos e os exemplos fictícios das provas nativas permitem reproduzir as verificações sem publicar essas informações.

Depois da documentação final, os arquivos e o conteúdo do pacote passam pela conferência de privacidade. Credenciais, perfis de navegador, imagens da tela, caminhos locais e dados do corpus privado ficam fora da publicação.
