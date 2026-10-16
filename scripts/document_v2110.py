"""Generate the current manual from tested release bytes, retaining past feature history."""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/2.11.0'; OUT.mkdir(parents=True,exist_ok=True)
manifest_path=ROOT/'tests/expected_release_v2110.json'
manifest=json.loads(manifest_path.read_text())
qa=json.loads((ROOT/'artifacts/v2110/RELEASE_QA_SUMMARY.json').read_text())
assert qa['version']=='2.11.0' and qa['status']=='passed' and not qa.get('failed',0)
assert qa['releaseManifestSha256']==hashlib.sha256(manifest_path.read_bytes()).hexdigest()
assert qa['frozenFiles']==manifest['files']
summary=qa['portugueseSummary']
features="""* Acrescenta portais de biografias esportivas quando a infocaixa confirma a pessoa e a modalidade, com o país quando ele também está confirmado.
* Reconhece infocaixas principais de filmes e formatos conferidos de programas de televisão, com critérios separados para notícias e entretenimento.
* Usa os campos taxonômicos explícitos para acrescentar portais de biologia e de grupos reconhecidos.
* Reconhece as infocaixas de vacinas, medicamentos e doenças, com critérios próprios para caixas químicas.
* Marca como menores mais ajustes mecânicos comprovados, respeitando a revisão salva e a escolha manual do editor.
* Conta as correções mantidas por ocorrência, com uma lista para conferência, separada dos tipos de ajuste e dos blocos do diff.
* Refaz o contador depois das escolhas da comparação e mantém os controles de desfazer.
* Iguala o verde dos dois botões e mostra Código conferido enquanto o texto e as opções permanecerem iguais.
* Revê a redação do manual e do histórico, sem exemplos identificados de artigos ou editores."""
def neutral(text):
 text,n=re.subn(r' O primeiro caso é o artigo [^\n.]+\.', '',text);assert n==1
 text,n=re.subn(r'Em [^\n,]+, voltar todas as chamadas para Citar web', 'No conjunto examinado, voltar todas as chamadas para Citar web',text);assert n==1
 text,n=re.subn(r'(?m)^\* Corrige trocas antigas de modelos de referência [^\n]+$', '* Corrige trocas antigas de modelos de referência somente em casos previamente verificados e registrados no catálogo.',text);assert n==1
 return text
base=(ROOT/'docs/2.10.0/Documentacao_RevisaWiki_v2_10_0.wiki').read_text()
manual=neutral(base)
head,history=manual.split('== Histórico das versões ==',1)
history,tail=history.split('== Testes e detalhes técnicos ==',1)
def active(s):return s.replace('2.10.0','2.11.0').replace('_v2_10_0','_v2_11_0')
head,tail=active(head),active(tail)
old_button="O botão azul fica no painel superior. No editor clássico e nas integrações reconhecidas de CodeMirror, há outro botão '''Ajustar código''', em verde azulado, antes de '''Publicar página''' ou '''Publicar alterações'''. Os dois executam a mesma ação. No editor de código-fonte de 2017, use o botão superior."
assert old_button in head
head=head.replace(old_button,"O botão '''Ajustar código''' fica no painel superior. No editor clássico e nas integrações reconhecidas de CodeMirror, há outro botão com o mesmo nome e o mesmo verde antes de '''Publicar página''' ou '''Publicar alterações'''. Os dois executam a mesma ação. No editor de código-fonte de 2017, use o botão superior.",1)
head=re.sub(r"A versão '''2\.11\.0'''[^\n]+", "A versão '''2.11.0''' amplia os portais automáticos e a marcação de edição menor, com confirmações próprias para cada assunto. O painel passa a contar as correções mantidas por ocorrência e permite conferir essa lista. Os recursos das versões anteriores continuam disponíveis no botão Ajustar código, com comparação e opção de desfazer.",head,count=1)
old="'''Ajustes aplicados''' informa os tipos de ajuste que permaneceram no texto, como referências ou tabelas. A contagem é refeita depois das escolhas da comparação. Os blocos do diff não representam a quantidade de correções."
assert old in head
head=head.replace(old,"'''Ajustes aplicados''' conta as correções que permaneceram no texto. Cada ligação simplificada, parâmetro corrigido ou cabeçalho ajustado tem sua própria entrada na lista de conferência. A troca do nome de uma predefinição e a troca de três parâmetros contam como quatro correções. Um par de delimitadores que faz uma única conversão conta uma vez. Os tipos de ajuste ficam numa indicação separada. A contagem é refeita depois das escolhas da comparação. Os blocos do diff continuam sendo unidades de seleção, sem definir a quantidade de correções.",1)
start=head.index('A marcação automática de edição menor exige')
end=head.index('\n\n',start)
head=head[:start]+"A marcação automática de edição menor exige artigo inteiro, revisão pública de origem confirmada e correspondência exata com os reparos mecânicos permitidos. A quantidade de bytes e de blocos do diff deixou de definir essa autorização. Correções comprovadas de ligações, grafia, espaços, sintaxe equivalente de citações, referências e tabelas podem receber a marcação. Adições de portais, controle de autoridade, categorias, fontes, dados ou conteúdo ficam fora. Se a edição mistura mudanças permitidas e mudanças fora dessa lista, a caixa não é marcada automaticamente."+head[end:]
ui="Os botões Ajustar código do painel e da área de publicação usam o mesmo verde. Depois de uma análise concluída, ambos passam a Código conferido, em verde claro. Eles continuam disponíveis para repetir a leitura e atualizar conferências públicas. Alterar o texto, mudar as opções ou desfazer os ajustes restaura a aparência inicial. Uma análise cancelada ou que falhou não recebe essa indicação.\n\n"
head=head.replace('== Páginas e editores compatíveis ==',ui+'== Páginas e editores compatíveis ==',1)
anchor='== Resíduos de traduções e apresentação =='
assert anchor in head
portals="""=== Novos assuntos dos portais automáticos ===

Uma única infocaixa principal reconhecida precisa confirmar o assunto, antes da primeira seção. A regra exige artigo inteiro do domínio principal, conserva os portais já escritos e respeita o limite de dez posições. Exemplos de código, listas, desambiguações, caixas repetidas ou dados conflitantes impedem as inferências incertas.

Nas biografias de futebol, as caixas nativas conferidas confirmam Biografias, Esportes e Futebol. A nacionalidade explícita tem prioridade para o país. Na ausência desse campo, um país de nascimento literal pode ser aproveitado mesmo quando há uma cidade num campo separado. Um clube, uma seleção, uma liga ou uma cidade isolada não confirmam nacionalidade. Dados explícitos de futebol de salão ou futebol americano impedem aplicar o padrão de futebol de campo. Mulheres exige confirmação própria, sem adivinhar pelo nome.

Filmes reconhecidos podem receber Cinema e Entretenimento. Programas de televisão exigem um formato reconhecido. Ficção, variedades e competições podem receber Entretenimento, enquanto um programa jornalístico recebe somente Televisão por esse critério. Animação precisa estar explícita. O país vem da produção, sem dedução pelo idioma, local de gravação, emissora, elenco ou premiações.

Em taxonomia, campos literais de reino, domínio, classe ou grupo viral podem confirmar Biologia e os portais correspondentes. Animais, plantas, fungos, bactérias e vírus têm critérios separados. Um nome latino, uma cor de caixa ou a área de distribuição não bastam para escolher um grupo. Categorias amplas que reúnem grupos diferentes não autorizam um portal mais específico.

Infocaixas nativas de vacinas confirmam Farmácia, Medicina e Saúde. Caixas de medicamentos confirmam Farmácia, e caixas de doenças confirmam Medicina e Saúde. Uma infocaixa química genérica exige os campos farmacológicos reconhecidos, com classificação estruturada. Uma fórmula química ou um identificador isolado não bastam. O agente causador, o tratamento ou o fabricante não mudam o assunto principal da página.

Caixas finais reconhecidas de elenco e seleção podem permitir acrescentar portais sem reorganizar o restante. Uma predefinição desconhecida não passa a ser tratada como navegação só pelo título. As consultas para conferir a função dessas caixas também funcionam quando a opção de reordenar o final está desligada. Casos sem confirmação ficam como estão, sem novos avisos.

"""
head=head.replace(anchor,portals+anchor,1)
head=head.replace('''| <code>structuralRepairs</code>,''','''| <code>automaticTopicPortals</code> || Portais de obras, taxonomia e saúde, com infocaixa principal e campos confirmados.
|-
| <code>structuralRepairs</code>,''',1)
history=history.replace('=== 2.10.0 ===','=== 2.11.0 ===\n'+features+'\n\n=== 2.10.0 ===',1)
start=tail.index('Os arquivos finais da 2.11.0 passaram');end=tail.index('\n\n',start)
tail=tail[:start]+summary+tail[end:]
manual=head+'== Histórico das versões =='+history+'== Testes e detalhes técnicos =='+tail
single=lambda text:re.sub(r'\n[ \t]*\n[ \t]*\n+','\n\n',text)
manual=single(manual)
(OUT/'Documentacao_RevisaWiki_v2_11_0.wiki').write_text(manual)
installation=active((ROOT/'docs/2.10.0/Instalacao_RevisaWiki_v2_10_0.txt').read_text())
installation=installation.replace('mesmo que a 2.9.0 já esteja instalada.','mesmo que a 2.10.0 já esteja instalada.')
start=installation.index('Os arquivos finais da 2.11.0 passaram');end=installation.index('\n\n',start)
installation=installation[:start]+summary+installation[end:]
(OUT/'Instalacao_RevisaWiki_v2_11_0.txt').write_text(single(installation))
(OUT/'Resumo_atualizacao_RevisaWiki_v2_11_0.txt').write_text('RevisaWiki 2.11.0: portais com assunto confirmado, edição menor para reparos mecânicos e contagem individual das correções mantidas.\n')
(OUT/'Resumo_documentacao_RevisaWiki_v2_11_0.txt').write_text('Documentação do RevisaWiki 2.11.0: regras de portais, edição menor, contagem de ajustes, testes e instalação.\n')
(OUT/'Notas_da_versao_RevisaWiki_v2_11_0.txt').write_text(single('RevisaWiki 2.11.0\n16 de outubro de 2026\n\n'+features.replace('* ','- ')+'\n\n'+summary+'\n\nAtualize dados, programa, carregador central e documentação, nessa ordem. A chamada fixa do common.js continua igual.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
(OUT/'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.11.0\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nNa Wikipédia, instale dados e núcleo separados. O arquivo completo fica disponível para download e testes locais. O índice não salva páginas.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
technical='''RevisaWiki 2.11.0: referência técnica
Programa e dados: 2.11.0
16 de outubro de 2026

A reconstrução parte dos sete arquivos da distribuição 2.10.0, conferidos por SHA-256, e aplica os módulos de src/v2_11. Os arquivos arquivados permanecem intactos. Dados, núcleo e carregador central declaram a mesma versão. A chamada fixa permanece idêntica.

Os portais usam perfis de assunto explícitos, com limites de escopo, campos literais e nomes de portais já conferidos. Cada área tem controles de conflito e falsos positivos. O classificador de caixas finais continua limitado às estruturas reconhecidas. A leitura pública não salva páginas nem usa credenciais de conta.

A marcação de edição menor exige reprodução exata por regras mecânicas permitidas, a partir da revisão salva que foi confirmada. Mudanças semânticas, adições de portais e outros modelos de conteúdo não recebem essa marcação. As escolhas manuais e a recuperação do estado anterior conservam as proteções do editor.

A contagem usa ocorrências estruturais entre os textos de origem e de resultado. Nomes e campos de predefinições, ligações, referências e pares de formatação têm unidades próprias. O contador considera somente os efeitos mantidos, separados dos grupos de dependência e dos blocos do diff. Sem correspondência suficiente, o painel não inventa um total exato. As entradas ficam disponíveis para conferência na comparação.

Os testes usam revisões públicas fixadas, controles sintéticos, distribuição modular, arquivo completo e páginas locais nos navegadores. Os relatórios indicam os arquivos executados e distinguem repetição de respostas guardadas de novas consultas. Nenhum teste edita a Wikipédia.

'''
(OUT/'Referencia_tecnica_RevisaWiki_v2_11_0.txt').write_text(single(technical+summary+'\n\n'+manual))
lines=['RevisaWiki 2.11.0: resultados dos testes','16 de outubro de 2026','',summary,'','Execuções nos arquivos finais','']
for group in qa['groups']:lines.append('- '+group['label']+': '+str(group['cases'])+' casos e '+str(group['checks'])+' verificações, sem falhas.')
lines+=['','Casos sintéticos e permutações não são artigos distintos. Os navegadores usam páginas locais com respostas controladas. Os relatórios e os hashes ficam em tests/evidence/2.11.0.','','Arquivos executados','']
for name,pin in manifest['files'].items():lines +=[name+': '+str(pin['bytes'])+' bytes','SHA-256: '+pin['sha256']]
lines+=['','Nenhum teste editou a Wikipédia.','Código e arquivos: https://github.com/danrego/RevisaWiki','']
(OUT/'Relatorio_testes_RevisaWiki_v2_11_0.txt').write_text(single('\n'.join(lines)))
print(json.dumps({'version':'2.11.0','documentationFiles':len(list(OUT.iterdir()))}))
