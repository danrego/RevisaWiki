# RevisaWiki

O RevisaWiki reúne correções de referências, infocaixas, tabelas e sintaxe no botão **Ajustar código**, no editor de código-fonte da Wikipédia em português. As mudanças ficam no rascunho, com opção de desfazer. Use **Mostrar alterações** e a pré-visualização para conferir o resultado antes de publicar.

## Versão 2.21

- Amplia os mapas de parâmetros de infocaixas, com equivalência conferida para cada predefinição e preservação do valor completo.
- Combina correções de referências, aspas, nomes alternativos e parâmetros na mesma ação, quando as verificações permitem aplicá-las juntas.
- Corrige variantes delimitadas de campos bibliográficos, conservando autores, páginas, identificadores, arquivos e estados de acesso.
- Trata ligações, opções de imagens, cabeçalhos de tabela e espaços sem alterar legendas, destinos, fórmulas ou unidades.
- Exige confirmação vinculada ao rascunho para reparos que dependem de dados externos.
- Conserva campos conflitantes, exemplos de código e trechos sem correspondência comprovada.
- Mantém a chamada fixa do common.js, a opção de desfazer e o limite de 60 segundos.

[Índice de instalação e cópia](dist/2.21.0/INDICE.md) · [Pacote ZIP](dist/2.21.0/RevisaWiki_2.21.0.zip) · [Manual](docs/2.21.0/Documentacao_RevisaWiki_v2_21_0.wiki) · [Instalação](docs/2.21.0/Instalacao_RevisaWiki_v2_21_0.txt) · [Funcionalidades e limites](docs/2.21.0/Funcionalidades_RevisaWiki_2_21.md) · [Relatório de testes](docs/2.21.0/Relatorio_testes_RevisaWiki_v2_21_0.txt)

As 144 fichas do plano têm uma disposição individual no [registro de cobertura](tests/evidence/2.21.0/COVERAGE.json): 114 automações delimitadas, três correções de diagnóstico ou catálogo, 26 estudos preservados e uma proposta sem suporte para ativação. Uma ficha não corresponde necessariamente a uma regra ou a uma alteração em artigo. Os estudos sem equivalência comprovada conservam o texto.

## Instalação

Para usar a distribuição compartilhada, acrescente uma vez a chamada fixa do índice ao seu common.js. Se já a usa, mantenha esse bloco e recarregue sem cache depois da atualização.

Quem mantém a distribuição atualiza **dados, programa, carregador central e documentação**, nessa ordem, pelos arquivos completos do índice. As partes precisam corresponder à mesma versão.

Dados e programa são separados para respeitar o limite de tamanho de cada página. O arquivo `RevisaWiki_v2_21_0_completo.js` excede esse limite e serve para uso local e testes. Não instale a distribuição compartilhada e uma cópia própria ao mesmo tempo.

A instalação na Wikipédia permanece manual. O RevisaWiki não publica páginas. Se a análise atingir 60 segundos, o rascunho, o resumo e os controles anteriores são preservados, e a edição pode continuar.

## Demonstração

[Baixe a demonstração](dist/2.21.0/Demonstracao_RevisaWiki_v2_21_0.html) e abra o arquivo no navegador. O GitHub mostra o código de arquivos HTML. A demonstração funciona offline, usa o mesmo motor distribuído e apresenta 95 exemplos fictícios, incluindo situações que precisam permanecer intactas. Consultas externas não são simuladas como fatos sobre artigos reais.

## Código e testes

A reconstrução parte dos sete arquivos imutáveis da 2.20, confere seus hashes e aplica os módulos de `src/v2_21`. A separação entre dados e programa conserva os valores literais. A compactação de espaços do JavaScript conserva árvore sintática, tokens e comentários. A transferência de valores para o catálogo é conferida separadamente.

Com Python 3, Node.js 24 ou superior e npm 10 ou superior:

```sh
npm ci
python3 scripts/build_v2210.py
npm test
npm run test:documentation
npm run test:privacy
```

O comando `npm test` usa um adaptador de expectativas para quatro recusas confirmadas no módulo nativo. Os testes exigem preservar o código desses casos e atribuem zero crédito de correção automática, mantendo as entradas e as assertivas históricas.

O [guia de testes](tests/v221/README.md) separa os contratos atuais, a regressão histórica, as revisões reais, os controles nativos e os navegadores. Os [resultados agregados](tests/evidence/2.21.0/QA_SUMMARY.json) vinculam as provas aos hashes do código executado. Artigos, revisões, casos sintéticos, chamadas e verificações têm contagens próprias. Os resultados anteriores permanecem com seus status originais.

Os testes de documentação incluem o manifesto público `ARQUIVOS.json`, usado por ferramentas que conferem e carregam os arquivos da versão, e a preservação dos arquivos existentes quando um destino de entrega é recusado.

Nenhum teste publica edições na Wikipédia. Os testes de navegador usam páginas locais e respostas fictícias para as consultas controladas. A campanha de revisões reais usa fontes congeladas e mantém recusas, erros e timeouts separados dos resultados aceitos.

## Versões anteriores

- [2.20.0](docs/2.20.0/Notas_da_versao_RevisaWiki_v2_20_0.txt): parâmetros, infocaixas, referências, portais e fronteiras de preservação.
- [2.19.1](docs/2.19.1/Notas_da_versao_RevisaWiki_v2_19_1.txt): correção da identificação do editor e do erro de objeto cíclico.
- [Histórico completo](docs/2.21.0/Documentacao_RevisaWiki_v2_21_0.wiki): notas das versões em ordem da mais recente para a mais antiga.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Fontes completas da campanha, perfis de navegador, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. Os resultados públicos trazem totais, hashes e limites das provas.

O código próprio usa [CC BY-SA 4.0](LICENSE). Materiais de terceiros conservam suas licenças e as revisões de origem registradas no repositório. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.
