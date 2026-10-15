# Testes da 2.7.2

Os testes da 2.7.1 permanecem em `tests/v271`. As cópias desta pasta usam os executáveis fixados em `tests/expected_release_v272.json`, com as mesmas asserções, resultados esperados e fontes. `ADAPTATION_PROVENANCE.json` informa os hashes de origem e das cópias.

`verify_inherited.cjs` confere as substituições de versão, nomes de arquivo e destinos dos relatórios antes das suítes. Também verifica as cópias dos arquivos usados por caminhos relativos. O corpus adicional continua usando as 31 revisões preservadas em `tests/v27/fixtures/large_articles`.

```sh
node tests/v272/run_all.cjs
node tests/v272/run_engine.cjs --complex
```

Para repetir os testes nas 31 revisões maiores, use os dois hashes completos e escolha um nome novo para cada execução:

```sh
node tests/v272/run_edited_corpus.cjs \
  --final-pin=a0712658dabadea161e40b795e20d900196528648d3bcb0e8c70c7c408ab2d46 \
  --corpus-pin=0f213292c4fcfd2c68df1c0d363946848e82a2d8457e2f47d14179ffede23256 \
  --run=verificacao-local-01
```

O resultado fica em `artifacts/v272/large-corpus`. Os hashes acima pertencem à 2.7.2 e ao corpus preservado da 2.7. Para outra versão, use os hashes dos manifestos correspondentes.

Os testes novos de tabelas ficam em `test_table_syntax.cjs` e `test_table_guards.cjs`. Casos sintéticos e revisões de uma mesma página não são contagens de artigos distintos.

As chamadas que fornecem atributos e o separador da célula, como `{{ind}}` e `{{venceu}}`, permanecem intactas. As correções de aspas exigem um valor numérico literal e um separador já presente. Os exemplos protegidos e as aspas realmente incompletas têm controles próprios.

Os testes usam cópias locais, sem entrar em uma conta ou publicar na Wikipédia. Navegadores, gramática, documentação e privacidade têm relatórios separados. Nenhuma execução nova é atribuída às versões anteriores.
