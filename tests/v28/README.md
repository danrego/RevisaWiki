# Testes da 2.8.0

As suítes da 2.7.3 permanecem em `tests/v273`. As cópias desta pasta executam as mesmas asserções nos arquivos fixados em `tests/expected_release_v280.json`. O manifesto `ADAPTATION_PROVENANCE.json` registra as substituições de versão, os caminhos dos relatórios e os hashes de origem e destino. As revisões de artigos copiadas para esta pasta mantêm os bytes originais.

```sh
node tests/v28/run_all.cjs
node tests/v28/run_engine.cjs --complex
```

Os testes novos ficam em `test_biography_fields.cjs`, `test_biography_dates.cjs` e `test_multiple_marriages.cjs`. Eles conferem imagens, parâmetros, sites, profissões, negrito no cabeçalho, datas e casamentos separados. Cada conversão precisa preservar os demais dados e referências, recusar entradas ambíguas e terminar no primeiro clique. `test_biography_composition.cjs` confere a combinação dos recursos e recusa alterações de nomes, datas, legendas e profissões mesmo quando as referências permanecem.

O corpus adicional usa as 31 revisões de pelo menos 100 KB preservadas em `tests/v27/fixtures/large_articles`. Execute `run_edited_corpus.cjs` com os hashes SHA-256 completos dos dois manifestos, nos argumentos `--final-pin` e `--corpus-pin`. Escolha um nome novo em `--run` para não substituir uma execução anterior.

Os fluxos locais dos navegadores ficam em `browser`. Eles usam o Chrome, o Firefox e o Safari instalados no Mac, com respostas simuladas da API, Worker real, segundo clique e restauração por Desfazer. As provas públicas históricas de renderização são preservadas com suas datas e hashes. `build_second_click_contract.cjs` gera a prova de comparação a partir dos executáveis finais desta versão.

Casos sintéticos, permutações e revisões da mesma página são contagens de casos, não de artigos distintos. As rodadas de gramática, documentação, índice e privacidade têm relatórios próprios. Os testes não entram em contas, acessam a área de transferência nem publicam na Wikipédia.
