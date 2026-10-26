# RevisaWiki

O RevisaWiki reúne correções de referências, infocaixas, tabelas e sintaxe no botão **Ajustar código**, no editor de código-fonte da Wikipédia em português. As mudanças ficam no rascunho, com opção de desfazer. Use **Mostrar alterações** e a pré-visualização para conferir o resultado antes de publicar.

## Versão 2.21.1, instalação corrigida

A revisão `2.21.1-installation.1` protege os dados contra normalização Unicode e substituições feitas durante o salvamento na Wikipédia. O catálogo em execução e o hash esperado permanecem iguais. O gerador aplica a proteção e a entrega exige uma prova de pré-salvamento dos arquivos finais.

- Ligações externas, bibliografias e leituras adicionais só recebem duas colunas com oito itens principais ou mais.
- Subitens não aumentam essa contagem.
- Listas curtas com um invólucro simples de duas colunas podem voltar a uma coluna. Estilos próprios e estruturas com notas ou conteúdo incerto são preservados.
- As regras das referências permanecem iguais às da versão anterior.

[Índice para copiar e colar](dist/2.21.1-installation.1/INDICE.md) · [Pacote ZIP](dist/2.21.1-installation.1/RevisaWiki_2.21.1-installation.1.zip) · [Manual](docs/2.21.1-installation.1/Documentacao_RevisaWiki_v2_21_1.wiki) · [Instalação](docs/2.21.1-installation.1/Instalacao_RevisaWiki_v2_21_1.txt)

Os arquivos originais da [2.21.1](https://github.com/danrego/RevisaWiki/releases/tag/v2.21.1) permanecem disponíveis como registro histórico; para instalar, use o índice corrigido acima.

As demais correções da 2.21.0 foram conservadas. A prova de reversão da correção de colunas permanece nos registros originais. Nesta revisão, a igualdade do catálogo decodificado e os hashes dos seis arquivos de código preservados são conferidos separadamente. A chamada fixa do common.js continua igual.

## Instalação

Para usar a distribuição compartilhada, acrescente uma vez a chamada fixa do índice ao seu common.js. Se já a usa, mantenha esse bloco e recarregue sem cache depois da atualização.

Quem mantém a distribuição atualiza **dados, programa, carregador central e documentação**, nessa ordem, pelos arquivos completos do índice. As partes precisam corresponder à mesma versão.

Dados e programa são separados para respeitar o limite de tamanho de cada página. O arquivo `RevisaWiki_v2_21_1_completo.js` excede esse limite e serve para uso local e testes. Não instale a distribuição compartilhada e uma cópia própria ao mesmo tempo.

A instalação na Wikipédia permanece manual. O RevisaWiki não publica páginas. Se a análise atingir 60 segundos, o rascunho, o resumo e os controles anteriores são preservados, e a edição pode continuar.

## Demonstração

[Baixe a demonstração](dist/2.21.1-installation.1/Demonstracao_RevisaWiki_v2_21_1.html) e abra o arquivo no navegador. O GitHub mostra o código de arquivos HTML. A demonstração funciona offline, usa o mesmo motor distribuído e apresenta 95 exemplos fictícios, incluindo situações que precisam permanecer intactas. Consultas externas não são simuladas como fatos sobre artigos reais.

## Código e testes

A reconstrução deste patch parte dos sete arquivos imutáveis da 2.21.0 e aplica os reparos delimitados de `src/v2_21_1`. Os dados do catálogo permanecem iguais.

Com Python 3, Node.js 24 ou superior e npm 10 ou superior:

```sh
npm ci
python3 scripts/build_v2211.py
npm test
npm run test:presave
npm run build:index
npm run test:documentation
npm run test:privacy
```

O comando `npm test` confere a serialização protegida e executa as distribuições atuais, os limites de sete e oito itens, sublistas, invólucros simples e personalizados, proteção de conteúdo e regressões de referências e Worker. Os testes antigos e seus resultados permanecem nos diretórios das respectivas versões. A campanha completa da 2.21.0 não foi apresentada como uma nova execução deste patch.

O [relatório da versão](tests/evidence/2.21.1-installation.1/QA_SUMMARY.json) separa cálculos atuais, comparações com a base, casos de interface e exemplos da demonstração.

O teste `test:presave` envia o código final à API de transformação pré-salvamento em modo de leitura, sem autenticação nem edições. A entrega recusa uma resposta alterada, uma falha de acesso ou um comprovante que pertença a outros arquivos. O núcleo, o carregador e a chamada fixa do common.js permanecem idênticos aos da 2.21.1 original.

Os testes de documentação incluem o manifesto público `ARQUIVOS.json`, usado por ferramentas que conferem e carregam os arquivos da versão, e a preservação dos arquivos existentes quando um destino de entrega é recusado.

Nenhum teste publica edições na Wikipédia. Os testes de navegador usam páginas locais e respostas fictícias para as consultas controladas. A campanha de revisões reais usa fontes congeladas e mantém recusas, erros e timeouts separados dos resultados aceitos.

## Versões anteriores

- [2.21.0](docs/2.21.0/Notas_da_versao_RevisaWiki_v2_21_0.txt): campos de infocaixas, referências e sintaxe.
- [2.20.0](docs/2.20.0/Notas_da_versao_RevisaWiki_v2_20_0.txt): parâmetros, infocaixas, referências, portais e fronteiras de preservação.
- [2.19.1](docs/2.19.1/Notas_da_versao_RevisaWiki_v2_19_1.txt): correção da identificação do editor e do erro de objeto cíclico.
- [Histórico completo](docs/2.21.1-installation.1/Documentacao_RevisaWiki_v2_21_1.wiki): notas das versões em ordem da mais recente para a mais antiga.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Fontes completas da campanha, perfis de navegador, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. Os resultados públicos trazem totais, hashes e limites das provas.

O código próprio usa [CC BY-SA 4.0](LICENSE). Materiais de terceiros conservam suas licenças e as revisões de origem registradas no repositório. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.
