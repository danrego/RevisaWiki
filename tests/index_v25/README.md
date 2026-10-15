# Índice de cópia da versão 2.5.0

Depois de reconstruir a distribuição, gere o índice e execute a conferência local:

```sh
python3 scripts/build_index.py
node tests/index_v25/test_index.cjs
```

O teste abre o índice servido por um servidor local em Chrome, Firefox e Safari. Confere os cinco cartões, a ordem de instalação, os destinos de edição, os 15 botões de cópia e a alternativa manual. Compara os hashes e os tamanhos dos textos com os arquivos da distribuição.

A área de transferência é simulada. O teste não lê nem escreve a área de transferência do sistema, não abre os links da Wikipédia, não executa o código incorporado e não cria capturas de tela. As chamadas de rede feitas pela página são interceptadas, e qualquer tentativa inesperada faz o teste falhar. Os relatórios locais ficam em `artifacts/index/`.

Os navegadores precisam estar instalados e disponíveis para automação no Mac. O adaptador padrão fica em `tests/native_v25/native_driver.cjs`. A variável `REVISAWIKI_NATIVE_DRIVER` permite escolher outro adaptador compatível, e `REVISAWIKI_INDEX_QA_OUTPUT` escolhe a pasta dos relatórios.
