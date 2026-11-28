"""Prepare the current manual from inherited features and reviewed dispositions."""
from pathlib import Path
import argparse,hashlib,html,json,re
ROOT=Path(__file__).resolve().parents[1]
VERSION='2.22.2'
STEM='v2_22_2'
NEWS=[
 'Preserva Notas e referências quando há notas e fontes compatíveis e retira apenas a lista de notas comprovadamente vazia.',
 'Corrige mais URLs e identificadores de citações, incluindo protocolos, arXiv, ISBN e ISSN, sem apagar informações conflitantes.',
 'Amplia as conversões comprovadas de infocaixas, com campos de carreira, mandatos, aeroportos e dados biográficos preservados.',
 'Reúne portais separados por comentários e organiza projetos irmãos junto de Ver também, inclusive Correlatos e Wikiversidade.',
 'Mantém no máximo um esboço existente, escolhendo o primeiro específico quando há mais de um.',
 'Marca Vigiar página ao concluir Ajustar código quando a opção nativa do editor estiver desmarcada.',
 'Acrescenta Marca de projeto com ? quando falta essa marcação na discussão de um artigo, permitindo a avaliação automática nativa.',
 'Acerta datas e campos de Traduzido, reúne os cabeçalhos da discussão na ordem preferida e retira metadados antigos conforme a regra de revisão.',
 'Preenche o resumo da discussão com PD, Marca de projeto e Traduzido conforme as famílias alteradas, conservando resumos manuais.',
 'Aplica o texto e preenche o resumo sem esperar uma contagem residual; quando necessária, ela termina separadamente sem bloquear a edição.',
 'Amplia correções pontuais de texto e sintaxe e mantém código JavaScript, Lua, CSS e JSON fora dos ajustes de wikitexto.'
]
def raw_json(v):return json.dumps(v,ensure_ascii=False,indent=2)+'\n'
def pre(s):return '<pre>'+ ('\n' if s.startswith('\n') else '')+re.sub(r' (?=!!)','&#32;',html.escape(s,quote=False))+'</pre>'
def markdown_code(source):
 fence='`'*max(3,max((len(m.group())for m in re.finditer(r'`+',source)),default=0)+1)
 return fence+'wikitext\n'+source+'\n'+fence
def wiki_prose(source):
 # Examples in prose are mentions, not live template calls. Keep existing literal spans.
 pieces=re.split(r'(<nowiki>[\s\S]*?</nowiki>)',source)
 for i in range(0,len(pieces),2):
  text=pieces[i];out=[];cursor=0
  while True:
   start=text.find('{{',cursor)
   if start<0:out.append(text[cursor:]);break
   depth=1;end=start+2
   while end<len(text)and depth:
    if text.startswith('{{',end):depth+=1;end+=2
    elif text.startswith('}}',end):depth-=1;end+=2
    else:end+=1
   if depth:out.append(text[cursor:]);break
   out.extend([text[cursor:start],'<code><nowiki>',text[start:end],'</nowiki></code>']);cursor=end
  pieces[i]=''.join(out)
 return ''.join(pieces)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--implementation',type=Path,required=True);args=ap.parse_args()
 old=ROOT/'docs/2.22.1';dest=ROOT/'docs'/VERSION;dest.mkdir(exist_ok=True)
 dispositions=[]
 for group in ['references','infoboxes','structure','ui']:
  v=json.loads((args.implementation/group/'SCOPE_DISPOSITIONS.private.json').read_text())
  rows=v if isinstance(v,list) else v.get('items',v.get('rows',[]))
  for row in rows:row.setdefault('family',{'references':'references','infoboxes':'infoboxes','structure':'structure','ui':'interface'}[group])
  dispositions.extend(rows)
 extra=json.loads((args.implementation/'structure/NEW_ARTICLE_TALK_HEADER_DISPOSITION.private.json').read_text());extra.setdefault('id','TALK-EMPTY-01');extra.setdefault('family','talk');extra.setdefault('title','Cabeçalho de discussão completo');extra['summary']=extra.get('publicSummary','Cabeçalho de discussão completo');extra['condition']=extra.get('publicCondition','Discussões de artigos no domínio 1.');extra.setdefault('before','');extra.setdefault('after','{{PD}}\n{{Marca de projeto|?}}');dispositions.append(extra)
 data=json.loads((old/'Funcionalidades_RevisaWiki_2_22_1.json').read_text());data['version']=VERSION
 supplement=json.loads((args.implementation/'infoboxes/INFOBOX_DOCUMENTATION_SUPPLEMENT.json').read_text())
 updates={r['id']:r for r in supplement['featureUpdates']}
 for row in data['features']:
  if row['id']in updates:row.update({k:v for k,v in updates[row['id']].items()if k!='id'})
 reference_supplement=json.loads((args.implementation/'references/DOCUMENTATION_SUPPLEMENT.json').read_text())
 for row in data['features']:
  if row['id']=='CIT-11':
   row.setdefault('additionalExamples',[]).append({**reference_supplement['additionalExample'],'condition':reference_supplement['publicCondition']})
   row['description']+=' '+reference_supplement['publicSummary']+'.'
 for r in data['features']:
  if r['id']=='UI-02':r.update(description='Mostra os ajustes mantidos e a diferença em bytes. Quando resta uma contagem mais trabalhosa, o texto já pode ser editado ou publicado enquanto ela termina separadamente, sem refazer os reparos.')
  if r['id']=='FOOT-11':r.update(title='Um esboço existente',description='Mantém no máximo um esboço que já esteja na página. Havendo mais de um específico, conserva o primeiro; não acrescenta um esboço ausente.',condition='Chamadas independentes, reconhecidas e completas. A escolha entre esboços existentes não fornece prova nova de portal ou categoria. As regras específicas de esboços verificados continuam independentes.')
  if r['id']=='TALK-03':r.update(description='Retira bot e todas as ocorrências de rev quando existe bot. Sem bot, retira uma revisão de data válida anterior a 2021. Conserva as importâncias e avaliações humanas separadas.',condition='O corte é estritamente anterior a 1 de janeiro de 2021. Datas inválidas ou atuais sem bot são preservadas.')
 families={'references':'Referências e notas','citations':'Citações bibliográficas','infoboxes':'Infocaixas e biografias','structure':'Organização do código','layout':'Organização do código','discussion':'Páginas de discussão','talk':'Páginas de discussão','prose':'Texto e sintaxe','inference':'Portais e categorias','interface':'Interface e resumo'}
 for r in dispositions:
  if not r.get('id') or not isinstance(r.get('before'),str) or not isinstance(r.get('after'),str):continue
  if r['id'].startswith('HOLD') and r['id']!='HOLD11':continue
  title=r.get('title') or r.get('publicSummary') or r.get('summary') or r['id']
  data['features'].append({'id':r['id'],'family':families.get(r.get('family'),'Ajustes e cuidados da 2.22.2'),'title':title,'description':r.get('publicSummary') or r.get('summary') or title,'condition':r.get('publicCondition') or r.get('condition') or r.get('conditions') or 'Somente no subconjunto comprovado, sem conflito ou perda de dados.','before':r['before'],'after':r['after'],'type':r.get('documentationType') or ('preservation' if r['before']==r['after'] or 'protected' in r.get('status','') else 'transformation'),'optionKeys':r.get('optionKeys',[]),'entryPoints':r.get('entryPoints',[]),'verification':'Exemplo e condições do subconjunto conferido. O relatório de testes identifica a validação do pacote exato.','baselineVersion':VERSION})
 assert len({r['id'] for r in data['features']})==len(data['features'])
 doc_sources={r['path']:r for r in data.get('documentationSources',[])}
 for folder in ('src/v2_22_2','src/v2_22_2_ui'):
  for source in sorted((ROOT/folder).iterdir()):
   if source.is_file()and source.suffix in ('.js','.json'):
    raw=source.read_bytes();name=str(source.relative_to(ROOT));doc_sources[name]={'path':name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
 data['documentationSources']=list(doc_sources.values())
 data['counts']={'documentedEntries':len(data['features']),'entriesAreIndependentAutomaticRules':False}
 data['releaseScope']={'version':VERSION,'trackingEntriesAreFeatureCount':False,'scopeDispositions':[{'id':r['id'],'status':r.get('status','preserved'),'summary':r.get('publicSummary')or r.get('summary',r['id']),'condition':r.get('publicCondition')or r.get('condition','')}for r in dispositions]}
 data['verification']='Os IDs e exemplos anteriores foram preservados. Resultados de versões anteriores continuam históricos; o relatório desta entrega identifica os testes executados no pacote atual.'
 (dest/'Funcionalidades_RevisaWiki_2_22_2.json').write_text(raw_json(data))
 head=(old/'Documentacao_RevisaWiki_v2_22_1.wiki').read_text().split('== Todos os recursos, com exemplos ==')[0].replace('última_versão=2.22.1','última_versão=2.22.2')
 start=head.index('== Novidades da 2.22.1 ==');end=head.index('== Onde os ajustes entram ==',start)
 head=head[:start]+'== Novidades da 2.22.2 ==\n\n'+'\n'.join('* '+v for v in NEWS)+'\n\n'+head[end:]
 head=re.sub(r'As migrações completas continuam limitadas a quatro contratos ativos:[^\n]*','As migrações completas seguem os contratos ativos do catálogo instalado. Cada contrato delimita o modelo de origem, os campos aceitos e suas condições; reconhecer um cabeçalho não significa poder converter qualquer caixa.',head)
 head=re.sub(r'Quando Marca de projeto traz <code>bot=</code>[^\n]*','Quando Marca de projeto traz <code>bot=</code>, a limpeza retira esse campo e todas as ocorrências de <code>rev</code>. Sem bot, retira a revisão de data válida anterior a 2021, conservando avaliações humanas e importâncias separadas. Datas inválidas ou a partir de 2021 permanecem quando não existe bot. O sinal <code>?</code> não desliga a estimativa do módulo nativo.',head)
 head=head.replace('As migrações completas seguem os contratos ativos do catálogo instalado. Cada contrato delimita o modelo de origem, os campos aceitos e suas condições; reconhecer um cabeçalho não significa poder converter qualquer caixa.',supplement['registryText'])
 head=head.replace('Os ajustes feitos somente pelo RevisaWiki recebem a marcação de edição menor, sem substituir o resumo que você já escreveu.','Os ajustes feitos somente pelo RevisaWiki recebem a marcação de edição menor, sem substituir o resumo que você já escreveu. Ao concluir, a opção nativa Vigiar página é marcada se estiver disponível e desmarcada.')
 header=(args.implementation/'infoboxes/DOC_INFO_SOFTWARE_HEADER_FORMATADO.wiki').read_text()
 head=re.sub(r'^\{\{Info/Software[\s\S]*?\}\}\n',lambda _:header,head,count=1)
 head=head.replace('Nos 25 casos sintéticos retidos,',supplement['nativeReferencesText']+'\n\nNos 25 casos sintéticos retidos,')
 head+='Uma discussão de artigo sem uma chamada ativa de Marca de projeto recebe <code><nowiki>{{Marca de projeto|?}}</nowiki></code> abaixo de <code><nowiki>{{PD}}</nowiki></code>. Chamadas válidas, inclusive Marca de projecto, projetos e avaliações já existentes são preservados. O valor ? permite que a própria Wikipédia estime a qualidade, sem o RevisaWiki atribuir uma nota.\n\n'
 head+='O resumo acompanha as famílias alteradas, por exemplo <code><nowiki>{{PD}}{{Marca de projeto}}{{Traduzido}}</nowiki></code>. Uma atribuição acrescentada manualmente só entra nesse resumo quando pode ser comparada com a revisão exata carregada no editor. Um resumo que você escreveu permanece.\n\n'
 head=re.sub(r'A composição finita de campo e coletor cobre [\s\S]*?(?=== Portais e categorias com apoio no artigo ==)', 'Uma referência só acompanha a mudança de um campo quando a ferramenta confirma que a predefinição o lê e que a lista de fontes vai recebê-la. Campos de imagem, dimensões e caixas incorporadas têm verificações próprias.\n\nAs conversões completas de caixas estrangeiras seguem perfis conferidos. Outras famílias podem receber correções pontuais, sem que toda a infocaixa seja convertida. O catálogo de modelos e campos traz os nomes, os destinos e as condições.\n\n', head, count=1)
 manual=head+'== Todos os recursos, com exemplos ==\n\nA lista reúne correções automáticas, condições e cuidados de preservação. Os exemplos são ilustrativos ou sintéticos e não verificam os fatos de um artigo. Cada regra depende do modelo e do contexto indicados.\n\n'
 md=['# Recursos do RevisaWiki 2.22.2','','A lista inclui correções, condições e cuidados. As entradas não são uma contagem de regras independentes.','']
 for family in dict.fromkeys(r['family']for r in data['features']):
  manual+='=== '+family+' ===\n\n';md+=['## '+family,'']
  for r in [r for r in data['features']if r['family']==family]:
   manual+='<span id="'+r['id']+'"></span>\n==== '+wiki_prose(r['title'])+' ====\n\n'+wiki_prose(r['description'])+'\n\n'
   manual+="'''Antes'''\n"+pre(r['before'])+"\n'''Depois'''\n"+pre(r['after'])+'\n\n'+wiki_prose(r['condition'])+'\n\n'
   md+=['### '+r['title']+' ('+r['id']+')','',r['description'],'','Antes:',markdown_code(r['before']),'Depois:',markdown_code(r['after']),'',r['condition'],'']
   for e in r.get('additionalExamples',[]):
    manual+="'''Antes'''\n"+pre(e['before'])+"\n'''Depois'''\n"+pre(e['after'])+'\n\n'
    if e.get('condition'):manual+=wiki_prose(e['condition'])+'\n\n'
    md+=['Antes:',markdown_code(e['before']),'Depois:',markdown_code(e['after']),'',e.get('condition',''),'']
 history=(old/'Documentacao_RevisaWiki_v2_22_1.wiki').read_text().split('== Histórico das versões ==\n',1)[1]
 manual+='== Histórico das versões ==\n\n=== 2.22.2 ===\n\n'+'\n'.join('* '+v for v in NEWS)+'\n\n'+history
 (dest/'Documentacao_RevisaWiki_v2_22_2.wiki').write_text(manual)
 (dest/'Funcionalidades_RevisaWiki_2_22_2.md').write_text('\n'.join(md))
 for f in old.iterdir():
  if f.name.startswith(('Funcionalidades','Documentacao','Catalogo')):continue
  name=f.name.replace('2_22_1','2_22_2');text=f.read_text().replace('2.22.1','2.22.2').replace('v2_22_1','v2_22_2')
  if name=='LEIA_PRIMEIRO.txt':text=re.sub(r'As infocaixas usam contratos finitos:[^\n]*','Ajustar código aplica as correções confirmadas, preenche o resumo e marca Vigiar página quando a caixa nativa está disponível e desmarcada. Nas discussões de artigos, acrescenta Marca de projeto com ? quando essa marcação falta, mesmo sem portais.',text)
  if name.startswith('Modelos_e_campos'):text=re.sub(r'A distribuição contém quatro contratos ativos[^\n]*',supplement['registryText'],text)
  if name.startswith('Instalacao'):
   text=text.replace('As partes JSON são novas nesta distribuição e ficam disponíveis','As partes JSON da distribuição ficam disponíveis').replace(' Safari usa Option + Command + R.','')
  if name.startswith('Relatorio_testes'):text='RevisaWiki 2.22.2: relatório de testes\n\nVALIDAÇÃO FINAL PENDENTE\nOs registros históricos permanecem intactos. As contagens desta versão serão preenchidas somente a partir dos comprovantes do pacote final.\n'
  if name.startswith('Notas_da_versao'):
   text='RevisaWiki 2.22.2: novidades e histórico\n\n'+'\n'.join('* '+v for v in NEWS)+'\n\nHistórico, do mais recente para o mais antigo\n\n2.22.2\n\n'+'\n'.join('* '+v for v in NEWS)+'\n\n'+f.read_text().split('Histórico, do mais recente para o mais antigo\n\n',1)[1]
  if name.startswith('Referencia_tecnica'):
   text=re.sub(r'As migrações completas continuam limitadas a quatro contratos ativos:[^\n]*',supplement['registryText'],text)
   text=text.replace('O campo bot explícito permite retirar a avaliação automática gravada e sua revisão, preservando importâncias e notas humanas.','O campo bot explícito permite retirar os metadados automáticos gravados e todas as ocorrências de rev, preservando importâncias e notas humanas separadas. Sem bot, sai apenas uma revisão de data válida anterior a 2021.')
   text+='\nDistribuição dos mapas da versão atual\n\n'+supplement['technicalDistributionText']+'\n\nContagem e interface\n\nA análise entrega o texto, o resumo e a diferença exata de tamanho. Uma contagem já confirmada por alterações atômicas independentes pode aparecer imediatamente. As demais usam os dois textos confirmados em uma tarefa separada, sem executar reparos novamente. Editar, publicar e desfazer continuam disponíveis. Alterações posteriores no rascunho invalidam a contagem antiga. Falhas dessa tarefa não substituem o texto aprovado. A contagem considera componentes conservados no resultado final, sem dar crédito a propostas recusadas ou alterações intermediárias desfeitas. As quebras de linha necessárias a uma movimentação acompanham sua chamada. A união de chamadas compatíveis conta pelas chamadas extras eliminadas, sem tratar os itens transferidos como itens novos.\n'
  if name.startswith('Modelos_e_campos'):text+='\n## Mapas novos e limites desta versão\n\n'+supplement['modelTableIntroduction']+'\n\n'+supplement['nativeReferencesText']+'\n\n'+supplement['imdbText']+'\n\n'+'| Modelo | Origem | Destino | Condição |\n| --- | --- | --- | --- |\n'+'\n'.join('| '+' | '.join(str({'text':'Texto','language':'Código de língua','module':'Subinfocaixa','native-alias':'Alias nativo já consumido','number':'Número','file':'Nome de arquivo','locality':'Localidade','units':'Unidades militares','size':'Dimensão'}.get(row.get(k),row.get(k,'')) if k=='kind' else row.get(k,'')).replace('|','&#124;').replace('\n',' ')for k in ('owner','source','target','kind'))+' |' for row in supplement['newNativeFieldRows'])+'\n'
  (dest/name).write_text(text)
 catalog=json.loads((old/'Catalogo_modelos_e_regras_2_22_1.json').read_text());catalog['version']=VERSION
 extra={}
 for p in sorted((ROOT/'src/v2_22_2').glob('*.json')):extra[p.stem]=json.loads(p.read_text())
 registry=extra.pop('infobox_registry_data');extra['foreignMigrationRegistry']=registry
 catalog['v2222Extensions']=extra;(dest/'Catalogo_modelos_e_regras_2_22_2.json').write_text(raw_json(catalog))
 print(raw_json({'version':VERSION,'featureEntries':len(data['features']),'scopeRows':len(dispositions),'wikipediaWrites':0}))
if __name__=='__main__':main()
