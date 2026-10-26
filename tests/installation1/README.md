# Testes da instalação corrigida

A revisão `2.21.1-installation.1` conserva o programa e o catálogo da versão 2.21.1. Os dados usam escapes JavaScript para atravessar a normalização Unicode e as substituições do salvamento sem perder chaves ou alterar valores.

```sh
python3 scripts/build_v2211.py
npm test
npm run test:presave
npm run test:presave:receipt
npm run build:index
npm run test:documentation
```

`npm test` verifica a serialização e executa as regressões de colunas, referências e Worker com os dados corrigidos. O adaptador de colunas muda somente os destinos de distribuição usados pelo teste anterior. As verificações e os casos desse teste continuam iguais. Os controles de recebimento recusam dados modificados, respostas incompletas, erros de acesso e comprovantes de outros arquivos.

`test:presave` faz uma nova consulta à transformação pré-salvamento da Wikipédia e mostra o resultado, sem substituir comprovantes salvos. Usa somente `action=parse` com `onlypst`, sem autenticação ou edição. `test:presave:receipt` confere offline se o comprovante publicado ainda corresponde aos arquivos e à implementação da conferência.

Para qualificar outra montagem, gere um novo comprovante com `scripts/check_wiki_presave.py` e um destino ainda inexistente. Preserve as tentativas anteriores. A montagem da entrega exige o comprovante da revisão atual, associado aos hashes exatos do manifesto, dos dados e da conferência. Uma falha ou um comprovante antigo interrompe a montagem.

Os testes de navegador usam o editor fictício local já adotado no projeto, os arquivos reais da distribuição e os executores Worker e por etapas. As guardas de domínio aceitam somente a origem de teste isolada. O resultado não é uma publicação nem uma simulação de acesso a uma conta.

Os resultados desta revisão ficam em [`tests/evidence/2.21.1-installation.1`](../evidence/2.21.1-installation.1). Os diretórios anteriores conservam seus resultados, falhas, limitações e arquivos publicados. Os casos extremos conhecidos de timeout não foram repetidos; o limite do programa permanece em 60 segundos.
