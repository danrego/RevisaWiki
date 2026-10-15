# RevisaWiki

O RevisaWiki ajusta o código das páginas da Wikipédia em português e deixa o resultado no editor para conferência. **Ver o que mudou** abre a comparação, e **Desfazer ajustes** recupera o texto anterior. A ferramenta não salva nem publica páginas.

A versão atual é **2.3.0**. Ela retira cópias literais de infocaixas e chamadas finais quando o contexto permite, organiza listas globais redundantes e preserva listas por seção ou grupo. Caixas com dados diferentes permanecem. A pré-visualização confere os campos e as referências exibidos. Também corrige resíduos conhecidos de tradução e evita acrescentar listas a uma cauda de código que tenha um bloco sem fechamento.

## Instalação

Baixe o repositório em **Code → Download ZIP** e abra [o índice de copiar e colar](dist/2.3.0/INICIO.html). Atualize os dados, o programa, o carregador do RevisaWiki no common.js e a documentação, nessa ordem. Preserve seus outros scripts e use apenas um carregador.

[As instruções completas](dist/2.3.0/Instalacao_RevisaWiki_v2_3.txt) incluem os destinos e os dois carregadores. Para instalar na ptwiki, use dados e programa separados. O arquivo completo ultrapassa o limite de uma página.

## Testes

[O relatório da 2.3.0](dist/2.3.0/Relatorio_testes_RevisaWiki_v2_3.txt) registra os testes da versão final, os novos 1.000 artigos acima de 100 KB, a regressão histórica e os navegadores reais no Mac. Os editores e a API de teste são locais. Nenhuma edição foi feita na Wikipédia.

Execute `npm test` para conferir os arquivos e repetir os casos incluídos. `python3 scripts/build.py` reconstrói os mesmos arquivos de programa e dados a partir do código completo. [As instruções de testes](tests/README.md) distinguem os testes rápidos das baterias com corpus e navegadores.

## Código e licença

As versões anteriores permanecem em seus diretórios. Código e documentação mantêm [CC BY-SA 4.0](LICENSE), com os créditos e a atribuição das fontes nos arquivos.
