# RevisaWiki

Script para revisar o código-fonte da Wikipédia em português. Os ajustes ficam no rascunho, com opção de desfazer. A comparação usa Mostrar alterações do editor.

## Versão 2.15.1

- Move a infocaixa pessoal para antes da abertura quando a posição pode ser confirmada e retira a indentação acidental antes da caixa.
- Destaca o nome inicial exato do assunto e retira sua ligação para o próprio artigo.
- Organiza datas e locais já escritos na identificação inicial. Pode completá-los com campos explícitos e referenciados de uma única infocaixa pessoal.
- Corrige caracteres invisíveis em nomes de campos e um sinal de igual de largura completa quando o campo nativo é confirmado.
- Corrige a unidade repetida de tamanho da imagem nos campos cujo funcionamento foi conferido.
- Separa arquivo de imagem, texto alternativo, tamanho e legenda nos campos nativos confirmados, preservando o conteúdo.
- Conta cada operação mantida e inclui a identificação inicial no resumo quando ela muda. A inserção de dados na abertura não recebe marcação automática de edição menor.
- Mantém os campos de sepultamento como estavam. Dados conflitantes, referências incertas e estruturas ambíguas ficam intactos.

Os reparos conservam os dados e as referências. Datas incompletas, nomes conflitantes e construções ambíguas ficam como estavam. Os limites de cada regra ficam no manual e nos testes. A publicação continua sob controle de quem edita.

## Instalação

[Pacote completo](dist/2.15.1/RevisaWiki_2.15.1.zip) · [Índice para copiar](dist/2.15.1/INICIO.html) · [Instruções](docs/2.15.1/Instalacao_RevisaWiki_v2_15_1.txt) · [Manual](docs/2.15.1/Documentacao_RevisaWiki_v2_15_1.wiki) · [Histórico resumido](docs/2.15.1/Notas_da_versao_RevisaWiki_v2_15_1.txt) · [Testes](docs/2.15.1/Relatorio_testes_RevisaWiki_v2_15_1.txt)

Atualize dados, núcleo, carregador central e documentação, nessa ordem. Quem já usa a chamada fixa mantém o common.js como está. O arquivo completo excede o limite de uma página da Wikipédia, por isso a instalação separa dados e núcleo.

O índice permite copiar o arquivo inteiro, o destino e o resumo, com um link direto para o editor. Ele não salva páginas. O HTML pode ser aberto localmente, mas o GitHub mostra seu código, sem executar o índice.

O aviso que cita o máximo de 102400 bytes pertence ao realce de sintaxe da página. Nesse caso, o visualizador mostra o código sem cores. Esse limite de exibição não impede salvar nem executar JavaScript. O índice oferece um link para conferir o arquivo bruto. Erros de sintaxe ou recusas de publicação exigem uma verificação separada.

## Código e verificações

A reconstrução parte dos sete arquivos da distribuição 2.15.0, conferidos por SHA-256, e aplica os módulos de `src/v2_15_1`. As versões arquivadas ficam intactas.

```sh
python3 scripts/build_v2151.py
npm test
npm run test:complex
npm run test:documentation
npm run test:privacy
```

O [guia dos testes](tests/v2151/README.md) explica os comandos adicionais, os dados fixados e os limites. As execuções usam distribuições modular e completa, revisões públicas guardadas e páginas locais nos navegadores. As comparações nativas guardam a origem e a identificação das respostas, sem transformar resultados antigos em novos testes. Nenhum teste edita a Wikipédia.

A contagem informa as operações confirmadas, separadas dos tipos de ajuste. Quando não consegue comprovar um total, o painel não inventa um número exato. Mostrar alterações permite conferir o resultado no editor.

## Referências de versões anteriores

A recuperação de modelos de referência da 2.8.2 continua limitada aos casos previamente verificados no catálogo. Dos 154 examinados, 132 receberam correspondência confirmada, com 101 `Citar web`, 29 `Citar jornal` e dois `Citar revista`. Foram recuperadas 103 URLs comprovadas, e 22 chamadas permaneceram como `Citation`. Cada correção exige correspondência com o artigo e a referência registrados. Uma chamada genérica legítima fora desses casos permanece como está.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

O código próprio do RevisaWiki usa [CC BY-SA 4.0](LICENSE). Os arquivos de terceiros conservam suas licenças. Os [casos de referência do MediaWiki](tests/v2150/reader_official_contracts.json) mantêm a indicação GPL-2.0-or-later e a origem registrada no próprio arquivo. As fontes e revisões dos scripts consultados ficam no cabeçalho e no manual.

Arquivos de terceiros mantêm as licenças indicadas nas pastas correspondentes.
