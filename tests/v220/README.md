# Verificações da versão 2.20.0

A reconstrução usa os arquivos imutáveis da 2.19.1 e os fragmentos de `src/v2_20`. O manifesto fixa os sete arquivos resultantes e as fontes da montagem. A compactação do núcleo conserva a árvore sintática, os tokens, os comentários e os valores literais. O arquivo completo permanece legível e serve para testes e download.

Use Python 3, Node.js 24 ou posterior e npm 10 ou posterior:

```sh
npm ci --ignore-scripts --no-audit --no-fund
python3 scripts/build_v2200.py
npm test
```

`npm test` executa as 224 suítes de regressão e, depois, os controles dirigidos da 2.20. As campanhas longas e os navegadores são executados separadamente. Os comprovantes finais estão em `tests/evidence/2.20.0`. Um registro de casos planejados não é um comprovante de execução.

## Controles dirigidos e histórico

`legacy_run.cjs` executa as suítes anteriores contra as distribuições atuais. Os arquivos antigos não são reescritos. O adaptador troca somente os destinos dos arquivos, uma indicação de versão e os pontos de instrumentação de espaços da compactação. Sete suítes têm adaptações próprias, com registro de origem. Duas delas conservam as chamadas de imagem sem dimensão explícita, pois separar o nome do arquivo pode ativar o tamanho padrão da infocaixa. Esses casos são controles de preservação, sem crédito de reparo automático. Cada suíte acrescenta um positivo separado com dimensão de 220px e texto alternativo, acompanhado dos controles com opção desligada e trechos protegidos. A derivação completa fica em `bio_legacy_image_derivation.json` e é conferida por `bio_legacy_image_governance.cjs`. Os dois testes históricos e seus resultados anteriores permanecem intactos. A sétima derivação, em `native_image_caption_cases.cjs`, mantém 548 cenários do teste anterior exatamente como estavam e conserva 104 chamadas sem dimensão na imagem, sem contá-las como reparos. Acrescenta 32 positivos com 250px explícitos, 160 controles com opções desligadas ou trechos protegidos e 12 conflitos de tamanho, legenda ou texto alternativo. O registro `native_image_caption_derivation.json` fixa as respostas esperadas antes da execução. `native_image_caption_governance.cjs` reconstrói o registro antigo, confere os hashes e verifica cada diferença declarada. A prova nativa antiga de um arquivo sem dimensão continua válida para aquele caso. Ela não comprova equivalência de tamanho em todos os arquivos ou consumidores. A falha da expectativa antiga na rodada atual fica preservada, e a derivação é executada separadamente. Nove resultados finais mudam apenas porque a regra nova retira linhas vazias do início. Esses nove casos ficam declarados em `approved_endpoint_changes.json`.

`directed_run.cjs` executa os planos e a ação completa das frentes novas. As fontes, opções e respostas esperadas dos controles são escritas antes da execução. Os exemplos protegidos, os valores concorrentes, as provas antigas e os parâmetros válidos também precisam manter seus resultados previstos. Testes de um leitor isolado permanecem separados dos que comprovam um ajuste aplicado ao artigo.

Para dividir a regressão, execute todas as partes de uma mesma configuração. Cada parte recebe uma pasta nova. Uma parte isolada não substitui a campanha inteira. O processo que reúne uma suíte tem até quatro horas para percorrer seus casos. Esse prazo do teste não altera o limite de 60 segundos de cada análise de artigo. Use `--timeout-ms` somente para controlar o processo da suíte.

```sh
node tests/v220/legacy_run.cjs --dist=DISTRIBUICAO --shards=4 --shard=0 --timeout-ms=14400000 --output=PASTA_PRIVADA_NOVA
node tests/v220/directed_run.cjs --dist=DISTRIBUICAO --output=OUTRA_PASTA_PRIVADA_NOVA
```

## Catálogos, biografias e artigos reais

As campanhas de catálogos usam os contratos independentes da 2.19, além das palavras mágicas nativas capturadas e conferidas por hash. Os testes da 2.20 acrescentam limites de campos, donos de valores, contextos incompletos e opções desligadas. Repetir o mesmo caso nos dois arquivos não cria duas situações semânticas distintas.

```sh
node tests/v220/catalog_campaign.cjs --core=NUCLEO --complete=COMPLETO --manifest=MANIFESTO_RUNTIME --native-magic=CAPTURA_NATIVA --output=PASTA_PRIVADA_NOVA
node tests/v220/person_topic_campaign.cjs --core=NUCLEO --complete=COMPLETO --manifest=MANIFESTO_RUNTIME --output=OUTRA_PASTA_PRIVADA_NOVA
node tests/v220/action_bounded_corpus.cjs --core=NUCLEO --complete=COMPLETO --manifest=MANIFESTO_FONTES --workers=8 --output=OUTRA_PASTA_PRIVADA_NOVA
```

O manifesto dos artigos fixa a revisão, os bytes e o hash de cada fonte. A campanha confere o texto aplicado, a repetição e as verificações de preservação nos dois arquivos. Uma recusa que protege o rascunho não é contada como reparo aplicado. Fontes com timeout já conhecido ficam excluídas de novas repetições e conservam seus registros anteriores. Cada chamada mantém o limite de 60 segundos.

O observador independente em Python usa `mwparserfromhell` 0.7.2 e não importa o RevisaWiki. Ele lê as fontes e os resultados reais para comparar referências, tabelas, ligações, imagens e trechos protegidos. Casos fora de seu modelo finito continuam ambíguos. Uma confirmação nativa suplementar precisa vincular os hashes exatos e explicar sua limitação, sem substituir o status do relatório original.

## Navegadores e entrega

Os testes nativos usam Chrome, Firefox e Safari em páginas locais. Executam o núcleo e o arquivo completo, o Worker e o caminho alternativo, os adaptadores de editor, resultados antigos, objetos circulares, cancelamento e desfazer. Os controles de timeout esperam o prazo real e conferem o rascunho inteiro, o resumo e a escolha de edição menor. Também verificam se a pessoa pode continuar digitando e executar outra análise.

Esses testes precisam de [Playwright](https://playwright.dev/docs/library), dos navegadores e de seus drivers. `npm ci` instala o parser JavaScript, não esses componentes. O driver permite indicar a biblioteca por `REVISAWIKI_PLAYWRIGHT`. O Safari precisa estar com a automação remota habilitada. Use uma sessão por vez e encerre apenas as janelas de automação que pertencem ao teste.

O índice e a demonstração recebem os bytes do mesmo manifesto qualificado. Os controles de entrega verificam os arquivos copiados, os destinos, a ordem de atualização, os limites por página e o conteúdo do ZIP. O arquivo completo não é oferecido como uma página de instalação na Wikipédia.

Os empacotadores também têm controles com arquivos fictícios, que não qualificam o programa real. A auditoria documental usa a distribuição final e recusa prévias, destinos incorretos, resumos divergentes e mudanças nos bytes do histórico publicado.

```sh
python3 tests/v220/delivery_tools.py
python3 tests/v220/documentation_audit_cases.py
npm run test:documentation
```

O último comando exige o manifesto, o QA final aprovado e o índice da distribuição já preparados. Ele grava sua própria conferência em `artifacts/v220/documentation_audit.json`. `npm run test:regression` usa as suítes contra a 2.20. Os comandos `test:historical219` e `test:hotfix` conservam, respectivamente, a campanha histórica e a correção anterior.

As rodadas interrompidas, os erros de preparação, as recusas e as falhas anteriores mantêm seus comprovantes. Os totais finais distinguem artigos, situações sintéticas, repetições, verificações e fluxos de navegador. Nenhum teste salva uma edição na Wikipédia.

## Privacidade

Os relatórios públicos contêm totais, contratos e hashes. As capturas completas dos artigos, os nomes de editores, as credenciais, os caminhos do computador e os perfis de navegador ficam fora da publicação. Não são feitas capturas de tela do computador. A conferência final inclui os arquivos escolhidos, os metadados do Git e o conteúdo dos pacotes.
