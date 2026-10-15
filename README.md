# RevisaWiki

O RevisaWiki revisa o código das páginas da Wikipédia em português. **Ajustar código** aplica as regras ao rascunho, **Ver o que mudou** mostra a comparação e **Desfazer ajustes** recupera o texto anterior. A ferramenta não salva nem publica uma edição.

A versão atual é **2.2.0**. Além das regras anteriores, corrige a conferência de tabelas divididas por ano, reduz avisos sem ação necessária e pode colocar Artigo principal depois de um título inteiramente formado por uma ligação. Essa remissão exige confirmação de um destino existente e sem desambiguação.

## Instalação

Baixe o repositório em **Code → Download ZIP**, descompacte e abra [o índice de copiar e colar](dist/2.2.0/INICIO.html). Atualize os dados, o programa, apenas o carregador do RevisaWiki no common.js e a documentação, nessa ordem. Preserve seus outros scripts e escolha um único carregador.

[As instruções completas](dist/2.2.0/Instalacao_RevisaWiki_v2_2.txt) incluem os destinos e os dois carregadores. O arquivo completo ultrapassa o limite de uma página da ptwiki. Para instalar, use os dados e o núcleo separados.

## O que mudou

A pré-visualização compara o plano de divisão anual calculado a partir do código original com as células renderizadas. Todas as linhas, valores e repetições precisam permanecer. Células alteradas, registros apagados ou acrescentados e planos diferentes são recusados. Tabelas que exigem interpretação permanecem fora do ajuste automático.

Títulos formados por uma única ligação podem receber uma remissão logo abaixo. Chamadas existentes são preservadas. Datas ambíguas ficam iguais, sem avisos de escolha, e etiquetas de manutenção não são apagadas. Explicações sobre código dinâmico ficam recolhidas em Informações técnicas.

As revisões públicas em Óptica e oito outros artigos ajudaram a conferir ajustes restritos de legendas, marcação de séculos e sete nomes portugueses em ligações. Títulos bibliográficos, autores e alterações de conteúdo não recebem essas trocas.

## Testes

[O relatório](dist/2.2.0/Relatorio_testes_RevisaWiki_v2_2.txt) separa verificações de regras, fluxos nos navegadores e artigos distintos. Os testes usaram os 1.000 artigos do conjunto congelado, incluindo 538 biografias confirmadas independentemente, e Firefox, Chrome e Safari reais no Mac. As respostas de API dos testes de interface são simuladas. Três exemplos anuais usam HTML realmente renderizado pelo MediaWiki. Nenhuma edição foi feita na Wikipédia.

Para repetir os testes locais incluídos no repositório, execute `npm test`. Para reconstruir núcleo e dados com os mesmos bytes, execute `python3 scripts/build.py` e repita `npm test`. Esses comandos não repetem o corpus de 1.000 artigos nem abrem os três navegadores. [As instruções de testes](tests/README.md) explicam a cobertura.

## Código e licença

A distribuição atual fica em `dist/2.2.0`, e a 2.1.1 permanece em seu diretório histórico. O código e a documentação mantêm [CC BY-SA 4.0](LICENSE). Os créditos e a atribuição dos textos usados em testes estão nos arquivos. O programa, os dados e o carregador precisam pertencer à mesma versão.
