# Testes da versão 2.16

`npm test` confere os arquivos fixados da distribuição, executa os casos novos nas versões modular e completa e repete as suítes finitas anteriores. `npm run test:focused` executa os casos novos. `npm run test:regression` repete apenas as suítes anteriores. O corpus de páginas reais é uma execução separada. Nenhum comando publica páginas na Wikipédia.

## Casos novos

- `transfer_cases.cjs`: dados explícitos e referenciados da abertura, campos ausentes, data e local no mesmo campo, conflitos, referências e condições da caixa.
- `field_value_cases.cjs`: datas isoladas, idade duplicada, unidade acrescentada pela caixa, listas, rótulos e ligações do cabeçalho para o próprio artigo.
- `integration_cases.cjs`: combinação das regras, conclusão em um clique, referências, resumo, contagem e edição menor.
- `independent_cases.cjs`: resultados literais escritos separadamente, entradas ambíguas, escopo, provas adulteradas e preservação de fontes.
- `release_adversarial.cjs`: exemplos com referências, aliases, nomes diferentes, idades, locais e estruturas que não devem ser alteradas.

`clock_retained_cases.cjs` confere a virada do dia UTC, a validade das provas de idade e a contagem quando apenas parte dos ajustes permanece. `summary_binding_test.py` recusa comprovantes incompletos ou de outro programa. `aggregate_corpus_test.py` usa entradas fictícias para conferir a soma, a origem e a privacidade dos resultados do corpus. Esses utilitários têm execução e comprovantes próprios.

Os exemplos são fictícios. Executar um caso nas duas distribuições não cria dois artigos distintos. Os resultados nativos guardados conservam sua identificação de origem e não passam a ser respostas novas quando o programa é atualizado.

## Suítes anteriores

`previous.cjs` retoma os arquivos originais sem reescrever os testes guardados. Cada adaptação em memória tem o hash do arquivo original e do texto compilado. A alteração fica limitada aos endereços dos executáveis e aos rótulos da versão, mantendo os identificadores dos auxiliares, exemplos e verificações de comportamento. Uma diferença de resultado precisa ser investigada, sem ser dispensada por ser de uma versão anterior.

## Navegadores locais

Os testes nos navegadores usam Node.js 22 ou posterior, o pacote `playwright` e os aplicativos instalados. Se o pacote não estiver no caminho normal dos módulos, informe seu caminho em `REVISAWIKI_PLAYWRIGHT`. O pacote apenas controla o Chrome instalado. Firefox e Safari usam seus próprios protocolos de automação.

`biography_ui_probe.cjs` usa o navegador instalado e uma página local de edição simulada. A opção `--browser=chrome`, `--browser=firefox` ou `--browser=safari` escolhe o navegador. Sem caminhos adicionais, testa os programas modular e completo. Confere aplicação, Worker, resumo, contagem, edição menor, estado de código conferido e Desfazer. Apenas o bloqueio de domínio recebe uma adaptação em memória para admitir a origem local. A lógica publicada dos ajustes permanece igual.

`index_probe.cjs` aceita a mesma opção de navegador. Compara os arquivos inteiros com o conteúdo de cada botão, confere destinos, downloads e cópia, além do encaixe dos cartões em telas diferentes. A área de transferência é simulada em memória. As páginas de teste impedem o envio de formulários e consultas de escrita. As sessões são próprias dos testes, sem conta conectada ou capturas de tela.

```sh
node tests/v216/biography_ui_probe.cjs --browser=chrome
node tests/v216/index_probe.cjs --browser=chrome
```

Use `firefox` ou `safari` para os demais navegadores. O Safari precisa permitir automação remota. Cada processo encerra apenas sua própria sessão de teste.

## Corpus privado

`corpus.cjs` recebe um manifesto explícito de revisões públicas guardadas, uma pasta privada de saída e os dois programas. Não baixa páginas nem consulta contas. A coleta é separada e usa leituras anônimas da API pública.

```sh
node tests/v216/corpus.cjs --manifest=CAMINHO_PRIVADO/manifest.json --output=PASTA_PRIVADA_NOVA --core=dist/2.16.0/RevisaWiki_v2_16_0.js --complete=dist/2.16.0/RevisaWiki_v2_16_0_completo.js --phase=final --core-sha=SHA_DO_NUCLEO --complete-sha=SHA_DO_COMPLETO
```

A execução final exige os hashes completos dos programas. Confere cada fonte, compara as distribuições, repete a transformação e executa as proteções de conteúdo. A versão anterior pode entrar por `--baseline` e `--baseline-complete` para distinguir diferenças novas de ocorrências já existentes. Uma falha antiga permanece separada dos testes sem falhas.

Os títulos, fontes e resultados individuais ficam fora da publicação. O relatório público contém apenas totais, hashes e os limites da conferência. Todas as páginas elegíveis entram na execução, tenham ou não uma infocaixa reconhecida.

## Construção e publicação

`python3 scripts/build_v2160.py` parte dos arquivos fixados da versão 2.15.1 e aplica os módulos de `src/v2_16`. Use Node.js 18 ou posterior e informe `REVISAWIKI_NODE` ou `--node` quando necessário. Os arquivos históricos permanecem intactos.

A documentação só recebe números de testes depois que os comprovantes completos correspondem aos hashes da distribuição. Os arquivos públicos passam pela conferência de privacidade, incluindo os arquivos dentro do pacote. Credenciais, perfis temporários dos navegadores, imagens da tela e detalhes do corpus privado ficam fora da publicação.
