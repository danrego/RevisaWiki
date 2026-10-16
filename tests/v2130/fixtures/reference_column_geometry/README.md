# Geometria das colunas de referências

Os arquivos HTML foram obtidos por consultas públicas e anônimas de `action=parse`, usando apenas GET e textos sintéticos com 10, 11 ou 30 referências. Cada versão com estilo tem a mesma lista de fontes da versão simples. A partir de 11 entradas, o próprio Cite acrescenta `mw-references-columns`. O teste mantém esse elemento para medir a combinação das colunas externas e internas.

`cite.css` e `site.css` contêm as declarações devolvidas pelo ResourceLoader da ptwiki. Apenas os comentários foram retirados. Os endereços, tamanhos e SHA-256 estão no manifesto. O teste usa essas regras no navegador e fixa somente a tipografia e o espaçamento do contêiner de conteúdo. Ele não reproduz a aparência completa de uma skin. A captura opcional da skin Vector recebeu HTTP 429 e ficou fora da prova.

O programa `run_reference_column_geometry.cjs` mede as listas em Chrome, Firefox e Safari instalados, com janelas ou perfis de automação separados. Os testes usam páginas locais, sem capturas de tela, acesso à área de transferência ou publicação na Wikipédia. As larguras são 320, 375, 768, 1024 e 1920 pixels. A largura útil desconta a barra de rolagem vertical quando o navegador reserva espaço para ela.

As colunas são contadas pelas coordenadas dos fragmentos físicos de cada item da lista. O teste confere também os identificadores, a ordem e o texto de todas as referências. Ele não usa o valor de `column-count` como prova de quantas colunas apareceram.

O estilo novo precisa formar uma coluna nas telas estreitas, duas na tela larga e nunca mais de duas, sem transbordamento horizontal. O controle negativo usa o estilo antigo com contagem fixa. Esse controle permite reproduzir quatro colunas visíveis quando o contêiner do Cite também se divide e duas colunas em telas estreitas.

O modo `--bind-release` acrescenta a verificação do SHA-256 do candidato congelado e exige que a função exportada produza exatamente os três textos que foram renderizados pela ptwiki. Sem essa opção, o relatório declara que mediu o CSS da proposta e não afirma ter validado sua integração no programa final.

## Fontes e licenças

Os textos sintéticos foram criados para o teste. As folhas de estilo do Cite vêm de código MediaWiki sob GPL-2.0-or-later, com fonte em [mediawiki/extensions/Cite](https://gerrit.wikimedia.org/g/mediawiki/extensions/Cite). Os estilos locais da Wikipédia usam CC BY-SA 4.0 e podem ser conferidos no [histórico de MediaWiki:Common.css](https://pt.wikipedia.org/w/index.php?title=MediaWiki:Common.css&action=history). As licenças estão indicadas no manifesto. A licença CC BY-SA 4.0 acompanha o repositório e o texto GPL versão 2 acompanha esta pasta.
