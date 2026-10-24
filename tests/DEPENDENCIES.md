# Dependência dos testes de navegador

Antes dos testes, execute na raiz do repositório:

```sh
python3 scripts/setup_test_dependencies.py
```

O preparo usa um arquivo original de uma revisão fixa do MediaWiki e confere seu tamanho e SHA-256. As cinco cópias locais são ignoradas pelo Git. O arquivo e seus avisos de licença permanecem intactos.

Se as cópias já estiverem corretas, o comando apenas as verifica. Para conferir sem fazer downloads ou criar arquivos:

```sh
python3 scripts/setup_test_dependencies.py --check
```

Você também pode fornecer uma cópia local do mesmo arquivo:

```sh
python3 scripts/setup_test_dependencies.py --source caminho/para/jquery.textSelection.js
```

O preparo para se encontrar um arquivo diferente, um destino simbólico ou uma pasta simbólica no caminho. Arquivos existentes não são sobrescritos. Confira a diferença antes de remover ou mover uma cópia que tenha sido alterada.

O script usa Python 3 no macOS ou Linux. Se o Python não conseguir usar os certificados do sistema, ele pode recorrer ao `curl` instalado, mantendo a verificação HTTPS. A opção `--source` permite preparar tudo sem acesso à rede.

## Arquivo conferido

- [Origem no MediaWiki](https://raw.githubusercontent.com/wikimedia/mediawiki/d0d9a283f219a1c9487754dc96598080a4a4e30a/resources/src/jquery/jquery.textSelection.js)
- Revisão: `d0d9a283f219a1c9487754dc96598080a4a4e30a`
- Tamanho: `16706` bytes
- SHA-256: `c28d1b9e6e83901da233beffb0524866165746e46c050a53467a40ae2fd13a6a`

As cópias mantêm os caminhos usados pelos testes em `native`, `native_v25`, `inline_v26/native`, `inline_v26/legacy_native` e `v261/browser`. Os demais testes que reutilizam essas pastas continuam usando os mesmos arquivos.

## Conferir o preparo

```sh
python3 -m unittest discover -s tests -p test_dependency_setup.py
```

Esses testes usam dados fictícios. Eles conferem arquivos existentes, cópias parciais, hashes incorretos, links simbólicos, falhas de download e tentativas de criar um destino que apareceu durante a execução.
