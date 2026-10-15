# Testes locais nos navegadores

O roteiro executa 13 fluxos no Chrome, no Firefox e no Safari instalados no Mac. Cada execução usa as versões e os hashes de `tests/expected_release_v271.json`. As páginas de teste são locais, as respostas da API são simuladas e nenhuma edição é publicada. Os perfis e sessões pertencem somente aos testes.

Os dez fluxos herdados da 2.7 verificam instalação, ausência de botões extras na leitura, artigos grandes, comparação, escolhas de ajustes, resumo e desfazer. Os três novos fluxos usam as revisões públicas de Dofetilida e Perampanel para conferir a correção de chaves químicas, a quebra visual de um InChI longo e a preservação de uma caixa já corrigida. Todos os campos, referências e imagens devem permanecer.

O teste de largura usa o HTML e o CSS públicos capturados, com imagens vazias nas mesmas dimensões declaradas. Não baixa imagens nem registra capturas de tela. O Firefox precisa reproduzir a largura excessiva antes do reparo, e o texto da tabela precisa ser idêntico depois. Esse teste verifica a geometria da caixa, sem pretender revisar toda a aparência do artigo.

```sh
node tests/v271/browser/run_release.cjs Chrome dist/2.7.1
node tests/v271/browser/run_release.cjs Firefox dist/2.7.1
node tests/v271/browser/run_release.cjs Safari dist/2.7.1
node tests/v271/browser/summarize_release.cjs artifacts/v271/browser
```

Os caminhos de execução e dos relatórios podem ser informados pelas variáveis usadas no roteiro. O módulo Playwright deve estar disponível, além dos três navegadores e da automação remota do Safari. Não há acesso à área de transferência.
