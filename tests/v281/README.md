# Testes da 2.8.1

As suítes anteriores ficam intactas em `tests/v28`. Esta pasta adapta os seletores de versão e os destinos dos relatórios para os arquivos fixados em `tests/expected_release_v281.json`. `ADAPTATION_PROVENANCE.json` registra os hashes de origem e destino e as substituições permitidas. As novas asserções de citações ficam separadas das anteriores.

```sh
node tests/v281/run_all.cjs
node tests/v281/run_engine.cjs --complex
node tests/v281/test_citation_families.cjs
```

Os testes de citações conferem o tipo de cada referência sem usar o normalizador do programa como resultado esperado. Incluem as revisões de NBC News, modelos estrangeiros de notícias, endereços arquivados, metadados e chamadas legítimas de Citation. Casos ambíguos e exemplos protegidos precisam permanecer intactos, e um segundo clique não pode acrescentar ajustes.

O corpus adicional conserva 31 revisões de pelo menos 100 KB, nas duas distribuições. Os testes de navegador usam páginas locais, uma Worker real e respostas simuladas da API. Conferem a aplicação no rascunho, o resumo, a comparação e a restauração por Desfazer. A prova de comparação do segundo clique é gerada novamente com os arquivos finais.

Casos sintéticos, combinações e revisões da mesma página são contagens de casos, não de artigos distintos. Relatórios de execução, gramática, índice e privacidade têm seus próprios hashes. Nenhum teste entra em contas, usa a área de transferência do sistema ou publica na Wikipédia.
