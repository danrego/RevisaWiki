#!/usr/bin/env python3
"""Check an explicit publication tree without printing matched private values.

Default scope is git ls-files. --allowlist accepts a JSON list of relative paths
or an object with a files list/dictionary. Archives are inspected recursively.
Private additional literals can be supplied in a local JSON file with --denylist;
that file must stay outside the publication tree.
"""
import argparse, collections, gzip, hashlib, io, json, pathlib, re, subprocess, sys, zipfile

MAX_MEMBER=128*1024*1024
MAX_TOTAL=768*1024*1024
MAX_DEPTH=4
RULES={
 'private-home-path':re.compile(r'/(?:Users|home)/[^/\s"<>]+/|[A-Z]:[\\/]Users[\\/][^\\/\s"<>]+[\\/]',re.I),
 'private-workspace-id':re.compile(r'g-p-[a-f0-9]{20,}',re.I),
 'private-temporary-path':re.compile(r'/(?:private/)?var/folders/[A-Za-z0-9_/-]{8,}'),
 'local-file-url':re.compile(r'file:'+r'//[^\s"<>]+',re.I),
 'embedded-image':re.compile(r'data:image/[^;,]+;base64,[A-Za-z0-9+/=]{100,}',re.I),
 'github-private-image-link':re.compile(r'https?://(?:user-images\.githubusercontent\.com|private-user-images\.githubusercontent\.com|github\.com/user-attachments)/[^\s"<>]+',re.I),
 'secret-token':re.compile(r'(?:github_pat_[A-Za-z0-9_]{15,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|central'+r'authLoginToken=|Bearer\s+[A-Za-z0-9._-]{20,})'),
}
URL=re.compile(r'https?://[^\s"<>]+',re.I)
EMAIL=re.compile(r'\b[A-Za-z0-9.!#$%&*+/?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{2,59})(?![A-Za-z0-9-])')
# Exact reviewed public vendor bytes, with the same two original credit emails.
APPROVED_PUBLIC_CREDIT_FILES={
 'c28d1b9e6e83901da233beffb0524866165746e46c050a53467a40ae2fd13a6a':{
  '5803a8c7911909ffb80f687f0046a1cd22b007c3343a4414204f0cdea9fefee3',
  'a18c5e9bd1772123cb476f8c538c13c34e015a6ae730f7567fd569e8eb200ae3',
 }
}
# Reviewed public identifiers occur in immutable bibliographic source fields.
# Approval binds both the complete immutable article bytes and the exact token.
# A modified article or another email-like identifier still requires review.
APPROVED_PUBLIC_CITATION_IDENTIFIERS={
 '31ce4a8f12b22feb936ac0e64a3acc46a02026ddc53e5486cb97b0a60c07ba60':{
  'e286e60a87f20a0f6bd9988b63b612465b9b8c4230f97cb312e46c2b11b51001'
 },
 '8cac0ca1f3765a0e8153dc15da381cf08abe4844b59d9a4c06df4ba3847b0601':{
  'c761634a595538dc63bade052d18e2eeb123a13492be4fad238adceda66bb4ca'
 }
}
# Three declarations in immutable public site CSS contain a namespace-like tail.
# Bind the complete stylesheet and each declaration, not arbitrary CSS or names.
APPROVED_PUBLIC_CSS_PROPERTIES={
 'd1ec81ce22ecbfd63a3c8f85d8dba22553faf7a3227dcc9cc4b66901bd4917fb':{
  '748b28f0fa7be1410947496ce1c8527c76ae1a22ab298388ec0f986d4c880d33',
  '459e9e5d86a5befe4f08b087168f3901c418a993096b001dde6ddf6663ecca9b',
  '49e61808257d9d856d5cbec3c7714a4c40b3ec4721da689dfc9a1c512f6228e3'
 }
}
# Exact fictional URL-userinfo fixtures exercise URL grammar without real accounts.
# Only reviewed complete source files and exact reserved-domain URLs qualify.
# Reserved documentation/test domains: https://www.rfc-editor.org/rfc/rfc2606.html
APPROVED_SYNTHETIC_URL_FIXTURES={
 '82bf0d011eeb3ed6de32526d3506a6b91bd2a1ddea460cad63622809a5b39908':{'a34610cafad11b3e4554e3093b3acb94c1764c8e77b5ca27deddc5dd59605362'},
 '5b18d685c06a5bbcd2f3e3c07188bdd7ab5194ed891b5b40d4dd435ecb946894':{'88ea6f85d62ab24778c7ef01b8859a64270ab74f74dd49933de1261f850ce07c'},
 'ea4dbbedfc166655bb5cfe6865371afc9d1c251b4050e520f1674b055e0002cb':{'da2dcf3acd0c4547e70094e71d173ecea4fa55e11f92964341b79d76094f2051'},
 '0343f9f07debc32a87954a2cf59a3adae3ba18f577891af13a8825bdd86fb709':{'a692a7ec69ebe3d4ec689358982cfcb744e5c4aca3a51eaecbe735ae2fb1cdbf'},
}
APPROVED_SYNTHETIC_WIKI_NAMESPACE_FIXTURES={
 '1c1f745f2e8adc81df35fd9cf9fd4f339fa2be998f0fbe027049af9f5f636502':{'8d23e4f465673ff8a69aad160a76a5cffc13b3ce9dc5a5f50e1e565ba54f897f','d5b366ddea4e0ad2b4e278cff09240d55fbeef61406d790d923e6091a9d6a14e'}
}
PUBLIC_NOREPLY='revisawiki@reserved.invalid'
IMAGE_MAGIC=(b'\x89PNG',b'\xff\xd8',b'GIF8',b'RIFF',b'BM',b'%PDF')
IMAGE_SUFFIXES={'.png','.jpg','.jpeg','.gif','.webp','.tif','.tiff','.bmp','.heic','.pdf','.svg'}


# Privacy adaptation: only technical distribution destinations retain account names.
TECHNICAL_SCRIPT_TITLE='User:Daniel G Rego/RevisaWiki.js'
def identity_findings(text,reviewed_css=frozenset()):
 from urllib.parse import unquote
 decoded=unquote(text).replace('+',' ')
 owner=TECHNICAL_SCRIPT_TITLE.split(':',1)[1].split('/',1)[0]
 owner_pattern=r'[ _]+'.join(re.escape(part)for part in owner.split())
 technical=re.compile(r'(?:User|Usuário|Usuária):'+owner_pattern+'/(?:RevisaWiki(?:\\.js|/(?:Dados|Carregador)\\.js)?|common\\.js)(?=$|[\\s\\]\\[<>"\\\'`|}?&#,]|\\.(?=\\s|$))',re.I)
 masked=technical.sub(lambda m:' '*len(m.group()),decoded)
 css_property=re.compile(r'--image-size-'+r'user'+r':var\(--image-size-(?:standard|small|large)\)(?=[;}])')
 masked=css_property.sub(lambda m:' '*len(m.group())if hashlib.sha256(m.group().encode()).hexdigest()in reviewed_css else m.group(),masked)
 destination=re.compile('(?<![A-Za-z0-9_])(?:User|User[ _]talk|Usuário(?:[ _]Discussão)?|Usuária|Utilizador(?:a)?|Utilisateur(?:rice)?|Benutzer|Utente|Usuario):[^\\s\\]\\[<>|"\\\'`}{][^\\n\\]\\[<>|"\\\'`}{]{0,159}',re.I)
 fictional=re.compile(r'^(?:Teste|Test|Example|Exemplo|Fulano|Beltrano|Sicrano|Editor de teste|Conta de Teste|Nome da Conta|Anônimo|Colaborador)(?:[/ _]|$)',re.I)
 result=[]
 matches=[m for m in destination.finditer(masked)if not fictional.match(m.group().split(':',1)[1])]
 if matches:result.append(('unreviewed-wiki-user-destination',len(matches),masked[:matches[0].start()].count('\n')+1))
 matches=list(re.finditer(owner_pattern,masked,re.I))
 if matches:result.append(('nontechnical-owner-identity',len(matches),masked[:matches[0].start()].count('\n')+1))
 return result

def reviewed_fixture_view(text,content_hash):
 approved=APPROVED_SYNTHETIC_URL_FIXTURES.get(content_hash,frozenset())
 namespaces=APPROVED_SYNTHETIC_WIKI_NAMESPACE_FIXTURES.get(content_hash,frozenset())
 if not approved and not namespaces:return text
 pattern=re.compile(r"https?://[^\s\"'<>]+",re.I)
 text=pattern.sub(lambda match:' '*len(match.group()) if hashlib.sha256(match.group().encode()).hexdigest() in approved else match.group(),text)
 # These literal namespace lookalikes are not real-account evidence. Retain
 # the exact template-title fixture, including its ambiguous native basename.
 pattern=re.compile(r"(?:Usuário|User):[^\s\]\[<>|\"'`}{]+")
 return pattern.sub(lambda match:' '*len(match.group()) if hashlib.sha256(match.group().encode()).hexdigest() in namespaces else match.group(),text)

def safe_relative(value):
 p=pathlib.PurePosixPath(value)
 return bool(value) and not p.is_absolute() and '..' not in p.parts and '\\' not in value and '\0' not in value

def load_allowlist(path):
 x=json.loads(path.read_text())
 if isinstance(x,dict):x=x.get('files',x.get('paths',[]))
 if isinstance(x,dict):return list(x)
 if isinstance(x,list):return [v if isinstance(v,str)else v['path']for v in x]
 raise ValueError('Unsupported allowlist schema')

class Scanner:
 def __init__(self,denylist):self.findings=[];self.files=0;self.archives=0;self.total=0;self.denied=denylist
 def fail(self,path,rule,count=1,line=None):
  value={'file':path if safe_relative(path.split('!/',1)[0])else '[unsafe-entry-name]','rule':rule,'matches':count}
  if line is not None:value['line']=line
  self.findings.append(value)
 def scan(self,path,data,depth=0):
  self.files+=1;self.total+=len(data)
  if len(data)>MAX_MEMBER or self.total>MAX_TOTAL or depth>MAX_DEPTH:self.fail(path,'archive-or-file-size-limit');return
  if pathlib.PurePosixPath(path).suffix.lower()in IMAGE_SUFFIXES or data.startswith(IMAGE_MAGIC):self.fail(path,'image-or-screenshot-file');return
  if data.startswith(b'\x1f\x8b'):
   self.archives+=1
   try:
    with gzip.GzipFile(fileobj=io.BytesIO(data))as h:plain=h.read(MAX_MEMBER+1)
   except Exception:self.fail(path,'unreadable-gzip');return
   self.scan(path+'!/content',plain,depth+1);return
  if data.startswith(b'PK\x03\x04'):
   self.archives+=1
   try:
    with zipfile.ZipFile(io.BytesIO(data))as z:
     for info in z.infolist():
      if info.is_dir():continue
      if not safe_relative(info.filename):self.fail(path,'unsafe-archive-member-name');continue
      if info.file_size>MAX_MEMBER or info.flag_bits&1:self.fail(path,'unsupported-archive-member');continue
      with z.open(info)as h:plain=h.read(MAX_MEMBER+1)
      self.scan(path+'!/'+info.filename,plain,depth+1)
   except Exception:self.fail(path,'unreadable-zip')
   return
  try:text=data.decode('utf-8')
  except UnicodeDecodeError:self.fail(path,'unreviewed-binary-file');return
  content_hash=hashlib.sha256(data).hexdigest()
  identity_view=reviewed_fixture_view(text,content_hash)
  for rule,count,line in identity_findings(identity_view,APPROVED_PUBLIC_CSS_PROPERTIES.get(content_hash,set())):self.fail(path,rule,count,line)
  # Imported citation URLs can legitimately contain home-directory-like paths.
  non_url=URL.sub(lambda m:' '*len(m[0]),text)
  for name,rx in RULES.items():
   subject=non_url if name in {'private-home-path','private-workspace-id','private-temporary-path'}else text
   matches=list(rx.finditer(subject))
   if matches:self.fail(path,name,len(matches),subject[:matches[0].start()].count('\n')+1)
  for literal in self.denied:
   if literal and literal in text:self.fail(path,'private-local-denylist',text.count(literal))
  reviewed_emails=APPROVED_PUBLIC_CREDIT_FILES.get(content_hash,set())|APPROVED_PUBLIC_CITATION_IDENTIFIERS.get(content_hash,set())
  for m in EMAIL.finditer(identity_view):
   value=m[0]
   if value==PUBLIC_NOREPLY:continue
   digest=hashlib.sha256(value.encode()).hexdigest()
   if digest in reviewed_emails:continue
   self.fail(path,'unreviewed-email',1,text[:m.start()].count('\n')+1)


def run(argv=None):
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--root',type=pathlib.Path,default=pathlib.Path('.'))
 ap.add_argument('--allowlist',type=pathlib.Path)
 ap.add_argument('--denylist',type=pathlib.Path)
 ap.add_argument('--report',type=pathlib.Path)
 args=ap.parse_args(argv);root=args.root.resolve()
 paths=load_allowlist(args.allowlist)if args.allowlist else subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')[:-1]
 denied=json.loads(args.denylist.read_text())if args.denylist else []
 if not isinstance(denied,list)or not all(isinstance(x,str)for x in denied):raise ValueError('The private denylist must contain only strings')
 scan=Scanner(denied)
 for name in paths:
  if not safe_relative(name):scan.fail('[unsafe-entry-name]','unsafe-publication-path');continue
  p=root/name
  if p.is_symlink():scan.fail(name,'unreviewed-symlink');continue
  if not p.is_file():scan.fail(name,'missing-publication-file');continue
  scan.scan(name,p.read_bytes())
 result={'status':'passed'if not scan.findings else'failed','allowlistedFiles':len(paths),'inspectedMembers':scan.files,'archivesInspected':scan.archives,'inspectedBytes':scan.total,'findingCount':len(scan.findings),'findings':scan.findings,'matchedPrivateValuesIncluded':False,'networkRequests':0,'wikipediaWrites':0}
 if args.report:args.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(result,ensure_ascii=False,indent=2))
 return 1 if scan.findings else 0
if __name__=='__main__':
 try:exit_code=run()
 except Exception as error:
  print(json.dumps({'status':'failed','errorType':type(error).__name__,'matchedPrivateValuesIncluded':False,'networkRequests':0}))
  exit_code=2
 sys.exit(exit_code)
