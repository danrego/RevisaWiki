# RevisaWiki

O RevisaWiki ajusta o código das páginas da Wikipédia em português e deixa o resultado no editor para conferência. **Ver o que mudou** abre a comparação, e **Desfazer ajustes** recupera o texto anterior. A ferramenta não salva nem publica a página.

A versão atual é **2.2.1**. O botão azul **Ajustar código** continua no painel. No editor clássico e no CodeMirror, um segundo botão, em verde azulado, aparece antes de **Publicar página** ou **Publicar alterações**. Os dois aplicam os mesmos ajustes e ficam desativados durante uma análise. No editor de código-fonte de 2017, use o botão do painel.

## Instalação

Baixe o repositório em **Code → Download ZIP** e abra [o índice de copiar e colar](dist/2.2.1/INICIO.html). Atualize os dados, o programa, o carregador do RevisaWiki no common.js e a documentação, nessa ordem. Preserve seus outros scripts e use apenas um carregador.

[As instruções completas](dist/2.2.1/Instalacao_RevisaWiki_v2_2_1.txt) incluem os destinos e os dois carregadores. Para instalar na ptwiki, use os arquivos separados de dados e programa. O arquivo completo ultrapassa o limite de uma página.

## Testes

[O relatório da 2.2.1](dist/2.2.1/Relatorio_testes_RevisaWiki_v2_2_1.txt) registra os testes locais do novo botão, dos ajustes, da comparação, do desfazer e dos carregadores em Firefox, Chrome e Safari no Mac. As páginas e a API são simuladas. Nenhuma edição foi feita na Wikipédia.

As regras e os catálogos permanecem iguais aos da 2.2.0. Uma comparação do código verifica essa conservação. [O relatório anterior](dist/2.2.0/Relatorio_testes_RevisaWiki_v2_2.txt) contém a execução sobre 1.000 artigos, incluindo 538 biografias. Esse corpus não foi repetido na atualização de interface.

Execute `npm test` para conferir os arquivos, a conservação das regras e os casos incluídos de títulos e tabelas. `python3 scripts/build.py` reconstrói os mesmos arquivos de programa e dados a partir do código completo. [As instruções de testes](tests/README.md) explicam os comandos e a cobertura.

## Código e licença

As versões anteriores permanecem em seus diretórios de distribuição. Código e documentação mantêm [CC BY-SA 4.0](LICENSE), com os créditos e a atribuição das fontes nos arquivos.
