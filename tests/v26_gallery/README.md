# Preservação de galerias

Na raiz do repositório, execute `node tests/v26_gallery/run_all.cjs`. O comando repete quatorze contratos em cada uma das duas distribuições 2.6.0. Os resultados ficam em `artifacts/`. Para testar um único arquivo compatível, defina `REVISAWIKI_QA_SCRIPT` com seu caminho. Os contratos usam somente os módulos internos do Node.js e arquivos locais, sem rede ou navegador.

As expectativas são literais e não são produzidas por helpers do RevisaWiki. Há casos de galeria inalterada, conversão finita de espaços nominais e duas galerias com nomes equivalentes. A perda de uma ocorrência canonicamente igual deve ser recusada. Alterações de nome de arquivo, legenda, comentário, math e nowiki também devem ser recusadas.

Os dois casos de Ponte usam a revisão 71895316, com hash e tamanho fixos. A fonte já contém um fechamento de font sem abertura. A saída observada muda apenas a opção thumb e o ponto final da primeira legenda. O texto daquele ponto em diante, incluindo a galeria, permanece idêntico. O contrato também executa o programa completo e confere estabilidade na segunda aplicação.

A galeria original usa Image:. A identidade precisa passar na auditoria mesmo quando esse nome permanece igual. Image: e Datei: têm conversões estrangeiras catalogadas para Ficheiro:. File: já é um nome nativo aceito e não recebe essa conversão nesta regra. O teste não exige trocar nomes nativos válidos.

Estes contratos não qualificam avisos nem permitem retirar conteúdo. A comparação deve conservar a quantidade de ocorrências dos blocos protegidos, depois das equivalências finitas permitidas. Os hashes das fontes e dos arquivos de teste ficam em `PORTABLE_GALLERY_MANIFEST.json`.

Cerveja, revisão 72717005, Renascimento, revisão 73109500, e Fausto Coppi, revisão 69431006, acrescentam três regressões reais. As fontes completas somam 289.764 bytes. Cada caso exige a conservação literal de todas as galerias, a mesma quantidade e o mesmo conteúdo das galerias, aceitando apenas Image: → Ficheiro:, e estabilidade da segunda aplicação. O teste não remove nem qualifica avisos para passar.

A correção de leitura de aspas da distribuição final permite executar os demais ajustes em páginas antes limitadas por uma falsa fronteira. As saídas completas de Renascimento e Fausto Coppi podem mudar em relação ao primeiro teste. Estes contratos conservam os hashes de entrada e exigem a mesma quantidade e o mesmo conteúdo das galerias, com a única equivalência de espaço nominal indicada acima.
