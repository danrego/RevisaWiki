# Testes independentes da edição rápida 2.6

Os navegadores abrem somente um servidor local. A API de leitura e as respostas de publicação são simuladas na memória. O servidor recusa requisições de rede que não sejam GET, e a política da página bloqueia conexões externas. Os cliques de publicação usados nos testes são eventos reais do navegador sobre o simulador local. Não há publicação na Wikipédia, login, captura de tela, acesso à área de transferência do sistema ou gravação na pasta de downloads.

Instale Node.js e o pacote `playwright`. Chrome, Firefox e Safari devem estar instalados no Mac. Para Safari, ative a automação remota no menu Desenvolvedor. `REVISAWIKI_PLAYWRIGHT` pode indicar uma instalação local do pacote.

Na raiz do repositório, execute um navegador de cada vez:

```sh
node tests/inline_v26/native/run_inline.cjs Chrome dist/2.6.0/RevisaWiki_v2_6_completo.js
node tests/inline_v26/native/run_inline.cjs Firefox dist/2.6.0/RevisaWiki_v2_6_completo.js
node tests/inline_v26/native/run_inline.cjs Safari dist/2.6.0/RevisaWiki_v2_6_completo.js
```

No Safari, o controlador foca o botão indicado e envia Enter pelo WebDriver. O navegador gera o clique real do botão e o código exige `event.isTrusted`. Chrome e Firefox usam o ponteiro. Nenhum teste muda a proteção contra publicação por evento sintético.

O controlador faz uma única adaptação na cópia local do código, permitindo o endereço de loopback na proteção que limita o script à ptwiki. Ele não muda a exigência de clique real, o código de publicação, os controles de revisão ou os mecanismos que preservam o rascunho. O relatório registra o SHA-256 dos bytes originais de produção.

Os testes conferem seções com acentos e subseções, referências definidas fora da seção, prévias fora de ordem, cancelamento, rascunhos, resumo, edição menor, lista de páginas vigiadas e os erros de publicação. A comparação automática também é testada com respostas paralelas, falhas, limite de tempo e digitação durante uma consulta.

Os auxiliares sem interface podem ser testados separadamente, informando o arquivo de origem:

```sh
node tests/inline_v26/test_helpers.cjs src/v2_6/inline/inline_controller.js
```

A pasta `legacy_native` conserva os testes de interface da versão anterior, com as alterações de versão e nomes de arquivos registradas em `ADAPTATION.json`. Use a distribuição modular ao executar esses testes. Os relatórios de cada modo identificam os bytes realmente carregados. Não trate resultados de candidatos anteriores como resultados da versão entregue.

```sh
REVISAWIKI_NATIVE_SCRIPT=dist/2.6.0/RevisaWiki_v2_6.js python3 tests/inline_v26/legacy_native/run_release.py Chrome structural-v23 publish-ui publish-keys ui
```

`REVISAWIKI_QA_REPORT` permite escolher o destino de um relatório novo. `REVISAWIKI_QA_FILTER` limita a execução a nomes que correspondam a uma expressão regular, para investigação. Uma execução filtrada não substitui a matriz completa.

As fontes maiores dos testes herdados têm seus artigos, revisões e licenças registrados em `FIXTURE_SOURCES.json`. Os fornecedores de JavaScript mantêm os créditos originais. Os resultados e arquivos gerados pelos navegadores devem permanecer fora do controle de versão.
