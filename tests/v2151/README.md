# Testes da versão 2.15.1

`npm test` confere os hashes da distribuição, executa os casos novos nas versões modular e completa e repete as suítes finitas da versão anterior. `npm run test:focused` executa apenas os casos novos. `npm run test:regression` repete as suítes anteriores. `npm run test:complex` repete a matriz finita completa, incluindo os exemplos grandes e as combinações de sintaxe. O corpus de artigos reais é uma execução separada, com seus caminhos explícitos. Nenhum comando publica páginas na Wikipédia.

## Casos novos

- `infobox_order_cases.cjs`: posição da infocaixa, indentação, avisos iniciais, referências, exemplos protegidos e estruturas que devem ficar intactas.
- `field_syntax_cases.cjs`: caracteres invisíveis, sinal de igual, unidade repetida e colisões entre parâmetros e aliases.
- `image_alt_cases.cjs`: arquivo, texto alternativo, legenda, referências e conflitos entre campos.
- `biography_lead_cases.cjs`: nome inicial, ligação para o próprio artigo, datas, locais e exigência de fontes individuais.
- `retained_count_cases.cjs`: operações mantidas, ponto fixo, contagem composta e recusa de totais não comprovados.
- `safeguard_cases.cjs`: associação de cada referência ao seu dado, datas e locais adulterados, normalização confirmada de pontuação.
- `image_contract_audit.cjs` e `contract_composition.cjs`: revisão dos contratos de imagem e interação das regras. A substituição controlada de metadados ocorre apenas no módulo privado dos testes, com acessores acrescentados em memória. A lógica publicada permanece igual.
- `independent_cases.cjs` e `adversarial_release.cjs`: resultados literais independentes, combinações das regras, preservação, idempotência, resumo e edição menor.
- `native_image_cases.cjs`: compara o resultado real do programa com respostas anônimas guardadas do analisador da ptwiki. Três conversões conservam os atributos da imagem, o texto visível e as chamadas de referência. A proposta com texto alternativo vazio muda a expansão nativa e precisa ser recusada pelo programa.

Os exemplos sintéticos usam nomes de controle. Executar o mesmo caso nas duas distribuições não cria dois artigos distintos. As respostas nativas de versões anteriores continuam identificadas como respostas antigas, mesmo quando são usadas novamente para conferir o programa novo.

## Navegadores locais

`biography_ui_probe.cjs` usa o navegador instalado e uma página local de edição simulada. A opção `--browser=chrome`, `--browser=firefox` ou `--browser=safari` escolhe o navegador. Caminhos opcionais depois das opções selecionam os programas. Sem esses caminhos, testa as distribuições modular e completa. Ele confere aplicação, Worker, resumo, contagem, edição menor e Desfazer. Só os bloqueios de domínio recebem uma adaptação em memória para permitir a origem local. O programa publicado não recebe essa adaptação.

`index_probe.cjs` usa a mesma opção de navegador para conferir o índice entregue. Compara o conteúdo completo de cada botão com o arquivo correspondente, confere os destinos e testa a cópia e a seleção manual com uma área de transferência simulada. Também verifica o encaixe dos cartões e da janela de código em tamanhos diferentes.

As páginas de teste bloqueiam envio de formulários e consultas de escrita. As sessões são próprias dos testes, sem conta conectada, capturas de tela ou acesso à área de transferência.

## Corpus privado

`npm run test:large-articles --` chama `corpus.cjs`, que recebe um manifesto explícito de revisões públicas guardadas, uma pasta privada de saída e os dois programas. Não baixa páginas nem consulta a conta do editor. A coleta é separada e usa apenas leituras anônimas da API pública.

```sh
node tests/v2151/corpus.cjs --manifest=CAMINHO_PRIVADO/manifest.json --output=PASTA_PRIVADA_NOVA --core=dist/2.15.1/RevisaWiki_v2_15_1.js --complete=dist/2.15.1/RevisaWiki_v2_15_1_completo.js --phase=final --core-sha=SHA_DO_NUCLEO --complete-sha=SHA_DO_COMPLETO
```

A execução final exige os hashes completos dos programas. Confere cada fonte, compara as duas distribuições, repete a transformação e executa as proteções de conteúdo. Uma versão anterior pode ser fornecida por `--baseline` e `--baseline-complete` para distinguir problemas novos de ocorrências já existentes. Essa comparação não transforma uma falha antiga em um teste aprovado.

As fontes, títulos, contribuições e resultados individuais ficam fora do repositório. O relatório público contém os totais, os hashes e os limites da conferência. Todas as páginas elegíveis entram na execução. A identificação de caixas pessoais apenas acrescenta um subtotal e não seleciona quais páginas serão testadas.

## Reconstrução

`python3 scripts/build_v2151.py` reconstrói o programa a partir dos arquivos fixados da versão 2.15.0 e dos módulos novos. Use Node.js 18 ou posterior e informe `REVISAWIKI_NODE` ou `--node` se o executável não estiver no PATH. Os arquivos históricos não são reescritos.

`python3 tests/v2151/rebuild_probe.py` repete essa construção em uma pasta temporária. Compara os sete arquivos executáveis, os oito catálogos e o manifesto, verifica a inclusão única dos módulos nas duas distribuições e confere que os arquivos de entrada não mudaram. Também aceita `--node` para informar o executável.

`python3 tests/v2151/summary_binding_test.py` testa a conferência dos comprovantes. Um relatório sem hash, de outra versão, incompleto ou com hashes conflitantes não pode entrar no resumo da publicação. Os exemplos desse teste são sintéticos.

As provas públicas ficam em `tests/evidence/2.15.1`. Os resultados precisam corresponder aos hashes dos programas publicados. Detalhes do corpus privado e perfis temporários de navegadores não são arquivos de publicação.
