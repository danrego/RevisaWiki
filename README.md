# RevisaWiki

Script para revisar o código-fonte da Wikipédia em português. Os ajustes ficam no rascunho, com comparação, escolha das mudanças e opção de desfazer.

## Versão 2.12.0

- Corrige `group` para `grupo` nas chamadas nativas de referências, sem mudar o atributo HTML.
- Retira parâmetros de citação repetidos com valores iguais, respeitando a função de cada campo.
- Desfaz colchetes indevidos em campos de endereço quando há uma única URL sem rótulo.
- Retira atributos repetidos e idênticos de coletores de referências.
- Reconhece números literais formatados em células para liberar reparos já conferidos.
- Preserva atributos de ordenação nos locais aceitos das tabelas.
- Corrige uma aspa trocada em expansão numérica de célula quando há uma única solução para a grade.
- Acrescenta rolagem horizontal a tabelas com largura fixa reconhecida, sem alterar a tabela.

Os recursos anteriores continuam disponíveis. Casos incertos ficam como estão, sem novos avisos. Nenhum comando publica uma edição por conta própria.

## Instalação

[Pacote completo](dist/2.12.0/RevisaWiki_2.12.0.zip) · [Índice para copiar](dist/2.12.0/INICIO.html) · [Instruções](docs/2.12.0/Instalacao_RevisaWiki_v2_12_0.txt) · [Manual](docs/2.12.0/Documentacao_RevisaWiki_v2_12_0.wiki) · [Histórico resumido](docs/2.12.0/Notas_da_versao_RevisaWiki_v2_12_0.txt) · [Testes](docs/2.12.0/Relatorio_testes_RevisaWiki_v2_12_0.txt)

Atualize dados, núcleo, carregador central e documentação, nessa ordem. Quem já usa a chamada fixa mantém o common.js como está. O arquivo completo excede o limite de uma página da Wikipédia, por isso a instalação separa dados e núcleo.

O índice permite copiar o arquivo inteiro, o destino e o resumo, com um link direto para o editor. Ele não salva páginas. O HTML pode ser aberto localmente, mas o GitHub mostra seu código, sem executar o índice.

O aviso que cita o máximo de 102400 bytes pertence ao realce de sintaxe da página. Nesse caso, o visualizador mostra o código sem cores. Esse limite de exibição não impede salvar nem executar JavaScript. O índice oferece um link para conferir o arquivo bruto. Erros de sintaxe ou recusas de publicação exigem uma verificação separada.

## Código e verificações

A reconstrução parte dos sete arquivos da distribuição 2.11.1, conferidos por SHA-256, e aplica os módulos de `src/v2_12`. As versões arquivadas ficam intactas.

```sh
python3 scripts/build_v2120.py
npm test
npm run test:complex
npm run test:documentation
npm run test:privacy
```

O [guia dos testes](tests/v2120/README.md) explica os comandos adicionais, os dados fixados e os limites. As execuções usam distribuições modular e completa, revisões públicas guardadas e páginas locais nos navegadores. As comparações nativas guardam a origem e a data das respostas, sem transformar resultados antigos em novos testes. Nenhum teste edita a Wikipédia.

A contagem individual é separada dos tipos de ajuste, dos blocos do diff e dos grupos que precisam ser aceitos juntos. Quando os limites do código impedem comprovar um total, o painel oferece a comparação sem inventar um número exato.

## Referências de versões anteriores

A recuperação de modelos de referência da 2.8.2 continua limitada aos casos previamente verificados no catálogo. Dos 154 examinados, 132 receberam correspondência confirmada, com 101 `Citar web`, 29 `Citar jornal` e dois `Citar revista`. Foram recuperadas 103 URLs comprovadas, e 22 chamadas permaneceram como `Citation`. Cada correção exige correspondência com o artigo e a referência registrados. Uma chamada genérica legítima fora desses casos permanece como está.

## Privacidade e licença

Os arquivos publicados passam pela [conferência de privacidade](docs/PRIVACIDADE.md). Logs temporários, caminhos do computador, credenciais e capturas de tela ficam fora da publicação. A [nota sobre o histórico](PRIVACY.md) explica a limpeza dos relatórios antigos.

Código sob [CC BY-SA 4.0](LICENSE). As fontes e revisões dos scripts consultados ficam no cabeçalho e no manual.

Arquivos de terceiros mantêm as licenças indicadas nas pastas correspondentes.
