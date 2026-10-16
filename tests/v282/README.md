# Testes da 2.8.2

As suítes da 2.8.1 permanecem intactas em `tests/v281`. Esta pasta usa os arquivos fixados em `tests/expected_release_v282.json`, com substituições de versão e caminho registradas em `ADAPTATION_PROVENANCE.json`. As novas expectativas de reparo histórico precisam de uma explicação e de evidência própria.

```sh
node tests/v282/run_all.cjs
node tests/v282/run_engine.cjs --complex
node tests/v282/test_historical_citations.cjs
```

A suíte histórica compara as referências com um leitor independente do normalizador do programa. Ela confere a revisão atual de NBC News, os dados bibliográficos, os limites de cada registro, o segundo clique e os casos que devem permanecer intactos. A prova de renderização usa apenas consultas anônimas de leitura e compara os erros antes e depois do reparo.

Os testes de navegador usam páginas locais, respostas simuladas da API e um Worker real. Eles conferem a aplicação no rascunho, a comparação e a restauração por Desfazer. As revisões de artigos e as provas históricas mantêm os bytes e as datas registrados.

Casos sintéticos, combinações e revisões da mesma página são contagens de casos, não de artigos distintos. Os testes não entram em contas, capturam a tela, usam a área de transferência do sistema ou publicam na Wikipédia.
