from pathlib import Path
import hashlib,json,re,sys
HERE=Path(__file__).resolve()
PORTABLE=HERE.parent.parent.name=='src'
ROOT=HERE.parents[2] if PORTABLE else HERE.parents[3]
O=ROOT/'docs/2.5.0' if PORTABLE else ROOT/'outputs/revisawiki_v2_5'
JS=ROOT/'dist/2.5.0' if PORTABLE else O
D=ROOT/'artifacts/documentation' if PORTABLE else HERE.parent
D.mkdir(parents=True,exist_ok=True)
manual=(O/'Documentacao_RevisaWiki_v2_5.wiki').read_text()
tech=(O/'Referencia_tecnica_RevisaWiki_v2_5.txt').read_text()
checks=[]
def check(name,condition,detail=None):
    checks.append({'name':name,'passed':bool(condition),'detail':detail})
check('single history section',manual.count('== Histórico das versões ==')==1)
history=manual.split('== Histórico das versões ==',1)[1].split('== Testes e detalhes técnicos ==',1)[0]
versions=re.findall(r'^=== (\d+\.\d+\.\d+) ===$',history,re.M)
check('all 21 versions preserved',len(versions)==21 and len(set(versions))==21,versions)
check('newest first',versions==sorted(versions,key=lambda v:tuple(map(int,v.split('.'))),reverse=True))
check('history uses bullets',all(re.search(r'^\* ',part,re.M) for part in re.split(r'^=== \d+\.\d+\.\d+ ===$',history,flags=re.M)[1:]))
check('no legacy test headings',not re.search(r'^=+ (?:Testes anteriores|Atualização 2\.2\.1)',manual,re.M))
check('nothing appended after credits except credits',len(re.findall(r'^== ',manual.split('== Créditos e licença ==',1)[1],re.M))==0)
check('one normal reference collector',manual.count('{{Referências}}')==2,'One literal code example and one active collector.')
# The first occurrence is protected in code/nowiki, and only the last is rendered.
protected=re.sub(r'<(?:syntaxhighlight|nowiki)\b[^>]*>.*?</(?:syntaxhighlight|nowiki)>','',manual,flags=re.S|re.I)
check('one rendered reference collector',protected.count('{{Referências}}')==1)
check('balanced reference tags',len(re.findall(r'<ref(?:\s[^>]*)?>',manual))==manual.count('</ref>'))
check('balanced syntax blocks',manual.count('<syntaxhighlight ')==manual.count('</syntaxhighlight>'))
check('no extra blank lines','\n\n\n' not in manual)
check('straight typographic punctuation only',not any(x in manual for x in ['“','”','‘','’','—']))
check('github linked', 'https://github.com/danrego/RevisaWiki' in manual)
check('technical reference linked','docs/2.5.0/Referencia_tecnica_RevisaWiki_v2_5.txt' in manual)
check('new rules covered',all(x in manual for x in ['Título repetido antes da introdução','Chamadas e listas de referências repetidas','Citações com os mesmos campos em outra ordem','Atributos e fechamentos']))
check('infobox alignment limits explained',all(x in manual for x in ['antes dos sinais de igual','valores distribuídos em mais de uma linha']) and all(x in tech for x in ['22 caracteres','48','pontos de código Unicode']))
check('separate discussion action explained',all(x in manual for x in ['Preparar discussão','Aplicar ao editor','Um resumo já escrito permanece igual.']))
check('discussion examples protected', '<nowiki>{{PD}}{{Marca de projeto}}</nowiki>' in manual and '<nowiki>{{PD}}</nowiki>' in manual)
check('old technical guard identifiers covered',all(x in tech for x in ['syntaxTemplateClosers','syntaxTagTypos','syntaxReferenceClosers','syntaxNamedRefReuse','syntaxFormattingClosers','syntaxTableClosers','verifiedParameterTypos','preservedUnresolvedTail']))
published_files=list(O.iterdir())+(list(JS.iterdir()) if JS!=O else [])
for path in published_files:
    if path.suffix not in ['.wiki','.txt','.js']:continue
    value=path.read_text()
    separator=re.escape(chr(47))
    home_path=separator+r'(?:Users|home)'+separator
    temp_path=separator+'private'+separator+r'(?:tmp|var)'+separator
    windows_home=r'[A-Z]:'+re.escape(chr(92))+r'Users'+re.escape(chr(92))
    check('no local path '+path.name,not re.search('(?:'+home_path+'|'+temp_path+'|'+windows_home+')',value))
    if path.suffix in ['.wiki','.txt'] or path.name.startswith('Carregador_'):
        check('no direct personal contact link in documentation '+path.name,not re.search(r'(?:https?://(?:www\.)?linkedin\.com/(?:in|pub)/|mailto:|tel:)',value,re.I))
    check('no article slang '+path.name,not re.search(r'cauda literal|cauda incompleta|pivotal|robust[oa]|vale ressaltar|em suma|ressaltar a importância|fomentar|alavancar',value,re.I))
community=(JS/'Carregador_comunitario_RevisaWiki_v2_5.js').read_text().rstrip()
check('embedded loader equals exact packaged loader',community in manual)
final='--final' in sys.argv
if final:
    check('no pending test marker in final text',all('TEST_RESULTS_PENDING' not in p.read_text() for p in O.iterdir() if p.suffix in ['.wiki','.txt']))
else:
    check('draft test marker preserved until final tests','TEST_RESULTS_PENDING' in manual)
report={'version':'2.5.0','stage':'final_documentation_static_audit' if final else 'draft_pending_final_result_and_engine_alignment','checks':len(checks),'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'files':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in published_files if p.suffix in ['.wiki','.txt','.js']},'tests':checks}
(D/('documentation_final_audit.json' if final else 'documentation_draft_audit.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checks':report['checks'],'failed':report['failed'],'failures':[c for c in checks if not c['passed']]},ensure_ascii=False))
raise SystemExit(report['failed']>0)
