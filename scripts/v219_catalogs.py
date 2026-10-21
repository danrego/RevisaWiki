"""Apply the reviewed native implementation deltas to all catalogue encodings."""
import copy,hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REVIEW=json.loads((ROOT/'tests/v219/catalog_revision_review.json').read_text())
DELTAS={row['oldid']:row for row in REVIEW['rows']}
def canonical(value):
 return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def provenance(value):
 if isinstance(value,list):return [provenance(item) for item in value]
 if not isinstance(value,dict):return value
 result={key:provenance(item) for key,item in value.items()}
 pin=result.get('oldid')
 if pin in DELTAS:
  delta=DELTAS[pin];result.update(oldid=delta['currentOldid'],timestamp=delta['timestamp'],source=delta['source'])
 return result

def native_profile(profile,previous):
 if previous==48888107:
  profile['accepted']=[key for key in profile['accepted'] if key!='valign']
  profile['dependencies']=[{'title':'Predefinição:Imagem múltipla','oldid':60788538,'timestamp':'2021-03-31T00:11:09Z','source':'https://pt.wikipedia.org/w/index.php?oldid=60788538'}]
 if previous==63874082:
  profile['accepted']=sorted(set('cód_OKATO' if key=='cód_OKATU' else key for key in profile['accepted']))
  profile['renames']['cód_OKATU']='cód_OKATO'
 if previous==72473923:profile['accepted']=sorted(set(profile['accepted']+['grupo']))
 return profile

def json_catalog(value):
 result=provenance(value)
 # Keep the native implementation/portal pins, not the biography that once
 # prompted the research or the unpublished draft used during that work.
 additions=result.get('releaseAdditions')
 if isinstance(additions,dict):
  for key in ('sourceArticle','derivedFixture','currentSourceExpectedAppend'):
   additions.pop(key,None)
 for family in ['infoboxes','templates']:
  for key,profile in result.get(family,{}).items():
   native_profile(profile,value[family][key].get('oldid'))
   # The previous public JSON accidentally anonymized a technical role name.
   # Native CS1 Configuração 73016847 maps editor to editor-sobrenome.
   if profile.get('aliases',{}).get('editor')=='colaborador anônimo':
    assert family=='templates' and key in ['citar livro','citar web','citar enciclopédia','citar jornal','citar conferência','citar notícia']
    profile['aliases']['editor']='editor-sobrenome'
 return result

def packed_data(text):
 begin=text.index('const data=')+len('const data=');decoder=json.JSONDecoder();value,length=decoder.raw_decode(text[begin:])
 data=copy.deepcopy(value);pt=data['packed']['ptwiki']
 def string(index):
  value=pt['s'][index]
  return value if isinstance(value,str) else string(value[0]).replace('#',str(value[1]),1)
 def add_string(value):
  try:return pt['s'].index(value)
  except ValueError:pt['s'].append(value);return len(pt['s'])-1
 def add_list(value):
  try:return pt['l'].index(value)
  except ValueError:pt['l'].append(value);return len(pt['l'])-1
 for family in ['b','t']:
  for row in pt[family]:
   previous=row[2]
   if previous not in DELTAS:continue
   delta=DELTAS[previous];row[2]=delta['currentOldid'];row[3]=add_string(delta['timestamp'])
   accepted=[string(index) for index in pt['l'][row[4]]]
   if previous==48888107:
    accepted=[key for key in accepted if key!='valign']
    pt['d'].append([add_string('Predefinição:Imagem múltipla'),60788538,add_string('2021-03-31T00:11:09Z')]);row[10]=add_list([len(pt['d'])-1])
   if previous==63874082:
    accepted=sorted(set('cód_OKATO' if key=='cód_OKATU' else key for key in accepted))
    pt['m'].append(pt['m'][row[7]]+[[add_string('cód_OKATU'),add_string('cód_OKATO')]]);row[7]=len(pt['m'])-1
   if previous==72473923:accepted=sorted(set(accepted+['grupo']))
   row[4]=add_list([add_string(key) for key in accepted])
 for row in pt['d']:
  if row[1] in DELTAS:
   delta=DELTAS[row[1]];row[1]=delta['currentOldid'];row[2]=add_string(delta['timestamp'])
 # Translation interning stores source metadata as shared literal records.
 # These reviewed deltas do not change any existing foreign field contract.
 trans=data['packed']['translations']
 def translation_literal(index):
  record=trans['records'][index]
  return record[1] if record[0] in [0,3] else None
 def add_translation_literal(value):
  for index,record in enumerate(trans['records']):
   if record[0] in [0,3] and type(record[1]) is type(value) and record[1]==value:return index
  trans['records'].append([0,value]);return len(trans['records'])-1
 for record in list(trans['records']):
  if record[0]!=1:continue
  pairs=record[1];fields={translation_literal(pairs[i]):i+1 for i in range(0,len(pairs),2)}
  if 'oldid' not in fields:continue
  old=translation_literal(pairs[fields['oldid']])
  if old not in DELTAS:continue
  delta=DELTAS[old];pairs[fields['oldid']]=add_translation_literal(delta['currentOldid'])
  if 'timestamp' in fields:pairs[fields['timestamp']]=add_translation_literal(delta['timestamp'])
 for record in trans['records']:
  if record[0] not in [0,3]:continue
  if isinstance(record[1],str):
   for old,delta in DELTAS.items():
    record[1]=re.sub(r'(?<=oldid=)'+str(old)+r'\b',str(delta['currentOldid']),record[1])
 data['version']='2.19.0'
 return value,data,begin,length

def apply_packed(text,original,updated):
 for key,pattern in [('ptwiki',r'(?m)^(    const PACKED_PTWIKI_CATALOG = )(.*)(;)$'),('translations',r'(?m)^(    const TRANSLATION_RULES = unpackTranslationData\()(.*)(\);)$')]:
  match=re.search(pattern,text)
  if not match or match[2].startswith('root.'):continue
  old=json.loads(match[2]);assert old==original['packed'][key],'Embedded catalogue differs from pinned data'
  encoded=json.dumps(updated['packed'][key],ensure_ascii=False,separators=(',',':'))
  text=text[:match.start(2)]+encoded+text[match.end(2):]
 return text
