# Testes da versão 2.17

Os casos novos executam os arquivos reais da distribuição modular e completa. Não inserem auxiliares no programa para fazer uma verificação passar. As entradas públicas são fictícias, e os detalhes do corpus ficam em uma pasta privada explícita. Nenhum teste salva páginas na Wikipédia.

## Casos novos

- `infobox_cases.cjs` confere os 21 erros de acentuação, as dez famílias de aliases vazios, a precedência nativa e os nomes aceitos que precisam permanecer iguais. Também cobre referências, datas, campos de sepultamento, valores padrão, escopo, provas adulteradas e o resultado completo de Ajustar código.
- `reference_table_cases.cjs` confere `nome` e `grupo` nas etiquetas de referência, uma única definição no mesmo grupo, os vínculos nativos exigidos e a lista posterior correspondente. Nas tabelas, testa os dois a quatro nomes de atributos conferidos e todas as alternativas de grade previstas pela prova.
- `alert_cases.cjs` compara o relatório visível com a 2.16, mantendo os resultados técnicos originais. Confere avisos inconclusivos, problemas reais que precisam continuar visíveis, ocorrências agrupadas, coordenadas antigas, texto final depois de uma limpeza ou de um ajuste desfeito e propostas que não podem oferecer a retirada de dados só pela ausência no catálogo.

`infobox_cases.cjs` aceita os programas como argumentos ou em `REVISAWIKI_SCRIPT`. `reference_table_cases.cjs` usa `--core` e `--complete`. `alert_cases.cjs` recebe um programa como argumento ou em `REVISAWIKI_SCRIPT` e permite escolher o anterior em `REVISAWIKI_BASELINE_SCRIPT`.

```sh
node tests/v217/infobox_cases.cjs dist/2.17.0/RevisaWiki_v2_17_0.js dist/2.17.0/RevisaWiki_v2_17_0_completo.js
node tests/v217/reference_table_cases.cjs --core dist/2.17.0/RevisaWiki_v2_17_0.js --complete dist/2.17.0/RevisaWiki_v2_17_0_completo.js
node tests/v217/alert_cases.cjs dist/2.17.0/RevisaWiki_v2_17_0.js
node tests/v217/alert_cases.cjs dist/2.17.0/RevisaWiki_v2_17_0_completo.js
```

O programa precisa continuar estável numa segunda execução. As verificações também exigem a preservação das fontes, a contagem das operações mantidas, o resumo correspondente e a decisão correta sobre edição menor. Corrigir um nome antes ignorado pode fazer um dado aparecer e não é marcado automaticamente como edição menor. Retirar um alias vazio com exibição idêntica pode ser, quando as demais condições forem atendidas.

Os contratos em `src/v2_17/infobox_contract_review.json` e `tests/v217/native` guardam revisões de origem, exemplos fictícios e hashes das respostas nativas. Uma consulta limitada ou uma resposta sem a confirmação necessária não promove um candidato. O HTML temporário das infocaixas fica fora da publicação. Comprovantes de versões anteriores conservam sua origem e não são contados como consultas novas.

## Suítes anteriores

`previous.cjs` retoma os arquivos originais da 2.16, da 2.15.1 e da 2.15.0 sem reescrever as entradas ou as verificações históricas. A adaptação em memória troca somente endereços de arquivos e rótulos de versão. O relatório guarda o hash do teste original e do texto compilado, sem dispensar uma diferença de comportamento por ser antiga.

```sh
node tests/v217/previous.cjs v216 field_value_cases
node tests/v217/previous.cjs infobox_order_cases
node tests/v217/previous.cjs reader_test
```

Os testes históricos de interface mantêm suas expectativas registradas. O comportamento atual do relatório recebe os casos próprios da 2.17. Uma comparação antiga não passa a comprovar a interface nova apenas por receber outro número de versão.

## Navegadores locais

`alert_ui_probe.cjs` usa Chrome, Firefox ou Safari instalado e uma página local de edição simulada. Compara o relatório visível com o modelo de contagem, executa um Worker real e verifica que o filtro não muda o resultado do programa. Também percorre locais posteriores ao primeiro, aplica uma escolha em outra ocorrência do grupo e confere as escolhas que ainda restam. Um erro controlado de pré-visualização precisa continuar recusando a mudança e recuperando o texto de origem.

```sh
node tests/v217/alert_ui_probe.cjs --browser=chrome dist/2.17.0/RevisaWiki_v2_17_0.js dist/2.17.0/RevisaWiki_v2_17_0_completo.js
```

Use `firefox` ou `safari` para os demais navegadores. O Safari precisa permitir automação remota. Os testes exigem Node.js 22 ou posterior e os aplicativos correspondentes. As sessões são próprias dos testes. As páginas impedem envio de formulários e requisições de escrita, sem conta conectada ou capturas de tela. A lógica publicada dos reparos permanece igual, com adaptação restrita da origem para a página local.

`index_probe.cjs` retoma os 32 casos da versão anterior com os endereços da 2.17. Confere o índice completo, os destinos, os resumos, os downloads e o encaixe dos cartões. A ordem dos quatro primeiros cartões é dados, programa, carregador central e documentação. A chamada fixa do common.js conserva os bytes da versão anterior.

## Corpus privado e redução de avisos

`corpus.cjs` recebe um manifesto explícito de revisões públicas guardadas e uma pasta privada de saída. A coleta é separada e usa leituras anônimas da API. A execução do corpus não baixa páginas nem consulta contas. Os programas finais entram com seus hashes completos, e cada fonte é conferida antes do cálculo.

```sh
node tests/v217/corpus.cjs --manifest=CAMINHO_PRIVADO/manifest.json --output=PASTA_PRIVADA_NOVA --core=dist/2.17.0/RevisaWiki_v2_17_0.js --complete=dist/2.17.0/RevisaWiki_v2_17_0_completo.js --phase=final --core-sha=SHA_DO_NUCLEO --complete-sha=SHA_DO_COMPLETO --baseline=dist/2.16.0/RevisaWiki_v2_16_0.js --baseline-complete=dist/2.16.0/RevisaWiki_v2_16_0_completo.js
```

O resultado separa páginas medidas e não medidas, entradas de revisão, ocorrências e grupos. Os totais anteriores e atuais precisam se referir às mesmas páginas. Reduzir a quantidade de avisos não comprova a correção do artigo nem altera o código. Erros realmente confirmados no texto final continuam na revisão, com os locais e as escolhas acessíveis.

Títulos, fontes e resultados individuais ficam fora da publicação. O relatório público contém totais, hashes e limites. Uma ocorrência que já existia na versão anterior fica separada de uma regressão nova. Executar um exemplo nas duas distribuições não cria dois artigos distintos.

## Construção e documentação

`python3 scripts/build_v2170.py` parte dos arquivos fixados da 2.16.0 e aplica os módulos de `src/v2_17`. Use Node.js 18 ou posterior e informe `REVISAWIKI_NODE` ou `--node` quando necessário. Os arquivos históricos permanecem intactos.

`document_v2170.py` só escreve os oito documentos depois que `artifacts/v2170/QA_SUMMARY.json` confirma os hashes de todos os executáveis. O resumo dos testes e o resumo da redução de avisos vêm desse comprovante. A documentação não recebe números provisórios.

`summarize_v2170.py` lê a lista explícita de comprovantes em `artifacts/v2170/QA_INPUTS.json`. O arquivo precisa declarar `schema: 1`, a versão, o hash do manifesto, grupos com rótulos e caminhos relativos, o agregado do corpus e a lista de proveniência. Cada comprovante declara seu tipo e os programas esperados. A execução finita exige também seu `verification.json`, os 65 resultados originais e os hashes das fontes atuais e históricas. Cada relatório de navegador exige seu `binding.json`, sem reescrever campos de versão ou inventar um estado de sucesso ausente no original. Ferramentas de agregação e conferência têm comprovantes próprios, com hashes das fontes e indicação de que usam entradas sintéticas.

`publish_evidence_v2170.py` recalcula o resumo, confere a documentação e os três testes nativos do índice, depois copia somente os arquivos da lista permitida. Os comprovantes de vínculo acompanham os relatórios originais. Metadados e comparações nativas anteriores não acrescentam casos aos testes executados.

`rebuild_probe.py` reconstrói os sete executáveis e os oito catálogos em uma pasta temporária, compara todos os bytes e confere os hashes dos módulos de origem e dos auxiliares incorporados. Os módulos de aplicação também entram no comprovante. Somente os rótulos de distribuição e o hash do núcleo podem mudar nos catálogos, sem alterar os números de revisão dos contratos nativos. Os arquivos atuais permanecem intactos.

`audit_documentation_v2170.py` retoma as 131 verificações documentais da versão anterior com os endereços e a orientação atual de interface. Acrescenta verificações dos novos limites, das escolhas acessíveis, dos totais comprovados e da cópia completa. Todo o histórico de versões anterior à 2.17 permanece idêntico em bytes.

Depois da documentação final, o pacote e os arquivos passam pela conferência de privacidade, incluindo o conteúdo dos arquivos compactados. Credenciais, perfis de navegador, imagens da tela, caminhos locais e detalhes do corpus privado ficam fora da publicação.
