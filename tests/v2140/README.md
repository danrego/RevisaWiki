# Testes da versão 2.14.0

Execute a partir da raiz do repositório com Node.js 18 ou posterior e Python 3. Os comandos conferem os sete arquivos executáveis da distribuição pelo manifesto `tests/expected_release_v2140.json`. As saídas de reprodução recebem uma pasta nova em `artifacts/v2140` e não substituem os recibos da liberação.

```sh
python3 scripts/build_v2140.py
npm test
npm run test:focused
npm run test:complex
npm run test:large-articles
```

`npm test` executa a rodada principal herdada e os casos novos. `--focused` executa somente os casos novos. A matriz complexa tem oito variações em cada um de 16 artigos de pelo menos 100 KB. A rodada de artigos grandes confere as duas distribuições em 31 revisões públicas guardadas. Os arquivos de origem ficam identificados por revisão e SHA-256.

Os [testes herdados](inherited/README.md) conferem a árvore histórica antes e depois da execução, mantendo os arquivos originais intactos e registrando as adaptações de caminhos e versões. Os dois resultados alterados pela regra de espaçamento usam novos arquivos de resultado esperado, com as diferenças literais e os hashes anteriores e atuais no registro. Mudanças fora desse registro impedem a execução.

Os casos novos cobrem as correspondências de campos em quatro idiomas, as citações enciclopédicas, o alinhamento de caixas de citação, a redução de linhas vazias e o relatório. Conferem campos repetidos ou concorrentes, estruturas protegidas, opções desligadas, valores codificados, unidades, identificadores e conservação dos dados. Uma segunda execução precisa ser estável.

Os diretórios `quote_native`, `spacing_native` e os arquivos de captura das citações e infocaixas guardam projeções nativas obtidas por consultas GET anônimas. Os leitores comparam o resultado com os arquivos atuais sem fazer novas consultas. As projeções cobrem trechos sintéticos reconhecidos, sem comprovar uma análise nativa de artigos inteiros.

O [harness dos navegadores](native_browser/README.md) substitui explicitamente os testes dos recursos de comparação que saíram da interface. Mantém os controles de aplicação, desfazer, resumo, contagem e Worker, e acrescenta os casos positivos e negativos do atalho nativo. O teste intercepta o clique e não envia o formulário. O diff remoto da Wikipédia não faz parte desse ensaio.

Os resultados finais ficam em `tests/evidence/2.14.0`, vinculados aos hashes da distribuição. Casos sintéticos e permutações não contam como artigos distintos. Resultados anteriores ou preliminares não são reaproveitados como aprovação dos arquivos finais. Nenhum teste usa contas ou salva edições na Wikipédia.

## Reproduzir a verificação administrativa dos navegadores

Depois dos testes nativos, uma expectativa positiva de texto do código passou de `compareOnly` para `false`, acompanhando a retirada da comparação personalizada. A asserção sobre o rascunho conferido, os arquivos históricos e os controles negativos continuam presentes. O plano Node mudou de SHA, enquanto os módulos nativos, seus resultados e o runtime ficaram intactos.

O invólucro abaixo lê o plano atual normalmente, reconstrói o envelope anterior e exige seu SHA exato. Ele confere os 466 arquivos históricos, os 14 módulos nativos e seus bytes compilados, os recursos e arquivos do próprio teste e os sete arquivos de produção. A conferência dos resultados existentes não abre navegador nem altera seus relatórios:

```sh
node tests/v2140/native_plan_compatibility.cjs --verify-recorded --final-pin=3c728df720b522dc7e1aa92167a9e8676abbb4e382716e6ca7e6b9ecc00c18ee --report-dir=artifacts/v2140/conferencia_nativa
```

Para uma execução nova, use um diretório de resultados vazio e mantenha as dependências e os drivers descritos no roteiro nativo. Por exemplo:

```sh
node tests/v2140/native_plan_compatibility.cjs --browser=Chrome --stage=main --final-pin=3c728df720b522dc7e1aa92167a9e8676abbb4e382716e6ca7e6b9ecc00c18ee --report-dir=artifacts/v2140/reproducao_chrome
```

Use `--stage=images` em outro diretório para os 18 fluxos de imagens. `Firefox` e `Safari` também são aceitos. O invólucro fornece o envelope anterior autenticado somente à leitura administrativa inicial do lançador nativo e restaura imediatamente o leitor atual. Todas as verificações e asserções originais do lançador continuam ativas. Os arquivos em `native_browser` e seus relatórios finais permanecem imutáveis. Não execute o lançador antigo diretamente nesta combinação de planos, pois a igualdade administrativa entre o plano atual e o contemporâneo aos testes terá valores diferentes.

Os controles negativos do próprio invólucro podem ser repetidos com `node tests/v2140/test_native_plan_compatibility.cjs`, que recusa sobrescrever seu relatório anterior. Eles conferem alterações não registradas, pin inválido, bytes históricos ou nativos alterados, mudança do runtime e uso repetido da leitura transitória. Nenhum arquivo real é alterado nesses exemplos negativos.
