# Repetir os 2.000 artigos

Estas fontes são as mesmas revisões congeladas usadas na 2.3.0. Primeiro siga `tests/corpus/README.txt` para reconstruir `tests/corpus/inputs/new` e `tests/corpus/inputs/old` por GET público anônimo. Os manifestos e os hashes precisam coincidir. Esta etapa não faz parte de `npm test`.

Na raiz do repositório, execute:

```
node tests/corpus_v26/run_parallel.cjs local_2000
python3 tests/corpus_v26/aggregate_results.py local_2000
python3 tests/corpus_v26/independent_source_guards.py local_2000
python3 tests/corpus_v26/independent_table_data.py local_2000
python3 tests/corpus_v26/independent_alias_review.py local_2000
```

O ensaio usa 12 processos locais. Cada um executa núcleo e distribuição completa, confere a igualdade dos resultados e reaplica a limpeza. Há 24 verificações por revisão. Os nomes de execução não podem ser repetidos para sobrescrever evidências.

`portability_manifest.json` registra o hash do reprodutor executado no desenvolvimento e o da adaptação. Somente os caminhos de entrada e saída e um comentário antigo foram ajustados. Os verificadores independentes não importam o RevisaWiki. Seus diagnósticos brutos de apresentação de tabelas exigem análise e não devem ser omitidos ou contados automaticamente como aprovações.

Nenhum destes comandos edita ou publica páginas da Wikipédia. As fontes dos artigos usam CC BY-SA, com atribuição nos links permanentes dos manifestos originais.

Para repetir apenas a análise do redirecionamento, sem baixar os 2.000 artigos, execute:

```
python3 tests/corpus_v26/independent_alias_review.py --evidence-only
```

O ensaio final manteve um aviso bruto para a troca de `[[Rangoon]]` por `[[Rangum]]`. O segundo nome é o destino do primeiro. A análise separada confere a revisão exata, os hashes dos textos e os dados públicos do redirecionamento. Ela vale apenas para essa ocorrência. O aviso original permanece no relatório.

Os cinco avisos brutos sobre apresentação de tabelas também foram mantidos. As diferenças entre células coincidem com as diferenças já analisadas na versão 2.4. Não houve nova diferença. Os relatórios completos, os hashes e a análise estão em `tests/evidence/2.6.0/corpus`.
