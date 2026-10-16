"""Summarize completed current-release tests without recycling old results."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[1];D=R/'artifacts/v2110';M=R/'tests/expected_release_v2110.json'
m=json.loads(M.read_text());pin=hashlib.sha256(M.read_bytes()).hexdigest();reports=[];groups=[]
def add(file,label,case=None):
 raw=file.read_bytes();v=json.loads(raw)
 assert v.get('status','passed')=='passed' and not v.get('failed',0) and not v.get('failures'),file.name
 if 'frozenFiles' in v:assert v['frozenFiles']==m['files'],file.name
 if 'version' in v:assert v['version']=='2.11.0',file.name
 for key in ['releaseManifestSha256','pinManifestSha256']:
  if key in v:assert v[key]==pin,file.name
 cases=case(v) if case else v.get('cases',v.get('nativeComparisons',0));cases=len(cases) if isinstance(cases,list) else cases
 checks=v.get('checks',cases)
 assert isinstance(cases,int) and isinstance(checks,int)
 groups.append({'label':label,'cases':cases,'checks':checks})
 reports.append({'report':str(file.relative_to(R)),'sha256':hashlib.sha256(raw).hexdigest()});return v
main=add(D/'final_main/OFFLINE_QA_SUMMARY.json','Motor, instalação, regressões e falsos positivos')
complex_cases=complex_checks=0
for i in range(4):
 raw=(D/f'final_main/complex-shard-{i}.json').read_bytes();v=json.loads(raw);assert v['status']=='passed' and not v.get('failures');assert v['frozenFiles']==m['files'];assert v['version']=='2.11.0';complex_cases+=len(v['cases']);complex_checks+=v['checks'];reports.append({'report':f'artifacts/v2110/final_main/complex-shard-{i}.json','sha256':hashlib.sha256(raw).hexdigest()})
groups.append({'label':'Matriz de artigos complexos','cases':complex_cases,'checks':complex_checks})
corpus=add(D/'large-corpus/final_v2110/public_report.json','Artigos grandes nas duas distribuições',lambda v:v['articleCount'])
assert corpus['passed']==corpus['articleCount'] and not corpus['networkAttempts']
native=add(D/'final_browser_retry/NATIVE_BROWSER_SUMMARY.json','Navegadores reais no macOS')
grammar=add(D/'final_main/server_grammar.json','Compatibilidade dos carregadores e proteção de assinatura')
for name,label in [('BIRTH_CATEGORY','Categorias de nascimento, respostas nativas guardadas'),('REPAIR','Reparos de referências e tabelas, respostas nativas guardadas'),('STRUCTURE','Estruturas sintéticas, respostas nativas guardadas')]:
 file='NATIVE_BIRTH_CATEGORY_PROOF.json' if name=='BIRTH_CATEGORY' else f'NATIVE_{name}_RENDER_PROOF.json'
 v=add(R/'tests/v2110'/file,label)
 assert v['wikipediaWrites']==v['accountsUsed']==0
performance=add(D/'final_performance/large_performance.json','Medições nas duas versões em cinco artigos grandes',lambda v:len(v['rows']))
sums={version:sum(row['coldMilliseconds'] for row in performance['rows'] if row['version']==version) for version in ['2.10.0','2.11.0']}
change=(sums['2.11.0']/sums['2.10.0']-1)*100
fmt=lambda n:format(n,',').replace(',','.')
summary=f"Os arquivos finais da 2.11.0 passaram por {fmt(main['cases'])} casos e {fmt(main['checks'])} verificações na rodada principal. A matriz de artigos complexos acrescentou {complex_cases} casos em 16 artigos de pelo menos 100 KB. Outra rodada conferiu {corpus['articleCount']} artigos grandes nas duas distribuições. Chrome, Firefox e Safari passaram por {native['cases']} fluxos locais, com {fmt(native['checks'])} verificações. As respostas nativas guardadas foram conferidas novamente com os arquivos desta versão. Os casos novos cobrem portais, edição menor e a contagem por ocorrência, incluindo escolhas da comparação e controles de falsos positivos. As rodadas finais não tiveram falhas. Os resultados e os hashes ficam em tests/evidence/2.11.0. Nenhum teste editou a Wikipédia."
summary+=f" Na medição em cinco artigos grandes, a primeira análise somada teve variação de {change:+.1f}% em relação à 2.10. Esse ensaio local não comprova um ganho geral de velocidade.".replace(f'{change:+.1f}',f'{change:+.1f}'.replace('.',','))
qa={'version':'2.11.0','status':'passed','frozenFiles':m['files'],'releaseManifestSha256':pin,'groups':groups,'sourceReports':reports,'totalCases':sum(g['cases'] for g in groups),'totalChecks':sum(g['checks'] for g in groups),'portugueseSummary':summary,'wikipediaWrites':0}
(D/'RELEASE_QA_SUMMARY.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n');print(json.dumps(qa,ensure_ascii=False,indent=2))
