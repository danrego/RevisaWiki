"""Summarize completed current-release tests without recycling old results."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[1];D=R/'artifacts/v2130';M=R/'tests/expected_release_v2130.json'
m=json.loads(M.read_text());pin=hashlib.sha256(M.read_bytes()).hexdigest();reports=[];groups=[]
def add(file,label,case=None):
 raw=file.read_bytes();v=json.loads(raw)
 assert v.get('status','passed')=='passed' and not v.get('failed',0) and not v.get('failures'),file.name
 if 'frozenFiles' in v:assert v['frozenFiles']==m['files'],file.name
 if 'version' in v:assert v['version']=='2.13.0',file.name
 for key in ['releaseManifestSha256','pinManifestSha256']:
  if key in v:assert v[key]==pin,file.name
 cases=case(v) if case else v.get('cases',v.get('nativeComparisons',0));cases=len(cases) if isinstance(cases,list) else cases
 checks=v.get('checks',v.get('assertions',cases))
 assert isinstance(cases,int) and isinstance(checks,int)
 groups.append({'label':label,'cases':cases,'checks':checks})
 reports.append({'report':str(file.relative_to(R)),'sha256':hashlib.sha256(raw).hexdigest()});return v
main=add(D/'final_main/OFFLINE_QA_SUMMARY.json','Motor, instalação, regressões e falsos positivos')
complex_cases=complex_checks=0
for i in range(4):
 raw=(D/f'final_main/complex-shard-{i}.json').read_bytes();v=json.loads(raw);assert v['status']=='passed' and not v.get('failures');assert v['frozenFiles']==m['files'];assert v['version']=='2.13.0';complex_cases+=len(v['cases']);complex_checks+=v['checks'];reports.append({'report':f'artifacts/v2130/final_main/complex-shard-{i}.json','sha256':hashlib.sha256(raw).hexdigest()})
groups.append({'label':'Matriz de artigos complexos','cases':complex_cases,'checks':complex_checks})
corpus=add(D/'large-corpus/final_v2130/public_report.json','Artigos grandes nas duas distribuições',lambda v:v['articleCount'])
assert corpus['passed']==corpus['articleCount'] and not corpus['networkAttempts']
native=add(D/'final_browser/NATIVE_BROWSER_SUMMARY.json','Navegadores reais no macOS')
image_cases=0
for browser in ['chrome','firefox','safari']:
 image=add(D/f'final_image/{browser}.json','Fotografia e interface, '+browser,lambda v:len(v['tests']))
 assert image['pinManifestSha256']==pin and image['finalRuntimePinsVerified'] is True
 assert image['runnerSha256']==hashlib.sha256((R/'tests/v2130/browser/v211_image_runtime.cjs').read_bytes()).hexdigest()
 assert len(image['tests'])==18 and all(row['passed'] and row['realWorker'] and row['exactUndo'] and row['idempotent'] for row in image['tests'])
 for row in image['tests']:
  assert row['minorFirst']==row['minorSecond']==row['manualMinor']
 assert all(image[key]==0 for key in ['wikipediaWrites','actualWikipediaWrites','networkMutations','outsideRequests','screenshots','clipboardWrites'])
 assert all(image['cleanup'][key] is True for key in ['ownSessionClosed','ownProcessExited','ownProfileRemoved'])
 assert image['cleanup']['unknownBrowserSessionsTouched'] is False
 image_cases+=len(image['tests'])
geometry_cases=geometry_checks=0
for browser in ['chrome','firefox','safari']:
 geometry=add(D/f'final_geometry/{browser}.json','Referências adaptáveis, '+browser)
 assert geometry['releaseBinding']=='checked' and geometry['releaseManifestSha256']==pin
 assert geometry['candidateSha256']==m['files']['RevisaWiki_v2_13_0.js']['sha256']
 assert geometry['wikipediaWrites']==geometry['networkRequestsToWikipedia']==0
 geometry_cases+=len(geometry['cases']);geometry_checks+=geometry['checks']
grammar=add(D/'final_main/server_grammar.json','Compatibilidade dos carregadores e proteção de assinatura')
for name,label in [('BIRTH_CATEGORY','Categorias de nascimento, respostas nativas guardadas'),('REPAIR','Reparos de referências e tabelas, respostas nativas guardadas'),('STRUCTURE','Estruturas sintéticas, respostas nativas guardadas')]:
 file='NATIVE_BIRTH_CATEGORY_PROOF.json' if name=='BIRTH_CATEGORY' else f'NATIVE_{name}_RENDER_PROOF.json'
 v=add(R/'tests/v2130'/file,label)
 assert v['wikipediaWrites']==v['accountsUsed']==0
performance=add(D/'final_performance/large_performance.json','Medições nas duas versões em cinco artigos grandes',lambda v:len(v['rows']))
fmt=lambda n:format(n,',').replace(',','.')
native_reference=add(D/'final_main/independent_native_render.json','Referências e tabelas, respostas nativas anteriores reconferidas')
expansions=add(D/'final_native_expansions/expansions_render.json','Novos reparos, projeções nativas e origem das respostas')
assert expansions['frozenFiles']==m['files'] and expansions['releaseManifestSha256']==pin
sorting_cases=0
for browser in ['chrome','firefox','safari']:
 sorting=add(D/f'final_sorting/independent_v213_sorting_{browser}.json','Novos atributos, ordenação nativa em '+browser)
 assert sorting['releaseManifestSha256']==pin and sorting['frozenFiles']==m['files']
 assert len(sorting['cases'])==24 and sorting['wikipediaWrites']==sorting['networkRequestsToWikipedia']==0
 sorting_cases+=len(sorting['cases'])

table_geometry_cases=0
for browser in ['chrome','firefox','safari']:
 table_geometry=add(D/f'final_table_geometry/independent_geometry_{browser}.json','Tabelas de largura fixa e ordenação nativa, '+browser)
 assert table_geometry['pinManifestSha256']==pin and table_geometry['frozenFiles']==m['files']
 assert len(table_geometry['cases'])==126 and table_geometry['wikipediaWrites']==table_geometry['networkRequestsToWikipedia']==0
 table_geometry_cases+=len(table_geometry['cases'])
summary=f"Os arquivos finais da 2.13.0 passaram por {fmt(main['cases'])} casos e {fmt(main['checks'])} verificações na rodada principal. A matriz de artigos complexos acrescentou {complex_cases} casos em 16 artigos de pelo menos 100 KB. Outra rodada conferiu {corpus['articleCount']} artigos grandes nas duas distribuições. Chrome, Firefox e Safari passaram por {native['cases']} fluxos locais, com {fmt(native['checks'])} verificações, incluindo artigos completos, controles de falsos positivos, comparação, segunda análise e desfazer. As fotografias passaram por outros {image_cases} fluxos de interface, e as colunas de referências passaram por {geometry_cases} medições nos três navegadores. As tabelas com largura fixa tiveram {table_geometry_cases} medições adicionais, com sete larguras de tela, três tamanhos de letra e três disposições do conteúdo. O código nativo de ordenação foi executado nos controles e nas tabelas com rolagem. Os novos reparos têm 34 projeções nativas, antes e depois, conferidas contra os dois arquivos executáveis. Os atributos novos passaram por {sorting_cases} medições adicionais com o módulo nativo de ordenação em três larguras de tela. São verificações dos trechos afetados, não análises nativas de artigos inteiros. Os contratos nativos guardados e as respostas de versões anteriores foram conferidos novamente contra os arquivos atuais, mantendo as datas de origem. As rodadas finais não tiveram falhas. Os resultados e os hashes ficam em tests/evidence/2.13.0. Nenhum teste editou a Wikipédia."
summary+=" O ensaio comparativo mediu duas versões em cinco artigos grandes. Os tempos desse teste local não comprovam um ganho geral de velocidade."
qa={'version':'2.13.0','status':'passed','frozenFiles':m['files'],'releaseManifestSha256':pin,'groups':groups,'sourceReports':reports,'totalCases':sum(g['cases'] for g in groups),'totalChecks':sum(g['checks'] for g in groups),'portugueseSummary':summary,'wikipediaWrites':0}
(D/'RELEASE_QA_SUMMARY.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n');print(json.dumps(qa,ensure_ascii=False,indent=2))
