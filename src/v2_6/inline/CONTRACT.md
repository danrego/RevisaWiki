# RevisaWiki 2.6, edição rápida

Este módulo adiciona uma superfície de edição ao motor existente. As correções continuam passando pelo mesmo processamento local, verificação de preservação, comparação e Desfazer. `integration_patch.py` exige uma ocorrência exata de cada ponto de integração e falha se o código de origem for diferente do esperado.

## Arquivos e construção

- `inline_controller.js`: auxiliares puros e controlador da sessão.
- `read_launcher.js`: controles leves de leitura. O clique pede ao carregador existente que abra o núcleo e os dados.
- `patch_inline.py`: alterações pontuais no núcleo completo.
- `integration_patch.py`: `apply(source)`, `patch_bootstrap(text)` e `patch_loader(text)` para o construtor da versão.

A implementação foi escrita para o RevisaWiki. O gadget AjaxEdit foi consultado como referência de funcionalidades, sem ser importado como dependência:
https://en.wiktionary.org/w/index.php?title=MediaWiki:Gadget-AjaxEdit.js&oldid=91689859

## Contrato do controlador

`v26CreateInlineController(root, mw, host)` recebe:

```
host = {
  composeSection,
  sectionRange,
  config: () => personalConfig,
  isBusy: () => localBusy || onlineBusy,
  cancel: () => { cancelLocalAnalysis(); cancelCheck(); },
  editorChanged: mount
}
```

Métodos públicos:

- `mount(content)`: instala controles sem repetir botões e sem mudar ligações existentes.
- `open(href, anchor)`: valida a ligação e carrega o código da revisão. Não publica.
- `adapter()`: adaptador de texto para o motor existente, ou `null` se a publicação estiver pendente.
- `summaryAdapter()`: leitura, escrita, captura e restauração do resumo visível.
- `context()`: título de origem, domínio, revisão, identificador da seção, código completo e seções confirmadas.
- `draftContext(session, text)`: compõe o rascunho dentro da revisão de origem confirmada.
- `restoreNativeDraft()`: oferece recuperação na edição nativa, com confirmação pelo botão.
- `state()`: estado sem o texto privado do rascunho.
- `dispose()`: encerra uma sessão sem envio pendente. Não abandona o acompanhamento de um envio incerto.

Não há método público para publicar. O manipulador privado exige `event.isTrusted` no clique do botão Publicar alterações. Enter no resumo, ajustes, prévia, temporizadores e recuperação não acionam esse manipulador.

O adaptador coloca `sectionOnly=true` nas opções e mantém a revisão, o título e a seção fixos durante cada análise. A conferência das referências usa a página de origem inteira, incluindo definições fora da seção.

## Seletores da interface

- `.rw26-launch`, `.rw26-lead-launch`: abrir seção ou introdução.
- `.rw26-inline`: região da sessão, com `data-state`.
- `.rw26-source`: área de texto redimensionável.
- `.rw26-summary`: resumo final visível.
- `.rw26-minor`: opção manual de edição menor.
- `.rw26-watch`: seleção `preferences`, `watch`, `unwatch` ou `nochange`.
- `.rw26-live`: ativar prévia com pausa de 750 ms na digitação.
- `.rw26-publish`, `.rw26-preview`, `.rw26-native`, `.rw26-cancel`.
- `.rw26-copy`, `.rw26-download`, `.rw26-recover`.
- `.rw26-status`, `.rw26-preview-body`, `.rw26-saved-revision`.

## Leitura, contexto e prévia

A abertura faz consultas `query` e `parse` de leitura. Confirma título, ID da página, modelo, permissão indicada pela API, revisão, timestamps, código integral e posições das seções. Uma revisão mais recente que a página exibida exige recarregar antes de abrir. Ligações `T-`, opções não reconhecidas, revisões antigas, comparações e seções de origem ambígua ficam com o editor nativo. Identificadores transcluídos nunca perdem o prefixo por tentativa.

A prévia usa `action=parse` com o rascunho composto na página inteira. Cada resposta depende da geração atual e do texto que a pediu. Respostas antigas e callbacks de sessões encerradas são ignorados. O texto retornado pelo parser aparece apenas na prévia, sem substituir o código do editor. A extensão `wikipage.content` recebe somente o novo elemento da prévia. O controlador não altera registros privados do ResourceLoader.

## Publicação pelo usuário

O botão congela texto, resumo, edição menor, vigia, origem e revisão. Confere novamente título, ID e revisão por leitura antes de enviar, sem atualizar a base do rascunho. O envio usa o título fixo e `nocreate=true` para impedir que uma página removida seja recriada. Usa `mw.Api.assertCurrentUser`, `postWithToken('csrf', ...)`, `baserevid`, `basetimestamp` e `starttimestamp`. O resumo final tem limite de 500 caracteres Unicode. O botão fica desativado durante o envio. Não existe repetição automática de uma edição após erro de transporte.

Uma resposta precisa confirmar `edit.result=Success` com revisão nova válida ou `nochange`. Conflitos, mudanças de sessão, filtros, CAPTCHA e proteção preservam o rascunho e encaminham ao editor completo. Depois de um conflito de revisão, título ou seção, o rascunho antigo continua aberto e a ligação do editor completo abre outra aba. O usuário pode copiar ou baixar o texto antes de resolver a diferença, sem inserir código antigo numa base nova. Um resultado incerto é conferido por leitura. O controlador só o reconhece como salvo se código integral, página, pai da revisão e usuário corresponderem ao envio. Sem essa prova, o envio não se repete.

Depois da confirmação, a página recarrega na revisão exata e na âncora da seção. O recarregamento é recusado se aparecer outro editor, mudar a sessão ou o rascunho deixar de corresponder ao envio. Se o navegador impedir a navegação, a ligação da revisão confirmada continua disponível. Falhas de atualização nunca são tratadas como motivo para republicar. Se outra ferramenta mudar o rascunho depois do clique em Publicar, a revisão enviada continua confirmada e o texto local posterior fica separado no estado `saved-draft`, sem recarregar nem reenviar. Esse texto permanece disponível para copiar ou baixar, com aviso de saída.

## Rascunho e saída

Um único rascunho fica aberto por vez. A saída de um rascunho alterado pede confirmação. O editor completo recebe uma cópia em `sessionStorage`, vinculada à origem, título, seção e revisão por até 15 minutos. O texto nunca vai para a URL nem para páginas da Wikipédia. A recuperação depende de um clique no editor de destino. Fechar uma edição limpa de outra página não apaga um rascunho guardado com título, seção ou revisão diferentes. Se o armazenamento falhar, Copiar rascunho e Baixar rascunho continuam disponíveis.

As configurações de resumo aceitam `$section`, `$sectionname`, `$sectionlink`, `$scriptlink` e `$summary`. `$sectionname` usa o nome da seção. Uma variável desconhecida continua visível e gera aviso. Um resumo manual não é descartado se o modelo não incluir `$summary`.

## Testes

Os testes devem substituir a API por um servidor ou objeto local, recusar chamadas reais de escrita e acionar o botão com o mecanismo normal de clique do navegador. Não existe opção de teste que retire a verificação de clique confiável. Resultados de testes pertencem ao relatório da versão, não a este contrato.
