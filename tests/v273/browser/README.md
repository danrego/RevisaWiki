# Testes locais nos navegadores

O roteiro executa 18 fluxos no Chrome, no Firefox e no Safari instalados no Mac. Cada execução usa os arquivos e hashes de `tests/expected_release_v273.json`. As páginas são locais e as respostas da API são simuladas. Nenhuma edição é publicada, e os testes encerram apenas seus próprios perfis e sessões.

Os 15 fluxos herdados permanecem com as mesmas asserções. Dois deles verificam o artigo completo de Zara Larsson e exemplos de tabelas dentro de blocos protegidos. No artigo, falta apenas uma aspa no valor numérico de rowspan. As seis linhas que combinam rowspan com predefinições de resultado já são válidas e precisam permanecer exatamente iguais. Os 11 quadros de prêmios, as referências e o trecho com aspas e itálico também são conferidos.

A consulta de gênero usa uma cópia verificada da entidade pública do Wikidata. O roteiro percorre a preparação anônima da consulta e a prova vinculada ao texto original antes de conferir os portais Biografias e Mulheres. Não atribui gênero a partir do nome ou da aparência. Desfazer precisa recuperar todos os bytes da revisão original.

As fontes químicas e os arquivos do teste de largura do Firefox continuam fixados em `tests/v271`. As páginas de geometria usam imagens vazias nas dimensões declaradas, sem baixar imagens ou fazer capturas de tela. O teste não pretende revisar toda a aparência do artigo.

```sh
node tests/v273/browser/run_release.cjs Chrome dist/2.7.3
node tests/v273/browser/run_release.cjs Firefox dist/2.7.3
node tests/v273/browser/run_release.cjs Safari dist/2.7.3
node tests/v273/browser/summarize_release.cjs artifacts/v273/browser
```

O módulo Playwright precisa estar disponível, além dos três navegadores e da automação remota do Safari. Os caminhos dos relatórios podem ser informados pelas variáveis usadas no roteiro. Não há acesso à área de transferência.

Os dois novos fluxos conferem nove famílias de infocaixas pessoais, com anos e datas por extenso ou ISO, e 24 casos que devem permanecer sem conversão. Cada caso passa pelo Worker real e por Desfazer. As fontes são sintéticas, as chamadas externas são simuladas e os resultados registram os hashes de entrada, saída e restauração.

A prova `MARRIAGE_DATE_RENDER_PROOF.json` conserva os resultados de 23 exemplos de data e situação conjugal renderizados em uma consulta pública GET à API do MediaWiki. O manifesto de adaptação e os relatórios vinculam o hash dessa prova, que não é repetida nem simulada como consulta ao vivo durante os testes locais.

O 18.º fluxo usa a revisão completa de John Maynard Keynes, com 260.568 bytes. A infocaixa inicial está completa, mas a leitura da bibliografia fica incompleta no analisador. O teste exige que apenas a conversão conjugal confirmada funcione antes do limite original de recuperação, sem inferir uma data final, sem relaxar o analisador geral e sem alterar nenhum byte do restante opaco. Todas as 373 chamadas de referência e 49 chamadas de imagem permanecem. Desfazer restaura a revisão completa.

Os casos negativos incluem a abertura incompleta de uma segunda infocaixa no trecho opaco com os prefixos `Predefinição:`, `Template:`, `subst:` e `safesubst:`, inclusive suas combinações. A conversão do primeiro campo deve ser recusada, o restante opaco deve ficar exato e uma correção independente, anterior ao limite, deve continuar funcionando.

A prova `HEAD_RENDER_PROOF.json` fixa 22 exemplos de nomes de predefinição, espaços de nomes e modificadores de substituição processados em uma consulta pública GET. O roteiro vincula os mesmos bytes dessa prova, sem fazer consultas à Wikipédia durante a execução local.

Três casos positivos adicionais cobrem o parâmetro `spouse` em `Info/Biografia` e as migrações já aprovadas de `Infobox person` e `Infobox scientist`. A conversão conjugal precisa acontecer no primeiro clique. Os 12 casos positivos passam por um segundo clique real, que não pode alterar o texto nem o resumo. Os 36 cenários sintéticos também passam por uma segunda análise completa para conferir idempotência, antes da restauração exata.

Um caso estrangeiro adicional mantém uma parte interna do nome em negrito no campo de cônjuge. A migração aprovada pode normalizar a infocaixa e o nome do campo, mas a conversão conjugal deve preservar esse conteúdo e permanecer recusada.

O Worker conserva a comparação entre o texto original e o texto atual. Um segundo clique sem ajustes novos não apaga esse histórico. O teste exige identidade exata dos limites, textos, identificadores e demais campos de edição dos trechos acumulados. Apenas `reasons`, os rótulos explicativos montados a partir do registro de cada execução, fica fora dessa comparação. As duas listas são registradas separadamente, com os motivos da primeira execução e o texto padrão "Ajustes de código" quando a segunda não tem ajuste novo. O texto e o resumo permanecem iguais, e a segunda execução precisa retornar zero ajustes novos. Desfazer ainda precisa recuperar o texto anterior ao primeiro clique. A prova independente desse contrato está em `SECOND_CLICK_DIFF_CONTRACT.json`.

O agregador decodifica a representação `RemoteValue` do Firefox apenas nos campos separados de motivos e rótulos. Os três relatórios nativos permanecem intactos, e os hashes dos trechos de edição não passam por essa decodificação.
