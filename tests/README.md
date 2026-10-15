# Repetir os testes

Com Node.js 18 ou posterior, execute `npm test`. O comando verifica os arquivos de distribuição, repete os contratos anteriores contra as duas distribuições 2.4.0 e executa `tests/v24/run_all.cjs` e `tests/v24_gallery/run_all.cjs`. Não baixa artigos, não acessa a Wikipédia e não abre contas. Não equivale a repetir os conjuntos de artigos.

`python3 scripts/build.py` reproduz a receita de injeção da versão, usando a distribuição histórica 2.3.0 e os arquivos em `src`. Compara os resultados com `tests/expected_release.json`, sem atualizar esse registro. Execute `npm test` depois da reconstrução.

Os arquivos anteriores permanecem com seus bytes originais. O adaptador `v24_legacy_regressions.cjs` aponta os contratos para o programa 2.4.0. Nos quatro casos de cauda incompleta, uma única expectativa de aviso também aceita a palavra "incompleto", usada pela 2.4 para a mesma fronteira sem fechamento. A troca ocorre apenas na cópia em memória. `v24_legacy_expectation_amendments.json` guarda o padrão exato, a razão e os hashes antes e depois. As verificações de preservação, estabilidade e ausência de listas repetidas continuam iguais.

## Galerias e mutações em artigos extensos

A execução padrão inclui os quatorze contratos de [preservação de galerias](v24_gallery/README.md) nas duas distribuições. As fontes reais de Ponte, Cerveja, Renascimento e Fausto Coppi ficam junto dos contratos, com revisões, hashes e atribuição.

`npm run test:complex` executa separadamente as 48 mutações em 16 artigos extensos de física e matemática. Esse ensaio pode demorar alguns minutos e não faz parte de `npm test`. Confere núcleo e arquivo completo, referências, tabelas, fórmulas, inventários e segunda aplicação. Os comandos para dividir a execução e os limites estão em [engine_qa/portable_engine/LEIA-ME.txt](engine_qa/portable_engine/LEIA-ME.txt).

## Bateria histórica separada

`python3 tests/inherited/run.py` mantém a configuração histórica e testa a distribuição completa **2.3.0**. Esse comando reproduz a bateria da 2.3.0. Seus resultados não constituem uma execução da 2.4.0. Os arquivos em `tests/inherited` continuam congelados.

A execução local da bateria para a 2.4.0 tem duas expectativas de `reference_audit_tests` atualizadas: fechamento de referência de uma linha no fim da página e preservação de famílias de referências diante de um coletor sem fechamento. `v24_inherited_expectation_amendments.json` guarda os casos e as razões. Os resultados efetivamente executados para a 2.4.0 ficam no relatório da versão e em `tests/evidence/2.4.0`.

## Navegadores e artigos

As instruções próprias dos testes novos ficam em [v24/README.txt](v24/README.txt). Os testes nativos exigem os aplicativos indicados e são separados dos contratos locais. A interface e as respostas de API simuladas não certificam todos os scripts pessoais de uma sessão real.

Os dois conjuntos de 1.000 artigos usados na 2.3.0 fornecem as mesmas revisões congeladas para os testes de artigos da 2.4.0. Uma nova execução sobre essas 2.000 fontes não é uma nova coleta de 2.000 artigos. O relatório da versão informa as execuções efetivamente concluídas.

As [instruções da bateria de artigos da 2.4](corpus_v24/README.md) trazem os comandos do repetidor portátil e dos verificadores independentes. As fontes precisam corresponder às revisões e aos hashes dos dois manifestos.

Os manifestos, reprodutores e relatórios históricos permanecem em `tests/corpus`, `tests/inherited` e `tests/evidence`. As evidências novas ficam em `tests/evidence/2.4.0`. Seu índice identifica exatamente os arquivos incorporados. Uma execução antiga não é apresentada como revalidação da 2.4.0.

A reconstituição de artigos usa somente as revisões e hashes registrados nos manifestos, por GET público. Ela é uma ação separada e não faz parte de `npm test`. Nenhum destes comandos publica páginas na Wikipédia.
