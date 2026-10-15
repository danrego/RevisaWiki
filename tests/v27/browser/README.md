# Testes locais nos navegadores do macOS

Este conjunto usa o Chrome, o Firefox e o Safari instalados no Mac. Os carregadores, o programa e os dados são os arquivos completos da versão, conferidos pelo SHA-256 de `tests/expected_release_v270.json`. Os testes abrem somente um servidor local, com respostas de API simuladas. Não entram em contas, não publicam na Wikipédia, não usam a área de transferência e não fazem capturas de tela.

## Como executar

Use Node.js 22 ou posterior e o módulo Playwright. O Safari precisa ter a automação remota ativada pelo usuário. O teste não altera essa configuração.

A partir da raiz do repositório:

```sh
export REVISAWIKI_INSTALL_REPORT_DIR="$PWD/artifacts/v27/browser"
export REVISAWIKI_BROWSER_ARTIFACTS="$PWD/artifacts/v27/browser"
node tests/v27/browser/run_release.cjs Chrome dist/2.7.0
node tests/v27/browser/run_release.cjs Firefox dist/2.7.0
node tests/v27/browser/run_release.cjs Safari dist/2.7.0
node tests/v27/browser/summarize_release.cjs artifacts/v27/browser
```

Se o Playwright não estiver no caminho normal de módulos, defina `REVISAWIKI_PLAYWRIGHT` como o caminho do módulo antes desses comandos. Execute os navegadores em sequência, com uma única sessão de automação do Safari. Cada execução encerra apenas os processos, perfis e sessões que criou.

## O que é conferido

São dez fluxos por navegador:

- As duas formas de instalação, comunitária e cópia própria, começando no editor de código-fonte normal. O teste carrega a cadeia real de arquivos, aplica um ajuste e desfaz a alteração.
- A mesma instalação na leitura, sem botões extras nas seções. O teste remove controles antigos pertencentes ao script, repete os hooks de conteúdo e verifica que os links nativos e um controle independente permanecem intactos. Também carrega explicitamente o núcleo local para confirmar que ele não adiciona atalhos. Um pedido antigo de edição inline permanece inativo, sem buscar ou abrir o artigo.
- O artigo completo da lista de cidades por temperatura média, com comparação em vários grupos locais, tipos de ajustes, saldo exato de bytes, rejeição individual de mudanças e restauração integral. A seleção usa foco e a tecla Espaço nativos em cada navegador, com eventos confiáveis do próprio navegador. Nenhum teste altera `checked` ou dispara eventos por JavaScript. O resumo automático acompanha as mudanças aceitas, enquanto resumos escritos pelo editor são preservados.
- Seis artigos completos de temas diferentes, executados em Workers reais, com conferência dos resultados e restauração exata.
- Um exemplo que exercita as quatro famílias de ajustes seguros da versão, mantendo uma nota de outro grupo separada. Ele também confere a remoção de uma cerca externa `wiketext` e de blocos adjacentes de marcadores de citação exportados, preservando o mesmo bloco dentro de `<nowiki>`, a separação entre palavras e a palavra em uma frase comum.

O exemplo positivo da lista de cidades é a revisão histórica 73218867, preservada em `../fixtures/city_temperature`. A revisão mais recente 73219315, já corrigida, continua no conjunto de 31 artigos e é um controle sem alterações. Cada uma mantém seus próprios metadados e hashes.

O relatório consolidado exige que as três execuções correspondam aos arquivos atuais, estejam concluídas, não tenham falhas e produzam resultados iguais. Os números de verificações vêm dos relatórios gerados. Este conjunto não substitui uma integração na Wikipédia nem uma avaliação visual completa.

## Adaptações do ambiente

Somente as cópias servidas pelo teste aceitam o domínio local nos guardas de origem. Os arquivos salvos da versão permanecem intactos. As chamadas de API são simuladas e o servidor aceita apenas GET. O observador de Worker registra resultados sem substituir seu processamento. O acesso à área de transferência lança um erro deliberado, e qualquer tentativa faz o teste falhar.

Os artigos de teste são cópias exatas de revisões públicas, com licença e proveniência em `../fixtures/large_articles/ATTRIBUTION.txt`. As fontes comprimidas são verificadas antes e depois da execução. Os relatórios públicos contêm apenas metadados dos artigos e dos testes.
