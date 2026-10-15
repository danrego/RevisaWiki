# RevisaWiki

O botão **Ajustar código** revisa o wikitexto da Wikipédia em português e deixa as mudanças no rascunho, com comparação e opção de desfazer. Na página de leitura, **Editar aqui** abre uma seção para trabalhar no mesmo painel. Somente o clique em **Publicar alterações**, dentro desse editor rápido, inicia o envio.

## Versão 2.6.1

- Reconhece `Referência` e `Referencia` como listas existentes e usa `Referências` sem acrescentar uma lista duplicada.
- Troca os redirecionamentos locais `AP`, `Ap` e `Main` por `Artigo principal`, mantendo todos os argumentos.
- Corrige uma leitura de aspas que escondia etiquetas HTML já fechadas e impedia os ajustes no restante do artigo.
- Recolhe a explicação de trechos preservados em um bloco fechado, sem o aviso genérico sobre código incompleto. Estruturas realmente ambíguas continuam protegidas.
- Na discussão de um artigo, **Criar código** prepara e insere `PD` e `Marca de projeto` no rascunho com um clique. Converte os portais confirmados para marcas de projeto, aceita vários rótulos na mesma linha e mantém avaliações e comentários existentes.

- Retira o botão de introdução junto ao título da página e mantém os atalhos de edição das seções.

Os casos ambíguos, as fórmulas, os exemplos e os trechos incompletos têm proteções próprias. O manual explica os limites de cada regra.

[Arquivos completos da 2.6.1](dist/2.6.1/) · [Instalação](docs/2.6.1/Instalacao_RevisaWiki_v2_6_1.txt) · [Manual para a Wikipédia](docs/2.6.1/Documentacao_RevisaWiki_v2_6_1.wiki) · [Histórico resumido](docs/2.6.1/Notas_da_versao_RevisaWiki_v2_6_1.txt) · [Relatório de testes](docs/2.6.1/Relatorio_testes_RevisaWiki_v2_6_1.txt)

Baixe os arquivos da distribuição e abra **INICIO.html** para copiar o conteúdo completo, o destino e o resumo da edição. Há links diretos para abrir cada página no editor. O índice não salva nem publica alterações.

Para instalar na ptwiki, use o núcleo e os dados separados. O arquivo que reúne tudo ultrapassa o limite de uma única página. Atualize os dados, o núcleo e o bloco completo do carregador, preservando os outros scripts do seu common.js.

## Testar e reconstruir

É preciso Node.js 18 ou posterior e Python 3.

```sh
python3 scripts/build_v261.py
npm test
npm run test:complex
npm run test:documentation
npm run test:privacy
```

`npm test` confere os arquivos distribuídos e executa os casos da correção e os contratos anteriores do motor. `npm run test:complex` acrescenta os artigos maiores. `npm run test:privacy` testa o verificador e confere todos os arquivos acompanhados pelo Git. As revisões usadas nos testes ficam nos manifestos, com seus links permanentes e hashes. Nenhum teste publica na Wikipédia.

A reconstrução da correção parte dos cinco arquivos verificados da distribuição 2.6.0, sem alterar essa versão. Os catálogos empacotados de manutenção permanecem os mesmos. O catálogo de marcas de projeto e os nomes de portais verificados ficam em `src/v2_6_1/all_portals`, com a revisão usada na conferência. As verificações da correção ficam em `tests/v261`. O [guia de testes](tests/README.md) explica as rodadas anteriores. A publicação nos testes da interface usa respostas simuladas em páginas locais, sem edições na Wikipédia.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

Código sob [CC BY-SA 4.0](LICENSE). Os créditos e as revisões dos scripts consultados estão no cabeçalho e no manual.
