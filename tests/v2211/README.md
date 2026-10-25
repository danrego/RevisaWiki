# Testes do RevisaWiki 2.21.1

Esta atualização confere o mínimo de oito itens principais nas listas finais. Os arquivos da 2.21.0 e seus resultados continuam intactos. A prova inversa do manifesto recupera os sete arquivos anteriores a partir do patch.

Com Node.js 24 ou posterior e Python 3:

```sh
npm ci
python3 scripts/build_v2211.py
npm test
npm run test:documentation
npm run test:privacy:2211
npm run test:privacy
```

`npm test` carrega as distribuições novas sem trocar funções do produto. A bateria cobre os limites de sete e oito itens, as sete grafias de seção já reconhecidas, sublistas, contagem de ligações, exemplos protegidos, formatos de linha, opções desligadas e invólucros simples ou personalizados. Também executa controles conservados de referências e mensagens de Worker. Cálculos da versão atual e da base têm contagens separadas.

A limpeza de colunas curtas exige uma estrutura completa e simples. Campos concorrentes, estilos próprios, código literal, notas e estruturas sem correspondência confirmada permanecem protegidos. Um reparo anterior pode produzir uma chamada nativa válida antes de a regra de colunas ser aplicada. Há casos específicos para essa composição, com conferência do conteúdo inteiro.

Os testes de documentação usam arquivos fictícios em pastas temporárias. Eles verificam os hashes, os destinos, o manifesto, o índice, o ZIP e a preservação de todo o histórico anterior. A documentação final só é montada depois da QA vinculada aos arquivos reais.

`browser_columns.cjs` usa navegadores instalados e um editor fictício local. Os testes alteram somente as condições de acesso ao host de teste e o adaptador do editor. A automação não abre contas nem publica na Wikipédia. A infraestrutura de drivers está em `tests/v219/browser`; ela precisa estar disponível no computador de teste.

Os relatórios públicos ficam em `tests/evidence/2.21.1`. Fontes de artigos, relatórios locais de navegador, caminhos da máquina e perfis não integram a publicação. As limitações históricas e os casos conhecidos com timeout não são reclassificados nem repetidos para aprovar esta correção.
