#!/usr/bin/env python3
"""Independent source conservation checks, without importing RevisaWiki.

Keeps distinct image/category/link destinations, reference URLs and protected
math/code literal blocks. Duplicates may be deduplicated, but a last unique
object cannot disappear. Seven link-name migrations and one obsolete category
are the only explicit destination equivalences admitted. Two exact input/output
hash pairs also admit independently proved duplicate-URL/ISBN-prefix repairs.
"""
import argparse, collections, hashlib, html, json, pathlib, re
from independent_wikitext import targets,literal_mask,normalize_target
ROOT=pathlib.Path(__file__).resolve().parents[2];HERE=pathlib.Path(__file__).resolve().parent
ALIASES={'Al-Kindi':'Alquindi','Ibn Muqla':'Ibne Mucla','Ibn al-Bawwab':'Ibne Albauabe','Vitruvius':'Vitrúvio','Avicenna':'Avicena','Nimrud':'Ninrude','Lente de Nimrud':'Lente de Ninrude'}
OBSOLETE={'!Artigos com descrição curta'}
LITERAL=re.compile(r'<(nowiki|pre|syntaxhighlight|source|code|math|chem|score|timeline|graph|templatedata|hiero)\b(?![^>]*?/\s*>)[^>]*>[\s\S]*?</\1\s*>',re.I)
URL=re.compile(r'(?:https?://|//)[^\s<>\]{}|"\']+')
def dests(text):
 links,images,cats=targets(text)
 for old,new in ALIASES.items():
  if old in links:links[new]+=links.pop(old)
 # A retained main-article call is itself a destination even if its single
 # redundant heading wikilink was changed to plain visible text.
 for match in re.finditer(r'\{\{\s*(?:[Aa]rtigo principal|[Vv]er também|[Vv]eja também)\s*\|([^{}]+)\}\}',literal_mask(text)):
  for part in match[1].split('|'):
   part=re.sub(r'^\s*\d+\s*=','',part).strip()
   if part and '=' not in part:links[normalize_target(part)]+=1
 return set(links),set(images),set(cats)-OBSOLETE
def urls(text):
 # Wikipedia URL-to-wikilink adaptation retains the destination through the
 # link check. Other source/reference addresses must retain their exact text.
 return {u for u in URL.findall(text) if not re.match(r'^(?:https?:)?//(?:[a-z-]+\.)?(?:wikipedia\.org|pt\.m\.wikipedia\.org)/wiki/',u,re.I)}

def publication_ids(text):
    out=set()
    # Scalar citation identifiers and ISBN wrappers, independent of RevisaWiki's
    # citation parser. Unsafe/dynamic values are left to the existing parser.
    for match in re.finditer(r'\|\s*(doi|isbn|issn|pmid|pmc)\s*=\s*([^|{}\n]+)',text,re.I):
        key=match[1].lower();value=html.unescape(match[2].strip()).replace(' ','')
        if key in ('isbn','issn'):value=value.replace('-','')
        if value:out.add(key+'='+value)
    for match in re.finditer(r'\{\{\s*[Ii][Ss][Bb][Nn]\s*\|\s*([\dXx -]+)\s*\}\}',text):out.add('isbn='+re.sub(r'[ -]','',match[1]).upper())
    return out

def main():
 p=argparse.ArgumentParser();p.add_argument('run');p.add_argument('--available-only',action='store_true');a=p.parse_args();base=HERE/a.run
 inputs=[]
 for name,directory in [('new',ROOT/'tests/corpus/inputs/new'),('old',ROOT/'tests/corpus/inputs/old')]:inputs += [(name,directory,x) for x in json.loads((directory/'manifest.json').read_text())]
 rows=[];checks=0
 for corpus,directory,item in inputs:
  candidates=[HERE/(a.run+'_part'+str(i))/'core_transformed'/corpus/(str(item['revid'])+'.wiki')for i in range(12)];existing=[x for x in candidates if x.exists()]
  if not existing:
   if a.available_only:continue
   raise RuntimeError('Transformed source missing: '+item['title'])
  if len(existing)!=1:raise RuntimeError('Duplicate transformed source: '+item['title'])
  before=(directory/item['file']).read_text();after=existing[0].read_text();qualified_equivalences=[];assert hashlib.sha256(before.encode()).hexdigest()==item['sha256']
  bl,bi,bc=dests(before);al,ai,ac=dests(after);lb=LITERAL.findall(before);la=LITERAL.findall(after)
  # Compare full matched literal blocks, not only the captured element name.
  full=lambda text:[m[0]for m in LITERAL.finditer(text)]
  math=lambda text:[m[0]for m in re.finditer(r'<math\b(?![^>]*?/\s*>)[^>]*>[\s\S]*?</math\s*>',text,re.I)]
  before_urls=urls(before);after_urls=urls(after);before_ids=publication_ids(before);after_ids=publication_ids(after)
  if item['revid'] in [73026558,73117564]:
   slug='botafogo' if item['revid']==73026558 else 'revolucao_mexicana';proof_path=HERE/(slug+'_independent_warning_proof.json');proof=json.loads(proof_path.read_text())
   if item['sha256']==proof['inputSha256'] and hashlib.sha256(after.encode()).hexdigest()==proof['outputSha256']:
    if slug=='botafogo':before_urls={proof['correctedURL'] if u==proof['malformedOriginalURL'] else u for u in before_urls}
    else:before_ids={proof['allowedEquivalentIdentifiers'].get(x,x)for x in before_ids}
    qualified_equivalences.append({'proof':str(proof_path.relative_to(ROOT)),'proofSha256':hashlib.sha256(proof_path.read_bytes()).hexdigest(),'scope':proof['qualificationScope']})
  flags={'distinctImagesRetained':bi<=ai,'distinctCategoriesRetained':bc<=ac,'distinctLinksRetained':bl<=al,'sourceURLsRetained':before_urls<=after_urls,'protectedLiteralBlocksExact':full(before)==full(after),'mathBlocksExact':math(before)==math(after),'publicationIdentifiersRetained':before_ids<=after_ids}
  checks+=len(flags);row={'title':item['title'],'revid':item['revid'],'corpus':corpus,'sourceSha256':item['sha256'],'outputSha256':hashlib.sha256(after.encode()).hexdigest(),'sourceBoundEquivalences':qualified_equivalences,'literalSourceURLsRetained':urls(before)<=urls(after),'literalIdentifiersRetained':publication_ids(before)<=publication_ids(after),'passed':all(flags.values()),**flags}
  if not row['passed']:row.update(lostImages=sorted(bi-ai),lostCategories=sorted(bc-ac),lostLinks=sorted(bl-al),lostURLs=sorted(urls(before)-urls(after)),lostPublicationIdentifiers=sorted(publication_ids(before)-publication_ids(after)),literalCounts={'before':len(full(before)),'after':len(full(after))},mathCounts={'before':len(math(before)),'after':len(math(after))})
  rows.append(row)
 summary={'articles':len(rows),'checks':checks,'passed':sum(r['passed']for r in rows),'flagged':sum(not r['passed']for r in rows),'completeCorpus':len(rows)==2000,'implementationImported':False,'independentParser':True,'networkRequests':0,'wikipediaWrites':0,'allowedDestinationEquivalences':ALIASES,'allowedObsoleteCategories':sorted(OBSOLETE)}
 (base/('independent_source_guards'+('_partial' if a.available_only else '')+'.json')).write_text(json.dumps({'summary':summary,'articles':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(summary,ensure_ascii=False),flush=True)
 print(json.dumps([r for r in rows if not r['passed']],ensure_ascii=False)[:12000],flush=True)
if __name__=='__main__':main()
