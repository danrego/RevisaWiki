# RevisaWiki

Script para revisar o código-fonte da Wikipédia em português. Os ajustes ficam no rascunho, com opção de desfazer. A comparação usa Mostrar alterações do editor.

## Versão 2.17

- Mostra na revisão problemas confirmados no rascunho final e escolhas que ainda correspondem ao trecho.
- Agrupa problemas repetidos, mantendo todos os locais e as opções de cada ocorrência acessíveis.
- Deixa de exibir avisos antigos, lacunas de catálogo e consultas opcionais inconclusivas como erros do artigo.
- Corrige 21 erros de acentuação conferidos em campos de quatro infocaixas pessoais.
- Retira aliases vazios em dez famílias de campos quando a exibição e as referências permanecem iguais.
- Corrige `nome` e `grupo` em etiquetas de referência quando uma definição ou chamada nativa confirma a ligação entre as ocorrências.
- Corrige juntos de dois a quatro nomes de atributos de células quando só uma combinação forma a tabela regular.
- Mantém a revisão no painel existente, sem mudar o código apenas para ocultar avisos ou desligar as proteções de conteúdo.

As regras de infocaixas cobrem seis definições nativas. Nomes alternativos aceitos, campos preenchidos diferentes e valores explicitamente vazios que controlam a exibição permanecem como estavam. Em `ocupação=|ocupações=Escritora`, o campo vazio tem precedência e não é retirado. Os campos de sepultamento continuam sem alteração.

Nas referências, o nome e o grupo precisam ter uma única definição e uma única lista correspondente depois das chamadas. Uma predefinição que possa acrescentar fontes pode impedir essa confirmação. As correções de tabelas conservam os números e o conteúdo das células. O manual explica os limites de cada regra, e a publicação continua sob controle de quem edita.

## Instalação

[Pacote completo](dist/2.17.0/RevisaWiki_2.17.0.zip) · [Índice para copiar](dist/2.17.0/INICIO.html) · [Instruções](docs/2.17.0/Instalacao_RevisaWiki_v2_17_0.txt) · [Manual](docs/2.17.0/Documentacao_RevisaWiki_v2_17_0.wiki) · [Histórico resumido](docs/2.17.0/Notas_da_versao_RevisaWiki_v2_17_0.txt) · [Testes](docs/2.17.0/Relatorio_testes_RevisaWiki_v2_17_0.txt)

Atualize dados, núcleo, carregador central e documentação, nessa ordem. Quem já usa a chamada fixa mantém o common.js como está. O arquivo completo excede o limite de uma página da Wikipédia, por isso a instalação separa dados e núcleo.

O índice permite copiar o arquivo inteiro, o destino e o resumo, com um link direto para o editor. Ele não salva páginas. O HTML pode ser aberto localmente, mas o GitHub mostra seu código, sem executar o índice.

O aviso que cita o máximo de 102400 bytes pertence ao realce de sintaxe da página. Nesse caso, o visualizador mostra o código sem cores. Esse limite de exibição não impede salvar nem executar JavaScript. O índice oferece um link para conferir o arquivo bruto. Erros de sintaxe ou recusas de publicação exigem uma verificação separada.

## Código e verificações

A reconstrução parte dos sete arquivos da distribuição 2.16.0, conferidos por SHA-256, e aplica os módulos de `src/v2_17`. As versões arquivadas ficam intactas.

```sh
python3 scripts/build_v2170.py
npm test
npm run test:complex
npm run test:documentation
npm run test:privacy
```

O [guia dos testes](tests/v217/README.md) explica os comandos adicionais, os dados fixados e os limites. As execuções usam distribuições modular e completa, revisões públicas guardadas e páginas locais nos navegadores. As comparações nativas guardam a origem e a identificação das respostas, sem transformar resultados antigos em novos testes. Nenhum teste edita a Wikipédia.

A contagem informa as operações confirmadas, separadas dos tipos de ajuste. Quando não consegue comprovar um total, o painel não inventa um número exato. Mostrar alterações permite conferir o resultado no editor. A escolha do que aparece em Precisa de revisão não altera o código. Nos problemas agrupados, Ir ao trecho percorre as ocorrências confirmadas. As propostas mantêm as escolhas de cada trecho, inclusive quando se resolve uma ocorrência que não era a primeira.

## Referências de versões anteriores

A recuperação de modelos de referência da 2.8.2 continua limitada aos casos previamente verificados no catálogo. Dos 154 examinados, 132 receberam correspondência confirmada, com 101 `Citar web`, 29 `Citar jornal` e dois `Citar revista`. Foram recuperadas 103 URLs comprovadas, e 22 chamadas permaneceram como `Citation`. Cada correção exige correspondência com o artigo e a referência registrados. Uma chamada genérica legítima fora desses casos permanece como está.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

O código próprio do RevisaWiki usa [CC BY-SA 4.0](LICENSE). Os arquivos de terceiros conservam suas licenças. Os [casos de referência do MediaWiki](tests/v2150/reader_official_contracts.json) mantêm a indicação GPL-2.0-or-later e a origem registrada no próprio arquivo. As fontes e revisões dos scripts consultados ficam no cabeçalho e no manual.

Arquivos de terceiros mantêm as licenças indicadas nas pastas correspondentes.
