# RevisaWiki

## Beta 2.19.0-beta.1

Esta beta tem instalação separada e acrescenta somente o reconhecimento dos redirecionamentos do cabeçalho de discussão à base publicada 2.18. A validação da 2.19 final continua pausada.

[Pacote da beta](dist/2.19.0-beta.1/RevisaWiki_2.19.0-beta.1.zip) · [Índice de cópia](dist/2.19.0-beta.1/INICIO.html) · [Instalação](docs/2.19.0-beta.1/Instalacao_RevisaWiki_v2_19_0_beta_1.txt) · [Manual](docs/2.19.0-beta.1/Documentacao_RevisaWiki_v2_19_0_beta_1.wiki) · [Testes](tests/beta219/README.md)

Desative a chamada estável no common.js antes de usar a chamada da beta. Os arquivos da versão estável permanecem nos seus destinos. Chrome e Firefox passaram nos controles de interface e instalação. O teste automatizado do Safari ficou pendente porque a sessão não iniciou.

Script para revisar o código-fonte da Wikipédia em português. Os ajustes ficam no rascunho, com opção de desfazer. A comparação usa Mostrar alterações do editor.

## Versão 2.18

- Traduz nomes e campos de citações completas em trechos que podem ser interpretados com segurança, mesmo quando outra parte da página está incompleta.
- Lê as referências do trecho inicial com o contexto de aspas da página inteira, evitando que aspas de fechamento sejam confundidas com abertura ao cortar o texto.
- Preserva comentários completos dentro dos valores e aceita combinações literais de estado ou acesso cuja equivalência foi conferida na implementação nativa.
- Corrige datas literais em campos aceitos de citações, mantendo a precisão informada e conferindo o calendário. Não acrescenta um dia a uma data que só informa mês e ano.
- Corrige nomes inválidos ou obsoletos de campos de citação e uma data completa colocada no campo de ano, após conferir os outros nomes usados para o mesmo campo.
- Reduz linhas vazias excedentes, inclusive linhas contendo espaços ou tabulações, na prosa e nos limites finais reconhecidos.
- Retira o espaço horizontal entre pontuação e uma referência ativa, corrige uma barra invertida em uma quebra de linha sem atributos e corrige títulos de seções finais escritos como chamadas literais sem argumentos cujos destinos foram conferidos.
- Deixa as referências usarem a divisão responsiva nativa e retira apenas o conjunto exato de estilos fixos acrescentado por versões anteriores do programa.
- Compara as 241 regras do código de referência que fazem substituições no texto de artigos, com casos executáveis e registro das diferenças preservadas ou ainda sem comprovação suficiente.

As 241 regras dizem respeito às substituições de texto em artigos. A comparação separa correções cobertas, diferenças preservadas e casos sem comprovação suficiente. Ela não promete reproduzir toda função do programa de origem nem as escolhas de uma revisão humana. Os adaptadores atendem ao editor clássico, às integrações reconhecidas de CodeMirror e ao modo de código-fonte do editor de 2017. O fluxo visual, a integração com wikEd e a abertura em lote por categorias ou afluentes ficam fora do RevisaWiki.

O programa mantém as grafias e os parâmetros já aceitos. Trechos protegidos, conflitos e valores ambíguos continuam como estavam. A apresentação responsiva das referências é independente da regra de seis itens para colunas em listas finais. O manual explica os limites, e a publicação continua sob controle de quem edita.

## Instalação

[Pacote completo](dist/2.18.0/RevisaWiki_2.18.0.zip) · [Índice para copiar](dist/2.18.0/INICIO.html) · [Instruções](docs/2.18.0/Instalacao_RevisaWiki_v2_18_0.txt) · [Manual](docs/2.18.0/Documentacao_RevisaWiki_v2_18_0.wiki) · [Histórico resumido](docs/2.18.0/Notas_da_versao_RevisaWiki_v2_18_0.txt) · [Testes](docs/2.18.0/Relatorio_testes_RevisaWiki_v2_18_0.txt)

Atualize dados, núcleo, carregador central e documentação, nessa ordem. Quem já usa a chamada fixa mantém o common.js como está. O arquivo completo excede o limite de uma página da Wikipédia, por isso a instalação separa dados e núcleo.

O índice permite copiar o arquivo inteiro, o destino e o resumo, com um link direto para o editor. Ele não salva páginas. O HTML pode ser aberto localmente, mas o GitHub mostra seu código, sem executar o índice.

O aviso que cita o máximo de 102400 bytes pertence ao realce de sintaxe da página. Nesse caso, o visualizador mostra o código sem cores. Esse limite de exibição não impede salvar nem executar JavaScript. O índice oferece um link para conferir o arquivo bruto. Erros de sintaxe ou recusas de publicação exigem uma verificação separada.

## Código e verificações

A reconstrução parte dos sete arquivos da distribuição 2.17.0, conferidos por SHA-256, e aplica os módulos de `src/v2_18`. As versões arquivadas ficam intactas.

```sh
python3 scripts/build_v2180.py
REVISAWIKI_ORIGINAL_SOURCE=ARQUIVO_LOCAL_CONFERIDO npm test
npm run test:documentation
npm run test:privacy
```

O [guia dos testes](tests/v218/README.md) explica a cópia fixada do código de referência, os comandos, os comprovantes e os limites. As 71 invocações finitas passaram com 61.362 casos e 240.285 verificações. A regressão privada conferiu 4.853 páginas nas duas distribuições, sem regressões novas, e separou 24 achados idênticos aos da versão anterior, em oito páginas. Casos sintéticos, execuções repetidas e artigos distintos têm contagens separadas. A interface foi conferida localmente no Chrome, no Firefox e no Safari. Nenhum teste editou a Wikipédia.

Os resultados públicos trazem totais, hashes e resumos dos comprovantes validados. Os originais, as coordenadas dos casos e os detalhes das páginas reais ficam locais. A matriz das regras e os exemplos fictícios das provas nativas ficam disponíveis para reprodução. Uma inspeção do código de origem não é contada como um teste novo de navegador.

## Referências de versões anteriores

A recuperação de modelos de referência da 2.8.2 continua limitada aos casos previamente verificados no catálogo. Dos 154 examinados, 132 receberam correspondência confirmada, com 101 `Citar web`, 29 `Citar jornal` e dois `Citar revista`. Foram recuperadas 103 URLs comprovadas, e 22 chamadas permaneceram como `Citation`. Cada correção exige correspondência com o artigo e a referência registrados. Uma chamada genérica legítima fora desses casos permanece como está.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

O código próprio do RevisaWiki usa [CC BY-SA 4.0](LICENSE). Os arquivos de terceiros conservam suas licenças. Os [casos de referência do MediaWiki](tests/v2150/reader_official_contracts.json) mantêm a indicação GPL-2.0-or-later e a origem registrada no próprio arquivo. As fontes e revisões dos scripts consultados ficam no cabeçalho e no manual.

Arquivos de terceiros mantêm as licenças indicadas nas pastas correspondentes.
