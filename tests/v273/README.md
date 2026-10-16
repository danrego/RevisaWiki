# Testes da 2.7.3

Os testes da 2.7.2 permanecem em `tests/v272`. As cópias desta pasta usam os executáveis fixados em `tests/expected_release_v273.json`, com as mesmas asserções, resultados esperados e fontes. `ADAPTATION_PROVENANCE.json` informa os hashes de origem e das cópias.

`verify_inherited.cjs` confere as substituições de versão, nomes de arquivo e destinos dos relatórios antes das suítes. Também verifica as cópias dos arquivos usados por caminhos relativos. O corpus adicional continua usando as 31 revisões preservadas em `tests/v27/fixtures/large_articles`.

```sh
node tests/v273/run_all.cjs
node tests/v273/run_engine.cjs --complex
```

Para repetir os testes nas 31 revisões maiores, use os dois hashes completos e escolha um nome novo para cada execução:

```sh
node tests/v273/run_edited_corpus.cjs \
  --final-pin=42c28afa2a38455844cd8c9747d88a362de54b5b596afd981935966d22bde72c \
  --corpus-pin=0f213292c4fcfd2c68df1c0d363946848e82a2d8457e2f47d14179ffede23256 \
  --run=verificacao-local-01
```

O resultado fica em `artifacts/v273/large-corpus`. Os hashes acima pertencem à 2.7.3 e ao corpus preservado da 2.7. Para outra versão, use os hashes dos manifestos correspondentes.

Os testes novos de casamento ficam em `test_marriage_syntax.cjs` e `test_marriage_guards.cjs`. Os casos exigem dados explícitos e preservação do nome, das datas, das referências e das condições informadas. Casos sintéticos e revisões de uma mesma página não são contagens de artigos distintos.

A revisão completa usada no teste de casamento tem uma aspa na bibliografia que deixa a leitura incompleta no analisador. Os testes exigem que a conversão fique na infocaixa inicial completa, preserve esse trecho sem alterações e recuse um alvo dentro da parte incerta. Também verificam a opção de desativar a recuperação parcial e a presença de outra possível infocaixa fora do alvo. Os casos cobrem nomes com namespaces, modificadores, comentários, entidades e marcas de direção do texto. A conversão é recusada quando esses nomes deixam o limite do alvo incerto.

A matriz de composição inclui as 33 famílias verificadas, os nomes de parâmetros que a tradução existente já aceita, as infocaixas estrangeiras com destino aprovado e as opções que desativam essas rotinas. Os resultados precisam ficar prontos no primeiro clique e permanecer iguais no segundo. Parâmetros conflitantes, rótulos próprios, grupos musicais e nomes com formatação protegida têm controles separados.

Os testes usam cópias locais, sem entrar em uma conta ou publicar na Wikipédia. Navegadores, gramática, documentação e privacidade têm relatórios separados. Nenhuma execução nova é atribuída às versões anteriores.

As traduções de campos e infocaixas usam apenas os mapeamentos anteriores, quando habilitados e sem conflitos. Os testes de composição exigem que a tradução e o casamento terminem no mesmo clique e que uma segunda execução mantenha o resultado.
