# Testes da 2.7.1

Os testes anteriores permanecem em `tests/v27`. As cópias desta pasta usam os executáveis fixados em `tests/expected_release_v271.json`, com os mesmos resultados esperados e as mesmas fontes. `ADAPTATION_PROVENANCE.json` informa os hashes de origem e das cópias.

`verify_inherited.cjs` confere as substituições de versão, nomes de arquivo e destinos dos relatórios antes das suítes. O adaptador do motor mantém as asserções de `tests/v26_engine` sem alterações. O corpus adicional continua usando as 31 revisões fixadas em `tests/v27/fixtures/large_articles`.

```sh
node tests/v271/run_all.cjs
node tests/v271/run_engine.cjs --complex
```

Para repetir a execução nas 31 revisões maiores, informe os hashes completos dos dois manifestos e escolha um nome novo para cada execução:

```sh
node tests/v271/run_edited_corpus.cjs \
  --final-pin=d3356cd3f9b0ac7d349b06bb514ef007a1f083d54626f8863d2202ae16d7d28c \
  --corpus-pin=0f213292c4fcfd2c68df1c0d363946848e82a2d8457e2f47d14179ffede23256 \
  --run=verificacao-local-01
```

O resultado fica em `artifacts/v271/large-corpus`. O programa verifica os arquivos antes e depois dos testes. Os hashes acima pertencem à 2.7.1 e ao corpus preservado da 2.7. Para outra versão, use os hashes dos manifestos correspondentes.

As regras novas têm testes próprios em `test_chemical_syntax.cjs` e `test_chemical_guards.cjs`, com controles para conversão de idioma, exemplos protegidos, identificadores já formatados e mudanças indevidas entre infocaixas. Três revisões públicas de dois artigos ficam em `fixtures/chemical_articles`, com os hashes e os endereços de origem. Os testes herdados de instalação, aspas, referências, comparação, resíduos de cópia e permutações continuam na execução principal. Permutações sintéticas são casos de teste, não artigos distintos.

Os testes usam cópias locais, sem entrar em uma conta ou publicar na Wikipédia. As [instruções dos testes em navegadores](browser/README.md) ficam em uma pasta própria. Os relatórios de navegador, gramática, documentação e privacidade são separados. Nenhuma execução nova é atribuída às versões anteriores.
