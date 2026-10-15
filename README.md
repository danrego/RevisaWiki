# RevisaWiki

O RevisaWiki ajusta o código das páginas da Wikipédia em português e deixa o resultado no editor para conferência. **Ver o que mudou** abre a comparação. **Desfazer ajustes** recupera o texto anterior. A ferramenta não salva páginas.

A versão atual é [**2.4.0**](dist/2.4.0/Notas_da_versao_RevisaWiki_v2_4.txt). Os reparos de sintaxe entram antes dos demais ajustes, nos padrões e limites explicados na [documentação completa](dist/2.4.0/Documentacao_RevisaWiki_v2_4.wiki).

## Instalação

Baixe o repositório em **Code → Download ZIP** e abra [o índice de copiar e colar](dist/2.4.0/INICIO.html). Atualize dados, programa, carregador e documentação nessa ordem. Preserve os outros scripts do common.js e mantenha uma única chamada do RevisaWiki.

[As instruções completas](dist/2.4.0/Instalacao_RevisaWiki_v2_4.txt) trazem os destinos e os dois carregadores. A instalação na Wikipédia usa núcleo e dados separados.

## Testes

[O relatório da 2.4.0](dist/2.4.0/Relatorio_testes_RevisaWiki_v2_4.txt) identifica as fontes, os resultados executados e os limites da validação. Os resultados das versões anteriores permanecem em seus diretórios.

`npm test` confere os arquivos finais e repete os contratos incluídos. `python3 scripts/build.py` reconstrói os mesmos bytes sem atualizar os hashes esperados. [As instruções de testes](tests/README.md) separam os contratos locais, os testes de navegador e os conjuntos de artigos.

## Histórico

As versões estão em ordem da mais recente para a mais antiga. As entregas de revisão que conservaram um número estão reunidas na mesma linha. A documentação completa guarda as explicações dos recursos anteriores.

| Versão | Mudanças |
| --- | --- |
| 2.4.0 | Reparos de fechamento antes dos demais ajustes, 29 erros exatos de nomes de parâmetros e ajuste do trecho completo anterior a uma cauda incompleta. Referências nomeadas ficam protegidas nessa passagem. Os avisos são conferidos novamente depois dos reparos. |
| 2.3.0 | Retirada de cópias idênticas de infocaixas e chamadas finais, consolidação de listas globais redundantes e reparos de resíduos conhecidos de copiar e colar. Conservação de separadores entre dígitos e das fontes no bloco final. |
| 2.2.1 | Atalho Ajustar código antes do botão Publicar, com as mesmas regras e os mesmos catálogos da 2.2.0. |
| 2.2.0 | Correção da conferência de tabelas, remissões depois de títulos de seções e redução de avisos sem ação necessária. Reparos de apresentação conferidos em revisões públicas. |
| 2.1.1 | Separação de subtítulos anuais em tabelas reconhecidas, mantendo os registros e as referências. |
| 2.1.0 | Ampliação das profissões e dos portais de biografias, confirmação própria para Mulheres e revisão da leitura de notas e das respostas de pré-visualização. |
| 2.0.1 | Reparo do argumento de Colunas-lista, conversão de Cite news para Citar jornal e proteção dos separadores de tabelas junto a referências. |
| 2.0.0 | Reparos confirmados de citações e tabelas, conferência automática da pré-visualização e separação entre o programa e os catálogos na instalação. |
| 1.9.1 | Preservação de dni e Dni, proteção contra a adição redundante de Brasil quando há portal de estado brasileiro e uso de parâmetros posicionais em chamadas simples de Portal3. |
| 1.9.0 | Grafias exatas em Ajustar código, inicial minúscula nas profissões da infocaixa, portais pela infocaixa, idade com confirmação de pessoa viva, abertura nos espaços de wikitexto e nomes neutros para referências. |
| 1.8.0 | Melhoria do processamento, reutilização de referências idênticas, reparos automáticos de parâmetros, contador de bytes e marcação de edição menor para mudanças mecânicas confirmadas. |
| 1.7.0 | Ampliação do catálogo, colunas de referências a partir de seis entradas, preservação de nomes alternativos válidos e conferência de citações abreviadas. |
| 1.6.0 | Reorganização do painel e do relatório, comparação com linhas de contexto, resumos automáticos revistos e correções de estabilidade. |
| 1.5.0 | Conferência de tabelas e datas, escolhas para desambiguações, conferência integrada, resumos específicos e diagnóstico copiável. Conferência experimental de TemplateStyles. |
| 1.4.0 | Ampliação da sintaxe importada, controle de autoridade e organização das seções finais. A entrega de biografias com o mesmo número acrescentou Biografias em artigos com infocaixa individual reconhecida. |
| 1.3.0 | Ampliação do catálogo ortográfico, propostas de possíveis palavras repetidas e lista pessoal de palavras. |
| 1.2.1 | Revisão do uso de colunas nas referências e ajuste automático de colunas em listas compatíveis de Leitura adicional e Ligações externas. |
| 1.2.0 | Reutilização da leitura de predefinições na pontuação das referências, processamento separado quando disponível, andamento visível e cancelamento. Reorganização do painel. |
| 1.1.0 | Conferência ortográfica separada, com contexto e escolhas por ocorrência. As regras de código da 1.0 foram mantidas. |
| 1.0.0 | Adoção do nome RevisaWiki, com as regras do Ajuste geral 2.6, comparação, escolhas por trecho, desfazer e resumo automático sem nome de usuário. |

## Código e licença

Os arquivos das distribuições anteriores permanecem preservados. Código e documentação usam [CC BY-SA 4.0](LICENSE), com os créditos e a atribuição das fontes nos arquivos.
