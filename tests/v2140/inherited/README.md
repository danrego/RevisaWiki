# Execução herdada de 2.13.0 em 2.14.0

Este adaptador não edita os testes antigos, os exemplos históricos nem os arquivos de produção. O Node compila os módulos originais em memória usando as substituições técnicas e as adaptações finitas de oráculo e formato de chamada registradas em `ADAPTATION_PROVENANCE.json`. O registro contém o tamanho e SHA de cada arquivo original, o SHA do código compilado e os locais de cada substituição.

As substituições gerais mudam a versão testada, os nomes dos bundles, o manifesto atual e o diretório de relatórios. Há duas adaptações técnicas adicionais:

* `run_engine.cjs` continua conferindo que o manifesto herdado de expectativas pertence a 2.13.0. O manifesto do runtime é conferido separadamente como 2.14.0. Os três resultados previamente revisados, os 81 fixtures originais e todas as asserções do motor ficam preservados.
* O benchmark compara 2.14.0 a 2.13.0, a versão anterior imediata. As verificações de retenção, cache, repetição e cancelamento permanecem iguais.

A retirada da comparação personalizada também muda uma expectativa positiva de texto do código em `test_ui_freshness.cjs`. A chamada que confirma o rascunho passa `false` no argumento antes usado por `compareOnly`. O registro conserva o hash original e os dois literais exatos, com a mesma asserção sobre o estado conferido e todas as guardas negativas. Os testes reais de navegador continuam verificando sucesso, falha e cancelamento.

O verificador de proveniência de 2.13.0 lê os arquivos históricos originais. Ele não recebe bytes reescritos por uma substituição global de leitura. A interceptação se aplica somente à compilação dos módulos registrados de `tests/v2130`. Fixtures JSON, capturas nativas, binários, bundles e módulos de outros diretórios são lidos normalmente. Cada processo confere o plano e o runtime pinados, registrando quais módulos realmente compilou.

## Preparação

Depois de revisar qualquer alteração no adaptador:

```sh
node scripts/run_inherited_v2140_prepare.cjs
```

Este comando registra a receita. Não executa o produto. Os arquivos históricos de código e fixtures serão conferidos antes e depois de cada etapa. Caches locais de Python e metadados .DS_Store não entram no registro nem na publicação. O manifesto original de 2.13.0 precisa permanecer com o SHA da entrega final.

## Execução

Use o SHA real de `tests/expected_release_v2140.json` no lugar de `MANIFESTO_FINAL`. Não use um candidato preliminar para declarar a versão validada.

```sh
node scripts/run_inherited_v2140.cjs --stage=smoke --final-pin=MANIFESTO_FINAL
node scripts/run_inherited_v2140.cjs --stage=main --final-pin=MANIFESTO_FINAL
node scripts/run_inherited_v2140.cjs --stage=complex --final-pin=MANIFESTO_FINAL
node scripts/run_inherited_v2140.cjs --stage=large --final-pin=MANIFESTO_FINAL --corpus-pin=0f213292c4fcfd2c68df1c0d363946848e82a2d8457e2f47d14179ffede23256 --run=final_v2140
```

A etapa principal exige a mesma quantidade de casos e relatórios da execução completa de 2.13.0. Ela executa as guardas negativas e não escolhe apenas exemplos positivos. Os quatro shards complexos mantêm os 128 casos. As referências, imagens, identificadores, blocos protegidos, valores e ordem das tabelas, bytes, idempotência e equivalência dos bundles são verificados pelo runner original do corpus.

Espere os outros testes pesados terminarem antes do benchmark:

```sh
node scripts/run_inherited_v2140.cjs --stage=benchmark --quiet --final-pin=MANIFESTO_FINAL --corpus-pin=0f213292c4fcfd2c68df1c0d363946848e82a2d8457e2f47d14179ffede23256
```

`--quiet` registra a confirmação de que o benchmark pode começar. Ele não verifica o agendador do sistema e não transforma as medições em garantia geral de desempenho.

Os relatórios novos ficam em `artifacts/v2140`. `--report-dir=DIRETORIO` pode escolher outro destino local. Uma etapa não sobrescreve seu registro anterior. A execução para diante de erro e conserva os resultados produzidos. Se uma nova correção alterar um resultado esperado antigo, a diferença precisa ser examinada e documentada antes de qualquer mudança no contrato. Há duas extensões finitas de resultado completo, ambas revisadas: nos dois oráculos do mesmo artigo público, uma quebra vazia excedente antes de `== Acre ==` é removida. Os totais passam de quatro para cinco e de dois para três. Arquivos estáticos novos e seus registros guardam os hashes anteriores e novos, preservam todas as 82 referências e recusam qualquer outra diferença. O plano isolado do grafo continua esperando somente os dois nomes de referência, sem alterar seu texto. As expectativas negativas e os arquivos históricos ficam intactos.

Nenhum navegador, conta ou edição na Wikipédia é iniciado por estes comandos. Os testes de navegador da versão nova são separados. Não execute o preload diretamente para produzir uma alegação de aprovação, use o orquestrador para manter os pins e a conferência posterior.
