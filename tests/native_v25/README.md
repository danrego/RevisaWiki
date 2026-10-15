# Testes locais em navegadores do Mac

Esta pasta reúne a interface simulada, os navegadores de teste e as fontes congeladas usadas nos testes do RevisaWiki 2.5. Os testes abrem apenas um servidor local, recusam ações de escrita na API simulada e impedem o envio do formulário. Não é preciso entrar na Wikipédia.

Instale Node.js, Python 3 e os navegadores que deseja testar. O controlador do Chrome usa o pacote `playwright`, que pode ser instalado com `npm install --no-save playwright`. Firefox e Chrome precisam estar na pasta Aplicativos do Mac. No Safari, ative a automação remota no menu Desenvolvedor.

Na raiz do repositório, execute cada navegador separadamente:

```sh
python3 tests/native_v25/run_release.py Chrome
python3 tests/native_v25/run_release.py Firefox
python3 tests/native_v25/run_release.py Safari
```

O comando executa os sete grupos da interface, incluindo ajustes, referências, instalação, edição em código, CodeMirror, Workers, cancelamento, comparação e desfazer. Os casos novos também conferem o alinhamento das infocaixas e a preparação de um rascunho de discussão, com prévia antes de aplicar ao editor. O código principal vem de `dist/2.5.0/RevisaWiki_v2_5.js`, e o catálogo é carregado do mesmo diretório. `RELEASE_BYTES.json` permite conferir os arquivos usados na entrega.

Para repetir a comparação entre o editor e um Worker independente no artigo mais extenso do conjunto, use a distribuição completa:

```sh
REVISAWIKI_NATIVE_SCRIPT=dist/2.5.0/RevisaWiki_v2_5_completo.js python3 tests/native_v25/run_release.py Chrome v25-giant-worker
REVISAWIKI_NATIVE_SCRIPT=dist/2.5.0/RevisaWiki_v2_5_completo.js python3 tests/native_v25/run_release.py Firefox v25-giant-worker
REVISAWIKI_NATIVE_SCRIPT=dist/2.5.0/RevisaWiki_v2_5_completo.js python3 tests/native_v25/run_release.py Safari v25-giant-worker
```

Essa comparação registra o resultado e o motivo de uma eventual interrupção pelo limite de tempo da interface. Quando o limite é atingido, o editor deve conservar o texto original e informar o que ocorreu. O Worker separado tem um prazo maior apenas para conferir o cálculo. Os tempos variam com a carga do computador e não constituem uma comparação de velocidade entre navegadores.

Se o executável do Node não estiver no `PATH`, defina `REVISAWIKI_NODE`. O pacote `playwright` pode ser indicado por `NODE_PATH` ou por `REVISAWIKI_PLAYWRIGHT`. Essas opções devem apontar para instalações locais, sem que seja necessário alterar o código.

Os arquivos de resultados e logs são criados nesta pasta e estão no `.gitignore`. Não há captura de tela. O manifesto `FIXTURE_SOURCES.json` registra os artigos e as versões usados nas fontes maiores. `native_boundary_fixture_provenance.json` registra os dois casos de citações. Os textos da Wikipédia seguem a licença CC BY-SA 4.0 e podem ser consultados nos links permanentes dos manifestos. Os créditos dos fornecedores de JavaScript foram mantidos nos arquivos originais. A cópia de `textSelection.js` tem SHA-256 `c28d1b9e6e83901da233beffb0524866165746e46c050a53467a40ae2fd13a6a`.

As fontes desta pasta reproduzem os casos da interface, com três artigos extensos do conjunto anterior e três de física e matemática. O teste completo dos 2.000 artigos pertence à suíte de corpus do repositório. Os modos opcionais `corpus` e `corpus-worker` deste controlador antigo exigem, por `REVISAWIKI_NATIVE_CORPUS`, uma pasta externa com o manifesto e as 1.000 fontes originais daquele conjunto. Eles não fazem parte dos sete grupos acima.
