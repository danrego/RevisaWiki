# Testes do RevisaWiki 2.5

Estes testes usam os dois arquivos publicados da versão 2.5.0 e conferem seus SHA256 antes de carregar o código. Não acessam a rede, não usam uma conta da Wikipédia e não publicam edições.

Na raiz do repositório:

```sh
node tests/v25_engine/run_contracts.cjs
node tests/v25_engine/run_integration.cjs
node tests/v25_engine/run_composition_options.cjs
node tests/v25_engine/run_quote_lexer.cjs
node tests/v25_engine/run_corpus_regressions.cjs
node tests/v25_engine/run_complex_all.cjs
```

Os contratos conferem correções, falsos positivos, opções desativadas, combinações de parâmetros e os limites do cache. A integração passa pelo cálculo completo e tenta retirar dados depois do reparo, para conferir se a proteção rejeita a perda. A matriz de opções confere ajuste, seleção dos trechos, ortografia e recálculo do rascunho com oito opções habilitadas e desabilitadas. Os dois comandos seguintes cobrem três casos reais encontrados no conjunto de artigos e exemplos de aspas dentro de referências. O último usa 16 artigos congelados de física e matemática, todos com mais de 100 KB, com 128 variações. Quatro processos dividem esse último conjunto.

Se uma página tiver um contexto de referências que a regra não consegue conferir, o caso permanece como teste de preservação literal. Esses casos não contam como reparos aplicados.

Para usar outra pasta com os mesmos arquivos congelados, defina `REVISAWIKI_DIST`. Para salvar os relatórios, defina `REVISAWIKI_REPORT_DIR`. Sem essa opção, os testes só mostram o resultado no terminal.

As revisões dos artigos, ligações de atribuição e licenças ficam em `selected_sources.json` e `regression_sources.json`. O texto usado para comparar a saída antiga está em `derived_fixture.json`. As alterações de expectativas feitas para acompanhar conversões já existentes estão em `legacy_normalization_expectation_amendments.json`. Nenhum desses ajustes autoriza a perda de campos conflitantes. A divisão entre proteção de blocos literais e comparação das referências está em `guard_contract_scope_notes.json`.
