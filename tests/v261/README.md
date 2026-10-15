# Testes da correção 2.6.1

Com Node.js 18 ou posterior, execute na raiz do repositório:

```sh
node tests/v261/run_all.cjs
node tests/v261/run_engine.cjs --complex
```

O primeiro comando executa os casos da correção e as verificações anteriores
do motor. O segundo acrescenta 128 casos em artigos com mais de 100 KB. Para
executar tudo com um comando, use `node tests/v261/run_all.cjs --complex`.
Não é preciso instalar pacotes. Os testes não fazem requisições à rede nem
publicam na Wikipédia.

Antes dos testes, os cinco programas da distribuição são comparados com os
tamanhos e SHA-256 de `tests/expected_release_v261.json`. As fontes dos dois
artigos enviados para esta correção têm revisão permanente e SHA-256 no
arquivo `fixtures/source_revisions.json`.

O teste específico confere as referências no singular, as remissões AP e
Main, os parâmetros numerados que contêm `=`, os exemplos protegidos, as
aspas e os apóstrofos, a preservação das partes incompletas e a repetição
do ajuste sem novas mudanças. Também confere a conservação do conteúdo,
a composição do resultado e a diferença de bytes em UTF-8.

Os casos de discussão conferem a conversão dos nomes de portais e das
chamadas `Portal3` em marcas de projeto. Comentários, avaliações já dadas,
outros avisos e rótulos sem correspondência confirmada precisam permanecer.
O teste do registro percorre todos os nomes e atalhos de marcas de projeto
da fonte capturada, no programa completo e no núcleo com dados separados.
Esses testes verificam o código proposto. A inserção no editor, o cursor,
o resumo manual e o botão de desfazer também precisam ser conferidos no
navegador antes de uma publicação da ferramenta.

As consultas de portais usam respostas simuladas nos testes, incluindo
redirecionamentos, páginas ausentes, nomes ambíguos e falhas de conexão.
Também são conferidos os limites de consultas e o cancelamento de uma
resposta que demora. Nenhuma consulta real é enviada nesses casos.

As verificações anteriores são copiadas para uma pasta temporária, com as
asserções e fontes intactas. Apenas o carregador dos programas e o gravador
dos relatórios são substituídos para usar a versão 2.6.1. Os SHA-256 dos
arquivos originais ficam no relatório. A pasta temporária é apagada ao final.
Os testes e registros históricos da versão 2.6.0 não são reescritos.

Os relatórios novos ficam em `artifacts/v261`. Para escolher outra pasta,
defina `REVISAWIKI_REPORT_DIR`. Eles contêm os hashes dos programas realmente
executados. Os caminhos locais são retirados das mensagens de erro.

Para reproduzir as falhas anteriores, execute:

```sh
node tests/v261/run_focus.cjs --baseline
```

Esse comando testa os programas originais 2.6.0 contra os mesmos casos e
grava um relatório separado. As falhas esperadas da versão anterior não são
contadas como testes aprovados da correção.
