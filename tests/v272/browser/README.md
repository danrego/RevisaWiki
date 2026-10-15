# Testes locais nos navegadores

O roteiro executa 15 fluxos no Chrome, no Firefox e no Safari instalados no Mac. Cada execução usa os arquivos e hashes de `tests/expected_release_v272.json`. As páginas são locais e as respostas da API são simuladas. Nenhuma edição é publicada, e os testes encerram apenas seus próprios perfis e sessões.

Os 13 fluxos anteriores permanecem com as mesmas asserções. Dois novos casos verificam o artigo completo de Zara Larsson e exemplos de tabelas dentro de blocos protegidos. No artigo, falta apenas uma aspa no valor numérico de rowspan. As seis linhas que combinam rowspan com predefinições de resultado já são válidas e precisam permanecer exatamente iguais. Os 11 quadros de prêmios, as referências e o trecho com aspas e itálico também são conferidos.

A consulta de gênero usa uma cópia verificada da entidade pública do Wikidata. O roteiro percorre a preparação anônima da consulta e a prova vinculada ao texto original antes de conferir os portais Biografias e Mulheres. Não atribui gênero a partir do nome ou da aparência. Desfazer precisa recuperar todos os bytes da revisão original.

As fontes químicas e os arquivos do teste de largura do Firefox continuam fixados em `tests/v271`. As páginas de geometria usam imagens vazias nas dimensões declaradas, sem baixar imagens ou fazer capturas de tela. O teste não pretende revisar toda a aparência do artigo.

```sh
node tests/v272/browser/run_release.cjs Chrome dist/2.7.2
node tests/v272/browser/run_release.cjs Firefox dist/2.7.2
node tests/v272/browser/run_release.cjs Safari dist/2.7.2
node tests/v272/browser/summarize_release.cjs artifacts/v272/browser
```

O módulo Playwright precisa estar disponível, além dos três navegadores e da automação remota do Safari. Os caminhos dos relatórios podem ser informados pelas variáveis usadas no roteiro. Não há acesso à área de transferência.
