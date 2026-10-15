# Conferência de privacidade antes da publicação

O verificador examina os arquivos que serão publicados e o conteúdo de arquivos ZIP e gzip. Ele procura caminhos locais de contas e pastas, identificadores do ambiente de trabalho, imagens, capturas de tela, arquivos binários sem revisão, tokens e endereços de e-mail ainda não aprovados. URLs de fontes públicas e créditos já conferidos são preservados.

Execute a conferência sobre a mesma lista de arquivos usada no envio:

```sh
python3 scripts/publication_privacy_gate.py --root . --allowlist publication_files.json --report privacy_check.json
```

A lista pode ser um vetor JSON de caminhos relativos ou um objeto com o campo `files`. Sem `--allowlist`, o comando usa `git ls-files`. Logs e arquivos temporários que não estejam nessa lista não fazem parte da conferência e também não devem fazer parte do envio.

Para conferir um pacote ZIP, coloque o próprio ZIP na lista. Os limites de tamanho e profundidade impedem que arquivos comprimidos consumam recursos sem controle. O relatório mostra apenas o tipo de ocorrência e o caminho relativo, sem copiar o valor encontrado.

Uma lista adicional de valores privados pode ser fornecida por `--denylist`. Ela deve ficar fora do repositório e do pacote publicado. O verificador trabalha localmente e não faz pedidos à rede.

Este comando confere o conteúdo selecionado para publicação. Ele não remove versões antigas do GitHub, caches do serviço ou cópias feitas por terceiros.
