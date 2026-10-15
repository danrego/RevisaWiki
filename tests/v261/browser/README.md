# Testes locais nos navegadores do macOS

Este teste abre um simulador local do editor. Os arquivos de produção conservam seus hashes. As cópias servidas ao navegador apenas aceitam o endereço local do teste.

Use Node.js 22 ou posterior, Playwright e os navegadores instalados no macOS. Para Safari, ative a automação remota no menu Desenvolvedor. O teste encerra somente a sessão que ele próprio criou. Se o Safari recusar a sessão, o teste informa a falha e termina.

Execute os navegadores um de cada vez, a partir da raiz do repositório:

```sh
node tests/v261/browser/run_focused.cjs Chrome dist/2.6.1
node tests/v261/browser/run_focused.cjs Firefox dist/2.6.1
node tests/v261/browser/run_focused.cjs Safari dist/2.6.1
```

Os relatórios ficam em `artifacts/v261/browser`, que deve ser ignorado pelo Git. Os perfis temporários do Firefox também usam essa pasta e são removidos ao terminar. Para escolher outra pasta, defina `REVISAWIKI_BROWSER_REPORT_DIR` e `REVISAWIKI_BROWSER_ARTIFACTS`.

O teste procura os aplicativos instalados na pasta de aplicativos do sistema. Você pode indicar outros executáveis com `REVISAWIKI_CHROME`, `REVISAWIKI_FIREFOX` ou `REVISAWIKI_SAFARIDRIVER`. Se o Playwright estiver fora do caminho de módulos do Node.js, indique o módulo com `REVISAWIKI_PLAYWRIGHT`.

O botão Ajustar código é acionado no editor simulado. O teste confere a resposta do Worker, os cinco casos de AP/Main, a lista de referências, o diff, o desfazer e a repetição dos ajustes. Na discussão de um artigo, também confere o botão Criar código com seleção parcial do texto, os três adaptadores de editor, as avaliações existentes, o resumo manual e as falhas de leitura ou escrita. Há casos de projetos registrados e de portais confirmados ou ausentes na API simulada.

Na página de leitura, o teste verifica que o título não recebe um botão de introdução. Os atalhos das seções continuam presentes e abrem a seção correta. Esse teste passa pelos dois carregadores, pelo núcleo modular e pela versão completa.

A API é simulada em memória e recusa ações de escrita. A política de conteúdo bloqueia conexões externas e envio de formulários. O teste não abre a Wikipédia, não publica edições, não tira capturas de tela e não usa a área de transferência do sistema.

`ADAPTATION.json` contém os hashes da versão testada e das cópias portáteis do teste. As bibliotecas jQuery e textSelection conservam os avisos de licença de suas versões já presentes no repositório.
