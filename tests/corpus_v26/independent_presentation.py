"""Finite, context-aware canonical forms for equivalent image/note presentation.

This module never imports RevisaWiki. It does not canonicalize ordinary prose,
unknown arguments, different file names, captions, dimensions or note content.
"""
import re
from independent_wikitext import literal_mask,protected_mask
IMAGE_FLAGS={'thumb':'miniaturadaimagem','thumbnail':'miniaturadaimagem','miniatura':'miniaturadaimagem','miniaturadaimagem':'miniaturadaimagem','center':'centro','centre':'centro','centro':'centro','left':'esquerda','esquerda':'esquerda','right':'direita','direita':'direita','border':'borda','borda':'borda','frameless':'semmoldura','semmoldura':'semmoldura','frame':'moldura','framed':'moldura','moldura':'moldura'}
IMAGE_KEYS={'link':'ligação','ligação':'ligação','ligacao':'ligação'}
def top_parts(value):
 mask=protected_mask(value)
 at=0;out=[]
 for m in re.finditer(r'\|',mask):out.append(value[at:m.start()]);at=m.end()
 return out+[value[at:]]
def image_form(raw):
 if not re.match(r'^\[\[\s*(?:Ficheiro|Arquivo|Imagem|File|Image):',raw,re.I):return raw
 parts=top_parts(raw[2:-2]);parts[0]=re.sub(r'^\s*(?:Ficheiro|Arquivo|Imagem|File|Image):','Imagem:',parts[0],flags=re.I)
 for i in range(1,len(parts)):
  p=parts[i];trimmed=p.strip();equal=protected_mask(p).find('=')
  if trimmed.lower() in IMAGE_FLAGS:
   parts[i]=p[:len(p)-len(p.lstrip())]+IMAGE_FLAGS[trimmed.lower()]+p[len(p.rstrip()):]
  elif equal>=0:
   key=p[:equal].strip().lower()
   if key in IMAGE_KEYS:parts[i]=p[:equal].replace(p[:equal].strip(),IMAGE_KEYS[key])+p[equal:]
 return '[['+'|'.join(parts)+']]'
def canonical_images(value):
 # Process innermost complete literal links; protected examples stay literal.
 for _ in range(3):
  view=literal_mask(value);stack=[];edits=[];i=0
  while i<len(view):
   if view.startswith('[[',i):stack.append(i);i+=2;continue
   if view.startswith(']]',i) and stack:
    start=stack.pop();end=i+2;raw=value[start:end];form=image_form(raw)
    if form!=raw:edits.append((start,end,form))
    i=end;continue
   i+=1
  if not edits:return value
  chosen=[]
  for start,end,form in sorted(edits,key=lambda x:(x[0],-x[1])):
   if not any(a<=start and end<=b for a,b,_ in chosen):chosen.append((start,end,form))
  for start,end,form in reversed(chosen):value=value[:start]+form+value[end:]
 return value

def canonical_alpha_notes(value):
 # Only efn and Nre share the proven default lower-alpha group. Refn is never conflated with them.
 view=literal_mask(value);stack=[];edits=[];i=0
 while i<len(view):
  if view.startswith('{{',i):stack.append(i);i+=2;continue
  if view.startswith('}}',i) and stack:
   start=stack.pop();end=i+2;raw=value[start:end];parts=top_parts(raw[2:-2]);name=parts[0].strip().lower()
   if name in ['nre','efn']:
    parts[0]='NOTE'
    for n in range(1,len(parts)):
     part=parts[n];equal=protected_mask(part).find('=')
     if equal>=0 and part[:equal].strip().lower() in ['name','nome']:
      aliases={'name':'nome','nome':'nome'};key=part[:equal].strip();parts[n]=part[:equal].replace(key,aliases[key.lower()])+part[equal:]
    edits.append((start,end,'{{'+'|'.join(parts)+'}}'))
   i=end;continue
  i+=1
 for start,end,form in reversed(edits):value=value[:start]+form+value[end:]
 return value
