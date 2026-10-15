# Verificação do carregador

O ResourceLoader verifica o JavaScript de páginas de usuário com `Peast::ES2019`. Um código aceito pelo navegador pode ser recusado antes de chegar até ele. O minificador também não substitui essa verificação.

Use PHP 8.3 com `mbstring` e a biblioteca Peast 1.18.0, revisão `9c211ef67a0cf7511f864b6d390fe5939a837d05`. O arquivo oficial está em:

https://github.com/mck89/peast/archive/9c211ef67a0cf7511f864b6d390fe5939a837d05.tar.gz

SHA-256 do arquivo comprimido: `6c432fa57e173b4ba806c485701b6b59ba79423cd4e768e61e00d064e18f343e`.

Extraia a biblioteca fora da árvore pública e execute, a partir da raiz do repositório:

```sh
php tests/v261/install/check_server_grammar.php dist/2.6.1-hotfix.1 /caminho/para/peast dist/2.6.1
```

O teste verifica os dois carregadores, inclui controles que o ES2019 deve recusar e procura sequências literais de assinatura nos arquivos JavaScript. Nenhuma chamada de rede ou alteração na Wikipédia é feita.

A verificação também foi executada localmente com PHP 8.3 via `@php-wasm/universal` e `@php-wasm/node-8-3`, ambos na versão 3.1.58. O código PHP usado é o mesmo.

A revisão oficial do ResourceLoader usada para confirmar essa regra é [`e6327087b1f750d3adf10278132a9e16b0d188d3`](https://github.com/wikimedia/mediawiki/blob/e6327087b1f750d3adf10278132a9e16b0d188d3/includes/ResourceLoader/Module.php#L970), no método `validateScriptFile`. Não é necessário supor que a versão do minificador determine a sintaxe aceita por esse método.

O terceiro argumento opcional é a distribuição anterior. Com ele, o teste exige que os dois carregadores anteriores falhem, reproduzindo o erro na linha 26. O quarto argumento opcional permite guardar os carregadores corrigidos em outra pasta.

## Teste nos navegadores

Com as dependências e os navegadores descritos em `tests/v261/browser/README.md`, execute:

```sh
node tests/v261/install/browser/run_hotfix.cjs Chrome dist/2.6.1-hotfix.1
node tests/v261/install/browser/run_hotfix.cjs Firefox dist/2.6.1-hotfix.1
node tests/v261/install/browser/run_hotfix.cjs Safari dist/2.6.1-hotfix.1
```

Os testes usam uma página local e abrem apenas a sessão criada para a verificação. Conferem os dois caminhos de instalação, o carregamento em etapas, os parâmetros de cache, o botão Ajustar código e o desfazer. Os relatórios ficam em `artifacts/v261/install`, fora dos arquivos de distribuição.
