# Aviso de tamanho na página do código

O SyntaxHighlight deixa de colorir códigos com mais de 102.400 bytes. A implementação gera o aviso `syntaxhighlight-error-exceeds-size-limit` e devolve o código em texto simples. Esse caminho não rejeita uma edição nem corta o JavaScript salvo.

As projeções em `primary/` guardam apenas o parâmetro, a mensagem em português e os trechos que permitem conferir esse diagnóstico. Cada trecho tem linhas e SHA-256. O manifesto traz a revisão imutável e o SHA-256 de cada fonte completa. Os fragmentos da implementação mantêm o aviso de licença GPL-2.0-or-later. Os nomes de colaboradores e os demais metadados das fontes não fazem parte das projeções.

O manifesto em `live/` resulta de consultas públicas por GET, sem autenticação. As duas revisões de JavaScript já estavam salvas e continham mais de 102.400 bytes. O corpo devolvido por `action=raw` corresponde ao conteúdo da API e aos arquivos congelados da versão 2.10.0, com a quebra de linha final retirada. Nenhuma edição foi realizada. A evidência registra a instalação anterior e não afirma que a versão 2.11.0 foi instalada.

O teste `install_size_diagnosis.cjs` confere os arquivos completos da distribuição, os catálogos, as chamadas fixas, as projeções e os hashes dos corpos obtidos por GET. Ele funciona sem rede. Para repetir a coleta, use os endereços fixados nos manifestos e compare os SHA-256. Os parâmetros das consultas da API usados na coleta foram `action=query`, `prop=revisions`, `rvprop=ids|content|contentmodel|size`, `rvslots=main` e `formatversion=2`. Não foram solicitados nomes de editores nem resumos de edições.

O aviso de exibição é diferente de uma falha ao publicar, de um erro de sintaxe ou de um modelo de conteúdo incorreto. Esses outros problemas precisam de diagnóstico próprio. O limite de 2 MiB continua a ser conferido separadamente para as duas páginas da instalação modular. O arquivo completo fica reservado para uso local.
