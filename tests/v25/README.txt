RevisaWiki 2.5.0: contratos independentes

Na raiz do repositório, execute:
node tests/v25/run_all.cjs

O comando testa as duas distribuições locais em dist/2.5.0, sem rede, navegador ou edição na Wikipédia. Para conferir outro arquivo, defina REVISAWIKI_QA_SCRIPT. REVISAWIKI_QA_OUTPUT escolhe uma pasta de relatórios.

As expectativas foram escritas e congeladas antes da primeira execução dos helpers correspondentes. O conjunto inicial cobre títulos repetidos, chamadas de referência, citações completas em outra ordem, atributos e fechamentos trocados e coletores vazios repetidos. As emendas de desenho guardam a razão e a evidência de cada alteração de escopo. A emenda de citações importadas usa o conversor imutável da 2.4 para confirmar quais campos já eram equivalentes antes das novas regras.

Os contratos de Ken Jennings e Ciência indígena usam fontes e saídas completas com hashes fixos. Exigem a conservação da saída já conferida, ausência de falsas falhas de preservação e estabilidade na segunda aplicação. Os controles negativos incluem perda de referência, troca isolada de destino e troca equilibrada de duas chamadas, que mantém as contagens mas cita as fontes erradas. A leitura independente dos corpos exatos e da ordem das chamadas está em ciencia_indigena/binding_oracle.py.

Os contratos de alinhamento usam a comparação entre as revisões 73203969 e 73216566 de Tati Barra. A expectativa reproduz somente os espaços antes dos sinais de igual. Não copia o campo cônjuge nem outras alterações de conteúdo da revisão posterior. Testam nomes e valores intactos, datas e referências internas, caixas compactas, exemplos protegidos, edição de seção, opções desligadas e a integração com o relatório, resumo e comparação. Os casos ficam em formatter/fixtures.json, com a origem e os hashes.

Os contratos de Preparar discussão conferem o cabeçalho proposto a partir dos portais confirmados, a ordem de PD e Marca de projeto, a conservação de classificações e comentários assinados, exemplos protegidos, redirecionamentos e os limites de página e seção. Os resumos esperados são literais nos casos congelados. Essa ação não é executada pelo botão Ajustar código. Entradas com recuo ou comentário antes da chamada na mesma linha permanecem inteiras, para não juntar esses caracteres ao próximo título de seção.

Os contratos de composição exigem que o ajuste, a prova e a aplicação do rascunho usem as mesmas opções escolhidas. Conferem citações, ligações, referências simples e conversão de modelos estrangeiros, cada opção ligada e desligada. Uma chamada nova sem definição continua bloqueada.

Os resultados dependem dos bytes do arquivo testado. O manifesto registra os arquivos e seus hashes, sem caminhos locais. Os testes não removem avisos nem relaxam as exigências de preservação para obter aprovação.
